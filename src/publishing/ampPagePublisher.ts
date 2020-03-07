import * as Utils from "@paperbits/common/utils";
import template from "./page.html";
import { minify } from "html-minifier-terser";
import {
    IPublisher,
    HtmlPage,
    HtmlPagePublisher,
    SearchIndexBuilder,
    SitemapBuilder,
    SocialShareDataHtmlPagePublisherPlugin,
    LinkedDataHtmlPagePublisherPlugin
} from "@paperbits/common/publishing";
import { IBlobStorage } from "@paperbits/common/persistence";
import { IPageService, PageContract } from "@paperbits/common/pages";
import { ISiteService } from "@paperbits/common/sites";
import { Logger } from "@paperbits/common/logging";
import { IMediaService } from "@paperbits/common/media";
import { StyleManager, StyleCompiler, StyleSheet } from "@paperbits/common/styles";
import { AmpStylesheetPublisherPlugin } from "./ampStylesheetPlugin";
import { AmpAnalyticsHtmlPagePublisherPlugin } from "./ampAnalyticsPlugin";
import { KnockoutHtmlPagePublisherPlugin } from "@paperbits/core/publishing";
import { ContentViewModelBinder } from "@paperbits/core/content/ko";
import { ILayoutService } from "@paperbits/common/layouts";


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
        private readonly layoutService: ILayoutService
    ) { }

    public async renderPage(page: HtmlPage): Promise<string> {
        this.logger.traceEvent(`Publishing page ${page.title}...`);

        const overridePlugins = [
            new KnockoutHtmlPagePublisherPlugin(this.contentViewModelBinder, this.layoutService),
            new SocialShareDataHtmlPagePublisherPlugin(this.mediaService),
            new LinkedDataHtmlPagePublisherPlugin(this.siteService),
            new AmpStylesheetPublisherPlugin(),
            new AmpAnalyticsHtmlPagePublisherPlugin(this.siteService)
        ];

        const htmlContent = await this.htmlPagePublisher.renderHtml(page, overridePlugins);

        return minify(htmlContent, {
            removeAttributeQuotes: true,
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
            removeTagWhitespace: false
        });
    }

    private async renderAndUpload(settings: any, page: PageContract, globalStyleSheet: StyleSheet, indexer: SearchIndexBuilder): Promise<void> {
        const pageContent = await this.ampPageService.getPageContent(page.key);
        const styleManager = new StyleManager();
        styleManager.setStyleSheet(globalStyleSheet);

        const htmlPage: HtmlPage = {
            title: [page.title, settings.site.title].join(" - "),
            description: page.description || settings.site.description,
            keywords: page.keywords || settings.site.keywords,
            permalink: page.permalink,
            url: `https://${settings.site.hostname}${page.permalink}`,
            content: pageContent,
            author: settings.site.author,
            template: template,
            styleReferences: [], // No external CSS allowed in AMP.
            socialShareData: page.socialShareData,
            openGraph: {
                type: page.permalink === "/" ? "website" : "article",
                title: page.title,
                description: page.description || settings.site.description,
                url: page.permalink,
                siteName: settings.site.title
                // image: { ... }
            },
            bindingContext: {
                styleManager: styleManager,
                navigationPath: page.permalink,
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

        if (settings.site.faviconSourceKey) {
            try {
                const media = await this.mediaService.getMediaByKey(settings.site.faviconSourceKey);

                if (media) {
                    htmlPage.faviconPermalink = media.permalink;
                }
            }
            catch (error) {
                this.logger.traceError(error, "Could not retrieve favicon.");
            }
        }

        // settings.site.faviconSourceKey
        const htmlContent = await this.renderPage(htmlPage);

        indexer.appendPage(htmlPage.permalink, htmlPage.title, htmlPage.description, htmlContent);

        let permalink = page.permalink;

        if (!permalink.endsWith("/")) {
            permalink += "/";
        }

        permalink = `${permalink}index.html`;

        const contentBytes = Utils.stringToUnit8Array(htmlContent);
        await this.outputBlobStorage.uploadBlob(permalink, contentBytes, "text/html");
    }

    public async publish(): Promise<void> {
        const globalStyleSheet = await this.styleCompiler.getStyleSheet();

        try {
            const pages = await this.ampPageService.search("");
            const results = [];
            const settings = await this.siteService.getSiteSettings();
            const sitemapBuilder = new SitemapBuilder(settings.site.hostname);
            const searchIndexBuilder = new SearchIndexBuilder();

            for (const page of pages) {
                results.push(this.renderAndUpload(settings, page, globalStyleSheet, searchIndexBuilder));
                sitemapBuilder.appendPermalink(page.permalink);
            }

            await Promise.all(results);

            const index = searchIndexBuilder.buildIndex();
            const indexBytes = Utils.stringToUnit8Array(index);
            await this.outputBlobStorage.uploadBlob("search-index.json", indexBytes, "application/json");

            const sitemap = sitemapBuilder.buildSitemap();
            const contentBytes = Utils.stringToUnit8Array(sitemap);
            await this.outputBlobStorage.uploadBlob("sitemap.xml", contentBytes, "text/xml");
        }
        catch (error) {
            this.logger.traceError(error, "AMP page publisher");
        }
    }
}