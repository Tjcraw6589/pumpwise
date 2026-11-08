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
      'Desde febrero de 2026 todas las gasolineras del Reino Unido deben comunicar sus precios al programa Fuel Finder, y cualquier cambio en un plazo de 30 minutos.',
    credit: 'Precios del programa Fuel Finder del Gobierno del Reino Unido (Open Government Licence v3.0)',
    reportLabel: 'Avisar en GOV.UK',
    reportNote: 'Las gasolineras deben comunicar los cambios de precio en 30 minutos.',
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
      'En México las gasolineras reportan sus precios a la Comisión Nacional de Energía (CNE, antes CRE), que los publica como datos abiertos. La lista da los precios vigentes pero no cuándo se fijó cada uno, así que Pumpwise los muestra como precios actuales.',
    credit: 'Precios comunicados a la Comisión Nacional de Energía (CNE, antes CRE), Gobierno de México (CC BY 4.0)',
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
      'Depuis février 2026, chaque station-service du Royaume-Uni doit déclarer ses prix au dispositif Fuel Finder, et tout changement sous 30 minutes.',
    credit: 'Prix du dispositif Fuel Finder du gouvernement britannique (Open Government Licence v3.0)',
    reportLabel: 'Le signaler sur GOV.UK',
    reportNote: 'Les stations doivent déclarer les changements de prix sous 30 minutes.',
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
      'Au Mexique, les stations déclarent leurs prix à la Comisión Nacional de Energía (CNE, anciennement CRE), qui les publie en données ouvertes. La liste donne les prix en vigueur mais pas leur date, donc Pumpwise les affiche comme prix actuels, avec la date de leur relevé.',
    credit: 'Prix déclarés à la Comisión Nacional de Energía (CNE, anciennement CRE), gouvernement du Mexique (CC BY 4.0)',
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
    about: 'Desde fevereiro de 2026 todos os postos do Reino Unido têm de comunicar os seus preços ao programa Fuel Finder e qualquer alteração em 30 minutos.',
    credit: 'Preços do programa Fuel Finder do Governo do Reino Unido (Open Government Licence v3.0)',
    reportLabel: 'Comunicar no GOV.UK',
    reportNote: 'Os postos têm de comunicar as alterações em 30 minutos; o GOV.UK recebe as queixas.',
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
      'No México os postos comunicam os seus preços à Comisión Nacional de Energía (CNE, antes CRE), que os publica como dados abertos. A lista dá os preços em vigor mas não quando cada um foi fixado, por isso o Pumpwise mostra-os como preços atuais, com a data da recolha.',
    credit: 'Preços comunicados à Comisión Nacional de Energía (CNE, antes CRE), Governo do México (CC BY 4.0)',
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
    source: { ...info.source, credit: text.credit },
    report: { ...info.report, label: text.reportLabel, note: text.reportNote },
    fuels: info.fuels.map((f) => ({ ...f, description: descriptions[f.description] ?? f.description })),
    cities: info.cities.map((c) => ({ ...c, detail: c.detail === info.name ? text.name : (details[c.detail] ?? c.detail) })),
  };
}

/** For the dictionary test: every English fuel description has both translations. */
export const FUEL_DESCRIPTION_TRANSLATIONS = FUEL_DESCRIPTIONS;
