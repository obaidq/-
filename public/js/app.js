/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║              أبو عابد بوكس - التطبيق الرئيسي V5                ║
 * ║         Abu Abed Box - Client Application Engine                 ║
 * ║              Socket.IO + Canvas Drawing + 6 Games                ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════
// الثوابت والبيانات الوصفية
// ═══════════════════════════════════════════════════════════════════

const TIPS = [
  "الكذب في اللعب... فن 🎭",
  "الأمانة مو دايم مطلوبة!",
  "القهوة قبل اللعب... واجب ☕",
  "الضيف أولاً... بس مو بالنقاط!",
  "خلك ذكي... أو مضحك... أو الاثنين!",
  "اللي يضحك أكثر يفوز... أحياناً",
  "الكبسة حلوة... بس النقاط أحلى",
  "الصبر مفتاح الفوز... والقهوة مفتاح الصبر",
  "خليك سعودي وارفع راسك 🇸🇦",
  "لا تصدق كل اللي يقولونه!"
];

const GAMES = {
  quiplash:     { icon: '⚡', name: 'رد سريع',      hint: 'اكتب أطرف إجابة!',      pattern: 'pattern-stage' },
  guesspionage: { icon: '📊', name: 'خمّن النسبة',   hint: 'خمّن النسبة الصحيحة!',   pattern: 'pattern-matrix' },
  fakinit:      { icon: '🕵️', name: 'المزيّف',       hint: 'اكتشف المزيّف!',         pattern: 'pattern-deception' },
  triviamurder: { icon: '💀', name: 'حفلة القاتل',   hint: 'أجب صح أو مت!',          pattern: 'pattern-blood' },
  fibbage:      { icon: '🎭', name: 'كشف الكذاب',    hint: 'اكتب كذبة مقنعة!',       pattern: 'pattern-newspaper' },
  drawful:      { icon: '🎨', name: 'ارسم لي',       hint: 'ارسم الكلمة!',           pattern: 'pattern-paint' }
};

const DRAW_COLORS = ['#000000', '#ff0000', '#0066ff', '#00aa00', '#ff8800', '#9900cc', '#ff69b4', '#8B4513', '#FFD700', '#00CED1', '#808080', '#ffffff'];
const DRAW_SIZES = [4, 8, 16];

// ═══════════════════════════════════════════════════════════════════
// الأداة المساعدة: حماية XSS
// ═══════════════════════════════════════════════════════════════════

function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════════════
// التطبيق الرئيسي
// ═══════════════════════════════════════════════════════════════════

const App = {
  socket: null,
  currentRoom: null,
  isHost: false,
  gameTimer: null,
  currentGame: null,
  myId: null,

  // حالة الرسم (Drawful)
  canvas: null,
  ctx: null,
  isDrawing: false,
  currentColor: '#000000',
  currentSize: 8,
  strokes: [],
  currentStroke: null,

  // حالة الإيموجي والإعدادات
  lastEmojiTime: 0,
  reducedMotion: false,

  // ─────────────────────────────────────────────
  // التهيئة
  // ─────────────────────────────────────────────
  // حالة الإرسال (منع الإرسال المزدوج)
  _submitting: false,

  // مرجع Canvas listeners (لمنع التراكم)
  _canvasHandlers: null,

  // حالة الاتصال
  _connectionState: 'connected',

  init() {
    this.socket = io();
    this.myId = this.socket.id;
    this.setupSocketEvents();

    // تهيئة نظام الصوت
    if (typeof AudioEngine !== 'undefined') {
      AudioEngine.init();
      const resumeAudio = () => {
        AudioEngine.resume();
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
      };
      document.addEventListener('click', resumeAudio);
      document.addEventListener('touchstart', resumeAudio);
    }

    // تحميل إعدادات من localStorage
    this.reducedMotion = localStorage.getItem('reducedMotion') === 'true';
    if (this.reducedMotion) {
      document.getElementById('reducedMotion')?.setAttribute('checked', 'checked');
    }

    // نصيحة عشوائية
    const tipEl = document.getElementById('bootTip');
    if (tipEl) tipEl.textContent = '💡 ' + TIPS[Math.floor(Math.random() * TIPS.length)];

    // عرض القائمة بعد التحميل
    setTimeout(() => this.showScreen('menuScreen'), 2500);

    // Enter key handlers
    ['hostNameInput', 'playerNameInput'].forEach(id => {
      document.getElementById(id)?.addEventListener('keypress', e => {
        if (e.key === 'Enter') id === 'hostNameInput' ? this.createRoom() : this.joinRoom();
      });
    });
    document.getElementById('roomCodeInput')?.addEventListener('keypress', e => {
      if (e.key === 'Enter') this.joinRoom();
    });

    // ── Event Delegation لمحتوى اللعبة (بدلاً من inline onclick مع بيانات مستخدم) ──
    document.getElementById('gameContent')?.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.getAttribute('data-action');
      const id = target.getAttribute('data-id');
      switch (action) {
        case 'voteAnswer': this.voteAnswer(id, target); break;
        case 'votePlayer': this.votePlayer(id, target); break;
        case 'guessFibbage': this.guessFibbage(id, target); break;
        case 'submitTriviaAnswer': this.submitTriviaAnswer(parseInt(id), target); break;
      }
    });

    // ── Escape لإغلاق الإعدادات ──
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('settingsModal');
        if (modal && !modal.classList.contains('hidden')) {
          this.toggleSettings();
        }
      }
    });
  },

  // ─────────────────────────────────────────────
  // أحداث Socket.IO
  // ─────────────────────────────────────────────
  setupSocketEvents() {
    const s = this.socket;

    s.on('connect', () => {
      this.myId = s.id;
      this._updateConnectionState('connected');
    });

    s.on('disconnect', () => {
      this._updateConnectionState('disconnected');
    });

    s.on('reconnect', () => {
      this._updateConnectionState('connected');
      this.showToast('تم إعادة الاتصال!', 'success');
    });

    s.on('connect_error', () => {
      this._updateConnectionState('reconnecting');
    });

    // ── الغرفة ──
    s.on('roomCreated', data => {
      this.currentRoom = data.code;
      this.isHost = true;
      document.getElementById('displayRoomCode').textContent = data.code;
      this.updatePlayers(data.players);
      this.showScreen('lobbyScreen');
      this.updateHostUI();
      this.showToast('تم إنشاء الغرفة!', 'success');
      AudioEngine.playerJoin();
    });

    s.on('roomJoined', data => {
      this.currentRoom = data.code;
      document.getElementById('displayRoomCode').textContent = data.code;
      this.updatePlayers(data.players);
      this.showScreen('lobbyScreen');
      this.updateHostUI();
      this.showToast('انضممت للغرفة!', 'success');
      AudioEngine.playerJoin();
    });

    s.on('playerJoined', data => {
      this.updatePlayers(data.players);
      if (data.newPlayer) this.showToast(escapeHtml(data.newPlayer) + ' انضم!', 'success');
      AudioEngine.playerJoin();
    });

    s.on('playerLeft', data => {
      this.updatePlayers(data.players);
      const me = data.players.find(p => p.id === this.myId);
      if (me?.isHost) { this.isHost = true; this.updateHostUI(); }
      if (data.leftPlayer) this.showToast(escapeHtml(data.leftPlayer) + ' طلع', 'error');
      AudioEngine.playerLeave();
    });

    s.on('playerUpdated', data => this.updatePlayers(data.players));
    s.on('error', data => this.showToast(data.message, 'error'));

    // ── بدء اللعبة ──
    s.on('gameStarted', data => {
      this.currentGame = data.game;
      this.setTheme(data.game);
      this.updateGameHeader(data.game);
      AudioEngine.gameStart();
      AudioEngine.startMusic(data.game);
      // عد تنازلي ثم عرض شاشة اللعبة
      this.showCountdown(() => {
        this.showScreen('gameScreen');
        document.getElementById('emojiBar')?.classList.remove('hidden');
      });
    });

    // ── إجابات وتصويتات ──
    s.on('playerAnswered', data => this.updateWaitingCount(data.count, data.total));
    s.on('playerVoted', data => this.updateWaitingCount(data.count, data.total, 'صوّتوا'));

    // ── رد سريع (Quiplash) ──
    s.on('quiplashQuestion', data => this.handleQuiplashQuestion(data));
    s.on('quiplashVoting', data => this.handleQuiplashVoting(data));
    s.on('quiplashMatchupResult', data => {
      const hasQuiplash = data.results?.some(r => r.quiplash);
      if (hasQuiplash) AudioEngine.quiplash(); else AudioEngine.reveal();
      this.handleQuiplashMatchupResult(data);
    });

    // ── خمّن النسبة (Guesspionage) ──
    s.on('guesspionageQuestion', data => this.handleGuesspionageQuestion(data));

    // ── المزيّف (Fakin' It) ──
    s.on('fakinItTask', data => this.handleFakinItTask(data));
    s.on('fakinItVoting', data => this.handleFakinItVoting(data));

    // ── حفلة القاتل (Trivia Murder) ──
    s.on('triviaMurderQuestion', data => this.handleTriviaMurderQuestion(data));
    s.on('triviaMurderResults', data => {
      if (data.newlyDead && data.newlyDead.length > 0) AudioEngine.death(); else AudioEngine.correct();
      this.handleTriviaMurderResults(data);
    });
    s.on('deathChallenge', data => this.handleDeathChallenge(data));
    s.on('deathChallengeStarted', data => this.handleDeathChallengeStarted(data));
    s.on('deathChallengeResult', data => {
      if (data.revived && data.revived.length > 0) AudioEngine.revive(); else AudioEngine.death();
      this.handleDeathChallengeResult(data);
    });

    // ── كشف الكذاب (Fibbage) ──
    s.on('fibbageQuestion', data => this.handleFibbageQuestion(data));
    s.on('fibbageVoting', data => this.handleFibbageVoting(data));

    // ── ارسم لي (Drawful) ──
    s.on('drawfulYourTurn', data => this.handleDrawfulYourTurn(data));
    s.on('drawfulWaiting', data => this.handleDrawfulWaiting(data));
    s.on('drawfulGuessing', data => this.handleDrawfulGuessing(data));
    s.on('drawfulVoting', data => this.handleDrawfulVoting(data));

    // ── النتائج ──
    s.on('roundResults', data => { AudioEngine.reveal(); this.handleRoundResults(data); });
    s.on('gameEnded', data => {
      AudioEngine.stopMusic();
      AudioEngine.drumRoll(2);
      setTimeout(() => { AudioEngine.victory(); AudioEngine.applause(); }, 2000);
      this.handleGameEnded(data);
    });

    // ── الإيموجي ──
    s.on('emojiReaction', data => this.showEmojiFloat(data.emoji));

    // ── الرجوع والإلغاء ──
    s.on('returnedToLobby', data => {
      this.setTheme('hub');
      AudioEngine.stopMusic();
      this.updatePlayers(data.players);
      this.showScreen('lobbyScreen');
      this.showToast('رجعنا للوبي!', 'success');
      document.getElementById('emojiBar')?.classList.add('hidden');
    });

    s.on('gameCancelled', data => {
      this.setTheme('hub');
      AudioEngine.stopMusic();
      this.updatePlayers(data.players);
      this.showScreen('lobbyScreen');
      this.showToast(data.message, 'error');
      document.getElementById('emojiBar')?.classList.add('hidden');
    });

    s.on('roomExpired', data => {
      this.showToast(data.message, 'error');
      setTimeout(() => location.reload(), 2000);
    });

    s.on('serverShutdown', data => {
      this.showToast(data.message, 'error');
    });
  },

  // ═══════════════════════════════════════════════════════════════
  // إدارة الشاشات والثيمات
  // ═══════════════════════════════════════════════════════════════

  showScreen(id) {
    // تنظيف confetti عند تبديل الشاشات
    document.querySelectorAll('.confetti-particle').forEach(el => el.remove());
    // إعادة تعيين حالة الإرسال
    this._submitting = false;
    // مسح مؤقت اللعبة عند مغادرة شاشة اللعبة
    if (this.gameTimer && id !== 'gameScreen') {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('is-active'));
    const screen = document.getElementById(id);
    if (screen) {
      screen.classList.add('is-active');
      AudioEngine.whoosh();
      // إدارة Focus: نركّز على أول عنصر تفاعلي
      const focusable = screen.querySelector('input, button, [tabindex]');
      if (focusable) setTimeout(() => focusable.focus(), 100);
    }
  },

  setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const bg = document.querySelector('.bg__pattern');
    if (bg) {
      bg.className = 'bg__pattern';
      const game = GAMES[theme];
      bg.classList.add(game ? game.pattern : (theme === 'victory' ? 'pattern-confetti' : 'pattern-rays'));
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // إجراءات الغرفة
  // ═══════════════════════════════════════════════════════════════

  createRoom() {
    const name = document.getElementById('hostNameInput').value.trim();
    if (!name) return this.showToast('أدخل اسمك!', 'error');
    AudioEngine.click();
    this.socket.emit('createRoom', name);
  },

  joinRoom() {
    const code = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    const name = document.getElementById('playerNameInput').value.trim();
    if (!code || code.length !== 4) return this.showToast('كود خاطئ!', 'error');
    if (!name) return this.showToast('أدخل اسمك!', 'error');
    AudioEngine.click();
    this.socket.emit('joinRoom', { code, playerName: name });
  },

  toggleReady() {
    AudioEngine.click();
    this.socket.emit('playerReady', this.currentRoom);
  },

  selectGame(game) {
    if (!this.isHost) return this.showToast('المضيف فقط!', 'error');
    AudioEngine.click();
    this.socket.emit('startGame', { code: this.currentRoom, game });
  },

  backToLobby() {
    this.socket.emit('backToLobby', this.currentRoom);
  },

  shareRoom() {
    const code = this.currentRoom;
    if (!code) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.showToast('تم نسخ الكود: ' + code, 'success');
      });
    } else {
      this.showToast('الكود: ' + code, 'success');
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // عرض اللاعبين
  // ═══════════════════════════════════════════════════════════════

  updatePlayers(players) {
    document.getElementById('playerCount').textContent = players.length;
    const grid = document.getElementById('playersGrid');
    if (!grid) return;

    const existingIds = new Set();

    players.forEach(p => {
      existingIds.add(p.id);
      let el = grid.querySelector('[data-player-id="' + p.id + '"]');

      if (!el) {
        // إنشاء عنصر جديد
        el = document.createElement('div');
        el.dataset.playerId = p.id;
        el.className = 'player-avatar';

        const face = document.createElement('div');
        face.className = 'player-avatar__face';
        face.style.background = p.color;
        face.appendChild(document.createTextNode(p.avatar));
        el._face = face;

        const crown = document.createElement('span');
        crown.className = 'player-avatar__crown';
        crown.textContent = '👑';
        crown.style.display = 'none';
        face.appendChild(crown);
        el._crown = crown;

        const skull = document.createElement('span');
        skull.style.cssText = 'position:absolute;font-size:32px;display:none';
        skull.textContent = '💀';
        face.appendChild(skull);
        el._skull = skull;

        el.appendChild(face);

        const name = document.createElement('span');
        name.className = 'player-avatar__name';
        el.appendChild(name);
        el._name = name;

        const score = document.createElement('span');
        score.className = 'player-avatar__score';
        el.appendChild(score);
        el._score = score;

        grid.appendChild(el);
      }

      // تحديث الحالات
      el.className = 'player-avatar' + (p.isReady ? ' player-avatar--ready' : '') + (!p.isAlive ? ' player-avatar--dead' : '');
      el.setAttribute('aria-label', p.name + (p.isReady ? ' - جاهز' : '') + (!p.isAlive ? ' - ميت' : ''));
      el._crown.style.display = p.isHost ? '' : 'none';
      el._skull.style.display = !p.isAlive ? '' : 'none';
      el._name.textContent = p.name + (p.isReady ? ' ✓' : '');
      el._score.textContent = p.score + ' نقطة';
    });

    // حذف اللاعبين اللي طلعوا
    grid.querySelectorAll('[data-player-id]').forEach(el => {
      if (!existingIds.has(el.dataset.playerId)) el.remove();
    });
  },

  updateHostUI() {
    const gamesSection = document.getElementById('gamesSection');
    const waitingMessage = document.getElementById('waitingMessage');
    if (gamesSection) gamesSection.style.display = this.isHost ? 'block' : 'none';
    if (waitingMessage) waitingMessage.style.display = this.isHost ? 'none' : 'block';
  },

  // ═══════════════════════════════════════════════════════════════
  // عنوان اللعبة والمؤقت
  // ═══════════════════════════════════════════════════════════════

  updateGameHeader(game) {
    const info = GAMES[game] || GAMES.quiplash;
    document.getElementById('gameTitle').textContent = info.icon + ' ' + info.name;
    document.getElementById('gameHint').textContent = '💡 ' + info.hint;
  },

  startTimer(sec) {
    let t = sec;
    const el = document.getElementById('gameTimer');
    if (!el) return;
    el.textContent = t;
    el.className = 'game-timer';
    if (this.gameTimer) clearInterval(this.gameTimer);
    this.gameTimer = setInterval(() => {
      t--;
      el.textContent = Math.max(0, t);
      if (t <= 10) { el.classList.add('game-timer--warning'); AudioEngine.tick(); }
      if (t <= 5) { el.classList.remove('game-timer--warning'); el.classList.add('game-timer--danger'); AudioEngine.tickUrgent(); }
      if (t <= 0) { clearInterval(this.gameTimer); AudioEngine.timesUp(); }
    }, 1000);
  },

  showWaiting(msg) {
    const gc = document.getElementById('gameContent');
    if (gc) gc.innerHTML =
      '<div class="text-center">' +
        '<div class="spinner mb-4"></div>' +
        '<p class="text-2xl font-bold">' + escapeHtml(msg) + '</p>' +
        '<p class="text-muted mt-2" id="waitingCount">ننتظر...</p>' +
      '</div>';
  },

  updateWaitingCount(count, total, label) {
    const el = document.getElementById('waitingCount');
    if (el) el.textContent = count + ' من ' + total + ' ' + (label || 'أجابوا');
    const ac = document.getElementById('answeredCount');
    if (ac) {
      ac.style.display = 'block';
      ac.textContent = count + '/' + total;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // ⚡ رد سريع (Quiplash)
  // ═══════════════════════════════════════════════════════════════

  handleQuiplashQuestion(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    this.startTimer(d.timeLimit);
    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:600px;width:100%">' +
        '<div class="badge badge--primary mb-4">السؤال ' + d.round + '</div>' +
        '<p class="text-2xl font-bold mb-6">' + escapeHtml(d.question) + '</p>' +
        '<input type="text" class="input mb-4" id="answerInput" placeholder="إجابتك..." maxlength="100">' +
        '<button class="btn btn--primary btn--full" onclick="App.submitAnswer()">إرسال ⚡</button>' +
      '</div>';
    document.getElementById('answerInput')?.focus();
  },

  handleQuiplashVoting(d) {
    document.getElementById('gameRound').textContent = 'مواجهة ' + d.matchupNumber + ' من ' + d.totalMatchups;
    this.startTimer(d.timeLimit);
    const answers = d.answers.map(a =>
      '<div class="vote-option" data-action="voteAnswer" data-id="' + escapeHtml(a.playerId) + '">' +
        '<div class="vote-option__text">"' + escapeHtml(a.answer) + '"</div>' +
      '</div>'
    ).join('<div class="text-3xl font-black text-accent" style="margin:12px 0">VS</div>');

    document.getElementById('gameContent').innerHTML =
      '<div style="max-width:800px;width:100%">' +
        '<p class="text-xl text-center mb-2">' + escapeHtml(d.question) + '</p>' +
        '<h3 class="text-2xl font-bold text-center text-accent mb-6">🗳️ صوّت!</h3>' +
        '<div class="flex flex-col items-center gap-2">' + answers + '</div>' +
        '<p class="text-muted text-center mt-4" id="waitingCount"></p>' +
      '</div>';
  },

  handleQuiplashMatchupResult(d) {
    clearInterval(this.gameTimer);
    const results = d.results.sort((a, b) => b.votes - a.votes);
    const winner = results[0];
    const loser = results[1];

    let html = '<div class="text-center" style="max-width:600px">';

    if (winner && winner.quiplash) {
      html += '<div class="text-4xl font-black mb-4" style="color:#FFD93D;text-shadow:0 0 20px rgba(255,217,61,0.5)">⚡ QUIPLASH! ⚡</div>';
    }

    results.forEach((r, i) => {
      const isWinner = i === 0 && r.votes > (results[1]?.votes || 0);
      html +=
        '<div class="panel mb-4" style="' + (isWinner ? 'border-color:#FFD93D;box-shadow:0 0 20px rgba(255,217,61,0.3)' : 'opacity:0.7') + '">' +
          '<p class="text-xl font-bold">"' + escapeHtml(r.answer) + '"</p>' +
          '<p class="text-muted mt-1">' + escapeHtml(r.playerName) + '</p>' +
          '<p class="text-lg font-bold mt-2" style="color:#FFD93D">' + r.votes + ' صوت • +' + r.points + '</p>' +
        '</div>';
    });

    html += '</div>';
    document.getElementById('gameContent').innerHTML = html;
  },

  // ═══════════════════════════════════════════════════════════════
  // 📊 خمّن النسبة (Guesspionage)
  // ═══════════════════════════════════════════════════════════════

  handleGuesspionageQuestion(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    this.startTimer(d.timeLimit);
    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:600px;width:100%">' +
        '<div class="badge badge--info mb-4">📊 خمّن</div>' +
        '<p class="text-2xl font-bold mb-6">' + escapeHtml(d.question) + '</p>' +
        '<div class="text-center">' +
          '<div class="percent-display mb-4" id="percentDisplay">50%</div>' +
          '<input type="range" class="slider-track" id="percentSlider" min="0" max="100" value="50" ' +
            'oninput="document.getElementById(\'percentDisplay\').textContent=this.value+\'%\'">' +
          '<button class="btn btn--primary btn--full mt-6" onclick="App.submitGuess()">تأكيد 📊</button>' +
        '</div>' +
      '</div>';
  },

  submitGuess() {
    if (this._submitting) return;
    const val = document.getElementById('percentSlider')?.value;
    if (val === undefined) return;
    this._submitting = true;
    AudioEngine.submit();
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: val });
    this.showWaiting('ننتظر التخمينات...');
  },

  // ═══════════════════════════════════════════════════════════════
  // 🕵️ المزيّف (Fakin' It)
  // ═══════════════════════════════════════════════════════════════

  handleFakinItTask(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    this.startTimer(d.timeLimit);
    let html;
    if (d.isFaker) {
      html =
        '<div class="panel" style="max-width:600px;background:linear-gradient(135deg,#8B0000,#4a0000)">' +
          '<div class="badge badge--error mb-4">🕵️ أنت المزيّف!</div>' +
          '<p class="text-2xl font-bold mb-4">ما تعرف المهمة!</p>' +
          '<p class="text-muted">حاول تتصرف طبيعي وما ينكشف أمرك!</p>' +
          '<button class="btn btn--secondary btn--full mt-6" onclick="App.submitFakinAction()">جاهز! 🎭</button>' +
        '</div>';
    } else {
      html =
        '<div class="panel" style="max-width:600px">' +
          '<div class="badge badge--warning mb-4">' + escapeHtml(d.category) + '</div>' +
          '<p class="text-sm text-muted mb-2">' + escapeHtml(d.instruction) + '</p>' +
          '<p class="text-2xl font-bold mb-6">' + escapeHtml(d.task) + '</p>' +
          '<button class="btn btn--primary btn--full" onclick="App.submitFakinAction()">جاهز! ✅</button>' +
        '</div>';
    }
    document.getElementById('gameContent').innerHTML = html;
  },

  submitFakinAction() {
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: 'done' });
    this.showWaiting('ننتظر الجميع...');
  },

  handleFakinItVoting(d) {
    this.startTimer(d.timeLimit);
    const players = d.players.map(p =>
      '<div class="player-avatar" style="cursor:pointer" data-action="votePlayer" data-id="' + escapeHtml(p.id) + '">' +
        '<div class="player-avatar__face" style="background:' + escapeHtml(p.color) + '">' + escapeHtml(p.avatar) + '</div>' +
        '<span class="player-avatar__name">' + escapeHtml(p.name) + '</span>' +
      '</div>'
    ).join('');

    document.getElementById('gameContent').innerHTML =
      '<div class="text-center" style="max-width:800px">' +
        '<p class="text-xl mb-2">المهمة كانت:</p>' +
        '<p class="text-2xl font-bold text-accent mb-6">"' + escapeHtml(d.task) + '"</p>' +
        '<h3 class="text-2xl font-bold mb-4">🕵️ من المزيّف؟</h3>' +
        '<div class="players-area">' + players + '</div>' +
        '<p class="text-muted mt-4" id="waitingCount"></p>' +
      '</div>';
  },

  votePlayer(id, el) {
    document.querySelectorAll('.player-avatar').forEach(c => c.style.borderColor = 'transparent');
    el.style.borderColor = '#00e676';
    AudioEngine.vote();
    this.socket.emit('submitVote', { code: this.currentRoom, voteId: id });
  },

  // ═══════════════════════════════════════════════════════════════
  // 💀 حفلة القاتل (Trivia Murder Party)
  // ═══════════════════════════════════════════════════════════════

  handleTriviaMurderQuestion(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    this.startTimer(d.timeLimit);
    const opts = d.options.map((o, i) =>
      '<button class="btn btn--secondary btn--full" data-action="submitTriviaAnswer" data-id="' + i + '">' + escapeHtml(o) + '</button>'
    ).join('');

    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:600px">' +
        '<div class="badge badge--error mb-4">💀 أجب أو مت!</div>' +
        '<p class="text-2xl font-bold mb-6">' + escapeHtml(d.question) + '</p>' +
        '<div class="flex flex-col gap-3">' + opts + '</div>' +
      '</div>';
  },

  submitTriviaAnswer(i, btn) {
    document.querySelectorAll('#gameContent .btn--secondary').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
    btn.style.opacity = '1';
    btn.style.borderColor = '#FFD93D';
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: i });
  },

  handleTriviaMurderResults(d) {
    clearInterval(this.gameTimer);
    let html = '<div class="text-center" style="max-width:600px">';
    html += '<div class="text-2xl text-accent mb-4">✅ ' + escapeHtml(d.correctAnswer) + '</div>';

    if (d.newlyDead.length > 0) {
      html += '<div class="death-panel mt-4 mb-4">';
      html += '<p class="text-xl font-bold mb-2">💀 ماتوا!</p>';
      html += '<p class="text-lg">' + d.newlyDead.map(p => escapeHtml(p.name)).join('، ') + '</p>';
      if (d.hasDeathChallenge) {
        html += '<p class="text-muted mt-2">⏳ تحدي الموت قادم...</p>';
      }
      html += '</div>';
    } else {
      html += '<p class="text-lg" style="color:#00e676">✅ الكل نجا!</p>';
    }

    if (d.survivors.length > 0) {
      html += '<p class="text-muted mt-2">الأحياء: ' + d.survivors.map(p => escapeHtml(p.name)).join('، ') + '</p>';
    }

    html += '</div>';
    document.getElementById('gameContent').innerHTML = html;
  },

  handleDeathChallenge(d) {
    // يُرسل فقط للاعبين الميتين
    this.startTimer(d.timeLimit);
    document.getElementById('gameContent').innerHTML =
      '<div class="death-panel" style="max-width:500px">' +
        '<div class="text-4xl mb-4">💀</div>' +
        '<h3 class="text-2xl font-bold mb-2">تحدي الموت!</h3>' +
        '<p class="text-xl mb-6">' + escapeHtml(d.challenge) + '</p>' +
        '<input type="text" class="input mb-4" id="deathInput" placeholder="إجابتك السريعة..." maxlength="50" style="background:rgba(255,255,255,0.1);color:#fff;border-color:#DC143C">' +
        '<button class="btn btn--primary btn--full" onclick="App.submitDeathAnswer()" style="background:#DC143C">أنقذ نفسك! 🏃</button>' +
      '</div>';
    document.getElementById('deathInput')?.focus();
  },

  submitDeathAnswer() {
    if (this._submitting) return;
    const answer = document.getElementById('deathInput')?.value?.trim();
    if (!answer) return this.showToast('اكتب شي!', 'error');
    this._submitting = true;
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer });
    this.showWaiting('هل بتنجو؟ 💀');
  },

  handleDeathChallengeStarted(d) {
    // يُرسل لكل اللاعبين - الأحياء يشوفون إن فيه تحدي
    const gc = document.getElementById('gameContent');
    if (!gc) return;
    // لا نحدّث إلا إذا اللاعب حي (الميتين عندهم شاشة التحدي)
    const currentContent = gc.innerHTML;
    if (currentContent.includes('تحدي الموت')) return; // اللاعب الميت عنده شاشة التحدي
    gc.innerHTML =
      '<div class="text-center">' +
        '<div class="text-5xl mb-4">⚔️</div>' +
        '<h3 class="text-2xl font-bold mb-4">تحدي الموت جاري!</h3>' +
        '<p class="text-muted">' + d.deadPlayers.map(p => escapeHtml(p.name)).join('، ') + ' يحاولون النجاة...</p>' +
      '</div>';
  },

  handleDeathChallengeResult(d) {
    clearInterval(this.gameTimer);
    let html = '<div class="text-center" style="max-width:500px">';

    if (d.revived.length > 0) {
      html += '<div class="text-3xl mb-4">🎉</div>';
      html += '<p class="text-xl font-bold" style="color:#00e676">نجوا من الموت!</p>';
      html += '<p class="text-lg mt-2">' + d.revived.map(p => escapeHtml(p.name)).join('، ') + '</p>';
    }

    if (d.stillDead.length > 0) {
      html += '<div class="text-3xl mt-4 mb-2">💀</div>';
      html += '<p class="text-xl font-bold" style="color:#ff4444">ما نجوا...</p>';
      html += '<p class="text-lg mt-2">' + d.stillDead.map(p => escapeHtml(p.name)).join('، ') + '</p>';
    }

    html += '</div>';
    document.getElementById('gameContent').innerHTML = html;
  },

  // ═══════════════════════════════════════════════════════════════
  // 🎭 كشف الكذاب (Fibbage)
  // ═══════════════════════════════════════════════════════════════

  handleFibbageQuestion(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    this.startTimer(d.timeLimit);
    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:600px">' +
        '<div class="badge badge--warning mb-4">🎭 اكتب كذبة</div>' +
        '<p class="text-2xl font-bold mb-6">' + escapeHtml(d.question) + '</p>' +
        '<input type="text" class="input mb-4" id="lieInput" placeholder="كذبتك المقنعة..." maxlength="50">' +
        '<button class="btn btn--primary btn--full" onclick="App.submitLie()">إرسال 🎭</button>' +
      '</div>';
    document.getElementById('lieInput')?.focus();
  },

  submitLie() {
    if (this._submitting) return;
    const lie = document.getElementById('lieInput')?.value?.trim();
    if (!lie) return this.showToast('اكتب كذبة!', 'error');
    this._submitting = true;
    AudioEngine.submit();
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: lie });
    this.showWaiting('ننتظر الكذابين...');
  },

  handleFibbageVoting(d) {
    this.startTimer(d.timeLimit);
    const opts = d.options.map(o =>
      '<div class="vote-option" data-action="guessFibbage" data-id="' + escapeHtml(o.id) + '">' +
        '<div class="vote-option__text">' + escapeHtml(o.text) + '</div>' +
      '</div>'
    ).join('');

    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:600px">' +
        '<p class="text-xl mb-2">اختر الإجابة الصحيحة:</p>' +
        '<p class="text-2xl font-bold text-accent mb-6">' + escapeHtml(d.question) + '</p>' +
        '<div class="flex flex-col gap-3">' + opts + '</div>' +
        '<p class="text-muted text-center mt-4" id="waitingCount"></p>' +
      '</div>';
  },

  guessFibbage(id, el) {
    document.querySelectorAll('.vote-option').forEach(c => c.classList.remove('vote-option--selected'));
    el.classList.add('vote-option--selected');
    AudioEngine.vote();
    this.socket.emit('submitVote', { code: this.currentRoom, voteId: id });
  },

  // ═══════════════════════════════════════════════════════════════
  // 🎨 ارسم لي (Drawful)
  // ═══════════════════════════════════════════════════════════════

  handleDrawfulYourTurn(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    this.startTimer(d.timeLimit);

    // إنشاء الكانفاس وأدوات الرسم
    const colors = DRAW_COLORS.map((c, i) =>
      '<div class="color-swatch' + (i === 0 ? ' active' : '') + '" style="background:' + c + '" onclick="App.setDrawColor(\'' + c + '\',this)"></div>'
    ).join('');

    const sizes = DRAW_SIZES.map((s, i) =>
      '<div class="brush-size' + (i === 1 ? ' active' : '') + '" onclick="App.setBrushSize(' + s + ',this)">' +
        '<div style="width:' + Math.min(s, 20) + 'px;height:' + Math.min(s, 20) + 'px;background:currentColor;border-radius:50%"></div>' +
      '</div>'
    ).join('');

    document.getElementById('gameContent').innerHTML =
      '<div class="drawing-area">' +
        '<div class="badge badge--primary mb-2">🎨 ارسم!</div>' +
        '<p class="text-xl font-bold mb-4">' + escapeHtml(d.prompt) + '</p>' +
        '<canvas class="drawing-canvas" id="drawCanvas" width="400" height="300"></canvas>' +
        '<div class="drawing-tools mt-3">' +
          colors +
          '<div style="width:2px;height:30px;background:rgba(255,255,255,0.3);margin:0 8px"></div>' +
          sizes +
          '<div style="width:2px;height:30px;background:rgba(255,255,255,0.3);margin:0 8px"></div>' +
          '<button class="btn--undo" onclick="App.undoStroke()">↩️ تراجع</button>' +
          '<button class="btn--undo" onclick="App.setDrawColor(\'#ffffff\',this);App.currentSize=20">🧹 ممحاة</button>' +
          '<button class="btn btn--ghost btn--sm" onclick="App.clearCanvas()" style="margin-right:8px">🗑️</button>' +
        '</div>' +
        '<button class="btn btn--primary btn--full mt-4" onclick="App.submitDrawing()">أرسل الرسمة 🎨</button>' +
      '</div>';

    this.initCanvas();
  },

  handleDrawfulWaiting(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    this.startTimer(d.timeLimit);
    document.getElementById('gameContent').innerHTML =
      '<div class="text-center">' +
        '<div class="text-5xl mb-4">🎨</div>' +
        '<h3 class="text-2xl font-bold mb-2">' + escapeHtml(d.drawerName) + ' يرسم...</h3>' +
        '<p class="text-muted">انتظر لين يخلص الرسمة!</p>' +
        '<div class="spinner mt-6"></div>' +
      '</div>';
  },

  handleDrawfulGuessing(d) {
    this.startTimer(d.timeLimit);
    const isDrawer = d.drawerId === this.myId;

    if (isDrawer) {
      document.getElementById('gameContent').innerHTML =
        '<div class="text-center">' +
          '<div class="text-3xl mb-4">🎨</div>' +
          '<h3 class="text-xl font-bold mb-2">أنت الرسام - انتظر التخمينات!</h3>' +
          '<div id="drawingDisplay" style="max-width:400px;margin:0 auto"></div>' +
          '<p class="text-muted mt-4" id="waitingCount">ننتظر التخمينات...</p>' +
        '</div>';
    } else {
      document.getElementById('gameContent').innerHTML =
        '<div class="panel" style="max-width:600px;width:100%">' +
          '<div class="badge badge--info mb-4">🤔 ما هذي الرسمة؟</div>' +
          '<div id="drawingDisplay" style="max-width:400px;margin:0 auto;margin-bottom:20px"></div>' +
          '<input type="text" class="input mb-4" id="guessInput" placeholder="تخمينك..." maxlength="50">' +
          '<button class="btn btn--primary btn--full" onclick="App.submitGuessDrawful()">إرسال 🤔</button>' +
        '</div>';
      document.getElementById('guessInput')?.focus();
    }

    // عرض الرسمة
    this.renderDrawing(d.drawing, document.getElementById('drawingDisplay'));
  },

  submitGuessDrawful() {
    const guess = document.getElementById('guessInput')?.value?.trim();
    if (!guess) return this.showToast('اكتب تخمين!', 'error');
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: guess });
    this.showWaiting('ننتظر التخمينات...');
  },

  handleDrawfulVoting(d) {
    this.startTimer(d.timeLimit);
    const isDrawer = d.drawerId === this.myId;

    const opts = d.options.map(o =>
      '<div class="vote-option" ' + (isDrawer ? 'style="cursor:default"' : 'data-action="guessFibbage" data-id="' + escapeHtml(o.id) + '"') + '>' +
        '<div class="vote-option__text">' + escapeHtml(o.text) + '</div>' +
      '</div>'
    ).join('');

    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:600px;width:100%">' +
        '<div class="badge badge--primary mb-4">🗳️ ' + (isDrawer ? 'انتظر التصويت' : 'أي تخمين صحيح؟') + '</div>' +
        '<div id="drawingDisplay" style="max-width:300px;margin:0 auto;margin-bottom:16px"></div>' +
        '<div class="flex flex-col gap-3">' + opts + '</div>' +
        '<p class="text-muted text-center mt-4" id="waitingCount"></p>' +
      '</div>';

    this.renderDrawing(d.drawing, document.getElementById('drawingDisplay'));
  },

  // ── وظائف الكانفاس ──

  initCanvas() {
    this.canvas = document.getElementById('drawCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.strokes = [];
    this.currentStroke = null;
    this.currentColor = '#000000';
    this.currentSize = 8;

    // تعبئة خلفية بيضاء
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // إزالة listeners القديمة لمنع التراكم
    if (this._canvasHandlers) {
      const old = this._canvasHandlers;
      old.canvas.removeEventListener('mousedown', old.mousedown);
      old.canvas.removeEventListener('mousemove', old.mousemove);
      old.canvas.removeEventListener('mouseup', old.mouseup);
      old.canvas.removeEventListener('mouseleave', old.mouseleave);
      old.canvas.removeEventListener('touchstart', old.touchstart);
      old.canvas.removeEventListener('touchmove', old.touchmove);
      old.canvas.removeEventListener('touchend', old.touchend);
    }

    // إنشاء handlers جديدة مع حفظ المراجع
    const handlers = {
      canvas: this.canvas,
      mousedown: e => this.startDraw(e),
      mousemove: e => this.draw(e),
      mouseup: () => this.endDraw(),
      mouseleave: () => this.endDraw(),
      touchstart: e => { e.preventDefault(); this.startDraw(e.touches[0]); },
      touchmove: e => { e.preventDefault(); this.draw(e.touches[0]); },
      touchend: e => { e.preventDefault(); this.endDraw(); }
    };
    this._canvasHandlers = handlers;

    this.canvas.addEventListener('mousedown', handlers.mousedown);
    this.canvas.addEventListener('mousemove', handlers.mousemove);
    this.canvas.addEventListener('mouseup', handlers.mouseup);
    this.canvas.addEventListener('mouseleave', handlers.mouseleave);
    this.canvas.addEventListener('touchstart', handlers.touchstart, { passive: false });
    this.canvas.addEventListener('touchmove', handlers.touchmove, { passive: false });
    this.canvas.addEventListener('touchend', handlers.touchend, { passive: false });
  },

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
    };
  },

  startDraw(e) {
    if (!this.ctx) return;
    this.isDrawing = true;
    const pos = this.getCanvasPos(e);
    this.currentStroke = { color: this.currentColor, size: this.currentSize, points: [pos] };
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.currentColor;
    this.ctx.lineWidth = this.currentSize;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.moveTo(pos.x, pos.y);
  },

  draw(e) {
    if (!this.isDrawing || !this.ctx) return;
    // تحديد النقاط لكل خط (5000 كحد أقصى)
    if (this.currentStroke.points.length >= 5000) return;
    const pos = this.getCanvasPos(e);
    this.currentStroke.points.push(pos);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  },

  endDraw() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    if (this.currentStroke && this.currentStroke.points.length > 0) {
      // تحديد الحد الأقصى للخطوط (500)
      if (this.strokes.length >= 500) {
        this.showToast('وصلت الحد الأقصى للخطوط!', 'error');
      } else {
        this.strokes.push(this.currentStroke);
      }
    }
    this.currentStroke = null;
  },

  setDrawColor(color, el) {
    this.currentColor = color;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
  },

  setBrushSize(size, el) {
    this.currentSize = size;
    document.querySelectorAll('.brush-size').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
  },

  clearCanvas() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.strokes = [];
  },

  submitDrawing() {
    if (this._submitting) return;
    if (this.strokes.length === 0) return this.showToast('ارسم شي!', 'error');
    this._submitting = true;
    AudioEngine.submit();
    this.socket.emit('submitDrawing', {
      code: this.currentRoom,
      drawing: JSON.stringify(this.strokes)
    });
    this.showWaiting('تم إرسال الرسمة! ننتظر...');
  },

  renderDrawing(drawingData, container) {
    if (!container) return;
    try {
      const strokes = typeof drawingData === 'string' ? JSON.parse(drawingData) : drawingData;

      // التحقق من بنية البيانات
      if (!Array.isArray(strokes)) {
        container.innerHTML = '<p class="text-muted">بيانات الرسمة غير صالحة</p>';
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      canvas.style.cssText = 'width:100%;border-radius:12px;border:3px solid #000;background:#fff';
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 300);

      // تحديد الحد الأقصى: 500 stroke، 5000 نقطة لكل stroke
      const maxStrokes = Math.min(strokes.length, 500);
      for (let s = 0; s < maxStrokes; s++) {
        const stroke = strokes[s];
        if (!stroke || !Array.isArray(stroke.points) || stroke.points.length === 0) continue;
        ctx.beginPath();
        ctx.strokeStyle = typeof stroke.color === 'string' ? stroke.color : '#000';
        ctx.lineWidth = typeof stroke.size === 'number' ? Math.min(stroke.size, 50) : 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const maxPoints = Math.min(stroke.points.length, 5000);
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < maxPoints; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }

      container.appendChild(canvas);
    } catch (e) {
      container.innerHTML = '<p class="text-muted">ما قدرنا نعرض الرسمة</p>';
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // النتائج والإرسال
  // ═══════════════════════════════════════════════════════════════

  submitAnswer() {
    if (this._submitting) return;
    const ans = document.getElementById('answerInput')?.value?.trim();
    if (!ans) return this.showToast('اكتب إجابة!', 'error');
    this._submitting = true;
    AudioEngine.submit();
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: ans });
    this.showWaiting('ننتظر الإجابات...');
  },

  voteAnswer(id, el) {
    document.querySelectorAll('.vote-option').forEach(c => c.classList.remove('vote-option--selected'));
    el.classList.add('vote-option--selected');
    AudioEngine.vote();
    this.socket.emit('submitVote', { code: this.currentRoom, voteId: id });
  },

  requestNextRound() {
    this.socket.emit('requestNextRound', this.currentRoom);
  },

  // ── نتائج الجولة ──

  handleRoundResults(d) {
    try { this._handleRoundResultsInner(d); } catch (e) {
      console.error('خطأ في عرض النتائج:', e);
      const gc = document.getElementById('gameContent');
      if (gc) gc.innerHTML = '<div class="text-center"><p class="text-xl">حصل خطأ في عرض النتائج</p></div>';
    }
  },

  _handleRoundResultsInner(d) {
    clearInterval(this.gameTimer);
    this._submitting = false;

    let resultHtml = '';

    switch (d.game) {
      case 'guesspionage':
        resultHtml =
          '<div class="percent-display mb-4">' + d.correctAnswer + '%</div>' +
          '<p class="text-xl mb-4">الإجابة الصحيحة</p>';
        if (d.playerResults) {
          resultHtml += '<div class="flex flex-col gap-2 mb-4" style="max-width:400px;width:100%">';
          d.playerResults.forEach(pr => {
            if (pr.guess !== null) {
              resultHtml +=
                '<div class="flex justify-between items-center p-2" style="background:rgba(255,255,255,0.05);border-radius:8px">' +
                  '<span>' + escapeHtml(pr.playerName) + ': ' + pr.guess + '%</span>' +
                  '<span style="color:#FFD93D">+' + pr.points + '</span>' +
                '</div>';
            }
          });
          resultHtml += '</div>';
        }
        break;

      case 'fakinit':
        resultHtml =
          '<div class="faker-reveal">' +
            '<div class="faker-reveal__icon">' + (d.caught ? '🎉' : '🕵️') + '</div>' +
            '<p class="text-2xl font-bold mt-4">' + (d.caught ? 'انكشف المزيّف!' : 'المزيّف نجا!') + '</p>' +
            '<p class="text-xl mt-2">المزيّف: <strong>' + escapeHtml(d.fakerName) + '</strong></p>' +
          '</div>';
        break;

      case 'triviamurder':
        resultHtml = '<div class="text-2xl text-accent mb-4">✅ ' + escapeHtml(d.correctAnswer) + '</div>';
        if (d.newlyDead && d.newlyDead.length > 0) {
          resultHtml += '<p style="color:#ff4444">💀 ' + d.newlyDead.map(p => escapeHtml(p.name)).join('، ') + '</p>';
        }
        if (d.revived && d.revived.length > 0) {
          resultHtml += '<p style="color:#00e676" class="mt-2">🎉 نجوا: ' + d.revived.map(p => escapeHtml(p.name)).join('، ') + '</p>';
        }
        break;

      case 'fibbage':
        resultHtml =
          '<p class="text-xl mb-2">الإجابة الصحيحة:</p>' +
          '<p class="text-2xl font-bold text-accent mb-4">' + escapeHtml(d.correctAnswer) + '</p>';
        if (d.playerResults) {
          resultHtml += '<div class="flex flex-col gap-2 mb-4" style="max-width:400px;width:100%">';
          d.playerResults.forEach(pr => {
            let info = '';
            if (pr.guessedCorrect) info += '✅ خمّن صح ';
            if (pr.fooledCount > 0) info += '🤥 خدع ' + pr.fooledCount;
            resultHtml +=
              '<div class="flex justify-between items-center p-2" style="background:rgba(255,255,255,0.05);border-radius:8px">' +
                '<span>' + escapeHtml(pr.playerName) + ' ' + info + '</span>' +
                '<span style="color:#FFD93D">+' + pr.points + '</span>' +
              '</div>';
          });
          resultHtml += '</div>';
        }
        break;

      case 'drawful':
        resultHtml =
          '<p class="text-xl mb-2">الكلمة كانت:</p>' +
          '<p class="text-2xl font-bold text-accent mb-4">' + escapeHtml(d.prompt) + '</p>';
        if (d.drawing) {
          resultHtml += '<div id="resultDrawing" style="max-width:300px;margin:0 auto;margin-bottom:16px"></div>';
        }
        if (d.playerResults) {
          resultHtml += '<div class="flex flex-col gap-2 mb-4" style="max-width:400px;width:100%">';
          d.playerResults.forEach(pr => {
            let info = pr.isDrawer ? '🎨 الرسام' : '';
            if (pr.guessedCorrect) info += '✅ ';
            if (pr.fooledCount > 0) info += '🤥×' + pr.fooledCount;
            resultHtml +=
              '<div class="flex justify-between items-center p-2" style="background:rgba(255,255,255,0.05);border-radius:8px">' +
                '<span>' + escapeHtml(pr.playerName) + ' ' + info + '</span>' +
                '<span style="color:#FFD93D">+' + pr.points + '</span>' +
              '</div>';
          });
          resultHtml += '</div>';
        }
        break;

      default:
        if (d.message) {
          resultHtml = '<p class="text-xl mb-4">' + escapeHtml(d.message) + '</p>';
        }
    }

    // لوحة النقاط
    const players = d.players ? d.players.sort((a, b) => b.score - a.score) : [];
    const scores = players.map((p, i) =>
      '<div class="scoreboard__row">' +
        '<div class="flex items-center gap-3">' +
          '<span class="text-2xl">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)) + '</span>' +
          '<span class="text-xl font-bold">' + escapeHtml(p.name) + '</span>' +
        '</div>' +
        '<span class="text-xl font-bold" style="color:#FFD93D">' + p.score + '</span>' +
      '</div>'
    ).join('');

    const nextBtn = this.isHost
      ? '<button class="btn btn--primary btn--lg mt-6" onclick="App.requestNextRound()">' + (d.isLastRound ? 'النتائج 🏆' : 'التالي ➡️') + '</button>'
      : '<p class="text-muted mt-4">انتظر المضيف...</p>';

    document.getElementById('gameContent').innerHTML =
      '<div class="text-center" style="max-width:500px;width:100%">' +
        resultHtml +
        '<div class="scoreboard mt-6">' + scores + '</div>' +
        nextBtn +
      '</div>';

    // عرض رسمة Drawful في النتائج
    if (d.game === 'drawful' && d.drawing) {
      const drawContainer = document.getElementById('resultDrawing');
      if (drawContainer) this.renderDrawing(d.drawing, drawContainer);
    }

    this.confetti();
  },

  // ── نتائج اللعبة النهائية ──

  handleGameEnded(d) {
    try { this._handleGameEndedInner(d); } catch (e) {
      console.error('خطأ في عرض نهاية اللعبة:', e);
      this.showScreen('resultsScreen');
    }
  },

  _handleGameEndedInner(d) {
    clearInterval(this.gameTimer);
    this.setTheme('victory');
    document.getElementById('emojiBar')?.classList.add('hidden');
    this.confetti();

    const w = d.finalResults[0];
    const winnerEl = document.getElementById('winnerDisplay');
    if (winnerEl) {
      winnerEl.innerHTML =
        '<div class="winner-showcase__trophy">🏆</div>' +
        '<h1 class="winner-showcase__name">' + escapeHtml(w.name) + '</h1>' +
        '<div class="winner-showcase__score">' + w.score + ' نقطة</div>';
    }

    const scores = d.finalResults.map((p, i) =>
      '<div class="scoreboard__row">' +
        '<div class="flex items-center gap-3">' +
          '<span class="text-2xl">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)) + '</span>' +
          '<span class="avatar" style="background:' + escapeHtml(p.color) + ';width:40px;height:40px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center">' + escapeHtml(p.avatar) + '</span>' +
          '<span class="text-xl font-bold">' + escapeHtml(p.name) + '</span>' +
        '</div>' +
        '<span class="text-xl font-bold" style="color:#FFD93D">' + p.score + '</span>' +
      '</div>'
    ).join('');

    document.getElementById('finalScoreboard').innerHTML = scores;

    const actionsEl = document.getElementById('resultsActions');
    if (actionsEl) {
      actionsEl.innerHTML = this.isHost
        ? '<button class="btn btn--primary btn--lg" onclick="App.backToLobby()">🔄 مرة ثانية</button>'
        : '<p class="text-muted">انتظر المضيف...</p>';
    }

    if (d.tip) {
      this.showToast('💡 ' + d.tip, 'success');
    }

    this.showScreen('resultsScreen');
  },

  // ═══════════════════════════════════════════════════════════════
  // الأدوات المساعدة
  // ═══════════════════════════════════════════════════════════════

  showToast(msg, type) {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast toast--' + (type || 'error');
    t.style.cssText = 'background:' + (type === 'success' ? 'linear-gradient(135deg,#00e676,#00c853)' : 'linear-gradient(135deg,#ff4444,#cc0000)') +
      ';color:#fff;padding:14px 28px;border-radius:50px;margin:8px;font-weight:700;font-size:16px;' +
      'box-shadow:0 4px 15px rgba(0,0,0,0.3);animation:slideIn 0.3s ease-out;border:2px solid rgba(255,255,255,0.2)';
    t.textContent = (type === 'success' ? '✅' : '⚠️') + ' ' + msg;
    c.appendChild(t);
    setTimeout(() => {
      t.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => t.remove(), 300);
    }, 3000);
  },

  // ═══════════════════════════════════════════════════════════════
  // العد التنازلي (3, 2, 1, يلا!)
  // ═══════════════════════════════════════════════════════════════

  showCountdown(callback) {
    if (this.reducedMotion) { if (callback) callback(); return; }
    const overlay = document.getElementById('countdownOverlay');
    const numEl = document.getElementById('countdownNumber');
    if (!overlay || !numEl) { if (callback) callback(); return; }

    overlay.classList.remove('hidden');
    const steps = ['3', '2', '1', 'يلا!'];
    let i = 0;

    const next = () => {
      if (i >= steps.length) {
        overlay.classList.add('hidden');
        if (callback) callback();
        return;
      }
      numEl.textContent = steps[i];
      numEl.style.animation = 'none';
      numEl.offsetHeight; // reflow
      numEl.style.animation = 'countdown-pop 0.5s ease-out';
      if (i < 3) AudioEngine.countdownBeep(); else AudioEngine.countdownGo();
      i++;
      setTimeout(next, 800);
    };
    next();
  },

  // ═══════════════════════════════════════════════════════════════
  // نظام الإيموجي
  // ═══════════════════════════════════════════════════════════════

  sendEmoji(emoji) {
    const now = Date.now();
    if (now - this.lastEmojiTime < 500) return; // throttle
    this.lastEmojiTime = now;
    AudioEngine.emojiPop();
    this.showEmojiFloat(emoji);
    if (this.currentRoom) {
      this.socket.emit('sendEmoji', { code: this.currentRoom, emoji });
    }
  },

  showEmojiFloat(emoji) {
    const container = document.getElementById('emojiFloatContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'emoji-float';
    el.textContent = emoji;
    el.style.left = (10 + Math.random() * 80) + '%';
    el.style.bottom = '0';
    container.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  },

  // ═══════════════════════════════════════════════════════════════
  // أنيميشن النقاط
  // ═══════════════════════════════════════════════════════════════

  showPointsPopup(points) {
    if (!points || this.reducedMotion) return;
    const el = document.createElement('div');
    el.className = 'points-popup';
    el.textContent = '+' + points;
    el.style.left = '50%';
    el.style.top = '40%';
    el.style.transform = 'translateX(-50%)';
    document.body.appendChild(el);
    AudioEngine.points(points);
    setTimeout(() => el.remove(), 1500);
  },

  animateScore(element, from, to) {
    if (!element || this.reducedMotion) { if (element) element.textContent = to; return; }
    const duration = 800;
    const start = performance.now();
    const step = (timestamp) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      element.textContent = Math.round(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    element.classList.add('score-animate');
    requestAnimationFrame(step);
    setTimeout(() => element.classList.remove('score-animate'), duration);
  },

  // ═══════════════════════════════════════════════════════════════
  // تحسينات الرسم (تراجع / ممحاة)
  // ═══════════════════════════════════════════════════════════════

  undoStroke() {
    if (!this.strokes || this.strokes.length === 0) return;
    this.strokes.pop();
    this.redrawCanvas();
  },

  redrawCanvas() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.strokes.forEach(stroke => {
      if (!stroke.points || stroke.points.length === 0) return;
      this.ctx.beginPath();
      this.ctx.strokeStyle = stroke.color || '#000';
      this.ctx.lineWidth = stroke.size || 4;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      this.ctx.stroke();
    });
  },

  // ═══════════════════════════════════════════════════════════════
  // الإعدادات
  // ═══════════════════════════════════════════════════════════════

  toggleSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.toggle('hidden');
  },

  updateVolume(type, value) {
    AudioEngine.setVolume(type, value / 100);
  },

  toggleReducedMotion(checked) {
    this.reducedMotion = checked;
    localStorage.setItem('reducedMotion', checked);
  },

  // ═══════════════════════════════════════════════════════════════
  // الأدوات المساعدة
  // ═══════════════════════════════════════════════════════════════

  confetti() {
    if (this.reducedMotion) return;
    // تنظيف confetti الموجود
    document.querySelectorAll('.confetti-particle').forEach(el => el.remove());
    const colors = ['#FFD93D', '#E91E8C', '#00d4ff', '#00e676', '#7c4dff', '#FF8C42', '#f093fb'];
    const count = 30; // تقليل العدد للأداء
    for (let i = 0; i < count; i++) {
      const c = document.createElement('div');
      c.className = 'confetti-particle';
      const size = 6 + Math.random() * 10;
      const isCircle = Math.random() > 0.5;
      c.style.cssText =
        'position:fixed;width:' + size + 'px;height:' + size + 'px;' +
        'background:' + colors[Math.floor(Math.random() * colors.length)] + ';' +
        'left:' + (Math.random() * 100) + 'vw;top:-20px;z-index:9999;' +
        'border-radius:' + (isCircle ? '50%' : '2px') + ';' +
        'animation:confettiFall ' + (2.5 + Math.random() * 2) + 's linear forwards;' +
        'animation-delay:' + (Math.random() * 0.8) + 's;' +
        'pointer-events:none';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 6000);
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // مؤشر حالة الاتصال
  // ═══════════════════════════════════════════════════════════════

  _updateConnectionState(state) {
    this._connectionState = state;
    let indicator = document.getElementById('connectionIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'connectionIndicator';
      indicator.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:9999;display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;pointer-events:none;transition:all 0.3s';
      document.body.appendChild(indicator);
    }
    switch (state) {
      case 'connected':
        indicator.style.background = 'rgba(0,230,118,0.2)';
        indicator.style.color = '#00e676';
        indicator.style.border = '1px solid rgba(0,230,118,0.4)';
        indicator.textContent = '● متصل';
        setTimeout(() => { indicator.style.opacity = '0'; }, 3000);
        break;
      case 'disconnected':
        indicator.style.background = 'rgba(255,68,68,0.2)';
        indicator.style.color = '#ff4444';
        indicator.style.border = '1px solid rgba(255,68,68,0.4)';
        indicator.style.opacity = '1';
        indicator.textContent = '● منقطع';
        this.showToast('انقطع الاتصال!', 'error');
        break;
      case 'reconnecting':
        indicator.style.background = 'rgba(255,165,0,0.2)';
        indicator.style.color = '#ffa500';
        indicator.style.border = '1px solid rgba(255,165,0,0.4)';
        indicator.style.opacity = '1';
        indicator.textContent = '● جاري إعادة الاتصال...';
        break;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════
// حقن الرسوم المتحركة
// ═══════════════════════════════════════════════════════════════════

const animStyle = document.createElement('style');
animStyle.textContent = `
  @keyframes slideIn { from { transform: translateY(-100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
  @keyframes slideOut { from { transform: translateY(0); opacity: 1 } to { transform: translateY(-100%); opacity: 0 } }
  @keyframes confettiFall {
    0% { top: -20px; transform: rotate(0deg) scale(1) }
    100% { top: 100vh; transform: rotate(720deg) scale(0.5) }
  }
  @keyframes bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-20px) } }
  #toastContainer { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; align-items: center; pointer-events: none }
  #toastContainer > * { pointer-events: auto }
  .spinner { width: 48px; height: 48px; border: 4px solid rgba(255,255,255,0.2); border-top-color: var(--theme-accent, #FFD93D); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto }
  @keyframes spin { to { transform: rotate(360deg) } }
  .player-avatar--dead { opacity: 0.5; filter: grayscale(0.8) }
`;
document.head.appendChild(animStyle);

// ═══════════════════════════════════════════════════════════════════
// تشغيل التطبيق
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => App.init());
