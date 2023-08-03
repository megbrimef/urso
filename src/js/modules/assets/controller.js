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
    preload(assets, callback) {
        const assetsSpace = this.getInstance('Service').sortAssets(assets);
        this.getInstance('Service').startLoad(assetsSpace, callback);
    }

    /**
     * load assets group bu name
     * @param {String} name
     * @param {Function} callback
     */
    loadGroup(name, callback) {
        this.getInstance('Service').loadGroup(null, name, callback);
    }

    /**
     * system; check webP support
     */
    checkWebPSupport() {
        this.getInstance('Service').checkWebPSupport();
    }
}

module.exports = ModulesAssetsController;
