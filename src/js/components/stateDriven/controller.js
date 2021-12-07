ComponentsBaseController = require('./../base/controller.js');

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
            Urso.statesManager.setStateGuard(stateKey, this.configStates[stateKey].guard.bind(this));
        }
    }

    _processActions() {
        for (const actionKey in this.configActions) {

            //const actionCfg = this.getInstance('ActionConfig', this.configActions[actionKey]);
            const actionCfg = this.configActions[actionKey];

            if (actionCfg.run)
                Urso.statesManager.addActionRun(actionKey, (finish) => {
                    this._saveFinish(actionKey, finish);
                    actionCfg.run(() => this.callFinish(actionKey));
                });
            else {
                Urso.logger.error('ComponentsStateDrivenController: no run function in config', actionKey, this);
                continue;
            }

            if (actionCfg.terminate)
                Urso.statesManager.addActionTerminate(actionKey, actionCfg.terminate.bind(this));

            if (actionCfg.guard)
                Urso.statesManager.addActionGuard(actionKey, actionCfg.guard.bind(this));
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
    }

    //todo
    destroy() {
        Urso.logger.error('ComponentsStateDrivenController will remove States and Actions by configs');
    }

}

module.exports = ComponentsStateDrivenController;
