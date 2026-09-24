const express = require('express');
const router = express.Router();
const { calculateTax, compareTaxRegimes, getTaxSavingSuggestions, DEDUCTION_SECTIONS } = require('../utils/taxCalculator');

// Calculate tax
router.post('/calculate', (req, res) => {
  try {
    const { grossIncome, deductions, regime } = req.body;
    if (!grossIncome || grossIncome < 0) {
      return res.status(400).json({ message: 'Valid gross income is required' });
    }
    const result = calculateTax(Number(grossIncome), deductions || {}, regime || 'new');
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Calculation error', error: err.message });
  }
});

// Compare tax regimes
router.post('/compare', (req, res) => {
  try {
    const { grossIncome, deductions } = req.body;
    if (!grossIncome || grossIncome < 0) {
      return res.status(400).json({ message: 'Valid gross income is required' });
    }
    const result = compareTaxRegimes(Number(grossIncome), deductions || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Comparison error', error: err.message });
  }
});

// Get tax saving suggestions
router.post('/suggestions', (req, res) => {
  try {
    const { grossIncome, deductions } = req.body;
    const suggestions = getTaxSavingSuggestions(Number(grossIncome) || 0, deductions || {});
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: 'Error generating suggestions', error: err.message });
  }
});

// Get deduction sections info
router.get('/sections', (req, res) => {
  res.json(DEDUCTION_SECTIONS);
});

module.exports = router;
