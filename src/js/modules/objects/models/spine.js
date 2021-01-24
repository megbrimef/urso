class ModulesObjectsModelsSpine extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.SPINE;
        this.assetKey = Urso.helper.recursiveGet('assetKey', params, false);

        this.defaultAnimation = {
            name: Urso.helper.recursiveGet('defaultAnimation.name', params, false),
            loop: Urso.helper.recursiveGet('defaultAnimation.loop', params, false)
        }

        this.onComplete = Urso.helper.recursiveGet('onComplete', params, false);  //todo

        this._addBaseObject();
    }

    _addBaseObject() {
        let spineAsset = Urso.cache.getSpine(this.assetKey);

        if (!spineAsset)
            Urso.logger.error('ModulesObjectsModelsSpine assets error: no spine object ' + this.assetKey);

        this._baseObject = new PIXI.spine.Spine(spineAsset.spineData);

        if (this.defaultAnimation && this.defaultAnimation.name)
            this._baseObject.state.setAnimation(0, this.defaultAnimation.name, this.defaultAnimation.loop);
    };
}

module.exports = ModulesObjectsModelsSpine;
