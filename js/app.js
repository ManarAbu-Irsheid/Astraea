/**
 * TerraTwin - Main Application Shell & Shared Utilities
 * Coordinates theme switching, data fetching, global components, and page lifecycle.
 */

const App = {
  dataCache: {
    cells: null,
    targets: null,
    validation: null,
    locales: null
  },

  async init(pageName) {
    this.initTheme();
    this.highlightActiveNav(pageName);

    // Initialize core persistent systems
    await window.I18n.init();
    window.MissionProfileManager.init();
    window.GuidedTour.init(pageName);
    window.ScientificChatbot.init(pageName);

    this.bindGlobalEvents();
  },

  initTheme() {
    const savedTheme = localStorage.getItem('terratwin_theme') || 'dark';
    this.setTheme(savedTheme);

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
      });
    }
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('terratwin_theme', theme);
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
      themeBtn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  },

  highlightActiveNav(pageName) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const page = link.getAttribute('data-page');
      if (page === pageName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  async fetchData(file) {
    if (this.dataCache[file]) return this.dataCache[file];
    try {
      const res = await fetch(`data/${file}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status} loading ${file}.json`);
      const data = await res.json();
      this.dataCache[file] = data;
      return data;
    } catch (err) {
      if (window.__TERRATWIN_DATA__ && window.__TERRATWIN_DATA__[file]) {
        this.dataCache[file] = window.__TERRATWIN_DATA__[file];
        return this.dataCache[file];
      }
      console.error(`Failed to load data/${file}.json:`, err);
      return null;
    }
  },

  bindGlobalEvents() {
    // Listen for custom notifications or error toasts if needed
  }
};

window.App = App;
