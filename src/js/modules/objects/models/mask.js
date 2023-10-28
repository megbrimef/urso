const ModulesObjectsBaseModel = require('./../baseModel');

class ModulesObjectsModelsMask extends ModulesObjectsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.MASK;
        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        //NOTE: you can use just one key: rectangle or rectangles
        this.rectangle = Urso.helper.recursiveGet('rectangle', params, false); // [50, 50, 100, 100]
        this.rectangles = Urso.helper.recursiveGet('rectangles', params, false); //array of rectangles
    }

    _addBaseObject() {
        let mask = new PIXI.Graphics();
        mask.lineStyle(0);
        mask.beginFill(0xffffff);

        if (this.rectangle)
            this._drawRect(mask, this.rectangle);
        else if (this.rectangles)
            for (let rectangle of this.rectangles)
                this._drawRect(mask, rectangle);

        mask.endFill();

        this._baseObject = mask;
    };

    _drawRect(maskObject, rectangle) {
        maskObject.drawRect(rectangle[0], rectangle[1], rectangle[2], rectangle[3]);
    }
}

module.exports = ModulesObjectsModelsMask;
