# Pumpwise: data licences and legal register

Checked 8 November 2026. This file lists every place Pumpwise takes prices from, what its owner allows, and where Pumpwise shows the required credit. It also records the privacy and consumer-law checks for each market. Plain English; the exact wording is quoted where it matters.

How to read the tags on sources: `[retrieved 2026-11-08]` means the text was read from the official page on that day; `[verify]` means it comes from memory or a secondary source and should be checked against the official page before relying on it; `[recorded earlier]` means an earlier working session read it and this one could not reopen the page.

> This register was prepared by an AI assistant, not a lawyer. Nothing here is legal advice. Before relying on a licence term or a privacy rule, check it against the official page linked beside it.

## Summary

| Source | Data owner | Licence or terms | May Pumpwise republish it in its own feed? | Credit shown | Status |
|---|---|---|---|---|---|
| Western Australia (FuelWatch) | Government of Western Australia | Free public RSS feed; no written licence; acknowledgement with a link expected `[recorded earlier]` | Not addressed by any licence; low risk; credit and link carried into the feed | Every price screen, station page, About, store text, website | Live in 1.0, 1.1, 1.2 |
| New South Wales and the ACT (FuelCheck) | NSW Government (Fair Trading) | Creative Commons Attribution-ShareAlike 3.0 Australia `[retrieved 2026-11-08]`; API access under api.nsw.gov.au terms | Yes, if the NSW part of the feed is itself offered under CC BY-SA 3.0 AU (done: see "Our own feed") | Every price screen, station page, About, store text | Live in 1.1, 1.2 |
| Tasmania (FuelCheck TAS) | Tasmanian Government (CBOS) | No published reuse licence; data arrives through the NSW API under its terms | Not expressly licensed; attribution given; owner can confirm by email (draft below) | Every price screen, station page, About | Live in 1.1, 1.2 |
| Queensland | State of Queensland | Fuel Price Data Licence 2024 (signed by the owner, not yet) | Publisher may publish but "must prohibit further publication" | Licence notice in the credit line, About and terms | Off until the owner signs up |
| United Kingdom (Fuel Finder) | UK Government (DESNZ) | Open Government Licence v3.0 `[retrieved 2026-11-08]` | Yes, with the OGL attribution statement | Credit line and terms carry the OGL statement | Off: the service blocks connections from outside the UK |
| Spain | Ministerio para la Transición Ecológica y el Reto Demográfico (MITECO) | Creative Commons Attribution 4.0 `[retrieved 2026-11-08]` | Yes, with attribution | Every price screen, station page, About, store text | Live in 1.2 |
| France | DGCCRF, Ministère de l'Économie | Licence Ouverte / Open Licence 2.0 `[retrieved 2026-11-08]` | Yes, with source and date of last update | Every price screen (with "Updated … ago"), station page, About, store text | Live in 1.2 |
| Mexico | Comisión Nacional de Energía (CNE, formerly CRE) | Creative Commons Attribution 4.0 on datos.gob.mx; Libre Uso MX terms `[retrieved 2026-11-08]`, `[verify]` for the live XML endpoint | Yes, with the citation Libre Uso MX asks for | Every price screen, station page, About, store text | Live in 1.2 |
| Portugal | Direção-Geral de Energia e Geologia (DGEG) | Site terms: free use with source, last-update time and faithful reproduction `[retrieved 2026-11-08]` | Yes, with those three conditions | Every price screen (with "Updated … ago"), station page, About | Added 8 November 2026 (feed v4, app 1.2) |

## Each source

### Western Australia: FuelWatch

- **Owner:** Government of Western Australia (Consumer Protection, Department of Energy, Mines, Industry Regulation and Safety). https://www.fuelwatch.wa.gov.au
- **Terms:** FuelWatch publishes an RSS feed for reuse at https://www.fuelwatch.wa.gov.au/tools/rss. The page's questions and answers say: "Does it cost anything? No. It's absolutely free." `[retrieved 2026-11-08]`. The answer to "Can I include the information in my webpage?" was read by an earlier session as: yes, provided FuelWatch is acknowledged as the source with a link back to fuelwatch.wa.gov.au `[recorded earlier; the answer did not expand on this visit, re-read it on the page]`. There is no formal licence document; the material is Crown copyright, Western Australia.
- **Attribution required:** acknowledge FuelWatch with a link.
- **Redistribution of our feed:** not addressed. Pumpwise's feed carries the WA prices with the FuelWatch credit and link in its licence file. Low risk because FuelWatch publishes the feed for exactly this kind of use. If the owner wants certainty, email FuelWatch (https://www.fuelwatch.wa.gov.au/contact) with the sentence: "Pumpwise is a free iPhone app that shows FuelWatch prices with the FuelWatch credit and link on every screen; it also republishes the prices in a public data feed with the same credit. Please tell us if you would like anything changed."
- **Where Pumpwise complies:** credit "Prices from FuelWatch, Government of Western Australia" with the link on the Nearby screen footer, every station page, the About screen, the App Store description and the website (site/index.html). Also in the terms of use.

### New South Wales and the Australian Capital Territory: FuelCheck

- **Owner:** NSW Government, NSW Fair Trading (Department of Customer Service). https://www.fuelcheck.nsw.gov.au
- **Licence:** the FuelCheck dataset on data.gov.au is licensed "Creative Commons Attribution Share-Alike 3.0 Australia", http://creativecommons.org/licenses/by-sa/3.0/au/ `[data.gov.au API record, retrieved 2026-11-08]`. The API portal's terms (https://api.nsw.gov.au/Home/Terms) add: "Use of information from this service may be governed by terms and conditions stipulated by the authority administering the licence or information. You need to be aware of, and agree to these conditions before you use this service." They also require the API key and secret to be kept secret and allow the NSW Government to revoke access. The free plan allows 2,500 calls a month; Pumpwise uses about 2,000.
- **What CC BY-SA 3.0 AU requires** (clause 4 of the licence `[retrieved 2026-11-08]`): keep the licence notice with every copy; give the licensor's name, the title and the web address; do not add terms that restrict the licence; and if you distribute a *derivative work*, license it under CC BY-SA too. A *collection* that includes the work does not have to be CC BY-SA as a whole, but the NSW part stays CC BY-SA.
- **What this means for Pumpwise:** the price feed on GitHub Pages republishes NSW and ACT prices in a new format, so the NSW part of the feed is offered under CC BY-SA 3.0 AU (stated in each feed's `meta.json` and on the website's data licences page). The terms of use must not stop anyone reusing that part. The earlier terms line "do not copy, republish or redistribute" was rewritten on 8 November 2026 so it applies only to Queensland data, as its licence requires, and points to the licences page for everything else.
- **Attribution:** "Prices from FuelCheck, NSW Government (CC BY-SA 3.0 AU)" with a link, on every price screen, station page, About and in the store text.

### Tasmania: FuelCheck TAS

- **Owner:** Tasmanian Government, Consumer, Building and Occupational Services (Department of Justice). https://www.fuelcheck.tas.gov.au
- **Licence:** none published. FuelCheck TAS runs on the NSW platform and its prices arrive through the same api.nsw.gov.au call (`states=NSW|TAS`), under the api.nsw.gov.au terms quoted above. The FuelCheck TAS website and its About page state no reuse terms `[retrieved 2026-11-08]`; data.gov.au lists no Tasmanian fuel dataset; the CBOS website could not be read automatically.
- **Position:** access is permitted by the published API; redistribution is not expressly licensed. Pumpwise shows the credit on every screen and does not offer the Tasmanian part of its feed under Creative Commons. Risk: low to medium. Suggested email for the owner to send to CBOS (through https://www.cbos.tas.gov.au): "Pumpwise is a free iPhone app that shows FuelCheck TAS prices obtained through the NSW Fuel API, with a credit to FuelCheck TAS and the Tasmanian Government on every screen, and republishes them in a public data feed with the same credit. Is that acceptable, and is there a licence you would like us to name?"
- **Attribution:** "Prices from FuelCheck TAS, Tasmanian Government" with a link.

### Queensland: Fuel Prices Queensland

- **Owner:** State of Queensland (Department of Energy and Climate). https://www.fuelpricesqld.com.au
- **Licence:** Fuel Price Data Licence Terms and Conditions 2024, https://www.fuelpricesqld.com.au/documents/LimitedUseLicence.pdf `[retrieved 2026-11-04]`. The owner signs it by submitting the publisher sign-up form. What it says, in the licence's own words where it matters:
  - a "Fee" of **$1 payable upon demand** (clause 1.4, 4.1);
  - "changes in fuel prices must be reported within thirty minutes and all other published data (including locality, address, brand) must be updated within 24 hours of a change" (clause 2.3);
  - "you may publish the Licensed Data and/or Licensed Data Products but you must prohibit further publication" (clause 2.3);
  - the notice "Based on or contains data provided by the State of Queensland (Department of Energy and Climate) [year]. In consideration of the State permitting use of this data you acknowledge and agree that the State gives no warranty in relation to the data … Data must not be used for direct marketing or be used in breach of the privacy laws." must appear on any product (clause 4.3);
  - no Queensland Government logos, and nothing implying endorsement (clause 4.7);
  - **usage data on request within 10 business days**, including monthly active, new and returning users for Queensland (clause 4.8);
  - the State may audit compliance (clause 5); either side may end the agreement on 20 business days' notice, the State on 3 business days' notice if the publication is not current or accurate (clause 1.5).
- **What Pumpwise can and cannot give:** the feed fetches Queensland on every run (every 15 minutes), the notice is in the credit line, the About screen and the terms, and the terms tell users not to republish Queensland prices. Pumpwise has **no analytics**, so it cannot report active users by month; the owner could only offer App Store download and usage figures from App Store Connect, which are not split by Australian state. The owner should know this before signing.
- **Status:** off until the owner submits the form and adds the token to GitHub as `QLD_FUEL_API_TOKEN`.

### United Kingdom: Fuel Finder

- **Owner:** UK Government, Department for Energy Security and Net Zero. https://www.gov.uk/government/collections/fuel-finder
- **Licence:** Open Government Licence v3.0. The licence requires you to "acknowledge the source of the Information in your product or application by including or linking to any attribution statement specified by the Information Provider(s) and, where possible, provide a link to this licence", and where none is specified: "Contains public sector information licensed under the Open Government Licence v3.0." `[retrieved 2026-11-08]`
- **Where Pumpwise complies:** the credit line names the scheme and the licence; the terms carry the exact statement with a link to the licence. The source is off because the service refuses connections from outside the UK, including GitHub's servers.

### Spain: Geoportal de Gasolineras

- **Owner:** Ministerio para la Transición Ecológica y el Reto Demográfico (MITECO). Prices are reported by stations under Orden ITC/2308/2007 and served by the Ministry's REST service (sedeaplicaciones.minetur.gob.es) and the Geoportal, https://geoportalgasolineras.es.
- **Licence:** the dataset "Instalaciones de suministro de combustibles a vehículos y embarcaciones con venta pública" (publisher E05068001, MITECO) is licensed **CC BY 4.0** on datos.gob.es and the Ministry's own catalogue, https://catalogo.datosabiertos.miteco.gob.es/catalogo/dataset/902a266d-5ba2-4735-a378-45818ba5a4f4 `[datos.gob.es API record, retrieved 2026-11-08]`. The Geoportal itself has no "aviso legal" page (its footer links to privacy, accessibility and the Ministry's reuse FAQ) `[retrieved 2026-11-08]`.
- **Attribution required (CC BY 4.0):** name the licensor and the licence, link to it, and say if the data was changed. Pumpwise rounds nothing and changes nothing in the prices; it reformats them.
- **Fix made 8 November 2026:** the credit now reads "Prices from MITECO's Geoportal de Gasolineras, Government of Spain (CC BY 4.0)" in English, Spanish and French; the terms name the dataset and licence.

### France: prix-carburants.gouv.fr

- **Owner:** DGCCRF, Ministère de l'Économie, des Finances et de la Souveraineté industrielle et numérique. Dataset "Prix des carburants en France - Flux instantané - v2", https://data.economie.gouv.fr `[retrieved 2026-11-08]`; files at https://donnees.roulez-eco.fr/opendata/.
- **Licence:** Licence Ouverte / Open Licence 2.0 (Etalab). The licence says the reuser is free to reproduce, adapt and exploit the information commercially, "sous réserve de mentionner la paternité de l'Information : sa source (au moins le nom du Concédant) et la date de dernière mise à jour de l'Information réutilisée" (name the source and the date of last update) `[licence PDF, retrieved 2026-11-08]`. It is compatible with CC BY and OGL.
- **Where Pumpwise complies:** the credit names the source and the licence; every French price shows "Updated … ago" (its own last update time); the About screen shows when the feed was last rebuilt; the terms link to the licence.

### Mexico: prices reported to the energy regulator

- **Owner:** Comisión Nacional de Energía (CNE), Government of Mexico. The CNE took over the Comisión Reguladora de Energía (CRE) in 2025 `[web search — verify]`. Stations (permisionarios) must report their prices under the regulator's rules.
- **Licence:** on datos.gob.mx the CNE dataset "Petrolíferos", which includes "Precios promedio diarios de gasolinas y diésel reportados por los permisionarios de estaciones de servicio", is licensed **Creative Commons Attribution 4.0** `[datos.gob.mx API record, retrieved 2026-11-08]`. Mexico's open-data portal terms, "Términos de Libre Uso MX", allow copying, publishing, adapting and commercial use on condition that the source is cited with the dataset name, the agency's acronym, the link and the date consulted, that the data is not used to mislead, and that no official endorsement is implied `[2015 text as reproduced on the OpenStreetMap wiki, retrieved 2026-11-08; the portal's own page returned "not found", verify]`.
- **Open point:** the live station-by-station XML that Pumpwise reads (publicacionexterna.azurewebsites.net, published by the CRE as its open-data channel) is no longer linked from an official page that this session could reach, because the CRE's website closed after the merger. The owner can confirm it by writing to the CNE (contact on https://www.gob.mx/cne): "Pumpwise, a free iPhone app, shows the station prices published at publicacionexterna.azurewebsites.net with a credit to the CNE. Is this still the official publication, and under which terms?"
- **Fix made 8 November 2026:** the credit now names the CNE (formerly CRE), the dataset and the licence; the About screen shows when the prices were collected (the "date consulted").

### Portugal: Preços dos Combustíveis (DGEG)

- **Owner:** Direção-Geral de Energia e Geologia (DGEG). https://precoscombustiveis.dgeg.gov.pt. Prices are entered by the stations' licence holders.
- **Terms** (the site's privacy and security notice, `[retrieved 2026-11-08]`): "A informação disponível neste sítio é gratuita, podendo ser utilizada livremente. A reutilização desta informação deverá assegurar a adequada identificação da Direção-Geral de Energia e Geologia enquanto fonte dos dados, bem como a indicação da data-hora da última atualização dos preços e a reprodução fiel de toda a informação." In English: the information is free and may be used freely; reuse must identify the DGEG as the source, give the date and time the prices were last updated, and reproduce the information faithfully.
- **Where Pumpwise complies:** the credit names the DGEG; every Portuguese price carries its own last-update time and the app shows "Updated … ago"; prices are reproduced exactly as published (euro prices to the tenth of a cent). The feed stores the DGEG's time for each price.

## Our own feed (data/v2, data/v3, data/v4 on GitHub Pages)

The feed is a copy of the official prices in a different shape, rebuilt every 15 minutes. From 8 November 2026 each `meta.json` carries a `licences` section naming, for every region, the data owner, the licence and the attribution to use, and the website has a page listing them (https://tjcraw6589.github.io/pumpwise/data-licences.html). In short:

- NSW and ACT prices: CC BY-SA 3.0 AU, attribution "FuelCheck, NSW Government". Anyone may reuse that part under the same licence.
- Spain: CC BY 4.0, attribution "MITECO, Government of Spain". France: Licence Ouverte 2.0, attribution "prix-carburants.gouv.fr, Ministère de l'Économie", with each price's update time. Mexico: CC BY 4.0 / Libre Uso MX, attribution "CNE (formerly CRE), Government of Mexico". UK (when on): OGL v3.0 statement.
- Western Australia, Tasmania and Portugal: no Creative Commons licence; use them under the owners' own terms described above, with the credit and, for Portugal, each price's update time.
- Queensland (when on): may not be republished at all; the Queensland part of the feed will carry that notice.

## Privacy and consumer law, by market

Pumpwise collects nothing itself: no account, no analytics, location used only on the phone. Two third parties receive device information: Google (the AdMob banner, from version 1.1) and Expo (the update check, from 1.1). The price files come from GitHub Pages, which sees the phone's internet address like any website.

### Australia

The Privacy Act 1988 applies to businesses with turnover above $3 million, so a sole developer is generally exempt `[settled, with exceptions for some kinds of business; verify if the business grows]`. Apple requires a privacy policy regardless, and the policy already describes everything. No gap.

### Spain and France (GDPR and ePrivacy)

Pumpwise has users in the EU from version 1.2, so the GDPR applies to the little it does `[settled]`. The gaps found on 8 November 2026 and how they were closed:

| Requirement (GDPR article) | Before | Fix |
|---|---|---|
| Identity and contact details of the controller (Art. 13(1)(a)) | Only an email address | The policy names the developer (Tyler Crawford) with the email; postal address to be added by the owner if wanted |
| Purposes and legal basis for each processing (Art. 13(1)(c)) | Not stated | Added: service provision and legitimate interest for the price downloads and update check; consent (Google's consent form and Apple's tracking prompt) for personalised advertising |
| Recipients and transfers outside the EU (Art. 13(1)(e), (f)) | Google and Expo named, transfers not mentioned | Added: Google, Expo and GitHub are in the United States and rely on the EU-US Data Privacy Framework or standard contractual clauses `[verify each provider's current mechanism]` |
| Retention (Art. 13(2)(a)) | Implied | Stated: Pumpwise keeps nothing; third parties' retention is in their policies |
| Data subject rights and the right to complain (Art. 13(2)(b), (d)) | Not stated | Added: access, rectification, erasure, restriction, portability, objection, withdrawal of consent, and the right to complain to the AEPD (Spain), CNIL (France) or the user's own authority |
| Information in clear and plain language the user understands (Art. 12(1)) and consumer-law language rules (Spain: consumer information in Spanish; France: Loi Toubon, consumer information in French `[settled]`) | English only, with a note | Spanish and French versions of the privacy policy and terms added; the app shows the version in the phone's language |
| Consent for personalised ads in the EEA/UK/Switzerland (ePrivacy, Google EU User Consent Policy `[settled]`) | Google's UMP consent form in 1.1 | Kept in 1.2; "Ad privacy choices" appears in Settings whenever Google says a privacy-options form is required (EEA, UK, Switzerland) |

### Mexico (LFPDPPP)

Mexico's Ley Federal de Protección de Datos Personales en Posesión de los Particulares requires a privacy notice (aviso de privacidad) before personal data is collected, naming the responsible party and its address, the data processed, the purposes, transfers, how to exercise ARCO rights (access, rectification, cancellation, opposition), how to withdraw consent and how changes are announced `[settled; the supervisory authority changed in 2025 when the INAI was dissolved, verify the current body]`. Pumpwise collects no personal data itself; the Google and Expo processing is described. The Spanish privacy policy now includes a short "Aviso de privacidad (México)" section with these points. The owner should add a postal address for the responsible party; the law expects one.

### Portugal

GDPR as above; consumer information in Portuguese is expected for consumers in Portugal `[Decreto-Lei 238/86, verify]`. Portugal was added to the feed and the app on 8 November 2026 with the app's words, the store listing, the privacy policy and the terms in European Portuguese.

### App Store and AdMob

- "Contains ads" must be set to Yes from 1.1 (already in STORE_LISTING.md).
- App Privacy labels for the AdMob SDK are listed in ADS.md and STORE_LISTING.md; 1.2 collects nothing new.
- No country-specific requirement was found for a free app with ads in Spain, France or Mexico. South Korea (business registration details in the listing) and Brazil were not added, so their rules do not apply yet `[verify if added]`.

## Remediation plan

| Gap | Fix | Who | Status |
|---|---|---|---|
| Terms said "do not republish" for every source; NSW data is CC BY-SA | Terms rewritten: the ban applies to Queensland only; a licences section lists each source | Claude | Done 8 Nov 2026 (branch regions-1.2) |
| Feed carries CC BY-SA data without saying so | `licences` in every `meta.json` and a website page | Claude | Done 8 Nov 2026 (main) |
| Spain credit named no licence | Credit and terms name MITECO and CC BY 4.0 | Claude | Done |
| Mexico credit named the dissolved CRE | Credit names the CNE (formerly CRE), the dataset and CC BY 4.0; About shows the date consulted | Claude | Done |
| Privacy policy lacked GDPR information and a Mexican notice | Sections added; Spanish and French versions | Claude | Done |
| Postal address of the controller / responsible party | Add it to the privacy policy if you are comfortable publishing one (a PO box is fine) | Owner | Open |
| Tasmania: no published licence | Email CBOS (draft above) | Owner | Open, optional |
| Mexico: confirm the live XML endpoint is still official | Email the CNE (draft above) | Owner | Open, optional |
| Western Australia: no written licence | Email FuelWatch (draft above) | Owner | Open, optional |
| Queensland: reporting duty and $1 fee | Decide whether to sign; Pumpwise cannot report user numbers by state | Owner | Open |
| Portuguese words, store listing and legal texts | Portuguese added to the app (src/i18n/pt.ts), STORE_LISTING.md and legal/*.pt.md | Claude | Done 8 Nov 2026 |

## Remaining sources investigated and not added (8 November 2026)

| Place | Finding |
|---|---|
| South Korea (Opinet, Korea National Oil Corporation) | The free API key is granted automatically but the whole-country price list is a paid "premium" API; the copyright policy requires the Corporation's prior agreement for any use that earns money (the app has an ad) `[retrieved 2026-11-08]`. Possible only through a partnership agreement with KNOC, plus a Korean translation. |
| Chile (Comisión Nacional de Energía, api.cne.cl) | Free after registration; the documentation is only shown after signing in, so the data format and licence could not be checked. Needs the owner's sign-up first. |
| Colombia (datos.gov.co, Ministerio de Minas y Energía) | Station prices are monthly averages, last updated May 2026; licence CC BY-SA 4.0. Not fresh enough. |
| Peru (datosabiertos.gob.pe, Osinergmin) | The daily price list is published monthly with station names anonymised and no coordinates; licence ODC-BY. Not usable. |
| Cyprus | No open dataset of station prices was found; the Ministry publishes weekly sample averages. |
| Greece (fuelprices.gr), Croatia (mzoe-gor.hr), Romania (Monitorul Prețurilor) | Websites only, no open-data licence or API found; each would also need a new language. |
| Brazil (ANP) | Official weekly survey of a sample of stations, published the following week. Possible later only as "surveyed in the week of …", with a Portuguese interface. |
| Germany (MTS-K / Tankerkönig) | Tankerkönig's free CC BY 4.0 API allows a 25 km radius and one request a minute, so no whole-country polling; direct MTS-K data goes only to consumer-information services approved by the Bundeskartellamt, which requires a formal application. |
| Austria (E-Control) | By law the API returns prices only for the cheapest stations near a point. Not a full price map. |
| Victoria (Servo Saver API, CC BY 4.0) | Requires an application to Service Victoria and the prices are 24 hours old. Possible if the owner wants a "yesterday's prices" region. |
| South Australia, Northern Territory | SA gives data to approved publishers only (application required); the NT has no confirmed live feed. |

Citations in this document were gathered by an AI assistant and have not been verified against a legal research service. Before relying on any licence term, statute or authority named here, check it against the linked official page.
