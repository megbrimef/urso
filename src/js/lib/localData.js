class LibLocalData {
    constructor(){
        this._data = {};
    }
    
    get (name) {
        return Urso.helper.recursiveGet(name, this._data);
    };

    set (key, value) {
        Urso.helper.recursiveSet(key, value, this._data);
        return true;
    };
}

module.exports = LibLocalData;