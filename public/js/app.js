/**
 * ABU ABED BOX - CLIENT APPLICATION
 */

const App = {
  socket: null,
  currentRoom: null,
  isHost: false,
  gameTimer: null,
  currentGame: null,

  init() {
    this.socket = io();
    this.setupSocketEvents();
    setTimeout(() => this.showScreen('menuScreen'), 2000);
    
    document.getElementById('hostNameInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.createRoom();
    });
    document.getElementById('playerNameInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinRoom();
    });
  },

  setupSocketEvents() {
    const s = this.socket;

    s.on('roomCreated', (data) => {
      this.currentRoom = data.code;
      this.isHost = true;
      document.getElementById('displayRoomCode').textContent = data.code;
      this.updatePlayers(data.players);
      this.showScreen('lobbyScreen');
      this.updateHostUI();
      this.showToast('تم إنشاء الغرفة!', 'success');
    });

    s.on('roomJoined', (data) => {
      this.currentRoom = data.code;
      document.getElementById('displayRoomCode').textContent = data.code;
      this.updatePlayers(data.players);
      this.showScreen('lobbyScreen');
      this.updateHostUI();
      this.showToast('انضممت للغرفة!', 'success');
    });

    s.on('playerJoined', (data) => this.updatePlayers(data.players));
    s.on('playerLeft', (data) => {
      this.updatePlayers(data.players);
      const me = data.players.find(p => p.id === this.socket.id);
      if (me?.isHost) { this.isHost = true; this.updateHostUI(); }
    });
    s.on('playerUpdated', (data) => this.updatePlayers(data.players));
    s.on('error', (data) => this.showToast(data.message, 'error'));

    s.on('gameStarted', (data) => {
      this.currentGame = data.game;
      this.setTheme(data.game);
      this.showScreen('gameScreen');
      this.updateGameHeader(data.game);
    });

    s.on('playerAnswered', (data) => this.updateWaitingCount(data.count, data.total));

    s.on('quiplashQuestion', (data) => this.handleQuiplashQuestion(data));
    s.on('guesspionageQuestion', (data) => this.handleGuesspionageQuestion(data));
    s.on('fakinItTask', (data) => this.handleFakinItTask(data));
    s.on('fakinItVoting', (data) => this.handleFakinItVoting(data));
    s.on('triviaMurderQuestion', (data) => this.handleTriviaMurderQuestion(data));
    s.on('fibbageQuestion', (data) => this.handleFibbageQuestion(data));
    s.on('fibbageVoting', (data) => this.handleFibbageVoting(data));
    s.on('votingPhase', (data) => this.handleVotingPhase(data));
    s.on('roundResults', (data) => this.handleRoundResults(data));
    s.on('gameEnded', (data) => this.handleGameEnded(data));
    s.on('returnedToLobby', (data) => {
      this.setTheme('hub');
      this.updatePlayers(data.players);
      this.showScreen('lobbyScreen');
    });
  },

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('is-active'));
    document.getElementById(screenId)?.classList.add('is-active');
  },

  setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const bgPattern = document.querySelector('.bg__pattern');
    if (bgPattern) {
      bgPattern.className = 'bg__pattern';
      const patterns = {
        quiplash: 'pattern-stripes', guesspionage: 'pattern-dots',
        fakinit: 'pattern-zigzag', triviamurder: 'pattern-noise',
        fibbage: 'pattern-halftone', drawful: 'pattern-waves'
      };
      bgPattern.classList.add(patterns[theme] || 'pattern-rays');
    }
  },

  createRoom() {
    const name = document.getElementById('hostNameInput').value.trim();
    if (!name) return this.showToast('أدخل اسمك!', 'error');
    this.socket.emit('createRoom', name);
  },

  joinRoom() {
    const code = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    const name = document.getElementById('playerNameInput').value.trim();
    if (!code || code.length !== 4) return this.showToast('كود خاطئ!', 'error');
    if (!name) return this.showToast('أدخل اسمك!', 'error');
    this.socket.emit('joinRoom', { code, playerName: name });
  },

  toggleReady() { this.socket.emit('playerReady', this.currentRoom); },

  selectGame(game) {
    if (!this.isHost) return this.showToast('المضيف فقط يختار!', 'error');
    this.socket.emit('startGame', { code: this.currentRoom, game });
  },

  backToLobby() { this.socket.emit('backToLobby', this.currentRoom); },

  updatePlayers(players) {
    const grid = document.getElementById('playersGrid');
    if (!grid) return;
    grid.innerHTML = players.map(p => '<div class="player-card"><div class="avatar ' + (p.isHost ? 'avatar--host' : '') + '" style="background: ' + p.color + '">' + p.avatar + '</div><span class="player-card__name">' + p.name + '</span><span class="player-card__score">' + p.score + ' نقطة</span>' + (p.isReady ? '<span class="badge badge--success">جاهز</span>' : '') + '</div>').join('');
  },

  updateHostUI() {
    const gs = document.getElementById('gamesSection');
    if (gs) gs.style.display = this.isHost ? 'block' : 'none';
  },

  updateGameHeader(game) {
    const games = {
      quiplash: { i: '⚡', t: 'رد سريع', h: 'اكتب أطرف إجابة!' },
      guesspionage: { i: '📊', t: 'خمّن النسبة', h: 'خمّن النسبة الصحيحة!' },
      fakinit: { i: '🕵️', t: 'المزيّف', h: 'اكتشف المزيّف!' },
      triviamurder: { i: '💀', t: 'حفلة القاتل', h: 'أجب صح أو مت!' },
      fibbage: { i: '🎭', t: 'كشف الكذاب', h: 'اكتب كذبة مقنعة!' },
      drawful: { i: '🎨', t: 'ارسم لي', h: 'ارسم الكلمة السرية!' }
    };
    const info = games[game] || games.quiplash;
    document.getElementById('gameTitle').textContent = info.i + ' ' + info.t;
    document.getElementById('gameHint').textContent = '💡 ' + info.h;
  },

  startTimer(seconds) {
    let time = seconds;
    const el = document.getElementById('gameTimer');
    el.textContent = time;
    el.className = 'timer';
    if (this.gameTimer) clearInterval(this.gameTimer);
    this.gameTimer = setInterval(() => {
      time--;
      el.textContent = time;
      if (time <= 10) el.classList.add('timer--warning');
      if (time <= 5) { el.classList.remove('timer--warning'); el.classList.add('timer--danger'); }
      if (time <= 0) clearInterval(this.gameTimer);
    }, 1000);
  },

  showWaiting(message) {
    document.getElementById('gameContent').innerHTML = '<div class="text-center"><div class="spinner mb-4"></div><p class="text-2xl font-bold">' + message + '</p><p class="text-muted mt-2" id="waitingCount">ننتظر...</p></div>';
  },

  updateWaitingCount(count, total) {
    const el = document.getElementById('waitingCount');
    if (el) el.textContent = count + ' من ' + total + ' أجابوا';
  },

  handleQuiplashQuestion(data) {
    document.getElementById('gameRound').textContent = 'الجولة ' + data.round + ' من ' + data.maxRounds;
    this.startTimer(data.timeLimit);
    document.getElementById('gameContent').innerHTML = '<div class="panel" style="max-width: 600px; width: 100%;"><div class="badge badge--primary mb-4">السؤال ' + data.round + '</div><p class="text-2xl font-bold mb-6">' + data.question + '</p><input type="text" class="input mb-4" id="answerInput" placeholder="إجابتك الإبداعية..." maxlength="100"><button class="btn btn--primary btn--full" onclick="App.submitAnswer()">إرسال ⚡</button></div>';
    document.getElementById('answerInput')?.focus();
  },

  handleGuesspionageQuestion(data) {
    document.getElementById('gameRound').textContent = 'الجولة ' + data.round + ' من ' + data.maxRounds;
    this.startTimer(data.timeLimit);
    document.getElementById('gameContent').innerHTML = '<div class="panel" style="max-width: 600px; width: 100%;"><div class="badge badge--info mb-4">📊 خمّن</div><p class="text-2xl font-bold mb-6">' + data.question + '</p><div class="text-center"><div class="text-5xl font-black text-accent mb-4" id="percentDisplay">50%</div><input type="range" class="slider" id="percentSlider" min="0" max="100" value="50" oninput="document.getElementById(\'percentDisplay\').textContent = this.value + \'%\'"><button class="btn btn--primary btn--full mt-6" onclick="App.submitGuess()">تأكيد 📊</button></div></div>';
  },

  submitGuess() {
    const guess = document.getElementById('percentSlider').value;
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: guess });
    this.showWaiting('ننتظر باقي التخمينات...');
  },

  handleFakinItTask(data) {
    document.getElementById('gameRound').textContent = 'الجولة ' + data.round + ' من ' + data.maxRounds;
    this.startTimer(data.timeLimit);
    var content = data.isFaker ? '<div class="panel" style="max-width: 600px; background: linear-gradient(135deg, #8B0000, #4a0000);"><div class="badge badge--error mb-4">🕵️ أنت المزيّف!</div><p class="text-2xl font-bold mb-4">ما تعرف المهمة!</p><p class="text-muted">حاول تتصرف طبيعي!</p><button class="btn btn--secondary btn--full mt-6" onclick="App.submitFakinAction()">جاهز! 🎭</button></div>' : '<div class="panel" style="max-width: 600px;"><div class="badge badge--warning mb-4">' + data.category + '</div><p class="text-2xl font-bold mb-6">' + data.task + '</p><button class="btn btn--primary btn--full" onclick="App.submitFakinAction()">جاهز! ✅</button></div>';
    document.getElementById('gameContent').innerHTML = content;
  },

  submitFakinAction() {
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: 'done' });
    this.showWaiting('ننتظر الجميع...');
  },

  handleFakinItVoting(data) {
    this.startTimer(data.timeLimit);
    var playersHtml = data.players.map(function(p) { return '<div class="player-vote-card" onclick="App.votePlayer(\'' + p.id + '\', this)"><div class="avatar" style="background: ' + p.color + '">' + p.avatar + '</div><span class="player-card__name">' + p.name + '</span></div>'; }).join('');
    document.getElementById('gameContent').innerHTML = '<div class="text-center" style="max-width: 800px;"><p class="text-xl mb-2">المهمة كانت:</p><p class="text-2xl font-bold text-accent mb-6">"' + data.task + '"</p><h3 class="text-2xl font-bold mb-4">🕵️ من هو المزيّف؟</h3><div class="players-grid">' + playersHtml + '</div></div>';
  },

  votePlayer(playerId, element) {
    document.querySelectorAll('.player-vote-card').forEach(function(c) { c.classList.remove('selected'); });
    element.classList.add('selected');
    this.socket.emit('submitVote', { code: this.currentRoom, voteId: playerId });
  },

  handleTriviaMurderQuestion(data) {
    document.getElementById('gameRound').textContent = 'الجولة ' + data.round + ' من ' + data.maxRounds;
    this.startTimer(data.timeLimit);
    var optionsHtml = data.options.map(function(opt, i) { return '<button class="btn btn--secondary btn--full option-btn" onclick="App.submitTriviaAnswer(' + i + ', this)">' + opt + '</button>'; }).join('');
    document.getElementById('gameContent').innerHTML = '<div class="panel" style="max-width: 600px;"><div class="badge badge--error mb-4">💀 أجب أو مت!</div><p class="text-2xl font-bold mb-6">' + data.question + '</p><div class="flex flex-col gap-3">' + optionsHtml + '</div></div>';
  },

  submitTriviaAnswer(index, btn) {
    document.querySelectorAll('.option-btn').forEach(function(b) { b.disabled = true; b.style.opacity = '0.5'; });
    btn.style.opacity = '1';
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: index });
  },

  handleFibbageQuestion(data) {
    document.getElementById('gameRound').textContent = 'الجولة ' + data.round + ' من ' + data.maxRounds;
    this.startTimer(data.timeLimit);
    document.getElementById('gameContent').innerHTML = '<div class="panel" style="max-width: 600px;"><div class="badge badge--warning mb-4">🎭 اكتب كذبة</div><p class="text-2xl font-bold mb-6">' + data.question + '</p><input type="text" class="input mb-4" id="lieInput" placeholder="كذبتك المقنعة..." maxlength="50"><button class="btn btn--primary btn--full" onclick="App.submitLie()">إرسال 🎭</button></div>';
    document.getElementById('lieInput')?.focus();
  },

  submitLie() {
    var lie = document.getElementById('lieInput').value.trim();
    if (!lie) return this.showToast('اكتب كذبة!', 'error');
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: lie });
    this.showWaiting('ننتظر باقي الكذابين...');
  },

  handleFibbageVoting(data) {
    this.startTimer(data.timeLimit);
    var optionsHtml = data.options.map(function(opt) { return '<button class="btn btn--secondary btn--full option-btn" onclick="App.guessFibbage(\'' + opt.id + '\', this)">' + opt.text + '</button>'; }).join('');
    document.getElementById('gameContent').innerHTML = '<div class="panel" style="max-width: 600px;"><p class="text-xl mb-2">اختر الإجابة الصحيحة:</p><p class="text-2xl font-bold text-accent mb-6">' + data.question + '</p><div class="flex flex-col gap-3">' + optionsHtml + '</div></div>';
  },

  guessFibbage(id, btn) {
    document.querySelectorAll('.option-btn').forEach(function(b) { b.disabled = true; b.style.opacity = '0.5'; });
    btn.style.opacity = '1';
    this.socket.emit('submitVote', { code: this.currentRoom, voteId: id });
  },

  handleVotingPhase(data) {
    this.startTimer(data.timeLimit);
    var answersHtml = data.answers.map(function(a, i) { return '<div class="vote-card card card--clickable" onclick="App.voteAnswer(\'' + a.playerId + '\', this)"><div class="card__body text-center"><p class="text-xl font-bold">"' + a.answer + '"</p></div></div>' + (i === 0 ? '<div class="vs-badge">VS</div>' : ''); }).join('');
    document.getElementById('gameContent').innerHTML = '<div style="max-width: 800px; width: 100%;"><p class="text-xl text-center mb-2">' + data.question + '</p><h3 class="text-2xl font-bold text-center text-accent mb-6">🗳️ صوّت للأفضل!</h3><div class="voting-cards flex gap-4 justify-center items-center">' + answersHtml + '</div></div>';
  },

  voteAnswer(playerId, element) {
    document.querySelectorAll('.vote-card').forEach(function(c) { c.classList.remove('selected'); });
    element.classList.add('selected');
    this.socket.emit('submitVote', { code: this.currentRoom, voteId: playerId });
  },

  submitAnswer() {
    var answer = document.getElementById('answerInput').value.trim();
    if (!answer) return this.showToast('اكتب إجابة!', 'error');
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: answer });
    this.showWaiting('ننتظر باقي اللاعبين...');
  },

  handleRoundResults(data) {
    var self = this;
    clearInterval(this.gameTimer);
    this.createConfetti();
    var resultsHtml = '';
    if (data.game === 'guesspionage') {
      resultsHtml = '<div class="text-5xl font-black text-accent mb-4">' + data.correctAnswer + '%</div><p class="text-xl mb-6">الإجابة الصحيحة</p>';
    } else if (data.game === 'fakinit') {
      resultsHtml = '<div class="text-2xl mb-4">' + (data.caught ? '🎉 المزيّف انكشف!' : '🕵️ المزيّف نجا!') + '</div><p class="text-xl">المزيّف كان: <strong>' + data.fakerName + '</strong></p>';
    } else if (data.game === 'triviamurder') {
      resultsHtml = '<div class="text-2xl text-accent mb-4">✅ ' + data.correctAnswer + '</div>' + (data.newlyDead?.length ? '<p class="text-error">💀 مات: ' + data.newlyDead.join(', ') + '</p>' : '<p class="text-success">✅ الكل نجا!</p>');
    }
    var scoresHtml = data.players.sort(function(a, b) { return b.score - a.score; }).map(function(p, i) { return '<div class="score-row flex justify-between items-center p-4 ' + (i === 0 ? 'text-accent' : '') + '"><div class="flex items-center gap-3"><span class="text-2xl">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1) + '</span><span class="text-xl font-bold">' + p.name + '</span></div><span class="text-xl font-bold">' + p.score + '</span></div>'; }).join('');
    document.getElementById('gameContent').innerHTML = '<div class="text-center" style="max-width: 500px;">' + resultsHtml + '<div class="panel mt-6"><h3 class="text-xl font-bold mb-4">📊 النتائج</h3>' + scoresHtml + '</div>' + (self.isHost ? '<button class="btn btn--primary btn--lg mt-6" onclick="App.requestNextRound()">' + (data.isLastRound ? 'النتائج النهائية 🏆' : 'الجولة التالية ➡️') + '</button>' : '<p class="text-muted mt-4">انتظر المضيف...</p>') + '</div>';
  },

  requestNextRound() { this.socket.emit('requestNextRound', this.currentRoom); },

  handleGameEnded(data) {
    var self = this;
    clearInterval(this.gameTimer);
    this.createConfetti();
    this.setTheme('victory');
    var scoresHtml = data.finalResults.map(function(p, i) { return '<div class="score-row flex justify-between items-center p-4 ' + (i === 0 ? 'winner-glow' : '') + '"><div class="flex items-center gap-3"><span class="text-3xl">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1) + '</span><span class="avatar" style="background: ' + p.color + '">' + p.avatar + '</span><span class="text-2xl font-bold">' + p.name + '</span></div><span class="text-2xl font-bold">' + p.score + '</span></div>'; }).join('');
    document.getElementById('finalScoreboard').innerHTML = '<div class="panel">' + scoresHtml + '</div>';
    document.getElementById('resultsActions').innerHTML = self.isHost ? '<button class="btn btn--primary btn--lg" onclick="App.backToLobby()">🔄 العب مرة ثانية</button>' : '<p class="text-muted">انتظر المضيف...</p>';
    this.showScreen('resultsScreen');
  },

  showToast(message, type) {
    type = type || 'error';
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.innerHTML = (type === 'error' ? '⚠️' : '✅') + ' ' + message;
    container.appendChild(toast);
    setTimeout(function() { toast.classList.add('toast--leaving'); setTimeout(function() { toast.remove(); }, 300); }, 3000);
  },

  createConfetti() {
    var colors = ['#ffd700', '#ff2d75', '#00d4ff', '#00e676', '#7c4dff', '#ff6d00'];
    for (var i = 0; i < 50; i++) {
      var c = document.createElement('div');
      c.className = 'confetti';
      c.style.cssText = 'position:fixed;width:10px;height:10px;background:' + colors[Math.floor(Math.random() * colors.length)] + ';left:' + (Math.random() * 100) + 'vw;top:-10px;z-index:9999;animation:confetti-fall 3s linear forwards;animation-delay:' + (Math.random() * 2) + 's;';
      document.body.appendChild(c);
      setTimeout(function() { c.remove(); }, 5000);
    }
  }
};

var style = document.createElement('style');
style.textContent = '@keyframes confetti-fall { to { top: 100vh; transform: rotate(720deg); } } .slider { width: 100%; height: 20px; -webkit-appearance: none; background: var(--color-neutral-700); border-radius: 10px; } .slider::-webkit-slider-thumb { -webkit-appearance: none; width: 40px; height: 40px; background: var(--color-accent-yellow); border: 4px solid black; border-radius: 50%; cursor: pointer; } .vote-card.selected, .player-vote-card.selected { border-color: var(--color-accent-green); box-shadow: 0 0 0 4px var(--color-accent-green); } .player-vote-card { cursor: pointer; padding: var(--space-4); border-radius: var(--radius-xl); border: 3px solid transparent; transition: all 0.2s; } .player-vote-card:hover { border-color: var(--color-accent-yellow); } .vs-badge { font-size: var(--text-2xl); font-weight: var(--font-black); color: var(--color-accent-pink); } .winner-glow { background: linear-gradient(90deg, rgba(255,217,61,0.2), transparent); animation: winner-pulse 1s ease infinite; } @keyframes winner-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } } .saudi-badge { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; background: rgba(0, 80, 0, 0.4); padding: 10px 24px; border-radius: 50px; border: 2px solid rgba(0, 150, 0, 0.5); font-size: 14px; } .menu-logo, .boot-logo { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; } .menu-logo__box, .boot-logo__box { background: var(--color-accent-yellow); color: black; padding: 12px 28px; border: 5px solid black; border-radius: 16px; font-size: 42px; font-weight: 900; box-shadow: 6px 6px 0 black; transform: rotate(-3deg); } .menu-logo__name, .boot-logo__name { font-size: 48px; font-weight: 900; text-shadow: 3px 3px 0 black; transform: rotate(2deg); } .menu-tagline { font-size: 18px; color: var(--color-accent-yellow); margin-top: 16px; } .menu-buttons { display: flex; flex-direction: column; gap: 16px; max-width: 350px; width: 100%; } .boot-mascot, .menu-mascot { font-size: 80px; } .how-to-steps { display: flex; flex-direction: column; gap: 16px; } .how-to-step { display: flex; align-items: center; gap: 16px; padding: 16px; background: rgba(255,255,255,0.1); border-radius: 12px; } .how-to-step__num { width: 40px; height: 40px; background: var(--color-accent-yellow); color: black; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; } .how-to-step__text { font-size: 18px; } #toastContainer { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; gap: 8px; } .text-error { color: var(--color-error); } .text-success { color: var(--color-success); }';
document.head.appendChild(style);
document.addEventListener('DOMContentLoaded', function() { App.init(); });
