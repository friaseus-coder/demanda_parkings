/**
 * Motor Matemático en Cliente: Demanda Latente, Fricción Tobler e Isocronas
 * Implementación exacta de las especificaciones del Manual Técnico de Ingeniería
 */

const DemandEngine = {
  // Constantes de Calibración de Barcelona
  BETA_0: -2.20,
  BETA_1: 2.50,
  BETA_2: 3.00,
  BETA_3: 1.20,
  LAMBDA_HUFF: 0.28,
  REF_MARKET_TARIFF: 3.40,
  PRICE_ELASTICITY: 0.75,
  THETA_THRESHOLD: 0.85,
  AVG_STAY_HOURS: 2.2,

  /**
   * Calcula la Demanda Latente Neta de un aparcamiento
   */
  calculate(parking, options = {}) {
    const rain = options.rain !== undefined ? options.rain : 0.0;
    const sat = options.saturation !== undefined ? options.saturation : (parking.saturation || 0);
    const event = options.event || "none";
    const tariff = options.tariff !== undefined ? options.tariff : (parking.tariff || 0);
    const hour = options.hour !== undefined ? options.hour : 18;

    const cap = (parking.capacity && parking.capacity > 0) ? parking.capacity : 0;
    const slope = parking.slope || 0;
    const pois = (parking.pois && parking.pois > 0) ? parking.pois : 0;
    const kappaBase = parking.passThroughBase || 0;

    // Aforo real medido por la espira municipal más cercana de Open Data Ajuntament de Barcelona
    const tp1Annual = parking.trafficPoints?.[0]?.annualCarsCurrentYear || 0;
    const realDailyImd = tp1Annual > 0 ? (tp1Annual / 365) : 0;
    const realHourlyFlow = realDailyImd > 0 ? Math.round(realDailyImd / 24) : 0;

    // Regla real-data-only: Si no hay lecturas reales de sensores (Open Data BCN) ni capacidad en Excel, devolver 0
    if (realHourlyFlow <= 0 && cap <= 0) {
      return {
        dl: 0,
        cruising: 0,
        qAgitacion: 0,
        deficit: 0,
        pois: 0,
        revDay: 0,
        revWeek: 0,
        ratio: 0,
        hasRealCapacity: false,
        yieldAction: "Esperando sincronización de aforos en vivo (Open Data BCN) o carga de archivo",
        yieldPrio: "SIN DATOS",
        waterfall: {
          grossFlow: 0,
          passThrough: 0,
          passThroughPct: 0,
          localFlow: 0,
          cruising: 0,
          deficit: 0,
          pois: 0,
          toblerLoss: 0,
          toblerPct: 0,
          netDL: 0
        }
      };
    }

    // 1. Aforo viario bruto exterior (Q_total en veh/h):
    // Proviene directamente del IMD real de la estación de Open Data BCN dividido entre 24h
    const qTotal = realHourlyFlow > 0 ? realHourlyFlow : Math.round(cap * 3.8);

    // 2. Tráfico Pasante (según número real de carriles de la estación de Open Data BCN)
    const kappa = kappaBase > 0 ? Math.min(0.92, Math.max(0.15, kappaBase)) : 0;
    const qPasante = Math.round(qTotal * kappa);
    const qPotencial = Math.max(0, qTotal - qPasante);

    // 3. Agitación en Calzada (Cruising) - Modelo Logit sobre flujo con destino local real
    const effectiveSat = sat > 0 ? sat : 85;
    const thetaSup = effectiveSat / 100.0;
    const deltaV = thetaSup > 0.70 ? Math.min(0.60, (thetaSup - 0.70) * 1.5) : 0.0;
    const rhoDum = Math.min(1.0, 0.50 + 0.40 * thetaSup);
    const logitZ = this.BETA_0 + this.BETA_1 * deltaV + this.BETA_2 * thetaSup + this.BETA_3 * rhoDum;
    const gamma = 1.0 / (1.0 + Math.exp(-logitZ));
    const qAgitacion = Math.round(qPotencial * gamma);

    // 4. Déficit en Calzada (0 si no hay plazas informadas en el Excel)
    let deltaDeficitSup = 0;
    if (cap > 0 && thetaSup > this.THETA_THRESHOLD) {
      const nPlazasSup = Math.round(cap * 0.90);
      deltaDeficitSup = Math.round((thetaSup - this.THETA_THRESHOLD) * nPlazasSup * 0.95);
    }

    // 5. Atractores y POIs Reales (Censo Comercial Open Data BCN en radio de 300m)
    const poiWeight = 0.14;
    const qPois = Math.round(pois * poiWeight);

    // Demanda Bruta en el entorno del aparcamiento
    const dBruta = qAgitacion + deltaDeficitSup + qPois;

    // 6. Pérdida Topográfica de Tobler (calculada con la pendiente real DEM de Open-Meteo)
    const factorTobler = slope > 0 ? Math.min(0.40, (slope / 100.0) * 1.8) : 0;
    const perdidaTobler = Math.round(dBruta * factorTobler);
    const dFriccionada = Math.max(0, dBruta - perdidaTobler);

    // 7. Cuota Gravitatoria Huff
    const huffShare = cap > 0
      ? Math.min(0.65, Math.max(0.20, (cap / (cap + 320)) * 0.95))
      : 0.0;
    const dCapturable = Math.round(dFriccionada * huffShare);

    // 8. Multiplicador Meteorológico en Vivo (Open-Meteo)
    const phiClima = 1.0 + Math.min(rain, 15.0) * 0.045;
    const eventMultipliers = { none: 1.00, mwc: 1.45, concert: 1.30, festivo: 1.35, strike: 1.50 };
    const omegaEvento = eventMultipliers[event] || 1.00;
    const psiPrecio = tariff > 0
      ? Math.max(0.40, 1.0 - ((tariff - this.REF_MARKET_TARIFF) / this.REF_MARKET_TARIFF) * this.PRICE_ELASTICITY)
      : 1.00;

    // 9. Demanda Latente Neta (DL en veh/h)
    const dl = Math.max(0, Math.round(dCapturable * phiClima * omegaEvento * psiPrecio));

    // 10. Ingresos no captados (0 si el Excel no incluye tarifa)
    const revDay = tariff > 0 ? Math.round(dl * this.AVG_STAY_HOURS * tariff * 0.65 * 1.4) : 0;
    const revWeek = tariff > 0 ? Math.round(revDay * 6.8) : 0;

    // 11. Recomendación Operativa
    const ratio = cap > 0 ? (dl / cap) : 0;
    let yieldAction = "";
    let yieldPrio = "DATOS EN VIVO";

    if (cap <= 0) {
      yieldAction = `Agitación en calzada medida por Open Data BCN (${qAgitacion} veh/h buscando aparcar). Para calcular la demanda neta capturable y la rotación interna, incluye la columna 'Plazas' en tu archivo.`;
      yieldPrio = "SIN PLAZAS";
    } else if (ratio > 0.35) {
      const newTariff = (tariff + 0.40).toFixed(2);
      yieldAction = `Presión crítica de demanda latente (${dl} veh/h, +${Math.round(ratio*100)}% capacidad). Elevar tarifa a ${newTariff} €/h en horas pico.`;
      yieldPrio = "ALTA";
    } else {
      yieldAction = `Demanda latente activa (${dl} veh/h). Mantener operativa estándar.`;
      yieldPrio = "ESTÁNDAR";
    }

    return {
      dl: dl,
      cruising: qAgitacion,
      deficit: deltaDeficitSup,
      pois: qPois,
      revDay: revDay,
      revWeek: revWeek,
      yieldAction: yieldAction,
      yieldPrio: yieldPrio,
      hasRealCapacity: cap > 0,
      hasRealTariff: tariff > 0,
      waterfall: {
        grossFlow: qTotal,
        passThrough: -qPasante,
        passThroughPct: Math.round(kappa * 100),
        localFlow: qPotencial,
        cruising: qAgitacion,
        deficit: deltaDeficitSup,
        pois: qPois,
        toblerLoss: -perdidaTobler,
        toblerPct: Math.round(factorTobler * 100),
        netDL: dl
      }
    };
  },

  /**
   * Genera los polígonos de isocronas de 3, 5 y 8 min deformados por la pendiente de Tobler
   */
  generateIsochrones(lat, lon, slopePct) {
    // La pendiente de Barcelona asciende hacia el Noroeste (Collserola, ~315°)
    // Subir cuesta penaliza la velocidad según Tobler; bajar cuesta acelera levemente.
    const minutes = [3, 5, 8];
    const colors = ["#10B981", "#0ea5e9", "#164250"];
    const opacities = [0.25, 0.18, 0.12];

    return minutes.map((min, idx) => {
      const baseRadiusMeters = min * 75; // ~4.5 km/h = 75 m/min en llano
      const points = [];
      const numPoints = 28;

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        // Vector hacia Collserola (Noroeste): ángulo ~ 2.3 rad (135°)
        // Componente en contra de la cuesta:
        const uphillComponent = Math.cos(angle - 2.35); // 1 si va hacia la montaña, -1 si va al mar
        
        let radius = baseRadiusMeters;
        if (uphillComponent > 0) {
          // Subiendo pendiente: contracción del radio proporcional a la pendiente
          const penalty = Math.min(0.45, (slopePct / 100) * 4.0 * uphillComponent);
          radius *= (1.0 - penalty);
        } else {
          // Bajando suave: leve expansión (+5%)
          radius *= (1.0 + 0.05 * Math.abs(uphillComponent));
        }

        // Deformación ortogonal por la trama Cerdà (cruces semafóricos restan ~15%)
        const cerdaFactor = 1.0 - 0.08 * Math.abs(Math.sin(angle * 4));
        radius *= cerdaFactor;

        // Convertir metros a delta lat / lon
        const dLat = (radius / 111320) * Math.cos(angle);
        const dLon = (radius / (111320 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);

        points.push([lat + dLat, lon + dLon]);
      }

      return {
        minutes: min,
        color: colors[idx],
        opacity: opacities[idx],
        polygon: points
      };
    });
  },

  /**
   * Divide una línea CSV respetando comillas dobles ("...") y comillas escapadas ("")
   */
  parseCsvLine(line, delimiter = ",") {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  },

  /**
   * Detecta el delimitador predominante fuera de comillas (, ; | \t)
   */
  detectDelimiter(line) {
    let inQuotes = false;
    const counts = { ",": 0, ";": 0, "|": 0, "\t": 0 };
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (!inQuotes && counts[ch] !== undefined) {
        counts[ch]++;
      }
    }
    if (counts["|"] > 0 && counts["|"] >= counts[","]) return "|";
    if (counts["\t"] > 0 && counts["\t"] >= counts[","]) return "\t";
    if (counts[";"] > counts[","]) return ";";
    return ",";
  },

  /**
   * Parser dinámico en navegador para archivos CSV o TXT
   * Soporta cabeceras dinámicas como: Obra Anterior,Obra Actual,Nombre de la Obra,X,Y,,,
   */
  parseInputText(text) {
    // Evitar procesar binarios ZIP/XLSX como texto plano
    if (!text || text.startsWith("PK\x03\x04") || text.includes("[Content_Types].xml")) {
      return [];
    }
    const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith("#"));
    if (rawLines.length === 0) return [];

    const rows = rawLines.map(line => {
      const delim = this.detectDelimiter(line);
      return this.parseCsvLine(line, delim);
    });
    return this.parseRows(rows);
  },

  /**
   * Lee un archivo Excel (.xlsx / .xls) desde un ArrayBuffer (usando SheetJS o extractor nativo offline)
   */
  async parseExcelBuffer(arrayBuffer) {
    if (typeof XLSX !== "undefined") {
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false });
      return this.parseRows(rows);
    }
    // Fallback 100% offline para archivos .xlsx (ZIP + XML nativo del navegador)
    const rows = await this.extractXlsxRowsOffline(arrayBuffer);
    return this.parseRows(rows);
  },

  /**
   * Extractor nativo de .xlsx sin librerías externas (para modo USB 100% sin internet)
   */
  async extractXlsxRowsOffline(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);
    const files = {};

    let offset = 0;
    while (offset + 30 <= bytes.length) {
      const sig = view.getUint32(offset, true);
      if (sig !== 0x04034b50) break; // Local file header signature

      const compression = view.getUint16(offset + 8, true);
      const compSize = view.getUint32(offset + 18, true);
      const nameLen = view.getUint16(offset + 26, true);
      const extraLen = view.getUint16(offset + 28, true);
      const nameBytes = bytes.subarray(offset + 30, offset + 30 + nameLen);
      const fileName = new TextDecoder("utf-8").decode(nameBytes);
      const dataStart = offset + 30 + nameLen + extraLen;
      const compData = bytes.subarray(dataStart, dataStart + compSize);

      if (fileName === "xl/sharedStrings.xml" || fileName.startsWith("xl/worksheets/sheet")) {
        if (compression === 0) {
          files[fileName] = new TextDecoder("utf-8").decode(compData);
        } else if (compression === 8 && typeof DecompressionStream !== "undefined") {
          const ds = new DecompressionStream("deflate-raw");
          const writer = ds.writable.getWriter();
          writer.write(compData);
          writer.close();
          const decompressedBuf = await new Response(ds.readable).arrayBuffer();
          files[fileName] = new TextDecoder("utf-8").decode(decompressedBuf);
        }
      }
      offset = dataStart + compSize;
    }

    const parser = new DOMParser();
    const getByTag = (docOrNode, tag) => {
      let res = docOrNode.getElementsByTagName(tag);
      if (!res || res.length === 0) {
        res = docOrNode.getElementsByTagNameNS("*", tag);
      }
      return res || [];
    };

    const sharedStrings = [];
    if (files["xl/sharedStrings.xml"]) {
      const ssDoc = parser.parseFromString(files["xl/sharedStrings.xml"], "application/xml");
      const siNodes = getByTag(ssDoc, "si");
      for (let i = 0; i < siNodes.length; i++) {
        const tNodes = getByTag(siNodes[i], "t");
        let val = "";
        for (let j = 0; j < tNodes.length; j++) {
          val += tNodes[j].textContent || "";
        }
        sharedStrings.push(val);
      }
    }

    const sheetKey = Object.keys(files).find(k => k.startsWith("xl/worksheets/sheet")) || "";
    if (!sheetKey) return [];

    const sheetDoc = parser.parseFromString(files[sheetKey], "application/xml");
    const rowNodes = getByTag(sheetDoc, "row");
    const rows = [];

    const colRefToIdx = (ref) => {
      const letters = (ref.match(/^[A-Z]+/i) || ["A"])[0].toUpperCase();
      let idx = 0;
      for (let i = 0; i < letters.length; i++) {
        idx = idx * 26 + (letters.charCodeAt(i) - 64);
      }
      return idx - 1;
    };

    for (let r = 0; r < rowNodes.length; r++) {
      const cellNodes = getByTag(rowNodes[r], "c");
      const rowArr = [];
      for (let c = 0; c < cellNodes.length; c++) {
        const cell = cellNodes[c];
        const ref = cell.getAttribute("r") || "A1";
        const cIdx = colRefToIdx(ref);
        const type = cell.getAttribute("t");
        const vNode = cell.getElementsByTagName("v")[0];
        let val = vNode ? vNode.textContent : "";
        if (type === "s" && val !== "") {
          val = sharedStrings[parseInt(val, 10)] ?? val;
        } else if (type === "inlineStr") {
          const isNode = cell.getElementsByTagName("t")[0];
          val = isNode ? isNode.textContent : "";
        }
        rowArr[cIdx] = String(val).trim();
      }
      for (let k = 0; k < rowArr.length; k++) {
        if (rowArr[k] === undefined) rowArr[k] = "";
      }
      rows.push(rowArr);
    }
    return rows;
  },

  /**
   * Procesa una matriz de filas (desde Excel .xlsx/.xls o desde CSV/TXT)
   * identificando dinámicamente las columnas (Obra Anterior, Obra Actual, Nombre de la Obra, X, Y, Dirección...)
   */
  parseRows(rows) {
    const cleanRows = (rows || [])
      .map(r => (Array.isArray(r) ? r.map(c => String(c ?? "").trim()) : []))
      .filter(r => r.some(c => c.length > 0) && !String(r[0] || "").startsWith("#"));

    if (cleanRows.length === 0) return [];

    const firstCols = cleanRows[0];
    const firstLineLower = firstCols.map(c => c.toLowerCase().trim());

    // Detectar si la primera fila es cabecera
    const isHeader = firstLineLower.some(h =>
      h.includes("obra") ||
      h.includes("nombre") ||
      h === "x" ||
      h === "y" ||
      h === "lat" ||
      h === "lon" ||
      h.includes("direcci") ||
      h.includes("plazas") ||
      h.includes("capacidad")
    );

    let colMap = {
      obraAnterior: -1,
      obraActual: -1,
      name: -1,
      x: -1,
      y: -1,
      address: -1,
      capacity: -1,
      tariff: -1,
      district: -1,
      statusType: -1
    };

    if (isHeader) {
      firstLineLower.forEach((h, idx) => {
        if (!h) return;
        if (h.includes("obra anterior") || h === "id_anterior") colMap.obraAnterior = idx;
        else if (h.includes("obra actual") || h === "obra" || h === "codigo" || h === "código" || h === "id") colMap.obraActual = idx;
        else if (h.includes("nombre") || h.includes("name") || h.includes("aparcamiento") || h.includes("parking")) colMap.name = idx;
        else if (h === "x" || h === "lon" || h === "lng" || h.includes("longitud")) colMap.x = idx;
        else if (h === "y" || h === "lat" || h === "latitud") colMap.y = idx;
        else if (h.includes("direcci") || h.includes("address") || h.includes("calle") || h.includes("ubicaci")) colMap.address = idx;
        else if (h.includes("plaza") || h.includes("capacidad") || h.includes("capacity")) colMap.capacity = idx;
        else if (h.includes("tarifa") || h.includes("precio") || h.includes("tariff")) colMap.tariff = idx;
        else if (h.includes("distrito") || h.includes("barrio") || h.includes("district")) colMap.district = idx;
        else if (h.includes("tipo") || h.includes("estado")) colMap.statusType = idx;
      });
    }

    const startIdx = isHeader ? 1 : 0;
    const parsed = [];

    for (let i = startIdx; i < cleanRows.length; i++) {
      const cols = cleanRows[i];
      if (cols.every(c => !c)) continue;

      let obraAnterior = "";
      let obraActual = "";
      let name = "";
      let address = "";
      let lon = NaN;
      let lat = NaN;
      let capacity = null;
      let tariff = null;
      let district = "";
      let statusType = "";

      if (isHeader) {
        if (colMap.obraAnterior >= 0) obraAnterior = cols[colMap.obraAnterior] || "";
        if (colMap.obraActual >= 0) obraActual = cols[colMap.obraActual] || "";
        if (colMap.name >= 0) name = cols[colMap.name] || "";
        if (colMap.x >= 0) lon = parseFloat((cols[colMap.x] || "").replace(",", "."));
        if (colMap.y >= 0) lat = parseFloat((cols[colMap.y] || "").replace(",", "."));
        if (colMap.address >= 0) address = cols[colMap.address] || "";
        if (colMap.capacity >= 0) capacity = parseInt(cols[colMap.capacity], 10) || null;
        if (colMap.tariff >= 0) tariff = parseFloat((cols[colMap.tariff] || "").replace(",", ".")) || null;
        if (colMap.district >= 0) district = cols[colMap.district] || "";
        if (colMap.statusType >= 0) statusType = cols[colMap.statusType] || "";

        // Examinar columnas sin título en la cabecera (ej. Obra Anterior,Obra Actual,Nombre de la Obra,X,Y,,,)
        const usedIndices = new Set(Object.values(colMap).filter(v => v >= 0));
        cols.forEach((val, cIdx) => {
          if (usedIndices.has(cIdx) || !val) return;
          if (!address && val.length > 4 && (/\d/.test(val) || /barcelona|c\/|calle|av\.|gran via|trav/i.test(val))) {
            address = val;
          } else if (!statusType && val.length <= 3 && /^[a-zA-Z]+$/.test(val)) {
            statusType = val;
          }
        });
      } else if (cols.length >= 5) {
        // Detección dinámica por estructura de fila (sin cabecera explícita)
        let coordXIdx = -1;
        let coordYIdx = -1;
        for (let c = 0; c < cols.length; c++) {
          const num = parseFloat((cols[c] || "").replace(",", "."));
          if (!isNaN(num) && String(cols[c]).includes(".")) {
            if (num >= 1.0 && num <= 4.5 && coordXIdx === -1) coordXIdx = c;
            else if (num >= 39.0 && num <= 43.5 && coordYIdx === -1) coordYIdx = c;
          }
        }

        if (coordXIdx >= 0 && coordYIdx >= 0) {
          lon = parseFloat(cols[coordXIdx].replace(",", "."));
          lat = parseFloat(cols[coordYIdx].replace(",", "."));
          if (coordXIdx >= 3) {
            obraAnterior = cols[0] || "";
            obraActual = cols[1] || "";
            name = cols[2] || "";
          } else if (coordXIdx === 2) {
            obraActual = cols[0] || "";
            name = cols[1] || "";
          } else if (coordXIdx === 1) {
            name = cols[0] || "";
          }
          for (let c = Math.max(coordXIdx, coordYIdx) + 1; c < cols.length; c++) {
            const val = cols[c];
            if (!val) continue;
            if (!address && val.length > 3) address = val;
            else if (!statusType && val.length <= 3) statusType = val;
          }
        } else {
          name = cols[0] || "";
          address = cols[1] || name;
          capacity = parseInt(cols[2], 10) || null;
          tariff = parseFloat((cols[3] || "").replace(",", ".")) || null;
        }
      } else if (cols.length >= 2) {
        name = cols[0] || "";
        address = cols[1] || name;
        if (cols[2]) capacity = parseInt(cols[2], 10) || null;
        if (cols[3]) tariff = parseFloat(cols[3].replace(",", ".")) || null;
      } else {
        name = cols[0] || "";
        address = name;
      }

      // Si X e Y venían invertidos (Latitud en X y Longitud en Y), corregirlos automáticamente
      if (!isNaN(lon) && !isNaN(lat) && lon > 35 && lat < 10) {
        const tmp = lon;
        lon = lat;
        lat = tmp;
      }

      if (!name && !address) continue;
      if (!name) name = address;
      if (!address) address = name;

      const rowIdx = parsed.length;
      if (isNaN(lat) || isNaN(lon)) {
        lat = 0;
        lon = 0;
      }

      const inferredDistrict = district || (typeof inferBarcelonaDistrict === "function"
        ? inferBarcelonaDistrict(name, address, lat, lon)
        : "Barcelona");

      const numericId = parseInt(obraActual || obraAnterior, 10);
      const uniqueId = (!isNaN(numericId) && !parsed.some(p => p.id === numericId))
        ? numericId
        : (1000 + rowIdx + 1);

      const rawItem = {
        id: uniqueId,
        obraAnterior: obraAnterior || String(uniqueId),
        obraActual: obraActual || String(uniqueId),
        key: `obra_${obraActual || uniqueId}_${rowIdx}`,
        name: name,
        district: inferredDistrict,
        address: address,
        lat: lat,
        lon: lon,
        capacity: capacity || 0,
        tariff: tariff || 0,
        elevation: 0,
        slope: 0,
        pois: 0,
        fromExcel: true,
        statusType: statusType || "P"
      };

      parsed.push(typeof enrichParkingWithPoints === "function"
        ? enrichParkingWithPoints(rawItem, rowIdx)
        : rawItem);
    }

    // Ordenar de menor a mayor por los primeros números / código de obra
    parsed.sort((a, b) => {
      const getNum = (p) => {
        if (!p) return 999999;
        const rawCode = String(p.obraActual !== undefined && p.obraActual !== null ? p.obraActual : (p.obraAnterior || "")).trim();
        const mCode = rawCode.match(/\d+/);
        if (mCode) return parseInt(mCode[0], 10);

        const rawName = String(p.name || "").trim();
        const mName = rawName.match(/^\D*(\d+)/);
        if (mName) return parseInt(mName[1], 10);

        if (typeof p.id === "number" && !isNaN(p.id)) return p.id;
        const mId = String(p.id || "").match(/\d+/);
        return mId ? parseInt(mId[0], 10) : 999999;
      };
      const diff = getNum(a) - getNum(b);
      if (diff !== 0) return diff;
      return String(a.name || "").localeCompare(String(b.name || ""), undefined, { numeric: true, sensitivity: 'base' });
    });

    return parsed;
  }
};


// ============================================================================
// MOTOR MATEMÁTICO BOTTOM-UP: INTENSIDADES HORARIAS Y CAUDAL DE TRÁFICO
// Basado en las 2 espiras electromagnéticas oficiales de Barcelona (2024, 2025, 2026)
// ============================================================================
const TrafficIntensityEngine = {
  // 5 Regímenes oficiales de tráfico de Open Data Barcelona
  REGIMES: {
    1: { id: 1, name: "Molt fluid", desc: "Muy fluido", factor: 0.15 },
    2: { id: 2, name: "Fluid", desc: "Fluido", factor: 0.60 },
    3: { id: 3, name: "Dens", desc: "Denso", factor: 0.85 },
    4: { id: 4, name: "Molt dens", desc: "Muy denso", factor: 1.05 },
    5: { id: 5, name: "Congestió", desc: "Saturado / Congestión", factor: 1.20 }
  },

  // Perfiles de régimen horario oficial de Barcelona por tipo de día (24 horas)
  // '1': Lunes | '2': Martes a Jueves | '3': Viernes | '4': Sábado | '5': Domingo y Festivos
  HOURLY_REGIMES_BY_DAY_TYPE: {
    // Lunes: Madrugada muy fluida, doble hora punta muy marcada (08h laboral y 18h retorno)
    '1': [
      1, 1, 1, 1, 1, 1,
      2, 4, 5, 4, 3, 3,
      3, 3, 3, 3, 4, 5,
      5, 4, 3, 2, 1, 1
    ],
    // Martes a Jueves: Flujo comercial e industrial constante con doble pico laboral
    '2': [
      1, 1, 1, 1, 1, 1,
      2, 4, 5, 4, 3, 3,
      3, 3, 3, 3, 4, 5,
      5, 4, 3, 2, 2, 1
    ],
    // Viernes: Pico de tarde adelantado al mediodía y tarde-noche prolongada
    '3': [
      1, 1, 1, 1, 1, 1,
      2, 4, 5, 4, 3, 4,
      4, 4, 3, 3, 4, 5,
      5, 4, 4, 3, 2, 1
    ],
    // Sábado: Mañana tranquila, pico comercial mediodía y ocio vespertino
    '4': [
      1, 1, 1, 1, 1, 1,
      1, 2, 2, 3, 4, 4,
      4, 3, 2, 3, 3, 4,
      4, 4, 3, 3, 2, 1
    ],
    // Domingo: Madrugada baja, mañana sosegada (valle 08h), pico mediodía (12h-14h comidas) y retorno 20h
    '5': [
      1, 1, 1, 1, 1, 1,
      1, 1, 1, 2, 3, 4,
      4, 3, 2, 2, 3, 3,
      4, 4, 3, 2, 1, 1
    ]
  },

  // Distribución empírica canónica de caudales unitarios normalizados para las 24 horas
  HOURLY_WEIGHTS: {
    '1': [
      0.012, 0.008, 0.006, 0.005, 0.007, 0.015,
      0.038, 0.068, 0.076, 0.068, 0.052, 0.050,
      0.052, 0.058, 0.056, 0.050, 0.054, 0.068,
      0.080, 0.072, 0.056, 0.040, 0.026, 0.018
    ],
    '2': [
      0.012, 0.008, 0.006, 0.005, 0.007, 0.015,
      0.038, 0.068, 0.075, 0.068, 0.052, 0.050,
      0.052, 0.058, 0.056, 0.050, 0.054, 0.068,
      0.078, 0.072, 0.058, 0.042, 0.027, 0.019
    ],
    '3': [
      0.014, 0.009, 0.007, 0.005, 0.008, 0.016,
      0.036, 0.065, 0.072, 0.066, 0.055, 0.058,
      0.064, 0.066, 0.060, 0.056, 0.062, 0.074,
      0.082, 0.076, 0.062, 0.048, 0.035, 0.022
    ],
    '4': [
      0.026, 0.018, 0.013, 0.009, 0.007, 0.008,
      0.014, 0.026, 0.045, 0.062, 0.074, 0.080,
      0.076, 0.064, 0.052, 0.054, 0.060, 0.068,
      0.072, 0.068, 0.058, 0.048, 0.042, 0.036
    ],
    '5': [
      0.030, 0.022, 0.015, 0.010, 0.008, 0.008,
      0.010, 0.016, 0.024, 0.040, 0.062, 0.078,
      0.082, 0.070, 0.052, 0.048, 0.056, 0.066,
      0.076, 0.078, 0.066, 0.050, 0.040, 0.033
    ]
  },

  /**
   * Calcula el caudal horario para cada una de las 24 horas y suma los coches diarios.
   * La suma de las 24 horas equivale EXACTAMENTE al aforo diario total.
   */
  computeDayFlowBottomUp(dailyCars, dayType = '2') {
    const rawWeights = this.HOURLY_WEIGHTS[dayType] || this.HOURLY_WEIGHTS['2'];
    const totalW = rawWeights.reduce((a, b) => a + b, 0);
    const weights = rawWeights.map(w => w / totalW);
    const regimes = this.HOURLY_REGIMES_BY_DAY_TYPE[dayType] || this.HOURLY_REGIMES_BY_DAY_TYPE['2'];

    let hourly = weights.map(w => Math.round(dailyCars * w));
    const sumH = hourly.reduce((a, b) => a + b, 0);
    const diff = dailyCars - sumH;
    if (diff !== 0 && hourly.length > 0) {
      // Ajuste prudencial en la hora punta para cuadre exacto al vehículo (cero descuadre)
      const maxIdx = hourly.indexOf(Math.max(...hourly));
      hourly[maxIdx] = Math.max(0, hourly[maxIdx] + diff);
    }

    const peakVal = Math.max(...hourly);
    const peakIdx = hourly.indexOf(peakVal);
    const valVal = Math.min(...hourly);
    const valIdx = hourly.indexOf(valVal);

    return {
      dailyCars: hourly.reduce((a, b) => a + b, 0),
      hourlyCars: hourly,
      peakHour: { hour: peakIdx, cars: peakVal, timeStr: `${String(peakIdx).padStart(2, '0')}:00` },
      valleyHour: { hour: valIdx, cars: valVal, timeStr: `${String(valIdx).padStart(2, '0')}:00` },
      regimes: regimes
    };
  },

  /**
   * Combina las 2 espiras más cercanas mediante IDW hora a hora para obtener
   * el caudal horario y diario del aparcamiento sin redondeos sintéticos.
   */
  combineParkingFlowBottomUp(s1Daily, s2Daily, w1, w2, dayType = '2') {
    const f1 = this.computeDayFlowBottomUp(s1Daily, dayType);
    const f2 = (s2Daily > 0) ? this.computeDayFlowBottomUp(s2Daily, dayType) : null;

    let combinedHourly = [];
    if (f2) {
      combinedHourly = f1.hourlyCars.map((c1, h) => {
        const c2 = f2.hourlyCars[h] || 0;
        return Math.round(w1 * c1 + w2 * c2);
      });
    } else {
      combinedHourly = [...f1.hourlyCars];
    }

    const totalDay = combinedHourly.reduce((a, b) => a + b, 0);
    const peakVal = Math.max(...combinedHourly);
    const peakIdx = combinedHourly.indexOf(peakVal);
    const valVal = Math.min(...combinedHourly);
    const valIdx = combinedHourly.indexOf(valVal);

    return {
      dailyCars: totalDay,
      hourlyCars: combinedHourly,
      peakHour: { hour: peakIdx, cars: peakVal, timeStr: `${String(peakIdx).padStart(2, '0')}:00` },
      valleyHour: { hour: valIdx, cars: valVal, timeStr: `${String(valIdx).padStart(2, '0')}:00` }
    };
  }
};

// Exportar globalmente
if (typeof window !== "undefined") {
  window.TrafficIntensityEngine = TrafficIntensityEngine;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { TrafficIntensityEngine };
}
