# START HERE: what's left to put Pumpwise on the App Store

The app is built and tested. What's left is switching on the free price feed and the App Store paperwork. **Nothing here costs money**: the UK price data is free, GitHub is free for public projects, Expo's free plan covers the builds, and your Apple developer membership is already paid.

Steps marked **(you)** need your own login or a password, so only you can do them. Steps marked **(Claude)** I can do once you say yes.

---

## 1. Get the free UK price keys (you, about 15 minutes)

1. Go to https://www.developer.fuel-finder.service.gov.uk/ and choose to register for the API (you'll be asked to sign in with **GOV.UK One Login**).
2. Create a GOV.UK One Login if you don't have one: an email address plus a code sent to your phone. It's free.
3. Register an application (it may be called an "Information Recipient"). Name: `Pumpwise`. Website: `https://tjcraw6589.github.io/pumpwise/`.
4. You'll get a **client ID** and a **client secret**. Keep this page open; you'll paste both in step 3. Don't send the secret to anyone, including me.

## 2. Put the project on GitHub (done 28 October 2026)

The code is at https://github.com/Tjcraw6589/pumpwise (public, so Pages and the 15-minute price job are free), and GitHub Pages publishes from GitHub Actions. The site, privacy and terms pages are at https://tjcraw6589.github.io/pumpwise/.

## 3. Add the two keys to GitHub (you, 2 minutes)

On https://github.com/Tjcraw6589/pumpwise/settings/secrets/actions click **New repository secret** twice:

| Name | Value |
|------|-------|
| `FUEL_FINDER_CLIENT_ID` | the client ID from step 1 |
| `FUEL_FINDER_CLIENT_SECRET` | the client secret from step 1 |

Then open the **Actions** tab, click **Price feed**, then **Run workflow**. After about a minute, https://tjcraw6589.github.io/pumpwise/data/v1/meta.json should show `"status":"live"` and around 8,000 stations. From then on it refreshes itself every 15 minutes.

Until this step is done, the app shows "Prices are on their way".

## 4. Create the app in App Store Connect (you, or Claude in the browser panel with your OK)

https://appstoreconnect.apple.com → Apps → **+** → New App:
- Platform iOS, Name **Pumpwise: UK Fuel Prices**, Primary language **English (U.K.)**
- Bundle ID **com.tyjcraw.pumpwise** (if it isn't in the list, step 5 registers it; come back after)
- SKU **pumpwise**, User Access: Full Access

Then copy the number in the page address (the "Apple ID" of the app) into `eas.json` as `"ascAppId"` under `submit.production.ios`.

## 5. Build and upload the real app (you, about 5 minutes of typing, then 20 to 40 minutes of waiting)

Open a terminal in the project folder (`cd C:\Users\Tyjcr\Documents\Pumpwise`) and run:

```
eas build -p ios --profile production
```

It asks you to sign in to your Apple account once, so it can make Pumpwise's signing certificate and register the bundle ID. Type your Apple password yourself. Then:

```
eas submit -p ios --latest
```

This uploads the build to App Store Connect. Each build uses one of Expo's 15 free iPhone builds a month.

## 6. Fill in the listing and submit (you or Claude, about 30 minutes)

Everything to paste is in `STORE_LISTING.md`: name, subtitle, description, keywords, categories, privacy answers ("Data Not Collected"), age rating, review notes. Screenshots are in `store/screenshots/` (made with sample stations; retake them with real prices once step 3 is done if you like). Set availability to **United Kingdom only**, attach the build, and press **Add for Review**.

---

## How it works (for later)

- **The app** (Expo SDK 58, TypeScript, Expo Router, iPhone only) downloads small price files for the area around you, works out the nearest and cheapest stations on the phone, and opens directions in Apple Maps, Google Maps or Waze.
- **The price feed** (`.github/workflows/feed.yml` + `scripts/feed/build.ts`) runs on GitHub every 15 minutes: it fetches every UK forecourt and price from the Fuel Finder API, drops obvious mistakes (prices under 80p or over 300p a litre, closed sites, locations outside the UK), and publishes half-degree area files on GitHub Pages. If the API has a bad moment, the job fails and the last good prices stay online.
- **Checks**: `npm run verify` (types, lint, 62 unit and screen tests), `npm run export:web:test` then `npm run test:e2e` (browser smoke test with sample stations).
