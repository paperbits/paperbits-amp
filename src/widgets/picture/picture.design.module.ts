import { IInjectorModule, IInjector } from "@paperbits/common/injection";
import { IWidgetHandler, IContentDropHandler } from "@paperbits/common/editing";
import { PictureEditor } from "./ko/pictureEditor";
import { PictureHandlers } from "./pictureHandlers";
import { PictureViewModel, PictureViewModelBinder } from "./ko";
import { PictureModelBinder } from ".";

export class PictureDesignModule implements IInjectorModule {
    public register(injector: IInjector): void {
        injector.bind("ampPictureEditor", PictureEditor);
        injector.bindToCollection<IWidgetHandler>("widgetHandlers", PictureHandlers);
        injector.bindToCollection<IContentDropHandler>("dropHandlers",  PictureHandlers);
        injector.bind("ampPicture", PictureViewModel);
        injector.bindToCollection("modelBinders", PictureModelBinder);
        injector.bindToCollection("viewModelBinders", PictureViewModelBinder);
    }
}