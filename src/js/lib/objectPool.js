class ObjectPoolMember {
    free = true;
    data = null;

    constructor(data) {
        this.data = data
    }
}

class LibObjectPool {
    pool = {};
    resetFunction = () => { }
    constructorFunction = () => { }

    constructor(constructorFunction, resetFunction = (obj) => obj, initialSize = 0) { //todo initialSize
        this.resetFunction = resetFunction;
        this.constructorFunction = constructorFunction;
    }

    getElement(key = 'default', additionalCreateArguments) {
        this._checkPoolKey(key);
        const poolArray = this.pool[key];


        for (let i = 0; i < poolArray.length; i++) {
            if (poolArray[i].free) {
                poolArray[i].free = false;
                return poolArray[i];
            }
        }

        const newObj = this._createElement(key, additionalCreateArguments);
        newObj.free = false;
        return newObj;
    }

    putElement(element) {
        element.free = true;
        this.resetFunction(element.data);
    }

    _createElement(key, additionalCreateArguments = null) {
        const newObj = this.resetFunction(this.constructorFunction(key, additionalCreateArguments));
        const poolMember = new ObjectPoolMember(newObj);
        this.pool[key].push(poolMember);
        return poolMember;
    }

    _checkPoolKey(key) {
        if (!this.pool[key])
            this.pool[key] = [];
    }
}

module.exports = LibObjectPool;