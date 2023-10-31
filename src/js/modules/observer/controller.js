class ModulesObserverController {
    constructor() {
        //set events
        Urso.events = this.getInstance('Events').list;

        this._observers = {};
        this._prefix = '';
        this._prefixDelimiter = '_@';
        this._counter = 0;

        this._getUid = this._getUid.bind(this);
    }

    /**
     * fire event
     * @param {String} eventName
     * @param {Mixed} params
     * @param {Number} delay
     */
    fire(eventName, params, delay) {
        if (!eventName) {
            Urso.logger.error('ModulesObserverController fire error:', eventName);
            return;
        }

        if (delay) {
            setTimeout((() => { this.fire(eventName, params); }).bind(this), delay);
            return;
        }

        this._fireLocal(eventName, params);
        this._fireLocal(eventName + this._getLocalSuffix(), params);
    };

    /**
     * add listener
     * @param {String} eventName
     * @param {Function} callback
     * @param {Boolean} global
     */
    add(eventName, callback, global) {
        if (!eventName || !callback) {
            Urso.logger.error('ModulesObserverController add error:', eventName, callback);
            return
        }

        if (global)
            this._addLocal(eventName, callback);
        else
            this._addLocal(eventName + this._getLocalSuffix(), callback);
    }

    /**
     * remove listener
     * @param {String} eventName
     * @param {Function} callback
     * @param {Boolean} global
     */
    remove(eventName, callback, global) {
        if (global)
            this._removeLocal(eventName, callback);
        else
            this._removeLocal(eventName + this._getLocalSuffix(), callback);
    }

    /**
     * set local events prefix
     * @param {String} p
     */
    setPrefix(p) {
        this._prefix = p;
    };

    /**
     * get callback uid
     * @param {Function} callback
     * @returns {String}
     */
    _getUid(callback) {
        if (callback._ouid) //observer callback uid alredy exists
            return callback._ouid;

        this._counter++;
        return 'observer_' + this._counter;
    }

    /**
     * add local listener
     * @param {String} name
     * @param {Function} callback
     */
    _addLocal(name, callback) {
        if (!this._observers[name])
            this._observers[name] = {};

        const uid = this._getUid(callback);

        if (!callback._ouid) {
            callback._ouid = uid;
        }

        this._observers[name][uid] = callback;
    }

    /**
     * remove local listener
     * @param {String} name
     * @param {Function} callback
     */
    _removeLocal(name, callback) {
        if (!this._observers[name] || !callback._ouid) {
            Urso.logger.error('ModulesObserverController remove error, no observer with', name, callback);
            return;
        }

        const uid = callback._ouid;
        delete this._observers[name][uid];

        if (Urso.helper.getObjectSize(this._observers[name]) === 0)
            delete this._observers[name];
    }

    /**
     * fire local event
     * @param {String} name
     * @param {Mixed} params
     * @returns {Boolean}
     */
    _fireLocal(name, params) {
        if (!this._observers[name])
            return false;

        for (let [, callback] of Object.entries(this._observers[name]))
            callback(params);

        return true;
    }

    /**
     * clear all local listeners (can be used on scene switch)
     */
    clearAllLocal() {
        for (let name in this._observers) {
            if (name.endsWith(this._getLocalSuffix()))
                delete this._observers[name];
        }
    }

    /**
     * clear all listeners
     * @returns {Boolean}
     */
    clear() {
        this._observers = {};

        return true;
    }

    /**
     * get local events suffix
     * @returns {String}
     */
    _getLocalSuffix() {
        return this._prefixDelimiter + this._prefix;
    };
};

module.exports = ModulesObserverController;