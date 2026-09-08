import ModulesObjectsBaseModel from './../baseModel';

class ModulesObjectsModelsNineSlicePlane extends ModulesObjectsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.NINESLICEPLANE;
        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.assetKey = Urso.helper.recursiveGet('assetKey', params, false);
        this.leftWidth = Urso.helper.recursiveGet('leftWidth', params, false);
        this.topHeight = Urso.helper.recursiveGet('topHeight', params, false);
        this.rightWidth = Urso.helper.recursiveGet('rightWidth', params, false);
        this.bottomHeight = Urso.helper.recursiveGet('bottomHeight', params, false);
    }


    _addBaseObject() {
        let texture = Urso.cache.getTexture(this.assetKey)

        if (!texture)
            // FIXED: error message incorrectly said 'ModulesObjectsModelsImage' — should be 'ModulesObjectsModelsNineSlicePlane'
            Urso.logger.error('ModulesObjectsModelsNineSlicePlane assets error: no image with key: ' + this.assetKey);

        // FIXED: v8 NineSlicePlane constructor takes single options object, not positional border width args — positional args silently dropped
        this._baseObject = new PIXI.NineSliceSprite({
            texture,
            leftWidth: this.leftWidth,
            topHeight: this.topHeight,
            rightWidth: this.rightWidth,
            bottomHeight: this.bottomHeight
        });
    };
}

export default ModulesObjectsModelsNineSlicePlane;
