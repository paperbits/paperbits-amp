﻿import * as ko from "knockout";
import template from "./pageDetails.html";
import { IPageService } from "@paperbits/common/pages";
import { Router } from "@paperbits/common/routing";
import { ViewManager } from "@paperbits/common/ui";
import { Component, Param, Event, OnMounted } from "@paperbits/common/ko/decorators";
import { PageItem } from "./pageItem";
import { ISettingsProvider } from "@paperbits/common/configuration";
import { BackgroundModel } from "@paperbits/common/widgets/background";
import { MediaContract, IMediaService } from "@paperbits/common/media";

@Component({
    selector: "amp-page-details-workshop",
    template: template
})
export class PageDetailsWorkshop {
    public readonly isReserved: ko.Observable<boolean>;
    public readonly isSeoEnabled: ko.Observable<boolean>;
    public readonly socialShareImage: ko.Observable<BackgroundModel>;

    constructor(
        private readonly ampPageService: IPageService,
        private readonly router: Router,
        private readonly viewManager: ViewManager,
        private readonly reservedPermalinks: string[],
        private readonly settingsProvider: ISettingsProvider,
        private readonly mediaService: IMediaService
    ) {
        this.isReserved = ko.observable(false);
        this.isSeoEnabled = ko.observable(false);
        this.socialShareImage = ko.observable();
    }

    @Param()
    public pageItem: PageItem;

    @Event()
    private readonly onDeleteCallback: () => void;

    @Event()
    private readonly onCopyCallback: (pageItem: PageItem) => void;

    @OnMounted()
    public async onMounted(): Promise<void> {
        this.pageItem.title
            .extend(<any>{ required: true, onlyValid: true })
            .subscribe(this.applyChanges);

        this.pageItem.description
            .subscribe(this.applyChanges);

        this.pageItem.keywords
            .subscribe(this.applyChanges);

        this.pageItem.jsonLd
            .subscribe(this.applyChanges);

        let validPermalink = this.pageItem.permalink;

        if (this.reservedPermalinks.includes(this.pageItem.permalink())) {
            this.isReserved(true);
        }
        else {
            validPermalink = validPermalink.extend(<any>{ required: true, validPermalink: this.pageItem.key, onlyValid: true });
            validPermalink.subscribe(this.onPermalinkChange);
        }

        const socialShareData = this.pageItem.socialShareData();

        if (socialShareData?.image?.sourceKey) {
            const media = await this.mediaService.getMediaByKey(socialShareData.image.sourceKey);

            const imageModel = new BackgroundModel();
            imageModel.sourceUrl = media.downloadUrl;
            this.socialShareImage(imageModel);
        }

        const seoSetting = await this.settingsProvider.getSetting<boolean>("enableSeo");

        if (seoSetting) {
            this.isSeoEnabled(seoSetting);
        }

        await this.router.navigateTo(validPermalink());
        this.viewManager.setHost({ name: "amp-page-host" });
    }

    private async applyChanges(): Promise<void> {
        await this.ampPageService.updatePage(this.pageItem.toContract());
    }

    private async onPermalinkChange(): Promise<void> {
        const permalink = this.pageItem.permalink();
        this.router.updateHistory(permalink, this.pageItem.title());

        await this.applyChanges();
    }

    public async deletePage(): Promise<void> {
        await this.ampPageService.deletePage(this.pageItem.toContract());

        this.viewManager.notifySuccess("AMP pages", `Page "${this.pageItem.title()}" was deleted.`);
        this.viewManager.closeWorkshop("amp-page-details-workshop");

        if (this.onDeleteCallback) {
            this.onDeleteCallback();
        }

        this.router.navigateTo("/");
    }

    public async copyPage(): Promise<void> {
        const copyContract = await this.ampPageService.copyPage(this.pageItem.key);

        if (this.onCopyCallback) {
            this.onCopyCallback(new PageItem(copyContract));
        }
    }

    public async onMediaSelected(media: MediaContract): Promise<void> {
        let socialShareData = null;

        if (media) {
            socialShareData = {
                image: {
                    sourceKey: media.key,
                    // width: 1200,
                    // height: 620
                }
            };

            const imageModel = new BackgroundModel();
            imageModel.sourceUrl = media.downloadUrl;
            this.socialShareImage(imageModel);
        }
        else {
            this.socialShareImage(null);
        }

        this.pageItem.socialShareData(socialShareData);

        await this.applyChanges();
    }
}