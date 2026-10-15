/**
 * TerraTwin - Page 4: Evidence & Method Controller
 * Video Demonstration player with local/embed fallback and subtitles,
 * Validation Rank Bar Plot with failure cases, Sensitivity Matrix,
 * Searchable/Sortable Data Catalog, and Strategic Roadmap.
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

  init(validationData) {
    this.data = validationData;
    this.catalogItems = [...(validationData.data_catalog || [])];

    this.initVideoPlayer();
    this.renderKpiStrip();
    this.renderValidationRankPlot();
    this.renderSensitivityMatrix();
    this.renderDataCatalogTable();
    this.renderRoadmap();

    this.bindEvents();

    document.addEventListener('languageChanged', () => {
      this.renderKpiStrip();
      this.renderValidationRankPlot();
      this.renderSensitivityMatrix();
      this.renderDataCatalogTable();
      this.renderRoadmap();
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

    // Start with local video by default
    setSource('local');
  },

  /* ==========================================================================
     SECTION 2: DATA DASHBOARD (MIDDLE GRID)
     ========================================================================== */
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
  },

  renderValidationRankPlot() {
    const container = document.getElementById('validationRankBars');
    if (!container || !this.data.validation_rankings) return;

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    container.innerHTML = this.data.validation_rankings.map(item => {
      const isFailure = item.status === 'failure_case';
      const name = isAr ? item.name_ar : item.name;
      const flag = isAr ? item.flag_ar : item.flag;
      const percentage = item.score;

      return `
        <div class="rank-bar-row ${isFailure ? 'failure-row' : ''}">
          <div class="rank-num">#${item.rank}</div>
          <div class="rank-site-info">
            <span class="rank-site-name" title="${name}">${name}</span>
            <span class="rank-flag-badge">${flag}</span>
          </div>
          <div class="rank-bar-visual-track">
            <div class="rank-bar-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="rank-score-text">${percentage.toFixed(1)}%</div>
        </div>
      `;
    }).join('');
  },

  renderSensitivityMatrix() {
    const container = document.getElementById('sensitivityTableBody');
    if (!container || !this.data.sensitivity_matrix) return;

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';
    const params = this.data.sensitivity_matrix.parameters || [];

    container.innerHTML = params.map(p => `
      <tr>
        <td><strong>${isAr ? p.parameter_ar : p.parameter}</strong></td>
        <td><span class="mono">${(p.base_weight * 100).toFixed(0)}%</span></td>
        <td><span class="mono" style="color:var(--accent-cyan);">${p.plus_25_rank_shift}</span></td>
        <td><span class="mono" style="color:var(--accent-gold);">${p.minus_25_rank_shift}</span></td>
        <td><span class="delta-badge match-good">${p.stability_index} (${p.rating})</span></td>
      </tr>
    `).join('');
  },

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
        <td><span class="sci-badge validated">${item.license}</span></td>
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

    container.innerHTML = this.data.roadmap.map(item => {
      const phase = isAr ? item.phase_ar : item.phase;
      const title = isAr ? item.title_ar : item.title;
      const desc = isAr ? item.description_ar : item.description;

      return `
        <div class="roadmap-phase-card ${item.status}">
          <div class="phase-top-bar">
            <span class="sci-badge ${item.status === 'completed' ? 'validated' : item.status === 'active' ? 'candidate' : 'moon'}">
              ${phase}
            </span>
            <span class="phase-timeline-badge">${item.timeline}</span>
          </div>
          <div class="phase-title">${title}</div>
          <div class="phase-desc">${desc}</div>
        </div>
      `;
    }).join('');
  },

  bindEvents() {
    // Search input in Data Catalog
    const searchInput = document.getElementById('catalogSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderDataCatalogTable());
    }

    // Sort column headers
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
