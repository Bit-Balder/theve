# Datamodell · etapp 4

Etapp 3 skiljer källdata från data som får publiceras. Källdata granskas och
valideras; endast godkända objekt skrivs till `public/data/`.

## Filer

| Område | Källa | Kontrakt |
| --- | --- | --- |
| Kanaler | `data/source/channels.json` | `data/schema/channels.schema.json` |
| Katalog | `data/source/catalog.json` | `data/schema/catalog.schema.json` |
| Rättigheter | `data/source/rights.json` | `data/schema/rights.schema.json` |
| Veckotablå | `data/source/schedule.json` | `data/schema/schedule.schema.json` |

Publika filer genereras deterministiskt till `public/data/`. Varje fil har
schema- och revisionsnummer. Samma källfiler ger alltid samma revision.

## Startkanaler

- Kanal 0: Theve 0, informationskanal.
- Kanal 1: Barnkanalen, med analog slutid 19:00.
- Kanal 2: Tecknat.
- Kanal 3: Natur TV.
- Kanal 4: Retro TV.

Namnen är arbetsnamn tills kanalidentiteterna fastställs i etapp 7.

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

## Tablå

Källtablån innehåller veckomallar i `Europe/Stockholm`. Varje mall har ett
unikt ID, en kanal, ISO-veckodagar och slotar med lokal starttid. Flera mallar
kan användas för samma kanal, till exempel en vardagsmall och en helgmall.

Bygget expanderar mallarna till minst åtta veckor. Den publika filen innehåller
UTC-start, UTC-slut, svenskt UTC-offset och en revisionsnyckel. Slottyperna är:

- `program`, som måste hänvisa till ett godkänt katalogobjekt;
- `ident`, för kanalvinjett eller analog slutskylt;
- `off_air`, för ett planerat sändningsuppehåll.

## Provobjekt

De fyra gröna objekten är egenskapade, genererade testmönster utan video eller
externt material. Den gula Internet Archive-raden är endast ett kandidatfall
och saknar riktig identifierare tills rättigheter har granskats. Det röda
objektet är ett uttryckligt blockeringstest.

## Byggregler

`npm run data:build` validerar schema och korsreferenser och skriver publika
filer. `npm run data:check` stoppar bygget om genererade filer inte motsvarar
källan. Följande fel stoppar alltid publicering:

- saknade obligatoriska fält;
- dubbla kanalnummer, mall-ID, objekt-ID eller slot-ID inom en mall;
- okända kanal- eller programreferenser;
- överlappande slotar på samma kanal;
- `review_required` eller `rejected` i en schemalagd slot;
- ej godkänd publicering eller familjestatus;
- otillgänglig källa i en schemalagd slot.

## Arbetsflöde för nytt innehåll

1. Lägg katalogobjektet i källdatan.
2. Lägg en separat rättighetsrad med underlag och datum.
3. Lägg objektet i veckotablån först när både rättigheter och familjestatus är
   godkända.
4. Kör `npm run data:build` för att skapa UTC-tablån.
5. Kör `npm run check` före pull request.

Se [schemamotorns guide](schedule-engine.md) för kompletta exempel.
