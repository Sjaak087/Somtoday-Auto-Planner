# SchoolPortaal — Somtoday + Firebase

Een GitHub Pages-klare site met:

- een tab **Rooster** met een ingebedde Somtoday-leerlingomgeving;
- een aparte `firebase-config.js` voor de Firebase configuratie;
- een eenvoudige weekbalk in de nieuwe site;
- een instellingenpagina met Firebase-status;
- responsive ontwerp voor desktop en mobiel.

## Bestanden

- `index.html` — pagina en tabs
- `styles.css` — vormgeving
- `app.js` — navigatie, Somtoday iframe en Firebase-check
- `firebase-config.js` — losse Firebase-config

## GitHub Pages

1. Maak een nieuwe GitHub repository.
2. Upload alle bestanden uit deze map naar de repository-root.
3. Ga naar **Settings → Pages**.
4. Kies **Deploy from a branch**, daarna `main` en `/ (root)`.
5. Open de gegenereerde GitHub Pages-URL.

## Belangrijke Somtoday-opmerking

De site gebruikt exact de door jou gegeven leerling-URL in een `iframe`. Of Somtoday ook werkelijk in een iframe zichtbaar wordt, wordt bepaald door de beveiligingsheaders van Somtoday en door de browser. Als Somtoday framing blokkeert, werkt de knop **Open volledig** wel en opent de officiële omgeving in een apart tabblad.

Een frontend op GitHub Pages kan niet zomaar de inhoud van een ingelogde Somtoday-pagina uitlezen via JavaScript door browserbeveiliging (same-origin/CORS). Daarom wordt de Somtoday-pagina zelf ingeladen in plaats van login-cookies of wachtwoorden te kopiëren.

## Firebase

De Firebase web-config staat in `firebase-config.js`. Firebase-configwaarden zoals `apiKey`, `projectId` en `appId` zijn project/app-identifiers; bescherming van je database hoort via Firebase Security Rules en eventueel App Check/Auth te gebeuren.

De huidige app doet alleen een `health` read om te controleren of de database bereikbaar is. Je kunt daarna je eigen data-structuur toevoegen zonder `index.html` te wijzigen.

### Voorbeeldregels

Gebruik niet zomaar openbare read/write-regels voor een echte persoonlijke database. Kies regels passend bij je authenticatie en datamodel.
