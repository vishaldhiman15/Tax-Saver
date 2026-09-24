const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

router.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

router.get('/calculator', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'calculator.html'));
});

router.get('/bank-connect', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'bank-connect.html'));
});

router.get('/transactions', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'transactions.html'));
});

router.get('/investments', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'investments.html'));
});

router.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'reports.html'));
});

router.get('/assistant', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'assistant.html'));
});

router.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'profile.html'));
});

module.exports = router;
