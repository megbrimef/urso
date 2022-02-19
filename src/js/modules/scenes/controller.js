class ModulesScenesController {
    constructor() {
        this.singleton = true;
        this._service;

        this.init();
    }

    /**
     * init scenes mahager
     */
    init() {
        this._service = this.getInstance('Service');
    }

    /**
     * display scene with name
     * @param {String} name 
     */
    display(name) {
        this._service.display(name);
    }

    /**
     * pause scene
     */
    pause() {
        this._service.pause();
    }

    /**
     * resume scene
     */
    resume() {
        this._service.resume();
    }

    /**
     * system function for transfer loadUpdate progress to components
     * @param {Number} loadProgress 
     */
    loadUpdate(loadProgress) {
        this._service.loadUpdate(loadProgress);
    }

    /**
     * system function, returns pixi world container
     */
    getPixiWorld() {
        return this.getInstance('PixiWrapper').getPixiWorld();
    }

    /**
     * get template size
     * @returns {Object}
     */
    getTemplateSize() {
        return this.getInstance('Resolutions').getTemplateSize();
    }

    /**
     * return mouse coords related to scene
     * @returns {Object}
     */
    getMouseCoords() {
        return this.getInstance('PixiWrapper').getCachedMouseCoords();
    }

    /**
     * system function to add custom objects to scene like groups or components
     * @param {Object|Array} objects 
     * @param {Object} parent 
     * @param {Boolean} doNotRefreshStylesFlag 
     */
    addObject(objects, parent, doNotRefreshStylesFlag) {
        this._service.addObject(objects, parent, doNotRefreshStylesFlag);
    }

    /**
     * global timeScale getter
     */
    get timeScale() {
        return this._service.getTimeScale();
    }

    /**
     * global timeScale setter
     */
    set timeScale(value) {
        return this._service.setTimeScale(value);
    }
}

module.exports = ModulesScenesController;
