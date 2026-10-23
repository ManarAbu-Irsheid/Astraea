/**
 * TerraTwin - Mission Purpose, Ethics & Guide Controller
 * Astraea Science Team
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Global App Shell (I18n, Theme, User Profile, Kebab 3-Dots Menu, Chatbot, Tour)
  if (window.App) {
    await window.App.init('guide');
  }

  // Record exploration progress
  if (window.UserSystem && typeof window.UserSystem.recordPageVisit === 'function') {
    window.UserSystem.recordPageVisit('guide');
  }

  // Smooth scroll and active state for guide anchor navigation buttons
  const navBtns = document.querySelectorAll('.guide-nav-btn');
  const sections = document.querySelectorAll('.guide-content-section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = btn.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        e.preventDefault();
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
          navBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      }
    });
  });

  // Highlight active nav item on scroll
  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 180;
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      if (scrollPos >= top && scrollPos < top + height) {
        navBtns.forEach(b => {
          b.classList.toggle('active', b.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { passive: true });
});
