Action = require('./action.js');

class ModulesStatesManagerRace extends Action {
    constructor(params) {
        super();

        this.name = 'Race';
        this._actions = [];
        this.params = params;

        for (let config of params) {
            this._actions.push(this.getInstance('Helper').getActionByConfig(config));
        }

        this._actionSuccessHandler = this._actionSuccessHandler.bind(this);
    }

    //can we start this action?
    guard() {
        for (let action of this._actions)
            if (action.guard())
                return true;

        return false;
    }

    run(onFinishCallback) {
        log(`%c action run ---> ${this.name}`, 'color: orange', this.params);

        this.finished = false;
        this._startTime = Urso.time.get();
        this._onFinishCallback = onFinishCallback;

        for (let action of this._actions)
            if (action.guard())
                action.run(this._actionSuccessHandler);
            else
                action.finished = true;
    }

    _actionSuccessHandler() {
        if (!this._checkFinish())
            this.terminate();
    }

    _checkFinish() {
        for (let action of this._actions)
            if (!action.finished)
                return false;

        this._onFinish();

        return true;
    }

    terminate() {
        if (this._terminating)
            return;

        log(`%c action terminate X ${this.name}`, 'color: orange');

        this._terminating = true;

        for (let action of this._actions)
            if (!action.finished)
                action.terminate();
    }

    _onFinish() {
        this.finished = true;
        const elapsedTime = Urso.time.get() - this._startTime;
        log(`%c action finish <--- ${this.name}  (${elapsedTime}ms)`, 'color: orange');
        !this._destroying && this._onFinishCallback();
    }

    // Interrupts currently active actions on states manager stop
    forceDestroy() {
        this._destroying = true;

        for (let action of this._actions)
            if (!action.finished)
                action.forceDestroy();

        this._onFinish();
    }
}

module.exports = ModulesStatesManagerRace;
