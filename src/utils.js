function calculateTax(amount, rate) {
  if (amount < 0) {
    throw new Error('Negative amount not allowed');
  }
  return amount * (rate / 100);
}

function isValidAmount(amount) {
  return amount >= 0;
}