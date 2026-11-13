# Automatik och publicering · etapp 10

Etapp 10 skiljer på kontroll, rapport och publicering. Ett nattligt jobb får
kontrollera externa källor men kan varken skriva till repot eller publicera
webbplatsen. Pages publiceras endast efter att hela kvalitetsgrinden har klarat
en revision på `main`.

## Workflower

### Quality

`Quality` körs för varje pull request och varje ändring på `main`.

1. `verify` installerar beroenden och kör `npm run check`.
2. Pull requests stannar efter kontrollen och publiceras aldrig.
3. En godkänd revision på `main` byggs till ett Pages-artifact.
4. Pages-jobbet publicerar just detta artifact.

Jobben använder endast de minimala rättigheterna för sin uppgift. Kontrollen
läser repot. Paketering och publicering får Pages- och identitetsrättighet men
ingen generell skrivrättighet till repot. Inga hemligheter används.

### Nightly catalog audit

`Nightly catalog audit` startar 03.17 i `Europe/Stockholm`, eller manuellt från
fliken Actions. Minut 17 undviker den vanliga belastningstoppen på hel timme.
Körningen:

1. hämtar en ny vädersnapshot;
2. genererar schema och Text-TV-data;
3. validerar rättigheter, familjestatus och källor;
4. jämför godkända Internet Archive-licenser med låst `licenseUrl`;
5. sparar JSON- och Markdownrapport samt `public/data/` som artifact i 30 dagar.

Rapporten innehåller commit, källrevision och publik revision. Ett blockerande
fel ger röd status men ändrar inte den redan publicerade webbplatsen. Programbyten
sker i webbläsarens schemamotor och är aldrig beroende av när Actions startar.

## Manuell körning

1. Öppna repot på GitHub och välj `Actions`.
2. Välj `Nightly catalog audit`.
3. Välj `Run workflow` och starta på `main`.
4. Öppna den färdiga körningen och hämta artifactet `catalog-audit-…`.
5. Läs `catalog-report.md`; `GODKÄND` betyder att inga blockerare hittades.

Lokalt kan samma rapport skapas med `npm run catalog:audit`. Den hamnar under
`artifacts/catalog-audit/` och checkas inte in.

## Fel och återställning

- `validation_failed`: källdata eller korsreferenser bryter kontraktet.
- `source_unavailable`: en godkänd extern källa svarar inte.
- `license_changed`: Internet Archives aktuella licens avviker från den låsta.
- `weather_stale`: varning om gammal vädersnapshot; rapporten skiljer tydligt
  varning från blockerande katalogfel.

Vid ett blockerande fel ska källdata eller rättighetsjournal korrigeras i en ny
pull request. Sänk aldrig kontrollnivån för att få en grön körning.

För återställning kan en tidigare godkänd `Quality`-körning för önskad commit
köras om från Actions, vilket bygger och publicerar samma versionsstyrda
revision på nytt. Ett alternativ är en vanlig återställnings-pull-request.
Det senast fungerande Pages-artifactet påverkas inte av en misslyckad nattlig
kontroll eller ett misslyckat nytt bygge.
