const Race = require('./race.js');

class ModulesStatesManagerAll extends Race {
    constructor(params) {
        super(params);
        this.name = 'All';
    }

    //can we start this action?
    guard() {
        for (let action of this._actions)
            if (action.guard())
                return true;

        return false;
    }

    _actionSuccessHandler() {
        this._checkFinish();
    }
}

module.exports = ModulesStatesManagerAll;
