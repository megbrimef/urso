class ModulesStatesManagerController {
    constructor() {
        this.singleton = true;

        this._configStates;
        this._currentState;
        this._started = false;
        this._guardsCounter = 0;
        this._guards = {};

        this._iterator = this._iteratorConstructor();
        this._nextState = this._nextState.bind(this);
    }

    start() {
        if (this._started)
            return;

        this._started = true;
        this._configStates = this.getInstance('ConfigStates').get();
        this._nextState();
    }

    setGuard(key, guard) {
        if (!this._guards[key])
            this._guards[key] = {};

        const guid = this._getGuardsUid();
        guard._guid = guid;
        this._guards[key][guid] = guard;
    }

    checkGuard(key) {
        if (this._guards[key]) {
            let guardsArray = Object.values(this._guards[key]);

            for (let guard of guardsArray) {   // any
                if (!guard())
                    return false;
            }
        }

        return true;
    }

    removeGuard(key, guard) {
        const guid = guard._guid;
        delete this._guards[key][guid];

        if (Urso.helper.getObjectSize(this._guards[key]) === 0)
            delete this._guards[key];
    }

    _getGuardsUid() {
        this._guardsCounter++;
        return 'guard_' + this._guardsCounter;
    }

    _iteratorConstructor() {
        let nextIndex = 0;

        return {
            next: (() => {
                let statesArray = Object.keys(this._configStates);

                if (nextIndex === statesArray.length)
                    nextIndex = 0;

                return statesArray[nextIndex++];
            }).bind(this)
        }
    }

    _nextState() {
        this._currentState = this._iterator.next();

        this.emit(Urso.events.MODULES_STATES_MANAGER_STATE_CHANGE, this._currentState);

        log('%c State ' + this._currentState, 'background: #222; color: #bada55')

        let config = this._configStates[this._currentState];
        let classInstance = this.getInstance('Helper').getActionByConfig(config);

        if (!classInstance.guard())
            return this._nextState();

        classInstance.run(this._nextState);
    }
}

module.exports = ModulesStatesManagerController;
