import * as ko from "knockout";
import template from "./pages.html";
import { IPageService, PageContract } from "@paperbits/common/pages";
import { ViewManager, View } from "@paperbits/common/ui";
import { Component, OnMounted } from "@paperbits/common/ko/decorators";
import { PageItem } from "./pageItem";
import { ChangeRateLimit } from "@paperbits/common/ko/consts";
import { Query, Operator, Page } from "@paperbits/common/persistence";


@Component({
    selector: "amp-pages",
    template: template
})
export class PagesWorkshop {
    private currentPage: Page<PageContract>;

    public readonly searchPattern: ko.Observable<string>;
    public readonly pages: ko.ObservableArray<PageItem>;
    public readonly working: ko.Observable<boolean>;
    public readonly selectedPage: ko.Observable<PageItem>;

    constructor(
        private readonly ampPageService: IPageService,
        private readonly viewManager: ViewManager
    ) {
        this.pages = ko.observableArray<PageItem>();
        this.selectedPage = ko.observable<PageItem>();
        this.searchPattern = ko.observable<string>("");
        this.working = ko.observable(false);
    }

    @OnMounted()
    public async initialize(): Promise<void> {
        await this.searchPages();

        this.searchPattern
            .extend(ChangeRateLimit)
            .subscribe(this.searchPages);
    }

    public async searchPages(searchPattern: string = ""): Promise<void> {
        this.working(true);

        this.pages([]);

        const query = Query
            .from<PageContract>()
            .orderBy(`title`);

        if (searchPattern) {
            query.where(`title`, Operator.contains, searchPattern);
        }

        const pageOfResults = await this.ampPageService.search(query);
        this.currentPage = pageOfResults;

        const pageItems = pageOfResults.value.map(page => new PageItem(page));
        this.pages.push(...pageItems);

        this.working(false);
    }

    public async loadNextPage(): Promise<void> {
        if (!this.currentPage?.takeNext) {
            return;
        }

        this.working(true);

        this.currentPage = await this.currentPage.takeNext();

        const pageItems = this.currentPage.value.map(page => new PageItem(page));
        this.pages.push(...pageItems);

        this.working(false);
    }

    public selectPage(pageItem: PageItem): void {
        this.selectedPage(pageItem);

        const view: View = {
            heading: "AMP page",
            component: {
                name: "amp-page-details-workshop",
                params: {
                    pageItem: pageItem,
                    onDeleteCallback: () => {
                        this.searchPages();
                    },
                    onCopyCallback: async (item: PageItem) => {
                        await this.searchPages();
                        this.selectPage(item);
                    }
                }
            }
        };

        this.viewManager.openViewAsWorkshop(view);
    }

    public async addPage(): Promise<void> {
        this.working(true);

        const pageUrl = "/new-amp-page";

        const pageContract = await this.ampPageService.createPage(pageUrl, "New page", "", "");
        const pageItem = new PageItem(pageContract);

        this.pages.push(pageItem);
        this.selectPage(pageItem);

        this.working(false);
    }

    public isSelected(page: PageItem): boolean {
        const selectedPage = this.selectedPage();
        return selectedPage?.key === page.key;
    }
}