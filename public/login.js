// Function to handle login
async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        const data = await response.json();
        const messageElement = document.getElementById("message");

        if (response.ok) {
            messageElement.style.color = "green";
            messageElement.textContent = "✅ Login successful!";
            setTimeout(() => window.location.href = '/', 2000);
        } else {
            messageElement.style.color = "red";
            messageElement.textContent = "❌ " + (data.message || "Login failed");
        }
    } catch (error) {
        document.getElementById("message").textContent = "❌ Server error. Try again.";
    }
}

// Function to check session
async function checkSession() {
    try {
        const response = await fetch('/api/check-session', { credentials: 'include' });
        const data = await response.json();

        if (response.ok) {
            setTimeout(() => window.location.href = '/', 1000);
        }
    } catch (error) {
        console.log("❌ No active session. Staying on login page.");
    }
}

// Function to toggle the password visibility
function togglePassword() {
    const passwordField = document.getElementById("password");
    const eyeIcon = document.getElementById("eye-icon");

    if (passwordField.type === "password") {
        passwordField.type = "text"; // Show password
        eyeIcon.classList.remove("fa-eye"); // Remove 'eye' icon
        eyeIcon.classList.add("fa-eye-slash"); // Add 'eye-slash' icon
    } else {
        passwordField.type = "password"; // Hide password
        eyeIcon.classList.remove("fa-eye-slash"); // Remove 'eye-slash' icon
        eyeIcon.classList.add("fa-eye"); // Add 'eye' icon
    }
}

// Check session when the page loads
checkSession();
