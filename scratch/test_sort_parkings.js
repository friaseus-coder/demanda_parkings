const parkings = [
  { id: 4, obraActual: "412", name: "BALMES, 20" },
  { id: 2, obraActual: "260", name: "VALENCIA, 511" },
  { id: 6, obraActual: "2001", name: "GRAN VIA, 400" },
  { id: 1, obraActual: "51", name: "VALENCIA, 307" },
  { id: 5, obraActual: "1202", name: "ROCAFORT, 100" },
  { id: 3, obraActual: "304", name: "DIAGONAL, 593" },
  { id: 7, obraActual: "", obraAnterior: "", name: "[424] PAU CLARIS" },
  { id: 8, obraActual: "", obraAnterior: "", name: "566 ARAGO" }
];

function sortParkingsByCode(parkingsList) {
  if (!Array.isArray(parkingsList)) return parkingsList;
  const getCode = (p) => {
    if (!p) return 999999;
    const rawCode = String(p.obraActual !== undefined && p.obraActual !== null ? p.obraActual : (p.obraAnterior || "")).trim();
    const mCode = rawCode.match(/\d+/);
    if (mCode) return parseInt(mCode[0], 10);

    const rawName = String(p.name || "").trim();
    const mName = rawName.match(/^\D*(\d+)/);
    if (mName) return parseInt(mName[1], 10);

    if (typeof p.id === "number" && !isNaN(p.id)) return p.id;
    const mId = String(p.id || "").match(/\d+/);
    if (mId) return parseInt(mId[0], 10);

    return 999999;
  };

  return parkingsList.sort((a, b) => {
    const codeA = getCode(a);
    const codeB = getCode(b);
    if (codeA !== codeB) return codeA - codeB;
    return String(a.name || "").localeCompare(String(b.name || ""), undefined, { numeric: true, sensitivity: 'base' });
  });
}

const sorted = sortParkingsByCode([...parkings]);
console.log("Resultado de ordenación:");
sorted.forEach(p => console.log(`- Obra: ${p.obraActual || '-'} | Nombre: ${p.name}`));

