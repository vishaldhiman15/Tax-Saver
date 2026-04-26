require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");

// ── Connect Database ──────────────────────────────
connectDB();

const app = express();

// ── Middleware ────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// ── API Routes ────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tax",  require("./routes/tax"));

// ── Health Check ──────────────────────────────────
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", message: "TaxSmart API running 🚀", time: new Date() })
);

// ── Serve Frontend ────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

// ── Global Error Handler ──────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`\n🚀 TaxSmart server running on http://localhost:${PORT}`)
);
