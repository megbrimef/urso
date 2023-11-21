All = require('./all.js');

class ModulesStatesManagerSequence extends All {
    constructor(params) {
        super(params);
        this.name = 'Sequence';
    }

    run(onFinishCallback) {
        log(`%c action run ---> ${this.name}`, 'color: orange', this.params);

        this.finished = false;
        this._startTime = Urso.time.get();
        this._onFinishCallback = onFinishCallback;

        this._checkFinish();
    }

    _checkFinish() {
        if (!this._terminating)
            for (let action of this._actions)
                if (!action.finished) {
                    if (action.guard())
                        return action.run(this._actionSuccessHandler);
                    else
                        action.finished = true;
                }

        this._onFinish();

        return true;
    }

    terminate() {
        if (this._terminating || this._forceDestroying)
            return;

        log(`%c action terminate X ${this.name}`, 'color: orange');

        this._terminating = true;

        for (let action of this._actions)
            if (!action.finished)
                return action.terminate(); //only one action is currently running
    }
}

module.exports = ModulesStatesManagerSequence;
