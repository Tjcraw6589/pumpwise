// The Stats page (prices/stats/): what the stations are charging today, compared across countries, and how
// each country's average has moved since Pumpwise began recording it (17 November 2026).
//
// Everything is worked out from the same station prices as the rest of the site. The one outside figure is
// the European Central Bank's daily exchange rate, used to put every country on one scale (euros a litre).
//
// Charts: bars are plain HTML so their labels stay the page's own text size on a phone; the trend lines are
// an SVG stretched to its box with the labels beside it in HTML. Petrol is always blue and diesel always
// orange (checked for colour blind readers on both the light and the dark page), and every chart has its
// numbers in a table underneath.

/** The fuel standing for "petrol" and for "diesel" in a region: the first of these it sells widely. */
const PETROL = ['regular', 'e10', 'premium', 'super'];
const DIESEL = ['diesel', 'premium-diesel'];
/** Each region's currency, as the European Central Bank names it. */
export const CURRENCY = { wa: 'AUD', nsw: 'AUD', tas: 'AUD', qld: 'AUD', uk: 'GBP', es: 'EUR', fr: 'EUR', pt: 'EUR', si: 'EUR', hr: 'EUR', mx: 'MXN', dk: 'DKK', is: 'ISK' };
const FILL = 50;
const BRAND_MIN = 8;
const TOWN_MIN = 3;
const BANDS = 12;

export const STATS_WORDS = {
  en: {
    statsNav: 'Stats', statsH1: 'Fuel price statistics',
    statsLead: 'What {n} stations in {k} countries and states charge today, and how prices are moving. Worked out from the same prices as the rest of Pumpwise and refreshed through the day.',
    tileStations: 'stations tracked', tilePlaces: 'towns and cities', tileRegions: 'countries and states', tilePrices: 'prices on record today',
    rankH: 'Where fuel costs least today', rankSub: 'average of every station',
    curPick: 'Show prices in', perL: 'per litre', perG: 'per US gallon', petrolWord: 'Petrol', dieselWord: 'Diesel',
    fxNote: 'Prices are converted with the European Central Bank reference rates of {d}. Currencies the bank does not list use open market rates. Each bar is the average of every station with a current price.',
    noFx: 'Exchange rates could not be read just now, so countries are not compared on this visit.',
    showNumbers: 'Show the numbers', thPlace: 'Country or state', thLocal: 'Local price', thEur: 'Chosen currency',
    trendH: 'How prices are moving', trendSub: 'average each day, per litre',
    trendStart: 'Pumpwise began recording daily averages on {d}. Each line grows by one point a day, so the picture gets better every week.',
    sinceYesterday: 'since yesterday', in7: 'in 7 days', in30: 'in 30 days', thDay: 'Day',
    statAvg: 'Average', statCheapest: 'Cheapest station', statDearest: 'Dearest station',
    statSave: 'Saved on a 50 litre fill at the cheapest station instead of an average one',
    dieselMore: 'Diesel costs {v} more than petrol a litre', dieselLess: 'Diesel costs {v} less than petrol a litre',
    distH: 'How many stations charge what', distSub: '{f}, stations in each price band', distBar: '{a} to {b}: {n} stations',
    townsCheap: 'Cheapest towns', townsDear: 'Dearest towns', townsSub: 'average {f}',
    brandsH: 'Average price by brand', brandsSub: '{f}, brands with {n} stations or more',
    jump: 'Jump to a country', regH: 'Country by country',
    methodH: 'How these are worked out',
    methodP: 'Every figure comes from the station prices Pumpwise already shows, counted once per station. Prices that look like mistakes (far below the rest of their area, or far above every other price) are left out. The daily averages are saved once a day and never changed afterwards.',
  },
  es: {
    statsNav: 'Estadísticas', statsH1: 'Estadísticas de precios de carburantes',
    statsLead: 'Lo que cobran hoy {n} gasolineras en {k} países y estados, y cómo se mueven los precios. Calculado con los mismos precios que el resto de Pumpwise y actualizado a lo largo del día.',
    tileStations: 'gasolineras seguidas', tilePlaces: 'pueblos y ciudades', tileRegions: 'países y estados', tilePrices: 'precios registrados hoy',
    rankH: 'Dónde cuesta menos el carburante hoy', rankSub: 'media de todas las gasolineras',
    curPick: 'Ver precios en', perL: 'por litro', perG: 'por galón de EE. UU.', petrolWord: 'Gasolina', dieselWord: 'Diésel',
    fxNote: 'Los precios se convierten con los tipos de referencia del Banco Central Europeo del {d}. Las monedas que el banco no publica usan tipos de mercado. Cada barra es la media de todas las gasolineras con precio vigente.',
    noFx: 'Ahora mismo no se han podido leer los tipos de cambio, así que en esta visita no se comparan los países.',
    showNumbers: 'Ver las cifras', thPlace: 'País o estado', thLocal: 'Precio local', thEur: 'Moneda elegida',
    trendH: 'Cómo se mueven los precios', trendSub: 'media de cada día, por litro',
    trendStart: 'Pumpwise empezó a guardar las medias diarias el {d}. Cada línea gana un punto al día, así que la imagen mejora cada semana.',
    sinceYesterday: 'desde ayer', in7: 'en 7 días', in30: 'en 30 días', thDay: 'Día',
    statAvg: 'Media', statCheapest: 'Gasolinera más barata', statDearest: 'Gasolinera más cara',
    statSave: 'Ahorro al llenar 50 litros en la más barata en lugar de una de precio medio',
    dieselMore: 'El diésel cuesta {v} más que la gasolina por litro', dieselLess: 'El diésel cuesta {v} menos que la gasolina por litro',
    distH: 'Cuántas gasolineras cobran cada precio', distSub: '{f}, gasolineras en cada tramo de precio', distBar: 'De {a} a {b}: {n} gasolineras',
    townsCheap: 'Lugares más baratos', townsDear: 'Lugares más caros', townsSub: 'media de {f}',
    brandsH: 'Precio medio por marca', brandsSub: '{f}, marcas con {n} gasolineras o más',
    jump: 'Ir a un país', regH: 'País por país',
    methodH: 'Cómo se calculan',
    methodP: 'Todas las cifras salen de los precios de gasolinera que Pumpwise ya muestra, contando cada gasolinera una vez. Los precios que parecen errores (muy por debajo del resto de su zona, o muy por encima de todos los demás) no se cuentan. Las medias diarias se guardan una vez al día y no se cambian después.',
  },
  fr: {
    statsNav: 'Statistiques', statsH1: 'Statistiques des prix des carburants',
    statsLead: 'Ce que facturent aujourd’hui {n} stations dans {k} pays et États, et comment les prix évoluent. Calculé avec les mêmes prix que le reste de Pumpwise et actualisé au fil de la journée.',
    tileStations: 'stations suivies', tilePlaces: 'villes et communes', tileRegions: 'pays et États', tilePrices: 'prix relevés aujourd’hui',
    rankH: 'Où le carburant coûte le moins aujourd’hui', rankSub: 'moyenne de toutes les stations',
    curPick: 'Afficher les prix en', perL: 'par litre', perG: 'par gallon US', petrolWord: 'Essence', dieselWord: 'Gazole',
    fxNote: 'Les prix sont convertis avec les taux de référence de la Banque centrale européenne du {d}. Les devises que la banque ne publie pas utilisent des taux de marché. Chaque barre est la moyenne de toutes les stations ayant un prix en vigueur.',
    noFx: 'Les taux de change n’ont pas pu être lus pour l’instant ; les pays ne sont donc pas comparés lors de cette visite.',
    showNumbers: 'Voir les chiffres', thPlace: 'Pays ou État', thLocal: 'Prix local', thEur: 'Devise choisie',
    trendH: 'Comment les prix évoluent', trendSub: 'moyenne de chaque jour, par litre',
    trendStart: 'Pumpwise a commencé à enregistrer les moyennes quotidiennes le {d}. Chaque courbe gagne un point par jour ; l’image s’affine donc chaque semaine.',
    sinceYesterday: 'depuis hier', in7: 'en 7 jours', in30: 'en 30 jours', thDay: 'Jour',
    statAvg: 'Moyenne', statCheapest: 'Station la moins chère', statDearest: 'Station la plus chère',
    statSave: 'Économie sur un plein de 50 litres à la station la moins chère plutôt qu’à une station au prix moyen',
    dieselMore: 'Le gazole coûte {v} de plus que l’essence par litre', dieselLess: 'Le gazole coûte {v} de moins que l’essence par litre',
    distH: 'Combien de stations pratiquent quel prix', distSub: '{f}, stations par tranche de prix', distBar: 'De {a} à {b} : {n} stations',
    townsCheap: 'Communes les moins chères', townsDear: 'Communes les plus chères', townsSub: 'moyenne {f}',
    brandsH: 'Prix moyen par enseigne', brandsSub: '{f}, enseignes d’au moins {n} stations',
    jump: 'Aller à un pays', regH: 'Pays par pays',
    methodH: 'Comment c’est calculé',
    methodP: 'Tous les chiffres viennent des prix en station que Pumpwise affiche déjà, chaque station comptant une fois. Les prix qui ressemblent à des erreurs (très en dessous du reste de leur secteur, ou très au-dessus de tous les autres) sont écartés. Les moyennes quotidiennes sont enregistrées une fois par jour et ne changent plus ensuite.',
  },
  pt: {
    statsNav: 'Estatísticas', statsH1: 'Estatísticas dos preços dos combustíveis',
    statsLead: 'O que cobram hoje {n} postos em {k} países e estados, e como os preços estão a evoluir. Calculado com os mesmos preços do resto do Pumpwise e atualizado ao longo do dia.',
    tileStations: 'postos acompanhados', tilePlaces: 'vilas e cidades', tileRegions: 'países e estados', tilePrices: 'preços registados hoje',
    rankH: 'Onde o combustível custa menos hoje', rankSub: 'média de todos os postos',
    curPick: 'Ver preços em', perL: 'por litro', perG: 'por galão dos EUA', petrolWord: 'Gasolina', dieselWord: 'Gasóleo',
    fxNote: 'Os preços são convertidos com as taxas de referência do Banco Central Europeu de {d}. As moedas que o banco não publica usam taxas de mercado. Cada barra é a média de todos os postos com preço em vigor.',
    noFx: 'Não foi possível ler as taxas de câmbio neste momento, por isso os países não são comparados nesta visita.',
    showNumbers: 'Ver os números', thPlace: 'País ou estado', thLocal: 'Preço local', thEur: 'Moeda escolhida',
    trendH: 'Como os preços estão a evoluir', trendSub: 'média de cada dia, por litro',
    trendStart: 'O Pumpwise começou a guardar as médias diárias em {d}. Cada linha ganha um ponto por dia, por isso a imagem melhora todas as semanas.',
    sinceYesterday: 'desde ontem', in7: 'em 7 dias', in30: 'em 30 dias', thDay: 'Dia',
    statAvg: 'Média', statCheapest: 'Posto mais barato', statDearest: 'Posto mais caro',
    statSave: 'Poupança ao abastecer 50 litros no posto mais barato em vez de um de preço médio',
    dieselMore: 'O gasóleo custa mais {v} por litro do que a gasolina', dieselLess: 'O gasóleo custa menos {v} por litro do que a gasolina',
    distH: 'Quantos postos cobram cada preço', distSub: '{f}, postos em cada intervalo de preço', distBar: 'De {a} a {b}: {n} postos',
    townsCheap: 'Locais mais baratos', townsDear: 'Locais mais caros', townsSub: 'média de {f}',
    brandsH: 'Preço médio por marca', brandsSub: '{f}, marcas com {n} postos ou mais',
    jump: 'Ir para um país', regH: 'País a país',
    methodH: 'Como são calculados',
    methodP: 'Todos os números vêm dos preços dos postos que o Pumpwise já mostra, contando cada posto uma vez. Os preços que parecem erros (muito abaixo do resto da sua zona, ou muito acima de todos os outros) ficam de fora. As médias diárias são guardadas uma vez por dia e não mudam depois.',
  },
};

export const STATS_STYLE = `
/* Stats page. Petrol is blue and diesel orange everywhere; text never takes a series colour. */
.stats{--s1:#2a78d6;--s2:#eb6834}
@media (prefers-color-scheme:dark){.stats{--s1:#3987e5;--s2:#d95926}}
.stats .tiles{list-style:none;margin:16px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.stats .tiles li{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px 14px;box-shadow:var(--shadow)}
.stats .tiles b{display:block;font-size:26px;line-height:1.15;font-weight:800;letter-spacing:-.3px}
.stats .tiles span{color:var(--muted);font-size:14px}
.stats .jump{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 0}
.stats .jump a{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 12px;border-radius:999px;border:1px solid var(--border);background:var(--card);color:var(--fg);font-weight:600;font-size:14px;text-decoration:none}
.stats .jump a:hover{border-color:var(--amber)}
.stats .panel{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;box-shadow:var(--shadow);min-width:0}
.stats .panel h3{margin:0 0 2px;font-size:16px;line-height:1.3}
.stats .panel .sub{margin:0 0 10px;color:var(--muted);font-size:13px}
.stats .pair{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))}
.stats .key{display:flex;flex-wrap:wrap;gap:4px 14px;margin:0 0 8px;font-size:13px;color:var(--muted)}
.stats .key i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}
.stats .key .k1 i,.stats .hb.k1 .hb-b,.stats .hist.k1 i,.stats .dot.k1{background:var(--s1)}
.stats .key .k2 i,.stats .hb.k2 .hb-b,.stats .hist.k2 i,.stats .dot.k2{background:var(--s2)}
.stats .hbars{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.stats .hb{display:grid;grid-template-columns:minmax(92px,34%) minmax(0,1fr) auto;gap:8px;align-items:center;font-size:14px}
.stats .hb-l{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--fg);text-decoration:none}
a.hb-l{color:var(--link);text-decoration:underline;text-underline-offset:2px}
.stats .hb-t{height:16px;display:block}
.stats .hb-b{display:block;height:100%;min-width:2px;border-radius:0 4px 4px 0}
.stats .hb:hover .hb-b{filter:brightness(1.12)}
.stats .hb-v{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
.stats .hist{display:flex;align-items:flex-end;gap:2px;height:120px;border-bottom:1px solid var(--border)}
.stats .hist i{flex:1;min-height:1px;border-radius:4px 4px 0 0}
.stats .hist i:hover{filter:brightness(1.12)}
.stats .axis{display:flex;justify-content:space-between;margin-top:4px;color:var(--muted);font-size:12px;font-variant-numeric:tabular-nums}
.stats .line{position:relative;height:150px;margin-right:64px;border-bottom:1px solid var(--border)}
.stats .line svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.stats .line .grid{stroke:var(--border);stroke-width:1;vector-effect:non-scaling-stroke}
.stats .line path{fill:none;stroke-width:2;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round}
.stats .line .p1{stroke:var(--s1)}
.stats .line .p2{stroke:var(--s2)}
.stats .dot{position:absolute;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;box-shadow:0 0 0 2px var(--card)}
.stats .end{position:absolute;left:100%;margin-left:8px;transform:translateY(-50%);font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.stats .yl{position:absolute;left:0;font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums;background:var(--card);padding:0 3px 0 0}
.stats .moves{display:flex;flex-wrap:wrap;gap:4px 12px;margin:8px 0 0;font-size:13px;color:var(--muted)}
.stats .moves b{color:var(--fg);font-variant-numeric:tabular-nums}
.stats .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:0 0 12px;padding:0;list-style:none}
.stats .facts li{background:var(--card2);border-radius:10px;padding:8px 10px;font-size:13px;color:var(--muted)}
.stats .facts b{display:block;color:var(--fg);font-size:18px;line-height:1.25;font-weight:800;font-variant-numeric:tabular-nums}
.stats .rstat{margin-top:28px;scroll-margin-top:76px}
.stats .rstat>h2{display:flex;align-items:center;gap:8px}
.stats .rstat>h2 a{font-size:14px;font-weight:600;margin-left:auto}
.stats .nums{margin-top:8px}
.stats .nums summary{cursor:pointer;color:var(--link);font-size:13px;font-weight:600;min-height:32px;display:inline-flex;align-items:center}
.stats .nums table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}
.stats .nums th,.stats .nums td{text-align:right;padding:4px 6px;border-bottom:1px solid var(--border)}
.stats .nums th:first-child,.stats .nums td:first-child{text-align:left}
.stats .note{color:var(--muted);font-size:13px}
.stats.js .jump,.stats.js .rstat,.stats:not(.js) .regpick{display:none}
.stats.js .rstat.on{display:block}
.stats.js .rstat{margin-top:8px}
.stats .curbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;margin:0 0 12px;font-size:14px;font-weight:700}
.stats .curbar select{min-height:44px;max-width:100%;padding:0 12px;border-radius:12px;border:1px solid var(--border);background:var(--card);color:var(--fg);font:inherit;font-size:15px;font-weight:600}
`;

const mean = (list) => list.reduce((t, v) => t + v, 0) / list.length;
const pick = (fuels, kinds) => kinds.map((k) => fuels.find((f) => f.kind === k)).find(Boolean) ?? null;

/** One fuel across a whole region, from the summary the price pages already make. */
function fuelFigures(f) {
  if (!f) return null;
  const good = f.good.filter((r) => !r.doubt);
  const kept = good.length >= 2 ? good : f.good;
  // A price far above everything else (450.0c in a state averaging 216c) is a placeholder a station typed
  // in, not a price anyone pays: anything over one and a half times the middle price is left out.
  const mid = kept.map((r) => r.p).sort((x, y) => x - y)[Math.floor(kept.length / 2)];
  const sane = kept.filter((r) => r.p <= mid * 1.5);
  const use = sane.length >= 2 ? sane : kept;
  const ps = use.map((r) => r.p);
  return { kind: f.kind, label: f.label, avg: mean(ps), min: Math.min(...ps), max: Math.max(...ps), n: ps.length, rows: use };
}

/** The figures of one region for today: what the page draws and what the history keeps. */
export function regionFigures(card) {
  return { petrol: fuelFigures(pick(card.fuels, PETROL)), diesel: fuelFigures(pick(card.fuels, DIESEL)) };
}

/** Today's line of the history: per region, each fuel's [average, cheapest, dearest, stations]. */
export function statsDay(cards, now, fx) {
  const r = {};
  for (const c of cards) {
    const f = regionFigures(c);
    const row = {};
    for (const [key, v] of [['p', f.petrol], ['d', f.diesel]]) if (v) row[key] = [Math.round(v.avg * 10) / 10, v.min, v.max, v.n];
    if (Object.keys(row).length) r[c.id] = row;
  }
  return { d: now.toISOString().slice(0, 10), r, ...(fx ? { fx } : {}) };
}

/** History with today's line in place of any earlier line for the same day, oldest first. */
export function withToday(days, today) {
  return [...(days ?? []).filter((x) => x && x.d && x.d !== today.d), today].sort((a, b) => (a.d < b.d ? -1 : 1));
}

/** The Stats page. `h` carries the site's own helpers (words, layout, money) so nothing is written twice. */
export function statsPage({ cards, now, days, fx, fxDate, totals, h }) {
  const { w, say, esc, money, flagOf, FLAG_COUNTRY, layout, BASE } = h;
  const L = 'en';
  const flag = (id) => (FLAG_COUNTRY[id] ? `<span class="flag" aria-hidden="true">${flagOf(FLAG_COUNTRY[id])}</span>` : '');
  const name = (id) => w(L, `rn_${id}`);
  const figures = new Map(cards.map((c) => [c.id, regionFigures(c)]));
  const rate = (id) => (CURRENCY[id] === 'EUR' ? 1 : fx && fx[CURRENCY[id]] > 0 ? fx[CURRENCY[id]] : 0);
  const euro = (v) => `${(v / 100).toFixed(3).replace('.', ',')} €`;
  const dayLabel = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const numbers = (head, rows) =>
    `<details class="nums"><summary>${w(L, 'showNumbers')}</summary><table><thead><tr>${head.map((x) => `<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((x, i) => (i ? `<td>${x}</td>` : `<th scope="row">${x}</th>`)).join('')}</tr>`).join('')}</tbody></table></details>`;

  // Countries side by side, in euros a litre. Bars start at zero, cheapest first.
  const rank = (key, cls, word) => {
    const rows = cards
      .map((c) => ({ c, f: figures.get(c.id)[key], x: rate(c.id) }))
      .filter((r) => r.f && r.x > 0)
      .map((r) => ({ ...r, eur: r.f.avg / r.x }))
      .sort((a, b) => a.eur - b.eur);
    if (rows.length < 2) return '';
    const top = Math.max(...rows.map((r) => r.eur));
    return `<div class="panel"><h3>${w(L, word)}</h3><p class="sub">${w(L, 'rankSub')}</p>
<ol class="hbars">${rows.map((r) => `<li class="hb ${cls}" title="${esc(`${r.f.label}: ${money(r.f.avg, r.c.cfg.money)}`)}"><a class="hb-l" href="#s-${r.c.id}">${flag(r.c.id)} ${name(r.c.id)}</a><span class="hb-t"><span class="hb-b" style="width:${((r.eur / top) * 100).toFixed(1)}%"></span></span><span class="hb-v cv" data-e="${r.eur.toFixed(2)}">${esc(euro(r.eur))}</span></li>`).join('')}</ol>
${numbers([w(L, 'thPlace'), w(L, 'thLocal'), w(L, 'thEur')], rows.map((r) => [`${flag(r.c.id)} ${name(r.c.id)}`, esc(money(r.f.avg, r.c.cfg.money)), `<span class="cv" data-e="${r.eur.toFixed(2)}">${esc(euro(r.eur))}</span>`]))}</div>`;
  };
  const ranks = [rank('petrol', 'k1', 'petrolWord'), rank('diesel', 'k2', 'dieselWord')].filter(Boolean);
  const rankBlock = ranks.length
    ? `<section id="rank" data-fx="${esc(JSON.stringify({ EUR: 1, ...(fx ?? {}) }))}"><h2>${w(L, 'rankH')}</h2>
<p class="curbar"><label for="cursel" data-k="curPick">${esc(say(L, 'curPick'))}</label><select id="cursel">${['EUR', ...Object.keys(fx ?? {}).sort()].map((c) => `<option value="${c}">${c}</option>`).join('')}</select><select id="unitsel" aria-labelledby="cursel"><option value="l" data-k="perL">${esc(say(L, 'perL'))}</option><option value="g" data-k="perG">${esc(say(L, 'perG'))}</option></select></p>
<div class="pair">${ranks.join('\n')}</div>${w(L, 'fxNote', { d: fxDate ? dayLabel(fxDate) : '' }, 'p', ' class="note"')}</section>`
    : `<section><h2>${w(L, 'rankH')}</h2>${w(L, 'noFx', null, 'p', ' class="note"')}</section>`;

  // One region's daily averages as lines: petrol and diesel share one axis (same money, same litre).
  const trend = (c) => {
    const series = [['p', 'k1', 'p1', 'petrolWord'], ['d', 'k2', 'p2', 'dieselWord']]
      .map(([key, dotCls, pathCls, word]) => ({ dotCls, pathCls, word, pts: days.map((x, i) => ({ i, d: x.d, v: x.r && x.r[c.id] && x.r[c.id][key] ? x.r[c.id][key][0] : null })).filter((p) => p.v !== null) }))
      .filter((s) => s.pts.length);
    if (!series.length) return '';
    const all = series.flatMap((s) => s.pts.map((p) => p.v));
    let lo = Math.min(...all);
    let hi = Math.max(...all);
    const pad = Math.max((hi - lo) * 0.15, hi * 0.01);
    lo -= pad;
    hi += pad;
    const span = Math.max(days.length - 1, 1);
    const X = (i) => (days.length === 1 ? 50 : (i / span) * 100);
    const Y = (v) => 100 - ((v - lo) / (hi - lo)) * 100;
    const few = days.length <= 21;
    const ends = series.map((s) => ({ s, y: Y(s.pts[s.pts.length - 1].v) })).sort((a, b) => a.y - b.y);
    if (ends.length === 2 && ends[1].y - ends[0].y < 12) {
      const mid = (ends[0].y + ends[1].y) / 2;
      ends[0].y = mid - 6;
      ends[1].y = mid + 6;
    }
    const moves = series.map((s) => {
      const last = s.pts[s.pts.length - 1];
      const back = (n) => s.pts.filter((p) => p.d <= new Date(Date.parse(`${last.d}T12:00:00Z`) - n * 86400000).toISOString().slice(0, 10)).pop();
      const diff = (p) => (p ? `${last.v - p.v >= 0 ? '+' : '−'}${esc(money(Math.abs(Math.round((last.v - p.v) * 10) / 10), c.cfg.money))}` : '');
      const parts = [[back(1), 'sinceYesterday'], [back(7), 'in7'], [back(30), 'in30']].filter(([p]) => p).map(([p, k]) => `<span><b>${diff(p)}</b> ${w(L, k)}</span>`);
      return parts.length ? `<span>${w(L, s.word)}:</span> ${parts.join(' ')}` : '';
    }).filter(Boolean);
    const table = days.slice(-30).reverse().map((x) => [esc(dayLabel(x.d)), ...series.map((s) => {
      const p = s.pts.find((q) => q.d === x.d);
      return p ? esc(money(p.v, c.cfg.money)) : '';
    })]);
    return `<div class="panel"><h3>${w(L, 'trendH')}</h3><p class="sub">${w(L, 'trendSub')}</p>
<p class="key">${series.map((s) => `<span class="${s.dotCls}"><i></i>${w(L, s.word)}</span>`).join('')}</p>
<div class="line" role="img" aria-label="${esc(say(L, 'trendH'))}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line class="grid" x1="0" x2="100" y1="50" y2="50"/><line class="grid" x1="0" x2="100" y1="0" y2="0"/>${series.map((s) => (s.pts.length > 1 ? `<path class="${s.pathCls}" d="M${s.pts.map((p) => `${X(p.i).toFixed(2)} ${Y(p.v).toFixed(2)}`).join('L')}"/>` : '')).join('')}</svg>
${series.map((s) => (few ? s.pts : s.pts.slice(-1)).map((p) => `<span class="dot ${s.dotCls}" style="left:${X(p.i).toFixed(2)}%;top:${Y(p.v).toFixed(2)}%" title="${esc(`${dayLabel(p.d)}: ${money(p.v, c.cfg.money)}`)}"></span>`).join('')).join('')}
${ends.map((e) => `<span class="end" style="top:${e.y.toFixed(1)}%">${esc(money(e.s.pts[e.s.pts.length - 1].v, c.cfg.money))}</span>`).join('')}
<span class="yl" style="top:-7px">${esc(money(Math.round(hi * 10) / 10, c.cfg.money))}</span><span class="yl" style="bottom:2px">${esc(money(Math.round(lo * 10) / 10, c.cfg.money))}</span></div>
<div class="axis"><span>${esc(dayLabel(days[0].d))}</span>${days.length > 1 ? `<span>${esc(dayLabel(days[days.length - 1].d))}</span>` : ''}</div>
${moves.length ? `<p class="moves">${moves.join(' ')}</p>` : ''}
${numbers([w(L, 'thDay'), ...series.map((s) => w(L, s.word))], table)}</div>`;
  };

  // How many stations sit in each price band (the middle 98%, so one odd price cannot flatten the picture).
  const bands = (c, f) => {
    const ps = f.rows.map((r) => r.p).sort((a, b) => a - b);
    if (ps.length < 20) return '';
    const lo = ps[Math.floor(ps.length * 0.01)];
    const hi = ps[Math.ceil(ps.length * 0.99) - 1];
    if (!(hi > lo)) return '';
    const step = (hi - lo) / BANDS;
    const counts = new Array(BANDS).fill(0);
    for (const p of ps) if (p >= lo && p <= hi) counts[Math.min(BANDS - 1, Math.floor((p - lo) / step))] += 1;
    const top = Math.max(...counts);
    const m = (v) => money(Math.round(v * 10) / 10, c.cfg.money);
    return `<div class="panel"><h3>${w(L, 'distH')}</h3>${w(L, 'distSub', { f: f.label }, 'p', ' class="sub"')}
<div class="hist k1" role="img" aria-label="${esc(say(L, 'distH'))}">${counts.map((n, i) => `<i style="height:${((n / top) * 100).toFixed(1)}%" title="${esc(say(L, 'distBar', { a: m(lo + i * step), b: m(lo + (i + 1) * step), n: n.toLocaleString('en-US') }))}"></i>`).join('')}</div>
<div class="axis"><span>${esc(m(lo))}</span><span>${esc(m((lo + hi) / 2))}</span><span>${esc(m(hi))}</span></div>
${numbers([w(L, 'thLocal'), w(L, 'tileStations')], counts.map((n, i) => [esc(`${m(lo + i * step)} – ${m(lo + (i + 1) * step)}`), n.toLocaleString('en-US')]))}</div>`;
  };

  const barList = (rows, cls, moneyKind) => {
    const top = Math.max(...rows.map((r) => r.v));
    return `<ol class="hbars">${rows.map((r) => `<li class="hb ${cls}"${r.title ? ` title="${esc(r.title)}"` : ''}>${r.href ? `<a class="hb-l" href="${esc(r.href)}">${esc(r.name)}</a>` : `<span class="hb-l">${esc(r.name)}</span>`}<span class="hb-t"><span class="hb-b" style="width:${((r.v / top) * 100).toFixed(1)}%"></span></span><span class="hb-v">${esc(money(Math.round(r.v * 10) / 10, moneyKind))}</span></li>`).join('')}</ol>`;
  };

  const towns = (c, f) => {
    const rows = c.placeList
      .map((p) => ({ p, f: p.fuels.find((x) => x.kind === f.kind) }))
      .filter((x) => x.f && x.f.good.length >= TOWN_MIN)
      .map((x) => ({ name: x.p.name, href: `${c.regionUrl}${x.p.slug}/`, v: x.f.avg }))
      .sort((a, b) => a.v - b.v);
    if (rows.length < 10) return '';
    const panel = (key, list) => `<div class="panel"><h3>${w(L, key)}</h3>${w(L, 'townsSub', { f: f.label }, 'p', ' class="sub"')}${barList(list, 'k1', c.cfg.money)}</div>`;
    return panel('townsCheap', rows.slice(0, 5)) + panel('townsDear', rows.slice(-5).reverse());
  };

  const brands = (c, f) => {
    const by = new Map();
    for (const r of f.rows) {
      const b = (r.s.brand || '').trim();
      if (b) by.set(b, [...(by.get(b) ?? []), r.p]);
    }
    const rows = [...by].filter(([, ps]) => ps.length >= BRAND_MIN).map(([b, ps]) => ({ name: b, v: mean(ps), title: `${ps.length.toLocaleString('en-US')} ${say(L, 'stations')}` })).sort((a, b) => a.v - b.v);
    if (rows.length < 3) return '';
    return `<div class="panel"><h3>${w(L, 'brandsH')}</h3>${w(L, 'brandsSub', { f: f.label, n: BRAND_MIN }, 'p', ' class="sub"')}${barList(rows.slice(0, 10), 'k1', c.cfg.money)}</div>`;
  };

  const region = (c) => {
    const f = figures.get(c.id);
    const main = f.petrol ?? f.diesel;
    if (!main) return '';
    const facts = [];
    for (const v of [f.petrol, f.diesel].filter(Boolean)) facts.push(`<li><b>${esc(money(Math.round(v.avg * 10) / 10, c.cfg.money))}</b>${w(L, 'statAvg')} ${esc(v.label)}</li>`);
    facts.push(`<li><b>${esc(money(main.min, c.cfg.money))}</b>${w(L, 'statCheapest')}</li>`, `<li><b>${esc(money(main.max, c.cfg.money))}</b>${w(L, 'statDearest')}</li>`);
    const saved = ((main.avg - main.min) * FILL) / 100;
    const unit = c.cfg.money === 'cents' || c.cfg.money === 'peso' ? `$${saved.toFixed(2)}` : c.cfg.money === 'isk' ? `${Math.round(saved)} kr.` : c.cfg.money === 'dkk' ? `${saved.toFixed(2).replace('.', ',')} kr.` : `${saved.toFixed(2).replace('.', ',')} €`;
    facts.push(`<li><b>${esc(unit)}</b>${w(L, 'statSave')}</li>`);
    const gap = f.petrol && f.diesel ? f.diesel.avg - f.petrol.avg : null;
    const gapLine = gap === null || Math.abs(gap) < 0.05 ? '' : w(L, gap > 0 ? 'dieselMore' : 'dieselLess', { v: money(Math.round(Math.abs(gap) * 10) / 10, c.cfg.money) }, 'p', ' class="note"');
    const blocks = [trend(c), bands(c, main), towns(c, main), brands(c, main)].filter(Boolean);
    return `<section class="rstat" id="s-${c.id}"><h2>${flag(c.id)} ${name(c.id)} <a href="${c.regionUrl}">${w(L, 'nStations', { n: c.stations.toLocaleString('en-US') })}</a></h2>
<ul class="facts">${facts.join('')}</ul>${gapLine}
<div class="pair">${blocks.join('\n')}</div></section>`;
  };

  const first = days[0] ? days[0].d : now.toISOString().slice(0, 10);
  const body = `<div class="stats"><section class="hero">
${w(L, 'statsH1', null, 'h1')}
${w(L, 'statsLead', { n: totals.stations.toLocaleString('en-US'), k: cards.length }, 'p', ' class="lead"')}
</section>
<ul class="tiles"><li><b>${totals.stations.toLocaleString('en-US')}</b>${w(L, 'tileStations')}</li><li><b>${totals.places.toLocaleString('en-US')}</b>${w(L, 'tilePlaces')}</li><li><b>${cards.length}</b>${w(L, 'tileRegions')}</li><li><b>${totals.prices.toLocaleString('en-US')}</b>${w(L, 'tilePrices')}</li></ul>
<nav class="jump" aria-label="${esc(say(L, 'jump'))}" data-kl="jump">${cards.map((c) => `<a href="#s-${c.id}">${flag(c.id)} ${name(c.id)}</a>`).join('')}</nav>
${rankBlock}
<section id="regs"><h2>${w(L, 'regH')}</h2>
<p class="curbar regpick"><label for="regsel" data-k="thPlace">${esc(say(L, 'thPlace'))}</label><select id="regsel">${cards.map((c) => `<option value="${c.id}" data-k="rn_${c.id}">${esc(say(L, `rn_${c.id}`))}</option>`).join('')}</select></p>
${w(L, 'trendStart', { d: dayLabel(first) }, 'p', ' class="note"')}
${cards.map(region).join('\n')}</section>
<section><h2>${w(L, 'methodH')}</h2>${w(L, 'methodP', null, 'p', ' class="note"')}</section></div>`;
  return layout({
    lang: L,
    title: 'Fuel price statistics: averages, trends and cheapest places | Pumpwise',
    desc: `Fuel price statistics from ${totals.stations.toLocaleString('en-US')} stations: the average price of petrol and diesel in each country today, how it is moving, the cheapest and dearest towns, and prices by brand.`,
    canonical: `${BASE}/stats/`,
    crumbs: [{ name: say(L, 'home'), k: 'home', url: `${BASE}/` }, { name: say(L, 'statsNav'), k: 'statsNav', url: `${BASE}/stats/` }],
    body,
    modified: now.toISOString(),
  });
}
