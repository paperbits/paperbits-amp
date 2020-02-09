import { HtmlPagePublisherPlugin, HtmlPage } from "@paperbits/common/publishing";
import { StyleManager } from "@paperbits/common/styles";
import { JssCompiler } from "@paperbits/styles/jssCompiler";

export class AmpStylesheetPublisherPlugin implements HtmlPagePublisherPlugin {
    constructor() {
        // TODO
    }

    public async apply(document: Document, page: HtmlPage): Promise<void> {
        const canonicalLinkElement: HTMLStyleElement = document.createElement("link");
        canonicalLinkElement.setAttribute("rel", "canonical");
        canonicalLinkElement.setAttribute("href", page.url);
        document.head.appendChild(canonicalLinkElement);

        const styleManager: StyleManager = page.bindingContext.styleManager;
        const styleSheets = styleManager.getAllStyleSheets();
        const compiler = new JssCompiler();

        let css = "";
        styleSheets.forEach(styleSheet => {
            css += " " + compiler.styleSheetToCss(styleSheet);
        });

        const customStyleElement: HTMLStyleElement = document.createElement("style");
        customStyleElement.setAttribute("type", "text/css");
        customStyleElement.setAttribute("amp-custom", "");
        customStyleElement.textContent = css.replace(/\n/g, "").replace(/\s\s+/g, " ");

        document.head.appendChild(customStyleElement);
    }
}