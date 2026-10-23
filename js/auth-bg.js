/**
 * TerraTwin - Photorealistic 3D WebGL Planetary Orbit Background (Three.js)
 * High-fidelity NASA Earth & Deep Space scene matching the rest of the platform.
 * Features:
 * - Real 2K NASA diffuse, normal, and specular planetary maps
 * - Dynamic atmospheric cloud layer with independent orbital velocity
 * - Rayleigh scattering Fresnel atmospheric glow shader (Additive Blending)
 * - Ultra-Realistic Multi-Tiered Deep Space Starfield with Airy Disk Sprites & Diffraction Spikes
 * - Subtle astronomical scintillation (twinkle) and spectral stellar temperatures
 * - Authentic 3D Space Launch Rockets & Deep Space Orbital Craft with Photorealistic Supersonic Fire & Billowing Plumes
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
    // 6. PHOTOREALISTIC PROCEDURAL ROCKET PROPULSION & FIRE TEXTURES
    // =========================================================================

    // A. Volumetric Supersonic Flame Column Texture (Incandescent Core + Fire Orange Sheath)
    function createRealisticFlameTexture() {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 512;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 128, 512);

      // Outer Fiery Combustion Plume
      const outerGrad = ctx.createLinearGradient(64, 0, 64, 512);
      outerGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');    // Nozzle throat white-hot
      outerGrad.addColorStop(0.05, 'rgba(255, 245, 140, 0.98)');  // High-temp incandescent gold
      outerGrad.addColorStop(0.18, 'rgba(255, 160, 20, 0.94)');   // Fiery orange
      outerGrad.addColorStop(0.45, 'rgba(255, 80, 5, 0.78)');     // Blazing crimson-orange
      outerGrad.addColorStop(0.72, 'rgba(210, 35, 0, 0.42)');     // Cooling amber flame
      outerGrad.addColorStop(0.92, 'rgba(90, 15, 0, 0.14)');      // Ethereal flame tip
      outerGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      // Draw tapered aerodynamic supersonic flame teardrop shape
      ctx.save();
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.moveTo(48, 0);
      ctx.bezierCurveTo(24, 75, 16, 210, 36, 370);
      ctx.bezierCurveTo(46, 430, 58, 485, 64, 512);
      ctx.bezierCurveTo(70, 485, 82, 430, 92, 370);
      ctx.bezierCurveTo(112, 210, 104, 75, 80, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // High-intensity white-hot central core jet
      const coreGrad = ctx.createLinearGradient(64, 0, 64, 320);
      coreGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
      coreGrad.addColorStop(0.2, 'rgba(255, 255, 240, 0.98)');
      coreGrad.addColorStop(0.55, 'rgba(255, 215, 80, 0.75)');
      coreGrad.addColorStop(0.85, 'rgba(255, 130, 15, 0.35)');
      coreGrad.addColorStop(1.0, 'rgba(255, 70, 5, 0)');

      ctx.save();
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.moveTo(56, 0);
      ctx.bezierCurveTo(46, 55, 44, 140, 56, 230);
      ctx.bezierCurveTo(60, 275, 64, 315, 64, 320);
      ctx.bezierCurveTo(64, 315, 68, 275, 72, 230);
      ctx.bezierCurveTo(84, 140, 82, 55, 72, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Subtle turbulent supersonic combustion streaks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(64, 0);
      ctx.lineTo(64, 190);
      ctx.stroke();

      return new THREE.CanvasTexture(c);
    }
    const realisticFlameTexture = createRealisticFlameTexture();

    // B. Supersonic Mach Shock Diamond Texture (Acoustic Compression Nodes)
    function createMachDiamondTexture() {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 128;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 64, 128);

      const cx = 32, cy = 64;
      const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, 55);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.18, 'rgba(255, 248, 190, 0.96)');
      grad.addColorStop(0.42, 'rgba(255, 180, 45, 0.65)');
      grad.addColorStop(0.72, 'rgba(255, 75, 0, 0.22)');
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, 8);
      ctx.bezierCurveTo(cx + 20, cy - 14, cx + 22, cy + 14, cx, 120);
      ctx.bezierCurveTo(cx - 22, cy + 14, cx - 20, cy - 14, cx, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      return new THREE.CanvasTexture(c);
    }
    const machDiamondTexture = createMachDiamondTexture();

    // C. Supersonic Vacuum Free Expansion Plume Bell Texture (Twilight Phenomenon)
    function createSupersonicPlumeTexture() {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 256;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 128, 256);

      const grad = ctx.createLinearGradient(64, 0, 64, 256);
      grad.addColorStop(0.0, 'rgba(255, 242, 190, 0.88)'); // Hot incandescent near nozzle
      grad.addColorStop(0.12, 'rgba(255, 155, 45, 0.68)'); // Fiery gas expansion
      grad.addColorStop(0.35, 'rgba(240, 85, 25, 0.38)');  // Vacuum twilight plume
      grad.addColorStop(0.68, 'rgba(180, 55, 170, 0.16)'); // Ethereal outer vacuum boundary
      grad.addColorStop(0.9, 'rgba(70, 120, 240, 0.06)');  // Ionized edge
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 256);
      return new THREE.CanvasTexture(c);
    }
    const supersonicPlumeTexture = createSupersonicPlumeTexture();

    // D. Engine Throat Optical Bloom Texture (Radiant Combustion Chamber Irradiance)
    function createEngineGlowTexture() {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 128, 128);

      const cx = 64, cy = 64;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.16, 'rgba(255, 242, 160, 0.92)');
      grad.addColorStop(0.38, 'rgba(255, 145, 35, 0.58)');
      grad.addColorStop(0.68, 'rgba(255, 65, 10, 0.18)');
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }
    const engineGlowTexture = createEngineGlowTexture();

    // E. Soft Volumetric Billowing Smoke & Fire Puff Texture
    function createSmokePuffTexture() {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 64, 64);

      const cx = 32, cy = 32;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.22, 'rgba(255, 255, 255, 0.88)');
      grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.38)');
      grad.addColorStop(0.82, 'rgba(255, 255, 255, 0.08)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    }
    const smokePuffTexture = createSmokePuffTexture();

    // =========================================================================
    // 7. CALM & SUBTLE VOLUMETRIC FLAME ASSEMBLY BUILDER
    // =========================================================================
    function createRocketFlameAssembly(scale = 1.0, isHeavy = true) {
      const flameGroup = new THREE.Group();

      // 1. Sleek, compact volumetric flame column (3 cross planes at 0°, 60°, 120°)
      const flameWidth = (isHeavy ? 0.08 : 0.055) * scale;
      const flameHeight = (isHeavy ? 0.58 : 0.38) * scale;
      const flameGeom = new THREE.PlaneGeometry(flameWidth, flameHeight);
      flameGeom.translate(0, -flameHeight / 2, 0);

      const flameMat = new THREE.MeshBasicMaterial({
        map: realisticFlameTexture,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      for (let i = 0; i < 3; i++) {
        const plane = new THREE.Mesh(flameGeom, flameMat);
        plane.rotation.y = (i * Math.PI) / 3;
        flameGroup.add(plane);
      }

      // 2. Focused white-hot inner thrust core cone
      const coreLength = (isHeavy ? 0.22 : 0.15) * scale;
      const coreRadius = (isHeavy ? 0.016 : 0.011) * scale;
      const coreGeom = new THREE.ConeGeometry(coreRadius, coreLength, 16);
      coreGeom.translate(0, -coreLength / 2, 0);
      coreGeom.rotateX(Math.PI);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.90,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const coreMesh = new THREE.Mesh(coreGeom, coreMat);
      flameGroup.add(coreMesh);

      // 3. Subtle Mach Shock Diamonds (Small, elegant compression nodes)
      const diamondMat = new THREE.MeshBasicMaterial({
        map: machDiamondTexture,
        transparent: true,
        opacity: 0.70,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const diamondDistances = isHeavy ? [0.08, 0.18] : [0.06, 0.14];
      const diamondMeshes = [];
      diamondDistances.forEach((dist, idx) => {
        const dSize = (isHeavy ? 0.032 : 0.022) * scale * (1.0 - idx * 0.2);
        const dGeom = new THREE.PlaneGeometry(dSize * 0.7, dSize * 1.3);
        for (let j = 0; j < 2; j++) {
          const dMesh = new THREE.Mesh(dGeom, diamondMat);
          dMesh.position.y = -dist * scale;
          dMesh.rotation.y = j * (Math.PI / 2);
          flameGroup.add(dMesh);
          diamondMeshes.push(dMesh);
        }
      });

      // 4. Delicate Engine Throat Optical Bloom (Soft, non-intrusive lens glint)
      const bloomMat = new THREE.SpriteMaterial({
        map: engineGlowTexture,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const bloomSprite = new THREE.Sprite(bloomMat);
      const bScale = (isHeavy ? 0.20 : 0.14) * scale;
      bloomSprite.scale.set(bScale, bScale, 1.0);
      bloomSprite.position.y = -0.01 * scale;
      flameGroup.add(bloomSprite);

      // 5. Calm warm PointLight softly illuminating the engine base
      const engineLight = new THREE.PointLight(0xff8833, isHeavy ? 1.0 : 0.65, isHeavy ? 3.5 : 2.5);
      engineLight.position.y = -0.06 * scale;
      flameGroup.add(engineLight);

      return {
        flameGroup,
        engineLight,
        diamondMeshes,
        bloomSprite,
        coreMesh
      };
    }

    // =========================================================================
    // 8. CALM & ETHEREAL EXHAUST PARTICLE EMITTER SYSTEM
    // =========================================================================
    function createPlumeParticleSystem(maxParticles = 40) {
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(maxParticles * 3);
      const colors = new Float32Array(maxParticles * 3);

      for (let i = 0; i < maxParticles * 3; i++) {
        positions[i] = 9999;
        colors[i] = 0.0;
      }

      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({
        size: 1.5,
        map: smokePuffTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const pointsMesh = new THREE.Points(geom, mat);
      scene.add(pointsMesh);

      const particles = [];
      for (let i = 0; i < maxParticles; i++) {
        particles.push({
          x: 9999, y: 9999, z: 9999,
          vx: 0, vy: 0, vz: 0,
          age: 1.0,
          maxAge: 25,
          active: false
        });
      }

      let spawnIndex = 0;

      function emit(origin, thrustDir, scale = 1.0) {
        const p = particles[spawnIndex];
        spawnIndex = (spawnIndex + 1) % maxParticles;

        p.active = true;
        p.age = 0.0;
        p.maxAge = 20 + Math.random() * 10;

        // Eject softly backwards with very tight spread
        const backwardSpeed = 0.012 + Math.random() * 0.008;
        const spread = 0.006 * scale;
        const rx = (Math.random() - 0.5) * spread;
        const ry = (Math.random() - 0.5) * spread;
        const rz = (Math.random() - 0.5) * spread;

        p.x = origin.x + rx;
        p.y = origin.y + ry;
        p.z = origin.z + rz;

        p.vx = -thrustDir.x * backwardSpeed + rx * 0.2;
        p.vy = -thrustDir.y * backwardSpeed + ry * 0.2;
        p.vz = -thrustDir.z * backwardSpeed + rz * 0.2;
      }

      function update() {
        const posAttr = geom.attributes.position;
        const colAttr = geom.attributes.color;

        for (let i = 0; i < maxParticles; i++) {
          const p = particles[i];
          if (!p.active) {
            posAttr.setXYZ(i, 9999, 9999, 9999);
            colAttr.setXYZ(i, 0, 0, 0);
            continue;
          }

          p.age += 1.0;
          const t = p.age / p.maxAge;
          if (t >= 1.0) {
            p.active = false;
            posAttr.setXYZ(i, 9999, 9999, 9999);
            colAttr.setXYZ(i, 0, 0, 0);
            continue;
          }

          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;

          p.vx *= 0.96;
          p.vy *= 0.96;
          p.vz *= 0.96;

          posAttr.setXYZ(i, p.x, p.y, p.z);

          // Smooth, delicate amber-warm fade
          const alphaFade = Math.pow(1.0 - t, 1.4) * 0.45;
          const r = 1.0 * alphaFade;
          const g = (0.7 - t * 0.4) * alphaFade;
          const b = (0.28 - t * 0.28) * alphaFade;

          colAttr.setXYZ(i, r, g, b);
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      }

      return {
        emit,
        update,
        pointsMesh
      };
    }

    // -------------------------------------------------------------------------
    // 9A. Heavy Orbital Launch Vehicle (SLS / Falcon 9 Multi-Stage Architecture)
    // -------------------------------------------------------------------------
    function buildHeavyLaunchVehicle(scale = 1.15) {
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

      const r = 0.058 * scale; // Core radius

      // 1. Stage 1 Booster Core
      const stage1Height = 1.15 * scale;
      const stage1Geom = new THREE.CylinderGeometry(r, r, stage1Height, 32);
      const stage1Mesh = new THREE.Mesh(stage1Geom, whiteCompositeMat);
      stage1Mesh.position.y = -0.12 * scale;
      rocket.add(stage1Mesh);

      // Exterior Fuel & Avionics Conduit Raceways
      const racewayGeom = new THREE.BoxGeometry(0.007 * scale, stage1Height * 0.96, 0.012 * scale);
      const raceway1 = new THREE.Mesh(racewayGeom, conduitRacewayMat);
      raceway1.position.set(r * 0.98, -0.12 * scale, 0);
      rocket.add(raceway1);

      const raceway2 = new THREE.Mesh(racewayGeom, conduitRacewayMat);
      raceway2.position.set(-r * 0.98, -0.12 * scale, 0);
      rocket.add(raceway2);

      // 4 Deployable Titanium Grid Fins
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
      const outerNozzleFlameCones = [];
      const outerCoreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.80,
        blending: THREE.AdditiveBlending
      });
      const outerFlameGeom = new THREE.ConeGeometry(0.006 * scale, 0.08 * scale, 12);
      outerFlameGeom.translate(0, -0.04 * scale, 0);
      outerFlameGeom.rotateX(Math.PI);

      for (let i = 0; i < 4; i++) {
        const nozzle = new THREE.Mesh(outerNozzleGeom, titaniumInconelMat);
        const angle = (i * Math.PI) / 2;
        nozzle.position.x = Math.cos(angle) * (0.024 * scale);
        nozzle.position.z = Math.sin(angle) * (0.024 * scale);
        nozzle.position.y = -0.825 * scale;
        rocket.add(nozzle);

        // Subtle, compact flame tip from each outer engine bell
        const outerFlame = new THREE.Mesh(outerFlameGeom, outerCoreMat);
        outerFlame.position.set(nozzle.position.x, -0.85 * scale, nozzle.position.z);
        rocket.add(outerFlame);
        outerNozzleFlameCones.push(outerFlame);
      }

      // 3. Interstage Decoupler
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

      // 4. Second Stage Core
      const stage2Height = 0.38 * scale;
      const stage2Geom = new THREE.CylinderGeometry(r, r, stage2Height, 32);
      const stage2 = new THREE.Mesh(stage2Geom, whiteCompositeMat);
      stage2.position.y = 0.82 * scale;
      rocket.add(stage2);

      // RCS Thruster Quads on Stage 2
      const rcsGeom = new THREE.BoxGeometry(0.012 * scale, 0.012 * scale, 0.012 * scale);
      for (let i = 0; i < 4; i++) {
        const rcs = new THREE.Mesh(rcsGeom, titaniumInconelMat);
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        rcs.position.x = Math.cos(angle) * (r * 1.02);
        rcs.position.z = Math.sin(angle) * (r * 1.02);
        rcs.position.y = 0.95 * scale;
        rocket.add(rcs);
      }

      // 5. Authentic Von Kármán / Ogive Payload Fairing
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

      // 6. Photorealistic Multi-Layer Supersonic Flame Assembly
      const flameAssembly = createRocketFlameAssembly(scale, true);
      flameAssembly.flameGroup.position.y = -0.87 * scale;
      rocket.add(flameAssembly.flameGroup);

      return {
        mesh: rocket,
        flameAssembly,
        outerNozzleFlameCones,
        scale
      };
    }

    // -------------------------------------------------------------------------
    // 9B. Orbital Science Exploration Spacecraft (Deep Space Cruiser)
    // -------------------------------------------------------------------------
    function buildOrbitalScienceCruiser(scale = 0.95) {
      const craft = new THREE.Group();

      const thermalTileMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.45,
        metalness: 0.7
      });

      const whiteAeroMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.22,
        metalness: 0.48
      });

      const goldMliMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.32,
        metalness: 0.94
      });

      const solarCellMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.15,
        metalness: 0.65
      });

      const titaniumMat = new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        roughness: 0.25,
        metalness: 0.85
      });

      // 1. Sleek Aerodynamic Lifting Fuselage (Upper White Hull & Lower Thermal Heat Shield)
      const bodyGeom = new THREE.CylinderGeometry(0.065 * scale, 0.085 * scale, 0.72 * scale, 24);
      const bodyMesh = new THREE.Mesh(bodyGeom, whiteAeroMat);
      craft.add(bodyMesh);

      // Lower Heat Shield Underbelly Tile Strip
      const heatShieldGeom = new THREE.BoxGeometry(0.12 * scale, 0.68 * scale, 0.04 * scale);
      const heatShield = new THREE.Mesh(heatShieldGeom, thermalTileMat);
      heatShield.position.set(0, 0, -0.05 * scale);
      craft.add(heatShield);

      // Forward Nosecone & Observation Viewport
      const noseGeom = new THREE.ConeGeometry(0.065 * scale, 0.32 * scale, 24);
      const noseMesh = new THREE.Mesh(noseGeom, whiteAeroMat);
      noseMesh.position.y = 0.52 * scale;
      craft.add(noseMesh);

      // High-Tech Gold MLI Science Instrumentation Package
      const mliGeom = new THREE.BoxGeometry(0.11 * scale, 0.22 * scale, 0.09 * scale);
      const mliMesh = new THREE.Mesh(mliGeom, goldMliMat);
      mliMesh.position.set(0, 0.05 * scale, 0.02 * scale);
      craft.add(mliMesh);

      // 2. Twin Swept Orbital Delta Wings with Solar Collectors
      const wingGeom = new THREE.BoxGeometry(0.44 * scale, 0.14 * scale, 0.008 * scale);

      const leftWing = new THREE.Mesh(wingGeom, solarCellMat);
      leftWing.position.set(-0.30 * scale, -0.05 * scale, 0);
      leftWing.rotation.z = 0.12;
      craft.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeom, solarCellMat);
      rightWing.position.set(0.30 * scale, -0.05 * scale, 0);
      rightWing.rotation.z = -0.12;
      craft.add(rightWing);

      // Twin Wingtip Vertical Stabilizer Fins
      const finGeom = new THREE.BoxGeometry(0.006 * scale, 0.16 * scale, 0.07 * scale);
      const leftFin = new THREE.Mesh(finGeom, thermalTileMat);
      leftFin.position.set(-0.51 * scale, 0.02 * scale, 0);
      craft.add(leftFin);

      const rightFin = new THREE.Mesh(finGeom, thermalTileMat);
      rightFin.position.set(0.51 * scale, 0.02 * scale, 0);
      craft.add(rightFin);

      // 3. Stern Twin High-Expansion Vacuum Rocket Engine Bells
      const sternNozzleGeom = new THREE.CylinderGeometry(0.015 * scale, 0.035 * scale, 0.09 * scale, 18, 1, true);
      const nozzle1 = new THREE.Mesh(sternNozzleGeom, titaniumMat);
      nozzle1.position.set(-0.032 * scale, -0.40 * scale, 0);
      craft.add(nozzle1);

      const nozzle2 = new THREE.Mesh(sternNozzleGeom, titaniumMat);
      nozzle2.position.set(0.032 * scale, -0.40 * scale, 0);
      craft.add(nozzle2);

      // 4. Photorealistic Supersonic Rocket Flame Assembly
      const flameAssembly = createRocketFlameAssembly(scale, false);
      flameAssembly.flameGroup.position.y = -0.44 * scale;
      craft.add(flameAssembly.flameGroup);

      return {
        mesh: craft,
        flameAssembly,
        scale
      };
    }

    // =========================================================================
    // 10. SCENE INSTANTIATION & TRAJECTORIES
    // =========================================================================

    // Craft 1: Heavy Multi-Stage Orbital Launch Rocket
    const rocket1 = buildHeavyLaunchVehicle(1.15);
    scene.add(rocket1.mesh);

    // Craft 2: Sleek Orbital Science Cruiser
    const rocket2 = buildOrbitalScienceCruiser(0.95);
    scene.add(rocket2.mesh);

    // Subtle and calm exhaust particle systems
    const particleSystem1 = createPlumeParticleSystem(40);
    const particleSystem2 = createPlumeParticleSystem(30);

    // Trajectory Controllers
    let r1Progress = 0.05;
    let r2Progress = 0.55;

    function getRocket1Position(t) {
      // Orbital ascent curving gracefully across Earth's atmospheric limb
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

    // 11. Interactive Mouse Parallax
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    window.addEventListener('mousemove', (e) => {
      targetX = (e.clientX / width - 0.5) * 1.5;
      targetY = (e.clientY / height - 0.5) * 1.2;
    });

    // 12. Responsive Resizing
    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      planetGroup.position.set(width > 768 ? 2.2 : 0, width > 768 ? -0.4 : -1.8, -1.5);
    });

    // 13. High-Fidelity Physics Animation Loop
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
      // ROCKET FLIGHT & REALISTIC EXHAUST SIMULATION
      // =====================================================================

      // 1. Update Rocket 1 (Ascent Launcher)
      r1Progress += 0.0016;
      if (r1Progress > 1.05) r1Progress = 0.0;

      const p1 = getRocket1Position(r1Progress);
      const p1Next = getRocket1Position(r1Progress + 0.015);
      const dir1 = p1Next.clone().sub(p1).normalize();

      rocket1.mesh.position.copy(p1);
      // Orient rocket along its ascent velocity vector (tip forwards)
      rocket1.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir1);

      // Smooth, gentle flame breathing (calm, subtle, realistic)
      const flameScale1 = 1.0 + Math.sin(elapsedTime * 8.0) * 0.035;
      rocket1.flameAssembly.flameGroup.scale.set(1.0, flameScale1, 1.0);

      // Subtle shock diamond pulse
      rocket1.flameAssembly.diamondMeshes.forEach((d, idx) => {
        const pulse = 1.0 + Math.sin(elapsedTime * 6.0 + idx * 1.2) * 0.04;
        d.scale.set(pulse, pulse, pulse);
      });

      // Outer engine nozzle gentle shimmer
      rocket1.outerNozzleFlameCones.forEach((cone) => {
        const oPulse = 1.0 + Math.sin(elapsedTime * 10.0) * 0.04;
        cone.scale.set(1.0, oPulse, 1.0);
      });

      // Gentle optical throat bloom
      const bloomPulse1 = (0.20 * rocket1.scale) * (1.0 + Math.sin(elapsedTime * 5.0) * 0.03);
      rocket1.flameAssembly.bloomSprite.scale.set(bloomPulse1, bloomPulse1, 1.0);

      // Soft warm firelight
      rocket1.flameAssembly.engineLight.intensity = 1.0 + Math.sin(elapsedTime * 6.0) * 0.12;

      // Emit and update subtle exhaust trail from the engine cluster
      rocket1.mesh.updateMatrixWorld(true);
      const tailPos1 = rocket1.mesh.localToWorld(new THREE.Vector3(0, -0.88 * rocket1.scale, 0));
      particleSystem1.emit(tailPos1, dir1, rocket1.scale);
      particleSystem1.update();

      // 2. Update Rocket 2 (Orbital Science Cruiser)
      r2Progress += 0.0011;
      if (r2Progress > 1.05) r2Progress = 0.0;

      const p2 = getRocket2Position(r2Progress);
      const p2Next = getRocket2Position(r2Progress + 0.015);
      const dir2 = p2Next.clone().sub(p2).normalize();

      rocket2.mesh.position.copy(p2);
      rocket2.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir2);

      const flameScale2 = 1.0 + Math.sin(elapsedTime * 7.0) * 0.03;
      rocket2.flameAssembly.flameGroup.scale.set(1.0, flameScale2, 1.0);

      rocket2.flameAssembly.diamondMeshes.forEach((d, idx) => {
        const pulse = 1.0 + Math.sin(elapsedTime * 5.0 + idx * 1.2) * 0.04;
        d.scale.set(pulse, pulse, pulse);
      });

      const bloomPulse2 = (0.14 * rocket2.scale) * (1.0 + Math.sin(elapsedTime * 4.0) * 0.03);
      rocket2.flameAssembly.bloomSprite.scale.set(bloomPulse2, bloomPulse2, 1.0);

      rocket2.flameAssembly.engineLight.intensity = 0.65 + Math.cos(elapsedTime * 5.0) * 0.08;

      rocket2.mesh.updateMatrixWorld(true);
      const tailPos2 = rocket2.mesh.localToWorld(new THREE.Vector3(0, -0.44 * rocket2.scale, 0));
      particleSystem2.emit(tailPos2, dir2, rocket2.scale);
      particleSystem2.update();

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
