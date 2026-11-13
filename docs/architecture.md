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
- `public/assets/logos/` innehåller genererade SVG-original och manifest.
- `tests/` innehåller tester för ren logik och kontrakt.
- `e2e/` kör kärnflödet i Chromium med samma tangenttryckningar som en enkel
  fjärrkontroll.

Schemamodulen är redan delad i två lager:

- `scripts/lib/schedule-compiler.mjs` expanderar veckomallar i svensk lokal tid
  till ett versionsstyrt UTC-schema vid bygge;
- `src/core/schedule-engine.ts` väljer nuvarande och nästa slot och räknar
  uppspelningsposition från ett uttryckligt millisekundvärde.

Kompilatorn använder tidszonsdata, medan körmotorn bara läser färdiga
UTC-tider. Båda är fria från DOM- och videoberoenden och kan testas isolerat.

Spelarkedjan är också uppdelad:

- `src/core/internet-archive.ts` hämtar och normaliserar opålitlig metadata,
  väljer publika MP4-kandidater och exponerar alternativa derivat;
- `src/core/player-controller.ts` äger ett litet, testbart gränssnitt mot
  HTML-video, söker till tablåns offset och hanterar timeout och decodefel;
- `src/core/playback-service.ts` avbryter gammal metadata eller media vid nytt
  kanalval och kopplar adapterfel till reservbild.

Kanal- och guideflödet konsumerar dessa API:er utan att känna till Internet
Archives JSON-format eller spelarens interna tillstånd. Det är uppdelat i:

- `public-tv-data.ts`, som laddar fyra filer med samma revision;
- `remote-input.ts`, som normaliserar tangentbord och alternativa TV-koder;
- `channel-navigation.ts` och `direct-number-buffer.ts`, som håller
  kanalvalet fritt från DOM;
- `overlay-back-stack.ts`, som stänger senaste överlägget först;
- `channel-guide.ts`, som äger roving tabindex och fokusåterställning.
- `teletext.ts`, som äger sidorna 100, 300, 301, 400 och 500 och sin egen
  tresiffriga navigering.

Logotyperna byggs i ett separat deterministiskt flöde. Definitionerna i
`scripts/lib/logo-system.mjs` innehåller kanalens motiv, ordmärke och accent.
`scripts/build-logos.mjs` använder samma viewBox, säkra yta och linjerytm för
att generera fullfärg, gräddvit, svart och kompakt variant. UI-komponenterna
läser sökväg och `theme` från kanaldata; ingen kanal har en egen komponent.

Planerade sändningsuppehåll använder samma datadrivna väg. En `off_air`-slot
kan ange en lokal SVG i `asset`. Spelvyn visar då tillgången i stället för
videoytan, oavsett kanal-ID. Barns kvällsavslut behöver därför varken en
kanalspecifik UI-komponent eller en Internet Archive-hämtning.

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

Videofiler proxas eller lagras inte av Theve. En godkänd Internet Archive-fil
levereras direkt från `archive.org`, medan repot endast innehåller identifierare
och rättighetsunderlag.

## Kvalitetsgrind

`npm run check` kör lint, enhetstester, ett separat tidszonstest,
produktionsbygge och Playwright-flödet i den ordningen. Samma kommando används
lokalt och i GitHub Actions.

Produktionsbygget kräver att både `public/data/` och SVG-originalen exakt
motsvarar sina källor. På
`main` publicerar en separat Pages-workflow den färdiga `dist/`-mappen via ett
GitHub Pages-artifact; byggfiler checkas inte in i huvudbranchen.

