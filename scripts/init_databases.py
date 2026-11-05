"""
Inicialización del Ecosistema Modular DuckDB (Una Base de Datos por cada API)
- db_traffic_bcn.duckdb (Aforos, Tramos, Estados de Tráfico y Coches Computados)
- db_commercial_census.duckdb (Censo Comercial en Planta Baja)
- db_events_bcn.duckdb (Eventos Oficiales: Camp Nou, Palau Sant Jordi, Fira)
- db_weather_topography.duckdb (Cotas de Elevación DEM, Pendientes Tobler y Precipitación)
"""

import os
import duckdb

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "databases")
os.makedirs(DATA_DIR, exist_ok=True)

def init_traffic_db():
    db_path = os.path.join(DATA_DIR, "db_traffic_bcn.duckdb")
    print(f"[1/4] Inicializando {db_path}...")
    con = duckdb.connect(db_path)
    
    # 1. Catálogo de estaciones de aforo oficiales
    con.execute("""
    CREATE TABLE IF NOT EXISTS traffic_stations_catalog (
        station_id VARCHAR PRIMARY KEY,
        description VARCHAR,
        num_lanes INTEGER DEFAULT 1,
        latitude DOUBLE NOT NULL,
        longitude DOUBLE NOT NULL,
        road_type_code VARCHAR DEFAULT '1',
        avg_imd_2025 NUMERIC,
        is_active BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Lecturas mensuales auditadas de aforo (2024 y 2025)
    con.execute("""
    CREATE TABLE IF NOT EXISTS traffic_station_readings (
        station_id VARCHAR NOT NULL,
        year SMALLINT NOT NULL,
        month SMALLINT NOT NULL,
        day_type_code VARCHAR NOT NULL,
        day_type_desc VARCHAR,
        imd_value NUMERIC NOT NULL,
        source_resource_id VARCHAR,
        is_real BOOLEAN DEFAULT TRUE,
        PRIMARY KEY (station_id, year, month, day_type_code)
    );
    """)

    # 3. Matriz de Calibración Empírica 2025: ¿Cuántos coches reales significó cada estado en 2025?
    con.execute("""
    CREATE TABLE IF NOT EXISTS traffic_state_calibration_2025 (
        station_id VARCHAR NOT NULL,
        traffic_state_id SMALLINT NOT NULL,
        traffic_state_name VARCHAR NOT NULL,
        avg_cars_hour_2025 NUMERIC NOT NULL,
        median_cars_hour_2025 NUMERIC NOT NULL,
        hours_observed_2025 INTEGER DEFAULT 0,
        calibrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (station_id, traffic_state_id)
    );
    """)

    # 4. Estados de tráfico registrados cada día y hora en 2026
    con.execute("""
    CREATE TABLE IF NOT EXISTS traffic_states_2026 (
        station_id VARCHAR NOT NULL,
        record_date DATE NOT NULL,
        hour_of_day SMALLINT NOT NULL,
        traffic_state_id SMALLINT NOT NULL,
        source_tram_id INTEGER,
        ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (station_id, record_date, hour_of_day)
    );
    """)

    # 5. Coches computados en 2026 (Estado 2026 * Calibración 2025)
    con.execute("""
    CREATE TABLE IF NOT EXISTS traffic_cars_computed_2026 (
        station_id VARCHAR NOT NULL,
        record_date DATE NOT NULL,
        hour_of_day SMALLINT NOT NULL,
        traffic_state_id SMALLINT NOT NULL,
        cars_hour INTEGER NOT NULL,
        cars_day_accumulated INTEGER,
        is_real_observed BOOLEAN DEFAULT TRUE,
        computation_status VARCHAR DEFAULT 'calibrated_from_2025',
        PRIMARY KEY (station_id, record_date, hour_of_day)
    );
    """)

    # Registro de auditoría de sincronizaciones
    con.execute("""
    CREATE TABLE IF NOT EXISTS sync_audit_log (
        sync_id INTEGER PRIMARY KEY,
        sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        records_added INTEGER,
        sync_type VARCHAR,
        status VARCHAR,
        details VARCHAR
    );
    """)

    con.close()
    print("  -> db_traffic_bcn.duckdb inicializada con éxito.")

def init_commercial_census_db():
    db_path = os.path.join(DATA_DIR, "db_commercial_census.duckdb")
    print(f"[2/4] Inicializando {db_path}...")
    con = duckdb.connect(db_path)
    
    con.execute("""
    CREATE TABLE IF NOT EXISTS commercial_activities_raw (
        license_id VARCHAR PRIMARY KEY,
        activity_code VARCHAR,
        activity_name VARCHAR,
        street_name VARCHAR,
        district_code VARCHAR,
        latitude DOUBLE,
        longitude DOUBLE,
        is_active BOOLEAN DEFAULT TRUE
    );
    """)

    con.execute("""
    CREATE TABLE IF NOT EXISTS parking_poi_gravity (
        parking_id VARCHAR PRIMARY KEY,
        pois_300m_count INTEGER DEFAULT 0,
        pois_500m_count INTEGER DEFAULT 0,
        commercial_gravity_index NUMERIC DEFAULT 0.0,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    con.close()
    print("  -> db_commercial_census.duckdb inicializada con éxito.")

def init_events_db():
    db_path = os.path.join(DATA_DIR, "db_events_bcn.duckdb")
    print(f"[3/4] Inicializando {db_path}...")
    con = duckdb.connect(db_path)
    
    con.execute("""
    CREATE TABLE IF NOT EXISTS venues_catalog (
        venue_id VARCHAR PRIMARY KEY,
        venue_name VARCHAR NOT NULL,
        category VARCHAR,
        latitude DOUBLE NOT NULL,
        longitude DOUBLE NOT NULL,
        max_capacity INTEGER
    );
    """)

    con.execute("""
    CREATE TABLE IF NOT EXISTS events_schedule (
        event_id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        category VARCHAR NOT NULL,
        venue_id VARCHAR,
        venue_name VARCHAR,
        start_date DATE NOT NULL,
        start_time TIME,
        end_date DATE,
        expected_attendance INTEGER NOT NULL,
        ticket_status VARCHAR,
        source VARCHAR DEFAULT 'Open Data BCN / Gencat',
        latitude DOUBLE,
        longitude DOUBLE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    con.close()
    print("  -> db_events_bcn.duckdb inicializada con éxito.")

def init_weather_db():
    db_path = os.path.join(DATA_DIR, "db_weather_topography.duckdb")
    print(f"[4/4] Inicializando {db_path}...")
    con = duckdb.connect(db_path)
    
    con.execute("""
    CREATE TABLE IF NOT EXISTS parking_elevation (
        parking_id VARCHAR PRIMARY KEY,
        elevation_meters NUMERIC NOT NULL,
        slope_pct NUMERIC DEFAULT 0.0,
        tobler_speed_kmh NUMERIC DEFAULT 5.0,
        tobler_friction_factor NUMERIC DEFAULT 1.0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    con.execute("""
    CREATE TABLE IF NOT EXISTS weather_daily_records (
        record_date DATE PRIMARY KEY,
        temp_max_c NUMERIC,
        temp_min_c NUMERIC,
        precipitation_mm NUMERIC DEFAULT 0.0,
        rain_multiplier NUMERIC DEFAULT 1.0,
        is_forecast BOOLEAN DEFAULT FALSE,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    con.close()
    print("  -> db_weather_topography.duckdb inicializada con éxito.")

if __name__ == "__main__":
    print("=== INICIALIZANDO ECOSISTEMA DUCKDB MODULAR ===")
    init_traffic_db()
    init_commercial_census_db()
    init_events_db()
    init_weather_db()
    print("=== TODAS LAS BASES DE DATOS DUCKDB CREADAS CORRECTAMENTE ===")

