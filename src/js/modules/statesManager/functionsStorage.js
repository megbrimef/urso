
class ModulesStatesManagerFunctionsStorage {
    constructor() {
        this._functionsCounter = 0;
        this._functions = {};
    }

    //guards
    add(key, guard, onlyOneFlag = false) {
        this._addToStorage(key, guard, onlyOneFlag);
    }

    run(key) {
        if (this._functions[key]) {
            const functionsArray = Object.values(this._functions[key]);

            for (const func of functionsArray) {
                func();
            }
        }
    }

    runAndCallbackOnFinish(key, onFinishCallback) {
        if (this._functions[key]) {
            const functionsArray = Object.values(this._functions[key]);

            const promises = [];

            for (const func of functionsArray) {
                promises.push(new Promise((resolve, reject) => { func(resolve); }));
            }

            Promise.all(promises).then(onFinishCallback);
        } else {
            onFinishCallback();
        }
    }

    checkGuard(key) {
        if (this._functions[key]) {
            const guardsArray = Object.values(this._functions[key]);

            for (const guard of guardsArray) {
                if (!guard())
                    return false;
            }
        }

        return true;
    }

    remove(key, guard) {
        this._removeFromStorage(key, guard);
    }

    _addToStorage(key, func, onlyOneFlag) {
        if (!this._functions[key])
            this._functions[key] = {};
        else if (onlyOneFlag) {
            Urso.logger.error('ModulesStatesManagerFunctionsStorage: action or state can have only one guard', key, func);
            return;
        }

        const guid = this._getGuardsUid();
        func._guid = guid;
        this._functions[key][guid] = func;
    }

    _removeFromStorage(key, func) {
        const guid = func._guid;
        delete this._functions[key][guid];

        if (Urso.helper.getObjectSize(this._functions[key]) === 0)
            delete this._functions[key];
    }

    _getGuardsUid() {
        this._functionsCounter++;
        return 'guard_' + this._functionsCounter;
    }
}

module.exports = ModulesStatesManagerFunctionsStorage;