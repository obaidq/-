// ═══════════════════════════════════════════════════════════════════════════
// V60 Masters — Bean Library Module
// Personal bean inventory tracker for the Tools section
// ═══════════════════════════════════════════════════════════════════════════

'use strict';

(function() {

// ─── CSS ──────────────────────────────────────────────────────────────────────
var beanCSS = document.createElement('style');
beanCSS.textContent = `
/* Bean Library Card */
.bean-library{margin-top:18px}
.bean-library-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.bean-library-header h4{font-size:15px;font-weight:900;font-family:Cairo,sans-serif;color:var(--t1)}
.bean-add-btn{padding:8px 18px;border-radius:20px;background:var(--a1);color:#fff;font-size:12px;font-weight:700;font-family:Cairo,sans-serif;border:none;cursor:pointer;transition:all .2s;box-shadow:0 2px 8px rgba(198,124,78,.25)}
.bean-add-btn:active{transform:scale(.95)}

/* Bean Cards */
.bean-list{display:flex;flex-direction:column;gap:10px;max-height:500px;overflow-y:auto;padding-left:4px;scrollbar-width:thin}
.bean-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;box-shadow:var(--sh1);transition:all .25s;animation:cardEntry .4s ease backwards;position:relative}
.bean-card:hover{box-shadow:var(--sh2);transform:translateY(-1px)}
.bean-card-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
.bean-roaster{font-size:11px;color:var(--t3);font-family:Cairo,sans-serif;font-weight:700}
.bean-name{font-size:15px;font-weight:900;color:var(--t1);line-height:1.3;margin-bottom:2px}
.bean-origin{font-size:11px;color:var(--t2);font-family:Cairo,sans-serif;margin-bottom:6px}
.bean-meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0}

/* Roast Level Badges */
.bean-roast-badge{padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;font-family:Cairo,sans-serif}
.bean-roast-light{background:#FFF4D9;color:#8B6914}
.bean-roast-medium{background:#FDEBD0;color:#A0522D}
.bean-roast-medium-dark{background:#F5D5C0;color:#8B4513}
.bean-roast-dark{background:#E8D5C4;color:#3C2415}

/* Freshness */
.bean-freshness{display:flex;align-items:center;gap:6px;margin:8px 0}
.bean-fresh-bar-wrap{flex:1;height:6px;border-radius:3px;background:var(--bg2);overflow:hidden;position:relative}
.bean-fresh-bar{height:100%;border-radius:3px;transition:width .5s ease}
.bean-fresh-label{font-size:10px;font-weight:700;font-family:Cairo,sans-serif;white-space:nowrap;flex-shrink:0}
.bean-fresh-day{font-size:10px;color:var(--t3);font-family:Inter,sans-serif;font-weight:700;flex-shrink:0}

/* Weight Bar */
.bean-weight-section{margin:8px 0}
.bean-weight-label{display:flex;justify-content:space-between;font-size:10px;color:var(--t3);font-family:Cairo,sans-serif;margin-bottom:3px}
.bean-weight-bar-wrap{height:8px;border-radius:4px;background:var(--bg2);overflow:hidden}
.bean-weight-bar{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--a1),var(--a2));transition:width .5s ease}

/* Flavor Notes */
.bean-flavor-notes{font-size:11px;color:var(--t2);font-family:Cairo,sans-serif;margin:4px 0;line-height:1.6}

/* Bean actions */
.bean-actions{display:flex;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid var(--border2)}
.bean-action-btn{font-size:10px;font-weight:700;color:var(--a2);background:none;border:none;cursor:pointer;font-family:Cairo,sans-serif;padding:4px 8px;border-radius:6px;transition:all .2s}
.bean-action-btn:hover{background:var(--bg2)}
.bean-action-btn.del{color:var(--hot)}
.bean-action-btn.del:hover{background:var(--hotBg)}

/* Bean price */
.bean-price{font-size:11px;color:var(--ok);font-weight:700;font-family:Inter,sans-serif}

/* Bean Form Modal */
.bean-modal{position:fixed;inset:0;z-index:700;background:rgba(0,0,0,.6);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:none;align-items:center;justify-content:center;padding:16px}
.bean-modal.on{display:flex}
.bean-modal-card{background:var(--card);border-radius:var(--r);padding:24px;width:100%;max-width:420px;max-height:90vh;overflow-y:auto;animation:su .3s ease;box-shadow:var(--sh3);border:1px solid var(--border)}
.bean-modal-card h3{font-size:16px;font-weight:900;margin-bottom:16px;font-family:Cairo,sans-serif;color:var(--t1);text-align:center}
.bean-form-group{margin-bottom:12px}
.bean-form-label{font-size:11px;font-weight:700;color:var(--t2);margin-bottom:4px;display:block;font-family:Cairo,sans-serif}
.bean-form-input{width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--r3);background:var(--card);font-size:13px;color:var(--t1);transition:border-color .25s;font-family:Cairo,sans-serif}
.bean-form-input:focus{border-color:var(--a1);outline:none;box-shadow:0 0 0 3px rgba(198,124,78,.1)}
.bean-form-input.en{font-family:Inter,Cairo,sans-serif;direction:ltr}
.bean-form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.bean-form-select{width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--r3);background:var(--card);font-size:13px;color:var(--t1);font-family:Cairo,sans-serif;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239B8474' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:left 10px center}
.bean-form-select:focus{border-color:var(--a1);outline:none}
.bean-form-actions{display:flex;gap:10px;margin-top:18px}
.bean-form-save{flex:1;padding:12px;border-radius:var(--r3);background:var(--a1);color:#fff;font-size:14px;font-weight:800;font-family:Cairo,sans-serif;border:none;cursor:pointer;transition:all .2s}
.bean-form-save:active{transform:scale(.97)}
.bean-form-cancel{flex:1;padding:12px;border-radius:var(--r3);background:var(--bg2);color:var(--t2);font-size:14px;font-weight:700;font-family:Cairo,sans-serif;border:1.5px solid var(--border);cursor:pointer;transition:all .2s}
.bean-form-cancel:active{transform:scale(.97)}

/* Bean Selector dropdown */
.bean-selector{width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--r3);background:var(--card);font-size:12px;color:var(--t1);font-family:Cairo,sans-serif;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239B8474' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:left 10px center;margin:8px 0}
.bean-selector:focus{border-color:var(--a1);outline:none}

/* Bean empty state */
.bean-empty{text-align:center;padding:28px 16px;color:var(--t3)}
.bean-empty b{font-size:36px;display:block;margin-bottom:8px}
.bean-empty h3{font-size:14px;font-weight:900;color:var(--t2);margin-bottom:4px}
.bean-empty p{font-size:11px;font-family:Cairo,sans-serif}
`;
document.head.appendChild(beanCSS);

// ─── ROAST LEVELS ─────────────────────────────────────────────────────────────
var ROAST_LEVELS = [
  { value: 'فاتح', css: 'bean-roast-light' },
  { value: 'متوسط', css: 'bean-roast-medium' },
  { value: 'متوسط-غامق', css: 'bean-roast-medium-dark' },
  { value: 'غامق', css: 'bean-roast-dark' }
];

// ─── LOAD / SAVE BEANS ───────────────────────────────────────────────────────
function loadBeans() {
  try {
    var raw = localStorage.getItem('v60beans');
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function saveBeanData(bean) {
  try {
    var beans = loadBeans();
    var idx = beans.findIndex(function(b) { return b.id === bean.id; });
    if (idx > -1) {
      beans[idx] = bean;
    } else {
      beans.push(bean);
    }
    localStorage.setItem('v60beans', JSON.stringify(beans));
    if (typeof toast === 'function') toast('تم حفظ البن', 'ok');
  } catch (e) {
    if (typeof toast === 'function') toast('التخزين ممتلئ', 'warn');
  }
}

function deleteBeanData(beanId) {
  try {
    var beans = loadBeans();
    beans = beans.filter(function(b) { return b.id !== beanId; });
    localStorage.setItem('v60beans', JSON.stringify(beans));
    if (typeof toast === 'function') toast('تم حذف البن', 'ok');
  } catch (e) {
    if (typeof toast === 'function') toast('خطأ في الحذف', 'error');
  }
}

// ─── FRESHNESS ────────────────────────────────────────────────────────────────
function getBeanFreshness(roastDate) {
  if (!roastDate) return { days: -1, label: 'غير محدد', color: 'var(--t3)', cssColor: '#999' };
  try {
    var roast = new Date(roastDate);
    var now = new Date();
    // Reset time portion for accurate day calculation
    roast.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    var diff = Math.floor((now - roast) / 86400000);
    if (diff < 0) diff = 0;

    if (diff <= 7) {
      return { days: diff, label: 'طازج جدا\u0651 \uD83D\uDFE2', color: 'var(--ok)', cssColor: '#2D9B5E' };
    } else if (diff <= 14) {
      return { days: diff, label: 'طازج \uD83D\uDFE1', color: 'var(--warn)', cssColor: '#E0960A' };
    } else if (diff <= 28) {
      return { days: diff, label: 'مقبول \uD83D\uDFE0', color: '#E07020', cssColor: '#E07020' };
    } else {
      return { days: diff, label: 'قديم \uD83D\uDD34', color: 'var(--hot)', cssColor: '#D95040' };
    }
  } catch (e) {
    return { days: -1, label: 'غير محدد', color: 'var(--t3)', cssColor: '#999' };
  }
}

// ─── DEDUCT WEIGHT ────────────────────────────────────────────────────────────
function deductBeanWeight(beanId, grams) {
  try {
    var beans = loadBeans();
    var bean = beans.find(function(b) { return b.id === beanId; });
    if (bean) {
      bean.weightRemaining = Math.max(0, (bean.weightRemaining || 0) - grams);
      localStorage.setItem('v60beans', JSON.stringify(beans));
      return true;
    }
  } catch (e) {}
  return false;
}

// ─── RENDER BEAN CARD ─────────────────────────────────────────────────────────
function renderBeanCard(bean) {
  var freshness = getBeanFreshness(bean.roastDate);
  var roastInfo = ROAST_LEVELS.find(function(r) { return r.value === bean.roastLevel; });
  var roastCSS = roastInfo ? roastInfo.css : 'bean-roast-medium';
  var weightPct = bean.weightTotal > 0 ? Math.round((bean.weightRemaining / bean.weightTotal) * 100) : 0;
  var freshPct = freshness.days < 0 ? 0 : Math.max(0, Math.min(100, 100 - (freshness.days / 35) * 100));

  // Freshness bar gradient color
  var freshBarColor;
  if (freshness.days <= 7) freshBarColor = '#2D9B5E';
  else if (freshness.days <= 14) freshBarColor = '#E0960A';
  else if (freshness.days <= 28) freshBarColor = '#E07020';
  else freshBarColor = '#D95040';

  var html = '<div class="bean-card" data-bean-id="' + bean.id + '">';
  html += '<div class="bean-card-top">';
  html += '<div>';
  html += '<div class="bean-roaster">' + (bean.roaster || '') + '</div>';
  html += '<div class="bean-name">' + (bean.name || 'بدون اسم') + '</div>';
  html += '<div class="bean-origin">' + (bean.origin || '') + '</div>';
  html += '</div>';
  if (bean.pricePerBag) {
    html += '<span class="bean-price">' + bean.pricePerBag + ' ر.س</span>';
  }
  html += '</div>';

  // Meta badges
  html += '<div class="bean-meta">';
  html += '<span class="bean-roast-badge ' + roastCSS + '">' + (bean.roastLevel || 'متوسط') + '</span>';
  if (freshness.days >= 0) {
    html += '<span class="bean-fresh-label" style="color:' + freshness.cssColor + '">' + freshness.label + '</span>';
  }
  html += '</div>';

  // Freshness bar
  if (freshness.days >= 0) {
    html += '<div class="bean-freshness">';
    html += '<span class="bean-fresh-day" style="color:' + freshness.cssColor + '">يوم ' + freshness.days + '</span>';
    html += '<div class="bean-fresh-bar-wrap"><div class="bean-fresh-bar" style="width:' + freshPct + '%;background:' + freshBarColor + '"></div></div>';
    html += '</div>';
  }

  // Weight bar
  if (bean.weightTotal > 0) {
    html += '<div class="bean-weight-section">';
    html += '<div class="bean-weight-label"><span>الكمية المتبقية</span><span class="en">' + (bean.weightRemaining || 0) + 'g / ' + bean.weightTotal + 'g</span></div>';
    html += '<div class="bean-weight-bar-wrap"><div class="bean-weight-bar" style="width:' + weightPct + '%"></div></div>';
    html += '</div>';
  }

  // Flavor notes
  if (bean.flavorNotes) {
    html += '<div class="bean-flavor-notes">\uD83C\uDF4A ' + bean.flavorNotes + '</div>';
  }

  // Actions
  html += '<div class="bean-actions">';
  html += '<button class="bean-action-btn" onclick="window._beanEdit(' + bean.id + ')">\u270F\uFE0F تعديل</button>';
  html += '<button class="bean-action-btn del" onclick="window._beanDelete(' + bean.id + ')">\uD83D\uDDD1 حذف</button>';
  html += '</div>';
  html += '</div>';

  return html;
}

// ─── RENDER BEAN LIBRARY ──────────────────────────────────────────────────────
function renderBeanLibrary() {
  var beans = loadBeans();
  var html = '<div class="bean-library">';
  html += '<div class="bean-library-header">';
  html += '<h4>\u2615 مكتبة البن</h4>';
  html += '<button class="bean-add-btn" onclick="window._beanOpenForm()">+ أضف بن</button>';
  html += '</div>';

  if (!beans.length) {
    html += '<div class="bean-empty"><b>\uD83C\uDF31</b><h3>ما عندك بن محفوظ</h3><p>أضف أنواع البن اللي عندك عشان تتابع الكمية والطازجية</p></div>';
  } else {
    // Sort by roast date (newest first)
    beans.sort(function(a, b) {
      if (!a.roastDate) return 1;
      if (!b.roastDate) return -1;
      return new Date(b.roastDate) - new Date(a.roastDate);
    });
    html += '<div class="bean-list">';
    beans.forEach(function(bean) {
      html += renderBeanCard(bean);
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// ─── BEAN FORM MODAL ──────────────────────────────────────────────────────────
function ensureBeanModal() {
  if (document.getElementById('beanModal')) return;
  var modal = document.createElement('div');
  modal.className = 'bean-modal';
  modal.id = 'beanModal';
  modal.innerHTML = '<div class="bean-modal-card" id="beanModalCard"></div>';
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeBeanForm();
  });
  document.body.appendChild(modal);
}

function openBeanForm(editId) {
  ensureBeanModal();
  var modal = document.getElementById('beanModal');
  var card = document.getElementById('beanModalCard');
  if (!modal || !card) return;

  var bean = null;
  if (editId) {
    var beans = loadBeans();
    bean = beans.find(function(b) { return b.id === editId; });
  }

  var isEdit = !!bean;
  var title = isEdit ? 'تعديل البن' : 'أضف بن جديد';

  var today = new Date();
  var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  card.innerHTML = '<h3>' + title + '</h3>' +
    '<div class="bean-form-group">' +
      '<label class="bean-form-label">المحمصة</label>' +
      '<input class="bean-form-input" id="bfRoaster" placeholder="مثال: محمصة المعمل" value="' + (bean ? bean.roaster || '' : '') + '">' +
    '</div>' +
    '<div class="bean-form-group">' +
      '<label class="bean-form-label">اسم البن</label>' +
      '<input class="bean-form-input en" id="bfName" placeholder="e.g. Ethiopia Yirgacheffe" value="' + (bean ? bean.name || '' : '') + '">' +
    '</div>' +
    '<div class="bean-form-group">' +
      '<label class="bean-form-label">بلد المنشأ</label>' +
      '<input class="bean-form-input" id="bfOrigin" placeholder="مثال: إثيوبيا" value="' + (bean ? bean.origin || '' : '') + '">' +
    '</div>' +
    '<div class="bean-form-row">' +
      '<div class="bean-form-group">' +
        '<label class="bean-form-label">تاريخ التحميص</label>' +
        '<input class="bean-form-input en" id="bfRoastDate" type="date" value="' + (bean ? bean.roastDate || '' : todayStr) + '">' +
      '</div>' +
      '<div class="bean-form-group">' +
        '<label class="bean-form-label">درجة التحميص</label>' +
        '<select class="bean-form-select" id="bfRoastLevel">' +
          ROAST_LEVELS.map(function(r) {
            return '<option value="' + r.value + '"' + (bean && bean.roastLevel === r.value ? ' selected' : '') + '>' + r.value + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div class="bean-form-group">' +
      '<label class="bean-form-label">نكهات مميزة</label>' +
      '<input class="bean-form-input" id="bfFlavor" placeholder="مثال: توت، ياسمين، عسل" value="' + (bean ? bean.flavorNotes || '' : '') + '">' +
    '</div>' +
    '<div class="bean-form-row">' +
      '<div class="bean-form-group">' +
        '<label class="bean-form-label">الوزن الكلي (جرام)</label>' +
        '<input class="bean-form-input en" id="bfWeight" type="number" min="0" placeholder="250" value="' + (bean ? bean.weightTotal || '' : '') + '">' +
      '</div>' +
      '<div class="bean-form-group">' +
        '<label class="bean-form-label">السعر (ر.س)</label>' +
        '<input class="bean-form-input en" id="bfPrice" type="number" min="0" placeholder="85" value="' + (bean ? bean.pricePerBag || '' : '') + '">' +
      '</div>' +
    '</div>' +
    '<div class="bean-form-group">' +
      '<label class="bean-form-label">ملاحظات</label>' +
      '<input class="bean-form-input" id="bfNotes" placeholder="ملاحظات إضافية (اختياري)" value="' + (bean ? bean.notes || '' : '') + '">' +
    '</div>' +
    '<div class="bean-form-actions">' +
      '<button class="bean-form-save" id="bfSave">' + (isEdit ? 'حفظ التعديلات' : 'أضف البن') + '</button>' +
      '<button class="bean-form-cancel" id="bfCancel">إلغاء</button>' +
    '</div>';

  modal.classList.add('on');

  // Listeners
  document.getElementById('bfSave').addEventListener('click', function() {
    var roaster = document.getElementById('bfRoaster').value.trim();
    var name = document.getElementById('bfName').value.trim();
    var origin = document.getElementById('bfOrigin').value.trim();
    var roastDate = document.getElementById('bfRoastDate').value;
    var roastLevel = document.getElementById('bfRoastLevel').value;
    var flavorNotes = document.getElementById('bfFlavor').value.trim();
    var weightTotal = parseFloat(document.getElementById('bfWeight').value) || 0;
    var pricePerBag = parseFloat(document.getElementById('bfPrice').value) || 0;
    var notes = document.getElementById('bfNotes').value.trim();

    if (!name && !roaster) {
      if (typeof toast === 'function') toast('لازم تكتب اسم البن أو المحمصة', 'warn');
      return;
    }

    var entry = {
      id: isEdit ? bean.id : Date.now(),
      roaster: roaster,
      name: name,
      origin: origin,
      roastDate: roastDate,
      roastLevel: roastLevel,
      flavorNotes: flavorNotes,
      weightTotal: weightTotal,
      weightRemaining: isEdit ? (bean.weightRemaining !== undefined ? bean.weightRemaining : weightTotal) : weightTotal,
      pricePerBag: pricePerBag,
      notes: notes
    };

    // If editing and total weight changed, adjust remaining proportionally
    if (isEdit && bean.weightTotal > 0 && weightTotal !== bean.weightTotal) {
      var ratio = bean.weightRemaining / bean.weightTotal;
      entry.weightRemaining = Math.round(weightTotal * ratio);
    }

    saveBeanData(entry);
    closeBeanForm();
    refreshBeanLibraryUI();
  });

  document.getElementById('bfCancel').addEventListener('click', closeBeanForm);
}

function closeBeanForm() {
  var modal = document.getElementById('beanModal');
  if (modal) modal.classList.remove('on');
}

// ─── REFRESH UI ───────────────────────────────────────────────────────────────
function refreshBeanLibraryUI() {
  var container = document.getElementById('beanLibraryContainer');
  if (container) {
    container.innerHTML = renderBeanLibrary();
  }
}

// ─── BEAN SELECTOR ────────────────────────────────────────────────────────────
function renderBeanSelector() {
  var beans = loadBeans();
  if (!beans.length) return '';

  // Filter to beans with remaining weight
  var available = beans.filter(function(b) { return b.weightRemaining > 0; });
  if (!available.length) return '';

  // Sort by freshness (freshest first)
  available.sort(function(a, b) {
    var fa = getBeanFreshness(a.roastDate);
    var fb = getBeanFreshness(b.roastDate);
    return fa.days - fb.days;
  });

  var html = '<div style="margin:10px 0">';
  html += '<label style="font-size:11px;font-weight:700;color:var(--t2);display:block;margin-bottom:4px;font-family:Cairo,sans-serif">\uD83C\uDF31 اختر البن المستخدم</label>';
  html += '<select class="bean-selector" id="brewBeanSelector">';
  html += '<option value="">— اختر نوع البن —</option>';
  available.forEach(function(b) {
    var freshness = getBeanFreshness(b.roastDate);
    var label = (b.roaster ? b.roaster + ' - ' : '') + b.name;
    label += ' (' + b.weightRemaining + 'g متبقي';
    if (freshness.days >= 0) label += ' \u2022 يوم ' + freshness.days;
    label += ')';
    html += '<option value="' + b.id + '">' + label + '</option>';
  });
  html += '</select></div>';
  return html;
}

// ─── GET BEAN FOR RECIPE ──────────────────────────────────────────────────────
function getBeanForRecipe(recipe) {
  if (!recipe || !recipe.bestBeans) return [];
  var beans = loadBeans();
  if (!beans.length) return [];

  var available = beans.filter(function(b) { return b.weightRemaining > 0; });
  if (!available.length) return [];

  // Score each bean based on matching keywords in bestBeans
  var scored = available.map(function(b) {
    var score = 0;
    var beanText = ((b.name || '') + ' ' + (b.origin || '') + ' ' + (b.roastLevel || '') + ' ' + (b.flavorNotes || '')).toLowerCase();

    recipe.bestBeans.forEach(function(keyword) {
      if (beanText.indexOf(keyword.toLowerCase()) > -1) {
        score += 10;
      }
    });

    // Freshness bonus
    var freshness = getBeanFreshness(b.roastDate);
    if (freshness.days >= 0 && freshness.days <= 14) score += 5;
    if (freshness.days >= 0 && freshness.days <= 7) score += 3;

    return { bean: b, score: score };
  });

  // Sort by score then freshness
  scored.sort(function(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    var fa = getBeanFreshness(a.bean.roastDate);
    var fb = getBeanFreshness(b.bean.roastDate);
    return fa.days - fb.days;
  });

  return scored.filter(function(s) { return s.score > 0; }).map(function(s) { return s.bean; });
}

// ─── GLOBAL ACTION HANDLERS ──────────────────────────────────────────────────
window._beanOpenForm = function() {
  openBeanForm(null);
};

window._beanEdit = function(id) {
  openBeanForm(id);
};

window._beanDelete = function(id) {
  if (confirm('متأكد تبي تحذف هالبن؟')) {
    deleteBeanData(id);
    refreshBeanLibraryUI();
  }
};

// ─── EXPOSE GLOBALS ───────────────────────────────────────────────────────────
window.renderBeanLibrary = renderBeanLibrary;
window.openBeanForm = openBeanForm;
window.closeBeanForm = closeBeanForm;
window.saveBeanData = saveBeanData;
window.deleteBeanData = deleteBeanData;
window.getBeanFreshness = getBeanFreshness;
window.deductBeanWeight = deductBeanWeight;
window.renderBeanSelector = renderBeanSelector;
window.getBeanForRecipe = getBeanForRecipe;
window.renderBeanCard = renderBeanCard;
window.loadBeans = loadBeans;
window.refreshBeanLibraryUI = refreshBeanLibraryUI;
window.ROAST_LEVELS = ROAST_LEVELS;

})();
