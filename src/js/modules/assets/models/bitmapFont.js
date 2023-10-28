const ModulesAssetsBaseModel = require('./../baseModel');

class ModulesAssetsModelsBitmapFont extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.BITMAPFONT;
    }
}

module.exports = ModulesAssetsModelsBitmapFont;