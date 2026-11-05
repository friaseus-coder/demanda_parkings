"""
Exportador Unificado DuckDB a Snapshot Web (ATTACH DATABASE)
Cruza las 4 bases de datos independientes mediante SQL analítico en DuckDB:
- db_traffic_bcn.duckdb
- db_commercial_census.duckdb
- db_events_bcn.duckdb
- db_weather_topography.duckdb
Y genera js/bcn_real_sensors.js para consumo a 0 ms por el frontend.
"""

import os
import json
import duckdb
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_DIR = os.path.join(BASE_DIR, "data", "databases")
TARGET_JS = os.path.join(BASE_DIR, "js", "bcn_real_sensors.js")

def export_duckdb_to_snapshot():
    print("=== EXPORTANDO ECOSISTEMA DUCKDB A SNAPSHOT LOCAL ===")
    # Conectamos a una sesión en memoria y vinculamos (ATTACH) las 4 bases de datos
    con = duckdb.connect()

    traffic_db = os.path.join(DB_DIR, "db_traffic_bcn.duckdb")
    census_db = os.path.join(DB_DIR, "db_commercial_census.duckdb")
    events_db = os.path.join(DB_DIR, "db_events_bcn.duckdb")
    weather_db = os.path.join(DB_DIR, "db_weather_topography.duckdb")

    con.execute(f"ATTACH '{traffic_db}' AS traffic;")
    con.execute(f"ATTACH '{census_db}' AS census;")
    con.execute(f"ATTACH '{events_db}' AS events;")
    con.execute(f"ATTACH '{weather_db}' AS weather;")

    print("1. Leyendo catálogo de estaciones y series 2024-2025...")
    stations = con.execute("""
        SELECT station_id, description, num_lanes, latitude, longitude, avg_imd_2025
        FROM traffic.traffic_stations_catalog
        ORDER BY station_id;
    """).fetchall()

    stations_list = [
        {
            "id": r[0],
            "desc": r[1],
            "lanes": r[2],
            "lat": r[3],
            "lon": r[4],
            "avgImd2025": int(r[5]) if r[5] else 0
        }
        for r in stations
    ]

    print("2. Leyendo matriz de calibración empírica 2025...")
    calibs = con.execute("""
        SELECT station_id, traffic_state_id, traffic_state_name, avg_cars_hour_2025
        FROM traffic.traffic_state_calibration_2025
        ORDER BY station_id, traffic_state_id;
    """).fetchall()

    calibration_map = {}
    for r in calibs:
        sid, st_id, name, val = r[0], r[1], r[2], int(r[3])
        if sid not in calibration_map:
            calibration_map[sid] = {}
        calibration_map[sid][str(st_id)] = {
            "name": name,
            "carsHour": val
        }

    print("3. Leyendo coches computados de 2026 (por hora y día)...")
    computed_rows = con.execute("""
        SELECT station_id, record_date, hour_of_day, traffic_state_id, cars_hour, cars_day_accumulated
        FROM traffic.traffic_cars_computed_2026
        ORDER BY record_date, hour_of_day;
    """).fetchall()

    computed_2026 = {}
    for r in computed_rows:
        sid, r_date, hour, st_id, cars_h, cars_d = r[0], str(r[1]), r[2], r[3], r[4], r[5]
        if sid not in computed_2026:
            computed_2026[sid] = {}
        if r_date not in computed_2026[sid]:
            computed_2026[sid][r_date] = {
                "dailyCars": cars_d,
                "hourlyCars": [0] * 24,
                "states": [0] * 24
            }
        computed_2026[sid][r_date]["hourlyCars"][hour] = cars_h
        computed_2026[sid][r_date]["states"][hour] = st_id

    print("4. Leyendo recintos y eventos oficiales...")
    events_rows = con.execute("""
        SELECT event_id, name, category, venue_id, venue_name, start_date, start_time, expected_attendance, ticket_status, source, latitude, longitude
        FROM events.events_schedule
        ORDER BY start_date;
    """).fetchall()

    events_list = [
        {
            "id": r[0],
            "title": r[1],
            "category": r[2],
            "venueId": r[3],
            "venueName": r[4],
            "date": str(r[5]),
            "time": str(r[6])[:5] if r[6] else "20:00",
            "expectedAttendance": r[7],
            "ticketStatus": r[8],
            "source": r[9],
            "lat": r[10],
            "lon": r[11]
        }
        for r in events_rows
    ]

    print("5. Construyendo objeto unificado auditado...")
    now_dt = datetime.now()
    snapshot_payload = {
        "version": "v2026.duckdb",
        "versionLabel": f"DuckDB Modular · Sincronizado {now_dt.strftime('%d/%m/%Y %H:%M')}",
        "generatedAt": now_dt.isoformat(),
        "snapshotDate": now_dt.strftime("%Y-%m-%d"),
        "snapshotFormatted": now_dt.strftime("%d/%m/%Y %H:%M"),
        "databases": {
            "traffic": "db_traffic_bcn.duckdb",
            "commercial": "db_commercial_census.duckdb",
            "events": "db_events_bcn.duckdb",
            "weather": "db_weather_topography.duckdb"
        },
        "totalActiveStations": len(stations_list),
        "totalCalibratedPairs": len(calibs),
        "totalEvents": len(events_list),
        "stationsCatalog": stations_list,
        "calibration2025": calibration_map,
        "computed2026": computed_2026,
        "eventsSchedule": events_list
    }

    # Leer el archivo original si existe para preservar compatibilidad con variables existentes
    series24 = {}
    series25 = {}
    series26 = {}
    orig_src = os.path.join(BASE_DIR, "scratch", "bcn_real_sensors_data.json")
    if os.path.exists(orig_src):
        with open(orig_src, "r", encoding="utf-8") as f:
            orig = json.load(f)
            series24 = orig.get("series2024", {})
            series25 = orig.get("series2025", {})
            snapshot_payload["series2024"] = series24
            snapshot_payload["series2025"] = series25
            snapshot_payload["parkingSensorsMap"] = orig.get("parkingSensorsMap", {})

    DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    for sid, s25 in series25.items():
        s24 = series24.get(sid, {})
        m25 = s25.get("monthlyImd", [0] * 12)
        m24 = s24.get("monthlyImd", m25)
        m26 = []
        for m in range(12):
            v25 = m25[m] if m < len(m25) else 0
            v24 = m24[m] if m < len(m24) else 0
            if v25 <= 0:
                m26.append(0)
            elif v24 <= 0:
                m26.append(v25)
            else:
                g = (v25 - v24) / v24
                m26.append(max(0, round(v25 * (1 + 0.75 * g))))
        annual = sum(m26[m] * DAYS_IN_MONTH[m] for m in range(12))
        series26[sid] = {
            "stationId": sid,
            "monthlyImd": m26,
            "annualCars": annual,
            "monthlyByDayType": s25.get("monthlyByDayType", {}),
            "avgByDay": s25.get("avgByDay", {})
        }
    snapshot_payload["series2026"] = series26

    js_content = f"""// Ecosistema DuckDB Modular · Catálogo Oficial de Aforos, Calibración 2025 y Demanda 2026
// Generado automáticamente desde las 4 bases de datos DuckDB independientes:
// - db_traffic_bcn.duckdb
// - db_commercial_census.duckdb
// - db_events_bcn.duckdb
// - db_weather_topography.duckdb

window.BCN_PRECOMPUTED_REAL_TRAFFIC = {json.dumps(snapshot_payload, indent=2)};
"""

    with open(TARGET_JS, "w", encoding="utf-8") as f:
        f.write(js_content)

    con.close()
    print(f"=== SNAPSHOT JS EXPORTADO EXITOSAMENTE A {TARGET_JS} ===")

if __name__ == "__main__":
    export_duckdb_to_snapshot()

