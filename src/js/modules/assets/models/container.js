const ModulesAssetsBaseModel = require('./../baseModel');

class ModulesAssetsModelsContainer extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.CONTAINER;
        this.key = false;
        this.path = false;
    }

    setupParams(params) {
        super.setupParams(params);

        this.contents = Urso.helper.recursiveGet('contents', params, []);
    }
}

module.exports = ModulesAssetsModelsContainer;