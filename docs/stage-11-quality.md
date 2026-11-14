# Kvalitet kompatibilitet och innehållsgranskning

Etapp 11 stabiliserar Theve som release candidate. Automatiska kontroller täcker
de webbläsare och skärmstorlekar som går att reproducera i GitHub Actions. Den
avslutande kontrollen på familjens faktiska skärm måste göras av en person som
inte har byggt produkten.

## Testmatris

| Mål | Storlek | Flöde | Typ |
| --- | ---: | --- | --- |
| Chromium | 800 × 600 | Start, kanalbyte, guide, Text-TV, Barns avslut | Automatisk |
| Firefox | 800 × 600 | Start, kanalbyte, guide, Text-TV, Barns avslut | Automatisk |
| WebKit | 800 × 600 | Start, kanalbyte, guide, Text-TV, Barns avslut | Automatisk |
| TV-liknande Chromium | 1280 × 720 | Samma fulla fjärrkontrollflöde | Automatisk emulering |
| Smal eller 200 procent | 400 × 300 | Fokus, guide, Text-TV och ingen sidscroll | Automatisk |
| Familjens TV eller TV-box | Faktisk skärm | Hela kontrollpunkten | Manuell, väntar på projektägaren |

## Visuell regression

Referensbilderna ligger i `e2e/__screenshots__/` och tas i Chromium med lokala
fontfiler, fast klocka, reducerad rörelse och avstängda animationer.

- `start-4x3.png`: programguiden som första 4:3-vy.
- `channel-logo.png`: kanalens fulla logotyp direkt efter kanalval.
- `text-tv-vt323.png`: 40 × 24, VT323 och svenska tecken.
- `barn-slutskylt.png`: analog lokal slutskylt efter 19.00.

## Prestanda och nätverk

`npm run quality:audit` granskar det faktiska `dist/`-artifactet. Budgeten är
1,5 MB totalt, 200 kB JavaScript och 80 kB CSS före överföringskomprimering.
Videofiler är förbjudna. Webbläsartestet bekräftar att startkatalogen inte gör
externa anrop; Internet Archive kontaktas först när ett separat godkänt
arkivprogram faktiskt ligger i tablån.

## Tillgänglighet

- Kritiska färgpar måste klara WCAG AA för normal text.
- Fokus är synligt och flödet kan genomföras utan mus.
- 400 × 300-testet motsvarar den arbetsyta som återstår vid kraftig zoom.
- `prefers-reduced-motion` stänger av CRT och kanalanimation.
- CRT kan stängas av manuellt och valet sparas lokalt.
- Text-TV är text i DOM, inte en bild eller HTML från extern källa.

## Kvarvarande kontrollpunkt

Följ [det manuella acceptansprotokollet](manual-tests/2026-11-13-stage-11-family.md).
Etappen kan inte signeras helt innan den kontrollen och startkatalogens
projektägarsignering är bekräftade.

Det automatiska utfallet finns i
[testprotokollet för etapp 11](manual-tests/2026-11-13-stage-11-automated.md).
