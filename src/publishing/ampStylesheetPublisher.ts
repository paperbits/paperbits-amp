import { HtmlPagePublisherPlugin, HtmlPage } from "@paperbits/common/publishing";
import { StyleManager } from "@paperbits/common/styles";
import { JssCompiler } from "@paperbits/styles/jssCompiler";
import * as fs from "fs";
import * as path from "path";

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

        const themeCss = await this.readFile("./assets/styles/theme.css");

        // const collapsiblesCss = ".collapsible-container{flex-wrap:wrap}.collapsible-content{display:none;flex-basis:100%;flex-wrap:wrap;-webkit-box-align:center;align-items:center}.collapsible-panel{-webkit-box-flex:1;flex:1}.collapsible-panel .collapsible-panel-open{display:block;border:none;background:0 0;padding:10px;border-radius:10px;margin:0 10px;cursor:pointer;margin-left:auto}.collapsible-panel .collapsible-panel-close{display:none;border:none;background:0 0;padding:10px;margin:0 10px;cursor:pointer;position:absolute;right:0}.backdrop{opacity:0;position:fixed;top:0;left:0;right:0;bottom:0;background:#000000c9;z-index:8500;display:none;-webkit-animation:fadeIn .2s linear forwards;animation:fadeIn .2s linear forwards}@media (min-width:768px){.collapsible-panel>.collapsible-content{display:-webkit-box;display:flex}.collapsible-panel .collapsible-panel-open{display:none}}.collapsible.expanded>.collapsible-content{display:-webkit-box;display:flex;position:absolute}.collapsible-panel.collapsible.expanded>.collapsible-content{top:0;right:0;bottom:0;z-index:9000;position:fixed;-webkit-animation:slideInRight .2s linear forwards;animation:slideInRight .2s linear forwards}.collapsible-panel.collapsible.expanded>.collapsible-content>.collapsible-panel-close{display:block;top:0;right:0}.collapsible-panel.collapsible.expanded .backdrop{display:block}@media (max-width:768px){.collapsible-panel .collapsible-panel-open{display:block}}";
        let css = "*{position:relative}body,html{height:100%;width:100%;display:flex;flex-direction:column}.stretch{flex:1;height:100%}layout,main{flex:1;flex-direction:column;display:flex}.block{display:block;flex-basis:100%} html:not([amp4ads]),html:not([amp4ads]) body{min-height:100%;display:flex;flex:1;} " + themeCss;

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