import { HtmlPagePublisherPlugin, HtmlPage } from "@paperbits/common/publishing";
import { StyleManager } from "@paperbits/common/styles";
import { JssCompiler } from "@paperbits/styles/jssCompiler";

export class AmpStylesheetPublisherPlugin implements HtmlPagePublisherPlugin {
    public async apply(document: Document, page: HtmlPage): Promise<void> {
        const canonicalLinkElement: HTMLStyleElement = document.createElement("link");
        canonicalLinkElement.setAttribute("rel", "canonical");
        canonicalLinkElement.setAttribute("href", page.url);
        document.head.appendChild(canonicalLinkElement);

        const styleManager: StyleManager = page.bindingContext.styleManager;
        const styleSheets = styleManager.getAllStyleSheets();
        const compiler = new JssCompiler();

        let css = "*{position:relative}body,html{height:100%;width:100%;display:flex;flex-direction:column}.stretch{flex:1;height:100%}layout,main{flex:1;flex-direction:column;display:flex}.block{display:block;flex-basis:100%} html:not([amp4ads]),html:not([amp4ads]) body{min-height:100%;display:flex;flex:1;}";
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