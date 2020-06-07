import * as Utils from "@paperbits/common/utils";
import template from "./page.html";
import { minify } from "html-minifier-terser";
import {
    IPublisher,
    HtmlPage,
    HtmlPagePublisher,
    SitemapBuilder,
    SocialShareDataHtmlPagePublisherPlugin,
    LinkedDataHtmlPagePublisherPlugin,
    OpenGraphHtmlPagePublisherPlugin,
    SearchIndexBuilder
} from "@paperbits/common/publishing";
import { IBlobStorage } from "@paperbits/common/persistence";
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
import { ILocaleService } from "@paperbits/common/localization";


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
        private readonly layoutService: ILayoutService,
        private readonly sitemapBuilder: SitemapBuilder,
        private readonly searchIndexBuilder: SearchIndexBuilder,
        private readonly localeService: ILocaleService
    ) { }

    public async renderPage(page: HtmlPage): Promise<string> {
        this.logger.traceEvent(`Publishing page ${page.title}...`);

        const overridePlugins = [
            new KnockoutHtmlPagePublisherPlugin(this.contentViewModelBinder, this.layoutService),
            new SocialShareDataHtmlPagePublisherPlugin(this.mediaService),
            new LinkedDataHtmlPagePublisherPlugin(this.siteService),
            new OpenGraphHtmlPagePublisherPlugin(this.mediaService),
            new AmpStylesheetPublisherPlugin(),
            new AmpAnalyticsHtmlPagePublisherPlugin(this.siteService)
        ];

        const htmlContent = await this.htmlPagePublisher.renderHtml(page, overridePlugins);

        return minify(htmlContent, {
            caseSensitive: true,
            collapseBooleanAttributes: true,
            collapseInlineTagWhitespace: false,
            collapseWhitespace: true,
            html5: true,
            minifyCSS: true,
            preserveLineBreaks: false,
            removeComments: true,
            removeEmptyAttributes: true,
            removeOptionalTags: false,
            removeRedundantAttributes: false,
            removeScriptTypeAttributes: false,
            removeStyleLinkTypeAttributes: false,
            removeTagWhitespace: false,
            removeAttributeQuotes: false
        });
    }

    private async renderAndUpload(settings: SiteSettingsContract, page: PageContract, globalStyleSheet: StyleSheet, locale?: string): Promise<void> {
        try {
            const siteAuthor = settings?.author;
            const siteTitle = settings?.title;
            const siteDescription = settings?.description;
            const siteKeywords = settings?.keywords;
            const siteHostname = settings?.hostname;
            const faviconSourceKey = settings?.faviconSourceKey;

            const localePrefix = locale ? `/${locale}` : "";

            const pagePermalink = `${localePrefix}${page.permalink}`;
            const pageContent = await this.ampPageService.getPageContent(page.key, locale);
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
                    locale: locale,
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
                    console.log("Unable to parse page linked data: ", error);
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
                    this.logger.traceError(error, "Could not retrieve favicon.");
                }
            }

            const htmlContent = await this.renderPage(htmlPage);

            this.sitemapBuilder.appendPermalink(pagePermalink);
            this.searchIndexBuilder.appendPage(pagePermalink, htmlPage.title, htmlPage.description, htmlContent);

            let permalink = pagePermalink;

            if (!permalink.endsWith("/")) {
                permalink += "/";
            }

            permalink = `${permalink}index.html`;

            const contentBytes = Utils.stringToUnit8Array(htmlContent);
            await this.outputBlobStorage.uploadBlob(permalink, contentBytes, "text/html");
        }
        catch (error) {
            console.error(`Unable to reneder page. ${error}`);
        }
    }

    public async publish(): Promise<void> {
        const locales = await this.localeService.getLocales();
        const defaultLocale = await this.localeService.getDefaultLocale();
        const localizationEnabled = locales.length > 0;
        const globalStyleSheet = await this.styleCompiler.getStyleSheet();

        try {
            const results = [];
            const settings = await this.siteService.getSettings<any>();
            const siteSettings: SiteSettingsContract = settings.site;

            if (localizationEnabled) {
                for (const locale of locales) {
                    const localeCode = locale.code === defaultLocale
                        ? null
                        : locale.code;

                    const pages = await this.ampPageService.search("", localeCode);

                    for (const page of pages) {
                        results.push(this.renderAndUpload(siteSettings, page, globalStyleSheet, localeCode));
                    }
                }
            }
            else {
                const pages = await this.ampPageService.search("");

                for (const page of pages) {
                    results.push(this.renderAndUpload(siteSettings, page, globalStyleSheet));
                }
            }

            await Promise.all(results);
        }
        catch (error) {
            this.logger.traceError(error, "AMP page publisher");
        }
    }
}