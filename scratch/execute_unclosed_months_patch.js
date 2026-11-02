const fs = require('fs');

function patchFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // R1: fetchRealTrafficFromOpenDataBCN curMonthlyImd
  const r1 = /(curMonthlyImd\s*=\s*prevMonthlyImd\.map\(\(val25,\s*m\)\s*=>\s*\{)([\s\S]*?)(const val24 = prev2MonthlyImd\[m\])/;
  code = code.replace(r1, `$1
              // Regla real-data-only: Si el mes no está cerrado (en curso o futuro), no se proyecta total mensual
              const nowCheck = new Date();
              const curYearCheck = nowCheck.getFullYear();
              const curMonthIdxCheck = nowCheck.getMonth();
              const yEstCheck = (typeof ACTIVE_DATA_YEARS !== 'undefined') ? ACTIVE_DATA_YEARS.estYear : 2026;
              if (yEstCheck === curYearCheck && m >= curMonthIdxCheck) {
                return 0;
              }
              $3`);

  // R2: curMonthlyByDayType
  const r2 = /(curMonthlyByDayType\[dt\]\s*=\s*arr25\.map\(\(v25,\s*m\)\s*=>\s*\{)([\s\S]*?)(const v24 = arr24\[m\])/;
  code = code.replace(r2, `$1
                const nowCheck = new Date();
                const curYearCheck = nowCheck.getFullYear();
                const curMonthIdxCheck = nowCheck.getMonth();
                const yEstCheck = (typeof ACTIVE_DATA_YEARS !== 'undefined') ? ACTIVE_DATA_YEARS.estYear : 2026;
                if (yEstCheck === curYearCheck && m >= curMonthIdxCheck) {
                  return 0;
                }
                $3`);

  // R3: annual totals on closed months
  const r3 = /(const annualPrev2 = prev2MonthlyImd\.reduce[\s\S]*?const yoy24to25Pct = annualPrev2 > 0 \? \+\(\(\(annualPrev - annualPrev2\) \/ annualPrev2\) \* 100\)\.toFixed\(1\) : 0;)/;
  code = code.replace(r3, `const nowAnnCheck = new Date();
          const curYearAnnCheck = nowAnnCheck.getFullYear();
          const curMonthIdxAnnCheck = nowAnnCheck.getMonth();
          const yEstAnnCheck = (typeof ACTIVE_DATA_YEARS !== 'undefined') ? ACTIVE_DATA_YEARS.estYear : 2026;
          const closedMonths = (yEstAnnCheck === curYearAnnCheck) ? curMonthIdxAnnCheck : 12;

          // Comparativa rigurosa y auditable: solo meses naturales cerrados (Enero a Octubre)
          const annualPrev2 = prev2MonthlyImd.slice(0, closedMonths).reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
          const annualPrev = prevMonthlyImd.slice(0, closedMonths).reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
          const annualCur = curMonthlyImd.slice(0, closedMonths).reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
          const yoyPct = annualPrev > 0 ? +(((annualCur - annualPrev) / annualPrev) * 100).toFixed(1) : 0;
          const yoy24to25Pct = annualPrev2 > 0 ? +(((annualPrev - annualPrev2) / annualPrev2) * 100).toFixed(1) : 0;`);

  // R4: calculatePortfolioSensorsTrafficMonthly - define scope variables at method level
  const r4_top = /(calculatePortfolioSensorsTrafficMonthly\(\)\s*\{[\s\S]*?const DAYS_IN_MONTH = \[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31\];)/;
  code = code.replace(r4_top, `$1
    const nowCheck = new Date();
    const curYearCheck = nowCheck.getFullYear();
    const curMonthIdxCheck = nowCheck.getMonth();
    const yEstCheck = (typeof ACTIVE_DATA_YEARS !== 'undefined') ? ACTIVE_DATA_YEARS.estYear : 2026;`);

  // Inside curMonthly
  const r4_cur = /(const curMonthly = MONTHS_LABELS\.map\(\(_, mIdx\) => \{)([\s\S]*?)(const days = DAYS_IN_MONTH\[mIdx\])/;
  code = code.replace(r4_cur, `$1
      if (yEstCheck === curYearCheck && mIdx >= curMonthIdxCheck) {
        return 0; // Regla real-data-only: Sin mes completo no se puede estimar volumen
      }
      $3`);

  // In calculatePortfolioSensorsTrafficMonthly return
  const r4_ret = /return\s*\{\s*curMonthly,\s*prevMonthly,\s*prev2Monthly\s*\};/;
  code = code.replace(r4_ret, `const curChartMonthly = curMonthly.map((v, idx) => (yEstCheck === curYearCheck && idx >= curMonthIdxCheck) ? null : v);
    return { curMonthly, prevMonthly, prev2Monthly, curChartMonthly };`);

  // Lines 432 and 3861 updates
  code = code.replace(
    /if \(this\.chartGlobalMonthlyDL\.data\.datasets\[2\]\) this\.chartGlobalMonthlyDL\.data\.datasets\[2\]\.data = curMonthly;/g,
    `if (this.chartGlobalMonthlyDL.data.datasets[2]) this.chartGlobalMonthlyDL.data.datasets[2].data = curChartMonthly || curMonthly.map((v, idx) => ((typeof ACTIVE_DATA_YEARS !== 'undefined' ? ACTIVE_DATA_YEARS.estYear : 2026) === (new Date()).getFullYear() && idx >= (new Date()).getMonth()) ? null : v);`
  );

  // R5_top: Top of updateGlobalKPIs scope
  const r5_top = /(updateGlobalKPIs\(\)\s*\{[\s\S]*?const count = this\.parkings\.length;)/;
  code = code.replace(r5_top, `$1
    const nowKpi = new Date();
    const curYearKpi = nowKpi.getFullYear();
    const curMonthIdxKpi = nowKpi.getMonth();`);

  // R5: updateGlobalKPIs maxVal and yoyBadge
  const r5 = /(const maxVal = Math\.max\(\.\.\.monthlyCurTotal\);[\s\S]*?yoyBadgeEl\.innerHTML = `[\s\S]*?`;[\s\S]*?\})([\s\S]*?if \(!this\.chartGlobalMonthlyDL\))/;
  code = code.replace(r5, `const closedMonthsKpi = (yEst === curYearKpi) ? curMonthIdxKpi : 12;

      const validCurValues = monthlyCurTotal.slice(0, closedMonthsKpi);
      const maxVal = validCurValues.length > 0 ? Math.max(...validCurValues) : 0;
      const maxIdx = monthlyCurTotal.indexOf(maxVal);
      if (peakBadgeEl) {
        if (maxVal > 0 && maxIdx >= 0) {
          peakBadgeEl.innerText = \`Pico Máximo Sensores: \${MONTHS_LABELS[maxIdx]} (\${maxVal.toLocaleString("es-ES")} veh/mes)\`;
        } else {
          peakBadgeEl.innerText = "Sin datos cerrados";
        }
      }
      const totalCurClosed = monthlyCurTotal.slice(0, closedMonthsKpi).reduce((a, b) => a + b, 0);
      const totalPrevClosed = monthlyPrevTotal.slice(0, closedMonthsKpi).reduce((a, b) => a + b, 0);
      const diffPct = totalPrevClosed > 0 ? (((totalCurClosed - totalPrevClosed) / totalPrevClosed) * 100).toFixed(1) : "0.0";
      if (yoyBadgeEl) {
        const periodTag = closedMonthsKpi < 12 ? \` (Ene–\${MONTHS_LABELS[closedMonthsKpi - 1]})\` : '';
        yoyBadgeEl.innerHTML = \`<span class="w-2 h-2 rounded-full \${diffPct >= 0 ? 'bg-[#10B981]' : 'bg-rose-500'}"></span> \${diffPct >= 0 ? '+' : ''}\${diffPct}% Crecimiento Red Sensores (\${yPrev}→\${yEst}\${periodTag})\`;
      }
    $2`);

  // R14: In init chartGlobalMonthlyDL line dataset
  const r14 = /(label: `Suma Sensores \${yEst} \${estTag} \(t\)`,[\s\S]*?data:\s*)monthlyCurTotal(,)/;
  code = code.replace(r14, `$1monthlyCurTotal.map((v, idx) => (yEst === (new Date()).getFullYear() && idx >= (new Date()).getMonth()) ? null : v)$2`);

  // R6: updateGlobalKPIs chartGlobalMonthlyDL dataset 2 mapping
  const r6 = /(label: `Suma Sensores Cartera \${yEst} \${estTag} \(t\)`,[\s\S]*?data:\s*)monthlyCurTotal(,[\s\S]*?borderColor: '#164250')/;
  code = code.replace(r6, `$1monthlyCurTotal.map((v, idx) => (yEst === curYearKpi && idx >= curMonthIdxKpi) ? null : v)$2`);

  // Tooltip label callback in chartGlobalMonthlyDL
  const r_tip1 = /callbacks:\s*\{\s*label:\s*\(ctx\)\s*=>\s*`\${ctx\.dataset\.label}:\s*\${ctx\.raw\.toLocaleString\("es-ES"\)}\s*veh\/mes`\s*\}/;
  code = code.replace(r_tip1, `callbacks: {
                  label: (ctx) => {
                    if (ctx.raw == null) {
                      const nowTip = new Date();
                      const isCur = ctx.dataIndex === nowTip.getMonth();
                      return \`\${ctx.dataset.label}: \${isCur ? 'En curso (Incompleto)' : 'Sin datos (Futuro)'}\`;
                    }
                    return \`\${ctx.dataset.label}: \${ctx.raw.toLocaleString("es-ES")} veh/mes\`;
                  }
                }`);

  // R7: globalMonthlyDiffGrid mapping body
  const r7 = /(const v24 = monthlyPrev2Total\[mIdx\][\s\S]*?)(return `[\s\S]*?<div class="p-2 rounded-xl bg-\[#F8FAFB\] border border-\[#DFEAF0\][\s\S]*?<\/div>[\s\S]*?`;)([\s\S]*?\}\)\.join\(""\);)/;
  code = code.replace(r7, `const nowGrid = new Date();
          const curYearGrid = nowGrid.getFullYear();
          const curMonthIdxGrid = nowGrid.getMonth();
          const isCurrentMonth = (yEst === curYearGrid && mIdx === curMonthIdxGrid);
          const isFutureMonth = (yEst === curYearGrid && mIdx > curMonthIdxGrid);
          const isUnclosed = isCurrentMonth || isFutureMonth;

          const v24 = monthlyPrev2Total[mIdx] || 0;
          const v25 = monthlyPrevTotal[mIdx] || 0;
          const v26 = isUnclosed ? 0 : (monthlyCurTotal[mIdx] || 0);
          const diffUnits = v26 - v25;
          const pct = v25 > 0 ? ((diffUnits / v25) * 100).toFixed(1) : "0.0";
          const isUp = diffUnits >= 0;
          const sign = isUp ? "+" : "";

          let badgeHtml = '';
          let v26Display = '';

          if (isCurrentMonth) {
            v26Display = \`<span class="text-amber-600 font-bold" title="Mes en curso (1-2 días transcurridos)">En curso</span>\`;
            badgeHtml = \`<span class="inline-flex items-center justify-center text-[8.5px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200" title="Mes incompleto: no se proyecta total">En curso</span>\`;
          } else if (isFutureMonth) {
            v26Display = \`<span class="text-slate-400 font-semibold" title="Mes futuro">0</span>\`;
            badgeHtml = \`<span class="inline-flex items-center justify-center text-[8.5px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200" title="Sin datos: mes futuro">Futuro</span>\`;
          } else {
            v26Display = \`<strong class="text-[#164250]">\${v26.toLocaleString("es-ES")}</strong>\`;
            badgeHtml = \`<span class="inline-flex items-center justify-center text-[9px] font-extrabold px-1.5 py-0.5 rounded-md \${
              isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }">
              \${isUp ? '▲' : '▼'} \${sign}\${pct}%
            </span>\`;
          }

          return \`
            <div class="p-2 rounded-xl bg-[#F8FAFB] border border-[#DFEAF0] flex flex-col justify-between text-center hover:border-[#0284C7] hover:bg-white hover:shadow-xs transition-all">
              <span class="text-[10px] font-bold text-slate-600 block mb-1 font-mono">\${mLabel}</span>
              <div class="text-[8.5px] text-slate-400 font-mono space-y-0.5 mb-1 leading-tight text-left">
                <div class="flex justify-between"><span>\${yPrev2}:</span><strong class="text-slate-600">\${v24.toLocaleString("es-ES")}</strong></div>
                <div class="flex justify-between"><span>\${yPrev}:</span><strong class="text-emerald-700">\${v25.toLocaleString("es-ES")}</strong></div>
                <div class="flex justify-between"><span>\${yEst}:</span>\${v26Display}</div>
              </div>
              \${badgeHtml}
            </div>
          \`;$3`);

  // R8: Mode 1 dataset 2
  const r8 = /(label: `\${yEst} \${estTag} \(t\) \[veh\/h\]`,[\s\S]*?data:\s*)monthlyHourlyCur(,)/;
  code = code.replace(r8, `$1monthlyHourlyCur.map((v, idx) => (yEst === (new Date()).getFullYear() && idx >= (new Date()).getMonth()) ? null : v)$2`);

  // R9: Mode 1 tooltips (Note: includes the closing brace for if (this.chartTrafficPassing))
  const r9 = /(this\.chartTrafficPassing\.options\.plugins\.tooltip\.callbacks\.label = \(ctx\) => `\${ctx\.dataset\.label}: \${ctx\.raw\.toLocaleString\("es-ES"\)} veh\/h`;[\s\S]*?this\.chartTrafficPassing\.update\(\);[\s\S]*?\})/;
  code = code.replace(r9, `const nowHourC = new Date();
          const curYearHourC = nowHourC.getFullYear();
          const curMonthIdxHourC = nowHourC.getMonth();
          this.chartTrafficPassing.options.plugins.tooltip.callbacks.label = (ctx) => {
            if (ctx.raw == null) {
              const isCur = ctx.dataIndex === curMonthIdxHourC;
              return \`\${ctx.dataset.label}: \${isCur ? 'En curso (Incompleto)' : 'Sin datos (Futuro)'}\`;
            }
            return \`\${ctx.dataset.label}: \${ctx.raw.toLocaleString("es-ES")} veh/h\`;
          };
          this.chartTrafficPassing.options.plugins.tooltip.callbacks.afterBody = (items) => {
            if (!items || items.length === 0) return [];
            const idx = items[0].dataIndex;
            const isUnclosed = (yEst === curYearHourC && idx >= curMonthIdxHourC);
            const p2Val = monthlyHourlyPrev2[idx] || 0;
            const pVal = monthlyHourlyPrev[idx] || 0;
            const cVal = isUnclosed ? null : (monthlyHourlyCur[idx] || 0);
            const diffReal = pVal - p2Val;
            const pctReal = p2Val > 0 ? ((diffReal / p2Val) * 100).toFixed(1) : '0.0';
            if (isUnclosed) {
              const note = (idx === curMonthIdxHourC) ? 'Mes en curso (Incompleto)' : 'Mes futuro (Sin datos)';
              return [
                ' ',
                \`-----------------------------------------\`,
                \`Var. Real (\${yPrev2}→\${yPrev}): \${diffReal >= 0 ? '+' : ''}\${diffReal.toLocaleString("es-ES")} veh/h (\${diffReal >= 0 ? '+' : ''}\${pctReal}%)\`,
                \`Var. Proyectada (\${yPrev}→\${yEst}): — (\${note})\`
              ];
            }
            const diffVsPrev = cVal - pVal;
            const pctVsPrev = pVal > 0 ? ((diffVsPrev / pVal) * 100).toFixed(1) : '0.0';
            return [
              ' ',
              \`-----------------------------------------\`,
              \`Var. Real (\${yPrev2}→\${yPrev}): \${diffReal >= 0 ? '+' : ''}\${diffReal.toLocaleString("es-ES")} veh/h (\${diffReal >= 0 ? '+' : ''}\${pctReal}%)\`,
              \`Var. Proyectada (\${yPrev}→\${yEst}): \${diffVsPrev >= 0 ? '+' : ''}\${diffVsPrev.toLocaleString("es-ES")} veh/h (\${diffVsPrev >= 0 ? '+' : ''}\${pctVsPrev}%)\`
            ];
          };
        }
        this.chartTrafficPassing.update();
      }`);

  // R10: Mode 1 mapping body inside chart1DiffGridEl
  const r10 = /(const v24 = monthlyHourlyPrev2\[mIdx\][\s\S]*?)(return `[\s\S]*?<div class="p-2 rounded-xl bg-\[#F8FAFB\] border border-\[#DFEAF0\][\s\S]*?<\/div>[\s\S]*?`;)([\s\S]*?\}\)\.join\(""\);[\s\S]*?this\.renderChart1FormulaCard\(p\);)/;
  code = code.replace(r10, `const nowHourGrid = new Date();
          const curYearHourGrid = nowHourGrid.getFullYear();
          const curMonthIdxHourGrid = nowHourGrid.getMonth();
          const isCurrentMonth = (yEst === curYearHourGrid && mIdx === curMonthIdxHourGrid);
          const isFutureMonth = (yEst === curYearHourGrid && mIdx > curMonthIdxHourGrid);
          const isUnclosed = isCurrentMonth || isFutureMonth;

          const v24 = monthlyHourlyPrev2[mIdx] || 0;
          const v25 = monthlyHourlyPrev[mIdx] || 0;
          const v26 = isUnclosed ? 0 : (monthlyHourlyCur[mIdx] || 0);
          const diffUnits = v26 - v25;
          const pct = v25 > 0 ? ((diffUnits / v25) * 100).toFixed(1) : "0.0";
          const isUp = diffUnits >= 0;
          const sign = isUp ? "+" : "";

          let badgeHtml = '';
          let v26Display = '';

          if (isCurrentMonth) {
            v26Display = \`<span class="text-amber-600 font-bold" title="Mes en curso">En curso</span>\`;
            badgeHtml = \`<span class="inline-flex items-center justify-center text-[8.5px] font-bold px-1 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">En curso</span>\`;
          } else if (isFutureMonth) {
            v26Display = \`<span class="text-slate-400 font-semibold" title="Mes futuro">0</span>\`;
            badgeHtml = \`<span class="inline-flex items-center justify-center text-[8.5px] font-bold px-1 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">Futuro</span>\`;
          } else {
            v26Display = \`<strong class="text-[#164250]">\${v26}</strong>\`;
            badgeHtml = \`<span class="inline-flex items-center justify-center text-[9px] font-extrabold px-1.5 py-0.5 rounded-md \${
              isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }">
              \${isUp ? '▲' : '▼'} \${sign}\${pct}%
            </span>\`;
          }

          return \`
            <div class="p-2 rounded-xl bg-[#F8FAFB] border border-[#DFEAF0] flex flex-col justify-between text-center hover:border-[#0284C7] hover:bg-white hover:shadow-xs transition-all relative">
              <span class="text-[10px] font-bold text-slate-600 block mb-1 font-mono">\${mLabel}</span>
              <div class="text-[8.5px] text-slate-400 font-mono space-y-0.5 mb-1 leading-tight text-left">
                <div class="flex justify-between"><span>\${yPrev2}:</span><strong class="text-slate-600">\${v24}</strong></div>
                <div class="flex justify-between"><span>\${yPrev}:</span><strong class="text-emerald-700">\${v25}</strong></div>
                <div class="flex justify-between"><span>\${yEst}:</span>\${v26Display}</div>
              </div>
              \${badgeHtml}
            </div>
          \`;$3`);

  // R11: Mode 2 dataset 2
  const r11 = /(label: `\${yEst} \${estTag} \(t\) \[\${unitLabelShort}\]`,[\s\S]*?data:\s*)monthlyCur(,)/;
  code = code.replace(r11, `$1monthlyCur.map((v, idx) => (yEst === (new Date()).getFullYear() && idx >= (new Date()).getMonth()) ? null : v)$2`);

  // R12: Mode 2 tooltips (Note: includes the closing brace for if (this.chartTrafficPassing))
  const r12 = /(this\.chartTrafficPassing\.options\.plugins\.tooltip\.callbacks\.label = \(ctx\) => `\${ctx\.dataset\.label}: \${ctx\.raw\.toLocaleString\("es-ES"\)} \${unitLabelShort}`;[\s\S]*?this\.chartTrafficPassing\.update\(\);[\s\S]*?\})/;
  code = code.replace(r12, `const nowDayMC = new Date();
        const curYearDayMC = nowDayMC.getFullYear();
        const curMonthIdxDayMC = nowDayMC.getMonth();
        this.chartTrafficPassing.options.plugins.tooltip.callbacks.label = (ctx) => {
          if (ctx.raw == null) {
            const isCur = ctx.dataIndex === curMonthIdxDayMC;
            return \`\${ctx.dataset.label}: \${isCur ? 'En curso (Incompleto)' : 'Sin datos (Futuro)'}\`;
          }
          return \`\${ctx.dataset.label}: \${ctx.raw.toLocaleString("es-ES")} \${unitLabelShort}\`;
        };
        this.chartTrafficPassing.options.plugins.tooltip.callbacks.afterBody = (items) => {
          if (!items || items.length === 0) return [];
          const idx = items[0].dataIndex;
          const isUnclosed = (yEst === curYearDayMC && idx >= curMonthIdxDayMC);
          const p2Val = monthlyPrev2[idx] || 0;
          const pVal = monthlyPrev[idx] || 0;
          const cVal = isUnclosed ? null : (monthlyCur[idx] || 0);
          const diffReal = pVal - p2Val;
          const pctReal = p2Val > 0 ? ((diffReal / p2Val) * 100).toFixed(1) : '0.0';
          if (isUnclosed) {
            const note = (idx === curMonthIdxDayMC) ? 'Mes en curso (Incompleto)' : 'Mes futuro (Sin datos)';
            return [
              ' ',
              \`-----------------------------------------\`,
              \`Var. Real (\${yPrev2}→\${yPrev}): \${diffReal >= 0 ? '+' : ''}\${diffReal.toLocaleString("es-ES")} \${unitLabelShort} (\${diffReal >= 0 ? '+' : ''}\${pctReal}%)\`,
              \`Var. Proyectada (\${yPrev}→\${yEst}): — (\${note})\`
            ];
          }
          const diffVsPrev = cVal - pVal;
          const pctVsPrev = pVal > 0 ? ((diffVsPrev / pVal) * 100).toFixed(1) : '0.0';
          return [
            ' ',
            \`-----------------------------------------\`,
            \`Var. Real (\${yPrev2}→\${yPrev}): \${diffReal >= 0 ? '+' : ''}\${diffReal.toLocaleString("es-ES")} \${unitLabelShort} (\${diffReal >= 0 ? '+' : ''}\${pctReal}%)\`,
            \`Var. Proyectada (\${yPrev}→\${yEst}): \${diffVsPrev >= 0 ? '+' : ''}\${diffVsPrev.toLocaleString("es-ES")} \${unitLabelShort} (\${diffVsPrev >= 0 ? '+' : ''}\${pctVsPrev}%)\`
          ];
        };
      }
      this.chartTrafficPassing.update();
    }`);

  // R13: Mode 2 mapping body inside chart1DiffGridEl
  const r13 = /(const v24 = monthlyPrev2\[mIdx\][\s\S]*?)(return `[\s\S]*?<div class="p-2 rounded-xl bg-\[#F8FAFB\] border border-\[#DFEAF0\][\s\S]*?<\/div>[\s\S]*?`;)([\s\S]*?\}\)\.join\(""\);[\s\S]*?this\.renderChart1FormulaCard\(p\);)/;
  code = code.replace(r13, `const nowDayMGrid = new Date();
          const curYearDayMGrid = nowDayMGrid.getFullYear();
          const curMonthIdxDayMGrid = nowDayMGrid.getMonth();
          const isCurrentMonth = (yEst === curYearDayMGrid && mIdx === curMonthIdxDayMGrid);
          const isFutureMonth = (yEst === curYearDayMGrid && mIdx > curMonthIdxDayMGrid);
          const isUnclosed = isCurrentMonth || isFutureMonth;

          const v24 = monthlyPrev2[mIdx] || 0;
          const v25 = monthlyPrev[mIdx] || 0;
          const v26 = isUnclosed ? 0 : (monthlyCur[mIdx] || 0);
          const diffUnits = v26 - v25;
          const pct = v25 > 0 ? ((diffUnits / v25) * 100).toFixed(1) : "0.0";
          const isUp = diffUnits >= 0;
          const sign = isUp ? "+" : "";

          let badgeHtml = '';
          let v26Display = '';

          if (isCurrentMonth) {
            v26Display = \`<span class="text-amber-600 font-bold" title="Mes en curso (1-2 días transcurridos)">En curso</span>\`;
            badgeHtml = \`<span class="inline-flex items-center justify-center text-[8.5px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200" title="Mes incompleto: no se proyecta total">En curso</span>\`;
          } else if (isFutureMonth) {
            v26Display = \`<span class="text-slate-400 font-semibold" title="Mes futuro">0</span>\`;
            badgeHtml = \`<span class="inline-flex items-center justify-center text-[8.5px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200" title="Sin datos: mes futuro">Futuro</span>\`;
          } else {
            v26Display = \`<strong class="text-[#164250]">\${v26.toLocaleString("es-ES")}</strong>\`;
            badgeHtml = \`<span class="inline-flex items-center justify-center text-[9px] font-extrabold px-1.5 py-0.5 rounded-md \${
              isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }">
              \${isUp ? '▲' : '▼'} \${sign}\${pct}%
            </span>\`;
          }

          return \`
            <div class="p-2 rounded-xl bg-[#F8FAFB] border border-[#DFEAF0] flex flex-col justify-between text-center hover:border-[#0284C7] hover:bg-white hover:shadow-xs transition-all">
              <span class="text-[10px] font-bold text-slate-600 block mb-1 font-mono">\${mLabel}</span>
              <div class="text-[8.5px] text-slate-400 font-mono space-y-0.5 mb-1 leading-tight text-left">
                <div class="flex justify-between"><span>\${yPrev2}:</span><strong class="text-slate-600">\${v24.toLocaleString("es-ES")}</strong></div>
                <div class="flex justify-between"><span>\${yPrev}:</span><strong class="text-emerald-700">\${v25.toLocaleString("es-ES")}</strong></div>
                <div class="flex justify-between"><span>\${yEst}:</span>\${v26Display}</div>
              </div>
              \${badgeHtml}
            </div>
          \`;$3`);

  // Formula Card transparency note
  const r15 = /(<div class="flex items-center gap-1\.5 text-\[10px\] text-amber-800 pt-1">[\s\S]*?<i data-lucide="info" class="w-3\.5 h-3\.5 text-amber-600 shrink-0"><\/i>[\s\S]*?<span><strong>Garantía de Adaptabilidad Futura:<\/strong>)/;
  code = code.replace(r15, `<div class="flex items-center gap-1.5 text-[10px] text-emerald-800 pt-1">
        <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
        <span><strong>Veracidad de Datos (Regla real-data-only):</strong> Al estar el mes actual (\${MONTHS_LABELS[(new Date()).getMonth()]}) en curso sin cerrar y los posteriores sin transcurrir, no se generan estimaciones mensuales de volumen para meses no completados (quedando en 0 / En curso / Futuro). El crecimiento interanual auditado se calcula de forma rigurosa y homogénea sobre los meses completos cerrados (Enero a \${MONTHS_LABELS[(new Date()).getMonth() - 1]}).</span>
      </div>
      $1`);

  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully patched ' + filePath);
}

try {
  patchFile('web/js/app.js');
  patchFile('usb_portable/web/js/app.js');
  console.log('ALL FILES PATCHED SUCCESSFULLY!');
} catch (e) {
  console.error('Error in patch:', e);
  process.exit(1);
}
