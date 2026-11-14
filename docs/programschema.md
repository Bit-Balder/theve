# Programschema och massgranskning

Theves redaktionella granskningssida finns på
`https://bit-balder.github.io/theve/programschema/` efter merge och Pages-bygge.

Sidan är en separat ingång till samma Vite-bygge. Den använder
Theves färger och typsnitt. Den ändrar aldrig `main` direkt.

## Så använder du sidan

1. Öppna **Programschema** och invänta kandidaterna från Internet Archive.
2. Filtrera på kanal, titel eller tidigare beslut.
3. Markera enstaka arkivposter, alla synliga eller en tydligt identifierad säsong.
4. Välj **Välj till katalog**, **Godkänn rättigheterna** eller **Avvisa**.
5. Fyll i motivering och bekräfta vilka arkivposter som omfattas.
6. Vid rättighetsgodkännande krävs dessutom rättighetsgrund,
   en offentlig HTTPS-länk till underlaget samt separat bekräftelse.
7. Välj **Skapa granskningsärende**. GitHub öppnas med ett ifyllt ärende.
8. Skicka ärendet från ett GitHub-konto med skrivrättigheter till repot.

GitHub Actions tar emot ett sådant ärende, kontrollerar redaktörens
behörighet, läser de senaste kandidaterna och bygger katalogändringar.
Varje ärende skapar en **separat gren**, med pull request när GitHub
tillåter automatiska pull requests. Om inställningen blockerar detta
visas en manuell länk i ärendet och körningsrapporten.

### Tre olika beslut

| Beslut | Katalog | Rättigheter | Tablå |
| --- | --- | --- | --- |
| Välj till katalog | Utkast | `review_required` | Ingen ändring |
| Godkänn rättigheterna | Utkast | `approved`, publicering **false** | Ingen ändring |
| Avvisa | Granskningsjournal | `rejected` för befintligt utkast | Ingen ändring |

Nya poster får alltid `familyStatus: review_required` och
`availabilityStatus: unknown`. Inte ens ett rättighetsgodkännande
publicerar videon eller lägger den i tablån.

### Massgranskning av säsonger

Sidan identifierar säsonger när titeln uttryckligen innehåller till
exempel `s01e03`, `säsong 1` eller `season 1`.
Välj **Markera säsong** för att markera samtliga poster i samma grupp.
Du kan också använda sökning och **Markera synliga** för att skapa egna grupper.

En Internet Archive-post kan innehålla flera videofiler.
Den här versionen granskar **arkivposter**, inte automatiskt varje
videofil som ett separat TV-avsnitt. Om en post innehåller en hel säsong
behöver vi senare dela upp filerna för att schemalägga avsnitten var för sig.

### Rättighetsskydd

En licensetikett i Internet Archives metadata är inte tillräcklig
som bevis för rätt att återutsända. Vid godkännande måste en redaktör
verifiera att rättighetsunderlaget omfattar materialet och alla valda
avsnitt, inklusive svensk dubbning när sådan finns.

Ett massgodkännande kräver licenslänk på varje arkivpost.
Poster som saknar licens kan ändå väljas till katalogen eller avvisas.
Rättighetsposterna låses med den licenslänk som upptäcktes.
Katalogkontrollen jämför licensen innan publicering.

**GitHub-ärenden är offentliga** i ett publikt repo. Skriv inte
privata avtal, personuppgifter eller annat känsligt underlag där.
Använd bara offentliga länkar. Hemliga rättighetsavtal kräver separat process.

### Säkerhet

- Programschema innehåller ingen GitHub-token.
- GitHub Actions avvisar ärenden från användare utan skrivrättigheter.
- Begäran begränsas till högst 40 unika identifierare.
- Alla identifierare måste finnas i den aktuella kandidatlistan.
- Skriptet vägrar ändra redan publicerade katalogposter via massgranskning.
- Alla ändringar går till separata grenar och behöver granskas före merge.
- Programtablåer och publiceringsstatus ändras aldrig av granskningsärenden.

Om GitHub blockerar automatiska pull requests, öppna
**Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**.
Även utan denna inställning skapas ändringsgrenen.

### Dataflöde

- Kandidater: `automation/archive-discovery-results/data/discovery/internet-archive/candidates.json`
- Redaktionell journal: `data/editorial/reviews.json`
- Katalogutkast: `data/source/catalog.json`
- Rättighetsrader: `data/source/rights.json`
- Tablå: `data/source/schedule.json`, ändras **inte** automatiskt

Granskningssidan kan även importera en hämtad `candidates.json`-fil.
Importen sker i webbläsaren och kräver ingen uppladdning.

## Återstående arbete

Efter den redaktionella granskningen måste vi kontrollera uppspelning,
barnlämplighet, rättighetsvillkor och tidpunkter innan program kan sändas.
Theves befintliga kontroller måste fortsatt godkänna dessa ändringar.
