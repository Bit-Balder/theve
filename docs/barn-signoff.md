# Barns kvällsavslut · etapp 8

Barn följer ett fast dagligt sändningsdygn i svensk lokal tid:

| Tid | Läge | Bildkälla |
| --- | --- | --- |
| 06.00–18.55 | Ordinarie barninnehåll | Schemalagt katalogobjekt |
| 18.55–19.00 | Godnattvinjett | `ident` i tablån |
| 19.00–06.00 | Sändningsuppehåll | Lokal analog slutskylt |

Gränserna är halvöppna. Innehållet som börjar 18.55 gäller därför exakt från
18.55.00, och slutskylten tar över exakt 19.00.00. Vid 06.00.00 gäller dagens
morgonprogram utan att hela sidan behöver laddas om.

## Var beteendet styrs

- `data/source/channels.json` anger `signOffAt: "19:00"`.
- `data/source/schedule.json` beskriver program, vinjett och uppehåll.
- `public/assets/cards/barn-off-air.svg` är den egna lokala slutskylten.
- `npm run data:build` expanderar tiderna korrekt för `Europe/Stockholm`.

Slutskylten ligger som `asset` på en vanlig `off_air`-slot. Spelvyn läser
fältet generellt; den innehåller ingen regel som frågar efter kanal-ID `barn`.
Det gör samma mekanism återanvändbar för andra planerade sändningsuppehåll.

## Förväntat beteende

- Barninnehåll kan inte startas mellan 19.00 och 06.00.
- Byte till en annan kanal och tillbaka visar fortfarande slutskylten.
- Vid 06.00 visas aktuellt morgonprogram vid nästa tablåuppdatering eller
  kanalval, utan full sidomladdning.
- Slutskylten fungerar utan Internet Archive och utan nätanslutning efter att
  webbappen har laddats.

## Ändra tiderna

Ändra kanalens `signOffAt` och Barns tre slotar tillsammans. Anpassa även
testprogrammets längd i `data/source/catalog.json`, kör `npm run data:build`
och därefter `npm run check`. Gränstesterna ska alltid innehålla ögonblicken
precis före 18.55, exakt 18.55, exakt 19.00, precis före 06.00 och exakt 06.00.
