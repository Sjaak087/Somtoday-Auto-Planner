# Mijn Rooster

GitHub Pages-klare Somtoday-achtige rooster- en cijferpagina.

## Cijferhistorie
De Cijfers-tab ondersteunt meerdere schooljaren. Cijfers kunnen worden opgeslagen met een expliciet `schoolYear`/`schooljaar`/`year`/`leerjaar`-veld en worden automatisch onder het juiste leerjaar geplaatst. Er is ook een optie **Alle leerjaren**.

De Firebase-opslag houdt zowel `grades` als `gradesByYear` bij per account.

Let op: de huidige site-login gebruikt alleen het e-mailadres als account-sleutel. Daarmee kan de site niet zelfstandig geautoriseerde Somtoday-cijfers uit een privéaccount ophalen. Voor echte automatische synchronisatie met Somtoday is een Somtoday-authenticatietoken/ondersteunde koppeling nodig. De Somtoday API-documentatie beschrijft afzonderlijke endpoints voor cijfers en schooljaren die authenticatie vereisen. Zie: https://github.com/elisaado/somtoday-api-docs
