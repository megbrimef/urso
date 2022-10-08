class ObjectPoolMember {

    free = true;
    putCacheTimeKey = 0;
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
    _putTimeCache = {};

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

                //remove from putTimeCache
                if (poolObject.putCacheTimeKey) {
                    delete this._putTimeCache[poolObject.putCacheTimeKey];
                    poolObject.putCacheTimeKey = 0;
                }

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
        this.resetFunction(element.data);

        if (this._maxSize) {
            //lets write put time cache
            const putCacheTimeKey = this._getElementBranchKey('_putTimeCache', this._putTimeCache);
            this._putTimeCache[putCacheTimeKey] = element;
            element.putCacheTimeKey = putCacheTimeKey;
        }

        this._checkMaxSize();
    }

    /**
     * check max pool size
     */
    _checkMaxSize() {
        if (!this._maxSize)
            return;

        //remove oldest inactive element
        const poolSize = this._getPoolSize();

        if (poolSize > this._maxSize) {
            this._removeOldestInactiveElement();
        }

    }

    /**
     * remove oldest inactive element
     */
    _removeOldestInactiveElement() {
        const keyToRemove = Object.keys(this._putTimeCache)[0];
        const element = this._putTimeCache[keyToRemove];

        //remove from pool
        delete this._pool[element.key][element.branchKey];

        //reset element
        element.free = false;
        element.putCacheTimeKey = 0;
        element.key = null;
        element.branchKey = 0;
        element.data = null;

        //remove from putTimeCache
        delete this._putTimeCache[keyToRemove];
    }

    /**
     * pool size (all branches)
     */
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
        const branchKey = this._getElementBranchKey(key, this._pool[key]);
        const poolMember = new ObjectPoolMember(newObj, key, branchKey);
        this._pool[key][branchKey] = poolMember;
        return poolMember;
    }

    /**
     * get element branch key
     * @param {String | Number} key - element key to get
     * @returns {Nymber}
     */
    _getElementBranchKey(key, poolBranch) {
        let branchKey = Urso.time.get();

        //prevent duplicates
        if (poolBranch[branchKey]) {
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