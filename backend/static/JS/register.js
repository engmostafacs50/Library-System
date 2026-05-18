// ── Password strength ────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const pwInput = document.getElementById("Password");
  const cfInput = document.getElementById("ConfirmPassword");

  if (pwInput) {
    pwInput.addEventListener("input", () => {
      checkStrength(pwInput.value);
      if (cfInput.value) checkMatch();
    });
  }

  if (cfInput) {
    cfInput.addEventListener("input", checkMatch);
  }

  // Ripple on submit button
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.addEventListener("click", function (e) {
      const r    = document.createElement("span");
      r.classList.add("ripple");
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      r.style.width  = size + "px";
      r.style.height = size + "px";
      r.style.left   = (e.clientX - rect.left - size / 2) + "px";
      r.style.top    = (e.clientY - rect.top  - size / 2) + "px";
      this.appendChild(r);
      setTimeout(() => r.remove(), 550);
    });
  }
});

function checkStrength(pw) {
  const fill  = document.getElementById("strengthFill");
  const label = document.getElementById("strengthLabel");
  if (!fill || !label) return;

  let score = 0;
  if (pw.length >= 8)             score++;
  if (/[A-Z]/.test(pw))          score++;
  if (/[0-9]/.test(pw))          score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;

  const levels = [
    { pct: "0%",   color: "transparent",  text: "" },
    { pct: "25%",  color: "#ef4444",      text: "Weak" },
    { pct: "50%",  color: "#f97316",      text: "Fair" },
    { pct: "75%",  color: "#eab308",      text: "Good" },
    { pct: "100%", color: "#22c55e",      text: "Strong" },
  ];

  const lvl = pw.length === 0 ? levels[0] : levels[score] || levels[1];
  fill.style.width      = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent     = lvl.text;
  label.style.color     = lvl.color;
}

function checkMatch() {
  const pw  = document.getElementById("Password").value;
  const cf  = document.getElementById("ConfirmPassword").value;
  const lbl = document.getElementById("matchLabel");
  if (!lbl || !cf) return;

  if (pw === cf) {
    lbl.textContent = "✓ Passwords match";
    lbl.style.color = "#22c55e";
  } else {
    lbl.textContent = "✗ Passwords do not match";
    lbl.style.color = "#ef4444";
  }
}

// ── Toggle password visibility ───────────────────────────
function togglePw(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon  = document.getElementById(iconId);
  if (!input || !icon) return;

  if (input.type === "password") {
    input.type = "text";
    icon.innerHTML =
      '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94"/>' +
      '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19"/>' +
      '<line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    input.type = "password";
    icon.innerHTML =
      '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>' +
      '<circle cx="12" cy="12" r="3"/>';
  }
}

// ── Toast ────────────────────────────────────────────────
function showToast(msg, type = "error") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className   = "toast" + (type === "success" ? " success" : "");
  // Force reflow to restart transition
  void t.offsetWidth;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3500);
}

// ── Loading state ────────────────────────────────────────
function setLoading(isLoading) {
  const btn  = document.getElementById("submitBtn");
  const txt  = document.getElementById("btnText");
  const dots = document.getElementById("dots");
  if (!btn) return;

  if (isLoading) {
    txt.style.display  = "none";
    dots.style.display = "flex";
    btn.disabled       = true;
  } else {
    txt.style.display  = "";
    dots.style.display = "none";
    btn.disabled       = false;
  }
}

// ── Reset form ───────────────────────────────────────────
function ResetForm() {
  document.getElementById("UserName").value        = "";
  document.getElementById("userEmail").value       = "";
  document.getElementById("Password").value        = "";
  document.getElementById("ConfirmPassword").value = "";
  checkStrength("");
  const lbl = document.getElementById("matchLabel");
  if (lbl) lbl.textContent = "";
}

// ── Submit / API call ────────────────────────────────────
async function AddUser() {
  const fullName = document.getElementById("UserName").value.trim();
  const email    = document.getElementById("userEmail").value.trim();
  const password = document.getElementById("Password").value;
  const confirm  = document.getElementById("ConfirmPassword").value;

  const nameRegex     = /^[A-Za-z][A-Za-z\s]{2,29}$/;
  const emailRegex    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  if (!nameRegex.test(fullName)) {
    showToast("Name must be 3–30 characters, letters only.");
    return;
  }
  if (!emailRegex.test(email)) {
    showToast("Invalid email format.");
    return;
  }
  if (!passwordRegex.test(password)) {
    showToast("Password: min 8 chars with letters and numbers.");
    return;
  }
  if (password !== confirm) {
    showToast("Passwords do not match.");
    return;
  }

  const username = fullName.toLowerCase().replace(/\s+/g, "_");

  setLoading(true);

  try {
    const response = await fetch("/api/users/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        username: username,
        email:    email,
        password: password,
        role:     "USER",
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showToast("Account created successfully!", "success");
      setTimeout(() => { window.location.href = "/login/"; }, 1500);
    } else {
      setLoading(false);
      if (data.email)                 showToast("Email: " + data.email[0]);
      else if (data.username)         showToast("Username: " + data.username[0]);
      else if (data.password)         showToast("Password: " + data.password[0]);
      else if (data.non_field_errors) showToast(data.non_field_errors[0]);
      else                            showToast("Registration failed.");
    }

  } catch (error) {
    setLoading(false);
    showToast("Cannot connect to server. Make sure Django is running.");
    console.error(error);
  }
}

// Allow handleSubmit call from HTML onclick
function handleSubmit(btn) {
  AddUser();
}