
const containers = [];

class ModulesObjectsModelsDragContainer extends Urso.Core.Modules.Objects.Models.Container {
    _mask = null;
    _interactiveLayer = null;
    _filler = null;
    _startPosition = null;
    _startY = 0;
    _ofsetStartY = 0;
    _needBlock = false;
    _scrollSpeed = 2;
    _needMoveSlider = true;
    _moveStartedY = 0;
    _dragStarted = false;
    _anException = 'mainDrag';
    _needBlockAllDrags = false;
    _easingTime = 1.5;

    constructor(params) {
        super(params);
        this.type = Urso.types.objects.DRAGCONTAINER;
        this.addListener('modules.objects.styles.resize', () => Urso.setTimeout(() => {
            this.resize(true)
        }, 0));
        this.addListener('components.loader.gameCreated', () => this.resize());


        this._setupDragContainer();

        this._resizeInteractiveLayer();
        this._resizeMask();
        this._setEvents();

        containers.push(this);
    }

    resize(moveMask) {

        this._resizeInteractiveLayer();
        this._resizeMask();

        if (moveMask) {
            this._mask.y = 0;
        }
    }

    _setupDragContainer() {
        this._mask = this._makeMask();
        this._interactiveLayer = this._makeInteractiveLayer();
        this._filler = this._makeFiller();

        this._baseObject.addChild(this._mask);
        this._baseObject.addChild(this._interactiveLayer);
        this._baseObject.addChild(this._filler);

        this._baseObject.mask = this._mask;
    }

    setupParams(params) {
        super.setupParams(params);
        this.speed = Urso.helper.recursiveGet('speed', params, 1);
        this.dragIndex = Urso.helper.recursiveGet('dragIndex', params, 0);
        this.sliderClass = Urso.helper.recursiveGet('sliderClass', params, false);
    }

    get _moveInProgress() {
        return this._interactiveLayer.visible
    }

    set _moveInProgress(inProgress) {
        this._interactiveLayer.visible = inProgress;
    }

    _isActive({ x, y }) {
        const pointerOverContainers = containers
            .filter((container) => {
                const points = this._getObjectPoints(container);
                return this._checkPointerOver({ x, y }, ...points);
            })
            .filter((container) => container._baseObject.worldVisible)
            .filter((container) => !container._needBlock)
            .filter((container) => {
                let height = container.getAbsoluteSize().height;
                return container.height - height < 0;
            })
            .sort((c1, c2) => c2.dragIndex - c1.dragIndex);

        return pointerOverContainers[0] === this;
    }

    _changeSliderVisibility() {
        if (!this._slider)
            return;

        this._slider.visible = this.height < this._baseObject.height;
    }

    _setNeedBlock(nameDrag) {
        if (this._needBlockAllDrags) {
            this.emit(Urso.events.MODULES_OBJECTS_DRAGCONTAINER_SWITCHBLOCK, { names: ['*'], needBlock: true });
            return;
        }

        if (Urso.localData.get('openMenu')) {
            this.emit(Urso.events.MODULES_OBJECTS_DRAGCONTAINER_SWITCHBLOCK, { names: ['*'], needBlock: true });
            if (nameDrag !== this._anException) {
            
                Urso.observer.fire('modules.objects.dragContainer.switchBlock', { names: [nameDrag], needBlock: false });
            } else {
                return
            }
        } else {
            Urso.observer.fire('modules.objects.dragContainer.switchBlock', { names: ['*'], needBlock: false });
        }
    }

    _product(pX, pY, aX, aY, bX, bY) {
        return (bX - aX) * (pY - aY) - (bY - aY) * (pX - aX);
    }

    _checkPointerOver(p, p1, p2, p3, p4) {
        const v1 = this._product(p.x, p.y, p1.x, p1.y, p2.x, p2.y);
        const v2 = this._product(p.x, p.y, p2.x, p2.y, p3.x, p3.y);
        const v3 = this._product(p.x, p.y, p3.x, p3.y, p4.x, p4.y);
        const v4 = this._product(p.x, p.y, p4.x, p4.y, p1.x, p1.y);
        return (v1 < 0 && v2 < 0 && v3 < 0 && v4 < 0) || (v1 > 0 && v2 > 0 && v3 > 0 && v4 > 0)
    }

    _getObjectPoints(container) {

        if (Urso.device.desktop) {
            const { x, y } = this._getPatentScaleRecursive(this);
            const { width, height } = container._mask;
            const { scaleX, scaleY } = this._getPatentScaleRecursive(this);

            return [
                { x, y },
                { x: x + width * scaleX, y },
                { x: x + width * scaleX, y: y + height * scaleY },
                { x, y: y + height * scaleY }
            ];

        } else {

            const { x, y } = container._mask.toGlobal(new PIXI.Point(0, 0));
            const { width, height } = container._mask;
            const { scaleX, scaleY } = this._getPatentScaleRecursive(this);

            return [
                { x, y },
                { x: x + width * scaleX, y },
                { x: x + width * scaleX, y: y + height * scaleY },
                { x, y: y + height * scaleY }
            ];
        }

    }

    _getPatentScaleRecursive({ scaleX, scaleY, parent, x, y }) {
        if (!parent) {
            return { scaleX, scaleY, x, y };
        }

        const { scaleX: parentScaleX, scaleY: parentScaleY, x: parentX, y: parentY } = this._getPatentScaleRecursive(parent);

        return {
            scaleX: scaleX * parentScaleX,
            scaleY: scaleY * parentScaleY,
            x: x + parentX,
            y: y + parentY,
        }
    }

    _documentPointerMove(e) {
        this._moveInProgress = true;
        let offset = e.offsetY || e.changedTouches[0].offsetY || e.changedTouches[0].clientY;

        if (Math.abs(this._moveStartedY - offset) > 15 && !this._dragStarted) {
            this._dragStarted = true;
            this.emit('modules.objects.dragContainer.dragStarted')
        }
    }

    _getPointerPosition(e) {
        const { clientX, clientY } = e.targetTouches ? e.targetTouches[0] : e;
        return { x: clientX, y: clientY };
    }

    _documentPointerEnd(e) {
        const timeDelta = Date.now() - this._lastMoveTime;

        Urso.observer.fire('modules.objects.dragContainer.switchBlock', { names: ['*'], needBlock: false });
        if (this._wasMoved && timeDelta < 100)
            this._startMoveEasing();
        else
            this._startPosition = null;

        this._onMoveComplete();
        this._wasMoved = false;
    }

    _startMoveEasing() {
        const targetY = this._getEasingTargetY();

        if (!targetY) {
            this._startPosition = null;
            return
        };


        let obj = { y: this._baseObject.y };
        this._easingTween = gsap.to(obj, this._easingTime, {
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

    _killTweens() {
        if (this._easingTween) {
            this._easingTween.pause();
            this._easingTween.kill(true);
            this._easingTween = null;
            this._startPosition = null;
        };
    }

    _getEasingTargetY() {
        const multipler = this._moveStartY > this._baseObject.y ? -1 : 1;

        if (Math.abs(this._moveStartY - this._baseObject.y) < 50)
            return false;

        return this._baseObject.y + 200 * multipler;
    }

    _onMoveComplete() {
        this._moveInProgress = false;

        this._dragStarted = false;
        this._isWheelMove = false;
        this.emit('modules.objects.dragContainer.dragFinished');
        this._isBorder = false;
    }

    _checkMaxMin(y, lastPosY, deltaY) {
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

    _validateY(lastY, isWheel) {
        const deltaY = isWheel ? lastY * this.speed : ((lastY - this._startPosition.y) * this.speed);
        const lastPosY = this._mask.height - this._baseObject.height;
        const targetY = isWheel ? lastY : this._startY + deltaY
        return this._checkMaxMin(targetY, lastPosY, deltaY);;
    }

    _move(dY, isWheel) {
        this._lastMoveTime = Date.now();
        this._setNeedBlock(this.name);
        const y = this._validateY(dY, isWheel);
        this._setNewPosition(y, dY);
        this._mask.y = -y;
        this._interactiveLayer.y = -y;
        this._needMoveSlider && this._setSliderPosition(y)
    }

    _setSlider() {
        if (!this.sliderClass)
            return;

        const sliderCont = this.parent.contents.find(obj => obj.class && obj.class.indexOf(this.sliderClass) !== -1)
        this._slider = sliderCont.contents[0];
    }

    _setSliderPosition(y) {
        if (!this._slider)
            return;

        const { height } = this.getAbsoluteSize()
        const positionChange = y / (height - this.height);

        const { _sliderHandle, _sliderSize } = this._slider;

        _sliderHandle.y = -(_sliderSize * positionChange);
    }

    _documentPointerStart() {
        this._startY = this._getStartY();
        this._moveStartY = this._getStartY();
        this._startTime = Date.now();
        this._killTweens();
    }

    _setNewPosition(y) {
        this._baseObject.y = y;
    }

    _getStartY() {
        return this._baseObject.y;
    }

    _setEvents() {
        const eventCallback = (e) => this._documentPointerMove(e);

        document.addEventListener('mousedown', (e) => {
            this._moveStartedY = e.offsetY;
            this._documentPointerStart(e)
            document.addEventListener('mousemove', eventCallback);
        });
        document.addEventListener('mouseup', (e) => {
            this._documentPointerEnd(e)
            document.removeEventListener('mousemove', eventCallback);
        });

        document.addEventListener('touchstart', (e) => {
            this._ofsetStartY = e.changedTouches[0].offsetY;
            this._moveStartedY = e.changedTouches[0].offsetY || e.changedTouches[0].clientY;

            this._documentPointerStart(e)
        });
        document.addEventListener('touchmove', (e) => this._documentPointerMove(e));
        document.addEventListener('touchend', (e) => this._documentPointerEnd(e));
        document.addEventListener('wheel', (e) => this._documentWheelScroll(e));
        this._interactiveLayer.on('pointermove', (e) => this._onPointerMove(e));

    }

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
        this._moveStartY = this._getStartY();
        const nextY = startY - deltaY

        this.emit('modules.objects.dragContainer.scroll');

        this._move(nextY, true);
        this._startMoveEasing()
    }

    _onPointerMove(event) {
        let { data: { global: { x, y } } } = event;

        if (Urso.device.desktop) {
            x = Urso.scenes.getMouseCoords().x;
            y = Urso.scenes.getMouseCoords().y;
        }

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

    _resizeMask() {
        this._mask.width = this.width;
        this._mask.height = this.height;
    }

    _resizeInteractiveLayer() {
        this._interactiveLayer.width = this.width;
        this._interactiveLayer.height = this.height;
    }

    _makeInteractiveLayer() {
        let layer = new PIXI.Graphics();
        layer.beginFill(0xffffff);
        layer.drawRect(0, 0, 1, 1);
        layer.endFill();
        layer.zIndex = 10;
        layer.alpha = 0;
        layer.visible = false;
        layer.interactive = true;
        return layer;
    }

    _makeFiller() {
        let layer = new PIXI.Graphics();
        layer.beginFill(0xffffff);
        layer.drawRect(0, 0, 1, 1);
        layer.endFill();
        layer.alpha = 0;
        return layer;
    }

    _makeMask() {
        let mask = new PIXI.Graphics();
        mask.lineStyle(0);
        mask.beginFill(0xffffff);
        mask.drawRect(0, 0, 1, 1);
        mask.endFill();
        return mask;
    }

    _onScrollSliderMove({ position, class: className }) {

        if (className !== this.sliderClass)
            return

        if (this.height >= this._baseObject.height) {
            this._slider._moveSlider({ x: 0, y: 0 }, true, true);
            return;
        }

        const { _sliderSize } = this._slider;
        const containerHeight = this._mask.height - this._baseObject.height;
        const diffY = position > 0 ? position / _sliderSize * containerHeight : 0;

        this._needMoveSlider = false;
        this._move(diffY, true)
    }

    _sliderHandleDrop({ class: className }) {

        if (className === this.sliderClass)
            this._needMoveSlider = true;
    }

    _checkOpenPopup(isOpen) {
        this._needBlockAllDrags = isOpen;
    }

    _subscribeOnce() {
        this.addListener(Urso.events.MODULES_OBJECTS_SLIDER_HANDLE_MOVE, this._onScrollSliderMove.bind(this));
        this.addListener(Urso.events.MODULES_OBJECTS_SLIDER_HANDLE_DROP, this._sliderHandleDrop.bind(this));
        this.addListener('components.loader.gameCreated', this._setSlider.bind(this), true);
        this.addListener('modules.objects.dragContainer.switchBlock', ({ names = [], needBlock }) => {
            if (names.includes(this.name) || names.includes('*')) {
                this._needBlock = needBlock;
            }
        }, true);

        this.addListener('components.popup.open', this._checkOpenPopup.bind(this));
    }
}

module.exports = ModulesObjectsModelsDragContainer;