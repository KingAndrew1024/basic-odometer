/**
 * USAGE
 * Include this script and the odometer.css in your html head section
 *
 * @example
 * //In your html create a div with some id
 * <div id="odometer"></div>
 *
 * //in JS get a reference to that div
 * const odoContainer = document.getElementById('odometer');
 *
 * //Create the odo config
 *  const odoConfig = {
 *  initValue: 123,
 *  radixMark: ',',
 *  decimalMark: '.',
 *  currencySymbol: '$',
 *  currencyPosition: 'end',
 *  commafyLeadingZeros: true,
 *  minIntegersLength: 6,
 *  minDecimalsLength: 2,
 *  animationDurationInMs: 2500,
 * };
 * // Instatntiate the Odometer
 * const odo = new Odometer(odoContainer, odoConfig);
 *
 * //set or update the odo value by calling the next function programatically
 * odo.set(123.45);
 */
const Odometer = (
  () =>
  (element, userOptions = {}) => {
    // radixMark supported values: ['', ',', "'", '˙', '.', ' ']
    // see https://docs.oracle.com/cd/E19455-01/806-0169/overview-9/index.html
    // and http://www.linguafin.com/index.php?p=thousand+separators+and+decimals
    const supportedRadixMarks = ['', ',', "'", '˙', '.', ' '];

    const supportedDecimalMarks = ['.', ','];

    const supportedCurrencyPositions = ['start', 'end'];

    /**
     * @typedef OdoConfig
     * @property {(number|string)} OdoConfig.initValue
     * @property {string} OdoConfig.radixMark
     * @property {string} OdoConfig.decimalMark
     * @property {string} OdoConfig.currencySymbol
     * @property {('start'|'end')} OdoConfig.currencyPosition
     * @property {boolean} OdoConfig.commafyLeadingZeros
     * @property {number} OdoConfig.minIntegersLength
     * @property {number} OdoConfig.minDecimalsLength
     * @property {number} OdoConfig.animationDurationInMs
     * @property {function} OdoConfig.animateFunction
     */
    const defaultConfig = {
      initValue: 0,
      radixMark: supportedRadixMarks[0],
      decimalMark: supportedDecimalMarks[0],
      currencySymbol: '',
      currencyPosition: supportedCurrencyPositions[0],
      commafyLeadingZeros: false, // commafies strings like: 000000.01 to 000,000.01
      minIntegersLength: 1,
      minDecimalsLength: 0,
      animationDurationInMs: 1800,
      animateFunction: _easeOutQuad,
    };

    const config = {};
    let currentValue = '';
    const API = {};

    element.classList.add('odometer');

    class Reel {
      /**
       * @param {string[]} symbolsVector Array of digits and markers
       * @param {object} param1
       * @param {string} param1.reelClasses custom reel classes
       * @param {string} param1.radixMark defaults to ','
       * @param {string} param1.decimalMark defaults to '.'
       * @param {boolean} param1.isDecreasing defaults to false
       */
      constructor(
        symbolsVector,
        {
          reelClasses = '',
          radixMark = ',',
          decimalMark = '.',
          isDecreasing = false,
        }
      ) {
        this.reelHeight = 0;
        this.digitHeight = 0;

        this.isAnimatable = false;
        this.animationStartTime = undefined;
        this.currentReelPosition = 0;
        this.animateFunction = undefined;
        this.animationDurationInMs = undefined;

        this.isDecreasing = isDecreasing;

        this.reelWrapper = document.createElement('div');
        this.reel = document.createElement('div');

        this.init(symbolsVector, reelClasses, radixMark, decimalMark);
      }

      /**
       * Creates the Reel (a div structure) which includes all the digits and marks in the symbolsVector
       * @param {string[]} symbolsVector Array of digits and markers
       * @param {string} reelClasses custom reel classes
       * @param {string} radixMark the thousands separatod
       * @param {string} decimalMark the decimal separator
       */
      init(symbolsVector, reelClasses, radixMark, decimalMark) {
        reelClasses.split(' ').forEach((cssClass) => {
          cssClass && this.reelWrapper.classList.add(cssClass);
        });

        if (![radixMark, decimalMark].includes(symbolsVector[0])) {
          this.reelWrapper.classList.add('reel');
          this.reel.classList.add('digits');
          this.isAnimatable = symbolsVector.length > 1;
        }

        symbolsVector.forEach((char) => {
          if (char === ' ') {
            char = '&nbsp;';
          }

          if (char.toString().match(/[0-9]/)) {
            this.reel.innerHTML += `
              <div class="digit">
                ${char}
              </div>
            `;
          } else {
            this.reel.classList.add('mark');
            this.reel.innerHTML = char;
          }
        });

        this.reelWrapper.appendChild(this.reel);
      }

      /**
       * Sets up an animation for a Reel
       * @param {Object} param0
       * @param {function} param0.animateFunction
       * @param {number} param0.animationDurationInMs
       * @returns {Promise<*> | undefined}
       */
      animateReel({ animateFunction, animationDurationInMs }) {
        this.animateFunction = animateFunction;
        this.animationDurationInMs = animationDurationInMs;

        if (!this.isAnimatable) {
          return;
        }

        this.reelHeight = this.reel.offsetHeight;
        this.digitHeight = this.reel.querySelector('div').offsetHeight;

        return new Promise((resolve) => {
          this.animationStartTime = undefined;
          requestAnimationFrame((t) =>
            this._animate(t, () => {
              resolve();
            })
          );
        });
      }

      /**
       * Recursively animates a {@link Reel}
       * @private
       * @param {number} currTime
       * @param {function} callback function executed when animation finishes
       * @returns {undefined}
       */
      _animate(currTime, callback) {
        if (!this.animationStartTime) {
          this.animationStartTime = currTime;
        }

        const elapsedTime = Math.floor(currTime - this.animationStartTime);

        let positionReached = false;

        let newReelPosition = this.animateFunction(
          elapsedTime,
          0,
          this.reelHeight - this.digitHeight,
          this.animationDurationInMs
        );

        newReelPosition = Math.ceil(newReelPosition);

        // because newReelPosition can start decreasing depending on the elapsedTime
        if (newReelPosition >= this.currentReelPosition) {
          this.currentReelPosition = newReelPosition;

          if (newReelPosition > this.reelHeight - this.digitHeight) {
            newReelPosition = this.reelHeight - this.digitHeight;
          }

          this.reel.style.marginTop = `${
            newReelPosition * (this.isDecreasing ? 1 : -1)
          }px`;
          positionReached =
            this.reelHeight - this.digitHeight == newReelPosition;
        } else {
          const marginTop =
            (this.reelHeight - this.digitHeight) * (this.isDecreasing ? 1 : -1);
          this.reel.style.marginTop = `${marginTop}px`;
          positionReached = true;
        }

        if (positionReached) {
          callback();
          return;
        }

        requestAnimationFrame((t) => this._animate(t, callback));
      }
    }
    /**
     * Parses a numeric value, extracts and returns the next object:
     * @property {object} Value
     * @property {string} Value.decimalDigits
     * @property {string } Value.exp
     * @property {boolean} Value.hasDot
     * @property {string} Value.integerDigits
     * @property {boolean} Value.isNegative
     *
     * Also exposes some utility methods:
     * @property {function} Value.isometricfyValues(number, number, 'left'|'right')
     * @property {function} isometricfyWithValue(number, object)
     */
    class Value {
      constructor(value) {
        const numberStr = value.toString();
        const match = numberStr.match(/(-?)(\d*)(\.?)(\d*)(e[\-+]\d+)?/);

        if (!match) {
          throw Error(`Unable to parse the value: ${numberStr}`);
        }

        this.value = +value;
        this.isNegative = !!match[1];
        this.integerDigits = match[2];
        this.hasDot = !!match[3];
        this.decimalDigits = match[4];
        this.exp = match[5];
      }

      /**
       * Makes the caller Value to have the same length as the value2 argument using the given config
       * @param {Value} value2 a Value instance
       * @param {object} cfg a config object
       * @returns {[NormalizedValue, NormalizedValue]}
       */
      isometricfyWithValue(value2, cfg) {
        let [normalValue1Integer, normalValue2Integer] = this.isometricfyValues(
          this.integerDigits,
          value2.integerDigits
        );

        normalValue1Integer = _zeroPadding(
          normalValue1Integer,
          cfg.minIntegersLength
        );
        normalValue2Integer = _zeroPadding(
          normalValue2Integer,
          cfg.minIntegersLength
        );

        const shouldBeCommafied =
          _commafyString(value2.integerDigits, cfg.radixMark).indexOf(
            cfg.radixMark
          ) != -1;

        if (cfg.commafyLeadingZeros || shouldBeCommafied) {
          normalValue1Integer = _commafyString(
            normalValue1Integer,
            cfg.radixMark
          );
          normalValue2Integer = _commafyString(
            normalValue2Integer,
            cfg.radixMark
          );
        }

        let [normalValue1Decimals, normalValue2Decimals] =
          this.isometricfyValues(
            this.decimalDigits,
            value2.decimalDigits,
            'right'
          );
        normalValue1Decimals = _zeroPadding(
          normalValue1Decimals,
          cfg.minDecimalsLength,
          'right'
        );
        normalValue2Decimals = _zeroPadding(
          normalValue2Decimals,
          cfg.minDecimalsLength,
          'right'
        );

        /**
         * @typedef NormalizedValue
         * @type {object}
         * @property {boolean} isNegative
         * @property {string} integerDigits
         * @property {boolean} hasDot
         * @property {string} decimalDigits
         * @property {string} exp
         * @property {number} value
         * @property {string} isometricValueStr
         */
        /**
         * @type {NormalizedValue}
         */
        const normalizedComponents1 = {
          decimalDigits: normalValue1Decimals,
          exp: this.exp,
          hasDot: !!normalValue1Decimals.length,
          integerDigits: normalValue1Integer,
          isNegative: this.isNegative,
          value: this.value,
          isometricValueStr:
            (this.isNegative ? '-' : '') +
            normalValue1Integer +
            (!!normalValue1Decimals.length ? '.' : '') +
            normalValue1Decimals,
        };

        /**
         * @type {NormalizedValue}
         */
        const normalizedComponents2 = {
          isNegative: value2.isNegative,
          integerDigits: normalValue2Integer,
          hasDot: !!normalValue2Decimals.length,
          decimalDigits: normalValue2Decimals,
          exp: value2.exp,
          value: value2.value,
          isometricValueStr:
            (value2.isNegative ? '-' : '') +
            normalValue2Integer +
            (!!normalValue2Decimals ? '.' : '') +
            normalValue2Decimals,
        };
        return [normalizedComponents1, normalizedComponents2];
      }

      /**
       * Makes the caller value1 to have the same length as the value2 filling the
       * gaps with zeroes to the given side
       * @param {Value} value1 a Value instance
       * @param {Value} value2 a Value instance
       * @param {('left'|'right')} side side to fill with zeroes, defaults to 'left'
       * @returns {[NormalizedValue, NormalizedValue]}
       */
      isometricfyValues(value1, value2, side = 'left') {
        return [
          _zeroPadding(value1, value2.length, side),
          _zeroPadding(value2, value1.length, side),
        ];
      }
    }

    /**
     * @description adds zeros to the left or right of the value
     * to make it have the valueLength.
     * @param {string} value the value to be padded
     * @param {number} valueLength the length of the value
     * @param {string} side 'left' | 'right'  default is 'left'
     * @returns {string} the padded value with zeros
     * @example zeroPadding('123', 5) => '00123'
     * @example zeroPadding('123', 5, 'right') => '12300'
     */
    function _zeroPadding(value, valueLength, side = 'left') {
      value = value + '';
      while (value.length < valueLength) {
        if (side == 'left') {
          value = '0' + value;
        } else {
          value += '0';
        }
      }

      return value;
    }

    /**
     * Separates the valueStr in thousands with commas (or the given radixMark)
     * @param {string} valueStr the value to be commafied
     * @param {string} radixMark the radix mark to be used default is ','
     * @returns {string} the valueStr with thousands separated by the given radixMark
     * @example commafyString('123') => '123'
     * @example commafyString('1234') => '1,234'
     * @example commafyString('0000012') => '0,000,012'
     */
    function _commafyString(valueStr, radixMark = ',') {
      return (
        valueStr &&
        valueStr
          .replace(/,/g, '')
          .split('')
          .reverse()
          .join('')
          .match(/.{1,3}/g)
          .join(radixMark)
          .split('')
          .reverse()
          .join('')
      );
    }

    /**
     * @param {Object} options
     * @description validates the radixMark and decimalMark
     * and throws an error if they are not supported
     * or if they are equal to each other
     * @throws {Error} if the radixMark or decimalMark are not supported
     * or if they are equal to each other
     * @returns {void}
     */
    function _validateRadixMarks(options) {
      const style = "style='color: black !important;'";

      if (
        options.radixMark &&
        !supportedRadixMarks.includes(options.radixMark)
      ) {
        const error = `Unsupported radixMark: '${options.radixMark}'`;
        element.innerHTML = `<div ${style}>${error}</div>`;
        element.classList.add('odo-error');
        throw Error(error);
      }
      if (
        options.decimalMark &&
        !supportedDecimalMarks.includes(options.decimalMark)
      ) {
        const error = `Unsupported decimalMark: '${options.decimalMark}'`;
        element.innerHTML = `<div ${style}>${error}</div>`;
        element.classList.add('odo-error');
        throw Error(error);
      }
      if (
        options.radixMark &&
        options.decimalMark &&
        options.radixMark === options.decimalMark
      ) {
        const error = 'Error: radixMark and decimalMark are equal';
        element.innerHTML = `<div ${style}>${error}</div>`;
        element.classList.add('odo-error');
        throw Error(error);
      }
    }

    /**
     * @param {HTMLElement} element
     * @param {Object} fromValueObj old value
     * @param {Object} toValueObj new value
     * @returns {Reel[]} Array of {@link Reel} instances
     * @description builds the reels and returns an array of Reel instances
     */
    function _buildReels(element, { fromValueObj, toValueObj }) {
      element.innerHTML = '';

      if (config.currencySymbol) {
        /* currency symbol must be outside digits list so that it can be
          positioned easily at start|end in a flex container. */

        const currencyWrapper = document.createElement('div');
        currencyWrapper.classList.add('currency');
        currencyWrapper.textContent = config.currencySymbol;
        element.appendChild(currencyWrapper);

        if (config.currencyPosition === 'end') {
          element.classList.add('currency-end');
        } else {
          element.classList.remove('currency-end');
        }
      }

      if (toValueObj.isNegative) {
        const signWrapper = document.createElement('div');
        signWrapper.classList.add('number-sign');
        signWrapper.textContent = '-';
        element.appendChild(signWrapper);
      }

      const isDecreasing = toValueObj.value < fromValueObj.value;

      const reelsWrapper = document.createElement('div');
      reelsWrapper.classList.add('reels');
      if (isDecreasing) {
        reelsWrapper.classList.add('reversed');
      }
      element.appendChild(reelsWrapper);

      const reelArray = [];

      const symbolsMatrix = _createSymbolsMatrix(fromValueObj, toValueObj);

      const reelClasses = _getReelClasses(toValueObj);

      symbolsMatrix.forEach((symbolsVector, idx) => {
        const reel = new Reel(symbolsVector, {
          reelClasses: reelClasses[idx],
          radixMark: config.radixMark,
          decimalMark: config.decimalMark,
          isDecreasing,
        });

        reelsWrapper.appendChild(reel.reelWrapper);

        reelArray.push(reel);
      });

      return reelArray;
    }

    /**
     * Creates an array of numbers from the startVal to the endVal with the given order
     * N times given the loops argument
     *
     * @param {number} startVal the start value
     * @param {number} endVal the end value
     * @param {number} loops the number of loops
     * @param {string} order 'ASC' | 'DESC' default is 'ASC'
     * @returns {string[]} Array of symbolsVector (numbers or radix marks)
     * @example _createsymbolsVector(0, 9, 1, 'ASC') => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     * @example _createsymbolsVector(0, 9, 2, 'ASC') => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     */
    function _createsymbolsVector(startVal, endVal, loops = 1, order = 'ASC') {
      startVal = +startVal;
      endVal = +endVal;

      let digits = [];
      let currLoop = 0;

      do {
        order == 'ASC'
          ? digits.push(startVal % 10)
          : digits.unshift(startVal % 10);

        if (startVal % 10 === endVal) {
          currLoop++;
        }

        startVal += order == 'DESC' ? -1 : 1;
        if (startVal < 0) {
          startVal = 9;
        }
      } while (currLoop <= loops);

      return digits;
    }

    /**
     * Creates the symbols matrix (numbers or radix marks) from the fromNormalValueObj to the toNormalValueObj
     * @param {Object} fromNormalValueObj the from value object
     * @param {Object} toNormalValueObj the to value object
     * @returns {string[][]} Matrix of symbols (numbers or radix marks)
     */
    function _createSymbolsMatrix(fromNormalValueObj, toNormalValueObj) {
      const order =
        toNormalValueObj.value < fromNormalValueObj.value ? 'DESC' : 'ASC';

      let symbolsMatrix = [];
      let loops = 0;
      let digitHasChanged = false;

      const fromVal = fromNormalValueObj.isometricValueStr
        .replace('-', '')
        .replace('.', config.decimalMark);

      const toVal = toNormalValueObj.isometricValueStr
        .replace('-', '')
        .replace('.', config.decimalMark);

      const targetValueNormalizedLen = toVal.length;

      for (let i = 0; i < targetValueNormalizedLen; i++) {
        if (!digitHasChanged && fromVal[i] !== toVal[i]) {
          digitHasChanged = true;
        }

        if (
          [config.radixMark, config.decimalMark].includes(toVal[i]) ||
          (fromVal[i] === toVal[i] && !digitHasChanged)
        ) {
          symbolsMatrix.push([toVal[i]]);
          continue;
        }

        symbolsMatrix.push(
          _createsymbolsVector(fromVal[i], toVal[i], loops, order)
        );

        loops++;
      }

      return symbolsMatrix;
    }

    /**
     * @param {Array} reels the reels to be removed
     * @param {string} targetValueNormalized the target value normalized
     * @description removes the remaining leading zeros and radix marks
     * from the reels
     */
    function _removeRemainingLeadingZerosAndRadix(
      reels,
      targetValueNormalized
    ) {
      const intPart = targetValueNormalized
        .replace('-', '')
        .split(config.decimalMark)[0];

      const intPartCleaned = intPart.replace(
        new RegExp(`\\${config.radixMark || ' '}`, 'g'),
        ''
      );

      let intPartCleanedLen = intPartCleaned.length;

      let idx = 0;
      while (
        intPartCleanedLen > config.minIntegersLength &&
        intPartCleaned[idx] === '0'
      ) {
        reels[idx].reelWrapper.classList.add('remaining-reel');
        ((i) =>
          setTimeout(() => {
            reels[i].reelWrapper.remove();
          }, 400))(idx);
        idx++;
        intPartCleanedLen--;
      }

      const radixMarks = element.querySelectorAll('.radix-mark');
      let radixMarksLen = radixMarks.length;
      if (radixMarksLen) {
        let firstRadixPosition = 3 * radixMarksLen + 1;

        while (firstRadixPosition > intPartCleanedLen) {
          radixMarks[0].classList.add('remaining-reel');
          setTimeout(() => {
            radixMarks[0].remove();
          }, 400);
          firstRadixPosition -= 3;
        }
      }
    }

    /**
     * @param {Object} valueObj the value object
     * @returns {Array} of classes
     * @description returns an array of classes for the reels
     */
    function _getReelClasses(valueObj) {
      let [intPart, decimalPart = ''] = [
        valueObj.integerDigits,
        valueObj.decimalDigits,
      ];

      const intPartCleanArray = intPart.replace(
        new RegExp(`\\${config.radixMark || ' '}`, 'g'),
        ''
      );

      let intPartCleanLen = intPartCleanArray.length - 1;

      let reelClasses = [];
      intPart.split('').forEach((val) => {
        reelClasses.push(
          ![config.radixMark, config.decimalMark].includes(val)
            ? `_1e${intPartCleanLen--} integer`
            : 'radix-mark'
        );
      });

      if (decimalPart) {
        reelClasses.push('decimal-mark');
        decimalPart
          .split('')
          .forEach((val, idx) => reelClasses.push(`_1e-${idx + 1} decimal`));
      }

      return reelClasses;
    }

    /**
     * Overwrites the default config with the user options
     * @param {OdoConfig} userOptions custom options
     */
    function _setUserOptions(userOptions) {
      _validateRadixMarks(userOptions);
      //const options = Object.assign(this.defaultOptions, userOptions);

      // normalize, validate or set default values (if needed)
      config.radixMark = supportedRadixMarks.includes(userOptions.radixMark)
        ? userOptions.radixMark
        : defaultConfig.radixMark;
      config.decimalMark = supportedDecimalMarks.includes(
        userOptions.decimalMark
      )
        ? userOptions.decimalMark
        : defaultConfig.decimalMark;

      config.currencySymbol = userOptions.currencySymbol;
      config.currencyPosition = supportedCurrencyPositions.includes(
        (userOptions.currencyPosition || '').toLowerCase()
      )
        ? userOptions.currencyPosition
        : defaultConfig.currencyPosition;

      config.commafyLeadingZeros =
        userOptions.commafyLeadingZeros || defaultConfig.commafyLeadingZeros;
      config.minIntegersLength =
        +userOptions.minIntegersLength > 0 ? +userOptions.minIntegersLength : 1;
      config.minDecimalsLength =
        +userOptions.minDecimalsLength > -1
          ? +userOptions.minDecimalsLength
          : 0;
      config.animationDurationInMs =
        userOptions.animationDurationInMs ||
        defaultConfig.animationDurationInMs;
      config.animateFunction =
        typeof userOptions.animateFunction === 'function'
          ? userOptions.animateFunction
          : _easeOutQuad;
    }

    /**
     * Function used to animate a {@link Reel}
     * @param {number} t elapsedtime
     * @param {number} b start position
     * @param {number} c end position
     * @param {number} d animate duration
     * @returns {number} position at time t
     * @see {@link https://spicyyoghurt.com/tools/easing-functions|More easing functions }
     */
    function _easeOutQuad(t, b, c, d) {
      return -c * (t /= d) * (t - 2) + b;
    }

    /**
     * @return {number} the current value shown
     */
    API.getCurrentValue = () => {
      return Number(currentValue);
    };

    /**
     * @param {string} character
     */
    API.setRadixMark = (character = '') => {
      //make sure we use a single character
      character = character.charAt(0);
      config.radixMark = supportedRadixMarks.includes(character)
        ? character
        : defaultConfig.radixMark;

      const elements = element.querySelectorAll('.radix-mark');

      [].forEach.call(elements, (e) => {
        e.firstChild.textContent = character;
      });
    };
    /**
     * @param {string} character
     */
    API.setDecimalMark = (character = '.') => {
      //make sure we use a single character
      character = character.charAt(0);
      config.decimalMark = supportedDecimalMarks.includes(character)
        ? character
        : defaultConfig.decimalMark;

      const element = element.querySelector('.decimal-mark');

      if (element) {
        element.firstChild.textContent = character;
      }
    };

    /**
     * @param {number} length
     */
    API.setLeadingZerosLenght = (length = 0) => {
      config.minIntegersLength = length > 0 ? +length : 1;
    };
    /**
     * @param {number} length
     */
    API.setTrailingZerosLenght = (length = 0) => {
      config.minDecimalsLength = length > -1 ? +length : 0;
    };

    /**
     * @param {string} position
     */
    API.setCurrencyPosition = (position = 'start') => {
      position = position.toLocaleLowerCase();
      this.currencyPosition = supportedCurrencyPositions.includes(position)
        ? position
        : defaultConfig.currencyPosition;

      if (this.currencyPosition === 'end') {
        element.classList.add('currency-end');
      } else {
        element.classList.remove('currency-end');
      }
    };

    API.getCurrentOptions = () => {
      //return a brand new object so that the real config cannot be modified (except for setters!)
      return Object.assign({}, config);
    };

    /**
     * Sets a new value
     * @param {number | string} newValue
     */
    API.set = (newValue) => {
      newValue = +newValue;
      if (newValue === currentValue) {
        return;
      }

      const oldValueComponents = new Value(currentValue);
      const newValueComponents = new Value(newValue);

      const [isometricOldValue, isometricNewValue] =
        oldValueComponents.isometricfyWithValue(newValueComponents, config);

      const reels = _buildReels(element, {
        fromValueObj: isometricOldValue,
        toValueObj: isometricNewValue,
      });

      const promises = [];
      reels.forEach((reel) =>
        promises.push(
          reel.animateReel({
            animateFunction: config.animateFunction,
            animationDurationInMs: config.animationDurationInMs,
          })
        )
      );

      Promise.all(promises).then(() => {
        _removeRemainingLeadingZerosAndRadix(
          reels,
          isometricNewValue.isometricValueStr
        );
      });

      element.dataset.number = newValue;
      element.dataset.string = isometricNewValue.isometricValueStr;

      currentValue = newValue;
    };

    _setUserOptions(userOptions);

    API.set(userOptions.initValue);

    return API;
  }
)();
