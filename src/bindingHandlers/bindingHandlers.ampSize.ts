import * as ko from "knockout";


ko.bindingHandlers["ampSize"] = {
    update: (element: HTMLElement, valueAccessor) => {

        const config = valueAccessor();
        const width = ko.unwrap(config.width);
        const height = ko.unwrap(config.height);

        if (width) {
            element.setAttribute("width", width);
        }
        else {
            element.removeAttribute("width");
        }

        if (height) {
            element.setAttribute("height", height);
        }
        else {
            element.removeAttribute("height");
        }

        // Additional styling for design-time.
        if (typeof location === "object") {
            element.style.width = width ? width + "px" : null;
            element.style.height = height ? height + "px" : null;
        }
    }
};
