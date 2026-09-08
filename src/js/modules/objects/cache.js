class ModulesObjectsCache {
    constructor() {
        this.singleton = true;
        this._data = null;
        this.reset();
    };

    reset() {
        this._data = {
            ids: {},
            names: {},
            classes: {},
            types: {} // ADDED: type index for selector lookups
        }
    }

    addId(key, object) {
        if (this._data.ids[key])
            Urso.logger.error('ModulesObjectsCache error: id will be uniq ' + key);

        this._data.ids[key] = object;
    }

    removeId(key, object) {
        if (!this._data.ids[key])
            Urso.logger.error('ModulesObjectsCache error: no id to remove ' + key);

        if (this._data.ids[key]._uid !== object._uid)
            Urso.logger.error('ModulesObjectsCache error: invalid object with id ' + key);

        delete this._data.ids[key];
    }

    addName(key, object) {
        if (this._data.names[key])
            Urso.logger.error('ModulesObjectsCache error: name will be uniq ' + key);

        this._data.names[key] = object;
    }

    removeName(key, object) {
        if (!this._data.names[key])
            Urso.logger.error('ModulesObjectsCache error: no name to remove ' + key);

        if (this._data.names[key]._uid !== object._uid)
            Urso.logger.error('ModulesObjectsCache error: invalid object with name ' + key);

        delete this._data.names[key];
    }

    addClass(key, object) {
        let classNamesArray = key.split(' ');

        for (const className of classNamesArray)
            this._addClass(className, object);
    }

    removeClass(key, object) {
        let classNamesArray = key.split(' ');

        for (const className of classNamesArray)
            this._removeClass(className, object);
    }

    getId(key) {
        return this._data.ids[key] || false;
    }

    getName(key) {
        return this._data.names[key] || false;
    }

    getClass(key) {
        if (this._data.classes[key])
            return Object.values(this._data.classes[key]);

        return false;
    }

    getType(key) {
        // ADDED: retrieve all objects of a given type - many-to-one like classes
        if (this._data.types[key])
            return Object.values(this._data.types[key]);

        return false;
    }

    _addClass(key, object) {
        if (!this._data.classes[key])
            this._data.classes[key] = {};

        if (!this._data.classes[key][object._uid])
            this._data.classes[key][object._uid] = object;
    }

    _removeClass(key, object) {
        if (!this._data.classes[key])
            return;

        if (this._data.classes[key][object._uid])
            delete this._data.classes[key][object._uid];

        if (!Object.keys(this._data.classes[key]).length)
            delete this._data.classes[key];
    }

    addType(key, object) {
        // ADDED: add object to type index - many-to-one mapping like class
        if (!this._data.types[key])
            this._data.types[key] = {};

        if (!this._data.types[key][object._uid])
            this._data.types[key][object._uid] = object;
    }

    removeType(key, object) {
        // ADDED: remove object from type index
        if (!this._data.types[key])
            return;

        if (this._data.types[key][object._uid])
            delete this._data.types[key][object._uid];

        if (!Object.keys(this._data.types[key]).length)
            delete this._data.types[key];
    }
}

export default ModulesObjectsCache;
