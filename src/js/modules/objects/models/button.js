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
        this._addBaseObject();

        this.enable = this.enable.bind(this);
        this.disable = this.disable.bind(this);
    }

    setupParams(params) {
        super.setupParams(params);

        this.action = Urso.helper.recursiveGet('action', params, () => { this.emit(Urso.events.MODULES_OBJECTS_BUTTON_PRESS, { name: this.name, class: this.class }) });
        this.keyDownAction = Urso.helper.recursiveGet('keyDownAction', params, false);
        this.mouseOverAction = Urso.helper.recursiveGet('mouseOverAction', params, false);
        this.mouseOutAction = Urso.helper.recursiveGet('mouseOutAction', params, false);

        this.buttonFrames = {
            over: Urso.helper.recursiveGet('buttonFrames.over', params, false),
            out: Urso.helper.recursiveGet('buttonFrames.out', params, false),
            pressed: Urso.helper.recursiveGet('buttonFrames.pressed', params, false),
            disabled: Urso.helper.recursiveGet('buttonFrames.disabled', params, false),
        }

        this.pixelPerfectOver = Urso.helper.recursiveGet('pixelPerfectOver', params, true);
        this.pixelPerfectClick = Urso.helper.recursiveGet('pixelPerfectClick', params, true);
    }

    setButtonFrame(key, assetKey) {
        this.buttonFrames[key] = assetKey;

        if (this._isOver)
            this._changeTexture('over');
        else if(this._isDown)
            this._changeTexture('pressed');
        else if(this._isDisabled)
            this._changeTexture('disabled');
        else
            this._changeTexture('out');
    }

    enable() {
        if (!this._isDisabled)
            return false;

        if (this._isOver)
            this._changeTexture('over');
        else
            this._changeTexture('out');

        this._isDisabled = false;
    }

    disable() {
        if (this._isDisabled)
            return false;

        this._changeTexture('disabled');
        this._isDisabled = true;
    }

    _addBaseObject() {
        this._baseObject = new PIXI.Sprite();
        this._changeTexture('out');

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

        if (this.keyDownAction)
            this.keyDownAction();

        if (this._isDisabled) //can be disabled after keyDownAction
            return false;

        this._changeTexture('pressed');
    }

    _onButtonUp() {
        if (this._isDisabled || !this._isDown)
            return false;

        this._isDown = false;

        if (this.action)
            this.action();

        if (this._isDisabled) //can be disabled after action
            return false;

        if (this._isOver)
            this._changeTexture('over');
        else
            this._changeTexture('out');
    }

    _onButtonOver() {
        this._isOver = true;

        if (this._isDisabled)
            return false;

        if (this._isDown)
            return;

        if (this.mouseOverAction)
            this.mouseOverAction();

        this._changeTexture('over');
    }

    _onButtonOut() {
        this._isOver = false;

        if (this._isDisabled)
            return false;

        if (this._isDown)
            return;

        if (this.mouseOutAction)
            this.mouseOutAction();

        this._changeTexture('out');
    }

    _changeTexture(key) {
        let texture = Urso.cache.getTexture(this.buttonFrames[key]);

        if (!texture) {
            if (key === 'out') {
                Urso.logger.error('ModulesObjectsModelsButton assets error: no out image ' + this.buttonFrames.out);
                return false;
            }

            this._changeTexture('out'); // load default texture for this key
            return false;
        }

        this._baseObject.texture = texture;
        return true;
    }
}

module.exports = ModulesObjectsModelsButton;
