const express = require('express');
const router = express.Router();

// Mock bank data for the Bank Connect feature
const BANKS = [
  { id: 'sbi', name: 'State Bank of India', shortName: 'SBI', color: '#1a4f8b', type: 'public' },
  { id: 'hdfc', name: 'HDFC Bank', shortName: 'HDFC', color: '#004b87', type: 'private' },
  { id: 'icici', name: 'ICICI Bank', shortName: 'ICICI', color: '#f58220', type: 'private' },
  { id: 'axis', name: 'Axis Bank', shortName: 'AXIS', color: '#97144d', type: 'private' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', shortName: 'KOTAK', color: '#ed1c24', type: 'private' },
  { id: 'pnb', name: 'Punjab National Bank', shortName: 'PNB', color: '#003d6a', type: 'public' },
  { id: 'bob', name: 'Bank of Baroda', shortName: 'BOB', color: '#f26522', type: 'public' },
  { id: 'boi', name: 'Bank of India', shortName: 'BOI', color: '#0066b3', type: 'public' },
  { id: 'canara', name: 'Canara Bank', shortName: 'CANARA', color: '#ffd700', type: 'public' },
  { id: 'union', name: 'Union Bank of India', shortName: 'UNION', color: '#003399', type: 'public' },
  { id: 'idbi', name: 'IDBI Bank', shortName: 'IDBI', color: '#009933', type: 'public' },
  { id: 'indusind', name: 'IndusInd Bank', shortName: 'INDUSIND', color: '#8b0000', type: 'private' },
  { id: 'yes', name: 'Yes Bank', shortName: 'YES', color: '#0066b3', type: 'private' },
  { id: 'federal', name: 'Federal Bank', shortName: 'FEDERAL', color: '#003366', type: 'private' },
  { id: 'rbl', name: 'RBL Bank', shortName: 'RBL', color: '#002060', type: 'private' },
  { id: 'idfc', name: 'IDFC First Bank', shortName: 'IDFC', color: '#9c1e22', type: 'private' },
  { id: 'bandhan', name: 'Bandhan Bank', shortName: 'BANDHAN', color: '#e31837', type: 'private' },
  { id: 'paytm', name: 'Paytm Payments Bank', shortName: 'PAYTM', color: '#00baf2', type: 'digital' },
  { id: 'fi', name: 'Fi Money', shortName: 'FI', color: '#7c3aed', type: 'digital' },
  { id: 'jupiter', name: 'Jupiter', shortName: 'JUPITER', color: '#6366f1', type: 'digital' },
];

// In-memory connected accounts and transactions
const connectedAccounts = [];
const transactions = [];

// Get available banks
router.get('/list', (req, res) => {
  res.json(BANKS);
});

// Connect a bank
router.post('/connect', (req, res) => {
  try {
    const { bankId, accountNumber, ifsc } = req.body;
    const bank = BANKS.find(b => b.id === bankId);
    if (!bank) {
      return res.status(400).json({ message: 'Invalid bank' });
    }
    const masked = accountNumber ? 'XXXX' + accountNumber.slice(-4) : 'XXXX1234';
    const account = {
      id: Date.now().toString(),
      bankId: bank.id,
      bankName: bank.name,
      shortName: bank.shortName,
      color: bank.color,
      accountNumber: masked,
      ifsc: ifsc || 'XXXX0001234',
      status: 'connected',
      balance: Math.floor(Math.random() * 500000) + 50000,
      lastSynced: new Date(),
      connectedAt: new Date()
    };
    connectedAccounts.push(account);

    // Generate mock transactions
    const categories = ['Salary', 'Investment', 'Insurance', 'Rent', 'Shopping', 'Food', 'Travel', 'Medical', 'Education', 'Utilities', 'Entertainment', 'Donations'];
    const taxCategories = ['Salary', 'Investment', 'Insurance', 'Rent', 'Medical', 'Education', 'Donations'];

    for (let i = 0; i < 15; i++) {
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const isIncome = cat === 'Salary' || (cat === 'Investment' && Math.random() > 0.5);
      const amount = isIncome
        ? Math.floor(Math.random() * 100000) + 20000
        : Math.floor(Math.random() * 15000) + 500;
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * 90));

      transactions.push({
        id: Date.now().toString() + i,
        accountId: account.id,
        bankName: bank.shortName,
        bankColor: bank.color,
        type: isIncome ? 'credit' : 'debit',
        amount,
        category: cat,
        taxDeductible: taxCategories.includes(cat),
        description: `${isIncome ? 'Received' : 'Paid'} - ${cat}`,
        date: d.toISOString(),
        merchant: isIncome ? 'Employer / Fund' : ['Amazon', 'Swiggy', 'Flipkart', 'BigBasket', 'IRCTC', 'Apollo', 'LIC', 'HDFC MF'][Math.floor(Math.random() * 8)]
      });
    }

    res.status(201).json({ account, message: 'Bank connected successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Connection error', error: err.message });
  }
});

// Get connected accounts
router.get('/accounts', (req, res) => {
  res.json(connectedAccounts);
});

// Sync transactions
router.post('/sync/:accountId', (req, res) => {
  const account = connectedAccounts.find(a => a.id === req.params.accountId);
  if (!account) {
    return res.status(404).json({ message: 'Account not found' });
  }
  account.lastSynced = new Date();
  const accountTxns = transactions.filter(t => t.accountId === account.id);
  res.json({ message: 'Sync complete', transactions: accountTxns });
});

// Get all transactions
router.get('/transactions', (req, res) => {
  const { category, type, bank, taxDeductible } = req.query;
  let filtered = [...transactions];
  if (category) filtered = filtered.filter(t => t.category === category);
  if (type) filtered = filtered.filter(t => t.type === type);
  if (bank) filtered = filtered.filter(t => t.bankName === bank);
  if (taxDeductible) filtered = filtered.filter(t => t.taxDeductible === (taxDeductible === 'true'));

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(filtered);
});

// Disconnect bank
router.delete('/disconnect/:id', (req, res) => {
  const idx = connectedAccounts.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Account not found' });
  connectedAccounts[idx].status = 'disconnected';
  connectedAccounts.splice(idx, 1);
  res.json({ message: 'Bank disconnected' });
});

module.exports = router;
