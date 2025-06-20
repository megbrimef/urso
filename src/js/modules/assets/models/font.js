import ModulesAssetsBaseModel from './../baseModel';

class ModulesAssetsModelsFont extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.FONT;
    }
}

export default ModulesAssetsModelsFont;