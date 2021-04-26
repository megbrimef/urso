class ModulesObjectsModelsAtlasImage extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.ATLASIMAGE;
        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.assetKey = Urso.helper.recursiveGet('assetKey', params, false);
        this.filenameKey = Urso.helper.recursiveGet('filenameKey', params, false);
    }

    changeTexture(filenameKey, assetKey) {
        if (assetKey)
            this.assetKey = assetKey;

        if (filenameKey)
            this.filenameKey = filenameKey;

        this._addBaseObject();
    }

    _addBaseObject() {
        const sheet = Urso.cache.getAtlas(this.assetKey)

        if (!sheet)
            Urso.logger.error('ModulesObjectsModelsImage assets error: no atlas ' + this.assetKey);

        let textureKey = this.filenameKey;

        if (!sheet.textures[textureKey] && typeof this.filenameKey === 'string') {
            let keyIndex = sheet.data.frames.findIndex((el) => { return el.filename === this.filenameKey });

            if (keyIndex !== -1)
                textureKey = keyIndex;
        }

        const texture = sheet.textures[textureKey];

        if (!this._baseObject)
            this._baseObject = new PIXI.Sprite(texture);
        else
            this._baseObject.texture = texture;
    };
}

module.exports = ModulesObjectsModelsAtlasImage;
