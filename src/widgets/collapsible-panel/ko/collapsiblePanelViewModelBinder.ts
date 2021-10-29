import { CollapsiblePanel } from "./collapsiblePanelViewModel";
import { ViewModelBinder } from "@paperbits/common/widgets";
import { CollapsiblePanelModel } from "../collapsiblePanelModel";
import { EventManager, Events } from "@paperbits/common/events";
import { StyleCompiler } from "@paperbits/common/styles";
import { Bag } from "@paperbits/common";
import { PlaceholderViewModel } from "@paperbits/core/placeholder/ko";
import { ViewModelBinderSelector } from "@paperbits/core/ko";
import { CollapsiblePanelHandlers } from "..";
import { ComponentFlow } from "@paperbits/common/editing";


export class CollapsiblePanelViewModelBinder implements ViewModelBinder<CollapsiblePanelModel, CollapsiblePanel>  {
    constructor(
        private readonly viewModelBinderSelector: ViewModelBinderSelector,
        private readonly eventManager: EventManager,
        private readonly styleCompiler: StyleCompiler
    ) { }

    public async modelToViewModel(model: CollapsiblePanelModel, viewModel?: CollapsiblePanel, bindingContext?: Bag<any>): Promise<CollapsiblePanel> {
        if (!viewModel) {
            viewModel = new CollapsiblePanel();
        }

        const widgetViewModels = [];

        for (const widgetModel of model.widgets) {
            const widgetViewModelBinder = this.viewModelBinderSelector.getViewModelBinderByModel(widgetModel);
            const widgetViewModel = await widgetViewModelBinder.modelToViewModel(widgetModel, null, bindingContext);

            widgetViewModels.push(widgetViewModel);
        }

        if (widgetViewModels.length === 0) {
            widgetViewModels.push(new PlaceholderViewModel("Collapsible panel content"));
        }

        if (model.styles) {
            const styleModel = await this.styleCompiler.getStyleModelAsync(model.styles, bindingContext?.styleManager);
            viewModel.styles(styleModel);
        }

        viewModel.widgets(widgetViewModels);

        viewModel["widgetBinding"] = {
            name: "ampCollapiblePanel",
            displayName: "Collapsible panel",
            readonly: bindingContext ? bindingContext.readonly : false,
            model: model,
            draggable: true,
            flow: ComponentFlow.Inline,
            editor: "amp-collapsible-panel-editor",
            handler: CollapsiblePanelHandlers,
            applyChanges: async () => {
                await this.modelToViewModel(model, viewModel, bindingContext);
                this.eventManager.dispatchEvent(Events.ContentUpdate);
            }
        };

        return viewModel;
    }

    public canHandleModel(model: CollapsiblePanelModel): boolean {
        return model instanceof CollapsiblePanelModel;
    }
}