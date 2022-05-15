import { PictureViewModel } from "./pictureViewModel";
import { ViewModelBinder } from "@paperbits/common/widgets";
import { PictureModel } from "../pictureModel";
import { EventManager, Events } from "@paperbits/common/events";
import { StyleCompiler } from "@paperbits/common/styles/styleCompiler";
import { Bag } from "@paperbits/common";
import { IPermalinkResolver } from "@paperbits/common/permalinks";
import { ComponentFlow, IWidgetBinding } from "@paperbits/common/editing";
import { PictureHandlers } from "../pictureHandlers";

export class PictureViewModelBinder implements ViewModelBinder<PictureModel, PictureViewModel> {
    constructor(
        private readonly eventManager: EventManager,
        private readonly styleCompiler: StyleCompiler,
        private readonly mediaPermalinkResolver: IPermalinkResolver,
    ) { }

    public async modelToViewModel(model: PictureModel, viewModel?: PictureViewModel, bindingContext?: Bag<any>): Promise<PictureViewModel> {
        if (!viewModel) {
            viewModel = new PictureViewModel();
            viewModel.initialize();
        }

        let sourceUrl = null;

        if (model.sourceKey) {
            sourceUrl = await this.mediaPermalinkResolver.getUrlByTargetKey(model.sourceKey);

            if (!sourceUrl) {
                console.warn(`Unable to set picture. Media with source key ${model.sourceKey} not found.`);
            }
        }

        viewModel.sourceUrl(sourceUrl || "https://amp.dev/static/inline-examples/images/sea.jpg");
        viewModel.caption(model.caption);
        viewModel.hyperlink(model.hyperlink);
        viewModel.width(model.width || 300);
        viewModel.height(model.height || 200);

        if (model.styles) {
            viewModel.styles(await this.styleCompiler.getStyleModelAsync(model.styles, bindingContext?.styleManager));
        }

        const binding: IWidgetBinding<PictureModel, PictureViewModel> = {
            name: "amp-picture",
            displayName: "Picture (AMP)",
            layer: bindingContext?.layer,
            model: model,
            flow: ComponentFlow.Inline,
            handler: PictureHandlers,
            draggable: true,
            editor: "amp-picture-editor",
            applyChanges: async () => {
                await this.modelToViewModel(model, viewModel, bindingContext);
                this.eventManager.dispatchEvent(Events.ContentUpdate);
            }
        };

        viewModel["widgetBinding"] = binding;

        return viewModel;
    }

    public canHandleModel(model: PictureModel): boolean {
        return model instanceof PictureModel;
    }
}