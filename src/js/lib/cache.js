class LibCache {
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
            texture: {}
        };

        this.globalAtlas = new PIXI.spine.TextureAtlas();
    };

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
        this.globalAtlas.addTexture(key, someData);
    };

    addSpine(key, someData) {
        this._setDataToAssetsList('spine', key, someData);
    };

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

    getTexture(key) {
        return this.assetsList.texture[key];
    };

    getGlobalAtlas() {
        return this.globalAtlas;
    }

};

module.exports = LibCache;
