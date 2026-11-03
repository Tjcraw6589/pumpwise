// Puts the owner's AdMob IDs into app.json, after checking they look right and belong together.
// Usage: npm run admob -- <App ID ca-app-pub-…~…> <banner unit ID ca-app-pub-…/…>
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE = 'ca-app-pub-3940256099942544';
const [appId = '', unitId = ''] = process.argv.slice(2).map((s) => s.trim());
const fail = (message) => {
  console.error(`Not changed: ${message}`);
  process.exit(1);
};

if (!/^ca-app-pub-\d{16}~\d{10}$/.test(appId)) fail(`"${appId}" is not an AdMob App ID (ca-app-pub-<16 digits>~<10 digits>).`);
if (!/^ca-app-pub-\d{16}\/\d{10}$/.test(unitId)) fail(`"${unitId}" is not an AdMob ad unit ID (ca-app-pub-<16 digits>/<10 digits>).`);
if (appId.startsWith(SAMPLE) || unitId.startsWith(SAMPLE)) fail("those are Google's sample IDs, not yours.");
if (appId.split('~')[0] !== unitId.split('/')[0]) fail('the App ID and the ad unit come from different AdMob accounts.');

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'app.json');
const text = readFileSync(file, 'utf8');
const app = JSON.parse(text);
const plugin = app.expo.plugins.find((p) => Array.isArray(p) && p[0] === 'react-native-google-mobile-ads');
if (!plugin) fail('app.json has no react-native-google-mobile-ads plugin (is this the ads-1.1 branch?).');
plugin[1].iosAppId = appId;
app.expo.extra.monetization = { ...(app.expo.extra.monetization ?? {}), admobBannerIos: unitId };
writeFileSync(file, `${JSON.stringify(app, null, 2)}${text.endsWith('\n') ? '\n' : ''}`);
console.log(`app.json: iosAppId ${appId}, banner unit ${unitId}. Next: npm run verify, then the TestFlight build.`);
