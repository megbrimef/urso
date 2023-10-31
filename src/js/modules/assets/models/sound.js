const ModulesAssetsBaseModel = require('./../baseModel');

class ModulesAssetsModelsSound extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.SOUND;

        // TODO: CHANGE TO CONSTANTS!
        this.params = {
            loadType: 1,
            xhrType: 'blob'
        };
    }
}

module.exports = ModulesAssetsModelsSound;