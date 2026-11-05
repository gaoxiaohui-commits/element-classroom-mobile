/* Offline mobile shell. Courses share one in-memory session; progress is encrypted on device. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const vault = window.ElementOfflineVault;
  const keys = new Set(['hlbb-solo-He', 'hlbb-solo-Li', 'hlbb-solo-Be', 'hlbb-solo-B', 'hlbb-prog', 'hlbb-teach', 'hlbb-muted', 'h2-adventure-v1']);
  const copy = value => value == null ? value : JSON.parse(JSON.stringify(value));
  let user = null, data = {}, authMode = 'login', savePromise = null, sequence = 0;
  let registration = null, installPrompt = null, updateRequested = false;
  let readyResolve, offlineReady = false, offlineText = '正在准备离线游戏…';
  const pending = new Map();
  const accountAPI = { ready: new Promise(resolve => { readyResolve = resolve; }), store: null, flush: null, supportsKey: key => keys.has(key) };

  function saveLabel(text, failed = false) {
    $('save-state').textContent = text;
    $('save-retry').hidden = !failed;
    document.body.classList.toggle('save-failed', failed);
  }
  async function flush() {
    if (savePromise) { await savePromise; if (pending.size) return flush(); return; }
    if (!pending.size) return;
    const batch = new Map(pending);
    saveLabel('正在保存…');
    savePromise = vault.writeProgress(Object.fromEntries([...batch].map(([key, item]) => [key, item.value])));
    try {
      await savePromise;
      for (const [key, item] of batch) if (pending.get(key)?.sequence === item.sequence) pending.delete(key);
      saveLabel(pending.size ? '正在保存…' : '已保存在本机');
    } catch (error) { saveLabel('尚未保存', true); throw error; }
    finally { savePromise = null; }
    if (pending.size) return flush();
  }
  accountAPI.store = {
    get(key) { return keys.has(key) && user ? copy(data[key] ?? null) : null; },
    set(key, value) {
      if (!keys.has(key) || !user) return;
      const stored = copy(value);
      data[key] = stored;
      pending.set(key, { value: stored, sequence: ++sequence });
      // Start the durable write immediately: mobile apps can be suspended without an unload event.
      flush().catch(() => {});
    }
  };
  accountAPI.flush = flush;
  window.ElementAccounts = accountAPI;

  function notice(text) {
    $('app-notice').textContent = text;
    $('app-notice').hidden = false;
    clearTimeout(notice.timer);
    notice.timer = setTimeout(() => { $('app-notice').hidden = true; }, 5000);
  }
  function setAuthMode(mode) {
    authMode = mode;
    document.querySelectorAll('[data-auth-mode]').forEach(button => {
      const selected = button.dataset.authMode === mode;
      button.setAttribute('aria-selected', String(selected));
      button.classList.toggle('selected', selected);
    });
    $('confirm-wrap').hidden = mode !== 'register';
    $('confirm-password').disabled = mode !== 'register';
    $('password').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
    $('auth-submit').textContent = mode === 'register' ? '注册并开始学习' : '登录，开始学习';
    $('auth-error').textContent = '';
  }
  async function authenticate(event) {
    event.preventDefault();
    $('auth-error').textContent = '';
    if (authMode === 'register' && $('password').value !== $('confirm-password').value) {
      $('auth-error').textContent = '两次输入的密码不一致。'; return;
    }
    const button = $('auth-submit'), label = button.textContent;
    button.disabled = true;
    button.textContent = '正在打开你的课堂…';
    try {
      const identity = await vault[authMode]($('username').value.trim(), $('password').value);
      const progress = await vault.readProgress();
      user = identity;
      data = progress;
      pending.clear();
      $('password').value = ''; $('confirm-password').value = '';
      $('current-username').textContent = identity.username;
      $('dialog-username').textContent = identity.username;
      $('login-screen').hidden = true;
      $('learning-screen').hidden = false;
      saveLabel('已保存在本机');
      readyResolve();
      $('game-frame').src = 'games/index.html';
      // A best-effort request to keep this installed app's offline progress on the device.
      navigator.storage?.persist?.().catch(() => {});
    } catch (error) {
      $('auth-error').textContent = error.message || '无法打开账号，请重试。';
    } finally { button.disabled = false; button.textContent = label; }
  }
  async function logout() {
    const button = $('logout-button'); button.disabled = true;
    try {
      await flush();
      await vault.logout();
      user = null; data = {}; pending.clear();
      $('game-frame').src = 'about:blank';
      $('learning-screen').hidden = true;
      $('login-screen').hidden = false;
      $('account-dialog').close();
      accountAPI.ready = new Promise(resolve => { readyResolve = resolve; });
      $('password').focus();
    } catch (error) { $('account-message').textContent = error.message || '尚未保存，请先重试保存。'; }
    finally { button.disabled = false; }
  }

  function showInstall() { $('account-dialog').close(); $('install-dialog').showModal(); }
  async function exportBackup() {
    try {
      await flush();
      const backup = await vault.exportBackup();
      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = '元素小课堂-账号与进度-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      $('account-message').textContent = '备份已生成，请在下载内容中保存这份文件。';
    } catch (error) { $('account-message').textContent = error.message; }
  }
  async function restoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('备份文件太大，请选择本游戏导出的备份。');
      if (user) await flush();
      await vault.importBackup(JSON.parse(await file.text()));
      user = null; data = {}; pending.clear();
      $('game-frame').src = 'about:blank';
      $('learning-screen').hidden = true; $('login-screen').hidden = false;
      $('account-dialog').close();
      accountAPI.ready = new Promise(resolve => { readyResolve = resolve; });
      setAuthMode('login');
      notice('备份已恢复，请用原来的用户名和密码登录。');
    } catch (error) {
      const message = error instanceof SyntaxError ? '这不是有效的游戏备份文件。' : error.message;
      $('account-message').textContent = message;
      $('auth-error').textContent = message;
      notice(message);
    } finally { event.target.value = ''; }
  }

  function offlineStatus(ready, text, retry = false) {
    offlineReady = ready; offlineText = text;
    document.body.classList.toggle('offline-ready', ready);
    $('offline-state').textContent = text;
    $('dialog-offline-state').textContent = text;
    $('offline-retry').hidden = !retry;
  }
  function queryOffline(worker, type = 'CHECK_OFFLINE_READY') {
    return new Promise((resolve, reject) => {
      if (!worker) { reject(new Error('no worker')); return; }
      const channel = new MessageChannel();
      const timeout = setTimeout(() => { channel.port1.close(); reject(new Error('timeout')); }, 8000);
      channel.port1.onmessage = event => {
        if (event.data?.type !== 'OFFLINE_STATUS') return;
        clearTimeout(timeout); channel.port1.close(); resolve(event.data);
      };
      worker.postMessage({ type }, [channel.port2]);
    });
  }
  async function checkOffline() {
    try {
      const result = await queryOffline(registration?.active || navigator.serviceWorker?.controller);
      if (result.ready) offlineStatus(true, '已可离线使用');
      else offlineStatus(false, '离线游戏尚未下载完整，请联网重试', true);
    } catch (_) {
      if (!offlineReady) offlineStatus(false, navigator.onLine ? '正在下载完整游戏，请稍候…' : '请先联网完成首次下载', true);
    }
  }
  function watchRegistration(reg) {
    registration = reg;
    const showWaitingUpdate = () => { $('update-banner').hidden = !(reg.waiting && navigator.serviceWorker.controller); };
    showWaitingUpdate();
    const watch = worker => {
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') { showWaitingUpdate(); checkOffline(); }
        if (worker.state === 'installed') showWaitingUpdate();
        if (worker.state === 'redundant' && !offlineReady) offlineStatus(false, '下载未完成，请保持联网并重试', true);
      });
    };
    watch(reg.installing);
    reg.addEventListener('updatefound', () => watch(reg.installing));
  }
  async function prepareOffline() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
      offlineStatus(false, '请通过 HTTPS 安装网址打开手机版', false); return;
    }
    try {
      offlineStatus(false, '正在下载完整游戏…');
      const reg = await navigator.serviceWorker.register('sw.js', { scope: './', updateViaCache: 'none' });
      watchRegistration(reg);
      if (reg.active) {
        // Re-registering an unchanged worker does not refill resources evicted by the phone.
        const result = await queryOffline(reg.active, 'REPAIR_OFFLINE_CACHE');
        offlineStatus(!!result.ready, result.ready ? '已可离线使用' : '离线游戏尚未下载完整，请联网重试', !result.ready);
      }
    } catch (_) { offlineStatus(false, '离线下载失败，请联网重试', true); }
  }

  document.querySelectorAll('[data-auth-mode]').forEach(button => button.addEventListener('click', () => setAuthMode(button.dataset.authMode)));
  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => $(button.dataset.closeDialog).close()));
  $('login-form').addEventListener('submit', authenticate);
  $('save-retry').addEventListener('click', () => flush().catch(error => notice(error.message)));
  $('home-button').addEventListener('click', async () => {
    if (!user) return;
    const button = $('home-button'); button.disabled = true;
    try { await flush(); $('game-frame').src = 'games/index.html'; }
    catch (_) { notice('进度尚未保存，请先重试保存，再返回课程目录。'); }
    finally { button.disabled = false; }
  });
  $('account-button').addEventListener('click', () => { $('account-message').textContent = ''; $('dialog-offline-state').textContent = offlineText; $('account-dialog').showModal(); });
  $('logout-button').addEventListener('click', logout);
  $('backup-button').addEventListener('click', exportBackup);
  ['restore-login', 'restore-button'].forEach(id => $(id).addEventListener('click', () => $('restore-file').click()));
  $('restore-file').addEventListener('change', restoreBackup);
  ['show-install', 'install-from-account'].forEach(id => $(id).addEventListener('click', showInstall));
  $('offline-retry').addEventListener('click', prepareOffline);
  $('native-install').addEventListener('click', async () => {
    if (!installPrompt) return;
    await installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null;
    $('native-install').hidden = true;
  });
  $('update-button').addEventListener('click', async () => {
    try {
      await flush();
      if (registration?.waiting) { updateRequested = true; registration.waiting.postMessage({ type: 'SKIP_WAITING' }); }
    } catch (_) { notice('请先保存进度，再更新。'); }
  });
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; $('native-install').hidden = false; });
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if (updateRequested) location.reload();
    else { $('update-banner').hidden = !registration?.waiting; checkOffline(); }
  });
  window.addEventListener('online', () => { if (!offlineReady) prepareOffline(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && pending.size) flush().catch(() => {}); });
  window.addEventListener('beforeunload', event => { if (pending.size) { event.preventDefault(); event.returnValue = ''; } });
  if (!vault || !window.crypto?.subtle || !window.indexedDB) {
    $('auth-submit').disabled = true;
    $('auth-error').textContent = '当前环境无法保存离线账号，请用系统浏览器打开 HTTPS 安装网址。';
  }
  prepareOffline();
})();
