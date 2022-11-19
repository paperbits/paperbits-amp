import * as Utils from "@paperbits/common/utils";
import parallel from "await-parallel-limit";
import template from "./page.html";
import {
    IPublisher,
    HtmlPage,
    HtmlPagePublisher,
    SitemapBuilder,
    SocialShareDataHtmlPagePublisherPlugin,
    LinkedDataHtmlPagePublisherPlugin,
    OpenGraphHtmlPagePublisherPlugin,
    SearchIndexBuilder,
    HtmlDocumentProvider
} from "@paperbits/common/publishing";
import { maxParallelPublisingTasks } from "@paperbits/common/constants";
import { IBlobStorage, Query } from "@paperbits/common/persistence";
import { IPageService, PageContract } from "@paperbits/common/pages";
import { ISiteService, SiteSettingsContract } from "@paperbits/common/sites";
import { Logger } from "@paperbits/common/logging";
import { IMediaService } from "@paperbits/common/media";
import { StyleManager, StyleCompiler, StyleSheet } from "@paperbits/common/styles";
import { AmpStylesheetPublisherPlugin } from "./ampStylesheetPlugin";
import { AmpAnalyticsHtmlPagePublisherPlugin } from "./ampAnalyticsPlugin";
import { KnockoutHtmlPagePublisherPlugin } from "@paperbits/core/publishing";
import { ContentViewModelBinder } from "@paperbits/core/content/ko";
import { ILayoutService } from "@paperbits/common/layouts";
import { ILocaleService, LocaleModel } from "@paperbits/common/localization";
import { PopupHostViewModelBinder } from "@paperbits/core/popup/ko/popupHostViewModelBinder";


export class AmpPagePublisher implements IPublisher {
    constructor(
        private readonly ampPageService: IPageService,
        private readonly siteService: ISiteService,
        private readonly mediaService: IMediaService,
        private readonly outputBlobStorage: IBlobStorage,
        private readonly htmlPagePublisher: HtmlPagePublisher,
        private readonly styleCompiler: StyleCompiler,
        private readonly logger: Logger,
        private readonly contentViewModelBinder: ContentViewModelBinder,
        private readonly popupHostViewModelBinder: PopupHostViewModelBinder,
        private readonly layoutService: ILayoutService,
        private readonly sitemapBuilder: SitemapBuilder,
        private readonly searchIndexBuilder: SearchIndexBuilder,
        private readonly localeService: ILocaleService,
        private readonly htmlDocumentProvider: HtmlDocumentProvider,
    ) { }

    public async renderPage(page: HtmlPage): Promise<string> {
        this.logger.trackEvent("Publishing", { message: `Publishing page ${page.title}...` });

        try {
            const overridePlugins = [
                new KnockoutHtmlPagePublisherPlugin(this.htmlDocumentProvider, this.contentViewModelBinder, this.layoutService, this.popupHostViewModelBinder),
                new SocialShareDataHtmlPagePublisherPlugin(this.mediaService),
                new LinkedDataHtmlPagePublisherPlugin(this.siteService),
                new OpenGraphHtmlPagePublisherPlugin(this.mediaService),
                new AmpStylesheetPublisherPlugin(),
                new AmpAnalyticsHtmlPagePublisherPlugin(this.siteService)
            ];

            const htmlContent = await this.htmlPagePublisher.renderHtml(page, overridePlugins);
            return htmlContent;
        }
        catch (error) {
            throw new Error(`Unable to render page "${page.title}": ${error.stack || error.message}`);
        }
    }

    private getIndexableContent(html: string): string {
        // const regex = /<main.*>([\s\S]*)<\/main>/g;
        // const match = regex.exec(html);

        // if (!match || match.length < 1) {
        //     return null;
        // }

        // const mainContent = match[1];
        // return mainContent;

        return html;
    }

    private async renderAndUpload(settings: SiteSettingsContract, page: PageContract, globalStyleSheet: StyleSheet, locale?: LocaleModel): Promise<void> {
        if (!page.permalink) {
            this.logger.trackEvent("Publishing", { message: `Skipping page with no permalink specified: "${page.title}".` });
            return;
        }

        try {
            const siteAuthor = settings?.author;
            const siteTitle = settings?.title;
            const siteDescription = settings?.description;
            const siteKeywords = settings?.keywords;
            const siteHostname = settings?.hostname;
            const faviconSourceKey = settings?.faviconSourceKey;
            const localePrefix = locale ? `/${locale.code}` : "";
            const pagePermalink = `${localePrefix}${page.permalink}`;
            const pageContent = await this.ampPageService.getPageContent(page.key, locale?.code);
            const pageUrl = siteHostname
                ? `https://${settings?.hostname}${pagePermalink}`
                : pagePermalink;

            const styleManager = new StyleManager();
            styleManager.setStyleSheet(globalStyleSheet);

            const htmlPage: HtmlPage = {
                title: [page.title, siteTitle].join(" - "),
                description: page.description || siteDescription,
                keywords: page.keywords || siteKeywords,
                permalink: pagePermalink,
                url: pageUrl,
                siteHostName: siteHostname,
                locale: locale,
                content: pageContent,
                author: siteAuthor,
                template: template,
                styleReferences: [], // No external CSS allowed in AMP.
                socialShareData: page.socialShareData,
                openGraph: {
                    type: page.permalink === "/" ? "website" : "article",
                    title: page.title || siteTitle,
                    description: page.description || siteDescription,
                    siteName: siteTitle
                },
                bindingContext: {
                    contentItemKey: page.key,
                    styleManager: styleManager,
                    navigationPath: pagePermalink,
                    locale: locale?.code,
                    template: {
                        page: {
                            value: pageContent,
                        }
                    }
                }
            };

            if (page.jsonLd) {
                let structuredData: any;
                try {
                    structuredData = JSON.parse(page.jsonLd);
                    htmlPage.linkedData = structuredData;
                }
                catch (error) {
                    console.log("Unable to parse page linked data.");
                }
            }

            if (faviconSourceKey) {
                try {
                    const media = await this.mediaService.getMediaByKey(faviconSourceKey);

                    if (media) {
                        htmlPage.faviconPermalink = media.permalink;
                    }
                }
                catch (error) {
                    this.logger.trackEvent("Publishing", { message: "Could not retrieve favicon." });
                }
            }

            const htmlContent = await this.renderPage(htmlPage);

            this.sitemapBuilder.appendPermalink(pagePermalink);
            this.searchIndexBuilder.appendHtml(pagePermalink, htmlPage.title, htmlPage.description, this.getIndexableContent(htmlContent));

            let permalink = pagePermalink;

            if (!permalink.endsWith("/")) {
                permalink += "/";
            }

            permalink = `${permalink}index.html`;

            const contentBytes = Utils.stringToUnit8Array(htmlContent);
            await this.outputBlobStorage.uploadBlob(permalink, contentBytes, "text/html");
        }
        catch (error) {
            throw new Error(`Unable to publish AMP page "${page.title}": ${error.stack || error.message}`);
        }
    }

    private async publishNonLocalized(siteSettings: SiteSettingsContract, globalStyleSheet: StyleSheet): Promise<void> {
        const query: Query<PageContract> = Query.from<PageContract>();
        let pagesOfResults = await this.ampPageService.search(query);

        do {
            const tasks = [];
            const pages = pagesOfResults.value;

            for (const page of pages) {
                tasks.push(() => this.renderAndUpload(siteSettings, page, globalStyleSheet));
            }

            await parallel(tasks, 7);

            if (pagesOfResults.takeNext) {
                pagesOfResults = await pagesOfResults.takeNext();
            }
            else {
                pagesOfResults = null;
            }
        }
        while (pagesOfResults);
    }

    private async publishLocalized(locales: LocaleModel[], siteSettings: SiteSettingsContract, globalStyleSheet: StyleSheet): Promise<void> {
        const defaultLocale = await this.localeService.getDefaultLocaleCode();

        for (const locale of locales) {
            const requestedLocale = locale.code === defaultLocale
                ? null
                : locale;

            const query: Query<PageContract> = Query.from<PageContract>();
            let pagesOfResults = await this.ampPageService.search(query, requestedLocale?.code);

            do {
                const tasks = [];
                const pages = pagesOfResults.value;

                for (const page of pages) {
                    tasks.push(() => this.renderAndUpload(siteSettings, page, globalStyleSheet, requestedLocale));
                }

                await parallel(tasks, maxParallelPublisingTasks);

                if (pagesOfResults.takeNext) {
                    pagesOfResults = await pagesOfResults.takeNext();
                }
                else {
                    pagesOfResults = null;
                }
            }
            while (pagesOfResults);
        }
    }

    public async publish(): Promise<void> {
        const locales = await this.localeService.getLocales();
        const localizationEnabled = locales.length > 0;
        const globalStyleSheet = await this.styleCompiler.getStyleSheet();

        try {
            const tasks = [];
            const settings = await this.siteService.getSettings<any>();
            const siteSettings: SiteSettingsContract = settings.site;

            if (localizationEnabled) {
                await this.publishLocalized(locales, siteSettings, globalStyleSheet);
            }
            else {
                await this.publishNonLocalized(siteSettings, globalStyleSheet);
            }

            await parallel(tasks, 7);
        }
        catch (error) {
            throw new Error(`Unable to complete AMP pages publishing. ${error.stack || error.message}`);
        }
    }
}