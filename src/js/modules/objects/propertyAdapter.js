/**
 * adapter Urso to Pixi objects
 */
class PropertyAdapter {

    constructor() {
        this.singleton = true;

        /**
         * dependencies, functions to handle changing property
         */
        this._dependencies = {
            'x': this._updateHorizontal.bind(this),
            'y': this._updateVertical.bind(this),
            'anchorX': this._updateHorizontal.bind(this),
            'anchorY': this._updateVertical.bind(this),
            'scaleX': this._adaptScaleX.bind(this),
            'scaleY': this._adaptScaleY.bind(this),
            'alignX': this._updateHorizontal.bind(this),
            'alignY': this._updateVertical.bind(this),
            'width': this._updateHorizontal.bind(this),
            'height': this._updateVertical.bind(this),
            'angle': this._updateAngle.bind(this),
            'stretchingType': this._adaptStretchingType.bind(this), //todo check on parent change
            'parent': this._parentChangeHandler.bind(this)
        };

        /**
         * functions to handle changing parent property
         */
        this._parentToChildDependencies = {
            'width': { children: ['width'] },
            'height': { children: ['height'] },
            'anchorX': { children: ['x'] },
            'anchorY': { children: ['y'] },
            'stretchingType': { children: ['width', 'height'] }
        };

        /**
         * parent types list
         */
        this._parentTypes = [
            Urso.types.objects.COMPONENT,
            Urso.types.objects.CONTAINER,
            Urso.types.objects.DRAGCONTAINER,
            Urso.types.objects.GROUP,
            Urso.types.objects.SCROLLBOX,
            Urso.types.objects.SLIDER,
            Urso.types.objects.SPINE,
            Urso.types.objects.WORLD
        ];

        /**
         * types without ahchor list
         */
        this._typesWithoutAnchor = [
            Urso.types.objects.CHECKBOX,
            Urso.types.objects.EMITTER,
            Urso.types.objects.EMITTERFX,
            Urso.types.objects.GRAPHICS,
            Urso.types.objects.HITAREA,
            Urso.types.objects.MASK,
            Urso.types.objects.NINESLICEPLANE,
            Urso.types.objects.SLIDER,
            Urso.types.objects.SPINE,
            Urso.types.objects.TEXTINPUT,
            Urso.types.objects.WORLD
        ];
    }

    /**
     * check is adaptive property
     * @param {String} property
     * @returns {Boolean}
     */
    isAdaptiveProperty(property) {
        return Object.keys(this._dependencies).includes(property);
    };

    /**
     * property change handler (main function)
     * @param {Object} object
     * @param {String} propertyName
     */
    propertyChangeHandler(object, propertyName) {
        this._adaptProperty(object, propertyName);
        this._adaptChildProperties(object, propertyName);
    }

    /**
     * adapt property (launch handler changing property)
     * @param {Object} object
     * @param {String} propertyName
     */
    _adaptProperty(object, propertyName) {
        if (this._dependencies[propertyName])
            this._dependencies[propertyName](object);
    }

    /**
     * main function to calculate x and width
     * @param {Object} object
     */
    _updateHorizontal(object) {
        let x = this._getXAsNumber(object);
        x += this._adaptAnchorX(object);
        x += this._adaptAlignX(object);
        object._baseObject.x = x;

        this._adaptWidth(object);
    }

    /**
     * main function to calculate angle
     * @param {Object} object
     */
    _updateAngle(object) {
        object._baseObject.angle = object.angle;

        if (!this._canBeParent(object)) {
            return;
        }

        this._updateHorizontal(object);
        this._updateVertical(object);
    }

    /**
     * main function to calculate y and height
     * @param {Object} object
     */
    _updateVertical(object) {
        let y = this._getYAsNumber(object);
        y += this._adaptAnchorY(object);
        y += this._adaptAlignY(object);
        object._baseObject.y = y;

        this._adaptHeight(object);
    }

    /**
     * set property value without adaptation
     * @param {Object} object
     * @param {String} propertyName
     * @param {mixed} value
     */
    _setPropertyWithoutAdaption(object, propertyName, value) { //in error case
        object[propertyName] = value;
    }

    /**
     * adapt child properties if parent properties was changed
     * @param {Object} object
     * @param {String} propertyName
     */
    _adaptChildProperties(object, propertyName) {
        const { children } = this._parentToChildDependencies[propertyName] || {};
        const objectHasChildren = this._canBeParent(object) && object.hasOwnProperty('contents');

        if (!children || !objectHasChildren)
            return;

        for (let dependency of children)
            for (let child of object.contents)
                this.propertyChangeHandler(child, dependency);
    }

    /**
     * main handler when new parent was setted
     * @param {Object} child
     */
    _parentChangeHandler(child) {
        if (child.parent == null)
            return;

        for (let propertyName of this._propertiesDependentOnParent())
            this.propertyChangeHandler(child, propertyName);
    }

    /**
     * get array of properties dependent on parent
     * //todo cache them and get just one time
     * @returns {Array}
     */
    _propertiesDependentOnParent() {
        const properties = [];

        for (let propertyName of Object.keys(this._parentToChildDependencies)) {
            const { children } = this._parentToChildDependencies[propertyName];

            if (children)
                for (let dependency of children)
                    properties.push(dependency);
        }

        return properties;
    }

    /**
     * adapt anchorX
     * @param {Object} object
     */
    _adaptAnchorX(object) {
        if (typeof object.anchorX !== 'number' || object.anchorX < 0 || object.anchorX > 1)
            Urso.logger.error('AnchorX value is not valid!', object);

        if (this._canBeParent(object) && !this._typesWithoutAnchor.includes(object.type)) { //parent types
            if (object.anchorX === 0)
                return 0;

            if (object.angle) {
                return this._getAnchorOffsetByAngle(object, 'x');
            }

            const objectWidth = this._getWidthAsNumber(object);
            return - objectWidth * object.anchorX;
        } else if (!this._typesWithoutAnchor.includes(object.type)) { //regular type and not a type without anchor
            const pixiObject = object._baseObject;
            pixiObject.anchor.x = object.anchorX;
        } else {
            Urso.logger.warn(); ('AnchorX value cannot be used with this object type !', object);
        }

        return 0;
    }

    /**
     * adapt anchorY
     * @param {Object} object
     */
    _adaptAnchorY(object) {
        if (typeof object.anchorY !== 'number' || object.anchorY < 0 || object.anchorY > 1)
            Urso.logger.error('AnchorY value is not valid!', object);

        if (this._canBeParent(object) && !this._typesWithoutAnchor.includes(object.type)) { //parent types
            if (object.anchorY === 0)
                return 0;

            if (object.angle) {
                return this._getAnchorOffsetByAngle(object, 'y');
            }

            const objectHeight = this._getHeightAsNumber(object);
            return - objectHeight * object.anchorY;
        } else if (!this._typesWithoutAnchor.includes(object.type)) { //regular type and not a type without anchor
            const pixiObject = object._baseObject;
            pixiObject.anchor.y = object.anchorY;
        } else {
            Urso.logger.warn(); ('AnchorY value cannot be used with this object type !', object);
        }

        return 0;
    }

    /**
     * get anchor offset by angle for parent types
     * @param {Object} object
     * @param {String} side - x or y
     * @returns {Number}
     */
    _getAnchorOffsetByAngle(object, side) { //side can be x or y
        const objectWidth = this._getWidthAsNumber(object);
        const objectHeight = this._getHeightAsNumber(object);
        const xCatet = (objectWidth * object.anchorX);
        const yCatet = (objectHeight * object.anchorY);
        const offsetRadius = Math.sqrt(Math.pow(xCatet, 2) + Math.pow(yCatet, 2));
        const angleRadian = Math.atan(xCatet / yCatet);  //todo or yCatet/xCatet ?
        const angle = Urso.helper.getAngle(angleRadian);
        const offsetAngle = object.angle + angle;
        const offsetFunction = side === 'x' ? 'cos' : 'sin';
        const angleOffset = - offsetRadius * Math[offsetFunction](Urso.helper.getRadian(offsetAngle));

        return angleOffset;
    }

    /**
     * adapt scaleX
     * @param {Object} object
     */
    _adaptScaleX(object) {
        if (object.scaleX !== 1 && typeof object.width !== 'boolean') {
            Urso.logger.error('ScaleX value cannot be set. Width already used!!');
            this._setPropertyWithoutAdaption(object, 'scaleX', 1);
            return;
        }

        if (typeof object.scaleX === 'number') {
            const pixiObject = object._baseObject;
            pixiObject.scale.x = object.scaleX;
        } else
            Urso.logger.error('ScaleX value is not valid!');
    }

    /**
     * adapt scaleY
     * @param {Object} object
     */
    _adaptScaleY(object) {
        if (object.scaleY !== 1 && typeof object.height !== 'boolean') {
            Urso.logger.error('ScaleY value cannot be set. Height already used!!');
            this._setPropertyWithoutAdaption(object, 'scaleY', 1);
            return;
        }

        if (typeof object.scaleY === 'number' && object.scaleY >= 0) { // TODO: CHECK SCALE CAN BE NEGATIVE
            const pixiObject = object._baseObject;
            pixiObject.scale.y = object.scaleY;
        } else
            Urso.logger.error('ScaleY value is not valid!');
    }

    /**
     * adapt alignX
     * @param {Object} object
     */
    _adaptAlignX(object) {
        if (typeof object.alignX !== 'string') {
            Urso.logger.error('AlignX value is not string!');
            return 0;
        }

        switch (object.alignX) {
            case 'left':
                return 0;
            case 'right':
                return object.parent ? this._getWidthAsNumber(object.parent) : 0; //parentWidth
            case 'center':
                const parentWidth = object.parent ? this._getWidthAsNumber(object.parent) : 0;
                return parentWidth / 2;
            default:
                Urso.logger.error('AlignX string is not valid!');
                return 0;
        }
    }

    /**
     * adapt alignY
     * @param {Object} object
     */
    _adaptAlignY(object) {
        if (typeof object.alignY !== 'string') {
            Urso.logger.error('AlignY value is not string!');
            return 0;
        }

        switch (object.alignY) {
            case 'top':
                return 0;
            case 'bottom':
                return object.parent ? this._getHeightAsNumber(object.parent) : 0; //parentHeight
            case 'center':
                const parentHeight = object.parent ? this._getHeightAsNumber(object.parent) : 0;
                return parentHeight / 2;
            default:
                Urso.logger.error('AlignY string is not valid!');
                return 0;
        }
    }

    /**
     * adapt width
     * @param {Object} object
     */
    _adaptWidth(object) {
        if (typeof object.width !== 'boolean' && object.scaleX !== 1) {
            Urso.logger.error('Width value cannot be set. ScaleX already used!!', object);
            this._setPropertyWithoutAdaption(object, 'width', false);
            return;
        }

        if (!object.width)
            return;

        if (!this._isValueANumberOrPercentsString(object.width))
            return Urso.logger.error('Width value is not valid!!');

        if (!this._canBeParent(object)) {
            const pixiObject = object._baseObject;
            pixiObject.width = this._getWidthAsNumber(object);
        }
    }

    /**
     * adapt height
     * @param {Object} object
     */
    _adaptHeight(object) {
        if (typeof object.height !== 'boolean' && object.scaleY !== 1) {
            Urso.logger.error('Height value cannot be set. ScaleY already used!!', object);
            this._setPropertyWithoutAdaption(object, 'height', false);
            return;
        }

        if (!object.height)
            return;

        if (!this._isValueANumberOrPercentsString(object.height))
            return Urso.logger.error('Height value not valid!');

        if (!this._canBeParent(object)) {
            const pixiObject = object._baseObject;
            pixiObject.height = this._getHeightAsNumber(object);
        }
    }

    /**
     * get x number value
     * @param {Object} object
     * @returns {Number}
     */
    _getXAsNumber(object) {
        return this._getPropertyAsNumber(object, 'x', 'width');
    }

    /**
     * get y number value
     * @param {Object} object
     * @returns {Number}
     */
    _getYAsNumber(object) {
        return this._getPropertyAsNumber(object, 'y', 'height');
    }

    /**
     * get width number value
     * @param {Object} object
     * @returns {Number}
     */
    _getWidthAsNumber(object) {
        return this._getPropertyAsNumber(object, 'width', 'width');
    }

    /**
     * get height number value
     * @param {Object} object
     * @returns {Number}
     */
    _getHeightAsNumber(object) {
        return this._getPropertyAsNumber(object, 'height', 'height');
    }

    /**
     * get x, y, width or height number value
     * @param {Object} object
     * @param {String} propertyName
     * @param {String} parentPropertyName
     * @returns {Number}
     */
    _getPropertyAsNumber(object, propertyName, parentPropertyName) {
        const propType = typeof object[propertyName];

        switch (propType) {
            case 'number':
                return object[propertyName];

            case 'string':
                const parentValue = this._getPropertyAsNumber(object.parent, parentPropertyName, parentPropertyName);
                return this._getRoundedPercentageOfNumber(object[propertyName], parentValue);

            case 'boolean':
                return this._getPropertyAsNumber(object.parent, propertyName, parentPropertyName)

            default:
                Urso.logger.error('Property value not number or string!', object, propertyName);
                return;
        }
    }

    /**
     * get rounded persents of number
     * @param {String} percentsString
     * @param {Number} number
     * @returns {Number}
     */
    _getRoundedPercentageOfNumber(percentsString, number) {
        const percentsFloat = parseFloat(percentsString);
        return ~~(percentsFloat * number / 100);
    }

    /**
     * check can be object a parent (by type)
     * @param {Object} object
     * @returns {Boolean}
     */
    _canBeParent(object) {
        return this._parentTypes.includes(object.type);
    }

    /**
     * check is value a number or a percents string
     * @param {mixed} value
     * @returns {Boolean}
     */
    _isValueANumberOrPercentsString(value) {
        return typeof value === 'number' || (typeof value === 'string' && value.endsWith('%'))
    }

    /**
     * main function to handle stretchingType
     * @param {Object} object
     */
    _adaptStretchingType(object) {
        if (object.width !== '100%' || object.height !== '100%' || !object.stretchingType)
            return;

        switch (object.stretchingType) {
            case 'inscribed':
                this._inscribe(object);
                break;

            case 'circumscribed':
                this._circumscribe(object);
                break;

            case 'false':
                break;

            default:
                Urso.logger.error('StretchingType value not valid!');
                break;
        }
    }

    /**
     * set property and adapt it (only for stretchingType)
     * @param {Object} object
     * @param {String} propertyName
     * @param {Number} value
     */
    _setPropertyAndAdaptIt(object, propertyName, value) {
        object[propertyName] = value;
        this.propertyChangeHandler(object, propertyName);
    }

    /**
     * set streching (only for stretchingType)
     * @param {Object} object
     * @param {Object} params
     */
    _setStreching(object, { scale, objectWidth, objectHeight }) {
        if (object.scaleX === 1)
            this._setPropertyAndAdaptIt(object, 'width', objectWidth * scale);
        else
            this._setPropertyAndAdaptIt(object, 'scaleX', scale);

        if (object.scaleY === 1)
            this._setPropertyAndAdaptIt(object, 'height', objectHeight * scale);
        else
            this._setPropertyAndAdaptIt(object, 'scaleY', scale);
    }

    /**
     * get object values for streching (only for stretchingType)
     * @param {Object} object
     */
    _getObjectValuesForStreching(object) {
        const objectWidth = this._getWidthAsNumber(object);
        const objectHeight = this._getHeightAsNumber(object);
        const parentWidth = this._getWidthAsNumber(object.parent);
        const parentHeight = this._getHeightAsNumber(object.parent);

        const scaleX = parentWidth / objectWidth;
        const scaleY = parentHeight / objectHeight;

        return { objectWidth, objectHeight, scaleX, scaleY };
    }

    /**
     * inscribe handler (only for stretchingType)
     * @param {Object} object
     */
    _inscribe(object) {
        const { objectWidth, objectHeight, scaleX, scaleY } = this._getObjectValuesForStreching(object);
        const scale = Math.min(scaleX, scaleY);
        this._setStreching(object, { scale, objectWidth, objectHeight });
    }

    /**
     * circumscribe handler (only for stretchingType)
     * @param {Object} object
     */
    _circumscribe(object) {
        const { objectWidth, objectHeight, scaleX, scaleY } = this._getObjectValuesForStreching(object);
        const scale = Math.max(scaleX, scaleY);
        this._setStreching(object, { scale, objectWidth, objectHeight });
    }
}

module.exports = PropertyAdapter;