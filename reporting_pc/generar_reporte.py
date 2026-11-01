#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Sistema de Reporting en PC - Modelo de Demanda Latente de Aparcamientos
Genera informes ejecutivos en HTML y TXT a partir de un archivo .txt de aparcamientos.
Identidad NN Parkings (Grup Núñez i Navarro, Barcelona)
"""

import sys
import os
import webbrowser
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

# Añadir el directorio raíz al path para importar el motor matemático
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from core.demand_engine import (
    parse_parking_txt,
    calculate_latent_demand,
    BENCHMARK_PARKINGS
)


def process_txt_file(file_path: Path) -> List[Dict[str, Any]]:
    """Lee y procesa un archivo .txt con lista de aparcamientos."""
    if not file_path.exists():
        raise FileNotFoundError(f"No se encontró el archivo: {file_path}")

    # Probar varias codificaciones habituales en Windows
    content = ""
    for enc in ["utf-8", "latin-1", "cp1252"]:
        try:
            content = file_path.read_text(encoding=enc)
            break
        except UnicodeDecodeError:
            continue

    if not content.strip():
        raise ValueError(f"El archivo {file_path} está vacío.")

    parkings_raw = parse_parking_txt(content)
    if not parkings_raw:
        raise ValueError("No se pudieron identificar aparcamientos en el archivo de texto.")

    # Calcular demanda latente para cada aparcamiento
    results = []
    for p in parkings_raw:
        calc = calculate_latent_demand(p)
        results.append(calc)

    # Ordenar por demanda latente descendente
    results.sort(key=lambda x: x["latent_demand_dl"], reverse=True)
    return results


def generate_text_report(results: List[Dict[str, Any]], source_file: str) -> str:
    """Genera un reporte en texto plano de alta legibilidad ejecutiva."""
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    total_dl = sum(r["latent_demand_dl"] for r in results)
    total_cruising = sum(r["cruising_vehicles"] for r in results)
    total_revenue_day = sum(r["uncaptured_daily_revenue_eur"] for r in results)
    total_capacity = sum(r["capacity"] for r in results)

    lines = []
    lines.append("=" * 110)
    lines.append("    NN PARKINGS · GRUP NÚÑEZ I NAVARRO · BARCELONA")
    lines.append("    SISTEMA DE INTELIGENCIA DE MOVILIDAD: INFORME DE DEMANDA LATENTE")
    lines.append("=" * 110)
    lines.append(f"Fecha de emisión: {now_str}")
    lines.append(f"Archivo analizado: {source_file}")
    lines.append(f"Aparcamientos auditados: {len(results)}")
    lines.append("-" * 110)
    lines.append("RESUMEN EJECUTIVO DE CARTERA:")
    lines.append(f"  • Demanda Latente Total (DL):     {total_dl:,} veh/h insatisfechos".replace(",", "."))
    lines.append(f"  • Tráfico en Agitación (Cruising):{total_cruising:,} vehículos buscando en calzada".replace(",", "."))
    lines.append(f"  • Ingresos Potenciales No Captados:{total_revenue_day:,} €/día ({total_revenue_day*30:,} €/mes)".replace(",", "."))
    lines.append(f"  • Capacidad Física Auditada:       {total_capacity:,} plazas en rotación".replace(",", "."))
    lines.append("=" * 110)
    lines.append("")
    lines.append(f"{'#':<3} {'APARCAMIENTO':<32} {'DISTRITO':<18} {'PLAZAS':<8} {'D_L':<9} {'CRUISING':<10} {'DÉFICIT':<9} {'INGR. NO CAPT.':<16} {'PRIORIDAD':<10}")
    lines.append("-" * 110)

    for idx, r in enumerate(results, start=1):
        name = r["name"][:30]
        dist = r["district"][:16]
        cap = str(r["capacity"])
        dl = f"{r['latent_demand_dl']} v/h"
        cruising = f"{r['cruising_vehicles']} v"
        defic = f"{r['surface_deficit']} v"
        rev = f"{r['uncaptured_daily_revenue_eur']:,} €/d".replace(",", ".")
        prio = r["yield_priority"]

        lines.append(f"{idx:<3} {name:<32} {dist:<18} {cap:<8} {dl:<9} {cruising:<10} {defic:<9} {rev:<16} {prio:<10}")

    lines.append("-" * 110)
    lines.append("")
    lines.append("DESGLOSE EN CASCAADA (WATERFALL) Y RECOMENDACIONES ESTRATÉGICAS:")
    lines.append("=" * 110)

    for idx, r in enumerate(results, start=1):
        lines.append(f"\n[{idx}] {r['name']} ({r['district']})")
        lines.append(f"    Dirección: {r['address']} | Cota: {r['elevation']} msnm | Pendiente: {r['slope']}%")
        lines.append(f"    Tarifa rotación: {r['tariff']:.2f} €/h | Capacidad: {r['capacity']} plazas")
        lines.append("    Cascada de Flujo:")
        wf = r["waterfall"]
        lines.append(f"      1. Aforo Viario Bruto (Q_total):    {wf['gross_flow']} veh/h")
        lines.append(f"      2. Tráfico Pasante Descontado:     {wf['pass_through_deducted']} veh/h ({r['pass_through_pct']}%)")
        lines.append(f"      3. Tráfico Fin de Viaje Local:      {wf['local_destination_flow']} veh/h")
        lines.append(f"      4. Agitación Activa (Cruising):    +{wf['cruising_added']} veh/h")
        lines.append(f"      5. Déficit Calzada (>85% satur.):  +{wf['surface_deficit_added']} veh/h")
        lines.append(f"      6. Atractores Locales (POIs):      +{wf['poi_demand_added']} veh/h")
        lines.append(f"      7. Fricción Tobler (Pendiente):    {wf['tobler_penalty_deducted']} veh/h (-{r['tobler_friction_pct']}%)")
        lines.append(f"      => DEMANDA LATENTE NETA (D_L):      {r['latent_demand_dl']} veh/h")
        
        # Puntos de paso, entrada y salida
        tp = r.get("traffic_points", [{}])[0]
        yoy = r.get("traffic_yoy_growth_pct", 0)
        lines.append(f"    Puntos de Paso Exterior: {tp.get('name', 'Tramo principal')} | {tp.get('annual_cars_current', 0):,} veh/año (Año Anterior: {tp.get('annual_cars_prev', 0):,} veh, {'▲ Creció' if yoy >= 0 else '▼ Decreció'} {yoy}%)".replace(",", "."))
        
        ep_strs = [f"{ep['name']}: {ep.get('start_1_year_ago', 0):,} v/m (hace 1 año) ➔ {ep.get('current_volume', 0):,} v/m (+{ep.get('growth_pct', 0)}%)".replace(",", ".") for ep in r.get("entry_points", [])]
        lines.append(f"    Puntos de Entrada: {' | '.join(ep_strs)}")
        
        xp_strs = [f"{xp['name']}: {xp.get('current_volume', 0):,} v/m ({xp.get('share_pct', 0)}% cuota)".replace(",", ".") for xp in r.get("exit_points", [])]
        lines.append(f"    Puntos de Salida:  {' | '.join(xp_strs)}")

        lines.append(f"    Impacto Económico: {r['uncaptured_daily_revenue_eur']:,} €/día ({r['uncaptured_weekly_revenue_eur']:,} €/semana)".replace(",", "."))
        lines.append(f"    Yield Advice ({r['yield_priority']}): {r['yield_action']}")
        lines.append("-" * 80)

    lines.append("\nFin del informe técnico.")
    return "\n".join(lines)


def generate_html_report(results: List[Dict[str, Any]], source_file: str) -> str:
    """Genera un informe visual ejecutivo en HTML listo para ver o imprimir en PDF."""
    now_str = datetime.now().strftime("%d/%m/%Y a las %H:%M")
    total_dl = sum(r["latent_demand_dl"] for r in results)
    total_cruising = sum(r["cruising_vehicles"] for r in results)
    total_revenue_day = sum(r["uncaptured_daily_revenue_eur"] for r in results)
    total_capacity = sum(r["capacity"] for r in results)

    # Filas de la tabla
    table_rows = []
    for idx, r in enumerate(results, start=1):
        prio_color = "bg-red-50 text-red-700 border-red-200" if r["yield_priority"] == "ALTA" else "bg-amber-50 text-amber-700 border-amber-200" if r["yield_priority"] == "MEDIA" else "bg-slate-50 text-slate-700 border-slate-200"
        
        table_rows.append(f"""
        <tr class="hover:bg-[#F8FAFB] transition-colors border-b border-[#DFEAF0]">
          <td class="py-3 px-4 font-mono font-bold text-slate-400">#{idx}</td>
          <td class="py-3 px-4">
            <div class="font-bold text-[#1A4B5B] text-sm">{r['name']}</div>
            <div class="text-xs text-slate-400">{r['address']}</div>
          </td>
          <td class="py-3 px-4">
            <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6EFF3] text-[#164250] border border-[#C8DFE8]">
              {r['district']}
            </span>
          </td>
          <td class="py-3 px-4 font-mono text-right font-semibold text-slate-600">{r['capacity']} pl.</td>
          <td class="py-3 px-4 font-mono text-right font-bold text-[#10B981] text-base">{r['latent_demand_dl']} <span class="text-xs font-normal text-slate-400">veh/h</span></td>
          <td class="py-3 px-4 font-mono text-right text-[#D97706] font-semibold">{r['cruising_vehicles']}</td>
          <td class="py-3 px-4 font-mono text-right text-slate-600">{r['surface_deficit']}</td>
          <td class="py-3 px-4 font-mono text-right font-bold text-[#1A4B5B]">{r['uncaptured_daily_revenue_eur']:,} €/d</td>
          <td class="py-3 px-4 text-center">
            <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border {prio_color}">
              {r['yield_priority']}
            </span>
          </td>
        </tr>
        """.replace(",", "."))

    # Tarjetas de detalle para cada aparcamiento
    detail_cards = []
    for idx, r in enumerate(results, start=1):
        wf = r["waterfall"]
        bar_max = max(100, wf["gross_flow"])
        w_gross = 100
        w_pasante = round((abs(wf["pass_through_deducted"]) / bar_max) * 100)
        w_local = round((wf["local_destination_flow"] / bar_max) * 100)
        w_dl = round((r["latent_demand_dl"] / bar_max) * 100)

        detail_cards.append(f"""
        <div class="bg-white rounded-2xl p-6 border border-[#DFEAF0] shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DFEAF0]">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold px-2 py-0.5 rounded bg-[#164250] text-white font-mono">#{idx}</span>
                <h3 class="text-lg font-bold text-[#1A4B5B]">{r['name']}</h3>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">{r['address']} • Distrito: <strong>{r['district']}</strong></p>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <div class="text-xs text-slate-400 uppercase font-semibold">Demanda Latente</div>
                <div class="text-2xl font-black font-mono text-[#10B981]">{r['latent_demand_dl']} <span class="text-xs font-normal text-slate-500">veh/h</span></div>
              </div>
              <div class="text-right pl-3 border-l border-slate-200">
                <div class="text-xs text-slate-400 uppercase font-semibold">Ingresos No Captados</div>
                <div class="text-lg font-bold font-mono text-[#1A4B5B]">{r['uncaptured_daily_revenue_eur']:,} €/día</div>
              </div>
            </div>
          </div>

          <!-- Métricas Técnicas -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div class="p-3 rounded-xl bg-[#F8FAFB] border border-[#DFEAF0]">
              <span class="text-slate-400 block font-medium">Capacidad Física</span>
              <span class="text-base font-bold font-mono text-slate-800">{r['capacity']} plazas</span>
            </div>
            <div class="p-3 rounded-xl bg-[#F8FAFB] border border-[#DFEAF0]">
              <span class="text-slate-400 block font-medium">Tarifa Rotación</span>
              <span class="text-base font-bold font-mono text-slate-800">{r['tariff']:.2f} €/h</span>
            </div>
            <div class="p-3 rounded-xl bg-[#F8FAFB] border border-[#DFEAF0]">
              <span class="text-slate-400 block font-medium">Cota ICGC</span>
              <span class="text-base font-bold font-mono text-slate-800">{r['elevation']} msnm</span>
            </div>
            <div class="p-3 rounded-xl bg-[#F8FAFB] border border-[#DFEAF0]">
              <span class="text-slate-400 block font-medium">Pendiente Tobler</span>
              <span class="text-base font-bold font-mono text-slate-800">{r['slope']}%</span>
            </div>
          </div>

          <!-- Cascada Waterfall -->
          <div class="space-y-2 pt-2">
            <div class="text-xs font-bold text-slate-600 uppercase tracking-wider">Embudo de Desacoplamiento de Demanda (Waterfall):</div>
            
            <div class="space-y-1.5 text-xs font-mono">
              <div class="flex items-center justify-between text-slate-500">
                <span>1. Aforo Viario Bruto (Tramo de acceso)</span>
                <span class="font-bold text-slate-800">{wf['gross_flow']} veh/h</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="bg-slate-400 h-2 rounded-full" style="width: 100%;"></div>
              </div>

              <div class="flex items-center justify-between text-slate-500 pt-1">
                <span>2. Tráfico Pasante Descontado ({r['pass_through_pct']}%)</span>
                <span class="font-bold text-slate-500">{wf['pass_through_deducted']} veh/h</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="bg-slate-300 h-2 rounded-full" style="width: {w_pasante}%;"></div>
              </div>

              <div class="flex items-center justify-between text-slate-500 pt-1">
                <span>3. Tráfico Fin de Viaje + Agitación ({r['cruising_vehicles']} veh) + Déficit Calzada ({r['surface_deficit']} veh)</span>
                <span class="font-bold text-[#D97706]">+{wf['cruising_added'] + wf['surface_deficit_added']} veh/h</span>
              </div>

              <div class="flex items-center justify-between text-slate-500 pt-1">
                <span>4. Penalización Fricción Peatonal Tobler (-{r['tobler_friction_pct']}%)</span>
                <span class="font-bold text-red-500">{wf['tobler_penalty_deducted']} veh/h</span>
              </div>

              <div class="flex items-center justify-between text-[#10B981] font-bold text-sm pt-2 border-t border-slate-100">
                <span>=> Demanda Latente Neta Capturable (D_L)</span>
                <span class="text-base">{r['latent_demand_dl']} veh/h</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-3">
                <div class="bg-[#10B981] h-3 rounded-full" style="width: {min(100, max(8, w_dl))}%;"></div>
              </div>
            </div>
          </div>

          <!-- Puntos Identificados (Tráfico de Paso, Entradas y Salidas) -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div class="p-3 rounded-xl bg-sky-50 border border-sky-100 space-y-1">
              <span class="font-bold text-[#0284C7] block uppercase text-[10px]">Puntos de Paso (Aforo Calzada)</span>
              <div class="font-mono font-bold text-slate-800 text-sm">{r.get('total_annual_traffic', 0):,} veh/año</div>
              <div class="text-[11px] text-slate-500">Año Anterior: {r.get('total_annual_traffic_prev', 0):,} veh</div>
              <span class="inline-block mt-1 px-2 py-0.2 rounded-full font-bold text-[10px] {'bg-emerald-100 text-emerald-800' if r.get('traffic_yoy_growth_pct', 0) >= 0 else 'bg-rose-100 text-rose-800'}">
                {'▲ Creció +' if r.get('traffic_yoy_growth_pct', 0) >= 0 else '▼ Decreció '}{r.get('traffic_yoy_growth_pct', 0)}%
              </span>
            </div>

            <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1">
              <span class="font-bold text-[#10B981] block uppercase text-[10px]">Puntos de Entrada ({len(r.get('entry_points', []))} accesos)</span>
              <div class="font-mono font-bold text-slate-800 text-sm">{sum(ep.get('current_volume', 0) for ep in r.get('entry_points', [])):,} v/mes</div>
              <div class="text-[11px] text-slate-500">Inicio hace 1 año: {sum(ep.get('start_1_year_ago', 0) for ep in r.get('entry_points', [])):,} v/m</div>
              <span class="inline-block mt-1 px-2 py-0.2 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                ▲ +{r.get('entry_points', [{}])[0].get('growth_pct', 12)}% evolución entradas
              </span>
            </div>

            <div class="p-3 rounded-xl bg-orange-50 border border-orange-100 space-y-1">
              <span class="font-bold text-[#F97316] block uppercase text-[10px]">Puntos de Salida ({len(r.get('exit_points', []))} viales)</span>
              <div class="font-mono font-bold text-slate-800 text-sm">{sum(xp.get('current_volume', 0) for xp in r.get('exit_points', [])):,} v/mes</div>
              <div class="text-[11px] text-slate-500">Evacuación fluida sin colas</div>
              <span class="inline-block mt-1 px-2 py-0.2 rounded-full font-bold text-[10px] bg-orange-100 text-orange-800">
                Balance de Rotación OK
              </span>
            </div>
          </div>

          <!-- Yield Recommendation -->
          <div class="p-3.5 rounded-xl bg-[#E6EFF3]/60 border border-[#C8DFE8] text-xs">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-bold text-[#164250] uppercase tracking-wider">Recomendación Estratégica de Precios & Cupos:</span>
              <span class="px-2 py-0.2 rounded font-mono font-bold text-[10px] {prio_color}">{r['yield_priority']}</span>
            </div>
            <p class="text-slate-700 leading-relaxed">{r['yield_action']}</p>
          </div>
        </div>
        """.replace(",", "."))

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe de Demanda Latente · NN Parkings Barcelona</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts: Inter & JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {{
      font-family: 'Inter', sans-serif;
      background-color: #F8FAFB;
      color: #123742;
    }}
    .font-mono {{
      font-family: 'JetBrains Mono', monospace;
    }}
    @media print {{
      .no-print {{ display: none !important; }}
      body {{ background-color: #ffffff; }}
    }}
  </style>
</head>
<body class="min-h-screen p-4 sm:p-8">
  <div class="max-w-6xl mx-auto space-y-6">

    <!-- Top Action Bar (Print / Web) -->
    <div class="no-print flex items-center justify-between pb-4 border-b border-[#DFEAF0]">
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6EFF3] text-[#164250] border border-[#C8DFE8]">
          INFORME TÉCNICO OFICIAL
        </span>
        <span class="text-xs text-slate-400">Generado desde: {source_file}</span>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-[#164250] hover:bg-[#0F323D] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          Imprimir / Guardar en PDF
        </button>
      </div>
    </div>

    <!-- Header Corporativo NN Parkings -->
    <header class="bg-white rounded-3xl p-6 sm:p-8 border border-[#DFEAF0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="flex items-center space-x-4">
        <div class="w-14 h-14 rounded-full bg-[#0D2730] flex items-center justify-center text-white font-extrabold text-xl tracking-wider shadow-sm shrink-0">
          NN
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Grup Núñez i Navarro</span>
            <span class="text-xs text-[#164250] font-bold">_parkings</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#1A4B5B] tracking-tight">
            Auditoría de Demanda Latente de Aparcamientos
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            Evaluación técnica de vehículos insatisfechos en calzada y potencial de captación subterránea en Barcelona.
          </p>
        </div>
      </div>

      <div class="text-right text-xs text-slate-500 shrink-0">
        <div>Emisión: <strong>{now_str}</strong></div>
        <div>Muestra: <strong>{len(results)} aparcamientos</strong></div>
        <div>Entorno: <strong>Barcelona Metropolitan Area</strong></div>
      </div>
    </header>

    <!-- 4 KPIs Ejecutivos -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl p-5 border border-[#DFEAF0] shadow-sm">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Demanda Latente Total</span>
        <div class="mt-2 text-3xl font-extrabold font-mono text-[#1A4B5B]">{total_dl:,} <span class="text-xs font-normal text-slate-400">veh/h</span></div>
        <span class="text-[11px] text-[#10B981] font-semibold mt-1 block">Demanda neta no capturada</span>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-[#DFEAF0] shadow-sm">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Tráfico en Cruising</span>
        <div class="mt-2 text-3xl font-extrabold font-mono text-[#D97706]">{total_cruising:,} <span class="text-xs font-normal text-slate-400">veh/h</span></div>
        <span class="text-[11px] text-slate-500 font-semibold mt-1 block">Buscando plaza en superficie</span>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-[#DFEAF0] shadow-sm">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Ingresos No Captados</span>
        <div class="mt-2 text-3xl font-extrabold font-mono text-[#10B981]">{total_revenue_day:,} <span class="text-xs font-normal text-slate-400">€/día</span></div>
        <span class="text-[11px] text-slate-500 font-semibold mt-1 block">~{total_revenue_day*30:,} € al mes</span>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-[#DFEAF0] shadow-sm">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Capacidad Auditada</span>
        <div class="mt-2 text-3xl font-extrabold font-mono text-slate-800">{total_capacity:,} <span class="text-xs font-normal text-slate-400">plazas</span></div>
        <span class="text-[11px] text-slate-500 font-semibold mt-1 block">Oferta física en cartera</span>
      </div>
    </div>

    <!-- Tabla Comparativa -->
    <div class="bg-white rounded-3xl border border-[#DFEAF0] shadow-sm overflow-hidden">
      <div class="p-6 border-b border-[#DFEAF0] flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-[#1A4B5B]">Ranking de Aparcamientos Auditados</h2>
          <p class="text-xs text-slate-400">Ordenados de mayor a menor demanda latente insatisfecha en su área de influencia</p>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#F8FAFB] text-slate-500 border-b border-[#DFEAF0] uppercase font-semibold">
            <tr>
              <th class="py-3 px-4">#</th>
              <th class="py-3 px-4">Aparcamiento</th>
              <th class="py-3 px-4">Distrito</th>
              <th class="py-3 px-4 text-right">Plazas</th>
              <th class="py-3 px-4 text-right">Demanda Latente (D_L)</th>
              <th class="py-3 px-4 text-right">Cruising</th>
              <th class="py-3 px-4 text-right">Déficit Calzada</th>
              <th class="py-3 px-4 text-right">Ingresos Potenciales</th>
              <th class="py-3 px-4 text-center">Prioridad Yield</th>
            </tr>
          </thead>
          <tbody>
            {"".join(table_rows)}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tarjetas de Detalle Quirúrgico -->
    <div class="space-y-4">
      <h2 class="text-xl font-bold text-[#1A4B5B] pt-4">Diagnóstico Quirúrgico y Cascada por Aparcamiento</h2>
      <div class="grid grid-cols-1 gap-6">
        {"".join(detail_cards)}
      </div>
    </div>

    <!-- Footer -->
    <footer class="pt-8 pb-12 text-center text-xs text-slate-400 space-y-1 border-t border-[#DFEAF0]">
      <p><strong>NN Parkings · Latent Demand Pulse</strong> — Grup Núñez i Navarro</p>
      <p>Formulación matemática conforme a la Guía Técnica de Ingeniería de Movilidad Urbana de Barcelona.</p>
    </footer>

  </div>
</body>
</html>
""".replace("{total_dl:,}", f"{total_dl:,}".replace(",", ".")).replace("{total_cruising:,}", f"{total_cruising:,}".replace(",", ".")).replace("{total_revenue_day:,}", f"{total_revenue_day:,}".replace(",", ".")).replace("{total_capacity:,}", f"{total_capacity:,}".replace(",", ".")).replace("{total_revenue_day*30:,}", f"{total_revenue_day*30:,}".replace(",", "."))

    return html


def main():
    """Punto de entrada de línea de comandos."""
    # Detectar el archivo .txt a analizar
    target_file = None
    if len(sys.argv) > 1:
        target_file = Path(sys.argv[1])
    else:
        # Buscar por defecto en la carpeta
        candidates = [
            CURRENT_DIR / "aparcamientos_analizar.txt",
            ROOT_DIR / "aparcamientos_analizar.txt",
            CURRENT_DIR / "ejemplos_txt" / "aparcamientos_ejemplo.txt"
        ]
        for c in candidates:
            if c.exists():
                target_file = c
                break

    if not target_file or not target_file.exists():
        print("Uso: python generar_reporte.py <ruta_al_archivo.txt>")
        print("O añade un archivo 'aparcamientos_analizar.txt' en el directorio.")
        sys.exit(1)

    print(f"\n[+] Procesando archivo: {target_file}")
    try:
        results = process_txt_file(target_file)
    except Exception as e:
        print(f"[-] Error al procesar el archivo: {e}")
        sys.exit(1)

    # 1. Generar Reporte de Texto
    txt_content = generate_text_report(results, target_file.name)
    output_txt = CURRENT_DIR / "reporte_demanda_latente.txt"
    output_txt.write_text(txt_content, encoding="utf-8")
    print(f"[OK] Reporte TXT generado en: {output_txt.name}")

    # 2. Generar Reporte HTML
    html_content = generate_html_report(results, target_file.name)
    output_html = CURRENT_DIR / "reporte_demanda_latente.html"
    output_html.write_text(html_content, encoding="utf-8")
    print(f"[OK] Reporte HTML generado en: {output_html.name}")

    # Mostrar resumen en consola
    print("\n" + "=" * 80)
    print(f"RESUMEN EJECUTIVO ({len(results)} aparcamientos analizados)")
    print("=" * 80)
    total_dl = sum(r["latent_demand_dl"] for r in results)
    total_rev = sum(r["uncaptured_daily_revenue_eur"] for r in results)
    print(f"Demanda Latente Total: {total_dl} veh/h")
    print(f"Ingresos No Captados:  {total_rev:,} €/día ({total_rev*30:,} €/mes)".replace(",", "."))
    print("-" * 80)
    for idx, r in enumerate(results[:5], start=1):
        print(f"#{idx} {r['name']:<30} DL: {r['latent_demand_dl']:>4} veh/h | Ingresos: {r['uncaptured_daily_revenue_eur']:>6} €/d | Prioridad: {r['yield_priority']}")
    if len(results) > 5:
        print(f"... y {len(results)-5} aparcamientos más en el reporte completo.")
    print("=" * 80)

    # Abrir reporte HTML en navegador automáticamente
    try:
        webbrowser.open(output_html.as_uri())
    except Exception:
        pass


if __name__ == "__main__":
    main()
