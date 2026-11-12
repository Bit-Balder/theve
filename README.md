# Theve

Theve är en svensk 80-talsinspirerad linjär TV-upplevelse för familjens
privata bruk. Projektet byggs stegvis enligt produktdokumentets etapper.

Det här repot innehåller etapp 1: en liten, körbar och testbar projektgrund.
Ingen skarp videokatalog, spelare eller färdig kanaldesign ingår ännu.

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
npm run build
npm run check
```

`npm run check` kör hela kvalitetsgrinden. Produktionsfiler skrivs till
`dist/`.

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
  app.ts              vy och montering
  core/               ren produkt- och domänlogik
  styles/             gemensamma tokens och basstilar
tests/                 automatiska tester
docs/                  beslut och arkitektur
.github/workflows/     gemensam kvalitetskontroll
```

Läs [beslutsloggen](docs/decisions.md) och
[arkitekturgrunden](docs/architecture.md) innan nästa etapp påbörjas.

## Publicering och innehåll

GitHub Pages är offentligt tillgängligt. Projektets privata familjesyfte är
inte ett åtkomstskydd. Lägg aldrig hemligheter, personuppgifter eller
videofiler i repot.

Material från Internet Archive får inte läggas i en publicerad katalog enbart
för att filen går att spela. Rättighetsunderlag och familjelämplighet ska
granskas separat i kommande innehållsetapper.

## Status

Etapp 1 etablerar byggkedja, modulgränser, dokumenterade beslut och en körbar
startvy. Nästa steg är etapp 2: designsystem, 4:3-skal och fjärrkontrollfokus.

