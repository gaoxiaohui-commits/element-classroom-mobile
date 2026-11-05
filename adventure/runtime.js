/* 氢氢的氢元素探险 — game engine.
   Levels register themselves with H2.registerLevel({...}) (see LEVEL_API.md) and are run as async
   functions that receive an `api` object. Leaving a level aborts it: every api promise rejects with
   an AbortError, and listeners/timers created through the api are cleaned up. */
(function () {
  'use strict';
  const H2 = (window.H2 = window.H2 || {});
  H2.assets = H2.assets || {};
  const levels = [];
  H2.levels = levels;
  H2.registerLevel = def => {
    if (!def || !def.id || typeof def.run !== 'function') { console.error('registerLevel: bad level', def); return; }
    const i = levels.findIndex(l => l.id === def.id);
    if (i >= 0) levels.splice(i, 1);
    levels.push(def);
    levels.sort((a, b) => a.order - b.order);
  };

  /* ---------------- state ---------------- */
  const C = window.ElementCourse;
  const state = { done: {}, stars: {}, teacher: false, muted: false, name: '' };
  function persist() { window.CourseAccount.saveState(state); }

  /* ---------------- helpers ---------------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  function frag(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.childElementCount === 1 ? t.content.firstElementChild : t.content; }
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function abortErr() { const e = new Error('level left'); e.name = 'AbortError'; return e; }
  const reducedMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Chemistry markup: "2H2 + O2 =点燃= 2H2O"  → coefficients stay, element counts become subscripts,
     "=条件=" puts the condition over a double bar, "==" is a plain equals bar, "^+" / "^{2+}" superscripts. */
  function chem(str) {
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const toks = String(str).split(/(\s+)/);
    const out = toks.map(tok => {
      if (/^\s+$/.test(tok)) return ' ';
      const m = tok.match(/^=(.*)=$/);
      if (m && tok.length >= 2) {
        const cond = m[1];
        if (!cond) return '<span class="eqc plain"><span class="eqc-b"></span></span>';
        return `<span class="eqc"><span class="eqc-t">${esc(cond)}</span><span class="eqc-b"></span></span>`;
      }
      let s = esc(tok);
      s = s.replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>').replace(/\^([0-9]*[+\-])/g, '<sup>$1</sup>');
      s = s.replace(/([A-Za-z\)\]])(\d+)/g, '$1<sub>$2</sub>');
      s = s.replace(/([一-鿿（）]+)/g, '<span class="cn">$1</span>');
      return s;
    });
    return `<span class="chem">${out.join('')}</span>`;
  }

  const ICON = {
    drop: (fill = 'var(--aqua)') => `<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M20 2 C20 2 4 20 4 31 a16 16 0 0 0 32 0 C36 20 20 2 20 2Z" fill="${fill}"/><path d="M12 30 a8 8 0 0 0 5 8" stroke="rgba(255,255,255,.7)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
    star: on => `<svg viewBox="0 0 24 24" class="${on ? 'on' : ''}" aria-hidden="true"><path fill="currentColor" d="M12 2.6l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.1l-5.7 3 1.1-6.3L2.8 9.3l6.4-.9z"/></svg>`,
    sound: on => on
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>`,
    map: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/></svg>`,
    book: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7"/></svg>`,
    lock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
    up: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>`,
    down: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`,
  };
  H2.ICON = ICON;

  /* ---------------- sound (synthesised, no files) ---------------- */
  const Sfx = (() => {
    let ctx = null;
    function ac() {
      if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    }
    function tone({ freq = 440, to = null, dur = 0.15, type = 'sine', gain = 0.16, delay = 0 }) {
      const c = ac(); if (!c) return;
      const t = c.currentTime + delay;
      const o = c.createOscillator(); const g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
    }
    function noise({ dur = 0.3, gain = 0.3, freq = 1200, to = null, type = 'lowpass', q = 1, delay = 0 }) {
      const c = ac(); if (!c) return;
      const t = c.currentTime + delay;
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, len, c.sampleRate); const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource(); src.buffer = buf;
      const f = c.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t);
      if (to) f.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
      const g = c.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(c.destination); src.start(t); src.stop(t + dur + 0.05);
    }
    const lib = {
      click: () => tone({ freq: 700, dur: 0.05, type: 'triangle', gain: 0.06 }),
      pop: () => tone({ freq: 480, to: 1100, dur: 0.09, gain: 0.14 }),
      bubble: () => tone({ freq: 260 + Math.random() * 260, to: 800 + Math.random() * 500, dur: 0.08, gain: 0.05 }),
      correct: () => { tone({ freq: 660, dur: 0.12, type: 'triangle' }); tone({ freq: 990, dur: 0.2, type: 'triangle', delay: 0.1 }); },
      wrong: () => tone({ freq: 320, to: 190, dur: 0.24, type: 'square', gain: 0.05 }),
      squeal: () => { noise({ dur: 0.22, gain: 0.55, freq: 2600, type: 'bandpass', q: 0.9 }); tone({ freq: 2200, to: 700, dur: 0.14, type: 'sawtooth', gain: 0.07 }); },
      puff: () => noise({ dur: 0.16, gain: 0.16, freq: 420 }),
      boom: () => { noise({ dur: 0.9, gain: 0.6, freq: 1000, to: 110 }); tone({ freq: 95, to: 38, dur: 0.7, gain: 0.35 }); },
      fizz: () => noise({ dur: 0.7, gain: 0.07, freq: 3800, type: 'highpass' }),
      whoosh: () => noise({ dur: 0.45, gain: 0.12, freq: 500, to: 2600, type: 'bandpass', q: 1.2 }),
      flame: () => noise({ dur: 0.6, gain: 0.1, freq: 700, type: 'bandpass', q: 0.7 }),
      sparkle: () => [0, 0.07, 0.14].forEach((d, i) => tone({ freq: 1250 + i * 330, dur: 0.1, gain: 0.05, delay: d })),
      win: () => [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.22, type: 'triangle', gain: 0.11, delay: i * 0.12 })),
      zap: () => { tone({ freq: 180, to: 900, dur: 0.18, type: 'sawtooth', gain: 0.05 }); },
    };
    return { play(name) { if (state.muted) return; const f = lib[name]; if (f) { try { f(); } catch (e) { /* audio blocked */ } } }, unlock: ac };
  })();

  /* ---------------- toasts ---------------- */
  const Toast = {
    show(msg, kind = 'info', ms = 2600) {
      const host = document.getElementById('toasts'); if (!host) return;
      const t = h('div', { class: `toast ${kind}`, role: 'status', html: msg });
      host.append(t);
      while (host.children.length > 3) host.firstElementChild.remove();
      setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, ms);
    },
  };

  /* ---------------- confetti ---------------- */
  const Confetti = {
    burst(n = 110) {
      if (reducedMotion()) return;
      const cv = document.getElementById('confetti'); if (!cv) return;
      const ctx = cv.getContext('2d'); const W = (cv.width = innerWidth), H = (cv.height = innerHeight);
      const css = getComputedStyle(document.documentElement);
      const cols = ['--aqua', '--mint', '--spark', '--flame', '--coral'].map(v => css.getPropertyValue(v).trim() || '#39b');
      const ps = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 12 - 4, r: 4 + Math.random() * 5, c: cols[(Math.random() * cols.length) | 0], a: Math.random() * 6, s: Math.random() < 0.4 }));
      let t0 = performance.now();
      const step = t => {
        const el = (t - t0) / 1000; ctx.clearRect(0, 0, W, H);
        ps.forEach(p => { p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.a += 0.15; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - el / 2.4);
          if (p.s) { ctx.beginPath(); ctx.arc(0, 0, p.r * 0.7, 0, 7); ctx.fill(); } else ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); });
        if (el < 2.4) requestAnimationFrame(step); else ctx.clearRect(0, 0, W, H);
      };
      requestAnimationFrame(step);
    },
  };

  /* ---------------- dialogue dock ---------------- */
  const Dialog = {
    el: null, img: null, text: null, next: null, tag: null,
    _skipType: null, _advance: null, fast: false, mood: 'happy',
    init() {
      this.el = document.getElementById('dialog');
      this.img = h('img', { alt: '氢氢', draggable: 'false' });
      this.tag = h('span', { class: 'dlg-tag' }, '任务');
      this.text = h('div', { class: 'dlg-text', 'aria-live': 'polite' });
      this.next = h('button', { class: 'btn btn-primary btn-sm dlg-next', type: 'button' }, '继续 ', h('span', { class: 'arrow' }, '›'));
      this.el.append(h('div', { class: 'dlg-avatar' }, this.img), h('div', { class: 'dlg-body' }, h('div', { class: 'dlg-name' }, '氢氢', this.tag), this.text), this.next);
      this.el.addEventListener('click', e => { if (e.target.closest('a')) return; this.poke(); });
      document.addEventListener('keydown', e => {
        if (!this.el.classList.contains('is-say') || this.el.hidden) return;
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (e.target.closest && e.target.closest('input, textarea, select, button:not(.dlg-next), [role=button], .choice-opt')) return;
        e.preventDefault(); this.poke();
      });
      this.setMood('happy');
    },
    setMood(m) {
      m = { happy: 'happy', curious: 'curious', serious: 'serious', think: 'serious', smile: 'curious' }[m] || 'happy';
      if (this.mood === m && this.img.src) return;
      this.mood = m; this.img.src = H2.assets['head_' + m] || '';
      this.img.classList.remove('bob'); void this.img.offsetWidth; this.img.classList.add('bob');
    },
    show() { this.el.hidden = false; },
    hide() { this.el.hidden = true; this._saying = false; this._queuedHint = null; this._skipType = this._advance = null; this.el.classList.remove('is-say', 'is-hint'); },
    poke() { if (this._skipType) this._skipType(); else if (this._advance) this._advance(); },
    hint(html, mood) {
      if (this._saying) { this._queuedHint = [html, mood]; return; }
      this._skipType = this._advance = null;
      this.el.classList.remove('is-say'); this.el.classList.add('is-hint');
      if (mood) this.setMood(mood);
      this.text.innerHTML = html || '';
    },
    type(html, signal) {
      return new Promise(res => {
        this.text.innerHTML = html;
        const nodes = []; const w = document.createTreeWalker(this.text, NodeFilter.SHOW_TEXT);
        while (w.nextNode()) nodes.push(w.currentNode);
        const full = nodes.map(n => n.data);
        let timer = null;
        const finish = () => { if (timer) clearInterval(timer); nodes.forEach((n, i) => (n.data = full[i])); this._skipType = null; res(); };
        if (this.fast || reducedMotion() || !nodes.length) return finish();
        nodes.forEach(n => (n.data = ''));
        let ni = 0, ci = 0;
        this._skipType = finish;
        timer = setInterval(() => {
          if (signal && signal.aborted) { clearInterval(timer); return; }
          for (let k = 0; k < 2; k++) {
            while (ni < nodes.length && ci >= full[ni].length) { ni++; ci = 0; }
            if (ni >= nodes.length) return finish();
            ci++; nodes[ni].data = full[ni].slice(0, ci);
          }
        }, 32);
      });
    },
    say(lines, signal) {
      lines = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
      return new Promise((resolve, reject) => {
        if (signal && signal.aborted) return reject(abortErr());
        let dead = false;
        const onAbort = () => { dead = true; this._saying = false; this._queuedHint = null; this._skipType = this._advance = null; reject(abortErr()); };
        if (signal) signal.addEventListener('abort', onAbort, { once: true });
        this.show();
        this._saying = true; this._queuedHint = null;
        this.el.classList.remove('is-hint'); this.el.classList.add('is-say');
        (async () => {
          for (const line of lines) {
            const L = typeof line === 'string' ? { text: line } : line;
            if (L.mood) this.setMood(L.mood);
            await this.type(L.text || '', signal);
            if (dead) return;
            await new Promise(r => { this._advance = () => { this._advance = null; Sfx.play('click'); r(); }; });
            if (dead) return;
          }
          this.el.classList.remove('is-say'); this.el.classList.add('is-hint');
          this._saying = false;
          if (this._queuedHint) { const q = this._queuedHint; this._queuedHint = null; this.hint(q[0], q[1]); }
          if (signal) signal.removeEventListener('abort', onAbort);
          resolve();
        })();
      });
    },
  };

  /* ---------------- drag & drop (pointer + tap-to-select + keyboard) ---------------- */
  const Drag = {
    sel: null,
    hit(zones, x, y) {
      let inner = null, innerA = Infinity;
      for (const z of zones) {
        if (!z || !z.isConnected) continue;
        const r = z.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom && r.width * r.height < innerA) { inner = z; innerA = r.width * r.height; }
      }
      if (inner) return inner;
      let best = null, bestD = Infinity;
      for (const z of zones) {
        if (!z || !z.isConnected) continue;
        const r = z.getBoundingClientRect(); const pad = 10;
        if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) {
          const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
          if (d < bestD) { best = z; bestD = d; }
        }
      }
      return best;
    },
    zonesOf(opts) { const z = typeof opts.zones === 'function' ? opts.zones() : opts.zones; return (z || []).filter(Boolean); },
    clearSel() {
      if (!this.sel) return;
      this.sel.el.classList.remove('selected');
      this.zonesOf(this.sel.opts).forEach(z => { z.classList.remove('drop-candidate'); if (z.dataset.h2tab) { z.removeAttribute('tabindex'); delete z.dataset.h2tab; } });
      this.sel = null;
    },
    select(el, opts, byKey) {
      if (this.sel && this.sel.el === el) { this.clearSel(); return; }
      this.clearSel();
      this.sel = { el, opts };
      el.classList.add('selected');
      this.zonesOf(opts).forEach(z => { z.classList.add('drop-candidate'); if (!z.hasAttribute('tabindex')) { z.setAttribute('tabindex', '0'); z.dataset.h2tab = '1'; } });
      Sfx.play('click');
      if (byKey) { const z0 = this.zonesOf(opts).find(z => z.isConnected); if (z0) z0.focus({ preventScroll: false }); }
      opts.onSelect && opts.onSelect(el);
    },
    revert(el) {
      if (!el.style.transform) return;
      el.style.transition = 'transform .25s ease';
      el.style.transform = '';
      const done = () => { el.style.transition = ''; el.removeEventListener('transitionend', done); };
      el.addEventListener('transitionend', done); setTimeout(done, 320);
    },
    drop(el, opts, zone, ev) {
      let accepted = false;
      if (zone) { try { accepted = opts.onDrop ? opts.onDrop(zone, el, ev) === true : false; } catch (e) { console.error(e); } }
      else if (opts.onMiss) opts.onMiss(el, ev);
      if (accepted) { el.style.transition = ''; el.style.transform = ''; }
      else this.revert(el);
      return accepted;
    },
    make(el, opts, cleanups) {
      el.classList.add('draggable');
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
      el.setAttribute('aria-roledescription', '可拖动');
      let start = null, moved = false, hover = null, pid = null;
      const disabled = () => el.classList.contains('locked') || (opts.disabled && opts.disabled(el));
      const down = e => {
        if (disabled() || (e.button !== undefined && e.button !== 0)) return;
        e.preventDefault();
        pid = e.pointerId; try { el.setPointerCapture(pid); } catch (_) {}
        start = { x: e.clientX, y: e.clientY }; moved = false;
      };
      const move = e => {
        if (!start || e.pointerId !== pid) return;
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (!moved && Math.hypot(dx, dy) < 6) return;
        if (!moved) { moved = true; Drag.clearSel(); el.classList.add('dragging'); opts.onStart && opts.onStart(el); }
        const scr = document.getElementById('screen');
        if (scr) {
          const sr = scr.getBoundingClientRect(), edge = 56;
          let v = 0;
          if (e.clientY < sr.top + edge) v = -Math.ceil((sr.top + edge - e.clientY) / 4);
          else if (e.clientY > sr.bottom - edge) v = Math.ceil((e.clientY - (sr.bottom - edge)) / 4);
          if (v) { const before = scr.scrollTop; scr.scrollTop += v; start.y -= scr.scrollTop - before; }
        }
        el.style.transform = `translate(${e.clientX - start.x}px, ${e.clientY - start.y}px)`;
        const z = Drag.hit(Drag.zonesOf(opts), e.clientX, e.clientY);
        if (z !== hover) { hover && hover.classList.remove('drop-hover'); hover = z; z && z.classList.add('drop-hover'); }
        opts.onMove && opts.onMove(el, e, z);
      };
      const up = e => {
        if (!start || e.pointerId !== pid) return;
        try { el.releasePointerCapture(pid); } catch (_) {}
        const was = moved; start = null; moved = false;
        hover && hover.classList.remove('drop-hover'); hover = null;
        if (!was) { if (e.type === 'pointerup') Drag.select(el, opts); return; }
        el.classList.remove('dragging');
        const z = Drag.hit(Drag.zonesOf(opts), e.clientX, e.clientY);
        Drag.drop(el, opts, z, e);
      };
      const key = e => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled()) { e.preventDefault(); Drag.select(el, opts, true); }
        if (e.key === 'Escape') Drag.clearSel();
      };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('keydown', key);
      const off = () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('keydown', key); };
      cleanups && cleanups.push(off);
      return off;
    },
    init() {
      const act = e => {
        if (!this.sel) return;
        const t = e.target;
        if (this.sel.el.contains(t)) return;
        if (t.closest && t.closest('.draggable:not(.locked)')) return;
        const zones = this.zonesOf(this.sel.opts);
        const z = zones.find(z => z.contains(t));
        if (z) { e.preventDefault(); e.stopPropagation(); const s = this.sel; this.clearSel(); this.drop(s.el, s.opts, z, e); }
        else this.clearSel();
      };
      document.addEventListener('click', act, true);
      document.addEventListener('keydown', e => {
        if (!this.sel) return;
        if (e.key === 'Escape') { this.clearSel(); return; }
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const zones = this.zonesOf(this.sel.opts);
        const z = zones.find(z => z === document.activeElement || z.contains(document.activeElement));
        if (z && !this.sel.el.contains(document.activeElement)) {
          e.preventDefault(); const s = this.sel; this.clearSel();
          const ok = this.drop(s.el, s.opts, z, e);
          const next = !ok && s.el.isConnected && !s.el.classList.contains('locked') ? s.el
            : [...document.querySelectorAll('#screen .draggable:not(.locked)')].find(d => d.offsetParent);
          if (next) next.focus({ preventScroll: true });
        }
      }, true);
    },
  };

  /* ---------------- step dots ---------------- */
  const Steps = {
    host: null, names: [], i: -1,
    set(names) { this.names = names || []; this.i = -1; this.render(); },
    go(i) { this.i = i; this.render(); },
    render() {
      if (!this.host) return;
      this.host.innerHTML = '';
      this.names.forEach((n, k) => this.host.append(h('span', { class: 'step' + (k < this.i ? ' done' : k === this.i ? ' now' : '') }, h('i', null, k < this.i ? '✓' : k + 1), n)));
    },
  };

  /* ---------------- reusable components ---------------- */
  const KEYS = 'ABCDEFGH';
  const Components = {
    choice(api, o) {
      const host = o.container || api.stage;
      const opts = o.shuffle === false ? o.options.slice() : shuffle(o.options);
      const multi = !!o.multi;
      const box = h('div', { class: 'choice panel' + (o.className ? ' ' + o.className : '') });
      if (o.title) box.append(h('div', { class: 'eyebrow' }, o.title));
      box.append(h('div', { class: 'choice-q', html: o.q }));
      const list = h('div', { class: 'choice-opts' });
      const fb = h('div', { class: 'choice-feedback', hidden: true });
      box.append(list, fb);
      host.append(box);
      if (o.scroll !== false) setTimeout(() => box.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' }), 30);
      let wrong = 0;
      return api.task(resolve => {
        const btns = opts.map((op, k) => {
          const b = h('button', { class: 'choice-opt', type: 'button' }, h('span', { class: 'opt-key' }, KEYS[k]), h('span', { html: op.html != null ? op.html : op.text }));
          b._op = op; list.append(b); return b;
        });
        const reveal = () => setTimeout(() => { const last = box.lastElementChild; (fb.hidden ? last : (last.tagName === 'BUTTON' ? last : fb)).scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' }); }, 40);
        const finish = async () => {
          btns.forEach(b => (b.disabled = true));
          api.good();
          const ex = o.explain;
          if (ex) { fb.hidden = false; fb.className = 'choice-feedback good'; fb.innerHTML = ex; }
          if (o.waitContinue !== false && ex) {
            const c = h('button', { class: 'btn btn-primary btn-sm', type: 'button' }, '继续 ›');
            box.append(c); c.focus({ preventScroll: true }); reveal();
            c.addEventListener('click', () => { c.remove(); if (o.removeAfter) box.remove(); resolve(wrong); }, { once: true });
          } else setTimeout(() => { if (o.removeAfter) box.remove(); resolve(wrong); }, 650);
        };
        if (!multi) {
          btns.forEach(b => b.addEventListener('click', () => {
            if (b.disabled) return;
            if (o.onPick) { try { o.onPick(b._op, !!b._op.correct); } catch (e) { console.error(e); } }
            if (b._op.correct) { b.classList.add('right'); finish(); }
            else {
              b.classList.add('wrong'); b.disabled = true; wrong++;
              api.mistake();
              fb.hidden = false; fb.className = 'choice-feedback bad'; fb.innerHTML = b._op.why || '再想一想哦～';
              reveal();
            }
          }));
        } else {
          const submit = h('button', { class: 'btn btn-primary btn-sm', type: 'button' }, '提交答案');
          box.append(h('div', { class: 'btn-row' }, submit, h('span', { class: 'kbd-note' }, '（多选题：选出所有正确的选项）')));
          btns.forEach(b => b.addEventListener('click', () => { if (!b.disabled) { b.classList.toggle('picked'); b.classList.remove('wrong'); } }));
          submit.addEventListener('click', () => {
            const picked = btns.filter(b => b.classList.contains('picked'));
            const ok = btns.every(b => b.classList.contains('picked') === !!b._op.correct);
            if (ok) { picked.forEach(b => { b.classList.remove('picked'); b.classList.add('right'); }); submit.remove(); finish(); return; }
            wrong++; api.mistake();
            const badPicks = picked.filter(b => !b._op.correct);
            badPicks.forEach(b => b.classList.add('wrong'));
            const missed = btns.filter(b => b._op.correct && !b.classList.contains('picked')).length;
            const why = badPicks.map(b => b._op.why).filter(Boolean);
            fb.hidden = false; fb.className = 'choice-feedback bad';
            fb.innerHTML = (why.length ? why.join('<br>') + '<br>' : '') + (badPicks.length ? `有 ${badPicks.length} 个选项选错了。` : '') + (missed ? `还漏选了 ${missed} 个正确选项。` : '');
            reveal();
          });
        }
      });
    },

    sortInto(api, o) {
      const host = o.container || api.stage;
      const box = h('div', { class: 'sorter panel' + (o.className ? ' ' + o.className : '') });
      if (o.prompt) box.append(h('div', { class: 'sort-prompt', html: o.prompt }));
      const pool = h('div', { class: 'sort-pool', 'aria-label': '待分类的卡片' });
      const bins = h('div', { class: 'sort-bins' });
      const binEls = o.bins.map(b => {
        const list = h('div', { class: 'sort-bin-list' });
        const el = h('div', { class: 'sort-bin dropzone', dataset: { bin: b.id }, 'aria-label': b.title }, h('div', { class: 'sort-bin-title', html: b.title }), b.hint ? h('div', { class: 'sort-bin-hint', html: b.hint }) : null, list);
        el._list = list; bins.append(el); return el;
      });
      box.append(pool, bins, h('div', { class: 'kbd-note' }, '拖动卡片到对应的框里；也可以先点卡片、再点框。'));
      host.append(box);
      let wrong = 0;
      return api.task(resolve => {
        const items = o.shuffle === false ? o.items.slice() : shuffle(o.items);
        let left = items.length;
        items.forEach(it => {
          const chip = h('div', { class: 'chip', html: it.html != null ? it.html : it.text });
          pool.append(chip);
          api.draggable(chip, {
            zones: () => binEls,
            onDrop: zone => {
              if (zone.dataset.bin === it.bin) {
                zone._list.append(chip); chip.classList.add('ok', 'locked', 'pop-in'); chip.removeAttribute('tabindex');
                api.sfx('correct');
                if (o.onPlaced) { try { o.onPlaced(it, zone.dataset.bin, chip); } catch (e) { console.error(e); } }
                if (it.good) api.toast(it.good, 'good');
                left--;
                if (left === 0) setTimeout(() => { api.good(); resolve(wrong); }, 350);
                return true;
              }
              wrong++; api.mistake(it.why || '放错啦，再想想它属于哪一类？');
              zone.classList.remove('shake'); void zone.offsetWidth; zone.classList.add('shake');
              return false;
            },
          });
        });
      });
    },

    orderSteps(api, o) {
      const host = o.container || api.stage;
      const box = h('div', { class: 'orderer panel' + (o.className ? ' ' + o.className : '') });
      if (o.prompt) box.append(h('div', { class: 'sort-prompt', html: o.prompt }));
      const list = h('ol', { class: 'order-list' });
      const check = h('button', { class: 'btn btn-primary', type: 'button' }, o.checkLabel || '检查顺序');
      const fb = h('div', { class: 'choice-feedback', hidden: true });
      box.append(list, h('div', { class: 'btn-row' }, check, h('span', { class: 'kbd-note' }, '用 ▲▼ 调整，或把一步拖到另一步上交换位置。')), fb);
      host.append(box);
      let order = o.steps.map((s, i) => i);
      let tries = 0;
      do { order = shuffle(order); tries++; } while (order.every((v, i) => v === i) && tries < 20);
      let wrong = 0;
      const render = () => {
        list.innerHTML = '';
        order.forEach((stepIdx, pos) => {
          const up = h('button', { type: 'button', 'aria-label': '上移', html: ICON.up, disabled: pos === 0 });
          const dn = h('button', { type: 'button', 'aria-label': '下移', html: ICON.down, disabled: pos === order.length - 1 });
          const li = h('li', { class: 'order-item dropzone', dataset: { pos } }, h('span', { class: 'order-num' }, pos + 1), h('span', { class: 'order-text', html: o.steps[stepIdx] }), h('span', { class: 'order-ctrl' }, up, dn));
          up.addEventListener('click', e => { e.stopPropagation(); swap(pos, pos - 1, 'up'); });
          dn.addEventListener('click', e => { e.stopPropagation(); swap(pos, pos + 1, 'dn'); });
          list.append(li);
          api.draggable(li.querySelector('.order-text'), {
            zones: () => [...list.children].filter(x => x !== li),
            onDrop: zone => { swap(pos, +zone.dataset.pos); return true; },
          });
        });
      };
      const swap = (a, b, dir) => {
        if (b < 0 || b >= order.length) return;
        [order[a], order[b]] = [order[b], order[a]]; api.sfx('click'); fb.hidden = true; render();
        if (dir) { const li = list.children[b]; const btns = li ? li.querySelectorAll('.order-ctrl button') : []; const t = btns[dir === 'up' ? 0 : 1]; const f = t && !t.disabled ? t : [...btns].find(x => !x.disabled); if (f) f.focus({ preventScroll: true }); }
      };
      render();
      return api.task(resolve => {
        check.addEventListener('click', () => {
          const items = [...list.children];
          const okCount = order.filter((v, i) => v === i).length;
          if (okCount === order.length) {
            items.forEach(li => li.classList.add('ok'));
            check.disabled = true; list.querySelectorAll('button').forEach(b => (b.disabled = true));
            list.querySelectorAll('.draggable').forEach(d => d.classList.add('locked'));
            fb.hidden = false; fb.className = 'choice-feedback good'; fb.innerHTML = o.explain || '顺序完全正确！';
            setTimeout(() => fb.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' }), 40);
            api.good();
            setTimeout(() => resolve(wrong), 700);
          } else {
            wrong++; api.mistake();
            items.forEach((li, i) => { li.classList.toggle('bad', order[i] !== i); li.classList.toggle('ok', order[i] === i); });
            setTimeout(() => items.forEach(li => li.classList.remove('bad', 'ok')), 1400);
            fb.hidden = false; fb.className = 'choice-feedback bad';
            fb.innerHTML = `有 ${okCount} 步的位置是对的，红色的步骤还需要调整。` + (o.hint ? `<br>${o.hint}` : '');
            setTimeout(() => fb.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' }), 40);
          }
        });
      });
    },
  };

  /* ---------------- app shell ---------------- */
  let current = null; // running level
  let screenName = 'title';
  const $ = sel => document.querySelector(sel);

  function isUnlocked(i) { return state.teacher || i === 0 || !!state.done[levels[i - 1].id]; }
  function totalStars() { return Object.values(state.stars).reduce((a, b) => a + (b || 0), 0); }
  function starsHtml(n, max = 3) { let s = ''; for (let i = 0; i < max; i++) s += ICON.star(i < n); return s; }
  function dropBadge(n, locked) { return `<span class="drop-badge">${ICON.drop(locked ? 'var(--line)' : 'var(--aqua)')}<span>${n}</span></span>`; }
  function setHash(tok) { try { history.replaceState(null, '', '#' + tok); } catch (e) { try { location.hash = tok; } catch (_) {} } }

  function renderTopbar() {
    const bar = $('.topbar');
    bar.innerHTML = '';
    const brand = h('button', { class: 'brand', type: 'button', title: '回到封面' });
    brand.innerHTML = `<svg width="26" height="30" viewBox="0 0 40 48" aria-hidden="true"><path d="M20 2 C20 2 4 20 4 31 a16 16 0 0 0 32 0 C36 20 20 2 20 2Z" fill="var(--aqua)"/><ellipse cx="20" cy="31" rx="13" ry="4.5" fill="none" stroke="var(--on-accent)" stroke-width="1.6"/><circle cx="33" cy="31" r="2.6" fill="var(--spark)"/></svg><span class="brand-text">${C.name}元素探险</span>`;
    brand.addEventListener('click', () => go('title'));
    const mapBtn = h('button', { class: 'tb-btn', type: 'button', 'aria-label': '探险地图', html: `${ICON.map}<span class="tb-label">地图</span>` });
    mapBtn.addEventListener('click', () => go('map'));
    const codexBtn = h('button', { class: 'tb-btn', type: 'button', 'aria-label': '知识图鉴', html: `${ICON.book}<span class="tb-label">知识图鉴</span>` });
    codexBtn.addEventListener('click', () => go('codex'));
    const stars = h('span', { class: 'tb-btn tb-stars', title: '已获得的星星', html: `${ICON.star(true).replace('<svg', '<svg width="18" height="18"')}${totalStars()}` });
    const snd = h('button', { class: 'tb-btn icon-only', type: 'button', 'aria-label': state.muted ? '打开声音' : '关闭声音', title: state.muted ? '打开声音' : '关闭声音', html: ICON.sound(!state.muted) });
    snd.addEventListener('click', () => { state.muted = !state.muted; persist(); renderTopbar(); if (!state.muted) Sfx.play('pop'); });
    bar.append(brand, h('span', { class: 'spacer' }), mapBtn, codexBtn, stars, snd);
  }

  function leaveLevel() {
    if (current) {
      current.ctrl.abort();
      current.cleanups.forEach(f => { try { f(); } catch (e) { /* ignore */ } });
      Drag.clearSel();
      current = null;
    }
    Dialog.hide();
    const ov = $('.overlay'); if (ov) ov.remove();
  }

  function mountScreen(node) {
    const scr = $('#screen');
    scr.innerHTML = '';
    scr.scrollTop = 0;
    node.classList.add('screen-enter');
    scr.append(node);
  }

  function go(name, arg) {
    leaveLevel();
    screenName = name;
    renderTopbar();
    if (name === 'title') { renderTitle(); setHash('title'); }
    else if (name === 'map') { renderMap(); setHash('map'); }
    else if (name === 'codex') { renderCodex(); setHash('codex'); }
    else if (name === 'level') { startLevel(arg); }
  }

  function renderTitle() {
    const completed = levels.filter(l => state.done[l.id]).length;
    const start = h('button', {class:'btn btn-primary btn-lg',type:'button'}, completed ? '继续探险' : '开始探险');
    start.addEventListener('click', () => { Sfx.unlock(); go('map'); });
    const teacher = h('label',{class:'teacher-toggle'},h('input',{type:'checkbox',checked:state.teacher || null}), '教师模式（解锁全部关卡）');
    teacher.querySelector('input').addEventListener('change', e => {state.teacher=e.target.checked;persist();});
    const copy = h('div',{class:'title-copy'},
      h('div',{class:'eyebrow'},'元素探险 · 性质与应用'),
      h('h1',{class:'title-h1',html:`氢氢的<br><span class="accent">${C.name}元素</span>探险`}),
      h('p',{class:'title-lead'},C.lead),
      h('div',{class:'el-tile',html:`<span class="z">${C.z}</span><span class="sym">${C.symbol}</span><span class="meta"><b>${C.name}</b>原子序数 ${C.z}<br>相对原子质量 ${C.mass}</span>`}),
      h('div',{class:'btn-row'},start,h('button',{class:'btn btn-lg',type:'button',onclick:()=>go('codex')},'知识图鉴')),
      h('div',{class:'btn-row'},teacher,h('span',{class:'pill'},`已完成 ${completed}/${levels.length} 站`)));
    const legacy = window.CourseAccount.legacy();
    const oldStars = ['learn','read','build','home','final'].reduce((n,k)=>n+(Number.isInteger(legacy[k])?Math.min(3,Math.max(0,legacy[k])):0),0);
    if (oldStars || legacy.passed) {
      const details=h('details',{class:'legacy-record panel'},h('summary',null,`旧版学习记录 · ★ ${oldStars} / 15`),h('p',{class:'small muted'},'旧版成绩已保留。新版任务和知识卡单独记录，从第一站开始探险。'));
      ['认识元素','认读符号','搭原子','周期表位置','小测验'].forEach((label,i)=>details.append(h('div',{class:'small'},`${label}：${legacy[['learn','read','build','home','final'][i]] || 0} / 3 星`)));
      if(legacy.passed) details.append(h('p',{class:'small'},`旧版测验已通过：${legacy.score || 0} / 8 题`));
      copy.append(details);
    }
    const art=h('div',{class:'title-art'},h('img',{class:'body',src:H2.assets.body,alt:'氢氢：元素探险向导',draggable:'false'}),h('div',{class:'course-seal'},h('b',null,C.symbol),h('span',null,`${levels.length} 站科学任务`)));
    mountScreen(h('section',{class:'title-screen'},copy,art));
  }

  function renderMap() {
    const doneCount = levels.filter(l => state.done[l.id]).length;
    const nextIdx = levels.findIndex((l, i) => !state.done[l.id] && isUnlocked(i));
    const teach = h('label', { class: 'teacher-toggle' }, h('input', { type: 'checkbox', id: 'teacher-mode-map', checked: state.teacher || null }), '教师模式');
    teach.querySelector('input').addEventListener('change', e => { state.teacher = e.target.checked; persist(); renderMap(); });
    const grid = h('div', { class: 'map-grid' });
    levels.forEach((l, i) => {
      const open = isUnlocked(i);
      const card = h('button', { class: 'station' + (open ? '' : ' locked') + (i === nextIdx ? ' current' : ''), type: 'button', 'aria-disabled': open ? null : 'true' });
      card.innerHTML = `<div class="station-top">${dropBadge(l.order, !open)}${state.done[l.id] ? `<span class="pill ok">已完成</span>` : open ? (i === nextIdx ? `<span class="pill">下一站</span>` : '') : `<span class="pill warn">${ICON.lock} 未解锁</span>`}</div>
        <div class="station-title">${l.title}</div><div class="station-sub">${l.subtitle || ''}</div>
        <div class="station-stars" aria-label="${state.stars[l.id] || 0} 颗星">${starsHtml(state.stars[l.id] || 0)}</div>`;
      card.addEventListener('click', () => {
        if (!open) { Toast.show(`先完成「${levels[i - 1].title}」才能解锁这一站哦`, 'info'); Sfx.play('wrong'); return; }
        Sfx.unlock(); Sfx.play('pop'); go('level', l.id);
      });
      grid.append(card);
    });
    mountScreen(h('section', { class: 'map' },
      h('div', { class: 'map-head' },
        h('div', null, h('div', { class: 'eyebrow' }, `已点亮 ${doneCount} / ${levels.length} 站`), h('h2', { class: 'map-title' }, '探险地图')),
        teach),
      grid));
  }

  function cardNode(l, i, locked) {
    const c = l.card || { title: l.title, points: [] };
    const node = h('article', { class: 'kcard' + (locked ? ' locked' : '') });
    node.innerHTML = `<div class="kcard-top"><span class="kcard-no">NO.${String(l.order).padStart(2, '0')}</span><span class="kcard-title">${locked ? '？？？' : c.title}</span></div>`;
    if (locked) node.append(h('p', { class: 'small muted' }, `完成「${l.title}」后解锁这张知识卡`));
    else {
      if (c.formula) node.append(h('div', null, h('span', { class: 'formula-box', html: chem(c.formula) })));
      if (c.points && c.points.length) node.append(h('ul', null, c.points.map(p => h('li', { html: p }))));
    }
    return node;
  }

  function renderCodex() {
    const got = levels.filter(l => state.done[l.id]).length;
    const grid = h('div', { class: 'codex-grid' });
    levels.forEach((l, i) => grid.append(cardNode(l, i, !state.done[l.id])));
    mountScreen(h('section', null,
      h('div', { class: 'map-head' }, h('div', null, h('div', { class: 'eyebrow' }, `已收集 ${got} / ${levels.length} 张`), h('h2', { class: 'map-title' }, '知识图鉴')),
        h('button', { class: 'btn', type: 'button', onclick: () => go('map') }, '回到地图')),
      grid));
  }

  function makeApi(def, stageEl, ctrl) {
    const signal = ctrl.signal;
    const cleanups = [];
    let mistakes = 0, finished = false;
    const guard = () => { if (signal.aborted) throw abortErr(); };
    const api = {
      def, stage: stageEl, signal, h, chem, frag, shuffle, ICON, state,
      get mistakes() { return mistakes; },
      get aborted() { return signal.aborted; },
      say(lines) { guard(); return Dialog.say(lines, signal); },
      hint(html, mood) { guard(); Dialog.hint(html, mood); },
      mood(m) { Dialog.setMood(m); },
      wait(ms) {
        return new Promise((res, rej) => {
          if (signal.aborted) return rej(abortErr());
          const t = setTimeout(() => { signal.removeEventListener('abort', ab); res(); }, ms);
          const ab = () => { clearTimeout(t); rej(abortErr()); };
          signal.addEventListener('abort', ab, { once: true });
        });
      },
      task(executor) {
        return new Promise((res, rej) => {
          if (signal.aborted) return rej(abortErr());
          const ab = () => rej(abortErr());
          signal.addEventListener('abort', ab, { once: true });
          const done = v => { signal.removeEventListener('abort', ab); res(v); };
          try { executor(done, rej); } catch (e) { rej(e); }
        });
      },
      waitClick(el) { return api.task(res => el.addEventListener('click', e => res(e), { once: true })); },
      on(target, type, fn, opts) { target.addEventListener(type, fn, opts); cleanups.push(() => target.removeEventListener(type, fn, opts)); },
      raf(fn) {
        let id = 0, last = performance.now(), stopped = false;
        const loop = t => { if (stopped || signal.aborted) return; const dt = Math.min(0.05, (t - last) / 1000); last = t; if (fn(dt, t) === false) return; id = requestAnimationFrame(loop); };
        id = requestAnimationFrame(loop);
        const stop = () => { stopped = true; cancelAnimationFrame(id); };
        cleanups.push(stop); return stop;
      },
      interval(fn, ms) { const t = setInterval(() => { if (!signal.aborted) fn(); }, ms); const stop = () => clearInterval(t); cleanups.push(stop); return stop; },
      timeout(fn, ms) { const t = setTimeout(() => { if (!signal.aborted) fn(); }, ms); const stop = () => clearTimeout(t); cleanups.push(stop); return stop; },
      sfx(n) { Sfx.play(n); },
      toast(msg, kind, ms) { Toast.show(msg, kind, ms); },
      confetti() { Confetti.burst(); },
      mistake(msg) { mistakes++; Sfx.play('wrong'); Dialog.setMood('serious'); if (msg) Toast.show(msg, 'bad', 3400); },
      good(msg) { Sfx.play('correct'); Dialog.setMood('happy'); if (msg) Toast.show(msg, 'good'); },
      steps(names) { Steps.set(names); },
      step(i) { Steps.go(i); },
      draggable(el, opts) { return Drag.make(el, opts || {}, cleanups); },
      choice(o) { return Components.choice(api, o); },
      sortInto(o) { return Components.sortInto(api, o); },
      orderSteps(o) { return Components.orderSteps(api, o); },
      button(label, o = {}) { const b = h('button', { class: 'btn ' + (o.primary === false ? '' : 'btn-primary') + (o.className ? ' ' + o.className : ''), type: 'button', html: label }); if (o.onClick) b.addEventListener('click', o.onClick); return b; },
      clear() { Drag.clearSel(); stageEl.innerHTML = ''; },
      restart() { go('level', def.id); },
      setName(name) { state.name = String(name || '').slice(0, 24); persist(); },
      scrollTo(el) { if (el) el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' }); },
      complete(o = {}) {
        if (finished || signal.aborted) return;
        finished = true;
        const stars = o.stars != null ? o.stars : mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
        state.done[def.id] = true;
        state.stars[def.id] = Math.max(state.stars[def.id] || 0, stars);
        persist(); renderTopbar();
        Steps.go(Steps.names.length);
        showResult(def, stars, o);
      },
      get reducedMotion() { return reducedMotion(); },
      cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); },
    };
    return { api, cleanups };
  }

  const injectedCss = new Set();
  async function startLevel(id) {
    const idx = levels.findIndex(l => l.id === id);
    if (idx < 0 || !isUnlocked(idx)) { go('map'); return; }
    const def = levels[idx];
    setHash('L-' + id);
    if (def.css && !injectedCss.has(id)) { document.head.append(h('style', { 'data-level': id }, def.css)); injectedCss.add(id); }
    const stepsHost = h('div', { class: 'steps', 'aria-label': '关卡进度' });
    const stage = h('div', { class: `stage lv-${id}`, id: 'stage' });
    const head = h('header', { class: 'level-head' },
      h('div', { class: 'level-name', html: `${dropBadge(def.order)}<div><h2 class="level-title">${def.title}</h2><div class="level-sub">${def.subtitle || ''}</div></div>` }),
      stepsHost);
    mountScreen(h('section', { class: 'level' }, head, stage));
    Steps.host = stepsHost; Steps.set([]);
    const ctrl = new AbortController();
    const { api, cleanups } = makeApi(def, stage, ctrl);
    current = { def, ctrl, cleanups, api };
    Dialog.show(); Dialog.setMood('happy'); Dialog.hint('');
    try { await def.run(api); }
    catch (e) {
      if (e && e.name === 'AbortError') return;
      console.error('[level ' + id + ']', e);
      Toast.show('这一关出了点小问题，请回到地图重试。', 'bad', 5000);
    }
  }

  function showResult(def, stars, o) {
    const idx = levels.indexOf(def);
    const next = levels[idx + 1];
    Sfx.play('win'); Confetti.burst();
    const ov = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': '关卡完成' });
    const card = h('div', { class: 'result-card' });
    const close = h('button', { class: 'result-close', type: 'button', 'aria-label': '关闭，查看本关', title: '关闭，查看本关', html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' });
    close.addEventListener('click', () => ov.remove());
    card.append(close);
    card.append(
      h('div', { class: 'result-head' }, h('img', { src: H2.assets.head_curious || '', alt: '', draggable: 'false' }),
        h('div', { class: 'col', style: { gap: '6px' } }, h('div', { class: 'eyebrow' }, `第 ${def.order} 站完成`), h('div', { class: 'result-title' }, o.title || def.title), h('div', { class: 'stars', html: starsHtml(stars) }))),
      o.message ? h('p', { class: 'muted', html: o.message }) : h('p', { class: 'muted' }, stars === 3 ? '一次都没出错，太厉害了！' : stars === 2 ? '只错了一点点，已经很棒啦！' : '完成啦！把知识卡再读一遍，下次一定能拿满星。'),
      h('div', { class: 'small muted' }, '获得知识卡：'),
      cardNode(def, idx, false));
    const back = h('button', { class: 'btn', type: 'button' }, '回到地图');
    back.addEventListener('click', () => go('map'));
    const again = h('button', { class: 'btn btn-ghost', type: 'button' }, '再玩一次');
    again.addEventListener('click', () => go('level', def.id));
    const row = h('div', { class: 'btn-row' }, back, again);
    if (next) { const nb = h('button', { class: 'btn btn-primary', type: 'button' }, `下一站：${next.title} ›`); nb.addEventListener('click', () => go('level', next.id)); row.prepend(nb); }
    card.append(row);
    ov.append(card);
    document.body.append(ov);
    setTimeout(() => (row.firstElementChild || back).focus({ preventScroll: true }), 50);
    // the card stays on top of the finished level; dialogue shows a closing line
    Dialog.hint(next ? `下一站是「${next.title}」，准备好了吗？` : '全部通关啦！去知识图鉴看看你收集的卡片吧。', 'curious');
  }

  /* ---------------- boot ---------------- */
  function boot(saved) {
    Object.assign(state, window.CourseAccount.loadState());
    if (saved && saved.state) Object.assign(state, saved.state);
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.append(h('header', { class: 'topbar' }), h('main', { id: 'screen' }), h('div', { id: 'dialog', class: 'dialog', hidden: true }));
    if (!document.getElementById('toasts')) document.body.append(h('div', { id: 'toasts', 'aria-live': 'polite' }), h('canvas', { id: 'confetti', 'aria-hidden': 'true' }));
    Dialog.init(); Drag.init();
    const hash = (location.hash || '').slice(1);
    if (hash.startsWith('L-') && levels.some(l => l.id === hash.slice(2))) go('level', hash.slice(2));
    else if (hash === 'map') go('map');
    else if (hash === 'codex') go('codex');
    else go('title');
  }
  H2.boot = () => boot();

  /* ---------------- debug hooks (used by tools/shot.mjs tests) ---------------- */
  H2.debug = {
    goto: id => go('level', id),
    fast(on = true) { Dialog.fast = on; return on; },
    async skipDialog(max = 80) {
      let n = 0, idle = 0;
      while (n < max && idle < 3) {
        if (Dialog._skipType || Dialog._advance) { Dialog.poke(); n++; idle = 0; }
        else idle++;
        await new Promise(r => setTimeout(r, 40));
      }
      return n;
    },
    state: () => JSON.parse(JSON.stringify(state)),
    unlockAll() { state.teacher = true; persist(); return true; },
    reset() { Object.assign(state, window.CourseAccount.resetState()); return true; },
    mistakes: () => (current ? current.api.mistakes : null),
    current: () => (current ? current.def.id : screenName),
    dialogText: () => (Dialog.text ? Dialog.text.textContent : ''),
    chem,
  };
  H2.util = { h, chem, shuffle, frag, Sfx, Toast };
})();
