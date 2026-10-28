# Pumpwise: App Store listing

Everything below fits Apple's field limits (counts given per field). Paste as-is. The first release covers Western Australia; the listing is written in **English (Australia)**.

## Identity

| Field | Value |
|-------|-------|
| App name | Pumpwise: Fuel Prices Near Me |
| Primary language | English (Australia) |
| Bundle ID | `com.tyjcraw.pumpwise` (internal, cannot change after the first upload) |
| SKU | `pumpwise` |
| Version | 1.0.0 |
| Primary category | Navigation |
| Secondary category | Travel |
| Price | Free. No in-app purchases, no adverts. |
| Availability | Australia (add more countries as Pumpwise covers them) |
| Age rating | 4+ (answer "None" to every content question) |
| Copyright | Use the same line as Bowerly |
| Privacy policy URL | https://tjcraw6589.github.io/pumpwise/privacy.html |
| Support URL | https://tjcraw6589.github.io/pumpwise/ |
| Marketing URL | https://tjcraw6589.github.io/pumpwise/ |
| Support email | tyjcraw@gmail.com |

"Pumpwise" was checked with the iTunes Search API in the Australian, UK and US App Stores on 28 October 2026: no app uses it.

## Text

**Name** (30 max, 29 used)
```
Pumpwise: Fuel Prices Near Me
```

**Subtitle** (30 max, 27 used)
```
Today's & tomorrow's petrol
```

**Promotional text** (170 max, 131 used)
```
Open it anywhere in WA: the nearest servo and the cheapest one around you, with today's official prices and tomorrow's from 2:30pm.
```

**Keywords** (100 max, 97 used; no spaces, no words already in the name or subtitle)
```
fuelwatch,perth,wa,servo,diesel,unleaded,cheap,station,map,lpg,e85,98,premium,costco,save,bunbury
```

**Description**
```
Pumpwise shows you two things the moment it opens: the nearest servo, and the cheapest one inside the area you choose. One tap gets you directions.

In Western Australia every station must lock in its price for the whole day from 6am, and publish tomorrow's price by 2:30pm. Pumpwise uses those official FuelWatch prices, so you know exactly what you'll pay today, and whether it's worth waiting until tomorrow.

FILL UP TODAY OR WAIT?
After 2:30pm Pumpwise shows tomorrow's price next to today's, and tells you if prices around you are about to drop or rise.

MADE FOR THE ROAD
• Opens straight to the answer: cheapest within your area, nearest to you.
• Big, clear prices styled like the signs at the servo.
• Directions in Apple Maps, Google Maps or Waze.
• Follows you as you drive, so the list updates as you go.

WORTH THE DRIVE?
A cheaper station 10 km away isn't always a saving. Pumpwise counts the fuel you'd burn getting there and back, using your car's fuel use, and tells you in dollars what you'd really save. Sort by "Best value" to see the true cheapest.

PRICES YOU CAN TRUST
• Official prices that stations are required to report.
• Closed stations, members-only stations and remote sites that need an entry permit are never picked as the cheapest (members can switch members-only stations on).
• Obvious reporting mistakes are filtered out.

EVERYTHING YOU NEED
• Unleaded 91, Premium 95, Premium 98, diesel, premium diesel, LPG and E85.
• Search areas from 2 to 40 km.
• A map of every price around you, coloured from cheapest to dearest.
• Opening hours and facilities for each station.
• Search any WA suburb, town or postcode when you're planning a trip.
• Light and dark mode.

PRIVATE BY DESIGN
No account, no adverts, no tracking. Your location is only used on your iPhone while the app is open, and is never sent to us.

Please don't use Pumpwise while driving. Let a passenger check, or look before you set off.

Prices from FuelWatch, Government of Western Australia: www.fuelwatch.wa.gov.au. Pumpwise is not affiliated with any government, station or fuel brand.
```

**What's New** (version 1.0.0)
```
First release, covering Western Australia.
```

## Screenshots

`store/screenshots/iphone-6.9/` (1320 x 2868) and `store/screenshots/iphone-6.5/` (1284 x 2778), made by `node scripts/screenshots.mjs store` from the web build. They show live FuelWatch prices around Perth on the day they were taken. iPad screenshots are not needed: the app is iPhone only.

## App Privacy (App Store Connect → App Privacy)

- Data collection: **No, we do not collect data from this app.**
- Reason: location is used only on the device and is never sent to the developer or any third party. Price files are downloaded from a public website (GitHub Pages); place search sends only the typed text to Apple's map service (or postcodes.io for UK postcodes). Nothing is linked to the user or used for tracking.
- The privacy manifest in the app agrees: `NSPrivacyTracking` false, no collected data types.

## App Review information

| Field | Value |
|-------|-------|
| Sign-in required | No (untick) |
| Contact email | tyjcraw@gmail.com |
| Review notes | See below |

**Review notes**
```
Pumpwise shows official fuel prices published by FuelWatch (Government of Western Australia), which allows its data to be used in apps with an acknowledgement and link (shown on every screen with prices and on each station page).

The first release covers Western Australia. If you are reviewing elsewhere, the app says "Pumpwise covers Western Australia" after you allow location. Tap "Look around Perth" (or any city in the place list) to see live prices. Everything else works the same: tap the cheapest station for its price board (today and, after 2:30pm Perth time, tomorrow), try Directions, change fuel with the chip at the top, and change the search area.

No account, no in-app purchases and no adverts. Location is used only while the app is open and never leaves the device.
```

## Export compliance

`ITSAppUsesNonExemptEncryption` is false in the app, so no export compliance questions come up when a build is uploaded.
