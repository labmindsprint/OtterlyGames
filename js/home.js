/* Otterly Games home: two small progressive-enhancement interactives.
   The page is complete without this file: the clock shows 3:30 and the 6 times table is
   pre-rendered. No libraries, no network, no storage. */
(function () {
  'use strict';

  var pad = function (n) { return n < 10 ? '0' + n : String(n); };

  /* ---- Mini clock: drag the long hand (or use arrows / buttons); the short hand follows ---- */
  var clock = document.getElementById('miniClock');
  if (clock) {
    var total = 3 * 60 + 30; // minutes since 12:00, 0..719
    var hourHand = clock.querySelector('.mc-hour');
    var minHand = clock.querySelector('.mc-min');
    var readout = document.getElementById('clockTime');
    var says = document.getElementById('clockSays');
    var dragging = false;

    var render = function () {
      var m = total % 60;
      var h = Math.floor(total / 60) % 12;
      var hour = h === 0 ? 12 : h;
      var next = hour === 12 ? 1 : hour + 1;
      hourHand.setAttribute('transform', 'rotate(' + (total * 0.5) + ' 100 100)');
      minHand.setAttribute('transform', 'rotate(' + (m * 6) + ' 100 100)');
      readout.textContent = hour + ':' + pad(m);
      clock.setAttribute('aria-valuenow', String(total));
      clock.setAttribute('aria-valuetext', hour + ':' + pad(m));
      says.textContent = m === 0
        ? 'The short hand points right at the ' + hour + '.'
        : 'The short hand sits between ' + hour + ' and ' + next + '. The long hand shows ' + m + ' minute' + (m === 1 ? '' : 's') + ' past.';
    };
    var move = function (delta) { total = (((total + delta) % 720) + 720) % 720; render(); };

    var fromPointer = function (e) {
      var r = clock.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < 6) return;
      var minute = ((Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360) / 6;
      var snapped = Math.round(minute / 5) * 5;
      if (Math.abs(snapped - minute) < 0.9) minute = snapped;
      minute = Math.round(minute) % 60;
      var delta = minute - (total % 60);
      if (delta > 30) delta -= 60;
      if (delta < -30) delta += 60;
      move(delta);
    };

    /* Touch: only the long hand's handle drags (the rest of the clock keeps page scrolling); a tap anywhere sets it. */
    clock.addEventListener('pointerdown', function (e) {
      var onHandle = !!e.target.closest('.mc-min');
      if (e.pointerType === 'touch' && !onHandle) return;
      dragging = true;
      clock.setPointerCapture(e.pointerId);
      fromPointer(e);
      clock.focus({ preventScroll: true });
    });
    clock.addEventListener('pointermove', function (e) { if (dragging) fromPointer(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (type) {
      clock.addEventListener(type, function () { dragging = false; });
    });
    clock.addEventListener('pointerup', function (e) {
      if (e.pointerType === 'touch' && !e.target.closest('.mc-min')) fromPointer(e);
    });
    clock.addEventListener('keydown', function (e) {
      var step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 60, PageDown: -60 }[e.key];
      if (step) { e.preventDefault(); move(step); }
    });
    var controls = document.getElementById('clockControls');
    if (controls) {
      controls.hidden = false;
      controls.addEventListener('click', function (e) {
        var b = e.target.closest('[data-clock-step]');
        if (b) move(parseInt(b.getAttribute('data-clock-step'), 10));
      });
    }
    clock.style.touchAction = 'pan-y';
    render();
  }

  /* ---- Times-table peek: pick a table, optionally cover the answers and test yourself ---- */
  var picker = document.getElementById('peekPicker');
  var list = document.getElementById('peekFacts');
  var cover = document.getElementById('peekCover');
  if (picker && list && cover) {
    var table = 6, covered = false, revealed = {};
    var draw = function () {
      var html = '';
      for (var i = 1; i <= 12; i++) {
        var q = table + ' &times; ' + i + ' =';
        html += covered && !revealed[i]
          ? '<li><span>' + q + '</span><button type="button" data-i="' + i + '" aria-label="Show answer for ' + table + ' times ' + i + '">?</button></li>'
          : '<li><span>' + q + '</span><b>' + (table * i) + '</b></li>';
      }
      list.innerHTML = html;
    };
    picker.hidden = false;
    cover.hidden = false;
    picker.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-n]');
      if (!b) return;
      table = parseInt(b.getAttribute('data-n'), 10);
      revealed = {};
      picker.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      draw();
    });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-i]');
      if (!b) return;
      var i = b.getAttribute('data-i');
      revealed[i] = true;
      draw();
      var answer = list.querySelector('li:nth-child(' + i + ') b');
      if (answer) { answer.setAttribute('tabindex', '-1'); answer.focus(); }
    });
    cover.addEventListener('click', function () {
      covered = !covered;
      revealed = {};
      cover.setAttribute('aria-pressed', String(covered));
      draw();
    });
    draw();
  }
})();
