import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signInAnonymously, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const state = { events: [], weekOffset: 0 };
const tabTitles = { rooster: "Rooster", instellingen: "Instellingen" };

function activateTab(tab) {
  $$(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.tab === tab));
  $$(".tab-panel").forEach(el => el.classList.toggle("active", el.id === tab));
  $("#pageTitle").textContent = tabTitles[tab] || "Rooster";
  $("#crumbTitle").textContent = tabTitles[tab] || "Rooster";
}
function setStatus(msg, error=false) { const e=$("#calendarStatus"); e.textContent=msg; e.className=`auth-message ${error?"error":""}`; }
function showApp(user) { $("#authScreen").classList.add("hidden"); $("#appShell").classList.remove("hidden"); const email=user?.email || localStorage.getItem("siteEmail") || "Ingelogd"; $("#signedInAs").textContent=email; $("#settingsEmail").textContent=email; activateTab("rooster"); checkFirebase(); render(); }
function showLogin() { $("#appShell").classList.add("hidden"); $("#authScreen").classList.remove("hidden"); }

$("#loginForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const email=$("#email").value.trim(); if(!email) return;
  if($("#rememberUsername").checked) localStorage.setItem("somtodayUsername", email); else localStorage.removeItem("somtodayUsername");
  localStorage.setItem("siteEmail", email);
  setStatus("");
  try { await signInAnonymously(auth); } catch(err) { console.warn(err); showApp({email}); }
});
$("#logoutBtn").addEventListener("click", async ()=>{ localStorage.removeItem("siteAccess"); try{await signOut(auth);}catch{} showLogin(); });
$("#clearSchool").addEventListener("click", ()=>$(".school-pill span").textContent="Kies school");
const saved=localStorage.getItem("somtodayUsername"); if(saved) $("#email").value=saved;

function parseIcsDate(raw){
  const v=raw.trim();
  const m=v.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?(\d{2})?(Z)?$/);
  if(!m) return null;
  const [,Y,Mo,D,h="00",mi="00",s="00",z]=m;
  if(z) return new Date(Date.UTC(+Y,+Mo-1,+D,+h,+mi,+s));
  return new Date(+Y,+Mo-1,+D,+h,+mi,+s);
}
function unfoldIcs(text){ return text.replace(/\r?\n[ \t]/g, ""); }
function prop(lines,name){
  const target=name.toUpperCase();
  const line=lines.find(x=>x.toUpperCase().startsWith(target+":") || x.toUpperCase().startsWith(target+";"));
  return line ? line.slice(line.indexOf(":")+1) : "";
}
function propName(line){ return line.split(":",1)[0].split(";",1)[0].toUpperCase(); }
function propValue(line){ return line.includes(":") ? line.slice(line.indexOf(":")+1) : ""; }
function parseDescriptionFields(description){
  const fields={};
  description.split(/\\n|\n|\r/).map(x=>x.trim()).filter(Boolean).forEach(b=>{
    const m=b.match(/^([^:]+):\s*(.*)$/);
    if(m) fields[m[1].trim().toLowerCase()]=m[2].trim();
  });
  return fields;
}
function classifyAssessment(summary, description, categories, fields={}){
  const hay=(summary+" "+description+" "+categories+" "+Object.values(fields).join(" ")).toLowerCase();
  const small=/\b(kleine\s+toets|minitoets|mini[- ]?toets|s\.?o\.?|kt|k\.t\.)\b/.test(hay) || /kleine toets|minitoets|mini[- ]?toets/.test(hay);
  const big=/\b(toets|proefwerk|tentamen|examen|pw)\b/.test(hay);
  if(small) return "small";
  if(big) return "big";
  return "normal";
}
function linesToEvent(lines){
  const summary=unescapeIcs(prop(lines,"SUMMARY")||"Les");
  const location=unescapeIcs(prop(lines,"LOCATION")||"");
  const description=unescapeIcs(prop(lines,"DESCRIPTION")||"");
  const categories=unescapeIcs(prop(lines,"CATEGORIES")||"");
  const dtstart=prop(lines,"DTSTART"); const dtend=prop(lines,"DTEND");
  const start=parseIcsDate(dtstart); const end=parseIcsDate(dtend) || (start ? new Date(start.getTime()+50*60000) : null);
  if(!start) return null;
  const fields=parseDescriptionFields(description);
  let subject=unescapeIcs(fields.vak || fields.subject || summary);
  let teacher=unescapeIcs(fields.docent || fields.teacher || "");
  let room=location;
  if(!room){ const rb=Object.entries(fields).find(([k])=>/^(lokaal|room|locatie)$/.test(k)); if(rb) room=unescapeIcs(rb[1]); }
  const assessmentType=classifyAssessment(summary,description,categories,fields);
  const assessment=assessmentType!=="normal" ? {
    type: assessmentType,
    title: unescapeIcs(fields.toets || fields.assessment || summary),
    description: unescapeIcs(fields.omschrijving || fields.description || description),
    weight: unescapeIcs(fields.weging || fields.weight || ""),
    duration: unescapeIcs(fields.duur || fields.duration || "")
  } : null;
  return {id:prop(lines,"UID") || crypto.randomUUID(), start, end, subject, teacher, room, assessment, summary, description, categories};
}
function assessmentLabel(type){ return type === "small" ? "Kleine toets" : type === "big" ? "Toets" : "Les"; }
function assessmentClass(type){ return type === "small" ? "lesson-small-test" : type === "big" ? "lesson-big-test" : ""; }

function mondayFor(date){ const d=new Date(date); d.setHours(12,0,0,0); const day=d.getDay()||7; d.setDate(d.getDate()-day+1); return d; }
function getWeekStart(){ const base=mondayFor(new Date()); base.setDate(base.getDate()+state.weekOffset*7); return base; }
function formatDate(d){ return new Intl.DateTimeFormat("nl-NL",{day:"numeric",month:"short",timeZone:"Europe/Amsterdam"}).format(d); }
function updateWeekLabel(){ const mon=getWeekStart(); const sun=new Date(mon); sun.setDate(mon.getDate()+6); $("#weekLabel").textContent=(state.weekOffset===0?"Deze week · ":"")+formatDate(mon)+" – "+formatDate(sun); }
function dayKey(d){ return new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Amsterdam",year:"numeric",month:"2-digit",day:"2-digit"}).format(d); }
function timeLabel(d){ return new Intl.DateTimeFormat("nl-NL",{timeZone:"Europe/Amsterdam",hour:"2-digit",minute:"2-digit"}).format(d); }
function render(){
  updateWeekLabel(); const grid=$("#scheduleGrid"), empty=$("#emptyState"); grid.innerHTML="";
  const monday=getWeekStart(); const dayNames=["maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag","zondag"];
  let any=false;
  for(let i=0;i<7;i++){
    const d=new Date(monday); d.setDate(monday.getDate()+i); const key=dayKey(d);
    const dayEvents=state.events.filter(ev=>dayKey(ev.start)===key).sort((a,b)=>a.start-b.start);
    if(dayEvents.length) any=true;
    const col=document.createElement("div"); col.className="day-column";
    const isToday=dayKey(new Date())===key;
    col.innerHTML=`<div class="day-head ${isToday?"today":""}"><div><strong>${dayNames[i]}</strong><span>${new Intl.DateTimeFormat("nl-NL",{day:"numeric",month:"numeric"}).format(d)}</span></div>${isToday?'<em>vandaag</em>':''}</div>`;
    for(const ev of dayEvents){
      const card=document.createElement("button"); card.type="button"; card.className=`lesson-card ${assessmentClass(ev.assessment?.type)}`;
      const badge=ev.assessment ? `<span class="assessment-badge ${ev.assessment.type}">${assessmentLabel(ev.assessment.type)}</span>` : "";
      card.innerHTML=`<div class="lesson-top"><div class="lesson-time">${timeLabel(ev.start)}–${timeLabel(ev.end)}</div>${badge}</div><div class="lesson-subject">${escapeHtml(ev.subject)}</div>${ev.room?`<div class="lesson-meta"><span class="meta-icon">●</span>${escapeHtml(ev.room)}</div>`:""}${ev.teacher?`<div class="lesson-meta"><span class="meta-icon">●</span>${escapeHtml(ev.teacher)}</div>`:""}`;
      card.addEventListener("click",()=>openLessonModal(ev));
      col.appendChild(card);
    }
    if(!dayEvents.length) col.insertAdjacentHTML("beforeend",`<div class="no-lessons">Geen lessen</div>`);
    grid.appendChild(col);
  }
  empty.classList.toggle("hidden", any || state.events.length>0);
}
function openLessonModal(ev){
  const modal=$("#lessonModal");
  $("#modalBadge").textContent=ev.assessment ? assessmentLabel(ev.assessment.type) : "Les";
  $("#modalBadge").className=`modal-badge ${ev.assessment?.type||"normal"}`;
  $("#modalTitle").textContent=ev.subject;
  const date=new Intl.DateTimeFormat("nl-NL",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"Europe/Amsterdam"}).format(ev.start);
  $("#modalDate").textContent=`${date} · ${timeLabel(ev.start)} – ${timeLabel(ev.end)}`;
  const rows=[];
  if(ev.room) rows.push(`<div><span>Locatie</span><strong>${escapeHtml(ev.room)}</strong></div>`);
  if(ev.teacher) rows.push(`<div><span>Docent</span><strong>${escapeHtml(ev.teacher)}</strong></div>`);
  if(ev.assessment?.weight) rows.push(`<div><span>Weging</span><strong>${escapeHtml(ev.assessment.weight)}</strong></div>`);
  if(ev.assessment?.duration) rows.push(`<div><span>Duur</span><strong>${escapeHtml(ev.assessment.duration)}</strong></div>`);
  if(ev.assessment){
    const text=ev.assessment.description && ev.assessment.description!==ev.summary ? ev.assessment.description : "Deze afspraak is als toets gemarkeerd in de agenda.";
    rows.push(`<div class="detail-wide"><span>Toetsinformatie</span><p>${escapeHtml(text)}</p></div>`);
  } else if(ev.description){
    rows.push(`<div class="detail-wide"><span>Notities</span><p>${escapeHtml(ev.description)}</p></div>`);
  }
  $("#modalDetails").innerHTML=rows.length ? rows.join("") : `<div class="detail-empty">Geen extra informatie beschikbaar.</div>`;
  modal.classList.remove("hidden"); document.body.classList.add("modal-open"); $("#modalClose").focus();
}
function closeLessonModal(){ $("#lessonModal").classList.add("hidden"); document.body.classList.remove("modal-open"); }
$("#modalClose").addEventListener("click",closeLessonModal);
$("#modalBackdrop").addEventListener("click",closeLessonModal);
document.addEventListener("keydown",e=>{if(e.key==="Escape") closeLessonModal();});

function escapeHtml(v){ return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

async function importText(text){
  try { const events=parseICS(text); if(!events.length) throw new Error("Geen afspraken gevonden"); state.events=events; localStorage.setItem("calendarCache", text); state.weekOffset=0; setStatus(`${events.length} roosterafspraken geladen.`); render(); }
  catch(err){ setStatus("Deze kalender kon niet worden gelezen. Controleer de link of het .ics-bestand.",true); console.error(err); }
}
$("#icsFile").addEventListener("change", async e=>{ const f=e.target.files?.[0]; if(!f)return; await importText(await f.text()); });
$("#loadCalendar").addEventListener("click", async ()=>{
  const url=$("#calendarUrl").value.trim(); if(!url) return setStatus("Plak eerst je Somtoday iCalendar-link.",true);
  setStatus("Rooster ophalen…");
  try { const r=await fetch(url,{cache:"no-store"}); if(!r.ok) throw new Error(`HTTP ${r.status}`); await importText(await r.text()); }
  catch(err){ setStatus("De Somtoday-link weigert een browserrequest (CORS) of is ongeldig. Download de kalender als .ics en importeer dat bestand hier.",true); console.warn(err); }
});
$("#prevWeek").addEventListener("click",()=>{state.weekOffset--;render();});
$("#nextWeek").addEventListener("click",()=>{state.weekOffset++;render();});
const cached=localStorage.getItem("calendarCache"); if(cached) importText(cached);

async function checkFirebase(){
  $("#databaseUrlText").textContent=firebaseConfig.databaseURL;
  try{ await get(ref(db,"health")); $("#firebaseStatus").textContent="Realtime Database bereikbaar"; $("#databasePill").textContent="Bereikbaar"; $("#databasePill").className="pill pill-green"; $(".status-dot").style.background="#1da66b"; }
  catch{ $("#firebaseStatus").textContent="Rules blokkeren de test of health ontbreekt"; $("#databasePill").textContent="Controleer Rules"; }
}

onAuthStateChanged(auth,user=>{ if(user){showApp(user);} else {showLogin();} });
