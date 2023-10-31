const ModulesObjectsBaseModel = require('./../baseModel');

class ModulesObjectsModelsContainer extends ModulesObjectsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.CONTAINER;
        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.contents = Urso.helper.recursiveGet('contents', params, []);
    }

    _addBaseObject() {
        this._baseObject = new PIXI.Container();
    };
}

module.exports = ModulesObjectsModelsContainer