const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { uploadDocument } = require("../config/cloudinary");
const { cloudinary } = require("../config/cloudinary");
const TaxProfile = require("../models/TaxProfile");
const User = require("../models/User");
const { calculateTax } = require("../utils/taxCalculator");

// ─── GET /api/tax/profile ──────────────────────────
router.get("/profile", protect, async (req, res) => {
  try {
    const profile = await TaxProfile.findOne({ user: req.user._id });
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/tax/profile ─────────────────────────
router.post("/profile", protect, async (req, res) => {
  try {
    const {
      jobTitle, organisation, employmentType, industry,
      workExperienceYears, annualGrossSalary, currency, country, deductions,
    } = req.body;

    let profile = await TaxProfile.findOne({ user: req.user._id });

    if (profile) {
      // Update existing
      profile.jobTitle = jobTitle;
      profile.organisation = organisation;
      profile.employmentType = employmentType;
      profile.industry = industry;
      profile.workExperienceYears = workExperienceYears;
      profile.annualGrossSalary = annualGrossSalary;
      profile.currency = currency;
      profile.country = country;
      profile.deductions = { ...profile.deductions.toObject?.() || {}, ...deductions };
    } else {
      profile = new TaxProfile({
        user: req.user._id,
        jobTitle, organisation, employmentType, industry,
        workExperienceYears, annualGrossSalary, currency, country,
        deductions: deductions || {},
      });
    }

    // Auto-calculate on save
    const result = calculateTax(country, annualGrossSalary, deductions || {});
    profile.lastCalculation = { ...result, calculatedAt: new Date() };

    await profile.save();
    await User.findByIdAndUpdate(req.user._id, { isProfileComplete: true, country });

    res.json({ success: true, profile, calculation: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/tax/calculate ───────────────────────
router.post("/calculate", protect, async (req, res) => {
  try {
    const { country, income, deductions } = req.body;
    if (!country || !income)
      return res.status(400).json({ success: false, message: "country and income are required" });

    const result = calculateTax(country, Number(income), deductions || {});

    // Update cached calculation on profile
    await TaxProfile.findOneAndUpdate(
      { user: req.user._id },
      { lastCalculation: { ...result, calculatedAt: new Date() } }
    );

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/tax/alerts ───────────────────────────
router.get("/alerts", protect, async (req, res) => {
  try {
    const profile = await TaxProfile.findOne({ user: req.user._id });
    if (!profile)
      return res.status(404).json({ success: false, message: "Complete your tax profile first" });

    const result = calculateTax(
      profile.country,
      profile.annualGrossSalary,
      profile.deductions.toObject?.() || profile.deductions
    );

    // Sort alerts by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    result.alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    res.json({
      success: true,
      alerts: result.alerts,
      summary: {
        totalAlerts: result.alerts.length,
        highPriority: result.alerts.filter((a) => a.priority === "high").length,
        potentialSavings: result.potentialSavings,
        currency: result.symbol,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/tax/document ────────────────────────
router.post("/document", protect, uploadDocument.single("document"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: "No file uploaded" });

    const { docType = "other", docName } = req.body;

    const profile = await TaxProfile.findOne({ user: req.user._id });
    if (!profile)
      return res.status(404).json({ success: false, message: "Create tax profile first" });

    profile.documents.push({
      name: docName || req.file.originalname,
      url: req.file.path,
      public_id: req.file.filename,
      type: docType,
    });

    await profile.save();
    res.json({
      success: true,
      message: "Document uploaded",
      document: profile.documents[profile.documents.length - 1],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/tax/document/:public_id ──────────
router.delete("/document/:public_id", protect, async (req, res) => {
  try {
    const profile = await TaxProfile.findOne({ user: req.user._id });
    if (!profile)
      return res.status(404).json({ success: false, message: "Profile not found" });

    const docIndex = profile.documents.findIndex(
      (d) => d.public_id === req.params.public_id
    );
    if (docIndex === -1)
      return res.status(404).json({ success: false, message: "Document not found" });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(req.params.public_id, { resource_type: "auto" });

    profile.documents.splice(docIndex, 1);
    await profile.save();
    res.json({ success: true, message: "Document deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/tax/compare ──────────────────────────
// Compare tax across countries for same salary
router.get("/compare/:income", protect, async (req, res) => {
  try {
    const income = Number(req.params.income);
    const countries = ["IN", "US", "UK", "CA", "DE"];
    const comparison = countries.map((c) => {
      const result = calculateTax(c, income, {});
      return {
        country: c,
        netTax: result.netTax,
        effectiveTaxRate: result.effectiveTaxRate,
        symbol: result.symbol,
        currency: result.currency,
      };
    });
    res.json({ success: true, income, comparison });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/tax/assistant ──────────────────────
router.post("/assistant", protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "Message is required" });

    // A simple simulated AI response based on keywords
    let reply = "I am your AI Tax Assistant. I can help you understand deductions, compare tax regimes, or plan your investments. How can I assist you today?";
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes("save") || lowerMsg.includes("deduction") || lowerMsg.includes("80c")) {
      reply = "To maximize your tax savings, consider investing in Section 80C instruments like ELSS, PPF, or EPF up to ₹1.5L. Also, health insurance premiums under Section 80D can save you up to ₹25,000 (or ₹50,000 for senior citizens).";
    } else if (lowerMsg.includes("regime") || lowerMsg.includes("old") || lowerMsg.includes("new")) {
      reply = "The New Tax Regime offers lower tax rates but removes most deductions (like 80C, HRA). The Old Regime has higher rates but allows you to claim all your deductions. Generally, if your deductions exceed ₹3.75L, the Old Regime might be better.";
    } else if (lowerMsg.includes("hra") || lowerMsg.includes("rent")) {
      reply = "House Rent Allowance (HRA) exemption is available if you live in rented accommodation. The exemption is the minimum of: 1) Actual HRA received, 2) 50% of basic salary (metro) or 40% (non-metro), 3) Actual rent paid minus 10% of basic salary.";
    } else if (lowerMsg.includes("compare") || lowerMsg.includes("country")) {
      reply = "You can use the 'Country Compare' tab to see how your income is taxed across different countries like US, UK, Canada, and Germany based on current tax brackets.";
    } else if (lowerMsg.includes("salary") || lowerMsg.includes("income")) {
      reply = "Make sure your Annual Gross Salary in your profile is accurate. I can calculate your exact tax liability and suggest potential savings based on your exact income tier.";
    }

    // Simulate network delay for AI feel
    setTimeout(() => {
      res.json({ success: true, reply });
    }, 1000);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
