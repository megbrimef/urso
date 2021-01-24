class ModulesObjectsModelsContainer extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.CONTAINER;
        this.contents = Urso.helper.recursiveGet('contents', params, []);
        this._addBaseObject();
    }

    _addBaseObject() {
        this._baseObject = new PIXI.Container();
    };
}

module.exports = ModulesObjectsModelsContainer