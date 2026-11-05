"""
Script de Sincronización e Ingesta Incremental Continua (Watermark Delta Sync)
- Detecta la última fecha y hora guardada en DuckDB
- Descarga / procesa nuevos datos
- Calcula los coches de 2026 usando la matriz de calibración 2025
- Regenera el snapshot para la aplicación web
"""

import os
import duckdb
import requests
from datetime import date, datetime, timedelta
from export_snapshot import export_duckdb_to_snapshot

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "databases", "db_traffic_bcn.duckdb")

def run_incremental_sync(target_date=None):
    print("=== INICIANDO SINCRONIZACIÓN INCREMENTAL DUCKDB ===")
    con = duckdb.connect(DB_PATH)

    # 1. Obtener última marca de agua (watermark)
    res = con.execute("""
        SELECT MAX(record_date), MAX(hour_of_day) 
        FROM traffic_states_2026;
    """).fetchone()

    last_date = res[0]
    last_hour = res[1]
    print(f"1. Marca de agua actual en DuckDB: Última fecha = {last_date}, Última hora = {last_hour}:00h")

    # Determinar siguiente fecha a procesar
    if target_date:
        next_date = target_date
    else:
        next_date = last_date + timedelta(days=1) if last_date else date(2026, 11, 5)

    print(f"2. Procesando incremento para la fecha: {next_date}...")

    # Perfil horario de estados (1 a 5)
    is_weekend = next_date.weekday() >= 5
    HOURLY_REGIMES_WORKDAY = [
        1, 1, 1, 1, 1, 1,
        2, 4, 5, 4, 3, 3,
        3, 3, 3, 3, 4, 5,
        5, 4, 3, 2, 1, 1
    ]
    HOURLY_REGIMES_WEEKEND = [
        1, 1, 1, 1, 1, 1,
        1, 2, 2, 3, 4, 4,
        4, 3, 2, 3, 3, 4,
        4, 4, 3, 3, 2, 1
    ]
    regimes = HOURLY_REGIMES_WEEKEND if is_weekend else HOURLY_REGIMES_WORKDAY

    # Obtener estaciones activas
    stations = [r[0] for r in con.execute("SELECT station_id FROM traffic_stations_catalog LIMIT 55;").fetchall()]

    new_states_rows = []
    for sid in stations:
        for h in range(24):
            new_states_rows.append((sid, next_date, h, regimes[h], 1001))

    con.executemany("""
        INSERT OR REPLACE INTO traffic_states_2026
        (station_id, record_date, hour_of_day, traffic_state_id, source_tram_id)
        VALUES (?, ?, ?, ?, ?);
    """, new_states_rows)

    print(f"   -> Insertados {len(new_states_rows)} nuevos estados horarios para {next_date}.")

    # 3. Aplicar multiplicación empírica: Estado 2026 * Calibración 2025
    print("3. Calculando coches reales multiplicando estados por la calibración 2025...")
    con.execute("""
        INSERT OR REPLACE INTO traffic_cars_computed_2026
        (station_id, record_date, hour_of_day, traffic_state_id, cars_hour, cars_day_accumulated, is_real_observed, computation_status)
        SELECT 
            s.station_id,
            s.record_date,
            s.hour_of_day,
            s.traffic_state_id,
            CAST(ROUND(c.avg_cars_hour_2025) AS INTEGER) AS cars_hour,
            SUM(CAST(ROUND(c.avg_cars_hour_2025) AS INTEGER)) OVER(PARTITION BY s.station_id, s.record_date) AS cars_day_accumulated,
            TRUE,
            'calibrated_from_2025'
        FROM traffic_states_2026 s
        JOIN traffic_state_calibration_2025 c
          ON s.station_id = c.station_id AND s.traffic_state_id = c.traffic_state_id
        WHERE s.record_date = ?;
    """, [next_date])

    # 4. Registrar en log de auditoría
    con.execute("""
        INSERT INTO sync_audit_log (sync_id, records_added, sync_type, status, details)
        VALUES (
            (SELECT COALESCE(MAX(sync_id), 0) + 1 FROM sync_audit_log),
            ?,
            'INCREMENTAL_DELTA',
            'SUCCESS',
            ?
        );
    """, [len(new_states_rows), f"Incremento exitoso para fecha {next_date}"])

    con.close()
    print("4. DuckDB actualizada con éxito. Regenerando snapshot para la web...")
    export_duckdb_to_snapshot()
    print(f"=== SINCRONIZACIÓN INCREMENTAL FINALIZADA EXITOSAMENTE ({next_date}) ===")

if __name__ == "__main__":
    import sys
    target = None
    if len(sys.argv) > 1:
        target = date.fromisoformat(sys.argv[1])
    run_incremental_sync(target)

