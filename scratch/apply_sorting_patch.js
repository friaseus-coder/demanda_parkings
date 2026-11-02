const fs = require('fs');

function patchEngine(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('// Ordenar de menor a mayor por los primeros números / código de obra')) {
    console.log(`Already patched ${filePath}`);
    return;
  }

  const pattern = /(\s*parsed\.push\(typeof enrichParkingWithPoints === "function"[\s\S]*?rawItem\);\s*\}\s*)(return parsed;\s*\})/m;
  if (!pattern.test(content)) {
    throw new Error(`Pattern not found in ${filePath}`);
  }

  const replacement = `$1
    // Ordenar de menor a mayor por los primeros números / código de obra
    parsed.sort((a, b) => {
      const getNum = (p) => {
        if (!p) return 999999;
        const rawCode = String(p.obraActual !== undefined && p.obraActual !== null ? p.obraActual : (p.obraAnterior || "")).trim();
        const mCode = rawCode.match(/\\d+/);
        if (mCode) return parseInt(mCode[0], 10);

        const rawName = String(p.name || "").trim();
        const mName = rawName.match(/^\\D*(\\d+)/);
        if (mName) return parseInt(mName[1], 10);

        if (typeof p.id === "number" && !isNaN(p.id)) return p.id;
        const mId = String(p.id || "").match(/\\d+/);
        return mId ? parseInt(mId[0], 10) : 999999;
      };
      const diff = getNum(a) - getNum(b);
      if (diff !== 0) return diff;
      return String(a.name || "").localeCompare(String(b.name || ""), undefined, { numeric: true, sensitivity: 'base' });
    });

    return parsed;
  }`;

  content = content.replace(pattern, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully patched ${filePath}`);
}

function patchApp(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. mergeWithKnownPortfolio map & return
  const mapPattern = /mergeWithKnownPortfolio\(incomingList\)\s*\{\s*([\s\S]*?)return\s+\(incomingList \|\| \[\]\)\.map/m;
  if (!mapPattern.test(content)) {
    throw new Error(`mergeWithKnownPortfolio start not found in ${filePath}`);
  }
  content = content.replace(mapPattern, (match, p1) => {
    return `mergeWithKnownPortfolio(incomingList) {\n${p1}const result = (incomingList || []).map`;
  });

  const endMergePattern = /(return typeof enrichParkingWithPoints === 'function' \? enrichParkingWithPoints\(cleanItem, idx\) : cleanItem;\s*\}\);\s*)(\})/m;
  if (!endMergePattern.test(content)) {
    throw new Error(`endMergePattern not found in ${filePath}`);
  }
  content = content.replace(endMergePattern, (match, p1) => {
    return `${p1}return this.sortParkingsByCode(result);\n  }\n\n  sortParkingsByCode(parkingsList) {
    if (!Array.isArray(parkingsList)) return parkingsList;
    const getCode = (p) => {
      if (!p) return 999999;
      const rawCode = String(p.obraActual !== undefined && p.obraActual !== null ? p.obraActual : (p.obraAnterior || "")).trim();
      const mCode = rawCode.match(/\\d+/);
      if (mCode) return parseInt(mCode[0], 10);

      const rawName = String(p.name || "").trim();
      const mName = rawName.match(/^\\D*(\\d+)/);
      if (mName) return parseInt(mName[1], 10);

      if (typeof p.id === "number" && !isNaN(p.id)) return p.id;
      const mId = String(p.id || "").match(/\\d+/);
      if (mId) return parseInt(mId[0], 10);

      return 999999;
    };

    return parkingsList.sort((a, b) => {
      const codeA = getCode(a);
      const codeB = getCode(b);
      if (codeA !== codeB) return codeA - codeB;
      return String(a.name || "").localeCompare(String(b.name || ""), undefined, { numeric: true, sensitivity: 'base' });
    });
  }`;
  });

  // 2. recalcAllParkings sort
  const recalcPattern = /\/\/\s*Mantener orden coherente por Demanda Latente\s*this\.parkings\.sort\(\(a,\s*b\)\s*=>\s*b\.dl\s*-\s*a\.dl\);/m;
  if (!recalcPattern.test(content)) {
    throw new Error(`recalcPattern not found in ${filePath}`);
  }
  content = content.replace(recalcPattern, `// Mantener orden coherente de cartera por código de obra / primeros números de menor a mayor\n    this.sortParkingsByCode(this.parkings);`);

  // 3. applyLoadedParkings sort
  const applyPattern = /(async\s+applyLoadedParkings\(newParkings\)\s*\{\s*if\s*\(newParkings\s*&&\s*newParkings\.length\s*>\s*0\)\s*\{\s*)(this\.parkings\s*=\s*newParkings;)/m;
  if (!applyPattern.test(content)) {
    throw new Error(`applyPattern not found in ${filePath}`);
  }
  content = content.replace(applyPattern, `$1this.sortParkingsByCode(newParkings);\n      $2`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully patched ${filePath}`);
}

patchEngine('web/js/engine.js');
patchApp('web/js/app.js');
patchEngine('usb_portable/web/js/engine.js');
patchApp('usb_portable/web/js/app.js');