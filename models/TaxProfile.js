const mongoose = require("mongoose");

const TaxProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // --- Job Information ---
    jobTitle: { type: String, required: true, trim: true },
    organisation: { type: String, required: true, trim: true },
    employmentType: {
      type: String,
      enum: ["salaried", "self-employed", "freelancer", "business"],
      required: true,
    },
    industry: { type: String, trim: true },
    workExperienceYears: { type: Number, default: 0 },

    // --- Income Details ---
    annualGrossSalary: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    country: { type: String, required: true, default: "IN" },

    // --- Deductions / Investments (per country) ---
    deductions: {
      // India specific
      section80C: { type: Number, default: 0 },      // PF, LIC, ELSS, PPF etc.
      section80D: { type: Number, default: 0 },      // Health Insurance
      section80CCD: { type: Number, default: 0 },    // NPS
      hraExemption: { type: Number, default: 0 },    // HRA
      ltaExemption: { type: Number, default: 0 },    // LTA
      homeLoanInterest: { type: Number, default: 0 },// 24b
      educationLoan: { type: Number, default: 0 },   // 80E

      // US specific
      retirement401k: { type: Number, default: 0 },
      hsaContribution: { type: Number, default: 0 },
      mortgageInterest: { type: Number, default: 0 },
      charitableDonations: { type: Number, default: 0 },

      // UK specific
      pensionContributions: { type: Number, default: 0 },
      isaContributions: { type: Number, default: 0 },

      // Canada
      rrspContributions: { type: Number, default: 0 },
      tfsaContributions: { type: Number, default: 0 },

      // Germany
      riesterPension: { type: Number, default: 0 },
    },

    // --- Documents (Cloudinary URLs) ---
    documents: [
      {
        name: String,
        url: String,
        public_id: String,
        type: { type: String, enum: ["salary_slip", "form16", "offer_letter", "other"] },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // --- Calculated Results (cached) ---
    lastCalculation: {
      grossTax: { type: Number, default: 0 },
      effectiveTaxRate: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
      taxableIncome: { type: Number, default: 0 },
      netTax: { type: Number, default: 0 },
      potentialSavings: { type: Number, default: 0 },
      calculatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaxProfile", TaxProfileSchema);
