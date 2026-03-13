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
  "خليك جريء وارفع راسك!",
  "لا تصدق كل اللي يقولونه!"
];

const GAMES = {
  quiplash:       { icon: '⚡', name: 'رد سريع',        hint: 'اكتب أطرف إجابة!',                pattern: 'pattern-stage' },
  guesspionage:   { icon: '📊', name: 'خمّن النسبة',     hint: 'خمّن النسبة الصحيحة!',             pattern: 'pattern-matrix' },
  fakinit:        { icon: '🕵️', name: 'المزيّف',         hint: 'اكتشف المزيّف!',                   pattern: 'pattern-deception' },
  triviamurder:   { icon: '💀', name: 'حفلة القاتل',     hint: 'أجب صح أو مت!',                    pattern: 'pattern-blood' },
  fibbage:        { icon: '🎭', name: 'كشف الكذاب',      hint: 'اكتب كذبة مقنعة!',                 pattern: 'pattern-newspaper' },
  drawful:        { icon: '🎨', name: 'ارسم لي',         hint: 'ارسم الكلمة!',                     pattern: 'pattern-paint' },
  tshirtwars:     { icon: '👕', name: 'حرب التيشيرتات',  hint: 'اكتب أفضل شعار!',                  pattern: 'pattern-rays' },
  trynottolol:    { icon: '😂', name: 'لا تضحك',         hint: 'اكتب أطرف جواب!',                  pattern: 'pattern-dots' },
  inventions:     { icon: '💡', name: 'اختراعات مجنونة',  hint: 'اخترع شي مجنون!',                  pattern: 'pattern-grid' },
  wouldyourather: { icon: '🤔', name: 'تبي ولا ما تبي',  hint: 'اختر خيار!',                       pattern: 'pattern-zigzag' },
  whosaidit:      { icon: '💬', name: 'من قال؟',         hint: 'خمّن مين كتب هالكلام!',            pattern: 'pattern-stripes' },
  speedround:     { icon: '⚡', name: 'أسرع واحد',       hint: 'أجب أسرع من الكل!',                pattern: 'pattern-confetti' },
  backseatgamer:  { icon: '🎮', name: 'سوّاق أعمى',      hint: 'وصّف أو خمّن!',                    pattern: 'pattern-waves' },
  splittheroom:   { icon: '🔀', name: 'سبليت ذا روم',    hint: 'اقسم الغرفة!',                     pattern: 'pattern-halftone' },
  courtroom:      { icon: '👨‍⚖️', name: 'المحكمة الكبرى',  hint: 'ادّعي أو دافع!',                   pattern: 'pattern-noise' },
  debateme:       { icon: '⚖️', name: 'المحكمة',         hint: 'قنع الباقين برأيك!',               pattern: 'pattern-spotlight' },
  punishmentwheel:{ icon: '🎡', name: 'عجلة العقاب',     hint: 'جاوب صح أو انعاقب!',               pattern: 'pattern-triangles' }
};

const DRAW_COLORS = ['#000000', '#ff0000', '#0066ff', '#00aa00', '#ff8800', '#9900cc', '#ff69b4', '#8B4513', '#FFD700', '#00CED1', '#808080', '#ffffff'];
const DRAW_SIZES = [4, 8, 16];

// ═══════════════════════════════════════════════════════════════════
// TV SHOW FRAMEWORK - Screen State Machine
// Unified Jackbox-style scene management with pacing
// ═══════════════════════════════════════════════════════════════════

const ScreenMachine = {
  // Current state
  current: 'BOOT',
  previousState: null,
  _roundIntroTimer: null,

  // Valid states
  STATES: ['BOOT', 'MENU', 'LOBBY', 'HOW_TO_PLAY', 'COUNTDOWN', 'ROUND_INTRO',
           'QUESTION', 'ANSWER_INPUT', 'LOCKED_IN', 'REVEAL', 'SCOREBOARD',
           'ROUND_OUTRO', 'WINNER', 'RESULTS'],

  // Minimum display times (ms)
  PACE: {
    ROUND_INTRO: 1800,
    LOCKED_IN: 400,
    REVEAL: 600,
    SCOREBOARD: 1200,
    ROUND_OUTRO: 1000,
  },

  transition(newState) {
    this.previousState = this.current;
    this.current = newState;
  },

  // Show round intro card ("الجولة X")
  showRoundIntro(round, maxRounds, gameName, callback) {
    const overlay = document.getElementById('roundIntroOverlay');
    const labelEl = document.getElementById('roundIntroLabel');
    const numEl = document.getElementById('roundIntroNumber');
    const subEl = document.getElementById('roundIntroSub');
    if (!overlay || !labelEl || !numEl) { if (callback) callback(); return; }

    // Skip if reduced motion
    if (App.reducedMotion) { if (callback) callback(); return; }

    this.transition('ROUND_INTRO');
    labelEl.textContent = 'الجولة';
    numEl.textContent = round;
    subEl.textContent = gameName ? (gameName + (maxRounds ? ' • ' + round + ' من ' + maxRounds : '')) : '';
    overlay.classList.remove('hidden', 'round-intro--exit');

    if (typeof AudioEngine !== 'undefined') AudioEngine.whoosh();

    this._roundIntroTimer = setTimeout(() => {
      overlay.classList.add('round-intro--exit');
      setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('round-intro--exit');
        if (callback) callback();
      }, 300);
    }, this.PACE.ROUND_INTRO);
  },

  // Show lock-in state (after answer submission)
  showLockIn(gameContent) {
    if (!gameContent) return;
    this.transition('LOCKED_IN');
    gameContent.innerHTML =
      '<div class="locked-in">' +
        '<div class="locked-in__icon">🔒</div>' +
        '<div class="locked-in__text">تم الإرسال!</div>' +
        '<div class="locked-in__sub">ننتظر باقي اللاعبين...</div>' +
      '</div>';
  },

  // Update answer progress in HUD
  updateAnswerProgress(count, total) {
    let el = document.getElementById('answerProgressHud');
    if (!el) {
      const center = document.querySelector('.game-hud__center');
      if (!center) return;
      center.innerHTML = '<div class="answer-progress" id="answerProgressHud">' +
        '<span id="apCount">' + count + '/' + total + '</span>' +
        '<div class="answer-progress__bar"><div class="answer-progress__fill" id="apFill"></div></div>' +
      '</div>';
      el = document.getElementById('answerProgressHud');
    }
    const countEl = document.getElementById('apCount');
    const fillEl = document.getElementById('apFill');
    if (countEl) countEl.textContent = count + '/' + total;
    if (fillEl) fillEl.style.width = Math.round((count / total) * 100) + '%';
  },

  cleanup() {
    if (this._roundIntroTimer) {
      clearTimeout(this._roundIntroTimer);
      this._roundIntroTimer = null;
    }
    const overlay = document.getElementById('roundIntroOverlay');
    if (overlay) overlay.classList.add('hidden');
  }
};

// ═══════════════════════════════════════════════════════════════════
// الأداة المساعدة: حماية XSS
// ═══════════════════════════════════════════════════════════════════

function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Bidi-safe player name: wraps in <bdi dir="auto"> to prevent RTL/LTR corruption
function bdiName(str) {
  return '<bdi dir="auto">' + escapeHtml(str) + '</bdi>';
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
  // Game-Aware Avatar Helper
  // Uses per-game DiceBear style + CSS wrapper when in a game
  // ─────────────────────────────────────────────
  _gAvatar(avatarData, size, fallback) {
    if (!avatarData || typeof AvatarSystem === 'undefined') return escapeHtml(fallback || '👤');
    if (this.currentGame) {
      return AvatarSystem.getGameAvatarHtml(avatarData, this.currentGame, size);
    }
    return AvatarSystem.getAvatarHtml(avatarData, size);
  },

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
    this._setupOfflineDetection();

    // Auto-enable stream mode via URL parameter (?stream) or /tv route
    const urlParams = new URLSearchParams(window.location.search);
    const isTvRoute = window.location.pathname.startsWith('/tv');
    if (urlParams.has('stream') || isTvRoute) {
      document.body.classList.add('stream-mode');
      this._streamMode = true;
    }
    // Auto-fill room code from /tv/:code route
    if (isTvRoute) {
      const tvCode = window.location.pathname.split('/tv/')[1];
      if (tvCode) {
        const codeInput = document.getElementById('roomCodeInput');
        if (codeInput) codeInput.value = tvCode.toUpperCase();
      }
    }

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

    // Browser back button support
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.screen) {
        this._poppingState = true;
        this.showScreen(e.state.screen);
      } else {
        // Default: go to menu if no state
        this._poppingState = true;
        this.showScreen('menuScreen');
      }
    });

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
        case 'submitDeathAnswer': this.submitDeathAnswer(btn.dataset.chalice); break;
        case 'submitLie': this.submitLie(); break;
        case 'submitDrawing': this.submitDrawing(); break;
        case 'submitGuessDrawful': this.submitGuessDrawful(); break;
        case 'submitFinalPicks': this.submitFinalPicks(); break;
        case 'submitCourtroomVote': this.submitCourtroomVote(target.dataset.vote); break;
        case 'submitWyrChoice': this.submitWyrChoice(target.getAttribute('data-choice'), target); break;
        case 'guessWhoSaidIt': this.guessWhoSaidIt(target.getAttribute('data-player'), target); break;
        case 'submitSplitVote': this.submitSplitVote(target.getAttribute('data-vote'), target); break;
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
        case 'submitTkoSlogans': this.submitTkoSlogans(); break;
        case 'chooseTkoSlogan': this.chooseTkoSlogan(target.getAttribute('data-slogan'), target); break;
        case 'submitFinalHL': this.submitFinalHL(target.getAttribute('data-hl'), target); break;
      }
    });

    // ── Event Delegation لشاشة النتائج النهائية ──
    document.getElementById('resultsActions')?.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.getAttribute('data-action');
      if (action === 'backToLobby') this.backToLobby();
    });

    // ── Document-level Event Delegation (menu, lobby, settings, emoji) ──
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      // Skip if already handled by gameContent or resultsActions
      if (e.target.closest('#gameContent') || e.target.closest('#resultsActions')) return;
      const action = target.getAttribute('data-action');
      switch (action) {
        case 'showScreen': this.showScreen(target.getAttribute('data-screen')); break;
        case 'createRoom': this.createRoom(); break;
        case 'joinRoom': this.joinRoom(); break;
        case 'joinAsAudience': this.joinAsAudience(); break;
        case 'openAvatarPicker': this.openAvatarPicker(target.getAttribute('data-target')); break;
        case 'shareRoom': this.shareRoom(); break;
        case 'selectGame': this.selectGame(target.getAttribute('data-game')); break;
        case 'toggleFamilyMode': this.toggleFamilyMode(); break;
        case 'toggleExtendedTimers': this.toggleExtendedTimers(); break;
        case 'toggleHideRoomCode': this.toggleHideRoomCode(); break;
        case 'toggleReady': this.toggleReady(); break;
        case 'toggleSettings': this.toggleSettings(); break;
        case 'confirmExit': if (confirm('متأكد تبي تطلع؟')) location.reload(); break;
        case 'sendEmoji': this.sendEmoji(target.getAttribute('data-emoji')); break;
        case 'toggleReducedMotion': this.toggleReducedMotion(target.checked); break;
        case 'toggleDarkMode': this.toggleDarkMode(target.checked); break;
        case 'pauseGame': this.pauseGame(); break;
        case 'skipQuestion': this.skipQuestion(); break;
        case 'toggleStreamMode': this.toggleStreamMode(); break;
        case 'showKickMenu': this.showKickMenu(); break;
        case 'closeKickMenu': this.closeKickMenu(); break;
        case 'kickPlayer': this.kickPlayer(target.getAttribute('data-id')); break;
        case 'toggleChat': this.toggleChat(); break;
        case 'sendChat': this.sendChat(); break;
        case 'startPlaylist': this.startPlaylist(); break;
        case 'togglePlaylistGame': this.togglePlaylistGame(target); break;
        case 'randomGame': this.randomGame(); break;
      }
    });

    // ── Category tab filtering ──
    document.getElementById('gameTabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.game-tab');
      if (!tab) return;
      AudioEngine.click();
      document.querySelectorAll('#gameTabs .game-tab').forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const cat = tab.dataset.category;
      document.querySelectorAll('#gamesGrid .game-card').forEach(card => {
        if (cat === 'all' || (card.dataset.cat && card.dataset.cat.split(' ').includes(cat))) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });

    // ── Settings input delegation (volume sliders, intensity select) ──
    document.getElementById('settingsModal')?.addEventListener('input', (e) => {
      if (e.target.dataset.volume) {
        this.updateVolume(e.target.dataset.volume, e.target.value);
      }
    });
    document.getElementById('intensitySelect')?.addEventListener('change', (e) => {
      this.setIntensity(e.target.value);
    });

    // ── Chat enter key ──
    document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendChat();
    });

    // ── Dark mode init ──
    if (localStorage.getItem('darkMode') === 'true') {
      document.body.setAttribute('data-dark-mode', 'true');
      const toggle = document.getElementById('darkModeToggle');
      if (toggle) toggle.checked = true;
    }

    // ── Room code auto-uppercase ──
    document.getElementById('roomCodeInput')?.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });

    // ── Game card Enter key support ──
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const card = e.target.closest('[data-action="selectGame"]');
        if (card) card.click();
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

      const gameInfo = GAMES[data.game];
      const enterGame = () => {
        this.showScreen('gameScreen');
        document.getElementById('emojiBar')?.classList.remove('hidden');
        document.getElementById('chatToggle')?.classList.remove('hidden');
        // Show room code in HUD
        const hudCode = document.getElementById('hudRoomCode');
        if (hudCode && this.currentRoom) hudCode.textContent = this.currentRoom;
      };

      // Show game-specific splash for ALL games, then countdown
      this._showGameSplash(data.game, gameInfo, () => {
        this.showCountdown(enterGame);
      });
    });

    // ── إجابات وتصويتات ──
    s.on('playerAnswered', data => {
      this.updateWaitingCount(data.count, data.total, null, data.answered);
      ScreenMachine.updateAnswerProgress(data.count, data.total);
    });
    s.on('playerVoted', data => {
      this.updateWaitingCount(data.count, data.total, 'صوّتوا');
      ScreenMachine.updateAnswerProgress(data.count, data.total);
    });

    // ── رد سريع (Quiplash) ──
    s.on('quiplashQuestion', data => this.handleQuiplashQuestion(data));
    s.on('quiplashVoting', data => this.handleQuiplashVoting(data));
    s.on('quiplashMatchupResult', data => {
      const hasQuiplash = data.results?.some(r => r.quiplash);
      if (hasQuiplash) AudioEngine.quiplash(); else AudioEngine.revealSting(App.currentGame);
      this.handleQuiplashMatchupResult(data);
    });
    // Thriplash (final round)
    s.on('quiplashThriplashVoting', data => this.handleQuiplashThriplashVoting(data));
    s.on('quiplashThriplashResult', data => {
      const hasQuiplash = data.results?.some(r => r.quiplash);
      if (hasQuiplash) AudioEngine.quiplash(); else AudioEngine.revealSting(App.currentGame);
      this.handleQuiplashThriplashResult(data);
    });

    // ── خمّن النسبة (Guesspionage) - نظام كامل ──
    s.on('guesspionageQuestion', data => this.handleGuesspionageQuestion(data));
    s.on('guesspionageFeatured', data => this.handleGuesspionageFeatured(data));
    s.on('guesspionageWaitFeatured', data => this.handleGuesspionageWaitFeatured(data));
    s.on('guesspionageFeaturedWaiting', data => this.handleGuesspionageFeaturedWaiting(data));
    s.on('guesspionageChallenge', data => this.handleGuesspionageChallenge(data));

    // ── المزيّف (Fakin' It) ──
    s.on('fakinItTask', data => this.handleFakinItTask(data));
    s.on('fakinItDiscussion', data => this.handleFakinItDiscussion(data));
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
    s.on('drawfulDrawingResult', data => this.handleDrawfulDrawingResult(data));
    s.on('drawingAccepted', data => this.showToast(data.message, 'success'));

    // ── حرب التيشيرتات (Tee K.O.) ──
    s.on('tshirtWarsSlogan', data => this.handleTshirtWarsSlogan(data));
    s.on('tshirtWarsDraw', data => this.handleTshirtWarsDraw(data));
    s.on('tshirtWarsCombine', data => this.handleTshirtWarsCombine(data));
    s.on('tshirtWarsVoting', data => this.handleTshirtWarsVoting(data));
    s.on('tshirtWarsMatchResult', data => this.handleTshirtWarsMatchResult(data));
    s.on('slogansAccepted', () => this.showToast('شعاراتك وصلت!', 'success'));
    s.on('choiceAccepted', () => this.showToast('اختيارك وصل!', 'success'));

    // ── لا تضحك (Try Not To LOL) ──
    s.on('tryNotToLolWrite', data => this.handleTryNotToLolWrite(data));
    s.on('tryNotToLolJudge', data => this.handleTryNotToLolJudge(data));
    s.on('tryNotToLolVoting', data => this.handleTryNotToLolVoting(data));

    // ── اختراعات مجنونة (Inventions / Patently Stupid) ──
    s.on('inventionsProblem', data => this.handleInventionsProblem(data));
    s.on('inventionsDraw', data => this.handleInventionsDraw(data));
    s.on('inventionsVoting', data => this.handleInventionsVoting(data));

    // ── تبي ولا ما تبي (Would You Rather) ──
    s.on('wouldYouRatherQuestion', data => this.handleWouldYouRatherQuestion(data));
    s.on('wouldYouRatherResults', data => this.handleWouldYouRatherResults(data));

    // ── من قال؟ (Who Said It) ──
    s.on('whoSaidItWrite', data => { this._wsiGuesses = {}; this.handleWhoSaidItWrite(data); });
    s.on('whoSaidItGuess', data => { this._wsiGuesses = {}; this.handleWhoSaidItGuess(data); });

    // ── أسرع واحد (Speed Round) ──
    s.on('speedRoundQuestion', data => this.handleSpeedRoundQuestion(data));
    s.on('speedRoundResult', data => this.handleSpeedRoundResult(data));

    // ── سوّاق أعمى (Backseat Gamer) ──
    s.on('backseatGamerDescribe', data => this.handleBackseatGamerDescribe(data));
    s.on('backseatGamerGuess', data => this.handleBackseatGamerGuess(data));
    s.on('backseatGamerClue', data => this.handleBackseatGamerClue(data));

    // ── سبليت ذا روم (Split the Room) ──
    s.on('splitTheRoomWrite', data => this.handleSplitTheRoomWrite(data));
    s.on('splitTheRoomVote', data => this.handleSplitTheRoomVote(data));

    // ── المحكمة الكبرى (Courtroom) ──
    s.on('courtroomWrite', data => this.handleCourtroomWrite(data));
    s.on('courtroomVoting', data => this.handleCourtroomVoting(data));

    // ── المحكمة (Debate Me) ──
    s.on('debateMeWrite', data => this.handleDebateMeWrite(data));
    s.on('debateMeVoting', data => this.handleDebateMeVoting(data));

    // ── عجلة العقاب (Punishment Wheel) ──
    s.on('punishmentWheelQuestion', data => this.handlePunishmentWheelQuestion(data));

    // ── Host Controls ──
    s.on('gamePaused', data => {
      const overlay = document.getElementById('pauseOverlay');
      if (overlay) overlay.classList.toggle('hidden', !data.paused);
      const btn = document.getElementById('pauseBtn');
      if (btn) btn.textContent = data.paused ? '▶️ استئناف' : '⏸️ إيقاف مؤقت';
    });
    s.on('kicked', data => {
      this.showToast(data.message, 'error');
      setTimeout(() => location.reload(), 2000);
    });

    // ── Chat ──
    s.on('chatMessage', data => this.addChatMessage(data));

    // ── Achievements ──
    s.on('achievement', data => this.showAchievement(data));

    // ── النتائج ──
    s.on('roundResults', data => {
      ScreenMachine.transition('REVEAL');
      // Remove tension effect
      document.getElementById('gameScreen')?.classList.remove('screen--tension');
      document.getElementById('gameTimer')?.classList.remove('game-timer--tension');
      AudioEngine.revealSting(App.currentGame);
      if (data.commentary) this.showCommentary(data.commentary);
      this.handleRoundResults(data);
    });
    s.on('gameEnded', data => {
      ScreenMachine.transition('WINNER');
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

    s.on('streamModeChanged', data => {
      this._streamMode = data.streamMode;
      document.body.classList.toggle('stream-mode', data.streamMode);
      const btn = document.getElementById('streamModeBtn');
      if (btn) btn.textContent = data.streamMode ? '📺 وضع البث: مفعّل ✅' : '📺 وضع البث';
      this.showToast(data.message, 'success');
    });

    // ── Party Playlist ──
    s.on('playlistStarted', data => {
      this._playlist = data.playlist;
      this._playlistIndex = 0;
      this.showToast('🎮 بلاي ليست بارتي! ' + data.playlist.length + ' ألعاب', 'success');
    });

    s.on('playlistTransition', data => {
      this._playlistIndex = data.nextIndex;
      const nextGame = data.nextGame;
      const gi = GAMES[nextGame];
      // Show transition overlay with standings
      this._showPlaylistTransition(data.standings, nextGame, gi, data.nextIndex, data.total);
    });

    s.on('playlistEnded', data => {
      this._playlist = null;
      AudioEngine.stopMusic();
      AudioEngine.drumRoll(2);
      setTimeout(() => { AudioEngine.victory(); AudioEngine.applause(); }, 2000);
      this._showPlaylistFinalResults(data.standings);
    });

    // ── Audience ──
    s.on('audienceJoined', data => {
      this.showToast(bdiName(data.name) + ' انضم كمتفرج! 👀', 'success');
    });

    // ── Guesspionage Final Round (The Round-Up) ──
    s.on('guesspionageFinalRound', data => this.handleGuesspionageFinalRound(data));
    s.on('guesspionageFinalQuestion', data => this.handleGuesspionageFinalQuestion(data));
    s.on('guesspionageFinalAnswer', data => this.handleGuesspionageFinalAnswer(data));

    // ── الرجوع والإلغاء ──
    s.on('returnedToLobby', data => {
      this.currentGame = null;
      this.setTheme('hub');
      AudioEngine.stopMusic();
      this.updatePlayers(data.players);
      this.showScreen('lobbyScreen');
      this.showToast('رجعنا للوبي!', 'success');
      document.getElementById('emojiBar')?.classList.add('hidden');
      document.getElementById('winnerDisplay')?.classList.remove('winner-spotlight');
    });

    s.on('gameCancelled', data => {
      this.currentGame = null;
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
    // تنظيف التأثيرات عند تبديل الشاشات
    if (typeof window.FX !== 'undefined') window.FX.clear();
    // إعادة تعيين حالة الإرسال
    this._submitting = false;
    // مسح مؤقت اللعبة عند مغادرة شاشة اللعبة
    if (this.gameTimer && id !== 'gameScreen') {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
    // Remove tension effect from previous screen
    document.querySelectorAll('.screen--tension').forEach(s => s.classList.remove('screen--tension'));
    // Cleanup round intro if switching away
    ScreenMachine.cleanup();

    // Track state in ScreenMachine
    const stateMap = { bootScreen: 'BOOT', menuScreen: 'MENU', lobbyScreen: 'LOBBY',
      howToPlayScreen: 'HOW_TO_PLAY', gameScreen: 'QUESTION', resultsScreen: 'RESULTS' };
    if (stateMap[id]) ScreenMachine.transition(stateMap[id]);

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('is-active'));
    const screen = document.getElementById(id);
    if (screen) {
      screen.classList.add('is-active');
      AudioEngine.whoosh();
      // Browser history: allow back button to navigate screens
      if (!this._poppingState) {
        const navigableScreens = ['menuScreen', 'createScreen', 'joinScreen', 'howToPlayScreen', 'lobbyScreen'];
        if (navigableScreens.includes(id)) {
          history.pushState({ screen: id }, '', '#' + id.replace('Screen', ''));
        }
      }
      this._poppingState = false;
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
      if (game) {
        bg.classList.add(game.pattern);
      } else {
        bg.classList.add(theme === 'victory' ? 'pattern-confetti' : 'pattern-arabesque');
      }
    }
    // Reset answer progress HUD
    const center = document.querySelector('.game-hud__center');
    if (center) center.innerHTML = '<div id="answeredCount" class="text-sm text-muted" style="display:none"></div>';
  },

  setIntensity(level) {
    const valid = ['calm', 'party', 'chaos'];
    if (!valid.includes(level)) level = 'party';
    document.body.setAttribute('data-intensity', level);
    this._intensity = level;
    localStorage.setItem('intensity', level);
  },

  _noop() {},

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

  // ═══════════════════════════════════════════════════════════════
  // Avatar Selection Integration
  // ═══════════════════════════════════════════════════════════════

  // Avatar is auto-assigned randomly (no picker step)
  createRoom() {
    const name = document.getElementById('hostNameInput').value.trim();
    if (!name) return this.showToast('أدخل اسمك!', 'error');
    AudioEngine.click();
    const avatarData = AvatarSystem.getRandomAvatarData();
    this.socket.emit('createRoom', { playerName: name, avatarData: avatarData });
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
    const avatarData = AvatarSystem.getRandomAvatarData();
    this.socket.emit('joinRoom', { code, playerName: name, avatarData: avatarData });
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
    this.socket.emit('joinAsAudience', { code, playerName: name, avatarData: AvatarSystem.getRandomAvatarData() });
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

  randomGame() {
    if (!this.isHost) return this.showToast('المضيف فقط!', 'error');
    const gameKeys = Object.keys(GAMES);
    const pick = gameKeys[Math.floor(Math.random() * gameKeys.length)];
    AudioEngine.click();
    this.showToast('🎲 ' + GAMES[pick].name, 'success');
    this.socket.emit('startGame', { code: this.currentRoom, game: pick });
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

  toggleStreamMode() {
    if (!this.isHost || !this.currentRoom) return;
    this.socket.emit('toggleStreamMode', this.currentRoom);
  },

  // ═══════════════════════════════════════════════════════════════
  // 🎮 Party Playlist Mode
  // ═══════════════════════════════════════════════════════════════

  _playlistQueue: [],

  togglePlaylistGame(target) {
    const game = target.getAttribute('data-game');
    if (!game) return;
    const idx = this._playlistQueue.indexOf(game);
    if (idx > -1) {
      this._playlistQueue.splice(idx, 1);
      target.classList.remove('playlist-game--selected');
      target.querySelector('.playlist-game__num')?.remove();
    } else {
      if (this._playlistQueue.length >= 8) {
        this.showToast('أقصى عدد 8 ألعاب!', 'error');
        return;
      }
      this._playlistQueue.push(game);
      target.classList.add('playlist-game--selected');
      const numEl = document.createElement('span');
      numEl.className = 'playlist-game__num';
      numEl.textContent = this._playlistQueue.length;
      target.appendChild(numEl);
    }
    // Update all numbers
    document.querySelectorAll('.playlist-game--selected .playlist-game__num').forEach((n, i) => {
      n.textContent = i + 1;
    });
    const startBtn = document.getElementById('startPlaylistBtn');
    if (startBtn) startBtn.disabled = this._playlistQueue.length < 2;
  },

  startPlaylist() {
    if (!this.isHost || !this.currentRoom || this._playlistQueue.length < 2) return;
    this.socket.emit('startPlaylist', { code: this.currentRoom, games: this._playlistQueue.slice() });
  },

  showPlaylistPicker() {
    const modal = document.getElementById('playlistModal');
    if (modal) { modal.classList.remove('hidden'); return; }

    const el = document.createElement('div');
    el.id = 'playlistModal';
    el.className = 'modal-overlay';
    el.innerHTML =
      '<div class="modal-content" style="max-width:500px">' +
        '<h2 style="text-align:center;margin-bottom:16px">🎮 بلاي ليست بارتي</h2>' +
        '<p style="text-align:center;color:rgba(255,255,255,0.6);margin-bottom:20px">اختر ٢-٨ ألعاب بالترتيب</p>' +
        '<div class="playlist-grid">' +
          Object.keys(GAMES).map(g => {
            const gi = GAMES[g];
            return '<button class="playlist-game" data-action="togglePlaylistGame" data-game="' + g + '">' +
              '<span class="playlist-game__icon">' + gi.icon + '</span>' +
              '<span class="playlist-game__name">' + escapeHtml(gi.name) + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
        '<div style="display:flex;gap:12px;margin-top:20px;justify-content:center">' +
          '<button class="btn btn--primary" id="startPlaylistBtn" data-action="startPlaylist" disabled>🚀 ابدأ البلاي ليست</button>' +
          '<button class="btn btn--ghost" onclick="document.getElementById(\'playlistModal\').classList.add(\'hidden\')">إلغاء</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
  },

  _showPlaylistTransition(standings, nextGame, gameInfo, nextIndex, total) {
    const theme = this._gameSplashThemes[nextGame] || { bg1: '#0A1F0E', bg2: '#000', accent: '#00C853', glow: 'rgba(0,200,83,0.5)' };
    const el = document.createElement('div');
    el.className = 'playlist-transition';
    el.style.background = 'radial-gradient(ellipse at center, ' + theme.bg1 + ' 0%, ' + theme.bg2 + ' 80%)';

    const standingsHtml = standings.slice(0, 5).map((s, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
      return '<div class="playlist-standing">' +
        '<span class="playlist-standing__medal">' + medal + '</span>' +
        '<span class="playlist-standing__name">' + bdiName(s.name) + '</span>' +
        '<span class="playlist-standing__score" style="color:' + theme.accent + '">' + s.score + '</span>' +
      '</div>';
    }).join('');

    el.innerHTML =
      '<div class="playlist-transition__progress">' + (nextIndex + 1) + ' / ' + total + '</div>' +
      '<div class="playlist-transition__standings">' + standingsHtml + '</div>' +
      '<div class="playlist-transition__next">' +
        '<div class="playlist-transition__next-label">اللعبة الجاية</div>' +
        '<div class="playlist-transition__next-icon" style="filter:drop-shadow(0 0 30px ' + theme.glow + ')">' + (gameInfo ? gameInfo.icon : '🎮') + '</div>' +
        '<div class="playlist-transition__next-name" style="color:' + theme.accent + '">' + (gameInfo ? escapeHtml(gameInfo.name) : '') + '</div>' +
      '</div>';

    document.body.appendChild(el);
    if (typeof AudioEngine !== 'undefined') AudioEngine.whoosh();

    setTimeout(() => {
      el.classList.add('playlist-transition--exit');
      setTimeout(() => el.remove(), 600);
    }, 3500);
  },

  _showPlaylistFinalResults(standings) {
    const gc = document.getElementById('gameContent');
    if (!gc) return;
    this.showScreen('gameScreen');

    const podiumHtml = standings.slice(0, 3).map((s, i) => {
      const crowns = ['👑', '🥈', '🥉'];
      const sizes = ['120px', '90px', '70px'];
      return '<div class="playlist-podium__entry" style="order:' + [1,0,2][i] + '">' +
        '<div style="font-size:' + sizes[i] + '">' + crowns[i] + '</div>' +
        '<div class="playlist-podium__name">' + bdiName(s.name) + '</div>' +
        '<div class="playlist-podium__score">' + s.score + '</div>' +
      '</div>';
    }).join('');

    const restHtml = standings.slice(3).map((s, i) => {
      return '<div class="playlist-rest-row">' +
        '<span>' + (i + 4) + '. ' + bdiName(s.name) + '</span>' +
        '<span>' + s.score + '</span>' +
      '</div>';
    }).join('');

    gc.innerHTML =
      '<div class="playlist-final">' +
        '<h1 class="playlist-final__title">🏆 النتائج النهائية</h1>' +
        '<div class="playlist-podium">' + podiumHtml + '</div>' +
        (restHtml ? '<div class="playlist-rest">' + restHtml + '</div>' : '') +
        '<button class="btn btn--primary" style="margin-top:32px" data-action="backToLobby">🔙 رجوع للوبي</button>' +
      '</div>';
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
        face.className = 'player-avatar__face' + (p.avatarData ? ' player-avatar__face--rich' : '');
        face.style.background = p.color;
        // Render rich avatar — game-aware when in a game, standard in lobby
        if (p.avatarData && typeof AvatarSystem !== 'undefined') {
          face.innerHTML = this._gAvatar(p.avatarData, 56, p.avatar);
        } else {
          face.appendChild(document.createTextNode(p.avatar));
        }
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
        const nameBdi = document.createElement('bdi');
        nameBdi.setAttribute('dir', 'auto');
        name.appendChild(nameBdi);
        el.appendChild(name);
        el._nameBdi = nameBdi;
        el._name = name;

        const title = document.createElement('span');
        title.className = 'player-avatar__title';
        el.appendChild(title);
        el._title = title;

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
      (el._nameBdi || el._name).textContent = p.name + (p.isReady ? ' ✓' : '');
      if (el._title) {
        const titleText = p.avatarData && p.avatarData.nameAr ? p.avatarData.nameAr : '';
        el._title.textContent = titleText;
        el._title.style.display = titleText ? '' : 'none';
      }
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
    const playlistSection = document.getElementById('playlistSection');
    if (playlistSection) playlistSection.style.display = this.isHost ? 'block' : 'none';
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
      if (t <= 5) {
        el.classList.remove('game-timer--warning');
        el.classList.add('game-timer--danger', 'game-timer--tension');
        // Add tension effect to screen
        document.getElementById('gameScreen')?.classList.add('screen--tension');
        AudioEngine.tickUrgent();
      }
      if (t <= 0) {
        clearInterval(this.gameTimer);
        el.classList.remove('game-timer--tension');
        document.getElementById('gameScreen')?.classList.remove('screen--tension');
        AudioEngine.timesUp();
      }
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
    const loader = '<div class="spinner mb-4"></div>';
    if (gc) gc.innerHTML =
      '<div class="text-center">' +
        '<div class="mb-4">' + loader + '</div>' +
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
      avatarsEl.innerHTML = answered.map(a => {
        const avatarContent = this._gAvatar(a.avatarData, 32, a.avatar);
        return '<div class="waiting-avatar' + (a.avatarData ? ' waiting-avatar--rich' : '') + '" style="background:' + escapeHtml(a.color) + '" title="' + bdiName(a.name) + '">' +
          avatarContent +
          '<div class="waiting-avatar__check">✓</div>' +
        '</div>';
      }).join('');
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 🎮 Universal Game Splash - Themed intro for all 17 games
  // ═══════════════════════════════════════════════════════════════

  _gameSplashThemes: {
    quiplash:       { bg1: '#2D1B69', bg2: '#1A1145', accent: '#FFD700', glow: 'rgba(255,215,0,0.5)' },
    guesspionage:   { bg1: '#0D1117', bg2: '#1A2332', accent: '#00FF41', glow: 'rgba(0,255,65,0.5)' },
    fakinit:        { bg1: '#8B3A2A', bg2: '#6B2A1A', accent: '#42A5F5', glow: 'rgba(66,165,245,0.5)' },
    triviamurder:   { bg1: '#0D0D0D', bg2: '#1A1A1A', accent: '#2ECC40', glow: 'rgba(46,204,64,0.5)' },
    fibbage:        { bg1: '#1A1A5E', bg2: '#0D0D3A', accent: '#FFD700', glow: 'rgba(255,215,0,0.5)' },
    drawful:        { bg1: '#7A6420', bg2: '#5A4A15', accent: '#C5A55A', glow: 'rgba(197,165,90,0.5)' },
    tshirtwars:     { bg1: '#0D0D1A', bg2: '#1A1A2E', accent: '#FF007F', glow: 'rgba(255,0,127,0.5)' },
    trynottolol:    { bg1: '#1A0A2E', bg2: '#2E1B69', accent: '#FFD700', glow: 'rgba(255,215,0,0.5)' },
    inventions:     { bg1: '#1A3A5C', bg2: '#0D2840', accent: '#2980B9', glow: 'rgba(41,128,185,0.5)' },
    wouldyourather: { bg1: '#0A0E2A', bg2: '#141852', accent: '#FF2D7B', glow: 'rgba(255,45,123,0.5)' },
    whosaidit:      { bg1: '#1A1A3E', bg2: '#2D2D5E', accent: '#FFB800', glow: 'rgba(255,184,0,0.5)' },
    speedround:     { bg1: '#0D0D0D', bg2: '#1A1A1A', accent: '#FF1744', glow: 'rgba(255,23,68,0.5)' },
    backseatgamer:  { bg1: '#0D1B2A', bg2: '#1B2838', accent: '#00E5FF', glow: 'rgba(0,229,255,0.5)' },
    splittheroom:   { bg1: '#1B0A2E', bg2: '#4A0E78', accent: '#7B2FBE', glow: 'rgba(123,47,190,0.5)' },
    courtroom:      { bg1: '#1A1205', bg2: '#2D1F0A', accent: '#D4AF37', glow: 'rgba(212,175,55,0.5)' },
    debateme:       { bg1: '#2C1810', bg2: '#4A3728', accent: '#C9A96E', glow: 'rgba(201,169,110,0.5)' },
    punishmentwheel:{ bg1: '#2E0A0A', bg2: '#4A0E0E', accent: '#FF4444', glow: 'rgba(255,68,68,0.5)' },
  },

  /**
   * Universal game splash - themed intro screen for ALL 17 games
   */
  _showGameSplash(game, gameInfo, callback) {
    if (!gameInfo) { if (callback) callback(); return; }

    // Skip transition for reduced motion — just show splash
    if (this.reducedMotion) {
      return this._showSimpleGameSplash(game, gameInfo, callback);
    }

    const theme = this._gameSplashThemes[game] || { bg1: '#0A1F0E', bg2: '#000', accent: '#00C853', glow: 'rgba(0,200,83,0.5)' };
    const transition = document.getElementById('gameTransition');

    if (transition) {
      // ── 3-Beat Cultural Transition — انتقال ثقافي ثلاثي ──
      const dissolveEl = transition.querySelector('.game-transition__dissolve');
      const transformEl = transition.querySelector('.game-transition__transform');
      const arriveEl = transition.querySelector('.game-transition__arrive');
      const patternEl = transition.querySelector('.game-transition__pattern');

      if (patternEl) {
        patternEl.className = 'game-transition__pattern';
      }

      // Style the transition with game colors
      transition.style.background = 'radial-gradient(ellipse at center, ' + theme.bg1 + ' 0%, ' + theme.bg2 + ' 80%)';
      transition.classList.remove('hidden');
      transition.setAttribute('aria-hidden', 'false');

      if (typeof AudioEngine !== 'undefined') AudioEngine.whoosh();

      // Beat 1: Dissolve (0-800ms) — current UI fragments
      if (dissolveEl) dissolveEl.classList.add('game-transition--dissolve');

      // Beat 2: Transform (800-1700ms) — morph into game world
      setTimeout(() => {
        if (dissolveEl) dissolveEl.classList.remove('game-transition--dissolve');
        if (transformEl) transformEl.classList.add('game-transition--transform');
        // Show game title during transform
        transformEl.innerHTML =
          '<div class="ql-game-splash__icon" style="filter:drop-shadow(0 0 40px ' + theme.glow + ')">' + gameInfo.icon + '</div>' +
          '<div class="ql-game-splash__title" style="color:' + theme.accent + ';text-shadow:4px 4px 0 #000, 0 0 40px ' + theme.glow + '">' + escapeHtml(gameInfo.name) + '</div>';
      }, 800);

      // Beat 3: Arrive (1700-2500ms) — game world materializes
      setTimeout(() => {
        if (transformEl) { transformEl.classList.remove('game-transition--transform'); transformEl.innerHTML = ''; }
        if (arriveEl) arriveEl.classList.add('game-transition--arrive');
      }, 1700);

      // Complete transition
      setTimeout(() => {
        if (arriveEl) arriveEl.classList.remove('game-transition--arrive');
        transition.classList.add('hidden');
        transition.setAttribute('aria-hidden', 'true');
        transition.style.background = '';
        if (callback) callback();
      }, 2500);

    } else {
      // Fallback: simple splash if transition DOM not available
      this._showSimpleGameSplash(game, gameInfo, callback);
    }
  },

  // Simple fallback splash (used for reduced motion or missing DOM)
  _showSimpleGameSplash(game, gameInfo, callback) {
    const theme = this._gameSplashThemes[game] || { bg1: '#0A1F0E', bg2: '#000', accent: '#00C853', glow: 'rgba(0,200,83,0.5)' };
    const el = document.createElement('div');
    el.className = 'ql-game-splash';
    el.style.background = 'radial-gradient(ellipse at center, ' + theme.bg1 + ' 0%, ' + theme.bg2 + ' 80%)';
    el.innerHTML =
      '<div class="ql-game-splash__icon" style="filter:drop-shadow(0 0 40px ' + theme.glow + ')">' + gameInfo.icon + '</div>' +
      '<div class="ql-game-splash__title" style="color:' + theme.accent + ';text-shadow:4px 4px 0 #000, 0 0 40px ' + theme.glow + '">' + escapeHtml(gameInfo.name) + '</div>' +
      '<div class="ql-game-splash__subtitle">' + escapeHtml(gameInfo.hint) + '</div>';
    document.body.appendChild(el);

    if (typeof AudioEngine !== 'undefined') AudioEngine.whoosh();

    setTimeout(() => {
      el.classList.add('ql-game-splash--exit');
      setTimeout(() => {
        el.remove();
        if (callback) callback();
      }, 600);
    }, 2500);
  },

  // ═══════════════════════════════════════════════════════════════
  // ⚡ رد سريع (Quiplash) - Cinematic Jackbox-Style
  // ═══════════════════════════════════════════════════════════════

  // Round interstitial labels
  /**
   * Show Quiplash game splash (intro screen before countdown)
   * @deprecated Use _showGameSplash() instead
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

  _qlRoundLabels: ['الأولى', 'الثانية', 'THRIPLASH!'],
  _qlRoundColors: ['r1', 'r2', 'r3'],
  _qlRoundSubtitles: ['يلا نبدأ! ⚡', 'الحين الجد! 🔥', '🔥🔥🔥 الكل يكتب... الكل يصوّت... النقاط ثلاثية!'],

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
    AudioEngine.revealSting(App.currentGame);

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
      const isThriplash = d.thriplash || d.round === d.maxRounds;
      document.getElementById('gameRound').textContent = isThriplash ? '⚡ THRIPLASH ⚡' : 'الجولة ' + d.round + ' من ' + d.maxRounds;
      this.startTimer(d.timeLimit);

      const safetyQuips = d.safetyQuips || [];
      const safetyBtn = safetyQuips.length > 0
        ? '<button class="ql-safety-quip" data-action="useSafetyQuip" data-quip="' + escapeHtml(safetyQuips[0]) + '">🎲 مساعدة أبو عابد</button>'
        : '';

      const badge = isThriplash ? '🔥 THRIPLASH - النقاط ثلاثية!' : '⚡ السؤال ' + d.round;

      document.getElementById('gameContent').innerHTML =
        '<div class="ql-prompt-card' + (isThriplash ? ' ql-prompt-card--thriplash' : '') + '">' +
          '<div class="ql-prompt-card__badge">' + badge + '</div>' +
          '<p class="ql-prompt-card__question">' + escapeHtml(d.question) + '</p>' +
          '<div class="ql-prompt-card__input-wrap">' +
            '<input type="text" class="ql-prompt-card__input" id="answerInput" placeholder="' + (isThriplash ? 'اكتب أفضل إجابة... النقاط ثلاثية! 🔥' : 'اكتب إجابتك الأسطورية...') + '" maxlength="100" autocomplete="off">' +
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
      const isJinx = d.jinx;

      // JINX: identical answers - special display
      if (isJinx && results.length >= 2) {
        this._showQuiplashJinx(d);
        return;
      }

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
      const aBars = (voterBreakdown[sideA.playerId] || []).map((v, i) => {
        const vAvatar = this._gAvatar(v.avatarData, 24, v.avatar);
        return '<div class="ql-vote-bar" style="background:' + escapeHtml(v.color || '#444') + ';animation-delay:' + (i * 0.2) + 's">' +
          '<span class="ql-vote-bar__avatar">' + vAvatar + '</span>' +
          '<span class="ql-vote-bar__name">' + bdiName(v.name || '') + '</span>' +
        '</div>';
      }).join('');
      const bBars = (voterBreakdown[sideB.playerId] || []).map((v, i) => {
        const vAvatar = this._gAvatar(v.avatarData, 24, v.avatar);
        return '<div class="ql-vote-bar" style="background:' + escapeHtml(v.color || '#444') + ';animation-delay:' + (i * 0.2) + 's">' +
          '<span class="ql-vote-bar__avatar">' + vAvatar + '</span>' +
          '<span class="ql-vote-bar__name">' + bdiName(v.name || '') + '</span>' +
        '</div>';
      }).join('');

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
                '<div class="ql-results__player-avatar' + (aWins ? ' ql-results__player-avatar--happy' : bWins ? ' ql-results__player-avatar--sad' : '') + '">' + this._gAvatar(sideA.avatarData, 40, sideA.avatar) + '</div>' +
                '<div class="ql-results__player-name">' + bdiName(sideA.playerName || '') + '</div>' +
              '</div>' +
              '<div class="ql-points' + (sideA.quiplash ? ' ql-points--quiplash' : '') + '">+' + (sideA.points || 0) +
                (sideA.speedBonus ? ' <span class="ql-bonus-badge">⚡+' + sideA.speedBonus + '</span>' : '') +
                (sideA.streakBonus ? ' <span class="ql-bonus-badge ql-bonus-badge--streak">🔥+' + sideA.streakBonus + '</span>' : '') +
              '</div>' +
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
                '<div class="ql-results__player-avatar' + (bWins ? ' ql-results__player-avatar--happy' : aWins ? ' ql-results__player-avatar--sad' : '') + '">' + this._gAvatar(sideB.avatarData, 40, sideB.avatar) + '</div>' +
                '<div class="ql-results__player-name">' + bdiName(sideB.playerName || '') + '</div>' +
              '</div>' +
              '<div class="ql-points' + (sideB.quiplash ? ' ql-points--quiplash' : '') + '">+' + (sideB.points || 0) +
                (sideB.speedBonus ? ' <span class="ql-bonus-badge">⚡+' + sideB.speedBonus + '</span>' : '') +
                (sideB.streakBonus ? ' <span class="ql-bonus-badge ql-bonus-badge--streak">🔥+' + sideB.streakBonus + '</span>' : '') +
              '</div>' +
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

      // Show mini leaderboard after a delay
      if (d.players && d.players.length > 0) {
        setTimeout(() => this._showQuiplashMiniLeaderboard(d.players), 3000);
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
    // Trigger celebration effects
    if (typeof window.FX !== 'undefined') {
      window.FX.flash({ color: 'rgba(255,217,61,0.4)' });
      window.FX.fireworks({ count: 3 });
    }
    setTimeout(() => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.5s';
      setTimeout(() => overlay.remove(), 500);
    }, 2000);
  },

  /**
   * Show mini leaderboard after matchup result
   */
  _showQuiplashMiniLeaderboard(players) {
    const gc = document.getElementById('gameContent');
    if (!gc) return;
    // Sort by score descending, only non-audience players
    const sorted = [...players].filter(p => !p.isAudience).sort((a, b) => b.score - a.score);
    if (sorted.length === 0) return;

    const rows = sorted.map((p, i) => {
      const rank = i === 0 ? '👑' : (i + 1).toString();
      return '<div class="ql-mini-lb__row">' +
        '<div class="ql-mini-lb__rank">' + rank + '</div>' +
        '<div class="ql-mini-lb__avatar">' + this._gAvatar(p.avatarData, 28, p.avatar) + '</div>' +
        '<div class="ql-mini-lb__name">' + bdiName(p.name || '') + '</div>' +
        '<div class="ql-mini-lb__score">' + (p.score || 0) + '</div>' +
      '</div>';
    }).join('');

    gc.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:16px">' +
        '<div class="ql-mini-lb">' +
          '<div class="ql-mini-lb__title">📊 الترتيب الحالي</div>' +
          rows +
        '</div>' +
      '</div>';
  },

  /**
   * Show JINX display when both players submit identical answers
   */
  _showQuiplashJinx(d) {
    const results = d.results || [];
    const r0 = results[0] || {};
    const r1 = results[1] || {};
    const gc = document.getElementById('gameContent');
    if (!gc) return;

    gc.innerHTML =
      '<div class="ql-results" style="text-align:center">' +
        '<div class="ql-results__question">' + escapeHtml(d.question || '') + '</div>' +
        '<div class="ql-jinx">' +
          '<div class="ql-jinx__icon">🔗</div>' +
          '<div class="ql-jinx__text">JINX!</div>' +
          '<div class="ql-jinx__subtitle">نفس الإجابة! صفر نقاط للاثنين!</div>' +
          '<div class="ql-jinx__answer">"' + escapeHtml(r0.answer || r1.answer || '') + '"</div>' +
          '<div class="ql-jinx__players">' +
            '<span>' + this._gAvatar(r0.avatarData, 28, r0.avatar) + ' ' + bdiName(r0.playerName || '') + '</span>' +
            '<span style="margin:0 12px;color:#B8860B;font-weight:900">=</span>' +
            '<span>' + this._gAvatar(r1.avatarData, 28, r1.avatar) + ' ' + bdiName(r1.playerName || '') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    AudioEngine.timesUp();
  },

  // ── Thriplash (Final Round) Handlers ──

  handleQuiplashThriplashVoting(d) {
    this._qlAnswerSubmitted = false;
    document.getElementById('gameRound').textContent = '⚡ THRIPLASH ⚡';
    this.startTimer(d.timeLimit);

    const answers = d.answers || [];
    const answersHtml = answers.map(a => {
      return '<div class="ql-thriplash-option" data-action="voteAnswer" data-id="' + escapeHtml(a.playerId) + '">' +
        '<div class="ql-thriplash-option__text">"' + escapeHtml(a.answer) + '"</div>' +
      '</div>';
    }).join('');

    document.getElementById('gameContent').innerHTML =
      '<div class="ql-thriplash-vote">' +
        '<div class="ql-thriplash-vote__badge">🔥 THRIPLASH - صوّت لأفضل إجابة!</div>' +
        '<div class="ql-thriplash-vote__question">' + escapeHtml(d.question) + '</div>' +
        '<div class="ql-thriplash-vote__options">' + answersHtml + '</div>' +
        '<div class="ql-vote-progress" id="waitingCount">🗳️ اختر إجابتك المفضلة!</div>' +
      '</div>';
  },

  handleQuiplashThriplashResult(d) {
    try {
      clearInterval(this.gameTimer);
      const results = d.results || [];
      const hasQuiplash = results.some(r => r.quiplash);

      const resultsHtml = results.map((r, i) => {
        const place = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
        const avatar = this._gAvatar(r.playerAvatarData, 32, r.playerAvatar);
        return '<div class="ql-thriplash-result' + (i === 0 ? ' ql-thriplash-result--winner' : '') + '">' +
          '<div class="ql-thriplash-result__place">' + place + '</div>' +
          '<div class="ql-thriplash-result__avatar">' + avatar + '</div>' +
          '<div class="ql-thriplash-result__info">' +
            '<div class="ql-thriplash-result__name">' + bdiName(r.playerName) + '</div>' +
            '<div class="ql-thriplash-result__answer">"' + escapeHtml(r.answer) + '"</div>' +
          '</div>' +
          '<div class="ql-thriplash-result__stats">' +
            '<div class="ql-thriplash-result__votes">' + r.votes + ' صوت</div>' +
            '<div class="ql-thriplash-result__points' + (r.quiplash ? ' ql-points--quiplash' : '') + '">+' + r.points + '</div>' +
          '</div>' +
        '</div>';
      }).join('');

      document.getElementById('gameContent').innerHTML =
        '<div class="ql-thriplash-results">' +
          '<div class="ql-thriplash-results__header">' +
            '<div class="ql-thriplash-results__badge">🔥 THRIPLASH 🔥</div>' +
            '<div class="ql-thriplash-results__question">' + escapeHtml(d.question) + '</div>' +
          '</div>' +
          '<div class="ql-thriplash-results__list">' + resultsHtml + '</div>' +
        '</div>';

      if (hasQuiplash) {
        setTimeout(() => this._showQuiplashMoment(), 1500);
      }
    } catch (e) {
      console.error('handleQuiplashThriplashResult error:', e);
    }
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
    AudioEngine.revealSting(App.currentGame);
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
                  '<stop offset="0%" style="stop-color:#8B4513"/>' +
                  '<stop offset="50%" style="stop-color:#C8A951"/>' +
                  '<stop offset="100%" style="stop-color:#006C35"/>' +
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
        '<div class="featured-player mt-4">' +
          '<div class="featured-player__avatar">🎯</div>' +
          '<div class="featured-player__name">' + escapeHtml(d.featuredPlayerName) + '</div>' +
          '<div class="featured-player__label">يخمّن النسبة...</div>' +
        '</div>' +
        '<div class="spinner mt-4"></div>' +
      '</div>';
  },

  // اللاعب المميز ينتظر بعد ما خمّن
  handleGuesspionageFeaturedWaiting(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    document.getElementById('gameHint').textContent = '📊 تخمينك: ' + d.yourGuess + '% — الباقين يراهنون الحين';
    this.startTimer(d.timeLimit);
    document.getElementById('gameContent').innerHTML =
      '<div class="gspy-result-container">' +
        '<div class="gspy-question-card gspy-question-card--sm">' +
          '<p class="gspy-question-text">' + escapeHtml(d.question) + '</p>' +
        '</div>' +
        '<div class="donut-chart mt-4 mb-4" style="--pct:' + d.yourGuess + ';margin:0 auto">' +
          '<div class="donut-chart__inner">' +
            '<div class="donut-chart__value">' + d.yourGuess + '%</div>' +
            '<div class="donut-chart__symbol">تخمينك</div>' +
          '</div>' +
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
      '<button class="hl-btn hl-btn--higher" data-action="submitGuess" data-bet="higher" aria-label="الجواب أعلى من التخمين">' +
        '▲ أعلى' +
      '</button>' +
      '<button class="hl-btn hl-btn--lower" data-action="submitGuess" data-bet="lower" aria-label="الجواب أقل من التخمين">' +
        '▼ أقل' +
      '</button>';

    let muchHtml = '';
    if (d.hasMuch) {
      muchHtml =
        '<div class="gspy-much-label mt-4">🎲 أو راهن أكبر!</div>' +
        '<div class="gspy-bet-buttons gspy-bet-buttons--much">' +
          '<button class="hl-btn hl-btn--much-higher" data-action="submitGuess" data-bet="much_higher" aria-label="الجواب أعلى بكثير">' +
            '▲▲ أعلى بكثير<br><span style="font-size:12px;opacity:0.7">+2000 أو 0!</span>' +
          '</button>' +
          '<button class="hl-btn hl-btn--much-lower" data-action="submitGuess" data-bet="much_lower" aria-label="الجواب أقل بكثير">' +
            '▼▼ أقل بكثير<br><span style="font-size:12px;opacity:0.7">+2000 أو 0!</span>' +
          '</button>' +
        '</div>';
    }

    document.getElementById('gameContent').innerHTML =
      '<div class="gspy-challenge-container">' +
        '<div class="gspy-question-card gspy-question-card--sm">' +
          '<p class="gspy-question-text">' + escapeHtml(d.question) + '</p>' +
        '</div>' +
        '<div class="gspy-featured-guess-display">' +
          '<div class="featured-player mb-2"><div class="featured-player__label">خمّن</div><div class="featured-player__name">' + escapeHtml(d.featuredPlayerName) + '</div></div>' +
          '<div class="donut-chart mb-3" style="--pct:' + d.featuredGuess + ';margin:0 auto">' +
            '<div class="donut-chart__inner"><div class="donut-chart__value">' + d.featuredGuess + '%</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="gspy-challenge-prompt">الجواب الصحيح أعلى أو أقل؟</div>' +
        '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' + buttonsHtml + '</div>' +
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
      youGottaPoint: '👉',
      pickASide: '↔️'
    };
    const categoryHints = {
      handsOfTruth: 'ارفع يدك إذا ينطبق عليك!',
      numberPressure: 'ارفع أصابع حسب جوابك!',
      faceValue: 'وريّنا تعبير وجهك!',
      youGottaPoint: 'أشر على اللاعب!',
      pickASide: 'ارفع إبهامك لأعلى أو لأسفل!'
    };
    const catIcon = categoryIcons[d.categoryKey] || '🎭';
    const catHint = categoryHints[d.categoryKey] || '';

    let html;
    if (d.isFaker) {
      html =
        '<div class="faker-reveal" style="max-width:600px">' +
          '<div class="faker-silhouette faker-silhouette--revealed mb-4">' +
            '<div class="faker-silhouette__emoji">🕵️</div>' +
          '</div>' +
          '<p class="text-2xl font-bold mb-2" style="color:#FF4466">أنت المزيّف!</p>' +
          '<p class="text-lg mb-2" style="color:rgba(255,255,255,0.6)">النوع: ' + escapeHtml(d.category) + ' ' + catIcon + '</p>' +
          '<p class="text-muted mb-4">ما تعرف المهمة! حاول تتصرف طبيعي</p>' +
          '<button class="btn btn--secondary btn--full mt-4" data-action="submitFakinAction" style="background:rgba(139,34,82,0.5);border-color:#8B2252">جاهز! 🎭</button>' +
        '</div>';
    } else {
      html =
        '<div class="faker-reveal" style="max-width:600px">' +
          '<div style="font-size:64px;margin-bottom:16px">' + catIcon + '</div>' +
          '<div class="faker-status faker-status--safe mb-4">' + escapeHtml(d.category) + '</div>' +
          (catHint ? '<p class="text-sm text-muted mb-2">' + catHint + '</p>' : '') +
          '<p class="text-sm text-muted mb-2">' + escapeHtml(d.instruction) + '</p>' +
          '<p class="text-2xl font-bold mb-6" style="color:#fff">' + escapeHtml(d.task) + '</p>' +
          '<button class="btn btn--primary btn--full" data-action="submitFakinAction">جاهز! ✅</button>' +
        '</div>';
    }
    document.getElementById('gameContent').innerHTML = html;
  },

  submitFakinAction() {
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: 'done' });
    ScreenMachine.showLockIn(document.getElementById('gameContent'));
  },

  handleFakinItDiscussion(d) {
    this.startTimer(d.timeLimit);
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds + ' (نقاش ' + d.subRound + '/' + d.maxSubRounds + ')';

    const players = d.players.map(p => {
      const faceContent = this._gAvatar(p.avatarData, 48, p.avatar);
      return '<div class="faker-silhouette" style="border:none;background:rgba(255,255,255,0.05)">' +
        '<div class="player-avatar__face' + (p.avatarData ? ' player-avatar__face--rich' : '') + '" style="background:' + escapeHtml(p.color) + ';width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;border:3px solid #000;box-shadow:3px 3px 0 #000">' + faceContent + '</div>' +
        '<span style="margin-top:6px;display:block;font-weight:600;color:#fff;font-size:13px">' + bdiName(p.name) + '</span>' +
      '</div>';
    }).join('');

    document.getElementById('gameContent').innerHTML =
      '<div class="faker-reveal" style="max-width:700px">' +
        '<p class="text-lg mb-2" style="color:rgba(255,255,255,0.6)">المهمة كانت:</p>' +
        '<p class="text-xl font-bold mb-3" style="color:#FF4466">"' + escapeHtml(d.task) + '"</p>' +
        '<p class="text-sm mb-4" style="color:rgba(255,255,255,0.4)">(' + escapeHtml(d.category) + ': ' + escapeHtml(d.instruction) + ')</p>' +
        '<div class="faker-frame mb-4" style="padding:20px">' +
          '<p class="text-xl font-bold mb-2" style="color:#fff">🗣️ ناقشوا مع بعض!</p>' +
          '<p class="text-sm mb-4" style="color:rgba(255,255,255,0.5)">مين تحسون إنه المزيّف؟</p>' +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">' + players + '</div>' +
        '</div>' +
        '<p class="text-sm text-muted">التصويت يبدأ بعد انتهاء النقاش...</p>' +
      '</div>';
  },

  handleFakinItVoting(d) {
    this.startTimer(d.timeLimit);
    const players = d.players.map(p => {
      const faceContent = this._gAvatar(p.avatarData, 56, p.avatar);
      return '<div class="faker-silhouette" style="cursor:pointer" data-action="votePlayer" data-id="' + escapeHtml(p.id) + '">' +
        '<div class="player-avatar__face' + (p.avatarData ? ' player-avatar__face--rich' : '') + '" style="background:' + escapeHtml(p.color) + ';width:68px;height:68px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:34px;border:4px solid #000;box-shadow:4px 4px 0 #000">' + faceContent + '</div>' +
        '<span style="margin-top:8px;display:block;font-weight:700;color:#fff">' + bdiName(p.name) + '</span>' +
      '</div>';
    }).join('');

    document.getElementById('gameContent').innerHTML =
      '<div class="faker-reveal" style="max-width:800px">' +
        '<p class="text-lg mb-2" style="color:rgba(255,255,255,0.6)">المهمة كانت:</p>' +
        '<p class="text-xl font-bold mb-4" style="color:#FF4466">"' + escapeHtml(d.task) + '"</p>' +
        '<div class="faker-silhouette mb-4" style="border:none;background:none">' +
          '<div class="faker-silhouette__question">🕵️</div>' +
        '</div>' +
        '<h3 class="text-2xl font-bold mb-4" style="color:#fff">من المزيّف؟</h3>' +
        '<div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">' + players + '</div>' +
        '<p class="text-muted mt-4" id="waitingCount"></p>' +
      '</div>';
  },

  votePlayer(id, el) {
    document.querySelectorAll('.player-avatar').forEach(c => c.style.borderColor = 'transparent');
    el.style.borderColor = '#006C35';
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
      '<div class="murder-option" data-action="submitTriviaAnswer" data-id="' + i + '">' +
        '<span class="murder-option__num">' + (i + 1) + '</span>' +
        '<span class="murder-option__text">' + escapeHtml(o) + '</span>' +
      '</div>'
    ).join('');

    document.getElementById('gameContent').innerHTML =
      '<div class="death-zone">' +
        '<div class="death-zone__title">💀 أجب أو مت!</div>' +
        '<p class="text-2xl font-bold mb-6" style="color:#fff">' + escapeHtml(d.question) + '</p>' +
        '<div class="murder-options">' + opts + '</div>' +
      '</div>';
  },

  submitTriviaAnswer(i, el) {
    const opt = el.closest('.murder-option') || el;
    document.querySelectorAll('.murder-option').forEach(b => { b.style.pointerEvents = 'none'; b.style.opacity = '0.5'; });
    opt.style.opacity = '1';
    opt.classList.add('murder-option--selected');
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: i });
  },

  handleTriviaMurderResults(d) {
    try {
      clearInterval(this.gameTimer);
      let html = '<div class="death-zone" style="max-width:600px">';
      html += '<div class="text-2xl mb-4" style="color:#00e676">✅ ' + escapeHtml(d.correctAnswer) + '</div>';

      if (d.newlyDead.length > 0) {
        html += '<div class="dolls-row mb-4">';
        d.newlyDead.forEach((p, i) => {
          const colors = ['crimson', 'purple', 'midnight', 'teal', 'rust', 'olive', 'navy', 'coral'];
          html += '<div class="doll doll--' + colors[i % colors.length] + '">' +
            '<div class="doll__body"><div class="doll__face">💀</div></div>' +
            '<div class="doll__name">' + bdiName(p.name) + '</div>' +
          '</div>';
        });
        html += '</div>';
        html += '<p class="text-xl font-bold" style="color:#FF4466">ماتوا!</p>';
        if (d.hasDeathChallenge) {
          html += '<p class="text-muted mt-2">⏳ تحدي الموت قادم...</p>';
        }
      } else {
        html += '<p class="text-lg" style="color:#00e676">✅ الكل نجا!</p>';
      }

      if (d.survivors && d.survivors.length > 0) {
        html += '<div class="dolls-row mt-4" style="opacity:0.6">';
        d.survivors.forEach((p, i) => {
          const colors = ['teal', 'navy', 'olive', 'coral'];
          html += '<div class="doll doll--' + colors[i % colors.length] + '" style="transform:scale(0.8)">' +
            '<div class="doll__body"><div class="doll__face">😌</div></div>' +
            '<div class="doll__name">' + bdiName(p.name) + '</div>' +
          '</div>';
        });
        html += '</div>';
      }

      html += '</div>';
      document.getElementById('gameContent').innerHTML = html;
    } catch (e) {
      console.error('handleTriviaMurderResults error:', e);
      this.showToast('حصل خطأ، حاول مرة ثانية', 'error');
    }
  },

  handleDeathChallenge(d) {
    // يُرسل فقط للاعبين الميتين - different UI per challenge type
    this.startTimer(d.timeLimit);
    const type = d.challengeType || 'write';
    const icon = d.icon || '💀';
    let inputHtml = '';

    if (type === 'chalice') {
      const optCount = d.options || 5;
      const chaliceEmojis = ['🏆', '🥂', '🍷', '🫗', '🥃'];
      let btns = '<div class="murder-options" style="flex-direction:row;flex-wrap:wrap;justify-content:center">';
      for (let i = 1; i <= optCount; i++) {
        btns += '<div class="murder-option" data-action="submitDeathAnswer" data-chalice="' + i + '" style="min-width:60px;justify-content:center">' +
          '<span style="font-size:28px">' + (chaliceEmojis[i-1] || i) + '</span>' +
        '</div>';
      }
      btns += '</div>';
      inputHtml = btns;
    } else {
      const placeholder = type === 'math' ? 'اكتب الجواب (رقم)...' :
                          type === 'mindmeld' ? 'اكتب كلمة واحدة فقط...' :
                          'إجابتك السريعة...';
      inputHtml =
        '<input type="text" class="input mb-4" id="deathInput" placeholder="' + placeholder + '" maxlength="50" ' +
          'style="background:rgba(255,255,255,0.1);color:#fff;border-color:#8B2252">' +
        '<button class="btn btn--primary btn--full" data-action="submitDeathAnswer" style="background:#8B2252">أنقذ نفسك! 🏃</button>';
    }

    document.getElementById('gameContent').innerHTML =
      '<div class="death-zone">' +
        '<div class="death-zone__title">⚔️ أرضية القتل!</div>' +
        '<div style="font-size:64px;margin-bottom:16px">' + icon + '</div>' +
        '<p class="text-xl mb-6" style="color:#fff">' + escapeHtml(d.challenge) + '</p>' +
        inputHtml +
      '</div>';
    document.getElementById('deathInput')?.focus();
  },

  submitDeathAnswer(chaliceValue) {
    if (this._submitting) return;
    let answer;
    if (chaliceValue) {
      answer = String(chaliceValue);
    } else {
      answer = document.getElementById('deathInput')?.value?.trim();
      if (!answer) return this.showToast('اكتب شي!', 'error');
    }
    this._submitting = true;
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer });
    ScreenMachine.showLockIn(document.getElementById('gameContent'));
  },

  handleDeathChallengeStarted(d) {
    const gc = document.getElementById('gameContent');
    if (!gc) return;
    const currentContent = gc.innerHTML;
    if (currentContent.includes('أرضية القتل')) return;
    gc.innerHTML =
      '<div class="death-zone">' +
        '<div class="death-zone__title">⚔️ تحدي الموت جاري!</div>' +
        '<div class="dolls-row mb-4">' +
          d.deadPlayers.map((p, i) => {
            const colors = ['crimson', 'purple', 'midnight', 'teal'];
            return '<div class="doll doll--' + colors[i % colors.length] + '">' +
              '<div class="doll__body"><div class="doll__face">💀</div></div>' +
              '<div class="doll__name">' + bdiName(p.name) + '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<p class="text-muted">يحاولون النجاة...</p>' +
      '</div>';
  },

  handleDeathChallengeResult(d) {
    try {
      clearInterval(this.gameTimer);
      let html = '<div class="death-zone">';

      if (d.challengeType === 'chalice' && d.poisonChoice) {
        const chaliceEmojis = ['🏆', '🥂', '🍷', '🫗', '🥃'];
        html += '<div class="text-2xl mb-3" style="color:#FF4466">الكأس المسموم كان: ' + (chaliceEmojis[d.poisonChoice - 1] || d.poisonChoice) + ' رقم ' + d.poisonChoice + '</div>';
      } else if (d.challengeType === 'math' && d.correctAnswer) {
        html += '<div class="text-lg mb-3 text-muted">الجواب الصحيح: ' + escapeHtml(d.correctAnswer) + '</div>';
      }

      if (d.revived && d.revived.length > 0) {
        html += '<div class="dolls-row mb-4">';
        d.revived.forEach((p, i) => {
          const colors = ['teal', 'olive', 'navy', 'coral'];
          html += '<div class="doll doll--' + colors[i % colors.length] + '">' +
            '<div class="doll__body"><div class="doll__face">😇</div></div>' +
            '<div class="doll__name">' + bdiName(p.name) + '</div>' +
          '</div>';
        });
        html += '</div>';
        html += '<p class="text-xl font-bold" style="color:#00e676">نجوا من الموت! 🎉</p>';
      }

      if (d.stillDead && d.stillDead.length > 0) {
        html += '<div class="dolls-row mt-4 mb-4">';
        d.stillDead.forEach((p, i) => {
          const colors = ['crimson', 'purple', 'midnight', 'rust'];
          html += '<div class="doll doll--' + colors[i % colors.length] + '">' +
            '<div class="doll__body"><div class="doll__face">💀</div></div>' +
            '<div class="doll__name">' + bdiName(p.name) + '</div>' +
          '</div>';
        });
        html += '</div>';
        html += '<p class="text-xl font-bold" style="color:#FF4466">ما نجوا...</p>';
      }

      if (d.challengeType === 'mindmeld') {
        html += '<div class="text-sm mt-3 text-muted">🧠 التوافق الذهني: لازم كلكم تكتبون نفس الكلمة!</div>';
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
    const categoryBadge = d.category ? '<div class="info-box mb-3"><div class="info-box__label">الفئة</div><div class="info-box__value">' + escapeHtml(d.category) + '</div></div>' : '';
    document.getElementById('gameContent').innerHTML =
      '<div class="lie-card">' +
        categoryBadge +
        '<div class="lie-card__question">' + escapeHtml(d.question) + '</div>' +
        '<p class="text-sm mb-4" style="color:rgba(255,255,255,0.6)">اكتب إجابة كاذبة تبدو مقنعة عشان تخدع الباقين!</p>' +
        '<input type="text" class="input mb-4" id="lieInput" placeholder="كذبتك المقنعة..." maxlength="50" style="background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(218,165,32,0.4)">' +
        '<button class="btn btn--primary btn--full" data-action="submitLie" style="background:linear-gradient(135deg,#DAA520,#B8860B);border-color:#000">إرسال 🎭</button>' +
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
    ScreenMachine.showLockIn(document.getElementById('gameContent'));
  },

  handleFibbageVoting(d) {
    this.startTimer(d.timeLimit);
    const opts = d.options.map((o, i) =>
      '<div class="murder-option" style="border-color:rgba(218,165,32,0.3)" data-action="guessFibbage" data-id="' + escapeHtml(o.id) + '">' +
        '<span class="murder-option__num" style="background:rgba(218,165,32,0.3);color:#DAA520">' + String.fromCharCode(65 + i) + '</span>' +
        '<span class="murder-option__text">' + escapeHtml(o.text) + '</span>' +
      '</div>'
    ).join('');

    document.getElementById('gameContent').innerHTML =
      '<div class="lie-card">' +
        '<div class="lie-card__question" style="font-size:20px;margin-bottom:16px">' + escapeHtml(d.question) + '</div>' +
        '<p class="text-sm mb-4" style="color:rgba(255,255,255,0.5)">🔍 اختر الإجابة الصحيحة من بين الكذب!</p>' +
        '<div class="murder-options">' + opts + '</div>' +
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

    const colors = DRAW_COLORS.map((c, i) =>
      '<div class="color-swatch' + (i === 0 ? ' active' : '') + '" style="background:' + c + '" data-action="setDrawColor" data-color="' + c + '"></div>'
    ).join('');

    const sizes = DRAW_SIZES.map((s, i) =>
      '<div class="brush-size' + (i === 1 ? ' active' : '') + '" data-action="setBrushSize" data-size="' + s + '">' +
        '<div style="width:' + Math.min(s, 20) + 'px;height:' + Math.min(s, 20) + 'px;background:currentColor;border-radius:50%"></div>' +
      '</div>'
    ).join('');

    const allDrawBadge = d.allDraw
      ? '<p class="text-sm text-muted mb-2">الكل يرسمون في نفس الوقت!</p>'
      : '';

    document.getElementById('gameContent').innerHTML =
      '<div class="drawing-area">' +
        '<div class="badge badge--primary mb-2">🎨 ارسم!</div>' +
        allDrawBadge +
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
    const presentInfo = d.presentNum ? ' (رسمة ' + d.presentNum + '/' + d.presentTotal + ')' : '';
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + presentInfo;

    if (isDrawer) {
      document.getElementById('gameContent').innerHTML =
        '<div class="text-center">' +
          '<div class="speech-bubble mb-4" style="margin:0 auto">' +
            '<div class="speech-bubble__text">🎨 هذي رسمتك - انتظر التخمينات!</div>' +
          '</div>' +
          '<div id="drawingDisplay" style="max-width:400px;margin:0 auto;border-radius:16px;overflow:hidden"></div>' +
          '<p class="text-muted mt-4" id="waitingCount">ننتظر التخمينات...</p>' +
        '</div>';
    } else {
      const drawerLabel = d.drawerName ? '<div class="speech-bubble__author">🎨 ' + escapeHtml(d.drawerName) + '</div>' : '';
      document.getElementById('gameContent').innerHTML =
        '<div style="max-width:600px;width:100%">' +
          '<div class="speech-bubble mb-4" style="margin:0 auto">' +
            '<div class="speech-bubble__text">🤔 اكتب عنوان مزيّف!</div>' +
            drawerLabel +
          '</div>' +
          '<div id="drawingDisplay" style="max-width:400px;margin:0 auto;margin-bottom:20px;border-radius:16px;overflow:hidden"></div>' +
          '<input type="text" class="input mb-4" id="guessInput" placeholder="اكتب عنوان مزيّف..." maxlength="50">' +
          '<button class="btn btn--primary btn--full" data-action="submitGuessDrawful">إرسال 🤔</button>' +
        '</div>';
      document.getElementById('guessInput')?.focus();
    }

    this.renderDrawing(d.drawing, document.getElementById('drawingDisplay'));
  },

  submitGuessDrawful() {
    const guess = document.getElementById('guessInput')?.value?.trim();
    if (!guess) return this.showToast('اكتب تخمين!', 'error');
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: guess });
    ScreenMachine.showLockIn(document.getElementById('gameContent'));
  },

  handleDrawfulVoting(d) {
    this.startTimer(d.timeLimit);
    const isDrawer = d.drawerId === this.myId;

    const opts = d.options.map((o, i) =>
      '<div class="murder-option" style="border-color:rgba(0,200,83,0.3)" ' + (isDrawer ? '' : 'data-action="guessFibbage" data-id="' + escapeHtml(o.id) + '"') + '>' +
        '<span class="murder-option__num" style="background:rgba(0,200,83,0.2);color:#00C853">' + String.fromCharCode(65 + i) + '</span>' +
        '<span class="murder-option__text">' + escapeHtml(o.text) + '</span>' +
      '</div>'
    ).join('');

    document.getElementById('gameContent').innerHTML =
      '<div style="max-width:600px;width:100%">' +
        '<div class="speech-bubble mb-4" style="margin:0 auto">' +
          '<div class="speech-bubble__text">' + (isDrawer ? '🎨 انتظر التصويت' : '🤔 أي تخمين صحيح؟') + '</div>' +
        '</div>' +
        '<div id="drawingDisplay" style="max-width:300px;margin:0 auto;margin-bottom:16px;border-radius:16px;overflow:hidden"></div>' +
        '<div class="murder-options">' + opts + '</div>' +
        '<p class="text-muted text-center mt-4" id="waitingCount"></p>' +
      '</div>';

    this.renderDrawing(d.drawing, document.getElementById('drawingDisplay'));
  },

  handleDrawfulDrawingResult(d) {
    clearInterval(this.gameTimer);
    const correctText = d.options.find(o => o.isCorrect);

    let html = '<div class="text-center" style="max-width:600px">';
    html += '<div id="drawingDisplay" style="max-width:300px;margin:0 auto;margin-bottom:16px;border-radius:16px;overflow:hidden"></div>';
    html += '<div class="speech-bubble mb-4" style="margin:0 auto">';
    html += '<div class="speech-bubble__text" style="font-size:14px;color:#888">الجواب الصحيح:</div>';
    html += '<div class="speech-bubble__text" style="font-size:22px;color:#000">' + escapeHtml(d.prompt) + '</div>';
    html += '<div class="speech-bubble__author">🎨 ' + escapeHtml(d.drawerName) + '</div>';
    html += '</div>';

    if (d.options) {
      html += '<div class="murder-options mb-4">';
      d.options.forEach(o => {
        const icon = o.isCorrect ? '✅' : '🎭';
        const author = o.authorName ? ' (كتبها: ' + escapeHtml(o.authorName) + ')' : '';
        html += '<div class="murder-option" style="pointer-events:none;border-color:' + (o.isCorrect ? 'rgba(0,200,83,0.5)' : 'rgba(255,255,255,0.1)') + '">' +
          '<span class="murder-option__num" style="background:' + (o.isCorrect ? 'rgba(0,200,83,0.2)' : 'rgba(255,255,255,0.05)') + '">' + icon + '</span>' +
          '<span class="murder-option__text">' + escapeHtml(o.text) + author + '</span>' +
        '</div>';
      });
      html += '</div>';
    }

    if (d.hasMore) {
      html += '<p class="text-sm text-muted">الرسمة التالية قريباً... (' + d.presentNum + '/' + d.presentTotal + ')</p>';
    }

    html += '</div>';
    document.getElementById('gameContent').innerHTML = html;
    this.renderDrawing(d.drawing, document.getElementById('drawingDisplay'));

    if (d.playerResults) {
      const me = d.playerResults.find(r => r.playerId === this.myId);
      if (me && me.points > 0) {
        AudioEngine.correctAnswer();
      }
    }
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
    ScreenMachine.showLockIn(document.getElementById('gameContent'));
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
  // 🤔 تبي ولا ما تبي (Would You Rather)
  // ═══════════════════════════════════════════════════════════════

  handleWouldYouRatherQuestion(d) {
    this._submitting = false;
    this.showScreen('gameScreen');
    this.setTheme('wouldyourather');
    this.showRoundInfo(d.round, d.maxRounds, '🤔 تبي ولا ما تبي');
    this.startTimer(d.timeLimit);
    this.setHint('اختر خيار واحد!');
    if (d.commentary) this.showCommentary(d.commentary);

    document.getElementById('gameContent').innerHTML =
      '<div class="wyr-container">' +
        '<div class="wyr-title">تبي ولا ما تبي؟ 🤔</div>' +
        '<div class="wyr-options">' +
          '<button class="wyr-option wyr-option--a" data-action="submitWyrChoice" data-choice="a">' +
            '<div class="wyr-option__text">' + escapeHtml(d.optionA) + '</div>' +
          '</button>' +
          '<div class="wyr-vs">أو</div>' +
          '<button class="wyr-option wyr-option--b" data-action="submitWyrChoice" data-choice="b">' +
            '<div class="wyr-option__text">' + escapeHtml(d.optionB) + '</div>' +
          '</button>' +
        '</div>' +
        '<p class="text-muted mt-4" id="waitingCount"></p>' +
      '</div>';
  },

  submitWyrChoice(choice, el) {
    if (this._submitting) return;
    this._submitting = true;
    AudioEngine.vote();
    el.classList.add('wyr-option--selected');
    document.querySelectorAll('.wyr-option:not(.wyr-option--selected)').forEach(b => b.style.opacity = '0.3');
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: choice });
  },

  handleWouldYouRatherResults(d) {
    clearInterval(this.gameTimer);
    AudioEngine.revealSting(App.currentGame);
    const totalVotes = (d.countA || 0) + (d.countB || 0);
    const pctA = totalVotes > 0 ? Math.round((d.countA / totalVotes) * 100) : 50;
    const pctB = 100 - pctA;

    document.getElementById('gameContent').innerHTML =
      '<div class="wyr-container">' +
        '<div class="wyr-title">النتائج! 📊</div>' +
        '<div class="wyr-results">' +
          '<div class="wyr-result wyr-result--a">' +
            '<div class="wyr-result__text">' + escapeHtml(d.optionA) + '</div>' +
            '<div class="wyr-result__pct" id="wyrPctA">0%</div>' +
            '<div class="wyr-result__count">' + d.countA + ' لاعبين</div>' +
          '</div>' +
          '<div class="wyr-result wyr-result--b">' +
            '<div class="wyr-result__text">' + escapeHtml(d.optionB) + '</div>' +
            '<div class="wyr-result__pct" id="wyrPctB">0%</div>' +
            '<div class="wyr-result__count">' + d.countB + ' لاعبين</div>' +
          '</div>' +
        '</div>' +
        (d.isSplit ? '<div class="wyr-split-badge">🎯 انقسام مثالي! الكل يكسب!</div>' : '') +
      '</div>';

    this._animatePercentage('wyrPctA', pctA, 1200);
    this._animatePercentage('wyrPctB', pctB, 1200);
  },

  // ═══════════════════════════════════════════════════════════════
  // 💬 من قال؟ (Who Said It)
  // ═══════════════════════════════════════════════════════════════

  handleWhoSaidItWrite(d) {
    this._submitting = false;
    this.showScreen('gameScreen');
    this.setTheme('whosaidit');
    this.showRoundInfo(d.round, d.maxRounds, '💬 من قال؟');
    this.startTimer(d.timeLimit);
    this.setHint('اكتب إجابة صادقة!');

    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:600px">' +
        '<div class="badge badge--info mb-4">💬 اكتب شي عن نفسك</div>' +
        '<p class="text-2xl font-bold mb-6">' + escapeHtml(d.prompt) + '</p>' +
        '<textarea class="input input--game input--textarea" id="answerInput" placeholder="اكتب إجابتك..." maxlength="150" rows="3"></textarea>' +
        '<button class="btn btn--primary btn--lg btn--full mt-3" data-action="submitAnswer">إرسال 💬</button>' +
      '</div>';
    document.getElementById('answerInput')?.focus();
  },

  handleWhoSaidItGuess(d) {
    this._submitting = false;
    this.startTimer(d.timeLimit);
    this.setHint('خمّن مين كتب كل إجابة!');

    let html = '<div class="panel" style="max-width:700px;width:100%">' +
      '<div class="badge badge--info mb-4">🕵️ من قال هالكلام؟</div>';

    d.statements.forEach((s, idx) => {
      html += '<div class="wsi-statement" id="wsiStatement' + idx + '">' +
        '<p class="wsi-statement__text">"' + escapeHtml(s.text) + '"</p>' +
        '<div class="wsi-statement__options">';
      d.players.forEach(p => {
        html += '<button class="wsi-player-btn" data-action="guessWhoSaidIt" data-stmt="' + idx + '" data-player="' + escapeHtml(p.id) + '">' +
          bdiName(p.name) + '</button>';
      });
      html += '</div></div>';
    });

    html += '<p class="text-muted text-center mt-4" id="waitingCount"></p></div>';
    document.getElementById('gameContent').innerHTML = html;
  },

  _wsiGuesses: {},
  guessWhoSaidIt(playerId, el) {
    const stmtIdx = el.closest('.wsi-statement')?.id?.replace('wsiStatement', '');
    if (stmtIdx === undefined) return;
    const container = document.getElementById('wsiStatement' + stmtIdx);
    if (container) {
      container.querySelectorAll('.wsi-player-btn').forEach(b => b.classList.remove('wsi-player-btn--selected'));
      el.classList.add('wsi-player-btn--selected');
    }
    this._wsiGuesses[stmtIdx] = playerId;
    AudioEngine.vote();

    // Auto-submit when all statements have a guess
    const stmtCount = document.querySelectorAll('.wsi-statement').length;
    if (Object.keys(this._wsiGuesses).length >= stmtCount && !this._submitting) {
      this._submitting = true;
      this.socket.emit('submitAnswer', { code: this.currentRoom, answer: JSON.stringify(this._wsiGuesses) });
      ScreenMachine.showLockIn(document.getElementById('gameContent'));
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // ⚡ أسرع واحد (Speed Round)
  // ═══════════════════════════════════════════════════════════════

  handleSpeedRoundQuestion(d) {
    this._submitting = false;
    this.showScreen('gameScreen');
    this.setTheme('speedround');
    this.showRoundInfo(d.round, d.maxRounds, '⚡ أسرع واحد');
    this.startTimer(d.timeLimit);
    this.setHint('أجب بأسرع ما يمكن!');
    AudioEngine.revealSting(App.currentGame);

    document.getElementById('gameContent').innerHTML =
      '<div class="speed-container">' +
        '<div class="speed-badge">⚡ سؤال ' + d.round + '</div>' +
        '<p class="speed-question">' + escapeHtml(d.question) + '</p>' +
        (d.category ? '<span class="game-tag mb-4">' + escapeHtml(d.category) + '</span>' : '') +
        '<div class="speed-input-wrap">' +
          '<input type="text" class="input input--game" id="answerInput" placeholder="اكتب الجواب..." maxlength="50" autocomplete="off">' +
          '<button class="btn btn--primary btn--lg" data-action="submitAnswer">⚡</button>' +
        '</div>' +
        '<p class="text-muted mt-2" id="waitingCount"></p>' +
      '</div>';

    const input = document.getElementById('answerInput');
    if (input) {
      input.focus();
      input.addEventListener('keypress', e => {
        if (e.key === 'Enter') this.submitAnswer();
      });
    }
  },

  handleSpeedRoundResult(d) {
    clearInterval(this.gameTimer);
    let html = '<div class="speed-container">' +
      '<div class="speed-badge">⚡ الجواب</div>' +
      '<p class="speed-answer">' + escapeHtml(d.correctAnswer) + '</p>';

    if (d.rankings && d.rankings.length > 0) {
      html += '<div class="speed-rankings">';
      d.rankings.forEach((r, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
        html += '<div class="speed-rank">' +
          '<span class="speed-rank__pos">' + medal + '</span>' +
          '<span class="speed-rank__name">' + bdiName(r.name) + '</span>' +
          '<span class="speed-rank__time">' + (r.time ? (r.time / 1000).toFixed(1) + 'ث' : '⏱️') + '</span>' +
          '<span class="speed-rank__points" style="color:#D4AF37">+' + r.points + '</span>' +
        '</div>';
      });
      html += '</div>';
    }

    if (d.noCorrect) {
      html += '<p class="text-muted mt-4">ما أحد جاوب صح! 😅</p>';
    }

    html += '</div>';
    document.getElementById('gameContent').innerHTML = html;
    if (d.rankings && d.rankings.length > 0) AudioEngine.applause();
  },

  // ═══════════════════════════════════════════════════════════════
  // 🎮 سوّاق أعمى (Backseat Gamer)
  // ═══════════════════════════════════════════════════════════════

  handleBackseatGamerDescribe(d) {
    this._submitting = false;
    this.showScreen('gameScreen');
    this.setTheme('backseatgamer');
    this.showRoundInfo(d.round, d.maxRounds, '🎮 سوّاق أعمى');
    this.startTimer(d.timeLimit);
    this.setHint('وصّف الكلمة بدون الكلمات المحرّمة!');

    let tabooHtml = '';
    if (d.tabooWords && d.tabooWords.length > 0) {
      tabooHtml = '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:16px">';
      d.tabooWords.forEach(w => {
        tabooHtml += '<span style="background:rgba(255,68,68,0.3);color:#ff4444;padding:4px 12px;border-radius:20px;font-size:14px">🚫 ' + escapeHtml(w) + '</span>';
      });
      tabooHtml += '</div>';
    }

    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:600px">' +
        '<div class="badge badge--danger mb-4">🎮 أنت الواصف!</div>' +
        '<div style="font-size:36px;font-weight:900;color:#00E5FF;margin-bottom:16px;text-shadow:0 0 20px rgba(0,229,255,0.5)">' + escapeHtml(d.word) + '</div>' +
        (d.category ? '<span class="game-tag mb-3">' + escapeHtml(d.category) + '</span>' : '') +
        tabooHtml +
        '<textarea class="input input--game input--textarea" id="answerInput" placeholder="وصّف الكلمة بدون استخدام الكلمات المحرّمة..." maxlength="200" rows="2"></textarea>' +
        '<button class="btn btn--primary btn--full mt-3" data-action="submitAnswer">إرسال الوصف 🎮</button>' +
      '</div>';
    document.getElementById('answerInput')?.focus();
  },

  handleBackseatGamerGuess(d) {
    this._submitting = false;
    this.showScreen('gameScreen');
    this.setTheme('backseatgamer');
    this.showRoundInfo(d.round, d.maxRounds, '🎮 سوّاق أعمى');
    this.startTimer(d.timeLimit);
    this.setHint('انتظر الوصف من ' + escapeHtml(d.describerName) + '...');

    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:600px;text-align:center">' +
        '<div class="badge badge--info mb-4">🎮 استعد للتخمين!</div>' +
        (d.category ? '<span class="game-tag mb-3">' + escapeHtml(d.category) + '</span>' : '') +
        '<div style="font-size:48px;margin:24px 0">🤔</div>' +
        '<p class="text-muted">' + escapeHtml(d.describerName) + ' يوصف الكلمة...</p>' +
      '</div>';
  },

  handleBackseatGamerClue(d) {
    this._submitting = false;
    this.startTimer(d.timeLimit);
    this.setHint('خمّن الكلمة!');

    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:600px">' +
        '<div class="badge badge--warning mb-4">🎮 ' + escapeHtml(d.describerName) + ' يقول:</div>' +
        '<p class="text-2xl font-bold mb-4" style="color:#00E5FF">"' + escapeHtml(d.clue) + '"</p>' +
        (d.category ? '<span class="game-tag mb-3">' + escapeHtml(d.category) + '</span>' : '') +
        '<div class="speed-input-wrap">' +
          '<input type="text" class="input input--game" id="answerInput" placeholder="اكتب تخمينك..." maxlength="50" autocomplete="off">' +
          '<button class="btn btn--primary btn--lg" data-action="submitAnswer">🎮</button>' +
        '</div>' +
      '</div>';

    const input = document.getElementById('answerInput');
    if (input) {
      input.focus();
      input.addEventListener('keypress', e => {
        if (e.key === 'Enter') this.submitAnswer();
      });
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 🔀 سبليت ذا روم (Split the Room)
  // ═══════════════════════════════════════════════════════════════

  handleSplitTheRoomWrite(d) {
    this._submitting = false;
    this.showScreen('gameScreen');
    this.setTheme('splittheroom');
    this.showRoundInfo(d.round, d.maxRounds, '🔀 سبليت ذا روم');
    this.startTimer(d.timeLimit);

    if (d.isFeatured) {
      this.setHint('اكمل السيناريو!');
      document.getElementById('gameContent').innerHTML =
        '<div class="panel" style="max-width:600px">' +
          '<div class="badge badge--info mb-4">🔀 اكمل الفراغ!</div>' +
          '<p class="text-xl mb-4">' + escapeHtml(d.scenario) + '</p>' +
          '<input type="text" class="input" id="answerInput" placeholder="اكتب تكملة..." maxlength="80">' +
          '<button class="btn btn--primary btn--full mt-4" data-action="submitAnswer">إرسال 🔀</button>' +
        '</div>';
      document.getElementById('answerInput')?.focus();
    } else {
      this.setHint('انتظر ' + escapeHtml(d.featuredName) + '...');
      this.showWaiting(escapeHtml(d.featuredName) + ' يكمل السيناريو...');
    }
  },

  handleSplitTheRoomVote(d) {
    this._submitting = false;
    this.startTimer(d.timeLimit);
    this.setHint('نعم أو لا؟');

    document.getElementById('gameContent').innerHTML =
      '<div class="split-container">' +
        '<div class="split-scenario">' + escapeHtml(d.completedScenario) + '</div>' +
        '<p class="text-lg mb-4">— ' + escapeHtml(d.featuredName) + '</p>' +
        '<div class="split-buttons">' +
          '<button class="split-btn split-btn--yes" data-action="submitSplitVote" data-vote="yes">نعم ✅</button>' +
          '<button class="split-btn split-btn--no" data-action="submitSplitVote" data-vote="no">لا ❌</button>' +
        '</div>' +
        '<p class="text-muted mt-4" id="waitingCount"></p>' +
      '</div>';
  },

  submitSplitVote(vote, el) {
    if (this._submitting) return;
    this._submitting = true;
    AudioEngine.vote();
    el.classList.add('split-btn--selected');
    document.querySelectorAll('.split-btn:not(.split-btn--selected)').forEach(b => b.style.opacity = '0.3');
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: vote });
  },

  // ═══════════════════════════════════════════════════════════════
  // 👨‍⚖️ المحكمة الكبرى (Courtroom)
  // ═══════════════════════════════════════════════════════════════

  handleCourtroomWrite(d) {
    this._submitting = false;
    this.showScreen('gameScreen');
    this.setTheme('courtroom');
    this.showRoundInfo(d.round, d.maxRounds, '👨‍⚖️ المحكمة الكبرى');
    this.startTimer(d.timeLimit);

    const roleEmoji = d.role === 'prosecutor' ? '🔴' : d.role === 'defender' ? '🔵' : '👥';
    const roleName = d.role === 'prosecutor' ? 'المدعي' : d.role === 'defender' ? 'المدافع' : 'هيئة المحلفين';
    const roleColor = d.role === 'prosecutor' ? 'rgba(255,68,68,0.2)' : d.role === 'defender' ? 'rgba(68,138,255,0.2)' : 'rgba(255,255,255,0.1)';

    if (d.role === 'jury') {
      this.setHint('انتظر المرافعات...');
      document.getElementById('gameContent').innerHTML =
        '<div class="panel" style="max-width:600px;text-align:center">' +
          '<div class="badge badge--info mb-4">👥 أنت من هيئة المحلفين</div>' +
          '<p class="text-2xl font-bold mb-4">📜 ' + escapeHtml(d.accusation) + '</p>' +
          '<p class="text-muted">🔴 المدعي: ' + escapeHtml(d.prosecutorName) + '</p>' +
          '<p class="text-muted">🔵 المدافع: ' + escapeHtml(d.defenderName) + '</p>' +
          '<div style="font-size:48px;margin:24px 0">⚖️</div>' +
          '<p class="text-muted">انتظر المرافعات...</p>' +
        '</div>';
    } else {
      this.setHint(d.role === 'prosecutor' ? 'اكتب تهمتك!' : 'اكتب دفاعك!');
      document.getElementById('gameContent').innerHTML =
        '<div class="panel" style="max-width:600px">' +
          '<div class="badge mb-4" style="background:' + roleColor + '">' + roleEmoji + ' أنت ' + escapeHtml(roleName) + '</div>' +
          '<p class="text-2xl font-bold mb-4">📜 ' + escapeHtml(d.accusation) + '</p>' +
          '<textarea class="input input--game input--textarea" id="answerInput" placeholder="' + (d.role === 'prosecutor' ? 'اكتب حجتك ضد المتهم...' : 'اكتب دفاعك عن المتهم...') + '" maxlength="200" rows="3"></textarea>' +
          '<button class="btn btn--primary btn--full mt-3" data-action="submitAnswer">إرسال ' + roleEmoji + '</button>' +
        '</div>';
      document.getElementById('answerInput')?.focus();
    }
  },

  handleCourtroomVoting(d) {
    this._submitting = false;
    this.startTimer(d.timeLimit);
    this.setHint('مذنب أو بريء؟');

    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:700px;width:100%">' +
        '<div class="badge badge--info mb-4">⚖️ ' + escapeHtml(d.accusation) + '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">' +
          '<div style="background:rgba(255,68,68,0.15);padding:16px;border-radius:12px">' +
            '<p style="color:#ff4444;font-weight:bold;margin-bottom:8px">🔴 ' + escapeHtml(d.prosecutorName) + '</p>' +
            '<p style="color:#fff;font-size:14px">"' + escapeHtml(d.prosecutorArg) + '"</p>' +
          '</div>' +
          '<div style="background:rgba(68,138,255,0.15);padding:16px;border-radius:12px">' +
            '<p style="color:#448AFF;font-weight:bold;margin-bottom:8px">🔵 ' + escapeHtml(d.defenderName) + '</p>' +
            '<p style="color:#fff;font-size:14px">"' + escapeHtml(d.defenderArg) + '"</p>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
          '<button class="btn btn--full" style="background:#ff4444;font-size:20px;padding:16px" data-action="submitCourtroomVote" data-vote="guilty">🔨 مذنب!</button>' +
          '<button class="btn btn--full" style="background:#448AFF;font-size:20px;padding:16px" data-action="submitCourtroomVote" data-vote="innocent">✨ بريء!</button>' +
        '</div>' +
      '</div>';
  },

  submitCourtroomVote(vote) {
    if (this._submitting) return;
    this._submitting = true;
    AudioEngine.submit();
    this.socket.emit('submitVote', { code: this.currentRoom, vote });
  },

  // ═══════════════════════════════════════════════════════════════
  // ⚖️ المحكمة (Debate Me)
  // ═══════════════════════════════════════════════════════════════

  handleDebateMeWrite(d) {
    this._submitting = false;
    this.showScreen('gameScreen');
    this.setTheme('debateme');
    this.showRoundInfo(d.round, d.maxRounds, '⚖️ المحكمة');
    this.startTimer(d.timeLimit);
    this.setHint('اكتب أقوى حجة!');

    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:600px">' +
        '<div class="badge badge--info mb-4">⚖️ الموضوع</div>' +
        '<p class="text-2xl font-bold mb-4">' + escapeHtml(d.topic) + '</p>' +
        '<div class="debate-side" style="background:' + (d.yourSide === 'side1' ? 'rgba(0,200,83,0.2)' : 'rgba(255,68,68,0.2)') + ';padding:12px;border-radius:12px;margin-bottom:16px">' +
          '<p class="text-lg font-bold">أنت في فريق: ' + escapeHtml(d.yourSideLabel) + '</p>' +
        '</div>' +
        '<textarea class="input input--game input--textarea" id="answerInput" placeholder="اكتب حجتك هنا..." maxlength="200" rows="3"></textarea>' +
        '<button class="btn btn--primary btn--full mt-3" data-action="submitAnswer">إرسال الحجة ⚖️</button>' +
      '</div>';
    document.getElementById('answerInput')?.focus();
  },

  handleDebateMeVoting(d) {
    this._submitting = false;
    this.startTimer(d.timeLimit);
    this.setHint('صوّت لأقوى حجة!');

    let html = '<div class="panel" style="max-width:700px;width:100%">' +
      '<div class="badge badge--info mb-4">⚖️ ' + escapeHtml(d.topic) + '</div>' +
      '<div class="debate-grid">';

    d.arguments.forEach(arg => {
      html += '<button class="vote-option" data-action="voteAnswer" data-id="' + escapeHtml(arg.id) + '">' +
        '<div class="vote-option__side" style="color:' + (arg.side === 'side1' ? '#00C853' : '#ff4444') + '">' + escapeHtml(arg.sideLabel) + '</div>' +
        '<div class="vote-option__text">' + escapeHtml(arg.text) + '</div>' +
      '</button>';
    });

    html += '</div><p class="text-muted text-center mt-4" id="waitingCount"></p></div>';
    document.getElementById('gameContent').innerHTML = html;
  },

  // ═══════════════════════════════════════════════════════════════
  // 🎡 عجلة العقاب (Punishment Wheel)
  // ═══════════════════════════════════════════════════════════════

  handlePunishmentWheelQuestion(d) {
    this._submitting = false;
    this.showScreen('gameScreen');
    this.setTheme('punishmentwheel');
    this.showRoundInfo(d.round, d.maxRounds, '🎡 عجلة العقاب');
    this.startTimer(d.timeLimit);
    this.setHint('جاوب بسرعة!');

    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:600px">' +
        '<div class="badge badge--danger mb-4">🎡 جاوب أو انعاقب!</div>' +
        (d.category ? '<span class="game-tag mb-3">' + escapeHtml(d.category) + '</span>' : '') +
        '<p class="text-2xl font-bold mb-4">' + escapeHtml(d.question) + '</p>' +
        '<div class="speed-input-wrap">' +
          '<input type="text" class="input input--game" id="answerInput" placeholder="اكتب جوابك..." maxlength="50" autocomplete="off">' +
          '<button class="btn btn--primary btn--lg" data-action="submitAnswer">🎡</button>' +
        '</div>' +
        '<p class="text-muted mt-2" id="waitingCount"></p>' +
      '</div>';

    const input = document.getElementById('answerInput');
    if (input) {
      input.focus();
      input.addEventListener('keypress', e => {
        if (e.key === 'Enter') this.submitAnswer();
      });
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 🎮 Host Controls (إيقاف، تخطي، طرد)
  // ═══════════════════════════════════════════════════════════════

  pauseGame() {
    if (!this.isHost || !this.currentRoom) return;
    this.socket.emit('pauseGame', this.currentRoom);
  },

  skipQuestion() {
    if (!this.isHost || !this.currentRoom) return;
    this.socket.emit('skipQuestion', this.currentRoom);
    this.showToast('تم تخطي السؤال', 'success');
  },

  showKickMenu() {
    if (!this.isHost) return;
    const modal = document.getElementById('kickModal');
    if (!modal) return;
    const list = document.getElementById('kickPlayersList');
    if (!list) return;
    const grid = document.getElementById('playersGrid');
    if (!grid) return;

    let html = '';
    grid.querySelectorAll('[data-player-id]').forEach(el => {
      const pid = el.dataset.playerId;
      const name = el.querySelector('.player-avatar__name')?.textContent || '';
      if (pid !== this.myId) {
        html += '<button class="btn btn--danger btn--full" data-action="kickPlayer" data-id="' + escapeHtml(pid) + '">🚫 طرد ' + bdiName(name) + '</button>';
      }
    });
    list.innerHTML = html || '<p class="text-muted">ما فيه لاعبين ثانيين</p>';
    if (typeof A11y !== 'undefined') {
      A11y.openModal('kickModal');
    } else {
      modal.classList.remove('hidden');
    }
  },

  closeKickMenu() {
    if (typeof A11y !== 'undefined') {
      A11y.closeModal('kickModal');
    } else {
      var el = document.getElementById('kickModal');
      if (el) el.classList.add('hidden');
    }
  },

  kickPlayer(id) {
    if (!this.isHost || !this.currentRoom) return;
    this.socket.emit('kickPlayer', { code: this.currentRoom, playerId: id });
    this.closeKickMenu();
    this.showToast('تم طرد اللاعب', 'success');
  },

  // ═══════════════════════════════════════════════════════════════
  // 💬 Chat System
  // ═══════════════════════════════════════════════════════════════

  toggleChat() {
    const container = document.getElementById('chatContainer');
    if (container) container.classList.toggle('hidden');
  },

  sendChat() {
    const input = document.getElementById('chatInput');
    if (!input || !input.value.trim() || !this.currentRoom) return;
    this.socket.emit('chatMessage', { code: this.currentRoom, message: input.value.trim() });
    input.value = '';
  },

  addChatMessage(data) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const msg = document.createElement('div');
    msg.className = 'chat-msg';
    msg.innerHTML = '<span class="chat-msg__name" style="color:' + escapeHtml(data.color || '#00E676') + '">' +
      bdiName(data.name) + ':</span> ' + escapeHtml(data.message);
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    // Keep only last 50 messages
    while (container.children.length > 50) container.removeChild(container.firstChild);
  },

  // ═══════════════════════════════════════════════════════════════
  // 🌙 Dark Mode
  // ═══════════════════════════════════════════════════════════════

  toggleDarkMode(checked) {
    document.body.setAttribute('data-dark-mode', checked ? 'true' : 'false');
    localStorage.setItem('darkMode', checked);
  },

  // ═══════════════════════════════════════════════════════════════
  // 🏆 Achievement Display
  // ═══════════════════════════════════════════════════════════════

  showAchievement(data) {
    const container = document.getElementById('achievementContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'achievement-toast';
    el.innerHTML = '<span class="achievement-toast__icon">' + (data.icon || '🏆') + '</span>' +
      '<div class="achievement-toast__info">' +
        '<div class="achievement-toast__title">' + escapeHtml(data.title) + '</div>' +
        '<div class="achievement-toast__detail">' + escapeHtml(data.detail || '') + '</div>' +
      '</div>';
    container.appendChild(el);
    AudioEngine.achievement();
    setTimeout(() => {
      el.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => el.remove(), 300);
    }, 4000);
  },

  // ═══════════════════════════════════════════════════════════════
  // Helper methods for new games
  // ═══════════════════════════════════════════════════════════════

  showRoundInfo(round, max, title) {
    document.getElementById('gameRound').textContent = 'الجولة ' + round + ' من ' + max;
    document.getElementById('gameTitle').textContent = title;
    // Show brief round intro card for rounds 2+
    if (round > 1 && !this.reducedMotion) {
      ScreenMachine.showRoundIntro(round, max, title, null);
    }
  },

  setHint(text) {
    document.getElementById('gameHint').textContent = '💡 ' + text;
  },

  // setTheme is defined once at L659 with full fallback support

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
      ScreenMachine.showLockIn(document.getElementById('gameContent'));
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

  // ═══════════════════════════════════════════════════════
  // 👕 حرب التيشيرتات (T-Shirt Wars)
  // ═══════════════════════════════════════════════════════

  handleTshirtWarsSlogan(d) {
    this._submitting = false;
    this.showScreen('gameScreen');
    this.setTheme('tshirtwars');
    this.showRoundInfo(d.round, d.maxRounds, '👕 Tee K.O.');
    this.startTimer(d.timeLimit);
    this.setHint('اكتب شعارات للتيشيرت!');

    const count = d.sloganCount || 2;
    let inputs = '';
    for (let i = 0; i < count; i++) {
      inputs += '<input type="text" class="input input--game mb-3" id="sloganInput' + i + '" placeholder="شعار ' + (i + 1) + '..." maxlength="100" autocomplete="off">';
    }

    document.getElementById('gameContent').innerHTML =
      '<div style="max-width:600px">' +
        '<div class="tshirt-shape tshirt-shape--dark" style="margin:0 auto 20px;transform:scale(0.7);pointer-events:none">' +
          '<div class="tshirt-shape__design">👕</div>' +
          '<div class="tshirt-shape__slogan">الخطوة 1: الشعارات</div>' +
        '</div>' +
        (d.prompt ? '<p class="text-lg mb-2" style="color:rgba(255,255,255,0.6)">الموضوع:</p><p class="text-xl font-bold mb-4" style="color:#FFD93D">' + escapeHtml(d.prompt) + '</p>' : '') +
        '<p class="text-muted mb-4">اكتب ' + count + ' شعارات مضحكة للتيشيرت:</p>' +
        inputs +
        '<button class="btn btn--primary btn--full mt-3" data-action="submitTkoSlogans" style="background:linear-gradient(135deg,#e74c3c,#c0392b);border-color:#000">إرسال الشعارات 👕</button>' +
      '</div>';
    document.getElementById('sloganInput0')?.focus();
  },

  submitTkoSlogans() {
    const slogans = [];
    for (let i = 0; i < 2; i++) {
      const el = document.getElementById('sloganInput' + i);
      if (el && el.value.trim()) slogans.push(el.value.trim());
    }
    if (slogans.length === 0) return this.showToast('اكتب شعار واحد على الأقل!', 'error');
    this.socket.emit('tkoSubmitSlogans', { code: this.currentRoom, slogans });
    ScreenMachine.showLockIn(document.getElementById('gameContent'));
  },

  handleTshirtWarsDraw(d) {
    this.showRoundInfo(d.round, d.maxRounds, '👕 Tee K.O.');
    this.startTimer(d.timeLimit);
    this.setHint('ارسم تصميم التيشيرت!');

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
        '<div class="badge badge--warning mb-2">🎨 الخطوة 2: التصميم</div>' +
        '<p class="text-lg mb-4">ارسم تصميم تيشيرتك!</p>' +
        '<canvas class="drawing-canvas" id="drawCanvas" width="400" height="300"></canvas>' +
        '<div class="drawing-tools mt-3">' +
          colors +
          '<div style="width:2px;height:30px;background:rgba(255,255,255,0.3);margin:0 8px"></div>' +
          sizes +
          '<div style="width:2px;height:30px;background:rgba(255,255,255,0.3);margin:0 8px"></div>' +
          '<button class="btn--undo" data-action="undoStroke">↩️</button>' +
          '<button class="btn--undo" data-action="setEraser">🧹</button>' +
          '<button class="btn btn--ghost btn--sm" data-action="clearCanvas">🗑️</button>' +
        '</div>' +
        '<button class="btn btn--primary btn--full mt-4" data-action="submitDrawing">أرسل التصميم 🎨</button>' +
      '</div>';
    this.initCanvas();
  },

  handleTshirtWarsCombine(d) {
    this.startTimer(d.timeLimit);
    this.setHint('اختر شعار لتيشيرتك!');

    let sloganBtns = '';
    d.slogans.forEach(s => {
      sloganBtns += '<button class="btn btn--secondary btn--full mb-2" data-action="chooseTkoSlogan" data-slogan="' + escapeHtml(s.text) + '">' + escapeHtml(s.text) + '</button>';
    });

    document.getElementById('gameContent').innerHTML =
      '<div style="max-width:600px">' +
        '<div class="tshirt-shape tshirt-shape--white" style="margin:0 auto 20px">' +
          '<div class="tshirt-shape__design" id="drawingDisplay"></div>' +
          '<div class="tshirt-shape__slogan" style="color:#000">اختر شعار ⬇️</div>' +
        '</div>' +
        '<p class="text-lg mb-4" style="color:#fff">اختر شعار يناسب تصميمك:</p>' +
        sloganBtns +
      '</div>';
    this.renderDrawing(d.drawing, document.getElementById('drawingDisplay'));
  },

  chooseTkoSlogan(slogan, btn) {
    document.querySelectorAll('[data-action="chooseTkoSlogan"]').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
    btn.style.opacity = '1';
    btn.style.borderColor = '#006C35';
    this.socket.emit('tkoChooseSlogan', { code: this.currentRoom, slogan });
  },

  handleTshirtWarsVoting(d) {
    this._submitting = false;
    this.startTimer(d.timeLimit);
    this.setHint('صوّت لأفضل تيشيرت!');

    if (d.phase === 'tournament' && d.matchup) {
      const tkoColors = ['dark', 'white', 'red', 'blue'];
      let html = '<div class="text-center mb-4"><p class="text-muted">مباراة ' + d.matchNum + '/' + d.totalMatches + '</p></div>';
      html += '<div class="vs-arena">';
      d.matchup.forEach((shirt, idx) => {
        const color = tkoColors[idx % tkoColors.length];
        if (idx > 0) html += '<div class="lightning-vs">⚡</div>';
        html += '<div class="tshirt-shape tshirt-shape--' + color + '" data-action="voteAnswer" data-id="' + escapeHtml(shirt.id) + '" style="cursor:pointer">' +
          '<div class="tshirt-shape__design" id="tkoShirt' + escapeHtml(shirt.id) + '"></div>' +
          '<div class="tshirt-shape__slogan">' + escapeHtml(shirt.slogan) + '</div>' +
        '</div>';
      });
      html += '</div>';
      document.getElementById('gameContent').innerHTML = html;

      d.matchup.forEach(shirt => {
        const container = document.getElementById('tkoShirt' + shirt.id);
        if (container) this.renderDrawing(shirt.drawing, container);
      });
    } else {
      const gc = document.getElementById('gameContent');
      gc.innerHTML = '<div class="text-center"><p>التصويت جاري...</p></div>';
    }
  },

  handleTshirtWarsMatchResult(d) {
    clearInterval(this.gameTimer);
    let html = '<div class="text-center" style="max-width:600px">';
    html += '<div class="winner-stamp mb-4"><div class="winner-stamp__label">🏆 فائز!</div></div>';
    html += '<p class="text-2xl font-bold mb-4" style="color:#FFD93D">' + bdiName(d.winner.name) + '</p>';
    html += '<div class="tshirt-shape tshirt-shape--dark" style="margin:0 auto 16px;transform:scale(1.1)">';
    html += '<div class="tshirt-shape__design" id="winnerShirt"></div>';
    html += '<div class="tshirt-shape__slogan">' + escapeHtml(d.winner.slogan) + '</div>';
    html += '</div>';
    html += '<p class="text-muted">' + d.winner.votes + ' vs ' + d.loser.votes + ' أصوات</p>';
    html += '<p class="text-sm text-muted mt-4">المباراة التالية قريباً...</p>';
    html += '</div>';
    document.getElementById('gameContent').innerHTML = html;
    this.renderDrawing(d.winner.drawing, document.getElementById('winnerShirt'));
  },

  // ═══════════════════════════════════════════════════════════════
  // 😂 لا تضحك (Try Not To LOL)
  // ═══════════════════════════════════════════════════════════════

  handleTryNotToLolWrite(d) {
    this._submitting = false;
    this.showScreen('gameScreen');
    this.setTheme('trynottolol');
    this.showRoundInfo(d.round, d.maxRounds, '😂 لا تضحك');
    this.startTimer(d.timeLimit);
    this.setHint('اكتب أطرف إجابة تضحّك القاضي!');

    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:600px">' +
        '<div class="badge badge--warning mb-4">😂 ضحّك ' + escapeHtml(d.judgeName) + '!</div>' +
        '<p class="text-2xl font-bold mb-4">' + escapeHtml(d.prompt) + '</p>' +
        '<textarea class="input input--game input--textarea" id="answerInput" placeholder="اكتب أطرف جواب..." maxlength="200" rows="3"></textarea>' +
        '<button class="btn btn--primary btn--full mt-3" data-action="submitAnswer">إرسال 😂</button>' +
      '</div>';
    document.getElementById('answerInput')?.focus();
  },

  handleTryNotToLolJudge(d) {
    this._submitting = false;
    this.showScreen('gameScreen');
    this.setTheme('trynottolol');
    this.showRoundInfo(d.round, d.maxRounds, '😂 لا تضحك');
    this.startTimer(d.timeLimit);
    this.setHint('أنت القاضي! حاول لا تضحك!');

    document.getElementById('gameContent').innerHTML =
      '<div class="panel" style="max-width:600px;text-align:center">' +
        '<div class="badge badge--danger mb-4" style="font-size:20px">🧊 أنت القاضي!</div>' +
        '<p class="text-2xl font-bold mb-4">' + escapeHtml(d.prompt) + '</p>' +
        '<div style="font-size:64px;margin:24px 0;animation:pulse 1.5s infinite">😐</div>' +
        '<p class="text-muted">الباقين يكتبون إجابات مضحكة...</p>' +
        '<p class="text-muted">حاول لا تضحك لما تشوفها!</p>' +
      '</div>';
  },

  handleTryNotToLolVoting(d) {
    this._submitting = false;
    this.startTimer(d.timeLimit);
    this.setHint('صوّت لأطرف إجابة!');

    let html = '<div class="panel" style="max-width:700px;width:100%">' +
      '<div class="badge badge--warning mb-4">😂 ' + escapeHtml(d.prompt) + '</div>' +
      '<p class="text-muted mb-4">القاضي: ' + escapeHtml(d.judgeName) + '</p>' +
      '<div class="flex flex-col gap-3">';

    d.answers.forEach(a => {
      html += '<button class="vote-option" data-action="voteAnswer" data-id="' + escapeHtml(a.id) + '">' +
        '<div class="vote-option__text">' + escapeHtml(a.text) + '</div>' +
      '</button>';
    });

    html += '</div><p class="text-muted text-center mt-4" id="waitingCount"></p></div>';
    document.getElementById('gameContent').innerHTML = html;
  },

  // ═══════════════════════════════════════════════════════
  // 💡 اختراعات مجنونة (Inventions)
  // ═══════════════════════════════════════════════════════

  handleInventionsProblem(d) {
    this._submitting = false;
    this.showScreen('gameScreen');
    this.setTheme('inventions');
    this.showRoundInfo(d.round, d.maxRounds, '💡 اختراعات مجنونة');
    this.startTimer(d.timeLimit);
    this.setHint('اكتب اسم اختراعك!');

    const stepLabel = d.hasDrawing ? '<p class="text-sm mb-2" style="color:rgba(255,255,255,0.5)">الخطوة 1: اسم الاختراع (بعدها ترسمه)</p>' : '';

    const gc = document.getElementById('gameContent');
    gc.innerHTML =
      '<div class="blueprint mb-4">' +
        '<div class="blueprint__label">💡 المشكلة</div>' +
        '<p style="font-size:20px;font-weight:700;color:#fff;margin-bottom:8px">' + escapeHtml(d.problem) + '</p>' +
        '<span class="game-tag">' + escapeHtml(d.category) + '</span>' +
      '</div>' +
      stepLabel +
      '<div class="answer-section">' +
        '<textarea class="input input--game input--textarea" id="answerInput" placeholder="اكتب اسم اختراعك ووصفه..." maxlength="200" rows="3"></textarea>' +
        '<button class="btn btn--primary btn--lg btn--full mt-3" data-action="submitAnswer">إرسال 💡</button>' +
      '</div>';
    document.getElementById('answerInput')?.focus();
  },

  handleInventionsDraw(d) {
    this.startTimer(d.timeLimit);
    this.setHint('ارسم اختراعك!');

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
        '<div class="blueprint mb-3" style="padding:12px 16px"><div class="blueprint__label">🎨 الخطوة 2: ارسم اختراعك</div><p style="color:#fff;margin:0">' + escapeHtml(d.problem) + '</p></div>' +
        '<canvas class="drawing-canvas" id="drawCanvas" width="400" height="300"></canvas>' +
        '<div class="drawing-tools mt-3">' +
          colors +
          '<div style="width:2px;height:30px;background:rgba(255,255,255,0.3);margin:0 8px"></div>' +
          sizes +
          '<div style="width:2px;height:30px;background:rgba(255,255,255,0.3);margin:0 8px"></div>' +
          '<button class="btn--undo" data-action="undoStroke">↩️</button>' +
          '<button class="btn--undo" data-action="setEraser">🧹</button>' +
          '<button class="btn btn--ghost btn--sm" data-action="clearCanvas">🗑️</button>' +
        '</div>' +
        '<button class="btn btn--primary btn--full mt-4" data-action="submitDrawing">أرسل الرسمة 🎨</button>' +
      '</div>';
    this.initCanvas();
  },

  handleInventionsVoting(d) {
    this._submitting = false;
    this.startTimer(d.timeLimit);
    this.setHint('صوّت لأجنن اختراع!');

    const gc = document.getElementById('gameContent');
    let html =
      '<div class="blueprint mb-4" style="padding:12px 16px">' +
        '<div class="blueprint__label">💡 المشكلة</div>' +
        '<p style="color:#fff;margin:0;font-size:18px">' + escapeHtml(d.problem) + '</p>' +
      '</div>' +
      '<div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">';

    d.inventions.forEach(inv => {
      const hasDrawing = inv.drawing && inv.drawing !== '[]';
      html +=
        '<div class="blueprint" data-action="voteAnswer" data-id="' + inv.id + '" style="cursor:pointer;flex:1;min-width:200px;max-width:280px;transition:transform 0.2s,box-shadow 0.2s">' +
          (hasDrawing ? '<div id="invDraw' + escapeHtml(inv.id) + '" style="max-width:180px;margin:0 auto 8px"></div>' : '') +
          '<p style="color:#fff;font-weight:700;text-align:center;margin:0">' + escapeHtml(inv.text) + '</p>' +
        '</div>';
    });
    html += '</div>';
    gc.innerHTML = html;

    d.inventions.forEach(inv => {
      if (inv.drawing && inv.drawing !== '[]') {
        const container = document.getElementById('invDraw' + inv.id);
        if (container) this.renderDrawing(inv.drawing, container);
      }
    });
  },

  // ── نتائج الجولة ──

  handleRoundResults(d) {
    try { this._handleRoundResultsInner(d); } catch (e) {
      console.error('خطأ في عرض النتائج:', e);
      const gc = document.getElementById('gameContent');
      if (gc) gc.innerHTML = '<div class="text-center"><p class="text-xl">حصل خطأ في عرض النتائج</p></div>';
    }
  },

  _renderResultsList(results) {
    if (!results || !results.length) return '';
    let html = '<div class="flex flex-col gap-3 mb-4" style="max-width:450px;width:100%">';
    results.sort((a, b) => (b.points || 0) - (a.points || 0)).forEach((r, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
      html +=
        '<div class="result-row' + (i === 0 ? ' result-row--top' : '') + '">' +
          '<div>' +
            '<span class="font-bold">' + medal + ' ' + bdiName(r.playerName || r.name || '') + '</span>' +
            (r.text ? '<p class="text-sm text-muted mt-1">"' + escapeHtml(r.text) + '"</p>' : '') +
            (r.detail ? '<p class="text-sm text-muted mt-1">' + escapeHtml(r.detail) + '</p>' : '') +
          '</div>' +
          '<div class="text-left">' +
            '<div style="color:#D4AF37;font-weight:bold">+' + (r.points || 0) + '</div>' +
          '</div>' +
        '</div>';
    });
    return html + '</div>';
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
                    '<span class="gspy-results-row-name">' + bdiName(pr.playerName) + '</span>' +
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
                      '<stop offset="0%" style="stop-color:#8B4513"/>' +
                      '<stop offset="50%" style="stop-color:#C8A951"/>' +
                      '<stop offset="100%" style="stop-color:#006C35"/>' +
                    '</linearGradient>' +
                  '</defs>' +
                  '<path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="12" stroke-linecap="round"/>' +
                  '<path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#revealGaugeGrad)" stroke-width="12" stroke-linecap="round"/>' +
                  '<circle cx="100" cy="100" r="6" fill="#fff"/>' +
                  '<line x1="100" y1="100" x2="100" y2="35" stroke="#fff" stroke-width="3" stroke-linecap="round" id="revealNeedle" class="gspy-needle-line" style="transform-origin:100px 100px;transform:rotate(-90deg);transition:transform 1.5s ease-out"/>' +
                  (d.featuredGuess !== undefined ? '<line x1="100" y1="100" x2="100" y2="40" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" id="revealGuessMarker" style="transform-origin:100px 100px;opacity:0.5;transition:transform 0.5s ease-out"/>' : '') +
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
                  '<span class="gspy-results-row-name">' + bdiName(pr.playerName) + '</span>' +
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
          // Beat 2 (1600ms): Animate gauge needle to truth via CSS rotation
          const needle = document.getElementById('revealNeedle');
          if (needle) {
            // Needle points up (50%). Rotate: -90=0%, 0=50%, +90=100%
            const truthRotation = -90 + (d.correctAnswer / 100) * 180;
            needle.style.transform = 'rotate(' + truthRotation + 'deg)';
          }
          // Position guess marker
          if (d.featuredGuess !== undefined) {
            const marker = document.getElementById('revealGuessMarker');
            if (marker) {
              const guessRotation = -90 + (d.featuredGuess / 100) * 180;
              marker.style.transform = 'rotate(' + guessRotation + 'deg)';
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
            '<div class="faker-silhouette' + (d.caught ? ' faker-silhouette--revealed' : '') + ' mb-4">' +
              '<div class="faker-silhouette__emoji">' + (d.caught ? '🕵️' : '❓') + '</div>' +
            '</div>' +
            '<div class="faker-status ' + (d.caught ? 'faker-status--caught' : 'faker-status--safe') + ' mb-4">' +
              (d.caught ? '🎉 انكشف المزيّف!' : '🕵️ المزيّف نجا!') +
            '</div>' +
            '<p class="text-xl mt-2" style="color:#fff">المزيّف: <strong style="color:#FF4466">' + escapeHtml(d.fakerName) + '</strong></p>' +
          '</div>';
        break;

      case 'triviamurder':
        resultHtml = '<div class="death-zone mb-4" style="padding:20px"><div class="text-2xl" style="color:#00e676">✅ ' + escapeHtml(d.correctAnswer) + '</div></div>';
        if (d.newlyDead && d.newlyDead.length > 0) {
          resultHtml += '<div class="dolls-row mb-3">';
          d.newlyDead.forEach((p, i) => {
            const colors = ['crimson', 'purple', 'midnight'];
            resultHtml += '<div class="doll doll--' + colors[i % colors.length] + '" style="transform:scale(0.7)">' +
              '<div class="doll__body"><div class="doll__face">💀</div></div>' +
              '<div class="doll__name">' + bdiName(p.name) + '</div></div>';
          });
          resultHtml += '</div>';
        }
        if (d.revived && d.revived.length > 0) {
          resultHtml += '<p style="color:#006C35" class="mt-2">🎉 نجوا: ' + d.revived.map(p => bdiName(p.name)).join('، ') + '</p>';
        }
        break;

      case 'fibbage':
        resultHtml =
          '<div class="lie-card mb-4" style="padding:20px">' +
            '<p class="text-sm" style="color:rgba(255,255,255,0.5)">الإجابة الصحيحة:</p>' +
            '<div class="lie-card__question" style="color:#DAA520">' + escapeHtml(d.correctAnswer) + '</div>' +
          '</div>';
        if (d.playerResults) {
          resultHtml += '<div class="flex flex-col gap-2 mb-4" style="max-width:400px;width:100%">';
          d.playerResults.forEach(pr => {
            let info = '';
            if (pr.guessedCorrect) info += '✅ خمّن صح ';
            if (pr.fooledCount > 0) info += '🤥 خدع ' + pr.fooledCount;
            resultHtml +=
              '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(255,255,255,0.05);border-radius:10px;border-right:3px solid ' + (pr.guessedCorrect ? '#DAA520' : 'transparent') + '">' +
                '<span style="color:#fff">' + bdiName(pr.playerName) + ' ' + info + '</span>' +
                '<span style="color:#DAA520;font-weight:bold">+' + pr.points + '</span>' +
              '</div>';
          });
          resultHtml += '</div>';
        }
        break;

      case 'drawful':
        resultHtml =
          '<div class="speech-bubble mb-4" style="margin:0 auto">' +
            '<div class="speech-bubble__text" style="font-size:14px;color:rgba(0,0,0,0.5)">الكلمة كانت:</div>' +
            '<div class="speech-bubble__text" style="font-size:22px">' + escapeHtml(d.prompt) + '</div>' +
          '</div>';
        if (d.drawing) {
          resultHtml += '<div id="resultDrawing" style="max-width:300px;margin:0 auto;margin-bottom:16px;border-radius:16px;overflow:hidden"></div>';
        }
        if (d.playerResults) {
          resultHtml += '<div class="flex flex-col gap-2 mb-4" style="max-width:400px;width:100%">';
          d.playerResults.forEach(pr => {
            let info = pr.isDrawer ? '🎨 الرسام' : '';
            if (pr.guessedCorrect) info += '✅ ';
            if (pr.fooledCount > 0) info += '🤥×' + pr.fooledCount;
            resultHtml +=
              '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(255,255,255,0.05);border-radius:10px;border-right:3px solid ' + (pr.guessedCorrect ? '#00C853' : 'transparent') + '">' +
                '<span style="color:#fff">' + bdiName(pr.playerName) + ' ' + info + '</span>' +
                '<span style="color:#D4AF37;font-weight:bold">+' + pr.points + '</span>' +
              '</div>';
          });
          resultHtml += '</div>';
        }
        break;

      case 'tshirtwars':
        if (d.slogan) {
          resultHtml =
            '<div class="tshirt-shape tshirt-shape--dark mb-4" style="margin:0 auto;transform:scale(0.8)">' +
              '<div class="tshirt-shape__design">👕</div>' +
              '<div class="tshirt-shape__slogan">' + escapeHtml(d.slogan) + '</div>' +
            '</div>';
        }
        if (d.results) {
          const tkoColors = ['dark', 'red', 'blue', 'white'];
          resultHtml += '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:16px">';
          d.results.forEach((r, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
            const color = tkoColors[i % tkoColors.length];
            resultHtml +=
              '<div class="tshirt-shape tshirt-shape--' + color + '" style="transform:scale(' + (i === 0 ? '1' : '0.8') + ');' + (i === 0 ? 'box-shadow:0 0 20px rgba(212,175,55,0.5)' : '') + '">' +
                '<div class="tshirt-shape__design" style="font-size:24px">' + medal + '</div>' +
                '<div class="tshirt-shape__slogan">' + escapeHtml(r.text || r.playerName) + '</div>' +
                '<div class="tshirt-shape__owner" style="visibility:visible;opacity:1">' + bdiName(r.playerName) + '</div>' +
                '<div style="color:#D4AF37;font-weight:bold;font-size:14px;margin-top:4px">+' + r.points + '</div>' +
              '</div>';
          });
          resultHtml += '</div>';
        }
        break;

      case 'trynottolol': {
        resultHtml = '<div class="game-prompt mb-4"><div class="game-prompt__icon">😂</div><p class="game-prompt__text">' + escapeHtml(d.prompt || '') + '</p></div>';
        if (d.judgeHeldIt) {
          resultHtml += '<div class="badge badge--success mb-4" style="font-size:16px">🧊 ' + escapeHtml(d.judgeName) + ' ما ضحك! +' + d.judgePoints + '</div>';
        } else {
          resultHtml += '<div class="badge badge--danger mb-4" style="font-size:16px">🤣 ' + escapeHtml(d.judgeName) + ' ضحك!</div>';
        }
        if (d.results) {
          resultHtml += this._renderResultsList(d.results);
        }
        break;
      }

      case 'inventions':
        resultHtml =
          '<div class="blueprint mb-4" style="padding:12px 16px">' +
            '<div class="blueprint__label">💡 المشكلة</div>' +
            '<p style="color:#fff;margin:0">' + escapeHtml(d.problem) + '</p>' +
          '</div>';
        if (d.results) {
          resultHtml += '<div class="flex flex-col gap-3 mb-4" style="max-width:450px;width:100%">';
          d.results.forEach((r, i) => {
            const medal = i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
            resultHtml +=
              '<div class="blueprint" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;' + (i === 0 ? 'border-color:#D4AF37;box-shadow:0 0 15px rgba(212,175,55,0.3)' : '') + '">' +
                '<div>' +
                  '<span style="font-weight:bold;color:#fff">' + medal + ' ' + bdiName(r.playerName) + '</span>' +
                  '<p style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px">"' + escapeHtml(r.text) + '"</p>' +
                '</div>' +
                '<div style="text-align:left">' +
                  '<div style="color:#D4AF37;font-weight:bold">+' + r.points + '</div>' +
                  '<div style="font-size:12px;color:rgba(255,255,255,0.4)">' + r.percentage + '% (' + r.votes + ' صوت)</div>' +
                '</div>' +
              '</div>';
          });
          resultHtml += '</div>';
        }
        break;

      case 'wouldyourather': {
        // تبي ولا ما تبي — عرض الاختيارين مع أشرطة النسب
        const pctA = d.percentA || 0;
        const pctB = d.percentB || 0;
        resultHtml =
          '<div class="wyr-results-card">' +
            '<div class="wyr-vs-label">⚡ النتيجة ⚡</div>' +
            '<div class="wyr-bar-container">' +
              '<div class="wyr-bar wyr-bar--a" style="width:' + Math.max(pctA, 8) + '%">' +
                '<span class="wyr-bar__label">' + escapeHtml(d.optionA || '') + '</span>' +
                '<span class="wyr-bar__pct">' + pctA + '% (' + (d.countA || 0) + ')</span>' +
              '</div>' +
              '<div class="wyr-bar wyr-bar--b" style="width:' + Math.max(pctB, 8) + '%">' +
                '<span class="wyr-bar__label">' + escapeHtml(d.optionB || '') + '</span>' +
                '<span class="wyr-bar__pct">' + pctB + '% (' + (d.countB || 0) + ')</span>' +
              '</div>' +
            '</div>' +
            (d.isSplit ? '<div class="wyr-split-badge">🎯 انقسام متساوي! +1000 للجميع</div>' : '') +
          '</div>';
        if (d.playerResults) {
          resultHtml += this._renderResultsList(d.playerResults);
        }
        break;
      }

      case 'whosaidit': {
        // مين قال كذا — كشف المؤلفين
        resultHtml = '<div class="game-prompt mb-4"><div class="game-prompt__icon">🗣️</div><p class="game-prompt__text">' + escapeHtml(d.prompt || '') + '</p></div>';
        if (d.answers) {
          resultHtml += '<div class="wsi-reveal-grid mb-4">';
          d.answers.forEach(a => {
            resultHtml +=
              '<div class="wsi-reveal-card">' +
                '<div class="wsi-reveal-card__quote">"' + escapeHtml(a.text) + '"</div>' +
                '<div class="wsi-reveal-card__author">— ' + escapeHtml(a.authorName) + '</div>' +
              '</div>';
          });
          resultHtml += '</div>';
        }
        if (d.playerResults) {
          resultHtml += this._renderResultsList(d.playerResults);
        }
        break;
      }

      case 'speedround': {
        // أسرع واحد — عرض السؤال والإجابة الصحيحة مع ترتيب السرعة
        resultHtml =
          '<div class="speed-results">' +
            '<div class="speed-results__question">' + escapeHtml(d.question || '') + '</div>' +
            '<div class="speed-results__answer">✅ ' + escapeHtml(d.correctAnswer || '') + '</div>' +
          '</div>';
        if (d.playerResults) {
          resultHtml += '<div class="speed-results__ranking">';
          d.playerResults.sort((a, b) => (b.points || 0) - (a.points || 0)).forEach((r, i) => {
            const placeIcon = r.isCorrect ? (r.place === 1 ? '⚡' : r.place === 2 ? '🥈' : r.place === 3 ? '🥉' : '✅') : '❌';
            resultHtml +=
              '<div class="speed-results__row' + (r.isCorrect ? ' speed-results__row--correct' : ' speed-results__row--wrong') + '">' +
                '<span class="speed-results__place">' + placeIcon + '</span>' +
                '<span class="speed-results__name">' + bdiName(r.playerName) + '</span>' +
                (r.answer ? '<span class="speed-results__ans text-sm text-muted">' + escapeHtml(r.answer) + '</span>' : '') +
                '<span class="speed-results__pts">+' + (r.points || 0) + '</span>' +
              '</div>';
          });
          resultHtml += '</div>';
        }
        break;
      }

      case 'backseatgamer': {
        resultHtml =
          '<div class="speed-results">' +
            '<div class="speed-results__question">🎮 الكلمة: ' + escapeHtml(d.word || '') + '</div>' +
            (d.clue ? '<div class="speed-results__answer">💬 الوصف: "' + escapeHtml(d.clue) + '"</div>' : '') +
            (d.category ? '<div class="emoji-results__category">' + escapeHtml(d.category) + '</div>' : '') +
          '</div>';
        if (d.playerResults) {
          resultHtml += '<div class="speed-results__ranking">';
          d.playerResults.sort((a, b) => (b.points || 0) - (a.points || 0)).forEach((r, i) => {
            const icon = r.isDescriber ? '🎙️' : r.isCorrect ? (r.points >= 1000 ? '⚡' : '✅') : '❌';
            resultHtml +=
              '<div class="speed-results__row' + (r.isCorrect || r.isDescriber ? ' speed-results__row--correct' : ' speed-results__row--wrong') + '">' +
                '<span class="speed-results__place">' + icon + '</span>' +
                '<span class="speed-results__name">' + bdiName(r.playerName) + '</span>' +
                (r.answer ? '<span class="speed-results__ans text-sm text-muted">' + escapeHtml(r.answer) + '</span>' : '') +
                (r.clue ? '<span class="speed-results__ans text-sm text-muted">"' + escapeHtml(r.clue) + '"</span>' : '') +
                '<span class="speed-results__pts">+' + (r.points || 0) + '</span>' +
              '</div>';
          });
          resultHtml += '</div>';
        }
        break;
      }

      case 'splittheroom': {
        // سبليت ذا روم — عرض الإجابة مع شريط الانقسام
        const yPct = d.percentYes || 0;
        const nPct = d.percentNo || 0;
        resultHtml =
          '<div class="split-results">' +
            '<div class="split-results__scenario">' + escapeHtml(d.completedScenario || '') + '</div>' +
            '<div class="split-results__filler">' + escapeHtml(d.fillerName || '') + ' كتب: <strong>' + escapeHtml(d.filledText || '') + '</strong></div>' +
            '<div class="split-results__bar-container">' +
              '<div class="split-results__bar split-results__bar--yes" style="width:' + Math.max(yPct, 5) + '%">' +
                'نعم ' + yPct + '% (' + (d.yesCount || 0) + ')' +
              '</div>' +
              '<div class="split-results__bar split-results__bar--no" style="width:' + Math.max(nPct, 5) + '%">' +
                'لا ' + nPct + '% (' + (d.noCount || 0) + ')' +
              '</div>' +
            '</div>' +
            '<div class="split-results__diff">الفارق: ' + (d.splitDiff || 0) + '%</div>' +
          '</div>';
        if (d.playerResults) {
          resultHtml += this._renderResultsList(d.playerResults);
        }
        break;
      }

      case 'courtroom': {
        const verdictText = d.verdict === 'guilty' ? '🔨 مذنب!' : d.verdict === 'innocent' ? '✨ بريء!' : '⚖️ هيئة محلفين معلّقة!';
        const verdictColor = d.verdict === 'guilty' ? '#ff4444' : d.verdict === 'innocent' ? '#448AFF' : '#D4AF37';
        resultHtml =
          '<div class="debate-results">' +
            '<div class="debate-results__topic">📜 ' + escapeHtml(d.accusation || '') + '</div>' +
            '<div style="font-size:28px;font-weight:900;color:' + verdictColor + ';margin:16px 0">' + verdictText + '</div>' +
            '<div class="debate-results__sides">' +
              '<div class="debate-results__side' + (d.verdict === 'guilty' ? ' debate-results__side--winner' : '') + '">' +
                '<div class="debate-results__side-label">🔴 ' + escapeHtml(d.prosecutorName || '') + '</div>' +
                '<div style="font-size:13px;color:rgba(255,255,255,0.6);margin:8px 0">"' + escapeHtml(d.prosecutorArg || '') + '"</div>' +
                '<div class="debate-results__side-votes">+' + (d.prosecutorPts || 0) + '</div>' +
                (d.verdict === 'guilty' ? '<div class="debate-results__crown">🏆</div>' : '') +
              '</div>' +
              '<div class="debate-results__vs">⚔️</div>' +
              '<div class="debate-results__side' + (d.verdict === 'innocent' ? ' debate-results__side--winner' : '') + '">' +
                '<div class="debate-results__side-label">🔵 ' + escapeHtml(d.defenderName || '') + '</div>' +
                '<div style="font-size:13px;color:rgba(255,255,255,0.6);margin:8px 0">"' + escapeHtml(d.defenderArg || '') + '"</div>' +
                '<div class="debate-results__side-votes">+' + (d.defenderPts || 0) + '</div>' +
                (d.verdict === 'innocent' ? '<div class="debate-results__crown">🏆</div>' : '') +
              '</div>' +
            '</div>' +
            '<div style="margin-top:12px;color:rgba(255,255,255,0.5)">مذنب: ' + (d.guiltyVotes || 0) + ' | بريء: ' + (d.innocentVotes || 0) + '</div>' +
          '</div>';
        if (d.playerResults) {
          resultHtml += this._renderResultsList(d.playerResults);
        }
        break;
      }

      case 'debateme': {
        // المحكمة — عرض الفريقين مع تصويت القاضي
        const w = d.winningSide;
        resultHtml =
          '<div class="debate-results">' +
            '<div class="debate-results__topic">' + escapeHtml(d.topic || '') + '</div>' +
            '<div class="debate-results__sides">' +
              '<div class="debate-results__side' + (w === 1 ? ' debate-results__side--winner' : '') + '">' +
                '<div class="debate-results__side-label">' + escapeHtml(d.side1Label || 'فريق 1') + '</div>' +
                '<div class="debate-results__side-votes">' + (d.side1Votes || 0) + ' صوت</div>' +
                (w === 1 ? '<div class="debate-results__crown">🏆</div>' : '') +
              '</div>' +
              '<div class="debate-results__vs">⚔️</div>' +
              '<div class="debate-results__side' + (w === 2 ? ' debate-results__side--winner' : '') + '">' +
                '<div class="debate-results__side-label">' + escapeHtml(d.side2Label || 'فريق 2') + '</div>' +
                '<div class="debate-results__side-votes">' + (d.side2Votes || 0) + ' صوت</div>' +
                (w === 2 ? '<div class="debate-results__crown">🏆</div>' : '') +
              '</div>' +
            '</div>' +
            (d.bestArgPlayerName ? '<div class="debate-results__best">🌟 أقوى حجة: ' + escapeHtml(d.bestArgPlayerName) + ' (' + (d.bestArgVotes || 0) + ' صوت)</div>' : '') +
            (w === 0 ? '<div class="debate-results__tie">⚖️ تعادل!</div>' : '') +
          '</div>';
        if (d.playerResults) {
          resultHtml += this._renderResultsList(d.playerResults);
        }
        break;
      }

      case 'punishmentwheel': {
        resultHtml =
          '<div class="speed-results">' +
            '<div class="speed-results__question">' + escapeHtml(d.question || '') + '</div>' +
            '<div class="speed-results__answer">✅ ' + escapeHtml(d.correctAnswer || '') + '</div>' +
          '</div>';
        if (d.playerResults) {
          resultHtml += '<div class="speed-results__ranking">';
          d.playerResults.sort((a, b) => (b.points || 0) - (a.points || 0)).forEach((r, i) => {
            const icon = r.isCorrect ? (r.points >= 1000 ? '⚡' : r.points >= 700 ? '🥈' : '✅') : '❌';
            resultHtml +=
              '<div class="speed-results__row' + (r.isCorrect ? ' speed-results__row--correct' : ' speed-results__row--wrong') + '">' +
                '<span class="speed-results__place">' + icon + '</span>' +
                '<span class="speed-results__name">' + bdiName(r.playerName) + '</span>' +
                (r.answer ? '<span class="speed-results__ans text-sm text-muted">' + escapeHtml(r.answer) + '</span>' : '') +
                '<span class="speed-results__pts">+' + (r.points || 0) + '</span>' +
              '</div>';
          });
          resultHtml += '</div>';
        }
        // Punishment wheel animation for last round
        if (d.punishment && d.lowestPlayer) {
          resultHtml +=
            '<div style="margin-top:24px;padding:24px;background:rgba(255,68,68,0.2);border-radius:16px;text-align:center">' +
              '<div style="font-size:48px;margin-bottom:12px;animation:spin 2s ease-out">🎡</div>' +
              '<p style="color:#ff4444;font-size:20px;font-weight:900;margin-bottom:8px">عقاب ' + bdiName(d.lowestPlayer.name) + '!</p>' +
              '<p style="color:#FFD700;font-size:24px;font-weight:bold">' + escapeHtml(d.punishment) + '</p>' +
            '</div>';
          AudioEngine.buzzer && AudioEngine.buzzer();
        }
        break;
      }

      default:
        if (d.message) {
          resultHtml = '<p class="text-xl mb-4">' + escapeHtml(d.message) + '</p>';
        }
    }

    // لوحة النقاط
    const players = d.players ? d.players.sort((a, b) => b.score - a.score) : [];
    const scores = players.map((p, i) =>
      '<div class="scoreboard__row score-snap" style="animation-delay:' + (i * 0.1) + 's">' +
        '<div class="flex items-center gap-3">' +
          '<span class="text-2xl">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)) + '</span>' +
          '<span class="text-xl font-bold">' + bdiName(p.name) + '</span>' +
        '</div>' +
        '<span class="text-xl font-bold" style="color:#D4AF37">' + p.score + '</span>' +
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
      '<div class="text-center reveal-stage" style="max-width:500px;width:100%">' +
        resultHtml +
        '<div class="scoreboard mt-6">' + scores + '</div>' +
        quipHtml +
        nextBtn +
      '</div>';

    // Trigger reveal animation
    requestAnimationFrame(() => {
      const stage = document.querySelector('#gameContent .reveal-stage');
      if (stage) stage.classList.add('reveal-stage--visible');
    });

    // عرض رسمة Drawful في النتائج
    if (d.game === 'drawful' && d.drawing) {
      const drawContainer = document.getElementById('resultDrawing');
      if (drawContainer) this.renderDrawing(d.drawing, drawContainer);
    }

    // تأثيرات بصرية لنتائج الجولة
    this.confetti();
    if (typeof window.FX !== 'undefined') {
      window.FX.sparkles({ count: 25, radius: 150 });
    }
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
    this.celebration();

    const w = d.finalResults[0];
    const winnerEl = document.getElementById('winnerDisplay');
    if (winnerEl) {
      winnerEl.classList.add('winner-spotlight');
      const winnerAvatar = (w.avatarData && typeof AvatarSystem !== 'undefined')
        ? '<div class="winner-showcase__avatar">' + this._gAvatar(w.avatarData, 80, w.avatar) + '</div>'
        : '';
      const trophyHTML = (typeof GameIllustrations !== 'undefined')
        ? '<div class="trophy-svg">' + GameIllustrations.trophySVG + '</div>'
        : '<div class="winner-showcase__trophy">🏆</div>';
      winnerEl.innerHTML =
        trophyHTML +
        winnerAvatar +
        '<h1 class="winner-showcase__name">' + bdiName(w.name) + '</h1>' +
        '<div class="winner-showcase__subtitle">البطل</div>' +
        '<div class="winner-showcase__score">' + w.score + ' نقطة</div>';

      // Score popup for winner
      if (typeof window.FX !== 'undefined') {
        setTimeout(() => window.FX.scorePopup({ text: w.score + ' نقطة', color: '#D4AF37', fontSize: 56 }), 500);
        setTimeout(() => window.FX.emojiBurst({ emoji: '🏆', count: 8 }), 1000);
      }
    }

    const scores = d.finalResults.map((p, i) => {
      const scoreAvatar = this._gAvatar(p.avatarData, 40, p.avatar);
      return '<div class="scoreboard__row score-snap" style="animation-delay:' + (0.5 + i * 0.15) + 's">' +
        '<div class="flex items-center gap-3">' +
          '<span class="text-2xl">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)) + '</span>' +
          '<span class="avatar" style="background:' + escapeHtml(p.color) + ';width:40px;height:40px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center">' + scoreAvatar + '</span>' +
          '<span class="text-xl font-bold">' + bdiName(p.name) + '</span>' +
        '</div>' +
        '<span class="text-xl font-bold" style="color:#D4AF37">' + p.score + '</span>' +
      '</div>';
    }).join('');

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
              '<div class="award-card__name">' + bdiName(a.name) + '</div>' +
              '<div class="award-card__detail">' + escapeHtml(a.detail) + '</div>' +
            '</div>' +
          '</div>'
        ).join('');
      awardsEl.classList.remove('hidden');
    }

    // 🎭 Smosh-style conditions (punishments & rewards)
    const condEl = document.getElementById('gameConditions');
    if (condEl && d.conditions) {
      const c = d.conditions;
      condEl.innerHTML =
        '<div class="conditions-card">' +
          '<h3 class="conditions-card__title">🎭 العقوبات والمكافآت</h3>' +
          '<div class="conditions-card__row conditions-card__row--punishment">' +
            '<span class="conditions-card__icon">' + c.punishment.icon + '</span>' +
            '<div>' +
              '<div class="conditions-card__player">' + escapeHtml(c.punishment.player) + ' (الخسران)</div>' +
              '<div class="conditions-card__text">' + escapeHtml(c.punishment.text) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="conditions-card__row conditions-card__row--reward">' +
            '<span class="conditions-card__icon">' + c.reward.icon + '</span>' +
            '<div>' +
              '<div class="conditions-card__player">' + escapeHtml(c.reward.player) + ' (البطل)</div>' +
              '<div class="conditions-card__text">' + escapeHtml(c.reward.text) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      condEl.classList.remove('hidden');
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
    t.style.cssText = 'background:' + (type === 'success' ? 'linear-gradient(135deg,#006C35,#00843D)' : 'linear-gradient(135deg,#8B2252,#5C0A30)') +
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
    ScreenMachine.showLockIn(document.getElementById('gameContent'));
  },

  // The Round-Up: rapid-fire higher/lower
  handleGuesspionageFinalQuestion(d) {
    this._submitting = false;
    document.getElementById('gameRound').textContent = '🏆 The Round-Up (' + d.questionNum + '/' + d.totalQuestions + ')';
    this.startTimer(d.timeLimit);

    document.getElementById('gameContent').innerHTML =
      '<div class="text-center" style="max-width:600px">' +
        '<div class="info-box mb-4"><div class="info-box__label">سؤال</div><div class="info-box__value">' + d.questionNum + ' / ' + d.totalQuestions + '</div></div>' +
        '<p class="text-xl font-bold mb-4" style="color:#fff">' + escapeHtml(d.question) + '</p>' +
        '<div class="donut-chart mb-4" style="--pct:' + d.shownPercent + ';margin:0 auto">' +
          '<div class="donut-chart__inner">' +
            '<div class="donut-chart__value">' + d.shownPercent + '%</div>' +
          '</div>' +
        '</div>' +
        '<p class="text-muted mb-4">الجواب الحقيقي أعلى أو أقل؟</p>' +
        '<div style="display:flex;gap:16px;justify-content:center">' +
          '<button class="hl-btn hl-btn--higher" data-action="submitFinalHL" data-hl="higher">⬆️ أعلى</button>' +
          '<button class="hl-btn hl-btn--lower" data-action="submitFinalHL" data-hl="lower">⬇️ أقل</button>' +
        '</div>' +
      '</div>';
  },

  submitFinalHL(choice, btn) {
    if (this._submitting) return;
    this._submitting = true;
    document.querySelectorAll('[data-action="submitFinalHL"]').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
    btn.style.opacity = '1';
    btn.style.borderColor = '#D4AF37';
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: choice });
  },

  handleGuesspionageFinalAnswer(d) {
    clearInterval(this.gameTimer);
    const isHigher = d.realPercent > d.shownPercent;

    document.getElementById('gameContent').innerHTML =
      '<div class="text-center" style="max-width:600px">' +
        '<p class="text-lg mb-4" style="color:rgba(255,255,255,0.7)">' + escapeHtml(d.question) + '</p>' +
        '<div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:16px">' +
          '<div class="donut-chart" style="--pct:' + d.shownPercent + ';width:80px;height:80px;opacity:0.4">' +
            '<div class="donut-chart__inner" style="width:50px;height:50px"><div class="donut-chart__value" style="font-size:16px;text-decoration:line-through">' + d.shownPercent + '%</div></div>' +
          '</div>' +
          '<div style="font-size:32px">' + (isHigher ? '⬆️' : '⬇️') + '</div>' +
          '<div class="donut-chart" style="--pct:' + d.realPercent + ';width:100px;height:100px;margin:0 auto">' +
            '<div class="donut-chart__inner" style="width:64px;height:64px"><div class="donut-chart__value" style="color:#DAA520">' + d.realPercent + '%</div></div>' +
          '</div>' +
        '</div>' +
        '<p class="text-xl font-bold" style="color:' + (d.correctAnswer === 'higher' ? '#00C853' : '#FF5252') + '">' +
          (d.correctAnswer === 'higher' ? 'أعلى!' : 'أقل!') +
        '</p>' +
        '<p class="text-sm text-muted mt-4">السؤال التالي قريباً...</p>' +
      '</div>';
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
    if (!modal) return;
    const isHidden = modal.classList.contains('hidden');
    if (isHidden) {
      if (typeof A11y !== 'undefined') {
        A11y.openModal('settingsModal');
      } else {
        modal.classList.remove('hidden');
      }
    } else {
      if (typeof A11y !== 'undefined') {
        A11y.closeModal('settingsModal');
      } else {
        modal.classList.add('hidden');
      }
    }
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
    if (typeof window.FX !== 'undefined') {
      window.FX.confetti();
    }
  },

  celebration() {
    if (this.reducedMotion) return;
    if (typeof window.FX !== 'undefined') {
      window.FX.celebration({ duration: 3000 });
      window.FX.fireworks({ count: 4 });
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // مؤشر حالة الاتصال
  // ═══════════════════════════════════════════════════════════════

  // ── Offline detection ──
  _setupOfflineDetection() {
    window.addEventListener('online', () => {
      this._isOffline = false;
      if (this._connectionState !== 'connected') {
        this._updateConnectionState('reconnecting');
      }
    });
    window.addEventListener('offline', () => {
      this._isOffline = true;
      this._updateConnectionState('offline');
    });
  },

  _updateConnectionState(state) {
    const prev = this._connectionState;
    this._connectionState = state;

    // ── Small indicator badge (always present) ──
    let indicator = document.getElementById('connectionIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'connectionIndicator';
      indicator.className = 'conn-badge';
      document.body.appendChild(indicator);
    }

    // ── Full-screen reconnect overlay ──
    let overlay = document.getElementById('reconnectOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'reconnectOverlay';
      overlay.className = 'reconnect-overlay';
      overlay.innerHTML =
        '<div class="reconnect-overlay__card">' +
          '<div class="reconnect-overlay__icon" id="reconnectIcon">📡</div>' +
          '<div class="reconnect-overlay__title" id="reconnectTitle">جاري إعادة الاتصال...</div>' +
          '<div class="reconnect-overlay__sub" id="reconnectSub">لا تقفل الصفحة</div>' +
          '<div class="reconnect-overlay__bar"><div class="reconnect-overlay__bar-fill"></div></div>' +
          '<div class="reconnect-overlay__timer" id="reconnectTimer"></div>' +
        '</div>';
      document.body.appendChild(overlay);
    }

    switch (state) {
      case 'connected':
        indicator.className = 'conn-badge conn-badge--connected';
        indicator.textContent = '● متصل';
        overlay.classList.remove('reconnect-overlay--visible');
        if (this._reconnectStart) {
          this._reconnectStart = null;
          if (this._reconnectInterval) {
            clearInterval(this._reconnectInterval);
            this._reconnectInterval = null;
          }
        }
        // Auto-fade the badge after 3s
        setTimeout(() => {
          if (this._connectionState === 'connected') {
            indicator.classList.add('conn-badge--fading');
          }
        }, 3000);
        break;

      case 'disconnected':
        indicator.className = 'conn-badge conn-badge--disconnected';
        indicator.textContent = '● منقطع';
        this._showReconnectOverlay('📡', 'انقطع الاتصال', 'جاري المحاولة...');
        this.showToast('انقطع الاتصال!', 'error');
        break;

      case 'reconnecting':
        indicator.className = 'conn-badge conn-badge--reconnecting';
        indicator.textContent = '● جاري إعادة الاتصال...';
        this._showReconnectOverlay('🔄', 'جاري إعادة الاتصال...', 'لا تقفل الصفحة');
        break;

      case 'offline':
        indicator.className = 'conn-badge conn-badge--offline';
        indicator.textContent = '● بدون إنترنت';
        this._showReconnectOverlay('📵', 'ما فيه إنترنت!', 'وصّل الإنترنت وبنرجع تلقائي');
        break;
    }
  },

  _showReconnectOverlay(icon, title, sub) {
    const overlay = document.getElementById('reconnectOverlay');
    if (!overlay) return;
    document.getElementById('reconnectIcon').textContent = icon;
    document.getElementById('reconnectTitle').textContent = title;
    document.getElementById('reconnectSub').textContent = sub;
    overlay.classList.add('reconnect-overlay--visible');

    // Start timer
    if (!this._reconnectStart) {
      this._reconnectStart = Date.now();
      const timerEl = document.getElementById('reconnectTimer');
      if (this._reconnectInterval) clearInterval(this._reconnectInterval);
      this._reconnectInterval = setInterval(() => {
        if (!this._reconnectStart) return;
        const elapsed = Math.floor((Date.now() - this._reconnectStart) / 1000);
        if (timerEl) timerEl.textContent = elapsed + ' ثانية';
      }, 1000);
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
