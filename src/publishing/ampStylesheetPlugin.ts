import * as fs from "fs";
import { MimeTypes } from "@paperbits/common";
import { Attributes } from "@paperbits/common/html";
import { HtmlPage } from "@paperbits/common/publishing/htmlPage";
import { HtmlPagePublisherPlugin } from "@paperbits/common/publishing/htmlPagePublisherPlugin";
import { StyleManager } from "@paperbits/common/styles";
import { JssCompiler } from "@paperbits/styles/jssCompiler";


export class AmpStylesheetPublisherPlugin implements HtmlPagePublisherPlugin {
    private async readFileAsString(filepath: string): Promise<string> {
        return fs.promises.readFile(filepath, { encoding: "utf8" });
    }

    public async apply(document: Document, page: HtmlPage): Promise<void> {
        const canonicalLinkElement: HTMLStyleElement = document.createElement("link");
        canonicalLinkElement.setAttribute(Attributes.Rel, "canonical");
        canonicalLinkElement.setAttribute(Attributes.Href, page.url);
        document.head.appendChild(canonicalLinkElement);

        const styleManager: StyleManager = page.bindingContext.styleManager;
        const styleSheets = styleManager.getAllStyleSheets();
        const compiler = new JssCompiler();

        let css = await this.readFileAsString("./assets/styles/theme.css");

        styleSheets.forEach(styleSheet => {
            css += " " + compiler.compile(styleSheet);
        });

        const customStyleElement: HTMLStyleElement = document.createElement("style");
        customStyleElement.setAttribute(Attributes.Type, MimeTypes.textCss);
        customStyleElement.setAttribute("amp-custom", "");
        customStyleElement.textContent = css.replace(/\n/g, "").replace(/\s\s+/g, " ");

        document.head.appendChild(customStyleElement);
    }
}