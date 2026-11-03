# Pumpwise 1.1: the banner ad

Version 1.1 adds one small banner at the bottom of the Nearby tab, using Google AdMob, the same setup as Bowerly. It is built and tested but **not released**: it waits on the `ads-1.1` branch until version 1.0 is approved, because Apple reviews one version at a time. AdMob IDs can be made now (see below); ads only serve once the app is linked to its App Store page.

Until the two AdMob IDs below are filled in, the app shows no ads at all (the ad code switches itself off when the unit ID is empty).

## What you do (free, about 15 minutes in all)

### Now (5 minutes, no need to wait for Apple)

AdMob takes apps that are not in the App Store yet ("unpublished") and gives their IDs straight away. Ads only start showing once the app is linked to its App Store page, which is the last step below.

1. Open https://apps.admob.com and sign in with the Google account that owns publisher `ca-app-pub-6745854970750685` (the Bowerly one).
2. Click **Apps** → **Add app** → **iOS**. For "Is the app listed on a supported app store?" choose **No**. App name: `Pumpwise`. Click **Add app**.
3. Copy the **App ID** it shows (`ca-app-pub-…~…`).
4. Click **Add ad unit** → **Banner** → name `Pumpwise banner` → **Create ad unit**. Copy the **Ad unit ID** (`ca-app-pub-…/…`).
5. Paste both IDs to Claude in chat. They are not secret: they ship inside the app. Claude puts them in `app.json`, runs every test, builds 1.1 and puts it on TestFlight.

TestFlight builds show no real ads until step 6 is done (Google: iOS apps get no ads until they are in the App Store), so the banner space stays empty there. That is expected.

### After Apple approves 1.0 (Apple emails you)

6. In AdMob: **Apps** → **Pumpwise** → **App settings** → **Add store** → search `Pumpwise: Fuel Prices Near Me` → select it. (1 minute.)
7. **App Store Connect → App Privacy.** The label must change from "Data Not Collected" to what AdMob collects, exactly as Bowerly's: Device ID and Advertising Data (used for third-party advertising), Coarse Location, Product Interaction, Crash Data and Performance Data. These are declarations Apple wants from you, so Claude opens each page and you click. EAS Update (also new in 1.1) adds nothing to the label: Expo declares no collected data, and Device ID is already on the list for AdMob.
8. Add version 1.1 in App Store Connect, paste the What's New text from `STORE_LISTING.md`, set "Contains ads?" to Yes, pick the TestFlight build, and click **Add for Review** yourself.

The order of steps 1 to 5 and the TestFlight build does not depend on Apple. Steps 6 to 8 do.

## What's already done in the code

- Google Mobile Ads SDK and the tracking-permission prompt, with the wording: "Pumpwise shows a small ad to keep the app free. Allowing tracking lets that ad be more relevant. Your location and settings never leave your iPhone either way."
- Banner only on the Nearby tab, only after onboarding, and only once an ad has loaded (no blank gap).
- Google's consent form where the law requires it (EU, UK, Switzerland) and an "Ad privacy choices" row in Settings when that applies.
- Content rating capped at PG. The app's own privacy manifest keeps `NSPrivacyTracking` false with no tracking domains, which is what fixed Bowerly's rejection; the ads SDK carries its own manifest.
- Privacy policy updated with an Advertising section (published with the site when this branch merges).

## Store listing changes for 1.1

- Description: change "No account, no adverts, no tracking." to "No account. A small ad keeps it free."
- App Store Connect asks "Contains ads?" in the App Information section: Yes.
