import ModulesObjectsBaseModel from './../baseModel';

class ModulesObjectsModelsGraphics extends ModulesObjectsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.GRAPHICS;
        this._addBaseObject();
        this._drawPoligon();
    }

    setupParams(params) {
        super.setupParams(params);

        this.polygon = Urso.helper.recursiveGet('figure.polygon', params, []);
        this.rectangle = Urso.helper.recursiveGet('figure.rectangle', params, []);
        this.fillColor = Urso.helper.recursiveGet('figure.fillColor', params, 0x000000);
    }

    _drawPoligon() {

        if (!this.polygon.length && !this.rectangle.length)
            return;

        if (this.polygon.length) {
            this._baseObject.poly(this.polygon);
        } else if (this.rectangle.length) {
            this._baseObject.rect(...this.rectangle)
        }

        // FIXED: v7 API beginFill/drawPolygon/drawRect/endFill are deprecated — v8 uses shape method then fill()
        this._baseObject.fill(this.fillColor);
    };

    _addBaseObject() {
        this._baseObject = new PIXI.Graphics();
    };
}

export default ModulesObjectsModelsGraphics;
