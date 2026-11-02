const fs = require('fs');
const vm = require('vm');

const ctx = {
  console: console,
  window: {},
  document: {
    getElementById: () => ({ innerHTML: '', value: '', addEventListener: () => { } }),
    querySelector: () => ({ innerHTML: '' }),
    querySelectorAll: () => []
  },
  localStorage: {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { }
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  navigator: { onLine: true },
  Chart: class { constructor() { } destroy() { } update() { } }
};
vm.createContext(ctx);

vm.runInContext(fs.readFileSync('web/js/data.js', 'utf8') + '; this.dataLoaded = true;', ctx);
vm.runInContext(fs.readFileSync('web/js/engine.js', 'utf8') + '; this.DE = DemandEngine;', ctx);

// Test DemandEngine.parseRows with unsorted rows
const testRows = [
  ['Obra Anterior', 'Obra Actual', 'Nombre de la Obra', 'X', 'Y'],
  ['412', '412', 'BALMES, 20', '2.16', '41.39'],
  ['260', '260', 'VALENCIA, 511', '2.18', '41.40'],
  ['2001', '2001', 'GRAN VIA, 400', '2.15', '41.38'],
  ['51', '51', 'VALENCIA, 307', '2.17', '41.39'],
  ['304', '304', 'DIAGONAL, 593', '2.13', '41.39']
];

const parsed = ctx.DE.parseRows(testRows);
console.log('Parsed & sorted parkings count:', parsed.length);
const codes = parsed.map(p => p.obraActual);
console.log('Order of obraActual:', codes);

if (JSON.stringify(codes) === JSON.stringify(['51', '260', '304', '412', '2001'])) {
  console.log('✅ TEST PASSED: Parkings are perfectly sorted by code ascending (51, 260, 304, 412, 2001)!');
} else {
  console.error('❌ TEST FAILED: Unexpected order', codes);
  process.exit(1);
}