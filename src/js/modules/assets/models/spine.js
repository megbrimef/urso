class ModulesAssetsModelsSpine extends Urso.Core.Modules.Assets.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.SPINE;
    }
}

module.exports = ModulesAssetsModelsSpine;