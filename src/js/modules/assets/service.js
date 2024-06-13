class ModulesAssetsService {

    constructor() {
        this.singleton = true;

        this.assets = {};
        this._loadCounter = 0;

        this._currentQuality = 'auto';
        this._addedAssetsCache = [];
        this.lazyLoadProcessStarted = false;
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
     * @returns
     */
    loadGroup(assetsSpace, group, callback = () => { }, updateCallback) {
        if (!assetsSpace) //global space
            assetsSpace = this.assets;

        if (!assetsSpace[group])
            return Urso.logger.error('ModulesAssetsService group error, no assets:' + group + ' Check ModulesAssetsConfig please');

        //we need load and parse atlases at first (!)
        this._loadGroupAtlases(assetsSpace, group, () => { this._loadGroupRestAssets(assetsSpace, group, callback, updateCallback) });
    }

    /**
     * create new assets space for loading
     * @returns {Object}
     */
    _createNewAssetsSpace() {
        this._loadCounter++;
        this.assets[this._loadCounter] = {};
        return this.assets[this._loadCounter];
    }

    /**
     * load atlases from assets group
     * @param {Object} assetsSpace
     * @param {String} group
     * @param {Function} callback
     */
    _loadGroupAtlases(assetsSpace, group, callback) {
        const atlases = assetsSpace[group].filter(assetModel => assetModel.type === Urso.types.assets.ATLAS);

        if (!atlases.length)
            return callback();

        let loader = Urso.getInstance('Lib.Loader');

        for (let assetModel of atlases)
            this._addAssetToLoader(assetModel, loader);

        loader.start(() => { this._processLoadedAtlases(assetsSpace, group); callback(); });
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
            if (assetModel.type !== Urso.types.assets.ATLAS)
                if (!Urso.cache.getFile(assetModel.path)) {
                    //filter noAtlas Spine files
                    if (assetModel.type === Urso.types.assets.SPINE && assetModel.noAtlas) {
                        noAtlasSpines.push(assetModel);
                    } else
                        this._addAssetToLoader(assetModel, loader);
                }

        loader.start(
            () => {
                this._processLoadedAssets(assetsSpace, group);
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

        for (let assetModel of atlases) {
            const assetKey = assetModel.key;
            let imageData = Urso.cache.getAtlas(assetKey);
            const folderPath = imageData.url.split('/').slice(0, -1).join('/');

            for (const name of Object.keys(imageData.spritesheet._frames)) {
                let texture = imageData.textures[name];
                let newFilename = name;

                if (!name.includes('/'))
                    newFilename = folderPath + '/' + name;

                Urso.cache.addFile(newFilename, texture);

                if (assetModel.cacheTextures) {
                    const textureKey = newFilename.split('.')[0];
                    Urso.cache.addTexture(textureKey, texture);
                }
            }
        }
    }

    /**
     * process loaded assets
     * @param {Object} assetsSpace
     * @param {String} group
     */
    _processLoadedAssets(assetsSpace, group) {
        for (let assetModel of assetsSpace[group]) {
            if (assetModel.type === Urso.types.assets.IMAGE)
                this._processLoadedImage(assetModel);

            if (assetModel.type === Urso.types.assets.BITMAPFONT)
                this._processLoadedBitmapFont(assetModel);

            if (assetModel.type === Urso.types.assets.FONT)
                this._processLoadedFont(assetModel);
        }

        delete assetsSpace[group];
    }

    /**
     * process loaded font
     * @param {Object} source
     */
    _processLoadedFont(source) {
        const data = Urso.cache.getFile(source.key);
        const font = new FontFace(source.key, data.data);
        font.load().then(() => {
            document.fonts.add(font);
        });
    }

    /**
     * process loaded bitmap font
     * @param {Object} source
     */
    _processLoadedBitmapFont(assetModel) {
        this._updateFontKey(assetModel.key)
    }

    /**
     * Update font key if cannot use original
     * @param {String} fontName
     * @returns
     */
    _updateFontKey(fontName) {
        const fontData = Urso.cache.getBitmapFont(fontName);

        if (PIXI.BitmapFont.available[fontName] || !fontData)
            return;

        const savedFont = PIXI.BitmapFont.available[fontData.bitmapFont.font];

        if (savedFont) {
            Urso.logger.warn(`bitmapFont ${fontData.bitmapFont.font} was rewritten with key ${fontName}`);
            PIXI.BitmapFont.available[fontName] = savedFont;
            delete PIXI.BitmapFont.available[fontData.bitmapFont.font];
        }
    }

    /**
     * get current assets resolution
     * @returns {Number}
     */
    getCurrentResolution() {
        const { qualityFactors, defaultQualityFactor } = this.getInstance('Config');
        return qualityFactors[this._currentQuality] || defaultQualityFactor || 1;
    }

    /**
     * process loaded image
     * @param {Object} assetModel
     */
    _processLoadedImage(assetModel) {
        const resolution = this.getCurrentResolution();

        const assetKey = assetModel.key;
        //textures cache
        let imageData = Urso.cache.getImage(assetKey);

        if (!imageData) {
            //from atlas ?!
            let texture = Urso.cache.getFile(assetModel.path);

            if (!texture)
                return Urso.logger.error('ModulesAssetsService process Loaded Image error: no image ', assetModel);

            Urso.cache.addTexture(assetKey, texture); //TODO change resolution of base texture
        } else {
            //regular image
            const baseTexture = new PIXI.BaseTexture(imageData.data, { resolution });
            const texture = new PIXI.Texture(baseTexture);
            Urso.cache.addTexture(assetKey, texture);
        }

        if (assetModel.preloadGPU) {
            let tempOblect = Urso.objects.create({
                type: Urso.types.objects.IMAGE,
                assetKey: assetKey,
                x: -10000, y: -10000
            }, false, true, true);

            setTimeout(() => { tempOblect.destroy() }, 1)
        }
    }

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
            case Urso.types.assets.SOUND:
                model = this.getInstance('Models.Sound', asset)
                break;
            case Urso.types.assets.SPINE:
                model = this.getInstance('Models.Spine', asset)
                break;
            default:
                Urso.logger.error('ModulesAssetsService asset type error', asset);
                break;
        };

        //set loadingGroup
        model.loadingGroup = loadingGroup || model.loadingGroup || this.getInstance('Config').loadingGroups.initial;

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
            //add single asset to loading group
            if (!this.assets[model.loadingGroup])
                this.assets[model.loadingGroup] = [];

            this.assets[model.loadingGroup].push(model);
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
     * continue lazy load process (with current step)
     * @param {Number} step
     */
    _continueLazyLoad(step) {
        if (!step)
            step = 0;

        const lazyLoadGroups = this.getInstance('Config').lazyLoadGroups;

        if (step >= lazyLoadGroups.length) {
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

        return Object
            .keys(qualityFactors)
            .reduce(...this._qualityReducer(qualityFactors, widthFactor));
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

module.exports = ModulesAssetsService;
