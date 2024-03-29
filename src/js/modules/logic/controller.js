class ModulesLogicController {
    constructor() {
        this._baseLogicBlocks = ['main', 'sounds'];
        const additionalLogicBlocks = this.getAdditionalLogicBlocks();
        this.logicBlocks = [...this._baseLogicBlocks, ...additionalLogicBlocks];

        this._instances = {};
        this._init();
    };

    _init() {
        this._createLogicInstances();
    };

    getAdditionalLogicBlocks() {
        return [];
    };

    _createLogicInstances() {
        //console.log('[Modules.Brain.Controller]', ' Creating logic blocks:', JSON.stringify(this.logicBlocks));

        for (let i = 0; i < this.logicBlocks.length; i++) {
            const blockName = this.logicBlocks[i];
            const blockNameNormalized = Urso.helper.capitaliseFirstLetter(blockName);
            this._instances[blockName] = this.getInstance(blockNameNormalized);
        }
    };

    /**
     * launch function with current name (first agrument) per each logic block (if exists)
     * @returns {Mixed}
     */
    do() {
        const results = [];
        const params = [...arguments];
        const functionName = params.shift();

        for (let blockName in this._instances) {
            const instance = this._instances[blockName];

            if (instance && instance[functionName]) {
                results[blockName] = instance[functionName].apply(this, params);
            }
        }

        return results;
    };

    _subscribe() { };
}

module.exports = ModulesLogicController;
