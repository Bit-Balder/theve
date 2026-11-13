# Schemamotorn · etapp 4

Schemamotorn gör Theve linjärt: två tittare som öppnar samma kanal vid samma
tid får samma slot och samma position i programmet.

## Från veckomall till sändning

1. `data/source/schedule.json` beskriver återkommande veckomallar i svensk
   lokal tid, `Europe/Stockholm`.
2. `npm run data:build` kontrollerar schema, kanalreferenser, program,
   rättigheter, familjestatus och överlapp.
3. Kompilatorn expanderar mallarna till minst åtta veckor och omvandlar varje
   start och sluttid till UTC.
4. Resultatet skrivs till `public/data/schedule.json` med revision och
   tablåhorisont.
5. Körmotorn `getScheduleState(schedule, channelId, nowEpochMs)` jämför den
   aktuella tidpunkten med den byggda tablån.

Körmotorn returnerar:

- `current`: sloten som pågår;
- `next`: nästa kända slot på kanalen;
- `offsetMs`: hur långt in i den aktuella sloten tittaren är;
- `status`: `on_air`, `gap`, `horizon_not_started`, `horizon_expired` eller
  `channel_not_found`;
- ett fel- och reservmeddelande när tablån inte kan användas.

En slot omfattar intervallet `startsAtUtc <= nu < endsAtUtc`. Exakt vid
sluttiden tar alltså nästa slot över. `ident` och `off_air` behandlas som
planerade sändningslägen, inte som fel. Ett verkligt hål ger `gap` och kanalens
reservbild.

## Svensk tid och sommartid

Redaktören skriver vanliga svenska klockslag, medan den publicerade filen
alltid använder UTC. Policyn `compatible` betyder:

- en lokal tid som inte finns vid vårens övergång flyttas framåt;
- en lokal tid som förekommer två gånger vid höstens övergång väljer den
  tidigare förekomsten.

Policyn och kanalernas UTC-offset sparas i den byggda tablån. Testerna körs
också med datorns tidszon satt till `Pacific/Honolulu`, så resultatet får inte
bero på utvecklarens dator.

## Lägg till ett program

Ett program behöver tre kopplade poster: katalog, rättigheter och tablå.
Använd samma katalog-ID i alla tre stegen.

### 1. Lägg programmet i katalogen

Öppna `data/source/catalog.json` och lägg ett objekt i `items`:

```json
{
  "id": "mitt-program",
  "title": "Mitt program",
  "channelId": "natur-tv",
  "durationSeconds": 1500,
  "source": {
    "type": "internet_archive",
    "mediaRef": "internet-archive-identifier"
  },
  "availabilityStatus": "available",
  "familyStatus": "approved"
}
```

`durationSeconds` är programmets verkliga längd. `channelId` måste finnas i
`data/source/channels.json`. För en ännu ogranskad kandidat används
`availabilityStatus: "unknown"` och `familyStatus: "review_required"`.

### 2. Dokumentera rättigheten

Lägg en rad med samma ID i `data/source/rights.json`:

```json
{
  "catalogItemId": "mitt-program",
  "status": "approved",
  "basis": "Beskriv den verifierade licensen eller rättighetsgrunden",
  "evidenceUrl": "https://archive.org/details/internet-archive-identifier",
  "reviewedAt": "2026-11-12",
  "publicationAllowed": true,
  "notes": "Vad som kontrollerades och eventuella begränsningar."
}
```

Sätt först `status` till `review_required` och `publicationAllowed` till
`false` om granskningen inte är klar. En nedladdningsbar fil eller metadata på
Internet Archive är inte i sig ett publiceringstillstånd. Ett sådant objekt
får finnas i katalogen men schemaläggs inte.

### 3. Lägg programmet i veckotablån

Öppna `data/source/schedule.json`. Lägg sloten i en befintlig mall för rätt
kanal, eller skapa en ny mall för en annan uppsättning veckodagar:

```json
{
  "id": "natur-tv-vardagar",
  "channelId": "natur-tv",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "slots": [
    {
      "id": "mitt-program-1730",
      "type": "program",
      "startLocal": "17:30",
      "durationSeconds": 1500,
      "catalogItemId": "mitt-program"
    }
  ]
}
```

Veckodagarna är 1 = måndag till 7 = söndag. Mall-ID ska vara unikt i hela
filen och slot-ID ska vara unikt inom mallen. Flera mallar får peka på samma
kanal, men slotarna får inte överlappa när de gäller samma datum.

Slotens `durationSeconds` får inte vara längre än katalogobjektets längd. Den
kan vara kortare om bara en del ska användas. I version 1 börjar uppspelningen
alltid från programmets början och fri spolning ingår inte.

För en kanalvinjett eller slutskylt används `ident` utan katalogobjekt:

```json
{
  "id": "godnatt",
  "type": "ident",
  "startLocal": "18:55",
  "durationSeconds": 300,
  "label": "Kanalen stänger för kvällen"
}
```

För planerad stängning används `off_air`, en `label` och det lokala klockslag
då uppehållet slutar. `endLocal` gör att 06:00 förblir 06:00 även den natt då
klockan ställs om:

```json
{
  "id": "natt",
  "type": "off_air",
  "startLocal": "19:00",
  "endLocal": "06:00",
  "label": "Sändningsuppehåll till 06:00",
  "asset": "assets/cards/barn-off-air.svg"
}
```

`asset` är valfri och får bara peka på en lokal SVG under `assets/`. Den ska
inte anges på en `program`-slot. Spelvyn behandlar fältet generellt och behöver
inte känna till vilket kanal-ID som använder slutskylten.

### 4. Bygg och kontrollera

```sh
npm run data:build
npm run check
```

Det första kommandot uppdaterar de publika JSON-filerna. Det andra kontrollerar
format, tester, tidszoner, datarättigheter och produktionsbygge. Om båda lyckas
kan ändringen gå till pull request. När den senare mergas till `main`
publicerar GitHub Pages-workflowen den nya tablån.

## Flytta tablåhorisonten

`horizon.startDate` ska vara en lokal måndag och `horizon.weeks` ska vara minst
8. Innan horisonten tar slut flyttas startdatumet fram och datan byggs om. Om
en klient ändå får en utgången tablå returnerar motorn
`SCHEDULE_HORIZON_EXPIRED` och visar reservbild i stället för att gissa.
