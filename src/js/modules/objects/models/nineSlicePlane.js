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
        // ADDED: Use placeholder helper to resolve texture — enables fallback to stand-in asset during lazy load
        let texture = this._resolveTextureWithPlaceholder(this.assetKey);

        if (!texture)
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

    /**
     * refresh texture after placeholder swap
     */
    _refreshTexture() {
        // ADDED: Assign texture to existing sprite instead of rebuilding — prevents duplicate sprite in scene graph
        const texture = Urso.cache.getTexture(this._placeholderAssetKey);
        if (texture)
            this._baseObject.texture = texture;
    }
}

export default ModulesObjectsModelsNineSlicePlane;
