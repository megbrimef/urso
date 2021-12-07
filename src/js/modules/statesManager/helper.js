class ModulesStatesManagerHelper {
    constructor() {
        this.singleton = true;
    }

    getActionByConfig(config) {
        let actionType = Object.keys(config)[0];
        let actionParams = config[actionType];

        if (actionType === "action") {
            //actionParams is action name
            let actionName = actionParams;

            let customActionInstance = this.getInstance('Actions.' + Urso.helper.capitaliseFirstLetter(actionName));

            if (customActionInstance) {
                return customActionInstance;
            }
        }

        let className = Urso.helper.capitaliseFirstLetter(actionType);
        return this.getInstance(className, actionParams);
    };

}

module.exports = ModulesStatesManagerHelper;
