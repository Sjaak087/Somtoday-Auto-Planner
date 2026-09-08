# SchoolPortaal — Somtoday rooster

Deze versie is gemaakt voor GitHub Pages en gebruikt de officiële Somtoday-agenda/iCalendar-koppeling als roosterbron. Somtoday geeft leerlingen volgens de servicedocumentatie een iCalendar-koppeling voor roosterafspraken.

## Gebruik
1. Open de site en log in op het SchoolPortaal.
2. Open Somtoday en ga naar **Instellingen → Agenda**. Doorloop de stappen om je iCalendar-koppeling te krijgen.
3. Plak de iCalendar-link in het veld op de Rooster-pagina en klik **Rooster laden**.
4. Wanneer jouw browser CORS op de Somtoday-link blokkeert, open de iCalendar-link in je browser, sla het `.ics`-bestand op en gebruik **.ics importeren**.

De site leest uitsluitend roosterafspraken uit de iCalendar-feed en toont deze per week.

## Firebase
Firebase staat in `firebase-config.js`. Zet voor productie passende Firebase Authentication/Realtime Database Security Rules aan.
