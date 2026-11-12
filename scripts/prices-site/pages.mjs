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

export const SITE_BASE = 'https://tjcraw6589.github.io/pumpwise';
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
    slug: 'western-australia', name: 'Western Australia', lang: 'en', locale: 'en-AU', tz: 'Australia/Perth', money: 'cents', app: true,
    fuels: ['regular', 'diesel', 'premium', 'super', 'premium-diesel', 'lpg'], labels: AU_FUELS, fixedDaily: true,
    cities: [
      ['Perth', -31.9523, 115.8613, 30], ['Fremantle', -32.0569, 115.7439, 8], ['Joondalup', -31.7448, 115.7661, 8],
      ['Mandurah', -32.5269, 115.7217, 12], ['Bunbury', -33.3271, 115.6414, 12], ['Geraldton', -28.7774, 114.6149, 12],
      ['Albany', -35.0269, 117.8837, 12], ['Kalgoorlie', -30.7489, 121.4658, 12], ['Broome', -17.9614, 122.2359, 12],
    ],
  },
  nsw: {
    slug: 'new-south-wales', name: 'New South Wales and the ACT', lang: 'en', locale: 'en-AU', tz: 'Australia/Sydney', money: 'cents', app: false,
    fuels: ['regular', 'e10', 'diesel', 'premium', 'super', 'premium-diesel', 'lpg'], labels: AU_FUELS,
    cities: [
      ['Sydney', -33.8688, 151.2093, 30], ['Parramatta', -33.815, 151.0011, 8], ['Newcastle', -32.9283, 151.7817, 15],
      ['Wollongong', -34.4278, 150.8931, 15], ['Central Coast', -33.425, 151.342, 18], ['Canberra', -35.2809, 149.13, 20],
    ],
  },
  tas: {
    slug: 'tasmania', name: 'Tasmania', lang: 'en', locale: 'en-AU', tz: 'Australia/Hobart', money: 'cents', app: false,
    fuels: ['regular', 'diesel', 'premium', 'super', 'premium-diesel', 'e10'], labels: AU_FUELS,
    cities: [['Hobart', -42.8821, 147.3272, 15], ['Launceston', -41.4332, 147.1441, 12]],
  },
  es: {
    slug: 'spain', name: 'España', lang: 'es', locale: 'es-ES', tz: 'Europe/Madrid', money: 'euro', app: false, pc: 2,
    fuels: ['regular', 'diesel', 'super', 'premium-diesel', 'lpg'],
    labels: { regular: 'Gasolina 95', e10: 'Gasolina 95 E10', premium: 'Gasolina 95 Premium', super: 'Gasolina 98', diesel: 'Gasóleo A (diésel)', 'premium-diesel': 'Gasóleo Premium', lpg: 'GLP', e85: 'E85', hvo: 'Diésel renovable (HVO)' },
    cities: [],
  },
  fr: {
    slug: 'france', name: 'France', lang: 'fr', locale: 'fr-FR', tz: 'Europe/Paris', money: 'euro', app: false, pc: 2,
    fuels: ['regular', 'diesel', 'super', 'e85', 'premium', 'lpg'],
    labels: { regular: 'SP95 E10', premium: 'SP95', super: 'SP98', diesel: 'Gazole', e85: 'E85', lpg: 'GPL' },
    cities: [],
  },
  mx: {
    slug: 'mexico', name: 'México', lang: 'es', locale: 'es-MX', tz: 'America/Mexico_City', money: 'peso', app: false,
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
    slug: 'portugal', name: 'Portugal', lang: 'pt', locale: 'pt-PT', tz: 'Europe/Lisbon', money: 'euro', app: false, pc: 1,
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
    tomorrow: (p) => `Tomorrow in ${p}`,
    tomorrowLine: (f, avg, diff, min, s) => `${f}: average ${avg} tomorrow, ${diff}. Cheapest tomorrow: ${min} at ${s}.`,
    up: (d) => `up ${d} on today`, down: (d) => `down ${d} on today`, same: 'the same as today',
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
 * who only reads English must be able to use the Lisbon page). {name} marks a value filled in per page.
 */
export const LANGS = { en: 'English', es: 'Español', fr: 'Français', pt: 'Português' };
export const U = {
  en: {
    home: 'Fuel prices', find: 'Find a town', language: 'Language', stations: 'stations', nStations: '{n} stations',
    h1: 'Fuel prices in {p} today', lead: 'The cheapest {f} in {p} today is {price} at {s}.',
    saving: 'The average across {n} stations is {avg}, so the cheapest saves about {save} on a 50 litre fill.',
    cheapest: 'Cheapest', average: 'Average', avgIs: 'Average {v}', reported: 'Reported', perLitre: 'per litre',
    membersOnly: 'Members only', permitNeeded: 'Entry permit needed', nearby: 'Nearby places', allIn: 'All places in {r}',
    updated: 'Updated', source: 'Source', licence: 'Licence',
    disclaimer: 'Prices are the ones stations report to the official service. The price at the pump is what you pay.',
    reuse: 'The price tables on this page may be reused under the same licence.',
    regionH1: 'Fuel prices in {r} today', regionLead: '{n} stations, {k} towns and cities. Pick a place to see its cheapest stations.',
    cheapPlaces: 'Cheapest places today', from: 'from',
    indexH1: 'Find the cheapest fuel today', indexLead: 'Official prices from {n} stations in {k} countries and states, updated through the day.',
    app: 'Pumpwise for iPhone shows the cheapest station near you and whether it is worth the drive.', appLink: 'Get Pumpwise on the App Store',
    appHome: 'Pumpwise for iPhone is in the Australian App Store now. More countries are coming.', appHomeLink: 'See Pumpwise on the App Store',
    fixed: 'In Western Australia every station fixes its price for 24 hours from 6am.',
    searchLabel: 'Search for a town or city', searchPh: 'Type a town or city', noMatch: 'No place with that name. Try another spelling.', go: 'Go',
    bestNow: 'Cheapest right now', directions: 'Directions', directionsTo: 'Directions to {s}',
    showAll: 'Show all {n} stations', capped: 'Showing the {k} cheapest.', aToZ: 'All places A to Z', jump: 'Jump to a letter',
    licences: 'Data licences', privacy: 'Privacy', popular: 'Popular places', regions: 'Countries and states', perLitreAvg: 'average, per litre',
    placesCount: '{k} places', trust1: 'Official government prices', trust2: 'Updated through the day', trust3: 'Free to use, no sign up',
    nearBtn: 'Show stations near me', nearH: 'Closest stations to you', finding: 'Finding your location', loading: 'Loading prices near you',
    denied: 'Location is off for this page. Allow it in your browser settings, or search for a town instead.',
    failed: 'Your location could not be found. Search for a town instead.', none: 'No stations with prices within 120 km of you.',
    nearPrivacy: 'Your location stays in your browser. It is only used to pick which prices to load.', cheapestHere: 'Cheapest of these',
  },
  es: {
    home: 'Precios de carburantes', find: 'Buscar un lugar', language: 'Idioma', stations: 'gasolineras', nStations: '{n} gasolineras',
    h1: 'Precio de la gasolina y el diésel hoy en {p}', lead: 'Hoy en {p} el precio más bajo de {f} es {price}, en {s}.',
    saving: 'La media de {n} gasolineras es {avg}: llenar 50 litros al precio más bajo ahorra unos {save}.',
    cheapest: 'Más barato', average: 'Media', avgIs: 'Media {v}', reported: 'Comunicado', perLitre: 'por litro',
    membersOnly: 'Solo socios', permitNeeded: 'Requiere permiso de acceso', nearby: 'Lugares cercanos', allIn: 'Todos los lugares de {r}',
    updated: 'Actualizado', source: 'Fuente', licence: 'Licencia',
    disclaimer: 'Los precios son los que las estaciones comunican al servicio oficial. El precio válido es el del surtidor.',
    reuse: 'Las tablas de precios de esta página pueden reutilizarse con la misma licencia.',
    regionH1: 'Precio de la gasolina y el diésel hoy en {r}', regionLead: '{n} gasolineras, {k} municipios y ciudades. Elige un lugar para ver sus gasolineras más baratas.',
    cheapPlaces: 'Lugares más baratos hoy', from: 'desde',
    indexH1: 'Encuentra el combustible más barato hoy', indexLead: 'Precios oficiales de {n} gasolineras en {k} países y estados, actualizados durante el día.',
    app: 'Pumpwise para iPhone muestra la gasolinera más barata cerca de ti y si merece la pena el viaje.', appLink: 'Descarga Pumpwise en el App Store',
    appHome: 'Pumpwise para iPhone ya está en el App Store de Australia. Pronto llegará a más países.', appHomeLink: 'Ver Pumpwise en el App Store',
    fixed: 'En Australia Occidental cada gasolinera fija su precio durante 24 horas desde las 6 de la mañana.',
    searchLabel: 'Buscar un municipio o ciudad', searchPh: 'Escribe un municipio o ciudad', noMatch: 'Ningún lugar con ese nombre. Prueba a escribirlo de otra forma.', go: 'Ir',
    bestNow: 'Lo más barato ahora', directions: 'Cómo llegar', directionsTo: 'Cómo llegar a {s}',
    showAll: 'Ver las {n} gasolineras', capped: 'Se muestran las {k} más baratas.', aToZ: 'Todos los lugares de la A a la Z', jump: 'Ir a una letra',
    licences: 'Licencias de datos', privacy: 'Privacidad', popular: 'Lugares populares', regions: 'Países y estados', perLitreAvg: 'media, por litro',
    placesCount: '{k} lugares', trust1: 'Precios oficiales de los gobiernos', trust2: 'Actualizados durante el día', trust3: 'Gratis, sin registro',
    nearBtn: 'Ver gasolineras cerca de mí', nearH: 'Las gasolineras más cercanas', finding: 'Buscando tu ubicación', loading: 'Cargando precios cerca de ti',
    denied: 'La ubicación está desactivada para esta página. Actívala en los ajustes del navegador o busca un lugar.',
    failed: 'No se pudo encontrar tu ubicación. Busca un lugar.', none: 'No hay gasolineras con precios a menos de 120 km.',
    nearPrivacy: 'Tu ubicación no sale de tu navegador. Solo se usa para elegir qué precios cargar.', cheapestHere: 'La más barata de estas',
  },
  fr: {
    home: 'Prix des carburants', find: 'Trouver une commune', language: 'Langue', stations: 'stations', nStations: '{n} stations',
    h1: "Prix des carburants à {p} aujourd'hui", lead: "Aujourd'hui à {p}, le prix le plus bas ({f}) est de {price} : {s}.",
    saving: 'La moyenne de {n} stations est de {avg} : un plein de 50 litres au prix le plus bas économise environ {save}.',
    cheapest: 'Le moins cher', average: 'Moyenne', avgIs: 'Moyenne {v}', reported: 'Déclaré', perLitre: 'le litre',
    membersOnly: 'Réservé aux adhérents', permitNeeded: 'Permis d’accès requis', nearby: 'À proximité', allIn: 'Toutes les communes : {r}',
    updated: 'Mis à jour', source: 'Source', licence: 'Licence',
    disclaimer: 'Les prix sont ceux déclarés par les stations au service officiel. Le prix affiché à la pompe fait foi.',
    reuse: 'Les tableaux de prix de cette page peuvent être réutilisés sous la même licence.',
    regionH1: "Prix des carburants aujourd'hui en {r}", regionLead: '{n} stations, {k} communes. Choisissez une commune pour voir ses stations les moins chères.',
    cheapPlaces: "Communes les moins chères aujourd'hui", from: 'dès',
    indexH1: "Trouvez le carburant le moins cher aujourd'hui", indexLead: 'Prix officiels de {n} stations dans {k} pays et États, mis à jour toute la journée.',
    app: 'Pumpwise pour iPhone montre la station la moins chère près de vous et si le détour en vaut la peine.', appLink: 'Télécharger Pumpwise sur l’App Store',
    appHome: 'Pumpwise pour iPhone est disponible sur l’App Store australien. D’autres pays arrivent bientôt.', appHomeLink: 'Voir Pumpwise sur l’App Store',
    fixed: 'Dans l’État d’Australie occidentale, chaque station fixe son prix pour 24 heures à partir de 6 heures.',
    searchLabel: 'Rechercher une commune', searchPh: 'Tapez le nom d’une commune', noMatch: 'Aucune commune de ce nom. Essayez une autre orthographe.', go: 'OK',
    bestNow: 'Le moins cher maintenant', directions: 'Itinéraire', directionsTo: 'Itinéraire vers {s}',
    showAll: 'Voir les {n} stations', capped: 'Les {k} moins chères sont affichées.', aToZ: 'Toutes les communes de A à Z', jump: 'Aller à une lettre',
    licences: 'Licences des données', privacy: 'Confidentialité', popular: 'Lieux populaires', regions: 'Pays et États', perLitreAvg: 'moyenne, le litre',
    placesCount: '{k} communes', trust1: 'Prix officiels des gouvernements', trust2: 'Mis à jour toute la journée', trust3: 'Gratuit, sans inscription',
    nearBtn: 'Voir les stations près de moi', nearH: 'Les stations les plus proches', finding: 'Recherche de votre position', loading: 'Chargement des prix autour de vous',
    denied: 'La localisation est désactivée pour cette page. Autorisez-la dans les réglages du navigateur, ou cherchez une commune.',
    failed: 'Votre position est introuvable. Cherchez une commune.', none: 'Aucune station avec des prix à moins de 120 km.',
    nearPrivacy: 'Votre position reste dans votre navigateur. Elle sert seulement à choisir les prix à charger.', cheapestHere: 'La moins chère de celles-ci',
  },
  pt: {
    home: 'Preços dos combustíveis', find: 'Procurar um local', language: 'Idioma', stations: 'postos', nStations: '{n} postos',
    h1: 'Preços dos combustíveis em {p} hoje', lead: 'Hoje em {p}, o preço mais baixo de {f} é {price}, em {s}.',
    saving: 'A média de {n} postos é {avg}: abastecer 50 litros ao preço mais baixo poupa cerca de {save}.',
    cheapest: 'Mais barato', average: 'Média', avgIs: 'Média {v}', reported: 'Comunicado', perLitre: 'por litro',
    membersOnly: 'Só para sócios', permitNeeded: 'Requer autorização de entrada', nearby: 'Locais próximos', allIn: 'Todos os locais em {r}',
    updated: 'Atualizado', source: 'Fonte', licence: 'Licença',
    disclaimer: 'Os preços são os comunicados pelos postos ao serviço oficial. O preço válido é o da bomba.',
    reuse: 'As tabelas de preços desta página podem ser reutilizadas com a mesma licença.',
    regionH1: 'Preços dos combustíveis hoje em {r}', regionLead: '{n} postos, {k} localidades. Escolha um local para ver os postos mais baratos.',
    cheapPlaces: 'Locais mais baratos hoje', from: 'desde',
    indexH1: 'Encontre o combustível mais barato hoje', indexLead: 'Preços oficiais de {n} postos em {k} países e estados, atualizados ao longo do dia.',
    app: 'O Pumpwise para iPhone mostra o posto mais barato perto de si e se vale a pena a viagem.', appLink: 'Obter o Pumpwise na App Store',
    appHome: 'O Pumpwise para iPhone já está na App Store da Austrália. Em breve chegará a mais países.', appHomeLink: 'Ver o Pumpwise na App Store',
    fixed: 'Na Austrália Ocidental cada posto fixa o preço durante 24 horas a partir das 6 da manhã.',
    searchLabel: 'Procurar uma localidade', searchPh: 'Escreva uma localidade', noMatch: 'Nenhum local com esse nome. Tente outra grafia.', go: 'Ir',
    bestNow: 'O mais barato agora', directions: 'Direções', directionsTo: 'Direções para {s}',
    showAll: 'Ver os {n} postos', capped: 'São mostrados os {k} mais baratos.', aToZ: 'Todos os locais de A a Z', jump: 'Ir para uma letra',
    licences: 'Licenças dos dados', privacy: 'Privacidade', popular: 'Locais populares', regions: 'Países e estados', perLitreAvg: 'média, por litro',
    placesCount: '{k} locais', trust1: 'Preços oficiais dos governos', trust2: 'Atualizados ao longo do dia', trust3: 'Grátis, sem registo',
    nearBtn: 'Ver postos perto de mim', nearH: 'Os postos mais próximos', finding: 'A procurar a sua localização', loading: 'A carregar preços perto de si',
    denied: 'A localização está desligada para esta página. Ative-a nas definições do navegador ou procure um local.',
    failed: 'Não foi possível encontrar a sua localização. Procure um local.', none: 'Não há postos com preços a menos de 120 km.',
    nearPrivacy: 'A sua localização fica no seu navegador. Só é usada para escolher que preços carregar.', cheapestHere: 'O mais barato destes',
  },
};

/** Plain names of each fuel, added after a pump's own label when the visitor reads another language. */
export const FUEL_WORDS = {
  en: { regular: 'unleaded', e10: 'E10 unleaded', premium: 'premium unleaded', super: 'premium unleaded 98', diesel: 'diesel', 'premium-diesel': 'premium diesel', lpg: 'LPG', e85: 'E85', b20: 'B20 diesel', hvo: 'renewable diesel' },
  es: { regular: 'gasolina sin plomo', e10: 'gasolina E10', premium: 'gasolina premium', super: 'gasolina 98', diesel: 'diésel', 'premium-diesel': 'diésel premium', lpg: 'GLP', e85: 'E85', b20: 'diésel B20', hvo: 'diésel renovable' },
  fr: { regular: 'sans plomb', e10: 'sans plomb E10', premium: 'sans plomb premium', super: 'sans plomb 98', diesel: 'gazole', 'premium-diesel': 'gazole premium', lpg: 'GPL', e85: 'E85', b20: 'gazole B20', hvo: 'gazole renouvelable' },
  pt: { regular: 'gasolina sem chumbo', e10: 'gasolina E10', premium: 'gasolina premium', super: 'gasolina 98', diesel: 'gasóleo', 'premium-diesel': 'gasóleo premium', lpg: 'GPL', e85: 'E85', b20: 'gasóleo B20', hvo: 'gasóleo renovável' },
};

/** A text with its {values} filled in. */
export function fill(str, v) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (v && v[k] != null ? String(v[k]) : m));
}

/** One text in one language (English when that language lacks it). */
export function say(lang, key, v) {
  return fill((U[lang] && U[lang][key]) ?? U.en[key] ?? key, v);
}

/** Visible text that site.js can switch into the visitor's language. */
function w(lang, key, v, tag = 'span', attrs = '') {
  return `<${tag}${attrs} data-k="${key}"${v ? ` data-v="${esc(JSON.stringify(v))}"` : ''}>${esc(say(lang, key, v))}</${tag}>`;
}

/** A pump's own fuel label; site.js adds the plain fuel name in the visitor's language when it differs. */
function fuelLabel(f) {
  return `<span data-fuel="${f.kind}">${esc(f.label)}</span>`;
}

/** A date and time that site.js rewrites in the visitor's language, in the place's own time zone. */
function timeTag(now, tz, text) {
  return `<time datetime="${esc(now.toISOString())}" data-tz="${esc(tz)}">${esc(text)}</time>`;
}

const CODES = { wa: 'WA', nsw: 'NSW', tas: 'TAS', es: 'ES', fr: 'FR', mx: 'MX', pt: 'PT' };
/** How many stations are listed under a fuel at most (the first TOP show, the rest open with "Show all"). */
const MAX_ROWS = 100;

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function slugify(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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

function km(aLat, aLng, bLat, bLng) {
  const r = Math.PI / 180;
  const x = (bLng - aLng) * r * Math.cos(((aLat + bLat) / 2) * r);
  const y = (bLat - aLat) * r;
  return Math.sqrt(x * x + y * y) * 6371;
}

/** Date formatters are slow to make, so each region's three are made once. */
const formatters = new Map();
function formats(cfg) {
  let f = formatters.get(cfg.slug);
  if (!f) {
    f = {
      day: new Intl.DateTimeFormat('en-CA', { timeZone: cfg.tz, year: 'numeric', month: '2-digit', day: '2-digit' }),
      time: new Intl.DateTimeFormat(cfg.locale, { timeZone: cfg.tz, hour: '2-digit', minute: '2-digit', hour12: false }),
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

function stamp(now, cfg) {
  return new Intl.DateTimeFormat(cfg.locale, { timeZone: cfg.tz, day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' }).format(now);
}

function stationName(s) {
  const name = (s.name || '').trim() || (s.brand || '').trim() || (s.address || '').trim() || 'Station';
  const brand = (s.brand || '').trim();
  // The brand is added only when the name does not already say it ("24Xpress Lansvale" needs no "24Xpress logo").
  const first = (brand.split(/\s+/)[0] ?? '').toLowerCase();
  return brand && first && !name.toLowerCase().includes(first) ? `${name} (${brand})` : name;
}

/** One line of address, without the doubled commas and spaces some sources send ("Calle X,, 28000"). */
export function stationAddress(s) {
  const a = (s.address || '').trim();
  const name = (s.name || '').trim();
  const parts = [];
  if (a && a !== name) parts.push(a);
  const tail = [s.postcode, s.town].filter((x) => x && String(x).trim()).join(' ');
  if (tail) parts.push(tail);
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
    const town = (s.town || '').trim();
    if (!town) continue;
    const prefix = cfg.pc ? String(s.postcode || '').slice(0, cfg.pc) : '';
    const key = `${town.toLowerCase()}|${prefix}`;
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
      if (used.has(final)) return;
      used.add(final);
      const lat = g.stations.reduce((t, s) => t + s.lat, 0) / g.stations.length;
      const lng = g.stations.reduce((t, s) => t + s.lng, 0) / g.stations.length;
      places.push({ name: i === 0 || !g.prefix ? g.name : `${g.name} (${g.prefix})`, slug: final, lat, lng, stations: g.stations, city: false });
    });
  }
  places.sort((a, b) => a.name.localeCompare(b.name, cfg.locale));
  return places;
}

// ---------------------------------------------------------------------------------------------------
// Look and navigation (redesign of 12 Nov 2026): a slim dark header on every page with the Pumpwise mark,
// a search box on the home and region pages, region cards, an A to Z index, station cards with a
// directions button, "Show all" lists and a footer in the page's language. The price boards keep the
// look of a roadside price sign (dark board, green digits) in both themes on purpose: it is the brand.
// ---------------------------------------------------------------------------------------------------

const MARK = '<svg class="mark" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#101820"/><path d="M16 4.5c-5.2 0-9.3 4-9.3 9.1 0 6.7 7.9 13.3 8.4 13.7.5.4 1.3.4 1.8 0 .5-.4 8.4-7 8.4-13.7 0-5.1-4.1-9.1-9.3-9.1z" fill="#FFB000"/><path d="M16 8.4c-.2 0-.4.1-.5.3-1.2 1.6-3.6 5-3.6 6.9a4.1 4.1 0 0 0 8.2 0c0-1.9-2.4-5.3-3.6-6.9-.1-.2-.3-.3-.5-.3z" fill="#101820"/><path d="M14.3 15.3l1.3 1.3 2.2-2.4" fill="none" stroke="#FFB000" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_SEARCH = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const ICON_PIN = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 2.5c-3.9 0-7 3-7 6.9 0 5 6 10.1 6.3 10.4.4.3.9.3 1.3 0 .3-.3 6.4-5.4 6.4-10.4 0-3.9-3.1-6.9-7-6.9z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9.5" r="2.4" fill="currentColor"/></svg>';
const ICON_ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function mapsUrl(s) {
  return `https://www.google.com/maps/search/?api=1&amp;query=${s.lat},${s.lng}`;
}

/** The search box: hidden until site.js runs, so pages without scripts show only the lists. */
function searchBox(L, region) {
  return `<form class="find" id="find" role="search" hidden data-src="${BASE}/places.json"${region ? ` data-region="${esc(region)}"` : ''}>
${w(L, 'searchLabel', null, 'label', ' for="q"')}
<div class="field">${ICON_SEARCH}<input id="q" type="search" autocomplete="off" spellcheck="false" placeholder="${esc(say(L, 'searchPh'))}" data-kp="searchPh">${w(L, 'go', null, 'button', ' type="submit"')}</div>
<ol class="hits" aria-live="polite"></ol>
${w(L, 'noMatch', null, 'p', ' class="none" hidden')}
</form>`;
}

/**
 * The "Near me" box: hidden until site.js runs. With the visitor's permission the browser gives site.js a
 * position; it never leaves the browser. site.js then loads the feed's 0.5 degree tiles around it (the same
 * public files the app uses) and lists the closest stations.
 */
function nearBox(L, dataBase) {
  return `<div class="near" id="near" hidden data-base="${esc(dataBase)}">
<button type="button" class="btn nearbtn">${ICON_PIN}${w(L, 'nearBtn')}</button>
<p class="nearstatus" aria-live="polite"></p>
<section class="nearres" hidden>${w(L, 'nearH', null, 'h2')}<ol class="list"></ol>${w(L, 'nearPrivacy', null, 'p', ' class="note"')}</section>
</div>`;
}

/** Our own small script (site.js): language, the search box and the "Near me" box. Pages work without it. */
function siteJs() {
  const reg = {};
  for (const [id, cfg] of Object.entries(REGIONS)) reg[id] = { m: cfg.money, f: cfg.fuels, l: cfg.labels, g: cfg.lang };
  return `(function(){
var U=${JSON.stringify(U)},G=${JSON.stringify(FUEL_WORDS)},REG=${JSON.stringify(reg)};
var root=document.documentElement,P=(root.getAttribute('lang')||'en').slice(0,2),L=P;
function fold(s){return String(s).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();}
function e(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fill(s,v){return String(s).replace(/\\{(\\w+)\\}/g,function(m,k){return v&&v[k]!=null?v[k]:m;});}
function word(k,v){var s=(U[L]&&U[L][k]);if(s==null)s=U.en[k];return s==null?'':fill(s,v);}
function each(q,fn){var a=document.querySelectorAll(q);for(var i=0;i<a.length;i++)fn(a[i]);}
function vals(el){var v=el.getAttribute('data-v');try{return v?JSON.parse(v):null;}catch(x){return null;}}
function fuelText(label,kind,lang){var g=lang!==L&&G[L]&&G[L][kind];return g&&fold(g)!==fold(label)?label+' ('+g+')':label;}
/* Language: a choice made in the header wins, then the browser's languages, then English. Search engines
   keep the page's own language so each page is found in the language people search in. */
function pick(){try{var s=localStorage.getItem('pw-lang');if(s&&U[s])return s;}catch(x){}
if(/bot|crawl|spider|slurp|lighthouse/i.test(navigator.userAgent||''))return P;
var ls=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];
for(var i=0;i<ls.length;i++){var b=String(ls[i]).slice(0,2).toLowerCase();if(U[b])return b;}return 'en';}
function apply(l){L=l;
each('[data-k]',function(el){el.textContent=word(el.getAttribute('data-k'),vals(el));});
each('[data-kp]',function(el){el.setAttribute('placeholder',word(el.getAttribute('data-kp')));});
each('[data-kl]',function(el){el.setAttribute('aria-label',word(el.getAttribute('data-kl'),vals(el)));});
each('[data-fuel]',function(el){if(el.getAttribute('data-o')==null)el.setAttribute('data-o',el.textContent);el.textContent=fuelText(el.getAttribute('data-o'),el.getAttribute('data-fuel'),P);});
each('time[data-tz]',function(el){try{el.textContent=new Intl.DateTimeFormat(l,{timeZone:el.getAttribute('data-tz'),day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZoneName:'short'}).format(new Date(el.getAttribute('datetime')));}catch(x){}});
root.setAttribute('lang',l);
each('select.lang',function(s){s.value=l;});}
var start=pick();
each('select.lang',function(s){s.hidden=false;s.value=start;s.addEventListener('change',function(){try{localStorage.setItem('pw-lang',s.value);}catch(x){}apply(s.value);});});
each('.langwrap',function(x){x.hidden=false;});
if(start!==P)apply(start);
var f=document.getElementById('find');
if(f&&window.fetch){f.hidden=false;
var i=f.querySelector('input'),o=f.querySelector('.hits'),m=f.querySelector('.none'),want=f.getAttribute('data-region')||'',data=null,wait=null;
function load(){if(!wait)wait=fetch(f.getAttribute('data-src')).then(function(r){return r.json();}).then(function(d){data=d.map(function(x){return x.concat([fold(x[0])]);});});return wait;}
function show(){var q=fold(i.value.trim());if(!q){o.innerHTML='';m.hidden=true;return;}
load().then(function(){var a=[],b=[];data.forEach(function(x){if(want&&x[1]!==want)return;var k=x[4].indexOf(q);if(k===0)a.push(x);else if(k>0&&q.length>1)b.push(x);});
var r=a.sort(function(x,y){return y[3]-x[3];}).concat(b).slice(0,8);
o.innerHTML=r.map(function(x){return '<li><a href="'+e(x[2])+'"><span>'+e(x[0])+'</span><small>'+e(x[1])+'</small></a></li>';}).join('');m.hidden=r.length>0;});}
i.addEventListener('input',show);i.addEventListener('focus',load);
f.addEventListener('submit',function(ev){ev.preventDefault();var a=o.querySelector('a');if(a)location.href=a.href;});}
var n=document.getElementById('near');
if(!n||!window.fetch||!navigator.geolocation)return;n.hidden=false;
var RADII=[8,20,50,120],base=n.getAttribute('data-base'),btn=n.querySelector('button'),st=n.querySelector('.nearstatus'),res=n.querySelector('.nearres'),list=res.querySelector('ol'),cache={},meta=null,last=null;
function say(k){st.textContent=k?word(k):'';}
function money(p,k){if(k==='cents')return p.toFixed(1)+'c';if(k==='peso')return '$'+(p/100).toFixed(2);return (p/100).toFixed(3).replace('.',',')+' \\u20ac';}
function km(a,b,c,d){var r=Math.PI/180,x=(d-b)*r*Math.cos((a+c)/2*r),y=(c-a)*r;return Math.sqrt(x*x+y*y)*6371;}
function keys(lat,lng,r){var D=meta.tileDeg||0.5,dl=r/111,dg=r/Math.max(1,111.32*Math.cos(lat*Math.PI/180)),k=[];
for(var y=Math.floor((lat-dl)/D);y<=Math.floor((lat+dl)/D);y++)for(var x=Math.floor((lng-dg)/D);x<=Math.floor((lng+dg)/D);x++)k.push(y+'_'+x);return k;}
function tile(k){if(!cache[k])cache[k]=fetch(base+'tiles/'+k+'.json?v='+encodeURIComponent(meta.generatedAt)).then(function(r){return r.ok?r.json():{};}).catch(function(){return {};});return cache[k];}
function find(lat,lng,step){var r=RADII[step],ks=keys(lat,lng,r).filter(function(k){return meta.tiles&&meta.tiles[k];});
return Promise.all(ks.map(tile)).then(function(ts){var seen={},rows=[],cut=Date.parse(meta.generatedAt)-864e6;
ts.forEach(function(tl){(tl.stations||[]).forEach(function(s){if(seen[s.id])return;seen[s.id]=1;
var g=REG[s.region],lic=meta.licences&&meta.licences[s.region];if(!g||!lic||lic.reuse==='no-republish')return;
var d=km(lat,lng,s.lat,s.lng);if(d>r)return;
for(var j=0;j<g.f.length;j++){var pr=s.prices&&s.prices[g.f[j]];if(pr&&pr.p>0&&!(Date.parse(pr.at)<cut)){rows.push({s:s,d:d,k:g.f[j],p:pr.p,g:g});return;}}});});
if(rows.length<5&&step<RADII.length-1)return find(lat,lng,step+1);
return rows.sort(function(a,b){return a.d-b.d;}).slice(0,10);});}
function limit(s){var tg=s.tags||[];return tg.indexOf('members-only')>=0?'membersOnly':tg.indexOf('permit-required')>=0?'permitNeeded':'';}
function draw(rows){var k=rows[0].k,rg=rows[0].s.region,best=null;
rows.forEach(function(x){if(x.k===k&&x.s.region===rg&&!limit(x.s)&&(!best||x.p<best.p))best=x;});
list.innerHTML=rows.map(function(x,i){var s=x.s,name=(s.name||s.brand||'').trim(),lim=limit(s),cheap=x===best&&rows.length>1;
var dist=(x.d<10?x.d.toLocaleString(L,{maximumFractionDigits:1}):Math.round(x.d).toLocaleString(L))+' km';
var addr=[s.address,s.town].filter(function(v){return v&&String(v).trim();}).join(', ');
var label=x.g.l[x.k]||x.k;
return '<li class="st'+(cheap?' first':'')+'"><span class="rk">'+(i+1)+'</span><div class="who"><strong>'+e(name)+'</strong>'+(lim?'<span class="tag" data-k="'+lim+'">'+e(word(lim))+'</span>':'')
+'<span class="addr">'+e(dist)+(addr?' \\u00b7 '+e(addr):'')+'</span>'+(cheap?'<span class="when cheap" data-k="cheapestHere">'+e(word('cheapestHere'))+'</span>':'')+'</div>'
+'<span class="pp">'+e(money(x.p,x.g.m))+'<small data-fuel="'+e(x.k)+'" data-o="'+e(label)+'">'+e(fuelText(label,x.k,x.g.g))+'</small></span>'
+'<a class="dir" href="https://www.google.com/maps/search/?api=1&amp;query='+s.lat+','+s.lng+'" rel="nofollow noopener" data-kl="directionsTo" data-v="'+e(JSON.stringify({s:name}))+'" aria-label="'+e(word('directionsTo',{s:name}))+'"><span class="i-pin"></span></a></li>';}).join('');
res.hidden=false;}
btn.addEventListener('click',function(){btn.disabled=true;say('finding');
navigator.geolocation.getCurrentPosition(function(pos){var lat=pos.coords.latitude,lng=pos.coords.longitude;say('loading');
(meta?Promise.resolve(meta):fetch(base+'meta.json?t='+Math.floor(Date.now()/6e4)).then(function(r){return r.json();}).then(function(x){meta=x;return x;}))
.then(function(){return find(lat,lng,0);}).then(function(rows){if(!rows.length){say('none');res.hidden=true;return;}say('');draw(rows);})
.catch(function(){say('failed');}).then(function(){btn.disabled=false;});},
function(err){say(err&&err.code===1?'denied':'failed');btn.disabled=false;},{enableHighAccuracy:false,timeout:15000,maximumAge:300000});});
})();
`;
}

/** The language picker in the header: hidden until site.js runs. */
function langPicker(L) {
  return `<label class="langwrap" hidden><span class="sr" data-k="language">${esc(say(L, 'language'))}</span><select class="lang" hidden>${Object.entries(LANGS).map(([k, v]) => `<option value="${k}"${k === L ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label>`;
}

function layout({ lang, title, desc, canonical, crumbs, body, modified }) {
  const L = lang;
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
  };
  const label = (c) => (c.k ? w(L, c.k) : esc(c.name));
  const trail = crumbs.length > 1
    ? `<nav class="crumbs" aria-label="Breadcrumb">${crumbs.map((c, i) => (i === crumbs.length - 1 ? `<span aria-current="page">${label(c)}</span>` : `<a href="${esc(c.url)}">${label(c)}</a>`)).join('<span class="sep" aria-hidden="true">›</span>')}</nav>`
    : '';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Pumpwise">
<meta property="article:modified_time" content="${esc(modified)}">
<meta name="theme-color" content="#101820">
<link rel="icon" type="image/png" href="${BASE}/favicon.png">
<link rel="stylesheet" href="${BASE}/style.css">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<script src="${BASE}/site.js" defer></script>
</head>
<body>
<header class="top"><div class="bar">
<a class="brand" href="${SITE_BASE}/">${MARK}<span>Pumpwise</span></a>
<nav class="menu">${langPicker(L)}<a class="home" href="${BASE}/">${w(L, 'home')}</a><a class="findlink" href="${BASE}/#find">${ICON_SEARCH}${w(L, 'find')}</a></nav>
</div></header>
<main>
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

function credit(cfg, licence, now) {
  if (!licence) return '';
  const L = cfg.lang;
  const reuse = licence.reuse === 'cc' || licence.reuse === 'open' ? ` ${w(L, 'reuse')}` : '';
  return `<section class="credit">
<p><strong>${w(L, 'updated')}:</strong> ${timeTag(now, cfg.tz, stamp(now, cfg))}</p>
<p><strong>${w(L, 'source')}:</strong> ${esc(licence.attribution)}. <strong>${w(L, 'licence')}:</strong> <a href="${esc(licence.url)}" rel="nofollow">${esc(licence.licence)}</a>.${reuse}</p>
${w(L, 'disclaimer', null, 'p')}
</section>`;
}

/** The facts of one place that region pages and neighbours also need. */
function summarise(place, cfg, cutoff) {
  const fuels = [];
  for (const kind of cfg.fuels) {
    const rows = ranked(place.stations, kind, cutoff);
    const open = rows.filter((r) => !restriction(r.s));
    if (open.length >= 2) fuels.push({ kind, label: cfg.labels[kind] ?? kind, rows, open, min: open[0], avg: mean(open) });
    if (fuels.length === MAX_FUELS) break;
  }
  return fuels;
}

function stationRow(r, rank, cfg, now) {
  const L = cfg.lang;
  const lim = restriction(r.s);
  const tag = lim ? w(L, lim, null, 'span', ' class="tag"') : '';
  const time = cfg.fixedDaily ? '' : `<span class="when">${w(L, 'reported')} ${esc(when(r.at, cfg, now))}</span>`;
  const name = stationName(r.s);
  return `<li class="st${rank === 1 ? ' first' : ''}"><span class="rk">${rank}</span><div class="who"><strong>${esc(name)}</strong>${tag}<span class="addr">${esc(stationAddress(r.s))}</span>${time}</div><span class="pp">${esc(money(r.p, cfg.money))}</span><a class="dir" href="${mapsUrl(r.s)}" rel="nofollow noopener" aria-label="${esc(say(L, 'directionsTo', { s: name }))}" data-kl="directionsTo" data-v="${esc(JSON.stringify({ s: name }))}"><span class="i-pin"></span></a></li>`;
}

function placePage(id, place, ctx) {
  const { cfg, t, licence, now, regionUrl, nearby } = ctx;
  const L = cfg.lang;
  const fuels = place.fuels;
  const main = fuels[0];
  const url = `${regionUrl}${place.slug}/`;
  const title = t.title(place.name);
  const desc = t.desc(main.label, money(main.min.p, cfg.money), place.name, stationName(main.min.s), place.stations.length);
  const tiles = fuels.map((f) => `<a class="tile" href="#f-${f.kind}"><span class="fuel" data-fuel="${f.kind}">${esc(f.label)}</span><span class="big">${esc(money(f.min.p, cfg.money))}</span>${w(L, 'avgIs', { v: money(f.avg, cfg.money) }, 'span', ' class="sub"')}</a>`).join('\n');
  const leadVars = { f: main.label, p: place.name, price: money(main.min.p, cfg.money), s: stationName(main.min.s) };
  let lead = `<p class="lead">${w(L, 'lead', leadVars)}`;
  const gap = (main.avg - main.min.p) * FILL_LITRES;
  if (main.open.length >= 3 && gap >= 50) lead += ` ${w(L, 'saving', { n: main.open.length, avg: money(main.avg, cfg.money), save: amount(gap, cfg.money) })}`;
  lead += '</p>';
  const best = main.min;
  const bestName = stationName(best.s);
  const bestCard = `<section class="best">
<div class="bestinfo"><span class="kicker">${w(L, 'bestNow')} · ${fuelLabel(main)}</span><strong>${esc(bestName)}</strong><span class="addr">${esc(stationAddress(best.s))}</span></div>
<span class="bestprice">${esc(money(best.p, cfg.money))}</span>
<a class="btn" href="${mapsUrl(best.s)}" rel="nofollow noopener">${ICON_PIN}${w(L, 'directions')}</a>
</section>`;
  const tables = fuels.map((f) => {
    const rows = f.rows.slice(0, MAX_ROWS);
    const top = rows.slice(0, TOP).map((r, i) => stationRow(r, i + 1, cfg, now)).join('\n');
    const rest = rows.slice(TOP);
    const more = rest.length
      ? `<details class="more"><summary>${w(L, 'showAll', { n: f.rows.length })}</summary><ol class="list" start="${TOP + 1}">${rest.map((r, i) => stationRow(r, TOP + i + 1, cfg, now)).join('\n')}</ol>${f.rows.length > MAX_ROWS ? w(L, 'capped', { k: MAX_ROWS }, 'p', ' class="note"') : ''}</details>`
      : '';
    return `<section class="fuel" id="f-${f.kind}">
<h2>${fuelLabel(f)} ${w(L, 'perLitre', null, 'span', ' class="unit"')}</h2>
<ol class="list">
${top}
</ol>
${more}
</section>`;
  }).join('\n');
  let tomorrow = '';
  if (L === 'en' && t.tomorrow) {
    const lines = [];
    for (const f of fuels.slice(0, 3)) {
      const both = f.open.filter((r) => r.s.tomorrow && r.s.tomorrow[f.kind] > 0);
      if (both.length < 2) continue;
      const avgT = both.reduce((a, r) => a + r.s.tomorrow[f.kind], 0) / both.length;
      const avgN = mean(both);
      const d = avgT - avgN;
      const bestT = both.slice().sort((a, b) => a.s.tomorrow[f.kind] - b.s.tomorrow[f.kind])[0];
      const diff = Math.abs(d) < 0.05 ? t.same : d > 0 ? t.up(`${d.toFixed(1)}c`) : t.down(`${(-d).toFixed(1)}c`);
      lines.push(`<li>${esc(t.tomorrowLine(f.label, money(avgT, cfg.money), diff, money(bestT.s.tomorrow[f.kind], cfg.money), stationName(bestT.s)))}</li>`);
    }
    if (lines.length) tomorrow = `<section class="panel"><h2>${esc(t.tomorrow(place.name))}</h2><ul>${lines.join('')}</ul></section>`;
  }
  const chips = nearby.map((n) => `<a class="chip" href="${regionUrl}${n.slug}/">${esc(n.name)}</a>`).join('');
  const near = `<section class="nearby">${nearby.length ? `${w(L, 'nearby', null, 'h2')}<nav class="chips">${chips}</nav>` : ''}<a class="btn ghost" href="${regionUrl}">${w(L, 'allIn', { r: cfg.name })}${ICON_ARROW}</a></section>`;
  const app = cfg.app ? `<p class="app">${w(L, 'app')} <a href="${APP_STORE}">${w(L, 'appLink')}</a>.</p>` : '';
  const fixed = cfg.fixedDaily ? w(L, 'fixed', null, 'p', ' class="note"') : '';
  const body = `<div class="head">
${w(L, 'h1', { p: place.name }, 'h1')}
<p class="meta">${w(L, 'nStations', { n: place.stations.length.toLocaleString(cfg.locale) })} · ${esc(cfg.name)} · ${w(L, 'updated')} ${timeTag(now, cfg.tz, stamp(now, cfg))}</p>
</div>
<nav class="tiles n${fuels.length}">
${tiles}
</nav>
${bestCard}
${lead}
${fixed}
${tomorrow}
${tables}
${app}
${near}
${credit(cfg, licence, now)}`;
  const crumbs = [{ name: say(L, 'home'), k: 'home', url: `${BASE}/` }, { name: cfg.name, url: regionUrl }, { name: place.name, url }];
  return layout({ lang: L, title, desc, canonical: url, crumbs, body, modified: now.toISOString() });
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
  const cheap = places.filter((p) => p.stations.length >= 5 && p.fuels[0].kind === mainKind && p.fuels[0].rows.length >= 4)
    .slice().sort((a, b) => a.fuels[0].avg - b.fuels[0].avg).slice(0, 10);
  const cheapHtml = cheap.length >= 5 ? `<section><h2>${w(L, 'cheapPlaces')} <span class="unit">${fuelLabel(mainFuel)}</span></h2>
<ol class="rank">${cheap.map((p, i) => `<li><a href="${regionUrl}${p.slug}/"><span class="rk">${i + 1}</span><span class="nm">${esc(p.name)}${w(L, 'avgIs', { v: money(p.fuels[0].avg, cfg.money) }, 'small')}</span><span class="pp">${w(L, 'from', null, 'small')}${esc(money(p.fuels[0].min.p, cfg.money))}</span></a></li>`).join('')}</ol></section>` : '';
  const groups = new Map();
  for (const p of places) {
    const l = letterOf(p.name);
    if (!groups.has(l)) groups.set(l, []);
    groups.get(l).push(p);
  }
  const letters = [...groups.keys()].sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)));
  const az = places.length > 24 ? `<nav class="az" aria-label="${esc(say(L, 'jump'))}" data-kl="jump">${letters.map((l) => `<a href="#l-${l === '#' ? 'other' : l}">${l}</a>`).join('')}</nav>` : '';
  const lists = letters.map((l) => `<section class="letter" id="l-${l === '#' ? 'other' : l}"><h3>${l}</h3><ul class="rows">${groups.get(l).map((p) => {
    const f = p.fuels.find((x) => x.kind === mainKind) ?? p.fuels[0];
    return `<li><a href="${regionUrl}${p.slug}/"><span class="nm">${esc(p.name)}<small>${w(L, 'nStations', { n: p.stations.length.toLocaleString(cfg.locale) })}${f.kind === mainKind ? '' : ` · ${fuelLabel(f)}`}</small></span><span class="pp">${w(L, 'from', null, 'small')}${esc(money(f.min.p, cfg.money))}</span></a></li>`;
  }).join('')}</ul></section>`).join('\n');
  const body = `<div class="head">
${w(L, 'regionH1', { r: cfg.name }, 'h1')}
${w(L, 'regionLead', { n: total.toLocaleString(cfg.locale), k: places.length.toLocaleString(cfg.locale) }, 'p', ' class="lead"')}
<p class="meta">${w(L, 'updated')} ${timeTag(now, cfg.tz, stamp(now, cfg))}</p>
</div>
${searchBox(L, cfg.name)}
${nearBox(L, dataBase)}
${cheapHtml}
<section class="all"><h2>${w(L, 'aToZ')} <span class="unit">${fuelLabel(mainFuel)}</span></h2>
${az}
${lists}
</section>
${credit(cfg, licence, now)}`;
  const crumbs = [{ name: say(L, 'home'), k: 'home', url: `${BASE}/` }, { name: cfg.name, url: regionUrl }];
  return layout({ lang: L, title: t.regionTitle(cfg.name), desc: t.regionDesc(cfg.name, total.toLocaleString(cfg.locale), places.length.toLocaleString(cfg.locale)), canonical: regionUrl, crumbs, body, modified: now.toISOString() });
}

function homePage(cards, total, now, dataBase) {
  const L = 'en';
  const t = T.en;
  const popular = cards.flatMap((c) => c.top.map((p) => ({ ...p, url: `${c.regionUrl}${p.slug}/` })))
    .sort((a, b) => b.stations - a.stations).slice(0, 12)
    .map((p) => `<a class="chip" href="${p.url}">${esc(p.name)}</a>`).join('');
  const grid = cards.map((c) => `<li><a class="region" href="${c.regionUrl}">
<span class="code">${CODES[c.id] ?? esc(c.id.toUpperCase())}</span>
<span class="rname"><span lang="${c.cfg.lang}">${esc(c.cfg.name)}</span><small>${w(L, 'nStations', { n: c.stations.toLocaleString('en-US') })} · ${w(L, 'placesCount', { k: c.places.toLocaleString('en-US') })}</small></span>
<span class="board">${c.fuels.slice(0, 2).map((f) => `<span class="line"><span class="fuel" data-fuel="${f.kind}">${esc(f.label)}</span><span class="digits">${esc(money(f.avg, c.cfg.money))}</span></span>`).join('')}</span>
<span class="go">${ICON_ARROW}</span>
</a></li>`).join('\n');
  const when = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' }).format(now).replace(',', ' at');
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
${grid}
</ul></section>
<p class="app">${w(L, 'appHome')} <a href="${APP_STORE}">${w(L, 'appHomeLink')}</a>.</p>
<section class="credit"><p><strong>${w(L, 'updated')}:</strong> ${timeTag(now, 'UTC', when)}</p>${w(L, 'disclaimer', null, 'p')}</section>`;
  return layout({ lang: L, title: t.indexTitle, desc: t.indexDesc(total), canonical: `${BASE}/`, crumbs: [{ name: say(L, 'home'), k: 'home', url: `${BASE}/` }], body, modified: now.toISOString() });
}

export const STYLE = `:root{color-scheme:light dark;--bg:#F4F1EA;--fg:#121B26;--muted:#5A6372;--card:#FFFFFF;--card2:#EBE6DA;--border:#E0D9CB;--link:#9A5B00;--sign:#101820;--amber:#FFB000;--green:#3BE38C;--cheap:#087A43;--cheapbg:#DCF4E6;--shadow:0 1px 2px rgba(18,27,38,.06),0 4px 14px rgba(18,27,38,.06)}
@media (prefers-color-scheme:dark){:root{--bg:#0A0F15;--fg:#F3F0E8;--muted:#A4ACB7;--card:#131B24;--card2:#1A2430;--border:#24303C;--link:#FFC54D;--sign:#05090D;--cheap:#3BE38C;--cheapbg:rgba(59,227,140,.12);--shadow:none}}
*{box-sizing:border-box}
[hidden]{display:none!important}
.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.langwrap{display:inline-flex;align-items:center}
select.lang{min-height:44px;padding:0 28px 0 10px;border-radius:10px;border:1px solid rgba(255,255,255,.22);background:#101820 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' fill='none' stroke='%23F3F0E8' stroke-width='2.2' stroke-linecap='round'/%3E%3C/svg%3E") right 8px center/14px no-repeat;color:#F3F0E8;font:inherit;font-size:15px;font-weight:600;-webkit-appearance:none;appearance:none;cursor:pointer}
select.lang:hover{background-color:#1A2430}
@media (max-width:380px){.brand span{display:none}}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
a{color:var(--link)}
.bar,main{max-width:1040px;margin:0 auto;padding:0 16px}
main{padding-top:8px;padding-bottom:48px}
.top{background:#101820;color:#F3F0E8;position:sticky;top:0;z-index:5;border-bottom:3px solid var(--amber)}
.top .bar{display:flex;align-items:center;justify-content:space-between;min-height:56px;gap:12px}
.brand{display:inline-flex;align-items:center;gap:10px;color:#F3F0E8;text-decoration:none;font-weight:800;font-size:19px;letter-spacing:-.2px;min-height:44px}
.mark{flex:none;border-radius:8px}
.menu{display:flex;align-items:center;gap:4px}
.menu a{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 12px;border-radius:10px;color:#F3F0E8;text-decoration:none;font-weight:600;font-size:15px}
.menu a:hover{background:rgba(255,255,255,.08)}
.menu .findlink{background:var(--amber);color:#101820}
.menu .findlink:hover{background:#FFC54D}
@media (max-width:560px){.menu a:not(.findlink){display:none}.menu .findlink span{display:none}.menu .findlink{width:44px;justify-content:center;padding:0}}
.crumbs{display:flex;flex-wrap:wrap;align-items:center;font-size:14px;color:var(--muted);margin:8px 0 0}
.crumbs a{display:inline-flex;align-items:center;min-height:44px;padding:0 2px;font-weight:600;text-decoration:none}
.crumbs a:hover{text-decoration:underline}
.crumbs .sep{padding:0 6px}
h1{font-size:clamp(28px,6vw,44px);line-height:1.08;letter-spacing:-.6px;margin:6px 0 8px;font-weight:800}
h2{font-size:21px;line-height:1.25;margin:36px 0 12px;font-weight:800;letter-spacing:-.2px}
h2 .unit{font-size:14px;font-weight:500;color:var(--muted);letter-spacing:0;margin-left:6px}
h3{font-size:15px;margin:20px 0 8px;color:var(--muted);letter-spacing:.5px}
.lead{font-size:18px;line-height:1.5;margin:8px 0}
.meta,.note,small{color:var(--muted);font-size:14px}
.meta{margin:4px 0 0}
.head{margin:4px 0 16px}
.tag{display:inline-block;margin-left:8px;padding:1px 8px;border:1px solid var(--border);border-radius:999px;color:var(--muted);font-size:12px;font-weight:600;white-space:nowrap;vertical-align:2px}
/* Price boards: a roadside price sign, the same in light and dark */
.tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:8px 0 16px}
@media (min-width:640px){.tiles.n3{grid-template-columns:repeat(3,minmax(0,1fr))}.tiles.n4{grid-template-columns:repeat(4,minmax(0,1fr))}}
.tiles.n1{grid-template-columns:minmax(0,1fr)}
.tile{background:var(--sign);border-radius:14px;padding:10px 14px 12px;display:flex;flex-direction:column;text-decoration:none;border:1px solid #24303C;border-top:4px solid var(--amber);min-height:44px;transition:transform .12s}
.tile:hover{transform:translateY(-2px)}
.tile .fuel{color:#C9D1DB;font-size:13px;font-weight:600;line-height:1.3}
.tile .big{color:var(--green);font:700 clamp(26px,7vw,36px)/1.1 "Arial Narrow","Roboto Condensed","Helvetica Neue",sans-serif;font-stretch:condensed;letter-spacing:.5px;font-variant-numeric:tabular-nums;white-space:nowrap}
.tile .sub{color:#A4ACB7;font-size:12px}
/* Cheapest right now */
.best{display:grid;grid-template-columns:1fr auto;gap:6px 14px;align-items:center;background:var(--card);border:1px solid var(--border);border-left:6px solid var(--cheap);border-radius:14px;padding:14px 16px;margin:4px 0 12px;box-shadow:var(--shadow)}
.best .kicker{display:block;font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--cheap)}
.best strong{display:block;font-size:19px;line-height:1.25;margin:2px 0}
.best .addr{display:block;color:var(--muted);font-size:14px}
.bestprice{font:800 30px/1 "Arial Narrow","Roboto Condensed",sans-serif;color:var(--cheap);font-variant-numeric:tabular-nums;white-space:nowrap}
.best .btn{grid-column:1/-1;justify-self:start}
.btn{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border-radius:12px;background:var(--amber);color:#101820;font-weight:700;text-decoration:none}
.btn:hover{background:#FFC54D}
.btn.ghost{background:transparent;color:var(--link);border:1px solid var(--border);margin-top:14px}
.btn.ghost:hover{background:var(--card)}
/* Station lists */
.list{list-style:none;margin:0;padding:0;color:var(--fg);background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:var(--shadow)}
.st{display:grid;grid-template-columns:28px minmax(0,1fr) auto 44px;gap:10px;align-items:center;padding:10px 8px 10px 12px;border-bottom:1px solid var(--border)}
.st:last-child{border-bottom:0}
.st .rk{width:26px;height:26px;border-radius:50%;background:var(--card2);color:var(--muted);font-size:13px;font-weight:700;display:grid;place-items:center}
.st.first .rk{background:var(--cheap);color:var(--card)}
.who{min-width:0}
.who strong{font-size:16px}
.who .addr,.who .when{display:block;color:var(--muted);font-size:13.5px;line-height:1.35}
.pp{font-weight:800;font-size:17px;font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right}
.st.first .pp{color:var(--cheap)}
.dir{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;color:var(--link);border:1px solid var(--border)}
.dir:hover{background:var(--card2)}
.i-pin{width:20px;height:20px;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2.5c-3.9 0-7 3-7 6.9 0 5 6 10.1 6.3 10.4.4.3.9.3 1.3 0 .3-.3 6.4-5.4 6.4-10.4 0-3.9-3.1-6.9-7-6.9z' fill='none' stroke='%23000' stroke-width='2'/%3E%3Ccircle cx='12' cy='9.5' r='2.4'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2.5c-3.9 0-7 3-7 6.9 0 5 6 10.1 6.3 10.4.4.3.9.3 1.3 0 .3-.3 6.4-5.4 6.4-10.4 0-3.9-3.1-6.9-7-6.9z' fill='none' stroke='%23000' stroke-width='2'/%3E%3Ccircle cx='12' cy='9.5' r='2.4'/%3E%3C/svg%3E") center/contain no-repeat}
.more{margin-top:10px}
.more summary{cursor:pointer;display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border-radius:12px;border:1px solid var(--border);background:var(--card);font-weight:700;color:var(--link);list-style:none}
.more summary::-webkit-details-marker{display:none}
.more summary::after{content:"";width:8px;height:8px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);margin:-4px 0 0 10px}
.more[open] summary::after{transform:rotate(-135deg);margin-top:4px}
.more .list{margin-top:10px}
/* Search */
.find{margin:14px 0 8px;position:relative}
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
.none{color:var(--muted)}
.near{margin:12px 0 4px}
.nearbtn{border:0;font:inherit;font-weight:700;cursor:pointer}
.nearbtn:disabled{opacity:.7;cursor:progress}
.nearstatus{margin:8px 0 0;color:var(--muted);font-size:15px}
.nearstatus:empty{display:none}
.nearres h2{margin-top:18px}
.nearres .pp small{display:block;font-size:11px;font-weight:600;color:var(--muted);max-width:9em;white-space:normal;line-height:1.2}
.when.cheap{color:var(--cheap);font-weight:700}
.hero .nearstatus,.hero .note{color:#C9D1DB}
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
@media (min-width:1072px){.hero{margin:0;border-radius:22px;padding:36px 32px 28px;margin-top:16px}}
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
.rank a,.rows a{display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 14px;background:var(--card);border:1px solid var(--border);border-radius:12px;text-decoration:none;color:var(--fg)}
.rank a:hover,.rows a:hover{border-color:var(--amber)}
.rank .rk{flex:none;width:28px;height:28px;border-radius:50%;background:var(--sign);color:var(--green);font-weight:800;font-size:14px;display:grid;place-items:center}
.nm{flex:1;min-width:0;font-weight:700;line-height:1.25}
.nm small{display:block;font-weight:500;font-size:13px}
.rank .pp,.rows .pp{display:flex;flex-direction:column;align-items:flex-end;line-height:1.1;font-size:16px}
.rank .pp small,.rows .pp small{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.4px}
.az{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 4px;position:sticky;top:59px;z-index:2;background:var(--bg);padding:6px 0}
.az a{min-width:40px;height:40px;display:grid;place-items:center;border-radius:10px;background:var(--card);border:1px solid var(--border);text-decoration:none;font-weight:700;color:var(--fg)}
.az a:hover{border-color:var(--amber)}
.letter{scroll-margin-top:120px}
.rows{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px}
.fuel{scroll-margin-top:72px}
.panel,.app{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px 16px;margin-top:24px}
.panel h2{margin-top:4px}
.nearby{margin-top:8px}
.credit{margin-top:36px;padding:14px 16px;border-radius:14px;background:var(--card2);color:var(--muted);font-size:14px}
.credit p{margin:4px 0}
.credit a{color:inherit;text-decoration:underline}
footer.site{background:#101820;color:#C9D1DB;margin-top:24px}
footer.site .bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px;padding-top:10px;padding-bottom:10px}
footer.site nav{display:flex;flex-wrap:wrap;gap:4px}
footer.site nav a{display:inline-flex;align-items:center;min-height:44px;padding:0 10px;color:#FFC54D;text-decoration:none;font-weight:600}
footer.site nav a:hover{text-decoration:underline}
a:focus-visible,summary:focus-visible,button:focus-visible{outline:3px solid var(--amber);outline-offset:2px}
@media (max-width:420px){.st{grid-template-columns:24px minmax(0,1fr) auto 44px;gap:8px;padding-left:10px}.pp{font-size:16px}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.tile,.region{transition:none}}
`;

/**
 * Every page of the price site.
 * @param meta the feed's meta.json (regions, licences, generatedAt)
 * @param byRegion region id to its station list (data/v4/regions/<id>.json)
 * @returns files (path under prices/ to text) and counts for the log
 */
export function buildSite(meta, byRegion) {
  const now = new Date(meta.generatedAt);
  const cutoff = now.getTime() - STALE_DAYS * 86400000;
  const files = new Map();
  const urls = [];
  const cards = [];
  const index = [];
  // The feed's own folder (data/v4/...), where the "Near me" box finds the tiles.
  const dataBase = `${SITE_BASE}/data/v${meta.v ?? 4}/`;
  const stats = { regions: 0, places: 0, stations: 0, skipped: [] };
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
    for (const p of places) {
      const nearby = places.filter((q) => q !== p).map((q) => ({ q, d: km(p.lat, p.lng, q.lat, q.lng) })).sort((a, b) => a.d - b.d).slice(0, 8).map((x) => x.q);
      files.set(`${cfg.slug}/${p.slug}/index.html`, placePage(id, p, { ...ctx, nearby }));
      urls.push(`${regionUrl}${p.slug}/`);
      index.push([p.name, cfg.name, `${new URL(regionUrl).pathname}${p.slug}/`, p.stations.length]);
    }
    files.set(`${cfg.slug}/index.html`, regionPage(id, places, stations.length, ctx));
    urls.push(regionUrl);
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
  files.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${esc(u)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  // The search box's list: [name, region, path on this site, stations] per place.
  files.set('places.json', JSON.stringify(index));
  files.set('style.css', STYLE);
  files.set('site.js', siteJs());
  return { files, stats: { ...stats, pages: urls.length } };
}
