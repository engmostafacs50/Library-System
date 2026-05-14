"use strict";

/* ── API ─────────────────────────────────────────────────────────── */
const API = {
  BASE: "/api",

  async request(method, path, body = null) {
    const opts = {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API.BASE}${path}`, opts);

    if (res.status === 401) {
      const refreshed = await API.refreshToken();
      if (refreshed) {
        const retry = await fetch(`${API.BASE}${path}`, opts);
        if (!retry.ok) throw new Error(await retry.text());
        return retry.status === 204 ? null : retry.json();
      }
      window.location.href = "/login/?next=" + window.location.pathname + window.location.search;
      return;
    }

    if (!res.ok) {
      const errText = await res.text();
      let msg = errText;
      try { msg = JSON.parse(errText).detail || errText; } catch (_) {}
      throw new Error(msg);
    }

    return res.status === 204 ? null : res.json();
  },

  async refreshToken() {
    try {
      const res = await fetch(`${API.BASE}/users/token/refresh/`, {
        method: "POST", credentials: "include",
      });
      return res.ok;
    } catch (_) { return false; }
  },

  getBook:       (id)     => API.request("GET",  `/books/${id}/`),
  getUserBorrows:()       => API.request("GET",  "/borrow/"),
  createBorrow:  (bookId) => API.request("POST", "/borrow/", { book: bookId }),
};


/* ── Bootstrap ───────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get("id");

  if (!bookId) { showError("No book ID provided."); return; }

  try {
    const [book, borrows] = await Promise.all([
      API.getBook(bookId),
      API.getUserBorrows().catch(() => []),
    ]);

    const existingBorrow = borrows.find(
      (b) => String(b.book) === String(bookId)
    );

    renderBook(book, existingBorrow);

  } catch (err) {
    console.error("Failed to load book:", err);
    showError("Could not load book details. Please try again later.");
  }
});


/* ── Render ──────────────────────────────────────────────────────── */
function renderBook(book, existingBorrow) {
  const img = document.getElementById("bookImage");
  if (img) {
    img.src     = book.image || "../assets/images/default-book.jpg";
    img.alt     = book.title;
    img.onerror = () => { img.src = "../assets/images/default-book.jpg"; };
  }

  setText("title",       book.title);
  setText("author",      book.author);
  setText("category",    book.genre);
  setText("description", book.description || "No description available.");

  const btn = document.querySelector(".btn-outline");
  if (!btn) return;

  if (existingBorrow) {
    applyBorrowState(existingBorrow.status, btn);
  } else {
    // ✅ use book.status instead of book.available
    applyBorrowState(book.status === "available" ? "available" : "unavailable", btn);
  }

  btn.onclick = () => handleBorrow(book, btn, existingBorrow);
}


/* ── State → UI mapping ──────────────────────────────────────────── */
function applyBorrowState(state, btn) {
  const statusEl = document.getElementById("status");

  btn.className = "btn-outline";
  btn.disabled  = false;

  switch (state) {
    case "available":
      setText("status", "Available");
      if (statusEl) statusEl.style.color = "#86efac";
      btn.textContent = "Borrow Book";
      btn.classList.add("state-available");
      break;

    case "unavailable":
      setText("status", "Not Available");
      if (statusEl) statusEl.style.color = "#fca5a5";
      btn.textContent = "Not Available";
      btn.disabled    = true;
      btn.classList.add("state-unavailable");
      break;

    case "pending":
      setText("status", "Request Pending");
      if (statusEl) statusEl.style.color = "#fde047";
      btn.textContent = "Request Sent · Awaiting Approval";
      btn.disabled    = true;
      btn.classList.add("state-pending");
      break;

    case "active":
      setText("status", "Borrowed by you");
      if (statusEl) statusEl.style.color = "#7dd3fc";
      btn.textContent = "Currently Borrowed";
      btn.disabled    = true;
      btn.classList.add("state-active");
      break;

    case "returned":
      setText("status", "Returned");
      if (statusEl) statusEl.style.color = "#a5b4fc";
      btn.textContent = "Borrow Again";
      btn.classList.add("state-available");
      break;

    case "rejected":
      setText("status", "Request Rejected");
      if (statusEl) statusEl.style.color = "#fca5a5";
      btn.textContent = "Request Rejected · Try Again";
      btn.classList.add("state-available");
      break;

    default:
      setText("status", state);
      btn.textContent = "Borrow Book";
  }
}


/* ── Borrow handler ──────────────────────────────────────────────── */
async function handleBorrow(book, btn, existingBorrow) {
  if (existingBorrow && ["pending", "active"].includes(existingBorrow.status)) return;

  if (!confirm(`Request to borrow "${book.title}"?`)) return;

  btn.disabled    = true;
  btn.textContent = "Sending request…";

  try {
    await API.createBorrow(book.id);
    applyBorrowState("pending", btn);
    showToast("Borrow request sent! Awaiting admin approval.", "success");

  } catch (err) {
    // ✅ use book.status instead of book.available
    applyBorrowState(
      existingBorrow ? existingBorrow.status : (book.status === "available" ? "available" : "unavailable"),
      btn
    );
    showToast(`Could not send request: ${err.message}`, "error");
  }
}


/* ── Helpers ─────────────────────────────────────────────────────── */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || "";
}

function showError(msg) {
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;
                height:60vh;font-family:'Segoe UI',sans-serif;color:#ef4444;">
      <h2>${msg}</h2>
    </div>`;
}

function showToast(msg, type = "success") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = `
      position:fixed;bottom:28px;right:28px;z-index:200;
      padding:12px 22px;border-radius:12px;font-size:14px;
      font-weight:500;color:white;opacity:0;transform:translateY(12px);
      transition:opacity .3s ease,transform .3s ease;
      pointer-events:none;max-width:320px;backdrop-filter:blur(8px);
    `;
    document.body.appendChild(toast);
  }

  const styles = {
    success: "background:rgba(34,197,94,.18);border:1px solid rgba(34,197,94,.3);box-shadow:0 8px 32px rgba(34,197,94,.2);",
    error:   "background:rgba(239,68,68,.18);border:1px solid rgba(239,68,68,.3);box-shadow:0 8px 32px rgba(239,68,68,.2);",
  };

  toast.textContent         = msg;
  toast.style.cssText      += styles[type] || styles.success;
  toast.style.opacity       = "1";
  toast.style.transform     = "translateY(0)";
  toast.style.pointerEvents = "auto";

  setTimeout(() => {
    toast.style.opacity   = "0";
    toast.style.transform = "translateY(12px)";
  }, 3500);
}