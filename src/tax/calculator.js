// tax/calculator.js — Tax calculation logic for different categories

const { calculateTax, roundToTwo } = require("../utils");

const TAX_SLABS = {
  basic: 5,      // 5%
  standard: 12,  // 12%
  premium: 18,   // 18%
  luxury: 28,    // 28%
};

/**
 * Calculates GST for a product based on its category
 * @param {number} amount - Product price
 * @param {string} category - Tax category: basic | standard | premium | luxury
 * @returns {{ taxAmount: number, totalAmount: number, rate: number }}
 */
function calculateGST(amount, category = "standard") {
  const rate = TAX_SLABS[category];

  if (!rate) {
    throw new Error(`Unknown tax category: ${category}`);
  }

  // BUG: Calls calculateTax() which doesn't handle negative amounts
  const taxAmount = calculateTax(amount, rate);
  const totalAmount = amount + taxAmount;

  return {
    taxAmount: roundToTwo(taxAmount),
    totalAmount: roundToTwo(totalAmount),
    rate,
  };
}

/**
 * Calculates income tax based on annual income slabs (India FY 2024-25)
 * @param {number} annualIncome
 * @returns {{ taxAmount: number, effectiveRate: number }}
 */
function calculateIncomeTax(annualIncome) {
  // BUG: No check for negative income
  let tax = 0;

  if (annualIncome <= 300000) {
    tax = 0;
  } else if (annualIncome <= 600000) {
    tax = (annualIncome - 300000) * 0.05;
  } else if (annualIncome <= 900000) {
    tax = 15000 + (annualIncome - 600000) * 0.10;
  } else if (annualIncome <= 1200000) {
    tax = 45000 + (annualIncome - 900000) * 0.15;
  } else if (annualIncome <= 1500000) {
    tax = 90000 + (annualIncome - 1200000) * 0.20;
  } else {
    tax = 150000 + (annualIncome - 1500000) * 0.30;
  }

  const effectiveRate = annualIncome > 0 ? (tax / annualIncome) * 100 : 0;

  return {
    taxAmount: roundToTwo(tax),
    effectiveRate: roundToTwo(effectiveRate),
  };
}

module.exports = { calculateGST, calculateIncomeTax, TAX_SLABS };
