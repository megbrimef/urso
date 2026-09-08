import ModulesAssetsBaseModel from './../baseModel';

class ModulesAssetsModelsSound extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.SOUND;

        // FIXED: Removed dead Pixi v5 loader options — Pixi v8 Assets ignores these; actual sound loading uses custom SoundAsset LoadParser
    }
}

export default ModulesAssetsModelsSound;