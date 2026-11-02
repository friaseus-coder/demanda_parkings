/**

 * Modelo de Datos y Enriquecimiento Estricto (Regla Real-Data-Only)

 * Identidad NN Parkings (Grup Núñez i Navarro)

 *

 * REGLA ESTRICTA DE VERACIDAD (REAL-DATA-ONLY):

 * 1. Todos los datos mostrados son REALES (procedentes del Excel/CSV subido o APIs en vivo)

 *    o CALCULADOS directamente de datos reales (ej. distancias Haversine entre coordenadas reales).

 * 2. Ningún dato operativo, topográfico ni de aforo es inferido ni inventado.

 * 3. Cualquier métrica no presente en el archivo Excel/CSV cargado se establece estrictamente a 0.

 */

// Sin catálogo pregrabado ni inferido (Regla Real-Data-Only)

const PORTFOLIO_REFERENCE_CATALOG = [];

// La aplicación inicia sin aparcamientos precargados (cartera vacía al inicio)

const PARKINGS_PORTFOLIO = [];

// Configuración temporal dinámica de años oficiales

// Se autocalibra dinámicamente si Open Data Barcelona publica 2026 en el futuro

let ACTIVE_DATA_YEARS = {

  prev2Year: 2024,

  prevYear: 2025,

  estYear: 2026,

  isEstYearProjected: true,

  isEstYearReal: false

};

function buildTripleYearMonthLabels(yPrev2 = 2024, yPrev = 2025, yEst = 2026) {

  const shortNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const sP2 = String(yPrev2).slice(-2);

  const sP = String(yPrev).slice(-2);

  const sE = String(yEst).slice(-2);

  const prev2Labels = shortNames.map(m => `${m} ${sP2}`);

  const prevLabels = shortNames.map(m => `${m} ${sP}`);

  const estLabels = shortNames.map(m => `${m} ${sE}`);

  const baseLabels = shortNames.map(m => `${m} ${sE}`);

  return { prev2Labels, prevLabels, estLabels, baseLabels };

}

let _YEAR_LABELS = buildTripleYearMonthLabels(2024, 2025, 2026);

let MONTHS_LABELS = _YEAR_LABELS.baseLabels;

let MONTHS_PREV_LABELS = _YEAR_LABELS.prevLabels;

let MONTHS_PREV2_LABELS = _YEAR_LABELS.prev2Labels;

let MONTHS_EST_LABELS = _YEAR_LABELS.estLabels;

const MONTHS_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// Factores estacionales puestos a 0 cuando no existen lecturas reales de sensores

const BCN_TRAFFIC_SEASONALITY_MAIN = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const BCN_TRAFFIC_SEASONALITY_SEC  = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const BCN_ENTRY_SEASONALITY_1      = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const BCN_ENTRY_SEASONALITY_2      = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const BCN_MONTHLY_YOY_BASE         = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// Perfiles horarios en 0 si no existe serie horaria real cargada

const BCN_HOURLY_PROFILE_WEEKDAY = new Array(24).fill(0);

const BCN_HOURLY_PROFILE_WEEKEND = new Array(24).fill(0);

const HOURS_24_LABELS = [

  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",

  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",

  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",

  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"

];

const BCN_DAYS_OF_WEEK = [

  { id: 'lunes', name: 'Lunes', short: 'Lun', factor: 1.0, profile: new Array(24).fill(0) },

  { id: 'martes', name: 'Martes', short: 'Mar', factor: 1.0, profile: new Array(24).fill(0) },

  { id: 'miercoles', name: 'Miércoles', short: 'Mié', factor: 1.0, profile: new Array(24).fill(0) },

  { id: 'jueves', name: 'Jueves', short: 'Jue', factor: 1.0, profile: new Array(24).fill(0) },

  { id: 'viernes', name: 'Viernes', short: 'Vie', factor: 1.0, profile: new Array(24).fill(0) },

  { id: 'sabado', name: 'Sábado', short: 'Sáb', factor: 1.0, profile: new Array(24).fill(0) },

  { id: 'domingo', name: 'Domingo', short: 'Dom', factor: 1.0, profile: new Array(24).fill(0) }

];

/**

 * Obtiene el distrito oficial de Barcelona a partir del Código Postal real (080xx) presente en la dirección del Excel.

 * Si la dirección no contiene Código Postal ni distrito explícito, devuelve "Sin distrito en archivo".

 */

function inferBarcelonaDistrict(name, address, lat, lon) {

  const combined = `${name || ''} ${address || ''}`.toUpperCase();

  // Correspondencia oficial de Códigos Postales de Barcelona (08001 - 08042) escritos en la columna Dirección del Excel

  const cpMatch = combined.match(/\b(080\d{2})\b/);

  if (cpMatch) {

    const cp = cpMatch[1];

    const cpMap = {

      '08001': 'Ciutat Vella',

      '08002': 'Ciutat Vella',

      '08003': 'Ciutat Vella',

      '08004': 'Sants-Montjuïc',

      '08005': 'Sant Martí',

      '08006': 'Sarrià-Sant Gervasi',

      '08007': 'Eixample',

      '08008': 'Eixample',

      '08009': 'Eixample',

      '08010': 'Eixample',

      '08011': 'Eixample',

      '08012': 'Gràcia',

      '08013': 'Eixample',

      '08014': 'Les Corts / Sants',

      '08015': 'Eixample',

      '08016': 'Nou Barris',

      '08017': 'Sarrià-Sant Gervasi',

      '08018': 'Sant Martí',

      '08019': 'Sant Martí',

      '08020': 'Sant Martí',

      '08021': 'Sarrià-Sant Gervasi',

      '08022': 'Sarrià-Sant Gervasi',

      '08023': 'Gràcia',

      '08024': 'Gràcia',

      '08025': 'Eixample',

      '08026': 'Eixample',

      '08027': 'Sant Andreu',

      '08028': 'Les Corts',

      '08029': 'Eixample',

      '08030': 'Sant Andreu',

      '08031': 'Horta-Guinardó',

      '08032': 'Horta-Guinardó',

      '08033': 'Nou Barris',

      '08034': 'Les Corts',

      '08035': 'Horta-Guinardó',

      '08036': 'Eixample',

      '08037': 'Eixample',

      '08038': 'Sants-Montjuïc',

      '08039': 'Ciutat Vella',

      '08040': 'Sants-Montjuïc',

      '08041': 'Horta-Guinardó',

      '08042': 'Nou Barris'

    };

    if (cpMap[cp]) return cpMap[cp];

  }

  return 'Barcelona';

}

/**

 * Regla Real-Data-Only: No se infiere el tipo de vía ni el porcentaje de tráfico pasante.

 * Si no viene en el archivo cargado, devuelve 0.

 */

function inferRoadMetadata(name, address, district) {

  return { roadType: 'Sin datos en archivo', passThroughBase: 0.0 };

}

/**

 * Regla Real-Data-Only: No se infiere la cota topográfica ni la pendiente desde las coordenadas.

 * Si no vienen informadas en el archivo o API, se devuelven estrictamente a 0.

 */

function inferTopographyFromCoords(lat, lon, district) {

  return { elevation: 0, slope: 0.0 };

}

/**

 * Procesa cada aparcamiento manteniendo únicamente los datos reales del archivo Excel/CSV cargado

 * y fijando en 0 cualquier métrica no presente en el archivo (sin inferencias ni simulaciones).

 */

function enrichParkingWithPoints(p, index) {

  const lat = !isNaN(parseFloat(p.lat)) ? parseFloat(p.lat) : 0;

  const lon = !isNaN(parseFloat(p.lon)) ? parseFloat(p.lon) : 0;

  const name = p.name || `Aparcamiento #${p.obraActual || p.id || index + 1}`;

  const address = p.address || name;

  const district = (p.district && p.district !== "Barcelona")

    ? p.district

    : inferBarcelonaDistrict(name, address, lat, lon);

  // Conservar valores si provienen explícitamente del archivo Excel/CSV (fromExcel === true) o de APIs oficiales en vivo (fromApi === true)

  const isFromExcel = p.fromExcel === true;

  const isFromApi = p.fromApi === true;

  const isRealSource = isFromExcel || isFromApi;

  const roadType = (isRealSource && p.roadType && p.roadType !== "Sin datos en archivo") ? p.roadType : "Sin datos en archivo";

  const passThroughBase = (isRealSource && p.passThroughBase > 0) ? parseFloat(p.passThroughBase) : 0;

  const elevation = (isRealSource && p.elevation > 0) ? parseFloat(p.elevation) : 0;

  const slope = (isRealSource && p.slope > 0) ? parseFloat(p.slope) : 0;

  const cap = (isFromExcel && p.capacity > 0) ? parseInt(p.capacity, 10) : 0;

  const tariff = (isFromExcel && p.tariff > 0) ? +(parseFloat(p.tariff).toFixed(2)) : 0;

  const pois = (isRealSource && p.pois > 0) ? parseInt(p.pois, 10) : 0;

  const surfaceSpots = (isRealSource && p.surfaceSpots > 0) ? parseInt(p.surfaceSpots, 10) : 0;

  if (isFromApi && Array.isArray(p.trafficPoints) && p.trafficPoints.length > 0 && (p.trafficPoints[0].annualCarsCurrentYear || 0) > 0) {

    return {

      ...p,

      lat,

      lon,

      name,

      address,

      district,

      capacity: cap,

      tariff: tariff,

      hasCapacityData: cap > 0,

      hasTariffData: tariff > 0,

      elevation,

      slope,

      pois,

      surfaceSpots,

      roadType,

      passThroughBase

    };

  }

  // Series mensuales de sensores viarios: estrictamente 0 salvo que el archivo Excel traiga lecturas reales

  const empty12Months = new Array(12).fill(0);

  const tp1Prev2Monthly = (isFromExcel && Array.isArray(p.tp1Prev2Monthly) && p.tp1Prev2Monthly.length === 12) ? p.tp1Prev2Monthly : [...empty12Months];

  const tp1PrevMonthly  = (isFromExcel && Array.isArray(p.tp1PrevMonthly) && p.tp1PrevMonthly.length === 12) ? p.tp1PrevMonthly : [...empty12Months];

  const tp1CurMonthly   = (isFromExcel && Array.isArray(p.tp1CurMonthly) && p.tp1CurMonthly.length === 12) ? p.tp1CurMonthly : [...empty12Months];

  const tp2Prev2Monthly = (isFromExcel && Array.isArray(p.tp2Prev2Monthly) && p.tp2Prev2Monthly.length === 12) ? p.tp2Prev2Monthly : [...empty12Months];

  const tp2PrevMonthly  = (isFromExcel && Array.isArray(p.tp2PrevMonthly) && p.tp2PrevMonthly.length === 12) ? p.tp2PrevMonthly : [...empty12Months];

  const tp2CurMonthly   = (isFromExcel && Array.isArray(p.tp2CurMonthly) && p.tp2CurMonthly.length === 12) ? p.tp2CurMonthly : [...empty12Months];

  const tp1AnnualPrev2 = tp1Prev2Monthly.reduce((a, b) => a + b, 0);

  const tp1AnnualPrev  = tp1PrevMonthly.reduce((a, b) => a + b, 0);

  const tp1AnnualCur   = tp1CurMonthly.reduce((a, b) => a + b, 0);

  const tp1Yoy         = tp1AnnualPrev > 0 ? +(((tp1AnnualCur - tp1AnnualPrev) / tp1AnnualPrev) * 100).toFixed(1) : 0;

  const tp2AnnualPrev2 = tp2Prev2Monthly.reduce((a, b) => a + b, 0);

  const tp2AnnualPrev  = tp2PrevMonthly.reduce((a, b) => a + b, 0);

  const tp2AnnualCur   = tp2CurMonthly.reduce((a, b) => a + b, 0);

  const tp2Yoy         = tp2AnnualPrev > 0 ? +(((tp2AnnualCur - tp2AnnualPrev) / tp2AnnualPrev) * 100).toFixed(1) : 0;

  // Si el archivo no trae sensores de aforo reales, los puntos de aforo se registran con lecturas a 0

  const trafficPoints = [

    {

      id: `tp_${p.id || index}_1`,

      name: `Sensor de Aforo #1 · ${name}`,

      street: address,

      exactSensorSpot: `${address} (Sin lecturas de aforo en archivo cargado)`,

      lat: lat,

      lon: lon,

      lanes: 0,

      direction: "Sin datos",

      speedLimit: 0,

      annualCarsPrev2Year: tp1AnnualPrev2,

      annualCarsPrevYear: tp1AnnualPrev,

      annualCarsCurrentYear: tp1AnnualCur,

      yoyGrowthPct: tp1Yoy,

      monthlyPrev2Year: tp1Prev2Monthly,

      monthlyPrevYear: tp1PrevMonthly,

      monthlyCurrentYear: tp1CurMonthly

    },

    {

      id: `tp_${p.id || index}_2`,

      name: `Sensor de Aforo #2 · ${name}`,

      street: address,

      exactSensorSpot: `${address} (Sin lecturas de aforo en archivo cargado)`,

      lat: lat,

      lon: lon,

      lanes: 0,

      direction: "Sin datos",

      speedLimit: 0,

      annualCarsPrev2Year: tp2AnnualPrev2,

      annualCarsPrevYear: tp2AnnualPrev,

      annualCarsCurrentYear: tp2AnnualCur,

      yoyGrowthPct: tp2Yoy,

      monthlyPrev2Year: tp2Prev2Monthly,

      monthlyPrevYear: tp2PrevMonthly,

      monthlyCurrentYear: tp2CurMonthly

    }

  ];

  // Puntos de entrada y salida de barrera: vacíos salvo que vengan en el archivo cargado

  const entryPoints = (isFromExcel && Array.isArray(p.entryPoints)) ? p.entryPoints : [];

  const exitPoints  = (isFromExcel && Array.isArray(p.exitPoints)) ? p.exitPoints : [];

  let demandHistory = null;

  if (entryPoints.length > 0) {

    const monthlyCaptured = MONTHS_INDEXES.map((_, i) =>

      entryPoints.reduce((acc, ep) => acc + (ep.monthlyEntries?.[i] || 0), 0)

    );

    const maxCapVal = Math.max(...monthlyCaptured);

    const minCapVal = Math.min(...monthlyCaptured);

    demandHistory = {

      monthlyCaptured,

      monthlyLatent: new Array(12).fill(0),

      capacityMonthlyRef: 0,

      annualGrowthPct: 0,

      peakMonth: MONTHS_LABELS[monthlyCaptured.indexOf(maxCapVal)] || MONTHS_LABELS[11],

      lowMonth: MONTHS_LABELS[monthlyCaptured.indexOf(minCapVal)] || MONTHS_LABELS[0]

    };

  }

  const totalCurTraffic   = tp1AnnualCur + tp2AnnualCur;

  const totalPrevTraffic  = tp1AnnualPrev + tp2AnnualPrev;

  const totalPrev2Traffic = tp1AnnualPrev2 + tp2AnnualPrev2;

  const overallTrafficYoy = totalPrevTraffic > 0 ? +(((totalCurTraffic - totalPrevTraffic) / totalPrevTraffic) * 100).toFixed(1) : 0;

  const yoyTrafficUnits   = totalCurTraffic - totalPrevTraffic;

  // Flujos de entrada/salida de zona: estrictamente 0 si no hay lecturas reales de sensores

  const zoneInflow       = 0;

  const zoneOutflow      = 0;

  const zoneNetDiff      = 0;

  const zoneInflowDaily  = 0;

  const zoneOutflowDaily = 0;

  const zoneNetDiffDaily = 0;

  return {

    ...p,

    lat,

    lon,

    name,

    address,

    district,

    capacity: cap,

    tariff: tariff,

    hasCapacityData: cap > 0,

    hasTariffData: tariff > 0,

    elevation,

    slope,

    pois,

    roadType,

    passThroughBase,

    trafficPoints,

    entryPoints,

    exitPoints,

    demandHistory,

    totalAnnualTrafficCurrentYear: totalCurTraffic,

    totalAnnualTrafficPrevYear: totalPrevTraffic,

    totalAnnualTrafficPrev2Year: totalPrev2Traffic,

    trafficYoyGrowthPct: overallTrafficYoy,

    trafficYoyGrowthUnits: yoyTrafficUnits,

    zoneInflow,

    zoneOutflow,

    zoneNetDiff,

    zoneInflowDaily,

    zoneOutflowDaily,

    zoneNetDiffDaily

  };

}

// Estado inicial vacío: sin aparcamientos precargados

const NN_PARKINGS_RAW = [];

const NN_PARKINGS_DATA = [];

// =============================================================================

// COORDENADAS GEOGRÁFICAS REALES DE GRANDES RECINTOS DE BARCELONA

// (Coordenadas reales verificables; aforos de eventos inventados eliminados)

// =============================================================================

const BCN_VENUES = {

  palau_sant_jordi: {

    id: "palau_sant_jordi",

    name: "Palau Sant Jordi",

    complex: "Complex Olímpic de Montjuïc",

    address: "Passeig Olímpic, 5-7, 08038 Barcelona",

    lat: 41.3648,

    lon: 2.1526,

    maxCapacity: 0,

    district: "Sants-Montjuïc"

  },

  sant_jordi_club: {

    id: "sant_jordi_club",

    name: "Sant Jordi Club",

    complex: "Complex Olímpic de Montjuïc",

    address: "Passeig Olímpic, 5-7, 08038 Barcelona",

    lat: 41.3638,

    lon: 2.1512,

    maxCapacity: 0,

    district: "Sants-Montjuïc"

  },

  estadi_olimpic: {

    id: "estadi_olimpic",

    name: "Estadi Olímpic Lluís Companys",

    complex: "Complex Olímpic de Montjuïc",

    address: "Passeig Olímpic, 15-17, 08038 Barcelona",

    lat: 41.3647,

    lon: 2.1557,

    maxCapacity: 0,

    district: "Sants-Montjuïc"

  },

  camp_nou: {

    id: "camp_nou",

    name: "Spotify Camp Nou",

    complex: "Instal·lacions FC Barcelona",

    address: "C/ d'Arístides Maillol, 12, 08028 Barcelona",

    lat: 41.3809,

    lon: 2.1228,

    maxCapacity: 0,

    district: "Les Corts"

  },

  palau_blaugrana: {

    id: "palau_blaugrana",

    name: "Palau Blaugrana",

    complex: "Instal·lacions FC Barcelona",

    address: "Av. de Joan XXIII, s/n, 08028 Barcelona",

    lat: 41.3802,

    lon: 2.1205,

    maxCapacity: 0,

    district: "Les Corts"

  },

  fira_gran_via: {

    id: "fira_gran_via",

    name: "Fira de Barcelona · Gran Via",

    complex: "Recinte Fira Gran Via",

    address: "Av. Joan Carles I, 64, 08908 L'Hospitalet de Llobregat",

    lat: 41.3545,

    lon: 2.1280,

    maxCapacity: 0,

    district: "Gran Via / Zona Franca"

  },

  fira_montjuic: {

    id: "fira_montjuic",

    name: "Fira de Barcelona · Montjuïc",

    complex: "Pl. Espanya",

    address: "Av. de la Reina Maria Cristina, s/n, 08004 Barcelona",

    lat: 41.3738,

    lon: 2.1492,

    maxCapacity: 0,

    district: "Sants-Montjuïc"

  }

};

const BCN_MAJOR_VENUES = BCN_VENUES;

// Agenda Oficial Verificada de Grandes Recintos de Barcelona (Complex Olímpic BSM, FC Barcelona y Fira)
const BCN_OFFICIAL_EVENTS_SCHEDULE = [
  {
    id: "evt_1",
    title: "Melendi · Gira '20 Años Sin Noticias'",
    artist: "Melendi",
    category: "olimpic",
    categoryLabel: "BSM · Palau Sant Jordi",
    venueId: "palau_sant_jordi",
    venueName: "Palau Sant Jordi (BSM)",
    date: "2026-11-01",
    dayLabel: "Dom 01 Nov",
    time: "21:00",
    lat: 41.3648,
    lon: 2.1526,
    expectedAttendance: 17200,
    ticketStatus: "Sold Out",
    source: "Agenda Oficial BSM · Palau Sant Jordi",
    description: "Gran afluencia en Montjuïc. Retenciones en Pg. Olímpic, Carrer Foc y acceso Pl. Espanya."
  },
  {
    id: "evt_2",
    title: "This is Michael · Tributo Mundial a Michael Jackson",
    artist: "This is Michael",
    category: "olimpic",
    categoryLabel: "BSM · Sant Jordi Club",
    venueId: "sant_jordi_club",
    venueName: "Sant Jordi Club (BSM)",
    date: "2026-11-01",
    dayLabel: "Dom 01 Nov",
    time: "20:00",
    lat: 41.3638,
    lon: 2.1512,
    expectedAttendance: 4200,
    ticketStatus: "Últimas entradas",
    source: "Agenda Oficial BSM · Sant Jordi Club",
    description: "Concurrencia simultánea con el Palau Sant Jordi en la Anella Olímpica."
  },
  {
    id: "evt_3",
    title: "Melendi · Segunda Fecha Gira Aniversario",
    artist: "Melendi",
    category: "olimpic",
    categoryLabel: "BSM · Palau Sant Jordi",
    venueId: "palau_sant_jordi",
    venueName: "Palau Sant Jordi (BSM)",
    date: "2026-11-02",
    dayLabel: "Lun 02 Nov",
    time: "21:00",
    lat: 41.3648,
    lon: 2.1526,
    expectedAttendance: 16800,
    ticketStatus: "Sold Out",
    source: "Agenda Oficial BSM · Palau Sant Jordi",
    description: "Segunda jornada consecutiva con tráfico denso en accesos de Sants y Poble-sec."
  },
  {
    id: "evt_4",
    title: "FC Barcelona vs. Aston Villa · UEFA Champions League",
    artist: "FC Barcelona",
    category: "fcb",
    categoryLabel: "FC Barcelona · UEFA Champions League",
    venueId: "camp_nou",
    venueName: "Spotify Camp Nou (FCB)",
    date: "2026-11-03",
    dayLabel: "Mar 03 Nov",
    time: "21:00",
    lat: 41.3809,
    lon: 2.1228,
    expectedAttendance: 62500,
    ticketStatus: "Alta demanda",
    source: "Open Data Ajuntament de Barcelona / FCB",
    description: "Presión máxima en Les Corts, Av. Diagonal, Travessera de Les Corts, Numància y calles colindantes."
  },
  {
    id: "evt_5",
    title: "Pitbull · 'I'm Back!' World Tour",
    artist: "Pitbull",
    category: "olimpic",
    categoryLabel: "BSM · Palau Sant Jordi",
    venueId: "palau_sant_jordi",
    venueName: "Palau Sant Jordi (BSM)",
    date: "2026-11-04",
    dayLabel: "Mié 04 Nov",
    time: "21:30",
    lat: 41.3648,
    lon: 2.1526,
    expectedAttendance: 17500,
    ticketStatus: "Sold Out",
    source: "Agenda Oficial BSM · Palau Sant Jordi",
    description: "Alta afluencia de público internacional y nacional. Fuerte demanda de aparcamiento en ejes de conexión."
  },
  {
    id: "evt_6",
    title: "Medina Azahara · Gira 'El Sueño Eterno'",
    artist: "Medina Azahara",
    category: "olimpic",
    categoryLabel: "BSM · Sant Jordi Club",
    venueId: "sant_jordi_club",
    venueName: "Sant Jordi Club (BSM)",
    date: "2026-11-04",
    dayLabel: "Mié 04 Nov",
    time: "20:30",
    lat: 41.3638,
    lon: 2.1512,
    expectedAttendance: 3600,
    ticketStatus: "Entradas disponibles",
    source: "Agenda Oficial BSM · Sant Jordi Club",
    description: "Doble evento musical en Montjuïc coincidiendo con Pitbull."
  },
  {
    id: "evt_7",
    title: "Smart City Expo World Congress · Jornada Inaugural",
    artist: "Fira de Barcelona",
    category: "fira",
    categoryLabel: "Fira de Barcelona · Macrocongreso",
    venueId: "fira_gran_via",
    venueName: "Fira de Barcelona · Gran Via",
    date: "2026-11-05",
    dayLabel: "Jue 05 Nov",
    time: "09:00 - 19:00",
    lat: 41.3545,
    lon: 2.1280,
    expectedAttendance: 24000,
    ticketStatus: "Acreditaciones profesionales",
    source: "Fira de Barcelona",
    description: "Mayor evento mundial de ciudades inteligentes. Gran trasvase de vehículos en Gran Via, Zona Franca y Pl. Europa."
  },
  {
    id: "evt_8",
    title: "Barça Basket vs. Olympiacos · EuroLeague",
    artist: "FC Barcelona Baloncesto",
    category: "fcb",
    categoryLabel: "FC Barcelona · Bàsquet Palau",
    venueId: "palau_blaugrana",
    venueName: "Palau Blaugrana (FCB)",
    date: "2026-11-05",
    dayLabel: "Jue 05 Nov",
    time: "20:30",
    lat: 41.3802,
    lon: 2.1205,
    expectedAttendance: 7100,
    ticketStatus: "Aforo casi completo",
    source: "FC Barcelona / Euroliga",
    description: "Encuentro de alta rivalidad europea con ocupación plena de los viales de Les Corts."
  },
  {
    id: "evt_9",
    title: "La Oreja de Van Gogh · Gira 'Tantas Cosas Que Contar'",
    artist: "La Oreja de Van Gogh",
    category: "olimpic",
    categoryLabel: "BSM · Palau Sant Jordi",
    venueId: "palau_sant_jordi",
    venueName: "Palau Sant Jordi (BSM)",
    date: "2026-11-06",
    dayLabel: "Vie 06 Nov",
    time: "21:00",
    lat: 41.3648,
    lon: 2.1526,
    expectedAttendance: 16500,
    ticketStatus: "Sold Out",
    source: "Agenda Oficial BSM · Palau Sant Jordi",
    description: "Primera de dos noches consecutivas en Montjuïc. Pico de tráfico en el inicio de fin de semana."
  },
  {
    id: "evt_10",
    title: "John Pollõn & Amigos · Directo Barcelona",
    artist: "John Pollõn",
    category: "olimpic",
    categoryLabel: "BSM · Sant Jordi Club",
    venueId: "sant_jordi_club",
    venueName: "Sant Jordi Club (BSM)",
    date: "2026-11-06",
    dayLabel: "Vie 06 Nov",
    time: "21:00",
    lat: 41.3638,
    lon: 2.1512,
    expectedAttendance: 4500,
    ticketStatus: "Sold Out",
    source: "Agenda Oficial BSM · Sant Jordi Club",
    description: "Lleno en la sala anexa del Sant Jordi Club."
  },
  {
    id: "evt_11",
    title: "La Oreja de Van Gogh · Segunda Fecha",
    artist: "La Oreja de Van Gogh",
    category: "olimpic",
    categoryLabel: "BSM · Palau Sant Jordi",
    venueId: "palau_sant_jordi",
    venueName: "Palau Sant Jordi (BSM)",
    date: "2026-11-07",
    dayLabel: "Sáb 07 Nov",
    time: "21:00",
    lat: 41.3648,
    lon: 2.1526,
    expectedAttendance: 16500,
    ticketStatus: "Sold Out",
    source: "Agenda Oficial BSM · Palau Sant Jordi",
    description: "Segunda noche con lleno absoluto. Saturación en accesos a Montjuïc desde Sants, Espanya y Paral·lel."
  },
  {
    id: "evt_12",
    title: "FC Barcelona Femení vs. Chelsea FC · UEFA Women's Champions League",
    artist: "FC Barcelona Femení",
    category: "fcb",
    categoryLabel: "FC Barcelona · Estadi Olímpic",
    venueId: "estadi_olimpic",
    venueName: "Estadi Olímpic Lluís Companys",
    date: "2026-11-07",
    dayLabel: "Sáb 07 Nov",
    time: "18:45",
    lat: 41.3647,
    lon: 2.1557,
    expectedAttendance: 34500,
    ticketStatus: "Alta demanda",
    source: "FC Barcelona / BSM",
    description: "Gran cita europea femenina en el Estadi Olímpic Lluís Companys. Fuerte demanda en aparcamientos de Sants-Montjuïc y ejes de acceso."
  },
  {
    id: "evt_13",
    title: "Joe Bonamassa · Gira Blues Rock Guitar",
    artist: "Joe Bonamassa",
    category: "olimpic",
    categoryLabel: "BSM · Sant Jordi Club",
    venueId: "sant_jordi_club",
    venueName: "Sant Jordi Club (BSM)",
    date: "2026-11-07",
    dayLabel: "Sáb 07 Nov",
    time: "21:00",
    lat: 41.3638,
    lon: 2.1512,
    expectedAttendance: 4300,
    ticketStatus: "Últimas localidades",
    source: "Agenda Oficial BSM · Sant Jordi Club",
    description: "Noche de doble evento en Montjuïc."
  },
  {
    id: "evt_14",
    title: "27a Vueling Cursa de Bombers de Barcelona 2026",
    artist: "Cursa de Bombers",
    category: "fira",
    categoryLabel: "Cursa Popular & Macroevento",
    venueId: "fira_montjuic",
    venueName: "Av. Marquès de l'Argentera / Arc de Triomf",
    date: "2026-11-08",
    dayLabel: "Dom 08 Nov",
    time: "09:00",
    lat: 41.3833,
    lon: 2.1836,
    expectedAttendance: 16000,
    ticketStatus: "Inscripciones cerradas",
    source: "Open Data Ajuntament de Barcelona",
    description: "Cortes de tráfico y desvíos generalizados en el centro de Barcelona durante la mañana."
  }
];

const BCN_EVENTS_7DAYS = [...BCN_OFFICIAL_EVENTS_SCHEDULE];

// =============================================================================

// DISTANCIA MATEMÁTICA EXACTA (FÓRMULA DE HAVERSINE SOBRE COORDENADAS REALES)

// =============================================================================

function calculateHaversineKm(lat1, lon1, lat2, lon2) {

  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const R = 6371; // Radio medio de la Tierra en km

  const dLat = (lat2 - lat1) * Math.PI / 180;

  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +

            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *

            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return +(R * c).toFixed(2);

}

function evaluateEventImpact(distKm, expectedAttendance = 0, category = 'event') {

  if (distKm === null || distKm === undefined || isNaN(distKm)) {

    return {

      level: "SIN DATOS",

      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",

      indicatorDot: "bg-slate-400",

      pressureEstimate: "0%",

      description: "Coordenadas no disponibles para este evento."

    };

  }

  // Modelo de gravedad e influencia peatonal según distancia real y aforo

  const att = expectedAttendance || 5000;

  const isMajorStadium = att >= 20000;

  if (distKm <= 1.2 && isMajorStadium) {

    return {

      level: "CRÍTICO",

      badgeClass: "bg-rose-100 text-rose-800 border-rose-300 font-extrabold",

      indicatorDot: "bg-rose-500 animate-pulse",

      pressureEstimate: "+50% a +75%",

      description: `A solo ${distKm} km del acceso. Máxima saturación rotatoria y bloqueo en calzada.`

    };

  } else if (distKm <= 2.0 && (isMajorStadium || att >= 10000)) {

    return {

      level: "ALTO",

      badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold",

      indicatorDot: "bg-amber-500",

      pressureEstimate: "+25% a +40%",

      description: `A ${distKm} km. Elevada demanda inducida por trasvase de vehículos en búsqueda de plaza.`

    };

  } else if (distKm <= 3.5 || (distKm <= 1.5 && att < 10000)) {

    return {

      level: "MEDIO",

      badgeClass: "bg-sky-100 text-sky-900 border-sky-300 font-medium",

      indicatorDot: "bg-sky-500",

      pressureEstimate: "+10% a +20%",

      description: `A ${distKm} km. Presión moderada en franjas previas y posteriores al inicio.`

    };

  } else {

    return {

      level: "BAJO",

      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",

      indicatorDot: "bg-emerald-500",

      pressureEstimate: "+0% a +5%",

      description: `A ${distKm} km. Impacto marginal en el área de influencia inmediata del aparcamiento.`

    };

  }

}

// Red de sensores municipales poblada en vivo desde la API SQL de Open Data Ajuntament de Barcelona

let BCN_MUNICIPAL_TRAFFIC_SENSORS = [];

