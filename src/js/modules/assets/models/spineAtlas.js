import ModulesAssetsBaseModel from './../baseModel';

class ModulesAssetsModelsSpineAtlas extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.SPINEATLAS;
    }
}

export default ModulesAssetsModelsSpineAtlas;