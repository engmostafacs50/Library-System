// login.js

var userEmail = document.getElementById("userEmail");
var Password  = document.getElementById("Password");

function Login() {
  var email = userEmail.value.trim();
  var pass  = Password.value;

  if (!email || !pass) {
    alert("Please fill in all fields.");
    return;
  }

  var users = getUsers();

  var matched = users.find(function (u) {
    return u.email === email && u.password === pass;
  });

  if (!matched) {
    alert("Invalid email or password.");
    return;
  }

  if (matched.status === "inactive") {
    alert("Your account has been deactivated.");
    return;
  }

  setCurrentUser(matched.id, matched.fullName || matched.username, matched.role);

  const existingSession = getSession();
  const isSameUser = existingSession && String(existingSession.id) === String(matched.id);

  const userSession = {
    id:            matched.id,
    username:      matched.fullName || matched.username,
    borrowedList:  isSameUser ? (existingSession.borrowedList  || []) : [],
    returnedList:  isSameUser ? (existingSession.returnedList  || []) : [],
    returnedCount: isSameUser ? (existingSession.returnedCount || 0)  : 0,
    totalBorrowed: isSameUser ? (existingSession.totalBorrowed || 0)  : 0,
  };

  saveSession(userSession);

  /* Redirect */
  if (matched.role === "Admin" || matched.role === "admin") {
    window.location.href = "../pages/dashboard.html";
  } else {
    window.location.href = "../pages/homepage.html";
  }
}