/**
 * ═══════════════════════════════════════════════════════════════════
 * ████████████████████ أبو عابد بوكس V4.0 ██████████████████████████
 * █████████████ منصة ألعاب جماعية سعودية احترافية ██████████████████
 * ═══════════════════════════════════════════════════════════════════
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

// البيانات الأساسية
const rooms = new Map();
const AVATARS = ['🐪', '🦅', '☕', '🏜️', '🕌', '🌴', '⚔️', '🎭', '🏆', '👑'];
const COLORS = ['#006C35', '#C8A951', '#E91E8C', '#4ECDC4', '#FFD93D', '#6BCB77', '#FF6B35', '#667eea', '#f093fb', '#00d4ff'];
const GAME_NAMES = {
    quiplash: '💬 رد سريع', fibbage: '🤥 كشف الكذاب', guesspionage: '📊 خمّن النسبة',
    fakinit: '🎭 المزيّف', triviamurder: '💀 حفلة القاتل', drawful: '🎨 الرسّام'
};

// أسئلة Quiplash
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

// أسئلة Fibbage
const fibbageQuestions = [
    { q: "السعودية تستورد _____ من أستراليا سنوياً.", answer: "الجمال" },
    { q: "أول مطعم ماكدونالدز في السعودية افتتح في مدينة _____.", answer: "الرياض" },
    { q: "مساحة الربع الخالي تعادل مساحة دولة _____.", answer: "فرنسا" },
    { q: "أول فيلم سعودي عُرض في السينما كان اسمه _____.", answer: "وجدة" },
    { q: "أكبر واحة في العالم موجودة في _____.", answer: "الأحساء" },
    { q: "السعودية فيها أكثر من _____ مليون نخلة.", answer: "30" },
    { q: "الملك عبدالعزيز وحّد السعودية وعمره _____ سنة.", answer: "31" },
    { q: "أول قطار في السعودية ربط بين الرياض و_____.", answer: "الدمام" },
    { q: "برج الساعة في مكة فيه أكبر _____ في العالم.", answer: "ساعة" },
    { q: "السعودية تنتج _____ مليون برميل نفط يومياً.", answer: "10" }
];

// أسئلة Guesspionage
const guesspionageQuestions = [
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
    { q: "كم نسبة اللي ناموا في الدوام أو المحاضرة؟", answer: 47 }
];

// مهام Fakin It
const fakinItTasks = {
    handsOfTruth: [
        "ارفع يدك إذا سرقت أكل من الثلاجة وأنكرت",
        "ارفع يدك إذا كذبت على أهلك عن مكانك",
        "ارفع يدك إذا تطنشت رسالة عمداً",
        "ارفع يدك إذا أكلت شي وقلت ما أكلت",
        "ارفع يدك إذا نمت في محاضرة أو اجتماع",
        "ارفع يدك إذا سويت نفسك مريض عشان ما تروح",
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
        "كم مرة تأخرت عن موعد هالأسبوع؟"
    ],
    textYouUp: [
        "قول اسم أكلة تحبها",
        "قول اسم مكان تبي تزوره",
        "قول شي تسويه كل يوم",
        "قول لون تكرهه",
        "قول اسم مسلسل تابعته",
        "قول شي يخوفك",
        "قول هوايه عندك",
        "قول أكثر شي يعصبك"
    ],
    faceValue: [
        "سوّف وجه الواحد لما يشوف الراتب",
        "سوّف وجه اللي نسي جواله بالبيت",
        "سوّف وجه اللي أكل شي حار",
        "سوّف وجه المتفاجئ",
        "سوّف وجه اللي ما نام",
        "سوّف وجه الخجلان",
        "سوّف وجه الزعلان",
        "سوّف وجه اللي شاف شي مقرف"
    ],
    youGottaPoint: [
        "أشر على الشخص اللي يكذب أكثر",
        "أشر على الشخص الأكثر كرم",
        "أشر على الشخص اللي يتأخر دايماً",
        "أشر على الشخص الأذكى",
        "أشر على الشخص اللي يغضب بسرعة",
        "أشر على الشخص الأطرف",
        "أشر على الشخص اللي يحب النوم",
        "أشر على الشخص اللي يحب الأكل"
    ]
};

// أسئلة Trivia Murder
const triviaMurderQuestions = [
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
    { q: "كم عدد أركان الإسلام؟", options: ["5", "4", "6", "3"], correct: 0 }
];

// تحديات الموت
const deathChallenges = [
    { type: "math", q: "ما ناتج 7 × 8؟", answer: "56" },
    { type: "math", q: "ما ناتج 15 + 27؟", answer: "42" },
    { type: "math", q: "ما ناتج 100 - 37؟", answer: "63" },
    { type: "word", q: "اكتب كلمة 'نجاة' بالمقلوب", answer: "ةاجن" },
    { type: "speed", q: "اكتب الأرقام من 1 إلى 5 بسرعة", answer: "12345" }
];

// كلمات Drawful
const drawfulPrompts = [
    "بعير يركب سيارة", "شايب يلعب فورتنايت", "كبسة طايرة",
    "صقر يشرب قهوة", "شماغ على رأس قطة", "برج المملكة يرقص",
    "جمل في المول", "مندي يطير في الفضاء", "خروف يقود طيارة",
    "شيخ يلعب بلايستيشن", "فنجال قهوة عملاق", "نخلة تمشي",
    "فلافل بأجنحة", "شاورما تتكلم", "قهوة سعودية غاضبة"
];

// ═══════════════════════════════════════════════════════════════════
// ██████████████████████ Helper Functions ███████████████████████████
// ═══════════════════════════════════════════════════════════════════
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// ═══════════════════════════════════════════════════════════════════
// ███████████████████████ GameRoom Class ████████████████████████████
// ═══════════════════════════════════════════════════════════════════
class GameRoom {
    constructor(hostId, hostName) {
        this.code = generateRoomCode();
        this.hostId = hostId;
        this.players = new Map();
        this.state = 'lobby';
        this.currentGame = null;
        this.currentRound = 0;
        this.maxRounds = 3;
        this.gameData = {};
        this.usedQuestions = new Set();
        this.createdAt = Date.now();
        this.addPlayer(hostId, hostName, true);
    }

    addPlayer(socketId, name, isHost = false) {
        this.players.set(socketId, {
            id: socketId,
            name: name,
            isHost: isHost,
            score: 0,
            color: COLORS[this.players.size % COLORS.length],
            avatar: AVATARS[this.players.size % AVATARS.length],
            isReady: false,
            isAlive: true,
            currentAnswer: null
        });
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
        if (this.hostId === socketId && this.players.size > 0) {
            const newHost = this.players.values().next().value;
            newHost.isHost = true;
            this.hostId = newHost.id;
        }
    }

    getPlayerList() {
        return Array.from(this.players.values()).map(p => ({
            id: p.id, name: p.name, score: p.score, color: p.color,
            avatar: p.avatar, isHost: p.isHost, isReady: p.isReady, isAlive: p.isAlive
        }));
    }

    getAlivePlayers() {
        return Array.from(this.players.values()).filter(p => p.isAlive);
    }

    startGame(gameName) {
        this.currentGame = gameName;
        this.currentRound = 0;
        this.state = 'playing';
        this.gameData = {};
        this.usedQuestions = new Set();
        this.players.forEach(p => {
            p.isAlive = true;
            p.currentAnswer = null;
        });
    }

    resetForNextRound() {
        this.gameData = {};
        this.players.forEach(p => p.currentAnswer = null);
    }
}

// ═══════════════════════════════════════════════════════════════════
// ████████████████████████ Socket Events ████████████████████████████
// ═══════════════════════════════════════════════════════════════════
io.on('connection', (socket) => {
    console.log(`✅ لاعب جديد: ${socket.id}`);

    // إنشاء غرفة
    socket.on('createRoom', (playerName) => {
        const room = new GameRoom(socket.id, playerName);
        rooms.set(room.code, room);
        socket.join(room.code);
        socket.emit('roomCreated', { code: room.code, players: room.getPlayerList() });
        console.log(`🏠 غرفة جديدة: ${room.code}`);
    });

    // الانضمام لغرفة
    socket.on('joinRoom', ({ code, playerName }) => {
        const room = rooms.get(code?.toUpperCase());
        if (!room) return socket.emit('error', { message: 'الغرفة غير موجودة!' });
        if (room.players.size >= 10) return socket.emit('error', { message: 'الغرفة ممتلئة!' });
        if (room.state !== 'lobby') return socket.emit('error', { message: 'اللعبة بدأت!' });
        
        room.addPlayer(socket.id, playerName);
        socket.join(code.toUpperCase());
        socket.emit('roomJoined', { code: room.code, players: room.getPlayerList() });
        io.to(room.code).emit('playerJoined', { 
            players: room.getPlayerList(),
            newPlayer: playerName
        });
    });

    // تجهيز
    socket.on('playerReady', (code) => {
        const room = rooms.get(code);
        if (!room) return;
        const player = room.players.get(socket.id);
        if (player) {
            player.isReady = !player.isReady;
            io.to(code).emit('playerUpdated', { players: room.getPlayerList() });
        }
    });

    // بدء اللعبة
    socket.on('startGame', ({ code, game }) => {
        const room = rooms.get(code);
        if (!room || socket.id !== room.hostId) return;
        if (room.players.size < 2) return socket.emit('error', { message: 'تحتاج لاعبين على الأقل!' });
        
        room.startGame(game);
        io.to(code).emit('gameStarted', { 
            game, 
            gameName: GAME_NAMES[game],
            players: room.getPlayerList() 
        });
        
        setTimeout(() => startGameRound(room), 1500);
    });

    // ═══════════════════ Quiplash Events ═══════════════════
    socket.on('submitQuiplashAnswer', ({ code, answer }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'quiplash') return;
        
        const player = room.players.get(socket.id);
        if (player && !player.currentAnswer) {
            player.currentAnswer = answer;
            const count = countAnswered(room);
            const total = room.players.size;
            io.to(code).emit('playerAnswered', { 
                playerId: socket.id, 
                playerName: player.name,
                count, 
                total 
            });
            
            if (count >= total) {
                setTimeout(() => startQuiplashVoting(room), 500);
            }
        }
    });

    socket.on('submitQuiplashVote', ({ code, votedPlayerId }) => {
        const room = rooms.get(code);
        if (!room) return;
        
        const player = room.players.get(socket.id);
        const matchup = room.gameData.matchup || [];
        if (player && !matchup.includes(socket.id)) {
            if (!room.gameData.votes) room.gameData.votes = {};
            room.gameData.votes[socket.id] = votedPlayerId;
            
            const voterCount = Object.keys(room.gameData.votes).length;
            const expectedVoters = room.players.size - matchup.length;
            
            if (voterCount >= expectedVoters) {
                calculateQuiplashResults(room);
            }
        }
    });

    // ═══════════════════ Fibbage Events ═══════════════════
    socket.on('submitFibbageLie', ({ code, lie }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'fibbage') return;
        
        const player = room.players.get(socket.id);
        if (player && !player.currentAnswer) {
            player.currentAnswer = lie;
            const count = countAnswered(room);
            io.to(code).emit('playerAnswered', { playerId: socket.id, playerName: player.name, count, total: room.players.size });
            
            if (count >= room.players.size) {
                setTimeout(() => startFibbageVoting(room), 500);
            }
        }
    });

    socket.on('submitFibbageGuess', ({ code, guessId }) => {
        const room = rooms.get(code);
        if (!room) return;
        
        if (!room.gameData.guesses) room.gameData.guesses = {};
        room.gameData.guesses[socket.id] = guessId;
        
        if (Object.keys(room.gameData.guesses).length >= room.players.size) {
            calculateFibbageResults(room);
        }
    });

    // ═══════════════════ Guesspionage Events ═══════════════════
    socket.on('submitGuess', ({ code, guess }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'guesspionage') return;
        
        const player = room.players.get(socket.id);
        if (player && player.currentAnswer === null) {
            player.currentAnswer = parseInt(guess);
            const count = countAnswered(room);
            io.to(code).emit('playerAnswered', { playerId: socket.id, playerName: player.name, count, total: room.players.size });
            
            if (count >= room.players.size) {
                setTimeout(() => calculateGuesspionageResults(room), 500);
            }
        }
    });

    // ═══════════════════ Fakin It Events ═══════════════════
    socket.on('submitFakinAction', ({ code, action }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'fakinit') return;
        
        const player = room.players.get(socket.id);
        if (player) {
            player.currentAnswer = action;
            const count = countAnswered(room);
            io.to(code).emit('playerAnswered', { playerId: socket.id, playerName: player.name, count, total: room.players.size });
            
            if (count >= room.players.size) {
                setTimeout(() => startFakinItVoting(room), 1000);
            }
        }
    });

    socket.on('voteFaker', ({ code, suspectId }) => {
        const room = rooms.get(code);
        if (!room) return;
        
        if (!room.gameData.votes) room.gameData.votes = {};
        room.gameData.votes[socket.id] = suspectId;
        
        if (Object.keys(room.gameData.votes).length >= room.players.size) {
            calculateFakinItResults(room);
        }
    });

    // ═══════════════════ Trivia Murder Events ═══════════════════
    socket.on('submitTriviaAnswer', ({ code, answerIndex }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'triviamurder') return;
        
        const player = room.players.get(socket.id);
        if (player && player.isAlive && player.currentAnswer === null) {
            player.currentAnswer = answerIndex;
            const count = countAnsweredAlive(room);
            const total = room.getAlivePlayers().length;
            io.to(code).emit('playerAnswered', { playerId: socket.id, playerName: player.name, count, total });
            
            if (count >= total) {
                setTimeout(() => calculateTriviaMurderResults(room), 500);
            }
        }
    });

    socket.on('submitDeathChallenge', ({ code, answer }) => {
        const room = rooms.get(code);
        if (!room) return;
        
        if (!room.gameData.deathAnswers) room.gameData.deathAnswers = {};
        room.gameData.deathAnswers[socket.id] = answer;
        
        const deadPlayers = Array.from(room.players.values()).filter(p => !p.isAlive);
        if (Object.keys(room.gameData.deathAnswers).length >= deadPlayers.length) {
            resolveDeathChallenge(room);
        }
    });

    // ═══════════════════ General Events ═══════════════════
    socket.on('requestNextRound', (code) => {
        const room = rooms.get(code);
        if (!room || socket.id !== room.hostId) return;
        
        room.currentRound++;
        room.resetForNextRound();
        
        if (room.currentRound >= room.maxRounds) {
            endGame(room);
        } else {
            startGameRound(room);
        }
    });

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
        
        io.to(code).emit('returnedToLobby', { players: room.getPlayerList() });
    });

    // قطع الاتصال
    socket.on('disconnect', () => {
        rooms.forEach((room, code) => {
            if (room.players.has(socket.id)) {
                const player = room.players.get(socket.id);
                room.removePlayer(socket.id);
                if (room.players.size === 0) {
                    rooms.delete(code);
                } else {
                    io.to(code).emit('playerLeft', { 
                        players: room.getPlayerList(),
                        leftPlayer: player?.name 
                    });
                }
            }
        });
    });
});

// ═══════════════════════════════════════════════════════════════════
// █████████████████████ Game Logic Functions ████████████████████████
// ═══════════════════════════════════════════════════════════════════
function countAnswered(room) {
    return Array.from(room.players.values()).filter(p => p.currentAnswer !== null).length;
}

function countAnsweredAlive(room) {
    return Array.from(room.players.values()).filter(p => p.isAlive && p.currentAnswer !== null).length;
}

function startGameRound(room) {
    room.resetForNextRound();
    
    switch (room.currentGame) {
        case 'quiplash': startQuiplashRound(room); break;
        case 'fibbage': startFibbageRound(room); break;
        case 'guesspionage': startGuesspionageRound(room); break;
        case 'fakinit': startFakinItRound(room); break;
        case 'triviamurder': startTriviaMurderRound(room); break;
        case 'drawful': startDrawfulRound(room); break;
    }
}

// ══════════════════════════ Quiplash ═══════════════════════════════
function startQuiplashRound(room) {
    const question = getRandomItem(quiplashQuestions);
    room.gameData.currentQuestion = question;
    
    io.to(room.code).emit('quiplashQuestion', {
        round: room.currentRound + 1,
        maxRounds: room.maxRounds,
        question: question,
        timeLimit: 60
    });
}

function startQuiplashVoting(room) {
    const players = Array.from(room.players.values()).filter(p => p.currentAnswer);
    if (players.length < 2) {
        room.currentRound++;
        startGameRound(room);
        return;
    }
    
    const shuffled = shuffleArray(players);
    const matchup = [shuffled[0], shuffled[1]];
    room.gameData.matchup = matchup.map(p => p.id);
    room.gameData.votes = {};
    
    const answers = shuffleArray(matchup.map(p => ({
        playerId: p.id,
        playerName: p.name,
        answer: p.currentAnswer
    })));
    
    io.to(room.code).emit('quiplashVoting', {
        question: room.gameData.currentQuestion,
        answers: answers,
        timeLimit: 30
    });
}

function calculateQuiplashResults(room) {
    const votes = room.gameData.votes || {};
    const matchup = room.gameData.matchup || [];
    const voteCount = {};
    
    matchup.forEach(id => voteCount[id] = 0);
    Object.values(votes).forEach(votedId => {
        voteCount[votedId] = (voteCount[votedId] || 0) + 1;
    });
    
    const totalVotes = Object.values(voteCount).reduce((a, b) => a + b, 0);
    let isQuiplash = false;
    
    matchup.forEach(id => {
        const player = room.players.get(id);
        if (player) {
            const playerVotes = voteCount[id] || 0;
            if (playerVotes === totalVotes && totalVotes > 0) {
                player.score += playerVotes * 200;
                isQuiplash = true;
            } else {
                player.score += playerVotes * 100;
            }
        }
    });
    
    const results = matchup.map(id => {
        const p = room.players.get(id);
        return {
            playerId: id, playerName: p.name, playerAvatar: p.avatar, playerColor: p.color,
            answer: p.currentAnswer, votes: voteCount[id] || 0,
            percentage: totalVotes > 0 ? Math.round((voteCount[id] / totalVotes) * 100) : 0
        };
    }).sort((a, b) => b.votes - a.votes);
    
    io.to(room.code).emit('quiplashResults', {
        question: room.gameData.currentQuestion, results, quiplash: isQuiplash,
        isLastRound: room.currentRound >= room.maxRounds - 1
    });
}

// ══════════════════════════ Fibbage ════════════════════════════════
function startFibbageRound(room) {
    const question = getRandomItem(fibbageQuestions);
    room.gameData.currentQuestion = question;
    io.to(room.code).emit('fibbageQuestion', {
        round: room.currentRound + 1, maxRounds: room.maxRounds,
        question: question.q, timeLimit: 60
    });
}

function startFibbageVoting(room) {
    const question = room.gameData.currentQuestion;
    const options = [];
    room.players.forEach((player, id) => {
        if (player.currentAnswer) options.push({ id, text: player.currentAnswer, isCorrect: false });
    });
    options.push({ id: 'correct', text: question.answer, isCorrect: true });
    room.gameData.options = shuffleArray(options);
    
    io.to(room.code).emit('fibbageVoting', {
        question: question.q,
        options: room.gameData.options.map(o => ({ id: o.id, text: o.text })),
        timeLimit: 30
    });
}

function calculateFibbageResults(room) {
    const guesses = room.gameData.guesses || {};
    const question = room.gameData.currentQuestion;
    const results = [];
    
    room.players.forEach((player, id) => {
        let points = 0, gotCorrect = guesses[id] === 'correct', fooledCount = 0;
        if (gotCorrect) points += 500;
        Object.entries(guesses).forEach(([guesserId, guessedId]) => {
            if (guessedId === id && guesserId !== id) { points += 250; fooledCount++; }
        });
        player.score += points;
        results.push({ playerId: id, playerName: player.name, playerAvatar: player.avatar,
            lie: player.currentAnswer, gotCorrect, fooledCount, pointsEarned: points });
    });
    
    io.to(room.code).emit('fibbageResults', {
        question: question.q, correctAnswer: question.answer,
        results: results.sort((a, b) => b.pointsEarned - a.pointsEarned),
        isLastRound: room.currentRound >= room.maxRounds - 1
    });
}

// ══════════════════════════ Guesspionage ═══════════════════════════
function startGuesspionageRound(room) {
    const question = getRandomItem(guesspionageQuestions);
    room.gameData.currentQuestion = question;
    room.players.forEach(p => p.currentAnswer = null);
    io.to(room.code).emit('guesspionageQuestion', {
        round: room.currentRound + 1, maxRounds: room.maxRounds,
        question: question.q, timeLimit: 30
    });
}

function calculateGuesspionageResults(room) {
    const correctAnswer = room.gameData.currentQuestion.answer;
    const results = [];
    
    room.players.forEach((player, id) => {
        const guess = player.currentAnswer || 50;
        const diff = Math.abs(guess - correctAnswer);
        let points = 0, emoji = '', accuracy = '';
        
        if (diff === 0) { points = 1000; emoji = '🎯'; accuracy = 'مثالي!'; }
        else if (diff <= 5) { points = 500; emoji = '🔥'; accuracy = 'قريب جداً!'; }
        else if (diff <= 10) { points = 300; emoji = '👍'; accuracy = 'قريب!'; }
        else if (diff <= 20) { points = 100; emoji = '😐'; accuracy = 'مقبول'; }
        else { points = 0; emoji = '😅'; accuracy = 'بعيد!'; }
        
        player.score += points;
        results.push({ playerId: id, playerName: player.name, playerAvatar: player.avatar,
            guess, diff, points, emoji, accuracy });
    });
    
    io.to(room.code).emit('guesspionageResults', {
        question: room.gameData.currentQuestion.q, correctAnswer,
        results: results.sort((a, b) => a.diff - b.diff),
        isLastRound: room.currentRound >= room.maxRounds - 1
    });
}

// ══════════════════════════ Fakin It ═══════════════════════════════
function startFakinItRound(room) {
    const categories = Object.keys(fakinItTasks);
    const category = getRandomItem(categories);
    const task = getRandomItem(fakinItTasks[category]);
    const fakerId = getRandomItem(Array.from(room.players.keys()));
    
    room.gameData = { category, task, fakerId, votes: {} };
    room.players.forEach(p => p.currentAnswer = null);
    
    const categoryNames = {
        handsOfTruth: '✋ يد الحقيقة', numberPressure: '🔢 ضغط الأرقام',
        textYouUp: '🗣️ قولها بصوتك', faceValue: '😀 قيمة الوجه', youGottaPoint: '👉 أشر عليه'
    };
    
    room.players.forEach((_, id) => {
        io.to(id).emit('fakinItTask', {
            round: room.currentRound + 1, maxRounds: room.maxRounds,
            category: categoryNames[category], task: id === fakerId ? null : task,
            isFaker: id === fakerId, timeLimit: 15
        });
    });
}

function startFakinItVoting(room) {
    room.gameData.votes = {};
    io.to(room.code).emit('fakinItVoting', { task: room.gameData.task, players: room.getPlayerList(), timeLimit: 20 });
}

function calculateFakinItResults(room) {
    const { votes, fakerId, task } = room.gameData;
    const faker = room.players.get(fakerId);
    const voteCount = {};
    
    room.players.forEach((_, id) => voteCount[id] = 0);
    Object.values(votes || {}).forEach(votedId => voteCount[votedId] = (voteCount[votedId] || 0) + 1);
    
    let maxVotes = 0, mostVotedId = null;
    Object.entries(voteCount).forEach(([id, count]) => { if (count > maxVotes) { maxVotes = count; mostVotedId = id; } });
    
    const caught = mostVotedId === fakerId;
    if (caught) {
        Object.entries(votes || {}).forEach(([voterId, votedId]) => {
            if (votedId === fakerId) { const v = room.players.get(voterId); if (v) v.score += 500; }
        });
    } else { faker.score += 1000; }
    
    io.to(room.code).emit('fakinItResults', {
        task, fakerId, fakerName: faker.name, fakerAvatar: faker.avatar, fakerColor: faker.color, caught,
        voteResults: room.getPlayerList().map(p => ({ ...p, votesReceived: voteCount[p.id] || 0, isFaker: p.id === fakerId })),
        isLastRound: room.currentRound >= room.maxRounds - 1
    });
}

// ══════════════════════════ Trivia Murder ══════════════════════════
function startTriviaMurderRound(room) {
    const question = getRandomItem(triviaMurderQuestions);
    room.gameData.currentQuestion = question;
    room.players.forEach(p => { if (p.isAlive) p.currentAnswer = null; });
    io.to(room.code).emit('triviaMurderQuestion', {
        round: room.currentRound + 1, maxRounds: room.maxRounds,
        question: question.q, options: question.options,
        alivePlayers: room.getAlivePlayers().map(p => ({ id: p.id, name: p.name, avatar: p.avatar })),
        timeLimit: 20
    });
}

function calculateTriviaMurderResults(room) {
    const question = room.gameData.currentQuestion;
    const results = [], newlyDead = [];
    
    room.players.forEach((player, id) => {
        if (!player.isAlive) { results.push({ playerId: id, playerName: player.name, playerAvatar: player.avatar, answer: 'ميت', isCorrect: false, isAlive: false, wasAlreadyDead: true }); return; }
        const isCorrect = player.currentAnswer === question.correct;
        if (isCorrect) { player.score += 100; } else { player.isAlive = false; newlyDead.push({ name: player.name, avatar: player.avatar }); }
        results.push({ playerId: id, playerName: player.name, playerAvatar: player.avatar, answer: question.options[player.currentAnswer] || 'لم يجاوب', isCorrect, isAlive: player.isAlive, wasAlreadyDead: false });
    });
    
    const alivePlayers = room.getAlivePlayers().length;
    const isGameOver = alivePlayers <= 1 || room.currentRound >= room.maxRounds - 1;
    
    io.to(room.code).emit('triviaMurderResults', { question: question.q, correctAnswer: question.options[question.correct], results, newlyDead, alivePlayers, isLastRound: isGameOver });
    
    if (newlyDead.length > 0 && !isGameOver) setTimeout(() => startDeathChallenge(room, newlyDead), 3000);
}

function startDeathChallenge(room, deadPlayers) {
    const challenge = getRandomItem(deathChallenges);
    room.gameData.deathChallenge = challenge;
    room.gameData.deathAnswers = {};
    room.players.forEach((p, id) => { if (!p.isAlive) io.to(id).emit('deathChallenge', { type: challenge.type, question: challenge.q, timeLimit: 10 }); });
    io.to(room.code).emit('deathChallengeStarted', { count: deadPlayers.length });
}

function resolveDeathChallenge(room) {
    const { deathChallenge, deathAnswers } = room.gameData;
    const survivors = [];
    Object.entries(deathAnswers || {}).forEach(([playerId, answer]) => {
        const player = room.players.get(playerId);
        if (player && answer.toString().toLowerCase().trim() === deathChallenge.answer.toLowerCase()) {
            player.isAlive = true; survivors.push({ name: player.name, avatar: player.avatar });
        }
    });
    io.to(room.code).emit('deathChallengeResults', { survivors, correctAnswer: deathChallenge.answer });
}

// ══════════════════════════ Drawful ════════════════════════════════
function startDrawfulRound(room) {
    room.players.forEach((player, id) => {
        const prompt = getRandomItem(drawfulPrompts);
        player.currentAnswer = null;
        room.gameData[`prompt_${id}`] = prompt;
        io.to(id).emit('drawfulPrompt', { round: room.currentRound + 1, maxRounds: room.maxRounds, prompt, timeLimit: 90 });
    });
}

// ══════════════════════════ End Game ═══════════════════════════════
function endGame(room) {
    room.state = 'ended';
    const finalResults = room.getPlayerList().sort((a, b) => b.score - a.score).map((p, i) => ({
        ...p, rank: i + 1, medal: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''
    }));
    io.to(room.code).emit('gameEnded', { gameName: GAME_NAMES[room.currentGame], finalResults, winner: finalResults[0] });
}

// ═══════════════════════════════════════════════════════════════════
// ██████████████████████ Server Start ███████════════════════════════
// ═══════════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;

function startServer(port) {
    server.listen(port, () => {
        console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║     🎮 أبو عابد بوكس V4.0 - السيرفر             ║
    ║     ✅ السيرفر شغال!                             ║
    ║     افتح المتصفح على: http://localhost:${port}    ║
    ╚═══════════════════════════════════════════════════╝
        `);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') startServer(port + 1);
        else console.error(err);
    });
}

startServer(PORT);

// تنظيف الغرف القديمة
setInterval(() => {
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    rooms.forEach((room, code) => { if (room.createdAt < twoHoursAgo) rooms.delete(code); });
}, 60 * 60 * 1000);