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
      '{name} ماسك الصدارة!',
    ],
    comeback: [
      '{name} رجع بقوة! ما استسلم! 🔥',
    ],
    tie: [
      'تعادل! الأمور حامية! 🔥',
    ],
    lastRound: [
      'آخر جولة! كل شي ممكن يتغير!',
      'الجولة الأخيرة! من بيفوز؟!',
    ],
    winner: [
      'مبرووووك يا {name}! أنت البطل! 🏆🎉',
      '{name} فاز! يا وحش! 🎊',
      'الفائز هو... {name}! ألف مبروك!',
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
    } else if (lead === 0) {
      comments.push(generateCommentary('results', 'tie'));
    }
  }

  if (data.isLastRound) {
    comments.push(generateCommentary('results', 'lastRound'));
  }

  return comments.filter(Boolean);
}

module.exports = { COMMENTARY, pickLine, generateCommentary, generateResultCommentary };
