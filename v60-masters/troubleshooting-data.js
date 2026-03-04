// ═══════════════════════════════════════════════════════════════════════════
// V60 Masters — Troubleshooting & Tips Database
// Structured for embedding in the app
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// 1. TASTE PROBLEMS & FIXES (20 entries)
// Each entry: what the user tastes → root cause → actionable fixes
// ─────────────────────────────────────────────────────────────────────────

const TASTE_PROBLEMS = [
  {
    id: 'tp01',
    symptom: 'قهوتي طعمها حامض',
    symptomEn: 'Sour coffee',
    icon: '🍋',
    severity: 'common',
    cause: 'استخلاص ناقص — الماء ما أخذ كفاية نكهة من البن',
    causeEn: 'Under-extraction',
    extraction: 'under',
    fixes: [
      { variable: 'grind', action: 'اطحن أنعم درجة أو درجتين', priority: 1 },
      { variable: 'temp', action: 'ارفع حرارة الماء (جرّب 95–100°C)', priority: 2 },
      { variable: 'time', action: 'طوّل وقت التحضير — صبّ أبطأ أو زد عدد الصبّات', priority: 3 },
      { variable: 'agitation', action: 'زد التحريك — أضف دوران أو حرّك بالملعقة وقت التفتيح', priority: 4 }
    ],
    tip: 'الحموضة اللي من نقص الاستخلاص تكون حادّة وغير مريحة — غير الحموضة الحلوة اللي بتلاقيها بالقهوة المضبوطة.'
  },
  {
    id: 'tp02',
    symptom: 'قهوتي طعمها مرّ',
    symptomEn: 'Bitter coffee',
    icon: '😖',
    severity: 'common',
    cause: 'استخلاص زايد — الماء سحب مواد مرّة زيادة عن اللزوم',
    causeEn: 'Over-extraction',
    extraction: 'over',
    fixes: [
      { variable: 'grind', action: 'اطحن أخشن درجة أو درجتين', priority: 1 },
      { variable: 'temp', action: 'نزّل الحرارة (جرّب 90–93°C)', priority: 2 },
      { variable: 'time', action: 'قصّر وقت التحضير — صبّ أسرع أو قلّل عدد الصبّات', priority: 3 },
      { variable: 'agitation', action: 'قلّل التحريك — لا تدور الـV60 بقوة', priority: 4 }
    ],
    tip: 'المرارة الخفيفة طبيعية بالقهوة، لكن لو المرارة هي اللي مسيطرة وما فيه حلاوة = استخلاص زايد أكيد.'
  },
  {
    id: 'tp03',
    symptom: 'قهوتي خفيفة / مثل الماء',
    symptomEn: 'Watery / weak coffee',
    icon: '💧',
    severity: 'common',
    cause: 'تركيز منخفض (TDS قليل) — نسبة القهوة للماء قليلة أو الطحنة خشنة زيادة',
    causeEn: 'Low TDS / strength',
    extraction: 'low-tds',
    fixes: [
      { variable: 'dose', action: 'زد كمية البن (مثلاً من 15g إلى 18g لنفس كمية الماء)', priority: 1 },
      { variable: 'grind', action: 'اطحن أنعم — يزيد الاستخلاص والتركيز', priority: 2 },
      { variable: 'ratio', action: 'قلّل النسبة (من 1:17 إلى 1:15 مثلاً)', priority: 3 },
      { variable: 'water', action: 'تأكد ما فيه تسريب من الفلتر وكل الماء يمر على البن', priority: 4 }
    ],
    tip: 'النسبة المثالية للـSCA هي TDS بين 1.15% و 1.35%. لو قهوتك أقل من كذا بتحس إنها فاضية.'
  },
  {
    id: 'tp04',
    symptom: 'قهوتي قوية / ثقيلة مرة',
    symptomEn: 'Too strong coffee',
    icon: '💪',
    severity: 'common',
    cause: 'تركيز عالي — كمية بن زيادة أو ماء أقل من اللازم',
    causeEn: 'High TDS / over-concentrated',
    extraction: 'high-tds',
    fixes: [
      { variable: 'dose', action: 'قلّل كمية البن (مثلاً من 20g إلى 18g)', priority: 1 },
      { variable: 'water', action: 'زد كمية الماء (مثلاً من 300g إلى 340g)', priority: 2 },
      { variable: 'ratio', action: 'ارفع النسبة (من 1:15 إلى 1:16 أو 1:17)', priority: 3 },
      { variable: 'grind', action: 'اطحن أخشن شوي عشان يمر الماء أسرع', priority: 4 }
    ],
    tip: 'لو تحب القهوة القوية بس حاسّها مرّة، المشكلة مو بالتركيز — المشكلة بالاستخلاص. جرّب تخشّن الطحنة بس تخلّي النسبة.'
  },
  {
    id: 'tp05',
    symptom: 'ما فيها حلاوة أبد',
    symptomEn: 'No sweetness',
    icon: '🚫',
    severity: 'moderate',
    cause: 'الاستخلاص ما وصل للنقطة الحلوة — إما ناقص أو زايد',
    causeEn: 'Missed sweet spot',
    extraction: 'either',
    fixes: [
      { variable: 'ratio', action: 'جرّب نسبة 1:16 — تعتبر النقطة الوسط', priority: 1 },
      { variable: 'grind', action: 'عدّل الطحنة بدرجة وحدة بس وجرّب — اقترب من المنتصف', priority: 2 },
      { variable: 'temp', action: 'جرّب 93–96°C — المنطقة اللي تطلع أكثر حلاوة', priority: 3 },
      { variable: 'freshness', action: 'تأكد إن البن طازج (7–30 يوم من التحميص)', priority: 4 }
    ],
    tip: 'الحلاوة تكون بالمنتصف بين الحموضة والمرارة. لو قهوتك حامضة ومرّة بنفس الوقت بدون حلاوة = عندك channeling.'
  },
  {
    id: 'tp06',
    symptom: 'قهوتي طعمها قابض / يجفف الفم',
    symptomEn: 'Astringent / dry mouthfeel',
    icon: '🫠',
    severity: 'moderate',
    cause: 'استخلاص زايد — مركّبات التانين والبوليفينول سُحبت بكثرة',
    causeEn: 'Over-extraction (tannins)',
    extraction: 'over',
    fixes: [
      { variable: 'grind', action: 'اطحن أخشن — الطحنة الناعمة مرة تسبب هالمشكلة', priority: 1 },
      { variable: 'temp', action: 'نزّل الحرارة 2–3 درجات', priority: 2 },
      { variable: 'time', action: 'اختصر وقت التحضير', priority: 3 },
      { variable: 'filter', action: 'تأكد إنك شطفت الفلتر كويس — فلتر بدون شطف يعطي طعم قابض', priority: 4 }
    ],
    tip: 'الإحساس القابض نفس إحساس الشاي الأسود القوي أو النبيذ الأحمر. هذا ما هو طعم — هذا إحساس بالفم (mouthfeel).'
  },
  {
    id: 'tp07',
    symptom: 'قهوتي فاضية / ما فيها نكهة',
    symptomEn: 'Hollow / empty taste',
    icon: '🕳️',
    severity: 'moderate',
    cause: 'استخلاص زايد مع تركيز منخفض — سحبت كل شي بس ما فيه قوة',
    causeEn: 'Over-extracted + low concentration',
    extraction: 'over',
    fixes: [
      { variable: 'dose', action: 'زد كمية البن — عطه تركيز أكثر', priority: 1 },
      { variable: 'grind', action: 'اطحن أخشن شوي عشان تقلل الاستخلاص', priority: 2 },
      { variable: 'ratio', action: 'قلّل النسبة (من 1:17 إلى 1:15)', priority: 3 },
      { variable: 'freshness', action: 'تأكد إن البن ما هو قديم — البن القديم يعطي طعم فاضي', priority: 4 }
    ],
    tip: 'الطعم الفاضي يجي لما تسحب كل النكهات وتخلّيها تضيع بالماء الكثير. كأنك عصرت برتقالة لين ما بقى فيها شي.'
  },
  {
    id: 'tp08',
    symptom: 'قهوتي طعمها مالح',
    symptomEn: 'Salty taste',
    icon: '🧂',
    severity: 'uncommon',
    cause: 'استخلاص ناقص جداً — بس الأملاح انحلّت وما وصل للسكريات',
    causeEn: 'Severe under-extraction',
    extraction: 'under',
    fixes: [
      { variable: 'grind', action: 'اطحن أنعم بشكل ملحوظ — 2 إلى 3 درجات', priority: 1 },
      { variable: 'temp', action: 'ارفع الحرارة لأقصى حد (96–100°C)', priority: 2 },
      { variable: 'time', action: 'طوّل وقت التفتيح لدقيقة كاملة', priority: 3 },
      { variable: 'water', action: 'تأكد إن الماء ما هو soft جداً — ماء بدون معادن ما يستخلص كويس', priority: 4 }
    ],
    tip: 'الطعم المالح نادر بالقهوة. لو كل شي تمام بالوصفة، شيّك على جودة المياه — ممكن يكون فيها كلور أو أملاح زيادة.'
  },
  {
    id: 'tp09',
    symptom: 'قهوتي طعمها عشبي / أخضر',
    symptomEn: 'Grassy / vegetal taste',
    icon: '🌿',
    severity: 'uncommon',
    cause: 'استخلاص ناقص — أو البن فاتح التحميص مرة (underdeveloped)',
    causeEn: 'Under-extraction or underdeveloped roast',
    extraction: 'under',
    fixes: [
      { variable: 'temp', action: 'ارفع الحرارة — البن الفاتح يحتاج ماء أسخن', priority: 1 },
      { variable: 'grind', action: 'اطحن أنعم', priority: 2 },
      { variable: 'agitation', action: 'زد التحريك وقت التفتيح', priority: 3 },
      { variable: 'beans', action: 'لو ما تغيّر شي، ممكن التحميص نفسه ما هو ناضج — جرّب محمصة ثانية', priority: 4 }
    ],
    tip: 'البن اللي يتحمّص أقل من اللازم يكون فيه نكهات خضراء حتى لو استخلصته تمام. هذي مشكلة تحميص مو تحضير.'
  },
  {
    id: 'tp10',
    symptom: 'قهوتي طعمها محروق / فحم',
    symptomEn: 'Burnt / ashy taste',
    icon: '🔥',
    severity: 'moderate',
    cause: 'تحميص غامق + حرارة ماء عالية = استخلاص مواد محروقة',
    causeEn: 'Dark roast + high temperature',
    extraction: 'over',
    fixes: [
      { variable: 'temp', action: 'نزّل الحرارة بشكل كبير (85–90°C للتحميص الغامق)', priority: 1 },
      { variable: 'grind', action: 'اطحن أخشن — التحميص الغامق ينكسر بسرعة', priority: 2 },
      { variable: 'time', action: 'اختصر وقت التحضير', priority: 3 },
      { variable: 'beans', action: 'لو البن غامق مرة (Dark/French Roast)، جرّب Medium أو Medium-Dark', priority: 4 }
    ],
    tip: 'التحميص الغامق يحتاج معاملة مختلفة تماماً عن الفاتح. حرارة أقل، طحنة أخشن، ووقت أقصر.'
  },
  {
    id: 'tp11',
    symptom: 'قهوتي طعمها كرتوني / ورقي',
    symptomEn: 'Papery / cardboard taste',
    icon: '📦',
    severity: 'moderate',
    cause: 'الفلتر ما انشطف كويس — أو البن قديم جداً',
    causeEn: 'Unrinsed filter or stale beans',
    extraction: 'neutral',
    fixes: [
      { variable: 'filter', action: 'اشطف الفلتر بماء مغلي كويس — ما يكفي شطفة سريعة', priority: 1 },
      { variable: 'filter', action: 'ارمي ماء الشطف من السيرفر قبل تبدأ', priority: 2 },
      { variable: 'freshness', action: 'تأكد إن البن مو قديم (أكثر من 6 أسابيع من التحميص)', priority: 3 },
      { variable: 'storage', action: 'خزّن البن بعلبة محكمة بعيد عن الحرارة والضوء', priority: 4 }
    ],
    tip: 'فلاتر Hario الأصلية تحتاج شطف قوي. جرّب تصبّ ماء مغلي بطريقة دائرية على كل الفلتر وانتظر ينزل كله قبل تبدأ.'
  },
  {
    id: 'tp12',
    symptom: 'قهوتي طعمها تراب / طيني',
    symptomEn: 'Muddy / dirty taste',
    icon: '🪨',
    severity: 'moderate',
    cause: 'طحنة ناعمة مرة + استخلاص زايد — أو البن فيه عيوب',
    causeEn: 'Too fine + over-extraction, or defective beans',
    extraction: 'over',
    fixes: [
      { variable: 'grind', action: 'اطحن أخشن بشكل واضح — 2 إلى 3 درجات', priority: 1 },
      { variable: 'agitation', action: 'قلّل التحريك — لا تحرّك بقوة', priority: 2 },
      { variable: 'temp', action: 'نزّل الحرارة إلى 92–93°C', priority: 3 },
      { variable: 'beans', action: 'تأكد إن البن specialty grade — بن تجاري ممكن يكون فيه حبوب معيبة', priority: 4 }
    ],
    tip: 'الطعم الطيني عادة يجي مع وقت تصفية طويل مرة (أكثر من 4:30). لو وقتك طويل = الطحنة ناعمة زيادة.'
  },
  {
    id: 'tp13',
    symptom: 'قهوتي حامضة ومرّة بنفس الوقت',
    symptomEn: 'Both sour AND bitter',
    icon: '⚡',
    severity: 'tricky',
    cause: 'استخلاص غير متساوي (channeling) — أجزاء ناقصة وأجزاء زايدة',
    causeEn: 'Uneven extraction / channeling',
    extraction: 'uneven',
    fixes: [
      { variable: 'pour', action: 'حسّن تقنية الصب — دائري ثابت من الوسط للخارج', priority: 1 },
      { variable: 'grind', action: 'تأكد إن الطاحونة تعطي طحنة متساوية (بدون كتل أو بودرة)', priority: 2 },
      { variable: 'agitation', action: 'أضف Rao Spin — دوران خفيف بعد آخر صبّة', priority: 3 },
      { variable: 'bloom', action: 'حسّن التفتيح — تأكد إن كل البن يتبلل', priority: 4 }
    ],
    tip: 'هذي أصعب مشكلة. حامض + مرّ = الماء مر على مسارات معيّنة (channels) وترك أجزاء بدون استخلاص. الحل بالتساوي مو بالطحنة.'
  },
  {
    id: 'tp14',
    symptom: 'قهوتي مرّة بس مو قوية',
    symptomEn: 'Bitter but weak',
    icon: '😐',
    severity: 'moderate',
    cause: 'استخلاص زايد مع تركيز قليل — ماء كثير مر على بن قليل وقت طويل',
    causeEn: 'Over-extracted + diluted',
    extraction: 'over',
    fixes: [
      { variable: 'dose', action: 'زد كمية البن', priority: 1 },
      { variable: 'grind', action: 'اطحن أخشن عشان تقلل الاستخلاص', priority: 2 },
      { variable: 'ratio', action: 'قلّل النسبة — استخدم ماء أقل لنفس البن', priority: 3 },
      { variable: 'time', action: 'قلّل وقت التحضير', priority: 4 }
    ],
    tip: 'هالمشكلة تصير لو استخدمت نسبة عالية (مثل 1:18 أو 1:19) مع طحنة ناعمة. الحل: قلّل الماء واطحن أخشن.'
  },
  {
    id: 'tp15',
    symptom: 'قهوتي طعمها مسطّح / ممل',
    symptomEn: 'Flat / dull / boring',
    icon: '😑',
    severity: 'moderate',
    cause: 'بن قديم — أو استخلاص زايد خفيف سحب كل الحيوية',
    causeEn: 'Stale beans or slight over-extraction',
    extraction: 'either',
    fixes: [
      { variable: 'freshness', action: 'استخدم بن طازج (7–21 يوم من التحميص هو الأفضل)', priority: 1 },
      { variable: 'grind', action: 'اطحن قبل التحضير مباشرة — مو من البارحة', priority: 2 },
      { variable: 'temp', action: 'جرّب ترفع الحرارة شوي لو البن فاتح — يطلع نكهات أكثر', priority: 3 },
      { variable: 'agitation', action: 'زد التحريك خفيف — ممكن يحيي النكهة', priority: 4 }
    ],
    tip: 'البن يفقد CO2 مع الوقت. لو ما شفت تفتيح (bloom) = البن قديم. البن الطازج لازم ينفخ ويطلع فقاعات.'
  },
  {
    id: 'tp16',
    symptom: 'قهوتي طعمها معدني / حديد',
    symptomEn: 'Metallic taste',
    icon: '🔩',
    severity: 'uncommon',
    cause: 'مشكلة بجودة الماء — أو أدوات معدنية مؤكسدة',
    causeEn: 'Water quality or oxidized equipment',
    extraction: 'neutral',
    fixes: [
      { variable: 'water', action: 'استخدم ماء مفلتر أو ماء خاص بالقهوة (Third Wave Water)', priority: 1 },
      { variable: 'equipment', action: 'نظّف الأدوات كويس — خصوصاً السيرفر والملعقة', priority: 2 },
      { variable: 'equipment', action: 'لو تستخدم V60 معدني، جرّب البلاستيك أو السيراميك', priority: 3 },
      { variable: 'water', action: 'اغسل خزان الغلاية — ممكن يكون فيه ترسبات', priority: 4 }
    ],
    tip: 'الطعم المعدني ما له علاقة بالاستخلاص عادة. السبب الأول: الماء. لو ماء الصنبور عندك فيه كلور، استخدم فلتر كربوني.'
  },
  {
    id: 'tp17',
    symptom: 'قهوتي باردة وقت ما أشربها',
    symptomEn: 'Coffee gets cold too fast',
    icon: '🥶',
    severity: 'common',
    cause: 'الأدوات باردة تمتص الحرارة — أو الوقت بين التحضير والشرب طويل',
    causeEn: 'Heat loss to equipment',
    extraction: 'neutral',
    fixes: [
      { variable: 'preheat', action: 'سخّن الـV60 والسيرفر والكوب بماء مغلي قبل تبدأ', priority: 1 },
      { variable: 'material', action: 'V60 البلاستيك يحافظ على الحرارة أحسن من الزجاج والسيراميك', priority: 2 },
      { variable: 'serve', action: 'اشرب فوراً — لا تخلّيها تقعد', priority: 3 },
      { variable: 'temp', action: 'استخدم ماء أسخن (97–100°C) عشان يعوّض الفقدان', priority: 4 }
    ],
    tip: 'Scott Rao ينصح بالـV60 البلاستيك لأنه أخف ومايمتص حرارة كثير. السيراميك يحتاج تسخين مسبق طويل.'
  },
  {
    id: 'tp18',
    symptom: 'القهوة تنقّط ببطء مرة',
    symptomEn: 'Very slow drawdown / clogging',
    icon: '🐌',
    severity: 'common',
    cause: 'طحنة ناعمة جداً — أو الصب العنيف حرّك الجزيئات الدقيقة وسكّرت الفلتر',
    causeEn: 'Clogging from fines migration',
    extraction: 'over',
    fixes: [
      { variable: 'grind', action: 'اطحن أخشن — هذا السبب الأول', priority: 1 },
      { variable: 'pour', action: 'صبّ بهدوء — لا تخلّي الماء يضرب البن بقوة', priority: 2 },
      { variable: 'agitation', action: 'قلّل التحريك — الدوران القوي يحرّك الـfines للأسفل', priority: 3 },
      { variable: 'filter', action: 'تأكد إن الفلتر ملصوق صح بدون تجاعيد', priority: 4 }
    ],
    tip: 'لو وقت التصفية أكثر من 4:30 لـ300ml ماء = أكيد الطحنة ناعمة مرة. الهدف 2:30 إلى 3:30.'
  },
  {
    id: 'tp19',
    symptom: 'القهوة نزلت بسرعة مرة',
    symptomEn: 'Very fast drawdown',
    icon: '💨',
    severity: 'common',
    cause: 'طحنة خشنة جداً — الماء ما يلاقي مقاومة ويمر بسرعة',
    causeEn: 'Too coarse grind',
    extraction: 'under',
    fixes: [
      { variable: 'grind', action: 'اطحن أنعم — هذا السبب الأول', priority: 1 },
      { variable: 'pour', action: 'صبّ أبطأ عشان تطوّل وقت الاستخلاص', priority: 2 },
      { variable: 'technique', action: 'جرّب طريقة صبّات متعددة بدل الصبّة الوحدة', priority: 3 },
      { variable: 'dose', action: 'زد كمية البن — يبطّئ التصفية طبيعي', priority: 4 }
    ],
    tip: 'لو القهوة نزلت كلها بأقل من دقيقتين = خشنة مرة. المفروض ما يقل عن 2:30.'
  },
  {
    id: 'tp20',
    symptom: 'نكهة الحموضة تتغيّر كل مرة أحضّر',
    symptomEn: 'Inconsistent results',
    icon: '🎲',
    severity: 'moderate',
    cause: 'عدم ثبات المتغيرات — وزن أو حرارة أو طحنة أو تقنية صب تتغير',
    causeEn: 'Variable inconsistency',
    extraction: 'either',
    fixes: [
      { variable: 'scale', action: 'استخدم ميزان دقيق (0.1g) لكل شي — البن والماء', priority: 1 },
      { variable: 'temp', action: 'استخدم غلاية بتحكم حرارة — مو غلاية عادية', priority: 2 },
      { variable: 'grind', action: 'اطحن نفس العدد من الدرجات كل مرة — سجّل الرقم', priority: 3 },
      { variable: 'pour', action: 'استخدم مؤقت وتتبّع أوقات الصب — كل صبّة بنفس التوقيت', priority: 4 }
    ],
    tip: 'الاتساق هو المفتاح. غيّر متغير واحد بس كل مرة. لو غيّرت شيئين بنفس الوقت ما تعرف وش اللي أثّر.'
  }
];


// ─────────────────────────────────────────────────────────────────────────
// 2. VISUAL BED ANALYSIS (10 entries)
// What the spent coffee bed tells you after brewing
// ─────────────────────────────────────────────────────────────────────────

const BED_ANALYSIS = [
  {
    id: 'bed01',
    pattern: 'قاع مستوي ومتساوي',
    patternEn: 'Flat, even bed',
    icon: '✅',
    visual: 'flat',
    verdict: 'good',
    meaning: 'استخلاص متساوي — الماء مر على كل البن بالتساوي',
    meaningEn: 'Even extraction across the entire bed',
    action: 'ممتاز! لا تغيّر شي. هذا اللي نبيه.',
    details: 'القاع المستوي يعني إن الماء ما لقى مسارات سهلة وما ترك أجزاء جافة. تقنية الـRao Spin (دوران خفيف بنهاية الصب) تساعد تحقق هالشكل كل مرة.'
  },
  {
    id: 'bed02',
    pattern: 'حفرة أو فوّهة بالنص',
    patternEn: 'Crater or hole in center',
    icon: '🕳️',
    visual: 'crater',
    verdict: 'bad',
    meaning: 'تشانلنق (channeling) — الماء مر بمسار واحد وما وصل لكل البن',
    meaningEn: 'Channeling — water found a fast path through the center',
    action: 'عدّل تقنية الصب — صبّ دائري من الوسط للخارج بدل صبّ مباشر',
    details: 'الحفرة تعني إن الماء اختار أسهل طريق ونزل بسرعة من النص. البن حول الأطراف ما انستخلص كويس. حاول تصبّ بشكل دائري وتضيف دوران (swirl) بعد كل صبّة.'
  },
  {
    id: 'bed03',
    pattern: 'بن عالق على الجوانب فوق مستوى الماء',
    patternEn: 'High and dry grounds on sides',
    icon: '⬆️',
    visual: 'high-dry',
    verdict: 'bad',
    meaning: 'صبّ غير متحكّم فيه — الماء رفع البن للجوانب وما رجع ينزل',
    meaningEn: 'Pour technique pushed grounds up the sides where they dried out',
    action: 'صبّ أهدى وبشكل دائري — لا تصبّ على الجوانب. أضف Rao Spin.',
    details: 'البن اللي يعلق فوق على الجوانب ما يشارك بالاستخلاص. كأنك ضيّعت جزء من البن. الحل: صبّ بمنطقة الوسط فقط (حجم عملة معدنية) ولا تلمس الجوانب بالماء. الدوران بالنهاية ينزّل البن.'
  },
  {
    id: 'bed04',
    pattern: 'بن متراكم بجهة وحدة',
    patternEn: 'Uneven bed — piled to one side',
    icon: '⚖️',
    visual: 'tilted',
    verdict: 'bad',
    meaning: 'صبّ غير متوازن — صبّيت أكثر على جهة وحدة',
    meaningEn: 'Unbalanced pouring created uneven extraction',
    action: 'صبّ دائري متساوي — ولا تنسى الدوران الخفيف بنهاية الصب',
    details: 'لو البن متراكم بجهة يعني الماء مر أكثر من الجهة الثانية. جرّب تصبّ بشكل دائري أبطأ وركّز إنك تغطّي كل المنطقة. بعض الناس يحطّون الـV60 على سطح مستوي تماماً.'
  },
  {
    id: 'bed05',
    pattern: 'سطح ناعم مثل الطين / طيني',
    patternEn: 'Muddy, paste-like surface',
    icon: '🪨',
    visual: 'muddy',
    verdict: 'bad',
    meaning: 'طحنة ناعمة مرة — الـfines سدّت الفلتر وصار الاستخلاص زايد',
    meaningEn: 'Extremely fine grind caused filter clogging',
    action: 'اطحن أخشن بشكل واضح — 2 إلى 3 درجات',
    details: 'لو سطح البن بعد التحضير يشبه الطين = الطحنة ناعمة مرة. الجزيئات الدقيقة (fines) نزلت وسكّرت الفلتر. هذا يسبب وقت تصفية طويل واستخلاص زايد ومرارة.'
  },
  {
    id: 'bed06',
    pattern: 'شقوق أو فجوات بالسطح',
    patternEn: 'Cracks or gaps in the bed',
    icon: '💥',
    visual: 'cracked',
    verdict: 'bad',
    meaning: 'تشانلنق — الماء حفر مسارات بالبن بدل ما يمر بالتساوي',
    meaningEn: 'Multiple channels formed through the bed',
    action: 'حسّن التفتيح — تأكد كل البن يتبلل. أضف تحريك خفيف.',
    details: 'الشقوق تعني إن الماء لقى نقاط ضعف بالبن ومر منها. عادة السبب تفتيح (bloom) ناقص — لو بعض البن بقى جاف وقت التفتيح، الماء بعدين يتجنّبه ويمر من المناطق المبللة.'
  },
  {
    id: 'bed07',
    pattern: 'البن يطفو ويرفض يتبلل وقت التفتيح',
    patternEn: 'Grounds float and resist wetting during bloom',
    icon: '🫧',
    visual: 'floating',
    verdict: 'warning',
    meaning: 'بن طازج جداً (أقل من 5 أيام) — CO2 كثير يمنع التبلل',
    meaningEn: 'Very fresh beans — excessive CO2 repels water',
    action: 'انتظر لين يوصل البن عمر 7–14 يوم. أو طوّل وقت التفتيح لدقيقة.',
    details: 'البن الطازج مرة يطلع فقاعات كثيرة ويطفو. هذا مو سيء بالضرورة بس يخلّي الاستخلاص صعب. إما تنتظر كم يوم أو تطوّل وقت التفتيح أو تحرّك بالملعقة عشان يتبلل كله.'
  },
  {
    id: 'bed08',
    pattern: 'ما فيه تفتيح أبد — ما طلعت فقاعات',
    patternEn: 'No bloom — no bubbles at all',
    icon: '💀',
    visual: 'no-bloom',
    verdict: 'warning',
    meaning: 'البن قديم جداً — فقد كل CO2',
    meaningEn: 'Stale beans — all CO2 has escaped',
    action: 'استخدم بن أطزج. البن المثالي عمره 7–30 يوم من التحميص.',
    details: 'التفتيح (bloom) هو خروج CO2 من البن. لو ما صار تفتيح = البن فاته كثير. ممكن يعطيك كوب مقبول بس ما بيكون فيه حيوية. البن بعد 6 أسابيع يبدأ يفقد نكهته بشكل كبير.'
  },
  {
    id: 'bed09',
    pattern: 'حبّات بن كبيرة واضحة بالقاع',
    patternEn: 'Visible large chunks / boulders in bed',
    icon: '🪨',
    visual: 'boulders',
    verdict: 'bad',
    meaning: 'طحنة غير متساوية — الطاحونة ما تطحن صح أو الإعداد خشن مرة',
    meaningEn: 'Inconsistent grind — grinder producing boulders',
    action: 'نظّف الطاحونة أو استبدل السكاكين. أو اطحن أنعم.',
    details: 'وجود حبّات كبيرة مع بودرة ناعمة = طاحونة ما تشتغل صح (خصوصاً blade grinders). الحل الأفضل: طاحونة بـburrs (سكاكين) جيّدة. الطاحونات المسطحة (flat burr) أو المخروطية (conical burr) تعطي نتائج أفضل بكثير.'
  },
  {
    id: 'bed10',
    pattern: 'حلقة بنيّة على الفلتر (dark ring)',
    patternEn: 'Dark ring stain on filter walls',
    icon: '⭕',
    visual: 'dark-ring',
    verdict: 'neutral',
    meaning: 'طبيعي — هذي زيوت القهوة اللي التصقت بالفلتر',
    meaningEn: 'Normal — coffee oils adhered to filter during drawdown',
    action: 'ما يحتاج تسوي شي. هذا طبيعي تماماً.',
    details: 'الحلقة البنيّة على الفلتر طبيعية وتصير مع كل تحضير. لو كانت الحلقة غامقة مرة وعالية = البن طلع فوق (high and dry). لو كانت خفيفة ومتساوية = كل شي تمام.'
  }
];


// ─────────────────────────────────────────────────────────────────────────
// 3. BREW VARIABLE BEST PRACTICES (6 variables, detailed)
// ─────────────────────────────────────────────────────────────────────────

const BREW_VARIABLES = [
  {
    id: 'var01',
    variable: 'الحرارة',
    variableEn: 'Temperature',
    icon: '🌡️',
    unit: '°C',
    range: { min: 80, max: 100, ideal: '92–96' },
    summary: 'الحرارة تتحكم بسرعة الاستخلاص. أعلى = أسرع استخلاص.',
    whenHigher: {
      label: 'ارفع الحرارة (95–100°C) لو:',
      conditions: [
        'البن فاتح التحميص (Light Roast)',
        'قهوتك حامضة أو ناقصة الاستخلاص',
        'تبي تطلع حموضة حيوية ونكهات فاكهية',
        'الجو بارد أو الأدوات باردة',
        'البن طازج مرة وتحتاج تكسر CO2'
      ]
    },
    whenLower: {
      label: 'نزّل الحرارة (85–92°C) لو:',
      conditions: [
        'البن غامق التحميص (Dark/Medium-Dark)',
        'قهوتك مرّة أو قابضة',
        'تبي تقلل المرارة بدون تغيّر الطحنة',
        'البن قديم نسبياً (شهر+)',
        'تبي قوام أثقل وحلاوة أكثر من حموضة'
      ]
    },
    proTip: 'James Hoffmann و Scott Rao ينصحون بأعلى حرارة ممكنة (97–100°C) لأغلب القهوة الفاتحة. Tetsu Kasuya يفضّل 92°C. لا يوجد رقم صحيح واحد — يعتمد على البن.',
    commonMistake: 'أكبر غلطة: تسخّن الماء وتنتظر وقت طويل قبل تصبّ. الحرارة تنزل بسرعة — خصوصاً لو الأدوات باردة.'
  },
  {
    id: 'var02',
    variable: 'الطحنة',
    variableEn: 'Grind Size',
    icon: '⚙️',
    unit: 'درجة',
    range: { min: 'ناعم إسبريسو', max: 'خشن French Press', ideal: 'متوسط-ناعم (مثل ملح البحر)' },
    summary: 'الطحنة هي أهم متغير. تتحكم بمساحة السطح وسرعة مرور الماء.',
    whenFiner: {
      label: 'اطحن أنعم لو:',
      conditions: [
        'القهوة حامضة أو مالحة (استخلاص ناقص)',
        'التصفية سريعة مرة (أقل من 2:30)',
        'القهوة خفيفة وماء',
        'البن فاتح التحميص',
        'الماء أبرد من المعتاد'
      ]
    },
    whenCoarser: {
      label: 'اطحن أخشن لو:',
      conditions: [
        'القهوة مرّة أو قابضة (استخلاص زايد)',
        'التصفية بطيئة مرة (أكثر من 4:00)',
        'القهوة طعمها طيني أو ثقيل',
        'البن غامق التحميص',
        'الـV60 يتسكّر (clogging)'
      ]
    },
    proTip: 'غيّر درجة وحدة بس كل مرة. الطحنة المثالية لـV60 مع 20g بن و 300g ماء تعطي وقت تصفية كامل بين 2:30 و 3:30.',
    commonMistake: 'استخدام طاحونة شفرات (blade grinder) بدل سكاكين (burr grinder). الشفرات تعطي طحنة غير متساوية وتسبب channeling. استثمر بطاحونة burr.'
  },
  {
    id: 'var03',
    variable: 'النسبة',
    variableEn: 'Ratio (Coffee:Water)',
    icon: '⚖️',
    unit: 'g:g',
    range: { min: '1:12', max: '1:18', ideal: '1:15 – 1:16.7' },
    summary: 'النسبة تتحكم بقوة القهوة (التركيز). مو بالاستخلاص — بالتركيز.',
    ratioGuide: [
      { ratio: '1:12–1:13', taste: 'قوية جداً / مركّزة', style: 'إسبريسو-ستايل، مثلّج مركّز', example: 'Tetsu Kasuya Ice Brew' },
      { ratio: '1:14', taste: 'قوية', style: 'iced V60 (يتخفف بالثلج)', example: 'مثلّج مع ثلج' },
      { ratio: '1:15', taste: 'متوسطة-قوية', style: 'الأكثر شعبية عالمياً', example: 'Tetsu 4:6, Patrik Rolf' },
      { ratio: '1:16', taste: 'متوازنة', style: 'SCA المعيار الذهبي', example: 'Ben Put' },
      { ratio: '1:16.7', taste: 'متوازنة-خفيفة', style: 'الأوضح نكهة', example: 'James Hoffmann' },
      { ratio: '1:17', taste: 'خفيفة / شاي-ستايل', style: 'صفاء عالي، قوام خفيف', example: 'Lance Hedrick, Jonathan Gagné' },
      { ratio: '1:18+', taste: 'خفيفة جداً', style: 'ممكن تحس بالماء', example: 'ما ننصح بها عادة' }
    ],
    proTip: 'ابدأ بـ1:16 وعدّل. لو تبيها أقوى روح 1:15. لو تبيها أصفى روح 1:17. النسبة ما تأثر على الحموضة/المرارة — تأثر على القوة بس.',
    commonMistake: 'خلط القوة (strength/TDS) مع الاستخلاص (extraction). ممكن تكون قهوتك قوية ومرّة (high TDS + over-extracted) أو خفيفة وحامضة (low TDS + under-extracted). هم متغيرين مختلفين.'
  },
  {
    id: 'var04',
    variable: 'التحريك',
    variableEn: 'Agitation',
    icon: '🌀',
    unit: '',
    range: { min: 'بدون تحريك', max: 'تحريك قوي', ideal: 'دوران خفيف (Rao Spin)' },
    summary: 'التحريك يزيد الاستخلاص بكسر طبقة البن ومنع التشانلنق.',
    whenMore: {
      label: 'زد التحريك لو:',
      conditions: [
        'القهوة حامضة أو ناقصة الاستخلاص',
        'البن فاتح التحميص',
        'تبي استخلاص أعلى بدون تنعّم الطحنة',
        'فيه high and dry grounds على الجوانب',
        'التفتيح ما يتبلل كله'
      ]
    },
    whenLess: {
      label: 'قلّل التحريك لو:',
      conditions: [
        'القهوة مرّة أو طينية',
        'البن غامق التحميص (ينكسر بسرعة)',
        'وقت التصفية طويل مرة',
        'الطحنة ناعمة — التحريك يحرّك الـfines للفلتر',
        'تبي قوام أنظف وأخف'
      ]
    },
    techniques: [
      { name: 'Rao Spin', desc: 'دوران دائري خفيف بعد كل صبّة — يسوّي سطح البن', level: 'الأكثر استخداماً' },
      { name: 'Swirl + Stir', desc: 'تحريك بالملعقة بعد التفتيح ثم دوران — Hoffmann Style', level: 'متوسط' },
      { name: 'Excavation', desc: 'حفر حفرة بالبن قبل التفتيح عشان يتبلل كله — Matt Winton', level: 'متقدم' },
      { name: 'Pour Height', desc: 'الصب من ارتفاع أعلى = تحريك أكثر — Matt Winton', level: 'متقدم' },
      { name: 'No Agitation', desc: 'صبّ هادي بدون أي تحريك — Tetsu 4:6', level: 'لمحبّي الثبات' }
    ],
    proTip: 'أسهل طريقة: Rao Spin بعد كل صبّة. امسك الـV60 من الأذن وحرّكه دائرة وحدة. ينزّل البن من الجوانب ويسوّي القاع.',
    commonMistake: 'التحريك العنيف يحرّك الجزيئات الدقيقة (fines) للأسفل ويسكّر الفلتر. التحريك لازم يكون خفيف — مو خلاط!'
  },
  {
    id: 'var05',
    variable: 'سرعة الصب',
    variableEn: 'Pour Rate',
    icon: '🫗',
    unit: 'g/s',
    range: { min: '~3 g/s (بطيء)', max: '~8 g/s (سريع)', ideal: '4–6 g/s' },
    summary: 'سرعة الصب تأثر على التحريك وعلى مستوى الماء فوق البن (slurry level).',
    whenFaster: {
      label: 'صبّ أسرع لو:',
      conditions: [
        'تبي ترفع مستوى الماء فوق البن (أكثر غمر = less agitation per gram)',
        'تبي تحضير أسرع',
        'تستخدم طريقة الصبّة الوحدة (single pour)',
        'البن غامق التحميص وتبي تقلل وقت التلامس'
      ]
    },
    whenSlower: {
      label: 'صبّ أبطأ لو:',
      conditions: [
        'تبي استخلاص أعلى (الماء يمر أبطأ على البن)',
        'الطحنة خشنة شوي وتبي تعوّض',
        'تبي صفاء أكثر بالكوب',
        'تحضّر كمية صغيرة (أقل من 250ml)'
      ]
    },
    proTip: 'لا تصبّ على الجوانب أبداً — الماء يمر على الفلتر بدون ما يلمس البن. صبّ بمنطقة بحجم عملة معدنية بالوسط، دائري.',
    commonMistake: 'الصب العنيف (aggressive pour) يضرب البن ويحفر حفرة ويسبب channeling. خلّ الماء يلمس البن بهدوء.'
  },
  {
    id: 'var06',
    variable: 'جودة الماء',
    variableEn: 'Water Quality',
    icon: '💧',
    unit: 'ppm / mg/L',
    range: { min: '50 ppm', max: '200 ppm', ideal: '70–150 ppm TDS' },
    summary: 'الماء 98% من كوب القهوة. المعادن فيه هي اللي تسحب النكهة من البن.',
    guidelines: [
      { type: 'ماء مقطّر (0 ppm)', effect: 'سيء — ما يستخلص شي. طعم مسطّح فاضي.', verdict: 'avoid' },
      { type: 'ماء RO بدون معادن', effect: 'سيء — نفس المشكلة. يحتاج تضيف معادن.', verdict: 'avoid' },
      { type: 'ماء مفلتر (50–150 ppm)', effect: 'مثالي — معادن كافية بدون كلور.', verdict: 'ideal' },
      { type: 'ماء الصنبور (100–300 ppm)', effect: 'يعتمد — لو فيه كلور أو طعم = سيء. لو نظيف = مقبول.', verdict: 'depends' },
      { type: 'ماء قاسي (300+ ppm)', effect: 'سيء — يسبب مرارة وطعم طيني وترسبات.', verdict: 'avoid' },
      { type: 'Third Wave Water / أكوا كود', effect: 'ممتاز — معادن مصمّمة للقهوة بالضبط.', verdict: 'best' }
    ],
    minerals: [
      { name: 'الكالسيوم', role: 'يزيد الحلاوة والقوام', target: '50–70 mg/L' },
      { name: 'المغنيسيوم', role: 'يزيد التعقيد والنكهات الفاكهية', target: '10–30 mg/L' },
      { name: 'البيكربونات', role: 'يوازن الحموضة (buffer)', target: '40–75 mg/L' }
    ],
    proTip: 'لو تبي أسهل حل: ماء بيور لايف أو أكوافينا + كبسولة Third Wave Water. أو ماء تحلية سعودي مفلتر بفلتر كربوني.',
    commonMistake: 'استخدام ماء RO أو مقطّر بدون إضافة معادن. القهوة تطلع فاضية ومسطّحة مهما سويت.'
  }
];


// ─────────────────────────────────────────────────────────────────────────
// 4. SEASONAL & ENVIRONMENTAL TIPS (12 entries)
// ─────────────────────────────────────────────────────────────────────────

const SEASONAL_TIPS = [
  {
    id: 'sea01',
    season: 'صيف',
    seasonEn: 'Summer',
    category: 'iced',
    icon: '☀️',
    title: 'الـV60 المثلّج — الطريقة اليابانية',
    tip: 'استبدل 30–40% من الماء بثلج في السيرفر. اطحن أنعم من الحار بدرجة. صبّ بنفس الطريقة بس على ثلج.',
    details: 'مثال: بدل 300g ماء → استخدم 180g ماء ساخن + 120g ثلج. الماء الساخن يستخلص كل النكهة والثلج يبرّدها فوراً ويحبس الروائح.',
    adjustments: [
      { variable: 'ratio', change: 'نزّل نسبة الماء الساخن (60–70% من الإجمالي)' },
      { variable: 'grind', change: 'أنعم بدرجة عشان تعوّض الماء الأقل' },
      { variable: 'ice', change: 'ثلج = 30–40% من إجمالي السائل' },
      { variable: 'temp', change: 'استخدم أعلى حرارة ممكنة (97–100°C)' }
    ]
  },
  {
    id: 'sea02',
    season: 'صيف',
    seasonEn: 'Summer',
    category: 'iced',
    icon: '🧊',
    title: 'Flash Brew — أسرع من الطريقة اليابانية',
    tip: 'حضّر القهوة بنسبة 80% ماء ساخن ثم حرّك الثلج بعد التحضير مباشرة. Lance Hedrick style.',
    details: 'الفرق عن الطريقة اليابانية: هنا تحضّر بكمية ماء أكثر (استخلاص أكمل) وتبرّد بعد. النتيجة أصفى ونكهات أوضح.',
    adjustments: [
      { variable: 'ratio', change: '80% ماء ساخن + 20% ثلج يُضاف بعد التحضير' },
      { variable: 'grind', change: 'نفس طحنة الحار أو أنعم بشوي' },
      { variable: 'ice', change: 'حرّك الثلج بالقهوة المحضّرة لين توصل 5–15°C' },
      { variable: 'serve', change: 'قدّمها على ثلج جديد — مو نفس اللي استخدمته للتبريد' }
    ]
  },
  {
    id: 'sea03',
    season: 'صيف',
    seasonEn: 'Summer',
    category: 'environment',
    icon: '🏜️',
    title: 'التحضير بجو حار (35°C+)',
    tip: 'الحرارة المحيطة العالية تخلّي الماء يبرد أبطأ = استخلاص أطول. ممكن تحتاج تطحن أخشن شوي.',
    details: 'بالسعودية بالصيف ممكن حرارة الغرفة توصل 25–30°C حتى مع التكييف. هذا يعني الماء يبقى حار أطول والاستخلاص يزيد. عوّض بطحنة أخشن.',
    adjustments: [
      { variable: 'grind', change: 'أخشن بدرجة وحدة مقارنة بالشتاء' },
      { variable: 'preheat', change: 'ما يحتاج تسخين مسبق طويل — الأدوات حارة أصلاً' },
      { variable: 'serve', change: 'اشرب فوراً أو حوّل لمثلّج' }
    ]
  },
  {
    id: 'sea04',
    season: 'شتاء',
    seasonEn: 'Winter',
    category: 'environment',
    icon: '❄️',
    title: 'التحضير بجو بارد',
    tip: 'الأدوات الباردة تمتص حرارة كثيرة. لازم تسخّن كل شي وترفع حرارة الماء.',
    details: 'بالشتاء أو بغرفة مكيّفة قوية، الـV60 (خصوصاً السيراميك) يمتص 3–5°C من الماء. السيرفر الزجاجي البارد يمتص أكثر. والكوب يمتص أكثر. بالنهاية ممكن تخسر 10°C.',
    adjustments: [
      { variable: 'preheat', change: 'سخّن الـV60 والسيرفر والكوب بماء مغلي — واجب مو اختياري' },
      { variable: 'temp', change: 'استخدم ماء مغلي (100°C) — لو عادة تستخدم 93°C روح 96°C' },
      { variable: 'material', change: 'V60 بلاستيك أفضل من السيراميك بالبرد' },
      { variable: 'time', change: 'الماء يبرد أسرع = استخلاص أقل. ممكن تطوّل الوقت شوي.' }
    ]
  },
  {
    id: 'sea05',
    season: 'شتاء',
    seasonEn: 'Winter',
    category: 'comfort',
    icon: '☕',
    title: 'وصفات شتوية مقترحة',
    tip: 'بالشتاء جرّب نسب أقوى (1:15) وبن غامق شوي. القوام الأثقل يحسّسك بالدفء.',
    details: 'الكوب الشتوي المثالي: قوام heavy، حلاوة عالية، حموضة خفيفة. جرّب بن إثيوبي Natural أو كولومبي غامق متوسط بنسبة 1:15 وحرارة 96°C.',
    adjustments: [
      { variable: 'ratio', change: '1:14 إلى 1:15 — أقوى من الصيف' },
      { variable: 'beans', change: 'بن متوسط أو غامق متوسط — شوكولاتة وكراميل' },
      { variable: 'temp', change: '96–100°C' },
      { variable: 'serve', change: 'اشرب من كوب سيراميك سميك — يحافظ على الحرارة' }
    ]
  },
  {
    id: 'sea06',
    season: 'صيف',
    seasonEn: 'Summer',
    category: 'iced',
    icon: '🥤',
    title: 'V60 Tonic — القهوة بالتونيك',
    tip: 'حضّر V60 مركّز (1:12) وصبّه على ثلج وتونيك. منعش ومختلف.',
    details: 'حضّر 15g بن مع 180g ماء (نسبة 1:12). خلّ القهوة تبرد شوي. حط ثلج بكوب طويل، صبّ 100ml تونيك (Schweppes أو Fever-Tree)، وبعدين صبّ القهوة ببطء. ما تحرّك — خلّ الطبقات.',
    adjustments: [
      { variable: 'ratio', change: '1:12 — مركّزة عشان التونيك يخففها' },
      { variable: 'grind', change: 'أنعم من العادي' },
      { variable: 'beans', change: 'بن فاتح فاكهي — إثيوبي أو كيني' },
      { variable: 'tonic', change: 'تونيك Indian (أخف) أو Mediterranean (أحلى)' }
    ]
  },
  {
    id: 'sea07',
    season: 'الكل',
    seasonEn: 'All year',
    category: 'altitude',
    icon: '⛰️',
    title: 'التحضير على ارتفاع عالي (الطائف/أبها)',
    tip: 'الماء يغلي بدرجة أقل على الارتفاع. ممكن تحتاج تطحن أنعم لتعويض.',
    details: 'على ارتفاع 2000 متر (مثل الطائف)، الماء يغلي عند ~93°C بدل 100°C. هذا يعني إن أقصى حرارة عندك أبرد. عوّض بطحنة أنعم ووقت أطول.',
    adjustments: [
      { variable: 'temp', change: 'استخدم ماء مغلي حتى لو الغليان أبرد — ما تقدر تزيد' },
      { variable: 'grind', change: 'أنعم بدرجة أو درجتين مقارنة بمستوى البحر' },
      { variable: 'time', change: 'طوّل وقت التفتيح والتحضير' }
    ]
  },
  {
    id: 'sea08',
    season: 'الكل',
    seasonEn: 'All year',
    category: 'freshness',
    icon: '📅',
    title: 'عمر البن المثالي حسب الوقت',
    tip: 'البن عمره 7–21 يوم من التحميص هو الأفضل. بعد شهر يبدأ يفقد نكهته.',
    details: 'يوم 1–3: طازج مرة، CO2 كثير، صعب يتحضّر. يوم 4–7: يبدأ يهدأ. يوم 7–21: الفترة الذهبية. يوم 21–45: لا يزال مقبول. بعد 45 يوم: ابدأ بتعديل الطحنة (أنعم) والحرارة (أعلى).',
    adjustments: [
      { variable: 'grind', change: 'بن قديم = اطحن أنعم (يحتاج استخلاص أكثر)' },
      { variable: 'temp', change: 'بن قديم = حرارة أعلى' },
      { variable: 'bloom', change: 'بن طازج مرة = تفتيح أطول (45–60 ثانية)' },
      { variable: 'bloom', change: 'بن قديم = تفتيح أقصر (ما في CO2 يطلع)' }
    ]
  },
  {
    id: 'sea09',
    season: 'الكل',
    seasonEn: 'All year',
    category: 'roast',
    icon: '🫘',
    title: 'تعديل الوصفة حسب درجة التحميص',
    tip: 'التحميص الفاتح يحتاج: حرارة أعلى، طحنة أنعم، وقت أطول. الغامق عكسه تماماً.',
    details: 'البن الفاتح أصلب وأصعب يستخلص. البن الغامق هش وينكسر بسرعة ويعطي نكهة بسهولة.',
    adjustments: [
      { variable: 'light', change: 'فاتح: 96–100°C, طحنة أنعم, وقت 3:00–4:00, تحريك أكثر' },
      { variable: 'medium', change: 'متوسط: 93–96°C, طحنة متوسطة, وقت 2:30–3:30' },
      { variable: 'dark', change: 'غامق: 88–92°C, طحنة أخشن, وقت 2:00–3:00, تحريك أقل' }
    ]
  },
  {
    id: 'sea10',
    season: 'الكل',
    seasonEn: 'All year',
    category: 'equipment',
    icon: '🔧',
    title: 'V60 بلاستيك vs سيراميك vs زجاج vs معدن',
    tip: 'البلاستيك أفضل للثبات والعزل الحراري. السيراميك الأجمل. الزجاج الأوضح. المعدن للسفر.',
    details: 'Scott Rao ينصح بالبلاستيك (أقل امتصاص للحرارة). السيراميك يحتاج تسخين مسبق طويل. الزجاج وسط. المعدن يبرد أسرع شي.',
    adjustments: [
      { variable: 'plastic', change: 'بلاستيك: أفضل عزل حراري, ما يحتاج تسخين طويل, أرخص' },
      { variable: 'ceramic', change: 'سيراميك: جميل, يحتاج تسخين مسبق 30+ ثانية بماء مغلي' },
      { variable: 'glass', change: 'زجاج: يشوف التصفية, عزل متوسط' },
      { variable: 'metal', change: 'معدن: خفيف ومتين للسفر, يحتاج تسخين مسبق' }
    ]
  },
  {
    id: 'sea11',
    season: 'الكل',
    seasonEn: 'All year',
    category: 'filter',
    icon: '📄',
    title: 'أنواع فلاتر الـV60 والفرق بينها',
    tip: 'الفلاتر الأصلية (Hario) أنحف وأسرع تصفية. Cafec أسمك وأبطأ. كل واحد يحتاج تعديل طحنة.',
    details: 'Hario الأبيض: الأكثر شيوعاً, تصفية سريعة. Hario Natural (بني): أسمك قليلاً, طعم ورقي أقوى. Cafec Abaca: أسمك, تصفية أبطأ, كوب أنظف. Sibarist FAST: رقيقة جداً, تصفية سريعة مرة.',
    adjustments: [
      { variable: 'hario-white', change: 'المعيار — اشطف كويس' },
      { variable: 'cafec', change: 'أبطأ = اطحن أخشن مقارنة بـHario' },
      { variable: 'sibarist', change: 'أسرع = اطحن أنعم أو صبّ أبطأ' },
      { variable: 'rinse', change: 'كل الفلاتر: اشطف بماء مغلي وارمي ماء الشطف' }
    ]
  },
  {
    id: 'sea12',
    season: 'رمضان',
    seasonEn: 'Ramadan',
    category: 'special',
    icon: '🌙',
    title: 'قهوة V60 للسحور',
    tip: 'حضّر V60 قبل الفجر بنسبة 1:15 وبن متوسط التحميص. القوام الأثقل يعطي طاقة أطول.',
    details: 'بالسحور تبي قهوة تعطيك طاقة مستمرة. استخدم نسبة أقوى (1:15), بن متوسط-غامق (قوام أثقل وكافيين أكثر بالكوب), واشربها مع ماء.',
    adjustments: [
      { variable: 'ratio', change: '1:14 إلى 1:15 — أقوى عشان الطاقة' },
      { variable: 'beans', change: 'متوسط-غامق — قوام أثقل وحلاوة' },
      { variable: 'timing', change: 'حضّرها 15 دقيقة قبل تبي تشربها — ما تبيها تبرد' },
      { variable: 'hydration', change: 'اشرب كوب ماء قبل القهوة وكوب بعدها' }
    ]
  }
];


// ─────────────────────────────────────────────────────────────────────────
// 5. QUICK DIAGNOSIS FLOW (decision-tree style)
// For the app's interactive troubleshooter
// ─────────────────────────────────────────────────────────────────────────

const DIAGNOSIS_FLOW = [
  {
    id: 'q1',
    question: 'وش المشكلة الأساسية؟',
    questionEn: 'What is the main problem?',
    options: [
      { label: 'الطعم غلط', value: 'taste', next: 'q2' },
      { label: 'التصفية غريبة', value: 'flow', next: 'q5' },
      { label: 'النتيجة ما تثبت', value: 'consistency', next: 'q7' },
      { label: 'القهوة باردة', value: 'temp', result: 'tp17' }
    ]
  },
  {
    id: 'q2',
    question: 'كيف الطعم تحديداً؟',
    questionEn: 'What does it taste like?',
    options: [
      { label: 'حامض / لاذع', value: 'sour', next: 'q3' },
      { label: 'مرّ / قابض', value: 'bitter', next: 'q4' },
      { label: 'ضعيف / مثل الماء', value: 'weak', result: 'tp03' },
      { label: 'قوي مرة', value: 'strong', result: 'tp04' },
      { label: 'بدون نكهة / ممل', value: 'flat', result: 'tp15' },
      { label: 'حامض ومرّ بنفس الوقت', value: 'both', result: 'tp13' }
    ]
  },
  {
    id: 'q3',
    question: 'الحموضة من أي نوع؟',
    questionEn: 'What kind of sourness?',
    options: [
      { label: 'حموضة حادّة وغير مريحة', value: 'sharp', result: 'tp01' },
      { label: 'طعم مالح غريب', value: 'salty', result: 'tp08' },
      { label: 'طعم عشبي / أخضر', value: 'grassy', result: 'tp09' }
    ]
  },
  {
    id: 'q4',
    question: 'المرارة من أي نوع؟',
    questionEn: 'What kind of bitterness?',
    options: [
      { label: 'مرارة عادية + قوة', value: 'bitter-strong', result: 'tp02' },
      { label: 'مرارة + ضعف', value: 'bitter-weak', result: 'tp14' },
      { label: 'قبض / يجفف الفم', value: 'astringent', result: 'tp06' },
      { label: 'طعم محروق', value: 'burnt', result: 'tp10' },
      { label: 'طعم طيني / ثقيل', value: 'muddy', result: 'tp12' },
      { label: 'طعم فاضي بس مرّ', value: 'hollow', result: 'tp07' }
    ]
  },
  {
    id: 'q5',
    question: 'كيف التصفية؟',
    questionEn: 'How is the drawdown?',
    options: [
      { label: 'بطيئة مرة (4+ دقايق)', value: 'slow', result: 'tp18' },
      { label: 'سريعة مرة (أقل من 2 دقيقة)', value: 'fast', result: 'tp19' },
      { label: 'عادية بس الطعم غلط', value: 'normal', next: 'q2' }
    ]
  },
  {
    id: 'q7',
    question: 'شنو اللي يتغيّر؟',
    questionEn: 'What changes between brews?',
    options: [
      { label: 'الطعم يتغيّر كل مرة', value: 'taste-varies', result: 'tp20' },
      { label: 'الوقت يتغيّر كل مرة', value: 'time-varies', result: 'tp20' },
      { label: 'طعم ورقي أحياناً', value: 'papery', result: 'tp11' },
      { label: 'طعم معدني أحياناً', value: 'metallic', result: 'tp16' }
    ]
  }
];


// ─────────────────────────────────────────────────────────────────────────
// 6. EXTRACTION COMPASS REFERENCE
// Quick-reference chart for the brewing compass
// ─────────────────────────────────────────────────────────────────────────

const EXTRACTION_COMPASS = {
  axes: {
    x: { label: 'الاستخلاص', labelEn: 'Extraction', low: 'ناقص', high: 'زايد' },
    y: { label: 'التركيز', labelEn: 'Strength (TDS)', low: 'خفيف', high: 'قوي' }
  },
  quadrants: [
    {
      position: 'top-left',
      extraction: 'under',
      strength: 'high',
      taste: 'حامض + قوي',
      tasteEn: 'Sour & Strong',
      descriptors: ['حموضة حادّة', 'مالح', 'كثيف بس مو لذيذ'],
      fix: 'اطحن أنعم أو ارفع الحرارة (بدون تغيير النسبة)',
      color: '#e74c3c'
    },
    {
      position: 'top-right',
      extraction: 'over',
      strength: 'high',
      taste: 'مرّ + قوي',
      tasteEn: 'Bitter & Strong',
      descriptors: ['مرارة شديدة', 'قابض', 'طيني', 'ثقيل'],
      fix: 'اطحن أخشن + نزّل الحرارة + قلّل الوقت',
      color: '#8b4513'
    },
    {
      position: 'bottom-left',
      extraction: 'under',
      strength: 'low',
      taste: 'حامض + ضعيف',
      tasteEn: 'Sour & Weak',
      descriptors: ['ماء ملوّن', 'حموضة بلا قوام', 'عشبي'],
      fix: 'زد البن + اطحن أنعم + ارفع الحرارة',
      color: '#f39c12'
    },
    {
      position: 'bottom-right',
      extraction: 'over',
      strength: 'low',
      taste: 'مرّ + ضعيف',
      tasteEn: 'Bitter & Weak',
      descriptors: ['فاضي', 'مرارة خفيفة مزعجة', 'ممل'],
      fix: 'زد البن + اطحن أخشن',
      color: '#95a5a6'
    },
    {
      position: 'center',
      extraction: 'ideal',
      strength: 'ideal',
      taste: 'متوازن ولذيذ',
      tasteEn: 'Balanced & Delicious',
      descriptors: ['حلاوة', 'حموضة مريحة', 'قوام مناسب', 'نظيف'],
      fix: 'مبروك! لا تغيّر شي.',
      color: '#27ae60'
    }
  ],
  targetRange: {
    extraction: { min: 18, max: 22, unit: '%', ideal: '19–21%' },
    tds: { min: 1.15, max: 1.45, unit: '%', ideal: '1.2–1.4%' }
  }
};


// ─────────────────────────────────────────────────────────────────────────
// 7. COMMON BEGINNER MISTAKES (top 10)
// Quick-fix checklist for new V60 users
// ─────────────────────────────────────────────────────────────────────────

const BEGINNER_MISTAKES = [
  {
    id: 'bm01',
    mistake: 'ما يشطف الفلتر',
    mistakeEn: 'Not rinsing the filter',
    icon: '📄',
    impact: 'طعم ورقي / كرتوني + أدوات باردة',
    fix: 'اشطف الفلتر بماء مغلي كل مرة. وارمي ماء الشطف من السيرفر.',
    priority: 1
  },
  {
    id: 'bm02',
    mistake: 'يستخدم بن مطحون من قبل',
    mistakeEn: 'Using pre-ground coffee',
    icon: '⚙️',
    impact: 'نكهة مسطّحة وفاضية — البن يفقد 60% من نكهته بعد 15 دقيقة من الطحن',
    fix: 'اطحن قبل التحضير مباشرة. استثمر بطاحونة burr حتى لو يدوية.',
    priority: 1
  },
  {
    id: 'bm03',
    mistake: 'ما يستخدم ميزان',
    mistakeEn: 'Not using a scale',
    icon: '⚖️',
    impact: 'كل كوب مختلف — مستحيل تثبّت الوصفة',
    fix: 'ميزان بـ0.1g دقة. وزن البن ووزن الماء. الملاعق ما تنفع.',
    priority: 1
  },
  {
    id: 'bm04',
    mistake: 'ماء من الصنبور بدون فلتر',
    mistakeEn: 'Using unfiltered tap water',
    icon: '💧',
    impact: 'طعم كلور أو معدني — الماء 98% من كوبك',
    fix: 'ماء مفلتر أو ماء معبّأ. تجنّب المقطّر (فاضي من المعادن).',
    priority: 2
  },
  {
    id: 'bm05',
    mistake: 'يصبّ بسرعة وعشوائي',
    mistakeEn: 'Pouring too fast and randomly',
    icon: '🫗',
    impact: 'channeling + استخلاص غير متساوي + بن على الجوانب',
    fix: 'صبّ دائري ثابت بمنطقة الوسط. استخدم غلاية رقبة الإوز (gooseneck).',
    priority: 2
  },
  {
    id: 'bm06',
    mistake: 'يتجاهل التفتيح (bloom)',
    mistakeEn: 'Skipping the bloom',
    icon: '🫧',
    impact: 'CO2 يمنع الاستخلاص + channeling',
    fix: 'أول صبّة: 2× وزن البن (مثلاً 40g ماء لـ20g بن). انتظر 30–45 ثانية.',
    priority: 2
  },
  {
    id: 'bm07',
    mistake: 'بن قديم (أكثر من شهرين)',
    mistakeEn: 'Using very old beans',
    icon: '📅',
    impact: 'ما فيه تفتيح + طعم مسطّح + ما فيه حياة',
    fix: 'اشترِ بن بتاريخ تحميص. المثالي: 7–30 يوم. الحد: 6 أسابيع.',
    priority: 2
  },
  {
    id: 'bm08',
    mistake: 'يصبّ ماء على جوانب الفلتر',
    mistakeEn: 'Pouring water on filter walls',
    icon: '⬆️',
    impact: 'الماء ينزل بدون ما يلمس البن = ماء بدون نكهة يخفف القهوة',
    fix: 'صبّ بمنطقة بحجم عملة معدنية بالنص. لا تلمس الفلتر أبداً.',
    priority: 3
  },
  {
    id: 'bm09',
    mistake: 'يغيّر كل شي مرة وحدة',
    mistakeEn: 'Changing multiple variables at once',
    icon: '🎲',
    impact: 'ما تعرف وش اللي حسّن أو خرّب — ضياع',
    fix: 'غيّر متغير واحد بس كل مرة. سجّل اللي تسويه. قارن.',
    priority: 3
  },
  {
    id: 'bm10',
    mistake: 'ما يسخّن الأدوات',
    mistakeEn: 'Not preheating equipment',
    icon: '🥶',
    impact: 'الأدوات الباردة تمتص 3–8°C من الماء = استخلاص ناقص',
    fix: 'اشطف الفلتر + الـV60 + السيرفر + الكوب بماء مغلي قبل تبدأ.',
    priority: 3
  }
];


// ─────────────────────────────────────────────────────────────────────────
// EXPORT (for use in the app)
// ─────────────────────────────────────────────────────────────────────────

// If using as ES module:
// export { TASTE_PROBLEMS, BED_ANALYSIS, BREW_VARIABLES, SEASONAL_TIPS, DIAGNOSIS_FLOW, EXTRACTION_COMPASS, BEGINNER_MISTAKES };

// If embedding in HTML via <script> tag, all constants are already global.
// Access them directly: TASTE_PROBLEMS[0].symptom, BED_ANALYSIS[1].meaning, etc.
