class ModulesAssetsModelsAtlas extends Urso.Core.Modules.Assets.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.ATLAS;
    }

    setupParams(params) {
        super.setupParams(params);

        this.cacheTextures = Urso.helper.recursiveGet('cacheTextures', params, false);
    }
}

module.exports = ModulesAssetsModelsAtlas;