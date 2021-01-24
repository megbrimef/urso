class LibLoader {
    constructor() {
        this._isRunning = false;
        this._assetsQuery = [];
    };

    isRunning() {
        return this._isRunning;
    };

    /**
     * 
     * @param {Object} asset - {type: 1, key: "somekey", path: "somepath"}
     */
    addAsset(asset) {
        this._assetsQuery.push(asset);
    }

    /**
     * store loaded asset in cache
     */
    _storeAsset(asset, resource) {
        switch (asset.type) {
            case Urso.types.assets.ATLAS:
                Urso.cache.addAtlas(asset.key, resource);
                break;
            case Urso.types.assets.BITMAPFONT:
                Urso.cache.addBitmapFont(asset.key, resource);
                break;
            case Urso.types.assets.CONTAINER:
                Urso.cache.addContainer(asset.key, resource);
                break;
            case Urso.types.assets.IMAGE:
                Urso.cache.addImage(asset.key, resource);
                break;
            case Urso.types.assets.JSON:
                Urso.cache.addJson(asset.key, resource);
                break;
            case Urso.types.assets.SOUND:
                Urso.cache.addSound(asset.key, resource);
                break;
            case Urso.types.assets.SPINE:
                Urso.cache.addSpine(asset.key, resource);
                break;
            default:
                break;
        }
    }

    /**
     * start loading assets from assets query
     * @param {Function} callback 
     */
    start(callback) {
        if (this._isRunning)
            return false;

        this._isRunning = true;

        const loader = new PIXI.Loader();
        this._assetsQuery.forEach(asset => {
            // TODO: check to load
         
            const params = asset.params || false; // TODO: Set params field in base mode
            loader.add(asset.key, asset.path, params, (resource) => this._storeAsset(asset, resource))
        });

        loader.load(function (loader, resources) {
            callback();

            this._assetsQuery = [];
            this._isRunning = false;
        }.bind(this));
    };

};

module.exports = LibLoader;
