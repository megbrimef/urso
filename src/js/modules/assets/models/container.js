class ModulesAssetsModelsContainer extends Urso.Core.Modules.Assets.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.CONTAINER;
        this.contents = Urso.helper.recursiveGet('contents', params, []);
        this.key = false;
        this.path = false;
    }
}

module.exports = ModulesAssetsModelsContainer;