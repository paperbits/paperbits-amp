import { ToolButton, ViewManager, View } from "@paperbits/common/ui";

const helpText = "<h1>AMP pages</h1><p>Add or edit pages of your website. Each page has a unique URL, which also automatically defines the layout it is part of.</p>";

export class PagesToolButton implements ToolButton {
    public iconClass: string = "paperbits-icon paperbits-lightning";
    public title: string = "AMP pages";
    public readonly tooltip: string = helpText;

    constructor(private readonly viewManager: ViewManager) { }

    public onActivate(): void {
        this.viewManager.clearJourney();

        const view: View = {
            heading: this.title,
            helpText: helpText,
            component: { name: "amp-pages" }
        };

        this.viewManager.openViewAsWorkshop(view);
    }
}