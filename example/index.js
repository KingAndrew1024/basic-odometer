// Element to render the ODOMETER
const myElementTag = document.getElementById('odometer');
const currencies = ['$', '€', '¥', '£'];

// Odometer config params
const odoConfig = {
  initValue: 123,
  // radixMark supported values: ['', ',', "'", '˙', '.', ' ']
  // see https://docs.oracle.com/cd/E19455-01/806-0169/overview-9/index.html
  // and http://www.linguafin.com/index.php?p=thousand+separators+and+decimals
  radixMark: ',',
  /* decimalMark: '.', */
  currencySymbol: currencies[0],
  /* currencyPosition: 'end', */
  commafyLeadingZeros: true,
  minIntegersLength: 6,
  minDecimalsLength: 2,
  /* animationDurationInMs: 2500, */
};

const odoConfig2 = Object.assign({}, odoConfig);

// Initialization of Odometer
const odo = new Odometer(myElementTag, odoConfig);

/* const el = document.getElementById('odometer');
const odo = new Odometer(el, { initValue: 12340 });
setTimeout(() => {
  odo.set(-123.45);
}, 3000); */

(function initUI() {
  // sets the initial/current values for the (config params) inputs
  document.querySelector('#minIntegersLength').value =
    odoConfig.minIntegersLength || 1;
  document.querySelector('#minDecimalsLength').value =
    odoConfig.minDecimalsLength || 0;

  if (!odoConfig.currencySymbol) {
    document.querySelector('#currency-symbol-control').style.display = 'none';
  }
  document.querySelector('#currency-symbol').textContent =
    odoConfig.currencySymbol;
  if ((odoConfig.currencyPosition || '').toLowerCase() === 'end') {
    document.querySelector('#currency-end').setAttribute('checked', 'true');
  } else {
    document.querySelector('#currency-start').setAttribute('checked', 'true');
  }
})();

let intervalIdList = [];

function generateOdometers(num = 1) {
  const container = document.querySelector('.other-odos');
  container.innerHTML = '';

  let o;

  for (let i = 0; i < num; i++) {
    o = document.createElement('div');
    o.setAttribute('id', `odometer${i}`);
    container.appendChild(o);
    odoConfig2.currencySymbol = currencies[i % 4];
    odoConfig2.currencyPosition = i % 2 == 0 ? 'start' : 'end';
    odoConfig2.minDecimalsLength = i;
    const odox = new Odometer(o, odoConfig2);
    setTimeout(() => {
      let sign = Math.ceil(generateRandomNumber(2)) % 2 == 0 ? -1 : 1;

      let value = +(
        +odox.getCurrentValue().toFixed(i) +
        generateRandomNumber(99) * sign
      ).toFixed(i);

      odox.set(value);

      intervalIdList[i] = setInterval(() => {
        sign = Math.ceil(generateRandomNumber(2)) % 2 == 0 ? -1 : 1;
        value = +(
          +odox.getCurrentValue().toFixed(i) +
          generateRandomNumber(99) * sign
        ).toFixed(i);

        odox.set(value);
      }, (odoConfig2.animationDurationInMs || odox.getCurrentOptions().animationDurationInMs) + 500);
    }, generateRandomNumber(999));
  }

  o = document.createElement('div');
  o.style = 'width: initial; height:20px;';
  container.appendChild(o);
}

function createOdometers(num) {
  /* intervalIdList.forEach((interval) => {
        clearInterval(interval);
    });
    intervalIdList.length = 0; */

  if (num == 0) {
    const wrapper = document.querySelector('.other-odos');
    wrapper.innerHTML = '';
    return;
  }

  generateOdometers(num);
}

function generateRandomNumber(base = 99) {
  const n = Math.random() * base;
  return n;
}

let intervalRef = undefined;
let intervalActive = false;

function toggleInterval() {
  intervalActive = !intervalActive;

  toggleDisableControls(!intervalActive);

  const intervalBtn = document.querySelector('#playLoop');
  intervalBtn.classList.toggle('active');

  if (!intervalActive) {
    clearInterval(intervalRef);
    intervalBtn.innerHTML = 'START LOOP';
    return;
  }

  intervalBtn.innerHTML = 'STOP LOOP';

  const isFloat = document.querySelector('#randomNegativeRadio').checked;

  addRandom(isFloat);
  intervalRef = setInterval(() => {
    addRandom(isFloat);
  }, (odoConfig.animationDurationInMs || odo.getCurrentOptions().animationDurationInMs) + 500 /* numbers animation lasts 2000ms, so set this timeout greater */);
}

function toggleDisableControls(disable) {
  const inputs = [
    document.querySelector('#setValueBtn'),
    document.querySelector('#addValueBtn'),
    document.querySelector('#randomPositiveRadio'),
    document.querySelector('#randomNegativeRadio'),
  ];

  inputs.forEach((input) => {
    disable
      ? input.removeAttribute('disabled')
      : input.setAttribute('disabled', true);
  });
}

function addRandom(addFloatNumber = false) {
  const fromVal = odo.getCurrentValue();

  const base = 99;

  let inc = Math.random() * base - Math.floor(base / 2);
  let toVal;
  if (addFloatNumber) {
    inc = +inc.toFixed(odoConfig.minDecimalsLength);
    toVal = (fromVal + inc).toFixed(odoConfig.minDecimalsLength);
  } else {
    inc = Math.floor(inc);
    toVal = (inc + +fromVal).toFixed(odoConfig.minDecimalsLength);
  }

  odo.set(toVal);
}

function addValue() {
  const input = +document.querySelector('#inputval').value;

  if (!input) {
    console.log('no input was received', input);
    return;
  }

  const fromVal = odo.getCurrentValue();

  let toVal = fromVal + input;

  toVal = toVal.toFixed(odoConfig.minDecimalsLength);

  odo.set(toVal);
}

function setValue() {
  const targetVal = document.querySelector('#inputval').value;

  if (targetVal == '') {
    return;
  }

  odo.set(parseInt(targetVal).toFixed(odoConfig.minDecimalsLength));
}
const markWidth = getComputedStyle(document.documentElement).getPropertyValue(
  '--mark-width'
);
function updateRadixSeparator(evt) {
  odo.setRadixMark(evt.target.value);
  if (evt.target.value === '') {
    document.documentElement.style.setProperty('--mark-width', '0px');
  } else {
    document.documentElement.style.setProperty('--mark-width', markWidth);
  }
}

function updateDecimalSymbol(evt) {
  odo.setDecimalMark(evt.target.value);
}

function minIntegersLength(evt) {
  const len = +evt.target.value;
  odo.setLeadingZerosLenght(len > 10 ? 10 : len);
}

function minDecimalsLength(evt) {
  let len = +evt.target.value;
  let = len > 12 ? 12 : len;
  odo.setTrailingZerosLenght(len);
  odoConfig.minDecimalsLength = len;
}

function updateCurrencyPosition(position) {
  odo.setCurrencyPosition(position);
}
