class ModulesObjectsProxy {
    constructor() {
        this.singleton = true;
        this._safeFlag = false;

        this._customSetLogic = this._customSetLogic.bind(this);
        this._customGetLogic = this._customGetLogic.bind(this);

        this._propertyAdapter = this.getInstance('PropertyAdapter');
    };

    get(model) {
        const _this = this;

        let proxy = new Proxy(model, {
            get(target, key, receiver) {
                const rv = Reflect.get(target, key, receiver);
                return _this._customGetLogic({ target: target, proxy: receiver }, key, rv);
            },

            set(target, key, value, receiver) {
                const oldValue = target._baseObject[key];
                const rv = Reflect.set(target, key, value, receiver);
                _this._customSetLogic(target, key, value, proxy, oldValue);
                return rv;
            }
        });

        return proxy;
    }

    /* targetObject - object from models
     * propertyName - property to adapt for PIXI object 
     * value - value to set
     */
    _setProperty(target, propertyName, value, oldValue) {
        const isAdaptiveProperty = this._propertyAdapter.isAdaptiveProperty(propertyName);

        if (isAdaptiveProperty)
            this._propertyAdapter.propertyChangeHandler(target, propertyName);
        else
            Urso.helper.recursiveSet(propertyName, value, target._baseObject);

        this._checkNeedTransitions(target, propertyName, value, oldValue);
    }

    safeSetValueToTarget(target, key, value) {
        this._safeFlag = true;

        const originalValue = target._originalModel[key]; // we need to save original value in the end

        //setting value
        target[key] = value;

        target._originalModel[key] = originalValue;

        this._safeFlag = false;
    }

    //returns reflectValue = value that would be used when target[key] is called
    _customGetLogic(object, key, reflectValue) {
        const target = object.target;
        const wrapKey = this._getAliases()[key];
        const isReflectValueObject = typeof reflectValue !== 'undefined'; //&& typeof reflectValue !== 'boolean'; //it was for getting width and height

        if ((isReflectValueObject && (typeof wrapKey != 'undefined')) || !wrapKey)
            return reflectValue;

        return Urso.helper.recursiveGet(wrapKey, target._baseObject, reflectValue);
    }

    _customSetLogic(target, key, value, proxy, oldValue) {
        if (!this._getOriginalModelExceptions().includes(key))
            target._originalModel[key] = value;

        //apply to pixi
        const propertyName = this._getAliases()[key];

        if (!propertyName)
            return false;

        if (propertyName.startsWith('function.')) {
            this._runCustomFunction(propertyName, target);
            return true;
        }

        this._checkSelectorProperties(key);

        this._setProperty(target, propertyName, value, oldValue);

        //if property is text - we will update it
        if (propertyName === 'text') {
            target._baseObject.updateText(true);
        }

        this._checkMaxSize(target);

        //setup dirty to recalc params
        if (typeof target._baseObject.dirty !== 'undefined')
            target._baseObject.dirty = true;

        return true;
    };

    _checkMaxSize(target) {
        if (!target.maxWidth && !target.maxHeight)
            return;

        let calculationNeed = false;

        const baseObject = target._baseObject;
        baseObject.updateTransform();
        
        //Pixi texts have _texture.orig.width. When we call baseObject.width, Pixi runs update text. Its too slow operation.
        if (baseObject._texture && (!baseObject._texture.orig.width || !baseObject._texture.orig.height)) {
            baseObject.updateText(true);
        }

        const baseObjectWidth = baseObject._texture ? Math.abs(baseObject.scale.x) * baseObject._texture.orig.width : baseObject.width;
        const baseObjectHeight = baseObject._texture ? Math.abs(baseObject.scale.y) * baseObject._texture.orig.height : baseObject.height;

        if (
            target.maxWidth &&
            (
                target.maxWidth < baseObjectWidth ||  //maxWidth is lower than object width
                (target.maxWidth > baseObjectWidth && target._baseObject.scale.x < 1) //maxWidth is higher than object width and object is downscaled
            )
        ) //check maxWidth
            calculationNeed = true;

        if (
            target.maxHeight &&
            (
                target.maxHeight < baseObjectHeight ||  //maxHeight is lower than object height
                (target.maxHeight > baseObjectHeight && target._baseObject.scale.y < 1) //maxHeight is higher than object height and object is downscaled
            )
        ) //check maxHeight
            calculationNeed = true;

        if (!calculationNeed)
            return;

        let scaleNeed = 1;

        if (target.maxWidth) {
            scaleNeed = Math.abs((target._baseObject.scale.x * target.maxWidth) / target._baseObject.width);
        }

        if (target.maxHeight) {
            const scaleYNeed = Math.abs((target._baseObject.scale.y * target.maxHeight) / target._baseObject.height);

            if (scaleNeed > scaleYNeed)
                scaleNeed = scaleYNeed;
        }

        if (scaleNeed > 1)
            scaleNeed = 1;

        target._baseObject.scale.x = scaleNeed * Math.sign(target._baseObject.scale.x);
        target._baseObject.scale.y = scaleNeed * Math.sign(target._baseObject.scale.y);
    }

    _runCustomFunction(property, target) {
        const funcName = property.replace('function.', '');
        if (target[funcName])
            target[funcName]();
    }

    _checkSelectorProperties(key) {
        if (!this._safeFlag && this._getSelectorProperties().includes(key)) {
            Urso.logger.error('ModulesObjectsProxy error: you are trying to change selector property: ' + key);
            Urso.logger.error('Notice: use functions addClass, removeClass, setId, setName');
        }
    }

    /**
     * transitions tweens creation
     * @param {Object} target - ObjectsModel
     * @param {String} propertyName
     * @param {Number} value
     * @param {Number} oldValue
     */
    _checkNeedTransitions(target, propertyName, value, oldValue) {
        if (
            typeof oldValue === 'undefined' ||
            !target.transitionProperty ||
            !target.transitionDuration ||
            !target.transitionProperty.split(' ').includes(propertyName)
        )
            return;

        const baseNewValue = target._baseObject[propertyName];

        //remove old active tween
        const currentTween = target._transitions.tweens[propertyName];

        if (currentTween)
            currentTween.kill();

        //set base value
        target._baseObject[propertyName] = oldValue;

        //create new tween
        const tweenParams = { duration: target.transitionDuration / 1000, ease: "none" };
        tweenParams[propertyName] = baseNewValue;

        if (target.transitionDelay)
            tweenParams.delay = target.transitionDelay / 1000;

        const newTween = gsap.to(target._baseObject, tweenParams);
        target._transitions.tweens[propertyName] = newTween;

        newTween.eventCallback("onComplete", () => {
            target._transitions.tweens[propertyName] = null;
        });
    }

    _getSelectorProperties() {
        return [
            'id', 'name', 'class'
        ];
    }

    _getOriginalModelExceptions() {
        return [
            'parent', 'contents'
        ];
    }

    _getAliases() {
        return {
            'id': 'id',
            'name': 'name',
            'class': 'class',
            'x': 'x',
            'y': 'y',
            'z': 'zIndex',
            'angle': 'angle',
            'anchorX': 'anchor.x', //'anchor.x',
            'anchorY': 'anchor.y', //'anchor.y',
            'width': 'width', //'width',
            'height': 'height', //'height',
            'stretchingType': 'stretchingType',
            'scaleX': 'scale.x', //'scale.x',
            'scaleY': 'scale.y', //'scale.y',
            'alignX': 'alignX', //'alignX',
            'alignY': 'alignY', //'alignY',
            'parent': 'parent',
            'rightOffset': 'rightOffset',
            'bottomOffset': 'bottomOffset',
            'alpha': 'alpha',
            'visible': 'visible',
            'text': 'text',
            //'assetKey': 'function.setAssetKey', /todo
            'frame': 'frame',
            'blendMode': 'blendMode',
            'tint': 'tint',
            'action': 'events.onInputUp._bindings.0._listener', //todo
            'btnFrames.over': 'frames.over',
            'btnFrames.out': 'frames.out',
            'btnFrames.down': 'frames.down',
            'btnFrames.up': 'frames.up',
            'align': 'align',
            'filters': 'filters',
            'lineSpacing': 'lineSpacing',
            'maxWidth': 'maxWidth',
            'maxHeight': 'maxHeight',
            'lineHeight': 'style.lineHeight',
            'fontFamily': 'style.fontFamily',
            'fontSize': 'style.fontSize',
            'fontStyle': 'style.fontStyle',
            'fontWeight': 'style.fontWeight',
            'fill': 'style.fill',
            'fillCustomColors': 'fillCustomColors',
            'stroke': 'style.stroke',
            'strokeThickness': 'style.strokeThickness',
            'dropShadow': 'style.dropShadow',
            'dropShadowColor': 'style.dropShadowColor',
            'dropShadowBlur': 'style.dropShadowBlur',
            'dropShadowAngle': 'style.dropShadowAngle',
            'dropShadowDistance': 'style.dropShadowDistance',
            'wordWrap': 'style.wordWrap',
            'wordWrapWidth': 'style.wordWrapWidth',
            'leading': 'style.leading',
            'letterSpacing': 'style.letterSpacing',
            'textAlign': 'style.align',
            'enabled': 'input.enabled',
            'cacheAsBitmap': 'cacheAsBitmap',
            'ignoreParentMask': 'ignoreParentMask',
            //baseObject functions
            'toGlobal': 'toGlobal'
        };
    }
}

module.exports = ModulesObjectsProxy;
