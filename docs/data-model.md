# Datamodell · etapp 10

Etapp 3 skiljer källdata från data som får publiceras. Källdata granskas och
valideras; endast godkända objekt skrivs till `public/data/`.

## Filer

| Område | Källa | Kontrakt |
| --- | --- | --- |
| Kanaler | `data/source/channels.json` | `data/schema/channels.schema.json` |
| Katalog | `data/source/catalog.json` | `data/schema/catalog.schema.json` |
| Rättigheter | `data/source/rights.json` | `data/schema/rights.schema.json` |
| Veckotablå | `data/source/schedule.json` | `data/schema/schedule.schema.json` |
| SMHI-väder | `data/source/weather.json` | `data/schema/weather.schema.json` |

Publika filer genereras deterministiskt till `public/data/`. Varje fil har
schema- och revisionsnummer. Manifestet har dessutom en `sourceRevision` som
omfattar all källdata, även blockerade katalogposter. Samma källfiler ger
alltid samma revisioner.

## Text-TV och väder

`weather.json` innehåller källnamn, dataset, licens, hämtningstid,
giltighetstid, områden och normaliserade prognospunkter. Stockholmsområdet,
Göteborgsområdet och Malmöområdet representeras av en fast punkt nära centrum,
inte av ett regionalt medelvärde. Bygget validerar att områdes-ID är unika,
tiderna ligger i stigande ordning och snapshoten har en
giltighetstid efter hämtningen.

`public/data/teletext.json` innehåller endast den validerade snapshoten, ett
40 × 24-kontrakt och samma revision som övrig publik data. Webbläsaren hämtar
inte SMHI direkt. Om filen saknas fortsätter TV:n att fungera och vädersidorna
visar ett tydligt saknat-data-läge.

## Kanalplan

Kanalplanen innehåller exakt nio videokanaler: TV1–TV7, Barn och Natur på
nummer 01–09. Text-TV är en funktion ovanpå den valda kanalen och ingår inte i
kanallistan.

Varje kanalrad innehåller profil, målgrupp, accenttema och sökvägar till fyra
SVG-varianter. `theme` får endast vara `yellow`, `coral` eller `cream` och
kopplas till gemensamma CSS-tokens. Barn har `signOffAt: "19:00"`; den faktiska
godnattvinjetten och slutskylten beskrivs i tablån.

## Statusfält

`availabilityStatus` beskriver om en teknisk källa går att använda. Det säger
ingenting om rätten att publicera materialet.

För en Internet Archive-källa är `source.mediaRef` objektets exakta
identifierare, inte en fullständig URL. Spelarkedjan bygger metadata-, detalj-
och nedladdningsadresser från identifieraren. Identifieraren publiceras först
när objektet både är schemalagt och har klarat rättighets- och familjegrinden.

`rights.status` beskriver rättighetsgranskningen:

- `approved`: grönt, men kräver även `publicationAllowed: true`.
- `review_required`: gult och blockeras från publicerad tablå.
- `rejected`: rött och blockeras från publicerad tablå.

`familyStatus` är en separat familjegranskning och måste också vara
`approved`. En tillgänglig fil blir alltså aldrig automatiskt godkänd.
Ett godkänt Internet Archive-objekt måste dessutom ha exakt `licenseUrl`
låst i rättighetsjournalen. Den nattliga kontrollen jämför värdet med aktuell
metadata och blockerar rapporten om licensen har ändrats eller källan inte
längre svarar.

## Tablå

Källtablån innehåller veckomallar i `Europe/Stockholm`. Varje mall har ett
unikt ID, en kanal, ISO-veckodagar och slotar med lokal starttid. Flera mallar
kan användas för samma kanal, till exempel en vardagsmall och en helgmall.

Bygget expanderar mallarna till minst åtta veckor. Den publika filen innehåller
UTC-start, UTC-slut, svenskt UTC-offset och en revisionsnyckel. Slottyperna är:

- `program`, som måste hänvisa till ett godkänt katalogobjekt;
- `ident`, för kanalvinjett eller analog slutskylt;
- `off_air`, för ett planerat sändningsuppehåll. En sådan slot kan peka på en
  egen lokal SVG i `asset`, exempelvis Barns analoga slutskylt.

## Provobjekt

De nio gröna objekten är egenskapade kanalidentiteter och genererade testmönster
utan video eller externt material. Den gula Internet Archive-raden är endast ett kandidatfall
och saknar riktig identifierare tills rättigheter har granskats. Det röda
objektet är ett uttryckligt blockeringstest.

## Byggregler

`npm run data:build` validerar schema och korsreferenser och skriver publika
filer. `npm run data:check` stoppar bygget om genererade filer inte motsvarar
källan. Följande fel stoppar alltid publicering:

- saknade obligatoriska fält;
- dubbla kanalnummer, mall-ID, objekt-ID eller slot-ID inom en mall;
- en kanalplan som avviker från exakt 01–09;
- okända kanal- eller programreferenser;
- överlappande slotar på samma kanal;
- `review_required` eller `rejected` i en schemalagd slot;
- ej godkänd publicering eller familjestatus;
- otillgänglig källa i en schemalagd slot.
- godkänt Internet Archive-objekt utan låst `licenseUrl`.

## Arbetsflöde för nytt innehåll

1. Lägg katalogobjektet i källdatan.
2. Lägg en separat rättighetsrad med underlag och datum.
3. Lägg objektet i veckotablån först när både rättigheter och familjestatus är
   godkända.
4. Kör `npm run data:build` för att skapa UTC-tablån.
5. Kör `npm run check` före pull request.

Se [schemamotorns guide](schedule-engine.md) för kompletta exempel.
