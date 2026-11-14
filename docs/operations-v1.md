# Driftmanual för Theve v1

Theve publiceras som en statisk webbapp via GitHub Actions och GitHub Pages.
GitHub Pages ska använda källan **GitHub Actions**, inte **Deploy from a
branch**. Workflowen `Quality` publicerar bara en revision på `main` efter att
hela kvalitetsgrinden är godkänd.

## Kontrollera en kataloguppdatering

1. Ändra endast granskad källdata i `data/source/`.
2. Kör `npm run data:build`.
3. Kör `npm run check`.
4. Granska ändringen i källdata, `public/data/manifest.json` och
   `artifacts/catalog/catalog-audit.json`.
5. Skapa en pull request och låt `Quality` bli grön.
6. Merga först efter rättighets- och familjegranskning.

Varje publicerat katalogobjekt måste ha godkänd rättighetsstatus, godkänd
familjestatus och tillåten publicering. Internet Archive-material kräver en
låst licenslänk; teknisk spelbarhet är inte ett rättighetsgodkännande.

## Ta bort eller stoppa ett program

1. Ta bort programmet ur berörd veckomall eller ersätt sloten med en godkänd
   reservpost.
2. Ta bort katalogobjektet om det inte längre ska kunna schemaläggas.
3. Kör `npm run data:build` och `npm run check`.
4. Öppna en prioriterad pull request och kontrollera den byggda tablån.
5. Merga. Pages publicerar den godkända revisionen automatiskt.

Vid akut rättighetsproblem ska det osäkra objektet inte ligga kvar enbart för
att undvika reservbild.

## Kontrollera publiceringen

1. Öppna repots `Actions` och välj den senaste körningen `Quality`.
2. Kontrollera att `Lint, test and build`, `Package approved Pages build` och
   `Deploy approved Pages build` är gröna.
3. Öppna Pages-adressen via HTTPS.
4. Öppna `INFO` och jämför version, datarevision och källrevision med den
   revision som skulle publiceras.
5. Prova programguiden, en kanal, Text-TV och Back utan mus.

## Återställ en felaktig publicering

Använd GitHubs **Revert** på den felaktiga pull requesten, eller skapa en ny
pull request som återställer samma filer till den senast godkända revisionen.
Merga inte direkt utan kvalitetskontroll. När revert-ändringen ligger på
`main` bygger och publicerar samma workflow om den tidigare versionen.

Om felet gäller innehåll ska en säker reservtablå prioriteras. Försök inte
återställa en äldre revision som innehåller material vars rättighet har
upphört.

## Driftkontroll efter återställning

- `Quality` är grön på återställningsrevisionen.
- Pages-adressen svarar via HTTPS.
- `INFO` visar förväntad version och datarevision.
- Den felaktiga kanalen eller katalogposten visas inte.
- Guide, kanalbyte, Text-TV och Back fungerar.

