# Fjärrkontroll, programguide och Text-TV · etapp 9

Alla primära funktioner fungerar utan mus. Webbläsaren använder vanliga
tangentbordshändelser som grund och översätter kända alternativa TV-koder till
samma lilla uppsättning handlingar.

## Knappkarta

| Funktion | Standard | Alternativa koder |
| --- | --- | --- |
| Starta TV | Enter på startknappen | OK, Select, Accept |
| Kanal upp | Pil upp | ChannelUp, PageUp, keyCode 427 |
| Kanal ned | Pil ned | ChannelDown, PageDown, keyCode 428 |
| Direktnummer | 0–9 | Digit0–9, Numpad0–9 |
| Programguide | G | Guide, keyCode 458 |
| Text-TV | T eller TXT | Teletext, keyCode 459 |
| Back/stäng | Escape eller Backspace | BrowserBack, GoBack, Back, keyCode 461 |
| Bekräfta | Enter | OK, Select, Accept |

Exakta extrakoder varierar mellan TV-apparater. Nya koder läggs i
`src/core/remote-input.ts`; kanal- och guidekomponenterna behöver inte ändras.

## Kanalbyte

Pil upp går till nästa högre kanalnummer och pil ned till föregående. Listan
går runt mellan sista och första kanalen. Kanalbuggen ligger kvar; bannern
visar aktuellt och nästa program och försvinner efter fyra sekunder.

Varje kanalval får ett revisionsnummer. Ett sent resultat från ett gammalt
val ignoreras och spelarkedjan avbryter den gamla hämtningen. Vid snabba
knapptryckningar är därför det senast valda kanalnumret alltid slutresultatet.

## Direktnummer

Siffror visas i en tydlig buffert mitt i TV-bilden. Bufferten väljs efter en
sekund eller direkt med Enter. Maximalt tre siffror behålls. Om numret inte
finns visas ett statusmeddelande och aktuell kanal fortsätter.

## Programguide

Guiden visar en rad per kanal med `NU` och `NÄSTA`.

- Pil upp/ned flyttar ett enda tabb-stopp mellan raderna.
- Home och End går till första respektive sista kanal.
- Enter byter kanal och stänger guiden.
- Escape eller Back stänger guiden utan kanalbyte.
- Fokus återgår till TV-ytan efter stängning.

`NÄSTA` är alltid vanlig text. Guiden erbjuder inget avsnittsval och kan inte
starta ett framtida program. Ett kanalval frågar schemamotorn vad som faktiskt
pågår vid den aktuella tiden.

## Överlägg och Back

Överlägg registreras i `OverlayBackStack`. Back stänger det senast öppnade
överlägget först och varje överlägg ansvarar för att återställa tidigare fokus.
Detta kan återanvändas av kommande meny- och informationslager.

## Text-TV

Text-TV visas ovanpå den kanal som tittaren redan har valt. Den finns inte i
kanal 01–09 och syns inte i guiden. `T`, `TXT` eller Text-TV-knappen öppnar
sida 100. Tre siffror väljer sida 100, 300, 301, 400 eller 500. Escape eller
Back stänger tjänsten och återställer fokus till TV-ytan.

Sida 300 visar väderöversikt, 301 visar timprognos för valda orter, 400 visar
aktuell tablå och 500 är Barnens sida. Alla sidor har exakt 40 × 24 tecken.
Sidbufferten visas medan tre siffror matas in och sidan byts direkt efter den
tredje siffran.

## Automatiska kontroller

`npm run test:e2e` startar Theve lokalt och kör följande i Chromium:

1. Enter på `Starta TV`.
2. Kanal upp och flera snabba kanalval.
3. Direktnummer och synlig sifferbuffert.
4. Guide, roving fokus och kanalval med Enter.
5. Guide och stängning med Escape.
6. Kontroll att fokus återgår till TV-ytan och att framtida program saknar
   startknapp.
7. Text-TV, exakt 40 × 24-grid, sidorna 100/300/301/400/500 och Back till
   senast valda kanal.
8. Barn före 18.55, godnattvinjett 18.55, slutskylt 19.00 och morgonprogram
   06.00 utan omladdning.
9. Kanalbyte under uppehållet och återgång till Barn med slutskylten kvar.
