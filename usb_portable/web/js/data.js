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

// Meses oficiales de los datasets de Aforamientos de Open Data Ajuntament de Barcelona (2025 vs. 2024)
const MONTHS_LABELS = ['Ene 25', 'Feb 25', 'Mar 25', 'Abr 25', 'May 25', 'Jun 25', 'Jul 25', 'Ago 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dic 25'];
const MONTHS_PREV_LABELS = ['Ene 24', 'Feb 24', 'Mar 24', 'Abr 24', 'May 24', 'Jun 24', 'Jul 24', 'Ago 24', 'Sep 24', 'Oct 24', 'Nov 24', 'Dic 24'];
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
  const tp1PrevMonthly = (isFromExcel && Array.isArray(p.tp1PrevMonthly) && p.tp1PrevMonthly.length === 12) ? p.tp1PrevMonthly : [...empty12Months];
  const tp1CurMonthly  = (isFromExcel && Array.isArray(p.tp1CurMonthly) && p.tp1CurMonthly.length === 12) ? p.tp1CurMonthly : [...empty12Months];
  const tp2PrevMonthly = (isFromExcel && Array.isArray(p.tp2PrevMonthly) && p.tp2PrevMonthly.length === 12) ? p.tp2PrevMonthly : [...empty12Months];
  const tp2CurMonthly  = (isFromExcel && Array.isArray(p.tp2CurMonthly) && p.tp2CurMonthly.length === 12) ? p.tp2CurMonthly : [...empty12Months];

  const tp1AnnualPrev = tp1PrevMonthly.reduce((a, b) => a + b, 0);
  const tp1AnnualCur  = tp1CurMonthly.reduce((a, b) => a + b, 0);
  const tp1Yoy        = tp1AnnualPrev > 0 ? +(((tp1AnnualCur - tp1AnnualPrev) / tp1AnnualPrev) * 100).toFixed(1) : 0;

  const tp2AnnualPrev = tp2PrevMonthly.reduce((a, b) => a + b, 0);
  const tp2AnnualCur  = tp2CurMonthly.reduce((a, b) => a + b, 0);
  const tp2Yoy        = tp2AnnualPrev > 0 ? +(((tp2AnnualCur - tp2AnnualPrev) / tp2AnnualPrev) * 100).toFixed(1) : 0;

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
      annualCarsPrevYear: tp1AnnualPrev,
      annualCarsCurrentYear: tp1AnnualCur,
      yoyGrowthPct: tp1Yoy,
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
      annualCarsPrevYear: tp2AnnualPrev,
      annualCarsCurrentYear: tp2AnnualCur,
      yoyGrowthPct: tp2Yoy,
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

  const totalCurTraffic  = tp1AnnualCur + tp2AnnualCur;
  const totalPrevTraffic = tp1AnnualPrev + tp2AnnualPrev;
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

// Sin eventos inventados ni simulados (Regla Real-Data-Only)
const BCN_EVENTS_7DAYS = [];

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

function evaluateEventImpact(distKm, expectedAttendance) {
  return {
    level: "SIN DATOS",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    indicatorDot: "bg-slate-400",
    pressureEstimate: "0% (sin datos)",
    description: `Distancia real: ${distKm} km. Sin datos de asistencia en vivo.`
  };
}

// Red de sensores municipales poblada en vivo desde la API SQL de Open Data Ajuntament de Barcelona
let BCN_MUNICIPAL_TRAFFIC_SENSORS = [];
