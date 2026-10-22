/**
 * TerraTwin - Mission Profile & Weights Manager
 *
 * The 4 criteria come from the real dataset (final data.xlsx):
 *   slope     -> slope_percentile
 *   roughness -> roughness_percentile
 *   albedo    -> albedo_norm
 *   thermal   -> temp_swing_norm   (Mars only — excluded on the Moon, see Notes sheet)
 *
 * Profiles are just preset weights. "TASI Baseline" = the team's published
 * method (equal weights). Weights are edited only inside the header badge dropdown.
 * Persists in localStorage and fires a 'profileChanged' event.
 */

const MissionProfileManager = {
  CRITERIA: ['slope', 'roughness', 'albedo', 'thermal'],
  STORAGE_PROFILE: 'terratwin_profile_v2',
  STORAGE_WEIGHTS: 'terratwin_weights_v2_',

  activeProfile: 'tasi',
  weights: { slope: 0.25, roughness: 0.25, albedo: 0.25, thermal: 0.25 },

  defaultProfileWeights: {
    tasi:    { slope: 0.25, roughness: 0.25, albedo: 0.25, thermal: 0.25 },
    rover:   { slope: 0.35, roughness: 0.40, albedo: 0.10, thermal: 0.15 },
    landing: { slope: 0.45, roughness: 0.35, albedo: 0.10, thermal: 0.10 },
    thermal: { slope: 0.20, roughness: 0.15, albedo: 0.15, thermal: 0.50 },
    optics:  { slope: 0.15, roughness: 0.15, albedo: 0.55, thermal: 0.15 }
  },

  // Profiles that only make sense for one body (thermal swing is not used on the Moon)
  profileBodies: {
    tasi: ['moon', 'mars'],
    rover: ['moon', 'mars'],
    landing: ['moon', 'mars'],
    thermal: ['mars'],
    optics: ['moon', 'mars']
  },

  profileLabels: {
    en: {
      tasi: 'TASI Baseline',
      rover: 'Rover Traverse',
      landing: 'Landing Site',
      thermal: 'Habitat & Thermal',
      optics: 'Optics & Solar'
    },
    ar: {
      tasi: 'المعيار الأساسي TASI',
      rover: 'تنقّل المركبة',
      landing: 'موقع الهبوط',
      thermal: 'الموئل والحرارة',
      optics: 'البصريات والطاقة الشمسية'
    }
  },

  criteriaLabels: {
    en: { slope: 'Slope', roughness: 'Roughness', albedo: 'Albedo (brightness)', thermal: 'Thermal Swing' },
    ar: { slope: 'الانحدار', roughness: 'الخشونة', albedo: 'السطوع (الألبيدو)', thermal: 'فرق الحرارة' }
  },

  uiText: {
    en: { title: 'Mission Profile', weights: 'Criteria Weights', reset: 'Reset Defaults' },
    ar: { title: 'نوع المهمة', weights: 'أوزان المعايير', reset: 'إعادة الضبط' }
  },

  lang() {
    return (window.I18n ? window.I18n.currentLang : 'en') === 'ar' ? 'ar' : 'en';
  },

  label(profileId) {
    const l = this.profileLabels[this.lang()];
    return (l && l[profileId]) || profileId;
  },

  loadWeights(profileId) {
    try {
      const saved = JSON.parse(localStorage.getItem(this.STORAGE_WEIGHTS + profileId));
      if (saved && this.CRITERIA.every(k => typeof saved[k] === 'number')) return saved;
    } catch (e) { /* ignore */ }
    return { ...this.defaultProfileWeights[profileId] };
  },

  init() {
    let saved = null;
    try { saved = localStorage.getItem(this.STORAGE_PROFILE); } catch (e) { /* ignore */ }
    this.activeProfile = this.defaultProfileWeights[saved] ? saved : 'tasi';
    this.weights = this.loadWeights(this.activeProfile);

    this.renderProfileUI();
    this.bindEvents();
  },

  setProfile(profileId, resetToDefaults = false) {
    if (!this.defaultProfileWeights[profileId]) return;
    this.activeProfile = profileId;
    try { localStorage.setItem(this.STORAGE_PROFILE, profileId); } catch (e) { /* ignore */ }

    if (resetToDefaults) {
      this.weights = { ...this.defaultProfileWeights[profileId] };
      try { localStorage.removeItem(this.STORAGE_WEIGHTS + profileId); } catch (e) { /* ignore */ }
    } else {
      this.weights = this.loadWeights(profileId);
    }

    this.renderProfileUI();
    this.dispatchChangeEvent();
  },

  setWeight(key, val) {
    this.weights[key] = parseFloat(val);
    try { localStorage.setItem(this.STORAGE_WEIGHTS + this.activeProfile, JSON.stringify(this.weights)); } catch (e) { /* ignore */ }
    this.updateWeightReadouts();
    this.dispatchChangeEvent();
  },

  resetCurrentWeights() {
    this.setProfile(this.activeProfile, true);
  },

  // Hide profiles that don't apply to the chosen body (used by the Site Finder page)
  setAvailableForBody(body) {
    document.querySelectorAll('.profile-option-btn').forEach(btn => {
      const id = btn.getAttribute('data-profile');
      const ok = !body || (this.profileBodies[id] || []).includes(body);
      btn.style.display = ok ? '' : 'none';
    });
    const thermalGroup = document.getElementById('weightGroup_thermal');
    if (thermalGroup) thermalGroup.style.display = body === 'moon' ? 'none' : '';

    if (body && !(this.profileBodies[this.activeProfile] || []).includes(body)) {
      this.setProfile('tasi', false);
    }
  },

  renderProfileUI() {
    const lang = this.lang();

    const labelEl = document.getElementById('activeProfileLabel');
    if (labelEl) labelEl.textContent = this.label(this.activeProfile);
    const missionEl = document.getElementById('userProfileActiveMission');
    if (missionEl) missionEl.textContent = this.label(this.activeProfile);

    document.querySelectorAll('.profile-option-btn').forEach(btn => {
      const id = btn.getAttribute('data-profile');
      btn.textContent = this.label(id);
      btn.classList.toggle('active', id === this.activeProfile);
    });

    this.CRITERIA.forEach(key => {
      const el = document.getElementById(`weightLabel_${key}`);
      if (el) el.textContent = this.criteriaLabels[lang][key];
    });

    const t = this.uiText[lang];
    const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    setText('profilePanelTitle', t.title);
    setText('weightsSectionTitle', t.weights);
    setText('resetWeightsBtn', t.reset);

    this.updateWeightReadouts();
  },

  updateWeightReadouts() {
    for (const [key, val] of Object.entries(this.weights)) {
      const slider = document.getElementById(`weightSlider_${key}`);
      const readout = document.getElementById(`weightVal_${key}`);
      const pctStr = `${Math.round(val * 100)}%`;
      if (slider) slider.value = val;
      if (readout) readout.textContent = pctStr;
    }
  },

  dispatchChangeEvent() {
    const detail = { profile: this.activeProfile, weights: { ...this.weights } };
    document.dispatchEvent(new CustomEvent('profileChanged', { detail }));
    document.dispatchEvent(new CustomEvent('missionProfileChanged', { detail }));
  },

  /**
   * TASI similarity (the team's method, reproduced exactly from final data.xlsx):
   *   score = 100 * (1 - sqrt( Σ w_k (earth_k - target_k)^2 / Σ w_k ))
   * Features are already normalised 0..1. On the Moon, thermal is excluded.
   * Returns { score, perCriterion: {key: 0..100}, keys }.
   */
  calculateTASI(earthF, targetF, body, weights = this.weights) {
    const keys = body === 'moon' ? ['slope', 'roughness', 'albedo'] : this.CRITERIA;
    let sumW = 0, sumSq = 0;
    const perCriterion = {};
    keys.forEach(k => {
      const d = Math.abs((earthF[k] || 0) - (targetF[k] || 0));
      perCriterion[k] = (1 - d) * 100;
      const w = weights[k] || 0;
      sumW += w;
      sumSq += w * d * d;
    });
    const rms = sumW > 0 ? Math.sqrt(sumSq / sumW) : 1;
    return { score: Math.max(0, (1 - rms) * 100), perCriterion, keys };
  },

  /**
   * Legacy score for pages that still use the old demo data (Home / Compare).
   * Maps the new weights onto the old radar parameters so those pages keep working.
   */
  calculateScore(radarParams) {
    if (!radarParams) return 80.0;
    const w = this.weights;
    const slope = radarParams.slope || 80;
    const rough = radarParams.regolith || 80;
    const albedo = radarParams.mineralogy || 80;
    const thermal = radarParams.thermal || 80;
    const total = (w.slope + w.roughness + w.albedo + w.thermal) || 1.0;
    const raw = (slope * w.slope + rough * w.roughness + albedo * w.albedo + thermal * w.thermal) / total;
    return Math.min(99.4, Math.max(50.0, raw));
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
        this.setProfile(e.currentTarget.getAttribute('data-profile'), false);
      });
    });

    this.CRITERIA.forEach(key => {
      const slider = document.getElementById(`weightSlider_${key}`);
      if (slider) {
        slider.addEventListener('input', (e) => this.setWeight(key, e.target.value));
      }
    });

    const resetBtn = document.getElementById('resetWeightsBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => this.resetCurrentWeights());

    document.addEventListener('languageChanged', () => this.renderProfileUI());
  }
};

window.MissionProfileManager = MissionProfileManager;
