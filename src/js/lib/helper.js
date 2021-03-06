class LibHelper {

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
     * 
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

    getObjectSize(obj) {
        return Object.keys(obj).length;
    }

    mobileAndTabletCheck() {
        let check = false;
        (function (a) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
                check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);

        return check;
    }

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


}

module.exports = LibHelper;
