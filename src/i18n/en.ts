/**
 * English: the words Pumpwise was written in, and the fallback for any language it doesn't speak.
 * Spanish (es.ts) and French (fr.ts) must have exactly these keys, with the same arguments.
 */
export const en = {
  // Prices and units
  'unit.euros': 'euros',
  'unit.pesos': 'pesos',
  'unit.pence': 'pence',
  'unit.cents': 'cents',
  'price.perLitreSpoken': (value: string, unit: string) => `${value} ${unit} a litre`,
  'units.underTenthMile': 'Under 0.1 mi',
  'list.join': (first: string, last: string) => `${first} and ${last}`,

  // Time
  'time.unknown': 'time unknown',
  'time.justNow': 'just now',
  'time.ago': (span: string) => `${span} ago`,
  'time.minutes': (n: number) => `${n} min`,
  'time.hours': (n: number) => `${n} h`,
  'time.days': (n: number) => (n === 1 ? '1 day' : `${n} days`),

  // How fresh a price is
  'fresh.updated': (ago: string) => `Updated ${ago}`,
  'fresh.unchangedFor': (span: string) => `Unchanged for ${span}`,
  'fresh.notConfirmedSince': (ago: string) => `Not confirmed since ${ago}`,
  'fresh.reported': (ago: string) => `Reported ${ago}`,
  'fresh.current': 'Current price',
  'fresh.dateUnknown': 'Date unknown',
  'fresh.newFrom6': 'New price from 6am',
  'fresh.from6Tomorrow': 'Price from 6am tomorrow',
  'fresh.today': "Today's price",
  'fresh.fromDay': (day: string) => `Price from ${day}`,

  // Days, Monday first
  'day.0': 'Monday',
  'day.1': 'Tuesday',
  'day.2': 'Wednesday',
  'day.3': 'Thursday',
  'day.4': 'Friday',
  'day.5': 'Saturday',
  'day.6': 'Sunday',

  // Opening hours
  'hours.closedNow': 'Closed now',
  'hours.tomorrow': 'tomorrow',
  'hours.onDay': (day: string) => day,
  'hours.closedOpensDay': (when: string) => `Closed · opens ${when}`,
  'hours.closedOpensDayAt': (when: string, clock: string) => `Closed · opens ${when} ${clock}`,
  'hours.closed': 'Closed',
  'hours.dayClosed': 'Closed',
  'hours.openUntil': (clock: string) => `Open until ${clock}`,
  'hours.open24': 'Open 24 hours',
  'hours.closedOpensAt': (clock: string) => `Closed · opens ${clock}`,
  'hours.notGiven': 'Not given',
  'hours.allDay': '24 hours',

  // Warnings about the feed
  'warn.todayMissing': "Today's prices haven't come through yet. Showing the last ones we have.",
  'warn.feedOld': (ago: string) => `The price feed last updated ${ago}. Prices may have changed since.`,

  // Where the search is
  'area.near': (name: string) => `Near ${name}`,
  'area.nearYou': 'Near you',
  'area.hintHere': 'Just around here',
  'area.hintShort': 'A short drive',
  'area.hintDetour': 'Worth a detour',
  'area.hintWide': 'Wide search',
  'search.within': (radius: string) => `Within ${radius}`,
  'search.fuel': 'Fuel',
  'search.area': 'Search area',

  // Tomorrow's price (WA)
  'tomorrow.spoken': (price: string, change: string) => `Tomorrow ${price}, ${change}`,
  'tomorrow.compact': (price: string) => `${price} tomorrow`,
  'tomorrow.full': (price: string, change: string) => `Tomorrow ${price} (${change})`,

  // Station tags
  'tag.membersOnly': 'Members only',
  'tag.permitNeeded': 'Permit needed',
  'tag.permitEntry': 'Entry permit needed',
  'tag.unmanned': 'Unmanned, card only',
  'tag.lowAromatic': 'Low aromatic fuel',
  'tag.motorway': 'Motorway services',
  'tag.supermarket': 'Supermarket',
  'tag.toilets': 'Toilets',
  'tag.carWash': 'Car wash',
  'tag.payAtPump': '24-hour pay at pump',
  'tag.adblue': 'AdBlue',
  'tag.lpg': 'LPG',
  'tag.air': 'Air',
  'tag.water': 'Water',
  'tag.atm': 'ATM',
  'tag.truck': 'Truck friendly',

  // Common buttons
  'action.directions': 'Directions',
  'action.details': 'Details',
  'action.close': 'Close',
  'action.back': 'Back',
  'action.tryAgain': 'Try again',
  'action.retry': 'Retry',
  'action.allowLocation': 'Allow location',
  'action.choosePlace': 'Choose a place',
  'action.continue': 'Continue',
  'action.cancel': 'Cancel',
  'a11y.opensStation': "Opens the station's prices and hours",

  // Tabs
  'tab.nearby': 'Nearby',
  'tab.map': 'Map',
  'tab.settings': 'Settings',

  // Station list rows
  'row.total': (money: string) => `${money} total`,
  'row.till': (clock: string) => `Till ${clock}`,

  // Loading, empty and error states
  'state.loading': 'Loading prices',
  'state.permissionTitle': 'See prices around you',
  'state.permissionBody': 'Pumpwise uses your location to find the nearest station and the cheapest one near you. Your exact location stays on your iPhone.',
  'state.choosePlaceInstead': 'Choose a place instead',
  'state.deniedTitle': 'Location is off',
  'state.deniedBodyAsk': 'Pumpwise needs your location to show what is nearby. You can also search around a town or postcode.',
  'state.deniedBodySettings': 'Turn on location for Pumpwise in Settings, or search around a town or postcode instead.',
  'state.openSettings': 'Open Settings',
  'state.locationErrorTitle': "Can't find you right now",
  'state.locationErrorBody': "Your iPhone couldn't get a location fix. This can happen indoors or underground.",
  'state.notCoveredTitle': (places: string) => `Pumpwise covers ${places}`,
  'state.notCoveredBody': "Prices come from official government schemes, and this place isn't covered yet. Pick somewhere that is to look around.",
  'state.lookAround': (city: string) => `Look around ${city}`,
  'state.regionDownTitle': 'Prices are on their way',
  'state.regionDownBody': (region: string) => `${region} prices couldn't be collected just now. They usually come back within the hour.`,
  'state.offlineTitle': 'No connection',
  'state.offlineBody': 'Pumpwise needs a data connection to fetch the latest prices.',
  'state.errorTitle': "Prices didn't load",
  'state.errorBody': 'The price feed did not answer. It usually comes back within a few minutes.',
  'state.checkAgain': 'Check again',
  'state.emptyTitle': (radius: string) => `Nothing within ${radius}`,
  'state.emptyBody': (fuel: string, code: string) => `No station in this area has a price for ${fuel} (${code}) right now.`,
  'state.emptyTryWider': 'Try a wider area or another fuel.',
  'state.emptyTryOther': 'Try another fuel, or choose a place to look around.',
  'state.searchWithin': (radius: string) => `Search within ${radius}`,

  // Nearby tab
  'sort.cheapest': 'Cheapest',
  'sort.closest': 'Closest',
  'sort.value': 'Best value',
  'trend.drops': (fuel: string, amount: string) => `Tomorrow ${fuel} drops about ${amount} around here. Wait if you can.`,
  'trend.rises': (fuel: string, amount: string) => `Tomorrow ${fuel} rises about ${amount} around here. Fill up today.`,
  'trend.same': (fuel: string) => `Tomorrow's ${fuel} prices around here are about the same as today.`,
  'value.title': 'Best value once you count the drive',
  'value.withDrive': (money: string) => `${money} with the fuel to get there and back`,
  'nearby.refresh': 'Refresh prices',
  'nearby.searching': (area: string) => `Searching ${area}. Change place`,
  'nearby.checked': (ago: string) => `· checked ${ago}`,
  'nearby.couldntUpdate': (ago: string) => `Couldn't update. Showing prices from ${ago}.`,
  'nearby.allClosed': (radius: string) => `Every station within ${radius} is closed right now, members only, or hasn't confirmed its price lately.`,
  'nearby.allNearby': 'All nearby',
  'nearby.stations': (n: number) => (n === 1 ? '1 station' : `${n} stations`),
  'nearby.straightLine': 'Distances are in a straight line.',
  'report.priceWrong': 'Price wrong at the pump?',

  // Cheapest and nearest cards
  'hero.cheapestWithin': (radius: string) => `Cheapest within ${radius}`,
  'hero.alsoNearest': 'Also the nearest',
  'hero.cheapestSpoken': (summary: string) => `Cheapest: ${summary}`,
  'hero.nearestSpoken': (summary: string) => `Nearest: ${summary}`,
  'hero.nearestHint': "Opens the station's prices and hours. Swipe up or down for directions.",
  'hero.nearest': 'Nearest',
  'hero.nearestOutside': 'Nearest (outside your area)',
  'hero.directionsTo': (name: string) => `Directions to ${name}`,
  'hero.saves': 'Saves',
  'hero.savesRest': (litres: number, extra: string, still: string) => `on a ${litres} L fill-up compared with the nearest${extra}.${still}`,
  'hero.extraThereBack': (distance: string) => `, even after the extra ${distance} there and back`,
  'hero.betterStill': (name: string, money: string) => ` ${name}, below, is ${money} better again once you count the drive.`,
  'hero.onlyAhead': (money: string, litres: number, distance: string, verdict: string) =>
    `Only ${money} ahead on a ${litres} L fill-up once you count the extra ${distance} there and back. ${verdict}`,
  'hero.cheaperButFar': (distance: string, litres: number, verdict: string) =>
    `Cheaper at the pump, but the extra ${distance} there and back costs more than it saves on ${litres} L. ${verdict}`,
  'hero.verdictBetterPick': 'The best value pick below beats both.',
  'hero.verdictFine': 'The nearest is fine today.',
  'hero.verdictNearest': 'The nearest is the better deal.',

  // Map tab
  'map.recentre': 'Recentre map',
  'map.cheapest': 'Cheapest',
  'map.selected': 'Selected',
  'map.selectedStation': 'Selected station',
  'map.tryWider': 'Try a wider area with the chip at the top.',
  'map.background': 'Map background',
  'map.webNote': 'Map preview. The iPhone app shows Apple Maps.',

  // Station screen
  'station.title': 'Station',
  'station.notFound': 'Station not found',
  'station.notFoundBody': 'Prices may have refreshed. Go back and pick it again.',
  'station.today': 'Today',
  'station.tomorrow': 'Tomorrow',
  'station.tomorrowSpoken': (price: string) => `tomorrow ${price}`,
  'station.makeYourFuel': 'Makes this your fuel',
  'station.noPrice': (fuel: string) => `No ${fuel} price at this station.`,
  'station.hours': 'Opening hours',
  'station.facilities': 'At this station',

  // Settings tab
  'settings.title': 'Settings',
  'settings.showing': (region: string) => `Showing ${region} fuels and units.`,
  'settings.fuel': 'Your fuel',
  'settings.areaHint': 'How far to look for the cheapest station. The nearest one is always shown.',
  'settings.fill': 'Typical fill-up',
  'settings.fillHint': 'Used to show what you save.',
  'settings.mpg': "Your car's miles per gallon",
  'settings.economy': "Your car's fuel use",
  'settings.economyHint': (unit: string, money: string) =>
    `"Best value" adds the fuel to drive there and back. Each extra ${unit} costs about ${money} there and back.`,
  'settings.members': 'Members-only stations',
  'settings.membersHint': 'Some stations, like Costco, only sell to members. Turn this on if you are one.',
  'settings.includeMembers': 'Include members-only stations',
  'settings.directions': 'Directions open in',
  'settings.myLocation': 'My location',
  'settings.chosenPlace': 'A chosen place',
  'settings.appearance': 'Appearance',
  'theme.system': 'Automatic',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'settings.about': 'About',
  'settings.whereFrom': 'Where the prices come from',
  'settings.report': 'Report a wrong price',
  'settings.privacy': 'Privacy',
  'settings.adPrivacy': 'Ad privacy choices',
  'settings.terms': 'Terms of use',
  'settings.contact': 'Contact support',
  'settings.reset': 'Reset settings',
  'settings.resetTitle': 'Reset settings?',
  'settings.resetMessage': 'Your fuel, search area, fill-up, car and maps app go back to the defaults.',
  'settings.resetConfirm': 'Reset',
  'settings.footer': (version: string) => `Pumpwise ${version} · No account. A small ad keeps it free.`,

  // Choose a place
  'place.title': 'Search around',
  'place.placeholder': 'Suburb, town or postcode',
  'place.noMatch': (places: string, query: string) => `Nothing in ${places} matches “${query}”.`,
  'place.searchDown': "Search isn't answering. Check your connection, or pick a city below.",
  'place.useMyLocation': 'Use my location',
  'place.locationOff': 'Location is off for Pumpwise. Tap to open Settings.',
  'place.follows': 'Follows you as you drive',
  'place.recent': 'Recent',
  'place.cities': 'Cities',
  'place.privacy': "Search uses Apple's map service (and postcodes.io for UK postcodes). Only what you type is sent.",

  // Where prices come from
  'about.title': 'Where prices come from',
  'about.intro':
    'Pumpwise shows official prices that stations must report to government price schemes. It adds a new place whenever a government publishes its prices for free.',
  'about.feed': (ago: string, count: string) => `The Pumpwise feed was last rebuilt ${ago} and covers ${count} stations.`,
  'about.priceWrong': (label: string) => `Price wrong? ${label}`,
  'about.rankTitle': 'Cheapest, nearest and best value',
  'about.rankBody':
    "Cheapest is the lowest price inside your search area at a station that is open. Nearest is the closest open station that sells your fuel. Best value adds the fuel you would burn driving there and back, using your car's fuel use, so a slightly dearer station next door can beat a cheap one far away.",
  'about.membersTitle': 'Members-only and remote stations',
  'about.membersBody':
    'Stations that only sell to members, or that need an entry permit, are labelled and never picked as the cheapest. If you are a member, you can include members-only stations in Settings.',
  'about.distanceTitle': 'Distances',
  'about.distanceBody': 'Distances are in a straight line. Roads are longer, so expect the drive to be a little further.',
  'about.independenceTitle': 'Independence',
  'about.independenceBody': 'Pumpwise is not affiliated with any government, station or fuel brand.',

  // First run
  'onboard.skip': 'Skip',
  'onboard.headline': 'Cheap fuel,\nclose by.',
  'onboard.pitch': 'Open Pumpwise and see the nearest station and the cheapest one around you, with directions in one tap.',
  'onboard.covering': (places: string) => ` Covering ${places}.`,
  'onboard.cheapest': 'CHEAPEST',
  'onboard.nearest': 'NEAREST',
  'onboard.factNsw': 'Official government prices that stations must report by law: FuelWatch in WA, FuelCheck in NSW, the ACT and Tasmania.',
  'onboard.factWa': "Official government prices. In WA every station's price is fixed for the day, and tomorrow's are out by 2:30pm.",
  'onboard.factOfficial': "Official prices that stations must report by law, straight from each government's own price service.",
  'onboard.fuelTitle': 'What do you fill up with?',
  'onboard.fuelBody': 'You can switch any time from the top of the screen.',
  'onboard.locTitle': 'Find stations around you',
  'onboard.locBody': 'Pumpwise uses your location only while it is open, to work out what is near. Your exact location stays on your iPhone.',
  'onboard.driving': 'Driving? Let a passenger check, or look before you set off. Directions open in your maps app.',
  'onboard.notNow': 'Not now',

  // Legal documents (kept in English, the binding version)
  'legal.privacy': 'Privacy Policy',
  'legal.terms': 'Terms of Use',
  'legal.updated': (date: string) => `Last updated ${date}`,
  'legal.englishOnly': '',

  // Not found
  'notFound.title': 'Wrong turn',
  'notFound.body': "That page doesn't exist in Pumpwise.",
  'notFound.back': 'Back to nearby prices',
};

export type Strings = typeof en;
