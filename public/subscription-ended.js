window.addEventListener('scroll', function() {
  const header = document.querySelector('header');
  if (window.scrollY > 0) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});


function goHome() {
  window.location.href = '/'; // Replace 'index.html' with your home page URL
}

// Log out function for expired users
async function logout() {
  try {
    const response = await fetch('/api/logout-subscription-expired', {
      method: 'POST',
      credentials: 'include' // Include cookies
    });

    const data = await response.json();

    // Redirect to login page regardless of session existence
    window.location.href = '/login';
  } catch (error) {
    console.error('Error logging out:', error);
    // Redirect anyway in case of unexpected error
    window.location.href = '/login';
  }
}


// ✅ Check Session to redirect active users
async function checkSession() {
  try {
    const response = await fetch('/api/check-session', { credentials: 'include' });
    const data = await response.json();

    if (response.ok) {
      console.log("✅ User is active. Redirecting to home...");
      window.location.href = "/";  // Redirect active users to the home page
    }
  } catch (error) {
    console.log("❌ User session expired, staying on subscription-ended page.");
  }
}

// ✅ Run checkSession on page load
checkSession();

