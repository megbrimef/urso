class ModulesAssetsController {
    constructor() {
        this.singleton = true;
    };

    /**
     * instantly load initial assets and start lazy loading process, if needed
     * @param {Mixed} assets - asset or array of assets
     * @param {Function} callback 
     */
    preload(assets, callback) {
        this.getInstance('Service').sortAssets(assets);
        this.getInstance('Service').startLoad(callback);
    }

    loadGroup(name, callback) {
        this.getInstance('Service').loadGroup(name, callback);
    }
}

module.exports = ModulesAssetsController;
