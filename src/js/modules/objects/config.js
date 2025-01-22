class ModulesObjectsConfig {

    constructor() {
        this.singleton = true;
        this.objectsToCache = []; //arrow of types. as example [Urso.types.objects.IMAGE, Urso.types.objects.SPINE]
    };

}

module.exports = ModulesObjectsConfig;