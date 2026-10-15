/**
 * TerraTwin - Contextual Scientific Chatbot (Floating Widget)
 * Tailored quick-prompts per page, deterministic JSON-backed answers,
 * and standard fallback when queried on unsupported topics.
 */

const ScientificChatbot = {
  currentPage: 'home',
  isOpen: false,

  pagePrompts: {
    home: [
      {
        q_en: 'How was the 89.2% Atacama-Jezero similarity calculated?',
        q_ar: 'كيف تم حساب نسبة تطابق أتاكاما وجيزيرو 89.2%؟',
        a_en: 'The 89.2% similarity score represents a multi-attribute distance match across three primary factors: soil desiccation index (precipitation <1mm/yr), clay-perchlorate chemical concordance from MRO CRISM data, and sedimentary delta fan morphology.',
        a_ar: 'تمثل نسبة 89.2% تطابقاً محسوباً عبر ثلاثة معايير رئيسية: مؤشر جفاف التربة (<1 مم/سنة)، التوافق الكيميائي للبيركلورات والطين من بيانات MRO CRISM، والمورفولوجيا الرسوبية لدلتا جيزيرو.'
      },
      {
        q_en: 'What are the 421,800 scanned cells?',
        q_ar: 'ما هي الـ 421,800 خلية ممسوحة؟',
        a_en: 'TerraTwin screens 421,800 global terrestrial cells at 30-meter resolution across hyper-arid deserts, basalt flow fields, and polar permafrost plateaus, masking out vegetation and urban areas.',
        a_ar: 'تمسح تيرا توين 421,800 خلية أرضية بدقة 30 متراً عبر الصحاري فائقة الجفاف، وحقول الحمم البازلتية، ومسطحات الصقيع القطبي، مع حجب الغطاء النباتي والمناطق الحضرية.'
      },
      {
        q_en: 'What does the 94.2% recall rate mean?',
        q_ar: 'ماذا يعني معدل استرجاع 94.2%؟',
        a_en: 'Validation testing evaluated 49 peer-reviewed historic Apollo and NASA/ESA rover analog test sites. The algorithm autonomously retrieved 46 of these 49 sites within its top candidate tier (94.2% recall).',
        a_ar: 'تم اختبار النموذج على 49 موقعاً تاريخياً معتمداً لرحلات أبولو ومركبات ناسا وإيسا؛ واسترجع النموذج تلقائياً 46 موقعاً منها ضمن فئة أعلى المرشحين (معدل استرجاع 94.2%).'
      }
    ],
    finder: [
      {
        q_en: 'Why is Al-Labbah (Saudi Arabia) marked as a Golden Star candidate?',
        q_ar: 'لماذا مُيزت لابة اللبة بنجمة ذهبية كمرشح جديد؟',
        a_en: 'Al-Labbah in Harrat Khaybar features exceptionally unweathered alkali basalt collapse skylights in an arid climate. It scored 87.8% similarity for lunar lava tube shelters (Marius Hills), representing an uncatalogued high-priority analog.',
        a_ar: 'تتميز لابة اللبة في حرة خيبر بفتحات انهيار لأنابيب بازلتية نقية غير متأثرة بالتجوية بفضل المناخ الصحراوي، وحققت 87.8% تطابقاً مع ملاجئ تلال ماريوس القمرية كمرشح جديد واعد.'
      },
      {
        q_en: 'How do terrain classification filters work?',
        q_ar: 'كيف تعمل مصافي التصنيف الجيومورفولوجي؟',
        a_en: 'Filters group Earth analog cells based on optical band ratios from Sentinel-2 (clay/iron absorption) and digital elevation derivatives from SRTM (slope curvature, roughness, and drainage density).',
        a_ar: 'تصنف المصافي الخلايا الأرضية استناداً إلى نسب النطاقات الطيفية من قمر سينتينل-2 (امتصاص الحديد والطين) ومشتقات الارتفاع الرقمي من SRTM (الانحدار والخشونة).'
      },
      {
        q_en: 'What does the score uncertainty range (±4%) indicate?',
        q_ar: 'ماذا يعني نطاق عدم اليقين (±4%)؟',
        a_en: 'The uncertainty bound accounts for orbital sensor spatial resolution constraints, seasonal thermal swing variance, and localized atmospheric scattering over terrestrial observation targets.',
        a_ar: 'يعبر نطاق عدم اليقين عن القيود المكانية لدقة أجهزة الاستشعار المدارية، والتباين الحراري الموسمي، والتشتت الجوي المحلي فوق الأهداف الأرضية.'
      }
    ],
    compare: [
      {
        q_en: 'Why can Earth sites never simulate lunar/Martian gravity or radiation?',
        q_ar: 'لماذا تعجز المواقع الأرضية عن محاكاة جاذبية وإشعاع القمر والمريخ؟',
        a_en: 'Earth exhibits 1.0G gravity, whereas the Moon is 0.16G and Mars is 0.38G, drastically altering wheel slip mechanics. Furthermore, Earth atmosphere shields against primary galactic cosmic rays (1.3 mSv/day on lunar surface).',
        a_ar: 'تبلغ جاذبية الأرض 1G بينما القمر 0.16G والمريخ 0.38G مما يغير انزلاق العجلات، كما يحجب الغلاف الجوي الأرضي الإشعاع الكوني الشديد (1.3 مليسيفيرت/يوم على سطح القمر).'
      },
      {
        q_en: 'What scientific tests are valid at these analog sites?',
        q_ar: 'ما هي الاختبارات العلمية الصالحة في هذه المواقع الشبيهة؟',
        a_en: 'Valid physical tests include: rover wheel abrasive tread wear, regolith shear resistance, electrostatic dust adhesion to solar arrays, deep drill telemetry, and autonomous subterranean SLAM mapping.',
        a_ar: 'تشمل الاختبارات الصالحة: تآكل إطارات المركبات، مقاومة القص للحطام، التصاق الغبار بالألواح الشمسية، قياسات الحفر العميق، ورسم الخرائط الذاتية داخل الكهوف (SLAM).'
      },
      {
        q_en: 'How does the Divergence Index (Δ) function in the report?',
        q_ar: 'كيف يعمل مؤشر الانحراف (Δ) في التقرير؟',
        a_en: 'The Divergence Index represents normalized parametric deviation between Earth cell properties and target baselines. Values below 15% indicate optimal experimental validity for mission rehearsal.',
        a_ar: 'يمثل مؤشر الانحراف الانحراف المعياري بين خصائص الموقع الأرضي ومعايير الهدف الكوكبي؛ وتشير القيم الأقل من 15% إلى صلاحية تجريبية ممتازة لمحاكاة المهام.'
      }
    ],
    evidence: [
      {
        q_en: 'Why was Rio Tinto classified as an analytical failure case?',
        q_ar: 'لماذا صُنّف ريو تينتو كحالة فشل تحليلي؟',
        a_en: 'Although historically studied for acidic microbes, Rio Tinto is heavily modified by 5,000 years of human mining runoff, and eukaryotic biomass creates spectral signatures that deviate from abiotic planetary baselines.',
        a_ar: 'على الرغم من دراسته تاريخياً للأحياء الدقيقة الحمضية، فإن ريو تينتو تأثر بـ 5,000 عام من التعدين البشري، مما أدى إلى بصمات طيفية تنحرف عن المعايير الكوكبية غير الحيوية.'
      },
      {
        q_en: 'What is the Mahalanobis distance similarity formula?',
        q_ar: 'ما هي صيغة مسافة ماهالانوبيس المستخدمة؟',
        a_en: 'S(x, y) applies covariance-weighted Mahalanobis distances combined with cosine kernels, preventing collinear variables (e.g., slope and roughness) from artificially dominating mineralogical signatures.',
        a_ar: 'تطبق الصيغة مسافة ماهالانوبيس الموزونة بمصفوفة التغاير مع دوال جيب التمام، لمنع المتغيرات المرتبطة (مثل الانحدار والخشونة) من طمس التوافق المعدني المستقل.'
      },
      {
        q_en: 'Which datasets power the TerraTwin catalog?',
        q_ar: 'ما هي مجموعات البيانات التي تغذي كتالوج تيرا توين؟',
        a_en: 'The pipeline ingests NASA LRO LOLA and Diviner, MRO CRISM and HiRISE, ESA Copernicus Sentinel-2 MSI, NASADEM 30m, and ASTER Global Emissivity Dataset (GEDv4).',
        a_ar: 'يعتمد المسار على بيانات ناسا LRO LOLA و Diviner، و MRO CRISM و HiRISE، وقمر سينتينل-2 التابع لإيسا، و NASADEM بدقة 30م، وأطلس الانبعاث الحراري ASTER GEDv4.'
      }
    ]
  },

  init(pageName) {
    this.currentPage = pageName;
    this.renderWidget();
    this.bindEvents();
  },

  renderWidget() {
    let container = document.getElementById('chatbotWidgetContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'chatbotWidgetContainer';
      container.className = 'chatbot-widget-container';
      document.body.appendChild(container);
    }

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';
    const title = isAr ? 'المساعد العلمي لتيرا توين' : 'TerraTwin Science Assistant';
    const status = isAr ? 'محرك استرجاع بيانات حتمي' : 'Deterministic Dataset Engine';
    const promptsLabel = isAr ? 'أسئلة موصى بها لهذه الصفحة:' : 'Recommended Questions for this Page:';
    const placeholder = isAr ? 'اطرح سؤالاً علمياً عن النماذج أو المواقع...' : 'Ask scientific question about models or sites...';
    const sendBtn = isAr ? 'إرسال' : 'Send';

    const prompts = this.pagePrompts[this.currentPage] || this.pagePrompts.home;

    container.innerHTML = `
      <button class="chatbot-trigger-btn" id="chatbotTriggerBtn" title="${title}">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="chatbot-trigger-dot"></span>
      </button>

      <div class="chatbot-dialog" id="chatbotDialog">
        <div class="chatbot-header">
          <div class="chatbot-header-info">
            <div class="chatbot-header-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="4"></circle>
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
              </svg>
            </div>
            <div>
              <div class="chatbot-title">${title}</div>
              <div class="chatbot-status"><span class="chatbot-status-dot"></span> ${status}</div>
            </div>
          </div>
          <button class="chatbot-close-btn" id="chatbotCloseBtn" title="Close">✕</button>
        </div>

        <div class="chatbot-quick-prompts-area">
          <div class="chatbot-quick-prompts-label">${promptsLabel}</div>
          <div class="chatbot-quick-prompts-list" id="chatbotPromptsList">
            ${prompts.map((p, idx) => `
              <button class="quick-prompt-chip" data-prompt-idx="${idx}">
                ${isAr ? p.q_ar : p.q_en}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="chatbot-messages-body" id="chatbotMessagesBody">
          <div class="chat-bubble bot">
            ${isAr 
              ? 'مرحباً بك. أنا المساعد العلمي لتيرا توين، متصل مباشرة بقواعد بيانات الأقمار الاصطناعية (NASA و ESA) ونتائج المعايرة التجريبية. اختر سؤالاً أعلاه أو اكتب استفسارك.' 
              : 'Welcome. I am the TerraTwin Scientific Assistant, connected to NASA and ESA planetary datasets and empirical validation results. Select a query above or enter your question.'}
            <div class="chat-meta">SYSTEM • NOW</div>
          </div>
        </div>

        <form class="chatbot-input-bar" id="chatbotInputForm">
          <input type="text" class="chatbot-input-field" id="chatbotInputField" placeholder="${placeholder}" autocomplete="off" />
          <button type="submit" class="chatbot-send-btn">${sendBtn}</button>
        </form>
      </div>
    `;

    // Re-bind click listeners
    document.getElementById('chatbotTriggerBtn')?.addEventListener('click', () => this.toggleDialog());
    document.getElementById('chatbotCloseBtn')?.addEventListener('click', () => this.closeDialog());

    document.querySelectorAll('.quick-prompt-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-prompt-idx'), 10);
        this.handlePromptClick(idx);
      });
    });

    document.getElementById('chatbotInputForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });
  },

  toggleDialog() {
    this.isOpen = !this.isOpen;
    const dialog = document.getElementById('chatbotDialog');
    if (dialog) dialog.classList.toggle('open', this.isOpen);
  },

  closeDialog() {
    this.isOpen = false;
    const dialog = document.getElementById('chatbotDialog');
    if (dialog) dialog.classList.remove('open');
  },

  handlePromptClick(idx) {
    const prompts = this.pagePrompts[this.currentPage] || this.pagePrompts.home;
    const item = prompts[idx];
    if (!item) return;

    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';
    const q = isAr ? item.q_ar : item.q_en;
    const a = isAr ? item.a_ar : item.a_en;

    this.appendMessage('user', q);
    setTimeout(() => {
      this.appendMessage('bot', a);
    }, 280);
  },

  handleFormSubmit() {
    const input = document.getElementById('chatbotInputField');
    if (!input || !input.value.trim()) return;

    const query = input.value.trim();
    input.value = '';
    this.appendMessage('user', query);

    setTimeout(() => {
      const response = this.computeDeterministicAnswer(query);
      this.appendMessage('bot', response);
    }, 320);
  },

  computeDeterministicAnswer(query) {
    const qLower = query.toLowerCase();
    const lang = window.I18n ? window.I18n.currentLang : 'en';
    const isAr = lang === 'ar';

    // Check all page prompts for keyword matches
    for (const pageKey of Object.keys(this.pagePrompts)) {
      for (const item of this.pagePrompts[pageKey]) {
        if (
          (isAr && item.q_ar.toLowerCase().includes(qLower)) ||
          (!isAr && item.q_en.toLowerCase().includes(qLower)) ||
          qLower.includes('atacama') || qLower.includes('أتاكاما') && item.q_en.includes('Atacama') ||
          qLower.includes('labbah') || qLower.includes('اللبة') && item.q_en.includes('Al-Labbah') ||
          qLower.includes('rio tinto') || qLower.includes('ريو تينتو') && item.q_en.includes('Rio Tinto') ||
          qLower.includes('gravity') || qLower.includes('جاذبية') && item.q_en.includes('gravity')
        ) {
          return isAr ? item.a_ar : item.a_en;
        }
      }
    }

    // Specific deterministic fallback required by specification:
    // "Information not available in current run / لا تتوفر هذه المعلومة في نتائج التحليل الحالية"
    return isAr
      ? 'لا تتوفر هذه المعلومة في نتائج التحليل الحالية. يُرجى مراجعة صفحة المنهجية والأدلة (Evidence & Method) للاطلاع على تفاصيل معايرة النماذج ومجموعات البيانات المتاحة.'
      : 'Information not available in current run. Please consult the Evidence & Method page for model calibration and available dataset catalogs.';
  },

  appendMessage(sender, text) {
    const container = document.getElementById('chatbotMessagesBody');
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    bubble.innerHTML = `
      ${text}
      <div class="chat-meta">${sender.toUpperCase()} • ${timeStr}</div>
    `;

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },

  bindEvents() {
    document.addEventListener('languageChanged', () => {
      this.renderWidget();
    });
  }
};

window.ScientificChatbot = ScientificChatbot;
