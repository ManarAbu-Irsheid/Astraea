/**
 * TerraTwin - Page 4: Evidence & Method Controller
 * Redesigned Modern Dark Analytics Dashboard for Section 2
 * Compact horizontal KPI cards with SVG rings, scale 50%-100% ranking bar chart,
 * stacked status & base weights donuts, MathML formula banner, and diverging sensitivity matrix.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await window.App.init('evidence');

  const [validationData, cellsData] = await Promise.all([
    window.App.fetchData('validation'),
    window.App.fetchData('cells')
  ]);

  if (!validationData) {
    console.error('Validation data missing for Evidence page');
    return;
  }

  EvidenceController.init(validationData, cellsData);
});

const EvidenceController = {
  data: null,
  cells: [],
  catalogItems: [],
  catalogSortCol: 'name',
  catalogSortAsc: true,
  selectedRank: 1, // Default selected rank for Site Details card
  activeBodyFilter: 'all', // 'all', 'moon', 'mars', 'earth'

  init(validationData, cellsData) {
    this.data = validationData;
    this.cells = cellsData ? (cellsData.cells || []) : [];
    this.catalogItems = [...(validationData.data_catalog || [])];

    // Register translation keys for video fallback, sensitivity, and data catalog
    if (window.I18n && window.I18n.translations) {
      const tr = window.I18n.translations;
      if (tr.en) {
        tr.en.evidence = tr.en.evidence || {};
        tr.en.evidence.video_coming_soon = tr.en.evidence.video_coming_soon || 'Demo video coming soon';
        tr.en.evidence.site_details_title = tr.en.evidence.site_details_title || 'Site Details';
        tr.en.evidence.chip_all = tr.en.evidence.chip_all || 'All';
        tr.en.evidence.chip_moon = tr.en.evidence.chip_moon || 'Moon';
        tr.en.evidence.chip_mars = tr.en.evidence.chip_mars || 'Mars';
        tr.en.evidence.chip_earth = tr.en.evidence.chip_earth || 'Earth';
      }
      if (tr.ar) {
        tr.ar.evidence = tr.ar.evidence || {};
        tr.ar.evidence.video_coming_soon = tr.ar.evidence.video_coming_soon || 'الفيديو التوضيحي قريباً';
        tr.ar.evidence.site_details_title = tr.ar.evidence.site_details_title || 'تفاصيل الموقع';
        tr.ar.evidence.chip_all = tr.ar.evidence.chip_all || 'الكل';
        tr.ar.evidence.chip_moon = tr.ar.evidence.chip_moon || 'القمر';
        tr.ar.evidence.chip_mars = tr.ar.evidence.chip_mars || 'المريخ';
        tr.ar.evidence.chip_earth = tr.ar.evidence.chip_earth || 'الأرض';
      }
    }

    this.initVideoPlayer();
    this.renderKpiStrip();
    this.renderValidationRankPlot();
    this.renderDonuts();
    this.renderSiteDetails();
    this.renderHeatmap();
    this.renderBoxplot();
    this.renderHistogram();
    this.setupChartAnimations();
    this.renderSensitivityMatrix();
    this.renderDataCatalogTable();
    this.renderRoadmap();

    this.bindEvents();

    document.addEventListener('languageChanged', () => {
      this.renderKpiStrip();
      this.renderValidationRankPlot();
      this.renderDonuts();
      this.renderSiteDetails();
      this.renderHeatmap();
      this.renderBoxplot();
      this.renderHistogram();
      this.renderSensitivityMatrix();
      this.renderDataCatalogTable();
      this.renderRoadmap();

      const fallbackTitle = document.querySelector('#videoFallbackOverlay .video-fallback-title');
      if (fallbackTitle) {
        const isAr = (window.I18n ? window.I18n.currentLang : 'en') === 'ar';
        fallbackTitle.textContent = isAr ? 'الفيديو التوضيحي قريباً' : 'Demo video coming soon';
      }

      const muteBtn = document.getElementById('videoMuteBtn');
      const video = document.getElementById('demoVideo');
      if (muteBtn && video) {
        const isAr = (window.I18n ? window.I18n.currentLang : 'en') === 'ar';
        const isMuted = video.muted;
        const label = isMuted 
          ? (isAr ? 'تشغيل الصوت' : 'Unmute video') 
          : (isAr ? 'كتم الصوت' : 'Mute video');
        muteBtn.setAttribute('aria-label', label);
        muteBtn.setAttribute('title', label);
      }
    });
  },

  /* ==========================================================================
     SECTION 1: HERO VIDEO DEMONSTRATION
     ========================================================================== */
  initVideoPlayer() {
    const video = document.getElementById('demoVideo');
    const playerContainer = document.getElementById('videoResponsiveWrapper');
    const muteBtn = document.getElementById('videoMuteBtn');
    if (!video) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 8. Under prefers-reduced-motion: do not autoplay; show normal play button
    if (prefersReduced) {
      video.autoplay = false;
      video.removeAttribute('autoplay');
      video.pause();
    } else {
      video.autoplay = true;
      video.muted = true;
      video.play().catch(() => {
        // Autoplay may be restricted by browser until user interaction
      });
    }

    // 6. Round mute/unmute button logic
    let userManuallyMuted = false;

    const updateMuteBtn = () => {
      if (!muteBtn) return;
      const lang = window.I18n ? window.I18n.currentLang : 'en';
      const isAr = lang === 'ar';
      const isMuted = video.muted;

      const label = isMuted 
        ? (isAr ? 'تشغيل الصوت' : 'Unmute video') 
        : (isAr ? 'كتم الصوت' : 'Mute video');

      muteBtn.setAttribute('aria-label', label);
      muteBtn.setAttribute('title', label);
      muteBtn.innerHTML = `<span class="mute-icon" aria-hidden="true">${isMuted ? '🔇' : '🔊'}</span>`;
      muteBtn.classList.toggle('is-muted', isMuted);
    };

    // 9. Unmute automatically on user's first click or key press anywhere on the page (one time only)
    const removeFirstInteractionListeners = () => {
      document.removeEventListener('click', handleFirstInteraction, true);
      document.removeEventListener('keydown', handleFirstInteraction, true);
    };

    const handleFirstInteraction = (e) => {
      removeFirstInteractionListeners();

      // If user clicked the mute button directly, let the button click handler control state
      if (muteBtn && (muteBtn === e.target || muteBtn.contains(e.target))) {
        return;
      }

      // If the user already muted it with the button, do not unmute
      if (userManuallyMuted) {
        return;
      }

      if (video.muted) {
        video.muted = false;
        video.play().catch(() => {});
        updateMuteBtn();
      }
    };

    document.addEventListener('click', handleFirstInteraction, true);
    document.addEventListener('keydown', handleFirstInteraction, true);

    if (muteBtn) {
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFirstInteractionListeners();
        video.muted = !video.muted;
        if (video.muted) {
          userManuallyMuted = true;
        } else {
          video.play().catch(() => {});
        }
        updateMuteBtn();
      });
    }

    video.addEventListener('volumechange', updateMuteBtn);
    updateMuteBtn();

    // 7. If assets/demo_video.mp4 fails to load, show clean overlay
    const sourceEl = video.querySelector('source');
    const handleError = () => {
      this.showVideoFallback(playerContainer);
    };

    sourceEl?.addEventListener('error', handleError);
    video.addEventListener('error', handleError);

    if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || video.error) {
      handleError();
    }
  },

  showVideoFallback(container) {
    if (!container || container.querySelector('#videoFallbackOverlay')) return;

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    const overlay = document.createElement('div');
    overlay.className = 'video-fallback-overlay';
    overlay.id = 'videoFallbackOverlay';
    overlay.innerHTML = `
      <div class="video-fallback-icon" aria-hidden="true">🎬</div>
      <h3 class="video-fallback-title" data-i18n="evidence.video_coming_soon">
        ${isAr ? 'الفيديو التوضيحي قريباً' : 'Demo video coming soon'}
      </h3>
    `;

    container.appendChild(overlay);
  },

  /* ==========================================================================
     SECTION 2: DATA DASHBOARD (MIDDLE GRID) - REDESIGNED
     ========================================================================== */
  
  /**
   * 1. KPI Strip: 4 compact horizontal cards
   * Recall, ROC-AUC, Validated: glowing blue gradient ring gauges with IntersectionObserver scroll draw-in.
   * New Candidates (38): big number filled with yellow->orange gradient text.
   */
  renderKpiStrip() {
    const kpis = this.data.kpis;
    if (!kpis) return;

    const el1 = document.getElementById('evKpiRecall10');
    const el2 = document.getElementById('evKpiRocAuc');
    const el3 = document.getElementById('evKpiValidated');
    const el4 = document.getElementById('evKpiDiscovered');

    if (el1) el1.textContent = kpis.recall_at_10_formatted || '91.4%';
    if (el2) el2.textContent = kpis.roc_auc_formatted || '0.964';
    if (el3) el3.textContent = kpis.known_validated_formatted || '46 / 49';
    if (el4) el4.textContent = kpis.new_candidates_formatted || '38';

    // SVG Ring gauge offsets: radius = 32, circumference C = 2 * PI * 32 = 201.06
    const C = 201.06;
    const ringRecall = document.getElementById('ringRecall');
    const ringRocAuc = document.getElementById('ringRocAuc');
    const ringValidated = document.getElementById('ringValidated');

    // Recall: 91.4%
    const recallVal = (kpis.recall_at_10 || 91.4) / 100;
    const recallOffset = (C * (1 - recallVal)).toFixed(1);

    // ROC-AUC: 0.964 -> 96.4%
    const rocAucVal = kpis.roc_auc || 0.964;
    const rocAucOffset = (C * (1 - rocAucVal)).toFixed(1);

    // Validated: 46 / 49 = 93.88%
    const validVal = (kpis.known_validated && kpis.known_total) 
      ? (kpis.known_validated / kpis.known_total) 
      : 0.9388;
    const validOffset = (C * (1 - validVal)).toFixed(1);

    const ringTargets = [
      { el: ringRecall, target: recallOffset },
      { el: ringRocAuc, target: rocAucOffset },
      { el: ringValidated, target: validOffset }
    ];

    const strip = document.getElementById('evidenceKpiStrip');
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || !('IntersectionObserver' in window)) {
      ringTargets.forEach(r => {
        if (r.el) {
          r.el.style.strokeDasharray = `${C} ${C}`;
          r.el.style.strokeDashoffset = r.target;
          r.el.style.transition = 'none';
        }
      });
      return;
    }

    // Set initial full circumference offset (unfilled)
    ringTargets.forEach(r => {
      if (r.el) {
        r.el.style.strokeDasharray = `${C} ${C}`;
        r.el.style.strokeDashoffset = C.toFixed(1);
      }
    });

    if (strip) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            ringTargets.forEach(r => {
              if (r.el) {
                r.el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
                r.el.style.strokeDashoffset = r.target;
              }
            });
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      observer.observe(strip);
    }
  },

  /**
   * 2. Validation Ranking: 13 sites, horizontal bar chart, 1 line per row (~36px)
   * Scale 50% -> 100%. Validated = blue, new_candidate = yellow->orange + 'New' pill, failure = orange->red.
   * Expandable on click or keyboard Enter to reveal flag text and notes. Includes legend.
   */
  renderValidationRankPlot() {
    const container = document.getElementById('validationRankBars');
    if (!container || !this.data.validation_rankings) return;

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    // Legend
    const legendHtml = `
      <div class="ranking-chart-legend" role="list" aria-label="Ranking Legend">
        <div class="legend-chip" role="listitem">
          <span class="legend-swatch status-validated"></span>
          <span class="legend-label">${isAr ? 'مواقع معتمدة' : 'Validated Sites'}</span>
        </div>
        <div class="legend-chip" role="listitem">
          <span class="legend-swatch status-candidate"></span>
          <span class="legend-label legend-candidate-text">${isAr ? 'مرشحون جدد' : 'New Candidates'}</span>
        </div>
        <div class="legend-chip" role="listitem">
          <span class="legend-swatch status-failure"></span>
          <span class="legend-label">${isAr ? 'حالات فشل تحليلي' : 'Failure Cases'}</span>
        </div>
      </div>
    `;

    // Axis Labels Bar above First Row (Aligns with full-width bars)
    const axisHtml = `
      <div class="ranking-axis-bar" aria-hidden="true">
        <div class="axis-scale-ticks">
          <span>50%</span>
          <span>60%</span>
          <span>70%</span>
          <span>80%</span>
          <span>90%</span>
          <span>100%</span>
        </div>
      </div>
    `;

    // 13 Stacked Rows (Line 1: Rank, Name, Pill, Score % | Line 2: Full-width Gradient Bar)
    const rowsHtml = this.data.validation_rankings.map(item => {
      const isFailure = item.status === 'failure_case';
      const isCandidate = item.status === 'new_candidate';
      const statusClass = isFailure ? 'status-failure' : (isCandidate ? 'status-candidate' : 'status-validated');
      
      const name = isAr ? item.name_ar : item.name;

      // Scale 50% -> 100%
      const barPct = Math.max(0, Math.min(100, ((item.score - 50) / 50) * 100));
      const isSelected = this.selectedRank === item.rank;

      const pillHtml = isCandidate
        ? `<span class="pill-new">${isAr ? 'جديد' : 'NEW'}</span>`
        : '';

      return `
        <div class="rank-row-group" data-rank="${item.rank}" data-status="${item.status}">
          <div class="rank-bar-row ${statusClass} ${isSelected ? 'selected' : ''}" 
               tabindex="0" 
               role="button" 
               aria-selected="${isSelected}" 
               aria-pressed="${isSelected}" 
               title="${name}">
            <div class="rank-row-line1">
              <div class="rank-title-group">
                <span class="rank-index-num">#${item.rank}</span>
                <span class="rank-site-name">${name}</span>
                ${pillHtml}
              </div>
              <div class="rank-score-group">
                <span class="rank-score-val mono">${item.score.toFixed(1)}%</span>
              </div>
            </div>

            <div class="rank-row-line2">
              <div class="rank-bar-track">
                <div class="rank-bar-fill ${statusClass}" style="width: ${barPct.toFixed(1)}%;"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const rowsListHtml = `
      <div class="ranking-rows-list" id="rankingRowsList">
        ${rowsHtml}
      </div>
    `;

    container.innerHTML = legendHtml + axisHtml + rowsListHtml;

    // Attach row selection listeners (highlight row and update Site Details card)
    container.querySelectorAll('.rank-bar-row').forEach(row => {
      const select = () => {
        const parent = row.closest('.rank-row-group');
        const rank = parseInt(parent.getAttribute('data-rank'), 10);
        if (this.selectedRank !== rank) {
          this.selectedRank = rank;
          container.querySelectorAll('.rank-bar-row').forEach(r => {
            const isTarget = r === row;
            r.classList.toggle('selected', isTarget);
            r.setAttribute('aria-selected', isTarget ? 'true' : 'false');
            r.setAttribute('aria-pressed', isTarget ? 'true' : 'false');
          });
          this.renderSiteDetails();
        }
      };

      row.addEventListener('click', select);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select();
        }
      });
    });
  },

  /**
   * Site Details Card (Selected Ranking Site)
   * Shows site name, status pill, glowing ring gauge with score %, flag text, and notes.
   */
  renderSiteDetails() {
    const container = document.getElementById('siteDetailsContainer');
    const badgeEl = document.getElementById('siteDetailsRankBadge');
    const cardEl = document.getElementById('siteDetailsCard');
    if (!container || !this.data || !this.data.validation_rankings) return;

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    const item = this.data.validation_rankings.find(r => r.rank === this.selectedRank) 
      || this.data.validation_rankings[0];
    if (!item) return;

    const isFailure = item.status === 'failure_case';
    const isCandidate = item.status === 'new_candidate';
    const statusClass = isFailure ? 'status-failure' : (isCandidate ? 'status-candidate' : 'status-validated');
    const ringClass = isFailure ? 'ring-failure' : (isCandidate ? 'ring-candidate' : 'ring-validated');
    const cardAccent = isFailure ? '#FF2525' : (isCandidate ? '#FF8A00' : '#00C6FF');

    const name = isAr ? item.name_ar : item.name;
    const flag = isAr ? item.flag_ar : item.flag;
    const notes = isAr ? (item.notes_ar || item.notes) : item.notes;

    const statusLabel = isFailure 
      ? (isAr ? 'حالة فشل' : 'Failure Case')
      : isCandidate 
        ? (isAr ? 'مرشح جديد' : 'New Candidate')
        : (isAr ? 'موقع معتمد' : 'Validated');

    // Ring gauge calculations: r = 32, C = 201.06
    const C = 201.06;
    const scoreVal = Math.max(0, Math.min(100, item.score || 0));
    const offset = (C * (1 - scoreVal / 100)).toFixed(1);

    if (badgeEl) badgeEl.textContent = `#${item.rank}`;
    if (cardEl) cardEl.style.setProperty('--card-accent', cardAccent);

    container.innerHTML = `
      <div class="site-details-top-block">
        <div class="site-details-meta">
          <span class="site-status-pill ${statusClass}">
            <span class="status-dot"></span>
            ${statusLabel}
          </span>
          <h3 class="site-details-name" title="${name}">${name}</h3>
        </div>

        <div class="site-details-ring-wrap" title="Score: ${item.score.toFixed(1)}%">
          <svg class="site-details-ring-svg" viewBox="0 0 80 80" aria-label="Score: ${item.score.toFixed(1)}%">
            <circle cx="40" cy="40" r="32" class="kpi-ring-bg"></circle>
            <circle cx="40" cy="40" r="32" class="site-ring-fill ${ringClass}"
              style="stroke-dasharray: 201.06; stroke-dashoffset: ${offset};"></circle>
            <text x="40" y="44" text-anchor="middle" dominant-baseline="central" class="site-ring-score-text mono">${item.score.toFixed(1)}%</text>
          </svg>
        </div>
      </div>

      <div class="site-details-flag-banner ${statusClass}">
        <span class="flag-icon">${isFailure ? '⚠️' : isCandidate ? '✨' : '✓'}</span>
        <span class="flag-label">${flag}</span>
      </div>

      <div class="site-details-notes-box">
        <div class="site-notes-label">${isAr ? 'تقرير المعايرة والبيانات الميدانية:' : 'Calibration & Ground-Truth Notes:'}</div>
        <p class="site-notes-content">${notes}</p>
      </div>
    `;
  },

  /**
   * 3. Two Donut Cards Stacked in Right Column:
   * Donut A: "Sites by status" (validated blue, new candidate orange, failure red-orange, total in center).
   * Donut B: "Base weights" (#0072FF, #00C6FF, #FFB800, #FF8A00 only, with legend).
   * Both styled like home page similarity ring with round caps, 2-3° gap, glowing drop-shadows,
   * IntersectionObserver 1.2s draw-in animation, and bidirectional hover interactions.
   */
  renderDonuts() {
    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';
    const C = 251.33; // 2 * PI * 40
    const gapDeg = 2.8; // 2-3° gap between segments
    const capDeg = 7.162; // Round cap angular extension on radius 40 (5px / 40 * 180 / PI)
    const twoCapsDeg = 14.324;

    // --- Donut 1: Sites by Status ---
    const sitesContainer = document.getElementById('sitesStatusDonutContainer');
    if (sitesContainer && this.data.validation_rankings) {
      let validated = 0;
      let candidate = 0;
      let failure = 0;

      this.data.validation_rankings.forEach(item => {
        if (item.status === 'failure_case') failure++;
        else if (item.status === 'new_candidate') candidate++;
        else validated++;
      });

      const total = validated + candidate + failure;

      const statusItems = [
        {
          key: 'validated',
          idx: 0,
          count: validated,
          gradId: 'donut1_grad_val',
          c1: '#0072FF',
          c2: '#00C6FF',
          segClass: 'seg-validated',
          dotClass: 'dot-validated',
          label: isAr ? 'معتمد' : 'Validated',
          nameClass: ''
        },
        {
          key: 'candidate',
          idx: 1,
          count: candidate,
          gradId: 'donut1_grad_cand',
          c1: '#FFE53B',
          c2: '#FF8A00',
          segClass: 'seg-candidate',
          dotClass: 'dot-candidate',
          label: isAr ? 'مرشح' : 'New',
          nameClass: 'legend-candidate-text'
        },
        {
          key: 'failure',
          idx: 2,
          count: failure,
          gradId: 'donut1_grad_fail',
          c1: '#FF8A00',
          c2: '#FF2525',
          segClass: 'seg-failure',
          dotClass: 'dot-failure',
          label: isAr ? 'فشل' : 'Failure',
          nameClass: ''
        }
      ];

      // Calculate arc angles with round caps and 2.8° gap
      let accumAngle = 0;
      const defsGrads = statusItems.map(item => `
        <linearGradient id="${item.gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${item.c1}"/>
          <stop offset="100%" stop-color="${item.c2}"/>
        </linearGradient>
      `).join('');

      const segmentsHtml = statusItems.map(item => {
        if (item.count <= 0) return '';
        const fraction = item.count / total;
        const spanDeg = fraction * 360;
        const dashDeg = spanDeg - gapDeg - twoCapsDeg;
        const dashLen = Math.max(2, (dashDeg / 360) * C);
        const startAngle = -90 + accumAngle + capDeg + (gapDeg / 2);
        accumAngle += spanDeg;

        return `
          <circle cx="50" cy="50" r="40" 
            class="donut-seg ${item.segClass}"
            transform="rotate(${startAngle.toFixed(2)} 50 50)"
            style="stroke-dasharray: ${dashLen.toFixed(1)} ${C.toFixed(1)}; stroke-dashoffset: ${dashLen.toFixed(1)};"
            data-dash-len="${dashLen.toFixed(1)}"
            data-donut="status"
            data-seg-idx="${item.idx}"
            tabindex="0"
            role="graphics-symbol"
            aria-label="${item.label}: ${item.count} (${Math.round((item.count / total) * 100)}%)"></circle>
        `;
      }).join('');

      const legendHtml = statusItems.map(item => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return `
          <div class="donut-legend-item" data-donut="status" data-seg-idx="${item.idx}" tabindex="0" role="listitem">
            <span class="donut-legend-dot ${item.dotClass}"></span>
            <span class="donut-legend-name ${item.nameClass}">${item.label}</span>
            <span class="donut-legend-val mono">${item.count} (${pct}%)</span>
          </div>
        `;
      }).join('');

      sitesContainer.innerHTML = `
        <div class="donut-svg-wrap">
          <svg class="donut-svg" viewBox="0 0 100 100" aria-label="Sites by Status Donut Chart">
            <defs>
              ${defsGrads}
            </defs>
            <circle cx="50" cy="50" r="40" class="donut-track"></circle>
            ${segmentsHtml}
          </svg>
          <div class="donut-center-overlay">
            <span class="donut-center-big mono">${total}</span>
            <span class="donut-center-label">${isAr ? 'مواقع' : 'Sites'}</span>
          </div>
        </div>

        <div class="donut-legend-list" role="list" aria-label="${isAr ? 'دليل الحالات' : 'Status Legend'}">
          ${legendHtml}
        </div>
      `;

      this.setupDonutInteractions(sitesContainer, 'status');
      this.setupDonutAnimation(sitesContainer, 'status');
    }

    // --- Donut 2: Base Weights (4 Distinct Shades: #0072FF, #00C6FF, #FFB800, #FF8A00) ---
    const weightsContainer = document.getElementById('baseWeightsDonutContainer');
    if (weightsContainer && this.data.sensitivity_matrix && this.data.sensitivity_matrix.parameters) {
      const params = this.data.sensitivity_matrix.parameters;
      const weightConfigs = [
        { gradId: 'donut2_grad_0', c1: '#0052D4', c2: '#0072FF', dotBg: '#0072FF', segClass: 'seg-weight-0' },
        { gradId: 'donut2_grad_1', c1: '#0072FF', c2: '#00C6FF', dotBg: '#00C6FF', segClass: 'seg-weight-1' },
        { gradId: 'donut2_grad_2', c1: '#FFE53B', c2: '#FFB800', dotBg: '#FFB800', segClass: 'seg-weight-2' },
        { gradId: 'donut2_grad_3', c1: '#FFB800', c2: '#FF8A00', dotBg: '#FF8A00', segClass: 'seg-weight-3' }
      ];

      const defsGrads = weightConfigs.map(cfg => `
        <linearGradient id="${cfg.gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${cfg.c1}"/>
          <stop offset="100%" stop-color="${cfg.c2}"/>
        </linearGradient>
      `).join('');

      let accumAngle = 0;
      const segmentsHtml = params.map((p, idx) => {
        const cfg = weightConfigs[idx % weightConfigs.length];
        const fraction = p.base_weight;
        const spanDeg = fraction * 360;
        const dashDeg = spanDeg - gapDeg - twoCapsDeg;
        const dashLen = Math.max(2, (dashDeg / 360) * C);
        const startAngle = -90 + accumAngle + capDeg + (gapDeg / 2);
        accumAngle += spanDeg;

        const shortNamesEn = ['Slope', 'Regolith', 'Thermal', 'Spectral'];
        const shortNamesAr = ['انحدار', 'حطام', 'حراري', 'طيفي'];
        const label = isAr ? (shortNamesAr[idx] || p.parameter_ar) : (shortNamesEn[idx] || p.parameter);

        return `
          <circle cx="50" cy="50" r="40"
            class="donut-seg ${cfg.segClass}"
            transform="rotate(${startAngle.toFixed(2)} 50 50)"
            style="stroke-dasharray: ${dashLen.toFixed(1)} ${C.toFixed(1)}; stroke-dashoffset: ${dashLen.toFixed(1)};"
            data-dash-len="${dashLen.toFixed(1)}"
            data-donut="weights"
            data-seg-idx="${idx}"
            tabindex="0"
            role="graphics-symbol"
            aria-label="${label}: ${Math.round(p.base_weight * 100)}%"></circle>
        `;
      }).join('');

      const shortNamesEn = ['Slope', 'Regolith', 'Thermal', 'Spectral'];
      const shortNamesAr = ['انحدار', 'حطام', 'حراري', 'طيفي'];

      const legendHtml = params.map((p, idx) => {
        const cfg = weightConfigs[idx % weightConfigs.length];
        const label = isAr ? (shortNamesAr[idx] || p.parameter_ar) : (shortNamesEn[idx] || p.parameter);
        return `
          <div class="donut-legend-item" data-donut="weights" data-seg-idx="${idx}" tabindex="0" role="listitem">
            <span class="donut-legend-dot" style="background:${cfg.dotBg}; box-shadow:0 0 6px ${cfg.dotBg}88;"></span>
            <span class="donut-legend-name" title="${isAr ? p.parameter_ar : p.parameter}">${label}</span>
            <span class="donut-legend-val mono">${Math.round(p.base_weight * 100)}%</span>
          </div>
        `;
      }).join('');

      weightsContainer.innerHTML = `
        <div class="donut-svg-wrap">
          <svg class="donut-svg" viewBox="0 0 100 100" aria-label="Base Parameter Weights Donut Chart">
            <defs>
              ${defsGrads}
            </defs>
            <circle cx="50" cy="50" r="40" class="donut-track"></circle>
            ${segmentsHtml}
          </svg>
          <div class="donut-center-overlay">
            <span class="donut-center-big mono">100%</span>
            <span class="donut-center-label">${isAr ? 'أوزان' : 'Weights'}</span>
          </div>
        </div>

        <div class="donut-legend-list weights-grid" role="list" aria-label="${isAr ? 'دليل الأوزان' : 'Weights Legend'}">
          ${legendHtml}
        </div>
      `;

      this.setupDonutInteractions(weightsContainer, 'weights');
      this.setupDonutAnimation(weightsContainer, 'weights');
    }
  },

  /**
   * Helper: Bidirectional hover interactions between donut segments and legend items
   */
  setupDonutInteractions(container, donutId) {
    if (!container) return;
    const segments = container.querySelectorAll(`.donut-seg[data-donut="${donutId}"]`);
    const legends = container.querySelectorAll(`.donut-legend-item[data-donut="${donutId}"]`);
    const svg = container.querySelector('.donut-svg');

    const highlight = (idx) => {
      if (svg) svg.classList.add('has-hover');
      segments.forEach(seg => {
        if (seg.getAttribute('data-seg-idx') === String(idx)) {
          seg.classList.add('hovered');
        } else {
          seg.classList.remove('hovered');
        }
      });
      legends.forEach(leg => {
        if (leg.getAttribute('data-seg-idx') === String(idx)) {
          leg.classList.add('highlighted');
        } else {
          leg.classList.remove('highlighted');
        }
      });
    };

    const clear = () => {
      if (svg) svg.classList.remove('has-hover');
      segments.forEach(seg => seg.classList.remove('hovered'));
      legends.forEach(leg => leg.classList.remove('highlighted'));
    };

    segments.forEach(seg => {
      const idx = seg.getAttribute('data-seg-idx');
      seg.addEventListener('mouseenter', () => highlight(idx));
      seg.addEventListener('mouseleave', clear);
      seg.addEventListener('focus', () => highlight(idx));
      seg.addEventListener('blur', clear);
    });

    legends.forEach(leg => {
      const idx = leg.getAttribute('data-seg-idx');
      leg.addEventListener('mouseenter', () => highlight(idx));
      leg.addEventListener('mouseleave', clear);
      leg.addEventListener('focus', () => highlight(idx));
      leg.addEventListener('blur', clear);
    });
  },

  /**
   * Helper: IntersectionObserver scroll-triggered draw-in animation for donut charts
   */
  setupDonutAnimation(container, donutId) {
    if (!container) return;
    const segments = container.querySelectorAll(`.donut-seg[data-donut="${donutId}"]`);
    if (!segments.length) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || !('IntersectionObserver' in window)) {
      segments.forEach(seg => {
        seg.style.strokeDashoffset = '0';
        seg.style.transition = 'none';
      });
      return;
    }

    const card = container.closest('.donut-card') || container;
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          segments.forEach(seg => {
            seg.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
            seg.style.strokeDashoffset = '0';
          });
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    observer.observe(card);
  },

  /**
   * 2A. Mission Suitability Dot Matrix: Best mission fit per site
   * 1. No filled squares, no orange borders; circles in middle of transparent cells with row separators.
   * 2. Circle size by score: 40 -> 8px, 100 -> 26px (linear: 8 + (score - 40) * 0.3).
   *    Color: <60 -> #2A3A50, 60–80 -> #0072FF, >=80 -> #00C6FF with soft glow.
   * 3. Score shown as small text next to circle (0.8rem, var(--text-secondary)), not inside.
   * 4. Best mission per site: circle uses yellow->orange gradient with orange glow + small ★.
   *    Only ONE best per row (if tied, the first).
   * 5. Hover a row: faint row highlight. Hover circle: grows 1.15 with tooltip "site — mission: score".
   * 6. Size legend: three circles (40, 70, 100) and '★ best fit'.
   */
  renderHeatmap() {
    const container = document.getElementById('heatmapContainer');
    if (!container || !this.cells || this.cells.length === 0) return;

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    const profiles = [
      { key: 'rover', en: 'Rover testing', ar: 'اختبار المركبات' },
      { key: 'base', en: 'Human base', ar: 'قاعدة بشرية' },
      { key: 'isru', en: 'Resources (ISRU)', ar: 'استخراج الموارد' },
      { key: 'caves', en: 'Lava-tube shelter', ar: 'ملاجئ الأنابيب البركانية' }
    ];

    const colHeadersHtml = profiles.map(p => {
      const label = isAr ? p.ar : p.en;
      return `<th scope="col" class="col-mission-header">${label}</th>`;
    }).join('');

    const rowsHtml = this.cells.map(cell => {
      const name = isAr ? (cell.name_ar || cell.name) : cell.name;
      const isCand = Boolean(cell.is_candidate);
      const pillHtml = isCand ? `<span class="pill-new">${isAr ? 'جديد' : 'NEW'}</span>` : '';

      // 4. Find best mission per site. Only ONE best per row (if tied, the first via strict >)
      let maxScore = -Infinity;
      let bestProfileKey = null;
      profiles.forEach(p => {
        const score = (cell.profile_scores && typeof cell.profile_scores[p.key] === 'number') 
          ? cell.profile_scores[p.key] 
          : 0;
        if (score > maxScore) {
          maxScore = score;
          bestProfileKey = p.key;
        }
      });

      const cellsHtml = profiles.map(p => {
        const score = (cell.profile_scores && typeof cell.profile_scores[p.key] === 'number') 
          ? cell.profile_scores[p.key] 
          : 0;
        const isBest = (p.key === bestProfileKey);
        const pLabel = isAr ? p.ar : p.en;

        // 2. Circle size by score: 40 -> 8px, 100 -> 26px (linear)
        const dotSize = Math.round(Math.max(8, Math.min(26, 8 + (score - 40) * 0.3)));

        // 2 & 4. Color: score < 60 -> #2A3A50, 60–80 -> #0072FF, >= 80 -> #00C6FF.
        // Best mission uses yellow->orange gradient with orange glow.
        let dotClass = 'dot-low';
        if (isBest) {
          dotClass = 'dot-best';
        } else if (score >= 80) {
          dotClass = 'dot-high';
        } else if (score >= 60) {
          dotClass = 'dot-mid';
        }

        const tooltip = `${name} — ${pLabel}: ${score.toFixed(1)}${isBest ? (isAr ? ' (★ أفضل توافق)' : ' (★ best fit)') : ''}`;

        return `
          <td class="matrix-cell">
            <div class="matrix-cell-wrap" title="${tooltip}">
              <span class="matrix-dot ${dotClass}" 
                    style="width: ${dotSize}px; height: ${dotSize}px;"
                    tabindex="0"
                    role="graphics-symbol"
                    aria-label="${tooltip}"></span>
              <span class="matrix-score mono">${score.toFixed(1)}</span>
              ${isBest ? '<span class="matrix-star" aria-hidden="true">★</span>' : ''}
            </div>
          </td>
        `;
      }).join('');

      return `
        <tr>
          <th scope="row" class="heatmap-row-site">
            <span>${name}</span>
            ${pillHtml}
          </th>
          ${cellsHtml}
        </tr>
      `;
    }).join('');

    // 6. Size legend: three circles (40, 70, 100) and '★ best fit'
    const legendHtml = `
      <div class="matrix-legend-bar" aria-label="Matrix scale legend">
        <div class="matrix-legend-scale">
          <span class="matrix-legend-title">${isAr ? 'حجم النقطة حسب الدرجة:' : 'Dot size by score:'}</span>
          <div class="matrix-legend-items">
            <div class="matrix-legend-item">
              <span class="matrix-legend-dot dot-low" style="width: 8px; height: 8px;"></span>
              <span class="matrix-legend-label">40</span>
            </div>
            <div class="matrix-legend-item">
              <span class="matrix-legend-dot dot-mid" style="width: 17px; height: 17px;"></span>
              <span class="matrix-legend-label">70</span>
            </div>
            <div class="matrix-legend-item">
              <span class="matrix-legend-dot dot-high" style="width: 26px; height: 26px;"></span>
              <span class="matrix-legend-label">100</span>
            </div>
          </div>
        </div>
        <div class="matrix-legend-best-key">
          <span class="matrix-legend-dot dot-best" style="width: 20px; height: 20px;"></span>
          <span class="matrix-best-text">${isAr ? '★ أفضل توافق' : '★ best fit'}</span>
        </div>
      </div>
    `;

    container.innerHTML = `
      <table class="heatmap-table" role="grid" aria-label="${isAr ? 'أفضل مهمة لكل موقع' : 'Best mission fit per site'}">
        <thead>
          <tr>
            <th scope="col" class="col-site-header">${isAr ? 'الموقع' : 'Site'}</th>
            ${colHeadersHtml}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      ${legendHtml}
    `;
  },

  /**
   * 2B. Box Plot: How sites score on each attribute
   * 1. Fill card: SVG height ~320px (clamp(260px, 28vw, 360px)), width 100%, boxes wide (~60% of column).
   * 2. Y axis 60–100 with horizontal grid lines every 10 and labels.
   * 3. Palette colors: slope #0072FF, regolith #00C6FF, thermal #FFB800, radiation #FF8A00, mineralogy #FF5E3A.
   *    Box filled at 30% opacity, 2px border, median line 3px white with glow.
   * 4. Median value small label above each box. Attribute names under boxes (0.85rem).
   * 5. Hover box: brighter fill + tooltip with min, Q1, median, Q3, max.
   */
  renderBoxplot() {
    const container = document.getElementById('boxplotContainer');
    if (!container || !this.cells || this.cells.length === 0) return;

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    const attrConfigs = [
      { key: 'slope', en: 'Slope', ar: 'الانحدار', color: '#0072FF' },
      { key: 'regolith', en: 'Regolith', ar: 'التربة', color: '#00C6FF' },
      { key: 'thermal', en: 'Thermal', ar: 'الحرارة', color: '#FFB800' },
      { key: 'radiation', en: 'Radiation', ar: 'الإشعاع', color: '#FF8A00' },
      { key: 'mineralogy', en: 'Mineralogy', ar: 'المعادن', color: '#FF5E3A' }
    ];

    const stats = attrConfigs.map(attr => {
      const vals = this.cells
        .map(c => (c.radar_parameters && typeof c.radar_parameters[attr.key] === 'number') ? c.radar_parameters[attr.key] : null)
        .filter(v => v !== null)
        .sort((a, b) => a - b);

      if (vals.length === 0) return null;

      const n = vals.length;
      const min = vals[0];
      const max = vals[n - 1];
      const mid = Math.floor(n / 2);
      const median = (n % 2 === 0) ? (vals[mid - 1] + vals[mid]) / 2 : vals[mid];

      const lowerHalf = vals.slice(0, mid);
      const q1Mid = Math.floor(lowerHalf.length / 2);
      const q1 = (lowerHalf.length % 2 === 0) 
        ? (lowerHalf[q1Mid - 1] + lowerHalf[q1Mid]) / 2 
        : lowerHalf[q1Mid];

      const upperHalf = (n % 2 === 0) ? vals.slice(mid) : vals.slice(mid + 1);
      const q3Mid = Math.floor(upperHalf.length / 2);
      const q3 = (upperHalf.length % 2 === 0) 
        ? (upperHalf[q3Mid - 1] + upperHalf[q3Mid]) / 2 
        : upperHalf[q3Mid];

      return {
        ...attr,
        name: isAr ? attr.ar : attr.en,
        min,
        q1,
        median,
        q3,
        max
      };
    }).filter(Boolean);

    // SVG coordinate space: 540 x 320
    const yTop = 45;
    const yBot = 265;
    const h = yBot - yTop; // 220px
    const getY = (val) => yTop + ((100 - val) / 40) * h;

    const xStart = 52;
    const xEnd = 525;
    const colWidth = (xEnd - xStart) / stats.length; // ~94.6px
    const boxWidth = 56; // ~60% of column width
    const capWidth = 14;

    // 2. Y axis 60–100 with horizontal grid lines every 10 and labels
    const gridTicks = [60, 70, 80, 90, 100];
    const gridLinesHtml = gridTicks.map(t => {
      const y = getY(t);
      return `
        <line x1="${xStart - 5}" y1="${y.toFixed(1)}" x2="${xEnd + 5}" y2="${y.toFixed(1)}" class="boxplot-grid-line"/>
        <text x="${xStart - 12}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" class="boxplot-axis-text mono">${t}</text>
      `;
    }).join('');

    const boxplotsHtml = stats.map((st, i) => {
      const cx = xStart + (i + 0.5) * colWidth;
      const yMax = getY(st.max);
      const yQ3 = getY(st.q3);
      const yMed = getY(st.median);
      const yQ1 = getY(st.q1);
      const yMin = getY(st.min);

      const boxTop = yQ3;
      const boxHeight = Math.max(2, yQ1 - yQ3);
      const boxLeft = cx - boxWidth / 2;

      const tooltip = `${st.name} — Min: ${st.min}, Q1: ${st.q1}, Median: ${st.median}, Q3: ${st.q3}, Max: ${st.max}`;

      return `
        <g class="boxplot-col-group" tabindex="0" role="graphics-symbol" aria-label="${tooltip}">
          <title>${tooltip}</title>
          <!-- Whiskers & Caps -->
          <line x1="${cx.toFixed(1)}" y1="${yQ3.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${yMax.toFixed(1)}" stroke="${st.color}" stroke-width="1.5" stroke-dasharray="3 3" class="boxplot-whisker-line chart-anim-elem"/>
          <line x1="${(cx - capWidth).toFixed(1)}" y1="${yMax.toFixed(1)}" x2="${(cx + capWidth).toFixed(1)}" y2="${yMax.toFixed(1)}" stroke="${st.color}" stroke-width="2" stroke-linecap="round" class="boxplot-cap-line chart-anim-elem"/>
          
          <line x1="${cx.toFixed(1)}" y1="${yQ1.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${yMin.toFixed(1)}" stroke="${st.color}" stroke-width="1.5" stroke-dasharray="3 3" class="boxplot-whisker-line chart-anim-elem"/>
          <line x1="${(cx - capWidth).toFixed(1)}" y1="${yMin.toFixed(1)}" x2="${(cx + capWidth).toFixed(1)}" y2="${yMin.toFixed(1)}" stroke="${st.color}" stroke-width="2" stroke-linecap="round" class="boxplot-cap-line chart-anim-elem"/>

          <!-- 3. Box filled at 30% opacity, 2px border -->
          <rect x="${boxLeft.toFixed(1)}" y="${boxTop.toFixed(1)}" width="${boxWidth}" height="${boxHeight.toFixed(1)}" rx="6" 
                fill="${st.color}" fill-opacity="0.30" stroke="${st.color}" stroke-width="2" 
                class="boxplot-rect chart-anim-elem"/>

          <!-- 3. Median Line: 3px white with glow -->
          <line x1="${boxLeft.toFixed(1)}" y1="${yMed.toFixed(1)}" x2="${(boxLeft + boxWidth).toFixed(1)}" y2="${yMed.toFixed(1)}" 
                stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" style="filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.85));" 
                class="boxplot-median-line chart-anim-elem"/>

          <!-- 4. Median value label badge above each box -->
          <rect x="${(cx - 18).toFixed(1)}" y="${(boxTop - 22).toFixed(1)}" width="36" height="17" rx="4" 
                class="boxplot-median-badge-bg chart-anim-elem" stroke="${st.color}" stroke-width="1.2"/>
          <text x="${cx.toFixed(1)}" y="${(boxTop - 9).toFixed(1)}" text-anchor="middle" 
                class="boxplot-median-badge-text mono chart-anim-elem">${st.median}</text>

          <!-- 4. Attribute names under boxes (readable size 0.85rem) -->
          <text x="${cx.toFixed(1)}" y="295" class="boxplot-attr-label">${st.name}</text>
        </g>
      `;
    }).join('');

    container.innerHTML = `
      <svg class="boxplot-svg" viewBox="0 0 540 320" role="img" aria-label="${isAr ? 'توزيع درجات المواقع لكل خاصية' : 'How sites score on each attribute'}">
        ${gridLinesHtml}
        <line x1="${xStart - 5}" y1="${yBot}" x2="${xEnd + 5}" y2="${yBot}" class="boxplot-axis-line"/>
        ${boxplotsHtml}
      </svg>
    `;
  },

  /**
   * 2C. Histogram: Score distribution
   * 1. Only show bins covering real data range (from lowest score's bin 55-60 to 100).
   *    Bars fill width (~70% of bin column), radius 6px on top.
   * 2. Chart height ~320px like box plot. Y axis with integer counts (0..6) and grid lines.
   * 3. Stacked segments clearly separated (1px gap) in status colors; count label above each bar (0.9rem bold).
   * 4. X axis labels like "55–60", "85–90", readable size.
   * 5. Hover bar: tooltip listing site names in that bin, colored by status.
   */
  renderHistogram() {
    const container = document.getElementById('histogramContainer');
    if (!container || !this.data.validation_rankings) return;

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    // 1. 9 bins covering real data range from lowest (58.7 in 55-60) to 100
    const binDefinitions = [
      { min: 55, max: 60, label: '55–60' },
      { min: 60, max: 65, label: '60–65' },
      { min: 65, max: 70, label: '65–70' },
      { min: 70, max: 75, label: '70–75' },
      { min: 75, max: 80, label: '75–80' },
      { min: 80, max: 85, label: '80–85' },
      { min: 85, max: 90, label: '85–90' },
      { min: 90, max: 95, label: '90–95' },
      { min: 95, max: 100, label: '95–100' }
    ];

    const bins = binDefinitions.map(b => ({
      ...b,
      validated: [],
      candidate: [],
      failure: []
    }));

    this.data.validation_rankings.forEach(item => {
      const score = item.score;
      const status = item.status;
      const name = isAr ? (item.name_ar || item.name) : item.name;

      for (let i = 0; i < bins.length; i++) {
        const b = bins[i];
        const matches = (i === bins.length - 1) 
          ? (score >= b.min && score <= b.max) 
          : (score >= b.min && score < b.max);

        if (matches) {
          if (status === 'failure_case') {
            b.failure.push(name);
          } else if (status === 'new_candidate') {
            b.candidate.push(name);
          } else {
            b.validated.push(name);
          }
          break;
        }
      }
    });

    // 2. SVG coordinate space 540 x 320, Y axis with integer counts (0..6)
    const maxCount = 7; // Headroom for count label
    const yZero = 265;
    const yTop = 45;
    const plotH = yZero - yTop; // 220px
    const unitH = plotH / maxCount; // ~31.43px per unit

    const xStart = 52;
    const xEnd = 525;
    const binW = (xEnd - xStart) / bins.length; // ~52.55px
    const barW = 37; // ~70% of bin column
    const segGap = 1.5; // 1px separation between stacked segments

    // Integer grid lines and ticks (0, 1, 2, 3, 4, 5, 6)
    const yTicks = [0, 1, 2, 3, 4, 5, 6];
    const gridLinesHtml = yTicks.map(t => {
      const y = yZero - t * unitH;
      return `
        <line x1="${xStart - 5}" y1="${y.toFixed(1)}" x2="${xEnd + 5}" y2="${y.toFixed(1)}" class="boxplot-grid-line"/>
        <text x="${xStart - 12}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" class="boxplot-axis-text mono">${t}</text>
      `;
    }).join('');

    const barsHtml = bins.map((b, i) => {
      const cx = xStart + (i + 0.5) * binW;
      const barLeft = cx - barW / 2;

      const cVal = b.validated.length;
      const cCand = b.candidate.length;
      const cFail = b.failure.length;
      const total = cVal + cCand + cFail;

      // Determine segments in stack from bottom to top
      const segments = [];
      if (cVal > 0) segments.push({ count: cVal, type: 'val', cssClass: 'seg-val', items: b.validated });
      if (cCand > 0) segments.push({ count: cCand, type: 'cand', cssClass: 'seg-cand', items: b.candidate });
      if (cFail > 0) segments.push({ count: cFail, type: 'fail', cssClass: 'seg-fail', items: b.failure });

      let currentBaseY = yZero;
      let segsHtml = '';

      segments.forEach((seg, sIdx) => {
        const isTop = (sIdx === segments.length - 1);
        const segH = seg.count * unitH;
        // Leave 1.5px gap if stacked on top of another segment
        const actualH = (sIdx > 0) ? Math.max(2, segH - segGap) : segH;
        const segY = (sIdx > 0) ? (currentBaseY - actualH - segGap) : (currentBaseY - actualH);

        const rx = isTop ? 6 : 0;
        segsHtml += `
          <rect x="${barLeft.toFixed(1)}" y="${segY.toFixed(1)}" width="${barW}" height="${actualH.toFixed(1)}" 
                rx="${rx}" class="hist-seg ${seg.cssClass} chart-anim-elem"/>
        `;
        currentBaseY = segY;
      });

      const yStackTop = (segments.length > 0) ? currentBaseY : yZero;

      const allSites = [...b.validated, ...b.candidate, ...b.failure];
      const tooltipText = allSites.length > 0 
        ? `${b.label} (${total}):\n• ${allSites.join('\n• ')}`
        : `${b.label}: 0`;

      return `
        <g class="hist-bar-group" data-bin-idx="${i}" tabindex="0" role="graphics-symbol" aria-label="${b.label}: ${total}">
          <title>${tooltipText}</title>
          
          <!-- Stacked Bar Segments -->
          ${segsHtml}

          <!-- 3. Count label above each bar (0.9rem bold) -->
          ${total > 0 ? `<text x="${cx.toFixed(1)}" y="${(yStackTop - 8).toFixed(1)}" class="hist-count-text mono chart-anim-elem">${total}</text>` : ''}

          <!-- 4. X axis labels like 55–60, 85–90, readable size -->
          <text x="${cx.toFixed(1)}" y="292" class="hist-bin-label mono">${b.label}</text>
        </g>
      `;
    }).join('');

    container.innerHTML = `
      <svg class="histogram-svg" viewBox="0 0 540 320" role="img" aria-label="${isAr ? 'توزيع الدرجات' : 'Score distribution'}">
        <defs>
          <linearGradient id="svgGradMain" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#0072FF"/>
            <stop offset="100%" stop-color="#00C6FF"/>
          </linearGradient>
          <linearGradient id="svgGradCandidate" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FFE53B"/>
            <stop offset="100%" stop-color="#FF8A00"/>
          </linearGradient>
          <linearGradient id="svgGradAlert" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FF8A00"/>
            <stop offset="100%" stop-color="#FF2525"/>
          </linearGradient>
        </defs>
        ${gridLinesHtml}
        <line x1="${xStart - 5}" y1="${yZero}" x2="${xEnd + 5}" y2="${yZero}" class="boxplot-axis-line"/>
        ${barsHtml}
      </svg>
      <div class="hist-floating-tooltip" id="histFloatingTooltip" aria-hidden="true"></div>
    `;

    // 5. Hover a bar: tooltip listing site names in that bin, colored by status
    const tooltipEl = container.querySelector('#histFloatingTooltip');
    const barGroups = container.querySelectorAll('.hist-bar-group');

    barGroups.forEach(grp => {
      const idx = parseInt(grp.getAttribute('data-bin-idx'), 10);
      const b = bins[idx];
      if (!b) return;

      const total = b.validated.length + b.candidate.length + b.failure.length;

      const showTip = () => {
        if (!tooltipEl || total === 0) return;
        const cx = xStart + (idx + 0.5) * binW;
        const leftPct = (cx / 540) * 100;
        const tipX = Math.max(22, Math.min(78, leftPct));
        const yStackTop = yZero - total * unitH;
        const topPct = Math.max(12, Math.min(75, (yStackTop / 320) * 100));

        const valHtml = b.validated.map(s => `
          <div class="hist-tip-item val"><span class="hist-tip-dot val"></span><span>${s}</span></div>
        `).join('');
        const candHtml = b.candidate.map(s => `
          <div class="hist-tip-item cand"><span class="hist-tip-dot cand"></span><span>${s}</span></div>
        `).join('');
        const failHtml = b.failure.map(s => `
          <div class="hist-tip-item fail"><span class="hist-tip-dot fail"></span><span>${s}</span></div>
        `).join('');

        const countWord = isAr ? 'مواقع' : 'sites';
        tooltipEl.innerHTML = `
          <div class="hist-tip-header">${b.label} &bull; ${total} ${countWord}</div>
          <div class="hist-tip-list">
            ${valHtml}
            ${candHtml}
            ${failHtml}
          </div>
        `;

        tooltipEl.style.left = `${tipX.toFixed(1)}%`;
        tooltipEl.style.top = `${topPct.toFixed(1)}%`;
        tooltipEl.classList.add('visible');
      };

      const hideTip = () => {
        if (tooltipEl) tooltipEl.classList.remove('visible');
      };

      grp.addEventListener('mouseenter', showTip);
      grp.addEventListener('mouseleave', hideTip);
      grp.addEventListener('focusin', showTip);
      grp.addEventListener('focusout', hideTip);
    });
  },

  /**
   * Scroll grow-in animation observer for the 3 Section 2 charts.
   * Triggered once on viewport scroll-in, disabled under prefers-reduced-motion.
   */
  setupChartAnimations() {
    const cards = [
      document.getElementById('evidenceHeatmapCard'),
      document.getElementById('evidenceBoxplotCard'),
      document.getElementById('evidenceHistogramCard')
    ].filter(Boolean);

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      cards.forEach(card => card.classList.add('chart-animated'));
      return;
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('chart-animated');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      cards.forEach(card => {
        if (!card.classList.contains('chart-animated')) {
          observer.observe(card);
        }
      });
    } else {
      cards.forEach(card => card.classList.add('chart-animated'));
    }
  },

  /**
   * 4. Method & Sensitivity Matrix:
   * Center-Zero Diverging Bars: +25% blue, -25% orange->red.
   * Stability index: thin blue progress bar.
   */
  renderSensitivityMatrix() {
    const container = document.getElementById('sensitivityTableBody');
    if (!container || !this.data.sensitivity_matrix) return;

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';
    const params = this.data.sensitivity_matrix.parameters || [];

    // Dynamically compute minimum stability percentage from data
    const stabilities = params.map(p => parseFloat(p.stability_index)).filter(n => !isNaN(n));
    const minStability = stabilities.length > 0 ? Math.round(Math.min(...stabilities)) : 94;

    const subEl = document.getElementById('sensitivitySubtitle');
    if (subEl) {
      subEl.textContent = isAr 
        ? `يبقى الترتيب ثابتاً بنسبة ${minStability}% على الأقل حتى عند تغيير أي وزن بنسبة ±25%.`
        : `Rankings stay at least ${minStability}% stable even when any weight changes by ±25%.`;
    }

    // Max scale for diverging bar is 3.0 ranks
    const maxShift = 3.0;

    container.innerHTML = params.map(p => {
      // Parse +25% shift (e.g. "+0.4 ranks (ΔS = +1.2%)" -> +0.4)
      const plusMatch = p.plus_25_rank_shift ? p.plus_25_rank_shift.match(/\+?([0-9.]+)/) : null;
      const plusVal = plusMatch ? parseFloat(plusMatch[1]) : 0.5;
      const plusBarWidth = Math.min(100, (plusVal / maxShift) * 100);

      // Parse -25% shift (e.g. "-0.6 ranks (ΔS = -1.4%)" -> -0.6)
      const minusMatch = p.minus_25_rank_shift ? p.minus_25_rank_shift.match(/-([0-9.]+)/) : null;
      const minusVal = minusMatch ? parseFloat(minusMatch[1]) : 0.6;
      const minusBarWidth = Math.min(100, (minusVal / maxShift) * 100);

      // Stability % (e.g. "98.2%" -> 98.2)
      const stabVal = parseFloat(p.stability_index) || 95;

      return `
        <tr>
          <td>
            <div class="param-cell-title">${isAr ? p.parameter_ar : p.parameter}</div>
          </td>
          
          <td style="text-align:center;">
            <span class="weight-badge-cell mono">${(p.base_weight * 100).toFixed(0)}%</span>
          </td>

          <td>
            <div class="diverging-chart-wrap" title="-25% Perturbation: ${p.minus_25_rank_shift} | +25% Perturbation: ${p.plus_25_rank_shift}">
              <!-- Negative side (-25% shift): Orange->Red bar growing left -->
              <div class="diverge-side negative">
                <span class="diverge-label minus-label mono">-${minusVal.toFixed(1)}</span>
                <div class="diverge-bar-fill minus-bar" style="width: ${minusBarWidth.toFixed(1)}%;"></div>
              </div>

              <!-- Center zero divider -->
              <div class="diverge-center-zero"></div>

              <!-- Positive side (+25% shift): Blue bar growing right -->
              <div class="diverge-side positive">
                <div class="diverge-bar-fill plus-bar" style="width: ${plusBarWidth.toFixed(1)}%;"></div>
                <span class="diverge-label plus-label mono">+${plusVal.toFixed(1)}</span>
              </div>
            </div>
          </td>

          <td>
            <div class="stability-metric-box" title="Stability Rating: ${p.rating}">
              <div class="stability-track">
                <div class="stability-fill" style="width: ${stabVal}%;"></div>
              </div>
              <span class="stability-text mono">${p.stability_index}</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  /**
   * 5. Data Catalog Table: Searchable, sortable, celestial body filter chips, blue tint license pills
   */
  renderDataCatalogTable() {
    const tableBody = document.getElementById('dataCatalogTableBody');
    if (!tableBody) return;

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';
    const searchInput = document.getElementById('catalogSearchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const activeBody = (this.activeBodyFilter || 'all').toLowerCase();

    let items = this.catalogItems.filter(item => {
      // Body filter
      const itemBody = (item.body || 'earth').toLowerCase();
      if (activeBody !== 'all' && itemBody !== activeBody) {
        return false;
      }

      // Search query across fields
      if (!query) return true;
      const appText = (isAr && item.application_ar) ? item.application_ar : (item.application || '');
      return (
        item.name.toLowerCase().includes(query) ||
        item.agency.toLowerCase().includes(query) ||
        item.resolution.toLowerCase().includes(query) ||
        item.license.toLowerCase().includes(query) ||
        appText.toLowerCase().includes(query) ||
        (item.application && item.application.toLowerCase().includes(query))
      );
    });

    // Sort items
    items.sort((a, b) => {
      let valA = a[this.catalogSortCol] || '';
      let valB = b[this.catalogSortCol] || '';
      if (this.catalogSortCol === 'application' && isAr) {
        valA = a.application_ar || a.application || '';
        valB = b.application_ar || b.application || '';
      }
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.catalogSortAsc ? -1 : 1;
      if (valA > valB) return this.catalogSortAsc ? 1 : -1;
      return 0;
    });

    const catalogCard = document.getElementById('dataCatalogSection');
    if (catalogCard) {
      catalogCard.setAttribute('data-active-body', activeBody);
    }

    if (items.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">
            ${isAr ? 'لا توجد مجموعات بيانات تطابق الفلتر أو البحث الحالي.' : 'No datasets match the current filter or search.'}
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = items.map(item => {
      const body = (item.body || 'earth').toLowerCase();
      const bodyClass = body === 'moon' ? 'body-dot-moon' : (body === 'mars' ? 'body-dot-mars' : 'body-dot-earth');
      const bodyLabel = body === 'moon' ? (isAr ? 'القمر' : 'Moon') : (body === 'mars' ? (isAr ? 'المريخ' : 'Mars') : (isAr ? 'الأرض' : 'Earth'));

      // License pill: "Public domain" and "CC-BY 4.0" (keep full license name in title tooltip)
      const isCc = item.license.toUpperCase().includes('CC-BY');
      const licenseShort = isCc ? 'CC-BY 4.0' : (isAr ? 'نطاق عام' : 'Public domain');
      const applicationText = (isAr && item.application_ar) ? item.application_ar : item.application;

      return `
        <tr data-body="${body}" style="--row-color: var(--body-${body});" tabindex="0">
          <td>
            <div class="dataset-name-cell">
              <span class="body-dot ${bodyClass}" title="${bodyLabel}" aria-label="${bodyLabel}"></span>
              <strong>${item.name}</strong>
            </div>
          </td>
          <td>${item.agency}</td>
          <td><span class="mono">${item.resolution}</span></td>
          <td><span class="sci-badge license-pill" title="${item.license}">${licenseShort}</span></td>
          <td>${applicationText}</td>
        </tr>
      `;
    }).join('');
  },

  /* ==========================================================================
     SECTION 3: FUTURE VISION & STRATEGIC ROADMAP
     ========================================================================== */
  renderRoadmap() {
    const container = document.getElementById('roadmapTimelineGrid');
    if (!container || !this.data.roadmap) return;

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    const statusLabels = {
      completed: { en: 'Done', ar: 'مكتمل' },
      active: { en: 'In progress', ar: 'قيد التنفيذ' },
      planned: { en: 'Planned', ar: 'مخطط' }
    };

    const totalItems = this.data.roadmap.length;

    container.innerHTML = this.data.roadmap.map((item, idx) => {
      const status = item.status || 'planned';
      const statusText = isAr ? statusLabels[status]?.ar || status : statusLabels[status]?.en || status;
      const title = isAr ? item.title_ar : item.title;
      const desc = isAr ? item.description_ar : item.description;
      const isLast = idx === totalItems - 1;

      return `
        <div class="roadmap-phase-card phase-${status}" data-status="${status}">
          <div class="timeline-dot-wrapper">
            <div class="timeline-dot dot-${status}" aria-label="${statusText}"></div>
            ${!isLast ? `<div class="timeline-connector connector-${status}"></div>` : ''}
          </div>
          <div class="timeline-content">
            <span class="timeline-status-text status-${status}">${statusText}</span>
            <div class="timeline-date mono">${item.timeline}</div>
            <h4 class="timeline-title">${title}</h4>
            <p class="timeline-desc">${desc}</p>
          </div>
        </div>
      `;
    }).join('');
  },

  bindEvents() {
    // Video play awards XP
    const video = document.getElementById('demoVideo');
    if (video) {
      video.addEventListener('play', () => {
        if (window.UserSystem && !this._videoXpAwarded) {
          this._videoXpAwarded = true;
          window.UserSystem.addXP(30, 'Viewed technical demonstration video', 'مشاهدة العرض التقني الميداني');
        }
      });
    }

    // Body filter chips in Data Catalog
    const chipBtns = document.querySelectorAll('.catalog-chip[data-body]');
    chipBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const body = e.currentTarget.getAttribute('data-body') || 'all';
        this.activeBodyFilter = body;
        chipBtns.forEach(c => c.classList.toggle('active', c === e.currentTarget));
        this.renderDataCatalogTable();
      });
    });

    // Search input in Data Catalog
    const searchInput = document.getElementById('catalogSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderDataCatalogTable());
    }

    // Sort column headers in Data Catalog
    document.querySelectorAll('.catalog-table th[data-sort]').forEach(th => {
      th.addEventListener('click', (e) => {
        const col = e.currentTarget.getAttribute('data-sort');
        if (this.catalogSortCol === col) {
          this.catalogSortAsc = !this.catalogSortAsc;
        } else {
          this.catalogSortCol = col;
          this.catalogSortAsc = true;
        }
        this.renderDataCatalogTable();
      });
    });
  }
};

window.EvidenceController = EvidenceController;
