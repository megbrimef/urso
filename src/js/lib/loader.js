class LibLoader {
    constructor() {
        this.RELOAD_DELAY = 250;
        this._isRunning = false;
        this._iterationNumber = 0;
        this._assetsQuery = [];
        this._onLoadUpdate = () => { };
        this._loader = null;
        this._completeCallback = () => { };

        this._onError = this._onError.bind(this);
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
            return `${Urso.config.gamePath}assets/${path}`;
        }

        const quality = Urso.getInstance('Modules.Assets.Service').getQuality();
        const splitted = path.split('/');

        if (splitted[0] === 'images') {
            splitted.splice(1, 0, quality);
        }

        return `${Urso.config.gamePath}/bin/${splitted.join('/')}`;
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
            case Urso.types.assets.CONTAINER:
                Urso.cache.addContainer(asset.key, resource);
                break;
            case Urso.types.assets.FONT:
            case Urso.types.assets.HTML:
                Urso.cache.addFile(asset.key, resource);
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
        this._lastLoadFailed = false;
        this._iterationNumber++;
        const currentIteration = this._iterationNumber;
        this._completeCallback = callback;
        this._loader = new PIXI.Loader();
        const appVersion = Urso.config.appVersion;

        if (appVersion) {
            this._loader.defaultQueryString = `appVersion=${appVersion}`;
        }

        this._assetsQuery.forEach(asset => {
            // TODO: check to load

            let params = asset.params || false; // TODO: Set params field in base mode

            if (asset.type === Urso.types.assets.SPINE && asset.noAtlas) {
                if (!params)
                    params = {};

                params.metadata = { spineAtlas: Urso.cache.getGlobalAtlas() };
            }

            const loadPath = this._getLoadPath(asset);
            this._loader.add(asset.key, loadPath, params, (resource) => this._storeAsset(asset, resource))  //TODO set assets resolution instead _processLoadedImage baseTexture resolution
        });

        this._onLoadUpdate({ progress: 0 });
        this._loader.onProgress.add(this._onLoadUpdate);
        this._loader.onError.add(this._onError);

        this._loader.load(function (loader, resources) {
            if (currentIteration !== this._iterationNumber || this._lastLoadFailed)
                return;

            this._onLoadUpdate({ progress: 100 });
            this._assetsQuery = [];
            this._isRunning = false;
            callback();
        }.bind(this));
    };


    _onError(error) {
        Urso.logger.warn('LibLoader file load error: ', error);
        this._loader.reset();
        this._isRunning = false;
        this._lastLoadFailed = true;

        this._resizeTimeoutId = Urso.setTimeout(() => this.start(this._completeCallback), this.RELOAD_DELAY);
    }

};

module.exports = LibLoader;
