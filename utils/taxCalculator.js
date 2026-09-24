/**
 * Indian Tax Calculator Utility
 * Supports FY 2024-25 tax slabs for both Old and New regimes
 */

// New Tax Regime (FY 2024-25) — Default
const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 5 },
  { min: 700000, max: 1000000, rate: 10 },
  { min: 1000000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 },
];

// Old Tax Regime
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];

function calculateTaxForSlabs(income, slabs) {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.min) break;
    const taxableInSlab = Math.min(income, slab.max) - slab.min;
    tax += (taxableInSlab * slab.rate) / 100;
  }
  return Math.round(tax);
}

function calculateCess(tax) {
  return Math.round(tax * 0.04); // 4% Health & Education Cess
}

function calculateSurcharge(income, tax) {
  if (income > 50000000) return Math.round(tax * 0.37);
  if (income > 20000000) return Math.round(tax * 0.25);
  if (income > 10000000) return Math.round(tax * 0.15);
  if (income > 5000000) return Math.round(tax * 0.10);
  return 0;
}

// Available deduction sections
const DEDUCTION_SECTIONS = {
  '80C': { name: 'Section 80C', maxLimit: 150000, description: 'PPF, ELSS, LIC, EPF, NSC, Tax-saving FDs, Tuition Fees, Home Loan Principal' },
  '80CCD1B': { name: 'Section 80CCD(1B)', maxLimit: 50000, description: 'Additional NPS contribution' },
  '80D': { name: 'Section 80D', maxLimit: 75000, description: 'Health Insurance Premium (Self + Family + Parents)' },
  '80E': { name: 'Section 80E', maxLimit: Infinity, description: 'Interest on Education Loan (No upper limit)' },
  '80G': { name: 'Section 80G', maxLimit: Infinity, description: 'Donations to eligible charities' },
  '80TTA': { name: 'Section 80TTA', maxLimit: 10000, description: 'Interest on Savings Account' },
  '80EEA': { name: 'Section 80EEA', maxLimit: 150000, description: 'Interest on Home Loan for first-time buyers' },
  'HRA': { name: 'HRA Exemption', maxLimit: Infinity, description: 'House Rent Allowance exemption' },
  'LTA': { name: 'LTA Exemption', maxLimit: Infinity, description: 'Leave Travel Allowance' },
  'HomeLoanInterest': { name: 'Section 24(b)', maxLimit: 200000, description: 'Interest on Home Loan (Self-occupied property)' },
  'StandardDeduction': { name: 'Standard Deduction', maxLimit: 75000, description: 'Standard deduction for salaried individuals (FY 2024-25)' },
};

function calculateTotalDeductions(deductions) {
  let total = 0;
  for (const [section, amount] of Object.entries(deductions)) {
    if (DEDUCTION_SECTIONS[section]) {
      const maxLimit = DEDUCTION_SECTIONS[section].maxLimit;
      total += Math.min(amount, maxLimit);
    }
  }
  return total;
}

function calculateTax(grossIncome, deductions = {}, regime = 'new') {
  const slabs = regime === 'new' ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
  let taxableIncome = grossIncome;

  // Standard deduction applies to both regimes in FY 2024-25
  const standardDeduction = Math.min(75000, grossIncome);
  taxableIncome -= standardDeduction;

  let totalDeductions = 0;

  if (regime === 'old') {
    totalDeductions = calculateTotalDeductions(deductions);
    taxableIncome -= totalDeductions;
  }

  taxableIncome = Math.max(0, taxableIncome);

  // Section 87A rebate — New regime: up to ₹7L, Old regime: up to ₹5L
  let baseTax = calculateTaxForSlabs(taxableIncome, slabs);
  const rebateLimit = regime === 'new' ? 700000 : 500000;
  const rebateMax = regime === 'new' ? 25000 : 12500;
  let rebate = 0;
  if (taxableIncome <= rebateLimit) {
    rebate = Math.min(baseTax, rebateMax);
  }
  baseTax -= rebate;

  const surcharge = calculateSurcharge(grossIncome, baseTax);
  const cess = calculateCess(baseTax + surcharge);
  const totalTax = baseTax + surcharge + cess;

  return {
    grossIncome,
    standardDeduction,
    totalDeductions: regime === 'old' ? totalDeductions : 0,
    taxableIncome,
    baseTax,
    rebate,
    surcharge,
    cess,
    totalTax,
    effectiveRate: grossIncome > 0 ? ((totalTax / grossIncome) * 100).toFixed(2) : '0.00',
    regime,
    slabs: slabs.map(s => ({
      range: `₹${s.min.toLocaleString('en-IN')} - ${s.max === Infinity ? 'Above' : '₹' + s.max.toLocaleString('en-IN')}`,
      rate: s.rate + '%',
      taxInSlab: calculateTaxForSlabs(Math.min(taxableIncome, s.max), [s])
    })),
    deductionBreakdown: regime === 'old' ? Object.entries(deductions).map(([key, val]) => ({
      section: DEDUCTION_SECTIONS[key]?.name || key,
      claimed: val,
      allowed: DEDUCTION_SECTIONS[key] ? Math.min(val, DEDUCTION_SECTIONS[key].maxLimit) : val,
      maxLimit: DEDUCTION_SECTIONS[key]?.maxLimit || 0
    })) : []
  };
}

function compareTaxRegimes(grossIncome, deductions = {}) {
  const oldRegime = calculateTax(grossIncome, deductions, 'old');
  const newRegime = calculateTax(grossIncome, deductions, 'new');
  const savings = oldRegime.totalTax - newRegime.totalTax;

  return {
    oldRegime,
    newRegime,
    savings: Math.abs(savings),
    recommended: savings > 0 ? 'new' : 'old',
    savingsMessage: savings > 0
      ? `New Regime saves you ₹${Math.abs(savings).toLocaleString('en-IN')}`
      : savings < 0
        ? `Old Regime saves you ₹${Math.abs(savings).toLocaleString('en-IN')}`
        : 'Both regimes result in the same tax'
  };
}

function getTaxSavingSuggestions(grossIncome, deductions = {}) {
  const suggestions = [];
  const claimed80C = deductions['80C'] || 0;
  const claimed80D = deductions['80D'] || 0;
  const claimedNPS = deductions['80CCD1B'] || 0;
  const claimed80TTA = deductions['80TTA'] || 0;

  if (claimed80C < 150000) {
    const remaining = 150000 - claimed80C;
    suggestions.push({
      icon: '💰',
      title: 'Maximize Section 80C',
      description: `You can save up to ₹${remaining.toLocaleString('en-IN')} more under 80C through ELSS, PPF, LIC, or Tax-saving FDs.`,
      potentialSaving: Math.round(remaining * 0.3),
      priority: 'high'
    });
  }

  if (claimedNPS < 50000) {
    const remaining = 50000 - claimedNPS;
    suggestions.push({
      icon: '🏦',
      title: 'Invest in NPS (80CCD1B)',
      description: `Additional ₹${remaining.toLocaleString('en-IN')} deduction available for NPS investment beyond 80C limit.`,
      potentialSaving: Math.round(remaining * 0.3),
      priority: 'high'
    });
  }

  if (claimed80D < 25000) {
    suggestions.push({
      icon: '🏥',
      title: 'Get Health Insurance (80D)',
      description: 'Claim up to ₹25,000 for self/family and additional ₹50,000 for senior citizen parents.',
      potentialSaving: Math.round(25000 * 0.3),
      priority: 'medium'
    });
  }

  if (claimed80TTA < 10000) {
    suggestions.push({
      icon: '🏧',
      title: 'Savings Account Interest (80TTA)',
      description: 'Claim deduction on savings account interest up to ₹10,000.',
      potentialSaving: Math.round(10000 * 0.2),
      priority: 'low'
    });
  }

  if (grossIncome > 1000000) {
    suggestions.push({
      icon: '🏠',
      title: 'Home Loan Benefits',
      description: 'Consider a home loan — claim up to ₹2L on interest (Sec 24b) + ₹1.5L on principal (Sec 80C).',
      potentialSaving: Math.round(350000 * 0.3),
      priority: 'medium'
    });
  }

  suggestions.push({
    icon: '📊',
    title: 'Switch to New Tax Regime?',
    description: 'If your total deductions are less than ₹3.75L, the New Regime may be more beneficial.',
    potentialSaving: 0,
    priority: 'info'
  });

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2, info: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

module.exports = {
  calculateTax,
  compareTaxRegimes,
  getTaxSavingSuggestions,
  DEDUCTION_SECTIONS,
  calculateTotalDeductions
};
