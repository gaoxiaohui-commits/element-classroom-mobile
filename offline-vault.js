/* Local, encrypted accounts for the offline mobile game. No network requests. */
(() => {
  'use strict';

  const DB_NAME = 'element-offline-vault-v1';
  const STORE = 'accounts';
  const FORMAT = 'element-offline-vault';
  const SCHEMA = 1;
  const ITERATIONS = 310000;
  const MAX_PROGRESS_BYTES = 256 * 1024;
  const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
  const MAX_ACCOUNTS = 100;
  // Add courses without changing the database or encrypted backup format: old
  // accounts keep their existing keys, and a new course starts with no progress.
  const KEYS = new Set(['hlbb-prog', 'hlbb-teach', 'hlbb-muted',
    'hlbb-solo-He', 'hlbb-solo-Li', 'hlbb-solo-Be', 'hlbb-solo-B', 'h2-adventure-v1']);
  const RECORD_FIELDS = ['id', 'username', 'usernameKey', 'salt', 'iterations',
    'version', 'iv', 'ciphertext', 'createdAt'];
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let dbPromise = null;
  let session = null;
  let generation = 0;

  const fail = message => { throw new Error(message); };
  const plain = value => {
    if (value === null || typeof value !== 'object' || Array.isArray(value) ||
        Object.prototype.toString.call(value) !== '[object Object]') return false;
    const prototype = Object.getPrototypeOf(value);
    // Also accept plain objects cloned from another same-origin window.
    return prototype === null || Object.getPrototypeOf(prototype) === null;
  };
  const exactFields = (value, fields) => plain(value) &&
    Object.getOwnPropertySymbols(value).length === 0 && Object.keys(value).length === fields.length &&
    fields.every(key => Object.prototype.hasOwnProperty.call(value, key));
  const isoDate = value => typeof value === 'string' &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

  function requireFeatures() {
    if (!globalThis.indexedDB || !globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
      fail('此浏览器暂不支持离线账号，请使用较新的浏览器并从已安装的应用打开。');
    }
  }

  function storageError(error) {
    if (error?.name === 'QuotaExceededError') return new Error('设备存储空间不足，进度尚未保存，请清理空间后重试。');
    if (error?.name === 'ConstraintError') return new Error('这个用户名已被使用。');
    return new Error('无法保存或读取本机数据，请检查浏览器存储权限后重试。');
  }

  function openDatabase() {
    requireFeatures();
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        let request;
        try { request = indexedDB.open(DB_NAME, SCHEMA); }
        catch (error) { reject(storageError(error)); return; }
        request.onupgradeneeded = () => {
          const db = request.result;
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('usernameKey', 'usernameKey', { unique: true });
        };
        request.onerror = () => reject(storageError(request.error));
        request.onblocked = () => reject(new Error('本机数据库正在被其他页面使用，请关闭其他游戏页面后重试。'));
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => { db.close(); dbPromise = null; };
          resolve(db);
        };
      }).catch(error => { dbPromise = null; throw error; });
    }
    return dbPromise;
  }

  // All crypto work happens outside these short-lived IndexedDB transactions.
  async function transaction(mode, action) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      let tx;
      let value;
      let explicitError;
      try {
        if (mode === 'readwrite') {
          try { tx = db.transaction(STORE, mode, { durability: 'strict' }); }
          catch (error) {
            if (!(error instanceof TypeError)) throw error;
            tx = db.transaction(STORE, mode);
          }
        } else { tx = db.transaction(STORE, mode); }
      }
      catch (error) { reject(storageError(error)); return; }
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => { /* onabort reports the final transaction result */ };
      tx.onabort = () => reject(explicitError || storageError(tx.error));
      try {
        action(tx.objectStore(STORE), result => { value = result; }, error => {
          explicitError = error;
          tx.abort();
        });
      } catch (error) {
        explicitError = error instanceof Error ? error : storageError(error);
        try { tx.abort(); } catch (_) { reject(explicitError); }
      }
    });
  }

  const getById = id => transaction('readonly', (store, done) => {
    store.get(id).onsuccess = event => done(event.target.result);
  });
  const getByUsername = name => transaction('readonly', (store, done) => {
    store.index('usernameKey').get(name).onsuccess = event => done(event.target.result);
  });
  const getAll = () => transaction('readonly', (store, done) => {
    store.getAll().onsuccess = event => done(event.target.result);
  });

  function usernameParts(value) {
    if (typeof value !== 'string') fail('用户名须为2–24个中英文、数字、下划线或减号。');
    const username = value.trim();
    if (!/^[A-Za-z0-9_\-\u3400-\u4dbf\u4e00-\u9fff]{2,24}$/.test(username)) {
      fail('用户名须为2–24个中英文、数字、下划线或减号。');
    }
    return { username, usernameKey: username.toLowerCase() };
  }

  function validatePassword(value) {
    if (typeof value !== 'string' || value.length < 8 || value.length > 256) fail('密码须为8–256个字符。');
    // TextEncoder replaces lone UTF-16 surrogates, so reject them rather than
    // silently making two different passwords derive the same key.
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF) {
        const next = value.charCodeAt(++i);
        if (!(next >= 0xDC00 && next <= 0xDFFF)) fail('密码含有无效字符。');
      } else if (code >= 0xDC00 && code <= 0xDFFF) fail('密码含有无效字符。');
    }
  }

  function toBase64(bytes) {
    let text = '';
    for (let i = 0; i < bytes.length; i += 0x4000) {
      text += String.fromCharCode(...bytes.subarray(i, i + 0x4000));
    }
    return btoa(text);
  }

  function fromBase64(value, maxBytes, expectedBytes = null) {
    if (typeof value !== 'string' || value.length > Math.ceil(maxBytes / 3) * 4 ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
      fail('备份数据格式无效。');
    }
    let binary;
    try { binary = atob(value); } catch (_) { fail('备份数据格式无效。'); }
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    if (bytes.length > maxBytes || (expectedBytes !== null && bytes.length !== expectedBytes) ||
        toBase64(bytes) !== value) fail('备份数据格式无效。');
    return bytes;
  }

  function assertJSON(value, depth = 0, seen = new Set()) {
    if (depth > 32) fail('进度数据层级太深。');
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
    if (typeof value === 'number' && Number.isFinite(value)) return;
    if ((!plain(value) && !Array.isArray(value)) || seen.has(value)) fail('进度数据格式无效。');
    if (Object.getOwnPropertySymbols(value).length) fail('进度数据格式无效。');
    seen.add(value);
    for (const child of Object.values(value)) assertJSON(child, depth + 1, seen);
    if (Array.isArray(value) && Object.keys(value).length !== value.length) fail('进度数据格式无效。');
    seen.delete(value);
  }

  function cloneProgress(value) {
    if (!plain(value) || Object.keys(value).some(key => !KEYS.has(key))) fail('只能保存本游戏的学习进度。');
    assertJSON(value);
    const json = JSON.stringify(value);
    if (encoder.encode(json).length > MAX_PROGRESS_BYTES) fail('学习进度数据太大，无法保存。');
    return JSON.parse(json);
  }

  function recordCopy(value) {
    return Object.fromEntries(RECORD_FIELDS.map(key => [key, value[key]]));
  }

  function validateRecord(record) {
    if (!exactFields(record, RECORD_FIELDS)) fail('备份账号格式无效。');
    if (typeof record.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(record.id)) fail('备份账号编号无效。');
    const normalized = usernameParts(record.username);
    if (normalized.username !== record.username || normalized.usernameKey !== record.usernameKey ||
        record.iterations !== ITERATIONS || !Number.isSafeInteger(record.version) || record.version < 1) fail('备份账号格式无效。');
    if (!isoDate(record.createdAt)) fail('备份时间格式无效。');
    fromBase64(record.salt, 16, 16);
    fromBase64(record.iv, 12, 12);
    if (fromBase64(record.ciphertext, MAX_PROGRESS_BYTES + 4096).length < 16) fail('备份加密数据无效。');
    return recordCopy(record);
  }

  async function deriveKey(password, salt) {
    requireFeatures();
    const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
      material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  const additionalData = record => encoder.encode(`${FORMAT}/v1\n${record.id}\n${record.usernameKey}\n${record.version}`);

  async function encryptProgress(record, key, data) {
    const clean = cloneProgress(data);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const bytes = encoder.encode(JSON.stringify({ schemaVersion: SCHEMA, accountId: record.id, data: clean }));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: additionalData(record), tagLength: 128 }, key, bytes);
    return { ...record, iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
  }

  async function decryptProgress(record, key) {
    const clean = validateRecord(record);
    let bytes;
    try {
      bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(clean.iv, 12, 12),
        additionalData: additionalData(clean), tagLength: 128 }, key,
      fromBase64(clean.ciphertext, MAX_PROGRESS_BYTES + 4096));
    } catch (_) { fail('用户名或密码不正确，或本机数据已损坏。'); }
    let payload;
    try { payload = JSON.parse(decoder.decode(bytes)); } catch (_) { fail('本机进度数据已损坏。'); }
    if (!exactFields(payload, ['schemaVersion', 'accountId', 'data']) ||
        payload.schemaVersion !== SCHEMA || payload.accountId !== clean.id) fail('本机进度数据已损坏。');
    return cloneProgress(payload.data);
  }

  function newId() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function activeSession() {
    if (!session) fail('请先登录。');
    return session;
  }

  function assertCurrent(expected) {
    if (session !== expected || expected.generation !== generation) fail('账号已切换，请重新操作。');
  }

  function startAuthentication() {
    requireFeatures();
    generation += 1;
    session = null;
    return generation;
  }

  function establishSession(authGeneration, record, key) {
    if (authGeneration !== generation) fail('账号已切换，请重新登录。');
    session = { id: record.id, username: record.username, key, generation };
    return { id: record.id, username: record.username };
  }

  async function register(username, password) {
    const authGeneration = startAuthentication();
    const normalized = usernameParts(username);
    validatePassword(password);
    if (await getByUsername(normalized.usernameKey)) fail('这个用户名已被使用。');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(password, salt);
    const record = await encryptProgress({ id: newId(), ...normalized, salt: toBase64(salt),
      iterations: ITERATIONS, version: 1, createdAt: new Date().toISOString() }, key, {});
    if (authGeneration !== generation) fail('账号已切换，请重新操作。');
    await transaction('readwrite', (store, done, abort) => {
      store.getAll().onsuccess = event => {
        if (event.target.result.length >= MAX_ACCOUNTS) { abort(new Error('本机账号数量已达上限，请使用已有账号。')); return; }
        store.add(record);
      };
    });
    return establishSession(authGeneration, record, key);
  }

  async function login(username, password) {
    const authGeneration = startAuthentication();
    const normalized = usernameParts(username);
    validatePassword(password);
    const record = await getByUsername(normalized.usernameKey);
    if (!record) {
      await deriveKey(password, new Uint8Array(16));
      fail('用户名或密码不正确。');
    }
    validateRecord(record);
    const key = await deriveKey(password, fromBase64(record.salt, 16, 16));
    await decryptProgress(record, key);
    return establishSession(authGeneration, record, key);
  }

  async function logout() {
    generation += 1;
    session = null;
  }

  async function readProgress() {
    const current = activeSession();
    const record = await getById(current.id);
    if (!record) fail('本机账号数据不存在，请重新登录。');
    const data = await decryptProgress(record, current.key);
    assertCurrent(current);
    return data;
  }

  async function mergeWithCAS(current, changes) {
    for (let attempt = 0; attempt < 12; attempt++) {
      assertCurrent(current);
      const record = await getById(current.id);
      if (!record) fail('本机账号数据不存在，请重新登录。');
      const before = await decryptProgress(record, current.key);
      if (record.version >= Number.MAX_SAFE_INTEGER) fail('本机进度版本已达上限，请导出备份后联系维护者。');
      const next = await encryptProgress({ ...record, version: record.version + 1 }, current.key,
        { ...before, ...changes });
      assertCurrent(current);
      const committed = await transaction('readwrite', (store, done, abort) => {
        store.get(current.id).onsuccess = event => {
          try { assertCurrent(current); } catch (error) { abort(error); return; }
          const latest = event.target.result;
          if (!latest || latest.version !== record.version || latest.ciphertext !== record.ciphertext) {
            done(false); return;
          }
          store.put(next);
          done(true);
        };
      });
      if (committed) return;
      await new Promise(resolve => setTimeout(resolve, Math.min(5 * (attempt + 1), 30)));
    }
    fail('其他游戏页面正在保存，请稍后重试；本次进度尚未保存。');
  }

  async function writeProgress(changes) {
    const current = activeSession();
    const clean = cloneProgress(changes);
    if (!Object.keys(clean).length) return;
    const save = () => mergeWithCAS(current, clean);
    if (globalThis.navigator?.locks?.request) {
      await navigator.locks.request(`${DB_NAME}:${current.id}`, { mode: 'exclusive' }, save);
    } else {
      await save();
    }
  }

  async function exportBackup() {
    const accounts = (await getAll()).map(validateRecord).sort((a, b) => a.id.localeCompare(b.id));
    const result = { format: FORMAT, schemaVersion: SCHEMA, exportedAt: new Date().toISOString(), accounts };
    if (encoder.encode(JSON.stringify(result)).length > MAX_BACKUP_BYTES) fail('备份数据太大，无法一次导出。');
    return result;
  }

  async function importBackup(value) {
    if (!exactFields(value, ['format', 'schemaVersion', 'exportedAt', 'accounts']) ||
        value.format !== FORMAT || value.schemaVersion !== SCHEMA ||
        !isoDate(value.exportedAt) ||
        !Array.isArray(value.accounts) || value.accounts.length > MAX_ACCOUNTS) fail('这不是有效的元素小课堂备份文件。');
    let bytes;
    try { bytes = encoder.encode(JSON.stringify(value)).length; } catch (_) { fail('备份数据格式无效。'); }
    if (bytes > MAX_BACKUP_BYTES) fail('备份文件太大，无法导入。');
    const accounts = value.accounts.map(validateRecord);
    const ids = new Set(accounts.map(record => record.id));
    const names = new Set(accounts.map(record => record.usernameKey));
    if (ids.size !== accounts.length || names.size !== accounts.length) fail('备份文件包含重复账号。');
    await transaction('readwrite', (store, done, abort) => {
      store.getAll().onsuccess = event => {
        const existing = event.target.result;
        if (!existing.length) {
          for (const record of accounts) store.add(record);
          return;
        }
        const byId = new Map(existing.map(record => [record.id, record]));
        const conflict = accounts.some(record => {
          const local = byId.get(record.id);
          return !local || JSON.stringify(recordCopy(local)) !== JSON.stringify(record);
        });
        if (conflict) abort(new Error('本机已有不同或更新的账号数据，不能覆盖。请在没有账号的设备上还原，或使用一致的备份。'));
      };
    });
    await logout();
  }

  async function listAccountUsernames() {
    return (await getAll()).map(validateRecord).map(record => record.username).sort();
  }

  globalThis.ElementOfflineVault = Object.freeze({ register, login, logout, readProgress,
    writeProgress, exportBackup, importBackup, listAccountUsernames });
})();
