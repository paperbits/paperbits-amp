import { PagesToolButton } from "./pagesToolButton";
import { IInjectorModule, IInjector } from "@paperbits/common/injection";
import { PagesWorkshop } from "./pages";
import { PageDetailsWorkshop } from "./pageDetails";
import { PageSelector } from "./pageSelector";


export class PageDesignModule implements IInjectorModule {
    public register(injector: IInjector): void {
        injector.bind("ampPagesWorkshop", PagesWorkshop);
        injector.bind("ampPageDetailsWorkshop", PageDetailsWorkshop);
        injector.bind("ampPageSelector", PageSelector);
        injector.bindToCollection("workshopSections", PagesToolButton);
    }
}