const UrsoCoreModulesObjectsModelsButton = require('./button');

class ModulesObjectsModelsToggle extends UrsoCoreModulesObjectsModelsButton {
    constructor(params) {
        super(params);

        this.status = 'unpressed';

        this.type = Urso.types.objects.TOGGLE;
        this._addBaseObject();

        this.enable = this.enable.bind(this);
        this.disable = this.disable.bind(this);
    }

    setupParams(params) {
        super.setupParams(params);

        this.action = Urso.helper.recursiveGet('action', params, () => {
            this.emit(Urso.events.MODULES_OBJECTS_TOGGLE_PRESS, { name: this.name, status: this.status, class: this.class })
        });

        this.buttonFrames = {
            pressedOver: Urso.helper.recursiveGet('buttonFrames.pressedOver', params, false),
            pressedOut: Urso.helper.recursiveGet('buttonFrames.pressedOut', params, false),
            unpressedOver: Urso.helper.recursiveGet('buttonFrames.unpressedOver', params, false),
            unpressedOut: Urso.helper.recursiveGet('buttonFrames.unpressedOut', params, false),
            pressedDown: Urso.helper.recursiveGet('buttonFrames.pressedDown', params, false),
            unpressedDown: Urso.helper.recursiveGet('buttonFrames.unpressedDown', params, false),
            pressedDisabled: Urso.helper.recursiveGet('buttonFrames.pressedDisabled', params, false),
            unpressedDisabled: Urso.helper.recursiveGet('buttonFrames.unpressedDisabled', params, false),
        }

        this.handlePointerupoutside = Urso.helper.recursiveGet('handlePointerupoutside', params, true);
    }

    setButtonFrame(key, assetKey) {
        this.buttonFrames[key] = assetKey;

        if (this._isOver)
            this._changeTexture(`${this.status}Over`);
        else if (this._isDown)
            this._changeTexture(`${this.status}Down`);
        else if (this._isDisabled)
            this._changeTexture(`${this.status}Disabled`);
        else
            this._changeTexture(`${this.status}Out`);
    }

    enable() {
        if (!this._isDisabled)
            return false;

        if (this._isOver)
            this._changeTexture(`${this.status}Over`);
        else
            this._changeTexture(`${this.status}Out`);

        this._isDisabled = false;
        this._baseObject.buttonMode = true;
    }

    disable() {
        if (this._isDisabled)
            return false;

        this._changeTexture(`${this.status}Disabled`);
        this._isDisabled = true;
        this._baseObject.buttonMode = false;
    }

    _addBaseObject() {
        this._baseObject = new PIXI.Sprite();
        this._changeTexture('unpressedOut');

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
            .on('pointerover', this._onButtonOver.bind(this))
            .on('pointerout', this._onButtonOut.bind(this));

        if (this.handlePointerupoutside) {
            this._baseObject.on('pointerupoutside', this._onButtonUp.bind(this))
        }
    };

    _onButtonDown() {
        if (this._isDisabled)
            return false;

        this._isDown = true;

        if (this.keyDownAction)
            this.keyDownAction();

        if (this._isDisabled) //can be disabled after keyDownAction
            return false;

        this._changeTexture(`${this.status}Down`);

        this.status = this.status === 'pressed' ? 'unpressed' : 'pressed';
    }

    _onButtonUp() {
        if (this._isDisabled)
            return false;

        this._isDown = false;

        if (this.action)
            this.action();

        if (this._isDisabled) //can be disabled after action
            return false;

        if (this._isOver)
            this._changeTexture(`${this.status}Over`);
        else
            this._changeTexture(`${this.status}Out`);
    }

    _onButtonOver() {
        this._isOver = true;

        if (this._isDisabled || this._isDown)
            return false;

        if (this.mouseOverAction)
            this.mouseOverAction();

        this._changeTexture(`${this.status}Over`);
    }

    _onButtonOut() {
        this._isOver = false;

        if (this._isDisabled || this._isDown)
            return false;

        if (this.mouseOutAction)
            this.mouseOutAction();

        this._changeTexture(`${this.status}Out`);
    }

    switchStatus() {
        this.status = this.status === 'pressed' ? 'unpressed' : 'pressed';

        if (this._isOver)
            this._changeTexture(`${this.status}Over`);
        else
            this._changeTexture(`${this.status}Out`);
    }

    _changeTexture(key) {
        let texture = Urso.cache.getTexture(this.buttonFrames[key]);

        if (!texture) {
            if (key === `${this.status}Out`) {
                Urso.logger.error('ModulesObjectsModelsButton assets error: no out image ' + this.buttonFrames.out);
                return false;
            }

            this._changeTexture(`${this.status}Out`); // load default texture for this key
            return false;
        }

        this._baseObject.texture = texture;
        return true;
    }
}

module.exports = ModulesObjectsModelsToggle;
