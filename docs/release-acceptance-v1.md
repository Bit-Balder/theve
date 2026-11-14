# Release- och familjeacceptans för Theve v1

Etapp 12 levereras först som `1.0.0-rc.1`. Den slutliga taggen `v1.0.0` skapas
efter att releasekandidaten har publicerats och projektägaren har godkänt det
manuella testet på familjens faktiska skärm.

## Automatisk releasegrind

- [ ] lint, enhetstester och tidszonstest är gröna;
- [ ] Chromium, Firefox, WebKit och TV-liknande Chromium är gröna;
- [ ] 4:3, guide, kanalmarkering, Text-TV och Barns slutskylt är visuellt
      verifierade;
- [ ] produktionsbygget använder relativa sökvägar;
- [ ] distributionskontrollen hittar inga video- eller ljudfiler;
- [ ] distributionskontrollen hittar inga kända hemlighetsmönster;
- [ ] `INFO` visar version, datarevision och källrevision;
- [ ] återställningsvägen är verifierad mot en tidigare godkänd revision.

## Manuellt test efter merge

Testa Pages-adressen på den enhet eller TV-box som familjen ska använda:

1. Öppna sidan och bekräfta att programguiden är första vyn.
2. Flytta fokus med pilarna och välj en kanal med Enter eller OK.
3. Bekräfta att kanallogotypen visas först och efter fyra sekunder ersätts av
   en liten kanaltext utan bakgrund.
4. Byt minst tre kanaler med pilarna och välj kanal 8 med sifferknappen.
5. Öppna guiden igen med den synliga `GUIDE`-knappen eller G.
6. Öppna Text-TV, prova sidorna 300, 301, 302, 400 och 500 och gå tillbaka.
7. Växla CRT och ladda om sidan; valet ska ligga kvar.
8. Öppna `INFO` och kontrollera version och datarevision.
9. Kontrollera att bild, text och fokus inte klipps på målskärmen.
10. Bekräfta att de nio kanalnamnen och profilerna är lämpliga för familjen.

## Svara i projektchatten

Ange:

- enhet eller TV-box och webbläsare;
- om samtliga tio steg godkändes;
- eventuella problem med fokus, textstorlek, bild eller knappar;
- om de nio kanalprofilerna är godkända.

När detta är godkänt kan releasekandidaten få version `1.0.0`, dokumentationen
uppdateras och taggen `v1.0.0` skapas.

