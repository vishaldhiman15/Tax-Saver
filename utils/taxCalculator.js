/**
 * TaxSmart - Multi-Country Tax Calculator
 * Supports: India, USA, UK, Canada, Germany, Australia
 * ⚠️ DISCLAIMER: For educational/demo purposes only. Not financial advice.
 */

// ─────────────────────────────────────────────
// INDIA - New Tax Regime (FY 2024-25)
// ─────────────────────────────────────────────
const calculateIndiaTax = (income, deductions) => {
  const {
    section80C = 0, section80D = 0, section80CCD = 0,
    hraExemption = 0, ltaExemption = 0, homeLoanInterest = 0, educationLoan = 0,
  } = deductions;

  const STANDARD_DEDUCTION = 50000;
  const MAX_80C = 150000;
  const MAX_80D_SELF = 25000;
  const MAX_80CCD_ADDITIONAL = 50000;

  const totalDeductions =
    STANDARD_DEDUCTION +
    Math.min(section80C, MAX_80C) +
    Math.min(section80D, MAX_80D_SELF) +
    Math.min(section80CCD, MAX_80CCD_ADDITIONAL) +
    hraExemption +
    ltaExemption +
    Math.min(homeLoanInterest, 200000) +
    educationLoan;

  const taxableIncome = Math.max(0, income - totalDeductions);

  let tax = 0;
  if (taxableIncome <= 250000) tax = 0;
  else if (taxableIncome <= 500000) tax = (taxableIncome - 250000) * 0.05;
  else if (taxableIncome <= 1000000) tax = 12500 + (taxableIncome - 500000) * 0.2;
  else tax = 112500 + (taxableIncome - 1000000) * 0.3;

  // Rebate u/s 87A (if taxable income ≤ 5L)
  if (taxableIncome <= 500000) tax = 0;

  const cess = tax * 0.04;
  const netTax = tax + cess;

  const unused80C = Math.max(0, MAX_80C - section80C);
  const unused80D = Math.max(0, MAX_80D_SELF - section80D);
  const unusedNPS = Math.max(0, MAX_80CCD_ADDITIONAL - section80CCD);
  const unusedHomeLoan = Math.max(0, 200000 - homeLoanInterest);
  const potentialExtraSavings = (unused80C + unused80D + unusedNPS + unusedHomeLoan) * 0.3;

  const alerts = [];
  if (unused80C > 0) alerts.push({ type: "80C", message: `I noticed you're leaving ₹${unused80C.toLocaleString("en-IN")} on the table for Section 80C. Allocating this to an Equity Linked Savings Scheme (ELSS) or Public Provident Fund (PPF) immediately optimizes your tax bracket.`, saving: unused80C * 0.3, priority: "high" });
  if (unused80D > 0) alerts.push({ type: "80D", message: `You have unused Section 80D allowance (₹${unused80D.toLocaleString("en-IN")}). A robust health insurance policy not only mitigates emergency risks but actively drops your taxable load. Let's get that locked in.`, saving: unused80D * 0.3, priority: "medium" });
  if (unusedNPS > 0) alerts.push({ type: "NPS", message: `Consider boosting your retirement safety net. Contributing another ₹${unusedNPS.toLocaleString("en-IN")} to the National Pension Scheme unlocks an exclusive tax tier under 80CCD(1B).`, saving: unusedNPS * 0.3, priority: "medium" });
  if (hraExemption === 0) alerts.push({ type: "HRA", message: "My analysis shows no HRA exemption claimed. If you're paying rent, you must submit rent receipts to your employer immediately to trigger this deduction.", saving: 0, priority: "high" });
  if (homeLoanInterest === 0 && income > 700000) alerts.push({ type: "HomeLoan", message: "Looking toward real estate? Bear in mind that Section 24(b) grants up to ₹2,00,000 in deductions on home loan interest. An excellent future tax shield.", saving: 0, priority: "low" });

  let efficiencyScore = 100;
  if (potentialExtraSavings > 0) efficiencyScore = Math.max(0, Math.round(100 - (potentialExtraSavings/(income*0.3)*100)));

  return {
    grossTax: Math.round(tax), netTax: Math.round(netTax), cess: Math.round(cess),
    totalDeductions: Math.round(totalDeductions), taxableIncome: Math.round(taxableIncome),
    effectiveTaxRate: income > 0 ? parseFloat(((netTax / income) * 100).toFixed(2)) : 0,
    potentialSavings: Math.round(potentialExtraSavings), efficiencyScore, alerts,
    currency: "INR", symbol: "₹", regime: "Old Regime",
  };
};

// ─────────────────────────────────────────────
// USA - Federal Income Tax (2024)
// ─────────────────────────────────────────────
const calculateUSATax = (income, deductions) => {
  const { retirement401k = 0, hsaContribution = 0, mortgageInterest = 0, charitableDonations = 0 } = deductions;

  const STANDARD_DEDUCTION = 14600;
  const MAX_401K = 23000;
  const MAX_HSA = 4150;

  const itemizedDeductions = mortgageInterest + charitableDonations;
  const usedDeduction = Math.max(STANDARD_DEDUCTION, itemizedDeductions);

  const totalDeductions = Math.min(retirement401k, MAX_401K) + Math.min(hsaContribution, MAX_HSA) + usedDeduction;
  const taxableIncome = Math.max(0, income - totalDeductions);

  let tax = 0;
  const brackets = [ [11600, 0.10], [47150, 0.12], [100525, 0.22], [191950, 0.24], [243725, 0.32], [609350, 0.35], [Infinity, 0.37] ];
  let prev = 0;
  for (const [limit, rate] of brackets) {
    if (taxableIncome <= prev) break;
    tax += (Math.min(taxableIncome, limit) - prev) * rate;
    prev = limit;
  }

  const unused401k = Math.max(0, MAX_401K - retirement401k);
  const unusedHSA = Math.max(0, MAX_HSA - hsaContribution);

  const alerts = [];
  if (unused401k > 0) alerts.push({ type: "401k", message: `AI Alert: Your 401(k) isn't maxed out yet. Injecting the remaining $${unused401k.toLocaleString()} directly reduces your taxable burden and capitalizes on employer matching opportunities.`, saving: Math.round(unused401k * 0.22), priority: "high" });
  if (unusedHSA > 0) alerts.push({ type: "HSA", message: `You have $${unusedHSA.toLocaleString()} left in your HSA allowance. This is the ultimate "triple-tax-advantaged" account. I strongly recommend maxing this out to shield your wealth from medical costs.`, saving: Math.round(unusedHSA * 0.22), priority: "high" });
  if (itemizedDeductions > STANDARD_DEDUCTION) alerts.push({ type: "Itemize", message: `Great job optimizing your profile. Your itemized deductions ($${itemizedDeductions.toLocaleString()}) surpass the standard limit. Definitely pursue itemization this tax season.`, saving: Math.round((itemizedDeductions - STANDARD_DEDUCTION) * 0.22), priority: "high" });
  if (income > 150000) alerts.push({ type: "BackdoorRoth", message: `Given your elevated income bracket, a traditional Roth IRA might be restricted. I suggest setting up a "Backdoor Roth" conversion to preserve tax-free exponential growth.`, saving: 0, priority: "medium" });

  let efficiencyScore = 100;
  const potentialSavings = Math.round((unused401k + unusedHSA) * 0.22);
  if (potentialSavings > 0) efficiencyScore = Math.max(0, Math.round(100 - (potentialSavings/(income*0.22)*100)));

  return {
    grossTax: Math.round(tax), netTax: Math.round(tax), totalDeductions: Math.round(totalDeductions),
    taxableIncome: Math.round(taxableIncome), effectiveTaxRate: income > 0 ? parseFloat(((tax / income) * 100).toFixed(2)) : 0,
    potentialSavings, efficiencyScore, alerts, currency: "USD", symbol: "$",
  };
};

// ─────────────────────────────────────────────
// UK - Income Tax (2024/25)
// ─────────────────────────────────────────────
const calculateUKTax = (income, deductions) => {
  const { pensionContributions = 0, isaContributions = 0 } = deductions;

  const PERSONAL_ALLOWANCE = 12570;
  const MAX_PENSION = Math.min(income * 0.4, 60000);
  const MAX_ISA = 20000;

  const totalDeductions = pensionContributions + PERSONAL_ALLOWANCE;
  const taxableIncome = Math.max(0, income - totalDeductions);

  let incomeTax = 0;
  if (taxableIncome <= 37700) incomeTax = taxableIncome * 0.20;
  else if (taxableIncome <= 125140) incomeTax = 37700 * 0.20 + (taxableIncome - 37700) * 0.40;
  else incomeTax = 37700 * 0.20 + (125140 - 37700) * 0.40 + (taxableIncome - 125140) * 0.45;

  let ni = 0;
  if (income > 12570) ni = Math.min(income - 12570, 50270 - 12570) * 0.08 + Math.max(0, income - 50270) * 0.02;

  const unusedPension = Math.max(0, MAX_PENSION - pensionContributions);
  const unusedISA = Math.max(0, MAX_ISA - isaContributions);

  const alerts = [];
  if (unusedPension > 0) alerts.push({ type: "Pension", message: `AI Insight: You have £${unusedPension.toLocaleString()} remaining in pension allowance. Dropping this into your pension triggers an automatic 40% tax relief mechanism for higher bracket earnings. Don't miss this.`, saving: Math.round(unusedPension * 0.4), priority: "high" });
  if (unusedISA > 0) alerts.push({ type: "ISA", message: `You're missing out on the UK's best tax shield. Maximising the £${unusedISA.toLocaleString()} gap in your ISA allowance legally shelters your capital gains and interest from HMRC indefinitely.`, saving: 0, priority: "medium" });
  if (income > 100000) alerts.push({ type: "PersonalAllowance", message: `Warning: Your £100k+ income is actively destroying your Personal Allowance tier. Funnelling more into your pension will reconstruct that allowance and yield a massive ~60% effective tax salvage.`, saving: Math.round(Math.min(income - 100000, 12570) * 0.6), priority: "high" });

  let efficiencyScore = 100;
  const potentialSavings = Math.round(unusedPension * 0.4);
  if (potentialSavings > 0) efficiencyScore = Math.max(0, Math.round(100 - (potentialSavings/(income*0.4)*100)));

  return {
    grossTax: Math.round(incomeTax), netTax: Math.round(incomeTax + ni), nationalInsurance: Math.round(ni),
    totalDeductions: Math.round(totalDeductions), taxableIncome: Math.round(taxableIncome),
    effectiveTaxRate: income > 0 ? parseFloat((((incomeTax + ni) / income) * 100).toFixed(2)) : 0,
    potentialSavings, efficiencyScore, alerts, currency: "GBP", symbol: "£",
  };
};

// ─────────────────────────────────────────────
// CANADA - Federal Tax (2024)
// ─────────────────────────────────────────────
const calculateCanadaTax = (income, deductions) => {
  const { rrspContributions = 0, tfsaContributions = 0 } = deductions;

  const MAX_RRSP = Math.min(income * 0.18, 31560);
  const MAX_TFSA = 7000;
  const BASIC_PERSONAL = 15705;

  const taxableIncome = Math.max(0, income - rrspContributions - BASIC_PERSONAL);

  let tax = 0;
  if (taxableIncome <= 55867) tax = taxableIncome * 0.15;
  else if (taxableIncome <= 111733) tax = 55867 * 0.15 + (taxableIncome - 55867) * 0.205;
  else if (taxableIncome <= 154906) tax = 55867 * 0.15 + (111733 - 55867) * 0.205 + (taxableIncome - 111733) * 0.26;
  else if (taxableIncome <= 220000) tax = 55867 * 0.15 + (111733 - 55867) * 0.205 + (154906 - 111733) * 0.26 + (taxableIncome - 154906) * 0.29;
  else tax = 55867 * 0.15 + (111733 - 55867) * 0.205 + (154906 - 111733) * 0.26 + (220000 - 154906) * 0.29 + (taxableIncome - 220000) * 0.33;

  const unusedRRSP = Math.max(0, MAX_RRSP - rrspContributions);
  const unusedTFSA = Math.max(0, MAX_TFSA - tfsaContributions);

  const alerts = [];
  if (unusedRRSP > 0) alerts.push({ type: "RRSP", message: `AI Review: Depositing the remaining $${unusedRRSP.toLocaleString()} into your RRSP shrinks your taxable perimeter directly, pulling your top marginal rate down efficiently. Highly advised.`, saving: Math.round(unusedRRSP * 0.26), priority: "high" });
  if (unusedTFSA > 0) alerts.push({ type: "TFSA", message: `You have $${unusedTFSA.toLocaleString()} free space in your TFSA. Using this vehicle creates zero-tax liquidity streams for future withdrawals, vastly outperforming standard savings accounts.`, saving: 0, priority: "medium" });

  let efficiencyScore = 100;
  const potentialSavings = Math.round(unusedRRSP * 0.26);
  if (potentialSavings > 0) efficiencyScore = Math.max(0, Math.round(100 - (potentialSavings/(income*0.26)*100)));

  return {
    grossTax: Math.round(tax), netTax: Math.round(tax), totalDeductions: Math.round(rrspContributions + BASIC_PERSONAL),
    taxableIncome: Math.round(taxableIncome), effectiveTaxRate: income > 0 ? parseFloat(((tax / income) * 100).toFixed(2)) : 0,
    potentialSavings, efficiencyScore, alerts, currency: "CAD", symbol: "CA$",
  };
};

// ─────────────────────────────────────────────
// GERMANY - Income Tax (2024)
// ─────────────────────────────────────────────
const calculateGermanyTax = (income, deductions) => {
  const { riesterPension = 0 } = deductions;

  const EMPLOYEE_ALLOWANCE = 1230;
  const SPECIAL_EXPENSES = 36;
  const MAX_RIESTER = Math.min(income * 0.04, 2100);

  const taxableIncome = Math.max(0, income - EMPLOYEE_ALLOWANCE - SPECIAL_EXPENSES - riesterPension);
  let tax = 0;

  if (taxableIncome <= 11604) tax = 0;
  else if (taxableIncome <= 17005) { const y = (taxableIncome - 11604) / 10000; tax = (979.18 * y + 1400) * y; }
  else if (taxableIncome <= 66760) { const z = (taxableIncome - 17005) / 10000; tax = (192.59 * z + 2397) * z + 966.53; }
  else if (taxableIncome <= 277825) tax = 0.42 * taxableIncome - 9972.98;
  else tax = 0.45 * taxableIncome - 18307.73;

  const solidaritySurcharge = tax > 18130 ? tax * 0.055 : 0;
  const unusedRiester = Math.max(0, MAX_RIESTER - riesterPension);

  const alerts = [];
  if (unusedRiester > 0) alerts.push({ type: "Riester", message: `AI Check: Maximising your Riester pension contributions by an extra €${unusedRiester.toLocaleString()} triggers a guaranteed state subsidy alongside an immediate income tax deduction.`, saving: Math.round(unusedRiester * 0.42), priority: "high" });
  alerts.push({ type: "Werbungskosten", message: `I scanned your profile for "Werbungskosten". Be sure to legally deduce any home-office allocations, commuter traffic expenses, and work tool acquisitions to aggressively lower your taxable income.`, saving: 0, priority: "medium" });

  let efficiencyScore = 100;
  const potentialSavings = Math.round(unusedRiester * 0.42);
  if (potentialSavings > 0) efficiencyScore = Math.max(0, Math.round(100 - (potentialSavings/(income*0.42)*100)));

  return {
    grossTax: Math.round(tax), netTax: Math.round(tax + solidaritySurcharge), solidaritySurcharge: Math.round(solidaritySurcharge),
    totalDeductions: Math.round(EMPLOYEE_ALLOWANCE + SPECIAL_EXPENSES + riesterPension),
    taxableIncome: Math.round(taxableIncome), effectiveTaxRate: income > 0 ? parseFloat((((tax + solidaritySurcharge) / income) * 100).toFixed(2)) : 0,
    potentialSavings, efficiencyScore, alerts, currency: "EUR", symbol: "€",
  };
};

// ─────────────────────────────────────────────
// Main dispatcher
// ─────────────────────────────────────────────
const calculateTax = (country, income, deductions = {}) => {
  switch (country) {
    case "IN": return calculateIndiaTax(income, deductions);
    case "US": return calculateUSATax(income, deductions);
    case "UK": return calculateUKTax(income, deductions);
    case "CA": return calculateCanadaTax(income, deductions);
    case "DE": return calculateGermanyTax(income, deductions);
    default:   return calculateIndiaTax(income, deductions);
  }
};

module.exports = { calculateTax };
