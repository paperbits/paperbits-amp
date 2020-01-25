import { IHyperlinkProvider } from "@paperbits/common/ui";
import { HyperlinkModel } from "@paperbits/common/permalinks";


export class PageHyperlinkProvider implements IHyperlinkProvider {
    public readonly name: string = "Pages";
    public readonly componentName: string = "page-selector";
    public readonly iconClass: string = "paperbits-icon paperbits-single-content-03";

    public canHandleHyperlink(contentItemKey: string): boolean {
        return contentItemKey.startsWith("pages/");
    }

    public getHyperlinkFromResource(hyperlinkModel: HyperlinkModel): HyperlinkModel {
        return hyperlinkModel;
    }
}