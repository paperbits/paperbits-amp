import { ILayoutService } from "@paperbits/common/layouts";
import { ILocaleService } from "@paperbits/common/localization";
import { Logger } from "@paperbits/common/logging";
import { IMediaService } from "@paperbits/common/media";
import { IPageService } from "@paperbits/common/pages";
import { IBlobStorage } from "@paperbits/common/persistence";
import {
    HtmlDocumentProvider,
    HtmlPage,
    HtmlPagePublisher,
    LinkedDataHtmlPagePublisherPlugin,
    OpenGraphHtmlPagePublisherPlugin,
    SitemapBuilder,
    SocialShareDataHtmlPagePublisherPlugin
} from "@paperbits/common/publishing";
import { ISiteService } from "@paperbits/common/sites";
import { StyleCompiler } from "@paperbits/common/styles";
import { ContentViewModelBinder } from "@paperbits/core/content/ko";
import { PopupHostViewModelBinder } from "@paperbits/core/popup/ko/popupHostViewModelBinder";
import { KnockoutHtmlPagePublisherPlugin } from "@paperbits/core/publishing";
import { PagePublisher } from "@paperbits/core/publishing/pagePublisher";
import { AmpAnalyticsHtmlPagePublisherPlugin } from "./ampAnalyticsPlugin";
import { AmpStylesheetPublisherPlugin } from "./ampStylesheetPlugin";
import { ISettingsProvider } from "@paperbits/common/configuration";
import { SearchIndexBuilder } from "@paperbits/common/search";


export class AmpPagePublisher extends PagePublisher {
    constructor(
        protected readonly ampPageService: IPageService,
        protected readonly siteService: ISiteService,
        protected readonly mediaService: IMediaService,
        protected readonly outputBlobStorage: IBlobStorage,
        protected readonly htmlPagePublisher: HtmlPagePublisher,
        protected readonly styleCompiler: StyleCompiler,
        protected readonly settingsProvider: ISettingsProvider,
        protected readonly logger: Logger,
        protected readonly contentViewModelBinder: ContentViewModelBinder,
        protected readonly popupHostViewModelBinder: PopupHostViewModelBinder,
        protected readonly layoutService: ILayoutService,
        protected readonly sitemapBuilder: SitemapBuilder,
        protected readonly searchIndexBuilder: SearchIndexBuilder,
        protected readonly localeService: ILocaleService,
        protected readonly htmlDocumentProvider: HtmlDocumentProvider,
    ) {
        super(
            ampPageService,
            siteService,
            mediaService,
            outputBlobStorage,
            htmlPagePublisher,
            styleCompiler,
            localeService,
            sitemapBuilder,
            searchIndexBuilder,
            settingsProvider,
            logger
        );
    }

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
}