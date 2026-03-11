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
 *   👕 حرب التيشيرتات (T-Shirt Wars)
 *   💕 الوحش العاشق (Love Monster)
 *   💡 اختراعات مجنونة (Mad Inventions)
 *   🤔 تبي ولا ما تبي (Would You Rather)
 *   💬 من قال؟ (Who Said It)
 *   ⚡ أسرع واحد (Speed Round)
 *   ✌️ حقيقتين وكذبة (Two Truths One Lie)
 *   🔀 سبليت ذا روم (Split the Room)
 *   🎭 فك الرموز (Emoji Decode)
 *   ⚖️ المحكمة (Debate Me)
 *   🔤 الأسماء (Acrophobia)
 */

// ═══════════════════════════════════════════════════════════════════
// الاعتماديات والإعدادات الأساسية
// ═══════════════════════════════════════════════════════════════════

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { generateCommentary, generateResultCommentary, generateTransitionQuip } = require('./commentary');
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
  const limiter = function(socketId) {
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
  limiter.cleanup = (socketId) => clients.delete(socketId);
  return limiter;
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
function createPlayer(id, name, isHost = false, avatarData = null) {
  const index = Math.floor(Math.random() * AVATARS.length);
  const player = {
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
  // Rich avatar data from the new character selection system
  if (avatarData && typeof avatarData === 'object') {
    player.avatarData = sanitizeAvatarData(avatarData);
    if (avatarData.color) player.color = String(avatarData.color).replace(/[^#a-fA-F0-9]/g, '').substring(0, 7);
    if (avatarData.icon) player.avatar = String(avatarData.icon).substring(0, 4);
  }
  return player;
}

/**
 * تنظيف بيانات الأفاتار من المدخلات الخطيرة
 */
function sanitizeAvatarData(data) {
  if (!data || typeof data !== 'object') return null;
  const safe = {};
  const allowedTypes = ['dicebear', 'animal', 'pixel', 'notion', 'emoji'];
  safe.type = allowedTypes.includes(data.type) ? data.type : 'emoji';
  if (data.style) safe.style = String(data.style).replace(/[^a-z-]/g, '').substring(0, 30);
  if (data.seed) safe.seed = String(data.seed).replace(/[<>&"'/\\]/g, '').substring(0, 50);
  if (data.color) safe.color = String(data.color).replace(/[^#a-fA-F0-9]/g, '').substring(0, 7);
  if (data.icon) safe.icon = String(data.icon).substring(0, 4);
  if (data.nameAr) safe.nameAr = String(data.nameAr).replace(/[<>&"'/\\]/g, '').substring(0, 20);
  if (typeof data.animalIndex === 'number') safe.animalIndex = Math.max(0, Math.min(11, Math.floor(data.animalIndex)));
  if (typeof data.classIndex === 'number') safe.classIndex = Math.max(0, Math.min(7, Math.floor(data.classIndex)));
  if (typeof data.faceIndex === 'number') safe.faceIndex = Math.max(0, Math.min(7, Math.floor(data.faceIndex)));
  if (data.emoji) safe.emoji = String(data.emoji).substring(0, 4);
  return safe;
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
    avatarData: p.avatarData || null,
    color: p.color,
    score: p.score,
    streak: p.streak || 0,
    isHost: p.isHost,
    isReady: p.isReady,
    isAlive: p.isAlive,
    team: p.team || null
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
  socket.on('createRoom', (data) => {
    if (!rateLimiters.createRoom(socket.id)) return;
    // دعم الصيغة القديمة (string) والجديدة (object)
    const playerName = typeof data === 'string' ? data : (data && data.playerName);
    const avatarData = typeof data === 'object' ? data.avatarData : null;

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

    // دعم كلمة مرور الغرفة
    if (typeof data === 'object' && data.password && typeof data.password === 'string') {
      room.password = data.password.trim().substring(0, 20);
    }

    // دعم وضع الفرق
    if (typeof data === 'object' && data.teamMode) {
      room.teamMode = true;
      room.teams = {
        red: { name: 'الفريق الأحمر', color: '#E91E8C', players: [], score: 0 },
        blue: { name: 'الفريق الأزرق', color: '#4ECDC4', players: [], score: 0 }
      };
    }

    // إضافة المضيف كأول لاعب
    room.players.set(socket.id, createPlayer(socket.id, playerName, true, avatarData));
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
  socket.on('joinRoom', ({ code, playerName, avatarData, password }) => {
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
    // التحقق من كلمة المرور
    if (room.password) {
      if (!password || password !== room.password) {
        return socket.emit('error', { message: 'كلمة المرور غير صحيحة!' });
      }
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
    room.players.set(socket.id, createPlayer(socket.id, playerName, false, avatarData));
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
    const validGames = ['quiplash', 'guesspionage', 'fakinit', 'triviamurder', 'fibbage', 'drawful', 'tshirtwars', 'lovemonster', 'inventions', 'wouldyourather', 'whosaidit', 'speedround', 'twotruths', 'splittheroom', 'emojidecode', 'debateme', 'acrophobia'];
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
      quiplash: 3,
      guesspionage: guesspionageRounds,
      fakinit: 3,
      triviamurder: 5,
      fibbage: 3,
      drawful: 3,
      tshirtwars: 3,
      lovemonster: 4,
      inventions: 3,
      wouldyourather: 5,
      whosaidit: 3,
      speedround: 10,
      twotruths: 3,
      splittheroom: 5,
      emojidecode: 5,
      debateme: 3,
      acrophobia: 3
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
      p.team = null;
    });

    // توزيع الفرق لو وضع الفرق مفعّل
    if (room.teamMode) {
      const shuffledIds = shuffle(Array.from(room.players.keys()));
      const midpoint = Math.ceil(shuffledIds.length / 2);
      room.teams = {
        red: { name: 'الفريق الأحمر', color: '#E91E8C', players: [], score: 0 },
        blue: { name: 'الفريق الأزرق', color: '#4ECDC4', players: [], score: 0 }
      };
      shuffledIds.forEach((id, index) => {
        const team = index < midpoint ? 'red' : 'blue';
        const player = room.players.get(id);
        if (player) {
          player.team = team;
          room.teams[team].players.push(id);
        }
      });
    }

    // إعداد تتبع الإحصائيات للجوائز النهائية
    room.gameStats = {
      roundScores: new Map(),  // playerId → [score per round]
      fooledCounts: new Map(), // playerId → total fooled
      correctGuesses: new Map(), // playerId → total correct
      fastestAnswer: null,     // { playerId, name, ms }
      votesReceived: new Map(), // playerId → total votes received
      streaks: new Map(),       // playerId → max streak
      quiplashCount: new Map(), // playerId → total QUIPLASH moments (100% votes)
      matchupWins: new Map(),   // playerId → total matchup wins
      zeroVotes: new Map(),     // playerId → total 0% results
    };
    room.players.forEach((p, id) => {
      room.gameStats.roundScores.set(id, []);
      room.gameStats.fooledCounts.set(id, 0);
      room.gameStats.correctGuesses.set(id, 0);
      room.gameStats.votesReceived.set(id, 0);
      room.gameStats.streaks.set(id, 0);
      room.gameStats.quiplashCount.set(id, 0);
      room.gameStats.matchupWins.set(id, 0);
      room.gameStats.zeroVotes.set(id, 0);
    });

    const gameNames = {
      quiplash: '⚡ رد سريع',
      guesspionage: '📊 خمّن النسبة',
      fakinit: '🕵️ المزيّف',
      triviamurder: '💀 حفلة القاتل',
      fibbage: '🎭 كشف الكذاب',
      drawful: '🎨 ارسم لي',
      tshirtwars: '👕 حرب التيشيرتات',
      lovemonster: '💕 الوحش العاشق',
      inventions: '💡 اختراعات مجنونة',
      wouldyourather: '🤔 تبي ولا ما تبي',
      whosaidit: '💬 من قال؟',
      speedround: '⚡ أسرع واحد',
      twotruths: '✌️ حقيقتين وكذبة',
      splittheroom: '🔀 سبليت ذا روم',
      emojidecode: '🎭 فك الرموز',
      debateme: '⚖️ المحكمة',
      acrophobia: '🔤 الأسماء'
    };

    const startComment = CONFIG.commentaryEnabled
      ? generateCommentary('lobby', 'gameStarting')
      : null;
    io.to(code).emit('gameStarted', {
      game,
      gameName: gameNames[game],
      maxRounds: room.maxRounds,
      players: getPlayerList(room),
      commentary: startComment,
      teamMode: room.teamMode || false,
      teams: room.teamMode ? room.teams : null
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
    if (room._paused) return; // اللعبة متوقفة

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
      const freeTextGames = ['quiplash', 'fibbage', 'drawful', 'tshirtwars', 'inventions', 'whosaidit', 'splittheroom', 'debateme', 'acrophobia'];
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

    // ── حالة خاصة: تتبع ترتيب الإجابات في الألعاب السريعة ──
    if ((room.currentGame === 'speedround' || room.currentGame === 'emojidecode') && room.gameData.answerOrder) {
      if (!room.gameData.answerOrder.includes(socket.id)) {
        // تحقق من صحة الإجابة قبل إضافتها للترتيب
        const q = room.gameData.question || room.gameData.puzzle;
        if (q && processedAnswer !== '__timeout__') {
          const correctAnswer = q.a;
          const checkAnswers = room.currentGame === 'emojidecode'
            ? (Array.isArray(q.keywords) ? q.keywords : [correctAnswer])
            : (Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]);
          const playerAns = processedAnswer.trim().toLowerCase();
          const isCorrect = checkAnswers.some(ca => {
            const caLower = ca.trim().toLowerCase();
            return playerAns === caLower || playerAns.includes(caLower) || caLower.includes(playerAns);
          });
          if (isCorrect) {
            room.gameData.answerOrder.push(socket.id);
          }
        }
      }
    }

    // ── حالة خاصة: Guesspionage الجولة النهائية ──
    if (room.currentGame === 'guesspionage' && room.gameData.phase === 'final') {
      const answeredCount = Array.from(room.players.values()).filter(p => p.currentAnswer !== null).length;
      io.to(code).emit('playerAnswered', { playerId: socket.id, count: answeredCount, total: room.players.size });
      if (answeredCount >= room.players.size) {
        clearRoundTimer(room);
        setTimeout(() => showFinalRoundResults(room), 800);
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

    // جمع أسماء المجيبين لعرضها في شاشة الانتظار
    const answeredNames = [];
    room.players.forEach((p, id) => {
      if (p.currentAnswer !== null) {
        answeredNames.push({ name: p.name, avatar: p.avatar || '🎮', avatarData: p.avatarData || null, color: p.color || '#4FC3F7' });
      }
    });

    io.to(code).emit('playerAnswered', {
      playerId: socket.id,
      count: currentCount,
      total: totalExpected,
      answered: answeredNames
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
    if (room._paused) return; // اللعبة متوقفة

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
    if (!room || room.state !== 'playing') return;
    // Accept drawings for drawful and tshirtwars (inventions too)
    if (!['drawful', 'tshirtwars', 'inventions'].includes(room.currentGame)) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // التحقق من صحة بيانات الرسم
    if (!validateDrawingData(drawing)) {
      return socket.emit('error', { message: 'بيانات الرسمة غير صالحة!' });
    }

    touchRoom(room);

    if (room.currentGame === 'drawful' && room.gameData.allDrawings) {
      // Real Drawful: ALL players draw simultaneously
      if (room.gameData.allDrawings[socket.id]) return; // already submitted
      room.gameData.allDrawings[socket.id] = drawing;
      room.gameData.drawingsDone++;

      socket.emit('drawingAccepted', { message: 'رسمتك وصلت!' });

      // Check if all players submitted
      const totalPlayers = room.players.size;
      if (room.gameData.drawingsDone >= totalPlayers) {
        clearRoundTimer(room);
        presentNextDrawfulDrawing(room);
      }
    } else if (room.currentGame === 'drawful') {
      // Legacy single-drawer mode fallback
      room.gameData.drawing = drawing;
      clearRoundTimer(room);
      presentNextDrawfulDrawing(room);
    } else if (room.currentGame === 'tshirtwars' && room.gameData.tkoPhase === 'drawing') {
      // Tee K.O.: Store drawing for this player
      if (room.gameData.playerDrawings[socket.id]) return; // already submitted
      room.gameData.playerDrawings[socket.id] = drawing;
      socket.emit('drawingAccepted', { message: 'رسمتك وصلت!' });

      // Check if all submitted
      const done = Object.keys(room.gameData.playerDrawings).length;
      if (done >= room.players.size) {
        finishTkoDrawing(room);
      }
    } else if (room.currentGame === 'inventions' && room.gameData.phase === 'drawing') {
      // Inventions: store drawing for this player
      if (room.gameData.inventionDrawings[socket.id]) return;
      room.gameData.inventionDrawings[socket.id] = drawing;
      socket.emit('drawingAccepted', { message: 'رسمتك وصلت!' });

      const done = Object.keys(room.gameData.inventionDrawings).length;
      if (done >= room.players.size) {
        startInventionsVoting(room);
      }
    } else {
      // other drawing games
      player.currentAnswer = drawing;
      player._isDrawing = true;
      allPlayersAnswered(room);
    }
  });

  // ─────────────────────────────────────────────
  // Tee K.O.: Submit slogans (phase 1)
  // ─────────────────────────────────────────────
  socket.on('tkoSubmitSlogans', ({ code, slogans }) => {
    const room = rooms.get(code);
    if (!room || room.currentGame !== 'tshirtwars') return;
    if (room.gameData.tkoPhase !== 'slogans') return;
    const player = room.players.get(socket.id);
    if (!player) return;
    if (room.gameData.sloganSubmits[socket.id]) return; // already submitted

    if (!Array.isArray(slogans)) return;
    const valid = slogans.filter(s => typeof s === 'string' && s.trim().length > 0).slice(0, 2);
    valid.forEach(s => {
      room.gameData.sloganPool.push({ text: s.trim().substring(0, 100), authorId: socket.id });
    });
    room.gameData.sloganSubmits[socket.id] = true;
    room.gameData.playerSlogans[socket.id] = valid;

    socket.emit('slogansAccepted', { count: valid.length });

    // Check if all submitted
    const submitted = Object.keys(room.gameData.sloganSubmits).length;
    if (submitted >= room.players.size) {
      finishTkoSlogans(room);
    }
  });

  // ─────────────────────────────────────────────
  // Tee K.O.: Submit drawing (phase 2) - handled by submitDrawing above
  // Tee K.O.: Choose slogan for shirt (phase 3)
  // ─────────────────────────────────────────────
  socket.on('tkoChooseSlogan', ({ code, slogan }) => {
    const room = rooms.get(code);
    if (!room || room.currentGame !== 'tshirtwars') return;
    if (room.gameData.tkoPhase !== 'combine') return;
    const player = room.players.get(socket.id);
    if (!player) return;
    if (room.gameData.shirtChoices[socket.id] !== undefined) return;

    if (typeof slogan !== 'string' || slogan.trim().length === 0) return;
    room.gameData.shirtChoices[socket.id] = slogan.trim().substring(0, 100);

    socket.emit('choiceAccepted', {});

    // Check if all chose
    const chosen = Object.keys(room.gameData.shirtChoices).length;
    if (chosen >= room.players.size) {
      finishTkoCombine(room);
    }
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
    // المضيف فقط يقدر يرجع للوبي
    if (socket.id !== room.hostId) return;

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
  socket.on('joinAsAudience', ({ code, playerName, avatarData }) => {
    if (!code || typeof code !== 'string') return;
    if (!playerName || typeof playerName !== 'string') return;

    const roomCode = code.toUpperCase().trim();
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('error', { message: 'الغرفة غير موجودة!' });

    const player = createPlayer(socket.id, playerName, false, avatarData);
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
  // إيقاف/استئناف اللعبة (Pause/Resume)
  // ─────────────────────────────────────────────
  socket.on('pauseGame', (code) => {
    if (typeof code !== 'string') return;
    const room = rooms.get(code);
    if (!room || socket.id !== room.hostId) return;
    room._paused = !room._paused;
    if (room._paused) {
      // حفظ الوقت المتبقي قبل الإيقاف
      if (room.roundTimer && room._timerStartedAt && room._timerDuration) {
        room._pausedRemaining = Math.max(0, room._timerDuration - (Date.now() - room._timerStartedAt));
        room._pausedCallback = room._timerCallback;
      }
      clearRoundTimer(room);
    } else {
      // استئناف المؤقت بالوقت المتبقي
      if (room._pausedRemaining > 0 && room._pausedCallback) {
        const remaining = room._pausedRemaining;
        const cb = room._pausedCallback;
        room._timerStartedAt = Date.now();
        room._timerDuration = remaining;
        room._timerCallback = cb;
        room.roundTimer = setTimeout(() => cb(), remaining);
        // إرسال الوقت المتبقي للعميل
        io.to(code).emit('timerSync', { remaining: Math.ceil(remaining / 1000) });
      }
      delete room._pausedRemaining;
      delete room._pausedCallback;
    }
    io.to(code).emit('gamePaused', { paused: room._paused });
    console.log('⏸️ اللعبة', room._paused ? 'متوقفة' : 'مستأنفة', '- غرفة:', code);
  });

  // ─────────────────────────────────────────────
  // طرد لاعب (Kick Player)
  // ─────────────────────────────────────────────
  socket.on('kickPlayer', ({ code, playerId }) => {
    if (typeof code !== 'string') return;
    const room = rooms.get(code);
    if (!room || socket.id !== room.hostId) return;
    const kicked = room.players.get(playerId);
    if (!kicked || kicked.isHost) return;
    room.players.delete(playerId);
    io.to(playerId).emit('kicked', { message: 'تم طردك من الغرفة!' });
    io.to(code).emit('playerLeft', {
      players: getPlayerList(room),
      leftPlayer: kicked.name + ' (مطرود)'
    });
    console.log('🚫 لاعب مطرود:', kicked.name, '- غرفة:', code);

    // التحقق إذا الجولة تقدر تكمل
    if (room.state === 'playing') {
      checkIfRoundCanProceed(room);
    }
  });

  // ─────────────────────────────────────────────
  // تخطي السؤال (Skip Question)
  // ─────────────────────────────────────────────
  socket.on('skipQuestion', (code) => {
    if (typeof code !== 'string') return;
    const room = rooms.get(code);
    if (!room || socket.id !== room.hostId || room.state !== 'playing') return;
    clearRoundTimer(room);
    resetAnswers(room);
    room.gameData = {};
    startGameRound(room);
    console.log('⏭️ سؤال متخطى - غرفة:', code);
  });

  // ─────────────────────────────────────────────
  // قطع الاتصال (with 30s grace period)
  // ─────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log('🔴 لاعب انقطع:', socket.id);
    // تنظيف rate limiter entries
    Object.values(rateLimiters).forEach(rl => rl.cleanup && rl.cleanup(socket.id));

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
    case 'tshirtwars':
      startTshirtWarsRound(room);
      break;
    case 'lovemonster':
      startLoveMonsterRound(room);
      break;
    case 'inventions':
      startInventionsRound(room);
      break;
    case 'wouldyourather':
      startWouldYouRatherRound(room);
      break;
    case 'whosaidit':
      startWhoSaidItRound(room);
      break;
    case 'speedround':
      startSpeedRound(room);
      break;
    case 'twotruths':
      startTwoTruthsRound(room);
      break;
    case 'splittheroom':
      startSplitTheRoomRound(room);
      break;
    case 'emojidecode':
      startEmojiDecodeRound(room);
      break;
    case 'debateme':
      startDebateMeRound(room);
      break;
    case 'acrophobia':
      startAcrophobiaRound(room);
      break;
    default:
      console.log('❌ لعبة غير معروفة:', room.currentGame);
  }
}

/**
 * معالجة وصول كل الإجابات
 */
function handleAllAnswered(room) {
  // حماية ضد المعالجة المزدوجة
  if (room._roundProcessing) return;
  room._roundProcessing = true;
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
    case 'tshirtwars':
      startTshirtWarsVoting(room);
      break;
    case 'lovemonster':
      calculateLoveMonsterResults(room);
      break;
    case 'inventions':
      if (room.gameData.phase === 'inventing') {
        startInventionsDrawing(room); // go to drawing phase first
      } else {
        startInventionsVoting(room);
      }
      break;
    case 'wouldyourather':
      calculateWouldYouRatherResults(room);
      break;
    case 'whosaidit':
      if (room.gameData.phase === 'writing') {
        startWhoSaidItGuessing(room);
      } else {
        calculateWhoSaidItResults(room);
      }
      break;
    case 'speedround':
      calculateSpeedRoundResults(room);
      break;
    case 'twotruths':
      if (room.gameData.phase === 'writing') {
        startTwoTruthsGuessing(room);
      } else {
        calculateTwoTruthsResults(room);
      }
      break;
    case 'splittheroom':
      if (room.gameData.phase === 'filling') {
        startSplitTheRoomVoting(room);
      } else {
        calculateSplitTheRoomResults(room);
      }
      break;
    case 'emojidecode':
      calculateEmojiDecodeResults(room);
      break;
    case 'debateme':
      if (room.gameData.phase === 'arguing') {
        startDebateMeVoting(room);
      } else {
        calculateDebateMeResults(room);
      }
      break;
    case 'acrophobia':
      if (room.gameData.phase === 'writing') {
        startAcrophobiaVoting(room);
      } else {
        calculateAcrophobiaResults(room);
      }
      break;
    default:
      sendRoundResults(room, {});
  }
}

/**
 * حساب نتائج التصويت
 */
function calculateVoteResults(room) {
  // حماية ضد المعالجة المزدوجة
  if (room._roundProcessing) return;
  room._roundProcessing = true;
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
    case 'tshirtwars':
      calculateTshirtWarsResults(room);
      break;
    case 'inventions':
      calculateInventionsResults(room);
      break;
    case 'whosaidit':
      calculateWhoSaidItResults(room);
      break;
    case 'twotruths':
      calculateTwoTruthsResults(room);
      break;
    case 'splittheroom':
      calculateSplitTheRoomResults(room);
      break;
    case 'debateme':
      calculateDebateMeResults(room);
      break;
    case 'acrophobia':
      calculateAcrophobiaResults(room);
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
  const includeAudience = ['quiplash', 'fibbage', 'drawful', 'tshirtwars', 'inventions', 'acrophobia', 'debateme'].includes(room.currentGame);

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
    case 'guesspionage':
      // Audience can bet in Guesspionage (without earning points)
      return Array.from(room.players.values());
    case 'drawful':
      return Array.from(room.players.values()).filter(p => p.id !== room.gameData.drawerId);
    case 'whosaidit':
      return Array.from(room.players.values()).filter(p => !p.isAudience);
    case 'twotruths':
      // اللاعب المميز ما يصوت
      return Array.from(room.players.values()).filter(p => !p.isAudience && p.id !== room.gameData.featuredPlayerId);
    case 'splittheroom':
      // اللاعب اللي كتب السيناريو ما يصوت
      return Array.from(room.players.values()).filter(p => !p.isAudience && p.id !== room.gameData.fillerId);
    case 'debateme':
      // الكل يصوتون بس ما يصوتون لفريقهم
      return Array.from(room.players.values()).filter(p => !p.isAudience);
    case 'acrophobia':
      return Array.from(room.players.values()); // الجمهور يقدر يصوت
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
    room.currentRound = 0;
    room.gameData = {};
    // إعادة تعيين النقاط عند إلغاء اللعبة
    room.players.forEach(p => {
      p.score = 0;
      p.isAlive = true;
      p.isReady = false;
      p.currentAnswer = null;
      p.currentVote = null;
    });
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
  // حفظ بيانات المؤقت للإيقاف المؤقت
  room._timerStartedAt = Date.now();
  room._timerDuration = (timeLimit * 1000) + 2000;
  room._timerCallback = onTimeout;
  room._roundProcessing = false;

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
    // For Quiplash: use safety quip instead of __timeout__ if available
    const safetyQuips = room.gameData && room.gameData.safetyQuips;
    room.players.forEach(p => {
      if (p.currentAnswer === null) {
        if (room.currentGame === 'quiplash' && safetyQuips && safetyQuips.length > 0) {
          p.currentAnswer = safetyQuips[Math.floor(Math.random() * safetyQuips.length)];
        } else {
          p.currentAnswer = '__timeout__';
        }
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
 * بدء جولة رد سريع (Quiplash)
 * Real Jackbox mechanics:
 * - Rounds 1 & 2: Each matchup pair gets a unique prompt
 * - Round 3 (Thriplash): ONE prompt for ALL players, everyone writes, everyone votes
 * - Points per vote: R1=100, R2=150, R3=200
 * - QUIPLASH = unanimous vote = bonus points
 */
function startQuiplashRound(room) {
  // Round 3 = Thriplash (final round)
  if (room.currentRound === room.maxRounds - 1) {
    startQuiplashThriplash(room);
    return;
  }

  // Rounds 1 & 2: Create matchup pairs with UNIQUE prompts per pair
  const playerIds = shuffle(Array.from(room.players.keys()));
  const matchups = [];

  for (let i = 0; i < playerIds.length - 1; i += 2) {
    const questionData = pickQuestion(room, content.quiplash.questions);
    const question = typeof questionData === 'object' ? questionData.q : questionData;
    const safetyQuips = typeof questionData === 'object' && questionData.safetyQuips ? questionData.safetyQuips : [];

    matchups.push({
      players: [playerIds[i], playerIds[i + 1]],
      question,
      safetyQuips
    });
  }

  // Handle odd player: add to an extra matchup with a random opponent
  if (playerIds.length % 2 !== 0) {
    const lastPlayer = playerIds[playerIds.length - 1];
    const randomOpponent = playerIds[Math.floor(Math.random() * (playerIds.length - 1))];
    const questionData = pickQuestion(room, content.quiplash.questions);
    const question = typeof questionData === 'object' ? questionData.q : questionData;
    const safetyQuips = typeof questionData === 'object' && questionData.safetyQuips ? questionData.safetyQuips : [];

    matchups.push({
      players: [lastPlayer, randomOpponent],
      question,
      safetyQuips
    });
  }

  room.gameData.matchups = matchups;
  room.gameData.currentMatchupIndex = 0;
  room.gameData.matchupResults = [];
  room.gameData.phase = 'answering';
  room.gameData.playerMatchupMap = new Map(); // maps playerId → { matchupIndex, question }

  // Build player-to-matchup mapping
  matchups.forEach((m, idx) => {
    m.players.forEach(pid => {
      if (!room.gameData.playerMatchupMap.has(pid)) {
        room.gameData.playerMatchupMap.set(pid, { matchupIndex: idx, question: m.question, safetyQuips: m.safetyQuips });
      }
    });
  });

  const timeLimit = 60;

  // Send each player THEIR matchup's unique prompt
  room.players.forEach((p, id) => {
    const myMatchup = room.gameData.playerMatchupMap.get(id);
    const question = myMatchup ? myMatchup.question : matchups[0].question;
    const safetyQuips = myMatchup ? myMatchup.safetyQuips : [];

    io.to(id).emit('quiplashQuestion', {
      round: room.currentRound + 1,
      maxRounds: room.maxRounds,
      question,
      timeLimit,
      safetyQuips: safetyQuips.slice(0, 2)
    });
  });

  // مؤقت الإجابات
  setRoundTimer(room, timeLimit, () => {
    handleAllAnswered(room);
  });
}

/**
 * Thriplash: Final round - ONE prompt for ALL players
 * Everyone writes, everyone votes for their favorite (can't vote for self)
 * Points per vote: 300 (triple)
 */
function startQuiplashThriplash(room) {
  const questionData = pickQuestion(room, content.quiplash.questions);
  const question = typeof questionData === 'object' ? questionData.q : questionData;
  const safetyQuips = typeof questionData === 'object' && questionData.safetyQuips ? questionData.safetyQuips : [];

  room.gameData.question = question;
  room.gameData.phase = 'answering';
  room.gameData.isThriplash = true;
  room.gameData.safetyQuips = safetyQuips;

  const timeLimit = 60;

  io.to(room.code).emit('quiplashQuestion', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question,
    timeLimit,
    safetyQuips: safetyQuips.slice(0, 2),
    thriplash: true
  });

  setRoundTimer(room, timeLimit, () => {
    handleAllAnswered(room);
  });
}

/**
 * بدء مرحلة التصويت في رد سريع
 * Rounds 1&2: Use pre-created matchups with unique prompts
 * Round 3 (Thriplash): All answers shown, everyone votes for favorite
 */
function startQuiplashVoting(room) {
  room.gameData.phase = 'voting';

  // Thriplash: show all answers, vote for favorite
  if (room.gameData.isThriplash) {
    startQuiplashThriplashVoting(room);
    return;
  }

  // Rounds 1&2: Use pre-created matchups from startQuiplashRound
  const matchups = room.gameData.matchups || [];

  // Filter out matchups where both players timed out
  const validMatchups = matchups.filter(m => {
    const hasValidAnswer = m.players.some(pid => {
      const p = room.players.get(pid);
      return p && p.currentAnswer !== null && p.currentAnswer !== '__timeout__';
    });
    return hasValidAnswer;
  });

  if (validMatchups.length === 0) {
    sendRoundResults(room, {
      question: matchups[0]?.question || '',
      message: 'ما أحد جاوب! 😅'
    });
    return;
  }

  // Convert matchup format for voting: array of [player1Id, player2Id]
  room.gameData.votingMatchups = validMatchups.map(m => ({
    players: m.players,
    question: m.question
  }));
  room.gameData.currentMatchupIndex = 0;
  room.gameData.matchupResults = [];

  // بدء أول مواجهة
  presentQuiplashMatchup(room);
}

/**
 * Thriplash voting: show ALL answers, everyone picks their favorite
 */
function startQuiplashThriplashVoting(room) {
  // Collect all valid answers
  const answers = [];
  room.players.forEach((p, id) => {
    if (p.currentAnswer && p.currentAnswer !== '__timeout__') {
      answers.push({
        playerId: id,
        answer: p.currentAnswer
      });
    }
  });

  if (answers.length < 2) {
    sendRoundResults(room, {
      question: room.gameData.question,
      message: 'ما فيه إجابات كافية! 😅'
    });
    return;
  }

  room.gameData.thriplashAnswers = answers;

  // Reset votes
  room.players.forEach(p => { p.currentVote = null; });

  const timeLimit = 30;

  io.to(room.code).emit('quiplashThriplashVoting', {
    round: room.currentRound + 1,
    question: room.gameData.question,
    answers: shuffle(answers.map(a => ({
      playerId: a.playerId,
      answer: a.answer
    }))),
    timeLimit
  });

  setVoteTimer(room, timeLimit, () => {
    calculateQuiplashThriplashResults(room);
  });
}

/**
 * عرض مواجهة رد سريع للتصويت
 * Now uses matchup-specific questions from pre-created matchups
 */
function presentQuiplashMatchup(room) {
  const idx = room.gameData.currentMatchupIndex;
  const votingMatchups = room.gameData.votingMatchups || [];

  if (idx >= votingMatchups.length) {
    // كل المواجهات خلصت، نعرض النتائج
    finalizeQuiplashRound(room);
    return;
  }

  const matchupData = votingMatchups[idx];
  room.gameData.currentMatchup = matchupData.players;

  // إعادة تعيين التصويتات
  room.players.forEach(p => { p.currentVote = null; });

  const answers = matchupData.players.map(id => {
    const p = room.players.get(id);
    return {
      playerId: id,
      answer: p ? (p.currentAnswer || '...') : '...'
    };
  });

  const timeLimit = 30;

  io.to(room.code).emit('quiplashVoting', {
    round: room.currentRound + 1,
    question: matchupData.question, // Each matchup has its own question!
    answers: shuffle(answers),
    matchupNumber: idx + 1,
    totalMatchups: votingMatchups.length,
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

  // حساب الأصوات + تتبع المصوتين لكل إجابة
  const votes = {};
  const voterBreakdown = {}; // { playerId: [{ name, avatar, color }] }
  matchup.forEach(id => { votes[id] = 0; voterBreakdown[id] = []; });

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
        // Track voter for stacking bar visualization
        voterBreakdown[p.currentVote].push({
          name: p.name,
          avatar: p.avatar,
          avatarData: p.avatarData || null,
          color: p.color
        });
      }
    }
  });

  // Merge audience votes (weighted)
  matchup.forEach(id => {
    votes[id] = (votes[id] || 0) + Math.round(audienceVotes[id]);
  });

  // JINX detection: identical answers = 0 points for both
  const answers = matchup.map(id => {
    const p = room.players.get(id);
    return p ? (p.currentAnswer || '').trim().toLowerCase() : '';
  });
  const isJinx = answers.length === 2 && answers[0] === answers[1] && answers[0] !== '' && answers[0] !== '__timeout__';

  // Escalating points per round: R1=100, R2=150, R3+=200
  const pointsPerVote = room.currentRound === 0 ? 100 : room.currentRound === 1 ? 150 : 200;

  // حساب النقاط
  const matchupResult = {};
  matchup.forEach(id => {
    const player = room.players.get(id);
    if (!player) return;

    const voteCount = votes[id] || 0;
    let points = isJinx ? 0 : voteCount * pointsPerVote;
    let quiplash = false;

    // بونص الإجماع: لو كل الأصوات لك (و فيه أصوات أصلاً) - لا ينطبق في حالة الجينكس
    if (!isJinx && totalVoters > 0 && voteCount === totalVoters) {
      points += 200;
      quiplash = true;
    }

    player.score += points;

    // تتبع الإحصائيات
    if (room.gameStats) {
      const prev = room.gameStats.votesReceived.get(id) || 0;
      room.gameStats.votesReceived.set(id, prev + voteCount);
      if (quiplash) {
        room.gameStats.quiplashCount.set(id, (room.gameStats.quiplashCount.get(id) || 0) + 1);
      }
      if (!isJinx && voteCount === 0 && totalVoters > 0) {
        room.gameStats.zeroVotes.set(id, (room.gameStats.zeroVotes.get(id) || 0) + 1);
      }
    }

    matchupResult[id] = {
      playerId: id,
      playerName: player.name,
      playerAvatar: player.avatar,
      playerAvatarData: player.avatarData || null,
      answer: player.currentAnswer,
      votes: voteCount,
      points,
      quiplash,
      jinx: isJinx,
      avatar: player.avatar,
      avatarData: player.avatarData || null
    };
  });

  // Track matchup winner
  if (!isJinx && room.gameStats && matchup.length === 2) {
    const r0 = matchupResult[matchup[0]];
    const r1 = matchupResult[matchup[1]];
    if (r0 && r1 && r0.votes !== r1.votes) {
      const winnerId = r0.votes > r1.votes ? matchup[0] : matchup[1];
      room.gameStats.matchupWins.set(winnerId, (room.gameStats.matchupWins.get(winnerId) || 0) + 1);
    }
  }

  room.gameData.matchupResults.push(matchupResult);

  // إرسال نتيجة المواجهة مع تفاصيل المصوتين
  io.to(room.code).emit('quiplashMatchupResult', {
    results: Object.values(matchupResult),
    voterBreakdown,
    question: room.gameData.question,
    jinx: isJinx,
    players: getPlayerList(room)
  });

  // الانتقال للمواجهة التالية بعد ثوان
  room.gameData.currentMatchupIndex++;

  setTimeout(() => {
    const votingMatchups = room.gameData.votingMatchups || [];
    if (room.gameData.currentMatchupIndex < votingMatchups.length) {
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
    matchupResults: room.gameData.matchupResults
  });
}

/**
 * حساب نتائج Thriplash (الجولة النهائية)
 * Points: 300 per vote (triple), QUIPLASH bonus = 600
 */
function calculateQuiplashThriplashResults(room) {
  const answers = room.gameData.thriplashAnswers || [];
  const pointsPerVote = 300;

  // Count votes (can't vote for self)
  const votes = {};
  const voterBreakdown = {};
  answers.forEach(a => { votes[a.playerId] = 0; voterBreakdown[a.playerId] = []; });

  let totalVoters = 0;

  room.players.forEach((p, id) => {
    if (p.currentVote && p.currentVote !== '__timeout__' && votes.hasOwnProperty(p.currentVote) && p.currentVote !== id) {
      votes[p.currentVote]++;
      totalVoters++;
      voterBreakdown[p.currentVote].push({
        name: p.name,
        avatar: p.avatar,
        avatarData: p.avatarData || null,
        color: p.color
      });
    }
  });

  const results = answers.map(a => {
    const player = room.players.get(a.playerId);
    const voteCount = votes[a.playerId] || 0;
    let points = voteCount * pointsPerVote;
    let quiplash = false;

    // QUIPLASH: all votes go to this answer
    if (totalVoters > 0 && voteCount === totalVoters) {
      points += 600; // Triple bonus
      quiplash = true;
    }

    if (player) player.score += points;

    // Track stats
    if (room.gameStats) {
      const prev = room.gameStats.votesReceived.get(a.playerId) || 0;
      room.gameStats.votesReceived.set(a.playerId, prev + voteCount);
      if (quiplash) {
        room.gameStats.quiplashCount.set(a.playerId, (room.gameStats.quiplashCount.get(a.playerId) || 0) + 1);
      }
      if (voteCount === 0 && totalVoters > 0) {
        room.gameStats.zeroVotes.set(a.playerId, (room.gameStats.zeroVotes.get(a.playerId) || 0) + 1);
      }
    }

    return {
      playerId: a.playerId,
      playerName: player ? player.name : 'مجهول',
      playerAvatar: player ? player.avatar : '😀',
      playerAvatarData: player ? player.avatarData || null : null,
      answer: a.answer,
      votes: voteCount,
      points,
      quiplash
    };
  });

  results.sort((a, b) => b.votes - a.votes);

  io.to(room.code).emit('quiplashThriplashResult', {
    question: room.gameData.question,
    results,
    voterBreakdown,
    players: getPlayerList(room),
    isLastRound: true
  });

  // After showing Thriplash results, finalize the round
  setTimeout(() => {
    sendRoundResults(room, {
      thriplash: true,
      thriplashResults: results,
      question: room.gameData.question
    });
  }, 5000);
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

    // تتبع الإحصائيات
    if (room.gameStats && betCorrect) {
      room.gameStats.correctGuesses.set(id, (room.gameStats.correctGuesses.get(id) || 0) + 1);
    }

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
/**
 * Guesspionage "The Round-Up" Final Round - Real Jackbox:
 * 6 rapid-fire questions shown one at a time
 * Each player quickly guesses Higher or Lower than the shown percentage
 * Points for each correct guess, bonus for streaks
 */
function startGuesspionageFinalRound(room) {
  const allQuestions = content.guesspionage.questions;
  const pool = allQuestions.filter((_, i) => !room.usedQuestions.has(`guesspionage_${i}`));
  const sourcePool = pool.length >= 6 ? pool : allQuestions;
  const picked = shuffle(sourcePool).slice(0, 6);

  room.gameData.phase = 'final';
  room.gameData.finalQuestions = picked;
  room.gameData.finalIndex = 0;
  room.gameData.finalScores = {};
  room.gameData.finalStreaks = {};

  room.players.forEach((_, id) => {
    room.gameData.finalScores[id] = 0;
    room.gameData.finalStreaks[id] = 0;
  });

  presentFinalQuestion(room);
}

function presentFinalQuestion(room) {
  clearRoundTimer(room);
  const idx = room.gameData.finalIndex;
  const questions = room.gameData.finalQuestions;

  if (idx >= questions.length) {
    // All 6 questions done - show final results
    showFinalRoundResults(room);
    return;
  }

  const q = questions[idx];
  // Show a fake percentage that's off by 15-30 points
  const offset = (Math.random() > 0.5 ? 1 : -1) * (15 + Math.floor(Math.random() * 16));
  const fakePercent = Math.max(5, Math.min(95, q.a + offset));

  room.gameData.currentFakePercent = fakePercent;
  room.gameData.currentRealPercent = q.a;

  resetAnswers(room);
  const timeLimit = 10; // Rapid-fire: only 10 seconds

  io.to(room.code).emit('guesspionageFinalQuestion', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    questionNum: idx + 1,
    totalQuestions: questions.length,
    question: q.q,
    shownPercent: fakePercent,
    timeLimit
  });

  setRoundTimer(room, timeLimit, () => {
    resolveFinalQuestion(room);
  });
}

function resolveFinalQuestion(room) {
  clearRoundTimer(room);
  const realPercent = room.gameData.currentRealPercent;
  const fakePercent = room.gameData.currentFakePercent;
  const correctAnswer = realPercent > fakePercent ? 'higher' : (realPercent < fakePercent ? 'lower' : 'higher');

  room.players.forEach((p, id) => {
    if (p.currentAnswer === correctAnswer) {
      room.gameData.finalStreaks[id]++;
      const streakBonus = room.gameData.finalStreaks[id] > 1 ? room.gameData.finalStreaks[id] * 200 : 0;
      room.gameData.finalScores[id] += 500 + streakBonus;
    } else {
      room.gameData.finalStreaks[id] = 0;
    }
  });

  // Show quick result
  io.to(room.code).emit('guesspionageFinalAnswer', {
    questionNum: room.gameData.finalIndex + 1,
    totalQuestions: room.gameData.finalQuestions.length,
    question: room.gameData.finalQuestions[room.gameData.finalIndex].q,
    shownPercent: fakePercent,
    realPercent,
    correctAnswer
  });

  room.gameData.finalIndex++;
  room.roundTimer = setTimeout(() => {
    presentFinalQuestion(room);
  }, 3000);
}

function showFinalRoundResults(room) {
  const playerResults = [];
  room.players.forEach((p, id) => {
    const pts = room.gameData.finalScores[id] || 0;
    p.score += pts;
    playerResults.push({
      playerId: id,
      playerName: p.name,
      points: pts
    });
  });

  playerResults.sort((a, b) => b.points - a.points);

  io.to(room.code).emit('roundResults', {
    game: 'guesspionage',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    isFinalRound: true,
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
 * بدء جولة المزيّف - Real Jackbox mechanics:
 * - Same faker across all sub-rounds
 * - 3 tasks per round (increasing tension)
 * - Discussion phase after each task (players debate who the faker is)
 * - Then vote
 */
function startFakinItRound(room) {
  // اختيار المزيّف عشوائياً (stays same for entire round)
  const playerIds = Array.from(room.players.keys());
  const fakerId = playerIds[Math.floor(Math.random() * playerIds.length)];
  room.gameData.fakerId = fakerId;
  room.gameData.subRound = 0;
  room.gameData.maxSubRounds = 3; // 3 tasks with discussion (real Jackbox)

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

  // After task timer, start discussion phase (real Jackbox: discuss then vote)
  room.roundTimer = setTimeout(() => {
    startFakinItDiscussion(room);
  }, (timeLimit * 1000) + 2000);
}

/**
 * مرحلة النقاش (Discussion Phase) - Real Jackbox TMP mechanic
 * Players discuss who they think is faking before voting
 */
function startFakinItDiscussion(room) {
  clearRoundTimer(room);
  room.gameData.phase = 'discussion';

  const timeLimit = 20; // 20 seconds to discuss

  io.to(room.code).emit('fakinItDiscussion', {
    round: room.currentRound + 1,
    subRound: room.gameData.subRound,
    maxSubRounds: room.gameData.maxSubRounds,
    task: room.gameData.task,
    category: room.gameData.categoryName,
    instruction: room.gameData.instruction,
    players: getPlayerList(room),
    timeLimit
  });

  room.roundTimer = setTimeout(() => {
    startFakinItVoting(room);
  }, (timeLimit * 1000));
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
 * تحديات الموت (Killing Floor mini-games) - Real Jackbox TMP style
 * Each challenge type has different mechanics:
 * - 'write': Write an answer matching a category (speed-based)
 * - 'math': Solve a math problem
 * - 'choice': Pick the right choice from options (Chalices-style)
 * - 'unscramble': Unscramble a word
 * - 'match': Type a word that matches a condition
 */
const deathChallengeTypes = [
  // Type 1: Speed Writing (classic - write something matching category)
  { type: 'write', challenge: 'اكتب اسم أي دولة عربية!', icon: '🌍' },
  { type: 'write', challenge: 'اكتب اسم أي فاكهة!', icon: '🍎' },
  { type: 'write', challenge: 'اكتب اسم أي حيوان!', icon: '🐾' },
  { type: 'write', challenge: 'اكتب اسم أي مدينة سعودية!', icon: '🏙️' },
  { type: 'write', challenge: 'اكتب اسم أي أكلة سعودية!', icon: '🍚' },
  { type: 'write', challenge: 'اكتب اسم أي كوكب!', icon: '🪐' },
  { type: 'write', challenge: 'اكتب اسم لاعب كرة قدم!', icon: '⚽' },
  { type: 'write', challenge: 'اكتب اسم فيلم أو مسلسل!', icon: '🎬' },
  { type: 'write', challenge: 'اكتب اسم أغنية أو شيلة!', icon: '🎵' },
  { type: 'write', challenge: 'اكتب اسم لعبة فيديو!', icon: '🎮' },
  { type: 'write', challenge: 'اكتب شي تلقاه في المطبخ!', icon: '🍳' },
  { type: 'write', challenge: 'اكتب اسم عاصمة أي دولة!', icon: '🏛️' },
  { type: 'write', challenge: 'اكتب اسم أي نبي!', icon: '📿' },
  { type: 'write', challenge: 'اكتب شي لونه أحمر!', icon: '🔴' },
  { type: 'write', challenge: 'اكتب شي لونه أخضر!', icon: '🟢' },
  { type: 'write', challenge: 'اكتب اسم حيوان بحري!', icon: '🐠' },

  // Type 2: Math Challenges (Loser Wheel / Math problems)
  { type: 'math', challenge: 'حل المعادلة: ٧ × ٨ = ؟', answer: '56', icon: '🔢' },
  { type: 'math', challenge: 'حل المعادلة: ١٢ × ٥ = ؟', answer: '60', icon: '🔢' },
  { type: 'math', challenge: 'حل المعادلة: ١٥ + ٢٨ = ؟', answer: '43', icon: '🔢' },
  { type: 'math', challenge: 'حل المعادلة: ١٠٠ - ٣٧ = ؟', answer: '63', icon: '🔢' },
  { type: 'math', challenge: 'حل المعادلة: ٩ × ٩ = ؟', answer: '81', icon: '🔢' },
  { type: 'math', challenge: 'حل المعادلة: ١٤٤ ÷ ١٢ = ؟', answer: '12', icon: '🔢' },
  { type: 'math', challenge: 'حل المعادلة: ٢٥ × ٤ = ؟', answer: '100', icon: '🔢' },
  { type: 'math', challenge: 'حل المعادلة: ٣٣ + ٦٧ = ؟', answer: '100', icon: '🔢' },

  // Type 3: Chalices - Pick a number (1-5), one kills you (luck-based)
  { type: 'chalice', challenge: 'اختر كأس! واحد منهم مسموم... 💀', options: 5, icon: '🏆' },
  { type: 'chalice', challenge: 'اختر باب! واحد منهم فيه الوحش... 👹', options: 4, icon: '🚪' },
  { type: 'chalice', challenge: 'اختر صندوق! واحد فيه قنبلة... 💣', options: 4, icon: '📦' },

  // Type 4: Word match - Write a word matching specific criteria
  { type: 'match', challenge: 'اكتب كلمة تبدأ بحرف الميم!', letter: 'م', icon: '✏️' },
  { type: 'match', challenge: 'اكتب كلمة تبدأ بحرف العين!', letter: 'ع', icon: '✏️' },
  { type: 'match', challenge: 'اكتب كلمة تبدأ بحرف السين!', letter: 'س', icon: '✏️' },
  { type: 'match', challenge: 'اكتب كلمة من 7 أحرف أو أكثر!', minLength: 7, icon: '📏' },
  { type: 'match', challenge: 'اكتب رقم زوجي بين 10 و 100!', matchType: 'evenNumber', icon: '🔢' },
  { type: 'match', challenge: 'اكتب رقم أكبر من 100 وأصغر من 1000!', matchType: 'rangeNumber', icon: '🔢' },

  // Type 5: Mind Meld - dead players must write the SAME word (cooperation)
  { type: 'mindmeld', challenge: '🧠 توافق ذهني! كلكم اكتبوا نفس الكلمة! الموضوع: أكل', topic: 'أكل', icon: '🧠' },
  { type: 'mindmeld', challenge: '🧠 توافق ذهني! كلكم اكتبوا نفس الكلمة! الموضوع: لون', topic: 'لون', icon: '🧠' },
  { type: 'mindmeld', challenge: '🧠 توافق ذهني! كلكم اكتبوا نفس الكلمة! الموضوع: حيوان', topic: 'حيوان', icon: '🧠' },
  { type: 'mindmeld', challenge: '🧠 توافق ذهني! كلكم اكتبوا نفس الكلمة! الموضوع: رقم (1-10)', topic: 'رقم', icon: '🧠' },
  { type: 'mindmeld', challenge: '🧠 توافق ذهني! كلكم اكتبوا نفس الكلمة! الموضوع: بلد', topic: 'بلد', icon: '🧠' }
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

      // تتبع الإحصائيات
      if (room.gameStats) {
        room.gameStats.correctGuesses.set(p.id, (room.gameStats.correctGuesses.get(p.id) || 0) + 1);
        const currentMax = room.gameStats.streaks.get(p.id) || 0;
        if (p.streak > currentMax) {
          room.gameStats.streaks.set(p.id, p.streak);
        }
      }
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
 * بدء تحدي الموت (Killing Floor mini-game)
 * Different challenge types for variety - like real Jackbox TMP
 */
function startDeathChallenge(room) {
  const challengeData = deathChallengeTypes[Math.floor(Math.random() * deathChallengeTypes.length)];
  room.gameData.deathChallenge = challengeData;
  room.gameData.phase = 'deathChallenge';

  // For chalice type, pick which option is the "poison"
  if (challengeData.type === 'chalice') {
    room.gameData.poisonChoice = Math.floor(Math.random() * challengeData.options) + 1;
  }

  // إعادة تعيين الإجابات للميتين الجدد فقط
  const deadIds = room.gameData.newlyDead.map(p => p.id);
  deadIds.forEach(id => {
    const p = room.players.get(id);
    if (p) p.currentAnswer = null;
  });

  const timeLimit = challengeData.type === 'chalice' ? 8 : 10;

  // إرسال التحدي لكل الميتين الجدد
  deadIds.forEach(id => {
    io.to(id).emit('deathChallenge', {
      challenge: challengeData.challenge,
      challengeType: challengeData.type,
      icon: challengeData.icon,
      options: challengeData.options || null,
      timeLimit
    });
  });

  // إبلاغ الجميع
  io.to(room.code).emit('deathChallengeStarted', {
    deadPlayers: room.gameData.newlyDead,
    challengeType: challengeData.type,
    challengeIcon: challengeData.icon,
    challengeText: challengeData.challenge,
    timeLimit
  });

  // بعد انتهاء الوقت
  room.roundTimer = setTimeout(() => {
    resolveDeathChallenge(room);
  }, (timeLimit * 1000) + 2000);
}

/**
 * حل تحدي الموت - Different logic per challenge type
 */
function resolveDeathChallenge(room) {
  clearRoundTimer(room);

  const deadIds = room.gameData.newlyDead.map(p => p.id);
  const revived = [];
  const challengeData = room.gameData.deathChallenge || { type: 'write' };

  deadIds.forEach(id => {
    const p = room.players.get(id);
    if (!p || !p.currentAnswer || p.currentAnswer === '__timeout__') return;
    const ans = p.currentAnswer.trim();
    let survived = false;

    switch (challengeData.type) {
      case 'write':
        // Must write a valid answer (2+ chars with real content)
        survived = ans.length >= 2 && /[\u0600-\u06FFa-zA-Z0-9]/.test(ans);
        break;

      case 'math':
        // Must match the correct numerical answer
        survived = ans.replace(/[^\d]/g, '') === challengeData.answer;
        break;

      case 'chalice':
        // Survived if they didn't pick the poison
        survived = parseInt(ans) !== room.gameData.poisonChoice && parseInt(ans) >= 1 && parseInt(ans) <= (challengeData.options || 5);
        break;

      case 'match':
        if (challengeData.letter) {
          // Word must start with the specified letter
          survived = ans.length >= 2 && ans.charAt(0) === challengeData.letter;
        } else if (challengeData.minLength) {
          survived = ans.length >= challengeData.minLength;
        } else if (challengeData.matchType === 'evenNumber') {
          const num = parseInt(ans);
          survived = !isNaN(num) && num % 2 === 0 && num >= 10 && num <= 100;
        } else if (challengeData.matchType === 'rangeNumber') {
          const num = parseInt(ans);
          survived = !isNaN(num) && num > 100 && num < 1000;
        } else {
          survived = ans.length >= 2;
        }
        break;

      case 'mindmeld':
        // Will be checked after - all dead players must match
        survived = ans.length >= 1; // mark as valid for now
        break;

      default:
        survived = ans.length >= 2 && /[\u0600-\u06FFa-zA-Z0-9]/.test(ans);
    }

    if (survived) {
      revived.push({ id: p.id, name: p.name, answer: ans });
    }
  });

  // Mind Meld special: only revive if ALL dead players wrote the SAME word
  if (challengeData.type === 'mindmeld' && revived.length > 1) {
    const answers = revived.map(r => r.answer.toLowerCase().trim());
    const allSame = answers.every(a => a === answers[0]);
    if (!allSame) {
      // Nobody survives if they don't match
      revived.length = 0;
    }
  }

  // Actually revive survivors
  revived.forEach(r => {
    const p = room.players.get(r.id);
    if (p) p.isAlive = true;
  });

  const resultData = {
    revived: revived.map(r => ({ id: r.id, name: r.name })),
    stillDead: deadIds.filter(id => !revived.find(r => r.id === id)).map(id => {
      const p = room.players.get(id);
      return { id, name: p ? p.name : 'مجهول' };
    }),
    challengeType: challengeData.type,
    players: getPlayerList(room)
  };

  // Add type-specific result info
  if (challengeData.type === 'chalice') {
    resultData.poisonChoice = room.gameData.poisonChoice;
  } else if (challengeData.type === 'math') {
    resultData.correctAnswer = challengeData.answer;
  }

  io.to(room.code).emit('deathChallengeResult', resultData);

  // إرسال نتائج الجولة النهائية
  setTimeout(() => {
    sendRoundResults(room, {
      correctAnswer: room.gameData.question.o[room.gameData.question.c],
      newlyDead: room.gameData.newlyDead,
      revived: revived.map(r => ({ id: r.id, name: r.name }))
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

  // Generate category hint from the question pattern
  const categoryHints = {
    'السعودية': '🇸🇦 حقائق سعودية',
    'الملك': '👑 تاريخ المملكة',
    'أول': '📅 أوائل',
    'أكبر': '📊 أرقام قياسية',
    'مدينة': '🏙️ مدن ومناطق',
    'عام': '📅 تواريخ',
    'مليون': '📊 أرقام وإحصائيات',
    'أكل': '🍽️ مأكولات',
    'كبسة': '🍽️ مأكولات',
    'جمال': '🐪 حيوانات'
  };
  let category = '🎭 حقائق مثيرة';
  for (const [key, val] of Object.entries(categoryHints)) {
    if (question.q.includes(key)) { category = val; break; }
  }

  io.to(room.code).emit('fibbageQuestion', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question: question.q,
    category,
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

  // جمع الإجابات الكاذبة الصالحة (de-duplicate similar lies)
  const fakeAnswers = [];
  const seenLies = new Set();
  const correctNorm = room.gameData.question.a.trim().toLowerCase();
  room.players.forEach((p, id) => {
    if (p.currentAnswer && p.currentAnswer !== '__timeout__' && p.currentAnswer.trim().length > 0) {
      const norm = p.currentAnswer.trim().toLowerCase();
      // Skip if duplicate of another lie or matches the correct answer
      if (seenLies.has(norm) || norm === correctNorm) return;
      seenLies.add(norm);
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

    // تتبع الإحصائيات
    if (room.gameStats) {
      if (guessedCorrect) {
        room.gameStats.correctGuesses.set(id, (room.gameStats.correctGuesses.get(id) || 0) + 1);
      }
      if (fooledCount > 0) {
        room.gameStats.fooledCounts.set(id, (room.gameStats.fooledCounts.get(id) || 0) + fooledCount);
      }
    }

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
// 🎨 ارسم لي (Drawful) - Real Jackbox: ALL players draw simultaneously
// ═══════════════════════════════════════════════════════════════════

/**
 * بدء جولة ارسم لي - Real Drawful:
 * Phase 1: ALL players draw simultaneously with unique prompts
 * Phase 2: Present each drawing one by one (guess → vote → reveal)
 */
function startDrawfulRound(room) {
  const playerIds = Array.from(room.players.keys());

  // If drawings not collected yet, start drawing phase for ALL players
  if (!room.gameData.allDrawings) {
    room.gameData.allDrawings = {};
    room.gameData.playerPrompts = {};
    room.gameData.drawingsDone = 0;
    room.gameData.presentationIndex = 0;
    room.gameData.presentationOrder = shuffle([...playerIds]);
    room.gameData.phase = 'drawing';

    // Give each player a UNIQUE prompt
    playerIds.forEach(pid => {
      const prompt = pickQuestion(room, content.drawful.prompts);
      room.gameData.playerPrompts[pid] = prompt;
    });

    const timeLimit = 90;

    // Send each player their unique prompt - ALL draw simultaneously
    playerIds.forEach(pid => {
      io.to(pid).emit('drawfulYourTurn', {
        round: room.currentRound + 1,
        maxRounds: room.maxRounds,
        prompt: room.gameData.playerPrompts[pid],
        timeLimit,
        allDraw: true // flag: everyone draws, no waiting screen
      });
    });

    // After time runs out, collect whatever we have and start presentations
    clearRoundTimer(room);
    room.roundTimer = setTimeout(() => {
      // Fill in empty drawings for anyone who didn't submit
      playerIds.forEach(pid => {
        if (!room.gameData.allDrawings[pid]) {
          room.gameData.allDrawings[pid] = '[]';
        }
      });
      presentNextDrawfulDrawing(room);
    }, (timeLimit * 1000) + 2000);
  } else {
    // Continue presentations (called after results shown)
    presentNextDrawfulDrawing(room);
  }
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
 * Present the next player's drawing for guessing
 */
function presentNextDrawfulDrawing(room) {
  clearRoundTimer(room);
  const order = room.gameData.presentationOrder;
  const idx = room.gameData.presentationIndex;

  if (idx >= order.length) {
    // All drawings presented - end this round
    io.to(room.code).emit('roundResults', {
      game: 'drawful',
      round: room.currentRound + 1,
      maxRounds: room.maxRounds,
      allDone: true,
      players: getPlayerList(room),
      isLastRound: room.currentRound >= room.maxRounds - 1
    });
    return;
  }

  const drawerId = order[idx];
  const drawer = room.players.get(drawerId);
  room.gameData.currentDrawerId = drawerId;
  room.gameData.currentPrompt = room.gameData.playerPrompts[drawerId];
  room.gameData.currentDrawing = room.gameData.allDrawings[drawerId];
  room.gameData.phase = 'guessing';

  // Reset answers for this presentation
  resetAnswers(room);

  const timeLimit = 45;
  const total = order.length;

  // Show this drawing - others write fake titles
  io.to(room.code).emit('drawfulGuessing', {
    round: room.currentRound + 1,
    drawing: room.gameData.currentDrawing,
    drawerId: drawerId,
    drawerName: drawer ? drawer.name : 'لاعب',
    presentNum: idx + 1,
    presentTotal: total,
    timeLimit
  });

  // Timer for guessing
  setRoundTimer(room, timeLimit, () => {
    room.players.forEach(p => {
      if (p.id !== drawerId && p.currentAnswer === null) {
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

  const drawerId = room.gameData.currentDrawerId;

  // جمع التخمينات
  const guesses = [];
  room.players.forEach((p, id) => {
    if (id !== drawerId && p.currentAnswer && p.currentAnswer !== '__timeout__') {
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
    text: room.gameData.currentPrompt,
    authorId: null,
    isCorrect: true
  };

  const allOptions = shuffle([...guesses, correctOption]);
  room.gameData.guessOptions = allOptions;

  // إعادة تعيين التصويتات
  room.players.forEach(p => { p.currentVote = null; });

  const timeLimit = 30;

  // إرسال الخيارات للتصويت
  io.to(room.code).emit('drawfulVoting', {
    round: room.currentRound + 1,
    drawing: room.gameData.currentDrawing,
    options: allOptions.map(o => ({ id: o.id, text: o.text })),
    drawerId: drawerId,
    timeLimit
  });

  // مؤقت التصويت
  setVoteTimer(room, timeLimit, () => {
    calculateDrawfulResults(room);
  });
}

/**
 * حساب نتائج ارسم لي - per-drawing results then auto-advance
 */
function calculateDrawfulResults(room) {
  const options = room.gameData.guessOptions;
  const playerResults = [];
  const drawerId = room.gameData.currentDrawerId;
  const drawer = room.players.get(drawerId);
  let drawerPoints = 0;

  room.players.forEach((p, id) => {
    if (id === drawerId) return;

    let points = 0;
    let guessedCorrect = false;
    let fooledCount = 0;

    if (p.currentVote === 'correct') {
      points += 500;
      guessedCorrect = true;
      drawerPoints += 250;
    }

    const myGuessId = `guess_${id}`;
    room.players.forEach((other, otherId) => {
      if (otherId !== id && otherId !== drawerId && other.currentVote === myGuessId) {
        points += 250;
        fooledCount++;
      }
    });

    p.score += points;

    if (room.gameStats) {
      if (guessedCorrect) {
        room.gameStats.correctGuesses.set(id, (room.gameStats.correctGuesses.get(id) || 0) + 1);
      }
      if (fooledCount > 0) {
        room.gameStats.fooledCounts.set(id, (room.gameStats.fooledCounts.get(id) || 0) + fooledCount);
      }
    }

    playerResults.push({
      playerId: id,
      playerName: p.name,
      guess: p.currentAnswer !== '__timeout__' ? p.currentAnswer : null,
      guessedCorrect,
      fooledCount,
      points
    });
  });

  if (drawer) {
    drawer.score += drawerPoints;
  }

  playerResults.push({
    playerId: drawerId,
    playerName: drawer ? drawer.name : 'الرسام',
    isDrawer: true,
    points: drawerPoints
  });

  const order = room.gameData.presentationOrder;
  const idx = room.gameData.presentationIndex;
  const hasMore = idx + 1 < order.length;

  // Show per-drawing results
  io.to(room.code).emit('drawfulDrawingResult', {
    game: 'drawful',
    prompt: room.gameData.currentPrompt,
    drawing: room.gameData.currentDrawing,
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
    hasMore,
    presentNum: idx + 1,
    presentTotal: order.length,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });

  // Auto-advance to next drawing after delay
  room.gameData.presentationIndex++;
  room.roundTimer = setTimeout(() => {
    resetAnswers(room);
    presentNextDrawfulDrawing(room);
  }, 5000);
}

// ═══════════════════════════════════════════════════════════════════
// 👕 حرب التيشيرتات (T-Shirt Wars / Tee K.O.)
// ═══════════════════════════════════════════════════════════════════

/**
 * Tee K.O. - Real Jackbox flow:
 * Phase 1: Write 2 slogans each (go into shared pool)
 * Phase 2: Draw 1 shirt design each (canvas)
 * Phase 3: Combine - pick slogan for your design
 * Phase 4: Tournament bracket voting (head-to-head)
 */
function startTshirtWarsRound(room) {
  // Phase routing
  if (!room.gameData.tkoPhase) {
    room.gameData.tkoPhase = 'slogans';
    room.gameData.sloganPool = [];
    room.gameData.playerSlogans = {};
    room.gameData.playerDrawings = {};
    room.gameData.shirts = [];
  }

  const phase = room.gameData.tkoPhase;

  if (phase === 'slogans') {
    startTkoSlogans(room);
  } else if (phase === 'drawing') {
    startTkoDrawing(room);
  } else if (phase === 'combine') {
    startTkoCombine(room);
  } else if (phase === 'tournament') {
    startTkoTournament(room);
  }
}

function startTkoSlogans(room) {
  room.gameData.phase = 'writing';
  room.gameData.sloganSubmits = {};

  // Give each player a prompt to inspire their slogans
  const prompt = pickQuestion(room, content.tshirtwars.slogans.map((s, i) => ({ q: s, a: '', _idx: i })));

  const timeLimit = 60;

  io.to(room.code).emit('tshirtWarsSlogan', {
    prompt: prompt.q,
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    timeLimit,
    phase: 'slogans',
    sloganCount: 2
  });

  setRoundTimer(room, timeLimit, () => {
    finishTkoSlogans(room);
  });
}

function finishTkoSlogans(room) {
  clearRoundTimer(room);
  // Collect slogans submitted via tkoSubmitSlogans event
  // Move to drawing phase
  room.gameData.tkoPhase = 'drawing';
  startTkoDrawing(room);
}

function startTkoDrawing(room) {
  room.gameData.phase = 'tko_drawing';

  const timeLimit = 90;

  // Send each player a random draw prompt as inspiration for their t-shirt design
  const drawPrompts = content.tshirtwars.drawPrompts || [];
  const playerIds = Array.from(room.players.keys());
  playerIds.forEach(id => {
    const prompt = drawPrompts.length > 0
      ? drawPrompts[Math.floor(Math.random() * drawPrompts.length)]
      : null;
    io.to(id).emit('tshirtWarsDraw', {
      round: room.currentRound + 1,
      maxRounds: room.maxRounds,
      timeLimit,
      phase: 'drawing',
      drawPrompt: prompt
    });
  });

  // Timer: after time, collect whatever drawings exist
  clearRoundTimer(room);
  room.roundTimer = setTimeout(() => {
    finishTkoDrawing(room);
  }, (timeLimit * 1000) + 2000);
}

function finishTkoDrawing(room) {
  clearRoundTimer(room);
  // Fill empty drawings
  room.players.forEach((p, id) => {
    if (!room.gameData.playerDrawings[id]) {
      room.gameData.playerDrawings[id] = '[]';
    }
  });
  room.gameData.tkoPhase = 'combine';
  startTkoCombine(room);
}

function startTkoCombine(room) {
  room.gameData.phase = 'combine';
  room.gameData.shirtChoices = {};

  const pool = room.gameData.sloganPool;
  const timeLimit = 30;

  // Each player gets 3 random slogans from the pool (not their own)
  room.players.forEach((p, id) => {
    const otherSlogans = pool.filter(s => s.authorId !== id);
    const ownSlogans = pool.filter(s => s.authorId === id);
    // Mix: 2 from others + 1 of own (or fill from pool if not enough)
    const available = shuffle([...otherSlogans]).slice(0, 2);
    available.push(...shuffle([...ownSlogans]).slice(0, 1));
    // If not enough, add more from pool
    if (available.length < 3) {
      const remaining = pool.filter(s => !available.includes(s));
      available.push(...shuffle(remaining).slice(0, 3 - available.length));
    }

    io.to(id).emit('tshirtWarsCombine', {
      drawing: room.gameData.playerDrawings[id],
      slogans: available.map((s, i) => ({ id: i, text: s.text })),
      timeLimit
    });
  });

  clearRoundTimer(room);
  room.roundTimer = setTimeout(() => {
    finishTkoCombine(room);
  }, (timeLimit * 1000) + 2000);
}

function finishTkoCombine(room) {
  clearRoundTimer(room);

  // Create shirts from choices
  const shirts = [];
  room.players.forEach((p, id) => {
    const choice = room.gameData.shirtChoices[id];
    const drawing = room.gameData.playerDrawings[id];
    let slogan = 'بدون شعار';
    if (choice !== undefined && choice !== null) {
      slogan = choice;
    } else {
      // Auto-pick first available slogan
      const pool = room.gameData.sloganPool;
      if (pool.length > 0) {
        slogan = pool[Math.floor(Math.random() * pool.length)].text;
      }
    }
    shirts.push({
      playerId: id,
      playerName: p.name,
      drawing,
      slogan
    });
  });

  room.gameData.shirts = shuffle(shirts);
  room.gameData.tkoPhase = 'tournament';
  room.gameData.tournamentBracket = createTournamentBracket(room.gameData.shirts);
  room.gameData.tournamentIndex = 0;

  startTkoTournament(room);
}

function createTournamentBracket(shirts) {
  // Create pairs for head-to-head matches
  const bracket = [];
  for (let i = 0; i < shirts.length; i += 2) {
    if (i + 1 < shirts.length) {
      bracket.push([shirts[i], shirts[i + 1]]);
    } else {
      // Odd number: this shirt gets a bye (auto-advance)
      bracket.push([shirts[i], null]);
    }
  }
  return bracket;
}

function startTkoTournament(room) {
  const bracket = room.gameData.tournamentBracket;
  const idx = room.gameData.tournamentIndex;

  if (idx >= bracket.length) {
    // Tournament round over - check if we have a winner
    const winners = room.gameData.tournamentWinners || [];
    if (winners.length <= 1) {
      // We have a champion!
      finishTkoTournament(room, winners[0] || room.gameData.shirts[0]);
      return;
    }
    // More rounds needed
    room.gameData.tournamentBracket = createTournamentBracket(winners);
    room.gameData.tournamentWinners = [];
    room.gameData.tournamentIndex = 0;
    startTkoTournament(room);
    return;
  }

  if (!room.gameData.tournamentWinners) {
    room.gameData.tournamentWinners = [];
  }

  const matchup = bracket[idx];
  if (!matchup[1]) {
    // Bye - auto-advance
    room.gameData.tournamentWinners.push(matchup[0]);
    room.gameData.tournamentIndex++;
    startTkoTournament(room);
    return;
  }

  room.gameData.phase = 'voting';
  room.players.forEach(p => { p.currentVote = null; });

  const timeLimit = 15;

  io.to(room.code).emit('tshirtWarsVoting', {
    round: room.currentRound + 1,
    matchup: [
      { id: matchup[0].playerId, slogan: matchup[0].slogan, drawing: matchup[0].drawing },
      { id: matchup[1].playerId, slogan: matchup[1].slogan, drawing: matchup[1].drawing }
    ],
    matchNum: idx + 1,
    totalMatches: bracket.length,
    timeLimit,
    phase: 'tournament'
  });

  setVoteTimer(room, timeLimit, () => {
    calculateTkoMatchResult(room);
  });
}

function calculateTkoMatchResult(room) {
  clearRoundTimer(room);
  const bracket = room.gameData.tournamentBracket;
  const idx = room.gameData.tournamentIndex;
  const matchup = bracket[idx];

  const votes = { 0: 0, 1: 0 };
  room.players.forEach((p, id) => {
    if (p.currentVote === matchup[0].playerId) votes[0]++;
    else if (p.currentVote === matchup[1].playerId) votes[1]++;
  });

  const winnerIdx = votes[0] >= votes[1] ? 0 : 1;
  const winner = matchup[winnerIdx];
  const loser = matchup[1 - winnerIdx];

  // Points
  const wPlayer = room.players.get(winner.playerId);
  if (wPlayer) wPlayer.score += 500;

  room.gameData.tournamentWinners.push(winner);

  // Show match result briefly
  io.to(room.code).emit('tshirtWarsMatchResult', {
    winner: { id: winner.playerId, name: winner.playerName, slogan: winner.slogan, drawing: winner.drawing, votes: votes[winnerIdx] },
    loser: { id: loser.playerId, name: loser.playerName, slogan: loser.slogan, drawing: loser.drawing, votes: votes[1 - winnerIdx] },
    matchNum: idx + 1,
    totalMatches: bracket.length
  });

  // Auto-advance to next match
  room.gameData.tournamentIndex++;
  room.roundTimer = setTimeout(() => {
    room.players.forEach(p => { p.currentVote = null; });
    startTkoTournament(room);
  }, 4000);
}

function finishTkoTournament(room, champion) {
  // Champion bonus
  const champPlayer = room.players.get(champion.playerId);
  if (champPlayer) champPlayer.score += 1000;

  io.to(room.code).emit('roundResults', {
    game: 'tshirtwars',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    champion: {
      id: champion.playerId,
      name: champion.playerName,
      slogan: champion.slogan,
      drawing: champion.drawing
    },
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

function startTshirtWarsVoting(room) {
  // Redirects to tournament flow
  if (room.gameData.tkoPhase === 'tournament') {
    startTkoTournament(room);
  }
}

function calculateTshirtWarsResults(room) {
  // Tournament handles its own results
  if (room.gameData.tkoPhase === 'tournament') {
    calculateTkoMatchResult(room);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 💕 الوحش العاشق (Love Monster)
// ═══════════════════════════════════════════════════════════════════

/**
 * Monster Seeking Monster - Real Jackbox flow:
 * 1. Each player has a secret monster identity
 * 2. Players send messages to try to get dates
 * 3. Players pick who to date
 * 4. Matches revealed + monster power activated
 */
function startLoveMonsterRound(room) {
  const playerIds = Array.from(room.players.keys());
  room.gameData.phase = 'messaging';
  room.gameData.messages = new Map();

  // Assign monster identities (first round only)
  if (!room.gameData.monsterAssignments) {
    room.gameData.monsterAssignments = {};
    const monsters = shuffle([...content.lovemonster.monsters]);
    playerIds.forEach((id, i) => {
      room.gameData.monsterAssignments[id] = monsters[i % monsters.length];
    });
    room.gameData.revealedMonsters = {};
  }

  const timeLimit = room._extendedTimers ? 60 : 45;

  // Assign a random powerup to one random player at the start of each round
  const powerups = content.lovemonster.powerups || [];
  let roundPowerup = null;
  if (powerups.length > 0 && playerIds.length > 0) {
    const powerupPlayer = playerIds[Math.floor(Math.random() * playerIds.length)];
    const powerup = powerups[Math.floor(Math.random() * powerups.length)];
    roundPowerup = { playerId: powerupPlayer, ...powerup };
    room.gameData.currentPowerup = roundPowerup;

    // Apply powerup effect: store for results phase
    if (powerup.name === 'سحر العيون' || powerup.name === 'مرآة') {
      // These reveal who picked/messaged the player - applied during results
      room.gameData.powerupReveal = powerupPlayer;
    } else if (powerup.name === 'كيوبيد') {
      // Extra pick - player can pick two people this round
      room.gameData.extraPick = powerupPlayer;
    } else if (powerup.name === 'قفل القلب') {
      // Protected from cancel - their match cannot be nullified
      room.gameData.protectedPlayer = powerupPlayer;
    }
    // 'قلب مكسور' effect is passive info - shown in results
  }

  // Each player picks who to "date" + sees their monster identity
  playerIds.forEach(id => {
    const others = playerIds.filter(pid => pid !== id);
    const myMonster = room.gameData.monsterAssignments[id];
    const myPowerup = (roundPowerup && roundPowerup.playerId === id) ? {
      name: roundPowerup.name,
      icon: roundPowerup.icon,
      desc: roundPowerup.desc
    } : null;

    io.to(id).emit('loveMonsterPick', {
      round: room.currentRound + 1,
      maxRounds: room.maxRounds,
      players: others.map(pid => {
        const p = room.players.get(pid);
        const revealed = room.gameData.revealedMonsters[pid];
        return {
          id: pid, name: p.name, avatar: p.avatar, avatarData: p.avatarData,
          monsterRevealed: revealed || null
        };
      }),
      myMonster,
      myPowerup,
      hasExtraPick: room.gameData.extraPick === id,
      timeLimit,
      messages: content.lovemonster.messages
    });
  });

  setRoundTimer(room, timeLimit, () => {
    handleAllAnswered(room);
  });
}

function calculateLoveMonsterResults(room) {
  clearRoundTimer(room);
  const playerIds = Array.from(room.players.keys());
  const choices = new Map();
  const receivedFrom = new Map();

  playerIds.forEach(id => { receivedFrom.set(id, []); });

  room.players.forEach((p, id) => {
    if (p.currentAnswer && p.currentAnswer !== '__timeout__') {
      choices.set(id, p.currentAnswer);
      const recv = receivedFrom.get(p.currentAnswer);
      if (recv) recv.push(id);
    }
  });

  // Reveal one monster this round (rotate through players)
  const unrevealed = playerIds.filter(id => !room.gameData.revealedMonsters[id]);
  let revealedThisRound = null;
  if (unrevealed.length > 0) {
    const revealId = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    revealedThisRound = {
      playerId: revealId,
      playerName: room.players.get(revealId)?.name,
      monster: room.gameData.monsterAssignments[revealId]
    };
    room.gameData.revealedMonsters[revealId] = room.gameData.monsterAssignments[revealId];
  }

  const results = [];
  room.players.forEach((p, id) => {
    const pickedId = choices.get(id);
    const pickedPlayer = pickedId ? room.players.get(pickedId) : null;
    const receivedCount = (receivedFrom.get(id) || []).length;

    let points = 0;
    let mutual = false;
    if (pickedId && choices.get(pickedId) === id) {
      points = 1000;
      mutual = true;
    }
    points += receivedCount * 200;
    p.score += points;

    results.push({
      playerId: id,
      playerName: p.name,
      picked: pickedPlayer ? pickedPlayer.name : null,
      receivedCount,
      mutual,
      points,
      monster: room.gameData.revealedMonsters[id] || null
    });
  });

  results.sort((a, b) => b.points - a.points);

  io.to(room.code).emit('roundResults', {
    game: 'lovemonster',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    results,
    revealedMonster: revealedThisRound,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

// ═══════════════════════════════════════════════════════════════════
// 💡 اختراعات مجنونة (Mad Inventions)
// ═══════════════════════════════════════════════════════════════════

/**
 * Patently Stupid (Inventions) - Real Jackbox flow:
 * Phase 1: Write invention name/description
 * Phase 2: Draw your invention
 * Phase 3: Present inventions (show drawing + text) → vote
 */
function startInventionsRound(room) {
  const problem = pickQuestion(room, content.inventions.problems);
  room.gameData.phase = 'inventing';
  room.gameData.problem = problem;
  room.gameData.inventionDrawings = {};

  const timeLimit = room._extendedTimers ? 90 : 60;

  io.to(room.code).emit('inventionsProblem', {
    problem: problem.q,
    category: problem.category,
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    timeLimit,
    hasDrawing: true // flag that drawing phase follows
  });

  setRoundTimer(room, timeLimit, () => {
    // Timeout: move to drawing phase
    room.players.forEach(p => {
      if (p.currentAnswer === null) p.currentAnswer = '__timeout__';
    });
    startInventionsDrawing(room);
  });
}

function startInventionsDrawing(room) {
  clearRoundTimer(room);
  room.gameData.phase = 'drawing';

  // Store invention names
  room.gameData.inventionNames = {};
  room.players.forEach((p, id) => {
    room.gameData.inventionNames[id] = p.currentAnswer !== '__timeout__' ? p.currentAnswer : null;
  });

  const timeLimit = 60;

  io.to(room.code).emit('inventionsDraw', {
    round: room.currentRound + 1,
    problem: room.gameData.problem.q,
    timeLimit
  });

  clearRoundTimer(room);
  room.roundTimer = setTimeout(() => {
    // Fill empty drawings
    room.players.forEach((_, id) => {
      if (!room.gameData.inventionDrawings[id]) {
        room.gameData.inventionDrawings[id] = '[]';
      }
    });
    startInventionsVoting(room);
  }, (timeLimit * 1000) + 2000);
}

function startInventionsVoting(room) {
  clearRoundTimer(room);

  const inventions = [];
  room.players.forEach((p, id) => {
    const name = room.gameData.inventionNames[id];
    if (name) {
      inventions.push({
        id,
        text: name,
        drawing: room.gameData.inventionDrawings[id] || '[]',
        playerName: p.name
      });
    }
  });

  if (inventions.length < 2) {
    sendRoundResults(room, { message: 'ما فيه اختراعات كافية!' });
    return;
  }

  for (let i = inventions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [inventions[i], inventions[j]] = [inventions[j], inventions[i]];
  }

  room.gameData.phase = 'voting';
  room.gameData.inventions = inventions;
  resetAnswers(room);

  const timeLimit = room._extendedTimers ? 30 : 20;

  io.to(room.code).emit('inventionsVoting', {
    problem: room.gameData.problem.q,
    inventions: inventions.map(inv => ({ id: inv.id, text: inv.text, drawing: inv.drawing })),
    timeLimit
  });

  setRoundTimer(room, timeLimit, () => {
    calculateVoteResults(room);
  });
}

function calculateInventionsResults(room) {
  clearRoundTimer(room);
  const inventions = room.gameData.inventions || [];
  const voteCounts = {};
  inventions.forEach(inv => { voteCounts[inv.id] = 0; });

  room.players.forEach((p, id) => {
    // منع التصويت لنفسك
    if (p.currentVote && p.currentVote !== id && voteCounts[p.currentVote] !== undefined) {
      voteCounts[p.currentVote]++;
    }
  });

  const totalVoters = Array.from(room.players.values()).filter(p => p.currentVote).length;

  const results = inventions.map(inv => {
    const votes = voteCounts[inv.id] || 0;
    const percentage = totalVoters > 0 ? Math.round((votes / totalVoters) * 100) : 0;
    const points = votes * 500;
    const player = room.players.get(inv.id);
    if (player) player.score += points;

    return {
      playerId: inv.id,
      playerName: inv.playerName,
      text: inv.text,
      votes,
      percentage,
      points
    };
  });

  results.sort((a, b) => b.votes - a.votes);

  io.to(room.code).emit('roundResults', {
    game: 'inventions',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    problem: room.gameData.problem.q,
    category: room.gameData.problem.category,
    results,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

// ═══════════════════════════════════════════════════════════════════
// 🤔 تبي ولا ما تبي (Would You Rather) - 5 جولات
// ═══════════════════════════════════════════════════════════════════

/**
 * بدء جولة تبي ولا ما تبي
 * - سؤال بخيارين (A أو B)
 * - اللاعبين يختارون واحد
 * - النقاط: 500 للأغلبية، 1000 لو تعادل 50/50، 250 للأقلية
 */
function startWouldYouRatherRound(room) {
  const question = pickQuestion(room, content.wouldyourather.questions);
  room.gameData.question = question;
  room.gameData.phase = 'choosing';

  const timeLimit = room._extendedTimers ? 30 : 20;

  io.to(room.code).emit('wouldYouRatherQuestion', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question: question.q,
    optionA: question.a,
    optionB: question.b,
    timeLimit
  });

  setRoundTimer(room, timeLimit, () => {
    calculateWouldYouRatherResults(room);
  });
}

/**
 * حساب نتائج تبي ولا ما تبي
 */
function calculateWouldYouRatherResults(room) {
  clearRoundTimer(room);

  let countA = 0;
  let countB = 0;
  const totalPlayers = room.players.size;

  room.players.forEach(p => {
    if (p.currentAnswer === 'A') countA++;
    else if (p.currentAnswer === 'B') countB++;
  });

  const totalVoted = countA + countB;
  const percentA = totalVoted > 0 ? Math.round((countA / totalVoted) * 100) : 0;
  const percentB = totalVoted > 0 ? Math.round((countB / totalVoted) * 100) : 0;

  // تحديد الأغلبية
  const isSplit = countA === countB && totalVoted > 0;
  const majorityChoice = countA > countB ? 'A' : countB > countA ? 'B' : null;

  const playerResults = [];

  room.players.forEach((p, id) => {
    let points = 0;

    if (p.currentAnswer === 'A' || p.currentAnswer === 'B') {
      if (isSplit) {
        // تعادل مثالي 50/50 - كل واحد ياخذ 1000
        points = 1000;
      } else if (p.currentAnswer === majorityChoice) {
        // مع الأغلبية
        points = 500;
      } else {
        // مع الأقلية
        points = 250;
      }
    }

    p.score += points;

    playerResults.push({
      playerId: id,
      playerName: p.name,
      choice: p.currentAnswer,
      points
    });
  });

  io.to(room.code).emit('roundResults', {
    game: 'wouldyourather',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question: room.gameData.question.q,
    optionA: room.gameData.question.a,
    optionB: room.gameData.question.b,
    countA,
    countB,
    percentA,
    percentB,
    isSplit,
    playerResults,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

// ═══════════════════════════════════════════════════════════════════
// 💬 من قال؟ (Who Said It) - 3 جولات
// ═══════════════════════════════════════════════════════════════════

/**
 * بدء جولة من قال؟
 * المرحلة الأولى: سؤال + كل لاعب يكتب إجابة مجهولة
 * المرحلة الثانية: عرض الإجابات المجهولة + التخمين من كتبها
 * النقاط: 500 لكل تخمين صحيح، 250 لخداع أحد
 */
function startWhoSaidItRound(room) {
  const prompt = pickQuestion(room, content.whosaidit.prompts);
  room.gameData.prompt = prompt;
  room.gameData.phase = 'writing';

  const timeLimit = room._extendedTimers ? 60 : 45;

  io.to(room.code).emit('whoSaidItPrompt', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    prompt,
    timeLimit
  });

  setRoundTimer(room, timeLimit, () => {
    handleAllAnswered(room);
  });
}

/**
 * بدء مرحلة التخمين في من قال؟
 */
function startWhoSaidItGuessing(room) {
  clearRoundTimer(room);
  room.gameData.phase = 'guessing';

  // جمع الإجابات المجهولة
  const anonymousAnswers = [];
  room.players.forEach((p, id) => {
    if (p.currentAnswer && p.currentAnswer !== '__timeout__') {
      anonymousAnswers.push({
        id: `answer_${id}`,
        text: p.currentAnswer,
        authorId: id
      });
    }
  });

  // خلط الإجابات
  const shuffledAnswers = shuffle(anonymousAnswers);
  room.gameData.anonymousAnswers = shuffledAnswers;

  // إعادة تعيين التصويتات
  room.players.forEach(p => { p.currentVote = null; });

  const timeLimit = room._extendedTimers ? 45 : 30;

  // إرسال الإجابات المجهولة مع قائمة اللاعبين للتخمين
  io.to(room.code).emit('whoSaidItGuessing', {
    round: room.currentRound + 1,
    prompt: room.gameData.prompt,
    answers: shuffledAnswers.map(a => ({ id: a.id, text: a.text })),
    players: getPlayerList(room),
    timeLimit
  });

  setVoteTimer(room, timeLimit, () => {
    calculateWhoSaidItResults(room);
  });
}

/**
 * حساب نتائج من قال؟
 */
function calculateWhoSaidItResults(room) {
  clearRoundTimer(room);

  const answers = room.gameData.anonymousAnswers || [];
  const playerResults = [];

  room.players.forEach((p, id) => {
    let points = 0;
    let correctGuesses = 0;
    let fooledCount = 0;

    // حساب التخمينات الصحيحة
    if (p.currentVote && p.currentVote !== '__timeout__') {
      try {
        const guesses = typeof p.currentVote === 'string' ? JSON.parse(p.currentVote) : p.currentVote;
        if (typeof guesses === 'object' && guesses !== null) {
          // guesses = { answerId: playerId, ... }
          Object.entries(guesses).forEach(([answerId, guessedPlayerId]) => {
            const answer = answers.find(a => a.id === answerId);
            if (answer && answer.authorId === guessedPlayerId) {
              correctGuesses++;
              points += 500;
            }
          });
        }
      } catch (e) { /* تخمين غير صالح */ }
    }

    // حساب كم واحد انخدع وما عرف إجابتك
    const myAnswer = answers.find(a => a.authorId === id);
    if (myAnswer) {
      room.players.forEach((other, otherId) => {
        if (otherId === id) return;
        if (other.currentVote && other.currentVote !== '__timeout__') {
          try {
            const otherGuesses = typeof other.currentVote === 'string' ? JSON.parse(other.currentVote) : other.currentVote;
            if (typeof otherGuesses === 'object' && otherGuesses !== null) {
              const guessForMyAnswer = otherGuesses[myAnswer.id];
              if (guessForMyAnswer && guessForMyAnswer !== id) {
                fooledCount++;
                points += 250;
              }
            }
          } catch (e) { /* تخمين غير صالح */ }
        }
      });
    }

    p.score += points;

    // تتبع الإحصائيات
    if (room.gameStats) {
      if (correctGuesses > 0) {
        room.gameStats.correctGuesses.set(id, (room.gameStats.correctGuesses.get(id) || 0) + correctGuesses);
      }
      if (fooledCount > 0) {
        room.gameStats.fooledCounts.set(id, (room.gameStats.fooledCounts.get(id) || 0) + fooledCount);
      }
    }

    playerResults.push({
      playerId: id,
      playerName: p.name,
      answer: p.currentAnswer !== '__timeout__' ? p.currentAnswer : null,
      correctGuesses,
      fooledCount,
      points
    });
  });

  io.to(room.code).emit('roundResults', {
    game: 'whosaidit',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    prompt: room.gameData.prompt,
    answers: answers.map(a => ({
      id: a.id,
      text: a.text,
      authorId: a.authorId,
      authorName: (room.players.get(a.authorId) || {}).name || 'مجهول'
    })),
    playerResults,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

// ═══════════════════════════════════════════════════════════════════
// ⚡ أسرع واحد (Speed Round) - 10 جولات
// ═══════════════════════════════════════════════════════════════════

/**
 * بدء جولة أسرع واحد
 * - سؤال تريفيا مع حقل إجابة حرة
 * - أول إجابة صحيحة: 1000، ثاني: 750، ثالث: 500، الباقي: 250
 * - مؤقت: 10 ثواني
 * - مقارنة الإجابات بدون حساسية لحالة الأحرف
 */
function startSpeedRound(room) {
  const question = pickQuestion(room, content.speedround.questions);
  room.gameData.question = question;
  room.gameData.phase = 'answering';
  room.gameData.answerOrder = []; // ترتيب وصول الإجابات الصحيحة

  const timeLimit = 10;

  io.to(room.code).emit('speedRoundQuestion', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question: question.q,
    category: question.category || '',
    timeLimit
  });

  setRoundTimer(room, timeLimit, () => {
    calculateSpeedRoundResults(room);
  });
}

/**
 * حساب نتائج أسرع واحد
 */
function calculateSpeedRoundResults(room) {
  clearRoundTimer(room);

  const correctAnswer = room.gameData.question.a;
  const acceptableAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
  const answerOrder = room.gameData.answerOrder || [];
  const playerResults = [];

  // تحديد النقاط حسب الترتيب
  const pointsByPlace = [1000, 750, 500];

  room.players.forEach((p, id) => {
    let points = 0;
    let isCorrect = false;
    let place = -1;

    if (p.currentAnswer && p.currentAnswer !== '__timeout__') {
      const playerAnswer = p.currentAnswer.trim().toLowerCase();
      // مقارنة مشددة - الإجابة لازم تكون 2 حرف على الأقل
      isCorrect = playerAnswer.length >= 2 && acceptableAnswers.some(correct => {
        const correctLower = correct.trim().toLowerCase();
        return playerAnswer === correctLower ||
               playerAnswer.includes(correctLower) ||
               (playerAnswer.length >= 3 && correctLower.includes(playerAnswer));
      });

      if (isCorrect) {
        place = answerOrder.indexOf(id);
        if (place === -1) {
          // ما وصلت بالترتيب (timeout fallback)
          place = answerOrder.length;
          answerOrder.push(id);
        }
        points = place < pointsByPlace.length ? pointsByPlace[place] : 250;
      }
    }

    p.score += points;

    playerResults.push({
      playerId: id,
      playerName: p.name,
      answer: p.currentAnswer !== '__timeout__' ? p.currentAnswer : null,
      isCorrect,
      place: isCorrect ? place + 1 : null,
      points
    });
  });

  playerResults.sort((a, b) => {
    if (a.isCorrect && !b.isCorrect) return -1;
    if (!a.isCorrect && b.isCorrect) return 1;
    return (a.place || 999) - (b.place || 999);
  });

  io.to(room.code).emit('roundResults', {
    game: 'speedround',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    question: room.gameData.question.q,
    correctAnswer: Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer,
    playerResults,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

// ═══════════════════════════════════════════════════════════════════
// ✌️ حقيقتين وكذبة (Two Truths One Lie) - 3 جولات
// ═══════════════════════════════════════════════════════════════════

/**
 * بدء جولة حقيقتين وكذبة
 * المرحلة الأولى: اللاعب المميز يكتب حقيقتين وكذبة واحدة
 * المرحلة الثانية: الباقين يخمنون أي وحدة الكذبة
 * النقاط: 500 لكل من خمّن صح، 500 للاعب المميز لكل من انخدع
 */
function startTwoTruthsRound(room) {
  // اختيار اللاعب المميز (بالدور)
  const playerIds = Array.from(room.players.keys());
  const featuredIndex = room.currentRound % playerIds.length;
  const featuredId = playerIds[featuredIndex];
  const featuredPlayer = room.players.get(featuredId);

  room.gameData.featuredPlayerId = featuredId;
  room.gameData.phase = 'writing';

  // اختيار تلميح من المحتوى
  const hint = content.twotruths && content.twotruths.hints
    ? pickQuestion(room, content.twotruths.hints)
    : 'اكتب شي عنك!';

  const timeLimit = room._extendedTimers ? 90 : 60;

  // إرسال للاعب المميز
  io.to(featuredId).emit('twoTruthsWrite', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    hint,
    isFeatured: true,
    timeLimit
  });

  // إبلاغ الباقين بالانتظار
  socket_broadcast(room, featuredId, 'twoTruthsWaiting', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    featuredPlayerName: featuredPlayer.name,
    timeLimit
  });

  // مؤقت الكتابة - بس اللاعب المميز يجاوب
  clearRoundTimer(room);
  room.roundTimer = setTimeout(() => {
    const fp = room.players.get(featuredId);
    if (fp && fp.currentAnswer === null) {
      fp.currentAnswer = '__timeout__';
    }
    startTwoTruthsGuessing(room);
  }, (timeLimit * 1000) + 2000);
}

/**
 * بدء مرحلة التخمين في حقيقتين وكذبة
 */
function startTwoTruthsGuessing(room) {
  clearRoundTimer(room);
  room.gameData.phase = 'guessing';

  const featuredId = room.gameData.featuredPlayerId;
  const featuredPlayer = room.players.get(featuredId);
  let statements = [];

  // تحليل إجابة اللاعب المميز (3 عبارات + أي وحدة الكذبة)
  if (featuredPlayer && featuredPlayer.currentAnswer && featuredPlayer.currentAnswer !== '__timeout__') {
    try {
      const parsed = JSON.parse(featuredPlayer.currentAnswer);
      statements = parsed.statements || [];
      room.gameData.lieIndex = parsed.lieIndex; // فهرس الكذبة (0, 1, أو 2)
    } catch (e) {
      statements = [featuredPlayer.currentAnswer, '...', '...'];
      room.gameData.lieIndex = 0;
    }
  } else {
    // اللاعب ما كتب شي
    statements = ['ما كتب شي ١', 'ما كتب شي ٢', 'ما كتب شي ٣'];
    room.gameData.lieIndex = 0;
  }

  room.gameData.statements = statements;

  // إعادة تعيين إجابات الباقين فقط
  room.players.forEach((p, id) => {
    if (id !== featuredId) {
      p.currentAnswer = null;
      p.currentVote = null;
    }
  });

  const timeLimit = room._extendedTimers ? 30 : 20;

  io.to(room.code).emit('twoTruthsGuessing', {
    round: room.currentRound + 1,
    featuredPlayerName: featuredPlayer ? featuredPlayer.name : 'لاعب',
    featuredPlayerId: featuredId,
    statements,
    timeLimit
  });

  setVoteTimer(room, timeLimit, () => {
    calculateTwoTruthsResults(room);
  });
}

/**
 * حساب نتائج حقيقتين وكذبة
 */
function calculateTwoTruthsResults(room) {
  clearRoundTimer(room);

  const featuredId = room.gameData.featuredPlayerId;
  const featuredPlayer = room.players.get(featuredId);
  const lieIndex = room.gameData.lieIndex;
  const statements = room.gameData.statements || [];
  const playerResults = [];
  let fooledCount = 0;

  room.players.forEach((p, id) => {
    if (id === featuredId) return;

    let points = 0;
    let guessedCorrect = false;

    if (p.currentVote !== null && p.currentVote !== '__timeout__') {
      const guessedIndex = parseInt(p.currentVote);
      if (guessedIndex === lieIndex) {
        guessedCorrect = true;
        points = 500;
      } else {
        fooledCount++;
      }
    } else {
      fooledCount++;
    }

    p.score += points;

    // تتبع الإحصائيات
    if (room.gameStats && guessedCorrect) {
      room.gameStats.correctGuesses.set(id, (room.gameStats.correctGuesses.get(id) || 0) + 1);
    }

    playerResults.push({
      playerId: id,
      playerName: p.name,
      guessedIndex: p.currentVote !== '__timeout__' ? parseInt(p.currentVote) : null,
      guessedCorrect,
      points
    });
  });

  // نقاط اللاعب المميز - 500 لكل من انخدع
  let featuredPoints = fooledCount * 500;
  if (featuredPlayer) {
    featuredPlayer.score += featuredPoints;

    // تتبع الإحصائيات
    if (room.gameStats && fooledCount > 0) {
      room.gameStats.fooledCounts.set(featuredId, (room.gameStats.fooledCounts.get(featuredId) || 0) + fooledCount);
    }
  }

  playerResults.unshift({
    playerId: featuredId,
    playerName: featuredPlayer ? featuredPlayer.name : 'لاعب',
    isFeatured: true,
    fooledCount,
    points: featuredPoints
  });

  io.to(room.code).emit('roundResults', {
    game: 'twotruths',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    featuredPlayerName: featuredPlayer ? featuredPlayer.name : 'لاعب',
    statements,
    lieIndex,
    playerResults,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

// ═══════════════════════════════════════════════════════════════════
// 🔀 سبليت ذا روم (Split the Room) - 5 جولات
// ═══════════════════════════════════════════════════════════════════

/**
 * بدء جولة سبليت ذا روم
 * المرحلة الأولى: لاعب واحد يملأ فراغ في سيناريو
 * المرحلة الثانية: الباقين يصوتون نعم أو لا
 * النقاط: حسب قرب التقسيم من 50/50
 */
function startSplitTheRoomRound(room) {
  const scenario = pickQuestion(room, content.splittheroom.scenarios);
  room.gameData.scenario = scenario;
  room.gameData.phase = 'filling';

  // اختيار لاعب بالدور
  const playerIds = Array.from(room.players.keys());
  const fillerIndex = room.currentRound % playerIds.length;
  const fillerId = playerIds[fillerIndex];
  const fillerPlayer = room.players.get(fillerId);

  room.gameData.fillerId = fillerId;

  const timeLimit = room._extendedTimers ? 45 : 30;

  // إرسال السيناريو للاعب المختار
  io.to(fillerId).emit('splitTheRoomFill', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    scenario: scenario.template,
    hint: scenario.hint || '',
    isFiller: true,
    timeLimit
  });

  // إبلاغ الباقين بالانتظار
  socket_broadcast(room, fillerId, 'splitTheRoomWaiting', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    fillerName: fillerPlayer.name,
    timeLimit
  });

  // مؤقت - بس اللاعب المختار يجاوب
  clearRoundTimer(room);
  room.roundTimer = setTimeout(() => {
    const fp = room.players.get(fillerId);
    if (fp && fp.currentAnswer === null) {
      fp.currentAnswer = '...';
    }
    startSplitTheRoomVoting(room);
  }, (timeLimit * 1000) + 2000);
}

/**
 * بدء مرحلة التصويت في سبليت ذا روم
 */
function startSplitTheRoomVoting(room) {
  clearRoundTimer(room);
  room.gameData.phase = 'voting';

  const fillerId = room.gameData.fillerId;
  const fillerPlayer = room.players.get(fillerId);
  const filledText = fillerPlayer ? fillerPlayer.currentAnswer : '...';

  // بناء السيناريو الكامل
  const completedScenario = room.gameData.scenario.template.replace('_____', filledText);
  room.gameData.completedScenario = completedScenario;
  room.gameData.filledText = filledText;

  // إعادة تعيين التصويتات (ما عدا اللاعب المختار)
  room.players.forEach((p, id) => {
    if (id !== fillerId) {
      p.currentAnswer = null;
      p.currentVote = null;
    }
  });

  const timeLimit = room._extendedTimers ? 25 : 15;

  io.to(room.code).emit('splitTheRoomVoting', {
    round: room.currentRound + 1,
    completedScenario,
    fillerName: fillerPlayer ? fillerPlayer.name : 'لاعب',
    fillerId,
    filledText,
    timeLimit
  });

  setVoteTimer(room, timeLimit, () => {
    calculateSplitTheRoomResults(room);
  });
}

/**
 * حساب نتائج سبليت ذا روم
 */
function calculateSplitTheRoomResults(room) {
  clearRoundTimer(room);

  const fillerId = room.gameData.fillerId;
  const fillerPlayer = room.players.get(fillerId);

  let yesCount = 0;
  let noCount = 0;

  // حساب الأصوات (ما عدا اللاعب المختار)
  room.players.forEach((p, id) => {
    if (id === fillerId) return;
    if (p.currentVote === 'yes') yesCount++;
    else if (p.currentVote === 'no') noCount++;
  });

  const totalVotes = yesCount + noCount;
  const percentYes = totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 0;
  const percentNo = totalVotes > 0 ? Math.round((noCount / totalVotes) * 100) : 0;

  // حساب النقاط حسب قرب التقسيم من 50/50
  const splitDiff = Math.abs(percentYes - 50);
  let fillerPoints = 0;

  if (totalVotes > 0) {
    if (splitDiff === 0) {
      fillerPoints = 1000; // تقسيم مثالي 50/50
    } else if (splitDiff <= 10) {
      fillerPoints = 500;  // 60/40 أو أقرب
    } else if (splitDiff <= 20) {
      fillerPoints = 250;  // 70/30 أو أقرب
    } else {
      fillerPoints = 0;    // أسوأ من 70/30
    }
  }

  if (fillerPlayer) {
    fillerPlayer.score += fillerPoints;
  }

  const playerResults = [];

  // نتيجة اللاعب المختار
  playerResults.push({
    playerId: fillerId,
    playerName: fillerPlayer ? fillerPlayer.name : 'لاعب',
    isFiller: true,
    points: fillerPoints,
    splitQuality: splitDiff === 0 ? 'مثالي!' : splitDiff <= 10 ? 'ممتاز' : splitDiff <= 20 ? 'جيد' : 'بعيد'
  });

  // نتائج المصوتين
  room.players.forEach((p, id) => {
    if (id === fillerId) return;
    playerResults.push({
      playerId: id,
      playerName: p.name,
      vote: p.currentVote,
      points: 0
    });
  });

  io.to(room.code).emit('roundResults', {
    game: 'splittheroom',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    completedScenario: room.gameData.completedScenario,
    filledText: room.gameData.filledText,
    fillerName: fillerPlayer ? fillerPlayer.name : 'لاعب',
    yesCount,
    noCount,
    percentYes,
    percentNo,
    splitDiff,
    playerResults,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

// ═══════════════════════════════════════════════════════════════════
// 🎭 فك الرموز (Emoji Decode) - 5 جولات
// ═══════════════════════════════════════════════════════════════════

/**
 * بدء جولة فك الرموز
 * - عرض تسلسل إيموجي + الفئة
 * - اللاعبين يكتبون تخمينهم
 * - مقارنة مرنة (هل الإجابة تحتوي على الكلمات المفتاحية)
 * - أول إجابة صحيحة: 1000، الباقي: 500، خطأ: 0
 * - مؤقت: 15 ثانية
 */
function startEmojiDecodeRound(room) {
  const puzzle = pickQuestion(room, content.emojidecode.puzzles);
  room.gameData.puzzle = puzzle;
  room.gameData.phase = 'guessing';
  room.gameData.answerOrder = [];

  const timeLimit = 15;

  io.to(room.code).emit('emojiDecodeQuestion', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    emojis: puzzle.emojis,
    category: puzzle.category || '',
    hint: puzzle.hint || '',
    timeLimit
  });

  setRoundTimer(room, timeLimit, () => {
    calculateEmojiDecodeResults(room);
  });
}

/**
 * حساب نتائج فك الرموز
 */
function calculateEmojiDecodeResults(room) {
  clearRoundTimer(room);

  const puzzle = room.gameData.puzzle;
  const correctAnswer = puzzle.a;
  const keywords = Array.isArray(puzzle.keywords) ? puzzle.keywords : [correctAnswer];
  const answerOrder = room.gameData.answerOrder || [];
  const playerResults = [];

  room.players.forEach((p, id) => {
    let points = 0;
    let isCorrect = false;

    if (p.currentAnswer && p.currentAnswer !== '__timeout__') {
      const playerAnswer = p.currentAnswer.trim().toLowerCase();

      // مقارنة مشددة - الإجابة لازم تكون 2 حرف على الأقل
      isCorrect = playerAnswer.length >= 2 && keywords.some(kw => {
        const kwLower = kw.trim().toLowerCase();
        return playerAnswer === kwLower ||
               playerAnswer.includes(kwLower) ||
               (playerAnswer.length >= 3 && kwLower.includes(playerAnswer));
      });

      if (isCorrect) {
        // استخدام answerOrder لتحديد الأول (بدل ترتيب Map)
        const orderIdx = answerOrder.indexOf(id);
        if (orderIdx === 0) {
          points = 1000; // أول إجابة صحيحة
        } else {
          points = 500;
        }
      }
    }

    p.score += points;

    playerResults.push({
      playerId: id,
      playerName: p.name,
      answer: p.currentAnswer !== '__timeout__' ? p.currentAnswer : null,
      isCorrect,
      points
    });
  });

  playerResults.sort((a, b) => b.points - a.points);

  io.to(room.code).emit('roundResults', {
    game: 'emojidecode',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    emojis: puzzle.emojis,
    correctAnswer: Array.isArray(correctAnswer) ? correctAnswer : correctAnswer,
    category: puzzle.category || '',
    playerResults,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

// ═══════════════════════════════════════════════════════════════════
// ⚖️ المحكمة (Debate Me) - 3 جولات
// ═══════════════════════════════════════════════════════════════════

/**
 * بدء جولة المحكمة
 * المرحلة الأولى: عرض موضوع + تقسيم اللاعبين لفريقين عشوائياً
 * المرحلة الثانية: كل فريق يكتب أقوى حجة (60 ثانية)
 * المرحلة الثالثة: الكل يصوتون للحجة الأقوى (ما يقدرون يصوتون لفريقهم)
 * النقاط: الفريق الفائز 500 لكل لاعب، أقوى حجة (أكثر أصوات) 1000 بونص
 */
function startDebateMeRound(room) {
  const topic = pickQuestion(room, content.debateme.topics);
  room.gameData.topic = topic;
  room.gameData.phase = 'arguing';

  // تقسيم اللاعبين لفريقين عشوائياً
  const playerIds = shuffle(Array.from(room.players.keys()));
  const midpoint = Math.ceil(playerIds.length / 2);
  const side1 = playerIds.slice(0, midpoint);
  const side2 = playerIds.slice(midpoint);

  room.gameData.side1 = side1;
  room.gameData.side2 = side2;
  room.gameData.side1Label = topic.side1 || 'مع';
  room.gameData.side2Label = topic.side2 || 'ضد';

  const timeLimit = room._extendedTimers ? 90 : 60;

  // إرسال لكل لاعب مع فريقه
  room.players.forEach((p, id) => {
    const mySide = side1.includes(id) ? 1 : 2;
    const myLabel = mySide === 1 ? room.gameData.side1Label : room.gameData.side2Label;
    const teammates = (mySide === 1 ? side1 : side2)
      .filter(tid => tid !== id)
      .map(tid => {
        const tp = room.players.get(tid);
        return tp ? tp.name : '';
      });

    io.to(id).emit('debateMeTopic', {
      round: room.currentRound + 1,
      maxRounds: room.maxRounds,
      topic: topic.q,
      yourSide: mySide,
      yourSideLabel: myLabel,
      teammates,
      timeLimit
    });
  });

  setRoundTimer(room, timeLimit, () => {
    handleAllAnswered(room);
  });
}

/**
 * بدء مرحلة التصويت في المحكمة
 */
function startDebateMeVoting(room) {
  clearRoundTimer(room);
  room.gameData.phase = 'voting';

  // جمع الحجج من كل فريق
  const side1Args = [];
  const side2Args = [];

  room.gameData.side1.forEach(id => {
    const p = room.players.get(id);
    if (p && p.currentAnswer && p.currentAnswer !== '__timeout__') {
      side1Args.push({ id, text: p.currentAnswer, playerName: p.name });
    }
  });

  room.gameData.side2.forEach(id => {
    const p = room.players.get(id);
    if (p && p.currentAnswer && p.currentAnswer !== '__timeout__') {
      side2Args.push({ id, text: p.currentAnswer, playerName: p.name });
    }
  });

  room.gameData.side1Args = side1Args;
  room.gameData.side2Args = side2Args;

  // إعادة تعيين التصويتات
  room.players.forEach(p => { p.currentVote = null; });

  const timeLimit = room._extendedTimers ? 30 : 20;

  io.to(room.code).emit('debateMeVoting', {
    round: room.currentRound + 1,
    topic: room.gameData.topic.q,
    side1Label: room.gameData.side1Label,
    side2Label: room.gameData.side2Label,
    side1Args: side1Args.map(a => ({ id: a.id, text: a.text })),
    side2Args: side2Args.map(a => ({ id: a.id, text: a.text })),
    side1Players: room.gameData.side1,
    side2Players: room.gameData.side2,
    timeLimit
  });

  setVoteTimer(room, timeLimit, () => {
    calculateDebateMeResults(room);
  });
}

/**
 * حساب نتائج المحكمة
 */
function calculateDebateMeResults(room) {
  clearRoundTimer(room);

  const side1 = room.gameData.side1;
  const side2 = room.gameData.side2;
  let side1Votes = 0;
  let side2Votes = 0;

  // حساب الأصوات لكل حجة
  const argVotes = {};
  [...(room.gameData.side1Args || []), ...(room.gameData.side2Args || [])].forEach(a => {
    argVotes[a.id] = 0;
  });

  // اللاعبين ما يصوتون لفريقهم - تطبيق القاعدة
  room.players.forEach((p, id) => {
    if (p.currentVote && p.currentVote !== '__timeout__') {
      // التصويت هو ID اللاعب صاحب الحجة
      if (argVotes.hasOwnProperty(p.currentVote)) {
        // منع التصويت لنفس الفريق
        const voterOnSide1 = side1.includes(id);
        const voteForSide1 = side1.includes(p.currentVote);
        if (voterOnSide1 === voteForSide1) return; // تصويت لنفس الفريق - مرفوض

        argVotes[p.currentVote]++;

        // حساب أصوات الفريق
        if (voteForSide1) {
          side1Votes++;
        } else {
          side2Votes++;
        }
      }
    }
  });

  // تحديد الفريق الفائز
  const winningSide = side1Votes > side2Votes ? 1 : side2Votes > side1Votes ? 2 : 0;

  // تحديد أقوى حجة (أكثر أصوات)
  let bestArgId = null;
  let bestArgVotes = 0;
  Object.entries(argVotes).forEach(([id, votes]) => {
    if (votes > bestArgVotes) {
      bestArgVotes = votes;
      bestArgId = id;
    }
  });

  const playerResults = [];

  room.players.forEach((p, id) => {
    let points = 0;
    const mySide = side1.includes(id) ? 1 : 2;

    // الفريق الفائز ياخذ 500 لكل لاعب
    if (winningSide === mySide) {
      points += 500;
    }

    // أقوى حجة تاخذ 1000 بونص
    if (id === bestArgId && bestArgVotes > 0) {
      points += 1000;
    }

    p.score += points;

    playerResults.push({
      playerId: id,
      playerName: p.name,
      side: mySide,
      sideLabel: mySide === 1 ? room.gameData.side1Label : room.gameData.side2Label,
      argument: p.currentAnswer !== '__timeout__' ? p.currentAnswer : null,
      argVotes: argVotes[id] || 0,
      isBestArg: id === bestArgId,
      isWinningSide: winningSide === mySide,
      points
    });
  });

  io.to(room.code).emit('roundResults', {
    game: 'debateme',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    topic: room.gameData.topic.q,
    side1Label: room.gameData.side1Label,
    side2Label: room.gameData.side2Label,
    side1Votes,
    side2Votes,
    winningSide,
    bestArgId,
    bestArgVotes,
    bestArgPlayerName: bestArgId ? (room.players.get(bestArgId) || {}).name : null,
    playerResults,
    players: getPlayerList(room),
    isLastRound: room.currentRound >= room.maxRounds - 1
  });
}

// ═══════════════════════════════════════════════════════════════════
// 🔤 الأسماء (Acrophobia) - 3 جولات
// ═══════════════════════════════════════════════════════════════════

/**
 * بدء جولة الأسماء
 * المرحلة الأولى: عرض أحرف عربية عشوائية + اللاعبين يكتبون اختصار/عبارة
 * المرحلة الثانية: التصويت لأفضل اختصار
 * النقاط: كل صوت = 500 نقطة
 */
function startAcrophobiaRound(room) {
  // توليد أحرف عربية عشوائية
  const arabicLetters = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];
  const letterCount = 3 + Math.floor(Math.random() * 2); // 3 أو 4 أحرف
  const letters = [];
  for (let i = 0; i < letterCount; i++) {
    letters.push(arabicLetters[Math.floor(Math.random() * arabicLetters.length)]);
  }

  // اختيار فئة من المحتوى
  const category = content.acrophobia && content.acrophobia.categories
    ? content.acrophobia.categories[Math.floor(Math.random() * content.acrophobia.categories.length)]
    : 'اكتب أي عبارة!';

  room.gameData.letters = letters;
  room.gameData.category = category;
  room.gameData.phase = 'writing';

  const timeLimit = room._extendedTimers ? 60 : 45;

  io.to(room.code).emit('acrophobiaLetters', {
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    letters,
    category,
    timeLimit
  });

  setRoundTimer(room, timeLimit, () => {
    handleAllAnswered(room);
  });
}

/**
 * بدء مرحلة التصويت في الأسماء
 */
function startAcrophobiaVoting(room) {
  clearRoundTimer(room);
  room.gameData.phase = 'voting';

  // جمع الإجابات
  const acronyms = [];
  room.players.forEach((p, id) => {
    if (p.currentAnswer && p.currentAnswer !== '__timeout__') {
      acronyms.push({ id, text: p.currentAnswer, playerName: p.name });
    }
  });

  if (acronyms.length < 2) {
    sendRoundResults(room, { message: 'ما فيه إجابات كافية!' });
    return;
  }

  // خلط الإجابات
  room.gameData.acronyms = shuffle(acronyms);

  // إعادة تعيين التصويتات
  room.players.forEach(p => { p.currentVote = null; });

  const timeLimit = room._extendedTimers ? 30 : 20;

  io.to(room.code).emit('acrophobiaVoting', {
    round: room.currentRound + 1,
    letters: room.gameData.letters,
    category: room.gameData.category,
    acronyms: room.gameData.acronyms.map(a => ({ id: a.id, text: a.text })),
    timeLimit
  });

  setVoteTimer(room, timeLimit, () => {
    calculateAcrophobiaResults(room);
  });
}

/**
 * حساب نتائج الأسماء
 */
function calculateAcrophobiaResults(room) {
  clearRoundTimer(room);

  const acronyms = room.gameData.acronyms || [];
  const voteCounts = {};
  acronyms.forEach(a => { voteCounts[a.id] = 0; });

  // حساب الأصوات (اللاعب ما يصوت لنفسه)
  room.players.forEach((p, id) => {
    if (p.currentVote && p.currentVote !== '__timeout__' && voteCounts.hasOwnProperty(p.currentVote) && p.currentVote !== id) {
      voteCounts[p.currentVote]++;
    }
  });

  const results = acronyms.map(a => {
    const votes = voteCounts[a.id] || 0;
    const points = votes * 500;
    const player = room.players.get(a.id);
    if (player) player.score += points;

    // تتبع الإحصائيات
    if (room.gameStats && votes > 0) {
      room.gameStats.votesReceived.set(a.id, (room.gameStats.votesReceived.get(a.id) || 0) + votes);
    }

    return {
      playerId: a.id,
      playerName: a.playerName,
      text: a.text,
      votes,
      points
    };
  });

  results.sort((a, b) => b.votes - a.votes);

  io.to(room.code).emit('roundResults', {
    game: 'acrophobia',
    round: room.currentRound + 1,
    maxRounds: room.maxRounds,
    letters: room.gameData.letters,
    category: room.gameData.category,
    results,
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
  // تتبع نقاط كل جولة للجوائز
  if (room.gameStats) {
    room.players.forEach((p, id) => {
      const scores = room.gameStats.roundScores.get(id);
      if (scores) scores.push(p.score);
    });
  }

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

  // إضافة تعليق انتقالي بين الجولات
  if (CONFIG.commentaryEnabled && !resultData.isLastRound) {
    const sorted = resultData.players ? [...resultData.players].sort((a, b) => b.score - a.score) : [];
    const isClose = sorted.length >= 2 && (sorted[0].score - sorted[1].score) < 500;
    resultData.transitionQuip = generateTransitionQuip({ isClose });
  }

  io.to(room.code).emit('roundResults', resultData);
}

/**
 * حساب جوائز نهاية اللعبة
 */
function computeGameAwards(room) {
  if (!room.gameStats) return [];

  const awards = [];
  const stats = room.gameStats;
  const players = room.players;

  // أكبر كذاب - اللي خدع أكثر ناس
  let topFooled = null;
  let topFooledCount = 0;
  stats.fooledCounts.forEach((count, id) => {
    if (count > topFooledCount) {
      topFooledCount = count;
      topFooled = id;
    }
  });
  if (topFooled && topFooledCount > 0) {
    const p = players.get(topFooled);
    if (p) awards.push({ icon: '🎭', title: 'أكبر كذاب', name: p.name, detail: 'خدع ' + topFooledCount + ' مرة' });
  }

  // صاحب الإجابات الصحيحة
  let topCorrect = null;
  let topCorrectCount = 0;
  stats.correctGuesses.forEach((count, id) => {
    if (count > topCorrectCount) {
      topCorrectCount = count;
      topCorrect = id;
    }
  });
  if (topCorrect && topCorrectCount > 0) {
    const p = players.get(topCorrect);
    if (p) awards.push({ icon: '🧠', title: 'عقل كبير', name: p.name, detail: topCorrectCount + ' إجابة صحيحة' });
  }

  // نجم التصويت - أكثر أصوات في Quiplash
  let topVotes = null;
  let topVotesCount = 0;
  stats.votesReceived.forEach((count, id) => {
    if (count > topVotesCount) {
      topVotesCount = count;
      topVotes = id;
    }
  });
  if (topVotes && topVotesCount > 0) {
    const p = players.get(topVotes);
    if (p) awards.push({ icon: '⭐', title: 'نجم الجمهور', name: p.name, detail: topVotesCount + ' صوت' });
  }

  // ملك السلسلة - أطول streak
  let topStreak = null;
  let topStreakCount = 0;
  stats.streaks.forEach((count, id) => {
    if (count > topStreakCount) {
      topStreakCount = count;
      topStreak = id;
    }
  });
  if (topStreak && topStreakCount > 1) {
    const p = players.get(topStreak);
    if (p) awards.push({ icon: '🔥', title: 'سلسلة نارية', name: p.name, detail: topStreakCount + ' إجابات متتالية' });
  }

  // ملك الكويبلاش - أكثر QUIPLASH moments (Quiplash-specific)
  if (room.currentGame === 'quiplash') {
    let topQl = null, topQlCount = 0;
    stats.quiplashCount.forEach((count, id) => {
      if (count > topQlCount) { topQlCount = count; topQl = id; }
    });
    if (topQl && topQlCount > 0) {
      const p = players.get(topQl);
      if (p) awards.push({ icon: '⚡', title: 'ملك الكويبلاش', name: p.name, detail: topQlCount + ' إجماع تام' });
    }

    // أكثر فوز في المواجهات
    let topWins = null, topWinsCount = 0;
    stats.matchupWins.forEach((count, id) => {
      if (count > topWinsCount) { topWinsCount = count; topWins = id; }
    });
    if (topWins && topWinsCount > 1) {
      const p = players.get(topWins);
      if (p) awards.push({ icon: '🏆', title: 'بطل المواجهات', name: p.name, detail: 'فاز ' + topWinsCount + ' مواجهات' });
    }

    // أكثر صفر أصوات
    let topZero = null, topZeroCount = 0;
    stats.zeroVotes.forEach((count, id) => {
      if (count > topZeroCount) { topZeroCount = count; topZero = id; }
    });
    if (topZero && topZeroCount > 1) {
      const p = players.get(topZero);
      if (p) awards.push({ icon: '💀', title: 'ما أحد يبيك', name: p.name, detail: topZeroCount + ' مرات صفر أصوات' });
    }
  }

  // عودة قوية - اللي كان آخر واحد وطلع بنتيجة أعلى
  const sortedPlayers = getPlayerList(room).sort((a, b) => b.score - a.score);
  const roundScores = stats.roundScores;
  if (sortedPlayers.length >= 3 && roundScores.size > 0) {
    // نشوف اللي تحسّن أكثر شي من النص الأول للنص الثاني
    let bestComeback = null;
    let bestImp = 0;
    sortedPlayers.forEach(sp => {
      const scores = roundScores.get(sp.id);
      if (scores && scores.length >= 2) {
        const mid = Math.floor(scores.length / 2);
        const firstHalf = scores.slice(0, mid).reduce((a, b) => a + b, 0);
        const secondHalf = scores.slice(mid).reduce((a, b) => a + b, 0);
        const improvement = secondHalf - firstHalf;
        if (improvement > bestImp) {
          bestImp = improvement;
          bestComeback = sp;
        }
      }
    });
    if (bestComeback && bestImp > 200) {
      awards.push({ icon: '💪', title: 'عودة قوية', name: bestComeback.name, detail: '+' + bestImp + ' نقطة في النص الثاني' });
    }
  }

  return awards;
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

  // تجميع نقاط الفرق لو وضع الفرق مفعّل
  let teamResults = null;
  if (room.teamMode && room.teams) {
    room.teams.red.score = 0;
    room.teams.blue.score = 0;
    room.players.forEach(p => {
      if (p.team === 'red') room.teams.red.score += p.score;
      else if (p.team === 'blue') room.teams.blue.score += p.score;
    });
    teamResults = {
      red: { ...room.teams.red },
      blue: { ...room.teams.blue },
      winningTeam: room.teams.red.score > room.teams.blue.score ? 'red' :
                   room.teams.blue.score > room.teams.red.score ? 'blue' : 'tie'
    };
  }

  // حساب الجوائز
  const awards = computeGameAwards(room);

  // نصيحة عشوائية
  const tip = content.tips[Math.floor(Math.random() * content.tips.length)];

  const winComment = CONFIG.commentaryEnabled && winner
    ? generateCommentary('results', 'winner', { name: winner.name })
    : null;

  io.to(room.code).emit('gameEnded', {
    game: room.currentGame,
    finalResults,
    winner,
    awards,
    tip,
    commentary: winComment,
    teamMode: room.teamMode || false,
    teamResults
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
  ║     👕 حرب التيشيرتات  💕 الوحش العاشق  💡 اختراعات مجنونة  ║
  ║     🤔 تبي ولا ما تبي  💬 من قال؟     ⚡ أسرع واحد        ║
  ║     ✌️ حقيقتين وكذبة  🔀 سبليت ذا روم  🎭 فك الرموز      ║
  ║     ⚖️ المحكمة      🔤 الأسماء                            ║
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
