/**
 * tools for selector parse and objects check
 */
class ModulesObjectsSelector {

    constructor() {
        this.singleton = true;
    };

    /**
     * test object for selector
     * @param {Object} testObject
     * @param {String} selector
     * @returns {Boolean}
     */
    testObject(testObject, selector) {
        let selectorsPartsParsed = this.parse(selector);
        return this.testObjectWithParsedSelector(testObject, selectorsPartsParsed);
    }

    /**
     * test object for selector parts array
     * @param {Object} testObject
     * @param {Array} selectorsPartsParsed
     * @returns {Boolean}
     */
    testObjectWithParsedSelector(testObject, selectorsPartsParsed) {
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

            if (expectedParentFoundFlag === 1 && i === 0) //last property from selector and all is good
                return true;

            if (expectedParentFoundFlag === 0)
                return false;
        }
    }

    /**
     * test object for properties list
     * @param {Object} object
     * @param {Array} properties - class, id or name with value. [{type:'class',value:'someClassName'}...]
     * @returns {Boolean}
     */
    _testObjectsProperties(object, properties) {
        for (let property of properties) {
            if (property.type === 'class') {
                if (
                    !object[property.type] ||
                    !object[property.type].split(' ').includes(property.value)
                )
                    return false;

            } else if (property.type === 'type') {
                // FIXED: compare the object's NUMERIC type against the lowercase flipped type name, so a bare
                // selector word ('button') can match Urso.types.objects.BUTTON. The flipped map is memoised
                // because this runs for every candidate object on every search.
                if (!this._typesFlipped)
                    this._typesFlipped = Urso.helper.objectFlip(Urso.types.objects);

                const expectedTypeName = this._typesFlipped[object.type];

                if (!expectedTypeName || expectedTypeName.toLowerCase() !== property.value)
                    return false;

            } else if (object[property.type] !== property.value)
                return false;
        }

        return true;
    };

    /**
     * parse selector to a array of parts
     * @param {String} selector
     * @returns {Array}
     */
    parse(selector) {
        let selectorsParts = selector.split(' ');
        let selectorsPartsParsed = [];

        for (let selectorsPart of selectorsParts) {
            let selectorPartParsed = this._parseSelectorPart(selectorsPart);

            if (!selectorPartParsed) {
                // FIXED: do not push false into array; return false immediately for clean failure
                Urso.logger.error('ModulesObjectsService error, cannot parse selector part: ' + selectorsPart);
                return false;
            }

            selectorsPartsParsed.push(selectorPartParsed);
        }

        return selectorsPartsParsed;
    };

    /**
     * parse selectors one object part
     * @param {String} selectorPart
     * @returns {mixed}
     */
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

        // ADDED: if no prefixed form matched, try parsing as a bare type word
        let bareTypeMatch = new RegExp("^(" + characterEncoding + ")").exec(selectorPart);
        if (bareTypeMatch) {
            result.push({ type: 'type', value: bareTypeMatch[1] });

            let restSelectorPart = Urso.helper.stringReplace(bareTypeMatch[0], '', selectorPart);
            let restItems = this._parseSelectorPart(restSelectorPart);

            if (restItems)
                return Urso.helper.mergeArrays(result, restItems);
        }

        return (result && result.length > 0) ? result : false;
    };
}

export default ModulesObjectsSelector;
