class ModulesAssetsController {
    constructor() {
        this.singleton = true;
    };

    /**
     * Update quality
     */
    updateQuality() {
        if (Urso.config.useBinPath) {
            this.getInstance('Service').updateQuality();
        }

        console.log('[ASSETS] Quality set to', this.getInstance('Service').getQuality());
    }

    /**
     * Current quality getter
     */
    getQuality() {
        return this.getInstance('Service').getQuality();
    }

    /**
     * Current asset resolution
     */
    getCurrentResolution() {
        return this.getInstance('Service').getCurrentResolution();
    }

    /**
     * instantly load initial assets and start lazy loading process, if needed
     * @param {Mixed} assets - asset or array of assets
     * @param {Function} callback
     */
    preload(assets, callback, updateCallback = () => { }) {
        const assetsSpace = this.getInstance('Service').sortAssets(assets);
        this.getInstance('Service').startLoad(assetsSpace, callback, updateCallback);
    }

    /**
     * load assets group by name
     * @param {String} name
     * @param {Function} callback
     * @param {Function} updateCallback
     * @returns {Promise} resolves when group finishes loading
     */
    loadGroup(name, callback, updateCallback = () => { }) {
        // FIXED: Return the service promise so callers can await the load — maintains callback API while adding Promise support
        return this.getInstance('Service').loadGroup(null, name, callback, updateCallback);
    }

    /**
     * check if a group has already been loaded
     * @param {String} name - group name
     * @returns {Boolean}
     */
    isGroupLoaded(name) {
        // ADDED: Query if group is cached — allows UI to check asset availability without triggering loads
        return this.getInstance('Service').isGroupLoaded(name);
    }

    /**
     * check if a group is currently loading
     * @param {String} name - group name
     * @returns {Boolean}
     */
    isGroupLoading(name) {
        // ADDED: Query if group load is in progress — allows UI to show loading states for on-demand assets
        return this.getInstance('Service').isGroupLoading(name);
    }

    /**
     * get placeholder key for a lazy-loaded asset
     * @param {String} assetKey - the asset key to look up
     * @returns {String|Boolean} placeholder asset key or false if none configured
     */
    getPlaceholderKey(assetKey) {
        // ADDED: Return placeholder key for lazy assets or false if none — enables objects to show stand-in while loading real texture
        return this.getInstance('Service').getPlaceholderKey(assetKey);
    }

    /**
     * unload a lazy-loaded asset group and release GPU resources
     * @param {String} name - group name
     * @returns {Promise<Boolean>} false if group was never loaded, true if successfully unloaded
     */
    unloadGroup(name) {
        // ADDED: Delegate to service unload with async support — exposes group unloading to public API
        return this.getInstance('Service').unloadGroup(name);
    }

    /**
     * system; check webP support
     */
    checkWebPSupport() {
        this.getInstance('Service').checkWebPSupport();
    }

    /**
     * preload all images in global atlas into GPU
     */
    preloadAllImagesInGPU() {
        this.getInstance('Service').preloadAllImagesInGPU();
    }
}

export default ModulesAssetsController;
