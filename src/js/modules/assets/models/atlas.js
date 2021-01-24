class ModulesAssetsModelsAtlas extends Urso.Core.Modules.Assets.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.ATLAS;
    }
}

module.exports = ModulesAssetsModelsAtlas;