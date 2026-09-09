import * as spine from '@esotericsoftware/spine-pixi-v8';

// FIXED: texture extension stripping was too broad — added whitelist to prevent data loss
// when atlas frames named ui.button.normal silently collapsing onto ui.button due to
// indiscriminate dot-stripping. This set defines all image formats the engine can load.
const KNOWN_TEXTURE_EXTENSIONS = new Set([
    'png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'bmp', 'svg', 'ktx', 'ktx2', 'basis', 'dds'
]);

// FIXED: this normalisation existed TWICE — once in addTexture and once in _createGlobalAtlas —
// and the two drifted apart. addTexture was corrected to strip only real image extensions, while
// _createGlobalAtlas still stripped the last dot-segment of ANY frame name. For a frame called
// `ui.button.normal` the texture cache then held `ui.button.normal` while the spine atlas region
// was named `ui.button`, so a spine attachment referencing it could not resolve. Both callers now
// share this one function so they cannot diverge again.
const stripTextureExtension = (key) => {
    const lastDotIndex = key.lastIndexOf('.');

    if (lastDotIndex > 0 && lastDotIndex < key.length - 1) {
        const extension = key.substring(lastDotIndex + 1).toLowerCase();

        if (KNOWN_TEXTURE_EXTENSIONS.has(extension))
            return key.substring(0, lastDotIndex);
    }

    return key;
};

class LibCache {
    _globalAtlas = null

    constructor() {
        this.assetsList = {
            atlas: {},
            binary: {},
            bitmapFont: {},
            container: {}, // FIXED: addContainer/getContainer were trying to access undefined assetsList.container — initialize it
            file: {},
            image: {},
            json: {},
            jsonAtlas: {},
            sound: {},
            spine: {},
            spineAtlas: {},
            texture: {},
        };
        // FIXED: track texture sources to identify which atlas owns each cached frame — prevents silent data loss when two atlases have frames with the same basename
        this._textureSources = {};
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

    _getMeshFrameNames() {
        const names = new Set();
        const meshTypes = new Set(['mesh', 'weightedmesh', 'linkedmesh']);

        for (const key in Urso.cache.assetsList.spine) {
            const data = Urso.cache.assetsList.spine[key];
            if (!data?.skins) continue;

            for (const skin of data.skins) {
                if (!skin.attachments) continue;
                for (const slotName in skin.attachments) {
                    const slot = skin.attachments[slotName];
                    for (const attName in slot) {
                        const att = slot[attName];
                        if (meshTypes.has(att.type))
                            names.add(att.path || attName);
                    }
                }
            }
        }

        return names;
    }

    _createGlobalAtlas() {
        const textureAtlas = new spine.TextureAtlas('');
        const atlases = Urso.cache.assetsList.atlas;
        const meshFrameNames = this._getMeshFrameNames();

        for (const key in atlases) {
            const atlas = atlases[key];
            const page = new spine.TextureAtlasPage(key);
            const { w, h } = atlas.data.meta.size;
            const scale = parseFloat(atlas.data.meta.scale) || 1;

            const baseTexture = new spine.SpineTexture(atlas.textureSource);

            page.width = w;
            page.height = h;
            page.texture = baseTexture;
            page.minFilter = page.magFilter = 9729;
            page.uWrap = page.vWrap = 33071;
            textureAtlas.pages.push(page);

            for (const frameName in atlas.data.frames) {
                // FIXED: was stripping the last dot-segment of any frame name, which disagreed
                // with the texture cache for names like `ui.button.normal`. Shares addTexture's
                // normalisation now so region names and texture keys always match.
                const normalizedName = stripTextureExtension(frameName);

                const frame = atlas.data.frames[frameName];
                const region = new spine.TextureAtlasRegion(page, normalizedName);
                const isRotated = frame.rotated === true || frame.rotated === 90;
                const fx = frame.frame.x;
                const fy = frame.frame.y;
                const fw = frame.frame.w;
                const fh = frame.frame.h;

                region.u = fx / w;
                region.v = fy / h;
                region.u2 = (fx + fw) / w;
                region.v2 = (fy + fh) / h;
                region.degrees = isRotated ? 90 : 0;

                if (meshFrameNames.has(normalizedName)) {
                    // Mesh frames: keep originalSize equal to packed size so regionUVs [0,1]
                    // stay within [region.u, region.u2]. Using sourceSize here would map UVs
                    // across the full untrimmed sprite, hitting neighboring atlas regions.
                    region.width = isRotated ? fh : fw;
                    region.height = isRotated ? fw : fh;
                    region.originalWidth = region.width;
                    region.originalHeight = region.height;
                    region.offsetX = 0;
                    region.offsetY = 0;
                } else {
                    // Region/other frames: use design-space sizes for correct display dimensions.
                    region.width = (isRotated ? fh : fw) / scale;
                    region.height = (isRotated ? fw : fh) / scale;
                    region.originalWidth = frame.sourceSize ? frame.sourceSize.w / scale : region.width;
                    region.originalHeight = frame.sourceSize ? frame.sourceSize.h / scale : region.height;
                    if (frame.spriteSourceSize && frame.sourceSize) {
                        region.offsetX = frame.spriteSourceSize.x / scale;
                        region.offsetY = (frame.sourceSize.h - frame.spriteSourceSize.y - frame.spriteSourceSize.h) / scale;
                    } else {
                        region.offsetX = 0;
                        region.offsetY = 0;
                    }
                }

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

    _setDataToAssetsList(assetType, key, data, suppressWarning = false) {
        if (this.assetsList[assetType][key] && !suppressWarning)
            // FIXED: collision warning now goes through Urso.logger.warn so it respects
            // the engine's configured log level, making data loss visible to users.
            Urso.logger.warn(`LibCache ${assetType}: key already exists: `, key, data);

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

    addTexture(key, someData, sourceKey = null) {
        // FIXED: extension stripping is now guarded by whitelist — only strip if the final
        // segment after the dot is a known texture extension (case-insensitive match).
        // This prevents atlas frames named ui.button.normal from silently becoming ui.button.
        key = stripTextureExtension(key);

        // FIXED: detect texture cache collisions by frame basename and name both atlases — prevents silent data loss when two atlases contain frames with the same name
        const previousSource = this._textureSources[key];

        // FIXED: a re-registration from the SAME source is not a collision — an atlas can legitimately be
        // processed again (a loader retry, or a scene re-display re-running _processLoadedAtlases over an
        // already-cached atlas). Reporting those would fire an error per frame for a non-problem and train
        // people to ignore the message that matters.
        const isSameSource = previousSource && sourceKey && previousSource === sourceKey;

        if (this.assetsList.texture[key] !== undefined && !isSameSource) {
            const sourceInfo = [];
            if (previousSource) sourceInfo.push(`registered from atlas "${previousSource}"`);
            else sourceInfo.push('previous registration source unknown');
            if (sourceKey) sourceInfo.push(`now being overwritten by atlas "${sourceKey}"`);
            Urso.logger.error(
                `LibCache texture collision: frame key "${key}" is defined in multiple atlases ` +
                `(${sourceInfo.join(', ')}). Rename one of the frames so the basenames differ, ` +
                `or reorder your atlas load sequence if last-write-wins is intended.`
            );
        }

        if (sourceKey) {
            this._textureSources[key] = sourceKey;
        }

        this._setDataToAssetsList('texture', key, someData, true);
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

    removeAsset(assetType, key) {
        // ADDED: Remove asset from cache bucket, clearing texture sources and invalidating derived atlases — enables group unloading
        if (!this.assetsList[assetType] || this.assetsList[assetType][key] === undefined) {
            return false;
        }

        delete this.assetsList[assetType][key];

        // ADDED: Clean up texture source tracking when removing textures — prevents collision detection against deleted sources
        if (assetType === 'texture') {
            delete this._textureSources[key];
        } else if (assetType === 'atlas') {
            // ADDED: Invalidate global atlas when removing atlases — derived atlas is stale until rebuilt
            this.clearGlobalAtlas();
        }

        return true;
    }

    removeTexturesFromSource(sourceKey) {
        // ADDED: Remove all atlas frames from a source to complete group cleanup — atlas frames are keyed by name not by atlas key
        const textures = this.assetsList.texture;
        const keysToRemove = [];

        // Iterate snapshot to avoid mutation during iteration
        for (const key of Object.keys(textures)) {
            if (this._textureSources[key] === sourceKey) {
                keysToRemove.push(key);
            }
        }

        for (const key of keysToRemove) {
            delete textures[key];
            delete this._textureSources[key];
        }

        return keysToRemove.length;
    }
};

export default LibCache;
