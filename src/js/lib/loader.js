// FIXED: track whether appVersion anticache search param has been applied to the resolver once.
// LibLoader is not a singleton—a fresh instance is created per asset group—so module-level state
// prevents re-setting the same param value. This is clearer than tracking on the resolver itself.
let _searchParamsApplied = false;

class LibLoader {
    constructor() {
        this.RELOAD_DELAY = 250;
        // FIXED: _onError previously retried forever every RELOAD_DELAY ms. A permanently missing asset
        // (404, bad path) turned into an endless reload loop that re-downloaded on every tick.
        this.MAX_RELOAD_ATTEMPTS = 3;
        this._reloadAttempts = 0;
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
                Urso.cache.addTexture(asset.key, resource);
                break;
            case Urso.types.assets.JSON:
                Urso.cache.addJson(asset.key, resource);
                break;
            case Urso.types.assets.JSONATLAS:
                Urso.cache.addJsonAtlas(asset.key, resource);
                break;
            case Urso.types.assets.SOUND:
                Urso.cache.addSound(asset.key, resource);
                break;
            case Urso.types.assets.SPINE:
                Urso.cache.addSpine(asset.key, resource);
                break;
            case Urso.types.assets.SPINEATLAS:
                Urso.cache.addSpineAtlas(asset.key, resource);
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
    async start(callback) {
        if (this._isRunning)
            return false;

        if (this._assetsQuery.length === 0) {
            return await callback();
        }

        this._isRunning = true;
        this._lastLoadFailed = false;
        this._iterationNumber++;
        const currentIteration = this._iterationNumber;
        this._completeCallback = callback;
        this._loader = PIXI.Assets // new PIXI.Loader();
        const appVersion = Urso.config.appVersion;

        if (appVersion && !_searchParamsApplied) {
            // FIXED: Pixi v7 had PIXI.Loader.defaultQueryString. Pixi v8 uses resolver.setDefaultSearchParams to add
            // anticache query params to all resolved URLs. Apply once per game lifetime to bust cache on version bump.
            PIXI.Assets.resolver.setDefaultSearchParams({ appVersion });
            _searchParamsApplied = true;
        }

        // FIXED: replaced per-asset async map with batch loading to support progress tracking and proper error handling
        try {
            // Collect assets that must be loaded from network and track those from JSONATLAS
            const assetsToLoad = [];

            for (const asset of this._assetsQuery) {
                // TODO: check to load
                let params = asset.params || false; // TODO: Set params field in base mode

                if (asset.type === Urso.types.assets.JSON || asset.type === Urso.types.assets.ATLAS) { // check json in JSONATLAS
                    const jsonData = this._getJsonDataFromJsonAtlases(asset.key);

                    if (jsonData) {
                        switch (asset.type) {
                            case Urso.types.assets.JSON:
                                Urso.cache.addJson(asset.key, jsonData); // FIXED: unwrap { data: jsonData } envelope — normal load path stores unwrapped shape, so both paths must match
                                break;
                            case Urso.types.assets.ATLAS:
                                //FIXME
                                // this._loader.add(asset.key, jsonData, params, (resource) => this._storeAsset(asset, resource));
                                break;
                        }

                        continue;
                    }
                }

                //FIXME
                // if (asset.type === Urso.types.assets.SPINE && asset.noAtlas) { // check SPINE in JSONATLAS
                    // if (!params)
                    //     params = {};

                    // params.metadata = { spineAtlas: Urso.cache.getGlobalAtlas() };

                    // //check for json in JSONATLAS
                    // const jsonData = this._getJsonDataFromJsonAtlases(asset.key);

                // }

                const loadPath = this._getLoadPath(asset);
                // FIXED: collect assets for batch load instead of individual per-asset loads
                assetsToLoad.push({
                    asset,
                    loadEntry: { alias: asset.key, src: loadPath }
                });
            }

            // Load all assets from network in a single batch with progress tracking
            // FIXED: use PIXI.Assets.load batch form with progress callback that converts 0-1 to 0-100 scale
            if (assetsToLoad.length > 0) {
                const loadAliases = assetsToLoad.map(entry => entry.loadEntry.alias);

                // First add all assets to the resolver.
                // FIXED: skip aliases the resolver already holds — re-adding warns
                // "[Resolver] already has key: X overwriting" for every asset on a retry.
                const assetsToAdd = assetsToLoad
                    .map(entry => entry.loadEntry)
                    .filter(entry => !PIXI.Assets.resolver.hasKey(entry.alias));

                if (assetsToAdd.length > 0)
                    PIXI.Assets.add(assetsToAdd);

                // Then load with progress callback
                const loadedResources = await PIXI.Assets.load(loadAliases, (progress) => {
                    // FIXED: scale progress from 0-1 to 0-100 as consumers expect
                    this._onLoadUpdate({ progress: progress * 100 });
                });

                // Store each loaded asset
                for (const { asset, loadEntry } of assetsToLoad) {
                    const resource = loadedResources[loadEntry.alias];
                    this._storeAsset(asset, resource);
                }
            }

            // FIXED: reset loader state on success path — required for reusable loader instances
            this._onLoadUpdate({ progress: 100 });
            this._assetsQuery = [];
            this._isRunning = false;
            this._reloadAttempts = 0;
        } catch (error) {
            // FIXED: wrap the load in try/catch and route to _onError, which schedules a retry — without
            // this, a single failed asset left the engine stuck on the loading screen forever.
            this._onError(error);
            return; // Do not call callback on error path — the retry calls it via _completeCallback
        }

        // FIXED: callback() runs OUTSIDE the try. Inside it, any exception thrown by game code in the
        // completion handler (scene build, component create) would be caught as if it were an asset-load
        // failure and trigger a full reload loop of assets that had actually loaded fine.
        await callback();
    };

    _getJsonDataFromJsonAtlases(key) {
        const jsonAtlases = Urso.cache.getJsonAtlases();

        for (let jsonAtlasKey in jsonAtlases) {
            if (jsonAtlases[jsonAtlasKey].data.hasOwnProperty(key)) {
                return jsonAtlases[jsonAtlasKey].data[key];
            }
        }

        return null;
    }


    _onError(error) {
        Urso.logger.warn('LibLoader file load error: ', error);

        // FIXED: this used to call PIXI.Assets.reset(), which wipes the resolver, the loader, the WHOLE
        // global asset cache and the initialised flag — destroying textures belonging to the currently
        // displayed scene and to previously loaded lazy groups, while Urso.cache kept dangling references
        // to them. It was harmless only while _onError was unreachable dead code. A failed batch must not
        // discard unrelated assets: _assetsQuery is still intact here, so the retry re-runs just this batch.
        this._isRunning = false;
        this._lastLoadFailed = true;
        this._reloadAttempts++;

        if (this._reloadAttempts > this.MAX_RELOAD_ATTEMPTS) {
            Urso.logger.error(
                `LibLoader giving up after ${this.MAX_RELOAD_ATTEMPTS} failed attempts. Continuing without these assets:`,
                this._assetsQuery.map(asset => asset.key)
            );

            const callback = this._completeCallback;
            this._reloadAttempts = 0;
            this._assetsQuery = [];

            // Proceed rather than hang. Objects referencing the missing assets will log their own
            // "no asset with key" errors, which is far easier to diagnose than a frozen loading screen.
            callback();
            return;
        }

        Urso.logger.warn(`LibLoader all assets RELOAD (attempt ${this._reloadAttempts}/${this.MAX_RELOAD_ATTEMPTS})...`);
        this._resizeTimeoutId = Urso.setTimeout(() => this.start(this._completeCallback), this.RELOAD_DELAY);
    }

};

export default LibLoader;
