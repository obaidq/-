/**
 * أبو عابد بوكس - السيرفر المحسّن V3
 * منصة ألعاب جماعية سعودية احترافية
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

// ==================== بيانات الألعاب ====================
const rooms = new Map();

// أسئلة خمّن النسبة (Guesspionage) - استطلاعات سعودية
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
    { q: "كم نسبة اللي ناموا في الدوام أو المحاضرة؟", answer: 47 },
    { q: "كم نسبة اللي يشوفون إن رواتبهم ما تكفي؟", answer: 76 },
    { q: "كم نسبة اللي جربوا الدايت ورجعوا؟", answer: 81 },
    { q: "كم نسبة اللي يحبون القطط أكثر من الكلاب؟", answer: 67 },
    { q: "كم نسبة اللي يقرأون كتب بانتظام؟", answer: 18 },
    { q: "كم نسبة اللي يمارسون رياضة أسبوعياً؟", answer: 32 }
];

// مهام المزيّف (Fakin' It) - 5 أنواع
const fakinItTasks = {
    handsOfTruth: [ // ارفع يدك إذا...
        "ارفع يدك إذا سرقت أكل من الثلاجة وأنكرت",
        "ارفع يدك إذا كذبت على أهلك عن مكانك",
        "ارفع يدك إذا تطنشت رسالة عمداً",
        "ارفع يدك إذا أكلت شي وقلت ما أكلت",
        "ارفع يدك إذا نمت في محاضرة أو اجتماع",
        "ارفع يدك إذا سويت نفسك مريض عشان ما تروح",
        "ارفع يدك إذا خذيت شي من أخوك/أختك بدون إذن",
        "ارفع يدك إذا قلت بجي وما جيت",
        "ارفع يدك إذا حطيت فلتر مبالغ فيه بصورتك",
        "ارفع يدك إذا تجسست على جوال أحد"
    ],
    numberPressure: [ // ارفع عدد أصابع
        "كم مرة تفتح الثلاجة في اليوم؟",
        "كم ساعة تقضي على الجوال يومياً؟",
        "كم صديق مقرب عندك فعلاً؟",
        "كم مرة سافرت هالسنة؟",
        "كم كوب قهوة/شاي تشرب باليوم؟",
        "كم مرة غيرت صورة بروفايلك هالشهر؟",
        "كم سيارة ركبتها بحياتك؟",
        "كم لغة تتكلم؟",
        "كم مرة تأخرت عن موعد هالأسبوع؟",
        "كم جهاز إلكتروني عندك؟"
    ],
    textYouUp: [ // قول بصوت عالي
        "قول اسم أكلة تحبها",
        "قول اسم مكان تبي تزوره",
        "قول شي تسويه كل يوم",
        "قول لون تكرهه",
        "قول اسم مسلسل تابعته",
        "قول شي يخوفك",
        "قول هوايه عندك",
        "قول أكثر شي يعصبك",
        "قول وجبتك المفضلة",
        "قول أغنية تحبها"
    ],
    faceValue: [ // سوِّ وجه
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
    youGottaPoint: [ // أشر على لاعب
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
    { q: "ما هي أصغر دولة في العالم؟", options: ["الفاتيكان", "موناكو", "سان مارينو", "مالطا"], correct: 0 }
];

// تحديات الموت (للي يخسرون في حفلة القاتل)
const deathChallenges = [
    { type: "math", q: "ما ناتج 7 × 8؟", answer: "56" },
    { type: "math", q: "ما ناتج 15 + 27؟", answer: "42" },
    { type: "math", q: "ما ناتج 100 - 37؟", answer: "63" },
    { type: "word", q: "اكتب كلمة 'نجاة' بالمقلوب", answer: "ةاجن" },
    { type: "word", q: "اكتب أول حرف من كل كلمة: 'أنا أحب السعودية'", answer: "ااس" },
    { type: "speed", q: "اكتب الأرقام من 1 إلى 5 بسرعة", answer: "12345" }
];

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

// أسئلة كشف الكذاب (Fibbage)
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

// كلمات الرسم (Drawful)
const drawfulPrompts = [
    "بعير يركب سيارة", "شايب يلعب فورتنايت", "كبسة طايرة",
    "صقر يشرب قهوة", "شماغ على رأس قطة", "برج المملكة يرقص",
    "جمل في المول", "مندي يطير في الفضاء", "خروف يقود طيارة",
    "شيخ يلعب بلايستيشن", "فنجال قهوة عملاق", "نخلة تمشي",
    "بدوي على سكيت بورد", "فلافل بأجنحة", "شاورما تتكلم",
    "قهوة سعودية غاضبة", "جمل يتزلج على الثلج", "صقر يحمل آيفون"
];

// ==================== Helper Functions ====================
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
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

// ==================== Game Room Class ====================
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
        this.createdAt = Date.now();
        this.addPlayer(hostId, hostName, true);
    }

    addPlayer(socketId, name, isHost = false) {
        const colors = ['#E91E8C', '#4ECDC4', '#FFD93D', '#6BCB77', '#FF6B35', '#667eea', '#f093fb', '#43e97b', '#fa709a', '#00d4ff'];
        const avatars = ['😎', '🤠', '🥳', '😈', '🤖', '👻', '🦊', '🐸', '🦁', '🐼'];
        
        this.players.set(socketId, {
            id: socketId,
            name: name,
            isHost: isHost,
            score: 0,
            color: colors[this.players.size % colors.length],
            avatar: avatars[this.players.size % avatars.length],
            isReady: false,
            isAlive: true,
            answers: [],
            votes: [],
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
        this.players.forEach(p => {
            p.answers = [];
            p.votes = [];
            p.isAlive = true;
            p.currentAnswer = null;
        });
    }

    resetForNextRound() {
        this.gameData = {};
        this.players.forEach(p => {
            p.currentAnswer = null;
        });
    }
}

// ==================== Socket Events ====================
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
        io.to(room.code).emit('playerJoined', { players: room.getPlayerList() });
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
        io.to(code).emit('gameStarted', { game, players: room.getPlayerList() });
        
        setTimeout(() => startGameRound(room), 1000);
    });

    // ==================== Quiplash Events ====================
    socket.on('submitQuiplashAnswer', ({ code, answer }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'quiplash') return;
        
        const player = room.players.get(socket.id);
        if (player && !player.currentAnswer) {
            player.currentAnswer = answer;
            io.to(code).emit('playerAnswered', { playerId: socket.id, count: countAnswered(room) });
            
            if (allPlayersAnswered(room)) {
                setTimeout(() => startQuiplashVoting(room), 500);
            }
        }
    });

    socket.on('submitQuiplashVote', ({ code, votedPlayerId }) => {
        const room = rooms.get(code);
        if (!room) return;
        
        const player = room.players.get(socket.id);
        if (player && !player.currentAnswer && votedPlayerId !== socket.id) {
            player.currentAnswer = votedPlayerId;
            
            if (allPlayersVoted(room)) {
                calculateQuiplashResults(room);
            }
        }
    });

    // ==================== Fibbage Events ====================
    socket.on('submitFibbageLie', ({ code, lie }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'fibbage') return;
        
        const player = room.players.get(socket.id);
        if (player && !player.currentAnswer) {
            player.currentAnswer = lie;
            io.to(code).emit('playerAnswered', { playerId: socket.id, count: countAnswered(room) });
            
            if (allPlayersAnswered(room)) {
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

    // ==================== Guesspionage Events ====================
    socket.on('submitGuess', ({ code, guess }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'guesspionage') return;
        
        const player = room.players.get(socket.id);
        if (player && player.currentAnswer === null) {
            player.currentAnswer = parseInt(guess);
            io.to(code).emit('playerAnswered', { playerId: socket.id, count: countAnswered(room) });
            
            if (allPlayersAnswered(room)) {
                setTimeout(() => calculateGuesspionageResults(room), 500);
            }
        }
    });

    // ==================== Fakin It Events ====================
    socket.on('submitFakinAction', ({ code, action }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'fakinit') return;
        
        const player = room.players.get(socket.id);
        if (player) {
            player.currentAnswer = action;
            io.to(code).emit('playerAnswered', { playerId: socket.id, count: countAnswered(room) });
            
            if (allPlayersAnswered(room)) {
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

    // ==================== Trivia Murder Party Events ====================
    socket.on('submitTriviaAnswer', ({ code, answerIndex }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'triviamurder') return;
        
        const player = room.players.get(socket.id);
        if (player && player.isAlive && player.currentAnswer === null) {
            player.currentAnswer = answerIndex;
            io.to(code).emit('playerAnswered', { playerId: socket.id, count: countAnsweredAlive(room) });
            
            if (allAlivePlayersAnswered(room)) {
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

    // ==================== Drawful Events ====================
    socket.on('submitDrawing', ({ code, drawing }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'drawful') return;
        
        const player = room.players.get(socket.id);
        if (player) {
            player.currentAnswer = drawing;
            io.to(code).emit('playerAnswered', { playerId: socket.id, count: countAnswered(room) });
            
            if (allPlayersAnswered(room)) {
                setTimeout(() => startDrawfulGuessing(room), 500);
            }
        }
    });

    // ==================== General Events ====================
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
            p.answers = [];
            p.votes = [];
            p.currentAnswer = null;
        });
        
        io.to(code).emit('returnedToLobby', { players: room.getPlayerList() });
    });

    // قطع الاتصال
    socket.on('disconnect', () => {
        rooms.forEach((room, code) => {
            if (room.players.has(socket.id)) {
                room.removePlayer(socket.id);
                if (room.players.size === 0) {
                    rooms.delete(code);
                } else {
                    io.to(code).emit('playerLeft', { players: room.getPlayerList() });
                }
            }
        });
    });
});

// ==================== Game Logic Functions ====================

function countAnswered(room) {
    return Array.from(room.players.values()).filter(p => p.currentAnswer !== null).length;
}

function countAnsweredAlive(room) {
    return Array.from(room.players.values()).filter(p => p.isAlive && p.currentAnswer !== null).length;
}

function allPlayersAnswered(room) {
    return Array.from(room.players.values()).every(p => p.currentAnswer !== null);
}

function allPlayersVoted(room) {
    const voters = Array.from(room.players.values()).filter(p => !room.gameData.matchup?.includes(p.id));
    return voters.every(p => p.currentAnswer !== null);
}

function allAlivePlayersAnswered(room) {
    return room.getAlivePlayers().every(p => p.currentAnswer !== null);
}

// بدء جولة اللعبة
function startGameRound(room) {
    room.resetForNextRound();
    
    switch (room.currentGame) {
        case 'quiplash':
            startQuiplashRound(room);
            break;
        case 'fibbage':
            startFibbageRound(room);
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
        case 'drawful':
            startDrawfulRound(room);
            break;
    }
}

// ==================== Quiplash ====================
function startQuiplashRound(room) {
    const question = quiplashQuestions[Math.floor(Math.random() * quiplashQuestions.length)];
    room.gameData.currentQuestion = question;
    
    io.to(room.code).emit('quiplashQuestion', {
        round: room.currentRound + 1,
        maxRounds: room.maxRounds,
        question: question,
        timeLimit: 60
    });
}

function startQuiplashVoting(room) {
    room.state = 'voting';
    const players = Array.from(room.players.values()).filter(p => p.currentAnswer);
    
    if (players.length < 2) {
        room.currentRound++;
        if (room.currentRound >= room.maxRounds) {
            endGame(room);
        } else {
            startGameRound(room);
        }
        return;
    }
    
    // اختيار لاعبين عشوائيين للمواجهة
    const shuffled = shuffleArray(players);
    const matchup = [shuffled[0], shuffled[1]];
    room.gameData.matchup = matchup.map(p => p.id);
    
    // إعادة تعيين الأصوات
    room.players.forEach(p => p.currentAnswer = null);
    
    const answers = matchup.map(p => ({
        playerId: p.id,
        playerName: p.name,
        answer: room.players.get(p.id).currentAnswer || p.answers[p.answers.length - 1]
    }));
    
    // حفظ الإجابات
    matchup.forEach(p => {
        const player = room.players.get(p.id);
        if (player) {
            player.answers.push(player.currentAnswer);
        }
    });
    
    io.to(room.code).emit('quiplashVoting', {
        question: room.gameData.currentQuestion,
        answers: shuffleArray(answers),
        timeLimit: 30
    });
}

function calculateQuiplashResults(room) {
    const votes = {};
    room.gameData.matchup.forEach(id => votes[id] = 0);
    
    room.players.forEach((player, id) => {
        if (!room.gameData.matchup.includes(id) && player.currentAnswer) {
            votes[player.currentAnswer] = (votes[player.currentAnswer] || 0) + 1;
        }
    });
    
    // حساب النقاط
    Object.entries(votes).forEach(([playerId, voteCount]) => {
        const player = room.players.get(playerId);
        if (player) {
            player.score += voteCount * 100;
        }
    });
    
    const results = room.gameData.matchup.map(id => {
        const p = room.players.get(id);
        return {
            playerId: id,
            playerName: p.name,
            answer: p.answers[p.answers.length - 1],
            votes: votes[id] || 0,
            score: p.score
        };
    }).sort((a, b) => b.votes - a.votes);
    
    io.to(room.code).emit('quiplashResults', {
        question: room.gameData.currentQuestion,
        results: results,
        isLastRound: room.currentRound >= room.maxRounds - 1
    });
}

// ==================== Fibbage ====================
function startFibbageRound(room) {
    const question = fibbageQuestions[Math.floor(Math.random() * fibbageQuestions.length)];
    room.gameData.currentQuestion = question;
    
    io.to(room.code).emit('fibbageQuestion', {
        round: room.currentRound + 1,
        maxRounds: room.maxRounds,
        question: question.q,
        timeLimit: 60
    });
}

function startFibbageVoting(room) {
    const question = room.gameData.currentQuestion;
    const options = [];
    
    room.players.forEach((player, id) => {
        if (player.currentAnswer) {
            options.push({ id: id, text: player.currentAnswer, isCorrect: false });
        }
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
            totalScore: player.score
        });
    });
    
    results.sort((a, b) => b.pointsEarned - a.pointsEarned);
    
    io.to(room.code).emit('fibbageResults', {
        question: question.q,
        correctAnswer: question.answer,
        results,
        isLastRound: room.currentRound >= room.maxRounds - 1
    });
}

// ==================== Guesspionage ====================
function startGuesspionageRound(room) {
    const question = guesspionageQuestions[Math.floor(Math.random() * guesspionageQuestions.length)];
    room.gameData.currentQuestion = question;
    room.players.forEach(p => p.currentAnswer = null);
    
    io.to(room.code).emit('guesspionageQuestion', {
        round: room.currentRound + 1,
        maxRounds: room.maxRounds,
        question: question.q,
        timeLimit: 30
    });
}

function calculateGuesspionageResults(room) {
    const correctAnswer = room.gameData.currentQuestion.answer;
    const results = [];
    
    room.players.forEach((player, id) => {
        const guess = player.currentAnswer;
        const diff = Math.abs(guess - correctAnswer);
        let points = 0;
        let accuracy = '';
        
        if (diff === 0) {
            points = 1000;
            accuracy = 'مثالي! 🎯';
        } else if (diff <= 5) {
            points = 500;
            accuracy = 'قريب جداً! 🔥';
        } else if (diff <= 10) {
            points = 300;
            accuracy = 'قريب! 👍';
        } else if (diff <= 20) {
            points = 100;
            accuracy = 'مقبول 😐';
        } else {
            points = 0;
            accuracy = 'بعيد! 😅';
        }
        
        player.score += points;
        
        results.push({
            playerId: id,
            playerName: player.name,
            avatar: player.avatar,
            guess: guess,
            diff: diff,
            points: points,
            accuracy: accuracy,
            totalScore: player.score,
            isHigher: guess > correctAnswer
        });
    });
    
    results.sort((a, b) => a.diff - b.diff);
    
    io.to(room.code).emit('guesspionageResults', {
        question: room.gameData.currentQuestion.q,
        correctAnswer: correctAnswer,
        results: results,
        isLastRound: room.currentRound >= room.maxRounds - 1
    });
}

// ==================== Fakin' It ====================
function startFakinItRound(room) {
    const categories = Object.keys(fakinItTasks);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const tasks = fakinItTasks[category];
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    
    // اختيار المزيّف عشوائياً
    const playerIds = Array.from(room.players.keys());
    const fakerId = playerIds[Math.floor(Math.random() * playerIds.length)];
    
    room.gameData.category = category;
    room.gameData.task = task;
    room.gameData.fakerId = fakerId;
    room.gameData.votes = {};
    room.players.forEach(p => p.currentAnswer = null);
    
    // إرسال المهمة لكل لاعب
    room.players.forEach((player, id) => {
        const isFaker = id === fakerId;
        io.to(id).emit('fakinItTask', {
            round: room.currentRound + 1,
            maxRounds: room.maxRounds,
            category: getCategoryName(category),
            task: isFaker ? null : task,
            isFaker: isFaker,
            timeLimit: 15
        });
    });
}

function getCategoryName(category) {
    const names = {
        handsOfTruth: '✋ يد الحقيقة',
        numberPressure: '🔢 ضغط الأرقام',
        textYouUp: '🗣️ قولها بصوتك',
        faceValue: '😀 قيمة الوجه',
        youGottaPoint: '👉 أشر عليه'
    };
    return names[category] || category;
}

function startFakinItVoting(room) {
    room.gameData.votes = {};
    
    io.to(room.code).emit('fakinItVoting', {
        task: room.gameData.task,
        players: room.getPlayerList(),
        timeLimit: 20
    });
}

function calculateFakinItResults(room) {
    const votes = room.gameData.votes || {};
    const fakerId = room.gameData.fakerId;
    const faker = room.players.get(fakerId);
    
    // حساب الأصوات
    const voteCounts = {};
    Object.values(votes).forEach(votedId => {
        voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
    });
    
    // من حصل على أكثر أصوات؟
    let maxVotes = 0;
    let mostVotedId = null;
    Object.entries(voteCounts).forEach(([id, count]) => {
        if (count > maxVotes) {
            maxVotes = count;
            mostVotedId = id;
        }
    });
    
    const caught = mostVotedId === fakerId;
    
    // توزيع النقاط
    if (caught) {
        // المزيّف انكشف - النقاط لمن صوتوا عليه
        Object.entries(votes).forEach(([voterId, votedId]) => {
            if (votedId === fakerId) {
                const voter = room.players.get(voterId);
                if (voter) voter.score += 500;
            }
        });
    } else {
        // المزيّف نجا
        faker.score += 1000;
    }
    
    io.to(room.code).emit('fakinItResults', {
        task: room.gameData.task,
        fakerId: fakerId,
        fakerName: faker.name,
        caught: caught,
        voteCounts: voteCounts,
        players: room.getPlayerList(),
        isLastRound: room.currentRound >= room.maxRounds - 1
    });
}

// ==================== Trivia Murder Party ====================
function startTriviaMurderRound(room) {
    const question = triviaMurderQuestions[Math.floor(Math.random() * triviaMurderQuestions.length)];
    room.gameData.currentQuestion = question;
    room.players.forEach(p => {
        if (p.isAlive) p.currentAnswer = null;
    });
    
    io.to(room.code).emit('triviaMurderQuestion', {
        round: room.currentRound + 1,
        maxRounds: room.maxRounds,
        question: question.q,
        options: question.options,
        alivePlayers: room.getAlivePlayers().map(p => ({ id: p.id, name: p.name, avatar: p.avatar })),
        timeLimit: 20
    });
}

function calculateTriviaMurderResults(room) {
    const question = room.gameData.currentQuestion;
    const results = [];
    const newlyDead = [];
    
    room.players.forEach((player, id) => {
        if (!player.isAlive) return;
        
        const isCorrect = player.currentAnswer === question.correct;
        
        if (isCorrect) {
            player.score += 100;
        } else {
            player.isAlive = false;
            newlyDead.push(player);
        }
        
        results.push({
            playerId: id,
            playerName: player.name,
            avatar: player.avatar,
            answer: question.options[player.currentAnswer],
            isCorrect: isCorrect,
            isAlive: player.isAlive,
            score: player.score
        });
    });
    
    // التحقق من الفائزين
    const alivePlayers = room.getAlivePlayers();
    const isGameOver = alivePlayers.length <= 1 || room.currentRound >= room.maxRounds - 1;
    
    io.to(room.code).emit('triviaMurderResults', {
        question: question.q,
        correctAnswer: question.options[question.correct],
        correctIndex: question.correct,
        results: results,
        newlyDead: newlyDead.map(p => p.name),
        isLastRound: isGameOver
    });
    
    // إذا فيه موتى، نبدأ تحدي الموت
    if (newlyDead.length > 0 && !isGameOver) {
        setTimeout(() => startDeathChallenge(room, newlyDead), 3000);
    }
}

function startDeathChallenge(room, deadPlayers) {
    const challenge = deathChallenges[Math.floor(Math.random() * deathChallenges.length)];
    room.gameData.deathChallenge = challenge;
    room.gameData.deathAnswers = {};
    
    deadPlayers.forEach(player => {
        io.to(player.id).emit('deathChallenge', {
            type: challenge.type,
            question: challenge.q,
            timeLimit: 10
        });
    });
}

function resolveDeathChallenge(room) {
    const challenge = room.gameData.deathChallenge;
    const answers = room.gameData.deathAnswers || {};
    const survivors = [];
    
    Object.entries(answers).forEach(([playerId, answer]) => {
        const player = room.players.get(playerId);
        if (player && answer.toLowerCase().trim() === challenge.answer.toLowerCase()) {
            player.isAlive = true;
            survivors.push(player.name);
        }
    });
    
    io.to(room.code).emit('deathChallengeResults', {
        survivors: survivors,
        correctAnswer: challenge.answer
    });
}

// ==================== Drawful ====================
function startDrawfulRound(room) {
    room.players.forEach((player, id) => {
        const prompt = drawfulPrompts[Math.floor(Math.random() * drawfulPrompts.length)];
        player.currentAnswer = null;
        room.gameData[`prompt_${id}`] = prompt;
        
        io.to(id).emit('drawfulPrompt', {
            round: room.currentRound + 1,
            maxRounds: room.maxRounds,
            prompt: prompt,
            timeLimit: 90
        });
    });
}

function startDrawfulGuessing(room) {
    // اختيار رسمة عشوائية للتخمين
    const players = Array.from(room.players.entries()).filter(([id, p]) => p.currentAnswer);
    if (players.length === 0) {
        room.currentRound++;
        startGameRound(room);
        return;
    }
    
    const [drawerId, drawer] = players[Math.floor(Math.random() * players.length)];
    room.gameData.currentDrawer = drawerId;
    
    io.to(room.code).emit('drawfulGuessing', {
        drawing: drawer.currentAnswer,
        drawerName: drawer.name,
        timeLimit: 45
    });
}

// ==================== End Game ====================
function endGame(room) {
    room.state = 'ended';
    
    const finalResults = room.getPlayerList().sort((a, b) => b.score - a.score);
    
    io.to(room.code).emit('gameEnded', {
        finalResults: finalResults,
        winner: finalResults[0]
    });
}

// ==================== Server Start ====================
const PORT = process.env.PORT || 3000;

function startServer(port) {
    server.listen(port, () => {
        console.log(`
    ╔═══════════════════════════════════════════════╗
    ║                                               ║
    ║     🎮 أبو عابد بوكس V3 - السيرفر            ║
    ║                                               ║
    ║     ✅ السيرفر شغال!                         ║
    ║                                               ║
    ║     افتح المتصفح على:                        ║
    ║     http://localhost:${port}                    ║
    ║                                               ║
    ╚═══════════════════════════════════════════════╝
        `);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ البورت ${port} مشغول، جاري تجربة ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error(err);
        }
    });
}

startServer(PORT);

// تنظيف الغرف القديمة
setInterval(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    rooms.forEach((room, code) => {
        if (room.createdAt < oneHourAgo && room.state === 'lobby') {
            rooms.delete(code);
        }
    });
}, 60 * 60 * 1000);
