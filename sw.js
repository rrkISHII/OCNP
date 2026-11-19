"use strict";

// ==========================================================
// Service worker for the Olivarez Navigation Portal
// Keeps a copy of the site's files on the visitor's phone, so repeat visits load
// from the phone instead of the internet. It also keeps the map tiles that were
// already viewed, so the map still draws on a weak signal.
//
// This file must stay in the project's main folder (next to index.html).
// It is switched on by js/register-sw.js.
// ==========================================================

// Names of the saved copies (caches). Each group can be refreshed on its own:
// change its number (for example "ocnp-images-v1" -> "ocnp-images-v2") and
// everyone downloads that group again on their next visit.
const CORE = "ocnp-core"; // pages, CSS and JS: refreshed quietly in the background
const LIBS = "ocnp-libs-v1"; // Leaflet, Font Awesome, fonts, emailjs (from the internet)
const IMAGES = "ocnp-images-v1"; // logo and building photos
const TILES = "ocnp-tiles-v1"; // map tiles

// Most files each group may keep. The oldest ones are dropped first.
const MAX_IMAGES = 120;
const MAX_TILES = 400;

// Files saved right after the first visit, so the whole app can open without internet.
// A file that does not exist is skipped without any error.
const PRECACHE = [
  "./",
  "index.html",
  "main_page.html",
  "css/welcome.css",
  "css/design.css",
  "js/welcome.js",
  "js/entry-gate.js",
  "js/register-sw.js",
  "js/campus-geojson.js",
  "js/building-directory.js",
  "js/main_page.js",
  "js/floor-plans.js",
];

// Websites whose files are saved the first time they load (they never change).
const LIB_HOSTS = [
  "unpkg.com",
  "cdn.jsdelivr.net",
  "cdnjs.cloudflare.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
];

const TILE_HOST = "tiles.stadiamaps.com";

// ----------------------------------------------------------
// Install: save the core files right away.
// "reload" skips the browser's own short-lived copy so the newest files are saved.
// ----------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CORE)
      .then((cache) =>
        Promise.all(
          PRECACHE.map((path) =>
            fetch(path, { cache: "reload" })
              .then((res) => (res.ok ? cache.put(path, res) : null))
              .catch(() => null),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

// ----------------------------------------------------------
// Activate: delete saved copies from older versions of this file,
// then start controlling the open pages straight away.
// ----------------------------------------------------------
self.addEventListener("activate", (event) => {
  const keep = [CORE, LIBS, IMAGES, TILES];
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n.startsWith("ocnp-") && !keep.includes(n))
            .map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ----------------------------------------------------------
// Fetch: decide, for every request, where the answer comes from.
// Anything not handled here (feedback emails, videos, other websites)
// goes to the internet exactly as before.
// ----------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only reading requests. Sending feedback (POST) is never touched.
  // Range requests (video / audio streaming) are left alone.
  if (req.method !== "GET" || req.headers.has("range")) return;

  const url = new URL(req.url);
  if (/\.(mp4|webm|mov|mp3|wav)$/i.test(url.pathname)) return;

  if (url.hostname === TILE_HOST) {
    event.respondWith(mapTile(req));
  } else if (url.origin === self.location.origin) {
    if (/\.(jpe?g|png|webp|gif|svg|ico)$/i.test(url.pathname)) {
      event.respondWith(cacheFirst(req, IMAGES, MAX_IMAGES));
    } else {
      event.respondWith(ownFile(event, req, url));
    }
  } else if (LIB_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(req, LIBS));
  }
});

// Pages, CSS and JS of this site: show the saved copy immediately, and fetch the
// newest copy in the background for the next visit. So a deployed change appears
// on the visit after next, with no version number to remember.
async function ownFile(event, req, url) {
  const cache = await caches.open(CORE);
  // The saved copy is stored without the "?from=..." part, so every QR link
  // (index.html?from=PARKING, ?from=ELO ...) uses the same saved page.
  const key = new Request(url.origin + url.pathname);
  const saved = await cache.match(key);

  const update = fetch(req).then((res) => {
    if (res.ok && res.type === "basic") cache.put(key, res.clone());
    return res;
  });

  if (saved) {
    event.waitUntil(update.catch(() => null));
    return saved;
  }

  try {
    return await update;
  } catch (err) {
    // No signal and nothing saved for this page: fall back to the welcome page.
    if (req.mode === "navigate") {
      const home = await cache.match(
        new Request(new URL("index.html", self.registration.scope)),
      );
      if (home) return home;
    }
    throw err;
  }
}

// Saved copy first, internet only if it was never saved.
// Used for libraries, fonts and photos, which do not change.
async function cacheFirst(req, cacheName, max) {
  const cache = await caches.open(cacheName);
  const saved = await cache.match(req);
  if (saved) return saved;

  const res = await fetch(req);
  if (res.ok || res.type === "opaque") {
    cache.put(req, res.clone());
    if (max) trim(cache, max);
  }
  return res;
}

// Map tiles: saved copy first. A new tile is first asked for in "cors" mode so it
// can be saved cheaply; if the tile server refuses, it is simply shown without saving.
async function mapTile(req) {
  const cache = await caches.open(TILES);
  const saved = await cache.match(req.url);
  if (saved) return saved;

  let res = null;
  try {
    res = await fetch(req.url, { mode: "cors" });
  } catch (err) {
    res = null;
  }
  if (!res || !res.ok) res = await fetch(req);

  if (res.ok) {
    cache.put(req.url, res.clone());
    trim(cache, MAX_TILES);
  }
  return res;
}

// Keep a group under its limit by dropping the oldest saved files.
async function trim(cache, max) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) {
    await cache.delete(keys[i]);
  }
}
