# Kanalidentiteter · etapp 7

Theve använder en gemensam konstruktion för masterlogotypen och de nio
videokanalerna. Alla märken är egna SVG-original och använder endast TV-blå,
gul, korall, gräddvit och svart.

## Kanalplan

| Kanal | Profil | Motiv | Accent |
| --- | --- | --- | --- |
| 01 TV1 | Nyheter och kultur | Soluppgång och horisont | Gul |
| 02 TV2 | Politik och samhälle | Geometriska pelare | Gräddvit |
| 03 TV3 | Serier | TV-ram | Korall |
| 04 TV4 | Nöje och musik | Rytmiska nivåer | Gul |
| 05 TV5 | Film | Filmruta | Gräddvit |
| 06 TV6 | Tecknat | Cirkel, vinkel och ruta | Korall |
| 07 TV7 | True crime | Sökglas | Gräddvit |
| 08 Barn | Barnprogram | Mjuk sol | Gul |
| 09 Natur | Natur och djur | Berg, sol och vattenlinjer | Gul |

Nummer och namn är fastställda. Motiven är avsiktligt enkla och bygger inte på
verkliga TV-bolags kännetecken.

## Filer och varianter

Varje ID har fyra filer i `public/assets/logos/`:

- `<id>.svg`: fullfärg för TV-blå eller svart bakgrund;
- `<id>-cream.svg`: enfärgad gräddvit för mörk bakgrund;
- `<id>-black.svg`: enfärgad svart för gräddvit eller gul bakgrund;
- `<id>-bug.svg`: kompakt kanalbugg med nummer och ordmärke.

Theve använder samma suffix och regler. `manifest.json` anger viewBox,
filsökvägar, tillåtna bakgrunder och minsta storlekar.

## Konstruktion

- Fullstor viewBox: `0 0 320 96`.
- Kompakt viewBox: `0 0 240 72`.
- Säker yta: minst fem procent.
- Tre fullstora linjer: höjd 3, mellanrum 5.
- Full logotyp: minst 128 pixlar bred.
- Kompakt kanalbugg: minst 72 pixlar bred.
- Inga toningar, filter, glaseffekter eller skuggor finns i SVG-originalen.

Kanalvinjetten använder en kort stegvis inflyttning och stannar i ett tydligt
slutläge. `prefers-reduced-motion` tar bort rörelsen men behåller slutläget.

## Ändra en identitet

1. Ändra definitionen i `scripts/lib/logo-system.mjs`.
2. Kör `npm run logos:build`.
3. Ändra vid behov kanalens `theme` eller logotypsökvägar i
   `data/source/channels.json`.
4. Kör `npm run data:build`.
5. Kör `npm run check`.

Redigera inte de genererade SVG-filerna direkt. En ändring ska gå genom den
gemensamma mallen så att grid, linjerytm och varianter fortsätter vara lika.
