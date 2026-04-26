/* main.js — Auth page logic */

const API = "";  // same origin

// ── Tab switching ────────────────────────────────
document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".auth-form").forEach((f) => f.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`${tab.dataset.tab}Form`).classList.add("active");
  });
});

// ── Helpers ──────────────────────────────────────
const showError = (id, msg) => {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove("hidden");
};
const hideError = (id) => document.getElementById(id).classList.add("hidden");

const setLoading = (btnId, loading) => {
  const btn = document.getElementById(btnId);
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="loader"></span> Please wait...`
    : btn.dataset.original;
};

document.querySelectorAll(".btn--primary[id]").forEach((b) => {
  b.dataset.original = b.innerHTML;
});

// ── Login ────────────────────────────────────────
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError("loginError");
  setLoading("loginBtn", true);

  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const res  = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!data.success) {
      showError("loginError", data.message || "Invalid credentials");
    } else {
      localStorage.setItem("ts_token", data.token);
      localStorage.setItem("ts_user",  JSON.stringify(data.user));
      window.location.href = "/dashboard.html";
    }
  } catch {
    showError("loginError", "Network error. Please try again.");
  } finally {
    setLoading("loginBtn", false);
  }
});

// ── Register ─────────────────────────────────────
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError("registerError");
  setLoading("registerBtn", true);

  const name     = document.getElementById("regName").value.trim();
  const email    = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const country  = document.getElementById("regCountry").value;

  try {
    const res  = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, country }),
    });
    const data = await res.json();

    if (!data.success) {
      const msg = data.errors ? data.errors.map((e) => e.msg).join(", ") : data.message;
      showError("registerError", msg);
    } else {
      localStorage.setItem("ts_token", data.token);
      localStorage.setItem("ts_user",  JSON.stringify(data.user));
      window.location.href = "/dashboard.html";
    }
  } catch {
    showError("registerError", "Network error. Please try again.");
  } finally {
    setLoading("registerBtn", false);
  }
});

// ── Redirect if already logged in ────────────────
if (localStorage.getItem("ts_token")) {
  window.location.href = "/dashboard.html";
}
