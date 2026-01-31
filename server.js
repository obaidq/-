/**
 * أبو عابد بوكس - السيرفر الرئيسي
 * منصة ألعاب جماعية سعودية
 * 
 * التقنيات: Node.js + Express + Socket.IO
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ==================== بيانات الألعاب ====================

// غرف اللعب النشطة
const rooms = new Map();

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
    "ما هو الشي اللي ما تسويه في أول يوم دوام؟",
    "ما هو أسوأ رد على 'كيفك؟'",
    "ما هو الشي اللي يفكر فيه الموظف الساعة 4:59؟",
    "ما هو أغرب سبب للغياب عن المدرسة؟",
    "ما هو الشي اللي ما تقوله في مجلس العزاء؟",
    "ما هو أسوأ اسم لتطبيق توصيل طعام؟",
    "ما هو الشي اللي يسويه السعودي لما يشوف خصم 90%؟",
    "ما هو أغرب شي ممكن تلاقيه في شنطة معلمك؟",
    "ما هو الشي اللي ما تقوله لحماتك؟",
    "ما هو أسوأ مكان للموعد الأول؟",
    "ما هو الشي اللي يفكر فيه الطالب وقت الاختبار؟",
    "ما هو أغرب اسم واي فاي شفته؟",
    "ما هو الشي اللي ما تسويه في المصعد؟",
    "ما هو أسوأ شي ممكن ينكتب على قبرك؟",
    "ما هو الشي اللي يقوله السعودي لما يشوف الحساب في المطعم؟",
    "ما هو أغرب شي ممكن تطلبه من أوبر؟",
    "ما هو أسوأ شعار لشركة طيران؟",
    "ما هو الشي اللي ما تقوله في خطبة الجمعة؟",
    "ما هو أغرب سبب للطلاق؟",
    "ما هو الشي اللي يسويه السعودي أول ما يوصل المطار؟",
    "ما هو أسوأ اسم لمستشفى؟",
    "ما هو الشي اللي ما تكتبه في رسالة واتساب لمديرك؟",
    "ما هو أغرب شي ممكن يكون في قائمة مطعم؟",
    "ما هو الشي اللي يفكر فيه المعلم وهو يصحح؟",
    "ما هو أسوأ شي ممكن تقوله في مقابلة تلفزيونية؟",
    "ما هو الشي اللي ما تسويه في الحرم؟"
];

// أسئلة كشف الكذاب (Fibbage)
const fibbageQuestions = [
    { q: "في عام 2019، اشترت السعودية أكبر _____ في العالم بقيمة 450 مليون دولار.", answer: "لوحة فنية" },
    { q: "أول مطعم ماكدونالدز في السعودية افتتح في مدينة _____.", answer: "الرياض" },
    { q: "الملك عبدالعزيز كان يملك أكثر من _____ سيارة.", answer: "200" },
    { q: "أطول برج في السعودية يبلغ ارتفاعه _____ متر.", answer: "601" },
    { q: "السعودية تستورد _____ من أستراليا سنوياً.", answer: "الجمال" },
    { q: "أول جامعة في السعودية تأسست عام _____.", answer: "1957" },
    { q: "مساحة الربع الخالي تعادل مساحة دولة _____.", answer: "فرنسا" },
    { q: "السعودية فيها أكثر من _____ مليون نخلة.", answer: "30" },
    { q: "أول فيلم سعودي عُرض في السينما كان اسمه _____.", answer: "وجدة" },
    { q: "درجة الحرارة في الرياض وصلت مرة لـ _____ درجة.", answer: "52" },
    { q: "أقدم مدينة في السعودية عمرها أكثر من _____ سنة.", answer: "4000" },
    { q: "السعودية تنتج _____ مليون برميل نفط يومياً.", answer: "10" },
    { q: "أول سيارة دخلت السعودية كانت ماركة _____.", answer: "فورد" },
    { q: "طول الساحل السعودي على البحر الأحمر _____ كيلومتر.", answer: "1800" },
    { q: "أول بنك في السعودية تأسس عام _____.", answer: "1926" },
    { q: "موسم الرياض 2019 استقطب أكثر من _____ مليون زائر.", answer: "15" },
    { q: "أكبر واحة في العالم موجودة في _____ بالسعودية.", answer: "الأحساء" },
    { q: "السعودية فيها أكثر من _____ موقع أثري.", answer: "10000" },
    { q: "أول قطار في السعودية ربط بين _____ والدمام.", answer: "الرياض" },
    { q: "برج الساعة في مكة فيه أكبر _____ في العالم.", answer: "ساعة" }
];

// كلمات الرسم (Drawful)
const drawfulPrompts = [
    "بعير يركب سيارة",
    "شايب يلعب فورتنايت",
    "كبسة طايرة",
    "صقر يشرب قهوة",
    "شماغ على رأس قطة",
    "برج المملكة يرقص",
    "جمل في المول",
    "طفل سعودي في ديزني لاند",
    "مندي يطير في الفضاء",
    "خروف يقود طيارة",
    "شيخ يلعب بلايستيشن",
    "فنجال قهوة عملاق",
    "نخلة تمشي",
    "صحراء تمطر شوكولاتة",
    "بدوي على سكيت بورد",
    "مطعم كبسة على المريخ",
    "حصان يأكل برجر",
    "سيارة جيب تسبح",
    "شماغ يطير",
    "عقال يلعب كرة",
    "فلافل بأجنحة",
    "شاورما تتكلم",
    "قهوة سعودية غاضبة",
    "جمل يتزلج على الثلج",
    "صقر يحمل آيفون",
    "خيمة في الفضاء",
    "بدلة رسمية على جمل",
    "كنافة تبكي",
    "دلة قهوة عملاقة",
    "سعودي في القطب الشمالي"
];

// أسئلة لغز القاتل (Trivia Murder Party)
const triviaQuestions = [
    { q: "ما هي عاصمة المملكة العربية السعودية؟", options: ["الرياض", "جدة", "مكة", "الدمام"], correct: 0 },
    { q: "في أي سنة تأسست المملكة العربية السعودية؟", options: ["1932", "1925", "1945", "1950"], correct: 0 },
    { q: "ما هو أطول برج في السعودية؟", options: ["برج جدة", "برج المملكة", "برج الفيصلية", "برج رافال"], correct: 0 },
    { q: "كم عدد مناطق المملكة العربية السعودية؟", options: ["13", "10", "15", "20"], correct: 0 },
    { q: "ما هي أكبر مدينة سعودية من حيث المساحة؟", options: ["الرياض", "جدة", "مكة", "الدمام"], correct: 0 },
    { q: "متى أُقيمت أول بطولة كأس العالم في السعودية؟", options: ["لم تُقم بعد", "2022", "2018", "2010"], correct: 0 },
    { q: "ما اسم العملة السعودية؟", options: ["الريال", "الدينار", "الدرهم", "الجنيه"], correct: 0 },
    { q: "كم يبلغ عدد سكان السعودية تقريباً؟", options: ["35 مليون", "25 مليون", "45 مليون", "20 مليون"], correct: 0 },
    { q: "ما هو اللون الموجود في علم السعودية؟", options: ["الأخضر", "الأحمر", "الأزرق", "الأصفر"], correct: 0 },
    { q: "أين يقع الربع الخالي؟", options: ["جنوب السعودية", "شمال السعودية", "شرق السعودية", "غرب السعودية"], correct: 0 },
    { q: "ما هي أقدم جامعة سعودية؟", options: ["جامعة الملك سعود", "جامعة الملك فهد", "جامعة أم القرى", "جامعة الملك عبدالعزيز"], correct: 0 },
    { q: "كم عدد مواقع التراث العالمي في السعودية؟", options: ["6", "3", "10", "2"], correct: 0 },
    { q: "ما هو أشهر طبق سعودي؟", options: ["الكبسة", "المندي", "الجريش", "المطازيز"], correct: 0 },
    { q: "متى يُحتفل باليوم الوطني السعودي؟", options: ["23 سبتمبر", "21 سبتمبر", "25 سبتمبر", "1 أكتوبر"], correct: 0 },
    { q: "ما اسم أكبر حقل نفط في السعودية؟", options: ["الغوار", "الشيبة", "خريص", "منيفة"], correct: 0 },
    { q: "كم تبلغ مساحة السعودية تقريباً؟", options: ["2 مليون كم²", "1 مليون كم²", "3 مليون كم²", "500 ألف كم²"], correct: 0 },
    { q: "ما هو المسجد الأكبر في العالم؟", options: ["المسجد الحرام", "المسجد النبوي", "المسجد الأقصى", "مسجد الشيخ زايد"], correct: 0 },
    { q: "كم عدد الملوك الذين حكموا السعودية؟", options: ["7", "5", "10", "3"], correct: 0 },
    { q: "ما هي الرياضة الأكثر شعبية في السعودية؟", options: ["كرة القدم", "كرة السلة", "التنس", "السباحة"], correct: 0 },
    { q: "أين يقع مشروع نيوم؟", options: ["تبوك", "جدة", "الرياض", "الدمام"], correct: 0 }
];

// مشاكل الاختراعات (Patently Stupid)
const patentProblems = [
    "كل ما أبي أنام، جاري يشغل الموسيقى بصوت عالي!",
    "القهوة دايماً تبرد قبل ما أشربها!",
    "ما أقدر أصحى من النوم للفجر!",
    "السيارة دايماً تتسخ بعد ما أغسلها بيوم!",
    "الواي فاي دايماً يفصل وقت المباراة!",
    "ما ألاقي الريموت أبداً!",
    "الأكل دايماً يخلص قبل ما أشبع!",
    "الزحمة كل يوم في طريق الدوام!",
    "الجوال دايماً يخلص شحنه في أهم وقت!",
    "ما أقدر أوقف عن الأكل وأنا أشوف مسلسل!",
    "البعوض دايماً يجي وقت النوم!",
    "الغبار يتجمع على الأثاث بسرعة!",
    "ما أقدر أتذكر وين حطيت مفاتيحي!",
    "الملابس دايماً تنكمش في الغسالة!",
    "المكيف إما برد زيادة أو حر زيادة!"
];

// شعارات التيشيرتات (Tee K.O.)
const tshirtSlogans = [
    "أنا مو كسلان، أنا في وضع توفير الطاقة",
    "البعير ما يشوف سنامه",
    "القهوة قبل الكلام",
    "أكل وأنام وأشتكي من الزحمة",
    "ما أحب الدراما، بس أحب أتفرج عليها",
    "النوم نصف الجمال والكسل النصف الثاني",
    "أنا مو معقد، أنت ما تفهم",
    "الصبر جميل بس أنا مستعجل",
    "لا تحكم علي من أول نظرة، خذ وقتك",
    "أنا ما أكره الناس، بس أحب الوحدة"
];

// ==================== توليد كود الغرفة ====================
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ==================== فئة الغرفة ====================
class GameRoom {
    constructor(hostId, hostName) {
        this.code = generateRoomCode();
        this.hostId = hostId;
        this.players = new Map();
        this.state = 'lobby'; // lobby, playing, voting, results
        this.currentGame = null;
        this.currentRound = 0;
        this.maxRounds = 3;
        this.gameData = {};
        this.createdAt = Date.now();
        
        this.addPlayer(hostId, hostName, true);
    }

    addPlayer(socketId, name, isHost = false) {
        const colors = ['#E91E8C', '#4ECDC4', '#FFD93D', '#6BCB77', '#FF6B35', '#667eea', '#f093fb', '#43e97b'];
        const avatars = ['🧔🏻', '👨🏻', '🧑🏻', '👦🏻', '👴🏻', '🧓🏻', '👱🏻', '🧑🏻‍🦱'];
        
        this.players.set(socketId, {
            id: socketId,
            name: name,
            isHost: isHost,
            score: 0,
            color: colors[this.players.size % colors.length],
            avatar: avatars[this.players.size % avatars.length],
            isReady: false,
            isAlive: true, // للألعاب اللي فيها إقصاء
            answers: [],
            votes: []
        });
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
        
        // إذا المضيف طلع، نختار مضيف جديد
        if (this.hostId === socketId && this.players.size > 0) {
            const newHost = this.players.values().next().value;
            newHost.isHost = true;
            this.hostId = newHost.id;
        }
    }

    getPlayerList() {
        return Array.from(this.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            score: p.score,
            color: p.color,
            avatar: p.avatar,
            isHost: p.isHost,
            isReady: p.isReady,
            isAlive: p.isAlive
        }));
    }

    startGame(gameName) {
        this.currentGame = gameName;
        this.currentRound = 0;
        this.state = 'playing';
        this.gameData = {};
        
        // إعادة تعيين بيانات اللاعبين
        this.players.forEach(p => {
            p.answers = [];
            p.votes = [];
            p.isAlive = true;
        });
    }

    nextRound() {
        this.currentRound++;
        if (this.currentRound > this.maxRounds) {
            return false;
        }
        return true;
    }
}

// ==================== WebSocket Events ====================
io.on('connection', (socket) => {
    console.log(`✅ لاعب جديد اتصل: ${socket.id}`);

    // إنشاء غرفة جديدة
    socket.on('createRoom', (playerName) => {
        const room = new GameRoom(socket.id, playerName);
        rooms.set(room.code, room);
        socket.join(room.code);
        
        socket.emit('roomCreated', {
            code: room.code,
            players: room.getPlayerList()
        });
        
        console.log(`🏠 غرفة جديدة: ${room.code} بواسطة ${playerName}`);
    });

    // الانضمام لغرفة
    socket.on('joinRoom', ({ code, playerName }) => {
        const room = rooms.get(code.toUpperCase());
        
        if (!room) {
            socket.emit('error', { message: 'الغرفة غير موجودة!' });
            return;
        }
        
        if (room.players.size >= 10) {
            socket.emit('error', { message: 'الغرفة ممتلئة!' });
            return;
        }
        
        if (room.state !== 'lobby') {
            socket.emit('error', { message: 'اللعبة بدأت بالفعل!' });
            return;
        }
        
        room.addPlayer(socket.id, playerName);
        socket.join(code.toUpperCase());
        
        socket.emit('roomJoined', {
            code: room.code,
            players: room.getPlayerList()
        });
        
        // إخبار الجميع باللاعب الجديد
        io.to(room.code).emit('playerJoined', {
            players: room.getPlayerList()
        });
        
        console.log(`👤 ${playerName} انضم للغرفة ${room.code}`);
    });

    // تجهيز اللاعب
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
        if (!room) return;
        
        if (socket.id !== room.hostId) {
            socket.emit('error', { message: 'فقط المضيف يقدر يبدأ اللعبة!' });
            return;
        }
        
        if (room.players.size < 2) {
            socket.emit('error', { message: 'تحتاج على الأقل لاعبين!' });
            return;
        }
        
        room.startGame(game);
        
        io.to(code).emit('gameStarted', {
            game: game,
            players: room.getPlayerList()
        });
        
        // بدء الجولة الأولى
        startGameRound(room);
    });

    // ==================== أحداث رد سريع (Quiplash) ====================
    socket.on('submitQuiplashAnswer', ({ code, answer }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'quiplash') return;
        
        const player = room.players.get(socket.id);
        if (player) {
            player.answers.push(answer);
            
            // التحقق إذا كل اللاعبين أجابوا
            const allAnswered = Array.from(room.players.values()).every(p => p.answers.length > room.currentRound);
            
            if (allAnswered) {
                startQuiplashVoting(room);
            } else {
                io.to(code).emit('playerAnswered', { playerId: socket.id });
            }
        }
    });

    socket.on('submitQuiplashVote', ({ code, votedPlayerId }) => {
        const room = rooms.get(code);
        if (!room) return;
        
        const player = room.players.get(socket.id);
        if (player && votedPlayerId !== socket.id) {
            player.votes.push(votedPlayerId);
            
            // التحقق إذا كل اللاعبين صوتوا
            const allVoted = Array.from(room.players.values()).every(p => p.votes.length > room.currentRound);
            
            if (allVoted) {
                calculateQuiplashResults(room);
            }
        }
    });

    // ==================== أحداث كشف الكذاب (Fibbage) ====================
    socket.on('submitFibbageLie', ({ code, lie }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'fibbage') return;
        
        const player = room.players.get(socket.id);
        if (player) {
            if (!room.gameData.lies) room.gameData.lies = {};
            room.gameData.lies[socket.id] = lie;
            
            const allSubmitted = room.players.size === Object.keys(room.gameData.lies).length;
            
            if (allSubmitted) {
                startFibbageVoting(room);
            } else {
                io.to(code).emit('playerSubmitted', { playerId: socket.id });
            }
        }
    });

    socket.on('submitFibbageGuess', ({ code, guessId }) => {
        const room = rooms.get(code);
        if (!room) return;
        
        const player = room.players.get(socket.id);
        if (player) {
            if (!room.gameData.guesses) room.gameData.guesses = {};
            room.gameData.guesses[socket.id] = guessId;
            
            const allGuessed = room.players.size === Object.keys(room.gameData.guesses).length;
            
            if (allGuessed) {
                calculateFibbageResults(room);
            }
        }
    });

    // ==================== أحداث ارسم لي (Drawful) ====================
    socket.on('submitDrawing', ({ code, drawing }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'drawful') return;
        
        const player = room.players.get(socket.id);
        if (player) {
            if (!room.gameData.drawings) room.gameData.drawings = {};
            room.gameData.drawings[socket.id] = drawing;
            
            const allDrawn = room.players.size === Object.keys(room.gameData.drawings).length;
            
            if (allDrawn) {
                startDrawfulGuessing(room);
            } else {
                io.to(code).emit('playerSubmitted', { playerId: socket.id });
            }
        }
    });

    socket.on('submitDrawfulGuess', ({ code, guess }) => {
        const room = rooms.get(code);
        if (!room) return;
        
        const player = room.players.get(socket.id);
        if (player) {
            if (!room.gameData.guesses) room.gameData.guesses = {};
            room.gameData.guesses[socket.id] = guess;
            
            // استثناء الرسام من عدد المطلوب
            const requiredGuesses = room.players.size - 1;
            const currentGuesses = Object.keys(room.gameData.guesses).length;
            
            if (currentGuesses >= requiredGuesses) {
                startDrawfulVoting(room);
            }
        }
    });

    // ==================== أحداث لغز القاتل (Trivia) ====================
    socket.on('submitTriviaAnswer', ({ code, answerIndex }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'trivia') return;
        
        const player = room.players.get(socket.id);
        if (player && player.isAlive) {
            if (!room.gameData.answers) room.gameData.answers = {};
            room.gameData.answers[socket.id] = answerIndex;
            
            const alivePlayers = Array.from(room.players.values()).filter(p => p.isAlive);
            const allAnswered = alivePlayers.length === Object.keys(room.gameData.answers).length;
            
            if (allAnswered) {
                calculateTriviaResults(room);
            } else {
                io.to(code).emit('playerAnswered', { playerId: socket.id });
            }
        }
    });

    // ==================== أحداث حرب التيشيرتات (Tee K.O.) ====================
    socket.on('submitTshirtDesign', ({ code, design }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'teeko') return;
        
        const player = room.players.get(socket.id);
        if (player) {
            if (!room.gameData.designs) room.gameData.designs = {};
            room.gameData.designs[socket.id] = design;
            
            const allDesigned = room.players.size === Object.keys(room.gameData.designs).length;
            
            if (allDesigned) {
                startTeekoVoting(room);
            } else {
                io.to(code).emit('playerSubmitted', { playerId: socket.id });
            }
        }
    });

    socket.on('submitTeekoVote', ({ code, votedDesignId }) => {
        const room = rooms.get(code);
        if (!room) return;
        
        const player = room.players.get(socket.id);
        if (player) {
            if (!room.gameData.votes) room.gameData.votes = {};
            room.gameData.votes[socket.id] = votedDesignId;
            
            const allVoted = room.players.size === Object.keys(room.gameData.votes).length;
            
            if (allVoted) {
                calculateTeekoResults(room);
            }
        }
    });

    // ==================== أحداث كشف الجاسوس (Push The Button) ====================
    socket.on('submitPushAnswer', ({ code, answer }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'push') return;
        
        const player = room.players.get(socket.id);
        if (player) {
            if (!room.gameData.answers) room.gameData.answers = {};
            room.gameData.answers[socket.id] = answer;
            
            const allAnswered = room.players.size === Object.keys(room.gameData.answers).length;
            
            if (allAnswered) {
                revealPushAnswers(room);
            }
        }
    });

    socket.on('accusePlayer', ({ code, accusedId }) => {
        const room = rooms.get(code);
        if (!room) return;
        
        if (!room.gameData.accusations) room.gameData.accusations = {};
        room.gameData.accusations[socket.id] = accusedId;
        
        // التحقق إذا أغلبية اللاعبين اتهموا نفس الشخص
        const accusations = Object.values(room.gameData.accusations);
        const counts = {};
        accusations.forEach(id => counts[id] = (counts[id] || 0) + 1);
        
        const maxAccused = Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a, ['', 0]);
        const majority = Math.ceil(room.players.size / 2);
        
        if (maxAccused[1] >= majority) {
            checkAlienAccusation(room, maxAccused[0]);
        }
    });

    // ==================== أحداث الوحش العاشق (Monster) ====================
    socket.on('sendMonsterMessage', ({ code, toPlayerId, message }) => {
        const room = rooms.get(code);
        if (!room || room.currentGame !== 'monster') return;
        
        const fromPlayer = room.players.get(socket.id);
        const toPlayer = room.players.get(toPlayerId);
        
        if (fromPlayer && toPlayer) {
            // إرسال الرسالة للمستلم
            io.to(toPlayerId).emit('monsterMessageReceived', {
                fromId: socket.id,
                fromName: fromPlayer.name,
                message: message
            });
        }
    });

    socket.on('submitMonsterDate', ({ code, datePlayerId }) => {
        const room = rooms.get(code);
        if (!room) return;
        
        if (!room.gameData.dates) room.gameData.dates = {};
        room.gameData.dates[socket.id] = datePlayerId;
        
        const allChose = room.players.size === Object.keys(room.gameData.dates).length;
        
        if (allChose) {
            calculateMonsterResults(room);
        }
    });

    // ==================== أحداث عامة ====================
    socket.on('requestNextRound', (code) => {
        const room = rooms.get(code);
        if (!room || socket.id !== room.hostId) return;
        
        if (room.nextRound()) {
            startGameRound(room);
        } else {
            endGame(room);
        }
    });

    socket.on('backToLobby', (code) => {
        const room = rooms.get(code);
        if (!room || socket.id !== room.hostId) return;
        
        room.state = 'lobby';
        room.currentGame = null;
        room.currentRound = 0;
        room.gameData = {};
        
        room.players.forEach(p => {
            p.score = 0;
            p.answers = [];
            p.votes = [];
            p.isAlive = true;
        });
        
        io.to(code).emit('returnedToLobby', {
            players: room.getPlayerList()
        });
    });

    // قطع الاتصال
    socket.on('disconnect', () => {
        console.log(`❌ لاعب قطع الاتصال: ${socket.id}`);
        
        // البحث عن الغرفة وإزالة اللاعب
        rooms.forEach((room, code) => {
            if (room.players.has(socket.id)) {
                room.removePlayer(socket.id);
                
                if (room.players.size === 0) {
                    rooms.delete(code);
                    console.log(`🗑️ غرفة ${code} حُذفت`);
                } else {
                    io.to(code).emit('playerLeft', {
                        players: room.getPlayerList()
                    });
                }
            }
        });
    });
});

// ==================== دوال مساعدة للألعاب ====================

function startGameRound(room) {
    room.gameData = {}; // إعادة تعيين بيانات الجولة
    
    switch (room.currentGame) {
        case 'quiplash':
            const question = quiplashQuestions[Math.floor(Math.random() * quiplashQuestions.length)];
            room.gameData.currentQuestion = question;
            io.to(room.code).emit('quiplashQuestion', {
                round: room.currentRound + 1,
                maxRounds: room.maxRounds,
                question: question,
                timeLimit: 45
            });
            break;
            
        case 'fibbage':
            const fibQuestion = fibbageQuestions[Math.floor(Math.random() * fibbageQuestions.length)];
            room.gameData.currentQuestion = fibQuestion;
            io.to(room.code).emit('fibbageQuestion', {
                round: room.currentRound + 1,
                maxRounds: room.maxRounds,
                question: fibQuestion.q,
                timeLimit: 60
            });
            break;
            
        case 'drawful':
            // إعطاء كل لاعب كلمة مختلفة
            const usedPrompts = [];
            room.players.forEach((player, id) => {
                let prompt;
                do {
                    prompt = drawfulPrompts[Math.floor(Math.random() * drawfulPrompts.length)];
                } while (usedPrompts.includes(prompt));
                usedPrompts.push(prompt);
                
                room.gameData[`prompt_${id}`] = prompt;
                io.to(id).emit('drawfulPrompt', {
                    round: room.currentRound + 1,
                    maxRounds: room.maxRounds,
                    prompt: prompt,
                    timeLimit: 90
                });
            });
            break;
            
        case 'trivia':
            const triviaQ = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
            room.gameData.currentQuestion = triviaQ;
            io.to(room.code).emit('triviaQuestion', {
                round: room.currentRound + 1,
                maxRounds: room.maxRounds,
                question: triviaQ.q,
                options: triviaQ.options,
                timeLimit: 20
            });
            break;
            
        case 'teeko':
            // مرحلة الرسم
            io.to(room.code).emit('teekoDrawPhase', {
                round: room.currentRound + 1,
                maxRounds: room.maxRounds,
                slogans: getRandomSlogans(3),
                timeLimit: 90
            });
            break;
            
        case 'push':
            // تعيين الفضائيين
            const playerIds = Array.from(room.players.keys());
            const alienCount = Math.ceil(playerIds.length / 4);
            const aliens = [];
            while (aliens.length < alienCount) {
                const randomId = playerIds[Math.floor(Math.random() * playerIds.length)];
                if (!aliens.includes(randomId)) aliens.push(randomId);
            }
            room.gameData.aliens = aliens;
            
            // إرسال الأدوار
            room.players.forEach((player, id) => {
                const isAlien = aliens.includes(id);
                io.to(id).emit('pushRole', {
                    isAlien: isAlien,
                    alienCount: alienCount
                });
            });
            
            // بدء السؤال
            setTimeout(() => {
                const humanQ = "ما هو أفضل شي في السعودية؟";
                const alienQ = "ما هو أسوأ شي في الفضاء؟";
                room.gameData.humanQuestion = humanQ;
                room.gameData.alienQuestion = alienQ;
                
                room.players.forEach((player, id) => {
                    const isAlien = aliens.includes(id);
                    io.to(id).emit('pushQuestion', {
                        question: isAlien ? alienQ : humanQ,
                        timeLimit: 30
                    });
                });
            }, 5000);
            break;
            
        case 'monster':
            // تعيين قوى الوحوش
            const monsterPowers = ['مصاص دماء', 'ذئب', 'مومياء', 'شبح', 'زومبي', 'ساحر'];
            room.players.forEach((player, id) => {
                player.monsterType = monsterPowers[Math.floor(Math.random() * monsterPowers.length)];
                io.to(id).emit('monsterRole', {
                    monsterType: player.monsterType,
                    players: room.getPlayerList().filter(p => p.id !== id)
                });
            });
            
            io.to(room.code).emit('monsterRoundStart', {
                round: room.currentRound + 1,
                maxRounds: room.maxRounds,
                timeLimit: 120
            });
            break;
            
        case 'patent':
            const problem = patentProblems[Math.floor(Math.random() * patentProblems.length)];
            room.gameData.currentProblem = problem;
            io.to(room.code).emit('patentProblem', {
                round: room.currentRound + 1,
                maxRounds: room.maxRounds,
                problem: problem,
                timeLimit: 120
            });
            break;
            
        case 'job':
            // جمع كلمات من اللاعبين
            io.to(room.code).emit('jobCollectWords', {
                round: room.currentRound + 1,
                maxRounds: room.maxRounds,
                question: "اكتب 5 كلمات عشوائية",
                timeLimit: 30
            });
            break;
            
        case 'survive':
            io.to(room.code).emit('surviveQuestion', {
                round: room.currentRound + 1,
                maxRounds: room.maxRounds,
                question: "ما رأيك في الحياة؟",
                timeLimit: 30
            });
            break;
    }
}

function startQuiplashVoting(room) {
    room.state = 'voting';
    const playerList = Array.from(room.players.values());
    const answers = playerList.map(p => ({
        playerId: p.id,
        playerName: p.name,
        answer: p.answers[room.currentRound]
    }));
    
    // خلط الإجابات
    answers.sort(() => Math.random() - 0.5);
    
    io.to(room.code).emit('quiplashVoting', {
        question: room.gameData.currentQuestion,
        answers: answers,
        timeLimit: 30
    });
}

function calculateQuiplashResults(room) {
    room.state = 'results';
    const votes = {};
    
    room.players.forEach((player, id) => {
        const votedFor = player.votes[room.currentRound];
        if (votedFor) {
            votes[votedFor] = (votes[votedFor] || 0) + 1;
        }
    });
    
    // حساب النقاط
    Object.entries(votes).forEach(([playerId, voteCount]) => {
        const player = room.players.get(playerId);
        if (player) {
            const points = voteCount * 100;
            player.score += points;
        }
    });
    
    const results = Array.from(room.players.values()).map(p => ({
        playerId: p.id,
        playerName: p.name,
        answer: p.answers[room.currentRound],
        votes: votes[p.id] || 0,
        score: p.score
    }));
    
    results.sort((a, b) => b.votes - a.votes);
    
    io.to(room.code).emit('quiplashResults', {
        question: room.gameData.currentQuestion,
        results: results,
        isLastRound: room.currentRound >= room.maxRounds - 1
    });
}

function startFibbageVoting(room) {
    room.state = 'voting';
    const question = room.gameData.currentQuestion;
    const lies = room.gameData.lies;
    
    // جمع كل الخيارات (الأكاذيب + الإجابة الصحيحة)
    const options = [];
    Object.entries(lies).forEach(([playerId, lie]) => {
        options.push({ id: playerId, text: lie, isCorrect: false });
    });
    options.push({ id: 'correct', text: question.answer, isCorrect: true });
    
    // خلط الخيارات
    options.sort(() => Math.random() - 0.5);
    
    io.to(room.code).emit('fibbageVoting', {
        question: question.q,
        options: options,
        timeLimit: 30
    });
}

function calculateFibbageResults(room) {
    room.state = 'results';
    const guesses = room.gameData.guesses;
    const lies = room.gameData.lies;
    const question = room.gameData.currentQuestion;
    
    const results = [];
    
    room.players.forEach((player, id) => {
        const guess = guesses[id];
        let points = 0;
        let gotCorrect = false;
        let fooledCount = 0;
        
        // نقاط للإجابة الصحيحة
        if (guess === 'correct') {
            points += 500;
            gotCorrect = true;
        }
        
        // نقاط لخداع الآخرين
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
            lie: lies[id],
            gotCorrect: gotCorrect,
            fooledCount: fooledCount,
            pointsEarned: points,
            totalScore: player.score
        });
    });
    
    results.sort((a, b) => b.pointsEarned - a.pointsEarned);
    
    io.to(room.code).emit('fibbageResults', {
        question: question.q,
        correctAnswer: question.answer,
        results: results,
        isLastRound: room.currentRound >= room.maxRounds - 1
    });
}

function startDrawfulGuessing(room) {
    // اختيار رسمة للتخمين
    const drawings = room.gameData.drawings;
    const drawingIds = Object.keys(drawings);
    const currentDrawerId = drawingIds[room.currentRound % drawingIds.length];
    
    room.gameData.currentDrawer = currentDrawerId;
    
    const drawer = room.players.get(currentDrawerId);
    
    io.to(room.code).emit('drawfulGuessing', {
        drawing: drawings[currentDrawerId],
        drawerName: drawer.name,
        timeLimit: 45
    });
}

function startDrawfulVoting(room) {
    const guesses = room.gameData.guesses;
    const currentDrawerId = room.gameData.currentDrawer;
    const correctPrompt = room.gameData[`prompt_${currentDrawerId}`];
    
    const options = [];
    Object.entries(guesses).forEach(([playerId, guess]) => {
        if (playerId !== currentDrawerId) {
            options.push({ id: playerId, text: guess, isCorrect: false });
        }
    });
    options.push({ id: 'correct', text: correctPrompt, isCorrect: true });
    options.sort(() => Math.random() - 0.5);
    
    io.to(room.code).emit('drawfulVoting', {
        options: options,
        timeLimit: 30
    });
}

function calculateTriviaResults(room) {
    room.state = 'results';
    const answers = room.gameData.answers;
    const question = room.gameData.currentQuestion;
    
    const results = [];
    
    room.players.forEach((player, id) => {
        if (!player.isAlive) return;
        
        const answer = answers[id];
        const isCorrect = answer === question.correct;
        
        if (isCorrect) {
            player.score += 100;
        } else {
            player.isAlive = false;
        }
        
        results.push({
            playerId: id,
            playerName: player.name,
            answer: question.options[answer],
            isCorrect: isCorrect,
            isAlive: player.isAlive,
            score: player.score
        });
    });
    
    io.to(room.code).emit('triviaResults', {
        question: question.q,
        correctAnswer: question.options[question.correct],
        results: results,
        isLastRound: room.currentRound >= room.maxRounds - 1 || results.filter(r => r.isAlive).length <= 1
    });
}

function startTeekoVoting(room) {
    room.state = 'voting';
    const designs = room.gameData.designs;
    const designList = Object.entries(designs).map(([id, design]) => ({
        playerId: id,
        playerName: room.players.get(id).name,
        ...design
    }));
    
    // معارك عشوائية
    designList.sort(() => Math.random() - 0.5);
    
    if (designList.length >= 2) {
        io.to(room.code).emit('teekoVoting', {
            design1: designList[0],
            design2: designList[1],
            timeLimit: 15
        });
    }
}

function calculateTeekoResults(room) {
    room.state = 'results';
    const votes = room.gameData.votes;
    
    const voteCount = {};
    Object.values(votes).forEach(votedId => {
        voteCount[votedId] = (voteCount[votedId] || 0) + 1;
    });
    
    // إعطاء نقاط للفائز
    const winnerId = Object.entries(voteCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (winnerId) {
        const winner = room.players.get(winnerId);
        if (winner) winner.score += 500;
    }
    
    io.to(room.code).emit('teekoResults', {
        winnerId: winnerId,
        voteCount: voteCount,
        players: room.getPlayerList(),
        isLastRound: room.currentRound >= room.maxRounds - 1
    });
}

function revealPushAnswers(room) {
    const answers = room.gameData.answers;
    const aliens = room.gameData.aliens;
    
    const answerList = Object.entries(answers).map(([id, answer]) => ({
        playerId: id,
        playerName: room.players.get(id).name,
        answer: answer,
        isAlien: aliens.includes(id)
    }));
    
    io.to(room.code).emit('pushAnswersRevealed', {
        humanQuestion: room.gameData.humanQuestion,
        alienQuestion: room.gameData.alienQuestion,
        answers: answerList.map(a => ({ ...a, isAlien: undefined })) // لا نكشف الفضائيين بعد
    });
}

function checkAlienAccusation(room, accusedId) {
    const isAlien = room.gameData.aliens.includes(accusedId);
    const accusedPlayer = room.players.get(accusedId);
    
    if (isAlien) {
        // البشر فازوا
        room.players.forEach((p, id) => {
            if (!room.gameData.aliens.includes(id)) {
                p.score += 500;
            }
        });
    } else {
        // الفضائيون فازوا
        room.gameData.aliens.forEach(alienId => {
            const alien = room.players.get(alienId);
            if (alien) alien.score += 500;
        });
    }
    
    io.to(room.code).emit('pushResults', {
        accusedId: accusedId,
        accusedName: accusedPlayer.name,
        wasAlien: isAlien,
        aliens: room.gameData.aliens,
        players: room.getPlayerList()
    });
}

function calculateMonsterResults(room) {
    room.state = 'results';
    const dates = room.gameData.dates;
    
    // حساب المواعيد المتبادلة
    const matches = [];
    const processed = new Set();
    
    Object.entries(dates).forEach(([playerId, dateId]) => {
        if (processed.has(playerId)) return;
        
        if (dates[dateId] === playerId) {
            // موعد متبادل!
            matches.push([playerId, dateId]);
            const p1 = room.players.get(playerId);
            const p2 = room.players.get(dateId);
            if (p1) p1.score += 200;
            if (p2) p2.score += 200;
        }
        
        processed.add(playerId);
        processed.add(dateId);
    });
    
    io.to(room.code).emit('monsterResults', {
        dates: dates,
        matches: matches,
        players: room.getPlayerList(),
        isLastRound: room.currentRound >= room.maxRounds - 1
    });
}

function getRandomSlogans(count) {
    const shuffled = [...tshirtSlogans].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function endGame(room) {
    room.state = 'ended';
    
    const finalResults = room.getPlayerList().sort((a, b) => b.score - a.score);
    
    io.to(room.code).emit('gameEnded', {
        finalResults: finalResults,
        winner: finalResults[0]
    });
}

// ==================== API Routes ====================
app.get('/api/rooms/:code', (req, res) => {
    const room = rooms.get(req.params.code.toUpperCase());
    if (room) {
        res.json({
            code: room.code,
            players: room.getPlayerList(),
            state: room.state,
            currentGame: room.currentGame
        });
    } else {
        res.status(404).json({ error: 'الغرفة غير موجودة' });
    }
});

// تنظيف الغرف القديمة كل ساعة
setInterval(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    rooms.forEach((room, code) => {
        if (room.createdAt < oneHourAgo && room.state === 'lobby') {
            rooms.delete(code);
            console.log(`🧹 تنظيف غرفة قديمة: ${code}`);
        }
    });
}, 60 * 60 * 1000);

// ==================== Start Server ====================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║                                          ║
    ║     🎮 أبو عابد بوكس - السيرفر          ║
    ║                                          ║
    ║     الرابط: http://localhost:${PORT}        ║
    ║                                          ║
    ╚══════════════════════════════════════════╝
    `);
});
