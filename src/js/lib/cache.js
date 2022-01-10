class LibCache {
    constructor() {
        this.assetsList = {
            image: {},
            atlas: {},
            json: {},
            binary: {},
            spine: {},
            bitmapFont: {},
            sound: {},
            texture: {},
            file: {}
        };

        this.globalAtlas = new PIXI.spine.TextureAtlas();
    };

    addFile(key, someData) {
        this.assetsList.file[key] = someData;
    };

    addAtlas(key, someData) {
        this.assetsList.atlas[key] = someData;
    };

    addBinary(key, someData) {
        this.assetsList.binary[key] = someData;
    };

    addBitmapFont(key, someData) {
        this.assetsList.bitmapFont[key] = someData;
    };

    addContainer(key, someData) {
        this.assetsList.container[key] = someData;
    };

    addImage(key, someData) {
        this.assetsList.image[key] = someData;
    };

    addJson(key, someData) {
        this.assetsList.json[key] = someData;
    };

    addSound(key, someData) {
        this.assetsList.sound[key] = someData;
    };

    addTexture(key, someData) {
        this.assetsList.texture[key] = someData;
        this.globalAtlas.addTexture(key, someData);
    };

    addSpine(key, someData) {
        this.assetsList.spine[key] = someData;
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
