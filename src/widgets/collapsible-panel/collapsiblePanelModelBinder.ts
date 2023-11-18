import { Bag, Contract } from "@paperbits/common";
import { CollectionModelBinder, IModelBinder } from "@paperbits/common/editing";
import { IWidgetService, ModelBinderSelector } from "@paperbits/common/widgets";
import { CollapsiblePanelContract } from "./collapsiblePanelContract";
import { CollapsiblePanelModel } from "./collapsiblePanelModel";


export class CollapsiblePanelModelBinder extends CollectionModelBinder implements IModelBinder<CollapsiblePanelModel>  {
    constructor(
        protected readonly widgetService: IWidgetService,
        protected modelBinderSelector: ModelBinderSelector
    ) {
        super(widgetService, modelBinderSelector);
    }

    public canHandleContract(contract: Contract): boolean {
        return contract.type === "amp-collapsible-panel";
    }

    public canHandleModel(model: Object): boolean {
        return model instanceof CollapsiblePanelModel;
    }

    public async contractToModel(contract: CollapsiblePanelContract, bindingContext?: Bag<any>): Promise<CollapsiblePanelModel> {
        const model = new CollapsiblePanelModel();
        model.styles = contract.styles;
        model.widgets = await this.getChildModels(contract.nodes, bindingContext);
        return model;
    }

    public modelToContract(model: CollapsiblePanelModel): Contract {
        const contract: CollapsiblePanelContract = {
            type: "amp-collapsible-panel",
            styles: model.styles,
            nodes: this.getChildContracts(model.widgets)
        };

        return contract;
    }
}
