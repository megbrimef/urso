class ModulesObjectsModelsGraphics extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.GRAPHICS;
        this.polygon = Urso.helper.recursiveGet('figure.polygon', params, []);
        this.rectangle = Urso.helper.recursiveGet('figure.rectangle', params, []);
        this.fillColor = Urso.helper.recursiveGet('figure.fillColor', params, 0x000000);

        this._addBaseObject();
        this._drawPoligon();
    }

    _drawPoligon() {
        if (!this.polygon.length && !this.rectangle.length)
            return;

        this._baseObject.beginFill(this.fillColor);

        if (this.polygon.length) {
            this._baseObject.drawPolygon(this.polygon);
        } else if (this.rectangle.length) {
            this._baseObject.drawRect(...this.rectangle)
        }

        this._baseObject.endFill();
    };

    _addBaseObject() {
        this._baseObject = new PIXI.Graphics();
    };
}

module.exports = ModulesObjectsModelsGraphics;
