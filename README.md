# SchoolPortaal — Somtoday + Firebase

GitHub Pages-klare website met een verplichte Firebase-login en een Somtoday-roosterpagina.

## Wat doet de site?

1. Je moet eerst inloggen met Firebase Authentication (e-mail + wachtwoord).
2. Daarna verschijnt de site en het tabblad **Rooster**.
3. Via **Inloggen bij Somtoday** wordt de officiële Somtoday-login geopend.
4. Na je Somtoday-login kun je **Rooster tonen** proberen; de site laadt dan `https://leerling.somtoday.nl/rooster`.

## Belangrijk over Somtoday-login

De website neemt je Somtoday-wachtwoord niet over en probeert geen wachtwoorden of sessiecookies te onderscheppen. Somtoday beheert de eigen login.

Een GitHub Pages-site kan bovendien niet garanderen dat de ingelogde Somtoday-pagina in een iframe wordt weergegeven. Dat hangt af van Somtoday-beveiligingsheaders en browser privacy/third-party cookiebeleid. Als inbedding wordt geblokkeerd, gebruik **Open rooster in Somtoday** voor de officiële pagina.

## Firebase instellen

Zet in Firebase Console bij **Authentication → Sign-in method** de provider **Email/Password** aan.

Controleer daarna bij **Realtime Database → Rules** dat alleen geauthenticeerde gebruikers toegang krijgen tot de nodes die de site moet lezen. Gebruik geen openbare `read: true` / `write: true` regels voor persoonlijke gegevens.

## GitHub Pages

Upload alle bestanden naar de repository-root en activeer **Settings → Pages → Deploy from a branch → main → /(root)**.
