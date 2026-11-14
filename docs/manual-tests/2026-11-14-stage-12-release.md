# Tekniskt releaseprotokoll för etapp 12

Datum: 14 november 2026.

Releasekandidat: `1.0.0-rc.1`.

## Automatiskt utfall

- 123 enhetstester godkända.
- 12 tidszonstester godkända med `Pacific/Honolulu`.
- Produktionsbygget godkänt med relativa asset-sökvägar.
- Distributionskontrollen godkänd: 53 filer, 836 635 byte totalt, inga
  videofiler och inga träffar på kända hemlighetsmönster.
- Programguide, kanalbyte, kompakt kanaltext, Info, Text-TV, Barns avslut och
  CRT testade i Chromium, Firefox, WebKit och TV-liknande Chromium.
- Fyra Chromium-referenser verifierar startguide, kanallogotyp, Text-TV och
  Barns slutskylt.

Datarevision: `f697f52c70de3d0e`.

Källrevision: `8b1b4c7eaf320553`.

## Verifierad återställningsväg

Den tidigare godkända `main`-revisionen
`b357b8c07b2d420aad11c18110990fd5ae90eb18` byggdes i en separat lokal
stagingyta. Både den revisionen och releasekandidaten:

- klarade katalog- och logotypkontroll;
- skapade ett produktionsbygge;
- använde relativa `./assets/`-sökvägar;
- innehöll den förväntade data- och källrevisionen.

GitHub-workflowen har en manuell körning och publicerar endast en godkänd
revision på `main`. Driftmanualen beskriver revert-pull-requesten som
återställningsväg. En verklig Pages-återställning görs inte före merge,
eftersom den skulle ändra den publika miljön.

## Kvar innan v1.0.0

- Merge av releasekandidaten och grön Pages-publicering.
- Manuellt familjetest på målskärmen.
- Projektägarens godkännande av de nio kanalprofilerna.
- Versionshöjning från releasekandidat och tagg `v1.0.0`.

