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
                const rv = Reflect.set(target, key, value, receiver);
                _this._customSetLogic(target, key, value, proxy);
                return rv;
            }
        });

        return proxy;
    }

    /* targetObject - object from models
     * propertyName - property to adapt for PIXI object 
     * value - value to set
     */
    _setProperty(target, propertyName, value) {
        const isAdaptiveProperty = this._propertyAdapter.isAdaptiveProperty(propertyName);

        if (isAdaptiveProperty)
            this._propertyAdapter.propertyChangeHandler(target, propertyName);
        else
            Urso.helper.recursiveSet(propertyName, value, target._baseObject);
    }

    safeSetValueToTarget(target, key, value) {
        this._safeFlag = true;

        const originalValue = target._originalModel[key];
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

    _customSetLogic(target, key, value, proxy) {
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

        this._setProperty(target, propertyName, value);

        //setup dirty to recalc params
        if (typeof target._baseObject.dirty !== 'undefined')
            target._baseObject.dirty = true;

        return true;
    };

    _runCustomFunction(property, target) {
        const funcName = property.replace('function.', '');
        if (target[funcName])
            target[funcName]();
    }

    _checkSelectorProperties(key) {
        if (!this._safeFlag && this._getSelectorProperties().includes(key)) {
            Urso.logger.error('ModulesObjectsProxy error: you are trying to change selector propertie: ' + key);
            Urso.logger.error('Notice: use functions addClass, removeClass, setId, setName');
        }
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
            'z': 'z',
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
            'stroke': 'style.stroke',
            'strokeThickness': 'style.strokeThickness',
            'dropShadow': 'style.dropShadow',
            'dropShadowColor': 'style.dropShadowColor',
            'dropShadowBlur': 'style.dropShadowBlur',
            'dropShadowAngle': 'style.dropShadowAngle',
            'dropShadowDistance': 'style.dropShadowDistance',
            'wordWrap': 'style.wordWrap',
            'wordWrapWidth': 'style.wordWrapWidth',
            'enabled': 'input.enabled'
        };
    }
}

module.exports = ModulesObjectsProxy;
