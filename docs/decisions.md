# Beslutslogg

Senast uppdaterad: 13 november 2026.

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
- Kanalplanen är 01–09: TV1–TV7, Barn och Natur. Text-TV är inte kanal 0.
- TV1–TV7 har profilerna nyheter och kultur, politik och samhälle, serier,
  nöje och musik, film, tecknat samt true crime. Barn och Natur behåller sol-
  respektive naturmotivet.
- Barn sänder ordinarie innehåll 06.00–18.55, visar godnattvinjett 18.55–19.00
  och har sändningsuppehåll med analog slutskylt 19.00–06.00.
- Barns slutskylt är ett eget lokalt SVG-original. Dess sökväg ligger på
  kanalens `off_air`-slot, så spelvyn behöver ingen kanalspecifik regel eller
  nätanslutning för att visa uppehållet.
- Theve och varje kanal använder en gemensam SVG-grid och fyra varianter:
  fullfärg, gräddvit, svart och kompakt kanalbugg. Märkena är egna original.
- `theme` och logotypsökvägar kommer från kanaldata. Endast motiv, ordmärke och
  accent varierar mellan kanalerna.
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
- Internet Archive-adaptern accepterar endast identifierare med bokstäver,
  siffror, bindestreck och understreck. Metadata behandlas som opålitlig data.
- Publika MP4-filer med H.264-märkning prioriteras. Övriga MP4-derivat behålls
  som alternativ; webbläsaren avgör slutligen om filen kan avkodas.
- Uppspelning med ljud startar först efter den uttryckliga handlingen `Starta
  TV`. En nekad `play()` återgår till vänteläget och kräver ny handling.
- Vid nytt kanal- eller slotval avbryts föregående metadatahämtning och
  medieladdning. Den senaste begäran är alltid den enda som får ändra läget.
- 404, timeout och decodefel provar nästa godkända MP4. När alternativen är
  slut visas reservbild till nästa tablåslot; tablåns klocka stoppas aldrig.
- Inga video- eller ljudfiler lagras i repot. Internet Archive-identitet,
  rights status och family status fortsätter vara separata kontroller.
- I sändningsläget betyder pil upp/ned kanal upp/ned. I programguiden flyttar
  samma knappar fokus; Enter byter till kanalens program som pågår nu.
- `G` och plattformskoden `Guide` öppnar nu/nästa-guiden. Escape, Backspace,
  BrowserBack, GoBack och TV-kod 461 normaliseras till samma Back-handling.
- Direktnummer samlas i en synlig buffert i en sekund. Enter kan bekräfta
  tidigare; okänt kanalnummer lämnar nuvarande kanal orörd.
- Guideposter representerar kanaler, inte programval. Nästa program visas som
  text och kan inte startas i förtid.
- Fokus återgår till TV-ytan när ett överlägg stängs. Senaste kanalvalet och
  senaste asynkrona laddningen är alltid de som får uppdatera bilden.
- `T`, `TXT`, plattformskoden `Teletext` och TV-kod 459 öppnar Text-TV. Tre
  siffror väljer sida; Back återgår till senast valda videokanal.

## Öppet inför senare etapper

- Vilka orter som visas i Text-TV-vädret.
- Vilken fysisk TV eller TV-box som används för manuell acceptanstest.

