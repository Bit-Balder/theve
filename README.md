# Theve

Theve är en svensk 80-talsinspirerad linjär TV-upplevelse för familjens
privata bruk. Projektet byggs stegvis enligt produktdokumentets etapper.

Det här repot innehåller etapp 5: ett återanvändbart designsystem, en stabil
4:3-yta, en deterministisk schemamotor samt en feltålig Internet Archive-
adapter och spelarkontroller. Ingen skarp videokatalog eller färdig
kanaldesign ingår ännu.

## Förutsättningar

- Node.js 22.12 eller senare. `.nvmrc` använder Node 24.
- npm.

Vite kräver en modern Node-version. Systemets äldre Node-installation bör inte
användas för projektet.

## Kom igång

```sh
npm ci
npm run dev
```

Vite visar den lokala adressen i terminalen. Öppna den för att se Theves
startvy.

## Kvalitetskommandon

```sh
npm run lint
npm run test
npm run data:check
npm run build
npm run check
```

`npm run check` kör hela kvalitetsgrinden. Produktionsfiler skrivs till
`dist/`.

Tablån skrivs som återanvändbara veckomallar i svensk lokal tid. Byggsteget
expanderar mallarna till minst åtta veckor och publicerar entydiga UTC-tider.
Ett separat test körs med datorn inställd på en annan tidszon för att fånga
tidszonsberoenden.

Källdata finns i `data/source/`. Bygg om den publicerbara katalogen efter en
ändring med:

```sh
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
scripts/               validering och katalogbygge
tests/                 automatiska tester
docs/                  beslut och arkitektur
.github/workflows/     gemensam kvalitetskontroll
```

Läs [spelarens publika API](docs/player-api.md),
[guiden till schemamotorn](docs/schedule-engine.md),
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

Välj `Settings` → `Pages` → `Source` → `GitHub Actions`. Workflowen
`Deploy Pages` bygger, kontrollerar och publicerar `dist/` efter en godkänd
push till `main`. Använd inte `Deploy from a branch`; byggda filer ska inte
lagras i huvudbranchen.

## Typsnitt

- TDAText används för Text-TV och vanlig TV-text.
- VT323 används för kanalnummer, klockor och teknisk datortext.

Båda fontfilerna ligger lokalt i projektet och distribueras enligt SIL Open
Font License 1.1. Licenstexterna finns i `docs/font-licenses/`.

## Status

Etapp 5 etablerar en metadataadapter, en dokumenterad MP4-prioritering,
användaraktiverad uppspelning, exakt offset och reservhantering för nätverks-
och decodefel. Testerna använder simulerad media; inga videofiler lagras i
projektet. Nästa steg är etapp 6: kanalbyte, guide och fjärrstyrning.

