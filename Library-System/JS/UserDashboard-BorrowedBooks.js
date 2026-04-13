// UserDashboard-BorrowedBooks.js — loads the real logged-in user dynamically

const USER_KEY = "library_user";

/* ── Load the current user's personal borrow/return state ── */
function loadUser() {
  // Primary: per-user state stored under USER_KEY (keyed by session)
  const raw = JSON.parse(localStorage.getItem(USER_KEY));
  if (raw && !Array.isArray(raw)) return raw;

  // Fallback: build a fresh state object from the logged-in user record
  const userId   = Number(localStorage.getItem("currentUserId"));
  const userName = localStorage.getItem("currentUserName") || "Guest";

  if (!userId) {
    // Not logged in — redirect to login
    window.location.href = "../pages/login.html";
    return null;
  }

  const freshState = {
    id:            userId,
    username:      userName,
    borrowedList:  [],
    returnedList:  [],
    returnedCount: 0,
    totalBorrowed: 0,
  };

  // Pre-populate borrowedList from the users store if it exists
  const users = JSON.parse(localStorage.getItem("library_users")) || [];
  const userRecord = users.find((u) => u.id === userId);
  if (userRecord && Array.isArray(userRecord.borrowedBooks)) {
    freshState.borrowedList  = userRecord.borrowedBooks;
    freshState.totalBorrowed = userRecord.borrowedBooks.length;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(freshState));
  return freshState;
}

const db = loadUser();
const saveDB = () => localStorage.setItem(USER_KEY, JSON.stringify(db));

/* ── Borrow a Book ── */
window.borrowBook = (id, title) => {
  // Prevent duplicate borrows
  if (db.borrowedList.some((b) => b.id === id)) {
    alert(`"${title}" is already in your borrowed list.`);
    return;
  }

  const today = new Date();
  const borrowDate = today.toISOString().split("T")[0];

  // Due date = 7 days from today
  const dueDateObj = new Date(today);
  dueDateObj.setDate(dueDateObj.getDate() + 7);
  const dueDate = dueDateObj.toISOString().split("T")[0];

  const newBorrow = { id, title, date: borrowDate, due: dueDate };

  // 1. Update user store
  db.borrowedList.push(newBorrow);
  db.totalBorrowed++;
  saveDB();

  // 2. Update book status in catalog
  if (typeof toggleBookStatus === "function") {
    toggleBookStatus(id);
  }

  // 3. Sync to users-data store
  if (typeof addBorrowToUser === "function") {
    addBorrowToUser(db.id, newBorrow);
  }

  alert(`"${title}" borrowed successfully! Due: ${dueDate}`);
  location.reload();
};

/* ── Render Dashboard ── */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("user-welcome")) {
    const displayName = localStorage.getItem("currentUserName") || db.username;
    document.getElementById("user-welcome").innerText = `Welcome, ${displayName}!`;
    document.getElementById("stat-active").innerText = db.borrowedList.length;
    document.getElementById("stat-returned").innerText = db.returnedCount;
    document.getElementById("stat-total").innerText = db.totalBorrowed;
    document.querySelector(".profile-img").src = "../assets/images/profile-default.jpg";
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
        </tr>`
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
        </tr>`
          )
          .join("")
      : '<tr><td colspan="3">No returned books yet.</td></tr>';
  }

  if (typeof renderSuggested === "function") {
    renderSuggested();
  }
});

/* ── Return a Book ── */
window.returnBook = (i) => {
  const book = db.borrowedList[i];
  if (!book) return;

  if (confirm(`Are you sure you want to return "${book.title}"?`)) {
    db.borrowedList.splice(i, 1);

    const today = new Date();
    const returnDate = today.toISOString().split("T")[0];
    const returnedBook = { ...book, returnDate };

    db.returnedList.push(returnedBook);
    db.returnedCount++;
    saveDB();

    if (typeof toggleBookStatus === "function") {
      toggleBookStatus(book.id);
    }

    if (typeof removeBorrowFromUser === "function") {
      removeBorrowFromUser(db.id, book.id);
    }

    let localReturned = JSON.parse(localStorage.getItem("userReturnedHistory")) || [];
    localReturned.unshift({
      title: book.title,
      id: book.id,
      date: returnDate,
      returnDate,
    });
    localStorage.setItem("userReturnedHistory", JSON.stringify(localReturned));

    location.reload();
  }
};