// ═══════════════════════════════════════════════════════════════════════════
// V60 Masters — Tasting Journal Module
// Extends brew-done dialog and log with detailed tasting notes
// ═══════════════════════════════════════════════════════════════════════════

'use strict';

(function() {

// ─── CSS ──────────────────────────────────────────────────────────────────────
var tastingCSS = document.createElement('style');
tastingCSS.textContent = `
/* Tasting Form */
.tasting-section{margin-top:16px;text-align:right}
.tasting-header{display:flex;align-items:center;justify-content:space-between;padding:10px 0;cursor:pointer;user-select:none}
.tasting-header h3{font-size:14px;font-weight:900;font-family:Cairo,sans-serif;color:var(--t1)}
.tasting-header .tasting-toggle{font-size:12px;color:var(--t3);transition:transform .3s}
.tasting-header .tasting-toggle.collapsed{transform:rotate(180deg)}
.tasting-body{overflow:hidden;transition:max-height .35s ease,opacity .25s ease}
.tasting-body.collapsed{max-height:0!important;opacity:0;pointer-events:none}

/* Sliders */
.tasting-slider-group{margin:12px 0}
.tasting-slider-row{display:flex;align-items:center;gap:10px;margin:8px 0;direction:rtl}
.tasting-slider-label{width:52px;font-size:11px;font-weight:700;color:var(--t2);font-family:Cairo,sans-serif;flex-shrink:0;text-align:right}
.tasting-dots{display:flex;gap:6px;flex:1;direction:ltr}
.tasting-dot{width:28px;height:28px;border-radius:50%;border:2px solid var(--border);background:var(--bg2);cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:var(--t3);font-family:Inter,sans-serif}
.tasting-dot.active{background:var(--a1);border-color:var(--a1);color:#fff;transform:scale(1.1)}
.tasting-dot:hover{border-color:var(--a2)}
.tasting-slider-val{width:20px;font-size:12px;font-weight:800;color:var(--a1);font-family:Inter,sans-serif;text-align:center}

/* Flavor Tags */
.flavor-tags-wrap{margin:14px 0}
.flavor-tags-title{font-size:12px;font-weight:700;color:var(--t2);margin-bottom:8px;font-family:Cairo,sans-serif}
.flavor-tags-info{font-size:10px;color:var(--t3);margin-bottom:6px;font-family:Cairo,sans-serif}
.flavor-tags{display:flex;flex-wrap:wrap;gap:6px}
.flavor-tag{padding:6px 14px;border-radius:20px;border:1.5px solid var(--border);background:var(--card);font-size:11px;font-weight:700;color:var(--t2);cursor:pointer;transition:all .25s;font-family:Cairo,sans-serif;user-select:none}
.flavor-tag.selected{background:var(--a1);color:#fff;border-color:var(--a1);box-shadow:0 2px 8px rgba(198,124,78,.25)}
.flavor-tag.selected::before{content:'\\2713 ';font-size:10px}
.flavor-tag:active{transform:scale(.94)}
.flavor-tag.maxed{opacity:.4;pointer-events:none}

/* Photo */
.tasting-photo-wrap{margin:12px 0}
.tasting-photo-btn{display:flex;align-items:center;gap:8px;padding:10px 16px;border:1.5px dashed var(--border);border-radius:var(--r3);background:var(--bg2);color:var(--t2);font-size:12px;font-weight:700;font-family:Cairo,sans-serif;cursor:pointer;transition:all .2s;width:100%;justify-content:center}
.tasting-photo-btn:hover{border-color:var(--a2);background:var(--card)}
.tasting-photo-btn:active{transform:scale(.97)}
.tasting-photo-preview{margin-top:8px;position:relative;display:inline-block}
.tasting-photo-preview img{width:100px;height:100px;object-fit:cover;border-radius:var(--r3);border:2px solid var(--border)}
.tasting-photo-remove{position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:var(--hot);color:#fff;border:none;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1}

/* Notes */
.tasting-notes{width:100%;min-height:60px;padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--r3);background:var(--card);font-size:12px;font-family:Cairo,sans-serif;resize:vertical;line-height:1.8;color:var(--t1);transition:border-color .25s;direction:rtl}
.tasting-notes:focus{border-color:var(--a1);outline:none;box-shadow:0 0 0 3px rgba(198,124,78,.1)}

/* Radar Chart */
.radar-chart{display:block;margin:0 auto}
.radar-axis{stroke:var(--border);stroke-width:1;fill:none}
.radar-grid{stroke:var(--border);stroke-width:.5;fill:none;opacity:.4}
.radar-area{fill:var(--a1);fill-opacity:.2;stroke:var(--a1);stroke-width:2}
.radar-point{fill:var(--a1);stroke:#fff;stroke-width:1.5}
.radar-label{font-size:10px;font-weight:700;font-family:Cairo,sans-serif;fill:var(--t2);text-anchor:middle;dominant-baseline:central}

/* Journal Tab */
.journal-entry{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:12px;box-shadow:var(--sh1);animation:cardEntry .4s ease backwards}
.journal-entry-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.journal-entry-name{font-size:14px;font-weight:900;color:var(--t1)}
.journal-entry-date{font-size:10px;color:var(--t3);font-family:Cairo,sans-serif}
.journal-entry-tags{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0}
.journal-entry-tag{padding:3px 10px;border-radius:12px;background:var(--a3);color:var(--espresso);font-size:10px;font-weight:700;font-family:Cairo,sans-serif}
.journal-entry-notes{font-size:12px;color:var(--t2);line-height:1.7;margin-top:8px;padding:8px;background:var(--bg2);border-radius:var(--r3);font-family:Cairo,sans-serif}
.journal-entry-photo{margin-top:8px}
.journal-entry-photo img{width:80px;height:80px;object-fit:cover;border-radius:var(--r3);border:1px solid var(--border);cursor:pointer}
.journal-chart-row{display:flex;align-items:center;gap:12px;margin:8px 0}
.journal-stars{color:var(--a1);font-size:13px;letter-spacing:1px;direction:ltr}

/* Flavor Stats */
.flavor-stat-row{display:flex;align-items:center;gap:10px;margin:6px 0}
.flavor-stat-label{width:70px;font-size:11px;font-weight:700;color:var(--t2);font-family:Cairo,sans-serif;text-align:right;flex-shrink:0}
.flavor-stat-bar-wrap{flex:1;height:8px;background:var(--bg2);border-radius:4px;overflow:hidden}
.flavor-stat-bar{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--a1),var(--a2));transition:width .7s ease}
.flavor-stat-count{width:24px;font-size:11px;font-weight:800;color:var(--a1);font-family:Inter,sans-serif;text-align:center}

/* Storage Warning */
.storage-warn{padding:10px 14px;background:var(--warnBg);border-radius:var(--r3);font-size:11px;color:var(--warn);font-weight:700;margin-bottom:12px;font-family:Cairo,sans-serif;display:flex;align-items:center;gap:8px}
`;
document.head.appendChild(tastingCSS);

// ─── FLAVOR TAG OPTIONS ────────────────────────────────────────────────────────
var FLAVOR_TAGS = [
  { id: 'chocolate', ar: 'شوكولاتة' },
  { id: 'berry', ar: 'توت' },
  { id: 'citrus', ar: 'حمضيات' },
  { id: 'floral', ar: 'زهري' },
  { id: 'nutty', ar: 'مكسرات' },
  { id: 'caramel', ar: 'كراميل' },
  { id: 'honey', ar: 'عسل' },
  { id: 'spice', ar: 'بهارات' },
  { id: 'wine', ar: 'نبيذي' },
  { id: 'tobacco', ar: 'تبغ' },
  { id: 'fruity', ar: 'فاكهي' },
  { id: 'earthy', ar: 'ترابي' }
];

var TASTING_AXES = [
  { key: 'acidity', ar: 'حموضة' },
  { key: 'sweetness', ar: 'حلاوة' },
  { key: 'body', ar: 'قوام' },
  { key: 'clarity', ar: 'صفاء' }
];

// ─── TASTING STATE ─────────────────────────────────────────────────────────────
var tastingState = {
  acidity: 3,
  sweetness: 3,
  body: 3,
  clarity: 3,
  flavorTags: [],
  photo: null,
  overallNotes: ''
};

// ─── RENDER TASTING FORM ──────────────────────────────────────────────────────
function renderTastingForm() {
  tastingState = { acidity: 3, sweetness: 3, body: 3, clarity: 3, flavorTags: [], photo: null, overallNotes: '' };

  var html = '<div class="tasting-section" id="tastingSection">';
  html += '<div class="tasting-header" id="tastingToggle">';
  html += '<h3>\uD83D\uDCDD ملاحظات التذوق</h3>';
  html += '<span class="tasting-toggle" id="tastingArrow">\u25B2</span>';
  html += '</div>';
  html += '<div class="tasting-body" id="tastingBody">';

  // Sliders
  html += '<div class="tasting-slider-group">';
  TASTING_AXES.forEach(function(axis) {
    html += '<div class="tasting-slider-row">';
    html += '<span class="tasting-slider-label">' + axis.ar + '</span>';
    html += '<div class="tasting-dots" data-axis="' + axis.key + '">';
    for (var i = 1; i <= 5; i++) {
      html += '<div class="tasting-dot' + (i <= 3 ? ' active' : '') + '" data-val="' + i + '">' + i + '</div>';
    }
    html += '</div>';
    html += '<span class="tasting-slider-val" id="tv_' + axis.key + '">3</span>';
    html += '</div>';
  });
  html += '</div>';

  // Flavor tags
  html += '<div class="flavor-tags-wrap">';
  html += '<div class="flavor-tags-title">\uD83C\uDF4A نكهات مميزة</div>';
  html += '<div class="flavor-tags-info">اختر حتى 5 نكهات</div>';
  html += '<div class="flavor-tags" id="flavorTags">';
  FLAVOR_TAGS.forEach(function(tag) {
    html += '<button class="flavor-tag" data-tag="' + tag.id + '">' + tag.ar + '</button>';
  });
  html += '</div></div>';

  // Photo
  html += '<div class="tasting-photo-wrap">';
  html += '<input type="file" id="tastingPhotoInput" accept="image/*" capture="environment" style="display:none">';
  html += '<button class="tasting-photo-btn" id="tastingPhotoBtn">\uD83D\uDCF7 أضف صورة</button>';
  html += '<div class="tasting-photo-preview" id="tastingPhotoPreview" style="display:none"></div>';
  html += '</div>';

  // Notes
  html += '<textarea class="tasting-notes" id="tastingOverallNotes" placeholder="ملاحظات إضافية عن التذوق... (اختياري)"></textarea>';

  html += '</div></div>';
  return html;
}

// ─── INIT TASTING FORM LISTENERS ──────────────────────────────────────────────
function initTastingFormListeners() {
  // Toggle collapse
  var toggle = document.getElementById('tastingToggle');
  var body = document.getElementById('tastingBody');
  var arrow = document.getElementById('tastingArrow');
  if (toggle && body) {
    body.style.maxHeight = body.scrollHeight + 200 + 'px';
    toggle.addEventListener('click', function() {
      body.classList.toggle('collapsed');
      if (arrow) arrow.classList.toggle('collapsed');
    });
  }

  // Slider dots
  document.querySelectorAll('.tasting-dots').forEach(function(group) {
    var axis = group.dataset.axis;
    group.querySelectorAll('.tasting-dot').forEach(function(dot) {
      dot.addEventListener('click', function() {
        var val = parseInt(dot.dataset.val);
        tastingState[axis] = val;
        var valEl = document.getElementById('tv_' + axis);
        if (valEl) valEl.textContent = val;
        group.querySelectorAll('.tasting-dot').forEach(function(d) {
          var dv = parseInt(d.dataset.val);
          if (dv <= val) d.classList.add('active');
          else d.classList.remove('active');
        });
      });
    });
  });

  // Flavor tags
  var tagsContainer = document.getElementById('flavorTags');
  if (tagsContainer) {
    tagsContainer.querySelectorAll('.flavor-tag').forEach(function(tag) {
      tag.addEventListener('click', function() {
        var tagId = tag.dataset.tag;
        var idx = tastingState.flavorTags.indexOf(tagId);
        if (idx > -1) {
          tastingState.flavorTags.splice(idx, 1);
          tag.classList.remove('selected');
        } else {
          if (tastingState.flavorTags.length >= 5) return;
          tastingState.flavorTags.push(tagId);
          tag.classList.add('selected');
        }
        // Update maxed state
        tagsContainer.querySelectorAll('.flavor-tag').forEach(function(t) {
          if (tastingState.flavorTags.length >= 5 && !t.classList.contains('selected')) {
            t.classList.add('maxed');
          } else {
            t.classList.remove('maxed');
          }
        });
      });
    });
  }

  // Photo
  var photoBtn = document.getElementById('tastingPhotoBtn');
  var photoInput = document.getElementById('tastingPhotoInput');
  var photoPreview = document.getElementById('tastingPhotoPreview');
  if (photoBtn && photoInput) {
    photoBtn.addEventListener('click', function() {
      photoInput.click();
    });
    photoInput.addEventListener('change', function() {
      var file = photoInput.files && photoInput.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        if (typeof toast === 'function') toast('الملف لازم يكون صورة', 'warn');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        if (typeof toast === 'function') toast('حجم الصورة كبير جدا (أكثر من 10MB)', 'warn');
        return;
      }
      compressPhoto(file, function(base64) {
        tastingState.photo = base64;
        if (photoPreview) {
          photoPreview.style.display = 'inline-block';
          photoPreview.innerHTML = '<img src="' + base64 + '" alt="صورة التذوق"><button class="tasting-photo-remove" id="removePhoto">\u2715</button>';
          var removeBtn = document.getElementById('removePhoto');
          if (removeBtn) {
            removeBtn.addEventListener('click', function() {
              tastingState.photo = null;
              photoPreview.style.display = 'none';
              photoPreview.innerHTML = '';
              photoInput.value = '';
            });
          }
        }
      });
    });
  }
}

// ─── COMPRESS PHOTO ───────────────────────────────────────────────────────────
function compressPhoto(file, callback) {
  try {
    var reader = new FileReader();
    reader.onerror = function() {
      if (typeof toast === 'function') toast('خطأ في قراءة الصورة', 'error');
    };
    reader.onload = function(e) {
      var img = new Image();
      img.onerror = function() {
        if (typeof toast === 'function') toast('خطأ في تحميل الصورة', 'error');
      };
      img.onload = function() {
        try {
          var maxW = 400;
          var w = img.width;
          var h = img.height;
          if (w > maxW) {
            h = Math.round(h * (maxW / w));
            w = maxW;
          }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          if (!ctx) {
            if (typeof toast === 'function') toast('المتصفح ما يدعم ضغط الصور', 'error');
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);

          // Start with quality 0.7 and decrease until under 100KB
          var quality = 0.7;
          var result = canvas.toDataURL('image/jpeg', quality);
          var attempts = 0;
          while (result.length > 133333 && quality > 0.1 && attempts < 8) {
            quality -= 0.1;
            attempts++;
            result = canvas.toDataURL('image/jpeg', quality);
          }
          // If still too large, reduce dimensions further
          if (result.length > 133333) {
            var scale = 0.6;
            canvas.width = Math.round(w * scale);
            canvas.height = Math.round(h * scale);
            ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              result = canvas.toDataURL('image/jpeg', 0.5);
            }
          }
          callback(result);
        } catch (err) {
          if (typeof toast === 'function') toast('خطأ في ضغط الصورة', 'error');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } catch (err) {
    if (typeof toast === 'function') toast('خطأ في معالجة الصورة', 'error');
  }
}

// ─── GET TASTING DATA ─────────────────────────────────────────────────────────
function getTastingData() {
  var notesEl = document.getElementById('tastingOverallNotes');
  return {
    acidity: tastingState.acidity,
    sweetness: tastingState.sweetness,
    body: tastingState.body,
    clarity: tastingState.clarity,
    flavorTags: tastingState.flavorTags.slice(),
    photo: tastingState.photo,
    overallNotes: notesEl ? notesEl.value : ''
  };
}

// ─── SAVE TASTING ─────────────────────────────────────────────────────────────
function saveTasting(logIndex, tastingData) {
  try {
    var logs = [];
    try {
      var raw = localStorage.getItem('v60log');
      logs = raw ? JSON.parse(raw) : [];
    } catch (e) { logs = []; }

    if (logIndex >= 0 && logIndex < logs.length) {
      logs[logIndex].tasting = tastingData;
      try {
        localStorage.setItem('v60log', JSON.stringify(logs));
      } catch (e) {
        if (typeof toast === 'function') toast('التخزين ممتلئ', 'warn');
        return;
      }
      // Sync global brewLog
      if (typeof brewLog !== 'undefined') {
        try { window.brewLog = logs; } catch (e) {}
      }
      if (typeof toast === 'function') toast('تم حفظ ملاحظات التذوق', 'ok');
    }
  } catch (e) {
    if (typeof toast === 'function') toast('خطأ في الحفظ', 'error');
  }
}

// ─── RENDER RADAR CHART ───────────────────────────────────────────────────────
function renderRadarChart(tastingData, size) {
  if (!tastingData) return '';
  size = size || 140;
  var cx = size / 2;
  var cy = size / 2;
  var r = (size / 2) - 24;
  var axes = TASTING_AXES;
  var n = axes.length;
  var angleStep = (2 * Math.PI) / n;
  var startAngle = -Math.PI / 2;

  // Grid levels
  var svg = '<svg class="radar-chart" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">';

  // Grid circles
  for (var level = 1; level <= 5; level++) {
    var lr = (r * level) / 5;
    var points = [];
    for (var i = 0; i < n; i++) {
      var angle = startAngle + i * angleStep;
      points.push(Math.round((cx + lr * Math.cos(angle)) * 10) / 10 + ',' + Math.round((cy + lr * Math.sin(angle)) * 10) / 10);
    }
    svg += '<polygon class="radar-grid" points="' + points.join(' ') + '"/>';
  }

  // Axes
  for (var i = 0; i < n; i++) {
    var angle = startAngle + i * angleStep;
    var x2 = cx + r * Math.cos(angle);
    var y2 = cy + r * Math.sin(angle);
    svg += '<line class="radar-axis" x1="' + cx + '" y1="' + cy + '" x2="' + Math.round(x2 * 10) / 10 + '" y2="' + Math.round(y2 * 10) / 10 + '"/>';
  }

  // Data area
  var dataPoints = [];
  var dotsSvg = '';
  for (var i = 0; i < n; i++) {
    var key = axes[i].key;
    var val = (tastingData[key] || 0) / 5;
    var angle = startAngle + i * angleStep;
    var px = cx + r * val * Math.cos(angle);
    var py = cy + r * val * Math.sin(angle);
    dataPoints.push(Math.round(px * 10) / 10 + ',' + Math.round(py * 10) / 10);
    dotsSvg += '<circle class="radar-point" cx="' + Math.round(px * 10) / 10 + '" cy="' + Math.round(py * 10) / 10 + '" r="3.5"/>';
  }
  svg += '<polygon class="radar-area" points="' + dataPoints.join(' ') + '"/>';
  svg += dotsSvg;

  // Labels
  for (var i = 0; i < n; i++) {
    var angle = startAngle + i * angleStep;
    var labelR = r + 16;
    var lx = cx + labelR * Math.cos(angle);
    var ly = cy + labelR * Math.sin(angle);
    svg += '<text class="radar-label" x="' + Math.round(lx * 10) / 10 + '" y="' + Math.round(ly * 10) / 10 + '">' + axes[i].ar + '</text>';
  }

  svg += '</svg>';
  return svg;
}

// ─── RENDER JOURNAL TAB ───────────────────────────────────────────────────────
function renderJournalTab(container) {
  var logs = [];
  try {
    var raw = localStorage.getItem('v60log');
    logs = raw ? JSON.parse(raw) : [];
  } catch (e) { logs = []; }

  var journalEntries = logs.filter(function(e) { return e.tasting; });

  if (!journalEntries.length) {
    container.innerHTML = '<div class="empty"><b>\uD83D\uDCDD</b><h3>ما عندك ملاحظات تذوق</h3><p>أضف ملاحظات تذوق بعد كل تحضير عشان تنحفظ هنا</p></div>';
    return;
  }

  // Storage usage check
  var usage = getStorageUsage();
  var storageWarn = '';
  if (usage.percentage > 80) {
    storageWarn = '<div class="storage-warn">\u26A0\uFE0F التخزين المحلي ممتلئ ' + Math.round(usage.percentage) + '% — فكّر تحذف صور قديمة</div>';
  }

  // Averages for main radar
  var avgData = { acidity: 0, sweetness: 0, body: 0, clarity: 0 };
  journalEntries.forEach(function(e) {
    avgData.acidity += e.tasting.acidity || 0;
    avgData.sweetness += e.tasting.sweetness || 0;
    avgData.body += e.tasting.body || 0;
    avgData.clarity += e.tasting.clarity || 0;
  });
  var count = journalEntries.length;
  avgData.acidity = Math.round((avgData.acidity / count) * 10) / 10;
  avgData.sweetness = Math.round((avgData.sweetness / count) * 10) / 10;
  avgData.body = Math.round((avgData.body / count) * 10) / 10;
  avgData.clarity = Math.round((avgData.clarity / count) * 10) / 10;

  var html = storageWarn;

  // Average radar chart
  html += '<div class="sc"><h3>\uD83D\uDCCA متوسط تقييماتك</h3>';
  html += '<div style="text-align:center;margin:8px 0">' + renderRadarChart(avgData, 180) + '</div>';
  html += '<div style="display:flex;justify-content:center;gap:16px;margin-top:8px">';
  TASTING_AXES.forEach(function(a) {
    html += '<div style="text-align:center"><div style="font-size:16px;font-weight:900;color:var(--a1);font-family:Inter">' + avgData[a.key] + '</div>';
    html += '<div style="font-size:9px;color:var(--t3)">' + a.ar + '</div></div>';
  });
  html += '</div></div>';

  // Flavor stats
  html += renderFlavorStatsHTML(journalEntries);

  // Individual entries
  html += '<div class="sc"><h3>\uD83D\uDDD2 سجل التذوق</h3>';
  journalEntries.slice().reverse().forEach(function(e) {
    var recipe = e.recipeName || 'وصفة غير معروفة';
    var date = e.date || '';
    var t = e.tasting;

    html += '<div class="journal-entry">';
    html += '<div class="journal-entry-top">';
    html += '<span class="journal-entry-name">' + recipe + '</span>';
    html += '<span class="journal-entry-date">' + date + '</span>';
    html += '</div>';

    // Stars
    if (e.rating) {
      html += '<div class="journal-stars">';
      for (var s = 1; s <= 5; s++) {
        html += '<span style="color:' + (s <= e.rating ? 'var(--a1)' : 'var(--border)') + '">\u2605</span>';
      }
      html += '</div>';
    }

    // Mini radar + tags side by side
    html += '<div class="journal-chart-row">';
    html += renderRadarChart(t, 100);
    if (t.flavorTags && t.flavorTags.length) {
      html += '<div class="journal-entry-tags">';
      t.flavorTags.forEach(function(tagId) {
        var found = FLAVOR_TAGS.find(function(f) { return f.id === tagId; });
        html += '<span class="journal-entry-tag">' + (found ? found.ar : tagId) + '</span>';
      });
      html += '</div>';
    }
    html += '</div>';

    // Notes
    if (t.overallNotes) {
      html += '<div class="journal-entry-notes">' + t.overallNotes + '</div>';
    }

    // Photo
    if (t.photo) {
      html += '<div class="journal-entry-photo"><img src="' + t.photo + '" alt="صورة القهوة" onclick="this.style.width=this.style.width===\'200px\'?\'80px\':\'200px\';this.style.height=this.style.width"></div>';
    }

    html += '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
}

// ─── RENDER FLAVOR STATS ──────────────────────────────────────────────────────
function renderFlavorStatsHTML(journalEntries) {
  var tagCounts = {};
  journalEntries.forEach(function(e) {
    if (e.tasting && e.tasting.flavorTags) {
      e.tasting.flavorTags.forEach(function(tag) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  var sorted = Object.keys(tagCounts).sort(function(a, b) { return tagCounts[b] - tagCounts[a]; });
  if (!sorted.length) return '';

  var maxCount = tagCounts[sorted[0]];
  var html = '<div class="sc"><h3>\uD83C\uDF1F نكهاتك المفضلة</h3>';
  sorted.forEach(function(tagId) {
    var found = FLAVOR_TAGS.find(function(f) { return f.id === tagId; });
    var pct = Math.round((tagCounts[tagId] / maxCount) * 100);
    html += '<div class="flavor-stat-row">';
    html += '<span class="flavor-stat-label">' + (found ? found.ar : tagId) + '</span>';
    html += '<div class="flavor-stat-bar-wrap"><div class="flavor-stat-bar" style="width:' + pct + '%"></div></div>';
    html += '<span class="flavor-stat-count">' + tagCounts[tagId] + '</span>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function renderFlavorStats(container) {
  var logs = [];
  try {
    var raw = localStorage.getItem('v60log');
    logs = raw ? JSON.parse(raw) : [];
  } catch (e) { logs = []; }

  var journalEntries = logs.filter(function(e) { return e.tasting; });
  container.innerHTML = renderFlavorStatsHTML(journalEntries);
}

// ─── STORAGE USAGE ────────────────────────────────────────────────────────────
function getStorageUsage() {
  try {
    var total = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      var val = localStorage.getItem(key);
      if (val) total += key.length + val.length;
    }
    // Each char is ~2 bytes in JS strings
    var usedBytes = total * 2;
    var totalBytes = 5 * 1024 * 1024; // typical 5MB limit
    return {
      used: usedBytes,
      total: totalBytes,
      percentage: (usedBytes / totalBytes) * 100
    };
  } catch (e) {
    return { used: 0, total: 5 * 1024 * 1024, percentage: 0 };
  }
}

// ─── EXPOSE GLOBALS ───────────────────────────────────────────────────────────
window.renderTastingForm = renderTastingForm;
window.initTastingFormListeners = initTastingFormListeners;
window.getTastingData = getTastingData;
window.saveTasting = saveTasting;
window.compressPhoto = compressPhoto;
window.renderRadarChart = renderRadarChart;
window.renderJournalTab = renderJournalTab;
window.renderFlavorStats = renderFlavorStats;
window.getStorageUsage = getStorageUsage;
window.FLAVOR_TAGS = FLAVOR_TAGS;
window.TASTING_AXES = TASTING_AXES;

})();
