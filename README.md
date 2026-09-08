# Somtoday GitHub-site

GitHub Pages-klare schoolsite met losse Firebase-config en een Somtoday-stijl login.

De site vraagt geen Somtoday-wachtwoord en stuurt geen wachtwoord naar Firebase of GitHub. Na het invullen van school/gebruikersnaam wordt de officiële Somtoday-login geopend via `https://inloggen.somtoday.nl/`.

Een gewone GitHub Pages-site kan de Somtoday-sessie niet uitlezen of een wachtwoord-login namens de leerling uitvoeren zonder een officiële Somtoday-integratie/API.

Controleer in Firebase Console of Anonymous Authentication is ingeschakeld als je de Firebase-loginstatus wilt gebruiken. Beveilig de Realtime Database met passende Security Rules.
