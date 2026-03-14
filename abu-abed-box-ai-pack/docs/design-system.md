# Abu Abed Box — Design System v1.0

## 1. Brand Essence

**Platform:** Abu Abed Box (أبو عابد بوكس)
**Type:** Saudi party-game platform (Jackbox-style)
**Mood:** Playful × Premium × Social
**Direction:** Game-like interface, NOT SaaS dashboard

### Brand Pillars
- **Playful** — Bold colors, bouncy interactions, mascot-driven personality
- **Premium** — Deep navy + gold palette, glass effects, polished shadows
- **Social** — Large tap targets, clear hierarchy, party energy
- **Arabic-first** — RTL layout, Arabic typography rules, cultural authenticity

### Design DNA
- Party card UI layouts with rounded corners
- Dark game hub with warm gold lighting
- Mascot (Abu Abed 🧔🏻) integrated throughout
- TV game-show energy (Jackbox, Goose Goose Duck, SpongeBob)

---

## 2. Color Palette

### Primary (Deep Navy)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary-900` | #020812 | Deepest background |
| `--color-primary-800` | #0A1628 | Card backgrounds |
| `--color-primary-700` | #0D1B2A | Surface panels |
| `--color-primary-600` | #112240 | Elevated surfaces |
| `--color-primary-500` | #1A3358 | Active states |
| `--color-primary-400` | #234670 | Borders |
| `--color-primary-300` | #2C5A88 | Muted text |

### Secondary (Gold)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-secondary-500` | #FDD425 | Primary gold accent |
| `--color-secondary-400` | #FFE066 | Gold highlights |
| `--color-secondary-300` | #FFF3B0 | Gold tints |

### Accent Colors
| Token | Hex | Role |
|-------|-----|------|
| `--color-accent-yellow` | #FDD425 | Primary CTA |
| `--color-accent-orange` | #FF8C42 | Secondary CTA |
| `--color-accent-pink` | #FF6B9D | Fun highlights |
| `--color-accent-red` | #E53935 | Danger / error |
| `--color-accent-purple` | #AB47BC | Creative accent |
| `--color-accent-green` | #43A047 | Success states |
| `--color-accent-cyan` | #29B6F6 | Info states |
| `--color-accent-coral` | #FF6B6B | Warm accent |
| `--color-accent-magenta` | #FF2D55 | Bold accent |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | #43A047 | Correct, online |
| `--color-warning` | #FDD425 | Caution, timer |
| `--color-error` | #E53935 | Wrong, offline |
| `--color-info` | #29B6F6 | Tips, info |

### Glass & Surface Effects
| Token | Value | Usage |
|-------|-------|-------|
| `--glass-bg` | rgba(10,79,164,0.12) | Frosted panels |
| `--glass-bg-strong` | rgba(10,79,164,0.2) | Emphasized panels |
| `--glass-border` | rgba(255,255,255,0.08) | Glass edges |
| `--glass-blur` | blur(20px) | Backdrop blur |
| `--surface-card` | rgba(10,22,40,0.75) | Card surfaces |

### Cultural Colors
| Color | Hex | Meaning |
|-------|-----|---------|
| Saudi Green | #009000 | Islam, paradise, national identity |
| Gold | #FFD700 | Glory, wisdom, achievement |
| Desert Sand | #F5E6CA | Warmth, heritage, hospitality |

---

## 3. Typography

### Font Stack
| Role | Font | Fallback | Use |
|------|------|----------|-----|
| Display/Titles | Lalezar | Noto Kufi Arabic | Splash screens, logos, winners |
| Headers | Noto Kufi Arabic | Cairo | Section titles, categories |
| Labels | Lemonada | Cairo | Chat bubbles, scores, badges |
| Body/Prompts | Cairo | Tajawal | Questions, descriptions, UI text |
| UI/Buttons | Tajawal | Cairo | Navigation, settings, controls |
| Long text | Readex Pro | Cairo | Instructions, tips |
| Numbers/Timers | Changa | Cairo | Scores, countdowns |
| Impact | Jomhuria | Lalezar | Dramatic reveals |
| Formal | El Messiri | Cairo | Gallery, courtroom game |

### Size Scale
| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | 0.75rem | Captions, metadata |
| `--text-sm` | 0.875rem | Labels, hints |
| `--text-base` | 1rem | Body text |
| `--text-lg` | 1.125rem | Emphasized body |
| `--text-xl` | 1.25rem | Section headers |
| `--text-2xl` | 1.5rem | Panel headers |
| `--text-3xl` | 2rem | Screen titles |
| `--text-4xl` | 2.5rem | Hero text |
| `--text-5xl` | 3.5rem | Room code |
| `--text-6xl` | 4.5rem | Mascot display |

### Weight Scale
| Token | Value | Usage |
|-------|-------|-------|
| `--font-normal` | 400 | Body text |
| `--font-medium` | 500 | Labels |
| `--font-semibold` | 600 | Emphasized |
| `--font-bold` | 700 | Headers |
| `--font-extrabold` | 800 | Titles |
| `--font-black` | 900 | Display / hero |

### Arabic Typography Rules
- **Never** add `letter-spacing` to Arabic text (breaks cursive connections)
- Minimum **14px** font size for Arabic text
- Line-height **1.4–1.6×** for Arabic content
- Use Western Arabic numerals (0–9) for scores
- Use `direction: rtl` on all text containers

---

## 4. Spacing System

### Space Scale (0.25rem base)
| Token | Size | Px equiv |
|-------|------|----------|
| `--space-0` | 0 | 0 |
| `--space-1` | 0.25rem | 4px |
| `--space-2` | 0.5rem | 8px |
| `--space-3` | 0.75rem | 12px |
| `--space-4` | 1rem | 16px |
| `--space-5` | 1.25rem | 20px |
| `--space-6` | 1.5rem | 24px |
| `--space-8` | 2rem | 32px |
| `--space-10` | 2.5rem | 40px |
| `--space-12` | 3rem | 48px |
| `--space-16` | 4rem | 64px |
| `--space-20` | 5rem | 80px |
| `--space-24` | 6rem | 96px |

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | 0 | Sharp edges |
| `--radius-sm` | 8px | Tags, badges |
| `--radius-md` | 12px | Inputs, small cards |
| `--radius-lg` | 16px | Buttons |
| `--radius-xl` | 20px | Panels |
| `--radius-2xl` | 28px | Cards, modals |
| `--radius-3xl` | 36px | Hero elements |
| `--radius-full` | 9999px | Pills, avatars |

### Border Widths
| Token | Value | Usage |
|-------|-------|-------|
| `--border-thin` | 2px | Subtle edges |
| `--border-medium` | 3px | Standard borders |
| `--border-thick` | 4px | Emphasized borders |
| `--border-chonky` | 6px | Cartoon-style borders |

### Shadows (Elevation System)
| Token | Usage |
|-------|-------|
| `--shadow-xs` | Subtle lift |
| `--shadow-sm` | Buttons resting |
| `--shadow-md` | Cards, panels |
| `--shadow-lg` | Modals, dropdowns |
| `--shadow-xl` | Popovers |
| `--shadow-2xl` | Maximum elevation |
| Colored shadows | Per-game accent glows (green, yellow, pink, purple, cyan, orange, gold) |

### Container Sizes
| Token | Size |
|-------|------|
| `--container-sm` | 640px |
| `--container-md` | 768px |
| `--container-lg` | 1024px |
| `--container-xl` | 1280px |

---

## 5. Component System

### Buttons (`.btn`)
- **Height:** 54px default, 40px small, 66px large
- **Min-width:** 140px
- **Radius:** `--radius-lg` (16px)
- **Style:** Chunky 3D shadow, glossy highlight overlay, text stroke
- **Variants:** `--primary` (gold gradient), `--secondary` (orange), `--danger` (red), `--ghost` (frosted glass), `--accent` (theme color)
- **States:** Hover (lift -4px), Active (press +3px), Focus-visible (gold outline), Disabled (grayscale)

### Cards (`.card`, `.game-card`)
- **Background:** `--surface-card` with glass border
- **Radius:** `--radius-2xl` (28px)
- **Border:** `--border-medium` with `--glass-border`
- **Shadow:** Elevated card shadow with accent glow on hover
- **Game cards** have per-game colored banners with icons

### Panels (`.panel`)
- **Background:** `--glass-bg-strong`
- **Radius:** `--radius-2xl`
- **Variants:** `--narrow` (max 400px), `--medium` (max 500px)

### Inputs (`.input`)
- **Height:** 54px
- **Radius:** `--radius-md`
- **Style:** Glass background with subtle border
- **Focus:** Scale 1.01 + gold border glow

### Room Code Display
- **Font:** `--font-display` (Lalezar)
- **Size:** `--text-5xl` with `clamp(2rem, 8vw, 3.5rem)`
- **Style:** Gold gradient text, text shadow, wide letter spacing (LTR)

### Background System (5 layers)
1. `bg__gradient` — Base gradient
2. `bg__pattern` — Animated rays/dots
3. `bg__glow` — Ambient color glow
4. `bg__noise` — SVG noise grain overlay
5. `bg__overlay` — Screen-specific tint

### Transitions & Easing
| Token | Value |
|-------|-------|
| `--duration-fast` | 100ms |
| `--duration-normal` | 200ms |
| `--duration-slow` | 300ms |
| `--ease-out` | cubic-bezier(0.16, 1, 0.3, 1) |
| `--ease-bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) |
| `--ease-spring` | cubic-bezier(0.175, 0.885, 0.32, 1.275) |
| `--ease-pop` | cubic-bezier(0.68, -0.55, 0.265, 1.55) |

---

## 6. Mascot Rules

### Abu Abed (أبو عابد) 🧔🏻
- **Role:** Platform mascot, guide, entertainer
- **Presence:** Boot screen, menu screen, lobby, game intros, victory screens
- **Display size:** Large emoji (130px on boot, 80px in-context)
- **Personality:** Playful, welcoming, competitive
- **Interactions:** Idle bounce, pointing at room code, celebrating wins, costume variants per game category

### Cultural Elements
| Element | Usage |
|---------|-------|
| Falcon (صقر) | Platform sub-mascot, lobby, achievements |
| Dallah (دلة) | Hospitality symbol, lobby, rewards |
| Al Sadu weaving | Loading bars, card backs, borders |
| Islamic geometric patterns | Background textures, victory bursts |
| Mashrabiya lattice | Modal frames, question containers |

---

## 7. Screen Blueprints

### Boot Screen (شاشة التحميل)
```
┌─────────────────────────┐
│                         │
│        🧔🏻 (mascot)     │
│     أبو عابد بوكس       │
│      ███████░░░ (bar)   │
│                         │
│   💡 tip text here      │
│        V7.0 • 2026      │
└─────────────────────────┘
```
- Centered layout with mascot → logo → progress bar → tip
- Jackbox-style loading with fun tips rotation

### Menu Screen (القائمة الرئيسية)
```
┌─────────────────────────┐
│        🧔🏻              │
│     أبو عابد بوكس       │
│   العب مع ربعك! • ١٧    │
│                         │
│  ┌──────┐  ┌──────┐     │
│  │  📺  │  │  📱  │     │
│  │مضيف  │  │لاعب  │     │
│  │أنشئ  │  │انضم  │     │
│  └──────┘  └──────┘     │
│                         │
│  ① → ② → ③ (how strip) │
│    ❓ كيف ألعب؟         │
│      footer             │
└─────────────────────────┘
```
- Two mode cards: Host (create) vs Player (join)
- 3-step onboarding strip
- Mobile-first, centered, stacked layout

### Lobby Screen (غرفة الانتظار)
```
┌─────────────────────────┐
│   أبو عابد بوكس (sm)    │
│    ┌── ABCD ──┐         │
│    │ room code│ 📤      │
│    └──────────┘         │
│  👥 اللاعبين (4/10)     │
│  [avatar][avatar][...]  │
│                         │
│  ── اختر لعبة ──        │
│  [tabs: كتابة|خداع|...]│
│  🎲 فاجئني!            │
│  ┌────┐┌────┐┌────┐     │
│  │game││game││game│     │
│  │card││card││card│     │
│  └────┘└────┘└────┘     │
│                         │
│  [جاهز] [⚙️] [🚪]      │
└─────────────────────────┘
```
- Room code prominently displayed
- Player avatar grid
- Game browser with category tabs
- Host controls (family mode, timers, stream mode, etc.)

### Game Screens
Each of 17 games follows this structure:
```
┌─────────────────────────┐
│  [game header + timer]  │
│                         │
│  ┌───────────────────┐  │
│  │  prompt/question  │  │
│  └───────────────────┘  │
│                         │
│  [answer input area]    │
│  [action buttons]       │
│                         │
│  [player status bar]    │
└─────────────────────────┘
```
- Per-game color theme applied via `data-theme`
- Unique intro screen, signature icon, custom timer design
- Game-specific background pattern and avatar filters

### Per-Game Themes (17 palettes)
Each game has unique: background color, 3 accent colors, header font, body font, mood/atmosphere. See DESIGN_BIBLE.md for full specifications.

---

## Design Rules Summary

1. **Mobile-first** — Design for phone, scale up for TV/stream
2. **RTL always** — Arabic text, mirrored layouts, right-to-left progress
3. **Token-driven** — Never hardcode colors, sizes, or spacing
4. **Game, not SaaS** — Rounded, bold, bouncy, colorful — never flat or corporate
5. **Reusable components** — Build once, theme per game
6. **Accessible** — WCAG AA contrast, 44px touch targets, focus-visible, reduced motion
7. **One screen at a time** — Build, polish, then move to next
