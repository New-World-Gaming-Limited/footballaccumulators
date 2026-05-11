/* footballaccumulators v3 — client app: format switcher, countdowns, stake, slip */
(function () {
  'use strict';

  // ----- Format switcher -----
  const FMT_KEY = 'fa.fmt';
  let currentFmt = (location.hash.match(/fmt=(\w+)/) || [])[1] || 'decimal';

  function decToFrac(d) {
    if (!d || d <= 1) return '0/1';
    const dec = d - 1;
    // Find best fraction approximation
    let best = { n: 0, d: 1, err: Infinity };
    for (let denom = 1; denom <= 50; denom++) {
      const num = Math.round(dec * denom);
      const err = Math.abs(dec - num / denom);
      if (err < best.err) best = { n: num, d: denom, err };
    }
    return `${best.n}/${best.d}`;
  }

  function decToAm(d) {
    if (!d || d <= 1) return '0';
    if (d >= 2) return '+' + Math.round((d - 1) * 100);
    return Math.round(-100 / (d - 1)).toString();
  }

  function fmtOdds(dec, fmt) {
    const d = parseFloat(dec);
    if (!d) return '—';
    if (fmt === 'fractional') return decToFrac(d);
    if (fmt === 'american') return decToAm(d);
    return d.toFixed(2);
  }

  function applyFormat() {
    document.querySelectorAll('[data-decimal]').forEach(el => {
      const d = parseFloat(el.dataset.decimal);
      // Don't overwrite odds-value spans inside leg-odds — those have a separate update pass below
      if (el.classList.contains('odds-display') || el.classList.contains('leg-odds') || el.classList.contains('px') || el.classList.contains('ab-px') || el.classList.contains('px-odds') || el.classList.contains('odds-value') || el.classList.contains('ab-px-odds') || el.classList.contains('slip-val')) {
        // For leg-odds, update inner .odds-value
        const inner = el.querySelector('.odds-value, .px-odds, .ab-px-odds');
        if (inner) inner.textContent = fmtOdds(d, currentFmt);
        else el.textContent = fmtOdds(d, currentFmt);
      }
    });
    document.querySelectorAll('.fs-btn').forEach(b => b.classList.toggle('is-active', b.dataset.fmt === currentFmt));
  }

  document.querySelectorAll('.fs-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFmt = btn.dataset.fmt;
      // Update hash without scroll
      const h = location.hash.replace(/fmt=\w+/, '').replace(/^#&?/, '#').replace(/^#$/, '');
      location.hash = (h ? h + '&' : '#') + 'fmt=' + currentFmt;
      applyFormat();
    });
  });

  // ----- Mobile menu -----
  const menuBtn = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('is-open');
      mobileNav.toggleAttribute('hidden', !open);
    });
  }

  // ----- Countdown timers -----
  function updateCountdowns() {
    const now = Date.now();
    document.querySelectorAll('.countdown[data-utc]').forEach(el => {
      const t = new Date(el.dataset.utc).getTime();
      const diff = t - now;
      if (diff < -90 * 60 * 1000) { el.textContent = 'FT'; el.classList.remove('is-urgent'); }
      else if (diff < 0) { el.textContent = 'LIVE'; el.classList.add('is-live'); el.classList.remove('is-urgent'); }
      else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        if (h >= 24) el.textContent = Math.floor(h / 24) + 'd ' + (h % 24) + 'h';
        else if (h > 0) el.textContent = h + 'h ' + m + 'm';
        else el.textContent = m + 'm';
        el.classList.toggle('is-urgent', diff < 2 * 3600000);
      }
    });

    // Last updated ago
    document.querySelectorAll('.updated-ago[data-utc]').forEach(el => {
      const t = new Date(el.dataset.utc).getTime();
      const diff = now - t;
      const m = Math.floor(diff / 60000);
      if (m < 1) el.textContent = 'just now';
      else if (m < 60) el.textContent = m + 'm ago';
      else el.textContent = Math.floor(m / 60) + 'h ago';
    });
  }
  setInterval(updateCountdowns, 30000);

  // ----- Stake chips: recompute returns -----
  document.querySelectorAll('.acca-card').forEach(card => {
    const chips = card.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        const stake = parseFloat(chip.dataset.stake);
        const retEl = card.querySelector('.return-amt');
        const stakeEl = card.querySelector('.stake-amt');
        if (retEl && stakeEl) {
          const base = parseFloat(retEl.dataset.base);
          retEl.textContent = (stake * base).toFixed(2);
          stakeEl.textContent = stake;
        }
      });
    });
  });

  // ----- Acca Builder: slip logic -----
  const slipLegsEl = document.getElementById('slipLegs');
  if (slipLegsEl) {
    const slip = []; // {eventId, market, outcome, match, selection, odds, bk}

    function renderSlip() {
      if (slip.length === 0) {
        slipLegsEl.innerHTML = '<li class="slip-empty">No selections yet. Pick from the matches.</li>';
      } else {
        slipLegsEl.innerHTML = slip.map((l, i) => `
          <li class="slip-leg">
            <div class="slip-leg-body">
              <div class="slip-leg-match">${l.match}</div>
              <div class="slip-leg-pick">${l.selection}</div>
            </div>
            <span class="slip-leg-odds" data-decimal="${l.odds}">${fmtOdds(l.odds, currentFmt)}</span>
            <button class="slip-leg-x" data-i="${i}" aria-label="Remove">×</button>
          </li>`).join('');
        slipLegsEl.querySelectorAll('.slip-leg-x').forEach(btn => {
          btn.addEventListener('click', () => {
            slip.splice(parseInt(btn.dataset.i), 1);
            syncSelection();
            renderSlip();
            updateSlipStats();
          });
        });
      }
      document.getElementById('slipLegCount').textContent = slip.length;
    }

    function getStake() {
      const active = document.querySelector('.ab-slip .chip.is-active');
      return active ? parseFloat(active.dataset.stake) : 10;
    }

    function updateSlipStats() {
      const odds = slip.reduce((a, l) => a * l.odds, 1);
      const oddsEl = document.getElementById('slipOdds');
      const retEl = document.getElementById('slipReturn');
      const stake = getStake();
      if (slip.length === 0) {
        oddsEl.textContent = '—'; retEl.textContent = '—';
        oddsEl.dataset.decimal = '1';
      } else {
        oddsEl.dataset.decimal = odds.toFixed(2);
        oddsEl.textContent = fmtOdds(odds, currentFmt);
        retEl.textContent = (stake * odds).toFixed(2);
      }
      document.querySelectorAll('.ab-slip .stake-amt').forEach(e => e.textContent = stake);

      // Update bet CTA bookmaker — pick most common in slip
      const cta = document.getElementById('slipBet');
      if (cta && slip.length > 0) {
        const bks = slip.map(l => l.bk).filter(Boolean);
        if (bks.length) {
          const counts = {};
          bks.forEach(b => counts[b] = (counts[b] || 0) + 1);
          const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
          const slug = top.toLowerCase().replace(/\s/g, '');
          cta.href = '../link/' + slug + '.html';
          cta.textContent = `Place at ${top} →`;
        }
      } else if (cta) {
        cta.href = '../link/bet365.html';
        cta.textContent = 'Place at Bet365 →';
      }
    }

    function syncSelection() {
      document.querySelectorAll('.ab-px').forEach(btn => {
        const key = btn.dataset.event + '|' + btn.dataset.market + '|' + btn.dataset.outcome;
        const sel = slip.some(l => (l.eventId + '|' + l.market + '|' + l.outcome) === key);
        btn.classList.toggle('is-selected', sel);
      });
    }

    document.querySelectorAll('.ab-px').forEach(btn => {
      if (btn.classList.contains('is-disabled')) return;
      btn.addEventListener('click', () => {
        const eventId = btn.dataset.event;
        const market = btn.dataset.market;
        const outcome = btn.dataset.outcome;
        const key = eventId + '|' + market + '|' + outcome;

        // Replace if same event+market exists
        const sameEventMarketIdx = slip.findIndex(l => l.eventId === eventId && l.market === market);
        const exactIdx = slip.findIndex(l => (l.eventId + '|' + l.market + '|' + l.outcome) === key);

        if (exactIdx >= 0) {
          slip.splice(exactIdx, 1);
        } else if (sameEventMarketIdx >= 0) {
          slip.splice(sameEventMarketIdx, 1);
          slip.push({ eventId, market, outcome, match: btn.dataset.match, selection: btn.dataset.selection, odds: parseFloat(btn.dataset.odds), bk: btn.dataset.bk });
        } else {
          slip.push({ eventId, market, outcome, match: btn.dataset.match, selection: btn.dataset.selection, odds: parseFloat(btn.dataset.odds), bk: btn.dataset.bk });
        }
        syncSelection();
        renderSlip();
        updateSlipStats();
      });
    });

    // Stake chips in slip
    document.querySelectorAll('.ab-slip .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.ab-slip .chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        updateSlipStats();
      });
    });

    // Clear slip
    const clearBtn = document.querySelector('.slip-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => { slip.length = 0; syncSelection(); renderSlip(); updateSlipStats(); });

    // Auto-build
    document.querySelectorAll('.auto-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        slip.length = 0;
        const mode = btn.dataset.mode;
        const allButtons = Array.from(document.querySelectorAll('.ab-px:not(.is-disabled)'))
          .filter(b => b.dataset.odds && parseFloat(b.dataset.odds) > 0)
          .map(b => ({
            el: b,
            eventId: b.dataset.event, market: b.dataset.market, outcome: b.dataset.outcome,
            match: b.dataset.match, selection: b.dataset.selection,
            odds: parseFloat(b.dataset.odds), bk: b.dataset.bk,
          }));

        // De-dup by event (one selection per match)
        const seen = new Set();
        let pool;
        if (mode === 'safe') pool = allButtons.filter(b => b.odds < 1.7).sort((a, b) => a.odds - b.odds);
        else if (mode === 'longshot') pool = allButtons.filter(b => b.odds > 2.5).sort((a, b) => b.odds - a.odds);
        else pool = allButtons.filter(b => b.odds >= 1.7 && b.odds <= 2.5).sort((a, b) => b.odds - a.odds);

        for (const p of pool) {
          if (!seen.has(p.eventId)) {
            seen.add(p.eventId);
            slip.push(p);
            if (slip.length >= 4) break;
          }
        }
        if (slip.length < 3) {
          // Fallback — fill from anywhere
          for (const p of allButtons) {
            if (!seen.has(p.eventId)) {
              seen.add(p.eventId);
              slip.push(p);
              if (slip.length >= 4) break;
            }
          }
        }
        syncSelection();
        renderSlip();
        updateSlipStats();
      });
    });

    renderSlip();
    updateSlipStats();
  }

  // ----- Init -----
  applyFormat();
  updateCountdowns();
})();
