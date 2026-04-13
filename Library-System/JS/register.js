// register.js — saves into the unified library_users store

var userName        = document.getElementById("UserName");
var userEmail       = document.getElementById("userEmail");
var Password        = document.getElementById("Password");
var ConfirmPassword = document.getElementById("ConfirmPassword");

var nameRegex     = /^[A-Za-z][A-Za-z\s]{2,29}$/;          // full name, 3–30 chars
var emailRegex    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

function AddUser() {
  var selectedRole = document.querySelector('input[name="Accessibility"]:checked');

  var fullName = userName.value.trim();

  if (!nameRegex.test(fullName)) {
    alert("Name must be 3–30 characters and contain only letters.");
    return;
  }

  if (!emailRegex.test(userEmail.value.trim())) {
    alert("Invalid email format.");
    return;
  }

  if (!passwordRegex.test(Password.value)) {
    alert("Password must be at least 6 characters with letters and numbers.");
    return;
  }

  if (Password.value !== ConfirmPassword.value) {
    alert("Passwords do not match.");
    return;
  }

  if (!selectedRole) {
    alert("Please select a role (Admin or User).");
    return;
  }

  // Load from the unified store (library_users)
  var users = JSON.parse(localStorage.getItem("library_users")) || [];

  // Check for duplicate email
  var emailExists = users.some(function (u) {
    return u.email === userEmail.value.trim();
  });
  if (emailExists) {
    alert("An account with this email already exists.");
    return;
  }

  // Build username from full name (lowercase, underscored)
  var autoUsername = fullName.toLowerCase().replace(/\s+/g, "_");

  var maxId = users.reduce(function (max, u) { return Math.max(max, u.id || 0); }, 0);

  var newUser = {
    id:           maxId + 1,
    fullName:     fullName,
    username:     autoUsername,
    email:        userEmail.value.trim(),
    password:     Password.value,           // plain-text; hash server-side in production
    role:         selectedRole.value,       // "Admin" or "User" from the radio buttons
    status:       "active",
    avatar:       null,
    emoji:        null,
    joined:       new Date().toISOString().slice(0, 10),
    borrowedBooks: [],
  };

  users.push(newUser);
  localStorage.setItem("library_users", JSON.stringify(users));

  window.location.href = "./login.html";
}