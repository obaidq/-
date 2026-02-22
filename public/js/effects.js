/**
 * ═══════════════════════════════════════════════════════════════
 * ABU ABED BOX - VISUAL EFFECTS ENGINE
 * Canvas-based particle system overlay for rich visual effects
 * Confetti, sparkles, fireworks, floating emojis, screen flash
 * ═══════════════════════════════════════════════════════════════
 */

class EffectsEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.running = false;
    this.rafId = null;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
  }

  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'effectsCanvas';
    this.canvas.style.cssText =
      'position:fixed;inset:0;z-index:9998;pointer-events:none;width:100%;height:100%;';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
    this.w = w;
    this.h = h;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  loop() {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, this.w, this.h);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      p.draw(this.ctx);
      if (p.dead) this.particles.splice(i, 1);
    }

    if (this.particles.length === 0) {
      this.stop();
      return;
    }

    this.rafId = requestAnimationFrame(() => this.loop());
  }

  // ─── CONFETTI BURST ───────────────────────────────────────
  // Rich confetti with shapes, rotation, physics, and colors
  confetti(options = {}) {
    if (this.reducedMotion) return;
    const {
      count = 80,
      x = this.w / 2,
      y = this.h * 0.3,
      spread = 360,
      colors = ['#FFD93D', '#FF6B9D', '#00E676', '#00D2D3', '#A55EEA', '#FF8C42', '#4facfe', '#D4AF37'],
      gravity = 0.12,
      shapes = ['rect', 'circle', 'star', 'triangle'],
    } = options;

    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180);
      const velocity = 4 + Math.random() * 8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const size = 4 + Math.random() * 8;
      const rotation = Math.random() * Math.PI * 2;
      const rotSpeed = (Math.random() - 0.5) * 0.15;

      this.particles.push(new ConfettiParticle({
        x, y, vx: Math.cos(angle) * velocity * (0.5 + Math.random()),
        vy: -Math.abs(Math.sin(angle) * velocity) - 2,
        color, shape, size, rotation, rotSpeed, gravity,
        life: 120 + Math.random() * 80,
        delay: Math.random() * 15,
      }));
    }
    this.start();
  }

  // ─── CELEBRATION (confetti from top) ──────────────────────
  celebration(options = {}) {
    if (this.reducedMotion) return;
    const { duration = 2000 } = options;
    const interval = setInterval(() => {
      this.confetti({
        count: 15,
        x: Math.random() * this.w,
        y: -20,
        spread: 60,
        gravity: 0.08,
      });
    }, 100);
    setTimeout(() => clearInterval(interval), duration);
  }

  // ─── SPARKLES ─────────────────────────────────────────────
  sparkles(options = {}) {
    if (this.reducedMotion) return;
    const {
      count = 30,
      x = this.w / 2,
      y = this.h / 2,
      radius = 100,
      colors = ['#FFD93D', '#fff', '#D4AF37', '#69F0AE'],
    } = options;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push(new SparkleParticle({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        size: 2 + Math.random() * 4,
        color,
        life: 30 + Math.random() * 40,
        delay: Math.random() * 20,
      }));
    }
    this.start();
  }

  // ─── FIREWORKS ────────────────────────────────────────────
  fireworks(options = {}) {
    if (this.reducedMotion) return;
    const { count = 3, colors } = options;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const fx = this.w * (0.2 + Math.random() * 0.6);
        const fy = this.h * (0.1 + Math.random() * 0.4);
        this.confetti({
          count: 50,
          x: fx,
          y: fy,
          spread: 360,
          gravity: 0.06,
          colors: colors || this._randomFireworkPalette(),
        });
        this.sparkles({ count: 20, x: fx, y: fy, radius: 60 });
      }, i * 400);
    }
  }

  // ─── SCORE POPUP ──────────────────────────────────────────
  scorePopup(options = {}) {
    if (this.reducedMotion) return;
    const {
      text = '+100',
      x = this.w / 2,
      y = this.h / 2,
      color = '#00E676',
      fontSize = 48,
    } = options;

    this.particles.push(new TextParticle({
      x, y, text, color, fontSize,
      vy: -2,
      life: 60,
    }));
    this.sparkles({ count: 8, x, y, radius: 30, colors: [color, '#fff'] });
    this.start();
  }

  // ─── SCREEN FLASH ─────────────────────────────────────────
  flash(options = {}) {
    if (this.reducedMotion) return;
    const { color = 'rgba(255,255,255,0.6)', duration = 300 } = options;
    const overlay = document.createElement('div');
    overlay.style.cssText =
      `position:fixed;inset:0;z-index:9999;background:${color};pointer-events:none;` +
      `transition:opacity ${duration}ms ease-out;opacity:1;`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '0'; });
    setTimeout(() => overlay.remove(), duration + 50);
  }

  // ─── EMOJI BURST ──────────────────────────────────────────
  emojiBurst(options = {}) {
    if (this.reducedMotion) return;
    const {
      emoji = '🎉',
      count = 12,
      x = this.w / 2,
      y = this.h / 2,
    } = options;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const velocity = 3 + Math.random() * 4;
      this.particles.push(new EmojiParticle({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 2,
        emoji,
        size: 24 + Math.random() * 16,
        life: 50 + Math.random() * 30,
        gravity: 0.08,
      }));
    }
    this.start();
  }

  // ─── AMBIENT PARTICLES ────────────────────────────────────
  // Floating particles for backgrounds (lobby, waiting screens)
  ambient(options = {}) {
    if (this.reducedMotion) return;
    const {
      count = 20,
      colors = ['rgba(0,230,118,0.15)', 'rgba(255,217,61,0.1)', 'rgba(0,210,211,0.1)'],
      duration = 10000,
    } = options;

    for (let i = 0; i < count; i++) {
      this.particles.push(new AmbientParticle({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        size: 4 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -0.1 - Math.random() * 0.3,
        life: 200 + Math.random() * 300,
      }));
    }
    this.start();

    if (duration > 0) {
      this._ambientTimer = setTimeout(() => this.stopAmbient(), duration);
    }
  }

  stopAmbient() {
    if (this._ambientTimer) clearTimeout(this._ambientTimer);
    this.particles = this.particles.filter(p => !(p instanceof AmbientParticle));
  }

  // ─── HELPERS ──────────────────────────────────────────────
  _randomFireworkPalette() {
    const palettes = [
      ['#FF6B9D', '#FFD93D', '#FF8C42'],
      ['#00E676', '#69F0AE', '#00D2D3'],
      ['#A55EEA', '#f093fb', '#4facfe'],
      ['#D4AF37', '#FFD93D', '#FF8C42'],
      ['#00D2D3', '#4facfe', '#667eea'],
    ];
    return palettes[Math.floor(Math.random() * palettes.length)];
  }

  clear() {
    this.particles = [];
    this.stop();
  }
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE CLASSES
// ═══════════════════════════════════════════════════════════════

class ConfettiParticle {
  constructor(opts) {
    Object.assign(this, opts);
    this.age = 0;
    this.dead = false;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.03 + Math.random() * 0.06;
  }

  update() {
    if (this.delay > 0) { this.delay--; return; }
    this.age++;
    this.vy += this.gravity;
    this.vx += Math.sin(this.wobble) * 0.02;
    this.wobble += this.wobbleSpeed;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.99;
    this.rotation += this.rotSpeed;
    if (this.age >= this.life) this.dead = true;
  }

  draw(ctx) {
    if (this.delay > 0) return;
    const alpha = Math.max(0, 1 - this.age / this.life);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;

    const s = this.size;
    switch (this.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'star':
        this._drawStar(ctx, 0, 0, 5, s / 2, s / 4);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -s / 2);
        ctx.lineTo(s / 2, s / 2);
        ctx.lineTo(-s / 2, s / 2);
        ctx.closePath();
        ctx.fill();
        break;
      default: // rect
        ctx.fillRect(-s / 2, -s / 4, s, s / 2);
    }
    ctx.restore();
  }

  _drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
    ctx.fill();
  }
}

class SparkleParticle {
  constructor(opts) {
    Object.assign(this, opts);
    this.age = 0;
    this.dead = false;
    this.phase = Math.random() * Math.PI * 2;
  }

  update() {
    if (this.delay > 0) { this.delay--; return; }
    this.age++;
    this.phase += 0.2;
    if (this.age >= this.life) this.dead = true;
  }

  draw(ctx) {
    if (this.delay > 0) return;
    const progress = this.age / this.life;
    const alpha = Math.sin(progress * Math.PI) * (0.6 + Math.sin(this.phase) * 0.4);
    const s = this.size * (1 - progress * 0.5);

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = this.color;
    ctx.translate(this.x, this.y);

    // 4-point star sparkle
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + this.phase * 0.3;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * s, Math.sin(angle) * s);
    }
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = this.color;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class TextParticle {
  constructor(opts) {
    Object.assign(this, opts);
    this.age = 0;
    this.dead = false;
  }

  update() {
    this.age++;
    this.y += this.vy;
    this.vy *= 0.97;
    if (this.age >= this.life) this.dead = true;
  }

  draw(ctx) {
    const progress = this.age / this.life;
    const alpha = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
    const scale = progress < 0.15 ? 0.5 + (progress / 0.15) * 0.8 : 1.3 - progress * 0.3;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(this.x, this.y);
    ctx.scale(scale, scale);
    ctx.font = `900 ${this.fontSize}px 'Bangers', 'Rubik', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(this.text, 2, 2);

    // Main text
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, 0, 0);

    ctx.restore();
  }
}

class EmojiParticle {
  constructor(opts) {
    Object.assign(this, opts);
    this.age = 0;
    this.dead = false;
    this.rotation = (Math.random() - 0.5) * 0.5;
    this.rotSpeed = (Math.random() - 0.5) * 0.08;
  }

  update() {
    this.age++;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.rotation += this.rotSpeed;
    if (this.age >= this.life) this.dead = true;
  }

  draw(ctx) {
    const alpha = Math.max(0, 1 - this.age / this.life);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.font = `${this.size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, 0, 0);
    ctx.restore();
  }
}

class AmbientParticle {
  constructor(opts) {
    Object.assign(this, opts);
    this.age = 0;
    this.dead = false;
    this.origSize = opts.size;
    this.phase = Math.random() * Math.PI * 2;
  }

  update() {
    this.age++;
    this.x += this.speedX;
    this.y += this.speedY;
    this.phase += 0.02;

    // Wrap around screen
    if (this.y < -this.origSize) this.y = window.innerHeight + this.origSize;
    if (this.x < -this.origSize) this.x = window.innerWidth + this.origSize;
    if (this.x > window.innerWidth + this.origSize) this.x = -this.origSize;

    if (this.age >= this.life) this.dead = true;
  }

  draw(ctx) {
    const breathe = 0.5 + Math.sin(this.phase) * 0.5;
    const fadeIn = Math.min(1, this.age / 30);
    const fadeOut = Math.max(0, 1 - (this.age - this.life + 30) / 30);
    const alpha = breathe * fadeIn * fadeOut;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.origSize * (0.8 + breathe * 0.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL INSTANCE
// ═══════════════════════════════════════════════════════════════
window.FX = new EffectsEngine();
