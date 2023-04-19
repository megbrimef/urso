class LibLocalData {
    constructor() {
        this._data = {};
    }

    /**
     * recursive get value from local data
     * (*) you can use '.' as objects keys splitter
     * @param {String} key
     * @returns {Mixed}
     */
    get(name) {
        return Urso.helper.recursiveGet(name, this._data);
    };

    /**
     * recursive set value to local data
     * (*) you can use '.' as objects keys splitter
     * @param {String} key
     * @param {Mixed} value
     * @returns {Boolean}
     */
    set(key, value) {
        Urso.helper.recursiveSet(key, value, this._data);
        return true;
    };
}

module.exports = LibLocalData;