import { PagesToolButton } from "./pagesToolButton";
import { IInjectorModule, IInjector } from "@paperbits/common/injection";
import { PagesWorkshop } from "./pages";
import { PageDetailsWorkshop } from "./pageDetails";
import { PageSelector } from "./pageSelector";
import { PageHost } from "./pageHost";
import { AmpPageService } from "../../../services/page";


export class PageDesignModule implements IInjectorModule {
    public register(injector: IInjector): void {
        injector.bind("pageHost", PageHost);
        injector.bind("ampPagesWorkshop", PagesWorkshop);
        injector.bind("ampPageDetailsWorkshop", PageDetailsWorkshop);
        injector.bind("ampPageSelector", PageSelector);
        injector.bindToCollection("workshopSections", PagesToolButton);
        injector.bind("ampPageService", AmpPageService);
    }
}