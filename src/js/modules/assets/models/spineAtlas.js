const ModulesAssetsBaseModel = require('./../baseModel');

class ModulesAssetsModelsSpineAtlas extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.SPINEATLAS;
    }
}

module.exports = ModulesAssetsModelsSpineAtlas;