class ModulesObjectsPool {

    _objectsCache = {};
    _objectsCounter = 0;

    constructor() {
        this.singleton = true;

        this._objectsPool = new Urso.Game.Lib.ObjectPool(
            this._constructorFunction.bind(this),
            this._resetFunction.bind(this)
        );
    };

    getElement(object, parent) {
        const poolElement = this._objectsPool.getElement(object.assetKey, { object, parent });
        this._objectsCounter++;
        this._objectsCache[this._objectsCounter] = poolElement;


        const newObject = poolElement.data;
        newObject._poolCacheId = this._objectsCounter;

        if (typeof object.x === 'number') newObject.x = object.x; else newObject.x = 0;
        if (typeof object.y === 'number') newObject.y = object.y; else newObject.y = 0;
        if (typeof object.angle === 'number') newObject.angle = object.angle; else newObject.angle = 0;
        if (typeof object.anchorX === 'number') newObject.anchorX = object.anchorX; else newObject.anchorX = 0;
        if (typeof object.anchorY === 'number') newObject.anchorY = object.anchorY; else newObject.anchorY = 0;
        if (typeof object.visible === 'boolean') newObject.visible = object.visible; else newObject.visible = true;

        if (object?.type === Urso.types.objects.SPINE)
            newObject.setAnimationConfig(object.animation); //setup oncomplete

        this.getInstance('Service').addChild(parent, newObject, true);
        return newObject;
    }

    putElement(object, doNotRefreshStylesFlag) {
        if (object._poolCacheId) {
            this._objectsPool.putElement(this._objectsCache[object._poolCacheId]);
            delete this._objectsCache[object._poolCacheId];
            return;
        }

        console.error('ModulesObjectsPool something goes wrong: object must be in pool');
    }

    _constructorFunction(_, { object, parent }) {
        return this.getInstance('Service').add(object, parent, true);
    }

    _resetFunction(object) {
        if (object.parent)
            this.getInstance('Service').removeChild(object.parent, object, true);

        if (object?.type === Urso.types.objects.SPINE) {
            object.setToSetupPose();
            object.stop();
            object.clearListeners();
            object._baseObject.lastTime = null;
        }

        return object;
    }

}

module.exports = ModulesObjectsPool;
