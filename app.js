import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signInAnonymously, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const tabTitles = { home: "Overzicht", rooster: "Rooster", instellingen: "Instellingen" };

function activateTab(tab) {
  $$(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.tab === tab));
  $$(".tab-panel").forEach((el) => el.classList.toggle("active", el.id === tab));
  $("#pageTitle").textContent = tabTitles[tab] || "Rooster";
  $("#crumbTitle").textContent = tabTitles[tab] || "Rooster";
  history.replaceState(null, "", `#${tab}`);
}

function setAuthMessage(message, isError = false) {
  const el = $("#authMessage");
  el.textContent = message;
  el.className = `auth-message ${isError ? "error" : ""}`;
}

function showApp(user) {
  $("#authScreen").classList.add("hidden");
  $("#appShell").classList.remove("hidden");
  $("#signedInAs").textContent = user.email || "Ingelogd";
  $("#settingsEmail").textContent = user.email || "—";
  const savedTab = location.hash.replace("#", "");
  activateTab(tabTitles[savedTab] ? savedTab : "rooster");
}

function showLogin() {
  $("#appShell").classList.add("hidden");
  $("#authScreen").classList.remove("hidden");
}

$$('.nav-item').forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.tab)));
$$('[data-go]').forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.go)));

$("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = $("#email").value.trim();
  if (!email) return;
  localStorage.setItem("somtodayUsername", $("#rememberUsername").checked ? email : "");
  setAuthMessage("Somtoday wordt geopend…");
  try {
    await signInAnonymously(auth);
    window.open("https://inloggen.somtoday.nl/", "_blank", "noopener");
  } catch (error) {
    console.warn("Firebase Anonymous Auth staat mogelijk nog niet aan:", error);
    window.open("https://inloggen.somtoday.nl/", "_blank", "noopener");
    showLocalApp(email);
  }
});

$("#clearSchool").addEventListener("click", () => {
  $(".school-pill span").textContent = "Kies school";
});

const savedUsername = localStorage.getItem("somtodayUsername");
if (savedUsername) $("#email").value = savedUsername;

function showLocalApp(email) {
  localStorage.setItem("siteAccess", "1");
  $("#authScreen").classList.add("hidden");
  $("#appShell").classList.remove("hidden");
  $("#signedInAs").textContent = email || "Ingelogd";
  $("#settingsEmail").textContent = email || "—";
  activateTab("rooster");
}

const frame = $("#somtodayFrame");
const placeholder = $("#iframePlaceholder");

function showSomtodayFrame() {
  placeholder.classList.add("hidden");
  $("#embedHint").textContent = "Somtoday wordt geladen…";
  frame.src = `https://leerling.somtoday.nl/rooster?ts=${Date.now()}`;
  setTimeout(() => {
    $("#embedHint").textContent = "Ingebouwde weergave — afhankelijk van Somtoday/browserbeveiliging";
  }, 1500);
}

$("#showRoster").addEventListener("click", showSomtodayFrame);
$("#reloadFrame").addEventListener("click", showSomtodayFrame);

let selectedWeek = 0;
function formatWeek(offset) {
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() + offset * 7);
  const monday = new Date(base);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" });
  return `${fmt.format(monday)} – ${fmt.format(sunday)}`;
}
function updateWeek() {
  $("#weekLabel").textContent = selectedWeek === 0 ? `Deze week · ${formatWeek(0)}` : formatWeek(selectedWeek);
}
$("#prevWeek").addEventListener("click", () => { selectedWeek -= 1; updateWeek(); });
$("#nextWeek").addEventListener("click", () => { selectedWeek += 1; updateWeek(); });
updateWeek();

async function checkFirebase() {
  $("#databaseUrlText").textContent = firebaseConfig.databaseURL;
  try {
    await get(ref(db, "health"));
    $("#firebaseStatus").textContent = "Realtime Database bereikbaar";
    $("#firebaseLabel").textContent = "Firebase gekoppeld";
    $("#databasePill").textContent = "Bereikbaar";
    $("#databasePill").className = "pill pill-green";
    $(".status-dot").style.background = "#1da66b";
  } catch (error) {
    $("#firebaseStatus").textContent = "Database read geblokkeerd of health ontbreekt";
    $("#firebaseLabel").textContent = "Firebase-config geladen";
    $("#databasePill").textContent = "Controleer Rules";
    console.warn("Firebase health check:", error);
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    showApp(user);
    checkFirebase();
  } else if (localStorage.getItem("siteAccess") === "1") {
    showLocalApp(localStorage.getItem("somtodayUsername") || "");
    checkFirebase();
  } else {
    showLogin();
  }
});
