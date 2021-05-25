class ModulesObjectsModelsImage extends Urso.Core.Modules.Objects.BaseModel {
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
        let texture = Urso.cache.getTexture(this.assetKey)

        if (!texture)
            Urso.logger.error('ModulesObjectsModelsImage assets error: no image with key: ' + this.assetKey);

        if (!this._baseObject)
            this._baseObject = new PIXI.Sprite(texture);
        else
            this._baseObject.texture = texture;
    };
}

module.exports = ModulesObjectsModelsImage;
