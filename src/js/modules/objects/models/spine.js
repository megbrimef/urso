class ModulesObjectsModelsSpine extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.SPINE;
        this._addBaseObject();
    }

    /**
     * setup params to object model
     * @param {Object} params
     */
    setupParams(params) {
        super.setupParams(params);

        this.assetKey = Urso.helper.recursiveGet('assetKey', params, false);

        this.animation = {
            timeScale: Urso.helper.recursiveGet('animation.timeScale', params, 1),
            name: Urso.helper.recursiveGet('animation.name', params, false),
            loop: Urso.helper.recursiveGet('animation.loop', params, false),
            onComplete: Urso.helper.recursiveGet('animation.onComplete', params, false)
        };

        params.animation = this.animation; //we redefine original property here
    }

    /**
     * play spine animation
     * @param {String} animationName
     * @param {Boolean} [loopFlag]
     * @param {Number} [track] - you can define track number for current animation
     */
    play(animationName, loopFlag = false, track = 0) {
        this._baseObject.state.setAnimation(track, animationName, loopFlag);
    }

    /**
     * stop track animation or all animations
     * @param {Number} [track] - you can define track number to stop
     */
    stop(track) {
        if (typeof track !== 'undefined')
            this._baseObject.state.clearTrack(track);
        else
            this._baseObject.state.clearTracks();
    }

    /**
     * add object to spine slot
     * @param {Object} object - created by engine object
     * @param {String} slotName
     * @param {Boolean} replaceSlotContent - will replace other slot content
     */
    addToSlot(object, slotName, replaceSlotContent) {
        const spine = this._baseObject;
        const slotIndex = spine.spineData.slots.findIndex(({ name }) => name === slotName);
        const currentSlot = spine.slotContainers[slotIndex];

        if (currentSlot) {
            object._baseObject.scale.y = -1;

            Urso.objects.removeChild(object.parent, object);

            if (replaceSlotContent)
                currentSlot.removeChildren(); //todo check if its proxy and reset parent

            //object.parent = this; //todo && make removeChild
            currentSlot.addChild(object._baseObject);
        } else {
            Urso.logger.warn('ModulesObjectsModelsSpine addToSlot error: no spine slot ' + slotName);
        }
    }

    /**
     * replace spine slot with new object
     * @param {Object} object - created by engine object
     * @param {String} slotName
     */
    replaceSlotWith(object, slotName) {
        this.addToSlot(object, slotName, true);
    }

    /**
     * set/update animation config
     * @param {*} config
     * @param {boolean} [noObjectCreate] dont use this flag out of core
     *
     * config keys:
            timeScale
            onComplete
     */
    setAnimationConfig(config = {}, noObjectCreate) {
        this.animation = {
            ...this.animation,
            ...config
        };

        /*if (config.timeScale)
            this._baseObject.state.timeScale = config.timeScale;*/ //deprecated - now we use getTimeScale getter

        if (config.onComplete) {
            this._baseObject.state.clearListeners();
            this._baseObject.state.addListener({ complete: this.animation.onComplete });
        }
    }

    /**
     * system function
     * add object to pixi tree
     */
    _addBaseObject() {
        let spineAsset = Urso.cache.getSpine(this.assetKey);

        if (!spineAsset)
            Urso.logger.error('ModulesObjectsModelsSpine assets error: no spine object ' + this.assetKey);

        this._baseObject = new PIXI.spine.Spine(spineAsset.spineData);
        //this._baseObject.state.timeScale = this.animation.timeScale;
        Object.defineProperty(this._baseObject.state, 'timeScale', { get: this.getTimeScale.bind(this) });

        if (this.animation.onComplete)
            this._baseObject.state.addListener({ complete: this.animation.onComplete });

        if (this.animation.name)
            this.play(this.animation.name, this.animation.loop);
    };

    /**
     * get animation timeScale
     * @returns Number
     */
    getTimeScale() {
        return Urso.scenes.timeScale * this.animation.timeScale;
    }
}

module.exports = ModulesObjectsModelsSpine;
