const ComponentsBaseController = require('./../base/controller');

class ComponentsStateDrivenController extends ComponentsBaseController {

    //config for the states guards
    configStates = {
        /*IDLE: {
            guard: () => { log(123, 'IDLE guard'); return true; }
        }*/
    };

    //config for the actions configs. Guard and terminate functions are optional. Run will called when action starts.
    //call finish callback in the run handler to immidiately finish this action
    //use this.callFinish(actionKey) when its need after run handler called to delayed finish this action
    configActions = {
        /*startSpin: {
            guard: () => { log(123, 'guard'); return true; },
            run: (finish) => { log(123, 'run'); finish(); },
            terminate: () => { log(123, 'terminate'); }
        }*/
    };

    //system callbacks storage
    _finishCallbacks = {};

    _callbacksCache = {
        stateGuards: {},
        actionTerminates: {},
        actionGuards: {},
        actionRuns: {}
    };


    /**
     * caller for delayed finish callback
     * @param {String} actionKey 
     */
    callFinish(actionKey) {
        if (!this._finishCallbacks[actionKey]) {
            Urso.logger.error('ComponentsStateDrivenController: no finish for actionKey', actionKey, this);
            return;
        }

        this._finishCallbacks[actionKey]();
        delete this._finishCallbacks[actionKey];
    }

    _processStates() {
        for (const stateKey in this.configStates) {
            this._callbacksCache.stateGuards[stateKey] = this.configStates[stateKey].guard.bind(this);
            Urso.statesManager.setStateGuard(stateKey, this._callbacksCache.stateGuards[stateKey]);
        }
    }

    _processActions() {
        for (const actionKey in this.configActions) {

            //const actionCfg = this.getInstance('ActionConfig', this.configActions[actionKey]);
            const actionCfg = this.configActions[actionKey];

            if (actionCfg.run) {
                this._callbacksCache.actionRuns[actionKey] = (finish) => {
                    this._saveFinish(actionKey, finish);
                    actionCfg.run(() => this.callFinish(actionKey));
                };

                Urso.statesManager.addActionRun(actionKey, this._callbacksCache.actionRuns[actionKey]);
            } else {
                Urso.logger.error('ComponentsStateDrivenController: no run function in config', actionKey, this);
                continue;
            }

            if (actionCfg.terminate) {
                this._callbacksCache.actionTerminates[actionKey] = actionCfg.terminate.bind(this);
                Urso.statesManager.addActionTerminate(actionKey, this._callbacksCache.actionTerminates[actionKey]);
            }

            if (actionCfg.guard) {
                this._callbacksCache.actionGuards[actionKey] = actionCfg.guard.bind(this);
                Urso.statesManager.addActionGuard(actionKey, this._callbacksCache.actionGuards[actionKey]);
            }
        }
    }

    /**
     * saver for delayed finish callback
     * @param {String} actionKey 
     * @param {Function} finish 
     */
    _saveFinish(actionKey, finish) {
        if (this._finishCallbacks[actionKey])
            Urso.logger.error('ComponentsStateDrivenController: actionKey alredy exists', actionKey, finish, this);

        this._finishCallbacks[actionKey] = finish;
    }

    _subscribeOnce() {
        //do not forget use super._subscribeOnce() , if you will use _subscribeOnce in the component
        this._processStates();
        this._processActions();
        this.addListener(Urso.events.MODULES_STATES_MANAGER_STOP, this._onStatesManagerStop.bind(this), true);
    }
    
    destroy() {
        this._removeCallback(Urso.statesManager.removeStateGuard, this._callbacksCache.stateGuards);
        this._removeCallback(Urso.statesManager.removeActionGuard, this._callbacksCache.actionGuards);
        this._removeCallback(Urso.statesManager.removeActionTerminate, this._callbacksCache.actionTerminates);
        this._removeCallback(Urso.statesManager.removeActionRun, this._callbacksCache.actionRuns);
    }
    
    _removeCallback(remover, cacheObject) {
        for (let cacheKey in cacheObject) {
            remover(cacheKey, cacheObject[cacheKey]);
        }
    }

    _onStatesManagerStop() {
        this._finishCallbacks = {};
    }

}

module.exports = ComponentsStateDrivenController;
