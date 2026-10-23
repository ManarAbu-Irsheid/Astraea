/**
 * TerraTwin - Photorealistic 3D WebGL Planetary Orbit Background (Three.js)
 * High-fidelity NASA Earth & Deep Space scene matching the rest of the platform.
 * Features:
 * - Real 2K NASA diffuse, normal, and specular planetary maps
 * - Dynamic atmospheric cloud layer with independent orbital velocity
 * - Rayleigh scattering Fresnel atmospheric glow shader (Additive Blending)
 * - Ultra-Realistic Multi-Tiered Deep Space Starfield with Airy Disk Sprites & Diffraction Spikes
 * - Subtle astronomical scintillation (twinkle) and spectral stellar temperatures
 * - Authentic 3D Space Launch Rockets & Deep Space Orbital Craft with Glowing Plasma Exhaust & Particle Plumes
 * - Smooth 3D mouse parallax camera navigation
 * - Theme-responsive lighting and procedural fallback
 */

(function() {
  const container = document.getElementById('authCanvasBg');
  if (!container) return;

  // If Three.js is loaded, initialize photorealistic WebGL 3D scene
  if (typeof THREE !== 'undefined') {
    initThreeScene();
  } else {
    // Dynamic wait if script is still downloading
    const checkInterval = setInterval(() => {
      if (typeof THREE !== 'undefined') {
        clearInterval(checkInterval);
        initThreeScene();
      }
    }, 40);

    setTimeout(() => {
      clearInterval(checkInterval);
      if (typeof THREE === 'undefined') initFallbackCanvas();
    }, 2500);
  }

  function initThreeScene() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.5);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: container,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // 3. Lighting (NASA Photometric Sun & Atmospheric Rim)
    const sunLight = new THREE.DirectionalLight(0xfffaee, 2.4);
    sunLight.position.set(8, 4, 6);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x00c8ff, 0.85);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(0x061428, 0.4);
    scene.add(ambientLight);

    // 4. 3D Planetary Group (Positioned gracefully behind/beside auth card)
    const planetGroup = new THREE.Group();
    planetGroup.position.set(width > 768 ? 2.2 : 0, width > 768 ? -0.4 : -1.8, -1.5);
    scene.add(planetGroup);

    const textureLoader = new THREE.TextureLoader();

    // Earth Globe
    const globeRadius = 3.6;
    const segments = 64;
    const sphereGeom = new THREE.SphereGeometry(globeRadius, segments, segments);

    // Safe procedural fallback texture if file fails
    function createProceduralEarthTexture() {
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 512;
      const ctx = c.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 1024, 512);
      g.addColorStop(0, '#0c284d');
      g.addColorStop(0.5, '#1e4878');
      g.addColorStop(1, '#0c284d');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 512);
      return new THREE.CanvasTexture(c);
    }

    const earthMap = textureLoader.load(
      'assets/textures/earth_atmos_2048.jpg',
      () => renderer.render(scene, camera),
      undefined,
      () => createProceduralEarthTexture()
    );

    const earthNormal = textureLoader.load('assets/textures/earth_normal_2048.jpg');
    const earthSpecular = textureLoader.load('assets/textures/earth_specular_2048.jpg');

    const earthMat = new THREE.MeshPhongMaterial({
      map: earthMap,
      normalMap: earthNormal,
      normalScale: new THREE.Vector2(0.85, 0.85),
      specularMap: earthSpecular,
      specular: new THREE.Color(0x285585),
      shininess: 24
    });

    const globeMesh = new THREE.Mesh(sphereGeom, earthMat);
    globeMesh.rotation.y = 2.4;
    globeMesh.rotation.x = 0.22;
    planetGroup.add(globeMesh);

    // Cloud Layer
    const cloudGeom = new THREE.SphereGeometry(globeRadius * 1.018, segments, segments);
    const cloudMap = textureLoader.load('assets/textures/earth_clouds_1024.png');
    const cloudMat = new THREE.MeshPhongMaterial({
      map: cloudMap,
      transparent: true,
      opacity: 0.88,
      blending: THREE.NormalBlending
    });
    const cloudsMesh = new THREE.Mesh(cloudGeom, cloudMat);
    cloudsMesh.rotation.y = 2.4;
    planetGroup.add(cloudsMesh);

    // Rayleigh Atmosphere Scattering Shader
    const atmoGeom = new THREE.SphereGeometry(globeRadius * 1.05, segments, segments);
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
          float intensity = pow(0.68 - dot(vNormal, vec3(0, 0, 1.0)), 2.8);
          gl_FragColor = vec4(0.0, 0.72, 1.0, 1.0) * intensity * 1.4;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmoMesh = new THREE.Mesh(atmoGeom, atmoMat);
    planetGroup.add(atmoMesh);

    // =========================================================================
    // 5. ULTRA-REALISTIC MULTI-TIERED ASTRONOMICAL STARFIELD
    // =========================================================================

    // Realistic Star Airy Disk Sprite Generator
    function createStarSpriteTexture(hasDiffractionSpikes = false) {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d');
      const cx = 32, cy = 32;

      // Soft Radial Core & Exponential Falloff
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.12, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.28, 'rgba(215, 238, 255, 0.55)');
      grad.addColorStop(0.55, 'rgba(120, 190, 255, 0.16)');
      grad.addColorStop(0.85, 'rgba(50, 130, 255, 0.03)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      // Fine Optical 4-Point Diffraction Cross Spikes
      if (hasDiffractionSpikes) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(cx, 3); ctx.lineTo(cx, 61);
        ctx.moveTo(3, cy); ctx.lineTo(61, cy);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(180, 220, 255, 0.22)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy - 14); ctx.lineTo(cx + 14, cy + 14);
        ctx.moveTo(cx + 14, cy - 14); ctx.lineTo(cx - 14, cy + 14);
        ctx.stroke();
      }

      return new THREE.CanvasTexture(c);
    }

    const starTextureNormal = createStarSpriteTexture(false);
    const starTextureBeacon = createStarSpriteTexture(true);

    const spectralColors = [
      new THREE.Color(0xaed8f2), // O/B Deep Blue-White
      new THREE.Color(0xdceeff), // B Light Blue
      new THREE.Color(0xffffff), // A Pure Brilliant White
      new THREE.Color(0xfff7ea), // F Warm Soft White
      new THREE.Color(0xffe6b8), // G Solar Golden
      new THREE.Color(0xffcca0), // K Light Amber
      new THREE.Color(0xffb088)  // M Red Giant / Cool Star
    ];

    function generateStarLayer(count, minR, maxR, colorsPalette) {
      const geom = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const radius = minR + Math.random() * (maxR - minR);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = radius * Math.cos(phi);

        const chosenCol = colorsPalette[Math.floor(Math.random() * colorsPalette.length)];
        col[i * 3] = chosenCol.r;
        col[i * 3 + 1] = chosenCol.g;
        col[i * 3 + 2] = chosenCol.b;
      }

      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return geom;
    }

    // Layer 1: Distant Pinpoint Stars & Galactic Dust (2,600 stars)
    const distantGeom = generateStarLayer(2600, 90, 240, spectralColors);
    const distantMat = new THREE.PointsMaterial({
      size: 1.6,
      map: starTextureNormal,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const distantStars = new THREE.Points(distantGeom, distantMat);
    scene.add(distantStars);

    // Layer 2: Mid-Range Luminous Main-Sequence Stars (750 stars)
    const midGeom = generateStarLayer(750, 75, 200, spectralColors);
    const midMat = new THREE.PointsMaterial({
      size: 2.8,
      map: starTextureNormal,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const midStars = new THREE.Points(midGeom, midMat);
    scene.add(midStars);

    // Layer 3: Prominent Optical Beacon Stars (75 stars)
    const beaconGeom = generateStarLayer(75, 60, 160, [
      new THREE.Color(0xb5e0ff),
      new THREE.Color(0xffffff),
      new THREE.Color(0xffeed0),
      new THREE.Color(0x99ddff)
    ]);
    const beaconMat = new THREE.PointsMaterial({
      size: 6.2,
      map: starTextureBeacon,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const beaconStars = new THREE.Points(beaconGeom, beaconMat);
    scene.add(beaconStars);

    // =========================================================================
    // 6. PHOTOREALISTIC 3D AEROSPACE LAUNCH VEHICLE & DEEP SPACE MISSION CRAFT
    // =========================================================================

    // Procedural Vacuum Expansion Plume Texture (Supersonic Supra-Atmospheric Gradient)
    function createVacuumPlumeTexture() {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 256;
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.98)'); // Combustion throat (white-hot)
      grad.addColorStop(0.08, 'rgba(0, 245, 255, 0.92)');  // High-temp ionized cyan
      grad.addColorStop(0.24, 'rgba(0, 150, 255, 0.68)');  // Hydrolox / Methalox blue
      grad.addColorStop(0.55, 'rgba(30, 70, 230, 0.28)');  // Deep space expansion envelope
      grad.addColorStop(0.85, 'rgba(80, 20, 210, 0.09)');  // High-vacuum boundary
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 256);
      return new THREE.CanvasTexture(c);
    }
    const vacuumPlumeTexture = createVacuumPlumeTexture();

    // Procedural Ion Engine Plume Texture (Xenon Hall-Effect Thruster)
    function createIonPlumeTexture() {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 256;
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0.0, 'rgba(230, 255, 255, 1.0)');  // Ionization grid core
      grad.addColorStop(0.15, 'rgba(0, 255, 220, 0.85)');  // Turquoise plasma
      grad.addColorStop(0.45, 'rgba(50, 160, 255, 0.50)'); // Electromagnetic beam
      grad.addColorStop(0.85, 'rgba(140, 50, 250, 0.14)'); // Xenon halo
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 256);
      return new THREE.CanvasTexture(c);
    }
    const ionPlumeTexture = createIonPlumeTexture();

    // Trailing Particle Texture
    function createParticleTexture() {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 64;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(0, 229, 255, 0.8)');
      grad.addColorStop(0.7, 'rgba(0, 100, 255, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    }
    const particleTexture = createParticleTexture();

    // -------------------------------------------------------------------------
    // 6A. Heavy Orbital Launch Vehicle (SLS / Falcon 9 Multi-Stage Architecture)
    // -------------------------------------------------------------------------
    function buildHeavyLaunchVehicle(scale = 1.0) {
      const rocket = new THREE.Group();

      const whiteCompositeMat = new THREE.MeshStandardMaterial({
        color: 0xf4f7fa,
        roughness: 0.26,
        metalness: 0.52
      });

      const carbonInterstageMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.38,
        metalness: 0.75
      });

      const titaniumInconelMat = new THREE.MeshStandardMaterial({
        color: 0x1f242d,
        roughness: 0.18,
        metalness: 0.88
      });

      const conduitRacewayMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.35,
        metalness: 0.65
      });

      const cyanBandMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff });

      const r = 0.058 * scale; // Core radius (~1:15 Slender High-Performance Aspect Ratio)

      // 1. Stage 1 Booster Core
      const stage1Height = 1.15 * scale;
      const stage1Geom = new THREE.CylinderGeometry(r, r, stage1Height, 32);
      const stage1Mesh = new THREE.Mesh(stage1Geom, whiteCompositeMat);
      stage1Mesh.position.y = -0.12 * scale;
      rocket.add(stage1Mesh);

      // Exterior Fuel & Avionics Conduit Raceways (Two long slender pipes along hull)
      const racewayGeom = new THREE.BoxGeometry(0.007 * scale, stage1Height * 0.96, 0.012 * scale);
      const raceway1 = new THREE.Mesh(racewayGeom, conduitRacewayMat);
      raceway1.position.set(r * 0.98, -0.12 * scale, 0);
      rocket.add(raceway1);

      const raceway2 = new THREE.Mesh(racewayGeom, conduitRacewayMat);
      raceway2.position.set(-r * 0.98, -0.12 * scale, 0);
      rocket.add(raceway2);

      // 4 Deployable Titanium Grid Fins (Mounted below interstage)
      const finGeom = new THREE.BoxGeometry(0.012 * scale, 0.095 * scale, 0.065 * scale);
      for (let i = 0; i < 4; i++) {
        const fin = new THREE.Mesh(finGeom, titaniumInconelMat);
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        fin.position.x = Math.cos(angle) * (r * 1.05);
        fin.position.z = Math.sin(angle) * (r * 1.05);
        fin.position.y = 0.38 * scale;
        fin.rotation.y = angle;
        fin.rotation.z = -0.18;
        rocket.add(fin);
      }

      // 4 Aft Landing Leg Fairing Pockets at Base
      const blisterGeom = new THREE.BoxGeometry(0.014 * scale, 0.22 * scale, 0.02 * scale);
      for (let i = 0; i < 4; i++) {
        const blister = new THREE.Mesh(blisterGeom, conduitRacewayMat);
        const angle = (i * Math.PI) / 2;
        blister.position.x = Math.cos(angle) * (r * 0.98);
        blister.position.z = Math.sin(angle) * (r * 0.98);
        blister.position.y = -0.6 * scale;
        blister.rotation.y = angle;
        rocket.add(blister);
      }

      // 2. Aft Boattail & Multi-Engine Octaweb Cluster
      const boattailGeom = new THREE.CylinderGeometry(r, r * 0.88, 0.1 * scale, 32);
      const boattail = new THREE.Mesh(boattailGeom, titaniumInconelMat);
      boattail.position.y = -0.74 * scale;
      rocket.add(boattail);

      // Center High-Expansion Vacuum Engine Bell
      const centerNozzleGeom = new THREE.CylinderGeometry(0.012 * scale, 0.028 * scale, 0.08 * scale, 18, 1, true);
      const centerNozzle = new THREE.Mesh(centerNozzleGeom, titaniumInconelMat);
      centerNozzle.position.y = -0.83 * scale;
      rocket.add(centerNozzle);

      // 4 Gimbaled Outer Engine Bells
      const outerNozzleGeom = new THREE.CylinderGeometry(0.009 * scale, 0.02 * scale, 0.07 * scale, 16, 1, true);
      for (let i = 0; i < 4; i++) {
        const nozzle = new THREE.Mesh(outerNozzleGeom, titaniumInconelMat);
        const angle = (i * Math.PI) / 2;
        nozzle.position.x = Math.cos(angle) * (0.024 * scale);
        nozzle.position.z = Math.sin(angle) * (0.024 * scale);
        nozzle.position.y = -0.825 * scale;
        rocket.add(nozzle);
      }

      // 3. Interstage Decoupler (Carbon-composite band)
      const interstageHeight = 0.18 * scale;
      const interstageGeom = new THREE.CylinderGeometry(r * 0.99, r * 0.99, interstageHeight, 32);
      const interstage = new THREE.Mesh(interstageGeom, carbonInterstageMat);
      interstage.position.y = 0.54 * scale;
      rocket.add(interstage);

      // Metallic Seam Separation Ring
      const seamGeom = new THREE.CylinderGeometry(r * 1.01, r * 1.01, 0.015 * scale, 32);
      const seam1 = new THREE.Mesh(seamGeom, cyanBandMat);
      seam1.position.y = 0.45 * scale;
      rocket.add(seam1);

      // 4. Second Stage Core (Upper Orbital Injection Stage)
      const stage2Height = 0.38 * scale;
      const stage2Geom = new THREE.CylinderGeometry(r, r, stage2Height, 32);
      const stage2 = new THREE.Mesh(stage2Geom, whiteCompositeMat);
      stage2.position.y = 0.82 * scale;
      rocket.add(stage2);

      // 4 RCS Thruster Quads on Stage 2
      const rcsGeom = new THREE.BoxGeometry(0.012 * scale, 0.012 * scale, 0.012 * scale);
      for (let i = 0; i < 4; i++) {
        const rcs = new THREE.Mesh(rcsGeom, titaniumInconelMat);
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        rcs.position.x = Math.cos(angle) * (r * 1.02);
        rcs.position.z = Math.sin(angle) * (r * 1.02);
        rcs.position.y = 0.95 * scale;
        rocket.add(rcs);
      }

      // 5. Authentic Von Kármán / Ogive Payload Fairing (Smooth Aerodynamic Curvature)
      const fairingHeight = 0.52 * scale;
      const fairingSegments = 18;
      const fairingPoints = [];
      for (let i = 0; i <= fairingSegments; i++) {
        const t = i / fairingSegments;
        const curY = t * fairingHeight;
        const curR = r * Math.sqrt(Math.max(0, 1.0 - Math.pow(t, 1.65)));
        fairingPoints.push(new THREE.Vector2(curR, curY));
      }
      const fairingGeom = new THREE.LatheGeometry(fairingPoints, 32);
      const fairingMesh = new THREE.Mesh(fairingGeom, whiteCompositeMat);
      fairingMesh.position.y = 1.01 * scale;
      rocket.add(fairingMesh);

      // Aerodynamic Tip Probe & Pitot Mast
      const tipGeom = new THREE.CylinderGeometry(0.002 * scale, 0.003 * scale, 0.07 * scale, 12);
      const tipMesh = new THREE.Mesh(tipGeom, titaniumInconelMat);
      tipMesh.position.y = 1.01 * scale + fairingHeight + 0.035 * scale;
      rocket.add(tipMesh);

      // =======================================================================
      // SUPERSONIC VACUUM EXHAUST PLUME & MACH SHOCK DIAMONDS
      // =======================================================================
      const flameGroup = new THREE.Group();
      flameGroup.position.y = -0.87 * scale;

      // 1. Incandescent Combustion Throat Jet (Pure White Core)
      const throatGeom = new THREE.ConeGeometry(0.024 * scale, 0.28 * scale, 16);
      const throatMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.98
      });
      const throatMesh = new THREE.Mesh(throatGeom, throatMat);
      throatMesh.rotation.x = Math.PI;
      throatMesh.position.y = -0.14 * scale;
      flameGroup.add(throatMesh);

      // 2. Mach Shock Diamonds (Supersonic Flow Nodes)
      const diamondMat = new THREE.MeshBasicMaterial({
        color: 0x99ffff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      const diamondGeom = new THREE.OctahedronGeometry(0.016 * scale, 0);
      const diamondDistances = [0.08, 0.19, 0.33, 0.50];
      diamondDistances.forEach((dist, idx) => {
        const dMesh = new THREE.Mesh(diamondGeom, diamondMat);
        dMesh.position.y = -dist * scale;
        const s = 1.0 - idx * 0.18;
        dMesh.scale.set(0.7 * s, 2.2 * s, 0.7 * s);
        flameGroup.add(dMesh);
      });

      // 3. Supersonic Vacuum Free Expansion Envelope (Curved Plume Bell)
      const plumeBellPoints = [];
      const plumeBellSegments = 16;
      const plumeLength = 1.35 * scale;
      for (let i = 0; i <= plumeBellSegments; i++) {
        const t = i / plumeBellSegments;
        const curY = -t * plumeLength;
        const curR = (0.026 * scale) + (0.24 * scale) * Math.pow(t, 0.75);
        plumeBellPoints.push(new THREE.Vector2(curR, curY));
      }
      const plumeBellGeom = new THREE.LatheGeometry(plumeBellPoints, 28);
      const plumeBellMat = new THREE.MeshBasicMaterial({
        map: vacuumPlumeTexture,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const plumeBellMesh = new THREE.Mesh(plumeBellGeom, plumeBellMat);
      flameGroup.add(plumeBellMesh);

      // Engine PointLight
      const engineLight = new THREE.PointLight(0x00e5ff, 2.6, 6.0);
      engineLight.position.y = -0.9 * scale;
      rocket.add(engineLight);

      rocket.add(flameGroup);

      // 4. Trailing Dynamic Dispersal Particle Plume
      const plumeCount = 50;
      const pGeom = new THREE.BufferGeometry();
      const pPos = new Float32Array(plumeCount * 3);
      const pCol = new Float32Array(plumeCount * 3);
      for (let i = 0; i < plumeCount * 3; i++) {
        pPos[i] = 9999;
        pCol[i] = 1.0;
      }
      pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      pGeom.setAttribute('color', new THREE.BufferAttribute(pCol, 3));

      const pMat = new THREE.PointsMaterial({
        size: 3.8,
        map: particleTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const plumePoints = new THREE.Points(pGeom, pMat);
      scene.add(plumePoints);

      return {
        mesh: rocket,
        flameGroup,
        engineLight,
        plumePoints,
        plumeHistory: [],
        scale
      };
    }

    // -------------------------------------------------------------------------
    // 6B. Deep Space Exploration Science Cruiser (Photovoltaic Wings & Ion Drive)
    // -------------------------------------------------------------------------
    function buildDeepSpaceSurveyor(scale = 0.85) {
      const craft = new THREE.Group();

      const chassisMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.28,
        metalness: 0.82
      });

      const goldMliMat = new THREE.MeshStandardMaterial({
        color: 0xca8a04,
        roughness: 0.35,
        metalness: 0.92
      });

      const solarCellMat = new THREE.MeshStandardMaterial({
        color: 0x071e3d,
        roughness: 0.15,
        metalness: 0.65
      });

      const whiteDishMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.2,
        metalness: 0.4
      });

      // 1. Octagonal Main Avionics Bus
      const busGeom = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.32 * scale, 8);
      const busMesh = new THREE.Mesh(busGeom, chassisMat);
      craft.add(busMesh);

      // Gold MLI Thermal Insulation Panels
      const mliGeom = new THREE.BoxGeometry(0.125 * scale, 0.24 * scale, 0.125 * scale);
      const mliMesh = new THREE.Mesh(mliGeom, goldMliMat);
      craft.add(mliMesh);

      // 2. High-Gain Communications Dish Antenna
      const dishGeom = new THREE.SphereGeometry(0.085 * scale, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.42);
      const dishMesh = new THREE.Mesh(dishGeom, whiteDishMat);
      dishMesh.position.set(0, 0.16 * scale, 0.08 * scale);
      dishMesh.rotation.x = Math.PI * 0.35;
      craft.add(dishMesh);

      // Subreflector Feed Horn on Tripod
      const feedHornGeom = new THREE.ConeGeometry(0.012 * scale, 0.04 * scale, 8);
      const feedHorn = new THREE.Mesh(feedHornGeom, goldMliMat);
      feedHorn.position.set(0, 0.24 * scale, 0.14 * scale);
      feedHorn.rotation.x = Math.PI * 0.35;
      craft.add(feedHorn);

      // 3. Symmetrical Deployable Solar Array Wings (Left & Right)
      const panelGeom = new THREE.BoxGeometry(0.52 * scale, 0.14 * scale, 0.008 * scale);

      // Left Solar Wing
      const leftWing = new THREE.Mesh(panelGeom, solarCellMat);
      leftWing.position.set(-0.36 * scale, 0, 0);
      craft.add(leftWing);

      // Left Wing Strut
      const strutGeom = new THREE.CylinderGeometry(0.004 * scale, 0.004 * scale, 0.1 * scale, 8);
      const leftStrut = new THREE.Mesh(strutGeom, chassisMat);
      leftStrut.rotation.z = Math.PI / 2;
      leftStrut.position.set(-0.11 * scale, 0, 0);
      craft.add(leftStrut);

      // Right Solar Wing
      const rightWing = new THREE.Mesh(panelGeom, solarCellMat);
      rightWing.position.set(0.36 * scale, 0, 0);
      craft.add(rightWing);

      const rightStrut = new THREE.Mesh(strutGeom, chassisMat);
      rightStrut.rotation.z = Math.PI / 2;
      rightStrut.position.set(0.11 * scale, 0, 0);
      craft.add(rightStrut);

      // 4. Stern Electric Xenon Ion Propulsion Thruster
      const ionNozzleGeom = new THREE.CylinderGeometry(0.022 * scale, 0.04 * scale, 0.05 * scale, 16, 1, true);
      const ionNozzle = new THREE.Mesh(ionNozzleGeom, chassisMat);
      ionNozzle.position.y = -0.185 * scale;
      craft.add(ionNozzle);

      // Ion Engine Plasma Exhaust Plume
      const flameGroup = new THREE.Group();
      flameGroup.position.y = -0.21 * scale;

      // Ion Beam Core
      const ionCoreGeom = new THREE.ConeGeometry(0.02 * scale, 0.35 * scale, 16);
      const ionCoreMat = new THREE.MeshBasicMaterial({
        color: 0xd8b4fe,
        transparent: true,
        opacity: 0.95
      });
      const ionCore = new THREE.Mesh(ionCoreGeom, ionCoreMat);
      ionCore.rotation.x = Math.PI;
      ionCore.position.y = -0.175 * scale;
      flameGroup.add(ionCore);

      // Expanding Ion Halo
      const ionHaloGeom = new THREE.ConeGeometry(0.09 * scale, 0.9 * scale, 16);
      const ionHaloMat = new THREE.MeshBasicMaterial({
        map: ionPlumeTexture,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const ionHalo = new THREE.Mesh(ionHaloGeom, ionHaloMat);
      ionHalo.rotation.x = Math.PI;
      ionHalo.position.y = -0.45 * scale;
      flameGroup.add(ionHalo);

      const engineLight = new THREE.PointLight(0xa855f7, 2.0, 5.0);
      engineLight.position.y = -0.25 * scale;
      craft.add(engineLight);

      craft.add(flameGroup);

      // Trailing Ion Particle Beam
      const plumeCount = 50;
      const pGeom = new THREE.BufferGeometry();
      const pPos = new Float32Array(plumeCount * 3);
      const pCol = new Float32Array(plumeCount * 3);
      for (let i = 0; i < plumeCount * 3; i++) {
        pPos[i] = 9999;
        pCol[i] = 1.0;
      }
      pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      pGeom.setAttribute('color', new THREE.BufferAttribute(pCol, 3));

      const pMat = new THREE.PointsMaterial({
        size: 3.2,
        map: particleTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const plumePoints = new THREE.Points(pGeom, pMat);
      scene.add(plumePoints);

      return {
        mesh: craft,
        flameGroup,
        engineLight,
        plumePoints,
        plumeHistory: [],
        scale
      };
    }

    // Craft 1: Heavy Orbital Launch Vehicle (Ascending from Earth Limb into Deep Space)
    const rocket1 = buildHeavyLaunchVehicle(1.15);
    scene.add(rocket1.mesh);

    // Craft 2: Deep-Space Orbital Science Surveyor
    const rocket2 = buildDeepSpaceSurveyor(0.9);
    scene.add(rocket2.mesh);

    // Trajectory Controller Functions
    let r1Progress = 0.05;
    let r2Progress = 0.55;

    function getRocket1Position(t) {
      // Orbital ascent trajectory curving across the background
      const angle = (t * 0.9) - 0.45;
      const x = (t * 12.0) - 6.5;
      const y = Math.sin(t * Math.PI * 0.85) * 4.2 - 2.2;
      const z = (t * -2.5) - 0.5;
      return new THREE.Vector3(x, y, z);
    }

    function getRocket2Position(t) {
      // High deep-space horizontal cruiser trajectory
      const x = 7.0 - (t * 14.5);
      const y = 3.2 - (t * 1.8) + Math.sin(t * Math.PI) * 0.6;
      const z = -2.5 - (t * 1.5);
      return new THREE.Vector3(x, y, z);
    }

    // 7. Interactive Mouse Parallax
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    window.addEventListener('mousemove', (e) => {
      targetX = (e.clientX / width - 0.5) * 1.5;
      targetY = (e.clientY / height - 0.5) * 1.2;
    });

    // 8. Responsive Resizing
    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      planetGroup.position.set(width > 768 ? 2.2 : 0, width > 768 ? -0.4 : -1.8, -1.5);
    });

    // 9. Animation Loop
    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;

      camera.position.x = mouseX * 0.45;
      camera.position.y = -mouseY * 0.45;
      camera.lookAt(0, 0, -1.5);

      // Planetary rotation
      globeMesh.rotation.y += 0.0006;
      cloudsMesh.rotation.y += 0.00085;

      // Realistic Independent Celestial Starfield Motion
      distantStars.rotation.y += 0.000035;
      midStars.rotation.y += 0.000065;
      beaconStars.rotation.y += 0.000095;

      // Natural Atmospheric Scintillation (Subtle Star Twinkle)
      beaconMat.opacity = 0.84 + Math.sin(elapsedTime * 2.4) * 0.14;
      midMat.opacity = 0.88 + Math.cos(elapsedTime * 1.8) * 0.08;

      // =====================================================================
      // ROCKET FLIGHT & EXHAUST PLUME SIMULATION
      // =====================================================================

      // Update Rocket 1 (Ascent Launcher)
      r1Progress += 0.0016;
      if (r1Progress > 1.05) r1Progress = 0.0;

      const p1 = getRocket1Position(r1Progress);
      const p1Next = getRocket1Position(r1Progress + 0.015);
      const dir1 = p1Next.clone().sub(p1).normalize();

      rocket1.mesh.position.copy(p1);
      // Orient rocket along its ascent velocity vector (tip forwards)
      rocket1.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir1);

      // Engine Flame Combustion Flicker
      const flameScale1 = 1.0 + Math.sin(elapsedTime * 34.0) * 0.12 + (Math.random() * 0.05);
      rocket1.flameGroup.scale.set(1.0, flameScale1, 1.0);
      rocket1.engineLight.intensity = 2.4 + Math.sin(elapsedTime * 28.0) * 0.45;

      // Particle Trail for Rocket 1 (Tail offset aligned with multi-engine cluster)
      const tailPos1 = p1.clone().add(dir1.clone().multiplyScalar(-0.95 * rocket1.scale));
      rocket1.plumeHistory.unshift(tailPos1);
      if (rocket1.plumeHistory.length > 50) rocket1.plumeHistory.pop();

      const posAttr1 = rocket1.plumePoints.geometry.attributes.position;
      const colAttr1 = rocket1.plumePoints.geometry.attributes.color;
      for (let i = 0; i < 50; i++) {
        if (rocket1.plumeHistory[i]) {
          posAttr1.setXYZ(i, rocket1.plumeHistory[i].x, rocket1.plumeHistory[i].y, rocket1.plumeHistory[i].z);
          const alphaFade = Math.max(0, 1.0 - (i / 50));
          colAttr1.setXYZ(i, 0.2 * alphaFade, 0.9 * alphaFade, 1.0 * alphaFade);
        } else {
          posAttr1.setXYZ(i, 9999, 9999, 9999);
        }
      }
      posAttr1.needsUpdate = true;
      colAttr1.needsUpdate = true;

      // Update Rocket 2 (Orbital Deep Space Surveyor)
      r2Progress += 0.0011;
      if (r2Progress > 1.05) r2Progress = 0.0;

      const p2 = getRocket2Position(r2Progress);
      const p2Next = getRocket2Position(r2Progress + 0.015);
      const dir2 = p2Next.clone().sub(p2).normalize();

      rocket2.mesh.position.copy(p2);
      rocket2.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir2);

      const flameScale2 = 1.0 + Math.sin(elapsedTime * 24.0) * 0.1;
      rocket2.flameGroup.scale.set(1.0, flameScale2, 1.0);
      rocket2.engineLight.intensity = 2.0 + Math.cos(elapsedTime * 18.0) * 0.35;

      const tailPos2 = p2.clone().add(dir2.clone().multiplyScalar(-0.35 * rocket2.scale));
      rocket2.plumeHistory.unshift(tailPos2);
      if (rocket2.plumeHistory.length > 50) rocket2.plumeHistory.pop();

      const posAttr2 = rocket2.plumePoints.geometry.attributes.position;
      const colAttr2 = rocket2.plumePoints.geometry.attributes.color;
      for (let i = 0; i < 50; i++) {
        if (rocket2.plumeHistory[i]) {
          posAttr2.setXYZ(i, rocket2.plumeHistory[i].x, rocket2.plumeHistory[i].y, rocket2.plumeHistory[i].z);
          const alphaFade = Math.max(0, 1.0 - (i / 50));
          colAttr2.setXYZ(i, 0.65 * alphaFade, 0.25 * alphaFade, 1.0 * alphaFade);
        } else {
          posAttr2.setXYZ(i, 9999, 9999, 9999);
        }
      }
      posAttr2.needsUpdate = true;
      colAttr2.needsUpdate = true;

      // Light Theme Adjustments
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (isLight) {
        sunLight.intensity = 2.8;
        ambientLight.intensity = 0.75;
        atmoMat.opacity = 0.55;
        distantMat.opacity = 0.45;
        midMat.opacity = 0.55;
      } else {
        sunLight.intensity = 2.4;
        ambientLight.intensity = 0.4;
        atmoMat.opacity = 1.0;
      }

      renderer.render(scene, camera);
    }

    animate();
  }

  // Fallback 2D canvas in case WebGL is unavailable
  function initFallbackCanvas() {
    const ctx = container.getContext('2d');
    if (!ctx) return;
    function draw() {
      ctx.fillStyle = '#020610';
      ctx.fillRect(0, 0, container.width, container.height);
    }
    draw();
  }
})();
