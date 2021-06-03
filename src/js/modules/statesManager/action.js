class ModulesStatesManagerAction {

    /*{
        name: 'showWinPopup',
        events: {
            onStart: 'action.showWinPopup.start',
            toComplete: 'winPopup.display.finished'
        },
        isTerminable: true,
        terminateEvents:{
            onStart: 'action.showWinPopup.terminate',
            toComplete: 'winPopup.display.terminated'
        }
    }*/


    constructor(params) {
        this._terminating = false;
        this.finished = false;
        this._onFinishCallback = false;

        let options = (typeof params === 'string') ? { name: params } : params;

        if (options) {
            this.options = options;
            this.name = options.name;
        }

        this._onComplete = this._onComplete.bind(this);
        this._onTerminate = this._onTerminate.bind(this);
    }

    //can we start this action?
    guard() {
        if (this.options._eventBlank)
            return this.getInstance('Controller').checkGuard(this.options._eventBlank);
        else
            return true;
    }

    //can action be terminated ?
    isTerminable() {
        if (this.options)
            return this.options.isTerminable;

        return true;
    }

    run(onFinishCallback) {
        log(`%c action run ---> ${this.name}`, 'color: blue', this.options);

        this.finished = false;
        this._onFinishCallback = onFinishCallback;
        this._addListeners();

        if (this.options && Urso.helper.recursiveGet('options.events.onStart', this, false))
            this.emit(this.options.events.onStart);

        //TODO remove temp for debug
        // let timeout = Math.floor(Math.random() * 2000);
        // setTimeout(() => { this._onFinish(); }, timeout);
    }

    terminate() {
        if (!this.isTerminable() || this._terminating)
            return;

        log(`%c action terminate X ${this.name}`, 'color: blue');

        this._terminating = true;

        if (this.options && Urso.helper.recursiveGet('options.terminateEvents.onStart', this, false))
            this.emit(this.options.terminateEvents.onStart);
    }

    _onFinish() {
        if (this.finished)
            return;

        this._removeListeners();
        this.finished = true;
        log(`%c action finish <--- ${this.name}`, 'color: blue');
        this._onFinishCallback();
    }

    _onComplete() {
        this._onFinish();
    }

    _onTerminate() {
        this._terminating = false;
        this._onFinish();
    }

    _addListeners() {
        if (this.options && Urso.helper.recursiveGet('options.events.toComplete', this, false))
            this.addListener(this.options.events.toComplete, this._onComplete, true);

        if (this.options && Urso.helper.recursiveGet('options.terminateEvents.toComplete', this, false))
            this.addListener(this.options.terminateEvents.toComplete, this._onTerminate, true);
    }

    _removeListeners() {
        if (this.options && Urso.helper.recursiveGet('options.events.toComplete', this, false))
            this.removeListener(this.options.events.toComplete, this._onComplete, true);

        if (this.options && Urso.helper.recursiveGet('options.terminateEvents.toComplete', this, false))
            this.removeListener(this.options.terminateEvents.toComplete, this._onTerminate, true);
    }

}

module.exports = ModulesStatesManagerAction;
