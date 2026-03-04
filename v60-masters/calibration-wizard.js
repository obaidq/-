// ═══════════════════════════════════════════════════════════════════════════
// V60 Masters — Grinder Calibration Wizard (ODE Fellow 2)
// Guided step-by-step calibration flow with taste feedback
// Depends on: grind-dial.js (renderGrindDial, grindToMicrons, getGrindDescription)
// ═══════════════════════════════════════════════════════════════════════════

/* eslint-disable no-var */

// ─── CSS Injection ───
(function(){
  var style = document.createElement('style');
  style.textContent = [
    // Modal overlay
    '.cw-overlay{',
    '  position:fixed;inset:0;z-index:800;',
    '  background:rgba(0,0,0,.55);',
    '  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);',
    '  display:none;align-items:center;justify-content:center;padding:16px;',
    '}',
    '.cw-overlay.on{display:flex;}',

    // Modal card
    '.cw-card{',
    '  background:var(--card);border:1px solid var(--border);',
    '  border-radius:var(--r,20px);padding:24px 20px 20px;',
    '  width:100%;max-width:420px;max-height:88vh;overflow-y:auto;',
    '  animation:su .35s ease;box-shadow:var(--sh3);',
    '  position:relative;direction:rtl;',
    '}',

    // Close button
    '.cw-close{',
    '  position:absolute;top:12px;left:12px;font-size:20px;color:var(--t3);',
    '  padding:8px;cursor:pointer;transition:color .2s;background:none;border:none;',
    '  font-family:inherit;line-height:1;',
    '}',
    '.cw-close:hover{color:var(--t1);}',

    // Step indicator
    '.cw-steps{',
    '  display:flex;align-items:center;justify-content:center;gap:8px;',
    '  margin-bottom:16px;',
    '}',
    '.cw-step-dot{',
    '  width:8px;height:8px;border-radius:50%;background:var(--border);',
    '  transition:all .3s;',
    '}',
    '.cw-step-dot.on{background:var(--a1);transform:scale(1.3);}',
    '.cw-step-dot.done{background:var(--ok,#2D9B5E);}',
    '.cw-step-line{width:24px;height:2px;background:var(--border);border-radius:1px;transition:background .3s;}',
    '.cw-step-line.done{background:var(--ok,#2D9B5E);}',

    // Title
    '.cw-title{',
    '  text-align:center;font-size:17px;font-weight:900;',
    '  margin-bottom:4px;color:var(--t1);font-family:"Cairo",sans-serif;',
    '}',
    '.cw-subtitle{',
    '  text-align:center;font-size:12px;color:var(--t3);',
    '  margin-bottom:16px;font-family:"Cairo",sans-serif;',
    '}',

    // Dial container inside wizard
    '.cw-dial{margin:0 auto 16px;max-width:200px;}',

    // Feedback buttons
    '.cw-feedback{display:flex;gap:10px;margin:16px 0;justify-content:center;flex-wrap:wrap;}',
    '.cw-fb-btn{',
    '  flex:1;min-width:90px;max-width:140px;padding:14px 10px;',
    '  border-radius:var(--r2,14px);border:2px solid var(--border);',
    '  background:var(--card);cursor:pointer;text-align:center;',
    '  transition:all .2s;font-family:"Cairo",sans-serif;',
    '}',
    '.cw-fb-btn:active{transform:scale(.94);}',
    '.cw-fb-btn .cw-fb-icon{font-size:28px;margin-bottom:4px;display:block;}',
    '.cw-fb-btn .cw-fb-label{font-size:12px;font-weight:700;color:var(--t1);display:block;}',
    '.cw-fb-btn .cw-fb-hint{font-size:9px;color:var(--t3);display:block;margin-top:2px;}',

    // Button color variants
    '.cw-fb-btn[data-fb=sour]:hover,.cw-fb-btn[data-fb=sour]:active{',
    '  border-color:var(--warn,#E0960A);background:var(--warnBg,#FFF4D9);',
    '}',
    '.cw-fb-btn[data-fb=bitter]:hover,.cw-fb-btn[data-fb=bitter]:active{',
    '  border-color:var(--hot,#D95040);background:var(--hotBg,#FDE8E5);',
    '}',
    '.cw-fb-btn[data-fb=perfect]:hover,.cw-fb-btn[data-fb=perfect]:active{',
    '  border-color:var(--ok,#2D9B5E);background:var(--okBg,#DDF5E7);',
    '}',

    // History timeline
    '.cw-history{margin:14px 0 8px;}',
    '.cw-history-title{font-size:11px;font-weight:700;color:var(--t3);margin-bottom:8px;font-family:"Cairo";}',
    '.cw-history-list{display:flex;flex-direction:column;gap:6px;}',
    '.cw-hist-item{',
    '  display:flex;align-items:center;gap:10px;padding:8px 12px;',
    '  background:var(--bg2);border-radius:var(--r3,10px);font-size:11px;',
    '  font-family:"Cairo",sans-serif;color:var(--t2);',
    '  animation:fi .3s ease backwards;',
    '}',
    '.cw-hist-icon{font-size:16px;flex-shrink:0;}',
    '.cw-hist-setting{',
    '  font-family:"Inter","Cairo",sans-serif;font-weight:800;color:var(--a1);',
    '  direction:ltr;display:inline;unicode-bidi:embed;min-width:28px;',
    '}',
    '.cw-hist-arrow{color:var(--t4);font-size:14px;}',

    // Action buttons
    '.cw-actions{display:flex;gap:10px;margin-top:16px;justify-content:center;}',
    '.cw-btn{',
    '  padding:12px 24px;border-radius:24px;font-size:13px;font-weight:700;',
    '  font-family:"Cairo",sans-serif;border:none;cursor:pointer;transition:all .2s;',
    '}',
    '.cw-btn:active{transform:scale(.95);}',
    '.cw-btn-primary{',
    '  background:var(--a1);color:#fff;box-shadow:0 2px 8px rgba(198,124,78,0.25);',
    '}',
    '.cw-btn-secondary{',
    '  background:var(--bg2);color:var(--t2);border:1px solid var(--border);',
    '}',

    // Saved confirmation
    '.cw-saved{',
    '  text-align:center;padding:20px 0;',
    '}',
    '.cw-saved-icon{font-size:48px;margin-bottom:12px;display:block;}',
    '.cw-saved-msg{font-size:15px;font-weight:700;color:var(--t1);margin-bottom:4px;}',
    '.cw-saved-detail{font-size:12px;color:var(--t3);}',

    // Badge
    '.cw-badge{',
    '  display:inline-flex;align-items:center;gap:4px;',
    '  padding:4px 10px;border-radius:14px;font-size:10px;font-weight:700;',
    '  background:var(--a1);color:#fff;font-family:"Cairo",sans-serif;',
    '  direction:rtl;',
    '}',
    '.cw-badge .cw-badge-val{',
    '  font-family:"Inter",sans-serif;font-weight:800;direction:ltr;',
    '  display:inline;unicode-bidi:embed;',
    '}',
  ].join('\n');
  document.head.appendChild(style);
})();


// ─── localStorage key ───
var CW_STORAGE_KEY = 'v60cal';


// ═══════════════════════════════════════════════════════════════════════════
// saveCalibration — Save calibration result to localStorage
// ═══════════════════════════════════════════════════════════════════════════
function saveCalibration(recipeId, setting, notes) {
  var data = {};
  try { data = JSON.parse(localStorage.getItem(CW_STORAGE_KEY)) || {}; } catch(e) {}
  data[recipeId] = {
    setting: setting,
    date: new Date().toISOString(),
    notes: notes || ''
  };
  localStorage.setItem(CW_STORAGE_KEY, JSON.stringify(data));
}


// ═══════════════════════════════════════════════════════════════════════════
// getCalibration — Get saved calibration for a recipe
// ═══════════════════════════════════════════════════════════════════════════
function getCalibration(recipeId) {
  try {
    var data = JSON.parse(localStorage.getItem(CW_STORAGE_KEY)) || {};
    return data[recipeId] || null;
  } catch(e) {
    return null;
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// calculateNextSetting — Determine next grind setting based on taste feedback
// ═══════════════════════════════════════════════════════════════════════════
function calculateNextSetting(currentSetting, feedback) {
  var next = currentSetting;
  if (feedback === 'sour') {
    next = currentSetting - 0.5; // finer grind
  } else if (feedback === 'bitter') {
    next = currentSetting + 0.5; // coarser grind
  }
  // Clamp between 1 and 11
  return Math.max(1, Math.min(11, next));
}


// ═══════════════════════════════════════════════════════════════════════════
// renderCalibrationBadge — Returns HTML badge if calibration exists
// ═══════════════════════════════════════════════════════════════════════════
function renderCalibrationBadge(recipeId) {
  var cal = getCalibration(recipeId);
  if (!cal) return '';
  var s = (cal.setting % 1 === 0) ? String(cal.setting) : cal.setting.toFixed(1);
  return '<span class="cw-badge">\u2699\uFE0F \u0625\u0639\u062F\u0627\u062F\u0643: <span class="cw-badge-val">' + s + '</span></span>';
}


// ═══════════════════════════════════════════════════════════════════════════
// openCalibrationWizard — Main entry: opens the calibration modal
// ═══════════════════════════════════════════════════════════════════════════
function openCalibrationWizard(recipeId, recipeName, oMin, oMax) {
  // Check dependency
  if (typeof renderGrindDial !== 'function') {
    console.warn('calibration-wizard: grind-dial.js not loaded yet');
    return;
  }

  // Check if existing calibration
  var existingCal = getCalibration(recipeId);
  var initialSetting = existingCal
    ? existingCal.setting
    : Math.round(((oMin + oMax) / 2) * 2) / 2;

  // State
  var currentStep = 1; // 1=suggest, 2=feedback, 3=saved
  var currentSetting = initialSetting;
  var history = [];
  var dialApi = null;

  // ── Create overlay ──
  var overlay = document.createElement('div');
  overlay.className = 'cw-overlay';
  overlay.id = 'cwOverlay';

  function close() {
    overlay.classList.remove('on');
    setTimeout(function() { overlay.remove(); }, 300);
  }

  // Close on backdrop click
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) close();
  });

  // ── Render step ──
  function render() {
    var stepsHtml = _cwRenderSteps(currentStep);
    var html = '';

    if (currentStep === 1) {
      // Step 1: Suggested setting
      html = [
        '<div class="cw-card">',
        '<button class="cw-close" onclick="this.closest(\'.cw-overlay\').classList.remove(\'on\');setTimeout(function(){var o=document.getElementById(\'cwOverlay\');if(o)o.remove();},300)">\u2715</button>',
        stepsHtml,
        '<div class="cw-title">\u0645\u0639\u0627\u064A\u0631\u0629 \u0627\u0644\u0637\u062D\u0646</div>',
        '<div class="cw-subtitle">' + (recipeName || '\u0648\u0635\u0641\u0629 #' + recipeId) + '</div>',
        '<div class="cw-dial" id="cwDial"></div>',
        '<div style="text-align:center;font-size:12px;color:var(--t3);margin-bottom:12px;font-family:Cairo">',
        '\u0627\u0644\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0642\u062A\u0631\u062D \u0644\u0644\u0648\u0635\u0641\u0629: <b style="color:var(--a1);font-family:Inter">' + oMin + ' - ' + oMax + '</b>',
        '</div>',
        existingCal ? '<div style="text-align:center;font-size:11px;color:var(--ok);margin-bottom:12px;font-family:Cairo">\u0639\u0646\u062F\u0643 \u0625\u0639\u062F\u0627\u062F \u0645\u062D\u0641\u0648\u0638: ' + existingCal.setting + '</div>' : '',
        '<div style="text-align:center;font-size:12px;color:var(--t2);margin-bottom:16px;font-family:Cairo">',
        '\u062D\u0631\u0651\u0643 \u0627\u0644\u0645\u0624\u0634\u0631 \u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0637\u062D\u0646\u060C \u0623\u0648 \u0627\u0628\u062F\u0623 \u0628\u0627\u0644\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0642\u062A\u0631\u062D',
        '</div>',
        '<div class="cw-actions">',
        '<button class="cw-btn cw-btn-primary" id="cwStartBrew">\u062D\u0636\u0651\u0631 \u0628\u0647\u0627\u0644\u0625\u0639\u062F\u0627\u062F \u2615</button>',
        '</div>',
        '</div>',
      ].join('');
    } else if (currentStep === 2) {
      // Step 2: Taste feedback
      var historyHtml = _cwRenderHistory(history);
      html = [
        '<div class="cw-card">',
        '<button class="cw-close" onclick="this.closest(\'.cw-overlay\').classList.remove(\'on\');setTimeout(function(){var o=document.getElementById(\'cwOverlay\');if(o)o.remove();},300)">\u2715</button>',
        stepsHtml,
        '<div class="cw-title">\u0643\u064A\u0641 \u0643\u0627\u0646 \u0627\u0644\u0637\u0639\u0645\u061F</div>',
        '<div class="cw-subtitle">\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0637\u062D\u0646 \u0627\u0644\u062D\u0627\u0644\u064A: <b style="color:var(--a1);font-family:Inter">' + _cwFmt(currentSetting) + '</b></div>',
        '<div class="cw-dial" id="cwDial"></div>',
        '<div class="cw-feedback">',
        '<button class="cw-fb-btn" data-fb="sour" id="cwFbSour">',
        '<span class="cw-fb-icon">\uD83C\uDF4B</span>',
        '<span class="cw-fb-label">\u062D\u0627\u0645\u0636 / \u0645\u0627\u0626\u064A</span>',
        '<span class="cw-fb-hint">\u2190 \u0623\u0646\u0639\u0645</span>',
        '</button>',
        '<button class="cw-fb-btn" data-fb="perfect" id="cwFbPerfect">',
        '<span class="cw-fb-icon">\u2B50</span>',
        '<span class="cw-fb-label">\u0645\u0645\u062A\u0627\u0632!</span>',
        '<span class="cw-fb-hint">\u0627\u062D\u0641\u0638</span>',
        '</button>',
        '<button class="cw-fb-btn" data-fb="bitter" id="cwFbBitter">',
        '<span class="cw-fb-icon">\uD83D\uDCA2</span>',
        '<span class="cw-fb-label">\u0645\u0631 / \u0642\u0627\u0633\u064A</span>',
        '<span class="cw-fb-hint">\u0623\u062E\u0634\u0646 \u2192</span>',
        '</button>',
        '</div>',
        historyHtml,
        '</div>',
      ].join('');
    } else if (currentStep === 3) {
      // Step 3: Saved
      html = [
        '<div class="cw-card">',
        '<button class="cw-close" onclick="this.closest(\'.cw-overlay\').classList.remove(\'on\');setTimeout(function(){var o=document.getElementById(\'cwOverlay\');if(o)o.remove();},300)">\u2715</button>',
        stepsHtml,
        '<div class="cw-saved">',
        '<span class="cw-saved-icon">\u2705</span>',
        '<div class="cw-saved-msg">\u062A\u0645 \u062D\u0641\u0638 \u0625\u0639\u062F\u0627\u062F\u0643!</div>',
        '<div class="cw-saved-detail" style="margin-bottom:12px;">',
        '\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0637\u062D\u0646: <b style="color:var(--a1);font-family:Inter">' + _cwFmt(currentSetting) + '</b>',
        '<br>~' + grindToMicrons(currentSetting) + '\u03BCm \u2014 ' + getGrindDescription(currentSetting),
        '</div>',
        '</div>',
        _cwRenderHistory(history),
        '<div class="cw-actions" style="margin-top:18px;">',
        '<button class="cw-btn cw-btn-primary" id="cwDone">\u062A\u0645\u0627\u0645 \uD83D\uDC4C</button>',
        '</div>',
        '</div>',
      ].join('');
    }

    overlay.innerHTML = html;

    // ── Initialize dial if in step 1 or 2 ──
    var dialContainer = overlay.querySelector('#cwDial');
    if (dialContainer) {
      dialApi = renderGrindDial(dialContainer, oMin, oMax, currentSetting);
    }

    // ── Bind events ──
    if (currentStep === 1) {
      var startBtn = overlay.querySelector('#cwStartBrew');
      if (startBtn) {
        startBtn.addEventListener('click', function() {
          // Get setting from dial (user may have adjusted)
          if (dialApi) currentSetting = dialApi.getSetting();
          currentStep = 2;
          render();
        });
      }
    } else if (currentStep === 2) {
      // Feedback buttons
      var sourBtn = overlay.querySelector('#cwFbSour');
      var bitterBtn = overlay.querySelector('#cwFbBitter');
      var perfectBtn = overlay.querySelector('#cwFbPerfect');

      if (sourBtn) sourBtn.addEventListener('click', function() {
        handleFeedback('sour');
      });
      if (bitterBtn) bitterBtn.addEventListener('click', function() {
        handleFeedback('bitter');
      });
      if (perfectBtn) perfectBtn.addEventListener('click', function() {
        handleFeedback('perfect');
      });
    } else if (currentStep === 3) {
      var doneBtn = overlay.querySelector('#cwDone');
      if (doneBtn) doneBtn.addEventListener('click', close);
    }
  }

  // ── Handle taste feedback ──
  function handleFeedback(feedback) {
    var prevSetting = currentSetting;
    var feedbackLabel = feedback === 'sour'
      ? '\u062D\u0627\u0645\u0636'
      : feedback === 'bitter'
        ? '\u0645\u0631'
        : '\u0645\u0645\u062A\u0627\u0632';
    var feedbackIcon = feedback === 'sour' ? '\uD83C\uDF4B' : feedback === 'bitter' ? '\uD83D\uDCA2' : '\u2B50';

    history.push({
      setting: prevSetting,
      feedback: feedback,
      label: feedbackLabel,
      icon: feedbackIcon,
    });

    if (feedback === 'perfect') {
      // Save and go to step 3
      saveCalibration(recipeId, currentSetting);
      currentStep = 3;
      render();
    } else {
      var next = calculateNextSetting(currentSetting, feedback);
      if (next === currentSetting) {
        // Already at the limit
        history[history.length - 1].note = '\u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F';
      }
      currentSetting = next;
      // Re-render step 2 with updated setting
      render();
    }
  }

  // ── Initial render ──
  document.body.appendChild(overlay);
  render();
  // Show with slight delay for animation
  requestAnimationFrame(function() {
    overlay.classList.add('on');
  });
}


// ═══════════════════════════════════════════════════════════════════════════
// Internal helpers
// ═══════════════════════════════════════════════════════════════════════════

function _cwFmt(s) {
  return (s % 1 === 0) ? String(s) : s.toFixed(1);
}

function _cwRenderSteps(currentStep) {
  var dots = '';
  for (var i = 1; i <= 3; i++) {
    var cls = 'cw-step-dot';
    if (i === currentStep) cls += ' on';
    else if (i < currentStep) cls += ' done';
    dots += '<span class="' + cls + '"></span>';
    if (i < 3) {
      var lineCls = 'cw-step-line';
      if (i < currentStep) lineCls += ' done';
      dots += '<span class="' + lineCls + '"></span>';
    }
  }
  return '<div class="cw-steps">' + dots + '</div>';
}

function _cwRenderHistory(history) {
  if (!history || history.length === 0) return '';
  var items = '';
  for (var i = 0; i < history.length; i++) {
    var h = history[i];
    var arrow = '';
    if (h.feedback === 'sour') arrow = '<span class="cw-hist-arrow">\u2193</span> \u0623\u0646\u0639\u0645';
    else if (h.feedback === 'bitter') arrow = '<span class="cw-hist-arrow">\u2191</span> \u0623\u062E\u0634\u0646';
    else arrow = '<span style="color:var(--ok)">\u2713 \u0645\u0636\u0628\u0648\u0637</span>';

    items += '<div class="cw-hist-item" style="animation-delay:' + (i * 0.05) + 's">' +
      '<span class="cw-hist-icon">' + h.icon + '</span>' +
      '<span class="cw-hist-setting">' + _cwFmt(h.setting) + '</span>' +
      '<span>' + h.label + '</span>' +
      '<span style="margin-inline-start:auto;font-size:10px;">' + arrow + '</span>' +
      (h.note ? '<span style="font-size:9px;color:var(--warn)"> (' + h.note + ')</span>' : '') +
      '</div>';
  }
  return '<div class="cw-history">' +
    '<div class="cw-history-title">\u0633\u062C\u0644 \u0627\u0644\u062A\u0639\u062F\u064A\u0644\u0627\u062A</div>' +
    '<div class="cw-history-list">' + items + '</div></div>';
}
