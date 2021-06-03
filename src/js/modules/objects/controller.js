class ModulesObjectsController {
    constructor() {
        this.singleton = true;

        Urso.find = this.find.bind(this);
        Urso.findOne = this.findOne.bind(this);
        Urso.findAll = this.findAll.bind(this);

        this._newResolutionHandler = this._newResolutionHandler.bind(this);
        this._resetWorld = this._resetWorld.bind(this);
    };

    create(objects, parent, doNotRefreshStylesFlag) { //TODO parse template for assets and objects (groups, components)
        let result;

        if (Array.isArray(objects)) {
            result = [];
            for (const object of objects) {
                result.push(this.getInstance('Create').add(object, parent));
            }
        } else
            result = this.getInstance('Create').add(objects, parent);

        if (!doNotRefreshStylesFlag)
            this.refreshStyles(parent);

        return result;
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
        return this.getInstance('Create').getWorld();
    }

    addChild(parent, child, doNotRefreshStylesFlag) {
        this.getInstance('Create').addChild(parent, child, doNotRefreshStylesFlag);
    }

    removeChild(parent, child, doNotRefreshStylesFlag) {
        this.getInstance('Create').removeChild(parent, child, doNotRefreshStylesFlag);
    }

    destroy(object, doNotRefreshStylesFlag) {
        this.getInstance('Create').destroy(object, doNotRefreshStylesFlag);
    }

    //do not use outside engine
    _safeSetValueToTarget(target, key, value) {
        this.getInstance('Proxy').safeSetValueToTarget(target, key, value);
    }

    _updateCommonProperties(object) {
        this.getInstance('Create')._updateCommonProperties(object);
    }

    _newResolutionHandler(params) {
        this.getInstance('Create').updateWorldBounds(params);
    }

    _resetWorld() {
        this.getInstance('Create').resetWorld();
    }

    _subscribeOnce() {
        this.addListener(Urso.events.MODULES_SCENES_NEW_RESOLUTION, this._newResolutionHandler, true);
        this.addListener(Urso.events.MODULES_SCENES_NEW_SCENE_INIT, this._resetWorld, true);
    }
}

module.exports = ModulesObjectsController;
