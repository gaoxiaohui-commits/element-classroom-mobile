/* Hydrogen uses the parent account vault, never the old anonymous browser save. */
(() => {
  'use strict';
  const KEY = 'h2-adventure-v1';
  const LEVELS = ['electrolysis', 'atom', 'lightest', 'prepare', 'purity', 'reduce', 'energy', 'final'];
  let accounts = null, initialized = false;
  try { if (window.parent !== window) accounts = window.parent.ElementAccounts; } catch (_) { /* other origin */ }

  const blank = () => ({ done: {}, stars: {}, teacher: false, muted: false, name: '' });
  function normalize(value) {
    const result = blank();
    if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
    for (const id of LEVELS) {
      if (value.done?.[id] === true) result.done[id] = true;
      const stars = value.stars?.[id];
      if (Number.isInteger(stars) && stars >= 0 && stars <= 3) result.stars[id] = stars;
    }
    result.teacher = value.teacher === true;
    result.muted = value.muted === true;
    result.name = typeof value.name === 'string' ? value.name.slice(0, 24) : '';
    return result;
  }

  function showUpgradeNotice() {
    const render = () => {
      if (document.getElementById('hydrogen-upgrade-notice')) return;
      const panel = document.createElement('section');
      panel.id = 'hydrogen-upgrade-notice';
      panel.setAttribute('role', 'alert');
      panel.style.cssText = 'max-width:28em;margin:12vh auto;padding:24px;font:16px/1.7 system-ui,sans-serif;color:#1c3442;background:#fff;border:1px solid #d7e7eb;border-radius:18px;text-align:center;';
      const message = document.createElement('p');
      message.textContent = '课堂已更新，请重新打开后登录。';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = '保存并重新打开';
      button.style.cssText = 'padding:11px 17px;border:0;border-radius:10px;background:#168da2;color:#fff;font:inherit;';
      const errorLabel = document.createElement('p');
      errorLabel.setAttribute('role', 'status');
      errorLabel.style.color = '#b73e43';
      button.addEventListener('click', async () => {
        button.disabled = true;
        errorLabel.textContent = '';
        try {
          if (typeof accounts?.flush !== 'function') throw new Error('请先回课程目录保存进度，再重新打开。');
          await accounts.flush();
          window.parent.location.reload();
        } catch (error) {
          errorLabel.textContent = error.message || '进度尚未保存，请重试。';
          button.disabled = false;
        }
      });
      panel.append(message, button, errorLabel);
      const host = document.getElementById('app') || document.body;
      host.replaceChildren(panel);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
    else render();
  }

  const ready = Promise.resolve().then(async () => {
    if (!accounts) {
      location.replace(new URL('../index.html', location.href).href);
      throw new Error('请从课程目录打开氢元素游戏。');
    }
    if (typeof accounts.supportsKey !== 'function' || !accounts.supportsKey(KEY)) {
      showUpgradeNotice();
      throw new Error('课堂已更新，请重新打开后登录。');
    }
    await accounts.ready;
    if (typeof accounts.store?.get !== 'function' || typeof accounts.store?.set !== 'function') {
      showUpgradeNotice();
      throw new Error('课堂已更新，请重新打开后登录。');
    }
    initialized = true;
  });
  // The build wrapper also catches ready: the message is already visible here.
  ready.catch(() => {});

  function requireReady() {
    if (!initialized) throw new Error('账号尚未准备好，请从课程目录重新打开。');
  }
  function loadState() {
    requireReady();
    return normalize(accounts.store.get(KEY));
  }
  function saveState(value) {
    requireReady();
    accounts.store.set(KEY, normalize(value));
  }
  function resetState() {
    const value = blank();
    saveState(value);
    return value;
  }

  window.HydrogenAccountAdapter = Object.freeze({ ready, loadState, saveState, resetState });
})();
