// ═══════════════════════════════════════════════════════════════════════════
// V60 Masters — Brew Along Mode (Voice Guidance)
// Uses Web Speech API for Arabic voice guidance during brewing
// ═══════════════════════════════════════════════════════════════════════════

/* eslint-disable no-var */

var V60_BREW_ALONG = { enabled: false, voice: null, supported: false, lastSpokenStep: -1, lastCountdown: -1 };

// ─── INIT ────────────────────────────────────────────────────────────────────

function initBrewAlong() {
  if (!('speechSynthesis' in window)) {
    V60_BREW_ALONG.supported = false;
    return;
  }
  V60_BREW_ALONG.supported = true;

  function pickVoice() {
    var voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    // Try to find Arabic voice
    var arVoice = null;
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].lang && voices[i].lang.indexOf('ar') === 0) {
        arVoice = voices[i];
        break;
      }
    }
    V60_BREW_ALONG.voice = arVoice || voices[0] || null;
  }

  pickVoice();
  // Some browsers load voices async
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  // Restore saved preference
  try {
    var saved = localStorage.getItem('v60brewAlong');
    if (saved === '1') V60_BREW_ALONG.enabled = true;
  } catch (e) {}
}

// ─── TOGGLE ──────────────────────────────────────────────────────────────────

function toggleBrewAlong() {
  V60_BREW_ALONG.enabled = !V60_BREW_ALONG.enabled;

  // Update UI
  var toggle = document.getElementById('brewAlongToggle');
  if (toggle) {
    toggle.classList.toggle('ba-on', V60_BREW_ALONG.enabled);
  }
  var dot = document.getElementById('brewAlongDot');
  if (dot) {
    dot.style.opacity = V60_BREW_ALONG.enabled ? '1' : '0';
  }

  // Save preference
  try {
    localStorage.setItem('v60brewAlong', V60_BREW_ALONG.enabled ? '1' : '0');
  } catch (e) {}

  // Confirm with short speech
  if (V60_BREW_ALONG.enabled) {
    _speak('المرشد الصوتي جاهز');
  } else {
    speechSynthesis.cancel();
  }
}
window.toggleBrewAlong = toggleBrewAlong;

// ─── SPEAK HELPERS ───────────────────────────────────────────────────────────

function _speak(text) {
  if (!V60_BREW_ALONG.supported) return;
  try {
    speechSynthesis.cancel();
    var utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'ar-SA';
    utt.rate = 0.95;
    utt.pitch = 1;
    if (V60_BREW_ALONG.voice) utt.voice = V60_BREW_ALONG.voice;
    speechSynthesis.speak(utt);
  } catch (e) {}
}

function speakStep(stepLabel, pourAmount, totalWater) {
  if (!V60_BREW_ALONG.enabled) return;
  var msg = 'الخطوة التالية: ' + stepLabel;
  if (pourAmount && pourAmount > 0) {
    msg += '. صبّ ' + numberToArabicWord(pourAmount) + ' جرام';
  }
  if (totalWater && totalWater > 0) {
    msg += '، الإجمالي ' + numberToArabicWord(totalWater) + ' جرام';
  }
  _speak(msg);
}
window.speakStep = speakStep;

function speakCountdown(seconds) {
  if (!V60_BREW_ALONG.enabled) return;
  if (seconds === 5) {
    _speak('خمس ثواني');
  }
}
window.speakCountdown = speakCountdown;

function speakFinish() {
  if (!V60_BREW_ALONG.enabled) return;
  _speak('تم التحضير! استمتع بقهوتك');
}
window.speakFinish = speakFinish;

// ─── TOGGLE UI ───────────────────────────────────────────────────────────────

function renderBrewAlongToggle() {
  if (!V60_BREW_ALONG.supported) return '';
  var isOn = V60_BREW_ALONG.enabled;
  return '<div class="ba-wrap" id="brewAlongToggle" onclick="toggleBrewAlong()" ' +
    (isOn ? 'class="ba-wrap ba-on"' : '') + '>' +
    '<div class="ba-track">' +
    '<div class="ba-thumb"></div>' +
    '</div>' +
    '<span class="ba-label">\uD83D\uDD0A المرشد الصوتي</span>' +
    '<span class="ba-dot" id="brewAlongDot" style="opacity:' + (isOn ? '1' : '0') + '"></span>' +
    '</div>';
}
window.renderBrewAlongToggle = renderBrewAlongToggle;

// ─── NUMBER TO ARABIC WORDS ─────────────────────────────────────────────────

function numberToArabicWord(n) {
  n = Math.round(n);
  var map = {
    0: 'صفر',
    5: 'خمسة',
    10: 'عشرة',
    15: 'خمسطعش',
    20: 'عشرين',
    25: 'خمسة وعشرين',
    30: 'ثلاثين',
    35: 'خمسة وثلاثين',
    40: 'أربعين',
    45: 'خمسة وأربعين',
    50: 'خمسين',
    55: 'خمسة وخمسين',
    60: 'ستين',
    65: 'خمسة وستين',
    70: 'سبعين',
    75: 'خمسة وسبعين',
    80: 'ثمانين',
    85: 'خمسة وثمانين',
    90: 'تسعين',
    95: 'خمسة وتسعين',
    100: 'مية',
    105: 'مية وخمسة',
    110: 'مية وعشرة',
    120: 'مية وعشرين',
    130: 'مية وثلاثين',
    140: 'مية وأربعين',
    150: 'مية وخمسين',
    160: 'مية وستين',
    170: 'مية وسبعين',
    180: 'مية وثمانين',
    190: 'مية وتسعين',
    200: 'ميتين',
    230: 'ميتين وثلاثين',
    235: 'ميتين وخمسة وثلاثين',
    240: 'ميتين وأربعين',
    250: 'ميتين وخمسين',
    270: 'ميتين وسبعين',
    300: 'ثلاثمية',
    330: 'ثلاثمية وثلاثين',
    350: 'ثلاثمية وخمسين',
    400: 'أربعمية',
    500: 'خمسمية',
    600: 'ستمية'
  };
  if (map[n] !== undefined) return map[n];

  // Build from parts for unmapped numbers
  if (n > 0 && n < 1000) {
    var hundreds = Math.floor(n / 100);
    var remainder = n % 100;
    var tens = Math.floor(remainder / 10) * 10;
    var ones = remainder % 10;

    var hundredWords = ['', 'مية', 'ميتين', 'ثلاثمية', 'أربعمية', 'خمسمية', 'ستمية', 'سبعمية', 'ثمنمية', 'تسعمية'];
    var tenWords = ['', 'عشرة', 'عشرين', 'ثلاثين', 'أربعين', 'خمسين', 'ستين', 'سبعين', 'ثمانين', 'تسعين'];
    var oneWords = ['', 'واحد', 'اثنين', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];

    var parts = [];
    if (hundreds > 0) parts.push(hundredWords[hundreds]);
    if (ones > 0 && tens > 0) {
      parts.push(oneWords[ones] + ' و' + tenWords[tens / 10]);
    } else if (tens > 0) {
      parts.push(tenWords[tens / 10]);
    } else if (ones > 0) {
      parts.push(oneWords[ones]);
    }
    return parts.join(' و');
  }
  // Fallback: just return the number as string
  return String(n);
}
window.numberToArabicWord = numberToArabicWord;

// ─── RESET STATE ─────────────────────────────────────────────────────────────

function resetBrewAlongState() {
  V60_BREW_ALONG.lastSpokenStep = -1;
  V60_BREW_ALONG.lastCountdown = -1;
  try { speechSynthesis.cancel(); } catch (e) {}
}
window.resetBrewAlongState = resetBrewAlongState;

// ─── INJECT CSS ──────────────────────────────────────────────────────────────

(function injectBrewAlongCSS() {
  var style = document.createElement('style');
  style.textContent =
    '.ba-wrap{display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 0;user-select:none;-webkit-user-select:none;margin-top:4px}' +
    '.ba-track{width:38px;height:22px;border-radius:11px;background:var(--border);position:relative;transition:background .25s;flex-shrink:0}' +
    '.ba-on .ba-track{background:var(--a1)}' +
    '.ba-thumb{width:18px;height:18px;border-radius:50%;background:#fff;position:absolute;top:2px;right:2px;transition:transform .25s;box-shadow:0 1px 3px rgba(0,0,0,.2)}' +
    '.ba-on .ba-thumb{transform:translateX(-16px)}' +
    '.ba-label{font-size:11px;color:var(--t3);font-family:Cairo;font-weight:700;transition:color .25s}' +
    '.ba-on .ba-label{color:var(--a1)}' +
    '.ba-dot{width:6px;height:6px;border-radius:50%;background:var(--ok);transition:opacity .25s;flex-shrink:0}';
  document.head.appendChild(style);
})();

// Init on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBrewAlong);
} else {
  initBrewAlong();
}
