import ModulesAssetsBaseModel from './../baseModel';

class ModulesAssetsModelsJson extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.JSON;
    }
}

export default ModulesAssetsModelsJson;