const fs = require('fs');
const vm = require('vm');

function runTest(fileLabel, filePath) {
  console.log(`\n================ Testing ${fileLabel} (${filePath}) ================`);
  const dataCode = fs.readFileSync('web/js/data.js', 'utf8');
  const engineCode = fs.readFileSync('web/js/engine.js', 'utf8');
  const appCode = fs.readFileSync(filePath, 'utf8');
  const code = dataCode + '\n;' + engineCode + '\n;' + appCode;

  // Create mock DOM environment
  const elements = {};
  function makeEl(id) {
    const el = {
      id,
      innerHTML: '',
      innerText: '',
      className: '',
      classList: {
        add: () => { },
        remove: () => { },
        contains: () => false
      },
      style: {},
      getContext: () => ({}),
      addEventListener: () => { },
      querySelector: () => makeEl('inner'),
      querySelectorAll: () => []
    };
    elements[id] = el;
    return el;
  }

  const domIds = [
    'chartGlobalMonthlyDL', 'globalMonthlyDiffGrid', 'globalPeakBadge', 'globalYoyBadge',
    'kpiTotalLatent', 'kpiTotalCruising', 'kpiTotalRevenue', 'kpiTotalCapacity',
    'kpiCapSubtitle', 'kpiLatentSubtitle', 'kpiCruisingSubtitle',
    'portfolioCountSubtitle', 'portfolioCountKpi', 'chartPortfolioCountTitle', 'chartPortfolioCountFooter',
    'chartTrafficPassing', 'trafficStatusBadge', 'trafficStatusExplanation',
    'chart1GridTitle', 'chart1GridSubtitle', 'chart1MonthlyDiffGrid', 'chart1DayTabsContainer',
    'chart1FormulaContainer', 'chart1FormulaMethodologyCard', 'zoneAvgDailyTraffic', 'zoneTrafficPeakBadge',
    'zoneTrafficValleyBadge', 'zoneTrafficTrendBadge', 'intradayDayBadge', 'intradayTotalDay',
    'intradayPeakHour', 'intradayValleyHour', 'chartIntradayDay', 'chartZonePassing'
  ];

  domIds.forEach(id => makeEl(id));

  // Mock Chart
  class MockChart {
    static getChart() { return null; }
    constructor(ctx, config) {
      this.ctx = ctx;
      this.config = config;
      this.data = config.data || { datasets: [] };
      this.options = config.options || {};
    }
    update() { }
    resize() { }
    destroy() { }
  }

  const sandbox = {
    window: {
      location: { href: 'http://localhost' },
      lucide: { createIcons: () => { } },
      addEventListener: () => { },
      localStorage: {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { }
      }
    },
    localStorage: {
      getItem: () => null,
      setItem: () => { },
      removeItem: () => { }
    },
    document: {
      getElementById: (id) => elements[id] || makeEl(id),
      createElement: (tag) => makeEl(tag),
      querySelectorAll: () => [],
      querySelector: () => makeEl('query')
    },
    Chart: MockChart,
    lucide: { createIcons: () => { } },
    L: {
      layerGroup: () => ({ addTo: () => ({ clearLayers: () => ({}) }) }),
      map: () => ({ setView: () => ({}), removeLayer: () => ({}), addLayer: () => ({}) }),
      tileLayer: () => ({ addTo: () => ({}) }),
      circleMarker: () => ({ bindPopup: () => ({}), addTo: () => ({}), on: () => ({}) }),
      icon: () => ({}),
      marker: () => ({ bindPopup: () => ({}), addTo: () => ({}) })
    },
    fetch: async () => ({ ok: true, json: async () => ({ result: { records: [] } }) }),
    console: console,
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: () => { },
    setInterval: () => { },
    clearInterval: () => { },
    Date: Date,
    Math: Math,
    Number: Number,
    String: String,
    Array: Array,
    Object: Object,
    RegExp: RegExp,
    parseFloat: parseFloat,
    parseInt: parseInt,
    isNaN: isNaN
  };
  sandbox.window.document = sandbox.document;
  sandbox.global = sandbox;

  const script = new vm.Script(code);
  const context = vm.createContext(sandbox);
  script.runInContext(context);

  console.log('Script loaded and initialized without syntax errors!');
  const app = sandbox.window.app || new (sandbox.NNApp || sandbox.window.NNApp)();
  if (!app) throw new Error('app instance not created!');
  console.log('ParkingApp instance created successfully!');

  // Mock parking with trafficPoints
  const mockMonthly24 = [20000, 21000, 22000, 23000, 24000, 25000, 26000, 18000, 23000, 25000, 24000, 23000];
  const mockMonthly25 = [21000, 22000, 23000, 24000, 25000, 26000, 27000, 19000, 24000, 26000, 25000, 24000];
  // 2026 should only have closed months (0..9) with values, 10 and 11 should be 0
  const mockMonthly26 = [22000, 23000, 24000, 25000, 26000, 27000, 28000, 20000, 25000, 27000, 0, 0];

  const mockParking = {
    id: 1,
    name: 'Parking Test Sagrada Familia',
    district: 'Eixample',
    address: 'Carrer de Mallorca, 401',
    capacity: 250,
    dl: 15,
    cruising: 80,
    trafficPoints: [
      {
        id: 'tp_1',
        street: 'Carrer de Mallorca',
        monthlyPrev2Year: mockMonthly24,
        monthlyPrevYear: mockMonthly25,
        monthlyCurrentYear: mockMonthly26,
        yoyGrowthPct: 4.2,
        yoyGrowthPct24to25: 4.5,
        annualCarsPrev2Year: 260000,
        annualCarsPrevYear: 275000,
        annualCarsCurrentYear: 285000,
        monthlyByDayTypePrev2: { '1': mockMonthly24, '2': mockMonthly24, '3': mockMonthly24, '4': mockMonthly24, '5': mockMonthly24 },
        monthlyByDayTypePrev: { '1': mockMonthly25, '2': mockMonthly25, '3': mockMonthly25, '4': mockMonthly25, '5': mockMonthly25 },
        monthlyByDayTypeCur: { '1': mockMonthly26, '2': mockMonthly26, '3': mockMonthly26, '4': mockMonthly26, '5': mockMonthly26 }
      }
    ]
  };

  app.parkings = [mockParking];

  // Test 1: calculatePortfolioSensorsTrafficMonthly
  const monthlyRes = app.calculatePortfolioSensorsTrafficMonthly();
  console.log('\n[Test 1] calculatePortfolioSensorsTrafficMonthly:');
  console.log(' - prev2Monthly Nov (idx 10):', monthlyRes.prev2Monthly[10]);
  console.log(' - prevMonthly Nov (idx 10):', monthlyRes.prevMonthly[10]);
  console.log(' - curMonthly Nov (idx 10):', monthlyRes.curMonthly[10], '(Must be 0)');
  console.log(' - curMonthly Dic (idx 11):', monthlyRes.curMonthly[11], '(Must be 0)');
  console.log(' - curMonthly Oct (idx 9):', monthlyRes.curMonthly[9], '(Must be > 0)');
  if (monthlyRes.curMonthly[10] !== 0) throw new Error('curMonthly[10] is not 0!');
  if (monthlyRes.curMonthly[11] !== 0) throw new Error('curMonthly[11] is not 0!');
  if (monthlyRes.curMonthly[9] <= 0) throw new Error('curMonthly[9] should be > 0!');

  // Test 2: updateGlobalKPIs
  app.updateGlobalKPIs();
  const diffGridHtml = elements['globalMonthlyDiffGrid'].innerHTML;
  console.log('\n[Test 2] globalMonthlyDiffGrid check:');
  console.log(' - Contains "En curso":', diffGridHtml.includes('En curso'));
  console.log(' - Contains "Futuro":', diffGridHtml.includes('Futuro'));
  if (!diffGridHtml.includes('En curso')) throw new Error('Diff grid missing "En curso" badge!');
  if (!diffGridHtml.includes('Futuro')) throw new Error('Diff grid missing "Futuro" badge!');

  const globalChartDataset2 = app.chartGlobalMonthlyDL.data.datasets[2];
  console.log('\n[Test 3] chartGlobalMonthlyDL dataset[2] data check:');
  console.log(' - dataset[2].data[9] (Oct):', globalChartDataset2.data[9]);
  console.log(' - dataset[2].data[10] (Nov):', globalChartDataset2.data[10], '(Must be null)');
  console.log(' - dataset[2].data[11] (Dic):', globalChartDataset2.data[11], '(Must be null)');
  if (globalChartDataset2.data[10] !== null) throw new Error('globalChartDataset2.data[10] is not null!');
  if (globalChartDataset2.data[11] !== null) throw new Error('globalChartDataset2.data[11] is not null!');
  if (globalChartDataset2.data[9] == null) throw new Error('globalChartDataset2.data[9] should not be null!');

  // Test 3: renderChart1 (day mode)
  app.chart1Unit = 'day';
  app.renderChart1(mockParking);
  const chart1PassingDataset2 = app.chartTrafficPassing.data.datasets[2];
  console.log('\n[Test 4] chartTrafficPassing dataset[2] data check (day mode):');
  console.log(' - dataset[2].data[9] (Oct):', chart1PassingDataset2.data[9]);
  console.log(' - dataset[2].data[10] (Nov):', chart1PassingDataset2.data[10], '(Must be null)');
  console.log(' - dataset[2].data[11] (Dic):', chart1PassingDataset2.data[11], '(Must be null)');
  if (chart1PassingDataset2.data[10] !== null) throw new Error('chartTrafficPassing.data.datasets[2].data[10] is not null!');
  if (chart1PassingDataset2.data[11] !== null) throw new Error('chartTrafficPassing.data.datasets[2].data[11] is not null!');

  const chart1DiffGridHtml = elements['chart1MonthlyDiffGrid'].innerHTML;
  console.log(' - chart1MonthlyDiffGrid contains "En curso":', chart1DiffGridHtml.includes('En curso'));
  console.log(' - chart1MonthlyDiffGrid contains "Futuro":', chart1DiffGridHtml.includes('Futuro'));
  if (!chart1DiffGridHtml.includes('En curso')) throw new Error('chart1MonthlyDiffGrid missing "En curso" badge!');
  if (!chart1DiffGridHtml.includes('Futuro')) throw new Error('chart1MonthlyDiffGrid missing "Futuro" badge!');

  // Test 4: renderChart1 (hour mode)
  app.chart1Unit = 'hour';
  app.renderChart1(mockParking);
  const chart1HourDataset2 = app.chartTrafficPassing.data.datasets[2];
  console.log('\n[Test 5] chartTrafficPassing dataset[2] data check (hour mode):');
  console.log(' - dataset[2].data[10] (Nov):', chart1HourDataset2.data[10], '(Must be null)');
  console.log(' - dataset[2].data[11] (Dic):', chart1HourDataset2.data[11], '(Must be null)');
  if (chart1HourDataset2.data[10] !== null) throw new Error('chartTrafficPassing hour dataset[2].data[10] is not null!');
  if (chart1HourDataset2.data[11] !== null) throw new Error('chartTrafficPassing hour dataset[2].data[11] is not null!');

  // Test 5: Tooltip callbacks safety with null
  const tipLabelFn = app.chartGlobalMonthlyDL.config.options.plugins.tooltip.callbacks.label;
  const tipOutputNov = tipLabelFn({ dataset: { label: '2026 Estimado' }, raw: null, dataIndex: 10 });
  const tipOutputDic = tipLabelFn({ dataset: { label: '2026 Estimado' }, raw: null, dataIndex: 11 });
  console.log('\n[Test 6] Tooltip callback output:');
  console.log(' - Nov tooltip:', tipOutputNov);
  console.log(' - Dic tooltip:', tipOutputDic);
  if (!tipOutputNov.includes('En curso')) throw new Error('Nov tooltip missing "En curso"');
  if (!tipOutputDic.includes('Futuro')) throw new Error('Dic tooltip missing "Futuro"');

  console.log(`\n>>> ALL ASSERTIONS PASSED FOR ${fileLabel}! <<<`);
}

runTest('web/js/app.js', 'web/js/app.js');
runTest('usb_portable/web/js/app.js', 'usb_portable/web/js/app.js');
console.log('\n************************************************');
console.log('FULL VERIFICATION SUITE PASSED WITH 100% SUCCESS!');
console.log('************************************************');