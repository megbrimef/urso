const ModulesObjectsBaseModel = require('./../baseModel');

class ModulesObjectsModelsHitArea extends ModulesObjectsBaseModel {
    constructor(params) {
        super(params);
        this._isDisabled = false;

        this.type = Urso.types.objects.HITAREA;

        this._addBaseObject();

        this.enable = this.enable.bind(this);
        this.disable = this.disable.bind(this);
    }

    setupParams(params) {
        super.setupParams(params);

        //must have x,y, width, height
        this.action = Urso.helper.recursiveGet(
            'action', params, (position) => { this.emit(Urso.events.MODULES_OBJECTS_HIT_AREA_PRESS, { position, name: this.name, class: this.class }) }
        );
        this.disableRightClick = Urso.helper.recursiveGet('disableRightClick', params, false);
        this.keyDownAction = Urso.helper.recursiveGet('keyDownAction', params, false);
        this.onOverCallback = Urso.helper.recursiveGet('onOverCallback', params, false);
        this.onOutCallback = Urso.helper.recursiveGet('onOutCallback', params, false);
        this.onTouchMoveCallback = Urso.helper.recursiveGet('onTouchMoveCallback', params, false);
        this.handlePointerupoutside = Urso.helper.recursiveGet('handlePointerupoutside', params, true);
    }

    enable() {
        if (!this._isDisabled)
            return false;

        this._isDisabled = false;
    }

    disable() {
        if (this._isDisabled)
            return false;

        this._isDisabled = true;
    }

    _addBaseObject() {
        this._baseObject = new PIXI.Graphics();

        this._baseObject.lineStyle(0);
        this._baseObject.beginFill(0xffffff);
        this._baseObject.drawRect(0, 0, this.width, this.height);
        this._baseObject.endFill();
        this._baseObject.alpha = 0;
        this._baseObject.cacheAsBitmap = true;

        this._baseObject.interactive = true;
        this._baseObject.buttonMode = true;

        this._baseObject
            .on('pointerdown', this._onPressDown.bind(this))
            .on('pointerup', this._onPressUp.bind(this))
            .on('pointerover', this._onOver.bind(this))
            .on('pointerout', this._onOut.bind(this))
            .on('touchmove', this._onTouchmove.bind(this));

        if (this.handlePointerupoutside) {
            this._baseObject.on('pointerupoutside', this._onPressUp.bind(this))
        }
    };

    _onTouchmove(event) {
        const position = this._getEventLocalPosition(event);

        if (this.onTouchMoveCallback)
            this.onTouchMoveCallback(position);
    }

    _onPressDown(event) {
        if (this._isDisabled)
            return false;

        if (this.disableRightClick && event.data.button !== 0)
            return;

        if (this.keyDownAction) {
            const position = this._getEventLocalPosition(event);
            this.keyDownAction(position);
        }
    }

    _onPressUp(event) {
        if (this._isDisabled)
            return false;

        if (this.disableRightClick && event.data.button !== 0)
            return;

        if (this.action) {
            const position = this._getEventLocalPosition(event);
            this.action(position);
        }
    }

    _onOver() {
        if (this._isDisabled)
            return false;

        if (this.onOverCallback)
            this.onOverCallback();
    }

    _onOut() {
        if (this._isDisabled)
            return false;

        if (this.onOutCallback)
            this.onOutCallback();
    }

    _getEventLocalPosition(event) {
        const world = Urso.objects.getWorld();
        const worldScale = world._baseObject.scale;

        const x = event.data.global.x / worldScale.x;
        const y = event.data.global.y / worldScale.y;

        return { x, y };
    }
}

module.exports = ModulesObjectsModelsHitArea;
