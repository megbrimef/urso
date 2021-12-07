class ModulesTemplateService {
    constructor() {
        this.singleton = true;

        this._currentTemplate = this.getInstance('Model');
    };

    getTemplate() {
        return this._currentTemplate;
    }

    getSceneOrGroup(name, namespace) {
        let nameCapitalise = Urso.helper.capitaliseFirstLetter(name);
        let path = `Templates.${namespace}.${nameCapitalise}`;
        let entity = Urso.getInstance(path);
        this._setTemplatePath(entity, path);
        return entity;
    }

    parse(template) {
        this._currentTemplate = Urso.helper.mergeObjectsRecursive(this.getInstance('Model'), template);

        this._parseAssets(this._currentTemplate.assets, template._templatePath);
        this._parseObjects(this._currentTemplate.objects, template._templatePath);

        return this._currentTemplate;
    }

    _setTemplatePath(target, templatePath) {
        target._templatePath = templatePath;
    }

    _parseAssets(assets, templatePath) {
        for (let asset of assets) {
            this._setTemplatePath(asset, templatePath);
        }
    }

    //parseForComponentsAndGroups
    _parseObjects(objects, templatePath) {
        for (let obj of objects) {
            this._setTemplatePath(obj, templatePath);

            if (obj.contents)
                this._parseObjects(obj.contents, templatePath);

            if (obj.type === Urso.types.objects.GROUP)
                this._processGroup(obj);

            if (obj.type === Urso.types.objects.COMPONENT)
                this._processComponent(obj);
        }
    }

    _processGroup(obj) {
        let groupTemplate = this.getInstance('Controller').group(obj.groupName);

        if (!groupTemplate)
            Urso.logger.error('ModulesTemplateController group Template error ' + obj.groupName);

        if (groupTemplate.assets)
            this._parseAssets(groupTemplate.assets, groupTemplate._templatePath);

        if (groupTemplate.objects)
            this._parseObjects(groupTemplate.objects, groupTemplate._templatePath);

        this._mergeStylesAndAssets({ styles: groupTemplate.styles, assets: groupTemplate.assets })

        //objects
        obj.contents = groupTemplate.objects;
    }

    _processComponent(obj) {
        let path = 'Components.' + Urso.helper.capitaliseFirstLetter(obj.componentName) + '.Controller';
        let componentInstance = Urso.getInstance(path, obj.options);

        if (!componentInstance) {
            Urso.logger.error(`ModulesTemplateController Component error. Component ${obj.componentName} not found. Please check components _info.js file.`);
            Urso.logger.error(`To use only templates use Groups please.`);
        }

        let data = componentInstance.assetsMount();

        if (data.assets)
            this._parseAssets(data.assets, path);

        this._mergeStylesAndAssets(data);

        //objects
        let componentsObjects = componentInstance.objectsMount();

        if (componentsObjects)
            this._parseObjects(componentsObjects, path);

        obj.contents = obj.contents ? Urso.helper.mergeArrays(obj.contents, componentsObjects) : (componentsObjects || []);

        //instance to object
        obj._controller = componentInstance;

        //object to instance
        componentInstance.object = obj;

        this._currentTemplate.components.push(componentInstance);
    }

    _mergeStylesAndAssets(data) {
        //styles
        if (data.styles)
            this._currentTemplate.styles = Urso.helper.mergeObjectsRecursive(
                this._currentTemplate.styles,
                data.styles,
                true
            );

        //assets
        if (data.assets)
            this._currentTemplate.assets = Urso.helper.mergeArrays(
                this._currentTemplate.assets,
                data.assets
            );
    }

}

module.exports = ModulesTemplateService;
