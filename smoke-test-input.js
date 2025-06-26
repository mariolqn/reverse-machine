function getDoubleSum(firstNumber, secondNumber) {
  var sum = firstNumber + secondNumber;
  return sum * 2;
}
const convertToString = function (valueToConvert) {
  return valueToConvert.toString();
};
class ValueHolder {
  constructor(initialValue) {
    this.storedValue = initialValue;
  }
  getValue() {
    return this.storedValue;
  }
}
