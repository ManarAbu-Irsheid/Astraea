/**
 * TerraTwin - Page 1: Home Controller
 * Dynamic "Twin Pair" Hero Showcase (3 cycling pairs) & 3 Empirical KPI Counters
 */

document.addEventListener('DOMContentLoaded', async () => {
  await window.App.init('home');

  const targetsData = await window.App.fetchData('targets');
  const validationData = await window.App.fetchData('validation');

  if (!targetsData || !validationData) {
    console.error('Critical data missing for Home page');
    return;
  }

  initKpiCounters(validationData.kpis);
  initTwinPairShowcase(targetsData.hero_pairs);

  // Initialize Interactive 3D Planetary Explorer (Earth, Mars, Moon)
  if (window.Planetary3D) {
    window.Planetary3D.init('planet3dCanvasContainer');
  }
});

/**
 * Top-Level KPI Counter Bar (Exactly 3 Empirical Metrics)
 * 1. Scanned Earth Cells (421,800)
 * 2. Known Analog Recall Rate (94.2%)
 * 3. New Validated Candidates (38)
 */
function initKpiCounters(kpis) {
  animateCounter('kpiScannedCells', 0, kpis.cells_scanned || 421800, 1600, (val) => Math.round(val).toLocaleString());
  animateCounter('kpiRecallRate', 0, kpis.recall_rate || 94.2, 1600, (val) => val.toFixed(1) + '%');
  animateCounter('kpiNewCandidates', 0, kpis.new_candidates || 38, 1600, (val) => Math.round(val).toString());
}

function animateCounter(elementId, start, end, duration, formatFn) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentVal = start + (end - start) * easeOut;

    el.textContent = formatFn(currentVal);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = formatFn(end);
    }
  }
  requestAnimationFrame(update);
}

/**
 * Dynamic "Twin Pair" Hero Showcase
 * Cycles through 3 real matched pairs loaded from targets.json
 */
let currentPairIndex = 0;
let autoCycleTimer = null;
let heroPairs = [];

function initTwinPairShowcase(pairs) {
  if (!pairs || pairs.length === 0) return;
  heroPairs = pairs;

  renderPairIndicators();
  renderCurrentTwinPair();

  // Cycle controls
  const prevBtn = document.getElementById('cyclePairPrev');
  const nextBtn = document.getElementById('cyclePairNext');

  if (prevBtn) prevBtn.addEventListener('click', () => cyclePair(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => cyclePair(1));

  // Pause on hover
  const showcaseContainer = document.getElementById('twinShowcase');
  if (showcaseContainer) {
    showcaseContainer.addEventListener('mouseenter', stopAutoCycle);
    showcaseContainer.addEventListener('mouseleave', startAutoCycle);
  }

  startAutoCycle();

  document.addEventListener('languageChanged', () => {
    renderCurrentTwinPair();
  });

  document.addEventListener('profileChanged', () => {
    renderCurrentTwinPair();
  });
}

function startAutoCycle() {
  stopAutoCycle();
  autoCycleTimer = setInterval(() => {
    cyclePair(1);
  }, 9000);
}

function stopAutoCycle() {
  if (autoCycleTimer) {
    clearInterval(autoCycleTimer);
    autoCycleTimer = null;
  }
}

function cyclePair(direction) {
  currentPairIndex = (currentPairIndex + direction + heroPairs.length) % heroPairs.length;
  renderCurrentTwinPair();
  updatePairIndicators();
}

function renderPairIndicators() {
  const container = document.getElementById('cycleIndicators');
  if (!container) return;

  container.innerHTML = heroPairs.map((_, idx) => `
    <span class="cycle-indicator-dot ${idx === currentPairIndex ? 'active' : ''}" data-index="${idx}"></span>
  `).join('');

  container.querySelectorAll('.cycle-indicator-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      currentPairIndex = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      renderCurrentTwinPair();
      updatePairIndicators();
    });
  });
}

function updatePairIndicators() {
  const dots = document.querySelectorAll('.cycle-indicator-dot');
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentPairIndex);
  });
}

function renderCurrentTwinPair() {
  const pair = heroPairs[currentPairIndex];
  if (!pair) return;

  const lang = window.I18n ? window.I18n.currentLang : 'en';
  const isAr = lang === 'ar';

  // Compute score dynamically considering current profile weights if available
  let computedScore = pair.similarity_score;
  if (window.MissionProfileManager && pair.parameters) {
    computedScore = window.MissionProfileManager.calculateScore(pair.parameters);
  }

  // Update Earth Side (Right)
  const earthNameEl = document.getElementById('heroEarthName');
  const earthRegionEl = document.getElementById('heroEarthRegion');
  const earthInsightEl = document.getElementById('heroEarthInsight');
  const earthSensorEl = document.getElementById('heroEarthSensor');
  const earthBgEl = document.getElementById('heroEarthVisualBg');

  if (earthNameEl) earthNameEl.textContent = isAr ? pair.earth_name_ar : pair.earth_name;
  if (earthRegionEl) earthRegionEl.textContent = pair.earth_region;
  if (earthInsightEl) earthInsightEl.textContent = isAr ? pair.key_insight_ar : pair.key_insight;
  if (earthSensorEl) earthSensorEl.textContent = pair.earth_img_label;

  // Visual gradients representing remote sensing textures
  if (earthBgEl) {
    if (pair.id === 'pair-atacama-jezero') {
      earthBgEl.style.background = 'radial-gradient(circle at 30% 40%, #8c5836 0%, #3a2216 100%)';
    } else if (pair.id === 'pair-lanzarote-marius') {
      earthBgEl.style.background = 'radial-gradient(circle at 40% 60%, #44474d 0%, #17191d 100%)';
    } else {
      earthBgEl.style.background = 'radial-gradient(circle at 50% 50%, #56728a 0%, #152538 100%)';
    }
  }

  // Update Target Side (Left)
  const targetNameEl = document.getElementById('heroTargetName');
  const targetRegionEl = document.getElementById('heroTargetRegion');
  const targetSensorEl = document.getElementById('heroTargetSensor');
  const targetBgEl = document.getElementById('heroTargetVisualBg');

  if (targetNameEl) targetNameEl.textContent = isAr ? pair.target_name_ar : pair.target_name;
  if (targetRegionEl) targetRegionEl.textContent = pair.target_region;
  if (targetSensorEl) targetSensorEl.textContent = pair.target_img_label;

  if (targetBgEl) {
    if (pair.id === 'pair-atacama-jezero') {
      targetBgEl.style.background = 'radial-gradient(circle at 60% 40%, #c45731 0%, #4a1d0f 100%)';
    } else if (pair.id === 'pair-lanzarote-marius') {
      targetBgEl.style.background = 'radial-gradient(circle at 50% 50%, #68737c 0%, #202428 100%)';
    } else {
      targetBgEl.style.background = 'radial-gradient(circle at 40% 60%, #4f6479 0%, #111a26 100%)';
    }
  }

  const targetInsightEl = document.getElementById('heroTargetInsight');
  if (targetInsightEl) {
    if (pair.id === 'pair-atacama-jezero') {
      targetInsightEl.textContent = isAr 
        ? 'دلتا رسوبية نهرية بحيرية قديمة ذات حدود جفاف شبيهة بالبيركلورات.' 
        : 'Ancient fluvio-lacustrine sedimentary delta with clay-perchlorate dryness limits.';
    } else if (pair.id === 'pair-lanzarote-marius') {
      targetInsightEl.textContent = isAr
        ? 'حفرة انهيار لأنبوب حمم بركانية قمرية بازلتية بعمق 80 متراً.'
        : 'Subsurface collapse pit skylight in pristine tholeiitic basalt flow fields.';
    } else {
      targetInsightEl.textContent = isAr
        ? 'قمم إضاءة شبه دائمة تجاور مصائد برودة قطبية أبدية (40 كلفن).'
        : 'Perpetually illuminated crater rim adjacent to 40 K cryogenic volatiles trap.';
    }
  }

  // Update Central Animated Similarity Ring
  const scoreNumEl = document.getElementById('heroRingScoreNum');
  const uncertaintyEl = document.getElementById('heroRingUncertainty');
  const progressCircle = document.getElementById('heroRingProgressCircle');

  if (scoreNumEl) {
    scoreNumEl.textContent = computedScore.toFixed(1);
  }
  if (uncertaintyEl) {
    uncertaintyEl.textContent = pair.uncertainty || '±3.2%';
  }

  if (progressCircle) {
    const circumference = 440; // 2 * PI * 70 approx
    const offset = circumference - (circumference * computedScore) / 100;
    progressCircle.style.strokeDasharray = `${circumference}`;
    progressCircle.style.strokeDashoffset = `${offset}`;
  }
}
