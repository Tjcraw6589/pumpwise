const UA = { 'User-Agent': 'Pumpwise (pumpwiseapp@gmail.com; https://pumpwiseapp.com)', Accept: '*/*' };
const show = async (name, url, n = 1500, opts = {}) => { try { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(60000), ...opts }); const buf = Buffer.from(await r.arrayBuffer()); let t = buf.toString('utf8'); if (buf[0] === 0x1f && buf[1] === 0x8b) { const { gunzipSync } = await import('node:zlib'); t = gunzipSync(buf).toString('utf8'); } console.log(`== ${name} http=${r.status} type=${r.headers.get('content-type')} bytes=${buf.length} len=${t.length}`); console.log(t.slice(0, n).replace(/\s+/g, ' ')); return t; } catch (e) { console.log(`== ${name} FAILED ${e.message} ${e.cause?.code ?? ''}`); return ''; } };
const home = await show('qc home', 'https://regieessencequebec.ca/', 600);
console.log('QC LINKS', [...new Set([...home.matchAll(/["'(]([^"'()\s]*\.(?:geojson|json|js|gz)[^"'()\s]*)/g)].map((m) => m[1]))].slice(0, 40).join(' '));
for (const u of ['https://regieessencequebec.ca/stations.geojson.gz', 'https://regieessencequebec.ca/stations.geojson', 'https://regieessencequebec.ca/data/stations.geojson']) {
  const t = await show('qc ' + u, u, 1800);
  if (t.includes('FeatureCollection')) { try { const j = JSON.parse(t); console.log('QC features', j.features.length, 'meta', JSON.stringify(j.metadata ?? {}).slice(0, 300)); console.log('QC sample', JSON.stringify(j.features[Math.floor(j.features.length / 2)]).slice(0, 1200)); const banners = {}; for (const f of j.features) banners[f.properties.brand ?? f.properties.Banner ?? f.properties.banniere ?? '?'] = 1; console.log('QC brands', Object.keys(banners).slice(0, 40).join(', ')); } catch (e) { console.log('QC parse', e.message); } break; }
}
for (const js of [...home.matchAll(/src="([^"]+\.js[^"]*)"/g)].map((m) => m[1]).slice(0, 6)) { const u = new URL(js, 'https://regieessencequebec.ca/').href; const t = await show('qc js ' + u, u, 0); console.log('   refs', [...new Set([...t.matchAll(/["'`]([^"'`\s]*(?:geojson|\.json|\/api\/)[^"'`\s]*)["'`]/g)].map((m) => m[1]))].slice(0, 25).join(' ')); }
const tw = await show('tw stations', 'https://vipmbr.cpc.com.tw/CPCSTN/STNWebService.asmx/getStationInfo_XML', 2500);
console.log('TW count', (tw.match(/<站代號>/g) ?? []).length, 'open', (tw.match(/<營業中>1|<營業中>true|<營業中>是/g) ?? []).length);
await show('tw swagger', 'https://vipmbr.cpc.com.tw/openData/swagger/v1/swagger.json', 3000);
await show('tw price1', 'https://vipmbr.cpc.com.tw/cpcstn/listpricewebservice.asmx/getCPCMainProdListPrice_XML', 2500);
await show('tw price2', 'https://vipmbr.cpc.com.tw/openData/MainProdListPrice', 2500);
await show('hk', 'https://www.consumer.org.hk/pricewatch/oilwatch/opendata/oilprice.json', 1200);
await show('my', 'https://api.data.gov.my/data-catalogue?id=fuelprice&limit=2&sort=-date', 800);
