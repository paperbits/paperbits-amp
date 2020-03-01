import { IInjectorModule, IInjector } from "@paperbits/common/injection";
import { CollapsiblePanelEditor } from "./ko/collapsiblePanelEditor";
import { CollapsiblePanelHandlers } from "./collapsiblePanelHandlers";
import { CollapsiblePanel, CollapsiblePanelViewModelBinder } from "./ko";
import { CollapsiblePanelModelBinder } from ".";

export class CollapsiblePanelDesignModule implements IInjectorModule {
    public register(injector: IInjector): void {
        injector.bind("ampCollapsiblePanel", CollapsiblePanel);
        injector.bindToCollection("modelBinders", CollapsiblePanelModelBinder);
        injector.bindToCollection("viewModelBinders", CollapsiblePanelViewModelBinder);
        injector.bind("ampCollapsiblePanelEditor", CollapsiblePanelEditor);
        injector.bindToCollection("widgetHandlers", CollapsiblePanelHandlers, "ampCollapsiblePanelHandler");
    }
}