# SchoolPortaal — Somtoday rooster

Deze versie gebruikt Firebase Realtime Database om per SchoolPortaal-account de Somtoday iCalendar-link én de laatst opgehaalde `.ics`-inhoud te bewaren.

## Wat is aangepast
- De iCalendar-link wordt opgeslagen in Firebase onder het Firebase-anonieme account + jouw ingevoerde e-mailadres.
- De laatst opgehaalde `.ics` wordt ook opgeslagen. Bij opnieuw openen wordt het rooster daardoor direct uit Firebase hersteld.
- `webcal://`-links worden automatisch omgezet naar `https://`.
- Als de browser de Somtoday-link door CORS niet rechtstreeks mag ophalen, probeert de site de meegeleverde Firebase Function `syncCalendar`.
- Kleine toetsen zijn oranje, grote toetsen rood en afspraken blijven klikbaar met detailinformatie.

## Eenmalig in Firebase
1. Zet in Firebase Console → Authentication → Sign-in method **Anonymous** aan.
2. Importeer `database.rules.json` als Realtime Database Rules.
3. Installeer Firebase CLI en voer vanuit deze map uit:

```bash
npm install -g firebase-tools
firebase login
firebase use somtoday-auto-planner
cd functions
npm install
cd ..
firebase deploy --only database,functions
```

De Function draait in `europe-west1`.

### Belangrijk over de Somtoday-link
De iCalendar-token is persoonlijk. Bewaar hem alleen in je eigen Firebase-account en deel hem niet openbaar. Somtoday geeft leerlingen de iCalendar-koppeling via **Instellingen → Agenda → Aan de slag**. De externe agenda bevat volgens Somtoday alleen roosterafspraken; toetsen/huiswerk uit de Somtoday-agenda worden niet via die iCalendar-koppeling meegestuurd.

## GitHub Pages
De webbestanden in de hoofdmap kun je rechtstreeks als GitHub Pages publiceren. De Firebase Function is een apart backend-deel en moet één keer naar jouw Firebase-project worden gedeployed.


## Openbare Firebase-opslag
Deze versie slaat de kalenderlink en het laatste rooster openbaar op onder `accounts/<accountKey>`. De browser hoeft geen Firebase Authentication meer te gebruiken. Let op: iedereen die de database-URL kent, kan deze gegevens lezen of aanpassen als deze Rules zijn gedeployed.
