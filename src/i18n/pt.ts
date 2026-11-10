import type { Strings } from './en';

/** A non-breaking space, so a number never parts from its unit at a line break. */
const NB = ' ';

/** European Portuguese. */
export const pt: Strings = {
  // Preços e unidades
  'unit.euros': 'euros',
  'unit.pesos': 'pesos',
  'unit.pence': 'pence',
  'unit.cents': 'cêntimos',
  'price.perLitreSpoken': (value: string, unit: string) => `${value} ${unit} o litro`,
  'units.underTenthMile': 'Menos de 0,1 mi',
  'list.join': (first: string, last: string) => `${first} e ${last}`,

  // Tempo
  'time.unknown': 'hora desconhecida',
  'time.justNow': 'agora mesmo',
  'time.ago': (span: string) => `há ${span}`,
  'time.minutes': (n: number) => `${n} min`,
  'time.hours': (n: number) => `${n} h`,
  'time.days': (n: number) => (n === 1 ? '1 dia' : `${n} dias`),

  // Atualidade de um preço
  'fresh.updated': (ago: string) => `Atualizado ${ago}`,
  'fresh.unchangedFor': (span: string) => `Sem alteração há ${span}`,
  'fresh.notConfirmedSince': (ago: string) => `Não confirmado ${ago}`,
  'fresh.reported': (ago: string) => `Comunicado ${ago}`,
  'fresh.current': 'Preço em vigor',
  'fresh.dateUnknown': 'Data desconhecida',
  'fresh.newFrom6': 'Novo preço a partir das 6:00',
  'fresh.from6Tomorrow': 'Preço a partir de amanhã às 6:00',
  'fresh.today': 'Preço de hoje',
  'fresh.fromDay': (day: string) => `Preço de ${day.toLowerCase()}`,

  // Dias, a começar na segunda-feira
  'day.0': 'Segunda-feira',
  'day.1': 'Terça-feira',
  'day.2': 'Quarta-feira',
  'day.3': 'Quinta-feira',
  'day.4': 'Sexta-feira',
  'day.5': 'Sábado',
  'day.6': 'Domingo',

  // Horário
  'hours.closedNow': 'Fechado agora',
  'hours.tomorrow': 'amanhã',
  'hours.onDay': (day: string) => day.toLowerCase(),
  'hours.closedOpensDay': (when: string) => `Fechado · abre ${when}`,
  'hours.closedOpensDayAt': (when: string, clock: string) => `Fechado · abre ${when} às ${clock}`,
  'hours.closed': 'Fechado',
  'hours.dayClosed': 'Fechado',
  'hours.openUntil': (clock: string) => `Aberto até às ${clock}`,
  'hours.open24': 'Aberto 24 horas',
  'hours.closedOpensAt': (clock: string) => `Fechado · abre às ${clock}`,
  'hours.notGiven': 'Não indicado',
  'hours.allDay': '24 horas',

  // Avisos sobre os dados
  'warn.todayMissing': 'Os preços de hoje ainda não chegaram. Mostramos os últimos que temos.',
  'warn.feedOld': (ago: string) => `Os preços foram atualizados pela última vez ${ago}. Podem ter mudado entretanto.`,

  // Onde se procura
  'area.near': (name: string) => `Perto de ${name}`,
  'area.nearYou': 'Perto de si',
  'area.hintHere': 'Aqui ao lado',
  'area.hintShort': 'A pouca distância',
  'area.hintDetour': 'Vale o desvio',
  'area.hintWide': 'Pesquisa alargada',
  'search.within': (radius: string) => `Até ${radius}`,
  'search.fuel': 'Combustível',
  'search.area': 'Zona de pesquisa',

  // Preço de amanhã (Austrália Ocidental)
  'tomorrow.spoken': (price: string, change: string) => `Amanhã ${price}, ${change}`,
  'tomorrow.compact': (price: string) => `${price} amanhã`,
  'tomorrow.full': (price: string, change: string) => `Amanhã ${price} (${change})`,

  // Etiquetas dos postos
  'tag.membersOnly': 'Só para sócios',
  'tag.permitNeeded': 'Requer autorização',
  'tag.permitEntry': 'Requer autorização de acesso',
  'tag.unmanned': 'Sem funcionários, só cartão',
  'tag.lowAromatic': 'Combustível com poucos aromáticos',
  'tag.motorway': 'Área de serviço de autoestrada',
  'tag.supermarket': 'Hipermercado',
  'tag.toilets': 'Casas de banho',
  'tag.carWash': 'Lavagem auto',
  'tag.payAtPump': 'Pagamento na bomba 24 h',
  'tag.adblue': 'AdBlue',
  'tag.lpg': 'GPL',
  'tag.air': 'Ar',
  'tag.water': 'Água',
  'tag.atm': 'Multibanco',
  'tag.truck': 'Acesso a pesados',

  // Botões comuns
  'action.directions': 'Como chegar',
  'action.details': 'Detalhes',
  'action.close': 'Fechar',
  'action.back': 'Voltar',
  'action.tryAgain': 'Tentar de novo',
  'action.retry': 'Tentar de novo',
  'action.allowLocation': 'Permitir localização',
  'action.choosePlace': 'Escolher um local',
  'action.continue': 'Continuar',
  'action.cancel': 'Cancelar',
  'a11y.opensStation': 'Abre os preços e o horário do posto',

  // Separadores
  'tab.nearby': 'Perto',
  'tab.map': 'Mapa',
  'tab.settings': 'Definições',

  // Linhas da lista
  'row.total': (money: string) => `${money} no total`,
  'row.till': (clock: string) => `Até às ${clock}`,

  // Estados de carregamento, vazio e erro
  'state.loading': 'A carregar preços',
  'state.permissionTitle': 'Veja os preços à sua volta',
  'state.permissionBody':
    'O Pumpwise usa a sua localização para encontrar o posto mais próximo e o mais barato perto de si. A sua localização exata nunca sai do seu iPhone.',
  'state.choosePlaceInstead': 'Ou escolher um local',
  'state.deniedTitle': 'A localização está desligada',
  'state.deniedBodyAsk': 'O Pumpwise precisa da sua localização para mostrar o que está perto. Também pode pesquisar por localidade ou código postal.',
  'state.deniedBodySettings': 'Ligue a localização para o Pumpwise nas Definições, ou pesquise por localidade ou código postal.',
  'state.openSettings': 'Abrir Definições',
  'state.locationErrorTitle': 'Não conseguimos localizá-lo agora',
  'state.locationErrorBody': 'O seu iPhone não conseguiu obter a localização. Acontece em interiores ou no subsolo.',
  'state.notCoveredTitle': 'Ainda não há preços oficiais aqui',
  'state.notCoveredBody': 'O Pumpwise mostra os preços que os governos publicam para cada posto, e aqui ainda não são publicados. Pode consultar qualquer um destes locais.',
  'state.coveredPlaces': 'Locais com preços oficiais',
  'country.AU': 'Austrália',
  'country.ES': 'Espanha',
  'country.FR': 'França',
  'country.MX': 'México',
  'country.PT': 'Portugal',
  'country.GB': 'Reino Unido',
  'state.lookAround': (city: string) => `Ver ${city}`,
  'state.regionDownTitle': 'Os preços estão a caminho',
  'state.regionDownBody': (region: string) => `Não foi possível recolher os preços de ${region} agora. Costumam voltar dentro de uma hora.`,
  'state.offlineTitle': 'Sem ligação',
  'state.offlineBody': 'O Pumpwise precisa de ligação de dados para obter os preços mais recentes.',
  'state.errorTitle': 'Os preços não carregaram',
  'state.errorBody': 'O serviço de preços não respondeu. Costuma voltar em poucos minutos.',
  'state.checkAgain': 'Verificar de novo',
  'state.emptyTitle': (radius: string) => `Nada a menos de ${radius}`,
  'state.emptyBody': (fuel: string, code: string) => `Nenhum posto nesta zona tem preço de ${fuel} (${code}) neste momento.`,
  'state.emptyTryWider': 'Experimente uma zona maior ou outro combustível.',
  'state.emptyTryOther': 'Experimente outro combustível, ou escolha um local.',
  'state.searchWithin': (radius: string) => `Procurar até ${radius}`,

  // Separador Perto
  'sort.cheapest': 'Mais barato',
  'sort.closest': 'Mais perto',
  'sort.value': 'Melhor escolha',
  'trend.drops': (fuel: string, amount: string) => `Amanhã ${fuel} desce cerca de ${amount} por aqui. Espere, se puder.`,
  'trend.rises': (fuel: string, amount: string) => `Amanhã ${fuel} sobe cerca de ${amount} por aqui. Ateste hoje.`,
  'trend.same': (fuel: string) => `Amanhã ${fuel} custará mais ou menos o mesmo que hoje por aqui.`,
  'value.title': 'Melhor escolha contando a viagem',
  'value.withDrive': (money: string) => `${money} com o combustível da ida e volta`,
  'nearby.refresh': 'Atualizar preços',
  'nearby.searching': (area: string) => `A pesquisar: ${area}. Mudar de local`,
  'nearby.checked': (ago: string) => `· verificado ${ago}`,
  'nearby.couldntUpdate': (ago: string) => `Não foi possível atualizar. Preços de ${ago}.`,
  'nearby.allClosed': (radius: string) =>
    `Todos os postos a menos de ${radius} estão fechados, são só para sócios ou não confirmaram o preço recentemente.`,
  'nearby.allNearby': 'Todos os postos perto',
  'nearby.stations': (n: number) => (n === 1 ? '1 posto' : `${n} postos`),
  'nearby.straightLine': 'As distâncias são em linha reta.',
  'report.priceWrong': 'Preço errado na bomba?',

  // Cartões do mais barato e do mais próximo
  'hero.cheapestWithin': (radius: string) => `O mais barato a menos de ${radius}`,
  'hero.alsoNearest': 'Também o mais próximo',
  'hero.cheapestSpoken': (summary: string) => `O mais barato: ${summary}`,
  'hero.nearestSpoken': (summary: string) => `O mais próximo: ${summary}`,
  'hero.nearestHint': 'Abre os preços e o horário do posto. Deslize para cima ou para baixo para ver como chegar.',
  'hero.nearest': 'O mais próximo',
  'hero.nearestOutside': 'O mais próximo (fora da sua zona)',
  'hero.directionsTo': (name: string) => `Como chegar a ${name}`,
  'hero.saves': 'Poupa',
  'hero.savesRest': (litres: number, extra: string, still: string) => `num depósito de ${litres} L em comparação com o mais próximo${extra}.${still}`,
  'hero.extraThereBack': (distance: string) => `, mesmo com os ${distance} a mais de ida e volta`,
  'hero.betterStill': (name: string, money: string) => ` ${name}, mais abaixo, fica ${money} melhor ainda contando a viagem.`,
  'hero.onlyAhead': (money: string, litres: number, distance: string, verdict: string) =>
    `Apenas ${money} a menos num depósito de ${litres} L contando os ${distance} a mais de ida e volta. ${verdict}`,
  'hero.cheaperButFar': (distance: string, litres: number, verdict: string) =>
    `Mais barato na bomba, mas os ${distance} a mais de ida e volta custam mais do que poupa em ${litres} L. ${verdict}`,
  'hero.verdictBetterPick': 'A melhor escolha, mais abaixo, ganha aos dois.',
  'hero.verdictFine': 'Hoje o mais próximo serve bem.',
  'hero.verdictNearest': 'O mais próximo compensa mais.',

  // Separador Mapa
  'map.recentre': 'Centrar o mapa',
  'map.cheapest': 'O mais barato',
  'map.selected': 'Selecionado',
  'map.selectedStation': 'Posto selecionado',
  'map.tryWider': 'Experimente uma zona maior com o botão no topo.',
  'map.background': 'Fundo do mapa',
  'map.webNote': 'Pré-visualização do mapa. A app para iPhone mostra o Apple Maps.',

  // Ecrã do posto
  'station.title': 'Posto',
  'station.notFound': 'Posto não encontrado',
  'station.notFoundBody': 'Os preços podem ter sido atualizados. Volte atrás e escolha-o de novo.',
  'station.today': 'Hoje',
  'station.tomorrow': 'Amanhã',
  'station.tomorrowSpoken': (price: string) => `amanhã ${price}`,
  'station.makeYourFuel': 'Torna-o o seu combustível',
  'station.noPrice': (fuel: string) => `Este posto não tem preço de ${fuel}.`,
  'station.hours': 'Horário',
  'station.facilities': 'Neste posto',

  // Separador Definições
  'settings.title': 'Definições',
  'settings.showing': (region: string) => `Combustíveis e unidades: ${region}.`,
  'settings.fuel': 'O seu combustível',
  'settings.areaHint': 'Até onde procurar o posto mais barato. O mais próximo aparece sempre.',
  'settings.fill': 'Depósito habitual',
  'settings.fillHint': 'Serve para mostrar quanto poupa.',
  'settings.mpg': 'Milhas por galão do seu carro',
  'settings.economy': 'Consumo do seu carro',
  'settings.economyHint': (unit: string, money: string) =>
    `«Melhor escolha» soma o combustível da ida e volta. Cada ${unit} a mais custa cerca de ${money} de ida e volta.`,
  'settings.members': 'Postos só para sócios',
  'settings.membersHint': 'Alguns postos, como o Costco, só vendem a sócios. Ative se for sócio.',
  'settings.includeMembers': 'Incluir postos só para sócios',
  'settings.directions': 'Abrir trajetos em',
  'settings.myLocation': 'A minha localização',
  'settings.chosenPlace': 'Um local escolhido',
  'settings.appearance': 'Aspeto',
  'theme.system': 'Automático',
  'theme.light': 'Claro',
  'theme.dark': 'Escuro',
  'settings.about': 'Informações',
  'settings.whereFrom': 'De onde vêm os preços',
  'settings.report': 'Comunicar um preço errado',
  'settings.privacy': 'Privacidade',
  'settings.adPrivacy': 'Privacidade dos anúncios',
  'settings.terms': 'Condições de utilização',
  'settings.contact': 'Contactar o apoio',
  'settings.reset': 'Repor definições',
  'settings.resetTitle': 'Repor as definições?',
  'settings.resetMessage': 'O combustível, a zona de pesquisa, o depósito, o carro e a app de mapas voltam aos valores iniciais.',
  'settings.resetConfirm': 'Repor',
  'settings.footer': (version: string) => `Pumpwise ${version} · Sem conta. Um pequeno anúncio mantém-no gratuito.`,

  // Escolher um local
  'place.title': 'Onde procurar',
  'place.placeholder': 'Localidade, cidade ou código postal',
  'place.noMatch': (places: string, query: string) => `Nenhum resultado para «${query}» em ${places}.`,
  'place.searchDown': 'A pesquisa não responde. Verifique a ligação ou escolha uma cidade abaixo.',
  'place.useMyLocation': 'Usar a minha localização',
  'place.locationOff': 'A localização está desligada para o Pumpwise. Toque para abrir as Definições.',
  'place.follows': 'Acompanha-o enquanto conduz',
  'place.recent': 'Recentes',
  'place.cities': 'Cidades',
  'place.privacy':
    'A pesquisa usa o serviço de mapas da Apple (e o postcodes.io para códigos postais britânicos). Só é enviado o que escreve.',

  // De onde vêm os preços
  'about.title': 'De onde vêm os preços',
  'about.intro':
    'O Pumpwise mostra os preços oficiais que os postos têm de comunicar aos serviços de preços dos governos. Acrescenta um novo local sempre que um governo publica os seus preços gratuitamente.',
  'about.feed': (ago: string, count: string) => `Os dados do Pumpwise foram atualizados ${ago} e cobrem ${count} postos.`,
  'about.priceWrong': (label: string) => `Preço errado? ${label}`,
  'about.rankTitle': 'Mais barato, mais próximo e melhor escolha',
  'about.rankBody':
    'O mais barato é o preço mais baixo dentro da sua zona de pesquisa num posto aberto. O mais próximo é o posto aberto mais perto que vende o seu combustível. A melhor escolha soma o combustível que gastaria na ida e volta, segundo o consumo do seu carro, pelo que um posto um pouco mais caro ao lado pode ganhar a um barato que fica longe.',
  'about.membersTitle': 'Postos só para sócios e isolados',
  'about.membersBody':
    'Os postos que só vendem a sócios, ou que exigem autorização de acesso, são assinalados e nunca escolhidos como o mais barato. Se for sócio, pode incluí-los nas Definições.',
  'about.distanceTitle': 'Distâncias',
  'about.distanceBody': 'As distâncias são em linha reta. As estradas são mais longas, por isso conte com uma viagem um pouco maior.',
  'about.independenceTitle': 'Independência',
  'about.independenceBody': 'O Pumpwise não está ligado a nenhum governo, posto ou marca de combustível.',

  // Primeira utilização
  'onboard.skip': 'Saltar',
  'onboard.headline': 'Combustível barato,\naqui perto.',
  'onboard.pitch': 'Abra o Pumpwise e veja o posto mais próximo e o mais barato à sua volta, com o trajeto num toque.',
  'onboard.covering': (places: string) => ` Disponível em ${places}.`,
  'onboard.cheapest': 'MAIS BARATO',
  'onboard.nearest': 'MAIS PERTO',
  'onboard.factNsw':
    'Preços oficiais que os postos têm de comunicar por lei: FuelWatch na Austrália Ocidental, FuelCheck em Nova Gales do Sul, no Território da Capital Australiana e na Tasmânia.',
  'onboard.factWa':
    'Preços oficiais. Na Austrália Ocidental o preço de cada posto é fixo durante o dia, e os de amanhã saem até às 14:30.',
  'onboard.factOfficial': 'Preços oficiais que os postos têm de comunicar por lei, diretamente do serviço de preços de cada governo.',
  'onboard.fuelTitle': 'Que combustível usa?',
  'onboard.fuelBody': 'Pode mudar quando quiser no topo do ecrã.',
  'onboard.locTitle': 'Encontre postos à sua volta',
  'onboard.locBody': 'O Pumpwise usa a sua localização apenas enquanto está aberto, para saber o que está perto. A sua localização exata nunca sai do seu iPhone.',
  'onboard.driving': 'A conduzir? Peça a um passageiro para ver, ou veja antes de partir. O trajeto abre na sua app de mapas.',
  'onboard.notNow': 'Agora não',

  // Documentos legais
  'legal.privacy': 'Política de privacidade',
  'legal.terms': 'Condições de utilização',
  'legal.updated': (date: string) => `Última atualização: ${date}`,
  'legal.englishOnly': 'Este documento só está disponível em inglês.',

  // Página não encontrada
  'notFound.title': 'Caminho errado',
  'notFound.body': 'Essa página não existe no Pumpwise.',
  'notFound.back': 'Voltar aos preços perto de si',
};

void NB;
