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

    fire(eventName, params, delay) {
        if (!eventName)
            return Urso.logger.error('ModulesObserverController fire error:', eventName);

        if (delay)
            return setTimeout((() => { this.fire(eventName, params); }).bind(this), delay)

        this._fireLocal(eventName, params);
        this._fireLocal(eventName + this._getCurPrefix(), params);
    };

    add(eventName, callback, global) {
        if (!eventName || !callback)
            return Urso.logger.error('ModulesObserverController add error:', eventName, callback);

        if (global)
            this._addLocal(eventName, callback);
        else
            this._addLocal(eventName + this._getCurPrefix(), callback);
    }

    remove(eventName, callback, global) {
        if (global)
            this._removeLocal(eventName, callback);
        else
            this._removeLocal(eventName + this._getCurPrefix(), callback);
    }

    setPrefix(p) {
        this._prefix = p;
    };

    _getUid() {
        this._counter++;
        return 'observer_' + this._counter;
    }

    _addLocal(name, callback) {
        if (!this._observers[name])
            this._observers[name] = {};

        const uid = this._getUid();
        callback._ouid = uid;

        this._observers[name][uid] = callback;
    }

    _removeLocal(name, callback) {
        if (!this._observers[name] || !callback._ouid)
            Urso.logger.error('ModulesObserverController remove error');

        const uid = callback._ouid;
        delete this._observers[name][uid];

        if (Urso.helper.getObjectSize(this._observers[name]) === 0)
            delete this._observers[name];
    }

    _fireLocal(name, params) {
        if (!this._observers[name])
            return false;

        for (let [, callback] of Object.entries(this._observers[name]))
            callback(params);

        return true;
    }

    clearAllLocal() {
        for (let name in this._observers) {
            if (name.endsWith(this._getCurPrefix()))
                delete this._observers[name];
        }
    }

    clear() {
        this._observers = {};

        return true;
    }

    _getCurPrefix() {
        return this._prefixDelimiter + this._prefix;
    };
};

module.exports = ModulesObserverController;