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

    // استعادة بيانات الاتصال من sessionStorage (للعودة بعد refresh)
    try {
      this._savedRoom = sessionStorage.getItem('abuabed_room') || null;
      this._savedName = sessionStorage.getItem('abuabed_name') || null;
    } catch (e) { /* sessionStorage not available */ }

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
      document.body.setAttribute('data-reduced-motion', 'true');
    }

    // تحميل مستوى الحيوية
    const savedIntensity = localStorage.getItem('intensity') || 'party';
    this.setIntensity(savedIntensity);
    const intensitySelect = document.getElementById('intensitySelect');
    if (intensitySelect) intensitySelect.value = savedIntensity;

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

    // ── Event Delegation لمحتوى اللعبة (بدلاً من inline onclick) ──
    document.getElementById('gameContent')?.addEventListener('click', (e) => {
      // Stepper buttons for compound input
      const stepBtn = e.target.closest('[data-step]');
      if (stepBtn) {
        const delta = parseInt(stepBtn.getAttribute('data-step'));
        this._stepGauge(delta);
        return;
      }
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.getAttribute('data-action');
      const id = target.getAttribute('data-id');
      switch (action) {
        case 'voteAnswer': this.voteAnswer(id, target); break;
        case 'votePlayer': this.votePlayer(id, target); break;
        case 'guessFibbage': this.guessFibbage(id, target); break;
        case 'submitTriviaAnswer': this.submitTriviaAnswer(parseInt(id), target); break;
        case 'submitAnswer': this.submitAnswer(); break;
        case 'submitGuess': this.submitGuess(e); break;
        case 'submitFakinAction': this.submitFakinAction(); break;
        case 'submitDeathAnswer': this.submitDeathAnswer(); break;
        case 'submitLie': this.submitLie(); break;
        case 'submitDrawing': this.submitDrawing(); break;
        case 'submitGuessDrawful': this.submitGuessDrawful(); break;
        case 'submitFinalPicks': this.submitFinalPicks(); break;
        case 'requestNextRound': this.requestNextRound(); break;
        case 'backToLobby': this.backToLobby(); break;
        case 'undoStroke': this.undoStroke(); break;
        case 'clearCanvas': this.clearCanvas(); break;
        case 'useSafetyQuip': {
          const quip = target.getAttribute('data-quip');
          const inp = document.getElementById('answerInput');
          if (inp && quip) { inp.value = quip; inp.dispatchEvent(new Event('input')); inp.focus(); }
          break;
        }
        case 'setDrawColor': {
          const color = target.getAttribute('data-color');
          this.setDrawColor(color, target);
          break;
        }
        case 'setEraser': {
          this.setDrawColor('#ffffff', target);
          this.currentSize = 20;
          break;
        }
        case 'setBrushSize': {
          const size = parseInt(target.getAttribute('data-size'));
          this.setBrushSize(size, target);
          break;
        }
      }
    });

    // ── Event Delegation لشاشة النتائج النهائية ──
    document.getElementById('resultsActions')?.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.getAttribute('data-action');
      if (action === 'backToLobby') this.backToLobby();
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
      // Auto-rejoin if we had an active room
      if (this._savedRoom && this._savedName) {
        s.emit('rejoinRoom', { code: this._savedRoom, playerName: this._savedName });
      }
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

    // ── إعادة الانضمام + متفرج ──
    s.on('rejoinedRoom', data => {
      this.currentRoom = data.code;
      this.isHost = data.isHost;
      this._savedRoom = data.code;
      document.getElementById('displayRoomCode').textContent = data.code;
      this.updatePlayers(data.players);
      if (data.state === 'playing' && data.game) {
        this.currentGame = data.game;
        this.setTheme(data.game);
        this.updateGameHeader(data.game);
        this.showScreen('gameScreen');
        document.getElementById('emojiBar')?.classList.remove('hidden');
        document.getElementById('gameRound').textContent = 'الجولة ' + data.round + ' من ' + data.maxRounds;
        this.showWaiting('رجعت! ننتظر الجولة الجاية...');
      } else {
        this.showScreen('lobbyScreen');
        this.updateHostUI();
      }
      this.showToast('رجعت للغرفة!', 'success');
      AudioEngine.playerJoin();
    });

    s.on('joinedAsAudience', data => {
      this.currentRoom = data.code;
      this._savedRoom = data.code;
      this.isHost = false;
      this._isAudience = true;
      if (data.game) {
        this.currentGame = data.game;
        this.setTheme(data.game);
        this.updateGameHeader(data.game);
        this.showScreen('gameScreen');
        document.getElementById('emojiBar')?.classList.remove('hidden');
        this.showWaiting('أنت متفرج! شارك بالتصويت والإيموجي');
      } else {
        this.showScreen('lobbyScreen');
      }
      this.showToast('انضممت كمتفرج!', 'success');
    });

    // ── الغرفة ──
    s.on('roomCreated', data => {
      this.currentRoom = data.code;
      this._savedRoom = data.code;
      this._savedName = document.getElementById('hostNameInput')?.value?.trim();
      this._persistSession();
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
      this._savedRoom = data.code;
      this._savedName = document.getElementById('playerNameInput')?.value?.trim();
      this._persistSession();
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
      if (data.commentary) this.showCommentary(data.commentary);
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

    // ── Standalone commentary (timer warnings, hype) ──
    s.on('commentary', data => this.showCommentary(data));

    // ── بدء اللعبة ──
    s.on('gameStarted', data => {
      this.currentGame = data.game;
      this.setTheme(data.game);
      this.updateGameHeader(data.game);
      AudioEngine.gameStart();
      AudioEngine.startMusic(data.game);
      if (data.commentary) this.showCommentary(data.commentary);

      // Quiplash gets a special game splash before countdown
      if (data.game === 'quiplash') {
        this._showQuiplashGameSplash(() => {
          this.showCountdown(() => {
            this.showScreen('gameScreen');
            document.getElementById('emojiBar')?.classList.remove('hidden');
          });
        });
      } else {
        // عد تنازلي ثم عرض شاشة اللعبة
        this.showCountdown(() => {
          this.showScreen('gameScreen');
          document.getElementById('emojiBar')?.classList.remove('hidden');
        });
      }
    });

    // ── إجابات وتصويتات ──
    s.on('playerAnswered', data => this.updateWaitingCount(data.count, data.total, null, data.answered));
    s.on('playerVoted', data => this.updateWaitingCount(data.count, data.total, 'صوّتوا'));

    // ── رد سريع (Quiplash) ──
    s.on('quiplashQuestion', data => this.handleQuiplashQuestion(data));
    s.on('quiplashVoting', data => this.handleQuiplashVoting(data));
    s.on('quiplashMatchupResult', data => {
      const hasQuiplash = data.results?.some(r => r.quiplash);
      if (hasQuiplash) AudioEngine.quiplash(); else AudioEngine.reveal();
      this.handleQuiplashMatchupResult(data);
    });

    // ── خمّن النسبة (Guesspionage) - نظام كامل ──
    s.on('guesspionageQuestion', data => this.handleGuesspionageQuestion(data));
    s.on('guesspionageFeatured', data => this.handleGuesspionageFeatured(data));
    s.on('guesspionageWaitFeatured', data => this.handleGuesspionageWaitFeatured(data));
    s.on('guesspionageFeaturedWaiting', data => this.handleGuesspionageFeaturedWaiting(data));
    s.on('guesspionageChallenge', data => this.handleGuesspionageChallenge(data));

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
    s.on('roundResults', data => {
      AudioEngine.reveal();
      if (data.commentary) this.showCommentary(data.commentary);
      this.handleRoundResults(data);
    });
    s.on('gameEnded', data => {
      AudioEngine.stopMusic();
      AudioEngine.drumRoll(2);
      setTimeout(() => { AudioEngine.victory(); AudioEngine.applause(); }, 2000);
      if (data.commentary) this.showCommentary(data.commentary);
      this.handleGameEnded(data);
    });

    // ── الإيموجي ──
    s.on('emojiReaction', data => this.showEmojiFloat(data.emoji));

    // ── وضع العائلة ──
    s.on('familyModeChanged', data => {
      this._familyMode = data.familyMode;
      const btn = document.getElementById('familyModeBtn');
      if (btn) btn.textContent = data.familyMode ? '🏠 وضع العائلة: مفعّل ✅' : '🏠 وضع العائلة: معطّل';
      this.showToast(data.message, 'success');
    });

    s.on('extendedTimersChanged', data => {
      const btn = document.getElementById('extendedTimersBtn');
      if (btn) btn.textContent = data.extendedTimers ? '⏳ مؤقتات ممتدة: مفعّلة ✅' : '⏱️ مؤقتات ممتدة: معطّلة';
      this.showToast(data.message, 'success');
    });

    // ── Audience ──
    s.on('audienceJoined', data => {
      this.showToast(escapeHtml(data.name) + ' انضم كمتفرج! 👀', 'success');
    });

    // ── Guesspionage Final Round ──
    s.on('guesspionageFinalRound', data => this.handleGuesspionageFinalRound(data));

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
      bg.classList.add(game ? game.pattern : (theme === 'victory' ? 'pattern-confetti' : 'pattern-arabesque'));
    }
  },

  setIntensity(level) {
    const valid = ['calm', 'party', 'chaos'];
    if (!valid.includes(level)) level = 'party';
    document.body.setAttribute('data-intensity', level);
    this._intensity = level;
    localStorage.setItem('intensity', level);
  },

  // حفظ بيانات الجلسة لإعادة الاتصال
  _persistSession() {
    try {
      if (this._savedRoom) sessionStorage.setItem('abuabed_room', this._savedRoom);
      if (this._savedName) sessionStorage.setItem('abuabed_name', this._savedName);
    } catch (e) { /* sessionStorage not available */ }
  },

  _clearSession() {
    try {
      sessionStorage.removeItem('abuabed_room');
      sessionStorage.removeItem('abuabed_name');
    } catch (e) {}
    this._savedRoom = null;
    this._savedName = null;
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
    this._savedName = name;
    this._savedRoom = code;
    this._persistSession();
    this.socket.emit('joinRoom', { code, playerName: name });
  },

  joinAsAudience() {
    const code = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    const name = document.getElementById('playerNameInput').value.trim();
    if (!code || code.length !== 4) return this.showToast('كود خاطئ!', 'error');
    if (!name) return this.showToast('أدخل اسمك!', 'error');
    AudioEngine.click();
    this._savedName = name;
    this._savedRoom = code;
    this._persistSession();
    this.socket.emit('joinAsAudience', { code, playerName: name });
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

  toggleHideRoomCode() {
    this._roomCodeHidden = !this._roomCodeHidden;
    const codeEl = document.getElementById('roomCode');
    if (codeEl) {
      codeEl.style.filter = this._roomCodeHidden ? 'blur(8px)' : 'none';
      codeEl.setAttribute('aria-hidden', this._roomCodeHidden ? 'true' : 'false');
    }
    this.showToast(this._roomCodeHidden ? 'كود الغرفة مخفي (للبث)' : 'كود الغرفة ظاهر', 'success');
  },

  toggleExtendedTimers() {
    if (!this.isHost || !this.currentRoom) return;
    this.socket.emit('toggleExtendedTimers', this.currentRoom);
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
    const familySection = document.getElementById('familyModeSection');
    if (gamesSection) gamesSection.style.display = this.isHost ? 'block' : 'none';
    if (waitingMessage) waitingMessage.style.display = this.isHost ? 'none' : 'block';
    if (familySection) familySection.style.display = this.isHost ? 'block' : 'none';
  },

  toggleFamilyMode() {
    if (!this.isHost || !this.currentRoom) return;
    this.socket.emit('toggleFamilyMode', this.currentRoom);
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

  _waitingTips: [
    'هل تعلم؟ أبو عابد ما ينام إلا بعد ما يخلّص اللعبة!',
    'نصيحة: الإجابة السريعة مش دايم الأفضل!',
    'أبو عابد يقول: الصبر حلو... بس بسرعة!',
    'فكرة: جرب تكتب إجابة غريبة... ممكن تضحّكهم!',
    'ترى أبو عابد يسجل كل شي... 📝',
    'هل تعلم؟ أكثر لاعب فاز هو اللي يضحك أكثر!',
    'نصيحة: لا تنسخ إجابة صاحبك... ما ينفع! 😅',
    'أبو عابد يفكر بالسؤال الجاي...',
  ],

  showWaiting(msg) {
    const gc = document.getElementById('gameContent');
    const tip = this._waitingTips[Math.floor(Math.random() * this._waitingTips.length)];
    if (gc) gc.innerHTML =
      '<div class="text-center">' +
        '<div class="spinner mb-4"></div>' +
        '<p class="text-2xl font-bold">' + escapeHtml(msg) + '</p>' +
        '<div id="waitingAvatars" class="waiting-avatars mt-4"></div>' +
        '<p class="text-muted mt-2" id="waitingCount">ننتظر...</p>' +
        '<p class="waiting-tip mt-3">' + escapeHtml(tip) + '</p>' +
      '</div>';
  },

  updateWaitingCount(count, total, label, answered) {
    const el = document.getElementById('waitingCount');
    if (el) el.textContent = count + ' من ' + total + ' ' + (label || 'أجابوا');
    const ac = document.getElementById('answeredCount');
    if (ac) {
      ac.style.display = 'block';
      ac.textContent = count + '/' + total;
    }

    // عرض أفاتارات اللاعبين المجيبين
    const avatarsEl = document.getElementById('waitingAvatars');
    if (avatarsEl && answered && answered.length > 0) {
      avatarsEl.innerHTML = answered.map(a =>
        '<div class="waiting-avatar" style="background:' + escapeHtml(a.color) + '" title="' + escapeHtml(a.name) + '">' +
          escapeHtml(a.avatar) +
          '<div class="waiting-avatar__check">✓</div>' +
        '</div>'
      ).join('');
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // ⚡ رد سريع (Quiplash) - Cinematic Jackbox-Style
  // ═══════════════════════════════════════════════════════════════

  // Round interstitial labels
  /**
   * Show Quiplash game splash (intro screen before countdown)
   */
  _showQuiplashGameSplash(callback) {
    const el = document.createElement('div');
    el.className = 'ql-game-splash';
    el.innerHTML =
      '<div class="ql-game-splash__icon">⚡</div>' +
      '<div class="ql-game-splash__title">رد سريع</div>' +
      '<div class="ql-game-splash__subtitle">اكتب أطرف إجابة... واقنع ربعك!</div>';
    document.body.appendChild(el);

    setTimeout(() => {
      el.classList.add('ql-game-splash--exit');
      setTimeout(() => {
        el.remove();
        if (callback) callback();
      }, 600);
    }, 2500);
  },

  _qlRoundLabels: ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'],
  _qlRoundColors: ['r1', 'r2', 'r3', 'r3', 'r3'],
  _qlRoundSubtitles: ['يلا نبدأ! ⚡', 'الحين الجد! 🔥', 'آخر فرصة... كل شي مضاعف! 💥', 'لا تضيعها!', 'الجولة الأخيرة!'],

  /**
   * Show Quiplash round interstitial (ROUND ONE / ROUND TWO / etc.)
   */
  _showQuiplashInterstitial(round, maxRounds, callback) {
    const idx = Math.min(round - 1, 4);
    const isFinal = round === maxRounds;
    const colorClass = 'ql-interstitial__round-num--' + this._qlRoundColors[idx];
    const label = 'الجولة ' + this._qlRoundLabels[idx];
    const subtitle = isFinal ? 'النقاط مضاعفة! 🔥🔥' : this._qlRoundSubtitles[idx];

    const el = document.createElement('div');
    el.className = 'ql-interstitial';
    el.innerHTML =
      '<div class="ql-interstitial__round-label">⚡ رد سريع</div>' +
      '<div class="ql-interstitial__round-num ' + colorClass + '">' + label + '</div>' +
      (isFinal ? '<div class="ql-interstitial__final-badge">🔥 النقاط مضاعفة!</div>' : '') +
      '<div class="ql-interstitial__subtitle">' + escapeHtml(subtitle) + '</div>';

    document.body.appendChild(el);
    AudioEngine.reveal();

    setTimeout(() => {
      el.classList.add('ql-interstitial--exit');
      setTimeout(() => {
        el.remove();
        if (callback) callback();
      }, 500);
    }, 2000);
  },

  handleQuiplashQuestion(d) {
    // Show round interstitial first, then the question
    this._showQuiplashInterstitial(d.round, d.maxRounds, () => {
      document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
      this.startTimer(d.timeLimit);

      const safetyQuips = d.safetyQuips || [];
      const safetyBtn = safetyQuips.length > 0
        ? '<button class="ql-safety-quip" data-action="useSafetyQuip" data-quip="' + escapeHtml(safetyQuips[0]) + '">🎲 مساعدة أبو عابد</button>'
        : '';

      document.getElementById('gameContent').innerHTML =
        '<div class="ql-prompt-card">' +
          '<div class="ql-prompt-card__badge">⚡ السؤال ' + d.round + '</div>' +
          '<p class="ql-prompt-card__question">' + escapeHtml(d.question) + '</p>' +
          '<div class="ql-prompt-card__input-wrap">' +
            '<input type="text" class="ql-prompt-card__input" id="answerInput" placeholder="اكتب إجابتك الأسطورية..." maxlength="100" autocomplete="off">' +
            '<span class="ql-prompt-card__char-count" id="qlCharCount">0/100</span>' +
          '</div>' +
          '<button class="ql-prompt-card__submit" data-action="submitAnswer">إرسال ⚡</button>' +
          safetyBtn +
        '</div>';

      const input = document.getElementById('answerInput');
      if (input) {
        input.focus();
        input.addEventListener('input', () => {
          const len = input.value.length;
          const counter = document.getElementById('qlCharCount');
          if (counter) {
            counter.textContent = len + '/100';
            counter.className = 'ql-prompt-card__char-count' +
              (len >= 90 ? ' ql-prompt-card__char-count--danger' : len >= 70 ? ' ql-prompt-card__char-count--warn' : '');
          }
        });
        input.addEventListener('keypress', e => {
          if (e.key === 'Enter') this.submitAnswer();
        });
      }
    });
  },

  // Override submitAnswer to show submitted state for Quiplash
  _qlAnswerSubmitted: false,

  /**
   * Show the submitted answer in a nice bubble after submitting
   */
  _showQuiplashSubmitted(answer) {
    this._qlAnswerSubmitted = true;
    const gc = document.getElementById('gameContent');
    if (!gc) return;
    gc.innerHTML =
      '<div class="ql-prompt-card">' +
        '<div class="ql-prompt-card__submitted">' +
          '<div class="ql-prompt-card__submitted-check">✅</div>' +
          '<div class="ql-prompt-card__submitted-answer">"' + escapeHtml(answer) + '"</div>' +
        '</div>' +
        '<div class="ql-waiting" style="margin-top:20px">' +
          '<div class="ql-waiting__text">ننتظر الباقين<span class="ql-waiting__dots"></span></div>' +
          '<div id="waitingAvatars" class="ql-waiting__avatars"></div>' +
          '<p class="text-muted text-center" id="waitingCount"></p>' +
        '</div>' +
      '</div>';
  },

  handleQuiplashVoting(d) {
    this._qlAnswerSubmitted = false;
    document.getElementById('gameRound').textContent = 'مواجهة ' + d.matchupNumber + ' من ' + d.totalMatchups;
    this.startTimer(d.timeLimit);

    // Determine side A and side B
    const a0 = d.answers[0] || {};
    const a1 = d.answers[1] || {};

    document.getElementById('gameContent').innerHTML =
      '<div class="ql-split-screen">' +
        '<div class="ql-split-screen__question">' + escapeHtml(d.question) + '</div>' +
        '<div class="ql-split-screen__matchup-info">مواجهة ' + d.matchupNumber + ' من ' + d.totalMatchups + '</div>' +
        '<div class="ql-split-screen__arena">' +
          '<div class="ql-bubble ql-bubble--a" data-action="voteAnswer" data-id="' + escapeHtml(a0.playerId) + '">' +
            '<div class="ql-bubble__text">"' + escapeHtml(a0.answer) + '"</div>' +
          '</div>' +
          '<div class="ql-vs"><div class="ql-vs__badge">VS</div></div>' +
          '<div class="ql-bubble ql-bubble--b" data-action="voteAnswer" data-id="' + escapeHtml(a1.playerId) + '">' +
            '<div class="ql-bubble__text">"' + escapeHtml(a1.answer) + '"</div>' +
          '</div>' +
        '</div>' +
        '<div class="ql-vote-progress" id="waitingCount">🗳️ صوّت لإجابتك المفضلة!</div>' +
      '</div>';

    // Store answer data for results
    this._qlCurrentMatchup = { a: a0, b: a1 };
  },

  handleQuiplashMatchupResult(d) {
    try {
      clearInterval(this.gameTimer);
      const results = d.results || [];
      const sorted = [...results].sort((a, b) => b.votes - a.votes);
      const r0 = sorted[0] || {};
      const r1 = sorted[1] || {};
      const totalVotes = (r0.votes || 0) + (r1.votes || 0);
      const hasQuiplash = r0.quiplash;
      const isTie = r0.votes === r1.votes;

      // Determine which side each result maps to (A=cyan, B=yellow)
      const matchup = this._qlCurrentMatchup || {};
      const isR0SideA = matchup.a && r0.playerId === matchup.a.playerId;
      const sideA = isR0SideA ? r0 : r1;
      const sideB = isR0SideA ? r1 : r0;
      const sideAVotes = sideA.votes || 0;
      const sideBVotes = sideB.votes || 0;
      const sideAPct = totalVotes > 0 ? Math.round((sideAVotes / totalVotes) * 100) : 0;
      const sideBPct = totalVotes > 0 ? 100 - sideAPct : 0;
      const aWins = sideAVotes > sideBVotes;
      const bWins = sideBVotes > sideAVotes;

      // Build vote bars for each side
      const voterBreakdown = d.voterBreakdown || {};
      const aBars = (voterBreakdown[sideA.playerId] || []).map((v, i) =>
        '<div class="ql-vote-bar" style="background:' + escapeHtml(v.color || '#444') + ';animation-delay:' + (i * 0.2) + 's">' +
          '<span class="ql-vote-bar__avatar">' + escapeHtml(v.avatar || '👤') + '</span>' +
          '<span class="ql-vote-bar__name">' + escapeHtml(v.name || '') + '</span>' +
        '</div>'
      ).join('');
      const bBars = (voterBreakdown[sideB.playerId] || []).map((v, i) =>
        '<div class="ql-vote-bar" style="background:' + escapeHtml(v.color || '#444') + ';animation-delay:' + (i * 0.2) + 's">' +
          '<span class="ql-vote-bar__avatar">' + escapeHtml(v.avatar || '👤') + '</span>' +
          '<span class="ql-vote-bar__name">' + escapeHtml(v.name || '') + '</span>' +
        '</div>'
      ).join('');

      // Build the results HTML
      const gc = document.getElementById('gameContent');
      if (!gc) return;

      gc.innerHTML =
        '<div class="ql-results">' +
          '<div class="ql-results__question">' + escapeHtml(d.question || '') + '</div>' +
          '<div class="ql-results__split">' +
            // Side A
            '<div class="ql-results__side' + (aWins ? ' ql-results__side--winner' : bWins ? ' ql-results__side--loser' : '') + '">' +
              '<div class="ql-results__answer ql-results__answer--a' + (aWins ? ' ql-results__answer--winner-a' : '') + '">' +
                '<div class="ql-results__answer-text">"' + escapeHtml(sideA.answer || '') + '"</div>' +
              '</div>' +
              '<div class="ql-vote-stack" id="qlStackA">' + aBars + '</div>' +
              '<div class="ql-percentage ql-percentage--a' + (aWins ? ' ql-percentage--winner' : '') + (sideAPct === 0 ? ' ql-percentage--zero' : '') + '" id="qlPctA">0%</div>' +
              '<div class="ql-results__player">' +
                '<div class="ql-results__player-avatar' + (aWins ? ' ql-results__player-avatar--happy' : bWins ? ' ql-results__player-avatar--sad' : '') + '">' + escapeHtml(sideA.avatar || '👤') + '</div>' +
                '<div class="ql-results__player-name">' + escapeHtml(sideA.playerName || '') + '</div>' +
              '</div>' +
              '<div class="ql-points' + (sideA.quiplash ? ' ql-points--quiplash' : '') + '">+' + (sideA.points || 0) + '</div>' +
            '</div>' +
            // VS divider
            '<div class="ql-vs"><div class="ql-vs__badge">⚡</div></div>' +
            // Side B
            '<div class="ql-results__side' + (bWins ? ' ql-results__side--winner' : aWins ? ' ql-results__side--loser' : '') + '">' +
              '<div class="ql-results__answer ql-results__answer--b' + (bWins ? ' ql-results__answer--winner-b' : '') + '">' +
                '<div class="ql-results__answer-text">"' + escapeHtml(sideB.answer || '') + '"</div>' +
              '</div>' +
              '<div class="ql-vote-stack" id="qlStackB">' + bBars + '</div>' +
              '<div class="ql-percentage ql-percentage--b' + (bWins ? ' ql-percentage--winner' : '') + (sideBPct === 0 ? ' ql-percentage--zero' : '') + '" id="qlPctB">0%</div>' +
              '<div class="ql-results__player">' +
                '<div class="ql-results__player-avatar' + (bWins ? ' ql-results__player-avatar--happy' : aWins ? ' ql-results__player-avatar--sad' : '') + '">' + escapeHtml(sideB.avatar || '👤') + '</div>' +
                '<div class="ql-results__player-name">' + escapeHtml(sideB.playerName || '') + '</div>' +
              '</div>' +
              '<div class="ql-points' + (sideB.quiplash ? ' ql-points--quiplash' : '') + '">+' + (sideB.points || 0) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      // Animate percentages counting up
      this._animatePercentage('qlPctA', sideAPct, 1500);
      this._animatePercentage('qlPctB', sideBPct, 1500);

      // QUIPLASH moment overlay
      if (hasQuiplash) {
        setTimeout(() => this._showQuiplashMoment(), 1800);
      }

    } catch (e) {
      console.error('handleQuiplashMatchupResult error:', e);
      this.showToast('حصل خطأ، حاول مرة ثانية', 'error');
    }
  },

  /**
   * Animate a percentage element counting from 0 to target
   */
  _animatePercentage(elId, target, duration) {
    const el = document.getElementById(elId);
    if (!el) return;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = current + '%';
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  },

  /**
   * Show the QUIPLASH! moment full-screen flash overlay
   */
  _showQuiplashMoment() {
    const overlay = document.createElement('div');
    overlay.className = 'ql-quiplash-moment';
    overlay.innerHTML = '<div class="ql-quiplash-moment__text">⚡ QUIPLASH! ⚡</div>';
    document.body.appendChild(overlay);
    AudioEngine.quiplash();
    // Trigger confetti
    this.confetti();
    setTimeout(() => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.5s';
      setTimeout(() => overlay.remove(), 500);
    }, 2000);
  },

  // ═══════════════════════════════════════════════════════════════
  // 📊 خمّن النسبة (Guesspionage) - نظام كامل بالميكانيكيات الحقيقية
  // ═══════════════════════════════════════════════════════════════

  // اللاعب المميز يخمّن النسبة
  handleGuesspionageFeatured(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    document.getElementById('gameHint').textContent = '🎯 أنت المميز! خمّن النسبة بدقة';
    this.startTimer(d.timeLimit);
    if (d.commentary) this.showCommentary(d.commentary);
    AudioEngine.reveal();
    document.getElementById('gameContent').innerHTML =
      '<div class="gspy-featured-container">' +
        '<div class="gspy-badge gspy-badge--featured">🎯 أنت اللاعب المميز!</div>' +
        '<div class="gspy-question-card">' +
          '<div class="gspy-question-icon">📊</div>' +
          '<p class="gspy-question-text">' + escapeHtml(d.question) + '</p>' +
        '</div>' +
        '<div class="gspy-gauge-container">' +
          '<div class="gspy-gauge" id="gspyGauge" role="img" aria-label="مقياس النسبة المئوية">' +
            '<svg viewBox="0 0 200 120" class="gspy-gauge-svg" aria-hidden="true">' +
              '<defs>' +
                '<linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">' +
                  '<stop offset="0%" style="stop-color:#ff4444"/>' +
                  '<stop offset="50%" style="stop-color:#FFD93D"/>' +
                  '<stop offset="100%" style="stop-color:#00e676"/>' +
                '</linearGradient>' +
              '</defs>' +
              '<path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="12" stroke-linecap="round"/>' +
              '<path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" stroke-width="12" stroke-linecap="round" id="gaugeArc"/>' +
              '<circle cx="100" cy="100" r="6" fill="#fff" id="gaugeNeedle" class="gspy-needle"/>' +
              '<line x1="100" y1="100" x2="100" y2="30" stroke="#fff" stroke-width="3" stroke-linecap="round" id="gaugeLine" class="gspy-needle-line"/>' +
            '</svg>' +
          '</div>' +
          '<div class="gspy-percent-display" id="percentDisplay" aria-live="polite" role="status">50%</div>' +
          '<div class="gspy-compound-input">' +
            '<button class="gspy-step-btn" data-step="-5" aria-label="ناقص 5">-5</button>' +
            '<button class="gspy-step-btn" data-step="-1" aria-label="ناقص 1">-1</button>' +
            '<input type="range" class="gspy-slider" id="percentSlider" min="0" max="100" value="50" aria-label="اختر نسبة تخمينك من 0 إلى 100" oninput="App._updateGauge(this.value)">' +
            '<button class="gspy-step-btn" data-step="1" aria-label="زائد 1">+1</button>' +
            '<button class="gspy-step-btn" data-step="5" aria-label="زائد 5">+5</button>' +
          '</div>' +
          '<div class="gspy-slider-labels"><span>0%</span><span>50%</span><span>100%</span></div>' +
        '</div>' +
        '<button class="btn btn--primary btn--lg btn--full gspy-submit-btn" data-action="submitGuess">تأكيد تخميني! 📊</button>' +
      '</div>';
    this._updateGauge(50);
  },

  // باقي اللاعبين ينتظرون اللاعب المميز
  handleGuesspionageWaitFeatured(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    document.getElementById('gameHint').textContent = '⏳ انتظر ' + escapeHtml(d.featuredPlayerName) + ' يخمّن...';
    this.startTimer(d.timeLimit);
    if (d.commentary) this.showCommentary(d.commentary);
    document.getElementById('gameContent').innerHTML =
      '<div class="gspy-wait-container">' +
        '<div class="gspy-question-card">' +
          '<div class="gspy-question-icon">📊</div>' +
          '<p class="gspy-question-text">' + escapeHtml(d.question) + '</p>' +
        '</div>' +
        '<div class="gspy-featured-spotlight">' +
          '<div class="gspy-spotlight-icon">🎯</div>' +
          '<p class="gspy-spotlight-name">' + escapeHtml(d.featuredPlayerName) + '</p>' +
          '<p class="gspy-spotlight-label">يخمّن النسبة...</p>' +
          '<div class="spinner mt-4"></div>' +
        '</div>' +
      '</div>';
  },

  // اللاعب المميز ينتظر بعد ما خمّن
  handleGuesspionageFeaturedWaiting(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    document.getElementById('gameHint').textContent = '📊 تخمينك: ' + d.yourGuess + '% — الباقين يراهنون الحين';
    this.startTimer(d.timeLimit);
    document.getElementById('gameContent').innerHTML =
      '<div class="gspy-result-container">' +
        '<div class="gspy-badge gspy-badge--featured">🎯 تخمينك</div>' +
        '<div class="gspy-question-card gspy-question-card--sm">' +
          '<p class="gspy-question-text">' + escapeHtml(d.question) + '</p>' +
        '</div>' +
        '<div class="gspy-your-guess">' +
          '<div class="gspy-guess-number">' + d.yourGuess + '%</div>' +
          '<p class="gspy-guess-label">تخمينك</p>' +
        '</div>' +
        '<div class="gspy-waiting-others">' +
          '<div class="spinner"></div>' +
          '<p>الباقين يراهنون أعلى أو أقل...</p>' +
        '</div>' +
      '</div>';
  },

  // مرحلة التحدي - أعلى أو أقل (+ much higher/lower in round 2)
  handleGuesspionageChallenge(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    document.getElementById('gameHint').textContent = '🔮 الجواب أعلى أو أقل من ' + d.featuredGuess + '%؟';
    this.startTimer(d.timeLimit);
    AudioEngine.whoosh();
    if (d.commentary) this.showCommentary(d.commentary);

    let buttonsHtml =
      '<button class="gspy-bet-btn gspy-bet-btn--higher" data-action="submitGuess" data-bet="higher" aria-label="الجواب أعلى من التخمين">' +
        '<span class="gspy-bet-arrow">▲</span>' +
        '<span class="gspy-bet-text">أعلى</span>' +
      '</button>' +
      '<button class="gspy-bet-btn gspy-bet-btn--lower" data-action="submitGuess" data-bet="lower" aria-label="الجواب أقل من التخمين">' +
        '<span class="gspy-bet-arrow">▼</span>' +
        '<span class="gspy-bet-text">أقل</span>' +
      '</button>';

    let muchHtml = '';
    if (d.hasMuch) {
      muchHtml =
        '<div class="gspy-much-label mt-4">🎲 أو راهن أكبر!</div>' +
        '<div class="gspy-bet-buttons gspy-bet-buttons--much">' +
          '<button class="gspy-bet-btn gspy-bet-btn--much-higher" data-action="submitGuess" data-bet="much_higher" aria-label="الجواب أعلى بكثير">' +
            '<span class="gspy-bet-arrow">▲▲</span>' +
            '<span class="gspy-bet-text">أعلى بكثير</span>' +
            '<span class="gspy-bet-sub">+2000 أو 0!</span>' +
          '</button>' +
          '<button class="gspy-bet-btn gspy-bet-btn--much-lower" data-action="submitGuess" data-bet="much_lower" aria-label="الجواب أقل بكثير">' +
            '<span class="gspy-bet-arrow">▼▼</span>' +
            '<span class="gspy-bet-text">أقل بكثير</span>' +
            '<span class="gspy-bet-sub">+2000 أو 0!</span>' +
          '</button>' +
        '</div>';
    }

    document.getElementById('gameContent').innerHTML =
      '<div class="gspy-challenge-container">' +
        '<div class="gspy-question-card gspy-question-card--sm">' +
          '<p class="gspy-question-text">' + escapeHtml(d.question) + '</p>' +
        '</div>' +
        '<div class="gspy-featured-guess-display">' +
          '<p class="gspy-featured-label">' + escapeHtml(d.featuredPlayerName) + ' خمّن:</p>' +
          '<div class="gspy-featured-number">' + d.featuredGuess + '%</div>' +
        '</div>' +
        '<div class="gspy-challenge-prompt">الجواب الصحيح أعلى أو أقل؟</div>' +
        '<div class="gspy-bet-buttons">' + buttonsHtml + '</div>' +
        muchHtml +
        '<p class="text-muted mt-4" id="waitingCount"></p>' +
      '</div>';
  },

  // مساعد: تحديث مقياس الدائرة (مع throttle 50ms)
  _gaugeTimer: null,
  _updateGauge(val) {
    val = Math.max(0, Math.min(100, parseInt(val) || 0));
    const slider = document.getElementById('percentSlider');
    if (slider && parseInt(slider.value) !== val) slider.value = val;

    if (this._gaugeTimer) return;
    this._gaugeTimer = setTimeout(() => {
      this._gaugeTimer = null;
      this._renderGaugeNeedle(val);
    }, 50);
    this._renderGaugeNeedle(val);
  },

  _renderGaugeNeedle(val) {
    const display = document.getElementById('percentDisplay');
    if (display) display.textContent = val + '%';

    const angle = -90 + (val / 100) * 180;
    const radians = (angle * Math.PI) / 180;
    const needleLen = 65;
    const cx = 100, cy = 100;
    const nx = cx + needleLen * Math.cos(radians);
    const ny = cy + needleLen * Math.sin(radians);

    const line = document.getElementById('gaugeLine');
    if (line) {
      line.setAttribute('x2', nx);
      line.setAttribute('y2', ny);
    }
  },

  _stepGauge(delta) {
    const slider = document.getElementById('percentSlider');
    if (!slider) return;
    const newVal = Math.max(0, Math.min(100, parseInt(slider.value) + delta));
    slider.value = newVal;
    this._updateGauge(newVal);
  },

  // backward compat - old handler
  handleGuesspionageQuestion(d) {
    this.handleGuesspionageFeatured(d);
  },

  submitGuess(e) {
    if (this._submitting) return;
    // التحقق إذا كان رهان أعلى/أقل
    const clickedBet = e?.target?.closest('[data-bet]');

    if (clickedBet) {
      // مرحلة التحدي - أعلى أو أقل
      const bet = clickedBet.getAttribute('data-bet');
      this._submitting = true;
      AudioEngine.submit();

      // تمييز الزر المختار
      document.querySelectorAll('.gspy-bet-btn').forEach(b => b.classList.remove('gspy-bet-btn--selected'));
      clickedBet.classList.add('gspy-bet-btn--selected');

      this.socket.emit('submitAnswer', { code: this.currentRoom, answer: bet });

      // عرض حالة الانتظار
      clickedBet.innerHTML = '<span class="gspy-bet-text">✓ تم!</span>';
      document.querySelectorAll('.gspy-bet-btn:not(.gspy-bet-btn--selected)').forEach(b => {
        b.style.opacity = '0.3';
        b.style.pointerEvents = 'none';
      });
    } else {
      // مرحلة التخمين - اللاعب المميز
      const val = document.getElementById('percentSlider')?.value;
      if (val === undefined) return;
      this._submitting = true;
      AudioEngine.submit();
      this.socket.emit('submitAnswer', { code: this.currentRoom, answer: val });
      this.showWaiting('جاري إرسال تخمينك...');
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 🕵️ المزيّف (Fakin' It)
  // ═══════════════════════════════════════════════════════════════

  handleFakinItTask(d) {
    const subInfo = d.maxSubRounds ? ' (مهمة ' + d.subRound + '/' + d.maxSubRounds + ')' : '';
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds + subInfo;
    this.startTimer(d.timeLimit);
    if (d.commentary) this.showCommentary(d.commentary);

    // Task type icons/instructions per category
    const categoryIcons = {
      handsOfTruth: '✋',
      numberPressure: '🔢',
      faceValue: '😀',
      youGottaPoint: '👉'
    };
    const categoryHints = {
      handsOfTruth: 'ارفع يدك إذا ينطبق عليك!',
      numberPressure: 'ارفع أصابع حسب جوابك!',
      faceValue: 'وريّنا تعبير وجهك!',
      youGottaPoint: 'أشر على اللاعب!'
    };
    const catIcon = categoryIcons[d.categoryKey] || '🎭';
    const catHint = categoryHints[d.categoryKey] || '';

    let html;
    if (d.isFaker) {
      html =
        '<div class="panel" style="max-width:600px;background:linear-gradient(135deg,#8B0000,#4a0000)">' +
          '<div class="badge badge--error mb-4">🕵️ أنت المزيّف!</div>' +
          '<div class="text-4xl mb-4">' + catIcon + '</div>' +
          '<p class="text-2xl font-bold mb-4">ما تعرف المهمة!</p>' +
          '<p class="text-muted mb-2">النوع: ' + escapeHtml(d.category) + '</p>' +
          '<p class="text-muted">حاول تتصرف طبيعي وما ينكشف أمرك!</p>' +
          '<button class="btn btn--secondary btn--full mt-6" data-action="submitFakinAction">جاهز! 🎭</button>' +
        '</div>';
    } else {
      html =
        '<div class="panel" style="max-width:600px">' +
          '<div class="badge badge--warning mb-4">' + escapeHtml(d.category) + '</div>' +
          '<div class="text-4xl mb-4">' + catIcon + '</div>' +
          (catHint ? '<p class="text-sm text-muted mb-2">' + catHint + '</p>' : '') +
          '<p class="text-sm text-muted mb-2">' + escapeHtml(d.instruction) + '</p>' +
          '<p class="text-2xl font-bold mb-6">' + escapeHtml(d.task) + '</p>' +
          '<button class="btn btn--primary btn--full" data-action="submitFakinAction">جاهز! ✅</button>' +
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
    try {
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
    } catch (e) {
      console.error('handleTriviaMurderResults error:', e);
      this.showToast('حصل خطأ، حاول مرة ثانية', 'error');
    }
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
        '<button class="btn btn--primary btn--full" data-action="submitDeathAnswer" style="background:#DC143C">أنقذ نفسك! 🏃</button>' +
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
    try {
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
    } catch (e) {
      console.error('handleDeathChallengeResult error:', e);
      this.showToast('حصل خطأ، حاول مرة ثانية', 'error');
    }
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
        '<button class="btn btn--primary btn--full" data-action="submitLie">إرسال 🎭</button>' +
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
      '<div class="color-swatch' + (i === 0 ? ' active' : '') + '" style="background:' + c + '" data-action="setDrawColor" data-color="' + c + '"></div>'
    ).join('');

    const sizes = DRAW_SIZES.map((s, i) =>
      '<div class="brush-size' + (i === 1 ? ' active' : '') + '" data-action="setBrushSize" data-size="' + s + '">' +
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
          '<button class="btn--undo" data-action="undoStroke">↩️ تراجع</button>' +
          '<button class="btn--undo" data-action="setEraser">🧹 ممحاة</button>' +
          '<button class="btn btn--ghost btn--sm" data-action="clearCanvas" style="margin-right:8px">🗑️</button>' +
        '</div>' +
        '<button class="btn btn--primary btn--full mt-4" data-action="submitDrawing">أرسل الرسمة 🎨</button>' +
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
          '<button class="btn btn--primary btn--full" data-action="submitGuessDrawful">إرسال 🤔</button>' +
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
    // Show Quiplash-specific submitted state if in quiplash
    if (this.currentGame === 'quiplash') {
      this._showQuiplashSubmitted(ans);
    } else {
      this.showWaiting('ننتظر الإجابات...');
    }
  },

  voteAnswer(id, el) {
    // Handle new Quiplash bubble voting
    const bubble = el.closest('.ql-bubble');
    if (bubble) {
      document.querySelectorAll('.ql-bubble').forEach(b => {
        b.classList.remove('ql-bubble--selected', 'ql-bubble--dimmed');
      });
      bubble.classList.add('ql-bubble--selected');
      // Dim the other bubble
      document.querySelectorAll('.ql-bubble').forEach(b => {
        if (b !== bubble) b.classList.add('ql-bubble--dimmed');
      });
      // Show lock
      if (!bubble.querySelector('.ql-bubble__lock')) {
        const lock = document.createElement('div');
        lock.className = 'ql-bubble__lock';
        lock.textContent = '🔒 صوّت!';
        bubble.appendChild(lock);
      }
      AudioEngine.vote();
      this.socket.emit('submitVote', { code: this.currentRoom, voteId: id });
      return;
    }
    // Fallback for other games
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
        AudioEngine.drumRoll(1.5);
        setTimeout(() => AudioEngine.reveal(), 1600);

        // Final round has different display
        if (d.isFinalRound && d.options) {
          resultHtml = '<div class="gspy-results">' +
            '<div class="gspy-badge gspy-badge--featured mb-4">🏆 نتائج الجولة الأخيرة</div>' +
            '<div class="gspy-final-grid" style="margin-bottom:16px">';
          const rankIcons = { 1: '🥇', 2: '🥈', 3: '🥉' };
          d.options.forEach(o => {
            const cls = o.isTop3 ? 'gspy-final-option--selected' : '';
            const rankBadge = o.rank ? '<div class="gspy-rank-badge">' + rankIcons[o.rank] + ' #' + o.rank + ' (+' + o.rankPoints + ')</div>' : '';
            resultHtml +=
              '<div class="gspy-final-option ' + cls + '" style="cursor:default">' +
                rankBadge +
                escapeHtml(o.text) +
                '<div class="text-sm mt-1" style="opacity:0.7">' + o.percentage + '%</div>' +
              '</div>';
          });
          resultHtml += '</div>';
          if (d.playerResults) {
            resultHtml += '<div class="gspy-results-players">';
            d.playerResults.forEach(pr => {
              const rowClass = pr.correctPicks > 0 ? 'gspy-results-row--correct' : 'gspy-results-row--wrong';
              resultHtml +=
                '<div class="gspy-results-row ' + rowClass + '">' +
                  '<div class="gspy-results-row-info">' +
                    '<span class="gspy-results-row-name">' + escapeHtml(pr.playerName) + '</span>' +
                    '<span class="gspy-results-row-detail">' + pr.correctPicks + '/3 صح ✅</span>' +
                  '</div>' +
                  '<span class="gspy-results-row-points">+' + pr.points + '</span>' +
                '</div>';
            });
            resultHtml += '</div>';
          }
          resultHtml += '</div>';
          break;
        }

        // Staged reveal: Beat 1 — question + gauge placeholder
        resultHtml =
          '<div class="gspy-results">' +
            '<div class="gspy-results-answer">' +
              '<div class="gspy-results-label">الإجابة الصحيحة...</div>' +
              '<div class="gspy-reveal-gauge" id="revealGauge">' +
                '<svg viewBox="0 0 200 120" class="gspy-gauge-svg" aria-hidden="true">' +
                  '<defs>' +
                    '<linearGradient id="revealGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">' +
                      '<stop offset="0%" style="stop-color:#ff4444"/>' +
                      '<stop offset="50%" style="stop-color:#FFD93D"/>' +
                      '<stop offset="100%" style="stop-color:#00e676"/>' +
                    '</linearGradient>' +
                  '</defs>' +
                  '<path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="12" stroke-linecap="round"/>' +
                  '<path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#revealGaugeGrad)" stroke-width="12" stroke-linecap="round"/>' +
                  '<circle cx="100" cy="100" r="6" fill="#fff"/>' +
                  '<line x1="100" y1="100" x2="100" y2="35" stroke="#fff" stroke-width="3" stroke-linecap="round" id="revealNeedle" class="gspy-needle-line" style="transition:all 1.5s ease-out"/>' +
                  (d.featuredGuess !== undefined ? '<line x1="100" y1="100" x2="100" y2="40" stroke="#FFD93D" stroke-width="2" stroke-linecap="round" id="revealGuessMarker" style="opacity:0.5;transition:all 0.5s ease-out"/>' : '') +
                '</svg>' +
              '</div>' +
              '<div class="gspy-results-number gspy-reveal-number" id="revealNumber" style="opacity:0;transform:scale(0)">?</div>' +
            '</div>';

        // Pre-build comparison and player rows (hidden initially)
        let comparisonHtml = '';
        if (d.featuredGuess !== undefined) {
          const featDiff = Math.abs(d.featuredGuess - d.correctAnswer);
          comparisonHtml =
            '<div class="gspy-results-comparison gspy-reveal-beat" id="revealComparison" style="opacity:0;transform:translateY(20px)">' +
              '<div class="gspy-results-vs">' +
                '<div class="gspy-results-vs-item">' +
                  '<span class="gspy-results-vs-label">' + escapeHtml(d.featuredPlayerName || '') + ' خمّن</span>' +
                  '<span class="gspy-results-vs-value">' + d.featuredGuess + '%</span>' +
                '</div>' +
                '<div class="gspy-results-vs-arrow">' + (d.correctAnswer > d.featuredGuess ? '▲ أعلى' : d.correctAnswer < d.featuredGuess ? '▼ أقل' : '= متساوي') + '</div>' +
                '<div class="gspy-results-vs-item">' +
                  '<span class="gspy-results-vs-label">الإجابة الصحيحة</span>' +
                  '<span class="gspy-results-vs-value">' + d.correctAnswer + '%</span>' +
                '</div>' +
              '</div>' +
              '<div class="gspy-results-diff">الفرق: ' + featDiff + '%</div>' +
            '</div>';
        }
        resultHtml += comparisonHtml;

        if (d.playerResults) {
          resultHtml += '<div class="gspy-results-players" id="revealPlayers" style="opacity:0;transform:translateY(20px)">';
          d.playerResults.forEach((pr, idx) => {
            let info = '';
            if (pr.isFeatured) {
              info = '🎯 ' + (pr.accuracy || '') + ' (فرق ' + pr.diff + '%)';
            } else if (pr.bet) {
              const betLabels = { higher: '▲ أعلى', lower: '▼ أقل', much_higher: '▲▲ أعلى بكثير', much_lower: '▼▼ أقل بكثير' };
              info = (betLabels[pr.bet] || pr.bet) + ' ' + (pr.betCorrect ? '✅' : '❌');
            } else {
              info = '⏱️ ما جاوب';
            }
            const rowClass = pr.points > 0 ? 'gspy-results-row--correct' : 'gspy-results-row--wrong';
            resultHtml +=
              '<div class="gspy-results-row ' + rowClass + '" style="opacity:0;transform:translateY(10px);transition:all 0.3s ease-out ' + (idx * 100) + 'ms">' +
                '<div class="gspy-results-row-info">' +
                  '<span class="gspy-results-row-name">' + escapeHtml(pr.playerName) + '</span>' +
                  '<span class="gspy-results-row-detail">' + info + '</span>' +
                '</div>' +
                '<span class="gspy-results-row-points">+' + pr.points + '</span>' +
              '</div>';
          });
          resultHtml += '</div>';
        }
        resultHtml += '</div>';

        // Schedule staged reveal animations after DOM render
        setTimeout(() => {
          // Beat 2 (1600ms): Animate gauge needle to truth
          const needle = document.getElementById('revealNeedle');
          if (needle) {
            const truthAngle = -90 + (d.correctAnswer / 100) * 180;
            const truthRad = (truthAngle * Math.PI) / 180;
            const nx = 100 + 65 * Math.cos(truthRad);
            const ny = 100 + 65 * Math.sin(truthRad);
            needle.setAttribute('x2', nx);
            needle.setAttribute('y2', ny);
          }
          // Position guess marker
          if (d.featuredGuess !== undefined) {
            const marker = document.getElementById('revealGuessMarker');
            if (marker) {
              const guessAngle = -90 + (d.featuredGuess / 100) * 180;
              const guessRad = (guessAngle * Math.PI) / 180;
              marker.setAttribute('x2', 100 + 55 * Math.cos(guessRad));
              marker.setAttribute('y2', 100 + 55 * Math.sin(guessRad));
            }
          }
          // Number reveal
          const numEl = document.getElementById('revealNumber');
          if (numEl) {
            numEl.textContent = d.correctAnswer + '%';
            numEl.style.opacity = '1';
            numEl.style.transform = 'scale(1)';
          }
          // Update label
          const labelEl = document.querySelector('.gspy-results-label');
          if (labelEl) labelEl.textContent = 'الإجابة الصحيحة';
        }, 1600);

        // Beat 3 (3000ms): Fade in comparison + player rows
        setTimeout(() => {
          const comp = document.getElementById('revealComparison');
          if (comp) { comp.style.opacity = '1'; comp.style.transform = 'translateY(0)'; }
          const players = document.getElementById('revealPlayers');
          if (players) {
            players.style.opacity = '1';
            players.style.transform = 'translateY(0)';
            // Stagger each row
            players.querySelectorAll('.gspy-results-row').forEach(row => {
              row.style.opacity = '1';
              row.style.transform = 'translateY(0)';
            });
          }
        }, 3000);
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
      ? '<button class="btn btn--primary btn--lg mt-6" data-action="requestNextRound">' + (d.isLastRound ? 'النتائج 🏆' : 'التالي ➡️') + '</button>'
      : '<p class="text-muted mt-4">انتظر المضيف...</p>';

    const quipHtml = d.transitionQuip
      ? '<div class="transition-quip mt-4">' +
          '<span class="transition-quip__icon">' + d.transitionQuip.icon + '</span>' +
          '<span class="transition-quip__text">' + escapeHtml(d.transitionQuip.text) + '</span>' +
        '</div>'
      : '';

    document.getElementById('gameContent').innerHTML =
      '<div class="text-center" style="max-width:500px;width:100%">' +
        resultHtml +
        '<div class="scoreboard mt-6">' + scores + '</div>' +
        quipHtml +
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

    // عرض الجوائز
    const awardsEl = document.getElementById('gameAwards');
    if (awardsEl && d.awards && d.awards.length > 0) {
      awardsEl.innerHTML = '<h3 class="awards__title">جوائز اللعبة</h3>' +
        d.awards.map(a =>
          '<div class="award-card">' +
            '<span class="award-card__icon">' + a.icon + '</span>' +
            '<div class="award-card__info">' +
              '<div class="award-card__title">' + escapeHtml(a.title) + '</div>' +
              '<div class="award-card__name">' + escapeHtml(a.name) + '</div>' +
              '<div class="award-card__detail">' + escapeHtml(a.detail) + '</div>' +
            '</div>' +
          '</div>'
        ).join('');
      awardsEl.classList.remove('hidden');
    }

    const actionsEl = document.getElementById('resultsActions');
    if (actionsEl) {
      actionsEl.innerHTML = this.isHost
        ? '<button class="btn btn--primary btn--lg" data-action="backToLobby">🔄 مرة ثانية</button>'
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
  // 🧔🏻 Abu Abed Commentary Display
  // ═══════════════════════════════════════════════════════════════

  showCommentary(commentary) {
    if (!commentary) return;
    const items = Array.isArray(commentary) ? commentary : [commentary];
    const bar = document.getElementById('commentaryBar');
    if (!bar) return;
    let delay = 0;
    items.forEach(c => {
      if (!c || !c.text) return;
      setTimeout(() => {
        bar.innerHTML =
          '<div class="commentary-bubble">' +
            '<span class="commentary-icon">' + (c.icon || '🧔🏻') + '</span>' +
            '<span class="commentary-text">' + escapeHtml(c.text) + '</span>' +
          '</div>';
        bar.classList.remove('hidden');
        bar.classList.add('commentary-enter');
        setTimeout(() => {
          bar.classList.remove('commentary-enter');
          bar.classList.add('commentary-leave');
          setTimeout(() => { bar.classList.add('hidden'); bar.classList.remove('commentary-leave'); }, 500);
        }, 4000);
      }, delay);
      delay += 4500;
    });
  },

  // ═══════════════════════════════════════════════════════════════
  // 📊 Guesspionage Final Round (Pick Top 3)
  // ═══════════════════════════════════════════════════════════════

  handleGuesspionageFinalRound(d) {
    document.getElementById('gameRound').textContent = '🏆 الجولة الأخيرة!';
    document.getElementById('gameHint').textContent = '🎯 اختر الـ 3 الأكثر شعبية!';
    this.startTimer(d.timeLimit);
    if (d.commentary) this.showCommentary(d.commentary);

    const optionsHtml = d.options.map(o =>
      '<button class="gspy-final-option" data-pick-id="' + o.id + '">' +
        escapeHtml(o.text) +
      '</button>'
    ).join('');

    document.getElementById('gameContent').innerHTML =
      '<div class="gspy-final-container">' +
        '<div class="gspy-badge gspy-badge--featured">🏆 الجولة الأخيرة</div>' +
        '<p class="text-xl font-bold mb-4">اختر 3 إجابات تعتقد إنها الأكثر شعبية</p>' +
        '<div class="gspy-final-grid" id="finalPicksGrid">' + optionsHtml + '</div>' +
        '<p class="text-muted mt-2" id="pickCount">اخترت 0 من 3</p>' +
        '<button class="btn btn--primary btn--lg btn--full mt-4" data-action="submitFinalPicks" id="submitFinalBtn" disabled>تأكيد اختياراتي! 📊</button>' +
      '</div>';

    // Toggle picks
    this._finalPicks = new Set();
    document.getElementById('finalPicksGrid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pick-id]');
      if (!btn || this._submitting) return;
      const pickId = parseInt(btn.getAttribute('data-pick-id'));

      if (this._finalPicks.has(pickId)) {
        this._finalPicks.delete(pickId);
        btn.classList.remove('gspy-final-option--selected');
      } else if (this._finalPicks.size < 3) {
        this._finalPicks.add(pickId);
        btn.classList.add('gspy-final-option--selected');
      }

      const count = this._finalPicks.size;
      document.getElementById('pickCount').textContent = 'اخترت ' + count + ' من 3';
      const submitBtn = document.getElementById('submitFinalBtn');
      if (submitBtn) submitBtn.disabled = count !== 3;
    });
  },

  submitFinalPicks() {
    if (this._submitting || !this._finalPicks || this._finalPicks.size !== 3) return;
    this._submitting = true;
    AudioEngine.submit();
    this.socket.emit('submitAnswer', {
      code: this.currentRoom,
      answer: JSON.stringify(Array.from(this._finalPicks))
    });
    this.showWaiting('تم إرسال اختياراتك...');
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
    document.body.setAttribute('data-reduced-motion', checked ? 'true' : 'false');
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

// All animations, spinner, confetti, toast, dead-player styles
// are now defined in game-screens.css (no more inline style injection)

// ═══════════════════════════════════════════════════════════════════
// تشغيل التطبيق
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => App.init());
