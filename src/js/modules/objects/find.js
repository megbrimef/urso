class ModulesObjectsFind {
    constructor() {
        this.singleton = true;
    };

    do(selector, findOneFlag) {
        let result = [];
        let selectorsPartsParsed = this._parseSelector(selector);
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
            let testResult = this._testObjectsForSelector(
                testObject,
                selectorsPartsParsed
            );

            if (testResult)
                result.push(testObject);

            if (findOneFlag)
                return result;
        }

        return result;
    };

    _testObjectsForSelector(testObject, selectorsPartsParsed) {
        let properties = selectorsPartsParsed[
            selectorsPartsParsed.length - 1
        ];

        if (!this._testObjectsProperties(testObject, properties))
            return false;

        if (selectorsPartsParsed.length === 1)
            return true;

        //now we will check objects parents (for complex selectors)
        let parent = testObject.parent;

        for (let i = selectorsPartsParsed.length - 2; i >= 0; i--) {
            let parentProperties = selectorsPartsParsed[i];
            let expectedParentFoundFlag = 0;

            while (expectedParentFoundFlag !== 1 && parent) {
                if (this._testObjectsProperties(parent, parentProperties))
                    expectedParentFoundFlag = 1;

                parent = parent.parent;
            }

            if (expectedParentFoundFlag === 1 && i === 0) //last propertie from selector and all is good
                return true;

            if (expectedParentFoundFlag === 0)
                return false;
        }
    }

    _testObjectsProperties(object, properties) {
        for (let propertie of properties) {
            if (propertie.type === 'class') {
                if (
                    !object[propertie.type] ||
                    object[propertie.type].split(' ').indexOf(propertie.value) === -1
                )
                    return false;

            } else if (object[propertie.type] !== propertie.value)
                return false;
        }

        return true;
    };

    _parseSelector(selector) {
        let selectorsParts = selector.split(' ');
        let selectorsPartsParsed = [];

        for (let selectorsPart of selectorsParts) {
            let selectorPartParsed = this._parseSelectorPart(selectorsPart);

            if (!selectorPartParsed)
                Urso.logger.error('ModulesObjectsService error, cannot parse selector part: ' + selectorsPart);

            selectorsPartsParsed.push(selectorPartParsed);
        }

        return selectorsPartsParsed;
    };

    _parseSelectorPart(selectorPart) {
        const characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+";
        const matchExpr = {
            "id": new RegExp("^#(" + characterEncoding + ")"),
            "name": new RegExp("^\\^(" + characterEncoding + ")"),
            "class": new RegExp("^\\.(" + characterEncoding + ")")
        };

        let result = [];

        for (let type in matchExpr) {
            let foundItem = matchExpr[type].exec(selectorPart);

            if (foundItem) {
                result.push({ type: type, value: foundItem[1] });

                let restSelectorPart = Urso.helper.stringReplace(foundItem[0], '', selectorPart);
                let restItems = this._parseSelectorPart(restSelectorPart);

                if (restItems)
                    return Urso.helper.mergeArrays(result, restItems);
            }
        }

        return (result && result.length > 0) ? result : false;
    };
}

module.exports = ModulesObjectsFind;
