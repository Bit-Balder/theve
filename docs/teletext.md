# Text-TV · etapp 9

Theves Text-TV är ett informationslager ovanpå senast valda videokanal. Den
öppnas med `T`, `TXT` eller Text-TV-knappen och stängs med samma knapp, Back
eller Escape. Tre siffror väljer sida.

## Sidor

| Sida | Innehåll | Källa |
| --- | --- | --- |
| 100 | Innehåll och snabblänkar | Egen statisk konfiguration |
| 300 | Väderöversikt | SMHI öppna data |
| 301 | Timprognos för valda orter | SMHI öppna data |
| 400 | TV-tablå just nu | Theves kompilerade schema |
| 500 | Barnens sida | Eget statiskt innehåll |

Nyhetssidor är inte aktiverade. Ingen extern nyhetstext får läggas till innan
källans villkor uttryckligen har dokumenterats.

## 40 × 24

Sidgeneratorn skapar alltid 24 rader med exakt 40 tecken. Långa texter bryts
vid ordgräns och varje färdig rad fylls med blanksteg. Renderaren visar texten
som vanlig text med TDAText; den tolkar aldrig innehåll som HTML och kan därför
inte skapa horisontell scroll från opålitlig data.

## Väder och attribution

Första orterna är Stockholm, Göteborg och Malmö. Familjens hemort kan läggas
till senare i `data/source/weather.json`.

Väderkällan är SMHI:s öppna SNOW1G-prognos. Data används enligt CC BY 4.0.
Sidorna visar både `Källa: SMHI öppna data` och `Bearbetad av Theve: urval och
avrundning`. Snapshoten innehåller hämtningstid och giltighetstid. När
giltigheten har gått ut döljs prognosvärdena bakom ett tydligt
`VÄDERDATA ÄR INAKTUELL`-läge. Om filen saknas visas `VÄDERDATA SAKNAS` medan
övriga Text-TV-sidor och videokanaler fortsätter fungera.

Uppdatera snapshoten manuellt med:

```sh
npm run weather:update
npm run data:build
npm run check
```

Generatorn gör tre små punktanrop och sparar normaliserad data. Webbläsaren
kontaktar aldrig SMHI direkt. Schemalagd uppdatering hör till etapp 10.

## Tablå

Sida 400 använder samma `channels.json`, `schedule.json`, `Date.now()` och
`getScheduleState` som programguiden. Den kan därför inte visa ett annat
aktuellt program än guiden vid samma tidpunkt.
