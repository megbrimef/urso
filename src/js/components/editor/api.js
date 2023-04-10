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
        ATLAS: [{ name: 'key', type: 'text' }, { name: 'path', type: 'file' }], // path to json file
        BITMAPFONT: [{ name: 'key', type: 'text' }, { name: 'path', type: 'file' }], // path to json file
        CONTAINER: [{ name: 'key', type: 'text' }],
        FONT: [{ name: 'key', type: 'text' }, { name: 'path', type: 'file' }], // path to json file
        IMAGE: [{ name: 'key', type: 'text' }, { name: 'path', type: 'file' }], // path to json file
        JSON: [{ name: 'key', type: 'text' }, { name: 'path', type: 'file' }], // path to json file
        SPINE: [{ name: 'key', type: 'text' }, { name: 'path', type: 'file' }], // path to json file
    }

    _commonObjectsKeys = [
        { name: 'id', type: 'text' },
        { name: 'name', type: 'text' },
        { name: 'class', type: 'text' },
        { name: 'x', type: 'number' },
        { name: 'y', type: 'number' },
        { name: 'z', type: 'number' },
        { name: 'anchorX', type: 'number', range: [-1, 1] },
        { name: 'anchorY', type: 'number', range: [-1, 1] },
        { name: 'scaleX', type: 'number' },
        { name: 'scaleY', type: 'number' },
        { name: 'angle', type: 'number', range: [0, 360] },
        { name: 'alpha', type: 'number', range: [0, 1] },
        { name: 'visible', type: 'boolean' },
    ];

    _objectsKeys = {
        BITMAPTEXT: Urso.helper.mergeArrays(this._commonObjectsKeys, [{ name: 'text', type: 'text' }, { name: 'fontName', type: 'text' }, { name: 'fontSize', type: 'text' }]),
        COMPONENT: Urso.helper.mergeArrays(this._commonObjectsKeys, [{ name: 'componentName', type: 'text' }]),
        CONTAINER: this._commonObjectsKeys,
        GROUP: Urso.helper.mergeArrays(this._commonObjectsKeys, [{ name: 'groupName', type: 'text' }]),
        IMAGE: Urso.helper.mergeArrays(this._commonObjectsKeys, [{ name: 'assetKey', type: 'text' }]),
        TEXT: Urso.helper.mergeArrays(this._commonObjectsKeys, [
            { name: 'text', type: 'text' },
            { name: 'fontFamily', type: 'text' },
            { name: 'fontSize', type: 'text' },
            { name: 'fill', type: 'text' },
            { name: 'stroke', type: 'text' }
        ])
    }
}

module.exports = ComponentsEditorApi;
