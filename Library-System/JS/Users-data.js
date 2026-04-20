const USERS_KEY = "library_users";

// No default users — all accounts are created via registration.

/* ── Seed: initialize with empty user list on first load ── */
function seedUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([]));
  }
}

/* ── CRUD ── */
function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getUserById(id) {
  return getUsers().find((u) => u.id === Number(id)) || null;
}

function addUser(userData) {
  const users = getUsers();
  const maxId = users.reduce((max, u) => Math.max(max, u.id), 0);
  const newUser = {
    id: maxId + 1,
    status: "active",
    role: "user",
    avatar: null,
    emoji: null,
    joined: new Date().toISOString().slice(0, 10),
    borrowedBooks: [],
    ...userData,
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

function updateUser(updatedUser) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === updatedUser.id);
  if (idx !== -1) {
    users[idx] = updatedUser;
    saveUsers(users);
  }
}

function deleteUser(id) {
  saveUsers(getUsers().filter((u) => u.id !== Number(id)));
}

function toggleUserStatus(id) {
  const users = getUsers();
  const user = users.find((u) => u.id === Number(id));
  if (user) {
    user.status = user.status === "active" ? "inactive" : "active";
    saveUsers(users);
  }
}

/* ── Borrow Sync Helpers ── */

// Called when a user borrows a book — adds the entry to their borrowedBooks list
function addBorrowToUser(userId, bookEntry) {
  const users = getUsers();
  const user = users.find((u) => u.id === Number(userId));
  if (!user) return;
  if (!user.borrowedBooks) user.borrowedBooks = [];
  // Guard against duplicates (compare as strings to safely handle 'N/A' and numeric IDs)
  if (!user.borrowedBooks.some((b) => String(b.id) === String(bookEntry.id))) {
    user.borrowedBooks.push(bookEntry);
    saveUsers(users);
  }
}

// Called when a user returns a book — removes it from their borrowedBooks list
function removeBorrowFromUser(userId, bookId) {
  const users = getUsers();
  const user = users.find((u) => u.id === Number(userId));
  if (!user || !user.borrowedBooks) return;
  // BUG FIX: use String comparison instead of Number() to avoid NaN issues when bookId is 'N/A'
  user.borrowedBooks = user.borrowedBooks.filter(
    (b) => String(b.id) !== String(bookId)
  );
  saveUsers(users);
}

seedUsers();