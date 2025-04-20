// Check if agent is already logged in
if (localStorage.getItem('agentToken')) {
    // Redirect to dashboard if logged in
    window.location.href = '/dashboard';
}

// Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const signupContainer = document.getElementById('signup-container');
const loginContainer = document.querySelector('.form-container');
const showSignupLink = document.getElementById('show-signup-form');
const showLoginLink = document.getElementById('show-login-form');

// Switch between login and signup forms
showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginContainer.classList.add('hidden');
    signupContainer.classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
});

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const data = {
        username,
        password
    };

    try {
        const response = await fetch('/agents/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.status === 200) {
            // Store the token in localStorage
            localStorage.setItem('agentToken', result.token);
            alert('Login successful!');
            // Redirect to agent dashboard or wherever necessary
            window.location.href = '/dashboard';
        } else {
            alert(result.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login.');
    }
});

// Handle signup form submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const phoneNumber = document.getElementById('signup-phone').value;

    const data = { username, password, phoneNumber };

    try {
        const response = await fetch('/agents/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.status === 201) {
            alert('Sign-up successful! Please log in.');
            signupContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
        } else {
            alert(result.message || 'Sign-up failed');
        }
    } catch (error) {
        console.error('Sign-up error:', error);
        alert('An error occurred during sign-up.');
    }
});
