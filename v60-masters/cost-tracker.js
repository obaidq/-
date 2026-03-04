// ═══════════════════════════════════════════════════════════════════════════
// V60 Masters — Coffee Cost Tracker (حاسبة تكلفة الكوب)
// Loaded BEFORE the main app script
// ═══════════════════════════════════════════════════════════════════════════

/* eslint-disable no-var */

var V60_COST_TRACKER = {
  storageKey: 'v60cost',

  // ─── Load saved price/weight from localStorage ─────────────────────────
  load: function () {
    try {
      var raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  },

  // ─── Save price/weight to localStorage ─────────────────────────────────
  save: function (price, weight) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({ price: price, weight: weight }));
    } catch (e) { /* ignore */ }
  },

  // ─── Get cost per gram ─────────────────────────────────────────────────
  costPerGram: function () {
    var data = this.load();
    if (!data || !data.price || !data.weight) return null;
    return data.price / data.weight;
  }
};

// ─── Get cost per cup for a given dose (g) ─────────────────────────────────
function getCostPerCup(recipeDose) {
  var cpg = V60_COST_TRACKER.costPerGram();
  if (!cpg) return null;
  return Math.round(cpg * recipeDose * 100) / 100;
}

// ─── Render a small cost badge (inline HTML) ───────────────────────────────
function renderCostBadge(recipeDose) {
  var cost = getCostPerCup(recipeDose);
  if (cost === null) return '';
  return '<span style="display:inline-flex;align-items:center;gap:3px;' +
    'background:var(--okBg);color:var(--ok);font-size:11px;font-weight:700;' +
    'padding:2px 8px;border-radius:20px;margin-inline-start:6px" title="تكلفة البن لهالكوب">' +
    '~' + cost.toFixed(1) + ' \u0631.\u0633' +
    '</span>';
}

// ─── Calculate and display results ─────────────────────────────────────────
function calculateCost() {
  var priceEl = document.getElementById('costPrice');
  var weightEl = document.getElementById('costWeight');
  var resultsEl = document.getElementById('costResults');
  if (!priceEl || !weightEl || !resultsEl) return;

  var price = parseFloat(priceEl.value);
  var weight = parseFloat(weightEl.value);

  if (!price || price <= 0 || !weight || weight <= 0) {
    resultsEl.innerHTML =
      '<div style="text-align:center;padding:16px;color:var(--hot);font-size:13px">' +
      '\u26A0\uFE0F ادخل السعر والوزن بشكل صحيح' +
      '</div>';
    return;
  }

  // Save to localStorage
  V60_COST_TRACKER.save(price, weight);

  var cpg = price / weight;
  var cupsFromBag = Math.floor(weight / 20); // average 20g dose

  // Build per-recipe table using global D (all recipes)
  var recipes = (typeof D !== 'undefined') ? D : [];
  var rows = '';
  for (var i = 0; i < recipes.length; i++) {
    var r = recipes[i];
    var cost = Math.round(cpg * r.dose * 100) / 100;
    rows +=
      '<tr>' +
      '<td style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--border);font-size:12px">' +
        r.mA +
      '</td>' +
      '<td style="text-align:center;padding:6px 8px;border-bottom:1px solid var(--border);font-size:12px" class="en">' +
        r.dose + 'g' +
      '</td>' +
      '<td style="text-align:center;padding:6px 8px;border-bottom:1px solid var(--border);font-size:13px;font-weight:700;color:var(--ok)">' +
        cost.toFixed(1) + ' \u0631.\u0633' +
      '</td>' +
      '</tr>';
  }

  resultsEl.innerHTML =
    // Summary cards
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">' +
      // Cost per gram
      '<div style="background:var(--card2);border-radius:var(--r3);padding:10px;text-align:center">' +
        '<div style="font-size:10px;color:var(--t3);margin-bottom:4px">\u0633\u0639\u0631 \u0627\u0644\u062C\u0631\u0627\u0645</div>' +
        '<div style="font-size:16px;font-weight:900;color:var(--a1)" class="en">' + cpg.toFixed(2) + '</div>' +
        '<div style="font-size:9px;color:var(--t3)">\u0631.\u0633/g</div>' +
      '</div>' +
      // Average cup cost (20g)
      '<div style="background:var(--card2);border-radius:var(--r3);padding:10px;text-align:center">' +
        '<div style="font-size:10px;color:var(--t3);margin-bottom:4px">\u0645\u062A\u0648\u0633\u0637 \u0627\u0644\u0643\u0648\u0628</div>' +
        '<div style="font-size:16px;font-weight:900;color:var(--ok)">' + (cpg * 20).toFixed(1) + '</div>' +
        '<div style="font-size:9px;color:var(--t3)">\u0631.\u0633 (20g)</div>' +
      '</div>' +
      // Cups per bag
      '<div style="background:var(--card2);border-radius:var(--r3);padding:10px;text-align:center">' +
        '<div style="font-size:10px;color:var(--t3);margin-bottom:4px">\u0623\u0643\u0648\u0627\u0628 \u0628\u0627\u0644\u0643\u064A\u0633</div>' +
        '<div style="font-size:16px;font-weight:900;color:var(--t1)">' + cupsFromBag + '</div>' +
        '<div style="font-size:9px;color:var(--t3)">\u0643\u0648\u0628 \u062A\u0642\u0631\u064A\u0628\u0627\u064B</div>' +
      '</div>' +
    '</div>' +

    // Recipes table
    (rows ?
      '<div style="margin-top:8px">' +
        '<div style="font-size:12px;font-weight:700;color:var(--t2);margin-bottom:6px">' +
          '\u062A\u0643\u0644\u0641\u0629 \u0643\u0644 \u0648\u0635\u0641\u0629:' +
        '</div>' +
        '<div style="overflow-x:auto;max-height:280px;overflow-y:auto;border-radius:var(--r3);border:1px solid var(--border)">' +
          '<table style="width:100%;border-collapse:collapse">' +
            '<thead><tr style="background:var(--card2)">' +
              '<th style="text-align:right;padding:8px;font-size:11px;color:var(--t3);font-weight:700">\u0627\u0644\u0648\u0635\u0641\u0629</th>' +
              '<th style="text-align:center;padding:8px;font-size:11px;color:var(--t3);font-weight:700">\u0627\u0644\u062C\u0631\u0639\u0629</th>' +
              '<th style="text-align:center;padding:8px;font-size:11px;color:var(--t3);font-weight:700">\u0627\u0644\u062A\u0643\u0644\u0641\u0629</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>'
    : '') +

    // Tip
    '<div style="margin-top:12px;padding:10px;background:var(--warnBg);border-radius:var(--r3);font-size:11px;color:var(--warn)">' +
      '\uD83D\uDCA1 \u0647\u0627\u0644\u062D\u0633\u0627\u0628 \u064A\u0634\u0645\u0644 \u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0628\u0646 \u0628\u0633 \u2014 \u0628\u062F\u0648\u0646 \u0627\u0644\u0641\u0644\u0627\u062A\u0631 \u0648\u0627\u0644\u0645\u0627\u0621 \u0648\u0627\u0644\u0643\u0647\u0631\u0628\u0627' +
    '</div>';
}

// ─── Render the full cost tool card HTML ────────────────────────────────────
function renderCostTool() {
  // Load saved values
  var saved = V60_COST_TRACKER.load();
  var savedPrice = saved ? saved.price : '';
  var savedWeight = saved ? saved.weight : '';

  return '<div class="tool-card" id="toolCost">' +
    '<h4 style="font-size:14px;font-weight:800;margin-bottom:12px;display:flex;align-items:center;gap:8px">' +
      '\uD83D\uDCB0 \u062D\u0627\u0633\u0628\u0629 \u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0643\u0648\u0628' +
    '</h4>' +
    '<p style="font-size:12px;color:var(--t3);margin-bottom:12px;line-height:1.6">' +
      '\u0627\u062D\u0633\u0628 \u0643\u0645 \u064A\u0643\u0644\u0641\u0643 \u0643\u0644 \u0643\u0648\u0628 \u0642\u0647\u0648\u0629 \u0645\u0646 \u0643\u064A\u0633\u0643 \u0627\u0644\u062D\u0627\u0644\u064A' +
    '</p>' +
    '<div style="display:flex;gap:8px;margin:12px 0">' +
      '<div style="flex:1">' +
        '<label style="font-size:11px;color:var(--t3);display:block;margin-bottom:4px">\u0633\u0639\u0631 \u0627\u0644\u0643\u064A\u0633 (\u0631.\u0633)</label>' +
        '<input type="number" id="costPrice" class="fs" style="width:100%" placeholder="85" ' +
          (savedPrice ? 'value="' + savedPrice + '"' : '') + '>' +
      '</div>' +
      '<div style="flex:1">' +
        '<label style="font-size:11px;color:var(--t3);display:block;margin-bottom:4px">\u0648\u0632\u0646 \u0627\u0644\u0643\u064A\u0633 (g)</label>' +
        '<input type="number" id="costWeight" class="fs" style="width:100%" placeholder="250" ' +
          (savedWeight ? 'value="' + savedWeight + '"' : '') + '>' +
      '</div>' +
    '</div>' +
    '<button onclick="calculateCost()" class="bcta" style="width:100%;margin:8px 0">' +
      '\u0627\u062D\u0633\u0628 \u0627\u0644\u062A\u0643\u0644\u0641\u0629' +
    '</button>' +
    '<div id="costResults"></div>' +
  '</div>';
}

// ─── Auto-calculate if saved data exists (called after DOM ready) ──────────
function initCostTracker() {
  var saved = V60_COST_TRACKER.load();
  if (saved && saved.price && saved.weight) {
    var priceEl = document.getElementById('costPrice');
    var weightEl = document.getElementById('costWeight');
    if (priceEl && weightEl) {
      priceEl.value = saved.price;
      weightEl.value = saved.weight;
      calculateCost();
    }
  }
}
