async function AddUser() {
  const fullName = document.getElementById("UserName").value.trim();
  const email    = document.getElementById("userEmail").value.trim();
  const password = document.getElementById("Password").value;
  const confirm  = document.getElementById("ConfirmPassword").value;

  // --- Validation ---
  const nameRegex     = /^[A-Za-z][A-Za-z\s]{2,29}$/;
  const emailRegex    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  if (!nameRegex.test(fullName)) {
    alert("Name must be 3–30 characters and contain only letters.");
    return;
  }
  if (!emailRegex.test(email)) {
    alert("Invalid email format.");
    return;
  }
  if (!passwordRegex.test(password)) {
    alert("Password must be at least 8 characters with letters and numbers.");
    return;
  }
  if (password !== confirm) {
    alert("Passwords do not match.");
    return;
  }

  // Build username from full name
  const username = fullName.toLowerCase().replace(/\s+/g, "_");

  try {
    const response = await fetch("/api/users/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        username: username,
        email:    email,
        password: password,
        role:     "USER",
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Account created successfully!");
      window.location.href = "/login/";
    } else {
      if (data.email)                 alert("Email: " + data.email[0]);
      else if (data.username)         alert("Username: " + data.username[0]);
      else if (data.password)         alert("Password: " + data.password[0]);
      else if (data.non_field_errors) alert(data.non_field_errors[0]);
      else alert("Registration failed: " + JSON.stringify(data));
    }

  } catch (error) {
    alert("Cannot connect to server. Make sure Django is running on port 8000.");
    console.error(error);
  }
}

function ResetForm() {
  document.getElementById("UserName").value       = "";
  document.getElementById("userEmail").value      = "";
  document.getElementById("Password").value       = "";
  document.getElementById("ConfirmPassword").value = "";
}