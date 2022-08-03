class ModulesObjectsFind {

    constructor() {
        this.singleton = true;
        this._selector = this.getInstance('Selector');
    };

    /**
     * find object(s) by selector  (find, findOne, findAll)
     * @param {String} selector
     * @param {Boolean} findOneFlag
     * @returns {mixed}
     */
    do(selector, findOneFlag) {
        let result = [];
        let selectorsPartsParsed = this._selector.parse(selector);
        let lastRule = selectorsPartsParsed[selectorsPartsParsed.length - 1][0];

        //get elements by last rule
        let testObjects = this.getInstance('Cache')[
            'get' + Urso.helper.capitaliseFirstLetter(lastRule.type)
        ](lastRule.value);

        //if its name or id we will transform one element to array of elements to test
        if (lastRule.type !== 'class' && testObjects)
            testObjects = [testObjects];

        //no objects found to test --> return false
        if (!testObjects || testObjects.length === 0)
            return false;

        //return findOneFlag with simple selector (selector with one rule)
        if (
            findOneFlag &&
            selectorsPartsParsed.length === 1 &&
            selectorsPartsParsed[0].length === 1
        )
            return testObjects;

        //check test objects for all selectors parts conformity
        for (let testObject of testObjects) {
            let testResult = this._selector.testObjectWithParsedSelector(
                testObject,
                selectorsPartsParsed
            );

            if (testResult)
                result.push(testObject);

            if (testResult && findOneFlag)
                return result;
        }

        return result;
    };
}

module.exports = ModulesObjectsFind;
