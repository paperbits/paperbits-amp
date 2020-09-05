import * as ko from "knockout";
import template from "./pageSelector.html";
import { IResourceSelector } from "@paperbits/common/ui";
import { PageItem, AnchorItem } from "./pageItem";
import { IPageService, PageContract } from "@paperbits/common/pages";
import { Component, Param, Event, OnMounted } from "@paperbits/common/ko/decorators";
import { HyperlinkModel } from "@paperbits/common/permalinks";
import { AnchorUtils } from "@paperbits/core/text/anchorUtils";
import { ChangeRateLimit } from "@paperbits/common/ko/consts";
import { Query, Operator } from "@paperbits/common/persistence";

@Component({
    selector: "amp-page-selector",
    template: template
})
export class PageSelector implements IResourceSelector<HyperlinkModel> {
    private preSelectedModel: HyperlinkModel;
    private nextPageQuery: Query<PageContract>;

    public readonly searchPattern: ko.Observable<string>;
    public readonly pages: ko.ObservableArray<PageItem>;
    public readonly working: ko.Observable<boolean>;

    @Param()
    public selectedPage: ko.Observable<PageItem>;

    @Event()
    public onSelect: (selection: PageContract) => void;

    @Event()
    public onHyperlinkSelect: (selection: HyperlinkModel) => void;

    constructor(private readonly ampPageService: IPageService) {
        this.pages = ko.observableArray();
        this.selectedPage = ko.observable();
        this.searchPattern = ko.observable("");
        this.working = ko.observable();
    }

    @OnMounted()
    public async onMounted(): Promise<void> {
        await this.searchPages();

        this.searchPattern
            .extend(ChangeRateLimit)
            .subscribe(this.searchPages);
    }

    public async searchPages(searchPattern: string = ""): Promise<void> {
        this.pages([]);

        const query = Query
            .from<PageContract>()
            .orderBy(`title`);

        if (searchPattern) {
            query.where(`title`, Operator.contains, searchPattern);
        }

        this.nextPageQuery = query;
        await this.loadNextPage();
    }

    public async loadNextPage(): Promise<void> {
        if (!this.nextPageQuery || this.working()) {
            return;
        }

        this.working(true);

        const pageOfResults = await this.ampPageService.search2(this.nextPageQuery);
        this.nextPageQuery = pageOfResults.nextPage;

        const pageItems = pageOfResults.value.map(page => new PageItem(page));
        this.pages.push(...pageItems);

        if (!this.selectedPage() && this.preSelectedModel) {
            const currentPermalink = this.preSelectedModel.href;
            const current = pageItems.find(item => item.permalink() === currentPermalink);

            if (current) {
                await this.selectPage(current);
                const currentAnchors = current.anchors();

                if (this.preSelectedModel.anchor) {
                    const currentAnchor = currentAnchors.find(item => item.elementId === this.preSelectedModel.anchor);

                    if (currentAnchor) {
                        await this.selectAnchor(currentAnchor);
                    }
                }
            }
        }

        this.working(false);
    }

    public async selectPage(page: PageItem): Promise<void> {
        this.selectedPage(page);

        if (!page.anchorsLoaded()) { // expand anchors on first click
            const anchors = await this.getAnchors(page);
            page.anchors(anchors);
            page.anchorsLoaded(true);

            if (anchors.length > 0) {
                return;
            }
        }

        if (this.onSelect) {
            this.onSelect(page.toContract());
        }

        if (this.onHyperlinkSelect) {
            this.onHyperlinkSelect(page.getHyperlink());
        }
    }

    public selectResource(resource: HyperlinkModel): void {
        this.preSelectedModel = resource;
    }

    public async selectAnchor(anchor: AnchorItem): Promise<void> {
        if (!this.onHyperlinkSelect) {
            return;
        }

        const selectedPage = this.selectedPage();
        anchor.isSelected(true);
        selectedPage.selectedAnchor = anchor;

        this.onHyperlinkSelect(selectedPage.getHyperlink());
    }

    private async getAnchors(pageItem: PageItem): Promise<AnchorItem[]> {
        const pageContent = await this.ampPageService.getPageContent(pageItem.key);
        const children = AnchorUtils.getHeadingNodes(pageContent, 1, 6);

        const anchors = children
            .filter(item => item.nodes?.length > 0)
            .map(item => {
                const anchor = new AnchorItem();
                anchor.shortTitle = item.nodes[0]?.text;
                anchor.elementId = item.attrs?.id;

                return anchor;
            });

        return anchors;
    }

    public isSelected(page: PageItem): boolean {
        const selectedPage = this.selectedPage();
        return selectedPage?.key === page.key;
    }
}