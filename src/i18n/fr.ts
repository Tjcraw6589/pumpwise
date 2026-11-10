import type { Strings } from './en';

/** A non-breaking space, which French puts before : ? ! and inside « », so they never start a line. */
const NB = ' ';

/** French. */
export const fr: Strings = {
  // Prix et unités
  'unit.euros': 'euros',
  'unit.pesos': 'pesos',
  'unit.pence': 'pence',
  'unit.cents': 'cents',
  'price.perLitreSpoken': (value: string, unit: string) => `${value} ${unit} le litre`,
  'units.underTenthMile': 'Moins de 0,1 mi',
  'list.join': (first: string, last: string) => `${first} et ${last}`,

  // Temps
  'time.unknown': 'heure inconnue',
  'time.justNow': 'à l’instant',
  'time.ago': (span: string) => `il y a ${span}`,
  'time.minutes': (n: number) => `${n} min`,
  'time.hours': (n: number) => `${n} h`,
  'time.days': (n: number) => (n === 1 ? '1 jour' : `${n} jours`),

  // Fraîcheur d'un prix
  'fresh.updated': (ago: string) => `Mis à jour ${ago}`,
  'fresh.unchangedFor': (span: string) => `Inchangé depuis ${span}`,
  'fresh.notConfirmedSince': (ago: string) => `Non confirmé depuis ${ago.replace(/^il y a /, '')}`,
  'fresh.reported': (ago: string) => `Signalé ${ago}`,
  'fresh.current': 'Prix en vigueur',
  'fresh.dateUnknown': 'Date inconnue',
  'fresh.newFrom6': 'Nouveau prix dès 6 h',
  'fresh.from6Tomorrow': 'Prix à partir de demain 6 h',
  'fresh.today': 'Prix du jour',
  'fresh.fromDay': (day: string) => `Prix du ${day.toLowerCase()}`,

  // Jours, lundi d'abord
  'day.0': 'Lundi',
  'day.1': 'Mardi',
  'day.2': 'Mercredi',
  'day.3': 'Jeudi',
  'day.4': 'Vendredi',
  'day.5': 'Samedi',
  'day.6': 'Dimanche',

  // Horaires
  'hours.closedNow': 'Fermée pour le moment',
  'hours.tomorrow': 'demain',
  'hours.onDay': (day: string) => day.toLowerCase(),
  'hours.closedOpensDay': (when: string) => `Fermée · ouvre ${when}`,
  'hours.closedOpensDayAt': (when: string, clock: string) => `Fermée · ouvre ${when} à ${clock}`,
  'hours.closed': 'Fermée',
  'hours.dayClosed': 'Fermé',
  'hours.openUntil': (clock: string) => `Ouverte jusqu’à ${clock}`,
  'hours.open24': 'Ouverte 24 h/24',
  'hours.closedOpensAt': (clock: string) => `Fermée · ouvre à ${clock}`,
  'hours.notGiven': 'Non communiqué',
  'hours.allDay': '24 h/24',

  // Avertissements sur les données
  'warn.todayMissing': 'Les prix du jour ne sont pas encore arrivés. Voici les derniers que nous avons.',
  'warn.feedOld': (ago: string) => `Les prix ont été mis à jour ${ago}. Ils ont pu changer depuis.`,

  // Où l'on cherche
  'area.near': (name: string) => `Près de ${name}`,
  'area.nearYou': 'Près de vous',
  'area.hintHere': 'Juste à côté',
  'area.hintShort': 'Quelques minutes de route',
  'area.hintDetour': 'Vaut le détour',
  'area.hintWide': 'Recherche large',
  'search.within': (radius: string) => `Jusqu’à ${radius}`,
  'search.fuel': 'Carburant',
  'search.area': 'Zone de recherche',

  // Prix de demain (Australie-Occidentale)
  'tomorrow.spoken': (price: string, change: string) => `Demain ${price}, ${change}`,
  'tomorrow.compact': (price: string) => `${price} demain`,
  'tomorrow.full': (price: string, change: string) => `Demain ${price} (${change})`,

  // Étiquettes des stations
  'tag.membersOnly': 'Réservée aux membres',
  'tag.permitNeeded': 'Permis requis',
  'tag.permitEntry': 'Permis d’accès requis',
  'tag.unmanned': 'Automate, carte uniquement',
  'tag.lowAromatic': 'Carburant à faible teneur aromatique',
  'tag.motorway': 'Aire d’autoroute',
  'tag.supermarket': 'Supermarché',
  'tag.toilets': 'Toilettes',
  'tag.carWash': 'Lavage auto',
  'tag.payAtPump': 'Paiement à la pompe 24 h/24',
  'tag.adblue': 'AdBlue',
  'tag.lpg': 'GPL',
  'tag.air': 'Gonflage',
  'tag.water': 'Eau',
  'tag.atm': 'Distributeur de billets',
  'tag.truck': 'Accès poids lourds',

  // Boutons courants
  'action.directions': 'Itinéraire',
  'action.details': 'Détails',
  'action.close': 'Fermer',
  'action.back': 'Retour',
  'action.tryAgain': 'Réessayer',
  'action.retry': 'Réessayer',
  'action.allowLocation': 'Autoriser la localisation',
  'action.choosePlace': 'Choisir un lieu',
  'action.continue': 'Continuer',
  'action.cancel': 'Annuler',
  'a11y.opensStation': 'Ouvre les prix et les horaires de la station',

  // Onglets
  'tab.nearby': 'À proximité',
  'tab.map': 'Carte',
  'tab.settings': 'Réglages',

  // Lignes de la liste
  'row.total': (money: string) => `${money} au total`,
  'row.till': (clock: string) => `Jusqu’à ${clock}`,

  // Chargement, vide et erreurs
  'state.loading': 'Chargement des prix',
  'state.permissionTitle': 'Voyez les prix autour de vous',
  'state.permissionBody':
    'Pumpwise utilise votre position pour trouver la station la plus proche et la moins chère près de vous. Votre position exacte reste sur votre iPhone.',
  'state.choosePlaceInstead': 'Choisir plutôt un lieu',
  'state.deniedTitle': 'La localisation est désactivée',
  'state.deniedBodyAsk':
    'Pumpwise a besoin de votre position pour afficher ce qui est proche. Vous pouvez aussi chercher autour d’une ville ou d’un code postal.',
  'state.deniedBodySettings': 'Activez la localisation pour Pumpwise dans Réglages, ou cherchez autour d’une ville ou d’un code postal.',
  'state.openSettings': 'Ouvrir Réglages',
  'state.locationErrorTitle': 'Impossible de vous localiser',
  'state.locationErrorBody': 'Votre iPhone n’a pas pu obtenir votre position. Cela arrive à l’intérieur ou en sous-sol.',
  'state.notCoveredTitle': 'Pas encore de prix officiels ici',
  'state.notCoveredBody': 'Pumpwise affiche les prix que les gouvernements publient pour chaque station, et ils ne sont pas encore publiés ici. Vous pouvez consulter l’un de ces endroits.',
  'state.coveredPlaces': 'Lieux avec des prix officiels',
  'country.AU': 'Australie',
  'country.ES': 'Espagne',
  'country.FR': 'France',
  'country.MX': 'Mexique',
  'country.PT': 'Portugal',
  'country.GB': 'Royaume-Uni',
  'state.lookAround': (city: string) => `Voir ${city}`,
  'state.regionDownTitle': 'Les prix arrivent',
  'state.regionDownBody': (region: string) => `Prix indisponibles pour le moment (${region}). Ils reviennent en général dans l’heure.`,
  'state.offlineTitle': 'Pas de connexion',
  'state.offlineBody': 'Pumpwise a besoin d’une connexion de données pour récupérer les derniers prix.',
  'state.errorTitle': 'Les prix ne se sont pas chargés',
  'state.errorBody': 'Le service de prix n’a pas répondu. Il revient en général en quelques minutes.',
  'state.checkAgain': 'Vérifier à nouveau',
  'state.emptyTitle': (radius: string) => `Rien à moins de ${radius}`,
  'state.emptyBody': (fuel: string, code: string) => `Aucune station de cette zone n’affiche de prix pour ${fuel} (${code}) en ce moment.`,
  'state.emptyTryWider': 'Essayez une zone plus large ou un autre carburant.',
  'state.emptyTryOther': 'Essayez un autre carburant, ou choisissez un lieu.',
  'state.searchWithin': (radius: string) => `Chercher jusqu’à ${radius}`,

  // Onglet À proximité
  'sort.cheapest': 'Moins chère',
  'sort.closest': 'Plus proche',
  'sort.value': 'Meilleur choix',
  'trend.drops': (fuel: string, amount: string) => `Demain, ${fuel} baisse d’environ ${amount} par ici. Attendez si vous pouvez.`,
  'trend.rises': (fuel: string, amount: string) => `Demain, ${fuel} augmente d’environ ${amount} par ici. Faites le plein aujourd’hui.`,
  'trend.same': (fuel: string) => `Demain, ${fuel} coûtera à peu près pareil qu’aujourd’hui par ici.`,
  'value.title': 'Meilleur choix, trajet compris',
  'value.withDrive': (money: string) => `${money} avec le carburant de l’aller-retour`,
  'nearby.refresh': 'Actualiser les prix',
  'nearby.searching': (area: string) => `Recherche${NB}: ${area}. Changer de lieu`,
  'nearby.checked': (ago: string) => `· vérifié ${ago}`,
  'nearby.couldntUpdate': (ago: string) => `Mise à jour impossible. Prix affichés${NB}: ${ago}.`,
  'nearby.allClosed': (radius: string) =>
    `Toutes les stations à moins de ${radius} sont fermées, réservées aux membres, ou n’ont pas confirmé leur prix récemment.`,
  'nearby.allNearby': 'Toutes les stations proches',
  'nearby.stations': (n: number) => (n === 1 ? '1 station' : `${n} stations`),
  'nearby.straightLine': 'Les distances sont à vol d’oiseau.',
  'report.priceWrong': `Prix faux à la pompe${NB}?`,

  // Cartes « moins chère » et « plus proche »
  'hero.cheapestWithin': (radius: string) => `La moins chère à moins de ${radius}`,
  'hero.alsoNearest': 'Aussi la plus proche',
  'hero.cheapestSpoken': (summary: string) => `La moins chère${NB}: ${summary}`,
  'hero.nearestSpoken': (summary: string) => `La plus proche${NB}: ${summary}`,
  'hero.nearestHint': 'Ouvre les prix et les horaires de la station. Balayez vers le haut ou le bas pour l’itinéraire.',
  'hero.nearest': 'La plus proche',
  'hero.nearestOutside': 'La plus proche (hors de votre zone)',
  'hero.directionsTo': (name: string) => `Itinéraire vers ${name}`,
  'hero.saves': 'Vous économisez',
  'hero.savesRest': (litres: number, extra: string, still: string) => `sur un plein de ${litres} L par rapport à la plus proche${extra}.${still}`,
  'hero.extraThereBack': (distance: string) => `, même avec les ${distance} de plus aller-retour`,
  'hero.betterStill': (name: string, money: string) => ` ${name}, plus bas, fait encore ${money} de mieux trajet compris.`,
  'hero.onlyAhead': (money: string, litres: number, distance: string, verdict: string) =>
    `Seulement ${money} d’écart sur un plein de ${litres} L en comptant les ${distance} de plus aller-retour. ${verdict}`,
  'hero.cheaperButFar': (distance: string, litres: number, verdict: string) =>
    `Moins chère à la pompe, mais les ${distance} de plus aller-retour coûtent plus que l’économie sur ${litres} L. ${verdict}`,
  'hero.verdictBetterPick': 'Le meilleur choix ci-dessous bat les deux.',
  'hero.verdictFine': 'La plus proche fait l’affaire aujourd’hui.',
  'hero.verdictNearest': 'La plus proche est la meilleure affaire.',

  // Onglet Carte
  'map.recentre': 'Recentrer la carte',
  'map.cheapest': 'La moins chère',
  'map.selected': 'Sélectionnée',
  'map.selectedStation': 'Station sélectionnée',
  'map.tryWider': 'Élargissez la zone avec le bouton en haut.',
  'map.background': 'Fond de carte',
  'map.webNote': 'Aperçu de la carte. L’app iPhone affiche Plans d’Apple.',

  // Écran station
  'station.title': 'Station',
  'station.notFound': 'Station introuvable',
  'station.notFoundBody': 'Les prix ont peut-être été actualisés. Revenez en arrière et choisissez-la à nouveau.',
  'station.today': 'Aujourd’hui',
  'station.tomorrow': 'Demain',
  'station.tomorrowSpoken': (price: string) => `demain ${price}`,
  'station.makeYourFuel': 'En fait votre carburant',
  'station.noPrice': (fuel: string) => `Pas de prix ${fuel} dans cette station.`,
  'station.hours': 'Horaires d’ouverture',
  'station.facilities': 'Dans cette station',

  // Onglet Réglages
  'settings.title': 'Réglages',
  'settings.showing': (region: string) => `Carburants et unités${NB}: ${region}.`,
  'settings.fuel': 'Votre carburant',
  'settings.areaHint': 'Jusqu’où chercher la station la moins chère. La plus proche est toujours affichée.',
  'settings.fill': 'Plein habituel',
  'settings.fillHint': 'Sert à montrer ce que vous économisez.',
  'settings.mpg': 'Miles par gallon de votre voiture',
  'settings.economy': 'Consommation de votre voiture',
  'settings.economyHint': (unit: string, money: string) =>
    `«${NB}Meilleur choix${NB}» ajoute le carburant de l’aller-retour. Chaque ${unit} de plus coûte environ ${money} aller-retour.`,
  'settings.members': 'Stations réservées aux membres',
  'settings.membersHint': 'Certaines stations, comme Costco, ne vendent qu’à leurs membres. Activez ceci si vous l’êtes.',
  'settings.includeMembers': 'Inclure les stations réservées aux membres',
  'settings.directions': 'Itinéraires dans',
  'settings.myLocation': 'Ma position',
  'settings.chosenPlace': 'Un lieu choisi',
  'settings.appearance': 'Apparence',
  'theme.system': 'Automatique',
  'theme.light': 'Clair',
  'theme.dark': 'Sombre',
  'settings.about': 'À propos',
  'settings.whereFrom': 'D’où viennent les prix',
  'settings.report': 'Signaler un prix faux',
  'settings.privacy': 'Confidentialité',
  'settings.adPrivacy': 'Choix de confidentialité des pubs',
  'settings.terms': 'Conditions d’utilisation',
  'settings.contact': 'Contacter l’assistance',
  'settings.reset': 'Réinitialiser les réglages',
  'settings.resetTitle': `Réinitialiser les réglages${NB}?`,
  'settings.resetMessage': 'Votre carburant, zone de recherche, plein, voiture et app de cartes reviennent aux valeurs par défaut.',
  'settings.resetConfirm': 'Réinitialiser',
  'settings.footer': (version: string) => `Pumpwise ${version} · Sans compte. Une petite pub la garde gratuite.`,

  // Choisir un lieu
  'place.title': 'Où chercher',
  'place.placeholder': 'Quartier, ville ou code postal',
  'place.noMatch': (places: string, query: string) => `Aucun résultat pour «${NB}${query}${NB}» (${places}).`,
  'place.searchDown': 'La recherche ne répond pas. Vérifiez votre connexion, ou choisissez une ville ci-dessous.',
  'place.useMyLocation': 'Utiliser ma position',
  'place.locationOff': 'La localisation est désactivée pour Pumpwise. Touchez pour ouvrir Réglages.',
  'place.follows': 'Vous suit pendant que vous roulez',
  'place.recent': 'Récents',
  'place.cities': 'Villes',
  'place.privacy':
    'La recherche utilise le service de cartes d’Apple (et postcodes.io pour les codes postaux britanniques). Seul ce que vous tapez est envoyé.',

  // D'où viennent les prix
  'about.title': 'D’où viennent les prix',
  'about.intro':
    'Pumpwise affiche les prix officiels que les stations doivent déclarer aux services de prix des gouvernements. Un nouveau lieu est ajouté dès qu’un gouvernement publie ses prix gratuitement.',
  'about.feed': (ago: string, count: string) => `Les données Pumpwise ont été actualisées ${ago} et couvrent ${count} stations.`,
  'about.priceWrong': (label: string) => `Prix faux${NB}? ${label}`,
  'about.rankTitle': 'Moins chère, plus proche et meilleur choix',
  'about.rankBody': `La moins chère est le prix le plus bas dans votre zone de recherche, dans une station ouverte. La plus proche est la station ouverte la plus près qui vend votre carburant. Le meilleur choix ajoute le carburant consommé pour l’aller-retour, selon la consommation de votre voiture${NB}: une station un peu plus chère juste à côté peut battre une station bon marché éloignée.`,
  'about.membersTitle': 'Stations réservées et isolées',
  'about.membersBody':
    'Les stations réservées aux membres, ou qui demandent un permis d’accès, sont signalées et jamais retenues comme la moins chère. Si vous êtes membre, vous pouvez les inclure dans Réglages.',
  'about.distanceTitle': 'Distances',
  'about.distanceBody': `Les distances sont à vol d’oiseau. Les routes sont plus longues${NB}: comptez un trajet un peu plus long.`,
  'about.independenceTitle': 'Indépendance',
  'about.independenceBody': 'Pumpwise n’est lié à aucun gouvernement, aucune station ni aucune marque de carburant.',

  // Premier lancement
  'onboard.skip': 'Passer',
  'onboard.headline': 'Le moins cher,\ntout près.',
  'onboard.pitch': 'Ouvrez Pumpwise et voyez la station la plus proche et la moins chère autour de vous, avec l’itinéraire en un geste.',
  'onboard.covering': (places: string) => ` Zones couvertes${NB}: ${places}.`,
  'onboard.cheapest': 'MOINS CHÈRE',
  'onboard.nearest': 'PLUS PROCHE',
  'onboard.factNsw': `Des prix officiels que les stations doivent déclarer par la loi${NB}: FuelWatch en Australie-Occidentale, FuelCheck en Nouvelle-Galles du Sud, dans le Territoire de la capitale australienne et en Tasmanie.`,
  'onboard.factWa':
    'Des prix officiels. En Australie-Occidentale, le prix de chaque station est fixe pour la journée, et ceux du lendemain sont publiés avant 14 h 30.',
  'onboard.factOfficial': 'Des prix officiels que les stations doivent déclarer par la loi, directement depuis le service de prix de chaque gouvernement.',
  'onboard.fuelTitle': `Quel carburant utilisez-vous${NB}?`,
  'onboard.fuelBody': 'Vous pouvez en changer à tout moment en haut de l’écran.',
  'onboard.locTitle': 'Trouvez les stations autour de vous',
  'onboard.locBody':
    'Pumpwise utilise votre position seulement quand l’app est ouverte, pour savoir ce qui est proche. Votre position exacte reste sur votre iPhone.',
  'onboard.driving': `Vous conduisez${NB}? Laissez un passager regarder, ou regardez avant de partir. L’itinéraire s’ouvre dans votre app de cartes.`,
  'onboard.notNow': 'Plus tard',

  // Documents juridiques (en anglais, la version qui fait foi)
  'legal.privacy': 'Politique de confidentialité',
  'legal.terms': 'Conditions d’utilisation',
  'legal.updated': (date: string) => `Dernière mise à jour${NB}: ${date}`,
  'legal.englishOnly': 'Ce document n’est disponible qu’en anglais.',

  // Page introuvable
  'notFound.title': 'Mauvais chemin',
  'notFound.body': 'Cette page n’existe pas dans Pumpwise.',
  'notFound.back': 'Retour aux prix à proximité',
};
