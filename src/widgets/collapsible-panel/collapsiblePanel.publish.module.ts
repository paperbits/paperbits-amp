import { IInjectorModule, IInjector } from "@paperbits/common/injection";
import { CollapsiblePanel } from "./ko/collapsiblePanelViewModel";
import { CollapsiblePanelModelBinder } from "./collapsiblePanelModelBinder";
import { CollapsiblePanelViewModelBinder } from "./ko/collapsiblePanelViewModelBinder";

export class CollapsiblePanelPublishModule implements IInjectorModule {
    public register(injector: IInjector): void {        
        injector.bind("ampCollapsiblePanel", CollapsiblePanel);
        injector.bindToCollection("modelBinders", CollapsiblePanelModelBinder);
        injector.bindToCollection("viewModelBinders", CollapsiblePanelViewModelBinder);
    }
}