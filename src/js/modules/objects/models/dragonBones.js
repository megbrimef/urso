class ModulesObjectsModelsDragonBones extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);
        this.type = Urso.types.objects.DRAGONBONES;

        this._onStart = null;
        this._onLoop = null;
        this._onComplete = null;
        this._onCompleteOnce = null;

        this.setAnimationConfig({}, true);
        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.assetKey = Urso.helper.recursiveGet('assetKey', params, false);

        this.animation = {
            timeScale: 1,
            animationName: Urso.helper.recursiveGet('animation.animationName', params, false),
            armatureName: Urso.helper.recursiveGet('animation.armatureName', params, false),
            autoplay: Urso.helper.recursiveGet('animation.autoplay', params, false),
            onStart: Urso.helper.recursiveGet('animation.onStart', params, false),
            onLoop: Urso.helper.recursiveGet('animation.onLoop', params, false),
            onComplete: Urso.helper.recursiveGet('animation.onComplete', params, false),
            onCompleteOnce: Urso.helper.recursiveGet('animation.onCompleteOnce', params, false)
        };
    }

    _addBaseObject() {
        const assets = this._getAssets();

        if (!this.animation.armatureName || !assets) {
            this._baseObject = new PIXI.Sprite();
            return;
        }

        this._createAnimationObject(assets);

        const { autoplay } = this.animation;

        if (autoplay)
            this.play();
    };

    _getAssets() {
        const skeletonJson = Urso.cache.getJson(`${this.assetKey}_skeletonJson`);
        const textureJson = Urso.cache.getJson(`${this.assetKey}_textureJson`);
        const textureImage = Urso.cache.getImage(`${this.assetKey}_textureImage`);

        if (!skeletonJson || !textureJson || !textureImage) {
            Urso.logger.error('ModulesObjectsModelsDragonBones assets error: no DragonBones object ' + this.assetKey);
            return false;
        }

        return { skeletonJson, textureJson, textureImage };
    }

    _createAnimationObject({ skeletonJson, textureJson, textureImage }) {
        const factory = DragonBones.PixiFactory.factory;
        const { armatureName } = this.animation;

        if (!factory._dragonBonesDataMap[skeletonJson.data.name])
            factory.parseDragonBonesData(skeletonJson.data);

        factory.parseTextureAtlasData(textureJson.data, textureImage.texture);

        this._baseObject = factory.buildArmatureDisplay(armatureName);

        this._setCommonFunctions.bind(this)();

        this._setCallbacks();
    }

    _removeCallbacks(config) {
        if (this._onStart && config.onStart) {
            this._baseObject.removeListener(DragonBones.EventObject.START, this._onStart);
            this._onStart = null;
        }

        if (this._onLoop && config.onLoop) {
            this._baseObject.removeListener(DragonBones.EventObject.LOOP_COMPLETE, this._onLoop);
            this._onLoop = null;
        }

        if (this._onComplete && config.onComplete) {
            this._baseObject.removeListener(DragonBones.EventObject.COMPLETE, this._onComplete);
            this._onComplete = null;
        }

        if (this._onCompleteOnce && config.onCompleteOnce) {
            this._removeOnCompleteOnce(config);
        }
    };

    _removeOnCompleteOnce() {
        this._baseObject.removeListener(DragonBones.EventObject.COMPLETE, this._onCompleteOnce);
        this._onCompleteOnce = null;
    }

    _setCallbacks() {
        if (this.animation.onStart) {
            this._onStart = this.animation.onStart.bind(this);
            this._baseObject.addListener(DragonBones.EventObject.START, this._onStart);
        }

        if (this.animation.onLoop) {
            this._onLoop = this.animation.onLoop.bind(this);
            this._baseObject.addListener(DragonBones.EventObject.LOOP_COMPLETE, this._onLoop);
        }

        if (this.animation.onComplete) {
            this._onComplete = this.animation.onComplete.bind(this);
            this._baseObject.addListener(DragonBones.EventObject.COMPLETE, this._onComplete);
        }

        if (this.animation.onCompleteOnce) {
            const onCompleteOnce = this.animation.onCompleteOnce.bind(this);

            this.animation.onCompleteOnce = null;

            this._onCompleteOnce = () => {
                this._removeOnCompleteOnce();
                onCompleteOnce();
            };

            this._baseObject.once(DragonBones.EventObject.COMPLETE, this._onCompleteOnce);
        }
    }
    /**
     * 
     * @param {*} config 
     * @param {boolean} [noObjectCreate] dont use this flag out of core
     * 
     * config keys:
     *      animationName
     *      armatureName
            autoplay
            timeScale
            onStart
            onLoop
            onComplete
            onCompleteOnce
     */
    setAnimationConfig(config = {}, noObjectCreate) {
        if (this.stop)
            this.stop();

        this.animation = {
            ...this.animation,
            ...config
        };

        if (config.timeScale)
            this._baseObject.animation.timeScale = config.timeScale;

        if (config.onStart || config.onLoop || config.onComplete || config.onCompleteOnce) {
            this._removeCallbacks(config);
            this._setCallbacks();
        }

        if (noObjectCreate || !config.armatureName)
            return;

        let parent = null;

        if (this._baseObject) {
            parent = this._baseObject.parent;
            this._baseObject.destroy();
        }

        const assets = this._getAssets();

        if (assets)
            this._createAnimationObject(assets);

        if (parent) {
            parent.addChild(this._baseObject);
            //update common properties after adding to apply model settings
            Urso.objects._updateCommonProperties(this);
        }
    }

    /**
     * run play animation
     * @param {number} times 
     */
    play(animationName, loopFlag = false) {
        if (!this._baseObject.animation) {
            Urso.logger.error(`DragonBones animation not found!`);
            return;
        }

        if (this.stop)
            this.stop();

        const times = (loopFlag) ? -1 : 1;

        this._baseObject.animation.play(animationName, times);
    }

    _setCommonFunctions() {
        this.stop = this._baseObject.animation.stop.bind(this._baseObject.animation);
    }
}

module.exports = ModulesObjectsModelsDragonBones;
