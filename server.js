const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/pages'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tax', require('./routes/tax'));
app.use('/api/bank', require('./routes/bank'));
app.use('/api/features', require('./routes/features'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Tax Saver Pro running on http://localhost:${PORT}\n`);
});

module.exports = app;
