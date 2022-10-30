class ComponentsEditorApi {

    constructor() {

    }

    //styles
    //TODO
    addStyle() {
        //TODO
    }

    getCurrentStyles() {
        const template = Urso.template.get();
        return template.styles;
    }
    

    //assets

    /**
     * returns types list and keys to create new asset
     * @returns { types, keys }
     */
    getAssetTypes() {
        const types = Urso.types.assets;
        return { types, keys: this._assetsKeys };
    }

    /**
     * get current assets list
     * @returns {Array} assets list
     */
    getCurrentAssets() {
        const template = Urso.template.get();
        return template.assets;
    }

    /**
     * add new asset into game
     * @param {String} assetModel
     * @param {Function} callback
     */
    addAsset(assetModel, callback) {
        Urso.assets.preload([assetModel], callback);
    }


    //objects

    /**
     * get current objects list
     * @returns {Array} objects list
     */
    getCurrentObjects() {
        const template = Urso.template.get();
        return template.objects;
    }

    /**
     * returns types list and keys to create new object
     * @returns { types, keys }
     */
    getObjectsTypes() {
        const types = Urso.types.objects;
        return { types, keys: this._objectsKeys };
    }

    /**
     * add new object into game
     * @param {Object} objectModel
     * @param {Object} parent
     */
    addObject(objectModel, parent) {
        Urso.objects.create(objectModel, parent);
    }

    //settings
    editObject(id, key, value) {

    }

    ////////////////  sys

    _assetsKeys = {
        ATLAS: ['key', 'path'], // path to json file
        BITMAPFONT: ['key', 'path'], // path to json file
        CONTAINER: ['name'],
        FONT: ['key', 'path'],
        IMAGE: ['key', 'path'],
        JSON: ['key', 'path'],
        SPINE: ['key', 'path'], // path to json file
    }

    _commonObjectsKeys = ['id', 'name', 'class', 'x', 'y', 'z', 'anchorX', 'anchorY', 'scaleX', 'scaleY', 'angle', 'visible', 'alpha'];

    _objectsKeys = {
        BITMAPTEXT: Urso.helper.mergeArrays(this._commonObjectsKeys, ['text', 'fontName', 'fontSize']),
        COMPONENT: Urso.helper.mergeArrays(this._commonObjectsKeys, ['componentName']),
        CONTAINER: this._commonObjectsKeys,
        GROUP: Urso.helper.mergeArrays(this._commonObjectsKeys, ['groupName']),
        IMAGE: Urso.helper.mergeArrays(this._commonObjectsKeys, ['assetKey']),
        TEXT: Urso.helper.mergeArrays(this._commonObjectsKeys, ['text', 'fontFamily', 'fontSize', 'fill', 'stroke'])
    }
}

module.exports = ComponentsEditorApi;
