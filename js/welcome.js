"use strict";

// ==========================================================
// Welcome page logic (index.html)
// ENTER opens a popup that asks about location. Whatever the visitor chooses,
// they are sent to main_page.html with loc=on or loc=off added to the address.
// ==========================================================
//
// Page elements.
const enterBtn = document.getElementById("enterBtn");
const locationModal = document.getElementById("locationModal");
const closeModalX = document.getElementById("closeModalX");
const noThanksBtn = document.getElementById("noThanksBtn");
const turnOnBtn = document.getElementById("turnOnBtn");
const locNote = document.getElementById("locNote");

// A QR code opens this page as index.html?from=<building>.
// Whatever the visitor chooses, that query is passed on to main_page.html untouched,
// plus loc=on / loc=off so the map knows which mode to start in.
//
// Only one choice per visit (stops a late GPS reply from overriding NO THANKS).
let decided = false;

// Opens the map page. mode is "on" (live location) or "off" (QR code location only).
function goToMap(mode) {
  if (decided) return;
  decided = true;
  const params = new URLSearchParams(window.location.search);
  params.set("loc", mode);
  try {
    sessionStorage.setItem("ocnpLoc", mode);
  } catch (e) {}
  window.location.href = "main_page.html?" + params.toString();
}

// Shows a message in the popup (used for location errors).
function showNote(message) {
  locNote.textContent = message;
  locNote.hidden = false;
}

// Changes the TURN ON button's text and whether it can be tapped.
function setTurnOn(label, disabled) {
  turnOnBtn.textContent = label;
  turnOnBtn.disabled = disabled;
}

// Shows the location popup in a clean state: no old message and the button ready.
function openPopup() {
  locNote.hidden = true;
  setTurnOn("TURN ON", false);
  locationModal.classList.add("active");
}

// ENTER opens the popup.
enterBtn.addEventListener("click", openPopup);

// Back button (page restored from cache): unlock the popup again.
window.addEventListener("pageshow", (e) => {
  if (e.persisted) {
    decided = false;
    setTurnOn("TURN ON", false);
  }
});

// Close the popup on X click.
closeModalX.addEventListener("click", () => {
  locationModal.classList.remove("active");
});

// Location OFF: go to the map. The ?from=<building> in the QR link is the starting point.
noThanksBtn.addEventListener("click", () => goToMap("off"));

// Location blocked or unsupported: say so, then carry on with the QR starting point after 2.5 seconds.
function continueWithoutLocation(message) {
  setTurnOn("CONTINUING…", true);
  showNote(message);
  setTimeout(() => goToMap("off"), 2500);
}

// Location ON: ask the browser for permission / GPS, then open the map in live-location mode.
turnOnBtn.addEventListener("click", () => {
  locNote.hidden = true;

  // This browser has no location support.
  if (!("geolocation" in navigator)) {
    continueWithoutLocation(
      "This browser does not support location. Continuing with the QR code location.",
    );
    return;
  }

  setTurnOn("LOCATING…", true);

  // Ask for one position now.
  navigator.geolocation.getCurrentPosition(
    // Success: GPS is on and permission is granted. main_page.js keeps tracking from here.
    () => {
      goToMap("on");
    },

    // Failure: work out why.
    (error) => {
      console.warn("Geolocation error:", error);

      // Permission blocked for this site in the browser settings.
      if (error.code === error.PERMISSION_DENIED) {
        continueWithoutLocation(
          "Location is blocked for this site in your browser settings. Continuing with the QR code location.",
        );
        return;
      }

      // GPS switched off or no signal yet: stay here so the visitor can fix it and try again.
      setTurnOn("TURN ON", false);
      showNote(
        "We couldn't get a location signal. Turn on Location / GPS in your phone's drop-down menu, then tap TURN ON again, or tap NO THANKS to continue with the QR code.",
      );
    },
    {
      // Settings: use the most accurate GPS, always get a fresh position, give up after 15 seconds.
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
  );
});
