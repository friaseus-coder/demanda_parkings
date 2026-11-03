# Catálogo de Fuentes de Datos a Coste Cero (0 €) y Scripts de Ingesta
## Modelado de Demanda Latente de Estacionamiento en Barcelona

Todo el modelo puede construirse **sin pagar licencias de datos comerciales, suscripciones a APIs de pago ni servidores cloud**, apoyándose en la directiva europea de datos abiertos (*Open Data Directive*), las leyes de transparencia de Cataluña y España, y herramientas analíticas *open source* de nivel corporativo.

---

## 1. Matriz de Fuentes Públicas 100% Gratuitas

| Dimensión | Fuente Oficial | Formato | Tipo de Acceso | Coste |
| :--- | :--- | :--- | :--- | :--- |
| **Aforos y congestión en tiempo real** | Open Data Ajuntament de Barcelona | CSV / JSON / CKAN API | Directo (Sin autenticación) | **0 €** |
| **Relación de tramos y lazos viarios** | Open Data Ajuntament de Barcelona | Shapefile / GeoJSON / CSV | Descarga directa | **0 €** |
| **Matrices O/D Telefonía Móvil** | MITMA (Min. de Transportes) | Apache Parquet (AWS S3) | Público (`--no-sign-request`) | **0 €** |
| **Regulación Àrea Blava / Verda** | Open Data Ajuntament de Barcelona | Shapefile / GeoJSON | Descarga directa | **0 €** |
| **Plazas DUM (Carga/Descarga)** | Geoportal B:SM / Open Data BCN | CSV / GeoJSON | Descarga directa | **0 €** |
| **Censo de Parkings Competidores** | Guia d'Equipaments BCN | CSV / GeoJSON | Descarga directa | **0 €** |
| **Censo Comercial en Planta Baja** | Cens d'Activitats Comercials BCN | CSV / Parquet | Descarga periódica | **0 €** |
| **Grafo Peatonal y Viario** | OpenStreetMap / Geofabrik | `.osm.pbf` | Descarga directa | **0 €** |
| **Topografía / MDT (2x2 m)** | Institut Cartogràfic i Geològic (ICGC) | GeoTIFF / WCS | Descarga abierta | **0 €** |
| **Meteorología Histórica y Real** | Dades Obertes Gencat / AEMET | JSON / REST API | Clave de API gratuita | **0 €** |
| **Eventos, Ferias y Festividades** | Agenda d'Actes BCN / Fira BCN | iCal / JSON / RSS | Scraping / CKAN | **0 €** |

---

## 2. Acceso Detallado a Cada Fuente y Métodos de Descarga

### 2.1. Tráfico, Aforos y Tramos (Open Data BCN)
El Ayuntamiento de Barcelona publica a través de su portal de datos abiertos el estado del tráfico cada 5 minutos y los aforos sistemáticos.
* **Portal web:** `https://opendata-ajuntament.barcelona.cat/`
* **Autenticación requerida:** Ninguna. Acceso anónimo libre.
* **Endpoints y recursos directos:**
  1. *Relación de tramos de tráfico de la ciudad:*
     ```bash
     curl -O "https://opendata-ajuntament.barcelona.cat/data/dataset/transit-relacio-trams/resource/relacio-trams.csv"
     ```
  2. *Estado de tráfico en tiempo real (actualización cada 5 min):*
     ```bash
     curl -O "https://opendata-ajuntament.barcelona.cat/data/dataset/transit-informacio-trams/resource/informacio-trams.json"
     ```
  3. *Aforamientos históricos por lazo:* Disponibles en el catálogo en formato CSV mensual consolidado.

---

### 2.2. Matrices O/D de Telefonía Móvil (MITMA / Min. de Transportes)
El Ministerio publica los estudios de movilidad con tecnología Big Data (registro de eventos de antenas de telefonía de operadoras móviles en toda España, desagregados a nivel de distrito y sección censal).
* **Portal web:** `https://www.transportes.gob.es/ministerio/proyectos-singulares/estudios-de-movilidad-con-big-data`
* **Repositorio de descarga directa:** Los archivos se alojan en un *bucket* público de Amazon S3 gestionado por el ministerio.
* **Coste:** 0 € (no se requiere cuenta de AWS de pago).
* **Cómo descargar sin coste:** Utilizando el cliente oficial de AWS o Python con el parámetro público `--no-sign-request`:
  ```bash
  # Listar particiones disponibles de movilidad diaria
  aws s3 ls s3://mitma-movilidad-bigdata/ --no-sign-request
  
  # Descargar viajes de un mes completo en formato columnar Parquet (ejemplo)
  aws s3 cp s3://mitma-movilidad-bigdata/2023/parquet/ s3_data/ --recursive --no-sign-request --exclude "*" --include "*distritos*"
  ```

---

### 2.3. Topografía de Alta Resolución: MDT 2x2m (ICGC)
Para calcular las pendientes exactas de la función de Tobler en Sarrià, Vallcarca, Guinardó o Montjuïc, el Instituto Cartográfico y Geológico de Cataluña distribuye el Modelo Digital de Elevaciones a malla de 2 metros de resolución de forma abierta bajo licencia CC-BY 4.0.
* **Portal web:** `https://www.icgc.cat/es/Descargas/Elevaciones/Modelo-digital-del-terreno-MDT`
* **Formato:** GeoTIFF de 32 bits de coma flotante.
* **Descarga directa:** Vía el visor de descargas del ICGC o mediante su servidor WCS (*Web Coverage Service*) gratuito para recortar únicamente el término municipal de Barcelona:
  ```bash
  # Descarga del bloque del término municipal de Barcelona
  curl -o mdt_barcelona_2m.tif "https://geoserveis.icgc.cat/serveis/wcs?SERVICE=WCS&VERSION=1.0.0&REQUEST=GetCoverage&COVERAGE=mdt2m&CRS=EPSG:25831&BBOX=420000,4575000,436000,4592000&WIDTH=8000&HEIGHT=8500&FORMAT=GeoTIFF"
  ```

---

### 2.4. Grafo Urbano y Peatonal (OpenStreetMap / Geofabrik)
Para modelar las calles, aceras, escaleras mecánicas públicas (como las de Gràcia y Guinardó) y pasos peatonales, OpenStreetMap ofrece la red más detallada de Barcelona.
* **Portal web:** `https://download.geofabrik.de/europe/spain/cataluna.html`
* **Formato:** Protocolbuffer Binary Format (`.osm.pbf`).
* **Descarga directa:**
  ```bash
  curl -O "https://download.geofabrik.de/europe/spain/cataluna-latest.osm.pbf"
  ```
* **Extracción local con Python (gratis):** Con la librería `osmnx` no necesitas descargar todo el archivo de Cataluña; puedes descargar y cachear el subgrafo de Barcelona en 30 segundos sin coste alguno.

---

### 2.5. Plazas en Superficie, DUM y Parkings Competidores (Open Data BCN)
Para calcular el déficit en superficie ($\Delta D\acute{e}ficit_{sup}$) y la oferta competidora fuera de calzada:
1. **Regulación de Estacionamiento en Superficie (Àrea Verda / Blava):**
   * Contiene la geometría exacta, número de plazas por tramo, horario y tarifa asignada.
   * Dataset: `estacionament-regulat-en-calcada`
2. **Distribución Urbana de Mercancías (DUM / Carga y Descarga):**
   * Localización de las plazas de carga y descarga gestionadas por el aplicativo municipal SPRO.
   * Dataset: `estacionament-places-dum`
3. **Equipamientos de Aparcamiento (Competencia):**
   * Registro oficial de todos los parkings públicos y privados subterráneos con capacidad declarada y operador (B:SM, Saba, Interparking, parkings de concesión o privados).
   * Dataset: `aparcaments-ciutat-barcelona`

---

### 2.6. Censo Comercial y Atractores de Demanda
Para calibrar la fuerza gravitatoria del modelo Huff (oficinas, restauración, comercio minorista, centros de salud):
* **Dataset:** *Cens d'activitats comercials a peu de carrer de la ciutat de Barcelona*.
* **Contenido:** Cada local comercial geolocalizado en coordenadas UTM/ETRS89, clasificado por código sectorial (hostelería, supermercados, moda, servicios profesionales, equipamientos sanitarios).
* **Descarga:** Archivo CSV único de $\approx 80.000$ filas, actualizado anualmente por la Dirección de Comercio del Ayuntamiento.

---

### 2.7. Meteorología de Precisión (0 €)
La lluvia dispara de forma inmediata el uso del vehículo privado en Barcelona y satura los parkings subterráneos.
* **Opción A (AEMET OpenData):** Clave de API 100% gratuita solicitándola en `https://opendata.aemet.es/centrodedescargas/altaUsuario`. Entrega series horarias de la estación del Observatori Fabra, el Aeropuerto y el Puerto de Barcelona.
* **Opción B (Dades Obertes Gencat - Meteocat XEMA):**
  * Portal: `https://dadesobertes.gencat.cat/`
  * Dataset: *Dades meteorològiques de la Xarxa d'Estacions Meteorològiques Automàtiques (XEMA)*.
  * Formato: API Socrata / CSV sin límite de peticiones ni coste.

---

## 3. Script Python de Descarga Masiva Automatizada

El siguiente script en Python descarga automáticamente los datasets principales de Open Data BCN sin requerir credenciales ni tokens de pago:

```python
"""
Automatización de Descarga de Datos Gratuitos - Barcelona Parking Latent Demand
Ejecución en local a coste cero.
"""

from pathlib import Path
import urllib.request
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

OUTPUT_DIR = Path("./datos_barcelona_raw")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DATASETS = {
    # Relación de tramos viarios y sensores
    "relacio_trams.csv": "https://opendata-ajuntament.barcelona.cat/data/dataset/transit-relacio-trams/resource/relacio-trams.csv",
    # Estado del tráfico en tiempo real (instantánea)
    "estat_transit.json": "https://opendata-ajuntament.barcelona.cat/data/dataset/transit-informacio-trams/resource/informacio-trams.json",
    # Geometría y regulación del estacionamiento en calzada (Àrea Blava y Verda)
    "regulacio_estacionament.geojson": "https://opendata-ajuntament.barcelona.cat/data/dataset/estacionament-regulat-en-calcada/resource/estacionament-regulat.geojson",
    # Directorio de parkings subterráneos (oferta competidora)
    "parkings_equipaments.json": "https://opendata-ajuntament.barcelona.cat/data/dataset/aparcaments-ciutat-barcelona/resource/aparcaments.json",
    # Censo de actividades comerciales en planta baja
    "cens_comercial.csv": "https://opendata-ajuntament.barcelona.cat/data/dataset/cens-activitats-comercials-peu-carrer/resource/cens-activitats.csv"
}

def download_open_datasets():
    for filename, url in DATASETS.items():
        destination = OUTPUT_DIR / filename
        logging.info(f"Descargando {filename} desde Open Data BCN...")
        try:
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            )
            with urllib.request.urlopen(req) as response, open(destination, 'wb') as out_file:
                out_file.write(response.read())
            logging.info(f"-> Guardado correctamente: {destination.resolve()} ({destination.stat().st_size / (1024*1024):.2f} MB)")
        except Exception as e:
            logging.error(f"Fallo al descargar {filename}: {e}")

if __name__ == "__main__":
    download_open_datasets()
```

---

## 4. Estrategia de Mantenimiento Histórico Continuo a 0 €

Dado que necesitas construir un **histórico del último año** y el portal de tiempo real de Open Data BCN refresca cada 5 minutos sobreescribiendo el fichero:

1. **Para el histórico ya pasado (últimos 12 meses):** Descargar los archivos CSV mensuales consolidados de aforos y tramos que Open Data BCN archiva en el repositorio histórico municipal.
2. **Para acumular el histórico diario a futuro sin coste:**
   * Configurar una tarea programada local (*Cron* en Linux/macOS o el *Programador de Tareas* de Windows).
   * Ejecutar cada 5 o 15 minutos un script ligero que lea el JSON de estado de tramos y lo guarde en una base de datos local **DuckDB** o en archivos Parquet particionados por fecha:
     $$\text{Ruta: } \texttt{./data/raw\_traffic/year=2024/month=10/day=15/trams\_1230.parquet}$$
   * Con esta arquitectura, un año entero de lecturas de los $\approx 550$ tramos de Barcelona ocupa menos de **3.5 GB en disco**, sin necesidad de pagar ningún servicio de base de datos en la nube.