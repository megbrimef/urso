const UrsoCoreModulesObjectsModelsToggle = require('./toggle');

class ModulesObjectsModelsCheckbox extends UrsoCoreModulesObjectsModelsToggle {
    constructor(params) {
        super(params);

        this._isDisabled = false;
        this._lable = null;
        this._checkbox = null;

        this.type = Urso.types.objects.CHECKBOX;

        this._createCheckbox();

        this.enable = this.enable.bind(this);
        this.disable = this.disable.bind(this);
    }

    setupParams(params) {
        super.setupParams(params);

        this.contents = [];

        this.action = Urso.helper.recursiveGet('action', params, () => { 
            this.emit(Urso.events.MODULES_OBJECTS_CHECKBOX_PRESS, { name: this.name, status: this._toggleStatus }) 
        });

        this.action = Urso.helper.recursiveGet('action', params, () => { this.emit(Urso.events.MODULES_OBJECTS_CHECKBOX_PRESS, this.name) });
        this.lable = Urso.helper.recursiveGet('lable', params, false);

        this.defaultStatus = Urso.helper.recursiveGet('defaultStatus', params, 'unpressed'); //pressed or unpressed
    }

    _createCheckbox() {
        this._toggleStatus = this.defaultStatus;
        this._checkbox = this._createObject(this.buttonFrames[`${this.defaultStatus}Out`])

        if (this.lable)
            this._lable = this._createObject(this.lable);
    }

    _createObject(model) {
        model = Urso.helper.objectClone(model);
        let object = Urso.objects.create(model, this);

        object._baseObject.interactive = true;
        object._baseObject.buttonMode = true;

        object._baseObject
            .on('pointerdown', this._onButtonDown.bind(this))
            .on('pointerup', this._onButtonUp.bind(this))
            .on('pointerupoutside', this._onButtonUp.bind(this))
            .on('pointerover', this._onButtonOver.bind(this))
            .on('pointerout', this._onButtonOut.bind(this));

        return object;
    }

    _addBaseObject() {
        this._baseObject = new PIXI.Container();
    };

    _drawGraphics({ polygon, rectangle, fillColor }) {
        if (!polygon && !rectangle)
            return;

        this._checkbox._baseObject.clear();
        this._checkbox._baseObject.beginFill(fillColor);

        if (polygon && polygon.length) {
            this._checkbox._baseObject.drawPolygon(polygon);
        } else if (rectangle && rectangle.length) {
            this._checkbox._baseObject.drawRect(...rectangle)
        }

        this._checkbox._baseObject.endFill();
    };

    _changeTexture(key) {
        if (!this.buttonFrames[key]) {
            if (key === `${this._toggleStatus}Out`) {
                Urso.logger.error('ModulesObjectsModelsButton assets error: no out image ' + this.buttonFrames.out);
                return false;
            }

            this._changeTexture(`${this._toggleStatus}Out`); // load default texture for this key
            return false;
        }
        if (this.buttonFrames[key].type === Urso.types.objects.GRAPHICS)
            this._drawGraphics(this.buttonFrames[key].figure);
        else
            this._checkbox.changeTexture(this.buttonFrames[key].assetKey);
    }
}

module.exports = ModulesObjectsModelsCheckbox;
