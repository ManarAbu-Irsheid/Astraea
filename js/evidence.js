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
  selectedRank: 1, // Default selected rank for Site Details card

  init(validationData, cellsData) {
    this.data = validationData;
    this.cells = cellsData ? (cellsData.cells || []) : [];

    // Register translation keys for video fallback and sensitivity
    if (window.I18n && window.I18n.translations) {
      const tr = window.I18n.translations;
      if (tr.en) {
        tr.en.evidence = tr.en.evidence || {};
        tr.en.evidence.video_coming_soon = tr.en.evidence.video_coming_soon || 'Demo video coming soon';
        tr.en.evidence.site_details_title = tr.en.evidence.site_details_title || 'Site Details';
        tr.en.evidence.btn_show_formula = tr.en.evidence.btn_show_formula || 'Show formula';
        tr.en.evidence.btn_hide_formula = tr.en.evidence.btn_hide_formula || 'Hide formula';
        tr.en.evidence.sensitivity_explanation = tr.en.evidence.sensitivity_explanation || "We changed how much each attribute counts and re-ranked all sites. They barely moved, so the results don't depend on our choice of weights.";
      }
      if (tr.ar) {
        tr.ar.evidence = tr.ar.evidence || {};
        tr.ar.evidence.video_coming_soon = tr.ar.evidence.video_coming_soon || 'الفيديو التوضيحي قريباً';
        tr.ar.evidence.site_details_title = tr.ar.evidence.site_details_title || 'تفاصيل الموقع';
        tr.ar.evidence.btn_show_formula = tr.ar.evidence.btn_show_formula || 'عرض المعادلة';
        tr.ar.evidence.btn_hide_formula = tr.ar.evidence.btn_hide_formula || 'إخفاء المعادلة';
        tr.ar.evidence.sensitivity_explanation = tr.ar.evidence.sensitivity_explanation || "غيّرنا أهمية كل خاصية وأعدنا ترتيب المواقع، فبالكاد تحركت، أي أن النتائج لا تعتمد على اختيارنا للأوزان.";
      }
    }

    this.initVideoPlayer();
    this.renderKpiStrip();
    this.renderValidationRankPlot();
    this.renderDonuts();
    this.renderSiteDetails();
    this.renderBoxplot();
    this.renderHistogram();
    this.setupChartAnimations();
    this.renderSensitivityMatrix();
    this.renderRoadmap();

    this.bindEvents();

    document.addEventListener('languageChanged', () => {
      this.renderKpiStrip();
      this.renderValidationRankPlot();
      this.renderDonuts();
      this.renderSiteDetails();
      this.renderBoxplot();
      this.renderHistogram();
      this.renderSensitivityMatrix();
      this.renderRoadmap();

      const fallbackTitle = document.querySelector('#videoFallbackOverlay .video-fallback-title');
      if (fallbackTitle) {
        const isAr = (window.I18n ? window.I18n.currentLang : 'en') === 'ar';
        fallbackTitle.textContent = isAr ? 'الفيديو التوضيحي قريباً' : 'Demo video coming soon';
      }

      // Update formula toggle button label on language change
      const formulaBtn = document.getElementById('btnFormulaToggle');
      if (formulaBtn) {
        const isAr = (window.I18n ? window.I18n.currentLang : 'en') === 'ar';
        const isExpanded = formulaBtn.getAttribute('aria-expanded') === 'true';
        const textSpan = formulaBtn.querySelector('.formula-toggle-text');
        if (textSpan) {
          textSpan.textContent = isExpanded 
            ? (isAr ? 'إخفاء المعادلة' : 'Hide formula') 
            : (isAr ? 'عرض المعادلة' : 'Show formula');
        }
      }
    });
  },

  /* ==========================================================================
     SECTION 1: HERO VIDEO DEMONSTRATION (CLEAN BACKGROUND VIDEO)
     ========================================================================== */
  initVideoPlayer() {
    const video = document.getElementById('demoVideo');
    const playerContainer = document.getElementById('videoResponsiveWrapper');
    if (!video) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 7. Under prefers-reduced-motion: do not autoplay; the first tap on the video starts it.
    if (prefersReduced) {
      video.autoplay = false;
      video.removeAttribute('autoplay');
      video.pause();
    } else {
      // 4. On page load call demoVideo.play() and ignore the promise error
      video.play().catch(() => {});
    }

    // 4. Unmute on the user's first click/tap or key press anywhere on the page (once only, then remove the listener)
    const handleFirstInteraction = () => {
      document.removeEventListener('click', handleFirstInteraction, true);
      document.removeEventListener('touchstart', handleFirstInteraction, true);
      document.removeEventListener('keydown', handleFirstInteraction, true);

      if (video.muted) {
        video.muted = false;
        if (!prefersReduced || !video.paused) {
          video.play().catch(() => {});
        }
      }
    };

    document.addEventListener('click', handleFirstInteraction, true);
    document.addEventListener('touchstart', handleFirstInteraction, true);
    document.addEventListener('keydown', handleFirstInteraction, true);

    // 5. Tapping/clicking on the video toggles pause/play (no visible button)
    video.addEventListener('click', () => {
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });

    // 6. If assets/demo_video.mp4 fails to load, show clean overlay
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
   * Scroll grow-in animation observer for the 2 Section 2 charts (Box plot & Histogram).
   * Triggered once on viewport scroll-in, disabled under prefers-reduced-motion.
   */
  setupChartAnimations() {
    const cards = [
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
   * 4. Method & Ranking Stability:
   * 4 clean cards in 1 row (Slope, Regolith, Thermal, Spectral).
   * Weight pill, glowing ring gauge with stability % in center (orange for lowest stability),
   * and max rank shift line.
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
    const minStabilityVal = stabilities.length > 0 ? Math.min(...stabilities) : 94;

    const subEl = document.getElementById('sensitivitySubtitle');
    if (subEl) {
      subEl.innerHTML = isAr 
        ? `يبقى الترتيب ثابتاً بنسبة <bdi class="bidi-isolate">${minStability}%</bdi> على الأقل حتى عند تغيير أهمية أي خاصية بنسبة <bdi class="bidi-isolate">±25%</bdi>.`
        : `Rankings stay at least ${minStability}% stable even when any weight changes by ±25%.`;
    }

    container.innerHTML = params.map(p => {
      // Short name: Slope, Regolith, Thermal, Spectral (AR: الانحدار، التربة، الحرارة، الطيف)
      let shortName = '';
      const pLower = (p.parameter || '').toLowerCase();
      if (pLower.includes('slope')) shortName = isAr ? 'الانحدار' : 'Slope';
      else if (pLower.includes('regolith')) shortName = isAr ? 'التربة' : 'Regolith';
      else if (pLower.includes('thermal')) shortName = isAr ? 'الحرارة' : 'Thermal';
      else if (pLower.includes('spectral')) shortName = isAr ? 'الطيف' : 'Spectral';
      else shortName = isAr ? (p.parameter_ar || p.parameter) : p.parameter;

      // Small pill with its weight: (28%)
      const weightPct = `${(p.base_weight * 100).toFixed(0)}%`;

      // Glowing blue ring gauge with stability % in the center
      const stabVal = parseFloat(p.stability_index) || 95;

      // Circumference C = 2 * PI * 32 = 201.06
      const C = 201.06;
      const offset = (C * (1 - (stabVal / 100))).toFixed(1);
      const stabText = `${stabVal.toFixed(1)}%`;

      // Larger absolute value of the +25% / -25% rank shifts
      const plusMatch = p.plus_25_rank_shift ? p.plus_25_rank_shift.match(/\+?([0-9.]+)/) : null;
      const plusVal = plusMatch ? parseFloat(plusMatch[1]) : 0;
      const minusMatch = p.minus_25_rank_shift ? p.minus_25_rank_shift.match(/-([0-9.]+)/) : null;
      const minusVal = minusMatch ? parseFloat(minusMatch[1]) : 0;
      const maxShiftVal = Math.max(plusVal, minusVal);
      const shiftFormatted = maxShiftVal.toFixed(1);

      const shiftText = isAr
        ? `يتغير ترتيبه بحد أقصى <bdi class="bidi-isolate">±${shiftFormatted}</bdi> مرتبة`
        : `Moves ±${shiftFormatted} places at most`;

      return `
        <div class="sensitivity-param-card" tabindex="0">
          <div class="param-card-header">
            <h4 class="param-card-name">${shortName}</h4>
            <span class="param-weight-pill mono"><bdi class="bidi-isolate">${weightPct}</bdi></span>
          </div>

          <div class="param-ring-side">
            <div class="param-ring-wrapper">
              <svg class="kpi-ring-svg param-ring-svg" viewBox="0 0 80 80" aria-hidden="true">
                <circle cx="40" cy="40" r="32" class="kpi-ring-bg"></circle>
                <circle cx="40" cy="40" r="32" class="kpi-ring-fill ring-main" style="stroke-dasharray: 201.06; stroke-dashoffset: ${offset};"></circle>
              </svg>
              <div class="param-ring-center-val kpi-val-main mono">${stabText}</div>
            </div>
          </div>

          <div class="param-card-footer">
            <span class="param-shift-text">${shiftText}</span>
          </div>
        </div>
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

    const shortTitles = [
      { en: 'Data Fusion', ar: 'دمج البيانات' },
      { en: 'Field Robotics', ar: 'روبوتات الميدان' },
      { en: 'Weight Learning', ar: 'تعلم الأوزان' },
      { en: 'Collaborative Cloud', ar: 'السحابة التعاونية' }
    ];

    const totalItems = this.data.roadmap.length;

    container.innerHTML = this.data.roadmap.map((item, idx) => {
      const status = item.status || 'planned';
      const statusText = isAr ? statusLabels[status]?.ar || status : statusLabels[status]?.en || status;
      const fullTitle = isAr ? item.title_ar : item.title;
      const shortTitle = shortTitles[idx] ? (isAr ? shortTitles[idx].ar : shortTitles[idx].en) : fullTitle;
      const desc = isAr ? item.description_ar : item.description;
      const isLast = idx === totalItems - 1;

      return `
        <div class="roadmap-phase-card phase-${status}" data-status="${status}" tabindex="0" role="button" aria-haspopup="true" aria-expanded="false" aria-label="${shortTitle}: ${statusText}">
          <div class="timeline-dot-wrapper">
            <div class="timeline-dot dot-${status}" aria-hidden="true"></div>
            ${!isLast ? `<div class="timeline-connector connector-${status}"></div>` : ''}
          </div>
          <div class="timeline-content">
            <div class="timeline-meta-row">
              <span class="timeline-status-text status-${status}">${statusText}</span>
              <span class="timeline-date mono">${item.timeline}</span>
            </div>
            <h4 class="timeline-title">${shortTitle}</h4>

            <!-- Tooltip/popover with full title and description -->
            <div class="timeline-popover" role="tooltip">
              <div class="popover-full-title">${fullTitle}</div>
              <p class="popover-desc">${desc}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Keyboard and click toggle for description popover
    container.querySelectorAll('.roadmap-phase-card').forEach(card => {
      const togglePopover = (forceState) => {
        const isOpen = forceState !== undefined ? forceState : !card.classList.contains('popover-open');
        container.querySelectorAll('.roadmap-phase-card').forEach(c => {
          if (c !== card || !isOpen) {
            c.classList.remove('popover-open');
            c.setAttribute('aria-expanded', 'false');
          }
        });
        if (isOpen) {
          card.classList.add('popover-open');
          card.setAttribute('aria-expanded', 'true');
        }
      };

      card.addEventListener('click', () => togglePopover());

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          togglePopover();
        } else if (e.key === 'Escape') {
          togglePopover(false);
        }
      });
    });
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

    // Formula collapsible toggle button
    const formulaBtn = document.getElementById('btnFormulaToggle');
    const formulaBanner = document.getElementById('formulaDisplayBanner');
    if (formulaBtn && formulaBanner) {
      formulaBtn.addEventListener('click', () => {
        const isCollapsed = formulaBanner.classList.contains('collapsed');
        formulaBanner.classList.toggle('collapsed', !isCollapsed);
        formulaBtn.setAttribute('aria-expanded', isCollapsed ? 'true' : 'false');

        const lang = window.I18n ? window.I18n.currentLang : 'en';
        const isAr = lang === 'ar';
        const textSpan = formulaBtn.querySelector('.formula-toggle-text');
        if (textSpan) {
          textSpan.textContent = isCollapsed 
            ? (isAr ? 'إخفاء المعادلة' : 'Hide formula') 
            : (isAr ? 'عرض المعادلة' : 'Show formula');
        }
      });
    }

    // Close any open roadmap popovers when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.roadmap-phase-card')) {
        document.querySelectorAll('.roadmap-phase-card.popover-open').forEach(c => {
          c.classList.remove('popover-open');
          c.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }
};

window.EvidenceController = EvidenceController;
