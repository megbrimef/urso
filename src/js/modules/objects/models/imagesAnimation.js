const ModulesObjectsBaseModel = require('./../baseModel');

class ModulesObjectsModelsImagesAnimation extends ModulesObjectsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.IMAGESANIMATION;

        //sys
        this._tween = null;
        this._currentFrame = -1;
        this._defaultTexture;
        this._animationTextures = {};

        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.assetKey = Urso.helper.recursiveGet('assetKey', params, false);

        this.duration = Urso.helper.recursiveGet('duration', params, 0);
        this.animationKeys = Urso.helper.recursiveGet('animationKeys', params, []);
        this.loop = Urso.helper.recursiveGet('loop', params, false);
        this.autostart = Urso.helper.recursiveGet('autostart', params, false);
        this.onComplete = Urso.helper.recursiveGet('onComplete', params, false);
    }

    _addBaseObject() {
        let texture = Urso.cache.getTexture(this.assetKey)

        if (!texture)
            Urso.logger.error('ModulesObjectsModelsImage assets error: no image ' + this.assetKey);

        this._defaultTexture = texture;
        this._baseObject = new PIXI.Sprite(this._defaultTexture);

        this._createAnimationTextures();

        if (this.autostart)
            this.start();
    };

    start() {
        this._createTween();
    };

    stop() {
        if (!this._tween)
            return false;

        this._stopAnimation();
    };

    _createAnimationTextures() {
        for (let key in this.animationKeys) {
            let texture = Urso.cache.getTexture(this.animationKeys[key]);

            if (!texture)
                continue;

            this._animationTextures[key] = texture;
        }

        return this._animationTextures;
    }

    _createTween() {
        const totalFrames = this.animationKeys.length;
        const tweenParams = { x: totalFrames, duration: this.duration / 1000, ease: "none" };

        if (this.loop)
            tweenParams.repeat = -1;

        this._tween = gsap.to({ x: 0 }, tweenParams);

        this._tween.eventCallback("onUpdate", this._onUpdate.bind(this));

        this._tween.eventCallback("onComplete", () => {
            this._baseObject.texture = this._defaultTexture;
            this._onComplete();
        });
    }

    _onUpdate() {
        if (!this._tween)
            return;

        let frameIndex = ~~this._tween.targets()[0].x;
        const totalFrames = this.animationKeys.length;

        const frameKey = this.animationKeys[frameIndex];

        if (this._currentFrame !== frameKey) {
            this._baseObject.texture = this._animationTextures[frameIndex];
            this._currentFrame = frameKey;
        }
    }

    _onComplete() {
        if (this.onComplete)
            this.onComplete();
    };

    _stopAnimation() {
        this._tween.kill();
        this._baseObject.texture = this._defaultTexture;

        this._onComplete();
    }

}

module.exports = ModulesObjectsModelsImagesAnimation;
