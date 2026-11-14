# Programschema: urval, godkännande och avvisning

Redaktionell granskning finns på
`https://bit-balder.github.io/theve/programschema/`.
Sidan använder Theves befintliga färger och typsnitt.

## Så arbetar du

1. Sök efter ett program och välj kanal.
2. Markera en arkivpost, alla synliga poster eller en säsong.
3. Välj **Välj till katalog**, **Godkänn rättigheter** eller **Avvisa**.
4. Skriv en **offentlig motivering**. Bekräfta vilka poster som omfattas.
5. Klicka **Skapa granskningsärende** och skicka ärendet i GitHub.
6. Godkända och avvisade beslut går till en **separat gren och pull request**.

Statusen **OGRANSKAD** betyder bara att Theves journal saknar ett tidigare beslut.
Du kan ändå godkänna eller avvisa posten efter din manuella granskning.
Saknad licensetikett på Internet Archive hindrar inte ett beslut.
En licensetikett är inte i sig bevis för rätt att återutsända materialet.

### Vad besluten gör

| Beslut | Resultat |
| --- | --- |
| Välj till katalog | Skapar ett utkast för vidare granskning |
| Godkänn rättigheter | Antecknar rättighetsgodkännande, men publicerar inte |
| Avvisa | Antecknar avslag och tar bort eventuellt opublicerat katalogutkast |
| Dölj lokalt | Döljer arkivposten direkt, bara i den aktuella webbläsaren |

**Avvisade poster försvinner från den aktiva listan efter att beslutets PR mergats.**
Du kan fortfarande se dem med filtret **Avvisade** och ändra beslut senare.
Internet Archive-sökningen läser också granskningsjournalen.
Nästa sökning tar inte med avvisade identifierare och rensar dem från kandidatgrenen.
Döljning sparas omedelbart i webbläsarens lokala lagring.
Filtret **Lokalt dolda** låter dig visa och återställa dessa poster.

Knappen **AVVISA I GITHUB** väljer ett enskilt program för avvisning.
Du måste fortfarande skicka ärendet och granska dess pull request.
För massavvisning markerar du flera poster och väljer **Avvisa**.

**Inga program läggs automatiskt i tablån.**
Även rättighetsgodkända katalogutkast kräver uppspelningskontroll,
familjegranskning och separat beslut om publicering.
Om speltid eller MP4-fil saknas sparas beslutet i journalen.
Vi skapar då inget ofullständigt katalogutkast.

## Privata rättighetsunderlag i GitHub Secrets

**Skriv aldrig avtal, rättighetsgrund, hemliga länkar eller personuppgifter
i Programschema, GitHub-ärenden, kodfiler eller pull requests.**
Bara din offentliga motivering skickas från granskningssidan.
Rättighetsunderlaget hanteras separat i **GitHub Actions Secrets**.

Varje **godkänt** ärende måste ha en post i det privata
GitHub Secret som heter `THEVE_PRIVATE_RIGHTS_RECORDS`.
Secret-värdet är JSON med **ärendenumret** som nyckel.

Skapa eller uppdatera Secret via:

1. Öppna `Bit-Balder/theve` på GitHub.
2. Välj **Settings → Secrets and variables → Actions**.
3. Klicka **New repository secret**, eller uppdatera det befintliga.
4. Ange namnet `THEVE_PRIVATE_RIGHTS_RECORDS`.
5. Fyll i din privata JSON med de aktuella ärendenumren.
6. Spara. GitHub visar inte Secret-värdet igen efter sparandet.

### Exempel på format

Följande är **endast fiktiva exempelvärden**:

```json
{
  "42": {
    "identifiers": ["serie-s01e01", "serie-s01e02"],
    "basis": "Kontrollerat tillstånd som omfattar samtliga avsnitt och svensk dubbning.",
    "evidenceUrl": "https://exempel.se/privat-underlag"
  }
}
```

Nyckeln `42` ska vara **det verkliga GitHub-ärendenumret**.
`identifiers` ska matcha exakt alla valda Internet Archive-identifierare.
`basis` beskriver den verifierade rättighetsgrunden.
`evidenceUrl` är en HTTPS-länk till ditt privata underlag.
En länk behöver inte vara offentlig, men den ska peka till det underlag du kontrollerat.

**Behåll gamla ärenden när du lägger till nya.**
Du uppdaterar hela Secret-värdet vid varje tillägg.
Spara en säker privat kopia, eftersom GitHub inte visar det sparade värdet.
GitHub begränsar storleken på Secrets. Vid stor katalog behövs senare
en bättre privat förvaring för rättighetsunderlagen.

### Godkännande steg för steg

1. Godkänn urvalet i Programschema och skapa det offentliga GitHub-ärendet.
2. Notera ärendenumret, exempelvis `#42`.
3. Lägg in ärendets verifierade underlag i `THEVE_PRIVATE_RIGHTS_RECORDS`.
4. **Stäng och öppna ärendet igen** för att starta GitHub Actions med ditt Secret.
5. Kontrollera körningen och den nya pull requesten.
6. Granska och mergea själv när testerna är godkända.

Nya godkännandeärenden startar inte rättighetskontrollen innan de öppnas igen.
Andra beslut kan behandlas när ärendet skapas.
Workflow kräver skrivrättigheter till GitHub-repot.

GitHub Actions verifierar att rättighetsunderlaget finns för **exakt
samma ärendenummer och arkividentifierare**.
Underlaget skickas aldrig till offentliga JSON-filer eller PR-text.
I den offentliga rättighetsjournalen sparas endast en generell formulering,
`evidenceUrl: null` och den offentliga motiveringen.
Ingen hemlig länk kopieras till programkatalogen.

Godkännande innebär fortfarande `publicationAllowed: false`.
Theve kontrollerar därför uppspelning och rättigheter vid en senare
publiceringsändring. Detta är inte automatisk juridisk verifiering.

## Begränsningar

- Programschema granskar **arkivposter**, inte alla videofiler inuti en post.
- Säsongsval fungerar när titeln uttryckligen visar ett säsongsnummer.
- Högst 40 arkivposter kan skickas i ett ärende.
- Kandidaterna kommer från `automation/archive-discovery-results`.
- Beslut sparas i `data/editorial/reviews.json`.
- Katalogutkast sparas i `data/source/catalog.json`.
- Rättighetsstatus sparas i `data/source/rights.json`.
- `data/source/schedule.json` ändras aldrig av granskningssidan.
- GitHub-repot är publikt. Alla ärendetitlar och motiveringar kan läsas av andra.
- Inga GitHub-tokenvärden finns i webbläsarkoden.

Om GitHub blockerar automatiska pull requests, välj
**Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**.
Jobbet skapar ändå en separat gren och ger en manuell länk till ändringsförslaget.
