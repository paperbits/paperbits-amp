import { IInjectorModule, IInjector } from "@paperbits/common/injection";
import { PictureModelBinder } from "./pictureModelBinder";
import { PictureViewModelBinder } from "./ko/pictureViewModelBinder";
import { PictureViewModel } from "./ko/pictureViewModel";

export class PicturePublishModule implements IInjectorModule {
    public register(injector: IInjector): void {        
        injector.bind("ampPicture", PictureViewModel);
        injector.bindToCollection("modelBinders", PictureModelBinder);
        injector.bindToCollection("viewModelBinders", PictureViewModelBinder);
    }
}