class ModulesAssetsModelsDragonBones extends Urso.Core.Modules.Assets.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.DRAGONBONES;

        //for manual filenames setup
        this.contents = Urso.helper.recursiveGet('contents', params, [
            { type: Urso.types.assets.JSON, key: `${this.key}_skeletonJson`, path: this.skeletonJson },
            { type: Urso.types.assets.JSON, key: `${this.key}_textureJson`, path: this.textureJson },
            { type: Urso.types.assets.IMAGE, key: `${this.key}_textureImage`, path: this.textureImage }
        ]);

        this.path = false;
        this.key = false;
    }

    setupParams(params) {
        super.setupParams(params);

        this.skeletonJson = Urso.helper.recursiveGet('skeletonJson', params, false);
        this.textureJson = Urso.helper.recursiveGet('textureJson', params, false);
        this.textureImage = Urso.helper.recursiveGet('textureImage', params, false);
    }
}

module.exports = ModulesAssetsModelsDragonBones;