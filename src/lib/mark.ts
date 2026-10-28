/**
 * The Pumpwise mark, in a 1000 x 1000 box: a map pin holding a fuel drop with a downward
 * chevron, "the price drop near you". Shared by the in-app logo and scripts/generate-assets.mjs.
 * No imports, so Node can load it directly.
 */
export const MARK = {
  /** Teardrop map pin, point at the bottom. */
  pin: 'M500 118 C 322 118 186 254 186 430 C 186 612 404 806 500 892 C 596 806 814 612 814 430 C 814 254 678 118 500 118 Z',
  /** Fuel drop sitting in the head of the pin. */
  drop: 'M500 252 C 462 318 382 404 382 478 C 382 548 434 598 500 598 C 566 598 618 548 618 478 C 618 404 538 318 500 252 Z',
  /** Downward chevron inside the drop. */
  chevron: 'M444 452 L500 508 L556 452',
  chevronWidth: 34,
} as const;
