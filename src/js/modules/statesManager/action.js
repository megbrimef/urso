class ModulesStatesManagerAction {

    constructor(name) {
        this.name = name;

        this._running = false;
        this._terminating = false;
        this.finished = false;
        this._onFinishCallback = false;

        this._onFinish = this._onFinish.bind(this);
    }

    //can we start this action?
    guard() {
        return !this._running && this.getInstance('Controller').checkActionGuard(this.name);
    }

    run(onFinishCallback) {
        this._running = true;
        log(`%c action run ---> ${this.name}`, 'color: blue');

        this.emit(Urso.events.MODULES_STATES_MANAGER_ACTION_START, this.name);

        this.finished = false;
        this._onFinishCallback = onFinishCallback;

        Urso.statesManager.runAction(this.name, this._onFinish);

        //TODO remove temp for debug
        //let timeout = Math.floor(Math.random() * 2000);
        //Urso.statesManager.runAction(this.name, () => setTimeout(() => { this._onFinish(); }, timeout));
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

        this._running = false;
        this._terminating = false;
        this.finished = true;

        this.emit(Urso.events.MODULES_STATES_MANAGER_ACTION_FINISH, this.name);

        log(`%c action finish <--- ${this.name}`, 'color: blue');
        this._onFinishCallback();
    }
}

module.exports = ModulesStatesManagerAction;
