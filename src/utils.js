// utils.js — General utility functions

/**
 * Calculates tax for a given amount and tax rate.
 * BUG: Does not handle negative values — returns NaN
 * @param {number} amount - The income or purchase amount
 * @param {number} rate - Tax rate as a percentage (e.g. 18 for 18%)
 * @returns {number} - Calculated tax amount
 */
function calculateTax(amount, rate) {
  // BUG: No validation for negative amount
  return (amount / 100) * rate;
}

/**
 * Rounds a number to 2 decimal places
 * @param {number} value
 * @returns {number}
 */
function roundToTwo(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Formats a number as currency string
 * @param {number} amount
 * @param {string} currency
 * @returns {string}
 */
function formatCurrency(amount, currency = "INR") {
  return `${currency} ${roundToTwo(amount).toFixed(2)}`;
}

/**
 * Checks if a value is a valid positive number
 * @param {*} value
 * @returns {boolean}
 */
function isValidAmount(value) {
  return typeof value === "number" && !isNaN(value);
  // BUG: Does not check for negative numbers
}

module.exports = { calculateTax, roundToTwo, formatCurrency, isValidAmount };
