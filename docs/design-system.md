# Designsystem · etapp 2

Det här dokumentet beskriver det gemensamma visuella skal som senare etapper
ska bygga vidare på. Komponenter ska använda tokens i stället för lokala
färgkoder och specialmått.

## Typsnitt

| Roll | Font | Användning |
| --- | --- | --- |
| TV och Text-TV | TDAText | Menyer, rubriker, brödtext och Text-TV:s 40 × 24-grid |
| Siffror och teknisk text | VT323 | Kanalnummer, klockor och äldre datortext |

TDAText kommer från `tinelix/TDAText` och VT323 från användarens Google Fonts
paket. Båda är oförändrade och licensierade enligt SIL Open Font License 1.1.
Originallicenserna finns i `docs/font-licenses/`.

## Färger

De fem färgtokens är TV-blå, gul, korall, gräddvit och Text-TV-svart. Exakta
värden definieras en gång i `src/styles/tokens.css`. Toner skapas med
genomskinlighet eller `color-mix`, inte med nya hexvärden.

## Logotyper

Theves masterlogotyp och kanalernas märken använder samma grid. Fullstor
viewBox är `0 0 320 96`; kompakt kanalbugg använder `0 0 240 72`. Säker yta är
fem procent. De tre färglinjerna är tre enheter höga, har fem enheters mellanrum
och ligger på samma vertikala position i alla fullstora märken.

Fullfärg och gräddvit används mot TV-blå eller svart. Svart variant används
mot gräddvit eller gul. Minsta rekommenderade bredd är 128 pixlar för full
logotyp och 72 pixlar för kanalbugg. Se `public/assets/logos/manifest.json` för
det maskinläsbara kontraktet.

## TV-yta och säker yta

- `TvShell` centrerar TV-ytan mot svart letterbox.
- `Screen43` är alltid 4:3 och sträcks inte efter webbläsarfönstret.
- Säker yta lämnar 6 procent i sidled och 5,5 procent upptill och nedtill.
- All primär text och alla kontroller ligger inom den säkra ytan.

## Analog slutskylt

Barns slutskylt är ett eget lokalt 4:3-SVG-original. Den använder endast de
fem färgtokens, den mjuka gula solen från Barns identitet och raka analoga
linjer. Bilden skalas med `contain`, hämtar inga externa resurser och förblir
läsbar även när CRT-effekten är avstängd.

## Text-TV

Text-TV använder ett fast rutnät med 40 tecken och 24 rader inom 4:3-ytan.
Varje rad fylls eller klipps av den rena sidgeneratorn; horisontell scroll och
HTML från externa källor är inte tillåten. Svart är bakgrund, gräddvit är
brödtext, gul markerar rubrik och sidfot, korall markerar varning och TV-blå
används i huvudraden. Gammal eller saknad data får korall rubrik.

## Fokus och fjärrkontroll

Grundmenyn och programguiden kan användas med piltangenter, Home, End och
Enter. Fokus flyttas cirkulärt och kräver inte hover. I sändningsläget byter
pil upp/ned kanal. Fokusringen består av gräddvit, svart och gul och visas i
formprovet på blå, svart, gul och korall bakgrund.

## CRT

CRT-läget är `subtle` som standard och kan stängas av i menyn. Effekten ligger
ovanpå bilden, tar inte emot klick och påverkar inte layouten. Vid
`prefers-reduced-motion: reduce` stängs den rörliga delen alltid av.

## Visuell kontroll

Referensbilder skapas från produktionsbygget i följande viewporter:

- `800 × 600`: exakt 4:3.
- `1440 × 900`: bred skärm med 4:3-yta och svart letterbox.

Bilderna ligger i `docs/visual-tests/`. De kontrolleras för oförvrängd 4:3,
säker yta, läsbar text och synlig fokusmarkering.

## Kända avgränsningar

- Kanalvinjetterna har ett kort gemensamt insteg och ett stillastående slutläge.
  Ljud och längre rörelsesekvenser ingår inte ännu.
- Fysisk TV eller TV-box väljs och provas i en senare etapp. Etapp 2 provas i
  TV-liknande 16:10- och 4:3-viewporter.
