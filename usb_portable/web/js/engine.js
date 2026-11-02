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

    // Regla real-data-only: Si no se dispone de capacidad física de plazas en el archivo cargado,
    // todas las métricas de demanda, agitación (cruising) y aforo exterior son estrictamente 0.
    if (cap <= 0) {
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
        yieldAction: "Sin telemetría de capacidad física (0 plazas en archivo cargado)",
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

    // 1. Aforo viario bruto (Q_total)
    const hourFlow = [0.12, 0.08, 0.05, 0.04, 0.06, 0.15, 0.42, 0.85, 1.05, 0.98, 0.92, 1.02, 1.15, 1.20, 1.05, 0.95, 1.10, 1.28, 1.35, 1.25, 1.05, 0.80, 0.50, 0.28];
    const trafficFactor = hourFlow[Math.max(0, Math.min(23, hour))];
    const qTotal = Math.max(100, Math.round(cap * 3.8 * trafficFactor));

    // 2. Tráfico Pasante
    let omega = 1.05;
    if (hour >= 7 && hour <= 9) omega = 1.15;
    else if (hour >= 14 && hour <= 17) omega = 1.00;
    else if (hour >= 21 || hour <= 6) omega = 0.65;

    const kappa = Math.min(0.92, Math.max(0.15, kappaBase * omega));
    const qPasante = Math.round(qTotal * kappa);
    const qPotencial = Math.max(10, qTotal - qPasante);

    // 3. Agitación (Cruising) - Modelo Logit
    const thetaSup = sat / 100.0;
    const deltaV = thetaSup > 0.70 ? Math.min(0.60, (thetaSup - 0.70) * 1.5) : 0.0;
    const rhoDum = Math.min(1.0, 0.50 + 0.40 * thetaSup);
    const logitZ = this.BETA_0 + this.BETA_1 * deltaV + this.BETA_2 * thetaSup + this.BETA_3 * rhoDum;
    const gamma = 1.0 / (1.0 + Math.exp(-logitZ));
    const qAgitacion = Math.round(qPotencial * gamma);

    // 4. Déficit en Calzada
    let deltaDeficitSup = 0;
    if (thetaSup > this.THETA_THRESHOLD) {
      const nPlazasSup = Math.round(cap * 0.90);
      deltaDeficitSup = Math.round((thetaSup - this.THETA_THRESHOLD) * nPlazasSup * 0.95);
    }

    // 5. Atractores y POIs
    const isShopping = (hour >= 17 && hour <= 21);
    const isLunch = (hour >= 13 && hour <= 16);
    let poiWeight = 0.14;
    if (isShopping) poiWeight = 0.22;
    else if (isLunch) poiWeight = 0.18;
    const qPois = Math.round(pois * poiWeight);

    // Demanda Bruta
    const dBruta = qAgitacion + deltaDeficitSup + qPois;

    // 6. Pérdida Tobler
    const factorTobler = Math.min(0.40, (slope / 100.0) * 1.8 + 0.05);
    const perdidaTobler = Math.round(dBruta * factorTobler);
    const dFriccionada = Math.max(5, dBruta - perdidaTobler);

    // 7. Cuota Huff
    const huffShare = Math.min(0.65, Math.max(0.20, (cap / (cap + 320)) * 0.95));
    const dCapturable = Math.round(dFriccionada * huffShare);

    // 8. Multiplicadores
    const phiClima = 1.0 + Math.min(rain, 15.0) * 0.045;
    const eventMultipliers = { none: 1.00, mwc: 1.45, concert: 1.30, festivo: 1.35, strike: 1.50 };
    const omegaEvento = eventMultipliers[event] || 1.00;
    const psiPrecio = Math.max(0.40, 1.0 - ((tariff - this.REF_MARKET_TARIFF) / this.REF_MARKET_TARIFF) * this.PRICE_ELASTICITY);

    // 9. Demanda Latente Neta (DL)
    const dl = Math.max(5, Math.round(dCapturable * phiClima * omegaEvento * psiPrecio));

    // 10. Ingresos no captados
    const revDay = Math.round(dl * this.AVG_STAY_HOURS * tariff * 0.65 * 1.4);
    const revWeek = Math.round(revDay * 6.8);

    // 11. Recomendación Yield
    const ratio = dl / Math.max(1, cap);
    let yieldAction = "";
    let yieldPrio = "ESTÁNDAR";

    if (ratio > 0.35) {
      const newTariff = (tariff + 0.40).toFixed(2);
      yieldAction = `Presión crítica de demanda latente (${dl} veh/h, +${Math.round(ratio*100)}% capacidad). Elevar tarifa a ${newTariff} €/h en horas pico y restringir cupos a plataformas digitales.`;
      yieldPrio = "ALTA";
    } else if (ratio > 0.20) {
      const newTariff = (tariff + 0.15).toFixed(2);
      yieldAction = `Demanda latente sólida (${dl} veh/h). Ajustar tarifa dinámica a ${newTariff} €/h y limitar descuentos en agregadores.`;
      yieldPrio = "MEDIA";
    } else {
      yieldAction = `Demanda moderada (${dl} veh/h). Mantener tarifa de ${tariff.toFixed(2)} €/h y potenciar acuerdos corporativos y recarga eléctrica.`;
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

    return parsed;
  }
};
