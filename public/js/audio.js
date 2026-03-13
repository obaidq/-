/**
 * Abu Abed Box - Audio System V1
 * Web Audio API-based procedural sound effects + music
 * No external audio files needed!
 */

const AudioEngine = {
  ctx: null,
  masterGain: null,
  musicGain: null,
  sfxGain: null,
  voGain: null,
  enabled: true,
  musicPlaying: false,
  currentMusic: null,
  volumes: { master: 0.7, music: 0.4, sfx: 0.8, vo: 0.9 },

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.voGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.voGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.loadVolumes();
      this.setVolumes();
      console.log('🔊 Audio engine initialized');
    } catch (e) {
      console.warn('Audio not supported:', e);
      this.enabled = false;
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  setVolumes() {
    if (!this.enabled) return;
    this.masterGain.gain.value = this.volumes.master;
    this.musicGain.gain.value = this.volumes.music;
    this.sfxGain.gain.value = this.volumes.sfx;
    this.voGain.gain.value = this.volumes.vo;
  },

  setVolume(type, val) {
    this.volumes[type] = Math.max(0, Math.min(1, val));
    this.setVolumes();
    this.saveVolumes();
  },

  // ─── Note helper ───
  playNote(freq, duration, type, gainNode, vol, delay) {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime + (delay || 0);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol || 0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(g);
      g.connect(gainNode || this.sfxGain);
      osc.start(t);
      osc.stop(t + duration);
    } catch (e) { /* تجاهل أخطاء الصوت */ }
  },

  playNoise(duration, gainNode, vol, delay) {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime + (delay || 0);
      const bufferSize = Math.min(this.ctx.sampleRate * duration, this.ctx.sampleRate * 5);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol || 0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + duration);
      src.connect(g);
      g.connect(gainNode || this.sfxGain);
      src.start(t);
    } catch (e) { /* تجاهل أخطاء الصوت */ }
  },

  // ═══ Sound Effects ═══

  // Join room / player joined
  playerJoin() {
    this.playNote(523, 0.15, 'sine', this.sfxGain, 0.3);
    this.playNote(659, 0.15, 'sine', this.sfxGain, 0.3, 0.1);
    this.playNote(784, 0.2, 'sine', this.sfxGain, 0.25, 0.2);
  },

  // Player left
  playerLeave() {
    this.playNote(400, 0.2, 'sine', this.sfxGain, 0.2);
    this.playNote(300, 0.3, 'sine', this.sfxGain, 0.15, 0.15);
  },

  // Button click
  click() {
    this.playNote(800, 0.08, 'square', this.sfxGain, 0.15);
  },

  // Submit answer
  submit() {
    this.playNote(600, 0.1, 'sine', this.sfxGain, 0.25);
    this.playNote(900, 0.15, 'sine', this.sfxGain, 0.2, 0.08);
  },

  // Correct answer
  correct() {
    this.playNote(523, 0.12, 'sine', this.sfxGain, 0.3);
    this.playNote(659, 0.12, 'sine', this.sfxGain, 0.3, 0.1);
    this.playNote(784, 0.12, 'sine', this.sfxGain, 0.3, 0.2);
    this.playNote(1047, 0.3, 'sine', this.sfxGain, 0.25, 0.3);
  },

  // Wrong answer
  wrong() {
    this.playNote(300, 0.15, 'sawtooth', this.sfxGain, 0.2);
    this.playNote(200, 0.3, 'sawtooth', this.sfxGain, 0.15, 0.12);
  },

  // Timer tick (last 10 seconds)
  tick() {
    this.playNote(1000, 0.05, 'square', this.sfxGain, 0.15);
  },

  // Timer warning (last 5 seconds)
  tickUrgent() {
    this.playNote(1200, 0.04, 'square', this.sfxGain, 0.2);
    this.playNote(1200, 0.04, 'square', this.sfxGain, 0.15, 0.06);
  },

  // Time's up!
  timesUp() {
    this.playNoise(0.3, this.sfxGain, 0.15);
    this.playNote(200, 0.4, 'sawtooth', this.sfxGain, 0.2);
  },

  // Countdown: 3, 2, 1
  countdownBeep() {
    this.playNote(880, 0.15, 'sine', this.sfxGain, 0.3);
  },

  // Countdown: GO!
  countdownGo() {
    this.playNote(1047, 0.1, 'sine', this.sfxGain, 0.4);
    this.playNote(1319, 0.1, 'sine', this.sfxGain, 0.35, 0.08);
    this.playNote(1568, 0.3, 'sine', this.sfxGain, 0.3, 0.16);
  },

  // Vote cast
  vote() {
    this.playNote(700, 0.08, 'triangle', this.sfxGain, 0.2);
    this.playNote(900, 0.1, 'triangle', this.sfxGain, 0.15, 0.06);
  },

  // Result reveal
  reveal() {
    const notes = [523, 587, 659, 784, 1047];
    notes.forEach((n, i) => {
      this.playNote(n, 0.15, 'sine', this.sfxGain, 0.2, i * 0.08);
    });
  },

  // Quiplash (unanimous)
  quiplash() {
    for (let i = 0; i < 6; i++) {
      this.playNote(400 + i * 200, 0.2, 'sine', this.sfxGain, 0.25, i * 0.06);
    }
    this.playNoise(0.1, this.sfxGain, 0.1, 0.4);
  },

  // Death (Trivia Murder)
  death() {
    this.playNote(400, 0.3, 'sawtooth', this.sfxGain, 0.2);
    this.playNote(300, 0.3, 'sawtooth', this.sfxGain, 0.18, 0.2);
    this.playNote(200, 0.5, 'sawtooth', this.sfxGain, 0.15, 0.4);
    this.playNoise(0.5, this.sfxGain, 0.08, 0.3);
  },

  // Revive from death
  revive() {
    this.playNote(300, 0.15, 'sine', this.sfxGain, 0.25);
    this.playNote(450, 0.15, 'sine', this.sfxGain, 0.25, 0.1);
    this.playNote(600, 0.15, 'sine', this.sfxGain, 0.25, 0.2);
    this.playNote(900, 0.3, 'sine', this.sfxGain, 0.2, 0.3);
  },

  // Faker caught!
  fakerCaught() {
    this.playNote(200, 0.1, 'square', this.sfxGain, 0.2);
    this.playNote(400, 0.1, 'square', this.sfxGain, 0.25, 0.1);
    this.playNote(800, 0.3, 'square', this.sfxGain, 0.2, 0.2);
  },

  // Faker escaped!
  fakerEscaped() {
    this.playNote(800, 0.2, 'triangle', this.sfxGain, 0.2);
    this.playNote(600, 0.2, 'triangle', this.sfxGain, 0.18, 0.15);
    this.playNote(400, 0.4, 'triangle', this.sfxGain, 0.15, 0.3);
  },

  // Fooled someone (Fibbage/Drawful)
  fooled() {
    this.playNote(500, 0.1, 'triangle', this.sfxGain, 0.2);
    this.playNote(700, 0.15, 'triangle', this.sfxGain, 0.2, 0.08);
  },

  // Points earned
  points(amount) {
    const count = Math.min(Math.ceil(amount / 200), 5);
    for (let i = 0; i < count; i++) {
      this.playNote(600 + i * 100, 0.08, 'sine', this.sfxGain, 0.15, i * 0.05);
    }
  },

  // Game start
  gameStart() {
    const melody = [523, 659, 784, 1047, 784, 1047, 1319];
    melody.forEach((n, i) => {
      this.playNote(n, 0.12, 'sine', this.sfxGain, 0.25, i * 0.1);
    });
  },

  // Victory fanfare
  victory() {
    const fanfare = [523, 523, 659, 784, 659, 784, 1047];
    const durations = [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.5];
    let t = 0;
    fanfare.forEach((n, i) => {
      this.playNote(n, durations[i], 'sine', this.sfxGain, 0.3, t);
      this.playNote(n * 0.5, durations[i], 'sine', this.sfxGain, 0.15, t);
      t += durations[i] * 0.7;
    });
  },

  // Drum roll (before reveal)
  drumRoll(duration) {
    const d = duration || 2;
    const steps = Math.floor(d * 20);
    for (let i = 0; i < steps; i++) {
      const vol = 0.05 + (i / steps) * 0.15;
      this.playNoise(0.04, this.sfxGain, vol, i * (d / steps));
    }
  },

  // Applause
  applause() {
    for (let i = 0; i < 30; i++) {
      const delay = Math.random() * 0.5;
      this.playNoise(0.03 + Math.random() * 0.05, this.sfxGain, 0.02 + Math.random() * 0.03, delay);
    }
    for (let i = 0; i < 20; i++) {
      const delay = 0.5 + Math.random() * 0.5;
      this.playNoise(0.03 + Math.random() * 0.05, this.sfxGain, 0.01 + Math.random() * 0.02, delay);
    }
  },

  // Emoji reaction pop
  emojiPop() {
    this.playNote(1200, 0.06, 'sine', this.sfxGain, 0.1);
  },

  // Achievement unlocked
  achievement() {
    this.playNote(784, 0.1, 'sine', this.sfxGain, 0.25);
    this.playNote(988, 0.1, 'sine', this.sfxGain, 0.25, 0.1);
    this.playNote(1175, 0.1, 'sine', this.sfxGain, 0.25, 0.2);
    this.playNote(1568, 0.3, 'sine', this.sfxGain, 0.2, 0.3);
    this.playNoise(0.08, this.sfxGain, 0.05, 0.35);
  },

  // Chat message
  chatMsg() {
    this.playNote(1100, 0.05, 'sine', this.sfxGain, 0.1);
  },

  // Speed round correct (fast ascending)
  speedCorrect() {
    for (let i = 0; i < 4; i++) {
      this.playNote(600 + i * 300, 0.08, 'sine', this.sfxGain, 0.2, i * 0.04);
    }
  },

  // Split perfect (50/50)
  splitPerfect() {
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((n, i) => {
      this.playNote(n, 0.12, 'sine', this.sfxGain, 0.2, i * 0.06);
    });
    this.playNoise(0.1, this.sfxGain, 0.08, 0.4);
  },

  // Debate gavel
  gavel() {
    this.playNoise(0.08, this.sfxGain, 0.2);
    this.playNote(150, 0.2, 'square', this.sfxGain, 0.15, 0.05);
  },

  // Sad trombone (for losers/zero points)
  sadTrombone() {
    const notes = [293, 277, 261, 196];
    notes.forEach((n, i) => {
      this.playNote(n, 0.4, 'sawtooth', this.sfxGain, 0.12, i * 0.35);
    });
  },

  // Suspense build
  suspense() {
    for (let i = 0; i < 8; i++) {
      this.playNote(200 + i * 30, 0.2, 'sine', this.sfxGain, 0.05 + i * 0.02, i * 0.2);
    }
  },

  // Boing (comic)
  boing() {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(1500, t + 0.05);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.15);
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {}
  },

  // Whoosh (transition)
  whoosh() {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(2000, t + 0.15);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch (e) { /* تجاهل أخطاء الصوت */ }
  },

  // ═══ Music Ducking ═══
  // Temporarily lower music volume during reveals/voice

  duck(duration) {
    if (!this.enabled || !this.ctx || !this.musicGain) return;
    try {
      const t = this.ctx.currentTime;
      const originalVol = this.volumes.music;
      this.musicGain.gain.setValueAtTime(originalVol, t);
      this.musicGain.gain.linearRampToValueAtTime(originalVol * 0.15, t + 0.2);
      this.musicGain.gain.setValueAtTime(originalVol * 0.15, t + (duration || 2) - 0.3);
      this.musicGain.gain.linearRampToValueAtTime(originalVol, t + (duration || 2));
    } catch (e) {}
  },

  // ═══ Per-Game Reveal Stings ═══

  revealSting(game) {
    if (!this.enabled || !this.ctx) return;
    this.duck(1.5);
    var stings = {
      quiplash:     [523, 659, 784, 1047, 1319],
      triviamurder: [220, 277, 330, 440, 554],
      fibbage:      [392, 494, 587, 784],
      guesspionage: [330, 392, 494, 659],
      fakinit:      [349, 440, 523, 659, 784],
      courtroom:    [261, 330, 392, 523],
      splittheroom: [311, 392, 494, 622],
    };
    var notes = stings[game] || [523, 659, 784, 1047];
    var self = this;
    notes.forEach(function(n, i) {
      self.playNote(n, 0.18, 'sine', self.sfxGain, 0.25, i * 0.07);
    });
    this.playNoise(0.08, this.sfxGain, 0.06, notes.length * 0.07);
  },

  // ═══ Volume Persistence ═══

  saveVolumes() {
    try {
      localStorage.setItem('abuabed_volumes', JSON.stringify(this.volumes));
    } catch (e) {}
  },

  loadVolumes() {
    try {
      var saved = localStorage.getItem('abuabed_volumes');
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          this.volumes = Object.assign(this.volumes, parsed);
          this.setVolumes();
        }
      }
    } catch (e) {}
  },

  // ═══ Background Music (procedural loops) ═══

  startMusic(theme) {
    this.stopMusic();
    if (!this.enabled || !this.ctx) return;
    this.musicPlaying = true;
    this._playMusicLoop(theme);
  },

  stopMusic() {
    this.musicPlaying = false;
    if (this.currentMusic) {
      try { this.currentMusic.stop(); } catch(e) {}
      this.currentMusic = null;
    }
    // مسح مؤقت الموسيقى لمنع التسريب
    if (this._musicTimeout) {
      clearTimeout(this._musicTimeout);
      this._musicTimeout = null;
    }
  },

  _playMusicLoop(theme) {
    if (!this.musicPlaying || !this.ctx) return;
    try {
      const bpm = theme === 'triviamurder' ? 100 : theme === 'quiplash' ? 130 : 120;
      const beatDur = 60 / bpm;
      const barDur = beatDur * 4;

      // Simple 4-bar chord progression per theme
      const chords = {
        hub: [[261, 329, 392], [293, 369, 440], [329, 415, 493], [261, 329, 392]],
        quiplash: [[349, 440, 523], [392, 493, 587], [329, 415, 523], [349, 440, 523]],
        guesspionage: [[261, 311, 392], [293, 349, 440], [261, 329, 415], [261, 311, 392]],
        fakinit: [[293, 349, 440], [261, 329, 415], [311, 392, 466], [293, 349, 440]],
        triviamurder: [[220, 261, 329], [196, 246, 293], [207, 261, 311], [220, 261, 329]],
        fibbage: [[277, 349, 415], [261, 329, 392], [293, 369, 440], [277, 349, 415]],
        drawful: [[329, 415, 493], [349, 440, 523], [293, 369, 440], [329, 415, 493]],
        tshirtwars: [[349, 440, 523], [329, 415, 493], [311, 392, 466], [349, 440, 523]],
        trynottolol: [[349, 440, 554], [392, 493, 622], [329, 415, 523], [349, 440, 554]],
        inventions: [[329, 415, 523], [349, 440, 554], [293, 369, 466], [329, 415, 523]],
        wouldyourather: [[349, 440, 523], [311, 392, 466], [329, 415, 493], [349, 440, 523]],
        whosaidit: [[261, 329, 415], [277, 349, 440], [293, 369, 466], [261, 329, 415]],
        speedround: [[349, 440, 554], [392, 493, 622], [349, 440, 554], [329, 415, 523]],
        backseatgamer: [[261, 329, 415], [293, 369, 466], [277, 349, 440], [261, 329, 415]],
        splittheroom: [[311, 392, 493], [293, 369, 466], [329, 415, 523], [311, 392, 493]],
        courtroom: [[261, 311, 392], [277, 349, 440], [246, 293, 369], [261, 311, 392]],
        debateme: [[261, 311, 392], [246, 293, 369], [261, 329, 415], [261, 311, 392]],
        punishmentwheel: [[220, 261, 329], [246, 293, 369], [207, 261, 311], [220, 261, 329]]
      };

      const prog = chords[theme] || chords.hub;
      const now = this.ctx.currentTime;

      prog.forEach((chord, bar) => {
        chord.forEach(freq => {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const startTime = now + bar * barDur;
          g.gain.setValueAtTime(0, startTime);
          g.gain.linearRampToValueAtTime(0.04, startTime + 0.1);
          g.gain.setValueAtTime(0.04, startTime + barDur - 0.1);
          g.gain.linearRampToValueAtTime(0, startTime + barDur);
          osc.connect(g);
          g.connect(this.musicGain);
          osc.start(startTime);
          osc.stop(startTime + barDur);
        });
      });

      // Loop
      const totalDur = prog.length * barDur;
      this._musicTimeout = setTimeout(() => {
        if (this.musicPlaying) this._playMusicLoop(theme);
      }, totalDur * 1000);
    } catch (e) { /* تجاهل أخطاء الموسيقى */ }
  }
};
