/**
 * TerraTwin - Page 3: Compare Sites Controller
 * Side-by-side benchmarking matrix, two permanent analytical panels,
 * and standardized 1-page PDF executive reporting engine.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await window.App.init('compare');

  const cellsData = await window.App.fetchData('cells');
  const targetsData = await window.App.fetchData('targets');

  if (!cellsData || !targetsData) {
    console.error('Data missing for Compare page');
    return;
  }

  SiteComparator.init(cellsData.cells, targetsData.targets);
});

const SiteComparator = {
  cells: [],
  targets: [],
  selectedTarget: null,
  siteA: null,
  siteB: null,

  init(cells, targets) {
    this.cells = cells;
    this.targets = targets;

    // Check URL parameters (e.g. ?siteA=cell-saudi-labbah&siteB=cell-lanzarote-corona)
    const urlParams = new URLSearchParams(window.location.search);
    const paramSiteA = urlParams.get('siteA');
    const paramSiteB = urlParams.get('siteB');
    const paramTarget = urlParams.get('target');

    this.selectedTarget = this.targets.find(t => t.id === paramTarget) || this.targets[0];
    this.siteA = this.cells.find(c => c.id === paramSiteA) || this.cells[0]; // Established default
    this.siteB = this.cells.find(c => c.id === paramSiteB) || this.cells.find(c => c.is_candidate) || this.cells[1];

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

  populateSelectors() {
    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    // Target Selector
    const targetSelect = document.getElementById('selectTarget');
    if (targetSelect) {
      targetSelect.innerHTML = this.targets.map(t => `
        <option value="${t.id}" ${t.id === this.selectedTarget.id ? 'selected' : ''}>
          ${isAr ? t.name_ar : t.name} (${t.body.toUpperCase()})
        </option>
      `).join('');
    }

    // Site A Selector (Established Analogs)
    const siteASelect = document.getElementById('selectSiteA');
    if (siteASelect) {
      siteASelect.innerHTML = this.cells.map(c => `
        <option value="${c.id}" ${c.id === this.siteA.id ? 'selected' : ''}>
          ${c.is_candidate ? '★ ' : '● '}${isAr ? c.name_ar : c.name} (${isAr ? c.country_ar : c.country})
        </option>
      `).join('');
    }

    // Site B Selector (Candidates / Comparisons)
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

    // Render Head-to-Head Cards
    const siteANameEl = document.getElementById('headSiteAName');
    const siteAScoreEl = document.getElementById('headSiteAScore');
    const siteABadgeEl = document.getElementById('headSiteABadge');

    if (siteANameEl) siteANameEl.textContent = isAr ? this.siteA.name_ar : this.siteA.name;
    if (siteAScoreEl) siteAScoreEl.textContent = `${scoreA.toFixed(1)}%`;
    if (siteABadgeEl) {
      siteABadgeEl.textContent = this.siteA.is_candidate 
        ? (isAr ? '★ مرشح جديد' : '★ Candidate Site') 
        : (isAr ? '● موقع معياري تاريخي' : '● Benchmark Historic');
      siteABadgeEl.className = this.siteA.is_candidate ? 'sci-badge candidate' : 'sci-badge validated';
    }

    const siteBNameEl = document.getElementById('headSiteBName');
    const siteBScoreEl = document.getElementById('headSiteBScore');
    const siteBBadgeEl = document.getElementById('headSiteBBadge');

    if (siteBNameEl) siteBNameEl.textContent = isAr ? this.siteB.name_ar : this.siteB.name;
    if (siteBScoreEl) siteBScoreEl.textContent = `${scoreB.toFixed(1)}%`;
    if (siteBBadgeEl) {
      siteBBadgeEl.textContent = this.siteB.is_candidate 
        ? (isAr ? '★ مرشح جديد' : '★ Candidate Site') 
        : (isAr ? '● موقع معياري تاريخي' : '● Benchmark Historic');
      siteBBadgeEl.className = this.siteB.is_candidate ? 'sci-badge candidate' : 'sci-badge validated';
    }

    // Render Two Permanent Analytical Panels
    this.renderPermanentAnalyticalPanels(isAr);

    // Render Physical Parameters Matrix Table
    this.renderMatrixTable(isAr);

    // Update Print Metadata
    this.updatePrintMetadata(scoreA, scoreB, isAr);
  },

  renderPermanentAnalyticalPanels(isAr) {
    // 1. "What Earth Cannot Simulate" (Rigid physical divergences)
    const cannotSimulateList = document.getElementById('cannotSimulatePointsList');
    if (cannotSimulateList) {
      cannotSimulateList.innerHTML = `
        <div class="analytical-point-item">
          <div class="point-icon">G</div>
          <div class="point-content">
            <div class="point-title">${isAr ? 'الجاذبية الكوكبية المنخفضة (0.16G للقمر / 0.38G للمريخ)' : 'Low Planetary Gravity (0.16G Moon / 0.38G Mars)'}</div>
            <div class="point-desc">${isAr ? 'لا يمكن للأرض محاكاة انزلاق العجلات وتطاير الغبار في بيئة الجاذبية المخفضة؛ يتطلب الاختبار الأرضي تعليق الثقل أو نمذجة حاسوبية.' : 'Terrestrial 1.0G alters rover wheel traction and slip dynamics; low-gravity wheel sinkage requires counterweight cranes.'}</div>
          </div>
        </div>
        <div class="analytical-point-item">
          <div class="point-icon">R</div>
          <div class="point-content">
            <div class="point-title">${isAr ? 'الإشعاع الكوني والجسيمات الشمسية عالية الطاقة' : 'Deep Space Galactic Cosmic Radiation'}</div>
            <div class="point-desc">${isAr ? 'يحجب الغلاف الجوي والمجال المغناطيسي للأرض معظم الأشعة الكونية (1.3 مليسيفيرت/يوم على القمر)، مما يمنع اختبار التلف الإشعاعي للرقائق في الميدان.' : 'Earth magnetosphere shields against 1.3 mSv/day lunar surface flux; radiation hardening must be tested in particle accelerators.'}</div>
          </div>
        </div>
        <div class="analytical-point-item">
          <div class="point-icon">P</div>
          <div class="point-content">
            <div class="point-title">${isAr ? 'الفراغ التام وتطاير الغازات السطحية (<1e-12 تور)' : 'Ultra-High Vacuum & Volatiles Outgassing'}</div>
            <div class="point-desc">${isAr ? 'الضغط الجوي الأرضي (1013 مليبار) يمنع التسامي المباشر للجليد المائي وظاهرة اللحام البارد للمعادن العارية في الفضاء.' : 'Ambient terrestrial pressure prevents instant ice sublimation and cold-welding of unlubricated rover actuator joints.'}</div>
          </div>
        </div>
        <div class="analytical-point-item">
          <div class="point-icon">C</div>
          <div class="point-content">
            <div class="point-title">${isAr ? 'البيولوجيا الأرضية والبصمات الحيوية الأصيلة' : 'Pervasive Organic Biosignatures & Bio-Contamination'}</div>
            <div class="point-desc">${isAr ? 'حتى في أشد صحاري الأرض جفافاً، توجد ميكروبات أرضية تعيق تجارب الكشف عن الحياة المريخية دون تعقيم فائق.' : 'Endemic terrestrial extremophiles interfere with life-detection instruments unless strict clean-room protocols are deployed.'}</div>
          </div>
        </div>
      `;
    }

    // 2. "What Can Be Tested Here" (Mission-specific validity based on selected profile)
    const activeProfile = window.MissionProfileManager ? window.MissionProfileManager.activeProfile : 'rover';
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
              <div class="point-title">${isAr ? 'الملاحة تحت السطحية بدون نظام GPS (LiDAR SLAM)' : 'Subterranean GPS-Denied LiDAR SLAM Navigation'}</div>
              <div class="point-desc">${isAr ? 'بناء خرائط ثلاثية الأبعاد لحظية داخل أنفاق الحمم المتصلة بدون اتصال فضائي.' : 'Validating real-time 3D point cloud mapping and autonomous pathfinding in total subterranean optical blackout.'}</div>
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
              <div class="point-title">${isAr ? 'استخلاص الأملاح والمعادن المتبخرة موضيعاً' : 'Evaporite Salt Concentration & In-Situ Refining'}</div>
              <div class="point-desc">${isAr ? 'تقييم مفاعلات الاستخلاص الكيميائي لأملاح الكبريتات والهاليت في المسطحات الملحية.' : 'Benchmarking chemical leaching beds for sulfate and chloride separation in high-altitude salt flats.'}</div>
            </div>
          </div>
        `;
      } else {
        // Rover & Base Default
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

  renderMatrixTable(isAr) {
    const tableBody = document.getElementById('compareMatrixTableBody');
    if (!tableBody) return;

    const mA = this.siteA.physical_metrics || { slope_deg: 5.0, grain_size_microns: 200, bulk_density_g_cm3: 1.6, thermal_inertia_si: 300, dielectric_constant: 3.5, hydration_index: 0.5 };
    const mB = this.siteB.physical_metrics || { slope_deg: 12.0, grain_size_microns: 750, bulk_density_g_cm3: 2.6, thermal_inertia_si: 550, dielectric_constant: 6.5, hydration_index: 1.2 };

    // Baseline target physical metrics
    const mT = {
      slope_deg: this.selectedTarget.body === 'mars' ? 7.5 : 15.0,
      grain_size_microns: this.selectedTarget.body === 'mars' ? 180 : 70,
      bulk_density_g_cm3: this.selectedTarget.body === 'mars' ? 1.65 : 1.70,
      thermal_inertia_si: this.selectedTarget.body === 'mars' ? 320 : 50,
      dielectric_constant: this.selectedTarget.body === 'mars' ? 3.8 : 2.8,
      hydration_index: this.selectedTarget.body === 'mars' ? 1.5 : 0.1
    };

    const properties = [
      { key: 'slope_deg', label: 'Topographic Slope', label_ar: 'الانحدار الطبوغرافي', unit: 'deg (°)' },
      { key: 'grain_size_microns', label: 'Regolith Grain Size', label_ar: 'حجم حبيبات الحطام', unit: 'microns (μm)' },
      { key: 'bulk_density_g_cm3', label: 'Soil Bulk Density', label_ar: 'الكثافة الظاهرية للتربة', unit: 'g/cm³' },
      { key: 'thermal_inertia_si', label: 'Thermal Inertia', label_ar: 'القصور الذاتي الحراري', unit: 'J·m⁻²·K⁻¹·s⁻½' },
      { key: 'dielectric_constant', label: 'Dielectric Permittivity (εr)', label_ar: 'ثابت العزل الكهربائي (εr)', unit: 'dimensionless' },
      { key: 'hydration_index', label: 'Water Equivalent Hydrogen (WEH)', label_ar: 'محتوى الهيدروجين المكافئ للماء', unit: 'wt%' }
    ];

    tableBody.innerHTML = properties.map(prop => {
      const valA = mA[prop.key];
      const valB = mB[prop.key];
      const valT = mT[prop.key];

      // Normalized divergence calculation
      const deltaA = Math.abs(valA - valT) / (valT || 1.0);
      const deltaB = Math.abs(valB - valT) / (valT || 1.0);

      const deltaBadgeClassA = deltaA < 0.25 ? 'match-good' : deltaA < 0.6 ? 'match-moderate' : 'match-divergent';
      const deltaBadgeClassB = deltaB < 0.25 ? 'match-good' : deltaB < 0.6 ? 'match-moderate' : 'match-divergent';

      return `
        <tr>
          <td>
            <div class="metric-prop-name">${isAr ? prop.label_ar : prop.label}</div>
            <span class="metric-prop-unit">${prop.unit}</span>
          </td>
          <td>
            <div class="metric-val-num">${valA}</div>
            <span class="delta-badge ${deltaBadgeClassA}">Δ ${(deltaA * 100).toFixed(0)}%</span>
          </td>
          <td>
            <div class="metric-val-num" style="color:var(--accent-mars);">${valT}</div>
          </td>
          <td>
            <div class="metric-val-num">${valB}</div>
            <span class="delta-badge ${deltaBadgeClassB}">Δ ${(deltaB * 100).toFixed(0)}%</span>
          </td>
        </tr>
      `;
    }).join('');
  },

  updatePrintMetadata(scoreA, scoreB, isAr) {
    const printMetaEl = document.getElementById('printMetaDetails');
    if (printMetaEl) {
      const now = new Date().toISOString().split('T')[0];
      const targetName = isAr ? this.selectedTarget.name_ar : this.selectedTarget.name;
      const siteAName = isAr ? this.siteA.name_ar : this.siteA.name;
      const siteBName = isAr ? this.siteB.name_ar : this.siteB.name;

      printMetaEl.innerHTML = `
        <strong>TERRATWIN EXECUTIVE BENCHMARK REPORT</strong> • Date: ${now} • Target: ${targetName} (${this.selectedTarget.body.toUpperCase()})<br>
        Benchmark Site A: ${siteAName} (${scoreA.toFixed(1)}%) | Comparison Site B: ${siteBName} (${scoreB.toFixed(1)}%)
      `;
    }
  },

  bindEvents() {
    const targetSelect = document.getElementById('selectTarget');
    if (targetSelect) {
      targetSelect.addEventListener('change', (e) => {
        this.selectedTarget = this.targets.find(t => t.id === e.target.value) || this.targets[0];
        this.renderComparison();
        if (window.UserSystem) {
          window.UserSystem.recordComparison();
          window.UserSystem.addXP(20, 'Recalibrated baseline target', 'إعادة معايرة الجرم الكوكبي الأساسي');
        }
      });
    }

    const siteASelect = document.getElementById('selectSiteA');
    if (siteASelect) {
      siteASelect.addEventListener('change', (e) => {
        this.siteA = this.cells.find(c => c.id === e.target.value) || this.cells[0];
        this.renderComparison();
        if (window.UserSystem) {
          window.UserSystem.recordComparison();
          window.UserSystem.addXP(25, 'Benchmarked analog site matrix', 'تحليل مقارنة موقع تناظري');
        }
      });
    }

    const siteBSelect = document.getElementById('selectSiteB');
    if (siteBSelect) {
      siteBSelect.addEventListener('change', (e) => {
        this.siteB = this.cells.find(c => c.id === e.target.value) || this.cells[1];
        this.renderComparison();
        if (window.UserSystem) {
          window.UserSystem.recordComparison();
          window.UserSystem.addXP(25, 'Benchmarked analog candidate site', 'تحليل مقارنة موقع مرشح جديد');
        }
      });
    }

    const exportBtn = document.getElementById('btnExportReportPdf');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (window.UserSystem) {
          window.UserSystem.addXP(40, 'Exported Executive Planetary Brief (PDF)', 'تصدير وثيقة تقرير المقارنة الكوكبية');
        }
        window.print();
      });
    }
  }
};

window.SiteComparator = SiteComparator;
