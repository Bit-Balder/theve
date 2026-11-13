# Theve

Theve är en svensk 80-talsinspirerad linjär TV-upplevelse för familjens
privata bruk. Projektet byggs stegvis enligt produktdokumentets etapper.

Det här repot innehåller etapp 10: den fjärrstyrda TV-upplevelsen och Text-TV:n
från tidigare etapper, plus automatiska kontroller, spårbara katalograpporter
och publicering först efter ett godkänt bygge. Ingen skarp videokatalog ingår
ännu.

## Förutsättningar

- Node.js 22.12 eller senare. `.nvmrc` använder Node 24.
- npm.

Vite kräver en modern Node-version. Systemets äldre Node-installation bör inte
användas för projektet.

## Kom igång

```sh
npm ci
npx playwright install chromium
npm run dev
```

Vite visar den lokala adressen i terminalen. Öppna den för att se Theves
startvy.

## Kvalitetskommandon

```sh
npm run lint
npm run test
npm run test:e2e
npm run data:check
npm run catalog:audit
npm run logos:check
npm run build
npm run check
```

`npm run check` kör hela kvalitetsgrinden, inklusive ett riktigt
tangentbordsflöde i Chromium. Produktionsfiler skrivs till `dist/`.

Tablån skrivs som återanvändbara veckomallar i svensk lokal tid. Byggsteget
expanderar mallarna till minst åtta veckor och publicerar entydiga UTC-tider.
Ett separat test körs med datorn inställd på en annan tidszon för att fånga
tidszonsberoenden.

Källdata finns i `data/source/`. Bygg om den publicerbara katalogen efter en
ändring med:

```sh
npm run data:build
```

SVG-originalen genereras från en gemensam konstruktion med:

```sh
npm run logos:build
```

SMHI-snapshoten kan uppdateras manuellt med följande kommando. Samma generator
körs även nattligen av GitHub Actions utan att skriva tillbaka till repot eller
publicera resultatet.

```sh
npm run weather:update
npm run data:build
```

Endast schemalagda objekt med godkänd rättighets- och familjestatus når
`public/data/`.

Testa Pages-liknande distribution lokalt med:

```sh
npm run build
npm run preview
```

Vite använder relativa produktionssökvägar så att bygget fungerar under en
GitHub Pages-projektadress.

## Projektstruktur

```text
src/
  app.ts              startvy och sammansättning
  assets/fonts/       lokala, licensierade fontfiler
  components/         återanvändbara vykomponenter
  core/               ren produkt- och domänlogik
  styles/             gemensamma tokens och basstilar
data/                  scheman och granskad källdata
public/data/           deterministiskt genererad publik data
public/assets/         lokala logotyper och Barns slutskylt
scripts/               validering, katalog- och logotypbygge
tests/                 automatiska tester
e2e/                   tangentbordsdrivet webbläsarflöde
docs/                  beslut och arkitektur
.github/workflows/     gemensam kvalitetskontroll
```

Läs [Text-TV-guiden](docs/teletext.md),
[Barns kvällsavslut](docs/barn-signoff.md),
[fjärrkontrollens knappkarta](docs/remote-control.md),
[manualen för kanalidentiteter](docs/channel-identities.md),
[spelarens publika API](docs/player-api.md),
[guiden till schemamotorn](docs/schedule-engine.md),
[driftmanualen för automatiken](docs/automation.md),
[beslutsloggen](docs/decisions.md) och
[arkitekturgrunden](docs/architecture.md) innan nästa etapp påbörjas.

## Publicering och innehåll

GitHub Pages är offentligt tillgängligt. Projektets privata familjesyfte är
inte ett åtkomstskydd. Lägg aldrig hemligheter, personuppgifter eller
videofiler i repot.

Material från Internet Archive får inte läggas i en publicerad katalog enbart
för att filen går att spela. Rättighetsunderlag och familjelämplighet ska
granskas separat i kommande innehållsetapper.

## GitHub Pages

Välj `Settings` → `Pages` → `Source` → `GitHub Actions`. Workflowen `Quality`
kontrollerar först hela projektet och publicerar därefter samma godkända
revision när den finns på `main`. Använd inte `Deploy from a branch`; byggda
filer ska inte lagras i huvudbranchen.

## Typsnitt

- TDAText används för Text-TV och vanlig TV-text.
- VT323 används för kanalnummer, klockor och teknisk datortext.

Båda fontfilerna ligger lokalt i projektet och distribueras enligt SIL Open
Font License 1.1. Licenstexterna finns i `docs/font-licenses/`.

## Status

Etapp 10 kör samma kvalitetsgrind lokalt och i GitHub Actions. En nattlig
katalogkontroll uppdaterar generatorerna, jämför godkända Internet
Archive-licenser med låsta värden och sparar rapport plus genererade data som
ett spårbart artifact. Ett blockerande fel kan aldrig gå vidare till Pages.

Text-TV:s väder visar Stockholmsområdet, Göteborgsområdet och Malmöområdet med
synlig SMHI-attribution och bearbetningsnotis. Varje område representeras av
en prognospunkt nära områdets centrum; värdet är inte ett regionalt medelvärde.

