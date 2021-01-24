class ModulesObjectsModelsGraphics extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.GRAPHICS;
        this._addBaseObject();
    }

    _addBaseObject() {
        this._baseObject = new PIXI.Graphics();
    };
}

module.exports = ModulesObjectsModelsGraphics;
