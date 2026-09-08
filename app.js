import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const tabTitles = {
  home: "Overzicht",
  rooster: "Rooster",
  instellingen: "Instellingen"
};

function activateTab(tab) {
  $$(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.tab === tab));
  $$(".tab-panel").forEach((el) => el.classList.toggle("active", el.id === tab));
  $("#pageTitle").textContent = tabTitles[tab] || "Rooster";
  history.replaceState(null, "", `#${tab}`);
}

$$(".nav-item").forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tab));
});

$$("[data-go]").forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.go));
});

const savedTab = location.hash.replace("#", "");
activateTab(tabTitles[savedTab] ? savedTab : "rooster");

const frame = $("#somtodayFrame");
const fallback = $("#iframeFallback");

// Een browser kan ons niet betrouwbaar vertellen of een cross-origin iframe inhoud toont.
// Daarom houden we de fallback klein en laten we de directe Somtoday-link altijd beschikbaar.
$("#reloadFrame").addEventListener("click", () => {
  fallback.classList.remove("show");
  frame.src = "about:blank";
  setTimeout(() => { frame.src = "https://leerling.somtoday.nl/rooster"; }, 80);
});

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
    // Leest alleen een optionele health node. Werkt ook als deze node nog niet bestaat;
    // Security Rules mogen de read uiteraard weigeren.
    await get(ref(db, "health"));
    $("#firebaseStatus").textContent = "Realtime Database bereikbaar";
    $("#firebaseLabel").textContent = "Firebase gekoppeld";
    $("#databasePill").textContent = "Bereikbaar";
    $("#databasePill").className = "pill pill-green";
    $(".status-dot").style.background = "#1da66b";
  } catch (error) {
    $("#firebaseStatus").textContent = "Regels blokkeren of node ontbreekt";
    $("#firebaseLabel").textContent = "Firebase-config geladen";
    $("#databasePill").textContent = "Controleer Rules";
    console.warn("Firebase health check:", error);
  }
}

checkFirebase();
