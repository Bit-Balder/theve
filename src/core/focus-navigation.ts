export const navigationKeys = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
] as const;

export type NavigationKey = (typeof navigationKeys)[number];

export function isNavigationKey(key: string): key is NavigationKey {
  return navigationKeys.includes(key as NavigationKey);
}

export function getNextFocusIndex(
  currentIndex: number,
  key: NavigationKey,
  itemCount: number,
): number {
  if (itemCount <= 0) {
    return -1;
  }

  if (key === "Home") {
    return 0;
  }

  if (key === "End") {
    return itemCount - 1;
  }

  const direction = key === "ArrowUp" || key === "ArrowLeft" ? -1 : 1;
  return (currentIndex + direction + itemCount) % itemCount;
}
