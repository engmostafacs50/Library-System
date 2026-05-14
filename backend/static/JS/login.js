const API_BASE = "";

async function Login() {
  const email    = document.getElementById("userEmail").value.trim();
  const password = document.getElementById("Password").value;

  if (!email || !password) {
    showToast("Please fill in all fields.");
    return;
  }

  // Start loading state
  setLoading(true);

  try {
    const response = await fetch(API_BASE + "/api/users/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      const user = data.user;

      // Only display info — auth is handled by HttpOnly cookies
      sessionStorage.setItem("user_username", user.username);
      sessionStorage.setItem("user_role",     user.role);

      // Redirect based on role
      if (user.role === "ADMIN") {
        window.location.href = "/dashboard/";
      } else {
        window.location.href = "/homepage/";
      }

    } else {
      setLoading(false);
      if (data.non_field_errors) {
        showToast(data.non_field_errors[0]);
      } else {
        showToast("Invalid email or password.");
      }
    }

  } catch (error) {
    setLoading(false);
    showToast("Cannot connect to server. Make sure Django is running.");
    console.error(error);
  }
}

// ── UI Helpers ──────────────────────────────────────────

function setLoading(isLoading) {
  const btn  = document.getElementById("loginBtn");
  const txt  = document.getElementById("btnText");
  const dots = document.getElementById("dots");

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

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3500);
}

function togglePw(btn) {
  const input = document.getElementById("Password");
  const eye   = document.getElementById("eyeIcon");

  if (input.type === "password") {
    input.type = "text";
    eye.innerHTML =
      '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94"/>' +
      '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19"/>' +
      '<line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    input.type = "password";
    eye.innerHTML =
      '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>' +
      '<circle cx="12" cy="12" r="3"/>';
  }
}

// ── Ripple + Enter key ───────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  if (!loginBtn) return;

  loginBtn.addEventListener("click", function (e) {
    const r    = document.createElement("span");
    r.classList.add("ripple");
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.style.width  = size + "px";
    r.style.height = size + "px";
    r.style.left   = (e.clientX - rect.left - size / 2) + "px";
    r.style.top    = (e.clientY - rect.top  - size / 2) + "px";
    this.appendChild(r);
    setTimeout(() => r.remove(), 500);

    Login();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") Login();
  });
});