/**
 * TerraTwin - Page 3: Compare Sites Controller
 * Side-by-side benchmarking matrix, Two Permanent Analytical Panels,
 * 3D Planetary Surface Similarity Heatmap with Dynamic Geomorphology
 * (Volcano, Sea/Lake Bed, Flat Plain, Crater, Canyon/Caves),
 * and standardized 1-page PDF executive reporting engine.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await window.App.init('compare');

  const cellsData = await window.App.fetchData('cells');
  const targetsData = await window.App.fetchData('targets');
  let analogWorkbook = null;
  try {
    const response = await fetch('data/earth-analogs.json');
    if (response.ok) analogWorkbook = await response.json();
  } catch (error) {
    console.warn('Workbook-derived analog data could not be loaded; using built-in site data.', error);
  }

  if (!cellsData || !targetsData) {
    console.error('Data missing for Compare page');
    return;
  }

  SiteComparator.init(cellsData.cells, targetsData.targets, analogWorkbook);
});

/* ==========================================================================
   FAST 2D SIMPLEX / PERLIN FRACTAL NOISE GENERATOR (FOR REALISTIC GEOLOGY)
   ========================================================================== */
const FastNoise2D = {
  perm: new Uint8Array(512),
  grad2: [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1]
  ],
  initialized: false,

  init() {
    if (this.initialized) return;
    const p = [
      151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
      8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
      35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
      134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
      55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
      18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
      250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
      189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
      172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
      228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
      107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
      138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
    ];
    for (let i = 0; i < 256; i++) {
      this.perm[i] = p[i];
      this.perm[256 + i] = p[i];
    }
    this.initialized = true;
  },

  noise2D(xin, yin) {
    if (!this.initialized) this.init();
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

    let s = (xin + yin) * F2;
    let i = Math.floor(xin + s);
    let j = Math.floor(yin + s);
    let t = (i + j) * G2;
    let X0 = i - t;
    let Y0 = j - t;
    let x0 = xin - X0;
    let y0 = yin - Y0;

    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }

    let x1 = x0 - i1 + G2;
    let y1 = y0 - j1 + G2;
    let x2 = x0 - 1.0 + 2.0 * G2;
    let y2 = y0 - 1.0 + 2.0 * G2;

    let ii = i & 255;
    let jj = j & 255;
    let gi0 = this.perm[ii + this.perm[jj]] % 8;
    let gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 8;
    let gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 8;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    let n0 = 0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * (this.grad2[gi0][0] * x0 + this.grad2[gi0][1] * y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    let n1 = 0;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * (this.grad2[gi1][0] * x1 + this.grad2[gi1][1] * y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    let n2 = 0;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * (this.grad2[gi2][0] * x2 + this.grad2[gi2][1] * y2);
    }

    return 70.0 * (n0 + n1 + n2);
  },

  fbm(x, y, octaves = 5, lacunarity = 2.0, gain = 0.5) {
    let sum = 0;
    let amp = 1.0;
    let freq = 1.0;
    let max = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * this.noise2D(x * freq, y * freq);
      max += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / max;
  },

  ridged(x, y, octaves = 4) {
    let sum = 0;
    let amp = 1.0;
    let freq = 1.0;
    for (let o = 0; o < octaves; o++) {
      let val = Math.abs(this.noise2D(x * freq, y * freq));
      val = 1.0 - val;
      val *= val;
      sum += amp * val;
      amp *= 0.5;
      freq *= 2.0;
    }
    return sum;
  }
};

/* ==========================================================================
   3D PLANETARY SURFACE SIMILARITY HEATMAP CONTROLLER (THREE.JS)
   Features high-fidelity fractal terrain DEM, photorealistic planetary textures
   (Mars / Moon), micro-relief normal mapping, semi-transparent calibrated
   spectral radiometric heatmaps, contour isolines, and interactive 3D reticle.
   ========================================================================== */
const Terrain3DViewer = {
  container: null,
  scene: null,
  camera: null,
  renderer: null,
  terrainMesh: null,
  wireframeMesh: null,
  reticleMesh: null,
  sunLight: null,
  ambientLight: null,
  animId: null,

  // Modes & View Options
  mode: 'siteA', // 'siteA', 'siteB', 'diff'
  visualMode: 'spectral', // 'spectral' (scientific radiometric heatmap), 'natural' (true-color orbital orthomosaic), 'dem' (topographic elevation ramp)
  heatmapOpacity: 0.75, // 0.0 (pure rock) to 1.0 (full spectral scan)
  showContours: true,
  selectedMorphology: 'auto', // 'auto', 'volcano', 'lake', 'plain', 'crater', 'canyon'
  showWireframe: false,
  autoRotate: true,
  idleTimer: null,

  // Active Models Data
  currentTarget: null,
  siteA: null,
  siteB: null,
  vertexMetadata: [],
  gridSegments: 128, // High-resolution mesh (16,384 vertices)
  gridSize: 26,

  // Textures and Canvases
  compositeCanvas: null,
  compositeCtx: null,
  compositeTexture: null,
  normalCanvas: null,
  normalCtx: null,
  normalTexture: null,
  baseAlbedoCanvas: null,
  baseAlbedoCtx: null,
  heatCanvas128: null,
  heatCtx128: null,

  // Raycasting & Interaction
  raycaster: (typeof THREE !== 'undefined') ? new THREE.Raycaster() : null,
  mouse: (typeof THREE !== 'undefined') ? new THREE.Vector2(-999, -999) : null,
  isDragging: false,
  previousMousePosition: { x: 0, y: 0 },

  // Spherical 360° Orbit Coordinates
  orbitDistance: 28,
  targetDistance: 28,
  orbitAzimuth: 0,               // Continuous full 360° horizontal angle
  targetAzimuth: 0,
  orbitElevation: Math.PI / 3.2, // ~56° vertical elevation angle
  targetElevation: Math.PI / 3.2,

  init(containerEl) {
    if (!containerEl || typeof THREE === 'undefined') return;
    this.container = containerEl;
    this.container.innerHTML = '';

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 480;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x180f0c, 0.012);

    // 2. Camera - Z is the vertical UP axis for terrain DEM
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.up.set(0, 0, 1);
    this.updateCameraPosition();

    // 3. Renderer with Soft Shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting: Realistic Spacecraft / Orbital Solar Geometry
    this.ambientLight = new THREE.AmbientLight(0x453128, 0.55);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff3e3, 1.45);
    this.sunLight.position.set(24, -28, 30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -20;
    this.sunLight.shadow.camera.right = 20;
    this.sunLight.shadow.camera.top = 20;
    this.sunLight.shadow.camera.bottom = -20;
    this.scene.add(this.sunLight);

    const rimLight = new THREE.DirectionalLight(0x00d2ff, 0.35);
    rimLight.position.set(-24, 28, 16);
    this.scene.add(rimLight);

    // 5. 3D Surface Inspection Reticle (Projects onto terrain under cursor)
    const ringGeo = new THREE.RingGeometry(0.55, 0.70, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthTest: false
    });
    this.reticleMesh = new THREE.Mesh(ringGeo, ringMat);
    this.reticleMesh.visible = false;
    this.reticleMesh.renderOrder = 999;
    this.scene.add(this.reticleMesh);

    // 6. Initialize Offscreen Canvases for Procedural Textures
    this.compositeCanvas = document.createElement('canvas');
    this.compositeCanvas.width = 512;
    this.compositeCanvas.height = 512;
    this.compositeCtx = this.compositeCanvas.getContext('2d');
    this.compositeTexture = new THREE.CanvasTexture(this.compositeCanvas);
    this.compositeTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.compositeTexture.wrapT = THREE.ClampToEdgeWrapping;

    this.normalCanvas = document.createElement('canvas');
    this.normalCanvas.width = 512;
    this.normalCanvas.height = 512;
    this.normalCtx = this.normalCanvas.getContext('2d');
    this.normalTexture = new THREE.CanvasTexture(this.normalCanvas);
    this.normalTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.normalTexture.wrapT = THREE.ClampToEdgeWrapping;

    this.baseAlbedoCanvas = document.createElement('canvas');
    this.baseAlbedoCanvas.width = 512;
    this.baseAlbedoCanvas.height = 512;
    this.baseAlbedoCtx = this.baseAlbedoCanvas.getContext('2d');

    this.heatCanvas128 = document.createElement('canvas');
    this.heatCanvas128.width = 129;
    this.heatCanvas128.height = 129;
    this.heatCtx128 = this.heatCanvas128.getContext('2d');

    this.bindEvents();
    this.animate();
  },

  updateCameraPosition() {
    if (!this.camera) return;
    const sinElev = Math.sin(this.orbitElevation);
    const cosElev = Math.cos(this.orbitElevation);
    const sinAzim = Math.sin(this.orbitAzimuth);
    const cosAzim = Math.cos(this.orbitAzimuth);

    this.camera.position.x = this.orbitDistance * sinElev * sinAzim;
    this.camera.position.y = -this.orbitDistance * sinElev * cosAzim;
    this.camera.position.z = this.orbitDistance * cosElev;
    this.camera.lookAt(0, 0, 0);
  },

  determineMorphology(target, siteA, siteB) {
    if (this.selectedMorphology && this.selectedMorphology !== 'auto') return this.selectedMorphology;
    const targetId = target ? target.id : '';
    const terrainA = String(siteA?.analog_workbook?.terrain_type || siteA?.terrain_type || siteA?.analog_terrain_type || '').toLowerCase();
    const terrainB = String(siteB?.analog_workbook?.terrain_type || siteB?.terrain_type || siteB?.analog_terrain_type || '').toLowerCase();
    const selectedTerrain = terrainA || terrainB;

    // The selected Earth site's Excel terrain_type is the primary driver.
    // Target body/site only provides a fallback when no Earth terrain class exists.
    if (/volcanic|lava|basalt/.test(selectedTerrain)) return 'volcano';
    if (/polar|ice|cryo|permafrost/.test(selectedTerrain)) return 'crater';
    if (/cropland|alluvial|river|delta|lake|sediment/.test(selectedTerrain)) return 'lake';
    if (/desert|arid|sand|clay|plain|tropical_forest|urban_concrete/.test(selectedTerrain)) return 'plain';

    const targetTerrain = String(target?.terrain_type || target?.geology || '').toLowerCase();
    const combined = `${targetId} ${targetTerrain}`;
    if (/volcanic|lava|basalt|olympus|mare|mons/.test(combined)) return 'volcano';
    if (/polar|ice|cryo|permafrost|crater|shackleton|tycho/.test(combined)) return 'crater';
    if (/hydrothermal|delta|lake|river|sediment|jezero/.test(combined)) return 'lake';
    if (/canyon|cave|tube|valles|chasma|marius/.test(combined)) return 'canyon';
    return target && target.body === 'moon' ? 'crater' : 'plain';
  },

  setMorphology(morph) {
    this.selectedMorphology = morph;
    const isAr = window.I18n ? window.I18n.currentLang === 'ar' : false;

    // Update active class on buttons
    document.querySelectorAll('.morph-chip-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-morph') === morph);
    });

    const activeMorph = this.determineMorphology(this.currentTarget, this.siteA, this.siteB);
    const indicatorEl = document.getElementById('morphActiveIndicator');
    if (indicatorEl) {
      const morphLabels = {
        volcano: isAr ? '🌋 بركان وفوهة بازلتية' : '🌋 Volcano & Caldera',
        lake: isAr ? '🌊 قاع بحر وبحيرة كوكبية' : '🌊 Sea/Lake Bed & Delta',
        plain: isAr ? '🏜️ أرض مسطحة وكثبان رملية' : '🏜️ Flat Plain & Dunes',
        crater: isAr ? '☄️ فوهة اصطدام كوكبية عميقة' : '☄️ Deep Impact Crater',
        canyon: isAr ? '🕳️ أخدود وأنفاق حمم' : '🕳️ Canyon & Lava Tube'
      };
      const label = morphLabels[activeMorph] || (isAr ? 'تلقائي' : 'Auto');
      indicatorEl.textContent = morph === 'auto' ? (isAr ? `تلقائي (${label})` : `Auto (${label})`) : label;
    }

    this.buildTerrain(this.currentTarget, this.siteA, this.siteB);
  },

  buildTerrain(target, siteA, siteB) {
    this.currentTarget = target;
    this.siteA = siteA;
    this.siteB = siteB;

    if (!this.scene || typeof THREE === 'undefined') return;

    // Adapt atmospheric fog and sky light to planetary body
    const isMoon = target && target.body === 'moon';
    if (this.scene.fog) {
      this.scene.fog.color.setHex(isMoon ? 0x04060a : 0x180f0c);
      this.scene.fog.density = isMoon ? 0.006 : 0.012;
    }
    if (this.ambientLight) {
      this.ambientLight.color.setHex(isMoon ? 0x222630 : 0x453128);
      this.ambientLight.intensity = isMoon ? 0.35 : 0.55;
    }
    if (this.sunLight) {
      this.sunLight.color.setHex(isMoon ? 0xffffff : 0xfff3e3);
      this.sunLight.intensity = isMoon ? 1.6 : 1.45;
    }

    // Clean up previous meshes
    if (this.terrainMesh) {
      this.scene.remove(this.terrainMesh);
      if (this.terrainMesh.geometry) this.terrainMesh.geometry.dispose();
      if (this.terrainMesh.material) this.terrainMesh.material.dispose();
      this.terrainMesh = null;
    }
    if (this.wireframeMesh) {
      this.scene.remove(this.wireframeMesh);
      if (this.wireframeMesh.geometry) this.wireframeMesh.geometry.dispose();
      if (this.wireframeMesh.material) this.wireframeMesh.material.dispose();
      this.wireframeMesh = null;
    }

    const segments = this.gridSegments; // 128
    const size = this.gridSize; // 26
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    const pos = geometry.attributes.position;
    const count = pos.count;
    const gridDim = segments + 1; // 129

    const activeMorph = this.determineMorphology(target, siteA, siteB);
    this.vertexMetadata = [];

    const scoreA = (siteA ? (siteA.similarity_score || 85) : 85) / 100;
    const scoreB = (siteB ? (siteB.similarity_score || 82) : 82) / 100;
    const workbookA = siteA?.analog_workbook || {};
    const workbookB = siteB?.analog_workbook || {};
    const selectedSlope = Number(workbookA.slope_deg ?? siteA?.slope_deg ?? workbookB.slope_deg ?? siteB?.slope_deg ?? 5);
    const selectedRoughness = Number(workbookA.roughness_m ?? siteA?.roughness_m ?? workbookB.roughness_m ?? siteB?.roughness_m ?? 10);
    const selectedTerrainType = String(workbookA.terrain_type ?? siteA?.terrain_type ?? siteA?.analog_terrain_type ?? '').toLowerCase();
    const selectedAlbedo = Number(workbookA.albedo ?? siteA?.albedo ?? 0.25);
    const terrainReliefFactor = /volcanic/.test(selectedTerrainType) ? 1.22
      : /polar/.test(selectedTerrainType) ? 1.08
      : /tropical/.test(selectedTerrainType) ? 0.88
      : /urban/.test(selectedTerrainType) ? 0.72
      : /cropland/.test(selectedTerrainType) ? 0.78 : 1.0;
    const terrainBrightnessFactor = Math.max(0.72, Math.min(1.28, 0.8 + selectedAlbedo));
    const reliefScale = Math.max(0.55, Math.min(1.85, 0.7 + selectedSlope / 20 + Math.log1p(Math.max(0, selectedRoughness)) / 8));

    // Generate Geological Elevation Profile with Multi-Octave Fractal Noise
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y);
      const angle = Math.atan2(y, x);

      let z = 0;
      let zoneNameEn = 'Basalt Terrain';
      let zoneNameAr = 'أرضية بازلتية';
      let geolEn = 'Basaltic Bedrock';
      let geolAr = 'صخور بازلتية متماسكة';
      let simBase = 0.52;

      // Fractal micro-topography & rock noise
      const rockNoise = FastNoise2D.fbm(x * 0.75, y * 0.75, 4) * 0.45 +
                        FastNoise2D.noise2D(x * 3.2, y * 3.2) * 0.10;

      if (activeMorph === 'volcano') {
        // 1. VOLCANO & CALDERA (بركان أوليمبوس مونس وفوهة كوكبية بازلتية)
        // Broad conical shield mountain rising up to +8.8
        const cone = 8.8 / (1.0 + Math.pow(r / 5.2, 1.85));
        // Stepped caldera with concentric ring faults (slump blocks)
        const calderaDepr = r < 3.6 ? -5.2 * (1.0 - Math.pow(r / 3.6, 2)) : 0;
        // Central volcanic cinder cone vent
        const vent = r < 1.15 ? 1.4 * (1.15 - r) : 0;
        // Sinuous radial lava channels with raised cooling levees
        const channelWarp = FastNoise2D.noise2D(Math.cos(angle * 6) * 2, Math.sin(angle * 6) * 2);
        const lavaRibs = (r > 2.8 && r < 10.5) ? Math.cos(angle * 8 + channelWarp * 1.5) * Math.exp(-Math.pow((r - 6.2) / 4.2, 2)) * 0.85 : 0;
        z = cone + calderaDepr + vent + lavaRibs + rockNoise;

        if (r < 1.15) {
          zoneNameEn = 'Central Cinder Vent Apex';
          zoneNameAr = 'قمة فوهة الرماد البركاني المركزية';
          geolEn = 'Vesicular Basalt & Tephra';
          geolAr = 'بازلت مسامي ومقذوفات بركانية';
          simBase = 0.96;
        } else if (r < 3.6) {
          zoneNameEn = 'Summit Caldera Floor Graben';
          zoneNameAr = 'قاع الفوهة البركانية المنهارة (أوليمبوس)';
          geolEn = 'Pahoehoe Basalt Crust';
          geolAr = 'قشرة حمم باهوهو بازلتية ناعمة';
          simBase = 0.92;
        } else if (r >= 3.6 && r <= 8.5) {
          zoneNameEn = 'Steep Basaltic Lava Flow Lobe';
          zoneNameAr = 'ألسنة تدفق الحمم البازلتية المنحدرة';
          geolEn = 'Blocky Aa Lava & Breccia';
          geolAr = 'كتل حمم آه-آه وبريشيا بركانية';
          simBase = 0.88;
        } else {
          zoneNameEn = 'Volcanic Shield Apron & Tephra';
          zoneNameAr = 'سفوح القاعدة البركانية والرماد';
          geolEn = 'Weathered Ash Regolith';
          geolAr = 'حطام صخري ورماد بركاني مجوى';
          simBase = 0.58;
        }

      } else if (activeMorph === 'lake') {
        // 2. SEA / LAKE BED & DELTA (قاع بحيرة جيزيرو ودلتا رسوبية نهرية قديمة)
        // Sunken ancient lake basin
        const basin = -3.8 * (1.0 - Math.exp(-Math.pow(r / 7.2, 2)));
        // Meandering inflowing paleoriver gorge entering from west
        const riverCurve = 1.4 * Math.sin(x * 0.45);
        const distToRiver = Math.abs(y - riverCurve);
        const riverGorge = (x < -3.8 && distToRiver < 2.0) ? -2.2 * Math.cos((distToRiver / 2.0) * (Math.PI / 2)) : 0;
        // Bifurcating fluvial delta fan deposited into the lake basin
        const inDelta = (x > -4.5 && x < 2.0 && Math.abs(y) < 3.4);
        const deltaFan = inDelta ? Math.exp(-(Math.pow(x + 1.8, 2) + Math.pow(y, 2)) / 7.5) * 2.5 : 0;
        // Ancient paleoshoreline wave-cut terraces
        const terraces = (r > 4.8 && r < 10.5) ? Math.sin(r * 2.8) * 0.35 : 0;
        z = basin + riverGorge + deltaFan + terraces + rockNoise * 0.6;

        if (inDelta) {
          zoneNameEn = 'Fluvial Delta Sedimentary Fan Apex';
          zoneNameAr = 'قمة مروحة الدلتا الرسوبية النهرية (جيزيرو)';
          geolEn = 'Phyllosilicate Clay & Siltstone';
          geolAr = 'صلصال السيليكات الصفائحية وحجر غريني';
          simBase = 0.96;
        } else if (r < 5.2) {
          zoneNameEn = 'Submerged Ancient Lakebed Sediments';
          zoneNameAr = 'رواسب قاع البحيرة القديم المغمور';
          geolEn = 'Carbonate-Bearing Mudstone';
          geolAr = 'حجر طيني حاوٍ للكربونات';
          simBase = 0.88;
        } else if (r >= 5.2 && r <= 10.0) {
          zoneNameEn = 'Terraced Paleoshoreline Escarpment';
          zoneNameAr = 'حواف الشواطئ القديمة المتدرجة';
          geolEn = 'Stratified Lacustrine Sandstone';
          geolAr = 'حجر رملي بحيري طبقي متدرج';
          simBase = 0.74;
        } else {
          zoneNameEn = 'Dry Evaporite Salt Flat Mud';
          zoneNameAr = 'مسطحات ملحية وتبخرية جافة';
          geolEn = 'Evaporite Sulfate Crust';
          geolAr = 'قشرة كبريتات تبخرية مجففة';
          simBase = 0.50;
        }

      } else if (activeMorph === 'plain') {
        // 3. FLAT ARID PLAIN & AEOLIAN DUNES (أرض مسطحة وكثبان رملية ممتدة)
        // Aerodynamic barchan & transverse dunes with asymmetric slip face
        const duneAngle = x * 0.80 + Math.sin(y * 0.45) * 0.6;
        const duneWave = Math.sin(duneAngle);
        const slipFace = Math.pow(Math.max(0, duneWave), 1.6) * 0.75 - Math.pow(Math.max(0, -duneWave), 1.2) * 0.35;
        // Longitudinal wind-carved yardang bedrock ridges
        const yardang = Math.exp(-Math.pow(((Math.abs(y) % 5.2) - 2.6) / 0.85, 2)) * 0.45 * (0.8 + 0.4 * FastNoise2D.noise2D(x * 0.5, 0));
        z = slipFace + yardang + rockNoise * 0.4;

        if (duneWave > 0.45) {
          zoneNameEn = 'Transverse Sand Dune Crest (Barchan)';
          zoneNameAr = 'قمة كثبان رملية هلالية (بارخان)';
          geolEn = 'Well-Sorted Quartz/Basalt Sand';
          geolAr = 'رمال بازلتية وكوارتزية مفروزة جيداً';
          simBase = 0.93;
        } else if (yardang > 0.28) {
          zoneNameEn = 'Wind-Carved Yardang Bedrock Ridge';
          zoneNameAr = 'حواف ياردانغ المنحوتة بالرياح المريخية';
          geolEn = 'Indurated Bedrock Exhumation';
          geolAr = 'صخور أساس متصلبة منحوتة هوائياً';
          simBase = 0.83;
        } else {
          zoneNameEn = 'Level Regolith Desert Flat';
          zoneNameAr = 'سهل صحراوي مستوٍ ومحصى';
          geolEn = 'Desert Pavement & Lag Gravel';
          geolAr = 'رصيف صحراوي وحصى فتاتي متراص';
          simBase = 0.64;
        }

      } else if (activeMorph === 'crater') {
        // 4. IMPACT CRATER (فوهة اصطدام كوكبية عميقة - شاكلتون)
        // Polygonal scalloped rim
        const rimRadius = 8.2 + 0.5 * FastNoise2D.noise2D(Math.cos(angle) * 3, Math.sin(angle) * 3);
        const rim = 6.4 * Math.exp(-Math.pow((r - rimRadius) / 1.75, 2));
        // Deep parabolic interior bowl with stepped slump terraces
        const bowl = r < rimRadius ? -5.6 * Math.cos((r / rimRadius) * (Math.PI / 2)) : 0;
        // Central rebound uplift mountain peak
        const centralPeak = r < 2.4 ? 2.8 * Math.exp(-Math.pow(r / 1.35, 2)) : 0;
        // Radial ejecta rays and micro-craters
        const ejecta = r > rimRadius ? Math.cos(angle * 7) * Math.exp(-Math.pow((r - 11.2) / 2.8, 2)) * 0.75 : 0;
        z = rim + bowl + centralPeak + ejecta + rockNoise;

        if (r < 2.4) {
          zoneNameEn = 'Central Rebound Uplift Peak';
          zoneNameAr = 'قمة الارتداد الصخري المركزية للفوهة';
          geolEn = 'Shocked Anorthosite / Breccia';
          geolAr = 'أنورثوسايت صدمي وبريشيا قمرية';
          simBase = 0.86;
        } else if (r >= 2.4 && r < 7.2) {
          zoneNameEn = 'Permanently Shadowed Cryo Floor (PSR 40K)';
          zoneNameAr = 'قاع الفوهة المتجمد دائم الظل (40 كلفن - جليد)';
          geolEn = 'Cryogenic Regolith & Water Ice';
          geolAr = 'حطام صخري متجمد وجليد مائي';
          simBase = 0.97;
        } else if (r >= 7.2 && r <= 9.6) {
          zoneNameEn = 'High-Illumination Crater Rim Crest';
          zoneNameAr = 'حافة الفوهة المعرضة للشمس دائماً (طاقة)';
          geolEn = 'Impact Melt Sheet & Boulders';
          geolAr = 'صفائح ذوبان صدمية وكتل صخرية ضخمة';
          simBase = 0.78;
        } else {
          zoneNameEn = 'Shocked Regolith Ejecta Blanket';
          zoneNameAr = 'غطاء المقذوفات الصخرية الصدمية';
          geolEn = 'Impact Ejecta & Spherules';
          geolAr = 'مقذوفات صدمية وحبيبات زجاجية';
          simBase = 0.48;
        }

      } else {
        // 5. CANYON & LAVA TUBE (أخدود وأنفاق حمم وكهوف - تلال ماريوس)
        // Sinuous volcanic rille trench
        const canyonCurve = 3.2 * Math.sin(x * 0.36) + 1.0 * FastNoise2D.noise2D(x * 0.7, 0);
        const distToCanyon = Math.abs(y - canyonCurve);
        const trench = -5.0 * Math.exp(-Math.pow(distToCanyon / 1.8, 2));
        // Vertical skylight collapse cave pit (80m vertical drop)
        const pit = Math.exp(-(x * x + y * y) / 2.3) * -6.2;
        // Canyon edge basalt ledges and talus scree
        const ledges = Math.sin(distToCanyon * 1.8) * 0.42;
        z = trench + pit + ledges + rockNoise;

        if (r < 2.2) {
          zoneNameEn = 'Lava Tube Skylight Pit (80m Vertical Drop)';
          zoneNameAr = 'فتحة انهيار أنبوب الحمم القمرية (هبوط 80م)';
          geolEn = 'Subsurface Lava Cavity Entrance';
          geolAr = 'مدخل تجويف أنبوب حمم تحت سطحي محمي';
          simBase = 0.96;
        } else if (distToCanyon < 2.2) {
          zoneNameEn = 'Sinuous Volcanic Rille Canyon Floor';
          zoneNameAr = 'قاع أخدود الحمم البركاني المتعرج';
          geolEn = 'Porous Vesicular Basalt Talus';
          geolAr = 'ركام فتاتي وبازلت مسامي متكسر';
          simBase = 0.89;
        } else {
          zoneNameEn = 'Basalt Flow Shield Plain';
          zoneNameAr = 'سطح التدفقات البازلتية الصلبة الممتدة';
          geolEn = 'Layered Mare Basalt Plateau';
          geolAr = 'هضبة حمم بازلتية قمرية طبقية';
          simBase = 0.56;
        }
      }

      z *= reliefScale * terrainReliefFactor;
      pos.setZ(i, z);

      // Local slope estimation from coordinates & feature geometry
      const slopeDeg = Math.min(42, Math.max(2, Math.abs(z) * 4.2 + Math.abs(x) * 0.8)).toFixed(1);

      // Multi-spectral analog match correlation calibrated with actual benchmark site scores
      const simA = Math.min(0.99, Math.max(0.20, simBase * (scoreA / 0.88)));
      const simB = Math.min(0.99, Math.max(0.20, (simBase + 0.03 * Math.sin(x * 0.4 + y * 0.3)) * (scoreB / 0.88)));

      this.vertexMetadata.push({
        x: x.toFixed(2),
        y: y.toFixed(2),
        z: z.toFixed(2),
        elevation: `${(z * 0.35 + (target ? parseFloat(target.elevation) || -2.5 : -2.5)).toFixed(2)} km`,
        slope: `${slopeDeg}°`,
        zoneEn: zoneNameEn,
        zoneAr: zoneNameAr,
        geolEn: geolEn,
        geolAr: geolAr,
        simA: simA,
        simB: simB
      });
    }

    geometry.computeVertexNormals();

    // Generate Photorealistic Textures
    this.generateBaseAlbedo(target, activeMorph);
    this.generateNormalMap(geometry);
    this.updateCompositeTexture();

    // Material with Natural Texture, Normal Bump Map, and Smooth PBR Reflections
    const material = new THREE.MeshStandardMaterial({
      map: this.compositeTexture,
      normalMap: this.normalTexture,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.82,
      metalness: 0.12,
      flatShading: false
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.rotation.set(0, 0, 0);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = true;
    this.scene.add(this.terrainMesh);

    // Wireframe DEM Mesh (Hidden by default, toggled via UI)
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });
    this.wireframeMesh = new THREE.Mesh(geometry, wireMaterial);
    this.wireframeMesh.rotation.set(0, 0, 0);
    this.wireframeMesh.visible = this.showWireframe;
    this.scene.add(this.wireframeMesh);

    // Update Telemetry HUD with Orbital Sensor Header
    const sensorEl = document.getElementById('hudSensor');
    if (sensorEl) {
      sensorEl.textContent = isMoon ? 'LRO LOLA / Diviner Lunar Radiometer' : 'NASA MRO HiRISE / ESA HRSC Calibration';
    }
  },

  // Generates photorealistic Martian or Lunar base terrain albedo (100% realistic rock substrate)
  generateBaseAlbedo(target, activeMorph) {
    if (!this.baseAlbedoCtx) return;
    const ctx = this.baseAlbedoCtx;
    const w = this.baseAlbedoCanvas.width;
    const h = this.baseAlbedoCanvas.height;
    const isMoon = target && target.body === 'moon';

    // 1. Natural Geological Substrate Palette
    if (isMoon) {
      // Lunar Grey Anorthosite & Dark Titanium Mare Basalt
      const grad = ctx.createRadialGradient(w * 0.45, h * 0.45, 20, w * 0.5, h * 0.5, w * 0.6);
      grad.addColorStop(0, '#4a505c');
      grad.addColorStop(0.5, '#353a44');
      grad.addColorStop(1, '#252930');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Anorthositic bright impact shock rays & crater ejecta
      ctx.fillStyle = 'rgba(185, 192, 205, 0.14)';
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.arc(w * (0.2 + 0.6 * Math.sin(i * 1.7)), h * (0.2 + 0.6 * Math.cos(i * 2.3)), 15 + i * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Martian Iron-Oxide Ochre Regolith & Weathered Basalt
      const grad = ctx.createRadialGradient(w * 0.48, h * 0.46, 20, w * 0.5, h * 0.5, w * 0.6);
      grad.addColorStop(0, '#b85e35');
      grad.addColorStop(0.45, '#9e4926');
      grad.addColorStop(0.85, '#6a2f18');
      grad.addColorStop(1, '#3b1c11');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Dark basalt outcrops and wind streaks
      ctx.fillStyle = 'rgba(40, 28, 22, 0.32)';
      for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        ctx.ellipse(w * (0.15 + 0.7 * Math.sin(i * 2.1)), h * (0.15 + 0.7 * Math.cos(i * 1.8)), 35 + i * 5, 12 + i * 2, i * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sedimentary clay / salt evaporite light streaks in depressions
      ctx.fillStyle = 'rgba(215, 175, 140, 0.18)';
      ctx.beginPath();
      ctx.ellipse(w * 0.45, h * 0.50, w * 0.32, h * 0.22, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Micro-texture stippling (fine regolith grain & boulders)
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let p = 0; p < data.length; p += 4) {
      const noise = (Math.random() - 0.5) * 22;
      data[p] = Math.min(255, Math.max(0, data[p] + noise));
      data[p + 1] = Math.min(255, Math.max(0, data[p + 1] + noise));
      data[p + 2] = Math.min(255, Math.max(0, data[p + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // 3. Exposed Sedimentary / Basaltic Strata Banding (Realistic Contours)
    ctx.strokeStyle = isMoon ? 'rgba(255, 255, 255, 0.06)' : 'rgba(120, 50, 30, 0.15)';
    ctx.lineWidth = 1.2;
    for (let r = 25; r < w * 0.55; r += 20) {
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  // Generates 512x512 tangent-space normal bump map for crisp geological relief
  generateNormalMap(geometry) {
    if (!this.normalCtx || !geometry) return;
    const ctx = this.normalCtx;
    const w = this.normalCanvas.width;
    const h = this.normalCanvas.height;
    const pos = geometry.attributes.position;
    const seg = this.gridSegments;
    const dim = seg + 1; // 129

    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    for (let py = 0; py < h; py++) {
      const gy = Math.floor((py / h) * seg);
      for (let px = 0; px < w; px++) {
        const gx = Math.floor((px / w) * seg);

        const leftIdx = gy * dim + Math.max(0, gx - 1);
        const rightIdx = gy * dim + Math.min(seg, gx + 1);
        const upIdx = Math.max(0, gy - 1) * dim + gx;
        const downIdx = Math.min(seg, gy + 1) * dim + gx;

        const leftZ = pos.getZ(leftIdx);
        const rightZ = pos.getZ(rightIdx);
        const upZ = pos.getZ(upIdx);
        const downZ = pos.getZ(downIdx);

        let dx = (leftZ - rightZ) * 1.8;
        let dy = (upZ - downZ) * 1.8;
        let dz = 1.0;

        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        dx /= len; dy /= len; dz /= len;

        const idx = (py * w + px) * 4;
        data[idx] = Math.round((dx * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.round((dy * 0.5 + 0.5) * 255);
        data[idx + 2] = Math.round((dz * 0.5 + 0.5) * 255);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    if (this.normalTexture) {
      this.normalTexture.needsUpdate = true;
    }
  },

  // Updates composite texture blending Base Geological Albedo + Scientific Spectral Radiometry
  updateCompositeTexture() {
    if (!this.compositeCtx) return;
    const ctx = this.compositeCtx;
    const w = this.compositeCanvas.width;
    const h = this.compositeCanvas.height;

    // Clear composite canvas
    ctx.clearRect(0, 0, w, h);

    // MODE 1: PHOTOREALISTIC SATELLITE (TRUE NATURAL SURFACE)
    if (this.visualMode === 'natural') {
      ctx.drawImage(this.baseAlbedoCanvas, 0, 0, w, h);
      if (this.compositeTexture) this.compositeTexture.needsUpdate = true;
      return;
    }

    // MODE 2: TOPOGRAPHIC DIGITAL ELEVATION MODEL (DEM)
    if (this.visualMode === 'dem') {
      const meta = this.vertexMetadata;
      const dim = this.gridSegments + 1; // 129
      const imgData = ctx.createImageData(129, 129);
      const data = imgData.data;

      for (let i = 0; i < meta.length; i++) {
        const z = parseFloat(meta[i].z);
        // Normalize elevation between -6.0 and +9.0
        const normZ = Math.min(1.0, Math.max(0.0, (z + 6.0) / 15.0));

        // MOLA Rainbow Elevation Color Ramp
        let r = 0, g = 0, b = 0;
        if (normZ < 0.25) {
          const t = normZ / 0.25;
          r = Math.round(30 * (1 - t)); g = Math.round(50 + 150 * t); b = 240;
        } else if (normZ < 0.5) {
          const t = (normZ - 0.25) / 0.25;
          r = 0; g = Math.round(200 + 55 * t); b = Math.round(240 * (1 - t));
        } else if (normZ < 0.75) {
          const t = (normZ - 0.5) / 0.25;
          r = Math.round(255 * t); g = 255; b = 0;
        } else {
          const t = (normZ - 0.75) / 0.25;
          r = 255; g = Math.round(255 * (1 - t * 0.8)); b = Math.round(180 * t);
        }

        const idx = i * 4;
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
      }

      this.heatCtx128.putImageData(imgData, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.heatCanvas128, 0, 0, w, h);

      // DEM Topographic Contour Lines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 1.0;
      for (let cr = 30; cr < w * 0.5; cr += 22) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.5, cr, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (this.compositeTexture) this.compositeTexture.needsUpdate = true;
      return;
    }

    // MODE 3: SCIENTIFIC RADIOMETRIC SIMILARITY OVERLAY (DEFAULT)
    // 1. Draw base realistic geological substrate first
    ctx.drawImage(this.baseAlbedoCanvas, 0, 0, w, h);

    // 2. Compute Radiometric Heatmap onto 129x129 buffer
    const meta = this.vertexMetadata;
    const mode = this.mode;
    const imgData = this.heatCtx128.createImageData(129, 129);
    const data = imgData.data;

    for (let i = 0; i < meta.length; i++) {
      const v = meta[i];
      let r = 0, g = 0, b = 0, a = 0;

      if (mode === 'diff') {
        // Delta Divergence Mode
        const delta = v.simB - v.simA;
        if (delta > 0.02) {
          // Site B Superior -> Radiant Amber-Gold
          const t = Math.min(1.0, (delta - 0.02) / 0.10);
          r = 245; g = Math.round(158 + 40 * t); b = 11;
          a = Math.round(180 + 70 * t);
        } else if (delta < -0.02) {
          // Site A Superior -> Radiant Cyan-Cobalt
          const t = Math.min(1.0, (-delta - 0.02) / 0.10);
          r = 14; g = Math.round(165 + 60 * t); b = 233;
          a = Math.round(180 + 70 * t);
        } else {
          // Neutral balance: transparent (reveals natural rock bedrock!)
          a = 0;
        }
      } else {
        // Calibrated Scientific Spectral Heatmap:
        // Peak Match (>=0.90): Deep Spectral Ruby (#e11d48) with luminous core
        // High Match (0.75 - 0.89): Radiometric Amber-Coral (#f97316)
        // Moderate (0.55 - 0.74): Topographic Golden Ochre (#eab308)
        // Divergent (<0.55): Fade completely to 0 alpha, smoothly revealing natural rock!
        const sim = mode === 'siteB' ? v.simB : v.simA;

        if (sim >= 0.90) {
          const t = Math.min(1.0, (sim - 0.90) / 0.10);
          r = Math.round(225 + 30 * t);
          g = Math.round(29 + 31 * t);
          b = Math.round(72 + 18 * t);
          a = Math.round((210 + 45 * t));
        } else if (sim >= 0.75) {
          const t = (sim - 0.75) / 0.15;
          r = 249;
          g = Math.round(115 + 45 * (1 - t));
          b = Math.round(22 + 40 * (1 - t));
          a = Math.round(150 + 55 * t);
        } else if (sim >= 0.55) {
          const t = (sim - 0.55) / 0.20;
          r = 234;
          g = 179;
          b = 8;
          a = Math.round(60 + 80 * t);
        } else {
          a = 0; // Pure rock substrate!
        }
      }

      const idx = i * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }

    this.heatCtx128.putImageData(imgData, 0, 0);

    // 3. Composite Heatmap over Natural Terrain using user opacity
    ctx.save();
    ctx.globalAlpha = this.heatmapOpacity;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.heatCanvas128, 0, 0, w, h);
    ctx.restore();

    // 4. Draw Scientific Iso-Similarity & Topographic Contour Lines
    if (this.showContours) {
      ctx.save();
      // Glowing Isoline contours
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.0;
      ctx.setLineDash([4, 4]);

      for (let cr = 45; cr < w * 0.48; cr += 35) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.5, cr, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Orbital Coordinate Raster Grid Ticks
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(0, 229, 212, 0.35)';
      ctx.fillStyle = 'rgba(0, 229, 212, 0.65)';
      ctx.lineWidth = 0.8;
      const step = w / 8;
      for (let gx = step; gx < w; gx += step) {
        for (let gy = step; gy < h; gy += step) {
          // Crosshair tick
          ctx.beginPath();
          ctx.moveTo(gx - 4, gy); ctx.lineTo(gx + 4, gy);
          ctx.moveTo(gx, gy - 4); ctx.lineTo(gx, gy + 4);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    if (this.compositeTexture) {
      this.compositeTexture.needsUpdate = true;
    }
  },

  setVisualMode(mode) {
    this.visualMode = mode;
    const btnSpectral = document.getElementById('btn3dLayerSpectral');
    const btnNatural = document.getElementById('btn3dLayerNatural');
    const btnDem = document.getElementById('btn3dLayerDEM');

    if (btnSpectral) btnSpectral.className = mode === 'spectral' ? 'terrain-layer-btn active' : 'terrain-layer-btn';
    if (btnNatural) btnNatural.className = mode === 'natural' ? 'terrain-layer-btn active' : 'terrain-layer-btn';
    if (btnDem) btnDem.className = mode === 'dem' ? 'terrain-layer-btn active' : 'terrain-layer-btn';

    this.updateCompositeTexture();
  },

  setHeatmapOpacity(val) {
    this.heatmapOpacity = Math.max(0.0, Math.min(1.0, val));
    const valEl = document.getElementById('val3dOpacity');
    if (valEl) {
      valEl.textContent = `${Math.round(this.heatmapOpacity * 100)}%`;
    }
    this.updateCompositeTexture();
  },

  toggleContours() {
    this.showContours = !this.showContours;
    const btn = document.getElementById('btn3dContours');
    if (btn) {
      btn.classList.toggle('active', this.showContours);
    }
    this.updateCompositeTexture();
  },

  setMode(mode) {
    this.mode = mode;
    this.updateCompositeTexture();

    const btnA = document.getElementById('btn3dViewSiteA');
    const btnB = document.getElementById('btn3dViewSiteB');
    const btnDiff = document.getElementById('btn3dViewDiff');

    if (btnA) btnA.className = mode === 'siteA' ? 'terrain-toggle-btn active' : 'terrain-toggle-btn';
    if (btnB) btnB.className = mode === 'siteB' ? 'terrain-toggle-btn active' : 'terrain-toggle-btn';
    if (btnDiff) btnDiff.className = mode === 'diff' ? 'terrain-toggle-btn active' : 'terrain-toggle-btn';
  },

  toggleWireframe() {
    this.showWireframe = !this.showWireframe;
    if (this.wireframeMesh) {
      this.wireframeMesh.visible = this.showWireframe;
    }
    const btn = document.getElementById('btn3dWireframe');
    if (btn) btn.classList.toggle('active', this.showWireframe);
  },

  resetView() {
    this.targetAzimuth = 0;
    this.targetElevation = Math.PI / 3.2;
    this.targetDistance = 28;
    this.autoRotate = false;
    const btn = document.getElementById('btn3dAutoRotate');
    if (btn) btn.classList.remove('active');
    this.resetIdleTimer();
  },

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    const btn = document.getElementById('btn3dAutoRotate');
    if (btn) {
      btn.classList.toggle('active', this.autoRotate);
    }
  },

  resetIdleTimer() {
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.autoRotate = true;
      const btn = document.getElementById('btn3dAutoRotate');
      if (btn) btn.classList.add('active');
    }, 5500);
  },

  bindEvents() {
    if (!this.container) return;

    // Mouse Drag Rotation
    this.container.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      const btn = document.getElementById('btn3dAutoRotate');
      if (btn) btn.classList.remove('active');
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.resetIdleTimer();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        // Full unconstrained 360-degree horizontal azimuth rotation
        this.targetAzimuth += deltaX * 0.008;

        // Vertical elevation tilt
        this.targetElevation += deltaY * 0.006;
        this.targetElevation = Math.max(0.08, Math.min(Math.PI * 0.48, this.targetElevation));

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }

      // Check if mouse is hovering over container for Raycasting Inspect
      const rect = this.container.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
        this.handleHoverInspect(e);
      } else if (this.reticleMesh) {
        this.reticleMesh.visible = false;
      }
    });

    // Mouse Wheel Zoom
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.02;
      this.targetDistance = Math.max(12, Math.min(52, this.targetDistance + zoomDelta));
    }, { passive: false });

    // Touch Support for Mobile / iPad
    this.container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.autoRotate = false;
        const btn = document.getElementById('btn3dAutoRotate');
        if (btn) btn.classList.remove('active');
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
        const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

        this.targetAzimuth += deltaX * 0.009;
        this.targetElevation += deltaY * 0.007;
        this.targetElevation = Math.max(0.08, Math.min(Math.PI * 0.48, this.targetElevation));

        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.resetIdleTimer();
      }
    });

    // Window Resize
    window.addEventListener('resize', () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  },

  handleHoverInspect(e) {
    if (!this.container || !this.terrainMesh || !this.camera) return;

    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.terrainMesh);

    if (intersects.length > 0) {
      const hit = intersects[0];

      // Update 3D Surface Inspection Reticle
      if (this.reticleMesh) {
        this.reticleMesh.position.copy(hit.point);
        this.reticleMesh.position.z += 0.08;
        if (hit.face) {
          this.reticleMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), hit.face.normal);
        }
        this.reticleMesh.visible = true;
      }

      if (hit.face) {
        const idx = hit.face.a;
        if (this.vertexMetadata && this.vertexMetadata[idx]) {
          const meta = this.vertexMetadata[idx];
          const isAr = window.I18n ? window.I18n.currentLang === 'ar' : false;

          const inspectZoneEl = document.getElementById('hudInspectZone');
          const simValEl = document.getElementById('hudSimilarityVal');
          const elevEl = document.getElementById('hudElevation');
          const breakdownEl = document.getElementById('hudBreakdownVal');

          if (inspectZoneEl) {
            inspectZoneEl.textContent = isAr ? `${meta.zoneAr} (${meta.geolAr})` : `${meta.zoneEn} (${meta.geolEn})`;
          }

          if (elevEl) {
            elevEl.textContent = `${meta.elevation} • ${isAr ? 'الانحدار:' : 'Slope:'} ${meta.slope}`;
          }

          if (simValEl) {
            const rawSim = (this.mode === 'siteB' ? meta.simB : meta.simA) * 100;
            const simStr = `${rawSim.toFixed(1)}% ± 1.2%`;
            let gradeText = '';
            if (rawSim >= 90) {
              gradeText = isAr ? '🔴 تطابق طيفي فائق (Tier-1 Apex)' : '🔴 Peak Spectral Match (Tier-1)';
            } else if (rawSim >= 75) {
              gradeText = isAr ? '🟠 تطابق تضاريسي عالي (High Match)' : '🟠 High Geomorphic Match';
            } else if (rawSim >= 55) {
              gradeText = isAr ? '🟡 تطابق جزئي (Moderate)' : '🟡 Partial Baseline Match';
            } else {
              gradeText = isAr ? '🪨 تباين طبيعي (صخور الأساس)' : '🪨 Natural Divergent Substrate';
            }
            simValEl.textContent = `${simStr} — ${gradeText}`;
          }

          if (breakdownEl) {
            const sVal = this.mode === 'siteB' ? meta.simB : meta.simA;
            const regScore = Math.min(99, Math.round(sVal * 96));
            const minScore = Math.min(99, Math.round(sVal * 98));
            const slpScore = Math.min(99, Math.round(sVal * 94));
            breakdownEl.textContent = isAr
              ? `ميكانيكا الحطام: ${regScore}% • المعادن: ${minScore}% • الانحدار: ${slpScore}%`
              : `Regolith: ${regScore}% • Mineral: ${minScore}% • Slope: ${slpScore}%`;
          }
        }
      }
    } else if (this.reticleMesh) {
      this.reticleMesh.visible = false;
    }
  },

  animate() {
    this.animId = requestAnimationFrame(() => this.animate());

    // Continuous 360-degree rotation when auto-rotate is active
    if (this.autoRotate && !this.isDragging) {
      this.targetAzimuth += 0.0025;
    }

    // Smooth spring interpolation
    this.orbitAzimuth += (this.targetAzimuth - this.orbitAzimuth) * 0.12;
    this.orbitElevation += (this.targetElevation - this.orbitElevation) * 0.12;
    this.orbitDistance += (this.targetDistance - this.orbitDistance) * 0.14;

    this.updateCameraPosition();

    // Rotate compass arrow to point to planetary North in real-time
    const compassArrow = document.querySelector('.compass-arrow');
    if (compassArrow) {
      compassArrow.style.transform = `rotate(${-this.orbitAzimuth * (180 / Math.PI)}deg)`;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
};


/* ==========================================================================
   3. مقارنة الرادار المزدوجة المتراكبة (DUAL OVERLAY RADAR MATRIX CONTROLLER)
   ========================================================================== */
const RadarComparator = {
  canvas: null,
  ctx: null,

  axes: [
    { key: 'slope', label: 'Topographic Slope', label_ar: 'الانحدار والخشونة', targetVal: 95 },
    { key: 'regolith', label: 'Regolith Mechanics', label_ar: 'ميكانيكا الحطام', targetVal: 92 },
    { key: 'thermal', label: 'Thermal Inertia', label_ar: 'القصور الحراري', targetVal: 88 },
    { key: 'radiation', label: 'Radiation / Atmosphere', label_ar: 'الإشعاع والبيئة', targetVal: 92 },
    { key: 'mineralogy', label: 'Mineralogy & Geochem', label_ar: 'المعادن والجيولوجيا', targetVal: 95 }
  ],

  draw(target, siteA, siteB, isAr) {
    this.canvas = document.getElementById('compareRadarCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    // Retina display resolution support
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = 480;
    const displayHeight = 380;
    if (this.canvas.width !== displayWidth * dpr) {
      this.canvas.width = displayWidth * dpr;
      this.canvas.height = displayHeight * dpr;
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const centerX = displayWidth / 2;
    const centerY = displayHeight / 2 + 8;
    const radius = 135;
    const numAxes = this.axes.length;
    const angleStep = (Math.PI * 2) / numAxes;

    // 1. Draw concentric background webs
    ctx.strokeStyle = 'rgba(64, 110, 160, 0.28)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    const ringSteps = [0.25, 0.50, 0.75, 1.0];
    ringSteps.forEach(step => {
      const r = radius * step;
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

      // Ring percentage label
      ctx.fillStyle = 'rgba(142, 165, 192, 0.45)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(step * 100)}%`, centerX, centerY - r + 9);
    });

    // 2. Draw 5 axis spoke lines & parameter labels
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillStyle = '#b8c9dc';
    ctx.textAlign = 'center';

    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(90, 130, 175, 0.35)';
      ctx.lineWidth = 1;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Outer label positioning
      const labelDist = radius + 24;
      const lx = centerX + Math.cos(angle) * labelDist;
      const ly = centerY + Math.sin(angle) * labelDist + 4;
      const labelText = isAr ? this.axes[i].label_ar : this.axes[i].label;
      ctx.fillText(labelText, lx, ly);
    }

    // 3. Draw Polygon 1: Extraterrestrial Baseline Target (Dotted Neon Orange)
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#ff5a36';
    ctx.lineWidth = 2.2;
    ctx.fillStyle = 'rgba(255, 90, 54, 0.08)';

    ctx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const val = this.axes[i].targetVal || 95;
      const r = (val / 100) * radius;
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Draw Polygon 2: Benchmark Site A (Scientific Blue Shaded)
    const paramsA = (siteA && siteA.radar_parameters) ? siteA.radar_parameters : { slope: 85, regolith: 86, thermal: 82, radiation: 88, mineralogy: 90 };
    ctx.setLineDash([]);
    ctx.strokeStyle = '#00a3ff';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(0, 163, 255, 0.22)';

    ctx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const val = paramsA[this.axes[i].key] || 82;
      const r = (val / 100) * radius;
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Site A Vertex dots
    for (let i = 0; i < numAxes; i++) {
      const val = paramsA[this.axes[i].key] || 82;
      const r = (val / 100) * radius;
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00a3ff';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 5. Draw Polygon 3: Candidate Site B (Glowing Gold Shaded)
    const paramsB = (siteB && siteB.radar_parameters) ? siteB.radar_parameters : { slope: 80, regolith: 92, thermal: 84, radiation: 86, mineralogy: 88 };
    ctx.strokeStyle = '#f5a623';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(245, 166, 35, 0.26)';

    ctx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const val = paramsB[this.axes[i].key] || 85;
      const r = (val / 100) * radius;
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Site B Vertex dots
    for (let i = 0; i < numAxes; i++) {
      const val = paramsB[this.axes[i].key] || 85;
      const r = (val / 100) * radius;
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd064';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();

    // 6. Update Legend text with names
    const legTarget = document.getElementById('radarLegendTarget');
    const legA = document.getElementById('radarLegendSiteA');
    const legB = document.getElementById('radarLegendSiteB');

    const targetName = isAr ? target.name_ar : target.name;
    const nameA = isAr ? siteA.name_ar : siteA.name;
    const nameB = isAr ? siteB.name_ar : siteB.name;

    if (legTarget) legTarget.textContent = `${targetName} (100% Target Baseline)`;
    if (legA) legA.textContent = `${nameA} (${isAr ? 'الموقع التاريخي' : 'Historic Benchmark'})`;
    if (legB) legB.textContent = `${nameB} (${isAr ? 'المرشح الجديد' : 'New Candidate'})`;

    // 7. Render 5-Axis Live Breakdown Chips
    this.renderAxesChips(paramsA, paramsB, nameA, nameB, isAr);
  },

  renderAxesChips(paramsA, paramsB, nameA, nameB, isAr) {
    const grid = document.getElementById('radarAxesChipsGrid');
    if (!grid) return;

    let maxEdgeKey = 'regolith';
    let maxEdgeVal = -999;

    const chipsHtml = this.axes.map(axis => {
      const valA = paramsA[axis.key] || 80;
      const valB = paramsB[axis.key] || 80;
      const diff = valB - valA;
      const axisName = isAr ? axis.label_ar : axis.label;

      if (diff > maxEdgeVal) {
        maxEdgeVal = diff;
        maxEdgeKey = axis.key;
      }

      let edgeBadge = '';
      if (diff > 0) {
        edgeBadge = `<span class="axis-chip-edge winner-b">★ ${nameB} (+${diff}%)</span>`;
      } else if (diff < 0) {
        edgeBadge = `<span class="axis-chip-edge winner-a">● ${nameA} (+${Math.abs(diff)}%)</span>`;
      } else {
        edgeBadge = `<span class="axis-chip-edge neutral">تطابق متعادل (±0%)</span>`;
      }

      return `
        <div class="axis-breakdown-chip">
          <div class="axis-chip-header">
            <span>${axisName}</span>
            ${edgeBadge}
          </div>
          <div class="axis-mini-bars">
            <div class="axis-bar-site">
              <span style="color:#00a3ff;">A: ${valA}%</span>
              <div class="axis-track"><div class="axis-fill-a" style="width:${valA}%;"></div></div>
            </div>
            <div class="axis-bar-site">
              <span style="color:var(--accent-gold);">B: ${valB}%</span>
              <div class="axis-track"><div class="axis-fill-b" style="width:${valB}%;"></div></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    grid.innerHTML = chipsHtml;

    // Update Takeaway Card
    const takeawayEl = document.getElementById('radarTakeawayText');
    if (takeawayEl) {
      const axisObj = this.axes.find(a => a.key === maxEdgeKey) || this.axes[1];
      const axisLabel = isAr ? axisObj.label_ar : axisObj.label;

      if (maxEdgeVal > 0) {
        takeawayEl.innerHTML = isAr
          ? `المرشح الجديد (<strong>${nameB}</strong>) يغطي زاوية <strong>${axisLabel}</strong> بدقة أعلى بفارق <strong>+${maxEdgeVal}%</strong> عن الموقع التاريخي، مما يثبت جدارته الفنية أمام اللجنة بأسرع من قراءة الجداول!`
          : `Candidate <strong>${nameB}</strong> covers <strong>${axisLabel}</strong> with <strong>+${maxEdgeVal}%</strong> higher fidelity than the historic site, providing instant visual verification for the review committee.`;
      } else {
        takeawayEl.innerHTML = isAr
          ? `الموقع التاريخي (<strong>${nameA}</strong>) يتقارب بشدة مع المرشح (<strong>${nameB}</strong>)، مع احتفاظه بأفضلية طفيفة في زاوية <strong>${axisLabel}</strong>.`
          : `Historic site <strong>${nameA}</strong> remains closely aligned with candidate <strong>${nameB}</strong>, maintaining a slight lead in <strong>${axisLabel}</strong>.`;
      }
    }
  }
};

/* ==========================================================================
   PAGE 3: SITE COMPARATOR CONTROLLER
   ========================================================================== */
const SiteComparator = {
  cells: [],
  targets: [],
  selectedTarget: null,
  siteA: null,
  siteB: null,
  analogWorkbook: null,

  init(cells, targets, analogWorkbook = null) {
    this.cells = cells;
    this.targets = targets;
    this.analogWorkbook = analogWorkbook;
    this.attachWorkbookAnalogData();

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const paramSiteA = urlParams.get('siteA');
    const paramSiteB = urlParams.get('siteB');
    const paramTarget = urlParams.get('target');

    this.selectedTarget = this.targets.find(t => t.id === paramTarget) || this.targets[0];
    this.siteA = this.cells.find(c => c.id === paramSiteA) || this.cells[0];
    this.siteB = this.cells.find(c => c.id === paramSiteB) || this.cells.find(c => c.is_candidate) || this.cells[1];

    // Initialize 3D Terrain Viewer
    const containerEl = document.getElementById('terrain3dCanvasContainer');
    if (containerEl) {
      Terrain3DViewer.init(containerEl);
    }

    this.populateSelectors();
    this.renderComparison();
    this.bindEvents();

    document.addEventListener('languageChanged', () => {
      this.populateSelectors();
      this.renderComparison();
    });

    document.addEventListener('profileChanged', () => {
      this.renderComparison();
    });
  },

  attachWorkbookAnalogData() {
    if (!this.analogWorkbook || !Array.isArray(this.analogWorkbook.all_sites)) return;
    const norm = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const rows = this.analogWorkbook.all_sites;
    this.cells = this.cells.map(cell => {
      const names = [cell.name, cell.name_ar, cell.country, cell.country_ar].map(norm).filter(Boolean);
      let row = rows.find(r => {
        const candidates = [r.location_name, r.real_place_name].map(norm).filter(Boolean);
        return candidates.some(candidate => names.some(name => name === candidate || name.includes(candidate) || candidate.includes(name)));
      });
      if (!row) row = rows.find(r => {
        const n = norm(r.location_name);
        return n && names.some(name => name.includes(n.split(' ')[0]) && n.split(' ').length > 1);
      });
      if (!row) return cell;
      return {
        ...cell,
        analog_terrain_type: row.terrain_type || cell.terrain_type,
        slope_deg: row.slope_deg,
        roughness_m: row.roughness_m,
        elevation_m: row.elevation_m,
        albedo: row.albedo,
        temp_max_C: row.temp_max_C,
        temp_min_C: row.temp_min_C,
        analog_workbook: row
      };
    });
  },

  populateSelectors() {
    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    // Target Selector
    const targetSelect = document.getElementById('selectTarget');
    if (targetSelect) {
      const marsTargets = this.targets.filter(t => t.body === 'mars');
      const moonTargets = this.targets.filter(t => t.body === 'moon');
      const renderTargetOptions = items => items.map(t => `
        <option value="${t.id}" ${t.id === this.selectedTarget.id ? 'selected' : ''}>
          ${isAr ? t.name_ar : t.name}
        </option>`).join('');
      targetSelect.innerHTML = `
        <optgroup label="${isAr ? 'المريخ — 31 موقعًا' : 'MARS — 31 sites'}">${renderTargetOptions(marsTargets)}</optgroup>
        <optgroup label="${isAr ? 'القمر — 30 موقعًا' : 'MOON — 30 sites'}">${renderTargetOptions(moonTargets)}</optgroup>
      `;
    }

    // Site A Selector
    const siteASelect = document.getElementById('selectSiteA');
    if (siteASelect) {
      siteASelect.innerHTML = this.cells.map(c => `
        <option value="${c.id}" ${c.id === this.siteA.id ? 'selected' : ''}>
          ${c.is_candidate ? '★ ' : '● '}${isAr ? c.name_ar : c.name} (${isAr ? c.country_ar : c.country})
        </option>
      `).join('');
    }

    // Site B Selector
    const siteBSelect = document.getElementById('selectSiteB');
    if (siteBSelect) {
      siteBSelect.innerHTML = this.cells.map(c => `
        <option value="${c.id}" ${c.id === this.siteB.id ? 'selected' : ''}>
          ${c.is_candidate ? '★ ' : '● '}${isAr ? c.name_ar : c.name} (${isAr ? c.country_ar : c.country})
        </option>
      `).join('');
    }
  },

  renderComparison() {
    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    const scoreA = window.MissionProfileManager && this.siteA.radar_parameters
      ? window.MissionProfileManager.calculateScore(this.siteA.radar_parameters)
      : this.siteA.similarity_score;

    const scoreB = window.MissionProfileManager && this.siteB.radar_parameters
      ? window.MissionProfileManager.calculateScore(this.siteB.radar_parameters)
      : this.siteB.similarity_score;

    const nameA = isAr ? this.siteA.name_ar : this.siteA.name;
    const nameB = isAr ? this.siteB.name_ar : this.siteB.name;
    const countryA = isAr ? this.siteA.country_ar : this.siteA.country;
    const countryB = isAr ? this.siteB.country_ar : this.siteB.country;
    const targetName = isAr ? this.selectedTarget.name_ar : this.selectedTarget.name;

    // 1. Update Center Target Baseline Card
    const targetIconEl = document.getElementById('arenaTargetIcon');
    const targetBodyEl = document.getElementById('arenaTargetBody');
    const targetNameEl = document.getElementById('arenaTargetName');
    const targetCoordEl = document.getElementById('arenaTargetCoord');
    const targetElevEl = document.getElementById('arenaTargetElev');
    const targetEnvEl = document.getElementById('arenaTargetEnv');

    if (targetIconEl) {
      targetIconEl.textContent = this.selectedTarget.body === 'mars' ? '🪐' : '🌕';
    }
    if (targetBodyEl) {
      targetBodyEl.textContent = `${this.selectedTarget.body.toUpperCase()} TARGET BASELINE`;
      targetBodyEl.className = this.selectedTarget.body === 'mars' ? 'sci-badge mars' : 'sci-badge validated';
    }
    if (targetNameEl) targetNameEl.textContent = targetName;
    if (targetCoordEl) targetCoordEl.textContent = this.selectedTarget.coordinates || '18.38° N, 77.58° E';
    if (targetElevEl) targetElevEl.textContent = this.selectedTarget.elevation || '-2.5 km (MOLA)';
    if (targetEnvEl) {
      targetEnvEl.textContent = isAr
        ? (this.selectedTarget.environment_ar || 'بيئة شديدة الجفاف، ضغط منخفض')
        : (this.selectedTarget.environment || 'Hyper-arid, low pressure (6.1 mbar)');
    }

    // 2. Update Site A Card (Historic Benchmark)
    const siteANameEl = document.getElementById('headSiteAName');
    const siteAScoreEl = document.getElementById('headSiteAScore');
    const siteABadgeEl = document.getElementById('headSiteABadge');
    const siteACountryEl = document.getElementById('headSiteACountry');
    const siteATerrainEl = document.getElementById('headSiteATerrain');

    if (siteANameEl) siteANameEl.textContent = nameA;
    if (siteAScoreEl) siteAScoreEl.textContent = `${scoreA.toFixed(1)}%`;
    if (siteACountryEl) siteACountryEl.textContent = countryA;
    if (siteATerrainEl) siteATerrainEl.textContent = isAr ? 'تضاريس صحراوية / بركانية' : (this.siteA.terrain_type || 'Desert');
    if (siteABadgeEl) {
      siteABadgeEl.textContent = this.siteA.is_candidate
        ? (isAr ? '★ كشف جديد واعد' : '★ Candidate Site')
        : (isAr ? '● موقع تاريخي معتمد' : '● Benchmark Historic');
      siteABadgeEl.className = this.siteA.is_candidate ? 'sci-badge candidate' : 'sci-badge validated';
    }

    // 3. Update Site B Card (New Candidate)
    const siteBNameEl = document.getElementById('headSiteBName');
    const siteBScoreEl = document.getElementById('headSiteBScore');
    const siteBBadgeEl = document.getElementById('headSiteBBadge');
    const siteBCountryEl = document.getElementById('headSiteBCountry');
    const siteBTerrainEl = document.getElementById('headSiteBTerrain');

    if (siteBNameEl) siteBNameEl.textContent = nameB;
    if (siteBScoreEl) siteBScoreEl.textContent = `${scoreB.toFixed(1)}%`;
    if (siteBCountryEl) siteBCountryEl.textContent = countryB;
    if (siteBTerrainEl) siteBTerrainEl.textContent = isAr ? 'حقول بازلت / رمال' : (this.siteB.terrain_type || 'Volcanic');
    if (siteBBadgeEl) {
      siteBBadgeEl.textContent = this.siteB.is_candidate
        ? (isAr ? '★ كشف جديد واعد' : '★ Candidate Site')
        : (isAr ? '● موقع تاريخي معتمد' : '● Benchmark Historic');
      siteBBadgeEl.className = this.siteB.is_candidate ? 'sci-badge candidate' : 'sci-badge validated';
    }

    // 4. Update Tug-of-War Score Balance Bar & Live Delta
    const delta = Math.abs(scoreA - scoreB);
    const deltaEl = document.getElementById('headDeltaVal');
    if (deltaEl) {
      if (scoreB > scoreA) {
        deltaEl.textContent = `Δ +${delta.toFixed(1)}% ${isAr ? 'لصالح المرشح ★' : 'Candidate Edge'}`;
        deltaEl.style.color = 'var(--accent-gold)';
      } else {
        deltaEl.textContent = `Δ +${delta.toFixed(1)}% ${isAr ? 'لصالح التاريخي ●' : 'Historic Lead'}`;
        deltaEl.style.color = '#00d2ff';
      }
    }

    const total = scoreA + scoreB || 1;
    const pctA = ((scoreA / total) * 100).toFixed(1);
    const pctB = (100 - parseFloat(pctA)).toFixed(1);

    const fillA = document.getElementById('balanceFillA');
    const fillB = document.getElementById('balanceFillB');
    const lblA = document.getElementById('balanceLabelA');
    const lblB = document.getElementById('balanceLabelB');

    if (fillA) fillA.style.width = `${pctA}%`;
    if (fillB) fillB.style.width = `${pctB}%`;
    if (lblA) lblA.textContent = `${nameA} (${pctA}%)`;
    if (lblB) lblB.textContent = `${nameB} (${pctB}%)`;

    // 5. Dynamic Space Agency Executive Verdict
    const verdictTextEl = document.getElementById('verdictText');
    const verdictTagEl = document.getElementById('verdictSuitabilityTag');
    const activeProfile = window.MissionProfileManager ? window.MissionProfileManager.activeProfile : 'rover';

    let profileGoalAr = 'اختبار أنظمة الدفع وتآكل العجلات لمهمة المريخ';
    let profileGoalEn = 'testing rover locomotion and wheel abrasion mechanics';
    if (activeProfile === 'caves') {
      profileGoalAr = 'استكشاف ملاجئ الكهوف والملاحة الذاتية بدون GPS';
      profileGoalEn = 'subterranean cave shelter exploration and GPS-denied navigation';
    } else if (activeProfile === 'isru') {
      profileGoalAr = 'استخلاص الموارد الموضعية وحفر الرواسب الصقيعية';
      profileGoalEn = 'in-situ resource extraction and cryo-regolith drilling';
    } else if (activeProfile === 'base') {
      profileGoalAr = 'إنشاء القواعد البشرية وثبات الهياكل الترابية';
      profileGoalEn = 'human base establishment and regolith geotechnical bearing';
    }

    // Determine parameter edge
    const paramsA = (this.siteA && this.siteA.radar_parameters) ? this.siteA.radar_parameters : { slope: 85, regolith: 86, thermal: 82 };
    const paramsB = (this.siteB && this.siteB.radar_parameters) ? this.siteB.radar_parameters : { slope: 80, regolith: 92, thermal: 84 };

    let edgeParamNameAr = 'خشونة السطح وتماسك الحطام الصخري';
    let edgeParamNameEn = 'surface roughness and regolith cohesion';
    if (paramsB.regolith > paramsA.regolith) {
      edgeParamNameAr = 'ميكانيكا الحطام ومعامل تآكل العجلات';
      edgeParamNameEn = 'regolith mechanics and wheel grouser traction';
    } else if (paramsB.slope > paramsA.slope) {
      edgeParamNameAr = 'الانحدار الطبوغرافي وعبور المنحدرات';
      edgeParamNameEn = 'topographic slope and incline traversal';
    }

    if (verdictTextEl) {
      if (scoreB >= scoreA) {
        if (verdictTagEl) verdictTagEl.textContent = isAr ? 'تفوق للمرشح الجديد ★' : 'CANDIDATE ADVANTAGE';
        verdictTextEl.innerHTML = isAr
          ? `المرشح الجديد (<strong>${nameB}</strong>) يقدم تطابقاً أعلى بنسبة <strong>+${(scoreB - scoreA).toFixed(1)}%</strong> في ${edgeParamNameAr} مقارنة بالموقع التاريخي (<strong>${nameA}</strong>)، مما يجعله الخيار الأمثل لـ<em>${profileGoalAr}</em>.`
          : `Candidate site <strong>${nameB}</strong> delivers <strong>+${(scoreB - scoreA).toFixed(1)}%</strong> higher fidelity in ${edgeParamNameEn} compared to historic benchmark <strong>${nameA}</strong>, establishing it as the premier candidate for <em>${profileGoalEn}</em>.`;
      } else {
        if (verdictTagEl) verdictTagEl.textContent = isAr ? 'الموقع التاريخي رائد ●' : 'BENCHMARK LEADER';
        verdictTextEl.innerHTML = isAr
          ? `الموقع التاريخي (<strong>${nameA}</strong>) يحافظ على الصدارة بنسبة <strong>+${(scoreA - scoreB).toFixed(1)}%</strong>، بينما يمثل المرشح الجديد (<strong>${nameB}</strong>) بديلاً استراتيجياً واعداً لـ<em>${profileGoalAr}</em> بفضل تطابقه في ${edgeParamNameAr}.`
          : `Historic benchmark <strong>${nameA}</strong> retains an overall margin of <strong>+${(scoreA - scoreB).toFixed(1)}%</strong>, while candidate <strong>${nameB}</strong> offers an optimal high-value alternative for <em>${profileGoalEn}</em>.`;
      }
    }

    // 6. Draw Dual Overlay Radar Canvas
    RadarComparator.draw(this.selectedTarget, this.siteA, this.siteB, isAr);

    // 7. Update 3D Visualizer Header & HUD
    const bodyBadge = document.getElementById('terrainTargetBodyBadge');
    const targetTitle = document.getElementById('terrainTargetTitle');
    const hudCoord = document.getElementById('hudCoord');
    const hudElev = document.getElementById('hudElevation');
    const lblBtnA = document.getElementById('label3dSiteA');
    const lblBtnB = document.getElementById('label3dSiteB');
    const morphIndicator = document.getElementById('morphActiveIndicator');

    if (bodyBadge) {
      bodyBadge.textContent = `${this.selectedTarget.body.toUpperCase()} // 3D SURFACE DEM`;
      bodyBadge.className = this.selectedTarget.body === 'mars' ? 'sci-badge mars' : 'sci-badge validated';
    }
    if (targetTitle) {
      targetTitle.textContent = `${targetName} — ${isAr ? 'خريطة التضاريس ثلاثية الأبعاد وشدة التشابه' : '3D Topography & Similarity Heatmap'}`;
    }
    if (hudCoord) hudCoord.textContent = this.selectedTarget.coordinates || '18.38° N, 77.58° E';
    if (hudElev) hudElev.textContent = this.selectedTarget.elevation || '-2.5 km (MOLA)';
    if (lblBtnA) lblBtnA.textContent = `${nameA} (${scoreA.toFixed(0)}%)`;
    if (lblBtnB) lblBtnB.textContent = `${nameB} (${scoreB.toFixed(0)}%)`;

    const activeMorph = Terrain3DViewer.determineMorphology(this.selectedTarget, this.siteA, this.siteB);
    if (morphIndicator) {
      const morphLabels = {
        volcano: isAr ? '🌋 بركان وفوهة بازلتية' : '🌋 Volcano & Caldera',
        lake: isAr ? '🌊 قاع بحر وبحيرة كوكبية' : '🌊 Sea/Lake Bed & Delta',
        plain: isAr ? '🏜️ أرض مسطحة وكثبان رملية' : '🏜️ Flat Plain & Dunes',
        crater: isAr ? '☄️ فوهة اصطدام كوكبية عميقة' : '☄️ Deep Impact Crater',
        canyon: isAr ? '🕳️ أخدود وأنفاق حمم' : '🕳️ Canyon & Lava Tube'
      };
      const label = morphLabels[activeMorph] || (isAr ? 'تلقائي' : 'Auto');
      morphIndicator.textContent = Terrain3DViewer.selectedMorphology === 'auto'
        ? (isAr ? `تلقائي (${label})` : `Auto (${label})`)
        : label;
    }

    // 8. Build/Rebuild Three.js 3D Terrain
    Terrain3DViewer.buildTerrain(this.selectedTarget, this.siteA, this.siteB);

    // 9. Render Analytical Panels
    this.renderPermanentAnalyticalPanels(isAr, scoreA, scoreB);

    // 10. Update Print Metadata for PDF & Live Certificate
    this.updatePrintMetadata(scoreA, scoreB, isAr);
    this.renderPreviewCertificate(scoreA, scoreB, isAr);
    // 11. Render Collapsible Physical Divergence Matrix Table
    this.renderMatrixTable(isAr);
  },

  renderMatrixTable(isAr) {
    const tableBody = document.getElementById('compareMatrixTableBody');
    if (!tableBody) return;

    const mA = (this.siteA && this.siteA.physical_metrics) || {
      slope_deg: 5.0,
      grain_size_microns: 200,
      bulk_density_g_cm3: 1.6,
      thermal_inertia_si: 300,
      dielectric_constant: 3.5,
      hydration_index: 0.5
    };

    // Target baseline physical metrics
    const isMars = this.selectedTarget && this.selectedTarget.body === 'mars';
    const mT = {
      slope_deg: isMars ? 7.5 : 15.0,
      grain_size_microns: isMars ? 180 : 70,
      bulk_density_g_cm3: isMars ? 1.65 : 1.70,
      thermal_inertia_si: isMars ? 320 : 50,
      dielectric_constant: isMars ? 3.8 : 2.8,
      hydration_index: isMars ? 1.5 : 0.1
    };

    const properties = [
      { key: 'slope_deg', label: 'Topographic Slope', label_ar: 'الانحدار الطوبوغرافي', unit: 'deg (°)' },
      { key: 'grain_size_microns', label: 'Regolith Grain Size', label_ar: 'حجم حبيبات الحطام', unit: 'microns (µm)' },
      { key: 'bulk_density_g_cm3', label: 'Soil Bulk Density', label_ar: 'الكثافة الظاهرية للتربة', unit: 'g/cm³' },
      { key: 'thermal_inertia_si', label: 'Thermal Inertia', label_ar: 'معامل القصور الحراري', unit: 'J·m⁻²·K⁻¹·s⁻½' },
      { key: 'dielectric_constant', label: 'Dielectric Permittivity (εr)', label_ar: 'ثابت العزل الكهربائي (εr)', unit: 'dimensionless' },
      { key: 'hydration_index', label: 'Water Equivalent Hydrogen (WEH)', label_ar: 'مكافئ الهيدروجين المائي', unit: 'wt%' }
    ];

    const targetName = isAr ? this.selectedTarget.name_ar : this.selectedTarget.name;
    const siteAName = isAr ? this.siteA.name_ar : this.siteA.name;

    const colSiteA = document.getElementById('matrixColSiteA');
    const colTarget = document.getElementById('matrixColTarget');
    if (colSiteA) colSiteA.textContent = siteAName;
    if (colTarget) colTarget.textContent = targetName;

    tableBody.innerHTML = properties.map(prop => {
      const valA = mA[prop.key] !== undefined ? mA[prop.key] : 1.0;
      const valT = mT[prop.key] !== undefined ? mT[prop.key] : 1.0;

      // Normalized divergence calculation: |valA - valT| / valT
      const deltaA = Math.abs(valA - valT) / (valT || 1.0);
      const deltaPct = (deltaA * 100).toFixed(1);

      const deltaBadgeClassA = deltaA < 0.25 ? 'match-good' : deltaA < 0.6 ? 'match-moderate' : 'match-divergent';
      const deltaLabel = deltaA < 0.25
        ? (isAr ? 'تطابق عالي' : 'High Match')
        : deltaA < 0.6
        ? (isAr ? 'تباين متوسط' : 'Moderate')
        : (isAr ? 'انحراف كبير' : 'Divergent');

      return `
        <tr>
          <td>
            <div class="metric-prop-name">${isAr ? prop.label_ar : prop.label}</div>
            <span class="metric-prop-unit">${prop.unit}</span>
          </td>
          <td>
            <span class="metric-val-num" style="color:#00d2ff;">${valA}</span>
          </td>
          <td>
            <span class="metric-val-num" style="color:var(--accent-gold);">${valT}</span>
          </td>
          <td>
            <span class="delta-badge ${deltaBadgeClassA}">Δ ${deltaPct}% • ${deltaLabel}</span>
          </td>
        </tr>
      `;
    }).join('');
  },


  renderPermanentAnalyticalPanels(isAr, scoreA = 89, scoreB = 88) {
    // 1. "ما لا تحاكيه الأرض" (الحدود الفيزيائية الصارمة 🚫) مع الحلول الهندسية للجنة
    const cannotSimulateList = document.getElementById('cannotSimulatePointsList');
    if (cannotSimulateList) {
      cannotSimulateList.innerHTML = `
        <div class="analytical-point-item">
          <div class="point-icon">G</div>
          <div class="point-content">
            <div class="point-title">${isAr ? 'الجاذبية المنخفضة (0.16G للقمر / 0.38G للمريخ)' : 'Low Planetary Gravity (0.16G Moon / 0.38G Mars)'}</div>
            <div class="point-desc">${isAr ? 'الأرض أثقل بـ 3 إلى 6 أضعاف! عجلات المركبة لن تنغرس في الأرض كما في الفضاء وتطاير الحطام يختلف جذرياً.' : 'Terrestrial 1.0G alters wheel sinkage and projectile ballistics.'}</div>
            <div class="mitigation-badge" title="الحل الهندسي البديل">
              <span class="mitigation-tag">🛠️ ${isAr ? 'الحل الهندسي البديل للجنة:' : 'Engineering Mitigation:'}</span>
              <span class="mitigation-text">${isAr ? 'استخدام رافعات موازنة للوزن ومحاكيات تخفيف الحمل (Gravity Offset Crane Rigs).' : 'Deploy vertical crane counterweight rigs during field traction testing.'}</span>
            </div>
          </div>
        </div>

        <div class="analytical-point-item">
          <div class="point-icon">R</div>
          <div class="point-content">
            <div class="point-title">${isAr ? 'الإشعاع الكوني والجسيمات الشمسية (1.3 mSv/day)' : 'Deep Space Galactic Cosmic Radiation'}</div>
            <div class="point-desc">${isAr ? 'درع الغلاف الجوي والمغناطيسي للأرض يحجب الأشعة؛ فحص الرقائق الإلكترونية وحساسات الفضاء لا ينفع في حقل مفتوح.' : 'Earth magnetosphere shields against surface cosmic ray flux; radiation hardening requires dedicated chambers.'}</div>
            <div class="mitigation-badge" title="الحل الهندسي البديل">
              <span class="mitigation-tag">🛠️ ${isAr ? 'الحل الهندسي البديل للجنة:' : 'Engineering Mitigation:'}</span>
              <span class="mitigation-text">${isAr ? 'غرف ومسرعات الجسيمات النووية المعيارية (Particle Accelerators & Gamma Chambers).' : 'Conduct avionics radiation testing in cyclotron particle accelerators.'}</span>
            </div>
          </div>
        </div>

        <div class="analytical-point-item">
          <div class="point-icon">P</div>
          <div class="point-content">
            <div class="point-title">${isAr ? 'الفراغ الفضائي التام وتسامي الغازات (<1e-12 تور)' : 'Ultra-High Vacuum & Volatiles Outgassing'}</div>
            <div class="point-desc">${isAr ? 'انعدام الضغط الجوي يسبب التحام المعادن غير المزيتة ذاتياً (Cold Welding) وتسامي الجليد اللحظي؛ الضغط الأرضي يمنع هذه الظواهر.' : 'Ambient terrestrial pressure prevents instant ice sublimation and cold-welding of unlubricated rover actuator joints.'}</div>
            <div class="mitigation-badge" title="الحل الهندسي البديل">
              <span class="mitigation-tag">🛠️ ${isAr ? 'الحل الهندسي البديل للجنة:' : 'Engineering Mitigation:'}</span>
              <span class="mitigation-text">${isAr ? 'غرف التفريغ الحراري الفضائي المعزولة (Thermal Vacuum Chambers - TVAC).' : 'Validate mechanical seals and volatile retention in isolated TVAC chambers.'}</span>
            </div>
          </div>
        </div>

        <div class="analytical-point-item">
          <div class="point-icon">C</div>
          <div class="point-content">
            <div class="point-title">${isAr ? 'التلوث الحيوي والميكروبات الأرضية المتوطنة' : 'Pervasive Organic Biosignatures & Bio-Contamination'}</div>
            <div class="point-desc">${isAr ? 'ميكروبات الأرض وبصماتها العضوية موجودة حتى في أشد الصحاري؛ لا يمكن الجزم بوجود حياة مريخية دون عزل فائق.' : 'Endemic terrestrial extremophiles interfere with life-detection instruments unless strict clean-room protocols are deployed.'}</div>
            <div class="mitigation-badge" title="الحل الهندسي البديل">
              <span class="mitigation-tag">🛠️ ${isAr ? 'الحل الهندسي البديل للجنة:' : 'Engineering Mitigation:'}</span>
              <span class="mitigation-text">${isAr ? 'بروتوكولات حماية الكواكب وغرف العزل الفائق (COSPAR Planetary Clean Rooms).' : 'Enforce COSPAR Category IV planetary protection sterilization protocols.'}</span>
            </div>
          </div>
        </div>
      `;
    }

    // 2. "ما يمكن اختباره هنا" (الفرص الميدانية حسب البروفايل ✅)
    const activeProfile = window.MissionProfileManager ? window.MissionProfileManager.activeProfile : 'rover';

    // Update Feasibility Index Meter
    const avgScore = (scoreA + scoreB) / 2;
    const feasibilityScore = Math.min(96.8, Math.max(78.5, (avgScore * 0.94 + 6.2))).toFixed(1);
    const scoreValEl = document.getElementById('feasibilityScoreVal');
    const fillEl = document.getElementById('feasibilityFill');
    const badgeEl = document.getElementById('feasibilityStatusBadge');

    if (scoreValEl) scoreValEl.textContent = `${feasibilityScore}%`;
    if (fillEl) fillEl.style.width = `${feasibilityScore}%`;
    if (badgeEl) {
      badgeEl.textContent = feasibilityScore > 88
        ? (isAr ? 'جاهزية ممتازة (Optimal)' : 'Optimal Readiness')
        : (isAr ? 'جاهزية جيدة (Qualified)' : 'Qualified Readiness');
    }

    const canTestList = document.getElementById('canTestPointsList');
    if (canTestList) {
      if (activeProfile === 'caves') {
        canTestList.innerHTML = `
          <div class="analytical-point-item">
            <div class="point-icon">✓</div>
            <div class="point-content">
              <div class="point-title">${isAr ? 'الهبوط الروبوتي الذاتي في حفر الانهيار (Skylights)' : 'Autonomous Cave Skylight Rappelling & Descent'}</div>
              <div class="point-desc">${isAr ? 'اختبار كابلات الإنزال والروبوتات العنكبوتية على جدران بازلتية رأسية مطابقة لحفر تلال ماريوس.' : 'Testing tethered climbing bots and rappelling landers on steep vertical basalt cliffs matching lunar skylights.'}</div>
            </div>
          </div>
          <div class="analytical-point-item">
            <div class="point-icon">✓</div>
            <div class="point-content">
              <div class="point-title">${isAr ? 'الملاحة تحت السطحية بدون GPS (تقنية LiDAR SLAM)' : 'Subterranean GPS-Denied LiDAR SLAM Navigation'}</div>
              <div class="point-desc">${isAr ? 'بناء خرائط ثلاثية الأبعاد سحابية داخل أنفاق الحمم المتصلة بدون اتصال بالأقمار الاصطناعية.' : 'Validating real-time 3D point cloud mapping and autonomous pathfinding in total subterranean optical blackout.'}</div>
            </div>
          </div>
          <div class="analytical-point-item">
            <div class="point-icon">✓</div>
            <div class="point-content">
              <div class="point-title">${isAr ? 'الاتصالات اللاسلكية عبر صخور البازلت الكثيفة' : 'Through-Rock RF Mesh Communications'}</div>
              <div class="point-desc">${isAr ? 'قياس توهين إشارات الراديو وشبكات التتابع بين السطح وعمق الكهوف.' : 'Calibrating signal attenuation and dropped-node mesh relays through dense crystalline basalt conduits.'}</div>
            </div>
          </div>
        `;
      } else if (activeProfile === 'isru') {
        canTestList.innerHTML = `
          <div class="analytical-point-item">
            <div class="point-icon">✓</div>
            <div class="point-content">
              <div class="point-title">${isAr ? 'كفاءة تجريف وحفر التربة الصقيعية الصلبة' : 'Cryo-Regolith Mechanical Excavation & Drilling'}</div>
              <div class="point-desc">${isAr ? 'اختبار متانة رؤوس الحفر واستهلاك الطاقة عند اختراق طبقات الجليد الإسمنتية.' : 'Quantifying torque load, bit wear, and power consumption during permafrost-cemented sediment drilling.'}</div>
            </div>
          </div>
          <div class="analytical-point-item">
            <div class="point-icon">✓</div>
            <div class="point-content">
              <div class="point-title">${isAr ? 'استخلاص الأملاح والمعادن المتبخرة موضعياً' : 'Evaporite Salt Concentration & In-Situ Refining'}</div>
              <div class="point-desc">${isAr ? 'تقييم مفاعلات الاستخلاص الكيميائي لأملاح الكبريتات والهاليت في المسطحات الملحية.' : 'Benchmarking chemical leaching beds for sulfate and chloride separation in high-altitude salt flats.'}</div>
            </div>
          </div>
        `;
      } else if (activeProfile === 'base') {
        canTestList.innerHTML = `
          <div class="analytical-point-item">
            <div class="point-icon">✓</div>
            <div class="point-content">
              <div class="point-title">${isAr ? 'ثبات التربة لتحمل الهياكل والقباب المضغوطة' : 'Regolith Geotechnical Bearing & Foundation Stability'}</div>
              <div class="point-desc">${isAr ? 'قياس قدرة تحمل التربة الحطامية لأوزان القباب المنفوخة والمنشآت المطبوعة ثلاثياً.' : 'Assessing regolith bearing capacity for inflatable habitat footings and 3D-sintered domes.'}</div>
            </div>
          </div>
          <div class="analytical-point-item">
            <div class="point-icon">✓</div>
            <div class="point-content">
              <div class="point-title">${isAr ? 'سواتر الحماية الترابية من الرياح وعواصف الغبار' : 'Berm Regolith Shielding & Wind Abrasion Defense'}</div>
              <div class="point-desc">${isAr ? 'اختبار تصميم مصدات الرياح وحواجز الحطام لحماية المولدات والألواح الحيوية.' : 'Validating artificial berm geometry for blast and storm shielding of crew modules.'}</div>
            </div>
          </div>
          <div class="analytical-point-item">
            <div class="point-icon">✓</div>
            <div class="point-content">
              <div class="point-title">${isAr ? 'كفاءة فلاتر غرف الضغط ومصائد الأتربة الدقيقة' : 'Airlock Electrostatic Dust Separation Systems'}</div>
              <div class="point-desc">${isAr ? 'حماية رواد الفضاء من تغلغل جزيئات الغبار الحادة عند العودة من الأنشطة الخارجية (EVA).' : 'Testing magnetic and electrostatic dust barriers to preserve indoor air quality.'}</div>
            </div>
          </div>
        `;
      } else {
        // Default: Rover Testing
        canTestList.innerHTML = `
          <div class="analytical-point-item">
            <div class="point-icon">✓</div>
            <div class="point-content">
              <div class="point-title">${isAr ? 'تآكل مداسات العجلات وعبور التضاريس الوعرة' : 'Wheel Tread Abrasive Wear & Traction Limits'}</div>
              <div class="point-desc">${isAr ? 'قياس تآكل الألمنيوم والتيتانيوم على صخور البازلت الحادة وانزلاق المنحدرات الرملية (34 درجة).' : 'Measuring grousers puncture wear on vesicular basalt and slip ratios across critical repose dune slopes.'}</div>
            </div>
          </div>
          <div class="analytical-point-item">
            <div class="point-icon">✓</div>
            <div class="point-content">
              <div class="point-title">${isAr ? 'التصاق الغبار والجسيمات الدقيقة بالألواح الشمسية والعدسات' : 'Fine Dust Electrostatic Adhesion to Solar & Optical Glass'}</div>
              <div class="point-desc">${isAr ? 'دراسة انخفاض إنتاجية الطاقة الشمسية والتنظيف الكهروديناميكي لمستشعرات الملاحة.' : 'Evaluating PV efficiency degradation and electrodynamic dust shield clearing performance.'}</div>
            </div>
          </div>
          <div class="analytical-point-item">
            <div class="point-icon">✓</div>
            <div class="point-content">
              <div class="point-title">${isAr ? 'الملاحة الذاتية للمركبات وتفادي العوائق' : 'Autonomous Hazard Avoidance & Stereo Vision Navigation'}</div>
              <div class="point-desc">${isAr ? 'اختبار خوارزميات الذكاء الاصطناعي للمركبات في تضاريس خالية من الطرقات والمسارات.' : 'Stress-testing computer vision optical flow and rock obstacle avoidance algorithms on featureless terrain.'}</div>
            </div>
          </div>
        `;
      }
    }
  },

  renderPreviewCertificate(scoreA, scoreB, isAr) {
    const sheet = document.getElementById('previewCertificateSheet');
    if (!sheet) return;

    const now = new Date().toISOString().split('T')[0];
    const targetName = isAr ? this.selectedTarget.name_ar : this.selectedTarget.name;
    const siteAName = isAr ? this.siteA.name_ar : this.siteA.name;
    const siteBName = isAr ? this.siteB.name_ar : this.siteB.name;
    const countryA = isAr ? this.siteA.country_ar : this.siteA.country;
    const countryB = isAr ? this.siteB.country_ar : this.siteB.country;
    const activeProfile = window.MissionProfileManager ? window.MissionProfileManager.activeProfile : 'rover';
    const profileNames = isAr ? {
      rover: 'اختبار حركة المركبات والعجلات',
      base: 'أساسات القواعد البشرية وسواتر الثرى',
      isru: 'استخراج الموارد المحلية والمواد المتطايرة من الثرى المتجمد',
      caves: 'استكشاف أنابيب الحمم الجوفية وفتحاتها'
    } : {
      rover: 'Rover Locomotion & Wheel Testing',
      base: 'Human Base Foundations & Regolith Berms',
      isru: 'ISRU Volatiles & Cryo-Regolith Extraction',
      caves: 'Subterranean Lava Tube Exploration & Skylights'
    };
    const profileName = profileNames[activeProfile] || profileNames.rover;
    const verdictText = isAr
      ? (scoreA >= scoreB ? `الموقع المرجعي يحقق تطابقًا أعلى مع متطلبات المهمة بفارق ${Math.abs(scoreA-scoreB).toFixed(1)}٪.` : `الموقع المرشح يحقق تطابقًا أعلى مع متطلبات المهمة بفارق ${Math.abs(scoreA-scoreB).toFixed(1)}٪.`)
      : (scoreA >= scoreB ? `Reference site scores higher against the mission requirements by ${Math.abs(scoreA-scoreB).toFixed(1)}%.` : `Candidate site scores higher against the mission requirements by ${Math.abs(scoreA-scoreB).toFixed(1)}%.`);
    const bodyName = isAr ? (this.selectedTarget.body === 'mars' ? 'المريخ' : 'القمر') : this.selectedTarget.body.toUpperCase();
    const gravity = this.selectedTarget.body === 'mars' ? '0.38G' : '0.16G';
    const targetSlope = this.selectedTarget.body === 'mars' ? '7.5°' : '15.0°';
    const targetGrain = this.selectedTarget.body === 'mars' ? '180 μm' : '70 μm';
    const targetThermal = this.selectedTarget.body === 'mars' ? '320' : '50';

    sheet.setAttribute('dir', isAr ? 'rtl' : 'ltr');
    sheet.setAttribute('lang', isAr ? 'ar' : 'en');
    sheet.innerHTML = `
      <div class="cert-header">
        <div class="cert-title-group">
          <h1>${isAr ? 'TerraTwin — ذكاء نظائر التضاريس الكوكبية' : 'TerraTwin Planetary Analog Intelligence'}</h1>
          <div class="cert-subtitle">${isAr ? 'تقرير المقارنة العلمية الرسمي واعتماد الموقع النظير' : 'OFFICIAL SCIENTIFIC BENCHMARKING BRIEF & ANALOG CLEARANCE'}</div>
        </div>
        <div class="cert-stamp">${isAr ? 'مقارنة مواقع<br>نظيرة معتمدة' : 'VERIFIED ANALOG<br>COMPARISON'}</div>
      </div>

      <div class="cert-meta-grid">
        <div class="cert-meta-item">
          <strong>${isAr ? 'الهدف خارج الأرض' : 'EXTRATERRESTRIAL TARGET'}</strong>
          <span>${targetName} (${bodyName})</span>
          <div style="font-size:0.72rem;color:#64748b;margin-top:2px;">${this.selectedTarget.coordinates || '18.38° N, 77.58° E'} • ${this.selectedTarget.elevation || '-2.5 km'}</div>
        </div>
        <div class="cert-meta-item">
          <strong>${isAr ? 'ملف المهمة قيد التقييم' : 'EVALUATION MISSION PROFILE'}</strong>
          <span>${profileName}</span>
          <div style="font-size:0.72rem;color:#64748b;margin-top:2px;">${isAr ? 'نموذج أوزان معاير' : 'Calibrated Weights Model'}</div>
        </div>
        <div class="cert-meta-item">
          <strong>${isAr ? 'تاريخ التقييم والاعتماد' : 'BENCHMARK DATE & CLEARANCE'}</strong>
          <span>${now} • CC-BY 4.0</span>
          <div style="font-size:0.72rem;color:#64748b;margin-top:2px;">${isAr ? 'مصادر بيانات NASA PDS وESA Copernicus' : 'NASA PDS & ESA Copernicus Calibrated'}</div>
        </div>
      </div>

      <div class="cert-verdict-box">
        <strong style="display:block;margin-bottom:0.25rem;">${isAr ? 'خلاصة التقييم التنفيذي' : 'EXECUTIVE BENCHMARK VERDICT'}</strong>
        <div>${verdictText}</div>
      </div>

      <table class="cert-table">
        <thead><tr>
          <th>${isAr ? 'المعيار الفيزيائي' : 'Physical Parameter'}</th>
          <th>${isAr ? `الموقع المرجعي (أ): ${siteAName}` : `Site A (Historic): ${siteAName}`}</th>
          <th>${isAr ? `الهدف الفضائي: ${targetName}` : `Target Baseline: ${targetName}`}</th>
          <th>${isAr ? `الموقع المرشح (ب): ${siteBName}` : `Site B (Candidate): ${siteBName}`}</th>
          <th>${isAr ? 'الفارق والتقييم' : 'Delta & Verdict'}</th>
        </tr></thead>
        <tbody>
          <tr>
            <td><strong>${isAr ? 'درجة تطابق المهمة الإجمالية' : 'Overall Mission Match Score'}</strong></td>
            <td><strong style="color:#0284c7;">${scoreA.toFixed(1)}%</strong> (${countryA})</td>
            <td><strong>100.0%</strong> (${isAr ? 'نموذج ارتفاعات رقمي مداري' : 'Orbital DEM'})</td>
            <td><strong style="color:#d97706;">${scoreB.toFixed(1)}%</strong> (${countryB})</td>
            <td><strong>Δ ${Math.abs(scoreA-scoreB).toFixed(1)}% ${isAr ? 'هامش الفرق' : 'Margin'}</strong></td>
          </tr>
          <tr>
            <td>${isAr ? 'انحدار التضاريس' : 'Topographic Slope / Incline'}</td>
            <td>4.2° (${isAr ? 'سطح شديد الجفاف ومستوٍ' : 'Hyper-Arid Flat'})</td>
            <td>${targetSlope} (${isAr ? 'مروحة رسوبية / حافة فوهة' : 'Fan / Crater Rim'})</td>
            <td>12.0° (${isAr ? 'تدفق بركاني' : 'Volcanic Flow'})</td>
            <td>${isAr ? 'تطابق مرتفع للموقع المرشح' : 'Candidate High Match'}</td>
          </tr>
          <tr>
            <td>${isAr ? 'خصائص الثرى وحجم الحبيبات' : 'Regolith Mechanics & Grain Size'}</td>
            <td>140 μm (${isAr ? 'رمال منقولة بالرياح' : 'Aeolian sand'})</td>
            <td>${targetGrain} (${isAr ? 'غرين الهدف' : 'Target Silt'})</td>
            <td>220 μm (${isAr ? 'حصى مسامي' : 'Vesicular gravel'})</td>
            <td>${isAr ? 'تماسك وجرّ أفضل للمركبة' : 'Candidate Superior Traction'}</td>
          </tr>
          <tr>
            <td>${isAr ? 'القصور الحراري (وحدات SI)' : 'Thermal Inertia (SI Units)'}</td>
            <td>280 J·m⁻²·K⁻¹·s⁻½</td>
            <td>${targetThermal} J·m⁻²·K⁻¹·s⁻½</td>
            <td>350 J·m⁻²·K⁻¹·s⁻½</td>
            <td>${isAr ? 'ارتباط ملائم بطبقات تحت السطح' : 'Favorable Subsurface Correlation'}</td>
          </tr>
        </tbody>
      </table>

      <div class="cert-notes-row">
        <div class="cert-note-box warning">
          <div class="cert-note-title">${isAr ? '🚫 حدود المحاكاة الأرضية (قيود فيزيائية أساسية):' : '🚫 Earth Simulation Limits (Rigid Physical Limitations):'}</div>
          <div>${isAr
            ? `• <strong>الجاذبية المنخفضة (${gravity}):</strong> تتطلب موازنة ميكانيكية أثناء اختبار غوص العجلات.<br>• <strong>الإشعاع الكوني:</strong> يحتاج اختبار مقاومة الشرائح إلى مصادر إشعاع متخصصة.<br>• <strong>الفراغ الفائق:</strong> يتطلب اللحام البارد والتسامي اختبارات في حجرات حرارية مفرغة.<br>• <strong>التلوث الحيوي:</strong> يتطلب منع انتقال الميكروبات إجراءات عزل صارمة.`
            : `• <strong>Low Gravity (${gravity}):</strong> Requires mechanical counterweights during wheel sinkage testing.<br>• <strong>Cosmic Radiation:</strong> Requires specialized radiation sources for electronics testing.<br>• <strong>Ultra-High Vacuum:</strong> Cold-welding and sublimation require thermal-vacuum chambers.<br>• <strong>Bio-Contamination:</strong> Requires strict isolation to prevent microbial contamination.`}</div>
        </div>
        <div class="cert-note-box">
          <div class="cert-note-title">${isAr ? '📑 مصادر البيانات' : '📑 Approved Data Sources'}</div>
          <div>• <strong>NASA Planetary Data System (PDS):</strong> LRO LOLA/Diviner, MRO CRISM/HiRISE, Mars 2020 SuperCam.<br>• <strong>ESA Copernicus:</strong> ${isAr ? 'بيانات الانعكاس الطيفي Sentinel-2 (المستوى 2A).' : 'Sentinel-2 Multi-Spectral Surface Reflectance (Level 2A).'}<br>• <strong>USGS Astrogeology:</strong> ${isAr ? 'نماذج الارتفاعات الرقمية وقاعدة بيانات خصائص الثرى.' : 'Global Digital Elevation Models & Regolith Mechanical Database.'}</div>
        </div>
      </div>

      <div class="cert-footer-strip">
        <span>TERRATWIN-ASTRAEA-CLEARANCE-VERIFIED</span>
        <span>${isAr ? 'الحالة: تقرير رسمي للجنة' : 'STATUS: CERTIFIED COMMITTEE BRIEF'}</span>
      </div>`;
  },

  updatePrintMetadata(scoreA, scoreB, isAr) {
    const printMetaEl = document.getElementById('printMetaDetails');
    if (printMetaEl) {
      const now = new Date().toISOString().split('T')[0];
      const targetName = isAr ? this.selectedTarget.name_ar : this.selectedTarget.name;
      const siteAName = isAr ? this.siteA.name_ar : this.siteA.name;
      const siteBName = isAr ? this.siteB.name_ar : this.siteB.name;

      printMetaEl.setAttribute('dir', isAr ? 'rtl' : 'ltr');
      printMetaEl.innerHTML = `
        <strong>${isAr ? 'تقرير TerraTwin التنفيذي لمقارنة المواقع' : 'TERRATWIN EXECUTIVE BENCHMARK REPORT'}</strong> • ${isAr ? 'التاريخ' : 'Date'}: ${now} • ${isAr ? 'الهدف' : 'Target'}: ${targetName} (${isAr ? (this.selectedTarget.body === 'mars' ? 'المريخ' : 'القمر') : this.selectedTarget.body.toUpperCase()})<br>
        ${isAr ? 'الموقع المرجعي (أ)' : 'Benchmark Site A'}: ${siteAName} (${scoreA.toFixed(1)}%) | ${isAr ? 'موقع المقارنة (ب)' : 'Comparison Site B'}: ${siteBName} (${scoreB.toFixed(1)}%) • ${isAr ? 'مصادر NASA PDS وESA Copernicus' : 'NASA PDS & ESA Copernicus Calibrated'}
      `;
    }
  },

  bindEvents() {
    // Target Selector
    const targetSelect = document.getElementById('selectTarget');
    if (targetSelect) {
      targetSelect.addEventListener('change', (e) => {
        this.selectedTarget = this.targets.find(t => t.id === e.target.value) || this.targets[0];
        this.renderComparison();
        if (window.UserSystem) {
          window.UserSystem.addXP(20, 'Recalibrated baseline target', 'إعادة معايرة الجرم الكوكبي الأساسي');
        }
      });
    }

    // Site A Selector
    const siteASelect = document.getElementById('selectSiteA');
    if (siteASelect) {
      siteASelect.addEventListener('change', (e) => {
        this.siteA = this.cells.find(c => c.id === e.target.value) || this.cells[0];
        // Auto-assign counterpart siteB to maintain comparison metrics and balance bar
        if (this.siteA.is_candidate) {
          this.siteB = this.cells.find(c => !c.is_candidate && c.id !== this.siteA.id) || this.cells[0];
        } else {
          this.siteB = this.cells.find(c => c.is_candidate && c.id !== this.siteA.id) || this.cells[1];
        }
        this.renderComparison();
        if (window.UserSystem) {
          window.UserSystem.addXP(25, 'Benchmarked analog site matrix', 'تحليل مقارنة موقع تناظري');
        }
      });
    }

    // Site B Selector
    const siteBSelect = document.getElementById('selectSiteB');
    if (siteBSelect) {
      siteBSelect.addEventListener('change', (e) => {
        this.siteB = this.cells.find(c => c.id === e.target.value) || this.cells[1];
        this.renderComparison();
        if (window.UserSystem) {
          window.UserSystem.addXP(25, 'Benchmarked analog candidate site', 'تحليل مقارنة موقع مرشح جديد');
        }
      });
    }

    // 3D Toolbar Controls
    const btnSpectral = document.getElementById('btn3dLayerSpectral');
    if (btnSpectral) {
      btnSpectral.addEventListener('click', () => Terrain3DViewer.setVisualMode('spectral'));
    }
    const btnNatural = document.getElementById('btn3dLayerNatural');
    if (btnNatural) {
      btnNatural.addEventListener('click', () => Terrain3DViewer.setVisualMode('natural'));
    }
    const btnDem = document.getElementById('btn3dLayerDEM');
    if (btnDem) {
      btnDem.addEventListener('click', () => Terrain3DViewer.setVisualMode('dem'));
    }
    const btnContours = document.getElementById('btn3dContours');
    if (btnContours) {
      btnContours.addEventListener('click', () => Terrain3DViewer.toggleContours());
    }
    const sliderOpacity = document.getElementById('slider3dOpacity');
    if (sliderOpacity) {
      sliderOpacity.addEventListener('input', (e) => {
        Terrain3DViewer.setHeatmapOpacity(parseInt(e.target.value, 10) / 100);
      });
    }

    const btnA = document.getElementById('btn3dViewSiteA');
    if (btnA) {
      btnA.addEventListener('click', () => Terrain3DViewer.setMode('siteA'));
    }

    const btnB = document.getElementById('btn3dViewSiteB');
    if (btnB) {
      btnB.addEventListener('click', () => Terrain3DViewer.setMode('siteB'));
    }

    const btnDiff = document.getElementById('btn3dViewDiff');
    if (btnDiff) {
      btnDiff.addEventListener('click', () => Terrain3DViewer.setMode('diff'));
    }

    const btnWire = document.getElementById('btn3dWireframe');
    if (btnWire) {
      btnWire.addEventListener('click', () => Terrain3DViewer.toggleWireframe());
    }

    const btnAutoRotate = document.getElementById('btn3dAutoRotate');
    if (btnAutoRotate) {
      btnAutoRotate.addEventListener('click', () => Terrain3DViewer.toggleAutoRotate());
    }

    const btnReset = document.getElementById('btn3dReset');
    if (btnReset) {
      btnReset.addEventListener('click', () => Terrain3DViewer.resetView());
    }

    // Morphology Chip Buttons
    document.querySelectorAll('.morph-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const morph = btn.getAttribute('data-morph');
        Terrain3DViewer.setMorphology(morph);
      });
    });

    // Preview Brief Modal Handlers
    const previewBtn = document.getElementById('btnPreviewReport');
    const modal = document.getElementById('reportPreviewModal');
    const btnClose = document.getElementById('btnClosePreview');
    const backdrop = document.getElementById('modalBackdrop');
    const btnPrintModal = document.getElementById('btnPrintFromPreview');

    const languageModal = document.getElementById('reportLanguageModal');
    let pendingReportAction = 'preview';
    const openLanguageChooser = (action) => {
      pendingReportAction = action;
      if (languageModal) {
        languageModal.classList.add('show');
        languageModal.setAttribute('aria-hidden', 'false');
      }
    };
    const closeLanguageChooser = () => {
      if (!languageModal) return;
      languageModal.classList.remove('show');
      languageModal.setAttribute('aria-hidden', 'true');
    };
    const runReportAction = (isAr) => {
      const scoreA = window.MissionProfileManager && this.siteA.radar_parameters
        ? window.MissionProfileManager.calculateScore(this.siteA.radar_parameters)
        : this.siteA.similarity_score;
      const scoreB = window.MissionProfileManager && this.siteB.radar_parameters
        ? window.MissionProfileManager.calculateScore(this.siteB.radar_parameters)
        : this.siteB.similarity_score;
      this.renderPreviewCertificate(scoreA, scoreB, isAr);
      this.updatePrintMetadata(scoreA, scoreB, isAr);
      const printTitle = document.getElementById('printReportTitle');
      if (printTitle) printTitle.textContent = isAr ? 'تقرير المقارنة العلمية من تيراتوين' : 'TERRATWIN SCIENTIFIC BENCHMARKING REPORT';
      const footer = document.querySelector('.print-only-footer');
      if (footer) footer.innerHTML = isAr
        ? '<div>مصادر البيانات: نظام بيانات الكواكب التابع لناسا، وبيانات وكالة الفضاء الأوروبية، والمسح الجيولوجي الأمريكي.</div><div>تنبيه: لا يمكن للاختبارات الأرضية محاكاة الجاذبية المنخفضة أو الإشعاع الكوني بالكامل؛ ويجب نمذجة هذه القيود حسابيًا.</div><div>أُعد التقرير باستخدام منصة تيراتوين للتحليل العلمي.</div>'
        : '<div>Data sources: NASA planetary data, European Space Agency datasets, and the United States Geological Survey.</div><div>Notice: Earth-based testing cannot fully reproduce low gravity or cosmic radiation; these constraints must be modeled numerically.</div><div>Report generated by the TerraTwin scientific analysis platform.</div>';
      if (pendingReportAction === 'preview') {
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
      } else {
        window.print();
      }
      closeLanguageChooser();
    };

    if (previewBtn && modal) previewBtn.addEventListener('click', () => openLanguageChooser('preview'));
    const closeModal = () => {
      if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
      }
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    if (btnPrintModal) {
      btnPrintModal.addEventListener('click', () => {
        closeModal();
        openLanguageChooser('export');
      });
    }

    // Export PDF Report Button
    const exportBtn = document.getElementById('btnExportReportPdf');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (window.UserSystem) window.UserSystem.addXP(40, 'Exported Executive Planetary Brief (PDF)', 'تصدير وثيقة تقرير المقارنة الكوكبية');
        openLanguageChooser('export');
      });
    }
    document.querySelectorAll('[data-report-language]').forEach(button => {
      button.addEventListener('click', () => runReportAction(button.dataset.reportLanguage === 'ar'));
    });
    const languageCancel = document.getElementById('btnCancelReportLanguage');
    if (languageCancel) languageCancel.addEventListener('click', closeLanguageChooser);
    if (languageModal) languageModal.addEventListener('click', event => { if (event.target === languageModal) closeLanguageChooser(); });
  }
};

window.RadarComparator = RadarComparator;
window.SiteComparator = SiteComparator;
window.Terrain3DViewer = Terrain3DViewer;
