class ModulesObjectsModelsTextInput extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.TEXTINPUT;
        this.text = '';
        this._addBaseObject();
        this._setRestrictedSymbosl();
    }

    setupParams(params) {
        super.setupParams(params);

        this.input = Urso.helper.recursiveGet('input', params, false);
        this.box = Urso.helper.recursiveGet('box', params, false);
        this.numbersOnly = Urso.helper.recursiveGet('numbersOnly', params, false);
        this.allowedSymbols = Urso.helper.recursiveGet('allowedSymbols', params, false);
        //this.substituteText = Urso.helper.recursiveGet('substituteText', params, false);
        this.maxLength = Urso.helper.recursiveGet('maxLength', params, false);
    }

    restrictInput(allowedSymbols) {
        this._baseObject.restrict = allowedSymbols;
    }

    disable(){
        this._baseObject.disabled = true 
    }

    enable(){
        this._baseObject.disabled = false 
    }

    _setRestrictedSymbosl() {
        if (this.numbersOnly) {
            const regex = new RegExp('^[0-9]*');
            this.restrictInput(regex);
        } else if (this.allowedSymbols) {
            this.restrictInput(this.allowedSymbols);
        }
    }

    _onBlur(){
        const data = {name: this.name, class: this.class, id: this.id, text: this.text};
        this.emit(Urso.events.MODULES_OBJECTS_TEXTINPUT_BLUR, data);
    }

    _onInput() {
        this.text = this._baseObject.text;
        const data = {name: this.name, class: this.class, id: this.id, text: this.text};
        this.emit(Urso.events.MODULES_OBJECTS_TEXTINPUT_INPUT, data);
    }

    _addBaseObject() {
        this._baseObject = new PIXI.TextInput({ input: this.input, box: this.box });
        //this._baseObject.substituteText = this.substituteText;

        if(this.maxLength)
            this._baseObject.maxLength = this.maxLength

        this._baseObject.on('blur', this._onBlur.bind(this))
        this._baseObject.on('input', this._onInput.bind(this))
    };
}

module.exports = ModulesObjectsModelsTextInput;
