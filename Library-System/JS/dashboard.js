document.addEventListener("DOMContentLoaded", function() {
    console.log("Admin Dashboard Initialized");
    const greeting = document.getElementById("adminGreeting");
    const hour = new Date().getHours();

    if (hour < 12) greeting.innerText = "Good Morning, Admin! ☀️";
    else if (hour < 18) greeting.innerText = "Good Afternoon, Admin! 📖";
    else greeting.innerText = "Good Evening, Admin! 🌙";
});