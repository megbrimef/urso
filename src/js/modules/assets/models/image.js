class ModulesAssetsModelsImage extends Urso.Core.Modules.Assets.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.IMAGE;
        this.preloadGPU = false;
    }
}

module.exports = ModulesAssetsModelsImage;