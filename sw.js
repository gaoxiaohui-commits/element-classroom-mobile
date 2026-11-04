/* Versioned, scope-local precache. Account data is kept by the app in IndexedDB. */
'use strict';

const APP_VERSION = 'mobile-490045d42ab68136';
const PRECACHE_PATHS = ["index.html", "app.js", "app.css", "offline-vault.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/maskable-512.png", "games/index.html", "games/氦元素小课堂.html", "games/氦锂铍硼总复习.html", "games/硼元素小课堂.html", "games/铍元素小课堂.html", "games/锂元素小课堂.html"];
const SCOPE = new URL(self.registration.scope);
const CACHE_PREFIX = 'element-classroom-mobile:' + encodeURIComponent(SCOPE.href) + ':';
const CACHE_NAME = CACHE_PREFIX + APP_VERSION;
const INDEX_URL = new URL('index.html', SCOPE).href;

function withinScope(url) {
  return url.origin === SCOPE.origin && url.pathname.startsWith(SCOPE.pathname);
}

function canonicalURL(value) {
  const url = new URL(value, SCOPE);
  url.search = '';
  url.hash = '';
  return url;
}

if (!Array.isArray(PRECACHE_PATHS) || !PRECACHE_PATHS.length) {
  throw new Error('Missing offline resource manifest.');
}
const PRECACHE_URLS = [...new Set(PRECACHE_PATHS.map(path => {
  const url = canonicalURL(path);
  if (!withinScope(url) || url.username || url.password) throw new Error('Offline resource outside app scope.');
  return url.href;
}))];
const PRECACHE_SET = new Set(PRECACHE_URLS);
if (!PRECACHE_SET.has(INDEX_URL)) throw new Error('Offline app entry is missing.');

function cleanHTMLURL(value) {
  const url = new URL(value);
  if (url.pathname.endsWith('/index.html')) url.pathname = url.pathname.slice(0, -'index.html'.length);
  else if (url.pathname.endsWith('.html')) url.pathname = url.pathname.slice(0, -'.html'.length);
  else return null;
  return url.href;
}

// Cloudflare Pages removes .html and index.html from HTML URLs. Keep the physical
// manifest as the cache keys, with exact clean aliases for online and offline navigation.
const ASSET_BY_URL = new Map(PRECACHE_URLS.map(url => [url, url]));
for (const asset of PRECACHE_URLS) {
  const alias = cleanHTMLURL(asset);
  if (!alias) continue;
  if (ASSET_BY_URL.has(alias) && ASSET_BY_URL.get(alias) !== asset) throw new Error('Ambiguous offline HTML alias.');
  ASSET_BY_URL.set(alias, asset);
}

function validResponse(response) {
  return !!response && response.ok && response.type !== 'opaque' && response.type !== 'opaqueredirect';
}

async function fetchOfflineAsset(url) {
  const response = await fetch(new Request(url, {
    mode: 'same-origin', credentials: 'same-origin', cache: 'reload', redirect: 'follow'
  }));
  if (!validResponse(response)) throw new Error('Failed to fetch an offline resource.');
  const finalURL = new URL(response.url);
  if (!withinScope(finalURL) || finalURL.username || finalURL.password || finalURL.search || finalURL.hash ||
      (finalURL.href !== url && finalURL.href !== cleanHTMLURL(url))) {
    throw new Error('Offline resource redirect is not allowed.');
  }
  // A cached redirected Response cannot safely answer all navigation redirect modes.
  // Rebuild it after strict URL validation, preserving the data and MIME type while
  // discarding redirect metadata and headers describing the original encoded stream.
  const headers = new Headers(response.headers);
  headers.delete('Content-Encoding');
  headers.delete('Content-Length');
  return new Response(await response.arrayBuffer(), {
    status: response.status, statusText: response.statusText, headers
  });
}

async function offlineStatus() {
  const exists = (await caches.keys()).includes(CACHE_NAME);
  const cache = exists ? await caches.open(CACHE_NAME) : null;
  const present = cache ? await Promise.all(PRECACHE_URLS.map(async url => validResponse(await cache.match(url)))) : PRECACHE_URLS.map(() => false);
  const missing = PRECACHE_URLS.filter((_, index) => !present[index]).map(url => new URL(url).pathname.slice(SCOPE.pathname.length));
  return {
    type: 'OFFLINE_STATUS', ready: missing.length === 0,
    version: APP_VERSION, scope: SCOPE.href, total: PRECACHE_URLS.length,
    cached: PRECACHE_URLS.length - missing.length, missing
  };
}

async function repairOfflineCache() {
  const cache = await caches.open(CACHE_NAME);
  const missing = (await Promise.all(PRECACHE_URLS.map(async url => ({
    url, missing: !validResponse(await cache.match(url))
  })))).filter(item => item.missing).map(item => item.url);
  // Only missing static resources for this version are fetched. Successful existing
  // entries are untouched, even if a later repair request fails or the device is offline.
  await Promise.all(missing.map(async url => {
    try {
      await cache.put(url, await fetchOfflineAsset(url));
    } catch (_) { /* Status below reports any resources that are still missing. */ }
  }));
  return offlineStatus();
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const alreadyExisted = (await caches.keys()).includes(CACHE_NAME);
    const cache = await caches.open(CACHE_NAME);
    try {
      // Validate every fetch before writing anything. A bad status or an unexpected
      // redirect rejects the whole install without replacing an existing good cache.
      const resources = await Promise.all(PRECACHE_URLS.map(async url => [url, await fetchOfflineAsset(url)]));
      await Promise.all(resources.map(([url, response]) => cache.put(url, response)));
      const status = await offlineStatus();
      if (!status.ready) throw new Error('Offline resource verification failed.');
    } catch (error) {
      // Preserve a previously working cache if this script was reinstalled with the same version.
      if (!alreadyExisted) await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

function reply(event, message) {
  if (event.ports?.[0]) event.ports[0].postMessage(message);
  else event.source?.postMessage(message);
}

self.addEventListener('message', event => {
  if (event.data?.type === 'CHECK_OFFLINE_READY' || event.data?.type === 'REPAIR_OFFLINE_CACHE') {
    event.waitUntil((async () => {
      try { reply(event, await (event.data.type === 'REPAIR_OFFLINE_CACHE' ? repairOfflineCache() : offlineStatus())); }
      catch (_) { reply(event, { type: 'OFFLINE_STATUS', ready: false, version: APP_VERSION, scope: SCOPE.href, error: '无法检查离线资源，请联网后重试。' }); }
    })());
  } else if (event.data?.type === 'SKIP_WAITING') {
    // Only an explicit page request activates an update while existing clients are open.
    event.waitUntil(self.skipWaiting());
  }
});

function unavailable() {
  return new Response('离线资源尚未准备完整，请联网后重新打开元素小课堂。', {
    status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

async function cachedAsset(url) {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(url);
  if (validResponse(response)) return response;
  try {
    const fresh = await fetchOfflineAsset(url);
    try { await cache.put(url, fresh.clone()); } catch (_) { /* Return the usable response even if storage is full. */ }
    return fresh;
  } catch (_) { return unavailable(); }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.cache === 'no-store' || request.headers.has('Authorization') || request.headers.has('Range')) return;
  const url = canonicalURL(request.url);
  if (!withinScope(url) || url.username || url.password) return;
  const asset = ASSET_BY_URL.get(url.href);
  if (asset) {
    // Only allowlisted static assets ignore their query string; no request query or credentials are cached.
    event.respondWith(cachedAsset(asset));
    return;
  }
  if (request.mode === 'navigate' && request.destination === 'document') {
    // Unknown top-level routes can return the app shell offline. An unknown iframe URL must fail as itself.
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch (_) {
        const cache = await caches.open(CACHE_NAME);
        const shell = await cache.match(INDEX_URL);
        return validResponse(shell) ? shell : unavailable();
      }
    })());
  }
});
