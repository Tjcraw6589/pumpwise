# Pumpwise

The nearest UK fuel station and the cheapest one around you, from official UK Government Fuel Finder prices. iPhone app (Expo SDK 58, TypeScript strict, Expo Router) plus a free price feed built by GitHub Actions and served from GitHub Pages.

New here? Read `START_HERE.md` for what is left before the App Store, and `STORE_LISTING.md` for the listing copy.

## Layout

| Path | What it is |
|------|------------|
| `src/app/` | Screens: onboarding, Nearby, Map, Settings, station detail, place search, about, legal |
| `src/lib/` | Pure logic with tests: feed format and cleaning (`feed.ts`), ranking and "worth the drive" (`ranking.ts`), UK opening hours (`hours.ts`), screen states (`nearby.ts`) |
| `src/services/` | Feed download, location, postcodes.io search, directions |
| `src/hooks/useLiveController.ts` | Follows the phone, reloads prices after 2 miles or 5 minutes |
| `scripts/feed/build.ts` | Builds the feed from the Fuel Finder API (run by `.github/workflows/feed.yml`) |
| `scripts/feed/fixture-data.ts` | Made-up stations for tests and the web smoke test |
| `site/` | GitHub Pages: landing/support page and legal pages (built from `legal/*.md` by `npm run legal:html`) |
| `scripts/generate-assets.mjs` | App icon (light, dark, tinted), splash and favicon from `src/lib/mark.ts` |

## Commands

```
npm run verify            # tsc (app + scripts), eslint, jest
npm run export:web:test   # web build pointed at a local sample feed
npm run test:e2e          # Playwright smoke test on that build
npm run feed              # build the real feed locally (needs FUEL_FINDER_CLIENT_ID/SECRET)
npm run assets            # regenerate icons
node scripts/screenshots.mjs review|store
eas build -p ios --profile simulator   # free compile check, no Apple login needed
eas build -p ios --profile production  # store build
```

## Feed format

`data/v1/meta.json` lists every half-degree tile with its station count; `data/v1/tiles/<lat>_<lng>.json` holds that tile's stations with prices in pence per litre and the time each was reported. The app fetches `meta.json` with a per-minute cache buster, then only the tiles around the search centre, keyed by the feed's build time so unchanged tiles are reused.

Data: contains public sector information licensed under the Open Government Licence v3.0.
