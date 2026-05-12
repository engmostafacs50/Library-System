async function Login() {
  const email    = document.getElementById("userEmail").value.trim();
  const password = document.getElementById("Password").value;

  if (!email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const response = await fetch("/api/users/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email:    email,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      const user = data.user;

      // Only display info — auth is handled by HttpOnly cookies
      sessionStorage.setItem("user_username", user.username);
      sessionStorage.setItem("user_role",     user.role);

      // Redirect based on role
      if (user.role === "ADMIN") 
      {
         window.location.href = "/dashboard/";
      } 
      else 
      {
          window.location.href = "/homepage/";
      }

    } else {
      if (data.non_field_errors) alert(data.non_field_errors[0]);
      else alert("Invalid email or password.");
    }

  } catch (error) {
    alert("Cannot connect to server. Make sure Django is running on port 8000.");
    console.error(error);
  }
}