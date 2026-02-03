/**
 * أبو عابد بوكس - السيرفر V4
 * Node.js + Express + Socket.IO
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ═══════════════════════════════════════════════════════════
// البيانات والمحتوى
// ═══════════════════════════════════════════════════════════

const rooms = new Map();
const AVATARS = ['😎', '🤠', '🥳', '😈', '🤖', '👻', '🦊', '🐸', '🦁', '🐼'];
const COLORS = ['#E91E8C', '#4ECDC4', '#FFD93D', '#6BCB77', '#FF6B35', '#667eea', '#f093fb', '#43e97b', '#fa709a', '#00d4ff'];

// أسئلة رد سريع (Quiplash)
const quiplashQuestions = [
  "ما هو أسوأ شي ممكن يقوله لك أبوك بعد ما تفشل في الاختبار؟",
  "ما هو الشي اللي ما تبي أمك تشوفه في جوالك؟",
  "ما هو أغرب سبب ممكن يخليك تتأخر عن الدوام؟",
  "ما هو الشي اللي يسويه السعودي أول ما يصحى من النوم؟",
  "ما هو أسوأ اسم ممكن تسميه مطعم كبسة؟",
  "ما هو الشي اللي ما تقوله في مقابلة عمل؟",
  "ما هو أغرب شي ممكن تلاقيه في ثلاجة جارك؟",
  "ما هو الشي اللي يفكر فيه البعير وهو ماشي في الصحراء؟",
  "ما هو أسوأ شي ممكن يصير في حفل زواج سعودي؟",
  "ما هي أغرب هدية ممكن تجيبها لخالتك؟",
  "ما هو الشي اللي ما تقوله لشرطي المرور؟",
  "ما هو أسوأ وقت عشان تطلب زيادة راتب؟",
  "ما هو الشي اللي يخلي البنك يرفض قرضك؟",
  "ما هو أغرب شي ممكن تكتبه في السيرة الذاتية؟",
  "ما هو أسوأ رد على 'كيفك؟'",
  "ما هو الشي اللي يفكر فيه الموظف الساعة 4:59؟",
  "ما هو أغرب سبب للغياب عن المدرسة؟",
  "ما هو أسوأ اسم لتطبيق توصيل طعام؟",
  "ما هو الشي اللي يسويه السعودي لما يشوف خصم 90%؟",
  "ما هو أغرب شي ممكن تلاقيه في شنطة معلمك؟"
];

// أسئلة خمّن النسبة (Guesspionage)
const guesspionageQuestions = [
  { q: "كم نسبة السعوديين اللي يشربون قهوة كل صباح؟", a: 78 },
  { q: "كم نسبة الناس اللي يستخدمون جوالهم وهم على السفرة؟", a: 65 },
  { q: "كم نسبة اللي يحبون الكبسة أكثر من المندي؟", a: 52 },
  { q: "كم نسبة الشباب اللي يلعبون ألعاب فيديو يومياً؟", a: 45 },
  { q: "كم نسبة اللي يفضلون السفر داخل السعودية على الخارج؟", a: 35 },
  { q: "كم نسبة اللي يشوفون أنفسهم كريمين جداً؟", a: 82 },
  { q: "كم نسبة اللي ما يردون على مكالمات أرقام غريبة؟", a: 73 },
  { q: "كم نسبة اللي يأخرون المنبه كل صباح؟", a: 68 },
  { q: "كم نسبة اللي يحبون الحر أكثر من البرد؟", a: 28 },
  { q: "كم نسبة اللي راحوا العلا؟", a: 22 },
  { q: "كم نسبة اللي يستخدمون كاش بدل البطاقة؟", a: 25 },
  { q: "كم نسبة اللي يحطون السكر في الشاي؟", a: 71 },
  { q: "كم نسبة اللي عندهم أكثر من 500 صديق في السوشال ميديا؟", a: 58 },
  { q: "كم نسبة اللي يفضلون الأكل البيت على المطاعم؟", a: 62 },
  { q: "كم نسبة اللي ناموا في الدوام أو المحاضرة؟", a: 47 },
  { q: "كم نسبة اللي يشوفون إن رواتبهم ما تكفي؟", a: 76 },
  { q: "كم نسبة اللي جربوا الدايت ورجعوا؟", a: 81 },
  { q: "كم نسبة اللي يحبون القطط أكثر من الكلاب؟", a: 67 },
  { q: "كم نسبة اللي يقرأون كتب بانتظام؟", a: 18 },
  { q: "كم نسبة اللي يمارسون رياضة أسبوعياً؟", a: 32 }
];

// مهام المزيّف (Fakin' It)
const fakinItTasks = {
  handsOfTruth: [
    "ارفع يدك إذا سرقت أكل من الثلاجة وأنكرت",
    "ارفع يدك إذا كذبت على أهلك عن مكانك",
    "ارفع يدك إذا تطنشت رسالة عمداً",
    "ارفع يدك إذا أكلت شي وقلت ما أكلت",
    "ارفع يدك إذا نمت في محاضرة أو اجتماع",
    "ارفع يدك إذا سويت نفسك مريض عشان ما تروح",
    "ارفع يدك إذا خذيت شي من أخوك بدون إذن",
    "ارفع يدك إذا قلت بجي وما جيت",
    "ارفع يدك إذا حطيت فلتر مبالغ فيه بصورتك",
    "ارفع يدك إذا تجسست على جوال أحد"
  ],
  numberPressure: [
    "كم مرة تفتح الثلاجة في اليوم؟",
    "كم ساعة تقضي على الجوال يومياً؟",
    "كم صديق مقرب عندك فعلاً؟",
    "كم مرة سافرت هالسنة؟",
    "كم كوب قهوة/شاي تشرب باليوم؟",
    "كم مرة غيرت صورة بروفايلك هالشهر؟",
    "كم لغة تتكلم؟",
    "كم مرة تأخرت عن موعد هالأسبوع؟",
    "كم جهاز إلكتروني عندك؟",
    "كم ساعة تنام في اليوم؟"
  ],
  faceValue: [
    "سوِّ وجه الواحد لما يشوف الراتب",
    "سوِّ وجه اللي نسي جواله بالبيت",
    "سوِّ وجه اللي أكل شي حار",
    "سوِّ وجه المتفاجئ",
    "سوِّ وجه اللي ما نام",
    "سوِّ وجه الخجلان",
    "سوِّ وجه الزعلان",
    "سوِّ وجه اللي شاف شي مقرف",
    "سوِّ وجه الضحكة المزيفة",
    "سوِّ وجه التفكير العميق"
  ],
  youGottaPoint: [
    "أشر على الشخص اللي يكذب أكثر",
    "أشر على الشخص الأكثر كرم",
    "أشر على الشخص اللي يتأخر دايماً",
    "أشر على الشخص الأذكى",
    "أشر على الشخص اللي يغضب بسرعة",
    "أشر على الشخص الأطرف",
    "أشر على الشخص اللي يحب النوم",
    "أشر على الشخص الأهدى",
    "أشر على الشخص اللي يحب الأكل",
    "أشر على الشخص اللي يسولف كثير"
  ]
};

// أسئلة حفلة القاتل (Trivia Murder Party)
const triviaMurderQuestions = [
  { q: "ما هي عاصمة المملكة العربية السعودية؟", o: ["الرياض", "جدة", "مكة", "الدمام"], c: 0 },
  { q: "كم عدد أيام السنة الميلادية؟", o: ["365", "364", "366", "360"], c: 0 },
  { q: "ما هو أكبر محيط في العالم؟", o: ["المحيط الهادئ", "المحيط الأطلسي", "المحيط الهندي", "المحيط المتجمد"], c: 0 },
  { q: "من هو مؤسس المملكة العربية السعودية؟", o: ["الملك عبدالعزيز", "الملك سعود", "الملك فيصل", "الملك خالد"], c: 0 },
  { q: "كم عدد الكواكب في المجموعة الشمسية؟", o: ["8", "9", "7", "10"], c: 0 },
  { q: "ما هي اللغة الرسمية في البرازيل؟", o: ["البرتغالية", "الإسبانية", "الإنجليزية", "الفرنسية"], c: 0 },
  { q: "في أي سنة تأسست المملكة العربية السعودية؟", o: ["1932", "1925", "1945", "1950"], c: 0 },
  { q: "ما هو العنصر الأكثر وفرة في الكون؟", o: ["الهيدروجين", "الأكسجين", "الكربون", "الحديد"], c: 0 },
  { q: "كم عدد اللاعبين في فريق كرة القدم؟", o: ["11", "10", "12", "9"], c: 0 },
  { q: "ما هو أطول نهر في العالم؟", o: ["نهر النيل", "نهر الأمازون", "نهر المسيسبي", "نهر اليانغتسي"], c: 0 },
  { q: "ما هي الدولة الأكبر مساحة في العالم؟", o: ["روسيا", "كندا", "الصين", "أمريكا"], c: 0 },
  { q: "كم عدد القارات في العالم؟", o: ["7", "6", "5", "8"], c: 0 },
  { q: "ما هو الحيوان الأسرع في العالم؟", o: ["الفهد", "الأسد", "النمر", "الغزال"], c: 0 },
  { q: "ما هي عملة اليابان؟", o: ["الين", "الدولار", "اليوان", "الوون"], c: 0 },
  { q: "كم عدد أركان الإسلام؟", o: ["5", "4", "6", "3"], c: 0 }
];

// أسئلة كشف الكذاب (Fibbage)
const fibbageQuestions = [
  { q: "السعودية تستورد _____ من أستراليا سنوياً.", a: "الجمال" },
  { q: "أول مطعم ماكدونالدز في السعودية افتتح في مدينة _____.", a: "الرياض" },
  { q: "مساحة الربع الخالي تعادل مساحة دولة _____.", a: "فرنسا" },
  { q: "أول فيلم سعودي عُرض في السينما كان اسمه _____.", a: "وجدة" },
  { q: "أكبر واحة في العالم موجودة في _____.", a: "الأحساء" },
  { q: "السعودية فيها أكثر من _____ مليون نخلة.", a: "30" },
  { q: "الملك عبدالعزيز وحّد السعودية وعمره _____ سنة.", a: "31" },
  { q: "أول قطار في السعودية ربط بين الرياض و_____.", a: "الدمام" },
  { q: "برج الساعة في مكة فيه أكبر _____ في العالم.", a: "ساعة" },
  { q: "السعودية تنتج _____ مليون برميل نفط يومياً.", a: "10" }
];

// كلمات الرسم (Drawful)
const drawfulPrompts = [
  "بعير يركب سيارة", "شايب يلعب فورتنايت", "كبسة طايرة",
  "صقر يشرب قهوة", "شماغ على رأس قطة", "برج المملكة يرقص",
  "جمل في المول", "مندي يطير في الفضاء", "خروف يقود طيارة",
  "شيخ يلعب بلايستيشن", "فنجال قهوة عملاق", "نخلة تمشي",
  "بدوي على سكيت بورد", "فلافل بأجنحة", "شاورما تتكلم"
];

// ═══════════════════════════════════════════════════════════
// الدوال المساعدة
// ═══════════════════════════════════════════════════════════

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createPlayer(id, name, isHost = false) {
  const index = Math.floor(Math.random() * AVATARS.length);
  return {
    id, name,
    avatar: AVATARS[index],
    color: COLORS[index],
    score: 0,
    isHost,
    isReady: false,
    isAlive: true,
    currentAnswer: null
  };
}

function getPlayerList(room) {
  return Array.from(room.players.values()).map(p => ({
    id: p.id, name: p.name, avatar: p.avatar, color: p.color,
    score: p.score, isHost: p.isHost, isReady: p.isReady, isAlive: p.isAlive
  }));
}

function countAnswered(room) {
  return Array.from(room.players.values()).filter(p => p.currentAnswer !== null).length;
}

function allPlayersAnswered(room) {
  return Array.from(room.players.values()).every(p => p.currentAnswer !== null);
}

// ═══════════════════════════════════════════════════════════
// Socket.IO Events
// ═══════════════════════════════════════════════════════════

io.on('connection', (socket) => {
  console.log('✅ لاعب جديد:', socket.id);

  // إنشاء غرفة
  socket.on('createRoom', (playerName) => {
    const code = generateRoomCode();
    const room = {
      code,
      hostId: socket.id,
      players: new Map(),
      state: 'lobby',
      currentGame: null,
      currentRound: 0,
      maxRounds: 3,
      gameData: {},
      createdAt: Date.now()
    };
    room.players.set(socket.id, createPlayer(socket.id, playerName, true));
    rooms.set(code, room);
    socket.join(code);
    socket.emit('roomCreated', { code, players: getPlayerList(room) });
    console.log('🏠 غرفة جديدة:', code);
  });

  // الانضمام لغرفة
  socket.on('joinRoom', ({ code, playerName }) => {
    const room = rooms.get(code?.toUpperCase());
    if (!room) return socket.emit('error', { message: 'الغرفة غير موجودة!' });
    if (room.players.size >= 10) return socket.emit('error', { message: 'الغرفة ممتلئة!' });
    if (room.state !== 'lobby') return socket.emit('error', { message: 'اللعبة بدأت!' });
    
    room.players.set(socket.id, createPlayer(socket.id, playerName));
    socket.join(code.toUpperCase());
    socket.emit('roomJoined', { code: room.code, players: getPlayerList(room) });
    io.to(room.code).emit('playerJoined', { players: getPlayerList(room) });
  });

  // تجهيز
  socket.on('playerReady', (code) => {
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (player) {
      player.isReady = !player.isReady;
      io.to(code).emit('playerUpdated', { players: getPlayerList(room) });
    }
  });

  // بدء اللعبة
  socket.on('startGame', ({ code, game }) => {
    const room = rooms.get(code);
    if (!room || socket.id !== room.hostId) return;
    if (room.players.size < 2) return socket.emit('error', { message: 'تحتاج لاعبين على الأقل!' });
    
    room.currentGame = game;
    room.currentRound = 0;
    room.state = 'playing';
    room.gameData = {};
    room.players.forEach(p => {
      p.currentAnswer = null;
      p.isAlive = true;
    });
    
    io.to(code).emit('gameStarted', { game, players: getPlayerList(room) });
    setTimeout(() => startGameRound(room), 1000);
  });

  // إرسال إجابة
  socket.on('submitAnswer', ({ code, answer }) => {
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (player && player.currentAnswer === null) {
      player.currentAnswer = answer;
      io.to(code).emit('playerAnswered', { 
        playerId: socket.id, 
        count: countAnswered(room),
        total: room.players.size
      });
      if (allPlayersAnswered(room)) {
        setTimeout(() => handleAllAnswered(room), 500);
      }
    }
  });

  // إرسال تصويت
  socket.on('submitVote', ({ code, voteId }) => {
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (player) {
      player.currentAnswer = voteId;
      if (allPlayersAnswered(room)) {
        setTimeout(() => calculateResults(room), 500);
      }
    }
  });

  // الجولة التالية
  socket.on('requestNextRound', (code) => {
    const room = rooms.get(code);
    if (!room || socket.id !== room.hostId) return;
    
    room.currentRound++;
    room.players.forEach(p => p.currentAnswer = null);
    room.gameData = {};
    
    if (room.currentRound >= room.maxRounds) {
      endGame(room);
    } else {
      startGameRound(room);
    }
  });

  // العودة للوبي
  socket.on('backToLobby', (code) => {
    const room = rooms.get(code);
    if (!room) return;
    
    room.state = 'lobby';
    room.currentGame = null;
    room.currentRound = 0;
    room.gameData = {};
    room.players.forEach(p => {
      p.score = 0;
      p.isAlive = true;
      p.currentAnswer = null;
    });
    
    io.to(code).emit('returnedToLobby', { players: getPlayerList(room) });
  });

  // قطع الاتصال
  socket.on('disconnect', () => {
    rooms.forEach((room, code) => {
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);
        if (room.players.size === 0) {
          rooms.delete(code);
        } else {
          if (room.hostId === socket.id) {
            const newHost = room.players.values().next().value;
            newHost.isHost = true;
            room.hostId = newHost.id;
          }
          io.to(code).emit('playerLeft', { players: getPlayerList(room) });
        }
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════
// Game Logic
// ═══════════════════════════════════════════════════════════

function startGameRound(room) {
  room.players.forEach(p => p.currentAnswer = null);
  
  switch (room.currentGame) {
    case 'quiplash': startQuiplashRound(room); break;
    case 'guesspionage': startGuesspionageRound(room); break;
    case 'fakinit': startFakinItRound(room); break;
    case 'triviamurder': startTriviaMurderRound(room); break;
    case 'fibbage': startFibbageRound(room); break;
    case 'drawful': startDrawfulRound(room); break;
  }
}

function startQuiplashRound(room) {
  const question = quiplashQuestions[Math.floor(Math.random() * quiplashQuestions.length)];
  room.gameData.question = question;
  io.to(room.code).emit('quiplashQuestion', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question,
    timeLimit: 60
  });
}

function startGuesspionageRound(room) {
  const q = guesspionageQuestions[Math.floor(Math.random() * guesspionageQuestions.length)];
  room.gameData.question = q;
  io.to(room.code).emit('guesspionageQuestion', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question: q.q,
    timeLimit: 30
  });
}

function startFakinItRound(room) {
  const categories = Object.keys(fakinItTasks);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const tasks = fakinItTasks[category];
  const task = tasks[Math.floor(Math.random() * tasks.length)];
  
  const playerIds = Array.from(room.players.keys());
  const fakerId = playerIds[Math.floor(Math.random() * playerIds.length)];
  
  room.gameData.category = category;
  room.gameData.task = task;
  room.gameData.fakerId = fakerId;
  
  const categoryNames = {
    handsOfTruth: '✋ يد الحقيقة',
    numberPressure: '🔢 ضغط الأرقام',
    faceValue: '😀 قيمة الوجه',
    youGottaPoint: '👉 أشر عليه'
  };
  
  room.players.forEach((player, id) => {
    io.to(id).emit('fakinItTask', {
      round: room.currentRound + 1,
      maxRounds: room.maxRounds,
      category: categoryNames[category],
      task: id === fakerId ? null : task,
      isFaker: id === fakerId,
      timeLimit: 15
    });
  });
}

function startTriviaMurderRound(room) {
  const q = triviaMurderQuestions[Math.floor(Math.random() * triviaMurderQuestions.length)];
  room.gameData.question = q;
  io.to(room.code).emit('triviaMurderQuestion', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question: q.q,
    options: q.o,
    timeLimit: 20
  });
}

function startFibbageRound(room) {
  const q = fibbageQuestions[Math.floor(Math.random() * fibbageQuestions.length)];
  room.gameData.question = q;
  io.to(room.code).emit('fibbageQuestion', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question: q.q,
    timeLimit: 60
  });
}

function startDrawfulRound(room) {
  const prompt = drawfulPrompts[Math.floor(Math.random() * drawfulPrompts.length)];
  room.gameData.prompt = prompt;
  io.to(room.code).emit('drawfulPrompt', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    prompt,
    timeLimit: 90
  });
}

function handleAllAnswered(room) {
  switch (room.currentGame) {
    case 'quiplash': startVotingPhase(room); break;
    case 'guesspionage': calculateGuesspionageResults(room); break;
    case 'fakinit': startFakinItVoting(room); break;
    case 'triviamurder': calculateTriviaMurderResults(room); break;
    case 'fibbage': startFibbageVoting(room); break;
    default: calculateResults(room);
  }
}

function startVotingPhase(room) {
  const players = Array.from(room.players.values()).filter(p => p.currentAnswer);
  if (players.length < 2) return calculateResults(room);
  
  const shuffled = shuffle(players);
  room.gameData.matchup = [shuffled[0].id, shuffled[1].id];
  
  const answers = room.gameData.matchup.map(id => {
    const p = room.players.get(id);
    return { playerId: id, answer: p.currentAnswer };
  });
  
  room.players.forEach(p => p.currentAnswer = null);
  
  io.to(room.code).emit('votingPhase', {
    question: room.gameData.question,
    answers: shuffle(answers),
    timeLimit: 30
  });
}

function startFakinItVoting(room) {
  room.players.forEach(p => p.currentAnswer = null);
  io.to(room.code).emit('fakinItVoting', {
    task: room.gameData.task,
    players: getPlayerList(room),
    timeLimit: 20
  });
}

function startFibbageVoting(room) {
  const options = [];
  room.players.forEach((p, id) => {
    if (p.currentAnswer) {
      options.push({ id, text: p.currentAnswer, isCorrect: false });
    }
  });
  options.push({ id: 'correct', text: room.gameData.question.a, isCorrect: true });
  
  room.gameData.options = shuffle(options);
  room.players.forEach(p => p.currentAnswer = null);
  
  io.to(room.code).emit('fibbageVoting', {
    question: room.gameData.question.q,
    options: room.gameData.options.map(o => ({ id: o.id, text: o.text })),
    timeLimit: 30
  });
}

function calculateResults(room) {
  switch (room.currentGame) {
    case 'quiplash': calculateQuiplashResults(room); break;
    case 'fakinit': calculateFakinItResults(room); break;
    case 'fibbage': calculateFibbageResults(room); break;
    default: sendRoundResults(room);
  }
}

function calculateQuiplashResults(room) {
  const votes = {};
  room.gameData.matchup.forEach(id => votes[id] = 0);
  
  room.players.forEach((p, id) => {
    if (!room.gameData.matchup.includes(id) && p.currentAnswer) {
      votes[p.currentAnswer] = (votes[p.currentAnswer] || 0) + 1;
    }
  });
  
  Object.entries(votes).forEach(([id, count]) => {
    const player = room.players.get(id);
    if (player) player.score += count * 100;
  });
  
  sendRoundResults(room);
}

function calculateGuesspionageResults(room) {
  const correctAnswer = room.gameData.question.a;
  
  room.players.forEach(p => {
    if (p.currentAnswer !== null) {
      const diff = Math.abs(parseInt(p.currentAnswer) - correctAnswer);
      if (diff === 0) p.score += 1000;
      else if (diff <= 5) p.score += 500;
      else if (diff <= 10) p.score += 300;
      else if (diff <= 20) p.score += 100;
    }
  });
  
  io.to(room.code).emit('roundResults', {
    game: 'guesspionage',
    correctAnswer,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

function calculateFakinItResults(room) {
  const votes = {};
  room.players.forEach(p => {
    if (p.currentAnswer) {
      votes[p.currentAnswer] = (votes[p.currentAnswer] || 0) + 1;
    }
  });
  
  let maxVotes = 0, mostVotedId = null;
  Object.entries(votes).forEach(([id, count]) => {
    if (count > maxVotes) { maxVotes = count; mostVotedId = id; }
  });
  
  const caught = mostVotedId === room.gameData.fakerId;
  const faker = room.players.get(room.gameData.fakerId);
  
  if (caught) {
    room.players.forEach((p, id) => {
      if (p.currentAnswer === room.gameData.fakerId) p.score += 500;
    });
  } else {
    faker.score += 1000;
  }
  
  io.to(room.code).emit('roundResults', {
    game: 'fakinit',
    caught,
    fakerName: faker.name,
    fakerId: room.gameData.fakerId,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

function calculateTriviaMurderResults(room) {
  const correct = room.gameData.question.c;
  const newlyDead = [];
  
  room.players.forEach(p => {
    if (p.isAlive) {
      if (p.currentAnswer === correct) {
        p.score += 100;
      } else {
        p.isAlive = false;
        newlyDead.push(p.name);
      }
    }
  });
  
  io.to(room.code).emit('roundResults', {
    game: 'triviamurder',
    correctAnswer: room.gameData.question.o[correct],
    newlyDead,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

function calculateFibbageResults(room) {
  room.players.forEach(p => {
    if (p.currentAnswer === 'correct') {
      p.score += 500;
    }
    room.players.forEach((other, otherId) => {
      if (other.currentAnswer === p.id && otherId !== p.id) {
        p.score += 250;
      }
    });
  });
  
  sendRoundResults(room);
}

function sendRoundResults(room) {
  io.to(room.code).emit('roundResults', {
    game: room.currentGame,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

function endGame(room) {
  room.state = 'results';
  const results = getPlayerList(room).sort((a, b) => b.score - a.score);
  io.to(room.code).emit('gameEnded', { finalResults: results, winner: results[0] });
}

// ═══════════════════════════════════════════════════════════
// تشغيل السيرفر
// ═══════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║     🎮 أبو عابد بوكس V4                          ║
║                                                   ║
║     ✅ السيرفر شغال!                             ║
║     🌐 http://localhost:${PORT}                    ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

// تنظيف الغرف القديمة
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  rooms.forEach((room, code) => {
    if (room.createdAt < oneHourAgo && room.state === 'lobby') {
      rooms.delete(code);
    }
  });
}, 3600000);
