class ModulesStatesManagerController {
    constructor() {
        this.singleton = true;

        this._configStates;
        this._currentState;
        this._started = false;

        this.statesGuards = this.getInstance('FunctionsStorage');
        this.actionsGuards = this.getInstance('FunctionsStorage');
        this.actionsRuns = this.getInstance('FunctionsStorage');
        this.actionsTerminations = this.getInstance('FunctionsStorage');


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

    _iteratorConstructor() {
        let nextIndex = 0;

        return {
            next: (() => {
                let statesArray = Object.keys(this._configStates);

                //nextState
                if (this._currentState) {
                    const currentState = this._configStates[this._currentState];

                    if (currentState.nextState) { //nextState: ["PICK_GAME2", "PICK_GAME1", "IDLE"]

                        for (const stateKey of currentState.nextState) {
                            if (this.checkStateGuard(stateKey)) {
                                nextIndex = statesArray.indexOf(stateKey);

                                if (nextIndex === -1) {
                                    Urso.logger.error('ModulesStatesManagerController: nextState name error', stateKey);
                                    continue;
                                }

                                return stateKey;
                            }
                        }
                    }
                }

                //regular round logic
                if (nextIndex === statesArray.length)
                    nextIndex = 0;

                return statesArray[nextIndex++];
            }).bind(this)
        }
    }

    _nextState() {
        this._currentState = this._iterator.next();

        this.emit(Urso.events.MODULES_STATES_MANAGER_STATE_CHANGE, this._currentState);

        log('%c State ' + this._currentState, 'background: #bada55; color: #000')

        let config = this._configStates[this._currentState];
        let classInstance = this.getInstance('Helper').getActionByConfig(config);

        //state guard
        if (!this.checkStateGuard(this._currentState))
            return this._nextState();

        //actions instances guard
        if (!classInstance.guard())
            return this._nextState();

        classInstance.run(this._nextState);
    }

    //actions guards
    addActionGuard(key, guard) {
        this.actionsGuards.add(key, guard, true);
    }

    checkActionGuard(key) {
        return this.actionsGuards.checkGuard(key);
    }

    removeActionGuard(key, guard) {
        this.actionsGuards.remove(key, guard);
    }

    //actions runs
    addActionRun(key, runFunction) {
        this.actionsRuns.add(key, runFunction);
    }

    runAction(key, onFinishCallback) {
        this.actionsRuns.runAndCallbackOnFinish(key, onFinishCallback);
    }

    //actions terminations
    addActionTerminate(key, terminateFunction) {
        this.actionsTerminations.add(key, terminateFunction);
    }

    terminateAction(key) {
        this.actionsTerminations.run(key);
    }

    //states guards
    setStateGuard(key, guard) {
        this.statesGuards.add(key, guard, true);
    }

    checkStateGuard(key) {
        return this.statesGuards.checkGuard(key);
    }

    removeStateGuard(key, guard) {
        this.statesGuards.remove(key, guard);
    }

}

module.exports = ModulesStatesManagerController;
