class ModulesObjectsModelsWorld extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.WORLD;
        this.contents = Urso.helper.recursiveGet('contents', params, []);
        this._addBaseObject();
    }

    _addBaseObject() {
        this._baseObject = Urso.scenes.getPixiWorld();
    };
}

module.exports = ModulesObjectsModelsWorld