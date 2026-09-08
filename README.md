# SchoolPortaal — Somtoday + Firebase

GitHub Pages-klare schoolportaal-demo met:

- Firebase Authentication voor de toegang tot de website.
- Los `firebase-config.js` bestand voor de Firebase webconfig.
- Firebase Realtime Database health check.
- Tab **Rooster** met een koppeling naar de officiële Somtoday leerlingomgeving.
- Weeknavigatie in de portalinterface.

## Belangrijk over Somtoday-login

Somtoday gebruikt een eigen sessie/cookie op een ander domein. Een gewone GitHub Pages-site kan die sessie niet uitlezen of afdwingen. Daarom werkt de flow zo:

1. Log in via **Inloggen bij Somtoday**.
2. Ga terug naar deze site.
3. Klik **Ik ben ingelogd**.
4. De site laadt daarna `https://leerling.somtoday.nl/rooster` in de ingebouwde weergave.

Een browser kan het ingebouwde Somtoday-scherm alsnog blokkeren wanneer Somtoday iframe-embedding of third-party cookies beperkt. In dat geval gebruik je **Open rooster in Somtoday**.

## Firebase Authentication activeren

Zet in Firebase Console bij Authentication → Sign-in method → Email/Password aan.

## GitHub Pages

Upload de inhoud van deze map naar een GitHub-repository en zet GitHub Pages aan voor de branch/map waarin `index.html` staat.
