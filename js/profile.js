/**
 * TerraTwin - Mission Profile & Weights Manager
 * Profiles: rover, base, isru, caves
 * Internal weights sliders editable exclusively inside profile badge dropdown.
 * Persists in localStorage and fires dynamic profileChanged event.
 */

const MissionProfileManager = {
  activeProfile: 'rover',
  weights: {
    slope: 0.35,
    ice: 0.10,
    regolith: 0.40,
    volcanic: 0.15
  },

  defaultProfileWeights: {
    rover: { slope: 0.35, ice: 0.10, regolith: 0.40, volcanic: 0.15 },
    base: { slope: 0.25, ice: 0.35, regolith: 0.25, volcanic: 0.15 },
    isru: { slope: 0.15, ice: 0.45, regolith: 0.30, volcanic: 0.10 },
    caves: { slope: 0.20, ice: 0.05, regolith: 0.15, volcanic: 0.60 }
  },

  profileLabels: {
    en: {
      rover: 'Rover Testing',
      base: 'Human Base',
      isru: 'ISRU Resources',
      caves: 'Lava Tube Shelters'
    },
    ar: {
      rover: 'اختبار المركبات',
      base: 'القواعد البشرية',
      isru: 'استغلال الموارد',
      caves: 'ملاجئ الأنابيب'
    }
  },

  init() {
    this.activeProfile = localStorage.getItem('terratwin_profile') || 'rover';
    const savedWeights = localStorage.getItem('terratwin_weights_' + this.activeProfile);
    if (savedWeights) {
      try {
        this.weights = JSON.parse(savedWeights);
      } catch (e) {
        this.weights = { ...this.defaultProfileWeights[this.activeProfile] };
      }
    } else {
      this.weights = { ...this.defaultProfileWeights[this.activeProfile] };
    }

    this.renderProfileUI();
    this.bindEvents();
  },

  setProfile(profileId, resetToDefaults = false) {
    if (!this.defaultProfileWeights[profileId]) return;
    this.activeProfile = profileId;
    localStorage.setItem('terratwin_profile', profileId);

    if (resetToDefaults) {
      this.weights = { ...this.defaultProfileWeights[profileId] };
      localStorage.removeItem('terratwin_weights_' + profileId);
    } else {
      const saved = localStorage.getItem('terratwin_weights_' + profileId);
      if (saved) {
        try { this.weights = JSON.parse(saved); }
        catch (e) { this.weights = { ...this.defaultProfileWeights[profileId] }; }
      } else {
        this.weights = { ...this.defaultProfileWeights[profileId] };
      }
    }

    this.renderProfileUI();
    this.dispatchChangeEvent();
  },

  setWeight(key, val) {
    this.weights[key] = parseFloat(val);
    localStorage.setItem('terratwin_weights_' + this.activeProfile, JSON.stringify(this.weights));
    this.updateWeightReadouts();
    this.dispatchChangeEvent();
  },

  resetCurrentWeights() {
    this.setProfile(this.activeProfile, true);
  },

  renderProfileUI() {
    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const label = this.profileLabels[lang] ? this.profileLabels[lang][this.activeProfile] : this.activeProfile;

    const labelEl = document.getElementById('activeProfileLabel');
    if (labelEl) labelEl.textContent = label;

    // Update active button state in dropdown
    document.querySelectorAll('.profile-option-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-profile') === this.activeProfile);
    });

    this.updateWeightReadouts();
  },

  updateWeightReadouts() {
    for (const [key, val] of Object.entries(this.weights)) {
      const slider = document.getElementById(`weightSlider_${key}`);
      const readout = document.getElementById(`weightVal_${key}`);
      const miniReadout = document.getElementById(`miniWeight_${key}`);
      const pctStr = `${Math.round(val * 100)}%`;
      if (slider) slider.value = val;
      if (readout) readout.textContent = pctStr;
      if (miniReadout) miniReadout.textContent = pctStr;
    }
  },

  dispatchChangeEvent() {
    document.dispatchEvent(new CustomEvent('profileChanged', {
      detail: {
        profile: this.activeProfile,
        weights: { ...this.weights }
      }
    }));
  },

  calculateScore(radarParams) {
    if (!radarParams) return 80.0;
    const w = this.weights;
    const slope = radarParams.slope || 80;
    const ice = radarParams.radiation || 80; // or thermal proxy
    const regolith = radarParams.regolith || 80;
    const volcanic = radarParams.mineralogy || 80;

    const totalWeight = (w.slope + w.ice + w.regolith + w.volcanic) || 1.0;
    const rawScore = (slope * w.slope + ice * w.ice + regolith * w.regolith + volcanic * w.volcanic) / totalWeight;
    return Math.min(99.4, Math.max(50.0, rawScore));
  },

  bindEvents() {
    const badgeBtn = document.getElementById('profileBadgeBtn');
    const panel = document.getElementById('profileDropdownPanel');

    if (badgeBtn && panel) {
      badgeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = panel.classList.contains('show');
        panel.classList.toggle('show', !isOpen);
        badgeBtn.classList.toggle('open', !isOpen);
      });

      document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !badgeBtn.contains(e.target)) {
          panel.classList.remove('show');
          badgeBtn.classList.remove('open');
        }
      });
    }

    document.querySelectorAll('.profile-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prof = e.currentTarget.getAttribute('data-profile');
        this.setProfile(prof, false);
      });
    });

    ['slope', 'ice', 'regolith', 'volcanic'].forEach(key => {
      const slider = document.getElementById(`weightSlider_${key}`);
      if (slider) {
        slider.addEventListener('input', (e) => {
          this.setWeight(key, e.target.value);
        });
      }
    });

    const resetBtn = document.getElementById('resetWeightsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetCurrentWeights());
    }

    document.addEventListener('languageChanged', () => {
      this.renderProfileUI();
    });
  }
};

window.MissionProfileManager = MissionProfileManager;
