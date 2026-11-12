# Arkitekturgrund

Etapp 1 håller Theve litet och statiskt. Klienten byggs med Vite och modulär
TypeScript utan ramverk eller serverberoende.

## Moduler

- `src/main.ts` startar webbläsarappen och kopplar samman modulerna.
- `src/app.ts` bygger den aktuella vyn från en enkel vy-modell.
- `src/core/` innehåller ren produkt- och domänlogik utan DOM-beroenden.
- `src/styles/` innehåller gemensamma tokens och basstilar.
- `tests/` innehåller tester för ren logik och kontrakt.

Kommande etapper lägger till tid, schema, katalog, spelare, fokusmodell och
Text-TV bakom separata moduler. Kärnlogik ska kunna testas utan DOM och video.

## Distribution

`vite.config.ts` använder en relativ bas (`./`). Produktionsbygget fungerar
därför under GitHub Pages projektadress och vid lokal statisk förhandsvisning.
GitHub Pages är offentligt; familjesyftet är en produktavgränsning, inte ett
åtkomstskydd.

## Kvalitetsgrind

`npm run check` kör lint, test och produktionsbygge i den ordningen. Samma
kommando används lokalt och i GitHub Actions.

