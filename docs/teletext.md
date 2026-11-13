# Text-TV · etapp 10

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

Första områdena är Stockholmsområdet, Göteborgsområdet och Malmöområdet.
Familjens hemområde kan läggas till senare i `data/source/weather.json`.
Varje område använder en fast prognospunkt nära centrum. Det är en lättläst
Text-TV-etikett, inte ett påstående om ett regionalt medelvärde.

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
kontaktar aldrig SMHI direkt. GitHub Actions kör samma uppdatering nattligen
och sparar resultat samt rapport som artifact utan att publicera automatiskt.

## Tablå

Sida 400 använder samma `channels.json`, `schedule.json`, `Date.now()` och
`getScheduleState` som programguiden. Den kan därför inte visa ett annat
aktuellt program än guiden vid samma tidpunkt.
