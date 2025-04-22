window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 0) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
  
  
  function goHome() {
    window.location.href = 'http://localhost:3000/'; // Replace 'index.html' with your home page URL
  }
  