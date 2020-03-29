import { PageService } from "@paperbits/common/pages";
import { IObjectStorage } from "@paperbits/common/persistence";
import { IBlockService } from "@paperbits/common/blocks";
import { ILocaleService } from "@paperbits/common/localization";

export class AmpPageService extends PageService {
    public pagesPath: string = "amp-pages";

    constructor(
        objectStorage: IObjectStorage,
        blockService: IBlockService,
        localeService: ILocaleService
    ) {
        super(objectStorage, blockService, localeService);
    }
}