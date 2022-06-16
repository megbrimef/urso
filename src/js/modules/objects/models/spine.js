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
     * set skin by name
     * @param {String} skinName 
     */
    setSkinByName(skinName) {
        this._baseObject.skeleton.setSkinByName(skinName);
    }

    /**
     * reset animation to first frame
     */
    setToSetupPose() {
        this._baseObject.skeleton.setToSetupPose();
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
        this._playInSequenceAndThen(animations);
    }

    /**
     * play spine animations in sequence and execute function after last animation completes
     * @param {String[]} animations - names of the animations to be played
     * @param {Function} func - function to be executed
     */
    playInSequenceAndThen(animations, func) {
        this._playInSequenceAndThen(animations, func);
    }

    /**
     * play spine animations in sequence and execute function after last animation completes
     * @param {String[]} animations - names of the animations to be played
     * @param {Function} func - function to be executed
     */
    _playInSequenceAndThen(animations, func) {
        this.stop();
        let removeSelf = () => { };
        let animationCount = 0;

        const completer = {
            complete: () => {
                animationCount++;

                if (animations[animationCount])
                    this.play(animations[animationCount])
                else {
                    func && func();
                    removeSelf();
                }
            }
        }

        removeSelf = () => this._baseObject.state.removeListener(completer);
        this._baseObject.state.addListener(completer);
        this.play(animations[0]);
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
     * returns skeleton's child by it's name
     * @param {string} name 
     * @returns {DisplayObject}
     */
    getChildByName(name) {
        return this.children[this._baseObject.skeleton.findSlotIndex(name)];
    }

    /**
     * returns skeleton's slot by it's name
     * @param {string} name 
     * @returns {Slot}
     */
    findSlot(name) {
        return this._baseObject.skeleton.findSlot(name)
    }

    /**
     * returns skeleton's bone by it's name
     * @param {string} name 
     * @returns {Bone}
     */
    findBone(name) {
        return this._baseObject.skeleton.findBone(name)
    }

    /**
     * returns animation from spineData by it's name
     * @param {string} name 
     * @returns {Animation}
     */
    findAnimation(name) {
        return this._baseObject.spineData.findAnimation(name)
    }


    /**
     * returns event from spineData by it's name
     * @param {string} name 
     * @returns {EventData}
     */
    findEvent(name) {
        return this._baseObject.spineData.findEvent(name)
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

            Urso.objects.removeChild(object.parent, object, true);

            if (replaceSlotContents)
                currentSlot.removeChildren(); //todo check if its proxy and reset parent

            object.parent = this; //todo make removeChild for addedToSlotObjects
            currentSlot.addChild(object._baseObject);
            Urso.objects.refreshStyles();
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
