/**
 * TerraTwin - Page 2: Site Finder Controller
 * Geospatial Leaflet Map, Criteria Filters, Canvas Radar Chart,
 * and Site Detail Panel with Transfer to Compare Page.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await window.App.init('finder');

  const cellsData = await window.App.fetchData('cells');
  const targetsData = await window.App.fetchData('targets');

  if (!cellsData) {
    console.error('Cells data missing for Finder');
    return;
  }

  SiteFinder.init(cellsData.cells, targetsData ? targetsData.targets : []);
});

/**
 * Target-aware criteria: choosing Moon or Mars changes
 * the available mission profiles and the criteria names.
 */
const FINDER_TARGET_CONFIG = {
  all: {
    profiles: ['rover', 'base', 'isru', 'caves', 'biosig'],
    criteria: {
      slope:    { en: 'Slope & Roughness',   ar: 'الانحدار والوعورة' },
      ice:      { en: 'Ice & Volatiles',     ar: 'الجليد والمواد المتطايرة' },
      regolith: { en: 'Regolith Mechanics',  ar: 'ميكانيكا التربة' },
      volcanic: { en: 'Volcanic / Cavities', ar: 'البراكين والتجاويف' }
    },
    hint: {
      en: 'Showing analogs for both the Moon and Mars.',
      ar: 'يتم عرض المواقع المشابهة للقمر والمريخ معاً.'
    }
  },
  moon: {
    profiles: ['rover', 'base', 'isru', 'caves'],
    criteria: {
      slope:    { en: 'Crater Slopes & Boulders', ar: 'منحدرات الفوهات والصخور' },
      ice:      { en: 'Polar Ice (PSR)',          ar: 'الجليد القطبي (المناطق المظللة)' },
      regolith: { en: 'Sharp Lunar Regolith',     ar: 'تربة القمر الحادة' },
      volcanic: { en: 'Lava Tubes & Basalt',      ar: 'أنابيب الحمم والبازلت' }
    },
    hint: {
      en: 'Moon baseline: vacuum, 0.16 g, abrasive dust, polar ice in shadowed craters.',
      ar: 'مرجع القمر: فراغ، جاذبية 0.16، غبار حاد، وجليد في الفوهات المظللة.'
    }
  },
  mars: {
    profiles: ['rover', 'base', 'isru', 'biosig'],
    criteria: {
      slope:    { en: 'Slope & Rock Density',      ar: 'الانحدار وكثافة الصخور' },
      ice:      { en: 'Subsurface Ice / Water',    ar: 'الجليد والماء تحت السطح' },
      regolith: { en: 'Fine Dust & Perchlorates',  ar: 'الغبار الناعم والبيركلورات' },
      volcanic: { en: 'Hydrated & Volcanic Minerals', ar: 'المعادن المائية والبركانية' }
    },
    hint: {
      en: 'Mars baseline: thin CO₂ air, 0.38 g, hyper-arid soils, ancient water minerals.',
      ar: 'مرجع المريخ: غلاف رقيق من CO₂، جاذبية 0.38، تربة شديدة الجفاف، ومعادن مائية قديمة.'
    }
  }
};

const FINDER_UI_TEXT = {
  profileTitle: { en: 'Mission Profile', ar: 'نوع المهمة' },
  filters:      { en: 'Filters',         ar: 'الفلاتر' },
  siteCard:     { en: 'Site Card',       ar: 'بطاقة الموقع' },
  targetTitle:  { en: 'Find Earth sites similar to', ar: 'ابحث عن أماكن على الأرض تشبه' },
  bodyAll:      { en: 'Both',     ar: 'الاثنين' },
  bodyMoon:     { en: '🌕 Moon',  ar: '🌕 القمر' },
  bodyMars:     { en: '🔴 Mars',  ar: '🔴 المريخ' },
  reset:        { en: 'Reset Defaults',  ar: 'إعادة الضبط' },
  layerSatellite: { en: 'Satellite',  ar: 'قمر صناعي' },
  layerTopo:      { en: 'Topography', ar: 'تضاريس' },
  layerDark:      { en: 'Dark Map',   ar: 'خريطة داكنة' },
  heatLegend:     { en: 'Glow = similarity', ar: 'التوهج = نسبة التشابه' },
  heatLow:        { en: 'Low',  ar: 'أقل' },
  heatHigh:       { en: 'High', ar: 'أعلى' }
};

// Banner on top of the map: tells the user what the map is showing
const FINDER_BANNER = {
  all:  { icon: '🌍', en: 'Earth sites similar to the Moon & Mars', ar: 'أماكن على الأرض تشبه القمر والمريخ' },
  moon: { icon: '🌕', en: 'Earth sites similar to the Moon',        ar: 'أماكن على الأرض تشبه القمر' },
  mars: { icon: '🔴', en: 'Earth sites similar to Mars',            ar: 'أماكن على الأرض تشبه المريخ' }
};

const SiteFinder = {
  cells: [],
  targets: [],
  selectedSite: null,
  activeTargetFilter: 'all', // 'all', 'moon', 'mars'
  activeTerrainFilter: 'all',
  discoveryFilter: 'all', // 'all', 'candidates_only', 'known_only'
  map: null,
  markersLayer: null,

  tileLayers: {},
  currentLayer: 'satellite',

  init(cells, targets) {
    this.cells = cells;
    this.targets = targets;

    this.initMap();
    this.bindFilters();
    this.bindMobileSheets();
    this.applyTarget(this.activeTargetFilter);

    // Default select first site (e.g. Yungay or Al-Labbah)
    if (this.cells.length > 0) {
      this.selectSite(this.cells[0], false); // don't pop the card open on page load
    }

    document.addEventListener('languageChanged', () => {
      this.renderCriteria();
      this.renderMarkers();
      if (this.selectedSite) this.renderSiteDetail(this.selectedSite);
    });

    document.addEventListener('profileChanged', () => {
      this.syncCriteriaUI();
      this.renderMarkers();
      if (this.selectedSite) this.renderSiteDetail(this.selectedSite);
    });
  },

  initMap() {
    const mapContainer = document.getElementById('leafletMap');
    if (!mapContainer) return;

    try {
      if (typeof L !== 'undefined') {
        // Initialize Leaflet Map
        this.map = L.map('leafletMap', {
          center: [20, 10],
          zoom: 2.3,
          minZoom: 1.8,
          maxZoom: 18,
          zoomControl: false
        });

        L.control.zoom({ position: 'bottomleft' }).addTo(this.map);

        // 1. Authentic High-Resolution True Satellite Imagery (NASA / USGS / ESRI)
        this.tileLayers.satellite = L.layerGroup([
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics, USDA, USGS',
            maxZoom: 18
          }),
          L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            attribution: '',
            maxZoom: 18,
            opacity: 0.8
          })
        ]);

        // 2. High-Precision Geological Terrain Relief
        this.tileLayers.topo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; USGS, NOAA',
          maxZoom: 18
        });

        // 3. Cyber Dark Deep Space Radar Map
        this.tileLayers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; CARTO &copy; OpenStreetMap',
          subdomains: 'abcd',
          maxZoom: 19
        });

        // Set default layer to True Satellite Imagery
        this.tileLayers.satellite.addTo(this.map);
        this.currentLayer = 'satellite';

        // Layer Switcher Buttons
        const switcherBtns = document.querySelectorAll('.layer-switch-btn');
        switcherBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const layerKey = btn.getAttribute('data-layer');
            if (this.tileLayers[layerKey] && layerKey !== this.currentLayer) {
              this.map.removeLayer(this.tileLayers[this.currentLayer]);
              this.tileLayers[layerKey].addTo(this.map);
              this.currentLayer = layerKey;
              switcherBtns.forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
            }
          });
        });

        // Heat layer (similarity glow) sits under the markers
        this.map.createPane('heatPane');
        this.map.getPane('heatPane').style.zIndex = 350;
        this.map.getPane('heatPane').style.pointerEvents = 'none';
        this.heatLayer = L.layerGroup().addTo(this.map);

        this.markersLayer = L.layerGroup().addTo(this.map);
      } else {
        console.warn('Leaflet library not loaded, using SVG fallback visualizer');
        mapContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-family:var(--font-mono);">Geospatial Map Canvas Active (Standard Remote Sensing Baseline)</div>';
      }
    } catch (e) {
      console.warn('Map initialization failed:', e);
    }
  },

  getFilteredCells() {
    return this.cells.filter(cell => {
      // Target Filter
      if (this.activeTargetFilter !== 'all') {
        if (cell.target_affinity !== 'both' && cell.target_affinity !== this.activeTargetFilter) {
          return false;
        }
      }

      // Terrain Filter
      if (this.activeTerrainFilter !== 'all') {
        if (cell.terrain_type !== this.activeTerrainFilter) {
          return false;
        }
      }

      // Discovery Filter
      if (this.discoveryFilter === 'candidates_only' && !cell.is_candidate) {
        return false;
      }
      if (this.discoveryFilter === 'known_only' && cell.is_candidate) {
        return false;
      }

      return true;
    });
  },

  // Update the banner on top of the map (title + how many sites are shown)
  updateTargetBanner() {
    const lang = this.lang();
    const t = this.activeTargetFilter;
    const b = FINDER_BANNER[t] || FINDER_BANNER.all;
    const n = this.getFilteredCells().length;

    const banner = document.getElementById('mapTargetBanner');
    if (banner) banner.setAttribute('data-body', t);
    const icon = document.getElementById('mapTargetIcon');
    if (icon) icon.textContent = b.icon;
    const title = document.getElementById('mapTargetTitle');
    if (title) title.textContent = b[lang];

    let countText;
    if (lang === 'ar') {
      if (n === 0) countText = 'لا توجد مواقع';
      else if (n === 1) countText = 'موقع واحد';
      else if (n === 2) countText = 'موقعان';
      else if (n <= 10) countText = `${n} مواقع`;
      else countText = `${n} موقعاً`;
    } else {
      countText = n === 1 ? '1 site' : `${n} sites`;
    }
    const count = document.getElementById('mapTargetCount');
    if (count) count.textContent = countText;
  },

  renderMarkers() {
    this.updateTargetBanner();
    if (!this.map || !this.markersLayer) return;
    this.markersLayer.clearLayers();
    if (this.heatLayer) this.heatLayer.clearLayers();

    const filtered = this.getFilteredCells();
    const countBadge = document.getElementById('mapFilteredCount');
    if (countBadge) {
      countBadge.textContent = `${filtered.length} / ${this.cells.length} Sites`;
    }

    const isAr = (window.I18n ? window.I18n.currentLang : 'en') === 'ar';

    filtered.forEach(cell => {
      const isCandidate = cell.is_candidate;
      let score = cell.similarity_score;
      if (window.MissionProfileManager && cell.radar_parameters) {
        score = window.MissionProfileManager.calculateScore(cell.radar_parameters);
      }

      const scoreClass = score >= 88 ? 'high' : 'med';

      // Heat glow: bigger + hotter colour = more similar
      this.drawHeat(cell, score);
      const scoreFormatted = score.toFixed(1) + '%';
      const displayName = isAr ? cell.name_ar : cell.name;
      const displayCountry = isAr ? cell.country_ar : cell.country;

      // Creative High-Tech Sonar Radar Marker with Floating Badge
      let iconHtml = `
        <div class="sonar-pin-container" title="${displayName} (${scoreFormatted})">
          <div class="pin-floating-score ${isCandidate ? 'candidate-badge' : scoreClass}">${scoreFormatted}</div>
          <div class="sonar-wave ${isCandidate ? 'candidate' : 'known'}"></div>
          <div class="pin-core-icon ${isCandidate ? 'candidate' : 'known'}">
            ${isCandidate ? '★' : '◉'}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: iconHtml,
        iconSize: [36, 42],
        iconAnchor: [18, 24]
      });

      const marker = L.marker([cell.lat, cell.lon], { icon: customIcon });

      // Interactive Scientific Tooltip
      marker.bindTooltip(`
        <div style="font-family:var(--font-sans); line-height:1.35; padding:2px;">
          <div style="font-weight:800; color:#ffffff; font-size:0.85rem;">${displayName}</div>
          <div style="color:var(--text-secondary); font-size:0.72rem;">${displayCountry} • (${cell.lat.toFixed(2)}°, ${cell.lon.toFixed(2)}°)</div>
          <div style="margin-top:3px; display:flex; justify-content:space-between; gap:8px;">
            <span style="color:${isCandidate ? '#ffd700' : '#00e5a3'}; font-weight:800;">${isCandidate ? (isAr ? '★ مرشح جديد' : '★ New Candidate') : (isAr ? 'موقع معروف' : 'Known Analog')}</span>
            <span style="font-family:var(--font-mono); font-weight:700; color:var(--accent-cyan);">${scoreFormatted}</span>
          </div>
        </div>
      `, {
        className: 'scientific-tooltip',
        offset: [0, -18],
        direction: 'top'
      });

      marker.on('click', () => {
        this.selectSite(cell);
        if (window.UserSystem) {
          window.UserSystem.discoverSite(cell.id, displayName);
        }
      });

      marker.addTo(this.markersLayer);
    });
  },

  selectSite(cell, openSheet = true) {
    this.selectedSite = cell;
    this.renderSiteDetail(cell);

    if (this.map) {
      this.map.panTo([cell.lat, cell.lon], { animate: true, duration: 0.8 });
    }

    // Award XP via Gamification Engine
    if (window.UserSystem) {
      const isAr = (window.I18n ? window.I18n.currentLang : 'en') === 'ar';
      window.UserSystem.discoverSite(cell.id, isAr ? cell.name_ar : cell.name);
    }

    // On mobile, slide the site card up from the bottom
    if (openSheet && this.isMobile()) {
      this.openSheet('card');
    }
  },

  renderSiteDetail(cell) {
    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    const placeholder = document.getElementById('finderDetailPlaceholder');
    const content = document.getElementById('finderDetailContent');
    if (placeholder) placeholder.style.display = 'none';
    if (content) content.style.display = 'flex';

    // Calculate score based on current weights
    let computedScore = cell.similarity_score;
    if (window.MissionProfileManager && cell.radar_parameters) {
      computedScore = window.MissionProfileManager.calculateScore(cell.radar_parameters);
    }

    // Site Name and Badges
    const nameEl = document.getElementById('detailSiteName');
    const regionEl = document.getElementById('detailSiteRegion');
    const badgeEl = document.getElementById('detailCandidateBadge');

    if (nameEl) nameEl.textContent = isAr ? cell.name_ar : cell.name;
    if (regionEl) regionEl.textContent = `${isAr ? cell.country_ar : cell.country} • (${cell.lat.toFixed(2)}°, ${cell.lon.toFixed(2)}°)`;

    if (badgeEl) {
      if (cell.is_candidate) {
        badgeEl.textContent = isAr ? '★ مرشح جديد' : '★ New Candidate';
        badgeEl.className = 'sci-badge candidate';
      } else {
        badgeEl.textContent = isAr ? '● موقع معروف' : '● Known Historic Analog';
        badgeEl.className = 'sci-badge validated';
      }
    }

    // Score Banner
    const scoreValEl = document.getElementById('detailScoreVal');
    const uncertaintyEl = document.getElementById('detailUncertaintyVal');
    const confidenceEl = document.getElementById('detailConfidenceVal');

    if (scoreValEl) scoreValEl.textContent = `${computedScore.toFixed(1)}%`;
    if (uncertaintyEl) uncertaintyEl.textContent = cell.uncertainty || '±3.5%';
    if (confidenceEl) confidenceEl.textContent = isAr ? cell.confidence_ar : cell.confidence;

    // Bullets: Why It Matches
    const whyMatchesList = document.getElementById('detailWhyMatchesList');
    if (whyMatchesList) {
      const points = isAr ? cell.why_matches_ar : cell.why_matches;
      whyMatchesList.innerHTML = (points || []).map(p => `<li>${p}</li>`).join('');
    }

    // Bullets: Scientific Divergences
    const whyNotList = document.getElementById('detailWhyNotList');
    if (whyNotList) {
      const divergences = isAr ? cell.why_not_ar : cell.why_not;
      whyNotList.innerHTML = (divergences || []).map(d => `<li>${d}</li>`).join('');
    }

    // Render Canvas Radar Chart
    this.renderRadarChart(cell.radar_parameters);

    // Bind Compare & Export buttons
    const compareBtn = document.getElementById('btnDetailCompare');
    if (compareBtn) {
      compareBtn.onclick = () => {
        window.location.href = `compare.html?siteA=${cell.id}`;
      };
    }

    const exportBtn = document.getElementById('btnDetailExport');
    if (exportBtn) {
      exportBtn.onclick = () => {
        window.print();
      };
    }
  },

  renderRadarChart(params) {
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 80;

    ctx.clearRect(0, 0, width, height);

    const axes = [
      { key: 'slope', label: 'Slope', label_ar: 'الانحدار' },
      { key: 'regolith', label: 'Regolith', label_ar: 'الحطام' },
      { key: 'thermal', label: 'Thermal', label_ar: 'القصور' },
      { key: 'radiation', label: 'Radiation', label_ar: 'الإشعاع' },
      { key: 'mineralogy', label: 'Mineral', label_ar: 'المعادن' }
    ];

    const numAxes = axes.length;
    const angleStep = (Math.PI * 2) / numAxes;
    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    // Draw background concentric rings
    ctx.strokeStyle = 'rgba(64, 110, 160, 0.25)';
    ctx.lineWidth = 1;

    for (let r = 20; r <= radius; r += 20) {
      ctx.beginPath();
      for (let i = 0; i < numAxes; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axis lines and labels
    ctx.font = '10px monospace';
    ctx.fillStyle = '#8ea5c0';
    ctx.textAlign = 'center';

    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Label text
      const labelX = centerX + Math.cos(angle) * (radius + 18);
      const labelY = centerY + Math.sin(angle) * (radius + 14);
      const label = isAr ? axes[i].label_ar : axes[i].label;
      ctx.fillText(label, labelX, labelY);
    }

    // Draw radar data polygon
    if (params) {
      ctx.beginPath();
      for (let i = 0; i < numAxes; i++) {
        const val = params[axes[i].key] || 75;
        const r = (val / 100) * radius;
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      ctx.fillStyle = 'rgba(0, 229, 212, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#00e5d4';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw point dots
      for (let i = 0; i < numAxes; i++) {
        const val = params[axes[i].key] || 75;
        const r = (val / 100) * radius;
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    }
  },

  /* ---------- Heat map (similarity glow) ---------- */
  // score 78% or less -> cool blue, ~86% -> yellow, 95% or more -> hot red
  heatColor(score) {
    const t = Math.min(1, Math.max(0, (score - 78) / (95 - 78)));
    const stops = [
      [0.0, [0, 163, 255]],   // blue
      [0.5, [245, 214, 35]],  // yellow
      [1.0, [255, 59, 31]]    // red
    ];
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i][0] && t <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
    }
    const k = (t - a[0]) / ((b[0] - a[0]) || 1);
    const rgb = a[1].map((v, i) => Math.round(v + (b[1][i] - v) * k));
    return { color: `rgb(${rgb.join(',')})`, t };
  },

  drawHeat(cell, score) {
    if (!this.heatLayer || typeof L === 'undefined') return;
    const { color, t } = this.heatColor(score);
    const baseRadius = 22 + t * 30; // pixels
    // 3 soft rings, from wide/faint to small/strong
    [[1.0, 0.14], [0.65, 0.22], [0.35, 0.34]].forEach(([scale, opacity]) => {
      L.circleMarker([cell.lat, cell.lon], {
        pane: 'heatPane',
        radius: baseRadius * scale,
        stroke: false,
        fillColor: color,
        fillOpacity: opacity,
        interactive: false
      }).addTo(this.heatLayer);
    });
  },

  /* ---------- Target-aware criteria ---------- */
  lang() {
    return (window.I18n ? window.I18n.currentLang : 'en') === 'ar' ? 'ar' : 'en';
  },

  // Called when the user picks All / Moon / Mars
  applyTarget(target) {
    this.activeTargetFilter = target;
    const cfg = FINDER_TARGET_CONFIG[target] || FINDER_TARGET_CONFIG.all;
    const mpm = window.MissionProfileManager;

    // If the current profile does not exist for this target, switch to the first one
    if (mpm && !cfg.profiles.includes(mpm.activeProfile)) {
      mpm.setProfile(cfg.profiles[0], false); // fires profileChanged -> map re-renders
    }

    this.updateTerrainChips();
    this.renderCriteria();
    this.renderMarkers();
  },

  // Hide terrain chips that have no sites for the selected target
  updateTerrainChips() {
    const t = this.activeTargetFilter;
    const available = new Set(
      this.cells
        .filter(c => t === 'all' || c.target_affinity === 'both' || c.target_affinity === t)
        .map(c => c.terrain_type)
    );
    document.querySelectorAll('.terrain-chip').forEach(chip => {
      const terrain = chip.getAttribute('data-terrain');
      const show = terrain === 'all' || available.has(terrain);
      chip.style.display = show ? '' : 'none';
      if (!show && chip.classList.contains('active')) {
        chip.classList.remove('active');
        const allChip = document.querySelector('.terrain-chip[data-terrain="all"]');
        if (allChip) allChip.classList.add('active');
        this.activeTerrainFilter = 'all';
      }
    });
  },

  // Draw profile chips + weight sliders for the selected target
  renderCriteria() {
    const lang = this.lang();
    const cfg = FINDER_TARGET_CONFIG[this.activeTargetFilter] || FINDER_TARGET_CONFIG.all;
    const mpm = window.MissionProfileManager;
    if (!mpm) return;

    const title = document.getElementById('finderProfileTitle');
    if (title) title.textContent = FINDER_UI_TEXT.profileTitle[lang];
    const resetBtn = document.getElementById('finderResetWeightsBtn');
    if (resetBtn) resetBtn.textContent = FINDER_UI_TEXT.reset[lang];
    const filtersLabel = document.getElementById('mobileFiltersBtnLabel');
    if (filtersLabel) filtersLabel.textContent = FINDER_UI_TEXT.filters[lang];
    const filtersTitle = document.getElementById('filtersSheetTitle');
    if (filtersTitle) filtersTitle.textContent = FINDER_UI_TEXT.filters[lang];
    const cardTitle = document.getElementById('cardSheetTitle');
    if (cardTitle) cardTitle.textContent = FINDER_UI_TEXT.siteCard[lang];
    const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    setText('targetSelectTitle', FINDER_UI_TEXT.targetTitle[lang]);
    setText('bodyBtnAll', FINDER_UI_TEXT.bodyAll[lang]);
    setText('bodyBtnMoon', FINDER_UI_TEXT.bodyMoon[lang]);
    setText('bodyBtnMars', FINDER_UI_TEXT.bodyMars[lang]);
    setText('layerLabelSatellite', FINDER_UI_TEXT.layerSatellite[lang]);
    setText('layerLabelTopo', FINDER_UI_TEXT.layerTopo[lang]);
    setText('layerLabelDark', FINDER_UI_TEXT.layerDark[lang]);
    setText('heatLegendTitle', FINDER_UI_TEXT.heatLegend[lang]);
    setText('heatLegendLow', FINDER_UI_TEXT.heatLow[lang]);
    setText('heatLegendHigh', FINDER_UI_TEXT.heatHigh[lang]);
    const hint = document.getElementById('finderTargetHint');
    if (hint) hint.textContent = cfg.hint[lang];

    // Profile chips
    const chipsBox = document.getElementById('finderProfileChips');
    if (chipsBox) {
      chipsBox.innerHTML = '';
      cfg.profiles.forEach(id => {
        const btn = document.createElement('button');
        btn.className = 'finder-profile-chip';
        btn.setAttribute('data-profile', id);
        btn.textContent = (mpm.profileLabels[lang] && mpm.profileLabels[lang][id]) || id;
        btn.addEventListener('click', () => mpm.setProfile(id, false));
        chipsBox.appendChild(btn);
      });
    }

    // Weight sliders
    const slidersBox = document.getElementById('finderWeightSliders');
    if (slidersBox) {
      slidersBox.innerHTML = '';
      Object.keys(cfg.criteria).forEach(key => {
        const group = document.createElement('div');
        group.className = 'weight-slider-group';
        group.innerHTML = `
          <div class="weight-slider-header">
            <span>${cfg.criteria[key][lang]}</span>
            <span class="weight-val" id="finderWeightVal_${key}"></span>
          </div>
          <input type="range" class="weight-slider" id="finderWeightSlider_${key}"
                 min="0.05" max="0.70" step="0.05">`;
        slidersBox.appendChild(group);
        group.querySelector('input').addEventListener('input', (e) => {
          mpm.setWeight(key, e.target.value); // fires profileChanged -> map re-renders
        });
      });
    }

    this.syncCriteriaUI();
  },

  // Keep chips & sliders in sync with the current profile/weights
  syncCriteriaUI() {
    const mpm = window.MissionProfileManager;
    if (!mpm) return;
    document.querySelectorAll('.finder-profile-chip').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-profile') === mpm.activeProfile);
    });
    Object.entries(mpm.weights).forEach(([key, val]) => {
      const slider = document.getElementById(`finderWeightSlider_${key}`);
      const readout = document.getElementById(`finderWeightVal_${key}`);
      if (slider) slider.value = val;
      if (readout) readout.textContent = `${Math.round(val * 100)}%`;
    });
  },

  /* ---------- Mobile bottom sheets (filters + site card) ---------- */
  isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
  },

  // which: 'filters' or 'card'. Only one sheet is open at a time.
  openSheet(which) {
    const filters = document.querySelector('.finder-left-panel');
    const card = document.querySelector('.finder-right-panel');
    const backdrop = document.getElementById('finderSheetBackdrop');
    if (filters) filters.classList.toggle('sheet-open', which === 'filters');
    if (card) card.classList.toggle('sheet-expanded', which === 'card');
    const anyOpen = which === 'filters' || which === 'card';
    if (backdrop) backdrop.classList.toggle('show', anyOpen);
    document.body.classList.toggle('finder-sheet-open', anyOpen);
  },

  closeSheets() {
    this.openSheet(null);
  },

  bindMobileSheets() {
    const filtersBtn = document.getElementById('mobileFiltersBtn');
    if (filtersBtn) filtersBtn.addEventListener('click', () => this.openSheet('filters'));

    const filtersClose = document.getElementById('filtersSheetClose');
    if (filtersClose) filtersClose.addEventListener('click', () => this.closeSheets());

    const cardHeader = document.getElementById('cardSheetHeader');
    if (cardHeader) {
      cardHeader.addEventListener('click', () => {
        const card = document.querySelector('.finder-right-panel');
        const isOpen = card && card.classList.contains('sheet-expanded');
        this.openSheet(isOpen ? null : 'card');
      });
    }

    const backdrop = document.getElementById('finderSheetBackdrop');
    if (backdrop) backdrop.addEventListener('click', () => this.closeSheets());

    // Guided tour: on mobile, open the sheet that the current step explains
    document.addEventListener('tourStepChange', (e) => {
      if (!this.isMobile()) return;
      const target = e.detail && e.detail.target;
      if (target === '#finderCriteriaSpotlight') this.openSheet('filters');
      else if (target === '#finderDetailSpotlight') this.openSheet('card');
      else this.closeSheets();
    });
    document.addEventListener('tourEnded', () => {
      if (this.isMobile()) this.closeSheets();
    });

    // Leaving mobile size (e.g. rotating a tablet) -> reset sheets
    window.matchMedia('(max-width: 768px)').addEventListener('change', () => this.closeSheets());
  },

  bindFilters() {
    const finderReset = document.getElementById('finderResetWeightsBtn');
    if (finderReset && window.MissionProfileManager) {
      finderReset.addEventListener('click', () => window.MissionProfileManager.resetCurrentWeights());
    }
    // Target Body Switcher
    document.querySelectorAll('.body-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.body-toggle-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.applyTarget(e.currentTarget.getAttribute('data-body'));
      });
    });

    // Terrain Chips
    document.querySelectorAll('.terrain-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.terrain-chip').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeTerrainFilter = e.currentTarget.getAttribute('data-terrain');
        this.renderMarkers();
      });
    });

    // Discovery Radio Switch
    document.querySelectorAll('input[name="discoveryFilter"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.discoveryFilter = e.target.value;
        this.renderMarkers();
      });
    });
  }
};

window.SiteFinder = SiteFinder;
