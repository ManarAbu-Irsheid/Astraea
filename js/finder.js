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
    this.renderMarkers();

    // Default select first site (e.g. Yungay or Al-Labbah)
    if (this.cells.length > 0) {
      this.selectSite(this.cells[0]);
    }

    document.addEventListener('languageChanged', () => {
      this.renderMarkers();
      if (this.selectedSite) this.renderSiteDetail(this.selectedSite);
    });

    document.addEventListener('profileChanged', () => {
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

        L.control.zoom({ position: 'topright' }).addTo(this.map);

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

  renderMarkers() {
    if (!this.map || !this.markersLayer) return;
    this.markersLayer.clearLayers();

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

  selectSite(cell) {
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

    // Expand mobile bottom sheet if on mobile view
    const rightPanel = document.querySelector('.finder-right-panel');
    if (rightPanel) {
      rightPanel.classList.add('sheet-expanded');
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

  bindFilters() {
    // Target Body Switcher
    document.querySelectorAll('.body-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.body-toggle-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeTargetFilter = e.currentTarget.getAttribute('data-body');
        this.renderMarkers();
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
