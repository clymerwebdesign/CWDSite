/* ============================================================
   Clymer Web Design — Quote Builder
   Two flow styles (guided / chat) over one shared data model.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- tiny icon set (inline SVG, 24x24 stroke) ---------- */
  var I = {
    plus:   '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    refresh:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    pages:  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M8 13h8M8 17h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    help:   '<path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    mail:   '<path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM3 6l9 7 9-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    image:  '<path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM21 16l-5-5L4 21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    pin:    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    share:  '<path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 4M15.4 6.5l-6.8 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    check:  '<path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function svg(name, cls) { return '<svg viewBox="0 0 24 24" class="' + (cls||'') + '">' + I[name] + '</svg>'; }

  /* ---------- data model ---------- */
  var STEPS = [
    {
      key: 'projectType', type: 'single',
      q: 'What are you looking for?',
      sub: "Let's figure out the right starting point for you.",
      chatQ: "Hey! Quick question: are you starting fresh or replacing something existing?",
      options: [
        { v: 'new',     label: 'Brand new site',     icon: 'plus'    },
        { v: 'replace', label: 'Replace an old site', icon: 'refresh' }
      ]
    },
    {
      key: 'pages', type: 'single',
      q: 'How many pages do you think you need?',
      sub: "A rough guess is totally fine. We'll dial it in together.",
      chatQ: "Got it! Roughly how many pages are we talking?",
      options: [
        { v: 's', label: '1–3 pages',  icon: 'pages' },
        { v: 'm', label: '4–6 pages',  icon: 'pages' },
        { v: 'l', label: '7+ pages',   icon: 'pages' },
        { v: '?', label: 'Not sure',   icon: 'help'  }
      ]
    },
    {
      key: 'extras', type: 'multi',
      q: "Anything else you'd like included?",
      sub: "Optional add-ons — skip anything you don't need.",
      chatQ: "Almost there! Any of these extras sound useful?",
      options: [
        { v: 'form',    label: 'Contact form',       icon: 'mail'  },
        { v: 'gallery', label: 'Photo gallery',      icon: 'image' },
        { v: 'maps',    label: 'Google Maps embed',  icon: 'pin'   },
        { v: 'social',  label: 'Social media links', icon: 'share' }
      ]
    }
  ];

  /* pricing: Starter $250+, Standard $350+, Pro $600+ */
  var BASE = { s: 250, m: 350, l: 600, '?': 300 };

  /* ---------- state ---------- */
  var state = {
    mode: 'guided',
    step: 0,
    answers: { projectType: null, pages: null, extras: [] }
  };

  function estimate() {
    var base = BASE[state.answers.pages] || BASE['?'];
    var extras = state.answers.extras.length;
    var lo = base + extras * 25;
    return { lo: lo, extras: extras };
  }
  function answeredCurrent() {
    var s = STEPS[state.step];
    var a = state.answers[s.key];
    return s.type === 'single' ? !!a : true; // extras can be skipped
  }
  function money(n) { return '$' + n.toLocaleString(); }

  /* ---------- DOM refs ---------- */
  var stage = document.getElementById('q-stage');
  var progress = document.getElementById('q-progress-fill');
  var switchPill = document.getElementById('q-switch-pill');
  var switchBtns = document.querySelectorAll('.q-switch button');

  function setProgress(frac) { progress.style.width = Math.max(0, Math.min(1, frac)) * 100 + '%'; }

  /* ========================================================
     GUIDED MODE
     ======================================================== */
  var guided = {
    render: function () {
      var s = STEPS[state.step];
      var sel = state.answers[s.key];
      var dots = STEPS.map(function (_, i) {
        var c = i < state.step ? 'done' : (i === state.step ? 'current' : '');
        return '<span class="g-dot ' + c + '"></span>';
      }).join('');
      var opts = s.options.map(function (o) {
        var isSel = s.type === 'single' ? sel === o.v : (sel.indexOf(o.v) > -1);
        return '<button class="g-opt ' + (isSel ? 'selected' : '') + '" data-v="' + o.v + '">' +
          '<span class="g-opt-ico">' + svg(o.icon) + '</span>' +
          '<span class="g-opt-label">' + o.label + '</span>' +
          '<span class="g-opt-check">' + svg('check') + '</span>' +
        '</button>';
      }).join('');
      var multi = s.type === 'multi';
      var colsClass = s.options.length === 2 ? 'cols-1' : '';
      var html =
        '<div class="g-step-indicator">' + dots + '</div>' +
        '<div class="g-step-count">Step ' + (state.step + 1) + ' of ' + STEPS.length + '</div>' +
        '<div class="g-panel"><div class="g-slide" id="g-slide">' +
          '<h2 class="g-q">' + s.q + '</h2>' +
          '<p class="g-sub">' + s.sub + '</p>' +
          '<div class="g-options ' + colsClass + '">' + opts + '</div>' +
          (multi ? '<p class="g-hint">' + (sel.length ? sel.length + ' selected' : 'Select all that apply') + '</p>' : '') +
          '<div class="g-actions">' +
            '<button class="g-back" ' + (state.step === 0 ? 'hidden' : '') + '>&larr; Back</button>' +
            (multi
              ? '<button class="btn btn-navy g-continue">Continue <span class="arrow">→</span></button>'
              : '<span></span>') +
          '</div>' +
        '</div></div>';
      stage.querySelector('#q-card').innerHTML = html;
      setProgress((state.step + (answeredCurrent() ? 0.6 : 0.15)) / STEPS.length);
      guided.bind();
    },
    bind: function () {
      var card = stage.querySelector('#q-card');
      var s = STEPS[state.step];
      card.querySelectorAll('.g-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var v = btn.getAttribute('data-v');
          if (s.type === 'single') {
            state.answers[s.key] = v;
            card.querySelectorAll('.g-opt').forEach(function (b) {
              b.classList.toggle('selected', b.getAttribute('data-v') === v);
            });
            setTimeout(guided.advance, 300);
          } else {
            var arr = state.answers[s.key];
            var i = arr.indexOf(v);
            if (i > -1) arr.splice(i, 1); else arr.push(v);
            btn.classList.toggle('selected', arr.indexOf(v) > -1);
            var hint = card.querySelector('.g-hint');
            if (hint) hint.textContent = arr.length ? arr.length + ' selected' : 'Select all that apply';
          }
        });
      });
      var cont = card.querySelector('.g-continue');
      if (cont) cont.addEventListener('click', guided.advance);
      var back = card.querySelector('.g-back');
      if (back) back.addEventListener('click', function () {
        if (state.step > 0) { state.step--; guided.render(); }
      });
    },
    advance: function () {
      var slide = document.getElementById('g-slide');
      if (state.step < STEPS.length - 1) {
        if (slide) slide.classList.add('out');
        setTimeout(function () { state.step++; guided.render(); }, 300);
      } else {
        if (slide) slide.classList.add('out');
        setTimeout(showResult, 300);
      }
    }
  };

  /* ========================================================
     CHAT MODE
     ======================================================== */
  var chat = {
    scrollEl: null, started: false,
    render: function () {
      stage.querySelector('#q-card').innerHTML =
        '<div class="c-window">' +
          '<div class="c-head">' +
            '<div class="c-head-ava"><img src="assets/cwd-icon-white.png" alt="CWD"></div>' +
            '<div class="c-head-info">' +
              '<div class="c-head-name">Greyson · Clymer Web Design</div>' +
              '<div class="c-head-status">Online now</div>' +
            '</div>' +
          '</div>' +
          '<div class="c-scroll" id="c-scroll"></div>' +
          '<div class="c-tray" id="c-tray"></div>' +
        '</div>';
      chat.scrollEl = document.getElementById('c-scroll');
      setProgress((state.step + 0.2) / STEPS.length);
      if (!chat.started) {
        chat.started = true;
        chat.botSay("Hey there! 👋 Let's build you a quick estimate. Should only take a minute.", function () {
          chat.askStep();
        });
      } else {
        chat.replay();
        chat.askStep();
      }
    },
    replay: function () {
      for (var i = 0; i < state.step; i++) {
        var s = STEPS[i];
        chat.appendBot(s.chatQ, true);
        var a = state.answers[s.key];
        var txt = s.type === 'single'
          ? labelFor(s, a)
          : (a.length ? a.map(function (v) { return labelFor(s, v); }).join(', ') : 'Nothing extra for now');
        if (txt) chat.appendUser(txt, true);
      }
    },
    botSay: function (text, cb) {
      chat.showTyping();
      setTimeout(function () {
        chat.hideTyping();
        chat.appendBot(text);
        if (cb) setTimeout(cb, 350);
      }, 750);
    },
    appendBot: function (text, instant) {
      var row = document.createElement('div');
      row.className = 'c-row bot';
      if (instant) row.style.animation = 'none';
      row.innerHTML = '<div class="c-ava"><img src="assets/cwd-icon-white.png" alt=""></div><div class="c-bubble">' + text + '</div>';
      chat.scrollEl.appendChild(row); chat.toBottom();
    },
    appendUser: function (text, instant) {
      var row = document.createElement('div');
      row.className = 'c-row user';
      if (instant) row.style.animation = 'none';
      row.innerHTML = '<div class="c-bubble">' + text + '</div>';
      chat.scrollEl.appendChild(row); chat.toBottom();
    },
    showTyping: function () {
      var t = document.createElement('div');
      t.className = 'c-row bot'; t.id = 'c-typing-row';
      t.innerHTML = '<div class="c-ava"><img src="assets/cwd-icon-white.png" alt=""></div><div class="c-bubble c-typing"><span></span><span></span><span></span></div>';
      chat.scrollEl.appendChild(t); chat.toBottom();
    },
    hideTyping: function () { var t = document.getElementById('c-typing-row'); if (t) t.remove(); },
    toBottom: function () { requestAnimationFrame(function () { chat.scrollEl.scrollTop = chat.scrollEl.scrollHeight; }); },
    askStep: function () {
      var s = STEPS[state.step];
      chat.botSay(s.chatQ, function () { chat.renderChips(); });
    },
    renderChips: function () {
      var s = STEPS[state.step];
      var sel = state.answers[s.key];
      var tray = document.getElementById('c-tray');
      var chips = s.options.map(function (o) {
        var isSel = s.type === 'multi' && sel.indexOf(o.v) > -1;
        return '<button class="c-chip ' + (isSel ? 'selected' : '') + '" data-v="' + o.v + '">' + o.label + '</button>';
      }).join('');
      var sendBtn = s.type === 'multi'
        ? '<button class="c-chip send" id="c-send">' + (sel.length ? 'Send ' + sel.length + ' →' : 'Skip →') + '</button>'
        : '';
      tray.innerHTML =
        (s.type === 'multi' ? '<p class="c-tray-hint">Tap all that apply, then send</p>' : '<p class="c-tray-hint">Tap to choose</p>') +
        '<div class="c-chips">' + chips + sendBtn + '</div>';
      tray.querySelectorAll('.c-chip[data-v]').forEach(function (chip) {
        chip.addEventListener('click', function () {
          var v = chip.getAttribute('data-v');
          if (s.type === 'single') {
            state.answers[s.key] = v;
            chat.appendUser(labelFor(s, v));
            tray.innerHTML = '';
            chat.next(true);
          } else {
            var arr = state.answers[s.key];
            var i = arr.indexOf(v);
            if (i > -1) arr.splice(i, 1); else arr.push(v);
            chat.renderChips();
          }
        });
      });
      var send = document.getElementById('c-send');
      if (send) send.addEventListener('click', function () {
        var arr = state.answers[s.key];
        var txt = arr.length ? arr.map(function (v) { return labelFor(s, v); }).join(', ') : "Nothing extra for now";
        chat.appendUser(txt);
        tray.innerHTML = '';
        chat.next(true);
      });
    },
    next: function (withAck) {
      setProgress((state.step + 0.9) / STEPS.length);
      var acks = ['Perfect.', 'Nice!', 'Got it.', 'Love it.', 'Great choice!'];
      if (state.step < STEPS.length - 1) {
        state.step++;
        if (withAck) {
          chat.botSay(acks[Math.floor(Math.random() * acks.length)], function () { chat.askStep(); });
        } else { chat.askStep(); }
      } else {
        chat.botSay("Awesome, that's everything I need. Crunching your estimate… ✨", function () {
          setTimeout(showResult, 600);
        });
      }
    }
  };

  function labelFor(step, v) {
    var o = step.options.filter(function (x) { return x.v === v; })[0];
    return o ? o.label : v;
  }

  /* ========================================================
     RESULT + FORM (shared)
     ======================================================== */
  function showResult() {
    setProgress(1);
    var e = estimate();
    var extraNote = e.extras > 0 ? '<span>' + e.extras + ' add-on' + (e.extras > 1 ? 's' : '') + '</span>' : '';
    var pagesLabel = labelFor(STEPS[1], state.answers.pages) || 'Custom';
    var projectLabel = labelFor(STEPS[0], state.answers.projectType) || '';
    stage.querySelector('#q-card').innerHTML =
      '<div class="r-wrap">' +
        '<p class="r-eyebrow">Your estimate</p>' +
        '<h2 class="r-title">Here\'s your ballpark</h2>' +
        '<div class="r-estimate">' +
          '<div class="r-est-label">Starting from</div>' +
          '<div class="r-est-price">' + money(e.lo) + '<span class="dash">+</span></div>' +
          '<div class="r-est-meta"><span>' + projectLabel + '</span><span>' + pagesLabel + '</span>' + extraNote + '<span>Custom domain included</span></div>' +
        '</div>' +
        '<p class="r-note">This is a starting-point estimate. Exact pricing is confirmed before any work begins. Fill in your details and I\'ll get back to you within a day.</p>' +
        '<form class="r-form" id="q-form" netlify name="quote" method="POST" data-netlify="true">' +
          '<input type="hidden" name="form-name" value="quote">' +
          '<input type="hidden" name="estimate" value="' + money(e.lo) + '+">' +
          '<p class="r-form-title">Lock in your quote</p>' +
          '<p class="r-form-sub">No commitment. Just starts the conversation.</p>' +
          '<div class="r-field"><label>Your name</label><input class="r-input" name="name" required placeholder="Jordan Smith"></div>' +
          '<div class="r-field"><label>Phone or email</label><input class="r-input" name="contact" required placeholder="you@example.com"></div>' +
          '<div class="r-field"><label>Anything you\'d like to add <span style="text-transform:none;font-weight:600;color:var(--muted)">(optional)</span></label><textarea class="r-textarea" name="message" placeholder="Tell me a bit about your business or any ideas you have…"></textarea></div>' +
          '<button type="submit" class="btn btn-navy r-submit">Send my quote request <span class="arrow">→</span></button>' +
          '<button type="button" class="r-restart" id="q-restart">↺ Start over</button>' +
        '</form>' +
      '</div>';
    var form = document.getElementById('q-form');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var btn = form.querySelector('.r-submit');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      var extrasLabels = state.answers.extras.length
        ? state.answers.extras.map(function (v) { return labelFor(STEPS[2], v); }).join(', ')
        : 'None';
      var payload = {
        name: form.name.value,
        contact: form.contact.value,
        project_type: labelFor(STEPS[0], state.answers.projectType) || 'Not specified',
        pages: labelFor(STEPS[1], state.answers.pages) || 'Not specified',
        extras: extrasLabels,
        estimate: money(estimate().lo) + '+',
        message: form.message ? form.message.value : '',
        _subject: 'Quote request — ' + (form.name.value || 'visitor') + ' · ' + money(estimate().lo) + '+'
      };
      fetch('https://formsubmit.co/ajax/clymerwebdesign@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function () { showThanks(form.name.value || 'there'); })
      .catch(function () { showThanks(form.name.value || 'there'); });
    });
    document.getElementById('q-restart').addEventListener('click', restart);
  }

  function showThanks(name) {
    setProgress(1);
    var first = (name || '').trim().split(' ')[0] || 'there';
    stage.querySelector('#q-card').innerHTML =
      '<div class="r-thanks">' +
        '<div class="r-thanks-ico">' + svg('check') + '</div>' +
        '<h2>Thanks, ' + first + '!</h2>' +
        '<p>Your quote request is on its way. I\'ll personally review it and get back to you within one business day.</p>' +
        '<a href="index.html" class="btn btn-navy" style="padding:14px 26px">Back to home</a>' +
        '<button type="button" class="r-restart" id="q-restart2">Build another quote</button>' +
      '</div>';
    document.getElementById('q-restart2').addEventListener('click', restart);
  }

  function restart() {
    state.step = 0;
    state.answers = { projectType: null, pages: null, extras: [] };
    chat.started = false;
    mount();
  }

  /* ========================================================
     MODE SWITCH + MOUNT
     ======================================================== */
  function positionPill() {
    var active = document.querySelector('.q-switch button.active');
    if (!active) return;
    switchPill.style.left = active.offsetLeft + 'px';
    switchPill.style.width = active.offsetWidth + 'px';
  }

  function mount() {
    if (!stage.querySelector('#q-card')) {
      var card = document.createElement('div');
      card.id = 'q-card'; card.className = 'q-card-wrap';
      stage.appendChild(card);
    }
    if (state.mode === 'guided') guided.render();
    else chat.render();
  }

  switchBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.dataset.mode === state.mode) return;
      switchBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      positionPill();
      state.mode = btn.dataset.mode;
      chat.started = false;
      mount();
    });
  });

  window.addEventListener('resize', positionPill);
  positionPill();
  mount();
})();
