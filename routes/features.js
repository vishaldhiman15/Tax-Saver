const express = require('express');
const router = express.Router();

// ── In-memory Investments Store ─────────────────────────────────────
const investments = [
  { id: '1', type: 'ELSS', name: 'Axis Long Term Equity Fund', amount: 50000, returnRate: 14.5, startDate: '2024-01-15', category: '80C', status: 'active', icon: '📈' },
  { id: '2', type: 'PPF', name: 'Public Provident Fund', amount: 75000, returnRate: 7.1, startDate: '2023-04-01', category: '80C', status: 'active', icon: '🏦' },
  { id: '3', type: 'NPS', name: 'National Pension System', amount: 50000, returnRate: 10.2, startDate: '2024-03-10', category: '80CCD1B', status: 'active', icon: '🏛️' },
  { id: '4', type: 'FD', name: 'Tax Saver Fixed Deposit - SBI', amount: 25000, returnRate: 6.5, startDate: '2024-06-01', category: '80C', status: 'active', icon: '💰' },
  { id: '5', type: 'LIC', name: 'LIC Jeevan Anand Policy', amount: 30000, returnRate: 5.5, startDate: '2022-01-01', category: '80C', status: 'active', icon: '🛡️' },
  { id: '6', type: 'Health', name: 'Star Health Insurance', amount: 25000, returnRate: 0, startDate: '2024-04-01', category: '80D', status: 'active', icon: '🏥' },
  { id: '7', type: 'ELSS', name: 'Mirae Asset Tax Saver Fund', amount: 30000, returnRate: 16.8, startDate: '2024-02-01', category: '80C', status: 'active', icon: '📈' },
  { id: '8', type: 'SIP', name: 'HDFC Mid-Cap Opportunities', amount: 60000, returnRate: 18.2, startDate: '2023-07-01', category: 'Non-Deductible', status: 'active', icon: '📊' },
];

// ── In-memory Goals Store ───────────────────────────────────────────
const goals = [
  { id: '1', name: 'Emergency Fund', target: 500000, current: 320000, deadline: '2025-12-31', icon: '🆘', color: '#ef4444' },
  { id: '2', name: 'Maximize 80C', target: 150000, current: 105000, deadline: '2025-03-31', icon: '🏷️', color: '#10b981' },
  { id: '3', name: 'Home Down Payment', target: 2000000, current: 450000, deadline: '2027-06-30', icon: '🏠', color: '#3b82f6' },
  { id: '4', name: 'Vacation Fund', target: 200000, current: 85000, deadline: '2025-06-30', icon: '✈️', color: '#f59e0b' },
];

// ── Tax Deadlines ───────────────────────────────────────────────────
const taxDeadlines = [
  { id: '1', title: 'Advance Tax - Q3', date: '2024-12-15', type: 'payment', description: 'Third installment of advance tax (75% of total)', priority: 'high' },
  { id: '2', title: 'Advance Tax - Q4', date: '2025-03-15', type: 'payment', description: 'Fourth installment of advance tax (100% of total)', priority: 'high' },
  { id: '3', title: 'Last date for Tax Saving Investments', date: '2025-03-31', type: 'investment', description: 'Invest in 80C, 80D instruments before FY ends', priority: 'critical' },
  { id: '4', title: 'ITR Filing Deadline', date: '2025-07-31', type: 'filing', description: 'File Income Tax Return for FY 2024-25', priority: 'critical' },
  { id: '5', title: 'Belated/Revised ITR Deadline', date: '2025-12-31', type: 'filing', description: 'Last date to file belated or revised return', priority: 'medium' },
  { id: '6', title: 'Form 16 from Employer', date: '2025-06-15', type: 'document', description: 'Collect Form 16 from your employer', priority: 'high' },
  { id: '7', title: 'TDS Certificate - Q4', date: '2025-05-30', type: 'document', description: 'TDS Certificate for Jan-Mar quarter', priority: 'medium' },
];

// ── Chatbot Knowledge Base ──────────────────────────────────────────
const taxKnowledge = {
  '80c': { answer: '**Section 80C** allows deductions up to **₹1,50,000** per year. Eligible investments include:\n\n• PPF (Public Provident Fund)\n• ELSS (Equity Linked Saving Scheme)\n• NSC (National Savings Certificate)\n• 5-year Tax Saving FD\n• Life Insurance Premium (LIC)\n• EPF (Employee Provident Fund)\n• Tuition Fees for Children\n• Home Loan Principal Repayment\n• Sukanya Samriddhi Yojana\n\n💡 **Tip:** ELSS has the shortest lock-in of just 3 years and offers market-linked returns!' },
  '80d': { answer: '**Section 80D** provides deductions for **Health Insurance Premiums**:\n\n• Self/Family (below 60): Up to **₹25,000**\n• Parents (below 60): Additional **₹25,000**\n• Parents (above 60): Additional **₹50,000**\n• Preventive Health Check-up: **₹5,000** (within overall limit)\n\n**Maximum deduction: ₹1,00,000** (if all are senior citizens)\n\n💡 **Tip:** Even if your employer provides health insurance, buying a personal policy gives you extra tax benefits!' },
  'hra': { answer: '**HRA (House Rent Allowance)** exemption is the minimum of:\n\n1. Actual HRA received\n2. 50% of salary (metro) or 40% (non-metro)\n3. Rent paid minus 10% of salary\n\n📋 **Documents needed:** Rent receipts and landlord PAN (if rent > ₹1L/year)\n\n💡 **Tip:** If you don\'t get HRA, claim deduction under Section 80GG (up to ₹60,000/year)!' },
  'new regime': { answer: '**New Tax Regime (FY 2024-25)** has lower rates but no deductions:\n\n| Income Slab | Tax Rate |\n|---|---|\n| Up to ₹3L | 0% |\n| ₹3L - ₹7L | 5% |\n| ₹7L - ₹10L | 10% |\n| ₹10L - ₹12L | 15% |\n| ₹12L - ₹15L | 20% |\n| Above ₹15L | 30% |\n\n✅ **Standard Deduction:** ₹75,000 allowed\n✅ **Rebate:** Full rebate for income up to ₹7L\n\n💡 If your deductions are < ₹3.75L, New Regime is likely better!' },
  'old regime': { answer: '**Old Tax Regime** has higher rates but allows all deductions:\n\n| Income Slab | Tax Rate |\n|---|---|\n| Up to ₹2.5L | 0% |\n| ₹2.5L - ₹5L | 5% |\n| ₹5L - ₹10L | 20% |\n| Above ₹10L | 30% |\n\n✅ All deductions allowed (80C, 80D, HRA, etc.)\n✅ **Rebate:** Full rebate for income up to ₹5L\n\n💡 If your deductions are > ₹3.75L, Old Regime is likely better!' },
  'advance tax': { answer: '**Advance Tax** must be paid in installments if your tax liability exceeds **₹10,000** in a year:\n\n| Due Date | Cumulative % |\n|---|---|\n| 15 June | 15% |\n| 15 September | 45% |\n| 15 December | 75% |\n| 15 March | 100% |\n\n⚠️ **Interest:** 1% per month under Section 234C for late payment\n\n💡 Salaried employees usually don\'t need to pay advance tax if TDS covers their liability.' },
  'itr': { answer: '**ITR (Income Tax Return)** filing details:\n\n• **Deadline:** July 31st (for individuals)\n• **Belated Return:** Up to December 31st (with penalty)\n• **Forms:** ITR-1 (salary ≤ ₹50L), ITR-2 (capital gains), ITR-3 (business)\n\n📋 **Documents needed:**\n• Form 16 from employer\n• Bank statements\n• Investment proofs\n• Aadhaar & PAN\n\n💡 **Tip:** File early to get faster refunds! Average refund time is 15-45 days for e-verified returns.' },
  'nps': { answer: '**NPS (National Pension System)** tax benefits:\n\n• **Section 80CCD(1):** Part of ₹1.5L limit under 80C\n• **Section 80CCD(1B):** Additional **₹50,000** deduction ⭐\n• **Section 80CCD(2):** Employer contribution (up to 10% of salary, no cap)\n\n**Total extra deduction possible: ₹50,000+** beyond 80C!\n\n💡 **Tip:** This is one of the easiest ways to save tax beyond the ₹1.5L 80C limit. Even a small NPS investment helps!' },
  'capital gains': { answer: '**Capital Gains Tax** rates (FY 2024-25):\n\n**Equity:**\n• STCG (< 1 year): **15%**\n• LTCG (> 1 year): **10%** above ₹1L exemption\n\n**Debt/Gold/Property:**\n• STCG: As per income tax slab\n• LTCG (> 2/3 years): **20%** with indexation\n\n💡 **Tax Harvesting:** Book LTCG profits up to ₹1L each year to utilize the exemption limit!' },
};

// ── API Routes ──────────────────────────────────────────────────────

// Get all investments
router.get('/investments', (req, res) => {
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReturns = investments.reduce((sum, inv) => sum + (inv.amount * inv.returnRate / 100), 0);
  const taxSaving = investments.filter(i => i.category !== 'Non-Deductible').reduce((sum, i) => sum + i.amount, 0);

  res.json({
    investments,
    summary: {
      totalInvested,
      totalReturns: Math.round(totalReturns),
      currentValue: Math.round(totalInvested + totalReturns),
      taxSavingInvestments: taxSaving,
      count: investments.length
    }
  });
});

// Add investment
router.post('/investments', (req, res) => {
  const { type, name, amount, returnRate, category } = req.body;
  const inv = {
    id: Date.now().toString(),
    type: type || 'Other',
    name: name || 'New Investment',
    amount: Number(amount) || 0,
    returnRate: Number(returnRate) || 0,
    startDate: new Date().toISOString().split('T')[0],
    category: category || 'Non-Deductible',
    status: 'active',
    icon: { 'ELSS': '📈', 'PPF': '🏦', 'NPS': '🏛️', 'FD': '💰', 'LIC': '🛡️', 'Health': '🏥', 'SIP': '📊' }[type] || '💎'
  };
  investments.push(inv);
  res.status(201).json(inv);
});

// Get financial goals
router.get('/goals', (req, res) => {
  res.json(goals);
});

// Add goal
router.post('/goals', (req, res) => {
  const { name, target, current, deadline, icon, color } = req.body;
  const goal = {
    id: Date.now().toString(),
    name: name || 'New Goal',
    target: Number(target) || 0,
    current: Number(current) || 0,
    deadline: deadline || '2025-12-31',
    icon: icon || '🎯',
    color: color || '#10b981'
  };
  goals.push(goal);
  res.status(201).json(goal);
});

// Update goal progress
router.put('/goals/:id', (req, res) => {
  const goal = goals.find(g => g.id === req.params.id);
  if (!goal) return res.status(404).json({ message: 'Goal not found' });
  if (req.body.current !== undefined) goal.current = Number(req.body.current);
  if (req.body.name) goal.name = req.body.name;
  if (req.body.target) goal.target = Number(req.body.target);
  res.json(goal);
});

// Get tax deadlines
router.get('/deadlines', (req, res) => {
  const sorted = [...taxDeadlines].sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(sorted);
});

// Get notifications (upcoming deadlines + alerts)
router.get('/notifications', (req, res) => {
  const now = new Date();
  const notifications = taxDeadlines.map(d => {
    const daysLeft = Math.ceil((new Date(d.date) - now) / (1000 * 60 * 60 * 24));
    return {
      ...d,
      daysLeft,
      isOverdue: daysLeft < 0,
      isUrgent: daysLeft >= 0 && daysLeft <= 30,
      status: daysLeft < 0 ? 'overdue' : daysLeft <= 7 ? 'urgent' : daysLeft <= 30 ? 'soon' : 'upcoming'
    };
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  res.json(notifications);
});

// Chatbot
router.post('/chat', (req, res) => {
  const { message } = req.body;
  const query = (message || '').toLowerCase().trim();

  // Search knowledge base
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, data] of Object.entries(taxKnowledge)) {
    const keywords = key.split(' ');
    let score = 0;
    for (const kw of keywords) {
      if (query.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = data;
    }
  }

  // Keyword-based fallback matching
  if (!bestMatch) {
    if (query.includes('save') || query.includes('saving') || query.includes('reduce')) {
      bestMatch = { answer: '**Top Tax Saving Strategies:**\n\n1. 💰 **Section 80C** — Invest ₹1.5L in PPF/ELSS/NSC\n2. 🏦 **Section 80CCD(1B)** — Extra ₹50K via NPS\n3. 🏥 **Section 80D** — Health insurance up to ₹75K\n4. 🏠 **HRA** — Claim rent exemption\n5. 🏡 **Home Loan** — ₹2L interest (24b) + ₹1.5L principal (80C)\n6. 🎓 **Section 80E** — Education loan interest (no limit!)\n\n💡 Use our **Tax Calculator** to see exactly how much you can save!' };
    } else if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
      bestMatch = { answer: 'Hello! 👋 I\'m **TaxBot**, your AI tax assistant. I can help you with:\n\n• Tax saving sections (80C, 80D, HRA, NPS)\n• Old vs New regime comparison\n• ITR filing guidance\n• Capital gains tax\n• Advance tax deadlines\n\nJust ask me anything about taxes! 🧮' };
    } else if (query.includes('form 16') || query.includes('form16')) {
      bestMatch = { answer: '**Form 16** is your TDS certificate from your employer:\n\n• **Part A:** TDS deducted & deposited details\n• **Part B:** Salary breakup, deductions claimed, tax computed\n\n📅 Your employer must issue it by **June 15th** each year.\n\n💡 **Tip:** Verify all details in Form 16 against your salary slips before filing ITR!' };
    } else if (query.includes('refund')) {
      bestMatch = { answer: '**Income Tax Refund** process:\n\n1. File your ITR with correct bank details\n2. **E-verify** within 30 days (Aadhaar OTP is fastest)\n3. Wait for processing (usually 15-45 days)\n\n📋 Track refund at: incometax.gov.in → My Account → Refund Status\n\n💡 **Tip:** File early (July) for faster processing. Late filers face longer wait times!' };
    }
  }

  if (!bestMatch) {
    bestMatch = { answer: 'I\'m not sure about that specific query, but here are topics I can help with:\n\n• **Section 80C** — Investment deductions\n• **Section 80D** — Health insurance\n• **HRA** — Rent exemption\n• **New vs Old Regime** — Which is better?\n• **NPS** — Pension scheme benefits\n• **ITR Filing** — How to file returns\n• **Capital Gains** — Stock/MF taxation\n• **Advance Tax** — Payment schedule\n\nTry asking about any of these topics! 💡' };
  }

  res.json({
    reply: bestMatch.answer,
    timestamp: new Date().toISOString(),
    suggestions: ['What is Section 80C?', 'New vs Old regime?', 'How to save tax?', 'NPS benefits?']
  });
});

// Generate Tax Report data
router.get('/report', (req, res) => {
  const grossIncome = 1200000;
  const report = {
    personalInfo: {
      name: 'Rahul Sharma',
      pan: 'ABCDE1234F',
      assessmentYear: 'AY 2025-26',
      financialYear: 'FY 2024-25',
      status: 'Individual',
      filingDate: new Date().toISOString()
    },
    incomeDetails: {
      salary: 1100000,
      otherIncome: 80000,
      savingsInterest: 15000,
      fdInterest: 5000,
      grossTotal: grossIncome
    },
    deductions: {
      standardDeduction: { section: 'Standard Deduction', amount: 75000 },
      section80C: { section: 'Section 80C', items: ['PPF: ₹75,000', 'ELSS: ₹50,000', 'LIC: ₹25,000'], amount: 150000 },
      section80CCD1B: { section: 'Section 80CCD(1B)', items: ['NPS: ₹50,000'], amount: 50000 },
      section80D: { section: 'Section 80D', items: ['Health Insurance: ₹25,000'], amount: 25000 },
      section80TTA: { section: 'Section 80TTA', items: ['Savings Interest: ₹10,000'], amount: 10000 },
      totalDeductions: 310000
    },
    taxComputation: {
      grossIncome,
      totalDeductions: 310000,
      taxableIncome: 890000,
      taxOldRegime: 103480,
      taxNewRegime: 54600,
      recommended: 'New Regime',
      tds: 95000,
      refundOrDue: -40400,
      isRefund: true
    },
    investments: investments.filter(i => i.category !== 'Non-Deductible'),
    monthlyBreakdown: [
      { month: 'Apr', income: 91667, tax: 7639 },
      { month: 'May', income: 91667, tax: 7639 },
      { month: 'Jun', income: 91667, tax: 7639 },
      { month: 'Jul', income: 91667, tax: 7639 },
      { month: 'Aug', income: 91667, tax: 7639 },
      { month: 'Sep', income: 108333, tax: 9028 },
      { month: 'Oct', income: 108333, tax: 9028 },
      { month: 'Nov', income: 108333, tax: 9028 },
      { month: 'Dec', income: 108333, tax: 9028 },
      { month: 'Jan', income: 108333, tax: 9028 },
      { month: 'Feb', income: 108333, tax: 9028 },
      { month: 'Mar', income: 108333, tax: 9028 },
    ]
  };
  res.json(report);
});

module.exports = router;
