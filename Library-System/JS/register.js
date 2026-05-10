var userName = document.getElementById("UserName");
var userEmail = document.getElementById("userEmail");
var Password = document.getElementById("Password");
var ConfirmPassword = document.getElementById("ConfirmPassword");

var Users = JSON.parse(localStorage.getItem("Users")) || [];

var nameRegex = /^[A-Z][a-z]{2,10}$/;
var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

function AddUser() {
  var selectedRole = document.querySelector(
    'input[name="Accessibility"]:checked',
  );

  if (!nameRegex.test(userName.value)) {
    alert("Username must start with capital and be 3–10 letters");
    return;
  }

  if (!emailRegex.test(userEmail.value)) {
    alert("Invalid email format");
    return;
  }

  if (!passwordRegex.test(Password.value)) {
    alert("Password must be at least 6 chars with letters and numbers");
    return;
  }

  if (Password.value !== ConfirmPassword.value) {
    alert("Passwords do not match");
    return;
  }
  if (!selectedRole) {
    alert("Please select role (Admin Or User)");
    return;
  }

  for (var i = 0; i < Users.length; i++) {
    if (Users[i].userEmail === userEmail.value) {
      alert("Email already exists");
      return;
    }
  }

  var UserData = {
    userName: userName.value,
    userEmail: userEmail.value,
    Password: Password.value,
    role: selectedRole.value,
  };

  Users.push(UserData);
  localStorage.setItem("Users", JSON.stringify(Users));

  alert("Registered successfully ");

  window.location.href = "./login.html";
}
