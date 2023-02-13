const ModulesObjectsModelsContainer = require('./container.js');
const containers = [];

class ModulesObjectsModelsDragContainer extends ModulesObjectsModelsContainer {
    _mask = null;
    _interactiveLayer = null;
    _startPosition = null;
    _startY = 0;
    _offsetStartY = 0;
    _needBlock = false;
    _needMoveSlider = true;
    _moveStartedY = 0;
    _dragStarted = false;
    _minMoveDurationForEasing = 100;
    _minMoveDistanceForEasing = 50;
    _minMoveDistance = 15;
    _currentPosition = 0;

    constructor(params) {
        super(params);
  
        this.type = Urso.types.objects.DRAGCONTAINER;

        this._onScrollSliderMove = this._onScrollSliderMove.bind(this);
        this._sliderHandleDrop = this._sliderHandleDrop.bind(this);
        this._setSliderHandler = this._setSliderHandler.bind(this);
        this._switchBlock = this._switchBlock.bind(this);
        this._pointerEventsHandler = this._pointerEventsHandler.bind(this);
        this._onResolutionChange = this._onResolutionChange.bind(this);

        this._setupDragContainer();
        containers.push(this);
    }

    /**
     * Setups initial params on create.
     * @param { Object } params 
     */
    setupParams(params) {
        super.setupParams(params);
        this.speed = Urso.helper.recursiveGet('speed', params, 1);
        this.dragIndex = Urso.helper.recursiveGet('dragIndex', params, 0);
        this.sliderClass = Urso.helper.recursiveGet('sliderClass', params, false);
        this.onMoveCallback = Urso.helper.recursiveGet('onMoveCallback', params, false);
        this.easingTime = Urso.helper.recursiveGet('easingTime', params, 1.5);
        this.easingDistance = Urso.helper.recursiveGet('easingDistance', params, 200);
        this.zIndex = Urso.helper.recursiveGet('zIndex', params, 10);
        this.width = Urso.helper.recursiveGet('width', params, 200); // Width of container visible area. Numbers only.
        this.height = Urso.helper.recursiveGet('height', params, 200); // Height of container visible area. Numbers only.
    }

    /**
     * Checks if interactive layer is visible and move in progress.
     * @returns { Boolean }
     */
    get _moveInProgress() {
        return this._interactiveLayer.visible
    }

    /**
     * Sets interactiveLayer visibility.
     */
    set _moveInProgress(inProgress) {
        this._interactiveLayer.visible = inProgress;
    }

    /**
     * Resizes mask and interactiveLayer according dragContainer size
     * @param { Boolean } needResetMaskY
     */
    resize(needResetMaskY) {
        this._resizeInteractiveLayer();
        this._resizeMask();

        if (needResetMaskY) {
            this._mask.y = 0;
        }
    }

    /**
     * Initial setup dragContainers params.
     */
    _setupDragContainer() {
        this._setMask();
        this._resizeInteractiveLayer();
        this._resizeMask();
        this._setResizeReactively();
        this._currentPosition = this._baseObject.y;
    }

    /**
     * Subscribes resize() method on dragContauber width/height params change
     */
    _setResizeReactively() {
        Urso.helper.reactive(this, 'width', () => this.resize());
        Urso.helper.reactive(this, 'height', () => this.resize());
    }

    /**
     * Setups mask and interactive layer of dragContainer
     */
    _setMask() {
        this._mask = this._makeMask();

        this._interactiveLayer = this._makeInteractiveLayer();
        this._interactiveLayer.on('pointermove', (e) => this._onPointerMove(e));

        this._baseObject.addChild(this._mask);
        this._baseObject.addChild(this._interactiveLayer);

        this._baseObject.mask = this._mask;
    }

    /**
     * Function takes pointer coords and checks if pointer over current dragContainer.
     * @param { Object } coords
     * @returns { Boolean }
     */
    _isActive({ x, y }) {
        const pointerOverContainers = containers
            .filter((container) => {
                const points = this._getObjectPoints(container);
                return this._checkPointerOver({ x, y }, ...points);
            })
            .filter((container) => container._baseObject.worldVisible)
            .filter((container) => !container._needBlock)
            .filter((container) => {
                const height = container.getAbsoluteSize().height;
                return container.height - height < 0;
            })
            .sort((firstContainer, secondContainer) => secondContainer.dragIndex - firstContainer.dragIndex);

        return pointerOverContainers[0] === this;
    }

    /**
     * Hides attached slider if dragContainer cannot be scrolled
     */
    _changeSliderVisibility() {
        if (!this._slider)
            return;

        this._slider.visible = this.height < this._baseObject.height;
    }

    /**
     * Function takes pointer coords and coords of the two container's vertexes
     * returns relative position of pointer between two points
     * @param { Object } pointerCoords
     * @param { Object } point1 
     * @param { Object } point2 
     * @returns { Number }
     */
    _getPointerRelativePosition(pointerCoords, point1, point2) {
        const xDelta = point2.x - point1.x;
        const yDelta = point2.y - point1.y;
        const poiterDeltaY = pointerCoords.y - point1.y;
        const poiterDeltaX = pointerCoords.x - point1.x;
        return xDelta * poiterDeltaY - yDelta * poiterDeltaX;
    }

    /**
     * Takes pointer coords and dragContainer vertexes coords.
     * Checks if pointer is inside dragContainer rectangle.
     * @param { Object } pointerCoords 
     * @param { Object } pointA 
     * @param { Object } pointB 
     * @param { Object } pointC 
     * @param { Object } pointD 
     * @returns { Boolean }
     */
    _checkPointerOver(pointerCoords, pointA, pointB, pointC, pointD) {
        const point1 = this._getPointerRelativePosition(pointerCoords, pointA, pointB);
        const point2 = this._getPointerRelativePosition(pointerCoords, pointB, pointC);
        const point3 = this._getPointerRelativePosition(pointerCoords, pointC, pointD);
        const point4 = this._getPointerRelativePosition(pointerCoords, pointD, pointA);
        return (point1 < 0 && point2 < 0 && point3 < 0 && point4 < 0) || (point1 > 0 && point2 > 0 && point3 > 0 && point4 > 0);
    }

    /**
     * Function takes container object and calculate it's vertexes coords.
     * Returns array of coords.
     * @param { Object } container 
     * @returns { Array }
     */
    _getObjectPoints(container) {
        const { x, y } = container._mask.toGlobal(new PIXI.Point(0, 0));

        const { width, height } = container._mask;
        const { scaleX, scaleY } = this._getScaleAndPositionRecursive(this);

        return [
            { x, y },
            { x: x + width * scaleX, y },
            { x: x + width * scaleX, y: y + height * scaleY },
            { x, y: y + height * scaleY }
        ];
    }

    /**
     * Function takes dragContainer object and recurcievly calculates it's global scale and position
     * @param { Object } 
     * @returns 
     */
    _getScaleAndPositionRecursive({ scaleX, scaleY, parent, x, y }) {
        if (!parent) {
            return { scaleX, scaleY, x, y };
        }

        const { scaleX: parentScaleX, scaleY: parentScaleY, x: parentX, y: parentY } = this._getScaleAndPositionRecursive(parent);

        return {
            scaleX: scaleX * parentScaleX,
            scaleY: scaleY * parentScaleY,
            x: x + parentX,
            y: y + parentY,
        }
    }

    /**
     * Callback on pointer move. Takes pointer event data.
     * @param { Object } e 
     */
    _documentPointerMove(e) {
        if(!this._movePossible)
            return;

        this._moveInProgress = true;

        const offset = e.offsetY ?? changedOffsetY ?? clientY ?? 0;

        if (Math.abs(this._moveStartedY - offset) > this._minMoveDistance && !this._dragStarted) {
            this._dragStarted = true;
            this.emit(Urso.events.MODULES_OBJECTS_DRAGCONTAINER_DRAG_STARTED, { name: this.name, className: this.class, id: this.id });
        }
    }

    /**
     * Callback on move end. Unblock all dragContainers and if move was longer than requred minimum starts easing
     */
    _documentPointerEnd() {
        this._movePossible = false;
        const timeDelta = Date.now() - this._lastMoveTime;
        this.emit(Urso.events.MODULES_OBJECTS_DRAGCONTAINER_SWITCHBLOCK, { names: ['*'], needBlock: false });

        if (this._wasMoved && timeDelta < this._minMoveDurationForEasing)
            this._startMoveEasing();
        else
            this._startPosition = null;

        this._onMoveComplete();
        this._wasMoved = false;
    }

    /**
     * Starts easing animation in the end of move
     */
    _startMoveEasing() {
        const targetY = this._getEasingTargetY();

        if (!targetY) {
            this._startPosition = null;
            return
        };

        let obj = { y: this._baseObject.y };

        this._easingTween = gsap.to(obj, this.easingTime, {
            y: targetY, ease: 'power2',
            onUpdate: () => {
                this._move(obj.y, true);
                this._isBorder && this._killTweens();
            },
            onComplete: () => {
                this._startPosition = null;
            }
        })
    }

    /**
     * Kills al animation tweens
     */
    _killTweens() {
        if (this._easingTween) {
            this._easingTween.pause();
            this._easingTween.kill(true);
            this._easingTween = null;
            this._startPosition = null;
        };
    }

    /**
     * Calculates target move coordinate of easing
     * @returns { Number }
     */
    _getEasingTargetY() {
        const multipler = this._moveStartY > this._baseObject.y ? -1 : 1;

        if (Math.abs(this._moveStartY - this._baseObject.y) < this._minMoveDistanceForEasing)
            return false;

        return this._baseObject.y + this.easingDistance * multipler;
    }

    /**
     * Resets params on move callback
     */
    _onMoveComplete() {
        this._moveInProgress = false;
        this._dragStarted = false;
        this._isWheelMove = false;
        this.emit(Urso.events.MODULES_OBJECTS_DRAGCONTAINER_DRAG_FINISHED, { name: this.name, className: this.class, id: this.id });
        this._isBorder = false;
    }

    /**
     * Checks if next dragContainer Y coordinate is in possible range.
     * If it's out of possible range returns nearest possible point.
     * @param { Number } y 
     * @param { Number } lastPosY 
     * @param { Number } deltaY 
     * @returns { Number }
     */
    _getValidatedY(y, lastPosY, deltaY) {
        if (y > 0) {
            this._startY = -deltaY;
            y = 0;
        }

        if (lastPosY > y) {
            this._startY = lastPosY - deltaY;
            this._isBorder = true;
            y = lastPosY;
        }

        const possibleMinY = this.height - this._calcMaxY(this._baseObject);

        if (y < possibleMinY) {
            y = possibleMinY;
            this._isBorder = true
        }

        return y;
    }

    /**
     * Calculates max possible dragContainer Y
     * @param { Object } pixiObject 
     * @returns { Number }
     */
    _calcMaxY(pixiObject) {
        let maxY = 0;

        pixiObject.children.forEach(element => {
            if (element.isMask)
                return;

            const elementLimit = element.y + element.height;

            if (elementLimit > maxY)
                maxY = elementLimit;
        });

        return maxY;
    }

    /**
     * Validates next dragContainer position.
     * @param { Number } lastY 
     * @param { Boolean } isWheel 
     * @returns 
     */
    _validateY(lastY, isWheel) {
        const deltaY = isWheel ? lastY * this.speed : ((lastY - this._startPosition.y) * this.speed);
        const lastPosY = this._mask.height - this._baseObject.height;
        const targetY = isWheel ? lastY : this._startY + deltaY
        return this._getValidatedY(targetY, lastPosY, deltaY);;
    }

    /**
     * Moves dragContainer
     * @param { Number } nextY 
     * @param { Boolean } isWheel 
     */
    _move(nextY, isWheel) {
        this._lastMoveTime = Date.now();
        this._onMoveCallback();
        const y = this._validateY(nextY, isWheel);
        this._setNewPosition(y);
        this._needMoveSlider && this._setSliderPosition(y);
    }

    /**
     * Calls given onMoveCallback if it's exists
     */
    _onMoveCallback() {
        this.onMoveCallback && this.onMoveCallback();
    }

    /**
     * Sets slider.
     */
    _setSlider() {
        if (!this.sliderClass)
            return

        this._slider = Urso.findOne(`.${this.sliderClass}`);
    }

    /**
     * Updates slider position alongside with dragged container.
     * @param { Number } y 
     */
    _setSliderPosition(y) {
        if (!this._slider)
            return;

        const { height } = this.getAbsoluteSize();
        const positionCoef = Math.abs(y / (height - this.height));
        this._slider.setHandlePosition(positionCoef);
    }

    /**
     * Callback on move start.
     */
    _documentPointerStart() {
        this._startY = this._getCurrentY();
        this._moveStartY = this._getCurrentY();
        this._startTime = Date.now();
        this._movePossible = true;
        this._killTweens();
    }

    /**
     * Sets dragContainer validated position.
     * @param { Number } y 
     */
    _setNewPosition(y) {
        this._baseObject.y = y;
        this._mask.y = -y;
        this._interactiveLayer.y = -y;
        this._currentPosition = y;
    }

    /**
     * Returns current container position.
     * @returns { Number }
     */
    _getCurrentY() {
        return this._baseObject.y;
    }

    /**
     * Moves container on wheel scroll.
     * @param { Object } 
     */
    _documentWheelScroll({ x, y, deltaY }) {
        if (Urso.device.desktop) {
            x = Urso.scenes.getMouseCoords().x;
            y = Urso.scenes.getMouseCoords().y;
        }

        if (!this._isActive({ x, y }))
            return;

        this._isWheelMove = true;

        this._killTweens();
        const { x: startX, y: startY } = this._baseObject;
        this._startPosition = { x: startX, y: startY };
        this._moveStartY = this._getCurrentY();
        const nextY = startY - deltaY;

        this.emit(Urso.events.MODULES_OBJECTS_DRAGCONTAINER_SCROLL, { name: this.name, className: this.class, id: this.id });

        this._move(nextY, true);
        this._startMoveEasing();
    }

    /**
     * Drags container on pointer move.
     * @param { Object } event 
     */
     _onPointerMove(event) {
        let { data: { global: { x, y } } } = event;

        if (!this._startPosition) {
            this._startPosition = { x, y };
        }

        if (!this._isActive({ x, y })) {
            this._moveInProgress = false;
            return;
        }

        this._wasMoved = true;
        this._move(y);
    }

    /**
     * Resizes mask according dragContainer size.
     */
    _resizeMask() {
        this._mask.width = this.width;
        this._mask.height = this.height;
    }

    /**
     * Resizes interactive layer according dragContainer size.
     */
    _resizeInteractiveLayer() {
        this._interactiveLayer.width = this.width;
        this._interactiveLayer.height = this.height;
    }

    /**
     * Creates a PIXI.Graphics rectangle which represents area in which we can interact with dragContainer.
     * @returns { Object }
     */
    _makeInteractiveLayer() {
        let layer = new PIXI.Graphics();
        layer.beginFill(0xffffff);
        layer.drawRect(0, 0, 1, 1);
        layer.endFill();
        layer.zIndex = this.zIndex;
        layer.alpha = 0;
        layer.visible = false;
        layer.interactive = true;
        return layer;
    }

    /**
     * Create PIXI.Graphics object that used as mask of dragContainer.
     * @returns { Object }
     */
    _makeMask() {
        let mask = new PIXI.Graphics();
        mask.lineStyle(0);
        mask.beginFill(0xffffff);
        mask.drawRect(0, 0, 1, 1);
        mask.endFill();
        return mask;
    }

    /**
     * Moves dragContainer via attached slider.
     * @param { Object } 
     */
    _onScrollSliderMove({ position, class: className }) {
        if (className !== this.sliderClass)
            return

        if (this.height >= this._baseObject.height) {
            this._slider._moveSlider({ x: 0, y: 0 }, true, true);
            return;
        }

        const { sliderSize } = this._slider;
        const containerHeight = this._mask.height - this._baseObject.height;
        const diffY = position > 0 ? position / sliderSize * containerHeight : 0;

        this._needMoveSlider = false;
        this._move(diffY, true)
    }

    /**
     * Callback on slider move end.
     * @param { Object }
     */
    _sliderHandleDrop({ class: className }) {
        if (className === this.sliderClass)
            this._needMoveSlider = true;
    }

    /**
     * function recieves object that contains an array of dragcontainer's names or ['*'] if we need block all dragContainers
     * @param { Object } blockParams 
     */
    _switchBlock(blockParams) {
        if (!blockParams)
            return;

        const { names, needBlock } = blockParams;

        if (names.includes(this.name) || names.includes('*')) {
            this._needBlock = needBlock;
        }
    }

    /**
     * Checks if need to set slider. If no dragContainerName - slider will be set for all dragContainers.
     * @param {String} dragContainerName 
     * @returns 
     */
    _setSliderHandler(dragContainerName) {
        if (dragContainerName && dragContainerName !== this.name)
            return;

        this._setSlider();
    }

    /**
     * Sets callbacks on pointer events
     */
    _pointerEventsHandler(event) {
        switch (event.type) {
            case 'mousedown':
                this._moveStartedY = event.offsetY;
                this._documentPointerStart(event);
                break;
            case 'touchstart':
                this._offsetStartY = event.changedTouches[0].offsetY;
                this._moveStartedY = event.changedTouches[0].offsetY || event.changedTouches[0].clientY;
                this._documentPointerStart(event);
                break;
            case 'mousemove':
            case 'touchmove':
                this._documentPointerMove(event);
                break;
            case 'touchend':
            case 'mouseup':
                this._documentPointerEnd(event);
                break;
            case 'wheel':
                this._documentWheelScroll(event);
                break;
            default:
                break;
        }
    }

    /**
     * Resets last saved position of dragContainer on resolution change.
     */
    _onResolutionChange() {
        this._setNewPosition(this._currentPosition);
    }

    /**
     * Unsubscribes methods on object destroy.
     */
    _customDestroy() {
        this.removeListener(Urso.events.EXTRA_BROWSEREVENTS_POINTER_EVENT, this._pointerEventsHandler);
        this.removeListener(Urso.events.MODULES_OBJECTS_SLIDER_HANDLE_MOVE, this._onScrollSliderMove);
        this.removeListener(Urso.events.MODULES_OBJECTS_SLIDER_HANDLE_DROP, this._sliderHandleDrop);
        this.removeListener(Urso.events.MODULES_SCENES_DISPLAY_FINISHED, this._setSliderHandler);
        this.removeListener(Urso.events.MODULES_OBJECTS_DRAGCONTAINER_SETSLIDER, this._setSliderHandler);
        this.removeListener(Urso.events.MODULES_OBJECTS_DRAGCONTAINER_SWITCHBLOCK, this._switchBlock);
        this.removeListener(Urso.events.MODULES_SCENES_NEW_RESOLUTION, this._onResolutionChange);
    }

    /**
     * Subscribes methods.
     */
    _subscribeOnce() {
        this.addListener(Urso.events.EXTRA_BROWSEREVENTS_POINTER_EVENT, this._pointerEventsHandler);
        this.addListener(Urso.events.MODULES_OBJECTS_SLIDER_HANDLE_MOVE, this._onScrollSliderMove);
        this.addListener(Urso.events.MODULES_OBJECTS_SLIDER_HANDLE_DROP, this._sliderHandleDrop);
        this.addListener(Urso.events.MODULES_SCENES_DISPLAY_FINISHED, this._setSliderHandler);
        this.addListener(Urso.events.MODULES_OBJECTS_DRAGCONTAINER_SETSLIDER, this._setSliderHandler);
        this.addListener(Urso.events.MODULES_OBJECTS_DRAGCONTAINER_SWITCHBLOCK, this._switchBlock);
        this.addListener(Urso.events.MODULES_SCENES_NEW_RESOLUTION, this._onResolutionChange);
    }
}

module.exports = ModulesObjectsModelsDragContainer;
