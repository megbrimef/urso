class ModulesScenesController {
    constructor() {
        this.singleton = true;
        this._service;

        this.init();
    }

    init() {
        this._service = this.getInstance('Service');
    }

    display(name) {
        this._service.display(name);
    }

    pause() {
        this._service.pause();
    }

    resume() {
        this._service.resume();
    }

    loadUpdate(loadProgress) {
        this._service.loadUpdate(loadProgress);
    }

    getPixiWorld() {
        return this.getInstance('PixiWrapper').getPixiWorld();
    }

    getTemplateSize() {
        return this.getInstance('Resolutions').getTemplateSize();
    }

    getMouseCoords() {
        return this.getInstance('PixiWrapper').getCachedMouseCoords();
    }

    addObject(objects, parent, doNotRefreshStylesFlag) {
        this._service.addObject(objects, parent, doNotRefreshStylesFlag);
    }

    get timeScale() {
        return this._service.getTimeScale();
    }

    set timeScale(value) {
        return this._service.setTimeScale(value);
    }
}

module.exports = ModulesScenesController;
