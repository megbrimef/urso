const MODES_NAMESPACE = 'modifications';
const MIXINS_NAMESPACE = 'mixins';

class ModulesInstancesController {
    constructor() {
        this._modes = [];
        this._cache = {};
        this._counter = 0;

        this.getInstance = this.getInstance.bind(this);
        this.getByPath = this.getByPath.bind(this);
        this._setComonFunctions = this._setComonFunctions.bind(this);

        this.getModes = this.getModes.bind(this);
        this.addMode = this.addMode.bind(this);
        this.removeMode = this.removeMode.bind(this);
    }

    getByPath(path, noModes, modeName) {
        let callback = (a) => {
            return a;
        };

        return this._findClass({ path, callback, noModes, modeName });
    }

    getModes() {
        return this._modes;
    }

    addMode(mode) {
        if (this._modes.indexOf(mode) !== -1)
            return false;

        this._modes.push(mode);
        Urso.observer.emit(Urso.events.MODULES_INSTANCES_MODES_CHANGED);
        return true;
    }

    /**
     * remove mode from system
     * @param {String} mode
     * @param {Boolean} passiveMode - do not refresh styles
     * @returns
     */
    removeMode(mode, passiveMode) {
        let index = this._modes.indexOf(mode);

        if (index === -1)
            return false;

        this._modes.splice(index, 1);

        if (!passiveMode) {
            Urso.observer.emit(Urso.events.MODULES_INSTANCES_MODES_CHANGED);
        }

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

            instance._iuid = this._getUid();

            this._launchDefaultFunctions(instance);

            return instance;
        };

        return this._findClass({ path, callback, noModes, modeName });
    }

    _getUid() {
        this._counter++;
        return 'instance' + this._counter;
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

            //no simpleClasses like ModulesAssetsBaseModel && ModulesObjectsBaseModel
            if (instance && !instance.simpleClass) {
                self._addEntityToClass(instance, this);
                self._setComonEntityFunctions(instance, this);
            }

            return instance;
        };
    }

    _addEntityToClass(classObject, callerObject) {
        if (!callerObject.__entities)
            callerObject.__entities = [];

        if (!callerObject.__entities.includes(classObject))
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

        //no class in cache - we will find class by path
        let classObject = this._getClassByPath(params.path, params.noModes);

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

    _getClassByPath(path, noModes) {
        let pathArr = path.split('.');
        let entitiesArray = Urso.helper.mergeArrays(['Urso', 'Game'], pathArr);
        return this._checkPathExist(entitiesArray, noModes);
    }

    /**
     * check if object exist
     * @param {Object} entitiesArray like ['Urso', 'Game', 'Lib', 'Helper']
     * @returns {mixed}
     */
    _checkPathExist(entitiesArray, noModes) {
        let currentTestObject = window;
        let testMode;
        let mixins = [];

        for (let entitiesIndex = 0; entitiesIndex < entitiesArray.length; entitiesIndex++) {
            const lastElementModesCondition = !noModes && this._modes && entitiesIndex === entitiesArray.length - 1;

            //get path modification
            if (lastElementModesCondition && currentTestObject[MODES_NAMESPACE])
                testMode = this._checkPathWithModes(currentTestObject[MODES_NAMESPACE], entitiesArray, entitiesIndex);

            //get path mixins
            if (lastElementModesCondition && currentTestObject[MIXINS_NAMESPACE])
                mixins = this._getMixins(currentTestObject[MIXINS_NAMESPACE], entitiesArray, entitiesIndex);

            if (testMode)
                currentTestObject = testMode;
            else if (currentTestObject[entitiesArray[entitiesIndex]])
                currentTestObject = currentTestObject[entitiesArray[entitiesIndex]];
            else
                return false;
        }

        //mixins
        mixins.forEach((mixin) => {
            //use this mixin constructions:
            //const ComponentsMixinEntitie = (superclass) => class extends superclass { ... }
            currentTestObject = mixin(currentTestObject);
        })

        return currentTestObject;
    }

    _checkPathWithModes(currentTestObject, entitiesArray, entitiesIndex) {
        for (let mode of this._modes) {
            const capMode = Urso.helper.capitaliseFirstLetter(mode);

            if (currentTestObject[capMode]) {
                const checkResult = this._checkPathWithModes(currentTestObject[capMode], entitiesArray, entitiesIndex);

                if (checkResult)
                    return checkResult;
            }
        }

        if (currentTestObject[entitiesArray[entitiesIndex]])
            return currentTestObject[entitiesArray[entitiesIndex]];

        return false;
    }

    _getMixins(currentTestObject, entitiesArray, entitiesIndex) {
        const mixins = [];

        for (let mode of this._modes) {
            const capMode = Urso.helper.capitaliseFirstLetter(mode);

            if (currentTestObject[capMode] && currentTestObject[capMode][entitiesArray[entitiesIndex]]) {
                mixins.push(currentTestObject[capMode][entitiesArray[entitiesIndex]]);
            }
        }

        return mixins;
    }
}

module.exports = ModulesInstancesController;
