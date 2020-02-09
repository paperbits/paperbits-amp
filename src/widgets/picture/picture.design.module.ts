import { IInjectorModule, IInjector } from "@paperbits/common/injection";
import { IWidgetHandler, IContentDropHandler } from "@paperbits/common/editing";
import { PictureEditor } from "./ko/pictureEditor";
import { PictureHandlers } from "./pictureHandlers";
import { IStyleGroup } from "@paperbits/common/styles";
import { PictureViewModel, PictureViewModelBinder } from "./ko";
import { PictureModelBinder } from ".";

export class PictureDesignModule implements IInjectorModule {
    public register(injector: IInjector): void {
        const styleGroup: IStyleGroup = { 
            key: "picture",
            name: "components_picture", 
            groupName: "Pictures",
            selectorTemplate: `<img src="https://cdn.paperbits.io/images/placeholder-340x190.jpg" alt="Picture" data-bind="css: classNames" width="280px" height="190px" /><div data-bind="text: displayName"></div>`,
            styleTemplate: `<img src="https://cdn.paperbits.io/images/placeholder-340x190.jpg" alt="Picture" data-bind="stylePreview: variation" width="340px" height="190px" />`
        };

        injector.bindInstanceToCollection("styleGroups", styleGroup);
        injector.bind("pictureEditor", PictureEditor);
        injector.bindToCollection<IWidgetHandler>("widgetHandlers", PictureHandlers, "pictureWidgetHandler");
        injector.bindToCollection<IContentDropHandler>("dropHandlers",  PictureHandlers, "pictureDropHandler");
        injector.bind("picture", PictureViewModel);
        injector.bindToCollection("modelBinders", PictureModelBinder);
        injector.bindToCollection("viewModelBinders", PictureViewModelBinder);
    }
}