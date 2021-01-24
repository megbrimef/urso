class ModulesStatesManagerHelper {
    constructor() {
        this.singleton = true;
    }

    getActionByConfig(config) {
        let actionType = Object.keys(config)[0];
        let actionParams = config[actionType];
        let configActions = this.getInstance('ConfigActions').get();

        if (actionType === "action") {
            //actionParams is action name
            let actionName = actionParams;

            if (configActions[actionName]) {
                let actionParamsConfig = Urso.helper.objectClone(configActions[actionName]);

                if (!actionParamsConfig.name)
                    actionParamsConfig.name = actionName;

                actionParams = this.getInstance('ActionModel', actionParamsConfig); //replace params to action model
            }
        }

        let className = Urso.helper.capitaliseFirstLetter(actionType);
        return this.getInstance(className, actionParams);
    };

}

module.exports = ModulesStatesManagerHelper;
