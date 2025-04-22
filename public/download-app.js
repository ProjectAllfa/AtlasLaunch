window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 0) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
  
  
 function goHome() {
  window.location.href = 'https://www.cimaway.com/'; // Replace 'index.html' with your home page URL
}
  
