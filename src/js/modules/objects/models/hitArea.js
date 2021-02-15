class ModulesObjectsModelsHitArea extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);
        this._isDisabled = false;

        this.type = Urso.types.objects.HITAREA;
        this.action = Urso.helper.recursiveGet('action', params, () => { this.emit(Urso.events.MODULES_OBJECTS_HIT_AREA_PRESS, this.name) });

        //must have x,y, width, height

        this._addBaseObject();

        this.enable = this.enable.bind(this);
        this.disable = this.disable.bind(this);
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
        this._baseObject.drawRect(this.x, this.y, this.width, this.height);
        this._baseObject.endFill();
        this._baseObject.alpha = 0;
        this._baseObject.cacheAsBitmap = true;

        this._baseObject.interactive = true;
        this._baseObject.buttonMode = true;

        this._baseObject
            .on('pointerup', this._onPressUp.bind(this));
    };

    _onPressUp() {
        if (this._isDisabled)
            return false;

        if (this.action)
            this.action();
    }

}

module.exports = ModulesObjectsModelsHitArea;
