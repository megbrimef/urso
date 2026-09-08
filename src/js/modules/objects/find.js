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

        // FIXED: defend against failed parse by checking before accessing
        if (!selectorsPartsParsed || selectorsPartsParsed.length === 0)
            return false;

        let lastRulePart = selectorsPartsParsed[selectorsPartsParsed.length - 1];
        if (!lastRulePart || !lastRulePart[0])
            return false;

        let lastRule = lastRulePart[0];

        //get elements by last rule
        let testObjects = this.getInstance('Cache')[
            'get' + Urso.helper.capitaliseFirstLetter(lastRule.type)
        ](lastRule.value);

        //if its name or id we will transform one element to array of elements to test
        // FIXED: 'type' lookups return an ARRAY (like 'class'), not a single object — without excluding it here
        // the result was double-wrapped into [[obj, obj]], so every bare type selector matched nothing.
        if (lastRule.type !== 'class' && lastRule.type !== 'type' && testObjects)
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

export default ModulesObjectsFind;
