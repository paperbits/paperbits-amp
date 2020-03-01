import * as fs from "fs";
import * as path from "path";
import { HtmlPagePublisherPlugin, HtmlPage } from "@paperbits/common/publishing";
import { StyleManager } from "@paperbits/common/styles";
import { JssCompiler } from "@paperbits/styles/jssCompiler";


export class AmpStylesheetPublisherPlugin implements HtmlPagePublisherPlugin {
    private async readFile(filePath: string): Promise<string> {
        const fullPath = path.resolve(__dirname, filePath);

        return new Promise<string>((resolve, reject) => {
            fs.readFile(fullPath, { encoding: "utf-8" }, (err, content) => {
                if (err) {
                    reject(err);
                }
                resolve(content);
            });
        });
    }

    public async apply(document: Document, page: HtmlPage): Promise<void> {
        const canonicalLinkElement: HTMLStyleElement = document.createElement("link");
        canonicalLinkElement.setAttribute("rel", "canonical");
        canonicalLinkElement.setAttribute("href", page.url);
        document.head.appendChild(canonicalLinkElement);

        const styleManager: StyleManager = page.bindingContext.styleManager;
        const styleSheets = styleManager.getAllStyleSheets();
        const compiler = new JssCompiler();

        let css = await this.readFile("./assets/styles/theme.css");

        styleSheets.forEach(styleSheet => {
            css += " " + compiler.compile(styleSheet);
        });

        const customStyleElement: HTMLStyleElement = document.createElement("style");
        customStyleElement.setAttribute("type", "text/css");
        customStyleElement.setAttribute("amp-custom", "");
        customStyleElement.textContent = css.replace(/\n/g, "").replace(/\s\s+/g, " ");

        document.head.appendChild(customStyleElement);
    }
}