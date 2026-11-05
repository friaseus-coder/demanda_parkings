"""
Consulta SQL directa a la tabla de auditoría DuckDB: sync_audit_log
"""

import os
import duckdb

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "databases", "db_traffic_bcn.duckdb")

def print_audit_log():
    con = duckdb.connect(DB_PATH)
    
    query = """
    SELECT 
        sync_id,
        strftime(sync_timestamp, '%d/%m/%Y %H:%M:%S') AS fecha_hora,
        sync_type,
        records_added,
        status,
        details
    FROM sync_audit_log
    ORDER BY sync_timestamp DESC;
    """
    
    rel = con.sql(query)
    print("\n--- HISTORIAL AUDITADO DE CONEXIONES Y SINCRONIZACIONES (sync_audit_log) ---")
    rel.show(max_width=120)

    # Resumen adicional del rango de datos cubiertos
    summary_query = """
    SELECT 
        MIN(record_date) AS fecha_inicio_2026,
        MAX(record_date) AS fecha_fin_2026,
        COUNT(DISTINCT record_date) AS dias_activos,
        COUNT(*) AS total_horas_computadas
    FROM traffic_cars_computed_2026;
    """
    print("\n--- COBERTURA TEMPORAL ACTIVA EN 2026 ---")
    con.sql(summary_query).show(max_width=120)

    con.close()

if __name__ == "__main__":
    print_audit_log()

