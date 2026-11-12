# Arkitekturgrund

Etapp 1 håller Theve litet och statiskt. Klienten byggs med Vite och modulär
TypeScript utan ramverk eller serverberoende.

## Moduler

- `src/main.ts` startar webbläsarappen och kopplar samman modulerna.
- `src/app.ts` sätter samman den aktuella vyn från återanvändbara komponenter.
- `src/components/` innehåller `TvShell`, `Screen43` och fokusmenyn.
- `src/core/` innehåller ren produkt- och domänlogik utan DOM-beroenden.
- `src/styles/` innehåller fontdefinitioner, tokens, basstilar och komponentstilar.
- `src/assets/fonts/` innehåller licensierade lokala fontfiler.
- `tests/` innehåller tester för ren logik och kontrakt.

Kommande etapper lägger till tid, schema, katalog, spelare, fokusmodell och
Text-TV bakom separata moduler. Kärnlogik ska kunna testas utan DOM och video.

## Designskal

`TvShell` skapar letterboxytan och styr CRT-läget. `Screen43` håller alltid
förhållandet 4:3 och exponerar en säker innehållsyta. Fokusmenyn använder en
ren navigationsfunktion från `src/core/`, så piltangenter kan testas utan DOM.

Alla färger, avstånd, typsnitt, fokusvärden, CRT-värden och 4:3-mått kommer
från `tokens.css`. Komponentstilar innehåller inga egna hexvärden.

## Distribution

`vite.config.ts` använder en relativ bas (`./`). Produktionsbygget fungerar
därför under GitHub Pages projektadress och vid lokal statisk förhandsvisning.
GitHub Pages är offentligt; familjesyftet är en produktavgränsning, inte ett
åtkomstskydd.

## Kvalitetsgrind

`npm run check` kör lint, test och produktionsbygge i den ordningen. Samma
kommando används lokalt och i GitHub Actions.

