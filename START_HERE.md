# START HERE: what's left to put Pumpwise on the App Store

Pumpwise is one app for every place where a government publishes fuel prices for free. The first release covers **Western Australia**, using FuelWatch. **Nothing here costs money**: FuelWatch is free with no sign-up, GitHub is free for public projects, Expo's free plan covers the builds, and your Apple developer membership is already paid.

Steps marked **(you)** need your own login or password. Steps marked **(Claude)** I can do once you say yes.

---

## 1. The free price feed (done)

The code is at https://github.com/Tjcraw6589/pumpwise. A GitHub job collects every WA price from FuelWatch about once an hour (prices are fixed for the day from 6am; tomorrow's appear at 2:30pm Perth time) and publishes them with the website, privacy and terms pages at https://tjcraw6589.github.io/pumpwise/. Check it any time at https://tjcraw6589.github.io/pumpwise/data/v2/meta.json (`"wa": {"status": "live", ...}`).

FuelWatch allows apps to use its data as long as FuelWatch is credited with a link to www.fuelwatch.wa.gov.au. The app does this on every price screen, station page and the About page, and the store description does too. Keep it that way.

## 2. Create the app in App Store Connect (done 29 October 2026)

App ID `com.tyjcraw.pumpwise` is registered on the Apple developer site, and the app exists in App Store Connect as **Pumpwise: Fuel Prices Near Me** (Apple ID 6828174153, SKU `pumpwise`, primary language English (Australia)). `eas.json` already points uploads at it. Team ID: JA885J7PGW.

## 3 and 4. Build, upload, listing and submission (done 1 November 2026)

Build 4 (version 1.0) was uploaded and the full listing filled in. Pumpwise was submitted to App Review on 1 November 2026 and is "Waiting for Review". Apple emails when the review finishes (usually within 48 hours); release is automatic after approval.

If Apple asks for changes: fix, `eas build -p ios --profile production` (no sign-in needed now), `eas submit -p ios --latest`, then in App Store Connect remove the version from review, attach the new build, and submit again.

---

## 5. New South Wales, the ACT and Tasmania (code ready, needs your free key)

The feed code is in (`scripts/feed/sources/nsw.ts`) and the app knows NSW, the ACT and Tasmania from version 1.1. It switches on as soon as GitHub has the key:

1. Open https://api.nsw.gov.au/Account/Register. Type your first name, last name and email (twice), read the Terms and Conditions, tick the box and click **Sign up**. NSW emails you a link: open it and choose a password.
2. Log in at https://api.nsw.gov.au/Account/Login. Open **My apps** (top right menu) and click **Create an app**. Any name, for example `Pumpwise`.
3. Open https://api.nsw.gov.au/Product/Index/22 (**Fuel API**), click **Subscribe**, pick the **Free** plan (2,500 calls a month) and your app.
4. Back in **My apps**, open the app: it shows an **API Key** and an **API Secret**.
5. On GitHub, open https://github.com/Tjcraw6589/pumpwise/settings/secrets/actions/new (sign in to GitHub first if it says "page not found"). Add two secrets, one at a time:
   - Name `NSW_FUEL_API_KEY`, Secret: paste the API Key, click **Add secret**
   - Open the same link again. Name `NSW_FUEL_API_SECRET`, Secret: paste the API Secret, click **Add secret**

That's it. The next feed run (within 15 minutes) picks NSW up; check https://tjcraw6589.github.io/pumpwise/data/v3/meta.json for `"nsw": {"status": "live"`. The feed asks NSW every 45 minutes (two calls each time, about 2,000 a month), well inside the free plan. One call brings back NSW, the ACT and Tasmania together (the feed asks for `states=NSW|TAS`, as the API's published spec requires; without it Tasmania is left out).

The data is published by the NSW Government under a Creative Commons Attribution licence (listed as CC BY-SA on data.gov.au), so the app credits FuelCheck on every price screen. Pumpwise 1.0 keeps reading the Western Australia feed (`data/v2`) and never sees the new regions; 1.1 reads `data/v3`.

## 6. Small fixes without waiting for Apple (from version 1.1)

Version 1.1 includes EAS Update, so a fix that only changes the app's own code, text or pictures can reach phones within a day, with no new App Store review. Ask Claude: "send this fix as an update". Claude runs the tests, then publishes with:

```
npx eas-cli@latest update --channel production --environment production --message "<what changed>"
```

Claude publishes to `production` only when you say so; to try a fix first, it publishes to the `preview` channel. A phone picks the update up the next time Pumpwise is fully closed and reopened (sometimes it takes two reopens).

- **Free:** the Free plan covers 1,000 phones a month that download an update, and 100 GB of downloads. Free accounts can't be charged for going over (Expo billing FAQ).
- **Not for everything:** new native features, new permissions, SDK upgrades and AdMob ID changes still need a new build and App Store review.
- **Matching versions:** an update only reaches builds of the same app version (`runtimeVersion` policy `appVersion`), so updates published for 1.1.0 reach 1.1.0 builds only. Version 1.0 has no EAS Update and never receives them.

## Queensland: what you agree to if you sign up (decide first)

Queensland gives its prices to apps that sign up as a "publisher" at https://www.fuelpricesqld.com.au (a short Microsoft form). The feed and the app are ready; the token they email goes into GitHub as the secret `QLD_FUEL_API_TOKEN` (https://github.com/Tjcraw6589/pumpwise/settings/secrets/actions/new). Submitting the form means accepting their Fuel Price Data Licence (https://www.fuelpricesqld.com.au/documents/LimitedUseLicence.pdf). In plain words it says:

- **A  fee**, but only if the State asks for it.
- **Prices must be current within 30 minutes.** The feed fetches Queensland every 15 minutes, so this is met.
- **Their notice must be shown** and people must be told not to republish the prices. Both are in the app (credit line, About, terms).
- **They can ask for usage figures within 10 business days**: monthly active, new and returning users for Queensland. Pumpwise has no analytics, so you could only give App Store Connect's download and usage numbers, which are not split by state. Tell them that if they ask.
- **They can audit compliance**, and either side can end the agreement with 20 business days' notice (3 days if the publication isn't current).

If that is fine with you, follow the checklist page's Queensland task. If not, Queensland simply stays off; nothing else is affected. The full register of every source's licence is in LEGAL.md.

## Denmark and Iceland (added 16 November 2026, app version 1.3)

Both are on the website now and in the app from version 1.3 (feed v5). They are company prices, not government prices, and the app and website say so. Denmark has OK and Shell stations only for now; other Danish companies publish prices without map positions, so they come later. The store text for 1.3 is in STORE_LISTING.md under "Version 1.3.0". Build 1.3 with the "iPhone build" workflow, branch **main**. Do not submit it until 1.2 is released.

## The Stats page (added 17 November 2026, website only)

https://pumpwiseapp.com/prices/stats/ compares countries in euros a litre, and for each country shows the average, the spread, the cheapest and dearest towns, prices by brand and a line of the daily average. The line starts on 17 November 2026 because no averages were saved before then; it gains a point a day. The saved days live on the repository's **stats** branch (history.json, one line per day), written by the price feed job. Do not delete that branch: it is the only copy of the history. Exchange rates come from the European Central Bank's free daily file. The code is scripts/prices-site/stats.mjs.

## Adding more places later

- **Spain, France, Portugal and Mexico**: live in feed v4 since November 2026; version 1.2 shows them in Spanish, French and Portuguese.
- **United Kingdom**: the code is ready, but the UK Fuel Finder service refuses connections from outside the UK, including GitHub's servers, so it stays off unless that changes.

## How it works (for later)

- **The app** (Expo SDK 58, TypeScript, Expo Router, iPhone only) downloads small price files for the area around you, works out the nearest and cheapest stations on the phone, shows each region's own units (km and dollars in WA), and opens directions in Apple Maps, Google Maps or Waze.
- **The price feed** (`.github/workflows/feed.yml` + `scripts/feed/build.ts`, one file per source in `scripts/feed/sources/`) runs every 15 minutes (:07, :22, :37, :52). GitHub's own scheduler only gets to free repositories every few hours, so each run waits for the next quarter hour and starts the next one itself; the schedule is a backup that restarts the chain if it ever stops. To pause it, add a repository variable `FEED_CHAIN` = `off` (Settings → Secrets and variables → Actions → Variables). Each source refreshes on its own schedule (WA: hourly, and within 15 minutes of 6am and 2:30pm Perth); if one fails, its last good prices stay online.
- **Checks**: `npm run verify` (types, lint, 72 tests), `npm run export:web:test` then `npm run test:e2e` (browser smoke test with sample stations).

---

## More places: what only you can do (15 Nov 2026)

Six more places were looked at. **Slovenia and Croatia are added.** Italy is not, and the reason is below. Queensland, Victoria and South Australia each need a free sign up that only you can do, because each one is a personal agreement between you and a government. **Nothing from those three states may be shown until you have signed up and been approved.** Everything here is free.

On every form use pumpwiseapp@gmail.com as the email and https://pumpwiseapp.com as the website. Type your own name, address and phone number yourself. If a form asks for a business name or an ABN and you have none, leave it blank. None of the three sets of terms says you must live in Australia. None says how someone applying from another country is treated either, so they may ask questions or say no.

**How to add a GitHub secret** (used three times below): open https://github.com/Tjcraw6589/pumpwise, then **Settings**, **Secrets and variables**, **Actions**, **New repository secret**. Type the name exactly as given, paste the value into **Secret**, click **Add secret**. Paste it yourself. Never put a key or token in an email or a chat, including a chat with me.

### 1. Queensland (code ready, needs your free token)

1. Open https://www.fuelpricesqld.com.au/ and scroll to **Information for publishers, data consumers and developers**.
2. Click **Fuel Price Data Licence Terms of Service** and read it. It is two pages: https://www.fuelpricesqld.com.au/documents/LimitedUseLicence.pdf
3. Click **Publishers and data consumers sign up**. A form opens. It should have eight questions: name, business name, ABN, address, phone, email, Publisher or Data Consumer, and whether you accept the licence.
4. Choose **Publisher**. Pumpwise shows prices to drivers, and that is what the scheme calls a publisher.
5. The last question asks if you accept the licence. Only you can answer it. Then click **Submit**.
6. Wait for an email with a token (a long code of letters and numbers). Approval is not automatic and no waiting time is published. Helpdesk: (07) 3858 0027 or support@fuelpricesqld.com.au.
7. Tell me you have the token. Do not add it on GitHub yet. "Before the token goes in" below says why.

The form has no "purpose" box. If anyone asks, paste this: "Pumpwise is an independent free fuel price app for iPhone and a website (https://pumpwiseapp.com). It shows drivers official station prices with credit to the source. The website shows adverts. The data is never sold. Contact: pumpwiseapp@gmail.com."

What the Queensland licence asks of you:

- Price changes must show within 30 minutes. Other station details must be right within 24 hours.
- A set credit and disclaimer must appear wherever Queensland prices appear (clauses 4.2 and 4.3 of the licence).
- You must prohibit further publication. Nobody may copy Queensland prices out of Pumpwise and publish them again.
- Queensland data must be labelled apart from other sources. No Queensland Government logos, and nothing that suggests the government backs Pumpwise.
- If asked, you must send Queensland user numbers within 10 business days and cooperate with an audit, which can include access to the place you work from.
- You agree to cover the State's losses caused by your use of the data, with no upper limit. The fee is $1, payable only if they ask.
- They can change the terms with 20 business days notice. They can end the licence with 20 business days notice, or with 3 if you do not fix a problem they point out.
- The licence does not mention adverts. Its notice does say "Data must not be used for direct marketing". Reading the two together as "adverts beside prices are allowed" is my inference, not a stated permission. To be sure, ask support@fuelpricesqld.com.au in writing before adverts run beside Queensland prices.

**Before the token goes in.** The Queensland code is already written (`scripts/feed/sources/qld.ts`) and switches on by itself as soon as the secret exists. Three things the licence asks for are not in Pumpwise yet, so I need to deal with them first:

- The app shows only a short credit for Queensland. The full notice from clause 4.3 is on the website's data licences page and nowhere in the app.
- The Pumpwise terms of use do not yet prohibit further publication of Queensland prices. Only the data licences page says it.
- Pumpwise counts no users, in the app or on the website. Today you could not answer a request for Queensland user numbers, beyond what Apple shows you.

After that, add the token on GitHub as a secret named `QLD_FUEL_API_TOKEN`. The feed then asks Queensland on every run, about every 15 minutes. That keeps inside the 30 minute rule only while the feed runs on time. The website does not make Queensland pages today, because the feed marks Queensland "no republish". Once you hold the publisher licence this can be looked at again, since the licence lets a publisher publish on the conditions above.

### 2. Victoria (code not written yet, needs your free key first)

Victoria runs Servo Saver through Service Victoria. The prices it gives to outside apps are always at least 24 hours old. That is the source's own rule, and Pumpwise must label them that way.

1. Read the terms: https://service.vic.gov.au/find-services/transport-and-driving/servo-saver/help-centre/servo-saver-public-api/terms-and-acceptable-use-policy
2. Open the form: https://service.vic.gov.au/find-services/transport-and-driving/servo-saver/help-centre/servo-saver-public-api/apply-for-servo-saver-public-api
3. Step 1 of 3 is a box to tick saying you have read the terms and agree. Only you can tick it. Click **Next**.
4. Steps 2 and 3 stay hidden until that box is ticked, so I have not seen them. Expect your contact details and what you will use the data for. The details must be your own and correct.
5. If it asks for an organisation, type "Pumpwise (independent developer)". If it asks for a purpose, paste this: "Pumpwise is an independent free fuel price app for iPhone and a website (https://pumpwiseapp.com). We will show the 24 hour delayed Victorian station prices, unchanged and clearly labelled as delayed, with credit to Service Victoria and the required copyright notice. The service is free for drivers. The website shows adverts. Our server will fetch the data a few times a day, well inside the rate limit."
6. Submit and wait for the email. The page warns of delays because of high demand, and they may refuse any request.
7. The email gives you an **API Consumer ID (API Key)**. Add it on GitHub as a secret named `VIC_FUEL_API_KEY`. The public guide describes only this one value. If the email gives a second, separate value, add that as `VIC_FUEL_API_CONSUMER_ID`.
8. Tell me it is done. Also tell me if the form or the email came with any extra "API Licence Terms". Those overrule the general terms and nobody has seen them yet.

The licence is Creative Commons Attribution 4.0 plus Service Victoria's own terms. Victoria is the only one of the three that says outright that commercial use is allowed. The conditions: credit Service Victoria, show the notice "© State of Victoria accessed via the Victorian Government Service Victoria Platform", show prices exactly as received, never suggest government backing, keep the key to yourself, and add a line to the Pumpwise terms saying users must follow Victoria's terms too. The data must never be used to track or profile people or to build a marketing list. You also agree to cover Service Victoria's losses if you break the terms or the law. They can change the terms with 14 days notice, and can refuse or suspend access at any time. The limit is 10 requests a minute. Help: fuel.program@service.vic.gov.au. The Victoria code is not written yet. I will write it once you have the key, so it can be tested against the real service.

### 3. South Australia (code not written yet, needs your free token first)

1. Open https://www.safuelpricinginformation.com.au/publishers.html
2. Click **Data Publisher Terms & Conditions** and read it. It is two pages: https://www.safuelpricinginformation.com.au/documents/TermsandConditions.pdf
3. Click **Data Publisher Registration**. The form should have seven questions: name, business name, ABN, address, phone, email, and whether you accept the terms. Only you can answer the last one. Then click **Submit**.
4. Wait for an email with a token. No waiting time is published. Help: support@safuelpricinginformation.com.au or 08 8356 1020.
5. Add the token on GitHub as a secret named `SA_FUEL_API_TOKEN`, then tell me.

There is no "purpose" box here either. If anyone asks, use the Queensland wording. The conditions:

- South Australian prices must be free for drivers. A paid tier for them is ruled out.
- A set credit line must show wherever the prices show, and the data must be labelled apart from other sources.
- Drivers must be able to complain to the State straight away if a price is out of date.
- No South Australian Government logos. You must supply user numbers (Pumpwise counts none today, as with Queensland), cooperate with audits, and cover losses caused by your use, with no upper limit. The fee is $1.10, payable only if they ask.
- The State can end your rights at once if you charge for the prices or break the terms. It can change the terms with reasonable notice.
- As with Queensland, the terms do not mention adverts, so "adverts allowed" is my inference. To be sure, ask FuelPricingScheme@sa.gov.au in writing.

The South Australia code is not written yet. I will write it once you have the token.

### 4. Italy (not added)

Italy publishes its licensed daily price files on www.mimit.gov.it, and that site cannot be reached from GitHub's servers, where the feed runs. The live Osservaprezzi site can be reached, but it names no licence for its live data and does not offer its data feed to outside programs. Its legal notice (https://carburanti.mise.gov.it/documenti/NoteLegali.pdf) bans automated reading that could slow the site down, and says reuse of public data goes by the law, the licences and any official channels the Ministry offers. Whether a slow, polite reader is allowed is unclear. The live site also gives one report time per station, not one per price, so Pumpwise could not say honestly how old each price is.

So Italy stays off until the Ministry says yes in writing. Here is an email to send from pumpwiseapp@gmail.com to osservaprezzi@mise.gov.it. Put your name at the bottom, and tell me what they answer.

> Oggetto: Richiesta di autorizzazione all'uso del servizio di ricerca Osservaprezzi carburanti
>
> Buongiorno,
>
> scrivo per conto di Pumpwise (https://pumpwiseapp.com), un'app per iPhone e un sito web indipendenti che aiutano gli automobilisti a confrontare i prezzi dei carburanti. Il servizio è gratuito per gli utenti e il sito mostra pubblicità. I dati non vengono venduti.
>
> Vorremmo mostrare i prezzi comunicati dai gestori all'Osservaprezzi carburanti, indicando sempre la fonte ("Fonte: Ministero delle Imprese e del Made in Italy, Osservaprezzi carburanti") e la licenza applicabile, senza usare il logo del Ministero e senza suggerire alcuna approvazione o carattere di ufficialità.
>
> Chiediamo l'autorizzazione scritta a interrogare il servizio dati usato dalla ricerca del portale (https://carburanti.mise.gov.it/ospzApi/search/area) da un solo server, a intervalli di alcune ore, con 20 richieste per volta (una per regione), una dopo l'altra e con una pausa tra le richieste. Ci fermeremmo subito in caso di errori o di limiti da voi imposti.
>
> In alternativa: i file CSV pubblicati con licenza IODL 2.0 su www.mimit.gov.it (prezzo_alle_8.csv e anagrafica_impianti_attivi.csv) non sono raggiungibili dai server che usiamo, quelli di GitHub, perché la connessione viene interrotta. Esiste un altro indirizzo o un altro modo per scaricarli?
>
> Vi chiediamo anche di confermare con quale licenza possiamo riutilizzare i dati in tempo reale del portale. Fino alla vostra risposta non pubblicheremo alcun dato italiano.
>
> Grazie per l'attenzione. Cordiali saluti,
> [il tuo nome], Pumpwise, pumpwiseapp@gmail.com

English translation (for you, do not send this part):

> Subject: Request for permission to use the Osservaprezzi carburanti search service
>
> Good morning,
>
> I am writing on behalf of Pumpwise (https://pumpwiseapp.com), an independent iPhone app and website that help drivers compare fuel prices. The service is free for users and the website shows adverts. The data is not sold.
>
> We would like to show the prices that station operators report to Osservaprezzi carburanti, always naming the source ("Source: Ministry of Enterprises and Made in Italy, Osservaprezzi carburanti") and the licence that applies, without using the Ministry's logo and without suggesting any approval or official status.
>
> We ask for written permission to query the data service that the portal's search uses (https://carburanti.mise.gov.it/ospzApi/search/area) from one server, every few hours, with 20 requests each time (one per region), one after another with a pause between them. We would stop at once on any error or any limit you set.
>
> As an alternative: the CSV files published under the IODL 2.0 licence on www.mimit.gov.it (prezzo_alle_8.csv and anagrafica_impianti_attivi.csv) cannot be reached from the servers we use, which are GitHub's, because the connection is dropped. Is there another address or another way to download them?
>
> We also ask you to confirm under which licence we may reuse the portal's live data. Until you reply we will not publish any Italian data.
>
> Thank you for your attention. Kind regards,
> [your name], Pumpwise, pumpwiseapp@gmail.com

### 5. Slovenia (added)

Slovenia is in the feed, from the government's goriva.si portal. Its terms (https://goriva.si/goriva/terms-of-use/) allow free reuse for any lawful purpose, business use included, with no special approval, as long as the source is named. Pumpwise shows "Source: goriva.si, official fuel price portal of the Republic of Slovenia". Using the data counts as accepting those terms.

The same terms ask people who want the data feed to tell the Ministry who they are and what they will use the data for. The Ministry then approves access and may send a key. Today Pumpwise reads the public price list that the goriva.si website itself uses, with no key. The terms neither allow that route nor forbid it, so it is a stopgap and the Ministry may ask for a change. Please send this as soon as you can, from pumpwiseapp@gmail.com to gp.mzie@gov.si, with the gaps filled in:

> Subject: Request for API access to goriva.si data (Pumpwise)
>
> Dear Sir or Madam,
>
> I run Pumpwise (https://pumpwiseapp.com), an independent free fuel price app for iPhone and a website. Under section 7 of the goriva.si Terms of Use I would like to ask for official access to the API and its technical documentation.
>
> Contact details: [your full name], [your town and country], pumpwiseapp@gmail.com, [your phone number].
>
> Intended use: Pumpwise shows drivers the station prices from goriva.si. It is free for drivers, the website shows adverts, and the data is not sold. Wherever Slovenian prices appear we show "Source: goriva.si, official fuel price portal of the Republic of Slovenia" with a link to https://goriva.si. One server of ours reads the station list on a fixed schedule and keeps a copy. Our app and website read that copy, so our users never load your system.
>
> At present our server reads the public station list that the goriva.si website uses (https://goriva.si/api/v1/search/), with no key. If you would like us to use a key, another address or a lower rate, please tell me and I will change it straight away.
>
> Kind regards,
> [your name], Pumpwise

If they send a username, password or key, do not forward it to anyone. Tell me, and I will give you a secret name to save it under on GitHub.

### 6. Croatia (added)

Croatia is in the feed, from the Ministry of Economy's minGO fuel price portal. The Ministry's open data page (https://mingo.gov.hr/otvoreni-podaci/8611) lists minGO and allows commercial reuse, as long as the source is named and nothing suggests that Pumpwise is official or that the Ministry backs it. No sign up is needed. Using the data counts as accepting those terms. Two loose ends: the terms are on the Ministry's page, not on the price portal itself, and that page lists the portal, not the price file behind it that Pumpwise reads. The Ministry does not promise the file will stay. This email is optional and would close both. Send it from pumpwiseapp@gmail.com to energetika@mingo.hr:

> Subject: Reuse of minGO fuel price data by Pumpwise
>
> Dear Sir or Madam,
>
> I run Pumpwise (https://pumpwiseapp.com), an independent free fuel price app for iPhone and a website. It is free for drivers and the website shows adverts.
>
> Pumpwise now shows Croatian station prices from the minGO portal (https://www.min-go.hr/). Our server reads the portal's public price file (https://mzoe-gor.hr/data.gz) on a fixed schedule and keeps a copy, so our users never load your system. We rely on the reuse terms at https://mingo.gov.hr/otvoreni-podaci/8611. Wherever the prices appear we name the Ministry of Economy and minGO as the source and say that Pumpwise is not an official service of the Ministry.
>
> Could you confirm that this reuse is in order? Please also tell me if you would like the credit worded differently or the data fetched in another way.
>
> Kind regards,
> [your name], Pumpwise, pumpwiseapp@gmail.com
