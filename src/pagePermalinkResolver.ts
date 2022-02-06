import { Contract } from "@paperbits/common";
import { HyperlinkContract } from "@paperbits/common/editing";
import { IPageService, PageContract } from "@paperbits/common/pages";
import { HyperlinkModel, IPermalinkResolver } from "@paperbits/common/permalinks";
import { ContentItemContract } from "@paperbits/common/contentModel";
import { ILocaleService } from "@paperbits/common/localization";

const pagesPath = "amp-pages/";

export class AmpPagePermalinkResolver implements IPermalinkResolver {
    constructor(
        private readonly ampPageService: IPageService,
        private readonly localeService: ILocaleService
    ) { }

    public canHandleTarget(targetKey: string): boolean {
        return targetKey.startsWith(pagesPath);
    }

    public async getUrlByTargetKey(targetKey: string, locale?: string): Promise<string> {
        if (!targetKey) {
            throw new Error("Target key cannot be null or empty.");
        }

        if (!targetKey.startsWith(pagesPath)) {
            return null;
        }

        const defaultLocale = await this.localeService.getDefaultLocaleCode();
        let pageContract = await this.ampPageService.getPageByKey(targetKey, locale);

        if (!pageContract) {
            pageContract = await this.ampPageService.getPageByKey(targetKey, defaultLocale);

            if (!pageContract) {
                console.warn(`Could not find content item with key ${targetKey}.`);
                return "";
            }
        }
        else if (locale && locale !== defaultLocale) {
            pageContract.permalink = `/${locale}${pageContract.permalink}`;
        }

        return pageContract.permalink;
    }

    private async getHyperlink(pageContract: PageContract, hyperlinkContract?: HyperlinkContract): Promise<HyperlinkModel> {
        const hyperlinkModel = new HyperlinkModel();
        hyperlinkModel.targetKey = pageContract.key;
        hyperlinkModel.href = pageContract.permalink;
        hyperlinkModel.title = pageContract.title || pageContract.permalink;

        if (hyperlinkContract) {
            hyperlinkModel.target = hyperlinkContract.target;
            hyperlinkModel.anchor = hyperlinkContract.anchor;
            hyperlinkModel.anchorName = hyperlinkContract.anchorName;
        }

        return hyperlinkModel;
    }

    public async getHyperlinkFromContract(hyperlinkContract: HyperlinkContract, locale?: string): Promise<HyperlinkModel> {
        if (!hyperlinkContract.targetKey) {
            throw new Error("Target key cannot be null or empty.");
        }

        if (!hyperlinkContract.targetKey.startsWith(pagesPath)) {
            return null;
        }

        let hyperlinkModel: HyperlinkModel;

        if (hyperlinkContract.targetKey) {
            const pageContract = await this.ampPageService.getPageByKey(hyperlinkContract.targetKey, locale);

            if (pageContract) {
                return this.getHyperlink(pageContract, hyperlinkContract);
            }
        }

        hyperlinkModel = new HyperlinkModel();
        hyperlinkModel.title = "Unset link";
        hyperlinkModel.target = hyperlinkContract.target;
        hyperlinkModel.targetKey = hyperlinkContract.targetKey;
        hyperlinkModel.href = "#";
        hyperlinkModel.anchor = hyperlinkContract.anchor;
        hyperlinkModel.anchorName = hyperlinkContract.anchorName;

        return hyperlinkModel;
    }

    public async getHyperlinkByTargetKey(targetKey: string, locale?: string): Promise<HyperlinkModel> {
        if (!targetKey) {
            throw new Error("Target key cannot be null or empty.");
        }

        if (!targetKey.startsWith(pagesPath)) {
            return null;
        }

        const defaultLocale = await this.localeService.getDefaultLocaleCode();
        let pageContract = await this.ampPageService.getPageByKey(targetKey, locale);

        if (!pageContract) {
            pageContract = await this.ampPageService.getPageByKey(targetKey, defaultLocale);

            if (!pageContract) {
                console.warn(`Could create hyperlink for target with key ${targetKey} in locale ${defaultLocale}.`);
                return null;
            }
        }
        else if (locale && locale !== defaultLocale) {
            pageContract.permalink = `/${locale}${pageContract.permalink}`;
        }

        const hyperlink = await this.getHyperlink(pageContract);

        return hyperlink;
    }

    public async getContentByPermalink(permalink: string, locale?: string): Promise<Contract> {
        if (!permalink) {
            throw new Error(`Parameter "permalink" not specified.`);
        }

        let pageContract = await this.ampPageService.getPageByPermalink(permalink, locale);

        if (!pageContract) {
            const defaultLocale = await this.localeService.getDefaultLocaleCode();
            pageContract = await this.ampPageService.getPageByPermalink(permalink, defaultLocale);

            if (!pageContract) {
                return null;
            }
        }

        const pageContent = await this.ampPageService.getPageContent(pageContract.key);

        return pageContent;
    }

    public async getContentItemByPermalink(permalink: string, locale?: string): Promise<ContentItemContract> {
        if (!permalink) {
            throw new Error(`Parameter "permalink" not specified.`);
        }

        const pageContract = await this.ampPageService.getPageByPermalink(permalink, locale);

        return pageContract;
    }
}