const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

initializeApp();

function allowedSomtodayHost(urlString) {
  let u;
  try { u = new URL(urlString); } catch { return false; }
  const host = u.hostname.toLowerCase();
  return (u.protocol === "https:" || u.protocol === "http:") && (host === "somtoday.nl" || host.endsWith(".somtoday.nl"));
}

exports.syncCalendar = onCall({ region: "europe-west1", timeoutSeconds: 30, memory: "256MiB" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Log eerst in.");

  const uid = request.auth.uid;
  const accountKey = String(request.data?.accountKey || "");
  if (!accountKey || /[.#$/\[\]]/.test(accountKey)) {
    throw new HttpsError("invalid-argument", "Ongeldig account.");
  }

  const accountRef = getDatabase().ref(`accounts/${uid}/${accountKey}`);
  const snapshot = await accountRef.once("value");
  const account = snapshot.val() || {};
  if (!account.calendarUrl) {
    throw new HttpsError("failed-precondition", "Geen opgeslagen Somtoday iCalendar-link gevonden.");
  }

  const calendarUrl = String(account.calendarUrl).replace(/^webcal:\/\//i, "https://");
  if (!allowedSomtodayHost(calendarUrl)) {
    throw new HttpsError("invalid-argument", "De iCalendar-link moet van Somtoday afkomstig zijn.");
  }

  const response = await fetch(calendarUrl, {
    headers: { "User-Agent": "SchoolPortaal/1.0 (Somtoday calendar sync)" },
    redirect: "follow"
  });
  if (!response.ok) throw new HttpsError("unavailable", `Somtoday gaf HTTP ${response.status}.`);

  const ics = await response.text();
  await accountRef.update({ icsText: ics, updatedAt: Date.now() });
  return { ics };
});
