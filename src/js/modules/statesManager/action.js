class ModulesStatesManagerAction {

    constructor(name) {
        this.name = name;

        this._running = false;
        this._terminating = false;
        this.finished = false;
        this._onFinishCallback = false;
        this._startTime = 0;

        this._onFinish = this._onFinish.bind(this);
    }

    //can we start this action?
    guard() {
        return !this._running && this.getInstance('Controller').checkActionGuard(this.name);
    }

    /**
     * run action
     * @param {Function} onFinishCallback
     */
    run(onFinishCallback) {
        this._preRunUpdateAction(onFinishCallback);
        Urso.statesManager.runAction(this.name, this._onFinish);

        //TODO remove temp for debug
        //let timeout = Math.floor(Math.random() * 2000);
        //Urso.statesManager.runAction(this.name, () => setTimeout(() => { this._onFinish(); }, timeout));
    }

    /**
     * pre run update action
     * @param {Function} onFinishCallback
     */
    _preRunUpdateAction(onFinishCallback) {
        this._running = true;
        this._startTime = Urso.time.get();
        log(`%c action run ---> ${this.name}`, 'color: blue');

        this.emit(Urso.events.MODULES_STATES_MANAGER_ACTION_START, this.name);

        this.finished = false;
        this._onFinishCallback = onFinishCallback;
    }

    terminate() {
        if (!this._running) {
            Urso.logger.warn('ModulesStatesManagerAction: action run from terminating', this.name);
            this.run(() => { });
        }

        if (this._terminating) {
            Urso.logger.error('ModulesStatesManagerAction: action alredy terminating', this.name);
            return;
        }

        log(`%c action terminate X ${this.name}`, 'color: blue');
        this._terminating = true;
        Urso.statesManager.terminateAction(this.name);
    }

    _onFinish() {
        if (this.finished) {
            Urso.logger.error('ModulesStatesManagerAction: action alredy finished', this.name);
            return;
        }
        
        if(this._destroying) {
            log(`%c action destroyed <--- ${this.name}`, 'color: #F39986');
            return;
        }

        this._running = false;
        this._terminating = false;
        this.finished = true;
        const elapsedTime = Urso.time.get() - this._startTime;

        this.emit(Urso.events.MODULES_STATES_MANAGER_ACTION_FINISH, this.name);

        log(`%c action finish <--- ${this.name} (${elapsedTime}ms)`, 'color: blue');
        this._onFinishCallback();
    }

    destroy() {
        if(this._destroying || !this._running)
            return;
        
        this._destroying = true;
        this._onFinish();
    }
}

module.exports = ModulesStatesManagerAction;
