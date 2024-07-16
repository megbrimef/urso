class ModulesObjectsBaseModel {
    constructor(params) {
        this.simpleClass = true;

        this.setupParams(params);

        this.parent = false;
        this.proxyObject = null;
        this.destroyed = false;

        //system
        this._originalModel = params;
        this._classes = [];
        this._styles = {};
        this._baseObject = null; //link to pixi object
        this._uid = Urso.helper.recursiveGet('_uid', params, false); //will setup on create
        this._templatePath = false;
        this._parsed = false;
        this._transitions = { tweens: {} };
    }

    /**
     * setup params to object model
     * @param {Object} params
     */
    setupParams(params) {
        this.type = Urso.helper.recursiveGet('type', params, null);

        this.id = Urso.helper.recursiveGet('id', params, false);
        this.name = Urso.helper.recursiveGet('name', params, false);
        this.class = Urso.helper.recursiveGet('class', params, false);

        this.x = Urso.helper.recursiveGet('x', params, 0); //number or persents (40%)
        this.y = Urso.helper.recursiveGet('y', params, 0); //number or persents (40%)
        this.z = Urso.helper.recursiveGet('z', params, 0); //number
        this.anchorX = Urso.helper.recursiveGet('anchorX', params, 0);
        this.anchorY = Urso.helper.recursiveGet('anchorY', params, 0);
        this.scaleX = Urso.helper.recursiveGet('scaleX', params, 1);
        this.scaleY = Urso.helper.recursiveGet('scaleY', params, 1);
        this.alignX = Urso.helper.recursiveGet('alignX', params, 'left'); //or right or center
        this.alignY = Urso.helper.recursiveGet('alignY', params, 'top'); //or bottom or center
        this.width = Urso.helper.recursiveGet('width', params, false); //or 40% or 1456  // highest priority then scale
        this.height = Urso.helper.recursiveGet('height', params, false); //or 40% or 568  // highest priority then scale
        this.maxWidth = Urso.helper.recursiveGet('maxWidth', params, false); //maximum width value. If objects width will be higher, it will be downscale. Do not use with scale.
        this.maxHeight = Urso.helper.recursiveGet('maxHeight', params, false); //maximum height value. If objects height will be higher, it will be downscale. Do not use with scale.
        this.stretchingType = Urso.helper.recursiveGet('stretchingType', params, false);  //or inscribed or circumscribed //works only if width=height=100%
        this.angle = Urso.helper.recursiveGet('angle', params, 0);
        this.visible = Urso.helper.recursiveGet('visible', params, true);
        this.alpha = Urso.helper.recursiveGet('alpha', params, 1);
        this.blendMode = Urso.helper.recursiveGet('blendMode', params, 1);
        this.ignoreParentMask = Urso.helper.recursiveGet('ignoreParentMask', params, false); //if true - do not apply parent mask on rendering

        this.transitionDelay = Urso.helper.recursiveGet('transitionDelay', params, false); //time in ms
        this.transitionDuration = Urso.helper.recursiveGet('transitionDuration', params, false); //time in ms
        this.transitionProperty = Urso.helper.recursiveGet('transitionProperty', params, false); //props list ex: 'x', 'x y', 'x y alpha'

        this.append = Urso.helper.recursiveGet('append', params, true); //if false - object will not created  //TODO
        this.custom = Urso.helper.recursiveGet('custom', params, {}); //custom params
    }

    getAbsoluteSize() {
        return { width: this._baseObject.width, height: this._baseObject.height };
    }

    destroy(doNotRefreshStylesFlag) {
        Urso.objects.destroy(this, doNotRefreshStylesFlag);
    }

    _customDestroy() { }

    addChild(childObject, doNotRefreshStylesFlag) {
        Urso.objects.addChild(this, childObject, doNotRefreshStylesFlag);
    }

    get transform() {
        return this._baseObject.transform;
    }

    addChildAt(childObject, zIndex, doNotRefreshStylesFlag) {
        //TODO zIndex
        Urso.objects.addChild(this, childObject, doNotRefreshStylesFlag);
    }

    removeChild(childObject, doNotRefreshStylesFlag) {
        Urso.objects.removeChild(this, childObject, doNotRefreshStylesFlag);
    }

    setId(id, doNotRefreshStylesFlag) {
        if (this.id)
            Urso.objects.removeIdFromCache(this.id, this);

        Urso.objects._safeSetValueToTarget(this, 'id', id);

        if (id)
            Urso.objects.addIdToCache(id, this);

        if (!doNotRefreshStylesFlag)
            Urso.objects.refreshStyles();

        return this;
    }

    setName(name, doNotRefreshStylesFlag) {
        if (this.name)
            Urso.objects.removeNameFromCache(this.name, this);

        Urso.objects._safeSetValueToTarget(this, 'name', name);

        if (name)
            Urso.objects.addNameToCache(name, this);

        if (!doNotRefreshStylesFlag)
            Urso.objects.refreshStyles();

        return this;
    }

    addClass(className, doNotRefreshStylesFlag) {
        let currentClass = this.class;
        let newClassName;

        if (!currentClass)
            newClassName = className;
        else {
            if (currentClass.split(' ').includes(className))
                return this;

            newClassName = this.class + ' ' + className;
        }

        Urso.objects._safeSetValueToTarget(this, 'class', newClassName);

        Urso.objects.addClassToCache(className, this);

        if (!doNotRefreshStylesFlag)
            Urso.objects.refreshByChangedClassName(className);

        return this;
    };

    removeClass(className, doNotRefreshStylesFlag) {
        if (!this.class)
            return this;

        let classArray = this.class.split(' ');
        let classIndex = classArray.indexOf(className);

        if (classIndex === -1)
            return this;

        classArray.splice(classIndex, 1);
        Urso.objects._safeSetValueToTarget(this, 'class', classArray.join(' '));
        Urso.objects.removeClassFromCache(className, this);

        if (!doNotRefreshStylesFlag)
            Urso.objects.refreshByChangedClassName(className);

        return this;
    };

    toGlobal() {
        const world = Urso.objects.getWorld();
        const worldScale = world._baseObject.scale;
        const worldPoint = { x: world.x, y: world.y };
        const globalPoint = this._baseObject.toGlobal(worldPoint);

        const x = Math.floor(globalPoint.x / worldScale.x);
        const y = Math.floor(globalPoint.y / worldScale.y);

        return { x, y };
    }

    toLocal(from) {
        const world = Urso.objects.getWorld();
        const worldPoint = { x: world.x, y: world.y };
        const parent = this.parent ? this.parent._baseObject : world._baseObject;
        const fromObj = from ? from._baseObject : parent;
        const localPoint = this._baseObject.toLocal(worldPoint, fromObj);

        const x = -~~localPoint.x;
        const y = -~~localPoint.y;

        return { x, y };
    }

    /**
     * generate texture from current object
     * @param {String} [key]
     * @returns {Object} - pixi.Texture
     */
    generateTexture(key = '') {
        const newTexture = Urso.scenes.generateTexture(this._baseObject);

        if (key)
            Urso.cache.addTexture(key, newTexture);

        return newTexture;
    }

    // sorts children by zIndex
    sortChildren() {
        if (this._baseObject.children?.length > 0)
            this._baseObject.sortChildren();
    }
}

module.exports = ModulesObjectsBaseModel;
