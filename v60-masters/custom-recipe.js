// ═══════════════════════════════════════════════════════════════════════════
// V60 Masters — Custom Recipe Builder
// Allows users to create, edit, and manage their own V60 recipes
// ═══════════════════════════════════════════════════════════════════════════

/* eslint-disable no-var */

var CUSTOM_RECIPE_STORAGE_KEY = 'v60custom';
var customSteps = [];
var customEditId = null;

// ─── LOAD CUSTOM RECIPES ─────────────────────────────────────────────────────

function loadCustomRecipes() {
  try {
    var raw = localStorage.getItem(CUSTOM_RECIPE_STORAGE_KEY);
    if (!raw) return [];
    var recipes = JSON.parse(raw);
    if (!Array.isArray(recipes)) return [];
    return recipes;
  } catch (e) {
    return [];
  }
}
window.loadCustomRecipes = loadCustomRecipes;

function mergeCustomRecipes() {
  var customs = loadCustomRecipes();
  if (!customs.length) return;
  for (var i = 0; i < customs.length; i++) {
    var exists = false;
    for (var j = 0; j < D.length; j++) {
      if (D[j].id === customs[i].id) { exists = true; break; }
    }
    if (!exists) D.push(customs[i]);
  }
}
window.mergeCustomRecipes = mergeCustomRecipes;

// ─── SAVE ────────────────────────────────────────────────────────────────────

function _getNextCustomId() {
  var customs = loadCustomRecipes();
  var maxId = 999;
  for (var i = 0; i < customs.length; i++) {
    if (customs[i].id > maxId) maxId = customs[i].id;
  }
  return maxId + 1;
}

function saveCustomRecipe(recipe) {
  // Assign ID
  if (!recipe.id || recipe.id < 1000) {
    recipe.id = _getNextCustomId();
  }
  recipe.custom = true;

  // Calculate derived fields
  recipe.rn = recipe.water > 0 && recipe.dose > 0 ? +(recipe.water / recipe.dose).toFixed(1) : 15;
  recipe.ratio = '1:' + recipe.rn;

  // Calculate total time from steps
  var totalSec = 0;
  if (recipe.steps && recipe.steps.length) {
    var lastStep = recipe.steps[recipe.steps.length - 1];
    if (lastStep.t && lastStep.t !== '—' && lastStep.t !== '\u2014') {
      var parts = lastStep.t.replace('~', '').split(':');
      if (parts.length === 2) {
        totalSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
    }
    // Add some drainage time estimate if not already included
    if (totalSec === 0) totalSec = 210; // 3:30 default
    totalSec += 60; // add ~1 min drain
  }
  recipe.ts = recipe.ts || totalSec;
  recipe.time = recipe.time || '~' + Math.floor(recipe.ts / 60) + ':' + String(recipe.ts % 60).padStart(2, '0');

  // Calculate step totals
  var runningTotal = 0;
  for (var i = 0; i < recipe.steps.length; i++) {
    var st = recipe.steps[i];
    runningTotal += (st.add || 0);
    st.total = runningTotal;
  }

  // Ensure all required fields exist
  recipe.ex = recipe.ex || '';
  recipe.m = recipe.m || recipe.mA || '';
  recipe.mA = recipe.mA || recipe.m || '';
  recipe.type = recipe.type || 'hot';
  recipe.dose = recipe.dose || 20;
  recipe.water = recipe.water || 300;
  recipe.ice = recipe.ice || 0;
  recipe.temp = recipe.temp || 93;
  recipe.tn = recipe.tn || recipe.temp + '°C';
  recipe.ode = recipe.ode || '';
  recipe.oMin = recipe.oMin || 0;
  recipe.oMax = recipe.oMax || 0;
  recipe.agit = recipe.agit || '';
  recipe.st = 'مخصصة';
  recipe.diff = recipe.diff || 'مبتدئ';
  recipe.pop = recipe.pop || 3;
  recipe.fl = recipe.fl || { sw: 3, ac: 3, bd: 3, cl: 3 };
  recipe.bio = recipe.bio || 'وصفة مخصصة';
  recipe.bioLong = recipe.bioLong || recipe.bio;
  recipe.bestFor = recipe.bestFor || [];
  recipe.bestBeans = recipe.bestBeans || [];
  recipe.tags = recipe.tags || ['custom', 'مخصصة'];
  recipe.theory = recipe.theory || '';

  // Save to localStorage
  var customs = loadCustomRecipes();
  var existIdx = -1;
  for (var j = 0; j < customs.length; j++) {
    if (customs[j].id === recipe.id) { existIdx = j; break; }
  }
  if (existIdx >= 0) {
    customs[existIdx] = recipe;
  } else {
    customs.push(recipe);
  }

  try {
    localStorage.setItem(CUSTOM_RECIPE_STORAGE_KEY, JSON.stringify(customs));
  } catch (e) {
    _showToast('خطأ في الحفظ!', 'error');
    return false;
  }

  // Update global D array
  var dIdx = -1;
  for (var k = 0; k < D.length; k++) {
    if (D[k].id === recipe.id) { dIdx = k; break; }
  }
  if (dIdx >= 0) {
    D[dIdx] = recipe;
  } else {
    D.push(recipe);
  }

  _showToast('تم حفظ الوصفة بنجاح! ✨');
  return true;
}
window.saveCustomRecipe = saveCustomRecipe;

// ─── DELETE ──────────────────────────────────────────────────────────────────

function deleteCustomRecipe(id) {
  if (!confirm('متأكد تبي تحذف الوصفة؟ ما تقدر ترجّعها.')) return;

  var customs = loadCustomRecipes();
  customs = customs.filter(function (r) { return r.id !== id; });
  try {
    localStorage.setItem(CUSTOM_RECIPE_STORAGE_KEY, JSON.stringify(customs));
  } catch (e) {}

  // Remove from D
  for (var i = D.length - 1; i >= 0; i--) {
    if (D[i].id === id) { D.splice(i, 1); break; }
  }

  _showToast('تم حذف الوصفة');

  // Close modal if open
  closeRecipeBuilder();

  // Re-render if renderCards exists
  if (typeof renderCards === 'function') renderCards();
}
window.deleteCustomRecipe = deleteCustomRecipe;

// ─── VALIDATE ────────────────────────────────────────────────────────────────

function validateRecipe(recipe) {
  var errors = [];

  if (!recipe.mA || !recipe.mA.trim()) errors.push('اسم الوصفة مطلوب');
  if (!recipe.dose || recipe.dose <= 0) errors.push('كمية البن لازم تكون أكبر من صفر');
  if (!recipe.water || recipe.water <= 0) errors.push('كمية الماء لازم تكون أكبر من صفر');
  if (!recipe.steps || recipe.steps.length === 0) errors.push('لازم تضيف خطوة وحدة على الأقل');

  // Check steps total water
  if (recipe.steps && recipe.steps.length > 0) {
    var totalAdd = 0;
    for (var i = 0; i < recipe.steps.length; i++) {
      totalAdd += (recipe.steps[i].add || 0);
    }
    var expectedTotal = recipe.water + (recipe.ice || 0);
    if (totalAdd > 0 && Math.abs(totalAdd - expectedTotal) > 5) {
      errors.push('مجموع الماء في الخطوات (' + totalAdd + 'g) ما يطابق الإجمالي (' + expectedTotal + 'g)');
    }
  }

  return { valid: errors.length === 0, errors: errors };
}
window.validateRecipe = validateRecipe;

// ─── OPEN RECIPE BUILDER ─────────────────────────────────────────────────────

function openRecipeBuilder(editId) {
  customEditId = editId || null;
  var recipe = null;

  if (customEditId) {
    for (var i = 0; i < D.length; i++) {
      if (D[i].id === customEditId) { recipe = D[i]; break; }
    }
  }

  // Default steps
  if (recipe && recipe.steps) {
    customSteps = JSON.parse(JSON.stringify(recipe.steps));
  } else {
    customSteps = [
      { l: 'التفتيح', add: 40, total: 40, t: '0:00', w: '45 ثانية', n: '', tmp: 93 }
    ];
  }

  var isEdit = !!recipe;
  var title = isEdit ? 'تعديل الوصفة' : 'إنشاء وصفة جديدة';
  var isIced = recipe ? recipe.type === 'iced' : false;

  var html =
    '<div class="crb-overlay" id="recipeBuilderOverlay" onclick="if(event.target===this)closeRecipeBuilder()">' +
    '<div class="crb-modal">' +
    // Header
    '<div class="crb-hd">' +
    '<h2>' + title + '</h2>' +
    '<button class="crb-close" onclick="closeRecipeBuilder()">\u2715</button>' +
    '</div>' +
    // Body
    '<div class="crb-body">' +

    // Recipe name
    _formGroup('اسم الوصفة *', '<input class="crb-input" id="crb_name" placeholder="مثال: وصفتي المميزة" value="' + _esc(recipe ? recipe.mA : '') + '">') +

    // Expert
    _formGroup('الخبير / المصدر', '<input class="crb-input" id="crb_expert" placeholder="مثال: أحمد" value="' + _esc(recipe ? recipe.ex : '') + '">') +

    // Type toggle
    _formGroup('نوع الوصفة',
      '<div class="crb-toggle-row">' +
      '<button class="crb-type-btn' + (!isIced ? ' crb-type-on' : '') + '" id="crb_type_hot" onclick="_setType(\'hot\')">☕ ساخنة</button>' +
      '<button class="crb-type-btn' + (isIced ? ' crb-type-on crb-type-iced' : '') + '" id="crb_type_iced" onclick="_setType(\'iced\')">🧊 مثلّجة</button>' +
      '</div>') +

    // Numbers row
    '<div class="crb-row">' +
    _formGroupInline('البن (g)', '<input class="crb-input crb-num" type="number" id="crb_dose" value="' + (recipe ? recipe.dose : 20) + '" min="1" onchange="_calcRatio()">') +
    _formGroupInline('الماء (g)', '<input class="crb-input crb-num" type="number" id="crb_water" value="' + (recipe ? recipe.water : 300) + '" min="1" onchange="_calcRatio()">') +
    _formGroupInline('الثلج (g)', '<input class="crb-input crb-num" type="number" id="crb_ice" value="' + (recipe ? recipe.ice || 0 : 0) + '" min="0" style="' + (isIced ? '' : 'opacity:.4') + '" ' + (isIced ? '' : 'disabled') + '>') +
    '</div>' +

    '<div class="crb-row">' +
    _formGroupInline('الحرارة (°C)', '<input class="crb-input crb-num" type="number" id="crb_temp" value="' + (recipe ? recipe.temp : 93) + '" min="0" max="100">') +
    _formGroupInline('النسبة', '<span class="crb-ratio" id="crb_ratio">1:' + (recipe ? recipe.rn : '15') + '</span>') +
    _formGroupInline('ODE', '<input class="crb-input crb-num" id="crb_ode" value="' + _esc(recipe ? recipe.ode : '4-5') + '" placeholder="4-5">') +
    '</div>' +

    // Difficulty
    _formGroup('المستوى',
      '<div class="crb-diff-row">' +
      '<button class="crb-diff-btn' + (_isDiff(recipe, 'مبتدئ') ? ' crb-diff-on' : '') + '" onclick="_setDiff(this,\'مبتدئ\')">مبتدئ</button>' +
      '<button class="crb-diff-btn' + (_isDiff(recipe, 'متوسط') ? ' crb-diff-on' : '') + '" onclick="_setDiff(this,\'متوسط\')">متوسط</button>' +
      '<button class="crb-diff-btn' + (_isDiff(recipe, 'متقدم') ? ' crb-diff-on' : '') + '" onclick="_setDiff(this,\'متقدم\')">متقدم</button>' +
      '</div>') +

    // Flavor profile
    '<div class="crb-section-title">الملف النكهي</div>' +
    _sliderRow('الحلاوة', 'sw', recipe ? recipe.fl.sw : 3) +
    _sliderRow('الحموضة', 'ac', recipe ? recipe.fl.ac : 3) +
    _sliderRow('القوام', 'bd', recipe ? recipe.fl.bd : 3) +
    _sliderRow('الصفاء', 'cl', recipe ? recipe.fl.cl : 3) +

    // Steps
    '<div class="crb-section-title">الخطوات *</div>' +
    '<div id="crb_steps_container">' + _renderStepRows() + '</div>' +
    '<button class="crb-add-step" onclick="addCustomStep()">+ إضافة خطوة</button>' +

    '</div>' +
    // Footer
    '<div class="crb-footer">' +
    (isEdit ? '<button class="crb-btn crb-btn-del" onclick="deleteCustomRecipe(' + customEditId + ')">🗑 حذف</button>' : '<span></span>') +
    '<div class="crb-footer-actions">' +
    '<button class="crb-btn crb-btn-cancel" onclick="closeRecipeBuilder()">إلغاء</button>' +
    '<button class="crb-btn crb-btn-save" onclick="_saveFromBuilder()">💾 حفظ الوصفة</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';

  // Insert modal
  var existing = document.getElementById('recipeBuilderOverlay');
  if (existing) existing.remove();
  var div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstChild);

  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}
window.openRecipeBuilder = openRecipeBuilder;

function closeRecipeBuilder() {
  var overlay = document.getElementById('recipeBuilderOverlay');
  if (overlay) overlay.remove();
  document.body.style.overflow = '';
  customSteps = [];
  customEditId = null;
}
window.closeRecipeBuilder = closeRecipeBuilder;

// ─── FORM HELPERS ────────────────────────────────────────────────────────────

function _esc(s) {
  if (!s) return '';
  return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _formGroup(label, input) {
  return '<div class="crb-fg"><label class="crb-lbl">' + label + '</label>' + input + '</div>';
}

function _formGroupInline(label, input) {
  return '<div class="crb-fg crb-fg-inline"><label class="crb-lbl">' + label + '</label>' + input + '</div>';
}

function _isDiff(recipe, val) {
  if (!recipe) return val === 'مبتدئ';
  return recipe.diff === val;
}

function _sliderRow(label, key, val) {
  return '<div class="crb-slider-row">' +
    '<span class="crb-slider-label">' + label + '</span>' +
    '<input type="range" min="1" max="5" value="' + (val || 3) + '" class="crb-slider" id="crb_fl_' + key + '">' +
    '<span class="crb-slider-val" id="crb_fl_' + key + '_val">' + (val || 3) + '</span>' +
    '</div>';
}

// ─── TYPE TOGGLE ─────────────────────────────────────────────────────────────

function _setType(type) {
  var hotBtn = document.getElementById('crb_type_hot');
  var icedBtn = document.getElementById('crb_type_iced');
  var iceInput = document.getElementById('crb_ice');

  if (type === 'iced') {
    hotBtn.classList.remove('crb-type-on');
    icedBtn.classList.add('crb-type-on', 'crb-type-iced');
    if (iceInput) { iceInput.disabled = false; iceInput.style.opacity = '1'; }
  } else {
    hotBtn.classList.add('crb-type-on');
    icedBtn.classList.remove('crb-type-on', 'crb-type-iced');
    if (iceInput) { iceInput.disabled = true; iceInput.style.opacity = '.4'; iceInput.value = '0'; }
  }
}
window._setType = _setType;

// ─── DIFFICULTY ──────────────────────────────────────────────────────────────

function _setDiff(btn, val) {
  var btns = btn.parentElement.querySelectorAll('.crb-diff-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove('crb-diff-on');
  btn.classList.add('crb-diff-on');
  btn.setAttribute('data-val', val);
}
window._setDiff = _setDiff;

// ─── RATIO CALC ──────────────────────────────────────────────────────────────

function _calcRatio() {
  var dose = parseFloat(document.getElementById('crb_dose').value) || 0;
  var water = parseFloat(document.getElementById('crb_water').value) || 0;
  var el = document.getElementById('crb_ratio');
  if (el && dose > 0 && water > 0) {
    el.textContent = '1:' + (water / dose).toFixed(1);
  }
}
window._calcRatio = _calcRatio;

// ─── STEP BUILDER ────────────────────────────────────────────────────────────

function _renderStepRows() {
  var html = '';
  for (var i = 0; i < customSteps.length; i++) {
    html += _renderOneStep(i);
  }
  return html;
}

function _renderOneStep(idx) {
  var s = customSteps[idx];
  return '<div class="custom-step" data-idx="' + idx + '">' +
    '<div style="display:flex;gap:8px;align-items:center">' +
    '<span class="step-num">' + (idx + 1) + '</span>' +
    '<input class="fs crb-step-input" placeholder="اسم الخطوة" value="' + _esc(s.l) + '" onchange="customSteps[' + idx + '].l=this.value" style="flex:1">' +
    '<input class="fs crb-step-input" type="number" placeholder="g" style="width:60px" value="' + (s.add || 0) + '" onchange="customSteps[' + idx + '].add=parseFloat(this.value)||0">' +
    '<button class="step-del" onclick="removeCustomStep(' + idx + ')">\u00D7</button>' +
    '</div>' +
    '<input class="fs crb-step-input" placeholder="التعليمات" style="width:100%;margin-top:6px" value="' + _esc(s.n || '') + '" onchange="customSteps[' + idx + '].n=this.value">' +
    '<div style="display:flex;gap:8px;margin-top:6px">' +
    '<input class="fs crb-step-input" placeholder="وقت الانتظار" style="flex:1" value="' + _esc(s.w || '') + '" onchange="customSteps[' + idx + '].w=this.value">' +
    '<input class="fs crb-step-input" type="number" placeholder="\u00B0C" style="width:60px" value="' + (s.tmp != null ? s.tmp : '') + '" onchange="customSteps[' + idx + '].tmp=this.value?parseFloat(this.value):null">' +
    '</div>' +
    '<div style="display:flex;gap:6px;margin-top:6px">' +
    '<input class="fs crb-step-input" placeholder="الوقت (مثال 0:45)" style="width:80px" value="' + _esc(s.t || '') + '" onchange="customSteps[' + idx + '].t=this.value">' +
    (customSteps.length > 1 ? '<button class="crb-step-move" onclick="moveCustomStep(' + idx + ',-1)" ' + (idx === 0 ? 'disabled' : '') + '>\u2191</button>' +
    '<button class="crb-step-move" onclick="moveCustomStep(' + idx + ',1)" ' + (idx === customSteps.length - 1 ? 'disabled' : '') + '>\u2193</button>' : '') +
    '</div>' +
    '</div>';
}

function _refreshSteps() {
  var container = document.getElementById('crb_steps_container');
  if (container) container.innerHTML = _renderStepRows();
}

function addCustomStep() {
  customSteps.push({
    l: '', add: 0, total: 0, t: '', w: '', n: '', tmp: 93
  });
  _refreshSteps();
  // Scroll to new step
  var container = document.getElementById('crb_steps_container');
  if (container) container.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
window.addCustomStep = addCustomStep;

function removeCustomStep(idx) {
  if (customSteps.length <= 1) {
    _showToast('لازم تكون فيه خطوة وحدة على الأقل', 'warn');
    return;
  }
  customSteps.splice(idx, 1);
  _refreshSteps();
}
window.removeCustomStep = removeCustomStep;

function moveCustomStep(idx, dir) {
  var newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= customSteps.length) return;
  var temp = customSteps[idx];
  customSteps[idx] = customSteps[newIdx];
  customSteps[newIdx] = temp;
  _refreshSteps();
}
window.moveCustomStep = moveCustomStep;

// ─── SAVE FROM BUILDER ───────────────────────────────────────────────────────

function _saveFromBuilder() {
  var name = document.getElementById('crb_name').value.trim();
  var expert = document.getElementById('crb_expert').value.trim();
  var dose = parseFloat(document.getElementById('crb_dose').value) || 0;
  var water = parseFloat(document.getElementById('crb_water').value) || 0;
  var ice = parseFloat(document.getElementById('crb_ice').value) || 0;
  var temp = parseInt(document.getElementById('crb_temp').value) || 93;
  var ode = document.getElementById('crb_ode').value.trim();

  // Type
  var type = document.getElementById('crb_type_iced').classList.contains('crb-type-on') ? 'iced' : 'hot';

  // Difficulty
  var diffEl = document.querySelector('.crb-diff-btn.crb-diff-on');
  var diff = diffEl ? diffEl.textContent.trim() : 'مبتدئ';

  // Flavor
  var fl = {
    sw: parseInt(document.getElementById('crb_fl_sw').value) || 3,
    ac: parseInt(document.getElementById('crb_fl_ac').value) || 3,
    bd: parseInt(document.getElementById('crb_fl_bd').value) || 3,
    cl: parseInt(document.getElementById('crb_fl_cl').value) || 3
  };

  // ODE parsing
  var oMin = 0, oMax = 0;
  if (ode) {
    var odeParts = ode.split('-');
    oMin = parseFloat(odeParts[0]) || 0;
    oMax = odeParts.length > 1 ? parseFloat(odeParts[1]) || oMin : oMin;
  }

  // Build recipe
  var recipe = {
    id: customEditId || null,
    ex: expert,
    m: name,
    mA: name,
    type: type,
    dose: dose,
    water: water,
    ice: type === 'iced' ? ice : 0,
    ratio: '',
    rn: 0,
    temp: temp,
    tn: temp + '°C',
    ode: ode,
    oMin: oMin,
    oMax: oMax,
    time: '',
    ts: 0,
    agit: '',
    st: 'مخصصة',
    diff: diff,
    pop: 3,
    fl: fl,
    bio: 'وصفة مخصصة' + (expert ? ' — ' + expert : ''),
    bioLong: 'وصفة مخصصة' + (expert ? ' من ' + expert : '') + '. ' + name,
    bestFor: [],
    bestBeans: [],
    tags: ['custom', 'مخصصة'],
    theory: '',
    steps: JSON.parse(JSON.stringify(customSteps)),
    custom: true
  };

  // Validate
  var result = validateRecipe(recipe);
  if (!result.valid) {
    _showToast(result.errors[0], 'error');
    return;
  }

  // Save
  if (saveCustomRecipe(recipe)) {
    closeRecipeBuilder();
    // Re-render cards if available
    if (typeof renderCards === 'function') renderCards();
  }
}
window._saveFromBuilder = _saveFromBuilder;

// ─── BADGE & BUTTON RENDERERS ────────────────────────────────────────────────

function renderCustomRecipeBadge() {
  return '<span class="crb-badge">\u2728 وصفة مخصصة</span>';
}
window.renderCustomRecipeBadge = renderCustomRecipeBadge;

function renderCreateButton() {
  return '<div class="crb-fab" onclick="openRecipeBuilder()">' +
    '<span class="crb-fab-icon">+</span>' +
    '<span class="crb-fab-text">إنشاء وصفة</span>' +
    '</div>';
}
window.renderCreateButton = renderCreateButton;

function renderCreateCard() {
  return '<div class="crb-create-card" onclick="openRecipeBuilder()">' +
    '<div class="crb-create-icon">✨</div>' +
    '<div class="crb-create-title">إنشاء وصفة جديدة</div>' +
    '<div class="crb-create-sub">صمّم وصفتك الخاصة</div>' +
    '</div>';
}
window.renderCreateCard = renderCreateCard;

// ─── TOAST ───────────────────────────────────────────────────────────────────

function _showToast(msg, type) {
  var existing = document.querySelector('.crb-toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'crb-toast' + (type === 'error' ? ' crb-toast-err' : type === 'warn' ? ' crb-toast-warn' : '');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function () { toast.classList.add('crb-toast-show'); }, 10);
  setTimeout(function () {
    toast.classList.remove('crb-toast-show');
    setTimeout(function () { toast.remove(); }, 300);
  }, 3000);
}

// ─── SLIDER LIVE UPDATE ──────────────────────────────────────────────────────

document.addEventListener('input', function (e) {
  if (e.target && e.target.classList.contains('crb-slider')) {
    var valEl = document.getElementById(e.target.id + '_val');
    if (valEl) valEl.textContent = e.target.value;
  }
});

// ─── INJECT CSS ──────────────────────────────────────────────────────────────

(function injectCustomRecipeCSS() {
  var style = document.createElement('style');
  style.textContent =
    // Overlay
    '.crb-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;animation:crb-fadeIn .25s ease}' +
    '@keyframes crb-fadeIn{from{opacity:0}to{opacity:1}}' +

    // Modal
    '.crb-modal{width:100%;max-width:520px;max-height:92dvh;background:var(--card);border-radius:var(--r) var(--r) 0 0;display:flex;flex-direction:column;animation:crb-slideUp .3s ease;box-shadow:var(--sh3);overflow:hidden}' +
    '@keyframes crb-slideUp{from{transform:translateY(100%)}to{transform:none}}' +

    // Header
    '.crb-hd{display:flex;justify-content:space-between;align-items:center;padding:18px 20px 14px;border-bottom:1px solid var(--border);flex-shrink:0}' +
    '.crb-hd h2{font-size:18px;font-weight:900;font-family:Cairo;color:var(--t1)}' +
    '.crb-close{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--t3);background:var(--bg2);transition:all .2s}' +
    '.crb-close:hover{background:var(--border);color:var(--t1)}' +

    // Body
    '.crb-body{flex:1;overflow-y:auto;padding:18px 20px 24px;-webkit-overflow-scrolling:touch}' +

    // Form groups
    '.crb-fg{margin-bottom:16px}' +
    '.crb-fg-inline{flex:1;min-width:0}' +
    '.crb-lbl{display:block;font-size:11px;font-weight:700;color:var(--t3);margin-bottom:6px;font-family:Cairo}' +
    '.crb-input{width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:var(--r3);background:var(--bg2);font-size:13px;color:var(--t1);font-family:Cairo;transition:all .25s;box-sizing:border-box}' +
    '.crb-input:focus{border-color:var(--a1);outline:none;box-shadow:0 0 0 3px rgba(198,124,78,.1);background:var(--card)}' +
    '.crb-num{text-align:center;font-family:Inter;font-weight:600}' +
    '.crb-row{display:flex;gap:10px;margin-bottom:16px}' +
    '.crb-ratio{display:flex;align-items:center;justify-content:center;font-family:Inter;font-weight:800;font-size:15px;color:var(--a1);padding:8px;background:var(--bg2);border-radius:var(--r3);border:1.5px solid var(--border);text-align:center;min-height:38px}' +

    // Type toggle
    '.crb-toggle-row{display:flex;gap:8px}' +
    '.crb-type-btn{flex:1;padding:10px;border-radius:var(--r3);border:1.5px solid var(--border);font-size:13px;font-weight:700;font-family:Cairo;color:var(--t2);background:var(--bg2);transition:all .25s;cursor:pointer}' +
    '.crb-type-btn.crb-type-on{background:var(--a1);color:#fff;border-color:var(--a1)}' +
    '.crb-type-btn.crb-type-iced.crb-type-on{background:var(--ice);border-color:var(--ice)}' +

    // Difficulty
    '.crb-diff-row{display:flex;gap:8px}' +
    '.crb-diff-btn{flex:1;padding:8px;border-radius:var(--r3);border:1.5px solid var(--border);font-size:12px;font-weight:700;font-family:Cairo;color:var(--t2);background:var(--bg2);cursor:pointer;transition:all .25s}' +
    '.crb-diff-btn.crb-diff-on{background:var(--a1);color:#fff;border-color:var(--a1)}' +

    // Section title
    '.crb-section-title{font-size:13px;font-weight:900;color:var(--t1);margin:20px 0 12px;padding-top:16px;border-top:1px solid var(--border);font-family:Cairo}' +

    // Sliders
    '.crb-slider-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}' +
    '.crb-slider-label{font-size:11px;color:var(--t3);font-family:Cairo;font-weight:700;width:55px;flex-shrink:0}' +
    '.crb-slider{flex:1;-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;background:var(--border);outline:none}' +
    '.crb-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;background:var(--a1);cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.2)}' +
    '.crb-slider::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:var(--a1);cursor:pointer;border:none}' +
    '.crb-slider-val{width:20px;text-align:center;font-family:Inter;font-weight:700;font-size:13px;color:var(--a1)}' +

    // Steps
    '.custom-step{padding:14px;background:var(--bg2);border-radius:var(--r3);border:1.5px solid var(--border);margin-bottom:10px;transition:all .25s}' +
    '.custom-step:hover{border-color:var(--a2)}' +
    '.step-num{width:26px;height:26px;border-radius:50%;background:var(--a1);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;font-family:Inter;flex-shrink:0}' +
    '.step-del{width:28px;height:28px;border-radius:8px;background:var(--hotBg);color:var(--hot);font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;transition:all .2s;flex-shrink:0}' +
    '.step-del:hover{background:var(--hot);color:#fff}' +
    '.crb-step-input{font-family:Cairo;font-size:12px;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;background:var(--card);color:var(--t1);transition:all .25s;box-sizing:border-box;background-image:none}' +
    '.crb-step-input:focus{border-color:var(--a1);outline:none;box-shadow:0 0 0 3px rgba(198,124,78,.1)}' +
    '.crb-step-move{width:28px;height:28px;border-radius:8px;background:var(--bg2);color:var(--t3);font-size:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid var(--border);transition:all .2s}' +
    '.crb-step-move:hover:not(:disabled){background:var(--a3);color:var(--t1)}' +
    '.crb-step-move:disabled{opacity:.3;cursor:not-allowed}' +
    '.crb-add-step{width:100%;padding:12px;border-radius:var(--r3);border:2px dashed var(--border);background:transparent;color:var(--a1);font-size:13px;font-weight:700;font-family:Cairo;cursor:pointer;transition:all .25s;margin-top:4px}' +
    '.crb-add-step:hover{border-color:var(--a1);background:rgba(198,124,78,.05)}' +

    // Footer
    '.crb-footer{display:flex;justify-content:space-between;align-items:center;padding:14px 20px max(env(safe-area-inset-bottom,0px),14px);border-top:1px solid var(--border);background:var(--card);flex-shrink:0}' +
    '.crb-footer-actions{display:flex;gap:8px}' +
    '.crb-btn{padding:10px 20px;border-radius:var(--r3);font-size:13px;font-weight:700;font-family:Cairo;cursor:pointer;transition:all .2s;border:none}' +
    '.crb-btn-cancel{background:var(--bg2);color:var(--t2);border:1px solid var(--border)}' +
    '.crb-btn-cancel:hover{background:var(--border)}' +
    '.crb-btn-save{background:var(--a1);color:#fff}' +
    '.crb-btn-save:hover{background:var(--caramel);transform:scale(1.02)}' +
    '.crb-btn-save:active{transform:scale(.97)}' +
    '.crb-btn-del{background:var(--hotBg);color:var(--hot);font-size:12px;padding:8px 14px}' +
    '.crb-btn-del:hover{background:var(--hot);color:#fff}' +

    // Badge
    '.crb-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:12px;background:linear-gradient(135deg,rgba(198,124,78,.12),rgba(212,165,116,.12));color:var(--a1);font-size:9px;font-weight:700;font-family:Cairo;border:1px solid rgba(198,124,78,.2)}' +

    // FAB
    '.crb-fab{position:fixed;bottom:90px;left:20px;z-index:190;display:flex;align-items:center;gap:8px;padding:12px 20px;background:var(--a1);color:#fff;border-radius:28px;box-shadow:0 4px 20px rgba(198,124,78,.4);cursor:pointer;transition:all .25s;font-family:Cairo;font-weight:700;font-size:13px}' +
    '.crb-fab:hover{transform:scale(1.05);box-shadow:0 6px 28px rgba(198,124,78,.5)}' +
    '.crb-fab:active{transform:scale(.95)}' +
    '.crb-fab-icon{font-size:20px;font-weight:900;line-height:1}' +

    // Create card
    '.crb-create-card{background:var(--card);border:2px dashed var(--border);border-radius:var(--r);padding:24px;text-align:center;cursor:pointer;transition:all .25s}' +
    '.crb-create-card:hover{border-color:var(--a1);background:var(--card2)}' +
    '.crb-create-card:active{transform:scale(.98)}' +
    '.crb-create-icon{font-size:32px;margin-bottom:8px}' +
    '.crb-create-title{font-size:15px;font-weight:900;color:var(--t1);font-family:Cairo;margin-bottom:4px}' +
    '.crb-create-sub{font-size:11px;color:var(--t3);font-family:Cairo}' +

    // Toast
    '.crb-toast{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-100%);z-index:99999;padding:12px 24px;border-radius:var(--r3);background:var(--ok);color:#fff;font-size:13px;font-weight:700;font-family:Cairo;box-shadow:var(--sh2);transition:transform .3s ease;white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis}' +
    '.crb-toast-show{transform:translateX(-50%) translateY(0)}' +
    '.crb-toast-err{background:var(--hot)}' +
    '.crb-toast-warn{background:var(--warn)}';

  document.head.appendChild(style);
})();
