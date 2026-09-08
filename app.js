import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";
const db=getDatabase(initializeApp(firebaseConfig));
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const S={events:[],tests:[],grades:[],week:0,email:"",key:"",icsText:"",url:"",gradeTab:"latest",schoolYear:""};
const titles={rooster:"Rooster",cijfers:"Cijfers",instellingen:"Instellingen"};
const esc=x=>String(x??"").replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function key(v){return btoa(unescape(encodeURIComponent(String(v).trim().toLowerCase()))).replace(/[+/=]/g,"_")}
function dbref(){return ref(db,`accounts/${S.key}`)}
function setStatus(t,err=false){$("#status").textContent=t;$("#status").className=`status ${err?'error':''}`}
function dayKey(d){return new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Amsterdam",year:"numeric",month:"2-digit",day:"2-digit"}).format(d)}
function time(d){return new Intl.DateTimeFormat("nl-NL",{timeZone:"Europe/Amsterdam",hour:"2-digit",minute:"2-digit"}).format(d)}
function monday(d){const x=new Date(d);x.setHours(12,0,0,0);const n=x.getDay()||7;x.setDate(x.getDate()-n+1);return x}
function dateTime(t){return new Date(`${t.date}T${t.start||"00:00"}:00`)}
function fmt(d){return new Intl.DateTimeFormat("nl-NL",{day:"numeric",month:"short",timeZone:"Europe/Amsterdam"}).format(d)}
function parseDate(v){const m=String(v||"").match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?(\d{2})?(Z)?$/);if(!m)return null;const[,Y,M,D,h="00",mi="00",s="00",z]=m;return z?new Date(Date.UTC(+Y,+M-1,+D,+h,+mi,+s)):new Date(+Y,+M-1,+D,+h,+mi,+s)}
function unfold(s){return s.replace(/\r?\n[ \t]/g,"")}
function val(lines,n){const l=lines.find(x=>x.toUpperCase().startsWith(n+":")||x.toUpperCase().startsWith(n+";"));return l?l.slice(l.indexOf(":")+1):""}
function unesc(v){return String(v||"").replace(/\\n/g,"\n").replace(/\\,/g,",").replace(/\\;/g,";").replace(/\\\\/g,"\\")}
function detectAssessment(metaText){
  // Somtoday zet de toets-indicator niet in de lesnaam. We zoeken daarom alleen
  // in de extra event-metadata (DESCRIPTION/CATEGORIES/X-* / ATTACH enz.).
  const text=String(metaText||"").toLowerCase();
  const normalized=text.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const small=[
    "kleine toets","kleine toets", "minitoets","mini toets","mini-toets",
    "kleine so","kleine s.o.","kleine s.o","overhoring","formatieve toets",
    "k.t.","kt","minor test","small test","oranje","orange","small"
  ];
  const big=[
    "grote toets","grote toets", "grote so","grote s.o.","proefwerk",
    "tentamen","examen","repetitie","summatieve toets","schoolexamen",
    "pta","major test","big test","rood","red","large","big"
  ];
  if(big.some(x=>normalized.includes(x))) return "big";
  if(small.some(x=>normalized.includes(x))) return "small";
  // In sommige Somtoday-feeds staat het aparte toetslabel alleen als "Toets"
  // in de omschrijving/metadata. Dat is geen lesnaam en wordt daarom als
  // kleine toets weergegeven, zoals het oranje toets-symbool in Somtoday.
  if(/(^|[^a-z])toets(\s|$|[-_:])/i.test(normalized)) return "small";
  return "";
}
function extraMetadata(lines){
  const ignored=["SUMMARY","DTSTART","DTEND","UID","LOCATION","ORGANIZER"];
  return lines.filter(line=>{
    const prop=line.split(":",1)[0].split(";",1)[0].toUpperCase();
    return !ignored.includes(prop);
  }).map(line=>unesc(line.slice(line.indexOf(":")+1))).filter(Boolean).join(" ");
}
function parseICS(text){
  const L=unfold(text).split(/\r?\n/),out=[];let cur=null;
  for(const l of L){
    if(l.trim()==="BEGIN:VEVENT") cur=[];
    else if(l.trim()==="END:VEVENT"){
      if(cur){
        const st=parseDate(val(cur,"DTSTART"));
        if(st){
          const en=parseDate(val(cur,"DTEND"))||new Date(st.getTime()+50*60000);
          const summary=unesc(val(cur,"SUMMARY")||"Les");
          const loc=unesc(val(cur,"LOCATION"));
          const desc=unesc(val(cur,"DESCRIPTION"));
          const cats=unesc(val(cur,"CATEGORIES"));
          const attach=unesc(val(cur,"ATTACH"));
          const subject=unesc((desc.match(/(?:vak|subject|course|class)[:=]\s*([^\n]+)/i)||[])[1]||summary).trim();
          const metadata=extraMetadata(cur);
          const assessment=detectAssessment(metadata);
          out.push({id:val(cur,"UID")||crypto.randomUUID(),start:st,end:en,subject,teacher:unesc(val(cur,"ORGANIZER")||""),room:loc,summary,description:desc,categories:cats,attachment:attach,metadata,assessment,assessmentSource:assessment?metadata:""});
        }
      }
      cur=null;
    } else if(cur) cur.push(l)
  }
  return out
}
function testTypeLabel(t){return t==="small"?"Kleine toets":t==="big"?"Grote toets / toets":"Les"}
function mergedEvents(){return S.events.map(e=>{const m=S.tests.filter(t=>String(t.subject).trim().toLowerCase()===String(e.subject).trim().toLowerCase()&&dayKey(dateTime(t))===dayKey(e.start));if(!m.length)return e;const t=m.find(x=>Math.abs(dateTime(x)-e.start)<7200000)||m[0];return {...e,assessment:e.assessment||t.type,assessmentData:t}})}
function combinedForDay(key){const lessons=mergedEvents().filter(e=>dayKey(e.start)===key);const tests=S.tests.filter(t=>dayKey(dateTime(t))===key && !lessons.some(e=>e.assessmentData?.id===t.id));return [...lessons.map(e=>({kind:"lesson",item:e,at:e.start})),...tests.map(t=>({kind:"test",item:t,at:dateTime(t)}))].sort((a,b)=>a.at-b.at)}
function render(){const base=monday(new Date());base.setDate(base.getDate()+S.week*7);const sun=new Date(base);sun.setDate(base.getDate()+6);$("#week").textContent=(S.week===0?"Deze week · ":"")+`${fmt(base)} – ${fmt(sun)}`;const names=["maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag","zondag"];const grid=$("#grid");grid.innerHTML="";let count=0;for(let i=0;i<7;i++){const d=new Date(base);d.setDate(base.getDate()+i);const k=dayKey(d);const items=combinedForDay(k);count+=items.length;const col=document.createElement("div");col.className="day";col.innerHTML=`<div class="day-head ${k===dayKey(new Date())?'today':''}"><strong>${names[i]}</strong><span>${d.getDate()}/${d.getMonth()+1}</span></div>`;if(!items.length)col.insertAdjacentHTML("beforeend","<div class=none>Geen lessen</div>");for(const x of items){const e=x.item;const isT=x.kind==="test";const type=isT?e.type:(e.assessment||"");const c=type==="small"?"small-test":type==="big"?"big-test":"";const b=document.createElement("button");b.className=`lesson ${c}`;b.innerHTML=`<div class="lesson-time">${time(x.at)}${e.end&&!isT?`–${time(e.end)}`:""}</div><strong>${esc(e.subject)}</strong>${isT?`<span class="test-tag">${testTypeLabel(e.type)}</span>`:""}${e.room&&!isT?`<small>${esc(e.room)}</small>`:""}`;b.onclick=()=>isT?openTest(e):openLesson(e);col.appendChild(b)}grid.appendChild(col)}$("#empty").classList.toggle("hidden",count>0||S.events.length>0||S.tests.length>0);}
function openLesson(e){
  const auto=e.assessment&&["small","big"].includes(e.assessment);
  $("#modalBadge").textContent=e.assessment?testTypeLabel(e.assessment):"Les";
  $("#modalBadge").className=`badge ${e.assessment||""}`;
  $("#modalTitle").textContent=e.subject;
  $("#modalDate").textContent=`${new Intl.DateTimeFormat("nl-NL",{dateStyle:"full"}).format(e.start)} · ${time(e.start)} – ${time(e.end)}`;
  let b=`<div><span>Locatie</span><strong>${esc(e.room||"-")}</strong></div>`;
  if(e.teacher) b+=`<div><span>Docent</span><strong>${esc(e.teacher)}</strong></div>`;
  if(auto) b+=`<div><span>Herkenning</span><strong>Toets gevonden in de roostergegevens</strong></div>`;
  if(e.assessmentData){const t=e.assessmentData;b+=`<div><span>Soort</span><strong>${testTypeLabel(t.type)}</strong></div>${t.weight?`<div><span>Weging</span><strong>${esc(t.weight)}</strong></div>`:""}${t.description?`<div class="desc"><span>Omschrijving</span><strong>${esc(t.description).replace(/\n/g,"<br>")}</strong></div>`:""}`}
  if(e.description && e.description.trim()) b+=`<div class="desc"><span>Extra informatie</span><strong>${esc(e.description).replace(/\n/g,"<br>")}</strong></div>`;
  if(e.categories) b+=`<div><span>Categorie</span><strong>${esc(e.categories)}</strong></div>`;
  if(e.assessmentSource) b+=`<div class="desc"><span>Toetskenmerk</span><strong>${esc(e.assessmentSource).replace(/\n/g,"<br>")}</strong></div>`;
  $("#modalBody").innerHTML=b;
  const action=$("#lessonActions");
  action.classList.toggle("hidden", !!e.assessmentData);
  $("#addTestForLesson").onclick=()=>{ $("#modal").classList.add("hidden"); showTest(e); };
  $("#modal").classList.remove("hidden");
}
function openTest(t){openLesson({subject:t.subject,start:dateTime(t),end:t.end?new Date(`${t.date}T${t.end}:00`):dateTime(t),room:"",assessment:t.type,assessmentData:t})}
function {const b=$("#tests");if(!S.tests.length){b.innerHTML='<div class="none wide-none">Nog geen toetsen opgeslagen.</div>';return}b.innerHTML=[...S.tests].sort((a,b)=>dateTime(a)-dateTime(b)).map(t=>`<button class="test-line ${t.type}" data-id="${t.id}"><i></i><span><strong>${esc(t.subject)}</strong><small>${esc(t.date)} · ${esc(t.start)}</small></span><em>${testTypeLabel(t.type)}</em></button>`).join("");b.querySelectorAll(".test-line").forEach(x=>x.onclick=()=>openTest(S.tests.find(t=>t.id===x.dataset.id)))}
async function save(){await set(dbref(),{email:S.email,calendarUrl:S.url,icsText:S.icsText,tests:S.tests,grades:S.grades,updatedAt:Date.now()})}
async function restore(){try{const s=await get(dbref());if(!s.exists()){setStatus("Je account is aangemaakt. Voeg je iCalendar-link toe.");renderGrades();return}const d=s.val()||{};S.url=d.calendarUrl||"";S.icsText=d.icsText||"";S.tests=Array.isArray(d.tests)?d.tests:Object.values(d.tests||{});S.grades=Array.isArray(d.grades)?d.grades:Object.values(d.grades||{});$("#calendarUrl").value=S.url;if(S.icsText){S.events=parseICS(S.icsText);setStatus(`${S.events.length} lessen, ${S.tests.length} toetsen en ${S.grades.length} cijfers geladen.`)}else setStatus(`${S.tests.length} opgeslagen toetsen en ${S.grades.length} cijfers geladen.`);render();renderGrades()}catch(e){setStatus("Firebase kon het account niet laden. Controleer de openbare Rules.",true);renderGrades()}}
async function loadICS(text){S.icsText=text;S.events=parseICS(text);if(!S.events.length)throw Error("Geen lessen gevonden");await save();setStatus(`${S.events.length} lessen geladen en opgeslagen in Firebase.`);S.week=0;render()}
async function loadUrl(){let u=$("#calendarUrl").value.trim();if(!u)return setStatus("Plak eerst je Somtoday iCalendar-link.",true);u=u.replace(/^webcal:\/\//i,"https://");S.url=u;setStatus("Rooster ophalen…");try{const r=await fetch(u,{cache:"no-store"});if(!r.ok)throw Error(`HTTP ${r.status}`);await loadICS(await r.text())}catch(e){await save().catch(()=>{});setStatus("Somtoday blokkeert het directe ophalen vanuit de browser (CORS). Gebruik daarom '.ics importeren' om je rooster hier te laden. Je link blijft wel per account bewaard.",true)}}
function openTab(t){$$('.nav').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));$$('.panel').forEach(p=>p.classList.toggle('active',p.id===t));$("#title").textContent=titles[t];$("#crumb").textContent=titles[t];if(t==="cijfers")renderGrades()}

function currentSchoolYear(){const now=new Date();const y=now.getMonth()>=7?now.getFullYear():now.getFullYear()-1;return `${y}-${String(y+1).slice(-2)}`}
function gradeYear(g){return String(g.schoolYear||g.year||currentSchoolYear())}
function gradeValue(g){const n=Number(String(g.value??g.grade??"").replace(",","."));return Number.isFinite(n)?n:null}
function selectedGrades(){return S.grades.filter(g=>!S.schoolYear||gradeYear(g)===S.schoolYear)}
function calcAverage(list){let sum=0,w=0;for(const g of list){const n=gradeValue(g);if(n==null)continue;const wt=Number(g.weight||g.weging||1)||1;sum+=n*wt;w+=wt}return w?Math.round(sum/w*100)/100:null}
function gradeSubjects(){const names=new Set(S.events.map(e=>e.subject).filter(Boolean));selectedGrades().forEach(g=>names.add(g.subject||g.vak));return [...names].filter(Boolean).sort((a,b)=>a.localeCompare(b,'nl'))}
function fmtGrade(n){return n==null?"-":Number.isInteger(n)?String(n):n.toFixed(1).replace('.',',')}
function gradeColor(n){if(n==null)return '';if(n>=5.5)return 'grade-good';if(n>=5)return 'grade-mid';return 'grade-bad'}
function gradeDate(g){return g.date?new Intl.DateTimeFormat('nl-NL',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(g.date)):''}
function renderGradeYearOptions(){const years=[...new Set(S.grades.map(gradeYear))];if(!years.includes(currentSchoolYear()))years.unshift(currentSchoolYear());years.sort((a,b)=>b.localeCompare(a));const sel=$("#schoolYear");sel.innerHTML=years.map(y=>`<option value="${esc(y)}">${esc(y)}</option>`).join('');if(!S.schoolYear||!years.includes(S.schoolYear))S.schoolYear=years[0]||currentSchoolYear();sel.value=S.schoolYear}
function renderGrades(){renderGradeYearOptions();const grades=selectedGrades();const latest=[...grades].sort((a,b)=>(new Date(b.date||0))-(new Date(a.date||0)));const latestEl=$("#gradeLatest"),avgEl=$("#gradeAverages"),ovEl=$("#gradeOverview");if(S.gradeTab==='latest'){if(!latest.length){latestEl.innerHTML='<div class="empty-grade"><div class="grade-empty-icon">▤</div><strong>Er zijn geen cijfers voor deze periode</strong><span>Nieuwe cijfers verschijnen hier zodra ze aan je account zijn toegevoegd.</span></div>'}else{latestEl.innerHTML=`<div class="grade-list">${latest.map(g=>`<button class="grade-row" data-grade-id="${esc(g.id||'')}"><span class="subject-dot"></span><span class="grade-subject"><strong>${esc(g.subject||g.vak||'Vak')}</strong><small>${esc(g.title||g.omschrijving||'Cijfer')} · ${gradeDate(g)}</small></span><span class="grade-number ${gradeColor(gradeValue(g))}">${fmtGrade(gradeValue(g))}</span></button>`).join('')}</div>`}}
else if(S.gradeTab==='averages'){const rows=gradeSubjects().map(subject=>{const list=grades.filter(g=>(g.subject||g.vak)===subject);return {subject,avg:calcAverage(list),count:list.length}});avgEl.innerHTML=rows.length?`<div class="average-list">${rows.map(r=>`<button class="average-row" data-subject="${esc(r.subject)}"><span class="subject-icon">${esc(r.subject.slice(0,1).toUpperCase())}</span><strong>${esc(r.subject)}</strong><span class="avg-number ${gradeColor(r.avg)}">${fmtGrade(r.avg)}</span></button>`).join('')}</div>`:'<div class="empty-grade"><div class="grade-empty-icon">▤</div><strong>Nog geen vakgemiddelden</strong><span>Je vakken worden hier automatisch opgebouwd uit je cijfers.</span></div>'}
else{const byPeriod={};grades.forEach(g=>{const p=g.period||g.periode||'Periode';(byPeriod[p]??=[]).push(g)});const periods=Object.entries(byPeriod);ovEl.innerHTML=periods.length?periods.map(([p,list])=>`<div class="overview-block"><h3>${esc(p)}</h3>${list.sort((a,b)=>(new Date(b.date||0))-(new Date(a.date||0))).map(g=>`<button class="overview-row" data-grade-id="${esc(g.id||'')}"><span class="overview-subject">${esc(g.subject||g.vak||'Vak')}</span><span>${esc(g.title||g.omschrijving||'Cijfer')}</span><span class="grade-number ${gradeColor(gradeValue(g))}">${fmtGrade(gradeValue(g))}</span><span class="weight">×${esc(g.weight||g.weging||1)}</span></button>`).join('')}</div>`).join(''):'<div class="empty-grade"><div class="grade-empty-icon">▤</div><strong>Geen cijfers in dit leerjaar</strong><span>Je volledige cijferoverzicht verschijnt hier zodra cijfers beschikbaar zijn.</span></div>'}
  $$('.grade-row,.overview-row').forEach(b=>b.onclick=()=>openGrade(S.grades.find(g=>(g.id||'')===b.dataset.gradeId)));$$('.average-row').forEach(b=>b.onclick=()=>openSubjectGrades(b.dataset.subject));
}
function switchGradeTab(t){S.gradeTab=t;$$('.grade-tab').forEach(b=>b.classList.toggle('active',b.dataset.gradeTab===t));$$('.grade-panel').forEach(p=>p.classList.toggle('active',p.id==='grade'+({latest:'Latest',averages:'Averages',overview:'Overview'}[t])));renderGrades()}
function openGrade(g){if(!g)return;$('#gradeModalTitle').textContent=g.subject||g.vak||'Vak';$('#gradeModalSub').textContent=`${g.title||g.omschrijving||'Cijfer'}${g.date?' · '+gradeDate(g):''}`;$('#gradeModalBody').innerHTML=`<div><span>Cijfer</span><strong class="modal-grade ${gradeColor(gradeValue(g))}">${fmtGrade(gradeValue(g))}</strong></div><div><span>Weging</span><strong>${esc(g.weight||g.weging||1)}</strong></div><div><span>Periode</span><strong>${esc(g.period||g.periode||'—')}</strong></div><div><span>Leerjaar</span><strong>${esc(gradeYear(g))}</strong></div>${g.description||g.omschrijving?`<div class="desc"><span>Omschrijving</span><strong>${esc(g.description||g.omschrijving)}</strong></div>`:''}`;$('#gradeModal').classList.remove('hidden')}
function openSubjectGrades(subject){const list=selectedGrades().filter(g=>(g.subject||g.vak)===subject);$('#gradeModalTitle').textContent=subject;$('#gradeModalSub').textContent=`Vakgemiddelde ${fmtGrade(calcAverage(list))}`;$('#gradeModalBody').innerHTML=list.length?list.sort((a,b)=>(new Date(b.date||0))-(new Date(a.date||0))).map(g=>`<div><span>${esc(g.title||g.omschrijving||'Cijfer')} · ${gradeDate(g)}</span><strong>${fmtGrade(gradeValue(g))} <small>×${esc(g.weight||g.weging||1)}</small></strong></div>`).join(''):'<div><strong>Geen cijfers</strong></div>';$('#gradeModal').classList.remove('hidden')}

document.addEventListener('DOMContentLoaded',()=>{$$('.grade-tab').forEach(b=>b.onclick=()=>switchGradeTab(b.dataset.gradeTab));$('#schoolYear').onchange=()=>{S.schoolYear=$('#schoolYear').value;renderGrades()};$('#gradesRefresh').onclick=()=>renderGrades();$('#closeGrade').onclick=()=>$('#gradeModal').classList.add('hidden');$('#gradeBackdrop').onclick=()=>$('#gradeModal').classList.add('hidden')});
$("#loginForm").onsubmit=async e=>{e.preventDefault();S.email=$("#email").value.trim();if($("#remember").checked)localStorage.setItem("rosterEmail",S.email);else localStorage.removeItem("rosterEmail");localStorage.setItem("currentEmail",S.email);S.key=key(S.email);$("#login").classList.add('hidden');$("#app").classList.remove('hidden');$("#userEmail").textContent=S.email;$("#settingsEmail").textContent=S.email;await restore();try{await get(ref(db,'health'));$("#dbStatus").textContent='Bereikbaar';$(".side-status i").classList.add('ok');$("#dbPill").textContent='Bereikbaar';$("#dbPill").classList.add('green')}catch{}};
$("#logout").onclick=()=>{location.reload()};$("#schoolClear").onclick=()=>{};const saved=localStorage.getItem('rosterEmail');if(saved)$("#email").value=saved;
$$('.nav').forEach(b=>b.onclick=()=>openTab(b.dataset.tab));$("#prev").onclick=()=>{S.week--;render()};$("#next").onclick=()=>{S.week++;render()};$("#load").onclick=loadUrl;$("#ics").onchange=async e=>{const f=e.target.files?.[0];if(f)try{await loadICS(await f.text())}catch(err){setStatus(err.message,true)}};
function showTest(lesson=null){
  $("#testModal").classList.remove("hidden");
  $("#testForm").reset();
  $("#tDate").value=lesson?dayKey(lesson.start):dayKey(new Date());
  $("#tStart").value=lesson?new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Amsterdam",hour:"2-digit",minute:"2-digit",hour12:false}).format(lesson.start):"08:00";
  $("#tSubject").value=lesson?.subject||"";
  $("#tDescription").value=lesson?.description||"";
  $("#tWeight").value="";
  $("#tType").value="small";
}
$("#addTest").onclick=showTest;function closeTest(){$("#testModal").classList.add('hidden')}$("#closeTest").onclick=closeTest;$("#cancelTest").onclick=closeTest;$("#testBackdrop").onclick=closeTest;
$("#testForm").onsubmit=async e=>{e.preventDefault();const t={id:crypto.randomUUID(),subject:$("#tSubject").value.trim(),date:$("#tDate").value,start:$("#tStart").value,end:$("#tEnd").value,type:$("#tType").value,weight:$("#tWeight").value.trim(),description:$("#tDescription").value.trim()};S.tests.push(t);try{await save();render();closeTest();setStatus('Toets opgeslagen in Firebase.')}catch{S.tests.pop();setStatus('Toets opslaan is mislukt.',true)}};
$("#closeModal").onclick=()=>$("#modal").classList.add('hidden');$("#backdrop").onclick=()=>$("#modal").classList.add('hidden');document.addEventListener('keydown',e=>{if(e.key==='Escape'){$("#modal").classList.add('hidden');$("#testModal").classList.add('hidden');$("#gradeModal").classList.add('hidden')}});$("#databaseUrl").textContent=firebaseConfig.databaseURL;
