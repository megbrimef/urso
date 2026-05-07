import * as spine from '@esotericsoftware/spine-pixi-v8';

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
        const textureAtlas = new spine.TextureAtlas('');
        const atlases = Urso.cache.assetsList.atlas;

        for (const key in atlases) {
            const atlas = atlases[key];
            const page = new spine.TextureAtlasPage(key);
            const { w, h } = atlas.data.meta.size;

            const baseTexture = new spine.SpineTexture(atlas.textureSource);

            // Use the JSON meta size: frame coords are in raw image pixels, and pixelWidth is
            // scaled by resolution (e.g. 0.9x scale → pixelWidth ≈ 0.9 * actual), so we must
            // divide UVs by the actual pixel count, which meta.size always reflects correctly.
            const texW = w;
            const texH = h;

            page.width = texW;
            page.height = texH;
            page.texture = baseTexture;
            page.minFilter = page.magFilter = 9729;
            page.uWrap = page.vWrap = 33071;
            textureAtlas.pages.push(page);

            for (const frameName in atlas.data.frames) {
                let normalizedName = frameName;
                if (frameName.includes('.')) {
                    const nameSplit = frameName.split('.');
                    normalizedName = nameSplit.splice(0, nameSplit.length - 1).join('.');
                }

                const frame = atlas.data.frames[frameName];
                const region = new spine.TextureAtlasRegion(page, normalizedName);
                
                // Check if frame is rotated (TexturePacker boolean or 90 marker)
                const isRotated = frame.rotated === true || frame.rotated === 90;

                // Frame rect in the atlas (pixels)
                const fx = frame.frame.x;
                const fy = frame.frame.y;
                const fw = frame.frame.w;
                const fh = frame.frame.h;

                // Region size (swap on rotation)
                region.width = isRotated ? fh : fw;
                region.height = isRotated ? fw : fh;

                region.u = fx / texW;
                region.v = fy / texH;
                region.u2 = (fx + fw) / texW;
                region.v2 = (fy + fh) / texH;
                region.degrees = isRotated ? 90 : 0;
                
                // Use trimmed frame size as originalSize so mesh UVs [0,1] stay within the
                // packed region. Setting originalWidth = sourceSize would extend UVs across the
                // full untrimmed sprite, hitting neighboring atlas regions for transparent areas.
                // Trade-off: trimmed frames show texture compressed into the packed region.
                // Proper fix: re-export atlas with trimming disabled for mesh attachments.
                region.originalWidth = region.width;
                region.originalHeight = region.height;
                region.offsetX = 0;
                region.offsetY = 0;
                
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
        if(key.includes('.')) {
            const keySplit = key.split('.');
            key = keySplit.splice(0, keySplit.length - 1).join('.')
        }

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

export default LibCache;
