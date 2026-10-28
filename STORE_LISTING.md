# Pumpwise: App Store listing

Everything below fits Apple's field limits (counts given per field). Paste as-is.

## Identity

| Field | Value |
|-------|-------|
| App name | Pumpwise: UK Fuel Prices |
| Bundle ID | `com.tyjcraw.pumpwise` (internal, cannot change after the first upload) |
| SKU | `pumpwise` |
| Version | 1.0.0 |
| Primary category | Navigation |
| Secondary category | Travel |
| Price | Free. No in-app purchases, no adverts. |
| Availability | United Kingdom only (prices only exist for UK forecourts) |
| Age rating | 4+ (answer "None" to every content question) |
| Copyright | Use the same line as Bowerly |
| Privacy policy URL | https://tjcraw6589.github.io/pumpwise/privacy.html |
| Support URL | https://tjcraw6589.github.io/pumpwise/ |
| Marketing URL | https://tjcraw6589.github.io/pumpwise/ |
| Support email | tyjcraw@gmail.com |

"Pumpwise" was checked with the iTunes Search API in the UK and US App Stores on 28 October 2026: no app uses it. (Other names checked and taken: Brimful, Tankwise, Forecourt, Kerbside, Fillpath, Topwell, Tanktide.)

## Text

**Name** (30 max, 24 used)
```
Pumpwise: UK Fuel Prices
```

**Subtitle** (30 max, 25 used)
```
Nearest & cheapest petrol
```

**Promotional text** (170 max, 148 used)
```
Open it anywhere in the UK: the nearest forecourt and the cheapest one around you, with official prices that stations must update within 30 minutes.
```

**Keywords** (100 max, 99 used; no spaces, no words already in the name or subtitle)
```
diesel,unleaded,station,garage,forecourt,finder,map,near,cheap,save,e10,e5,supermarket,motorway,gas
```

**Description**
```
Pumpwise shows you two things the moment it opens: the nearest fuel station, and the cheapest one inside the area you choose. One tap gets you directions.

Prices come from the UK Government's Fuel Finder scheme. Since February 2026 every forecourt in the UK must report its prices, and report any change within 30 minutes. Pumpwise collects them every 15 minutes, so what you see is what the pump says.

MADE FOR THE ROAD
• Opens straight to the answer: cheapest within your area, nearest to you.
• Big, clear prices styled like the signs on the forecourt.
• Directions in Apple Maps, Google Maps or Waze.
• Follows you as you drive, so the list updates as you go.

WORTH THE DRIVE?
A cheaper station five miles away isn't always a saving. Pumpwise counts the fuel you'd burn getting there and back, using your car's miles per gallon, and tells you in pounds what you'd really save. Sort by "Best value" to see the true cheapest.

PRICES YOU CAN TRUST
• Every price shows when the forecourt last reported it.
• Closed stations and prices that haven't been confirmed for a month are never picked as the cheapest.
• Obvious reporting mistakes, like 13p a litre, are filtered out.
• Spot a wrong price at the pump? Report it to GOV.UK from inside the app.

EVERYTHING YOU NEED
• Unleaded (E10), super unleaded (E5), diesel (B7), premium diesel, B10 and HVO.
• Search areas from 1 to 25 miles.
• A map of every price around you, coloured from cheapest to dearest.
• Opening hours, facilities, motorway and supermarket stations.
• Search any UK town or postcode when you're planning ahead.
• Light and dark mode.

PRIVATE BY DESIGN
No account, no adverts, no tracking. Your location is only used on your iPhone while the app is open, and is never sent to us.

Please don't use Pumpwise while driving. Let a passenger check, or look before you set off.

Contains public sector information licensed under the Open Government Licence v3.0. Pumpwise is not affiliated with the UK Government.
```

**What's New** (version 1.0.0)
```
First release.
```

## Screenshots

`store/screenshots/iphone-6.9/` (1320 x 2868) and `store/screenshots/iphone-6.5/` (1284 x 2778), made by `node scripts/screenshots.mjs store` from the web build with made-up sample stations. Once the live feed is running, retake them on an iPhone in the UK (or regenerate) so they show real stations. iPad screenshots are not needed: the app is iPhone only.

## App Privacy (App Store Connect → App Privacy)

- Data collection: **No, we do not collect data from this app.**
- Reason: location is used only on the device and is never sent to the developer or any third party. Price files are downloaded from a public website (GitHub Pages); town and postcode search sends only the typed text to postcodes.io, a public lookup service that does not identify the user. Nothing is linked to the user or used for tracking.
- The privacy manifest in the app agrees: `NSPrivacyTracking` false, no collected data types.

## App Review information

| Field | Value |
|-------|-------|
| Sign-in required | No (untick) |
| Contact email | tyjcraw@gmail.com |
| Review notes | See below |

**Review notes**
```
Pumpwise shows UK fuel prices from the UK Government Fuel Finder open data scheme, so it only has stations in the United Kingdom.

If you are reviewing outside the UK, the app will say "Pumpwise covers the UK" after you allow location. Tap "Look around London" (or Map tab > place chip > any city) to see live prices around a UK city. Everything else works the same: tap the cheapest station for its price board, try Directions, change fuel with the chip at the top, and change the search area.

No account, no in-app purchases and no adverts. Location is used only while the app is open and never leaves the device.
```

## Export compliance

`ITSAppUsesNonExemptEncryption` is false in the app, so no export compliance questions come up when a build is uploaded.
