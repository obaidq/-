# Abu Abed Box — Guesspionage Jackbox-Accurate Completion Prompt

> **ROLE**: You are a senior full-stack game developer who has shipped multiple real-time multiplayer party games. You are obsessive about Jackbox-level polish. You treat every deviation from the reference spec as a P0 bug. You do NOT skip steps, you do NOT leave TODOs, and you do NOT placeholder anything. Every line you write is production-ready.

> **CONSTRAINT**: You are working on an EXISTING codebase (6262 lines across 6 files). You MUST read every file fully before editing. You MUST NOT rewrite files from scratch — use surgical edits only. You MUST run `node -c <file>` after every edit batch. You MUST commit after each logical unit.

---

## CODEBASE MAP (read ALL before any edit)

| File | Lines | Role |
|------|-------|------|
| `server.js` | 2711 | Express + Socket.IO game server, all 6 games |
| `public/js/app.js` | 2077 | Client SPA, Socket.IO handlers, Canvas drawing |
| `public/index.html` | 379 | Single HTML page with all screens |
| `public/css/game-screens.css` | 556 | All game visual styles |
| `commentary.js` | 391 | Abu Abed commentary engine (Saudi Arabic) |
| `profanity.js` | 148 | Arabic profanity filter |

---

## EXACTLY 8 BUGS TO FIX (do these FIRST, in order)

### BUG 1: Final round scoring uses 4000 instead of 3000
**File**: `server.js` line 1662
**Current**: `const rankPoints = { 0: 4000, 1: 2000, 2: 1000 };`
**Correct**: `const rankPoints = { 0: 3000, 1: 2000, 2: 1000 };`
**Why**: Jackbox Guesspionage final round pays 3000/2000/1000 for #1/#2/#3 most popular. The 4000 value was a mistake from a different source.

### BUG 2: Round structure player threshold is ≤5 instead of ≤6
**File**: `server.js` line 1375
**Current**: `if (playerCount <= 5)`
**Correct**: `if (playerCount <= 6)`
**Why**: Real Guesspionage does 2 full rotations for ≤6 players, 1 rotation for ≥7.

### BUG 3: Round count formula produces wrong number of rounds
**File**: `server.js` line 1375-1378 (`getGuesspionagePhaseType`)
**Current logic**: For ≤5 players: `round < playerCount` = round1, else round2. For >5: `round < Math.floor(playerCount/2)`.
**Problem**: With 4 players and `maxRounds` set elsewhere, the mapping between rounds and phase types doesn't guarantee exactly 2 full rotations of round1 + round2 for ≤6 players, or 1 rotation for ≥7.
**Correct logic**:
- ≤6 players: Each player is featured TWICE (once in round1 phase, once in round2 phase with much higher/lower), then final round. So `maxRounds = (playerCount * 2) + 1`.
- ≥7 players: Each player is featured ONCE (round1 only, no round2 phase), then final round. So `maxRounds = playerCount + 1`. But some community sources say ≥7 still gets round2 on second pass — use the simpler model: round1 for first rotation, round2 for second rotation, then final.
**Fix**: Recalculate `maxRounds` when Guesspionage starts, AND fix `getGuesspionagePhaseType` to correctly assign round1 (first rotation), round2 (second rotation), final (last round).

### BUG 4: `maxRounds` for Guesspionage is set generically, not per-game
**File**: `server.js` — find where `room.maxRounds` is set when a game starts
**Problem**: Likely uses a generic value (e.g., 5) rather than the Guesspionage-specific formula.
**Fix**: When `room.currentGame === 'guesspionage'`, set:
```javascript
const pc = room.players.size;
room.maxRounds = pc <= 6 ? (pc * 2) + 1 : pc + 1;
// last round is always the "pick 3 from 9" final
```

### BUG 5: Slider input has no stepper buttons and no direct numeric entry
**File**: `public/js/app.js` ~line 780
**Current**: Just `<input type="range">` with `oninput`
**Fix**: Add ±1 and ±5 stepper buttons flanking the slider, AND a tappable percent display that opens a number input on tap. Debounce the `oninput` with a 50ms throttle. The gauge needle should animate smoothly (CSS transition already exists at 15ms on `.gspy-needle`).

### BUG 6: No extended timer support for streaming
**File**: `server.js` — CONFIG object (line 30-35) and timer calls
**Fix**: Add `extendedTimers: false` to CONFIG. When true, multiply all `timeLimit` values by 1.5. Add a `toggleExtendedTimers` socket event (host-only, like `toggleFamilyMode`). Emit `extendedTimersChanged` to all clients.

### BUG 7: Audience cannot participate in Guesspionage at all
**File**: `server.js` — Guesspionage challenge phase
**Current**: `getEligibleVoters` filters out audience (line 1041: `!p.isAudience`).
**Fix**: In Guesspionage, audience members SHOULD be able to bet higher/lower (their votes are what makes Guesspionage audience-friendly). Allow audience to submit bets during the challenge phase, but weight their score contribution at 0 (they don't earn points, they just participate). Alternatively — and MORE faithfully — audience members answer the poll question, and their answers contribute to determining the "correct percentage" (live polling mode). Implement BOTH:
  1. Audience can bet higher/lower (just for fun, no points)
  2. If ≥5 audience members, blend their poll average with the baked-in answer: `finalAnswer = Math.round(0.7 * bakedAnswer + 0.3 * audienceAverage)`

### BUG 8: No gauge re-animation on result reveal
**File**: `public/js/app.js` — `_handleRoundResultsInner` for guesspionage case
**Current**: Shows truth percentage as text, no animated gauge
**Fix**: On the result screen, render the same SVG gauge and animate the needle from 0 → truth percentage over 1.5 seconds (matching the drum roll duration). Show the featured player's guess as a marker on the gauge. This creates the "dramatic reveal" moment that Jackbox uses.

---

## 4 FEATURES TO ADD (after bugs)

### FEATURE 1: Staged reveal sequence
**Goal**: Make the result reveal feel like a game show moment (Jackbox's core UX pattern).
**Flow** (all in `_handleRoundResultsInner` for guesspionage):
1. **Beat 1 (0ms)**: Show question text + "الجواب الحقيقي..." with drum roll audio (already have `AudioEngine.drumRoll(1.5)`)
2. **Beat 2 (1600ms)**: Animate gauge needle to truth percentage. Big number reveal with scale-up CSS animation. Show featured player's guess vs truth with distance label.
3. **Beat 3 (3000ms)**: Fade in wagerer results (who got it right, per-player point deltas) with staggered animation (100ms per player).
4. **Beat 4 (4500ms)**: Update leaderboard. Show "Next Round" button for host.
**CSS needed**: `.gspy-reveal-number` (scale 0→1 over 400ms), `.gspy-reveal-row` (translateY(20px)→0, opacity 0→1, staggered).

### FEATURE 2: Audience live polling overlay
**Goal**: When audience members join, show a small overlay on the game screen: "🎤 {count} متفرج يجاوبون..."
**Server**: When Guesspionage featured phase starts, also emit `guesspionageAudiencePoll` to audience members with the question. Audience submits a 0-100 guess (simpler UI: just a number input, not a full gauge). Collect answers. If ≥5 audience answers, blend into the truth.
**Client**: Audience members see the question + a quick number stepper. Non-audience players see a small badge: "👀 الجمهور يجاوب..." during the featured phase.

### FEATURE 3: Host-only streaming controls panel
**Goal**: A small collapsible panel in the lobby for the host with:
- Extended timers toggle (already from BUG 6)
- Hide room code toggle (replaces the code display with "••••" for non-host players during streaming)
- Family mode toggle (already exists)
**UI**: Add to lobby screen, below the game selection grid. Collapsible with a "⚙️ إعدادات البث" header.

### FEATURE 4: Resilient numeric input with stepper
**Goal**: Replace the bare slider with a compound input that works on all phones:
```
  [-5] [-1]  ====|=======  [+1] [+5]
              [ 67% ]  ← tappable, opens number pad
```
**Behavior**:
- Slider still works (range input)
- ± buttons increment/decrement and update slider + gauge
- Tapping the percent display opens a modal with `<input type="number" inputmode="numeric">` for direct entry
- All inputs converge on `_updateGauge(val)` which is debounced at 50ms
- The gauge needle has CSS `transition: transform 0.15s ease-out` (already exists)

---

## VALIDATION CHECKLIST (run after ALL changes)

```bash
# 1. Syntax
node -c server.js && node -c public/js/app.js && echo "✅ Syntax OK"

# 2. Server starts
timeout 5 node server.js &
sleep 2
curl -s http://localhost:3000 | head -5 && echo "✅ Server OK"
kill %1

# 3. No leftover debug
grep -rn "console.log\|TODO\|FIXME\|HACK" server.js public/js/app.js | grep -v "^.*:.*//.*⏰\|^.*:.*//.*📌" && echo "⚠️ Debug lines found" || echo "✅ Clean"

# 4. Guesspionage round count math
node -e "
  [3,4,5,6,7,8].forEach(pc => {
    const mr = pc <= 6 ? (pc*2)+1 : pc+1;
    console.log(pc + ' players → ' + mr + ' rounds (' + (mr-1) + ' featured + 1 final)');
  });
"
# Expected: 3→7, 4→9, 5→11, 6→13, 7→8, 8→9

# 5. Scoring math
node -e "
  // Featured: 0 diff = 3000, 15 diff = 1500, 30 diff = 0, 31 diff = 0
  [0,5,10,15,20,25,30,31].forEach(d => {
    const pts = d <= 30 ? Math.round(3000 * (1 - d/30)) : 0;
    console.log('diff=' + d + ' → ' + pts + 'pts');
  });
  // Final: #1=3000, #2=2000, #3=1000
  console.log('Final: ' + JSON.stringify({0:3000,1:2000,2:1000}));
"
```

---

## STYLE RULES

1. **Arabic first**: All user-facing strings in Saudi Arabic. Comments can be Arabic or English.
2. **No new dependencies**: Do not `npm install` anything.
3. **RTL aware**: All new CSS must work in RTL. Use logical properties (`margin-inline-start` not `margin-left`) where possible.
4. **Mobile first**: All new UI must be thumb-reachable. Minimum touch target 44×44px.
5. **Accessible**: All interactive elements need `aria-label`. Timer displays need `role="timer"` and `aria-live="polite"`.
6. **XSS safe**: All dynamic text through `escapeHtml()` on client, `sanitizeName()` on server.
7. **Socket events**: Always validate `typeof code === 'string'`, check room exists, check player exists, before any logic.

---

## COMMIT STRATEGY

Make 3 commits:
1. `fix: Guesspionage scoring + round structure (bugs 1-4)` — pure logic fixes
2. `feat: resilient numeric input + staged reveal + extended timers (bugs 5-8, features 1,4)` — UX upgrades
3. `feat: audience live polling + streaming controls (features 2,3)` — audience/streaming

Push all to `claude/setup-abu-abed-box-aR5Op` after each commit.

---

## CRITICAL REMINDERS

- **READ before EDIT**: You MUST read the full context around any line you change (±30 lines minimum). Blind edits break things.
- **Test after each commit**: Run `node -c` on both files. Start the server. Verify no crash.
- **Do NOT refactor unrelated code**: If you see something ugly that isn't in the bug/feature list, leave it alone.
- **Do NOT add new files**: Everything goes in the existing 6 files.
- **Do NOT change the Socket.IO event names**: Other parts of the system depend on them. You can ADD new events, never RENAME existing ones.
- **The research says 3000/2000/1000 for final round**: Multiple community sources converge on this. The "4000" in the current code was from an earlier incorrect source. Fix it.
- **Gauge animation is the #1 visual impact item**: If you do nothing else from the features list, do the animated gauge reveal. It's the single biggest "feels like Jackbox" moment.
