import type { Strings } from './en';

/** Spanish, neutral enough for Spain and Mexico ("gasolinera", "carga", "cómo llegar"). */
export const es: Strings = {
  // Precios y unidades
  'unit.euros': 'euros',
  'unit.pesos': 'pesos',
  'unit.pence': 'peniques',
  'unit.cents': 'céntimos',
  'price.perLitreSpoken': (value: string, unit: string) => `${value} ${unit} el litro`,
  'units.underTenthMile': 'Menos de 0,1 mi',
  'list.join': (first: string, last: string) => `${first} y ${last}`,

  // Tiempo
  'time.unknown': 'hora desconocida',
  'time.justNow': 'ahora mismo',
  'time.ago': (span: string) => `hace ${span}`,
  'time.minutes': (n: number) => `${n} min`,
  'time.hours': (n: number) => `${n} h`,
  'time.days': (n: number) => (n === 1 ? '1 día' : `${n} días`),

  // Lo reciente que es un precio
  'fresh.updated': (ago: string) => `Actualizado ${ago}`,
  'fresh.unchangedFor': (span: string) => `Sin cambios desde hace ${span}`,
  'fresh.notConfirmedSince': (ago: string) => `Sin confirmar desde ${ago}`,
  'fresh.reported': (ago: string) => `Comunicado ${ago}`,
  'fresh.current': 'Precio vigente',
  'fresh.dateUnknown': 'Fecha desconocida',
  'fresh.newFrom6': 'Nuevo precio desde las 6:00',
  'fresh.from6Tomorrow': 'Precio desde mañana a las 6:00',
  'fresh.today': 'Precio de hoy',
  'fresh.fromDay': (day: string) => `Precio del ${day.toLowerCase()}`,

  // Días, empezando por el lunes
  'day.0': 'Lunes',
  'day.1': 'Martes',
  'day.2': 'Miércoles',
  'day.3': 'Jueves',
  'day.4': 'Viernes',
  'day.5': 'Sábado',
  'day.6': 'Domingo',

  // Horario
  'hours.closedNow': 'Cerrada ahora',
  'hours.tomorrow': 'mañana',
  'hours.onDay': (day: string) => `el ${day.toLowerCase()}`,
  'hours.closedOpensDay': (when: string) => `Cerrada · abre ${when}`,
  'hours.closedOpensDayAt': (when: string, clock: string) => `Cerrada · abre ${when} a las ${clock}`,
  'hours.closed': 'Cerrada',
  'hours.dayClosed': 'Cerrado',
  'hours.openUntil': (clock: string) => `Abierta hasta las ${clock}`,
  'hours.open24': 'Abierta 24 horas',
  'hours.closedOpensAt': (clock: string) => `Cerrada · abre a las ${clock}`,
  'hours.notGiven': 'Sin datos',
  'hours.allDay': '24 horas',

  // Avisos sobre los datos
  'warn.todayMissing': 'Los precios de hoy aún no han llegado. Mostramos los últimos que tenemos.',
  'warn.feedOld': (ago: string) => `Los precios se actualizaron por última vez ${ago}. Puede que hayan cambiado.`,

  // Dónde se busca
  'area.near': (name: string) => `Cerca de ${name}`,
  'area.nearYou': 'Cerca de ti',
  'area.hintHere': 'Aquí al lado',
  'area.hintShort': 'A poca distancia',
  'area.hintDetour': 'Merece el desvío',
  'area.hintWide': 'Búsqueda amplia',
  'search.within': (radius: string) => `Hasta ${radius}`,
  'search.fuel': 'Combustible',
  'search.area': 'Zona de búsqueda',

  // Precio de mañana (Australia Occidental)
  'tomorrow.spoken': (price: string, change: string) => `Mañana ${price}, ${change}`,
  'tomorrow.compact': (price: string) => `${price} mañana`,
  'tomorrow.full': (price: string, change: string) => `Mañana ${price} (${change})`,

  // Etiquetas de gasolineras
  'tag.membersOnly': 'Solo socios',
  'tag.permitNeeded': 'Requiere permiso',
  'tag.permitEntry': 'Requiere permiso de acceso',
  'tag.unmanned': 'Sin personal, solo tarjeta',
  'tag.lowAromatic': 'Combustible bajo en aromáticos',
  'tag.motorway': 'Área de servicio de autopista',
  'tag.supermarket': 'Supermercado',
  'tag.toilets': 'Aseos',
  'tag.carWash': 'Lavado de coches',
  'tag.payAtPump': 'Pago en surtidor 24 h',
  'tag.adblue': 'AdBlue',
  'tag.lpg': 'GLP',
  'tag.air': 'Aire',
  'tag.water': 'Agua',
  'tag.atm': 'Cajero automático',
  'tag.truck': 'Apta para camiones',

  // Botones comunes
  'action.directions': 'Cómo llegar',
  'action.details': 'Detalles',
  'action.close': 'Cerrar',
  'action.back': 'Atrás',
  'action.tryAgain': 'Reintentar',
  'action.retry': 'Reintentar',
  'action.allowLocation': 'Permitir ubicación',
  'action.choosePlace': 'Elegir un lugar',
  'action.continue': 'Continuar',
  'action.cancel': 'Cancelar',
  'a11y.opensStation': 'Abre los precios y el horario de la gasolinera',

  // Pestañas
  'tab.nearby': 'Cerca',
  'tab.map': 'Mapa',
  'tab.settings': 'Ajustes',

  // Filas de la lista
  'row.total': (money: string) => `${money} en total`,
  'row.till': (clock: string) => `Hasta las ${clock}`,

  // Estados de carga, vacíos y errores
  'state.loading': 'Cargando precios',
  'state.permissionTitle': 'Mira los precios a tu alrededor',
  'state.permissionBody':
    'Pumpwise usa tu ubicación para encontrar la gasolinera más cercana y la más barata. Tu ubicación exacta no sale de tu iPhone.',
  'state.choosePlaceInstead': 'O elige un lugar',
  'state.deniedTitle': 'La ubicación está desactivada',
  'state.deniedBodyAsk': 'Pumpwise necesita tu ubicación para mostrar lo que tienes cerca. También puedes buscar por ciudad o código postal.',
  'state.deniedBodySettings': 'Activa la ubicación para Pumpwise en Ajustes, o busca por ciudad o código postal.',
  'state.openSettings': 'Abrir Ajustes',
  'state.locationErrorTitle': 'No te encontramos ahora mismo',
  'state.locationErrorBody': 'Tu iPhone no ha podido obtener tu ubicación. Puede pasar en interiores o bajo tierra.',
  'state.notCoveredTitle': 'Aquí todavía no hay precios oficiales',
  'state.notCoveredBody': 'Pumpwise muestra los precios que los gobiernos publican para cada gasolinera, y aquí aún no se publican. Puedes consultar cualquiera de estos lugares.',
  'state.coveredPlaces': 'Lugares con precios oficiales',
  'country.AU': 'Australia',
  'country.ES': 'España',
  'country.FR': 'Francia',
  'country.MX': 'México',
  'country.PT': 'Portugal',
  'country.GB': 'Reino Unido',
  'state.lookAround': (city: string) => `Ver ${city}`,
  'state.regionDownTitle': 'Los precios están en camino',
  'state.regionDownBody': (region: string) => `No hemos podido recoger los precios de ${region} ahora mismo. Suelen volver en menos de una hora.`,
  'state.offlineTitle': 'Sin conexión',
  'state.offlineBody': 'Pumpwise necesita conexión de datos para descargar los últimos precios.',
  'state.errorTitle': 'Los precios no se han cargado',
  'state.errorBody': 'El servicio de precios no ha respondido. Suele volver en unos minutos.',
  'state.checkAgain': 'Volver a comprobar',
  'state.emptyTitle': (radius: string) => `Nada a menos de ${radius}`,
  'state.emptyBody': (fuel: string, code: string) => `Ninguna gasolinera de esta zona tiene precio de ${fuel} (${code}) ahora mismo.`,
  'state.emptyTryWider': 'Prueba una zona más amplia u otro combustible.',
  'state.emptyTryOther': 'Prueba otro combustible o elige un lugar.',
  'state.searchWithin': (radius: string) => `Buscar hasta ${radius}`,

  // Pestaña Cerca
  'sort.cheapest': 'Más barata',
  'sort.closest': 'Más cerca',
  'sort.value': 'Más rentable',
  'trend.drops': (fuel: string, amount: string) => `Mañana ${fuel} baja unos ${amount} por aquí. Espera si puedes.`,
  'trend.rises': (fuel: string, amount: string) => `Mañana ${fuel} sube unos ${amount} por aquí. Llena hoy.`,
  'trend.same': (fuel: string) => `Mañana ${fuel} costará más o menos lo mismo que hoy por aquí.`,
  'value.title': 'La más rentable contando el trayecto',
  'value.withDrive': (money: string) => `${money} con el combustible de ida y vuelta`,
  'nearby.refresh': 'Actualizar precios',
  'nearby.searching': (area: string) => `Buscando: ${area}. Cambiar lugar`,
  'nearby.checked': (ago: string) => `· comprobado ${ago}`,
  'nearby.couldntUpdate': (ago: string) => `No se ha podido actualizar. Precios de ${ago}.`,
  'nearby.allClosed': (radius: string) =>
    `Todas las gasolineras a menos de ${radius} están cerradas, son solo para socios o no han confirmado su precio últimamente.`,
  'nearby.allNearby': 'Todas las cercanas',
  'nearby.stations': (n: number) => (n === 1 ? '1 gasolinera' : `${n} gasolineras`),
  'nearby.straightLine': 'Las distancias son en línea recta.',
  'report.priceWrong': '¿Precio incorrecto en el surtidor?',

  // Tarjetas de la más barata y la más cercana
  'hero.cheapestWithin': (radius: string) => `La más barata a menos de ${radius}`,
  'hero.alsoNearest': 'También la más cercana',
  'hero.cheapestSpoken': (summary: string) => `La más barata: ${summary}`,
  'hero.nearestSpoken': (summary: string) => `La más cercana: ${summary}`,
  'hero.nearestHint': 'Abre los precios y el horario de la gasolinera. Desliza arriba o abajo para ver cómo llegar.',
  'hero.nearest': 'La más cercana',
  'hero.nearestOutside': 'La más cercana (fuera de tu zona)',
  'hero.directionsTo': (name: string) => `Cómo llegar a ${name}`,
  'hero.saves': 'Ahorras',
  'hero.savesRest': (litres: number, extra: string, still: string) => `en una carga de ${litres} L frente a la más cercana${extra}.${still}`,
  'hero.extraThereBack': (distance: string) => `, incluso con los ${distance} de más de ida y vuelta`,
  'hero.betterStill': (name: string, money: string) => ` ${name}, más abajo, sale ${money} mejor aún contando el trayecto.`,
  'hero.onlyAhead': (money: string, litres: number, distance: string, verdict: string) =>
    `Solo ${money} menos en una carga de ${litres} L contando los ${distance} de más de ida y vuelta. ${verdict}`,
  'hero.cheaperButFar': (distance: string, litres: number, verdict: string) =>
    `Más barata en el surtidor, pero los ${distance} de más de ida y vuelta cuestan más de lo que ahorras en ${litres} L. ${verdict}`,
  'hero.verdictBetterPick': 'La más rentable, más abajo, gana a las dos.',
  'hero.verdictFine': 'Hoy te vale la más cercana.',
  'hero.verdictNearest': 'La más cercana sale mejor.',

  // Pestaña Mapa
  'map.recentre': 'Centrar mapa',
  'map.cheapest': 'La más barata',
  'map.selected': 'Seleccionada',
  'map.selectedStation': 'Gasolinera seleccionada',
  'map.tryWider': 'Prueba una zona más amplia con el botón de arriba.',
  'map.background': 'Fondo del mapa',
  'map.webNote': 'Vista previa del mapa. La app de iPhone usa Apple Maps.',

  // Pantalla de gasolinera
  'station.title': 'Gasolinera',
  'station.notFound': 'Gasolinera no encontrada',
  'station.notFoundBody': 'Puede que los precios se hayan actualizado. Vuelve atrás y elígela de nuevo.',
  'station.today': 'Hoy',
  'station.tomorrow': 'Mañana',
  'station.tomorrowSpoken': (price: string) => `mañana ${price}`,
  'station.makeYourFuel': 'Lo elige como tu combustible',
  'station.noPrice': (fuel: string) => `Esta gasolinera no tiene precio de ${fuel}.`,
  'station.hours': 'Horario',
  'station.facilities': 'En esta gasolinera',

  // Pestaña Ajustes
  'settings.title': 'Ajustes',
  'settings.showing': (region: string) => `Combustibles y unidades de ${region}.`,
  'settings.fuel': 'Tu combustible',
  'settings.areaHint': 'Hasta dónde buscar la más barata. La más cercana se muestra siempre.',
  'settings.fill': 'Carga habitual',
  'settings.fillHint': 'Sirve para mostrar lo que ahorras.',
  'settings.mpg': 'Millas por galón de tu coche',
  'settings.economy': 'Consumo de tu coche',
  'settings.economyHint': (unit: string, money: string) =>
    `«Más rentable» suma el combustible para ir y volver. Cada ${unit} de más cuesta unos ${money} de ida y vuelta.`,
  'settings.members': 'Gasolineras solo para socios',
  'settings.membersHint': 'Algunas gasolineras, como Costco, solo venden a socios. Actívalo si eres socio.',
  'settings.includeMembers': 'Incluir gasolineras solo para socios',
  'settings.directions': 'Abrir rutas en',
  'settings.myLocation': 'Mi ubicación',
  'settings.chosenPlace': 'Un lugar elegido',
  'settings.appearance': 'Apariencia',
  'theme.system': 'Automática',
  'theme.light': 'Clara',
  'theme.dark': 'Oscura',
  'settings.about': 'Información',
  'settings.whereFrom': 'De dónde vienen los precios',
  'settings.report': 'Avisar de un precio incorrecto',
  'settings.privacy': 'Privacidad',
  'settings.adPrivacy': 'Privacidad de los anuncios',
  'settings.terms': 'Condiciones de uso',
  'settings.contact': 'Contactar con soporte',
  'settings.reset': 'Restablecer ajustes',
  'settings.resetTitle': '¿Restablecer ajustes?',
  'settings.resetMessage': 'Tu combustible, zona de búsqueda, carga, coche y app de mapas vuelven a los valores iniciales.',
  'settings.resetConfirm': 'Restablecer',
  'settings.footer': (version: string) => `Pumpwise ${version} · Sin cuenta. Un pequeño anuncio la mantiene gratis.`,

  // Elegir un lugar
  'place.title': 'Dónde buscar',
  'place.placeholder': 'Barrio, ciudad o código postal',
  'place.noMatch': (places: string, query: string) => `Ningún resultado para «${query}» en ${places}.`,
  'place.searchDown': 'La búsqueda no responde. Revisa tu conexión o elige una ciudad de abajo.',
  'place.useMyLocation': 'Usar mi ubicación',
  'place.locationOff': 'La ubicación está desactivada para Pumpwise. Toca para abrir Ajustes.',
  'place.follows': 'Te sigue mientras conduces',
  'place.recent': 'Recientes',
  'place.cities': 'Ciudades',
  'place.privacy':
    'La búsqueda usa el servicio de mapas de Apple (y postcodes.io para códigos postales del Reino Unido). Solo se envía lo que escribes.',

  // De dónde vienen los precios
  'about.title': 'De dónde vienen los precios',
  'about.intro':
    'Pumpwise muestra los precios oficiales que las gasolineras deben comunicar a los servicios de precios de los gobiernos. Añade un lugar nuevo cada vez que un gobierno publica sus precios gratis.',
  'about.feed': (ago: string, count: string) => `Los datos de Pumpwise se actualizaron ${ago} y cubren ${count} gasolineras.`,
  'about.priceWrong': (label: string) => `¿Precio incorrecto? ${label}`,
  'about.rankTitle': 'La más barata, la más cercana y la más rentable',
  'about.rankBody':
    'La más barata es el precio más bajo dentro de tu zona de búsqueda en una gasolinera abierta. La más cercana es la gasolinera abierta más próxima que vende tu combustible. La más rentable suma el combustible que gastarías en ir y volver, según el consumo de tu coche, así que una gasolinera algo más cara al lado puede ganar a una barata que está lejos.',
  'about.membersTitle': 'Gasolineras solo para socios y remotas',
  'about.membersBody':
    'Las gasolineras que solo venden a socios, o que requieren un permiso de acceso, se señalan y nunca se eligen como la más barata. Si eres socio, puedes incluirlas en Ajustes.',
  'about.distanceTitle': 'Distancias',
  'about.distanceBody': 'Las distancias son en línea recta. Las carreteras son más largas, así que el trayecto será algo mayor.',
  'about.independenceTitle': 'Independencia',
  'about.independenceBody': 'Pumpwise no está vinculada a ningún gobierno, gasolinera ni marca de combustible.',

  // Primer uso
  'onboard.skip': 'Saltar',
  'onboard.headline': 'Gasolina barata,\ncerca de ti.',
  'onboard.pitch': 'Abre Pumpwise y mira la gasolinera más cercana y la más barata a tu alrededor, con indicaciones en un toque.',
  'onboard.covering': (places: string) => ` Disponible en ${places}.`,
  'onboard.cheapest': 'MÁS BARATA',
  'onboard.nearest': 'MÁS CERCA',
  'onboard.factNsw':
    'Precios oficiales que las gasolineras deben comunicar por ley: FuelWatch en Australia Occidental, FuelCheck en Nueva Gales del Sur, el Territorio de la Capital Australiana y Tasmania.',
  'onboard.factWa':
    'Precios oficiales. En Australia Occidental el precio de cada gasolinera es fijo todo el día, y los de mañana salen antes de las 14:30.',
  'onboard.factOfficial': 'Precios oficiales que las gasolineras deben comunicar por ley, directamente del servicio de precios de cada gobierno.',
  'onboard.fuelTitle': '¿Qué combustible usas?',
  'onboard.fuelBody': 'Puedes cambiarlo cuando quieras desde la parte de arriba de la pantalla.',
  'onboard.locTitle': 'Encuentra gasolineras a tu alrededor',
  'onboard.locBody': 'Pumpwise usa tu ubicación solo mientras está abierta, para saber qué tienes cerca. Tu ubicación exacta no sale de tu iPhone.',
  'onboard.driving': '¿Conduces? Que mire un acompañante, o mira antes de salir. Las indicaciones se abren en tu app de mapas.',
  'onboard.notNow': 'Ahora no',

  // Documentos legales (en inglés, la versión que vale)
  'legal.privacy': 'Política de privacidad',
  'legal.terms': 'Condiciones de uso',
  'legal.updated': (date: string) => `Última actualización: ${date}`,
  'legal.englishOnly': 'Este documento solo está disponible en inglés.',

  // No encontrada
  'notFound.title': 'Camino equivocado',
  'notFound.body': 'Esa página no existe en Pumpwise.',
  'notFound.back': 'Volver a los precios cercanos',
};
