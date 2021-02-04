class ModulesObjectsModelsDragonBones extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.DRAGONBONES;
        this.assetKey = Urso.helper.recursiveGet('assetKey', params, false);

        this.defaultAnimation = {
            armatureName: Urso.helper.recursiveGet('defaultAnimation.armatureName', params, false),
            name: Urso.helper.recursiveGet('defaultAnimation.name', params, false),
            playTimes: Urso.helper.recursiveGet('defaultAnimation.playTimes', params, -1),
            autoplay: Urso.helper.recursiveGet('defaultAnimation.autoplay', params, false)
        }

        this.onStart = Urso.helper.recursiveGet('onStart', params, false);
        this.onLoop = Urso.helper.recursiveGet('onLoop', params, false);
        this.onComplete = Urso.helper.recursiveGet('onComplete', params, false);

        this._addBaseObject();
    }

    _addBaseObject() {
        let skeletonJson = Urso.cache.getJson(`${this.assetKey}_skeletonJson`);
        let textureJson = Urso.cache.getJson(`${this.assetKey}_textureJson`);
        let textureImage = Urso.cache.getImage(`${this.assetKey}_textureImage`);

        if (!skeletonJson || !textureJson || !textureImage)
            Urso.logger.error('ModulesObjectsModelsDragonBones assets error: no DragonBones object ' + this.assetKey);


        const factory = DragonBones.PixiFactory.factory;
        factory.parseDragonBonesData(skeletonJson.data);
        factory.parseTextureAtlasData(textureJson.data, textureImage.texture);

        this._baseObject = factory.buildArmatureDisplay(this.defaultAnimation.armatureName);

        this._setCommonFunctions.bind(this)();

        if (this.onStart)
            this._baseObject.addListener(DragonBones.EventObject.START, this.onStart);

        if (this.onLoop)
            this._baseObject.addListener(DragonBones.EventObject.LOOP_COMPLETE, this.onLoop);

        if (this.onComplete)
            this._baseObject.addListener(DragonBones.EventObject.COMPLETE, this.onComplete);

        const { playTimes, name, autoplay } = this.defaultAnimation;

        if (name && autoplay) {
            this._baseObject.animation.play(this.defaultAnimation.nameImage, playTimes);
        }

    };

    play(times) {
        this._baseObject.animation.play(this.defaultAnimation.nameImage, times || this.defaultAnimation.playTimes);
    }

    _setCommonFunctions() {
        this.stop = this._baseObject.animation.stop.bind(this._baseObject.animation);
    }
}

module.exports = ModulesObjectsModelsDragonBones;
