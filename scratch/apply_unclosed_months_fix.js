const fs = require('fs');

function applyFixToFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. In fetchRealTrafficFromOpenDataBCN: curMonthlyImd and curMonthlyByDayType
  // Search for the curMonthlyImd definition
  const searchBlock1 = `            curMonthlyImd = prevMonthlyImd.map((val25, m) => {
              const val24 = prev2MonthlyImd[m] || 0;
              let growth24to25 = 0;
              if (val24 > 0 && val25 > 0) {
                growth24to25 = (val25 - val24) / val24;
                // Acotación prudencial de variación estructural a +/- 15% para estabilidad
                growth24to25 = Math.max(-0.15, Math.min(0.15, growth24to25));
              }
              const fluencyFactor = FLUENCY_FACTORS_BY_MONTH[m] || 1.02;
              const estVal = Math.round(val25 * (1 + (growth24to25 * 0.75)) * fluencyFactor);
              return Math.max(0, estVal);
            });`;

  const replaceBlock1 = `            const nowFix = new Date();
            const currentYearFix = nowFix.getFullYear();
            const currentMonthIdxFix = nowFix.getMonth();
            const yEstNumFix = (typeof ACTIVE_DATA_YEARS !== 'undefined') ? ACTIVE_DATA_YEARS.estYear : 2026;

            curMonthlyImd = prevMonthlyImd.map((val25, m) => {
              // Regla real-data-only: No estimar meses incompletos (en curso) ni futuros
              if (yEstNumFix === currentYearFix && m >= currentMonthIdxFix) {
                return 0;
              }
              const val24 = prev2MonthlyImd[m] || 0;
              let growth24to25 = 0;
              if (val24 > 0 && val25 > 0) {
                growth24to25 = (val25 - val24) / val24;
                // Acotación prudencial de variación estructural a +/- 15% para estabilidad
                growth24to25 = Math.max(-0.15, Math.min(0.15, growth24to25));
              }
              const fluencyFactor = FLUENCY_FACTORS_BY_MONTH[m] || 1.02;
              const estVal = Math.round(val25 * (1 + (growth24to25 * 0.75)) * fluencyFactor);
              return Math.max(0, estVal);
            });`;

  if (!code.includes(searchBlock1)) {
    throw new Error('searchBlock1 not found in ' + filePath);
  }
  code = code.replace(searchBlock1, replaceBlock1);

  // In curMonthlyByDayType
  const searchBlock2 = `              curMonthlyByDayType[dt] = arr25.map((v25, m) => {
                const v24 = arr24[m] || 0;
                const g = (v24 > 0 && v25 > 0) ? Math.max(-0.15, Math.min(0.15, (v25 - v24) / v24)) : 0;
                const f = FLUENCY_FACTORS_BY_MONTH[m] || 1.02;
                return Math.max(0, Math.round(v25 * (1 + (g * 0.75)) * f));
              });`;

  const replaceBlock2 = `              curMonthlyByDayType[dt] = arr25.map((v25, m) => {
                if (yEstNumFix === currentYearFix && m >= currentMonthIdxFix) {
                  return 0;
                }
                const v24 = arr24[m] || 0;
                const g = (v24 > 0 && v25 > 0) ? Math.max(-0.15, Math.min(0.15, (v25 - v24) / v24)) : 0;
                const f = FLUENCY_FACTORS_BY_MONTH[m] || 1.02;
                return Math.max(0, Math.round(v25 * (1 + (g * 0.75)) * f));
              });`;

  if (!code.includes(searchBlock2)) {
    throw new Error('searchBlock2 not found in ' + filePath);
  }
  code = code.replace(searchBlock2, replaceBlock2);

  // In annual sum and yoy calculation in fetchRealTrafficFromOpenDataBCN
  const searchBlock3 = `          const annualPrev2 = prev2MonthlyImd.reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
          const annualPrev = prevMonthlyImd.reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
          const annualCur = curMonthlyImd.reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
          const yoyPct = annualPrev > 0 ? +(((annualCur - annualPrev) / annualPrev) * 100).toFixed(1) : 0;
          const yoy24to25Pct = annualPrev2 > 0 ? +(((annualPrev - annualPrev2) / annualPrev2) * 100).toFixed(1) : 0;`;

  const replaceBlock3 = `          const closedMonthsCount = (yEstNumFix === currentYearFix) ? currentMonthIdxFix : 12;
          const annualPrev2 = prev2MonthlyImd.slice(0, closedMonthsCount).reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
          const annualPrev = prevMonthlyImd.slice(0, closedMonthsCount).reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
          const annualCur = curMonthlyImd.slice(0, closedMonthsCount).reduce((acc, imd, m) => acc + Math.round(imd * DAYS_IN_MONTH[m]), 0);
          const yoyPct = annualPrev > 0 ? +(((annualCur - annualPrev) / annualPrev) * 100).toFixed(1) : 0;
          const yoy24to25Pct = annualPrev2 > 0 ? +(((annualPrev - annualPrev2) / annualPrev2) * 100).toFixed(1) : 0;`;

  if (!code.includes(searchBlock3)) {
    throw new Error('searchBlock3 not found in ' + filePath);
  }
  code = code.replace(searchBlock3, replaceBlock3);

  // 2. In calculatePortfolioSensorsTrafficMonthly
  const searchBlock4 = `    const curMonthly = MONTHS_LABELS.map((_, mIdx) => {
      const days = DAYS_IN_MONTH[mIdx] || 30;
      return this.parkings.reduce((sum, p) => {
        const pTrafficSum = (p.trafficPoints || []).reduce((tpSum, tp) => {
          const imdVal = tp.monthlyCurrentYear?.[mIdx] || 0;
          return tpSum + Math.round(imdVal * days);
        }, 0);
        return sum + pTrafficSum;
      }, 0);
    });`;

  const replaceBlock4 = `    const nowCalc = new Date();
    const curYearCalc = nowCalc.getFullYear();
    const curMonthIdxCalc = nowCalc.getMonth();
    const yEstCalc = (typeof ACTIVE_DATA_YEARS !== 'undefined') ? ACTIVE_DATA_YEARS.estYear : 2026;

    const curMonthly = MONTHS_LABELS.map((_, mIdx) => {
      if (yEstCalc === curYearCalc && mIdx >= curMonthIdxCalc) {
        return 0;
      }
      const days = DAYS_IN_MONTH[mIdx] || 30;
      return this.parkings.reduce((sum, p) => {
        const pTrafficSum = (p.trafficPoints || []).reduce((tpSum, tp) => {
          const imdVal = tp.monthlyCurrentYear?.[mIdx] || 0;
          return tpSum + Math.round(imdVal * days);
        }, 0);
        return sum + pTrafficSum;
      }, 0);
    });`;

  if (!code.includes(searchBlock4)) {
    throw new Error('searchBlock4 not found in ' + filePath);
  }
  code = code.replace(searchBlock4, replaceBlock4);

  // 3. In updateGlobalKPIs: peakBadge and yoyBadge
  const searchBlock5 = `      const maxVal = Math.max(...monthlyCurTotal);
      const maxIdx = monthlyCurTotal.indexOf(maxVal);
      if (peakBadgeEl) {
        peakBadgeEl.innerText = \`\${MONTHS_LABELS[maxIdx]} (\${maxVal.toLocaleString("es-ES")} veh/mes)\`;
      }
      const totalCur = monthlyCurTotal.reduce((a, b) => a + b, 0);
      const totalPrev = monthlyPrevTotal.reduce((a, b) => a + b, 0);
      const diffPct = totalPrev > 0 ? (((totalCur - totalPrev) / totalPrev) * 100).toFixed(1) : "0.0";
      if (yoyBadgeEl) {
        yoyBadgeEl.innerHTML = \`<span class="w-2 h-2 rounded-full \${diffPct >= 0 ? 'bg-[#10B981]' : 'bg-rose-500'}"></span> \${diffPct >= 0 ? '+' : ''}\${diffPct}% Crecimiento Red Sensores (\${yPrev}→\${yEst})\`;
      }`;

  const replaceBlock5 = `      const nowKpi = new Date();
      const curYearKpi = nowKpi.getFullYear();
      const curMonthIdxKpi = nowKpi.getMonth();
      const closedMonthsKpi = (yEst === curYearKpi) ? curMonthIdxKpi : 12;

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
      }`;

  if (!code.includes(searchBlock5)) {
    throw new Error('searchBlock5 not found in ' + filePath);
  }
  code = code.replace(searchBlock5, replaceBlock5);

  // In updateGlobalKPIs: chartGlobalMonthlyDL dataset 2 mapping
  const searchBlock6 = `        {
          label: \`Suma Sensores Cartera \${yEst} \${estTag} (t)\`,
          data: monthlyCurTotal,
          borderColor: '#164250',`;

  const replaceBlock6 = `        {
          label: \`Suma Sensores Cartera \${yEst} \${estTag} (t)\`,
          data: monthlyCurTotal.map((v, idx) => (yEst === curYearKpi && idx >= curMonthIdxKpi) ? null : v),
          borderColor: '#164250',`;

  if (!code.includes(searchBlock6)) {
    throw new Error('searchBlock6 not found in ' + filePath);
  }
  code = code.replace(searchBlock6, replaceBlock6);

  // In updateGlobalKPIs: chartGlobalMonthlyDL tooltip label
  const searchBlock7 = `                callbacks: {
                  label: (ctx) => \`\${ctx.dataset.label}: \${ctx.raw.toLocaleString("es-ES")} veh/mes\`
                }`;

  const replaceBlock7 = `                callbacks: {
                  label: (ctx) => {
                    if (ctx.raw == null) {
                      const isCur = ctx.dataIndex === curMonthIdxKpi;
                      return \`\${ctx.dataset.label}: \${isCur ? 'En curso (Incompleto)' : 'Sin datos (Futuro)'}\`;
                    }
                    return \`\${ctx.dataset.label}: \${ctx.raw.toLocaleString("es-ES")} veh/mes\`;
                  }
                }`;

  if (!code.includes(searchBlock7)) {
    throw new Error('searchBlock7 not found in ' + filePath);
  }
  code = code.replace(searchBlock7, replaceBlock7);

  // In updateGlobalKPIs: globalMonthlyDiffGrid rendering
  const searchBlock8 = `        diffGridEl.innerHTML = MONTHS_LABELS.map((mLabel, mIdx) => {
          const v24 = monthlyPrev2Total[mIdx] || 0;
          const v25 = monthlyPrevTotal[mIdx] || 0;
          const v26 = monthlyCurTotal[mIdx] || 0;
          const diffUnits = v26 - v25;
          const pct = v25 > 0 ? ((diffUnits / v25) * 100).toFixed(1) : "0.0";
          const isUp = diffUnits >= 0;
          const sign = isUp ? "+" : "";
          return \`
            <div class="p-2 rounded-xl bg-[#F8FAFB] border border-[#DFEAF0] flex flex-col justify-between text-center hover:border-[#0284C7] hover:bg-white hover:shadow-xs transition-all">
              <span class="text-[10px] font-bold text-slate-600 block mb-1 font-mono">\${mLabel}</span>
              
              <div class="text-[8.5px] text-slate-400 font-mono space-y-0.5 mb-1 leading-tight text-left">
                <div class="flex justify-between"><span>\${yPrev2}:</span><strong class="text-slate-600">\${v24.toLocaleString("es-ES")}</strong></div>
                <div class="flex justify-between"><span>\${yPrev}:</span><strong class="text-emerald-700">\${v25.toLocaleString("es-ES")}</strong></div>
                <div class="flex justify-between"><span>\${yEst}:</span><strong class="text-[#164250]">\${v26.toLocaleString("es-ES")}</strong></div>
              </div>
              <span class="inline-flex items-center justify-center text-[9px] font-extrabold px-1.5 py-0.5 rounded-md \${
                isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }">
                \${isUp ? '▲' : '▼'} \${sign}\${pct}%
              </span>
            </div>
          \`;
        }).join("");`;

  const replaceBlock8 = `        diffGridEl.innerHTML = MONTHS_LABELS.map((mLabel, mIdx) => {
          const isCurrentMonth = (yEst === curYearKpi && mIdx === curMonthIdxKpi);
          const isFutureMonth = (yEst === curYearKpi && mIdx > curMonthIdxKpi);
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
          \`;
        }).join("");`;

  if (!code.includes(searchBlock8)) {
    throw new Error('searchBlock8 not found in ' + filePath);
  }
  code = code.replace(searchBlock8, replaceBlock8);

  // 4. In renderChart1
  // In mode 1 (hour) dataset 2
  const searchBlock9 = `          {
            label: \`\${yEst} \${estTag} (t) [veh/h]\`,
            data: monthlyHourlyCur,
            borderColor: '#164250',`;

  const replaceBlock9 = `          {
            label: \`\${yEst} \${estTag} (t) [veh/h]\`,
            data: monthlyHourlyCur.map((v, idx) => (yEst === (new Date()).getFullYear() && idx >= (new Date()).getMonth()) ? null : v),
            borderColor: '#164250',`;

  if (!code.includes(searchBlock9)) {
    throw new Error('searchBlock9 not found in ' + filePath);
  }
  code = code.replace(searchBlock9, replaceBlock9);

  // In mode 1 tooltips
  const searchBlock10 = `          this.chartTrafficPassing.options.plugins.tooltip.callbacks.label = (ctx) => \`\${ctx.dataset.label}: \${ctx.raw.toLocaleString("es-ES")} veh/h\`;
          this.chartTrafficPassing.options.plugins.tooltip.callbacks.afterBody = (items) => {
            if (!items || items.length === 0) return [];
            const idx = items[0].dataIndex;
            const p2Val = monthlyHourlyPrev2[idx] || 0;
            const pVal = monthlyHourlyPrev[idx] || 0;
            const cVal = monthlyHourlyCur[idx] || 0;
            const diffVsPrev = cVal - pVal;
            const pctVsPrev = pVal > 0 ? ((diffVsPrev / pVal) * 100).toFixed(1) : '0.0';
            const diffReal = pVal - p2Val;
            const pctReal = p2Val > 0 ? ((diffReal / p2Val) * 100).toFixed(1) : '0.0';
            return [
              ' ',
              \`-----------------------------------------\`,
              \`Var. Real (\${yPrev2}→\${yPrev}): \${diffReal >= 0 ? '+' : ''}\${diffReal.toLocaleString("es-ES")} veh/h (\${diffReal >= 0 ? '+' : ''}\${pctReal}%)\`,
              \`Var. Proyectada (\${yPrev}→\${yEst}): \${diffVsPrev >= 0 ? '+' : ''}\${diffVsPrev.toLocaleString("es-ES")} veh/h (\${diffVsPrev >= 0 ? '+' : ''}\${pctVsPrev}%)\`
            ];
          };`;

  const replaceBlock10 = `          const nowHourC = new Date();
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
          };`;

  if (!code.includes(searchBlock10)) {
    throw new Error('searchBlock10 not found in ' + filePath);
  }
  code = code.replace(searchBlock10, replaceBlock10);

  // In mode 1 grid
  const searchBlock11 = `      if (chart1DiffGridEl) {
        chart1DiffGridEl.innerHTML = MONTHS_LABELS.map((mLabel, mIdx) => {
          const v24 = monthlyHourlyPrev2[mIdx] || 0;
          const v25 = monthlyHourlyPrev[mIdx] || 0;
          const v26 = monthlyHourlyCur[mIdx] || 0;
          const diffUnits = v26 - v25;
          const pct = v25 > 0 ? ((diffUnits / v25) * 100).toFixed(1) : "0.0";
          const isUp = diffUnits >= 0;
          const sign = isUp ? "+" : "";
          return \`
            <div class="p-2 rounded-xl bg-[#F8FAFB] border border-[#DFEAF0] flex flex-col justify-between text-center hover:border-[#0284C7] hover:bg-white hover:shadow-xs transition-all relative">
              <span class="text-[10px] font-bold text-slate-600 block mb-1 font-mono">\${mLabel}</span>
              
              <div class="text-[8.5px] text-slate-400 font-mono space-y-0.5 mb-1 leading-tight text-left">
                <div class="flex justify-between"><span>\${yPrev2}:</span><strong class="text-slate-600">\${v24}</strong></div>
                <div class="flex justify-between"><span>\${yPrev}:</span><strong class="text-emerald-700">\${v25}</strong></div>
                <div class="flex justify-between"><span>\${yEst}:</span><strong class="text-[#164250]">\${v26}</strong></div>
              </div>
              <span class="inline-flex items-center justify-center text-[9px] font-extrabold px-1 py-0.5 rounded-md \${
                isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }">
                \${isUp ? '▲' : '▼'} \${sign}\${pct}%
              </span>
            </div>
          \`;
        }).join("");
      }`;

  const replaceBlock11 = `      if (chart1DiffGridEl) {
        chart1DiffGridEl.innerHTML = MONTHS_LABELS.map((mLabel, mIdx) => {
          const isCurrentMonth = (yEst === curYearHourC && mIdx === curMonthIdxHourC);
          const isFutureMonth = (yEst === curYearHourC && mIdx > curMonthIdxHourC);
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
            badgeHtml = \`<span class="inline-flex items-center justify-center text-[9px] font-extrabold px-1 py-0.5 rounded-md \${
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
          \`;
        }).join("");
      }`;

  if (!code.includes(searchBlock11)) {
    throw new Error('searchBlock11 not found in ' + filePath);
  }
  code = code.replace(searchBlock11, replaceBlock11);

  // In mode 2 (day and month) dataset 2
  const searchBlock12 = `        {
          label: \`\${yEst} \${estTag} (t) [\${unitLabelShort}]\`,
          data: monthlyCur,
          borderColor: '#164250',`;

  const replaceBlock12 = `        const nowDayM = new Date();
        const curYearDayM = nowDayM.getFullYear();
        const curMonthIdxDayM = nowDayM.getMonth();
        {
          label: \`\${yEst} \${estTag} (t) [\${unitLabelShort}]\`,
          data: monthlyCur.map((v, idx) => (yEst === curYearDayM && idx >= curMonthIdxDayM) ? null : v),
          borderColor: '#164250',`;

  if (!code.includes(searchBlock12)) {
    throw new Error('searchBlock12 not found in ' + filePath);
  }
  code = code.replace(searchBlock12, replaceBlock12);

  // In mode 2 tooltips
  const searchBlock13 = `        this.chartTrafficPassing.options.plugins.tooltip.callbacks.label = (ctx) => \`\${ctx.dataset.label}: \${ctx.raw.toLocaleString("es-ES")} \${unitLabelShort}\`;
        this.chartTrafficPassing.options.plugins.tooltip.callbacks.afterBody = (items) => {
          if (!items || items.length === 0) return [];
          const idx = items[0].dataIndex;
          const p2Val = monthlyPrev2[idx] || 0;
          const pVal = monthlyPrev[idx] || 0;
          const cVal = monthlyCur[idx] || 0;
          const diffVsPrev = cVal - pVal;
          const pctVsPrev = pVal > 0 ? ((diffVsPrev / pVal) * 100).toFixed(1) : '0.0';
          const diffReal = pVal - p2Val;
          const pctReal = p2Val > 0 ? ((diffReal / p2Val) * 100).toFixed(1) : '0.0';
          return [
            ' ',
            \`-----------------------------------------\`,
            \`Var. Real (\${yPrev2}→\${yPrev}): \${diffReal >= 0 ? '+' : ''}\${diffReal.toLocaleString("es-ES")} \${unitLabelShort} (\${diffReal >= 0 ? '+' : ''}\${pctReal}%)\`,
            \`Var. Proyectada (\${yPrev}→\${yEst}): \${diffVsPrev >= 0 ? '+' : ''}\${diffVsPrev.toLocaleString("es-ES")} \${unitLabelShort} (\${diffVsPrev >= 0 ? '+' : ''}\${pctVsPrev}%)\`
          ];
        };`;

  const replaceBlock13 = `        this.chartTrafficPassing.options.plugins.tooltip.callbacks.label = (ctx) => {
          if (ctx.raw == null) {
            const isCur = ctx.dataIndex === curMonthIdxDayM;
            return \`\${ctx.dataset.label}: \${isCur ? 'En curso (Incompleto)' : 'Sin datos (Futuro)'}\`;
          }
          return \`\${ctx.dataset.label}: \${ctx.raw.toLocaleString("es-ES")} \${unitLabelShort}\`;
        };
        this.chartTrafficPassing.options.plugins.tooltip.callbacks.afterBody = (items) => {
          if (!items || items.length === 0) return [];
          const idx = items[0].dataIndex;
          const isUnclosed = (yEst === curYearDayM && idx >= curMonthIdxDayM);
          const p2Val = monthlyPrev2[idx] || 0;
          const pVal = monthlyPrev[idx] || 0;
          const cVal = isUnclosed ? null : (monthlyCur[idx] || 0);
          const diffReal = pVal - p2Val;
          const pctReal = p2Val > 0 ? ((diffReal / p2Val) * 100).toFixed(1) : '0.0';
          if (isUnclosed) {
            const note = (idx === curMonthIdxDayM) ? 'Mes en curso (Incompleto)' : 'Mes futuro (Sin datos)';
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
        };`;

  if (!code.includes(searchBlock13)) {
    throw new Error('searchBlock13 not found in ' + filePath);
  }
  code = code.replace(searchBlock13, replaceBlock13);

  // In mode 2 grid
  const searchBlock14 = `      } else {
        chart1DiffGridEl.innerHTML = MONTHS_LABELS.map((mLabel, mIdx) => {
          const v24 = monthlyPrev2[mIdx] || 0;
          const v25 = monthlyPrev[mIdx] || 0;
          const v26 = monthlyCur[mIdx] || 0;
          const diffUnits = v26 - v25;
          const pct = v25 > 0 ? ((diffUnits / v25) * 100).toFixed(1) : "0.0";
          const isUp = diffUnits >= 0;
          const sign = isUp ? "+" : "";
          return \`
            <div class="p-2 rounded-xl bg-[#F8FAFB] border border-[#DFEAF0] flex flex-col justify-between text-center hover:border-[#0284C7] hover:bg-white hover:shadow-xs transition-all">
              <span class="text-[10px] font-bold text-slate-600 block mb-1 font-mono">\${mLabel}</span>
              
              <div class="text-[8.5px] text-slate-400 font-mono space-y-0.5 mb-1 leading-tight text-left">
                <div class="flex justify-between"><span>\${yPrev2}:</span><strong class="text-slate-600">\${v24.toLocaleString("es-ES")}</strong></div>
                <div class="flex justify-between"><span>\${yPrev}:</span><strong class="text-emerald-700">\${v25.toLocaleString("es-ES")}</strong></div>
                <div class="flex justify-between"><span>\${yEst}:</span><strong class="text-[#164250]">\${v26.toLocaleString("es-ES")}</strong></div>
              </div>
              <span class="inline-flex items-center justify-center text-[9px] font-extrabold px-1.5 py-0.5 rounded-md \${
                isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }">
                \${isUp ? '▲' : '▼'} \${sign}\${pct}%
              </span>
            </div>
          \`;
        }).join("");
      }`;

  const replaceBlock14 = `      } else {
        chart1DiffGridEl.innerHTML = MONTHS_LABELS.map((mLabel, mIdx) => {
          const isCurrentMonth = (yEst === curYearDayM && mIdx === curMonthIdxDayM);
          const isFutureMonth = (yEst === curYearDayM && mIdx > curMonthIdxDayM);
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
          \`;
        }).join("");
      }`;

  if (!code.includes(searchBlock14)) {
    throw new Error('searchBlock14 not found in ' + filePath);
  }
  code = code.replace(searchBlock14, replaceBlock14);

  // In renderChart1FormulaCard: add transparency badge regarding incomplete months
  const searchBlock15 = `      <div class="flex items-center gap-1.5 text-[10px] text-amber-800 pt-1">
        <i data-lucide="info" class="w-3.5 h-3.5 text-amber-600 shrink-0"></i>
        <span><strong>Garantía de Adaptabilidad Futura:</strong> Cuando el Ajuntament de Barcelona publique las lecturas de aforo de \${yEst} en Open Data BCN, el sistema cargará automáticamente los valores reales de \${yEst} y proyectará \${yEst + 1} de forma transparente.</span>
      </div>`;

  const replaceBlock15 = `      <div class="flex items-center gap-1.5 text-[10px] text-emerald-800 pt-1">
        <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
        <span><strong>Veracidad de Datos (Regla real-data-only):</strong> Al estar el mes actual (\${MONTHS_LABELS[(new Date()).getMonth()]}) en curso sin cerrar y los posteriores sin transcurrir, no se generan estimaciones mensuales de volumen para meses no completados (quedando en 0 / En curso / Futuro). El crecimiento interanual auditado se calcula de forma rigurosa y homogénea sobre los meses completos cerrados (Enero a \${MONTHS_LABELS[(new Date()).getMonth() - 1]}).</span>
      </div>
      <div class="flex items-center gap-1.5 text-[10px] text-amber-800 pt-1">
        <i data-lucide="info" class="w-3.5 h-3.5 text-amber-600 shrink-0"></i>
        <span><strong>Garantía de Adaptabilidad Futura:</strong> Cuando el Ajuntament de Barcelona publique las lecturas de aforo de \${yEst} en Open Data BCN, el sistema cargará automáticamente los valores reales de \${yEst} y proyectará \${yEst + 1} de forma transparente.</span>
      </div>`;

  if (!code.includes(searchBlock15)) {
    throw new Error('searchBlock15 not found in ' + filePath);
  }
  code = code.replace(searchBlock15, replaceBlock15);

  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully patched ' + filePath);
}

try {
  applyFixToFile('web/js/app.js');
  applyFixToFile('usb_portable/web/js/app.js');
  console.log('ALL FILES PATCHED SUCCESSFULLY!');
} catch (e) {
  console.error('Error applying patch:', e);
  process.exit(1);
}

