class ModulesStatesManagerActionModel {
    constructor(params) {
        this._eventsEndings = {
            events: {
                onStart: '.onStart',
                toComplete: '.completed',
            },
            terminateEvents: {
                onStart: '.onTerminate',
                toComplete: '.terminated',
            }
        }

        this.name = Urso.helper.recursiveGet('name', params, 'unnamedAction');;
        this._eventBlank = Urso.helper.recursiveGet('eventBlank', params, null);

        this.events = {
            onStart: Urso.helper.recursiveGet('events.onStart', params, null),
            toComplete: Urso.helper.recursiveGet('events.toComplete', params, null) //return boolean param
        };

        this.isTerminable = Urso.helper.recursiveGet('isTerminable', params, true);

        this.terminateEvents = {
            onStart: Urso.helper.recursiveGet('terminateEvents.onStart', params, null),
            toComplete: Urso.helper.recursiveGet('terminateEvents.toComplete', params, null) //return boolean param
        };

        //setup defaults from _eventBlank
        this._setupDefaults();
    }

    _setupDefaults() {
        if (!this._eventBlank)
            return false;

        for (let eventsType in this._eventsEndings) {
            for (let event in this._eventsEndings[eventsType]) {
                if (!this[eventsType][event]) {
                    this[eventsType][event] = this._eventBlank + this._eventsEndings[eventsType][event];
                }
            }
        }
    }

}

module.exports = ModulesStatesManagerActionModel;