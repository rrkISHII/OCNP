// Elements used on the welcome page
const enterBtn = document.getElementById("enterBtn");
const popup = document.getElementById("locationPopup");
const turnOnBtn = document.getElementById("turnOnBtn");
const keepOffBtn = document.getElementById("keepOffBtn");
const message = document.getElementById("locationMessage");

// If the visitor scanned a building QR code, the URL has ?from=BUILDING.
// That building becomes the starting point on the map.
const fromBuilding = new URLSearchParams(window.location.search).get("from");

// Builds the link to the map page and keeps the starting building
function goToMap(locationMode) {
  const params = new URLSearchParams();
  if (fromBuilding) params.set("from", fromBuilding);
  params.set("location", locationMode); // "on" or "off"
  window.location.href = "main_page.html?" + params.toString();
}

// Shows a message inside the popup
function showMessage(text) {
  message.textContent = text;
  message.hidden = false;
}

// ENTER opens the location popup
enterBtn.addEventListener("click", () => {
  popup.hidden = false;
  turnOnBtn.focus();
});

// Continue without location: the map starts from the QR building
keepOffBtn.addEventListener("click", () => goToMap("off"));

// TURN ON: ask the browser for the phone's location.
// The request is made directly inside the tap handler, because
// phones only show the permission prompt for a direct user tap.
turnOnBtn.addEventListener("click", () => {
  message.hidden = true;

  if (!("geolocation" in navigator)) {
    showMessage(
      "This browser does not support location. You can continue without it.",
    );
    return;
  }

  turnOnBtn.disabled = true;
  turnOnBtn.textContent = "Checking...";

  navigator.geolocation.getCurrentPosition(
    // Location allowed: continue with location on
    () => goToMap("on"),

    // Location blocked or failed: explain and let the user choose again
    (error) => {
      turnOnBtn.disabled = false;
      turnOnBtn.textContent = "TURN ON";

      if (error.code === error.PERMISSION_DENIED) {
        showMessage(
          "Location is blocked. Allow it in your browser's site settings, then try again.",
        );
      } else if (error.code === error.TIMEOUT) {
        showMessage(
          "Location took too long. Move to an open area and try again.",
        );
      } else {
        showMessage(
          "Could not get your location. Make sure GPS is on, then try again.",
        );
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
});
