// Simple snow particle boost + little interactions
document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Tiny confetti-style cookie rain on join button click (just for fun)
  const form = document.querySelector('.join-form');
  if (form) {
    form.addEventListener('submit', () => {
      // visual feedback is already handled by the alert in HTML
    });
  }
});