/**
 * TerraTwin - Page 4: Evidence & Method Controller
 * Redesigned Modern Dark Analytics Dashboard for Section 2
 * Compact horizontal KPI cards with SVG rings, scale 50%-100% ranking bar chart,
 * stacked status & base weights donuts, MathML formula banner, and diverging sensitivity matrix.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await window.App.init('evidence');

  const validationData = await window.App.fetchData('validation');

  if (!validationData) {
    console.error('Validation data missing for Evidence page');
    return;
  }

  EvidenceController.init(validationData);
});

const EvidenceController = {
  data: null,
  activeVideoSource: 'local', // 'local' or 'embed'
  catalogItems: [],
  catalogSortCol: 'name',
  catalogSortAsc: true,
  expandedRank: null,

  init(validationData) {
    this.data = validationData;
    this.catalogItems = [...(validationData.data_catalog || [])];

    // Register translation keys for video fallback overlay
    if (window.I18n && window.I18n.translations) {
      const tr = window.I18n.translations;
      if (tr.en) {
        tr.en.evidence = tr.en.evidence || {};
        tr.en.evidence.video_missing_title = tr.en.evidence.video_missing_title || 'Demo video not added yet';
        tr.en.evidence.video_missing_desc = tr.en.evidence.video_missing_desc || 'Add the recording as assets/demo_video.mp4 or use a YouTube/Vimeo link';
        tr.en.evidence.video_missing_btn = tr.en.evidence.video_missing_btn || 'Switch to YouTube / Vimeo';
      }
      if (tr.ar) {
        tr.ar.evidence = tr.ar.evidence || {};
        tr.ar.evidence.video_missing_title = tr.ar.evidence.video_missing_title || 'لم تتم إضافة الفيديو التوضيحي بعد';
        tr.ar.evidence.video_missing_desc = tr.ar.evidence.video_missing_desc || 'أضف التسجيل كملف assets/demo_video.mp4 أو استخدم رابط يوتيوب / فيميو';
        tr.ar.evidence.video_missing_btn = tr.ar.evidence.video_missing_btn || 'التبديل إلى يوتيوب / فيميو';
      }
    }

    this.initVideoPlayer();
    this.renderKpiStrip();
    this.renderValidationRankPlot();
    this.renderDonuts();
    this.renderSensitivityMatrix();
    this.renderDataCatalogTable();
    this.renderRoadmap();

    this.bindEvents();

    document.addEventListener('languageChanged', () => {
      this.renderKpiStrip();
      this.renderValidationRankPlot();
      this.renderDonuts();
      this.renderSensitivityMatrix();
      this.renderDataCatalogTable();
      this.renderRoadmap();

      const fallbackOverlay = document.getElementById('videoFallbackOverlay');
      if (fallbackOverlay) {
        const lang = window.I18n ? window.I18n.currentLang : 'en';
        const isAr = lang === 'ar';
        const titleEl = fallbackOverlay.querySelector('.video-fallback-title');
        const descEl = fallbackOverlay.querySelector('.video-fallback-desc');
        const btnEl = fallbackOverlay.querySelector('.btn-switch-embed');
        if (titleEl) titleEl.textContent = isAr ? 'لم تتم إضافة الفيديو التوضيحي بعد' : 'Demo video not added yet';
        if (descEl) descEl.textContent = isAr ? 'أضف التسجيل كملف assets/demo_video.mp4 أو استخدم رابط يوتيوب / فيميو' : 'Add the recording as assets/demo_video.mp4 or use a YouTube/Vimeo link';
        if (btnEl) btnEl.textContent = isAr ? 'التبديل إلى يوتيوب / فيميو' : 'Switch to YouTube / Vimeo';
      }
    });
  },

  /* ==========================================================================
     SECTION 1: VIDEO DEMONSTRATION & TOGGLE
     ========================================================================== */
  initVideoPlayer() {
    const toggleLocalBtn = document.getElementById('videoToggleLocal');
    const toggleEmbedBtn = document.getElementById('videoToggleEmbed');
    const embedInputBox = document.getElementById('embedUrlInputBox');
    const playerContainer = document.getElementById('videoResponsiveWrapper');
    const applyEmbedBtn = document.getElementById('btnApplyEmbed');
    const embedInput = document.getElementById('embedUrlInput');

    const setSource = (source) => {
      this.activeVideoSource = source;
      toggleLocalBtn?.classList.toggle('active', source === 'local');
      toggleEmbedBtn?.classList.toggle('active', source === 'embed');
      embedInputBox?.classList.toggle('show', source === 'embed');

      if (source === 'local') {
        playerContainer.innerHTML = `
          <video id="demoVideo" class="video-player-element" controls poster="assets/poster.svg">
            <source src="assets/demo_video.mp4" type="video/mp4">
            <track label="English" kind="subtitles" srclang="en" src="assets/subtitles-en.vtt" default>
            <track label="العربية" kind="subtitles" srclang="ar" src="assets/subtitles-ar.vtt">
            Your browser does not support HTML5 video.
          </video>
        `;

        const videoEl = playerContainer.querySelector('#demoVideo');
        const sourceEl = videoEl?.querySelector('source');

        const handleError = () => {
          this.showVideoFallback(playerContainer, setSource);
        };

        sourceEl?.addEventListener('error', handleError);
        videoEl?.addEventListener('error', handleError);

        // Immediate check if media source failed to load
        if (videoEl && (videoEl.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || videoEl.error)) {
          handleError();
        }

        // Attach video play XP award
        videoEl?.addEventListener('play', () => {
          if (window.UserSystem && !this._videoXpAwarded) {
            this._videoXpAwarded = true;
            window.UserSystem.addXP(30, 'Viewed technical demonstration video', 'مشاهدة العرض التقني الميداني');
          }
        });
      } else {
        const url = embedInput?.value.trim() || 'https://www.youtube-nocookie.com/embed/g2qJgW9V6lU?autoplay=1';
        playerContainer.innerHTML = `
          <iframe class="video-embed-iframe" src="${url}" title="TerraTwin Demonstration Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        `;
      }
    };

    toggleLocalBtn?.addEventListener('click', () => setSource('local'));
    toggleEmbedBtn?.addEventListener('click', () => setSource('embed'));

    applyEmbedBtn?.addEventListener('click', () => {
      if (this.activeVideoSource === 'embed') setSource('embed');
    });

    setSource('local');
  },

  showVideoFallback(container, setSource) {
    if (!container || container.querySelector('#videoFallbackOverlay')) return;

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    const overlay = document.createElement('div');
    overlay.className = 'video-fallback-overlay';
    overlay.id = 'videoFallbackOverlay';
    overlay.innerHTML = `
      <div class="video-fallback-icon" aria-hidden="true">🎬</div>
      <h3 class="video-fallback-title" data-i18n="evidence.video_missing_title">
        ${isAr ? 'لم تتم إضافة الفيديو التوضيحي بعد' : 'Demo video not added yet'}
      </h3>
      <p class="video-fallback-desc" data-i18n="evidence.video_missing_desc">
        ${isAr ? 'أضف التسجيل كملف assets/demo_video.mp4 أو استخدم رابط يوتيوب / فيميو' : 'Add the recording as assets/demo_video.mp4 or use a YouTube/Vimeo link'}
      </p>
      <button class="btn-switch-embed" id="btnSwitchToEmbed" data-i18n="evidence.video_missing_btn">
        ${isAr ? 'التبديل إلى يوتيوب / فيميو' : 'Switch to YouTube / Vimeo'}
      </button>
    `;

    const switchBtn = overlay.querySelector('#btnSwitchToEmbed');
    switchBtn?.addEventListener('click', () => {
      setSource('embed');
    });

    container.appendChild(overlay);
  },

  /* ==========================================================================
     SECTION 2: DATA DASHBOARD (MIDDLE GRID) - REDESIGNED
     ========================================================================== */
  
  /**
   * 1. KPI Strip: 4 compact horizontal cards
   * Recall, ROC-AUC, Validated: blue gradient ring gauge.
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
    if (ringRecall) ringRecall.style.strokeDashoffset = (C * (1 - recallVal)).toFixed(1);

    // ROC-AUC: 0.964 -> 96.4%
    const rocAucVal = kpis.roc_auc || 0.964;
    if (ringRocAuc) ringRocAuc.style.strokeDashoffset = (C * (1 - rocAucVal)).toFixed(1);

    // Validated: 46 / 49 = 93.88%
    const validVal = (kpis.known_validated && kpis.known_total) 
      ? (kpis.known_validated / kpis.known_total) 
      : 0.9388;
    if (ringValidated) ringValidated.style.strokeDashoffset = (C * (1 - validVal)).toFixed(1);
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

    // 13 Rows
    const rowsHtml = this.data.validation_rankings.map(item => {
      const isFailure = item.status === 'failure_case';
      const isCandidate = item.status === 'new_candidate';
      const statusClass = isFailure ? 'status-failure' : (isCandidate ? 'status-candidate' : 'status-validated');
      
      const name = isAr ? item.name_ar : item.name;
      const flag = isAr ? item.flag_ar : item.flag;
      const notes = isAr ? (item.notes_ar || item.notes) : item.notes;

      // Scale 50% -> 100%
      const barPct = Math.max(0, Math.min(100, ((item.score - 50) / 50) * 100));
      const isExpanded = this.expandedRank === item.rank;

      const pillHtml = isCandidate
        ? `<span class="pill-new">${isAr ? 'جديد' : 'NEW'}</span>`
        : '';

      return `
        <div class="rank-row-group ${isExpanded ? 'expanded' : ''}" data-rank="${item.rank}">
          <div class="rank-bar-row ${statusClass}" tabindex="0" role="button" aria-expanded="${isExpanded}" title="${name} — Click to expand telemetry notes">
            <span class="rank-index-num">#${item.rank}</span>
            <div class="rank-name-box">
              <span class="rank-site-name" title="${name}">${name}</span>
              ${pillHtml}
            </div>
            <div class="rank-track-wrap">
              <div class="rank-bar-track">
                <div class="rank-bar-fill ${statusClass}" style="width: ${barPct.toFixed(1)}%;"></div>
              </div>
            </div>
            <span class="rank-score-val mono">${item.score.toFixed(1)}%</span>
            <span class="rank-chevron" aria-hidden="true">▾</span>
          </div>

          <div class="rank-drawer-panel" id="rankDrawer_${item.rank}" aria-hidden="${!isExpanded}">
            <div class="drawer-inner-content">
              <div class="drawer-flag-tag ${statusClass}">
                <span class="drawer-flag-icon">${isFailure ? '⚠️' : isCandidate ? '✨' : '✓'}</span>
                <span>${flag}</span>
              </div>
              <p class="drawer-notes-text">${notes}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = legendHtml + rowsHtml;

    // Attach expandable toggle listeners
    container.querySelectorAll('.rank-bar-row').forEach(row => {
      const toggle = () => {
        const parent = row.closest('.rank-row-group');
        const rank = parseInt(parent.getAttribute('data-rank'), 10);
        this.expandedRank = this.expandedRank === rank ? null : rank;
        this.renderValidationRankPlot();
      };

      row.addEventListener('click', toggle);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  },

  /**
   * 3. Two Donut Cards Stacked in Right Column:
   * Donut A: "Sites by status" (validated blue, new candidate orange, failure red-orange, total in center).
   * Donut B: "Base weights" (#0072FF, #00C6FF, #FFB800, #FF8A00 only, with legend).
   */
  renderDonuts() {
    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

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
      const C = 263.89; // Circumference for radius 42

      const valLen = (validated / total) * C;
      const candLen = (candidate / total) * C;
      const failLen = (failure / total) * C;

      const valOffset = 0;
      const candOffset = -valLen;
      const failOffset = -(valLen + candLen);

      sitesContainer.innerHTML = `
        <div class="donut-svg-wrap">
          <svg class="donut-svg" viewBox="0 0 100 100" aria-label="Sites by Status Donut Chart">
            <circle cx="50" cy="50" r="42" class="donut-track"></circle>
            <!-- Validated (Blue) -->
            <circle cx="50" cy="50" r="42" class="donut-seg seg-validated" 
              style="stroke-dasharray: ${valLen.toFixed(1)} ${C}; stroke-dashoffset: ${valOffset.toFixed(1)};"></circle>
            <!-- Candidate (Orange) -->
            <circle cx="50" cy="50" r="42" class="donut-seg seg-candidate" 
              style="stroke-dasharray: ${candLen.toFixed(1)} ${C}; stroke-dashoffset: ${candOffset.toFixed(1)};"></circle>
            <!-- Failure (Red-Orange) -->
            <circle cx="50" cy="50" r="42" class="donut-seg seg-failure" 
              style="stroke-dasharray: ${failLen.toFixed(1)} ${C}; stroke-dashoffset: ${failOffset.toFixed(1)};"></circle>
          </svg>
          <div class="donut-center-overlay">
            <span class="donut-center-big mono">${total}</span>
            <span class="donut-center-label">${isAr ? 'موقعاً' : 'SITES'}</span>
          </div>
        </div>

        <div class="donut-legend-list">
          <div class="donut-legend-item">
            <span class="donut-legend-dot dot-validated"></span>
            <span class="donut-legend-name">${isAr ? 'معتمد' : 'Validated'}</span>
            <span class="donut-legend-val mono">${validated} (${Math.round((validated/total)*100)}%)</span>
          </div>
          <div class="donut-legend-item">
            <span class="donut-legend-dot dot-candidate"></span>
            <span class="donut-legend-name legend-candidate-text">${isAr ? 'مرشح' : 'New'}</span>
            <span class="donut-legend-val mono">${candidate} (${Math.round((candidate/total)*100)}%)</span>
          </div>
          <div class="donut-legend-item">
            <span class="donut-legend-dot dot-failure"></span>
            <span class="donut-legend-name">${isAr ? 'فشل' : 'Failure'}</span>
            <span class="donut-legend-val mono">${failure} (${Math.round((failure/total)*100)}%)</span>
          </div>
        </div>
      `;
    }

    // --- Donut 2: Base Weights (4 Distinct Shades: #0072FF, #00C6FF, #FFB800, #FF8A00) ---
    const weightsContainer = document.getElementById('baseWeightsDonutContainer');
    if (weightsContainer && this.data.sensitivity_matrix && this.data.sensitivity_matrix.parameters) {
      const params = this.data.sensitivity_matrix.parameters;
      const C = 263.89; // Circumference for radius 42
      const colors = ['#0072FF', '#00C6FF', '#FFB800', '#FF8A00'];
      
      let currentOffset = 0;
      const segmentsHtml = params.map((p, idx) => {
        const segLen = p.base_weight * C;
        const offset = currentOffset;
        currentOffset -= segLen;
        return `
          <circle cx="50" cy="50" r="42" class="donut-seg"
            style="stroke: ${colors[idx % colors.length]}; stroke-dasharray: ${segLen.toFixed(1)} ${C}; stroke-dashoffset: ${offset.toFixed(1)}; filter: drop-shadow(0 0 4px ${colors[idx % colors.length]}55);"></circle>
        `;
      }).join('');

      const shortNamesEn = ['Slope', 'Regolith', 'Thermal', 'Spectral'];
      const shortNamesAr = ['انحدار', 'حطام', 'حراري', 'طيفي'];

      const legendHtml = params.map((p, idx) => {
        const label = isAr ? (shortNamesAr[idx] || p.parameter_ar) : (shortNamesEn[idx] || p.parameter);
        return `
          <div class="donut-legend-item">
            <span class="donut-legend-dot" style="background:${colors[idx]}; box-shadow:0 0 6px ${colors[idx]}88;"></span>
            <span class="donut-legend-name" title="${isAr ? p.parameter_ar : p.parameter}">${label}</span>
            <span class="donut-legend-val mono">${Math.round(p.base_weight * 100)}%</span>
          </div>
        `;
      }).join('');

      weightsContainer.innerHTML = `
        <div class="donut-svg-wrap">
          <svg class="donut-svg" viewBox="0 0 100 100" aria-label="Base Parameter Weights Donut Chart">
            <circle cx="50" cy="50" r="42" class="donut-track"></circle>
            ${segmentsHtml}
          </svg>
          <div class="donut-center-overlay">
            <span class="donut-center-big mono">100%</span>
            <span class="donut-center-label">${isAr ? 'الأوزان' : 'WEIGHTS'}</span>
          </div>
        </div>

        <div class="donut-legend-list weights-grid">
          ${legendHtml}
        </div>
      `;
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
   * 5. Data Catalog Table: Searchable, sortable, blue tint license pills
   */
  renderDataCatalogTable() {
    const tableBody = document.getElementById('dataCatalogTableBody');
    if (!tableBody) return;

    const searchInput = document.getElementById('catalogSearchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let items = this.catalogItems.filter(item => {
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.agency.toLowerCase().includes(query) ||
        item.resolution.toLowerCase().includes(query) ||
        item.license.toLowerCase().includes(query) ||
        item.application.toLowerCase().includes(query)
      );
    });

    // Sort items
    items.sort((a, b) => {
      let valA = a[this.catalogSortCol] || '';
      let valB = b[this.catalogSortCol] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.catalogSortAsc ? -1 : 1;
      if (valA > valB) return this.catalogSortAsc ? 1 : -1;
      return 0;
    });

    tableBody.innerHTML = items.map(item => `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td>${item.agency}</td>
        <td><span class="mono">${item.resolution}</span></td>
        <td><span class="sci-badge license-pill">${item.license}</span></td>
        <td>${item.application}</td>
      </tr>
    `).join('');
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
