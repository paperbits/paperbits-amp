import { Size } from "@paperbits/styles/size";
import * as ko from "knockout";


ko.bindingHandlers["ampSize"] = {
    update: (element: HTMLElement, valueAccessor) => {

        const config = valueAccessor();
        const width = ko.unwrap(config.width);
        const height = ko.unwrap(config.height);

        const parsedWidth = Size.parse(width);
        const parsedHeight = Size.parse(height);

        if (width) {
            element.setAttribute("width", parsedWidth.value.toString());
        }
        else {
            element.removeAttribute("width");
        }

        if (height) {
            element.setAttribute("height", parsedHeight.value.toString());
        }
        else {
            element.removeAttribute("height");
        }

        // Additional styling for design-time.
        if (typeof location === "object") {
            element.style.width = parsedWidth.toString();
            element.style.height = parsedHeight.toString();
        }
    }
};
