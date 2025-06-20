import ModulesAssetsBaseModel from './../baseModel';

class ModulesAssetsModelsImage extends ModulesAssetsBaseModel {

    constructor(params) {
        super(params);
        this.type = Urso.types.assets.IMAGE;
    }

    setupParams(params) {
        super.setupParams(params);

        this.preloadGPU = Urso.helper.recursiveGet('preloadGPU', params, false);
    }
}

export default ModulesAssetsModelsImage;
