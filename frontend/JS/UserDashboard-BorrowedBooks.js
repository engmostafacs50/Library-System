const USER_KEY = "library_session";

/* ── Load User ── */
function loadUser() {
  const user = getSession();
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

const saveDB = () => saveSession(db);

/* ── Borrow Book ── */
window.borrowBook = (id, title) => {
  if (db.borrowedList.some((b) => String(b.id) === String(id))) {
    alert("Already borrowed!");
    return;
  }

  const today = new Date();
  const format = (d) => d.toISOString().split("T")[0];

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const newBook = {
    id,
    title,
    date: format(today),
    due: format(dueDate),
  };

  db.borrowedList.push(newBook);
  db.totalBorrowed++;
  saveDB();

  if (typeof toggleBookStatus === "function") {
    toggleBookStatus(id);
  }

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
      returnDate: today,
    });

    db.returnedCount = db.returnedList.length;

    saveDB();

    if (typeof toggleBookStatus === "function") {
      toggleBookStatus(book.id);
    }

    renderBorrowed();
    renderStats();
  }
};

/* ── Render Random Suggested Book ── */
function renderSuggestedBook() {
  const container = document.getElementById("suggested-container");
  if (!container) return;

  const books = getBooks();

  if (books.length === 0) {
    container.innerHTML =
      "<p style='color: #94a3b8;'>No books available for suggestion.</p>";
    return;
  }
  const randomIndex = Math.floor(Math.random() * books.length);
  const suggested = books[randomIndex];

  container.innerHTML = `
    <a href="book-details.html?id=${suggested.id}" class="suggested-book-link">
      <div style="margin-bottom: 15px">
        <img src="${suggested.image || "../assets/images/default-book.jpg"}" 
             alt="${suggested.title}"
             style="width: 100px; height: 140px; border-radius: 8px; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
      </div>
      <p style="font-weight: bold; margin: 5px 0;">${suggested.title}</p>
      <small style="color: #818cf8">${suggested.author}</small>
      <div style="font-size: 0.75rem; margin-top: 5px; color: ${suggested.status === "available" ? "#22c55e" : "#ef4444"}">
        ${suggested.status === "available" ? "Available Now" : "Currently Borrowed"}
      </div>
    </a>
  `;
}

/* ── Render ── */
function renderBorrowed() {
  const borrowedTable = document.getElementById("borrowed-table-body");

  if (!borrowedTable) return;

  borrowedTable.innerHTML = db.borrowedList.length
    ? db.borrowedList
        .map(
          (b, i) => `
      <tr>
        <td>${b.title}</td>
        <td>${b.date}</td>
        <td>${b.due}</td>
        <td><button onclick="returnBook(${i})">Return</button></td>
      </tr>
    `,
        )
        .join("")
    : `<tr><td colspan="4">No books</td></tr>`;
}

/* ── Dashboard Stats ── */
function renderStats() {
  const active = document.getElementById("stat-active");
  const returned = document.getElementById("stat-returned");
  const total = document.getElementById("stat-total");
  const welcome = document.getElementById("user-welcome");

  if (active) active.textContent = db.borrowedList.length;
  if (returned) returned.textContent = db.returnedList.length;
  if (total) total.textContent = db.totalBorrowed;
  if (welcome) welcome.textContent = `Welcome, ${db.username}!`;
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
  renderBorrowed();
  renderStats();
  renderSuggestedBook();
});