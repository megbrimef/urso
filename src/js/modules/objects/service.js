class ModulesObjectsService {
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

    add(object, parent, _ignorePool = false) {
        const { objectsToCache } = this.getInstance('Config');

        if (!_ignorePool && objectsToCache.includes(object.type))
            return this.getInstance('Pool').getElement(object, parent);

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
            // REMOVED: ATLASIMAGE — never implemented, redundant now that atlas frames are cached by name
            case Urso.types.objects.BITMAPTEXT:
                model = this.getInstance('Models.BitmapText', object);
                break;
            // REMOVED: DRAGCONTAINER — never implemented
            case Urso.types.objects.EMITTERFX:
                model = this.getInstance('Models.EmitterFx', object);
                break;
            case Urso.types.objects.HITAREA:
                model = this.getInstance('Models.HitArea', object);
                break;
            case Urso.types.objects.IMAGESANIMATION:
                model = this.getInstance('Models.ImagesAnimation', object);
                break;
            case Urso.types.objects.NINESLICEPLANE:
                model = this.getInstance('Models.NineSlicePlane', object);
                break;
            // REMOVED: TEXTINPUT — never implemented
            default: {
                // FIXED: this did `this._objectsTypesFlipped[object.type].toLowerCase()` unguarded, so an
                // unknown type threw "Cannot read properties of undefined" from deep inside scene building,
                // saying nothing about object types. That is now much easier to hit: a template still
                // referencing one of the five removed constants gets `type: undefined`, because
                // Urso.types.objects no longer defines them.
                const typeName = this._objectsTypesFlipped[object.type];

                if (!typeName) {
                    Urso.logger.error(
                        'ModulesObjectsCreate unknown object type: ' + object.type +
                        ' — not a member of Urso.types.objects. Note ATLASIMAGE, DRAGCONTAINER, EMITTER,' +
                        ' SCROLLBOX and TEXTINPUT were removed as never implemented; use IMAGE, CONTAINER' +
                        ' and EMITTERFX instead.',
                        object
                    );

                    return false;
                }

                const objectName = Urso.helper.capitaliseFirstLetter(typeName.toLowerCase());

                model = this.getInstance(`Models.${objectName}`, object);
                break;
            }
        }

        // FIXED: these two checks logged and then carried on, so an unresolvable model reached
        // `model._baseObject` and threw TypeError on `false` one line later — the error message was
        // never actually reachable. Bail out instead, matching getInstance's own false-on-miss contract.
        if (!model) {
            Urso.logger.error('ModulesObjectsCreate model type error', object.type, object);
            return false;
        }

        if (!model._baseObject) {
            Urso.logger.error('ModulesObjectsCreate baseObject error', model);
            return false;
        }

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

        if (child._baseObject) { //regular our object
            newParent.contents.push(child);
            let childBase = child._baseObject;
            newParent._baseObject.addChild(childBase);
            child.parent = newParent;

            if (!doNotRefreshStylesFlag)
                Urso.objects.refreshStyles(); //todo optimization
        } else { //pixi system object
            newParent._baseObject.addChild(child);
        }
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
        const { objectsToCache } = this.getInstance('Config');

        if (objectsToCache.includes(object.type))
            return this.getInstance('Pool').putElement(object, doNotRefreshStylesFlag);

        if (object.parent)
            this.removeChild(object.parent, object, true);

        object.proxyObject = null;
        
        //children
        if (object.contents)
            //for (const child of object.contents)
            while (object.contents.length > 0)
                this.destroy(object.contents[0], true);

        object._customDestroy();
        object._baseObject && object._baseObject.destroy({ children: true });
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

        // ADDED: register object's type in cache (converted to lowercase string)
        if (proxy.type) {
            if (!this._objectsTypesFlipped)
                this._objectsTypesFlipped = Urso.helper.objectFlip(Urso.types.objects);

            let typeName = this._objectsTypesFlipped[proxy.type];
            if (typeName) {
                this.getInstance('Cache').addType(typeName.toLowerCase(), proxy);
            }
        }
    }

    _removeFromCache(proxy) {
        if (proxy.id)
            this.getInstance('Cache').removeId(proxy.id, proxy);
        if (proxy.name)
            this.getInstance('Cache').removeName(proxy.name, proxy);
        if (proxy.class)
            this.getInstance('Cache').removeClass(proxy.class, proxy);

        // ADDED: unregister object's type from cache
        if (proxy.type) {
            if (!this._objectsTypesFlipped)
                this._objectsTypesFlipped = Urso.helper.objectFlip(Urso.types.objects);

            let typeName = this._objectsTypesFlipped[proxy.type];
            if (typeName) {
                this.getInstance('Cache').removeType(typeName.toLowerCase(), proxy);
            }
        }
    }
}

export default ModulesObjectsService;
