ComponentsBaseController = require('./../base/controller.js');

class ComponentsStateDrivenController extends ComponentsBaseController {
//TODO subscribe to N actions
    constructor(options) {
        super(options);
        //todo set guard
        this.eventBlank = 'components.example';

        this._finished = this._finished.bind(this);
        this._terminated = this._terminated.bind(this);
    }

    _setGuard() {
        Urso.statesManager.setGuard(this.eventBlank, this._guard.bind(this));
    }

    _subscribeOnce() {
        this._setGuard();
        this.addListener(`${this.eventBlank}.onStart`, this._start.bind(this));
        this.addListener(`${this.eventBlank}.onTerminate`, this._terminate.bind(this));
    }

    _guard() {
        return true; //or rewrite
    }

    _start() {
        Urso.logger.warn('ComponentsStateDrivenController warning: rewrite _start to make your logic', this);
        this._finished();
    }

    _finished() {
        this.emit(`${this.eventBlank}.completed`);
    }

    _terminate() {
        Urso.logger.warn('ComponentsStateDrivenController warning: rewrite _terminate to make your logic', this);
        this._terminated();
    }

    _terminated() {
        this.emit(`${this.eventBlank}.terminated`);
    }

    destroy() {
        Urso.statesManager.removeGuard(key, guard)
    }

}

module.exports = ComponentsStateDrivenController;
