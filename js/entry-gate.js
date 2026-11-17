// ==========================================================
// Entry gate for main_page.html
// Every visit should pass through index.html once per tab, so the visitor
// always chooses location on / off first. A QR link (?from=<building>) is
// carried along. index.html adds loc=on|off when it sends the visitor back
// here, so this never loops.
// ==========================================================

(function () {
  try {
    // index.html already sent the visitor back with a choice (loc=on or loc=off): stay here.
    var mode = new URLSearchParams(window.location.search).get("loc");
    if (mode === "on" || mode === "off") return;

    // The choice was made earlier in this tab: stay here.
    if (sessionStorage.getItem("ocnpLoc")) return;

    // No choice yet: go to index.html, keeping any ?from=<building> from the QR code.
    window.location.replace("index.html" + window.location.search);
  } catch (e) {
    // If storage or the address cannot be read, just show the map.
  }
})();
