/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║              أبو عابد بوكس - السيرفر الرئيسي V5                ║
 * ║         Abu Abed Box - Saudi Arabic Party Game Platform          ║
 * ║                  Node.js + Express + Socket.IO                   ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 *
 * الألعاب المدعومة:
 *   ⚡ رد سريع (Quiplash)
 *   📊 خمّن النسبة (Guesspionage)
 *   🕵️ المزيّف (Fakin' It)
 *   💀 حفلة القاتل (Trivia Murder Party)
 *   🎭 كشف الكذاب (Fibbage)
 *   🎨 ارسم لي (Drawful)
 */

// ═══════════════════════════════════════════════════════════════════
// الاعتماديات والإعدادات الأساسية
// ═══════════════════════════════════════════════════════════════════

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { generateCommentary, generateResultCommentary } = require('./commentary');
const { filterText } = require('./profanity');

// ── Platform config (feature flags) ──
const CONFIG = {
  profanityMode: process.env.PROFANITY_MODE || 'moderate', // off | moderate | strict
  audienceVoteWeight: 0.5,  // audience votes count at 50%
  commentaryEnabled: true,
  familyMode: false, // when true: strict profanity + skip adult-themed questions
  // Note: extendedTimers is per-room (room._extendedTimers), toggled by host
};

const app = express();
const server = http.createServer(app);

// ── CORS: تقييد الأصول المسموحة ──
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : null; // null = السماح لكل الأصول في التطوير فقط

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS || '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// ── Rate Limiter لأحداث Socket ──
function createRateLimiter(maxPerSecond) {
  const clients = new Map();
  return function(socketId) {
    const now = Date.now();
    const record = clients.get(socketId);
    if (!record) {
      clients.set(socketId, { count: 1, resetAt: now + 1000 });
      return true;
    }
    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + 1000;
      return true;
    }
    record.count++;
    return record.count <= maxPerSecond;
  };
}

const rateLimiters = {
  submitAnswer: createRateLimiter(3),
  submitVote: createRateLimiter(3),
  sendEmoji: createRateLimiter(2),
  createRoom: createRateLimiter(1),
  joinRoom: createRateLimiter(2),
  submitDrawing: createRateLimiter(2)
};

/**
 * التحقق من صحة بيانات الرسم
 */
function validateDrawingData(drawing) {
  if (!drawing || typeof drawing !== 'string') return false;
  // حد أقصى 2MB للبيانات
  if (drawing.length > 2 * 1024 * 1024) return false;
  try {
    const strokes = JSON.parse(drawing);
    if (!Array.isArray(strokes)) return false;
    if (strokes.length > 500) return false;
    for (const stroke of strokes) {
      if (!stroke || !Array.isArray(stroke.points)) return false;
      if (stroke.points.length > 5000) return false;
      if (typeof stroke.color !== 'string' || stroke.color.length > 20) return false;
      if (typeof stroke.size !== 'number' || stroke.size < 1 || stroke.size > 50) return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

// تقديم الملفات الثابتة
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════
// تحميل المحتوى من ملف اللغة العربية
// ═══════════════════════════════════════════════════════════════════

const content = JSON.parse(fs.readFileSync(path.join(__dirname, 'content', 'ar-SA.json'), 'utf8'));
console.log('📦 تم تحميل المحتوى العربي بنجاح - النسخة:', content.meta.version);

// ═══════════════════════════════════════════════════════════════════
// تخزين الغرف والثوابت
// ═══════════════════════════════════════════════════════════════════

const rooms = new Map();

// الصور الرمزية للاعبين
const AVATARS = ['😎', '🤠', '🥳', '😈', '🤖', '👻', '🦊', '🐸', '🦁', '🐼', '🐯', '🦄'];

// ألوان اللاعبين
const COLORS = [
  '#E91E8C', '#4ECDC4', '#FFD93D', '#6BCB77',
  '#FF6B35', '#667eea', '#f093fb', '#43e97b',
  '#fa709a', '#00d4ff', '#a18cd1', '#fbc2eb'
];

// الحد الأقصى للاعبين في الغرفة
const MAX_PLAYERS = 10;

// مدة بقاء الغرفة بدون نشاط (ساعتين بالميلي ثانية)
const ROOM_EXPIRY_MS = 2 * 60 * 60 * 1000;

// فاصل تنظيف الغرف (كل 15 دقيقة)
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════════
// الدوال المساعدة
// ═══════════════════════════════════════════════════════════════════

/**
 * توليد كود غرفة عشوائي من 4 أحرف
 * يستبعد الأحرف المربكة: I, O, 0, 1
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // لو الكود موجود، ولّد واحد جديد
  return rooms.has(code) ? generateRoomCode() : code;
}

/**
 * خلط المصفوفة - خوارزمية فيشر-ييتس
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * إنشاء كائن لاعب جديد
 */
function createPlayer(id, name, isHost = false) {
  const index = Math.floor(Math.random() * AVATARS.length);
  return {
    id,
    name: sanitizeName(name),
    avatar: AVATARS[index],
    color: COLORS[index % COLORS.length],
    score: 0,
    streak: 0,
    isHost,
    isReady: false,
    isAlive: true,
    isAudience: false,
    currentAnswer: null,
    currentVote: null,
    connectedAt: Date.now()
  };
}

/**
 * تنظيف اسم اللاعب من المحارف الخطيرة
 */
function sanitizeName(name) {
  if (!name || typeof name !== 'string') return 'لاعب';
  // إزالة المحارف الخطيرة والحد الأقصى 20 حرف
  return name.replace(/[<>&"'/\\]/g, '').trim().substring(0, 20) || 'لاعب';
}

/**
 * الحصول على قائمة اللاعبين بصيغة قابلة للإرسال
 */
function getPlayerList(room) {
  return Array.from(room.players.values()).filter(p => !p.isAudience).map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    color: p.color,
    score: p.score,
    streak: p.streak || 0,
    isHost: p.isHost,
    isReady: p.isReady,
    isAlive: p.isAlive
  }));
}

/**
 * اختيار سؤال غير مستخدم من المجموعة
 * يتتبع الأسئلة المستخدمة لمنع التكرار
 */
function pickQuestion(room, pool) {
  // تصفية الأسئلة المستخدمة
  const available = pool.filter((_, index) => !room.usedQuestions.has(`${room.currentGame}_${index}`));

  // لو خلصت كل الأسئلة، نعيد التعيين
  if (available.length === 0) {
    pool.forEach((_, index) => {
      room.usedQuestions.delete(`${room.currentGame}_${index}`);
    });
    return pickFromPool(room, pool);
  }

  return pickFromPool(room, pool, available);
}

/**
 * دالة مساعدة لاختيار سؤال من المجموعة المتاحة
 */
function pickFromPool(room, fullPool, availablePool) {
  const pool = availablePool || fullPool;
  const shuffled = shuffle(pool);
  const picked = shuffled[0];
  // تسجيل الفهرس في المجموعة الكاملة
  const originalIndex = fullPool.indexOf(picked);
  room.usedQuestions.add(`${room.currentGame}_${originalIndex}`);
  return picked;
}

/**
 * عدد اللاعبين اللي أجابوا
 */
function countAnswered(room) {
  return Array.from(room.players.values()).filter(p => p.currentAnswer !== null).length;
}

/**
 * هل كل اللاعبين أجابوا؟
 */
function allPlayersAnswered(room) {
  return Array.from(room.players.values()).every(p => p.currentAnswer !== null);
}

/**
 * عدد اللاعبين الأحياء اللي أجابوا (لحفلة القاتل)
 */
function countAliveAnswered(room) {
  return Array.from(room.players.values()).filter(p => p.isAlive && p.currentAnswer !== null).length;
}

/**
 * هل كل اللاعبين الأحياء أجابوا؟
 */
function allAliveAnswered(room) {
  return Array.from(room.players.values()).filter(p => p.isAlive).every(p => p.currentAnswer !== null);
}

/**
 * إعادة تعيين إجابات كل اللاعبين
 */
function resetAnswers(room) {
  room.players.forEach(p => {
    p.currentAnswer = null;
    p.currentVote = null;
  });
}

/**
 * مسح مؤقت الجولة (بما فيها مؤقتات التعليق)
 */
function clearRoundTimer(room) {
  if (room.roundTimer) {
    clearTimeout(room.roundTimer);
    room.roundTimer = null;
  }
  if (room._halfTimeTimer) {
    clearTimeout(room._halfTimeTimer);
    room._halfTimeTimer = null;
  }
  if (room._lastSecondsTimer) {
    clearTimeout(room._lastSecondsTimer);
    room._lastSecondsTimer = null;
  }
}

/**
 * تحديث وقت النشاط الأخير للغرفة
 */
function touchRoom(room) {
  room.lastActivity = Date.now();
}

// ═══════════════════════════════════════════════════════════════════
// اتصالات Socket.IO
// ═══════════════════════════════════════════════════════════════════

io.on('connection', (socket) => {
  console.log('🟢 لاعب جديد اتصل:', socket.id);

  // ─────────────────────────────────────────────
  // إنشاء غرفة جديدة
  // ─────────────────────────────────────────────
  socket.on('createRoom', (playerName) => {
    if (!rateLimiters.createRoom(socket.id)) return;
    // التحقق من صحة الاسم
    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return socket.emit('error', { message: 'الرجاء إدخال اسم صحيح!' });
    }

    const code = generateRoomCode();
    const room = {
      code,
      hostId: socket.id,
      players: new Map(),
      state: 'lobby',          // lobby | playing | results
      currentGame: null,
      currentRound: 0,
      maxRounds: 5,
      gameData: {},
      usedQuestions: new Set(),
      roundTimer: null,
      lastActivity: Date.now(),
      createdAt: Date.now()
    };

    // إضافة المضيف كأول لاعب
    room.players.set(socket.id, createPlayer(socket.id, playerName, true));
    rooms.set(code, room);
    socket.join(code);

    socket.emit('roomCreated', {
      code,
      players: getPlayerList(room)
    });

    console.log('🏠 غرفة جديدة تم إنشاؤها:', code, '- المضيف:', sanitizeName(playerName));
  });

  // ─────────────────────────────────────────────
  // الانضمام لغرفة موجودة
  // ─────────────────────────────────────────────
  socket.on('joinRoom', ({ code, playerName }) => {
    if (!rateLimiters.joinRoom(socket.id)) return;
    // التحقق من المدخلات
    if (!code || typeof code !== 'string') {
      return socket.emit('error', { message: 'كود الغرفة غير صحيح!' });
    }
    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return socket.emit('error', { message: 'الرجاء إدخال اسم صحيح!' });
    }

    const roomCode = code.toUpperCase().trim();
    const room = rooms.get(roomCode);

    if (!room) {
      return socket.emit('error', { message: 'الغرفة غير موجودة! تأكد من الكود.' });
    }
    if (room.state !== 'lobby') {
      return socket.emit('error', { message: 'اللعبة بدأت! جرب تنضم كمتفرج 👀' });
    }
    if (room.players.size >= MAX_PLAYERS) {
      return socket.emit('error', { message: `الغرفة ممتلئة! الحد الأقصى ${MAX_PLAYERS} لاعبين.` });
    }
    // التحقق من تكرار الاسم
    const nameExists = Array.from(room.players.values()).some(
      p => p.name === sanitizeName(playerName)
    );
    if (nameExists) {
      return socket.emit('error', { message: 'الاسم مستخدم! اختر اسم ثاني.' });
    }

    // إضافة اللاعب
    room.players.set(socket.id, createPlayer(socket.id, playerName));
    socket.join(roomCode);
    touchRoom(room);

    socket.emit('roomJoined', {
      code: room.code,
      players: getPlayerList(room)
    });

    // إبلاغ باقي اللاعبين
    const joinComment = CONFIG.commentaryEnabled
      ? generateCommentary('lobby', 'playerJoin', { name: sanitizeName(playerName) })
      : null;
    socket.to(room.code).emit('playerJoined', {
      players: getPlayerList(room),
      newPlayer: sanitizeName(playerName),
      commentary: joinComment
    });

    console.log('👤 لاعب انضم:', sanitizeName(playerName), '→ غرفة:', roomCode);
  });

  // ─────────────────────────────────────────────
  // تبديل حالة الجاهزية
  // ─────────────────────────────────────────────
  socket.on('playerReady', (code) => {
    if (typeof code !== 'string' || !/^[A-Z2-9]{4}$/.test(code)) return;
    const room = rooms.get(code);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.isReady = !player.isReady;
    touchRoom(room);

    io.to(code).emit('playerUpdated', {
      players: getPlayerList(room)
    });
  });

  // ─────────────────────────────────────────────
  // بدء اللعبة
  // ─────────────────────────────────────────────
  socket.on('startGame', ({ code, game }) => {
    const room = rooms.get(code);
    if (!room) return socket.emit('error', { message: 'الغرفة غير موجودة!' });
    if (socket.id !== room.hostId) return socket.emit('error', { message: 'بس المضيف يقدر يبدأ اللعبة!' });
    if (room.players.size < 2) return socket.emit('error', { message: 'لازم لاعبين على الأقل عشان نبدأ!' });
    if (room.state === 'playing') return socket.emit('error', { message: 'اللعبة شغالة بالفعل!' });

    // التحقق من صحة اسم اللعبة
    const validGames = ['quiplash', 'guesspionage', 'fakinit', 'triviamurder', 'fibbage', 'drawful'];
    if (!validGames.includes(game)) {
      return socket.emit('error', { message: 'لعبة غير معروفة!' });
    }

    // تحديد عدد الجولات حسب اللعبة
    // Round count: Guesspionage scales with player count
    const playerCount = room.players.size;
    const guesspionageRounds = playerCount <= 6
      ? playerCount * 2 + 1  // Each player twice + final
      : playerCount + 1;      // Each player once + final
    const roundsByGame = {
      quiplash: 5,
      guesspionage: guesspionageRounds,
      fakinit: 3,
      triviamurder: 5,
      fibbage: 3,
      drawful: 3
    };

    // إعداد الغرفة للعبة
    room.currentGame = game;
    room.currentRound = 0;
    room.maxRounds = roundsByGame[game];
    room.state = 'playing';
    room.gameData = {};
    room.usedQuestions = new Set();
    touchRoom(room);

    // إعادة تعيين حالة اللاعبين
    room.players.forEach(p => {
      p.score = 0;
      p.currentAnswer = null;
      p.currentVote = null;
      p.isAlive = true;
      p.isReady = false;
    });

    const gameNames = {
      quiplash: '⚡ رد سريع',
      guesspionage: '📊 خمّن النسبة',
      fakinit: '🕵️ المزيّف',
      triviamurder: '💀 حفلة القاتل',
      fibbage: '🎭 كشف الكذاب',
      drawful: '🎨 ارسم لي'
    };

    const startComment = CONFIG.commentaryEnabled
      ? generateCommentary('lobby', 'gameStarting')
      : null;
    io.to(code).emit('gameStarted', {
      game,
      gameName: gameNames[game],
      maxRounds: room.maxRounds,
      players: getPlayerList(room),
      commentary: startComment
    });

    console.log('🎮 اللعبة بدأت:', gameNames[game], '- غرفة:', code);

    // بدء أول جولة بعد ثانية
    setTimeout(() => startGameRound(room), 1500);
  });

  // ─────────────────────────────────────────────
  // إرسال إجابة
  // ─────────────────────────────────────────────
  socket.on('submitAnswer', ({ code, answer }) => {
    if (!rateLimiters.submitAnswer(socket.id)) return;
    const room = rooms.get(code);
    if (!room || room.state !== 'playing') return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // لا نقبل إجابة مكررة
    if (player.currentAnswer !== null) return;

    // التحقق من الإجابة
    if (answer === undefined || answer === null) return;

    // Filter free-text answers through profanity pipeline
    let processedAnswer = answer;
    if (typeof answer === 'string') {
      const trimmed = answer.trim().substring(0, 200);
      // Only filter free-text games (not trivia choices or guesspionage bets)
      const freeTextGames = ['quiplash', 'fibbage', 'drawful'];
      const isFreeText = freeTextGames.includes(room.currentGame) ||
        (room.currentGame === 'triviamurder' && room.gameData.phase === 'deathChallenge');
      if (isFreeText) {
        const effectiveMode = room.familyMode ? 'strict' : CONFIG.profanityMode;
        const filterResult = filterText(trimmed, effectiveMode);
        if (!filterResult.allowed) {
          return socket.emit('error', { message: filterResult.message });
        }
        processedAnswer = filterResult.text;
      } else {
        processedAnswer = trimmed;
      }
    }
    player.currentAnswer = processedAnswer;
    touchRoom(room);

    // ── حالة خاصة: Guesspionage الجولة النهائية ──
    if (room.currentGame === 'guesspionage' && room.gameData.phase === 'final') {
      const answeredCount = Array.from(room.players.values()).filter(p => p.currentAnswer !== null).length;
      io.to(code).emit('playerAnswered', { playerId: socket.id, count: answeredCount, total: room.players.size });
      if (answeredCount >= room.players.size) {
        clearRoundTimer(room);
        setTimeout(() => calculateGuesspionageFinalResults(room), 800);
      }
      return;
    }

    // ── حالة خاصة: Guesspionage مرحلة اللاعب المميز ──
    if (room.currentGame === 'guesspionage' && room.gameData.phase === 'featured_guess') {
      // فقط اللاعب المميز يجاوب في هذي المرحلة
      if (socket.id === room.gameData.featuredPlayerId) {
        clearRoundTimer(room);
        setTimeout(() => handleGuesspionageFeaturedAnswer(room), 1000);
      }
      return;
    }

    // ── حالة خاصة: Guesspionage مرحلة التحدي (أعلى/أقل) ──
    if (room.currentGame === 'guesspionage' && room.gameData.phase === 'challenge') {
      // نحسب فقط اللاعبين ما عدا المميز
      const challengers = Array.from(room.players.entries())
        .filter(([id]) => id !== room.gameData.featuredPlayerId);
      const answeredCount = challengers.filter(([, p]) => p.currentAnswer !== null).length;

      io.to(code).emit('playerAnswered', {
        playerId: socket.id,
        count: answeredCount,
        total: challengers.length
      });

      if (answeredCount >= challengers.length) {
        clearRoundTimer(room);
        setTimeout(() => calculateGuesspionageResults(room), 800);
      }
      return;
    }

    // إبلاغ الجميع بعدد المجيبين
    const totalExpected = room.currentGame === 'triviamurder'
      ? Array.from(room.players.values()).filter(p => p.isAlive).length
      : room.players.size;

    const currentCount = room.currentGame === 'triviamurder'
      ? countAliveAnswered(room)
      : countAnswered(room);

    io.to(code).emit('playerAnswered', {
      playerId: socket.id,
      count: currentCount,
      total: totalExpected
    });

    // التحقق إذا كل اللاعبين أجابوا
    const allDone = room.currentGame === 'triviamurder'
      ? allAliveAnswered(room)
      : allPlayersAnswered(room);

    if (allDone) {
      clearRoundTimer(room);
      if (CONFIG.commentaryEnabled) {
        const c = generateCommentary('timer', 'allAnswered');
        if (c) io.to(code).emit('commentary', c);
      }
      setTimeout(() => handleAllAnswered(room), 800);
    }
  });

  // ─────────────────────────────────────────────
  // إرسال تصويت
  // ─────────────────────────────────────────────
  socket.on('submitVote', ({ code, voteId }) => {
    if (!rateLimiters.submitVote(socket.id)) return;
    const room = rooms.get(code);
    if (!room || room.state !== 'playing') return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // لا نقبل تصويت مكرر
    if (player.currentVote !== null) return;

    player.currentVote = voteId;
    touchRoom(room);

    // حساب المصوتين المتوقعين حسب طور اللعبة
    const voters = getEligibleVoters(room);
    const votedCount = voters.filter(p => p.currentVote !== null).length;

    io.to(code).emit('playerVoted', {
      playerId: socket.id,
      count: votedCount,
      total: voters.length
    });

    // لو كل المصوتين صوتوا
    if (votedCount >= voters.length) {
      clearRoundTimer(room);
      setTimeout(() => calculateVoteResults(room), 800);
    }
  });

  // ─────────────────────────────────────────────
  // إرسال رسمة (لعبة ارسم لي)
  // ─────────────────────────────────────────────
  socket.on('submitDrawing', ({ code, drawing }) => {
    if (!rateLimiters.submitDrawing(socket.id)) return;
    const room = rooms.get(code);
    if (!room || room.state !== 'playing' || room.currentGame !== 'drawful') return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // التحقق أن هذا اللاعب هو الرسام
    if (room.gameData.drawerId !== socket.id) return;

    // التحقق من صحة بيانات الرسم
    if (!validateDrawingData(drawing)) {
      return socket.emit('error', { message: 'بيانات الرسمة غير صالحة!' });
    }

    room.gameData.drawing = drawing;
    touchRoom(room);

    clearRoundTimer(room);

    // الانتقال لمرحلة التخمين
    startDrawfulGuessing(room);
  });

  // ─────────────────────────────────────────────
  // طلب الجولة التالية
  // ─────────────────────────────────────────────
  socket.on('requestNextRound', (code) => {
    if (typeof code !== 'string' || !/^[A-Z2-9]{4}$/.test(code)) return;
    const room = rooms.get(code);
    if (!room) return;
    if (socket.id !== room.hostId) return socket.emit('error', { message: 'بس المضيف يقدر يتحكم!' });

    clearRoundTimer(room);
    touchRoom(room);

    room.currentRound++;
    resetAnswers(room);
    room.gameData = {};

    // التحقق إذا خلصت الجولات
    if (room.currentRound >= room.maxRounds) {
      endGame(room);
    } else {
      startGameRound(room);
    }
  });

  // ─────────────────────────────────────────────
  // العودة إلى اللوبي
  // ─────────────────────────────────────────────
  socket.on('backToLobby', (code) => {
    if (typeof code !== 'string' || !/^[A-Z2-9]{4}$/.test(code)) return;
    const room = rooms.get(code);
    if (!room) return;

    clearRoundTimer(room);

    room.state = 'lobby';
    room.currentGame = null;
    room.currentRound = 0;
    room.gameData = {};
    room.usedQuestions = new Set();
    touchRoom(room);

    // إعادة تعيين حالة اللاعبين
    room.players.forEach(p => {
      p.score = 0;
      p.isAlive = true;
      p.isReady = false;
      p.currentAnswer = null;
      p.currentVote = null;
    });

    io.to(code).emit('returnedToLobby', {
      players: getPlayerList(room)
    });

    console.log('🔄 الغرفة رجعت للوبي:', code);
  });

  // ─────────────────────────────────────────────
  // تبديل وضع العائلة (Family Mode)
  // ─────────────────────────────────────────────
  socket.on('toggleFamilyMode', (code) => {
    if (typeof code !== 'string') return;
    const room = rooms.get(code);
    if (!room || socket.id !== room.hostId) return;
    room.familyMode = !room.familyMode;
    const effectiveMode = room.familyMode ? 'strict' : CONFIG.profanityMode;
    io.to(code).emit('familyModeChanged', {
      familyMode: room.familyMode,
      message: room.familyMode ? '🏠 وضع العائلة مفعّل - المحتوى مناسب للجميع' : '🎮 وضع العائلة معطّل'
    });
    console.log('🏠 وضع العائلة:', room.familyMode ? 'مفعّل' : 'معطّل', '- غرفة:', code);
  });

  // ─────────────────────────────────────────────
  // تبديل المؤقتات الممتدة (Extended Timers)
  // ─────────────────────────────────────────────
  socket.on('toggleExtendedTimers', (code) => {
    if (typeof code !== 'string') return;
    const room = rooms.get(code);
    if (!room || socket.id !== room.hostId) return;
    if (!room._extendedTimers) room._extendedTimers = false;
    room._extendedTimers = !room._extendedTimers;
    io.to(code).emit('extendedTimersChanged', {
      extendedTimers: room._extendedTimers,
      message: room._extendedTimers ? '⏳ المؤقتات الممتدة مفعّلة (×1.5)' : '⏱️ المؤقتات العادية'
    });
  });

  // ─────────────────────────────────────────────
  // إيموجي ردود الفعل
  // ─────────────────────────────────────────────
  socket.on('sendEmoji', ({ code, emoji }) => {
    if (!rateLimiters.sendEmoji(socket.id)) return;
    const room = rooms.get(code);
    if (!room || !room.players.has(socket.id)) return;
    const validEmojis = ['😂', '🔥', '👏', '😱', '💀', '❤️', '👎', '🤣'];
    if (!validEmojis.includes(emoji)) return;
    socket.to(code).emit('emojiReaction', { emoji, playerId: socket.id });
  });

  // ─────────────────────────────────────────────
  // الانضمام كمتفرج (أثناء اللعب)
  // ─────────────────────────────────────────────
  socket.on('joinAsAudience', ({ code, playerName }) => {
    if (!code || typeof code !== 'string') return;
    if (!playerName || typeof playerName !== 'string') return;

    const roomCode = code.toUpperCase().trim();
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('error', { message: 'الغرفة غير موجودة!' });

    const player = createPlayer(socket.id, playerName);
    player.isAudience = true;
    room.players.set(socket.id, player);
    socket.join(roomCode);

    socket.emit('joinedAsAudience', {
      code: room.code,
      players: getPlayerList(room),
      game: room.currentGame
    });

    io.to(roomCode).emit('audienceJoined', {
      name: player.name,
      audienceCount: Array.from(room.players.values()).filter(p => p.isAudience).length
    });
  });

  // ─────────────────────────────────────────────
  // إعادة الانضمام بعد انقطاع (Reconnection)
  // ─────────────────────────────────────────────
  socket.on('rejoinRoom', ({ code, playerName }) => {
    if (!code || typeof code !== 'string') return;
    if (!playerName || typeof playerName !== 'string') return;

    const roomCode = code.toUpperCase().trim();
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('error', { message: 'الغرفة غير موجودة!' });

    const safeName = sanitizeName(playerName);

    // Check if this player was disconnected (grace period)
    const dcEntry = room._disconnected && room._disconnected.get(safeName);
    if (dcEntry) {
      // Restore player with old state
      clearTimeout(dcEntry.timer);
      const restored = dcEntry.player;
      restored.id = socket.id;
      room.players.set(socket.id, restored);
      room._disconnected.delete(safeName);
      socket.join(roomCode);

      // If they were host, restore host
      if (dcEntry.wasHost && !Array.from(room.players.values()).some(p => p.isHost && p.id !== socket.id)) {
        restored.isHost = true;
        room.hostId = socket.id;
      }

      socket.emit('rejoinedRoom', {
        code: room.code,
        players: getPlayerList(room),
        game: room.currentGame,
        state: room.state,
        isHost: restored.isHost,
        score: restored.score,
        round: room.currentRound + 1,
        maxRounds: room.maxRounds
      });

      io.to(roomCode).emit('playerJoined', {
        players: getPlayerList(room),
        newPlayer: safeName + ' (رجع!)'
      });

      console.log('🔄 لاعب رجع:', safeName, '→ غرفة:', roomCode);
      return;
    }

    // No grace period entry — join as new if in lobby
    if (room.state === 'lobby') {
      if (room.players.size >= MAX_PLAYERS) {
        return socket.emit('error', { message: 'الغرفة ممتلئة!' });
      }
      room.players.set(socket.id, createPlayer(socket.id, playerName));
      socket.join(roomCode);
      socket.emit('roomJoined', { code: room.code, players: getPlayerList(room) });
      socket.to(roomCode).emit('playerJoined', { players: getPlayerList(room), newPlayer: safeName });
    } else {
      // Game in progress — join as audience
      const player = createPlayer(socket.id, playerName);
      player.isAudience = true;
      room.players.set(socket.id, player);
      socket.join(roomCode);
      socket.emit('joinedAsAudience', { code: room.code, players: getPlayerList(room), game: room.currentGame });
    }
  });

  // ─────────────────────────────────────────────
  // قطع الاتصال (with 30s grace period)
  // ─────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log('🔴 لاعب انقطع:', socket.id);

    rooms.forEach((room, code) => {
      if (!room.players.has(socket.id)) return;

      const disconnectedPlayer = room.players.get(socket.id);

      // Grace period: keep player data for 30s during active games
      if (room.state === 'playing' && disconnectedPlayer && !disconnectedPlayer.isAudience) {
        if (!room._disconnected) room._disconnected = new Map();
        const timer = setTimeout(() => {
          // After 30s, permanently remove
          room._disconnected.delete(disconnectedPlayer.name);
          if (room.state === 'playing') checkIfRoundCanProceed(room);
          console.log('⏰ انتهت مهلة الرجوع:', disconnectedPlayer.name, '- غرفة:', code);
        }, 30000);
        room._disconnected.set(disconnectedPlayer.name, {
          player: { ...disconnectedPlayer },
          wasHost: disconnectedPlayer.isHost,
          timer
        });
      }

      room.players.delete(socket.id);

      // لو الغرفة فاضية، نحذفها
      if (room.players.size === 0) {
        clearRoundTimer(room);
        if (room._disconnected) {
          room._disconnected.forEach(dc => clearTimeout(dc.timer));
        }
        rooms.delete(code);
        console.log('🗑️ غرفة محذوفة (فاضية):', code);
        return;
      }

      // لو المضيف طلع، نعيّن مضيف جديد
      if (room.hostId === socket.id) {
        const newHost = room.players.values().next().value;
        if (newHost) {
          newHost.isHost = true;
          room.hostId = newHost.id;
          console.log('👑 مضيف جديد:', newHost.name, '- غرفة:', code);
        }
      }

      // إبلاغ الباقين
      io.to(code).emit('playerLeft', {
        players: getPlayerList(room),
        leftPlayer: disconnectedPlayer ? disconnectedPlayer.name : 'لاعب'
      });

      // لو اللعبة شغالة والتحقق من الإجابات
      if (room.state === 'playing') {
        checkIfRoundCanProceed(room);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// محرك الألعاب - التوزيع الرئيسي
// ═══════════════════════════════════════════════════════════════════

/**
 * بدء جولة جديدة حسب اللعبة الحالية
 */
function startGameRound(room) {
  resetAnswers(room);
  clearRoundTimer(room);
  touchRoom(room);

  console.log('🎯 جولة جديدة:', room.currentRound + 1, '/', room.maxRounds, '- غرفة:', room.code);

  switch (room.currentGame) {
    case 'quiplash':
      startQuiplashRound(room);
      break;
    case 'guesspionage':
      startGuesspionageRound(room);
      break;
    case 'fakinit':
      startFakinItRound(room);
      break;
    case 'triviamurder':
      startTriviaMurderRound(room);
      break;
    case 'fibbage':
      startFibbageRound(room);
      break;
    case 'drawful':
      startDrawfulRound(room);
      break;
    default:
      console.log('❌ لعبة غير معروفة:', room.currentGame);
  }
}

/**
 * معالجة وصول كل الإجابات
 */
function handleAllAnswered(room) {
  clearRoundTimer(room);

  switch (room.currentGame) {
    case 'quiplash':
      startQuiplashVoting(room);
      break;
    case 'guesspionage':
      if (room.gameData.phase === 'featured_guess') {
        handleGuesspionageFeaturedAnswer(room);
      } else {
        calculateGuesspionageResults(room);
      }
      break;
    case 'fakinit':
      // After each task, vote (real Jackbox votes after every task)
      startFakinItVoting(room);
      break;
    case 'triviamurder':
      calculateTriviaMurderResults(room);
      break;
    case 'fibbage':
      startFibbageVoting(room);
      break;
    case 'drawful':
      // لا يصل هنا عادة - الرسم يُعالج بشكل منفصل
      break;
    default:
      sendRoundResults(room, {});
  }
}

/**
 * حساب نتائج التصويت
 */
function calculateVoteResults(room) {
  clearRoundTimer(room);

  switch (room.currentGame) {
    case 'quiplash':
      calculateQuiplashResults(room);
      break;
    case 'fakinit':
      calculateFakinItResults(room);
      break;
    case 'fibbage':
      calculateFibbageResults(room);
      break;
    case 'drawful':
      calculateDrawfulResults(room);
      break;
    default:
      sendRoundResults(room, {});
  }
}

/**
 * الحصول على المصوتين المؤهلين حسب اللعبة
 */
function getEligibleVoters(room) {
  // Include audience in vote-based games
  const includeAudience = ['quiplash', 'fibbage', 'drawful'].includes(room.currentGame);

  switch (room.currentGame) {
    case 'quiplash': {
      const matchup = room.gameData.currentMatchup || [];
      return Array.from(room.players.values()).filter(p =>
        !matchup.includes(p.id) && (includeAudience || !p.isAudience)
      );
    }
    case 'fakinit':
      return Array.from(room.players.values()).filter(p => !p.isAudience);
    case 'fibbage':
      return Array.from(room.players.values()); // audience can vote too
    case 'drawful':
      return Array.from(room.players.values()).filter(p => p.id !== room.gameData.drawerId);
    default:
      return Array.from(room.players.values()).filter(p => !p.isAudience);
  }
}

/**
 * التحقق إذا الجولة تقدر تكمل بعد انقطاع لاعب
 */
function checkIfRoundCanProceed(room) {
  if (room.players.size < 2) {
    clearRoundTimer(room);
    room.state = 'lobby';
    room.currentGame = null;
    io.to(room.code).emit('gameCancelled', {
      message: 'ما فيه لاعبين كفاية! اللعبة انلغت.',
      players: getPlayerList(room)
    });
    return;
  }

  // التحقق إذا كل الموجودين أجابوا
  const allDone = room.currentGame === 'triviamurder'
    ? allAliveAnswered(room)
    : allPlayersAnswered(room);

  if (allDone) {
    clearRoundTimer(room);
    setTimeout(() => handleAllAnswered(room), 500);
  }
}

/**
 * تعيين مؤقت للجولة مع تقديم تلقائي
 */
function setRoundTimer(room, timeLimit, onTimeout) {
  clearRoundTimer(room);

  // Half-time commentary (only for rounds >= 15s)
  if (CONFIG.commentaryEnabled && timeLimit >= 15) {
    const halfMs = Math.floor(timeLimit / 2) * 1000;
    room._halfTimeTimer = setTimeout(() => {
      const c = generateCommentary('timer', 'halfTime');
      if (c) io.to(room.code).emit('commentary', c);
    }, halfMs);
  }

  // Last 5 seconds commentary (only for rounds >= 10s)
  if (CONFIG.commentaryEnabled && timeLimit >= 10) {
    const lastMs = (timeLimit - 5) * 1000;
    room._lastSecondsTimer = setTimeout(() => {
      const c = generateCommentary('timer', 'lastSeconds');
      if (c) io.to(room.code).emit('commentary', c);
    }, lastMs);
  }

  room.roundTimer = setTimeout(() => {
    console.log('⏰ انتهى الوقت! - غرفة:', room.code);

    // تقديم تلقائي للاعبين اللي ما أجابوا
    room.players.forEach(p => {
      if (p.currentAnswer === null) {
        p.currentAnswer = '__timeout__';
      }
    });

    if (onTimeout) {
      onTimeout();
    }
  }, (timeLimit * 1000) + 2000); // ثانيتين إضافية كاحتياط
}

/**
 * تعيين مؤقت للتصويت مع تقديم تلقائي
 */
function setVoteTimer(room, timeLimit, onTimeout) {
  clearRoundTimer(room);

  // Last 5 seconds commentary for voting (only for >= 10s)
  if (CONFIG.commentaryEnabled && timeLimit >= 10) {
    const lastMs = (timeLimit - 5) * 1000;
    room._lastSecondsTimer = setTimeout(() => {
      const c = generateCommentary('timer', 'lastSeconds');
      if (c) io.to(room.code).emit('commentary', c);
    }, lastMs);
  }

  room.roundTimer = setTimeout(() => {
    console.log('⏰ انتهى وقت التصويت! - غرفة:', room.code);

    // تقديم تلقائي للاعبين اللي ما صوتوا
    const voters = getEligibleVoters(room);
    voters.forEach(p => {
      if (p.currentVote === null) {
        p.currentVote = '__timeout__';
      }
    });

    if (onTimeout) {
      onTimeout();
    }
  }, (timeLimit * 1000) + 2000);
}

// ═══════════════════════════════════════════════════════════════════
// ⚡ رد سريع (Quiplash) - 5 جولات
// ═══════════════════════════════════════════════════════════════════

/**
 * بدء جولة رد سريع
 * - سؤال واحد لكل الجولة
 * - كل لاعب يكتب إجابته
 * - مواجهة 1 ضد 1 بالتصويت
 * - 100 نقطة لكل صوت + 200 بونص للإجماع
 */
function startQuiplashRound(room) {
  const question = pickQuestion(room, content.quiplash.questions);

  room.gameData.question = question;
  room.gameData.phase = 'answering';
  room.gameData.matchups = [];
  room.gameData.currentMatchupIndex = 0;

  const timeLimit = 60;

  io.to(room.code).emit('quiplashQuestion', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question,
    timeLimit
  });

  // مؤقت الإجابات
  setRoundTimer(room, timeLimit, () => {
    handleAllAnswered(room);
  });
}

/**
 * بدء مرحلة التصويت في رد سريع
 * - إنشاء مواجهات بين اللاعبين
 */
function startQuiplashVoting(room) {
  room.gameData.phase = 'voting';

  // جمع الإجابات الصالحة (غير المنتهية بالوقت)
  const validPlayers = Array.from(room.players.entries())
    .filter(([, p]) => p.currentAnswer !== null && p.currentAnswer !== '__timeout__');

  if (validPlayers.length < 2) {
    // ما فيه إجابات كافية، ننتقل للنتائج مباشرة
    sendRoundResults(room, {
      question: room.gameData.question,
      message: 'ما أحد جاوب! 😅'
    });
    return;
  }

  // إنشاء المواجهات - كل لاعب ضد لاعب ثاني
  const shuffledPlayers = shuffle(validPlayers.map(([id]) => id));
  const matchups = [];

  for (let i = 0; i < shuffledPlayers.length - 1; i += 2) {
    matchups.push([shuffledPlayers[i], shuffledPlayers[i + 1]]);
  }

  // لو فيه لاعب فردي (عدد فردي)، نضيفه لآخر مواجهة
  if (shuffledPlayers.length % 2 !== 0 && matchups.length > 0) {
    matchups.push([shuffledPlayers[shuffledPlayers.length - 1], matchups[0][0]]);
  }

  room.gameData.matchups = matchups;
  room.gameData.currentMatchupIndex = 0;
  room.gameData.matchupResults = [];

  // بدء أول مواجهة
  presentQuiplashMatchup(room);
}

/**
 * عرض مواجهة رد سريع للتصويت
 */
function presentQuiplashMatchup(room) {
  const idx = room.gameData.currentMatchupIndex;
  const matchups = room.gameData.matchups;

  if (idx >= matchups.length) {
    // كل المواجهات خلصت، نعرض النتائج
    finalizeQuiplashRound(room);
    return;
  }

  const matchup = matchups[idx];
  room.gameData.currentMatchup = matchup;

  // إعادة تعيين التصويتات
  room.players.forEach(p => { p.currentVote = null; });

  const answers = matchup.map(id => {
    const p = room.players.get(id);
    return {
      playerId: id,
      answer: p ? p.currentAnswer : '...'
    };
  });

  const timeLimit = 30;

  io.to(room.code).emit('quiplashVoting', {
    round: room.currentRound + 1,
    question: room.gameData.question,
    answers: shuffle(answers), // خلط ترتيب الإجابات
    matchupNumber: idx + 1,
    totalMatchups: matchups.length,
    timeLimit
  });

  // مؤقت التصويت
  setVoteTimer(room, timeLimit, () => {
    calculateQuiplashResults(room);
  });
}

/**
 * حساب نتائج مواجهة رد سريع واحدة
 */
function calculateQuiplashResults(room) {
  const matchup = room.gameData.currentMatchup;
  if (!matchup || matchup.length < 2) return;

  // حساب الأصوات
  const votes = {};
  matchup.forEach(id => { votes[id] = 0; });

  let totalVoters = 0;

  let audienceVotes = {};
  matchup.forEach(id => { audienceVotes[id] = 0; });

  room.players.forEach((p, id) => {
    if (!matchup.includes(id) && p.currentVote && p.currentVote !== '__timeout__') {
      if (votes.hasOwnProperty(p.currentVote)) {
        if (p.isAudience) {
          audienceVotes[p.currentVote] += CONFIG.audienceVoteWeight;
        } else {
          votes[p.currentVote]++;
          totalVoters++;
        }
      }
    }
  });

  // Merge audience votes (weighted)
  matchup.forEach(id => {
    votes[id] = (votes[id] || 0) + Math.round(audienceVotes[id]);
  });

  // حساب النقاط
  const matchupResult = {};
  matchup.forEach(id => {
    const player = room.players.get(id);
    if (!player) return;

    const voteCount = votes[id] || 0;
    let points = voteCount * 100;
    let quiplash = false;

    // بونص الإجماع: لو كل الأصوات لك (و فيه أصوات أصلاً)
    if (totalVoters > 0 && voteCount === totalVoters) {
      points += 200;
      quiplash = true;
    }

    player.score += points;

    matchupResult[id] = {
      playerId: id,
      playerName: player.name,
      answer: player.currentAnswer,
      votes: voteCount,
      points,
      quiplash
    };
  });

  room.gameData.matchupResults.push(matchupResult);

  // إرسال نتيجة المواجهة
  io.to(room.code).emit('quiplashMatchupResult', {
    results: Object.values(matchupResult),
    players: getPlayerList(room)
  });

  // الانتقال للمواجهة التالية بعد ثوان
  room.gameData.currentMatchupIndex++;

  setTimeout(() => {
    if (room.gameData.currentMatchupIndex < room.gameData.matchups.length) {
      presentQuiplashMatchup(room);
    } else {
      finalizeQuiplashRound(room);
    }
  }, 4000);
}

/**
 * إنهاء جولة رد سريع وعرض الملخص
 */
function finalizeQuiplashRound(room) {
  sendRoundResults(room, {
    question: room.gameData.question,
    matchupResults: room.gameData.matchupResults
  });
}

// ═══════════════════════════════════════════════════════════════════
// 📊 خمّن النسبة (Guesspionage) - Dynamic rounds
// ═══════════════════════════════════════════════════════════════════

/**
 * Determine which Guesspionage phase this round belongs to:
 * - 'round1': basic higher/lower (first playerCount rounds)
 * - 'round2': adds much_higher / much_lower
 * - 'final': pick top 3 from 9
 */
function getGuesspionagePhaseType(room) {
  const playerCount = room.players.size;
  const round = room.currentRound;
  const isFinal = round >= room.maxRounds - 1;
  if (isFinal) return 'final';
  if (playerCount <= 6) {
    // ≤6 players: first rotation = round1, second rotation = round2
    return round < playerCount ? 'round1' : 'round2';
  }
  // ≥7 players: single rotation, first half round1, second half round2
  return round < Math.floor(playerCount / 2) ? 'round1' : 'round2';
}

function startGuesspionageRound(room) {
  const phaseType = getGuesspionagePhaseType(room);

  if (phaseType === 'final') {
    startGuesspionageFinalRound(room);
    return;
  }

  const question = pickQuestion(room, content.guesspionage.questions);
  room.gameData.question = question;
  room.gameData.phase = 'featured_guess';
  room.gameData.phaseType = phaseType; // 'round1' or 'round2'
  room.gameData.challengeBets = new Map();

  const playerIds = Array.from(room.players.keys());
  const featuredIndex = room.currentRound % playerIds.length;
  const featuredId = playerIds[featuredIndex];
  room.gameData.featuredPlayerId = featuredId;

  const featuredPlayer = room.players.get(featuredId);
  const timeLimit = room._extendedTimers ? 45 : 30;

  const commentary = CONFIG.commentaryEnabled
    ? generateCommentary('guesspionage', 'featuredChosen', { name: featuredPlayer.name })
    : null;

  const featuredSocket = io.sockets.sockets.get(featuredId);
  if (featuredSocket) {
    featuredSocket.emit('guesspionageFeatured', {
      round: room.currentRound + 1,
      maxRounds: room.maxRounds,
      question: question.q,
      playerName: featuredPlayer.name,
      timeLimit,
      commentary
    });
  }

  room.players.forEach((p, id) => {
    if (id !== featuredId) {
      const sock = io.sockets.sockets.get(id);
      if (sock) {
        sock.emit('guesspionageWaitFeatured', {
          round: room.currentRound + 1,
          maxRounds: room.maxRounds,
          question: question.q,
          featuredPlayerName: featuredPlayer.name,
          timeLimit,
          commentary
        });
      }
    }
  });

  setRoundTimer(room, timeLimit, () => {
    if (room.gameData.phase === 'featured_guess') {
      const fp = room.players.get(room.gameData.featuredPlayerId);
      if (fp && fp.currentAnswer === null) fp.currentAnswer = '50';
      startGuesspionageChallenge(room);
    }
  });
}

function startGuesspionageChallenge(room) {
  room.gameData.phase = 'challenge';
  resetAnswersExcept(room, room.gameData.featuredPlayerId);

  const featuredPlayer = room.players.get(room.gameData.featuredPlayerId);
  const featuredGuess = parseInt(featuredPlayer.currentAnswer) || 50;
  room.gameData.featuredGuess = Math.max(0, Math.min(100, featuredGuess));

  const hasMuch = room.gameData.phaseType === 'round2';
  const timeLimit = room._extendedTimers ? 30 : 20;

  const commentary = (hasMuch && CONFIG.commentaryEnabled)
    ? generateCommentary('guesspionage', 'muchHigherLower')
    : (CONFIG.commentaryEnabled ? generateCommentary('guesspionage', 'challengeStart') : null);

  room.players.forEach((p, id) => {
    const sock = io.sockets.sockets.get(id);
    if (!sock) return;

    if (id === room.gameData.featuredPlayerId) {
      sock.emit('guesspionageFeaturedWaiting', {
        round: room.currentRound + 1,
        maxRounds: room.maxRounds,
        question: room.gameData.question.q,
        yourGuess: room.gameData.featuredGuess,
        timeLimit,
        commentary
      });
    } else {
      sock.emit('guesspionageChallenge', {
        round: room.currentRound + 1,
        maxRounds: room.maxRounds,
        question: room.gameData.question.q,
        featuredPlayerName: featuredPlayer.name,
        featuredGuess: room.gameData.featuredGuess,
        hasMuch,
        timeLimit,
        commentary
      });
    }
  });

  setRoundTimer(room, timeLimit, () => {
    calculateGuesspionageResults(room);
  });
}

function handleGuesspionageFeaturedAnswer(room) {
  if (room.gameData.phase !== 'featured_guess') return;
  clearRoundTimer(room);
  setTimeout(() => startGuesspionageChallenge(room), 1500);
}

function resetAnswersExcept(room, exceptId) {
  room.players.forEach((p, id) => {
    if (id !== exceptId) {
      p.currentAnswer = null;
      p.currentVote = null;
    }
  });
}

/**
 * Guesspionage scoring — now matches real Jackbox values:
 * - Featured: up to 3000 within 30%, else 0
 * - Higher/Lower correct: 1000
 * - Much Higher/Lower correct (15%+ off): 2000, else 0
 * - Exact match: wagerers get 0
 */
function calculateGuesspionageResults(room) {
  const correctAnswer = room.gameData.question.a;
  const featuredGuess = room.gameData.featuredGuess || 50;
  const featuredId = room.gameData.featuredPlayerId;
  const hasMuch = room.gameData.phaseType === 'round2';
  const playerResults = [];

  // Featured player scoring: up to 3000 within 30%
  const featuredPlayer = room.players.get(featuredId);
  if (featuredPlayer) {
    const diff = Math.abs(featuredGuess - correctAnswer);
    let points = 0;
    let accuracy = '';

    if (diff === 0) {
      points = 3000; accuracy = '🎯 مثالي!';
    } else if (diff <= 30) {
      // Linear scale: closer = more points, max 3000 at 0, min ~100 at 30
      points = Math.round(3000 * (1 - diff / 30));
      if (diff <= 3) accuracy = 'ممتاز!';
      else if (diff <= 10) accuracy = 'قريب!';
      else if (diff <= 20) accuracy = 'مش بعيد';
      else accuracy = 'بالكاد';
    } else {
      points = 0; accuracy = 'بعيد!';
    }

    featuredPlayer.score += points;

    playerResults.push({
      playerId: featuredId,
      playerName: featuredPlayer.name,
      guess: featuredGuess,
      isFeatured: true,
      bet: null,
      betCorrect: null,
      betType: null,
      points,
      accuracy,
      diff
    });
  }

  // Wagerer scoring (audience gets weighted points)
  const exactMatch = correctAnswer === featuredGuess;

  room.players.forEach((p, id) => {
    if (id === featuredId) return;

    let points = 0;
    let bet = null;
    let betCorrect = null;
    let betType = null;

    if (p.currentAnswer !== null && p.currentAnswer !== '__timeout__') {
      bet = p.currentAnswer; // 'higher', 'lower', 'much_higher', 'much_lower'

      if (exactMatch) {
        // Real Jackbox: exact match = wagerers get 0
        betCorrect = false;
        points = 0;
      } else {
        const actualIsHigher = correctAnswer > featuredGuess;
        const actualIsLower = correctAnswer < featuredGuess;
        const diffAbs = Math.abs(correctAnswer - featuredGuess);

        if (bet === 'much_higher' || bet === 'much_lower') {
          betType = 'much';
          const dirCorrect = (bet === 'much_higher' && actualIsHigher) ||
                            (bet === 'much_lower' && actualIsLower);
          if (dirCorrect && diffAbs >= 15) {
            betCorrect = true;
            points = 2000;
          } else {
            betCorrect = false;
            points = 0;
          }
        } else {
          betType = 'normal';
          if ((bet === 'higher' && actualIsHigher) || (bet === 'lower' && actualIsLower)) {
            betCorrect = true;
            points = 1000;
          } else {
            betCorrect = false;
            points = 0;
          }
        }
      }
    }

    // Audience gets weighted points
    const effectivePoints = p.isAudience ? Math.round(points * CONFIG.audienceVoteWeight) : points;
    p.score += effectivePoints;

    playerResults.push({
      playerId: id,
      playerName: p.name,
      guess: null,
      isFeatured: false,
      bet,
      betCorrect,
      betType,
      points: effectivePoints,
      isAudience: !!p.isAudience,
      accuracy: null,
      diff: null
    });
  });

  playerResults.sort((a, b) => {
    if (a.isFeatured) return -1;
    if (b.isFeatured) return 1;
    return b.points - a.points;
  });

  const resultCommentary = CONFIG.commentaryEnabled
    ? generateResultCommentary('guesspionage', {
        playerResults,
        players: getPlayerList(room),
        isLastRound: room.currentRound >= room.maxRounds - 1
      })
    : [];

  io.to(room.code).emit('roundResults', {
    game: 'guesspionage',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question: room.gameData.question.q,
    correctAnswer,
    featuredGuess,
    featuredPlayerName: featuredPlayer ? featuredPlayer.name : '',
    playerResults,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1,
    commentary: resultCommentary
  });
}

/**
 * Guesspionage Final Round: pick top 3 from 9 choices
 */
function startGuesspionageFinalRound(room) {
  // Pick a question, then generate 9 answer options (3 are "top"/popular)
  // Use pre-built final round questions or synthesize from question bank
  const allQuestions = content.guesspionage.questions;
  const pool = allQuestions.filter((_, i) => !room.usedQuestions.has(`guesspionage_${i}`));
  const sourcePool = pool.length >= 9 ? pool : allQuestions;
  const picked = shuffle(sourcePool).slice(0, 9);

  // Sort by answer percentage — top 3 are the "most popular" (ranked #1, #2, #3)
  const sorted = [...picked].sort((a, b) => b.a - a.a);
  // Real Jackbox scoring: #1=3000, #2=2000, #3=1000
  const rankPoints = { 0: 3000, 1: 2000, 2: 1000 };
  const top3Map = new Map(); // question text → { rank, points }
  sorted.slice(0, 3).forEach((q, i) => {
    top3Map.set(q.q, { rank: i + 1, points: rankPoints[i] });
  });

  const options = shuffle(picked.map(q => ({
    text: q.q.replace(/كم نسبة /, '').replace(/؟$/, ''),
    percentage: q.a,
    isTop3: top3Map.has(q.q),
    rank: top3Map.has(q.q) ? top3Map.get(q.q).rank : 0,
    rankPoints: top3Map.has(q.q) ? top3Map.get(q.q).points : 0
  })));

  room.gameData.phase = 'final';
  room.gameData.finalOptions = options;

  resetAnswers(room);
  const timeLimit = room._extendedTimers ? 45 : 30;

  const commentary = CONFIG.commentaryEnabled
    ? generateCommentary('guesspionage', 'finalRound')
    : null;

  io.to(room.code).emit('guesspionageFinalRound', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    prompt: 'اختر الـ 3 الأكثر شعبية!',
    options: options.map((o, i) => ({ id: i, text: o.text })),
    timeLimit,
    commentary
  });

  setRoundTimer(room, timeLimit, () => {
    calculateGuesspionageFinalResults(room);
  });
}

function calculateGuesspionageFinalResults(room) {
  clearRoundTimer(room);
  const options = room.gameData.finalOptions;
  const playerResults = [];

  room.players.forEach((p, id) => {
    let points = 0;
    let correctPicks = 0;
    let picks = [];

    if (p.currentAnswer && p.currentAnswer !== '__timeout__') {
      try {
        picks = JSON.parse(p.currentAnswer);
      } catch (e) { picks = []; }

      picks.forEach(pickIdx => {
        if (options[pickIdx] && options[pickIdx].isTop3) {
          correctPicks++;
          points += options[pickIdx].rankPoints; // #1=4000, #2=2000, #3=1000
        }
      });
    }

    p.score += points;
    playerResults.push({
      playerId: id,
      playerName: p.name,
      picks,
      correctPicks,
      points
    });
  });

  playerResults.sort((a, b) => b.points - a.points);

  io.to(room.code).emit('roundResults', {
    game: 'guesspionage',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    isFinalRound: true,
    options: options.map((o, i) => ({
      id: i,
      text: o.text,
      percentage: o.percentage,
      isTop3: o.isTop3,
      rank: o.rank || 0,
      rankPoints: o.rankPoints || 0
    })),
    playerResults,
    players: getPlayerList(room),
    isLastRound: true,
    commentary: CONFIG.commentaryEnabled
      ? generateResultCommentary('guesspionage', { playerResults, players: getPlayerList(room), isLastRound: true })
      : []
  });
}

// ═══════════════════════════════════════════════════════════════════
// 🕵️ المزيّف (Fakin' It) - 3 جولات
// ═══════════════════════════════════════════════════════════════════

/**
 * بدء جولة المزيّف (2 sub-rounds per round, then vote)
 * Real Jackbox: same faker across sub-rounds, different tasks
 */
function startFakinItRound(room) {
  // اختيار المزيّف عشوائياً (stays same for entire round)
  const playerIds = Array.from(room.players.keys());
  const fakerId = playerIds[Math.floor(Math.random() * playerIds.length)];
  room.gameData.fakerId = fakerId;
  room.gameData.subRound = 0;
  room.gameData.maxSubRounds = 2; // 2 tasks before voting

  startFakinItSubRound(room);
}

function startFakinItSubRound(room) {
  room.gameData.subRound++;
  resetAnswers(room);

  // اختيار فئة عشوائية
  const categoryKeys = Object.keys(content.fakinit.categories);
  const categoryKey = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
  const category = content.fakinit.categories[categoryKey];

  // اختيار مهمة من الفئة
  const task = pickQuestion(room, category.tasks);

  room.gameData.categoryKey = categoryKey;
  room.gameData.categoryName = category.name;
  room.gameData.instruction = category.instruction;
  room.gameData.task = task;
  room.gameData.phase = 'action';

  const fakerId = room.gameData.fakerId;
  const timeLimit = 15;
  const subLabel = room.gameData.subRound + '/' + room.gameData.maxSubRounds;

  const taskCommentary = CONFIG.commentaryEnabled
    ? generateCommentary('fakinit', categoryKey) || generateCommentary('fakinit', 'taskStart')
    : null;

  // إرسال المهمة لكل لاعب بشكل خاص
  room.players.forEach((player, id) => {
    io.to(id).emit('fakinItTask', {
      round: room.currentRound + 1,
      maxRounds: room.maxRounds,
      subRound: room.gameData.subRound,
      maxSubRounds: room.gameData.maxSubRounds,
      category: category.name,
      categoryKey,
      instruction: category.instruction,
      task: id === fakerId ? null : task,
      isFaker: id === fakerId,
      timeLimit,
      commentary: taskCommentary
    });
  });

  // After task timer, go to voting for this sub-round (real Jackbox: vote after every task)
  room.roundTimer = setTimeout(() => {
    startFakinItVoting(room);
  }, (timeLimit * 1000) + 2000);
}

/**
 * بدء التصويت في المزيّف
 */
function startFakinItVoting(room) {
  clearRoundTimer(room);
  room.gameData.phase = 'voting';

  // إعادة تعيين التصويتات
  room.players.forEach(p => { p.currentVote = null; });

  const timeLimit = 20;

  io.to(room.code).emit('fakinItVoting', {
    round: room.currentRound + 1,
    task: room.gameData.task,
    category: room.gameData.categoryName,
    players: getPlayerList(room),
    timeLimit
  });

  // مؤقت التصويت
  setVoteTimer(room, timeLimit, () => {
    calculateFakinItResults(room);
  });
}

/**
 * حساب نتائج المزيّف
 */
function calculateFakinItResults(room) {
  const fakerId = room.gameData.fakerId;
  const faker = room.players.get(fakerId);

  // حساب الأصوات
  const votes = {};
  room.players.forEach((p, id) => { votes[id] = 0; });

  room.players.forEach(p => {
    if (p.currentVote && p.currentVote !== '__timeout__' && votes.hasOwnProperty(p.currentVote)) {
      votes[p.currentVote]++;
    }
  });

  // من حصل على أكثر أصوات؟
  let maxVotes = 0;
  let mostVotedId = null;

  Object.entries(votes).forEach(([id, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      mostVotedId = id;
    }
  });

  // Real Jackbox (original): unanimous vote catches faker
  // Real Jackbox (All Night Long): majority vote catches faker
  // We use majority for better gameplay
  const totalVoters = Array.from(room.players.values()).filter(p => p.currentVote && p.currentVote !== '__timeout__').length;
  const fakerVotes = votes[fakerId] || 0;
  const caught = fakerVotes > totalVoters / 2; // Majority catches faker

  // Escalating points per sub-round (real Jackbox: +25 per task)
  const subRound = room.gameData.subRound || 1;
  const sleuthBase = 75 + (subRound * 25); // 100, 125, 150...
  const fakerEscapeBase = 75 + (subRound * 25);

  if (caught) {
    // Sleuth bonus: everyone who correctly voted for faker
    room.players.forEach(p => {
      if (p.currentVote === fakerId) {
        p.score += sleuthBase + (5 * fakerVotes); // caught bonus
      }
    });
  } else {
    // Faker escapes this task
    if (faker) {
      faker.score += fakerEscapeBase;
    }
    // Sleuth bonus still awarded to those who guessed right (even if not caught)
    room.players.forEach(p => {
      if (p.currentVote === fakerId) {
        p.score += Math.round(sleuthBase * 0.5);
      }
    });
  }

  // النتائج التفصيلية
  const voteDetails = {};
  room.players.forEach((p, id) => {
    voteDetails[id] = {
      playerId: id,
      playerName: p.name,
      votesReceived: votes[id] || 0,
      votedFor: p.currentVote
    };
  });

  // If caught OR all sub-rounds done: show round results
  // If not caught and more sub-rounds: show interim result then continue
  const hasMoreTasks = room.gameData.subRound < room.gameData.maxSubRounds;

  io.to(room.code).emit('roundResults', {
    game: 'fakinit',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    caught,
    fakerId,
    fakerName: faker ? faker.name : 'مجهول',
    task: room.gameData.task,
    category: room.gameData.categoryName,
    subRound: room.gameData.subRound,
    maxSubRounds: room.gameData.maxSubRounds,
    hasMoreTasks: !caught && hasMoreTasks,
    voteDetails: Object.values(voteDetails),
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });

  // If not caught and more sub-rounds remain, auto-continue after delay
  if (!caught && hasMoreTasks) {
    room.roundTimer = setTimeout(() => {
      resetAnswers(room);
      startFakinItSubRound(room);
    }, 4000); // 4s to see results before next task
  }
}

// ═══════════════════════════════════════════════════════════════════
// 💀 حفلة القاتل (Trivia Murder Party) - 5 جولات
// ═══════════════════════════════════════════════════════════════════

/**
 * تحديات الموت للاعبين المحذوفين
 */
const deathChallenges = [
  'اكتب اسم أي دولة عربية!',
  'اكتب رقم من 1 إلى 10!',
  'اكتب اسم أي فاكهة!',
  'اكتب اسم أي لون!',
  'اكتب اسم أي حيوان!',
  'اكتب أي كلمة تبدأ بحرف الميم!',
  'اكتب اسم أي مدينة سعودية!',
  'اكتب أي رقم زوجي!',
  'اكتب اسم أي أكلة سعودية!',
  'اكتب اسم أي كوكب!',
  'اكتب اسم لاعب كرة قدم سعودي!',
  'اكتب رقم فردي!',
  'اكتب اسم تطبيق في جوالك!',
  'اكتب اسم فيلم عربي!',
  'اكتب شي لونه أحمر!',
  'اكتب اسم أغنية سعودية أو عربية!',
  'اكتب اسم محل أكل تحبه!',
  'اكتب أي كلمة تبدأ بحرف العين!',
  'اكتب شي تلقاه في المطبخ!',
  'اكتب اسم بحر أو محيط!',
  'اكتب اسم لعبة فيديو!',
  'اكتب اسم مادة دراسية!',
  'اكتب شي تلبسه!',
  'اكتب اسم عاصمة عربية!',
  'اكتب رقم أكبر من 100!'
];

/**
 * بدء جولة حفلة القاتل
 * - سؤال اختيار من متعدد (4 خيارات)
 * - الإجابة الصحيحة = 100 نقطة + بقاء حي
 * - الإجابة الخطأ = الموت (مع فرصة تحدي الموت)
 */
function startTriviaMurderRound(room) {
  const question = pickQuestion(room, content.triviamurder.questions);

  room.gameData.question = question;
  room.gameData.phase = 'question';

  // التحقق من اللاعبين الأحياء
  const alivePlayers = Array.from(room.players.values()).filter(p => p.isAlive);

  if (alivePlayers.length === 0) {
    // كلهم ماتوا! ننهي اللعبة
    endGame(room);
    return;
  }

  // لو باقي لاعب واحد حي، يفوز
  if (alivePlayers.length === 1) {
    alivePlayers[0].score += 500; // بونص البقاء الأخير
    endGame(room);
    return;
  }

  const timeLimit = 20;

  io.to(room.code).emit('triviaMurderQuestion', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question: question.q,
    options: question.o,
    timeLimit,
    alivePlayers: alivePlayers.map(p => ({ id: p.id, name: p.name }))
  });

  // مؤقت الإجابات (فقط الأحياء)
  clearRoundTimer(room);
  room.roundTimer = setTimeout(() => {
    // تقديم تلقائي للأحياء اللي ما أجابوا
    room.players.forEach(p => {
      if (p.isAlive && p.currentAnswer === null) {
        p.currentAnswer = '__timeout__';
      }
    });
    calculateTriviaMurderResults(room);
  }, (timeLimit * 1000) + 2000);
}

/**
 * حساب نتائج حفلة القاتل
 */
function calculateTriviaMurderResults(room) {
  clearRoundTimer(room);

  const correctIndex = room.gameData.question.c;
  const newlyDead = [];
  const survivors = [];

  room.players.forEach(p => {
    if (!p.isAlive) return; // اللاعب ميت بالفعل

    if (p.currentAnswer !== null && p.currentAnswer !== '__timeout__' && parseInt(p.currentAnswer) === correctIndex) {
      // إجابة صحيحة!
      p.streak = (p.streak || 0) + 1;
      let points = 100;
      if (p.streak > 1) points += p.streak * 25; // مكافأة السلسلة
      p.score += points;
      survivors.push({ id: p.id, name: p.name, streak: p.streak });
    } else {
      // إجابة خطأ أو ما جاوب = الموت
      p.isAlive = false;
      p.streak = 0;
      newlyDead.push({ id: p.id, name: p.name });
    }
  });

  // التحقق من فرصة تحدي الموت
  room.gameData.newlyDead = newlyDead;

  io.to(room.code).emit('triviaMurderResults', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    correctAnswer: room.gameData.question.o[correctIndex],
    correctIndex,
    newlyDead,
    survivors,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1,
    hasDeathChallenge: newlyDead.length > 0
  });

  // لو فيه لاعبين ماتوا، نبدأ تحدي الموت
  if (newlyDead.length > 0) {
    setTimeout(() => startDeathChallenge(room), 3000);
  } else {
    // إرسال نتائج الجولة العادية
    setTimeout(() => {
      sendRoundResults(room, {
        correctAnswer: room.gameData.question.o[correctIndex],
        newlyDead: [],
        survivors
      });
    }, 2000);
  }
}

/**
 * بدء تحدي الموت
 * - اللاعبين الميتين يحصلون على فرصة للعودة
 */
function startDeathChallenge(room) {
  const challenge = deathChallenges[Math.floor(Math.random() * deathChallenges.length)];
  room.gameData.deathChallenge = challenge;
  room.gameData.phase = 'deathChallenge';

  // إعادة تعيين الإجابات للميتين الجدد فقط
  const deadIds = room.gameData.newlyDead.map(p => p.id);
  deadIds.forEach(id => {
    const p = room.players.get(id);
    if (p) p.currentAnswer = null;
  });

  const timeLimit = 10;

  // إرسال التحدي لكل الميتين الجدد
  deadIds.forEach(id => {
    io.to(id).emit('deathChallenge', {
      challenge,
      timeLimit
    });
  });

  // إبلاغ الجميع
  io.to(room.code).emit('deathChallengeStarted', {
    deadPlayers: room.gameData.newlyDead,
    timeLimit
  });

  // بعد انتهاء الوقت
  room.roundTimer = setTimeout(() => {
    resolveDeathChallenge(room);
  }, (timeLimit * 1000) + 2000);
}

/**
 * حل تحدي الموت
 * - أول لاعب يجيب بإجابة صالحة يعود للحياة
 */
function resolveDeathChallenge(room) {
  clearRoundTimer(room);

  const deadIds = room.gameData.newlyDead.map(p => p.id);
  const revived = [];

  // كل اللي جاوبوا بإجابة صالحة (مو فاضية ومو timeout) يعودون
  deadIds.forEach(id => {
    const p = room.players.get(id);
    if (p && p.currentAnswer && p.currentAnswer !== '__timeout__' && p.currentAnswer.trim().length > 0) {
      p.isAlive = true;
      revived.push({ id: p.id, name: p.name });
    }
  });

  io.to(room.code).emit('deathChallengeResult', {
    revived,
    stillDead: deadIds.filter(id => !revived.find(r => r.id === id)).map(id => {
      const p = room.players.get(id);
      return { id, name: p ? p.name : 'مجهول' };
    }),
    players: getPlayerList(room)
  });

  // إرسال نتائج الجولة النهائية
  setTimeout(() => {
    sendRoundResults(room, {
      correctAnswer: room.gameData.question.o[room.gameData.question.c],
      newlyDead: room.gameData.newlyDead,
      revived
    });
  }, 2500);
}

// ═══════════════════════════════════════════════════════════════════
// 🎭 كشف الكذاب (Fibbage) - 3 جولات
// ═══════════════════════════════════════════════════════════════════

/**
 * بدء جولة كشف الكذاب
 * - سؤال مع فراغ (_____)
 * - اللاعبين يكتبون إجابات كاذبة
 * - الكل يصوتون على الإجابة الصحيحة من بين الكذبات
 * - 500 نقطة للتخمين الصحيح، 250 لخداع أحد
 */
function startFibbageRound(room) {
  const question = pickQuestion(room, content.fibbage.questions);

  room.gameData.question = question;
  room.gameData.phase = 'writing';

  const timeLimit = 60;

  io.to(room.code).emit('fibbageQuestion', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question: question.q,
    timeLimit
  });

  // مؤقت كتابة الإجابات الكاذبة
  setRoundTimer(room, timeLimit, () => {
    // تقديم إجابات فارغة للي ما كتبوا
    room.players.forEach(p => {
      if (p.currentAnswer === null) {
        p.currentAnswer = '__timeout__';
      }
    });
    startFibbageVoting(room);
  });
}

/**
 * بدء التصويت في كشف الكذاب
 */
function startFibbageVoting(room) {
  clearRoundTimer(room);
  room.gameData.phase = 'voting';

  // جمع الإجابات الكاذبة الصالحة
  const fakeAnswers = [];
  room.players.forEach((p, id) => {
    if (p.currentAnswer && p.currentAnswer !== '__timeout__' && p.currentAnswer.trim().length > 0) {
      fakeAnswers.push({
        id: `fake_${id}`,
        text: p.currentAnswer.trim(),
        authorId: id,
        isCorrect: false
      });
    }
  });

  // إضافة الإجابة الصحيحة
  const correctOption = {
    id: 'correct',
    text: room.gameData.question.a,
    authorId: null,
    isCorrect: true
  };

  // خلط كل الخيارات
  const allOptions = shuffle([...fakeAnswers, correctOption]);
  room.gameData.options = allOptions;

  // إعادة تعيين التصويتات
  room.players.forEach(p => { p.currentVote = null; });

  const timeLimit = 30;

  // إرسال الخيارات (بدون كشف أي واحد الصح)
  io.to(room.code).emit('fibbageVoting', {
    round: room.currentRound + 1,
    question: room.gameData.question.q,
    options: allOptions.map(o => ({ id: o.id, text: o.text })),
    timeLimit
  });

  // مؤقت التصويت
  setVoteTimer(room, timeLimit, () => {
    calculateFibbageResults(room);
  });
}

/**
 * حساب نتائج كشف الكذاب
 */
function calculateFibbageResults(room) {
  const options = room.gameData.options;
  const playerResults = [];

  room.players.forEach((p, id) => {
    let points = 0;
    let guessedCorrect = false;
    let fooledCount = 0;

    // التحقق إذا اللاعب خمّن صح
    if (p.currentVote === 'correct') {
      points += 500;
      guessedCorrect = true;
    }

    // حساب كم لاعب انخدع بإجابتك الكاذبة
    const myFakeId = `fake_${id}`;
    room.players.forEach((other, otherId) => {
      if (otherId !== id && other.currentVote === myFakeId) {
        points += 250;
        fooledCount++;
      }
    });

    p.score += points;

    playerResults.push({
      playerId: id,
      playerName: p.name,
      fakeAnswer: p.currentAnswer !== '__timeout__' ? p.currentAnswer : null,
      guessedCorrect,
      fooledCount,
      points
    });
  });

  io.to(room.code).emit('roundResults', {
    game: 'fibbage',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question: room.gameData.question.q,
    correctAnswer: room.gameData.question.a,
    options: room.gameData.options.map(o => ({
      id: o.id,
      text: o.text,
      isCorrect: o.isCorrect,
      authorId: o.authorId,
      authorName: o.authorId ? (room.players.get(o.authorId) || {}).name : null
    })),
    playerResults,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

// ═══════════════════════════════════════════════════════════════════
// 🎨 ارسم لي (Drawful) - 3 جولات
// ═══════════════════════════════════════════════════════════════════

/**
 * بدء جولة ارسم لي
 * - اختيار رسام عشوائي
 * - الرسام يرسم الكلمة السرية
 * - الباقين يكتبون تخميناتهم
 * - الكل يصوتون على التخمين الصحيح
 */
function startDrawfulRound(room) {
  const prompt = pickQuestion(room, content.drawful.prompts);

  // اختيار رسام (بالدور)
  const playerIds = Array.from(room.players.keys());
  const drawerIndex = room.currentRound % playerIds.length;
  const drawerId = playerIds[drawerIndex];
  const drawer = room.players.get(drawerId);

  room.gameData.prompt = prompt;
  room.gameData.drawerId = drawerId;
  room.gameData.drawing = null;
  room.gameData.phase = 'drawing';

  const timeLimit = 90;

  // إرسال الكلمة السرية للرسام فقط
  io.to(drawerId).emit('drawfulYourTurn', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    prompt,
    timeLimit
  });

  // إبلاغ الباقين أن اللاعب يرسم
  socket_broadcast(room, drawerId, 'drawfulWaiting', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    drawerName: drawer ? drawer.name : 'الرسام',
    timeLimit
  });

  // مؤقت الرسم
  clearRoundTimer(room);
  room.roundTimer = setTimeout(() => {
    // لو ما رسم، نرسل رسمة فارغة
    if (!room.gameData.drawing) {
      room.gameData.drawing = '[]'; // رسمة فارغة
    }
    startDrawfulGuessing(room);
  }, (timeLimit * 1000) + 2000);
}

/**
 * دالة مساعدة لإرسال حدث لكل اللاعبين ما عدا واحد
 */
function socket_broadcast(room, excludeId, event, data) {
  room.players.forEach((_, id) => {
    if (id !== excludeId) {
      io.to(id).emit(event, data);
    }
  });
}

/**
 * بدء مرحلة التخمين في ارسم لي
 */
function startDrawfulGuessing(room) {
  clearRoundTimer(room);
  room.gameData.phase = 'guessing';

  // إعادة تعيين الإجابات
  resetAnswers(room);

  const timeLimit = 45;

  // إرسال الرسمة لكل اللاعبين (ما عدا الرسام)
  io.to(room.code).emit('drawfulGuessing', {
    round: room.currentRound + 1,
    drawing: room.gameData.drawing,
    drawerId: room.gameData.drawerId,
    timeLimit
  });

  // مؤقت التخمين
  setRoundTimer(room, timeLimit, () => {
    // تقديم تلقائي
    room.players.forEach(p => {
      if (p.id !== room.gameData.drawerId && p.currentAnswer === null) {
        p.currentAnswer = '__timeout__';
      }
    });
    startDrawfulVoting(room);
  });
}

/**
 * بدء التصويت في ارسم لي
 */
function startDrawfulVoting(room) {
  clearRoundTimer(room);
  room.gameData.phase = 'voting';

  // جمع التخمينات
  const guesses = [];
  room.players.forEach((p, id) => {
    if (id !== room.gameData.drawerId && p.currentAnswer && p.currentAnswer !== '__timeout__') {
      guesses.push({
        id: `guess_${id}`,
        text: p.currentAnswer.trim(),
        authorId: id,
        isCorrect: false
      });
    }
  });

  // إضافة الإجابة الصحيحة
  const correctOption = {
    id: 'correct',
    text: room.gameData.prompt,
    authorId: null,
    isCorrect: true
  };

  const allOptions = shuffle([...guesses, correctOption]);
  room.gameData.guessOptions = allOptions;

  // إعادة تعيين التصويتات
  room.players.forEach(p => { p.currentVote = null; });

  const timeLimit = 30;

  // إرسال الخيارات للتصويت (ما عدا الرسام)
  io.to(room.code).emit('drawfulVoting', {
    round: room.currentRound + 1,
    drawing: room.gameData.drawing,
    options: allOptions.map(o => ({ id: o.id, text: o.text })),
    drawerId: room.gameData.drawerId,
    timeLimit
  });

  // مؤقت التصويت
  setVoteTimer(room, timeLimit, () => {
    calculateDrawfulResults(room);
  });
}

/**
 * حساب نتائج ارسم لي
 */
function calculateDrawfulResults(room) {
  const options = room.gameData.guessOptions;
  const playerResults = [];
  const drawerId = room.gameData.drawerId;
  const drawer = room.players.get(drawerId);
  let drawerPoints = 0;

  room.players.forEach((p, id) => {
    if (id === drawerId) return; // الرسام يُحسب لاحقاً

    let points = 0;
    let guessedCorrect = false;
    let fooledCount = 0;

    // التحقق إذا اللاعب خمّن صح
    if (p.currentVote === 'correct') {
      points += 500;
      guessedCorrect = true;
      drawerPoints += 250; // الرسام ياخذ نقاط لكل من خمّن صح
    }

    // حساب كم لاعب انخدع بتخمينك
    const myGuessId = `guess_${id}`;
    room.players.forEach((other, otherId) => {
      if (otherId !== id && otherId !== drawerId && other.currentVote === myGuessId) {
        points += 250;
        fooledCount++;
      }
    });

    p.score += points;

    playerResults.push({
      playerId: id,
      playerName: p.name,
      guess: p.currentAnswer !== '__timeout__' ? p.currentAnswer : null,
      guessedCorrect,
      fooledCount,
      points
    });
  });

  // نقاط الرسام
  if (drawer) {
    drawer.score += drawerPoints;
  }

  playerResults.push({
    playerId: drawerId,
    playerName: drawer ? drawer.name : 'الرسام',
    isDrawer: true,
    points: drawerPoints
  });

  io.to(room.code).emit('roundResults', {
    game: 'drawful',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    prompt: room.gameData.prompt,
    drawing: room.gameData.drawing,
    drawerId,
    drawerName: drawer ? drawer.name : 'الرسام',
    options: options.map(o => ({
      id: o.id,
      text: o.text,
      isCorrect: o.isCorrect,
      authorId: o.authorId,
      authorName: o.authorId ? (room.players.get(o.authorId) || {}).name : null
    })),
    playerResults,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

// ═══════════════════════════════════════════════════════════════════
// الدوال المشتركة
// ═══════════════════════════════════════════════════════════════════

/**
 * إرسال نتائج الجولة العامة
 */
function sendRoundResults(room, extraData = {}) {
  const resultData = {
    game: room.currentGame,
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1,
    ...extraData
  };
  if (CONFIG.commentaryEnabled && !resultData.commentary) {
    resultData.commentary = generateResultCommentary(room.currentGame, resultData);
  }
  io.to(room.code).emit('roundResults', resultData);
}

/**
 * إنهاء اللعبة وعرض النتائج النهائية
 */
function endGame(room) {
  clearRoundTimer(room);
  room.state = 'results';

  // ترتيب اللاعبين حسب النقاط
  const finalResults = getPlayerList(room).sort((a, b) => b.score - a.score);
  const winner = finalResults[0];

  // نصيحة عشوائية
  const tip = content.tips[Math.floor(Math.random() * content.tips.length)];

  const winComment = CONFIG.commentaryEnabled && winner
    ? generateCommentary('results', 'winner', { name: winner.name })
    : null;

  io.to(room.code).emit('gameEnded', {
    game: room.currentGame,
    finalResults,
    winner,
    tip,
    commentary: winComment
  });

  console.log('🏆 اللعبة انتهت! الفائز:', winner ? winner.name : 'لا يوجد', '- غرفة:', room.code);
}

// ═══════════════════════════════════════════════════════════════════
// تنظيف الغرف غير النشطة
// ═══════════════════════════════════════════════════════════════════

setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  rooms.forEach((room, code) => {
    // حذف الغرف اللي مر عليها أكثر من ساعتين بدون نشاط
    const lastActive = room.lastActivity || room.createdAt;
    if (now - lastActive > ROOM_EXPIRY_MS) {
      clearRoundTimer(room);

      // إبلاغ اللاعبين الموجودين
      io.to(code).emit('roomExpired', {
        message: 'الغرفة انتهت بسبب عدم النشاط!'
      });

      rooms.delete(code);
      cleaned++;
    }
  });

  if (cleaned > 0) {
    console.log(`🧹 تم تنظيف ${cleaned} غرفة غير نشطة - المتبقي: ${rooms.size} غرفة`);
  }
}, CLEANUP_INTERVAL_MS);

// ═══════════════════════════════════════════════════════════════════
// نقطة وصول API بسيطة (اختياري)
// ═══════════════════════════════════════════════════════════════════

// حالة السيرفر
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    rooms: rooms.size,
    players: Array.from(rooms.values()).reduce((sum, r) => sum + r.players.size, 0),
    uptime: process.uptime(),
    version: content.meta.version
  });
});

// ═══════════════════════════════════════════════════════════════════
// تشغيل السيرفر
// ═══════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║     ░█▀▀█ ░█▀▀█ ░█─░█   ░█▀▀█ ░█▀▀█ ░█▀▀▀ ░█▀▀▄         ║
  ║     ░█▄▄█ ░█▀▀▄ ░█─░█   ░█▄▄█ ░█▀▀▄ ░█▀▀▀ ░█─░█         ║
  ║     ░█─░█ ░█▄▄█ ─▀▄▄▀   ░█─░█ ░█▄▄█ ░█▄▄▄ ░█▄▄▀         ║
  ║                                                              ║
  ║     ░█▀▀█ ░█▀▀▀█ ░█─░█                                     ║
  ║     ░█▀▀▄ ░█──░█ ─▄▀▄─                                     ║
  ║     ░█▄▄█ ░█▄▄▄█ ▄▀─▀▄                                     ║
  ║                                                              ║
  ║─────────────────────────────────────────────────────────────║
  ║                                                              ║
  ║     🎮 أبو عابد بوكس - منصة الألعاب الجماعية السعودية     ║
  ║     📦 النسخة: ${content.meta.version}                                          ║
  ║                                                              ║
  ║     ⚡ رد سريع    📊 خمّن النسبة    🕵️ المزيّف             ║
  ║     💀 حفلة القاتل  🎭 كشف الكذاب    🎨 ارسم لي           ║
  ║                                                              ║
  ║     ✅ السيرفر شغال على البورت ${PORT}                       ║
  ║     🌐 http://localhost:${PORT}                               ║
  ║     📅 ${new Date().toLocaleDateString('ar-SA')}                                     ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
  `);
});

// ═══════════════════════════════════════════════════════════════════
// معالجة الأخطاء غير المتوقعة
// ═══════════════════════════════════════════════════════════════════

process.on('uncaughtException', (err) => {
  console.error('❌ خطأ غير متوقع:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ وعد مرفوض غير معالج:', reason);
});

// إغلاق نظيف
process.on('SIGTERM', () => {
  console.log('🛑 جاري إغلاق السيرفر...');
  // إبلاغ كل الغرف
  rooms.forEach((room, code) => {
    clearRoundTimer(room);
    io.to(code).emit('serverShutdown', { message: 'السيرفر يسكّر! ارجعوا بعدين.' });
  });
  server.close(() => {
    console.log('👋 السيرفر مسكّر. الله يسلمكم!');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 جاري إغلاق السيرفر...');
  rooms.forEach((room, code) => {
    clearRoundTimer(room);
  });
  server.close(() => {
    console.log('👋 السيرفر مسكّر. الله يسلمكم!');
    process.exit(0);
  });
});
