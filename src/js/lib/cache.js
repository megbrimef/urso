class LibCache {
    _globalAtlas = null

    constructor() {
        this.assetsList = {
            atlas: {},
            binary: {},
            bitmapFont: {},
            file: {},
            image: {},
            json: {},
            jsonAtlas: {},
            sound: {},
            spine: {},
            spineAtlas: {},
            texture: {},
        };
    };

    clearGlobalAtlas() {
        this._globalAtlas = null;
    }

    get globalAtlas() {
        if (!this._globalAtlas) {
            this._globalAtlas = this._createGlobalAtlas();
        }
        
        return this._globalAtlas;
    }

    _createGlobalAtlas() {
        const textureAtlas = new PIXI.spine.TextureAtlas('');
        const atlases = Urso.cache.assetsList.atlas;

        for (const key in atlases) {
            const atlas = atlases[key];
            
            const page = new PIXI.spine.TextureAtlasPage(key);
            const { w, h } = atlas.data.meta.size;
            
            const baseTexture = new PIXI.spine.SpineTexture(atlas.textureSource);

            page.width = w;
            page.height = h;
            page.texture = baseTexture;
            page.minFilter = page.magFilter = 9729;
            page.uWrap = page.vWrap = 33071;
            textureAtlas.pages.push(page);

            for (const frameName in atlas._frames) {
                const frame = atlas._frames[frameName];
                const region = new PIXI.spine.TextureAtlasRegion(page, frameName);
                
                region.width = frame.frame.w;
                region.height = frame.frame.h;
                region.u = frame.frame.x / baseTexture.texture.width;
                region.v = frame.frame.y / baseTexture.texture.height;
                region.u2 = (frame.frame.x + frame.frame.w) / baseTexture.texture.width;
                region.v2 = (frame.frame.y + frame.frame.h) / baseTexture.texture.height;
                region.rotate = false;
                region.originalWidth = frame.sourceSize.w;
                region.originalHeight = frame.sourceSize.h;
                region.texture = baseTexture;

                textureAtlas.regions.push(region);
            }
        }
        
        for (const key in Urso.cache.assetsList.spineAtlas) {
            const { pages, regions } = Urso.cache.assetsList.spineAtlas[key];

            for (const page of pages) {
                textureAtlas.pages.push(page);
            }
            for (const region of regions) {
                textureAtlas.regions.push(region);
            }
        }

        return textureAtlas;
    }

    _setDataToAssetsList(assetType, key, data) {
        if (this.assetsList[assetType][key])
            console.warn(`LibCache ${assetType}: key already exists: `, key, data);

        this.assetsList[assetType][key] = data;
    }

    addFile(key, someData) {
        this._setDataToAssetsList('file', key, someData);
    };

    addAtlas(key, someData) {
        this._setDataToAssetsList('atlas', key, someData);
        this.clearGlobalAtlas();
    };

    addBinary(key, someData) {
        this._setDataToAssetsList('binary', key, someData);
    };

    addBitmapFont(key, someData) {
        this._setDataToAssetsList('bitmapFont', key, someData);
    };

    addContainer(key, someData) {
        this._setDataToAssetsList('container', key, someData);
    };

    addImage(key, someData) {
        this._setDataToAssetsList('image', key, someData);
    };

    addJson(key, someData) {
        this._setDataToAssetsList('json', key, someData);
    };

    addJsonAtlas(key, someData) {
        this._setDataToAssetsList('jsonAtlas', key, someData);
    };

    addSound(key, someData) {
        this._setDataToAssetsList('sound', key, someData);
    };

    addTexture(key, someData) {
        this._setDataToAssetsList('texture', key, someData);
    };

    addSpine(key, someData) {
        this._setDataToAssetsList('spine', key, someData);
    };

    addSpineAtlas(key, someData) {
        this._setDataToAssetsList('spineAtlas', key, someData);
    }

    getFile(key) {
        return this.assetsList.file[key];
    };

    getAtlas(key) {
        return this.assetsList.atlas[key];
    };

    getBinary(key) {
        return this.assetsList.binary[key];
    };

    getBitmapFont(key) {
        return this.assetsList.bitmapFont[key];
    };

    getContainer(key) {
        return this.assetsList.container[key];
    };

    getImage(key) {
        return this.assetsList.image[key];
    };

    getJson(key) {
        return this.assetsList.json[key];
    };

    getJsonAtlas(key) {
        return this.assetsList.jsonAtlas[key];
    };

    getJsonAtlases() {
        return this.assetsList.jsonAtlas;
    };

    getSound(key) {
        return this.assetsList.sound[key];
    };

    getSpine(key) {
        return this.assetsList.spine[key];
    };

    getSpineAtlas(key) {
        return this.assetsList.spineAtlas[key];
    };

    getTexture(key) {
        return this.assetsList.texture[key];
    };

    getGlobalAtlas() {
        return this.globalAtlas;
    }
};

module.exports = LibCache;
