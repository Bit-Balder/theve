# Internet Archive — automatisk innehållsinventering

Den här sökningen är **separat från Theves publika programkatalog**.
Den hittar kandidater, inte godkända program. Inga resultat publiceras på
GitHub Pages eller läggs in i tablån.

## Start och schema

Öppna **Actions → Internet Archive discovery → Run workflow** när funktionen
har mergats till huvudgrenen. Jobbet körs även varje söndag kl. 04.47
i Europe/Stockholm.

Sökorden finns i `data/archive-searches.json`.
De täcker Theves nio kanaler, med extra sökningar för **Barn** och **TV6**.
Sökningen prioriterar 1980–2004, svenska språkfält, svenska titlar och
svenskdubbade filmer. Metadata kan saknas eller vara felaktiga. Poster med
okänt år behålls för granskning; poster med deklarerat år utanför perioden
filtreras bort.

Varje körning hämtar en begränsad mängd sökresultat genom
`https://archive.org/advancedsearch.php` och kontrollerar
videofiler genom `https://archive.org/metadata/{identifier}`.
Den hämtar inga videofiler.

## Resultat

- `data/discovery/internet-archive/candidates.json`:
  fynd, föreslagen kanal, metadata och granskningsstatus.
- `data/discovery/internet-archive/state.json`:
  nästa söksida för respektive sökning och nästa sökindex.
- `artifacts/archive-discovery/report.json`:
  antal kontroller, dubbletter, fel och bortfiltrerade poster.
- `artifacts/archive-discovery/report.md`:
  läsbar körningsrapport.

Rapporterna hämtas från körningens **Artifacts**. De ligger kvar i 30 dagar.

Körningen återläser kandidat- och sökstatus från en öppen resultatgren.
Den skapar eller uppdaterar en pull request från
`automation/archive-discovery-results` till `main`.
Inget skrivs direkt till `main`. Om förslaget inte kan skapas,
finns resultatet kvar som artifact.

För automatisk pull request kan GitHub kräva:
**Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**.
Om funktionen är avstängd kan man ändå hämta kandidaterna från Artifacts.
Efter merge bevaras katalog och sökstatus i huvudgrenen.

## Granskning

Alla kandidater får `rightsStatus: review_required` och
`familyStatus: review_required`. Ett MP4-filnamn bevisar inte
att videon går att spela. Språk, år, rättigheter och familjelämplighet måste
granskas manuellt.

Först därefter kan en redaktör göra en **separat pull request** som lägger
godkända program i `data/source/catalog.json`,
`data/source/rights.json` och tablån. De befintliga
publiceringskontrollerna förblir oförändrade.

## Lokalt

```sh
node scripts/discover-archive.mjs --validate-config
node scripts/discover-archive.mjs
```

Den andra kommandoraden kräver internetåtkomst. Resultat och sökstatus
sparas lokalt. Sökorden kan redigeras utan att ändra sökskriptet.

## Avgränsningar

SVT Öppet arkiv ingår inte i detta API-jobb. SVT Play har annan åtkomst
och andra användningsvillkor. Internet Archives metadata bevisar inte
upphovsrätt eller rätt att återutsända. Denna funktion granskar inte uppspelning.
