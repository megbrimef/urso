// PERF: allocating fresh literals on every property access — moved to module-level constants
const SELECTOR_PROPERTIES = [
    'id', 'name', 'class'
];

const ORIGINAL_MODEL_EXCEPTIONS = [
    'parent', 'contents'
];

const ALIASES = {
    'id': 'id',
    'name': 'name', //'name',
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
    // FIXED: removed dead Pixi v4/v5 signal path — 'events.onInputUp._bindings.0._listener' does not exist in Pixi v8
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
    // REMOVED: 'fillCustomColors' alias — feature inert since v8 migration, removed to simplify surface
    'stroke': 'style.stroke.color',
    'strokeThickness': 'style.stroke.width',
    'dropShadow': 'style.dropShadow',
    'dropShadowColor': 'style.dropShadow.color',
    'dropShadowBlur': 'style.dropShadow.blur',
    'dropShadowAngle': 'style.dropShadow.angle',
    'dropShadowDistance': 'style.dropShadow.distance',
    'wordWrap': 'style.wordWrap',
    'wordWrapWidth': 'style.wordWrapWidth',
    'leading': 'style.leading',
    'letterSpacing': 'style.letterSpacing',
    'textAlign': 'style.align',
    'enabled': 'input.enabled',
    // ADDED: cullable — Pixi v8 CullerPlugin performance property, skips rendering outside viewport
    'cullable': 'cullable',
    // ADDED: cullArea — Pixi v8 CullerPlugin performance property, pre-computed bounds for culling
    'cullArea': 'cullArea',
    // ADDED: interactiveChildren — Pixi v8 performance property, disables hit-testing recursion into subtree
    'interactiveChildren': 'interactiveChildren',
    // ADDED: cacheAsBitmap routes through the baseFunction convention because in Pixi v8
    // cacheAsTexture is a METHOD, not a property — a plain path mapping would assign over
    // the method and caching would silently never happen. Pixi's own cacheAsBitmap setter
    // still exists but is deprecated, which is why we call cacheAsTexture directly.
    'cacheAsBitmap': 'baseFunction.cacheAsTexture',
    'ignoreParentMask': 'ignoreParentMask',
    //baseObject functions
    'toGlobal': 'toGlobal'
};

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
        
        model.proxyObject = proxy;
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
        const wrapKey = ALIASES[key];  // PERF: direct constant access instead of method call
        
        const isReflectValueObject = typeof reflectValue !== 'undefined'; //&& typeof reflectValue !== 'boolean'; //it was for getting width and height

        if ((isReflectValueObject && (typeof wrapKey != 'undefined')) || !wrapKey)
            return reflectValue;

        return Urso.helper.recursiveGet(wrapKey, target._baseObject, reflectValue);
    }

    _customSetLogic(target, key, value, proxy, oldValue) {
        if (!ORIGINAL_MODEL_EXCEPTIONS.includes(key))  // PERF: direct constant access instead of method call
            target._originalModel[key] = value;

        //apply to pixi
        const propertyName = ALIASES[key];  // PERF: direct constant access instead of method call

        if (!propertyName)
            return false;

        if (propertyName.startsWith('function.')) {
            this._runCustomFunction(propertyName, target);
            return true;
        }

        // ADDED: baseFunction convention — calls a method on the underlying Pixi object with the assigned value
        if (propertyName.startsWith('baseFunction.')) {
            this._runBaseObjectFunction(propertyName, target, value);
            return true;
        }

        this._checkSelectorProperties(key);

        value = target.modifyValue(key, value);
        this._setProperty(target, propertyName, value, oldValue);

        // FIXED: text update hook removed — Pixi v8 Text auto-updates when .text is assigned, no explicit call needed

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

        // FIXED: Pixi v8 updateTransform(opts) is a property setter that does nothing with empty object — v7 compatibility removed

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

    // ADDED: calls a method on the underlying Pixi object, passing the assigned value — safely handles missing methods
    _runBaseObjectFunction(property, target, value) {
        const funcName = property.replace('baseFunction.', '');
        const baseObject = target._baseObject;

        // ADDED: baseModel initialises _baseObject to null, so a set arriving before
        // _addBaseObject has run would throw on the property access below.
        if (!baseObject) {
            Urso.logger.error(`ModulesObjectsProxy: baseFunction.${funcName} — no baseObject yet`);
            return;
        }

        if (typeof baseObject[funcName] !== 'function') {
            Urso.logger.error(`ModulesObjectsProxy: baseFunction.${funcName} — method not found on baseObject`);
            return;
        }

        baseObject[funcName](value);
    }

    _checkSelectorProperties(key) {
        if (!this._safeFlag && SELECTOR_PROPERTIES.includes(key)) {  // PERF: direct constant access instead of method call
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
            !target.transitionDuration
        )
            return;

        // PERF: memoise string split to avoid allocating array on every property set with transitions
        if (target._transitionPropertySource !== target.transitionProperty) {
            target._transitionPropertyList = target.transitionProperty.split(' ');
            target._transitionPropertySource = target.transitionProperty;
        }

        if (!target._transitionPropertyList.includes(propertyName))
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
        return SELECTOR_PROPERTIES;
    }

    _getOriginalModelExceptions() {
        return ORIGINAL_MODEL_EXCEPTIONS;
    }

    _getAliases() {
        return ALIASES;
    }
}

export default ModulesObjectsProxy;
