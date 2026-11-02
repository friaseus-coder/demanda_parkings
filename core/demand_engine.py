"""
Motor Matemático de Demanda Latente de Aparcamientos en Barcelona
Formulación de Ingeniería de Movilidad Urbana y Fricción Espacial.
Identidad NN Parkings (Grup Núñez i Navarro)
"""

import math
import json
import re
import csv
import io
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple, Union

# Lista inicial vacía (sin aparcamientos hardcodeados al inicio)
BENCHMARK_PARKINGS: List[Dict[str, Any]] = []

# Calibraciones de Movilidad de Barcelona (Valores Manual Técnico)
CALIBRATION = {
    "beta_0": -2.20,
    "beta_1": 2.50,   # Peso degradación de velocidad
    "beta_2": 3.00,   # Peso saturación en calzada
    "beta_3": 1.20,   # Peso saturación DUM
    "lambda_huff": 0.28,
    "price_elasticity": 0.75,
    "ref_market_tariff": 3.40,
    "theta_threshold": 0.85,
    "avg_stay_hours": 2.2,
    "turnover_rate": 0.95
}

def calculate_latent_demand(
    parking: Dict[str, Any],
    weather_rain_mm: float = 0.0,
    surface_saturation_pct: float = 90.0,
    event_type: str = "none",
    custom_tariff: Optional[float] = None,
    hour: int = 18,
    day_of_week: int = 5  # 1=Lunes, 5=Viernes, 6=Sábado, 7=Domingo
) -> Dict[str, Any]:
    """
    Calcula la demanda latente neta y el desglose de flujo (Waterfall)
    siguiendo la formulación matemática del Manual Técnico de Ingeniería.
    """
    cap = parking.get("capacity", 0) or 0
    tariff = custom_tariff if custom_tariff is not None else (parking.get("tariff", 0.0) or 0.0)
    slope = parking.get("slope", 1.5)
    pois = parking.get("pois_count", 0) or 0
    kappa_base = parking.get("pass_through_base", 0.60)

    # Regla real-data-only: Si no se dispone de capacidad física de plazas en el archivo cargado,
    # todas las métricas de aforo, cruising y demanda latente son estrictamente 0.
    if cap <= 0:
        return {
            "parking_id": parking.get("id"),
            "obra_actual": parking.get("obra_actual") or parking.get("obraActual"),
            "name": parking.get("name"),
            "district": parking.get("district", "Barcelona"),
            "address": parking.get("address", ""),
            "capacity": 0,
            "tariff": 0.0,
            "elevation": parking.get("elevation", 30.0),
            "slope": slope,
            "lat": parking.get("lat", 41.388),
            "lon": parking.get("lon", 2.160),
            "data_source": "SIN_DATOS_CAPACIDAD",
            "is_audited": False,
            "latent_demand_dl": 0,
            "cruising_vehicles": 0,
            "surface_deficit": 0,
            "poi_induced_demand": 0,
            "gross_traffic_flow": 0,
            "pass_through_flow": 0,
            "pass_through_pct": 0.0,
            "tobler_friction_loss": 0,
            "tobler_friction_pct": 0.0,
            "uncaptured_daily_revenue_eur": 0,
            "uncaptured_weekly_revenue_eur": 0,
            "yield_action": "Sin telemetría de capacidad física (0 plazas en archivo cargado)",
            "yield_priority": "SIN_DATOS",
            "traffic_points": [],
            "entry_points": [],
            "exit_points": [],
            "total_annual_traffic": 0,
            "total_annual_traffic_prev": 0,
            "traffic_yoy_growth_pct": 0.0,
            "has_capacity_data": False,
            "waterfall": {
                "gross_flow": 0,
                "pass_through_deducted": 0,
                "local_destination_flow": 0,
                "cruising_added": 0,
                "surface_deficit_added": 0,
                "poi_demand_added": 0,
                "tobler_penalty_deducted": 0,
                "net_latent_demand": 0
            }
        }

    # 1. Aforo Viario Bruto (Q_total) simulado para el tramo viario (según capacidad y hora)
    # Patrón horario de tráfico en Barcelona
    hour_flow_curve = [
        0.12, 0.08, 0.05, 0.04, 0.06, 0.15, 0.42, 0.85, 
        1.05, 0.98, 0.92, 1.02, 1.15, 1.20, 1.05, 0.95, 
        1.10, 1.28, 1.35, 1.25, 1.05, 0.80, 0.50, 0.28
    ]
    h_idx = max(0, min(23, hour))
    traffic_factor = hour_flow_curve[h_idx]
    
    # Aforo base en el eje vial adyacente (vehículos/hora)
    base_gross_flow = round(cap * 3.8 * traffic_factor)
    q_total = max(100, base_gross_flow)

    # 2. Factor horario para tráfico pasante (omega_horaria)
    if 7 <= hour <= 9:
        omega_horaria = 1.15
    elif 14 <= hour <= 17:
        omega_horaria = 1.00
    elif hour >= 21 or hour <= 6:
        omega_horaria = 0.65
    else:
        omega_horaria = 1.05

    kappa_pasante = min(0.92, max(0.15, kappa_base * omega_horaria))
    q_pasante = round(q_total * kappa_pasante)
    q_potencial = max(10, q_total - q_pasante)

    # 3. Agitación Cinemática (Cruising) - Modelo Logit
    theta_sup = surface_saturation_pct / 100.0
    delta_v = max(0.0, min(0.60, (theta_sup - 0.70) * 1.5 if theta_sup > 0.70 else 0.0))
    rho_dum = min(1.0, 0.50 + 0.40 * theta_sup)

    logit_z = (
        CALIBRATION["beta_0"] 
        + CALIBRATION["beta_1"] * delta_v 
        + CALIBRATION["beta_2"] * theta_sup 
        + CALIBRATION["beta_3"] * rho_dum
    )
    gamma_cruising = 1.0 / (1.0 + math.exp(-logit_z))
    q_agitacion = round(q_potencial * gamma_cruising)

    # 4. Déficit Insatisfecho en Superficie (>85% calzada)
    umbral = CALIBRATION["theta_threshold"]
    if theta_sup > umbral:
        # Plazas reguladas estimadas en isocrona 5 min (~ 0.85 * cap)
        n_plazas_sup = round(cap * 0.90)
        delta_deficit_sup = round((theta_sup - umbral) * n_plazas_sup * CALIBRATION["turnover_rate"])
    else:
        delta_deficit_sup = 0

    # 5. Generación de Atractores y Singulares (POIs)
    # Ponderado según hora y perfil de distrito
    is_night_time = (hour >= 22 or hour <= 5)
    is_lunch_time = (13 <= hour <= 16)
    is_shopping_time = (17 <= hour <= 21)

    poi_weight = 0.12
    if is_shopping_time:
        poi_weight = 0.22
    elif is_lunch_time:
        poi_weight = 0.18
    elif is_night_time and ("Ocio" in parking.get("dominant_profile", "") or "Blai" in parking.get("name", "")):
        poi_weight = 0.25

    q_atractores = round(pois * poi_weight * (0.8 + 0.4 * (day_of_week / 7.0)))

    # Demanda Bruta Local
    d_bruta = q_agitacion + delta_deficit_sup + q_atractores

    # 6. Fricción Topográfica Tobler y Semafórica Eixample
    # Pérdida por pendiente y cruces semafóricos
    factor_tobler_perdida = min(0.40, (slope / 100.0) * 1.8 + 0.05)
    perdida_tobler = round(d_bruta * factor_tobler_perdida)
    d_friccionada = max(5, d_bruta - perdida_tobler)

    # 7. Probabilidad Gravitatoria de Huff (Captura vs oferta circundante)
    # Suponiendo activo dominante o en competencia local
    huff_share = min(0.65, max(0.20, (cap / (cap + 320)) * 0.95))
    d_capturable = round(d_friccionada * huff_share)

    # 8. Multiplicadores Exógenos (Clima, Eventos, Elasticidad-Precio)
    # Multiplicador Lluvia: +4.5% por mm/h hasta 15 mm/h
    phi_clima = 1.0 + min(weather_rain_mm, 15.0) * 0.045

    # Multiplicador de Eventos
    event_multipliers = {
        "none": 1.00,
        "mwc": 1.45,
        "concert": 1.60,
        "festivo": 1.35,
        "strike": 1.50
    }
    omega_evento = event_multipliers.get(event_type.lower(), 1.00)

    # Elasticidad-Precio
    # Psi = max(0.40, 1.0 - ((Tarifa - 3.40)/3.40) * 0.75)
    psi_precio = max(0.40, 1.0 - ((tariff - CALIBRATION["ref_market_tariff"]) / CALIBRATION["ref_market_tariff"]) * CALIBRATION["price_elasticity"])

    # 9. Demanda Latente Neta Final (D_L)
    d_latente_neta = max(5, round(d_capturable * phi_clima * omega_evento * psi_precio))

    # 10. Cálculo de Ingresos No Captados Estimados (€/día y €/semana)
    # Rotación promedio diaria = ~14 horas de alta demanda activa
    active_daily_hours = 14
    uncaptured_daily_rev = round(d_latente_neta * CALIBRATION["avg_stay_hours"] * tariff * 0.65 * (active_daily_hours / 10.0))
    uncaptured_weekly_rev = round(uncaptured_daily_rev * 6.8)

    # 11. Recomendación Estratégica de Yield Management
    ratio_dl_cap = d_latente_neta / max(1, cap)
    if ratio_dl_cap > 0.35:
        target_tariff = round(tariff + 0.40, 2)
        yield_action = (
            f"Presión crítica de demanda latente ({d_latente_neta} veh/h, +{round(ratio_dl_cap*100)}% de rotación potencial). "
            f"Se aconseja elevar tarifa a {target_tariff:.2f} €/h en hora pico y cerrar venta de abonos diurnos para maximizar margen."
        )
        yield_priority = "ALTA"
    elif ratio_dl_cap > 0.20:
        target_tariff = round(tariff + 0.15, 2)
        yield_action = (
            f"Demanda latente robusta ({d_latente_neta} veh/h). "
            f"Optimizar tarifa dinámica a {target_tariff:.2f} €/h y restringir cupos a plataformas de agregadores digitales con descuento."
        )
        yield_priority = "MEDIA"
    else:
        yield_action = (
            f"Demanda latente moderada ({d_latente_neta} veh/h). "
            f"Mantener tarifa actual de {tariff:.2f} €/h y capturar acuerdos corporativos / flotas de recarga eléctrica en plazas infrautilizadas."
        )
        yield_priority = "ESTÁNDAR"

    # Puntos de paso exterior, entradas y salidas
    flow_scale = round(cap * 11.2)
    address = parking.get("address", "")
    street_main = address.split(",")[0] if address else parking.get("name", "Tramo Principal")
    is_pacified = "ciutat vella" in parking.get("district", "").lower()
    yoy_pct = -1.8 if is_pacified else 4.2
    annual_prev = round(flow_scale * 12 * 8.4)
    annual_cur = round(annual_prev * (1 + yoy_pct / 100))

    traffic_points = [
        {
            "name": f"Aforo Viario Principal · {street_main}",
            "street": street_main,
            "lanes": 3 if cap > 350 else 2,
            "annual_cars_prev": annual_prev,
            "annual_cars_current": annual_cur,
            "yoy_growth_pct": yoy_pct
        }
    ]

    base_entries = round(cap * 38)
    ep1_start = round(base_entries * 0.65 * 0.88)
    ep1_cur = round(ep1_start * 1.18)
    entry_points = [
        {
            "name": f"Entrada Principal · {street_main}",
            "start_1_year_ago": ep1_start,
            "current_volume": ep1_cur,
            "growth_pct": round(((ep1_cur - ep1_start) / ep1_start) * 100, 1),
            "share_pct": 65
        },
        {
            "name": "Entrada Secundaria · Chaflán Cerdà",
            "start_1_year_ago": round(base_entries * 0.35 * 0.89),
            "current_volume": round(base_entries * 0.35 * 1.14),
            "growth_pct": 14.5,
            "share_pct": 35
        }
    ]

    exit_points = [
        {
            "name": f"Salida Principal hacia {street_main}",
            "current_volume": round(ep1_cur * 0.99),
            "share_pct": 62
        },
        {
            "name": "Salida Posterior hacia Calle Transversal",
            "current_volume": round(base_entries * 0.35 * 1.13),
            "share_pct": 38
        }
    ]

    return {
        "parking_id": parking.get("id"),
        "obra_actual": parking.get("obra_actual") or parking.get("obraActual"),
        "name": parking.get("name"),
        "district": parking.get("district", "Barcelona"),
        "address": parking.get("address", ""),
        "capacity": cap,
        "tariff": tariff,
        "elevation": parking.get("elevation", 30.0),
        "slope": slope,
        "lat": parking.get("lat", 41.388),
        "lon": parking.get("lon", 2.160),
        "data_source": parking.get("data_source", "REAL_AUDITED" if parking.get("is_audited") else "ESTIMATED_SEEDED"),
        "is_audited": bool(parking.get("is_audited") or parking.get("data_source") == "REAL_AUDITED"),
        "latent_demand_dl": d_latente_neta,
        "cruising_vehicles": q_agitacion,
        "surface_deficit": delta_deficit_sup,
        "poi_induced_demand": q_atractores,
        "gross_traffic_flow": q_total,
        "pass_through_flow": q_pasante,
        "pass_through_pct": round(kappa_pasante * 100, 1),
        "tobler_friction_loss": perdida_tobler,
        "tobler_friction_pct": round(factor_tobler_perdida * 100, 1),
        "uncaptured_daily_revenue_eur": uncaptured_daily_rev,
        "uncaptured_weekly_revenue_eur": uncaptured_weekly_rev,
        "yield_action": yield_action,
        "yield_priority": yield_priority,
        "traffic_points": traffic_points,
        "entry_points": entry_points,
        "exit_points": exit_points,
        "total_annual_traffic": annual_cur,
        "total_annual_traffic_prev": annual_prev,
        "traffic_yoy_growth_pct": yoy_pct,
        "waterfall": {
            "gross_flow": q_total,
            "pass_through_deducted": -q_pasante,
            "local_destination_flow": q_potencial,
            "cruising_added": q_agitacion,
            "surface_deficit_added": delta_deficit_sup,
            "poi_demand_added": q_atractores,
            "tobler_penalty_deducted": -perdida_tobler,
            "net_latent_demand": d_latente_neta
        }
    }


def extract_xlsx_rows(file_bytes: bytes) -> List[List[str]]:
    """
    Extrae las filas de un archivo Excel .xlsx (formato OpenXML ZIP)
    usando únicamente la librería estándar de Python (zipfile + xml.etree.ElementTree).
    """
    with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
        shared_strings: List[str] = []
        if "xl/sharedStrings.xml" in z.namelist():
            root_ss = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root_ss.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si"):
                texts = [
                    t.text or ""
                    for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")
                ]
                shared_strings.append("".join(texts))

        sheet_files = sorted(
            n for n in z.namelist()
            if n.startswith("xl/worksheets/sheet") and n.endswith(".xml")
        )
        if not sheet_files:
            return []

        root_ws = ET.fromstring(z.read(sheet_files[0]))
        rows: List[List[str]] = []

        def col_to_idx(cell_ref: str) -> int:
            col = 0
            for ch in cell_ref:
                if "A" <= ch <= "Z":
                    col = col * 26 + (ord(ch) - 64)
                elif "a" <= ch <= "z":
                    col = col * 26 + (ord(ch) - 96)
                else:
                    break
            return max(0, col - 1)

        ns = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
        for row_el in root_ws.iter(f"{ns}row"):
            row_vals: List[str] = []
            for c_el in row_el.findall(f"{ns}c"):
                ref = c_el.attrib.get("r", "")
                idx = col_to_idx(ref) if ref else len(row_vals)
                while len(row_vals) <= idx:
                    row_vals.append("")
                c_type = c_el.attrib.get("t", "")
                v_el = c_el.find(f"{ns}v")
                is_el = c_el.find(f"{ns}is")
                val = ""
                if c_type == "s" and v_el is not None and v_el.text is not None:
                    s_idx = int(v_el.text)
                    if 0 <= s_idx < len(shared_strings):
                        val = shared_strings[s_idx]
                elif c_type == "inlineStr" and is_el is not None:
                    val = "".join(t.text or "" for t in is_el.iter(f"{ns}t"))
                elif v_el is not None and v_el.text is not None:
                    val = v_el.text
                row_vals[idx] = val.strip()
            if any(cell != "" for cell in row_vals):
                rows.append(row_vals)
        return rows


def parse_parking_file(file_path: Union[str, Path]) -> List[Dict[str, Any]]:
    """
    Lee un archivo .xlsx, .csv o .txt desde disco y devuelve la lista de aparcamientos estructurados.
    """
    p = Path(file_path)
    raw_bytes = p.read_bytes()
    if raw_bytes[:4] == b"PK\x03\x04" or p.suffix.lower() in (".xlsx", ".xls"):
        rows = extract_xlsx_rows(raw_bytes)
        return parse_parking_rows(rows)
    try:
        txt = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        txt = raw_bytes.decode("cp1252", errors="replace")
    return parse_parking_txt(txt)


def parse_parking_txt(txt_content: str) -> List[Dict[str, Any]]:
    """
    Parsea de forma flexible cualquier texto o CSV (incluyendo el formato
    Obra Anterior, Obra Actual, Nombre de la Obra, X, Y, Dirección...)
    sin aparcamientos hardcodeados.
    """
    if not txt_content or txt_content.startswith("PK\x03\x04"):
        return []

    raw_lines = [l.strip() for l in txt_content.splitlines() if l.strip()]
    if not raw_lines:
        return []

    # Detectar delimitador predominante en la primera línea útil
    first_line = next((l for l in raw_lines if not l.startswith("#") and not l.startswith("//")), "")
    if "|" in first_line:
        delim = "|"
    elif "\t" in first_line:
        delim = "\t"
    elif first_line.count(";") > first_line.count(","):
        delim = ";"
    else:
        delim = ","

    rows: List[List[str]] = []
    for line in raw_lines:
        if line.startswith("#") or line.startswith("//"):
            continue
        if delim in line:
            reader = csv.reader([line], delimiter=delim, quotechar='"')
            for r in reader:
                rows.append([c.strip() for c in r])
        else:
            rows.append([line])

    return parse_parking_rows(rows)


def parse_parking_rows(rows: List[List[str]]) -> List[Dict[str, Any]]:
    """
    Convierte una matriz de filas (procedente de Excel .xlsx o CSV/TXT)
    en objetos de aparcamiento listos para el cálculo de demanda latente.
    Soporta dinámicamente columnas como:
    Obra Anterior | Obra Actual | Nombre de la Obra | X | Y | Dirección | ... | Estado
    """
    if not rows:
        return []

    first_row_norm = [
        re.sub(r"[\u0300-\u036f]", "", str(c or "").lower()).strip()
        for c in rows[0]
    ]
    is_header = any(
        re.search(r"\b(obra|nombre|parking|direccion|address|lat|latitud|latitude|lon|longitud|longitude)\b", cell)
        for cell in first_row_norm
    ) or ("x" in first_row_norm and "y" in first_row_norm)

    col_map: Dict[str, int] = {
        "obra_anterior": -1,
        "obra_actual": -1,
        "name": -1,
        "x": -1,
        "y": -1,
        "address": -1,
        "capacity": -1,
        "tariff": -1,
        "district": -1,
        "status": -1,
    }

    if is_header:
        for idx, h in enumerate(first_row_norm):
            if "obra anterior" in h or h == "obra_anterior":
                col_map["obra_anterior"] = idx
            elif "obra actual" in h or h == "obra_actual" or h == "obra" or h == "id" or h == "codigo":
                col_map["obra_actual"] = idx
            elif "nombre" in h or "name" in h or "parking" in h or "aparcamiento" in h or "activo" in h:
                col_map["name"] = idx
            elif h in ("x", "lon", "lng", "longitud", "longitude", "coord_x"):
                col_map["x"] = idx
            elif h in ("y", "lat", "latitud", "latitude", "coord_y"):
                col_map["y"] = idx
            elif "direcc" in h or "address" in h or "calle" in h or "ubicacion" in h or "domicilio" in h:
                col_map["address"] = idx
            elif "plaza" in h or "capac" in h or h == "cap":
                col_map["capacity"] = idx
            elif "tarif" in h or "precio" in h or "eur" in h:
                col_map["tariff"] = idx
            elif "distrit" in h or "barrio" in h or "zona" in h:
                col_map["district"] = idx
            elif "estado" in h or "tipo" in h or "status" in h:
                col_map["status"] = idx

    start_row = 1 if is_header else 0
    parsed_items: List[Dict[str, Any]] = []

    def to_num(val: Any) -> Optional[float]:
        if val is None:
            return None
        s = str(val).strip()
        if not s:
            return None
        if re.match(r"^-?\d+,\d+$", s):
            s = s.replace(",", ".")
        try:
            return float(s)
        except ValueError:
            return None

    for r_idx in range(start_row, len(rows)):
        row = [str(c or "").strip() for c in rows[r_idx]]
        if not any(row):
            continue

        joined_low = " ".join(row).lower()
        if r_idx == 0 and ("obra anterior" in joined_low or "nombre de la obra" in joined_low):
            continue

        item = _parse_structured_row(row, len(parsed_items) + 1, col_map, is_header, to_num)
        if item:
            parsed_items.append(item)

    return parsed_items


def _parse_structured_row(
    row: List[str],
    idx: int,
    col_map: Dict[str, int],
    has_header: bool,
    to_num
) -> Optional[Dict[str, Any]]:
    obra_anterior = ""
    obra_actual = ""
    raw_name = ""
    address = ""
    lon: Optional[float] = None
    lat: Optional[float] = None
    capacity: Optional[int] = None
    tariff: Optional[float] = None
    district = ""
    status_flag = ""

    # 1. Si hay cabeceras mapeadas
    if has_header and (col_map["name"] != -1 or col_map["x"] != -1 or col_map["y"] != -1):
        if 0 <= col_map["obra_anterior"] < len(row):
            obra_anterior = row[col_map["obra_anterior"]]
        if 0 <= col_map["obra_actual"] < len(row):
            obra_actual = row[col_map["obra_actual"]]
        if 0 <= col_map["name"] < len(row):
            raw_name = row[col_map["name"]]
        if 0 <= col_map["x"] < len(row):
            lon = to_num(row[col_map["x"]])
        if 0 <= col_map["y"] < len(row):
            lat = to_num(row[col_map["y"]])
        if 0 <= col_map["address"] < len(row):
            address = row[col_map["address"]]
        if 0 <= col_map["capacity"] < len(row):
            c_val = to_num(row[col_map["capacity"]])
            if c_val is not None and c_val > 0:
                capacity = int(round(c_val))
        if 0 <= col_map["tariff"] < len(row):
            tariff = to_num(row[col_map["tariff"]])
        if 0 <= col_map["district"] < len(row):
            district = row[col_map["district"]]
        if 0 <= col_map["status"] < len(row):
            status_flag = row[col_map["status"]]

        used_indices = {v for v in col_map.values() if v != -1}
        for c_i, cell in enumerate(row):
            if c_i in used_indices or not cell:
                continue
            if not address and len(cell) > 5 and to_num(cell) is None:
                address = cell
            elif not status_flag and len(cell) <= 3 and to_num(cell) is None:
                status_flag = cell
    else:
        # 2. Detección posicional / heurística:
        # Formato usuario: Obra Anterior, Obra Actual, Nombre de la Obra, X, Y, Dirección, , p/P
        n3 = to_num(row[3]) if len(row) > 3 else None
        n4 = to_num(row[4]) if len(row) > 4 else None
        if len(row) >= 5 and n3 is not None and n4 is not None and (
            (1.5 <= n3 <= 3.0 and 40.5 <= n4 <= 42.5) or (40.5 <= n3 <= 42.5 and 1.5 <= n4 <= 3.0)
        ):
            obra_anterior = row[0]
            obra_actual = row[1]
            raw_name = row[2]
            if 1.5 <= n3 <= 3.0:
                lon, lat = n3, n4
            else:
                lat, lon = n3, n4
            if len(row) > 5 and row[5]:
                address = row[5]
            for extra in row[6:]:
                if not extra:
                    continue
                num_extra = to_num(extra)
                if num_extra is not None and 25 <= num_extra <= 3000 and capacity is None:
                    capacity = int(round(num_extra))
                elif num_extra is not None and 1.0 <= num_extra <= 12.0 and tariff is None:
                    tariff = num_extra
                elif len(extra) <= 3 and not status_flag:
                    status_flag = extra
                elif len(extra) > 5 and not address:
                    address = extra
        else:
            #Escaneo general
            text_cells: List[str] = []
            for cell in row:
                if not cell:
                    continue
                val = to_num(cell)
                if val is not None:
                    if 1.5 <= val <= 3.0 and lon is None:
                        lon = val
                    elif 40.5 <= val <= 42.5 and lat is None:
                        lat = val
                    elif 25 <= val <= 3500 and capacity is None and raw_name:
                        capacity = int(round(val))
                    elif 1.0 <= val <= 12.0 and tariff is None and raw_name:
                        tariff = val
                    elif not obra_actual and not raw_name and val == int(val):
                        obra_actual = str(int(val))
                        obra_anterior = obra_anterior or obra_actual
                else:
                    text_cells.append(cell)

            if text_cells:
                raw_name = text_cells[0]
                if len(text_cells) > 1:
                    address = text_cells[1]
                if len(text_cells) > 2:
                    for t in text_cells[2:]:
                        if len(t) <= 3 and not status_flag:
                            status_flag = t
                        elif not district:
                            district = t

    # Corregir si X e Y vinieron invertidos
    if lon is not None and lat is not None and 40.0 <= lon <= 43.0 and 1.0 <= lat <= 3.5:
        lon, lat = lat, lon

    raw_name = re.sub(r'""+', '"', (raw_name or address or f"Aparcamiento {idx}")).strip()
    if not raw_name:
        return None

    clean_address = re.sub(r'""+', '"', (address or raw_name)).strip()
    inferred_district = district or infer_district_from_text_and_coords(raw_name, clean_address, lat, lon)

    if lat is None or lon is None:
        lat, lon = infer_coords_from_name(raw_name, inferred_district)

    elevation, slope = infer_topography(inferred_district, lat)

    # Regla real-data-only: No inventar plazas ni tarifas. Si no vienen en el archivo, su valor es 0
    capacity = int(capacity) if (capacity is not None and int(capacity) > 0) else 0
    tariff = round(float(tariff), 2) if (tariff is not None and float(tariff) > 0) else 0.0

    display_name = raw_name if re.match(r"^(nn\b|pk\.?\b|parking\b)", raw_name, re.I) else f"NN {raw_name}"
    code = str(obra_actual or obra_anterior or idx).strip()

    return {
        "id": f"obra_{code}_{idx}",
        "obra_anterior": str(obra_anterior or code),
        "obra_actual": str(obra_actual or code),
        "status": status_flag or "P",
        "name": display_name,
        "raw_name": raw_name,
        "district": inferred_district,
        "address": clean_address,
        "lat": round(float(lat), 7),
        "lon": round(float(lon), 7),
        "capacity": int(capacity),
        "tariff": float(tariff),
        "elevation": elevation,
        "slope": slope,
        "road_type": "distribuidora",
        "pass_through_base": 0.58,
        "dominant_profile": f"Cartera Activa ({inferred_district})",
        "pois_count": 0,
        "ev_chargers": 0
    }


def infer_district_from_text_and_coords(
    name: str,
    address: str = "",
    lat: Optional[float] = None,
    lon: Optional[float] = None
) -> str:
    """Infiere el distrito de Barcelona por código postal 080xx, calle o coordenadas WGS84."""
    combined = f"{name} {address}".lower()

    cp_match = re.search(r"\b080(\d{2})\b", combined)
    if cp_match:
        cp = f"080{cp_match.group(1)}"
        cp_map = {
            "08001": "Ciutat Vella", "08002": "Ciutat Vella", "08003": "Ciutat Vella",
            "08004": "Sants-Montjuïc", "08014": "Sants-Montjuïc", "08038": "Sants-Montjuïc",
            "08006": "Sarrià-Sant Gervasi", "08017": "Sarrià-Sant Gervasi",
            "08021": "Sarrià-Sant Gervasi", "08022": "Sarrià-Sant Gervasi", "08034": "Sarrià-Sant Gervasi",
            "08007": "Eixample", "08008": "Eixample", "08009": "Eixample", "08010": "Eixample",
            "08011": "Eixample", "08013": "Eixample", "08015": "Eixample", "08025": "Eixample", "08036": "Eixample", "08037": "Eixample",
            "08012": "Gràcia", "08024": "Gràcia",
            "08018": "Sant Martí / 22@", "08019": "Sant Martí / 22@", "08020": "Sant Martí / 22@", "08005": "Sant Martí / 22@",
            "08028": "Les Corts", "08029": "Les Corts",
        }
        if cp in cp_map:
            return cp_map[cp]

    if lat is not None and lon is not None:
        if lon < 2.138 and lat > 41.392:
            return "Sarrià-Sant Gervasi"
        if lon < 2.145 and lat <= 41.392:
            return "Les Corts"
        if lat < 41.378 and lon < 2.168:
            return "Sants-Montjuïc"
        if lat < 41.388 and lon > 2.168:
            return "Ciutat Vella"
        if lon > 2.182:
            return "Sant Martí / 22@"
        if lat > 41.400 and 2.145 <= lon <= 2.168:
            return "Gràcia"

    return infer_district_from_text(combined)


def infer_district_from_text(text: str) -> str:
    """Infiere el distrito de Barcelona a partir del texto."""
    t = text.lower()
    if any(k in t for k in ["sarrià", "sarria", "bonanova", "mandri", "ganduxer", "via augusta", "mitre", "pericot", "castanyer", "bertran", "calvet", "muntaner"]):
        return "Sarrià-Sant Gervasi"
    elif any(k in t for k in ["gràcia", "fontana", "lesseps", "joanic", "torrent de l'olla", "escorial", "travessera de gracia"]):
        return "Gràcia"
    elif any(k in t for k in ["diagonal", "francesc macià", "macia", "illa", "numància", "numancia", "camp nou", "corts", " Sabino", "caballero"]):
        return "Les Corts"
    elif any(k in t for k in ["glòries", "glories", "llacuna", "22@", "poblenou", "bogatell", "pallars", "marina", "sant martí", "taulat"]):
        return "Sant Martí / 22@"
    elif any(k in t for k in ["sants", "tarragona", "espanya", "paral·lel", "parallel", "blai", "montjuïc", "montjuic"]):
        return "Sants-Montjuïc"
    elif any(k in t for k in ["laietana", "ramblas", "rambla", "pelai", "catedral", "raval", "born", "gòtic", "gotic", "ciutat vella"]):
        return "Ciutat Vella"
    return "Eixample"


def infer_coords_from_name(name: str, district: str) -> Tuple[float, float]:
    """Genera coordenadas coherentes dentro del distrito correspondiente en Barcelona."""
    base_coords = {
        "Eixample": (41.3900, 2.1600),
        "Ciutat Vella": (41.3850, 2.1750),
        "Sarrià-Sant Gervasi": (41.4020, 2.1380),
        "Gràcia": (41.4050, 2.1550),
        "Les Corts": (41.3870, 2.1320),
        "Sant Martí / 22@": (41.3980, 2.1920),
        "Sants-Montjuïc": (41.3760, 2.1500)
    }
    b_lat, b_lon = base_coords.get(district, (41.3900, 2.1600))
    # Pequeña variación determinista basada en el hash del nombre
    h = sum(ord(c) for c in name) % 100
    jitter_lat = (h - 50) * 0.0001
    jitter_lon = ((h * 7) % 100 - 50) * 0.0001
    return round(b_lat + jitter_lat, 4), round(b_lon + jitter_lon, 4)


def infer_topography(district: str, lat: float) -> Tuple[float, float]:
    """Infiere cota ortométrica (msnm) y pendiente media (%) según el distrito de Barcelona."""
    if district == "Sarrià-Sant Gervasi":
        return 92.0, 5.8
    elif district == "Gràcia":
        return 72.0, 4.2
    elif district == "Les Corts":
        return 48.0, 1.8
    elif district == "Eixample":
        return 34.0, 1.3
    elif district == "Sants-Montjuïc":
        return 26.0, 1.1
    elif district == "Ciutat Vella":
        return 15.0, 0.7
    elif "Sant Martí" in district:
        return 10.0, 0.5
    return 30.0, 1.5


def generate_weekly_168h_profile(parking: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Genera las curvas de 24 horas para cada uno de los 7 días (Lunes a Domingo = 168 horas)."""
    days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    day_multipliers = [0.90, 0.95, 0.98, 1.04, 1.16, 1.10, 0.68]
    
    weekly_data = []
    for day_idx, (day_name, mult) in enumerate(zip(days, day_multipliers), start=1):
        hourly_series = []
        for h in range(24):
            res = calculate_latent_demand(parking, hour=h, day_of_week=day_idx)
            hourly_series.append({
                "hour": f"{h:02d}:00",
                "latent_demand": round(res["latent_demand_dl"] * mult),
                "gross_flow": res["gross_traffic_flow"],
                "cruising": round(res["cruising_vehicles"] * mult)
            })
        
        avg_dl = round(sum(item["latent_demand"] for item in hourly_series) / 24.0)
        max_dl = max(item["latent_demand"] for item in hourly_series)

        weekly_data.append({
            "day_index": day_idx,
            "day_name": day_name,
            "avg_latent_demand": avg_dl,
            "peak_latent_demand": max_dl,
            "hourly_series": hourly_series
        })
    return weekly_data


def generate_7day_forecast(parking: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Genera la predicción explicable a 7 días (t+1 a t+7) con insignias causales
    según el modelo aditivo: Base_168h + Clima + Eventos + Calendario.
    """
    forecast_days = [
        {"day": "t+1 (Sábado)", "rain": 0.0, "event": "festivo", "reason": "Apertura comercial Passeig de Gràcia (+35% flujo ocio)"},
        {"day": "t+2 (Domingo)", "rain": 0.0, "event": "none", "reason": "Patrón dominical familiar, alta rotación en restauración"},
        {"day": "t+3 (Lunes)", "rain": 0.0, "event": "none", "reason": "Apertura laboral y retorno pendular metropolitano"},
        {"day": "t+4 (Martes)", "rain": 4.5, "event": "none", "reason": "🌧️ Previsión lluvia 4.5 mm/h (+20% trasvase a parking cubierto)"},
        {"day": "t+5 (Miércoles)", "rain": 0.0, "event": "mwc", "reason": "💼 Congreso Fira Barcelona / MWC (+45% demanda terciaria)"},
        {"day": "t+6 (Jueves)", "rain": 0.0, "event": "mwc", "reason": "💼 Congreso Fira Barcelona / MWC + Noche de ocio"},
        {"day": "t+7 (Viernes)", "rain": 1.2, "event": "concert", "reason": "🎵 Gran Concierto Montjuïc + Salida laboral fin de semana"}
    ]

    results = []
    base_res = calculate_latent_demand(parking, hour=18)
    base_dl = base_res["latent_demand_dl"]

    for d in forecast_days:
        res = calculate_latent_demand(
            parking,
            weather_rain_mm=d["rain"],
            event_type=d["event"],
            hour=18
        )
        predicted_dl = res["latent_demand_dl"]
        upper_bound = round(predicted_dl * 1.12)
        lower_bound = round(predicted_dl * 0.88)

        results.append({
            "forecast_day": d["day"],
            "predicted_dl": predicted_dl,
            "upper_bound": upper_bound,
            "lower_bound": lower_bound,
            "rain_mm": d["rain"],
            "event": d["event"],
            "explanation": d["reason"],
            "uncaptured_revenue_day": res["uncaptured_daily_revenue_eur"]
        })
    return results
