class ModulesAssetsService {

    constructor() {
        this.singleton = true;

        // FIXED: Separated lazy group storage into dedicated _groups field — removes confusion with per-scene preload spaces and eliminates empty object leak
        this._groups = {};

        this._currentQuality = 'auto';
        this._addedAssetsCache = [];
        this.lazyLoadProcessStarted = false;
        // ADDED: Track loaded groups to prevent reloading and enable state queries — supports deduplication on repeated calls
        this._loadedGroups = [];
        // ADDED: Track in-flight group loads with pending callbacks — prevents duplicate simultaneous loads and queues callbacks
        this._loadingGroups = {};
        // ADDED: Track group asset membership to enable unloading — maps group name to array of { type, key } records
        this._groupAssetKeys = {};
        // ADDED: Store placeholder keys for lazy-loaded assets — maps asset key to placeholder asset key for fallback rendering
        this._placeholders = {};
    };

    /**
     * system; check webP support
     */
    checkWebPSupport() {
        if (Urso.device.webP)
            Urso.addInstancesMode('webP');
    }

    /**
     * get current quality
     * @returns {String}
     */
    getQuality() {
        return this._currentQuality;
    }

    /**
     * Update quality
     */
    updateQuality() {
        this._currentQuality = this._detectQuality();
        Urso.addInstancesMode(this._currentQuality + 'Quality');
    }

    /**
     * sort assets and store to assets space
     * @param {Mixed} assets - asset or array of assets
     * @returns {Object}
     */
    sortAssets(assets) {
        const assetsSpace = this._createNewAssetsSpace();
        assetsSpace[this.getInstance('Config').loadingGroups.initial] = [];

        if (Array.isArray(assets))
            for (let asset of assets)
                this._addAsset(assetsSpace, asset);
        else
            this._addAsset(assetsSpace, assets);

        return assetsSpace;
    }

    /**
     * start load assetsSpace
     * @param {Object} assetsSpace
     * @param {Function} callback
     */
    startLoad(assetsSpace, callback, updateCallback) {
        this.loadGroup(
            assetsSpace,
            this.getInstance('Config').loadingGroups.initial,
            (() => { callback(); this._startLazyLoad(); }).bind(this),
            updateCallback
        )
    }

    /**
     * load assets group by name
     * @param {Object} assetsSpace
     * @param {String} group
     * @param {Function} callback
     * @returns {Promise}
     */
    loadGroup(assetsSpace, group, callback = () => { }, updateCallback = () => { }) {
        // FIXED: Return a Promise for async chaining — allows awaiting group loads and detecting when complete
        return new Promise((resolve) => {
            const config = this.getInstance('Config');

            // FIXED: A caller-supplied space is a per-scene preload space; it must never be recorded as a completed
            // group, because the next scene passes a DIFFERENT space under the same key. The belt-and-braces
            // || group === config.loadingGroups.initial guard handles direct calls to loadGroup(null, <initial>).
            const isPreloadSpace = !!assetsSpace || group === config.loadingGroups.initial;

            if (!assetsSpace) //global space
                // FIXED: Use _groups for persistent lazy-group registry instead of this.assets — separates per-scene preload spaces from named lazy groups
                assetsSpace = this._groups;

            // FIXED: If group already loaded, invoke callback immediately and continue chain — prevents redundant loads
            if (!isPreloadSpace && this._loadedGroups.includes(group)) {
                callback();
                resolve();
                return;
            }

            // FIXED: If group is currently loading, queue this callback to run when it completes — prevents duplicate simultaneous loads
            if (!isPreloadSpace && this._loadingGroups[group]) {
                this._loadingGroups[group].push(() => { callback(); resolve(); });
                return;
            }

            // FIXED: No assets registered yet for this group is not an error — skip it silently if it's a known config group, only error if unknown
            if (!assetsSpace[group]) {
                // FIXED: `group` is a VALUE of loadingGroups (e.g. 'lazyPart1'), not a key, so it must be
                // matched against Object.values — indexing by key only worked when a group's key and value
                // happened to be spelled identically, and never for `initial` (key 'initial', value 0).
                const isKnownGroup = Object.values(config.loadingGroups).includes(group);

                if (!isKnownGroup) {
                    Urso.logger.error('ModulesAssetsService group error, no assets:' + group + ' Check ModulesAssetsConfig please');
                }
                // FIXED: Always call callback regardless of error state — keeps lazy chain moving in all cases
                callback();
                resolve();
                return;
            }

            // Mark this group as in-flight with an empty callback queue (named lazy groups only)
            if (!isPreloadSpace)
                this._loadingGroups[group] = [];

            //we need load and parse atlases at first (!)
            const loadRestAssetsCallback = () => {
                this._loadGroupRestAssets(assetsSpace, group, () => {
                    // FIXED: When load completes, mark group as loaded, drain queued callbacks, and resolve this promise — enables state tracking
                    if (!isPreloadSpace) {
                        this._loadedGroups.push(group);
                        const queuedCallbacks = this._loadingGroups[group] || [];
                        delete this._loadingGroups[group];
                        callback();
                        queuedCallbacks.forEach(cb => cb());
                    } else {
                        callback();
                    }

                    resolve();
                }, updateCallback);
            };

            const loadAtlasesCallback = () => {
                this._loadGroupAtlases(assetsSpace, group, loadRestAssetsCallback, Urso.types.assets.ATLAS);
            }

            this._loadGroupAtlases(assetsSpace, group, loadAtlasesCallback, Urso.types.assets.JSONATLAS);
        });
    }

    // REMOVED: preloadAllImagesInGPU — was an empty stub that never did anything. To preload GPU resources use renderer.prepare (requires import 'pixi.js/prepare')

    /**
     * create new assets space for loading
     * @returns {Object}
     */
    _createNewAssetsSpace() {
        // FIXED: Return fresh space without storing on instance — eliminates per-preload empty object leak, spaces live only as long as caller holds them
        return {};
    }

    /**
     * load atlases from assets group
     * @param {Object} assetsSpace
     * @param {String} group
     * @param {Function} callback
     */
    _loadGroupAtlases(assetsSpace, group, callback, atlasType) {
        const atlases = assetsSpace[group].filter(assetModel => assetModel.type === atlasType);

        if (!atlases.length)
            return callback();

        let loader = Urso.getInstance('Lib.Loader');

        for (let assetModel of atlases)
            this._addAssetToLoader(assetModel, loader);

        loader.start(() => {
            if (atlasType === Urso.types.assets.ATLAS)
                this._processLoadedAtlases(assetsSpace, group);

            callback();
        });
    }

    /**
     * load rest assets (atkases is loaded)
     * @param {Object} assetsSpace
     * @param {String} group
     * @param {Function} callback
     */
    _loadGroupRestAssets(assetsSpace, group, callback, updateCallback) {
        let loader = Urso.getInstance('Lib.Loader');
        //load update callback
        loader.setOnLoadUpdate((params) => { updateCallback(Math.floor(params.progress)); });
        const noAtlasSpines = [];
        
        for (let assetModel of assetsSpace[group])
            if (assetModel.type !== Urso.types.assets.ATLAS && assetModel.type !== Urso.types.assets.JSONATLAS)
                if (!Urso.cache.getFile(assetModel.key)) { // FIXED: cache is keyed by asset key, not path — changed lookup from assetModel.path to assetModel.key
                    //filter noAtlas Spine files

                    //FIXME remove noAtlasSpine
                    if (assetModel.type === Urso.types.assets.SPINE && assetModel.noAtlas) {
                        noAtlasSpines.push(assetModel);
                    } else
                        this._addAssetToLoader(assetModel, loader);
                }

        loader.start(
            async () => {
                await this._processLoadedAssets(assetsSpace, group);
                this._loadNoAtlasSpines(noAtlasSpines, () => {
                    this.emit(Urso.events.MODULES_ASSETS_GROUP_LOADED, group);
                    callback();
                });
            }
        );
    }

    /**
     * load spines without .atlas files
     * @param {Array} noAtlasSpines
     * @param {Function} callback
     * @returns
     */
    _loadNoAtlasSpines(noAtlasSpines, callback) {
        if (!noAtlasSpines.length)
            return callback();

        let loader = Urso.getInstance('Lib.Loader');

        for (let assetModel of noAtlasSpines)
            this._addAssetToLoader(assetModel, loader);

        loader.start(callback);
    }

    /**
     * process loaded atlases
     * @param {Object} assetsSpace
     * @param {String} group
     */
    _processLoadedAtlases(assetsSpace, group) {
        const atlases = assetsSpace[group].filter(assetModel => assetModel.type === Urso.types.assets.ATLAS);
        const { addFolderPathInAtlasTextureKey } = this.getInstance('Config');

        for (let assetModel of atlases) {
            const assetKey = assetModel.key;
            let imageData = Urso.cache.getAtlas(assetKey);
            //FIXME
            if(!assetModel.cacheTextures) continue; // FIXED: return exits entire method, should skip only this iteration — changed to continue
    
            for (let [key, val] of Object.entries(imageData.textures)) {
                // FIXED: pass atlas key as sourceKey to addTexture so collisions can name both culprit atlases
                Urso.cache.addTexture(key, val, assetKey);
            }

            // for (const name of Object.keys(imageData.texture)) {
            //     let texture = imageData.textures[name];
            //     let newFilename = name;

            //     if (addFolderPathInAtlasTextureKey && !name.includes('/'))
            //         newFilename = folderPath + '/' + name;

            //     Urso.cache.addFile(newFilename, texture);


            // }
        }
    }

    /**
     * process loaded assets
     * @param {Object} assetsSpace
     * @param {String} group
     */
    async _processLoadedAssets(assetsSpace, group) {
        for (let assetModel of assetsSpace[group]) {
            if(assetModel.type === Urso.types.assets.SPINEATLAS) {
                this._processLoadedSpineAtlas(assetModel);
            }
        }

        delete assetsSpace[group];
    }

    _processLoadedSpineAtlas(assetModel) {
        const spineAtlas = Urso.cache.getSpineAtlas(assetModel.key);

        if (!spineAtlas)
            return Urso.logger.error('ModulesAssetsService process Loaded Spine Atlas error: no image ', assetModel);

        spineAtlas.regions.forEach(({ name, texture: {texture}}) => {
            Urso.cache.addTexture(name, texture);
        });
    }

    // REMOVED: _processLoadedFont, _processLoadedBitmapFont, _updateFontKey — Pixi v8 ships loadWebFont and loadBitmapFont natively

    /**
     * get current assets resolution
     * @returns {Number}
     */
    getCurrentResolution() {
        const { qualityFactors, defaultQualityFactor } = this.getInstance('Config');
        return qualityFactors[this._currentQuality] || defaultQualityFactor || 1;
    }

    // REMOVED: _processLoadedImage — Pixi v8 Assets already returns usable textures

    /**
     * add asset
     * @param {Object} assetsSpace
     * @param {Object} asset
     * @param {String} loadingGroup
     */
    _addAsset(assetsSpace, asset, loadingGroup) {
        //cache for all assets. We do not need to load same assets twice or more
        if (asset.type !== Urso.types.assets.CONTAINER) {
            let addedAssetKey = `${asset.type}_${asset.key}`;

            if (this._addedAssetsCache.includes(addedAssetKey))
                return;

            this._addedAssetsCache.push(addedAssetKey);
        }

        let model;

        switch (asset.type) {
            case Urso.types.assets.ATLAS:
                model = this.getInstance('Models.Atlas', asset)
                break;
            case Urso.types.assets.AUDIOSPRITE:
                model = this.getInstance('Models.Audiosprite', asset)
                break;
            case Urso.types.assets.BITMAPFONT:
                model = this.getInstance('Models.BitmapFont', asset)
                break;
            case Urso.types.assets.CONTAINER:
                model = this.getInstance('Models.Container', asset)
                break;
            case Urso.types.assets.FONT:
                model = this.getInstance('Models.Font', asset)
                break;
            case Urso.types.assets.HTML:
                model = this.getInstance('Models.Html', asset)
                break;
            case Urso.types.assets.IMAGE:
                model = this.getInstance('Models.Image', asset)
                break;
            case Urso.types.assets.JSON:
                model = this.getInstance('Models.Json', asset)
                break;
            case Urso.types.assets.JSONATLAS:
                model = this.getInstance('Models.JsonAtlas', asset)
                break;
            case Urso.types.assets.SOUND:
                model = this.getInstance('Models.Sound', asset)
                break;
            case Urso.types.assets.SPINE:
                model = this.getInstance('Models.Spine', asset)
                break;
            case Urso.types.assets.SPINEATLAS:
                model = this.getInstance('Models.SpineAtlas', asset)
                break;
            default:
                Urso.logger.error('ModulesAssetsService asset type error', asset);
                break;
        };

        //set loadingGroup
        model.loadingGroup = loadingGroup || model.loadingGroup || this.getInstance('Config').loadingGroups.initial;

        // ADDED: Record placeholder key if configured on asset — enables lazy-loaded objects to show stand-in texture
        if (model.placeHolder)
            this._placeholders[model.key] = model.placeHolder;

        //check if container
        if (model.contents) {
            for (let content of model.contents) {
                this._addAsset(assetsSpace, content, model.loadingGroup);
            }

            return;
        }

        if (model.loadingGroup === this.getInstance('Config').loadingGroups.initial) {
            assetsSpace[model.loadingGroup].push(model);
        } else {
            // FIXED: Store lazy groups in dedicated _groups field instead of this.assets — separates per-scene preload spaces from persistent lazy group registry
            //add single asset to loading group
            if (!this._groups[model.loadingGroup])
                this._groups[model.loadingGroup] = [];

            this._groups[model.loadingGroup].push(model);

            // ADDED: Record group asset membership for later unloading — tracks which assets belong to each group to enable removal
            if (!this._groupAssetKeys[model.loadingGroup])
                this._groupAssetKeys[model.loadingGroup] = [];

            this._groupAssetKeys[model.loadingGroup].push({ type: model.type, key: model.key });
        }
    }

    /**
     * start lazy load process
     */
    _startLazyLoad() {
        if (this.lazyLoadProcessStarted)
            return;

        this.lazyLoadProcessStarted = true;
        this._continueLazyLoad();
    }

    /**
     * check if a group has already been loaded
     * @param {String} name - group name
     * @returns {Boolean}
     */
    isGroupLoaded(name) {
        // ADDED: Query loaded groups state — allows checking if a group is already in memory
        return this._loadedGroups.includes(name);
    }

    /**
     * check if a group is currently loading
     * @param {String} name - group name
     * @returns {Boolean}
     */
    isGroupLoading(name) {
        // ADDED: Query in-flight loads state — allows checking if a group load is in progress
        return this._loadingGroups.hasOwnProperty(name);
    }

    /**
     * get placeholder key for a lazy-loaded asset
     * @param {String} assetKey - the asset key to look up
     * @returns {String|Boolean} placeholder asset key or false if none configured
     */
    getPlaceholderKey(assetKey) {
        // ADDED: Return placeholder key for lazy assets or false if none — enables objects to show stand-in while loading real texture
        return this._placeholders[assetKey] || false;
    }

    /**
     * unload a lazy-loaded asset group and release GPU resources
     * @param {String} name - group name
     * @returns {Promise<Boolean>} false if group was never loaded, true if successfully unloaded
     */
    async unloadGroup(name) {
        // ADDED: Unload group and clean up all associated assets — enables memory-efficient lazy loading transitions

        // Return early if group was never loaded
        if (!this._loadedGroups.includes(name)) {
            return false;
        }

        // ADDED: Define type-to-bucket mapping based on _storeAsset in loader.js — translates asset type to cache bucket name
        const typeToBucket = {
            [Urso.types.assets.ATLAS]: 'atlas',
            [Urso.types.assets.BITMAPFONT]: 'bitmapFont',
            [Urso.types.assets.CONTAINER]: 'container',
            [Urso.types.assets.FONT]: 'file',
            [Urso.types.assets.HTML]: 'file',
            [Urso.types.assets.IMAGE]: 'texture',
            [Urso.types.assets.JSON]: 'json',
            [Urso.types.assets.JSONATLAS]: 'jsonAtlas',
            [Urso.types.assets.SOUND]: 'sound',
            [Urso.types.assets.SPINE]: 'spine',
            [Urso.types.assets.SPINEATLAS]: 'spineAtlas',
        };

        const entries = this._groupAssetKeys[name] || [];

        // ADDED: Ask Pixi to release GPU resources for all group assets — prevents GPU memory leak
        try {
            await PIXI.Assets.unload(entries.map(e => e.key));
        } catch (error) {
            // ADDED: Log warning on unload failure but continue cleanup — partial failures should not block cache cleanup
            Urso.logger.warn(`ModulesAssetsService: failed to unload PIXI assets for group "${name}": ${error.message}`);
        }

        // ADDED: Remove each asset from the engine cache — frees CPU memory and clears derived state
        for (const entry of entries) {
            const bucketName = typeToBucket[entry.type];
            if (bucketName) {
                Urso.cache.removeAsset(bucketName, entry.key);

                // ADDED: For atlases, also remove their cached texture frames — frames are keyed by name not by atlas key
                if (entry.type === Urso.types.assets.ATLAS) {
                    Urso.cache.removeTexturesFromSource(entry.key);
                }
            }
        }

        // ADDED: Clear the asset from the deduplication cache so it can be registered again — resets loadability state
        for (const entry of entries) {
            const cacheKey = `${entry.type}_${entry.key}`;
            const idx = this._addedAssetsCache.indexOf(cacheKey);
            if (idx !== -1) {
                this._addedAssetsCache.splice(idx, 1);
            }
        }

        // ADDED: Mark group as unloaded and clear its tracked assets — allows it to be reloaded
        this._loadedGroups = this._loadedGroups.filter(g => g !== name);
        delete this._groupAssetKeys[name];

        return true;
    }

    /**
     * continue lazy load process (with current step)
     * @param {Number} step
     */
    _continueLazyLoad(step) {
        if (!step)
            step = 0;

        const lazyLoadGroups = this.getInstance('Config').lazyLoadGroups;

        if (step >= lazyLoadGroups.length) {
            // FIXED: Reset lazyLoadProcessStarted flag before emitting finish event — allows subsequent scenes to run their own lazy load chain
            this.lazyLoadProcessStarted = false;
            this.emit(Urso.events.MODULES_ASSETS_LAZYLOAD_FINISHED);
            return;
        }

        let groupName = lazyLoadGroups[step];

        if (!groupName)
            Urso.logger.error('ModulesAssetsService lazy loading groupName error');

        this.loadGroup(null, groupName, () => { this._continueLazyLoad(step + 1); })
    }

    /**
     * quality reducer
     * @param {Object} qualityFactors
     * @param {Number} widthFactor
     * @returns
     */
    _qualityReducer(qualityFactors, widthFactor) {
        return [(acc, val) => {
            if (acc === null) {
                return val;
            }

            const currentQuality = qualityFactors[acc];
            const qualityFactor = qualityFactors[val];

            const nextQuality = (currentQuality > qualityFactor && qualityFactor >= widthFactor)
                || (qualityFactor >= widthFactor && widthFactor > currentQuality)
                || (widthFactor >= qualityFactor && qualityFactor > currentQuality);

            return nextQuality ? val : acc;

        }, null]
    }

    /**
     * detect assets quality
     * @returns {Number}
     */
    _detectQuality() {
        const { qualityFactors } = this.getInstance('Config');
        const userQuality = Urso.helper.parseGetParams()['quality'];

        if (userQuality && qualityFactors[userQuality]) {
            return userQuality;
        }

        return this._calculateQuality(qualityFactors);
    }

    /**
     * calculate quality
     * @param {Object} qualityFactors
     */
    _calculateQuality(qualityFactors) {
        const { android, iOS, iPad, macOS } = Urso.device;
        const isMobile = android || iOS || iPad;

        if (macOS && !isMobile) {
            return 'high';
        }

        if (macOS && iPad) {
            return 'medium';
        }

        const resCfg = Urso.getInstance('Modules.Scenes.ResolutionsConfig').contents[0];

        const { devicePixelRatio } = window;
        let { width, height } = screen;

        if (isMobile) {
            width = (width > height) ? width : height;
        }

        if (iOS) {
            width *= devicePixelRatio;
        }

        const widthFactor = width / resCfg.width;

        const quality = Object
            .keys(qualityFactors)
            .reduce(...this._qualityReducer(qualityFactors, widthFactor));
        
        if(isMobile && quality === 'high') {
            return 'hd';
        }

        return quality;
    }

    /**
     * add asset to loader instance
     * @param {Object} assetModel
     * @param {Object} loader
     */
    _addAssetToLoader(assetModel, loader) {
        if (assetModel.path)
            loader.addAsset(assetModel);
        else if (assetModel.contents) {
            //do nothing, its a container
        } else
            Urso.logger.error('ModulesAssetsService model error', assetModel);
    };
}

export default ModulesAssetsService;
