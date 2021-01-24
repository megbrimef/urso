/*
buttonModel = {
    buttonFrames:{
        over: {type:'container', contents[...]},
        out: {type:'container', contents[...]},
        pressed: {type:'container', contents[...]},
        disabled: {type:'container', contents[...]}
    }
}*/

class ModulesObjectsModelsButtonComposite extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.BUTTONCOMPOSITE;
        this.action = Urso.helper.recursiveGet('action', params, () => { console.log(123321), this.emit('buttonPressed') }),
            this.buttonFrames = {
                over: Urso.helper.recursiveGet('buttonFrames.over', params, false),
                out: Urso.helper.recursiveGet('buttonFrames.out', params, false),
                pressed: Urso.helper.recursiveGet('buttonFrames.pressed', params, false),
                disabled: Urso.helper.recursiveGet('buttonFrames.disabled', params, false),
            }

        this._addBaseObject();
    }

    _addBaseObject() {

    }
}

module.exports = ModulesObjectsModelsButtonComposite;