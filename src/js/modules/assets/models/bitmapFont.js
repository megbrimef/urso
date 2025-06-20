import ModulesAssetsBaseModel from './../baseModel';

class ModulesAssetsModelsBitmapFont extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.BITMAPFONT;
    }
}

export default ModulesAssetsModelsBitmapFont;