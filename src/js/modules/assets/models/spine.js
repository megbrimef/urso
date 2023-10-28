const ModulesAssetsBaseModel = require('./../baseModel');

class ModulesAssetsModelsSpine extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.SPINE;
    }

    setupParams(params) {
        super.setupParams(params);

        this.noAtlas = Urso.helper.recursiveGet('noAtlas', params, false);
    }
}

module.exports = ModulesAssetsModelsSpine;