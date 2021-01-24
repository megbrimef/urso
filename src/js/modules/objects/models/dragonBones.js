class ModulesObjectsModelsDragonBones extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.DRAGONBONES;
        this.assetKey = Urso.helper.recursiveGet('assetKey', params, false);

        this.defaultAnimation = {
            armatureName: Urso.helper.recursiveGet('defaultAnimation.armatureName', params, false),
            name: Urso.helper.recursiveGet('defaultAnimation.name', params, false),
            loop: Urso.helper.recursiveGet('defaultAnimation.loop', params, false)
        }

        this.onComplete = Urso.helper.recursiveGet('onComplete', params, false);  //todo

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

        if (this.defaultAnimation && this.defaultAnimation.name)
            this._baseObject.animation.play(this.defaultAnimation.nameImage);

        this._setCommonFunctions.bind(this)();
    };

    _setCommonFunctions(){
        this.stop = this._baseObject.animation.stop.bind(this._baseObject.animation);
        this.play = this._baseObject.animation.play.bind(this._baseObject.animation);
    }
}

module.exports = ModulesObjectsModelsDragonBones;
