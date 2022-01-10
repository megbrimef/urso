class ModulesObjectsCreate {
    constructor() {
        this.singleton = true;

        this._world = null;
        this._counter = 0;
        this._objectsTypesFlipped;
    }

    _checkWorld() {
        if (this._world)
            return this._world;

        this.resetWorld();

        return this._world;
    }

    resetWorld() {
        const model = this.getInstance('Models.World', { name: 'WORLD' });
        const proxy = this.getInstance('Proxy').get(model);

        this._world = proxy;

        this.updateWorldBounds({ template: Urso.scenes.getTemplateSize() })
        this.getInstance('Cache').reset();
        this.applyClassesToWorld();
        this._addToCache(proxy);
    }

    updateWorldBounds(params) {
        if (!this._world)
            return;

        Urso.objects._safeSetValueToTarget(this._world, 'width', params.template.width);
        Urso.objects._safeSetValueToTarget(this._world, 'height', params.template.height);
    }

    applyClassesToWorld() {
        if (!this._world) {
            return; //world do not created yet
        }

        //remove old classes
        if (this._world.class) {
            this._world.class.split(' ').forEach((className) => this._world.removeClass(className, true));
        }

        //apply new classes
        Urso.getInstancesModes().forEach((className) => this._world.addClass(className, true));

        //refresh styles
        Urso.objects.refreshStyles();
    }

    _getUid() {
        this._counter++;
        return 'object_' + this._counter;
    }

    getWorld() {
        return this._world;
    }

    add(object, parent) {
        const world = this._checkWorld();

        if (!parent)
            parent = world;

        let model, contents;

        if (object.contents) {
            contents = object.contents;
            object.contents = []; //clear contents. We will put here just correct models
        }

        if (!this._objectsTypesFlipped)
            this._objectsTypesFlipped = Urso.helper.objectFlip(Urso.types.objects);

        //set uid
        object._uid = this._getUid();

        switch (object.type) {
            //exceptions with camelCase namings
            case Urso.types.objects.ATLASIMAGE:
                model = this.getInstance('Models.AtlasImage', object);
                break;
            case Urso.types.objects.BITMAPTEXT:
                model = this.getInstance('Models.BitmapText', object);
                break;
            case Urso.types.objects.HITAREA:
                model = this.getInstance('Models.HitArea', object);
                break;
            case Urso.types.objects.IMAGES_ANIMATION:
                model = this.getInstance('Models.ImagesAnimation', object);
                break;
            case Urso.types.objects.TEXTINPUT:
                model = this.getInstance('Models.TextInput', object);
                break;

            default:
                const objectName = Urso.helper.capitaliseFirstLetter(
                    this._objectsTypesFlipped[object.type].toLowerCase()
                );

                model = this.getInstance(`Models.${objectName}`, object);
                break;
        }

        if (!model)
            Urso.logger.error('ModulesObjectsCreate model type error', object.type, object);

        if (!model._baseObject)
            Urso.logger.error('ModulesObjectsCreate baseObject error', model);

        //proxing model
        let proxy = this.getInstance('Proxy').get(model);

        //link to component(if its compinent)
        if (object.type === Urso.types.objects.COMPONENT)
            object._controller.common.object = proxy;

        //add child baseObject
        this.addChild(parent, proxy, true);

        //set properties from originalModel
        this._updateCommonProperties(proxy);

        //check is mask
        if (model.type === Urso.types.objects.MASK)
            parent._baseObject.mask = model._baseObject;

        //contents
        if (contents) {
            for (const child of contents) {
                this.add(child, proxy);
            }
        }

        //cache
        this._addToCache(proxy);

        return proxy;
    }

    addChild(newParent, child, doNotRefreshStylesFlag) {
        if (child.parent) {
            this.removeChild(child.parent, child, true);
        }

        newParent.contents.push(child);
        let childBase = child._baseObject;
        newParent._baseObject.addChild(childBase);
        child.parent = newParent;

        if (!doNotRefreshStylesFlag)
            Urso.objects.refreshStyles(); //todo optimization
    }

    removeChild(parent, child, doNotRefreshStylesFlag) {
        child.parent = null;
        let childIndex = parent.contents.indexOf(child);
        parent.contents.splice(childIndex, 1);
        parent._baseObject.removeChild(child._baseObject);

        if (!doNotRefreshStylesFlag)
            Urso.objects.refreshStyles(); //todo optimization
    }

    destroy(object, doNotRefreshStylesFlag) {
        if (object.parent)
            this.removeChild(object.parent, object, true);

        //children
        if (object.contents)
            //for (const child of object.contents)
            while (object.contents.length > 0)
                this.destroy(object.contents[0], true);

        object._customDestroy();
        object._baseObject && object._baseObject.destroy();
        this._removeFromCache(object);
        this.getInstance('Styles').removeFromCache(object);

        //null all properties. example: _controller object
        if (object._controller) {
            if (object._controller.common.object) {
                object._controller.common.object = null;
            }

            object._controller = null;
            object.instance = null;
        }

        if (!doNotRefreshStylesFlag)
            Urso.objects.refreshStyles(); //todo optimization

        object.destroyed = true;
    }

    _updateCommonProperties(proxy) {
        for (let key in proxy._originalModel) {
            if (proxy._originalModel.hasOwnProperty(key)) {
                let value = proxy._originalModel[key];
                Urso.objects._safeSetValueToTarget(proxy, key, value);
            }
        }
    }

    _addToCache(proxy) {
        if (proxy.id)
            this.getInstance('Cache').addId(proxy.id, proxy);
        if (proxy.name)
            this.getInstance('Cache').addName(proxy.name, proxy);
        if (proxy.class)
            this.getInstance('Cache').addClass(proxy.class, proxy);
    }

    _removeFromCache(proxy) {
        if (proxy.id)
            this.getInstance('Cache').removeId(proxy.id, proxy);
        if (proxy.name)
            this.getInstance('Cache').removeName(proxy.name, proxy);
        if (proxy.class)
            this.getInstance('Cache').removeClass(proxy.class, proxy);
    }
}

module.exports = ModulesObjectsCreate;
