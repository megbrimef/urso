const ModulesObjectsBaseModel = require('./../baseModel');

class ModulesObjectsModelsHitArea extends ModulesObjectsBaseModel {

    constructor(params) {
        super(params);
        this._isDisabled = false;
        this._isDown = false;

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
        this.mouseOverAction = Urso.helper.recursiveGet('mouseOverAction', params, false);
        this.mouseOutAction = Urso.helper.recursiveGet('mouseOutAction', params, false);
        this.onTouchMoveCallback = Urso.helper.recursiveGet('onTouchMoveCallback', params, false);
        this.handlePointerUpOutside = Urso.helper.recursiveGet('handlePointerUpOutside', params, true);
        /**
         * customInteractionArea object ex:
         * Circle: { "type": "circle", "params": [0, 0, 100] }
         * Rectangle: { "type": "rectangle", "params": [0, 0, 100, 100] }
         * Polygon: {
         *   "type": "polygon",
         *   "params":  [ 0, 0, 100, 0, 100, 100, 50, 150, 0, 100 ];
         * }
         * */
        this.customInteractionArea = Urso.helper.recursiveGet('customInteractionArea', params, null);
    }

    enable() {
        if (!this._isDisabled)
            return false;

        this._isDisabled = false;
        this._baseObject.interactive = true;
    }

    disable() {
        if (this._isDisabled)
            return false;

        this._isDisabled = true;
        this._baseObject.interactive = false;
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
            .on('pointerupoutside', this._onPressUpOutside.bind(this))
            .on('pointerover', this._onOver.bind(this))
            .on('pointerout', this._onOut.bind(this))
            .on('touchmove', this._onTouchmove.bind(this));

        if (this.customInteractionArea)
            this._baseObject.hitArea = this._getHitAreaObject(this.customInteractionArea);
    }

    _onTouchmove(event) {
        if (this._isDisabled)
            return false;

        const position = this._getEventLocalPosition(event);

        if (this.onTouchMoveCallback)
            this.onTouchMoveCallback(position);
    }

    _onPressDown(event) {
        if (this._isDisabled)
            return false;

        if (this.disableRightClick && event.data.button !== 0)
            return;

        if (this._isDown)
            return false;

        this._isDown = true;

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

        if (!this._isDown)
            return false;

        this._isDown = false;

        if (this.action) {
            const position = this._getEventLocalPosition(event);
            this.action(position);
        }
    }

    _onPressUpOutside(event) {
        if (this.handlePointerUpOutside) {
            this._onPressUp(event);
            return;
        }

        if (this._isDisabled)
            return false;

        this._isDown = false;
    }

    _onOver() {
        if (this._isDisabled)
            return false;

        if (this.mouseOverAction)
            this.mouseOverAction();
    }

    _onOut() {
        if (this._isDisabled)
            return false;

        if (this.mouseOutAction)
            this.mouseOutAction();
    }

    _getEventLocalPosition(event) {
        const world = Urso.objects.getWorld();
        const worldScale = world._baseObject.scale;

        const x = event.data.global.x / worldScale.x;
        const y = event.data.global.y / worldScale.y;

        return { x, y };
    }

    _getHitAreaObject({ type, params }) {
        if (!type) {
            return null;
        }

        const objects = {
            'rectangle': PIXI.Rectangle,
            'circle': PIXI.Circle,
            'polygon': PIXI.Polygon
        }

        if (!objects[type]) {
            return null;
        }

        return new objects[type](...params);
    }
}

module.exports = ModulesObjectsModelsHitArea;
