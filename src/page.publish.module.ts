import { IInjectorModule, IInjector } from "@paperbits/common/injection";
import { AmpPagePublisher } from "./publishing/ampPagePublisher";
import { AmpPageService } from "./services/page";
import { PicturePublishModule } from "./widgets/picture";
import { CollapsiblePanelPublishModule } from "./widgets/collapsible-panel";
import { AmpPagePermalinkResolver } from "./pagePermalinkResolver";


export class PagePublishModule implements IInjectorModule {
    public register(injector: IInjector): void {
        injector.bindSingleton("ampPageService", AmpPageService);
        injector.bindToCollectionAsSingletone("publishers", AmpPagePublisher);
        injector.bindToCollectionAsSingletone("permalinkResolvers", AmpPagePermalinkResolver);
        injector.bindModule(new PicturePublishModule());
        injector.bindModule(new CollapsiblePanelPublishModule());
    }
}