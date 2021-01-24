class LibMath {
    /**
        * validate number to make it value between min and max values
        * @param {Number} num 
        * @param {Number} min 
        * @param {Number} max 
    */
    intMakeBetween(num, min, max) {
        return Math.max.apply(Math, [min, Math.min.apply(Math, [max, num])]);
    }

    getRandomInt(max) {
        return this.getRandomIntBetween(0, max);
    }

    getRandomIntBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

module.exports = LibMath;