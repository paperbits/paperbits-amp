import { IInjectorModule, IInjector } from "@paperbits/common/injection";
import { AmpPagePublisher } from "./publishing/ampPagePublisher";
import { AmpPageService } from "./services/page";
import { PicturePublishModule } from "./widgets/picture/ko";
import { CollapsiblePanelPublishModule } from "./widgets/collapsible-panel";


export class PagePublishModule implements IInjectorModule {
    public register(injector: IInjector): void {
        injector.bindToCollection("publishers", AmpPagePublisher);
        injector.bind("ampPageService", AmpPageService);

        injector.bindModule(new PicturePublishModule());
        injector.bindModule(new CollapsiblePanelPublishModule());
    }
}