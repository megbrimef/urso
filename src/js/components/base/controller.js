class ComponentsBaseController {

    constructor(options) {
        this._templateName = 'Template';
        this._inputValidation(options);

        this.common = {
            find: null, //find functions inside component object in scene
            findAll: null,
            findOne: null,
            object: null //link to component object in scene
        };

        this.options = options;
    }

    /**
     * function for the component input params validation
     * must return as a result input structure
     * @returns {object}
     * @example 
     * return {
     *     param1Name: 'number',
     *     param2Name: 'string'
     * }
     */
    _requiredOptionsModel() {
        //
    }

    _inputValidation(options) {
        //input options validation
        let optionsModel = this._requiredOptionsModel();

        if (optionsModel)
            for (let optionKey in optionsModel) {
                if (!options || typeof options[optionKey] !== optionsModel[optionKey])
                    Urso.logger.error('Component params model error', this);
            }
    }

    loadUpdate() {
        //todo
    }

    assetsMount() {
        let template = this.getInstance(this._templateName);
        return { styles: template.styles, assets: template.assets };
    }

    objectsMount() {
        let template = this.getInstance(this._templateName);
        return template.objects;
    }

    create() {
        //main template was created, we can start access to our objects
    }

    /**
     * @param {Number} deltaTime - time from last update call
     */
    update(deltaTime) {
        //TODO
        //calls every browser cycle
    }

    _subscribeOnce() {
        //will contains only this.addListener
    }

    destroy() {
        //component will destroy after this function call
    }

}

module.exports = ComponentsBaseController;
