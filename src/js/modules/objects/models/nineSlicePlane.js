const ModulesObjectsBaseModel = require('./../baseModel');

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
            Urso.logger.error('ModulesObjectsModelsImage assets error: no image with key: ' + this.assetKey);

        this._baseObject = new PIXI.NineSlicePlane(texture, this.leftWidth, this.topHeight, this.rightWidth, this.bottomHeight);
    };
}

module.exports = ModulesObjectsModelsNineSlicePlane;
