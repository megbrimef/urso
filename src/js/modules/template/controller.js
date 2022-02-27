class ModulesTemplateController {
    constructor() {
        this.singleton = true;

        //set types
        Urso.types = this.getInstance('Types').list;
    };

    get() {
        return this.getInstance('Service').getTemplate();
    }

    scene(name) {
        return this.getInstance('Service').getSceneOrGroup(name, 'Scenes');
    };

    group(name) {
        return this.getInstance('Service').getSceneOrGroup(name, 'Groups');
    };

    //make template
    parse(template, additionalTemplateFlag) {
        return this.getInstance('Service').parse(template, additionalTemplateFlag);
    }

}

module.exports = ModulesTemplateController;
