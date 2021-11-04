class ModulesLogicButtons {
    constructor() {
        this.DEFAULT_STATE_NAME = 'default'; //MOVE TO CFG
        this._buttonsFactors = {};
        this._cfg = null;

        this._updateCfg();

        if (!this._cfg || Urso.helper.arraysGetUniqElements(Object.keys(this._cfg.eventsCfg), Object.keys(this._cfg.buttonStates)).length > 0)
            console.error('Modules.Logic.Buttons error: invalid Modules.Logic.Config.Buttons');
    }

    _updateCfg() {
        this._cfg = this.getInstance('Config.Buttons');
    };

    _getButtonState(button, state) {
        const buttonStates = this._cfg.buttonStates;

        if (!buttonStates[button] || !buttonStates[button][state])
            return false;

        let states = buttonStates[button],
            base = false,
            k,
            res = {};

        if (state !== 'default') {
            if (typeof states[state].base !== 'undefined')
                base = states[state].base;
            else
                base = 'default';
        }

        if (base)
            res = Urso.helper.objectClone(states[base]);

        for (k in states[state])
            res[k] = states[state][k];

        return res;
    };

    _eventHandler(button, event) {
        //todo _eventHandler?
        this._addEventsMode(button, event);
    };

    _addEventsMode(button, event) {
        if (!this._buttonsFactors[button])
            this._buttonsFactors[button] = {};

        //check removeEvents
        if (event.removeEvents && event.removeEvents.length > 0) {
            let i;

            for (i = 0; i < event.removeEvents.length; i++)
                if (this._buttonsFactors[button][event.removeEvents[i]])
                    delete this._buttonsFactors[button][event.removeEvents[i]];
        }

        //if state -> write
        if (event.state && !this._buttonsFactors[button][event.id])
            this._buttonsFactors[button][event.id] = event;

        //calc current state
        let cur = false;

        if (Object.keys(this._buttonsFactors[button]).length > 0)
            cur = Object.values(this._buttonsFactors[button]).reduce(function (prev, current) {
                return (prev.priority > current.priority) ? prev : current;
            });

        const state = this._getButtonState(button, (cur && cur.state) || this.DEFAULT_STATE_NAME);
        this._changeButtonState(button, state);
    };

    beforeUpdateHandler() { };
    afterUpdateHandler() { };

    _changeButtonState(button, params) {
        console.log(100, button, params)
        params.disableFrame = params.frames.disableFrame;

        const buttonsData = {};
        buttonsData[button] = params;

        this.beforeUpdateHandler(params);
        this.emit('buttons.changeData', buttonsData);
        this.emit('button.setFrames', buttonsData);
        this.afterUpdateHandler(params);
    };

    _subscribeButtonToEvents(buttonKey, buttonSubscribeCfg) {
        for (let i = 0; i < buttonSubscribeCfg.length; i++) {
            const { event } = buttonSubscribeCfg[i];
            this.addListener(event, () => this._eventHandler(buttonKey, buttonSubscribeCfg[i]), true);
        }
    };

    _subscribeButtonsToEvents() {
        for (let k in this._cfg.eventsCfg) {
            this._subscribeButtonToEvents(k, this._cfg.eventsCfg[k])
        }
    };

    _pressHandler(btn = {}) {
        const state = this._getButtonState(btn.name, this.DEFAULT_STATE_NAME);

        if (state && state.callback)
            state.callback();
    };

    _subscribe() {
        this._subscribeButtonsToEvents();
        this.addListener(Urso.events.MODULES_OBJECTS_BUTTON_PRESS, this._pressHandler.bind(this), true);
    };
};

module.exports = ModulesLogicButtons;
