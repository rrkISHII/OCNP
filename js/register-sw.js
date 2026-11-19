"use strict";

// ==========================================================
// Switches on the service worker (sw.js) so the site can load from
// the files saved on the visitor's phone. Used by index.html and main_page.html.
// ==========================================================

(function () {
  // Very old browsers have no service workers: the site just works without caching.
  if (!("serviceWorker" in navigator)) return;

  // Wait until the page has finished loading so this never slows the first draw.
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {
      // If it cannot start (for example, not on https), the site still works normally.
    });
  });
})();
