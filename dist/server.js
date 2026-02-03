"use strict";
/**
 * ═══════════════════════════════════════════════════════════════
 * ABU ABED BOX - SERVER (TypeScript)
 * السيرفر الرئيسي للمنصة
 * ═══════════════════════════════════════════════════════════════
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const AVATARS = ['😎', '🤠', '🥳', '😈', '🤖', '👻', '🦊', '🐸', '🦁', '🐼'];
const COLORS = ['#E91E8C', '#4ECDC4', '#FFD93D', '#6BCB77', '#FF6B35', '#667eea', '#f093fb', '#43e97b', '#fa709a', '#00d4ff'];
// ─────────────────────────────────────────────────────────────
// Game Content (Saudi Arabic)
// ─────────────────────────────────────────────────────────────
const CONTENT = {
    quiplash: [
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
        "ما هو أغرب شي ممكن تلاقيه في شنطة معلمك؟",
    ],
    guesspionage: [
        { q: "كم نسبة السعوديين اللي يشربون قهوة كل صباح؟", answer: 78 },
        { q: "كم نسبة الناس اللي يستخدمون جوالهم وهم على السفرة؟", answer: 65 },
        { q: "كم نسبة اللي يحبون الكبسة أكثر من المندي؟", answer: 52 },
        { q: "كم نسبة الشباب اللي يلعبون ألعاب فيديو يومياً؟", answer: 45 },
        { q: "كم نسبة اللي يفضلون السفر داخل السعودية على الخارج؟", answer: 35 },
        { q: "كم نسبة اللي يشوفون أنفسهم كريمين جداً؟", answer: 82 },
        { q: "كم نسبة اللي ما يردون على مكالمات أرقام غريبة؟", answer: 73 },
        { q: "كم نسبة اللي يأخرون المنبه كل صباح؟", answer: 68 },
        { q: "كم نسبة اللي يحبون الحر أكثر من البرد؟", answer: 28 },
        { q: "كم نسبة اللي راحوا العلا؟", answer: 22 },
        { q: "كم نسبة اللي يستخدمون كاش بدل البطاقة؟", answer: 25 },
        { q: "كم نسبة اللي يحطون السكر في الشاي؟", answer: 71 },
        { q: "كم نسبة اللي عندهم أكثر من 500 صديق في السوشال ميديا؟", answer: 58 },
        { q: "كم نسبة اللي يفضلون الأكل البيت على المطاعم؟", answer: 62 },
        { q: "كم نسبة اللي ناموا في الدوام أو المحاضرة؟", answer: 47 },
        { q: "كم نسبة اللي يشوفون إن رواتبهم ما تكفي؟", answer: 76 },
        { q: "كم نسبة اللي جربوا الدايت ورجعوا؟", answer: 81 },
        { q: "كم نسبة اللي يحبون القطط أكثر من الكلاب؟", answer: 67 },
        { q: "كم نسبة اللي يقرأون كتب بانتظام؟", answer: 18 },
        { q: "كم نسبة اللي يمارسون رياضة أسبوعياً؟", answer: 32 },
    ],
    fakinit: {
        handsOfTruth: [
            "ارفع يدك إذا سرقت أكل من الثلاجة وأنكرت",
            "ارفع يدك إذا كذبت على أهلك عن مكانك",
            "ارفع يدك إذا تطنشت رسالة عمداً",
            "ارفع يدك إذا أكلت شي وقلت ما أكلت",
            "ارفع يدك إذا نمت في محاضرة أو اجتماع",
            "ارفع يدك إذا سويت نفسك مريض عشان ما تروح",
            "ارفع يدك إذا خذيت شي من أخوك/أختك بدون إذن",
            "ارفع يدك إذا قلت بجي وما جيت",
            "ارفع يدك إذا حطيت فلتر مبالغ فيه بصورتك",
            "ارفع يدك إذا تجسست على جوال أحد",
        ],
        numberPressure: [
            "كم مرة تفتح الثلاجة في اليوم؟",
            "كم ساعة تقضي على الجوال يومياً؟",
            "كم صديق مقرب عندك فعلاً؟",
            "كم مرة سافرت هالسنة؟",
            "كم كوب قهوة/شاي تشرب باليوم؟",
            "كم مرة غيرت صورة بروفايلك هالشهر؟",
            "كم سيارة ركبتها بحياتك؟",
            "كم لغة تتكلم؟",
            "كم مرة تأخرت عن موعد هالأسبوع؟",
            "كم جهاز إلكتروني عندك؟",
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
            "سوِّ وجه التفكير العميق",
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
            "أشر على الشخص اللي يسولف كثير",
        ],
    },
    triviamurder: [
        { q: "ما هي عاصمة المملكة العربية السعودية؟", options: ["الرياض", "جدة", "مكة", "الدمام"], correct: 0 },
        { q: "كم عدد أيام السنة الميلادية؟", options: ["365", "364", "366", "360"], correct: 0 },
        { q: "ما هو أكبر محيط في العالم؟", options: ["المحيط الهادئ", "المحيط الأطلسي", "المحيط الهندي", "المحيط المتجمد"], correct: 0 },
        { q: "من هو مؤسس المملكة العربية السعودية؟", options: ["الملك عبدالعزيز", "الملك سعود", "الملك فيصل", "الملك خالد"], correct: 0 },
        { q: "كم عدد الكواكب في المجموعة الشمسية؟", options: ["8", "9", "7", "10"], correct: 0 },
        { q: "ما هي اللغة الرسمية في البرازيل؟", options: ["البرتغالية", "الإسبانية", "الإنجليزية", "الفرنسية"], correct: 0 },
        { q: "في أي سنة تأسست المملكة العربية السعودية؟", options: ["1932", "1925", "1945", "1950"], correct: 0 },
        { q: "ما هو العنصر الأكثر وفرة في الكون؟", options: ["الهيدروجين", "الأكسجين", "الكربون", "الحديد"], correct: 0 },
        { q: "كم عدد اللاعبين في فريق كرة القدم؟", options: ["11", "10", "12", "9"], correct: 0 },
        { q: "ما هو أطول نهر في العالم؟", options: ["نهر النيل", "نهر الأمازون", "نهر المسيسبي", "نهر اليانغتسي"], correct: 0 },
        { q: "ما هي الدولة الأكبر مساحة في العالم؟", options: ["روسيا", "كندا", "الصين", "أمريكا"], correct: 0 },
        { q: "كم عدد القارات في العالم؟", options: ["7", "6", "5", "8"], correct: 0 },
        { q: "ما هو الحيوان الأسرع في العالم؟", options: ["الفهد", "الأسد", "النمر", "الغزال"], correct: 0 },
        { q: "ما هي عملة اليابان؟", options: ["الين", "الدولار", "اليوان", "الوون"], correct: 0 },
        { q: "كم عدد أركان الإسلام؟", options: ["5", "4", "6", "3"], correct: 0 },
        { q: "ما هو أعلى جبل في العالم؟", options: ["إيفرست", "كيتو", "مونت بلانك", "كلمنجارو"], correct: 0 },
        { q: "في أي مدينة يقع برج إيفل؟", options: ["باريس", "لندن", "روما", "برلين"], correct: 0 },
        { q: "ما هو الغاز الذي نتنفسه؟", options: ["الأكسجين", "النيتروجين", "الهيدروجين", "الكربون"], correct: 0 },
        { q: "كم عدد أسنان الإنسان البالغ؟", options: ["32", "28", "30", "34"], correct: 0 },
        { q: "ما هي أصغر دولة في العالم؟", options: ["الفاتيكان", "موناكو", "سان مارينو", "مالطا"], correct: 0 },
    ],
    fibbage: [
        { q: "السعودية تستورد _____ من أستراليا سنوياً.", answer: "الجمال" },
        { q: "أول مطعم ماكدونالدز في السعودية افتتح في مدينة _____.", answer: "الرياض" },
        { q: "مساحة الربع الخالي تعادل مساحة دولة _____.", answer: "فرنسا" },
        { q: "أول فيلم سعودي عُرض في السينما كان اسمه _____.", answer: "وجدة" },
        { q: "أكبر واحة في العالم موجودة في _____.", answer: "الأحساء" },
        { q: "السعودية فيها أكثر من _____ مليون نخلة.", answer: "30" },
        { q: "الملك عبدالعزيز وحّد السعودية وعمره _____ سنة.", answer: "31" },
        { q: "أول قطار في السعودية ربط بين الرياض و_____.", answer: "الدمام" },
        { q: "برج الساعة في مكة فيه أكبر _____ في العالم.", answer: "ساعة" },
        { q: "السعودية تنتج _____ مليون برميل نفط يومياً.", answer: "10" },
    ],
    drawful: [
        "بعير يركب سيارة",
        "شايب يلعب فورتنايت",
        "كبسة طايرة",
        "صقر يشرب قهوة",
        "شماغ على رأس قطة",
        "برج المملكة يرقص",
        "جمل في المول",
        "مندي يطير في الفضاء",
        "خروف يقود طيارة",
        "شيخ يلعب بلايستيشن",
        "فنجال قهوة عملاق",
        "نخلة تمشي",
        "بدوي على سكيت بورد",
        "فلافل بأجنحة",
        "شاورما تتكلم",
        "قهوة سعودية غاضبة",
        "جمل يتزلج على الثلج",
        "صقر يحمل آيفون",
    ],
};
// ─────────────────────────────────────────────────────────────
// Server Setup
// ─────────────────────────────────────────────────────────────
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 60000,
    pingInterval: 25000,
});
// Static files
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.use(express_1.default.json());
// Rooms storage
const rooms = new Map();
// ─────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return rooms.has(code) ? generateRoomCode() : code;
}
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
function createPlayer(id, name, isHost, index) {
    return {
        id,
        name,
        avatar: AVATARS[index % AVATARS.length],
        color: COLORS[index % COLORS.length],
        score: 0,
        isHost,
        isReady: false,
        isAlive: true,
        currentAnswer: null,
    };
}
function getPlayerList(room) {
    return Array.from(room.players.values());
}
function countAnswered(room) {
    return Array.from(room.players.values()).filter(p => p.currentAnswer !== null).length;
}
function allPlayersAnswered(room) {
    return Array.from(room.players.values()).every(p => p.currentAnswer !== null);
}
// ─────────────────────────────────────────────────────────────
// Socket Events
// ─────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`✅ لاعب متصل: ${socket.id}`);
    // Create Room
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
            createdAt: Date.now(),
        };
        room.players.set(socket.id, createPlayer(socket.id, playerName, true, 0));
        rooms.set(code, room);
        socket.join(code);
        socket.emit('roomCreated', { code, players: getPlayerList(room) });
        console.log(`🏠 غرفة جديدة: ${code}`);
    });
    // Join Room
    socket.on('joinRoom', ({ code, playerName }) => {
        const room = rooms.get(code?.toUpperCase());
        if (!room) {
            return socket.emit('error', { message: 'الغرفة غير موجودة!' });
        }
        if (room.players.size >= 10) {
            return socket.emit('error', { message: 'الغرفة ممتلئة!' });
        }
        if (room.state !== 'lobby') {
            return socket.emit('error', { message: 'اللعبة بدأت بالفعل!' });
        }
        room.players.set(socket.id, createPlayer(socket.id, playerName, false, room.players.size));
        socket.join(code.toUpperCase());
        socket.emit('roomJoined', { code: room.code, players: getPlayerList(room) });
        io.to(room.code).emit('playerJoined', { players: getPlayerList(room) });
    });
    // Player Ready
    socket.on('playerReady', (code) => {
        const room = rooms.get(code);
        if (!room)
            return;
        const player = room.players.get(socket.id);
        if (player) {
            player.isReady = !player.isReady;
            io.to(code).emit('playerUpdated', { players: getPlayerList(room) });
        }
    });
    // Start Game
    socket.on('startGame', ({ code, game }) => {
        const room = rooms.get(code);
        if (!room || socket.id !== room.hostId)
            return;
        if (room.players.size < 2) {
            return socket.emit('error', { message: 'تحتاج لاعبين على الأقل!' });
        }
        room.currentGame = game;
        room.currentRound = 0;
        room.state = 'playing';
        room.gameData = {};
        room.players.forEach(p => {
            p.score = 0;
            p.isAlive = true;
            p.currentAnswer = null;
        });
        io.to(code).emit('gameStarted', { game, players: getPlayerList(room) });
        setTimeout(() => startGameRound(room), 1500);
    });
    // Game-specific events
    socket.on('submitAnswer', ({ code, answer }) => {
        const room = rooms.get(code);
        if (!room)
            return;
        const player = room.players.get(socket.id);
        if (player && player.currentAnswer === null) {
            player.currentAnswer = answer;
            io.to(code).emit('playerAnswered', {
                playerId: socket.id,
                count: countAnswered(room),
                total: room.players.size
            });
            if (allPlayersAnswered(room)) {
                handleAllAnswered(room);
            }
        }
    });
    socket.on('submitVote', ({ code, voteId }) => {
        const room = rooms.get(code);
        if (!room)
            return;
        if (!room.gameData.votes)
            room.gameData.votes = {};
        room.gameData.votes[socket.id] = voteId;
        const totalVoters = room.players.size - (room.gameData.matchup?.length || 0);
        if (Object.keys(room.gameData.votes).length >= totalVoters) {
            calculateResults(room);
        }
    });
    socket.on('requestNextRound', (code) => {
        const room = rooms.get(code);
        if (!room || socket.id !== room.hostId)
            return;
        room.currentRound++;
        room.gameData = {};
        room.players.forEach(p => p.currentAnswer = null);
        if (room.currentRound >= room.maxRounds) {
            endGame(room);
        }
        else {
            startGameRound(room);
        }
    });
    socket.on('backToLobby', (code) => {
        const room = rooms.get(code);
        if (!room)
            return;
        room.state = 'lobby';
        room.currentGame = null;
        room.currentRound = 0;
        room.gameData = {};
        room.players.forEach(p => {
            p.score = 0;
            p.isAlive = true;
            p.isReady = false;
            p.currentAnswer = null;
        });
        io.to(code).emit('returnedToLobby', { players: getPlayerList(room) });
    });
    // Disconnect
    socket.on('disconnect', () => {
        rooms.forEach((room, code) => {
            if (room.players.has(socket.id)) {
                room.players.delete(socket.id);
                if (room.players.size === 0) {
                    rooms.delete(code);
                }
                else {
                    if (room.hostId === socket.id) {
                        const newHost = room.players.values().next().value;
                        if (newHost) {
                            newHost.isHost = true;
                            room.hostId = newHost.id;
                        }
                    }
                    io.to(code).emit('playerLeft', { players: getPlayerList(room) });
                }
            }
        });
    });
});
// ─────────────────────────────────────────────────────────────
// Game Logic
// ─────────────────────────────────────────────────────────────
function startGameRound(room) {
    room.players.forEach(p => p.currentAnswer = null);
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
    }
}
function startQuiplashRound(room) {
    const question = CONTENT.quiplash[Math.floor(Math.random() * CONTENT.quiplash.length)];
    room.gameData.currentQuestion = question;
    io.to(room.code).emit('quiplashQuestion', {
        round: room.currentRound + 1,
        maxRounds: room.maxRounds,
        question,
        timeLimit: 60,
    });
}
function startGuesspionageRound(room) {
    const q = CONTENT.guesspionage[Math.floor(Math.random() * CONTENT.guesspionage.length)];
    room.gameData.currentQuestion = q;
    io.to(room.code).emit('guesspionageQuestion', {
        round: room.currentRound + 1,
        maxRounds: room.maxRounds,
        question: q.q,
        timeLimit: 30,
    });
}
function startFakinItRound(room) {
    const categories = Object.keys(CONTENT.fakinit);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const tasks = CONTENT.fakinit[category];
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    const playerIds = Array.from(room.players.keys());
    const fakerId = playerIds[Math.floor(Math.random() * playerIds.length)];
    room.gameData.category = category;
    room.gameData.task = task;
    room.gameData.fakerId = fakerId;
    room.gameData.votes = {};
    room.players.forEach((player, id) => {
        const isFaker = id === fakerId;
        io.to(id).emit('fakinItTask', {
            round: room.currentRound + 1,
            maxRounds: room.maxRounds,
            category: getCategoryName(category),
            task: isFaker ? null : task,
            isFaker,
            timeLimit: 15,
        });
    });
}
function getCategoryName(category) {
    const names = {
        handsOfTruth: '✋ يد الحقيقة',
        numberPressure: '🔢 ضغط الأرقام',
        faceValue: '😀 قيمة الوجه',
        youGottaPoint: '👉 أشر عليه',
    };
    return names[category] || category;
}
function startTriviaMurderRound(room) {
    const q = CONTENT.triviamurder[Math.floor(Math.random() * CONTENT.triviamurder.length)];
    room.gameData.currentQuestion = q;
    const alivePlayers = Array.from(room.players.values())
        .filter(p => p.isAlive)
        .map(p => ({ id: p.id, name: p.name, avatar: p.avatar }));
    io.to(room.code).emit('triviaMurderQuestion', {
        round: room.currentRound + 1,
        maxRounds: room.maxRounds,
        question: q.q,
        options: q.options,
        alivePlayers,
        timeLimit: 20,
    });
}
function startFibbageRound(room) {
    const q = CONTENT.fibbage[Math.floor(Math.random() * CONTENT.fibbage.length)];
    room.gameData.currentQuestion = q;
    io.to(room.code).emit('fibbageQuestion', {
        round: room.currentRound + 1,
        maxRounds: room.maxRounds,
        question: q.q,
        timeLimit: 60,
    });
}
function startDrawfulRound(room) {
    room.players.forEach((player, id) => {
        const prompt = CONTENT.drawful[Math.floor(Math.random() * CONTENT.drawful.length)];
        room.gameData[`prompt_${id}`] = prompt;
        io.to(id).emit('drawfulPrompt', {
            round: room.currentRound + 1,
            maxRounds: room.maxRounds,
            prompt,
            timeLimit: 90,
        });
    });
}
function handleAllAnswered(room) {
    switch (room.currentGame) {
        case 'quiplash':
            startVotingPhase(room);
            break;
        case 'guesspionage':
            calculateGuesspionageResults(room);
            break;
        case 'fakinit':
            startFakinItVoting(room);
            break;
        case 'triviamurder':
            calculateTriviaMurderResults(room);
            break;
        case 'fibbage':
            startFibbageVoting(room);
            break;
    }
}
function startVotingPhase(room) {
    const players = Array.from(room.players.values()).filter(p => p.currentAnswer);
    if (players.length < 2) {
        room.currentRound++;
        if (room.currentRound >= room.maxRounds) {
            endGame(room);
        }
        else {
            startGameRound(room);
        }
        return;
    }
    const shuffled = shuffle(players);
    const matchup = [shuffled[0], shuffled[1]];
    room.gameData.matchup = matchup.map(p => p.id);
    room.gameData.votes = {};
    const answers = matchup.map(p => ({
        playerId: p.id,
        answer: p.currentAnswer,
    }));
    room.players.forEach(p => p.currentAnswer = null);
    io.to(room.code).emit('votingPhase', {
        question: room.gameData.currentQuestion,
        answers: shuffle(answers),
        timeLimit: 30,
    });
}
function startFakinItVoting(room) {
    room.gameData.votes = {};
    io.to(room.code).emit('fakinItVoting', {
        task: room.gameData.task,
        players: getPlayerList(room),
        timeLimit: 20,
    });
}
function startFibbageVoting(room) {
    const question = room.gameData.currentQuestion;
    const options = [];
    room.players.forEach((player, id) => {
        if (player.currentAnswer) {
            options.push({ id, text: player.currentAnswer });
        }
    });
    options.push({ id: 'correct', text: question.answer });
    room.gameData.options = shuffle(options);
    room.gameData.guesses = {};
    io.to(room.code).emit('fibbageVoting', {
        question: question.q,
        options: room.gameData.options,
        timeLimit: 30,
    });
}
function calculateResults(room) {
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
    }
}
function calculateQuiplashResults(room) {
    const votes = room.gameData.votes || {};
    const voteCounts = {};
    room.gameData.matchup?.forEach((id) => {
        voteCounts[id] = 0;
    });
    Object.values(votes).forEach((votedId) => {
        voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
    });
    Object.entries(voteCounts).forEach(([playerId, count]) => {
        const player = room.players.get(playerId);
        if (player) {
            player.score += count * 100;
        }
    });
    const results = room.gameData.matchup?.map((id) => {
        const p = room.players.get(id);
        return {
            playerId: id,
            playerName: p?.name,
            answer: p?.currentAnswer,
            votes: voteCounts[id] || 0,
            score: p?.score || 0,
        };
    }).sort((a, b) => b.votes - a.votes);
    io.to(room.code).emit('roundResults', {
        game: room.currentGame,
        question: room.gameData.currentQuestion,
        results,
        players: getPlayerList(room),
        isLastRound: room.currentRound >= room.maxRounds - 1,
    });
}
function calculateGuesspionageResults(room) {
    const correctAnswer = room.gameData.currentQuestion.answer;
    const results = [];
    room.players.forEach((player, id) => {
        const guess = parseInt(player.currentAnswer) || 0;
        const diff = Math.abs(guess - correctAnswer);
        let points = 0;
        let accuracy = '';
        if (diff === 0) {
            points = 1000;
            accuracy = 'مثالي! 🎯';
        }
        else if (diff <= 5) {
            points = 500;
            accuracy = 'قريب جداً! 🔥';
        }
        else if (diff <= 10) {
            points = 300;
            accuracy = 'قريب! 👍';
        }
        else if (diff <= 20) {
            points = 100;
            accuracy = 'مقبول 😐';
        }
        else {
            points = 0;
            accuracy = 'بعيد! 😅';
        }
        player.score += points;
        results.push({
            playerId: id,
            playerName: player.name,
            avatar: player.avatar,
            guess,
            diff,
            points,
            accuracy,
            totalScore: player.score,
            isHigher: guess > correctAnswer,
        });
    });
    results.sort((a, b) => a.diff - b.diff);
    io.to(room.code).emit('roundResults', {
        game: room.currentGame,
        question: room.gameData.currentQuestion.q,
        correctAnswer,
        results,
        players: getPlayerList(room),
        isLastRound: room.currentRound >= room.maxRounds - 1,
    });
}
function calculateFakinItResults(room) {
    const votes = room.gameData.votes || {};
    const fakerId = room.gameData.fakerId;
    const faker = room.players.get(fakerId);
    const voteCounts = {};
    Object.values(votes).forEach((votedId) => {
        voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
    });
    let maxVotes = 0;
    let mostVotedId = null;
    Object.entries(voteCounts).forEach(([id, count]) => {
        if (count > maxVotes) {
            maxVotes = count;
            mostVotedId = id;
        }
    });
    const caught = mostVotedId === fakerId;
    if (caught) {
        Object.entries(votes).forEach(([voterId, votedId]) => {
            if (votedId === fakerId) {
                const voter = room.players.get(voterId);
                if (voter)
                    voter.score += 500;
            }
        });
    }
    else if (faker) {
        faker.score += 1000;
    }
    io.to(room.code).emit('roundResults', {
        game: room.currentGame,
        task: room.gameData.task,
        fakerId,
        fakerName: faker?.name,
        caught,
        voteCounts,
        players: getPlayerList(room),
        isLastRound: room.currentRound >= room.maxRounds - 1,
    });
}
function calculateTriviaMurderResults(room) {
    const question = room.gameData.currentQuestion;
    const results = [];
    const newlyDead = [];
    room.players.forEach((player, id) => {
        if (!player.isAlive)
            return;
        const isCorrect = player.currentAnswer === question.correct;
        if (isCorrect) {
            player.score += 100;
        }
        else {
            player.isAlive = false;
            newlyDead.push(player.name);
        }
        results.push({
            playerId: id,
            playerName: player.name,
            avatar: player.avatar,
            answer: question.options[player.currentAnswer],
            isCorrect,
            isAlive: player.isAlive,
            score: player.score,
        });
    });
    const alivePlayers = Array.from(room.players.values()).filter(p => p.isAlive);
    const isGameOver = alivePlayers.length <= 1 || room.currentRound >= room.maxRounds - 1;
    io.to(room.code).emit('roundResults', {
        game: room.currentGame,
        question: question.q,
        correctAnswer: question.options[question.correct],
        correctIndex: question.correct,
        results,
        newlyDead,
        players: getPlayerList(room),
        isLastRound: isGameOver,
    });
}
function calculateFibbageResults(room) {
    const guesses = room.gameData.guesses || {};
    const question = room.gameData.currentQuestion;
    const results = [];
    room.players.forEach((player, id) => {
        const guess = guesses[id];
        let points = 0;
        let gotCorrect = false;
        let fooledCount = 0;
        if (guess === 'correct') {
            points += 500;
            gotCorrect = true;
        }
        Object.entries(guesses).forEach(([guesserId, guessedId]) => {
            if (guessedId === id && guesserId !== id) {
                points += 250;
                fooledCount++;
            }
        });
        player.score += points;
        results.push({
            playerId: id,
            playerName: player.name,
            lie: player.currentAnswer,
            gotCorrect,
            fooledCount,
            pointsEarned: points,
            totalScore: player.score,
        });
    });
    results.sort((a, b) => b.pointsEarned - a.pointsEarned);
    io.to(room.code).emit('roundResults', {
        game: room.currentGame,
        question: question.q,
        correctAnswer: question.answer,
        results,
        players: getPlayerList(room),
        isLastRound: room.currentRound >= room.maxRounds - 1,
    });
}
function endGame(room) {
    room.state = 'results';
    const finalResults = getPlayerList(room).sort((a, b) => b.score - a.score);
    io.to(room.code).emit('gameEnded', {
        finalResults,
        winner: finalResults[0],
    });
}
// ─────────────────────────────────────────────────────────────
// Server Start
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
function startServer(port) {
    server.listen(port, () => {
        console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🎮 أبو عابد بوكس V4 - PRO                      ║
║                                                   ║
║   ✅ السيرفر شغال!                               ║
║                                                   ║
║   افتح المتصفح على:                              ║
║   http://localhost:${port}                          ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
    `);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ البورت ${port} مشغول، جاري تجربة ${port + 1}...`);
            startServer(port + 1);
        }
        else {
            console.error(err);
        }
    });
}
startServer(Number(PORT));
// Cleanup old rooms every hour
setInterval(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    rooms.forEach((room, code) => {
        if (room.createdAt < oneHourAgo && room.state === 'lobby') {
            rooms.delete(code);
        }
    });
}, 60 * 60 * 1000);
//# sourceMappingURL=server.js.map