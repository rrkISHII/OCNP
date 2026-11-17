"use strict";

// ==========================================================
// Olivarez Navigation Portal - map page logic
// Runs after the three data files (campus-geojson.js, building-directory.js,
// floor-plans.js) and the Leaflet / emailjs libraries have loaded.
// ==========================================================
//
// ---- Settings ----
// Contact address: shown in About Us, and used if sending feedback by email app is needed.
const CONTACT_EMAIL = "dwightjustin.reyes@olivarezcollege.edu.ph";

// emailjs account details used to deliver the feedback form.
const EMAIL_CONFIG = {
  publicKey: "0tSUEPFUAl8ioeFNs",
  serviceId: "service_wdyvki8",
  templateId: "template_86k881g",
};

// Height of the collapsed bottom sheet, used only if the sheet cannot be measured.
const PEEK_FALLBACK_PX = 190;

// localStorage key that remembers light / dark mode.
const THEME_KEY = "ocnpTheme";

// Set to true to draw the walkway network on the map while testing routes.
const DEBUG_WALKWAYS = false;

// Walkway graph: points closer than this (metres) are merged into one node.
const NODE_M = 1.5;

// Walkway graph: how close (metres) a line must pass to another to count as a junction.
const JUNCTION_M = 1.5;

// How far (metres) a building door may be from a walkway and still connect to it.
const ENTRANCE_SNAP_M = 30;

// Walking speed in metres per second, used for the time estimate.
const WALK_SPEED_MS = 1.3;

// GPS fixes further than this from any walkway are not routed.
const MAX_OFF_NETWORK_M = 90;

// Worse GPS fixes are drawn on the map but not used as a starting point.
const GPS_MAX_ACCURACY_M = 50;

// A live route is re-planned after the walker moves this far (metres).
const ROUTE_REFRESH_M = 3;

// Within this distance (metres) of the destination counts as arrived.
const ARRIVE_M = 15;

// sessionStorage key for the starting point chosen earlier in this tab.
const ORIGIN_KEY = "ocnpOrigin";

// sessionStorage key that remembers the visitor turned live location off.
const GPS_OFF_KEY = "ocnpGpsOff";

// sessionStorage key for the location choice ("on" or "off") made on index.html.
const LOC_MODE_KEY = "ocnpLoc";

// Camera zoom level while the map follows the walker.
const FOLLOW_ZOOM = 19;

// While navigating, the position dot is pinned to the walkway if it is this close (metres).
const SNAP_DOT_M = 25;

// Start the emailjs library (skipped if the library failed to load).
if (window.emailjs) {
  emailjs.init(EMAIL_CONFIG.publicKey);
}

// ---- Helpers and page elements ----
// Short form of document.getElementById.
const $ = (id) => document.getElementById(id);

// Makes text safe to put inside HTML so names can never inject markup.
function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

// Side drawer (hamburger menu).
const menuToggle = $("menuToggle");
const closeDrawer = $("closeDrawer");
const sideDrawer = $("sideDrawer");
const navOverlay = $("navOverlay");

// Search bar and its dropdown of buildings.
const searchInput = $("searchInput");
const searchBtn = $("searchBtn");
const searchIcon = $("searchIcon");
const searchDropdown = $("searchDropdown");
const buildingsList = $("buildingsList");

// Bottom sheet that shows a building's details.
const bottomSheet = $("bottomSheet");
const bottomSheetOverlay = $("bottomSheetOverlay");
const sheetDragArea = $("sheetDragArea");
const sheetContent = $("sheetContent");
const sheetTitle = $("sheetTitle");
const sheetDescription = $("sheetDescription");
const sheetToggleBtn = $("sheetToggleBtn");
const closeSheetBtn = $("closeSheetBtn");
const goToDestinationBtn = $("goToDestinationBtn");
const sheetImgElements = [$("sheetImage1"), $("sheetImage2"), $("sheetImage3")];

// Walking time and distance badges inside the sheet.
const sheetTimeBadge = $("sheetTimeBadge");
const sheetTimeText = $("sheetTimeText");
const sheetDistanceBadge = $("sheetDistanceBadge");
const sheetDistanceText = $("sheetDistanceText");

// Popup windows.
const feedbackModal = $("feedbackModal");
const successModal = $("successModal");
const infoModal = $("infoModal");

// ---- Light / dark theme ----
// Reads the saved theme; returns null if storage is blocked or empty.
function loadSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (e) {
    return null;
  }
}

// Saves the theme; ignored if storage is blocked.
function saveTheme(value) {
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch (e) {}
}

// Start dark if it was saved, otherwise follow the phone's own setting.
let isDarkMode = (() => {
  const saved = loadSavedTheme();
  if (saved) return saved === "dark";
  return !!(
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
})();

// Apply the theme to the page.
document.body.classList.toggle("dark-theme", isDarkMode);

// ---- Map ----
// Create the Leaflet map, centred on the campus, with rotation by touch enabled.
const oc_map = L.map("oc_map", {
  zoomControl: false,
  rotate: true,
  touchRotate: true,
  shiftKeyRotate: true,
  dragRotate: true,
  bounceAtZoom: false,
  touchZoom: "center",
  rotateControl: {
    position: "topright",
    closeOnZeroBearing: true,
  },
}).setView([14.4788, 120.9964], 18);

// Make sure two-finger rotation is on.
if (oc_map.touchRotate) {
  oc_map.touchRotate.enable();
}

// Stop the browser's long-press menu from opening on the map.
$("oc_map").addEventListener("contextmenu", (e) => e.preventDefault());

// Tapping empty map closes the bottom sheet and the search dropdown.
oc_map.on("click", () => {
  if (currentSnapState !== "closed") {
    closeBottomSheet();
  }
  setDropdownOpen(false);
});

// Light map tiles.
const light_map = L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
  {
    minZoom: 0,
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
);

// Dark map tiles.
const dark_map = L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
  {
    minZoom: 0,
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
);

// Use the tile set that matches the current theme.
let currentTileLayer = isDarkMode ? dark_map : light_map;
currentTileLayer.addTo(oc_map);

// Live-location marker and its accuracy circle (created when GPS starts).
let userMarker = null;
let accuracyCircle = null;

// Every building taken from the geojson, and the label marker drawn for each.
const campusBuildings = [];
const buildingMarkers = [];

// True while building names are shown next to their icons.
let labelsVisible = false;

// ---- Popup windows ----
// Remembers which element opened each popup so focus can return to it on close.
const modalOpeners = new Map();

// Shows a popup and moves keyboard focus into it.
function openModal(modal, initialFocus) {
  const active = document.activeElement;
  modalOpeners.set(
    modal,
    active && active.closest && active.closest("#sideDrawer")
      ? menuToggle
      : active,
  );
  modal.classList.add("active");
  if (initialFocus) initialFocus.focus();
}

// Hides a popup and gives focus back to whatever opened it.
function closeModal(modal) {
  if (!modal.classList.contains("active")) return;
  modal.classList.remove("active");
  const opener = modalOpeners.get(modal);
  modalOpeners.delete(modal);
  if (
    opener &&
    document.contains(opener) &&
    typeof opener.focus === "function"
  ) {
    opener.focus();
  }
}

// Tapping the dark area around a popup closes it.
[feedbackModal, successModal, infoModal].forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal);
  });
});

// Keyboard: Escape closes the top-most layer (popup, drawer, sheet, then route);
// Tab is kept inside an open popup or drawer.
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.querySelector(".modal-overlay.active");
    if (modal) {
      closeModal(modal);
      return;
    }
    if (sideDrawer.classList.contains("active")) {
      closeMenu();
      return;
    }
    if (currentSnapState !== "closed") {
      closeBottomSheet(true);
      return;
    }
    if (routeState) {
      clearRoute();
      return;
    }
  }

  if (e.key === "Tab") {
    const layer =
      document.querySelector(".modal-overlay.active") ||
      (sideDrawer.classList.contains("active") ? sideDrawer : null);
    if (!layer) return;

    const focusable = layer.querySelectorAll(
      "button:not([disabled]), input, textarea, a[href]",
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// ---- Bottom sheet ----
// State: which building is open, whether the sheet is closed / peek / expanded,
// and the values used while the visitor drags it.
let activeBuildingData = null;
let currentSnapState = "closed";
let startY = 0;
let currentY = 0;
let initialTransformY = 0;
let isDragging = false;
let sheetOpener = null;

// Invisible element used to measure the phone's bottom safe area (home bar).
const safeAreaProbe = document.createElement("div");
safeAreaProbe.style.cssText =
  "position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none;";
document.body.appendChild(safeAreaProbe);

// The peek height is the real height of the drag area (handle, title, badges, button and safe area).
function getPeekHeight() {
  const measured = Math.ceil(sheetDragArea.getBoundingClientRect().height);
  return measured > 0
    ? measured
    : PEEK_FALLBACK_PX + safeAreaProbe.offsetHeight;
}

// How far down (px) the sheet sits when only the peek strip is showing.
function getPeekOffsetY() {
  return window.innerHeight - getPeekHeight();
}

// Moves the sheet to closed, peek or expanded and updates the page to match.
function snapToState(state) {
  currentSnapState = state;
  isDragging = false;
  bottomSheet.classList.remove("dragging");
  bottomSheet.style.transition = "";

  document.documentElement.style.setProperty(
    "--peek-height",
    getPeekHeight() + "px",
  );

  if (state === "expanded") {
    bottomSheet.style.transform = "translateY(0px)";
    bottomSheetOverlay.classList.add("active");
  } else if (state === "peek") {
    bottomSheet.style.transform = `translateY(${getPeekOffsetY()}px)`;
    bottomSheetOverlay.classList.remove("active");
  } else {
    bottomSheet.style.transform = "translateY(100%)";
    bottomSheetOverlay.classList.remove("active");
  }

  bottomSheet.inert = state === "closed";
  sheetContent.inert = state !== "expanded";

  sheetToggleBtn.setAttribute("aria-expanded", String(state === "expanded"));
  sheetToggleBtn.setAttribute(
    "aria-label",
    state === "expanded" ? "Collapse details" : "Expand details",
  );

  document.body.classList.remove("sheet-peek", "sheet-expanded");
  if (state !== "closed") document.body.classList.add("sheet-" + state);
}

// ==========================================================
// Building directory (floor-by-floor room lists in the bottom sheet)
// Data lives in js/building-directory.js.
// ==========================================================
//
// Finds which directory entry belongs to a building: by its id first, then by its title.
function getDirectoryKey(b) {
  if (!b) return null;
  if (b.id && BUILDING_DIRECTORY[b.id]) return b.id;
  const k = DIRECTORY_TITLE_TO_ID[String(b.title || "").toUpperCase()];
  return k && BUILDING_DIRECTORY[k] ? k : null;
}

// Counts the rooms in one floor / section, across all of its groups.
const sectionRoomCount = (sec) =>
  sec.groups.reduce((n, g) => n + g.rooms.length, 0);

// The container in the bottom sheet that holds the floor dropdowns.
const floorList = $("floorList");

// Builds one dropdown per floor / section for the opened building, listing its rooms.
// A room found through search is opened and highlighted (pendingRoomFocus).
function renderFloorList(data) {
  const key = getDirectoryKey(data);
  floorList.hidden = !key;
  floorList.textContent = "";
  if (!key) return;

  BUILDING_DIRECTORY[key].forEach((sec, si) => {
    const details = document.createElement("details");
    details.className = "floor-item";
    if (pendingRoomFocus && pendingRoomFocus.section === si)
      details.open = true;

    const summary = document.createElement("summary");
    summary.className = "floor-summary";
    const label = document.createElement("span");
    label.textContent = sec.label;
    const total = sectionRoomCount(sec);
    const count = document.createElement("span");
    count.className = "floor-count";
    count.textContent = total + (total === 1 ? " room" : " rooms");
    const chevron = document.createElement("i");
    chevron.className = "fa-solid fa-chevron-down floor-chevron";
    chevron.setAttribute("aria-hidden", "true");
    summary.append(label, count, chevron);

    const ul = document.createElement("ul");
    ul.className = "floor-rooms";
    sec.groups.forEach((grp) => {
      if (grp.label) {
        const head = document.createElement("li");
        head.className = "floor-group-label";
        head.textContent = grp.label;
        ul.appendChild(head);
      }
      grp.rooms.forEach(([num, name]) => {
        const li = document.createElement("li");
        if (
          pendingRoomFocus &&
          pendingRoomFocus.section === si &&
          pendingRoomFocus.num === num &&
          pendingRoomFocus.name === name
        )
          li.className = "room-hit";
        const numeric = /^\d+$/.test(num);
        if (num && (name || numeric)) {
          const badge = document.createElement("span");
          badge.className = "room-num";
          badge.textContent = num;
          li.appendChild(badge);
        }
        const txt = document.createElement("span");
        txt.className = "room-name" + (name || !num ? "" : " room-name-plain");
        txt.textContent = name || (numeric ? "Room " + num : num);
        if (!name && numeric) txt.classList.add("room-name-plain");
        li.appendChild(txt);
        ul.appendChild(li);
      });
    });

    details.append(summary, ul);
    floorList.appendChild(details);
  });
}

// ==========================================================
// Opening and closing the bottom sheet
// ==========================================================
//
// Fills the sheet with a building's name, description, photos and rooms, then shows it in peek mode.
function openBottomSheet(data) {
  sheetTitle.textContent = data.title || "Location Details";
  sheetDescription.textContent =
    data.description || "No description available.";
  activeBuildingData = data;
  refreshSheetActions();
  renderFloorList(data);

  if (!bottomSheet.contains(document.activeElement)) {
    sheetOpener = document.activeElement;
  }

  // Use the building's photo list (or a single photo), up to three images.
  const imageUrls = Array.isArray(data.imageUrls)
    ? data.imageUrls
    : data.imageUrl
      ? [data.imageUrl]
      : [];

  // Show a photo where there is one; otherwise show the grey placeholder.
  sheetImgElements.forEach((imgEl, idx) => {
    const placeholder = imgEl.parentElement.querySelector(
      ".sheet-placeholder-text",
    );

    if (imageUrls[idx]) {
      imgEl.src = imageUrls[idx];
      imgEl.alt = `${data.title || "Location"} photo ${idx + 1}`;
      imgEl.style.display = "block";
      if (placeholder) placeholder.style.display = "none";
    } else {
      imgEl.removeAttribute("src");
      imgEl.alt = "";
      imgEl.style.display = "none";
      if (placeholder) placeholder.style.display = "flex";
    }
  });

  sheetContent.scrollTop = 0;
  snapToState("peek");
  sheetTitle.focus({ preventScroll: true });
}

// Hides the sheet. restoreFocus = true returns keyboard focus to what opened it.
function closeBottomSheet(restoreFocus = false) {
  snapToState("closed");
  if (
    restoreFocus === true &&
    sheetOpener &&
    sheetOpener !== document.body &&
    document.contains(sheetOpener) &&
    typeof sheetOpener.focus === "function"
  ) {
    sheetOpener.focus();
  }
}

// ---- Dragging the sheet with a finger ----
// Finger down: start a drag if it began on the handle area, or the content is scrolled to the top.
function onTouchStart(e) {
  if (!(e.target.closest("#sheetDragArea") || sheetContent.scrollTop === 0))
    return;

  isDragging = true;
  startY = currentY = e.touches[0].clientY;

  if (currentSnapState === "expanded") {
    initialTransformY = 0;
  } else if (currentSnapState === "peek") {
    initialTransformY = getPeekOffsetY();
  } else {
    initialTransformY = window.innerHeight;
  }

  bottomSheet.classList.add("dragging");
  bottomSheet.style.transition = "none";
}

// Finger moving: the sheet follows it (never above the fully-open position).
function onTouchMove(e) {
  if (!isDragging) return;
  currentY = e.touches[0].clientY;
  const newTransformY = Math.max(0, initialTransformY + (currentY - startY));
  bottomSheet.style.transform = `translateY(${newTransformY}px)`;
}

// Finger up: snap to closed, peek or expanded depending on which way and how far it was dragged.
function onTouchEnd() {
  if (!isDragging) return;
  isDragging = false;

  const deltaY = currentY - startY;

  if (currentSnapState === "peek") {
    if (deltaY < -60) snapToState("expanded");
    else if (deltaY > 60) snapToState("closed");
    else snapToState("peek");
  } else if (currentSnapState === "expanded") {
    if (deltaY > 120) snapToState("closed");
    else if (deltaY > 50) snapToState("peek");
    else snapToState("expanded");
  } else {
    snapToState(deltaY < -100 ? "peek" : "closed");
  }
}

// Attach the drag handlers to the sheet.
bottomSheet.addEventListener("touchstart", onTouchStart, {
  passive: true,
});
bottomSheet.addEventListener("touchmove", onTouchMove, { passive: true });
bottomSheet.addEventListener("touchend", onTouchEnd);
bottomSheet.addEventListener("touchcancel", () => {
  if (isDragging) snapToState(currentSnapState);
});

// Keep the peek strip the right height when the screen size or orientation changes.
window.addEventListener("resize", () => {
  if (currentSnapState === "peek") snapToState("peek");
});

// Sheet buttons: tap the dark overlay or the close button to close, the arrow to expand / collapse.
bottomSheetOverlay.addEventListener("click", () => closeBottomSheet());
closeSheetBtn.addEventListener("click", () => closeBottomSheet(true));
sheetToggleBtn.addEventListener("click", () => {
  snapToState(currentSnapState === "expanded" ? "peek" : "expanded");
});

// ==========================================================
// Campus buildings drawn from the geojson
// ==========================================================
//
// Property names that describe a feature but are not its building name.
const NON_NAME_KEYS = ["entrances", "perimeter", "walkway"];

// Finds the property that holds a feature's name ("name", or the first property that is not a special key).
function getBuildingKey(props) {
  if (props.name) return "name";
  return Object.keys(props).find((k) => !NON_NAME_KEYS.includes(k)) || null;
}

// Chooses the map icon and colour for a building from its name (gym, hospital, parking, etc.).
function getBuildingIconInfo(buildingName) {
  let iconClass = "fa-solid fa-building";
  let iconColor = "#0B793D";

  if (buildingName.includes("GYM")) {
    iconClass = "fa-solid fa-dumbbell";
  } else if (
    buildingName.includes("HOSPITAL") ||
    buildingName.includes("EYE CENTER") ||
    buildingName.includes("CLINIC")
  ) {
    iconClass = "fa-solid fa-hospital";
    iconColor = "#d9534f";
  } else if (buildingName.includes("PARKING")) {
    iconClass = "fa-solid fa-square-parking";
    iconColor = "#2196F3";
  } else if (
    buildingName.includes("RESORT") ||
    buildingName.includes("BOTANICAL")
  ) {
    iconClass = "fa-solid fa-landmark";
    iconColor = "#0B793D";
  } else if (buildingName.includes("OLI'S DEN")) {
    iconClass = "fa-solid fa-utensils";
    iconColor = "#0B793D";
  } else if (buildingName.includes("CAFÉ")) {
    iconClass = "fa-solid fa-mug-saucer";
    iconColor = "#0B793D";
  } else if (buildingName.includes("TENNIS_COURT")) {
    iconClass = "fa-solid fa-table-tennis-paddle-ball";
    iconColor = "#0B793D";
  } else if (buildingName.includes("POOL_AREA")) {
    iconClass = "fa-solid fa-water-ladder";
    iconColor = "#0B793D";
  } else if (buildingName.includes("KITCHEN")) {
    iconClass = "fa-solid fa-kitchen-set";
    iconColor = "#0B793D";
  }

  return { iconClass, iconColor };
}

// Draws every feature from campus-geojson.js: buildings, the campus perimeter and (when debugging) walkways.
const geoLayer = L.geoJSON(geojsonData, {
  // Walkway lines are hidden unless DEBUG_WALKWAYS is on.
  filter: (feature) => DEBUG_WALKWAYS || !feature.properties.walkway,

  // Colours: perimeter = red dashes, walkway = grey dots, unnamed shapes = grey, parking = blue, buildings = green.
  style: function (feature) {
    const props = feature.properties;
    if (props.perimeter) {
      return {
        color: "#d9534f",
        weight: 3,
        dashArray: "5, 5",
        fill: false,
      };
    } else if (props.walkway) {
      return {
        color: "#8a8a8a",
        weight: 2,
        dashArray: "2 4",
        opacity: 0.8,
      };
    } else if (!getBuildingKey(props)) {
      return {
        color: "#8a8a8a",
        weight: 1,
        fillColor: "#8a8a8a",
        fillOpacity: 0.15,
      };
    } else if (props.PARKING) {
      return {
        color: "#2196F3",
        weight: 1.5,
        fillColor: "#2196F3",
        fillOpacity: 0.25,
      };
    }
    return {
      color: "#0B793D",
      weight: 1.5,
      fillColor: "#0B793D",
      fillOpacity: 0.2,
    };
  },

  // For each building: read its name, id, doors and photos, then register it for search and tapping.
  onEachFeature: function (feature, layer) {
    const props = feature.properties;
    if (props.perimeter || props.walkway || feature.geometry.type === "Point")
      return;

    const nameKey = getBuildingKey(props);
    if (!nameKey) return;

    let center = null;
    try {
      center = layer.getBounds().getCenter();
    } catch (e) {
      console.warn("Invalid bounds for feature.");
    }

    const buildingName = props.name || nameKey;
    const buildingId = props.name ? props.id || "" : props[nameKey] || "";

    // Entrances become doors. Entries starting with "car" are vehicle gates and are skipped.
    const doors = (props.entrances || [])
      .filter((e) => !/^car/i.test(e.name))
      .map((e) => ({
        name: e.name,
        latlng: L.latLng(e.coords[1], e.coords[0]),
      }));
    const entrances = doors.map((d) => d.latlng);

    // Everything the app needs to know about one building.
    const buildingObj = {
      title: buildingName,
      id: buildingId,
      description: props.description || `Building ID: ${buildingId}`,
      imageUrls: props.imageUrls || [],
      coords: center,
      doors,
      entrances: entrances.length ? entrances : center ? [center] : [],
      layer: layer,
    };

    campusBuildings.push(buildingObj);

    // Tapping a building (or its label) zooms to it and opens its bottom sheet.
    const handleBuildingClick = (e) => {
      if (e && e.originalEvent) {
        L.DomEvent.stopPropagation(e);
      }
      if (center) {
        oc_map.flyTo([center.lat, center.lng], 19, {
          animate: true,
          duration: 1.2,
        });
      }
      openBottomSheet(buildingObj);
    };

    // Make both the building shape and its label icon tappable.
    layer.on("click", handleBuildingClick);

    if (center) {
      const { iconClass, iconColor } = getBuildingIconInfo(buildingName);

      // Label marker: a round icon with the building name beside it (the name stays hidden until labels are switched on).
      const customIcon = L.divIcon({
        className: "map-label-marker",
        html: `<div class="map-label-pill" aria-hidden="true">
                             <div class="map-label-icon" style="color: ${iconColor};">
                                 <i class="${iconClass}"></i>
                             </div>
                             <span class="map-label-text hide-label">${escapeHtml(buildingName)}</span>
                         </div>`,
        iconSize: null,
        iconAnchor: [15, 15],
      });

      const marker = L.marker(center, { icon: customIcon }).addTo(oc_map);
      marker.getElement().setAttribute("aria-label", buildingName);
      marker.on("click", handleBuildingClick);
      buildingMarkers.push(marker);
    }
  },
}).addTo(oc_map);

// Alphabetical order for the search dropdown and the drawer list.
campusBuildings.sort((a, b) => a.title.localeCompare(b.title));

// ==========================================================
// Walkway graph and pathfinding
// The walkway lines in campus-geojson.js are turned into a graph of nodes and
// edges (in metres), and routes are found with Dijkstra's shortest-path algorithm.
// ==========================================================
//
// Degrees to metres, valid near the campus latitude (14.479 N). toM / toLL convert both ways.
const KX = 111320 * Math.cos((14.479 * Math.PI) / 180);
const KY = 110574;
const toM = (lng, lat) => [lng * KX, lat * KY];
const toLL = (p) => L.latLng(p[1] / KY, p[0] / KX);

// Closest point to p on the line segment a-b. Returns t (0-1 along the segment), d (distance) and p (the point).
function projectOnSeg(p, a, b) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    len2 = dx * dx + dy * dy;
  const t = len2
    ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2))
    : 0;
  const q = [a[0] + t * dx, a[1] + t * dy];
  return { t, d: Math.hypot(p[0] - q[0], p[1] - q[1]), p: q };
}

// The graph: node positions [x, y] in metres, adjacency lists, one edge per walkable segment, and which separate network piece each node belongs to.
const gNodes = [];
const gAdj = [];
const gEdges = [];
const gEdgeKeys = new Set();
let gComp = [];
let gMainComp = -1;

// Returns the node at point p, creating one if no existing node is within NODE_M.
function nodeFor(p) {
  for (let i = 0; i < gNodes.length; i++) {
    if (Math.hypot(gNodes[i][0] - p[0], gNodes[i][1] - p[1]) < NODE_M) return i;
  }
  gNodes.push(p);
  gAdj.push([]);
  return gNodes.length - 1;
}

// Connects two nodes in both directions, once, with the distance between them as its cost.
function addEdge(a, b) {
  if (a === b) return;
  const key = a < b ? `${a}-${b}` : `${b}-${a}`;
  if (gEdgeKeys.has(key)) return;
  gEdgeKeys.add(key);
  const w = Math.hypot(
    gNodes[a][0] - gNodes[b][0],
    gNodes[a][1] - gNodes[b][1],
  );
  gAdj[a].push({ to: b, w });
  gAdj[b].push({ to: a, w });
  gEdges.push({ a, b, w });
}

// Builds the graph from every walkway LineString. Where another walkway touches the middle of a
// segment, a junction node is added there so the two paths connect.
(function buildWalkGraph() {
  const lines = geojsonData.features
    .filter((f) => f.properties.walkway && f.geometry.type === "LineString")
    .map((f) => f.geometry.coordinates.map((c) => toM(c[0], c[1])));

  lines.forEach((pts, li) => {
    let prev = null;
    const visit = (p) => {
      const id = nodeFor(p);
      if (prev !== null) addEdge(prev, id);
      prev = id;
    };

    visit(pts[0]);
    for (let s = 0; s < pts.length - 1; s++) {
      const a = pts[s],
        b = pts[s + 1],
        extra = [];

      lines.forEach((other, lj) => {
        if (lj === li) return;
        other.forEach((v) => {
          const { t, d } = projectOnSeg(v, a, b);
          if (d < JUNCTION_M && t > 0.02 && t < 0.98) extra.push({ t, v });
        });
      });
      extra.sort((x, y) => x.t - y.t).forEach((e) => visit(e.v));
      visit(b);
    }
  });
})();

// Finds the separate pieces of the network; only the largest piece is used for routing, so a stray disconnected line cannot break a route.
(function labelComponents() {
  gComp = new Array(gNodes.length).fill(-1);
  const sizes = [];
  for (let s = 0; s < gNodes.length; s++) {
    if (gComp[s] !== -1) continue;
    const id = sizes.length;
    let size = 0;
    const stack = [s];
    gComp[s] = id;
    while (stack.length) {
      const u = stack.pop();
      size++;
      gAdj[u].forEach(({ to }) => {
        if (gComp[to] === -1) {
          gComp[to] = id;
          stack.push(to);
        }
      });
    }
    sizes.push(size);
  }
  gMainComp = sizes.indexOf(Math.max(...sizes));
  if (sizes.length > 1) {
    console.warn(
      `Walkway network has ${sizes.length} separate pieces; only the largest is used.`,
    );
  }
})();

// Nearest graph node to a point (within maxM metres), or null.
function nearestNode(latlng, maxM = ENTRANCE_SNAP_M) {
  const p = toM(latlng.lng, latlng.lat);
  let best = null;
  for (let i = 0; i < gNodes.length; i++) {
    if (gComp[i] !== gMainComp) continue;
    const d = Math.hypot(gNodes[i][0] - p[0], gNodes[i][1] - p[1]);
    if (d <= maxM && (!best || d < best.d)) best = { node: i, d };
  }
  return best;
}

// Nearest point ALONG any walkway segment to a point, or null if it is further than maxM.
function snapToNetwork(latlng, maxM) {
  const p = toM(latlng.lng, latlng.lat);
  let best = null;
  for (const e of gEdges) {
    if (gComp[e.a] !== gMainComp) continue;
    const { t, d, p: q } = projectOnSeg(p, gNodes[e.a], gNodes[e.b]);
    if (d <= maxM && (!best || d < best.d)) best = { edge: e, t, d, point: q };
  }
  return best;
}

// A "source" is where a route can start, a "target" where it can end.
// leg = metres from the real point to the walkway node; lead / tail = the line drawn to join them.
// A building door starts a route at its nearest walkway node.
function doorSource(latlng) {
  const hit = nearestNode(latlng);
  return hit ? { node: hit.node, leg: hit.d, lead: [latlng] } : null;
}

// A building door as the end of a route.
function doorTarget(latlng) {
  const hit = nearestNode(latlng);
  return hit ? { node: hit.node, leg: hit.d, tail: [latlng] } : null;
}

// A GPS fix is snapped to the nearest point ALONG a walkway, so a route can start mid-segment (two possible directions).
function gpsSources(latlng) {
  const snap = snapToNetwork(latlng, MAX_OFF_NETWORK_M);
  if (!snap) return null;
  const { edge, t, d, point } = snap;
  const lead = [latlng, toLL(point)];
  return [
    { node: edge.a, leg: d + t * edge.w, lead },
    { node: edge.b, leg: d + (1 - t) * edge.w, lead },
  ];
}

// Multi-source Dijkstra: finds the best (source, target) pair in one pass.
// Returns the path, its length and the start / end points, or null if nothing connects.
function planRoute(sources, targets) {
  const n = gNodes.length;
  const dist = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  const root = new Array(n).fill(-1);
  const done = new Array(n).fill(false);

  sources.forEach((s, i) => {
    if (s.leg < dist[s.node]) {
      dist[s.node] = s.leg;
      root[s.node] = i;
    }
  });

  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!done[i] && dist[i] < Infinity && (u === -1 || dist[i] < dist[u]))
        u = i;
    }
    if (u === -1) break;
    done[u] = true;
    for (const { to, w } of gAdj[u]) {
      if (dist[u] + w < dist[to]) {
        dist[to] = dist[u] + w;
        prev[to] = u;
        root[to] = root[u];
      }
    }
  }

  let best = null;
  targets.forEach((t) => {
    const total = dist[t.node] + t.leg;
    if (total < Infinity && (!best || total < best.total)) best = { t, total };
  });
  if (!best) return null;

  const nodes = [];
  for (let u = best.t.node; u !== -1; u = prev[u]) nodes.push(u);
  nodes.reverse();
  const src = sources[root[nodes[0]]];

  return {
    distance: best.total,
    path: [...src.lead, ...nodes.map((i) => toLL(gNodes[i])), ...best.t.tail],
    start: src.lead[0],
    snap: src.lead.length > 1 ? src.lead[src.lead.length - 1] : null,
    end: best.t.tail[best.t.tail.length - 1],
  };
}

// Plans a route from an origin to a destination building.
// origin is { source: 'qr' | 'manual', building, points } or { source: 'gps', latlng }.
// Returns { route } or { error } with a message for the visitor.
function computeRoute(origin, target) {
  let sources;
  if (origin.source === "gps") {
    sources = gpsSources(origin.latlng);
    if (!sources) {
      return {
        error:
          "You seem to be away from the campus walkways. Move closer, or scan the QR code at your building.",
      };
    }
  } else {
    sources = origin.points.map(doorSource).filter(Boolean);
    if (!sources.length)
      return {
        error: `Can't find a walkway near ${origin.building.title}.`,
      };
  }

  const targets = target.entrances.map(doorTarget).filter(Boolean);
  if (!targets.length)
    return { error: `Can't find a walkway near ${target.title}.` };

  const route = planRoute(sources, targets);
  if (!route) return { error: `No walkable path found to ${target.title}.` };

  // Like Google Maps: a walker close to a walkway is drawn ON it, and the line starts at the dot,
  // so the part already walked disappears behind them.
  if (origin.source === "gps" && route.snap) {
    const off = origin.latlng.distanceTo(route.snap);
    if (off <= SNAP_DOT_M) {
      route.path = route.path.slice(1);
      route.start = route.snap;
      route.dot = route.snap;
      route.distance = Math.max(0, route.distance - off);
    }
  }
  return { route };
}

// ==========================================================
// Route display: highlights, markers and state
// ==========================================================
//
// Highlight colours for the starting building (amber) and the destination (blue).
const STYLE_HERE = {
  color: "#f59e0b",
  weight: 3,
  fillColor: "#f59e0b",
  fillOpacity: 0.45,
};
const STYLE_DEST = {
  color: "#2563eb",
  weight: 3,
  fillColor: "#2563eb",
  fillOpacity: 0.35,
};

// Map markers.
// Google-Maps style "you are here": a blue dot plus a beam that points where the phone is facing.
// .gm-center / .gm-axis are invisible probes used to measure the map's rotation.
const USER_ICON = L.divIcon({
  className: "gm-user",
  html: '<div class="gm-beam"></div><div class="gm-dot"></div><i class="gm-center"></i><i class="gm-axis"></i>',
  iconSize: [64, 64],
  iconAnchor: [32, 32],
});

// Invisible marker 40 m north of the dot, used to find where north points on a rotated map.
const NORTH_REF_ICON = L.divIcon({
  className: "gm-ref",
  html: "",
  iconSize: [2, 2],
  iconAnchor: [1, 1],
});

// Pulsing marker on the building the route starts from.
const HERE_ICON = L.divIcon({
  className: "here-marker",
  html: "<span></span>",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// Chequered flag at the destination.
const END_ICON = L.divIcon({
  className: "route-end-marker",
  html: '<span><i class="fa-solid fa-flag-checkered" aria-hidden="true"></i></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Page elements for the route: the "starting from" chip, the trip card, screen-reader announcer, start button and toast.
const hereChip = $("hereChip");
const hereChipIcon = $("hereChipIcon");
const hereChipText = $("hereChipText");
const clearOriginBtn = $("clearOriginBtn");
const appHeader = $("appHeader");
const tripCard = $("tripCard");
const tripFromBtn = $("tripFromBtn");
const tripFromText = $("tripFromText");
const tripToBtn = $("tripToBtn");
const tripToText = $("tripToText");
const tripTime = $("tripTime");
const tripDist = $("tripDist");
const routeAnnouncer = $("routeAnnouncer");
const startHereBtn = $("startHereBtn");
const toastEl = $("toast");

// Route state.
let pinnedOrigin = null;
let hereMarker = null;
let routeLine = null;
let routeCasing = null;
let routeStartDot = null;
let routeEndMarker = null;
let routeTarget = null;
let routeState = null;
let pendingTarget = null;
let arrivedFor = null;
let toastTimer = null;
let navDot = null;
let locMode = null;
let lastOriginKind = null;

// Live GPS state: the watch id, the latest fix, whether to centre the map on the next fix,
// whether the visitor denied permission, and flags that keep error / weak-signal messages from repeating.
const gps = {
  watchId: null,
  fix: null,
  recenter: false,
  denied: false,
  lastErrorAt: 0,
  weakNotified: false,
};

// ---- Small helpers ----
// sessionStorage wrappers that never throw (storage can be blocked in private mode).
function storeGet(key) {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
function storeSet(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {}
}
function storeRemove(key) {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {}
}

// Shows a short message at the bottom of the screen for four seconds.
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 4000);
}

// Turns a distance in metres into whole metres and whole minutes of walking (at least 1).
function formatRoute(distance) {
  return {
    metres: Math.round(distance),
    minutes: Math.max(1, Math.round(distance / WALK_SPEED_MS / 60)),
  };
}

// True when there is a GPS fix accurate enough to start a route from.
function gpsIsUsable() {
  return !!(gps.fix && gps.fix.accuracy <= GPS_MAX_ACCURACY_M);
}

// True when the usable fix is close enough to a campus walkway to be routed.
function gpsOnCampus() {
  return gpsIsUsable() && !!snapToNetwork(gps.fix.latlng, MAX_OFF_NETWORK_M);
}

// Where does a new route start?
// 1. "Start from here" (manual) always wins.
// 2. Live location, once it is accurate and on the campus walkways.
// 3. Otherwise the building from the QR code, if there is one.
function getOrigin() {
  if (pinnedOrigin && pinnedOrigin.source === "manual") return pinnedOrigin;
  if (gpsOnCampus())
    return {
      source: "gps",
      latlng: gps.fix.latlng,
      accuracy: gps.fix.accuracy,
    };
  return pinnedOrigin;
}

// True when the route starts from a chosen building (QR code or "Start from here") rather than from live GPS.
function pinIsActive() {
  const o = getOrigin();
  return !!o && o.source !== "gps";
}

// Colours the starting building amber and the destination blue; everything else returns to its normal style.
function applyHighlights() {
  campusBuildings.forEach((b) => geoLayer.resetStyle(b.layer));
  const pin = pinIsActive();
  if (pin) pinnedOrigin.building.layer.setStyle(STYLE_HERE);
  if (routeTarget) routeTarget.layer.setStyle(STYLE_DEST);
  if (hereMarker) hereMarker.setOpacity(pin ? 1 : 0);
}

// Called whenever the fix changes: switches between "QR building" and "live location" and refreshes the screen.
function refreshOriginMode() {
  const o = getOrigin();
  const kind = o ? (o.source === "gps" ? "gps" : "pin") : null;
  if (kind === lastOriginKind) return;
  lastOriginKind = kind;
  applyHighlights();
  updateHereChip();
  refreshSheetActions();
}

// ---- Bottom sheet buttons ----
// The main button reads "Go to Destination", "Clear route" or (disabled) "You are here".
function updateDestinationBtn() {
  const b = activeBuildingData;
  let icon = "fa-location-arrow",
    label = "Go to Destination",
    disabled = false;
  if (b && pinIsActive() && pinnedOrigin.building === b) {
    icon = "fa-location-dot";
    label = "You are here";
    disabled = true;
  } else if (b && routeTarget === b) {
    icon = "fa-xmark";
    label = "Clear route";
  }
  goToDestinationBtn.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i> ${label}`;
  goToDestinationBtn.disabled = disabled;
}

// The "Start from here" button is hidden for the building you are already starting from.
function updateStartHereBtn() {
  const b = activeBuildingData;
  startHereBtn.hidden = !b || !!(pinIsActive() && pinnedOrigin.building === b);
}

// Time and distance badges only belong to the building the route leads to.
function updateSheetStats() {
  const show = !!(routeState && activeBuildingData === routeState.target);
  sheetTimeBadge.hidden = !show;
  sheetDistanceBadge.hidden = !show;
  if (show) {
    const { metres, minutes } = formatRoute(routeState.distance);
    sheetDistanceText.textContent = `${metres} m`;
    sheetTimeText.textContent = `${minutes} min`;
  }
}

// Re-measure the peek strip after its contents changed.
function refreshPeek() {
  if (currentSnapState === "peek") snapToState("peek");
}

// Refreshes every button and badge in the sheet in one call.
function refreshSheetActions() {
  updateDestinationBtn();
  updateStartHereBtn();
  updateSheetStats();
  refreshPeek();
}

// The small chip under the search bar: says where the route will start from (live location, a building, or still searching).
function updateHereChip() {
  let text = "",
    icon = "fa-location-dot",
    label = "",
    gpsMode = false;
  const o = getOrigin();
  if (o && o.source === "gps") {
    gpsMode = true;
    icon = "fa-location-crosshairs";
    text = `Using your location · ±${Math.round(gps.fix.accuracy)} m`;
    label = "Turn off location";
  } else if (pinnedOrigin) {
    text = `You are at ${pinnedOrigin.building.title}`;
    if (gps.watchId !== null)
      text += gps.fix
        ? " · waiting for a better GPS fix"
        : " · finding exact location…";
    label = "Clear starting point";
  } else if (gps.fix) {
    gpsMode = true;
    icon = "fa-location-crosshairs";
    const acc = Math.round(gps.fix.accuracy);
    text = gpsIsUsable()
      ? `Not on the campus walkways · ±${acc} m`
      : `Weak GPS signal · ±${acc} m`;
    label = "Turn off location";
  } else if (gps.watchId !== null) {
    gpsMode = true;
    icon = "fa-location-crosshairs";
    text = "Finding your location…";
    label = "Turn off location";
  }
  hereChip.hidden = !text || !!routeState;
  hereChip.classList.toggle("is-gps", gpsMode);
  hereChipIcon.className = `fa-solid ${icon}`;
  hereChipText.textContent = text;
  clearOriginBtn.setAttribute("aria-label", label || "Clear");
}

// ---- Trip card ----
// The search bar turns into a compact trip card (from / to / time) while a route is showing.
// Tidies door names: "entrance2" becomes "Entrance 2".
function doorLabel(name) {
  return String(name).replace(/^entrance\s*(\d+)$/i, "Entrance $1");
}

// Text for the "from" row of the trip card.
function fromLabel(origin) {
  if (origin.source === "gps") return "Your location";
  return origin.door
    ? `${origin.building.title} · ${doorLabel(origin.door.name)}`
    : origin.building.title;
}

// Fills in the from, to, time and distance rows.
function updateTripCard(origin, target, distance) {
  const { metres, minutes } = formatRoute(distance);
  tripFromText.textContent = fromLabel(origin);
  tripToText.textContent = target.title;
  tripTime.textContent = distance <= ARRIVE_M ? "Arrived" : `${minutes} min`;
  tripDist.textContent = `${metres} m`;
  tripCard.dataset.origin = origin.source === "gps" ? "gps" : "pin";
}

// Switches the header between the search bar and the trip card; keeps keyboard focus from being lost.
function setTripMode(on) {
  if (!on && tripCard.contains(document.activeElement)) {
    (currentSnapState !== "closed" ? sheetTitle : menuToggle).focus({
      preventScroll: true,
    });
  }
  appHeader.dataset.mode = on ? "trip" : "search";
  document.body.classList.toggle("trip-mode", on);
  if (on) setDropdownOpen(false);
}

// ---- Drawing and clearing the route ----
// Takes the route line, its white outline, the start dot and the flag off the map.
function removeRouteLayers() {
  [routeLine, routeCasing, routeStartDot, routeEndMarker].forEach((layer) => {
    if (layer) oc_map.removeLayer(layer);
  });
  routeLine = routeCasing = routeStartDot = routeEndMarker = null;
}

// Cancels the current route and puts the screen back to normal.
function clearRoute() {
  removeRouteLayers();
  routeTarget = null;
  routeState = null;
  pendingTarget = null;
  arrivedFor = null;
  navDot = null;
  setTripMode(false);
  stopFollow();
  follow.dismissed = false;
  if (gps.fix) drawUserMarker();
  updateHereChip();
  applyHighlights();
  refreshSheetActions();
}

// Zooms the map so the whole route is visible between the trip card and the bottom sheet.
function fitRoute() {
  if (!routeLine) return;
  const bottom = currentSnapState === "closed" ? 40 : getPeekHeight() + 40;
  const cardHeight =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--trip-height",
      ),
    ) || 104;
  const top =
    (parseFloat(getComputedStyle(appHeader).top) || 12) + cardHeight + 16;
  oc_map.fitBounds(routeLine.getBounds(), {
    paddingTopLeft: [40, top],
    paddingBottomRight: [40, bottom],
    maxZoom: 20,
  });
}

// Draws a route on the map. When walking with live GPS the existing line is only moved
// (no flicker); otherwise it is redrawn. fit = true also zooms to show the whole route.
function drawRoute(route, origin, target, fit) {
  const prev = routeState && routeState.target === target ? routeState : null;
  const began =
    prev && prev.began
      ? prev.began
      : origin.source === "gps"
        ? origin.latlng
        : null;
  const inPlace =
    !fit &&
    routeLine &&
    origin.source === "gps" &&
    prev &&
    prev.originSource === "gps";

  // Live navigation: just move the line, no flicker.
  if (inPlace) {
    routeCasing.setLatLngs(route.path);
    routeLine.setLatLngs(route.path);
    routeEndMarker.setLatLng(route.end);
  } else {
    removeRouteLayers();
    routeCasing = L.polyline(route.path, {
      color: "#ffffff",
      weight: 10,
      opacity: 0.9,
      lineCap: "round",
      lineJoin: "round",
      interactive: false,
    }).addTo(oc_map);
    routeLine = L.polyline(route.path, {
      color: "#0B793D",
      weight: 3,
      opacity: 1,
      lineCap: "round",
      lineJoin: "round",
      interactive: false,
    }).addTo(oc_map);
    if (origin.source !== "gps") {
      routeStartDot = L.circleMarker(route.start, {
        radius: 6,
        color: "#0B793D",
        weight: 3,
        fillColor: "#ffffff",
        fillOpacity: 1,
        interactive: false,
      }).addTo(oc_map);
    }
    routeEndMarker = L.marker(route.end, {
      icon: END_ICON,
      interactive: false,
      keyboard: false,
    }).addTo(oc_map);
  }

  navDot = origin.source === "gps" ? route.dot || origin.latlng : null;
  routeTarget = target;
  routeState = {
    target,
    originSource: origin.source,
    from: origin.source === "gps" ? origin.latlng : null,
    began,
    distance: route.distance,
  };

  updateTripCard(origin, target, route.distance);
  setTripMode(true);
  updateHereChip();

  applyHighlights();
  refreshSheetActions();
  if (fit) {
    const { metres, minutes } = formatRoute(route.distance);
    routeAnnouncer.textContent = `Route to ${target.title}: ${metres} metres, about ${minutes} minute${minutes === 1 ? "" : "s"} on foot.`;
    fitRoute();
  }
}

// Shows an "arrived" message once the walker is within ARRIVE_M of the destination.
function checkArrival(route, target) {
  if (route.distance <= ARRIVE_M && arrivedFor !== target) {
    arrivedFor = target;
    showToast(`You have arrived at ${target.title}.`);
    stopFollow();
  }
}

// Why there is no starting point yet, and what to do about it: start finding the location,
// wait for a better fix, or tell the visitor to scan a QR code / tap "Start from here".
function needOrigin(target) {
  gps.weakNotified = false;
  if (
    gps.watchId === null &&
    locMode !== "off" &&
    !gps.denied &&
    locationSupported(true)
  ) {
    pendingTarget = target;
    showToast("Finding your location…");
    startLocation({ recenter: false });
  } else if (gps.watchId !== null && !gps.fix) {
    pendingTarget = target;
    showToast("Still finding your location…");
  } else if (gps.fix) {
    pendingTarget = target;
    showToast(
      gpsIsUsable()
        ? "You seem to be away from the campus walkways. Scan a QR code, or tap “Start from here” on your building."
        : `GPS signal is weak (±${Math.round(gps.fix.accuracy)} m). Waiting for a better fix, or scan a QR code / tap “Start from here”.`,
    );
  } else {
    showToast(
      "Scan a QR code, or tap “Start from here” on your building, to get directions.",
    );
  }
  return false;
}

// Starts a route to a building from the current origin. Returns true if a route was drawn.
function routeTo(target) {
  const origin = getOrigin();
  if (!origin) return needOrigin(target);
  if (origin.building === target) {
    showToast("You are already here.");
    return false;
  }

  const result = computeRoute(origin, target);
  if (result.error) {
    showToast(result.error);
    return false;
  }

  arrivedFor = null;
  drawRoute(result.route, origin, target, true);
  checkArrival(result.route, target);
  return true;
}

// ---- Route buttons ----
// "Go to Destination" in the sheet: start the route, or clear it if it is already showing.
// (The tap also unlocks the compass on iPhones.)
goToDestinationBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  enableCompass();
  const target = activeBuildingData;
  if (!target) return;
  if (routeTarget === target) {
    clearRoute();
    return;
  }
  routeTo(target);
});

// Back arrow on the trip card ends the route.
$("tripBackBtn").addEventListener("click", clearRoute);

// Tap the destination row to bring its details back; tap the start row to look at where you start.
tripToBtn.addEventListener("click", () => {
  if (!routeTarget) return;
  if (routeTarget.coords)
    oc_map.flyTo([routeTarget.coords.lat, routeTarget.coords.lng], 19, {
      animate: true,
      duration: 1,
    });
  openBottomSheet(routeTarget);
});

tripFromBtn.addEventListener("click", () => {
  if (!routeState) return;
  const at =
    routeState.originSource === "gps"
      ? gps.fix && gps.fix.latlng
      : pinnedOrigin &&
        (pinnedOrigin.door
          ? pinnedOrigin.door.latlng
          : pinnedOrigin.building.coords);
  if (at) oc_map.flyTo([at.lat, at.lng], 19, { animate: true, duration: 1 });
});

// ==========================================================
// Starting point from a QR code or "Start from here" (location off)
// A QR code opens the page as ?from=<building>&door=<entrance>.
// ==========================================================
//
// Lower-case text with accents, spaces and punctuation removed, so names compare loosely.
function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

// Finds a building by its title or id.
function findBuilding(raw) {
  const wanted = normalizeKey(raw);
  if (!wanted) return null;
  return (
    campusBuildings.find(
      (b) => normalizeKey(b.title) === wanted || normalizeKey(b.id) === wanted,
    ) || null
  );
}

// Finds an entrance by name or number: "2", "entrance2" and "Entrance 2" all mean the second door.
function findDoorIndex(building, raw) {
  if (!raw) return -1;
  const key = normalizeKey(raw);
  const byName = building.doors.findIndex((d) => normalizeKey(d.name) === key);
  if (byName >= 0) return byName;
  const n = parseInt(key.replace(/^entrance/, ""), 10);
  return Number.isInteger(n) && n >= 1 && n <= building.doors.length
    ? n - 1
    : -1;
}

// Sets the starting building (and optionally a specific door), marks it on the map and remembers it for this tab.
function setPinnedOrigin(
  building,
  { source = "manual", doorIndex = -1, fly = true } = {},
) {
  clearRoute();
  pendingTarget = null;

  const door = doorIndex >= 0 ? building.doors[doorIndex] : null;
  pinnedOrigin = {
    source,
    building,
    door,
    points: door ? [door.latlng] : building.entrances,
  };

  if (hereMarker) oc_map.removeLayer(hereMarker);
  hereMarker = null;
  const at = door ? door.latlng : building.coords;
  if (at) {
    hereMarker = L.marker(at, {
      interactive: false,
      keyboard: false,
      zIndexOffset: -1000,
      icon: HERE_ICON,
    }).addTo(oc_map);
    if (fly)
      oc_map.flyTo([at.lat, at.lng], 19, {
        animate: true,
        duration: 1.2,
      });
  }

  storeSet(
    ORIGIN_KEY,
    JSON.stringify({
      key: building.id || building.title,
      door: door ? door.name : null,
      source,
    }),
  );
  updateHereChip();
  applyHighlights();
  refreshSheetActions();
}

// Removes the ?from=... part of the address so a refresh does not override a later choice.
function stripOriginFromUrl() {
  try {
    if (window.location.search) {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.hash,
      );
    }
  } catch (e) {}
}

// Forgets the chosen starting building.
function clearPinnedOrigin() {
  pinnedOrigin = null;
  if (hereMarker) oc_map.removeLayer(hereMarker);
  hereMarker = null;
  storeRemove(ORIGIN_KEY);
  stripOriginFromUrl();
  clearRoute();
  updateHereChip();
  applyHighlights();
  refreshSheetActions();
}

// The X on the "starting from" chip clears the starting building, or turns live location off.
clearOriginBtn.addEventListener("click", () => {
  const o = getOrigin();
  if (o && o.source !== "gps") clearPinnedOrigin();
  else if (gps.watchId !== null) stopLocation();
  else if (pinnedOrigin) clearPinnedOrigin();
});

// "Start from here" in the sheet: use the opened building as the starting point.
startHereBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const b = activeBuildingData;
  if (!b) return;
  setPinnedOrigin(b, { source: "manual", fly: false });
  showToast(`Starting point set to ${b.title}. Now pick where you want to go.`);
});

// ==========================================================
// Live location (location on)
// ==========================================================
//
// Checks the browser can give a location (it needs https). announce = also tell the visitor why not.
function locationSupported(announce) {
  if (!("geolocation" in navigator)) {
    if (announce) showToast("This browser does not support location.");
    return false;
  }
  if (window.isSecureContext === false) {
    if (announce) showToast("Location only works on a secure (https) page.");
    return false;
  }
  return true;
}

// Camera-follow state: whether the map is following the walker, and whether the visitor dragged it away.
const follow = { on: false, dismissed: false, flyUntil: 0 };

// Compass state: the smoothed bearing, the angle given to the CSS, and how the compass events are hooked up.
const heading = {
  value: null,
  target: null,
  ui: 0,
  offset: 0,
  raf: 0,
  lastCompassAt: 0,
  listening: false,
  evt: null,
  tapHooked: false,
};

// northRef = the invisible north marker; moveAnim / measureRaf = running animation frames.
let northRef = null;
let moveAnim = 0;
let measureRaf = 0;

// Shortest signed difference between two compass angles, in degrees (-180 to 180).
function angleDiff(a, b) {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

// A point 40 m due north of ll.
function northOf(ll) {
  return L.latLng(ll.lat + 40 / KY, ll.lng);
}

// Where the dot is drawn: pinned to the walkway while navigating, otherwise the raw GPS fix.
function userDisplayLatLng() {
  return routeState && routeState.originSource === "gps" && navDot
    ? navDot
    : gps.fix.latlng;
}

// Puts the dot (and the north reference) at a position.
function placeUser(ll) {
  userMarker.setLatLng(ll);
  if (northRef) northRef.setLatLng(northOf(ll));
}

// Glide from one fix to the next instead of jumping, so the dot walks with the person.
function moveUserMarker(to) {
  cancelAnimationFrame(moveAnim);
  const from = userMarker.getLatLng();
  const dist = from.distanceTo(to);
  if (dist < 0.2 || dist > 80) {
    placeUser(to);
    scheduleMeasure();
    return;
  }
  const t0 = performance.now();
  const dur = 900;
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    placeUser(
      L.latLng(
        from.lat + (to.lat - from.lat) * k,
        from.lng + (to.lng - from.lng) * k,
      ),
    );
    if (k < 1) moveAnim = requestAnimationFrame(step);
    else scheduleMeasure();
  };
  moveAnim = requestAnimationFrame(step);
}

// Creates or updates the blue dot, the north reference and the accuracy circle for the latest fix.
function drawUserMarker() {
  if (!gps.fix) return;
  const at = userDisplayLatLng();
  const radius = Math.min(gps.fix.accuracy, 150);
  if (!userMarker) {
    userMarker = L.marker(at, {
      icon: USER_ICON,
      interactive: false,
      keyboard: false,
      zIndexOffset: 900,
    }).addTo(oc_map);
    northRef = L.marker(northOf(at), {
      icon: NORTH_REF_ICON,
      interactive: false,
      keyboard: false,
      zIndexOffset: -2000,
    }).addTo(oc_map);
    accuracyCircle = L.circle(gps.fix.latlng, {
      radius,
      color: "#4285f4",
      weight: 1,
      fillColor: "#4285f4",
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(oc_map);
  } else {
    moveUserMarker(at);
    accuracyCircle.setLatLng(gps.fix.latlng);
    accuracyCircle.setRadius(radius);
  }
  followCamera(at);
  scheduleMeasure();
}

// Removes the blue dot, north reference and accuracy circle (when location is turned off).
function removeUserMarker() {
  cancelAnimationFrame(moveAnim);
  if (userMarker) oc_map.removeLayer(userMarker);
  if (northRef) oc_map.removeLayer(northRef);
  if (accuracyCircle) oc_map.removeLayer(accuracyCircle);
  userMarker = northRef = accuracyCircle = null;
}

// ---- Direction beam (compass) ----
// Screen angles are measured from the DOM, so the beam is right whether or not the
// rotate plugin turns marker icons with the map.
// Works out how the map is rotated by comparing the on-screen positions of the dot,
// its axis probe and the north reference marker.
function measureNorth() {
  measureRaf = 0;
  if (!userMarker || !northRef) return;
  const el = userMarker.getElement();
  const ref = northRef.getElement();
  if (!el || !ref) return;
  const c = el.querySelector(".gm-center");
  const a = el.querySelector(".gm-axis");
  if (!c || !a) return;
  const mid = (node) => {
    const r = node.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };
  const [cx, cy] = mid(c);
  const [ax, ay] = mid(a);
  const [nx, ny] = mid(ref);
  const psi = (Math.atan2(ax - cx, -(ay - cy)) * 180) / Math.PI;
  const phi = (Math.atan2(nx - cx, -(ny - cy)) * 180) / Math.PI;
  if (isFinite(psi) && isFinite(phi)) heading.offset = phi - psi;
  renderBeam();
}

// Measures once per animation frame, however many times it is requested.
function scheduleMeasure() {
  if (!measureRaf) measureRaf = requestAnimationFrame(measureNorth);
}

// Rotates the beam to the phone's heading plus the map rotation (taking the short way round).
function renderBeam() {
  if (heading.value === null || !userMarker) return;
  const el = userMarker.getElement();
  if (!el) return;
  heading.ui += angleDiff(heading.value + heading.offset, heading.ui);
  el.style.setProperty("--gm-heading", heading.ui.toFixed(1) + "deg");
  el.classList.add("has-heading");
}

// Smooths the compass: each update moves the beam 35% of the way to the newest reading.
function applyHeading() {
  heading.raf = 0;
  if (heading.value === null) heading.value = heading.target;
  else
    heading.value =
      (heading.value + angleDiff(heading.target, heading.value) * 0.35 + 360) %
      360;
  renderBeam();
}

// Receives a heading from the compass or the GPS. The compass is better while it works, so GPS headings are ignored for 3 seconds after one.
function feedHeading(deg, source) {
  const now = Date.now();
  if (source === "compass") heading.lastCompassAt = now;
  else if (now - heading.lastCompassAt < 3000) return;
  heading.target = ((deg % 360) + 360) % 360;
  if (!heading.raf) heading.raf = requestAnimationFrame(applyHeading);
}

// Compass bearing of the direction the phone is facing, corrected for tilt (W3C method).
function tiltCompassHeading(alpha, beta, gamma) {
  const r = Math.PI / 180;
  const cA = Math.cos(alpha * r),
    sA = Math.sin(alpha * r),
    sB = Math.sin(beta * r),
    cB = Math.cos(beta * r),
    cG = Math.cos(gamma * r),
    sG = Math.sin(gamma * r);
  const rA = -cA * sG - sA * sB * cG;
  const rB = -sA * sG + cA * sB * cG;
  if (Math.abs(rA) < 1e-6 && Math.abs(rB) < 1e-6) return (360 - alpha) % 360;
  return ((Math.atan2(rA, rB) * 180) / Math.PI + 360) % 360;
}

// Handles a device-orientation event and converts it to a compass heading (clockwise from north).
function onOrientation(e) {
  let h = null;
  if (
    typeof e.webkitCompassHeading === "number" &&
    !isNaN(e.webkitCompassHeading)
  ) {
    h = e.webkitCompassHeading;
  } else if (
    typeof e.alpha === "number" &&
    (e.absolute || e.type === "deviceorientationabsolute")
  ) {
    h =
      typeof e.beta === "number" && typeof e.gamma === "number"
        ? tiltCompassHeading(e.alpha, e.beta, e.gamma)
        : (360 - e.alpha) % 360;
  }
  if (h === null) return;
  const screenAngle = (screen.orientation && screen.orientation.angle) || 0;
  feedHeading(h + screenAngle, "compass");
}

// Starts listening to the compass. iPhones only allow this from a tap, so it is also called from button clicks.
function enableCompass() {
  if (heading.listening || !window.DeviceOrientationEvent) return;
  const evt =
    "ondeviceorientationabsolute" in window
      ? "deviceorientationabsolute"
      : "deviceorientation";
  const start = () => {
    if (heading.listening) return;
    heading.listening = true;
    heading.evt = evt;
    window.addEventListener(evt, onOrientation, true);
  };
  const DOE = window.DeviceOrientationEvent;
  if (typeof DOE.requestPermission === "function") {
    DOE.requestPermission()
      .then((state) => {
        if (state === "granted") start();
      })
      .catch(() => {});
  } else {
    start();
  }
}

// Stops listening to the compass and clears the beam.
function stopCompass() {
  if (heading.listening && heading.evt)
    window.removeEventListener(heading.evt, onOrientation, true);
  heading.listening = false;
  heading.value = heading.target = null;
  heading.ui = 0;
}

// Re-measure the beam angle whenever the map moves, zooms or rotates.
oc_map.on("move zoom rotate", scheduleMeasure);

// ---- Camera follows the walker while navigating ----
// Lights up the "my location" button while the camera is following.
function updateLocBtn() {
  const btn = $("myLocationBtn");
  btn.classList.toggle("active", follow.on);
  btn.setAttribute("aria-pressed", String(follow.on));
  btn.title = follow.on ? "Following your location" : "Go to my location";
}

// Flies to the walker and keeps the camera on them.
function startFollow() {
  if (!gps.fix) return;
  follow.on = true;
  follow.dismissed = false;
  follow.flyUntil = Date.now() + 900;
  updateLocBtn();
  oc_map.flyTo(userDisplayLatLng(), Math.max(oc_map.getZoom(), FOLLOW_ZOOM), {
    animate: true,
    duration: 0.8,
  });
}

// Stops the camera from following.
function stopFollow() {
  if (!follow.on) return;
  follow.on = false;
  updateLocBtn();
}

// Pans the map to keep up with the walker (not during the fly-in).
function followCamera(at) {
  if (!follow.on || Date.now() < follow.flyUntil) return;
  oc_map.panTo(at, {
    animate: true,
    duration: 0.9,
    easeLinearity: 1,
    noMoveStart: true,
  });
}

// Dragging the map by hand lets go of the walker (tap the crosshair to follow again).
oc_map.on("dragstart", () => {
  if (follow.on) {
    stopFollow();
    follow.dismissed = true;
  }
});

// Once the walker actually starts moving (4 m), switch from the route overview to following them.
function autoFollow(at) {
  if (follow.on || follow.dismissed || !routeState || !routeState.began) return;
  if (routeState.began.distanceTo(at) >= 4) startFollow();
}

// Keep an active route in step with the walker: the line shrinks as they walk. QR / manual routes are fixed.
function maybeReroute() {
  if (!routeState) return;
  const origin = getOrigin();
  if (!origin || origin.source !== "gps") return;
  const switching = routeState.originSource !== "gps";
  if (
    !switching &&
    routeState.from &&
    routeState.from.distanceTo(origin.latlng) < ROUTE_REFRESH_M
  )
    return;

  const target = routeState.target;
  const result = computeRoute(origin, target);
  if (result.error) return;
  drawRoute(result.route, origin, target, false);
  checkArrival(result.route, target);
  autoFollow(origin.latlng);
}

// A new GPS position arrived: store it, update the origin, run any waiting route, and move the dot.
function onGpsFix(position) {
  const c = position.coords;
  gps.fix = {
    latlng: L.latLng(c.latitude, c.longitude),
    accuracy: c.accuracy || 9999,
    time: Date.now(),
  };
  if (typeof c.heading === "number" && !isNaN(c.heading) && c.speed > 0.8)
    feedHeading(c.heading, "gps");

  refreshOriginMode();

  if (gps.recenter) {
    gps.recenter = false;
    if (gpsOnCampus() || !pinnedOrigin)
      oc_map.flyTo(gps.fix.latlng, Math.max(oc_map.getZoom(), 18), {
        animate: true,
        duration: 1.2,
      });
  }

  if (pendingTarget && getOrigin()) {
    const target = pendingTarget;
    pendingTarget = null;
    routeTo(target);
  } else if (pendingTarget && !gpsIsUsable() && !gps.weakNotified) {
    gps.weakNotified = true;
    showToast(
      `GPS signal is weak (±${Math.round(gps.fix.accuracy)} m). Waiting for a better fix, or scan a QR code / tap “Start from here”.`,
    );
  } else {
    maybeReroute();
  }

  drawUserMarker();
  updateHereChip();
}

// GPS problem: permission denied turns location off for good; other errors show a message (at most once every 15 seconds).
function onGpsError(error) {
  if (error.code === error.PERMISSION_DENIED) {
    gps.denied = true;
    stopLocation({ remember: false });
    locMode = "off";
    storeSet(LOC_MODE_KEY, "off");
    showToast(
      "Location is blocked for this site. Allow it in your browser settings, or scan a QR code instead.",
    );
    return;
  }
  const now = Date.now();
  if (now - gps.lastErrorAt < 15000) return;
  gps.lastErrorAt = now;
  showToast(
    error.code === error.POSITION_UNAVAILABLE
      ? "No location signal. Turn on Location / GPS on your device."
      : "Still looking for your location…",
  );
}

// Turns live location on: starts the compass and watches the GPS position. recenter = fly to the first fix.
function startLocation({ recenter = false } = {}) {
  if (!locationSupported(true) || gps.watchId !== null) return;
  gps.denied = false;
  gps.recenter = recenter;
  locMode = "on";
  storeSet(LOC_MODE_KEY, "on");
  storeRemove(GPS_OFF_KEY);
  enableCompass();
  if (!heading.tapHooked) {
    heading.tapHooked = true;
    document.addEventListener("click", enableCompass);
  }
  gps.watchId = navigator.geolocation.watchPosition(onGpsFix, onGpsError, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 20000,
  });
  updateHereChip();
}

// Turns live location off and removes everything it drew. remember = keep it off for the rest of this tab.
function stopLocation({ remember = true } = {}) {
  if (gps.watchId !== null) navigator.geolocation.clearWatch(gps.watchId);
  gps.watchId = null;
  gps.fix = null;
  gps.recenter = false;
  pendingTarget = null;
  navDot = null;
  stopFollow();
  stopCompass();
  removeUserMarker();
  if (routeState && routeState.originSource === "gps") clearRoute();
  if (remember) {
    locMode = "off";
    storeSet(LOC_MODE_KEY, "off");
    storeSet(GPS_OFF_KEY, "1");
  }
  refreshOriginMode();
  updateHereChip();
}

// The crosshair button: start location, follow the walker, or fly to the current fix.
$("myLocationBtn").addEventListener("click", () => {
  enableCompass();
  if (gps.watchId === null) {
    startLocation({ recenter: true });
    return;
  }
  if (!gps.fix) {
    showToast("Still finding your location…");
    return;
  }
  if (routeState && routeState.originSource === "gps") {
    startFollow();
    return;
  }
  oc_map.flyTo(gps.fix.latlng, Math.max(oc_map.getZoom(), 18), {
    animate: true,
    duration: 1,
  });
  if (pinnedOrigin && pinnedOrigin.source === "manual") {
    showToast(
      `Directions start from ${pinnedOrigin.building.title}. Tap × on the chip to use your live location instead.`,
    );
  }
});

// If the browser already allows location, start without asking again.
function autoStartLocation() {
  if (storeGet(GPS_OFF_KEY) === "1" || !locationSupported(false)) return;
  if (!navigator.permissions || !navigator.permissions.query) return;
  navigator.permissions
    .query({ name: "geolocation" })
    .then((status) => {
      if (status.state === "granted") startLocation({ recenter: false });
    })
    .catch(() => {});
}

// ==========================================================
// Start-up: QR code in the URL, or the starting point from earlier in this tab
// ==========================================================
//
// Runs once, at the very end of this file, when the page is ready.
function initRouting() {
  const params = new URLSearchParams(window.location.search);

  // index.html tells us what the visitor chose: location on or off.
  const locParam = params.get("loc");
  if (locParam === "on" || locParam === "off") {
    locMode = locParam;
    storeSet(LOC_MODE_KEY, locParam);
  } else {
    locMode = storeGet(LOC_MODE_KEY);
  }

  // The building named in a QR link (?from=<building>&door=<entrance>); otherwise reuse the starting point saved earlier in this tab.
  const raw =
    params.get("from") ||
    params.get("start") ||
    params.get("here") ||
    params.get("destination");

  let wanted = null;
  if (raw) {
    wanted = {
      key: raw,
      door: params.get("entrance") || params.get("door"),
      source: "qr",
      fromUrl: true,
    };
  } else {
    try {
      const saved = JSON.parse(storeGet(ORIGIN_KEY) || "null");
      if (saved && saved.key)
        wanted = {
          key: saved.key,
          door: saved.door,
          source: saved.source || "manual",
          fromUrl: false,
        };
    } catch (e) {}
  }

  // Mark the starting building on the map, or say it could not be found.
  if (wanted) {
    const building = findBuilding(wanted.key);
    if (building) {
      setPinnedOrigin(building, {
        source: wanted.source,
        doorIndex: findDoorIndex(building, wanted.door),
        fly: true,
      });
    } else if (wanted.fromUrl) {
      showToast(`Could not find “${wanted.key}” on the map.`);
    }
  }

  // Location on: live position takes over from the QR building as soon as it is accurate.
  // Location off: the QR building is the starting point and GPS is never used.
  if (locMode === "on") startLocation({ recenter: true });
  else if (locMode !== "off") autoStartLocation();

  // The QR / index params are consumed: drop them from the address bar so a refresh
  // (or a later "Start from here" choice) is not overridden by the old ?from=.
  if (window.location.search && storeGet(LOC_MODE_KEY)) stripOriginFromUrl();
}

// ==========================================================
// Building labels button
// ==========================================================
//
// Switches the building names beside the map icons on and off.
const toggleLabelsBtn = $("toggleLabelsBtn");

toggleLabelsBtn.addEventListener("click", () => {
  labelsVisible = !labelsVisible;
  toggleLabelsBtn.classList.toggle("active", labelsVisible);
  toggleLabelsBtn.setAttribute("aria-pressed", String(labelsVisible));

  document.querySelectorAll(".map-label-text").forEach((labelEl) => {
    labelEl.classList.toggle("hide-label", !labelsVisible);
  });
});

// ==========================================================
// Floor picker
// "M" is the plain campus map. F1 to F9 draw that floor's interior shapes (room outlines,
// walls, stairs, restrooms) on top of it. The shapes live in js/floor-plans.js.
// ==========================================================
//
// Full and short names for each floor (the short name is shown on the floor button's badge).
const FLOOR_NAMES = {
  m: "Main",
  f1: "Floor 1",
  f2: "Floor 2",
  f3: "Floor 3",
  f4: "Floor 4",
  f5: "Floor 5",
  f6: "Floor 6",
  f7: "Floor 7",
  f8: "Floor 8",
  f9: "Floor 9",
};
const FLOOR_SHORT = {
  m: "M",
  f1: "F1",
  f2: "F2",
  f3: "F3",
  f4: "F4",
  f5: "F5",
  f6: "F6",
  f7: "F7",
  f8: "F8",
  f9: "F9",
};

// Floor button, its popup menu, the badge on the button and the floor chips inside the menu.
const floorBtn = $("floorBtn");
const floorMenu = $("floorMenu");
const floorBadge = $("floorBadge");
const floorChips = floorMenu.querySelectorAll(".floor-chip");

// The floor being shown, and the map layer that holds its shapes (null on the main map).
let currentFloor = "m";
let floorGroup = null;

// Only restrooms, stairs and the chapel get icons on a floor. Restrooms pick male / female from the name.
// Returns { icon, label } for a shape that gets an icon, or null.
function getFloorFeatureInfo(props) {
  const key = Object.keys(props)[0];
  if (!key) return null;
  const kind = String(props[key]).toLowerCase();
  if (kind === "oc_cr") {
    const female = /female/i.test(key);
    return {
      icon: female ? "fa-solid fa-person-dress" : "fa-solid fa-person",
      label: female ? "Women's CR" : "Men's CR",
      restroom: true,
    };
  }
  if (kind === "oc_chapel")
    return { icon: "fa-solid fa-church", label: "Chapel" };
  if (kind === "oc_stairs")
    return { icon: "fa-solid fa-stairs", label: "Stairs" };
  return null;
}

// Draws one floor's shapes (not tappable, so taps reach the building below) and adds an icon at the centre of each restroom, stair and chapel.
function buildFloorGroup(floorData) {
  const group = L.featureGroup();
  L.geoJSON(floorData, {
    interactive: false,
    style: (feature) =>
      feature.geometry.type === "LineString"
        ? { className: "floor-line", weight: 2.5, lineCap: "round" }
        : { className: "floor-room", weight: 1.5 },
    onEachFeature: (feature, layer) => {
      const info = getFloorFeatureInfo(feature.properties || {});
      if (!info || feature.geometry.type === "LineString") return;
      let center;
      try {
        center = layer.getBounds().getCenter();
      } catch (e) {
        return;
      }
      const icon = L.divIcon({
        className: "map-label-marker floor-marker",
        html: `<div class="map-label-pill floor-pill${info.restroom ? " floor-restroom" : ""}" aria-hidden="true">
                 <div class="map-label-icon"><i class="${info.icon}"></i></div>
                 <span class="map-label-text${labelsVisible ? "" : " hide-label"}">${escapeHtml(info.label)}</span>
               </div>`,
        iconSize: null,
        iconAnchor: [15, 15],
      });
      L.marker(center, {
        icon,
        interactive: false,
        keyboard: false,
        zIndexOffset: 500,
      }).addTo(group);
    },
  }).eachLayer((l) => group.addLayer(l));
  return group;
}

// Opens or closes the floor popup menu.
function setFloorMenu(open) {
  floorMenu.classList.toggle("open", open);
  floorBtn.setAttribute("aria-expanded", String(open));
}

// Switches to a floor: removes the old floor's shapes, draws the new ones and updates the button.
// Floor 4 reuses the floor 3 plan without DPRO, and floors 5 to 9 share one plan.
function setFloor(id) {
  if (id === currentFloor) return;
  currentFloor = id;

  if (floorGroup) {
    oc_map.removeLayer(floorGroup);
    floorGroup = null;
  }
  const floorData = {
    f1: floor1Data,
    f2: floor2Data,
    f3: floor3Data,
    f4: floor4Data,
    f5: floor5to9Data,
    f6: floor5to9Data,
    f7: floor5to9Data,
    f8: floor5to9Data,
    f9: floor5to9Data,
  }[id];
  if (floorData) {
    floorGroup = buildFloorGroup(floorData).addTo(oc_map);
  }

  const onMain = id === "m";
  document.body.classList.toggle("floor-active", !onMain);
  floorBtn.classList.toggle("active", !onMain);
  floorBadge.textContent = FLOOR_SHORT[id];
  floorBadge.classList.toggle("show", !onMain);
  floorBtn.setAttribute(
    "aria-label",
    "Choose floor, current: " + FLOOR_NAMES[id],
  );
  floorChips.forEach((chip) =>
    chip.setAttribute("aria-checked", String(chip.dataset.floor === id)),
  );
}

// Floor button toggles the menu; choosing a chip switches floor and closes the menu.
floorBtn.addEventListener("click", () =>
  setFloorMenu(!floorMenu.classList.contains("open")),
);
floorChips.forEach((chip) =>
  chip.addEventListener("click", () => {
    setFloor(chip.dataset.floor);
    setFloorMenu(false);
  }),
);

// Tapping anywhere outside the floor control closes its menu.
document.addEventListener("click", (e) => {
  if (!e.target.closest("#floorControl")) setFloorMenu(false);
});

// Escape closes the floor menu first (before any other layer) and returns focus to the floor button.
document.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Escape" && floorMenu.classList.contains("open")) {
      setFloorMenu(false);
      floorBtn.focus();
      e.stopImmediatePropagation();
    }
  },
  true,
);

// ==========================================================
// Search bar
// Search matches building names and also room names / numbers inside buildings.
// ==========================================================
//
// Search state: the buildings in the dropdown, the highlighted option, which rooms matched
// in each building, and a room to open and highlight in the sheet.
let visibleBuildings = [];
let activeIndex = -1;
let buildingRoomHits = new Map();
let pendingRoomFocus = null;

// Room search: lets "registrar", "accounting", "507" or "chow" find the ELO building.
// Lower-cases text and drops apostrophes and punctuation.
const normalizeText = (t) =>
  String(t)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Splits text into words.
const tokenize = (t) => normalizeText(t).split(" ").filter(Boolean);

// A query word matches a word of the text if it is a prefix of it, or the other way round,
// or both share a long stem (accounting / accountancy).
function tokenMatches(q, w) {
  if (w.startsWith(q)) return true;
  if (q.length >= 3 && q.startsWith(w) && w.length >= 3) return true;
  if (q.length >= 5 && w.length >= 5) {
    let i = 0;
    while (i < q.length && i < w.length && q[i] === w[i]) i++;
    if (i >= 6) return true;
  }
  return false;
}

// Builds a searchable list of every room in every building directory (done once at start-up).
const ROOM_INDEX = {};
Object.keys(BUILDING_DIRECTORY).forEach((key) => {
  ROOM_INDEX[key] = [];
  BUILDING_DIRECTORY[key].forEach((sec, si) => {
    sec.groups.forEach((grp) => {
      grp.rooms.forEach(([num, name]) => {
        ROOM_INDEX[key].push({
          section: si,
          sectionLabel: sec.label,
          num,
          name,
          tokens: tokenize(`${num} ${name} ${sec.label} ${grp.label || ""}`),
        });
      });
    });
  });
});

// Rooms of a building where every word of the query matches the room, its floor or the building name.
function findRoomHits(building, rawQuery) {
  const key = getDirectoryKey(building);
  if (!key) return [];
  const qTokens = tokenize(rawQuery);
  if (!qTokens.length) return [];
  const titleTokens = tokenize(`${building.title} ${building.id || ""}`);
  return ROOM_INDEX[key].filter((r) => {
    const hay = titleTokens.concat(r.tokens);
    return qTokens.every((q) => hay.some((w) => tokenMatches(q, w)));
  });
}

// Text shown under a building in the dropdown for a matching room, e.g. "507 Chow (Floor 5)".
function roomHitLabel(r) {
  const where = r.sectionLabel;
  if (r.num && r.name) return `${r.num} ${r.name} (${where})`;
  if (r.num) return `${/^\d+$/.test(r.num) ? "Room " : ""}${r.num} (${where})`;
  return `${r.name} (${where})`;
}

// Shows or hides the dropdown.
function setDropdownOpen(open) {
  searchDropdown.classList.toggle("active", open);
  searchInput.setAttribute("aria-expanded", String(open));
  if (!open) setActiveOption(-1);
}

// Highlights one dropdown option (for arrow-key navigation) and scrolls it into view.
function setActiveOption(index) {
  const options = buildingsList.querySelectorAll(".building-item");
  options.forEach((el) => el.classList.remove("is-active"));
  activeIndex = index;

  if (index >= 0 && options[index]) {
    options[index].classList.add("is-active");
    searchInput.setAttribute("aria-activedescendant", options[index].id);
    options[index].scrollIntoView({ block: "nearest" });
  } else {
    searchInput.removeAttribute("aria-activedescendant");
  }
}

// Rebuilds the dropdown: buildings whose name matches, or that contain a matching room (up to three rooms shown).
function renderBuildingsDropdown(filterText = "") {
  buildingsList.replaceChildren();
  activeIndex = -1;
  searchInput.removeAttribute("aria-activedescendant");

  const query = filterText.toLowerCase();
  buildingRoomHits = new Map();
  visibleBuildings = campusBuildings.filter((b) => {
    if (b.title.toLowerCase().includes(query)) return true;
    const hits = findRoomHits(b, filterText);
    if (hits.length) buildingRoomHits.set(b, hits);
    return hits.length > 0;
  });

  if (visibleBuildings.length === 0) {
    const li = document.createElement("li");
    li.className = "no-building-found";
    li.setAttribute("role", "option");
    li.setAttribute("aria-disabled", "true");
    li.textContent = `No building matching "${filterText}"`;
    buildingsList.appendChild(li);
    return;
  }

  visibleBuildings.forEach((building, i) => {
    const li = document.createElement("li");
    li.className = "building-item";
    li.id = `building-option-${i}`;
    li.setAttribute("role", "option");

    const { iconClass, iconColor } = getBuildingIconInfo(building.title);

    const iconWrapper = document.createElement("div");
    iconWrapper.className = "map-label-icon";
    iconWrapper.style.color = iconColor;

    const icon = document.createElement("i");
    icon.className = iconClass;
    icon.setAttribute("aria-hidden", "true");
    iconWrapper.appendChild(icon);

    const label = document.createElement("span");
    label.className = "building-item-label";
    label.textContent = building.title;

    const textWrap = document.createElement("div");
    textWrap.className = "building-item-text";
    textWrap.appendChild(label);

    const hits = buildingRoomHits.get(building);
    if (hits && hits.length) {
      const sub = document.createElement("span");
      sub.className = "building-item-sub";
      const shown = hits.slice(0, 3).map(roomHitLabel).join(" • ");
      sub.textContent =
        shown + (hits.length > 3 ? ` • +${hits.length - 3} more` : "");
      textWrap.appendChild(sub);
    }

    li.append(iconWrapper, textWrap);
    li.addEventListener("click", (e) => {
      e.stopPropagation();
      selectBuilding(building, (hits && hits[0]) || null);
    });
    buildingsList.appendChild(li);
  });
}

// Picks a building: zooms to it and opens its sheet (with the matched room highlighted).
function selectBuilding(building, roomHit = null) {
  setDropdownOpen(false);
  pendingRoomFocus = roomHit;
  searchInput.value = building.title;
  updateSearchIconState();

  if (building.coords) {
    oc_map.flyTo([building.coords.lat, building.coords.lng], 19, {
      animate: true,
      duration: 1.2,
    });
  }
  openBottomSheet(building);
}

// The search icon becomes an X (clear) when there is text.
function updateSearchIconState() {
  if (searchInput.value.trim().length > 0) {
    searchIcon.className = "fa-solid fa-xmark";
    searchBtn.setAttribute("aria-label", "Clear search");
  } else {
    searchIcon.className = "fa-solid fa-magnifying-glass";
    searchBtn.setAttribute("aria-label", "Search");
  }
}

// Fills the dropdown for what is typed so far and shows it.
function openDropdown() {
  renderBuildingsDropdown(searchInput.value.trim());
  setDropdownOpen(true);
}

// Open the dropdown when the search box is tapped or typed in.
searchInput.addEventListener("focus", openDropdown);

searchInput.addEventListener("input", () => {
  updateSearchIconState();
  openDropdown();
});

// Keyboard: arrows move through the options, Enter picks one (or the first match), Escape closes the dropdown.
searchInput.addEventListener("keydown", (e) => {
  const isOpen = searchDropdown.classList.contains("active");

  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (!isOpen) openDropdown();
    if (!visibleBuildings.length) return;
    const step = e.key === "ArrowDown" ? 1 : -1;
    setActiveOption(
      (activeIndex + step + visibleBuildings.length) % visibleBuildings.length,
    );
  } else if (e.key === "Enter") {
    if (!isOpen || !visibleBuildings.length) return;
    e.preventDefault();
    if (activeIndex >= 0) {
      const b = visibleBuildings[activeIndex];
      const h = buildingRoomHits.get(b);
      selectBuilding(b, (h && h[0]) || null);
    } else if (searchInput.value.trim()) {
      const b = visibleBuildings[0];
      const h = buildingRoomHits.get(b);
      selectBuilding(b, (h && h[0]) || null);
    }
  } else if (e.key === "Escape" && isOpen) {
    e.stopPropagation();
    setDropdownOpen(false);
  }
});

// Search button: clears the text if there is some, otherwise opens or closes the dropdown.
searchBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (searchInput.value.trim().length > 0) {
    searchInput.value = "";
    updateSearchIconState();
    openDropdown();
    searchInput.focus();
  } else if (searchDropdown.classList.contains("active")) {
    setDropdownOpen(false);
  } else {
    openDropdown();
    searchInput.focus();
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".app-header")) {
    setDropdownOpen(false);
  }
});

// ==========================================================
// Campus perimeter mask
// Everything outside the campus boundary is shaded so the campus stands out.
// ==========================================================
//
// Shade colour for the area outside the campus (darker in dark mode).
function getMaskStyle(dark) {
  return dark
    ? { fillColor: "#000000", fillOpacity: 0.65 }
    : { fillColor: "#111827", fillOpacity: 0.45 };
}

// A polygon covering the whole world with the campus perimeter cut out of it.
let maskPolygon = null;
const perimeterFeature = geojsonData.features.find(
  (f) => f.properties && f.properties.perimeter,
);

if (perimeterFeature) {
  const perimeterLatLngs = perimeterFeature.geometry.coordinates.map(
    (coord) => [coord[1], coord[0]],
  );

  const worldOuterBounds = [
    [90, -180],
    [90, 180],
    [-90, 180],
    [-90, -180],
  ];

  maskPolygon = L.polygon([worldOuterBounds, perimeterLatLngs], {
    color: "transparent",
    interactive: false,
    ...getMaskStyle(isDarkMode),
  }).addTo(oc_map);
}

// ==========================================================
// Side drawer (hamburger menu)
// ==========================================================
//
// Slides the drawer in and moves keyboard focus to its close button.
function openMenu() {
  sideDrawer.classList.add("active");
  navOverlay.classList.add("active");
  menuToggle.setAttribute("aria-expanded", "true");
  closeDrawer.focus();
}

// Closes the drawer; returns focus to the menu button if focus was inside it.
function closeMenu(restoreFocus = true) {
  const hadFocusInside = sideDrawer.contains(document.activeElement);
  sideDrawer.classList.remove("active");
  navOverlay.classList.remove("active");
  menuToggle.setAttribute("aria-expanded", "false");
  if (restoreFocus && hadFocusInside) menuToggle.focus();
}

// Menu button opens the drawer; the close button and the dark overlay close it.
menuToggle.addEventListener("click", openMenu);
closeDrawer.addEventListener("click", () => closeMenu());
navOverlay.addEventListener("click", () => closeMenu());

// ==========================================================
// Feedback form
// ==========================================================
//
// The form, its send button and the button's normal label.
const feedbackForm = $("feedbackForm");
const sendFeedbackBtn = $("sendFeedbackBtn");
const SEND_LABEL =
  '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Send Feedback';

// "Feedback" in the drawer opens the form.
$("feedbackLink").addEventListener("click", () => {
  openModal(feedbackModal, $("userEmail"));
  closeMenu(false);
});

// Cancel button closes the form.
$("closeFeedbackBtn").addEventListener("click", () =>
  closeModal(feedbackModal),
);

// Send the feedback with emailjs. If sending fails, fall back to opening the visitor's own
// email app with the message already filled in.
feedbackForm.addEventListener("submit", (e) => {
  e.preventDefault();

  sendFeedbackBtn.disabled = true;
  sendFeedbackBtn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Sending...';

  const email = $("userEmail").value;
  const subject = $("feedbackSubject").value;
  const message = $("feedbackMessage").value;

  const templateParams = {
    name: email,
    email: email,
    subject: subject,
    message: message,
  };

  const request = window.emailjs
    ? emailjs.send(
        EMAIL_CONFIG.serviceId,
        EMAIL_CONFIG.templateId,
        templateParams,
      )
    : Promise.reject(new Error("EmailJS is unavailable"));

  request
    .then(
      () => {
        closeModal(feedbackModal);
        openModal(successModal, $("closeSuccessBtn"));
        feedbackForm.reset();
      },
      (error) => {
        console.error("FAILED...", error);
        alert(
          "Failed to send feedback automatically. Opening email client instead...",
        );
        closeModal(feedbackModal);
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("From: " + email + "\n\n" + message)}`;
      },
    )
    .finally(() => {
      sendFeedbackBtn.disabled = false;
      sendFeedbackBtn.innerHTML = SEND_LABEL;
    });
});

// OK button on the "thank you" popup.
$("closeSuccessBtn").addEventListener("click", () => closeModal(successModal));

// ==========================================================
// Light / dark mode toggle
// ==========================================================
//
// Drawer button for switching theme (its icon and label change with the theme).
const themeToggleBtn = $("themeToggleBtn");
const themeIcon = $("themeIcon");
const themeLabel = $("themeLabel");

// Button shows a sun ("Light Mode") while dark, a moon ("Dark Mode") while light.
function updateThemeUi() {
  themeIcon.className = isDarkMode ? "fa-solid fa-sun" : "fa-solid fa-moon";
  themeLabel.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
}

// Switch theme: swap the map tiles, page colours and perimeter mask, then save the choice.
themeToggleBtn.addEventListener("click", () => {
  isDarkMode = !isDarkMode;

  oc_map.removeLayer(currentTileLayer);
  currentTileLayer = isDarkMode ? dark_map : light_map;
  currentTileLayer.addTo(oc_map);

  document.body.classList.toggle("dark-theme", isDarkMode);
  if (maskPolygon) maskPolygon.setStyle(getMaskStyle(isDarkMode));

  updateThemeUi();
  saveTheme(isDarkMode ? "dark" : "light");
  closeMenu();
});

updateThemeUi();

// ==========================================================
// Info popups (About, Attributions)
// ==========================================================
//
// The popup's title and body, filled in by showInfo.
const infoModalTitle = $("infoModalTitle");
const infoModalBody = $("infoModalBody");

// Shows the info popup with a title icon, title and HTML body, and closes the drawer.
function showInfo(iconClass, title, bodyHtml) {
  infoModalTitle.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i> ${title}`;
  infoModalBody.innerHTML = bodyHtml;
  openModal(infoModal, $("closeInfoBtn"));
  closeMenu(false);
}

// "About Us / Contact Us" in the drawer.
$("aboutLink").addEventListener("click", () => {
  showInfo(
    "fa-solid fa-circle-info",
    "About Us / Contact Us",
    `
          <p><strong>Olivarez College Navigation Portal</strong></p>
          <p>We are a group of 2nd-year Information Technology students from Olivarez College. We created the Olivarez College Navigation Portal as our project requirement for our IT subject.</p>
          <p>Our goal is to build a simple, user-friendly system that helps students, teachers, and visitors easily go around campus. Through this project, we aim to apply what we have learned in class and create a practical tool that makes campus navigation faster and hassle-free for everyone.</p>
          <p><strong>Contact:</strong><br><a href="mailto:${CONTACT_EMAIL}" class="break-email">${CONTACT_EMAIL}</a></p>
      `,
  );
});

// "Attributions" in the drawer: credits for the map tiles, Leaflet, the rotate plugin and icons.
$("attributionsLink").addEventListener("click", () => {
  showInfo(
    "fa-solid fa-users",
    "Attributions",
    `
    <ul class="info-list">
      <li><i class="fa-solid fa-map" aria-hidden="true"></i> <span>Map tiles &copy; <a href="https://stadiamaps.com/" target="_blank" rel="noopener noreferrer">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors</span></li>
      <li><i class="fa-solid fa-code" aria-hidden="true"></i> <span>Map engine: <a href="https://leafletjs.com/" target="_blank" rel="noopener noreferrer">Leaflet</a></span></li>
      <li><i class="fa-solid fa-compass" aria-hidden="true"></i> <span>Map rotation: <a href="https://github.com/tomickigrzegorz/leaflet-rotate" target="_blank" rel="noopener noreferrer">Leaflet Rotate</a> plugin by Grzegorz Tomicki</span></li>
      <li><i class="fa-solid fa-icons" aria-hidden="true"></i> <span>Icons: <a href="https://fontawesome.com/" target="_blank" rel="noopener noreferrer">Font Awesome</a></span></li>
      <li><i class="fa-solid fa-envelope" aria-hidden="true"></i> <span>Feedback email: <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer">EmailJS</a></span></li>
    </ul>
    `,
  );
});

// OK button on the info popup.
$("closeInfoBtn").addEventListener("click", () => closeModal(infoModal));

// ==========================================================
// Start
// Everything above is now defined, so read the QR / index choices from the address bar
// and set up the starting point and live location.
// ==========================================================
//
initRouting();
