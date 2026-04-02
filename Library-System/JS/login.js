var userEmail = document.getElementById("userEmail");
var Password = document.getElementById("Password");

var Users = JSON.parse(localStorage.getItem("Users")) || [];

function Login() {
  if (userEmail.value === "" || Password.value === "") {
    alert("Please fill all fields");
    return;
  }

  for (var i = 0; i < Users.length; i++) {
    if (
      Users[i].userEmail === userEmail.value &&
      Users[i].Password === Password.value
    ) {
      // alert("Login successful ");

      localStorage.setItem("currentUser", Users[i].userName);

      if (Users[i].role === "Admin") {
        window.location.href = "../pages/dashboard.html";
      } else {
        window.location.href = "../pages/homepage.html";
      }

      return;
    }
  }

  alert("Invalid email or password ");
}
