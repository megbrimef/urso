class ModulesStatesManagerController {
    constructor() {
        this.singleton = true;

        this._configStates;
        this._currentState;
        this._forceNextStateKey = null;
        this._started = false;
        this._paused = false;
        this._pauseNeedResume = false;

        this.statesGuards = this.getInstance('FunctionsStorage');
        this.actionsGuards = this.getInstance('FunctionsStorage');
        this.actionsRuns = this.getInstance('FunctionsStorage');
        this.actionsTerminations = this.getInstance('FunctionsStorage');


        this._iterator; //will be defined after start
        this._nextState = this._nextState.bind(this);
    }

    start() {
        if (this._started)
            return;

        this._currentState = null;
        this._iterator = this._iteratorConstructor();
        this._started = true;
        this._configStates = this.getInstance('ConfigStates').get();
        this._nextState();
    }

    pause() {
        this._paused = true;
    }

    resume() {
        this._paused = false;

        if (this._pauseNeedResume) {
            this._pauseNeedResume = false;
            this._nextState();
        }
    }

    setForceNextState(stateKey) {
        if (!this._configStates[stateKey]) {
            Urso.logger.error('ModulesStatesManagerController: setForceNextState name error', stateKey);
        }

        this._forceNextStateKey = stateKey
    }

    _iteratorConstructor() {
        let nextIndex = 0;


        const getNextStateByOrder = () => {
            let statesArray = Object.keys(this._configStates);

            if (nextIndex === statesArray.length)
                nextIndex = 0;

            return statesArray[nextIndex++];
        }

        return {
            next: (() => {
                if (this._forceNextStateKey) {
                    const forceNextStateKey = this._forceNextStateKey;
                    this._forceNextStateKey = null;
                    return forceNextStateKey;
                }

                let statesArray = Object.keys(this._configStates);

                //nextState
                if (this._currentState) {
                    const currentState = this._configStates[this._currentState];

                    if (currentState.nextState) { //nextState: ["PICK_GAME2", "PICK_GAME1", "IDLE"]
                        for (const stateKey of currentState.nextState) {
                            if (this.checkStateGuard(stateKey)) {
                                nextIndex = statesArray.indexOf(stateKey) + 1;

                                if (nextIndex === -1) {
                                    Urso.logger.error('ModulesStatesManagerController: nextState name error', stateKey);
                                    continue;
                                }

                                return stateKey;
                            }
                        }
                    }
                }

                //go next state by order
                let stateName;

                do {
                    stateName = getNextStateByOrder();
                } while (!this.checkStateGuard(stateName));

                return stateName;
            }).bind(this)
        }
    }

    _nextState() {
        if (this._paused) {
            this._pauseNeedResume = true;
            return;
        }

        this._currentState = this._iterator.next();

        this.emit(Urso.events.MODULES_STATES_MANAGER_STATE_CHANGE, this._currentState);

        log('%c State ' + this._currentState, 'background: #bada55; color: #000')

        let config = this._configStates[this._currentState];
        let classInstance = this.getInstance('Helper').getActionByConfig(config);

        //actions instances guard
        if (!classInstance.guard())
            return this._nextState();

        classInstance.run(this._nextState);
    }

    //actions guards
    addActionGuard = (key, guard) => {
        this.actionsGuards.add(key, guard, true);
    }

    checkActionGuard = (key) => {
        return this.actionsGuards.checkGuard(key);
    }

    removeActionGuard = (key, guard) => {
        this.actionsGuards.remove(key, guard);
    }

    //actions runs
    addActionRun = (key, runFunction) => {
        this.actionsRuns.add(key, runFunction);
    }

    runAction = (key, onFinishCallback) => {
        this.actionsRuns.runAndCallbackOnFinish(key, onFinishCallback);
    }

    removeActionRun = (key, runFunction) => {
        this.actionsRuns.remove(key, runFunction);
    }

    //actions terminations
    addActionTerminate = (key, terminateFunction) => {
        this.actionsTerminations.add(key, terminateFunction);
    }

    terminateAction = (key) => {
        this.actionsTerminations.run(key);
    }

    removeActionTerminate = (key, terminateFunction) => {
        this.actionsTerminations.remove(key, terminateFunction);
    }

    //states guards
    setStateGuard = (key, guard) => {
        this.statesGuards.add(key, guard, true);
    }

    checkStateGuard = (key) => {
        return this.statesGuards.checkGuard(key);
    }

    removeStateGuard = (key, guard) => {
        this.statesGuards.remove(key, guard);
    }

}

module.exports = ModulesStatesManagerController;
