class ModulesObjectsModelsGroup extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.GROUP;
        this.groupName = Urso.helper.recursiveGet('groupName', params, false);
        this._addBaseObject();
    }

    _addBaseObject() {
        this._baseObject = new PIXI.Container();
    };
}

module.exports = ModulesObjectsModelsGroup;