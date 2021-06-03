class ModulesObjectsModelsHitArea extends Urso.Core.Modules.Objects.BaseModel {
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
        this.action = Urso.helper.recursiveGet('action', params, () => { this.emit(Urso.events.MODULES_OBJECTS_HIT_AREA_PRESS, this.name) });
        this.onOverCallback = Urso.helper.recursiveGet('onOverCallback', params, false);
        this.onOutCallback = Urso.helper.recursiveGet('onOutCallback', params, false);
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
            .on('pointerup', this._onPressUp.bind(this))
            .on('pointerover', this._onOver.bind(this))
            .on('pointerout', this._onOut.bind(this));
    };

    _onPressUp(event) {
        if (this._isDisabled)
            return false;

        if (this.action)
            this.action(event);
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

}

module.exports = ModulesObjectsModelsHitArea;
