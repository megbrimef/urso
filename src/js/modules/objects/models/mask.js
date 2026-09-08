import ModulesObjectsBaseModel from './../baseModel';

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

        if (this.rectangle)
            this._drawRect(mask, this.rectangle);
        else if (this.rectangles)
            for (let rectangle of this.rectangles)
                this._drawRect(mask, rectangle);

        // FIXED: v7 API lineStyle(0), beginFill/endFill are deprecated — v8 uses fill() after shape method
        mask.fill(0xffffff);

        this._baseObject = mask;
    };

    _drawRect(maskObject, rectangle) {
        // FIXED: v7 API drawRect is deprecated — v8 uses rect() method
        maskObject.rect(rectangle[0], rectangle[1], rectangle[2], rectangle[3]);
    }
}

export default ModulesObjectsModelsMask;
