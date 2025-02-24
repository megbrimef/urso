const ModulesObjectsBaseModel = require('./../baseModel');

class ModulesObjectsModelsSlider extends ModulesObjectsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.SLIDER;
        this._sliderBg = null;
        this._sliderHandle = null;
        this._baseObject = null;
        this._handleIsPulling = false;
        this._points = [];
        this._addBaseObject();
    }

    /**
     * Returns slider size according to handle size.
     * @returns { Number }
     */
    get sliderSize() {
        const anchorType = this.sizeKey === 'width' ? 'anchorX' : 'anchorY';
        const anchor = this._sliderHandle[anchorType];
        const handleSize = this._sliderHandle[this.sizeKey];
        return this._sliderBg._baseObject[this.sizeKey] - handleSize + handleSize * anchor * 2;
    }

    setupParams(params) {
        super.setupParams(params);
        this.contents = [];
        this.points = Urso.helper.recursiveGet('points', params, [0, 1]);
        this.defaultValue = Urso.helper.recursiveGet('defaultValue', params, false);
        this.bgTexture = Urso.helper.recursiveGet('bgTexture', params, false);
        this.fillTexture = Urso.helper.recursiveGet('fillTexture', params, false);
        this.handleTexture = Urso.helper.recursiveGet('handleTexture', params, false);
        this.minValueTextModel = Urso.helper.recursiveGet('minValueTextModel', params, false);
        this.maxValueTextModel = Urso.helper.recursiveGet('maxValueTextModel', params, false);
        this.currentValueTextModel = Urso.helper.recursiveGet('currentValueTextModel', params, false);
        this.isVertical = Urso.helper.recursiveGet('isVertical', params, false);
        this.handlePointerUpOutside = Urso.helper.recursiveGet('handlePointerUpOutside', params, true);
    }

    /**
     * Sets handle position on a nearest possible point.
     * @param { Number } coefficient  - might be in range 0 - 1.
     */
    setHandlePosition(coefficient) {
        let position = {};

        const targetPosition = this.sliderSize * coefficient;
        position[this.positionKey] = targetPosition;

        const { coord, value } = this._calculateClosestPoint(position);
        this._setNewValue(coord, value);
    }

    /**
     * Sets variables depends on slider type: vertical or horizontal.
     */
    _setVariables() {
        if (this.isVertical) {
            this.positionKey = 'y';
            this.sizeKey = 'height';
        } else {
            this.positionKey = 'x';
            this.sizeKey = 'width';
        }
    }

    /**
     * Creates Urso objects from given models of handle and background. If needed - creates fill texture.
     */
    _createSliderTextures() {
        this._sliderBg = this._createTexture(this.bgTexture);

        if (this.fillTexture)
            this._fillTexture = this._createFillTexture(this.fillTexture);

        this._sliderHandle = this._createTexture(this.handleTexture);

        this._setEvents(this._sliderBg._baseObject);
        this._setEvents(this._sliderHandle._baseObject);
    }

    /**
     * Creates and returns Urso GRAPHICS object for fill bar.
     * @param { Object } model 
     * @returns { Object }
     */
    _createFillTexture(model) {
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
        return fillTexture;
    }

    /**
     * If needed creates Urso TEXT objects for min max and current value.
     */
    _createValueText() {
        if (this.minValueTextModel) {
            this.minValueText = Urso.objects.create(this.minValueTextModel, this);
            this.minValueText.text = this._points[0];
        }

        if (this.maxValueTextModel) {
            this.maxValueText = Urso.objects.create(this.maxValueTextModel, this);
            this.maxValueText.text = this._points.length <= 2 ? '100' : this._points[this._points.length - 1];
        }

        if (this.currentValueTextModel) {
            this.currentValueText = Urso.objects.create(this.currentValueTextModel, this);
        }
    }
    /**
     * Creates and return Urso object for texture. Model type might be GRAPHICS or IMAGE.
     * @param { Object } model 
     * @returns { Object }
     */
    _createTexture(model) {
        if (model.type === Urso.types.objects.GRAPHICS || model.type === Urso.types.objects.IMAGE)
            return Urso.objects.create(model, this);
        else
            Urso.logger.error('ModulesObjectsModelsSlider objects error: textures should be GRAPHICS or IMAGE type');
    }

    /**
     * Subscribes on pointer events.
     * @param { Object } obj 
     */
    _setEvents(obj) {
        obj.interactive = true;
        obj.buttonMode = true;

        obj
            .on('pointerdown', this._onPointerDown.bind(this))
            .on('pointerup', this._onPointerUp.bind(this))
            .on('pointerupoutside', this._onPointerUp.bind(this))
            .on('touchmove', this._onTouchmove.bind(this));

        if (this.handlePointerUpOutside) {
            this._baseObject.on('pointerupoutside', this._onPointerUp.bind(this))
        }
    };

    /**
     * Handler for touchmove event.
     * @param { Object } event 
     */
    _onTouchmove(event) {
        const position = this._getEventLocalPosition(event);
        this._onPointerMove(position);
    }

    /**
     * Calculate pointer coords inside PIXI World.
     * @param { Object } event 
     * @returns 
     */
    _getEventLocalPosition(event) {
        const world = Urso.objects.getWorld();
        const worldScale = world._baseObject.scale;

        const x = event.data.global.x / worldScale.x;
        const y = event.data.global.y / worldScale.y;

        return { x, y };
    }

    /**
     * Creates base object and set up slider.
     */
    _addBaseObject() {
        this._baseObject = new PIXI.Container();

        this._setPoints();
        this._setVariables();
        this._createSliderTextures();
        this._createValueText();
        this._setDefaultValue();
    };

    /**
     * Handler for pointerdown event.
     * @param { Object } event 
     */
    _onPointerDown(obj) {
        if (obj.target === this._sliderHandle._baseObject)
            this._handleIsDragging = true;
    }

    /**
     * Handler for touchmove and pointermove events. 
     * @param { Object } param 
     */
    _onPointerMove({ x, y }) {
        if (!this._handleIsDragging)
            return

        const value = this.isVertical ? y : x;
        const globalPosition = this.toGlobal(this[this.positionKey])[this.positionKey];

        if (value < globalPosition)
            this._sliderHandle[this.positionKey] = 0;
        else if (value >= globalPosition + this.sliderSize)
            this._sliderHandle[this.positionKey] = this.sliderSize;
        else
            this._sliderHandle[this.positionKey] = value - globalPosition;

        this._updateValueOnMove()
    }

    /**
     * Updates slider value while moving.
     */
    _updateValueOnMove() {
        const { value } = this._calculateClosestPoint(this._sliderHandle);

        if (this.currentValueText)
            this.currentValueText.text = value;

        const data = { class: this.class, name: this.name, position: this._sliderHandle[this.positionKey] };
        this.emit(Urso.events.MODULES_OBJECTS_SLIDER_HANDLE_MOVE, data)
    }

    /**
     * Handler for pointerup event. 
     * @param { Object } obj 
     */
    _onPointerUp(obj) {
        this._handleIsDragging = false;
        let targetObj;

        if (obj.target === this._sliderBg._baseObject)
            targetObj = obj.data.getLocalPosition(obj.target)
        else
            targetObj = this._sliderHandle;

        const { coord, value } = this._calculateClosestPoint(targetObj);
        this._dropHandle(coord, value);
    }

    /**
     * Sets possible values (points) of slider 
     */
    _setPoints() {
        if (this.points.length > 1) {
            this._points = [...this.points];
            return;
        }

        const firstPoint = this.points[0] > 0 ? 0 : this.points[0];
        const lastPoint = this.points[0] > 0 ? this.points[0] : 0;

        for (let i = firstPoint; i <= lastPoint; i++)
            this._points.push(i);
    }

    /**
     * Sets given default value or 0. 
     */
    _setDefaultValue() {
        if (!this.defaultValue)
            this.defaultValue = this._points[0];

        if (!this._points.includes(this.defaultValue))
            this.defaultValue = this._points[0];

        let value = this._points.indexOf(this.defaultValue) * this.sliderSize / (this._points.length - 1);
        this._setNewValue(value, this.defaultValue);
    }

    /**
     * When handle drops sets final value and emits event
     * @param { Number } coord 
     * @param { Number } value 
     */
    _dropHandle(coord, value) {
        const data = { class: this.class, name: this.name, position: coord, value: value };

        this.emit(Urso.events.MODULES_OBJECTS_SLIDER_HANDLE_DROP, data);
        this._setNewValue(coord, value);
    }

    /**
     * Calculates closest possible value (point) from given coords. 
     * @param { Object } obj
     * @returns { Object }
     */
    _calculateClosestPoint(obj) {
        const givenValue = obj[this.positionKey];
        let value, coord;

        if (this._points.length <= 2) {
            coord = givenValue;
            value = ~~(100 / this.sliderSize * givenValue);
        }
        // calculate closest point
        else {
            for (let i = 0; i < this._points.length; i++) {
                let pointCoord = i * this.sliderSize / (this._points.length - 1);

                if (typeof (coord) === 'number' && givenValue - pointCoord < coord - givenValue) {
                    coord = coord;
                } else {
                    coord = pointCoord;
                    value = this._points[i];
                }
            }
        }

        return { coord, value };
    }

    /**
     * Set mask for fill texture depends on handle position.
     */
    _setFillMask() {
        if (!this._fillMask)
            return

        const progress = (this._sliderHandle[this.positionKey] - this._sliderBg[this.positionKey]) *
            100 / this._fillTexture._baseObject[this.sizeKey] * 0.01;

        const scaleKey = this.isVertical ? 'scaleY' : 'scaleX';
        this._fillMask[scaleKey] = progress;
    }

    /**
     * Set handle position and value.
     * @param { Number } coord 
     * @param { Number } value 
     */
    _setNewValue(coord, value) {
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
