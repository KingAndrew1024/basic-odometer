class Odometer {
  constructor(element, userOptions = {}) {
    // radixMark supported values: ['', ',', "'", '˙', '.', ' ']
    // see https://docs.oracle.com/cd/E19455-01/806-0169/overview-9/index.html
    // and http://www.linguafin.com/index.php?p=thousand+separators+and+decimals
    this._supportedRadixMarks = ['', ',', "'", '˙', '.', ' '];

    this._supportedDecimalMarks = ['.', ','];
    
    this._supportedCurrencyPositions = ['start', 'end'];
    
    this._defaultConfig = {
      initValue: 0,
      radixMark: this._supportedRadixMarks[0],
      decimalMark: this._supportedDecimalMarks[0],
      currencySymbol: '',
      currencyPosition: this._supportedCurrencyPositions[0],
      commafyLeadingZeros: false, // commafies strings like: 000000.01 to 000,000.01
      minIntegersLength: 1,
      minDecimalsLength: 0,
      animationDurationInMs: 1800,
      animateFunction: this.easeOutQuad,
    };

    this.config = {};
    this.currentValue = '';
    this.animationStartTime = undefined;
    this.currentReelPositions = [];

    this.element = element;
    this.element.classList.add('odometer');

    this.setUserOptions(userOptions);
    this.set(userOptions.initValue);
  }

  /**
   * Sets a new value
   * @param {number | string} newValue
   */
  set(newValue) {
    newValue = +newValue;
    if (newValue === this.currentValue) {
      return;
    }

    const oldValueComponents = new Value(this.currentValue);
    const newValueComponents = new Value(newValue);

    const [isometricOldValue, isometricNewValue] =
      oldValueComponents.isometricfyWithValue(newValueComponents, this.config);

    const reels = this.buildReels(this.element, {
      fromValueObj: isometricOldValue,
      toValueObj: isometricNewValue,
    });

    const promises = [];
    reels.forEach((reel) =>
      promises.push(
        reel.animateReel({
          animateFunction: this.config.animateFunction,
          animationDurationInMs: this.config.animationDurationInMs,
        })
      )
    );

    Promise.all(promises).then(() => {
      this.removeRemainingLeadingZerosAndRadix(
        reels,
        isometricNewValue.isometricValueStr
      );
    });

    this.element.dataset.number = newValue;
    this.element.dataset.string = isometricNewValue.isometricValueStr;

    this.currentValue = newValue;
  }

  /**
   * @return {string} the current value shown
   */
  getCurrentValue() {
    return Number(this.currentValue);
  }

  /**
   * @param {string} character
   */
  setRadixMark(character = '') {
    //make sure we use a single character
    character = character.charAt(0);
    this.config.radixMark = this._supportedRadixMarks.includes(character)
      ? character
      : this._defaultConfig.radixMark;

    const elements = this.element.querySelectorAll('.radix-mark');

    [].forEach.call(elements, (e) => {
      e.firstChild.textContent = character;
    });
  }
  /**
   * @param {string} character
   */
  setDecimalMark(character = '.') {
    //make sure we use a single character
    character = character.charAt(0);
    this.config.decimalMark = this._supportedDecimalMarks.includes(character)
      ? character
      : this._defaultConfig.decimalMark;

    const element = this.element.querySelector('.decimal-mark');

    if (element) {
      element.firstChild.textContent = character;
    }
  }

  /**
   * @param {number} length
   */
  setLeadingZerosLenght(length = 0) {
    this.config.minIntegersLength = length > 0 ? +length : 1;
  }
  /**
   * @param {number} length
   */
  setTrailingZerosLenght(length = 0) {
    this.config.minDecimalsLength = length > -1 ? +length : 0;
  }

  /**
   * @param {string} position
   */
  setCurrencyPosition(position = 'start') {
    position = position.toLocaleLowerCase();
    this.currencyPosition = this._supportedCurrencyPositions.includes(position)
      ? position
      : this._defaultConfig.currencyPosition;

    if (this.currencyPosition === 'end') {
      this.element.classList.add('currency-end');
    } else {
      this.element.classList.remove('currency-end');
    }
  }

  getCurrentOptions() {
    //return a brand new object so that the real config cannot be modified (except for setters!)
    return Object.assign({}, this.config);
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
  validateRadixMarks(options) {
    const style = "style='color: black !important;'";

    if (
      options.radixMark &&
      !this._supportedRadixMarks.includes(options.radixMark)
    ) {
      const error = `Unsupported radixMark: '${options.radixMark}'`;
      this.element.innerHTML = `<div ${style}>${error}</div>`;
      this.element.classList.add('odo-error');
      throw Error(error);
    }
    if (
      options.decimalMark &&
      !this._supportedDecimalMarks.includes(options.decimalMark)
    ) {
      const error = `Unsupported decimalMark: '${options.decimalMark}'`;
      this.element.innerHTML = `<div ${style}>${error}</div>`;
      this.element.classList.add('odo-error');
      throw Error(error);
    }
    if (
      options.radixMark &&
      options.decimalMark &&
      options.radixMark === options.decimalMark
    ) {
      const error = 'Error: radixMark and decimalMark are equal';
      this.element.innerHTML = `<div ${style}>${error}</div>`;
      this.element.classList.add('odo-error');
      throw Error(error);
    }
  }

  /**
   * @param {Object} valueComponents1 the first value components
   * @param {Object} valueComponents2 the second value components
   * @returns {Array} of normalized value components
   *
   * @description normalizes the value components to have the same length
   */
  isometricfyValueComponents(valueComponents1, valueComponents2) {
    let [normalValue1Integer, normalValue2Integer] = this.isometricfyValues(
      valueComponents1.integerDigits,
      valueComponents2.integerDigits
    );
    normalValue1Integer = zeroPadding(
      normalValue1Integer,
      this.config.minIntegersLength
    );
    normalValue2Integer = zeroPadding(
      normalValue2Integer,
      this.config.minIntegersLength
    );
    if (this.config.radixMark || this.config.commafyLeadingZeros) {
      normalValue1Integer = commafyString(
        normalValue1Integer,
        this.config.radixMark
      );
      normalValue2Integer = commafyString(
        normalValue2Integer,
        this.config.radixMark
      );
    }

    let [normalValue1Decimals, normalValue2Decimals] = this.isometricfyValues(
      valueComponents1.decimalDigits,
      valueComponents2.decimalDigits,
      'right'
    );
    normalValue1Decimals = zeroPadding(
      normalValue1Decimals,
      this.config.minDecimalsLength,
      'right'
    );
    normalValue2Decimals = zeroPadding(
      normalValue2Decimals,
      this.config.minDecimalsLength,
      'right'
    );

    const normalizedComponents1 = {
      decimalDigits: normalValue1Decimals,
      exp: valueComponents1.exp,
      hasDot: !!normalValue1Decimals.length,
      integerDigits: normalValue1Integer,
      isNegative: valueComponents1.isNegative,
      value: valueComponents1.value,
      isometricValueStr:
        (valueComponents1.isNegative ? '-' : '') +
        normalValue1Integer +
        (!!normalValue1Decimals.length ? '.' : '') +
        normalValue1Decimals,
    };
    const normalizedComponents2 = {
      isNegative: valueComponents2.isNegative,
      integerDigits: normalValue2Integer,
      hasDot: !!normalValue2Decimals.length,
      decimalDigits: normalValue2Decimals,
      exp: valueComponents2.exp,
      value: valueComponents2.value,
      isometricValueStr:
        (valueComponents2.isNegative ? '-' : '') +
        normalValue2Integer +
        (!!normalValue2Decimals ? '.' : '') +
        normalValue2Decimals,
    };
    return [normalizedComponents1, normalizedComponents2];
  }

  /**
   * @param {HTMLElement} element
   * @param {Object} fromValueObj
   * @param {Object} toValueObj
   * @returns {Array} of Reel instances
   * @description builds the reels and returns an array of Reel instances
   */
  buildReels(element, { fromValueObj, toValueObj }) {
    element.innerHTML = '';

    if (this.config.currencySymbol) {
      /* currency symbol must be outside digits list so that it can be
          positioned easily at start|end in a flex container. */

      const currencyWrapper = document.createElement('div');
      currencyWrapper.classList.add('currency');
      currencyWrapper.textContent = this.config.currencySymbol;
      element.appendChild(currencyWrapper);

      if (this.config.currencyPosition === 'end') {
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

    const symbolsMatrix = this.creatSymbolsMatrix(fromValueObj, toValueObj);

    const reelClasses = this.getReelClasses(toValueObj);

    symbolsMatrix.forEach((symbolsVector, idx) => {
      const reel = new Reel(symbolsVector, {
        reelClasses: reelClasses[idx],
        radixMark: this.config.radixMark,
        decimalMark: this.config.decimalMark,
        isDecreasing,
      });

      reelsWrapper.appendChild(reel.reelWrapper);

      reelArray.push(reel);
    });

    return reelArray;
  }

  /**
   * @param {number} startVal the start value
   * @param {number} endVal the end value
   * @param {number} loops the number of loops
   * @param {string} order 'ASC' | 'DESC' default is 'ASC'
   * @returns {Array} of symbolsVector (numbers or radix marks)
   * @description creates the symbols vector
   * from the startVal to the endVal with the given order and loops
   * e.g. createsymbolsVector(0, 9, 1, 'ASC') => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
   */
  createsymbolsVector(startVal, endVal, loops = 1, order = 'ASC') {
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
   * @param {Object} fromNormalValueObj the from value object
   * @param {Object} toNormalValueObj the to value object
   * @returns {Array} of symbolsMatrix (numbers or radix marks)
   * @description creates the symbols matrix
   * from the fromNormalValueObj to the toNormalValueObj
   */
  creatSymbolsMatrix(fromNormalValueObj, toNormalValueObj) {
    const order =
      toNormalValueObj.value < fromNormalValueObj.value ? 'DESC' : 'ASC';

    let symbolsMatrix = [];
    let loops = 0;
    let digitHasChanged = false;

    const fromVal = fromNormalValueObj.isometricValueStr
      .replace('-', '')
      //.replace(/,/g, this.config.radixMark)
      .replace('.', this.config.decimalMark);

    const toVal = toNormalValueObj.isometricValueStr
      .replace('-', '')
      //.replace(/,/g, this.config.radixMark)
      .replace('.', this.config.decimalMark);

    const targetValueNormalizedLen = toVal.length;

    for (let i = 0; i < targetValueNormalizedLen; i++) {
      if (!digitHasChanged && fromVal[i] !== toVal[i]) {
        digitHasChanged = true;
      }

      if (
        [this.config.radixMark, this.config.decimalMark].includes(toVal[i]) ||
        (fromVal[i] === toVal[i] && !digitHasChanged)
      ) {
        symbolsMatrix.push([toVal[i]]);
        continue;
      }

      symbolsMatrix.push(
        this.createsymbolsVector(fromVal[i], toVal[i], loops, order)
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
  removeRemainingLeadingZerosAndRadix(reels, targetValueNormalized) {
    const intPart = targetValueNormalized
      .replace('-', '')
      .split(this.config.decimalMark)[0];

    const intPartCleaned = intPart.replace(
      new RegExp(`\\${this.config.radixMark || ' '}`, 'g'),
      ''
    );

    let intPartCleanedLen = intPartCleaned.length;

    let idx = 0;
    while (
      intPartCleanedLen > this.config.minIntegersLength &&
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

    const radixMarks = this.element.querySelectorAll('.radix-mark');
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
  getReelClasses(valueObj) {
    let [intPart, decimalPart = ''] = [
      valueObj.integerDigits,
      valueObj.decimalDigits,
    ];

    const intPartCleanArray = intPart.replace(
      new RegExp(`\\${this.config.radixMark || ' '}`, 'g'),
      ''
    );

    let intPartCleanLen = intPartCleanArray.length - 1;

    let reelClasses = [];
    intPart.split('').forEach((val) => {
      reelClasses.push(
        ![this.config.radixMark, this.config.decimalMark].includes(val)
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

  setUserOptions(userOptions) {
    this.validateRadixMarks(userOptions);
    //const options = Object.assign(this.defaultOptions, userOptions);

    // normalize, validate or set default values (if needed)
    this.config.radixMark = this._supportedRadixMarks.includes(
      userOptions.radixMark
    )
      ? userOptions.radixMark
      : this._defaultConfig.radixMark;
    this.config.decimalMark = this._supportedDecimalMarks.includes(
      userOptions.decimalMark
    )
      ? userOptions.decimalMark
      : this._defaultConfig.decimalMark;

    this.config.currencySymbol = userOptions.currencySymbol;
    this.config.currencyPosition = this._supportedCurrencyPositions.includes(
      (userOptions.currencyPosition || '').toLowerCase()
    )
      ? userOptions.currencyPosition
      : this._defaultConfig.currencyPosition;

    this.config.commafyLeadingZeros =
      userOptions.commafyLeadingZeros || this._defaultConfig.commafyLeadingZeros;
    this.config.minIntegersLength =
      +userOptions.minIntegersLength > 0 ? +userOptions.minIntegersLength : 1;
    this.config.minDecimalsLength =
      +userOptions.minDecimalsLength > -1 ? +userOptions.minDecimalsLength : 0;
    this.config.animationDurationInMs =
      userOptions.animationDurationInMs ||
      this._defaultConfig.animationDurationInMs;
    this.config.animateFunction =
      typeof userOptions.animateFunction === 'function'
        ? userOptions.animateFunction
        : this.easeOutQuad;
  }

  /**
   * More functions at https://spicyyoghurt.com/tools/easing-functions
   * @param {number} t elapsedtime
   * @param {number} b start position
   * @param {number} c end position
   * @param {number} d animate duration
   * @returns {number} position at time t
   */
  easeOutQuad(t, b, c, d) {
    return -c * (t /= d) * (t - 2) + b;
  }
}

class Reel {
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

  init(symbolsVector, reelClasses, radixMark, decimalMark) {
    reelClasses.split(' ').forEach((_class) => {
      _class && this.reelWrapper.classList.add(_class);
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
        this.__animate(t, () => {
          resolve();
        })
      );
    });
  }

  __animate(currTime, callback) {
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
      positionReached = this.reelHeight - this.digitHeight == newReelPosition;
    } else {
      const marginTop =
        (this.reelHeight - this.digitHeight) * (this.isDecreasing ? 1 : -1);
      this.reel.style.marginTop = `${marginTop}px`;
      positionReached = true;
    }

    if (positionReached) {
      return callback();
    }

    requestAnimationFrame((t) => this.__animate(t, callback));
  }
}

class Value {
  constructor(value) {
    const numberStr = value.toString();
    const match = numberStr.match(/(-?)(\d*)(\.?)(\d*)(e[\-+]\d+)?/);

    if (!match) {
      console.log('Unable to parse the value', numberStr);
      return;
    }

    this.value = +value;
    this.isNegative = !!match[1];
    this.integerDigits = match[2];
    this.hasDot = !!match[3];
    this.decimalDigits = match[4];
    this.exp = match[5];
  }

  isometricfyWithValue(value2, config) {
    let [normalValue1Integer, normalValue2Integer] = this.isometricfyValues(
      this.integerDigits,
      value2.integerDigits
    );

    normalValue1Integer = zeroPadding(
      normalValue1Integer,
      config.minIntegersLength
    );
    normalValue2Integer = zeroPadding(
      normalValue2Integer,
      config.minIntegersLength
    );

    const shouldBeCommafied =
      commafyString(value2.integerDigits, config.radixMark).indexOf(
        config.radixMark
      ) != -1;

    if (config.commafyLeadingZeros || shouldBeCommafied) {
      normalValue1Integer = commafyString(
        normalValue1Integer,
        config.radixMark
      );
      normalValue2Integer = commafyString(
        normalValue2Integer,
        config.radixMark
      );
    }

    let [normalValue1Decimals, normalValue2Decimals] = this.isometricfyValues(
      this.decimalDigits,
      value2.decimalDigits,
      'right'
    );
    normalValue1Decimals = zeroPadding(
      normalValue1Decimals,
      config.minDecimalsLength,
      'right'
    );
    normalValue2Decimals = zeroPadding(
      normalValue2Decimals,
      config.minDecimalsLength,
      'right'
    );

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

  isometricfyValues(value1, value2, side = 'left') {
    return [
      zeroPadding(value1, value2.length, side),
      zeroPadding(value2, value1.length, side),
    ];
  }
}

/**
 * @param {string} value the value to be padded
 * @param {number} valueLength the length of the value
 * @param {string} side 'left' | 'right'  default is 'left'
 * @returns {string} the padded value with zeros
 * @description adds zeros to the left or right of the value
 * to make it have the valueLength.
 * e.g. zeroPadding('123', 5) => '00123'
 * e.g. zeroPadding('123', 5, 'right') => '12300'
 */
function zeroPadding(value, valueLength, side = 'left') {
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
 * @param {string} valueStr the value to be commafied
 * @param {string} radixMark the radix mark to be used default is ','
 * @returns {string} the valueStr with commas
 * @description adds commas to the valueStr
 */
function commafyString(valueStr, radixMark = ',') {
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
