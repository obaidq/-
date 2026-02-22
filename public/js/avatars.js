/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║         نظام الشخصيات والأفاتارات - أبو عابد بوكس              ║
 * ║    Character Avatar System - Multi-Generator Integration         ║
 * ║  DiceBear • Animal Avatars • Pixel RPG • Notion • Custom SVG    ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 *
 * 8 Character Archetypes × Multiple Art Styles
 * Inspired by: DiceBear, BeanHeads, Kenney, CraftPix, itch.io
 */

const AvatarSystem = {

  // ═══════════════════════════════════════════════════════════════
  // DiceBear API Configuration
  // Base: https://api.dicebear.com/9.x/{style}/svg?seed={seed}
  // Styles: adventurer, pixel-art, bottts, avataaars, fun-emoji,
  //         notionists, thumbs, lorelei, big-smile, croodles
  // ═══════════════════════════════════════════════════════════════

  DICEBEAR_BASE: 'https://api.dicebear.com/9.x',

  // Available DiceBear styles for avatar generation
  DICEBEAR_STYLES: [
    'adventurer',        // Fantasy adventure characters (user's favorite!)
    'pixel-art',         // Retro 8-bit pixel art
    'bottts',            // Cute robot characters
    'avataaars',         // Cartoon human avatars
    'fun-emoji',         // Fun expressive emoji faces
    'notionists',        // Notion-style minimalist faces
    'thumbs',            // Thumbs-up style characters
    'lorelei',           // Elegant line-art portraits
    'big-smile',         // Big smiling cartoon faces
    'croodles',          // Hand-drawn doodle characters
    'micah',             // Modern illustrated avatars
    'open-peeps',        // Open Peeps illustration style
    'personas',          // Full-body character personas
    'adventurer-neutral' // Neutral adventure style
  ],

  // ═══════════════════════════════════════════════════════════════
  // 8 Character Archetypes (Jackbox-style)
  // Each has: name (AR), description, icon, preferred styles, seeds
  // ═══════════════════════════════════════════════════════════════

  ARCHETYPES: [
    {
      id: 'jokester',
      nameAr: 'المهرّج',
      nameEn: 'The Jokester',
      descAr: 'شخصية مضحكة وفكاهية - يحب النكت والضحك',
      icon: '🤡',
      color: '#FFD93D',
      styles: ['fun-emoji', 'croodles', 'bottts', 'big-smile'],
      seeds: ['Clown-King', 'Funny-Sultan', 'Comedy-Abed', 'Laugh-Master', 'Joke-Prince', 'Silly-Sheikh', 'Humor-Hero', 'Fun-Falcon']
    },
    {
      id: 'brainiac',
      nameAr: 'العبقري',
      nameEn: 'The Brainiac',
      descAr: 'ذكي ومثقف - يعرف كل شي ويحب التحديات',
      icon: '🧠',
      color: '#667eea',
      styles: ['pixel-art', 'avataaars', 'notionists', 'adventurer'],
      seeds: ['Smart-Sheikh', 'Brain-Sultan', 'Genius-Fahd', 'Scholar-Ali', 'Nerd-Hawk', 'Mind-Master', 'IQ-King', 'Think-Tank']
    },
    {
      id: 'detective',
      nameAr: 'المحقق',
      nameEn: 'The Detective',
      descAr: 'غامض وذكي - يكتشف الأسرار والمزيّفين',
      icon: '🕵️',
      color: '#4ECDC4',
      styles: ['adventurer', 'lorelei', 'notionists', 'personas'],
      seeds: ['Spy-Shadow', 'Detective-Dark', 'Mystery-Man', 'Secret-Agent', 'Shadow-Fox', 'Silent-Eye', 'Dark-Hawk', 'Ghost-Hunter']
    },
    {
      id: 'artist',
      nameAr: 'الفنان',
      nameEn: 'The Artist',
      descAr: 'مبدع وفنان - يرسم ويبدع بكل شي',
      icon: '🎨',
      color: '#f093fb',
      styles: ['adventurer', 'croodles', 'open-peeps', 'micah'],
      seeds: ['Paint-Wizard', 'Art-Sultan', 'Creative-Soul', 'Color-King', 'Brush-Master', 'Canvas-Prince', 'Draw-Hero', 'Pixel-Poet']
    },
    {
      id: 'monster',
      nameAr: 'الوحش',
      nameEn: 'The Monster',
      descAr: 'مخيف ومرعب - حفلة القاتل مكانه الطبيعي',
      icon: '👹',
      color: '#E91E8C',
      styles: ['bottts', 'fun-emoji', 'pixel-art', 'thumbs'],
      seeds: ['Dark-Beast', 'Night-Ghoul', 'Skull-King', 'Demon-Lord', 'Shadow-Creep', 'Blood-Moon', 'Death-Bringer', 'Fright-Night']
    },
    {
      id: 'gamer',
      nameAr: 'اللاعب',
      nameEn: 'The Gamer',
      descAr: 'قيمر محترف - يحب المنافسة والفوز',
      icon: '🎮',
      color: '#43e97b',
      styles: ['pixel-art', 'bottts', 'thumbs', 'big-smile'],
      seeds: ['Pro-Gamer', 'Victory-King', 'Speed-Runner', 'Pixel-Warrior', 'Game-Sultan', 'Score-Master', 'Level-Boss', 'Arena-Champion']
    },
    {
      id: 'retro',
      nameAr: 'الكلاسيكي',
      nameEn: 'The Retro Kid',
      descAr: 'ستايل قديم وكلاسيكي - يحب الأشياء الأصيلة',
      icon: '📼',
      color: '#FF6B35',
      styles: ['pixel-art', 'avataaars', 'notionists', 'lorelei'],
      seeds: ['Retro-Wave', 'Classic-Cool', 'Vintage-Vibe', 'Old-School', 'Neon-Night', 'Disco-King', '8-Bit-Hero', 'Arcade-Master']
    },
    {
      id: 'wildcard',
      nameAr: 'المفاجأة',
      nameEn: 'The Wildcard',
      descAr: 'مجنون وغير متوقع - ما تعرف وش يسوي!',
      icon: '🃏',
      color: '#fa709a',
      styles: ['fun-emoji', 'bottts', 'croodles', 'thumbs'],
      seeds: ['Wild-Card', 'Chaos-Agent', 'Random-Rex', 'Surprise-Sultan', 'Crazy-Falcon', 'Unpredictable', 'Joker-Wild', 'Madness-King']
    }
  ],

  // ═══════════════════════════════════════════════════════════════
  // Custom SVG Avatar Generator (Animal Avatars - client-side)
  // Inspired by animal-avatar-generator npm package
  // ═══════════════════════════════════════════════════════════════

  ANIMALS: [
    { name: 'falcon', nameAr: 'صقر', emoji: '🦅',
      color: '#8B6914', bodyColor: '#DAA520', eyeColor: '#000' },
    { name: 'camel', nameAr: 'جمل', emoji: '🐪',
      color: '#C4A35A', bodyColor: '#D4B56A', eyeColor: '#3E2723' },
    { name: 'fox', nameAr: 'ثعلب', emoji: '🦊',
      color: '#FF6B35', bodyColor: '#FF8C5A', eyeColor: '#000' },
    { name: 'cat', nameAr: 'قطة', emoji: '🐱',
      color: '#FF9800', bodyColor: '#FFB74D', eyeColor: '#4CAF50' },
    { name: 'wolf', nameAr: 'ذئب', emoji: '🐺',
      color: '#607D8B', bodyColor: '#90A4AE', eyeColor: '#FFC107' },
    { name: 'lion', nameAr: 'أسد', emoji: '🦁',
      color: '#E65100', bodyColor: '#FF9800', eyeColor: '#000' },
    { name: 'owl', nameAr: 'بومة', emoji: '🦉',
      color: '#5D4037', bodyColor: '#8D6E63', eyeColor: '#FFD600' },
    { name: 'panda', nameAr: 'باندا', emoji: '🐼',
      color: '#FAFAFA', bodyColor: '#212121', eyeColor: '#000' },
    { name: 'dragon', nameAr: 'تنين', emoji: '🐉',
      color: '#4CAF50', bodyColor: '#81C784', eyeColor: '#FF5722' },
    { name: 'phoenix', nameAr: 'عنقاء', emoji: '🔥',
      color: '#FF5722', bodyColor: '#FF9800', eyeColor: '#FDD835' },
    { name: 'shark', nameAr: 'قرش', emoji: '🦈',
      color: '#546E7A', bodyColor: '#78909C', eyeColor: '#000' },
    { name: 'bear', nameAr: 'دب', emoji: '🐻',
      color: '#795548', bodyColor: '#A1887F', eyeColor: '#000' }
  ],

  // ═══════════════════════════════════════════════════════════════
  // Pixel RPG Character Definitions (inspired by Pixel RPG Generator)
  // Custom SVG pixel characters with different classes
  // ═══════════════════════════════════════════════════════════════

  PIXEL_CLASSES: [
    { id: 'warrior', nameAr: 'محارب', icon: '⚔️',
      skinColor: '#FFCC99', armorColor: '#C0C0C0', hairColor: '#4A2800', weaponColor: '#B0B0B0' },
    { id: 'mage', nameAr: 'ساحر', icon: '🔮',
      skinColor: '#FFE0BD', armorColor: '#7B1FA2', hairColor: '#FFFFFF', weaponColor: '#CE93D8' },
    { id: 'archer', nameAr: 'رامي', icon: '🏹',
      skinColor: '#D4A574', armorColor: '#2E7D32', hairColor: '#5D4037', weaponColor: '#8D6E63' },
    { id: 'rogue', nameAr: 'لص', icon: '🗡️',
      skinColor: '#FFCC99', armorColor: '#37474F', hairColor: '#000000', weaponColor: '#455A64' },
    { id: 'healer', nameAr: 'معالج', icon: '💚',
      skinColor: '#FFE0BD', armorColor: '#FFFFFF', hairColor: '#FFD700', weaponColor: '#4FC3F7' },
    { id: 'necromancer', nameAr: 'ساحر ظلام', icon: '💀',
      skinColor: '#B0BEC5', armorColor: '#1A237E', hairColor: '#4A148C', weaponColor: '#7C4DFF' },
    { id: 'knight', nameAr: 'فارس', icon: '🛡️',
      skinColor: '#FFCC99', armorColor: '#FFD700', hairColor: '#3E2723', weaponColor: '#FFC107' },
    { id: 'assassin', nameAr: 'قاتل', icon: '🥷',
      skinColor: '#8D6E63', armorColor: '#212121', hairColor: '#212121', weaponColor: '#F44336' }
  ],

  // ═══════════════════════════════════════════════════════════════
  // Notion-style Silly Faces (inspired by faces.notion.com)
  // Parameters: s=skin, e=eyes, y=eyebrows, b=brows,
  //             n=nose, m=mouth, h=hair, a=accessories
  // ═══════════════════════════════════════════════════════════════

  NOTION_FACES: [
    { params: 's2e50y0b39n60m10h62a0', nameAr: 'الحالم' },
    { params: 's1e20y1b10n30m40h10a1', nameAr: 'المتفائل' },
    { params: 's3e10y2b20n40m20h30a0', nameAr: 'الخجول' },
    { params: 's0e40y0b50n10m50h50a2', nameAr: 'المغامر' },
    { params: 's4e30y1b40n50m30h40a0', nameAr: 'الهادئ' },
    { params: 's2e60y2b30n20m60h20a1', nameAr: 'المرح' },
    { params: 's1e0y0b60n0m0h0a0', nameAr: 'البسيط' },
    { params: 's3e50y1b0n60m50h60a2', nameAr: 'الغريب' }
  ],

  // ═══════════════════════════════════════════════════════════════
  // Avatar Category Tabs
  // ═══════════════════════════════════════════════════════════════

  CATEGORIES: [
    { id: 'archetypes', nameAr: 'الشخصيات', icon: '🎭', desc: 'شخصيات جاكبوكس' },
    { id: 'dicebear', nameAr: 'DiceBear', icon: '🎲', desc: 'أفاتارات متنوعة' },
    { id: 'animals', nameAr: 'حيوانات', icon: '🦊', desc: 'أفاتارات حيوانات' },
    { id: 'pixel', nameAr: 'بكسل RPG', icon: '⚔️', desc: 'شخصيات بكسل' },
    { id: 'notion', nameAr: 'وجوه مضحكة', icon: '😜', desc: 'ستايل نوشن' },
    { id: 'emoji', nameAr: 'إيموجي', icon: '😎', desc: 'إيموجي كلاسيك' }
  ],

  // Classic emoji avatars (original system)
  EMOJI_AVATARS: ['😎', '🤠', '🥳', '😈', '🤖', '👻', '🦊', '🐸', '🦁', '🐼', '🐯', '🦄', '🧔🏻', '👨‍🚀', '🧛', '🧟', '🤴', '👸', '🧙‍♂️', '🦸', '🥷', '🤺', '🧜‍♂️', '👽'],

  // ═══════════════════════════════════════════════════════════════
  // Per-Game Avatar Visual Identity
  // Each game transforms avatars with unique styles, filters,
  // and DiceBear preferences so they look 400% different
  // ═══════════════════════════════════════════════════════════════

  GAME_AVATAR_CONFIG: {
    quiplash: {
      label: 'رد سريع',
      dicebearStyle: 'croodles',         // Wobbly hand-drawn doodles
      cssClass: 'game-avatar--quiplash',
      svgFilter: 'url(#filter-sketch)',
      bgGradient: 'linear-gradient(135deg, #FFD93D 0%, #FF6B35 100%)',
      animation: 'avatar-wobble',
      borderStyle: '3px dashed rgba(255,217,61,0.6)',
      glowColor: 'rgba(255,217,61,0.4)'
    },
    guesspionage: {
      label: 'خمّن النسبة',
      dicebearStyle: 'shapes',           // Noir spy silhouettes
      cssClass: 'game-avatar--guesspionage',
      svgFilter: 'url(#filter-noir)',
      bgGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a3a2a 100%)',
      animation: 'avatar-scan',
      borderStyle: '2px solid rgba(0,255,65,0.4)',
      glowColor: 'rgba(0,255,65,0.5)'
    },
    fakinit: {
      label: 'المزيّف',
      dicebearStyle: 'fun-emoji',        // Colorful suspicious blobs
      cssClass: 'game-avatar--fakinit',
      svgFilter: 'none',
      bgGradient: 'linear-gradient(135deg, #E91E8C 0%, #FF6B35 100%)',
      animation: 'avatar-shifty',
      borderStyle: '3px solid rgba(233,30,140,0.5)',
      glowColor: 'rgba(233,30,140,0.4)'
    },
    triviamurder: {
      label: 'حفلة القاتل',
      dicebearStyle: 'bottts-neutral',   // Cute-creepy chibi
      cssClass: 'game-avatar--triviamurder',
      svgFilter: 'url(#filter-creepy)',
      bgGradient: 'linear-gradient(135deg, #1a0a2e 0%, #4a0e2e 100%)',
      animation: 'avatar-float',
      borderStyle: '2px solid rgba(155,89,182,0.5)',
      glowColor: 'rgba(155,89,182,0.6)'
    },
    fibbage: {
      label: 'كشف الكذاب',
      dicebearStyle: 'avataaars',        // Vintage theater masks
      cssClass: 'game-avatar--fibbage',
      svgFilter: 'url(#filter-vintage)',
      bgGradient: 'linear-gradient(135deg, #2c1810 0%, #4a2c20 100%)',
      animation: 'avatar-spotlight',
      borderStyle: '3px double rgba(255,215,0,0.6)',
      glowColor: 'rgba(255,215,0,0.4)'
    },
    drawful: {
      label: 'ارسم لي',
      dicebearStyle: 'lorelei',          // Crayon/paint-splattered
      cssClass: 'game-avatar--drawful',
      svgFilter: 'url(#filter-crayon)',
      bgGradient: 'linear-gradient(135deg, #f093fb 0%, #43e97b 100%)',
      animation: 'avatar-paint',
      borderStyle: '3px solid rgba(240,147,251,0.5)',
      glowColor: 'rgba(240,147,251,0.4)'
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════

  _selectedAvatar: null,
  _selectedCategory: 'archetypes',
  _pickerOpen: false,

  // ═══════════════════════════════════════════════════════════════
  // DiceBear URL Generator
  // ═══════════════════════════════════════════════════════════════

  getDiceBearUrl(style, seed, size) {
    const s = size || 128;
    const safeSeed = encodeURIComponent(seed || 'AbuAbed-' + Math.random().toString(36).slice(2));
    return `${this.DICEBEAR_BASE}/${style}/svg?seed=${safeSeed}&size=${s}&radius=50`;
  },

  getDiceBearPngUrl(style, seed, size) {
    const s = Math.min(size || 128, 256);
    const safeSeed = encodeURIComponent(seed || 'AbuAbed-' + Math.random().toString(36).slice(2));
    return `${this.DICEBEAR_BASE}/${style}/png?seed=${safeSeed}&size=${s}&radius=50`;
  },

  // ═══════════════════════════════════════════════════════════════
  // Custom SVG Animal Avatar Generator
  // (Client-side, inspired by animal-avatar-generator npm)
  // ═══════════════════════════════════════════════════════════════

  generateAnimalSvg(animal, size) {
    const s = size || 128;
    const a = animal || this.ANIMALS[0];
    const half = s / 2;
    const r = s * 0.35;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
      <defs>
        <radialGradient id="ag_${a.name}" cx="40%" cy="35%">
          <stop offset="0%" stop-color="${this._lighten(a.color, 30)}"/>
          <stop offset="100%" stop-color="${a.color}"/>
        </radialGradient>
      </defs>
      <!-- Background circle -->
      <circle cx="${half}" cy="${half}" r="${half}" fill="${a.bodyColor}" opacity="0.2"/>
      <!-- Head -->
      <circle cx="${half}" cy="${half}" r="${r}" fill="url(#ag_${a.name})" stroke="${this._darken(a.color, 20)}" stroke-width="2"/>
      <!-- Ears -->
      <ellipse cx="${half - r * 0.65}" cy="${half - r * 0.65}" rx="${r * 0.3}" ry="${r * 0.4}" fill="${a.color}" transform="rotate(-20 ${half - r * 0.65} ${half - r * 0.65})"/>
      <ellipse cx="${half + r * 0.65}" cy="${half - r * 0.65}" rx="${r * 0.3}" ry="${r * 0.4}" fill="${a.color}" transform="rotate(20 ${half + r * 0.65} ${half - r * 0.65})"/>
      <!-- Inner ears -->
      <ellipse cx="${half - r * 0.65}" cy="${half - r * 0.65}" rx="${r * 0.15}" ry="${r * 0.25}" fill="${this._lighten(a.color, 40)}" transform="rotate(-20 ${half - r * 0.65} ${half - r * 0.65})"/>
      <ellipse cx="${half + r * 0.65}" cy="${half - r * 0.65}" rx="${r * 0.15}" ry="${r * 0.25}" fill="${this._lighten(a.color, 40)}" transform="rotate(20 ${half + r * 0.65} ${half - r * 0.65})"/>
      <!-- Eyes -->
      <ellipse cx="${half - r * 0.28}" cy="${half - r * 0.1}" rx="${r * 0.14}" ry="${r * 0.17}" fill="white"/>
      <ellipse cx="${half + r * 0.28}" cy="${half - r * 0.1}" rx="${r * 0.14}" ry="${r * 0.17}" fill="white"/>
      <circle cx="${half - r * 0.25}" cy="${half - r * 0.08}" r="${r * 0.08}" fill="${a.eyeColor}"/>
      <circle cx="${half + r * 0.31}" cy="${half - r * 0.08}" r="${r * 0.08}" fill="${a.eyeColor}"/>
      <!-- Eye shine -->
      <circle cx="${half - r * 0.22}" cy="${half - r * 0.14}" r="${r * 0.03}" fill="white"/>
      <circle cx="${half + r * 0.34}" cy="${half - r * 0.14}" r="${r * 0.03}" fill="white"/>
      <!-- Nose -->
      <ellipse cx="${half}" cy="${half + r * 0.12}" rx="${r * 0.12}" ry="${r * 0.08}" fill="${this._darken(a.color, 30)}"/>
      <!-- Mouth -->
      <path d="M ${half - r * 0.15} ${half + r * 0.25} Q ${half} ${half + r * 0.4} ${half + r * 0.15} ${half + r * 0.25}" fill="none" stroke="${this._darken(a.color, 30)}" stroke-width="2" stroke-linecap="round"/>
      <!-- Whiskers (for cat/fox types) -->
      ${['fox', 'cat', 'wolf'].includes(a.name) ? `
        <line x1="${half - r * 0.8}" y1="${half + r * 0.05}" x2="${half - r * 0.35}" y2="${half + r * 0.15}" stroke="${this._darken(a.color, 15)}" stroke-width="1.5"/>
        <line x1="${half - r * 0.85}" y1="${half + r * 0.2}" x2="${half - r * 0.35}" y2="${half + r * 0.2}" stroke="${this._darken(a.color, 15)}" stroke-width="1.5"/>
        <line x1="${half + r * 0.8}" y1="${half + r * 0.05}" x2="${half + r * 0.35}" y2="${half + r * 0.15}" stroke="${this._darken(a.color, 15)}" stroke-width="1.5"/>
        <line x1="${half + r * 0.85}" y1="${half + r * 0.2}" x2="${half + r * 0.35}" y2="${half + r * 0.2}" stroke="${this._darken(a.color, 15)}" stroke-width="1.5"/>
      ` : ''}
    </svg>`;
  },

  // ═══════════════════════════════════════════════════════════════
  // Pixel RPG Character SVG Generator
  // (Inspired by Pixel-RPG-Character-Generator, Kenney, CraftPix)
  // ═══════════════════════════════════════════════════════════════

  generatePixelRpgSvg(charClass, size) {
    const s = size || 128;
    const c = charClass || this.PIXEL_CLASSES[0];
    const px = s / 16; // pixel unit

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" shape-rendering="crispEdges">
      <!-- Background -->
      <rect width="16" height="16" fill="transparent"/>

      <!-- Hair/Helmet -->
      <rect x="5" y="1" width="6" height="2" fill="${c.hairColor}"/>
      <rect x="4" y="2" width="8" height="1" fill="${c.hairColor}"/>

      <!-- Head -->
      <rect x="5" y="3" width="6" height="4" fill="${c.skinColor}"/>

      <!-- Eyes -->
      <rect x="6" y="4" width="1" height="1" fill="#000"/>
      <rect x="9" y="4" width="1" height="1" fill="#000"/>

      <!-- Mouth -->
      <rect x="7" y="6" width="2" height="1" fill="${this._darken(c.skinColor, 20)}"/>

      <!-- Body/Armor -->
      <rect x="4" y="7" width="8" height="5" fill="${c.armorColor}"/>
      <rect x="5" y="7" width="6" height="1" fill="${this._lighten(c.armorColor, 15)}"/>

      <!-- Belt -->
      <rect x="5" y="10" width="6" height="1" fill="${this._darken(c.armorColor, 30)}"/>
      <rect x="7" y="10" width="2" height="1" fill="${c.weaponColor}"/>

      <!-- Arms -->
      <rect x="3" y="8" width="1" height="3" fill="${c.skinColor}"/>
      <rect x="12" y="8" width="1" height="3" fill="${c.skinColor}"/>

      <!-- Weapon hand -->
      <rect x="2" y="7" width="1" height="4" fill="${c.weaponColor}"/>

      <!-- Legs -->
      <rect x="5" y="12" width="2" height="2" fill="${this._darken(c.armorColor, 15)}"/>
      <rect x="9" y="12" width="2" height="2" fill="${this._darken(c.armorColor, 15)}"/>

      <!-- Boots -->
      <rect x="4" y="14" width="3" height="2" fill="${this._darken(c.armorColor, 40)}"/>
      <rect x="9" y="14" width="3" height="2" fill="${this._darken(c.armorColor, 40)}"/>
    </svg>`;
  },

  // ═══════════════════════════════════════════════════════════════
  // Notion-style Silly Face SVG Generator
  // (Inspired by faces.notion.com & DiceBear notionists)
  // ═══════════════════════════════════════════════════════════════

  generateNotionFaceSvg(faceIndex, size) {
    const s = size || 128;
    const face = this.NOTION_FACES[faceIndex % this.NOTION_FACES.length];
    const half = s / 2;
    const r = s * 0.38;

    // Parse simple params for variety
    const skinTones = ['#FFDAB9', '#FFE4C4', '#D2B48C', '#F5DEB3', '#DEB887'];
    const eyeStyles = [
      // Normal eyes
      { rx: 4, ry: 5 },
      // Big eyes
      { rx: 6, ry: 7 },
      // Tiny eyes
      { rx: 3, ry: 3 },
      // Wide eyes
      { rx: 7, ry: 5 },
      // Sleepy eyes
      { rx: 5, ry: 2 }
    ];
    const mouthStyles = [
      `M ${half - 10} ${half + r * 0.35} Q ${half} ${half + r * 0.55} ${half + 10} ${half + r * 0.35}`, // smile
      `M ${half - 8} ${half + r * 0.4} L ${half + 8} ${half + r * 0.4}`, // straight
      `M ${half - 12} ${half + r * 0.3} Q ${half} ${half + r * 0.6} ${half + 12} ${half + r * 0.3}`, // big smile
      `M ${half - 6} ${half + r * 0.35} Q ${half} ${half + r * 0.25} ${half + 6} ${half + r * 0.35}`, // frown
      `M ${half} ${half + r * 0.3} m -5 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0`, // O mouth
      `M ${half - 10} ${half + r * 0.38} Q ${half - 3} ${half + r * 0.55} ${half + 4} ${half + r * 0.32} Q ${half + 10} ${half + r * 0.25} ${half + 12} ${half + r * 0.35}` // wavy
    ];

    const skinIdx = faceIndex % skinTones.length;
    const eyeIdx = faceIndex % eyeStyles.length;
    const mouthIdx = faceIndex % mouthStyles.length;
    const eye = eyeStyles[eyeIdx];

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
      <!-- Head -->
      <circle cx="${half}" cy="${half}" r="${r}" fill="${skinTones[skinIdx]}" stroke="#333" stroke-width="2"/>
      <!-- Eyes -->
      <ellipse cx="${half - r * 0.28}" cy="${half - r * 0.1}" rx="${eye.rx}" ry="${eye.ry}" fill="#333"/>
      <ellipse cx="${half + r * 0.28}" cy="${half - r * 0.1}" rx="${eye.rx}" ry="${eye.ry}" fill="#333"/>
      <!-- Eye highlights -->
      <circle cx="${half - r * 0.25}" cy="${half - r * 0.15}" r="2" fill="white" opacity="0.8"/>
      <circle cx="${half + r * 0.31}" cy="${half - r * 0.15}" r="2" fill="white" opacity="0.8"/>
      <!-- Eyebrows -->
      <line x1="${half - r * 0.38}" y1="${half - r * 0.3}" x2="${half - r * 0.15}" y2="${half - r * 0.28 - (faceIndex % 3) * 3}" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="${half + r * 0.15}" y1="${half - r * 0.28 - (faceIndex % 3) * 3}" x2="${half + r * 0.38}" y2="${half - r * 0.3}" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Nose -->
      <path d="M ${half} ${half + r * 0.05} Q ${half + 4} ${half + r * 0.18} ${half} ${half + r * 0.2}" fill="none" stroke="#666" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Mouth -->
      <path d="${mouthStyles[mouthIdx]}" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Cheek blush -->
      <circle cx="${half - r * 0.45}" cy="${half + r * 0.1}" r="${r * 0.1}" fill="#FFB6C1" opacity="0.5"/>
      <circle cx="${half + r * 0.45}" cy="${half + r * 0.1}" r="${r * 0.1}" fill="#FFB6C1" opacity="0.5"/>
    </svg>`;
  },

  // ═══════════════════════════════════════════════════════════════
  // Color Utility Functions
  // ═══════════════════════════════════════════════════════════════

  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  },

  _rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  _lighten(hex, percent) {
    const rgb = this._hexToRgb(hex);
    const amount = percent / 100;
    return this._rgbToHex(
      rgb.r + (255 - rgb.r) * amount,
      rgb.g + (255 - rgb.g) * amount,
      rgb.b + (255 - rgb.b) * amount
    );
  },

  _darken(hex, percent) {
    const rgb = this._hexToRgb(hex);
    const amount = 1 - percent / 100;
    return this._rgbToHex(rgb.r * amount, rgb.g * amount, rgb.b * amount);
  },

  // ═══════════════════════════════════════════════════════════════
  // Avatar Picker UI
  // ═══════════════════════════════════════════════════════════════

  openPicker(callback) {
    this._pickerCallback = callback;
    this._pickerOpen = true;
    this._selectedCategory = 'archetypes';

    const modal = document.getElementById('avatarPickerModal');
    if (modal) {
      modal.classList.remove('hidden');
      this._renderPickerContent();
      return;
    }

    // Create modal
    const m = document.createElement('div');
    m.id = 'avatarPickerModal';
    m.className = 'avatar-picker-modal';
    m.innerHTML = `
      <div class="avatar-picker-backdrop" onclick="AvatarSystem.closePicker()"></div>
      <div class="avatar-picker">
        <div class="avatar-picker__header">
          <h2 class="avatar-picker__title">🎭 اختر شخصيتك</h2>
          <button class="btn btn--ghost btn--sm" onclick="AvatarSystem.closePicker()">✕</button>
        </div>
        <div class="avatar-picker__tabs" id="avatarTabs"></div>
        <div class="avatar-picker__preview" id="avatarPreview">
          <div class="avatar-preview__image" id="avatarPreviewImg"></div>
          <div class="avatar-preview__info" id="avatarPreviewInfo"></div>
        </div>
        <div class="avatar-picker__grid" id="avatarGrid"></div>
        <div class="avatar-picker__actions">
          <button class="btn btn--primary btn--lg" onclick="AvatarSystem.confirmSelection()">✅ اختر هالشخصية!</button>
          <button class="btn btn--ghost" onclick="AvatarSystem.randomAvatar()">🎲 عشوائي</button>
        </div>
        <div class="avatar-picker__credits" id="avatarCredits">
          <p>🎨 مصادر الأفاتارات:</p>
          <div class="credits-links">
            <a href="https://www.dicebear.com/" target="_blank">DiceBear</a>
            <a href="https://beanheads.robertbroersma.com/" target="_blank">BeanHeads</a>
            <a href="https://kenney.nl/assets" target="_blank">Kenney Assets</a>
            <a href="https://craftpix.net/" target="_blank">CraftPix</a>
            <a href="https://itch.io/game-assets" target="_blank">itch.io Assets</a>
            <a href="https://www.npmjs.com/package/animal-avatar-generator" target="_blank">Animal Avatars</a>
            <a href="https://faces.notion.com/" target="_blank">Notion Faces</a>
            <a href="https://avatarmaker.com/" target="_blank">AvatarMaker</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(m);
    this._renderPickerContent();
  },

  closePicker() {
    this._pickerOpen = false;
    const modal = document.getElementById('avatarPickerModal');
    if (modal) modal.classList.add('hidden');
  },

  _renderPickerContent() {
    this._renderTabs();
    this._renderGrid();
  },

  _renderTabs() {
    const tabsEl = document.getElementById('avatarTabs');
    if (!tabsEl) return;
    tabsEl.innerHTML = this.CATEGORIES.map(cat =>
      `<button class="avatar-tab ${this._selectedCategory === cat.id ? 'avatar-tab--active' : ''}"
              onclick="AvatarSystem.switchCategory('${cat.id}')">
        <span class="avatar-tab__icon">${cat.icon}</span>
        <span class="avatar-tab__name">${cat.nameAr}</span>
      </button>`
    ).join('');
  },

  switchCategory(catId) {
    this._selectedCategory = catId;
    this._renderPickerContent();
  },

  _renderGrid() {
    const gridEl = document.getElementById('avatarGrid');
    if (!gridEl) return;

    let html = '';

    switch (this._selectedCategory) {
      case 'archetypes':
        html = this._renderArchetypes();
        break;
      case 'dicebear':
        html = this._renderDiceBear();
        break;
      case 'animals':
        html = this._renderAnimals();
        break;
      case 'pixel':
        html = this._renderPixelRpg();
        break;
      case 'notion':
        html = this._renderNotionFaces();
        break;
      case 'emoji':
        html = this._renderEmoji();
        break;
    }

    gridEl.innerHTML = html;
  },

  // ═══════════════════════════════════════════════════════════════
  // Render Functions for Each Category
  // ═══════════════════════════════════════════════════════════════

  _renderArchetypes() {
    return '<div class="avatar-grid avatar-grid--archetypes">' +
      this.ARCHETYPES.map((arch, i) => {
        const style = arch.styles[0];
        const seed = arch.seeds[0];
        const url = this.getDiceBearUrl(style, seed, 128);
        return `<div class="avatar-option avatar-option--archetype"
                    onclick="AvatarSystem.selectArchetype(${i})"
                    data-archetype="${arch.id}">
          <div class="avatar-option__img" style="background:${arch.color}">
            <img src="${url}" alt="${arch.nameAr}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'avatar-fallback\\'>${arch.icon}</span>'"/>
          </div>
          <div class="avatar-option__info">
            <span class="avatar-option__name">${arch.nameAr}</span>
            <span class="avatar-option__desc">${arch.descAr}</span>
          </div>
          <span class="avatar-option__icon">${arch.icon}</span>
        </div>`;
      }).join('') +
    '</div>';
  },

  _renderDiceBear() {
    const seeds = ['AbuAbed', 'Sultan', 'Falcon', 'Desert', 'Riyadh', 'Jeddah', 'Coffee', 'Stars'];
    return '<div class="avatar-grid avatar-grid--dicebear">' +
      this.DICEBEAR_STYLES.slice(0, 10).map(style =>
        '<div class="avatar-style-section">' +
          '<h4 class="avatar-style-title">' + style + '</h4>' +
          '<div class="avatar-style-row">' +
          seeds.map(seed => {
            const url = this.getDiceBearUrl(style, seed, 96);
            return `<div class="avatar-option avatar-option--small"
                        onclick="AvatarSystem.selectDiceBear('${style}', '${seed}')">
              <img src="${url}" alt="${style} ${seed}" loading="lazy"
                   onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2260%22>🎲</text></svg>'"/>
              <span class="avatar-option__seed">${seed}</span>
            </div>`;
          }).join('') +
          '</div>' +
        '</div>'
      ).join('') +
    '</div>';
  },

  _renderAnimals() {
    return '<div class="avatar-grid avatar-grid--animals">' +
      this.ANIMALS.map((animal, i) => {
        const svg = this.generateAnimalSvg(animal, 96);
        const encoded = 'data:image/svg+xml,' + encodeURIComponent(svg);
        return `<div class="avatar-option avatar-option--animal"
                    onclick="AvatarSystem.selectAnimal(${i})">
          <div class="avatar-option__img">
            <img src="${encoded}" alt="${animal.nameAr}"/>
          </div>
          <span class="avatar-option__name">${animal.emoji} ${animal.nameAr}</span>
        </div>`;
      }).join('') +
    '</div>';
  },

  _renderPixelRpg() {
    return '<div class="avatar-grid avatar-grid--pixel">' +
      this.PIXEL_CLASSES.map((cls, i) => {
        const svg = this.generatePixelRpgSvg(cls, 96);
        const encoded = 'data:image/svg+xml,' + encodeURIComponent(svg);
        return `<div class="avatar-option avatar-option--pixel"
                    onclick="AvatarSystem.selectPixel(${i})">
          <div class="avatar-option__img" style="background:#1a1a2e;image-rendering:pixelated">
            <img src="${encoded}" alt="${cls.nameAr}" style="image-rendering:pixelated"/>
          </div>
          <span class="avatar-option__name">${cls.icon} ${cls.nameAr}</span>
        </div>`;
      }).join('') +
    '</div>';
  },

  _renderNotionFaces() {
    return '<div class="avatar-grid avatar-grid--notion">' +
      this.NOTION_FACES.map((face, i) => {
        const svg = this.generateNotionFaceSvg(i, 96);
        const encoded = 'data:image/svg+xml,' + encodeURIComponent(svg);
        return `<div class="avatar-option avatar-option--notion"
                    onclick="AvatarSystem.selectNotion(${i})">
          <div class="avatar-option__img" style="background:#FFFDE7">
            <img src="${encoded}" alt="${face.nameAr}"/>
          </div>
          <span class="avatar-option__name">😜 ${face.nameAr}</span>
        </div>`;
      }).join('') +
      // Also show DiceBear notionists style
      '<h4 class="avatar-style-title mt-4">ستايل Notionists من DiceBear</h4>' +
      '<div class="avatar-style-row">' +
      ['Happy', 'Silly', 'Cool', 'Dreamy', 'Wild', 'Smart', 'Brave', 'Kind'].map(seed => {
        const url = this.getDiceBearUrl('notionists', seed, 96);
        return `<div class="avatar-option avatar-option--small"
                    onclick="AvatarSystem.selectDiceBear('notionists', '${seed}')">
          <img src="${url}" alt="Notionist ${seed}" loading="lazy"/>
          <span class="avatar-option__seed">${seed}</span>
        </div>`;
      }).join('') +
      '</div>' +
    '</div>';
  },

  _renderEmoji() {
    return '<div class="avatar-grid avatar-grid--emoji">' +
      this.EMOJI_AVATARS.map(emoji =>
        `<div class="avatar-option avatar-option--emoji"
              onclick="AvatarSystem.selectEmoji('${emoji}')">
          <span class="avatar-emoji-large">${emoji}</span>
        </div>`
      ).join('') +
    '</div>';
  },

  // ═══════════════════════════════════════════════════════════════
  // Selection Handlers
  // ═══════════════════════════════════════════════════════════════

  selectArchetype(index) {
    const arch = this.ARCHETYPES[index];
    const styleIdx = Math.floor(Math.random() * arch.styles.length);
    const seedIdx = Math.floor(Math.random() * arch.seeds.length);
    this._selectedAvatar = {
      type: 'dicebear',
      style: arch.styles[styleIdx],
      seed: arch.seeds[seedIdx],
      archetype: arch.id,
      color: arch.color,
      icon: arch.icon,
      nameAr: arch.nameAr,
      url: this.getDiceBearUrl(arch.styles[styleIdx], arch.seeds[seedIdx], 128)
    };
    this._updatePreview();
    this._highlightSelected(`[data-archetype="${arch.id}"]`);
  },

  selectDiceBear(style, seed) {
    this._selectedAvatar = {
      type: 'dicebear',
      style: style,
      seed: seed,
      color: '#667eea',
      icon: '🎲',
      nameAr: style,
      url: this.getDiceBearUrl(style, seed, 128)
    };
    this._updatePreview();
  },

  selectAnimal(index) {
    const animal = this.ANIMALS[index];
    this._selectedAvatar = {
      type: 'animal',
      animalIndex: index,
      color: animal.color,
      icon: animal.emoji,
      nameAr: animal.nameAr,
      svg: this.generateAnimalSvg(animal, 128)
    };
    this._updatePreview();
  },

  selectPixel(index) {
    const cls = this.PIXEL_CLASSES[index];
    this._selectedAvatar = {
      type: 'pixel',
      classIndex: index,
      color: cls.armorColor,
      icon: cls.icon,
      nameAr: cls.nameAr,
      svg: this.generatePixelRpgSvg(cls, 128)
    };
    this._updatePreview();
  },

  selectNotion(index) {
    const face = this.NOTION_FACES[index];
    this._selectedAvatar = {
      type: 'notion',
      faceIndex: index,
      color: '#FFFDE7',
      icon: '😜',
      nameAr: face.nameAr,
      svg: this.generateNotionFaceSvg(index, 128)
    };
    this._updatePreview();
  },

  selectEmoji(emoji) {
    this._selectedAvatar = {
      type: 'emoji',
      emoji: emoji,
      color: '#4ECDC4',
      icon: emoji,
      nameAr: 'إيموجي'
    };
    this._updatePreview();
  },

  randomAvatar() {
    const categories = ['archetypes', 'dicebear', 'animals', 'pixel', 'notion', 'emoji'];
    const cat = categories[Math.floor(Math.random() * categories.length)];

    switch (cat) {
      case 'archetypes':
        this.selectArchetype(Math.floor(Math.random() * this.ARCHETYPES.length));
        break;
      case 'dicebear': {
        const style = this.DICEBEAR_STYLES[Math.floor(Math.random() * this.DICEBEAR_STYLES.length)];
        const seed = 'Random-' + Math.random().toString(36).slice(2, 8);
        this.selectDiceBear(style, seed);
        break;
      }
      case 'animals':
        this.selectAnimal(Math.floor(Math.random() * this.ANIMALS.length));
        break;
      case 'pixel':
        this.selectPixel(Math.floor(Math.random() * this.PIXEL_CLASSES.length));
        break;
      case 'notion':
        this.selectNotion(Math.floor(Math.random() * this.NOTION_FACES.length));
        break;
      case 'emoji':
        this.selectEmoji(this.EMOJI_AVATARS[Math.floor(Math.random() * this.EMOJI_AVATARS.length)]);
        break;
    }
  },

  _updatePreview() {
    const imgEl = document.getElementById('avatarPreviewImg');
    const infoEl = document.getElementById('avatarPreviewInfo');
    if (!imgEl || !infoEl || !this._selectedAvatar) return;

    const av = this._selectedAvatar;

    if (av.type === 'emoji') {
      imgEl.innerHTML = `<span class="avatar-preview-emoji">${av.emoji}</span>`;
    } else if (av.url) {
      imgEl.innerHTML = `<img src="${av.url}" alt="${av.nameAr}" class="avatar-preview-image"/>`;
    } else if (av.svg) {
      imgEl.innerHTML = av.svg;
    }

    infoEl.innerHTML = `
      <span class="avatar-preview__name">${av.icon} ${av.nameAr}</span>
      <span class="avatar-preview__type">${av.type === 'dicebear' ? 'DiceBear ' + av.style : av.type === 'animal' ? 'حيوان' : av.type === 'pixel' ? 'بكسل RPG' : av.type === 'notion' ? 'وجه مضحك' : 'إيموجي'}</span>
    `;
  },

  _highlightSelected(selector) {
    document.querySelectorAll('.avatar-option--selected').forEach(el => el.classList.remove('avatar-option--selected'));
    const el = document.querySelector(selector);
    if (el) el.classList.add('avatar-option--selected');
  },

  confirmSelection() {
    if (!this._selectedAvatar) {
      this.randomAvatar();
    }
    if (this._pickerCallback) {
      this._pickerCallback(this._selectedAvatar);
    }
    this.closePicker();
  },

  // ═══════════════════════════════════════════════════════════════
  // Get Avatar HTML for rendering in lobby/game
  // ═══════════════════════════════════════════════════════════════

  getAvatarHtml(avatarData, size) {
    const s = size || 64;
    if (!avatarData) return `<span style="font-size:${s * 0.6}px">😎</span>`;

    // Legacy emoji avatar
    if (typeof avatarData === 'string') {
      return `<span style="font-size:${s * 0.6}px">${avatarData}</span>`;
    }

    switch (avatarData.type) {
      case 'dicebear': {
        const url = this.getDiceBearUrl(avatarData.style, avatarData.seed, s);
        return `<img src="${url}" alt="${avatarData.nameAr || ''}" width="${s}" height="${s}" style="border-radius:50%" loading="lazy" onerror="this.outerHTML='<span style=font-size:${s * 0.5}px>${avatarData.icon || '🎲'}</span>'"/>`;
      }
      case 'animal': {
        const animal = this.ANIMALS[avatarData.animalIndex || 0];
        const svg = this.generateAnimalSvg(animal, s);
        return svg;
      }
      case 'pixel': {
        const cls = this.PIXEL_CLASSES[avatarData.classIndex || 0];
        const svg = this.generatePixelRpgSvg(cls, s);
        return `<div style="image-rendering:pixelated;width:${s}px;height:${s}px">${svg}</div>`;
      }
      case 'notion': {
        const svg = this.generateNotionFaceSvg(avatarData.faceIndex || 0, s);
        return svg;
      }
      case 'emoji':
        return `<span style="font-size:${s * 0.6}px">${avatarData.emoji || '😎'}</span>`;
      default:
        return `<span style="font-size:${s * 0.6}px">${avatarData.icon || '😎'}</span>`;
    }
  },

  // Get serializable avatar data for socket transmission
  getAvatarData() {
    if (!this._selectedAvatar) return null;
    const av = this._selectedAvatar;
    // Don't send SVG strings over socket - send references
    const data = {
      type: av.type,
      color: av.color,
      icon: av.icon,
      nameAr: av.nameAr
    };
    if (av.type === 'dicebear') {
      data.style = av.style;
      data.seed = av.seed;
    } else if (av.type === 'animal') {
      data.animalIndex = av.animalIndex;
    } else if (av.type === 'pixel') {
      data.classIndex = av.classIndex;
    } else if (av.type === 'notion') {
      data.faceIndex = av.faceIndex;
    } else if (av.type === 'emoji') {
      data.emoji = av.emoji;
    }
    return data;
  },

  // Generate a random avatar data object (for server-side assignment)
  getRandomAvatarData() {
    this.randomAvatar();
    return this.getAvatarData();
  },

  // ═══════════════════════════════════════════════════════════════
  // Game-Aware Avatar Rendering
  // Wraps avatar in game-specific visual treatment
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get avatar HTML with per-game visual treatment applied.
   * @param {object} avatarData - Player's avatar data
   * @param {string} game - Current game key (quiplash, guesspionage, etc.)
   * @param {number} size - Avatar size in pixels
   * @returns {string} HTML string with game-themed avatar wrapper
   */
  getGameAvatarHtml(avatarData, game, size) {
    const s = size || 64;
    const config = this.GAME_AVATAR_CONFIG[game];

    // No game config? Fall back to standard rendering
    if (!config) return this.getAvatarHtml(avatarData, s);

    // For DiceBear avatars, optionally use the game's preferred style
    let innerHtml;
    if (avatarData && avatarData.type === 'dicebear' && config.dicebearStyle) {
      // Use player's own seed but apply game-specific DiceBear style
      const gameUrl = this.getDiceBearUrl(config.dicebearStyle, avatarData.seed, s);
      innerHtml = `<img src="${gameUrl}" alt="${avatarData.nameAr || ''}" width="${s}" height="${s}" style="border-radius:50%" loading="lazy" onerror="this.outerHTML='<span style=font-size:${s * 0.5}px>${avatarData.icon || '🎲'}</span>'"/>`;
    } else {
      innerHtml = this.getAvatarHtml(avatarData, s);
    }

    // Wrap in game-themed container
    return `<div class="game-avatar ${config.cssClass}" style="width:${s}px;height:${s}px">${innerHtml}</div>`;
  },

  /**
   * Get the current game's avatar config
   * @param {string} game - Game key
   * @returns {object|null} Config object or null
   */
  getGameConfig(game) {
    return this.GAME_AVATAR_CONFIG[game] || null;
  }
};
