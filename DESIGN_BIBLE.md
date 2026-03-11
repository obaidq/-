# Abu Abed Box - Visual Design Bible v1.0

## Complete AI Image Generation Prompt Bible
17 Games | Visual References | Color Palettes | Typography

---

## Platform-Level Design

### Colors
| Element | Hex | Usage |
|---------|-----|-------|
| Background | #1A1A2E | Deep navy base |
| Amber Accent | #FFB347 | Warm lighting, vignette |
| Gold Borders | #C9A96E | Tile frames, decorations |
| Cream Text | #F5F0E8 | Room code, titles |
| Navigation | #FFD700 | Arrows, highlights |

---

## Per-Game Color Palettes

| # | Game | Primary BG | Secondary BG | Accent 1 | Accent 2 | Accent 3 |
|---|------|-----------|-------------|----------|----------|----------|
| 1 | Quick Response (Quiplash) | #2D1B69 | #1A1145 | #FFD700 | #00E5FF | #FF4081 |
| 2 | Guess % (Guesspionage) | #0D1117 | #1A2332 | #00FF41 | #FF1744 | #00BCD4 |
| 3 | The Faker (Fakin' It) | #E07A5F | #F4D35E | #42A5F5 | #C62828 | #FDD835 |
| 4 | Murder Party (TMP) | #0D0D0D | #1A1A1A | #2ECC40 | #CC0000 | #FFB347 |
| 5 | Catch the Liar (Fibbage) | #1A1A5E | #0D0D3A | #FFD700 | #4CAF50 | #FF5722 |
| 6 | Draw for Me (Drawful) | #F5C842 | #E8B830 | #C5A55A | #00897B | #1A1A1A |
| 7 | T-Shirt Wars (Tee K.O.) | #0D0D1A | #1A1A2E | #FF007F | #00BFFF | #FFD700 |
| 8 | Love Monster (MSM) | #1C0A2E | #2D1B4E | #FF1493 | #00FF7F | #FFD700 |
| 9 | Mad Inventions (Patently Stupid) | #FFF8E7 | #F5E6C8 | #2980B9 | #FF8C00 | #27AE60 |
| 10 | Would You Rather (Bracketeering) | #0A0E2A | #141852 | #FF2D7B | #00E5FF | #FFD700 |
| 11 | Who Said It (Blather) | #1A1A3E | #2D2D5E | #FFB800 | #00BFA5 | #B388FF |
| 12 | Speed Round (YDKJ) | #0D0D0D | #1A1A1A | #FF1744 | #00E676 | #2979FF |
| 13 | Two Truths (Interrogation) | #1A1A2E | #0D0D1A | #E63946 | #2ECC71 | #F4D35E |
| 14 | Split the Room | #1B0A2E | #4A0E78 | #7B2FBE | #00CED1 | #F5E6CA |
| 15 | Emoji Decode (Arcade) | #0A0A1A | #1A1A2E | #FF00FF | #00FFFF | #FFE600 |
| 16 | The Court (Debate) | #2C1810 | #4A3728 | #C9A96E | #1B3A5C | #8B0000 |
| 17 | Acrophobia (Word Game) | #2D5F3A | #1A472A | #F5F0EB | #8B6914 | #C8102E |

---

## Typography System

| Role | Font | Weight | Use Case |
|------|------|--------|----------|
| Game Titles | Lalezar | Regular | Splash, logos, winners |
| Section Headers | Noto Kufi Arabic | Bold/Black | Round titles, categories |
| Fun Labels | Lemonada | Medium-Bold | Chat bubbles, scores |
| Prompts | Cairo | Medium-Bold | Questions, descriptions |
| UI/Buttons | Tajawal | Bold | Navigation, settings |
| Body Text | Readex Pro | Regular | Instructions, tips |
| Numbers/Timers | Changa | Bold | Scores, countdowns |
| Impact Text | Jomhuria | Regular | Dramatic reveals |
| Formal/Legal | El Messiri | Bold | Gallery, courtroom |

### RTL Critical Rules
- Never add letter-spacing to Arabic text (breaks cursive connections)
- Minimum 14px font size for Arabic text
- Line-height 1.4-1.6x for Arabic content
- Mirror ALL layouts right-to-left
- Progress bars fill right to left
- Use `direction: rtl` on all text containers
- Use Western Arabic numerals (0-9) for scores

---

## Per-Game Typography

| Game | Headers Font | Body Font |
|------|-------------|-----------|
| Quick Response | Noto Kufi Arabic Black | Cairo Bold |
| Guess % | Changa Bold | Tajawal |
| The Faker | Lemonada Bold | Cairo Medium |
| Murder Party | Jomhuria | Cairo Bold |
| Catch the Liar | Cairo ExtraBold | Readex Pro |
| Draw for Me | El Messiri Bold | Cairo |
| T-Shirt Wars | Noto Kufi Arabic Black | Changa Bold |
| Love Monster | Lemonada Bold | Tajawal |
| Mad Inventions | Noto Kufi Arabic Bold | Cairo |
| Would You Rather | Changa ExtraBold | Cairo Bold |
| Who Said It | Lemonada Bold | Cairo |
| Speed Round | Cairo Black | Changa Bold |
| Two Truths | Cairo Bold | Readex Pro |
| Split the Room | Noto Kufi Arabic Bold | El Messiri |
| Emoji Decode | Changa Bold | Cairo |
| The Court | El Messiri Bold | Cairo |
| Acrophobia | Noto Kufi Arabic Black | Lemonada |

---

## CSS Effect Recipes

### SVG Noise Grain Overlay
```css
.game-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,...feTurbulence baseFrequency='0.75' numOctaves='4'...");
  opacity: 0.05;
  mix-blend-mode: overlay;
  pointer-events: none;
}
```

### Radial Vignette
```css
.game-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%);
  pointer-events: none;
}
```

### CRT Scanlines
```css
background: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,65,0.03) 1px, rgba(0,255,65,0.03) 2px);
```

### Neon Glow Text
```css
text-shadow: 0 0 7px #00FFFF, 0 0 10px #00FFFF, 0 0 21px #00FFFF, 0 0 42px #0fa;
```

### Halftone Dots
```css
background: radial-gradient(circle, #000 1px, transparent 1px);
background-size: 4px 4px;
opacity: 0.03;
```

### Candlelight Flicker
```css
@keyframes flicker { 0%,100% { opacity:1; } 50% { opacity:0.8; } 25%,75% { opacity:0.9; } }
```

### Screen Shake
```css
@keyframes shake { 0%,100% { transform:translate(0); } 25% { transform:translate(-2px,2px); } 75% { transform:translate(2px,-2px); } }
```

---

## Saudi Cultural Elements

| Element | Usage |
|---------|-------|
| Falcon (صقر) | Platform mascot, lobby, loading, achievements |
| Dallah Coffee Pot (دلة) | Hospitality symbol, lobby icon, rewards |
| Al Sadu Weaving | Loading bars, card backs, borders (UNESCO Bedouin textile) |
| Islamic Geometric Patterns | Background textures, victory bursts, frame borders |
| Mashrabiya (Lattice Screen) | Modal frames, question containers, score panels |

### Cultural Colors
| Color | Hex | Meaning |
|-------|-----|---------|
| Saudi Green | #009000 | Islam, paradise, life, national identity |
| Gold | #FFD700 | Glory, wisdom, achievement |
| Desert Sand | #F5E6CA | Warmth, heritage, hospitality |

---

## Per-Game Moods

| Game | Mood |
|------|------|
| Quick Response | Comedic, bold, punchy, electric, late-night-show |
| Guess % | Covert, surveillance, classified, espionage |
| The Faker | Retro, playful, suspicious, Hanna-Barbera |
| Murder Party | Macabre, darkly comedic, candlelit, haunted |
| Catch the Liar | Witty, deceptive, game-show, trivia-chic |
| Draw for Me | Whimsical, gallery-chic, hilarious, artsy |
| T-Shirt Wars | Punk, neon, combat, tournament, explosive |
| Love Monster | Spooky-romantic, dating-app, gothic-playful |
| Mad Inventions | Inventive, absurd, Shark Tank, retro infomercial |
| Would You Rather | Competitive, neon-retro, 80s arcade, cosmic |
| Who Said It | Mysterious, jazzy, dramatic, detective |
| Speed Round | Urgent, electric, high-energy, rapid-fire |
| Two Truths | Suspenseful, noir, investigative, lie-detector |
| Split the Room | Mysterious, surreal, Twilight Zone, portal |
| Emoji Decode | Energetic, arcade, neon, cyberpunk-lite |
| The Court | Authoritative, dramatic, courtroom, theatrical |
| Acrophobia | Warm, intellectual, cozy, literary |
