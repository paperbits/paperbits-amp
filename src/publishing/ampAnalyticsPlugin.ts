import { HtmlPagePublisherPlugin } from "@paperbits/common/publishing";
import { ISiteService } from "@paperbits/common/sites";


export class AmpAnalyticsHtmlPagePublisherPlugin implements HtmlPagePublisherPlugin {
    constructor(private readonly siteService: ISiteService) { }

    public async apply(document: Document): Promise<void> {
        const settings = await this.siteService.getSiteSettings();

        if (!settings?.integration?.googleTagManager) {
            return;
        }

        const headScriptElement = document.createElement("script");
        headScriptElement.src = "https://cdn.ampproject.org/v0/amp-analytics-0.1.js";
        headScriptElement.async = true;
        headScriptElement.setAttribute("custom-element", "amp-analytics");
        document.head.insertAdjacentElement("afterbegin", headScriptElement);

        const gtmSettings = settings.integration.googleTagManager;
        const containerId = gtmSettings.ampContainerId || gtmSettings.containerId;

        const ampAnalyticsElement = document.createElement("amp-analytics");
        ampAnalyticsElement.setAttribute("config", `https://www.googletagmanager.com/amp.json?id=${containerId}`);
        ampAnalyticsElement.setAttribute("data-credentials", "include");

        document.body.insertAdjacentElement("afterbegin", ampAnalyticsElement);
    }
}
