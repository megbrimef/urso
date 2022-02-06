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
     * play spine animation and execute function after animation completes
     * @param {String} animation - name of the animation to be played
     * @param {Function} func - function to be executed
     */
    playAndThen(animation, func) {
        this.playInSequenceAndThen([animation], func);
    }

    /**
     * play spine animations in sequence
     * @param {String[]} animations - names of the animations to be played
     */
    playInSequence(animations) {
        this.stop();
        const defaultTrack = 0;
        animations.forEach(e => this._baseObject.state.addAnimation(defaultTrack, e));
    }

    /**
     * play spine animations in sequence and execute function after last animation completes
     * @param {String[]} animations - names of the animations to be played
     * @param {Function} func - function to be executed
     */
    playInSequenceAndThen(animations, func) {
        let animationsLeft = animations.length;
        let removeSelf = () => { };
        let completer = {
            complete: () => {
                if (--animationsLeft === 0) {
                    func();
                    removeSelf();
                }
            }
        };
        removeSelf = () => this._baseObject.state.removeListener(completer);
        this._baseObject.state.addListener(completer);
        this.playInSequence(animations);
    }

    /**
     * stop track animation
     * @param {Number} [track] - you can define track number to stop
     */
    stopTrack(track) {
        this._baseObject.state.clearTrack(track);
    }

    /**
     * stop all animations
     */
    stop() {
        this._baseObject.state.clearTracks();
    }

    /**
     * reset all animations
     */
    reset() {
        this._baseObject.state.setEmptyAnimations();
    }

    /**
     * add object to spine slot
     * @param {String} slotName
     * @param {Object} object - created by engine object
     */
    addToSlot(slotName, object) {
        this._addToSlot(slotName, object, false);
    }

    /**
     * replace spine slot with new object
     * @param {String} slotName
     * @param {Object} object - created by engine object
     */
    replaceSlotWith(slotName, object) {
        this._addToSlot(slotName, object, true);
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
            if (this._baseObject.state.listeners.length !== 0) {
                Urso.logger.warn('ModulesObjectsModelsSpine setAnimationConfig warning: animation state listeners will be cleared');
            }
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

    _addToSlot(slotName, object, replaceSlotContents) {
        const spine = this._baseObject;
        const slotIndex = spine.spineData.slots.findIndex(({ name }) => name === slotName);
        const currentSlot = spine.slotContainers[slotIndex];

        if (currentSlot) {
            object._baseObject.scale.y = -1;

            Urso.objects.removeChild(object.parent, object);

            if (replaceSlotContents)
                currentSlot.removeChildren(); //todo check if its proxy and reset parent

            //object.parent = this; //todo && make removeChild
            currentSlot.addChild(object._baseObject);
        } else {
            Urso.logger.warn('ModulesObjectsModelsSpine _addToSlot error: no spine slot ' + slotName);
        }
    }

    /**
     * get animation timeScale
     * @returns Number
     */
    getTimeScale() {
        return Urso.scenes.timeScale * this.animation.timeScale;
    }
}

module.exports = ModulesObjectsModelsSpine;
