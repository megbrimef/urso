class ModulesObjectsModelsContainer extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.CONTAINER;
        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.contents = Urso.helper.recursiveGet('contents', params, []);
    }

    _addBaseObject() {
        this._baseObject = new PIXI.Container();
    };
}

module.exports = ModulesObjectsModelsContainer