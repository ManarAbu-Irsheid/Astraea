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
      diameter: '12,742 km',
      gravity: '9.807 m/s² (1.0G)',
      atmosphere: '1,013 mbar (N₂ / O₂)',
      temp_range: '-89°C to +58°C',
      rotation_period: '24h 00m',
      analogs_count: '421,800 Cells (12 Primary Benchmarks)',
      analogs_count_ar: '421,800 خلية (12 موقعاً رئيسياً)',
      sites: [
        { id: 'cell-atacama-yungay', name: 'Yungay, Atacama', name_ar: 'يونغاي، أتاكاما', lat: -24.08, lon: -69.87, target: 'Mars Jezero Match: 89.2%', target_ar: 'مطابق لجيزيرو المريخ: 89.2%' },
        { id: 'cell-antarctica-mcmurdo', name: 'McMurdo Dry Valleys', name_ar: 'وديان ماكموردو، أنتاركتيكا', lat: -77.85, lon: 160.72, target: 'Moon Shackleton Match: 91.8%', target_ar: 'مطابق لشاكلتون القمر: 91.8%' },
        { id: 'cell-lanzarote-corona', name: 'Corona Lava Tubes, Lanzarote', name_ar: 'أنابيب كورونا، لانزاروتي', lat: 29.18, lon: -13.48, target: 'Moon Marius Tube: 86.5%', target_ar: 'مطابق لأنبوب ماريوس: 86.5%' },
        { id: 'cell-saudi-labbah', name: 'Al-Labbah Lava Field', name_ar: 'لابة اللبة، حرة خيبر', lat: 25.68, lon: 39.92, target: 'New Candidate (Moon): 87.8%', target_ar: 'مرشح قمري جديد: 87.8%' },
        { id: 'cell-ethiopia-danakil', name: 'Dallol, Danakil', name_ar: 'دالول، الدناكل', lat: 14.24, lon: 40.30, target: 'Mars Acid-Sulfate: 88.4%', target_ar: 'مطابق لأحماض المريخ: 88.4%' },
        { id: 'cell-china-qaidam', name: 'Qaidam Yardangs', name_ar: 'ياردانغ قايدام', lat: 37.85, lon: 93.65, target: 'Mars Gale Mudstone: 85.7%', target_ar: 'مطابق لطين غيل: 85.7%' }
      ]
    },
    mars: {
      id: 'mars',
      name_en: 'Mars (Ares)',
      name_ar: 'كوكب المريخ',
      kicker_en: 'Target Exploration Body',
      kicker_ar: 'الجرم الاستكشافي المستهدف',
      diameter: '6,779 km (0.53 Earth)',
      gravity: '3.721 m/s² (0.38G)',
      atmosphere: '6.1 mbar (95.3% CO₂)',
      temp_range: '-140°C to +20°C',
      rotation_period: '24h 37m (1 Sol)',
      analogs_count: '4 Active Target Quadrangles',
      analogs_count_ar: '4 قطاعات استكشافية مستهدفة',
      sites: [
        { id: 'target-mars-jezero', name: 'Jezero Crater Delta', name_ar: 'دلتا فوهة جيزيرو', lat: 18.38, lon: 77.58, target: 'Atacama Analog: 89.2%', target_ar: 'الشبيه الأرضي: أتاكاما (89.2%)' },
        { id: 'target-mars-olympus', name: 'Olympus Mons Aureole', name_ar: 'بركان أوليمبوس مونس', lat: 18.65, lon: 226.2, target: 'Mauna Kea Analog: 86.9%', target_ar: 'الشبيه الأرضي: مونا كيا (86.9%)' },
        { id: 'target-mars-gale', name: 'Gale Crater (Mount Sharp)', name_ar: 'فوهة غيل (جبل شارب)', lat: -5.4, lon: 137.8, target: 'Qaidam Basin Match: 85.7%', target_ar: 'الشبيه الأرضي: حوض قايدام (85.7%)' },
        { id: 'target-mars-mawrth', name: 'Mawrth Vallis Clays', name_ar: 'وادي ماورث الطيني', lat: 23.99, lon: -18.96, target: 'Danakil Geochemical: 88.4%', target_ar: 'الشبيه الأرضي: منخفض الدناكل (88.4%)' }
      ]
    },
    moon: {
      id: 'moon',
      name_en: 'The Moon (Luna)',
      name_ar: 'القمر',
      kicker_en: 'Target Exploration Body',
      kicker_ar: 'الجرم الاستكشافي المستهدف',
      diameter: '3,474 km (0.27 Earth)',
      gravity: '1.622 m/s² (0.166G)',
      atmosphere: '<10⁻¹² bar (Hard Vacuum)',
      temp_range: '-246°C (PSR) to +121°C',
      rotation_period: '27.3 Earth Days',
      analogs_count: '3 Lunar Base Camp Baselines',
      analogs_count_ar: '3 معايير لقواعد القمر المستقبلية',
      sites: [
        { id: 'target-moon-marius', name: 'Marius Hills Lava Tube', name_ar: 'فتحة أنبوب تلال ماريوس', lat: 14.1, lon: -56.7, target: 'Lanzarote/Labbah: 87.8%', target_ar: 'الشبيه الأرضي: لانزاروتي / اللبة (87.8%)' },
        { id: 'target-moon-shackleton', name: 'Shackleton Crater Rim', name_ar: 'حافة فوهة شاكلتون (القطب)', lat: -89.9, lon: 0.0, target: 'McMurdo Dry Valleys: 91.8%', target_ar: 'الشبيه الأرضي: ماكموردو (91.8%)' },
        { id: 'target-moon-descartes', name: 'Descartes Highlands', name_ar: 'مرتفعات ديكارت (أبولو 16)', lat: -8.9, lon: 15.5, target: 'Askja Basalt Analog: 87.2%', target_ar: 'الشبيه الأرضي: أسكيا (87.2%)' }
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
    // Key Sun Directional Light
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    sunLight.position.set(5, 3, 5);
    this.scene.add(sunLight);

    // Subtle Ambient Starlight
    const ambientLight = new THREE.AmbientLight(0x1a2638, 0.4);
    this.scene.add(ambientLight);

    // Cinematic Cool Backlight / Rim Glow
    const rimLight = new THREE.DirectionalLight(0x00d2ff, 0.6);
    rimLight.position.set(-5, -2, -4);
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
    const texture = this.generatePlanetTexture(planetKey);

    let material;
    if (planetKey === 'earth') {
      material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 25,
        specular: new THREE.Color(0x224466)
      });
    } else if (planetKey === 'mars') {
      material = new THREE.MeshLambertMaterial({
        map: texture
      });
    } else {
      // Moon
      material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.95,
        metalness: 0.05
      });
    }

    this.globeMesh = new THREE.Mesh(geometry, material);
    this.planetGroup.add(this.globeMesh);

    // 2. Earth Clouds Layer
    if (planetKey === 'earth') {
      const cloudGeom = new THREE.SphereGeometry(radius * 1.018, segments, segments);
      const cloudMat = new THREE.MeshPhongMaterial({
        map: this.generateCloudsTexture(),
        transparent: true,
        opacity: 0.45,
        blending: THREE.NormalBlending
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
            float intensity = pow(0.68 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
            gl_FragColor = vec4(0.0, 0.8, 1.0, 1.0) * intensity;
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
      const pinColor = planetKey === 'earth' ? 0x00e5a3 : (planetKey === 'mars' ? 0xff7a45 : 0x00d2ff);
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
    const diameterEl = document.getElementById('hudDiameter');
    const gravityEl = document.getElementById('hudGravity');
    const atmosphereEl = document.getElementById('hudAtmosphere');
    const tempEl = document.getElementById('hudTemp');
    const periodEl = document.getElementById('hudRotationPeriod');
    const countEl = document.getElementById('hudAnalogsCount');

    if (kickerEl) kickerEl.textContent = isAr ? data.kicker_ar : data.kicker_en;
    if (nameEl) nameEl.textContent = isAr ? data.name_ar : data.name_en;
    if (diameterEl) diameterEl.textContent = data.diameter;
    if (gravityEl) gravityEl.textContent = data.gravity;
    if (atmosphereEl) atmosphereEl.textContent = data.atmosphere;
    if (tempEl) tempEl.textContent = data.temp_range;
    if (periodEl) periodEl.textContent = data.rotation_period;
    if (countEl) countEl.textContent = isAr ? data.analogs_count_ar : data.analogs_count;
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
