class ModulesObjectsStyles {
    constructor() {
        this.singleton = true;

        this._cache = {};
        this._tempObject = this.getInstance('BaseModel', {})
        this._tempTextObject = this.getInstance('Models.Text', {})
        this._selector = this.getInstance('Selector');
    }

    /**
     * refresh styles
     * @param {mixed} parent
     */
    refresh(parent) {
        if (!parent)
            parent = this.getInstance('Controller').getWorld();

        let template = Urso.template.get();
        let styles = template.styles;

        this._removeInactualStylesAndAddNew(parent, styles);
    }

    /**
     * @deprecated
     * remove all styles and re-add
     * @param {Object} parent
     * @param {Object} styles
     */
    _removeAllStylesAndReAdd(parent, styles) {
        this._globalResetStyles();

        //todo consider parent

        for (let [selector, style] of Object.entries(styles))
            this._apply(selector, style);
    }

    /**
     * remove inactual styles and add new if need
     * @param {Object} parent
     * @param {Object} styles
     */
    _removeInactualStylesAndAddNew(parent, styles) {
        this._resetInactualStyles();

        for (let [selector, style] of Object.entries(styles))
            this._apply(selector, style);
    }

    /**
     * refresh styles by changed className (when addClass or removeClass)
     * @param {String} className
     */
    refreshByChangedClassName(className) {
        let template = Urso.template.get();
        let styles = template.styles;

        this._restoreDefaultsByCache(className);

        for (let [selector, style] of Object.entries(styles))
            if (selector.indexOf('.' + className) !== -1)
                this._apply(selector, style);
    }

    /**
     * remove object from styles cache
     * @param {Object} object
     */
    removeFromCache(object) {
        for (let selector in this._cache) {
            if (this._cache[selector][object._uid]) {
                delete this._cache[selector][object._uid];

                if (!Object.keys(this._cache[selector]).length)
                    delete this._cache[selector];
            }
        }
    }

    /**
     * apply style to selector
     * @param {String} selector
     * @param {Object} style
     */
    _apply(selector, style) {
        let objectsArray = this.getInstance('Controller').findAll(selector);

        for (let object of objectsArray) {
            if (object._styles[selector])
                continue;

            this._addObjectToCache(selector, object);
            object._styles[selector] = style;

            for (let [key, value] of Object.entries(style))
                if (typeof object._originalModel[key] === 'undefined')
                    Urso.objects._safeSetValueToTarget(object, key, value);
        }
    }

    /**
     * add object to inner cache by selector
     * @param {String} selector
     * @param {Object} object
     */
    _addObjectToCache(selector, object) {
        if (!this._cache[selector])
            this._cache[selector] = {};

        this._cache[selector][object._uid] = object;
    }

    /**
     * global reset(remove) all styles
     * @deprecated
     */
    _globalResetStyles() {
        for (let [selector, selectorCache] of Object.entries(this._cache)) {
            for (let [uid, object] of Object.entries(selectorCache))
                this._removeSelectorStyles(object, selector, true);

            delete this._cache[selector];
        }
    }

    /**
     * reset(remove) inactual styles
     */
    _resetInactualStyles() {
        for (let [selector, selectorCache] of Object.entries(this._cache)) {
            for (let [uid, object] of Object.entries(selectorCache))
                if (!this._selector.testObject(object, selector))
                    this._removeSelectorStyles(object, selector);

            delete this._cache[selector];
        }
    }

    /**
     * restore default values after reset styles (when addClass or removeClass)
     * @param {String} className
     */
    _restoreDefaultsByCache(className) {
        for (let [selector, selectorCache] of Object.entries(this._cache))
            if (selector.indexOf('.' + className) !== -1) {
                for (let [uid, object] of Object.entries(selectorCache))
                    this._removeSelectorStyles(object, selector);

                delete this._cache[selector];
            }
    }

    /**
     * remove all selector styles
     * @param {Object} object
     * @param {String} selector
     * @param {Boolean} globalResetFlag
     */
    _removeSelectorStyles(object, selector, globalResetFlag) {
        delete object._styles[selector];
        let template = Urso.template.get();
        let styles = template.styles[selector];

        if (!styles) {
            return;
        }

        for (let [key, value] of Object.entries(styles)) {
            this._restoreValueByKey(key, object, globalResetFlag);
        }

    }

    /**
     * restore value by key from original model
     * @param {String} key
     * @param {Object} object
     * @param {Boolean} globalResetFlag
     */
    _restoreValueByKey(key, object, globalResetFlag) {
        //check own
        if (object._originalModel[key])
            return;

        const tempObject = (object.type === Urso.types.objects.TEXT) ? this._tempTextObject : this._tempObject;

        //restore defaults
        Urso.objects._safeSetValueToTarget(object, key, tempObject[key]);

        //check other styles
        if (!globalResetFlag) {
            for (let [selector, style] of Object.entries(object._styles))
                if (typeof style[key] !== 'undefined')
                    Urso.objects._safeSetValueToTarget(object, key, style[key]);
        }
    }
}

module.exports = ModulesObjectsStyles;
