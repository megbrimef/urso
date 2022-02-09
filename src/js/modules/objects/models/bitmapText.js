class ModulesObjectsModelsBitmapText extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.BITMAPTEXT;
        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.text = Urso.helper.recursiveGet('text', params, false);
        this.localeId = Urso.helper.recursiveGet('localeId', params, false); //you can use this insted text for localization

        this.fontName = Urso.helper.recursiveGet('fontName', params, false);
        this.fontSize = Urso.helper.recursiveGet('fontSize', params, false);

        this.maxWidth = Urso.helper.recursiveGet('maxWidth', params, false); //todo
    }

    _addBaseObject() {
        if (this.localeId)
            this._originalModel.text = this.text = Urso.i18n.get(this.localeId);

        this._baseObject = new PIXI.BitmapText(this.text, { fontName: this.fontName, fontSize: this.fontSize });
    };

    _newLocaleHandler() {
        this.text = this._baseObject.text = Urso.i18n.get(this.localeId);
    }

    _subscribeOnce() {
        if (this.localeId)
            this.addListener(Urso.events.MODULES_I18N_NEW_LOCALE_WAS_SET, this._newLocaleHandler.bind(this));
    }
}

module.exports = ModulesObjectsModelsBitmapText;