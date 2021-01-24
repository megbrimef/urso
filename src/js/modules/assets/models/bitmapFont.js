class ModulesAssetsModelsBitmapFont extends Urso.Core.Modules.Assets.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.BITMAPFONT;
        //TODO check key from tpl, not from xml
    }
}

module.exports = ModulesAssetsModelsBitmapFont;