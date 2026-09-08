# Mijn Rooster

GitHub Pages-klare roosterpagina in Somtoday-achtige stijl.

## Toetsherkenning
De site kijkt **niet naar de naam van het vak of de les**. Voor de oranje/rode toetsmarkering wordt alleen de extra metadata van een iCalendar-afspraak gebruikt, zoals `DESCRIPTION`, `CATEGORIES`, `ATTACH` en `X-*` velden.

- kleine toets: oranje
- grote toets / toets: rood
- klikken op een les/toets opent de details

Een losse `Toets`-markering in de extra metadata wordt als kleine toets behandeld, passend bij het oranje toets-icoon uit Somtoday. Een expliciete grote-toetsmarkering heeft voorrang.

## Toetsen toevoegen
Klik op een les/vak in het rooster en kies **+ Toets toevoegen**. Kies kleine of grote toets. De toets wordt per account opgeslagen in Firebase en de gekoppelde les wordt automatisch oranje of rood weergegeven.
