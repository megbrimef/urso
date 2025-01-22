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

  /**
   * Generates a random integer between 0 and the specified maximum value.
   *
   * @param {number} max - The maximum value for the random integer.
   * @returns {number} The random integer generated.
   */
  getRandomInt(max) {
    return this.getRandomIntBetween(0, max);
  }

  /**
   * Generates a random integer between the given minimum and maximum values (inclusive).
   *
   * @param {number} min - The minimum value.
   * @param {number} max - The maximum value.
   * @returns {number} The random integer between min and max.
   */
  getRandomIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * round float number to digits count
   * @param {Number} num
   * @param {Number} digits - rounding digits count
   * @returns {Number}
   */
  roundToDigits(num, digits) {
    if (isNaN(num) || isNaN(digits)) return false;

    const pow = Math.pow(10, digits);
    return Math.round(num * pow) / pow;
  }

  /**
   * Checks if a given value is an integer.
   *
   * @param {number} n - The value to be checked.
   * @returns {boolean} - Returns true if the value is an integer, otherwise returns false.
   */
  isInt(n) {
    return Number(n) === n && n % 1 === 0;
  }

  /**
   * Checks if a given number is a floating-point number.
   *
   * @param {number} n - The number to be checked.
   * @returns {boolean} - Returns true if the number is a floating-point number, otherwise returns false.
   */
  isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
  }

  /**
   * Calculates the length of the decimal part of a number.
   *
   * @param {number} number - The number to calculate the decimal length for.
   * @returns {number} The length of the decimal part of the number.
   */
  getDecimalsLength(number) {
    return Number(number.toString().split(".")[1]?.length || 0);
  }

  /**
   * Multiplies an array of floating-point numbers.
   *
   * @param {number[]} numsArray - The array of numbers to be multiplied.
   * @returns {number} The result of multiplying all the numbers in the array.
   */
  multiplyFloats(numsArray) {
    let result = numsArray.reduce((acc, num) => acc * num);
    return this._processFloat(result, numsArray);
  }

  /**
   * Adds an array of floating-point numbers.
   *
   * @param {number[]} numsArray - The array of numbers to be added.
   * @returns {number} - The sum of the numbers in the array.
   */
  addFloats(numsArray) {
    let result = numsArray.reduce((acc, num) => acc + num);
    return this._processFloat(result, numsArray);
  }

  /**
   * Subtracts an array of floating-point numbers.
   *
   * @param {number[]} numsArray - The array of numbers to subtract.
   * @returns {number} - The result of subtracting the numbers.
   */
  subtractFloats(numsArray) {
    let result = numsArray.reduce((acc, num) => acc - num);
    return this._processFloat(result, numsArray);
  }

  /**
   * Processes the float values in the given array and returns the result.
   * @param {number} result - The initial result value.
   * @param {number[]} numsArray - The array of numbers to process.
   * @returns {number} - The processed result value.
   */
  _processFloat(result, numsArray) {
    let floatsExist = false;

    numsArray.forEach((element) => {
      if (this.isFloat(element)) {
        floatsExist = true;
      }
    });

    if (floatsExist) {
      result = this._strip(result);
    }

    return result;
  }

  /**
   * Calculates the maximum length of decimals in an array of numbers.
   *
   * @param {number[]} numsArray - The array of numbers.
   * @returns {number} - The maximum length of decimals.
   */
  getMaxDecimalsLength(numsArray) {
    let maxDecimalLength = 0;

    numsArray.forEach((num) => {
      if (!num) return 0;

      const currentDecimalLength = this.getDecimalsLength(num);
      maxDecimalLength = Math.max(currentDecimalLength, maxDecimalLength);
    });

    return maxDecimalLength;
  }

  /**
   * Strips the decimal places of a number.
   *
   * @param {number} number - The number to strip the decimal places from.
   * @returns {number} - The number with stripped decimal places.
   */
  _strip(number) {
    return Number(number.toPrecision(12));
  }
}

module.exports = LibMath;
