# Manuell kontroll · etapp 6

Datum: 12 november 2026  
Miljö: lokal Vite-vy i Chromium-baserad inbyggd webbläsare, 4:3 TV-yta  
Inmatning: Mac-tangentbord använt som fjärrkontrollsliknande enhet

## Genomfört flöde

| Steg | Förväntat | Resultat |
| --- | --- | --- |
| Enter på Starta TV | TV-läget öppnas och får fokus | Godkänt |
| Pil upp från kanal 1 | Kanal 2 visas | Godkänt |
| Direktnummer 3 | Buffert visas och Natur TV väljs efter en sekund | Godkänt |
| G | Guiden öppnas på aktuell kanal | Godkänt |
| Pil ned och Enter | Fokus flyttas, Retro TV väljs och guiden stängs | Godkänt |
| G och Escape | Guiden stängs utan nytt kanalval | Godkänt |
| Fokus efter stängning | Fokus återgår till TV-ytan | Godkänt |

Vid första visuella passet syntes startskärmens fokusprov ovanpå sändningen.
En gemensam regel för `[hidden]` lades till och kontrollen kördes om. Efter
rättningen visades endast sändningsytan, kanalbuggen och den tillfälliga
programinformationen.

Programguiden visade fem kanaler med läsbara `NU`- och `NÄSTA`-kolumner. Nästa
program var text och kunde inte aktiveras. Ingen del av kontrollen använde mus
eller hover.

Fysisk TV-fjärr och målenhet provas fortfarande i den samlade enhetsmatrisen i
etapp 11. Den här kontrollen verifierar den standardiserade tangentbords- och
fjärradaptern som etapp 6 kräver.
