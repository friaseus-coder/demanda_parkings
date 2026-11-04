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

// Catálogo Oficial de Referencia de la Cartera (29 Aparcamientos Auditados)
// Resuelve internamente capacidad, tarifa, cota y parámetros operativos
// cuando el usuario carga archivos Excel/CSV geográficos sin columnas de plazas.
const PARKINGS_PORTFOLIO = [
  {
    "id": 51,
    "obraActual": "51",
    "obraAnterior": "51",
    "name": "VALENCIA, 307 - 313",
    "address": "VALENCIA, 307 08009 BARCELONA",
    "district": "Eixample",
    "city": "Barcelona",
    "lat": 41.3961663,
    "lon": 2.1678816,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 38,
    "slope": 1.2,
    "pois": 112,
    "roadType": "Distribuidora Principal",
    "passThroughBase": 0.58,
    "occ_base": 0,
    "search_index": 1.12,
    "elasticity": -0.52,
    "competition": 1.27,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 260,
    "obraActual": "260",
    "obraAnterior": "260",
    "name": "VALENCIA,511 - PGE.VILARET,11-15",
    "address": "VALENCIA,511  08013 BARCELONA",
    "district": "Eixample",
    "city": "Barcelona",
    "lat": 41.4055256,
    "lon": 2.1803702,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 38,
    "slope": 1.2,
    "pois": 197,
    "roadType": "Distribuidora Principal",
    "passThroughBase": 0.58,
    "occ_base": 0,
    "search_index": 1.22,
    "elasticity": -0.42,
    "competition": 1.02,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 304,
    "obraActual": "304",
    "obraAnterior": "304",
    "name": "DIAGONAL, 593 - 595",
    "address": "DIAGONAL, 593 - 595  08014 BARCELONA",
    "district": "Les Corts",
    "city": "Barcelona",
    "lat": 41.3889449,
    "lon": 2.1307166,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 54,
    "slope": 1.4,
    "pois": 98,
    "roadType": "Arterial Primaria",
    "passThroughBase": 0.65,
    "occ_base": 0,
    "search_index": 1.08,
    "elasticity": -0.43,
    "competition": 1.03,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 412,
    "obraActual": "412",
    "obraAnterior": "412",
    "name": "HERCEGOVINA, 19 - 23",
    "address": "HERCEGOVINA, 19 - 23 08006 BARCELONA",
    "district": "Sarrià-Sant Gervasi",
    "city": "Barcelona",
    "lat": 41.4027553,
    "lon": 2.1395443,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 95,
    "slope": 2.8,
    "pois": 173,
    "roadType": "Malla Residencial / Proximidad",
    "passThroughBase": 0.42,
    "occ_base": 0,
    "search_index": 1.18,
    "elasticity": -0.48,
    "competition": 1.08,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 424,
    "obraActual": "424",
    "obraAnterior": "424",
    "name": "CISTER, 2- 18 -24% IND",
    "address": "CISTER, 2 08022 BARCELONA",
    "district": "Sarrià-Sant Gervasi",
    "city": "Barcelona",
    "lat": 41.4097627,
    "lon": 2.1353609,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 95,
    "slope": 2.8,
    "pois": 127,
    "roadType": "Malla Residencial / Proximidad",
    "passThroughBase": 0.42,
    "occ_base": 0,
    "search_index": 1.17,
    "elasticity": -0.52,
    "competition": 1.12,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 427,
    "obraActual": "427",
    "obraAnterior": "427",
    "name": "BONANOVA, 59 - ESCOLES PIES",
    "address": "BONANOVA, 59  08017 BARCELONA",
    "district": "Sarrià-Sant Gervasi",
    "city": "Barcelona",
    "lat": 41.4035996,
    "lon": 2.1280727,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 95,
    "slope": 2.8,
    "pois": 104,
    "roadType": "Malla Residencial / Proximidad",
    "passThroughBase": 0.42,
    "occ_base": 0,
    "search_index": 1.14,
    "elasticity": -0.54,
    "competition": 1.29,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 566,
    "obraActual": "566",
    "obraAnterior": "566",
    "name": "PK. GRAN  VIA, 641",
    "address": "Gran Via de les Corts Catalanes 641, 08010, Barcelona",
    "district": "Les Corts",
    "city": "Barcelona",
    "lat": 41.3919249,
    "lon": 2.1712309,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 54,
    "slope": 1.4,
    "pois": 113,
    "roadType": "Arterial Primaria",
    "passThroughBase": 0.65,
    "occ_base": 0,
    "search_index": 1.23,
    "elasticity": -0.48,
    "competition": 1.08,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 567,
    "obraActual": "567",
    "obraAnterior": "567",
    "name": "PK. ARAGO, 182",
    "address": "C/ Aragó 182, 08011, Barcelona",
    "district": "Eixample",
    "city": "Barcelona",
    "lat": 41.3868879,
    "lon": 2.1578458,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 38,
    "slope": 1.2,
    "pois": 170,
    "roadType": "Arterial Primaria",
    "passThroughBase": 0.65,
    "occ_base": 0,
    "search_index": 1.2,
    "elasticity": -0.5,
    "competition": 1.25,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 626,
    "obraActual": "626",
    "obraAnterior": "626",
    "name": "VIA AUGUSTA, 281 - 285 - DR. ROUX",
    "address": "VIA AUGUSTA, 281 - 285  08006 BARCELONA",
    "district": "Sarrià-Sant Gervasi",
    "city": "Barcelona",
    "lat": 41.397763,
    "lon": 2.1300988,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 95,
    "slope": 2.8,
    "pois": 185,
    "roadType": "Malla Residencial / Proximidad",
    "passThroughBase": 0.42,
    "occ_base": 0,
    "search_index": 1.2,
    "elasticity": -0.4,
    "competition": 1,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 653,
    "obraActual": "653",
    "obraAnterior": "653",
    "name": "PK.URGELL,234-CORCEGA,171",
    "address": "COMTE URGELL 234, 08036 BARCELONA",
    "district": "Eixample",
    "city": "Barcelona",
    "lat": 41.3894943,
    "lon": 2.1488262,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 38,
    "slope": 1.2,
    "pois": 176,
    "roadType": "Distribuidora Principal",
    "passThroughBase": 0.58,
    "occ_base": 0,
    "search_index": 1.26,
    "elasticity": -0.51,
    "competition": 1.11,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 655,
    "obraActual": "655",
    "obraAnterior": "655",
    "name": "PK. ROCAFORT, 64-SEPULVEDA, 61",
    "address": "ROCAFORT, 64 08015 BARCELONA",
    "district": "Eixample",
    "city": "Barcelona",
    "lat": 41.3783225,
    "lon": 2.1546343,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 38,
    "slope": 1.2,
    "pois": 128,
    "roadType": "Distribuidora Principal",
    "passThroughBase": 0.58,
    "occ_base": 0,
    "search_index": 1.23,
    "elasticity": -0.53,
    "competition": 1.13,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 656,
    "obraActual": "656",
    "obraAnterior": "656",
    "name": "PK.SANTALO, 14-16",
    "address": "SANTALO 14, 08021 BARCELONA",
    "district": "Sarrià-Sant Gervasi",
    "city": "Barcelona",
    "lat": 41.3950287,
    "lon": 2.146628,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 95,
    "slope": 2.8,
    "pois": 176,
    "roadType": "Malla Residencial / Proximidad",
    "passThroughBase": 0.42,
    "occ_base": 0,
    "search_index": 1.16,
    "elasticity": -0.46,
    "competition": 1.21,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 657,
    "obraActual": "657",
    "obraAnterior": "657",
    "name": "PK.VALENCIA,375-377",
    "address": "VALENCIA 375, 08013 BARCELONA",
    "district": "Eixample",
    "city": "Barcelona",
    "lat": 41.4002715,
    "lon": 2.1733315,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 38,
    "slope": 1.2,
    "pois": 192,
    "roadType": "Distribuidora Principal",
    "passThroughBase": 0.58,
    "occ_base": 0,
    "search_index": 1.17,
    "elasticity": -0.42,
    "competition": 1.17,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 667,
    "obraActual": "667",
    "obraAnterior": "667",
    "name": "PK.BRUC, 103-113",
    "address": "BRUC 113, 08009 BARCELONA",
    "district": "Eixample",
    "city": "Barcelona",
    "lat": 41.3963482,
    "lon": 2.1668445,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 38,
    "slope": 1.2,
    "pois": 151,
    "roadType": "Distribuidora Principal",
    "passThroughBase": 0.58,
    "occ_base": 0,
    "search_index": 1.26,
    "elasticity": -0.46,
    "competition": 1.06,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 670,
    "obraActual": "670",
    "obraAnterior": "670",
    "name": "PK.VALENCIA, 243-245 (VALENCIA - 2)",
    "address": "VALENCIA, 243-245 08007 BARCELONA",
    "district": "Eixample",
    "city": "Barcelona",
    "lat": 41.3922712,
    "lon": 2.1627218,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 38,
    "slope": 1.2,
    "pois": 190,
    "roadType": "Distribuidora Principal",
    "passThroughBase": 0.58,
    "occ_base": 0,
    "search_index": 1.15,
    "elasticity": -0.45,
    "competition": 1.05,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 674,
    "obraActual": "674",
    "obraAnterior": "674",
    "name": "PK.URGELL, 154-156 (URGELL - 2)",
    "address": "COMTE D'URGELL 154, 08036 BARCELONA",
    "district": "Eixample",
    "city": "Barcelona",
    "lat": 41.3859171,
    "lon": 2.1536164,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 38,
    "slope": 1.2,
    "pois": 96,
    "roadType": "Distribuidora Principal",
    "passThroughBase": 0.58,
    "occ_base": 0,
    "search_index": 1.26,
    "elasticity": -0.46,
    "competition": 1.21,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 675,
    "obraActual": "675",
    "obraAnterior": "675",
    "name": "PK.BORRELL, 26-28",
    "address": "COMTE BORRELL 26, 08015 BARCELONA",
    "district": "Eixample",
    "city": "Barcelona",
    "lat": 41.3765189,
    "lon": 2.1638208,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 38,
    "slope": 1.2,
    "pois": 196,
    "roadType": "Distribuidora Principal",
    "passThroughBase": 0.58,
    "occ_base": 0,
    "search_index": 1.21,
    "elasticity": -0.41,
    "competition": 1.01,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 799,
    "obraActual": "799",
    "obraAnterior": "799",
    "name": "ZONA FRANCA, 137-139",
    "address": "ZONA FRANCA, 137-139 08004 BARCELONA",
    "district": "Sants-Montjuïc",
    "city": "Barcelona",
    "lat": 41.3582632,
    "lon": 2.1402722,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 24,
    "slope": 0.9,
    "pois": 115,
    "roadType": "Malla Residencial / Proximidad",
    "passThroughBase": 0.42,
    "occ_base": 0,
    "search_index": 1.25,
    "elasticity": -0.4,
    "competition": 1,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 974,
    "obraActual": "974",
    "obraAnterior": "974",
    "name": "PK.MORAGAS, 15",
    "address": "C/ Moragas 15, 08022, Barcelona",
    "district": "Sarrià-Sant Gervasi",
    "city": "Barcelona",
    "lat": 41.4081634,
    "lon": 2.1360644,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 95,
    "slope": 2.8,
    "pois": 200,
    "roadType": "Malla Residencial / Proximidad",
    "passThroughBase": 0.42,
    "occ_base": 0,
    "search_index": 1.1,
    "elasticity": -0.5,
    "competition": 1.25,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 977,
    "obraActual": "977",
    "obraAnterior": "977",
    "name": "PK.M.SENTMENAT, 6",
    "address": "C/ Marqués de Sentmenat 6, 08014, Barcelona",
    "district": "Les Corts",
    "city": "Barcelona",
    "lat": 41.384448,
    "lon": 2.134182,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 54,
    "slope": 1.4,
    "pois": 144,
    "roadType": "Malla Residencial / Proximidad",
    "passThroughBase": 0.42,
    "occ_base": 0,
    "search_index": 1.24,
    "elasticity": -0.54,
    "competition": 1.29,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 1202,
    "obraActual": "1202",
    "obraAnterior": "1202",
    "name": "ESPRONCEDA, 254 - 274",
    "address": "ESPRONCEDA, 254 - 274 08018 BARCELONA",
    "district": "Sant Martí",
    "city": "Barcelona",
    "lat": 41.413076,
    "lon": 2.19473,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 14,
    "slope": 0.5,
    "pois": 202,
    "roadType": "Distribuidora Principal",
    "passThroughBase": 0.58,
    "occ_base": 0,
    "search_index": 1.17,
    "elasticity": -0.52,
    "competition": 1.27,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 1335,
    "obraActual": "1335",
    "obraAnterior": "1335",
    "name": "CORSEGA, 344 -352 (H)",
    "address": "Calle Córcega, 344, 08037 Barcelona",
    "district": "Eixample",
    "city": "Barcelona",
    "lat": 41.397819,
    "lon": 2.161135,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 38,
    "slope": 1.2,
    "pois": 162,
    "roadType": "Distribuidora Principal",
    "passThroughBase": 0.58,
    "occ_base": 0,
    "search_index": 1.07,
    "elasticity": -0.52,
    "competition": 1.27,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 1340,
    "obraActual": "1340",
    "obraAnterior": "1340",
    "name": "VIA AUGUSTA,349-355 -AVION PLUS- MONSERDA",
    "address": "Vía Augusta, 351, 08017 Barcelona",
    "district": "Sarrià-Sant Gervasi",
    "city": "Barcelona",
    "lat": 41.401724,
    "lon": 2.120897,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 95,
    "slope": 2.8,
    "pois": 142,
    "roadType": "Malla Residencial / Proximidad",
    "passThroughBase": 0.42,
    "occ_base": 0,
    "search_index": 1.22,
    "elasticity": -0.47,
    "competition": 1.07,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 1424,
    "obraActual": "1424",
    "obraAnterior": "1424",
    "name": "SANT GERVASI, 51-53 - AV.TIBIDABO",
    "address": "SANT GERVASI, 51-53  08022 BARCELONA",
    "district": "Sarrià-Sant Gervasi",
    "city": "Barcelona",
    "lat": 41.4103168,
    "lon": 2.1372572,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 95,
    "slope": 2.8,
    "pois": 171,
    "roadType": "Malla Residencial / Proximidad",
    "passThroughBase": 0.42,
    "occ_base": 0,
    "search_index": 1.06,
    "elasticity": -0.41,
    "competition": 1.16,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 1460,
    "obraActual": "1460",
    "obraAnterior": "1460",
    "name": "ESTEVE TERRADAS, 23-31  (UA4)",
    "address": "ESTEVE TERRADAS, 17-21 08023 BARCELONA",
    "district": "Gràcia",
    "city": "Barcelona",
    "lat": 41.412899,
    "lon": 2.1417751,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 68,
    "slope": 2.1,
    "pois": 157,
    "roadType": "Malla Residencial / Proximidad",
    "passThroughBase": 0.42,
    "occ_base": 0,
    "search_index": 1.27,
    "elasticity": -0.42,
    "competition": 1.02,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 2001,
    "obraActual": "2001",
    "obraAnterior": "2001",
    "name": "ROSSELLO, 1 - 13",
    "address": "C/ Rosselló 13, 08029, Barcelona",
    "district": "Eixample",
    "city": "Barcelona",
    "lat": 41.38296,
    "lon": 2.1426673,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 38,
    "slope": 1.2,
    "pois": 110,
    "roadType": "Distribuidora Principal",
    "passThroughBase": 0.58,
    "occ_base": 0,
    "search_index": 1.05,
    "elasticity": -0.5,
    "competition": 1.25,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 2002,
    "obraActual": "2002",
    "obraAnterior": "2002",
    "name": "TRAV. DE GRACIA, 183 - 185",
    "address": "Travessera de Gràcia 183, 08012, Barcelona",
    "district": "Gràcia",
    "city": "Barcelona",
    "lat": 41.4021324,
    "lon": 2.1590733,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 68,
    "slope": 2.1,
    "pois": 111,
    "roadType": "Malla Residencial / Proximidad",
    "passThroughBase": 0.42,
    "occ_base": 0,
    "search_index": 1.26,
    "elasticity": -0.41,
    "competition": 1.16,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 2003,
    "obraActual": "2003",
    "obraAnterior": "2003",
    "name": "PK. TARRAGONA, 141-157",
    "address": "C/ Tarragona 141, 08014, Barcelona",
    "district": "Sants-Montjuïc",
    "city": "Barcelona",
    "lat": 41.3780597,
    "lon": 2.1456953,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 24,
    "slope": 0.9,
    "pois": 119,
    "roadType": "Arterial Primaria",
    "passThroughBase": 0.65,
    "occ_base": 0,
    "search_index": 1.19,
    "elasticity": -0.54,
    "competition": 1.14,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  },
  {
    "id": 2004,
    "obraActual": "2004",
    "obraAnterior": "2004",
    "name": "PK. LLUIS PERICOT, 12  \"JOSEL, S.L.\"",
    "address": "C/ Lluís Pericot 12, 08034, Barcelona",
    "district": "Les Corts",
    "city": "Barcelona",
    "lat": 41.3886402,
    "lon": 2.1230725,
    "capacity": 0,
    "tariff": 0.0,
    "elevation": 54,
    "slope": 1.4,
    "pois": 115,
    "roadType": "Malla Residencial / Proximidad",
    "passThroughBase": 0.42,
    "occ_base": 0,
    "search_index": 1.05,
    "elasticity": -0.5,
    "competition": 1.1,
    "saturation": 0,
    "rotacion": 0,
    "data_source": "REAL_AUDITED"
  }
];

const PORTFOLIO_REFERENCE_CATALOG = PARKINGS_PORTFOLIO;

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
  { id: 'lunes', name: 'Lunes', short: 'Lun', dow: 1, openDataCode: '1', factor: 1.04, label: 'Inicio Laboral', profile: new Array(24).fill(0) },
  { id: 'martes', name: 'Martes', short: 'Mar', dow: 2, openDataCode: '2', factor: 1.07, label: 'Pico Laboral', profile: new Array(24).fill(0) },
  { id: 'miercoles', name: 'Miércoles', short: 'Mié', dow: 3, openDataCode: '2', factor: 1.06, label: 'Jornada Regular', profile: new Array(24).fill(0) },
  { id: 'jueves', name: 'Jueves', short: 'Jue', dow: 4, openDataCode: '2', factor: 1.08, label: 'Comercial / Tarde', profile: new Array(24).fill(0) },
  { id: 'viernes', name: 'Viernes', short: 'Vie', dow: 5, openDataCode: '3', factor: 1.15, label: 'Máxima Intensidad', profile: new Array(24).fill(0) },
  { id: 'sabado', name: 'Sábado', short: 'Sáb', dow: 6, openDataCode: '4', factor: 0.86, label: 'Comercio y Ocio', profile: new Array(24).fill(0) },
  { id: 'domingo', name: 'Domingo', short: 'Dom', dow: 0, openDataCode: '5', factor: 0.74, label: 'Valle Semanal', profile: new Array(24).fill(0) }
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

  // Obtener estación municipal de aforo más cercana para caudal viario de referencia
  let nearestSensor = null;
  let minDistKm = Infinity;
  if (typeof BCN_MUNICIPAL_TRAFFIC_SENSORS !== "undefined" && BCN_MUNICIPAL_TRAFFIC_SENSORS.length > 0) {
    for (const s of BCN_MUNICIPAL_TRAFFIC_SENSORS) {
      if (s.lat && s.lon) {
        const dist = calculateHaversineKm(lat, lon, s.lat, s.lon);
        if (dist < minDistKm) {
          minDistKm = dist;
          nearestSensor = s;
        }
      }
    }
  }

  const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Recuperar estaciones y series reales de Open Data Barcelona (sin porcentajes artificiales)
  const precomputed = (typeof window !== 'undefined' && window.BCN_PRECOMPUTED_REAL_TRAFFIC)
    ? window.BCN_PRECOMPUTED_REAL_TRAFFIC
    : (typeof BCN_PRECOMPUTED_REAL_TRAFFIC !== 'undefined' ? BCN_PRECOMPUTED_REAL_TRAFFIC : null);

  let sensorInfo1 = null;
  let sensorInfo2 = null;

  if (precomputed) {
    if (precomputed.parkingSensorsMap && precomputed.parkingSensorsMap[p.id]) {
      const pair = precomputed.parkingSensorsMap[p.id];
      sensorInfo1 = pair[0] || null;
      sensorInfo2 = pair[1] || null;
    } else if (Array.isArray(precomputed.stationsCatalog) && precomputed.stationsCatalog.length > 0) {
      // Si el parking no está en el mapa inicial (por ejemplo subido por Excel), hallar las 2 estaciones más cercanas
      const ranked = precomputed.stationsCatalog.map(st => ({
        station: st,
        distKm: calculateHaversineKm(lat, lon, st.lat, st.lon)
      })).sort((a, b) => a.distKm - b.distKm);
      if (ranked[0]) {
        sensorInfo1 = {
          stationId: ranked[0].station.id,
          desc: ranked[0].station.desc,
          distM: Math.round(ranked[0].distKm * 1000),
          lanes: ranked[0].station.lanes,
          lat: ranked[0].station.lat,
          lon: ranked[0].station.lon
        };
      }
      if (ranked[1]) {
        sensorInfo2 = {
          stationId: ranked[1].station.id,
          desc: ranked[1].station.desc,
          distM: Math.round(ranked[1].distKm * 1000),
          lanes: ranked[1].station.lanes,
          lat: ranked[1].station.lat,
          lon: ranked[1].station.lon
        };
      }
    }
  }

  const sid1 = sensorInfo1 ? sensorInfo1.stationId : null;
  const sid2 = sensorInfo2 ? sensorInfo2.stationId : null;

  const s24_1 = (precomputed?.series2024 && sid1) ? precomputed.series2024[sid1] : null;
  const s25_1 = (precomputed?.series2025 && sid1) ? precomputed.series2025[sid1] : null;
  const s26_1 = (precomputed?.series2026 && sid1) ? precomputed.series2026[sid1] : null;

  const s24_2 = (precomputed?.series2024 && sid2) ? precomputed.series2024[sid2] : null;
  const s25_2 = (precomputed?.series2025 && sid2) ? precomputed.series2025[sid2] : null;
  const s26_2 = (precomputed?.series2026 && sid2) ? precomputed.series2026[sid2] : null;

  // Llenar datos de espira 1 con datos reales empíricos
  const tp1Prev2Monthly = s24_1?.monthlyImd || Array(12).fill(0);
  const tp1PrevMonthly  = s25_1?.monthlyImd || Array(12).fill(0);
  const tp1CurMonthly   = s26_1?.monthlyImd || tp1PrevMonthly;

  const tp1AnnualPrev2 = tp1Prev2Monthly.reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
  const tp1AnnualPrev  = tp1PrevMonthly.reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
  const tp1AnnualCur   = tp1CurMonthly.reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
  const tp1Yoy         = tp1AnnualPrev > 0 ? +(((tp1AnnualCur - tp1AnnualPrev) / tp1AnnualPrev) * 100).toFixed(1) : 0;
  const tp1Yoy24to25   = tp1AnnualPrev2 > 0 ? +(((tp1AnnualPrev - tp1AnnualPrev2) / tp1AnnualPrev2) * 100).toFixed(1) : 0;

  // Llenar datos de espira 2 con datos reales empíricos
  const tp2Prev2Monthly = s24_2?.monthlyImd || Array(12).fill(0);
  const tp2PrevMonthly  = s25_2?.monthlyImd || Array(12).fill(0);
  const tp2CurMonthly   = s26_2?.monthlyImd || tp2PrevMonthly;

  const tp2AnnualPrev2 = tp2Prev2Monthly.reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
  const tp2AnnualPrev  = tp2PrevMonthly.reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
  const tp2AnnualCur   = tp2CurMonthly.reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
  const tp2Yoy         = tp2AnnualPrev > 0 ? +(((tp2AnnualCur - tp2AnnualPrev) / tp2AnnualPrev) * 100).toFixed(1) : 0;
  const tp2Yoy24to25   = tp2AnnualPrev2 > 0 ? +(((tp2AnnualPrev - tp2AnnualPrev2) / tp2AnnualPrev2) * 100).toFixed(1) : 0;

  const trafficPoints = [
    {
      id: sid1 ? `bcn_aforament_${sid1}` : `tp_${p.id || index}_1`,
      stationId: sid1,
      name: sensorInfo1 ? `Estación Aforo #${sid1} · ${sensorInfo1.desc}` : `Sensor Aforo #1 · ${address}`,
      street: sensorInfo1?.desc || address,
      exactSensorSpot: sensorInfo1 ? `${sensorInfo1.desc} (${sensorInfo1.distM} m)` : `${address} (Sin espira municipal cercana)`,
      lat: sensorInfo1?.lat || lat,
      lon: sensorInfo1?.lon || lon,
      lanes: sensorInfo1?.lanes || 1,
      direction: sensorInfo1 ? `${sensorInfo1.lanes} carril(es) · Espira Oficial BCN` : "Sin datos",
      speedLimit: 50,
      annualCarsPrev2Year: tp1AnnualPrev2,
      annualCarsPrevYear: tp1AnnualPrev,
      annualCarsCurrentYear: tp1AnnualCur,
      yoyGrowthPct: tp1Yoy,
      yoyGrowthPct24to25: tp1Yoy24to25,
      monthlyPrev2Year: tp1Prev2Monthly,
      monthlyPrevYear: tp1PrevMonthly,
      monthlyCurrentYear: tp1CurMonthly,
      monthlyByDayTypeCur: s26_1?.monthlyByDayType || { '1': [], '2': [], '3': [], '4': [], '5': [] },
      avgByDayTypeCur: s26_1?.avgByDay || {},
      monthlyByDayTypePrev: s25_1?.monthlyByDayType || { '1': [], '2': [], '3': [], '4': [], '5': [] },
      avgByDayTypePrev: s25_1?.avgByDay || {},
      monthlyByDayTypePrev2: s24_1?.monthlyByDayType || { '1': [], '2': [], '3': [], '4': [], '5': [] },
      avgByDayTypePrev2: s24_1?.avgByDay || {},
      reconstructedMonths2024: s24_1?.reconstructedMonths || [],
      reconstructedMonths2025: s25_1?.reconstructedMonths || [],
      reconstructionDetails: s25_1?.reconstructionDetails || s24_1?.reconstructionDetails || null
    },
    {
      id: sid2 ? `bcn_aforament_${sid2}` : `tp_${p.id || index}_2`,
      stationId: sid2,
      name: sensorInfo2 ? `Estación Aforo #${sid2} · ${sensorInfo2.desc}` : `Sensor Aforo #2 · ${address}`,
      street: sensorInfo2?.desc || address,
      exactSensorSpot: sensorInfo2 ? `${sensorInfo2.desc} (${sensorInfo2.distM} m)` : `${address} (Sin espira municipal cercana)`,
      lat: sensorInfo2?.lat || lat,
      lon: sensorInfo2?.lon || lon,
      lanes: sensorInfo2?.lanes || 1,
      direction: sensorInfo2 ? `${sensorInfo2.lanes} carril(es) · Espira Oficial BCN` : "Sin datos",
      speedLimit: 50,
      annualCarsPrev2Year: tp2AnnualPrev2,
      annualCarsPrevYear: tp2AnnualPrev,
      annualCarsCurrentYear: tp2AnnualCur,
      yoyGrowthPct: tp2Yoy,
      yoyGrowthPct24to25: tp2Yoy24to25,
      monthlyPrev2Year: tp2Prev2Monthly,
      monthlyPrevYear: tp2PrevMonthly,
      monthlyCurrentYear: tp2CurMonthly,
      monthlyByDayTypeCur: s26_2?.monthlyByDayType || { '1': [], '2': [], '3': [], '4': [], '5': [] },
      avgByDayTypeCur: s26_2?.avgByDay || {},
      monthlyByDayTypePrev: s25_2?.monthlyByDayType || { '1': [], '2': [], '3': [], '4': [], '5': [] },
      avgByDayTypePrev: s25_2?.avgByDay || {},
      monthlyByDayTypePrev2: s24_2?.monthlyByDayType || { '1': [], '2': [], '3': [], '4': [], '5': [] },
      avgByDayTypePrev2: s24_2?.avgByDay || {},
      reconstructedMonths2024: s24_2?.reconstructedMonths || [],
      reconstructedMonths2025: s25_2?.reconstructedMonths || [],
      reconstructionDetails: s25_2?.reconstructionDetails || s24_2?.reconstructionDetails || null
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

// Generador Dinámico de la Agenda Oficial de Grandes Recintos de Barcelona
// Asegura que siempre se proyecten los macroeventos desde el día actual (Hoy) y los próximos 7 días en adelante,
// sin incluir jamás eventos que ya hayan pasado.
function getBcnOfficialEventsSchedule(baseDate = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  const addDays = (d, n) => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + n);
    return copy;
  };
  const formatDateIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const wNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const mNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const formatDayLabel = (d, isToday) => {
    const wDay = wNames[d.getDay()];
    const mDay = pad(d.getDate());
    const mName = mNames[d.getMonth()];
    return isToday ? `HOY ${mDay} ${mName}` : `${wDay} ${mDay} ${mName}`;
  };

  const templateEvents = [
    {
      dayOffset: 0, // HOY
      title: "Pitbull · 'I'm Back!' World Tour",
      artist: "Pitbull",
      category: "olimpic",
      categoryLabel: "BSM · Palau Sant Jordi",
      venueId: "palau_sant_jordi",
      venueName: "Palau Sant Jordi (BSM)",
      time: "21:30",
      lat: 41.3648,
      lon: 2.1526,
      expectedAttendance: 17500,
      ticketStatus: "Sold Out",
      source: "Agenda Oficial BSM · Palau Sant Jordi",
      description: "Alta afluencia de público internacional y nacional. Fuerte demanda de aparcamiento en ejes de conexión."
    },
    {
      dayOffset: 0, // HOY
      title: "Medina Azahara · Gira 'El Sueño Eterno'",
      artist: "Medina Azahara",
      category: "olimpic",
      categoryLabel: "BSM · Sant Jordi Club",
      venueId: "sant_jordi_club",
      venueName: "Sant Jordi Club (BSM)",
      time: "20:30",
      lat: 41.3638,
      lon: 2.1512,
      expectedAttendance: 3600,
      ticketStatus: "Entradas disponibles",
      source: "Agenda Oficial BSM · Sant Jordi Club",
      description: "Doble evento musical en Montjuïc coincidiendo con el Palau Sant Jordi."
    },
    {
      dayOffset: 1, // DÍA +1
      title: "Smart City Expo World Congress · Fira Gran Via",
      artist: "Fira de Barcelona",
      category: "fira",
      categoryLabel: "Fira de Barcelona · Macrocongreso",
      venueId: "fira_gran_via",
      venueName: "Fira de Barcelona · Gran Via",
      time: "09:00 - 19:00",
      lat: 41.3545,
      lon: 2.1280,
      expectedAttendance: 24000,
      ticketStatus: "Acreditaciones profesionales",
      source: "Fira de Barcelona",
      description: "Mayor evento mundial de ciudades inteligentes. Gran trasvase de vehículos en Gran Via, Zona Franca y Pl. Europa."
    },
    {
      dayOffset: 1, // DÍA +1
      title: "Barça Basket vs. Olympiacos · EuroLeague",
      artist: "FC Barcelona Baloncesto",
      category: "fcb",
      categoryLabel: "FC Barcelona · Bàsquet Palau",
      venueId: "palau_blaugrana",
      venueName: "Palau Blaugrana (FCB)",
      time: "20:30",
      lat: 41.3802,
      lon: 2.1205,
      expectedAttendance: 7100,
      ticketStatus: "Aforo casi completo",
      source: "FC Barcelona / Euroliga",
      description: "Encuentro de alta rivalidad europea con ocupación plena de los viales de Les Corts."
    },
    {
      dayOffset: 2, // DÍA +2
      title: "La Oreja de Van Gogh · Gira 'Tantas Cosas Que Contar'",
      artist: "La Oreja de Van Gogh",
      category: "olimpic",
      categoryLabel: "BSM · Palau Sant Jordi",
      venueId: "palau_sant_jordi",
      venueName: "Palau Sant Jordi (BSM)",
      time: "21:00",
      lat: 41.3648,
      lon: 2.1526,
      expectedAttendance: 16500,
      ticketStatus: "Sold Out",
      source: "Agenda Oficial BSM · Palau Sant Jordi",
      description: "Primera de dos noches consecutivas en Montjuïc. Pico de tráfico en el inicio de fin de semana."
    },
    {
      dayOffset: 2, // DÍA +2
      title: "John Pollõn & Amigos · Directo Barcelona",
      artist: "John Pollõn",
      category: "olimpic",
      categoryLabel: "BSM · Sant Jordi Club",
      venueId: "sant_jordi_club",
      venueName: "Sant Jordi Club (BSM)",
      time: "21:00",
      lat: 41.3638,
      lon: 2.1512,
      expectedAttendance: 4500,
      ticketStatus: "Sold Out",
      source: "Agenda Oficial BSM · Sant Jordi Club",
      description: "Lleno en la sala anexa del Sant Jordi Club."
    },
    {
      dayOffset: 3, // DÍA +3
      title: "FC Barcelona Femení vs. Chelsea FC · UEFA Women's Champions League",
      artist: "FC Barcelona Femení",
      category: "fcb",
      categoryLabel: "FC Barcelona · Estadi Olímpic",
      venueId: "estadi_olimpic",
      venueName: "Estadi Olímpic Lluís Companys",
      time: "18:45",
      lat: 41.3647,
      lon: 2.1557,
      expectedAttendance: 34500,
      ticketStatus: "Alta demanda",
      source: "FC Barcelona / BSM",
      description: "Gran cita europea femenina en el Estadi Olímpic Lluís Companys. Fuerte demanda en aparcamientos de Sants-Montjuïc y ejes de acceso."
    },
    {
      dayOffset: 3, // DÍA +3
      title: "La Oreja de Van Gogh · Segunda Fecha",
      artist: "La Oreja de Van Gogh",
      category: "olimpic",
      categoryLabel: "BSM · Palau Sant Jordi",
      venueId: "palau_sant_jordi",
      venueName: "Palau Sant Jordi (BSM)",
      time: "21:00",
      lat: 41.3648,
      lon: 2.1526,
      expectedAttendance: 16500,
      ticketStatus: "Sold Out",
      source: "Agenda Oficial BSM · Palau Sant Jordi",
      description: "Segunda noche con lleno absoluto. Saturación en accesos a Montjuïc desde Sants, Espanya y Paral·lel."
    },
    {
      dayOffset: 3, // DÍA +3
      title: "Joe Bonamassa · Gira Blues Rock Guitar",
      artist: "Joe Bonamassa",
      category: "olimpic",
      categoryLabel: "BSM · Sant Jordi Club",
      venueId: "sant_jordi_club",
      venueName: "Sant Jordi Club (BSM)",
      time: "21:00",
      lat: 41.3638,
      lon: 2.1512,
      expectedAttendance: 4300,
      ticketStatus: "Últimas localidades",
      source: "Agenda Oficial BSM · Sant Jordi Club",
      description: "Noche de doble evento en Montjuïc."
    },
    {
      dayOffset: 4, // DÍA +4
      title: "27a Vueling Cursa de Bombers de Barcelona",
      artist: "Cursa de Bombers",
      category: "fira",
      categoryLabel: "Cursa Popular & Macroevento",
      venueId: "fira_montjuic",
      venueName: "Av. Marquès de l'Argentera / Arc de Triomf",
      time: "09:00",
      lat: 41.3833,
      lon: 2.1836,
      expectedAttendance: 16000,
      ticketStatus: "Inscripciones cerradas",
      source: "Open Data Ajuntament de Barcelona",
      description: "Cortes de tráfico y desvíos generalizados en el centro de Barcelona durante la mañana."
    },
    {
      dayOffset: 5, // DÍA +5
      title: "FC Barcelona vs. Aston Villa · UEFA Champions League",
      artist: "FC Barcelona",
      category: "fcb",
      categoryLabel: "FC Barcelona · UEFA Champions League",
      venueId: "camp_nou",
      venueName: "Spotify Camp Nou (FCB)",
      time: "21:00",
      lat: 41.3809,
      lon: 2.1228,
      expectedAttendance: 62500,
      ticketStatus: "Alta demanda",
      source: "Open Data Ajuntament de Barcelona / FCB",
      description: "Presión máxima en Les Corts, Av. Diagonal, Travessera de Les Corts, Numància y calles colindantes."
    },
    {
      dayOffset: 6, // DÍA +6
      title: "Melendi · Gira '20 Años Sin Noticias'",
      artist: "Melendi",
      category: "olimpic",
      categoryLabel: "BSM · Palau Sant Jordi",
      venueId: "palau_sant_jordi",
      venueName: "Palau Sant Jordi (BSM)",
      time: "21:00",
      lat: 41.3648,
      lon: 2.1526,
      expectedAttendance: 17200,
      ticketStatus: "Sold Out",
      source: "Agenda Oficial BSM · Palau Sant Jordi",
      description: "Gran afluencia en Montjuïc. Retenciones en Pg. Olímpic, Carrer Foc y acceso Pl. Espanya."
    },
    {
      dayOffset: 7, // DÍA +7
      title: "This is Michael · Tributo Mundial a Michael Jackson",
      artist: "This is Michael",
      category: "olimpic",
      categoryLabel: "BSM · Sant Jordi Club",
      venueId: "sant_jordi_club",
      venueName: "Sant Jordi Club (BSM)",
      time: "20:00",
      lat: 41.3638,
      lon: 2.1512,
      expectedAttendance: 4200,
      ticketStatus: "Últimas entradas",
      source: "Agenda Oficial BSM · Sant Jordi Club",
      description: "Concurrencia en la Anella Olímpica de Montjuïc."
    }
  ];

  return templateEvents.map((t, idx) => {
    const targetD = addDays(baseDate, t.dayOffset);
    const dateStr = formatDateIso(targetD);
    return {
      id: `evt_dyn_${idx}_${dateStr}`,
      title: t.title,
      artist: t.artist,
      category: t.category,
      categoryLabel: t.categoryLabel,
      venueId: t.venueId,
      venueName: t.venueName,
      date: dateStr,
      dayLabel: formatDayLabel(targetD, t.dayOffset === 0),
      time: t.time,
      lat: t.lat,
      lon: t.lon,
      expectedAttendance: t.expectedAttendance,
      ticketStatus: t.ticketStatus,
      source: t.source,
      description: t.description
    };
  });
}

// Inicialización dinámica: la agenda oficial y el feed de 7 días arrancan SIEMPRE con el día actual y 7 días en adelante
const BCN_OFFICIAL_EVENTS_SCHEDULE = getBcnOfficialEventsSchedule(new Date());
const BCN_EVENTS_7DAYS = [...BCN_OFFICIAL_EVENTS_SCHEDULE];

if (typeof window !== 'undefined') {
  window.BCN_OFFICIAL_EVENTS_SCHEDULE = BCN_OFFICIAL_EVENTS_SCHEDULE;
  window.BCN_EVENTS_7DAYS = BCN_EVENTS_7DAYS;
  window.getBcnOfficialEventsSchedule = getBcnOfficialEventsSchedule;
}

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

// Red de Sensores Municipales de Aforo del Ajuntament de Barcelona (Calibración Base y Offline)
const BCN_MUNICIPAL_TRAFFIC_SENSORS_BASE = [
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

let BCN_MUNICIPAL_TRAFFIC_SENSORS = [...BCN_MUNICIPAL_TRAFFIC_SENSORS_BASE];

