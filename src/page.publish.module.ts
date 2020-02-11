import { IInjectorModule, IInjector } from "@paperbits/common/injection";
import { PagePublisher } from "./publishing/pagePublisher";
import { AmpPageService } from "./services/page";
import { PicturePublishModule } from "./widgets/picture/ko";


export class PagePublishModule implements IInjectorModule {
    public register(injector: IInjector): void {
        injector.bindToCollection("publishers", PagePublisher);
        injector.bind("ampPageService", AmpPageService);

        injector.bindModule(new PicturePublishModule());
    }
}