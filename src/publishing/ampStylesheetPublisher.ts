import { HtmlPagePublisherPlugin, HtmlPage } from "@paperbits/common/publishing";
import { StyleManager } from "@paperbits/common/styles";
import { JssCompiler } from "@paperbits/styles/jssCompiler";

export class AmpStylesheetPublisherPlugin implements HtmlPagePublisherPlugin {
    constructor() {
        // TODO
    }

    public async apply(document: Document, page: HtmlPage): Promise<void> {
        const styleManager: StyleManager = page.bindingContext.styleManager;
        const styleSheets = styleManager.getAllStyleSheets();
        const compiler = new JssCompiler();

        let css = "";
        styleSheets.forEach(styleSheet => {
            css += " " + compiler.styleSheetToCss(styleSheet);
        });

        const element: HTMLStyleElement = document.createElement("style");
        element.setAttribute("type", "text/css");
        element.setAttribute("amp-custom", "");
        element.textContent = css.replace(/\n/g, "").replace(/\s\s+/g, " ");

        document.head.appendChild(element);
    }
}