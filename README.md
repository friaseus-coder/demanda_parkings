# NN Parkings · Analizador de Demanda Latente y Movilidad Urbana

Aplicación cliente de alta precisión para el análisis de demanda latente, captación de tráfico pasante, agitación viaria (*cruising*) y fricción peatonal (función de Tobler) en la red de aparcamientos de Núñez i Navarro en Barcelona.

---

## 🚀 Puesta en Marcha Inmediata (Sin Instalación)

La herramienta está diseñada para funcionar **directamente en el navegador** (Google Chrome o Microsoft Edge), tanto en un PC de trabajo como desde una memoria USB extraíble en la oficina.

1. **Hacer doble clic en `index.html`** para abrir la aplicación.
2. **Cargar el archivo de aparcamientos:**
   - Arrastra y suelta el archivo habitual (`coordenadas de los aparcamientos.xlsx` o `.csv`) en la zona de carga superior.
   - O pulsa **"Subir archivo XLSX/CSV"** y selecciona el archivo.
3. **Exploración interactiva:**
   - Visualiza en tiempo real los indicadores agregados de toda la cartera.
   - Haz clic en cualquier aparcamiento (ordenados numéricamente de menor a mayor) para inspeccionar su microtopografía, isocronas peatonales, gráfico de balance y aforo de los próximos 7 días.

> [!NOTE]
> **Cero dependencias:** No requiere instalación de Python, servidores locales ni terminales de consola. Todo se procesa en la memoria RAM del navegador mediante SheetJS (`js/vendor/xlsx.full.min.js`).

---

## 🔒 Confidencialidad y Modo Fuera de Línea

- **Computación 100% en Cliente:** Los datos de la cartera analizada se procesan íntegramente en la memoria de tu navegador y nunca se transmiten a servidores externos.
- **Resiliencia Offline:** El sistema incluye el catálogo base auditado de 29 aparcamientos y la red de sensores de aforo de Barcelona en `js/data.js`. Si no hay conexión a internet o los servidores municipales están en mantenimiento, el motor opera con total precisión sin interrumpir el flujo.

---

## 📁 Contrato del Archivo de Entrada

El archivo de entrada del usuario (`coordenadas de los aparcamientos.xlsx` o `.csv`) únicamente requiere columnas de identificación y posición geográfica:

| Campo / Columna | Descripción |
|---|---|
| `Obra Anterior` / `Obra Actual` | Identificador o código de la obra / aparcamiento (ej. `51`, `260`, `304`) |
| `Nombre de la Obra` | Denominación del activo (ej. `VALENCIA, 307 - 313`) |
| `X` / `Longitud` | Longitud geográfica en coordenadas decimales WGS84 (ej. `2.16788`) |
| `Y` / `Latitud` | Latitud geográfica en coordenadas decimales WGS84 (ej. `41.39616`) |

> [!IMPORTANT]
> **No se exige columna de plazas ni tarifas en el Excel:** El motor `js/engine.js` resuelve automáticamente la capacidad, cotas y parámetros operativos contrastándolos contra el catálogo de referencia auditado de la empresa (`js/data.js` / `core/portfolio_data.json`).

---

## 🏗️ Estructura del Repositorio

```

### Metodología de Aforo e Inferencia Empírica (Open Data Barcelona)
- **Datos Reales de Origen**: Catálogo de aforos (`36d41387-a4e5-48fa-801d-698257e3a106`), lecturas 2024 (`5b2c39d8-2f51-4fc5-9478-a479b77f9a48`) y 2025 (`45fc3faa-cdc6-4ac3-83e9-d019c8a629b9`).
- **Ponderación por Espiras Cercanas**: Cada aparcamiento se alimenta exclusivamente de las **2 espiras electromagnéticas oficiales más cercanas** ponderadas por distancia inversa (IDW).
- **Proyección 2026 sin Porcentajes Artificiales**: Se elimina cualquier tasa fija o factor predefinido. Para cada mes y cada tipo de día (`Codi_tipus_dia` '1' Lunes a '5' Festivos), la proyección para 2026 se calcula aplicando directamente la variación observada en esa espira entre 2024 y 2025:
  $$\Delta_{\text{real}}(m, dt) = \frac{v_{25}(m, dt) - v_{24}(m, dt)}{v_{24}(m, dt)}$$
  $$v_{26}(m, dt) = \text{round}\left(v_{25}(m, dt) \times (1 + \Delta_{\text{real}}(m, dt))\right)$$
- **Proyección a 7 Días y Curva Intradiaria Dinámica**: El caudal diario previsto para lunes, martes... domingo proviene de las lecturas reales de los sensores para ese día de la semana. La curva de 24 horas intradiaria refleja la realidad de Barcelona: en días laborables los picos se concentran en las franjas de mañana (08:00) y tarde (18:00), mientras que los domingos la actividad matinal es mínima y el pico se traslada al mediodía (12:00-14:00).
- **Tratamiento y Trazabilidad de Cortes Técnicos (Gap-Filling Homólogo)**: Si una espira sufrió desconexión temporal por obras en calzada (p. ej. Diagonal 1010/1011 entre Ago 2024 y Mar 2025), los meses inactivos se reconstruyen aplicando la variación interanual empírica observada en sus meses operativos. Cada dato reconstruido se identifica explícitamente en la interfaz mediante el distintivo `🛠️ Reconst.`, un asterisco en el valor (`*`), nota en el tooltip y una ficha técnica explicativa en la tarjeta del sensor.text
demanda_parkings/
├── index.html                   # Interfaz de usuario canónica (Azul Petróleo NN)
├── coordenadas de los aparcamientos.xlsx  # Archivo de coordenadas de la cartera
├── coordenadas de los aparcamientos.csv   # Versión CSV delimitada por comas
├── js/
│   ├── app.js                   # Orquestador de vistas, eventos y sincronización
│   ├── engine.js                # Motor matemático de Demanda Latente y Tobler
│   ├── data.js                  # Catálogo auditado y red de sensores de aforo
│   └── vendor/
│       └── xlsx.full.min.js     # Librería SheetJS para lectura local de Excel
├── core/
│   ├── demand_engine.py         # Motor de cálculo de referencia en Python
│   └── portfolio_data.json      # Dataset auditado de la cartera (29 activos)
├── docs/                        # Documentación técnica, manuales y especificaciones
└── README.md                    # Guía operativa del proyecto
```

### Metodología de Aforo e Inferencia Empírica (Open Data Barcelona)
- **Datos Reales de Origen**: Catálogo de aforos (`36d41387-a4e5-48fa-801d-698257e3a106`), lecturas 2024 (`5b2c39d8-2f51-4fc5-9478-a479b77f9a48`) y 2025 (`45fc3faa-cdc6-4ac3-83e9-d019c8a629b9`).
- **Ponderación por Espiras Cercanas**: Cada aparcamiento se alimenta exclusivamente de las **2 espiras electromagnéticas oficiales más cercanas** ponderadas por distancia inversa (IDW).
- **Proyección 2026 sin Porcentajes Artificiales**: Se elimina cualquier tasa fija o factor predefinido. Para cada mes y cada tipo de día (`Codi_tipus_dia` '1' Lunes a '5' Festivos), la proyección para 2026 se calcula aplicando directamente la variación observada en esa espira entre 2024 y 2025:
  $$\Delta_{\text{real}}(m, dt) = \frac{v_{25}(m, dt) - v_{24}(m, dt)}{v_{24}(m, dt)}$$
  $$v_{26}(m, dt) = \text{round}\left(v_{25}(m, dt) \times (1 + \Delta_{\text{real}}(m, dt))\right)$$
- **Proyección a 7 Días y Curva Intradiaria Dinámica**: El caudal diario previsto para lunes, martes... domingo proviene de las lecturas reales de los sensores para ese día de la semana. La curva de 24 horas intradiaria refleja la realidad de Barcelona: en días laborables los picos se concentran en las franjas de mañana (08:00) y tarde (18:00), mientras que los domingos la actividad matinal es mínima y el pico se traslada al mediodía (12:00-14:00).
- **Tratamiento y Trazabilidad de Cortes Técnicos (Gap-Filling Homólogo)**: Si una espira sufrió desconexión temporal por obras en calzada (p. ej. Diagonal 1010/1011 entre Ago 2024 y Mar 2025), los meses inactivos se reconstruyen aplicando la variación interanual empírica observada en sus meses operativos. Cada dato reconstruido se identifica explícitamente en la interfaz mediante el distintivo `🛠️ Reconst.`, un asterisco en el valor (`*`), nota en el tooltip y una ficha técnica explicativa en la tarjeta del sensor.

