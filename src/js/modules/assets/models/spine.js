import ModulesAssetsBaseModel from './../baseModel';

class ModulesAssetsModelsSpine extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.SPINE;
    }

    setupParams(params) {
        super.setupParams(params);

        this.key = Urso.helper.recursiveGet('key', params, false);
        this.noAtlas = Urso.helper.recursiveGet('noAtlas', params, false);
    }
}

export default ModulesAssetsModelsSpine;