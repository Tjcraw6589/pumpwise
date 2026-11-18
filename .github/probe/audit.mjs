const UA = { 'User-Agent': 'Pumpwise (pumpwiseapp@gmail.com; https://pumpwiseapp.com)', Accept: '*/*' };
const text = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
const show = async (name, url, n = 700, opts = {}) => { try { const r = await fetch(url, { headers: { ...UA, ...(opts.headers ?? {}) }, method: opts.method ?? 'GET', body: opts.body, redirect: 'follow', signal: AbortSignal.timeout(40000) }); const t = await r.text(); console.log(`== ${name} http=${r.status} url=${r.url} type=${r.headers.get('content-type')} len=${t.length}`); if (n) console.log('   ' + (opts.plain ? text(t) : t).slice(opts.from ?? 0, (opts.from ?? 0) + n).replace(/\s+/g, ' ')); return t; } catch (e) { console.log(`== ${name} FAILED ${e.message} ${e.cause?.code ?? ''}`); return ''; } };
const refs = (t, re = /["'(]([^"'()\s<>]*(?:api|json|ajax|\.php|\.aspx|\.do|geojson)[^"'()\s<>]*)/gi) => [...new Set([...t.matchAll(re)].map((m) => m[1]))].slice(0, 40).join(' ');
// Macau
for (const u of ['https://www.consumer.gov.mo/commodity/fuel_price.aspx?lang=en', 'https://www.consumer.gov.mo/News/Fuel.aspx?lang=en', 'https://www.consumer.gov.mo/']) { const t = await show('mo ' + u, u, 500, { plain: true }); console.log('   refs', refs(t, /href="([^"]*(?:fuel|Fuel|oil|Oil|gas|price)[^"]*)"/g)); }
await show('mo data', 'https://data.gov.mo/Search?keyword=%E7%87%83%E6%96%99', 600, { plain: true });
await show('mo api', 'https://api.data.gov.mo/document/search?keyword=fuel', 500);
// Bosnia FBiH and RS
for (const u of ['https://fmt.gov.ba/', 'https://oilinfo.fmt.gov.ba/', 'https://www.fmt.gov.ba/oil-info', 'https://bps.fmt.gov.ba/', 'https://cijenegoriva.fmt.gov.ba/', 'https://cijene-goriva.vladars.rs/', 'https://gorivo.vladars.rs/', 'https://vladars.rs/sr-SP-Cyrl/Vlada/Ministarstva/MTT/Pages/default.aspx']) { const t = await show('ba ' + u, u, 300, { plain: true }); if (t) console.log('   refs', refs(t, /(?:href|src)="([^"]*(?:oil|gorivo|goriva|cijen|api|play\.google|apps\.apple)[^"]*)"/gi)); }
// Hong Kong: consumer council oil price open data + station geodata
await show('hk cc', 'https://www.consumer.org.hk/pricewatch/oilwatch/opendata/oilprice.json', 900);
await show('hk data', 'https://data.gov.hk/en-datasets/search/oil%20price', 0);
await show('hk ckan', 'https://data.gov.hk/api/3/action/package_search?q=oil+price&rows=5', 1200);
await show('hk stations', 'https://data.gov.hk/api/3/action/package_search?q=petrol+filling+station&rows=5', 1200);
