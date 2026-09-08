import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
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
  setAuthMessage("Bezig met inloggen…");
  try {
    await signInWithEmailAndPassword(auth, $("#email").value.trim(), $("#password").value);
    setAuthMessage("");
  } catch (error) {
    setAuthMessage(mapAuthError(error), true);
  }
});

$("#registerBtn").addEventListener("click", async () => {
  const email = $("#email").value.trim();
  const password = $("#password").value;
  if (!email || !password) {
    setAuthMessage("Vul eerst een e-mailadres en wachtwoord in.", true);
    return;
  }
  setAuthMessage("Account wordt aangemaakt…");
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    setAuthMessage("Account aangemaakt.");
  } catch (error) {
    setAuthMessage(mapAuthError(error), true);
  }
});

$("#logoutBtn").addEventListener("click", () => signOut(auth));

function mapAuthError(error) {
  const codes = {
    "auth/invalid-credential": "E-mailadres of wachtwoord is niet correct.",
    "auth/invalid-email": "Vul een geldig e-mailadres in.",
    "auth/email-already-in-use": "Er bestaat al een account met dit e-mailadres.",
    "auth/weak-password": "Gebruik een sterker wachtwoord (minimaal 6 tekens).",
    "auth/operation-not-allowed": "Firebase Email/Password-login staat nog niet aan. Zet deze provider aan in Firebase Console.",
    "auth/too-many-requests": "Te veel pogingen. Probeer later opnieuw."
  };
  return codes[error.code] || "Inloggen is mislukt. Controleer je Firebase Authentication-instellingen.";
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
  } else {
    showLogin();
  }
});
