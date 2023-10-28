const ModulesAssetsBaseModel = require('./../baseModel');

class ModulesAssetsModelsJson extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.JSON;
    }
}

module.exports = ModulesAssetsModelsJson;