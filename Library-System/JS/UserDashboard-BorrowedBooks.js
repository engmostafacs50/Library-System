const USER_KEY = "library_user";

const DEFAULT_USER = {
  username: "User Pro",
  borrowedList: [
    { id: 1, title: "Clean Code", date: "2024-03-15", due: "2024-04-15" },
  ],
  returnedList: [],
  returnedCount: 1,
  totalBorrowed: 2,
};

// Fixed: Array.isArray() guard prevents an accidental books array
//    being silently used as the user object (the || fallback won't
//    trigger for a truthy array, so we check the shape explicitly)
function loadUser() {
  const raw = JSON.parse(localStorage.getItem(USER_KEY));
  return raw && !Array.isArray(raw) ? raw : DEFAULT_USER;
}

const db = loadUser();

const saveDB = () => localStorage.setItem(USER_KEY, JSON.stringify(db));

/* ── Render Dashboard ── */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("user-welcome")) {
    document.getElementById("user-welcome").innerText =
      `Welcome, ${db.username}!`;
    document.getElementById("stat-active").innerText = db.borrowedList.length;
    document.getElementById("stat-returned").innerText = db.returnedCount;
    document.getElementById("stat-total").innerText = db.totalBorrowed;
    document.querySelector(".profile-img").src =
      "../assets/images/profile-default.jpg";
  }

  /* ── Borrowed Table ── */
  const borrowedTable = document.getElementById("borrowed-table-body");
  if (borrowedTable) {
    borrowedTable.innerHTML = db.borrowedList.length
      ? db.borrowedList
          .map(
            (b, i) => `
        <tr>
          <td>${b.title}</td>
          <td>${b.date}</td>
          <td style="color:#fbbf24">${b.due}</td>
          <td>
            <button class="btn-return" onclick="returnBook(${i})">
              Return
            </button>
          </td>
        </tr>`,
          )
          .join("")
      : '<tr><td colspan="4">No active loans found.</td></tr>';
  }

  /* ── Returned Table ── */
  const returnedTable = document.getElementById("returned-table-body");
  if (returnedTable) {
    returnedTable.innerHTML = db.returnedList.length
      ? db.returnedList
          .map(
            (b) => `
        <tr>
          <td>${b.title}</td>
          <td>${b.date}</td>
          <td style="color:#10b981">Returned</td>
        </tr>`,
          )
          .join("")
      : '<tr><td colspan="3">No returned books yet.</td></tr>';
  }
});

/* ── Return a Book ── */
window.returnBook = (i) => {
  const book = db.borrowedList[i];
  if (!book) return; //Guard: index might be stale after a reload

  if (confirm(`Are you sure you want to return "${book.title}"?`)) {
    db.borrowedList.splice(i, 1);
    db.returnedList.push(book);
    db.returnedCount++;
    //Keep totalBorrowed in sync (it should reflect all-time borrows)
    saveDB();
    location.reload();
  }
};

/* ── Borrow a Book (called from book-details page) ── */
// Links the catalog and the user profile:
// When a user borrows a book, add it to their borrowedList
// and flip the book's status in the catalog.
window.borrowBook = (bookId, bookTitle) => {
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + 30); // 30-day loan period

  const fmt = (d) => d.toISOString().split("T")[0];

  //Check the user hasn't already borrowed this book
  const alreadyBorrowed = db.borrowedList.some((b) => b.id === bookId);
  if (alreadyBorrowed) {
    alert("You have already borrowed this book.");
    return;
  }

  db.borrowedList.push({
    id: bookId,
    title: bookTitle,
    date: fmt(today),
    due: fmt(due),
  });
  db.totalBorrowed++;
  saveDB();


  toggleBookStatus(bookId);
  alert(`"${bookTitle}" has been added to your borrowed list!`);
};