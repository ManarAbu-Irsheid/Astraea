/**
 * TerraTwin - Page 2: Site Finder Controller
 *
 * Data: data/terratwin-real.js  (generated from "final data.xlsx" by tools/build-finder-data.py)
 *   - 44 Earth analog sites that passed the NDVI gate (negative controls removed)
 *   - all 31 Mars + 30 Moon sites (6+6 "featured" = the ones in the algorithm sheets)
 * Score: TASI (the team's method) — see MissionProfileManager.calculateTASI in js/profile.js
 *
 * Layout: criteria (left) · Leaflet map with heat glow (center) · site card (right)
 * Mobile: filters and site card become bottom sheets.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await window.App.init('finder');

  const data = window.TERRATWIN_REAL;
  if (!data) {
    console.error('Real dataset (data/terratwin-real.js) is missing for Finder');
    return;
  }
  SiteFinder.init(data);
});

/* ---------- All page texts (EN / AR) ---------- */
const FINDER_TEXT = {
  en: {
    targetTitle: 'Find Earth sites similar to',
    moon: '🌕 Moon', mars: '🔴 Mars', both: 'Both',
    refLabel: 'Reference site',
    refBest: (body, n) => body === 'both' ? `Best match among all ${n} Moon & Mars sites` : `Best match among all ${n} ${body === 'moon' ? 'Moon' : 'Mars'} sites`,
    groupMars: 'Mars', groupMoon: 'Moon',
    groupFeatured: (b) => `${b} · famous landing sites`,
    groupOther: (b) => `${b} · all other sites`,
    refBestDesc: 'Each Earth site is compared with every site on the list and takes its closest match.',
    activeWeights: 'Active Mission Weights',
    editHint: 'Change the mission or weights from the profile menu at the top ↑',
    moonNoThermal: 'On the Moon, temperature is not compared (vacuum).',
    landingHint: 'Landing Site: steep sites (> 12°) are hidden — unsafe for landing.',
    banner: (body, ref) => ref ? `Earth sites similar to ${ref}` : `Earth sites similar to ${body === 'both' ? 'the Moon & Mars' : body === 'moon' ? 'the Moon' : 'Mars'}`,
    closerTo: (b, bt, bs, o, ot, os) => `Closer to ${b === 'moon' ? 'the Moon' : 'Mars'} (${bt} ${bs}%) than to ${o === 'moon' ? 'the Moon' : 'Mars'} (${ot} ${os}%)`,
    sites: (n) => n === 1 ? '1 site' : `${n} sites`,
    similarCount: (n, total) => `${n} of ${total} sites ≥ 90% similar`,
    closestTitle: (ref) => ref ? `Closest on Earth to ${ref}` : 'Top matches on Earth',
    bestLine: (name, score) => `Best: ${name} ${score}%`,
    filters: 'Filters', siteCard: 'Site Card',
    satellite: 'Satellite', topo: 'Topography',
    heatLegend: 'Glow = similarity', low: 'Low', high: 'High',
    legendCandidate: 'New candidate', legendKnown: 'Known (official) analog',
    candidate: '★ New Candidate', known: '● Known Analog',
    vs: (t, body) => `vs ${t} (${body === 'moon' ? 'Moon' : 'Mars'})`,
    uncertainty: (u) => `±${u.toFixed(1)}% if weights change ±25%`,
    conf: { high: 'HIGH CONFIDENCE', medium: 'MEDIUM CONFIDENCE', low: 'LOW CONFIDENCE' },
    mostSimilar: 'Most similar to',
    radarTitle: 'Match per criterion',
    whyMatches: 'Why it matches',
    whyNot: 'Why not / differences',
    facts: 'Site facts',
    factLabels: {
      region: 'Location', elevation: 'Elevation', temp: 'Surface temperature',
      slope: 'Slope', roughness: 'Roughness', albedo: 'Albedo',
      env: 'Environment', ndvi: 'NDVI (vegetation)'
    },
    ndviPassed: 'passed gate (≤ 0.20)',
    crit: { slope: 'Slope', roughness: 'Roughness', albedo: 'Albedo', thermal: 'Thermal swing' },
    more: { slope: 'steeper', roughness: 'rougher', albedo: 'brighter', thermal: 'bigger temperature swing' },
    less: { slope: 'flatter', roughness: 'smoother', albedo: 'darker', thermal: 'smaller temperature swing' },
    matchLine: (c, sim, ev, tv, t) => `${c}: ${sim}% match — ${ev} here vs ${tv} at ${t}`,
    notLine: (c, sim, dir, ev, tv, t) => `${c}: only ${sim}% — this site is ${dir} (${ev} vs ${tv} at ${t})`,
    moonThermal: (ev, tv) => `Temperature is not compared for the Moon (vacuum): ${ev} swing here vs ${tv} on the Moon.`,
    bodyLimit: {
      mars: 'Earth has 1 g gravity and thick air; Mars has 0.38 g and ~1% of Earth\'s air pressure.',
      moon: 'Earth has 1 g gravity and air; the Moon has 0.16 g and no atmosphere (vacuum).'
    }
  },
  ar: {
    targetTitle: 'ابحث عن أماكن على الأرض تشبه',
    moon: '🌕 القمر', mars: '🔴 المريخ', both: 'الاثنين',
    refLabel: 'المكان المرجعي',
    refBest: (body, n) => body === 'both' ? `الأقرب من بين ${n} موقعاً على القمر والمريخ` : `الأقرب من بين ${n} موقعاً على ${body === 'moon' ? 'القمر' : 'المريخ'}`,
    groupMars: 'المريخ', groupMoon: 'القمر',
    groupFeatured: (b) => `${b} · أماكن هبوط مشهورة`,
    groupOther: (b) => `${b} · باقي المواقع`,
    refBestDesc: 'كل موقع على الأرض يُقارن بكل المواقع في القائمة ويأخذ الأقرب له.',
    activeWeights: 'أوزان المهمة الحالية',
    editHint: 'غيّر نوع المهمة أو الأوزان من قائمة المهمة في الأعلى ↑',
    moonNoThermal: 'على القمر لا تُقارن الحرارة (لا يوجد غلاف جوي).',
    landingHint: 'موقع الهبوط: المواقع شديدة الانحدار (أكثر من 12°) مخفية لأنها غير آمنة للهبوط.',
    banner: (body, ref) => ref ? `أماكن على الأرض تشبه ${ref}` : `أماكن على الأرض تشبه ${body === 'both' ? 'القمر والمريخ' : body === 'moon' ? 'القمر' : 'المريخ'}`,
    closerTo: (b, bt, bs, o, ot, os) => `أقرب إلى ${b === 'moon' ? 'القمر' : 'المريخ'} (${bt} ${bs}%) منه إلى ${o === 'moon' ? 'القمر' : 'المريخ'} (${ot} ${os}%)`,
    sites: (n) => n === 0 ? 'لا توجد مواقع' : n === 1 ? 'موقع واحد' : n === 2 ? 'موقعان' : n <= 10 ? `${n} مواقع` : `${n} موقعاً`,
    similarCount: (n, total) => `${n} من ${total} موقعاً بتشابه 90% أو أكثر`,
    closestTitle: (ref) => ref ? `أقرب الأماكن على الأرض إلى ${ref}` : 'أعلى الأماكن تشابهاً على الأرض',
    bestLine: (name, score) => `الأعلى: ${name} ${score}%`,
    filters: 'الفلاتر', siteCard: 'بطاقة الموقع',
    satellite: 'قمر صناعي', topo: 'تضاريس',
    heatLegend: 'التوهج = نسبة التشابه', low: 'أقل', high: 'أعلى',
    legendCandidate: 'مرشح جديد', legendKnown: 'موقع معروف (رسمي)',
    candidate: '★ مرشح جديد', known: '● موقع معروف',
    vs: (t, body) => `مقارنة مع ${t} (${body === 'moon' ? 'القمر' : 'المريخ'})`,
    uncertainty: (u) => `±${u.toFixed(1)}% إذا تغيرت الأوزان ±25%`,
    conf: { high: 'ثقة عالية', medium: 'ثقة متوسطة', low: 'ثقة منخفضة' },
    mostSimilar: 'يشبه أكثر',
    radarTitle: 'التطابق لكل معيار',
    whyMatches: 'لماذا يشبه',
    whyNot: 'لماذا لا / الاختلافات',
    facts: 'معلومات الموقع',
    factLabels: {
      region: 'الموقع', elevation: 'الارتفاع', temp: 'حرارة السطح',
      slope: 'الانحدار', roughness: 'الخشونة', albedo: 'السطوع (الألبيدو)',
      env: 'نوع البيئة', ndvi: 'NDVI (الغطاء النباتي)'
    },
    ndviPassed: 'اجتاز الفحص (≤ 0.20)',
    crit: { slope: 'الانحدار', roughness: 'الخشونة', albedo: 'السطوع', thermal: 'فرق الحرارة' },
    more: { slope: 'أشد انحداراً', roughness: 'أكثر خشونة', albedo: 'أكثر سطوعاً', thermal: 'فرق حرارته أكبر' },
    less: { slope: 'أكثر استواءً', roughness: 'أنعم', albedo: 'أغمق', thermal: 'فرق حرارته أصغر' },
    matchLine: (c, sim, ev, tv, t) => `${c}: تطابق ${sim}% — ${ev} هنا مقابل ${tv} في ${t}`,
    notLine: (c, sim, dir, ev, tv, t) => `${c}: ${sim}% فقط — هذا الموقع ${dir} (${ev} مقابل ${tv} في ${t})`,
    moonThermal: (ev, tv) => `لا تُقارن الحرارة مع القمر (فراغ): فرق الحرارة هنا ${ev} مقابل ${tv} على القمر.`,
    bodyLimit: {
      mars: 'جاذبية الأرض 1g وهواؤها كثيف؛ جاذبية المريخ 0.38g وضغط هوائه حوالي 1% من الأرض.',
      moon: 'جاذبية الأرض 1g ولها غلاف جوي؛ جاذبية القمر 0.16g ولا يوجد غلاف جوي (فراغ).'
    }
  }
};

const SiteFinder = {
  sites: [],
  targets: { mars: [], moon: [] },
  body: 'mars',            // 'mars' | 'moon'
  referenceId: 'best',     // 'best' or a target id
  activeTerrainFilter: 'all',
  discoveryFilter: 'all',  // 'all' | 'candidates_only' | 'known_only'
  selectedSite: null,
  map: null,
  markersLayer: null,
  heatLayer: null,
  tileLayers: {},
  currentLayer: 'satellite',

  init(data) {
    this.sites = data.earth;
    this.targets = data.targets;

    this.initMap();
    this.bindFilters();
    this.bindMobileSheets();

    // Link from the Home page: finder.html?ref=Jezero  (or ?ref=Shackleton, ?body=moon ...)
    const params = new URLSearchParams(window.location.search);
    const refParam = (params.get('ref') || '').toLowerCase();
    const fromLink = refParam && ['mars', 'moon']
      .map(b => ({ b, t: (this.targets[b] || []).find(x => refParam.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(refParam)) }))
      .find(x => x.t);
    if (fromLink) {
      this.applyBody(fromLink.b, fromLink.t.id);
    } else {
      const bodyParam = params.get('body');
      this.applyBody(['mars', 'moon', 'both'].includes(bodyParam) ? bodyParam : this.body);
    }

    // Select the best-matching site by default (card stays closed on mobile)
    const ranked = this.getFilteredSites().map(s => ({ s, r: this.scoreSite(s) })).sort((a, b) => b.r.score - a.r.score);
    if (ranked.length) this.selectSite(ranked[0].s, false);

    document.addEventListener('languageChanged', () => this.refreshAll());
    document.addEventListener('profileChanged', () => this.refreshAll());
  },

  t() { return FINDER_TEXT[this.lang()]; },
  lang() { return (window.I18n ? window.I18n.currentLang : 'en') === 'ar' ? 'ar' : 'en'; },
  mpm() { return window.MissionProfileManager; },

  refreshAll() {
    this.renderStaticTexts();
    this.renderReferenceSelect();
    this.renderActiveWeights();
    this.renderMarkers();
    if (this.selectedSite) this.renderSiteDetail(this.selectedSite);
  },

  /* ---------- Scoring ---------- */
  getTargetList() {
    if (this.body === 'both') return [...(this.targets.mars || []), ...(this.targets.moon || [])];
    return this.targets[this.body] || [];
  },

  // 'mars-1' -> 'mars', 'moon-27' -> 'moon'
  bodyOf(target) { return String(target.id).split('-')[0]; },
  bodyIcon(body) { return body === 'moon' ? '🌕' : '🔴'; },

  // Score one Earth site against the reference (or its best match among the 6 targets)
  scoreSite(site, weights) {
    const mpm = this.mpm();
    const list = this.getTargetList();
    const pool = this.referenceId === 'best' ? list : list.filter(t => t.id === this.referenceId);
    let best = null;
    pool.forEach(t => {
      const r = mpm.calculateTASI(site.f, t.f, this.bodyOf(t), weights);
      if (!best || r.score > best.score) best = { ...r, target: t };
    });
    return best;
  },

  // Uncertainty = biggest change in score when any weight moves ±25% (rank-stability test)
  scoreUncertainty(site) {
    const mpm = this.mpm();
    const base = this.scoreSite(site).score;
    let maxDelta = 0;
    mpm.CRITERIA.forEach(k => {
      [0.75, 1.25].forEach(f => {
        const w = { ...mpm.weights, [k]: mpm.weights[k] * f };
        maxDelta = Math.max(maxDelta, Math.abs(this.scoreSite(site, w).score - base));
      });
    });
    return maxDelta;
  },

  /* ---------- Map ---------- */
  initMap() {
    const mapContainer = document.getElementById('leafletMap');
    if (!mapContainer) return;

    try {
      if (typeof L !== 'undefined') {
        this.map = L.map('leafletMap', {
          center: [20, 10],
          zoom: 2.3,
          minZoom: 1.8,
          maxZoom: 18,
          zoomControl: false
        });

        L.control.zoom({ position: 'bottomleft' }).addTo(this.map);

        // Real satellite imagery (ESRI) + place labels
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

        // Terrain relief
        this.tileLayers.topo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; USGS, NOAA',
          maxZoom: 18
        });

        this.tileLayers.satellite.addTo(this.map);
        this.currentLayer = 'satellite';

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
        console.warn('Leaflet library not loaded');
        mapContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-family:var(--font-mono);">Map could not load (no internet connection?)</div>';
      }
    } catch (e) {
      console.warn('Map initialization failed:', e);
    }
  },

  getFilteredSites() {
    const mpm = this.mpm();
    return this.sites.filter(site => {
      if (this.activeTerrainFilter !== 'all' && site.terrain !== this.activeTerrainFilter) return false;
      if (this.discoveryFilter === 'candidates_only' && site.is_official) return false;
      if (this.discoveryFilter === 'known_only' && !site.is_official) return false;
      // Landing Site profile: steep slopes are unsafe -> hidden
      if (mpm && mpm.activeProfile === 'landing' && String(site.slope_class).startsWith('Steep')) return false;
      return true;
    });
  },

  // Banner on top of the map: what is shown + how many are really similar (≥ 90%) + the best one
  updateTargetBanner(scored) {
    const t = this.t();
    const ref = this.referenceId === 'best' ? null : (this.getTargetList().find(x => x.id === this.referenceId) || {}).name;
    const banner = document.getElementById('mapTargetBanner');
    if (banner) banner.setAttribute('data-body', this.body);
    const icon = document.getElementById('mapTargetIcon');
    if (icon) icon.textContent = this.body === 'both' ? '🌍' : this.bodyIcon(this.body);
    const title = document.getElementById('mapTargetTitle');
    if (title) title.textContent = t.banner(this.body, ref);

    this.renderClosestList(scored, ref);

    const similar = scored.filter(x => x.score >= 90).length;
    const best = scored.reduce((a, x) => (!a || x.score > a.score ? x : a), null);
    const parts = [t.similarCount(similar, scored.length)];
    if (best) parts.push(t.bestLine(best.site.name, best.score.toFixed(1)));
    const countEl = document.getElementById('mapTargetCount');
    if (countEl) countEl.textContent = parts.join(' · ');
  },

  // Left panel: the 5 Earth sites closest to the reference (click = open its card)
  renderClosestList(scored, ref) {
    const t = this.t();
    const titleEl = document.getElementById('closestEarthTitle');
    if (titleEl) titleEl.textContent = t.closestTitle(ref);
    const list = document.getElementById('closestEarthList');
    if (!list) return;
    const top = [...scored].sort((a, b) => b.score - a.score).slice(0, 5);
    list.innerHTML = top.map(({ site, score }) => `
      <li>
        <button class="closest-earth-item ${this.selectedSite && this.selectedSite.id === site.id ? 'active' : ''}" data-site="${site.id}">
          <span class="closest-earth-name">${site.is_official ? '●' : '★'} ${site.name}</span>
          <span class="closest-earth-score">${score.toFixed(1)}%</span>
        </button>
      </li>`).join('');
    list.querySelectorAll('.closest-earth-item').forEach(btn => {
      btn.onclick = () => {
        const site = this.sites.find(x => x.id === btn.getAttribute('data-site'));
        if (site) {
          this.selectSite(site);
          list.querySelectorAll('.closest-earth-item').forEach(b => b.classList.toggle('active', b === btn));
        }
      };
    });
  },

  renderMarkers() {
    const filtered = this.getFilteredSites();
    this.updateTargetBanner(filtered.map(site => ({ site, score: this.scoreSite(site).score })));
    if (!this.map || !this.markersLayer) return;
    this.markersLayer.clearLayers();
    if (this.heatLayer) this.heatLayer.clearLayers();

    const t = this.t();

    filtered.forEach(site => {
      const isCandidate = !site.is_official;
      const result = this.scoreSite(site);
      const score = result.score;
      const scoreClass = score >= 85 ? 'high' : 'med';
      const scoreFormatted = score.toFixed(1) + '%';

      this.drawHeat(site, score);

      const iconHtml = `
        <div class="sonar-pin-container" title="${site.name} (${scoreFormatted})">
          <div class="pin-floating-score ${isCandidate ? 'candidate-badge' : scoreClass}">${scoreFormatted}</div>
          <div class="sonar-wave ${isCandidate ? 'candidate' : 'known'}"></div>
          <div class="pin-core-icon ${isCandidate ? 'candidate' : 'known'}">
            ${isCandidate ? '★' : '◉'}
          </div>
        </div>
      `;

      const marker = L.marker([site.lat, site.lon], {
        icon: L.divIcon({ className: 'custom-leaflet-marker', html: iconHtml, iconSize: [36, 42], iconAnchor: [18, 24] })
      });

      marker.bindTooltip(`
        <div style="font-family:var(--font-sans); line-height:1.35; padding:2px;">
          <div style="font-weight:800; color:#ffffff; font-size:0.85rem;">${site.name}</div>
          <div style="color:var(--text-secondary); font-size:0.72rem;">${site.region} • (${site.lat.toFixed(2)}°, ${site.lon.toFixed(2)}°)</div>
          <div style="margin-top:3px; display:flex; justify-content:space-between; gap:8px;">
            <span style="color:${isCandidate ? '#ffd700' : '#00e5a3'}; font-weight:800;">${isCandidate ? t.candidate : t.known}</span>
            <span style="font-family:var(--font-mono); font-weight:700; color:var(--accent-cyan);">${scoreFormatted}</span>
          </div>
          <div style="color:var(--text-secondary); font-size:0.7rem;">${t.vs(result.target.name, this.bodyOf(result.target))}</div>
        </div>
      `, { className: 'scientific-tooltip', offset: [0, -18], direction: 'top' });

      marker.on('click', () => this.selectSite(site));
      marker.addTo(this.markersLayer);
    });
  },

  // A classic map pin (like a "dropped location") above the selected site
  showSelectedPin(site) {
    if (!this.map || typeof L === 'undefined') return;
    if (this.selectedPin) this.map.removeLayer(this.selectedPin);
    const pinSvg = `
      <svg class="selected-pin-svg" viewBox="0 0 32 44" width="32" height="44" aria-hidden="true">
        <path d="M16 0C7.2 0 0 7.1 0 15.9 0 27.8 16 44 16 44s16-16.2 16-28.1C32 7.1 24.8 0 16 0z" fill="#ff3b30" stroke="#ffffff" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="#ffffff"/>
      </svg>`;
    this.selectedPin = L.marker([site.lat, site.lon], {
      icon: L.divIcon({ className: 'selected-site-pin', html: pinSvg, iconSize: [32, 44], iconAnchor: [16, 44] }),
      zIndexOffset: 10000,
      interactive: false,
      keyboard: false
    }).addTo(this.map);
  },

  /* ---------- Heat map (similarity glow) ---------- */
  // 50% or less -> cool blue, ~72% -> yellow, 95% or more -> hot red
  heatColor(score) {
    const t = Math.min(1, Math.max(0, (score - 50) / (95 - 50)));
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

  drawHeat(site, score) {
    if (!this.heatLayer || typeof L === 'undefined') return;
    const { color, t } = this.heatColor(score);
    const baseRadius = 22 + t * 30; // pixels
    [[1.0, 0.14], [0.65, 0.22], [0.35, 0.34]].forEach(([scale, opacity]) => {
      L.circleMarker([site.lat, site.lon], {
        pane: 'heatPane',
        radius: baseRadius * scale,
        stroke: false,
        fillColor: color,
        fillOpacity: opacity,
        interactive: false
      }).addTo(this.heatLayer);
    });
  },

  /* ---------- Left panel ---------- */
  // Default reference when the page opens or the body changes:
  // Mars -> Jezero (Perseverance), Moon -> Shackleton (Artemis), Both -> best match overall
  DEFAULT_REFERENCE: { mars: 'Jezero', moon: 'Shackleton' },

  applyBody(body, referenceId) {
    this.body = body;
    const def = (this.targets[body] || []).find(x => x.name === this.DEFAULT_REFERENCE[body]);
    this.referenceId = referenceId || (def ? def.id : 'best');
    document.querySelectorAll('.body-toggle-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-body') === body);
    });
    // Header profile menu: hide profiles that don't apply (e.g. Habitat & Thermal on the Moon)
    if (this.mpm()) this.mpm().setAvailableForBody(body === 'both' ? null : body);
    this.refreshAll();
  },

  renderStaticTexts() {
    const t = this.t();
    const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    setText('targetSelectTitle', t.targetTitle);
    setText('bodyBtnMoon', t.moon);
    setText('bodyBtnMars', t.mars);
    setText('bodyBtnBoth', t.both);
    setText('referenceSiteLabel', t.refLabel);
    setText('activeWeightsTitle', t.activeWeights);
    setText('mobileFiltersBtnLabel', t.filters);
    setText('filtersSheetTitle', t.filters);
    setText('cardSheetTitle', t.siteCard);
    setText('layerLabelSatellite', t.satellite);
    setText('layerLabelTopo', t.topo);
    setText('heatLegendTitle', t.heatLegend);
    setText('heatLegendLow', t.low);
    setText('heatLegendHigh', t.high);
    setText('legendCandidate', t.legendCandidate);
    setText('legendKnown', t.legendKnown);
    setText('mostSimilarTitle', t.mostSimilar);
    setText('radarTitle', t.radarTitle);
    setText('whyMatchesTitle', t.whyMatches);
    setText('whyNotTitle', t.whyNot);
    setText('siteFactsTitle', t.facts);
  },

  renderReferenceSelect() {
    const t = this.t();
    const select = document.getElementById('referenceSiteSelect');
    if (!select) return;
    const list = this.getTargetList();
    const opts = (arr) => arr.map(x => `<option value="${x.id}">${x.name}</option>`).join('');
    // Famous landing sites first, then every other site of that body
    const groups = (b) => {
      const label = `${this.bodyIcon(b)} ${b === 'moon' ? t.groupMoon : t.groupMars}`;
      const arr = this.targets[b] || [];
      return `<optgroup label="${t.groupFeatured(label)}">${opts(arr.filter(x => x.featured))}</optgroup>` +
             `<optgroup label="${t.groupOther(label)}">${opts(arr.filter(x => !x.featured))}</optgroup>`;
    };
    const bodies = this.body === 'both' ? ['mars', 'moon'] : [this.body];
    select.innerHTML = `<option value="best">${t.refBest(this.body, list.length)}</option>` + bodies.map(groups).join('');
    select.value = this.referenceId;

    const desc = document.getElementById('referenceSiteDesc');
    if (desc) {
      const target = list.find(x => x.id === this.referenceId);
      desc.textContent = target ? target.description : t.refBestDesc;
    }
  },

  renderActiveWeights() {
    const mpm = this.mpm();
    if (!mpm) return;
    const t = this.t();
    const lang = this.lang();

    const nameEl = document.getElementById('activeProfileName');
    if (nameEl) nameEl.textContent = mpm.label(mpm.activeProfile);

    const keys = this.body === 'moon' ? ['slope', 'roughness', 'albedo'] : mpm.CRITERIA;
    const pills = document.getElementById('activeWeightsPills');
    if (pills) {
      pills.innerHTML = keys.map(k => `
        <div class="weight-mini-pill">
          <span>${mpm.criteriaLabels[lang][k]}</span>
          <span class="weight-mini-val">${Math.round(mpm.weights[k] * 100)}%</span>
        </div>`).join('');
    }

    const hint = document.getElementById('editWeightsHint');
    if (hint) {
      const extra = [];
      if (this.body !== 'mars') extra.push(t.moonNoThermal);
      if (mpm.activeProfile === 'landing') extra.push(t.landingHint);
      hint.innerHTML = [t.editHint, ...extra].map(x => `<span>${x}</span>`).join('<br>');
    }
  },

  /* ---------- Site card ---------- */
  selectSite(site, openSheet = true) {
    this.selectedSite = site;
    this.renderSiteDetail(site);
    this.showSelectedPin(site);

    if (this.map) this.map.panTo([site.lat, site.lon], { animate: true, duration: 0.8 });
    if (window.UserSystem) window.UserSystem.discoverSite(site.id, site.name);

    // On mobile, slide the site card up from the bottom
    if (openSheet && this.isMobile()) this.openSheet('card');
  },

  fmt: {
    slope: (s) => `${s.slope_deg}°`,
    roughness: (s) => `${s.roughness_m} m`,
    albedo: (s) => `${s.albedo}`,
    thermal: (s) => `${s.temp_swing_C}°C`
  },

  renderSiteDetail(site) {
    const t = this.t();
    const mpm = this.mpm();

    const placeholder = document.getElementById('finderDetailPlaceholder');
    const content = document.getElementById('finderDetailContent');
    if (placeholder) placeholder.style.display = 'none';
    if (content) content.style.display = 'flex';

    const result = this.scoreSite(site);
    const target = result.target;
    const unc = this.scoreUncertainty(site);

    // Header
    const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    setText('detailSiteName', site.name);
    setText('detailSiteRegion', `${site.region} • (${site.lat.toFixed(2)}°, ${site.lon.toFixed(2)}°)`);
    const badgeEl = document.getElementById('detailCandidateBadge');
    if (badgeEl) {
      badgeEl.textContent = site.is_official ? t.known : t.candidate;
      badgeEl.className = site.is_official ? 'sci-badge validated' : 'sci-badge candidate';
    }

    // Score + uncertainty + confidence
    setText('detailScoreVal', `${result.score.toFixed(1)}%`);
    const tBody = this.bodyOf(target);
    setText('detailUncertaintyVal', `${t.vs(target.name, tBody)} · ${t.uncertainty(unc)}`);
    const confKey = unc <= 2 ? 'high' : unc <= 4 ? 'medium' : 'low';
    setText('detailConfidenceVal', t.conf[confKey]);

    // Most similar: top 3 of the 6 reference sites (with current weights)
    const ranked = this.getTargetList()
      .map(x => ({ x, s: mpm.calculateTASI(site.f, x.f, this.bodyOf(x)).score }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);
    const mostEl = document.getElementById('mostSimilarList');
    if (mostEl) {
      mostEl.innerHTML = ranked.map(({ x, s }) => `
        <li>
          <button class="most-similar-item ${x.id === target.id ? 'active' : ''}" data-target="${x.id}" title="${x.description}">
            <span class="most-similar-name">${this.bodyIcon(this.bodyOf(x))} ${x.name}</span>
            <span class="most-similar-score">${s.toFixed(1)}%</span>
          </button>
        </li>`).join('');
      // Click -> use it as the reference site
      mostEl.querySelectorAll('.most-similar-item').forEach(btn => {
        btn.onclick = () => this.setReference(btn.getAttribute('data-target'));
      });
    }

    // Radar: match % per criterion
    this.renderRadarChart(result.perCriterion, result.keys);

    // Why it matches / why not — written from the real numbers
    const matches = [], diffs = [];
    result.keys.forEach(k => {
      const sim = Math.round(result.perCriterion[k]);
      const ev = this.fmt[k](site), tv = this.fmt[k](target);
      if (sim >= 80) {
        matches.push({ sim, text: t.matchLine(t.crit[k], sim, ev, tv, target.name) });
      } else {
        const dir = site.f[k] > target.f[k] ? t.more[k] : t.less[k];
        diffs.push({ sim, text: t.notLine(t.crit[k], sim, dir, ev, tv, target.name) });
      }
    });
    // Nothing above 80%? still show the closest criterion
    if (!matches.length && diffs.length) {
      const best = result.keys.reduce((a, k) => (result.perCriterion[k] > result.perCriterion[a] ? k : a), result.keys[0]);
      const sim = Math.round(result.perCriterion[best]);
      matches.push({ sim, text: t.matchLine(t.crit[best], sim, this.fmt[best](site), this.fmt[best](target), target.name) });
      const idx = diffs.findIndex(d => d.text.startsWith(t.crit[best]));
      if (idx >= 0) diffs.splice(idx, 1);
    }
    matches.sort((a, b) => b.sim - a.sim);
    diffs.sort((a, b) => a.sim - b.sim);
    if (tBody === 'moon') diffs.push({ text: t.moonThermal(this.fmt.thermal(site), this.fmt.thermal(target)) });
    diffs.push({ text: t.bodyLimit[tBody] });

    // "Both": say which world this Earth site resembles more
    if (this.body === 'both') {
      const bestOf = (b) => this.targets[b]
        .map(x => ({ x, s: mpm.calculateTASI(site.f, x.f, b).score }))
        .sort((a, c) => c.s - a.s)[0];
      const m = bestOf('mars'), n = bestOf('moon');
      const [w, l, wb, lb] = m.s >= n.s ? [m, n, 'mars', 'moon'] : [n, m, 'moon', 'mars'];
      matches.unshift({ sim: 999, text: `<strong>${t.closerTo(wb, w.x.name, w.s.toFixed(1), lb, l.x.name, l.s.toFixed(1))}</strong>` });
    }

    const whyMatchesList = document.getElementById('detailWhyMatchesList');
    if (whyMatchesList) whyMatchesList.innerHTML = matches.map(m => `<li>${m.text}</li>`).join('') || '<li>—</li>';
    const whyNotList = document.getElementById('detailWhyNotList');
    if (whyNotList) whyNotList.innerHTML = diffs.map(d => `<li>${d.text}</li>`).join('');

    // Site facts (shown for information — not used in the score)
    const L_ = t.factLabels;
    const facts = [
      [L_.region, site.region],
      [L_.elevation, `${Math.round(site.elevation_m).toLocaleString()} m`],
      [L_.temp, `${site.temp_min_C}°C → ${site.temp_max_C}°C`],
      [L_.slope, `${site.slope_deg}° · ${site.slope_class}`],
      [L_.roughness, `${site.roughness_m} m`],
      [L_.albedo, `${site.albedo}`],
      [L_.env, site.environment],
      [L_.ndvi, `${site.ndvi} · ${t.ndviPassed}`]
    ];
    const factsEl = document.getElementById('siteFactsList');
    if (factsEl) factsEl.innerHTML = facts.map(([k, v]) => `<div class="site-fact"><dt>${k}</dt><dd>${v}</dd></div>`).join('');

    // Compare & Export
    const compareBtn = document.getElementById('btnDetailCompare');
    if (compareBtn) compareBtn.onclick = () => { window.location.href = `compare.html?siteA=${site.id}`; };
    const exportBtn = document.getElementById('btnDetailExport');
    if (exportBtn) exportBtn.onclick = () => window.print();
  },

  setReference(id) {
    this.referenceId = id;
    this.refreshAll();
  },

  renderRadarChart(perCriterion, keys) {
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width, height = canvas.height;
    const centerX = width / 2, centerY = height / 2;
    const radius = 62;
    ctx.clearRect(0, 0, width, height);

    const labels = this.mpm().criteriaLabels[this.lang()];
    const numAxes = keys.length;
    const angleStep = (Math.PI * 2) / numAxes;
    const point = (i, r) => {
      const angle = i * angleStep - Math.PI / 2;
      return [centerX + Math.cos(angle) * r, centerY + Math.sin(angle) * r];
    };

    // Rings
    ctx.strokeStyle = 'rgba(64, 110, 160, 0.25)';
    ctx.lineWidth = 1;
    for (let r = radius / 4; r <= radius; r += radius / 4) {
      ctx.beginPath();
      for (let i = 0; i < numAxes; i++) {
        const [x, y] = point(i, r);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Axes + labels (with the % value)
    ctx.font = '10px monospace';
    ctx.fillStyle = '#8ea5c0';
    ctx.textAlign = 'center';
    keys.forEach((k, i) => {
      const [x, y] = point(i, radius);
      ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(x, y); ctx.stroke();
      // Label on two lines (name / %), aligned away from the centre so it never gets cut
      const [lx, ly] = point(i, radius + 10);
      const dx = lx - centerX;
      ctx.textAlign = Math.abs(dx) < 5 ? 'center' : (dx > 0 ? 'left' : 'right');
      const top = ly < centerY - 5, bottom = ly > centerY + 5;
      const y0 = top ? ly - 14 : bottom ? ly + 6 : ly - 4;
      ctx.fillStyle = '#8ea5c0';
      ctx.fillText(labels[k].split(' (')[0], lx, y0);
      ctx.fillStyle = '#00e5d4';
      ctx.fillText(`${Math.round(perCriterion[k])}%`, lx, y0 + 12);
    });

    // Data polygon
    ctx.beginPath();
    keys.forEach((k, i) => {
      const [x, y] = point(i, (perCriterion[k] / 100) * radius);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 229, 212, 0.25)';
    ctx.fill();
    ctx.strokeStyle = '#00e5d4';
    ctx.lineWidth = 2;
    ctx.stroke();

    keys.forEach((k, i) => {
      const [x, y] = point(i, (perCriterion[k] / 100) * radius);
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
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
    // Moon / Mars
    document.querySelectorAll('.body-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.applyBody(e.currentTarget.getAttribute('data-body')));
    });

    // Reference site
    const select = document.getElementById('referenceSiteSelect');
    if (select) select.addEventListener('change', (e) => this.setReference(e.target.value));

    // Terrain chips
    document.querySelectorAll('.terrain-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.terrain-chip').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeTerrainFilter = e.currentTarget.getAttribute('data-terrain');
        this.renderMarkers();
      });
    });

    // Known / New candidates
    document.querySelectorAll('input[name="discoveryFilter"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.discoveryFilter = e.target.value;
        this.renderMarkers();
      });
    });
  }
};

window.SiteFinder = SiteFinder;
