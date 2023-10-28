const ModulesObjectsBaseModel = require('./../baseModel');

class ModulesObjectsModelsGroup extends ModulesObjectsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.GROUP;
        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.groupName = Urso.helper.recursiveGet('groupName', params, false);
    }

    _addBaseObject() {
        this._baseObject = new PIXI.Container();
    };
}

module.exports = ModulesObjectsModelsGroup;