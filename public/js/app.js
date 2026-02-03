/**
 * أبو عابد بوكس - التطبيق الرئيسي V2
 */
const TIPS = [
  "الكذب في اللعب... فن 🎭",
  "الأمانة مو دايم مطلوبة!",
  "القهوة قبل اللعب... واجب ☕",
  "الضيف أولاً... بس مو بالنقاط!",
  "خلك ذكي... أو مضحك... أو الاثنين!"
];

const App = {
  socket: null,
  currentRoom: null,
  isHost: false,
  gameTimer: null,
  currentGame: null,
  myId: null,

  init() {
    this.socket = io();
    this.myId = this.socket.id;
    this.setupSocketEvents();
    
    // Random tip
    document.getElementById('bootTip').textContent = '💡 ' + TIPS[Math.floor(Math.random() * TIPS.length)];
    
    // Show menu after boot
    setTimeout(() => this.showScreen('menuScreen'), 2000);
    
    // Enter key handlers
    ['hostNameInput', 'playerNameInput'].forEach(id => {
      document.getElementById(id)?.addEventListener('keypress', e => {
        if (e.key === 'Enter') id === 'hostNameInput' ? this.createRoom() : this.joinRoom();
      });
    });
    document.getElementById('roomCodeInput')?.addEventListener('keypress', e => {
      if (e.key === 'Enter') this.joinRoom();
    });
  },

  setupSocketEvents() {
    const s = this.socket;
    
    s.on('connect', () => { this.myId = s.id; });

    s.on('roomCreated', data => {
      this.currentRoom = data.code;
      this.isHost = true;
      document.getElementById('displayRoomCode').textContent = data.code;
      this.updatePlayers(data.players);
      this.showScreen('lobbyScreen');
      this.updateHostUI();
      this.showToast('تم إنشاء الغرفة!', 'success');
    });

    s.on('roomJoined', data => {
      this.currentRoom = data.code;
      document.getElementById('displayRoomCode').textContent = data.code;
      this.updatePlayers(data.players);
      this.showScreen('lobbyScreen');
      this.updateHostUI();
      this.showToast('انضممت للغرفة!', 'success');
    });

    s.on('playerJoined', data => this.updatePlayers(data.players));
    s.on('playerLeft', data => {
      this.updatePlayers(data.players);
      const me = data.players.find(p => p.id === this.myId);
      if (me?.isHost) { this.isHost = true; this.updateHostUI(); }
    });
    s.on('playerUpdated', data => this.updatePlayers(data.players));
    s.on('error', data => this.showToast(data.message, 'error'));

    s.on('gameStarted', data => {
      this.currentGame = data.game;
      this.setTheme(data.game);
      this.showScreen('gameScreen');
      this.updateGameHeader(data.game);
    });

    s.on('playerAnswered', data => this.updateWaitingCount(data.count, data.total));
    s.on('quiplashQuestion', data => this.handleQuiplashQuestion(data));
    s.on('guesspionageQuestion', data => this.handleGuesspionageQuestion(data));
    s.on('fakinItTask', data => this.handleFakinItTask(data));
    s.on('fakinItVoting', data => this.handleFakinItVoting(data));
    s.on('triviaMurderQuestion', data => this.handleTriviaMurderQuestion(data));
    s.on('fibbageQuestion', data => this.handleFibbageQuestion(data));
    s.on('fibbageVoting', data => this.handleFibbageVoting(data));
    s.on('votingPhase', data => this.handleVotingPhase(data));
    s.on('roundResults', data => this.handleRoundResults(data));
    s.on('gameEnded', data => this.handleGameEnded(data));
    s.on('returnedToLobby', data => {
      this.setTheme('hub');
      this.updatePlayers(data.players);
      this.showScreen('lobbyScreen');
    });
  },

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('is-active'));
    document.getElementById(id)?.classList.add('is-active');
  },

  setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const bg = document.querySelector('.bg__pattern');
    if (bg) {
      bg.className = 'bg__pattern';
      const p = {quiplash:'pattern-stripes',guesspionage:'pattern-dots',fakinit:'pattern-zigzag',triviamurder:'pattern-noise',fibbage:'pattern-halftone',drawful:'pattern-waves',victory:'pattern-confetti'};
      bg.classList.add(p[theme] || 'pattern-rays');
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

  toggleReady() {
    this.socket.emit('playerReady', this.currentRoom);
  },

  selectGame(game) {
    if (!this.isHost) return this.showToast('المضيف فقط!', 'error');
    this.socket.emit('startGame', { code: this.currentRoom, game });
  },

  backToLobby() {
    this.socket.emit('backToLobby', this.currentRoom);
  },

  updatePlayers(players) {
    document.getElementById('playerCount').textContent = players.length;
    const grid = document.getElementById('playersGrid');
    if (!grid) return;
    grid.innerHTML = players.map(p => 
      '<div class="player-avatar' + (p.isReady ? ' player-avatar--ready' : '') + '">' +
        '<div class="player-avatar__face" style="background:' + p.color + '">' + p.avatar +
          (p.isHost ? '<span class="player-avatar__crown">👑</span>' : '') +
        '</div>' +
        '<span class="player-avatar__name">' + p.name + '</span>' +
        '<span class="player-avatar__score">' + p.score + ' نقطة</span>' +
      '</div>'
    ).join('');
  },

  updateHostUI() {
    document.getElementById('gamesSection').style.display = this.isHost ? 'block' : 'none';
    document.getElementById('waitingMessage').style.display = this.isHost ? 'none' : 'block';
  },

  updateGameHeader(game) {
    const g = {
      quiplash: {i:'⚡',t:'رد سريع',h:'اكتب أطرف إجابة!'},
      guesspionage: {i:'📊',t:'خمّن النسبة',h:'خمّن النسبة الصحيحة!'},
      fakinit: {i:'🕵️',t:'المزيّف',h:'اكتشف المزيّف!'},
      triviamurder: {i:'💀',t:'حفلة القاتل',h:'أجب صح أو مت!'},
      fibbage: {i:'🎭',t:'كشف الكذاب',h:'اكتب كذبة مقنعة!'},
      drawful: {i:'🎨',t:'ارسم لي',h:'ارسم الكلمة!'}
    };
    const info = g[game] || g.quiplash;
    document.getElementById('gameTitle').textContent = info.i + ' ' + info.t;
    document.getElementById('gameHint').textContent = '💡 ' + info.h;
  },

  startTimer(sec) {
    let t = sec;
    const el = document.getElementById('gameTimer');
    el.textContent = t;
    el.className = 'game-timer';
    if (this.gameTimer) clearInterval(this.gameTimer);
    this.gameTimer = setInterval(() => {
      t--;
      el.textContent = t;
      if (t <= 10) el.classList.add('game-timer--warning');
      if (t <= 5) { el.classList.remove('game-timer--warning'); el.classList.add('game-timer--danger'); }
      if (t <= 0) clearInterval(this.gameTimer);
    }, 1000);
  },

  showWaiting(msg) {
    document.getElementById('gameContent').innerHTML = '<div class="text-center"><div class="spinner mb-4"></div><p class="text-2xl font-bold">' + msg + '</p><p class="text-muted mt-2" id="waitingCount">ننتظر...</p></div>';
  },

  updateWaitingCount(c, t) {
    const el = document.getElementById('waitingCount');
    if (el) el.textContent = c + ' من ' + t + ' أجابوا';
  },

  // QUIPLASH
  handleQuiplashQuestion(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    this.startTimer(d.timeLimit);
    document.getElementById('gameContent').innerHTML = '<div class="panel" style="max-width:600px;width:100%"><div class="badge badge--primary mb-4">السؤال ' + d.round + '</div><p class="text-2xl font-bold mb-6">' + d.question + '</p><input type="text" class="input mb-4" id="answerInput" placeholder="إجابتك..." maxlength="100"><button class="btn btn--primary btn--full" onclick="App.submitAnswer()">إرسال ⚡</button></div>';
    document.getElementById('answerInput')?.focus();
  },

  // GUESSPIONAGE
  handleGuesspionageQuestion(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    this.startTimer(d.timeLimit);
    document.getElementById('gameContent').innerHTML = '<div class="panel" style="max-width:600px;width:100%"><div class="badge badge--info mb-4">📊 خمّن</div><p class="text-2xl font-bold mb-6">' + d.question + '</p><div class="text-center"><div class="percent-display mb-4" id="percentDisplay">50%</div><input type="range" class="slider-track" id="percentSlider" min="0" max="100" value="50" oninput="document.getElementById(\'percentDisplay\').textContent=this.value+\'%\'"><button class="btn btn--primary btn--full mt-6" onclick="App.submitGuess()">تأكيد 📊</button></div></div>';
  },

  submitGuess() {
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: document.getElementById('percentSlider').value });
    this.showWaiting('ننتظر التخمينات...');
  },

  // FAKIN IT
  handleFakinItTask(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    this.startTimer(d.timeLimit);
    const html = d.isFaker ? 
      '<div class="panel" style="max-width:600px;background:linear-gradient(135deg,#8B0000,#4a0000)"><div class="badge badge--error mb-4">🕵️ أنت المزيّف!</div><p class="text-2xl font-bold mb-4">ما تعرف المهمة!</p><p class="text-muted">حاول تتصرف طبيعي!</p><button class="btn btn--secondary btn--full mt-6" onclick="App.submitFakinAction()">جاهز! 🎭</button></div>' :
      '<div class="panel" style="max-width:600px"><div class="badge badge--warning mb-4">' + d.category + '</div><p class="text-2xl font-bold mb-6">' + d.task + '</p><button class="btn btn--primary btn--full" onclick="App.submitFakinAction()">جاهز! ✅</button></div>';
    document.getElementById('gameContent').innerHTML = html;
  },

  submitFakinAction() {
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: 'done' });
    this.showWaiting('ننتظر الجميع...');
  },

  handleFakinItVoting(d) {
    this.startTimer(d.timeLimit);
    const html = d.players.map(p => '<div class="player-avatar" style="cursor:pointer" onclick="App.votePlayer(\'' + p.id + '\',this)"><div class="player-avatar__face" style="background:' + p.color + '">' + p.avatar + '</div><span class="player-avatar__name">' + p.name + '</span></div>').join('');
    document.getElementById('gameContent').innerHTML = '<div class="text-center" style="max-width:800px"><p class="text-xl mb-2">المهمة كانت:</p><p class="text-2xl font-bold text-accent mb-6">"' + d.task + '"</p><h3 class="text-2xl font-bold mb-4">🕵️ من المزيّف؟</h3><div class="players-area">' + html + '</div></div>';
  },

  votePlayer(id, el) {
    document.querySelectorAll('.player-avatar').forEach(c => c.style.borderColor = 'transparent');
    el.style.borderColor = '#00e676';
    this.socket.emit('submitVote', { code: this.currentRoom, voteId: id });
  },

  // TRIVIA MURDER
  handleTriviaMurderQuestion(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    this.startTimer(d.timeLimit);
    const opts = d.options.map((o, i) => '<button class="btn btn--secondary btn--full" onclick="App.submitTriviaAnswer(' + i + ',this)">' + o + '</button>').join('');
    document.getElementById('gameContent').innerHTML = '<div class="panel" style="max-width:600px"><div class="badge badge--error mb-4">💀 أجب أو مت!</div><p class="text-2xl font-bold mb-6">' + d.question + '</p><div class="flex flex-col gap-3">' + opts + '</div></div>';
  },

  submitTriviaAnswer(i, btn) {
    document.querySelectorAll('.btn--secondary').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
    btn.style.opacity = '1';
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: i });
  },

  // FIBBAGE
  handleFibbageQuestion(d) {
    document.getElementById('gameRound').textContent = 'الجولة ' + d.round + ' من ' + d.maxRounds;
    this.startTimer(d.timeLimit);
    document.getElementById('gameContent').innerHTML = '<div class="panel" style="max-width:600px"><div class="badge badge--warning mb-4">🎭 اكتب كذبة</div><p class="text-2xl font-bold mb-6">' + d.question + '</p><input type="text" class="input mb-4" id="lieInput" placeholder="كذبتك المقنعة..." maxlength="50"><button class="btn btn--primary btn--full" onclick="App.submitLie()">إرسال 🎭</button></div>';
    document.getElementById('lieInput')?.focus();
  },

  submitLie() {
    const lie = document.getElementById('lieInput').value.trim();
    if (!lie) return this.showToast('اكتب كذبة!', 'error');
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: lie });
    this.showWaiting('ننتظر الكذابين...');
  },

  handleFibbageVoting(d) {
    this.startTimer(d.timeLimit);
    const opts = d.options.map(o => '<div class="vote-option" onclick="App.guessFibbage(\'' + o.id + '\',this)"><div class="vote-option__text">' + o.text + '</div></div>').join('');
    document.getElementById('gameContent').innerHTML = '<div class="panel" style="max-width:600px"><p class="text-xl mb-2">اختر الصحيحة:</p><p class="text-2xl font-bold text-accent mb-6">' + d.question + '</p><div class="flex flex-col gap-3">' + opts + '</div></div>';
  },

  guessFibbage(id, el) {
    document.querySelectorAll('.vote-option').forEach(c => c.classList.remove('vote-option--selected'));
    el.classList.add('vote-option--selected');
    this.socket.emit('submitVote', { code: this.currentRoom, voteId: id });
  },

  // VOTING
  handleVotingPhase(d) {
    this.startTimer(d.timeLimit);
    const html = d.answers.map((a, i) => '<div class="vote-option" onclick="App.voteAnswer(\'' + a.playerId + '\',this)"><div class="vote-option__text">"' + a.answer + '"</div></div>' + (i === 0 ? '<div class="text-3xl font-black text-accent">VS</div>' : '')).join('');
    document.getElementById('gameContent').innerHTML = '<div style="max-width:800px;width:100%"><p class="text-xl text-center mb-2">' + d.question + '</p><h3 class="text-2xl font-bold text-center text-accent mb-6">🗳️ صوّت!</h3><div class="flex gap-4 justify-center items-center flex-wrap">' + html + '</div></div>';
  },

  voteAnswer(id, el) {
    document.querySelectorAll('.vote-option').forEach(c => c.classList.remove('vote-option--selected'));
    el.classList.add('vote-option--selected');
    this.socket.emit('submitVote', { code: this.currentRoom, voteId: id });
  },

  submitAnswer() {
    const ans = document.getElementById('answerInput').value.trim();
    if (!ans) return this.showToast('اكتب إجابة!', 'error');
    this.socket.emit('submitAnswer', { code: this.currentRoom, answer: ans });
    this.showWaiting('ننتظر...');
  },

  // RESULTS
  handleRoundResults(d) {
    clearInterval(this.gameTimer);
    this.confetti();
    let r = '';
    if (d.game === 'guesspionage') r = '<div class="percent-display mb-4">' + d.correctAnswer + '%</div><p class="text-xl mb-6">الإجابة الصحيحة</p>';
    else if (d.game === 'fakinit') r = '<div class="text-2xl mb-4">' + (d.caught ? '🎉 انكشف!' : '🕵️ نجا!') + '</div><p class="text-xl">المزيّف: <strong>' + d.fakerName + '</strong></p>';
    else if (d.game === 'triviamurder') r = '<div class="text-2xl text-accent mb-4">✅ ' + d.correctAnswer + '</div>' + (d.newlyDead?.length ? '<p style="color:#ff4444">💀 ' + d.newlyDead.join(', ') + '</p>' : '<p style="color:#00e676">✅ الكل نجا!</p>');
    
    const scores = d.players.sort((a, b) => b.score - a.score).map((p, i) => '<div class="scoreboard__row"><div class="flex items-center gap-3"><span class="text-2xl">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1) + '</span><span class="text-xl font-bold">' + p.name + '</span></div><span class="text-xl font-bold" style="color:#FFD93D">' + p.score + '</span></div>').join('');
    
    document.getElementById('gameContent').innerHTML = '<div class="text-center" style="max-width:500px">' + r + '<div class="scoreboard mt-6">' + scores + '</div>' + (this.isHost ? '<button class="btn btn--primary btn--lg mt-6" onclick="App.requestNextRound()">' + (d.isLastRound ? 'النتائج 🏆' : 'التالي ➡️') + '</button>' : '<p class="text-muted mt-4">انتظر...</p>') + '</div>';
  },

  requestNextRound() {
    this.socket.emit('requestNextRound', this.currentRoom);
  },

  handleGameEnded(d) {
    clearInterval(this.gameTimer);
    this.confetti();
    this.setTheme('victory');
    
    const w = d.finalResults[0];
    document.getElementById('winnerDisplay').innerHTML = '<div style="font-size:80px;animation:bounce 1s ease infinite">🏆</div><h1 class="text-4xl font-black mt-4" style="color:#FFD93D">الفائز!</h1><div class="text-5xl font-black mt-2">' + w.avatar + ' ' + w.name + '</div><div class="text-3xl mt-2" style="color:#FFD93D">' + w.score + ' نقطة</div>';
    
    const scores = d.finalResults.map((p, i) => '<div class="scoreboard__row"><div class="flex items-center gap-3"><span class="text-2xl">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1) + '</span><span class="avatar" style="background:' + p.color + ';width:40px;height:40px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center">' + p.avatar + '</span><span class="text-xl font-bold">' + p.name + '</span></div><span class="text-xl font-bold" style="color:#FFD93D">' + p.score + '</span></div>').join('');
    document.getElementById('finalScoreboard').innerHTML = scores;
    document.getElementById('resultsActions').innerHTML = this.isHost ? '<button class="btn btn--primary btn--lg" onclick="App.backToLobby()">🔄 مرة ثانية</button>' : '<p class="text-muted">انتظر...</p>';
    this.showScreen('resultsScreen');
  },

  showToast(msg, type) {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast toast--' + (type || 'error');
    t.style.cssText = 'background:' + (type === 'success' ? '#00e676' : '#ff4444') + ';color:#fff;padding:12px 24px;border-radius:50px;margin:8px;font-weight:700;animation:slideIn 0.3s';
    t.textContent = (type === 'success' ? '✅' : '⚠️') + ' ' + msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  },

  confetti() {
    const colors = ['#FFD93D', '#E91E8C', '#00d4ff', '#00e676', '#7c4dff', '#FF8C42'];
    for (let i = 0; i < 50; i++) {
      const c = document.createElement('div');
      c.style.cssText = 'position:fixed;width:10px;height:10px;background:' + colors[Math.floor(Math.random() * colors.length)] + ';left:' + (Math.random() * 100) + 'vw;top:-10px;z-index:9999;border-radius:50%;animation:fall ' + (2 + Math.random() * 2) + 's linear forwards;animation-delay:' + (Math.random()) + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 5000);
    }
  }
};

// Animations
const style = document.createElement('style');
style.textContent = '@keyframes slideIn{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes fall{to{top:100vh;transform:rotate(720deg)}}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}#toastContainer{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;align-items:center}';
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => App.init());
