class ModulesObjectsModelsBitmapText extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.BITMAPTEXT;
        this.text = Urso.helper.recursiveGet('text', params, false);
        this.fontName = Urso.helper.recursiveGet('fontName', params, false);
        this.fontSize = Urso.helper.recursiveGet('fontSize', params, false);

        this.maxWidth = Urso.helper.recursiveGet('maxWidth', params, false); //todo

        this._addBaseObject();
    }

    _addBaseObject() {
        this._baseObject = new PIXI.BitmapText(this.text, { fontName: this.fontName, fontSize: this.fontSize });
    };
}

module.exports = ModulesObjectsModelsBitmapText;