# Pumpwise 1.1: the banner ad

Version 1.1 adds one small banner at the bottom of the Nearby tab, using Google AdMob, the same setup as Bowerly. It is built and tested but **not released**: it waits on the `ads-1.1` branch until version 1.0 is approved, because Apple reviews one version at a time and AdMob only approves apps that are already live.

Until the two AdMob IDs below are filled in, the app shows no ads at all (the ad code switches itself off when the unit ID is empty).

## What you do (free, about 10 minutes, after 1.0 is live)

1. **AdMob app.** Sign in at https://apps.admob.com with the account that owns publisher `ca-app-pub-6745854970750685`. Apps → Add app → iOS → "Yes, it's listed on the App Store" → search "Pumpwise" → add. Copy the **App ID** (`ca-app-pub-…~…`).
2. **Ad unit.** In the new app: Ad units → Add ad unit → **Banner** → name "Pumpwise banner" → create. Copy the **Ad unit ID** (`ca-app-pub-…/…`).
3. Paste both into `app.json`: the App ID replaces the Google sample ID in the `react-native-google-mobile-ads` plugin's `iosAppId`, and the unit ID goes in `extra.monetization.admobBannerIos`. (Or paste them here in chat and I'll do it.)
4. **App Store Connect → App Privacy.** The label must change from "Data Not Collected" to what AdMob collects, exactly as Bowerly's: Device ID and Advertising Data (used for third-party advertising), Coarse Location, Product Interaction, Crash Data and Performance Data. These are declarations Apple wants from you, so my tools won't click them; I'll open each page and you click.
5. Build and submit 1.1: `eas build -p ios --profile production` then `eas submit -p ios --latest`, same as before.

## What's already done in the code

- Google Mobile Ads SDK and the tracking-permission prompt, with the wording: "Pumpwise shows a small ad to keep the app free. Allowing tracking lets that ad be more relevant. Your location and settings never leave your iPhone either way."
- Banner only on the Nearby tab, only after onboarding, and only once an ad has loaded (no blank gap).
- Google's consent form where the law requires it (EU, UK, Switzerland) and an "Ad privacy choices" row in Settings when that applies.
- Content rating capped at PG. The app's own privacy manifest keeps `NSPrivacyTracking` false with no tracking domains, which is what fixed Bowerly's rejection; the ads SDK carries its own manifest.
- Privacy policy updated with an Advertising section (published with the site when this branch merges).

## Store listing changes for 1.1

- Description: change "No account, no adverts, no tracking." to "No account. A small ad keeps it free."
- App Store Connect asks "Contains ads?" in the App Information section: Yes.
