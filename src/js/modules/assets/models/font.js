const ModulesAssetsBaseModel = require('./../baseModel');

class ModulesAssetsModelsFont extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.FONT;
    }
}

module.exports = ModulesAssetsModelsFont;