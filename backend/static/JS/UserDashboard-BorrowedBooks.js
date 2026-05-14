"use strict";

/* ── API Layer ───────────────────────────────────────────────────── */
const API = {
  BASE: "/api",

  async request(method, path, body = null) {
    const opts = {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken") || "",
      },
    };
    if (body) opts.body = JSON.stringify(body);

    let res = await fetch(`${API.BASE}${path}`, opts);

    if (res.status === 401) {
      const refreshed = await API.refreshToken();
      if (refreshed) {
        res = await fetch(`${API.BASE}${path}`, opts);
      } else {
        window.location.href = "/login/";
        return;
      }
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
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": getCookie("csrftoken") || "" },
      });
      return res.ok;
    } catch (_) { return false; }
  },

  /* Auth */
  getMe:     () => API.request("GET", "/users/me/"),

  /* Borrows */
  myBorrows: () => API.request("GET", "/borrow/"),

  /* Books */
  getBooks:  () => API.request("GET", "/books/"),
};


/* ── Cookie Helper ───────────────────────────────────────────────── */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}


/* ── Format Helpers ──────────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function isOverdue(dueDateStr) {
  if (!dueDateStr) return false;
  return new Date(dueDateStr) < new Date();
}


/* ── Detect Current Page ─────────────────────────────────────────── */
const PAGE = {
  isDashboard: !!document.getElementById("stat-active"),
  isBorrowed:  !!document.getElementById("borrowed-table-body"),
};


/* ── Render: User Dashboard ──────────────────────────────────────── */
async function renderDashboard() {
  try {
    const [user, borrows, booksData] = await Promise.all([
      API.getMe(),
      API.myBorrows(),
      API.getBooks(),
    ]);

    // Welcome
    const welcome = document.getElementById("user-welcome");
    if (welcome) welcome.textContent = `Welcome, ${user.first_name || user.username}!`;

    // Avatar
    const avatar = document.getElementById("user-avatar");
    if (avatar) {
      if (user.avatar) {
        avatar.src = user.avatar;
        avatar.style.display = "block";
      } else {
        avatar.style.display = "none";
      }
    }

    // Stats — handle paginated or plain array response
    const borrowList = Array.isArray(borrows) ? borrows : (borrows.results || []);
    const active     = borrowList.filter((b) => b.status === "active").length;
    const returned   = borrowList.filter((b) => b.status === "returned").length;
    const total      = borrowList.length;

    animateCount("stat-active",   active);
    animateCount("stat-returned", returned);
    animateCount("stat-total",    total);

    // Suggested book — handle paginated or plain array response
    const books     = Array.isArray(booksData) ? booksData : (booksData.results || []);
    const available = books.filter((b) => b.status === "available");
    const pool      = available.length ? available : books;

    renderSuggestedBook(pool);

  } catch (err) {
    console.error("Dashboard error:", err);
    if (err.message.includes("401") || err.message.toLowerCase().includes("unauthorized")) {
      window.location.href = "/login/";
    }
  }
}


/* ── Render: Suggested Book ──────────────────────────────────────── */
function renderSuggestedBook(books) {
  const container = document.getElementById("suggested-container");
  if (!container) return;

  if (!books.length) {
    container.innerHTML = "<p style='color:#94a3b8;'>No books available for suggestion.</p>";
    return;
  }

  const suggested = books[Math.floor(Math.random() * books.length)];

  container.innerHTML = `
    <a href="/books/${suggested.id}/" class="suggested-book-link">
      <div style="margin-bottom:15px">
        <img src="${suggested.image || "/static/assets/images/default-book.jpg"}"
             alt="${suggested.title}"
             style="width:100px;height:140px;border-radius:8px;object-fit:cover;box-shadow:0 4px 10px rgba(0,0,0,0.3);">
      </div>
      <p style="font-weight:bold;margin:5px 0;">${suggested.title}</p>
      <small style="color:#818cf8">${suggested.author || ""}</small>
      <div style="font-size:0.75rem;margin-top:5px;color:${suggested.status === "available" ? "#22c55e" : "#ef4444"}">
        ${suggested.status === "available" ? "Available Now" : "Currently Borrowed"}
      </div>
    </a>
  `;
}


/* ── Animate Count ───────────────────────────────────────────────── */
function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step  = Math.max(1, Math.ceil(target / 30));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 30);
}


/* ── Render: Borrowed Books Table ────────────────────────────────── */
async function renderBorrowedBooks() {
  const tbody = document.getElementById("borrowed-table-body");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align:center;color:#94a3b8;padding:20px;">
        Loading…
      </td>
    </tr>`;

  try {
    const borrows    = await API.myBorrows();
    const borrowList = Array.isArray(borrows) ? borrows : (borrows.results || []);
    const active     = borrowList.filter((b) => b.status === "active" || b.status === "pending");

    if (!active.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center;color:#94a3b8;padding:20px;">
            You have no active borrowed books.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = active.map((b) => {
      const overdue     = isOverdue(b.due_date) && b.status === "active";
      const statusBadge = b.status === "pending"
        ? `<span style="color:#f59e0b;font-size:0.75rem;">⏳ Pending approval</span>`
        : overdue
          ? `<span style="color:#ef4444;font-size:0.75rem;">⚠️ Overdue</span>`
          : `<span style="color:#22c55e;font-size:0.75rem;">✅ Active</span>`;

      return `
        <tr>
          <td>
            ${b.book_title || "—"}
            <br>${statusBadge}
          </td>
          <td>${formatDate(b.borrow_date)}</td>
          <td style="color:${overdue ? "#ef4444" : "inherit"}">
            ${formatDate(b.due_date)}
          </td>
          <td>
            ${b.status === "pending"
              ? `<span style="color:#64748b;font-size:0.85rem;">Awaiting admin</span>`
              : `<span style="color:#64748b;font-size:0.85rem;">Return at library</span>`
            }
          </td>
        </tr>`;
    }).join("");

  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;color:#ef4444;padding:20px;">
          Failed to load: ${err.message}
        </td>
      </tr>`;
    console.error("Borrowed books error:", err);
  }
}


document.addEventListener("DOMContentLoaded", () => {
  if (PAGE.isDashboard) renderDashboard();
  if (PAGE.isBorrowed)  renderBorrowedBooks();
});