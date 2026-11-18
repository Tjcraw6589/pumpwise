const UA = { 'User-Agent': 'Pumpwise (pumpwiseapp@gmail.com; https://pumpwiseapp.com)', Accept: '*/*' };
const show = async (name, url, n = 1200, opts = {}) => { try { const r = await fetch(url, { headers: { ...UA, ...(opts.headers ?? {}) }, method: opts.method ?? 'GET', body: opts.body, signal: AbortSignal.timeout(45000) }); const t = await r.text(); console.log(`== ${name} http=${r.status} type=${r.headers.get('content-type')} len=${t.length}`); console.log('   ' + t.slice(0, n).replace(/\s+/g, ' ')); return t; } catch (e) { console.log(`== ${name} FAILED ${e.message} ${e.cause?.code ?? ''}`); return ''; } };
// Austria
const at = await show('at by-region', 'https://api.e-control.at/sprit/1.0/search/gas-stations/by-region?code=9&type=BL&fuelType=DIE&includeClosed=false', 900);
try { const j = JSON.parse(at); console.log('   AT count', j.length, 'withPrice', j.filter((s) => s.prices?.length).length); } catch {}
const at2 = await show('at by-address', 'https://api.e-control.at/sprit/1.0/search/gas-stations/by-address?latitude=48.2082&longitude=16.3738&fuelType=SUP&includeClosed=false', 300);
try { const j = JSON.parse(at2); console.log('   AT count', j.length, 'withPrice', j.filter((s) => s.prices?.length).length); } catch {}
await show('at regions', 'https://api.e-control.at/sprit/1.0/regions', 400);
// Peru
const pe = await show('pe home', 'https://www.facilito.gob.pe/facilito/pages/facilito/menuPrecios.jsp', 500);
console.log('   PE refs', [...new Set([...pe.matchAll(/["'(]([^"'()\s]*(?:\.do|\.jsp|\.json|Action|api\/)[^"'()\s]*)/g)].map((m) => m[1]))].slice(0, 30).join(' '));
await show('pe datos abiertos', 'https://www.datosabiertos.gob.pe/api/3/action/package_search?q=precios+combustibles+grifos&rows=8', 1800);
await show('pe osinergmin', 'https://www.osinergmin.gob.pe/seccion/institucional/acerca_osinergmin/datos-abiertos', 300);
// Colombia
const co = await show('co catalog', 'https://api.us.socrata.com/api/catalog/v1?domains=www.datos.gov.co&q=precios%20combustibles%20estaciones%20de%20servicio&limit=10', 0);
try { for (const r of JSON.parse(co).results) console.log('   CO', r.resource.id, '|', r.resource.name, '|', r.resource.updatedAt, '|', (r.resource.columns_name ?? []).join(','), '|', r.metadata?.license); } catch {}
// Argentina retry
await show('ar', 'http://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/80ac25de-a44a-4445-9215-090cf55cfda5/download/precios-en-surtidor-resolucin-3142016.csv', 400);
// Romania
await show('ro', 'https://monitorulpreturilor.info/pmonsvc/Gas/GetGasItemsByLatLon?lat=44.4268&lon=26.1025&buffer=5000&CSVGasCatalogProductIds=11&OrderBy=dist', 700);
// Brazil ANP weekly
await show('br', 'https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/serie-historica-de-precos-de-combustiveis', 0);
// Greece
await show('gr', 'https://www.fuelprices.gr/', 200);
// Chile without token
await show('cl', 'https://api.cne.cl/api/v4/estaciones', 300);
// Uruguay / Costa Rica skip. Korea opinet free api check
await show('kr', 'https://www.opinet.co.kr/api/avgAllPrice.do?out=json&code=F000000000', 300);
