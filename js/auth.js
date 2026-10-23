/**
 * TerraTwin - Authentication Controller (Sign In & Register)
 * Handles in-card smooth 3D tab sliding, bilingual language switching,
 * dark/light themes, persistent user registration & login session management.
 */

// Global Toggle Functions (callable inline from HTML onclick)
window.toggleAuthTheme = function() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('terratwin_theme', next);
  const themeBtn = document.getElementById('authThemeBtn');
  if (themeBtn) {
    themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
  }
};

window.toggleAuthLanguage = function() {
  const cur = document.documentElement.getAttribute('lang') || 'ar';
  const next = cur === 'ar' ? 'en' : 'ar';
  setLanguage(next);
};

// Main Initialization Function
async function initAuth() {
  // 1. Initialize Theme
  const savedTheme = localStorage.getItem('terratwin_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeBtn = document.getElementById('authThemeBtn');
  if (themeBtn) {
    themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  }

  // 2. Initialize Language
  if (window.I18n) {
    try {
      await window.I18n.init();
    } catch (e) {
      console.warn('I18n init error:', e);
    }
  }

  const currentLang = localStorage.getItem('terratwin_lang') || 'ar';
  setLanguage(currentLang);

  // 3. Bind Theme and Language Events
  if (themeBtn) {
    themeBtn.onclick = window.toggleAuthTheme;
  }
  const langBtn = document.getElementById('authLangBtn');
  if (langBtn) {
    langBtn.onclick = window.toggleAuthLanguage;
  }

  // 4. In-Card Sliding Tab Navigation (Sign In <-> Register)
  const tabSignIn = document.getElementById('tabBtnSignIn');
  const tabRegister = document.getElementById('tabBtnRegister');
  const linkToRegister = document.getElementById('linkToRegister');
  const linkToLogin = document.getElementById('linkToLogin');

  if (tabSignIn) tabSignIn.addEventListener('click', () => switchToView('login'));
  if (tabRegister) tabRegister.addEventListener('click', () => switchToView('register'));
  if (linkToRegister) linkToRegister.addEventListener('click', (e) => { e.preventDefault(); switchToView('register'); });
  if (linkToLogin) linkToLogin.addEventListener('click', (e) => { e.preventDefault(); switchToView('login'); });

  // Initial tab state from URL or filename
  const isRegPage = window.location.pathname.includes('register') || window.location.hash === '#register';
  switchToView(isRegPage ? 'register' : 'login');

  // 5. Password Visibility Toggles
  document.querySelectorAll('.auth-password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      if (input) {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.textContent = isPass ? '🙈' : '👁️';
      }
    });
  });

  // 6. Handle Sign In Submission
  const signInView = document.getElementById('signInFormView');
  if (signInView) {
    signInView.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const pass = document.getElementById('loginPassword').value;
      const remember = document.getElementById('rememberMeCheckbox')?.checked;

      const result = performLogin(email, pass, remember);
      if (result.success) {
        showAuthAlert('success', result.message);
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 850);
      } else {
        showAuthAlert('error', result.message);
      }
    });
  }

  // 7. Handle 1-Click Fast Demo Login
  const demoBtn = document.getElementById('quickDemoLoginBtn');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      const result = performLogin('researcher@terratwin.space', 'demo123', true, true);
      showAuthAlert('success', result.message);
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 750);
    });
  }

  // 8. Handle Registration Submission
  const registerView = document.getElementById('registerFormView');
  if (registerView) {
    registerView.addEventListener('submit', (e) => {
      e.preventDefault();
      const isAr = (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const role = document.getElementById('regRole').value;
      const avatarRadio = document.querySelector('input[name="userAvatarRadio"]:checked');
      const avatar = avatarRadio ? avatarRadio.value : '👨‍🚀';
      const gender = avatarRadio ? avatarRadio.getAttribute('data-gender') : 'male';

      if (password.length < 5) {
        showAuthAlert('error', isAr ? 'يجب أن تتكون كلمة المرور من 5 خانات على الأقل.' : 'Password must be at least 5 characters.');
        return;
      }

      const result = performRegistration({
        name,
        email,
        password,
        role,
        avatar,
        gender
      });

      if (result.success) {
        showAuthAlert('success', result.message);
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } else {
        showAuthAlert('error', result.message);
      }
    });
  }

  // 9. Forgot Password Helper
  const forgotLink = document.getElementById('forgotPassLink');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      const isAr = (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
      alert(isAr 
        ? 'وضع العرض التجريبي: يمكنك تسجيل الدخول باستخدام الزر التجريبي السريع أو إدخال أي كلمة مرور.' 
        : 'Demo Clearance Mode: You can sign in using the 1-Click Fast Demo button or any password.');
    });
  }
}

function switchToView(mode) {
  const isAr = (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
  const isRegister = mode === 'register';
  const cardContainer = document.getElementById('authCardContainer');
  const card = document.querySelector('.auth-card');
  const tabSignIn = document.getElementById('tabBtnSignIn');
  const tabRegister = document.getElementById('tabBtnRegister');
  const slider = document.getElementById('authTabSlider');
  const signInView = document.getElementById('signInFormView');
  const registerView = document.getElementById('registerFormView');
  const brandMark = document.getElementById('authBrandMark');

  // 1. Dynamic Card Holographic Laser Wipe & 3D Depth Pulse
  if (card) {
    card.classList.remove('morphing-transition');
    void card.offsetWidth; // Trigger reflow for clean re-trigger
    card.classList.add('morphing-transition');
  }

  // 2. Icon 360° Orbital Flip & Visual Morphing between Planetary Orbit and Star Clearance
  if (brandMark) {
    brandMark.classList.toggle('mode-register', isRegister);
    brandMark.classList.toggle('mode-signin', !isRegister);

    const iconSignin = brandMark.querySelector('.brand-icon-signin');
    const iconRegister = brandMark.querySelector('.brand-icon-register');
    if (iconSignin && iconRegister) {
      if (isRegister) {
        iconSignin.style.display = 'none';
        iconRegister.style.display = 'block';
      } else {
        iconRegister.style.display = 'none';
        iconSignin.style.display = 'block';
      }
    }
  }

  if (cardContainer) {
    cardContainer.classList.toggle('mode-register', isRegister);
  }

  if (tabSignIn && tabRegister) {
    tabSignIn.classList.toggle('active', !isRegister);
    tabRegister.classList.toggle('active', isRegister);
  }

  if (slider) {
    if (isRegister) {
      slider.style.transform = isAr ? 'translateX(-100%)' : 'translateX(100%)';
    } else {
      slider.style.transform = 'translateX(0)';
    }
  }

  if (signInView && registerView) {
    if (isRegister) {
      signInView.classList.remove('active');
      signInView.classList.add('hidden-left');
      registerView.classList.remove('hidden-right');
      registerView.classList.add('active');
    } else {
      registerView.classList.remove('active');
      registerView.classList.add('hidden-right');
      signInView.classList.remove('hidden-left');
      signInView.classList.add('active');
    }
  }

  updateHeaderTexts(isRegister, isAr);

  const alertBox = document.getElementById('authAlertBox');
  if (alertBox) alertBox.style.display = 'none';

  try {
    history.replaceState(null, null, isRegister ? '#register' : '#login');
  } catch (e) {}
}

function setLanguage(lang) {
  const isAr = lang === 'ar';
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', isAr ? 'rtl' : 'ltr');
  localStorage.setItem('terratwin_lang', lang);

  if (window.I18n) {
    window.I18n.currentLang = lang;
    if (typeof window.I18n.applyLanguage === 'function') {
      window.I18n.applyLanguage(lang, false);
    }
  }

  const langBtn = document.getElementById('authLangBtn');
  if (langBtn) {
    langBtn.textContent = isAr ? 'English' : 'عربي';
  }

  // Update All Elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (window.I18n && typeof window.I18n.t === 'function') {
      const translated = window.I18n.t(key);
      if (translated && translated !== key) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translated;
        } else {
          el.textContent = translated;
        }
      }
    }
  });

  // Re-align tab slider for RTL/LTR
  const slider = document.getElementById('authTabSlider');
  const isRegister = document.getElementById('tabBtnRegister')?.classList.contains('active');
  if (slider) {
    if (isRegister) {
      slider.style.transform = isAr ? 'translateX(-100%)' : 'translateX(100%)';
    } else {
      slider.style.transform = 'translateX(0)';
    }
  }

  // Update Header title & subtitle
  updateHeaderTexts(isRegister, isAr);
}

function updateHeaderTexts(isRegister, isAr) {
  const titleEl = document.getElementById('authHeaderTitle');
  const subEl = document.getElementById('authHeaderSub');

  if (titleEl && subEl) {
    if (isRegister) {
      titleEl.textContent = isAr ? 'إنشاء حساب باحث فلكي' : 'Researcher Account Clearance';
      subEl.textContent = isAr ? 'انضم إلى شبكة Astraea العلمية لاستكشاف ومطابقة تضاريس الكواكب' : 'Join the Astraea scientific network to catalog and match planetary analogs';
    } else {
      titleEl.textContent = isAr ? 'بوابة تسجيل الدخول' : 'Mission Clearance Sign In';
      subEl.textContent = isAr ? 'أدخل معرّفك الفلكي للوصول إلى تحليلات النظائر الكوكبية' : 'Authenticate to access planetary twin telemetry & field catalogs';
    }
  }
}

function showAuthAlert(type, message) {
  const alertBox = document.getElementById('authAlertBox');
  if (!alertBox) return;

  alertBox.className = `auth-alert-box ${type}`;
  alertBox.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> <span>${message}</span>`;
  alertBox.style.display = 'flex';
}

function getStoredUsers() {
  const raw = localStorage.getItem('terratwin_registered_users');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  const defaultList = [
    {
      name: 'Dr. Researcher',
      nameAr: 'د. باحث',
      email: 'researcher@terratwin.space',
      password: 'demo',
      role: 'Astraea Science Team',
      roleAr: 'فريق Astraea العلمي',
      avatar: '👨‍🚀',
      gender: 'male',
      xp: 420,
      visitedPages: ['home', 'finder', 'guide'],
      discoveredSites: ['atacama_yungay', 'antarctica_dryvalleys', 'moon-shackleton'],
      searchesCount: 4,
      comparisonsCount: 2
    }
  ];
  localStorage.setItem('terratwin_registered_users', JSON.stringify(defaultList));
  return defaultList;
}

function performLogin(email, password, remember, isDemo = false) {
  const isAr = (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
  const users = getStoredUsers();

  let matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (isDemo && !matchedUser) {
    matchedUser = users[0];
  }

  if (matchedUser && (isDemo || matchedUser.password === password || password === 'demo' || password === 'space')) {
    matchedUser.isLoggedIn = true;
    localStorage.setItem('terratwin_auth_active', 'true');
    localStorage.setItem('terratwin_user_profile', JSON.stringify(matchedUser));

    if (window.UserSystem) {
      window.UserSystem.currentUser = matchedUser;
      window.UserSystem.addXP(25, 'Daily mission clearance access', 'تسجيل دخول علمي يومي');
    }

    return {
      success: true,
      message: isAr 
        ? `أهلاً بك مجدداً يا ${matchedUser.nameAr || matchedUser.name}! جارٍ توجيهك إلى غرفة القيادة... 🚀` 
        : `Welcome back, ${matchedUser.name}! Routing to mission observatory... 🚀`
    };
  }

  return {
    success: false,
    message: isAr 
      ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى المحاولة مجدداً.' 
      : 'Invalid email or password. Please verify credentials.'
  };
}

function performRegistration(data) {
  const isAr = (document.documentElement.getAttribute('lang') || 'ar') === 'ar';
  const users = getStoredUsers();

  const exists = users.some(u => u.email.toLowerCase() === data.email.toLowerCase());
  if (exists) {
    return {
      success: false,
      message: isAr ? 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.' : 'This email is already registered. Please sign in.'
    };
  }

  const newUser = {
    name: data.name,
    nameAr: data.name,
    email: data.email,
    password: data.password,
    role: data.role || 'Astraea Science Team',
    roleAr: data.role || 'فريق Astraea العلمي',
    avatar: data.avatar || '👨‍🚀',
    gender: data.gender || 'male',
    isLoggedIn: true,
    xp: 200,
    visitedPages: ['home'],
    discoveredSites: ['atacama_yungay', 'antarctica_dryvalleys'],
    searchesCount: 0,
    comparisonsCount: 0,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem('terratwin_registered_users', JSON.stringify(users));
  localStorage.setItem('terratwin_auth_active', 'true');
  localStorage.setItem('terratwin_user_profile', JSON.stringify(newUser));

  if (window.UserSystem) {
    window.UserSystem.currentUser = newUser;
  }

  return {
    success: true,
    message: isAr 
      ? `تم إنشاء حساب الباحث بنجاح! مرحباً بك في Astraea يا ${newUser.name}. 🚀` 
      : `Clearance granted! Welcome to Astraea, ${newUser.name}. 🚀`
  };
}

// Start immediately or on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
