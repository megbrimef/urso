class ModulesObjectsFind {

    constructor() {
        this.singleton = true;
        this._selector = this.getInstance('Selector');
    };

    /**
     * find object(s) by selector
     * @param {String} selector
     * @param {Boolean} findOneFlag
     * @returns {mixed}
     */
    do(selector, findOneFlag) {
        let result = [];
        let selectorsPartsParsed = this._selector.parse(selector);
        let lastRule = selectorsPartsParsed[selectorsPartsParsed.length - 1][0];

        //get elements
        let testObjects = this.getInstance('Cache')[
            'get' + Urso.helper.capitaliseFirstLetter(lastRule.type)
        ](lastRule.value);

        if (lastRule.type !== 'class')
            testObjects = [testObjects];

        if (!testObjects || testObjects.length === 0)
            return false;

        //return findOneFlag with simple selector
        if (
            findOneFlag &&
            selectorsPartsParsed.length === 1 &&
            selectorsPartsParsed[0].length === 1
        )
            return testObjects;

        //check test objects all selectors parts
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
