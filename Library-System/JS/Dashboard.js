/* ── dashboard.js ── */

/* Live date in header */
(function () {
  const el = document.getElementById("headerDate");
  if (!el) return;
  const now = new Date();
  el.innerHTML = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
})();

/* ── Stats ── */
function renderStats() {
  const users   = getUsers();
  const books   = getBooks();
  const active  = users.filter((u) => u.status === "active").length;
  const borrowed= books.filter((b) => b.status === "borrowed").length;

  animateCount("totalUsers",   users.length);
  animateCount("activeUsers",  active);
  animateCount("totalBooks",   books.length);
  animateCount("borrowedBooks",borrowed);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step  = Math.ceil(target / 30);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 30);
}

/* ── Users Table ── */
let allUsers = [];

function renderUsersTable(users) {
  const tbody = document.getElementById("usersTableBody");
  const empty = document.getElementById("emptyMsg");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!users.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  users.forEach((user, idx) => {
    const tr = document.createElement("tr");
    tr.style.animationDelay = `${idx * 40}ms`;

    const initials = user.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const avatarHTML = user.avatar
      ? `<img src="${user.avatar}" alt="${user.fullName}">`
      : `<span class="avatar-initials">${initials}</span>`;

    const roleBadge   = user.role === "admin" ? "badge-admin" : "badge-user";
    const statusBadge = user.status === "active" ? "badge-active" : "badge-inactive";

    tr.innerHTML = `
      <td class="muted">${user.id}</td>
      <td><div class="user-avatar">${avatarHTML}</div></td>
      <td><strong>${user.fullName}</strong></td>
      <td class="muted">@${user.username}</td>
      <td class="muted">${user.email}</td>
      <td><span class="badge ${roleBadge}">${user.role}</span></td>
      <td><span class="badge ${statusBadge}">${user.status}</span></td>
      <td class="muted">${formatDate(user.joined)}</td>
      <td>
        <button class="action-btn btn-edit"   onclick="handleToggleStatus(${user.id})">
          ${user.status === "active" ? "Deactivate" : "Activate"}
        </button>
        <button class="action-btn btn-delete" onclick="handleDeleteUser(${user.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

/* ── Search ── */
function filterUsers() {
  const q = document.getElementById("userSearch").value.toLowerCase();
  const filtered = allUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
  );
  renderUsersTable(filtered);
}

/* ── Actions ── */
function handleToggleStatus(id) {
  toggleUserStatus(id);
  allUsers = getUsers();
  filterUsers();
  renderStats();
}

function handleDeleteUser(id) {
  const user = getUserById(id);
  if (!user) return;
  if (!confirm(`Delete user "${user.fullName}"? This cannot be undone.`)) return;
  deleteUser(id);
  allUsers = getUsers();
  filterUsers();
  renderStats();
}

/* ── Init ── */
(function init() {
  allUsers = getUsers();
  renderStats();
  renderUsersTable(allUsers);
})();