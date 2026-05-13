"use strict";

/* ── API base ─────────────────────────────────────────────────── */
const API = {
  BASE: "/api",

  async request(method, path, body = null) {
    const opts = {
      method,
      credentials: "include",          // send HttpOnly cookies
      headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API.BASE}${path}`, opts);

    // 401 → try a silent token refresh, then retry once
    if (res.status === 401) {
      const refreshed = await API.refreshToken();
      if (refreshed) {
        const retry = await fetch(`${API.BASE}${path}`, opts);
        if (!retry.ok) throw new Error(await retry.text());
        return retry.status === 204 ? null : retry.json();
      }
      // refresh failed → redirect to login
      window.location.href = "/login/";
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
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  },

  getUsers:   ()       => API.request("GET",    "/users/admin/users/"),
  toggleUser: (id)     => API.request("PATCH",  `/users/admin/users/${id}/`),
  deleteUser: (id)     => API.request("DELETE", `/users/admin/users/${id}/`),
  userHistory:(id)     => API.request("GET",    `/users/admin/users/${id}/history/`),
  allBorrows: ()       => API.request("GET",    "/borrow/admin/"),
};


/* ── Live date in header ───────────────────────────────────────── */
(function () {
  const el = document.getElementById("headerDate");
  if (!el) return;
  el.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
})();


/* ── Utility helpers ───────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

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

function showToast(msg, type = "success") {
  // Requires a #toast element in your HTML:
  // <div id="toast"></div>
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.className   = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3000);
}


/* ── Stats ─────────────────────────────────────────────────────── */
async function renderStats(users) {
  // users already fetched — avoid a second round-trip
  const active   = users.filter((u) => u.is_active).length;

  animateCount("totalUsers",  users.length);
  animateCount("activeUsers", active);

  // Borrow stats come from the borrow endpoint
  try {
    const borrows  = await API.allBorrows();
    const borrowed = borrows.filter((b) => b.status === "active").length;
    animateCount("totalBooks",   borrows.length);   // adjust if you have a books endpoint
    animateCount("borrowedBooks", borrowed);
  } catch (_) {
    // borrow stats are non-critical; leave counters at 0
  }
}


/* ── Users table ────────────────────────────────────────────────── */
let allUsers = [];

function renderUsersTable(users) {
  const tbody = document.getElementById("usersTableBody");
  const empty = document.getElementById("emptyMsg");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!users.length) {
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  users.forEach((user, idx) => {
    const tr = document.createElement("tr");
    tr.style.animationDelay = `${idx * 40}ms`;

    const initials  = (user.full_name || user.fullName || user.username || "?")
                        .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const avatarHTML = user.avatar
      ? `<img src="${user.avatar}" alt="${initials}">`
      : `<span class="avatar-initials">${initials}</span>`;

    // Support both snake_case (DRF default) and camelCase field names
    const fullName = user.full_name   || user.fullName   || "—";
    const username = user.username    || "—";
    const email    = user.email       || "—";
    const role     = user.is_staff || user.is_superuser ? "admin" : "user";
    const active   = user.is_active !== undefined ? user.is_active : user.status === "active";
    const joined   = user.date_joined || user.joined;

    const roleBadge   = role === "admin" ? "badge-admin"    : "badge-user";
    const statusBadge = active           ? "badge-active"   : "badge-inactive";
    const statusLabel = active           ? "active"         : "inactive";

    tr.innerHTML = `
      <td class="muted">${user.id}</td>
      <td><div class="user-avatar">${avatarHTML}</div></td>
      <td><strong>${fullName}</strong></td>
      <td class="muted">@${username}</td>
      <td class="muted">${email}</td>
      <td><span class="badge ${roleBadge}">${role}</span></td>
      <td><span class="badge ${statusBadge}">${statusLabel}</span></td>
      <td class="muted">${formatDate(joined)}</td>
      <td>
        <button class="action-btn btn-view"
                onclick="openHistoryModal(${user.id}, '${fullName.replace(/'/g, "\\'")}')">
          History
        </button>
        <button class="action-btn btn-edit"
                onclick="handleToggleStatus(${user.id})">
          ${active ? "Deactivate" : "Activate"}
        </button>
        <button class="action-btn btn-delete"
                onclick="handleDeleteUser(${user.id}, '${fullName.replace(/'/g, "\\'")}')">
          Delete
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}


/* ── Search / filter (client-side) ──────────────────────────────── */
function filterUsers() {
  const q = (document.getElementById("userSearch")?.value || "").toLowerCase();
  const filtered = allUsers.filter(
    (u) =>
      (u.full_name   || u.fullName  || "").toLowerCase().includes(q) ||
      (u.username    || "").toLowerCase().includes(q) ||
      (u.email       || "").toLowerCase().includes(q)
  );
  renderUsersTable(filtered);
}


/* ── Action handlers ─────────────────────────────────────────────── */
async function handleToggleStatus(id) {
  try {
    await API.toggleUser(id);
    allUsers = await API.getUsers();
    filterUsers();
    renderStats(allUsers);
    showToast("User status updated.");
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  }
}

async function handleDeleteUser(id, name) {
  if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
  try {
    await API.deleteUser(id);
    allUsers = allUsers.filter((u) => u.id !== id);
    filterUsers();
    renderStats(allUsers);
    showToast(`User "${name}" deleted.`);
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  }
}



async function openHistoryModal(userId, userName) {
  const modal = document.getElementById("historyModal");
  const body  = document.getElementById("modalBody");
  const title = document.getElementById("modalTitle");

  if (!modal || !body) return;

  title.textContent = `History — ${userName}`;
  body.innerHTML    = `<p class="modal-loading">Loading…</p>`;
  modal.style.display = "flex";

  try {
    const { borrows, returns } = await API.userHistory(userId);
    body.innerHTML = buildHistoryHTML(borrows, returns);
  } catch (err) {
    body.innerHTML = `<p class="modal-error">Failed to load history: ${err.message}</p>`;
  }
}

function closeHistoryModal() {
  const modal = document.getElementById("historyModal");
  if (modal) modal.style.display = "none";
}

// Close on backdrop click
document.addEventListener("click", (e) => {
  if (e.target.id === "historyModal") closeHistoryModal();
});

// Close on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeHistoryModal();
});


function buildHistoryHTML(borrows = [], returns = []) {
  /* ── Borrows table ── */
  const borrowRows = borrows.length
    ? borrows.map((b) => `
        <tr>
          <td>${b.id}</td>
          <td>${b.book_title || b.book || "—"}</td>
          <td>${formatDate(b.borrow_date || b.created_at)}</td>
          <td>${formatDate(b.due_date)}</td>
          <td><span class="badge ${b.status === "active" ? "badge-active" : "badge-inactive"}">${b.status}</span></td>
        </tr>`).join("")
    : `<tr><td colspan="5" class="muted center">No borrow records.</td></tr>`;

  /* ── Returns table ── */
  const returnRows = returns.length
    ? returns.map((r) => `
        <tr>
          <td>${r.id}</td>
          <td>${r.book_title || r.book || "—"}</td>
          <td>${formatDate(r.return_date || r.created_at)}</td>
          <td>${r.fine > 0 ? `<span class="badge badge-overdue">$${r.fine}</span>` : "—"}</td>
          <td><span class="badge badge-active">Returned</span></td>
        </tr>`).join("")
    : `<tr><td colspan="5" class="muted center">No return records.</td></tr>`;

  return `
    <section class="modal-section">
      <h3 class="modal-section-title">📚 Borrowed Books <span class="count-badge">${borrows.length}</span></h3>
      <div class="table-scroll">
        <table class="modal-table">
          <thead>
            <tr>
              <th>#</th><th>Book</th><th>Borrowed</th><th>Due</th><th>Status</th>
            </tr>
          </thead>
          <tbody>${borrowRows}</tbody>
        </table>
      </div>
    </section>

    <section class="modal-section">
      <h3 class="modal-section-title">🔄 Returned Books <span class="count-badge">${returns.length}</span></h3>
      <div class="table-scroll">
        <table class="modal-table">
          <thead>
            <tr>
              <th>#</th><th>Book</th><th>Returned</th><th>Fine</th><th>Status</th>
            </tr>
          </thead>
          <tbody>${returnRows}</tbody>
        </table>
      </div>
    </section>`;
}


/* ── Init ────────────────────────────────────────────────────────── */
(async function init() {
  try {
    allUsers = await API.getUsers();
    await renderStats(allUsers);
    renderUsersTable(allUsers);

    // Wire up the search input
    const searchInput = document.getElementById("userSearch");
    if (searchInput) searchInput.addEventListener("input", filterUsers);

  } catch (err) {
    showToast(`Failed to load dashboard: ${err.message}`, "error");
    console.error(err);
  }
})();