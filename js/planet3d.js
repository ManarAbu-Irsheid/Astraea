/**
 * TerraTwin - Interactive 3D Planetary Explorer (Earth, Mars, Moon)
 * Built with Three.js (WebGL). Features realistic lighting, textures,
 * clouds, atmospheric Fresnel glow, interactive mouse/touch 360° rotation,
 * zoom, clickable 3D site pins with telemetry popups, and smooth planet switching.
 */

const Planetary3D = {
  currentPlanet: 'earth', // 'earth', 'mars', 'moon'
  planetsList: ['earth', 'mars', 'moon'],
  scene: null,
  camera: null,
  renderer: null,
  container: null,
  planetGroup: null,
  globeMesh: null,
  cloudsMesh: null,
  atmosphereMesh: null,
  markersGroup: null,
  starsGroup: null,

  // Interaction State
  isDragging: false,
  previousMousePosition: { x: 0, y: 0 },
  rotationVelocity: { x: 0.001, y: 0.0005 },
  targetRotation: { x: 0, y: 0 },
  currentRotation: { x: 0, y: 0 },
  autoRotate: true,
  idleTimeout: null,
  raycaster: null,
  mouse: null,
  hoveredMarker: null,

  // Celestial Bodies Metadata & Telemetry
  planetData: {
    earth: {
      id: 'earth',
      name_en: 'Earth (Terra)',
      name_ar: 'كوكب الأرض',
      kicker_en: 'Terrestrial Analog Host',
      kicker_ar: 'المستضيف الأرضي للمواقع الشبيهة',
      color: '#00a3ff',
      slope: '6.8° Mean (Flat <2° to Steep >12°)',
      slope_ar: '6.8° متوسط (منبسط إلى حاد)',
      roughness: '12.4 m (Geomorpho90m Multi-Scale)',
      roughness_ar: '12.4 متر (قاعدة Geomorpho90m)',
      albedo: '0.26 (NASA MODIS MCD43A3)',
      albedo_ar: '0.26 (مقياس MODIS اليومي)',
      temp_swing: 'Δ44.5°C (NASA MODIS LST)',
      temp_swing_ar: 'Δ44.5° مئوية (حرارة السطح MODIS LST)',
      ndvi_gate: 'Passed (NDVI ≤ 0.20 Abiotic Gate)',
      ndvi_gate_ar: 'مجتاز (NDVI ≤ 0.20 بيئة غير حيوية)',
      catalog_sites: '53 Sites (47 Analogs + 6 Controls)',
      catalog_sites_ar: '53 موقعاً (47 شبيهاً + 6 ضبط)',
      sites: [
        { id: 'site-devon-haughton', name: 'Devon Island / Haughton Crater', name_ar: 'جزيرة ديفون / فوهة هوتون', lat: 75.42, lon: -89.85, target: 'Polar Cryo-Permafrost | Match: Shackleton 76.0% / Jezero 53.8%', target_ar: 'تربة جليدية قطبية | مطابق لشاكلتون 76.0% / جيزيرو 53.8%' },
        { id: 'site-atacama-yungay', name: 'Atacama Desert (Yungay)', name_ar: 'صحراء أتاكاما (يونغاي)', lat: -24.09, lon: -69.98, target: 'Hyper-Arid Basin | Match: Jezero 79.1% / Meridiani 75.8%', target_ar: 'حوض شديد الجفاف | مطابق لجيزيرو 79.1% / ميريدياني 75.8%' },
        { id: 'site-mdrs-utah', name: 'Mars Desert Research Station (MDRS)', name_ar: 'محطة أبحاث صحراء المريخ (MDRS)', lat: 38.40, lon: -110.79, target: 'Hyper-Arid Basin | Match: Meridiani 89.3% / Jezero 72.6%', target_ar: 'حوض صلصالي جاف | مطابق لميريدياني 89.3% / جيزيرو 72.6%' },
        { id: 'site-hiseas-hawaii', name: 'HI-SEAS Mauna Loa', name_ar: 'محطة هاي سيز، ماونا لوا', lat: 19.47, lon: -155.59, target: 'Volcanic Basalt | Match: Mare Tranquillitatis 82.5% / Jezero 74.5%', target_ar: 'حقول لابة بركانية | مطابق لبحر السكون 82.5% / جيزيرو 74.5%' },
        { id: 'site-mafraq-jordan', name: 'Mafraq Basalt Plain', name_ar: 'سهل المفرق البازلتي، الأردن', lat: 32.00, lon: 37.50, target: 'Candidate Basalt Plain | Match: Jezero 95.8% / Mare Tranquillitatis 81.3%', target_ar: 'مرشح بازلتي منبسط | مطابق لجيزيرو 95.8% / بحر السكون 81.3%' },
        { id: 'site-wadirum-jordan', name: 'Wadi Rum', name_ar: 'وادي رم، الأردن', lat: 29.56, lon: 35.41, target: 'Candidate Desert | Match: Mons Mouton 82.5% / Copernicus 82.4%', target_ar: 'مرشح صحراوي تضاريسي | مطابق لمونس موتون 82.5% / كوبرنيكوس 82.4%' },
        { id: 'site-riotinto-spain', name: 'Rio Tinto', name_ar: 'ريو تينتو، إسبانيا', lat: 37.70, lon: -6.60, target: 'Acidic Iron River | Match: Valles Marineris 85.0%', target_ar: 'نهر كبريتي حمضي | مطابق لأخاديد مارينيريس 85.0%' },
        { id: 'site-dhofar-oman', name: 'Dhofar AMADEE Site', name_ar: 'موقع ظفار (أمادي)، عمان', lat: 17.00, lon: 54.00, target: 'Hyper-Arid Basin | Match: Rima Ariadaeus 89.5% / Jezero 70.5%', target_ar: 'حوض صحراوي جاف | مطابق لأخدود أرياديوس 89.5% / جيزيرو 70.5%' }
      ]
    },
    mars: {
      id: 'mars',
      name_en: 'Mars (Ares)',
      name_ar: 'كوكب المريخ',
      kicker_en: 'Target Exploration Body',
      kicker_ar: 'الجرم الاستكشافي المستهدف',
      color: '#e05638',
      slope: '3.4° Mean (MGS MOLA MEGDR 463m)',
      slope_ar: '3.4° متوسط (رادار MOLA MEGDR)',
      roughness: '58.2 m (HRSC-MOLA Blend 200m)',
      roughness_ar: '58.2 متر (رادار HRSC-MOLA)',
      albedo: '0.19 (MRO TES Global Albedo)',
      albedo_ar: '0.19 (مستشعر MRO TES المريخي)',
      temp_swing: 'Δ78.4°C (Mars Climate Database v6.1)',
      temp_swing_ar: 'Δ78.4° مئوية (قاعدة مناخ المريخ MCD)',
      ndvi_gate: '0.000 (Pure Abiotic Regolith)',
      ndvi_gate_ar: '0.000 (تربة ريغوليث غير حيوية كلياً)',
      catalog_sites: '31 Target Sites (Jezero, Gale...)',
      catalog_sites_ar: '31 هدفاً مريخياً (جيزيرو، غيل...)',
      sites: [
        { id: 'target-mars-jezero', name: 'Jezero Crater Delta', name_ar: 'دلتا فوهة جيزيرو', lat: 18.41, lon: 77.69, target: 'Perseverance Landing Delta | Best Analog: Mafraq 95.8%, Atacama 79.1%', target_ar: 'دلتا هبوط بيرسيفيرنس | أفضل شبيه: المفرق 95.8%، أتاكاما 79.1%' },
        { id: 'target-mars-gale', name: 'Gale Crater (Mount Sharp)', name_ar: 'فوهة غيل (جبل شارب)', lat: -5.37, lon: 137.81, target: 'Curiosity Landing Basin | Best Analog: Atacama 77.6%, Rio Tinto 68.8%', target_ar: 'حوض هبوط كوريوسيتي | أفضل شبيه: أتاكاما 77.6%، ريو تينتو 68.8%' },
        { id: 'target-mars-elysium', name: 'Elysium Planitia', name_ar: 'سهل إليسيوم بلانيتيا', lat: 2.98, lon: 154.74, target: 'InSight Basalt Landing Plain | Best Analog: Dhofar 72.4%, Gobi 69.1%', target_ar: 'سهل هبوط إنسايت البازلتي | أفضل شبيه: ظفار 72.4%، جوبي 69.1%' },
        { id: 'target-mars-olympus', name: 'Olympus Mons', name_ar: 'بركان أوليمبوس مونس', lat: 18.65, lon: -133.80, target: 'Largest Volcanic Shield | Best Analog: Devon Island 83.1%, Iceland 71.3%', target_ar: 'أضخم بركان درعي بالمجموعة الشمسية | أفضل شبيه: ديفون 83.1%، آيسلندا 71.3%' },
        { id: 'target-mars-valles', name: 'Valles Marineris', name_ar: 'أخاديد فالس مارينيريس', lat: -14.01, lon: -58.59, target: 'Grand Canyon of Mars | Best Analog: Rio Tinto 85.0%, Wadi Rum 83.4%', target_ar: 'الأخدود الأعظم للمريخ | أفضل شبيه: ريو تينتو 85.0%، وادي رم 83.4%' },
        { id: 'target-mars-meridiani', name: 'Meridiani Planum', name_ar: 'سهل ميريدياني بلانوم', lat: -0.04, lon: -3.14, target: 'Opportunity Hematite Plain | Best Analog: MDRS Utah 89.3%, Atacama 75.8%', target_ar: 'سهل الهيماتيت (أبورتيونيتي) | أفضل شبيه: يوتا 89.3%، أتاكاما 75.8%' }
      ]
    },
    moon: {
      id: 'moon',
      name_en: 'The Moon (Luna)',
      name_ar: 'القمر',
      kicker_en: 'Target Exploration Body',
      kicker_ar: 'الجرم الاستكشافي المستهدف',
      color: '#cbd5e1',
      slope: '3.7° Mean (LRO LOLA Altimetry)',
      slope_ar: '3.7° متوسط (مقياس ليزر LRO LOLA)',
      roughness: '1.2 m (LRO LOLA LDRM Residual)',
      roughness_ar: '1.2 متر (انحراف نبضات LRO LOLA)',
      albedo: '0.24 (LOLA Normal Albedo 1064nm)',
      albedo_ar: '0.24 (انعكاس الليزر 1064nm)',
      temp_swing: 'Δ268.0°C (LRO Diviner GCP Extreme)',
      temp_swing_ar: 'Δ268.0° مئوية (مقياس Diviner القمري)',
      ndvi_gate: '0.000 (Physical Vacuum / Abiotic)',
      ndvi_gate_ar: '0.000 (فراغ فيزيائي غير حيوي)',
      catalog_sites: '30 Lunar Targets (Artemis, Maria...)',
      catalog_sites_ar: '30 هدفاً قمرياً (أرتميس، بحار القمر...)',
      sites: [
        { id: 'target-moon-shackleton', name: 'Shackleton Crater Rim', name_ar: 'حافة فوهة شاكلتون (القطب الجنوبي)', lat: -89.67, lon: 129.78, target: 'Artemis Polar Base Candidate | Best Analog: Norway 84.6%, Devon 76.0%', target_ar: 'مرشح قاعدة أرتميس القطبية | أفضل شبيه: النرويج 84.6%، ديفون 76.0%' },
        { id: 'target-moon-mouton', name: 'Mons Mouton', name_ar: 'مونس موتون (الكتلة القطبية)', lat: -84.60, lon: 31.00, target: 'Artemis III Landing Target | Best Analog: Al Wahat 85.7%, Maan 85.5%', target_ar: 'هدف هبوط أرتميس 3 | أفضل شبيه: الواحات 85.7%، معان 85.5%' },
        { id: 'target-moon-tranquillitatis', name: 'Mare Tranquillitatis', name_ar: 'بحر السكون (أبولو 11)', lat: 8.35, lon: 30.83, target: 'Apollo 11 Basaltic Mare | Best Analog: Chubut 91.0%, HI-SEAS 82.5%, Mafraq 81.3%', target_ar: 'سهل هبوط أبولو 11 البازلتي | أفضل شبيه: تشوبوت 91.0%، هاي سيز 82.5%، المفرق 81.3%' },
        { id: 'target-moon-copernicus', name: 'Copernicus Crater', name_ar: 'فوهة كوبرنيكوس المركزية', lat: 9.62, lon: -20.08, target: 'Central Peak Complex | Best Analog: Wadi Rum 82.4%, Hardap 80.0%', target_ar: 'مجمع القمة المركزية | أفضل شبيه: وادي رم 82.4%، هاراداب 80.0%' },
        { id: 'target-moon-aristarchus', name: 'Aristarchus Plateau', name_ar: 'هضبة أريستارخوس البركانية', lat: 23.73, lon: -47.49, target: 'High-Albedo Volcanic Complex | Best Analog: Iceland 69.6%, Devon 67.2%', target_ar: 'مجمع بركاني عالي البياض | أفضل شبيه: آيسلندا 69.6%، ديفون 67.2%' },
        { id: 'target-moon-ariadaeus', name: 'Rima Ariadaeus', name_ar: 'أخدود ريما أرياديوس', lat: 6.48, lon: 13.44, target: 'Linear Lunar Rille | Best Analog: Australia 94.0%, Dhofar 89.5%', target_ar: 'أخدود قمري انكساري خطي | أفضل شبيه: أستراليا 94.0%، ظفار 89.5%' }
      ]
    }
  },

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    if (typeof THREE === 'undefined') {
      console.warn('Three.js library not loaded yet, waiting...');
      return;
    }

    this.setupScene();
    this.setupLights();
    this.createStarfield();
    this.loadPlanet(this.currentPlanet);
    this.setupInteraction();
    this.animate();

    this.renderTelemetryHUD();
    this.bindDOMControls();

    window.addEventListener('resize', () => this.onWindowResize());
    document.addEventListener('languageChanged', () => this.renderTelemetryHUD());
  },

  setupScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 2.8;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    this.planetGroup = new THREE.Group();
    this.scene.add(this.planetGroup);

    this.markersGroup = new THREE.Group();
    this.planetGroup.add(this.markersGroup);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  },

  setupLights() {
    // Key Sun Directional Light (Crisp, high-intensity sunlight in vacuum)
    const sunLight = new THREE.DirectionalLight(0xfffaee, 1.75);
    sunLight.position.set(6, 2.5, 4.5);
    this.scene.add(sunLight);

    // Subtle Ambient Starlight (Preserves deep shadow on night side)
    const ambientLight = new THREE.AmbientLight(0x0a1424, 0.24);
    this.scene.add(ambientLight);

    // Cinematic Cool Backlight / Rim Glow
    const rimLight = new THREE.DirectionalLight(0x00c8ff, 0.45);
    rimLight.position.set(-6, -1.8, -4);
    this.scene.add(rimLight);
  },

  createStarfield() {
    const starCount = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      // Distribute stars on a large sphere
      const r = 25 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      colors[i] = brightness;
      colors[i + 1] = brightness * 0.95;
      colors[i + 2] = brightness * 1.1; // slightly blue-ish stars
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.75
    });

    this.starsGroup = new THREE.Points(geometry, material);
    this.scene.add(this.starsGroup);
  },

  /* ==========================================================================
     PROCEDURAL ULTRA-REALISTIC TEXTURE GENERATORS
     ========================================================================== */
  generatePlanetTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    if (type === 'earth') {
      // 1. Deep Ocean Base
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      oceanGrad.addColorStop(0, '#0c2340');
      oceanGrad.addColorStop(0.5, '#04162e');
      oceanGrad.addColorStop(1, '#08213e');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, 2048, 1024);

      // Continent Landmasses (Detailed Organic Shapes)
      ctx.fillStyle = '#1c3d26'; // Forest/biome green
      this.drawContinentBlobs(ctx, [
        { x: 500, y: 350, rx: 260, ry: 190, color: '#2a5438' }, // North America
        { x: 700, y: 680, rx: 170, ry: 240, color: '#385e34' }, // South America
        { x: 1050, y: 300, rx: 180, ry: 120, color: '#335832' }, // Europe
        { x: 1080, y: 550, rx: 210, ry: 220, color: '#91794b' }, // Africa / Sahara desert
        { x: 1450, y: 350, rx: 340, ry: 200, color: '#2d5236' }, // Asia
        { x: 1680, y: 700, rx: 150, ry: 120, color: '#87693d' }, // Australia
        { x: 1024, y: 980, rx: 900, ry: 80, color: '#eef6fc' },  // Antarctica
        { x: 600, y: 100, rx: 180, ry: 70, color: '#e2f0fa' }   // Greenland
      ]);

      // Deserts & Arid Mountain Belts (Atacama, Sahara, Gobi)
      ctx.fillStyle = '#a68a56';
      ctx.beginPath();
      ctx.ellipse(1080, 480, 160, 60, 0, 0, Math.PI * 2); // Sahara
      ctx.ellipse(650, 720, 40, 90, 0.1, 0, Math.PI * 2);  // Atacama / Andes
      ctx.ellipse(1400, 340, 120, 50, 0, 0, Math.PI * 2); // Gobi
      ctx.fill();

    } else if (type === 'mars') {
      // Mars Rust-Red & Ochre Topography
      const marsGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      marsGrad.addColorStop(0, '#662211');
      marsGrad.addColorStop(0.5, '#993318');
      marsGrad.addColorStop(1, '#551d10');
      ctx.fillStyle = marsGrad;
      ctx.fillRect(0, 0, 2048, 1024);

      // Dark Basaltic Plains (Syrtis Major, Acidalia Planitia)
      ctx.fillStyle = '#4a1e12';
      this.drawContinentBlobs(ctx, [
        { x: 1400, y: 500, rx: 200, ry: 140, color: '#3d160c' }, // Syrtis Major
        { x: 800, y: 360, rx: 240, ry: 130, color: '#3a170f' },  // Acidalia
        { x: 500, y: 600, rx: 320, ry: 80, color: '#2f120a' }   // Valles Marineris rift
      ]);

      // Olympus Mons Giant Volcano Edifice
      ctx.fillStyle = '#b34728';
      ctx.beginPath();
      ctx.arc(420, 420, 65, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2d1109';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Polar Ice Caps (CO₂ & Water Ice)
      ctx.fillStyle = '#f8f4f0';
      ctx.beginPath();
      ctx.ellipse(1024, 40, 280, 35, 0, 0, Math.PI * 2); // North Pole
      ctx.ellipse(1024, 990, 200, 28, 0, 0, Math.PI * 2); // South Pole
      ctx.fill();

    } else if (type === 'moon') {
      // Moon Anorthositic Grey Highlands Base
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(0, 0, 2048, 1024);

      // High Contrast Basaltic Lunar Maria (Dark plains)
      ctx.fillStyle = '#2d333b';
      this.drawContinentBlobs(ctx, [
        { x: 900, y: 400, rx: 210, ry: 160, color: '#252a32' },  // Mare Imbrium
        { x: 1200, y: 480, rx: 220, ry: 180, color: '#282d35' }, // Mare Tranquillitatis
        { x: 650, y: 460, rx: 260, ry: 200, color: '#22272e' },  // Oceanus Procellarum
        { x: 1350, y: 400, rx: 120, ry: 110, color: '#292f37' }  // Mare Serenitatis
      ]);

      // Rayed Impact Craters (Tycho, Copernicus)
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(880, 780, 24, 0, Math.PI * 2); // Tycho
      ctx.arc(720, 420, 18, 0, Math.PI * 2); // Copernicus
      ctx.fill();

      // Tycho Rays
      ctx.strokeStyle = 'rgba(240, 246, 255, 0.4)';
      ctx.lineWidth = 2;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        ctx.beginPath();
        ctx.moveTo(880, 780);
        ctx.lineTo(880 + Math.cos(a) * 320, 780 + Math.sin(a) * 320);
        ctx.stroke();
      }
    }

    return new THREE.CanvasTexture(canvas);
  },

  drawContinentBlobs(ctx, blobs) {
    blobs.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const wobble = 0.8 + Math.random() * 0.4;
        const x = b.x + Math.cos(angle) * (b.rx * wobble);
        const y = b.y + Math.sin(angle) * (b.ry * wobble);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    });
  },

  generateCloudsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 2048, 1024);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';

    // Dynamic Swirling Weather Bands & Cyclones
    for (let i = 0; i < 60; i++) {
      const cx = Math.random() * 2048;
      const cy = 150 + Math.random() * 724;
      const rx = 80 + Math.random() * 220;
      const ry = 25 + Math.random() * 65;

      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, Math.random() * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  },

  /* ==========================================================================
     TEXTURE LOADER & CACHING FOR NASA PHOTOREALISTIC MAPS
     ========================================================================== */
  textureLoader: null,
  textureCache: {},

  getTextureLoader() {
    if (!this.textureLoader && typeof THREE !== 'undefined') {
      this.textureLoader = new THREE.TextureLoader();
    }
    return this.textureLoader;
  },

  loadTextureSafe(localPath, fallbackGenerator) {
    const loader = this.getTextureLoader();
    if (this.textureCache[localPath]) {
      return this.textureCache[localPath];
    }
    if (!loader) {
      return fallbackGenerator ? fallbackGenerator.call(this) : null;
    }

    try {
      const tex = loader.load(
        localPath,
        (loaded) => {
          loaded.needsUpdate = true;
          if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
          }
        },
        undefined,
        (err) => {
          console.warn('Fallback to procedural texture for:', localPath);
        }
      );
      this.textureCache[localPath] = tex;
      return tex;
    } catch (e) {
      return fallbackGenerator ? fallbackGenerator.call(this) : null;
    }
  },

  /* ==========================================================================
     LOAD & SWITCH PLANET
     ========================================================================== */
  loadPlanet(planetKey) {
    this.currentPlanet = planetKey;

    // Clear existing meshes
    if (this.globeMesh) this.planetGroup.remove(this.globeMesh);
    if (this.cloudsMesh) this.planetGroup.remove(this.cloudsMesh);
    if (this.atmosphereMesh) this.planetGroup.remove(this.atmosphereMesh);
    this.clearMarkers();

    const radius = 1.0;
    const segments = 64;

    // 1. Globe Core Sphere
    const geometry = new THREE.SphereGeometry(radius, segments, segments);

    let material;
    if (planetKey === 'earth') {
      // Authentic axial tilt: 23.4°
      this.planetGroup.rotation.z = 23.44 * (Math.PI / 180);

      const earthMap = this.loadTextureSafe('assets/textures/earth_atmos_2048.jpg', () => this.generatePlanetTexture('earth'));
      const earthNormal = this.loadTextureSafe('assets/textures/earth_normal_2048.jpg');
      const earthSpecular = this.loadTextureSafe('assets/textures/earth_specular_2048.jpg');

      material = new THREE.MeshPhongMaterial({
        map: earthMap,
        normalMap: earthNormal,
        normalScale: new THREE.Vector2(0.85, 0.85),
        specularMap: earthSpecular,
        specular: new THREE.Color(0x285078),
        shininess: 25
      });
    } else if (planetKey === 'mars') {
      // Authentic axial tilt: 25.2°
      this.planetGroup.rotation.z = 25.19 * (Math.PI / 180);

      const marsMap = this.loadTextureSafe('assets/textures/mars_2k.jpg', () => this.generatePlanetTexture('mars'));

      material = new THREE.MeshStandardMaterial({
        map: marsMap,
        bumpMap: marsMap,
        bumpScale: 0.045,
        roughness: 0.88,
        metalness: 0.04
      });
    } else {
      // Moon - Authentic axial tilt: 1.5°
      this.planetGroup.rotation.z = 1.54 * (Math.PI / 180);

      const moonMap = this.loadTextureSafe('assets/textures/moon_1024.jpg', () => this.generatePlanetTexture('moon'));

      material = new THREE.MeshStandardMaterial({
        map: moonMap,
        bumpMap: moonMap,
        bumpScale: 0.038,
        roughness: 0.96,
        metalness: 0.02
      });
    }

    this.globeMesh = new THREE.Mesh(geometry, material);
    this.planetGroup.add(this.globeMesh);

    // 2. Earth Clouds Layer
    if (planetKey === 'earth') {
      const cloudGeom = new THREE.SphereGeometry(radius * 1.018, segments, segments);
      const cloudMap = this.loadTextureSafe('assets/textures/earth_clouds_1024.png', () => this.generateCloudsTexture());
      const cloudMat = new THREE.MeshPhongMaterial({
        map: cloudMap,
        transparent: true,
        opacity: 0.85,
        blending: THREE.NormalBlending,
        depthWrite: false
      });
      this.cloudsMesh = new THREE.Mesh(cloudGeom, cloudMat);
      this.planetGroup.add(this.cloudsMesh);

      // 3. Earth Glowing Atmospheric Halo
      const atmoGeom = new THREE.SphereGeometry(radius * 1.05, segments, segments);
      const atmoMat = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.68 - dot(vNormal, vec3(0, 0, 1.0)), 2.4);
            gl_FragColor = vec4(0.1, 0.7, 1.0, 1.0) * intensity;
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
      });
      this.atmosphereMesh = new THREE.Mesh(atmoGeom, atmoMat);
      this.planetGroup.add(this.atmosphereMesh);

    } else if (planetKey === 'mars') {
      // Mars Thin Amber Atmospheric Halo
      const atmoGeom = new THREE.SphereGeometry(radius * 1.035, segments, segments);
      const atmoMat = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.6);
            gl_FragColor = vec4(1.0, 0.45, 0.2, 1.0) * intensity;
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
      });
      this.atmosphereMesh = new THREE.Mesh(atmoGeom, atmoMat);
      this.planetGroup.add(this.atmosphereMesh);
    }

    // Spawn 3D Analog Site Pins
    this.createSiteMarkers(planetKey);

    // Update Telemetry HUD Card
    this.renderTelemetryHUD();
    this.updateActiveTabs();
  },

  /* ==========================================================================
     INTERACTIVE 3D SITE PINS (Markers on Sphere Surface)
     ========================================================================== */
  latLonToVector3(lat, lon, radius = 1.02) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  },

  createSiteMarkers(planetKey) {
    const data = this.planetData[planetKey];
    if (!data || !data.sites) return;

    data.sites.forEach(site => {
      const pos = this.latLonToVector3(site.lat, site.lon, 1.02);

      // Pin Mesh: glowing sphere node
      const pinGeom = new THREE.SphereGeometry(0.024, 16, 16);
      const pinColor = planetKey === 'earth' ? 0x00a3ff : (planetKey === 'mars' ? 0xe05638 : 0xe2e8f0);
      const pinMat = new THREE.MeshBasicMaterial({ color: pinColor });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.copy(pos);
      pinMesh.userData = site;

      // Outer Pulsating Target Ring
      const ringGeom = new THREE.RingGeometry(0.035, 0.048, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      ringMesh.userData = site;

      this.markersGroup.add(pinMesh);
      this.markersGroup.add(ringMesh);
    });
  },

  clearMarkers() {
    while (this.markersGroup.children.length > 0) {
      const obj = this.markersGroup.children[0];
      this.markersGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
  },

  /* ==========================================================================
     SMOOTH MOUSE & TOUCH ROTATION INTERACTION
     ========================================================================== */
  setupInteraction() {
    const dom = this.renderer.domElement;

    // Mouse Controls
    dom.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.resetIdleTimer();
    });

    dom.addEventListener('mousemove', (e) => {
      this.onPointerMove(e);

      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.rotationVelocity.y = deltaX * 0.005;
      this.rotationVelocity.x = deltaY * 0.005;

      this.planetGroup.rotation.y += this.rotationVelocity.y;
      this.planetGroup.rotation.x += this.rotationVelocity.x;

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Touch Controls
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.autoRotate = false;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    dom.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
      const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

      this.planetGroup.rotation.y += deltaX * 0.005;
      this.planetGroup.rotation.x += deltaY * 0.005;

      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    dom.addEventListener('touchend', () => {
      this.isDragging = false;
      this.resetIdleTimer();
    });

    // Zoom on Wheel
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camera.position.z += e.deltaY * 0.0015;
      this.camera.position.z = Math.min(Math.max(this.camera.position.z, 1.8), 4.5);
    }, { passive: false });

    // Click Detection for Site Pins
    dom.addEventListener('click', (e) => {
      this.onPointerClick(e);
    });
  },

  onPointerMove(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.markersGroup.children);

    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer';
      const site = intersects[0].object.userData;
      this.showPinTooltip(e.clientX, e.clientY, site);
    } else {
      document.body.style.cursor = 'default';
      this.hidePinTooltip();
    }
  },

  onPointerClick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.markersGroup.children);

    if (intersects.length > 0) {
      const site = intersects[0].object.userData;
      this.selectPinSite(site);
    }
  },

  selectPinSite(site) {
    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';
    const title = isAr ? site.name_ar : site.name;
    const target = isAr ? site.target_ar : site.target;

    // Award Gamification XP for exploring 3D Planet site
    if (window.UserSystem) {
      window.UserSystem.discoverSite(site.id || site.name, title);
    }

    const popup = document.getElementById('planetSiteSelectedPopup');
    if (popup) {
      popup.innerHTML = `
        <div class="planet-site-popup-inner">
          <div class="popup-top">
            <span class="sci-badge validated">3D TELEMETRY LOCK</span>
            <button class="popup-close" onclick="document.getElementById('planetSiteSelectedPopup').style.display='none'">✕</button>
          </div>
          <div class="popup-site-name">${title}</div>
          <div class="popup-site-coords">LAT: ${site.lat.toFixed(2)}° • LON: ${site.lon.toFixed(2)}°</div>
          <div class="popup-site-desc">${target}</div>
          <div class="popup-actions">
            <a href="finder.html" class="btn-popup-action primary">${isAr ? 'عرض في مستكشف المواقع' : 'View in Site Finder'}</a>
            <a href="compare.html?siteA=${site.id}" class="btn-popup-action">${isAr ? 'مقارنة الموقع' : 'Compare Site'}</a>
          </div>
        </div>
      `;
      popup.style.display = 'block';
    }
  },

  showPinTooltip(x, y, site) {
    let tip = document.getElementById('planetPinTooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'planetPinTooltip';
      tip.className = 'planet-pin-tooltip';
      document.body.appendChild(tip);
    }

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';
    tip.innerHTML = `
      <div class="tip-title">${isAr ? site.name_ar : site.name}</div>
      <div class="tip-sub">${isAr ? site.target_ar : site.target}</div>
    `;

    tip.style.top = `${y - 48}px`;
    tip.style.left = `${x + 16}px`;
    tip.style.display = 'block';
  },

  hidePinTooltip() {
    const tip = document.getElementById('planetPinTooltip');
    if (tip) tip.style.display = 'none';
  },

  resetIdleTimer() {
    clearTimeout(this.idleTimeout);
    this.idleTimeout = setTimeout(() => {
      this.autoRotate = true;
    }, 2800);
  },

  /* ==========================================================================
     ANIMATION LOOP
     ========================================================================== */
  animate() {
    requestAnimationFrame(() => this.animate());

    // Continuous auto-rotation when not dragging
    if (this.autoRotate) {
      this.planetGroup.rotation.y += 0.0018;
    } else {
      // Gentle damping inertia
      this.planetGroup.rotation.y += this.rotationVelocity.y;
      this.planetGroup.rotation.x += this.rotationVelocity.x;
      this.rotationVelocity.x *= 0.94;
      this.rotationVelocity.y *= 0.94;
    }

    // Clouds spin slightly faster for atmospheric dynamism
    if (this.cloudsMesh) {
      this.cloudsMesh.rotation.y += 0.0006;
    }

    // Pulse target rings
    const time = performance.now() * 0.003;
    this.markersGroup.children.forEach(child => {
      if (child.geometry && child.geometry.type === 'RingGeometry') {
        const s = 1 + Math.sin(time) * 0.15;
        child.scale.set(s, s, s);
      }
    });

    this.renderer.render(this.scene, this.camera);
  },

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  },

  /* ==========================================================================
     TELEMETRY HUD & CONTROLS
     ========================================================================== */
  renderTelemetryHUD() {
    const data = this.planetData[this.currentPlanet];
    if (!data) return;

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    const kickerEl = document.getElementById('hudPlanetKicker');
    const nameEl = document.getElementById('hudPlanetName');
    const kickerDot = document.querySelector('.planet-station-kicker-dot');

    if (kickerEl) kickerEl.textContent = isAr ? data.kicker_ar : data.kicker_en;
    if (nameEl) {
      nameEl.textContent = isAr ? data.name_ar : data.name_en;
      nameEl.style.color = data.color || '#fff';
    }
    if (kickerDot) {
      kickerDot.style.background = data.color || '#00a3ff';
      kickerDot.style.boxShadow = '0 0 10px ' + (data.color || '#00a3ff');
    }

    // Real Scientific Metrics from User Dataset
    const slopeEl = document.getElementById('hudSlope') || document.getElementById('hudDiameter');
    const roughnessEl = document.getElementById('hudRoughness') || document.getElementById('hudGravity');
    const albedoEl = document.getElementById('hudAlbedo') || document.getElementById('hudAtmosphere');
    const tempSwingEl = document.getElementById('hudTempSwing') || document.getElementById('hudTemp');
    const ndviGateEl = document.getElementById('hudNdviGate') || document.getElementById('hudRotationPeriod');
    const catalogEl = document.getElementById('hudCatalogedSites') || document.getElementById('hudAnalogsCount');

    if (slopeEl) slopeEl.textContent = isAr ? data.slope_ar : data.slope;
    if (roughnessEl) roughnessEl.textContent = isAr ? data.roughness_ar : data.roughness;
    if (albedoEl) albedoEl.textContent = isAr ? data.albedo_ar : data.albedo;
    if (tempSwingEl) tempSwingEl.textContent = isAr ? data.temp_swing_ar : data.temp_swing;
    if (ndviGateEl) ndviGateEl.textContent = isAr ? data.ndvi_gate_ar : data.ndvi_gate;
    if (catalogEl) catalogEl.textContent = isAr ? data.catalog_sites_ar : data.catalog_sites;
  },

  updateActiveTabs() {
    document.querySelectorAll('.planet-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-planet') === this.currentPlanet);
    });
  },

  cyclePlanet(direction) {
    const currentIndex = this.planetsList.indexOf(this.currentPlanet);
    const nextIndex = (currentIndex + direction + this.planetsList.length) % this.planetsList.length;
    this.switchPlanet(this.planetsList[nextIndex]);
  },

  switchPlanet(planetKey) {
    if (planetKey === this.currentPlanet) return;
    this.loadPlanet(planetKey);
  },

  bindDOMControls() {
    // Side Navigation Arrows [ ❮ | ❯ ]
    const prevBtn = document.getElementById('planetNavPrev');
    const nextBtn = document.getElementById('planetNavNext');

    if (prevBtn) prevBtn.addEventListener('click', () => this.cyclePlanet(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.cyclePlanet(1));

    // Planet Switcher Tabs
    document.querySelectorAll('.planet-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const p = e.currentTarget.getAttribute('data-planet');
        this.switchPlanet(p);
      });
    });
  }
};

window.Planetary3D = Planetary3D;
