// helpers.js — Input validation and formatting helpers

const { isValidAmount, formatCurrency } = require("./utils");

/**
 * Validates and sanitizes user input before tax calculation
 * @param {*} input - Raw user input
 * @returns {{ valid: boolean, value: number, error: string | null }}
 */
function validateInput(input) {
  const parsed = parseFloat(input);

  if (isNaN(parsed)) {
    return { valid: false, value: null, error: "Input is not a number" };
  }

  // BUG: isValidAmount() doesn't check for negatives, so -500 passes through
  if (!isValidAmount(parsed)) {
    return { valid: false, value: null, error: "Invalid amount provided" };
  }

  return { valid: true, value: parsed, error: null };
}

/**
 * Generates a tax summary report string
 * @param {number} originalAmount
 * @param {number} taxAmount
 * @param {number} totalAmount
 * @param {string} category
 * @returns {string}
 */
function generateTaxSummary(originalAmount, taxAmount, totalAmount, category) {
  return `
============================
       TAX SUMMARY
============================
Category    : ${category.toUpperCase()}
Base Amount : ${formatCurrency(originalAmount)}
Tax Amount  : ${formatCurrency(taxAmount)}
Total       : ${formatCurrency(totalAmount)}
============================
  `.trim();
}

/**
 * Applies a discount before calculating tax
 * @param {number} amount
 * @param {number} discountPercent
 * @returns {number}
 */
function applyDiscount(amount, discountPercent) {
  // BUG: No validation — negative discount increases the price unexpectedly
  const discounted = amount - (amount * discountPercent) / 100;
  return discounted;
}

module.exports = { validateInput, generateTaxSummary, applyDiscount };
