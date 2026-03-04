// ═══════════════════════════════════════════════════════════════════════════
// V60 Masters — Grind Dial Visual (ODE Fellow 2)
// Interactive SVG circular dial for grind size selection
// ═══════════════════════════════════════════════════════════════════════════

/* eslint-disable no-var */

// ─── CSS Injection ───
(function(){
  var style = document.createElement('style');
  style.textContent = [
    '.grind-dial-wrap{',
    '  display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px 0;',
    '  user-select:none;-webkit-user-select:none;touch-action:none;',
    '}',
    '.grind-dial{',
    '  width:100%;max-width:220px;aspect-ratio:1;cursor:grab;',
    '  transition:filter .2s;',
    '}',
    '.grind-dial:active{cursor:grabbing;}',
    '.grind-dial.gd-pulse{',
    '  animation:gdPulse .15s ease;',
    '}',
    '.grind-info{',
    '  text-align:center;font-family:"Cairo",sans-serif;',
    '  font-size:13px;font-weight:700;color:var(--t2);',
    '  background:var(--bg2);padding:8px 18px;border-radius:var(--r3,10px);',
    '  direction:rtl;min-width:160px;',
    '  transition:background .3s,color .3s;',
    '}',
    '.grind-info .gi-micron{',
    '  font-family:"Inter","Cairo",sans-serif;direction:ltr;',
    '  display:inline;unicode-bidi:embed;color:var(--a1);font-weight:800;',
    '}',
    '.grind-info .gi-sep{margin:0 6px;color:var(--t4);font-weight:400;}',
    '@keyframes gdPulse{',
    '  0%{transform:scale(1)}',
    '  50%{transform:scale(1.03)}',
    '  100%{transform:scale(1)}',
    '}',
    '.gd-needle{',
    '  transition:none;transform-origin:100px 100px;',
    '}',
    '.gd-needle.gd-animate{',
    '  transition:transform .15s ease-out;',
    '}',
  ].join('\n');
  document.head.appendChild(style);
})();


// ─── Constants ───
var GD_MIN_SETTING = 1;
var GD_MAX_SETTING = 11;
var GD_MICRON_MIN = 275;
var GD_MICRON_MAX = 1160;
var GD_TOTAL_SETTINGS = 31; // 1 to 11, each ~3 clicks
var GD_START_ANGLE = 135;   // degrees — dial arc start (bottom-left)
var GD_END_ANGLE = 405;     // degrees — dial arc end (bottom-right, sweep 270°)
var GD_SWEEP = GD_END_ANGLE - GD_START_ANGLE; // 270°


// ═══════════════════════════════════════════════════════════════════════════
// grindToMicrons — Convert ODE setting (1–11) to approximate microns
// ═══════════════════════════════════════════════════════════════════════════
function grindToMicrons(setting) {
  var clamped = Math.max(GD_MIN_SETTING, Math.min(GD_MAX_SETTING, setting));
  var t = (clamped - GD_MIN_SETTING) / (GD_MAX_SETTING - GD_MIN_SETTING);
  return Math.round(GD_MICRON_MIN + t * (GD_MICRON_MAX - GD_MICRON_MIN));
}


// ═══════════════════════════════════════════════════════════════════════════
// getGrindDescription — Arabic description of grind coarseness
// ═══════════════════════════════════════════════════════════════════════════
function getGrindDescription(setting) {
  if (setting <= 3)  return 'ناعم جداً (إسبريسو)';
  if (setting <= 5)  return 'ناعم (فلتر ناعم)';
  if (setting <= 7)  return 'متوسط';
  if (setting <= 9)  return 'متوسط-خشن';
  return 'خشن';
}


// ═══════════════════════════════════════════════════════════════════════════
// Helper: setting → angle on the dial (degrees)
// ═══════════════════════════════════════════════════════════════════════════
function _gdSettingToAngle(setting) {
  var t = (setting - GD_MIN_SETTING) / (GD_MAX_SETTING - GD_MIN_SETTING);
  return GD_START_ANGLE + t * GD_SWEEP;
}

// Helper: angle → setting (clamped, snapped to 0.5)
function _gdAngleToSetting(angleDeg) {
  // Normalize angle into the dial's range
  var a = angleDeg;
  // Bring angle into 0–360 range first
  while (a < 0) a += 360;
  while (a >= 360) a -= 360;

  // The dead zone is from GD_END_ANGLE%360 to GD_START_ANGLE
  // GD_END_ANGLE=405 → 45°, GD_START_ANGLE=135°
  // Dead zone: 45° to 135° (the bottom gap of the dial)
  var deadStart = GD_END_ANGLE % 360; // 45
  var deadEnd = GD_START_ANGLE;        // 135

  if (a >= deadStart && a <= deadEnd) {
    // In dead zone — snap to nearest end
    var distToEnd = a - deadStart;
    var distToStart = deadEnd - a;
    if (distToEnd < distToStart) {
      return GD_MAX_SETTING; // snap to 11
    } else {
      return GD_MIN_SETTING; // snap to 1
    }
  }

  // Map angle to 0..1 within the sweep
  var mapped;
  if (a >= GD_START_ANGLE) {
    mapped = (a - GD_START_ANGLE) / GD_SWEEP;
  } else {
    // a is between 0 and deadStart (0–45°), meaning it's past 360°
    mapped = (a + 360 - GD_START_ANGLE) / GD_SWEEP;
  }

  mapped = Math.max(0, Math.min(1, mapped));
  var raw = GD_MIN_SETTING + mapped * (GD_MAX_SETTING - GD_MIN_SETTING);
  // Snap to nearest 0.5
  return Math.max(GD_MIN_SETTING, Math.min(GD_MAX_SETTING, Math.round(raw * 2) / 2));
}

// Helper: degrees → radians
function _gdRad(deg) { return deg * Math.PI / 180; }

// Helper: polar to cartesian (SVG coords, center 100,100)
function _gdPolar(cx, cy, r, angleDeg) {
  var rad = _gdRad(angleDeg);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Helper: SVG arc path between two angles
function _gdArcPath(cx, cy, r, startAngle, endAngle) {
  var s = _gdPolar(cx, cy, r, startAngle);
  var e = _gdPolar(cx, cy, r, endAngle);
  var sweep = endAngle - startAngle;
  var largeArc = sweep > 180 ? 1 : 0;
  return 'M ' + s.x + ' ' + s.y + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + e.x + ' ' + e.y;
}


// ═══════════════════════════════════════════════════════════════════════════
// renderGrindDial — Main entry point
// Creates the SVG dial in the given container element
// ═══════════════════════════════════════════════════════════════════════════
function renderGrindDial(containerId, oMin, oMax, currentSetting) {
  var container = typeof containerId === 'string'
    ? document.getElementById(containerId)
    : containerId;
  if (!container) return null;

  // Default current setting to midpoint of range
  var setting = (typeof currentSetting === 'number')
    ? currentSetting
    : Math.round(((oMin + oMax) / 2) * 2) / 2;

  var cx = 100, cy = 100, outerR = 80, innerR = 22;

  // ── Build SVG ──
  var svgNS = 'http://www.w3.org/2000/svg';

  // Track arc (background)
  var trackPath = _gdArcPath(cx, cy, outerR, GD_START_ANGLE, GD_END_ANGLE);

  // Recommended range arc
  var rangeStartAngle = _gdSettingToAngle(oMin);
  var rangeEndAngle = _gdSettingToAngle(oMax);
  var rangePath = _gdArcPath(cx, cy, outerR, rangeStartAngle, rangeEndAngle);

  // Tick marks and number labels
  var ticksHtml = '';
  for (var i = GD_MIN_SETTING; i <= GD_MAX_SETTING; i++) {
    var angle = _gdSettingToAngle(i);
    var outerTick = _gdPolar(cx, cy, outerR - 6, angle);
    var innerTick = _gdPolar(cx, cy, outerR + 2, angle);
    var labelPos = _gdPolar(cx, cy, outerR + 14, angle);

    // Tick mark
    ticksHtml += '<line x1="' + outerTick.x + '" y1="' + outerTick.y +
      '" x2="' + innerTick.x + '" y2="' + innerTick.y +
      '" stroke="var(--t3)" stroke-width="2" stroke-linecap="round"/>';

    // Number label
    var isInRange = (i >= Math.floor(oMin) && i <= Math.ceil(oMax));
    var labelColor = isInRange ? 'var(--a1)' : 'var(--t3)';
    var labelWeight = isInRange ? '800' : '600';
    ticksHtml += '<text x="' + labelPos.x + '" y="' + (labelPos.y + 4) +
      '" text-anchor="middle" fill="' + labelColor +
      '" font-size="11" font-weight="' + labelWeight +
      '" font-family="Inter,Cairo,sans-serif">' + i + '</text>';
  }

  // Half-setting tick marks (smaller)
  for (var h = 1.5; h <= 10.5; h += 1) {
    var hAngle = _gdSettingToAngle(h);
    var hOuter = _gdPolar(cx, cy, outerR - 4, hAngle);
    var hInner = _gdPolar(cx, cy, outerR + 1, hAngle);
    ticksHtml += '<line x1="' + hOuter.x + '" y1="' + hOuter.y +
      '" x2="' + hInner.x + '" y2="' + hInner.y +
      '" stroke="var(--border)" stroke-width="1" stroke-linecap="round"/>';
  }

  // Needle endpoint
  var needleAngle = _gdSettingToAngle(setting);
  var needleEnd = _gdPolar(cx, cy, outerR - 14, needleAngle);
  var needleDotPos = _gdPolar(cx, cy, outerR - 10, needleAngle);

  var svgHtml = [
    '<svg viewBox="0 0 200 200" class="grind-dial" id="' + (container.id || 'gd') + '_svg">',

    // Background track arc
    '<path d="' + trackPath + '" fill="none" stroke="var(--border)" stroke-width="8" stroke-linecap="round"/>',

    // Recommended range arc (highlighted)
    '<path d="' + rangePath + '" fill="none" stroke="var(--a1)" stroke-width="10" stroke-linecap="round" opacity="0.35"/>',

    // Tick marks and number labels
    ticksHtml,

    // Needle group (will be rotated)
    '<g class="gd-needle gd-animate" id="' + (container.id || 'gd') + '_needle" style="transform:rotate(0deg)">',
    // Needle line
    '<line x1="' + cx + '" y1="' + cy + '" x2="' + needleEnd.x + '" y2="' + needleEnd.y +
      '" stroke="var(--a1)" stroke-width="3" stroke-linecap="round"/>',
    // Needle tip dot
    '<circle cx="' + needleDotPos.x + '" cy="' + needleDotPos.y +
      '" r="4" fill="var(--a1)"/>',
    '</g>',

    // Center circle background
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + innerR +
      '" fill="var(--card)" stroke="var(--border)" stroke-width="1.5"/>',

    // Center setting text
    '<text x="' + cx + '" y="' + (cy + 7) +
      '" text-anchor="middle" fill="var(--t1)" font-size="20" font-weight="900" font-family="Inter,Cairo,sans-serif" id="' +
      (container.id || 'gd') + '_val">' + _gdFormatSetting(setting) + '</text>',

    '</svg>',

    // Info bar below dial
    '<div class="grind-info" id="' + (container.id || 'gd') + '_info">',
    '<span class="gi-micron">~' + grindToMicrons(setting) + 'μm</span>',
    '<span class="gi-sep">—</span>',
    getGrindDescription(setting),
    '</div>',
  ].join('\n');

  // Wrap
  container.innerHTML = '<div class="grind-dial-wrap">' + svgHtml + '</div>';

  // ── Get references ──
  var svgEl = container.querySelector('.grind-dial');
  var needleGroup = container.querySelector('.gd-needle');
  var valEl = container.querySelector('[id$="_val"]');
  var infoEl = container.querySelector('.grind-info');

  // ── State ──
  var state = {
    setting: setting,
    dragging: false,
    oMin: oMin,
    oMax: oMax,
  };

  // ── Update display ──
  function updateDisplay(animated) {
    var angle = _gdSettingToAngle(state.setting);
    // Needle: we redraw the line endpoints since it's simpler for SVG
    // Actually, we rotate the group. But group contains absolute coords.
    // Better approach: rebuild needle line positions.
    var nEnd = _gdPolar(cx, cy, outerR - 14, angle);
    var nDot = _gdPolar(cx, cy, outerR - 10, angle);
    var line = needleGroup.querySelector('line');
    var dot = needleGroup.querySelector('circle');
    if (line) {
      line.setAttribute('x2', nEnd.x);
      line.setAttribute('y2', nEnd.y);
    }
    if (dot) {
      dot.setAttribute('cx', nDot.x);
      dot.setAttribute('cy', nDot.y);
    }

    // Center text
    valEl.textContent = _gdFormatSetting(state.setting);

    // Info bar
    var microns = grindToMicrons(state.setting);
    var desc = getGrindDescription(state.setting);
    infoEl.innerHTML = '<span class="gi-micron">~' + microns + 'μm</span>' +
      '<span class="gi-sep">—</span>' + desc;

    // Pulse feedback
    if (animated) {
      svgEl.classList.remove('gd-pulse');
      void svgEl.offsetWidth; // reflow
      svgEl.classList.add('gd-pulse');
    }
  }

  // ── Touch / Mouse interaction ──
  function getAngleFromEvent(e) {
    var rect = svgEl.getBoundingClientRect();
    var svgCx = rect.left + rect.width / 2;
    var svgCy = rect.top + rect.height / 2;
    var clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    var dx = clientX - svgCx;
    var dy = clientY - svgCy;
    var angle = Math.atan2(dy, dx) * 180 / Math.PI;
    return angle;
  }

  function handleStart(e) {
    e.preventDefault();
    state.dragging = true;
    needleGroup.classList.remove('gd-animate');
    handleMove(e);
  }

  function handleMove(e) {
    if (!state.dragging) return;
    e.preventDefault();
    var angle = getAngleFromEvent(e);
    var newSetting = _gdAngleToSetting(angle);
    if (newSetting !== state.setting) {
      state.setting = newSetting;
      updateDisplay(true);
    }
  }

  function handleEnd(e) {
    if (!state.dragging) return;
    state.dragging = false;
    needleGroup.classList.add('gd-animate');
  }

  // Touch events
  svgEl.addEventListener('touchstart', handleStart, { passive: false });
  document.addEventListener('touchmove', function(e) { if (state.dragging) handleMove(e); }, { passive: false });
  document.addEventListener('touchend', handleEnd);

  // Mouse events (for desktop testing)
  svgEl.addEventListener('mousedown', handleStart);
  document.addEventListener('mousemove', function(e) { if (state.dragging) handleMove(e); });
  document.addEventListener('mouseup', handleEnd);

  // ── Public API ──
  var api = {
    getSetting: function() { return state.setting; },
    setSetting: function(n) {
      n = Math.max(GD_MIN_SETTING, Math.min(GD_MAX_SETTING, Math.round(n * 2) / 2));
      state.setting = n;
      needleGroup.classList.add('gd-animate');
      updateDisplay(false);
    },
    getElement: function() { return container; },
    destroy: function() {
      svgEl.removeEventListener('touchstart', handleStart);
      svgEl.removeEventListener('mousedown', handleStart);
    }
  };

  return api;
}


// ═══════════════════════════════════════════════════════════════════════════
// Format setting for display (e.g. 4 → "4", 4.5 → "4.5")
// ═══════════════════════════════════════════════════════════════════════════
function _gdFormatSetting(s) {
  return (s % 1 === 0) ? String(s) : s.toFixed(1);
}
