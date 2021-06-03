class ModulesObjectsModelsSpine extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.SPINE;
        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.assetKey = Urso.helper.recursiveGet('assetKey', params, false);

        this.defaultAnimation = {
            name: Urso.helper.recursiveGet('defaultAnimation.name', params, false),
            loop: Urso.helper.recursiveGet('defaultAnimation.loop', params, false)
        }

        this.onComplete = Urso.helper.recursiveGet('onComplete', params, false);  //todo
    }

    play(animationName, loopFlag = false, track = 0) {
        this._baseObject.state.setAnimation(track, animationName, loopFlag);
    }

    addToSlot(object, slotName) {
        const spine = this._baseObject;
        const slotIndex = spine.spineData.slots.findIndex(({ name }) => name === slotName);
        const currentSlot = spine.slotContainers[slotIndex];

        if (currentSlot) {
            object._baseObject.scale.y = -1;

            Urso.objects.removeChild(object.parent, object)
            currentSlot.addChild(object._baseObject);
        } else {
            Urso.logger.warn('ModulesObjectsModelsSpine addToSlot error: no spine slot ' + slotName);
        }
    }

    _addBaseObject() {
        let spineAsset = Urso.cache.getSpine(this.assetKey);

        if (!spineAsset)
            Urso.logger.error('ModulesObjectsModelsSpine assets error: no spine object ' + this.assetKey);

        this._baseObject = new PIXI.spine.Spine(spineAsset.spineData);

        if (this.defaultAnimation && this.defaultAnimation.name)
            this.play(this.defaultAnimation.name, this.defaultAnimation.loop);
    };
}

module.exports = ModulesObjectsModelsSpine;
