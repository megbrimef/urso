class ModulesAssetsModelsAtlas extends Urso.Core.Modules.Assets.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.ATLAS;
    }
  
    // cacheTextures: if true - add atlas parced textures in Urso textures cache with it's file name as asset key. 
    // Example - atlas texture with path 'atlasPath/image/image_01.png' will be saved in cache with a key 'image_01'.
    setupParams(params) {
        super.setupParams(params);
 
        this.cacheTextures = Urso.helper.recursiveGet('cacheTextures', params, false);
    }
}

module.exports = ModulesAssetsModelsAtlas;