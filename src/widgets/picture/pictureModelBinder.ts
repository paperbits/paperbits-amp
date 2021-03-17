import { PictureModel } from "./pictureModel";
import { PictureContract } from "./pictureContract";
import { IModelBinder } from "@paperbits/common/editing";
import { IPermalinkResolver } from "@paperbits/common/permalinks";
import { Contract } from "@paperbits/common";

export class PictureModelBinder implements IModelBinder<PictureModel> {
    constructor(private readonly permalinkResolver: IPermalinkResolver) { }

    public canHandleContract(contract: Contract): boolean {
        return contract.type === "amp-picture";
    }

    public canHandleModel(model: Object): boolean {
        return model instanceof PictureModel;
    }

    public async contractToModel(contract: PictureContract): Promise<PictureModel> {
        const model = new PictureModel();
        model.caption = contract.caption;
        model.width = contract.width;
        model.height = contract.height;
        model.styles = contract.styles || { appearance: "components/picture/default" };
        model.sourceKey = contract.sourceKey;

        if (contract.hyperlink) {
            try {
                model.hyperlink = await this.permalinkResolver.getHyperlinkFromContract(contract.hyperlink);
            }
            catch (error) {
                console.log(error);
            }
        }

        return model;
    }

    public modelToContract(pictureModel: PictureModel): PictureContract {
        const pictureContract: PictureContract = {
            type: "amp-picture",
            caption: pictureModel.caption,
            width: pictureModel.width,
            height: pictureModel.height,
            styles: pictureModel.styles
        };

        if (pictureModel.sourceKey) {
            pictureContract.sourceKey = pictureModel.sourceKey;
        }

        if (pictureModel.hyperlink) {
            pictureContract.hyperlink = {
                target: pictureModel.hyperlink.target,
                targetKey: pictureModel.hyperlink.targetKey
            };
        }

        return pictureContract;
    }
}