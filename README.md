# A simple animated odometer with support for:

-   Negative numbers
-   Customizable currency symbol
-   Customizable separator radix mark
-   Customizable decimal radix mark
-   Configurable leading/trailing zeros
-   Commafy strings like 000000.01 to 000,000.01

## USAGE

-   Copy the src folder (or its content) into your project
-   Include a reference to `Odometer.js`
-   Include a refernece to `` css

```html
<script src="./src/simpler-odometer.js"></
<link rel="stylesheet" type="text/css" href="src/simpler-odometer.css" />
```

-   Create a configuration object:

```js
// current default values, include/overwrite what you need
const odoConfig = {
    initValue: 0, //{number|string}
    radixMark: ',', // {string}, leave it empty if you don't want a (thousands, million, etc) separator
    decimalMark: '.', // {string}, if empty, a '.' will be used (when number has decimals)
    currencySymbol: '$', // {string} //optional
    currencyPosition: 'start', // {'start'|'end'}
    commafyLeadingZeros: false, // commafies strings like: 000000.01 to 000,000.01
    lengthWithLeadingZeros: 8, // {number}
    decimalsLengthWithTrailingZeros: 2, // {number}
    animationDurationInMs: 1800, // {number}
    animationDelayInMs: 0, // {number}
};
```

-   Get a reference to the HTML element where the Odometer widget will be attached

```js
const elementTag = document.getElementById('#identifier');
```

-   Create an instance of Odometer and pass in your configuration object

```js
const odo = Odometer(elementTag, odoConfig).create();
```

-   Use the update() method to update the widget

```js
const someNewValue = 1234.565;

odo.update(someNewValue);

// Also you can retrieve the current value to add it other amount:
// const prevValue = odo.getCurrentValue();
// const someNewValue = prevValue + 1234.565;
// odo.update(someNewValue);
```

## API

### Setters

-   Odometer exposes various setters for you to adjust the next attributes on runtime (they'll be rendered on next call to update() method):

```js
//updates the currency position:
odo.setCurrencyPosition;
//eg.: odo.setCurrencyPosition('start') // posible values: 'start', 'end'

//updates the radix separator (thousands, millions, ...) mark:
odo.setSeparatorRadixMark;
//eg.: odo.setSeparatorRadixMark(',')

//updates the decimal radix mark:
odo.setDecimalRadixMark;
//eg.: odo.setDecimalRadixMark('.')

// Adds leading zeros to the number
// when the number length ( = [decimal part with trailing zeros] + [integer parts])
// is less than the value set
odo.setLeadingZerosLenght;
//eg.: odo.leadingZerosLenght(6);

//updates the trailing zeros amount:
odo.setTrailingZerosLenght;
//eg.: odo.setTrailingZerosLenght(3)
```

### Getters

-   Beside the update method, Odometer exposes only one method to retrieve its current value:

```js
/**
 * @return {string} the current value shown
 */
getCurrentValue();

/**
 * @returns {Object} the config object (with the user values)
 */
getCurrentOptions()

/**
 * @returns ['', ' ', ',', '.', '\'', '˙']
 */
getSupportedRadixMarks()

/**
 * @returns [',', '.']
 */
getSupportedDecimalMarks()
```

## Thats's it. Enjoy it, contribute with your knowledge and happy coding!
