"""
Monitor de Estado y Última Conexión / Sincronización DuckDB
Muestra en consola:
- Última fecha y hora de conexión registrada en sync_audit_log
- Rango de fechas cubierto en DuckDB
- Estado y tamaño de cada una de las 4 bases de datos
"""

import os
import duckdb
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_DIR = os.path.join(BASE_DIR, "data", "databases")

def check_status():
    print("=" * 65)
    print("       ESTADO DE CONEXIÓN Y AUDITORÍA DE BASES DE DATOS DUCKDB")
    print("=" * 65)

    traffic_db = os.path.join(DB_DIR, "db_traffic_bcn.duckdb")
    census_db = os.path.join(DB_DIR, "db_commercial_census.duckdb")
    events_db = os.path.join(DB_DIR, "db_events_bcn.duckdb")
    weather_db = os.path.join(DB_DIR, "db_weather_topography.duckdb")

    # 1. Auditoría de db_traffic_bcn.duckdb
    if os.path.exists(traffic_db):
        con = duckdb.connect(traffic_db)
        
        # Última sincronización en log
        last_log = con.execute("""
            SELECT sync_id, sync_timestamp, records_added, sync_type, details 
            FROM sync_audit_log 
            ORDER BY sync_timestamp DESC 
            LIMIT 1;
        """).fetchone()

        # Última fecha y hora de coches calculados en 2026
        max_traffic = con.execute("""
            SELECT MAX(record_date), MAX(hour_of_day), COUNT(DISTINCT record_date), COUNT(*)
            FROM traffic_cars_computed_2026;
        """).fetchone()

        stations_count = con.execute("SELECT COUNT(*) FROM traffic_stations_catalog;").fetchone()[0]
        calib_count = con.execute("SELECT COUNT(*) FROM traffic_state_calibration_2025;").fetchone()[0]

        print("\n[1] BASE DE DATOS DE TRÁFICO (db_traffic_bcn.duckdb):")
        if last_log:
            ts_str = last_log[1].strftime("%d/%m/%Y a las %H:%M:%S") if last_log[1] else "Desconocida"
            print(f"    • Última conexión/sync:  {ts_str}")
            print(f"    • Tipo de sincronización: {last_log[3]}")
            print(f"    • Registros añadidos:     {last_log[2]}")
            print(f"    • Detalle:                {last_log[4]}")
        else:
            print("    • Sin registros de sincronización previos.")

        if max_traffic and max_traffic[0]:
            print(f"    • Último dato de 2026:    {max_traffic[0]} a las {max_traffic[1]:02d}:00h")
            print(f"    • Días activos en 2026:   {max_traffic[2]} días ({max_traffic[3]} horas calculadas)")
        print(f"    • Estaciones en catálogo: {stations_count} oficiales")
        print(f"    • Calibraciones activas:  {calib_count} pares (estación, estado)")
        con.close()
    else:
        print("\n[1] db_traffic_bcn.duckdb: NO ENCONTRADA")

    # 2. Censo Comercial
    if os.path.exists(census_db):
        con = duckdb.connect(census_db)
        count = con.execute("SELECT COUNT(*) FROM parking_poi_gravity;").fetchone()[0]
        mtime = datetime.fromtimestamp(os.path.getmtime(census_db)).strftime("%d/%m/%Y a las %H:%M:%S")
        print(f"\n[2] CENSO COMERCIAL (db_commercial_census.duckdb):")
        print(f"    • Última actualización:   {mtime}")
        print(f"    • Parkings con densidad:  {count} activos analizados")
        con.close()

    # 3. Eventos
    if os.path.exists(events_db):
        con = duckdb.connect(events_db)
        ev_count = con.execute("SELECT COUNT(*) FROM events_schedule;").fetchone()[0]
        max_ev = con.execute("SELECT MAX(start_date) FROM events_schedule;").fetchone()[0]
        mtime = datetime.fromtimestamp(os.path.getmtime(events_db)).strftime("%d/%m/%Y a las %H:%M:%S")
        print(f"\n[3] EVENTOS Y RECINTOS (db_events_bcn.duckdb):")
        print(f"    • Última actualización:   {mtime}")
        print(f"    • Eventos programados:    {ev_count} macroeventos")
        print(f"    • Último evento en agenda:{max_ev}")
        con.close()

    # 4. Meteorología y Topografía
    if os.path.exists(weather_db):
        con = duckdb.connect(weather_db)
        topo_count = con.execute("SELECT COUNT(*) FROM parking_elevation;").fetchone()[0]
        weather_max = con.execute("SELECT MAX(record_date) FROM weather_daily_records;").fetchone()[0]
        mtime = datetime.fromtimestamp(os.path.getmtime(weather_db)).strftime("%d/%m/%Y a las %H:%M:%S")
        print(f"\n[4] METEOROLOGÍA Y TOPOGRAFÍA (db_weather_topography.duckdb):")
        print(f"    • Última actualización:   {mtime}")
        print(f"    • Parkings con cota DEM:  {topo_count} analizados")
        print(f"    • Cobertura meteorológica: hasta {weather_max}")
        con.close()

    # 5. Snapshot JS para el Navegador
    snapshot_path = os.path.join(BASE_DIR, "js", "bcn_real_sensors.js")
    if os.path.exists(snapshot_path):
        mtime = datetime.fromtimestamp(os.path.getmtime(snapshot_path)).strftime("%d/%m/%Y a las %H:%M:%S")
        size_kb = round(os.path.getsize(snapshot_path) / 1024, 1)
        print(f"\n[5] SNAPSHOT LOCAL WEB (js/bcn_real_sensors.js):")
        print(f"    • Generado el:            {mtime}")
        print(f"    • Tamaño en disco:        {size_kb} KB (consumo a 0ms en el navegador)")

    print("\n" + "=" * 65)

if __name__ == "__main__":
    check_status()

