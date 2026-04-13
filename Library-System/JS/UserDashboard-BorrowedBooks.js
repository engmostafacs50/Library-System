const USER_KEY = "library_user";

const DEFAULT_USER = {
  id: 1, // must match the user's id in users-data.js
  username: "User Pro",
  borrowedList: [
    { id: 1, title: "Clean Code", date: "2026-04-9", due: "2026-04-15" },
  ],
  returnedList: [],
  returnedCount: 1,
  totalBorrowed: 2,
};

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

  renderSuggested();
});

/* ── Return a Book ── */
window.returnBook = (i) => {
  const book = db.borrowedList[i];
  if (!book) return;

  if (confirm(`Are you sure you want to return "${book.title}"?`)) {
    // 1. Update user-profile store
    db.borrowedList.splice(i, 1);

    const today = new Date();
    const returnDate = today.toISOString().split("T")[0];
    const returnedBook = {
      ...book,
      returnDate: returnDate,
    };

    db.returnedList.push(returnedBook);
    db.returnedCount++;
    saveDB();

    // 2. Update book status in catalog
    if (typeof toggleBookStatus === "function") {
      toggleBookStatus(book.id);
    }

    // 3. Sync to users-data store
    if (typeof removeBorrowFromUser === "function") {
      removeBorrowFromUser(db.id, book.id);
    }

    // 4. Persist return history
    let localReturned =
      JSON.parse(localStorage.getItem("userReturnedHistory")) || [];
    localReturned.unshift({
      title: book.title,
      id: book.id,
      date: returnDate,
      returnDate: returnDate,
    });
    localStorage.setItem("userReturnedHistory", JSON.stringify(localReturned));

    location.reload();
  }
};