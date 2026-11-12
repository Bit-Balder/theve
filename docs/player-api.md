# Internet Archive-adapter och spelare · etapp 5

Etapp 5 separerar tablå, metadata och faktisk uppspelning. Ett mediefel får
aldrig flytta tablågränsen eller lämna en oändlig laddningsindikator.

## Dataflöde

1. Schemamotorn väljer aktuell slot och beräknar `offsetMs`.
2. Katalogobjektets `source.mediaRef` används som Internet Archive-identifierare.
3. `InternetArchiveAdapter.resolve()` hämtar
   `https://archive.org/metadata/{identifier}`.
4. Adaptern väljer publika `.mp4`-filer. H.264-märkta filer prioriteras och
   övriga MP4-filer behålls som alternativ.
5. `PlayerController.playSlot()` laddar metadata, klampar offset, söker och
   startar videon efter att tittaren har använt `Starta TV`.
6. Vid fel provas nästa fil. Om alla filer misslyckas visas reservbild till
   nästa slot.

Internet Archives Metadata API returnerar en `files`-lista för ett exakt
identifierat objekt. Adapterregeln är medvetet försiktig: metadatafältet
`format` används för prioritering, men webbläsaren gör det slutliga
decodeprovet.

## `InternetArchiveAdapter`

```ts
const adapter = new InternetArchiveAdapter({ timeoutMs: 8_000 });
const item = await adapter.resolve("godkant_identifier", abortSignal);
```

Resultatet innehåller titel, detalj- och metadataadress samt en ordnad lista
med `ArchiveMediaSource`. Privata filer och andra format än MP4 tas bort.

Stabila felkoder:

- `ARCHIVE_INVALID_IDENTIFIER`
- `ARCHIVE_ABORTED`
- `ARCHIVE_TIMEOUT`
- `ARCHIVE_NETWORK_ERROR`
- `ARCHIVE_HTTP_ERROR`
- `ARCHIVE_INVALID_METADATA`
- `ARCHIVE_ITEM_UNAVAILABLE`
- `ARCHIVE_NO_COMPATIBLE_MEDIA`

En adapterstatus är en teknisk kontroll. Den får aldrig ändra ett programs
manuella rättighets- eller familjestatus till godkänd.

## `PlayerController`

Kontrollern tar ett `HTMLVideoElement` eller samma lilla testgränssnitt:

```ts
const player = new PlayerController(video, {
  loadTimeoutMs: 10_000,
  onStateChange: (state) => renderPlayerState(state),
});

await player.activate(); // anropas från Starta TV-handlingen
await player.playSlot({
  slotId: current.id,
  offsetMs: scheduleState.offsetMs ?? 0,
  sources: item.sources,
});
```

`activate()` är den enda vägen som tillåter uppspelning med ljud. Om
webbläsaren ändå svarar med `NotAllowedError` återgår kontrollern till
`awaiting_user_action`.

Kontrollerns faser:

- `idle`: ingen slot är vald;
- `awaiting_user_action`: väntar på `Starta TV`;
- `loading`: metadata eller alternativ mediefil laddas;
- `playing`: en fil spelas från klampad offset;
- `reserve`: alla källor eller metadatahämtningen har misslyckats.

Offset anges i millisekunder men sätts på videoelementet i sekunder. Negativa
värden blir 0. Ett värde efter mediets slut klampas till strax före den sista
giltiga mediepositionen. Om längden är okänd används 0.

## `ArchivePlaybackService`

Servicen binder ihop adapter och spelare:

```ts
const playback = new ArchivePlaybackService(adapter, player);
await playback.activate();
await playback.tune({
  slotId: current.id,
  archiveIdentifier: catalogItem.source.mediaRef,
  offsetMs: scheduleState.offsetMs ?? 0,
});
```

Varje `tune()` avbryter föregående metadatahämtning och medieladdning. Ett
sent svar från en gammal kanal ignoreras. När nästa slot börjar gör
kanalflödet ett nytt `tune()`; det sker på ordinarie tablåtid även om den
föregående sloten visar reservbild.

## Fel och reservbild

| Fel | Åtgärd |
| --- | --- |
| Metadata 404 | Reservbild för aktuell slot |
| Metadata timeout/nätverksfel | Reservbild; ny slot försöker igen |
| MP4 kan inte laddas | Prova nästa MP4 |
| Decode- eller `play()`-fel | Prova nästa MP4 |
| Alla alternativ slut | `PLAYER_SOURCES_EXHAUSTED` och reservbild |
| Kanalbyte under laddning | Avbryt gammal begäran; senaste valet vinner |

## Rättigheter och lagring

Ingen video lagras i projektet eller i GitHub Pages-artifacten. Endast ett
manuellt godkänt och schemalagt katalogobjekt får nå spelarkedjan. Video hämtas
direkt från Internet Archive.

Officiella tekniska referenser:

- [Internet Archive Developer Resources](https://archivesupport.zendesk.com/hc/en-us/articles/360001495812-Developer-Resources)
- [HTML-standardens mediaelement](https://html.spec.whatwg.org/multipage/media.html)
