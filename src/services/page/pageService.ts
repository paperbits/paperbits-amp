import { PageService } from "@paperbits/common/pages";
import { IObjectStorage } from "@paperbits/common/persistence";
import { IBlockService } from "@paperbits/common/blocks";
import { ILocaleService } from "@paperbits/common/localization";
import { Logger } from "@paperbits/common/logging";

export class AmpPageService extends PageService {
    public pagesPath: string = "amp-pages";

    constructor(
        objectStorage: IObjectStorage,
        blockService: IBlockService,
        localeService: ILocaleService,
        logger: Logger
    ) {
        super(objectStorage, blockService, localeService, logger);
    }
}