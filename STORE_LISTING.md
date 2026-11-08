# Pumpwise: App Store listing

Everything below fits Apple's field limits (counts given per field). Paste as-is. The first release covers Western Australia; the listing is written in **English (Australia)**.

## Identity

| Field | Value |
|-------|-------|
| App name | Pumpwise: Fuel Prices Near Me |
| Primary language | English (Australia) |
| Bundle ID | `com.tyjcraw.pumpwise` (internal, cannot change after the first upload) |
| SKU | `pumpwise` |
| Version | 1.0.0 (in review); 1.1.0 next, see "Version 1.1.0"; 1.2.0 after that, see "Version 1.2.0" |
| Primary category | Navigation |
| Secondary category | Travel |
| Price | Free. No in-app purchases. 1.0 has no adverts; 1.1 adds one banner (AdMob). |
| Availability | Australia; add Spain, France, Portugal and Mexico with 1.2 (see "Version 1.2.0") |
| Age rating | 4+ (answer "None" to every content question) |
| Copyright | Use the same line as Bowerly |
| Privacy policy URL | https://tjcraw6589.github.io/pumpwise/privacy.html |
| Support URL | https://tjcraw6589.github.io/pumpwise/ |
| Marketing URL | https://tjcraw6589.github.io/pumpwise/ |
| Support email | tyjcraw@gmail.com |

"Pumpwise" was checked with the iTunes Search API in the Australian, UK and US App Stores on 28 October 2026: no app uses it.

## Text

**Name** (30 max, 29 used)
```
Pumpwise: Fuel Prices Near Me
```

**Subtitle** (30 max, 27 used)
```
Today's & tomorrow's petrol
```

**Promotional text** (170 max, 131 used)
```
Open it anywhere in WA: the nearest servo and the cheapest one around you, with today's official prices and tomorrow's from 2:30pm.
```

**Keywords** (100 max, 97 used; no spaces, no words already in the name or subtitle)
```
fuelwatch,perth,wa,servo,diesel,unleaded,cheap,station,map,lpg,e85,98,premium,costco,save,bunbury
```

**Description**
```
Pumpwise shows you two things the moment it opens: the nearest servo, and the cheapest one inside the area you choose. One tap gets you directions.

In Western Australia every station must lock in its price for the whole day from 6am, and publish tomorrow's price by 2:30pm. Pumpwise uses those official FuelWatch prices, so you know exactly what you'll pay today, and whether it's worth waiting until tomorrow.

FILL UP TODAY OR WAIT?
After 2:30pm Pumpwise shows tomorrow's price next to today's, and tells you if prices around you are about to drop or rise.

MADE FOR THE ROAD
• Opens straight to the answer: cheapest within your area, nearest to you.
• Big, clear prices styled like the signs at the servo.
• Directions in Apple Maps, Google Maps or Waze.
• Follows you as you drive, so the list updates as you go.

WORTH THE DRIVE?
A cheaper station 10 km away isn't always a saving. Pumpwise counts the fuel you'd burn getting there and back, using your car's fuel use, and tells you in dollars what you'd really save. Sort by "Best value" to see the true cheapest.

PRICES YOU CAN TRUST
• Official prices that stations are required to report.
• Closed stations, members-only stations and remote sites that need an entry permit are never picked as the cheapest (members can switch members-only stations on).
• Obvious reporting mistakes are filtered out.

EVERYTHING YOU NEED
• Unleaded 91, Premium 95, Premium 98, diesel, premium diesel, LPG and E85.
• Search areas from 2 to 40 km.
• A map of every price around you, coloured from cheapest to dearest.
• Opening hours and facilities for each station.
• Search any WA suburb, town or postcode when you're planning a trip.
• Light and dark mode.

PRIVATE BY DESIGN
No account, no adverts, no tracking. Your location is only used on your iPhone while the app is open, and is never sent to us.

Please don't use Pumpwise while driving. Let a passenger check, or look before you set off.

Prices from FuelWatch, Government of Western Australia: www.fuelwatch.wa.gov.au. Pumpwise is not affiliated with any government, station or fuel brand.
```

**What's New** (version 1.0.0)
```
First release, covering Western Australia.
```

## Version 1.1.0

Paste one of these into **What's New in This Version** (4,000 max). Use the first only once https://tjcraw6589.github.io/pumpwise/data/v3/meta.json shows `"nsw": {"status": "live"`; otherwise use the second.

**What's New**, if NSW is live
```
New South Wales, the ACT and Tasmania are here, with official FuelCheck prices.

• Fairer "worth the drive" advice: a detour only counts when it saves at least a dollar.
• Price colours that mean something: green is within 2c of the cheapest.
• A tidier map that shows more prices as you zoom in.
• Better with VoiceOver, on smaller iPhones and in dark mode.
• A small banner ad on the Nearby tab keeps Pumpwise free.
```

**What's New**, Western Australia only
```
• Fairer "worth the drive" advice: a detour only counts when it saves at least a dollar.
• Price colours that mean something: green is within 2c of the cheapest.
• A tidier map that shows more prices as you zoom in.
• Better with VoiceOver, on smaller iPhones and in dark mode.
• A small banner ad on the Nearby tab keeps Pumpwise free.
```

**Other listing changes for 1.1**
- App Information → "Contains ads?": **Yes**.
- Description, PRIVATE BY DESIGN: replace "No account, no adverts, no tracking." with "No account. A small ad keeps it free."
- App Privacy: the new label is in `ADS.md` step 4 ("Data Not Collected" no longer applies once ads are in).
- If NSW is live: add this line after the first paragraph of the description, and use the NSW keyword set below:

```
Now also in New South Wales, the ACT and Tasmania, with official FuelCheck prices that stations must update whenever they change.
```

## Version 1.2.0: Spain, France, Portugal and Mexico

1.2 reads feed v4 (WA, NSW/ACT, Tasmania, Spain, France, Portugal, Mexico; Queensland once its key is in) and speaks English, Spanish, French and Portuguese, picked from the iPhone's language. Prices show the way each country's pumps write them: 189.9 (cents) in Australia, 1,659 (euros) in Spain, France and Portugal, 24.59 (pesos) in Mexico. The privacy policy and terms exist in all four languages (legal/*.md).

### In App Store Connect (all free, nothing to pay)

1. **Pricing and Availability** → Availability → **Edit** → tick **Spain**, **France**, **Portugal** and **Mexico** (keep Australia) → Done → Save.
2. **App Information** → Localizable Information → the language menu at the top right → **Add Language**: add **Spanish (Spain)**, **Spanish (Mexico)**, **French** and **Portuguese (Portugal)**. For each one, paste the name and subtitle below.
3. On the **1.2.0** version page, switch to each new language with the same menu and paste its promotional text, description, keywords and What's New. Screenshots: if you don't upload Spanish or French ones, App Store Connect uses the English ones.
4. Nothing changes in **App Privacy**: no new data is collected.

### English (Australia)

**What's New**
```
Pumpwise now covers Spain, France, Portugal and Mexico, with official government prices.

• Spanish, French and Portuguese: Pumpwise follows your iPhone's language.
• Prices the way each country writes them: 1,659 in Spain, France and Portugal, 24.59 in Mexico.
• Tidier station names and addresses.
```

**Keywords, 1.2** (98 of 100 characters; Spanish and French words go in their own listings)
```
perth,sydney,nsw,wa,tas,hobart,canberra,servo,diesel,unleaded,ulp,e10,cheap,station,lpg,98,premium
```

Description: add this line after the first paragraph.
```
Also in Spain, France, Portugal and Mexico, with each government's official prices.
```

### Spanish (Spain)

**Name** (29 of 30)
```
Pumpwise: Gasolineras baratas
```
**Subtitle** (29 of 30)
```
Precios oficiales cerca de ti
```
**Promotional text** (129 of 170)
```
Abre Pumpwise y mira al momento la gasolinera más cercana y la más barata a tu alrededor, con los precios oficiales del Gobierno.
```
**Keywords** (100 of 100)
```
gasolina,gasoil,diesel,precio,combustible,repostar,madrid,barcelona,valencia,sevilla,mapa,ahorro,glp
```
**Description**
```
Pumpwise te muestra dos cosas nada más abrirla: la gasolinera más cercana y la más barata dentro de la zona que elijas. Un toque y tienes cómo llegar.

Los precios son los oficiales que las gasolineras deben comunicar al Ministerio para la Transición Ecológica, los mismos del Geoportal de Gasolineras, con tres decimales como en el surtidor.

¿MERECE LA PENA EL DESVÍO?
Una gasolinera más barata a 10 km no siempre sale a cuenta. Pumpwise suma el combustible que gastarías en ir y volver, según el consumo de tu coche, y te dice en euros lo que ahorras de verdad. Ordena por «Más rentable» para ver la opción que de verdad sale más barata.

PENSADA PARA LA CARRETERA
• Se abre directamente con la respuesta: la más barata de tu zona y la más cercana.
• Precios grandes y claros, como los carteles de la gasolinera.
• Cómo llegar con Apple Maps, Google Maps o Waze.
• Te sigue mientras conduces, así que la lista se actualiza sobre la marcha.

TODO LO QUE NECESITAS
• Gasolina 95, Gasolina 98, diésel, diésel premium, GLP y más.
• Zonas de búsqueda de 2 a 40 km.
• Un mapa con todos los precios a tu alrededor.
• El horario de cada gasolinera.
• Modo claro y oscuro.

PRIVADA POR DISEÑO
Sin cuenta. Un pequeño anuncio la mantiene gratis. Tu ubicación solo se usa en tu iPhone mientras la app está abierta y nunca se nos envía.

No uses Pumpwise mientras conduces. Que mire un acompañante, o mira antes de salir.

También funciona en Francia, Portugal, México y partes de Australia.

Precios del Geoportal de Gasolineras, Ministerio para la Transición Ecológica y el Reto Demográfico. Pumpwise no está vinculada a ningún gobierno, gasolinera ni marca de combustible.
```
**What's New**
```
Pumpwise ya está en España, Francia, Portugal y México, con los precios oficiales de cada gobierno.

• La app, en español, francés y portugués.
• Los precios, como en el surtidor: 1,659 en España.
```

### Spanish (Mexico)

**Name** (29 of 30)
```
Pumpwise: Gasolina más barata
```
**Subtitle** (29 of 30)
```
Precios oficiales cerca de ti
```
**Promotional text** (126 of 170)
```
Abre Pumpwise y mira al momento la gasolinera más cercana y la más barata a tu alrededor, con los precios oficiales de la CRE.
```
**Keywords** (92 of 100)
```
gasolina,magna,premium,diesel,precio,cdmx,monterrey,guadalajara,puebla,litro,mapa,ahorro,cre
```
**Description**
```
Pumpwise te muestra dos cosas en cuanto la abres: la gasolinera más cercana y la más barata dentro de la zona que elijas. Un toque y tienes cómo llegar.

Los precios son los que las gasolineras reportan a la Comisión Reguladora de Energía (CRE) y que el Gobierno de México publica como datos abiertos.

¿VALE LA PENA EL DESVÍO?
Una gasolinera más barata a 10 km no siempre conviene. Pumpwise suma la gasolina que gastarías en ir y volver, según el rendimiento de tu auto, y te dice en pesos lo que de verdad ahorras. Ordena por «Más rentable» para ver la opción que realmente sale más barata.

PENSADA PARA EL CAMINO
• Se abre directamente con la respuesta: la más barata de tu zona y la más cercana.
• Precios grandes y claros, como los letreros de la gasolinera.
• Cómo llegar con Apple Maps, Google Maps o Waze.
• Te sigue mientras manejas, así que la lista se actualiza sobre la marcha.

TODO LO QUE NECESITAS
• Magna, Premium y diésel.
• Zonas de búsqueda de 2 a 40 km.
• Un mapa con todos los precios a tu alrededor.
• Modo claro y oscuro.

PRIVADA POR DISEÑO
Sin cuenta. Un pequeño anuncio la mantiene gratis. Tu ubicación solo se usa en tu iPhone mientras la app está abierta y nunca se nos envía.

No uses Pumpwise mientras manejas. Que revise un acompañante, o revisa antes de salir.

También funciona en España, Francia, Portugal y partes de Australia.

Precios de la Comisión Reguladora de Energía (CRE), Gobierno de México. Pumpwise no está vinculada a ningún gobierno, gasolinera ni marca de combustible.
```
**What's New**
```
Pumpwise ya está en México, España, Francia y Portugal, con los precios oficiales de cada gobierno.

• La app, en español, francés y portugués.
• Los precios, como en la bomba: 24.59 en México.
```

### French

**Name** (30 of 30)
```
Pumpwise – Prix des carburants
```
**Subtitle** (25 of 30)
```
La station la moins chère
```
**Promotional text** (133 of 170)
```
Ouvrez Pumpwise et voyez tout de suite la station la plus proche et la moins chère autour de vous, avec les prix officiels de l’État.
```
**Keywords** (94 of 100)
```
essence,gazole,diesel,prix,carburant,sp95,e10,sp98,e85,gpl,paris,lyon,marseille,toulouse,plein
```
**Description**
```
Pumpwise vous montre deux choses dès l’ouverture : la station la plus proche et la moins chère dans la zone que vous choisissez. Un geste, et l’itinéraire s’ouvre.

Les prix sont ceux que les stations doivent déclarer à l’État, publiés sur prix-carburants.gouv.fr, avec l’heure de chaque mise à jour.

LE DÉTOUR EN VAUT-IL LA PEINE ?
Une station moins chère à 10 km n’est pas toujours une économie. Pumpwise compte le carburant consommé pour l’aller-retour, selon la consommation de votre voiture, et vous dit en euros ce que vous économisez vraiment. Triez par « Meilleur choix » pour voir la vraie bonne affaire.

PENSÉE POUR LA ROUTE
• S’ouvre directement sur la réponse : la moins chère de votre zone et la plus proche.
• Des prix grands et lisibles, comme sur les panneaux des stations.
• Itinéraire avec Plans, Google Maps ou Waze.
• Vous suit pendant que vous roulez : la liste se met à jour en route.

TOUT CE QU’IL VOUS FAUT
• SP95-E10, SP95, SP98, gazole, E85 et GPLc.
• Zones de recherche de 2 à 40 km.
• Une carte de tous les prix autour de vous.
• Horaires et services de chaque station.
• Mode clair et sombre.

CONFIDENTIELLE PAR CONCEPTION
Sans compte. Une petite publicité la garde gratuite. Votre position n’est utilisée que sur votre iPhone, quand l’app est ouverte, et ne nous est jamais envoyée.

N’utilisez pas Pumpwise en conduisant. Laissez un passager regarder, ou regardez avant de partir.

Fonctionne aussi en Espagne, au Portugal, au Mexique et dans une partie de l’Australie.

Prix issus de prix-carburants.gouv.fr (Licence Ouverte 2.0). Pumpwise n’est lié à aucun gouvernement, aucune station ni aucune marque de carburant.
```
**What's New**
```
Pumpwise arrive en France, en Espagne, au Portugal et au Mexique, avec les prix officiels de chaque État.

• L’app en français, en espagnol et en portugais.
• Les prix comme à la pompe : 1,659 en France.
```

### Portuguese (Portugal)

**Name** (28 of 30)
```
Pumpwise: Combustível barato
```
**Subtitle** (29 of 30)
```
Preços oficiais perto de si
```
**Promotional text** (131 of 170)
```
Abra o Pumpwise e veja logo o posto mais próximo e o mais barato à sua volta, com os preços oficiais publicados na DGEG.
```
**Keywords** (97 of 100)
```
gasolina,gasóleo,diesel,preço,combustível,abastecer,lisboa,porto,braga,coimbra,faro,mapa,poupar,gpl
```
**Description**
```
O Pumpwise mostra-lhe duas coisas assim que abre: o posto mais próximo e o mais barato dentro da zona que escolher. Um toque e tem o trajeto.

Os preços são os que os postos publicam no serviço oficial da Direção-Geral de Energia e Geologia (DGEG), com três casas decimais como na bomba e a hora da última atualização de cada um.

VALE A PENA O DESVIO?
Um posto mais barato a 10 km nem sempre compensa. O Pumpwise soma o combustível que gastaria na ida e volta, segundo o consumo do seu carro, e diz-lhe em euros quanto poupa de verdade. Ordene por «Melhor escolha» para ver a opção que realmente fica mais barata.

PENSADO PARA A ESTRADA
• Abre diretamente com a resposta: o mais barato da sua zona e o mais próximo.
• Preços grandes e claros, como nos painéis dos postos.
• Trajeto com o Apple Maps, o Google Maps ou o Waze.
• Acompanha-o enquanto conduz, por isso a lista atualiza-se pelo caminho.

TUDO O QUE PRECISA
• Gasolina 95 e 98, simples e aditivada, gasóleo simples e aditivado, GPL Auto.
• Zonas de pesquisa de 2 a 40 km.
• Um mapa com todos os preços à sua volta.
• Modo claro e escuro.

PRIVADO POR DESENHO
Sem conta. Um pequeno anúncio mantém-no gratuito. A sua localização só é usada no seu iPhone enquanto a app está aberta e nunca nos é enviada.

Não use o Pumpwise enquanto conduz. Peça a um passageiro para ver, ou veja antes de partir.

Também funciona em Espanha, França, México e em parte da Austrália.

Preços da Direção-Geral de Energia e Geologia (DGEG). O Pumpwise não está ligado a nenhum governo, posto ou marca de combustível.
```
**What's New**
```
O Pumpwise chegou a Portugal, Espanha, França e México, com os preços oficiais de cada governo.

• A app em português, espanhol e francês.
• Os preços como na bomba: 1,759 em Portugal.
```

### Review notes for 1.2
```
Pumpwise shows official fuel prices that stations must report to government schemes: FuelWatch (Western Australia), FuelCheck (New South Wales, the ACT and Tasmania), the Geoportal de Gasolineras (Spain), prix-carburants.gouv.fr (France), the DGEG (Portugal) and the Comisión Nacional de Energía (Mexico). Each source is credited, with a link, on every screen with prices; the licences are listed at https://tjcraw6589.github.io/pumpwise/data-licences.html.

If you are reviewing somewhere else, the app says which places it covers after you allow location. Tap "Look around Perth", or choose a city such as Madrid, Paris, Lisboa or Ciudad de México from the place list, to see live prices. The app follows the iPhone's language: English, Spanish, French or Portuguese.

No account and no in-app purchases. One small banner ad on the Nearby tab. Location is used only while the app is open and never leaves the device.
```

## ASO check for 1.1 (ASO.dev plugin skills, 3 November 2026)

Checked with the ASO.dev `metadata-validation`, `keyword-research` and `whats-new-release-notes` rules. Pumpwise isn't live yet, so there are no rankings, ratings or downloads to score; this covers the text only.

**Status: pass with one fix for 1.1.**

| Field | Finding | Action |
|---|---|---|
| Keywords | `costco` is another company's name, and Costco has its own app showing fuel prices. Apple guideline 2.3.7 bans other apps' and companies' names in keywords. | Drop it in 1.1 (1.0 is in review and can't be changed). |
| Keywords | `fuelcheck` would be the name of NSW's own app (FuelCheck), so it must not be added. | Use place names instead (set below). |
| Keywords | `fuelwatch` is the WA Government scheme's name, credited as the source. Lower risk, but it is still someone else's name. | Your call; the WA set below keeps it. |
| Subtitle | "Today's & tomorrow's petrol" is only true in WA: NSW and Tasmania have no tomorrow prices. | Keep it while WA is the only region; switch when NSW is live. |
| What's New | Leads with what users get, specific, no overstated fixes, one honest line about the ad. | Ready to paste. |
| Description | Claims match the app (official prices, members-only handling, hours). "No adverts" must go in 1.1 (already listed above). | As listed above. |

**1.1 keywords, WA only** (99 of 100 characters; `costco` out, `ulp` and `pulp` in: the pump names WA drivers use)
```
fuelwatch,perth,wa,servo,diesel,unleaded,ulp,pulp,cheap,station,map,lpg,e85,98,premium,save,bunbury
```

**1.1 keywords, NSW live** (98 of 100 characters)
```
perth,sydney,nsw,wa,tas,hobart,canberra,servo,diesel,unleaded,ulp,e10,cheap,station,lpg,98,premium
```

**1.1 subtitle, NSW live** (23 of 30 characters). With this subtitle, `servo` is already indexed, so swap it for `save` in the keywords.
```
Cheapest servo near you
```

## Screenshots

Made by `node scripts/screenshots.mjs store` from the web build, showing live FuelWatch prices around Perth on the day they were taken. App Store Connect's main iPhone slot ("iPhone with Dynamic Island", 6.1"/6.3") only accepts 1206 x 2622, so upload `store/screenshots/iphone-6.3/`; it says "file dimensions are invalid" for the 6.9" (1320 x 2868) and 6.5" (1284 x 2778) sets, which are kept for the optional larger-display slots in Media Manager. iPad screenshots are not needed: the app is iPhone only.

## App Privacy (App Store Connect → App Privacy)

- Data collection: **No, we do not collect data from this app.**
- Reason: location is used only on the device and is never sent to the developer or any third party. Price files are downloaded from a public website (GitHub Pages); place search sends only the typed text to Apple's map service (or postcodes.io for UK postcodes). Nothing is linked to the user or used for tracking.
- The privacy manifest in the app agrees: `NSPrivacyTracking` false, no collected data types.

## App Review information

| Field | Value |
|-------|-------|
| Sign-in required | No (untick) |
| Contact email | tyjcraw@gmail.com |
| Review notes | See below |

**Review notes**
```
Pumpwise shows official fuel prices published by FuelWatch (Government of Western Australia), which allows its data to be used in apps with an acknowledgement and link (shown on every screen with prices and on each station page).

The first release covers Western Australia. If you are reviewing elsewhere, the app says "Pumpwise covers Western Australia" after you allow location. Tap "Look around Perth" (or any city in the place list) to see live prices. Everything else works the same: tap the cheapest station for its price board (today and, after 2:30pm Perth time, tomorrow), try Directions, change fuel with the chip at the top, and change the search area.

No account, no in-app purchases and no adverts. Location is used only while the app is open and never leaves the device.
```

## Export compliance

`ITSAppUsesNonExemptEncryption` is false in the app, so no export compliance questions come up when a build is uploaded.
