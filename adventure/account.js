/* New adventures keep their own progress inside the existing encrypted course record.
   The five legacy grades/certificate remain intact and readable on the cover. */
(() => {
  'use strict';
  const course = window.ElementCourse;
  const allowed = new Set(['He', 'Li', 'Be', 'B']);
  const field = 'adventureV1';
  let accounts, initialized = false;
  const blank = () => ({ done: {}, stars: {}, teacher: false, muted: false, name: '' });
  const copy = value => value && typeof value === 'object' && !Array.isArray(value) ? JSON.parse(JSON.stringify(value)) : {};
  const key = 'hlbb-solo-' + course.symbol;
  function normalize(value) {
    const clean = blank();
    if (!value || typeof value !== 'object') return clean;
    const ids = (window.H2?.levels || []).map(level => level.id);
    for (const id of ids) {
      if (value.done?.[id] === true) clean.done[id] = true;
      if (Number.isInteger(value.stars?.[id]) && value.stars[id] >= 0 && value.stars[id] <= 3) clean.stars[id] = value.stars[id];
    }
    clean.teacher = value.teacher === true;
    clean.muted = value.muted === true;
    clean.name = typeof value.name === 'string' ? value.name.slice(0, 24) : '';
    return clean;
  }
  function requireReady() { if (!initialized) throw new Error('账号尚未准备好。'); }
  function legacy() {
    requireReady();
    const value = copy(accounts.store.get(key));
    delete value[field];
    return value;
  }
  function loadState() { requireReady(); return normalize(accounts.store.get(key)?.[field]); }
  function saveState(value) {
    requireReady();
    const record = copy(accounts.store.get(key));
    record[field] = normalize(value);
    accounts.store.set(key, record);
  }
  function resetState() { const value = blank(); saveState(value); return value; }
  const ready = Promise.resolve().then(async () => {
    if (!allowed.has(course.symbol)) throw new Error('课程无效。');
    try { if (window.parent !== window) accounts = window.parent.ElementAccounts; } catch (_) { /* same origin required */ }
    if (!accounts) {
      location.replace(new URL('../index.html', location.href).href);
      throw new Error('请从元素小课堂登录后打开。');
    }
    await accounts.ready;
    if (typeof accounts.store?.get !== 'function' || typeof accounts.store?.set !== 'function') throw new Error('请保存进度并更新课堂后重新登录。');
    initialized = true;
  });
  ready.catch(error => {
    const render = () => {
      const host = document.getElementById('app');
      if (!host) return;
      const panel = document.createElement('p');
      panel.className = 'panel'; panel.setAttribute('role', 'alert');
      panel.textContent = error.message;
      host.replaceChildren(panel);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true }); else render();
  });
  window.CourseAccount = Object.freeze({ ready, loadState, saveState, resetState, legacy });
})();
