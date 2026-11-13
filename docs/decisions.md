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
- TDAText används för menyer och vanlig TV-text. VT323 används för Text-TV,
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
- Text-TV består av exakt 40 kolumner och 24 rader och använder VT323 med
  stöd för å, ä och ö. Sidorna är 100, 300, 301, 400 och 500.
- Stockholmsområdet, Göteborgsområdet och Malmöområdet är de första
  väderområdena. Varje etikett bygger på en fast prognospunkt nära centrum och
  ska inte beskrivas som ett regionalt medelvärde. Familjens hemområde kan
  läggas till som en fjärde datapost när det har bekräftats.
- Väder kommer från SMHI:s dokumenterade SNOW1G-API under CC BY 4.0. Theve
  visar både `Källa: SMHI öppna data` och att urval och avrundning är en
  bearbetning av Theve.
- Väder hämtas till en versionsstyrd snapshot och aldrig direkt från
  webbläsaren. Utgången eller saknad snapshot ger ett uttryckligt tillstånd och
  inga prognosvärden presenteras som aktuella.
- Text-TV-sida 400 räknas från samma kompilerade schema och samma klocka som
  programguiden. Nyhetssidor aktiveras inte utan dokumenterade källvillkor.
- Den nattliga kontrollen körs 03.17 svensk tid, en bit från hel timme. Den har
  endast läsrättighet, gör ingen commit och publicerar inget till Pages.
- Pages-publicering ligger efter hela kvalitetsgrinden i samma workflow. En
  pull request testas men publiceras aldrig; endast en godkänd revision på
  `main` kan skapa och publicera ett Pages-artifact.
- Godkända Internet Archive-objekt måste ha en låst `licenseUrl`. Ändrad
  licens eller otillgänglig källa är ett blockerande katalogfel.
- Genererade manifest och katalograpporter innehåller källrevision och commit,
  så varje körning kan härledas till sin indata.
- Huvudklockan läser `Date.now()` från enhetens normalt synkroniserade klocka
  men formaterar alltid visningen i `Europe/Stockholm`. Tablåmotorn jämför samma
  absoluta epoch mot UTC-slotar och är därför oberoende av enhetens valda
  tidszon. Ingen separat tidstjänst införs.
- Kvalitetsmatrisen omfattar Chromium, Firefox, WebKit och en TV-liknande
  Chromium-yta på 1280 × 720. En fysisk TV eller TV-box är fortsatt en manuell
  kontrollpunkt för projektägaren.
- Visuell regression omfattar 4:3-start, programguide, Text-TV och Barns
  slutskylt. Referenser tas med reducerad rörelse för stabila bilder.
- CRT-valet sparas lokalt. Reducerad rörelse ger alltid CRT av vid start.

## Öppet inför senare etapper

- Vilken fysisk TV eller TV-box som används för manuell acceptanstest.

