class LibHelper {

    constructor() {

        /**
         * angle radian factor
         * @type Number
         */
        this._arFactor = (Math.PI / 180);
    }

    /**
     * getting GET param(s) by name or all params list
     *
     * @param {string} [name] - get param name
     * @returns {Object}
     */
    parseGetParams(name) {
        let $_GET = {};
        const _GET = window.location.href.substring(1).split("?");

        if (_GET[1]) {
            const __GET = _GET[1].split("&");

            for (let i = 0; i < __GET.length; i++) {
                let getVar = __GET[i].split("=");
                $_GET[getVar[0]] = typeof getVar[1] === "undefined" ? "" : getVar[1];
            }
        }

        if (!name)
            return $_GET;

        return $_GET[name];
    }

    /**
     * waiter for dom element on page
     * @param {String} selector 
     * @returns {Promice}
     * 
     * @example
     * waitForDomElement(.game-container).then(()=>{...})
     */
    waitForDomElement(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    /**
     * get uniq elements from two arrays
     * @param {Array} array1 
     * @param {Array} array2 
     * @example arraysGetUniqElements([1,2,3], [2,3,4]) returns [1, 4]
     */
    arraysGetUniqElements(array1, array2) {
        const result = [];
        const tempObject = {};
        let key, element;

        const parseArray = function (arrayObject) {
            for (element of arrayObject) {
                if (!tempObject[element])
                    tempObject[element] = { counter: 1, value: element };
                else
                    tempObject[element].counter++;
            }
        };

        parseArray(array1);
        parseArray(array2);

        for (key in tempObject)
            if (tempObject[key].counter === 1)
                result.push(tempObject[key].value);

        return result;
    }

    /**
     * replase string pattern in the string
     * @param {String} needle 
     * @param {String} replacement 
     * @param {String} haystack 
     * @returns {String}
     */
    stringReplace(needle, replacement, haystack) {
        return haystack.split(needle).join(replacement);
    }

    /**
     * capitalise first letter in the string
     * @param {String} str 
     * @returns {String}
     */
    capitaliseFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * returns array without last element
     * @param {Array} array 
     * @returns {Array}
     */
    initial(array) {
        array.pop();
        return array;
    }

    /**
     * lead degree zero
     * @param {Number} num
     * @param {Number} count
     * @returns {String}
     */
    ldgZero(num, count) {
        let numZeropad = num + '';

        while (numZeropad.length < count) {
            numZeropad = "0" + numZeropad;
        }

        return numZeropad;
    }

    /**
     * merge two arrays into new array
     * @param {Array} a 
     * @param {Array} b 
     */
    mergeArrays(a, b) {
        let c = a.concat(b.filter(function (item) {
            return a.indexOf(item) < 0;
        }));

        return c;
    }

    /**
     * Swap key with value in object
     * @param {Object} obj
     * @returns {Object}
     */
    objectFlip(obj) {
        const ret = {};

        Object.keys(obj).forEach(key => {
            ret[obj[key]] = key;
        });

        return ret;
    }

    /**
     * recursive set value to object by key
     * (*) you can use '.' as objects keys splitter
     * @param {String} key 
     * @param {Mixed} value 
     * @param {Object} object 
     * @returns {Boolean}
     */
    recursiveSet(key, value, object) {
        key = (typeof key === 'string') ? key.split(".") : key;

        let firstKey = key.shift();

        if (key.length > 0) {
            if (!object[firstKey])
                object[firstKey] = {};

            this.recursiveSet(key, value, object[firstKey]);
        } else
            object[firstKey] = value;

        return true;
    }

    /**
    * @param {Array} matrix 
    * @returns {Array}
    */
    rowsToCols(matrix) {
        return Object.keys(matrix[0])
            .map(colNumber => matrix.map(rowNumber => rowNumber[colNumber]));
    }

    /**
     * recursive get value from object by key
     * (*) you can use '.' as objects keys splitter
     * @param {String} key 
     * @param {Object} object 
     * @returns {Mixed}
     */
    recursiveGet(key, object, defaultResult) {
        if (object === undefined)
            return defaultResult;

        key = (typeof key === 'string') ? key.split(".") : key;

        for (let k of key) {
            if (typeof object[k] === 'undefined')
                return defaultResult;

            object = object[k];
        }

        return object;
    }

    /**
     * recursive delete value from object by key
     * (*) you can use '.' as objects keys splitter
     * @param {String} key 
     * @param {Object} object 
     * @returns {Boolean}
     */
    recursiveDelete(key, obj) {
        key = (typeof key === 'string') ? key.split(".") : key;

        for (let k = 0; k < key.length; k++) {
            let ok = key[k];

            if (typeof obj[ok] === 'undefined')
                return false;

            if (k === (key.length - 1))
                delete (obj[ok]);
            else
                obj = obj[ok];
        }

        return true;
    }

    /**
     * tranpose matrix (rows to cols)
     * @param {Array} matrix 
     * @returns {Array}
     */
    transpose(matrix) {
        return Object.keys(matrix[0])
            .map(colNumber => matrix
                .map(rowNumber => rowNumber[colNumber]));
    }

    /**
     * recursive merge two objects into one
     * @param {Object} obj1 
     * @param {Object} obj2 
     * @param {Boolean} mergeInFirstFlag 
     * @returns {Object}
     */
    mergeObjectsRecursive(obj1, obj2, mergeInFirstFlag) {
        let newObj = (mergeInFirstFlag) ? obj1 : this.objectClone(obj1);

        for (let k in obj2) {
            if (typeof obj2[k] === 'object' && typeof obj1[k] === 'object')
                newObj[k] = this.mergeObjectsRecursive(obj1[k], obj2[k], mergeInFirstFlag);
            else
                newObj[k] = obj2[k];
        }

        return newObj;
    }

    /**
     * rename objects key
     * @param {Object} obj
     * @param {String} oldKey
     * @param {String} newKey
     */
    renameObjectsKey(obj, oldKey, newKey) {
        if (oldKey !== newKey) {
            Object.defineProperty(
                obj, newKey,
                Object.getOwnPropertyDescriptor(obj, oldKey)
            );

            delete obj[oldKey];
        }
    }

    /**
     * clone object
     * @param {Object} obj 
     * @param {Number} recursiveCalls 
     * @returns {Object}
     */
    objectClone(obj, recursiveCalls) {
        if (!obj || "object" !== typeof obj)
            return obj;

        if (typeof recursiveCalls === 'undefined')
            recursiveCalls = 999;

        let clone = "function" === typeof obj.pop ? [] : {}; //object o array
        let prop, propValue;

        if (obj.hasOwnProperty)
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    propValue = obj[prop];

                    if (prop === "imageSrc")
                        clone[prop] = propValue;
                    else if (propValue && "object" === typeof propValue)
                        clone[prop] = (recursiveCalls) ? this.objectClone(propValue, recursiveCalls - 1) : '[object Object]';
                    else
                        clone[prop] = propValue;
                }
            }

        return clone;
    }

    /**
     * get object size (keys length)
     * @param {Object} obj 
     * @returns {Number}
     */
    getObjectSize(obj) {
        return Object.keys(obj).length;
    }

    /**
     * object apply
     * @param {Object} fromObj
     * @param {Object} toObj
     * @returns {Object}
     */
    objectApply(fromObj, toObj, recursiveCalls = 999) {
        if (!recursiveCalls)
            return fromObj;

        for (let k in toObj) {
            let paramTo = toObj[k];

            if (!fromObj[k]) {
                fromObj[k] = paramTo;
            } else if (typeof paramTo === "array" || typeof paramTo === "object") {
                fromObj[k] = this.objectApply(fromObj[k], toObj[k], recursiveCalls - 1);
            } else {
                if (toObj[k] !== fromObj[k]) {
                    fromObj[k] = paramTo;
                }
            }
        }

        return fromObj;
    }

    /**
     * check deep objects equal
     * @param {Object} obj1 
     * @param {Object} obj2 
     * @returns {Boolean}
     */
    checkDeepEqual(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    /**
     * check objects equal
     * @param {Object} obj1 
     * @param {Object} obj2 
     * @returns {Boolean}
     */
    checkEqual(obj1, obj2) {
        const objSort = (o) => {
            const sortedObj = {};
            const keys = Object.keys(o);
            keys.sort();

            for (let index in keys) {
                if (keys.hasOwnProperty(index)) {
                    let key = keys[index];
                    let value = o[key];

                    if (typeof o[key] === 'object')
                        value = objSort(value);

                    sortedObj[key] = value;
                }
            }

            return sortedObj;
        };

        const o1s = objSort(obj1);
        const o2s = objSort(obj2);

        return this.checkDeepEqual(o1s, o2s);
    }

    /**
     * check Arrays Partial Entry
     * @param {Object} main
     * @param {Object} partial
     * @returns {Boolean}
     */
    checkArraysPartialEntry(main, partial) {
        if (!main || !partial)
            return false;

        main = main.sort();
        partial = partial.sort();

        let kPartial = partial.length - 1;

        for (let i = main.length - 1; i >= 0; i--) {
            if (JSON.stringify(main[i]) === JSON.stringify(partial[kPartial]))
                kPartial--;

            if (kPartial === -1)
                return true;
        }

        return false;
    }

    /**
     * check is device mobile or tablet
     * @returns {Boolean}
     */
    mobileAndTabletCheck() {
        let check = false;
        (function (a) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
                check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);

        return check;
    }

    /**
     * check for Ipad OS
     */
    isIpadOS = () => {
        return navigator.maxTouchPoints &&
            navigator.maxTouchPoints > 2 &&
            /MacIntel/.test(navigator.platform);
    }

    /**
     * make objects property reactive
     * @param {Object} targetObject 
     * @param {String} key 
     * @param {Function} callback 
     * @returns 
     */
    reactive(targetObject, key, callback) {
        let descriptor = Object.getOwnPropertyDescriptor(targetObject, key);
        let targetObjectTemp = targetObject;

        while (!descriptor && targetObjectTemp.__proto__) {
            targetObjectTemp = targetObjectTemp.__proto__;
            let descriptorTemp = Object.getOwnPropertyDescriptor(targetObjectTemp, key);

            if (descriptorTemp && (descriptorTemp.value || descriptorTemp.set || descriptorTemp.get)) {
                descriptor = descriptorTemp;
            }
        }

        if (!descriptor) // bad descriptors and its IOS mobile
            return false;

        if (typeof descriptor.value !== 'undefined') {
            let value = descriptor.value;
            descriptor.get = function () { return value; };
            descriptor.set = function (v) { value = v; };

            delete descriptor.value;
            delete descriptor.writable;
        }

        let setter = descriptor.set;

        descriptor.set = function (v) {
            if (setter)
                setter.call(targetObject, v);

            callback.call(targetObject, v);
        };

        Object.defineProperty(targetObject, key, descriptor);

        return true;
    }


    /**
     * calc length between two points
     *
     * @param {Object} point1
     * @param {Object} point1
     * @return {Number}
     */
    getLengthBy2Points(point1, point2) {
        return Math.sqrt((point2.x - point1.x) * (point2.x - point1.x) +
            (point2.y - point1.y) * (point2.y - point1.y));
    }

    /**
     * calc angle between three points (in radians)
     *
     * @param {Object} point1
     * @param {Object} point2
     * @param {Object} point3
     * @return {Number}
     */
    getAngleBy3Points(point1, point2, point3) {
        let angle = 0;
        const c = this.getLengthBy2Points(point1, point3);
        const a = this.getLengthBy2Points(point1, point2);
        const b = this.getLengthBy2Points(point2, point3);

        if (a !== 0 && b !== 0) {
            const cornerRcos = Urso.math.intMakeBetween(
                (a * a + b * b - c * c) / (2 * a * b),
                -1, 1
            );

            angle = Math.acos(cornerRcos);
        }

        return angle;
    }


    /**
     * get angle in radians from degrees
     *
     * @param {Number} angle
     * @return {Number}
     */
    getRadian(angle) {
        return (angle * this._arFactor);
    }

    /**
     * get angle in degrees from radians
     *
     * @param {Number} radian
     * @return {Number}
     */
    getAngle(radian) {
        return (radian / this._arFactor);
    }

    /**
     * arguments {oblect} (ClassInstance, functionName, param1, param2, ...)
     * needs {Object} obj._logicBlocks;
     * creates {Object} obj._logicBlocksInstances;
     * @returns {Array} execution results
     */
    logicBlocksDo() {
        const params = Array.prototype.slice.call(arguments);
        const entity = params.shift();
        const funcName = params.shift();

        //if no instances we will create them
        if (!entity._logicBlocksInstances) {
            entity._logicBlocksInstances = {};

            for (let k in entity._logicBlocks) {
                const name = entity._logicBlocks[k];
                const nameCap = this.capitaliseFirstLetter(name);
                entity._logicBlocksInstances[name] = entity.getInstance(nameCap);
            }
        }

        let results = [];
        //game
        for (let name in entity._logicBlocksInstances) {
            if (entity._logicBlocksInstances[name][funcName]) {
                const res = entity._logicBlocksInstances[name][funcName].apply(this, params);
                results.push(res);
            }
        }

        return results;
    }

    /**
     * apply params to string
     * @param {String} string 
     * @param {Object} params 
     * @returns {String}
     * 
     *  @example interpolate('Bet ${bet} with Multi ${multi}', {bet:12,multi:13})
     *  returns 'Bet 12 with Multi 13'
     */
    interpolate(string, params) {
        for (const [key, value] of Object.entries(params)) {
            string = Urso.helper.stringReplace('${' + key + '}', value, string);
        }

        return string
    }

    /**
     * Converts color number to object that contents RGB values
     * @param { Number } color - color number
     * @returns { Object }
     */
    getRGB(color) {
        return {
            alpha: 16777215 < color ? color >>> 24 : 255,
            red: color >> 16 & 255,
            green: color >> 8 & 255,
            blue: 255 & color
        };
    }

    /**
     * Converts RGB values to 32 bit
     * @param { Number } alpha 
     * @param { Number } red 
     * @param { Number } green 
     * @param { Number } blue 
     * @returns { Number }
     */
    getColor32(alpha, red, green, blue) {
        return alpha << 24 | red << 16 | green << 8 | blue;
    }

    /**
     * Returns color interpolation depends on step value
     * @param { Number } startColor 
     * @param { Number } targetColor 
     * @param { Number } step - intermediate value from 0 to 1
     * @returns { Number }
     */
    interpolateColor32(startColor, targetColor, step) {
        if (startColor === targetColor)
            return startColor;

        const startColorRGB = this.getRGB(startColor);
        const targetColorRGB = this.getRGB(targetColor);
        const nextColorRGB = this.interpolateColorRGB(startColorRGB, targetColorRGB, step);
        const color32 = this.getColor32(255, nextColorRGB.red, nextColorRGB.green, nextColorRGB.blue);
        return 16777215 + color32;
    }

    /**
     * Returns color interpolation as RGB object depends on step value
     * @param { Object } startColorRGB - object that contents start values for red, green and blue
     * @param { Object } targetColorRGB - object that contents target values for red, green and blue
     * @param { Number } step - intermediate value from 0 to 1
     * @returns { Object }
     */
    interpolateColorRGB(startColorRGB, targetColorRGB, step) {
        const nextRGB = {};

        Object.keys(startColorRGB).forEach(color => {
            nextRGB[color] = (targetColorRGB[color] - startColorRGB[color]) * step + startColorRGB[color];
        });

        return nextRGB;
    }
}

module.exports = LibHelper;
