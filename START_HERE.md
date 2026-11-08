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

## 5. New South Wales, the ACT and Tasmania (code ready, needs your free key)

The feed code is in (`scripts/feed/sources/nsw.ts`) and the app knows NSW, the ACT and Tasmania from version 1.1. It switches on as soon as GitHub has the key:

1. Open https://api.nsw.gov.au/Account/Register. Type your first name, last name and email (twice), read the Terms and Conditions, tick the box and click **Sign up**. NSW emails you a link: open it and choose a password.
2. Log in at https://api.nsw.gov.au/Account/Login. Open **My apps** (top right menu) and click **Create an app**. Any name, for example `Pumpwise`.
3. Open https://api.nsw.gov.au/Product/Index/22 (**Fuel API**), click **Subscribe**, pick the **Free** plan (2,500 calls a month) and your app.
4. Back in **My apps**, open the app: it shows an **API Key** and an **API Secret**.
5. On GitHub, open https://github.com/Tjcraw6589/pumpwise/settings/secrets/actions/new (sign in to GitHub first if it says "page not found"). Add two secrets, one at a time:
   - Name `NSW_FUEL_API_KEY`, Secret: paste the API Key, click **Add secret**
   - Open the same link again. Name `NSW_FUEL_API_SECRET`, Secret: paste the API Secret, click **Add secret**

That's it. The next feed run (within 15 minutes) picks NSW up; check https://tjcraw6589.github.io/pumpwise/data/v3/meta.json for `"nsw": {"status": "live"`. The feed asks NSW every 45 minutes (two calls each time, about 2,000 a month), well inside the free plan. One call brings back NSW, the ACT and Tasmania together (the feed asks for `states=NSW|TAS`, as the API's published spec requires; without it Tasmania is left out).

The data is published by the NSW Government under a Creative Commons Attribution licence (listed as CC BY-SA on data.gov.au), so the app credits FuelCheck on every price screen. Pumpwise 1.0 keeps reading the Western Australia feed (`data/v2`) and never sees the new regions; 1.1 reads `data/v3`.

## 6. Small fixes without waiting for Apple (from version 1.1)

Version 1.1 includes EAS Update, so a fix that only changes the app's own code, text or pictures can reach phones within a day, with no new App Store review. Ask Claude: "send this fix as an update". Claude runs the tests, then publishes with:

```
npx eas-cli@latest update --channel production --environment production --message "<what changed>"
```

Claude publishes to `production` only when you say so; to try a fix first, it publishes to the `preview` channel. A phone picks the update up the next time Pumpwise is fully closed and reopened (sometimes it takes two reopens).

- **Free:** the Free plan covers 1,000 phones a month that download an update, and 100 GB of downloads. Free accounts can't be charged for going over (Expo billing FAQ).
- **Not for everything:** new native features, new permissions, SDK upgrades and AdMob ID changes still need a new build and App Store review.
- **Matching versions:** an update only reaches builds of the same app version (`runtimeVersion` policy `appVersion`), so updates published for 1.1.0 reach 1.1.0 builds only. Version 1.0 has no EAS Update and never receives them.

## Queensland: what you agree to if you sign up (decide first)

Queensland gives its prices to apps that sign up as a "publisher" at https://www.fuelpricesqld.com.au (a short Microsoft form). The feed and the app are ready; the token they email goes into GitHub as the secret `QLD_FUEL_API_TOKEN` (https://github.com/Tjcraw6589/pumpwise/settings/secrets/actions/new). Submitting the form means accepting their Fuel Price Data Licence (https://www.fuelpricesqld.com.au/documents/LimitedUseLicence.pdf). In plain words it says:

- **A  fee**, but only if the State asks for it.
- **Prices must be current within 30 minutes.** The feed fetches Queensland every 15 minutes, so this is met.
- **Their notice must be shown** and people must be told not to republish the prices. Both are in the app (credit line, About, terms).
- **They can ask for usage figures within 10 business days**: monthly active, new and returning users for Queensland. Pumpwise has no analytics, so you could only give App Store Connect's download and usage numbers, which are not split by state. Tell them that if they ask.
- **They can audit compliance**, and either side can end the agreement with 20 business days' notice (3 days if the publication isn't current).

If that is fine with you, follow the checklist page's Queensland task. If not, Queensland simply stays off; nothing else is affected. The full register of every source's licence is in LEGAL.md.

## Adding more places later

- **Spain, France, Portugal and Mexico**: live in feed v4 since November 2026; version 1.2 shows them in Spanish, French and Portuguese.
- **United Kingdom**: the code is ready, but the UK Fuel Finder service refuses connections from outside the UK, including GitHub's servers, so it stays off unless that changes.

## How it works (for later)

- **The app** (Expo SDK 58, TypeScript, Expo Router, iPhone only) downloads small price files for the area around you, works out the nearest and cheapest stations on the phone, shows each region's own units (km and dollars in WA), and opens directions in Apple Maps, Google Maps or Waze.
- **The price feed** (`.github/workflows/feed.yml` + `scripts/feed/build.ts`, one file per source in `scripts/feed/sources/`) runs every 15 minutes (:07, :22, :37, :52). GitHub's own scheduler only gets to free repositories every few hours, so each run waits for the next quarter hour and starts the next one itself; the schedule is a backup that restarts the chain if it ever stops. To pause it, add a repository variable `FEED_CHAIN` = `off` (Settings → Secrets and variables → Actions → Variables). Each source refreshes on its own schedule (WA: hourly, and within 15 minutes of 6am and 2:30pm Perth); if one fails, its last good prices stay online.
- **Checks**: `npm run verify` (types, lint, 72 tests), `npm run export:web:test` then `npm run test:e2e` (browser smoke test with sample stations).
