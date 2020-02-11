import * as ko from "knockout";
import template from "./pages.html";
import { IPageService } from "@paperbits/common/pages";
import { Router } from "@paperbits/common/routing";
import { ViewManager, View } from "@paperbits/common/ui";
import { Component, OnMounted } from "@paperbits/common/ko/decorators";
import { PageItem } from "./pageItem";
import { ChangeRateLimit } from "@paperbits/common/ko/consts";


@Component({
    selector: "amp-pages",
    template: template
})
export class PagesWorkshop {
    public readonly searchPattern: ko.Observable<string>;
    public readonly pages: ko.ObservableArray<PageItem>;
    public readonly working: ko.Observable<boolean>;
    public readonly selectedPage: ko.Observable<PageItem>;

    constructor(
        private readonly ampPageService: IPageService,
        private readonly router: Router,
        private readonly viewManager: ViewManager
    ) {
        this.pages = ko.observableArray<PageItem>();
        this.selectedPage = ko.observable<PageItem>();
        this.searchPattern = ko.observable<string>("");
        this.working = ko.observable(true);
    }

    @OnMounted()
    public async initialize(): Promise<void> {
        await this.searchPages();

        this.searchPattern
            .extend(ChangeRateLimit)
            .subscribe(this.searchPages);
    }

    private async searchPages(searchPattern: string = ""): Promise<void> {
        this.working(true);
        this.pages([]);

        const pages = await this.ampPageService.search(searchPattern);
        const pageItems = pages.map(page => new PageItem(page));

        this.pages(pageItems);

        if (!this.selectedPage()) {
            const currentPermalink = this.router.getPath();
            const current = pageItems.find(item => item.permalink() === currentPermalink);

            if (current) {
                this.selectedPage(current);
                current.isSelected(true);
            }
        }
        this.working(false);
    }

    public selectPage(pageItem: PageItem): void {
        const prev = this.selectedPage();

        if (prev) {
            prev.isSelected(false);
        }

        this.selectedPage(pageItem);
        pageItem.isSelected(true);

        const view: View = {
            heading: "AMP page",
            component: {
                name: "amp-page-details-workshop",
                params: {
                    pageItem: pageItem,
                    onDeleteCallback: () => {
                        this.searchPages();
                    }
                }
            }
        };

        this.viewManager.openViewAsWorkshop(view);
    }

    public async addPage(): Promise<void> {
        this.working(true);

        const pageUrl = "/new-amp-page";
        const pageContract = await this.ampPageService.createPage(pageUrl, "New AMP page", "", "");
        const pageItem = new PageItem(pageContract);

        this.pages.push(pageItem);
        this.selectPage(pageItem);

        this.working(false);
    }
}