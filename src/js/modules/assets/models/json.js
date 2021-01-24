class ModulesAssetsModelsJson extends Urso.Core.Modules.Assets.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.JSON;
    }
}

module.exports = ModulesAssetsModelsJson;