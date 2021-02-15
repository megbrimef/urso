class PropertyAdapter {

    constructor() {
        this.singleton = true;

        this._dependencies = {
            'x': this.adaptX.bind(this),
            'y': this.adaptY.bind(this),
            'anchorX': this.adaptAnchorX.bind(this),
            'anchorY': this.adaptAnchorY.bind(this),
            'stretchingType': this.adaptStretchingType.bind(this),
            'scaleX': this.adaptScaleX.bind(this),
            'scaleY': this.adaptScaleY.bind(this),
            'alignX': this.adaptAlignX.bind(this),
            'alignY': this.adaptAlignY.bind(this),
            'width': this.adaptWidth.bind(this),
            'height': this.adaptHeight.bind(this),
            'parent': this.updateChildByParent.bind(this)
        };

        this._parentToChildDependencies = {
            'width': { own: ['anchorX'], children: ['x', 'alignX', 'width'] },
            'height': { own: ['anchorY'], children: ['y', 'alignY', 'height'] },
            'x': { own: ['alignX'], children: [] },
            'y': { own: ['alignY'], children: [] },
            'anchorX': { 'own': ['x'], children: ['x'] },
            'anchorY': { 'own': ['y'], children: ['y'] }
        };

        this._parentTypes = [
            Urso.types.objects.COMPONENT,
            Urso.types.objects.CONTAINER,
            Urso.types.objects.GROUP,
            Urso.types.objects.WORLD
        ];

        this._typesWithoutAnchor = [
            Urso.types.objects.EMITTER,
            Urso.types.objects.GRAPHICS,
            Urso.types.objects.HITAREA,
            Urso.types.objects.MASK,
            Urso.types.objects.SPINE,
            Urso.types.objects.WORLD
        ];
    }

    isAdaptiveProperty(property) {
        return Object.keys(this._dependencies).includes(property);
    };

    _setPropertyAndAdaptIt(object, propertyName, value) {
        object[propertyName] = value;
        this.propertyChanged(object, propertyName);
    }

    _setPropertyWithoutAdaption(object, propertyName, value) {
        object[propertyName] = value;
    }

    propertyChanged(object, propertyName) {
        this.adaptProperty(object, propertyName);

        this._adaptOwnProperties(object, propertyName);
        this._adaptChildProperties(object, propertyName);
    }

    _adaptOwnProperties(object, propertyName) {
        const { own } = this._parentToChildDependencies[propertyName] || {};

        if (!own)
            return;

        for (let dependency of own)
            this.propertyChanged(object, dependency);
    }

    _adaptChildProperties(object, propertyName) {
        const { children } = this._parentToChildDependencies[propertyName] || {};
        const objectHasChildren = this._canBeParent(object) && object.hasOwnProperty('contents');

        if (!children || !objectHasChildren)
            return;

        for (let dependency of children)
            for (let child of object.contents)
                this.propertyChanged(child, dependency);
    }

    adaptProperty(object, propertyName) {
        if (this._dependencies[propertyName])
            this._dependencies[propertyName](object);
    }

    updateChildByParent(child) {
        if (child.parent == null)
            return;

        for (let propertyName of this._propertiesDependentOnParent())
            this.propertyChanged(child, propertyName);
    }

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

    adaptX(object) {
        const pixiObject = object._baseObject;
        pixiObject.x = this._getXAsNumber(object);
    }

    adaptY(object) {
        const pixiObject = object._baseObject;
        pixiObject.y = this._getYAsNumber(object);
    }

    adaptAnchorX(object) {
        const pixiObject = object._baseObject;

        if (typeof object.anchorX !== 'number' || object.anchorX < 0 || object.anchorX > 1)
            return Urso.logger.error('AnchorX value is not valid!');

        if (this._canBeParent(object)) {
            const objectX = this._getXAsNumber(object);
            const objectWidth = this._getWidthAsNumber(object);
            pixiObject.x = objectX - objectWidth * object.anchorX;
        } else if (!this._typesWithoutAnchor.includes(object.type)) {
            pixiObject.anchor.x = object.anchorX;
        }
    }

    adaptAnchorY(object) {
        const pixiObject = object._baseObject;

        if (typeof object.anchorY !== 'number' || object.anchorY < 0 || object.anchorY > 1)
            return Urso.logger.error('AnchorY value is not valid!');

        if (this._canBeParent(object)) {
            const objectY = this._getYAsNumber(object);
            const objectHeight = this._getHeightAsNumber(object);
            pixiObject.y = objectY - objectHeight * object.anchorY;
        } else if (!this._typesWithoutAnchor.includes(object.type)) {
            pixiObject.anchor.y = object.anchorY;
        }
    }

    adaptScaleX(object) {
        const pixiObject = object._baseObject;

        if (object.scaleX !== 1 && typeof object.width !== 'boolean') {
            Urso.logger.error('ScaleX value cannot be set. Width already used!!');
            this._setPropertyWithoutAdaption(object, 'scaleX', 1);
            return;
        }

        if (typeof object.scaleX === 'number' && object.scaleX >= 0) // TODO: CHECK SCALE CAN BE NEGATIVE
            pixiObject.scale.x = object.scaleX;
        else
            Urso.logger.error('ScaleX value is not valid!');
    }

    adaptScaleY(object) {
        const pixiObject = object._baseObject;

        if (object.scaleY !== 1 && typeof object.height !== 'boolean') {
            Urso.logger.error('ScaleY value cannot be set. Height already used!!');
            this._setPropertyWithoutAdaption(object, 'scaleY', 1);
            return;
        }

        if (typeof object.scaleY === 'number' && object.scaleY >= 0) // TODO: CHECK SCALE CAN BE NEGATIVE
            pixiObject.scale.y = object.scaleY;
        else
            Urso.logger.error('ScaleY value is not valid!');
    }

    adaptAlignX(object) {
        const pixiObject = object._baseObject;

        if (typeof object.alignX !== 'string')
            return Urso.logger.error('AlignX value is not string!');

        const objectX = this._getXAsNumber(object);
        const parentWidth = object.parent ? this._getWidthAsNumber(object.parent) : 0;

        switch (object.alignX) {
            case 'left':
                pixiObject.x = objectX;
                break;

            case 'right':
                pixiObject.x = objectX + parentWidth;
                break;

            case 'center':
                pixiObject.x = objectX + parentWidth / 2;
                break;

            default:
                Urso.logger.error('AlignX string is not valid!');
                break;
        }
    }

    adaptAlignY(object) {
        const pixiObject = object._baseObject;

        if (typeof object.alignY !== 'string')
            return Urso.logger.error('AlignY value is not string!');

        const objectY = this._getYAsNumber(object);
        const parentHeight = object.parent ? this._getHeightAsNumber(object.parent) : 0;

        switch (object.alignY) {
            case 'top':
                pixiObject.y = objectY;
                break;

            case 'bottom':
                pixiObject.y = objectY + parentHeight;
                break;

            case 'center':
                pixiObject.y = objectY + parentHeight / 2;
                break;

            default:
                Urso.logger.error('AlignY string is not valid!');
                break;
        }
    }

    adaptWidth(object) {
        const pixiObject = object._baseObject;

        if (typeof object.width !== 'boolean' && object.scaleX !== 1) {
            Urso.logger.error('Width value cannot be set. ScaleX already used!!', object);
            this._setPropertyWithoutAdaption(object, 'width', false);
            return;
        }

        if (!object.width)
            return;

        if (!this._isValueANumberOrPercentsString(object.width))
            return Urso.logger.error('Width value is not valid!!');

        if (!this._canBeParent(object))
            pixiObject.width = this._getWidthAsNumber(object);
    }

    adaptHeight(object) {
        const pixiObject = object._baseObject;

        if (typeof object.height !== 'boolean' && object.scaleY !== 1) {
            Urso.logger.error('Height value cannot be set. ScaleY already used!!', object);
            this._setPropertyWithoutAdaption(object, 'height', false);
            return;
        }

        if (!object.height)
            return;

        if (!this._isValueANumberOrPercentsString(object.height))
            return Urso.logger.error('Height value not valid!');

        if (!this._canBeParent(object))
            pixiObject.height = this._getHeightAsNumber(object);
    }

    adaptStretchingType(object) {
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

    _getXAsNumber(object) {
        return this._getPropertyAsNumber(object, 'x', 'width');
    }

    _getYAsNumber(object) {
        return this._getPropertyAsNumber(object, 'y', 'height');
    }

    _getWidthAsNumber(object) {
        return this._getPropertyAsNumber(object, 'width', 'width');
    }

    _getHeightAsNumber(object) {
        return this._getPropertyAsNumber(object, 'height', 'height');
    }

    //x, y, width or height
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

    _getRoundedPercentageOfNumber(percentsString, number) {
        const percentsFloat = parseFloat(percentsString);
        return ~~(percentsFloat * number / 100);
    }

    _canBeParent(object) {
        return this._parentTypes.includes(object.type);
    }

    _isValueANumberOrPercentsString(value) {
        return typeof value === 'number' || (typeof value === 'string' && value.endsWith('%'))
    }

    _getObjectValues(object) {
        const objectWidth = this._getWidthAsNumber(object);
        const objectHeight = this._getHeightAsNumber(object);
        const parentWidth = this._getWidthAsNumber(object.parent);
        const parentHeight = this._getHeightAsNumber(object.parent);

        const scaleX = parentWidth / objectWidth;
        const scaleY = parentHeight / objectHeight;

        return { objectWidth, objectHeight, scaleX, scaleY };
    }

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

    _inscribe(object) {
        const { objectWidth, objectHeight, scaleX, scaleY } = this._getObjectValues(object);
        const scale = Math.min(scaleX, scaleY);
        this._setStreching(object, { scale, objectWidth, objectHeight });
    }

    _circumscribe(object) {
        const { objectWidth, objectHeight, scaleX, scaleY } = this._getObjectValues(object);
        const scale = Math.max(scaleX, scaleY);
        this._setStreching(object, { scale, objectWidth, objectHeight });
    }
}

module.exports = PropertyAdapter;