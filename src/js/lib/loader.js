class LibLoader {
    constructor() {
        this._isRunning = false;
        this._assetsQuery = [];
        this._onLoadUpdate = () => { };
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
     * gets part of loading path
     */
    _getLoadPath(asset) {
        const { path } = asset;

        if (path.indexOf('http') === 0) { //if absolute path - just return
            return path;
        }

        if (!Urso.config.useBinPath) {
            return `assets/${path}`;
        }

        const quality = Urso.getInstance('Modules.Assets.Service').getQuality();
        const splitted = path.split('/');

        if (splitted[0] === 'images') {
            splitted.splice(1, 0, quality);
        }

        return `bin/${splitted.join('/')}`;
    };

    /**
     * store loaded asset in cache
     */
    _storeAsset(asset, resource) {
        if (resource.error) {
            return Urso.logger.warn('LibLoader error: ', resource.error, asset);
        }

        switch (asset.type) {
            case Urso.types.assets.ATLAS:
                Urso.cache.addAtlas(asset.key, resource);
                break;
            case Urso.types.assets.BITMAPFONT:
                Urso.cache.addBitmapFont(asset.key, resource);
                break;
            case Urso.types.assets.FONT:
                Urso.cache.addFile(asset.key, resource);
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
     * setup onload callback
     * @param {Function} onLoad
     */
    setOnLoadUpdate(onLoadUpdate) {
        if (onLoadUpdate)
            this._onLoadUpdate = onLoadUpdate;
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

            let params = asset.params || false; // TODO: Set params field in base mode

            if (asset.type === Urso.types.assets.SPINE && asset.noAtlas) {
                if (!params)
                    params = {};

                params.metadata = { spineAtlas: Urso.cache.getGlobalAtlas() };
            }

            const loadPath = this._getLoadPath(asset);
            loader.add(asset.key, loadPath, params, (resource) => this._storeAsset(asset, resource))  //TODO set assets resolution instead _processLoadedImage baseTexture resolution
        });

        this._onLoadUpdate({ progress: 0 });
        loader.onProgress.add(this._onLoadUpdate);

        loader.load(function (loader, resources) {
            this._onLoadUpdate({ progress: 100 });
            this._assetsQuery = [];
            this._isRunning = false;
            callback();
        }.bind(this));
    };

};

module.exports = LibLoader;
