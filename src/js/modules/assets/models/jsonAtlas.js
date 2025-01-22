const ModulesAssetsBaseModel = require('./../baseModel');

class ModulesAssetsModelsJsonAtlas extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.JSONATLAS;
    }
}

module.exports = ModulesAssetsModelsJsonAtlas;