const fs = require('fs');

function testSurgical(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Check 1: fetchRealTrafficFromOpenDataBCN curMonthlyImd
  const r1 = /(curMonthlyImd\s*=\s*prevMonthlyImd\.map\(\(val25,\s*m\)\s*=>\s*\{)([\s\S]*?)(const val24 = prev2MonthlyImd\[m\])/;
  console.log('r1 found:', r1.test(code));

  // Check 2: curMonthlyByDayType
  const r2 = /(curMonthlyByDayType\[dt\]\s*=\s*arr25\.map\(\(v25,\s*m\)\s*=>\s*\{)([\s\S]*?)(const v24 = arr24\[m\])/;
  console.log('r2 found:', r2.test(code));

  // Check 3: annual totals on closed months
  const r3 = /(const annualPrev2 = prev2MonthlyImd\.reduce[\s\S]*?const yoy24to25Pct = annualPrev2 > 0 \? \+\(\(\(annualPrev - annualPrev2\) \/ annualPrev2\) \* 100\)\.toFixed\(1\) : 0;)/;
  console.log('r3 found:', r3.test(code));

  // Check 4: calculatePortfolioSensorsTrafficMonthly
  const r4 = /(calculatePortfolioSensorsTrafficMonthly\(\)\s*\{[\s\S]*?const curMonthly = MONTHS_LABELS\.map\(\(_, mIdx\) => \{)([\s\S]*?)(const days = DAYS_IN_MONTH\[mIdx\])/;
  console.log('r4 found:', r4.test(code));

  // Check 5: updateGlobalKPIs maxVal and yoyBadge
  const r5 = /(const maxVal = Math\.max\(\.\.\.monthlyCurTotal\);[\s\S]*?yoyBadgeEl\.innerHTML = `[\s\S]*?`;[\s\S]*?\})([\s\S]*?if \(!this\.chartGlobalMonthlyDL\))/;
  console.log('r5 found:', r5.test(code));

  // Check 6: chartGlobalMonthlyDL line dataset
  const r6 = /(label: `Suma Sensores Cartera \${yEst} \${estTag} \(t\)`,[\s\S]*?data:\s*)monthlyCurTotal(,[\s\S]*?borderColor: '#164250')/;
  console.log('r6 found:', r6.test(code));

  // Check 7: globalMonthlyDiffGrid inside map
  const r7 = /(const v24 = monthlyPrev2Total\[mIdx\][\s\S]*?)(return `[\s\S]*?<div class="p-2 rounded-xl bg-\[#F8FAFB\] border border-\[#DFEAF0\][\s\S]*?<\/div>[\s\S]*?`;)([\s\S]*?\}\)\.join\(""\);)/;
  console.log('r7 found:', r7.test(code));

  // Check 8: chartTrafficPassing Mode 1 dataset 2
  const r8 = /(label: `\${yEst} \${estTag} \(t\) \[veh\/h\]`,[\s\S]*?data:\s*)monthlyHourlyCur(,)/;
  console.log('r8 found:', r8.test(code));

  // Check 9: chartTrafficPassing Mode 1 tooltips
  const r9 = /(this\.chartTrafficPassing\.options\.plugins\.tooltip\.callbacks\.label = \(ctx\) => `\${ctx\.dataset\.label}: \${ctx\.raw\.toLocaleString\("es-ES"\)} veh\/h`;[\s\S]*?this\.chartTrafficPassing\.update\(\);)/;
  console.log('r9 found:', r9.test(code));

  // Check 10: chartTrafficPassing Mode 1 map inside chart1DiffGridEl
  const r10 = /(const v24 = monthlyHourlyPrev2\[mIdx\][\s\S]*?)(return `[\s\S]*?<div class="p-2 rounded-xl bg-\[#F8FAFB\] border border-\[#DFEAF0\][\s\S]*?<\/div>[\s\S]*?`;)([\s\S]*?\}\)\.join\(""\);[\s\S]*?this\.renderChart1FormulaCard\(p\);)/;
  console.log('r10 found:', r10.test(code));

  // Check 11: chartTrafficPassing Mode 2 dataset 2
  const r11 = /(label: `\${yEst} \${estTag} \(t\) \[\${unitLabelShort}\]`,[\s\S]*?data:\s*)monthlyCur(,)/;
  console.log('r11 found:', r11.test(code));

  // Check 12: chartTrafficPassing Mode 2 tooltips
  const r12 = /(this\.chartTrafficPassing\.options\.plugins\.tooltip\.callbacks\.label = \(ctx\) => `\${ctx\.dataset\.label}: \${ctx\.raw\.toLocaleString\("es-ES"\)} \${unitLabelShort}`;[\s\S]*?this\.chartTrafficPassing\.update\(\);)/;
  console.log('r12 found:', r12.test(code));

  // Check 13: chartTrafficPassing Mode 2 map inside chart1DiffGridEl
  const r13 = /(const v24 = monthlyPrev2\[mIdx\][\s\S]*?)(return `[\s\S]*?<div class="p-2 rounded-xl bg-\[#F8FAFB\] border border-\[#DFEAF0\][\s\S]*?<\/div>[\s\S]*?`;)([\s\S]*?\}\)\.join\(""\);[\s\S]*?this\.renderChart1FormulaCard\(p\);)/;
  console.log('r13 found:', r13.test(code));
}

testSurgical('web/js/app.js');

