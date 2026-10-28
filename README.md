# Pumpwise

The nearest fuel station and the cheapest one around you, from official government price schemes: FuelWatch (Western Australia) now, more places as they publish free data. iPhone app (Expo SDK 58, TypeScript strict, Expo Router) plus a free price feed built by GitHub Actions and served from GitHub Pages.

New here? Read `START_HERE.md` for what is left before the App Store, and `STORE_LISTING.md` for the listing copy.

## Layout

| Path | What it is |
|------|------------|
| `src/app/` | Screens: onboarding, Nearby, Map, Settings, station detail, place search, about, legal |
| `src/lib/` | Pure logic with tests: feed format (`feed.ts`), regions with their fuels, units and sources (`regions.ts`), km/mi and L/100km/mpg (`units.ts`), ranking, "worth the drive" and tomorrow's trend (`ranking.ts`), opening hours (`hours.ts`), screen states (`nearby.ts`) |
| `src/services/` | Feed download, location, postcodes.io search, directions |
| `src/hooks/useLiveController.ts` | Follows the phone, reloads prices after 3 km or 5 minutes |
| `scripts/feed/build.ts` | Builds the feed from every source (run by `.github/workflows/feed.yml`); reuses a source's last good prices when it is not due or fails |
| `scripts/feed/sources/wa.ts` | FuelWatch RSS (WA): today's prices, tomorrow's after 2:30pm, hours, restrictions |
| `scripts/feed/sources/uk.ts` | UK Fuel Finder API (off: the service refuses non-UK connections) |
| `scripts/feed/fixture-data.ts` | Made-up stations (Perth, Bunbury, London, Leeds) for tests and the web smoke test |
| `site/` | GitHub Pages: landing/support page and legal pages (built from `legal/*.md` by `npm run legal:html`) |
| `scripts/generate-assets.mjs` | App icon (light, dark, tinted), splash and favicon from `src/lib/mark.ts` |

## Commands

```
npm run verify            # tsc (app + scripts), eslint, jest
npm run export:web:test   # web build pointed at a local sample feed
npm run test:e2e          # Playwright smoke test on that build
npm run feed              # build the real feed locally into out/site (FEED_FORCE=1 to refetch everything)
npm run assets            # regenerate icons
node scripts/screenshots.mjs review|store
eas build -p ios --profile simulator   # free compile check, no Apple login needed
eas build -p ios --profile production  # store build
```

## Feed format

`data/v2/meta.json` lists every half-degree tile with its station count, plus each region's status; `data/v2/tiles/<lat>_<lng>.json` holds that tile's stations with prices per litre (cents in WA) keyed by fuel kind (`regular`, `premium`, `super`, `diesel`, ...), when each applies, and tomorrow's price where published. The app fetches `meta.json` with a per-minute cache buster, then only the tiles around the search centre, keyed by the feed's build time so unchanged tiles are reused.

Data: prices from FuelWatch, Government of Western Australia (www.fuelwatch.wa.gov.au), used with acknowledgement and a link as FuelWatch asks.
