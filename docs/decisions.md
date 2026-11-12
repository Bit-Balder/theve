# Beslutslogg

Senast uppdaterad: 12 november 2026.

## Fastställt

- Theve är en svensk 80-talsinspirerad linjär TV-upplevelse för familjens
  privata bruk.
- Tittaren väljer kanal och ser det som redan pågår; version 1 har inget
  avsnittsval eller fri spolning.
- Frontend är en statisk webbapp på GitHub Pages. GitHub Pages behandlas som
  offentlig publicering även när den praktiska målgruppen är familjen.
- Internet Archive är planerad videokälla. Teknisk tillgänglighet och rätt att
  visa materialet är separata kontroller.
- GitHub Actions används för validering och kataloguppdateringar, inte för det
  exakta ögonblick då ett program byts.
- Ingen databas krävs i version 1. Firebase utvärderas först vid ett konkret
  redigerings- eller inloggningsbehov.
- TV-ytan ska vara 4:3 och alla huvudflöden ska fungera med fjärrkontroll.
- Färgpaletten är TV-blå `#182660`, gul `#F4C94B`, korall `#E97867`, gräddvit
  `#F5EACD` och Text-TV-svart `#000000`.
- CRT-effekten är diskret, valfri och avstängd vid reducerad rörelse.
- Theves huvudmärke använder en gul sol och lika höga linjer i gul, korall och
  gräddvit. Kanalernas märken ska vara egna och följa samma system.
- Verkliga TV-kanalers namn och logotyper används inte som kanalidentiteter.
- TDAText används för Text-TV och vanlig TV-text. VT323 används för
  kanalnummer, klockor och äldre datortext.
- Fontfilerna lagras lokalt och deras SIL Open Font License 1.1 följer med
  projektet.
- Diskret CRT-brus är på som standard. Reducerad rörelse stänger av den
  rörliga effekten.
- Startutbudets arbetsnamn är Theve 0, Barnkanalen, Tecknat, Natur TV och
  Retro TV. Slutliga kanalidentiteter fastställs i etapp 7.
- Tillgänglighet, rättighetsstatus och familjestatus är separata fält. Endast
  schemalagda objekt med gröna godkännanden genereras för publicering.
- GitHub Pages publiceras med GitHub Actions från ett byggartifact, inte från
  en incheckad `dist`-branch.
- Tablåkällan skrivs som veckomallar i `Europe/Stockholm`. Veckodagar följer
  ISO: måndag är 1 och söndag är 7.
- Byggsteget expanderar minst åtta veckor och skriver entydiga UTC-tider till
  den publika tablån. Webbläsaren ska inte själv tolka svensk sommartid.
- Vid en obefintlig lokal tid under vårens omställning flyttas tiden framåt.
  Vid en upprepad lokal tid under höstens omställning väljs den tidigare
  förekomsten. Policyn heter `compatible` och sparas i den byggda filen.
- En slot gäller från och med `startsAtUtc` men inte vid `endsAtUtc`. Därför
  byter två angränsande program exakt på samma millisekund utan överlapp.
- `program`, `ident` och `off_air` är egna slottyper. Saknad eller utgången
  tablå ger ett uttryckligt reservläge i stället för ett godtyckligt program.

## Öppet inför senare etapper

- Slutliga kanalnamn och vilka fyra videokanaler som ingår i startutbudet.
- Vilka orter som visas i Text-TV-vädret.
- Vilken fysisk TV eller TV-box som används för manuell acceptanstest.

Den nuvarande CSS-baserade Theve-symbolen är ett formprov. Slutlig
masterlogotyp och kanalidentiteter tas fram i etapp 7.

