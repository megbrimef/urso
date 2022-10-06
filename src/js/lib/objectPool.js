class ObjectPoolMember {

    free = true;
    putTime = 0;
    key = null; //element branch;
    branchKey = 0; //element branch key
    data = null;

    constructor(data, key, branchKey) {
        this.data = data;
        this.key = key;
        this.branchKey = branchKey;
    }
}


/**
 * @param {Function} constructorFunction - function to constract element
 * @param {Function} constructorFunction - function to reset element when put back to pool
 * @param {Number} [initialSize] - initial pool size. Use only if you not using keys when constract
 * @param {Number} [maxSize] - max pool size. Old elements will be removed from pool
 */
class LibObjectPool {

    _pool = {};
    resetFunction = () => { };
    constructorFunction = () => { };
    _maxSize = 0;

    _lastBranchKeys = {};

    constructor(constructorFunction, resetFunction = (obj) => obj, initialSize = 0, maxSize = 0) {
        this.resetFunction = resetFunction;
        this.constructorFunction = constructorFunction;
        this._maxSize = maxSize;

        this._createInitial(initialSize);
    }

    /**
     * get element from pool
     * @param {String | Number} key - element key to get
     * @param {mixed} [additionalCreateArguments] - additional create Arguments
     * @returns {ObjectPoolMember}
     */
    getElement(key = 'default', additionalCreateArguments) {
        this._checkPoolKey(key);
        const poolBranch = this._pool[key];

        for (const poolObject of Object.values(poolBranch)) {
            if (poolObject.free) {
                poolObject.free = false;
                return poolObject;
            }
        }

        const newObj = this._createElement(key, additionalCreateArguments);
        newObj.free = false;
        return newObj;
    }

    /**
     * put element back to pool (resetFunction will call)
     * @param {ObjectPoolMember} element
     */
    putElement(element) {
        element.free = true;
        element.putTime = Urso.time.get();
        this.resetFunction(element.data);

        if (this._maxSize) {
            //need update branchKey
            const currentBranchKey = element.branchKey;
            const branch = this._pool[element.key];
            element.branchKey = this._getElementBranchKey(key);
            Urso.helper.renameObjectsKey(branch, currentBranchKey, element.branchKey);

            //todo remove old
            const poolSize = this._getPoolSize();
            if (poolSize > this._maxSize) {
                //todo
            }
        }
    }

    _getPoolSize() {
        let size = 0;

        for (const branch of Object.values(this._pool)) {
            size += Object.keys(branch).length;
        }

        return size;
    }

    /**
     * create new element for pool
     * @param {String | Number} key - element key to create
     * @param {mixed} [additionalCreateArguments] - additional create Arguments
     * @returns {ObjectPoolMember}
     */
    _createElement(key, additionalCreateArguments = null) {
        const newObj = this.resetFunction(this.constructorFunction(key, additionalCreateArguments));
        const branchKey = this._getElementBranchKey(key);
        const poolMember = new ObjectPoolMember(newObj, key, branchKey);
        this._pool[key][branchKey] = poolMember;
        return poolMember;
    }

    /**
     * get element branch key
     * @param {String | Number} key - element key to get
     * @returns {Nymber}
     */
    _getElementBranchKey(key) {
        const ePool = this._pool[key];
        let branchKey = Urso.time.get();

        //prevent duplicates
        if (ePool[branchKey]) {
            branchKey = this._lastBranchKeys[key] + 1;
        }

        this._lastBranchKeys[key] = branchKey;
        return branchKey;
    }

    /**
     * create initial pool objects
     * @param {Number} initialSize
     */
    _createInitial(initialSize) {
        if (!initialSize)
            return;

        let newObjectsArray = [];

        for (let index = 0; index < initialSize; index++) {
            newObjectsArray.push(this.getElement());
        }

        newObjectsArray.forEach(newObject => { this.putElement(newObject); });
    }

    /**
     * check exist key namespace
     * @param {String | Number} key - element key
     */
    _checkPoolKey(key) {
        if (!this._pool[key])
            this._pool[key] = {};
    }

    /**
     * debug get pool data
     * @returns {Array}
     */
    _debugGetPoolData() {
        return this._pool;
    }
}

module.exports = LibObjectPool;