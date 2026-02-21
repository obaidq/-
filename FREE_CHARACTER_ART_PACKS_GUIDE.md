# FREE 2D Character/Avatar Art Packs for 6 Mini-Games

## Comprehensive Research Guide -- 6 Wildly Different Visual Styles

Each game below has its own distinct visual identity. The styles are chosen to be as far apart as possible -- hand-drawn doodles vs. noir silhouettes vs. colorful blobs vs. kawaii horror vs. vintage theater vs. crayon childlike.

---

## GAME 1: Quick Reply (Quiplash) -- Wobbly Hand-Drawn Doodle Style

**Vibe:** SNL sketch comedy, goofy exaggerated faces, "doodle on a napkin" energy.

### Primary Asset Packs

| Pack Name | Source | URL | Count | Format | License | Style Notes |
|-----------|--------|-----|-------|--------|---------|-------------|
| **Public Domain Character Doodles** | itch.io (Gordy Higgins) | https://gordyh.itch.io/public-domain-character-doodles | 50+ characters | PNG (transparent) | Public Domain | Hand-drawn doodle characters, full of personality, sketchy imperfect lines. PERFECT match. |
| **Open Peeps** | openpeeps.com (Pablo Stanley) | https://www.openpeeps.com/ | 584,688 combos | SVG, PNG | CC0 | Hand-drawn illustration library. Mix/match arms, legs, faces, hair. Black line-art style, very doodly. |
| **DiceBear "Croodles"** | DiceBear API | https://api.dicebear.com/9.x/croodles/svg?seed=player1 | Unlimited (generative) | SVG, PNG | CC BY 4.0 | "Doodle your face" -- hand-drawn, wobbly, sketch-like avatars. Exactly the doodle vibe. |
| **60 Terrible Character Portraits** | OpenGameArt.org (Jeff Preston) | https://opengameart.org/content/60-terrible-character-portraits | 100+ portraits | PNG (scanned hand-drawn) | CC BY 3.0 | Hand-drawn headshots, B&W, system-agnostic, includes zombies/robots/steampunk variants. Goofy "terrible" name fits comedy. |
| **RPGMaker Cartoon Portrait Faces** | itch.io (BrysonUltra) | https://brysonultra.itch.io/rpgmaker-cartoon-portrait-faces | 8 faces | PNG (transparent) | Free commercial use | 8 hand-drawn cartoon faces, transparent backgrounds. Exactly 8 for your player count. |

### How to Use in Web Game
```html
<!-- Direct use of Open Peeps SVGs -->
<img src="open-peeps/player1.svg" class="doodle-avatar" />

<!-- DiceBear API (no download needed!) -->
<img src="https://api.dicebear.com/9.x/croodles/svg?seed=Player1" width="128" />
<img src="https://api.dicebear.com/9.x/croodles/svg?seed=Player2" width="128" />
<!-- Each unique seed = unique consistent avatar -->
```

---

## GAME 2: Guess the % (Guesspionage) -- Sleek Noir/Spy Silhouette Style

**Vibe:** James Bond opening credits, dark mysterious silhouettes, vector spy thriller.

### Primary Asset Packs

| Pack Name | Source | URL | Count | Format | License | Style Notes |
|-----------|--------|-----|-------|--------|---------|-------------|
| **Game-icons.net Spy + Detective Icons** | game-icons.net | https://game-icons.net/1x1/delapouite/spy.html | 4000+ total (spy/detective relevant subset) | SVG, PNG | CC BY 3.0 | Clean silhouette-style spy icon. Combine with mask, skull, detective icons for variety. |
| **Game-icons.net Drama Masks** | game-icons.net | https://game-icons.net/1x1/lorc/drama-masks.html | Subset of 4000+ | SVG, PNG | CC BY 3.0 | Noir-compatible silhouette icons. |
| **Vecteezy Spy Silhouette Vectors** | Vecteezy | https://www.vecteezy.com/free-vector/spy-silhouette | 63 pages of results | SVG, PNG | Free License (attribution required) | James Bond-ish spy silhouettes, noir detective figures, gun poses, trenchcoat figures. |
| **Vecteezy Noir Detective Vectors** | Vecteezy | https://www.vecteezy.com/free-vector/noir-detective | 561 vectors | SVG, PNG | Free License (attribution required) | Noir detectives, crime scenes, fedora silhouettes, magnifying glass poses. |
| **FreeSVG.org Detective/Spy** | FreeSVG.org | https://freesvg.org/ (search "detective" or "spy") | Various | SVG | CC0 | Public domain detective/spy silhouette vectors. |
| **DiceBear "Shapes"** | DiceBear API | https://api.dicebear.com/9.x/shapes/svg?seed=spy1 | Unlimited (generative) | SVG, PNG | Free commercial | Abstract geometric shapes. Use with CSS noir filter for mysterious geometric spy identity. |

### How to Use in Web Game
```html
<!-- Game-icons.net (recolor SVGs programmatically) -->
<img src="spy-icon.svg" class="noir-avatar" />

<!-- DiceBear Shapes + CSS noir treatment -->
<img src="https://api.dicebear.com/9.x/shapes/svg?seed=Agent1" class="noir-filter" />

<style>
.noir-avatar, .noir-filter {
  filter: brightness(0) saturate(100%); /* force to black silhouette */
  background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
  border: 2px solid #e94560;
  border-radius: 50%;
  padding: 8px;
}
</style>
```

---

## GAME 3: The Faker (Fakin' It) -- Suspicious Cartoon Faces / Among Us Style

**Vibe:** Among Us crewmates, round simple colorful blobs, big suspicious eyes, social deduction.

### Primary Asset Packs

| Pack Name | Source | URL | Count | Format | License | Style Notes |
|-----------|--------|-----|-------|--------|---------|-------------|
| **Kenney Shape Characters** | kenney.nl | https://kenney.nl/assets/shape-characters | 100+ assets | PNG, Spritesheet | CC0 | Simple geometric characters with faces and hands. Round, colorful, mix-and-match. Perfect suspicious blob vibe. |
| **FREE Character Avatars** | itch.io (Free Game Assets) | https://free-game-assets.itch.io/free-character-avatars | 48 icons (256x256) | PNG | Free commercial use | Colorful character avatar icons. Round, cartoon, suitable for social deduction. |
| **DiceBear "Fun Emoji"** | DiceBear API | https://api.dicebear.com/9.x/fun-emoji/svg?seed=suspect1 | ~1,350 unique | SVG, PNG | CC BY 4.0 | Colorful emoji-like faces, round, expressive. Great for suspicious expressions. |
| **DiceBear "Thumbs"** | DiceBear API | https://api.dicebear.com/9.x/thumbs/svg?seed=suspect1 | Unlimited | SVG, PNG | Free commercial | Simple round colorful avatar faces. Exactly the "simple blob with face" aesthetic. |
| **Kenney Toon Characters 1** | kenney.nl | https://kenney.nl/assets/toon-characters-1 | 270 assets (6 chars x 45 poses) | PNG, Spritesheet, Vector | CC0 | Round cartoon characters, 6 different color-coded characters, separate limbs. |
| **CraftPix Free Character Avatar Icons** | CraftPix.net | https://craftpix.net/freebies/free-character-avatar-icons/ | 48 icons | PNG | CraftPix Free License | Diverse character portraits, cartoon style. |

### How to Use in Web Game
```html
<!-- Kenney Shape Characters (download + use) -->
<img src="kenney-shapes/shape_circle_red.png" class="faker-avatar" />

<!-- DiceBear Fun Emoji API -->
<img src="https://api.dicebear.com/9.x/fun-emoji/svg?seed=Player1&eyes=closed,wink,crying,shades,cute,love,pissed,plain,sad,sleepClose,stars,tearDrop,tongue,wink2,xDiz" width="96" />

<style>
.faker-avatar {
  border-radius: 50%;
  border: 4px solid;
  box-shadow: 0 0 0 3px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}
.faker-avatar.suspicious {
  animation: shake 0.5s infinite;
  border-color: #ff4444;
}
</style>
```

---

## GAME 4: Murder Party (Trivia Murder) -- Cute-Creepy Chibi Horror / Kawaii Spooky

**Vibe:** Cute ghosts with big eyes, kawaii zombies, chibi monsters, "adorable nightmare" energy.

### Primary Asset Packs

| Pack Name | Source | URL | Count | Format | License | Style Notes |
|-----------|--------|-----|-------|--------|---------|-------------|
| **2D Monster - Cute & Chibi Demo Pack** | itch.io (huberthart) | https://huberthart.itch.io/2d-monster-cute-chibi-demo-pack | 2 monsters (Sea & Forest) | PNG, SVG (full pack) | Free demo | Cute chibi monster designs. Detailed, kawaii horror style. |
| **2D Character - Cute & Chibi Free Pack** | itch.io (huberthart) | https://huberthart.itch.io/2d-character-cute-chibi-free-pack | Characters included | PNG | Free | Cute chibi character base. Can be themed with horror elements. |
| **Ghost Pixel Asset Pack** | itch.io (Pop Shop Packs) | https://pop-shop-packs.itch.io/ghost-pixel-asset-pack | 2 ghosts (blue + pink) with animations | PNG spritesheets | Pay What You Want (Free) | Cute ghosts with idle/hurt/attack/death animations. Adorable spooky. |
| **Cute Monster Sprite Sheet** | OpenGameArt.org | https://opengameart.org/content/cute-monster-sprite-sheet | Multiple monsters | PNG, GIF | Check page (likely CC-BY or CC0) | 50x50 and 64x64 frames. Cute monster with idle/jump animations. |
| **Bevouliin Spooky Ghost Sprites** | bevouliin.com | https://bevouliin.com/spooky-ghost-sprites-free-game-asset/ | 1 ghost (full animation) | PNG (transparent) | Free commercial use, royalty free | Cute but spooky ghost, Spine 2D animated, transparent PNGs. |
| **CC0 2D Platform Creatures** | OpenGameArt.org | https://opengameart.org/content/cc0-2d-platform-creatures-characters | Collection of many | PNG | CC0 | Slime monsters, cute spiders, happy fly enemies, animated sets. All public domain. |
| **Free Demon Avatar Game Icons** | CraftPix.net | https://craftpix.net/freebies/free-demon-avatar-game-icons/ | Multiple icons | PNG, PSD | CraftPix Free License | Demon/horror character avatars for RPGs. Dark but stylized. |
| **30 Free Pixel Art Monster Portraits** | CraftPix.net | https://craftpix.net/freebies/30-free-pixel-art-monster-portrait-icons/ | 30 portraits | PNG | CraftPix Free License | Monster portrait icons, pixel art style. |
| **DiceBear "Fun Emoji" (spooky seeds)** | DiceBear API | https://api.dicebear.com/9.x/fun-emoji/svg?seed=ghost1 | Unlimited | SVG, PNG | CC BY 4.0 | Generate spooky-themed emoji faces. Combine with CSS horror effects. |

### How to Use in Web Game
```html
<!-- Mix cute assets with horror CSS effects -->
<div class="murder-avatar">
  <img src="cute-ghost.png" />
  <div class="blood-drip"></div>
</div>

<style>
.murder-avatar {
  position: relative;
  filter: hue-rotate(280deg) saturate(1.5); /* spooky purple tint */
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
.murder-avatar::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(ellipse, transparent 50%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
}
</style>
```

---

## GAME 5: Catch the Liar (Fibbage) -- Theater Masks / Vintage Circus / Carnival Puppet Style

**Vibe:** Comedy/tragedy masks, dramatic puppet characters, vintage carnival posters, mysterious theater.

### Primary Asset Packs

| Pack Name | Source | URL | Count | Format | License | Style Notes |
|-----------|--------|-----|-------|--------|---------|-------------|
| **FreeSVG.org Comedy & Tragedy Masks** | FreeSVG.org | https://freesvg.org/comedy-and-tragedy-masks-vector-image | 10+ mask variants | SVG | CC0 | Classic theater comedy/tragedy mask vectors. Multiple styles available (color, B&W, silhouette). Public domain. |
| **FreeSVG.org Theater Masks Collection** | FreeSVG.org | https://freesvg.org/theater-masks | Multiple | SVG | CC0 | Various theater mask designs including ornate and simple versions. |
| **Game-icons.net Drama Masks** | game-icons.net | https://game-icons.net/1x1/lorc/drama-masks.html | 1 icon + 47 mask-tagged icons | SVG, PNG | CC BY 3.0 | Clean drama mask icon. 47 additional mask variants (skull mask, domino mask, etc.). |
| **Game-icons.net Mask Collection** | game-icons.net | https://game-icons.net/tags/mask.html | 47 mask icons | SVG, PNG | CC BY 3.0 | Full collection of mask silhouette icons: jester, venetian, skull, gas mask, etc. |
| **Flaticon Theater Masks** | flaticon.com | https://www.flaticon.com/free-icons/theater-masks | 3,814 icons | SVG, PNG, EPS | Free with attribution | Massive collection of theater mask icons in many styles. |
| **DiceBear "Avataaars"** | DiceBear API | https://api.dicebear.com/9.x/avataaars/svg?seed=liar1 | Unlimited | SVG, PNG | Free commercial | Colorful cartoon faces. Add CSS vintage/circus overlay for theater feel. |
| **Avataaars Generator** | getavataaars.com | https://getavataaars.com/ | Unlimited (React component) | SVG, PNG | CC0 | Cartoon avatar generator (React component). Create dramatic expressions, apply vintage CSS. |

### How to Use in Web Game
```html
<!-- Combine theater masks with vintage circus styling -->
<div class="theater-avatar">
  <img src="comedy-mask.svg" class="mask-overlay" />
  <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Liar1" class="face-behind" />
</div>

<style>
.theater-avatar {
  position: relative;
  background: radial-gradient(circle, #f4e4ba, #c9a96e); /* vintage parchment */
  border: 4px double #8b4513;
  border-radius: 12px;
  padding: 12px;
  filter: sepia(0.3) contrast(1.1);
}
.theater-avatar::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
  ); /* vintage scanlines */
  pointer-events: none;
}
</style>
```

---

## GAME 6: Draw for Me (Drawful) -- Paint-Splattered Crayon/Marker Childlike Art

**Vibe:** Kid's refrigerator art, paint splatters everywhere, crayon-drawn characters, messy colorful joy.

### Primary Asset Packs

| Pack Name | Source | URL | Count | Format | License | Style Notes |
|-----------|--------|-----|-------|--------|---------|-------------|
| **DiceBear "Croodles"** | DiceBear API | https://api.dicebear.com/9.x/croodles/svg?seed=artist1 | Unlimited | SVG, PNG | CC BY 4.0 | Hand-drawn doodle faces. Apply crayon CSS effects on top. |
| **DiceBear "Lorelei"** | DiceBear API | https://api.dicebear.com/9.x/lorelei/svg?seed=artist1 | Unlimited | SVG, PNG | CC0 | Minimalist hand-drawn line art faces. Perfect base for crayon effects. |
| **Open Peeps** | openpeeps.com | https://www.openpeeps.com/ | 584,688 combos | SVG, PNG | CC0 | Hand-drawn people. Apply crayon/paint CSS filter overlays. |
| **Public Domain Character Doodles** | itch.io (Gordy Higgins) | https://gordyh.itch.io/public-domain-character-doodles | 50+ | PNG | Public Domain | Raw hand-drawn doodles that already have a messy, childlike quality. |
| **Kenney Shape Characters** | kenney.nl | https://kenney.nl/assets/shape-characters | 100+ | PNG | CC0 | Simple shapes that look like a kid drew them. Apply crayon CSS treatment. |
| **Multiavatar** | multiavatar.com | https://multiavatar.com/ | 12 billion unique | SVG | Free (attribution appreciated) | Colorful, playful avatar generator. Bright, messy-feeling designs. API: `https://api.multiavatar.com/artist1.svg` |

### How to Use in Web Game
```html
<!-- DiceBear Lorelei with crayon CSS overlay -->
<div class="drawful-avatar">
  <img src="https://api.dicebear.com/9.x/lorelei/svg?seed=Artist1" />
</div>

<!-- Or Multiavatar API (instant colorful characters) -->
<img src="https://api.multiavatar.com/Player1.svg" class="drawful-avatar" />

<style>
.drawful-avatar {
  /* SVG filter for wobbly crayon effect */
  filter: url(#crayon-filter) saturate(2) brightness(1.1);
  background:
    radial-gradient(circle at 20% 30%, rgba(255,100,100,0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 60%, rgba(100,100,255,0.3) 0%, transparent 50%),
    radial-gradient(circle at 50% 80%, rgba(100,255,100,0.3) 0%, transparent 50%),
    #fff;
  border: 3px solid #000;
  border-radius: 20px 5px 15px 8px; /* uneven "hand-drawn" corners */
  transform: rotate(-2deg);
}
</style>

<!-- Crayon wobble SVG filter (define once, reuse everywhere) -->
<svg style="position:absolute; width:0; height:0;">
  <filter id="crayon-filter">
    <feTurbulence baseFrequency="0.04" numOctaves="4" seed="1" />
    <feDisplacementMap in="SourceGraphic" scale="3" />
  </filter>
</svg>
```

---

## PROGRAMMATIC CSS/SVG TECHNIQUES -- Making Any Asset 400% Different

When free assets don't perfectly match, these CSS/SVG techniques transform ANY image into the target style.

### Master Technique Table

| Game | Target Style | CSS/SVG Technique | Code Snippet |
|------|-------------|-------------------|--------------|
| **1. Quick Reply** | Wobbly doodle | SVG `feTurbulence` + `feDisplacementMap` animated wobble | `filter: url(#wobble); @keyframes wobble-seed { ... }` |
| **2. Guess the %** | Noir silhouette | CSS `brightness(0)` + dark gradient background | `filter: brightness(0) drop-shadow(0 0 8px #e94560);` |
| **3. The Faker** | Colorful round blobs | CSS `border-radius: 50%` + bright saturated colors | `border-radius: 50%; background: hsl(var(--player-hue), 80%, 60%);` |
| **4. Murder Party** | Kawaii horror | CSS `hue-rotate` to purple/green + floating animation | `filter: hue-rotate(280deg); animation: float 3s infinite;` |
| **5. Catch the Liar** | Vintage theater | CSS `sepia()` + parchment background + scanlines | `filter: sepia(0.4) contrast(1.2); border: 4px double #8b4513;` |
| **6. Draw for Me** | Crayon childlike | SVG displacement + paint splatter overlays + rotation | `filter: url(#crayon); transform: rotate(-2deg);` |

### Detailed SVG Filter Definitions (copy-paste ready)

```html
<!-- PASTE THIS ONCE IN YOUR HTML BODY -->
<svg style="position:absolute;width:0;height:0;overflow:hidden;">
  <defs>
    <!-- GAME 1: Wobbly Doodle Effect -->
    <filter id="doodle-wobble">
      <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="noise" seed="0"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>

    <!-- GAME 2: Noir Silhouette -->
    <filter id="noir-silhouette">
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncR type="discrete" tableValues="0 0 0 1"/>
        <feFuncG type="discrete" tableValues="0 0 0 1"/>
        <feFuncB type="discrete" tableValues="0 0 0 1"/>
      </feComponentTransfer>
    </filter>

    <!-- GAME 3: Suspicious Glow -->
    <filter id="suspicious-glow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="0" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="1.2 0 0 0 0
                0 1.2 0 0 0
                0 0 1.2 0 0
                0 0 0 1 0" result="bright"/>
      <feMerge>
        <feMergeNode in="bright"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- GAME 4: Kawaii Horror Aura -->
    <filter id="horror-aura">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="glow"/>
      <feColorMatrix in="glow" type="matrix"
        values="0.5 0 0 0 0.3
                0 0.1 0 0 0
                0.3 0 0.5 0 0.3
                0 0 0 0.6 0" result="purple-glow"/>
      <feMerge>
        <feMergeNode in="purple-glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- GAME 5: Vintage Parchment -->
    <filter id="vintage-theater">
      <feColorMatrix type="matrix"
        values="0.9 0.1 0.1 0 0.05
                0.1 0.8 0.1 0 0.03
                0.05 0.05 0.6 0 0.02
                0 0 0 1 0"/>
      <feTurbulence baseFrequency="0.5" numOctaves="3" result="grain"/>
      <feBlend in="SourceGraphic" in2="grain" mode="multiply"/>
    </filter>

    <!-- GAME 6: Crayon/Marker Wobble -->
    <filter id="crayon-effect">
      <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="4" seed="2" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
</svg>
```

### JavaScript: Animated Wobble for Game 1 (Doodle) and Game 6 (Crayon)

```javascript
// Animate the SVG wobble filter to simulate hand-drawn "boiling" effect
// Reference: https://camillovisini.com/coding/simulating-hand-drawn-motion-with-svg-filters
function animateWobble(filterId, interval = 150) {
  const turbulence = document.querySelector(`#${filterId} feTurbulence`);
  if (!turbulence) return;

  const baseFreq = 0.02;
  const offsets = [0, 0.005, -0.003, 0.007, -0.002, 0.004, -0.006, 0.003];
  let frame = 0;

  setInterval(() => {
    const offset = offsets[frame % offsets.length];
    const freq = baseFreq + offset;
    turbulence.setAttribute('baseFrequency', `${freq} ${freq}`);
    turbulence.setAttribute('seed', Math.floor(Math.random() * 100));
    frame++;
  }, interval);
}

// Start animations
animateWobble('doodle-wobble', 200);  // Game 1: slower wobble
animateWobble('crayon-effect', 300);  // Game 6: even slower for crayon feel
```

### CSS Class Definitions Per Game

```css
/* GAME 1: Quick Reply - Doodle Style */
.avatar-doodle {
  filter: url(#doodle-wobble);
  border: 3px solid #333;
  border-radius: 8px;
  background: #fffef0; /* slightly off-white like paper */
  padding: 4px;
  font-family: 'Comic Neue', 'Comic Sans MS', cursive; /* nearby text */
}

/* GAME 2: Guess the % - Noir Spy */
.avatar-noir {
  filter: brightness(0) drop-shadow(0 0 6px #e94560) drop-shadow(0 0 12px #e94560);
  background: linear-gradient(135deg, #0d1117, #161b22, #0d1117);
  border: 2px solid #30363d;
  border-radius: 50%;
  padding: 8px;
}

/* GAME 3: The Faker - Suspicious Colorful */
.avatar-faker {
  filter: url(#suspicious-glow) saturate(1.4);
  border-radius: 50%;
  border: 4px solid currentColor;
  background: hsl(var(--player-hue, 200), 75%, 55%);
  padding: 6px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.avatar-faker:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 20px rgba(255,0,0,0.3);
}

/* GAME 4: Murder Party - Kawaii Horror */
.avatar-horror {
  filter: url(#horror-aura);
  background: linear-gradient(180deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%);
  border: 2px solid #9b59b6;
  border-radius: 15px;
  padding: 8px;
  animation: horror-float 4s ease-in-out infinite;
}
@keyframes horror-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-5px) rotate(1deg); }
  75% { transform: translateY(3px) rotate(-1deg); }
}

/* GAME 5: Catch the Liar - Vintage Theater */
.avatar-theater {
  filter: url(#vintage-theater);
  background: linear-gradient(145deg, #f5e6d0, #e8d5b7);
  border: 4px double #8b4513;
  border-radius: 0; /* sharp corners for vintage feel */
  padding: 10px;
  box-shadow:
    inset 0 0 30px rgba(139,69,19,0.1),
    3px 3px 0 #8b4513;
}

/* GAME 6: Draw for Me - Crayon Childlike */
.avatar-crayon {
  filter: url(#crayon-effect) saturate(2) brightness(1.1);
  background:
    radial-gradient(circle at 20% 30%, rgba(255,100,100,0.3) 0%, transparent 40%),
    radial-gradient(circle at 80% 60%, rgba(100,100,255,0.3) 0%, transparent 40%),
    radial-gradient(circle at 50% 80%, rgba(100,255,100,0.3) 0%, transparent 40%),
    #fffdf5;
  border: 3px solid #222;
  border-radius: 20px 8px 15px 5px; /* asymmetric "drawn" border */
  padding: 6px;
  transform: rotate(-1.5deg);
}
```

### Rough.js -- Nuclear Option for True Hand-Drawn Graphics

For the ultimate hand-drawn effect (especially Games 1 and 6), use **Rough.js**:

```html
<script src="https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.cjs.min.js"></script>
<canvas id="avatar-canvas" width="128" height="128"></canvas>

<script>
// Rough.js: programmatically draw hand-drawn-looking avatar frames
const canvas = document.getElementById('avatar-canvas');
const rc = rough.canvas(canvas);

// Draw a wobbly circle (face)
rc.circle(64, 64, 100, {
  roughness: 2.5,
  stroke: '#333',
  strokeWidth: 2,
  fill: '#ffeb3b',
  fillStyle: 'hachure'
});

// Draw wobbly eyes
rc.circle(48, 52, 16, { roughness: 1.5, fill: '#333', fillStyle: 'solid' });
rc.circle(80, 52, 16, { roughness: 1.5, fill: '#333', fillStyle: 'solid' });

// Draw wobbly mouth
rc.arc(64, 70, 40, 20, 0, Math.PI, false, {
  roughness: 2,
  stroke: '#333',
  strokeWidth: 2
});
</script>
```

---

## API-BASED AVATAR GENERATORS -- Best Options for Web Games (No Downloads!)

These work instantly in any web game via URL or JavaScript. No asset downloads needed.

| Generator | API URL Pattern | Styles Suitable For | License | Unique Count |
|-----------|----------------|---------------------|---------|--------------|
| **DiceBear Croodles** | `https://api.dicebear.com/9.x/croodles/svg?seed={name}` | Game 1 (doodle), Game 6 (crayon) | CC BY 4.0 | Unlimited |
| **DiceBear Fun Emoji** | `https://api.dicebear.com/9.x/fun-emoji/svg?seed={name}` | Game 3 (faker), Game 4 (horror) | CC BY 4.0 | ~1,350 |
| **DiceBear Lorelei** | `https://api.dicebear.com/9.x/lorelei/svg?seed={name}` | Game 6 (crayon base) | CC0 | Unlimited |
| **DiceBear Shapes** | `https://api.dicebear.com/9.x/shapes/svg?seed={name}` | Game 2 (noir geometric) | Free commercial | Unlimited |
| **DiceBear Bottts** | `https://api.dicebear.com/9.x/bottts/svg?seed={name}` | Game 2 (robotic spy) | Free commercial | Unlimited |
| **DiceBear Thumbs** | `https://api.dicebear.com/9.x/thumbs/svg?seed={name}` | Game 3 (round suspicious) | Free commercial | Unlimited |
| **DiceBear Avataaars** | `https://api.dicebear.com/9.x/avataaars/svg?seed={name}` | Game 5 (theatrical faces) | Free commercial | Unlimited |
| **Multiavatar** | `https://api.multiavatar.com/{name}.svg` | Game 6 (colorful messy) | Free (attribution) | 12 billion |
| **Avataaars (React)** | npm: `avataaars` component | Game 5 (dramatic faces) | CC0 | Unlimited |

### Quick Integration Example -- Different API for Each Game

```javascript
const AVATAR_APIS = {
  quickReply:   (seed) => `https://api.dicebear.com/9.x/croodles/svg?seed=${seed}`,
  guessPercent: (seed) => `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=0d1117`,
  theFaker:     (seed) => `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${seed}`,
  murderParty:  (seed) => `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${seed}`,
  catchTheLiar: (seed) => `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`,
  drawForMe:    (seed) => `https://api.multiavatar.com/${seed}.svg`,
};

// Generate 8 player avatars for any game
function getPlayerAvatars(gameKey, playerNames) {
  return playerNames.map(name => ({
    name,
    avatarUrl: AVATAR_APIS[gameKey](name)
  }));
}

// Usage
const players = getPlayerAvatars('quickReply', ['Alice','Bob','Charlie','Dana','Eve','Frank','Grace','Hank']);
// Each player gets a unique, consistent avatar via their name as seed
```

---

## RECOMMENDED COMBINATION STRATEGY PER GAME

For maximum visual differentiation, here is the recommended primary + fallback for each game:

| # | Game | PRIMARY (Best Match) | FALLBACK (API) | CSS Class |
|---|------|---------------------|----------------|-----------|
| 1 | Quick Reply | **Open Peeps** (CC0 SVG hand-drawn) + **Public Domain Character Doodles** | DiceBear Croodles | `.avatar-doodle` |
| 2 | Guess the % | **Game-icons.net** spy/detective icons (CC BY 3.0) + CSS noir treatment | DiceBear Shapes + noir CSS | `.avatar-noir` |
| 3 | The Faker | **Kenney Shape Characters** (CC0) or **DiceBear Fun Emoji** | DiceBear Thumbs | `.avatar-faker` |
| 4 | Murder Party | **huberthart chibi monsters** + **Bevouliin ghosts** + **OpenGameArt Cute Monsters** | DiceBear Fun Emoji + horror CSS | `.avatar-horror` |
| 5 | Catch the Liar | **FreeSVG.org theater masks** (CC0) + **Avataaars** (CC0) with vintage CSS | DiceBear Avataaars + theater CSS | `.avatar-theater` |
| 6 | Draw for Me | **DiceBear Lorelei** (CC0) or **Multiavatar** with crayon SVG filter | DiceBear Croodles + crayon CSS | `.avatar-crayon` |

---

## FULL LICENSE REFERENCE TABLE

| Asset/Source | License | Attribution Required? | Commercial Use? | Modify/Remix? |
|--------------|---------|----------------------|-----------------|---------------|
| Kenney.nl (all packs) | CC0 1.0 | No | Yes | Yes |
| Open Peeps | CC0 | No | Yes | Yes |
| DiceBear Lorelei | CC0 1.0 | No | Yes | Yes |
| Avataaars (getavataaars) | CC0 | No | Yes | Yes |
| FreeSVG.org | CC0 | No | Yes | Yes |
| Public Domain Character Doodles | Public Domain | No | Yes | Yes |
| DiceBear Croodles | CC BY 4.0 | Yes | Yes | Yes |
| DiceBear Fun Emoji | CC BY 4.0 | Yes | Yes | Yes |
| DiceBear Adventurer | CC BY 4.0 | Yes | Yes | Yes |
| DiceBear Avataaars | Free commercial | Check terms | Yes | Yes |
| DiceBear Bottts | Free commercial | Check terms | Yes | Yes |
| Game-icons.net | CC BY 3.0 | Yes | Yes | Yes |
| OpenGameArt (varies) | CC0 / CC-BY / CC-BY-SA | Varies per asset | Yes | Yes |
| Vecteezy (free tier) | Vecteezy Free License | Yes | Yes | Yes |
| CraftPix.net (freebies) | CraftPix Free License | Check terms | Yes (in games) | Yes |
| Bevouliin.com (free) | Royalty Free | No | Yes | Yes |
| Multiavatar | MIT-like | Attribution appreciated | Yes | Yes |
| Rough.js (library) | MIT | No | Yes | Yes |

---

## SUMMARY

The 6 games achieve maximum visual differentiation through this combination:

1. **Quick Reply** = Black ink doodles on white paper (Open Peeps / Croodles)
2. **Guess the %** = Dark silhouettes on neon-noir backgrounds (Game-icons / CSS noir)
3. **The Faker** = Bright colorful round blobs (Kenney Shapes / Fun Emoji)
4. **Murder Party** = Cute pastel monsters on dark purple (Chibi Monsters / Ghost Sprites)
5. **Catch the Liar** = Sepia vintage masks on parchment (FreeSVG Masks / Avataaars)
6. **Draw for Me** = Wobbly rainbow crayon characters (Lorelei + SVG crayon filter)

The fastest path to production: Use **DiceBear's API** for all 6 games (different style per game), combined with the **6 CSS class definitions** above. Zero downloads, instant unique avatars, maximally different visual styles.
