class ModulesObjectsModelsCollection {
    constructor(param) {
        this._children = param || [];
        this._setProperty = this._setProperty.bind(this);
        
        this._methods = { 
            setProperty: this._setProperty, 
            addClass: this._runFunc('addClass'), 
            removeClass: this._runFunc('removeClass')
        };

        return this._makeCollection();
    }

    _makeCollection(){       
        for (const propName in this._methods)
           this._defineProp(this._children, propName, this._methods[propName]);

        return this._children;
    }

    _defineProp(obj, propName, propVal){
        Object.defineProperty(obj, propName, {
            enumerable: false,
            configurable: false,
            writable: false,
            value: propVal
        });
    }

    _checkAllHasProperty(prop) {
        return this._children.every(child => child.hasOwnProperty(prop));
    }

    _setProperty(prop, value){
        const allHasProperty = this._checkAllHasProperty(prop);

        if(allHasProperty)
            this._children.forEach(child => { child[prop] = value; });

        return allHasProperty;
    }
    
    _runFunc(funcName){
        return param => {
           this._children.forEach(child => {
               if(child[funcName])
                child[funcName](param);
           });
        };
    } 
}

module.exports = ModulesObjectsModelsCollection;
