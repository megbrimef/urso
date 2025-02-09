const ModulesObjectsBaseModel = require('./../baseModel');

class ModulesObjectsModelsBitmapText extends ModulesObjectsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.BITMAPTEXT;
        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.text = Urso.helper.recursiveGet('text', params, false);
        this.localeId = Urso.helper.recursiveGet('localeId', params, false); //you can use this instead text for localization

        this.localeVariables = Urso.helper.recursiveGet('localeVariables', params, {}); //optional variables for localization by localeId

        this.fontName = Urso.helper.recursiveGet('fontName', params, false);
        this.fontSize = Urso.helper.recursiveGet('fontSize', params, false);
        this.letterSpacing = Urso.helper.recursiveGet('letterSpacing', params, 0);
    }

    _addBaseObject() {
        if (this.localeId)
            this._originalModel.text = this.text = Urso.i18n.get(this.localeId, this.localeVariables);

        this._baseObject = new PIXI.BitmapText(this.text, { fontName: this.fontName, fontSize: this.fontSize });
    };

    _newLocaleHandler() {
        if(!this.proxyObject)
            return;

        this.proxyObject.text = Urso.i18n.get(this.localeId, this.localeVariables);
    }

    _customDestroy() {
        if (this.localeId)
            this.removeListener(Urso.events.MODULES_I18N_NEW_LOCALE_WAS_SET, this._newLocaleHandler.bind(this));
    }

    _subscribeOnce() {
        if (this.localeId)
            this.addListener(Urso.events.MODULES_I18N_NEW_LOCALE_WAS_SET, this._newLocaleHandler.bind(this));
    }
}

module.exports = ModulesObjectsModelsBitmapText;