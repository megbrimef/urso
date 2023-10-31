const ModulesObjectsBaseModel = require('./../baseModel');

class ModulesObjectsModelsComponent extends ModulesObjectsBaseModel {

    constructor(params) {
        super(params);

        this.type = Urso.types.objects.COMPONENT;
        this.instance = null;

        //system
        this._controller = Urso.helper.recursiveGet('_controller', params, false);  //will setup on create.

        this._addBaseObject();
    }

    setupParams(params) {
        super.setupParams(params);

        this.componentName = Urso.helper.recursiveGet('componentName', params, false);
        this.options = Urso.helper.recursiveGet('options', params, false);
        this.contents = Urso.helper.recursiveGet('contents', params, []);
    }

    _addBaseObject() {
        this._baseObject = new PIXI.Container();

        //all components must have name
        if (!this.name)
            this.name = 'component_' + this._uid;

        this._setComonFunctions();
    };

    _setComonFunctions() {
        this.instance = this._controller;

        this._setupFind(this.instance);
    }

    _setupFind(instance) {
        instance.common.find = (selector) => Urso.find(`^${this.name} ${selector}`);
        instance.common.findOne = (selector) => Urso.findOne(`^${this.name} ${selector}`);
        instance.common.findAll = (selector) => Urso.findAll(`^${this.name} ${selector}`);
    }
}

module.exports = ModulesObjectsModelsComponent;
