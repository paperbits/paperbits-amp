import * as ko from "knockout";
import template from "./picture.html";
import { Component, OnMounted } from "@paperbits/common/ko/decorators";
import { HyperlinkModel } from "@paperbits/common/permalinks";
import { StyleModel } from "@paperbits/common/styles";


@Component({
    selector: "amp-picture",
    template: template,
})
export class PictureViewModel {
    public working: ko.Observable<boolean>;
    public sourceUrl: ko.Observable<string>;
    public caption: ko.Observable<string>;
    public hyperlink: ko.Observable<HyperlinkModel>;
    public width: ko.Observable<number>;
    public height: ko.Observable<number>;
    public styles: ko.Observable<StyleModel>;

    constructor() {
        this.working = ko.observable<boolean>();
        this.sourceUrl = ko.observable<string>();
        this.caption = ko.observable<string>();
        this.hyperlink = ko.observable<HyperlinkModel>();
        this.width = ko.observable<number>();
        this.height = ko.observable<number>();
        this.styles = ko.observable<StyleModel>();

        this.reloadAmpComponent = this.reloadAmpComponent.bind(this);
    }

    @OnMounted()
    public async initialize(): Promise<void> {
        this.sourceUrl.subscribe(this.reloadAmpComponent);
    }

    private reloadAmpComponent(): void {
        this.working(true);
        this.working(false);
    }
}
