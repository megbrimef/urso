import ModulesAssetsBaseModel from './../baseModel';

class ModulesAssetsModelsAtlas extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.ATLAS;
    }

    // cacheTextures: if true, each frame parsed out of this atlas is registered in the Urso texture
    // cache under its own key.
    // CORRECTED: this comment used to claim a frame at 'atlasPath/image/image_01.png' is cached as
    // 'image_01'. It is not — the key is the frame name with a known image extension stripped and
    // nothing else, so that frame is cached as 'atlasPath/image/image_01'. There is no directory
    // stripping and no folder prefixing; the addFolderPathInAtlasTextureKey option that once
    // implied otherwise never worked and has been removed.
    // Two atlases sharing a frame basename therefore still collide, last write winning — LibCache
    // reports that with an error naming the frame and both atlases.
    setupParams(params) {
        super.setupParams(params);

        this.cacheTextures = Urso.helper.recursiveGet('cacheTextures', params, false);
    }
}

export default ModulesAssetsModelsAtlas;