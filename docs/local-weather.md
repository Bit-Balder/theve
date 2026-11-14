# Lokalt väder i Text-TV

Theve använder samma 4:3-yta som TV-kanalerna. Text-TV
behåller 40 tecken och 24 rader, men fyller skärmens bredd.

## Så väljer man kommun

1. Öppna Text-TV med **T** eller **TXT**.
2. Skriv **301** för att först välja **län**.
3. Välj län med pilarna och **Enter**.
4. Välj sedan **kommun inom länet** med pilarna och **Enter**.
5. Text-TV öppnar sida **300** med den valda kommunens väder.

Listorna visar 16 poster åt gången. Bläddring sker automatiskt
med pilarna. **Back** går från kommunvalet till länsvalet.

| Sida | Innehåll |
| --- | --- |
| 300 | Lokalt väder för den valda kommunen |
| 301 | Välj län, sedan kommun |
| 302 | Upp till fem favoriter |
| 303 | Timprognos för vald kommun |
| 304 | Riksöversikt med de tre befintliga prognospunkterna |

Tryck **Enter** på sida 300 för att spara eller ta bort en favorit.
Val och favoriter sparas lokalt på enheten. Inget konto behövs.

## Källor och uppdatering

Registret innehåller **21 län och 290 kommuner**. Det innehåller
approximativa geografiska mittpunkter och inga väderprognoser.
Mittpunkterna är inte representativa för alla delar av större kommuner.

Uppgifterna är bearbetade från Marcus Asplunds kommundata (2017)
under MIT-licens. Se [källan och dess licens](https://github.com/marcusasplund/kommundata).
Kommunindelningen bör kontrolleras mot SCB när nya register publiceras.

När en kommun väljs anropar webbläsaren bara den kommunens punkt
via [Open-Meteos prognos-API](https://open-meteo.com/en/docs).
Open-Meteo dokumenterar stöd för CORS och kräver ingen API-nyckel för
icke-kommersiell användning. Det löser SMHI:s CORS-blockering på GitHub Pages.

Theve begär timvärden för temperatur, nederbörd och vind.
Vind anges uttryckligen i m/s, tider levereras som UTC-tidsstämplar.
Theve formaterar sedan tiderna för Europe/Stockholm.
En prognos återanvänds lokalt i högst en timme.
Vi gör inte 290 parallella förfrågningar och hämtar ingen prognos i förväg.

**Lokalt väder:** Källa [Open-Meteo.com](https://open-meteo.com/).
Data: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Bearbetad av Theve: urval av variabler, kommunpunkt och avrundning.
Open-Meteos kostnadsfria API avser icke-kommersiell användning.
Kontrollera deras villkor om Theve senare blir en kommersiell tjänst.

**Sverigeöversikt:** Fortsätter använda
[SMHI:s SNOW1G-API](https://www.smhi.se/data/sok-oppna-data-i-utforskaren/meteorologisk-prognos-api).
Det separata väderarbetsflödet körs var tredje timme på main.
Det uppdaterar tre förvalda SMHI-punkter, bygger om webbplatsen
och publicerar via GitHub Pages utan någon commit till main.
Om SMHI inte svarar publiceras inget nytt bygge.
Den tidigare webbplatsen fortsätter att fungera.

Nya lokala data använder en ny lagringsnyckel.
Theve återanvänder därför inte tidigare SMHI-svar som lokala Open-Meteo-data.
Om en användares webbläsare blockerar även Open-Meteo
visar Text-TV ett nätverksfel. Det bör testas på den slutliga TV-enheten.

## Kommunregistrets MIT-licens

Copyright (c) 2017 Marcus Asplund.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
