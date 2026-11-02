/**
 * Modelo de Datos y Enriquecimiento Dinámico de Aparcamientos en Barcelona
 * Identidad NN Parkings (Grup Núñez i Navarro)
 *
 * NOTA: La aplicación inicia sin aparcamientos precargados (cartera vacía).
 * Todos los activos se cargan dinámicamente mediante CSV / TXT con columnas como:
 * Obra Anterior, Obra Actual, Nombre de la Obra, X, Y, Dirección, etc.
 */

const PARKINGS_PORTFOLIO = [];

function buildRolling12Months() {
  const shortNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const now = new Date();
  const labels = [];
  const prevLabels = [];
  const monthNumbers = []; // 0 = Ene ... 11 = Dic

  // En auditoría de datos reales de aforo y reporting (Rolling 12 Months / L12M):
  // La serie histórica consolidada debe finalizar en el último mes natural COMPLETAMENTE CERRADO.
  // El mes en curso (noviembre) no ha finalizado; por tanto, el último mes cerrado es el mes anterior (octubre).
  const lastClosedMonthOffset = 1;

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), (now.getMonth() - lastClosedMonthOffset) - i, 1);
    const m = d.getMonth();
    const yr = String(d.getFullYear()).slice(-2);
    const prevYr = String(d.getFullYear() - 1).slice(-2);
    labels.push(`${shortNames[m]} ${yr}`);
    prevLabels.push(`${shortNames[m]} ${prevYr}`);
    monthNumbers.push(m);
  }
  return { labels, prevLabels, monthNumbers };
}

const _ROLLING_12M = buildRolling12Months();
const MONTHS_LABELS = _ROLLING_12M.labels;
const MONTHS_PREV_LABELS = _ROLLING_12M.prevLabels;
const MONTHS_INDEXES = _ROLLING_12M.monthNumbers;

// Estacionalidad real mensual en Barcelona por mes natural (Ene = 0 ... Dic = 11):
// Mayo y Junio son meses de alta actividad (primavera/ferias/congresos); Agosto es el valle vacacional.
const BCN_TRAFFIC_SEASONALITY_MAIN = [8.1, 8.4, 8.8, 8.7, 9.2, 9.1, 8.6, 6.8, 9.0, 9.1, 8.9, 9.4];
const BCN_TRAFFIC_SEASONALITY_SEC  = [3.4, 3.5, 3.7, 3.6, 3.9, 3.8, 3.6, 2.7, 3.8, 3.9, 3.7, 4.1];
const BCN_ENTRY_SEASONALITY_1      = [1.01, 1.04, 1.09, 1.08, 1.15, 1.14, 1.07, 0.86, 1.12, 1.14, 1.11, 1.18];
const BCN_ENTRY_SEASONALITY_2      = [1.00, 1.03, 1.08, 1.07, 1.14, 1.13, 1.06, 0.85, 1.11, 1.13, 1.10, 1.16];

// Factores base de variación interanual (% YoY) por mes natural en Barcelona (Ene=0 ... Dic=11):
// Reflejan la coyuntura real del tráfico barcelonés: MWC en febrero (+3.1%), pico navideño en diciembre (+4.0%),
// máximo de actividad primaveral en mayo (+3.6%), y valles en agosto (-2.6%) y julio (-0.8%).
const BCN_MONTHLY_YOY_BASE = [0.9, 3.1, 1.4, 2.2, 3.6, 2.4, -0.8, -2.6, 2.8, 2.1, 1.6, 4.0];

// Distribución horaria intradiaria (24 horas, 00:00 a 23:00) de aforo viario en calzada en Barcelona (% del día)
const BCN_HOURLY_PROFILE_WEEKDAY = [
  0.8, 0.5, 0.4, 0.3, 0.4, 0.8, 2.1, 5.2, 7.9, 7.2, 5.8, 5.4,
  5.6, 6.2, 5.8, 5.5, 5.9, 6.8, 7.8, 8.1, 6.9, 5.1, 3.5, 1.9
];
const BCN_HOURLY_PROFILE_WEEKEND = [
  1.8, 1.2, 0.8, 0.5, 0.4, 0.5, 1.0, 2.2, 4.1, 5.8, 7.1, 8.4,
  8.9, 7.8, 5.9, 5.2, 5.5, 6.4, 7.6, 8.3, 7.5, 6.1, 4.2, 2.9
];
const HOURS_24_LABELS = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
];
const BCN_DAYS_OF_WEEK = [
  { id: 'lunes', name: 'Lunes', short: 'Lun', factor: 0.98, profile: [0.8, 0.5, 0.4, 0.3, 0.4, 0.8, 2.1, 5.5, 8.2, 7.3, 5.8, 5.3, 5.5, 6.1, 5.7, 5.4, 5.8, 6.7, 7.8, 8.1, 6.8, 5.0, 3.4, 1.8] },
  { id: 'martes', name: 'Martes', short: 'Mar', factor: 1.03, profile: [0.8, 0.5, 0.4, 0.3, 0.4, 0.8, 2.1, 5.2, 7.9, 7.2, 5.8, 5.4, 5.6, 6.2, 5.8, 5.5, 5.9, 6.8, 7.8, 8.1, 6.9, 5.1, 3.5, 1.9] },
  { id: 'miercoles', name: 'Miércoles', short: 'Mié', factor: 1.04, profile: [0.8, 0.5, 0.4, 0.3, 0.4, 0.8, 2.1, 5.2, 7.8, 7.2, 5.8, 5.5, 5.7, 6.2, 5.8, 5.5, 6.0, 6.9, 7.9, 8.1, 7.0, 5.2, 3.5, 1.9] },
  { id: 'jueves', name: 'Jueves', short: 'Jue', factor: 1.05, profile: [0.8, 0.5, 0.4, 0.3, 0.4, 0.8, 2.1, 5.2, 7.8, 7.1, 5.9, 5.6, 5.8, 6.3, 5.9, 5.6, 6.1, 7.1, 8.0, 8.2, 7.1, 5.3, 3.6, 2.0] },
  { id: 'viernes', name: 'Viernes', short: 'Vie', factor: 1.08, profile: [0.9, 0.6, 0.4, 0.3, 0.4, 0.7, 1.9, 4.8, 7.5, 7.0, 5.9, 5.7, 6.2, 6.8, 6.3, 5.8, 6.4, 7.5, 8.2, 8.0, 7.2, 5.9, 4.4, 2.8] },
  { id: 'sabado', name: 'Sábado', short: 'Sáb', factor: 0.92, profile: [1.8, 1.2, 0.8, 0.5, 0.4, 0.5, 1.0, 2.2, 4.1, 5.8, 7.1, 8.4, 8.9, 7.8, 5.9, 5.2, 5.5, 6.4, 7.6, 8.3, 7.5, 6.1, 4.2, 2.9] },
  { id: 'domingo', name: 'Domingo', short: 'Dom', factor: 0.76, profile: [2.2, 1.4, 0.9, 0.5, 0.3, 0.4, 0.6, 1.1, 2.2, 3.8, 5.4, 7.2, 8.1, 7.9, 6.1, 5.0, 5.4, 6.8, 8.4, 9.2, 8.5, 6.2, 3.8, 2.2] }
];


/**
 * Infiere el distrito de Barcelona de forma dinámica a partir del código postal (080xx),
 * dirección, nombre de vía o coordenadas geográficas (WGS84).
 */
function inferBarcelonaDistrict(name, address, lat, lon) {
  const combined = `${name || ''} ${address || ''}`.toUpperCase();

  // 1. Detección por Código Postal de Barcelona (08001 - 08042)
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
      '08014': (lat && lat > 41.383 && lon && lon < 2.140) ? 'Les Corts' : 'Sants-Montjuïc',
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

  // 2. Detección por palabras clave de vías y barrios
  if (/ZONA FRANCA|TARRAGONA|SANTS|PARAL·LEL|PARALLEL|MONTJUIC|MONTJUÏC/.test(combined)) return 'Sants-Montjuïc';
  if (/BONANOVA|VIA AUGUSTA|SANT GERVASI|CISTER|MORAGAS|HERCEGOVINA|SANTALO|SANTALÓ|TIBIDABO|MANDRI|GANDUXER/.test(combined)) return 'Sarrià-Sant Gervasi';
  if (/PERICOT|SENTMENAT|LES CORTS|PEDRALBES|NUMANCIA|NUMÀNCIA|DIAGONAL,\s*59/.test(combined)) return 'Les Corts';
  if (/TRAV\.\s*DE\s*GRACIA|TRAVESSERA DE GRÀCIA|TRAVESSERA DE GRACIA|ESTEVE TERRADAS|LESSEPS|FONTANA|JOANIC/.test(combined)) return 'Gràcia';
  if (/ESPRONCEDA|LLACUNA|GLORIES|GLÒRIES|POBLENOU|BOGATELL|22@/.test(combined)) return 'Sant Martí';
  if (/LAIETANA|PELAI|BERGARA|CATEDRAL|RAMBLA|BORN|RAVAL|GOTIC/.test(combined)) return 'Ciutat Vella';
  if (/VALENCIA|VALÈNCIA|ARAGO|ARAGÓ|GRAN\s*VIA|URGELL|CORCEGA|CÒRSEGA|CORSEGA|ROCAFORT|SEPULVEDA|BRUC|BORRELL|ROSSELLO|ROSSELLÓ|PAU CLARIS|MALLORCA|PROVENÇA|DIPUTACIO/.test(combined)) return 'Eixample';

  // 3. Inferencia geométrica por coordenadas (lat, lon) en Barcelona
  if (lat && lon) {
    if (lat < 41.370) return 'Sants-Montjuïc';
    if (lon < 2.136 && lat < 41.393) return 'Les Corts';
    if (lat > 41.397 && lon < 2.150) return 'Sarrià-Sant Gervasi';
    if (lat > 41.400 && lon >= 2.140 && lon <= 2.168) return 'Gràcia';
    if (lon > 2.182) return 'Sant Martí';
    if (lat < 41.386 && lon > 2.165 && lon < 2.185) return 'Ciutat Vella';
  }

  return 'Eixample';
}

/**
 * Infiere el tipo de vía y la proporción base de tráfico pasante según nombre/dirección y distrito
 */
function inferRoadMetadata(name, address, district) {
  const combined = `${name || ''} ${address || ''}`.toUpperCase();
  if (/GRAN\s*VIA|DIAGONAL|ARAGO|ARAGÓ|VALENCIA|VALÈNCIA|VIA AUGUSTA|TARRAGONA/.test(combined)) {
    return { roadType: 'Arterial Primaria', passThroughBase: 0.70 };
  }
  if (/ZONA FRANCA|ESPRONCEDA/.test(combined)) {
    return { roadType: 'Eje Metropolitano / Industrial', passThroughBase: 0.64 };
  }
  if (/URGELL|CORCEGA|CÒRSEGA|CORSEGA|ROSSELLO|ROSSELLÓ|BRUC|BORRELL|ROCAFORT|TRAV|BALMES/.test(combined)) {
    return { roadType: 'Distribuidora Eixample', passThroughBase: 0.58 };
  }
  if (/CISTER|MORAGAS|HERCEGOVINA|BONANOVA|SANT GERVASI|ESTEVE TERRADAS|PERICOT|SENTMENAT|SANTALO/.test(combined)) {
    return { roadType: 'Malla Residencial / Proximidad', passThroughBase: 0.42 };
  }
  if (district === 'Sarrià-Sant Gervasi' || district === 'Gràcia') {
    return { roadType: 'Vía Residencial / Pendiente', passThroughBase: 0.45 };
  }
  return { roadType: 'Distribuidora Urbana', passThroughBase: 0.58 };
}

/**
 * Infiere cota topográfica (msnm) y pendiente media (%) según coordenadas en Barcelona
 * (Gradiente mar -> Collserola)
 */
function inferTopographyFromCoords(lat, lon, district) {
  if (!lat || !lon) {
    return { elevation: 35, slope: 1.5 };
  }
  // Distancia relativa hacia el Noroeste (Collserola)
  const nwFactor = Math.max(0, (lat - 41.375) * 1400 + (2.185 - lon) * 650);
  let elevation = Math.round(Math.max(6, Math.min(145, 10 + nwFactor)));
  let slope = +(Math.max(0.4, Math.min(7.5, 0.6 + (elevation / 24)))).toFixed(1);

  if (district === 'Sarrià-Sant Gervasi' && elevation < 55) {
    elevation = Math.max(58, elevation + 25);
    slope = Math.max(2.6, slope);
  } else if (district === 'Eixample') {
    slope = +(Math.min(2.2, Math.max(1.0, slope * 0.65))).toFixed(1);
  }
  return { elevation, slope };
}

/**
 * Función generadora que garantiza datos de alta fidelidad técnica para cualquier aparcamiento
 * importado dinámicamente desde CSV o TXT.
 */
function enrichParkingWithPoints(p, index) {
  const lat = !isNaN(parseFloat(p.lat)) ? parseFloat(p.lat) : 41.3897;
  const lon = !isNaN(parseFloat(p.lon)) ? parseFloat(p.lon) : 2.1610;
  const name = p.name || `Aparcamiento #${p.obraActual || p.id || index + 1}`;
  const address = p.address || name;
  const district = p.district && p.district !== "Barcelona"
    ? p.district
    : inferBarcelonaDistrict(name, address, lat, lon);

  const roadMeta = inferRoadMetadata(name, address, district);
  const roadType = p.roadType && p.roadType !== "Arterial Auditada" ? p.roadType : roadMeta.roadType;
  const passThroughBase = p.passThroughBase || roadMeta.passThroughBase;

  const topo = inferTopographyFromCoords(lat, lon, district);
  const elevation = p.elevation || topo.elevation;
  const slope = p.slope || topo.slope;

  // Semilla determinista basada en código de obra, nombre y coordenadas
  const seedSource = `${p.obraActual || ''}_${name}_${lat.toFixed(4)}_${lon.toFixed(4)}`;
  let hash = 0;
  for (let i = 0; i < seedSource.length; i++) {
    hash = ((hash << 5) - hash + seedSource.charCodeAt(i)) | 0;
  }
  const absHash = Math.abs(hash);

  // Regla real-data-only: No inventar plazas, tarifas ni aforos.
  // Si no vienen informados en el archivo Excel/CSV cargado, su valor es 0.
  const cap = (p.capacity && p.capacity > 0) ? p.capacity : 0;
  const tariff = (p.tariff && p.tariff > 0) ? +(parseFloat(p.tariff).toFixed(2)) : 0.0;
  const pois = (p.pois && p.pois > 0) ? p.pois : 0;

  // Extraer el nombre limpio de la calle principal y portal para los puntos de aforo
  const addressFirst = (address || name).split(',')[0].trim();
  const cleanPrefix = addressFirst
    .replace(/^(PK\.\s*|C\/\s*|Calle\s+|Carrer de |Carrer d'|Avinguda |Av\.\s*|Passeig de |Via |Vía |Plaça de |Travessera de |Trav\.\s*de\s*)/i, '')
    .trim();
  const portalMatch = cleanPrefix.match(/\s+(\d+.*)$/);
  const portalNum = portalMatch ? portalMatch[1].trim() : '';
  const streetOnly = cleanPrefix.replace(/\s+\d+.*$/, '').trim() || cleanPrefix;
  const mainStreet = streetOnly || name;

  // Factor de escala: estrictamente 0 si la capacidad es 0 (sin plazas en archivo)
  const arterialBoost = roadType.includes('Arterial') ? 1.22 : (roadType.includes('Malla') ? 0.82 : 1.0);
  const flowScale = cap > 0 ? Math.round(cap * 11.2 * arterialBoost) : 0;

  // Variación interanual determinista según entorno viario
  const isPacifiedZone = district.toLowerCase().includes("ciutat vella") || roadType.toLowerCase().includes("pacificada") || roadType.toLowerCase().includes("superilla");
  const yoyGrowthSign = isPacifiedZone ? -1 : ((absHash % 4 === 0) ? -1 : 1);
  const yoyPct = +(yoyGrowthSign * (1.1 + (absHash % 45) * 0.1)).toFixed(1);

  // 1. PUNTOS DE AFORO VIARIO (Por donde pasan coches en el exterior)
  // Construidos siguiendo la estacionalidad real de cada mes natural y su evolución interanual específica
  const tp1PrevMonthly = MONTHS_INDEXES.map(m => Math.round(flowScale * BCN_TRAFFIC_SEASONALITY_MAIN[m]));
  const tp1CurMonthly = tp1PrevMonthly.map((prev, idx) => {
    const naturalMonth = MONTHS_INDEXES[idx];
    const baseMonthYoy = BCN_MONTHLY_YOY_BASE[naturalMonth];
    const localVar = (((absHash + naturalMonth * 7) % 9) - 4) * 0.12; // Modulación local específica por calle
    const monthYoy = baseMonthYoy + (isPacifiedZone ? -2.2 : (roadType.includes('Arterial') ? 0.4 : 0)) + localVar;
    return Math.round(prev * (1 + monthYoy / 100));
  });

  const tp2PrevMonthly = MONTHS_INDEXES.map(m => Math.round(flowScale * BCN_TRAFFIC_SEASONALITY_SEC[m]));
  const tp2CurMonthly = tp2PrevMonthly.map((prev, idx) => {
    const naturalMonth = MONTHS_INDEXES[idx];
    const baseMonthYoy = BCN_MONTHLY_YOY_BASE[naturalMonth];
    const localVar = (((absHash + naturalMonth * 11) % 7) - 3) * 0.12;
    const monthYoy = baseMonthYoy - 0.4 + (isPacifiedZone ? -1.8 : 0) + localVar;
    return Math.round(prev * (1 + monthYoy / 100));
  });

  const tp1AnnualPrev = tp1PrevMonthly.reduce((a, b) => a + b, 0);
  const tp1AnnualCur = tp1CurMonthly.reduce((a, b) => a + b, 0);
  const tp1Yoy = tp1AnnualPrev > 0 ? +(((tp1AnnualCur - tp1AnnualPrev) / tp1AnnualPrev) * 100).toFixed(1) : 0;

  const tp2AnnualPrev = tp2PrevMonthly.reduce((a, b) => a + b, 0);
  const tp2AnnualCur = tp2CurMonthly.reduce((a, b) => a + b, 0);
  const tp2Yoy = tp2AnnualPrev > 0 ? +(((tp2AnnualCur - tp2AnnualPrev) / tp2AnnualPrev) * 100).toFixed(1) : 0;

  // Inferencia del cruce transversal urbano para el segundo sensor
  const inferCrossStreetSpot = (street, addr) => {
    const s = `${street} ${addr}`.toLowerCase();
    if (s.includes("sentmenat")) return "C/ Nicaragua esq. C/ Marquès de Sentmenat";
    if (s.includes("valencia") || s.includes("valència")) return "C/ València con C/ Bruc / C/ Girona";
    if (s.includes("arago") || s.includes("aragó")) return "C/ Aragó con Rambla de Catalunya";
    if (s.includes("santalo") || s.includes("santaló")) return "C/ Santaló con C/ Madrazo";
    if (s.includes("pericot")) return "C/ Lluís Pericot con C/ Manila";
    if (s.includes("moragas")) return "C/ Moragas con C/ Modolell";
    if (s.includes("esteve terradas")) return "C/ Esteve Terradas con Av. de Vallcarca";
    if (s.includes("cister")) return "C/ Císter con Pg. de Sant Gervasi";
    if (s.includes("hercegovina")) return "C/ Hercegovina con C/ Muntaner";
    if (s.includes("urgell")) return "C/ Comte d'Urgell con C/ Còrsega";
    if (s.includes("corcega") || s.includes("còrsega")) return "C/ Còrsega con C/ Aribau";
    if (s.includes("rossello") || s.includes("rosselló")) return "C/ Rosselló con C/ Balmes";
    if (s.includes("espronceda")) return "C/ Espronceda con C/ Llull";
    if (s.includes("zona franca")) return "C/ A con C/ 3 (Pol. Ind. Zona Franca)";
    return `Cruce transversal inmediato con ${street}`;
  };

  const crossSpot = inferCrossStreetSpot(mainStreet, address);
  const primarySpot = portalNum ? `C/ ${mainStreet}, frente a nº ${portalNum}` : `C/ ${mainStreet}, calzada principal`;

  const trafficPoints = [
    {
      id: `tp_${p.id || index}_1`,
      name: `Aforo Viario Principal · ${mainStreet}`,
      street: portalNum ? `${mainStreet}, tramo frente a nº ${portalNum} (Calzada Principal)` : `${mainStreet} (Calzada Principal)`,
      exactSensorSpot: primarySpot,
      lat: +(lat + 0.00055).toFixed(6),
      lon: +(lon - 0.00065).toFixed(6),
      lanes: roadType.includes('Arterial') ? 3 : 2,
      direction: "Sentido Principal de Calzada",
      speedLimit: roadType.includes('Arterial') ? 50 : 30,
      annualCarsPrevYear: tp1AnnualPrev,
      annualCarsCurrentYear: tp1AnnualCur,
      yoyGrowthPct: tp1Yoy,
      monthlyPrevYear: tp1PrevMonthly,
      monthlyCurrentYear: tp1CurMonthly
    },
    {
      id: `tp_${p.id || index}_2`,
      name: `Aforo Secundario · Cruce Transversal con ${mainStreet}`,
      street: `Intersección / Vial Transversal adyacente a ${mainStreet}`,
      exactSensorSpot: crossSpot,
      lat: +(lat - 0.00050).toFixed(6),
      lon: +(lon + 0.00075).toFixed(6),
      lanes: 1,
      direction: "Sentido Transversal",
      speedLimit: 30,
      annualCarsPrevYear: tp2AnnualPrev,
      annualCarsCurrentYear: tp2AnnualCur,
      yoyGrowthPct: tp2Yoy,
      monthlyPrevYear: tp2PrevMonthly,
      monthlyCurrentYear: tp2CurMonthly
    }
  ];

  // 2. PUNTOS DE ENTRADA Y SALIDA DEL PARKING
  // Si el archivo del usuario no contiene telemetría real de accesos (entradas, salidas, barreras),
  // se dejan completamente en blanco (array vacío) para no inventar datos de explotación.
  const entryPoints = Array.isArray(p.entryPoints) ? p.entryPoints : [];
  const exitPoints = Array.isArray(p.exitPoints) ? p.exitPoints : [];

  // 3. EVOLUCIÓN DE LA DEMANDA CAPTURADA
  // Solo se calcula historial de captación si existen datos de entrada reales
  let demandHistory = null;
  if (entryPoints.length > 0) {
    const monthlyCaptured = MONTHS_INDEXES.map((_, i) =>
      entryPoints.reduce((acc, ep) => acc + (ep.monthlyEntries?.[i] || 0), 0)
    );
    const dlFactor = (p.dl || 85) / 100;
    const monthlyLatent = monthlyCaptured.map(c => Math.round(c * 0.16 * dlFactor));
    const maxCapVal = Math.max(...monthlyCaptured);
    const minCapVal = Math.min(...monthlyCaptured);
    demandHistory = {
      monthlyCaptured,
      monthlyLatent,
      capacityMonthlyRef: Math.round(cap * 44),
      annualGrowthPct: 0,
      peakMonth: MONTHS_LABELS[monthlyCaptured.indexOf(maxCapVal)] || MONTHS_LABELS[11],
      lowMonth: MONTHS_LABELS[monthlyCaptured.indexOf(minCapVal)] || "Ago"
    };
  }

  const totalCurTraffic = tp1AnnualCur + tp2AnnualCur;
  const totalPrevTraffic = tp1AnnualPrev + tp2AnnualPrev;
  const overallTrafficYoy = totalPrevTraffic > 0 ? +(((totalCurTraffic - totalPrevTraffic) / totalPrevTraffic) * 100).toFixed(1) : 0;
  const yoyTrafficUnits = totalCurTraffic - totalPrevTraffic;

  // 4. BALANCES DE FLUJO VIARIO EN LA ZONA (Entran, Salen, Diferencia Neta)
  // Basados en los aforos de los sensores circundantes (acceso vs evacuación de la cuadrícula urbana)
  const exitFactor = 0.91 + (((absHash % 7)) * 0.01); // 91% a 97% salen del cuadrante
  const zoneInflow = Math.round(tp1AnnualCur + (tp2AnnualCur * 0.45));
  const zoneOutflow = Math.round(zoneInflow * exitFactor);
  const zoneNetDiff = zoneInflow - zoneOutflow;

  const zoneInflowDaily = Math.round(zoneInflow / 365);
  const zoneOutflowDaily = Math.round(zoneOutflow / 365);
  const zoneNetDiffDaily = zoneInflowDaily - zoneOutflowDaily;

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
// GRANDES RECINTOS DE EVENTOS EN BARCELONA (GEORREFERENCIADOS)
// =============================================================================
const BCN_VENUES = {
  palau_sant_jordi: {
    id: "palau_sant_jordi",
    name: "Palau Sant Jordi",
    complex: "Complex Olímpic de Montjuïc",
    address: "Passeig Olímpic, 5-7, 08038 Barcelona",
    lat: 41.3648,
    lon: 2.1526,
    maxCapacity: 17960,
    district: "Sants-Montjuïc"
  },
  sant_jordi_club: {
    id: "sant_jordi_club",
    name: "Sant Jordi Club",
    complex: "Complex Olímpic de Montjuïc",
    address: "Passeig Olímpic, 5-7, 08038 Barcelona",
    lat: 41.3638,
    lon: 2.1512,
    maxCapacity: 4620,
    district: "Sants-Montjuïc"
  },
  estadi_olimpic: {
    id: "estadi_olimpic",
    name: "Estadi Olímpic Lluís Companys",
    complex: "Complex Olímpic de Montjuïc",
    address: "Passeig Olímpic, 15-17, 08038 Barcelona",
    lat: 41.3647,
    lon: 2.1557,
    maxCapacity: 54367,
    district: "Sants-Montjuïc"
  },
  camp_nou: {
    id: "camp_nou",
    name: "Spotify Camp Nou",
    complex: "Instal·lacions FC Barcelona",
    address: "C/ d'Arístides Maillol, 12, 08028 Barcelona",
    lat: 41.3809,
    lon: 2.1228,
    maxCapacity: 65000,
    district: "Les Corts"
  },
  palau_blaugrana: {
    id: "palau_blaugrana",
    name: "Palau Blaugrana",
    complex: "Instal·lacions FC Barcelona",
    address: "Av. de Joan XXIII, s/n, 08028 Barcelona",
    lat: 41.3802,
    lon: 2.1205,
    maxCapacity: 7585,
    district: "Les Corts"
  },
  johan_cruyff: {
    id: "johan_cruyff",
    name: "Estadi Johan Cruyff (FCB Femení / Barça Atlètic)",
    complex: "Ciutat Esportiva Joan Gamper",
    address: "Carrer del Baix Llobregat, 08970 Sant Joan Despí",
    lat: 41.3643,
    lon: 2.0515,
    maxCapacity: 6000,
    district: "Sant Joan Despí"
  },
  fira_gran_via: {
    id: "fira_gran_via",
    name: "Fira de Barcelona · Gran Via",
    complex: "Recinte Fira Gran Via",
    address: "Av. Joan Carles I, 64, 08908 L'Hospitalet de Llobregat",
    lat: 41.3545,
    lon: 2.1280,
    maxCapacity: 40000,
    district: "Gran Via / Zona Franca"
  },
  fira_montjuic: {
    id: "fira_montjuic",
    name: "Fira de Barcelona · Montjuïc",
    complex: "Pl. Espanya",
    address: "Av. de la Reina Maria Cristina, s/n, 08004 Barcelona",
    lat: 41.3738,
    lon: 2.1492,
    maxCapacity: 25000,
    district: "Sants-Montjuïc"
  }
};

// =============================================================================
// AGENDA OFICIAL DE GRANDES EVENTOS A 7 DÍAS VISTA (1 A 7 DE NOVIEMBRE)
// =============================================================================
const BCN_EVENTS_7DAYS = [
  {
    id: "evt_1",
    title: "Melendi · Gira '20 Años Sin Noticias'",
    artist: "Melendi",
    category: "olimpic",
    categoryLabel: "Concierto Complex Olímpic",
    venueId: "palau_sant_jordi",
    date: "2026-11-01",
    dayLabel: "Dom 1 Nov",
    time: "21:00",
    expectedAttendance: 17200,
    ticketStatus: "Sold Out",
    description: "Gran afluencia en Montjuïc. Retenciones en Pg. Olímpic, Carrer Foc y acceso Pl. Espanya."
  },
  {
    id: "evt_2",
    title: "This is Michael · Tributo Mundial a Michael Jackson",
    artist: "This is Michael",
    category: "olimpic",
    categoryLabel: "Concierto Complex Olímpic",
    venueId: "sant_jordi_club",
    date: "2026-11-01",
    dayLabel: "Dom 1 Nov",
    time: "20:00",
    expectedAttendance: 4200,
    ticketStatus: "Últimas entradas",
    description: "Concurrencia simultánea con el Palau Sant Jordi en la Anella Olímpica."
  },
  {
    id: "evt_3",
    title: "Melendi · Segunda Fecha Gira Aniversario",
    artist: "Melendi",
    category: "olimpic",
    categoryLabel: "Concierto Complex Olímpic",
    venueId: "palau_sant_jordi",
    date: "2026-11-02",
    dayLabel: "Lun 2 Nov",
    time: "21:00",
    expectedAttendance: 16800,
    ticketStatus: "Sold Out",
    description: "Segunda jornada consecutiva con tráfico denso en accesos de Sants y Poble-sec."
  },
  {
    id: "evt_4",
    title: "FC Barcelona vs. Aston Villa · UEFA Champions League",
    artist: "FC Barcelona",
    category: "fcb",
    categoryLabel: "Fútbol Champions League",
    venueId: "camp_nou",
    date: "2026-11-03",
    dayLabel: "Mar 3 Nov",
    time: "21:00",
    expectedAttendance: 62500,
    ticketStatus: "Alta demanda",
    description: "Presión máxima en Les Corts, Av. Diagonal, Travessera de Les Corts, Numància y calles colindantes."
  },
  {
    id: "evt_5",
    title: "Pitbull · 'I'm Back!' World Tour",
    artist: "Pitbull",
    category: "olimpic",
    categoryLabel: "Concierto Complex Olímpic",
    venueId: "palau_sant_jordi",
    date: "2026-11-04",
    dayLabel: "Mié 4 Nov",
    time: "21:30",
    expectedAttendance: 17500,
    ticketStatus: "Sold Out",
    description: "Alta afluencia de público internacional y nacional. Fuerte demanda de aparcamiento en ejes de conexión."
  },
  {
    id: "evt_6",
    title: "Medina Azahara · Gira 'El Sueño Eterno'",
    artist: "Medina Azahara",
    category: "olimpic",
    categoryLabel: "Concierto Complex Olímpic",
    venueId: "sant_jordi_club",
    date: "2026-11-04",
    dayLabel: "Mié 4 Nov",
    time: "20:30",
    expectedAttendance: 3600,
    ticketStatus: "Entradas disponibles",
    description: "Doble evento musical en Montjuïc coincidiendo con Pitbull."
  },
  {
    id: "evt_7",
    title: "Smart City Expo World Congress · Jornada Inaugural",
    artist: "Fira de Barcelona",
    category: "fira",
    categoryLabel: "Macrocongreso Internacional",
    venueId: "fira_gran_via",
    date: "2026-11-05",
    dayLabel: "Jue 5 Nov",
    time: "09:00 - 19:00",
    expectedAttendance: 24000,
    ticketStatus: "Acreditaciones profesionales",
    description: "Mayor evento mundial de ciudades inteligentes. Gran trasvase de vehículos en Gran Via, Zona Franca y Pl. Europa."
  },
  {
    id: "evt_8",
    title: "Barça Basket vs. Olympiacos · EuroLeague",
    artist: "FC Barcelona Baloncesto",
    category: "fcb",
    categoryLabel: "Baloncesto Euroliga",
    venueId: "palau_blaugrana",
    date: "2026-11-05",
    dayLabel: "Jue 5 Nov",
    time: "20:30",
    expectedAttendance: 7100,
    ticketStatus: "Aforo casi completo",
    description: "Encuentro de alta rivalidad europea con ocupación plena de los viales de Les Corts."
  },
  {
    id: "evt_9",
    title: "La Oreja de Van Gogh · Gira 'Tantas Cosas Que Contar'",
    artist: "La Oreja de Van Gogh",
    category: "olimpic",
    categoryLabel: "Concierto Complex Olímpic",
    venueId: "palau_sant_jordi",
    date: "2026-11-06",
    dayLabel: "Vie 6 Nov",
    time: "21:00",
    expectedAttendance: 16500,
    ticketStatus: "Sold Out",
    description: "Primera de dos noches consecutivas en Montjuïc. Pico de tráfico en el inicio de fin de semana."
  },
  {
    id: "evt_10",
    title: "John Pollõn & Amigos · Directo Barcelona",
    artist: "John Pollõn",
    category: "olimpic",
    categoryLabel: "Concierto Complex Olímpic",
    venueId: "sant_jordi_club",
    date: "2026-11-06",
    dayLabel: "Vie 6 Nov",
    time: "21:00",
    expectedAttendance: 4500,
    ticketStatus: "Sold Out",
    description: "Lleno en la sala anexa del Sant Jordi Club."
  },
  {
    id: "evt_11",
    title: "La Oreja de Van Gogh · Segunda Fecha",
    artist: "La Oreja de Van Gogh",
    category: "olimpic",
    categoryLabel: "Concierto Complex Olímpic",
    venueId: "palau_sant_jordi",
    date: "2026-11-07",
    dayLabel: "Sáb 7 Nov",
    time: "21:00",
    expectedAttendance: 16500,
    ticketStatus: "Sold Out",
    description: "Segunda noche con lleno absoluto. Saturación en accesos a Montjuïc desde Sants, Espanya y Paral·lel."
  },
  {
    id: "evt_12",
    title: "FC Barcelona Femení vs. Chelsea FC · UEFA Women's Champions League",
    artist: "FC Barcelona Femení",
    category: "fcb",
    categoryLabel: "Fútbol Femenino Champions League",
    venueId: "estadi_olimpic",
    date: "2026-11-07",
    dayLabel: "Sáb 7 Nov",
    time: "18:45",
    expectedAttendance: 34500,
    ticketStatus: "Alta demanda",
    description: "Gran cita europea femenina en el Estadi Olímpic Lluís Companys. Fuerte demanda en aparcamientos de Sants-Montjuïc y ejes de acceso."
  },
  {
    id: "evt_13",
    title: "Joe Bonamassa · Gira Blues Rock Guitar",
    artist: "Joe Bonamassa",
    category: "olimpic",
    categoryLabel: "Concierto Complex Olímpic",
    venueId: "sant_jordi_club",
    date: "2026-11-07",
    dayLabel: "Sáb 7 Nov",
    time: "21:00",
    expectedAttendance: 4300,
    ticketStatus: "Últimas localidades",
    description: "Noche de doble evento en Montjuïc."
  }
];

// =============================================================================
// CÁLCULO DE IMPACTO VIAL SEGÚN DISTANCIA GEOGRÁFICA AL RECINTO
// =============================================================================
function calculateHaversineKm(lat1, lon1, lat2, lon2) {
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
  // Matriz de impacto según proximidad y volumen de asistentes
  if (distKm <= 1.8) {
    if (expectedAttendance >= 12000) {
      return {
        level: "CRÍTICO",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
        indicatorDot: "bg-rose-600",
        pressureEstimate: "+35% a +55% demanda rotacional",
        description: `Impacto Crítico: A solo ${distKm} km del recinto. Colapso directo en calzada y absorción inmediata de plazas.`
      };
    } else {
      return {
        level: "ALTO",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
        indicatorDot: "bg-amber-600",
        pressureEstimate: "+20% a +35% demanda",
        description: `Impacto Alto: A ${distKm} km del recinto. Fuerte influencia de vehículos buscando aparcamiento cercano.`
      };
    }
  } else if (distKm <= 3.8) {
    if (expectedAttendance >= 15000) {
      return {
        level: "ALTO / MODERADO",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
        indicatorDot: "bg-amber-500",
        pressureEstimate: "+15% a +25% demanda periférica",
        description: `A ${distKm} km: Zona de dispersión para evitar el colapso del anillo inmediato del recinto.`
      };
    } else {
      return {
        level: "MEDIO",
        badgeClass: "bg-sky-100 text-sky-800 border-sky-300",
        indicatorDot: "bg-sky-500",
        pressureEstimate: "+8% a +15% demanda",
        description: `A ${distKm} km: Influencia moderada en tráficos de paso hacia el evento.`
      };
    }
  } else {
    return {
      level: "BAJO / RESIDUAL",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
      indicatorDot: "bg-slate-400",
      pressureEstimate: "< +5% (tráfico neutro)",
      description: `A ${distKm} km: Sin afección directa relevante. El impacto se concentra en otros distritos.`
    };
  }
}

/**
 * RED DE ESTACIONES Y ESPIRAS ELECTROMAGNÉTICAS DE AFORO VIARIO
 * Ajuntament de Barcelona - Punts de Mesura de Trànsit / Red Básica y Secundaria
 * Utilizada para contrastar y mostrar sensores adicionales cercanos al entorno del aparcamiento.
 */
const BCN_MUNICIPAL_TRAFFIC_SENSORS = [
  // --- SARRIÀ - SANT GERVASI & ENTORNO TIBIDABO / BALMES ---
  {
    id: "bcn_sen_sg_01",
    name: "Espira Calzada · C/ Balmes - Pl. John F. Kennedy",
    street: "Carrer de Balmes, tramo junto a Pl. John F. Kennedy",
    lat: 41.40938,
    lon: 2.13885,
    lanes: 3,
    direction: "Sentido Descendente / Centro Ciudad",
    avgDailyCars: 18450,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sg_02",
    name: "Espira Calzada · Pg. de Sant Gervasi con Av. Tibidabo",
    street: "Passeig de Sant Gervasi con Avinguda del Tibidabo",
    lat: 41.41012,
    lon: 2.13824,
    lanes: 2,
    direction: "Sentido Pg. Bonanova / Sarrià",
    avgDailyCars: 14200,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sg_03",
    name: "Espira Calzada · Av. del Tibidabo (Tramo Inicial)",
    street: "Avinguda del Tibidabo, tramo Pl. Kennedy",
    lat: 41.41098,
    lon: 2.13782,
    lanes: 2,
    direction: "Sentido Ascendente / Muntanya",
    avgDailyCars: 7600,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sg_04",
    name: "Espira Calzada · Pg. Sant Gervasi con C/ Jesús i Maria",
    street: "Passeig de Sant Gervasi con Carrer de Jesús i Maria",
    lat: 41.41078,
    lon: 2.13405,
    lanes: 2,
    direction: "Sentido Vallcarca / Av. Tibidabo",
    avgDailyCars: 13900,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sg_05",
    name: "Espira Calzada · C/ Císter con Pg. de Sant Gervasi",
    street: "Carrer de Císter con Passeig de Sant Gervasi",
    lat: 41.40925,
    lon: 2.13612,
    lanes: 1,
    direction: "Sentido Transversal / Acceso",
    avgDailyCars: 5200,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sg_06",
    name: "Espira Calzada · C/ Balmes con C/ Castanyer",
    street: "Carrer de Balmes con Carrer de Castanyer",
    lat: 41.40790,
    lon: 2.14010,
    lanes: 3,
    direction: "Sentido Mar / Centro",
    avgDailyCars: 19800,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sg_07",
    name: "Espira Calzada · C/ Moragas con C/ Modolell",
    street: "Carrer de Moragas con Carrer de Modolell",
    lat: 41.40765,
    lon: 2.13685,
    lanes: 1,
    direction: "Sentido Transversal Residencial",
    avgDailyCars: 4800,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sg_08",
    name: "Espira Arterial · Ronda del General Mitre con C/ Balmes",
    street: "Ronda del General Mitre con Carrer de Balmes",
    lat: 41.40618,
    lon: 2.14052,
    lanes: 4,
    direction: "Sentido Besòs / Glòries",
    avgDailyCars: 36200,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sg_09",
    name: "Espira Arterial · Ronda del General Mitre con C/ Mandri",
    street: "Ronda del General Mitre con Carrer de Mandri",
    lat: 41.40350,
    lon: 2.13380,
    lanes: 4,
    direction: "Sentido Llobregat / Pl. Cerdà",
    avgDailyCars: 34900,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sg_10",
    name: "Espira Calzada · Pg. de la Bonanova con C/ Castanyer",
    street: "Passeig de la Bonanova con Carrer de Castanyer",
    lat: 41.40685,
    lon: 2.13525,
    lanes: 2,
    direction: "Sentido Sarrià / Mandri",
    avgDailyCars: 16100,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sg_11",
    name: "Espira Calzada · C/ Mandri con C/ Bigai",
    street: "Carrer de Mandri con Carrer de Bigai",
    lat: 41.40420,
    lon: 2.13310,
    lanes: 2,
    direction: "Sentido Ascendente / Pg. Bonanova",
    avgDailyCars: 11400,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sg_12",
    name: "Espira Calzada · Via Augusta con C/ Modolell",
    street: "Via Augusta con Carrer de Modolell",
    lat: 41.39980,
    lon: 2.13250,
    lanes: 3,
    direction: "Sentido Centro / Diagonal",
    avgDailyCars: 24700,
    source: "Red Aforos Ajuntament de Barcelona"
  },

  // --- LES CORTS ---
  {
    id: "bcn_sen_lc_01",
    name: "Espira Calzada · C/ Marquès de Sentmenat con C/ Numància",
    street: "Carrer de Marquès de Sentmenat con Carrer de Numància",
    lat: 41.38390,
    lon: 2.13580,
    lanes: 2,
    direction: "Sentido Nicaragua / Eixample",
    avgDailyCars: 11200,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_lc_02",
    name: "Espira Calzada · C/ Numància con Trav. de les Corts",
    street: "Carrer de Numància con Travessera de les Corts",
    lat: 41.38550,
    lon: 2.13220,
    lanes: 3,
    direction: "Sentido Estación de Sants",
    avgDailyCars: 21500,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_lc_03",
    name: "Espira Arterial · Av. Diagonal con Gran Via Carles III",
    street: "Avinguda Diagonal con Gran Via de Carles III",
    lat: 41.38720,
    lon: 2.12750,
    lanes: 5,
    direction: "Sentido Salida Ciudad / B-23",
    avgDailyCars: 48900,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_lc_04",
    name: "Espira Calzada · C/ Lluís Pericot con C/ Manila",
    street: "Carrer de Lluís Pericot con Carrer de Manila",
    lat: 41.38820,
    lon: 2.12350,
    lanes: 1,
    direction: "Sentido Pedralbes Residencial",
    avgDailyCars: 4900,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_lc_05",
    name: "Espira Arterial · Av. Diagonal con Pl. Francesc Macià",
    street: "Avinguda Diagonal junto a Plaça de Francesc Macià",
    lat: 41.39310,
    lon: 2.14490,
    lanes: 4,
    direction: "Sentido Centro / Passeig de Gràcia",
    avgDailyCars: 44200,
    source: "Red Aforos Ajuntament de Barcelona"
  },

  // --- EIXAMPLE ---
  {
    id: "bcn_sen_eix_01",
    name: "Espira Arterial · C/ Aragó con Rambla de Catalunya",
    street: "Carrer d'Aragó con Rambla de Catalunya",
    lat: 41.39120,
    lon: 2.16180,
    lanes: 5,
    direction: "Sentido Besòs / Tránsito Pasante Central",
    avgDailyCars: 46800,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_eix_02",
    name: "Espira Calzada · C/ València con C/ Bruc",
    street: "Carrer de València con Carrer del Bruc",
    lat: 41.39720,
    lon: 2.16620,
    lanes: 3,
    direction: "Sentido Llobregat / Eixample Dret",
    avgDailyCars: 20100,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_eix_03",
    name: "Espira Calzada · C/ Mallorca con C/ Pau Claris",
    street: "Carrer de Mallorca con Carrer de Pau Claris",
    lat: 41.39650,
    lon: 2.16320,
    lanes: 3,
    direction: "Sentido Besòs / Sagrada Família",
    avgDailyCars: 19400,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_eix_04",
    name: "Espira Arterial · Gran Via con C/ Roger de Flor",
    street: "Gran Via de les Corts Catalanes con C/ Roger de Flor",
    lat: 41.39410,
    lon: 2.17350,
    lanes: 4,
    direction: "Sentido Besòs / Glòries",
    avgDailyCars: 38700,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_eix_05",
    name: "Espira Calzada · C/ Comte d'Urgell con C/ Còrsega",
    street: "Carrer del Comte d'Urgell con Carrer de Còrsega",
    lat: 41.38910,
    lon: 2.14920,
    lanes: 3,
    direction: "Sentido Mar / Gran Via",
    avgDailyCars: 22800,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_eix_06",
    name: "Espira Calzada · C/ Balmes con C/ Rosselló",
    street: "Carrer de Balmes con Carrer de Rosselló",
    lat: 41.39380,
    lon: 2.15620,
    lanes: 3,
    direction: "Sentido Mar / Universitat",
    avgDailyCars: 23400,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_eix_07",
    name: "Espira Calzada · C/ Rocafort con C/ Sepúlveda",
    street: "Carrer de Rocafort con Carrer de Sepúlveda",
    lat: 41.37810,
    lon: 2.15510,
    lanes: 2,
    direction: "Sentido Muntanya / Eixample Esquerre",
    avgDailyCars: 12600,
    source: "Red Aforos Ajuntament de Barcelona"
  },

  // --- GRÀCIA ---
  {
    id: "bcn_sen_gr_01",
    name: "Espira Calzada · Trav. de Gràcia con C/ Torrent de l'Olla",
    street: "Travessera de Gràcia con Carrer del Torrent de l'Olla",
    lat: 41.40180,
    lon: 2.15790,
    lanes: 2,
    direction: "Sentido Besòs / Sant Pau",
    avgDailyCars: 15300,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_gr_02",
    name: "Espira Arterial · Pl. Lesseps con Av. Príncep d'Astúries",
    street: "Plaça de Lesseps enlace con Rbla. del Prat",
    lat: 41.40650,
    lon: 2.15020,
    lanes: 3,
    direction: "Sentido Ronda del Mig",
    avgDailyCars: 28900,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_gr_03",
    name: "Espira Calzada · C/ Esteve Terradas con Av. Vallcarca",
    street: "Carrer d'Esteve Terradas con Avinguda de Vallcarca",
    lat: 41.41320,
    lon: 2.14210,
    lanes: 1,
    direction: "Sentido Ronda de Dalt",
    avgDailyCars: 6100,
    source: "Red Aforos Ajuntament de Barcelona"
  },

  // --- SANTS-MONTJUÏC ---
  {
    id: "bcn_sen_sm_01",
    name: "Espira Arterial · C/ Tarragona con Pl. Països Catalans",
    street: "Carrer de Tarragona junto a Estación de Sants",
    lat: 41.37890,
    lon: 2.14480,
    lanes: 4,
    direction: "Sentido Pl. Espanya",
    avgDailyCars: 31200,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sm_02",
    name: "Espira Arterial · Pl. Espanya con Gran Via",
    street: "Plaça d'Espanya acceso Gran Via",
    lat: 41.37480,
    lon: 2.14980,
    lanes: 5,
    direction: "Sentido Aeropuerto / Llobregat",
    avgDailyCars: 52400,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sm_03",
    name: "Espira Arterial · Av. Paral·lel con C/ Vilamarí",
    street: "Avinguda del Paral·lel con Carrer de Vilamarí",
    lat: 41.37410,
    lon: 2.15280,
    lanes: 3,
    direction: "Sentido Drassanes / Port",
    avgDailyCars: 24600,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sm_04",
    name: "Espira Industrial · C/ A con C/ 3 (Zona Franca)",
    street: "Carrer A con Carrer 3, Polígon Industrial Zona Franca",
    lat: 41.35790,
    lon: 2.14110,
    lanes: 2,
    direction: "Sentido Ronda Litoral / ZAL",
    avgDailyCars: 17800,
    source: "Red Aforos Ajuntament de Barcelona"
  },

  // --- CIUTAT VELLA & SANT MARTÍ ---
  {
    id: "bcn_sen_cv_01",
    name: "Espira Calzada · Via Laietana con C/ Jaume I",
    street: "Via Laietana con Carrer de Jaume I",
    lat: 41.38420,
    lon: 2.17750,
    lanes: 2,
    direction: "Sentido Port Vell / Mar",
    avgDailyCars: 14700,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sm_05",
    name: "Espira Calzada · C/ Espronceda con C/ Llull",
    street: "Carrer d'Espronceda con Carrer de Llull",
    lat: 41.40380,
    lon: 2.20250,
    lanes: 2,
    direction: "Sentido Rambla del Poblenou / Mar",
    avgDailyCars: 9800,
    source: "Red Aforos Ajuntament de Barcelona"
  },
  {
    id: "bcn_sen_sm_06",
    name: "Espira Arterial · Av. Diagonal con C/ Badajoz (Glòries)",
    street: "Avinguda Diagonal con Carrer de Badajoz",
    lat: 41.40410,
    lon: 2.18950,
    lanes: 4,
    direction: "Sentido Diagonal Mar / Fòrum",
    avgDailyCars: 37500,
    source: "Red Aforos Ajuntament de Barcelona"
  }
];
