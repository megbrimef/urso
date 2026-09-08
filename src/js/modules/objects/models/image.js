import ModulesObjectsBaseModel from './../baseModel';

class ModulesObjectsModelsImage extends ModulesObjectsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.IMAGE;
        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.assetKey = Urso.helper.recursiveGet('assetKey', params, false);
    }

    changeTexture(assetKey) {
        this.assetKey = assetKey;

        this._addBaseObject();
    }

    _addBaseObject() {
        // ADDED: Use placeholder helper to resolve texture — enables fallback to stand-in asset during lazy load
        let texture = this._resolveTextureWithPlaceholder(this.assetKey);

        if (!texture)
            Urso.logger.error('ModulesObjectsModelsImage assets error: no image with key: ' + this.assetKey);

        if (!this._baseObject)
            this._baseObject = new PIXI.Sprite(texture);
        else
            this._baseObject.texture = texture;
    };

    /**
     * refresh texture after placeholder swap
     */
    _refreshTexture() {
        // ADDED: Re-run _addBaseObject to apply real texture when it arrives — safe to call multiple times due to re-entry guard
        this._addBaseObject();
    }
}

export default ModulesObjectsModelsImage;
