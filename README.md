# Mijn Rooster — GitHub Pages

Alle bestanden staan rechtstreeks in deze map/ZIP: er zijn geen `functions`- of andere submappen.

## Toetsen
Somtoday geeft aan dat toetsen en huiswerk niet via de iCalendar-koppeling worden gesynchroniseerd. Daarom kan de website een toets die alleen in de Somtoday Studiewijzer staat niet automatisch uit de iCalendar-URL halen. Met **+ Toets** kun je de toets toevoegen; hij verschijnt daarna rood/oranje in hetzelfde rooster en de details zijn klikbaar. De toetsgegevens worden per e-mailadres opgeslagen in Firebase.

## Firebase
Gebruik `database.rules.json` als Realtime Database Rules voor de gewenste openbare accountopslag. Dit betekent dat iedereen de opgeslagen gegevens kan lezen/schrijven. Gebruik daarom geen geheime informatie.
