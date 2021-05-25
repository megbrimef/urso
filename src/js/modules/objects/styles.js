class ModulesObjectsStyles {
    constructor() {
        this.singleton = true;

        this._cache = {};
        this._tempObject = this.getInstance('BaseModel', {})
    }

    refresh(parent) {
        if (!parent)
            parent = this.getInstance('Controller').getWorld();

        let template = Urso.template.get();
        let styles = template.styles;

        this._globalResetStyles();

        //todo consider parent

        for (let [selector, style] of Object.entries(styles))
            this._apply(selector, style);
    }

    refreshByChangedClassName(className) {
        let template = Urso.template.get();
        let styles = template.styles;

        this._restoreDefaultsByCache(className);

        for (let [selector, style] of Object.entries(styles))
            if (selector.indexOf('.' + className) !== -1)
                this._apply(selector, style);
    }

    removeFromCache(object) {
        for (let selector in this._cache) {
            if (this._cache[selector][object._uid]) {
                delete this._cache[selector][object._uid];

                if (!Object.keys(this._cache[selector]).length)
                    delete this._cache[selector];
            }
        }

    }

    _apply(selector, style) {
        let objectsArray = this.getInstance('Controller').findAll(selector);

        for (let object of objectsArray) {
            this._addObjectToCache(selector, object);
            object._styles[selector] = style;

            for (let [key, value] of Object.entries(style))
                if (typeof object._originalModel[key] === 'undefined')
                    Urso.objects._safeSetValueToTarget(object, key, value);
        }
    }

    _addObjectToCache(selector, object) {
        if (!this._cache[selector])
            this._cache[selector] = {};

        this._cache[selector][object._uid] = object;
    }

    _globalResetStyles() {
        for (let [selector, selectorCache] of Object.entries(this._cache)) {
            for (let [uid, object] of Object.entries(selectorCache))
                this._removeSelectorStyles(object, selector);

            delete this._cache[selector];
        }
    }

    _restoreDefaultsByCache(className) {
        for (let [selector, selectorCache] of Object.entries(this._cache))
            if (selector.indexOf('.' + className) !== -1) {
                for (let [uid, object] of Object.entries(selectorCache))
                    this._removeSelectorStyles(object, selector);

                delete this._cache[selector];
            }
    }

    _removeSelectorStyles(object, selector) {
        delete object._styles[selector];
        let template = Urso.template.get();
        let styles = template.styles[selector];

        if(!styles){
            return;
        }

        for (let [key, value] of Object.entries(styles)) {
            this._restoreValueByKey(key, object);
        }

    }

    _restoreValueByKey(key, object) {
        //check own
        if (object._originalModel[key])
            return;

        //restore defaults
        Urso.objects._safeSetValueToTarget(object, key, this._tempObject[key]);

        //check other styles
        for (let [selector, style] of Object.entries(object._styles))
            if (typeof style[key] !== 'undefined')
                Urso.objects._safeSetValueToTarget(object, key, style[key]);
    }
}

module.exports = ModulesObjectsStyles;
