// Fuel price pages for the Pumpwise website: one page per town and city ("Fuel prices in Perth today"),
// one per region and an index, all made from the same official prices the app shows.
//
// This file is pure: it takes the feed (meta.json and one station list per region) and returns the
// pages as text. build.mjs reads the feed from out/site and writes the files. Nothing here fetches
// anything, so it can never slow down or break the price feed.
//
// Rules it follows:
// - Every page carries the source's credit, licence and update time (meta.licences), as each licence asks.
// - A region whose licence forbids republishing (reuse "no-republish", Queensland) gets no pages.
// - Prices are shown exactly as reported; anything older than STALE_DAYS is left out.
// - Pages are written in the language people search in: English, Spanish, French or Portuguese.

// The site's own domain since 13 November 2026 (GitHub Pages sends the old tjcraw6589.github.io/pumpwise/
// addresses here with a permanent redirect, so old links, the app's feed address and Search Console keep working).
export const SITE_BASE = 'https://pumpwiseapp.com';
// Google AdSense publisher ID (ca-pub-...), empty until Tyler's AdSense account exists. When set, every page
// except Tasmania's loads Google's ad script and the site root gets ads.txt. Tasmania stays ad free because its
// government has published no reuse licence (data-licences.html), so its prices are never shown beside adverts.
export const ADSENSE_CLIENT = '';
const NO_ADS = new Set(['tas']);
export const BASE = `${SITE_BASE}/prices`;
const APP_STORE = 'https://apps.apple.com/au/app/pumpwise-fuel-prices-near-me/id6828174153';
const STALE_DAYS = 10;
const MIN_STATIONS = 3;
const TOP = 10;
const MAX_FUELS = 4;
const FILL_LITRES = 50;

const AU_FUELS = {
  regular: 'Unleaded 91', e10: 'E10', premium: 'Premium 95', super: 'Premium 98', diesel: 'Diesel',
  'premium-diesel': 'Premium diesel', lpg: 'LPG', e85: 'E85', b20: 'B20',
};

/**
 * What each region needs to be written properly. `app` is true only where the Pumpwise version in the
 * App Store today covers the region (1.0: Western Australia); add the others when 1.2 is released.
 * `pc` is how many leading postcode digits tell two towns of the same name apart.
 */
export const REGIONS = {
  wa: {
    slug: 'western-australia', name: 'Western Australia', lang: 'en', locale: 'en-AU', tz: 'Australia/Perth', zone: 'perth', money: 'cents', app: true,
    fuels: ['regular', 'diesel', 'premium', 'super', 'premium-diesel', 'lpg'], labels: AU_FUELS, fixedDaily: true,
    cities: [
      ['Perth', -31.9523, 115.8613, 30], ['Fremantle', -32.0569, 115.7439, 8], ['Joondalup', -31.7448, 115.7661, 8],
      ['Mandurah', -32.5269, 115.7217, 12], ['Bunbury', -33.3271, 115.6414, 12], ['Geraldton', -28.7774, 114.6149, 12],
      ['Albany', -35.0269, 117.8837, 12], ['Kalgoorlie', -30.7489, 121.4658, 12], ['Broome', -17.9614, 122.2359, 12],
    ],
  },
  nsw: {
    slug: 'new-south-wales', name: 'New South Wales and the ACT', lang: 'en', locale: 'en-AU', tz: 'Australia/Sydney', zone: 'sydney', money: 'cents', app: false,
    fuels: ['regular', 'e10', 'diesel', 'premium', 'super', 'premium-diesel', 'lpg'], labels: AU_FUELS,
    cities: [
      ['Sydney', -33.8688, 151.2093, 30], ['Parramatta', -33.815, 151.0011, 8], ['Newcastle', -32.9283, 151.7817, 15],
      ['Wollongong', -34.4278, 150.8931, 15], ['Central Coast', -33.425, 151.342, 18], ['Canberra', -35.2809, 149.13, 20],
    ],
  },
  tas: {
    slug: 'tasmania', name: 'Tasmania', lang: 'en', locale: 'en-AU', tz: 'Australia/Hobart', zone: 'hobart', money: 'cents', app: false,
    fuels: ['regular', 'diesel', 'premium', 'super', 'premium-diesel', 'e10'], labels: AU_FUELS,
    cities: [['Hobart', -42.8821, 147.3272, 15], ['Launceston', -41.4332, 147.1441, 12]],
  },
  es: {
    slug: 'spain', name: 'España', lang: 'es', locale: 'es-ES', tz: 'Europe/Madrid', zone: 'madrid', money: 'euro', app: false, pc: 2,
    fuels: ['regular', 'diesel', 'super', 'premium-diesel', 'lpg'],
    labels: { regular: 'Gasolina 95', e10: 'Gasolina 95 E10', premium: 'Gasolina 95 Premium', super: 'Gasolina 98', diesel: 'Gasóleo A (diésel)', 'premium-diesel': 'Gasóleo Premium', lpg: 'GLP', e85: 'E85', hvo: 'Diésel renovable (HVO)' },
    cities: [],
  },
  fr: {
    slug: 'france', name: 'France', lang: 'fr', locale: 'fr-FR', tz: 'Europe/Paris', zone: 'paris', money: 'euro', app: false, pc: 2,
    fuels: ['regular', 'diesel', 'super', 'e85', 'premium', 'lpg'],
    labels: { regular: 'SP95 E10', premium: 'SP95', super: 'SP98', diesel: 'Gazole', e85: 'E85', lpg: 'GPL' },
    cities: [],
  },
  mx: {
    slug: 'mexico', name: 'México', lang: 'es', locale: 'es-MX', tz: 'America/Mexico_City', zone: 'mexico', money: 'peso', app: false, current: true,
    fuels: ['regular', 'premium', 'diesel'],
    labels: { regular: 'Gasolina regular (Magna)', premium: 'Gasolina Premium', diesel: 'Diésel' },
    cities: [
      ['Ciudad de México', 19.4326, -99.1332, 25], ['Guadalajara', 20.6597, -103.3496, 20], ['Monterrey', 25.6866, -100.3161, 20],
      ['Puebla', 19.0414, -98.2063, 15], ['Tijuana', 32.5149, -117.0382, 15], ['León', 21.1219, -101.6826, 15],
      ['Ciudad Juárez', 31.6904, -106.4245, 15], ['Querétaro', 20.5888, -100.3899, 15], ['Mérida', 20.9674, -89.5926, 15],
      ['Cancún', 21.1619, -86.8515, 15], ['Toluca', 19.2826, -99.6557, 15], ['Chihuahua', 28.6353, -106.0889, 15],
      ['Aguascalientes', 21.8853, -102.2916, 15], ['San Luis Potosí', 22.1565, -100.9855, 15], ['Hermosillo', 29.0729, -110.9559, 15],
      ['Saltillo', 25.4232, -101.0053, 15], ['Mexicali', 32.6245, -115.4523, 15], ['Culiacán', 24.8091, -107.394, 15],
      ['Morelia', 19.706, -101.195, 15], ['Torreón', 25.5428, -103.4068, 15], ['Veracruz', 19.1738, -96.1342, 15],
      ['Acapulco', 16.8531, -99.8237, 15], ['Villahermosa', 17.9892, -92.9475, 15], ['Tuxtla Gutiérrez', 16.7516, -93.1029, 15],
      ['Oaxaca', 17.0732, -96.7266, 12], ['Durango', 24.0277, -104.6532, 12], ['Tampico', 22.2331, -97.8611, 15],
      ['Mazatlán', 23.2494, -106.4111, 12], ['Cuernavaca', 18.9242, -99.2216, 12], ['Pachuca', 20.1011, -98.7591, 12],
      ['Celaya', 20.5235, -100.8157, 12], ['Irapuato', 20.6787, -101.3545, 12], ['Reynosa', 26.0508, -98.2979, 15],
      ['Matamoros', 25.869, -97.5027, 12], ['Ensenada', 31.8667, -116.5964, 12], ['Xalapa', 19.5438, -96.9102, 12],
      ['Tepic', 21.5042, -104.8946, 12], ['La Paz', 24.1426, -110.3128, 12], ['Campeche', 19.8301, -90.5349, 12],
      ['Colima', 19.2452, -103.7241, 12], ['Zacatecas', 22.7709, -102.5832, 12], ['Puerto Vallarta', 20.6534, -105.2253, 12],
      ['Nuevo Laredo', 27.4779, -99.5496, 12], ['Los Mochis', 25.7904, -108.9859, 12], ['Playa del Carmen', 20.6296, -87.0739, 12],
    ],
  },
  pt: {
    slug: 'portugal', name: 'Portugal', lang: 'pt', locale: 'pt-PT', tz: 'Europe/Lisbon', zone: 'lisbon', money: 'euro', app: false, pc: 1,
    fuels: ['regular', 'diesel', 'premium-diesel', 'super', 'premium', 'lpg'],
    labels: { regular: 'Gasolina simples 95', premium: 'Gasolina especial 95', super: 'Gasolina 98', diesel: 'Gasóleo simples', 'premium-diesel': 'Gasóleo especial', lpg: 'GPL Auto' },
    cities: [],
  },
};

/** Page titles and descriptions: always in the page's own language, for search engines. */
const T = {
  en: {
    title: (p) => `Fuel prices in ${p} today: cheapest petrol and diesel | Pumpwise`,
    desc: (f, price, p, s, n) => `${f} from ${price} today in ${p} (${s}). Compare ${n} stations with official prices, updated through the day.`,
    regionTitle: (r) => `Fuel prices in ${r} today by town and city | Pumpwise`,
    regionDesc: (r, n, k) => `Official fuel prices from ${n} stations in ${r}: today's cheapest petrol and diesel in ${k} towns and cities.`,
    indexTitle: 'Fuel prices today by town and city: official prices | Pumpwise',
    indexDesc: (n) => `Today's cheapest petrol and diesel from ${n} stations, using each government's official prices. Pick a country and a town.`,
  },
  es: {
    title: (p) => `Precio de la gasolina hoy en ${p}: gasolineras más baratas | Pumpwise`,
    desc: (f, price, p, s, n) => `${f} desde ${price} hoy en ${p} (${s}). Compara ${n} gasolineras con precios oficiales, actualizados durante el día.`,
    regionTitle: (r) => `Precio de la gasolina hoy en ${r} por municipio | Pumpwise`,
    regionDesc: (r, n, k) => `Precios oficiales de ${n} gasolineras de ${r}: la gasolina y el diésel más baratos hoy en ${k} municipios y ciudades.`,
  },
  fr: {
    title: (p) => `Prix des carburants à ${p} aujourd'hui : stations les moins chères | Pumpwise`,
    desc: (f, price, p, s, n) => `${f} à partir de ${price} aujourd'hui à ${p} (${s}). Comparez ${n} stations avec les prix officiels, mis à jour toute la journée.`,
    regionTitle: (r) => `Prix des carburants aujourd'hui en ${r} par commune | Pumpwise`,
    regionDesc: (r, n, k) => `Prix officiels de ${n} stations en ${r} : l'essence et le gazole les moins chers aujourd'hui dans ${k} communes.`,
  },
  pt: {
    title: (p) => `Preços dos combustíveis em ${p} hoje: postos mais baratos | Pumpwise`,
    desc: (f, price, p, s, n) => `${f} desde ${price} hoje em ${p} (${s}). Compare ${n} postos com preços oficiais, atualizados ao longo do dia.`,
    regionTitle: (r) => `Preços dos combustíveis hoje em ${r} por localidade | Pumpwise`,
    regionDesc: (r, n, k) => `Preços oficiais de ${n} postos em ${r}: a gasolina e o gasóleo mais baratos hoje em ${k} localidades.`,
  },
};

/**
 * Everything a visitor reads on a page, in every language the site speaks. The page is written in its
 * own language (Spanish for Madrid) for search engines; site.js then switches these texts to the
 * visitor's browser language, or to the one picked in the header (Tyler, 12 Nov 2026: someone in Lisbon
 * who only reads English must be able to use the Lisbon page). {name} marks a value filled in per page;
 * a value written { k: key } is itself one of these texts (a region name, a time zone), so it switches too.
 */
export const LANGS = { en: 'English', es: 'Español', fr: 'Français', pt: 'Português' };
export const U = {
  en: {
    searchFailed: 'The list of places could not be loaded. Check your connection and try again.',
    loadFailed: 'Prices could not be loaded. Check your connection and try again.',
    mxPlaces: 'Municipality names and boundaries: INEGI, Marco Geoestadístico 2024, simplified by Pumpwise.',
    home: 'Fuel prices', find: 'Find a town', language: 'Language', stations: 'stations', nStations: '{n} stations',
    skip: 'Skip to content',
    h1: 'Fuel prices in {p} today', lead: 'The cheapest {f} in {p} today is {price} at {s}.',
    countSell: '{n} stations, {k} sell {f}',
    saving: 'The average across {n} stations is {avg}, so the cheapest saves about {save} on a 50 litre fill.',
    leftOut: 'Members only stations and prices that look wrong are left out of the cheapest price and the average.',
    cheapest: 'Cheapest', average: 'Average', avgIs: 'Average {v}', reported: 'Reported', perLitre: 'per litre',
    membersOnly: 'Members only', permitNeeded: 'Entry permit needed', checkPrice: 'Check price',
    nearby: 'Nearby places', allIn: 'All places in {r}',
    updated: 'Updated', source: 'Source', licence: 'Licence',
    updatedAt: 'Updated {d} at {t}, {z} time', updatedToday: 'Updated today at {t}, {z} time',
    updatedLocal: 'Updated {d} at {t}, your time', updatedLocalToday: 'Updated today at {t}, your time', updatedUtc: 'Updated {d} at {t} UTC',
    z_perth: 'Perth', z_sydney: 'Sydney', z_hobart: 'Hobart', z_madrid: 'Madrid', z_paris: 'Paris', z_lisbon: 'Lisbon', z_mexico: 'Mexico City',
    rn_wa: 'Western Australia', rn_nsw: 'New South Wales and the ACT', rn_tas: 'Tasmania', rn_es: 'Spain', rn_fr: 'France', rn_mx: 'Mexico', rn_pt: 'Portugal',
    disclaimer: 'Prices are the ones stations report to the official service. The price at the pump is what you pay.',
    reuse: 'The price tables on this page may be reused under the same licence.',
    regionH1: 'Fuel prices in {r} today', regionLead: '{n} stations, {k} towns and cities. Pick a place to see its cheapest stations.',
    cheapPlaces: 'Cheapest places today', from: 'from', legend: 'Each place shows its number of stations, then its cheapest price.',
    indexH1: 'Find the cheapest fuel today', indexLead: 'Official prices from {n} stations in {k} countries and states, updated through the day.',
    app: 'Pumpwise for iPhone shows the cheapest station near you and whether it is worth the drive.', appLink: 'Get Pumpwise on the App Store',
    appHome: 'Pumpwise for iPhone is in the Australian App Store now. More countries are coming.', appHomeLink: 'See Pumpwise on the App Store',
    fixed: 'In Western Australia every station fixes its price for 24 hours from 6am.',
    tomorrowH: 'Tomorrow in {p}',
    tomorrowUp: '{f}: average {avg} tomorrow, up {d} on today. Cheapest tomorrow: {min} at {s}.',
    tomorrowDown: '{f}: average {avg} tomorrow, down {d} on today. Cheapest tomorrow: {min} at {s}.',
    tomorrowSame: '{f}: average {avg} tomorrow, the same as today. Cheapest tomorrow: {min} at {s}.',
    searchLabel: 'Search for a town, suburb or postcode', searchPh: 'Type a town or postcode', noMatch: 'No place with that name. Try another spelling.', go: 'Go',
    nearPlace: '{a}, near {p}',
    bestNow: 'Cheapest right now', directions: 'Directions', directionsTo: 'Directions to {s}',
    cheapestFuel: 'Cheapest price of each fuel', fuelPick: 'Fuel',
    showAll: 'Show all {n} stations', capped: 'Showing the {k} cheapest.', aToZ: 'All places A to Z', jump: 'Jump to a letter',
    licences: 'Data licences', privacy: 'Privacy', popular: 'Popular places', regions: 'Countries and states', perLitreAvg: 'average, per litre',
    placesCount: '{k} places', trust1: 'Official government prices', trust2: 'Updated through the day', trust3: 'Free to use, no sign up',
    nearBtn: 'Show stations near me', nearH: 'Closest stations to you', finding: 'Finding your location', loading: 'Loading prices near you',
    denied: 'Location is off for this page. Allow it in your browser settings, or search for a town instead.',
    failed: 'Your location could not be found. Search for a town instead.', none: 'No stations with prices within 120 km of you.',
    nearPrivacy: 'Your location stays in your browser. It is only used to pick which prices to load.', cheapestHere: 'Cheapest of these',
    sortBy: 'Sort by', sortNear: 'Nearest', sortCheap: 'Cheapest',
    notFoundH: 'Page not found', notFoundLead: 'This page does not exist or has moved. Search for a town, or pick a country or state.',
  },
  es: {
    searchFailed: 'No se pudo cargar la lista de lugares. Comprueba la conexión y vuelve a intentarlo.',
    loadFailed: 'No se pudieron cargar los precios. Comprueba la conexión y vuelve a intentarlo.',
    mxPlaces: 'Nombres y límites de los municipios: INEGI, Marco Geoestadístico 2024, simplificados por Pumpwise.',
    home: 'Precios de carburantes', find: 'Buscar un lugar', language: 'Idioma', stations: 'gasolineras', nStations: '{n} gasolineras',
    skip: 'Saltar al contenido',
    h1: 'Precio de la gasolina y el diésel hoy en {p}', lead: 'Hoy en {p} el precio más bajo de {f} es {price}, en {s}.',
    countSell: '{n} gasolineras, {k} venden {f}',
    saving: 'La media de {n} gasolineras es {avg}: llenar 50 litros al precio más bajo ahorra unos {save}.',
    leftOut: 'Las gasolineras solo para socios y los precios que parecen erróneos no cuentan para el precio más bajo ni para la media.',
    cheapest: 'Más barato', average: 'Media', avgIs: 'Media {v}', reported: 'Comunicado', perLitre: 'por litro',
    membersOnly: 'Solo socios', permitNeeded: 'Requiere permiso de acceso', checkPrice: 'Comprueba el precio',
    nearby: 'Lugares cercanos', allIn: 'Todos los lugares de {r}',
    updated: 'Actualizado', source: 'Fuente', licence: 'Licencia',
    updatedAt: 'Actualizado el {d} a las {t}, hora de {z}', updatedToday: 'Actualizado hoy a las {t}, hora de {z}',
    updatedLocal: 'Actualizado el {d} a las {t}, hora local', updatedLocalToday: 'Actualizado hoy a las {t}, hora local', updatedUtc: 'Actualizado el {d} a las {t} UTC',
    z_perth: 'Perth', z_sydney: 'Sídney', z_hobart: 'Hobart', z_madrid: 'Madrid', z_paris: 'París', z_lisbon: 'Lisboa', z_mexico: 'Ciudad de México',
    rn_wa: 'Australia Occidental', rn_nsw: 'Nueva Gales del Sur y el ACT', rn_tas: 'Tasmania', rn_es: 'España', rn_fr: 'Francia', rn_mx: 'México', rn_pt: 'Portugal',
    disclaimer: 'Los precios son los que las estaciones comunican al servicio oficial. El precio válido es el del surtidor.',
    reuse: 'Las tablas de precios de esta página pueden reutilizarse con la misma licencia.',
    regionH1: 'Precio de la gasolina y el diésel hoy en {r}', regionLead: '{n} gasolineras, {k} municipios y ciudades. Elige un lugar para ver sus gasolineras más baratas.',
    cheapPlaces: 'Lugares más baratos hoy', from: 'desde', legend: 'Cada lugar muestra su número de gasolineras y su precio más bajo.',
    indexH1: 'Encuentra el combustible más barato hoy', indexLead: 'Precios oficiales de {n} gasolineras en {k} países y estados, actualizados durante el día.',
    app: 'Pumpwise para iPhone muestra la gasolinera más barata cerca de ti y si merece la pena el viaje.', appLink: 'Descarga Pumpwise en el App Store',
    appHome: 'Pumpwise para iPhone ya está en el App Store de Australia. Pronto llegará a más países.', appHomeLink: 'Ver Pumpwise en el App Store',
    fixed: 'En Australia Occidental cada gasolinera fija su precio durante 24 horas desde las 6 de la mañana.',
    tomorrowH: 'Mañana en {p}',
    tomorrowUp: '{f}: media de {avg} mañana, {d} más que hoy. Lo más barato mañana: {min} en {s}.',
    tomorrowDown: '{f}: media de {avg} mañana, {d} menos que hoy. Lo más barato mañana: {min} en {s}.',
    tomorrowSame: '{f}: media de {avg} mañana, igual que hoy. Lo más barato mañana: {min} en {s}.',
    searchLabel: 'Buscar un municipio, barrio o código postal', searchPh: 'Escribe un lugar o código postal', noMatch: 'Ningún lugar con ese nombre. Prueba a escribirlo de otra forma.', go: 'Ir',
    nearPlace: '{a}, cerca de {p}',
    bestNow: 'Lo más barato ahora', directions: 'Cómo llegar', directionsTo: 'Cómo llegar a {s}',
    cheapestFuel: 'Precio más bajo de cada combustible', fuelPick: 'Combustible',
    showAll: 'Ver las {n} gasolineras', capped: 'Se muestran las {k} más baratas.', aToZ: 'Todos los lugares de la A a la Z', jump: 'Ir a una letra',
    licences: 'Licencias de datos', privacy: 'Privacidad', popular: 'Lugares populares', regions: 'Países y estados', perLitreAvg: 'media, por litro',
    placesCount: '{k} lugares', trust1: 'Precios oficiales de los gobiernos', trust2: 'Actualizados durante el día', trust3: 'Gratis, sin registro',
    nearBtn: 'Ver gasolineras cerca de mí', nearH: 'Las gasolineras más cercanas', finding: 'Buscando tu ubicación', loading: 'Cargando precios cerca de ti',
    denied: 'La ubicación está desactivada para esta página. Actívala en los ajustes del navegador o busca un lugar.',
    failed: 'No se pudo encontrar tu ubicación. Busca un lugar.', none: 'No hay gasolineras con precios a menos de 120 km.',
    nearPrivacy: 'Tu ubicación no sale de tu navegador. Solo se usa para elegir qué precios cargar.', cheapestHere: 'La más barata de estas',
    sortBy: 'Ordenar por', sortNear: 'Más cerca', sortCheap: 'Más barato',
    notFoundH: 'Página no encontrada', notFoundLead: 'Esta página no existe o ha cambiado de dirección. Busca un lugar o elige un país o estado.',
  },
  fr: {
    searchFailed: 'La liste des communes n’a pas pu être chargée. Vérifiez votre connexion et réessayez.',
    loadFailed: 'Les prix n’ont pas pu être chargés. Vérifiez votre connexion et réessayez.',
    mxPlaces: 'Noms et limites des municipalités : INEGI, Marco Geoestadístico 2024, simplifiés par Pumpwise.',
    home: 'Prix des carburants', find: 'Trouver une commune', language: 'Langue', stations: 'stations', nStations: '{n} stations',
    skip: 'Aller au contenu',
    h1: "Prix des carburants à {p} aujourd'hui", lead: "Aujourd'hui à {p}, le prix le plus bas ({f}) est de {price} : {s}.",
    countSell: '{n} stations, dont {k} vendent du {f}',
    saving: 'La moyenne de {n} stations est de {avg} : un plein de 50 litres au prix le plus bas économise environ {save}.',
    leftOut: 'Les stations réservées aux adhérents et les prix qui semblent erronés ne comptent ni pour le prix le plus bas ni pour la moyenne.',
    cheapest: 'Le moins cher', average: 'Moyenne', avgIs: 'Moyenne {v}', reported: 'Déclaré', perLitre: 'le litre',
    membersOnly: 'Réservé aux adhérents', permitNeeded: 'Permis d’accès requis', checkPrice: 'Prix à vérifier',
    nearby: 'À proximité', allIn: 'Toutes les communes : {r}',
    updated: 'Mis à jour', source: 'Source', licence: 'Licence',
    updatedAt: 'Mis à jour le {d} à {t}, heure de {z}', updatedToday: 'Mis à jour aujourd’hui à {t}, heure de {z}',
    updatedLocal: 'Mis à jour le {d} à {t}, heure locale', updatedLocalToday: 'Mis à jour aujourd’hui à {t}, heure locale', updatedUtc: 'Mis à jour le {d} à {t} UTC',
    z_perth: 'Perth', z_sydney: 'Sydney', z_hobart: 'Hobart', z_madrid: 'Madrid', z_paris: 'Paris', z_lisbon: 'Lisbonne', z_mexico: 'Mexico',
    rn_wa: 'Australie-Occidentale', rn_nsw: 'Nouvelle-Galles du Sud et ACT', rn_tas: 'Tasmanie', rn_es: 'Espagne', rn_fr: 'France', rn_mx: 'Mexique', rn_pt: 'Portugal',
    disclaimer: 'Les prix sont ceux déclarés par les stations au service officiel. Le prix affiché à la pompe fait foi.',
    reuse: 'Les tableaux de prix de cette page peuvent être réutilisés sous la même licence.',
    regionH1: "Prix des carburants aujourd'hui : {r}", regionLead: '{n} stations, {k} communes. Choisissez une commune pour voir ses stations les moins chères.',
    cheapPlaces: "Communes les moins chères aujourd'hui", from: 'dès', legend: 'Chaque commune affiche son nombre de stations, puis son prix le plus bas.',
    indexH1: "Trouvez le carburant le moins cher aujourd'hui", indexLead: 'Prix officiels de {n} stations dans {k} pays et États, mis à jour toute la journée.',
    app: 'Pumpwise pour iPhone montre la station la moins chère près de vous et si le détour en vaut la peine.', appLink: 'Télécharger Pumpwise sur l’App Store',
    appHome: 'Pumpwise pour iPhone est disponible sur l’App Store australien. D’autres pays arrivent bientôt.', appHomeLink: 'Voir Pumpwise sur l’App Store',
    fixed: 'Dans l’État d’Australie occidentale, chaque station fixe son prix pour 24 heures à partir de 6 heures.',
    tomorrowH: 'Demain à {p}',
    tomorrowUp: '{f} : moyenne de {avg} demain, en hausse de {d}. Le moins cher demain : {min} chez {s}.',
    tomorrowDown: '{f} : moyenne de {avg} demain, en baisse de {d}. Le moins cher demain : {min} chez {s}.',
    tomorrowSame: '{f} : moyenne de {avg} demain, sans changement. Le moins cher demain : {min} chez {s}.',
    searchLabel: 'Rechercher une commune, un quartier ou un code postal', searchPh: 'Tapez une commune ou un code postal', noMatch: 'Aucune commune de ce nom. Essayez une autre orthographe.', go: 'OK',
    nearPlace: '{a}, près de {p}',
    bestNow: 'Le moins cher maintenant', directions: 'Itinéraire', directionsTo: 'Itinéraire vers {s}',
    cheapestFuel: 'Prix le plus bas de chaque carburant', fuelPick: 'Carburant',
    showAll: 'Voir les {n} stations', capped: 'Les {k} moins chères sont affichées.', aToZ: 'Toutes les communes de A à Z', jump: 'Aller à une lettre',
    licences: 'Licences des données', privacy: 'Confidentialité', popular: 'Lieux populaires', regions: 'Pays et États', perLitreAvg: 'moyenne, le litre',
    placesCount: '{k} communes', trust1: 'Prix officiels des gouvernements', trust2: 'Mis à jour toute la journée', trust3: 'Gratuit, sans inscription',
    nearBtn: 'Voir les stations près de moi', nearH: 'Les stations les plus proches', finding: 'Recherche de votre position', loading: 'Chargement des prix autour de vous',
    denied: 'La localisation est désactivée pour cette page. Autorisez-la dans les réglages du navigateur, ou cherchez une commune.',
    failed: 'Votre position est introuvable. Cherchez une commune.', none: 'Aucune station avec des prix à moins de 120 km.',
    nearPrivacy: 'Votre position reste dans votre navigateur. Elle sert seulement à choisir les prix à charger.', cheapestHere: 'La moins chère de celles-ci',
    sortBy: 'Trier par', sortNear: 'La plus proche', sortCheap: 'La moins chère',
    notFoundH: 'Page introuvable', notFoundLead: 'Cette page n’existe pas ou a été déplacée. Cherchez une commune ou choisissez un pays ou un État.',
  },
  pt: {
    searchFailed: 'Não foi possível carregar a lista de locais. Verifique a ligação e tente novamente.',
    loadFailed: 'Não foi possível carregar os preços. Verifique a ligação e tente novamente.',
    mxPlaces: 'Nomes e limites dos municípios: INEGI, Marco Geoestadístico 2024, simplificados pelo Pumpwise.',
    home: 'Preços dos combustíveis', find: 'Procurar um local', language: 'Idioma', stations: 'postos', nStations: '{n} postos',
    skip: 'Saltar para o conteúdo',
    h1: 'Preços dos combustíveis em {p} hoje', lead: 'Hoje em {p}, o preço mais baixo de {f} é {price}, em {s}.',
    countSell: '{n} postos, {k} vendem {f}',
    saving: 'A média de {n} postos é {avg}: abastecer 50 litros ao preço mais baixo poupa cerca de {save}.',
    leftOut: 'Os postos só para sócios e os preços que parecem errados não contam para o preço mais baixo nem para a média.',
    cheapest: 'Mais barato', average: 'Média', avgIs: 'Média {v}', reported: 'Comunicado', perLitre: 'por litro',
    membersOnly: 'Só para sócios', permitNeeded: 'Requer autorização de entrada', checkPrice: 'Confirme o preço',
    nearby: 'Locais próximos', allIn: 'Todos os locais em {r}',
    updated: 'Atualizado', source: 'Fonte', licence: 'Licença',
    updatedAt: 'Atualizado a {d} às {t}, hora de {z}', updatedToday: 'Atualizado hoje às {t}, hora de {z}',
    updatedLocal: 'Atualizado a {d} às {t}, hora local', updatedLocalToday: 'Atualizado hoje às {t}, hora local', updatedUtc: 'Atualizado a {d} às {t} UTC',
    z_perth: 'Perth', z_sydney: 'Sydney', z_hobart: 'Hobart', z_madrid: 'Madrid', z_paris: 'Paris', z_lisbon: 'Lisboa', z_mexico: 'Cidade do México',
    rn_wa: 'Austrália Ocidental', rn_nsw: 'Nova Gales do Sul e ACT', rn_tas: 'Tasmânia', rn_es: 'Espanha', rn_fr: 'França', rn_mx: 'México', rn_pt: 'Portugal',
    disclaimer: 'Os preços são os comunicados pelos postos ao serviço oficial. O preço válido é o da bomba.',
    reuse: 'As tabelas de preços desta página podem ser reutilizadas com a mesma licença.',
    regionH1: 'Preços dos combustíveis hoje em {r}', regionLead: '{n} postos, {k} localidades. Escolha um local para ver os postos mais baratos.',
    cheapPlaces: 'Locais mais baratos hoje', from: 'desde', legend: 'Cada local mostra o número de postos e o preço mais baixo.',
    indexH1: 'Encontre o combustível mais barato hoje', indexLead: 'Preços oficiais de {n} postos em {k} países e estados, atualizados ao longo do dia.',
    app: 'O Pumpwise para iPhone mostra o posto mais barato perto de si e se vale a pena a viagem.', appLink: 'Obter o Pumpwise na App Store',
    appHome: 'O Pumpwise para iPhone já está na App Store da Austrália. Em breve chegará a mais países.', appHomeLink: 'Ver o Pumpwise na App Store',
    fixed: 'Na Austrália Ocidental cada posto fixa o preço durante 24 horas a partir das 6 da manhã.',
    tomorrowH: 'Amanhã em {p}',
    tomorrowUp: '{f}: média de {avg} amanhã, mais {d} do que hoje. O mais barato amanhã: {min} em {s}.',
    tomorrowDown: '{f}: média de {avg} amanhã, menos {d} do que hoje. O mais barato amanhã: {min} em {s}.',
    tomorrowSame: '{f}: média de {avg} amanhã, igual a hoje. O mais barato amanhã: {min} em {s}.',
    searchLabel: 'Procurar uma localidade, bairro ou código postal', searchPh: 'Escreva um local ou código postal', noMatch: 'Nenhum local com esse nome. Tente outra grafia.', go: 'Ir',
    nearPlace: '{a}, perto de {p}',
    bestNow: 'O mais barato agora', directions: 'Direções', directionsTo: 'Direções para {s}',
    cheapestFuel: 'Preço mais baixo de cada combustível', fuelPick: 'Combustível',
    showAll: 'Ver os {n} postos', capped: 'São mostrados os {k} mais baratos.', aToZ: 'Todos os locais de A a Z', jump: 'Ir para uma letra',
    licences: 'Licenças dos dados', privacy: 'Privacidade', popular: 'Locais populares', regions: 'Países e estados', perLitreAvg: 'média, por litro',
    placesCount: '{k} locais', trust1: 'Preços oficiais dos governos', trust2: 'Atualizados ao longo do dia', trust3: 'Grátis, sem registo',
    nearBtn: 'Ver postos perto de mim', nearH: 'Os postos mais próximos', finding: 'A procurar a sua localização', loading: 'A carregar preços perto de si',
    denied: 'A localização está desligada para esta página. Ative-a nas definições do navegador ou procure um local.',
    failed: 'Não foi possível encontrar a sua localização. Procure um local.', none: 'Não há postos com preços a menos de 120 km.',
    nearPrivacy: 'A sua localização fica no seu navegador. Só é usada para escolher que preços carregar.', cheapestHere: 'O mais barato destes',
    sortBy: 'Ordenar por', sortNear: 'Mais perto', sortCheap: 'Mais barato',
    notFoundH: 'Página não encontrada', notFoundLead: 'Esta página não existe ou mudou de endereço. Procure um local ou escolha um país ou estado.',
  },
};

/** Plain names of each fuel, added after a pump's own label when the visitor reads another language. */
export const FUEL_WORDS = {
  en: { regular: 'unleaded', e10: 'E10 unleaded', premium: 'premium unleaded', super: 'premium unleaded 98', diesel: 'diesel', 'premium-diesel': 'premium diesel', lpg: 'LPG', e85: 'E85', b20: 'B20 diesel', hvo: 'renewable diesel' },
  es: { regular: 'gasolina sin plomo', e10: 'gasolina E10', premium: 'gasolina premium', super: 'gasolina 98', diesel: 'diésel', 'premium-diesel': 'diésel premium', lpg: 'GLP', e85: 'E85', b20: 'diésel B20', hvo: 'diésel renovable' },
  fr: { regular: 'sans plomb', e10: 'sans plomb E10', premium: 'sans plomb premium', super: 'sans plomb 98', diesel: 'gazole', 'premium-diesel': 'gazole premium', lpg: 'GPL', e85: 'E85', b20: 'gazole B20', hvo: 'gazole renouvelable' },
  pt: { regular: 'gasolina sem chumbo', e10: 'gasolina E10', premium: 'gasolina premium', super: 'gasolina 98', diesel: 'gasóleo', 'premium-diesel': 'gasóleo premium', lpg: 'GPL', e85: 'E85', b20: 'gasóleo B20', hvo: 'gasóleo renovável' },
};

/** A text with its {values} filled in. A value written { k: key } is itself a text in that language. */
export function fill(str, v, lang = 'en') {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => {
    if (!v || v[k] == null) return m;
    const x = v[k];
    return typeof x === 'object' && x.k ? say(lang, x.k) : String(x);
  });
}

/** One text in one language (English when that language lacks it). */
export function say(lang, key, v) {
  return fill((U[lang] && U[lang][key]) ?? U.en[key] ?? key, v, lang);
}

/** Visible text that site.js can switch into the visitor's language. */
function w(lang, key, v, tag = 'span', attrs = '') {
  return `<${tag}${attrs} data-k="${key}"${v ? ` data-v="${esc(JSON.stringify(v))}"` : ''}>${esc(say(lang, key, v))}</${tag}>`;
}

/** A pump's own fuel label; site.js adds the plain fuel name in the visitor's language when it differs. */
function fuelLabel(f) {
  return `<span data-fuel="${f.kind}">${esc(f.label)}</span>`;
}

const CODES = { wa: 'WA', nsw: 'NSW', tas: 'TAS', es: 'ES', fr: 'FR', mx: 'MX', pt: 'PT' };
/** How many stations are listed under a fuel at most (the first TOP show, the rest open with "Show all"). */
const MAX_ROWS = 50;
/**
 * A price this far under the middle price of its fuel in its place is almost certainly a mistake (one
 * Puebla report of $15.94 when the city pays $18 to $25). The app has no such rule, so the pages use the
 * one Tyler's brief set: more than 20% under the median, with at least DOUBT_MIN prices to compare. Such a
 * price stays in the list with a "Check price" label but is never the cheapest, the "from" price or part
 * of the average and saving sentence.
 */
const DOUBT_RATIO = 0.8;
const DOUBT_MIN = 4;

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function slugify(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Lower case without accents, for comparing names. */
function fold(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** A price as people in that place write it. `p` is hundredths of the currency per litre (see feed.ts). */
export function money(p, kind) {
  if (kind === 'cents') return `${p.toFixed(1)}c`;
  if (kind === 'peso') return `$${(p / 100).toFixed(2)}`;
  return `${(p / 100).toFixed(3).replace('.', ',')} €`;
}

/** An amount of money saved (same units as `p` times litres), written the local way. */
function amount(pTimesLitres, kind) {
  const v = pTimesLitres / 100;
  if (kind === 'euro') return `${v.toFixed(2).replace('.', ',')} €`;
  return `$${v.toFixed(2)}`;
}

export function km(aLat, aLng, bLat, bLng) {
  const r = Math.PI / 180;
  const x = (bLng - aLng) * r * Math.cos(((aLat + bLat) / 2) * r);
  const y = (bLat - aLat) * r;
  return Math.sqrt(x * x + y * y) * 6371;
}

/**
 * Tidies a name or address as it arrives from a source: words in ALL CAPS get capitals only at the start
 * ("103 HINDMARSH DR" to "103 Hindmarsh Dr"), short brand words stay as they are (BP, GALP, PRIO), small
 * joining words go lower case ("DE", "DA"), and stray spaces before punctuation go ("Av .MOUZINHO" to
 * "Av. Mouzinho"). Written as a self contained maker so site.js can carry the same code for "Near me".
 */
export function makeTidy() {
  const KEEP = new Set(['BP', 'GALP', 'PRIO', 'EG', 'OMV', 'ENI', 'Q8', 'IES', 'BTP', 'MOL', 'AS24', 'LPG', 'GPL', 'GLP', 'GNC', 'GNV', 'HVO', 'BPM', 'ACT', 'NSW', 'WA', 'ATM', 'CEPSA', 'DIA', 'SPAR', 'OK', 'UK', 'USA']);
  const SMALL = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'da', 'do', 'das', 'dos', 'du', 'des', 'le', 'les', 'et', 'y', 'e', 'en', 'sur', 'aux', 'au', 'of', 'and', 'the']);
  const STREET = new Set(['DR', 'RD', 'ST', 'AV', 'CR', 'PL', 'LN', 'CT']);
  const ROMAN = /^(?=[IVXLC]+$)(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/;
  const title = (word) => word.toLowerCase().replace(/(^|[-'’(/])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  const plain = (x) => x.replace(/[^A-Za-z]/g, '');
  // In capitals: every letter, or (when a source writes accents in lower case, "NîMES") every plain letter.
  const caps = (letters) => letters !== letters.toLowerCase() && (letters === letters.toUpperCase() || (plain(letters).length >= 3 && plain(letters) === plain(letters).toUpperCase()));
  function tidyWord(word, i, loud, next) {
    if (/^(\p{L}\.){2,}$/u.test(word)) return word.toUpperCase();
    const letters = word.replace(/[^\p{L}]/gu, '');
    if (letters.length < 2 || /\d/.test(word)) return word;
    if (!caps(letters)) return word;
    // Road numbers: "N-II", "A-VI", and "EN" or "N" before a number ("EN 242").
    if (/^[A-Z]{1,3}-[IVXLC]+$/.test(word) || (letters.length <= 2 && /^\d/.test(next || ''))) return word;
    if (/\p{L}\.\p{L}/u.test(word)) return word;
    if (KEEP.has(letters) || ROMAN.test(letters)) return word;
    if (SMALL.has(letters.toLowerCase())) return i > 0 ? word.toLowerCase() : title(word);
    if (letters.length === 2 && !(loud && STREET.has(letters))) return word;
    if (letters.length === 3 && !loud) return word;
    return title(word);
  }
  return function tidyText(raw) {
    let s = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim();
    if (!s) return '';
    s = s.replace(/\s*\|\s*/g, ' / ').replace(/\s+([.,;:])(?=[^\s.,;:])/g, '$1 ').replace(/\s+([.,;:])/g, '$1');
    const words = s.split(' ');
    const lettered = words.map((x) => x.replace(/[^\p{L}]/gu, '')).filter((x) => x.length >= 2 && !KEEP.has(x));
    if (lettered.length === 1 && words.length === 1 && lettered[0].length <= 4) return s;
    const loud = lettered.length > 0 && lettered.filter(caps).length / lettered.length >= 0.6;
    return words.map((x, i) => tidyWord(x, i, loud, words[i + 1])).join(' ');
  };
}
export const tidyText = makeTidy();

/** Date formatters are slow to make, so each region's are made once. */
const formatters = new Map();
function formats(cfg) {
  let f = formatters.get(cfg.slug);
  if (!f) {
    f = {
      day: new Intl.DateTimeFormat('en-CA', { timeZone: cfg.tz, year: 'numeric', month: '2-digit', day: '2-digit' }),
      time: new Intl.DateTimeFormat(cfg.locale, { timeZone: cfg.tz, hour: 'numeric', minute: '2-digit' }),
      date: new Intl.DateTimeFormat(cfg.locale, { timeZone: cfg.tz, day: 'numeric', month: 'short' }),
    };
    formatters.set(cfg.slug, f);
  }
  return f;
}

/** When a price was reported, in the region's own time: the time if today, otherwise the date. */
function when(iso, cfg, now) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const f = formats(cfg);
  return f.day.format(d) === f.day.format(now) ? f.time.format(d) : f.date.format(d);
}

/** Locales site.js and the pages use to write dates in each language. */
const LOCALES = { en: 'en-AU', es: 'es-ES', fr: 'fr-FR', pt: 'pt-PT' };

/**
 * "Updated 13 November at 2:51 am, Perth time" in the page's language. site.js rewrites it in the
 * visitor's language and says "today" when it is today where the place is.
 */
export function updatedText(lang, now, tz, zone) {
  const loc = LOCALES[lang] ?? lang;
  const d = new Intl.DateTimeFormat(loc, { timeZone: tz, day: 'numeric', month: 'long' }).format(now);
  const t = new Intl.DateTimeFormat(loc, { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(now);
  return zone === 'local' ? say(lang, 'updatedUtc', { d, t }) : say(lang, 'updatedAt', { d, t, z: { k: `z_${zone}` } });
}

function updatedTag(lang, now, cfg) {
  const zone = cfg ? cfg.zone : 'local';
  const tz = cfg ? cfg.tz : 'UTC';
  return `<time class="upd" datetime="${esc(now.toISOString())}" data-tz="${esc(tz)}" data-z="${zone}">${esc(updatedText(lang, now, tz, zone))}</time>`;
}

export function stationName(s) {
  const name = tidyText(s.name) || tidyText(s.brand) || tidyText(s.address) || 'Station';
  const brand = tidyText(s.brand);
  // The brand is added only when the name does not already say it ("24Xpress Lansvale" needs no "24Xpress logo").
  const first = (brand.split(/\s+/)[0] ?? '').toLowerCase();
  return brand && first && !name.toLowerCase().includes(first) ? `${name} (${brand})` : name;
}

/**
 * One line of address, without the doubled commas and spaces some sources send ("Calle X,, 28000"), and
 * never the same words as the name above it (French stations often have only a street, used as the name).
 */
export function stationAddress(s) {
  const a = tidyText(s.address);
  const name = fold(tidyText(s.name));
  const parts = [];
  if (a && fold(a) !== name) parts.push(a);
  const town = tidyText(s.town);
  const tail = [s.postcode, town && fold(town) !== name ? town : ''].filter((x) => x && String(x).trim()).join(' ');
  if (tail) parts.push(tail);
  if (s.state && fold(s.state) !== fold(town)) parts.push(s.state);
  return parts.join(', ').replace(/\s+/g, ' ').replace(/\s*,(\s*,)+/g, ',').replace(/\s+,/g, ',').replace(/^[\s,]+|[\s,]+$/g, '');
}

/**
 * Stations not everyone can buy from: members only (Costco) or behind an entry permit. Like the app,
 * the pages list them with a label but never name one as "the cheapest", and leave them out of averages.
 */
export function restriction(s) {
  const tags = Array.isArray(s.tags) ? s.tags : [];
  return tags.includes('members-only') ? 'membersOnly' : tags.includes('permit-required') ? 'permitNeeded' : null;
}

/** Fresh prices of one fuel in a list of stations, cheapest first. */
function ranked(stations, kind, cutoff) {
  const rows = [];
  for (const s of stations) {
    const pr = s.prices && s.prices[kind];
    if (!pr || !(pr.p > 0)) continue;
    const t = Date.parse(pr.at);
    if (Number.isFinite(t) && t < cutoff) continue;
    rows.push({ s, p: pr.p, at: pr.at });
  }
  rows.sort((a, b) => a.p - b.p || stationName(a.s).localeCompare(stationName(b.s)));
  return rows;
}

const mean = (rows) => rows.reduce((t, r) => t + r.p, 0) / rows.length;

export function median(values) {
  const v = values.slice().sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/**
 * The outlier rule (see DOUBT_RATIO): marks rows whose price is more than 20% under the median of the
 * prices open to everyone, and returns the rows that may be called the cheapest, cheapest first.
 */
export function markDoubts(rows) {
  const open = rows.filter((r) => !restriction(r.s));
  if (open.length >= DOUBT_MIN) {
    const limit = median(open.map((r) => r.p)) * DOUBT_RATIO;
    for (const r of open) if (r.p < limit) r.doubt = true;
  }
  return open.filter((r) => !r.doubt);
}

/** Towns and cities of one region, each with its stations. Cities (a radius round a centre) come first. */
export function placesFor(id, stations) {
  const cfg = REGIONS[id];
  const places = [];
  const used = new Set();
  for (const [name, lat, lng, radius] of cfg.cities) {
    const inside = stations.filter((s) => km(lat, lng, s.lat, s.lng) <= radius);
    if (inside.length < MIN_STATIONS) continue;
    const slug = slugify(name);
    used.add(slug);
    places.push({ name, slug, lat, lng, stations: inside, city: true });
  }
  const groups = new Map();
  for (const s of stations) {
    const town = tidyText(s.town);
    if (!town) continue;
    // Two towns of one name are told apart by their postcode area, or in Mexico by their state.
    const prefix = cfg.pc ? String(s.postcode || '').slice(0, cfg.pc) : String(s.state || '');
    const key = `${fold(town)}|${prefix}`;
    let g = groups.get(key);
    if (!g) groups.set(key, (g = { name: town, prefix, stations: [] }));
    g.stations.push(s);
  }
  const bySlug = new Map();
  for (const g of groups.values()) {
    if (g.stations.length < MIN_STATIONS) continue;
    const slug = slugify(g.name);
    if (!slug) continue;
    const list = bySlug.get(slug) ?? [];
    list.push(g);
    bySlug.set(slug, list);
  }
  for (const [slug, list] of bySlug) {
    list.sort((a, b) => b.stations.length - a.stations.length);
    list.forEach((g, i) => {
      // Two towns with one name: the larger keeps the plain address, the others carry their postcode area.
      const final = i === 0 ? slug : `${slug}-${slugify(g.prefix) || i}`;
      if (used.has(final)) {
        const city = places.find((p) => p.city && p.slug === final);
        if (city) {
          const have = new Set(city.stations);
          for (const st of g.stations) if (!have.has(st)) city.stations.push(st);
        }
        return;
      }
      used.add(final);
      const lat = g.stations.reduce((t, s) => t + s.lat, 0) / g.stations.length;
      const lng = g.stations.reduce((t, s) => t + s.lng, 0) / g.stations.length;
      places.push({ name: i === 0 || !g.prefix ? g.name : `${g.name} (${g.prefix})`, slug: final, lat, lng, stations: g.stations, city: false });
    });
  }
  places.sort((a, b) => a.name.localeCompare(b.name, cfg.locale));
  return places;
}

/**
 * Every town, suburb and postcode of a region that has no page of its own, each pointing at the nearest
 * place page ("Midland, near Midvale"), so the search box never comes up empty for a real place.
 * Postcodes are kept to their first four or five digits (Portugal's 3230-292 is found as 3230).
 * @returns towns and codes: [name, index of the nearest page in `places`] pairs
 */
export function aliasesFor(id, stations, places) {
  const named = new Set(places.map((p) => fold(p.name)));
  const towns = new Map();
  const codes = new Map();
  const add = (map, key, name, s) => {
    let g = map.get(key);
    if (!g) map.set(key, (g = { name, lat: 0, lng: 0, n: 0 }));
    g.lat += s.lat;
    g.lng += s.lng;
    g.n += 1;
    return g;
  };
  for (const s of stations) {
    const town = tidyText(s.town);
    if (town && !named.has(fold(town))) add(towns, `${fold(town)}|${s.state || ''}`, town, s);
    const pc = /^[0-9]{4,5}/.exec(String(s.postcode || '').trim());
    if (pc) add(codes, pc[0], pc[0], s);
  }
  const nearest = (lat, lng) => {
    let best = -1;
    let bestD = Infinity;
    places.forEach((p, i) => {
      const d = km(lat, lng, p.lat, p.lng);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };
  const pairs = (map) => [...map.values()].map((g) => [g.name, nearest(g.lat / g.n, g.lng / g.n)]);
  return { towns: pairs(towns), codes: pairs(codes) };
}

// ---------------------------------------------------------------------------------------------------
// Look and navigation: a slim dark header on every page with the Pumpwise mark, a search box, fuel chips
// that the whole site follows, station rows with a directions button, "Show all" lists and a footer in
// the page's language. The price chips keep the look of a roadside price sign (dark, green digits).
// ---------------------------------------------------------------------------------------------------

const MARK = '<svg class="mark" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#101820"/><path d="M16 4.5c-5.2 0-9.3 4-9.3 9.1 0 6.7 7.9 13.3 8.4 13.7.5.4 1.3.4 1.8 0 .5-.4 8.4-7 8.4-13.7 0-5.1-4.1-9.1-9.3-9.1z" fill="#FFB000"/><path d="M16 8.4c-.2 0-.4.1-.5.3-1.2 1.6-3.6 5-3.6 6.9a4.1 4.1 0 0 0 8.2 0c0-1.9-2.4-5.3-3.6-6.9-.1-.2-.3-.3-.5-.3z" fill="#101820"/><path d="M14.3 15.3l1.3 1.3 2.2-2.4" fill="none" stroke="#FFB000" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_SEARCH = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const ICON_PIN = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 2.5c-3.9 0-7 3-7 6.9 0 5 6 10.1 6.3 10.4.4.3.9.3 1.3 0 .3-.3 6.4-5.4 6.4-10.4 0-3.9-3.1-6.9-7-6.9z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9.5" r="2.4" fill="currentColor"/></svg>';
const ICON_ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function mapsUrl(s) {
  return `https://www.google.com/maps/search/?api=1&amp;query=${s.lat},${s.lng}`;
}

/**
 * The search box: hidden until site.js runs, so pages without scripts show only the lists. On place pages
 * it is a panel (`pop`) that the header's search button opens.
 */
function searchBox(L, region, pop = false) {
  return `<form class="find${pop ? ' pop' : ''}" id="find" role="search" hidden${pop ? ' data-pop' : ''}${region ? ` data-region="${esc(region)}"` : ''}>
${w(L, 'searchLabel', null, 'label', ' for="q"')}
<div class="field">${ICON_SEARCH}<input id="q" type="search" autocomplete="off" spellcheck="false" placeholder="${esc(say(L, 'searchPh'))}" data-kp="searchPh">${w(L, 'go', null, 'button', ' type="submit"')}</div>
<ol class="hits" aria-live="polite"></ol>
${w(L, 'noMatch', null, 'p', ' class="none" hidden')}
</form>`;
}

/**
 * The "Near me" box: hidden until site.js runs. With the visitor's permission the browser gives site.js a
 * position; it never leaves the browser. site.js then loads the feed's 0.5 degree tiles around it (the same
 * public files the app uses) and lists the closest stations of the chosen fuel.
 */
function nearBox(L, dataBase) {
  return `<div class="near" id="near" hidden data-base="${esc(dataBase)}">
<button type="button" class="btn nearbtn">${ICON_PIN}${w(L, 'nearBtn')}</button>
<p class="nearstatus" aria-live="polite"></p>
<section class="nearres" hidden>
<h2>${w(L, 'nearH')} <span class="unit nearfuel"></span></h2>
<div class="fuels nearfuels" role="group" aria-label="${esc(say(L, 'fuelPick'))}" data-kl="fuelPick"></div>
<div class="seg" role="group" aria-label="${esc(say(L, 'sortBy'))}" data-kl="sortBy"><button type="button" data-sort="d" aria-pressed="true">${w(L, 'sortNear')}</button><button type="button" data-sort="p" aria-pressed="false">${w(L, 'sortCheap')}</button></div>
<ol class="list"></ol>
${w(L, 'nearPrivacy', null, 'p', ' class="note"')}
</section>
</div>`;
}

/**
 * Our own small script (site.js), written here as a plain function and sent to the browser as its source.
 * It switches the language, keeps the visitor's fuel choice, runs the search boxes and the "Near me" box.
 * Every page works without it. It may only use what it is given in D.
 */
function siteMain(D) {
  const U = D.U;
  const G = D.G;
  const R = D.R;
  const tidy = D.tidy;
  const root = document.documentElement;
  const P = (root.getAttribute('lang') || 'en').slice(0, 2);
  let L = P;
  const LOC = { en: 'en-AU', es: 'es-ES', fr: 'fr-FR', pt: 'pt-PT' };
  const fold = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const all = (q, el) => Array.prototype.slice.call((el || document).querySelectorAll(q));
  function word(k, v) {
    let s = U[L] && U[L][k];
    if (s == null) s = U.en[k];
    if (s == null) return '';
    return String(s).replace(/\{(\w+)\}/g, (m, x) => {
      if (!v || v[x] == null) return m;
      const t = v[x];
      return typeof t === 'object' && t.k ? word(t.k) : String(t);
    });
  }
  const vals = (el) => {
    try {
      return JSON.parse(el.getAttribute('data-v') || 'null');
    } catch (x) {
      return null;
    }
  };
  const store = {
    get(k) {
      try {
        return localStorage.getItem(k);
      } catch (x) {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (x) {
        /* private mode: the choice lasts for this page only */
      }
    },
  };
  function fuelText(label, kind, lang) {
    const g = lang !== L && G[L] && G[L][kind];
    return g && fold(label).indexOf(fold(g)) < 0 ? `${label} (${g})` : label;
  }
  function updated(el) {
    const d = new Date(el.getAttribute('datetime'));
    const z = el.getAttribute('data-z');
    const tz = z === 'local' ? undefined : el.getAttribute('data-tz');
    const loc = LOC[L] || L;
    try {
      const day = (x) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(x);
      const today = day(d) === day(new Date());
      const t = new Intl.DateTimeFormat(loc, { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(d);
      const ds = new Intl.DateTimeFormat(loc, { timeZone: tz, day: 'numeric', month: 'long' }).format(d);
      const key = z === 'local' ? (today ? 'updatedLocalToday' : 'updatedLocal') : today ? 'updatedToday' : 'updatedAt';
      el.textContent = word(key, { d: ds, t, z: { k: `z_${z}` } });
    } catch (x) {
      /* an old browser keeps the sentence the page was built with */
    }
  }
  function nameOf(el) {
    const li = el.closest('li');
    const nm = li && li.querySelector('strong');
    return nm ? nm.textContent : '';
  }
  const onLanguage = [];
  function apply(l) {
    L = l;
    all('[data-k]').forEach((el) => {
      el.textContent = word(el.getAttribute('data-k'), vals(el));
    });
    all('[data-kp]').forEach((el) => el.setAttribute('placeholder', word(el.getAttribute('data-kp'))));
    all('[data-kl]').forEach((el) => el.setAttribute('aria-label', word(el.getAttribute('data-kl'), Object.assign({ s: nameOf(el) }, vals(el)))));
    all('[data-fuel]').forEach((el) => {
      if (el.getAttribute('data-o') == null) el.setAttribute('data-o', el.textContent);
      el.textContent = fuelText(el.getAttribute('data-o'), el.getAttribute('data-fuel'), el.getAttribute('data-lang') || P);
    });
    all('time[data-z]').forEach(updated);
    root.setAttribute('lang', l);
    all('select.lang').forEach((s) => {
      s.value = l;
    });
    onLanguage.forEach((fn) => fn());
  }
  // Language: a choice made in the header wins, then the browser's languages, then English. Search engines
  // keep the page's own language so each page is found in the language people search in.
  function pick() {
    const s = store.get('pw-lang');
    if (s && U[s]) return s;
    if (/bot|crawl|spider|slurp|lighthouse/i.test(navigator.userAgent || '')) return P;
    const ls = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (let i = 0; i < ls.length; i++) {
      const b = String(ls[i]).slice(0, 2).toLowerCase();
      if (U[b]) return b;
    }
    return 'en';
  }
  const start = pick();
  all('select.lang').forEach((s) => {
    s.hidden = false;
    s.addEventListener('change', () => {
      store.set('pw-lang', s.value);
      apply(s.value);
    });
  });
  all('.langwrap').forEach((x) => {
    x.hidden = false;
  });
  apply(start);

  // One fuel for the whole site: the chips on place pages and in "Near me" remember the choice.
  const lists = document.querySelector('.lists');
  const chips = all('.fuels [data-pick]');
  function choose(kind) {
    const sec = lists && document.getElementById(`f-${kind}`);
    if (!sec) return false;
    lists.insertBefore(sec, lists.firstChild);
    chips.forEach((c) => {
      if (c.getAttribute('data-pick') === kind) c.setAttribute('aria-current', 'true');
      else c.removeAttribute('aria-current');
    });
    const cnt = document.getElementById('cnt');
    if (cnt && sec.getAttribute('data-v')) {
      cnt.setAttribute('data-v', sec.getAttribute('data-v'));
      cnt.textContent = word('countSell', vals(cnt));
    }
    return true;
  }
  chips.forEach((c) =>
    c.addEventListener('click', (ev) => {
      const k = c.getAttribute('data-pick');
      if (choose(k)) {
        ev.preventDefault();
        store.set('pw-fuel', k);
      }
    }),
  );
  const fav = store.get('pw-fuel');
  if (fav) choose(fav);

  // The place index: every page, and every town, suburb and postcode pointing at its nearest page.
  let wait = null;
  function index() {
    if (!wait) {
      wait = fetch(`${D.base}/places.json`)
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        })
        .then((d) => {
          const slug = (s) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          const pages = d.p.map((x) => ({ n: x[0], r: d.r[x[1]][0], url: `${D.base}/${d.r[x[1]][1]}/${x[2] || slug(x[0])}/`, c: x[3], lat: x[4], lng: x[5], k: fold(x[0]) }));
          const alias = [];
          d.t.forEach((x) => x[1].split('|').forEach((nm) => alias.push({ n: nm, p: pages[x[0]], k: fold(nm) })));
          d.c.forEach((x) => x[1].split(' ').forEach((nm) => alias.push({ n: nm, p: pages[x[0]], k: nm, pc: true })));
          return { pages, alias };
        })
        .catch((err) => {
          wait = null;
          throw err;
        });
    }
    return wait;
  }
  function search(ix, q, region) {
    const out = [];
    const seen = {};
    const push = (label, page) => {
      const key = `${page.url}|${label}`;
      if (seen[key] || out.length >= 8) return;
      seen[key] = 1;
      out.push({ label, page });
    };
    const pages = ix.pages.filter((x) => !region || x.r === region);
    const alias = ix.alias.filter((x) => !region || x.p.r === region);
    pages.filter((x) => x.k === q).forEach((x) => push(x.n, x));
    pages.filter((x) => x.k !== q && x.k.indexOf(q) === 0).sort((a, b) => b.c - a.c).forEach((x) => push(x.n, x));
    const nearLabel = (x) => (x.p.k === x.k ? x.n : word('nearPlace', { a: x.n, p: x.p.n }));
    alias.filter((x) => x.k === q).forEach((x) => push(nearLabel(x), x.p));
    // A postcode with no station of its own (2000, central Sydney) goes to the page of the closest postcode.
    // Done per region, as Australia and Portugal both use four digits (2000 is Sydney and Santarém).
    if (/^[0-9]{4,5}$/.test(q)) {
      const best = {};
      alias.forEach((x) => {
        if (!x.pc || x.k.length !== q.length || x.k.slice(0, 2) !== q.slice(0, 2)) return;
        const b = best[x.p.r];
        if (!b || Math.abs(x.k - q) < Math.abs(b.k - q)) best[x.p.r] = x;
      });
      Object.keys(best).forEach((r) => {
        if (best[r].k !== q) push(word('nearPlace', { a: q, p: best[r].p.n }), best[r].p);
      });
    }
    alias.filter((x) => x.k !== q && x.k.indexOf(q) === 0).sort((a, b) => b.p.c - a.p.c).forEach((x) => push(nearLabel(x), x.p));
    if (q.length > 2) pages.filter((x) => x.k.indexOf(q) > 0).sort((a, b) => b.c - a.c).forEach((x) => push(x.n, x));
    return out;
  }
  all('form.find').forEach((f) => {
    if (!window.fetch) return;
    if (!f.hasAttribute('data-pop')) f.hidden = false;
    const i = f.querySelector('input');
    const o = f.querySelector('.hits');
    const m = f.querySelector('.none');
    const want = f.getAttribute('data-region') || '';
    function show() {
      const typed = fold(i.value);
      // A full Portuguese postcode (3230-292) is found by its first four digits.
      const pc = /^([0-9]{4})[- ]?[0-9]{3}$/.exec(typed);
      const q = pc ? pc[1] : typed;
      if (!q) {
        o.innerHTML = '';
        m.hidden = true;
        return Promise.resolve();
      }
      return index().then(
        (ix) => {
          if (fold(i.value) !== typed) return;
          const r = search(ix, q, pc ? 'pt' : want);
          o.innerHTML = r.map((x) => `<li><a href="${e(x.page.url)}"><span>${e(x.label)}</span><small>${e(word(`rn_${x.page.r}`))}</small></a></li>`).join('');
          m.setAttribute('data-k', 'noMatch');
          m.textContent = word('noMatch');
          m.hidden = r.length > 0;
        },
        () => {
          o.innerHTML = '';
          m.setAttribute('data-k', 'searchFailed');
          m.textContent = word('searchFailed');
          m.hidden = false;
        },
      );
    }
    i.addEventListener('input', show);
    i.addEventListener('focus', () => index().catch(() => null));
    f.addEventListener('submit', (ev) => {
      ev.preventDefault();
      show().then(() => {
        const a = o.querySelector('a');
        if (a) location.href = a.href;
      });
    });
  });
  // The header's search button works where you are: it opens or focuses this page's search box.
  all('a.findlink').forEach((a) =>
    a.addEventListener('click', (ev) => {
      const f = document.querySelector('form.find');
      if (!f || !window.fetch) return;
      ev.preventDefault();
      f.hidden = false;
      f.scrollIntoView({ block: 'center' });
      f.querySelector('input').focus({ preventScroll: true });
    }),
  );

  const n = document.getElementById('near');
  if (!n || !window.fetch || !navigator.geolocation) return;
  n.hidden = false;
  const RADII = [8, 20, 50, 120];
  const base = n.getAttribute('data-base');
  const btn = n.querySelector('.nearbtn');
  const st = n.querySelector('.nearstatus');
  const res = n.querySelector('.nearres');
  const list = res.querySelector('ol');
  const fuelsEl = res.querySelector('.nearfuels');
  const unit = res.querySelector('.nearfuel');
  const cache = {};
  let meta = null;
  let found = null;
  let sort = 'd';
  let picked = null;
  let lastIx = null;
  const status = (k) => {
    st.textContent = k ? word(k) : '';
  };
  const money = (p, k) => (k === 'cents' ? `${p.toFixed(1)}c` : k === 'peso' ? `$${(p / 100).toFixed(2)}` : `${(p / 100).toFixed(3).replace('.', ',')} \u20ac`);
  function dist(a, b, c, d) {
    const r = Math.PI / 180;
    const x = (d - b) * r * Math.cos(((a + c) / 2) * r);
    const y = (c - a) * r;
    return Math.sqrt(x * x + y * y) * 6371;
  }
  function keys(lat, lng, r) {
    const D2 = meta.tileDeg || 0.5;
    const dl = r / 111;
    const dg = r / Math.max(1, 111.32 * Math.cos((lat * Math.PI) / 180));
    const k = [];
    for (let y = Math.floor((lat - dl) / D2); y <= Math.floor((lat + dl) / D2); y++) for (let x = Math.floor((lng - dg) / D2); x <= Math.floor((lng + dg) / D2); x++) k.push(`${y}_${x}`);
    return k;
  }
  function tile(k) {
    if (!cache[k])
      cache[k] = fetch(`${base}tiles/${k}.json?v=${encodeURIComponent(meta.generatedAt)}`)
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        })
        .catch(() => {
          delete cache[k];
          return { failed: true };
        });
    return cache[k];
  }
  // Every station with a fresh price within the radius; the radius grows until there are at least five.
  function find(lat, lng, step) {
    const r = RADII[step];
    const ks = keys(lat, lng, r).filter((k) => meta.tiles && meta.tiles[k]);
    return Promise.all(ks.map(tile)).then((ts) => {
      const seen = {};
      const rows = [];
      const cut = Date.parse(meta.generatedAt) - 864e6;
      ts.forEach((tl) =>
        (tl.stations || []).forEach((s) => {
          if (seen[s.id]) return;
          seen[s.id] = 1;
          const g = R[s.region];
          const lic = meta.licences && meta.licences[s.region];
          if (!g || !lic || lic.reuse === 'no-republish') return;
          const d = dist(lat, lng, s.lat, s.lng);
          if (d > r) return;
          const pr = {};
          let any = false;
          g.f.forEach((k) => {
            const x = s.prices && s.prices[k];
            if (x && x.p > 0 && !(Date.parse(x.at) < cut)) {
              pr[k] = x;
              any = true;
            }
          });
          if (any) rows.push({ s, d, g, pr });
        }),
      );
      if (!rows.length && ts.some((tl) => tl.failed)) throw new Error('tiles');
      if (rows.length < 5 && step < RADII.length - 1) return find(lat, lng, step + 1);
      return rows.sort((a, b) => a.d - b.d);
    });
  }
  const limit = (s) => {
    const tg = s.tags || [];
    return tg.indexOf('members-only') >= 0 ? 'membersOnly' : tg.indexOf('permit-required') >= 0 ? 'permitNeeded' : '';
  };
  function reported(at, g) {
    if (g.fx) return '';
    const d = new Date(at);
    if (Number.isNaN(d.getTime())) return '';
    const loc = LOC[L] || L;
    try {
      const day = (x) => new Intl.DateTimeFormat('en-CA', { timeZone: g.tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(x);
      const t = day(d) === day(new Date())
        ? new Intl.DateTimeFormat(loc, { timeZone: g.tz, hour: 'numeric', minute: '2-digit' }).format(d)
        : new Intl.DateTimeFormat(loc, { timeZone: g.tz, day: 'numeric', month: 'short' }).format(d);
      return `${word('reported')} ${t}`;
    } catch (x) {
      return '';
    }
  }
  // The place page a station is listed on: its town's page, or the page its town points to.
  function pageOf(ix, s) {
    const town = fold(tidy(s.town || ''));
    let best = null;
    let bestD = Infinity;
    const consider = (p) => {
      const d = dist(s.lat, s.lng, p.lat, p.lng);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    };
    if (!ix) return null;
    if (town) {
      ix.pages.forEach((p) => p.r === s.region && (p.k === town || p.k.indexOf(`${town} (`) === 0) && consider(p));
      if (!best) ix.alias.forEach((x) => x.p.r === s.region && x.k === town && consider(x.p));
    }
    if (best) return best;
    ix.pages.forEach((p) => p.r === s.region && consider(p));
    return best && bestD < 40 ? best : null;
  }
  function draw(ix) {
    const first = found[0];
    const kinds = [];
    const labels = {};
    found.forEach((x) =>
      x.g.f.forEach((k) => {
        if (x.pr[k] && kinds.indexOf(k) < 0 && (x.g === first.g || first.g.f.indexOf(k) < 0)) kinds.push(k);
        if (x.pr[k] && !labels[k]) labels[k] = { l: x.g.l[k] || k, g: x.g.g };
      }),
    );
    kinds.sort((a, b) => (first.g.f.indexOf(a) + 99 * (first.g.f.indexOf(a) < 0)) - (first.g.f.indexOf(b) + 99 * (first.g.f.indexOf(b) < 0)));
    lastIx = ix;
    const saved = picked || store.get('pw-fuel');
    const kind = kinds.indexOf(saved) >= 0 ? saved : kinds[0];
    fuelsEl.innerHTML = kinds
      .map((k) => `<button type="button" class="fchip" data-k2="${e(k)}" aria-pressed="${k === kind}"><span data-fuel="${e(k)}" data-o="${e(labels[k].l)}" data-lang="${e(labels[k].g)}">${e(fuelText(labels[k].l, k, labels[k].g))}</span></button>`)
      .join('');
    unit.innerHTML = `<span data-fuel="${e(kind)}" data-o="${e(labels[kind].l)}" data-lang="${e(labels[kind].g)}">${e(fuelText(labels[kind].l, kind, labels[kind].g))}</span>`;
    const rows = found.filter((x) => x.pr[kind]).map((x) => ({ x, p: x.pr[kind].p, at: x.pr[kind].at, doubt: false }));
    const open = rows.filter((r) => !limit(r.x.s));
    if (open.length >= 4) {
      const v = open.map((r) => r.p).sort((a, b) => a - b);
      const m = v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
      open.forEach((r) => {
        if (r.p < m * 0.8) r.doubt = true;
      });
    }
    const shown = rows.slice().sort(sort === 'p' ? (a, b) => a.p - b.p || a.x.d - b.x.d : (a, b) => a.x.d - b.x.d).slice(0, 10);
    let best = null;
    shown.forEach((r) => {
      if (!limit(r.x.s) && !r.doubt && (!best || r.p < best.p)) best = r;
    });
    list.innerHTML = shown
      .map((r, i) => {
        const s = r.x.s;
        const name = tidy(s.name || s.brand || s.address || '');
        const lim = limit(s);
        const cheap = r === best && shown.length > 1;
        const km = `${r.x.d < 10 ? r.x.d.toLocaleString(L, { maximumFractionDigits: 1 }) : Math.round(r.x.d).toLocaleString(L)} km`;
        const addr = [tidy(s.address || ''), tidy(s.town || ''), s.state || ''].filter((v, j, a) => v && fold(v) !== fold(name) && a.indexOf(v) === j).join(', ');
        const page = pageOf(ix, s);
        const when = reported(r.at, r.x.g);
        const who = `<strong>${e(name)}</strong>${lim ? `<span class="tag" data-k="${lim}">${e(word(lim))}</span>` : ''}${r.doubt ? `<span class="tag warn" data-k="checkPrice">${e(word('checkPrice'))}</span>` : ''}`
          + `<span class="addr">${e(km)}${addr ? ` \u00b7 ${e(addr)}` : ''}</span>${when ? `<span class="when">${e(when)}</span>` : ''}${cheap ? `<span class="when cheap" data-k="cheapestHere">${e(word('cheapestHere'))}</span>` : ''}`;
        return `<li class="st${cheap ? ' first' : ''}"><span class="rk" aria-hidden="true">${i + 1}</span>${page ? `<a class="who" href="${e(page.url)}">${who}</a>` : `<div class="who">${who}</div>`}`
          + `<span class="pp">${e(money(r.p, r.x.g.m))}</span>`
          + `<a class="dir" href="https://www.google.com/maps/search/?api=1&amp;query=${s.lat},${s.lng}" rel="nofollow noopener" data-kl="directionsTo" aria-label="${e(word('directionsTo', { s: name }))}"><span class="i-pin"></span><span class="dw" data-k="directions">${e(word('directions'))}</span></a></li>`;
      })
      .join('');
    all('button', fuelsEl).forEach((b) =>
      b.addEventListener('click', () => {
        picked = b.getAttribute('data-k2');
        store.set('pw-fuel', picked);
        draw(ix);
      }),
    );
    res.hidden = false;
  }
  onLanguage.push(() => {
    if (found && !res.hidden) draw(lastIx);
  });
  all('.seg button', res).forEach((b) =>
    b.addEventListener('click', () => {
      sort = b.getAttribute('data-sort');
      all('.seg button', res).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (found) draw(lastIx);
    }),
  );
  btn.addEventListener('click', () => {
    btn.disabled = true;
    status('finding');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        status('loading');
        (meta ? Promise.resolve(meta) : fetch(`${base}meta.json?t=${Math.floor(Date.now() / 6e4)}`).then((r) => r.json()).then((x) => (meta = x)))
          .then(() => find(lat, lng, 0))
          .then((rows) => {
            if (!rows.length) {
              status('none');
              res.hidden = true;
              return null;
            }
            found = rows;
            // Without the place list the stations still show, only without links to their pages.
            return index()
              .catch(() => null)
              .then((ix) => {
                status('');
                draw(ix);
              });
          })
          .catch(() => status('loadFailed'))
          .then(() => {
            btn.disabled = false;
          });
      },
      (err) => {
        status(err && err.code === 1 ? 'denied' : 'failed');
        btn.disabled = false;
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  });
}

/** site.js as sent to the browser: siteMain's source, run with the texts and region facts it needs. */
export function siteJs() {
  const R = {};
  for (const [id, cfg] of Object.entries(REGIONS)) R[id] = { m: cfg.money, f: cfg.fuels, l: cfg.labels, g: cfg.lang, tz: cfg.tz, fx: !!(cfg.fixedDaily || cfg.current) };
  const data = JSON.stringify({ U, G: FUEL_WORDS, R, base: BASE }).replace(/</g, '\\u003c');
  return `/* Pumpwise price pages: language, fuel choice, search and "Near me". The pages work without it. */\n(function(){var D=${data};D.tidy=(${makeTidy.toString()})();(${siteMain.toString()})(D);})();\n`;
}

/** The language picker in the header: hidden until site.js runs. */
function langPicker(L) {
  return `<label class="langwrap" hidden><span class="sr" data-k="language">${esc(say(L, 'language'))}</span><select class="lang" hidden>${Object.entries(LANGS).map(([k, v]) => `<option value="${k}"${k === L ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label>`;
}

function layout({ lang, title, desc, canonical, crumbs, body, modified, noindex = false, data = [], ads = true }) {
  const L = lang;
  // Structured data for search and answer engines: the breadcrumb trail on every page, plus what the page
  // itself lists (stations, places, the site), always mirroring what a visitor can see on the page.
  const trailLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
  };
  const ld = data.length ? [trailLd, ...data.map((d) => ({ '@context': 'https://schema.org', ...d }))] : trailLd;
  const label = (c) => (c.k ? w(L, c.k) : esc(c.name));
  const trail = crumbs.length > 1
    ? `<nav class="crumbs" aria-label="Breadcrumb">${crumbs.map((c, i) => (i === crumbs.length - 1 ? `<span aria-current="page">${label(c)}</span>` : `<a href="${esc(c.url)}">${label(c)}</a>`)).join('<span class="sep" aria-hidden="true">›</span>')}</nav>`
    : '';
  const og = `${BASE}/og.png`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(canonical)}">`}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${noindex ? '' : `<meta property="og:url" content="${esc(canonical)}">\n`}<meta property="og:type" content="website">
<meta property="og:site_name" content="Pumpwise">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Pumpwise: official fuel prices, cheapest station near you">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${og}">
<meta property="article:modified_time" content="${esc(modified)}">
<meta name="theme-color" content="#101820" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#101820" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/png" href="${BASE}/favicon.png">
<link rel="stylesheet" href="${BASE}/style.css">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<script src="${BASE}/site.js" defer></script>
${ADSENSE_CLIENT && ads ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>\n` : ''}</head>
<body>
${w(L, 'skip', null, 'a', ' class="skip" href="#main"')}
<header class="top"><div class="bar">
<a class="brand" href="${SITE_BASE}/">${MARK}<span>Pumpwise</span></a>
<nav class="menu">${langPicker(L)}<a class="home" href="${BASE}/">${w(L, 'home')}</a><a class="findlink" href="${BASE}/#find" aria-label="${esc(say(L, 'find'))}" data-kl="find">${ICON_SEARCH}${w(L, 'find')}</a></nav>
</div></header>
<main id="main" tabindex="-1">
${trail}
${body}
</main>
<footer class="site"><div class="bar">
<a class="brand" href="${SITE_BASE}/">${MARK}<span>Pumpwise</span></a>
<nav><a href="${BASE}/">${w(L, 'home')}</a><a href="${SITE_BASE}/data-licences.html">${w(L, 'licences')}</a><a href="${SITE_BASE}/privacy.html">${w(L, 'privacy')}</a></nav>
</div></footer>
</body>
</html>
`;
}

function credit(id, cfg, licence, now) {
  if (!licence) return '';
  const L = cfg.lang;
  const reuse = licence.reuse === 'cc' || licence.reuse === 'open' ? ` ${w(L, 'reuse')}` : '';
  return `<section class="credit">
<p>${updatedTag(L, now, cfg)}</p>
<p><strong>${w(L, 'source')}:</strong> ${esc(licence.attribution)}. <strong>${w(L, 'licence')}:</strong> <a href="${esc(licence.url)}" rel="nofollow">${esc(licence.licence)}</a>.${reuse}</p>
${id === 'mx' ? w(L, 'mxPlaces', null, 'p') : ''}
${w(L, 'disclaimer', null, 'p')}
</section>`;
}

/** The facts of one place that region pages and neighbours also need. */
function summarise(place, cfg, cutoff) {
  const fuels = [];
  for (const kind of cfg.fuels) {
    const rows = ranked(place.stations, kind, cutoff);
    const good = markDoubts(rows);
    if (good.length >= 2) fuels.push({ kind, label: cfg.labels[kind] ?? kind, rows, good, min: good[0], avg: mean(good) });
    if (fuels.length === MAX_FUELS) break;
  }
  return fuels;
}

/** "365 stations, 361 sell Unleaded 91": said once, under the heading, for the fuel shown first. */
export function countVars(place, f, cfg) {
  return { n: place.stations.length.toLocaleString(cfg.locale), k: f.rows.length.toLocaleString(cfg.locale), f: f.label };
}

function stationRow(r, rank, cfg, now, best) {
  const L = cfg.lang;
  const lim = restriction(r.s);
  const tag = (lim ? w(L, lim, null, 'span', ' class="tag"') : '') + (r.doubt ? w(L, 'checkPrice', null, 'span', ' class="tag warn"') : '');
  // Western Australia fixes prices for the day and Mexico's source gives no report time: no time is shown.
  const time = cfg.fixedDaily || cfg.current ? '' : `<span class="when">${w(L, 'reported')} ${esc(when(r.at, cfg, now))}</span>`;
  const name = stationName(r.s);
  const kick = best ? w(L, 'bestNow', null, 'span', ' class="kick"') : '';
  return `<li class="st${best ? ' first' : ''}"><span class="rk" aria-hidden="true">${rank}</span><div class="who">${kick}<strong>${esc(name)}</strong>${tag}<span class="addr">${esc(stationAddress(r.s))}</span>${time}</div><span class="pp">${esc(money(r.p, cfg.money))}</span><a class="dir" href="${mapsUrl(r.s)}" rel="nofollow noopener" aria-label="${esc(say(L, 'directionsTo', { s: name }))}" data-kl="directionsTo"><span class="i-pin"></span>${w(L, 'directions', null, 'span', ' class="dw"')}</a></li>`;
}

function placePage(id, place, ctx) {
  const { cfg, licence, now, regionUrl, nearby } = ctx;
  const t = ctx.t;
  const L = cfg.lang;
  const fuels = place.fuels;
  const main = fuels[0];
  const url = `${regionUrl}${place.slug}/`;
  const title = t.title(place.name);
  const desc = t.desc(main.label, money(main.min.p, cfg.money), place.name, stationName(main.min.s), place.stations.length);
  // One compact row of fuel chips with the cheapest price each: they jump to (and with site.js, choose) a list.
  const chips = fuels.map((f, i) => `<a class="fchip" href="#f-${f.kind}" data-pick="${f.kind}"${i === 0 ? ' aria-current="true"' : ''}>${fuelLabel(f)}<b>${esc(money(f.min.p, cfg.money))}</b></a>`).join('');
  const tables = fuels.map((f) => {
    const rows = f.rows.slice(0, MAX_ROWS);
    const row = (r, i) => stationRow(r, i + 1, cfg, now, r === f.min);
    const top = rows.slice(0, TOP).map(row).join('\n');
    const rest = rows.slice(TOP);
    const more = rest.length
      ? `<details class="more"><summary>${w(L, 'showAll', { n: f.rows.length.toLocaleString(cfg.locale) })}</summary><ol class="list">${rest.map((r, i) => row(r, TOP + i)).join('\n')}</ol>${f.rows.length > MAX_ROWS ? w(L, 'capped', { k: MAX_ROWS }, 'p', ' class="note"') : ''}</details>`
      : '';
    return `<section class="fuel" id="f-${f.kind}" data-v="${esc(JSON.stringify(countVars(place, f, cfg)))}">
<h2>${fuelLabel(f)} ${w(L, 'perLitre', null, 'span', ' class="unit"')}</h2>
<ol class="list">
${top}
</ol>
${more}
</section>`;
  }).join('\n');
  const leadVars = { f: main.label, p: place.name, price: money(main.min.p, cfg.money), s: stationName(main.min.s) };
  let lead = `<p class="lead">${w(L, 'lead', leadVars)}`;
  const gap = (main.avg - main.min.p) * FILL_LITRES;
  if (main.good.length >= 3 && gap >= 50) lead += ` ${w(L, 'saving', { n: main.good.length.toLocaleString(cfg.locale), avg: money(main.avg, cfg.money), save: amount(gap, cfg.money) })}`;
  if (main.good.length < main.rows.length) lead += ` ${w(L, 'leftOut')}`;
  lead += '</p>';
  let tomorrow = '';
  if (cfg.fixedDaily) {
    const lines = [];
    for (const f of fuels.slice(0, 3)) {
      const both = f.good.filter((r) => r.s.tomorrow && r.s.tomorrow[f.kind] > 0);
      if (both.length < 2) continue;
      const avgT = both.reduce((a, r) => a + r.s.tomorrow[f.kind], 0) / both.length;
      const d = avgT - mean(both);
      const bestT = both.slice().sort((a, b) => a.s.tomorrow[f.kind] - b.s.tomorrow[f.kind])[0];
      const key = Math.abs(d) < 0.05 ? 'tomorrowSame' : d > 0 ? 'tomorrowUp' : 'tomorrowDown';
      lines.push(w(L, key, { f: f.label, avg: money(avgT, cfg.money), d: `${Math.abs(d).toFixed(1)}c`, min: money(bestT.s.tomorrow[f.kind], cfg.money), s: stationName(bestT.s) }, 'li'));
    }
    if (lines.length) tomorrow = `<section class="panel">${w(L, 'tomorrowH', { p: place.name }, 'h2')}<ul>${lines.join('')}</ul></section>`;
  }
  const near = `<section class="nearby">${nearby.length ? `${w(L, 'nearby', null, 'h2')}<nav class="chips">${nearby.map((n) => `<a class="chip" href="../${n.slug}/">${esc(n.name)}</a>`).join('')}</nav>` : ''}<a class="btn ghost" href="../">${w(L, 'allIn', { r: { k: `rn_${id}` } })}${ICON_ARROW}</a></section>`;
  const app = cfg.app ? `<p class="app">${w(L, 'app')} <a href="${APP_STORE}">${w(L, 'appLink')}</a>.</p>` : '';
  const fixed = cfg.fixedDaily ? w(L, 'fixed', null, 'p', ' class="note"') : '';
  const body = `<div class="head">
${w(L, 'h1', { p: place.name }, 'h1')}
<p class="meta">${w(L, 'countSell', countVars(place, main, cfg), 'span', ' id="cnt"')}</p>
<p class="meta">${updatedTag(L, now, cfg)}</p>
</div>
${searchBox(L, '', true)}
<nav class="fuels" aria-label="${esc(say(L, 'cheapestFuel'))}" data-kl="cheapestFuel">${chips}</nav>
<div class="cols">
<div class="lists">
${tables}
</div>
<aside class="side">
<section class="sum">${lead}${fixed}</section>
${tomorrow}
${near}
${app}
${credit(id, cfg, licence, now)}
</aside>
</div>`;
  const crumbs = [{ name: say(L, 'home'), k: 'home', url: `${BASE}/` }, { name: cfg.name, k: `rn_${id}`, url: regionUrl }, { name: place.name, url }];
  const country = cfg.locale.split('-')[1];
  const stationsLd = {
    '@type': 'ItemList', name: `${main.label}: ${place.name}`, itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: main.rows.length,
    itemListElement: main.rows.slice(0, TOP).map((r, i) => ({
      '@type': 'ListItem', position: i + 1,
      item: {
        '@type': 'GasStation', name: stationName(r.s),
        address: { '@type': 'PostalAddress', streetAddress: tidyText(r.s.address).replace(/[\s,;.]+$/, '') || undefined, addressLocality: tidyText(r.s.town) || place.name, postalCode: r.s.postcode || undefined, addressCountry: country },
        geo: { '@type': 'GeoCoordinates', latitude: r.s.lat, longitude: r.s.lng },
      },
    })),
  };
  return layout({ lang: L, title, desc, canonical: url, crumbs, body, modified: now.toISOString(), data: [stationsLd], ads: !NO_ADS.has(id) });
}

/** First letter for the A to Z index, without accents ("Ávila" goes under A). */
function letterOf(name) {
  const c = slugify(name).charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
}

function regionPage(id, places, total, ctx) {
  const { cfg, t, licence, now, regionUrl, dataBase } = ctx;
  const L = cfg.lang;
  const mainKind = cfg.fuels[0];
  const mainFuel = { kind: mainKind, label: cfg.labels[mainKind] };
  const cheap = places.filter((p) => p.stations.length >= 5 && p.fuels[0].kind === mainKind && p.fuels[0].good.length >= 4)
    .slice().sort((a, b) => a.fuels[0].avg - b.fuels[0].avg).slice(0, 10);
  const cheapHtml = cheap.length >= 5 ? `<section><h2>${w(L, 'cheapPlaces')} <span class="unit">${fuelLabel(mainFuel)}</span></h2>
<ol class="rank">${cheap.map((p, i) => `<li><a href="${p.slug}/"><span class="rk" aria-hidden="true">${i + 1}</span><span class="nm">${esc(p.name)}${w(L, 'avgIs', { v: money(p.fuels[0].avg, cfg.money) }, 'small')}</span><span class="pp">${w(L, 'from', null, 'small')}${esc(money(p.fuels[0].min.p, cfg.money))}</span></a></li>`).join('')}</ol></section>` : '';
  const groups = new Map();
  for (const p of places) {
    const l = letterOf(p.name);
    if (!groups.has(l)) groups.set(l, []);
    groups.get(l).push(p);
  }
  const letters = [...groups.keys()].sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)));
  const az = places.length > 24 ? `<nav class="az" aria-label="${esc(say(L, 'jump'))}" data-kl="jump">${letters.map((l) => `<a href="#l-${l === '#' ? 'other' : l}">${l}</a>`).join('')}</nav>` : '';
  // A to Z rows are kept small (one link, the count and the price) because big regions list over 1,000 places.
  const lists = letters.map((l) => `<section class="letter" id="l-${l === '#' ? 'other' : l}"><h3>${l}</h3><ul class="rows">${groups.get(l).map((p) => {
    const f = p.fuels.find((x) => x.kind === mainKind) ?? p.fuels[0];
    const other = f.kind === mainKind ? '' : ` <small data-fuel="${f.kind}">${esc(f.label)}</small>`;
    return `<li><a href="${p.slug}/">${esc(p.name)}${other}<i>${p.stations.length.toLocaleString(cfg.locale)}</i><b>${esc(money(f.min.p, cfg.money))}</b></a></li>`;
  }).join('')}</ul></section>`).join('\n');
  const body = `<div class="head">
${w(L, 'regionH1', { r: { k: `rn_${id}` } }, 'h1')}
${w(L, 'regionLead', { n: total.toLocaleString(cfg.locale), k: places.length.toLocaleString(cfg.locale) }, 'p', ' class="lead"')}
<p class="meta">${updatedTag(L, now, cfg)}</p>
</div>
${searchBox(L, id)}
${nearBox(L, dataBase)}
${cheapHtml}
<section class="all"><h2>${w(L, 'aToZ')} <span class="unit">${fuelLabel(mainFuel)}</span></h2>
${w(L, 'legend', null, 'p', ' class="note"')}
${az}
${lists}
</section>
${credit(id, cfg, licence, now)}`;
  const crumbs = [{ name: say(L, 'home'), k: 'home', url: `${BASE}/` }, { name: cfg.name, k: `rn_${id}`, url: regionUrl }];
  const placesLd = {
    '@type': 'ItemList', name: t.regionTitle(cfg.name).replace(/ \| Pumpwise$/, ''), numberOfItems: places.length,
    itemListElement: places.slice().sort((a, b) => b.stations.length - a.stations.length).slice(0, 30)
      .map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: `${regionUrl}${p.slug}/` })),
  };
  return layout({ data: [placesLd], ads: !NO_ADS.has(id), lang: L, title: t.regionTitle(cfg.name), desc: t.regionDesc(cfg.name, total.toLocaleString(cfg.locale), places.length.toLocaleString(cfg.locale)), canonical: regionUrl, crumbs, body, modified: now.toISOString() });
}

function regionGrid(cards, L) {
  return cards.map((c) => `<li><a class="region" href="${c.regionUrl}">
<span class="code">${CODES[c.id] ?? esc(c.id.toUpperCase())}</span>
<span class="rname">${w(L, `rn_${c.id}`)}<small>${w(L, 'nStations', { n: c.stations.toLocaleString('en-US') })} · ${w(L, 'placesCount', { k: c.places.toLocaleString('en-US') })}</small></span>
<span class="board">${c.fuels.slice(0, 2).map((f) => `<span class="line"><span class="fuel" data-fuel="${f.kind}" data-lang="${c.cfg.lang}">${esc(f.label)}</span><span class="digits">${esc(money(f.avg, c.cfg.money))}</span></span>`).join('')}</span>
<span class="go">${ICON_ARROW}</span>
</a></li>`).join('\n');
}

function homePage(cards, total, now, dataBase) {
  const L = 'en';
  const t = T.en;
  const popular = cards.flatMap((c) => c.top.map((p) => ({ ...p, url: `${c.regionUrl}${p.slug}/` })))
    .sort((a, b) => b.stations - a.stations).slice(0, 12)
    .map((p) => `<a class="chip" href="${p.url}">${esc(p.name)}</a>`).join('');
  const body = `<section class="hero">
${w(L, 'indexH1', null, 'h1')}
${w(L, 'indexLead', { n: total, k: cards.length }, 'p', ' class="lead"')}
${searchBox(L, '')}
${nearBox(L, dataBase)}
${w(L, 'popular', null, 'p', ' class="poplabel"')}
<nav class="chips">${popular}</nav>
</section>
<ul class="trust">${w(L, 'trust1', null, 'li')}${w(L, 'trust2', null, 'li')}${w(L, 'trust3', null, 'li')}</ul>
<section><h2>${w(L, 'regions')} ${w(L, 'perLitreAvg', null, 'span', ' class="unit"')}</h2>
<ul class="regions">
${regionGrid(cards, L)}
</ul></section>
<p class="app">${w(L, 'appHome')} <a href="${APP_STORE}">${w(L, 'appHomeLink')}</a>.</p>
<section class="credit"><p>${updatedTag(L, now, null)}</p>${w(L, 'disclaimer', null, 'p')}</section>`;
  const siteLd = [
    { '@type': 'WebSite', name: 'Pumpwise', url: `${SITE_BASE}/`, description: t.indexDesc(total), inLanguage: ['en', 'es', 'fr', 'pt'] },
    { '@type': 'Organization', name: 'Pumpwise', url: `${SITE_BASE}/`, logo: `${BASE}/logo.png`, email: 'tyjcraw@gmail.com' },
  ];
  return layout({ lang: L, title: t.indexTitle, desc: t.indexDesc(total), canonical: `${BASE}/`, crumbs: [{ name: say(L, 'home'), k: 'home', url: `${BASE}/` }], body, modified: now.toISOString(), data: siteLd });
}

/** The site's own "page not found" page (GitHub Pages serves /404.html for any missing page). */
function notFoundPage(cards, now) {
  const L = 'en';
  const body = `<div class="head">
${w(L, 'notFoundH', null, 'h1')}
${w(L, 'notFoundLead', null, 'p', ' class="lead"')}
</div>
${searchBox(L, '')}
<section><h2>${w(L, 'regions')} ${w(L, 'perLitreAvg', null, 'span', ' class="unit"')}</h2>
<ul class="regions">
${regionGrid(cards, L)}
</ul></section>`;
  return layout({ lang: L, title: 'Page not found | Pumpwise', desc: 'This page does not exist. Find official fuel prices by town and city.', canonical: '', crumbs: [{ name: say(L, 'home'), k: 'home', url: `${BASE}/` }], body, modified: now.toISOString(), noindex: true });
}

export const STYLE = `:root{color-scheme:light dark;--bg:#F4F1EA;--fg:#121B26;--muted:#5A6372;--card:#FFFFFF;--card2:#EBE6DA;--border:#E0D9CB;--link:#9A5B00;--sign:#101820;--amber:#FFB000;--green:#3BE38C;--cheap:#087A43;--cheapbg:#E3F5EA;--shadow:0 1px 2px rgba(18,27,38,.06),0 4px 14px rgba(18,27,38,.06)}
@media (prefers-color-scheme:dark){:root{--bg:#0A0F15;--fg:#F3F0E8;--muted:#A4ACB7;--card:#131B24;--card2:#1A2430;--border:#24303C;--link:#FFC54D;--sign:#05090D;--cheap:#3BE38C;--cheapbg:#11281D;--shadow:none}}
*{box-sizing:border-box}
[hidden]{display:none!important}
.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.skip{position:absolute;left:8px;top:-80px;z-index:10;display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border-radius:10px;background:var(--amber);color:#101820;font-weight:700;text-decoration:none}
.skip:focus{top:8px}
main:focus{outline:none}
.langwrap{display:inline-flex;align-items:center}
select.lang{min-height:44px;padding:0 28px 0 10px;border-radius:10px;border:1px solid rgba(255,255,255,.22);background:#101820 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' fill='none' stroke='%23F3F0E8' stroke-width='2.2' stroke-linecap='round'/%3E%3C/svg%3E") right 8px center/14px no-repeat;color:#F3F0E8;font:inherit;font-size:15px;font-weight:600;-webkit-appearance:none;appearance:none;cursor:pointer}
select.lang:hover{background-color:#1A2430}
@media (max-width:380px){.brand span{display:none}}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
a{color:var(--link)}
.bar,main{max-width:1120px;margin:0 auto;padding:0 16px}
main{padding-top:4px;padding-bottom:48px}
.top{background:#101820;color:#F3F0E8;position:sticky;top:0;z-index:5;border-bottom:3px solid var(--amber)}
.top .bar{display:flex;align-items:center;justify-content:space-between;min-height:56px;gap:12px}
.brand{display:inline-flex;align-items:center;gap:10px;color:#F3F0E8;text-decoration:none;font-weight:800;font-size:19px;letter-spacing:-.2px;min-height:44px;min-width:44px}
.mark{flex:none;border-radius:8px}
.menu{display:flex;align-items:center;gap:4px}
.menu a{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 12px;border-radius:10px;color:#F3F0E8;text-decoration:none;font-weight:600;font-size:15px}
.menu a:hover{background:rgba(255,255,255,.08)}
.menu .findlink{background:var(--amber);color:#101820}
.menu .findlink:hover{background:#FFC54D}
@media (max-width:560px){.menu a:not(.findlink){display:none}.menu .findlink span{display:none}.menu .findlink{width:44px;justify-content:center;padding:0}}
.crumbs{display:flex;flex-wrap:wrap;align-items:center;font-size:14px;color:var(--muted);margin:2px 0 0}
.crumbs a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;padding:0 2px;font-weight:600;text-decoration:none}
.crumbs a:hover{text-decoration:underline}
.crumbs .sep{padding:0 6px}
h1{font-size:clamp(26px,6vw,44px);line-height:1.1;letter-spacing:-.6px;margin:2px 0 6px;font-weight:800}
h2{font-size:21px;line-height:1.25;margin:32px 0 12px;font-weight:800;letter-spacing:-.2px}
h2 .unit{font-size:14px;font-weight:500;color:var(--muted);letter-spacing:0;margin-left:6px}
h3{font-size:15px;margin:20px 0 8px;color:var(--muted);letter-spacing:.5px}
.lead{font-size:18px;line-height:1.5;margin:8px 0}
.meta,.note,small{color:var(--muted);font-size:14px}
.meta{margin:2px 0 0;line-height:1.4}
.head{margin:2px 0 12px}
.tag{display:inline-block;margin-left:8px;padding:1px 8px;border:1px solid var(--border);border-radius:999px;color:var(--muted);font-size:12px;font-weight:600;white-space:nowrap;vertical-align:2px}
.tag.warn{color:var(--link);border-color:currentColor}
/* Fuel chips: one compact row that scrolls sideways when it must; the price keeps the roadside sign look */
.fuels{display:flex;gap:8px;overflow-x:auto;margin:0 -16px 4px;padding:2px 16px 6px;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
.fchip{flex:none;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:4px 6px 4px 12px;border-radius:12px;border:1px solid var(--border);background:var(--card);color:var(--fg);text-decoration:none;font:inherit;font-size:14px;font-weight:600;white-space:nowrap;cursor:pointer}
.fchip b{background:var(--sign);color:var(--green);border-radius:8px;padding:3px 8px;font:700 17px/1.2 "Arial Narrow","Roboto Condensed","Helvetica Neue",sans-serif;font-variant-numeric:tabular-nums}
.fchip[aria-current=true],.fchip[aria-pressed=true]{border:2px solid var(--amber);background:var(--card2)}
.nearfuels .fchip{padding:4px 14px}
.fchip:hover{border-color:var(--amber)}
.btn{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border-radius:12px;background:var(--amber);color:#101820;font-weight:700;text-decoration:none}
.btn:hover{background:#FFC54D}
.btn.ghost{background:transparent;color:var(--link);border:1px solid var(--border);margin-top:14px}
.btn.ghost:hover{background:var(--card)}
/* Station lists: a fixed price column; the cheapest row carries a labelled Directions button */
.fuel h2{margin:16px 0 8px}
.list{list-style:none;margin:0;padding:0;color:var(--fg);background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:var(--shadow)}
.st{display:grid;grid-template-columns:26px minmax(0,1fr) 5.6em auto;gap:4px 10px;align-items:center;padding:10px 8px 10px 12px;border-bottom:1px solid var(--border)}
.st:last-child{border-bottom:0}
.st .rk{width:26px;height:26px;border-radius:50%;background:var(--card2);color:var(--muted);font-size:13px;font-weight:700;display:grid;place-items:center}
.st.first{background:var(--cheapbg)}
.st.first .rk{background:var(--cheap);color:var(--card)}
.who{min-width:0;color:inherit;text-decoration:none}
a.who{display:block;min-height:44px}
a.who strong{color:var(--link);text-decoration:underline;text-underline-offset:2px}
.who strong{font-size:16px;line-height:1.3}
.who .addr,.who .when{display:block;color:var(--muted);font-size:13.5px;line-height:1.35}
.kick{display:block;font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--cheap)}
.pp{font-weight:800;font-size:17px;font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right}
.st.first .pp{color:var(--cheap);font-size:19px}
.dir{min-width:44px;height:44px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 10px;color:var(--link);border:1px solid var(--border);text-decoration:none;font-weight:700;font-size:14px;white-space:nowrap}
.dir:hover{background:var(--card2)}
.st.first .dir{background:var(--amber);color:#101820;border-color:transparent}
@media (max-width:399px){.dir{padding:0}.dir .dw{display:none}.st.first .dir{grid-column:2/-1;justify-self:start;padding:0 14px}.st.first .dir .dw{display:inline}}
.i-pin{flex:none;width:20px;height:20px;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2.5c-3.9 0-7 3-7 6.9 0 5 6 10.1 6.3 10.4.4.3.9.3 1.3 0 .3-.3 6.4-5.4 6.4-10.4 0-3.9-3.1-6.9-7-6.9z' fill='none' stroke='%23000' stroke-width='2'/%3E%3Ccircle cx='12' cy='9.5' r='2.4'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2.5c-3.9 0-7 3-7 6.9 0 5 6 10.1 6.3 10.4.4.3.9.3 1.3 0 .3-.3 6.4-5.4 6.4-10.4 0-3.9-3.1-6.9-7-6.9z' fill='none' stroke='%23000' stroke-width='2'/%3E%3Ccircle cx='12' cy='9.5' r='2.4'/%3E%3C/svg%3E") center/contain no-repeat}
.more{margin-top:10px}
.more summary{cursor:pointer;display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border-radius:12px;border:1px solid var(--border);background:var(--card);font-weight:700;color:var(--link);list-style:none}
.more summary::-webkit-details-marker{display:none}
.more summary::after{content:"";width:8px;height:8px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);margin:-4px 0 0 10px}
.more[open] summary::after{transform:rotate(-135deg);margin-top:4px}
.more .list{margin-top:10px}
/* Place pages: lists, then the summary; two columns on wide screens */
.side .sum .lead{font-size:16px;margin:0}
.sum{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px 16px;margin-top:24px}
.sum .note{margin:8px 0 0}
@media (min-width:1024px){.cols{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:28px;align-items:start}.side{position:sticky;top:72px;max-height:calc(100vh - 84px);overflow-y:auto;padding-bottom:8px}.side .sum{margin-top:16px}.side .credit{margin-top:20px}.side h2{font-size:18px;margin-top:20px}}
/* Search */
.find{margin:14px 0 8px;position:relative}
.find.pop{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:12px;box-shadow:var(--shadow)}
.find label{display:block;font-weight:700;font-size:14px;margin-bottom:6px}
.field{display:flex;align-items:center;gap:8px;background:var(--card);border:2px solid var(--border);border-radius:14px;padding:0 6px 0 12px;color:var(--muted)}
.field:focus-within{border-color:var(--amber);box-shadow:0 0 0 3px rgba(255,176,0,.25)}
.field input{flex:1;min-width:0;height:54px;border:0;background:transparent;color:var(--fg);font:inherit;font-size:17px;outline:none}
.field button{height:44px;padding:0 16px;border:0;border-radius:10px;background:var(--amber);color:#101820;font:inherit;font-weight:700;cursor:pointer}
.hits{list-style:none;margin:6px 0 0;padding:0;background:var(--card);border-radius:14px;overflow:hidden;box-shadow:var(--shadow)}
.hits:empty{display:none}
.hits a{display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:48px;padding:8px 14px;border:1px solid var(--border);border-top:0;text-decoration:none;color:var(--fg);font-weight:600}
.hits li:first-child a{border-top:1px solid var(--border);border-radius:14px 14px 0 0}
.hits li:last-child a{border-radius:0 0 14px 14px}
.hits li:only-child a{border-radius:14px}
.hits a:hover,.hits a:focus{background:var(--card2)}
.hits small{flex:none;text-align:right}
.none{color:var(--muted)}
.near{margin:12px 0 4px}
.nearbtn{border:0;font:inherit;font-weight:700;cursor:pointer}
.nearbtn:disabled{opacity:.7;cursor:progress}
.nearstatus{margin:8px 0 0;color:var(--muted);font-size:15px}
.nearstatus:empty{display:none}
.nearres h2{margin:18px 0 8px}
.nearres .fuels{margin-bottom:8px}
.seg{display:inline-flex;margin:0 0 10px;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--card)}
.seg button{min-height:44px;padding:0 16px;border:0;background:transparent;color:var(--fg);font:inherit;font-size:15px;font-weight:600;cursor:pointer}
.seg button[aria-pressed=true]{background:var(--amber);color:#101820}
.when.cheap{color:var(--cheap);font-weight:700}
.hero .nearstatus,.hero .note{color:#C9D1DB}
.hero .nearres{background:var(--bg);color:var(--fg);border-radius:16px;padding:4px 12px 8px;margin:12px 0 0}
.hero .nearres .note{color:var(--muted)}
/* Home */
.hero{background:#101820;color:#F3F0E8;margin:0 -16px;padding:28px 16px 22px;border-radius:0 0 22px 22px}
.hero h1{color:#FFFFFF;max-width:16ch}
.hero .lead{color:#C9D1DB;max-width:56ch}
.hero .find label{color:#F3F0E8}
.hero .field{border-color:#24303C;background:#FFFFFF;color:#5A6372}
.hero .field input{color:#121B26}
.hero .hits a{color:#121B26;background:#FFFFFF;border-color:#E0D9CB}
.hero .hits a:hover,.hero .hits a:focus{background:#F4F1EA}
.hero .hits small{color:#5A6372}
.hero .none{color:#C9D1DB}
.poplabel{margin:14px 0 6px;font-size:13px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#A4ACB7}
.hero .chip{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.16);color:#F3F0E8}
.hero .chip:hover{background:rgba(255,255,255,.16)}
@media (min-width:1152px){.hero{margin:0;border-radius:22px;padding:36px 32px 28px;margin-top:16px}}
.trust{list-style:none;display:flex;flex-wrap:wrap;gap:8px 20px;padding:0;margin:16px 0 0;color:var(--muted);font-size:14px;font-weight:600}
.trust li::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--cheap);margin-right:8px;vertical-align:1px}
.regions{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.region{display:grid;grid-template-columns:auto 1fr auto;grid-template-areas:"code name go" "board board board";gap:10px 12px;align-items:center;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:14px;text-decoration:none;color:var(--fg);box-shadow:var(--shadow);transition:transform .12s,border-color .12s}
.region:hover{transform:translateY(-2px);border-color:var(--amber)}
.region .code{grid-area:code;min-width:44px;height:44px;padding:0 8px;border-radius:12px;background:var(--amber);color:#101820;font-weight:800;font-size:15px;display:grid;place-items:center}
.region .rname{grid-area:name;font-weight:800;font-size:18px;line-height:1.2}
.region .rname small{display:block;font-weight:500;margin-top:2px}
.region .go{grid-area:go;color:var(--muted)}
.region .board{grid-area:board;background:var(--sign);border-radius:12px;padding:8px 12px;display:grid;gap:2px}
.region .line{display:flex;justify-content:space-between;gap:12px;align-items:baseline}
.region .line .fuel{color:#C9D1DB;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.region .digits{color:var(--green);font:700 20px/1.2 "Arial Narrow","Roboto Condensed",sans-serif;font-variant-numeric:tabular-nums;white-space:nowrap}
/* Chips, ranks and A to Z */
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border-radius:999px;border:1px solid var(--border);background:var(--card);color:var(--fg);text-decoration:none;font-weight:600;font-size:15px}
.chip:hover{border-color:var(--amber)}
.rank{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px}
.rank a{display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 14px;background:var(--card);border:1px solid var(--border);border-radius:12px;text-decoration:none;color:var(--fg)}
.rank a:hover,.rows a:hover{border-color:var(--amber)}
.rank .rk{flex:none;width:28px;height:28px;border-radius:50%;background:var(--sign);color:var(--green);font-weight:800;font-size:14px;display:grid;place-items:center}
.nm{flex:1;min-width:0;font-weight:700;line-height:1.25}
.nm small{display:block;font-weight:500;font-size:13px}
.rank .pp{display:flex;flex-direction:column;align-items:flex-end;line-height:1.1;font-size:16px}
.rank .pp small{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.4px}
.az{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 4px;position:sticky;top:59px;z-index:2;background:var(--bg);padding:6px 0}
.az a{min-width:44px;height:44px;display:grid;place-items:center;border-radius:10px;background:var(--card);border:1px solid var(--border);text-decoration:none;font-weight:700;color:var(--fg)}
.az a:hover{border-color:var(--amber)}
.letter{scroll-margin-top:120px}
.rows{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:6px}
@media (min-width:1024px){.rows{grid-template-columns:repeat(3,minmax(0,1fr))}}
.rows a{display:flex;align-items:center;gap:10px;min-height:48px;padding:6px 12px;background:var(--card);border:1px solid var(--border);border-radius:12px;text-decoration:none;color:var(--fg);font-weight:700;line-height:1.25}
.rows i{font-style:normal;font-weight:500;font-size:13px;color:var(--muted);margin-left:auto;white-space:nowrap}
.rows b{min-width:4.8em;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.rows small{font-weight:500}
.fuel{scroll-margin-top:72px}
.panel,.app{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px 16px;margin-top:24px}
.panel h2{margin-top:4px}
.nearby{margin-top:8px}
.credit{margin-top:36px;padding:14px 16px;border-radius:14px;background:var(--card2);color:var(--muted);font-size:14px}
.credit p{margin:4px 0}
.credit a{color:inherit;text-decoration:underline}
.credit a,.app a{display:inline-block;padding:12px 0;margin:-12px 0}
footer.site{background:#101820;color:#C9D1DB;margin-top:24px}
footer.site .bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px;padding-top:10px;padding-bottom:10px}
footer.site nav{display:flex;flex-wrap:wrap;gap:4px}
footer.site nav a{display:inline-flex;align-items:center;min-height:44px;padding:0 10px;color:#FFC54D;text-decoration:none;font-weight:600}
footer.site nav a:hover{text-decoration:underline}
a:focus-visible,summary:focus-visible,button:focus-visible,select:focus-visible{outline:3px solid var(--amber);outline-offset:2px}
@media (max-width:420px){.st{grid-template-columns:24px minmax(0,1fr) 5.2em auto;gap:4px 8px;padding-left:10px}.pp{font-size:16px}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.region{transition:none}}
`;

/**
 * Every page of the price site.
 * @param meta the feed's meta.json (regions, licences, generatedAt)
 * @param byRegion region id to its station list (data/v4/regions/<id>.json)
 * @returns files (path under prices/ to text), rootFiles (path at the site root to text) and counts
 */
export function buildSite(meta, byRegion) {
  const now = new Date(meta.generatedAt);
  const cutoff = now.getTime() - STALE_DAYS * 86400000;
  const files = new Map();
  const urls = [];
  const maps = new Map();   // sitemap name to its URLs: one per region, so Search Console reports each country
  const cards = [];
  // The search index: regions, pages and the towns and postcodes without a page of their own.
  // p: [name, region, slug ("" when it is the name's own slug), stations, lat, lng]; t and c: [page,
  // "Town|Town"] and [page, "postcode postcode"], each pointing at its nearest page. Kept small on purpose.
  const idx = { r: [], p: [], t: [], c: [] };
  // The feed's own folder (data/v4/...), where the "Near me" box finds the tiles.
  const dataBase = `${SITE_BASE}/data/v${meta.v ?? 4}/`;
  const stats = { regions: 0, places: 0, stations: 0, skipped: [], doubts: 0, aliases: 0, coverage: {} };
  for (const id of Object.keys(REGIONS)) {
    const cfg = REGIONS[id];
    const stations = byRegion[id];
    const status = meta.regions && meta.regions[id];
    const licence = meta.licences && meta.licences[id];
    if (!Array.isArray(stations) || !stations.length || !status) continue;
    if (!licence || licence.reuse === 'no-republish') {
      stats.skipped.push(id);
      continue;
    }
    const t = { ...T.en, ...T[cfg.lang] };
    const regionUrl = `${BASE}/${cfg.slug}/`;
    const places = placesFor(id, stations).map((p) => ({ ...p, fuels: summarise(p, cfg, cutoff) })).filter((p) => p.fuels.length);
    if (!places.length) continue;
    const ctx = { cfg, t, licence, now, regionUrl, dataBase };
    const ri = idx.r.push([id, cfg.slug]) - 1;
    const first = idx.p.length;
    const covered = new Set();
    for (const p of places) {
      const nearby = places.filter((q) => q !== p).map((q) => ({ q, d: km(p.lat, p.lng, q.lat, q.lng) })).sort((a, b) => a.d - b.d).slice(0, 8).map((x) => x.q);
      files.set(`${cfg.slug}/${p.slug}/index.html`, placePage(id, p, { ...ctx, nearby }));
      urls.push(`${regionUrl}${p.slug}/`);
      maps.set(cfg.slug, [...(maps.get(cfg.slug) ?? []), `${regionUrl}${p.slug}/`]);
      idx.p.push([p.name, ri, p.slug === slugify(p.name) ? '' : p.slug, p.stations.length, Math.round(p.lat * 100) / 100, Math.round(p.lng * 100) / 100]);
      for (const s of p.stations) covered.add(s);
      for (const f of p.fuels) stats.doubts += f.rows.filter((r) => r.doubt).length;
    }
    const al = aliasesFor(id, stations, places);
    const group = (pairs, sep, into) => {
      const by = new Map();
      for (const [name, i] of pairs) by.set(first + i, [...(by.get(first + i) ?? []), name]);
      for (const [i, names] of by) into.push([i, names.join(sep)]);
      stats.aliases += pairs.length;
    };
    group(al.towns, '|', idx.t);
    group(al.codes, ' ', idx.c);
    stats.coverage[id] = { stations: stations.length, onPage: covered.size, places: places.length };
    files.set(`${cfg.slug}/index.html`, regionPage(id, places, stations.length, ctx));
    urls.push(regionUrl);
    maps.set('main', [...(maps.get('main') ?? []), regionUrl]);
    const all = { name: cfg.name, stations, fuels: [] };
    all.fuels = summarise(all, cfg, cutoff);
    const top = places.slice().sort((a, b) => b.stations.length - a.stations.length).slice(0, 2).map((p) => ({ name: p.name, slug: p.slug, stations: p.stations.length }));
    cards.push({ id, cfg, t, regionUrl, places: places.length, stations: stations.length, fuels: all.fuels, top });
    stats.regions += 1;
    stats.places += places.length;
    stats.stations += stations.length;
  }
  if (!cards.length) throw new Error('No region produced any price page.');
  const total = stats.stations.toLocaleString('en-US');
  files.set('index.html', homePage(cards, total, now, dataBase));
  urls.unshift(`${BASE}/`);
  const lastmod = now.toISOString().slice(0, 10);
  maps.set('main', [`${BASE}/`, ...(maps.get('main') ?? [])]);
  const urlset = (list) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${list.map((u) => `<url><loc>${esc(u)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  for (const [name, list] of maps) files.set(`sitemaps/${name}.xml`, urlset(list));
  // prices/sitemap.xml (the address Search Console knows) is the index of them all.
  files.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...maps.keys()].map((n) => `<sitemap><loc>${BASE}/sitemaps/${n}.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`);
  files.set('places.json', JSON.stringify(idx));
  files.set('style.css', STYLE);
  files.set('site.js', siteJs());
  // robots.txt works now that the site has its own domain: it points search engines at the sitemap.
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`;
  const rootFiles = new Map([['404.html', notFoundPage(cards, now)], ['robots.txt', robots]]);
  // ads.txt names Google as the only seller of the site's ad space (AdSense asks for it).
  if (ADSENSE_CLIENT) rootFiles.set('ads.txt', `google.com, ${ADSENSE_CLIENT.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);
  return { files, rootFiles, urls, stats: { ...stats, pages: urls.length } };
}
