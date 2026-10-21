/* Service worker: lets the app open without a connection once it has been loaded.
   - On install it caches every file that index.html uses, plus the manifest and icons.
   - The start page is fetched from the network first (so updates arrive) and falls back to the cached copy offline.
   - Everything else is served from the cache and refreshed in the background. Requests ask the server to confirm the file
     (cache: "no-cache"), so the browser's HTTP cache cannot keep serving an outdated copy.
   The cache is named after the version (js/version.js): a new version starts a fresh cache and the old one is deleted. */
importScripts("js/version.js"); // defines APP_VERSION
const CACHE_NAME = "ccarf-" + APP_VERSION;
const EXTRA_FILES = ["manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

// All files that index.html loads, found by reading its src and href attributes
async function filesOfStartPage() {
  const response = await fetch("index.html", { cache: "reload" });
  const html = await response.text();
  const files = ["index.html"];
  const pattern = /(?:src|href)="([^"#]+)"/g;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const url = new URL(match[1], self.registration.scope);
    if (url.origin === self.location.origin) files.push(url.pathname.slice(new URL(self.registration.scope).pathname.length) + url.search);
  }
  return files;
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    filesOfStartPage().then(function (files) {
      return caches.open(CACHE_NAME).then(function (cache) {
        // no duplicates: addAll fails when the same file is listed twice
        // cache: "reload" skips the browser's own HTTP cache, so a new version never stores old copies of the files
        return cache.addAll(Array.from(new Set(files.concat(EXTRA_FILES))).map(function (file) {
          return new Request(file, { cache: "reload" });
        }));
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.filter(function (name) { return name !== CACHE_NAME; }).map(function (name) { return caches.delete(name); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request.url, { cache: "no-cache" }).then(function (response) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put("index.html", copy); });
        return response;
      }).catch(function () { return caches.match("index.html"); })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cached) {
      const refresh = fetch(request.url, { cache: "no-cache" }).then(function (response) {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      }).catch(function () { return cached; });
      return cached || refresh;
    })
  );
});
