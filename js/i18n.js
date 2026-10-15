/**
 * TerraTwin - Internationalization (i18n) Engine
 * Full Bidirectional Support: English (LTR, default) & Arabic (RTL)
 * Dynamic string replacement, direction switching, and localStorage persistence.
 */

const I18n = {
  currentLang: 'en',
  translations: {},

  async init() {
    this.currentLang = localStorage.getItem('terratwin_lang') || 'en';
    await this.loadTranslations();
    this.applyLanguage(this.currentLang, false);
    this.bindEvents();
  },

  async loadTranslations() {
    try {
      const response = await fetch('data/locales.json');
      if (!response.ok) throw new Error('Failed to load locales.json');
      this.translations = await response.json();
    } catch (err) {
      if (window.__TERRATWIN_DATA__ && window.__TERRATWIN_DATA__.locales) {
        this.translations = window.__TERRATWIN_DATA__.locales;
      } else {
        console.warn('Could not fetch locales.json directly, falling back to embedded dictionary.', err);
        this.translations = window.TERRATWIN_LOCALES || {};
      }
    }
  },

  applyLanguage(lang, triggerEvent = true) {
    this.currentLang = lang;
    localStorage.setItem('terratwin_lang', lang);

    const isAr = lang === 'ar';
    document.documentElement.lang = isAr ? 'ar' : 'en';
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';

    // Update Language Toggle Button Text
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
      langBtn.textContent = isAr ? 'EN' : 'عربي';
      langBtn.title = isAr ? 'Switch to English' : 'التبديل إلى العربية';
    }

    // Translate all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (text) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = text;
        } else {
          el.textContent = text;
        }
      }
    });

    // Translate attributes like placeholder or title
    const attrElements = document.querySelectorAll('[data-i18n-placeholder]');
    attrElements.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = this.t(key);
      if (text) el.placeholder = text;
    });

    if (triggerEvent) {
      document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }
  },

  t(keyPath, defaultText = '') {
    if (!keyPath || !this.translations[this.currentLang]) return defaultText;
    const keys = keyPath.split('.');
    let obj = this.translations[this.currentLang];
    for (const key of keys) {
      if (!obj || typeof obj !== 'object') return defaultText;
      obj = obj[key];
    }
    return obj !== undefined ? obj : defaultText;
  },

  toggleLanguage() {
    const nextLang = this.currentLang === 'en' ? 'ar' : 'en';
    this.applyLanguage(nextLang, true);
  },

  bindEvents() {
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
      langBtn.addEventListener('click', () => this.toggleLanguage());
    }
  }
};

window.I18n = I18n;
