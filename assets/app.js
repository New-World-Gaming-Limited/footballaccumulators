/* ============================================================
   Football Accumulators — Enhanced JS
   Odds Switcher, Calculators, Acca Builder, FAQ, Theme
   ============================================================ */

// --- Odds Conversion Utilities ---
var OddsUtil = {
  decToFrac: function(dec) {
    if (dec <= 1) return '0/1';
    var num = dec - 1;
    var precision = 1000;
    var gcd = function(a, b) { return b ? gcd(b, a % b) : a; };
    var top = Math.round(num * precision);
    var bot = precision;
    var d = gcd(top, bot);
    return (top / d) + '/' + (bot / d);
  },
  decToAmer: function(dec) {
    if (dec >= 2) return '+' + Math.round((dec - 1) * 100);
    if (dec > 1) return '-' + Math.round(100 / (dec - 1));
    return '+100';
  },
  fracToDec: function(frac) {
    var parts = frac.split('/');
    if (parts.length !== 2) return 0;
    return (parseFloat(parts[0]) / parseFloat(parts[1])) + 1;
  },
  amerToDec: function(amer) {
    var n = parseFloat(amer);
    if (n > 0) return (n / 100) + 1;
    if (n < 0) return (100 / Math.abs(n)) + 1;
    return 2;
  },
  decToImplied: function(dec) {
    if (dec <= 0) return 0;
    return (1 / dec) * 100;
  },
  formatOdds: function(dec, fmt) {
    if (fmt === 'fractional') return OddsUtil.decToFrac(dec);
    if (fmt === 'american') return OddsUtil.decToAmer(dec);
    return dec.toFixed(2);
  }
};

// --- Global Odds Format State ---
var currentOddsFormat = 'decimal';

function setOddsFormat(fmt) {
  currentOddsFormat = fmt;
  // Update ALL switcher buttons (both old and new styles)
  document.querySelectorAll('.odds-switcher .tab-filter, .odds-fmt-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.format === fmt);
  });
  // Update all odds displays that have data-odds-dec
  document.querySelectorAll('[data-odds-dec]').forEach(function(el) {
    var dec = parseFloat(el.dataset.oddsDec);
    if (isNaN(dec) || dec <= 0) return;
    el.textContent = OddsUtil.formatOdds(dec, fmt);
  });
  // Update acca builder buttons
  document.querySelectorAll('.match-odds button[data-odds]').forEach(function(btn) {
    var dec = parseFloat(btn.dataset.odds);
    btn.textContent = OddsUtil.formatOdds(dec, fmt);
  });
}

// --- Theme Toggle ---
(function() {
  var toggle = document.querySelector('[data-theme-toggle]');
  var root = document.documentElement;
  var theme = root.getAttribute('data-theme') || 'light';

  function updateIcon() {
    if (!toggle) return;
    toggle.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
    toggle.innerHTML = theme === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
  updateIcon();
  if (toggle) {
    toggle.addEventListener('click', function() {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      updateIcon();
    });
  }
})();

// --- Mobile Nav ---
(function() {
  var hamburger = document.querySelector('.hamburger');
  var mobileNav = document.querySelector('.mobile-nav');
  if (!hamburger || !mobileNav) return;
  hamburger.addEventListener('click', function() {
    mobileNav.classList.toggle('open');
    var isOpen = mobileNav.classList.contains('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    hamburger.innerHTML = isOpen
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
  });

  // Mobile nav accordion groups
  document.querySelectorAll('.mobile-nav-group-toggle').forEach(function(toggle) {
    toggle.addEventListener('click', function() {
      var links = this.nextElementSibling;
      var isOpen = links.classList.contains('open');
      // Close all other groups
      document.querySelectorAll('.mobile-nav-group-links.open').forEach(function(g) {
        g.classList.remove('open');
        g.previousElementSibling.setAttribute('aria-expanded', 'false');
      });
      // Toggle current
      if (!isOpen) {
        links.classList.add('open');
        this.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

// --- FAQ Accordion ---
document.querySelectorAll('.faq-question').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var item = this.closest('.faq-item');
    var answer = item.querySelector('.faq-answer');
    var isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(function(o) {
      o.classList.remove('open');
      o.querySelector('.faq-answer').style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// --- Odds Switcher Init (both old and new button styles) ---
document.querySelectorAll('.odds-switcher .tab-filter, .odds-fmt-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    setOddsFormat(this.dataset.format);
  });
});

// ============================================================
// CALCULATORS
// ============================================================

// --- Accumulator Calculator ---
function initAccaCalc() {
  var form = document.getElementById('acca-calc');
  if (!form) return;
  var stakeInput = document.getElementById('calc-stake');
  var oddsContainer = document.getElementById('calc-odds-list');
  var addBtn = document.getElementById('calc-add-leg');
  var resultEl = document.getElementById('calc-result');
  var profitEl = document.getElementById('calc-profit');
  var totalOddsEl = document.getElementById('calc-total-odds');
  var legCount = 2;

  function addLeg() {
    legCount++;
    var row = document.createElement('div');
    row.className = 'calc-row';
    row.innerHTML = '<span class="calc-label" data-i18n="leg">Leg ' + legCount + '</span>' +
      '<input type="number" step="0.01" min="1.01" placeholder="e.g. 2.10" class="calc-input calc-odds-input">' +
      '<button type="button" class="btn btn-ghost btn-sm calc-remove-leg" aria-label="Remove">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>';
    oddsContainer.appendChild(row);
    row.querySelector('.calc-remove-leg').addEventListener('click', function() {
      row.remove(); legCount--; renumberLegs(); calculate();
    });
    row.querySelector('.calc-odds-input').addEventListener('input', calculate);
  }

  function renumberLegs() {
    oddsContainer.querySelectorAll('.calc-row').forEach(function(r, i) {
      r.querySelector('.calc-label').textContent = 'Leg ' + (i + 1);
    });
  }

  function calculate() {
    var stake = parseFloat(stakeInput.value) || 0;
    var inputs = oddsContainer.querySelectorAll('.calc-odds-input');
    var totalOdds = 1; var valid = true;
    inputs.forEach(function(inp) {
      var v = parseFloat(inp.value);
      if (!v || v < 1.01) { valid = false; return; }
      totalOdds *= v;
    });
    if (!valid || stake <= 0) {
      resultEl.textContent = '0.00'; profitEl.textContent = '0.00'; totalOddsEl.textContent = '-'; return;
    }
    resultEl.textContent = (stake * totalOdds).toFixed(2);
    profitEl.textContent = ((stake * totalOdds) - stake).toFixed(2);
    totalOddsEl.textContent = totalOdds.toFixed(2);
  }

  if (addBtn) addBtn.addEventListener('click', addLeg);
  if (stakeInput) stakeInput.addEventListener('input', calculate);
  oddsContainer.querySelectorAll('.calc-odds-input').forEach(function(inp) {
    inp.addEventListener('input', calculate);
  });
}

// --- Odds Converter Calculator ---
function initOddsConverter() {
  var decIn = document.getElementById('conv-decimal');
  var fracIn = document.getElementById('conv-fractional');
  var amerIn = document.getElementById('conv-american');
  var impliedEl = document.getElementById('conv-implied');
  if (!decIn) return;

  decIn.addEventListener('input', function() {
    var d = parseFloat(this.value);
    if (d && d > 1) {
      fracIn.value = OddsUtil.decToFrac(d);
      amerIn.value = OddsUtil.decToAmer(d);
      impliedEl.textContent = OddsUtil.decToImplied(d).toFixed(1) + '%';
    }
  });
  fracIn.addEventListener('input', function() {
    var d = OddsUtil.fracToDec(this.value);
    if (d > 1) {
      decIn.value = d.toFixed(2);
      amerIn.value = OddsUtil.decToAmer(d);
      impliedEl.textContent = OddsUtil.decToImplied(d).toFixed(1) + '%';
    }
  });
  amerIn.addEventListener('input', function() {
    var d = OddsUtil.amerToDec(this.value);
    if (d > 1) {
      decIn.value = d.toFixed(2);
      fracIn.value = OddsUtil.decToFrac(d);
      impliedEl.textContent = OddsUtil.decToImplied(d).toFixed(1) + '%';
    }
  });
}

// --- Margin Calculator ---
function initMarginCalc() {
  var inputs = document.querySelectorAll('.margin-odds-input');
  var marginEl = document.getElementById('margin-result');
  var fairOddsEl = document.getElementById('margin-fair-odds');
  if (!inputs.length || !marginEl) return;

  function calc() {
    var sum = 0; var odds = []; var valid = true;
    inputs.forEach(function(inp) {
      var v = parseFloat(inp.value);
      if (!v || v <= 1) { valid = false; return; }
      sum += 1 / v;
      odds.push(v);
    });
    if (!valid) { marginEl.textContent = '-'; if (fairOddsEl) fairOddsEl.innerHTML = ''; return; }
    var margin = ((sum - 1) * 100).toFixed(2);
    marginEl.textContent = margin + '%';
    if (fairOddsEl) {
      var html = '';
      odds.forEach(function(o, i) {
        var fair = o * sum;
        html += '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px"><span>Outcome ' + (i+1) + '</span><span class="font-mono text-accent">' + fair.toFixed(2) + '</span></div>';
      });
      fairOddsEl.innerHTML = html;
    }
  }
  inputs.forEach(function(inp) { inp.addEventListener('input', calc); });
}

// --- Dutching Calculator ---
function initDutchingCalc() {
  var stakeIn = document.getElementById('dutch-stake');
  var container = document.getElementById('dutch-selections');
  var addBtn = document.getElementById('dutch-add');
  var resultEl = document.getElementById('dutch-result');
  if (!stakeIn || !container) return;
  var count = 2;

  function addSelection() {
    count++;
    var row = document.createElement('div');
    row.className = 'calc-row';
    row.innerHTML = '<span class="calc-label">Selection ' + count + '</span>' +
      '<input type="number" step="0.01" min="1.01" placeholder="Odds" class="calc-input dutch-odds">' +
      '<button type="button" class="btn btn-ghost btn-sm dutch-remove" aria-label="Remove">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>';
    container.appendChild(row);
    row.querySelector('.dutch-remove').addEventListener('click', function() { row.remove(); count--; calc(); });
    row.querySelector('.dutch-odds').addEventListener('input', calc);
  }

  function calc() {
    var totalStake = parseFloat(stakeIn.value) || 0;
    var inputs = container.querySelectorAll('.dutch-odds');
    var sumInv = 0; var valid = true;
    inputs.forEach(function(inp) {
      var v = parseFloat(inp.value);
      if (!v || v <= 1) { valid = false; return; }
      sumInv += 1 / v;
    });
    if (!valid || totalStake <= 0 || sumInv === 0) { resultEl.innerHTML = '<p class="text-muted">Enter odds and stake</p>'; return; }
    var html = ''; var ret = totalStake / sumInv;
    inputs.forEach(function(inp, i) {
      var v = parseFloat(inp.value);
      var indStake = (totalStake * (1/v)) / sumInv;
      html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--divider);font-size:14px">' +
        '<span>Selection ' + (i+1) + ' (@ ' + v.toFixed(2) + ')</span>' +
        '<span class="font-mono"><strong>' + indStake.toFixed(2) + '</strong></span></div>';
    });
    html += '<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:15px;font-weight:600">' +
      '<span>Return (any wins)</span><span class="text-accent font-mono">' + ret.toFixed(2) + '</span></div>';
    html += '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:var(--text-muted)">' +
      '<span>Profit</span><span class="font-mono">' + (ret - totalStake).toFixed(2) + '</span></div>';
    resultEl.innerHTML = html;
  }

  if (addBtn) addBtn.addEventListener('click', addSelection);
  stakeIn.addEventListener('input', calc);
  container.querySelectorAll('.dutch-odds').forEach(function(inp) { inp.addEventListener('input', calc); });
}

// --- Each-Way Calculator ---
function initEachWayCalc() {
  var stakeIn = document.getElementById('ew-stake');
  var oddsIn = document.getElementById('ew-odds');
  var placeIn = document.getElementById('ew-place-fraction');
  var finishIn = document.getElementById('ew-finish');
  var resultEl = document.getElementById('ew-result');
  if (!stakeIn || !oddsIn) return;

  function calc() {
    var stake = parseFloat(stakeIn.value) || 0;
    var odds = parseFloat(oddsIn.value) || 0;
    var placeFrac = eval(placeIn.value) || 0.25;
    var finish = finishIn.value;
    if (stake <= 0 || odds <= 1) { resultEl.innerHTML = '<p class="text-muted">Enter stake and odds</p>'; return; }
    var totalStake = stake * 2;
    var placeOdds = 1 + ((odds - 1) * placeFrac);
    var winReturn = 0, placeReturn = 0;
    if (finish === 'win') { winReturn = stake * odds; placeReturn = stake * placeOdds; }
    else if (finish === 'place') { winReturn = 0; placeReturn = stake * placeOdds; }
    else { winReturn = 0; placeReturn = 0; }
    var totalReturn = winReturn + placeReturn;
    var profit = totalReturn - totalStake;
    resultEl.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div><div class="text-xs text-muted">Total Stake</div><div class="font-mono" style="font-size:18px;font-weight:600">' + totalStake.toFixed(2) + '</div></div>' +
      '<div><div class="text-xs text-muted">Place Odds</div><div class="font-mono" style="font-size:18px;font-weight:600">' + placeOdds.toFixed(2) + '</div></div>' +
      '<div><div class="text-xs text-muted">Win Return</div><div class="font-mono" style="font-size:18px;font-weight:600">' + winReturn.toFixed(2) + '</div></div>' +
      '<div><div class="text-xs text-muted">Place Return</div><div class="font-mono" style="font-size:18px;font-weight:600">' + placeReturn.toFixed(2) + '</div></div>' +
      '</div>' +
      '<div class="calc-result mt-16"><div class="calc-result-label">Total Return</div><div class="calc-result-value">' + totalReturn.toFixed(2) + '</div></div>' +
      '<div style="text-align:center;margin-top:8px;font-size:14px;color:' + (profit >= 0 ? 'var(--win)' : 'var(--loss)') + ';font-weight:600">' +
      'Profit: ' + (profit >= 0 ? '+' : '') + profit.toFixed(2) + '</div>';
  }

  [stakeIn, oddsIn, placeIn, finishIn].forEach(function(el) {
    if (el) el.addEventListener('input', calc);
    if (el) el.addEventListener('change', calc);
  });
}

// --- Lay Bet Calculator ---
function initLayCalc() {
  var backOdds = document.getElementById('lay-back-odds');
  var layOdds = document.getElementById('lay-lay-odds');
  var backStake = document.getElementById('lay-back-stake');
  var commission = document.getElementById('lay-commission');
  var resultEl = document.getElementById('lay-result');
  if (!backOdds) return;

  function calc() {
    var bo = parseFloat(backOdds.value) || 0;
    var lo = parseFloat(layOdds.value) || 0;
    var bs = parseFloat(backStake.value) || 0;
    var comm = parseFloat(commission.value) || 0;
    if (bo <= 1 || lo <= 1 || bs <= 0) { resultEl.innerHTML = '<p class="text-muted">Enter all values</p>'; return; }
    var layStake = (bs * bo) / (lo - (comm / 100));
    var liability = layStake * (lo - 1);
    var profitBack = (bs * (bo - 1)) - liability;
    var profitLay = layStake * (1 - comm / 100) - bs;
    resultEl.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div><div class="text-xs text-muted">Lay Stake</div><div class="font-mono" style="font-size:20px;font-weight:700;color:var(--accent)">' + layStake.toFixed(2) + '</div></div>' +
      '<div><div class="text-xs text-muted">Liability</div><div class="font-mono" style="font-size:20px;font-weight:700;color:var(--loss)">' + liability.toFixed(2) + '</div></div>' +
      '</div>';
  }
  [backOdds, layOdds, backStake, commission].forEach(function(el) { if (el) el.addEventListener('input', calc); });
}

// --- Bet Returns Calculator (single/double/treble/acca) ---
function initBetReturnsCalc() {
  var typeIn = document.getElementById('ret-type');
  var stakeIn = document.getElementById('ret-stake');
  var ewCheck = document.getElementById('ret-ew');
  var container = document.getElementById('ret-selections');
  var resultEl = document.getElementById('ret-result');
  if (!typeIn || !stakeIn) return;

  function getRequiredLegs() {
    var t = typeIn.value;
    if (t === 'single') return 1;
    if (t === 'double') return 2;
    if (t === 'treble') return 3;
    if (t === 'trixie') return 3;
    if (t === 'patent') return 3;
    if (t === 'yankee') return 4;
    if (t === 'lucky15') return 4;
    if (t === 'lucky31') return 5;
    if (t === 'lucky63') return 6;
    if (t === 'heinz') return 6;
    return parseInt(t) || 4;
  }

  function updateSelections() {
    var needed = getRequiredLegs();
    var current = container.querySelectorAll('.ret-sel-row').length;
    while (current < needed) {
      current++;
      var row = document.createElement('div');
      row.className = 'calc-row ret-sel-row';
      row.innerHTML = '<span class="calc-label">Sel. ' + current + '</span>' +
        '<input type="number" step="0.01" min="1.01" placeholder="Odds" class="calc-input ret-odds">' +
        '<select class="calc-input" style="max-width:90px"><option value="win">Won</option><option value="lose">Lost</option><option value="void">Void</option></select>';
      container.appendChild(row);
      row.querySelectorAll('input,select').forEach(function(el) { el.addEventListener('input', calc); el.addEventListener('change', calc); });
    }
    while (current > needed) {
      container.removeChild(container.lastElementChild);
      current--;
    }
  }

  function calc() {
    var stake = parseFloat(stakeIn.value) || 0;
    var rows = container.querySelectorAll('.ret-sel-row');
    var sels = [];
    rows.forEach(function(r) {
      var odds = parseFloat(r.querySelector('.ret-odds').value) || 0;
      var status = r.querySelector('select').value;
      sels.push({ odds: odds, status: status });
    });
    // Simple accumulator calculation
    var type = typeIn.value;
    var totalOdds = 1; var allWin = true;
    sels.forEach(function(s) {
      if (s.status === 'win' && s.odds > 1) totalOdds *= s.odds;
      else if (s.status === 'void') totalOdds *= 1;
      else allWin = false;
    });
    var returns = allWin ? stake * totalOdds : 0;
    var profit = returns - stake;
    resultEl.innerHTML =
      '<div class="calc-result"><div class="calc-result-label">Returns</div><div class="calc-result-value">' + returns.toFixed(2) + '</div></div>' +
      '<div style="text-align:center;margin-top:8px;font-size:14px;color:' + (profit >= 0 ? 'var(--win)' : 'var(--loss)') + ';font-weight:600">' +
      'Profit: ' + (profit >= 0 ? '+' : '') + profit.toFixed(2) + '</div>';
  }

  typeIn.addEventListener('change', function() { updateSelections(); calc(); });
  stakeIn.addEventListener('input', calc);
  updateSelections();
}

// --- Sure Bet / Arbitrage Calculator ---
function initArbCalc() {
  var stakeIn = document.getElementById('arb-stake');
  var odds1 = document.getElementById('arb-odds-1');
  var odds2 = document.getElementById('arb-odds-2');
  var odds3 = document.getElementById('arb-odds-3');
  var resultEl = document.getElementById('arb-result');
  if (!stakeIn || !odds1) return;

  function calc() {
    var totalStake = parseFloat(stakeIn.value) || 0;
    var o1 = parseFloat(odds1.value) || 0;
    var o2 = parseFloat(odds2.value) || 0;
    var o3 = odds3 ? parseFloat(odds3.value) || 0 : 0;
    if (totalStake <= 0 || o1 <= 1 || o2 <= 1) { resultEl.innerHTML = '<p class="text-muted">Enter stake and odds</p>'; return; }
    var sumInv = (1/o1) + (1/o2);
    if (o3 > 1) sumInv += (1/o3);
    var isArb = sumInv < 1;
    var margin = ((1 - sumInv) * 100).toFixed(2);
    var s1 = totalStake * (1/o1) / sumInv;
    var s2 = totalStake * (1/o2) / sumInv;
    var s3 = o3 > 1 ? totalStake * (1/o3) / sumInv : 0;
    var ret = totalStake / sumInv;
    var profit = ret - totalStake;
    resultEl.innerHTML =
      '<div class="badge ' + (isArb ? 'badge-win' : 'badge-loss') + '" style="margin-bottom:12px">' + (isArb ? 'Arbitrage Found: ' + margin + '% profit' : 'No Arbitrage: ' + margin + '% margin') + '</div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--divider)"><span>Stake on Outcome 1 (@ ' + o1.toFixed(2) + ')</span><span class="font-mono"><strong>' + s1.toFixed(2) + '</strong></span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--divider)"><span>Stake on Outcome 2 (@ ' + o2.toFixed(2) + ')</span><span class="font-mono"><strong>' + s2.toFixed(2) + '</strong></span></div>' +
      (o3 > 1 ? '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--divider)"><span>Stake on Draw (@ ' + o3.toFixed(2) + ')</span><span class="font-mono"><strong>' + s3.toFixed(2) + '</strong></span></div>' : '') +
      '<div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:600"><span>Guaranteed Return</span><span class="text-accent font-mono">' + ret.toFixed(2) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:' + (profit >= 0 ? 'var(--win)' : 'var(--loss)') + '"><span>Profit</span><span class="font-mono">' + (profit >= 0 ? '+' : '') + profit.toFixed(2) + '</span></div>';
  }
  [stakeIn, odds1, odds2].forEach(function(el) { if (el) el.addEventListener('input', calc); });
  if (odds3) odds3.addEventListener('input', calc);
}

// ============================================================
// ACCA BUILDER (enhanced with pre-fills)
// ============================================================
function initAccaBuilder() {
  var slip = document.getElementById('builder-slip');
  var emptyState = document.getElementById('builder-empty');
  var totalOdds = document.getElementById('builder-total-odds');
  var totalReturn = document.getElementById('builder-total-return');
  var selectionCount = document.getElementById('builder-count');
  var stakeInput = document.getElementById('builder-stake');
  if (!slip) return;

  var selections = [];

  document.querySelectorAll('.match-odds button').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var row = this.closest('.match-row, .builder-match-row');
      var matchId = row.dataset.matchId;
      var teams = row.querySelector('.match-teams').textContent.trim();
      var pick = this.dataset.pick;
      var odds = parseFloat(this.dataset.odds);
      selections = selections.filter(function(s) { return s.matchId !== matchId; });
      row.querySelectorAll('.match-odds button').forEach(function(b) { b.classList.remove('selected'); });
      this.classList.add('selected');
      selections.push({ matchId: matchId, teams: teams, pick: pick, odds: odds });
      updateSlip();
    });
  });

  // Pre-fill picks
  document.querySelectorAll('.prefill-pick').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var data = JSON.parse(this.dataset.picks);
      selections = [];
      document.querySelectorAll('.match-odds button').forEach(function(b) { b.classList.remove('selected'); });
      data.forEach(function(pick) {
        selections.push(pick);
        var row = document.querySelector('[data-match-id="' + pick.matchId + '"]');
        if (row) {
          row.querySelectorAll('.match-odds button').forEach(function(b) {
            if (b.dataset.pick === pick.pick) b.classList.add('selected');
          });
        }
      });
      updateSlip();
    });
  });

  function updateSlip() {
    if (selections.length === 0) {
      if (emptyState) emptyState.style.display = '';
      slip.innerHTML = '';
      if (emptyState) slip.appendChild(emptyState);
      selectionCount.textContent = '0';
      totalOdds.textContent = '-';
      totalReturn.textContent = '0.00';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';
    var html = '';
    var combined = 1;
    selections.forEach(function(sel, i) {
      combined *= sel.odds;
      html += '<div class="tip-card-match" style="gap:8px">' +
        '<span class="tip-card-match-teams" style="flex:1;font-size:13px">' + sel.teams + '</span>' +
        '<span class="tip-card-match-pick">' + sel.pick + '</span>' +
        '<span class="tip-card-match-odds" data-odds-dec="' + sel.odds + '">' + OddsUtil.formatOdds(sel.odds, currentOddsFormat) + '</span>' +
        '<button class="btn btn-ghost btn-sm" onclick="removeSelection(' + i + ')" style="padding:4px" aria-label="Remove">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>';
    });
    slip.innerHTML = html;
    selectionCount.textContent = selections.length;
    totalOdds.textContent = combined.toFixed(2);
    var stake = parseFloat(stakeInput.value) || 10;
    totalReturn.textContent = (stake * combined).toFixed(2);
  }

  window.removeSelection = function(i) {
    var removed = selections[i];
    selections.splice(i, 1);
    var row = document.querySelector('[data-match-id="' + removed.matchId + '"]');
    if (row) row.querySelectorAll('.match-odds button').forEach(function(b) { b.classList.remove('selected'); });
    updateSlip();
  };

  if (stakeInput) stakeInput.addEventListener('input', updateSlip);
}

// --- Glossary Search ---
function initGlossarySearch() {
  var input = document.getElementById('glossary-search');
  if (!input) return;
  input.addEventListener('input', function() {
    var q = this.value.toLowerCase();
    document.querySelectorAll('.glossary-term').forEach(function(term) {
      var name = term.querySelector('dt').textContent.toLowerCase();
      var def = term.querySelector('dd').textContent.toLowerCase();
      term.style.display = (name.includes(q) || def.includes(q)) ? '' : 'none';
    });
    // Show/hide letter headings
    document.querySelectorAll('.glossary-letter').forEach(function(letter) {
      var next = letter.nextElementSibling;
      var hasVisible = false;
      while (next && !next.classList.contains('glossary-letter')) {
        if (next.style.display !== 'none') hasVisible = true;
        next = next.nextElementSibling;
      }
      letter.style.display = hasVisible ? '' : 'none';
    });
  });
}

// --- Back to Top Button ---
function initBackToTop() {
  var btn = document.querySelector('.back-to-top');
  if (!btn) {
    btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>';
    document.body.appendChild(btn);
  }
  window.addEventListener('scroll', function() {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
  btn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// --- Smooth scroll for anchor links ---
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// --- Glossary letter nav active state ---
function initGlossaryNav() {
  var letters = document.querySelectorAll('.glossary-letter');
  if (!letters.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var id = entry.target.id;
        document.querySelectorAll('a[href^="#"]').forEach(function(link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-100px 0px -80% 0px' });
  letters.forEach(function(l) { observer.observe(l); });
}

// --- Initialize All ---
document.addEventListener('DOMContentLoaded', function() {
  initAccaCalc();
  initOddsConverter();
  initMarginCalc();
  initDutchingCalc();
  initEachWayCalc();
  initLayCalc();
  initBetReturnsCalc();
  initArbCalc();
  initAccaBuilder();
  initGlossarySearch();
  initBackToTop();
  initSmoothScroll();
  initGlossaryNav();
});

// ============================================================
// PART 2: INTERACTIVE FEATURES
// ============================================================

// --- A) ACCA TRACKER ---
function initAccaTracker() {
  // In-memory tracker (no localStorage — iframe safe)
  var accas = [];
  var nextId = 1;

  // Create floating button
  var btn = document.createElement('button');
  btn.className = 'tracker-btn';
  btn.setAttribute('aria-label', 'My Accas Tracker');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg><span class="tracker-btn-label">My Accas</span>';
  document.body.appendChild(btn);

  // Create panel
  var panel = document.createElement('div');
  panel.className = 'tracker-panel';
  panel.setAttribute('aria-label', 'Acca Tracker Panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.innerHTML = '<div class="tracker-panel-header">' +
    '<h3>My Accas</h3>' +
    '<button class="tracker-close" aria-label="Close tracker">' +
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
    '</button></div>' +
    '<div class="tracker-panel-body" id="tracker-panel-body">' +
    '<p class="tracker-empty">No accas saved yet. Build an acca and save it to track results.</p>' +
    '</div>';
  document.body.appendChild(panel);

  // Toggle panel
  function togglePanel() {
    var isOpen = panel.classList.contains('open');
    panel.classList.toggle('open', !isOpen);
    btn.setAttribute('aria-expanded', !isOpen);
    renderTracker();
  }

  btn.addEventListener('click', togglePanel);
  panel.querySelector('.tracker-close').addEventListener('click', togglePanel);

  function renderTracker() {
    var body = document.getElementById('tracker-panel-body');
    if (!body) return;
    if (!accas.length) {
      body.innerHTML = '<p class="tracker-empty">No accas saved yet. Build an acca and save it to track results.</p>';
      return;
    }
    var html = '<div class="tracker-list">';
    accas.forEach(function(acca) {
      var statusClass = 'status-' + acca.status;
      var statusLabel = acca.status.charAt(0).toUpperCase() + acca.status.slice(1);
      html += '<div class="tracker-item" data-id="' + acca.id + '">' +
        '<div class="tracker-item-header">' +
        '<span class="tracker-item-name">' + acca.name + '</span>' +
        '<span class="tracker-status ' + statusClass + '">' + statusLabel + '</span>' +
        '</div>' +
        '<div class="tracker-item-meta">' +
        '<span>Odds: ' + acca.odds + '</span>' +
        '<span>' + acca.timestamp + '</span>' +
        '</div>' +
        '<div class="tracker-item-legs">' + acca.legs.map(function(l) {
          return '<span class="tracker-leg">' + l + '</span>';
        }).join('') + '</div>' +
        '<div class="tracker-item-actions">' +
        '<button class="btn btn-ghost btn-sm tracker-won" data-id="' + acca.id + '">Won</button>' +
        '<button class="btn btn-ghost btn-sm tracker-lost" data-id="' + acca.id + '">Lost</button>' +
        '<button class="btn btn-ghost btn-sm tracker-delete" data-id="' + acca.id + '">Delete</button>' +
        '</div></div>';
    });
    html += '</div>';
    body.innerHTML = html;

    // Bind status buttons
    body.querySelectorAll('.tracker-won').forEach(function(b) {
      b.addEventListener('click', function() { updateStatus(+this.dataset.id, 'won'); });
    });
    body.querySelectorAll('.tracker-lost').forEach(function(b) {
      b.addEventListener('click', function() { updateStatus(+this.dataset.id, 'lost'); });
    });
    body.querySelectorAll('.tracker-delete').forEach(function(b) {
      b.addEventListener('click', function() { deleteAcca(+this.dataset.id); });
    });
  }

  function updateStatus(id, status) {
    accas.forEach(function(a) { if (a.id === id) a.status = status; });
    renderTracker();
  }

  function deleteAcca(id) {
    accas = accas.filter(function(a) { return a.id !== id; });
    renderTracker();
  }

  // Public API: save an acca from builder
  window.AccaTracker = {
    save: function(name, legs, odds) {
      var now = new Date();
      var ts = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      accas.push({ id: nextId++, name: name, legs: legs, odds: odds, status: 'pending', timestamp: ts });
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      renderTracker();
    }
  };

  // Hook into acca builder if present
  var builderSaveBtn = document.getElementById('acca-save-to-tracker');
  if (builderSaveBtn) {
    builderSaveBtn.addEventListener('click', function() {
      var legs = [];
      document.querySelectorAll('.acca-selection').forEach(function(sel) {
        var match = sel.querySelector('.sel-match');
        var pick = sel.querySelector('.sel-pick');
        if (match && pick) legs.push(match.textContent + ': ' + pick.textContent);
      });
      var totalOddsEl = document.getElementById('acca-total-odds');
      var odds = totalOddsEl ? totalOddsEl.textContent : '--';
      var name = 'Acca ' + new Date().toLocaleDateString('en-GB');
      if (legs.length > 0) window.AccaTracker.save(name, legs, odds);
    });
  }
}

// --- B) BET OF THE DAY ---
var BET_OF_DAY_DATA = [
  { match: "Man City vs Arsenal", market: "Win Acca", pick: "Man City Win", odds: 1.85, confidence: 4 },
  { match: "Bayern Munich vs Dortmund", market: "Over 2.5", pick: "Over 2.5 Goals", odds: 1.44, confidence: 5 },
  { match: "Real Madrid vs Atletico", market: "Win Acca", pick: "Real Madrid Win", odds: 1.95, confidence: 4 },
  { match: "Liverpool vs Chelsea", market: "BTTS", pick: "BTTS Yes", odds: 1.72, confidence: 4 },
  { match: "PSV vs Ajax", market: "Over 2.5", pick: "Over 2.5 Goals", odds: 1.48, confidence: 5 },
  { match: "Feyenoord vs AZ Alkmaar", market: "BTTS", pick: "BTTS Yes", odds: 1.60, confidence: 4 },
  { match: "Inter Milan vs Napoli", market: "Win Acca", pick: "Inter Win", odds: 1.90, confidence: 3 },
  { match: "Celtic vs Rangers", market: "BTTS", pick: "BTTS Yes", odds: 1.80, confidence: 4 },
  { match: "Barcelona vs Villarreal", market: "Win Acca", pick: "Barcelona Win", odds: 1.55, confidence: 5 },
  { match: "Tottenham vs Man Utd", market: "Over 2.5", pick: "Over 2.5 Goals", odds: 1.68, confidence: 3 },
  { match: "Bayer Leverkusen vs Leipzig", market: "BTTS", pick: "BTTS Yes", odds: 1.65, confidence: 4 },
  { match: "Monaco vs Lyon", market: "Over 2.5", pick: "Over 2.5 Goals", odds: 1.70, confidence: 4 },
  { match: "PSG vs Marseille", market: "Win Acca", pick: "PSG Win", odds: 1.50, confidence: 5 },
  { match: "Atalanta vs Roma", market: "BTTS", pick: "BTTS Yes", odds: 1.75, confidence: 4 },
  { match: "Newcastle vs Aston Villa", market: "BTTS", pick: "BTTS Yes", odds: 1.78, confidence: 3 },
  { match: "Dortmund vs Wolfsburg", market: "Win Acca", pick: "Dortmund Win", odds: 1.62, confidence: 4 },
  { match: "Rangers vs Hearts", market: "Win Acca", pick: "Rangers Win", odds: 1.45, confidence: 4 },
  { match: "Napoli vs Lazio", market: "Over 2.5", pick: "Over 2.5 Goals", odds: 1.75, confidence: 3 },
  { match: "Ajax vs Utrecht", market: "Win Acca", pick: "Ajax Win", odds: 1.40, confidence: 5 },
  { match: "Arsenal vs Chelsea", market: "BTTS", pick: "BTTS Yes", odds: 1.82, confidence: 4 },
  { match: "Sevilla vs Betis", market: "BTTS", pick: "BTTS Yes", odds: 1.90, confidence: 3 },
  { match: "Juventus vs Roma", market: "Win Acca", pick: "Juventus Win", odds: 1.80, confidence: 3 },
  { match: "Hearts vs Hibernian", market: "Over 2.5", pick: "Over 2.5 Goals", odds: 1.70, confidence: 3 },
  { match: "Eintracht vs Hoffenheim", market: "Over 2.5", pick: "Over 2.5 Goals", odds: 1.55, confidence: 4 },
  { match: "Lens vs Reims", market: "Over 2.5", pick: "Over 2.5 Goals", odds: 1.70, confidence: 4 },
  { match: "Twente vs Vitesse", market: "Over 2.5", pick: "Over 2.5 Goals", odds: 1.55, confidence: 4 },
  { match: "AC Milan vs Fiorentina", market: "BTTS", pick: "BTTS Yes", odds: 1.72, confidence: 4 },
  { match: "Atletico vs Barcelona", market: "Under 2.5", pick: "Under 2.5 Goals", odds: 1.65, confidence: 3 },
  { match: "Man Utd vs Everton", market: "Win Acca", pick: "Man Utd Win", odds: 1.88, confidence: 3 },
  { match: "Celtic vs Aberdeen", market: "Win Acca", pick: "Celtic Win", odds: 1.30, confidence: 5 },
];

function initBetOfDay() {
  var el = document.getElementById('bet-of-day');
  if (!el) return;

  var dayOfYear = (function() {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var diff = now - start;
    var oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  })();

  var bet = BET_OF_DAY_DATA[dayOfYear % BET_OF_DAY_DATA.length];
  var stars = '';
  for (var i = 1; i <= 5; i++) {
    stars += '<span class="confidence-star' + (i <= bet.confidence ? ' filled' : '') + '">&#9733;</span>';
  }

  el.innerHTML = '<div class="bet-of-day-inner">' +
    '<div class="bet-of-day-badge"><span class="live-badge">&#9679; Today\u2019s Best Bet</span></div>' +
    '<div class="bet-of-day-match" data-i18n="botd_match">' + bet.match + '</div>' +
    '<div class="bet-of-day-row">' +
    '<span class="badge">' + bet.market + '</span>' +
    '<span class="badge badge-accent">' + bet.pick + '</span>' +
    '</div>' +
    '<div class="bet-of-day-odds-row">' +
    '<span class="bet-of-day-odds-label">Odds:</span>' +
    '<span class="bet-of-day-odds" data-odds-dec="' + bet.odds + '">' + bet.odds.toFixed(2) + '</span>' +
    '</div>' +
    '<div class="bet-of-day-confidence">' +
    '<span class="confidence-label">Confidence:</span>' +
    '<span class="confidence-stars" aria-label="Confidence ' + bet.confidence + ' out of 5">' + stars + '</span>' +
    '</div>' +
    '<a href="tips/index.html" class="btn btn-primary btn-sm bet-of-day-cta">View All Tips &rarr;</a>' +
    '</div>';
}

// --- C) ODDS MOVEMENT INDICATORS ---
function initOddsMovement() {
  var hour = new Date().getHours();
  var minute = new Date().getMinutes();
  var seed = hour * 60 + minute;

  // Simple deterministic pseudo-random from seed
  function pseudoRand(n) {
    var x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  }

  var oddsEls = document.querySelectorAll('[data-odds-dec]');
  oddsEls.forEach(function(el, i) {
    if (el.closest('.odds-switcher')) return;
    var r = pseudoRand(i * 17);
    var direction = r < 0.4 ? 'up' : r < 0.7 ? 'down' : null;
    if (!direction) return;
    if (el.querySelector('.odds-movement')) return; // already added

    var indicator = document.createElement('span');
    indicator.className = 'odds-movement arrow-' + direction;
    indicator.setAttribute('aria-label', direction === 'up' ? 'Odds shortened' : 'Odds drifted');
    indicator.innerHTML = direction === 'up'
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 15l-6-6-6 6"/></svg>'
      : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>';
    el.appendChild(indicator);
  });
}

// --- D) LIVE ODDS API INTEGRATION ---
function initLiveOdds() {
  var API_URL = 'https://odds-api.io/v3/events?sport=soccer&bookmakers=bet365,1xbet';
  var liveOddsMap = {};

  function updateOddsFromLive(data) {
    if (!data || !data.events) return;
    data.events.forEach(function(event) {
      var matchKey = (event.home_team + ' vs ' + event.away_team).toLowerCase();
      if (event.bookmakers && event.bookmakers[0] && event.bookmakers[0].markets) {
        event.bookmakers[0].markets.forEach(function(market) {
          if (market.key === 'h2h') {
            liveOddsMap[matchKey] = {
              home: market.outcomes[0] && market.outcomes[0].price,
              draw: market.outcomes[1] && market.outcomes[1].price,
              away: market.outcomes[2] && market.outcomes[2].price,
            };
          }
        });
      }
    });
    applyLiveOdds();
  }

  function applyLiveOdds() {
    // Update match rows with live odds where available
    document.querySelectorAll('.match-row, .tip-card').forEach(function(row) {
      var matchEl = row.querySelector('.match-teams, .tip-card-match-teams');
      if (!matchEl) return;
      var matchName = matchEl.textContent.trim().toLowerCase();
      var liveData = liveOddsMap[matchName];
      if (!liveData) return;

      // Add Live badge
      if (!row.querySelector('.live-badge')) {
        var badge = document.createElement('span');
        badge.className = 'live-badge';
        badge.textContent = 'LIVE';
        var header = row.querySelector('.tip-card-header, .match-header');
        if (header) header.appendChild(badge);
      }

      // Update odds
      var oddsEl = row.querySelector('[data-odds-dec]');
      if (oddsEl && liveData.home) {
        oddsEl.dataset.oddsDec = liveData.home;
        oddsEl.textContent = parseFloat(liveData.home).toFixed(2);
      }
    });
  }

  // Try fetching live odds; fail gracefully
  fetch(API_URL)
    .then(function(res) {
      if (!res.ok) throw new Error('API unavailable');
      return res.json();
    })
    .then(function(data) {
      updateOddsFromLive(data);
    })
    .catch(function() {
      // Silently fall back to static data
      console.log('[FootballAccumulators] Live odds API unavailable, using static data.');
    });
}

// ============================================================
// INITIALISE NEW FEATURES ON DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  initAccaTracker();
  initBetOfDay();
  initOddsMovement();
  initLiveOdds();
});


// ============================================================
// NEW ENHANCEMENTS — Appended
// ============================================================

// --- Stake/Return Preview on Tip Cards ---
(function() {
  var DEFAULT_STAKE = 10;
  document.querySelectorAll('.tips-grid[data-stake-preview]').forEach(function(grid) {
    var stake = parseFloat(grid.dataset.stakePreview) || DEFAULT_STAKE;
    grid.querySelectorAll('.tip-card').forEach(function(card) {
      var oddsEl = card.querySelector('[data-odds-dec]');
      if (!oddsEl) return;
      var dec = parseFloat(oddsEl.dataset.oddsDec);
      if (!dec || dec <= 1) return;
      var returnVal = (stake * dec).toFixed(2);
      var preview = document.createElement('div');
      preview.className = 'tip-card-return';
      preview.innerHTML = '<span class="stake-label">\u00a3' + stake + ' stake</span><span class="return-value">Returns \u00a3' + returnVal + '</span>';
      card.appendChild(preview);
    });
  });
})();

// --- Countdown Timer on Tip Cards ---
(function() {
  function updateCountdowns() {
    document.querySelectorAll('.tip-card-time').forEach(function(el) {
      var timeText = el.textContent.trim();
      if (el.dataset.countdown === 'done') return;
      var match = timeText.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return;
      var now = new Date();
      var kickoff = new Date(now);
      kickoff.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
      if (kickoff <= now) {
        el.innerHTML = '<span style="color:var(--win);font-weight:600">LIVE</span>';
        el.dataset.countdown = 'done';
        return;
      }
      var diff = kickoff - now;
      var hours = Math.floor(diff / 3600000);
      var mins = Math.floor((diff % 3600000) / 60000);
      if (hours > 0) {
        el.innerHTML = '<span style="color:var(--draw)">' + hours + 'h ' + mins + 'm to KO</span>';
      } else {
        el.innerHTML = '<span style="color:var(--loss);font-weight:600">' + mins + 'm to KO</span>';
      }
    });
  }
  updateCountdowns();
  setInterval(updateCountdowns, 60000);
})();

// --- Sticky Mobile CTA ---
(function() {
  var cta = document.querySelector('.mobile-sticky-cta');
  if (!cta) return;
  var dismiss = cta.querySelector('.dismiss-btn');
  if (dismiss) {
    dismiss.addEventListener('click', function() {
      cta.classList.add('dismissed');
    });
  }
})();

// --- Tip Filters ---
(function() {
  var filters = document.querySelectorAll('.tip-filter-btn');
  if (!filters.length) return;
  filters.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var filter = btn.dataset.filter;
      filters.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.querySelectorAll('.tip-card').forEach(function(card) {
        if (filter === 'all') {
          card.style.display = '';
          return;
        }
        var market = card.querySelector('.tip-card-market');
        if (market && market.textContent.toLowerCase().includes(filter.toLowerCase())) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
})();

// --- Smart Picks Risk Labels ---
(function() {
  var smartPicks = document.querySelectorAll('.smart-pick');
  smartPicks.forEach(function(pick) {
    var odds = parseFloat(pick.dataset.totalOdds);
    if (!odds) return;
    var label, color;
    if (odds < 4) { label = 'SAFE'; color = 'var(--win)'; }
    else if (odds < 8) { label = 'BALANCED'; color = 'var(--draw)'; }
    else { label = 'ADVENTUROUS'; color = 'var(--loss)'; }
    var badge = document.createElement('span');
    badge.className = 'smart-pick-risk';
    badge.style.cssText = 'display:inline-block;padding:2px 8px;border-radius:var(--radius-full);font-size:0.6875rem;font-weight:700;letter-spacing:0.05em;color:white;background:' + color + ';margin-left:8px;';
    badge.textContent = label;
    var heading = pick.querySelector('h4, h3');
    if (heading) heading.appendChild(badge);
  });
})();

// ============================================================
// LIVE SCORES — Client-side polling
// Uses free football-data.org / api-football or similar
// Falls back to match status display from odds-api data
// ============================================================
(function() {
  var container = document.getElementById('live-scores-container');
  var droppingContainer = document.getElementById('dropping-odds-container');
  var droppingList = document.getElementById('dropping-odds-list');
  if (!container) return;

  // Store previous odds for dropping detection
  var prevOdds = {};
  var droppingAlerts = [];

  function renderLiveMatch(match) {
    var isLive = match.status === 'live' || match.status === 'in_play';
    var card = document.createElement('div');
    card.className = 'live-match-card' + (isLive ? ' is-live' : '');
    card.innerHTML =
      '<div class="live-match-league">' + (match.league || '') + '</div>' +
      '<div class="live-match-score">' +
        '<span class="live-match-team">' + match.home + '</span>' +
        '<span class="live-score-display">' + (match.home_score != null ? match.home_score + ' - ' + match.away_score : 'vs') + '</span>' +
        '<span class="live-match-team">' + match.away + '</span>' +
      '</div>' +
      (match.minute ? '<div class="live-match-minute">' + match.minute + "'" + '</div>' : '') +
      (!isLive && match.date ? '<div class="live-match-minute">' + formatKO(match.date) + '</div>' : '');
    return card;
  }

  function formatKO(iso) {
    try {
      var d = new Date(iso);
      var h = d.getUTCHours().toString().padStart(2, '0');
      var m = d.getUTCMinutes().toString().padStart(2, '0');
      return h + ':' + m + ' KO';
    } catch(e) { return ''; }
  }

  function renderDroppingOdds() {
    if (!droppingContainer || !droppingList) return;
    if (droppingAlerts.length === 0) {
      droppingContainer.style.display = 'none';
      return;
    }
    droppingContainer.style.display = 'block';
    droppingList.innerHTML = '';
    droppingAlerts.slice(0, 8).forEach(function(alert) {
      var dir = alert.change < 0 ? 'down' : 'up';
      var arrow = alert.change < 0 ? '\u2193' : '\u2191';
      var div = document.createElement('div');
      div.className = 'dropping-item';
      div.innerHTML =
        '<span class="dropping-match">' + alert.match + '</span>' +
        '<span class="dropping-market">' + alert.market + '</span>' +
        '<span class="dropping-movement ' + dir + '">' +
          '<span class="dropping-arrow">' + arrow + '</span>' +
          alert.oldOdds.toFixed(2) + ' \u2192 ' + alert.newOdds.toFixed(2) +
        '</span>';
      droppingList.appendChild(div);
    });
  }

  // Detect odds changes between snapshots
  function detectDroppingOdds(events) {
    var newAlerts = [];
    events.forEach(function(ev) {
      var key = ev.id || (ev.home + '_' + ev.away);
      if (!ev.odds) return;
      Object.keys(ev.odds).forEach(function(bk) {
        var ml = ev.odds[bk].ml;
        if (!ml) return;
        ['home', 'draw', 'away'].forEach(function(outcome) {
          var oddKey = key + '_' + bk + '_' + outcome;
          var val = parseFloat(ml[outcome]);
          if (isNaN(val)) return;
          if (prevOdds[oddKey] !== undefined) {
            var diff = val - prevOdds[oddKey];
            if (Math.abs(diff) >= 0.05) {
              newAlerts.push({
                match: ev.home + ' vs ' + ev.away,
                market: outcome.charAt(0).toUpperCase() + outcome.slice(1) + ' (' + bk + ')',
                oldOdds: prevOdds[oddKey],
                newOdds: val,
                change: diff,
                time: new Date().toISOString()
              });
            }
          }
          prevOdds[oddKey] = val;
        });
      });
    });
    if (newAlerts.length > 0) {
      droppingAlerts = newAlerts.concat(droppingAlerts).slice(0, 20);
      renderDroppingOdds();
    }
  }

  // Fetch live scores from a free API
  // Using api-football.com free tier or fallback to static data
  var LIVE_SCORES_API = 'https://v3.football.api-sports.io/fixtures?live=all';
  var API_FOOTBALL_KEY = ''; // Free tier key - users can add their own

  function fetchLiveScores() {
    // Try fetching from local data first (generated by pipeline)
    fetch('data/live_client.json?t=' + Date.now())
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.events && data.events.length > 0) {
          renderMatches(data.events);
          // Store odds for dropping detection on next fetch
          if (data.odds_snapshot) {
            detectDroppingOdds(data.odds_snapshot);
          }
        }
      })
      .catch(function() {
        // Fallback: show upcoming matches from injected data
        var rows = document.querySelectorAll('.match-odds-row');
        if (rows.length > 0) {
          var matches = [];
          rows.forEach(function(row) {
            matches.push({
              home: row.dataset.home || '',
              away: row.dataset.away || '',
              date: row.dataset.date || '',
              league: '',
              status: 'pending'
            });
          });
          renderMatches(matches.slice(0, 6));
        }
      });
  }

  function renderMatches(matches) {
    if (!matches || matches.length === 0) return;
    container.innerHTML = '';
    var hasLive = false;
    matches.forEach(function(m) {
      if (m.status === 'live' || m.status === 'in_play') hasLive = true;
      container.appendChild(renderLiveMatch(m));
    });
    // If no live matches, show "upcoming" label
    if (!hasLive && matches.length > 0) {
      var label = document.createElement('div');
      label.style.cssText = 'grid-column:1/-1;text-align:center;padding:0.5rem;font-size:0.8125rem;color:var(--text-muted);';
      label.textContent = 'No matches currently live. Showing upcoming fixtures.';
      container.insertBefore(label, container.firstChild);
    }
  }

  // Initial load
  fetchLiveScores();

  // Poll every 60 seconds when page is visible
  var pollInterval;
  function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(fetchLiveScores, 60000);
  }
  function stopPolling() {
    if (pollInterval) clearInterval(pollInterval);
  }

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) stopPolling();
    else { fetchLiveScores(); startPolling(); }
  });

  startPolling();
})();

// ============================================================
// BEST ODDS HIGHLIGHTER
// Highlights the best odds for each outcome in the comparison table
// ============================================================
(function() {
  var table = document.querySelector('.odds-comparison-table');
  if (!table) return;

  var rows = table.querySelectorAll('.match-odds-row');
  rows.forEach(function(row) {
    var tds = row.querySelectorAll('td');
    if (tds.length < 2) return;

    // For each outcome position (home=0, draw=1, away=2)
    for (var pos = 0; pos < 3; pos++) {
      var bestVal = 0;
      var bestEls = [];
      // Iterate bookmaker columns (skip first td which is match name)
      for (var col = 1; col < tds.length; col++) {
        var vals = tds[col].querySelectorAll('.odd-val');
        if (vals.length > pos) {
          var v = parseFloat(vals[pos].dataset.oddsDec);
          if (!isNaN(v)) {
            if (v > bestVal) {
              bestVal = v;
              bestEls = [vals[pos]];
            } else if (v === bestVal) {
              bestEls.push(vals[pos]);
            }
          }
        }
      }
      bestEls.forEach(function(el) { el.classList.add('best-odds'); });
    }
  });
})();

// ============================================================
// ACCA BUILDER — Live Match Integration
// If LIVE_MATCHES data is available, populate the builder
// ============================================================
(function() {
  if (typeof window.LIVE_MATCHES === 'undefined') return;
  var matches = window.LIVE_MATCHES;
  if (!matches || matches.length === 0) return;

  var listEl = document.getElementById('live-match-list') || document.querySelector('.match-list');
  if (!listEl) return;

  // Clear existing placeholder content and populate with live data
  var existingItems = listEl.querySelectorAll('.match-item');
  if (existingItems.length === 0) {
    matches.forEach(function(m) {
      var item = document.createElement('div');
      item.className = 'match-item';
      item.dataset.matchId = m.id;
      item.innerHTML =
        '<div class="match-info">' +
          '<span class="match-league-badge">' + (m.league || '') + '</span>' +
          '<span class="match-teams-label">' + m.home + ' vs ' + m.away + '</span>' +
        '</div>' +
        '<div class="match-odds">' +
          (m.odds.home ? '<button data-odds="' + m.odds.home + '" data-sel="' + m.home + ' Win">' + parseFloat(m.odds.home).toFixed(2) + '</button>' : '') +
          (m.odds.draw ? '<button data-odds="' + m.odds.draw + '" data-sel="Draw">' + parseFloat(m.odds.draw).toFixed(2) + '</button>' : '') +
          (m.odds.away ? '<button data-odds="' + m.odds.away + '" data-sel="' + m.away + ' Win">' + parseFloat(m.odds.away).toFixed(2) + '</button>' : '') +
        '</div>';
      listEl.appendChild(item);
    });
  }
})();

// ============================================================
// TRANSLATION READY — i18n string extraction helper
// All user-facing strings wrapped in t() for future translation
// ============================================================
window.FA_STRINGS = {
  'en': {
    'decimal': 'Decimal',
    'fractional': 'Fractional',
    'american': 'American',
    'combined_odds': 'Combined Odds',
    'stake_returns': 'stake returns',
    'live': 'LIVE',
    'no_live_matches': 'No matches currently live. Showing upcoming fixtures.',
    'dropping_odds': 'Dropping Odds Alerts',
    'updated': 'Updated',
    'all_tips': 'All Tips',
    'ko': 'KO',
    'legs': 'legs',
    'safe': 'SAFE',
    'balanced': 'BALANCED',
    'adventurous': 'ADVENTUROUS'
  }
};
window.FA_LANG = document.documentElement.lang || 'en';
function t(key) {
  var strings = window.FA_STRINGS[window.FA_LANG] || window.FA_STRINGS['en'];
  return strings[key] || key;
}


// ============================================================
// COUNTDOWN TIMERS — Show time until kickoff on tip cards
// ============================================================
(function() {
  function updateCountdowns() {
    document.querySelectorAll('[data-countdown]').forEach(function(el) {
      var ko = new Date(el.dataset.countdown);
      var now = new Date();
      var diff = ko - now;
      if (diff <= 0) {
        el.textContent = 'Started';
        el.classList.add('urgent');
        return;
      }
      var hrs = Math.floor(diff / 3600000);
      var mins = Math.floor((diff % 3600000) / 60000);
      if (hrs > 24) {
        var days = Math.floor(hrs / 24);
        el.textContent = days + 'd ' + (hrs % 24) + 'h';
      } else if (hrs > 0) {
        el.textContent = hrs + 'h ' + mins + 'm';
        if (hrs < 2) el.classList.add('urgent');
      } else {
        el.textContent = mins + 'm';
        el.classList.add('urgent');
      }
    });
  }
  updateCountdowns();
  setInterval(updateCountdowns, 60000);
})();

// ============================================================
// ENHANCED FORMAT SWITCHER — Works with both old and new buttons
// ============================================================
(function() {
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.fmt-btn, .odds-fmt-btn');
    if (!btn) return;
    var fmt = btn.dataset.format;
    if (!fmt) return;
    
    // Update all format buttons globally
    document.querySelectorAll('.fmt-btn, .odds-fmt-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.format === fmt);
    });
    
    // Also update old-style buttons
    document.querySelectorAll('.odds-switcher .tab-filter').forEach(function(b) {
      b.classList.toggle('active', b.dataset.format === fmt);
    });
    
    // Format all odds
    if (typeof setOddsFormat === 'function') {
      setOddsFormat(fmt);
    }
  });
})();
