class ModulesObjectsController {
    constructor() {
        this.singleton = true;

        Urso.find = this.find.bind(this);
        Urso.findOne = this.findOne.bind(this);
        Urso.findAll = this.findAll.bind(this);

        this._newResolutionHandler = this._newResolutionHandler.bind(this);
        this._resetWorld = this._resetWorld.bind(this);
        this._applyClassesToWorld = this._applyClassesToWorld.bind(this);
    };

    /**
     * 
     * @param {Array|ModulesObjectsBaseModel} objects - array of objects or single object model
     * @param {Object} parent - parent object
     * @param {boolean} doNotRefreshStylesFlag - create without refresh styles
     * @param {boolean} _system - system create, do not use this in your code
     * @returns 
     */
    create(objects, parent, doNotRefreshStylesFlag, _system = false) {
        let result;

        if (Array.isArray(objects)) {
            result = [];

            for (const object of objects) {
                result.push(this._createSingleObject(object, parent, doNotRefreshStylesFlag, _system));
            }
        } else
            result = this._createSingleObject(objects, parent, doNotRefreshStylesFlag, _system);

        if (!doNotRefreshStylesFlag)
            this.refreshStyles(parent);

        return result;
    }

    _createSingleObject(object, parent, doNotRefreshStylesFlag, _system) {
        //parse template for assets and objects (groups, components)  Urso.types.objects.COMPONENT  Urso.types.objects.GROUP
        if (!object._parsed && !_system) { //todo only for objects, contains components && groups in future
            return Urso.scenes.addObject(object, parent, doNotRefreshStylesFlag);
        }

        return this.getInstance('Service').add(object, parent);
    }

    find(selector) {
        return this.getInstance('Find').do(selector);
    }

    findOne(selector) {
        let result = this.getInstance('Find').do(selector, true);
        return result ? result[0] : false;
    }

    findAll(selector) {
        let result = this.getInstance('Find').do(selector);
        return result ? result : []; //todo make collections
    }

    addIdToCache(id, object) {
        this.getInstance('Cache').addId(id, object);
    }

    removeIdFromCache(id, object) {
        this.getInstance('Cache').removeId(id, object);
    }

    addNameToCache(name, object) {
        this.getInstance('Cache').addName(name, object);
    }

    removeNameFromCache(name, object) {
        this.getInstance('Cache').removeName(name, object);
    }

    addClassToCache(className, object) {
        this.getInstance('Cache').addClass(className, object);
    }

    removeClassFromCache(className, object) {
        this.getInstance('Cache').removeClass(className, object);
    }

    refreshStyles(parent) {
        return this.getInstance('Styles').refresh(parent);
    }

    refreshByChangedClassName(className) {
        return this.getInstance('Styles').refreshByChangedClassName(className);
    }

    getWorld() {
        return this.getInstance('Service').getWorld();
    }

    addChild(parent, child, doNotRefreshStylesFlag) {
        this.getInstance('Service').addChild(parent, child, doNotRefreshStylesFlag);
    }

    removeChild(parent, child, doNotRefreshStylesFlag) {
        this.getInstance('Service').removeChild(parent, child, doNotRefreshStylesFlag);
    }

    destroy(object, doNotRefreshStylesFlag) {
        this.getInstance('Service').destroy(object, doNotRefreshStylesFlag);
    }

    //do not use outside engine
    _safeSetValueToTarget(target, key, value) {
        this.getInstance('Proxy').safeSetValueToTarget(target, key, value);
    }

    _updateCommonProperties(object) {
        this.getInstance('Service')._updateCommonProperties(object);
    }

    _newResolutionHandler(params) {
        this.getInstance('Service').updateWorldBounds(params);
    }

    _resetWorld() {
        this.getInstance('Service').resetWorld();
    }

    _applyClassesToWorld() {
        this.getInstance('Service').applyClassesToWorld();
    }

    _subscribeOnce() {
        this.addListener(Urso.events.MODULES_SCENES_NEW_RESOLUTION, this._newResolutionHandler, true);
        this.addListener(Urso.events.MODULES_SCENES_NEW_SCENE_INIT, this._resetWorld, true);
        this.addListener(Urso.events.MODULES_INSTANCES_MODES_CHANGED, this._applyClassesToWorld, true);
    }
}

module.exports = ModulesObjectsController;
