# Designsystem · etapp 2

Det här dokumentet beskriver det gemensamma visuella skal som senare etapper
ska bygga vidare på. Komponenter ska använda tokens i stället för lokala
färgkoder och specialmått.

## Typsnitt

| Roll | Font | Användning |
| --- | --- | --- |
| TV och Text-TV | TDAText | Menyer, rubriker, brödtext och framtida Text-TV |
| Siffror och teknisk text | VT323 | Kanalnummer, klockor och äldre datortext |

TDAText kommer från `tinelix/TDAText` och VT323 från användarens Google Fonts
paket. Båda är oförändrade och licensierade enligt SIL Open Font License 1.1.
Originallicenserna finns i `docs/font-licenses/`.

## Färger

De fem färgtokens är TV-blå, gul, korall, gräddvit och Text-TV-svart. Exakta
värden definieras en gång i `src/styles/tokens.css`. Toner skapas med
genomskinlighet eller `color-mix`, inte med nya hexvärden.

## TV-yta och säker yta

- `TvShell` centrerar TV-ytan mot svart letterbox.
- `Screen43` är alltid 4:3 och sträcks inte efter webbläsarfönstret.
- Säker yta lämnar 6 procent i sidled och 5,5 procent upptill och nedtill.
- All primär text och alla kontroller ligger inom den säkra ytan.

## Fokus och fjärrkontroll

Grundmenyn kan användas med piltangenter, Home, End och Enter. Fokus flyttas
cirkulärt och kräver inte hover. Fokusringen består av gräddvit, svart och gul
och visas i formprovet på blå, svart, gul och korall bakgrund.

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

- CSS-symbolen för Theve är ett formprov; slutlig SVG-logotyp hör till etapp 7.
- Starta TV bekräftar endast knapptryckningen; spelare och sändning hör till
  etapp 5.
- Fysisk TV eller TV-box väljs och provas i en senare etapp. Etapp 2 provas i
  TV-liknande 16:10- och 4:3-viewporter.
