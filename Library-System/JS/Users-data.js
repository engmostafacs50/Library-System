/* ── users-data.js ── */
const USERS_KEY = "library_users";

const DEFAULT_USERS = [
  {
    id: 1,
    fullName: "Alice Johnson",
    username: "alice_j",
    email: "alice@example.com",
    role: "admin",
    status: "active",
    avatar: null,
    emoji: "👩",
    joined: "2024-01-15",
  },
  {
    id: 2,
    fullName: "Bob Smith",
    username: "bob_smith",
    email: "bob@example.com",
    role: "user",
    status: "active",
    avatar: null,
    emoji: "👨",
    joined: "2024-02-20",
  },
  {
    id: 3,
    fullName: "Clara Lee",
    username: "clara_l",
    email: "clara@example.com",
    role: "user",
    status: "inactive",
    avatar: null,
    emoji: "👩‍💼",
    joined: "2024-03-05",
  },
  {
    id: 4,
    fullName: "David Park",
    username: "dave_park",
    email: "david@example.com",
    role: "user",
    status: "active",
    avatar: null,
    emoji: "🧑",
    joined: "2024-04-10",
  },
  {
    id: 5,
    fullName: "Eva Martinez",
    username: "eva_m",
    email: "eva@example.com",
    role: "user",
    status: "active",
    avatar: null,
    emoji: "👩‍🎓",
    joined: "2024-05-18",
  },
];

/* ── Seed ── */
function seedUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
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
  const newUser = { id: maxId + 1, status: "active", role: "user", avatar: null, emoji: "👤", joined: new Date().toISOString().slice(0, 10), ...userData };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

function updateUser(updatedUser) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === updatedUser.id);
  if (idx !== -1) { users[idx] = updatedUser; saveUsers(users); }
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

seedUsers();