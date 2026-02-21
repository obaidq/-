/**
 * Abu Abed Commentary Engine
 * Text-based reactive host commentary in Saudi Arabic
 * Triggered by game events, adds "show feel" / illusion of awareness
 */

const COMMENTARY = {
  // ─── Lobby ───
  lobby: {
    playerJoin: [
      'يا هلا بـ{name}! حياك الله 🤙',
      'وصل {name}! الحين صارت الحفلة حفلة',
      '{name} دخل الغرفة! يلا نحمّس',
      'الله يحييك يا {name}! 🎉',
      'أهلين يا {name}! قاعد نستناك',
    ],
    playerLeave: [
      '{name} طلع... الله يوفقه',
      'راح {name}... خسارة عليه',
      '{name} سحب... يلا عوضنا الله',
    ],
    fewPlayers: [
      'لازم على الأقل لاعبين عشان نبدأ!',
      'ندور ناس زيادة... شاركوا الكود!',
    ],
    gameStarting: [
      'خلاص نبدأ! يلا بسم الله! 🎮',
      'الحين يبدأ الجد! استعدوا!',
      'بسم الله... يلا نلعب!',
    ],
  },

  // ─── Timer / Pacing ───
  timer: {
    halfTime: [
      'نص الوقت راح! ⏰',
      'يلا يلا الوقت يركض!',
    ],
    lastSeconds: [
      'باقي ثواني! يلا بسرعة! 🔥',
      'الوقت قرب يخلص!',
      'أخر فرصة!',
    ],
    allAnswered: [
      'كلكم جاوبتوا! يلا نشوف النتايج',
      'خلصنا! وش بتطلع النتيجة يا ترى؟',
      'تمام... كل واحد قال كلمته!',
    ],
    timeout: [
      'خلص الوقت! اللي ما جاوب فاته القطار 🚂',
      'انتهى الوقت! يلا نكمل',
    ],
  },

  // ─── Quiplash ───
  quiplash: {
    questionShow: [
      'السؤال قدامكم... وريونا إبداعكم! ✍️',
      'يلا فكروا... والأطرف يفوز!',
    ],
    votingStart: [
      'وقت التصويت! وش رأيكم؟ 🗳️',
      'اختاروا الأقوى!',
    ],
    unanimousVote: [
      '⚡ QUIPLASH! إجماع كامل! يا سلام! ⚡',
      '⚡ كلهم صوتوا لك! أنت وحش! ⚡',
    ],
    closeCall: [
      'والله قريبة! كانت حامية 🔥',
      'بفارق صوت واحد! درامااا',
    ],
    noAnswers: [
      'ما أحد كتب شي؟! يا جماعة الخير! 😅',
    ],
  },

  // ─── Guesspionage ───
  guesspionage: {
    featuredChosen: [
      '{name} هو المميز! يلا خمّن بدقة 🎯',
      'دور {name}! وريّنا شطارتك بالأرقام',
    ],
    guessClose: [
      'يا سلاااام! قريب مرة! 🎯',
      'ماشاء الله! تخمين ممتاز!',
      'أبو عابد يقول: هذا عبقري! 🧠',
    ],
    guessExact: [
      '🎯🎯🎯 بالضبط! مثالي! كيف عرفت؟!',
      'يا رجال بالنقطة! أنت جاسوس؟!',
    ],
    guessFar: [
      'بعيييد! ما توقعت منك كذا 😂',
      'طيب... حاول مرة ثانية... أوه ما فيه مرة ثانية! 😅',
    ],
    muchHigherLower: [
      'الجولة الثانية! الحين فيه "أعلى بكثير" و "أقل بكثير"! 🎲',
      'انتبهوا! الحين الرهان صار أقوى!',
    ],
    challengeStart: [
      'أعلى ولا أقل؟ راهنوا بذكاء! 📊',
      'فكروا... الجواب الحقيقي وين؟',
    ],
    allBetCorrect: [
      'كلكم صح! يا حلوكم! 🎉',
    ],
    allBetWrong: [
      'كلكم غلط! 😂 ما توقعتوا!',
    ],
    finalRound: [
      '🏆 الجولة الأخيرة! اختاروا أشهر 3 إجابات!',
      'آخر فرصة للنقاط! ركزوا!',
    ],
  },

  // ─── Fakin' It ───
  fakinit: {
    taskStart: [
      'المزيّف بينكم... من هو؟! 🕵️',
      'واحد ما يدري وش المطلوب... انتبهوا!',
    ],
    voteStart: [
      'وقت الاتهام! من المزيّف؟',
      'صوّتوا! من كان يتصنّع؟ 🔍',
    ],
    fakerCaught: [
      'انكشف المزيّف! {name} ما قدر يخبّي! 🎉',
      'مسكناك يا {name}! 😂',
    ],
    fakerEscaped: [
      '{name} نجا! أسطورة التمثيل! 🎭',
      'المزيّف فلت! محد شك فيه!',
    ],
    handsOfTruth: ['✋ يلا ارفعوا أيديكم!'],
    numberPressure: ['🔢 ارفعوا أصابعكم حسب جوابكم!'],
    faceValue: ['😀 وريونا وجوهكم!'],
    youGottaPoint: ['👉 أشيروا على اللاعب!'],
  },

  // ─── Trivia Murder ───
  triviamurder: {
    questionShow: [
      'أجب صح... أو مت! 💀',
      'السؤال قدامكم... حياتكم على المحك!',
    ],
    playerDied: [
      'مات {name}! 💀 الله يرحمه...',
      '{name} راح... بس فيه أمل بتحدي الموت!',
    ],
    multipleDied: [
      'يا ويلي! {count} لاعبين ماتوا! 💀💀',
    ],
    nobodyDied: [
      'كلكم نجيتوا! ما شاء الله عليكم 💪',
    ],
    deathChallenge: [
      '💀 تحدي الموت! الفرصة الأخيرة للعودة!',
    ],
    revived: [
      '{name} رجع من الموت! 🎉 يا وحش!',
    ],
  },

  // ─── Fibbage ───
  fibbage: {
    writeYourLie: [
      'اكتبوا كذبة مقنعة! الأذكى يفوز 🤥',
      'يلا كذبوا... بس خلوها مقنعة!',
    ],
    voting: [
      'وين الحقيقة؟ ركزوا! 🔍',
      'اختاروا الإجابة الصحيحة... لو تقدرون!',
    ],
    nobodyFooled: [
      'محد انخدع! يبيلكم تتمرنون أكثر 😅',
    ],
    manyFooled: [
      'كثير انخدعوا! الكذبة كانت مقنعة! 🤥',
    ],
    truthFound: [
      'صح! هذي الإجابة الحقيقية! ✅',
    ],
  },

  // ─── Drawful ───
  drawful: {
    yourTurn: [
      'دورك ترسم! حاول ما تضحك 😂🎨',
      'يلا ارسم! والباقين يخمنون!',
    ],
    guessPhase: [
      'وش هالرسمة؟! اكتبوا تخمينكم! 🤔',
      'خمنوا... اللي يعرف يكسب!',
    ],
    nobodyGuessed: [
      'محد عرف! الرسمة كانت صعبة! 😂',
    ],
    manyGuessed: [
      'كثير عرفوا! الرسام فنان! 🎨',
    ],
  },

  // ─── Results / Scoring ───
  results: {
    bigLead: [
      '{name} متقدم بفارق كبير! 🏆',
      '{name} ماسك الصدارة! من يقدر يوقفه؟',
      '{name} طاير بالنقاط! يا سلام!',
    ],
    comeback: [
      '{name} رجع بقوة! ما استسلم! 🔥',
      '{name} صاعد! الحين صارت المنافسة حامية!',
    ],
    tie: [
      'تعادل! الأمور حامية! 🔥',
      'متساوين! من بيكسر التعادل؟',
    ],
    lastRound: [
      'آخر جولة! كل شي ممكن يتغير!',
      'الجولة الأخيرة! من بيفوز؟!',
      'آخر فرصة! ركزوا يا جماعة!',
    ],
    winner: [
      'مبرووووك يا {name}! أنت البطل! 🏆🎉',
      '{name} فاز! يا وحش! 🎊',
      'الفائز هو... {name}! ألف مبروك!',
    ],
    zeroPoints: [
      'محد جاب نقطة! 😅 كيف يعني؟!',
      'صفر نقاط! يبيلكم تتمرنون أكثر!',
    ],
    scoreSurge: [
      '{name} جاب {points} نقطة! قوي والله! 💪',
      'يا رجال! {name} كسب {points} دفعة وحدة!',
    ],
    newLeader: [
      '{name} صار الأول! تبدّل الترتيب! 🔄',
      'انقلبت الموازين! {name} قفز للصدارة!',
    ],
  },

  // ─── Audience ───
  audience: {
    joined: [
      'عندنا جمهور! حياكم الله يا متفرجين! 👀',
      'الجمهور وصل! الحين صارت الحفلة أحلى!',
    ],
    bigAudience: [
      'يا سلام! {count} متفرجين! صرنا مشاهير! 🌟',
    ],
  },

  // ─── General Hype / Random interjections ───
  hype: {
    roundStart: [
      'يلا بسم الله! الجولة الجديدة بدأت!',
      'استعدوا... انتبهوا... يلا!',
      'جولة جديدة! فرصة جديدة!',
    ],
    midGame: [
      'الحين بدأت الأمور تحمى! 🔥',
      'المنافسة على أشدها!',
      'يا جماعة الخير! وش هالمستوى!',
    ],
    lateGame: [
      'قربنا ننتهي! كل نقطة تفرق!',
      'الجولات الأخيرة! لا أحد يتساهل!',
    ],
  },

  // ─── Between-round transitions (Abu Abed quips) ───
  transition: {
    general: [
      'أبو عابد يقول: اللي ما يغامر ما يكسب!',
      'خلوكم جاهزين... الجاي أحلى!',
      'حركة سريعة... واللعبة مستمرة!',
      'شدوا حيلكم يا شباب!',
      'لا تنامون علي... الجولة الجاية حامية!',
      'أبو عابد يشرب شاهي ويراقبكم... 🍵',
      'من يقدر يقلب الطاولة؟',
      'اللي يضحك أخير يضحك كثير!',
      'الحين الجد بدأ... لا أحد يستهبل!',
      'نصيحة أبو عابد: لا تثق بأحد! 😏',
      'ترى أبو عابد شاف كل شي... لا تحاولون!',
      'اللي فات مات... ركزوا على الجاي!',
      'كل جولة فرصة جديدة... استغلوها!',
      'أبو عابد فخور فيكم... بس شوي! 😅',
      'بين الجولات نتنفس... وبعدين نرجع للحرب!',
    ],
    encouragement: [
      'ما فيه خسارة نهائية... فيه دروس! 📚',
      'حتى لو نقاطك قليلة... فيه أمل!',
      'أبو عابد يقول: الصبر مفتاح الفوز!',
      'لا تيأسون... أقوى اللاعبين يرجعون من بعيد!',
      'كل بطل عنده لحظة ضعف... المهم الرجعة!',
    ],
    competitive: [
      'من الأول؟ من الأخير؟ كله بيتغير! 🔄',
      'الفارق بسيط... كل نقطة تفرق!',
      'المركز الأول ما هو ضمان... أي واحد يقدر يقلبها!',
      'الحين وش رأيكم... من بيفاجئنا؟',
      'أبو عابد يتوقع مفاجأة... 🤔',
      'ترتيب اليوم ما يبين ترتيب باكر!',
    ],
    funny: [
      'أبو عابد راح يسوي فاصل إعلاني... بس ما عنده رعاة! 😂',
      'لو كان فيه جائزة لأحسن وجه مستغرب كان فاز الكل!',
      'ترى أبو عابد يعرف الإجابة... بس ما بيقول! 🤫',
      'نصيحة: لا تغشون... أبو عابد يراقب! 👀',
      'بسرعة قبل لا أبو عابد ينام! 😴',
      'هل تعلم؟ أبو عابد ما خسر أبداً... لأنه ما لعب! 😂',
      'أبو عابد: أنا بس أعلق... ما ألعب... الضغط كبير! 🤣',
      'تذكروا: المهم المشاركة... بس الفوز أحلى! 😏',
    ],
  },
};

/**
 * Pick a random line from an array, fill placeholders
 */
function pickLine(lines, vars) {
  if (!lines || lines.length === 0) return '';
  let line = lines[Math.floor(Math.random() * lines.length)];
  if (vars) {
    Object.entries(vars).forEach(([key, val]) => {
      line = line.replace(new RegExp('\\{' + key + '\\}', 'g'), val);
    });
  }
  return line;
}

/**
 * Generate commentary for a specific game event
 * Returns { text, delay } where delay is ms to wait before showing
 */
function generateCommentary(category, event, vars) {
  const cat = COMMENTARY[category];
  if (!cat) return null;
  const lines = cat[event];
  if (!lines) return null;
  const text = pickLine(lines, vars);
  if (!text) return null;
  return { text, icon: '🧔🏻' };
}

/**
 * Generate result-phase commentary based on game data
 */
function generateResultCommentary(game, data) {
  const comments = [];

  // Game-specific result commentary
  if (game === 'quiplash' && data.results) {
    const winner = data.results.find(r => r.quiplash);
    if (winner) {
      comments.push(generateCommentary('quiplash', 'unanimousVote'));
    } else if (data.results.length >= 2) {
      const diff = Math.abs((data.results[0]?.votes || 0) - (data.results[1]?.votes || 0));
      if (diff <= 1) comments.push(generateCommentary('quiplash', 'closeCall'));
    }
  }

  if (game === 'guesspionage' && data.playerResults) {
    const featured = data.playerResults.find(r => r.isFeatured);
    if (featured) {
      if (featured.diff === 0) {
        comments.push(generateCommentary('guesspionage', 'guessExact'));
      } else if (featured.diff <= 5) {
        comments.push(generateCommentary('guesspionage', 'guessClose'));
      } else if (featured.diff > 25) {
        comments.push(generateCommentary('guesspionage', 'guessFar'));
      }
    }
    const challengers = data.playerResults.filter(r => !r.isFeatured && r.bet);
    if (challengers.length > 0) {
      if (challengers.every(r => r.betCorrect)) {
        comments.push(generateCommentary('guesspionage', 'allBetCorrect'));
      } else if (challengers.every(r => !r.betCorrect)) {
        comments.push(generateCommentary('guesspionage', 'allBetWrong'));
      }
    }
  }

  if (game === 'fakinit') {
    if (data.caught) {
      comments.push(generateCommentary('fakinit', 'fakerCaught', { name: data.fakerName || '' }));
    } else {
      comments.push(generateCommentary('fakinit', 'fakerEscaped', { name: data.fakerName || '' }));
    }
  }

  if (game === 'triviamurder') {
    if (data.newlyDead && data.newlyDead.length > 1) {
      comments.push(generateCommentary('triviamurder', 'multipleDied', { count: data.newlyDead.length }));
    } else if (data.newlyDead && data.newlyDead.length === 1) {
      comments.push(generateCommentary('triviamurder', 'playerDied', { name: data.newlyDead[0].name }));
    } else {
      comments.push(generateCommentary('triviamurder', 'nobodyDied'));
    }
  }

  // Scoreboard commentary
  if (data.players && data.players.length >= 2) {
    const sorted = [...data.players].sort((a, b) => b.score - a.score);
    const lead = sorted[0].score - sorted[1].score;
    if (lead > 2000) {
      comments.push(generateCommentary('results', 'bigLead', { name: sorted[0].name }));
    } else if (lead === 0 && sorted[0].score > 0) {
      comments.push(generateCommentary('results', 'tie'));
    }

    // Detect score surge (someone gained 2000+ in one round)
    if (data.playerResults) {
      const topScorer = data.playerResults.reduce((max, pr) => pr.points > max.points ? pr : max, { points: 0 });
      if (topScorer.points >= 2000) {
        comments.push(generateCommentary('results', 'scoreSurge', {
          name: topScorer.playerName,
          points: topScorer.points
        }));
      }
    }

    // Zero points round
    if (data.playerResults && data.playerResults.every(pr => pr.points === 0)) {
      comments.push(generateCommentary('results', 'zeroPoints'));
    }
  }

  if (data.isLastRound) {
    comments.push(generateCommentary('results', 'lastRound'));
  }

  return comments.filter(Boolean);
}

/**
 * Generate a between-round transition quip from Abu Abed
 */
function generateTransitionQuip(context) {
  const trans = COMMENTARY.transition;
  if (!trans) return null;

  // Pick category based on context
  let pool;
  if (context && context.isLosing) {
    pool = trans.encouragement;
  } else if (context && context.isClose) {
    pool = trans.competitive;
  } else {
    // Mix general + funny for variety
    const r = Math.random();
    if (r < 0.4) pool = trans.general;
    else if (r < 0.7) pool = trans.funny;
    else if (r < 0.85) pool = trans.competitive;
    else pool = trans.encouragement;
  }

  const text = pickLine(pool, context);
  if (!text) return null;
  return { text, icon: '🧔🏻' };
}

module.exports = { COMMENTARY, pickLine, generateCommentary, generateResultCommentary, generateTransitionQuip };
