class ModulesObjectsModelsWorld extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.WORLD;
        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.contents = Urso.helper.recursiveGet('contents', params, []);
    }

    _addBaseObject() {
        this._baseObject = Urso.scenes.getPixiWorld();
    };
}

module.exports = ModulesObjectsModelsWorld