import ModulesAssetsBaseModel from './../baseModel';

class ModulesAssetsModelsJsonAtlas extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.JSONATLAS;
    }
}

export default ModulesAssetsModelsJsonAtlas;