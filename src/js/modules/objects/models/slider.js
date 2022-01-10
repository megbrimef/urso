class ModulesObjectsModelsSlider extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.SLIDER;
        this._sliderBg = null;
        this._sliderHandle = null;
        this._baseObject = null;
        this._handleIsPulling = false;

        this._setVariables();
        this._addBaseObject();
        this._createSliderTextures();
        this._createValueText();
        this._setDefaultValue();
    }

    setupParams(params) {
        super.setupParams(params);
        this.contents = [];
        this.points = Urso.helper.recursiveGet('points', params, [0, 1]);
        this.defaultValue = Urso.helper.recursiveGet('defaultValue', params, this.points[0]);
        this.bgTexture = Urso.helper.recursiveGet('bgTexture', params, false);
        this.fillTexture = Urso.helper.recursiveGet('fillTexture', params, false);
        this.handleTexture = Urso.helper.recursiveGet('handleTexture', params, false);
        this.minValueTextModel = Urso.helper.recursiveGet('minValueTextModel', params, false);
        this.maxValueTextModel = Urso.helper.recursiveGet('maxValueTextModel', params, false);
        this.currentValueTextModel = Urso.helper.recursiveGet('currentValueTextModel', params, false);
        this.isVertical = Urso.helper.recursiveGet('isVertical', params, false);
    }

    _setVariables() {
        if(this.isVertical) {
            this.positionKey = 'y';
            this.targetObjParam = 'height';
        }else {
            this.positionKey = 'x';
            this.targetObjParam = 'width';
        }
    }

    _createSliderTextures() {
        this._sliderBg = this._createTexture(this.bgTexture);

        if(this.fillTexture)
            this._fillTexture = this._createFillTexture(this.fillTexture);

        this._sliderHandle = this._createTexture(this.handleTexture);

        this._setEvents(this._sliderBg._baseObject);
        this._setEvents(this._sliderHandle._baseObject);
    }

    _createFillTexture(model){
        const fillTexture = this._createTexture(model);
        const { width, height } = fillTexture._baseObject;
        this._fillMask = Urso.objects.create({
            type: Urso.types.objects.GRAPHICS,
            figure: {
            rectangle: [0, 0, width, height]
            },
            x: -width * fillTexture.anchorX,
            y: -height * fillTexture.anchorY,
        }, this);

        fillTexture._baseObject.mask = this._fillMask._baseObject;
        return fillTexture
    }

    _createValueText() {
        if (this.minValueTextModel) {
            this.minValueText = Urso.objects.create(this.minValueTextModel, this);
            this.minValueText.text = this.points[0];
        }

        if (this.maxValueTextModel) {
            this.maxValueText = Urso.objects.create(this.maxValueTextModel, this);
            this.maxValueText.text = this.points.length <= 2 ? '100' : this.points[this.points.length - 1];
        }

        if(this.currentValueTextModel){
            this.currentValueText = Urso.objects.create(this.currentValueTextModel, this);
        }
    }

    _createTexture(model) {
        if (model.type === Urso.types.objects.GRAPHICS || model.type === Urso.types.objects.IMAGE)
            return Urso.objects.create(model, this);
        else
            Urso.logger.error('ModulesObjectsModelsSlider objects error: textures should be GRAPHICS or IMAGE type');
    }

    _setEvents(obj) {
        obj.interactive = true;
        obj.buttonMode = true;

        obj
            .on('pointerdown', this._onPointerDown.bind(this))
            .on('pointerup', this._onPointerUp.bind(this))
            .on('pointerupoutside', this._onPointerUp.bind(this))
            .on('touchmove', this._onTouchmove.bind(this));
    };

    _onTouchmove(event) {
        const position = this._getEventLocalPosition(event);
        this._onPointerMove(position);
    }

    _getEventLocalPosition(event) {
        const world = Urso.objects.getWorld();
        const worldScale = world._baseObject.scale;

        const x = event.data.global.x / worldScale.x;
        const y = event.data.global.y / worldScale.y;

        return { x, y };
    }

    _addBaseObject() {
        this._baseObject = new PIXI.Container();
    };

    _onPointerDown(obj) {
        if (obj.target === this._sliderHandle._baseObject)
            this._handleIsDragging = true;
    }

    _onPointerMove({ x, y }) {
        if (!this._handleIsDragging)
            return

        const value = this.isVertical ? y : x;

        if (value < this[this.positionKey])
            this._sliderHandle[this.positionKey] = 0;
        else if (value >= this[this.positionKey] + this._sliderBg._baseObject[this.targetObjParam])
            this._sliderHandle[this.positionKey] = this._sliderBg._baseObject[this.targetObjParam];
        else
            this._sliderHandle[this.positionKey] = value - this[this.positionKey];

        this._setFillMask();

        const data = { class: this.class, name: this.name, position: this._sliderHandle[this.positionKey] };
        this.emit(Urso.events.MODULES_OBJECTS_SLIDER_HANDLE_MOVE, data)
    }

    _onPointerUp(obj) {
        this._handleIsDragging = false;
        let targetObj;

        if (obj.target === this._sliderBg._baseObject)
            targetObj = obj.data.getLocalPosition(obj.target)
        else
            targetObj = this._sliderHandle;

        const {x, y} = targetObj;
        const value = this.isVertical ? y : x;
        this._dropHandle(value);
    }

    _setDefaultValue(){
        if(!this.points.includes(this.defaultValue))
            this.defaultValue = this.points[0];

        let value = this.points.indexOf(this.defaultValue) * 
                    this._sliderBg._baseObject[this.targetObjParam] / (this.points.length - 1);

        this._setNewValue(value, this.defaultValue);
    }

    _dropHandle(givenValue) {
        let value;
        let coord;

        if(this.points.length <= 2){
            coord = givenValue;
            value = ~~(100 / this._sliderBg._baseObject[this.targetObjParam] * givenValue);
        }
        // calculate closest point
        else{
            for (let i = 0; i < this.points.length; i++) {
                let pointCoord = i * this._sliderBg._baseObject[this.targetObjParam] / (this.points.length - 1);
    
                if (typeof (coord) === 'number' && givenValue - pointCoord < coord - givenValue) {
                    coord = coord;
                } else {
                    coord = pointCoord;
                    value = this.points[i];
                }
            }
        }
        const data = { class: this.class, name: this.name, position: coord, value: value };

        this.emit(Urso.events.MODULES_OBJECTS_SLIDER_HANDLE_DROP, data);
        this._setNewValue(coord, value);
    }

    _setFillMask(){
        if(!this._fillMask)
            return

        const progress = (this._sliderHandle[this.positionKey] - this._sliderBg[this.positionKey]) * 
                        100 / this._fillTexture._baseObject[this.targetObjParam] * 0.01;
        
        const scaleKey = this.isVertical ? 'scaleY' : 'scaleX';
        this._fillMask[scaleKey] = progress;
    }

    _setNewValue(coord, value){
        this._sliderHandle[this.positionKey] = coord;
            
        if (this.currentValueText)
            this.currentValueText.text = value;

        this._setFillMask();
    }

    _subscribeOnce() {
        this.addListener(Urso.events.MODULES_SCENES_MOUSE_NEW_POSITION, this._onPointerMove.bind(this));
    }
}

module.exports = ModulesObjectsModelsSlider;
