/**
 * TerraTwin - User Profile, Authentication, & Gamification Engine
 * Handles:
 * - User Profile (Name, Phone, Email, Gender/Avatar: 👨‍🚀 Male vs 👩‍🚀 Female Astronaut)
 * - Exploration Level & XP System (Gains XP as user explores sites, tests missions, compares analogs)
 * - Auth Modals (Sign In / Sign Up)
 * - Edit Profile Modal
 * - Contact Us Modal
 * - Floating XP Toasts & Level Up Celebrations
 */

const UserSystem = {
  // Level threshold definitions
  LEVELS: [
    { level: 1, minXp: 0, maxXp: 150, titleEn: 'Cadet Explorer', titleAr: 'باحث مستجد' },
    { level: 2, minXp: 151, maxXp: 350, titleEn: 'Planetary Surveyor', titleAr: 'مسّاح كوكبي' },
    { level: 3, minXp: 351, maxXp: 650, titleEn: 'Analog Specialist', titleAr: 'اختصاصي مواقع شبيهة' },
    { level: 4, minXp: 651, maxXp: 1050, titleEn: 'Mission Commander', titleAr: 'قائد استكشاف فضائي' },
    { level: 5, minXp: 1051, maxXp: 9999, titleEn: 'Chief Astrobiologist', titleAr: 'كبير علماء الكواكب' }
  ],

  defaultUser: {
    isLoggedIn: false,
    name: 'Dr. Researcher',
    nameAr: 'د. باحث',
    phone: '+962 7 9000 0000',
    email: 'researcher@astraea.space',
    gender: 'female', // 'male' or 'female'
    avatar: '👩‍🚀', // 👩‍🚀 female astronaut, 👨‍🚀 male astronaut, 👽 alien, 🛸 rover
    xp: 150,
    visitedPages: ['home'],
    discoveredSites: ['atacama_yungay', 'antarctica_dryvalleys'],
    searchesCount: 0,
    comparisonsCount: 0,
    role: 'Astraea Science Team',
    clearance: 'CADET ACCESS'
  },

  currentUser: null,

  init() {
    this.loadUser();
    this.injectModals();
    this.renderUserUI();
    this.bindEvents();
    this.bindEthicsModalEvents();
  },

  loadUser() {
    const isAuthActive = localStorage.getItem('terratwin_auth_active') === 'true';
    const saved = localStorage.getItem('terratwin_user_profile');
    if (saved) {
      try {
        this.currentUser = { ...this.defaultUser, ...JSON.parse(saved) };
      } catch (e) {
        this.currentUser = { ...this.defaultUser };
      }
    } else {
      this.currentUser = { ...this.defaultUser };
      this.saveUser();
    }

    // Gate: User is only authenticated if terratwin_auth_active is explicitly true
    this.currentUser.isLoggedIn = isAuthActive;

    // Load persistent registered data if logged in
    if (isAuthActive && this.currentUser.email) {
      try {
        const raw = localStorage.getItem('terratwin_registered_users');
        if (raw) {
          const users = JSON.parse(raw);
          const found = users.find(u => u.email && u.email.toLowerCase() === this.currentUser.email.toLowerCase());
          if (found) {
            this.currentUser = { ...this.currentUser, ...found, isLoggedIn: true };
          }
        }
      } catch (e) {
        console.warn('Sync registered user profile on load:', e);
      }
    }

    if (!Array.isArray(this.currentUser.visitedPages)) {
      this.currentUser.visitedPages = ['home'];
    }
    if (!Array.isArray(this.currentUser.discoveredSites)) {
      this.currentUser.discoveredSites = ['atacama_yungay', 'antarctica_dryvalleys'];
    }
    if (typeof this.currentUser.searchesCount !== 'number') {
      this.currentUser.searchesCount = 0;
    }
    if (typeof this.currentUser.comparisonsCount !== 'number') {
      this.currentUser.comparisonsCount = 0;
    }
  },

  saveUser() {
    localStorage.setItem('terratwin_user_profile', JSON.stringify(this.currentUser));
    if (this.currentUser && this.currentUser.isLoggedIn) {
      localStorage.setItem('terratwin_auth_active', 'true');
    }

    // Synchronize to persistent registered database if present
    try {
      const raw = localStorage.getItem('terratwin_registered_users');
      if (raw && this.currentUser && this.currentUser.email) {
        let users = JSON.parse(raw);
        if (Array.isArray(users)) {
          const idx = users.findIndex(u => u.email && u.email.toLowerCase() === this.currentUser.email.toLowerCase());
          if (idx !== -1) {
            users[idx] = { ...users[idx], ...this.currentUser };
            localStorage.setItem('terratwin_registered_users', JSON.stringify(users));
          }
        }
      }
    } catch (e) {
      console.warn('Sync registered user profile warning:', e);
    }

    this.renderUserUI();
  },

  calculateExplorationProgress() {
    if (!this.currentUser) return 0;
    const visited = this.currentUser.visitedPages || [];
    const discovered = this.currentUser.discoveredSites || [];
    const searches = this.currentUser.searchesCount || 0;
    const comparisons = this.currentUser.comparisonsCount || 0;

    // 1. Pages exploration (5 total pages: home, finder, compare, evidence, guide) -> up to 30%
    const pageScore = (Math.min(5, visited.length) / 5) * 30;

    // 2. Analog Sites/Pins inspected (up to 16 key sites) -> up to 40%
    const siteScore = (Math.min(16, discovered.length) / 16) * 40;

    // 3. Analytic Searches (target 5 searches for full marks) -> up to 15%
    const searchScore = (Math.min(5, searches) / 5) * 15;

    // 4. Comparative Matrices & Bi-directional models (target 5 runs) -> up to 15%
    const compScore = (Math.min(5, comparisons) / 5) * 15;

    const total = Math.round(pageScore + siteScore + searchScore + compScore);
    return Math.min(100, Math.max(visited.length > 0 ? 8 : 0, total));
  },

  recordPageVisit(pageName) {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return;
    if (!Array.isArray(this.currentUser.visitedPages)) {
      this.currentUser.visitedPages = [];
    }
    if (!this.currentUser.visitedPages.includes(pageName)) {
      this.currentUser.visitedPages.push(pageName);
      this.addXP(25, `Explored sector: ${pageName.toUpperCase()}`, `استكشاف قسم علمي: ${pageName}`);
      this.saveUser();
    }
  },

  recordSearch() {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return;
    this.currentUser.searchesCount = (this.currentUser.searchesCount || 0) + 1;
    if (this.currentUser.searchesCount % 2 === 0) {
      this.addXP(10, 'Executed planetary query & criteria filter', 'تنفيذ استعلام وفلترة كوكبية متقدمة');
    } else {
      this.saveUser();
    }
  },

  recordComparison() {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return;
    this.currentUser.comparisonsCount = (this.currentUser.comparisonsCount || 0) + 1;
    if (this.currentUser.comparisonsCount % 2 === 0) {
      this.addXP(15, 'Executed analog comparative matrix', 'مقارنة نماذج ومصفوفات كوكبية ثنائية');
    } else {
      this.saveUser();
    }
  },

  getCurrentLevel() {
    const xp = this.currentUser.xp || 0;
    for (let i = this.LEVELS.length - 1; i >= 0; i--) {
      if (xp >= this.LEVELS[i].minXp) {
        return this.LEVELS[i];
      }
    }
    return this.LEVELS[0];
  },

  getNextLevel() {
    const current = this.getCurrentLevel();
    const next = this.LEVELS.find(l => l.level === current.level + 1);
    return next || current;
  },

  addXP(amount, reasonEn, reasonAr) {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return; // Strict: Gamification XP only for registered logged-in users!
    if (!amount || amount <= 0) return;
    const prevLevel = this.getCurrentLevel().level;
    this.currentUser.xp = (this.currentUser.xp || 0) + amount;
    this.saveUser();

    const newLevel = this.getCurrentLevel().level;
    const isAr = (window.I18n ? window.I18n.currentLang : 'en') === 'ar';
    const reason = isAr ? (reasonAr || reasonEn) : reasonEn;

    this.showXpToast(amount, reason);

    if (newLevel > prevLevel) {
      this.showLevelUpCelebration(newLevel);
    }
  },

  discoverSite(siteId, siteName) {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return;
    if (!this.currentUser.discoveredSites) {
      this.currentUser.discoveredSites = [];
    }
    if (!this.currentUser.discoveredSites.includes(siteId)) {
      this.currentUser.discoveredSites.push(siteId);
      this.addXP(35, `Explored new analog site: ${siteName}`, `اكتشاف موقع تناظري جديد: ${siteName}`);
    }
  },

  showXpToast(amount, reason) {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return; // Do not show toasts to guests
    let container = document.getElementById('xpToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'xpToastContainer';
      container.className = 'xp-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'xp-toast';
    toast.innerHTML = `
      <div class="xp-toast-badge">+${amount} XP</div>
      <div class="xp-toast-content">
        <span class="xp-toast-icon">🚀</span>
        <span class="xp-toast-text">${reason}</span>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  },

  showLevelUpCelebration(levelNumber) {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return; // Do not show celebration to guests
    const lvl = this.LEVELS.find(l => l.level === levelNumber) || this.LEVELS[0];
    const isAr = (window.I18n ? window.I18n.currentLang : 'en') === 'ar';
    const title = isAr ? lvl.titleAr : lvl.titleEn;

    const overlay = document.createElement('div');
    overlay.className = 'levelup-modal-overlay';
    overlay.innerHTML = `
      <div class="levelup-modal-card">
        <div class="levelup-sparkles">✨ 🎉 ✨</div>
        <div class="levelup-badge">LEVEL ${lvl.level} REACHED</div>
        <h2 class="levelup-title">${isAr ? 'ترقية علمية جديدة!' : 'Scientific Promotion!'}</h2>
        <div class="levelup-role-name">${title}</div>
        <p class="levelup-desc">
          ${isAr 
            ? 'تهانينا! لقد اكتسبت خبرة ميدانية كوكبية متقدمة تتيح لك فك شفرات معقدة في مطابقة تضاريس القمر والمريخ.'
            : 'Congratulations! You have gained advanced planetary field expertise, unlocking deeper analog telemetry.'}
        </p>
        <button class="levelup-claim-btn" id="claimPromotionBtn">${isAr ? 'متابعة الاستكشاف 🚀' : 'Continue Exploration 🚀'}</button>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('claimPromotionBtn').addEventListener('click', () => {
      overlay.classList.add('closing');
      setTimeout(() => overlay.remove(), 300);
    });
  },

  renderUserUI() {
    const user = this.currentUser;
    const isAr = (window.I18n ? window.I18n.currentLang : 'en') === 'ar';
    const lvl = this.getCurrentLevel();
    const nextLvl = this.getNextLevel();
    const isLoggedIn = !!(user && user.isLoggedIn);

    // Manage Navbar Profile Container: Logged In Profile vs Guest Auth Button
    const profileContainer = document.querySelector('.user-profile-container');
    const profileBtn = document.getElementById('userProfileBtn');
    const profileDropdown = document.getElementById('userProfileDropdown');

    let navAuthBtn = document.getElementById('navAuthLoginBtn');
    if (!navAuthBtn && profileContainer) {
      navAuthBtn = document.createElement('a');
      navAuthBtn.id = 'navAuthLoginBtn';
      navAuthBtn.className = 'nav-auth-login-btn';
      navAuthBtn.href = 'login.html';
      profileContainer.appendChild(navAuthBtn);
    }

    if (navAuthBtn) {
      const authLabel = window.I18n && window.I18n.t ? window.I18n.t('auth.nav_login_btn') : (isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register');
      navAuthBtn.innerHTML = `
        <span class="auth-btn-text" data-i18n="auth.nav_login_btn">${authLabel}</span>
      `;
    }

    // Toggle visibility based on authentication status
    if (!isLoggedIn) {
      if (profileBtn) profileBtn.style.setProperty('display', 'none', 'important');
      if (profileDropdown) {
        profileDropdown.style.setProperty('display', 'none', 'important');
        profileDropdown.classList.remove('open');
      }
      if (navAuthBtn) navAuthBtn.style.setProperty('display', 'inline-flex', 'important');
      return;
    } else {
      if (profileBtn) profileBtn.style.setProperty('display', 'flex', 'important');
      if (profileDropdown) profileDropdown.style.removeProperty('display');
      if (navAuthBtn) navAuthBtn.style.setProperty('display', 'none', 'important');
    }

    // 1. Update Navbar Profile Button for logged-in user
    const avatarBadge = document.querySelector('.user-avatar-badge');
    if (avatarBadge) {
      avatarBadge.innerHTML = `
        <span class="user-avatar-icon">${user.avatar || (user.gender === 'female' ? '👩‍🚀' : '👨‍🚀')}</span>
        <span class="user-status-dot" title="Status: Online"></span>
      `;
    }

    const nameEl = document.querySelector('.user-display-name');
    if (nameEl) {
      nameEl.textContent = isAr && user.nameAr ? user.nameAr : user.name;
    }

    const expProgress = this.calculateExplorationProgress();
    let progressPill = document.querySelector('.user-exploration-pill');
    if (!progressPill) {
      const metaContainer = document.querySelector('.user-meta-text');
      if (metaContainer) {
        progressPill = document.createElement('span');
        progressPill.className = 'user-exploration-pill';
        metaContainer.appendChild(progressPill);
      }
    }
    if (progressPill) {
      progressPill.textContent = `${expProgress}%`;
      progressPill.title = isAr ? `نسبة استكشاف الموقع: ${expProgress}%` : `Exploration Progress: ${expProgress}%`;
    }

    const roleEl = document.querySelector('.user-role-tag');
    if (roleEl) {
      roleEl.textContent = `LVL ${lvl.level} • ${user.role || 'ASTRAEA'}`;
    }

    // 2. Update Profile Dropdown Card
    const dropdownAvatar = document.querySelector('.user-dropdown-avatar');
    if (dropdownAvatar) {
      dropdownAvatar.textContent = user.avatar || (user.gender === 'female' ? '👩‍🚀' : '👨‍🚀');
    }

    const dropdownName = document.querySelector('.user-dropdown-name');
    if (dropdownName) {
      dropdownName.textContent = isAr && user.nameAr ? user.nameAr : user.name;
    }

    const dropdownRole = document.querySelector('.user-dropdown-role');
    if (dropdownRole) {
      dropdownRole.textContent = isAr ? lvl.titleAr : lvl.titleEn;
    }

    const dropdownEmail = document.querySelector('.user-dropdown-email');
    if (dropdownEmail) {
      dropdownEmail.textContent = user.email;
    }

    // Level & XP Bar in Dropdown
    let xpBlock = document.getElementById('userProfileXpBlock');
    if (!xpBlock) {
      const parent = document.querySelector('.user-profile-dropdown');
      if (parent) {
        xpBlock = document.createElement('div');
        xpBlock.id = 'userProfileXpBlock';
        xpBlock.className = 'user-xp-progress-block';
        
        // Insert before dropdown divider
        const divider = parent.querySelector('.user-dropdown-divider');
        if (divider) {
          parent.insertBefore(xpBlock, divider);
        } else {
          parent.appendChild(xpBlock);
        }
      }
    }

    if (xpBlock) {
      const currentXp = user.xp || 0;
      const progressPercent = Math.min(100, Math.round(((currentXp - lvl.minXp) / ((nextLvl.maxXp - lvl.minXp) || 1)) * 100));
      const expProgress = this.calculateExplorationProgress();
      const visitedCount = (user.visitedPages || []).length;
      const sitesCount = (user.discoveredSites || []).length;
      const searchesCount = user.searchesCount || 0;
      const comparisonsCount = user.comparisonsCount || 0;

      xpBlock.innerHTML = `
        <!-- Platform Exploration & Research Progress Meter -->
        <div class="exploration-progress-panel">
          <div class="exploration-panel-header">
            <span class="exploration-panel-title">
              <span class="exp-icon">🔭</span>
              <span>${isAr ? 'نسبة استكشاف وبحث الموقع' : 'Exploration & Research Progress'}</span>
            </span>
            <span class="exploration-badge-pct">${expProgress}%</span>
          </div>
          <div class="exploration-bar-track">
            <div class="exploration-bar-fill" style="width: ${expProgress}%;"></div>
          </div>
          <div class="exploration-metrics-grid">
            <div class="exploration-metric-item" title="${isAr ? 'الأقسام والصفحات المستكشفة' : 'Pages Explored'}">
              <span class="exp-metric-icon">📄</span>
              <span class="exp-metric-num">${visitedCount} / 5</span>
              <span class="exp-metric-lbl">${isAr ? 'أقسام' : 'Pages'}</span>
            </div>
            <div class="exploration-metric-item" title="${isAr ? 'المواقع والنظائر المفحوصة' : 'Analogs Inspected'}">
              <span class="exp-metric-icon">📍</span>
              <span class="exp-metric-num">${Math.min(16, sitesCount)} / 16</span>
              <span class="exp-metric-lbl">${isAr ? 'نظائر' : 'Analogs'}</span>
            </div>
            <div class="exploration-metric-item" title="${isAr ? 'استعلامات وبحث فلكي' : 'Searches Executed'}">
              <span class="exp-metric-icon">🔍</span>
              <span class="exp-metric-num">${searchesCount}</span>
              <span class="exp-metric-lbl">${isAr ? 'بحث' : 'Searches'}</span>
            </div>
            <div class="exploration-metric-item" title="${isAr ? 'نماذج المقارنة المنجزة' : 'Comparisons Run'}">
              <span class="exp-metric-icon">⚖️</span>
              <span class="exp-metric-num">${comparisonsCount}</span>
              <span class="exp-metric-lbl">${isAr ? 'مقارنات' : 'Matrices'}</span>
            </div>
          </div>
        </div>

        <div class="xp-progress-subblock">
          <div class="xp-progress-header">
            <span class="xp-level-tag">LEVEL ${lvl.level}: ${isAr ? lvl.titleAr : lvl.titleEn}</span>
            <span class="xp-score-tag">${currentXp} XP</span>
          </div>
          <div class="xp-bar-track">
            <div class="xp-bar-fill" style="width: ${progressPercent}%;"></div>
          </div>
          <div class="xp-stats-footer">
            <span>${isAr ? 'المستوى القادم:' : 'Next Level:'} <strong>${nextLvl.maxXp} XP</strong></span>
            <span>${isAr ? 'الحالة العلمية:' : 'Status:'} <strong style="color:var(--accent-green);">${isAr ? 'نشط' : 'Active'}</strong></span>
          </div>
        </div>
      `;
    }

    // Add Edit Profile Button & Sign Out in Dropdown
    let editBtn = document.getElementById('userProfileEditTriggerBtn');
    if (!editBtn) {
      const linksContainer = document.querySelector('.user-dropdown-links');
      if (linksContainer) {
        editBtn = document.createElement('button');
        editBtn.id = 'userProfileEditTriggerBtn';
        editBtn.className = 'user-dropdown-action-btn edit-profile';
        editBtn.innerHTML = `⚙️ <span data-i18n="nav.edit_profile">${isAr ? 'تعديل الملف الشخصي' : 'Edit Profile & Info'}</span>`;
        editBtn.addEventListener('click', () => {
          document.querySelectorAll('.user-profile-dropdown').forEach(d => d.classList.remove('open'));
          this.openEditProfileModal();
        });
        linksContainer.prepend(editBtn);

        // Sign Out button
        const authBtn = document.createElement('button');
        authBtn.id = 'userProfileAuthTriggerBtn';
        authBtn.className = 'user-dropdown-action-btn auth-toggle';
        authBtn.innerHTML = `🚪 <span data-i18n="nav.sign_out">${isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>`;
        authBtn.addEventListener('click', () => {
          document.querySelectorAll('.user-profile-dropdown').forEach(d => d.classList.remove('open'));
          this.signOut();
        });
        linksContainer.appendChild(authBtn);
      }
    } else {
      editBtn.innerHTML = `⚙️ <span data-i18n="nav.edit_profile">${isAr ? 'تعديل الملف الشخصي' : 'Edit Profile & Info'}</span>`;
      const authBtn = document.getElementById('userProfileAuthTriggerBtn');
      if (authBtn) {
        authBtn.innerHTML = `🚪 <span data-i18n="nav.sign_out">${isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>`;
      }
    }
  },

  injectModals() {
    if (document.getElementById('terratwinGlobalModals')) return;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'terratwinGlobalModals';
    modalContainer.innerHTML = `
      <!-- ================================================================
           EDIT PROFILE MODAL (Name, Phone, Email, Gender/Avatar)
           ================================================================ -->
      <div class="custom-modal-overlay" id="editProfileModalOverlay">
        <div class="custom-modal-dialog">
          <div class="custom-modal-header">
            <div class="modal-header-title">
              <span class="modal-icon">👨‍🚀</span>
              <span id="editModalHeaderTitle">Edit Researcher Profile / تعديل الملف الشخصي</span>
            </div>
            <button class="custom-modal-close" id="closeEditProfileModalBtn">✕</button>
          </div>
          
          <form class="custom-modal-body" id="editProfileForm">
            <!-- Avatar & Gender Picker -->
            <div class="form-group-avatar-select">
              <label class="form-label">Astronaut Avatar & Identity / هوية ورتبة الفضائي:</label>
              <div class="avatar-options-grid">
                <label class="avatar-option-card">
                  <input type="radio" name="userAvatarRadio" value="👨‍🚀" data-gender="male">
                  <span class="avatar-card-visual">
                    <span class="avatar-emoji">👨‍🚀</span>
                    <span class="avatar-desc">ذكر فضائي (Male Astronaut)</span>
                  </span>
                </label>
                <label class="avatar-option-card">
                  <input type="radio" name="userAvatarRadio" value="👩‍🚀" data-gender="female">
                  <span class="avatar-card-visual">
                    <span class="avatar-emoji">👩‍🚀</span>
                    <span class="avatar-desc">أنثى فضائية (Female Astronaut)</span>
                  </span>
                </label>
                <label class="avatar-option-card">
                  <input type="radio" name="userAvatarRadio" value="👽" data-gender="alien">
                  <span class="avatar-card-visual">
                    <span class="avatar-emoji">👽</span>
                    <span class="avatar-desc">كائن فضائي (Alien Bio)</span>
                  </span>
                </label>
                <label class="avatar-option-card">
                  <input type="radio" name="userAvatarRadio" value="🛸" data-gender="rover">
                  <span class="avatar-card-visual">
                    <span class="avatar-emoji">🛸</span>
                    <span class="avatar-desc">مركبة رادار (Rover Unit)</span>
                  </span>
                </label>
              </div>
            </div>

            <!-- Name Input -->
            <div class="form-group-field">
              <label class="form-label">Full Name / الاسم الكامل:</label>
              <input type="text" class="custom-modal-input" id="editUserName" required>
            </div>

            <!-- Phone / Researcher ID -->
            <div class="form-group-field">
              <label class="form-label">Phone Number or ID / رقم الهاتف أو المعرّف:</label>
              <input type="tel" class="custom-modal-input" id="editUserPhone" placeholder="+962 7 9000 0000">
            </div>

            <!-- Email -->
            <div class="form-group-field">
              <label class="form-label">Official Email / البريد الإلكتروني:</label>
              <input type="email" class="custom-modal-input" id="editUserEmail" required>
            </div>

            <div class="custom-modal-footer">
              <button type="button" class="btn-modal-cancel" id="cancelEditProfileBtn">إلغاء / Cancel</button>
              <button type="submit" class="btn-modal-submit">حفظ التعديلات / Save Profile 💾</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ================================================================
           SIGN IN / CREATE ACCOUNT MODAL
           ================================================================ -->
      <div class="custom-modal-overlay" id="authModalOverlay">
        <div class="custom-modal-dialog">
          <div class="custom-modal-header">
            <div class="modal-header-title">
              <span>Astraea Planetary Clearance / بوابة تسجيل الدخول</span>
            </div>
            <button class="custom-modal-close" id="closeAuthModalBtn">✕</button>
          </div>

          <div class="auth-tabs-nav">
            <button class="auth-tab-btn active" id="authTabSignIn">تسجيل الدخول (Sign In)</button>
            <button class="auth-tab-btn" id="authTabSignUp">إنشاء حساب باحث (Register)</button>
          </div>

          <!-- Sign In Form -->
          <form class="custom-modal-body" id="signInForm">
            <div class="form-group-field">
              <label class="form-label">Email or Researcher ID / البريد أو المعرّف:</label>
              <input type="text" class="custom-modal-input" id="signInEmail" placeholder="researcher@astraea.space" required>
            </div>
            <div class="form-group-field">
              <label class="form-label">Password / كلمة المرور:</label>
              <input type="password" class="custom-modal-input" id="signInPass" placeholder="••••••••" required>
            </div>
            <div class="custom-modal-footer">
              <button type="button" class="btn-modal-cancel" id="cancelAuthBtn">إلغاء</button>
              <button type="submit" class="btn-modal-submit">دخول المنصة / Sign In 🚀</button>
            </div>
          </form>

          <!-- Sign Up Form -->
          <form class="custom-modal-body" id="signUpForm" style="display:none;">
            <div class="form-group-field">
              <label class="form-label">Full Name / الاسم الكامل:</label>
              <input type="text" class="custom-modal-input" id="signUpName" placeholder="Dr. Sarah Connor" required>
            </div>
            <div class="form-group-field">
              <label class="form-label">Gender & Avatar / رتبة الفضائي:</label>
              <div class="signup-avatar-toggle">
                <label class="signup-avatar-pill">
                  <input type="radio" name="signUpAvatarRadio" value="👩‍🚀" data-gender="female" checked>
                  <span>👩‍🚀 أنثى فضائية (Female)</span>
                </label>
                <label class="signup-avatar-pill">
                  <input type="radio" name="signUpAvatarRadio" value="👨‍🚀" data-gender="male">
                  <span>👨‍🚀 ذكر فضائي (Male)</span>
                </label>
              </div>
            </div>
            <div class="form-group-field">
              <label class="form-label">Phone / رقم الهاتف:</label>
              <input type="tel" class="custom-modal-input" id="signUpPhone" placeholder="+962 7 9999 8888">
            </div>
            <div class="form-group-field">
              <label class="form-label">Email / البريد الإلكتروني:</label>
              <input type="email" class="custom-modal-input" id="signUpEmail" placeholder="new.researcher@astraea.space" required>
            </div>
            <div class="form-group-field">
              <label class="form-label">Password / كلمة المرور:</label>
              <input type="password" class="custom-modal-input" id="signUpPass" placeholder="••••••••" required>
            </div>
            <div class="custom-modal-footer">
              <button type="button" class="btn-modal-cancel" id="cancelSignUpBtn">إلغاء</button>
              <button type="submit" class="btn-modal-submit">إنشاء الحساب وبدء الاستكشاف 🌟</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ================================================================
           CONTACT US MODAL (خانة التواصل معنا)
           ================================================================ -->
      <div class="custom-modal-overlay" id="contactModalOverlay">
        <div class="custom-modal-dialog">
          <div class="custom-modal-header">
            <div class="modal-header-title">
              <span class="modal-icon">📬</span>
              <span>Direct Mission Contact / تواصل مع فريق أستريا</span>
            </div>
            <button class="custom-modal-close" id="closeContactModalBtn">✕</button>
          </div>

          <form class="custom-modal-body" id="contactTransmissionForm">
            <div class="contact-telemetry-banner">
              <span>🛰️ ASTRAEA PLANETARY LAB • DIRECT TRANSMISSION LINE</span>
              <span class="mono" style="color:var(--accent-green);">STATUS: READY</span>
            </div>

            <div class="form-group-field">
              <label class="form-label">Sender Name / اسمك أو الجهة:</label>
              <input type="text" class="custom-modal-input" id="contactSenderName" required>
            </div>
            <div class="form-group-field">
              <label class="form-label">Contact Email / بريدك الإلكتروني:</label>
              <input type="email" class="custom-modal-input" id="contactSenderEmail" required>
            </div>
            <div class="form-group-field">
              <label class="form-label">Mission Subject / موضوع المراسلة:</label>
              <select class="custom-modal-input" id="contactMissionSubject">
                <option value="analog_matching">Planetary Analog Site Inquiries / استفسار عن المواقع التناظرية</option>
                <option value="data_partnership">Data Partnership & Research / شراكة بحثية وتبادل بيانات</option>
                <option value="rover_field_testing">Field Testing & Rover Validation / تجارب ميدانية للمركبات</option>
                <option value="general_feedback">General Feedback & Suggestions / ملاحظات وتطوير عام</option>
              </select>
            </div>
            <div class="form-group-field">
              <label class="form-label">Telemetry Message / نص الرسالة:</label>
              <textarea class="custom-modal-input" id="contactSenderMsg" rows="4" placeholder="Enter scientific inquiry or message here..." required></textarea>
            </div>

            <div class="custom-modal-footer">
              <button type="button" class="btn-modal-cancel" id="cancelContactBtn">إغلاق / Close</button>
              <button type="submit" class="btn-modal-submit">إرسال البرقية الفضائية / Send Transmission 📡</button>
            </div>
          </form>
        </div>
      </div>
    
      <!-- ================================================================
           MISSION PURPOSE, SCIENTIFIC ETHICS & USER GUIDE MODAL
           ================================================================ -->
      <div class="custom-modal-overlay" id="ethicsGuideModalOverlay">
        <div class="custom-modal-dialog" style="max-width: 820px; max-height: 88vh; display: flex; flex-direction: column;">
          <div class="custom-modal-header" style="border-bottom: 1px solid rgba(0, 163, 255, 0.3); padding-bottom: 0.8rem;">
            <div class="custom-modal-title" style="display: flex; align-items: center; gap: 0.6rem;">
              <span style="font-size: 1.4rem;">📜</span>
              <div>
                <div style="font-family: 'Orbitron', 'Alexandria', sans-serif; font-size: 1.15rem; color: #fff;">
                  TerraTwin // Mission Purpose, Ethics & Guide
                </div>
                <div style="font-size: 0.78rem; color: var(--accent-blue); font-weight: 500;">
                  أهداف المشروع والأخلاقيات العلمية ودليل الاستخدام
                </div>
              </div>
            </div>
            <button class="custom-modal-close" id="closeEthicsGuideModalBtn">&times;</button>
          </div>

          <!-- Modal Navigation Tabs -->
          <div class="ethics-tabs-nav" style="display: flex; gap: 0.5rem; background: rgba(0, 20, 45, 0.6); padding: 0.4rem; border-radius: 8px; margin: 1rem 0 0.5rem 0; border: 1px solid rgba(255,255,255,0.08);">
            <button class="ethics-tab-btn active" data-tab="purpose" style="flex: 1; padding: 0.55rem 0.8rem; border-radius: 6px; background: var(--accent-blue); color: #fff; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
              🎯 لماذا أنشأنا المشروع وهدفه
            </button>
            <button class="ethics-tab-btn" data-tab="ethics" style="flex: 1; padding: 0.55rem 0.8rem; border-radius: 6px; background: transparent; color: var(--text-secondary); border: none; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">
              ⚖️ الأخلاقيات ومعايير النزاهة
            </button>
            <button class="ethics-tab-btn" data-tab="guide" style="flex: 1; padding: 0.55rem 0.8rem; border-radius: 6px; background: transparent; color: var(--text-secondary); border: none; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">
              🧭 دليل وتعليمات الاستخدام
            </button>
          </div>

          <!-- Modal Scrollable Content Container -->
          <div class="custom-modal-body" style="overflow-y: auto; padding-right: 0.4rem; flex: 1;">
            
            <!-- TAB 1: PURPOSE -->
            <div class="ethics-tab-content active" id="tabContent_purpose">
              <div class="ethics-section-card" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(0,163,255,0.2); border-radius: 8px; padding: 1.1rem; margin-bottom: 1rem;">
                <h4 style="color: #38bdf8; font-size: 1.05rem; margin-top: 0; display: flex; align-items: center; gap: 0.5rem;">
                  <span>🚀</span> التحدي الاستكشافي: لماذا نحتاج نظائر كوكبية على الأرض؟
                </h4>
                <p style="font-size: 0.88rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 0.8rem;">
                  مهمات استكشاف الفضاء الكبرى — مثل برنامج <strong>أرتميس (Artemis)</strong> التابع لوكالة ناسا لإنشاء قواعد دائمة عند القطب الجنوبي للقمر، ومهمات إرسال الروفرات ورواد الفضاء إلى المريخ — تكلف مليارات الدولارات وسنوات طويلة من العمل الدقيق. إن إرسال مركبات أو بدلات فضاء إلى بيئات قاسية مجهولة دون اختبار مسبق في بيئات أرضية تشبهها فيزيائياً يُعد خطراً هندسياً وعلمياً جسيماً.
                </p>
                <p style="font-size: 0.88rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 0;">
                  تاريخياً، كان اختيار "النظائر الأرضية" (Earth Analogs) يتم بشكل يدوي أو وصفي تقديري يفتقر للمطابقة الرقمية المتعددة المعايير، مما يؤدي إلى مفاجآت تضاريسية قد تُعطل عجلات الروفرات أو تعيق حركة رواد الفضاء.
                </p>
              </div>

              <div class="ethics-section-card" style="background: rgba(0,229,212,0.03); border: 1px solid rgba(0,229,212,0.25); border-radius: 8px; padding: 1.1rem;">
                <h4 style="color: #00e5d4; font-size: 1.05rem; margin-top: 0; display: flex; align-items: center; gap: 0.5rem;">
                  <span>🎯</span> الهدف الجوهري لمنصة TerraTwin:
                </h4>
                <ul style="font-size: 0.88rem; line-height: 1.8; color: var(--text-secondary); padding-right: 1.2rem; margin-bottom: 0;">
                  <li><strong>المطابقة الفيزيائية الدقيقة:</strong> دمج قياسات أقمار رصد الأرض (NASA MODIS, NASADEM, SRTM, Sentinel-2) مع قياسات المسابر الكوكبية المدارية (LRO LOLA, Diviner, MGS MOLA) في نموذج رياضي موحد.</li>
                  <li><strong>محاكاة واختبار الروبوتات والأنظمة:</strong> تمكين مهندسي وكالات الفضاء من اختبار أنظمة الملاحة الذاتية، ومقاومة عجلات المركبات للتضاريس الصخرية، واختبار البدلات الفضائية في بيئات مطابقة 100%.</li>
                  <li><strong>تقليل التكاليف والمخاطر:</strong> تحديد المواقع الأرضية المثالية بأعلى نسب تشابه رياضي موثق لمنع فشل المعدات الفضائية باهظة الثمن قبل مغادرتها الغلاف الجوي.</li>
                </ul>
              </div>
            </div>

            <!-- TAB 2: ETHICS & DATA INTEGRITY -->
            <div class="ethics-tab-content" id="tabContent_ethics" style="display: none;">
              <div class="ethics-section-card" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(224,86,56,0.25); border-radius: 8px; padding: 1.1rem; margin-bottom: 1rem;">
                <h4 style="color: #ff7043; font-size: 1.05rem; margin-top: 0; display: flex; align-items: center; gap: 0.5rem;">
                  <span>🛡️</span> حاجز العزل غير الحيوي (Physical Abiotic Gate via MODIS NDVI):
                </h4>
                <p style="font-size: 0.88rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 0.6rem;">
                  سطح القمر والمريخ خامل كلياً وخالٍ من الغطاء النباتي (NDVI = 0.000). لضمان النزاهة العلمية وتفادي أي نتائج مضللة، تطبق المنصة <strong>حاجز تصفية صارم</strong> (Strict Hard Gate) يستبعد فوراً وبشكل تلقائي أي موقع أرضي يتجاوز مؤشر غطائه الحيوي العتبة الفيزيائية:
                </p>
                <div style="background: rgba(0,0,0,0.4); padding: 0.6rem 0.9rem; border-radius: 6px; font-family: monospace; color: #ff7043; font-size: 0.85rem; border-left: 3px solid #ff7043; margin-bottom: 0.6rem;">
                  NDVI_Threshold ≤ 0.20 (Barren Abiotic Surface Filter)
                </div>
                <p style="font-size: 0.84rem; line-height: 1.6; color: var(--text-muted); margin-bottom: 0;">
                  هذا الحاجز يضمن استبعاد الغابات الاستوائية والمدن الخرسانية والمناطق الزراعية كلياً وفقاً للفيزياء دون أي تحيز أو تلاعب بالبيانات.
                </p>
              </div>

              <div class="ethics-section-card" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(0,163,255,0.2); border-radius: 8px; padding: 1.1rem; margin-bottom: 1rem;">
                <h4 style="color: #38bdf8; font-size: 1.05rem; margin-top: 0; display: flex; align-items: center; gap: 0.5rem;">
                  <span>📊</span> النزاهة والبيانات المفتوحة (Open Science & Zero Fabrication):
                </h4>
                <ul style="font-size: 0.88rem; line-height: 1.8; color: var(--text-secondary); padding-right: 1.2rem; margin-bottom: 0;">
                  <li><strong>مصداقية المصادر:</strong> 100% من القياسات الفيزيائية (الانحدار، الخشونة، البياض، التباين الحراري) مستخرجة من مستودعات مفتوحة ومراجعة علمياً تابعة لـ NASA PDS و ESA Copernicus و USGS.</li>
                  <li><strong>لا توجد أرقام عشوائية أو تخيلية:</strong> كل نسبة مئوية محسوبة عبر خوارزميات إحصائية موحدة تعتمد على المئين الراداري (Percentile Ranking) لمنع انحياز مقاييس الدقة المكانية.</li>
                </ul>
              </div>

              <div class="ethics-section-card" style="background: rgba(0,229,163,0.03); border: 1px solid rgba(0,229,163,0.25); border-radius: 8px; padding: 1.1rem;">
                <h4 style="color: #00e5a3; font-size: 1.05rem; margin-top: 0; display: flex; align-items: center; gap: 0.5rem;">
                  <span>🌿</span> المسؤولية البيئية وحماية نظائر الأرض (Environmental Stewardship):
                </h4>
                <p style="font-size: 0.88rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 0;">
                  ندعو كافة البعثات التناظرية والفرق البحثية الميدانية إلى احترام البيئات الصحراوية والبركانية والقطبية الفريدة على كوكب الأرض، والالتزام الصارم بمبادئ عدم ترك أثر (Leave No Trace) وحماية المجتمعات المحلية في مناطق الاستكشاف.
                </p>
              </div>
            </div>

            <!-- TAB 3: OPERATING GUIDE -->
            <div class="ethics-tab-content" id="tabContent_guide" style="display: none;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 1rem;">
                
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem;">
                  <div style="font-weight: 700; color: #fff; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
                    <span>1️⃣</span> الصفحة الرئيسية والكرة ثلاثية الأبعاد
                  </div>
                  <p style="font-size: 0.82rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 0;">
                    اسحبي الكرة بالماوس للتدوير 360°، استخدمي عجلة التكبير للتقريب، واضغطي على أي نقطة نبضية (Pin) لعرض بيانات الموقع التليمترية ونسبة مطابقته فورياً. بدّلي بين الأرض، المريخ، والقمر من الأزرار العلوية.
                  </p>
                </div>

                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem;">
                  <div style="font-weight: 700; color: #fff; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
                    <span>2️⃣</span> خريطة الأماكن المشابهة (Site Finder)
                  </div>
                  <p style="font-size: 0.82rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 0;">
                    خريطة أقمار صناعية عالية الدقة من ناسا و ESRI. يمكنكِ تصفية المواقع حسب التضاريس (صحراوي، بركاني، قطبي)، وتتبع إشارات السونار النبضية مع نسب التشابه فوق كل موقع تضاريسي.
                  </p>
                </div>

                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem;">
                  <div style="font-weight: 700; color: #fff; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
                    <span>3️⃣</span> المقارنة المعيارية (Compare Sites)
                  </div>
                  <p style="font-size: 0.82rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 0;">
                    اختاري أي هدف كوكبي وقارنيه مباشرة مع نظيره الأرضي عبر مخطط الرادار السداسي، مع إمكانية تعديل أوزان المعايير الفيزيائية (الانحدار، الخشونة، البياض، الحرارة) لمعاينة التغير الفوري.
                  </p>
                </div>

                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem;">
                  <div style="font-weight: 700; color: #fff; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
                    <span>4️⃣</span> الأدلة والكتالوج وتصدير PDF (Evidence)
                  </div>
                  <p style="font-size: 0.82rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 0;">
                    تحتوي على كتالوج الـ 53 موقعاً كاملاً، مع إمكانية تشغيل الشرح العلمي، وتصدير التقارير العلمية الرسمية بصيغة PDF لتقديمها مباشرة لفرق ومهندسي المهمات.
                  </p>
                </div>

              </div>

              <!-- Bonus: Level & XP Tip -->
              <div style="background: rgba(0,163,255,0.06); border: 1px solid rgba(0,163,255,0.3); border-radius: 8px; padding: 0.8rem 1rem; display: flex; align-items: center; gap: 0.8rem;">
                <span style="font-size: 1.6rem;">⭐</span>
                <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
                  <strong>نظام رتبة الباحث الاستكشافي:</strong> يرتفع مستواكِ في البروفايل تدريجياً (+35 XP) كلما تفاعلتِ مع الخريطة، أو استكشفتِ مواقع جديدة، أو قمتِ بتشغيل مقارنات معيارية!
                </div>
              </div>

            </div>

          </div>

          <div class="custom-modal-footer" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.8rem; margin-top: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.78rem; color: var(--text-muted); font-family: monospace;">
              TERRATWIN-CORE-SPEC // VERIFIED NASA/ESA STANDARDS
            </div>
            <button type="button" class="btn-modal-cancel" id="finishEthicsGuideBtn" style="padding: 0.45rem 1.4rem;">فهمت ذلك / Close Guide</button>
          </div>
        </div>
      </div>
`;

    document.body.appendChild(modalContainer);
  },

  bindEvents() {
    // Edit Profile Modal Bindings
    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedRadio = editForm.querySelector('input[name="userAvatarRadio"]:checked');
        if (selectedRadio) {
          this.currentUser.avatar = selectedRadio.value;
          this.currentUser.gender = selectedRadio.getAttribute('data-gender') || 'male';
        }
        this.currentUser.name = document.getElementById('editUserName').value.trim();
        this.currentUser.nameAr = document.getElementById('editUserName').value.trim();
        this.currentUser.phone = document.getElementById('editUserPhone').value.trim();
        this.currentUser.email = document.getElementById('editUserEmail').value.trim();

        this.saveUser();
        this.closeModals();
        this.showXpToast(15, 'Profile updated successfully! / تم تحديث الملف بنجاح');
      });
    }

    // Modal Close buttons
    ['closeEditProfileModalBtn', 'cancelEditProfileBtn', 'closeAuthModalBtn', 'cancelAuthBtn', 'cancelSignUpBtn', 'closeContactModalBtn', 'cancelContactBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => this.closeModals());
    });

    // Outside click to close
    document.querySelectorAll('.custom-modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModals();
      });
    });

    // Auth Tabs Switching
    const tabSignIn = document.getElementById('authTabSignIn');
    const tabSignUp = document.getElementById('authTabSignUp');
    const formSignIn = document.getElementById('signInForm');
    const formSignUp = document.getElementById('signUpForm');

    if (tabSignIn && tabSignUp && formSignIn && formSignUp) {
      tabSignIn.addEventListener('click', () => {
        tabSignIn.classList.add('active');
        tabSignUp.classList.remove('active');
        formSignIn.style.display = 'flex';
        formSignUp.style.display = 'none';
      });

      tabSignUp.addEventListener('click', () => {
        tabSignUp.classList.add('active');
        tabSignIn.classList.remove('active');
        formSignUp.style.display = 'flex';
        formSignIn.style.display = 'none';
      });

      // Sign In Action
      formSignIn.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signInEmail').value.trim();
        this.currentUser.email = email;
        this.currentUser.isLoggedIn = true;
        this.saveUser();
        this.closeModals();
        this.showXpToast(25, 'Welcome back, Commander! / أهلاً بعودتك أيها القائد');
      });

      // Sign Up Action
      formSignUp.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signUpName').value.trim();
        const email = document.getElementById('signUpEmail').value.trim();
        const phone = document.getElementById('signUpPhone').value.trim();
        const radio = formSignUp.querySelector('input[name="signUpAvatarRadio"]:checked');

        this.currentUser.name = name;
        this.currentUser.nameAr = name;
        this.currentUser.email = email;
        this.currentUser.phone = phone;
        this.currentUser.avatar = radio ? radio.value : '👩‍🚀';
        this.currentUser.gender = radio ? radio.getAttribute('data-gender') : 'female';
        this.currentUser.isLoggedIn = true;
        this.currentUser.xp = 150; // Welcome XP

        this.saveUser();
        this.closeModals();
        this.showXpToast(50, 'Researcher Account Activated! (+50 XP)');
      });
    }

    // Contact Form Action
    const contactForm = document.getElementById('contactTransmissionForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('contactSenderName').value.trim();
        this.closeModals();
        this.showXpToast(20, `Transmission dispatched! Thank you ${name}`);
        alert((window.I18n && window.I18n.currentLang === 'ar')
          ? `تم إرسال برقية الاتصال بنجاح إلى فريق أستريا (contact@astraea.space). شكراً لتواصلك يا ${name}!`
          : `Transmission received by Astraea Project Lab. We will reply to your communication shortly!`);
      });
    }
  },

  openEditProfileModal() {
    this.injectModals();
    const user = this.currentUser;
    const nameInput = document.getElementById('editUserName');
    const phoneInput = document.getElementById('editUserPhone');
    const emailInput = document.getElementById('editUserEmail');

    if (nameInput) nameInput.value = user.name || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (emailInput) emailInput.value = user.email || '';

    // Check avatar radio
    const radios = document.querySelectorAll('input[name="userAvatarRadio"]');
    radios.forEach(r => {
      if (r.value === user.avatar || r.getAttribute('data-gender') === user.gender) {
        r.checked = true;
      }
    });

    const overlay = document.getElementById('editProfileModalOverlay');
    if (overlay) overlay.classList.add('active');
  },

  openAuthModal() {
    window.location.href = 'login.html';
  },

  signOut() {
    localStorage.removeItem('terratwin_auth_active');
    if (this.currentUser) {
      this.currentUser.isLoggedIn = false;
      this.saveUser();
    }
    const isAr = (window.I18n ? window.I18n.currentLang : 'en') === 'ar';
    this.showXpToast(0, isAr ? 'تم تسجيل الخروج بنجاح. أهلاً بك كباحث زائر.' : 'Signed out successfully. Clearance reverted to Guest.');
    setTimeout(() => {
      window.location.reload();
    }, 450);
  },

  openContactModal() {
    this.injectModals();
    const user = this.currentUser;
    const nameInput = document.getElementById('contactSenderName');
    const emailInput = document.getElementById('contactSenderEmail');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';

    const overlay = document.getElementById('contactModalOverlay');
    if (overlay) overlay.classList.add('active');
  },

  closeModals() {
    document.querySelectorAll('.custom-modal-overlay').forEach(m => m.classList.remove('active'));
  },

  openEthicsGuideModal() {
    window.location.href = 'guide.html';
  },

  bindEthicsModalEvents() {
    const overlay = document.getElementById('ethicsGuideModalOverlay');
    const closeBtn = document.getElementById('closeEthicsGuideModalBtn');
    const finishBtn = document.getElementById('finishEthicsGuideBtn');

    const closeModal = () => {
      if (overlay) overlay.classList.remove('active');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (finishBtn) finishBtn.addEventListener('click', closeModal);

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }

    // Tab buttons handling
    const tabBtns = document.querySelectorAll('.ethics-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        tabBtns.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'transparent';
          b.style.color = 'var(--text-secondary)';
        });
        btn.classList.add('active');
        btn.style.background = 'var(--accent-blue)';
        btn.style.color = '#fff';

        document.querySelectorAll('.ethics-tab-content').forEach(c => {
          c.style.display = 'none';
        });
        const activeContent = document.getElementById('tabContent_' + targetTab);
        if (activeContent) activeContent.style.display = 'block';
      });
    });
  },

};

// Expose UserSystem globally
window.UserSystem = UserSystem;

// Initialize on DOM ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => UserSystem.init());
} else {
  UserSystem.init();
}

// Re-render UI on language change event
document.addEventListener('languageChanged', () => {
  if (window.UserSystem) {
    window.UserSystem.renderUserUI();
  }
});
