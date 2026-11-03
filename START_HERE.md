# START HERE: what's left to put Pumpwise on the App Store

Pumpwise is one app for every place where a government publishes fuel prices for free. The first release covers **Western Australia**, using FuelWatch. **Nothing here costs money**: FuelWatch is free with no sign-up, GitHub is free for public projects, Expo's free plan covers the builds, and your Apple developer membership is already paid.

Steps marked **(you)** need your own login or password. Steps marked **(Claude)** I can do once you say yes.

---

## 1. The free price feed (done)

The code is at https://github.com/Tjcraw6589/pumpwise. A GitHub job collects every WA price from FuelWatch about once an hour (prices are fixed for the day from 6am; tomorrow's appear at 2:30pm Perth time) and publishes them with the website, privacy and terms pages at https://tjcraw6589.github.io/pumpwise/. Check it any time at https://tjcraw6589.github.io/pumpwise/data/v2/meta.json (`"wa": {"status": "live", ...}`).

FuelWatch allows apps to use its data as long as FuelWatch is credited with a link to www.fuelwatch.wa.gov.au. The app does this on every price screen, station page and the About page, and the store description does too. Keep it that way.

## 2. Create the app in App Store Connect (done 29 October 2026)

App ID `com.tyjcraw.pumpwise` is registered on the Apple developer site, and the app exists in App Store Connect as **Pumpwise: Fuel Prices Near Me** (Apple ID 6828174153, SKU `pumpwise`, primary language English (Australia)). `eas.json` already points uploads at it. Team ID: JA885J7PGW.

## 3 and 4. Build, upload, listing and submission (done 1 November 2026)

Build 4 (version 1.0) was uploaded and the full listing filled in. Pumpwise was submitted to App Review on 1 November 2026 and is "Waiting for Review". Apple emails when the review finishes (usually within 48 hours); release is automatic after approval.

If Apple asks for changes: fix, `eas build -p ios --profile production` (no sign-in needed now), `eas submit -p ios --latest`, then in App Store Connect remove the version from review, attach the new build, and submit again.

---

## Adding more places later

- **New South Wales and Tasmania** (English, Australia): free key from https://api.nsw.gov.au (you sign up; 2,500 free requests a month is enough for an hourly feed). Then I add the source and the app picks it up with no app update needed for prices.
- **Spain and France**: free, no sign-up, but the app needs translating first.
- **United Kingdom**: the code is ready, but the UK Fuel Finder service refuses connections from outside the UK, including GitHub's servers, so it stays off unless that changes.

## How it works (for later)

- **The app** (Expo SDK 58, TypeScript, Expo Router, iPhone only) downloads small price files for the area around you, works out the nearest and cheapest stations on the phone, shows each region's own units (km and dollars in WA), and opens directions in Apple Maps, Google Maps or Waze.
- **The price feed** (`.github/workflows/feed.yml` + `scripts/feed/build.ts`, one file per source in `scripts/feed/sources/`) runs every 15 minutes (:07, :22, :37, :52). GitHub's own scheduler only gets to free repositories every few hours, so each run waits for the next quarter hour and starts the next one itself; the schedule is a backup that restarts the chain if it ever stops. To pause it, add a repository variable `FEED_CHAIN` = `off` (Settings → Secrets and variables → Actions → Variables). Each source refreshes on its own schedule (WA: hourly, and within 15 minutes of 6am and 2:30pm Perth); if one fails, its last good prices stay online.
- **Checks**: `npm run verify` (types, lint, 72 tests), `npm run export:web:test` then `npm run test:e2e` (browser smoke test with sample stations).
