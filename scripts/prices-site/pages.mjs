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

const T = {
  en: {
    home: 'Fuel prices', stations: 'stations', today: 'today',
    title: (p, r) => `Fuel prices in ${p} today: cheapest petrol and diesel | Pumpwise`,
    h1: (p) => `Fuel prices in ${p} today`,
    desc: (f, price, p, s, n) => `${f} from ${price} today in ${p} (${s}). Compare ${n} stations with official prices, updated through the day.`,
    lead: (f, price, p, s) => `The cheapest ${f} in ${p} today is ${price} at ${s}.`,
    saving: (n, avg, save) => `The average across ${n} stations is ${avg}, so the cheapest saves about ${save} on a ${FILL_LITRES} litre fill.`,
    cheapest: 'Cheapest', average: 'Average', station: 'Station', address: 'Address', price: 'Price', reported: 'Reported', map: 'Map',
    showing: (k, n) => `The ${k} cheapest of ${n} stations.`, perLitre: 'per litre',
    membersOnly: 'Members only', permitNeeded: 'Entry permit needed',
    nearby: 'Nearby places', allIn: (r) => `All places in ${r}`, places: 'Places', updated: 'Updated', source: 'Source', licence: 'Licence',
    disclaimer: 'Prices are the ones stations report to the official service. The price at the pump is what you pay.',
    reuse: 'The price tables on this page may be reused under the same licence.',
    regionTitle: (r) => `Fuel prices in ${r} today by town and city | Pumpwise`,
    regionH1: (r) => `Fuel prices in ${r} today`,
    regionDesc: (r, n, k) => `Official fuel prices from ${n} stations in ${r}: today's cheapest petrol and diesel in ${k} towns and cities.`,
    regionLead: (n, k) => `${n} stations, ${k} towns and cities. Pick a place to see its cheapest stations.`,
    cheapPlaces: 'Cheapest places today', place: 'Place', from: 'from',
    indexTitle: 'Fuel prices today by town and city: official prices | Pumpwise',
    indexH1: 'Fuel prices today',
    indexDesc: (n) => `Today's cheapest petrol and diesel from ${n} stations, using each government's official prices. Pick a country and a town.`,
    indexLead: (n) => `Official prices from ${n} stations, updated through the day. Pick a place.`,
    app: 'Pumpwise for iPhone shows the cheapest station near you and whether it is worth the drive.', appLink: 'Get Pumpwise on the App Store',
    fixed: 'In Western Australia every station fixes its price for 24 hours from 6am.',
    tomorrow: (p) => `Tomorrow in ${p}`,
    tomorrowLine: (f, avg, diff, min, s) => `${f}: average ${avg} tomorrow, ${diff}. Cheapest tomorrow: ${min} at ${s}.`,
    up: (d) => `up ${d} on today`, down: (d) => `down ${d} on today`, same: 'the same as today',
  },
  es: {
    home: 'Precios de carburantes', stations: 'gasolineras', today: 'hoy',
    title: (p) => `Precio de la gasolina hoy en ${p}: gasolineras más baratas | Pumpwise`,
    h1: (p) => `Precio de la gasolina y el diésel hoy en ${p}`,
    desc: (f, price, p, s, n) => `${f} desde ${price} hoy en ${p} (${s}). Compara ${n} gasolineras con precios oficiales, actualizados durante el día.`,
    lead: (f, price, p, s) => `Hoy en ${p} el precio más bajo de ${f} es ${price}, en ${s}.`,
    saving: (n, avg, save) => `La media de ${n} gasolineras es ${avg}: llenar ${FILL_LITRES} litros al precio más bajo ahorra unos ${save}.`,
    cheapest: 'Más barato', average: 'Media', station: 'Gasolinera', address: 'Dirección', price: 'Precio', reported: 'Comunicado', map: 'Mapa',
    showing: (k, n) => `Las ${k} más baratas de ${n} gasolineras.`, perLitre: 'por litro',
    membersOnly: 'Solo socios', permitNeeded: 'Requiere permiso de acceso',
    nearby: 'Lugares cercanos', allIn: (r) => `Todos los lugares de ${r}`, places: 'Lugares', updated: 'Actualizado', source: 'Fuente', licence: 'Licencia',
    disclaimer: 'Los precios son los que las estaciones comunican al servicio oficial. El precio válido es el del surtidor.',
    reuse: 'Las tablas de precios de esta página pueden reutilizarse con la misma licencia.',
    regionTitle: (r) => `Precio de la gasolina hoy en ${r} por municipio | Pumpwise`,
    regionH1: (r) => `Precio de la gasolina y el diésel hoy en ${r}`,
    regionDesc: (r, n, k) => `Precios oficiales de ${n} gasolineras de ${r}: la gasolina y el diésel más baratos hoy en ${k} municipios y ciudades.`,
    regionLead: (n, k) => `${n} gasolineras, ${k} municipios y ciudades. Elige un lugar para ver sus gasolineras más baratas.`,
    cheapPlaces: 'Lugares más baratos hoy', place: 'Lugar', from: 'desde',
    app: '', appLink: '',
  },
  fr: {
    home: 'Prix des carburants', stations: 'stations', today: "aujourd'hui",
    title: (p) => `Prix des carburants à ${p} aujourd'hui : stations les moins chères | Pumpwise`,
    h1: (p) => `Prix des carburants à ${p} aujourd'hui`,
    desc: (f, price, p, s, n) => `${f} à partir de ${price} aujourd'hui à ${p} (${s}). Comparez ${n} stations avec les prix officiels, mis à jour toute la journée.`,
    lead: (f, price, p, s) => `Aujourd'hui à ${p}, le prix le plus bas (${f}) est de ${price} : ${s}.`,
    saving: (n, avg, save) => `La moyenne de ${n} stations est de ${avg} : un plein de ${FILL_LITRES} litres au prix le plus bas économise environ ${save}.`,
    cheapest: 'Le moins cher', average: 'Moyenne', station: 'Station', address: 'Adresse', price: 'Prix', reported: 'Déclaré', map: 'Carte',
    showing: (k, n) => `Les ${k} moins chères sur ${n} stations.`, perLitre: 'le litre',
    membersOnly: 'Réservé aux adhérents', permitNeeded: 'Permis d’accès requis',
    nearby: 'À proximité', allIn: (r) => `Toutes les communes : ${r}`, places: 'Communes', updated: 'Mis à jour', source: 'Source', licence: 'Licence',
    disclaimer: 'Les prix sont ceux déclarés par les stations au service officiel. Le prix affiché à la pompe fait foi.',
    reuse: 'Les tableaux de prix de cette page peuvent être réutilisés sous la même licence.',
    regionTitle: (r) => `Prix des carburants aujourd'hui en ${r} par commune | Pumpwise`,
    regionH1: (r) => `Prix des carburants aujourd'hui en ${r}`,
    regionDesc: (r, n, k) => `Prix officiels de ${n} stations en ${r} : l'essence et le gazole les moins chers aujourd'hui dans ${k} communes.`,
    regionLead: (n, k) => `${n} stations, ${k} communes. Choisissez une commune pour voir ses stations les moins chères.`,
    cheapPlaces: "Communes les moins chères aujourd'hui", place: 'Commune', from: 'dès',
    app: '', appLink: '',
  },
  pt: {
    home: 'Preços dos combustíveis', stations: 'postos', today: 'hoje',
    title: (p) => `Preços dos combustíveis em ${p} hoje: postos mais baratos | Pumpwise`,
    h1: (p) => `Preços dos combustíveis em ${p} hoje`,
    desc: (f, price, p, s, n) => `${f} desde ${price} hoje em ${p} (${s}). Compare ${n} postos com preços oficiais, atualizados ao longo do dia.`,
    lead: (f, price, p, s) => `Hoje em ${p}, o preço mais baixo de ${f} é ${price}, em ${s}.`,
    saving: (n, avg, save) => `A média de ${n} postos é ${avg}: abastecer ${FILL_LITRES} litros ao preço mais baixo poupa cerca de ${save}.`,
    cheapest: 'Mais barato', average: 'Média', station: 'Posto', address: 'Morada', price: 'Preço', reported: 'Comunicado', map: 'Mapa',
    showing: (k, n) => `Os ${k} mais baratos de ${n} postos.`, perLitre: 'por litro',
    membersOnly: 'Só para sócios', permitNeeded: 'Requer autorização de entrada',
    nearby: 'Locais próximos', allIn: (r) => `Todos os locais em ${r}`, places: 'Locais', updated: 'Atualizado', source: 'Fonte', licence: 'Licença',
    disclaimer: 'Os preços são os comunicados pelos postos ao serviço oficial. O preço válido é o da bomba.',
    reuse: 'As tabelas de preços desta página podem ser reutilizadas com a mesma licença.',
    regionTitle: (r) => `Preços dos combustíveis hoje em ${r} por localidade | Pumpwise`,
    regionH1: (r) => `Preços dos combustíveis hoje em ${r}`,
    regionDesc: (r, n, k) => `Preços oficiais de ${n} postos em ${r}: a gasolina e o gasóleo mais baratos hoje em ${k} localidades.`,
    regionLead: (n, k) => `${n} postos, ${k} localidades. Escolha um local para ver os postos mais baratos.`,
    cheapPlaces: 'Locais mais baratos hoje', place: 'Local', from: 'desde',
    app: '', appLink: '',
  },
};

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

function stationAddress(s) {
  const a = (s.address || '').trim();
  const name = (s.name || '').trim();
  const parts = [];
  if (a && a !== name) parts.push(a);
  const tail = [s.postcode, s.town].filter((x) => x && String(x).trim()).join(' ');
  if (tail) parts.push(tail);
  return parts.join(', ');
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

function layout({ lang, title, desc, canonical, crumbs, body, modified }) {
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
  };
  const trail = crumbs.map((c, i) => (i === crumbs.length - 1 ? `<span>${esc(c.name)}</span>` : `<a href="${esc(c.url)}">${esc(c.name)}</a>`)).join(' › ');
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
<meta property="article:modified_time" content="${esc(modified)}">
<link rel="stylesheet" href="${BASE}/style.css">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body>
<main>
<nav class="crumbs">${trail}</nav>
${body}
</main>
</body>
</html>
`;
}

function credit(cfg, licence, t, now) {
  if (!licence) return '';
  const reuse = licence.reuse === 'cc' || licence.reuse === 'open' ? ` ${esc(t.reuse)}` : '';
  return `<footer>
<p><strong>${esc(t.updated)}:</strong> <time datetime="${esc(now.toISOString())}">${esc(stamp(now, cfg))}</time></p>
<p><strong>${esc(t.source)}:</strong> ${esc(licence.attribution)}. <strong>${esc(t.licence)}:</strong> <a href="${esc(licence.url)}" rel="nofollow">${esc(licence.licence)}</a>.${reuse}</p>
<p>${esc(t.disclaimer)}</p>
<p><a href="${SITE_BASE}/">Pumpwise</a> · <a href="${SITE_BASE}/data-licences.html">Data licences</a> · <a href="${SITE_BASE}/privacy.html">Privacy</a></p>
</footer>`;
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

function placePage(id, place, ctx) {
  const { cfg, t, licence, now, regionUrl, nearby } = ctx;
  const fuels = place.fuels;
  const main = fuels[0];
  const url = `${regionUrl}${place.slug}/`;
  const title = t.title(place.name);
  const desc = t.desc(main.label, money(main.min.p, cfg.money), place.name, stationName(main.min.s), place.stations.length);
  const tiles = fuels.slice(0, 3).map((f) => `<div class="tile"><span class="fuel">${esc(f.label)}</span><span class="big">${esc(money(f.min.p, cfg.money))}</span><span class="sub">${esc(t.cheapest)} · ${esc(t.average)} ${esc(money(f.avg, cfg.money))}</span></div>`).join('\n');
  let lead = `<p class="lead">${esc(t.lead(main.label, money(main.min.p, cfg.money), place.name, stationName(main.min.s)))}`;
  const gap = (main.avg - main.min.p) * FILL_LITRES;
  if (main.open.length >= 3 && gap >= 50) lead += ` ${esc(t.saving(main.open.length, money(main.avg, cfg.money), amount(gap, cfg.money)))}`;
  lead += '</p>';
  const tables = fuels.map((f) => {
    const top = f.rows.slice(0, TOP);
    const body = top.map((r) => `<tr><td><strong>${esc(stationName(r.s))}</strong>${restriction(r.s) ? ` <span class="tag">${esc(t[restriction(r.s)])}</span>` : ''}<br><span class="addr">${esc(stationAddress(r.s))}</span> <a class="map" href="https://www.google.com/maps/search/?api=1&amp;query=${r.s.lat},${r.s.lng}" rel="nofollow noopener">${esc(t.map)}</a></td><td class="num">${esc(money(r.p, cfg.money))}</td>${cfg.fixedDaily ? '' : `<td class="when">${esc(when(r.at, cfg, now))}</td>`}</tr>`).join('\n');
    const note = f.rows.length > TOP ? `<p class="note">${esc(t.showing(TOP, f.rows.length))}</p>` : '';
    return `<section>
<h2>${esc(f.label)} · ${esc(place.name)}</h2>
<table>
<thead><tr><th>${esc(t.station)}</th><th class="num">${esc(t.price)}<br><small>${esc(t.perLitre)}</small></th>${cfg.fixedDaily ? '' : `<th>${esc(t.reported)}</th>`}</tr></thead>
<tbody>
${body}
</tbody>
</table>
${note}
</section>`;
  }).join('\n');
  let tomorrow = '';
  if (t.tomorrow) {
    const lines = [];
    for (const f of fuels.slice(0, 3)) {
      const both = f.open.filter((r) => r.s.tomorrow && r.s.tomorrow[f.kind] > 0);
      if (both.length < 2) continue;
      const avgT = both.reduce((a, r) => a + r.s.tomorrow[f.kind], 0) / both.length;
      const avgN = mean(both);
      const d = avgT - avgN;
      const best = both.slice().sort((a, b) => a.s.tomorrow[f.kind] - b.s.tomorrow[f.kind])[0];
      const diff = Math.abs(d) < 0.05 ? t.same : d > 0 ? t.up(`${d.toFixed(1)}c`) : t.down(`${(-d).toFixed(1)}c`);
      lines.push(`<li>${esc(t.tomorrowLine(f.label, money(avgT, cfg.money), diff, money(best.s.tomorrow[f.kind], cfg.money), stationName(best.s)))}</li>`);
    }
    if (lines.length) tomorrow = `<section><h2>${esc(t.tomorrow(place.name))}</h2><ul>${lines.join('')}</ul></section>`;
  }
  const near = nearby.length ? `<section><h2>${esc(t.nearby)}</h2><p class="links">${nearby.map((n) => `<a href="${regionUrl}${n.slug}/">${esc(n.name)}</a>`).join(' · ')}</p><p><a href="${regionUrl}">${esc(t.allIn(cfg.name))}</a></p></section>` : `<p><a href="${regionUrl}">${esc(t.allIn(cfg.name))}</a></p>`;
  const app = cfg.app && t.app ? `<p class="app">${esc(t.app)} <a href="${APP_STORE}">${esc(t.appLink)}</a>.</p>` : '';
  const fixed = cfg.fixedDaily && t.fixed ? `<p class="note">${esc(t.fixed)}</p>` : '';
  const body = `<h1>${esc(t.h1(place.name))}</h1>
<p class="count">${place.stations.length} ${esc(t.stations)} · ${esc(cfg.name)}</p>
<div class="tiles">
${tiles}
</div>
${lead}
${fixed}
${tomorrow}
${tables}
${app}
${near}
${credit(cfg, licence, t, now)}`;
  const crumbs = [{ name: t.home, url: `${BASE}/` }, { name: cfg.name, url: regionUrl }, { name: place.name, url }];
  return layout({ lang: cfg.lang, title, desc, canonical: url, crumbs, body, modified: now.toISOString() });
}

function regionPage(id, places, total, ctx) {
  const { cfg, t, licence, now, regionUrl } = ctx;
  const mainKind = cfg.fuels[0];
  const rows = places.map((p) => {
    const f = p.fuels.find((x) => x.kind === mainKind) ?? p.fuels[0];
    return `<tr><td><a href="${regionUrl}${p.slug}/">${esc(p.name)}</a></td><td class="num">${p.stations.length}</td><td class="num">${f.kind === mainKind ? '' : `${esc(f.label)} `}${esc(money(f.min.p, cfg.money))}</td></tr>`;
  }).join('\n');
  const cheap = places.filter((p) => p.stations.length >= 5 && p.fuels[0].kind === mainKind && p.fuels[0].rows.length >= 4)
    .slice().sort((a, b) => a.fuels[0].avg - b.fuels[0].avg).slice(0, 10);
  const cheapHtml = cheap.length >= 5 ? `<section><h2>${esc(t.cheapPlaces)} · ${esc(cfg.labels[mainKind])}</h2><ol>${cheap.map((p) => `<li><a href="${regionUrl}${p.slug}/">${esc(p.name)}</a>: ${esc(t.average.toLowerCase())} ${esc(money(p.fuels[0].avg, cfg.money))}, ${esc(t.from)} ${esc(money(p.fuels[0].min.p, cfg.money))}</li>`).join('')}</ol></section>` : '';
  const body = `<h1>${esc(t.regionH1(cfg.name))}</h1>
<p class="lead">${esc(t.regionLead(total.toLocaleString(cfg.locale), places.length.toLocaleString(cfg.locale)))}</p>
${cheapHtml}
<section>
<h2>${esc(t.places)}</h2>
<table>
<thead><tr><th>${esc(t.place)}</th><th class="num">${esc(t.stations)}</th><th class="num">${esc(cfg.labels[mainKind])}<br><small>${esc(t.from)}</small></th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
</section>
${credit(cfg, licence, t, now)}`;
  const crumbs = [{ name: t.home, url: `${BASE}/` }, { name: cfg.name, url: regionUrl }];
  return layout({ lang: cfg.lang, title: t.regionTitle(cfg.name), desc: t.regionDesc(cfg.name, total.toLocaleString(cfg.locale), places.length.toLocaleString(cfg.locale)), canonical: regionUrl, crumbs, body, modified: now.toISOString() });
}

export const STYLE = `:root{color-scheme:light dark;--bg:#F4F1EA;--fg:#121B26;--muted:#5A6372;--card:#FFFFFF;--border:#E0D9CB;--link:#9A5B00;--sign:#101820;--amber:#FFB000;--green:#3BE38C}
@media (prefers-color-scheme:dark){:root{--bg:#0A0F15;--fg:#F3F0E8;--muted:#A4ACB7;--card:#131B24;--border:#24303C;--link:#FFC54D;--sign:#05090D}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
main{max-width:760px;margin:0 auto;padding:24px 16px 56px}
a{color:var(--link)}
h1{font-size:32px;line-height:1.1;letter-spacing:-.4px;margin:12px 0 4px}
h2{font-size:20px;margin:28px 0 8px}
.crumbs,.count,.note,.addr,.when,small{color:var(--muted);font-size:14px}
.lead{font-size:18px}
.tag{display:inline-block;margin-left:6px;padding:1px 8px;border:1px solid var(--border);border-radius:999px;color:var(--muted);font-size:12px;font-weight:600;white-space:nowrap}
.tiles{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0}
.tile{background:var(--sign);border-radius:14px;padding:10px 16px;display:flex;flex-direction:column;min-width:150px}
.tile .fuel{color:#C9D1DB;font-size:13px}
.tile .big{color:var(--green);font:700 34px/1.1 "Arial Narrow","Roboto Condensed",sans-serif;letter-spacing:.5px}
.tile .sub{color:#9AA4B1;font-size:12px}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--border);vertical-align:top}
tr:last-child td{border-bottom:0}
th{font-size:13px;color:var(--muted);font-weight:600}
.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
td.num{font-weight:700}
.map{font-size:13px;white-space:nowrap}
.links{line-height:2}
.app{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-top:24px}
footer{margin-top:32px;border-top:1px solid var(--border);padding-top:12px;color:var(--muted);font-size:14px}
ol{padding-left:22px}
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
    const t = { ...T.en, ...T[cfg.lang], ...(cfg.lang === 'en' ? {} : { tomorrow: null, fixed: '' }) };
    const regionUrl = `${BASE}/${cfg.slug}/`;
    const places = placesFor(id, stations).map((p) => ({ ...p, fuels: summarise(p, cfg, cutoff) })).filter((p) => p.fuels.length);
    if (!places.length) continue;
    const ctx = { cfg, t, licence, now, regionUrl };
    for (const p of places) {
      const nearby = places.filter((q) => q !== p).map((q) => ({ q, d: km(p.lat, p.lng, q.lat, q.lng) })).sort((a, b) => a.d - b.d).slice(0, 8).map((x) => x.q);
      files.set(`${cfg.slug}/${p.slug}/index.html`, placePage(id, p, { ...ctx, nearby }));
      urls.push(`${regionUrl}${p.slug}/`);
    }
    files.set(`${cfg.slug}/index.html`, regionPage(id, places, stations.length, ctx));
    urls.push(regionUrl);
    const all = { name: cfg.name, stations, fuels: [] };
    all.fuels = summarise(all, cfg, cutoff);
    cards.push({ cfg, t, regionUrl, places: places.length, stations: stations.length, fuels: all.fuels });
    stats.regions += 1;
    stats.places += places.length;
    stats.stations += stations.length;
  }
  if (!cards.length) throw new Error('No region produced any price page.');
  const t = T.en;
  const total = stats.stations.toLocaleString('en-US');
  const list = cards.map((c) => `<tr><td><a href="${c.regionUrl}">${esc(c.cfg.name)}</a><br><span class="addr">${c.places} ${esc(c.t.places.toLowerCase())}</span></td><td class="num">${c.stations.toLocaleString('en-US')}</td><td class="num">${c.fuels.slice(0, 2).map((f) => `${esc(f.label)} ${esc(money(f.avg, c.cfg.money))}`).join('<br>')}</td></tr>`).join('\n');
  const body = `<h1>${esc(t.indexH1)}</h1>
<p class="lead">${esc(t.indexLead(total))}</p>
<table>
<thead><tr><th>${esc(t.place)}</th><th class="num">${esc(t.stations)}</th><th class="num">${esc(t.average)}<br><small>${esc(t.perLitre)}</small></th></tr></thead>
<tbody>
${list}
</tbody>
</table>
<p class="app">${esc(t.app)} <a href="${APP_STORE}">${esc(t.appLink)}</a>.</p>
<footer><p><strong>${esc(t.updated)}:</strong> <time datetime="${esc(now.toISOString())}">${esc(now.toISOString().slice(0, 16).replace('T', ' '))} UTC</time></p><p>${esc(t.disclaimer)}</p><p><a href="${SITE_BASE}/">Pumpwise</a> · <a href="${SITE_BASE}/data-licences.html">Data licences</a> · <a href="${SITE_BASE}/privacy.html">Privacy</a></p></footer>`;
  files.set('index.html', layout({ lang: 'en', title: t.indexTitle, desc: t.indexDesc(total), canonical: `${BASE}/`, crumbs: [{ name: t.home, url: `${BASE}/` }], body, modified: now.toISOString() }));
  urls.unshift(`${BASE}/`);
  const lastmod = now.toISOString().slice(0, 10);
  files.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${esc(u)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  files.set('style.css', STYLE);
  return { files, stats: { ...stats, pages: urls.length } };
}
