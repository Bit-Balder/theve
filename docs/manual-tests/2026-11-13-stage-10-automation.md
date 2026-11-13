# Manuell kontroll · etapp 10

Datum: 13 november 2026.

## Godkänd normalväg

- `npm run catalog:audit` skapar både JSON- och Markdownrapport.
- Rapporten innehåller commitläge, källrevision, publik revision och summering.
- Nuvarande blockerade provobjekt redovisas som information och når inte publik
  katalog.
- `npm run check` validerar data, tester, bygge och fjärrkontrollflöde.

## Testade felvägar

Automatiska tester använder kopior av källdatan och ändrar inga projektfiler.

- Godkänd Internet Archive-post med avvikande live-licens ger
  `license_changed`, blockerad rapport och felstatus.
- Godkänd Internet Archive-post vars metadata inte går att hämta ger
  `source_unavailable`, blockerad rapport och felstatus.
- Godkänd Internet Archive-post utan låst `licenseUrl` stoppas innan publik
  data kan byggas.
- `review_required` och `rejected` förblir blockerade från schemalagd katalog.

## Publiceringssäkerhet

- Pull request kör hela kontrollen men saknar väg till Pages-jobben.
- Endast godkänd revision på `main` paketeras och publiceras.
- Nattjobbet har endast `contents: read`, skriver ingen commit och publicerar
  inte till Pages.
- Rapporter och genererade data sparas i ett 30-dagars artifact för felsökning.
