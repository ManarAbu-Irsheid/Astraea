/**
 * TerraTwin - Interactive 3-Step Guided Tour (Spotlight Engine)
 * Automatic first-time trigger with storage suppression & manual re-trigger.
 * Exact 3 points per page with bidirectional LTR/RTL support.
 */

const GuidedTour = {
  currentPage: 'home',
  currentStepIndex: 0,
  steps: [],

  tourDefinitions: {
    home: [
      {
        target: '#twinRingSpotlight',
        title_en: '1. Twin Pair Ring',
        title_ar: '1. حلقة الزوج الشبيه',
        body_en: 'Displays real Earth analog sites paired against Moon or Mars targets with calculated physical similarity percentages.',
        body_ar: 'تعرض مواقع أرضية حقيقية مطابقة لأهداف على القمر أو المريخ مع حساب نسبة التشابه الفيزيائي الدقيقة.'
      },
      {
        target: '#kpiBarSpotlight',
        title_en: '2. Three Metric Counters',
        title_ar: '2. عدادات المؤشرات الثلاثة',
        body_en: 'Verified empirical numbers from actual pipeline runs: scanned cells, known analog recall rate, and newly validated candidates.',
        body_ar: 'أرقام تجريبية معتمدة من مسار التحليل الفعلي: الخلايا الممسوحة، ومعدل استرجاع المواقع المعروفة، والمرشحون الجدد.'
      },
      {
        target: '#headerControlsSpotlight',
        title_en: '3. Getting Started',
        title_ar: '3. البدء والتحكم',
        body_en: 'Use the top Mission Profile selector, internal weight sliders, page navigation, and contextual AI assistant at bottom-right.',
        body_ar: 'استخدم محدد ملف المهمة في الأعلى، ومزلجات الأوزان، والتنقل بين الصفحات، ومساعد الذكاء الاصطناعي أسفل اليمين.'
      }
    ],
    finder: [
      {
        target: '#finderCriteriaSpotlight',
        title_en: '1. Criteria',
        title_ar: '1. المعايير',
        body_en: 'Choose the target (Moon or Mars) and a reference site, then the mission profile from the menu at the top. The map recolours by similarity.',
        body_ar: 'اختر الهدف (قمر أو مريخ) والمكان المرجعي، ثم البروفايل من القائمة في الأعلى، والخريطة تتلوّن حسب التشابه.'
      },
      {
        target: '#finderMapSpotlight',
        title_en: '2. The Map',
        title_ar: '2. الخريطة',
        body_en: 'A circle is a known site and a golden star is a new candidate. Turn on "New Candidates Only" to see the discoveries only.',
        body_ar: 'الدائرة موقع معروف، والنجمة الذهبية مرشّح جديد. فعّل «المرشحون الجدد فقط» لتشوف الاكتشافات فقط.'
      },
      {
        target: '#finderDetailSpotlight',
        title_en: '3. Site Card & Compare',
        title_ar: '3. البطاقة والمقارنة',
        body_en: 'Tap any point to open its card. From there, the "Compare" button takes you to the Compare page.',
        body_ar: 'اضغط على أي نقطة لتفتح بطاقتها، ومنها زر «Compare» ينقلك لصفحة المقارنة.'
      }
    ],
    compare: [
      {
        target: '#comparePanelsSpotlight',
        title_en: '1. Dual Scientific Panels',
        title_ar: '1. اللوحتان التحليليتان الدائمتان',
        body_en: 'Examine "What Earth Cannot Simulate" (hard gravitational & radiation limits) vs "What Can Be Tested Here" (mobility, dust, drills).',
        body_ar: 'افحص ما تعجز الأرض عن محاكاته (قيود الجاذبية والإشعاع) مقابل ما يمكن اختباره هنا بدقة (العجلات، الغبار، الحفر).'
      },
      {
        target: '#compareHeadSpotlight',
        title_en: '2. Side-by-Side Evaluation',
        title_ar: '2. التقييم المقارن جنباً إلى جنب',
        body_en: 'Benchmark established historical analogs directly against newly discovered candidate sites using real multi-sensor metrics.',
        body_ar: 'قارن المواقع التاريخية المعتمدة وجهاً لوجه مع المواقع المرشحة المكتشفة حديثاً باستخدام قياسات الأقمار الاصطناعية.'
      },
      {
        target: '#compareExportSpotlight',
        title_en: '3. Export Engine',
        title_ar: '3. محرك تصدير التقارير',
        body_en: 'Generate a clean, standardized 1-page PDF executive brief formatted specifically for space agency review committees.',
        body_ar: 'أنشئ ملخصاً تنفيذياً معياريّاً في صفحة واحدة بصيغة PDF مهيأ لطباعة لجان وكالات الفضاء.'
      }
    ],
    evidence: [
      {
        target: '#evidenceVideoSpotlight',
        title_en: '1. Demo Video',
        title_ar: '1. العرض التوضيحي المرئي',
        body_en: 'A concise 2.5-minute technical overview of the multi-spectral raster pipeline and analog matching methodology.',
        body_ar: 'شرح تقني مكثف مدته دقيقتان ونصف لمسار معالجة البيانات النقطية متعددة الأطياف ومنهجية المطابقة.'
      },
      {
        target: '#evidenceDashboardSpotlight',
        title_en: '2. Data & Validation Grid',
        title_ar: '2. لوحة البيانات والتحقق',
        body_en: 'Explore empirical rankings, physical failure-case annotations, weight perturbation sensitivity, and the open data catalog.',
        body_ar: 'استكشف الترتيب المعياري، وحالات الفشل المدروسة فيزيائياً، وحساسية تغيير الأوزان، وكتالوج البيانات المفتوحة.'
      },
      {
        target: '#evidenceRoadmapSpotlight',
        title_en: '3. Strategic Roadmap',
        title_ar: '3. خارطة الطريق الاستراتيجية',
        body_en: 'Review the development trajectory towards field robotics integration, automated weight learning, and collaborative agency cloud.',
        body_ar: 'اطلع على مسار التطوير نحو دمج القياسات الميدانية للروبوتات، والتعلم الذاتي للأوزان، وسحابة وكالات الفضاء التعاونية.'
      }
    ]
  },

  init(pageName) {
    this.currentPage = pageName;
    this.steps = this.tourDefinitions[pageName] || [];
    this.bindEvents();

    // Check if dismissed previously
    const dismissed = localStorage.getItem('terratwin_tour_dismissed_' + pageName);
    if (!dismissed) {
      setTimeout(() => this.startTour(), 700);
    }
  },

  startTour() {
    if (!this.steps || this.steps.length === 0) return;
    this.currentStepIndex = 0;
    this.showOverlay();
    this.renderStep(this.currentStepIndex);
  },

  showOverlay() {
    let overlay = document.getElementById('tourOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'tourOverlay';
      overlay.className = 'tour-overlay';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('active');
  },

  hideOverlay() {
    document.dispatchEvent(new CustomEvent('tourEnded', { detail: { page: this.currentPage } }));
    const overlay = document.getElementById('tourOverlay');
    if (overlay) overlay.classList.remove('active');
    this.clearHighlight();
    const card = document.getElementById('tourCard');
    if (card) card.classList.remove('show');
  },

  clearHighlight() {
    document.querySelectorAll('.tour-highlighted').forEach(el => {
      el.classList.remove('tour-highlighted');
    });
  },

  renderStep(index) {
    this.clearHighlight();
    const step = this.steps[index];
    if (!step) return this.finishTour();

    const targetEl = document.querySelector(step.target);
    if (!targetEl) {
      console.warn('Tour target element not found:', step.target);
      return this.nextStep();
    }

    // Let the page react (e.g. Site Finder opens a mobile bottom sheet)
    document.dispatchEvent(new CustomEvent('tourStepChange', {
      detail: { page: this.currentPage, index, target: step.target }
    }));

    targetEl.classList.add('tour-highlighted');
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    let card = document.getElementById('tourCard');
    if (!card) {
      card = document.createElement('div');
      card.id = 'tourCard';
      card.className = 'tour-card';
      document.body.appendChild(card);
    }

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';
    const title = isAr ? step.title_ar : step.title_en;
    const body = isAr ? step.body_ar : step.body_en;

    const total = this.steps.length;
    const stepCountText = isAr ? `خطوة ${index + 1} من ${total}` : `Step ${index + 1} of ${total}`;
    const nextText = index === total - 1 ? (isAr ? 'إنهاء' : 'Got It') : (isAr ? 'التالي' : 'Next');
    const backText = isAr ? 'السابق' : 'Back';
    const skipText = isAr ? 'تخطي' : 'Skip Tour';

    card.innerHTML = `
      <div class="tour-step-badge">${stepCountText}</div>
      <div class="tour-card-title">${title}</div>
      <div class="tour-card-body">${body}</div>
      <div class="tour-card-actions">
        <button class="tour-btn-skip" id="tourSkipBtn">${skipText}</button>
        <div class="tour-nav-btns">
          ${index > 0 ? `<button class="tour-btn-back" id="tourBackBtn">${backText}</button>` : ''}
          <button class="tour-btn-next" id="tourNextBtn">${nextText}</button>
        </div>
      </div>
    `;

    // Position tooltip card (wait a moment on mobile so sheets finish sliding)
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const placeCard = () => {
      const rect = targetEl.getBoundingClientRect();
      const cardWidth = Math.min(320, window.innerWidth - 32);
      const cardHeight = card.offsetHeight || 200;
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;
      const gap = 12;
      let top, left;

      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;
      const isTall = rect.height > window.innerHeight * 0.55;

      if (isTall && !isMobile && (spaceRight > cardWidth + 24 || spaceLeft > cardWidth + 24)) {
        // Tall element (side panels): put the card beside it
        left = spaceRight > cardWidth + 24 ? rect.right + gap : rect.left - cardWidth - gap;
        top = Math.max(rect.top, 16) + scrollY;
      } else if (rect.bottom + gap + cardHeight < window.innerHeight) {
        // Room below
        top = rect.bottom + scrollY + gap;
        left = rect.left + scrollX + (rect.width / 2) - (cardWidth / 2);
      } else if (rect.top - gap - cardHeight > 0) {
        // Room above
        top = rect.top + scrollY - cardHeight - gap;
        left = rect.left + scrollX + (rect.width / 2) - (cardWidth / 2);
      } else {
        // No room: pin to the top of the screen
        top = scrollY + 16;
        left = rect.left + scrollX + (rect.width / 2) - (cardWidth / 2);
      }

      // Keep card inside the screen
      left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16));
      top = Math.max(scrollY + 16, top);

      card.style.width = `${cardWidth}px`;
      card.style.top = `${top}px`;
      card.style.left = `${left}px`;
    };

    card.classList.add('show');
    placeCard();
    if (isMobile) setTimeout(placeCard, 350);

    // Bind card buttons
    document.getElementById('tourSkipBtn')?.addEventListener('click', () => this.dismissTour());
    document.getElementById('tourNextBtn')?.addEventListener('click', () => this.nextStep());
    document.getElementById('tourBackBtn')?.addEventListener('click', () => this.prevStep());
  },

  nextStep() {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.renderStep(this.currentStepIndex);
    } else {
      this.finishTour();
    }
  },

  prevStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.renderStep(this.currentStepIndex);
    }
  },

  dismissTour() {
    localStorage.setItem('terratwin_tour_dismissed_' + this.currentPage, 'true');
    this.hideOverlay();
  },

  finishTour() {
    localStorage.setItem('terratwin_tour_dismissed_' + this.currentPage, 'true');
    this.hideOverlay();
  },

  bindEvents() {
    const tourTriggerBtn = document.getElementById('tourGuideBtn');
    if (tourTriggerBtn) {
      tourTriggerBtn.addEventListener('click', () => this.startTour());
    }
    const overlay = document.getElementById('tourOverlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.dismissTour());
    }
  }
};

window.GuidedTour = GuidedTour;
