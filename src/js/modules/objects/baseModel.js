class ModulesObjectsBaseModel {
    constructor(params) {
        this.type = Urso.helper.recursiveGet('type', params, null);

        this.id = Urso.helper.recursiveGet('id', params, false);
        this.name = Urso.helper.recursiveGet('name', params, false);
        this.class = Urso.helper.recursiveGet('class', params, false);

        this.x = Urso.helper.recursiveGet('x', params, 0); //number or persents (40%)
        this.y = Urso.helper.recursiveGet('y', params, 0); //number or persents (40%)
        this.z = Urso.helper.recursiveGet('z', params, 0); //number
        this.anchorX = Urso.helper.recursiveGet('anchorX', params, 0);
        this.anchorY = Urso.helper.recursiveGet('anchorY', params, 0);
        this.scaleX = Urso.helper.recursiveGet('scaleX', params, 1);
        this.scaleY = Urso.helper.recursiveGet('scaleY', params, 1);
        this.alignX = Urso.helper.recursiveGet('alignX', params, 'left'); //or right or center
        this.alignY = Urso.helper.recursiveGet('alignY', params, 'top'); //or bottom or center
        this.width = Urso.helper.recursiveGet('width', params, false); //or 40% or 1456  // highest priority then scale
        this.height = Urso.helper.recursiveGet('height', params, false); //or 40% or 568  // highest priority then scale
        this.stretchingType = Urso.helper.recursiveGet('stretchingType', params, false);  //or inscribed or circumscribed //works only if width=height=100%
        this.angle = Urso.helper.recursiveGet('angle', params, 0);
        this.visible = Urso.helper.recursiveGet('visible', params, true);
        this.alpha = Urso.helper.recursiveGet('alpha', params, 1);
        this.append = Urso.helper.recursiveGet('append', params, true); //if false - object will not created
        this.custom = Urso.helper.recursiveGet('custom', params, {}); //custom params
        this.parent = false;
        this.destroyed = false;

        //system
        this._originalModel = params;
        this._classes = [];
        this._styles = {};
        this._baseObject = null; //link to pixi object
        this._uid = Urso.helper.recursiveGet('_uid', params, false); //will setup on create
        this._templatePath = false;
    }

    getAbsoluteSize() {
        return { width: this._baseObject.width, height: this._baseObject.height };
    }

    destroy() {
        Urso.objects.destroy(this);
    }

    addChild(childObject, doNotRefreshStylesFlag) {
        Urso.objects.addChild(this, childObject, doNotRefreshStylesFlag);
    }

    removeChild(childObject, doNotRefreshStylesFlag) {
        Urso.objects.removeChild(this, childObject, doNotRefreshStylesFlag);
    }

    setId(id, doNotRefreshStylesFlag) {
        if (this.id)
            Urso.objects.removeIdFromCache(this.id, this);

        Urso.objects._safeSetValueToTarget(this, 'id', id);

        if (id)
            Urso.objects.addIdToCache(id, this);

        if (!doNotRefreshStylesFlag)
            Urso.objects.refreshStyles();

        return this;
    }

    setName(name, doNotRefreshStylesFlag) {
        if (this.name)
            Urso.objects.removeNameFromCache(this.name, this);

        Urso.objects._safeSetValueToTarget(this, 'name', name);

        if (name)
            Urso.objects.addNameToCache(name, this);

        if (!doNotRefreshStylesFlag)
            Urso.objects.refreshStyles();

        return this;
    }

    addClass(className, doNotRefreshStylesFlag) {
        let currentClass = this.class;

        if (!currentClass)
            this.class = className;
        else {
            if (currentClass.split(' ').includes(className))
                return this;

            Urso.objects._safeSetValueToTarget(this, 'class', this.class + ' ' + className);
        }

        Urso.objects.addClassToCache(className, this);

        if (!doNotRefreshStylesFlag)
            Urso.objects.refreshByChangedClassName(className);

        return this;
    };

    removeClass(className, doNotRefreshStylesFlag) {
        if (!this.class)
            return this;

        let classArray = this.class.split(' ');
        let classIndex = classArray.indexOf(className);

        if (classIndex === -1)
            return this;

        classArray.splice(classIndex, 1);
        Urso.objects._safeSetValueToTarget(this, 'class', classArray.join(' '));
        Urso.objects.removeClassFromCache(className, this);

        if (!doNotRefreshStylesFlag)
            Urso.objects.refreshByChangedClassName(className);

        return this;
    };
}

module.exports = ModulesObjectsBaseModel;
