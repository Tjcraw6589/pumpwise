/**
 * Region texts in Spanish, French and Portuguese: names, the About paragraph, the source credit and the
 * report-a-price link, and fuel descriptions. Fuel names stay as the region's pumps say them
 * ("Unleaded 91", "Gasolina 95", "SP95-E10"). English is written in `src/lib/regions.ts`.
 */
import type { RegionId } from '@/lib/feed';
import type { RegionInfo } from '@/lib/regions';

import { type Lang, lang } from './index';

interface RegionText {
  name: string;
  nameInSentence?: string;
  about: string;
  credit: string;
  placesCredit?: string;
  reportLabel: string;
  reportNote: string;
}

const ES: Record<RegionId, RegionText> = {
  wa: {
    name: 'Australia Occidental',
    about:
      'En Australia Occidental cada gasolinera debe comunicar a FuelWatch el precio del día siguiente antes de las 14:00. Ese precio queda fijo durante 24 horas desde las 6:00, así que sabes el precio de hoy y, a partir de las 14:30, el de mañana.',
    credit: 'Precios de FuelWatch, Gobierno de Australia Occidental',
    reportLabel: 'Contactar con FuelWatch',
    reportNote: 'En Australia Occidental las gasolineras deben vender al precio fijado para el día.',
  },
  nsw: {
    name: 'Nueva Gales del Sur',
    about:
      'En Nueva Gales del Sur y el Territorio de la Capital Australiana cada gasolinera debe comunicar sus precios a FuelCheck, y el precio en el surtidor debe coincidir. Un precio sigue vigente hasta que la gasolinera comunica otro. Pumpwise los recoge cada 45 minutos aproximadamente.',
    credit: 'Precios de FuelCheck, Gobierno de Nueva Gales del Sur (CC BY-SA 3.0 AU)',
    reportLabel: 'Avisar en FuelCheck',
    reportNote: 'En Nueva Gales del Sur las gasolineras deben vender al precio que comunican a FuelCheck.',
  },
  tas: {
    name: 'Tasmania',
    about:
      'Las gasolineras de Tasmania comunican sus precios a FuelCheck TAS. Un precio sigue vigente hasta que la gasolinera comunica otro. Pumpwise los recoge cada 45 minutos aproximadamente.',
    credit: 'Precios de FuelCheck TAS, Gobierno de Tasmania',
    reportLabel: 'Ir a FuelCheck TAS',
    reportNote: 'Las gasolineras de Tasmania comunican sus precios a FuelCheck TAS.',
  },
  qld: {
    name: 'Queensland',
    about:
      'En Queensland las gasolineras deben comunicar cada cambio de precio al Gobierno de Queensland en un plazo de 30 minutos. Un precio sigue vigente hasta que la gasolinera comunica otro. El Estado no ofrece ninguna garantía sobre los datos ni acepta responsabilidad por su uso.',
    // The licence notice stays in its own words.
    credit: 'Based on data provided by the State of Queensland (Department of Energy and Climate) 2026',
    reportLabel: 'Contactar con el Gobierno de Queensland',
    reportNote: 'En Queensland las gasolineras deben comunicar cada cambio de precio en 30 minutos.',
  },
  uk: {
    name: 'Reino Unido',
    nameInSentence: 'el Reino Unido',
    about:
      'Varias grandes cadenas publican sus propios precios para que los usen las apps. Pumpwise muestra las que siguen al día, así que no aparecen todas las gasolineras del Reino Unido.',
    credit: 'Precios publicados por las propias cadenas en sus archivos de precios (Asda, Esso, SGN, JET y otras). No son datos del Gobierno',
    reportLabel: 'Sobre los archivos de precios de las cadenas',
    reportNote: 'Cada cadena mantiene su propio archivo; avisa a la cadena si su precio está mal.',
  },
  es: {
    name: 'España',
    about:
      'En España cada gasolinera debe comunicar sus precios al Ministerio para la Transición Ecológica cada vez que cambian. El Ministerio los publica cada media hora y Pumpwise los recoge cada 30 minutos aproximadamente.',
    credit: 'Precios del Geoportal de Gasolineras del MITECO, Gobierno de España (CC BY 4.0)',
    reportLabel: 'Consultarlo en el Geoportal',
    reportNote: 'Las gasolineras deben comunicar sus precios al Ministerio cada vez que cambian.',
  },
  fr: {
    name: 'Francia',
    about:
      'En Francia cada gasolinera debe comunicar sus precios al Gobierno cada vez que cambian, y el precio en el surtidor debe coincidir. Pumpwise los recoge cada 15 minutos aproximadamente. La lista oficial no incluye el nombre de la marca, así que las gasolineras aparecen por su dirección.',
    credit: 'Precios de prix-carburants.gouv.fr, Ministerio de Economía de Francia (Licence Ouverte 2.0)',
    reportLabel: 'Consultarlo en prix-carburants.gouv.fr',
    reportNote: 'Las gasolineras francesas deben comunicar cada cambio de precio al Gobierno.',
  },
  mx: {
    name: 'México',
    about:
      'En México las gasolineras reportan sus precios a la Comisión Nacional de Energía (CNE, antes CRE), que los publica como datos abiertos. La lista da los precios vigentes pero no cuándo se fijó cada uno, así que Pumpwise los muestra como precios actuales. La lista no trae direcciones, por eso Pumpwise indica el municipio de cada gasolinera con los límites del Marco Geoestadístico 2024 del INEGI.',
    credit: 'Precios comunicados a la Comisión Nacional de Energía (CNE, antes CRE), Gobierno de México (CC BY 4.0)',
    placesCredit: 'Nombres de municipios: INEGI, Marco Geoestadístico 2024',
    reportLabel: 'Denunciarlo ante PROFECO',
    reportNote: 'Las gasolineras reportan sus precios a la CNE; PROFECO atiende las quejas en la bomba.',
  },
  pt: {
    name: 'Portugal',
    about:
      'En Portugal las gasolineras publican sus precios en el servicio de precios de la DGEG cada vez que cambian. Un precio sigue vigente hasta que la gasolinera introduce otro; Pumpwise los recoge cada 30 minutos aproximadamente y muestra cuándo se actualizó cada uno.',
    credit: 'Precios de la Direção-Geral de Energia e Geologia (DGEG), Gobierno de Portugal',
    reportLabel: 'Consultarlo en precoscombustiveis.dgeg.gov.pt',
    reportNote: 'Las gasolineras introducen sus propios precios en el sitio de la DGEG. Escribe a precoscombustiveis@dgeg.gov.pt si uno es incorrecto.',
  },
  si: {
    name: 'Eslovenia',
    about:
      'En Eslovenia las gasolineras comunican sus precios a goriva.si, el portal de precios de carburantes del Gobierno. Fuera de las autopistas el Gobierno fija el precio máximo de la gasolina de 95 octanos y del diésel normal, así que la mayoría de las gasolineras cobran lo mismo por ellos; los demás carburantes y las gasolineras de autopista fijan sus propios precios. El portal da los precios vigentes pero no cuándo se fijó cada uno, así que Pumpwise los muestra como precios actuales.',
    credit: 'Fuente: goriva.si, portal oficial de precios de carburantes de la República de Eslovenia',
    reportLabel: 'Consultarlo en goriva.si',
    reportNote: 'Las gasolineras eslovenas comunican sus precios al portal goriva.si del Gobierno.',
  },
  hr: {
    name: 'Croacia',
    about:
      'En Croacia las gasolineras deben comunicar sus precios al Ministerio de Economía, que los publica en su portal minGO. Fuera de las autopistas el Gobierno fija cada semana el precio máximo de la gasolina y el diésel normales, así que la mayoría de las gasolineras cobran lo mismo por ellos; los carburantes premium y las gasolineras de autopista fijan sus propios precios. La lista da los precios vigentes pero no cuándo se fijó cada uno, así que Pumpwise los muestra como precios actuales y omite las entradas que no se han renovado.',
    credit: 'Fuente: Ministerio de Economía de la República de Croacia, portal de precios minGO. Pumpwise no es un servicio oficial del Ministerio',
    reportLabel: 'Consultarlo en mzoe-gor.hr',
    reportNote: 'Las gasolineras croatas deben comunicar sus precios al portal de precios del Ministerio de Economía.',
  },
  dk: {
    name: 'Dinamarca',
    about:
      'En Dinamarca cada compañía de carburantes debe publicar el precio actual en el surtidor de cada una de sus gasolineras en cuanto cambia. Pumpwise lee los servicios públicos de precios de las propias compañías, los de OK, Shell, Circle K con INGO y Q8 con F24; las gasolineras de otras marcas aún no aparecen. Son las cifras de las propias compañías, no datos del Gobierno.',
    credit: 'Precios publicados por las propias compañías de carburantes (OK, Shell, Circle K con INGO, Q8 con F24), como exige la ley danesa. No son datos del Gobierno',
    reportLabel: 'Avisar a la Autoridad danesa de Competencia y Consumo',
    reportNote: 'Las compañías danesas deben publicar el precio del surtidor en cuanto cambia.',
  },
  is: {
    name: 'Islandia',
    about:
      'Islandia no tiene un registro oficial de precios en el surtidor. Pumpwise muestra los precios que las seis compañías de carburantes publican en sus propias webs (Atlantsolía, Costco, N1, Olís, ÓB y Orkan), recogidos cada 15 minutos por el proyecto abierto Gasvaktin. No se incluyen los descuentos de las tarjetas de fidelidad. La lista da los precios vigentes pero no cuándo se fijó cada uno, así que Pumpwise los muestra como precios actuales.',
    credit: 'Precios de las webs de las propias compañías de carburantes, recogidos por Gasvaktin (licencia MIT). No son datos del Gobierno',
    reportLabel: 'Consultarlo en gasvaktin.is',
    reportNote: 'Los precios islandeses proceden de la web de cada compañía de carburantes.',
  },
};

const FR: Record<RegionId, RegionText> = {
  wa: {
    name: 'Australie-Occidentale',
    nameInSentence: 'l’Australie-Occidentale',
    about:
      'En Australie-Occidentale, chaque station doit communiquer à FuelWatch son prix du lendemain avant 14 h. Ce prix est ensuite fixe pendant 24 heures à partir de 6 h : vous connaissez le prix du jour et, après 14 h 30, celui du lendemain.',
    credit: 'Prix de FuelWatch, gouvernement de l’Australie-Occidentale',
    reportLabel: 'Contacter FuelWatch',
    reportNote: 'En Australie-Occidentale, les stations doivent vendre au prix fixé pour la journée.',
  },
  nsw: {
    name: 'Nouvelle-Galles du Sud',
    nameInSentence: 'la Nouvelle-Galles du Sud',
    about:
      'En Nouvelle-Galles du Sud et dans le Territoire de la capitale australienne, chaque station doit déclarer ses prix à FuelCheck, et le prix à la pompe doit correspondre. Un prix reste valable jusqu’à ce que la station en déclare un nouveau. Pumpwise les récupère environ toutes les 45 minutes.',
    credit: 'Prix de FuelCheck, gouvernement de la Nouvelle-Galles du Sud (CC BY-SA 3.0 AU)',
    reportLabel: 'Le signaler dans FuelCheck',
    reportNote: 'En Nouvelle-Galles du Sud, les stations doivent vendre au prix déclaré à FuelCheck.',
  },
  tas: {
    name: 'Tasmanie',
    nameInSentence: 'la Tasmanie',
    about:
      'Les stations de Tasmanie déclarent leurs prix à FuelCheck TAS. Un prix reste valable jusqu’à ce que la station en déclare un nouveau. Pumpwise les récupère environ toutes les 45 minutes.',
    credit: 'Prix de FuelCheck TAS, gouvernement de Tasmanie',
    reportLabel: 'Ouvrir FuelCheck TAS',
    reportNote: 'Les stations de Tasmanie déclarent leurs prix à FuelCheck TAS.',
  },
  qld: {
    name: 'Queensland',
    nameInSentence: 'le Queensland',
    about:
      'Au Queensland, les stations doivent déclarer chaque changement de prix au gouvernement du Queensland sous 30 minutes. Un prix reste valable jusqu’à ce que la station en déclare un nouveau. L’État ne donne aucune garantie sur ces données et décline toute responsabilité quant à leur utilisation.',
    // The licence notice stays in its own words.
    credit: 'Based on data provided by the State of Queensland (Department of Energy and Climate) 2026',
    reportLabel: 'Contacter le gouvernement du Queensland',
    reportNote: 'Au Queensland, les stations doivent déclarer chaque changement de prix sous 30 minutes.',
  },
  uk: {
    name: 'Royaume-Uni',
    nameInSentence: 'le Royaume-Uni',
    about:
      'Plusieurs grandes enseignes publient leurs propres prix pour les applications. Pumpwise affiche celles qui restent à jour ; toutes les stations du Royaume-Uni n’y figurent donc pas.',
    credit: 'Prix publiés par les enseignes dans leurs propres fichiers de prix (Asda, Esso, SGN, JET et d’autres). Ce ne sont pas des données de l’État',
    reportLabel: 'À propos des fichiers de prix des enseignes',
    reportNote: 'Chaque enseigne tient son propre fichier ; signalez lui un prix erroné.',
  },
  es: {
    name: 'Espagne',
    nameInSentence: 'l’Espagne',
    about:
      'En Espagne, chaque station doit déclarer ses prix au ministère de la Transition écologique à chaque changement. Le ministère les publie toutes les demi-heures et Pumpwise les récupère environ toutes les 30 minutes.',
    credit: 'Prix du Geoportal de Gasolineras du MITECO, gouvernement espagnol (CC BY 4.0)',
    reportLabel: 'Le vérifier sur le Geoportal',
    reportNote: 'Les stations espagnoles doivent déclarer leurs prix au ministère à chaque changement.',
  },
  fr: {
    name: 'France',
    nameInSentence: 'la France',
    about:
      'En France, chaque station doit déclarer ses prix à l’État à chaque changement, et le prix à la pompe doit correspondre. Pumpwise les récupère environ toutes les 15 minutes. La liste officielle ne donne pas le nom de l’enseigne : les stations sont donc présentées par leur adresse.',
    credit: 'Prix issus de prix-carburants.gouv.fr, ministère de l’Économie (Licence Ouverte 2.0)',
    reportLabel: 'Le vérifier sur prix-carburants.gouv.fr',
    reportNote: 'Les stations doivent déclarer chaque changement de prix à l’État.',
  },
  mx: {
    name: 'Mexique',
    nameInSentence: 'le Mexique',
    about:
      'Au Mexique, les stations déclarent leurs prix à la Comisión Nacional de Energía (CNE, anciennement CRE), qui les publie en données ouvertes. La liste donne les prix en vigueur mais pas leur date, donc Pumpwise les affiche comme prix actuels, avec la date de leur relevé. La liste ne donne pas d’adresse : Pumpwise indique donc la municipalité de chaque station d’après les limites du Marco Geoestadístico 2024 de l’INEGI.',
    credit: 'Prix déclarés à la Comisión Nacional de Energía (CNE, anciennement CRE), gouvernement du Mexique (CC BY 4.0)',
    placesCredit: 'Noms des municipalités : INEGI, Marco Geoestadístico 2024',
    reportLabel: 'Le signaler à la PROFECO',
    reportNote: 'Les stations déclarent leurs prix à la CNE ; la PROFECO traite les réclamations à la pompe.',
  },
  pt: {
    name: 'Portugal',
    nameInSentence: 'le Portugal',
    about:
      'Au Portugal, les exploitants publient leurs prix sur le service de prix de la DGEG à chaque changement. Un prix reste valable jusqu’à ce que la station en saisisse un nouveau ; Pumpwise les relève environ toutes les 30 minutes et indique la date de chaque mise à jour.',
    credit: 'Prix de la Direção-Geral de Energia e Geologia (DGEG), gouvernement du Portugal',
    reportLabel: 'Le vérifier sur precoscombustiveis.dgeg.gov.pt',
    reportNote: 'Les stations saisissent elles-mêmes leurs prix sur le site de la DGEG. Écrivez à precoscombustiveis@dgeg.gov.pt pour signaler une erreur.',
  },
  si: {
    name: 'Slovénie',
    nameInSentence: 'la Slovénie',
    about:
      'En Slovénie, les stations déclarent leurs prix à goriva.si, le portail des prix des carburants du gouvernement. Hors autoroute, le gouvernement fixe le prix maximal de l’essence 95 et du gazole standard, si bien que la plupart des stations pratiquent le même prix pour ces carburants ; les autres carburants et les stations d’autoroute fixent leurs propres prix. Le portail donne les prix en vigueur mais pas leur date, donc Pumpwise les affiche comme prix actuels.',
    credit: 'Source : goriva.si, portail officiel des prix des carburants de la République de Slovénie',
    reportLabel: 'Le vérifier sur goriva.si',
    reportNote: 'Les stations slovènes déclarent leurs prix au portail goriva.si du gouvernement.',
  },
  hr: {
    name: 'Croatie',
    nameInSentence: 'la Croatie',
    about:
      'En Croatie, les stations doivent déclarer leurs prix au ministère de l’Économie, qui les publie sur son portail minGO. Hors autoroute, le gouvernement fixe chaque semaine le prix maximal de l’essence et du gazole standard, si bien que la plupart des stations pratiquent le même prix pour ces carburants ; les carburants premium et les stations d’autoroute fixent leurs propres prix. La liste donne les prix en vigueur mais pas leur date, donc Pumpwise les affiche comme prix actuels et écarte les entrées qui n’ont pas été renouvelées.',
    credit: 'Source : ministère de l’Économie de la République de Croatie, portail des prix minGO. Pumpwise n’est pas un service officiel du ministère',
    reportLabel: 'Le vérifier sur mzoe-gor.hr',
    reportNote: 'Les stations croates doivent déclarer leurs prix au portail des prix du ministère de l’Économie.',
  },
  dk: {
    name: 'Danemark',
    nameInSentence: 'le Danemark',
    about:
      'Au Danemark, chaque compagnie pétrolière doit publier le prix à la pompe de chacune de ses stations dès qu’il change. Pumpwise lit les services publics de prix des compagnies elles-mêmes, ceux d’OK, de Shell, de Circle K avec INGO et de Q8 avec F24 ; les stations des autres marques ne sont pas encore affichées. Ce sont les chiffres des compagnies, pas des données de l’État.',
    credit: 'Prix publiés par les compagnies pétrolières elles-mêmes (OK, Shell, Circle K avec INGO, Q8 avec F24), comme l’exige la loi danoise. Ce ne sont pas des données de l’État',
    reportLabel: 'Prévenir l’Autorité danoise de la concurrence et de la consommation',
    reportNote: 'Les compagnies danoises doivent publier le prix à la pompe dès qu’il change.',
  },
  is: {
    name: 'Islande',
    nameInSentence: 'l’Islande',
    about:
      'L’Islande n’a pas de registre officiel des prix à la pompe. Pumpwise affiche les prix que les six compagnies pétrolières publient sur leurs propres sites (Atlantsolía, Costco, N1, Olís, ÓB et Orkan), relevés toutes les 15 minutes par le projet ouvert Gasvaktin. Les remises des cartes de fidélité ne sont pas incluses. La liste donne les prix en vigueur mais pas le moment où chacun a été fixé : Pumpwise les présente donc comme des prix actuels.',
    credit: 'Prix des sites des compagnies pétrolières elles-mêmes, relevés par Gasvaktin (licence MIT). Ce ne sont pas des données de l’État',
    reportLabel: 'Vérifier sur gasvaktin.is',
    reportNote: 'Les prix islandais viennent du site de chaque compagnie pétrolière.',
  },
};

const PT: Record<RegionId, RegionText> = {
  wa: {
    name: 'Austrália Ocidental',
    nameInSentence: 'a Austrália Ocidental',
    about:
      'Na Austrália Ocidental cada posto tem de comunicar ao FuelWatch o preço do dia seguinte até às 14:00. Os preços ficam fixos 24 horas a partir das 6:00, por isso sabe o preço de hoje e, a partir das 14:30, o de amanhã.',
    credit: 'Preços do FuelWatch, Governo da Austrália Ocidental',
    reportLabel: 'Contactar o FuelWatch',
    reportNote: 'Na Austrália Ocidental os preços são fixos durante o dia; o FuelWatch trata das queixas.',
  },
  nsw: {
    name: 'Nova Gales do Sul',
    nameInSentence: 'a Nova Gales do Sul',
    about:
      'Em Nova Gales do Sul e no Território da Capital Australiana cada posto tem de comunicar os seus preços ao FuelCheck, e o preço na bomba tem de coincidir. Um preço mantém-se até o posto comunicar outro. O Pumpwise recolhe-os a cada 45 minutos, aproximadamente.',
    credit: 'Preços do FuelCheck, Governo de Nova Gales do Sul (CC BY-SA 3.0 AU)',
    reportLabel: 'Comunicar no FuelCheck',
    reportNote: 'Os postos têm de vender ao preço comunicado; o FuelCheck recebe as queixas.',
  },
  tas: {
    name: 'Tasmânia',
    nameInSentence: 'a Tasmânia',
    about: 'Na Tasmânia os postos comunicam os seus preços ao FuelCheck TAS. Um preço mantém-se até o posto comunicar outro. O Pumpwise recolhe-os a cada 45 minutos, aproximadamente.',
    credit: 'Preços do FuelCheck TAS, Governo da Tasmânia',
    reportLabel: 'Abrir o FuelCheck TAS',
    reportNote: 'Os postos comunicam os seus preços ao FuelCheck TAS.',
  },
  qld: {
    name: 'Queensland',
    nameInSentence: 'o Queensland',
    about:
      'No Queensland os postos têm de comunicar cada alteração de preço ao Governo do Queensland em 30 minutos. Um preço mantém-se até o posto comunicar outro. O Estado não dá qualquer garantia sobre os dados nem aceita responsabilidade pela sua utilização.',
    credit: 'Based on data provided by the State of Queensland (Department of Energy and Climate) 2026',
    reportLabel: 'Contactar o Governo do Queensland',
    reportNote: 'No Queensland os postos têm de comunicar cada alteração de preço em 30 minutos.',
  },
  uk: {
    name: 'Reino Unido',
    nameInSentence: 'o Reino Unido',
    about: 'Várias grandes cadeias publicam os seus próprios preços para as apps usarem. O Pumpwise mostra as que continuam atualizadas, por isso nem todos os postos do Reino Unido aparecem.',
    credit: 'Preços publicados pelas próprias cadeias nos seus ficheiros de preços (Asda, Esso, SGN, JET e outras). Não são dados do Governo',
    reportLabel: 'Sobre os ficheiros de preços das cadeias',
    reportNote: 'Cada cadeia mantém o seu próprio ficheiro; avise a cadeia se o preço estiver errado.',
  },
  es: {
    name: 'Espanha',
    nameInSentence: 'a Espanha',
    about:
      'Em Espanha cada posto tem de comunicar os seus preços ao Ministério para a Transição Ecológica sempre que mudam. O Ministério publica-os de meia em meia hora e o Pumpwise recolhe-os a cada 30 minutos, aproximadamente.',
    credit: 'Preços do Geoportal de Gasolineras do MITECO, Governo de Espanha (CC BY 4.0)',
    reportLabel: 'Consultar no Geoportal',
    reportNote: 'Os postos comunicam os seus próprios preços ao Ministério.',
  },
  fr: {
    name: 'França',
    nameInSentence: 'a França',
    about:
      'Em França cada posto tem de comunicar os seus preços ao Governo sempre que mudam, e o preço na bomba tem de coincidir. O Pumpwise recolhe-os a cada 15 minutos, aproximadamente. A lista oficial não tem marcas, por isso os postos aparecem pela morada.',
    credit: 'Preços de prix-carburants.gouv.fr, Ministério da Economia francês (Licence Ouverte 2.0)',
    reportLabel: 'Verificar em prix-carburants.gouv.fr',
    reportNote: 'Os postos comunicam os seus próprios preços ao Governo.',
  },
  mx: {
    name: 'México',
    nameInSentence: 'o México',
    about:
      'No México os postos comunicam os seus preços à Comisión Nacional de Energía (CNE, antes CRE), que os publica como dados abertos. A lista dá os preços em vigor mas não quando cada um foi fixado, por isso o Pumpwise mostra-os como preços atuais, com a data da recolha. A lista não traz moradas, por isso o Pumpwise indica o município de cada posto com os limites do Marco Geoestadístico 2024 do INEGI.',
    credit: 'Preços comunicados à Comisión Nacional de Energía (CNE, antes CRE), Governo do México (CC BY 4.0)',
    placesCredit: 'Nomes dos municípios: INEGI, Marco Geoestadístico 2024',
    reportLabel: 'Denunciar à PROFECO',
    reportNote: 'Os postos comunicam os seus preços à CNE; a PROFECO trata das queixas na bomba.',
  },
  pt: {
    name: 'Portugal',
    about:
      'Em Portugal os operadores publicam os seus preços no serviço de preços da DGEG sempre que mudam. Um preço mantém-se até o posto introduzir outro; o Pumpwise recolhe-os a cada 30 minutos, aproximadamente, e mostra quando cada um foi atualizado.',
    credit: 'Preços da Direção-Geral de Energia e Geologia (DGEG), Governo de Portugal',
    reportLabel: 'Verificar em precoscombustiveis.dgeg.gov.pt',
    reportNote: 'Os postos introduzem os seus próprios preços no sítio da DGEG. Escreva para precoscombustiveis@dgeg.gov.pt sobre um preço errado.',
  },
  si: {
    name: 'Eslovénia',
    nameInSentence: 'a Eslovénia',
    about:
      'Na Eslovénia os postos comunicam os seus preços ao goriva.si, o portal de preços dos combustíveis do Governo. Fora das autoestradas o Governo fixa o preço máximo da gasolina 95 e do gasóleo simples, pelo que a maioria dos postos cobra o mesmo por eles; os outros combustíveis e os postos de autoestrada fixam os seus próprios preços. O portal indica os preços em vigor mas não quando cada um foi fixado, por isso o Pumpwise mostra-os como preços atuais.',
    credit: 'Fonte: goriva.si, portal oficial de preços dos combustíveis da República da Eslovénia',
    reportLabel: 'Verificar em goriva.si',
    reportNote: 'Os postos eslovenos comunicam os seus preços ao portal goriva.si do Governo.',
  },
  hr: {
    name: 'Croácia',
    nameInSentence: 'a Croácia',
    about:
      'Na Croácia os postos têm de comunicar os seus preços ao Ministério da Economia, que os publica no seu portal minGO. Fora das autoestradas o Governo fixa todas as semanas o preço máximo da gasolina e do gasóleo simples, pelo que a maioria dos postos cobra o mesmo por eles; os combustíveis premium e os postos de autoestrada fixam os seus próprios preços. A lista indica os preços em vigor mas não quando cada um foi fixado, por isso o Pumpwise mostra-os como preços atuais e deixa de fora as entradas que não foram renovadas.',
    credit: 'Fonte: Ministério da Economia da República da Croácia, portal de preços minGO. O Pumpwise não é um serviço oficial do Ministério',
    reportLabel: 'Verificar em mzoe-gor.hr',
    reportNote: 'Os postos croatas têm de comunicar os seus preços ao portal de preços do Ministério da Economia.',
  },
  dk: {
    name: 'Dinamarca',
    nameInSentence: 'a Dinamarca',
    about:
      'Na Dinamarca cada empresa de combustíveis tem de publicar o preço atual na bomba de cada um dos seus postos assim que muda. O Pumpwise lê os serviços públicos de preços das próprias empresas, os da OK, da Shell, da Circle K com INGO e da Q8 com F24; os postos de outras marcas ainda não aparecem. São os valores das próprias empresas, não dados do Governo.',
    credit: 'Preços publicados pelas próprias empresas de combustíveis (OK, Shell, Circle K com INGO, Q8 com F24), como exige a lei dinamarquesa. Não são dados do Governo',
    reportLabel: 'Avisar a Autoridade dinamarquesa da Concorrência e do Consumo',
    reportNote: 'As empresas dinamarquesas têm de publicar o preço na bomba assim que muda.',
  },
  is: {
    name: 'Islândia',
    nameInSentence: 'a Islândia',
    about:
      'A Islândia não tem um registo oficial dos preços na bomba. O Pumpwise mostra os preços que as seis empresas de combustíveis publicam nos seus próprios sites (Atlantsolía, Costco, N1, Olís, ÓB e Orkan), recolhidos de 15 em 15 minutos pelo projeto aberto Gasvaktin. Os descontos dos cartões de fidelização não estão incluídos. A lista dá os preços em vigor mas não quando cada um foi fixado, por isso o Pumpwise mostra-os como preços atuais.',
    credit: 'Preços dos sites das próprias empresas de combustíveis, recolhidos pelo Gasvaktin (licença MIT). Não são dados do Governo',
    reportLabel: 'Verificar em gasvaktin.is',
    reportNote: 'Os preços islandeses vêm do site de cada empresa de combustíveis.',
  },
};

const TEXTS: Record<Exclude<Lang, 'en'>, Record<RegionId, RegionText>> = { es: ES, fr: FR, pt: PT };

/** Fuel descriptions, by their English wording (shared by several regions). */
const FUEL_DESCRIPTIONS: Record<Exclude<Lang, 'en'>, Record<string, string>> = {
  es: {
    'Standard unleaded': 'Sin plomo normal',
    'Premium unleaded': 'Sin plomo premium',
    '98 RON unleaded': 'Sin plomo 98',
    '98 octane unleaded': 'Sin plomo 98',
    'Standard diesel': 'Diésel normal',
    'Branded diesel': 'Diésel de marca',
    Autogas: 'Autogás',
    'Ethanol blend': 'Mezcla con etanol',
    '94 octane with 10% ethanol': '94 octanos con 10 % de etanol',
    'Diesel with 20% biodiesel': 'Diésel con 20 % de biodiésel',
    'Standard petrol': 'Gasolina normal',
    'Premium petrol': 'Gasolina premium',
    'Super diesel': 'Diésel súper',
    'Higher-bio diesel': 'Diésel con más biocombustible',
    'Renewable diesel': 'Diésel renovable',
    'Unleaded 95 (E5)': 'Sin plomo 95 (E5)',
    'Gasóleo A, standard diesel': 'Gasóleo A, diésel normal',
    'Unleaded 98': 'Sin plomo 98',
    'Unleaded 100': 'Sin plomo 100',
    'Unleaded 100 (98 at a few stations)': 'Sin plomo 100 (98 en algunas gasolineras)',
    'Premium diesel': 'Diésel premium',
    'Premium unleaded 95': 'Sin plomo 95 premium',
    'Unleaded 95 with 10% ethanol': 'Sin plomo 95 con 10 % de etanol',
    'Liquefied petroleum gas': 'Gas licuado del petróleo',
    'Unleaded 95 with up to 10% ethanol': 'Sin plomo 95 con hasta 10 % de etanol',
    'Unleaded 95': 'Sin plomo 95',
    Superethanol: 'Superetanol',
    'Regular unleaded': 'Gasolina regular',
    Diesel: 'Diésel',
  },
  fr: {
    'Standard unleaded': 'Sans plomb standard',
    'Premium unleaded': 'Sans plomb premium',
    '98 RON unleaded': 'Sans plomb 98',
    '98 octane unleaded': 'Sans plomb 98',
    'Standard diesel': 'Gazole standard',
    'Branded diesel': 'Gazole de marque',
    Autogas: 'GPL carburant',
    'Ethanol blend': 'Mélange à l’éthanol',
    '94 octane with 10% ethanol': 'Indice d’octane 94 avec 10 % d’éthanol',
    'Diesel with 20% biodiesel': 'Gazole avec 20 % de biodiesel',
    'Standard petrol': 'Essence standard',
    'Premium petrol': 'Essence premium',
    'Super diesel': 'Super gazole',
    'Higher-bio diesel': 'Gazole plus riche en bio',
    'Renewable diesel': 'Gazole renouvelable',
    'Unleaded 95 (E5)': 'Sans plomb 95 (E5)',
    'Gasóleo A, standard diesel': 'Gasóleo A, gazole standard',
    'Unleaded 98': 'Sans plomb 98',
    'Unleaded 100': 'Sans plomb 100',
    'Unleaded 100 (98 at a few stations)': 'Sans plomb 100 (98 dans quelques stations)',
    'Premium diesel': 'Gazole premium',
    'Premium unleaded 95': 'Sans plomb 95 premium',
    'Unleaded 95 with 10% ethanol': 'Sans plomb 95 avec 10 % d’éthanol',
    'Liquefied petroleum gas': 'Gaz de pétrole liquéfié',
    'Unleaded 95 with up to 10% ethanol': 'Sans plomb 95 avec jusqu’à 10 % d’éthanol',
    'Unleaded 95': 'Sans plomb 95',
    Superethanol: 'Superéthanol',
    'Regular unleaded': 'Sans plomb ordinaire',
    Diesel: 'Gazole',
  },
  pt: {
    'Standard unleaded': 'Sem chumbo normal',
    'Premium unleaded': 'Sem chumbo premium',
    '98 RON unleaded': 'Sem chumbo 98',
    '98 octane unleaded': 'Sem chumbo 98',
    'Standard diesel': 'Gasóleo simples',
    'Branded diesel': 'Gasóleo de marca',
    Autogas: 'GPL Auto',
    'Ethanol blend': 'Mistura com etanol',
    '94 octane with 10% ethanol': '94 octanas com 10 % de etanol',
    'Diesel with 20% biodiesel': 'Gasóleo com 20 % de biodiesel',
    'Standard petrol': 'Gasolina normal',
    'Premium petrol': 'Gasolina premium',
    'Super diesel': 'Gasóleo super',
    'Higher-bio diesel': 'Gasóleo com mais biocombustível',
    'Renewable diesel': 'Gasóleo renovável',
    'Unleaded 95 (E5)': 'Sem chumbo 95 (E5)',
    'Gasóleo A, standard diesel': 'Gasóleo A, gasóleo simples',
    'Unleaded 98': 'Sem chumbo 98',
    'Unleaded 100': 'Sem chumbo 100',
    'Unleaded 100 (98 at a few stations)': 'Sem chumbo 100 (98 em alguns postos)',
    'Premium diesel': 'Gasóleo aditivado',
    'Premium unleaded 95': 'Sem chumbo 95 aditivada',
    'Unleaded 95 with 10% ethanol': 'Sem chumbo 95 com 10 % de etanol',
    'Liquefied petroleum gas': 'Gás de petróleo liquefeito',
    'Unleaded 95 with up to 10% ethanol': 'Sem chumbo 95 com até 10 % de etanol',
    'Unleaded 95': 'Sem chumbo 95',
    Superethanol: 'Superetanol',
    'Regular unleaded': 'Gasolina regular',
    Diesel: 'Gasóleo',
  },
};

/** Second lines of city suggestions that are not a region's own name. */
const PLACE_DETAILS: Record<Exclude<Lang, 'en'>, Record<string, string>> = {
  es: { 'Australian Capital Territory': 'Territorio de la Capital Australiana', Madeira: 'Madeira', Açores: 'Azores' },
  fr: { 'Australian Capital Territory': 'Territoire de la capitale australienne', Madeira: 'Madère', Açores: 'Açores' },
  pt: { 'Australian Capital Territory': 'Território da Capital Australiana', Mexico: 'México', Spain: 'Espanha', France: 'França' },
};

/** A region with its texts in the phone's language (English as written when the phone is in English). */
export function localizeRegion(info: RegionInfo): RegionInfo {
  const current = lang();
  if (current === 'en') return info;
  const text = TEXTS[current][info.id];
  const descriptions = FUEL_DESCRIPTIONS[current];
  const details = PLACE_DETAILS[current];
  return {
    ...info,
    name: text.name,
    nameInSentence: text.nameInSentence,
    about: text.about,
    source: { ...info.source, credit: text.credit, placesCredit: text.placesCredit ?? info.source.placesCredit },
    report: { ...info.report, label: text.reportLabel, note: text.reportNote },
    fuels: info.fuels.map((f) => ({ ...f, description: descriptions[f.description] ?? f.description })),
    cities: info.cities.map((c) => ({ ...c, detail: c.detail === info.name ? text.name : (details[c.detail] ?? c.detail) })),
  };
}

/** For the dictionary test: every English fuel description has both translations. */
export const FUEL_DESCRIPTION_TRANSLATIONS = FUEL_DESCRIPTIONS;
