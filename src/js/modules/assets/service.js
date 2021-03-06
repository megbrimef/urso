class ModulesAssetsService {
    constructor() {
        this.singleton = true;

        this.assets = {};

        this._addedAssetsCache = [];
    };

    sortAssets(assets) {
        this.assets[this.getInstance('Config').loadingGroups.initial] = [];

        if (Array.isArray(assets))
            for (let asset of assets)
                this._addAsset(asset);
        else
            this._addAsset(assets);
    }

    startLoad(callback) {
        this.loadGroup(
            this.getInstance('Config').loadingGroups.initial,
            (() => { callback(); this._continueLazyLoad(); }).bind(this)
        )
    }

    loadGroup(group, callback) {
        let loader = Urso.getInstance('Lib.Loader');

        if (!this.assets[group])
            return Urso.logger.error('ModulesAssetsService group error, no assets:' + group + ' Check ModulesAssetsConfig please');

        for (let assetModel of this.assets[group])
            this._addAssetToLoader(assetModel, loader);

        loader.start(() => { this._processLoadedAssets(group); this.emit(Urso.events.MODULES_ASSETS_GROUP_LOADED, group); callback(); });
    }

    _processLoadedAssets(group) {
        for (let assetModel of this.assets[group]) {
            if (assetModel.type === Urso.types.assets.IMAGE)
                this._processLoadedImage(assetModel);

            if (assetModel.type === Urso.types.assets.BITMAPFONT)
                this._processLoadedBitmapFont(assetModel);
        }

        delete this.assets[group];
    }

    _processLoadedBitmapFont(assetModel) {
        this._updateFontKey(assetModel.key)
    }

    _updateFontKey(fontName) {
        const fontData = Urso.cache.getBitmapFont(fontName);

        if (PIXI.BitmapFont.available[fontName] || !fontData)
            return;

        const savedFont = PIXI.BitmapFont.available[fontData.bitmapFont.font];

        if (savedFont) {
            PIXI.BitmapFont.available[fontName] = savedFont;
            delete PIXI.BitmapFont.available[fontData.bitmapFont.font];
        }
    }

    _processLoadedImage(assetModel) {
        const { params, current } = this._getQualityParams();
        let imageQualityKey = assetModel.useBinPath;

        if (imageQualityKey === true)
            imageQualityKey = current;

        let qualityTextureResolution = params[imageQualityKey] || 1;

        const assetKey = assetModel.key;
        //textures cache
        let imageData = Urso.cache.getImage(assetKey)
        const baseTexture = new PIXI.BaseTexture(imageData.data, { resolution: qualityTextureResolution });
        const texture = new PIXI.Texture(baseTexture);

        Urso.cache.addTexture(assetKey, texture);

        if (assetModel.preloadGPU) {
            let tempOblect = Urso.objects.create({
                type: Urso.types.objects.IMAGE,
                assetKey: assetKey,
                x: -10000, y: -10000
            }, false, true);

            setTimeout(() => { tempOblect.destroy() }, 1)
        }
    }

    _addAsset(asset, loadingGroup) {
        //cache for all assets. We do not need to load same assets twice or more
        if (asset.type !== Urso.types.assets.CONTAINER) {
            let addedAssetKey = `${asset.type}_${asset.key}`;

            if (this._addedAssetsCache.includes(addedAssetKey))
                return;

            this._addedAssetsCache.push(addedAssetKey);
        }

        let model;

        switch (asset.type) {
            case Urso.types.assets.IMAGE:
                model = this.getInstance('Models.Image', asset)
                break;
            case Urso.types.assets.CONTAINER:
                model = this.getInstance('Models.Container', asset)
                break;
            case Urso.types.assets.DRAGONBONES:
                model = this.getInstance('Models.DragonBones', asset)
                break;
            case Urso.types.assets.ATLAS:
                model = this.getInstance('Models.Atlas', asset)
                break;
            case Urso.types.assets.JSON:
                model = this.getInstance('Models.Json', asset)
                break;
            case Urso.types.assets.SPINE:
                model = this.getInstance('Models.Spine', asset)
                break;
            case Urso.types.assets.BITMAPFONT:
                model = this.getInstance('Models.BitmapFont', asset)
                break;
            case Urso.types.assets.SOUND:
                model = this.getInstance('Models.Sound', asset)
                break;
            default:
                break;
        };

        //set loadingGroup
        model.loadingGroup = loadingGroup || model.loadingGroup || this.getInstance('Config').loadingGroups.initial;

        //setup path if its need
        this._setQualityPath(model); //TODO adapt for dragonbones

        //check if container or dragonbones
        if (model.contents) {
            for (let content of model.contents) {
                this._addAsset(content, model.loadingGroup);
            }

            return;
        }

        //add single asset to loading group
        if (!this.assets[model.loadingGroup])
            this.assets[model.loadingGroup] = [];

        this.assets[model.loadingGroup].push(model);
    }

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

        this.loadGroup(groupName, () => { this._continueLazyLoad(step + 1); })
    }

    // TODO: MOVE TO CFG OR HELPER?
    _getQualityParams() {
        const params = {
            high: 1,
            hd: 0.75,
            medium: 0.5,
            low: 0.25
        }
        const current = 'hd';
        return { params, current };
    }

    _setQualityPath(asset) {
        if (!asset.useBinPath)
            return;

        const { params, current } = this._getQualityParams();

        const setQuality = asset => {
            const qualityPath = (typeof asset.useBinPath === 'string' && params[asset.useBinPath]) ? asset.useBinPath : current;
            asset.path = asset.path.replace('assets', `bin/${qualityPath}`);
        }

        if (!asset.contents) {
            setQuality(asset);
            return;
        }

        for (const childAsset of asset.contents) {
            const binPath = (childAsset.useBinPath && childAsset.useBinPath !== asset.useBinPath)
                ? childAsset.useBinPath : asset.useBinPath;

            childAsset.useBinPath = binPath;
            setQuality(childAsset);
        }
    }

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
