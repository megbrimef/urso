class ModulesScenesController {
    constructor() {
        this.singleton = true;
        this._service;

        this.init();
    }

    /**
     * init scenes mahager
     */
    async init() {
        this._service = this.getInstance('Service');
        await this._service.init();
    }

    /**
     * display scene with name
     * @param {String} name 
     */
    display(name) {
        this._service.display(name);
    }

    /**
     * get fps
     * @returns {Number}
     */
    getFps() {
        return this.getInstance('PixiWrapper').getFps();
    }

    /**
     * get fps data
     * @returns {Object}
     */
    getFpsData() {
        return this.getInstance('PixiWrapper').getFpsData();
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
        return this._service.addObject(objects, parent, doNotRefreshStylesFlag);
    }

    /**
     * generateTexture from object
     * @param {Object} obj
     * @returns {Object} - pixi.Texture
     */
    generateTexture(obj) {
        return this.getInstance('PixiWrapper').generateTexture(obj);
    }

    /**
     * get current renderer
     * @returns {Object} - PIXI.Renderer
     */
    getRenderer() {
        return this.getInstance('PixiWrapper').getRenderer();
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
