/* dashboard.js — Full dashboard logic */

const API = "";
let token   = localStorage.getItem("ts_token");
let user    = JSON.parse(localStorage.getItem("ts_user") || "null");
let profile = null;
let breakdownChart = null;
let calcChartObj   = null;
let compareChartObj = null;
let invChartObj    = null;
let investments    = JSON.parse(localStorage.getItem("ts_investments") || "[]");
const INV_GOAL     = 150000;

const COUNTRY_FLAGS = { IN:"🇮🇳", US:"🇺🇸", UK:"🇬🇧", CA:"🇨🇦", DE:"🇩🇪" };
const COUNTRY_NAMES = { IN:"India", US:"United States", UK:"United Kingdom", CA:"Canada", DE:"Germany" };
const ALERT_ICONS   = { "80C":"📊","80D":"🏥","NPS":"🏦","HRA":"🏠","HomeLoan":"🏡","401k":"💼","HSA":"💊","Itemize":"📋","BackdoorRoth":"🔄","Pension":"🏦","ISA":"💰","RRSP":"🍁","TFSA":"🍂","Riester":"🇩🇪","Werbungskosten":"🖊️","PersonalAllowance":"⚠️" };

// ── Chart Global Styling ──────────────────────────
Chart.defaults.color = "#94a3b8";
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.borderColor = "rgba(255, 255, 255, 0.05)";
Chart.defaults.plugins.tooltip.backgroundColor = "rgba(15, 15, 20, 0.9)";
Chart.defaults.plugins.tooltip.titleFont = { family: "'Outfit', sans-serif", size: 14 };
Chart.defaults.plugins.tooltip.bodyFont = { family: "'Inter', sans-serif", size: 13 };
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.cornerRadius = 8;

// ── Guard ─────────────────────────────────────────
if (!token) window.location.href = "/";

// ── API helper ────────────────────────────────────
const api = async (path, options = {}) => {
  const res = await fetch(API + path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...options.headers },
  });
  const data = await res.json();
  if (res.status === 401) { localStorage.clear(); window.location.href = "/"; }
  return data;
};

// ── Init ──────────────────────────────────────────
(async () => {
  renderUserBar();
  await loadProfile();
  updateOverview();
  await loadAlerts();
  initCalcFields();
  initDeductionFields();
  renderInvestments();
})();

// ── User bar ──────────────────────────────────────
function renderUserBar() {
  if (!user) return;
  const initial = (user.name || "?")[0].toUpperCase();
  document.getElementById("userName").textContent    = user.name;
  document.getElementById("userCountry").textContent = `${COUNTRY_FLAGS[user.country] || ""} ${COUNTRY_NAMES[user.country] || user.country}`;
  document.getElementById("userAvatar").textContent  = initial;
  document.getElementById("mobileAvatar").textContent = initial;

  // Show avatar image if exists
  if (user.avatar?.url) {
    const img = `<img src="${user.avatar.url}" alt="avatar" />`;
    document.getElementById("userAvatar").innerHTML  = img;
    document.getElementById("mobileAvatar").innerHTML = img;
  }
}

// ── Load profile ──────────────────────────────────
async function loadProfile() {
  try {
    const data = await api("/api/tax/profile");
    if (data.success && data.profile) {
      profile = data.profile;
      prefillProfileForm(profile);
    }
  } catch {}
}

// ── Animations ────────────────────────────────────
function animateValue(objId, start, end, duration, formatter) {
  const obj = document.getElementById(objId);
  if (!obj) return;
  let startTimestamp = null;
  const isFloat = end % 1 !== 0; // Check if the target is a float
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easeProgress = progress * (2 - progress); // ease-out quad
    const current = start + easeProgress * (end - start);
    obj.innerHTML = formatter(isFloat ? current.toFixed(2) : Math.floor(current));
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// ── Overview ──────────────────────────────────────
function updateOverview() {
  if (!profile || !profile.lastCalculation?.calculatedAt) {
    document.getElementById("noProfileBanner").classList.remove("hidden");
    return;
  }
  document.getElementById("noProfileBanner").classList.add("hidden");

  const sym = c.symbol || "₹";
  const fmt = (n) => sym + Number(n).toLocaleString("en-IN");

  animateValue("statGross", 0, profile.annualGrossSalary, 1500, fmt);
  animateValue("statTax", 0, c.netTax, 1500, fmt);
  animateValue("statRate", 0, c.effectiveTaxRate, 1500, (n) => n + "%");
  animateValue("statSavings", 0, c.potentialSavings, 1500, fmt);

  renderBreakdownChart(c, sym);
}

function renderBreakdownChart(c, sym) {
  const ctx = document.getElementById("breakdownChart").getContext("2d");
  if (breakdownChart) breakdownChart.destroy();

  breakdownChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Net Tax", "Deductions", "Take-Home"],
      datasets: [{
        data: [
          c.netTax || 0,
          c.totalDeductions || 0,
          Math.max(0, (profile.annualGrossSalary || 0) - (c.netTax || 0) - (c.totalDeductions || 0)),
        ],
        backgroundColor: ["#ef4444", "#8b5cf6", "#10b981"],
        hoverBackgroundColor: ["#f87171", "#a78bfa", "#34d399"],
        borderWidth: 2, borderColor: "#050508", hoverOffset: 6,
      }],
    },
      options: {
        cutout: "75%",
        plugins: {
          legend: { position: "bottom", labels: { color: "#94a3b8", font: { family: "Inter", size: 12 }, padding: 20 } },
          tooltip: { callbacks: { label: (ctx) => ` ${sym}${ctx.raw.toLocaleString("en-IN")}` } },
      },
    },
  });
}

// ── Load & Render Alerts ──────────────────────────
async function loadAlerts() {
  try {
    const data = await api("/api/tax/alerts");
    if (!data.success) return;

    const alerts = data.alerts || [];
    const count  = data.summary?.highPriority || 0;

    // Badge
    const badge = document.getElementById("alertCount");
    badge.textContent = count;
    count > 0 ? badge.classList.add("show") : badge.classList.remove("show");

    // Full alerts section
    renderAlertsList(alerts, data.summary?.currency);

    // Mini alerts in overview
    renderMiniAlerts(alerts.slice(0, 4), data.summary?.currency);
  } catch {}
}

function renderAlertsList(alerts, sym = "₹") {
  const container = document.getElementById("alertsList");
  if (!alerts.length) {
    container.innerHTML = `<div class="form-card" style="text-align:center;padding:48px;color:var(--text-muted)">🎉 Great! No major tax-saving opportunities missed. Your profile looks optimized.</div>`;
    return;
  }
  container.innerHTML = alerts.map((a) => `
    <div class="alert-card alert-card--${a.priority}">
      <div class="alert-icon">${ALERT_ICONS[a.type] || "💡"}</div>
      <div class="alert-body">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <h4>${a.type.replace(/([A-Z])/g, " $1").trim()}</h4>
          <span class="alert-priority priority-${a.priority}">${a.priority}</span>
        </div>
        <p>${a.message}</p>
        ${a.saving > 0 ? `<div class="alert-saving">💰 Save up to ${sym}${a.saving.toLocaleString("en-IN")}</div>` : ""}
      </div>
    </div>
  `).join("");
}

function renderMiniAlerts(alerts, sym = "₹") {
  const container = document.getElementById("topAlertsList");
  if (!alerts.length) {
    container.innerHTML = `<p style="color:var(--text-dim);font-size:13px">Complete your profile to see saving opportunities.</p>`;
    return;
  }
  container.innerHTML = alerts.map((a) => `
    <div class="alert-mini-row">
      <div class="ami-dot ami-dot--${a.priority}"></div>
      <span class="ami-text">${a.message.substring(0, 60)}${a.message.length > 60 ? "…" : ""}</span>
      ${a.saving > 0 ? `<span class="ami-save">${sym}${a.saving.toLocaleString("en-IN")}</span>` : ""}
    </div>
  `).join("");
}

// ── Profile Form ──────────────────────────────────
function prefillProfileForm(p) {
  if (!p) return;
  document.getElementById("jobTitle").value      = p.jobTitle || "";
  document.getElementById("organisation").value  = p.organisation || "";
  document.getElementById("employmentType").value = p.employmentType || "salaried";
  document.getElementById("industry").value      = p.industry || "";
  document.getElementById("workExp").value       = p.workExperienceYears || "";
  document.getElementById("annualSalary").value  = p.annualGrossSalary || "";
  document.getElementById("profileCountry").value = p.country || "IN";
  updateDeductionFields();

  // Fill deduction values after DOM update
  setTimeout(() => {
    const d = p.deductions || {};
    Object.keys(d).forEach((key) => {
      const el = document.getElementById(`ded_${key}`);
      if (el && d[key]) el.value = d[key];
    });
  }, 100);
}

// Deduction fields per country
const DEDUCTION_FIELDS = {
  IN: [
    { id: "section80C",       label: "Section 80C (PF, ELSS, PPF, LIC)", placeholder: "Max ₹1,50,000" },
    { id: "section80D",       label: "Section 80D (Health Insurance)",     placeholder: "Max ₹25,000" },
    { id: "section80CCD",     label: "NPS (Section 80CCD(1B))",            placeholder: "Max ₹50,000" },
    { id: "hraExemption",     label: "HRA Exemption",                       placeholder: "0 if no HRA" },
    { id: "ltaExemption",     label: "LTA Exemption",                       placeholder: "Leave Travel" },
    { id: "homeLoanInterest", label: "Home Loan Interest (24b)",           placeholder: "Max ₹2,00,000" },
    { id: "educationLoan",    label: "Education Loan Interest (80E)",      placeholder: "No limit" },
  ],
  US: [
    { id: "retirement401k",      label: "401(k) Contributions",    placeholder: "Max $23,000" },
    { id: "hsaContribution",     label: "HSA Contributions",        placeholder: "Max $4,150" },
    { id: "mortgageInterest",    label: "Mortgage Interest",         placeholder: "For itemizing" },
    { id: "charitableDonations", label: "Charitable Donations",     placeholder: "For itemizing" },
  ],
  UK: [
    { id: "pensionContributions", label: "Pension Contributions",   placeholder: "Max 40% of salary" },
    { id: "isaContributions",     label: "ISA Contributions",       placeholder: "Max £20,000" },
  ],
  CA: [
    { id: "rrspContributions", label: "RRSP Contributions", placeholder: "Max 18% of income" },
    { id: "tfsaContributions", label: "TFSA Contributions", placeholder: "Max CA$7,000" },
  ],
  DE: [
    { id: "riesterPension", label: "Riester Pension",    placeholder: "Max 4% of income" },
  ],
};

function updateDeductionFields() {
  const country  = document.getElementById("profileCountry")?.value || "IN";
  const fields   = DEDUCTION_FIELDS[country] || [];
  const container = document.getElementById("deductionFields");
  container.innerHTML = fields.map((f) => `
    <div class="form-group">
      <label>${f.label}</label>
      <input type="number" id="ded_${f.id}" placeholder="${f.placeholder}" min="0" />
    </div>
  `).join("");
}
updateDeductionFields();

function initDeductionFields() {
  updateDeductionFields();
  if (profile) prefillProfileForm(profile);
}

// Save profile
document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("saveProfileBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="loader"></span> Saving...`;

  const country = document.getElementById("profileCountry").value;
  const fields  = DEDUCTION_FIELDS[country] || [];
  const deductions = {};
  fields.forEach((f) => {
    const val = document.getElementById(`ded_${f.id}`)?.value;
    if (val) deductions[f.id] = Number(val);
  });

  const payload = {
    jobTitle:           document.getElementById("jobTitle").value,
    organisation:       document.getElementById("organisation").value,
    employmentType:     document.getElementById("employmentType").value,
    industry:           document.getElementById("industry").value,
    workExperienceYears: Number(document.getElementById("workExp").value) || 0,
    annualGrossSalary:  Number(document.getElementById("annualSalary").value),
    country,
    currency:           { IN:"INR",US:"USD",UK:"GBP",CA:"CAD",DE:"EUR" }[country] || "INR",
    deductions,
  };

  try {
    const data = await api("/api/tax/profile", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (data.success) {
      profile = data.profile;
      const msg = document.getElementById("profileMsg");
      msg.textContent = "✅ Profile saved & tax calculated!";
      msg.classList.remove("hidden");
      setTimeout(() => msg.classList.add("hidden"), 3000);
      updateOverview();
      await loadAlerts();
    }
  } catch (err) {
    alert("Error saving profile: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = "<span>Save & Calculate</span>";
  }
});

// ── Calculator ────────────────────────────────────
function initCalcFields() { updateCalcFields(); }

function updateCalcFields() {
  const country  = document.getElementById("calcCountry")?.value || "IN";
  const fields   = DEDUCTION_FIELDS[country] || [];
  const container = document.getElementById("calcDeductionFields");
  container.innerHTML = fields.map((f) => `
    <div class="form-group">
      <label>${f.label}</label>
      <input type="number" id="calc_${f.id}" placeholder="${f.placeholder}" min="0" />
    </div>
  `).join("");
}

async function runCalculation() {
  const country = document.getElementById("calcCountry").value;
  const income  = Number(document.getElementById("calcIncome").value);
  if (!income) return alert("Please enter an income amount.");

  const fields = DEDUCTION_FIELDS[country] || [];
  const deductions = {};
  fields.forEach((f) => {
    const val = document.getElementById(`calc_${f.id}`)?.value;
    if (val) deductions[f.id] = Number(val);
  });

  try {
    const data = await api("/api/tax/calculate", {
      method: "POST",
      body: JSON.stringify({ country, income, deductions }),
    });

    if (!data.success) return alert(data.message);

    const sym = data.symbol || "₹";
    const fmt = (n) => sym + Number(n || 0).toLocaleString("en-IN");

    const resultEl = document.getElementById("calcResult");
    resultEl.classList.remove("hidden");

    document.getElementById("calcResultTitle").textContent =
      `Tax Breakdown — ${COUNTRY_FLAGS[country]} ${COUNTRY_NAMES[country]}`;

    const rows = [
      { label: "Gross Income",       value: fmt(income),                  cls: "" },
      { label: "Total Deductions",   value: fmt(data.totalDeductions),    cls: "" },
      { label: "Taxable Income",     value: fmt(data.taxableIncome),      cls: "" },
      { label: "Net Tax Payable",    value: fmt(data.netTax),             cls: "highlight" },
      { label: "Effective Tax Rate", value: data.effectiveTaxRate + "%",  cls: "" },
      { label: "Potential Savings",  value: fmt(data.potentialSavings),   cls: "saving" },
    ];

    document.getElementById("resultRows").innerHTML = rows.map((r) => `
      <div class="result-row ${r.cls}">
        <span class="rr-label">${r.label}</span>
        <span class="rr-value">${r.value}</span>
      </div>
    `).join("");

    // Mini donut chart
    const ctx = document.getElementById("calcChart").getContext("2d");
    if (calcChartObj) calcChartObj.destroy();
    calcChartObj = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Net Tax", "Deductions", "Take-Home"],
        datasets: [{
          data: [data.netTax || 0, data.totalDeductions || 0, Math.max(0, income - (data.netTax || 0) - (data.totalDeductions || 0))],
          backgroundColor: ["#ef4444", "#8b5cf6", "#10b981"],
          hoverBackgroundColor: ["#f87171", "#a78bfa", "#34d399"],
          borderWidth: 2, borderColor: "#050508",
        }],
      },
      options: {
        cutout: "70%",
        plugins: {
          legend: { position: "bottom", labels: { color: "#94a3b8", font: { family: "Inter", size: 12 }, padding: 16 } },
        },
      },
    });
  } catch (err) { alert("Calculation error: " + err.message); }
}

// ── Documents ─────────────────────────────────────
async function loadDocuments() {
  const data = await api("/api/tax/profile");
  if (!data.success || !data.profile) return;
  const docs = data.profile.documents || [];
  const container = document.getElementById("documentsList");
  const TYPE_ICON = { salary_slip:"💵", form16:"📄", offer_letter:"📑", other:"📎" };

  if (!docs.length) {
    container.innerHTML = `<p style="color:var(--text-muted);font-size:13px">No documents uploaded yet.</p>`;
    return;
  }
  container.innerHTML = docs.map((d) => `
    <div class="doc-card">
      <div class="doc-icon">${TYPE_ICON[d.type] || "📎"}</div>
      <div class="doc-info">
        <div class="doc-name">${d.name}</div>
        <div class="doc-meta">${d.type.replace("_", " ")} • ${new Date(d.uploadedAt).toLocaleDateString()}</div>
      </div>
      <div class="doc-actions">
        <a href="${d.url}" target="_blank" class="btn-icon" title="View">👁</a>
        <button class="btn-icon del" title="Delete" onclick="deleteDocument('${d.public_id}')">🗑</button>
      </div>
    </div>
  `).join("");
}

async function uploadDocument() {
  const file    = document.getElementById("docFile").files[0];
  const docType = document.getElementById("docType").value;
  const docName = document.getElementById("docName").value || file?.name;

  if (!file) return alert("Please select a file first.");

  const formData = new FormData();
  formData.append("document", file);
  formData.append("docType", docType);
  formData.append("docName", docName);

  try {
    const res  = await fetch(`${API}/api/tax/document`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (data.success) { alert("✅ Document uploaded!"); loadDocuments(); }
    else alert(data.message);
  } catch (err) { alert("Upload error: " + err.message); }
}

async function deleteDocument(publicId) {
  if (!confirm("Delete this document?")) return;
  const encoded = encodeURIComponent(publicId);
  const data = await api(`/api/tax/document/${encoded}`, { method: "DELETE" });
  if (data.success) loadDocuments();
}

// Drag and drop
const zone = document.getElementById("uploadZone");
zone.addEventListener("dragover",  (e) => { e.preventDefault(); zone.style.borderColor = "var(--accent)"; });
zone.addEventListener("dragleave", ()  => { zone.style.borderColor = ""; });
zone.addEventListener("drop",      (e) => {
  e.preventDefault(); zone.style.borderColor = "";
  document.getElementById("docFile").files = e.dataTransfer.files;
});

// ── Compare ───────────────────────────────────────
async function compareCountries() {
  const income = document.getElementById("compareIncome").value;
  if (!income) return alert("Enter an income amount.");

  try {
    const data = await api(`/api/tax/compare/${income}`);
    if (!data.success) return alert(data.message);

    const comparison = data.comparison;
    const minTax = Math.min(...comparison.map((c) => c.netTax));

    const resultEl = document.getElementById("compareResult");
    resultEl.classList.remove("hidden");
    resultEl.innerHTML = comparison.map((c) => `
      <div class="compare-card ${c.netTax === minTax ? "lowest" : ""}">
        <div class="cc-flag">${COUNTRY_FLAGS[c.country]}</div>
        <div class="cc-country">${COUNTRY_NAMES[c.country]}</div>
        <div class="cc-tax">${c.symbol}${c.netTax.toLocaleString()}</div>
        <div class="cc-rate">${c.effectiveTaxRate}% effective rate</div>
        ${c.netTax === minTax ? `<div style="font-size:10px;color:var(--green);margin-top:6px;font-weight:600">LOWEST TAX</div>` : ""}
      </div>
    `).join("");

    // Bar chart
    const chartEl = document.getElementById("compareChart");
    chartEl.classList.remove("hidden");
    if (compareChartObj) compareChartObj.destroy();
    compareChartObj = new Chart(chartEl.getContext("2d"), {
      type: "bar",
      data: {
        labels: comparison.map((c) => COUNTRY_NAMES[c.country]),
        datasets: [{
          label: "Net Tax",
          data:  comparison.map((c) => c.netTax),
          backgroundColor: comparison.map((c) => c.netTax === minTax ? "#10b981" : "#8b5cf6"),
          hoverBackgroundColor: comparison.map((c) => c.netTax === minTax ? "#34d399" : "#a78bfa"),
          borderRadius: 8, borderSkipped: false,
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#94a3b8", font: { family: "Inter" } }, grid: { display: false } },
          y: { ticks: { color: "#94a3b8", font: { family: "Inter" } }, grid: { color: "rgba(255,255,255,0.05)" } },
        },
      },
    });
  } catch (err) { alert("Error: " + err.message); }
}

// ── Investments ───────────────────────────────────
document.getElementById("investmentForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const category = document.getElementById("invCategory").value;
  const amount = Number(document.getElementById("invAmount").value);
  const date = document.getElementById("invDate").value;

  investments.unshift({ id: Date.now().toString(), category, amount, date });
  localStorage.setItem("ts_investments", JSON.stringify(investments));
  
  e.target.reset();
  renderInvestments();
});

function renderInvestments() {
  const container = document.getElementById("investmentsList");
  if (!container) return;

  if (!investments.length) {
    container.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--text-dim); font-size: 13px;">No investments added yet. Start tracking!</div>`;
  } else {
    container.innerHTML = investments.map(inv => `
      <div class="inv-item">
        <div class="inv-item-info">
          <strong>${inv.category}</strong>
          <small>${new Date(inv.date).toLocaleDateString()}</small>
        </div>
        <div style="display:flex; align-items:center;">
          <div class="inv-item-amount">₹${inv.amount.toLocaleString("en-IN")}</div>
          <button class="btn-del-inv" onclick="deleteInvestment('${inv.id}')" title="Remove">🗑</button>
        </div>
      </div>
    `).join("");
  }

  const total = investments.reduce((sum, inv) => sum + inv.amount, 0);
  document.getElementById("invTotalAmount").textContent = "₹" + total.toLocaleString("en-IN");
  
  const percent = Math.min(100, Math.round((total / INV_GOAL) * 100));
  document.getElementById("invGoalPercent").textContent = percent + "%";

  renderInvestmentChart(total, INV_GOAL);
}

window.deleteInvestment = function(id) {
  investments = investments.filter(i => i.id !== id);
  localStorage.setItem("ts_investments", JSON.stringify(investments));
  renderInvestments();
};

function renderInvestmentChart(total, goal) {
  const ctx = document.getElementById("investmentChart")?.getContext("2d");
  if (!ctx) return;
  if (invChartObj) invChartObj.destroy();

  const remaining = Math.max(0, goal - total);

  invChartObj = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Invested", "Remaining Goal"],
      datasets: [{
        data: [total, remaining],
        backgroundColor: ["#10b981", "rgba(255,255,255,0.05)"],
        borderWidth: 0,
        hoverBackgroundColor: ["#34d399", "rgba(255,255,255,0.08)"],
      }],
    },
    options: {
      cutout: "80%",
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => \` ₹\${ctx.raw.toLocaleString("en-IN")}\` } }
      },
    },
  });
}

// ── Section navigation ────────────────────────────
function switchSection(name) {
  document.querySelectorAll(".section").forEach((s)    => s.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach((l)   => l.classList.remove("active"));
  document.getElementById(`section-${name}`)?.classList.add("active");
  document.querySelector(`[data-section="${name}"]`)?.classList.add("active");

  // Lazy load on tab switch
  if (name === "documents") loadDocuments();
}

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    switchSection(link.dataset.section);
    document.getElementById("sidebar").classList.remove("open");
  });
});

// ── Sidebar mobile toggle ─────────────────────────
document.getElementById("burgerBtn")?.addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/";
});

// ── AI Assistant Chat ─────────────────────────────
function handleChatKeyPress(e) {
  if (e.key === "Enter") {
    sendChatMessage();
  }
}

async function sendChatMessage() {
  const inputEl = document.getElementById("chatInput");
  const message = inputEl.value.trim();
  if (!message) return;

  // Add user message
  appendChatMessage("user", message);
  inputEl.value = "";
  inputEl.disabled = true;

  // Add loading AI message
  const loadingId = "msg-" + Date.now();
  appendChatMessage("ai", "<span class='loader'></span>", loadingId);

  try {
    const data = await api("/api/tax/assistant", {
      method: "POST",
      body: JSON.stringify({ message })
    });

    // Replace loading with actual response
    const aiBubble = document.getElementById(loadingId);
    if (aiBubble) {
      if (data.success) {
        aiBubble.innerHTML = data.reply;
      } else {
        aiBubble.innerHTML = "Sorry, I encountered an error. Please try again.";
      }
    }
  } catch (err) {
    const aiBubble = document.getElementById(loadingId);
    if (aiBubble) aiBubble.innerHTML = "Network error. Please try again later.";
  } finally {
    inputEl.disabled = false;
    inputEl.focus();
    scrollToChatBottom();
  }
}

function appendChatMessage(role, text, id = null) {
  const chatMessages = document.getElementById("chatMessages");
  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-message ${role}`;
  
  const avatar = role === "ai" ? "🤖" : (user ? (user.name || "U")[0].toUpperCase() : "U");
  
  msgDiv.innerHTML = `
    <div class="chat-avatar">${avatar}</div>
    <div class="chat-bubble" ${id ? `id="${id}"` : ""}>${text}</div>
  `;
  
  chatMessages.appendChild(msgDiv);
  scrollToChatBottom();
}

function scrollToChatBottom() {
  const chatMessages = document.getElementById("chatMessages");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
