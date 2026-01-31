/**
 * ═══════════════════════════════════════════════════════════════════
 * ████████████████████ أبو عابد بوكس - الجافاسكربت █████████████████
 * ═══════════════════════════════════════════════════════════════════
 */

// المتغيرات العامة
let socket;
let currentRoom = null;
let currentPlayer = null;
let isHost = false;
let selectedGame = null;
let timerInterval = null;

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
    initSocket();
    simulateLoading();
});

// محاكاة التحميل
function simulateLoading() {
    setTimeout(() => {
        showScreen('main-menu');
    }, 2000);
}

// تهيئة Socket.io
function initSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('✅ متصل بالسيرفر');
    });
    
    socket.on('disconnect', () => {
        console.log('❌ انقطع الاتصال');
        showToast('انقطع الاتصال بالسيرفر', 'error');
    });
    
    socket.on('error', (data) => {
        showToast(data.message, 'error');
    });
    
    // أحداث الغرفة
    socket.on('roomCreated', handleRoomCreated);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('playerUpdated', handlePlayerUpdated);
    socket.on('returnedToLobby', handleReturnedToLobby);
    
    // أحداث اللعبة
    socket.on('gameStarted', handleGameStarted);
    socket.on('playerAnswered', handlePlayerAnswered);
    socket.on('voteReceived', handleVoteReceived);
    socket.on('guessReceived', handleGuessReceived);
    socket.on('gameEnded', handleGameEnded);
    
    // Quiplash
    socket.on('quiplashQuestion', handleQuiplashQuestion);
    socket.on('quiplashVoting', handleQuiplashVoting);
    socket.on('quiplashResults', handleQuiplashResults);
    
    // Fibbage
    socket.on('fibbageQuestion', handleFibbageQuestion);
    socket.on('fibbageVoting', handleFibbageVoting);
    socket.on('fibbageResults', handleFibbageResults);
    
    // Guesspionage
    socket.on('guesspionageQuestion', handleGuesspionageQuestion);
    socket.on('guesspionageResults', handleGuesspionageResults);
    
    // Fakin It
    socket.on('fakinItTask', handleFakinItTask);
    socket.on('fakinItVoting', handleFakinItVoting);
    socket.on('fakinItResults', handleFakinItResults);
    
    // Trivia Murder
    socket.on('triviaMurderQuestion', handleTriviaMurderQuestion);
    socket.on('triviaMurderResults', handleTriviaMurderResults);
    socket.on('deathChallenge', handleDeathChallenge);
    socket.on('deathChallengeStarted', handleDeathChallengeStarted);
    socket.on('deathChallengeResults', handleDeathChallengeResults);
}

// ═══════════════════════════════════════════════════════════════════
// █████████████████████ وظائف الشاشات ██████████████████████████████
// ═══════════════════════════════════════════════════════════════════
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════════
// ███████████████████ إنشاء والانضمام للغرف ████████████████████████
// ═══════════════════════════════════════════════════════════════════
function createRoom() {
    const name = document.getElementById('host-name').value.trim();
    if (!name) {
        showToast('اكتب اسمك أولاً! 😊', 'error');
        return;
    }
    if (name.length < 2) {
        showToast('الاسم قصير جداً!', 'error');
        return;
    }
    
    currentPlayer = { name };
    isHost = true;
    socket.emit('createRoom', name);
}

function joinRoom() {
    const code = document.getElementById('room-code-input').value.trim().toUpperCase();
    const name = document.getElementById('player-name').value.trim();
    
    if (!code || code.length !== 4) {
        showToast('كود الغرفة لازم 4 حروف! 🔤', 'error');
        return;
    }
    if (!name) {
        showToast('اكتب اسمك أولاً! 😊', 'error');
        return;
    }
    if (name.length < 2) {
        showToast('الاسم قصير جداً!', 'error');
        return;
    }
    
    currentPlayer = { name };
    isHost = false;
    socket.emit('joinRoom', { code, playerName: name });
}

// ═══════════════════════════════════════════════════════════════════
// ██████████████████████ معالجات الغرفة █████████████████████████████
// ═══════════════════════════════════════════════════════════════════
function handleRoomCreated(data) {
    currentRoom = data.code;
    isHost = true;
    showScreen('lobby');
    updateLobby(data.players);
    document.getElementById('display-room-code').textContent = data.code;
    document.getElementById('game-selection').style.display = 'block';
    showToast('تم إنشاء الغرفة! شارك الكود مع أصحابك 🎉', 'success');
}

function handleRoomJoined(data) {
    currentRoom = data.code;
    showScreen('lobby');
    updateLobby(data.players);
    document.getElementById('display-room-code').textContent = data.code;
    document.getElementById('game-selection').style.display = isHost ? 'block' : 'none';
    showToast('انضممت للغرفة! 🚀', 'success');
}

function handlePlayerJoined(data) {
    updateLobby(data.players);
    if (data.newPlayer) {
        showToast(`${data.newPlayer} انضم للغرفة! 👋`, 'info');
    }
}

function handlePlayerLeft(data) {
    updateLobby(data.players);
    if (data.leftPlayer) {
        showToast(`${data.leftPlayer} غادر الغرفة 👋`, 'info');
    }
}

function handlePlayerUpdated(data) {
    updateLobby(data.players);
}

function handleReturnedToLobby(data) {
    showScreen('lobby');
    updateLobby(data.players);
    selectedGame = null;
    document.querySelectorAll('.game-card').forEach(c => c.classList.remove('selected'));
    showToast('رجعنا للوبي! 🏠', 'info');
}

// ═══════════════════════════════════════════════════════════════════
// ████████████████████████ وظائف اللوبي █████████████████████████████
// ═══════════════════════════════════════════════════════════════════
function updateLobby(players) {
    const grid = document.getElementById('players-list');
    const countNum = document.getElementById('player-count-num');
    
    countNum.textContent = players.length;
    
    grid.innerHTML = players.map(p => `
        <div class="player-card ${p.isReady ? 'ready' : ''} ${p.isHost ? 'host' : ''}" 
             style="border-color: ${p.isHost ? '#C8A951' : (p.isReady ? '#28a745' : 'transparent')}">
            <div class="player-avatar">${p.avatar}</div>
            <div class="player-name" style="color: ${p.color}">${p.name}</div>
            <div class="player-status">
                ${p.isHost ? '👑 المضيف' : (p.isReady ? '✓ جاهز' : 'منتظر...')}
            </div>
        </div>
    `).join('');
    
    // إظهار زر البدء للمضيف
    const startBtn = document.getElementById('start-game-btn');
    if (isHost && selectedGame && players.length >= 2) {
        startBtn.style.display = 'inline-flex';
    } else {
        startBtn.style.display = 'none';
    }
}

function selectGame(game) {
    selectedGame = game;
    document.querySelectorAll('.game-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`[data-game="${game}"]`).classList.add('selected');
    
    const startBtn = document.getElementById('start-game-btn');
    if (isHost) {
        startBtn.style.display = 'inline-flex';
    }
}

function toggleReady() {
    socket.emit('playerReady', currentRoom);
}

function startGame() {
    if (!selectedGame) {
        showToast('اختر لعبة أولاً! 🎮', 'error');
        return;
    }
    socket.emit('startGame', { code: currentRoom, game: selectedGame });
}

// ═══════════════════════════════════════════════════════════════════
// ████████████████████████ بدء اللعبة ███████████████████████████████
// ═══════════════════════════════════════════════════════════════════
function handleGameStarted(data) {
    const gameScreen = document.getElementById('game-screen');
    gameScreen.className = `screen active ${data.game}`;
    showScreen('game-screen');
    showToast(`بدأت لعبة ${data.gameName}! 🎮`, 'success');
}

function handlePlayerAnswered(data) {
    showToast(`${data.playerName} جاوب! (${data.count}/${data.total})`, 'info');
}

function handleVoteReceived(data) {
    // تحديث عداد التصويت
}

function handleGuessReceived(data) {
    // تحديث عداد التخمين
}

// ═══════════════════════════════════════════════════════════════════
// ███████████████████████████ Timer █████████████████████████████████
// ═══════════════════════════════════════════════════════════════════
function startTimer(seconds, callback) {
    clearInterval(timerInterval);
    let remaining = seconds;
    
    const updateTimer = () => {
        const timerEl = document.getElementById('game-timer');
        if (timerEl) {
            timerEl.textContent = remaining;
            timerEl.classList.remove('warning', 'danger');
            if (remaining <= 5) timerEl.classList.add('danger');
            else if (remaining <= 10) timerEl.classList.add('warning');
        }
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            if (callback) callback();
        }
        remaining--;
    };
    
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

// ═══════════════════════════════════════════════════════════════════
// ██████████████████████████ Quiplash ███████████████████████████████
// ═══════════════════════════════════════════════════════════════════
function handleQuiplashQuestion(data) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="game-header">
            <div class="round-info">الجولة ${data.round}/${data.maxRounds}</div>
            <div class="timer" id="game-timer">${data.timeLimit}</div>
        </div>
        <div class="question-box">
            <div class="question-text">${data.question}</div>
        </div>
        <input type="text" class="answer-input" id="quiplash-answer" 
               placeholder="اكتب ردك هنا..." maxlength="100" autocomplete="off">
        <button class="btn btn-primary submit-btn" onclick="submitQuiplashAnswer()">
            إرسال الرد 💬
        </button>
        <div class="info-bar">
            <span>💡 كن مضحكاً وأصلياً!</span>
        </div>
    `;
    
    startTimer(data.timeLimit, submitQuiplashAnswer);
    document.getElementById('quiplash-answer').focus();
}

function submitQuiplashAnswer() {
    const input = document.getElementById('quiplash-answer');
    if (!input) return;
    
    const answer = input.value.trim();
    if (!answer) {
        showToast('اكتب شي! 😅', 'error');
        return;
    }
    
    socket.emit('submitQuiplashAnswer', { code: currentRoom, answer });
    
    document.getElementById('game-container').innerHTML = `
        <div class="waiting-screen">
            <div class="waiting-icon">⏳</div>
            <h2>تم إرسال ردك!</h2>
            <p>منتظرين باقي اللاعبين...</p>
        </div>
    `;
    clearInterval(timerInterval);
}

function handleQuiplashVoting(data) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="game-header">
            <div class="round-info">وقت التصويت!</div>
            <div class="timer" id="game-timer">${data.timeLimit}</div>
        </div>
        <div class="question-box">
            <div class="question-text">${data.question}</div>
        </div>
        <div class="voting-options">
            ${data.answers.map(a => `
                <div class="vote-card" onclick="voteQuiplash('${a.playerId}')">
                    <div class="vote-answer">${a.answer}</div>
                </div>
            `).join('')}
        </div>
        <div class="info-bar">
            <span>🗳️ اختر الرد الأفضل!</span>
        </div>
    `;
    
    startTimer(data.timeLimit);
}

function voteQuiplash(playerId) {
    document.querySelectorAll('.vote-card').forEach(c => c.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    socket.emit('submitQuiplashVote', { code: currentRoom, votedPlayerId: playerId });
    showToast('تم التصويت! ✓', 'success');
}

function handleQuiplashResults(data) {
    const container = document.getElementById('game-container');
    const winner = data.results[0];
    
    container.innerHTML = `
        <div class="results-header">
            <h2>${data.quiplash ? '🎉 كويبلاش!' : '📊 النتائج'}</h2>
            <p>${data.question}</p>
        </div>
        <div class="results-list">
            ${data.results.map((r, i) => `
                <div class="result-item" style="border-right: 4px solid ${r.playerColor}">
                    <div class="result-rank ${i === 0 ? 'gold' : ''}">${i === 0 ? '🏆' : (i + 1)}</div>
                    <div class="player-avatar">${r.playerAvatar}</div>
                    <div class="result-info">
                        <div class="result-name">${r.playerName}</div>
                        <div class="result-answer">"${r.answer}"</div>
                    </div>
                    <div class="result-score">${r.votes} صوت (${r.percentage}%)</div>
                </div>
            `).join('')}
        </div>
        ${!data.isLastRound ? `
            ${isHost ? '<button class="btn btn-primary submit-btn" onclick="requestNextRound()">الجولة التالية ➡️</button>' : '<p style="text-align:center;margin-top:1rem">منتظرين المضيف...</p>'}
        ` : ''}
    `;
}

// ═══════════════════════════════════════════════════════════════════
// ███████████████████████████ Fibbage ███████████████████████████████
// ═══════════════════════════════════════════════════════════════════
function handleFibbageQuestion(data) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="game-header">
            <div class="round-info">الجولة ${data.round}/${data.maxRounds}</div>
            <div class="timer" id="game-timer">${data.timeLimit}</div>
        </div>
        <div class="question-box">
            <div class="question-text">${data.question}</div>
        </div>
        <input type="text" class="answer-input" id="fibbage-lie" 
               placeholder="اكتب كذبة مقنعة..." maxlength="50" autocomplete="off">
        <button class="btn btn-primary submit-btn" onclick="submitFibbageLie()">
            إرسال الكذبة 🤥
        </button>
        <div class="info-bar">
            <span>🎭 اكتب إجابة مزيفة تخدع الآخرين!</span>
        </div>
    `;
    startTimer(data.timeLimit, submitFibbageLie);
}

function submitFibbageLie() {
    const input = document.getElementById('fibbage-lie');
    if (!input) return;
    
    const lie = input.value.trim();
    if (!lie) {
        showToast('اكتب كذبة! 😈', 'error');
        return;
    }
    
    socket.emit('submitFibbageLie', { code: currentRoom, lie });
    showWaitingScreen('تم إرسال كذبتك!');
    clearInterval(timerInterval);
}

function handleFibbageVoting(data) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="game-header">
            <div class="round-info">اكتشف الحقيقة!</div>
            <div class="timer" id="game-timer">${data.timeLimit}</div>
        </div>
        <div class="question-box">
            <div class="question-text">${data.question}</div>
        </div>
        <div class="options-grid">
            ${data.options.map(o => `
                <button class="option-btn" onclick="guessFibbage('${o.id}')">${o.text}</button>
            `).join('')}
        </div>
        <div class="info-bar">
            <span>🔍 أي إجابة هي الصحيحة؟</span>
        </div>
    `;
    startTimer(data.timeLimit);
}

function guessFibbage(guessId) {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    socket.emit('submitFibbageGuess', { code: currentRoom, guessId });
    showToast('تم اختيارك! ✓', 'success');
}

function handleFibbageResults(data) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="results-header">
            <h2>🎭 كشف الحقيقة!</h2>
            <p>الإجابة الصحيحة: <strong style="color:#00ff88">${data.correctAnswer}</strong></p>
        </div>
        <div class="results-list">
            ${data.results.map(r => `
                <div class="result-item">
                    <div class="player-avatar">${r.playerAvatar}</div>
                    <div class="result-info">
                        <div class="result-name">${r.playerName}</div>
                        <div class="result-answer">
                            ${r.gotCorrect ? '✅ وجد الحقيقة!' : ''}
                            ${r.fooledCount > 0 ? `😈 خدع ${r.fooledCount} لاعب` : ''}
                        </div>
                    </div>
                    <div class="result-score">+${r.pointsEarned}</div>
                </div>
            `).join('')}
        </div>
        ${!data.isLastRound && isHost ? '<button class="btn btn-primary submit-btn" onclick="requestNextRound()">التالي ➡️</button>' : ''}
    `;
}

// ═══════════════════════════════════════════════════════════════════
// ██████████████████████ Guesspionage ███████████████████████████████
// ═══════════════════════════════════════════════════════════════════
function handleGuesspionageQuestion(data) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="game-header">
            <div class="round-info">الجولة ${data.round}/${data.maxRounds}</div>
            <div class="timer" id="game-timer">${data.timeLimit}</div>
        </div>
        <div class="question-box">
            <div class="question-text">${data.question}</div>
        </div>
        <div class="slider-container">
            <input type="range" id="guess-slider" min="0" max="100" value="50" 
                   oninput="updateSliderValue(this.value)">
            <div class="slider-value" id="slider-value">50%</div>
        </div>
        <button class="btn btn-primary submit-btn" onclick="submitGuess()">
            تأكيد التخمين 📊
        </button>
    `;
    
    // إضافة ستايل السلايدر
    const style = document.createElement('style');
    style.textContent = `
        .slider-container { text-align: center; margin: 2rem 0; }
        #guess-slider { width: 100%; height: 20px; -webkit-appearance: none; background: rgba(255,255,255,0.2); border-radius: 10px; }
        #guess-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 40px; height: 40px; background: #C8A951; border-radius: 50%; cursor: pointer; }
        .slider-value { font-size: 3rem; font-weight: 900; color: #C8A951; margin-top: 1rem; font-family: var(--font-display); }
    `;
    container.appendChild(style);
    
    startTimer(data.timeLimit, submitGuess);
}

function updateSliderValue(value) {
    document.getElementById('slider-value').textContent = value + '%';
}

function submitGuess() {
    const slider = document.getElementById('guess-slider');
    if (!slider) return;
    
    socket.emit('submitGuess', { code: currentRoom, guess: slider.value });
    showWaitingScreen('تم إرسال تخمينك!');
    clearInterval(timerInterval);
}

function handleGuesspionageResults(data) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="results-header">
            <h2>📊 النتائج</h2>
            <p>الإجابة الصحيحة: <strong style="color:#00ff88;font-size:2rem">${data.correctAnswer}%</strong></p>
        </div>
        <div class="results-list">
            ${data.results.map((r, i) => `
                <div class="result-item">
                    <div class="result-rank">${r.emoji}</div>
                    <div class="player-avatar">${r.playerAvatar}</div>
                    <div class="result-info">
                        <div class="result-name">${r.playerName}</div>
                        <div class="result-answer">خمّن ${r.guess}% • ${r.accuracy}</div>
                    </div>
                    <div class="result-score">+${r.points}</div>
                </div>
            `).join('')}
        </div>
        ${!data.isLastRound && isHost ? '<button class="btn btn-primary submit-btn" onclick="requestNextRound()">التالي ➡️</button>' : ''}
    `;
}

// ═══════════════════════════════════════════════════════════════════
// █████████████████████████ Fakin It ████████████████████████████████
// ═══════════════════════════════════════════════════════════════════
function handleFakinItTask(data) {
    const container = document.getElementById('game-container');
    
    if (data.isFaker) {
        container.innerHTML = `
            <div class="game-header">
                <div class="round-info">${data.category}</div>
                <div class="timer" id="game-timer">${data.timeLimit}</div>
            </div>
            <div class="question-box" style="background: rgba(220,20,60,0.3); border: 3px solid #dc143c;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎭</div>
                <div class="question-text" style="color: #ff6b6b;">أنت المزيّف!</div>
                <p style="margin-top: 1rem;">حاول تقلد الآخرين بدون ما تعرف المهمة!</p>
            </div>
            <button class="btn btn-primary submit-btn" onclick="submitFakinAction('fake')">
                جاهز! 👀
            </button>
        `;
    } else {
        container.innerHTML = `
            <div class="game-header">
                <div class="round-info">${data.category}</div>
                <div class="timer" id="game-timer">${data.timeLimit}</div>
            </div>
            <div class="question-box">
                <div class="question-text">${data.task}</div>
            </div>
            <button class="btn btn-primary submit-btn" onclick="submitFakinAction('done')">
                سويتها! ✓
            </button>
            <div class="info-bar">
                <span>👁️ راقب الآخرين وحاول تكتشف المزيّف!</span>
            </div>
        `;
    }
    
    startTimer(data.timeLimit, () => submitFakinAction('timeout'));
}

function submitFakinAction(action) {
    socket.emit('submitFakinAction', { code: currentRoom, action });
    showWaitingScreen('منتظرين الباقي...');
    clearInterval(timerInterval);
}

function handleFakinItVoting(data) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="game-header">
            <div class="round-info">من هو المزيّف؟ 🎭</div>
            <div class="timer" id="game-timer">${data.timeLimit}</div>
        </div>
        <div class="question-box">
            <div class="question-text">المهمة كانت: ${data.task}</div>
        </div>
        <div class="options-grid">
            ${data.players.map(p => `
                <button class="option-btn" onclick="voteFaker('${p.id}')">
                    <span style="font-size:2rem">${p.avatar}</span><br>
                    ${p.name}
                </button>
            `).join('')}
        </div>
    `;
    startTimer(data.timeLimit);
}

function voteFaker(playerId) {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    socket.emit('voteFaker', { code: currentRoom, suspectId: playerId });
    showToast('تم التصويت! 🗳️', 'success');
}

function handleFakinItResults(data) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="results-header">
            <h2>${data.caught ? '🎉 انكشف المزيّف!' : '😈 المزيّف نجا!'}</h2>
            <div style="font-size: 3rem; margin: 1rem 0;">${data.fakerAvatar}</div>
            <p style="font-size: 1.5rem; color: ${data.fakerColor}">${data.fakerName} كان المزيّف!</p>
        </div>
        <div class="results-list">
            ${data.voteResults.map(r => `
                <div class="result-item" style="${r.isFaker ? 'border: 2px solid #dc143c;' : ''}">
                    <div class="player-avatar">${r.playerAvatar}</div>
                    <div class="result-info">
                        <div class="result-name">${r.playerName} ${r.isFaker ? '🎭' : ''}</div>
                        <div class="result-answer">${r.votesReceived} أصوات ضده</div>
                    </div>
                </div>
            `).join('')}
        </div>
        ${!data.isLastRound && isHost ? '<button class="btn btn-primary submit-btn" onclick="requestNextRound()">التالي ➡️</button>' : ''}
    `;
}

// ═══════════════════════════════════════════════════════════════════
// ██████████████████████ Trivia Murder ██████████════════════════════
// ═══════════════════════════════════════════════════════════════════
function handleTriviaMurderQuestion(data) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="game-header">
            <div class="round-info">💀 السؤال ${data.round}/${data.maxRounds}</div>
            <div class="timer" id="game-timer">${data.timeLimit}</div>
        </div>
        <div class="question-box" style="background: rgba(139,0,0,0.4);">
            <div class="question-text">${data.question}</div>
        </div>
        <div class="options-grid">
            ${data.options.map((opt, i) => `
                <button class="option-btn" onclick="submitTriviaAnswer(${i})">${opt}</button>
            `).join('')}
        </div>
        <div class="info-bar">
            <span>⚠️ الإجابة الخاطئة = الموت!</span>
            <span>👥 أحياء: ${data.alivePlayers.length}</span>
        </div>
    `;
    startTimer(data.timeLimit);
}

function submitTriviaAnswer(index) {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    socket.emit('submitTriviaAnswer', { code: currentRoom, answerIndex: index });
    showToast('تم الاختيار! 🤞', 'info');
}

function handleTriviaMurderResults(data) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="results-header">
            <h2>💀 النتائج</h2>
            <p>الإجابة الصحيحة: <strong style="color:#00ff88">${data.correctAnswer}</strong></p>
        </div>
        ${data.newlyDead.length > 0 ? `
            <div class="death-announcement">
                <h3 style="color:#dc143c">☠️ ماتوا في هذه الجولة:</h3>
                <p>${data.newlyDead.map(d => d.name + ' ' + d.avatar).join(' • ')}</p>
            </div>
        ` : ''}
        <div class="results-list">
            ${data.results.filter(r => !r.wasAlreadyDead).map(r => `
                <div class="result-item" style="opacity: ${r.isAlive ? 1 : 0.5}">
                    <div class="player-avatar">${r.isAlive ? r.playerAvatar : '👻'}</div>
                    <div class="result-info">
                        <div class="result-name">${r.playerName}</div>
                        <div class="result-answer">${r.answer} ${r.isCorrect ? '✅' : '❌'}</div>
                    </div>
                    <div class="result-score">${r.isAlive ? '❤️' : '💀'}</div>
                </div>
            `).join('')}
        </div>
        <p style="text-align:center;margin-top:1rem">👥 أحياء: ${data.alivePlayers}</p>
        ${!data.isLastRound && isHost ? '<button class="btn btn-primary submit-btn" onclick="requestNextRound()">التالي ➡️</button>' : ''}
    `;
}

function handleDeathChallenge(data) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="game-header">
            <div class="round-info">⚰️ تحدي الموت!</div>
            <div class="timer" id="game-timer">${data.timeLimit}</div>
        </div>
        <div class="question-box" style="background: rgba(139,0,0,0.6);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">💀</div>
            <div class="question-text">${data.question}</div>
        </div>
        <input type="text" class="answer-input" id="death-answer" placeholder="اكتب الإجابة بسرعة!" autocomplete="off">
        <button class="btn btn-primary submit-btn" onclick="submitDeathChallenge()">
            نجّني! 🙏
        </button>
    `;
    startTimer(data.timeLimit, submitDeathChallenge);
    document.getElementById('death-answer').focus();
}

function submitDeathChallenge() {
    const input = document.getElementById('death-answer');
    const answer = input ? input.value.trim() : '';
    socket.emit('submitDeathChallenge', { code: currentRoom, answer });
    showWaitingScreen('هل نجوت؟ 😰');
    clearInterval(timerInterval);
}

function handleDeathChallengeStarted(data) {
    // إظهار للأحياء أن هناك تحدي موت
}

function handleDeathChallengeResults(data) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="results-header">
            <h2>⚰️ نتائج تحدي الموت</h2>
            <p>الإجابة الصحيحة: <strong>${data.correctAnswer}</strong></p>
        </div>
        ${data.survivors.length > 0 ? `
            <div style="text-align:center;margin:2rem 0">
                <h3 style="color:#00ff88">🎉 نجوا من الموت:</h3>
                <p style="font-size:1.5rem">${data.survivors.map(s => s.name + ' ' + s.avatar).join(' • ')}</p>
            </div>
        ` : '<p style="text-align:center;color:#dc143c">💀 لم ينجُ أحد!</p>'}
        ${isHost ? '<button class="btn btn-primary submit-btn" onclick="requestNextRound()">استمر ➡️</button>' : ''}
    `;
}

// ═══════════════════════════════════════════════════════════════════
// █████████████████████████ نهاية اللعبة ████████████████████████████
// ═══════════════════════════════════════════════════════════════════
function handleGameEnded(data) {
    showScreen('results-screen');
    const container = document.getElementById('results-container');
    
    container.innerHTML = `
        <div class="results-header">
            <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">🏆 انتهت اللعبة!</h1>
            <h2>${data.gameName}</h2>
        </div>
        <div class="winner-showcase">
            <div style="font-size: 5rem; margin: 1rem 0;">${data.winner.avatar}</div>
            <h2 style="color: ${data.winner.color}; font-size: 2rem;">${data.winner.name}</h2>
            <p style="font-size: 1.5rem; color: #C8A951;">${data.winner.score} نقطة</p>
        </div>
        <div class="results-list">
            ${data.finalResults.map(p => `
                <div class="result-item" style="border-right: 4px solid ${p.color}">
                    <div class="result-rank ${p.rank === 1 ? 'gold' : p.rank === 2 ? 'silver' : p.rank === 3 ? 'bronze' : ''}">${p.medal || p.rank}</div>
                    <div class="player-avatar">${p.avatar}</div>
                    <div class="result-info">
                        <div class="result-name">${p.name}</div>
                    </div>
                    <div class="result-score">${p.score}</div>
                </div>
            `).join('')}
        </div>
        <button class="btn btn-primary submit-btn" onclick="backToLobby()">
            الرجوع للوبي 🏠
        </button>
    `;
}

// ═══════════════════════════════════════════════════════════════════
// ████████████████████████ وظائف مساعدة █████████████████████████████
// ═══════════════════════════════════════════════════════════════════
function showWaitingScreen(message) {
    document.getElementById('game-container').innerHTML = `
        <div class="waiting-screen" style="text-align:center;padding:3rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">⏳</div>
            <h2>${message}</h2>
            <p style="margin-top: 1rem; opacity: 0.7;">منتظرين باقي اللاعبين...</p>
        </div>
    `;
}

function requestNextRound() {
    socket.emit('requestNextRound', currentRoom);
}

function backToLobby() {
    socket.emit('backToLobby', currentRoom);
}
