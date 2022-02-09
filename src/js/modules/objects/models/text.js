class ModulesObjectsModelsText extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.TEXT;
        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.text = Urso.helper.recursiveGet('text', params, false);
        this.localeId = Urso.helper.recursiveGet('localeId', params, false); //you can use this insted text for localization

        this.lineHeight = Urso.helper.recursiveGet('lineHeight', params, 0);
        this.fontFamily = Urso.helper.recursiveGet('fontFamily', params, 'Arial');
        this.fontSize = Urso.helper.recursiveGet('fontSize', params, false);
        this.fontStyle = Urso.helper.recursiveGet('fontStyle', params, false); //'italic'
        this.fontWeight = Urso.helper.recursiveGet('fontWeight', params, false); // 'bold'
        this.fill = Urso.helper.recursiveGet('fill', params, '#000000'); // gradient  ['#ffffff', '#00ff99']
        this.stroke = Urso.helper.recursiveGet('stroke', params, 'black');
        this.strokeThickness = Urso.helper.recursiveGet('strokeThickness', params, 0);
        this.dropShadow = Urso.helper.recursiveGet('dropShadow', params, false);
        this.dropShadowColor = Urso.helper.recursiveGet('dropShadowColor', params, '#000000');
        this.dropShadowBlur = Urso.helper.recursiveGet('dropShadowBlur', params, 0);
        this.dropShadowAngle = Urso.helper.recursiveGet('dropShadowAngle', params, 0); //Math.PI / 6
        this.dropShadowDistance = Urso.helper.recursiveGet('dropShadowBlur', params, 0); // 6
        this.wordWrap = Urso.helper.recursiveGet('wordWrap', params, false);
        this.wordWrapWidth = Urso.helper.recursiveGet('wordWrapWidth', params, 100)

        this.maxWidth = Urso.helper.recursiveGet('maxWidth', params, false); //todo
    }

    _addBaseObject() {
        if (this.localeId)
            this._originalModel.text = this.text = Urso.i18n.get(this.localeId);

        this._baseObject = new PIXI.Text(this.text);
    };

    _newLocaleHandler() {
        this.text = this._baseObject.text = Urso.i18n.get(this.localeId);
    }

    _subscribeOnce() {
        if (this.localeId)
            this.addListener(Urso.events.MODULES_I18N_NEW_LOCALE_WAS_SET, this._newLocaleHandler.bind(this));
    }
}

module.exports = ModulesObjectsModelsText;
