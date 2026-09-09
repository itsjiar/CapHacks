// Landing Page Script - CapHacks
document.addEventListener('DOMContentLoaded', () => {
  // Intersection Observer for Scroll Animations
  const animatedEls = document.querySelectorAll('[data-animate]');
  
  if ('IntersectionObserver' in window) {
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          animObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    animatedEls.forEach(el => animObserver.observe(el));
  } else {
    // Fallback for older browsers
    animatedEls.forEach(el => el.classList.add('visible'));
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          // Close mobile menu if open
          const navToggle = document.getElementById('nav-toggle');
          if (navToggle) navToggle.checked = false;
        }
      }
    });
  });
});