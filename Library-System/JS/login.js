// login.js — authenticates against the unified library_users store

var userEmail = document.getElementById("userEmail");
var Password  = document.getElementById("Password");

function Login() {
  var email = userEmail.value.trim();
  var pass  = Password.value;

  if (!email || !pass) {
    alert("Please fill in all fields.");
    return;
  }

  var users = JSON.parse(localStorage.getItem("library_users")) || [];

  var matched = users.find(function (u) {
    return u.email === email && u.password === pass;
  });

  if (!matched) {
    alert("Invalid email or password.");
    return;
  }

  if (matched.status === "inactive") {
    alert("Your account has been deactivated. Please contact an administrator.");
    return;
  }

  // Store the logged-in user's ID so other pages can load their data
  localStorage.setItem("currentUserId", matched.id);
  localStorage.setItem("currentUserName", matched.fullName || matched.username);
  localStorage.setItem("currentUserRole", matched.role);

  // Redirect based on role (radio value is "Admin" or "User" from register.js)
  if (matched.role === "Admin" || matched.role === "admin") {
    window.location.href = "../pages/dashboard.html";
  } else {
    window.location.href = "../pages/homepage.html";
  }
}