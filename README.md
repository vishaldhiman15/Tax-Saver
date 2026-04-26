# 🧾 TaxSmart — Intelligent Tax Advisor

> **Portfolio / Interview Project** — Full-stack web app demonstrating Node.js, MongoDB, Cloudinary, REST APIs, and multi-country business logic.
>
> ⚠️ **Disclaimer**: This is an educational demo project only. Not intended for real financial/tax advice.

![TaxSmart Banner](https://via.placeholder.com/900x300/0c0e14/4f6ef7?text=TaxSmart+%E2%80%94+Tax+Saving+Advisor)

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🌍 **Multi-Country Tax Engine** | India, USA, UK, Canada, Germany — each with real 2024 tax slabs |
| 🔔 **Smart Alerts** | Personalized saving opportunities based on your profile |
| 📊 **Dashboard + Charts** | Income breakdown, effective rate, donut charts via Chart.js |
| 📁 **Document Vault** | Upload salary slips, Form 16, offer letters via Cloudinary |
| 🔐 **Auth System** | JWT-based register/login with bcrypt password hashing |
| 🌐 **Country Comparison** | Compare how the same salary is taxed across 5 countries |

---

## 🏗️ Tech Stack

```
Frontend          Backend           Database         Cloud
─────────         ───────           ────────         ─────
HTML5             Node.js           MongoDB          Cloudinary
CSS3 (Variables)  Express.js        Mongoose ODM     (File Storage)
Vanilla JS        JWT Auth
Chart.js          bcryptjs
                  express-validator
                  multer
```

---

## 📁 Project Structure

```
taxsmart/
├── server.js                 # Express entry point
├── package.json
├── .env.example              # Environment template
│
├── config/
│   ├── db.js                 # MongoDB connection
│   └── cloudinary.js         # Cloudinary + Multer config
│
├── models/
│   ├── User.js               # User schema (auth, avatar)
│   └── TaxProfile.js         # Job data + deductions + documents
│
├── routes/
│   ├── auth.js               # POST /register, /login, GET /me
│   └── tax.js                # GET/POST /profile, /calculate, /alerts, /compare
│
├── middleware/
│   └── auth.js               # JWT protect middleware
│
├── utils/
│   └── taxCalculator.js      # Multi-country tax calculation logic
│
└── public/
    ├── index.html            # Auth page (login/register)
    ├── dashboard.html        # Main app dashboard
    ├── css/style.css         # Full stylesheet
    └── js/
        ├── main.js           # Auth page logic
        └── dashboard.js      # Dashboard logic + Chart.js
```

---

## ⚙️ Setup & Run

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/taxsmart.git
cd taxsmart
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Fill in your MongoDB URI, JWT secret, and Cloudinary credentials
```

### 3. MongoDB Setup
- Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
- Copy the connection string to `MONGO_URI` in `.env`

### 4. Cloudinary Setup
- Sign up at [cloudinary.com](https://cloudinary.com)
- Copy Cloud Name, API Key, API Secret to `.env`

### 5. Run
```bash
# Development
npm run dev

# Production
npm start
```

Open `http://localhost:5000`

---

## 🌍 Supported Countries & Tax Logic

| Country | Deductions Covered |
|---|---|
| 🇮🇳 **India** | Sec 80C, 80D, NPS (80CCD), HRA, LTA, Home Loan (24b), Education Loan (80E) |
| 🇺🇸 **USA** | 401(k), HSA, Mortgage Interest, Charitable Donations, Standard/Itemized |
| 🇬🇧 **UK** | Pension (40% relief), ISA, Personal Allowance tapering |
| 🇨🇦 **Canada** | RRSP, TFSA, Basic Personal Amount |
| 🇩🇪 **Germany** | Riester Pension, Employee Allowance, Solidarity Surcharge |

---

## 🔌 API Endpoints

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login, returns JWT
GET    /api/auth/me                Get current user
PUT    /api/auth/avatar            Upload profile picture (Cloudinary)

GET    /api/tax/profile            Get saved tax profile
POST   /api/tax/profile            Save/update job profile
POST   /api/tax/calculate          Run quick tax calculation
GET    /api/tax/alerts             Get personalised saving alerts
POST   /api/tax/document           Upload document (Cloudinary)
DELETE /api/tax/document/:id       Delete document
GET    /api/tax/compare/:income    Compare tax across all countries
```

---

## 🔑 Demo Credentials
```
Email:    demo@taxsmart.dev
Password: demo123
```

---

## 📸 Screenshots

> Dashboard · Alerts · Country Comparison · Document Vault

---

## 🛠️ Interview Talking Points

1. **Architecture Decision**: Why REST over GraphQL for this use case
2. **Tax Logic Separation**: `utils/taxCalculator.js` is pure functions — easy to unit test
3. **Security**: JWT stateless auth, bcrypt hashing, file-type validation on uploads
4. **Cloudinary Usage**: Transformation pipeline for avatar cropping, resource_type auto for mixed docs
5. **Scalability**: Adding new country = one new function in `taxCalculator.js`
6. **Schema Design**: Flexible `deductions` object in MongoDB handles all countries in one collection

---

## 📄 License
MIT — Educational use only
