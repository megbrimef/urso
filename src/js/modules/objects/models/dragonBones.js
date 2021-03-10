class ModulesObjectsModelsDragonBones extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.DRAGONBONES;

        this.setAnimationConfig(null, true);
        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.assetKey = Urso.helper.recursiveGet('assetKey', params, false);

        this.animation = {
            armatureName: Urso.helper.recursiveGet('animation.armatureName', params, false),
            playTimes: Urso.helper.recursiveGet('animation.playTimes', params, -1),
            autoplay: Urso.helper.recursiveGet('animation.autoplay', params, false),
            onStart: Urso.helper.recursiveGet('animation.onStart', params, false),
            onLoop: Urso.helper.recursiveGet('animation.onLoop', params, false),
            onComplete: Urso.helper.recursiveGet('animation.onComplete', params, false)
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

    _setCallbacks() {
        const { onStart, onLoop, onComplete } = this.animation;

        if (onStart)
            this._baseObject.addListener(DragonBones.EventObject.START, onStart.bind(this));

        if (onLoop)
            this._baseObject.addListener(DragonBones.EventObject.LOOP_COMPLETE, onLoop.bind(this));

        if (onComplete)
            this._baseObject.addListener(DragonBones.EventObject.COMPLETE, onComplete.bind(this));
    }

    /**
     * 
     * @param {*} config 
     * @param {boolean} [noObjectCreate] dont use this flag out of core
     * 
     * config keys:
     *      armatureName
            playTimes
            autoplay
            onStart
            onLoop
            onComplete
     */
    setAnimationConfig(config = {}, noObjectCreate) {
        if (this.stop)
            this.stop();

        this.animation = {
            ...this.animation,
            ...config
        };

        if (noObjectCreate)
            return;

        let parent = null;

        if (this._baseObject) {
            parent = this._baseObject.parent;
            this._baseObject.destroy();
        }

        const assets = this._getAssets();

        if (assets)
            this._createAnimationObject(assets);

        if (parent)
            parent.addChild(this._baseObject);
    }

    /**
     * run play animation
     * @param {number} times 
     */
    play(times) {
        if (!this._baseObject.animation) {
            Urso.logger.error(`DragonBones animation not found!`);
            return;
        }

        this._baseObject.animation.play(this.animation.nameImage, times || this.animation.playTimes);
    }

    _setCommonFunctions() {
        this.stop = this._baseObject.animation.stop.bind(this._baseObject.animation);
    }
}

module.exports = ModulesObjectsModelsDragonBones;
