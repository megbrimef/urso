/*buttonModel = {
    name: 'someButton',
    buttonFrames:{
        over: 'over.png', //asset key or container object
        out: 'out.png',
        pressed: 'pressed.png',
        disabled: 'disabled.png'
    }
}*/

class ModulesObjectsModelsButton extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this._isOver = false;
        this._isDown = false;
        this._isDisabled = false;
        this._textures;

        this.type = Urso.types.objects.BUTTON;
        this.action = Urso.helper.recursiveGet('action', params, () => { this.emit(Urso.events.MODULES_OBJECTS_BUTTON_PRESS, this.name) });
        this.buttonFrames = {
            over: Urso.helper.recursiveGet('buttonFrames.over', params, false),
            out: Urso.helper.recursiveGet('buttonFrames.out', params, false),
            pressed: Urso.helper.recursiveGet('buttonFrames.pressed', params, false),
            disabled: Urso.helper.recursiveGet('buttonFrames.disabled', params, false),
        }

        this.pixelPerfectOver = Urso.helper.recursiveGet('pixelPerfectOver', params, true);
        this.pixelPerfectClick = Urso.helper.recursiveGet('pixelPerfectClick', params, true);

        this._addBaseObject();

        this.enable = this.enable.bind(this);
        this.disable = this.disable.bind(this);
    }

    enable() {
        if (!this._isDisabled)
            return false;

        if (this._isOver) {
            if (this.textures.over)
                this._baseObject.texture = this.textures.over;
        } else
            this._baseObject.texture = this.textures.out;

        this._isDisabled = false;
    }

    disable() {
        if (this._isDisabled)
            return false;

        if (this.textures.disabled)
            this._baseObject.texture = this.textures.disabled;
        else
            this._baseObject.texture = this.textures.out;

        this._isDisabled = true;
    }

    _addBaseObject() {
        this.textures = this._createTextures();

        if (!this.textures.out)
            Urso.logger.error('ModulesObjectsModelsImage assets error: no out image ' + this.buttonFrames.out);

        this._baseObject = new PIXI.Sprite(this.textures.out);

        this._baseObject.interactive = true;
        this._baseObject.buttonMode = true;

        if (this.pixelPerfectOver) {
            //todo
        }

        if (this.pixelPerfectClick) {
            //todo
        }

        this._baseObject
            .on('pointerdown', this._onButtonDown.bind(this))
            .on('pointerup', this._onButtonUp.bind(this))
            .on('pointerupoutside', this._onButtonUp.bind(this))
            .on('pointerover', this._onButtonOver.bind(this))
            .on('pointerout', this._onButtonOut.bind(this));

    };

    _onButtonDown() {
        if (this._isDisabled)
            return false;

        this._isDown = true;

        if (this.textures.pressed)
            this._baseObject.texture = this.textures.pressed;
    }

    _onButtonUp() {
        if (this._isDisabled)
            return false;

        this._isDown = false;

        if (this._isOver) {
            if (this.textures.over)
                this._baseObject.texture = this.textures.over;
        } else
            this._baseObject.texture = this.textures.out;

        if (this.action)
            this.action();
    }

    _onButtonOver() {
        this._isOver = true;

        if (this._isDisabled)
            return false;

        if (this._isDown)
            return;

        if (this.textures.over)
            this._baseObject.texture = this.textures.over;
    }

    _onButtonOut() {
        this._isOver = false;

        if (this._isDisabled)
            return false;

        if (this._isDown)
            return;

        this._baseObject.texture = this.textures.out;
    }

    _createTextures() {
        let textures = {};

        for (let key in this.buttonFrames) {
            let texture = Urso.cache.getTexture(this.buttonFrames[key]);

            if (!texture)
                continue;

            textures[key] = texture;
        }

        return textures;
    }
}

module.exports = ModulesObjectsModelsButton;
