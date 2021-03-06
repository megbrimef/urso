class ModulesInstancesController {
    constructor() {
        this._modes = [];
        this._cache = {};

        this.getInstance = this.getInstance.bind(this);
        this.getPath = this.getPath.bind(this);
        this._setComonFunctions = this._setComonFunctions.bind(this);
    }

    getPath(path, noModes, modeName) {
        let callback = (a) => {
            return a;
        };

        return this._findClass({ path: path, callback: callback, noModes: noModes, modeName: modeName });
    }

    getModes() {
        return this._modes;
    }

    addMode(mode) {
        if (this._modes.indexOf(mode) !== -1)
            return false;

        this._modes.push(mode);
        return true;
    }

    removeMode(mode) {
        let index = modes.indexOf(mode);

        if (index === -1)
            return false;

        modes.splice(index, 1);
        return true;
    }

    getInstance(path, params, noModes, modeName) {
        let callback = (classObject) => {
            if (typeof classObject !== "function") { //typeof class is a function
                Urso.logger.error('getInstance type error');
            }

            if (classObject._instance && classObject._instance.singleton)
                return classObject._instance;

            this._setComonFunctions(classObject, path);

            let instance = new classObject(params);

            if (instance.singleton)
                classObject._instance = instance;

            this._launchDefaultFunctions(instance);

            return instance;
        };

        return this._findClass({ path: path, callback: callback, noModes: noModes, modeName: modeName });
    }

    _setComonFunctions(classObject, path) {
        classObject.prototype.getInstance = this._entityGetInstance(path);
        classObject.prototype.addListener = this._entityAddListener;
        classObject.prototype.removeListener = this._entityRemoveListener;
        classObject.prototype.emit = this._entityEmit;
    }

    _setComonEntityFunctions(classObject, callerObject) {
        if (callerObject.common && !classObject.common) { //components common
            classObject.common = callerObject.common;

            //getInstance calls in constructor
            if (classObject.__entities)
                classObject.__entities.forEach(entity => this._setComonEntityFunctions(entity, classObject));
        }
    }

    _launchDefaultFunctions(instance) {
        //_subscribe
        if (instance && instance._subscribe)
            instance._subscribe();

        //_subscribeOnce
        if (instance && instance._subscribeOnce && !instance.__subscribedOnce) {
            instance.__subscribedOnce = true;
            instance._subscribeOnce();
        }
    }

    _entityGetInstance(path) {
        const entityPath = Urso.helper.initial(path.split('.')).join('.');
        const self = this;

        return function (layer, params, noModes, modeName) {
            let instance = self.getInstance(
                entityPath + '.' + layer,
                params, noModes, modeName
            );

            self._addEntityToClass(instance, this);

            if (instance)
                self._setComonEntityFunctions(instance, this);

            return instance;
        };
    }

    _addEntityToClass(classObject, callerObject) {
        if (!callerObject.__entities)
            callerObject.__entities = [];

        callerObject.__entities.push(classObject);
    }

    _entityAddListener() {
        Urso.observer.add.apply(Urso.observer, arguments);
    }

    _entityRemoveListener() {
        Urso.observer.remove.apply(Urso.observer, arguments);
    }

    _entityEmit() {
        Urso.observer.fire.apply(Urso.observer, arguments);
    }

    _findClass(params) {
        //put all params exept callback in key
        let cacheKey = [
            params.path,
            params.modeName || 'none',
            params.noModes || 'false'
        ].join('_');

        //check cache
        if (cacheKey in this._cache)
            return this._cache[cacheKey] ? params.callback(this._cache[cacheKey]) : false;

        let pathArr = params.path.split('.');
        let arrayOfPatches = [];

        //TODO modes
        let classObject = Urso.helper.recursiveGet(params.path, Urso.Game);

        if (!classObject)
            return false;

        let finalPath = params.path;

        //setup __path to classObject
        if (typeof classObject === 'function') //class
            classObject.prototype.__path = finalPath;
        else if (typeof classObject === 'object')
            classObject.__path = finalPath;

        //add to cache
        this._cache[cacheKey] = classObject;

        return params.callback(this._cache[cacheKey]);
    }
}

module.exports = ModulesInstancesController;
