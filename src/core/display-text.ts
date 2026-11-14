/**
 * Visa ett tydligt bindestreck i TDAText.
 * Tecknet "·" i arkivtitlar liknar annars en apostrof i detta typsnitt.
 * Ändra inte källans titel eller innehållskatalog.
 */
export function displayTvText(value: string): string {
  return value.replaceAll(" · ", " - ");
}
