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
    isLoggedIn: true,
    name: 'Dr. Researcher',
    nameAr: 'د. باحث',
    phone: '+962 7 9000 0000',
    email: 'researcher@astraea.space',
    gender: 'female', // 'male' or 'female'
    avatar: '👩‍🚀', // 👩‍🚀 female astronaut, 👨‍🚀 male astronaut, 👽 alien, 🛸 rover
    xp: 220,
    discoveredSites: ['atacama_yungay', 'antarctica_dryvalleys'],
    role: 'ASTRAEA LAB',
    clearance: 'LEVEL-4 ACCESS'
  },

  currentUser: null,

  init() {
    this.loadUser();
    this.injectModals();
    this.renderUserUI();
    this.bindEvents();
  },

  loadUser() {
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
  },

  saveUser() {
    localStorage.setItem('terratwin_user_profile', JSON.stringify(this.currentUser));
    this.renderUserUI();
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
    if (!this.currentUser.discoveredSites) {
      this.currentUser.discoveredSites = [];
    }
    if (!this.currentUser.discoveredSites.includes(siteId)) {
      this.currentUser.discoveredSites.push(siteId);
      this.addXP(35, `Explored new analog site: ${siteName}`, `اكتشاف موقع تناظري جديد: ${siteName}`);
    }
  },

  showXpToast(amount, reason) {
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

    // 1. Update Navbar Profile Button
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
      xpBlock.innerHTML = `
        <div class="xp-progress-header">
          <span class="xp-level-tag">LEVEL ${lvl.level}: ${isAr ? lvl.titleAr : lvl.titleEn}</span>
          <span class="xp-score-tag">${currentXp} XP</span>
        </div>
        <div class="xp-bar-track">
          <div class="xp-bar-fill" style="width: ${progressPercent}%;"></div>
        </div>
        <div class="xp-stats-footer">
          <span>${isAr ? 'المواقع المكتشفة:' : 'Discovered:'} <strong>${(user.discoveredSites || []).length}</strong></span>
          <span>${isAr ? 'المستوى القادم:' : 'Next Level:'} <strong>${nextLvl.maxXp} XP</strong></span>
        </div>
      `;
    }

    // Add Edit Profile Button in Dropdown if not present
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

        // Sign Out / In button
        const authBtn = document.createElement('button');
        authBtn.id = 'userProfileAuthTriggerBtn';
        authBtn.className = 'user-dropdown-action-btn auth-toggle';
        authBtn.innerHTML = `🔐 <span data-i18n="nav.sign_out">${isAr ? 'تسجيل الخروج' : 'Sign Out / Switch'}</span>`;
        authBtn.addEventListener('click', () => {
          document.querySelectorAll('.user-profile-dropdown').forEach(d => d.classList.remove('open'));
          this.openAuthModal();
        });
        linksContainer.appendChild(authBtn);
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
              <span class="modal-icon">🔐</span>
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
    this.injectModals();
    const overlay = document.getElementById('authModalOverlay');
    if (overlay) overlay.classList.add('active');
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
  }
};

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  UserSystem.init();
});
