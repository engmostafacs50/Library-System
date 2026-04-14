const USER_KEY = "library_session";

/* ── Load User ── */
function loadUser() {
  const user = JSON.parse(localStorage.getItem(USER_KEY));
  if (!user) {
    window.location.href = "../pages/login.html";
    return null;
  }
  return user;
}

const db = loadUser();
if (!db) throw new Error("User not loaded");

db.borrowedList = db.borrowedList || [];
db.returnedList = db.returnedList || [];
db.returnedCount = db.returnedList.length;
db.totalBorrowed = db.totalBorrowed || 0;

const saveDB = () => localStorage.setItem(USER_KEY, JSON.stringify(db));

/* ── Borrow Book ── */
window.borrowBook = (id, title) => {
  if (db.borrowedList.some(b => String(b.id) === String(id))) {
    alert("Already borrowed!");
    return;
  }

  const today = new Date();
  const format = d => d.toISOString().split("T")[0];

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const newBook = {
    id,
    title,
    date: format(today),
    due: format(dueDate)
  };

  db.borrowedList.push(newBook);
  db.totalBorrowed++;
  saveDB();

  renderBorrowed();
};

/* ── Return Book ── */
window.returnBook = (i) => {
  const book = db.borrowedList[i];
  if (!book) return;

  if (confirm(`Return "${book.title}"?`)) {
    db.borrowedList.splice(i, 1);

    const today = new Date().toISOString().split("T")[0];

    db.returnedList.push({
      ...book,
      returnDate: today
    });

    db.returnedCount = db.returnedList.length;

    saveDB();
    renderBorrowed();
    renderStats();
  }
};

/* ── Render ── */
function renderBorrowed() {
  const borrowedTable = document.getElementById("borrowed-table-body");

  if (!borrowedTable) return;

  borrowedTable.innerHTML = db.borrowedList.length
    ? db.borrowedList.map((b, i) => `
      <tr>
        <td>${b.title}</td>
        <td>${b.date}</td>
        <td>${b.due}</td>
        <td><button onclick="returnBook(${i})">Return</button></td>
      </tr>
    `).join("")
    : `<tr><td colspan="4">No books</td></tr>`;
}

/* ── Dashboard Stats ── */
function renderStats() {
  const active   = document.getElementById("stat-active");
  const returned = document.getElementById("stat-returned");
  const total    = document.getElementById("stat-total");
  const welcome  = document.getElementById("user-welcome");

  if (active)   active.textContent   = db.borrowedList.length;
  if (returned) returned.textContent = db.returnedList.length;
  if (total)    total.textContent    = db.totalBorrowed;
  if (welcome)  welcome.textContent  = `Welcome, ${db.username}!`;
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
  renderBorrowed();
  renderStats();
});