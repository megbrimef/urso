class ModulesObjectsModelsImage extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.IMAGE;
        this.assetKey = Urso.helper.recursiveGet('assetKey', params, false);
        this._addBaseObject();
    }

    _addBaseObject() {
        let texture = Urso.cache.getTexture(this.assetKey)

        if (!texture)
            Urso.logger.error('ModulesObjectsModelsImage assets error: no image ' + this.assetKey);

        this._baseObject = new PIXI.Sprite(texture);
    };
}

module.exports = ModulesObjectsModelsImage;
