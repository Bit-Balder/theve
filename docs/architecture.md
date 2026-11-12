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
- `data/schema/` innehåller versionsstyrda JSON Schema-kontrakt.
- `data/source/` innehåller granskad källdata som aldrig publiceras direkt.
- `scripts/` validerar och genererar deterministisk publik data.
- `public/data/` innehåller endast data som klarat publiceringsgrinden.
- `tests/` innehåller tester för ren logik och kontrakt.

Schemamodulen är redan delad i två lager:

- `scripts/lib/schedule-compiler.mjs` expanderar veckomallar i svensk lokal tid
  till ett versionsstyrt UTC-schema vid bygge;
- `src/core/schedule-engine.ts` väljer nuvarande och nästa slot och räknar
  uppspelningsposition från ett uttryckligt millisekundvärde.

Kompilatorn använder tidszonsdata, medan körmotorn bara läser färdiga
UTC-tider. Båda är fria från DOM- och videoberoenden och kan testas isolerat.
Kommande etapper kopplar katalog, spelare och Text-TV till dessa kontrakt.

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

`npm run check` kör lint, test, ett separat tidszonstest och produktionsbygge i
den ordningen. Samma kommando används lokalt och i GitHub Actions.

Produktionsbygget kräver att `public/data/` exakt motsvarar källdatan. På
`main` publicerar en separat Pages-workflow den färdiga `dist/`-mappen via ett
GitHub Pages-artifact; byggfiler checkas inte in i huvudbranchen.

