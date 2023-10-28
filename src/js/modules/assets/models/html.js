const ModulesAssetsBaseModel = require('./../baseModel');

class ModulesAssetsModelsHtml extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.HTML;
    }
}

module.exports = ModulesAssetsModelsHtml;