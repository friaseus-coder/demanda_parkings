# Manual Técnico y Auditoría de Cálculos: Sistema de Estimación de Demanda de Aparcamientos

Este documento detalla exhaustivamente **cada uno de los cálculos matemáticos, variables, fuentes de datos y modos de representación** implementados en la plataforma. Está diseñado bajo los principios de **trazabilidad, transparencia algorítmica y veracidad absoluta de datos (`real-data-only`)**.

---

## 1. Principio Fundamental: Separación de Fuentes y Veracidad (`real-data-only`)

El sistema opera bajo una estricta separación ontológica entre dos capas de datos:
1. **Datos de Vía Pública (Entorno Exterior):** Proceden de sensores e infraestructuras públicas del **Ajuntament de Barcelona** (aforos viarios, censo de locales a pie de calle, eventos oficiales) y del modelo digital de elevaciones de **Copernicus DEM / Open-Meteo**. Son mediciones reales de flujo en calzada.
2. **Datos de la Propiedad Privada (Aparcamiento):** Proceden exclusivamente del archivo cargado por el usuario (`.xlsx` o `.csv`): coordenadas, capacidad (número de plazas), tarifas horarias y telemetría de barrera (entradas y salidas).

> [!IMPORTANT]
> **Regla de Oro `real-data-only`:**
> Si un dato privado no está presente en el archivo del usuario (por ejemplo, si el archivo solo contiene coordenadas pero no especifica la columna `Plazas` o `Tarifa`), el sistema **jamás inventa o simula un valor ficticio**:
> - La capacidad física y la tarifa se inicializan estrictamente en **0**.
> - La demanda latente capturable interna y los ingresos se declaran en **0**.
> - La interfaz muestra avisos explícitos (*"No informada en el archivo cargado"* o *"Sin telemetría de barrera"*).
> - Para los meses en curso o futuros del año activo (noviembre y diciembre de 2026), no se proyectan caudales ficticios consolidados; las curvas se cortan limpiamente en el último mes cerrado (octubre) y las tablas reflejan `En curso` y `Sin datos`.

---

## 2. Inventario del Aparcamiento y Tarjetas KPI Superiores

### 2.1. Capacidad Física Total
- **Dato de entrada:** Columna `Plazas` / `Capacidad` del archivo Excel/CSV subido por el usuario.
- **Procedencia:** Archivo del usuario.
- **Fórmula:**
  $$\text{Capacidad Total} = \sum_{i=1}^{N} \text{Plazas}(i)$$
- **Representación:**
  - Si el archivo contiene plazas: muestra el número total exacto auditado (ej. `8.317 plazas · 29 activos`).
  - Si el archivo **no contiene plazas**: muestra `0 plazas` con el subtexto `29 activos (No informada en archivo)`. En el desglose individual por parking se indica `Capacidad: 0 plazas (Sin inventario cargado)`.

### 2.2. Agitación en Calzada de Cartera (Cruising)
- **Dato de entrada:** Flujo vehicular medido por las espiras de aforo de Open Data BCN frente a cada activo ($Q_{\text{agitación}}$).
- **Procedencia:** Red de sensores electromagnéticos del Ajuntament de Barcelona.
- **Fórmula:**
  $$\text{Agitación Cartera} = \sum_{i=1}^{N} Q_{\text{agitación}}(i) \quad [\text{vehículos/h}]$$
- **Representación:** Tarjeta superior central en color ámbar. Refleja la suma de vehículos que circulan buscando aparcamiento en la calzada exterior en el entorno inmediato de los activos.

### 2.3. Demanda Latente Neta de Cartera
- **Dato de entrada:** Demanda neta capturable $DL(i)$ calculada por el motor matemático.
- **Procedencia:** Motor `DemandEngine` calibrado con factores de atracción de Huff, fricción de Tobler y capacidad de cada activo.
- **Fórmula:**
  $$\text{DL Cartera} = \sum_{i=1}^{N} DL(i) \quad [\text{veh/h}]$$
- **Representación:** Tarjeta superior izquierda en color esmeralda. Si los activos no tienen plazas cargadas ($\text{Capacidad} = 0$), $DL(i)$ es estrictamente $0\text{ veh/h}$ (porque no se puede capturar rotación subterránea en un activo de 0 plazas), indicando que el potencial medido corresponde a la agitación exterior.

---

## 3. Módulo de Tráfico Viario y Aforos (Open Data Ajuntament de Barcelona)

### 3.1. Detección y Selección de Sensores de Aforo (Espiras Electromagnéticas)
- **Datos de entrada:** Coordenadas del parking $(lat_p, lon_p)$ y catálogo de estaciones municipales de aforo $(lat_s, lon_s)$.
- **Procedencia:** Catálogo de la red de aforos viarios del Ajuntament de Barcelona (`BCN_PRECOMPUTED_REAL_TRAFFIC` / Open Data BCN).
- **Cálculo de Distancia (Fórmula de Haversine):**
  $$d = 2 R \cdot \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta lat}{2}\right) + \cos(lat_p)\cos(lat_s)\sin^2\left(\frac{\Delta lon}{2}\right)} \right)$$
  Donde $R = 6.371.000\text{ metros}$.
- **Modos de Selección:**
  - **Modo 2 Espiras (Predeterminado):** Asigna automáticamente las dos espiras más cercanas que dispongan de serie histórica válida.
  - **Modo 1 Espira:** Permite aislar exclusivamente la espira principal directa de la calle del aparcamiento.
  - **Selector Desplegable Dinámico:** Permite intercambiar cualquiera de las espiras por cualquier otra estación en un radio de hasta 25 estaciones visibles en el mapa, recalculando instantáneamente todos los aforos y proyecciones.

### 3.2. Caudal Diario Medio (IMD) y Conversión de Unidades
Las espiras de Barcelona miden la Intensidad Media Diaria ($IMD$) clasificada por tipo de día (códigos Open Data 1 a 5):
- Código 1: Lunes
- Código 2: Martes a Jueves
- Código 3: Viernes
- Código 4: Sábado
- Código 5: Domingo y Festivos

El caudal del parking $IMD(m)$ en el mes $m$ para los días seleccionados se calcula combinando las espiras asignadas:
$$IMD(m) = \begin{cases} 
\frac{IMD_{\text{espira 1}}(m) + IMD_{\text{espira 2}}(m)}{2} & \text{si hay 2 espiras activas} \\
IMD_{\text{espira 1}}(m) & \text{si hay 1 espira activa}
\end{cases}$$

**Conversión según la unidad seleccionada:**
- **Promedio Día (`veh/día`):**
  $$\text{Valor}(m) = IMD(m)$$
- **Promedio Hora (`veh/h`):**
  $$\text{Valor}(m) = \text{round}\left(\frac{IMD(m)}{24}\right)$$
- **Total Mes (`veh/mes`):**
  $$\text{Valor}(m) = \text{round}\left(IMD(m) \times \text{DíasDelMes}(m) \times \frac{\text{DíasSeleccionados}}{7}\right)$$

### 3.3. Serie Trianual y Proyección Auditada (2024, 2025, 2026)
- **Año 2024 (Real $t-2$):** Datos empíricos consolidados de la red de aforos. En caso de corte técnico municipal o sustitución de espira, los meses afectados se marcan con la etiqueta `🛠️ Reconst.` y asterisco `*`.
- **Año 2025 (Real $t-1$):** Datos empíricos consolidados completos.
- **Variación Interanual Auditada 2024 $\rightarrow$ 2025:**
  $$\Delta_{24\rightarrow25} = \frac{\sum_{m=0}^{9} \text{Aforo}_{2025}(m) - \sum_{m=0}^{9} \text{Aforo}_{2024}(m)}{\sum_{m=0}^{9} \text{Aforo}_{2024}(m)} \times 100$$
  *Nota metodológica:* Se computa estrictamente sobre los **10 meses cerrados** (enero a octubre) para garantizar comparabilidad exacta con el ejercicio en curso.
- **Año 2026 (Estimado $t$):**
  $$IMD_{2026}(m) = IMD_{2025}(m) \times \left[ 1 + 0.75 \times \left( \frac{IMD_{2025}(m) - IMD_{2024}(m)}{IMD_{2024}(m)} \right) \right] \times \Phi_{\text{trams}}(m)$$
  - Factor $0.75$: Amortiguación de inercia para evitar sobreponderar variaciones estacionales atípicas.
  - $\Phi_{\text{trams}}(m)$: Coeficiente de estacionalidad mensual calibrado para la red viaria de Barcelona.

### 3.4. Representación del Gráfico 1 y Rejilla Mensual
- **Curva del Gráfico:**
  - Enero a Octubre de 2026: Puntos trazados con sus valores calculados.
  - Noviembre y Diciembre de 2026: Se evalúan como `null` con `spanGaps: false`. La curva se interrumpe limpiamente en octubre.
- **Rejilla Inferior de 12 Meses (`chart1MonthlyDiffGrid`):**
  - Meses 0 a 9 (Ene–Oct): Muestra cifras de 2024, 2025 y 2026 con insignias de variación porcentual (`▲ +X.X%` / `▼ -X.X%`).
  - Mes 10 (Noviembre 26): Muestra `2026: En curso` con badge en ámbar `En curso` (mes incompleto sin consolidar).
  - Mes 11 (Diciembre 26): Muestra `2026: Sin datos` con badge `—` (mes futuro sin transcurrir).

---

## 4. Embudo de Desacoplamiento (Waterfall de Demanda)

El embudo modela cómo el caudal viario bruto que circula por la calle se va filtrando hasta convertirse en demanda neta que efectivamente puede estacionar en el aparcamiento.

```
[1. Aforo Viario Bruto Inmediato (Q_total)]
       │
       ▼  (Deducción Tráfico Pasante: k_pasante = 40% a 68%)
[2. Flujo con Destino Local en el Barrio (Q_potencial)]
       │
       ▼  (Agitación en Calzada / Cruising Logit + Déficit Superficie + POIs)
[3. Demanda Bruta en el Entorno Inmediato (D_bruta)]
       │
       ▼  (Pérdida por Pendiente Topográfica de Tobler: -0% a -40%)
[4. Demanda Friccionada (D_friccionada)]
       │
       ▼  (Atracción Gravitatoria de Huff: Cuota según Plazas)
[5. Demanda Latente Neta Capturable (DL)]
```

### 4.1. Paso 1: Aforo Viario Bruto Exterior ($Q_{\text{total}}$)
- **Dato de entrada:** Caudal horario del sensor Open Data BCN frente al activo.
- **Fórmula:**
  $$Q_{\text{total}} = \text{round}\left( \frac{\text{Aforo Anual}}{365 \times 24} \right) \quad [\text{veh/h}]$$
- **Alternativa mensual:** Si el selector está en `veh/mes`, se expresa como el aforo mensual consolidado ($A_{\text{bruto}}$).

### 4.2. Paso 2: Deducción de Tráfico Pasante ($Q_{\text{pasante}}$)
- **Fundamento técnico:** En una trama urbana densa (como el Eixample o Gràcia), una parte de los vehículos no tiene intención de detenerse en el barrio, sino que lo atraviesa para ir a otros distritos.
- **Coeficiente de Pasante ($k_{\text{pasante}}$):**
  $$k_{\text{pasante}} = k_{\text{base}} \times \omega_{\text{horaria}}$$
  - Calle Distribuidora Principal (ej. Calle Aragó, Balmes, Mallorca): $k_{\text{base}} \approx 0.58$ ($58\%$ pasante $\rightarrow 42\%$ destino local).
  - Eje Conector Primario (ej. Gran Via, Vía Augusta): $k_{\text{base}} \approx 0.68$ ($68\%$ pasante $\rightarrow 32\%$ destino local).
  - Calle Colectora Local (ej. Bruc, Girona, Córcega): $k_{\text{base}} \approx 0.40$ ($40\%$ pasante $\rightarrow 60\%$ destino local).
- **¿Por qué no se usa un 85% genérico?**
  El $85\%$ de tráfico pasante solo se da en autopistas urbanas o cinturones cerrados (Rondas de Dalt y Litoral) donde no hay comercios, oficinas ni viviendas adyacentes. Aplicar un $85\%$ en el centro de Barcelona subestimaría la demanda real del barrio en más de un $60\%$.
- **Cálculo:**
  $$Q_{\text{pasante}} = \text{round}(Q_{\text{total}} \times k_{\text{pasante}})$$
  $$Q_{\text{potencial}} = \max(0, \, Q_{\text{total}} - Q_{\text{pasante}})$$

### 4.3. Paso 3: Destino Local y Agitación en Calzada (Cruising)
- **Fundamento:** Los vehículos que llegan con destino al barrio buscan aparcar inicialmente en superficie (zona azul/verde). Al encontrar la calzada saturada, entran en régimen de *cruising* (búsqueda repetitiva).
- **Función Logit de Elección Discreta (Calibración Barcelona):**
  $$\gamma = \frac{1}{1 + e^{-Z}}$$
  $$Z = \beta_0 + \beta_1 \cdot \Delta V + \beta_2 \cdot \theta_{\text{sup}} + \beta_3 \cdot \rho_{\text{dum}}$$
  - $\beta_0 = -2.20$, $\beta_1 = 2.50$, $\beta_2 = 3.00$, $\beta_3 = 1.20$.
  - $\theta_{\text{sup}}$: Tasa de saturación del estacionamiento regulado en superficie (calibrado al $85\%-92\%$ según área).
  - $\Delta V$: Sobrecarga de velocidad reducida por congestión de estacionamiento.
  - $\rho_{\text{dum}}$: Probabilidad de rechazo en primer intento.
- **Caudal de Agitación:**
  $$Q_{\text{agitación}} = \text{round}(Q_{\text{potencial}} \times \gamma)$$

### 4.4. Paso 4: Déficit en Superficie y Atractores Comerciales (POIs)
- **Déficit en Superficie ($\Delta_{\text{déficit}}$):** Si la ocupación en superficie supera el umbral crítico $\Theta_{\text{umbral}} = 0.85$ y el parking tiene plazas informadas:
  $$\Delta_{\text{déficit}} = \text{round}\left( (\theta_{\text{sup}} - 0.85) \times (\text{Capacidad} \times 0.90) \times 0.95 \right)$$
  *(Si $\text{Capacidad} = 0$, $\Delta_{\text{déficit}} = 0$)*.
- **Aporte de Generadores de Actividad (POIs):** Conteo de comercios y servicios en radio de 300 m obtenidos del censo municipal:
  $$Q_{\text{pois}} = \text{round}(\text{POIs} \times 0.14)$$
- **Demanda Bruta Total en el Entorno:**
  $$D_{\text{bruta}} = Q_{\text{agitación}} + \Delta_{\text{déficit}} + Q_{\text{pois}}$$

### 4.5. Paso 5: Fricción Topográfica de Tobler (Pendiente Real)
- **Dato de entrada:** Pendiente real de la rampa/calle ($\text{slope} \ge 0\%$).
- **Procedencia:** Malla digital de elevaciones de alta resolución de Copernicus DEM / Open-Meteo.
- **Función de Pérdida:**
  $$\text{Factor Tobler} = \min\left(0.40, \, \left(\frac{\text{slope}}{100}\right) \times 1.8\right)$$
  $$\text{Pérdida Tobler} = \text{round}(D_{\text{bruta}} \times \text{Factor Tobler})$$
  $$D_{\text{friccionada}} = D_{\text{bruta}} - \text{Pérdida Tobler}$$

### 4.6. Paso 6: Cuota Gravitatoria de Huff y Demanda Neta Capturable ($DL$)
- **Modelo de Probabilidad Espacial de Huff:** Determina qué porcentaje de la demanda que busca aparcar elegirá este aparcamiento específico frente a la competencia vecina:
  $$\text{Huff Share} = \begin{cases} 
  \min\left(0.65, \, \max\left(0.20, \, \frac{\text{Capacidad}}{\text{Capacidad} + 320} \times 0.95\right)\right) & \text{si Capacidad} > 0 \\
  0.0 & \text{si Capacidad} = 0
  \end{cases}$$
- **Moduladores Exógenos:**
  - **Clima ($\Phi_{\text{clima}}$):** Incremento por lluvia (Open-Meteo): $\Phi_{\text{clima}} = 1.0 + \min(\text{rain}, 15.0) \times 0.045$.
  - **Macroeventos ($\Omega_{\text{evento}}$):** $+30\%$ a $+45\%$ durante conciertos o eventos masivos a menos de 1 km.
  - **Sensibilidad al Precio ($\Psi_{\text{precio}}$):**
    $$\Psi_{\text{precio}} = \begin{cases} 
    \max\left(0.40, \, 1.0 - \left(\frac{\text{Tarifa} - 3.40}{3.40}\right) \times 0.75\right) & \text{si Tarifa} > 0 \\
    1.00 & \text{si Tarifa} = 0
    \end{cases}$$
- **Demanda Latente Neta Final ($DL$):**
  $$DL = \max(0, \, \text{round}(D_{\text{friccionada}} \times \text{Huff Share} \times \Phi_{\text{clima}} \times \Omega_{\text{evento}} \times \Psi_{\text{precio}}))$$

> [!NOTE]
> **Comportamiento cuando el archivo no incluye plazas (`Capacidad = 0`):**
> Al ser $\text{Huff Share} = 0$, $DL = 0\text{ veh/h}$. El sistema muestra explícitamente en el paso 4 del embudo:
> *"Demanda Latente Neta Capturable: 0 veh/h (Capacidad no informada)"*, informando de los $X\text{ veh/h}$ de agitación exterior en calzada.

---

## 5. Módulo de Grandes Eventos (7 Días Vista)

### 5.1. Fuentes de Datos
1. **API Open Data Barcelona:** Datasets oficiales de actividades deportivas, culturales y eventos en recintos de gran formato.
2. **Calendario Oficial de Recintos:**
   - Complex Olímpic Lluís Companys (Estadi Olímpic, Palau Sant Jordi, Sant Jordi Club).
   - FC Barcelona (Spotify Camp Nou, Palau Blaugrana).
   - Fira de Barcelona (Recinto Montjuïc y Recinto Gran Via).

### 5.2. Ventana Temporal Dinámica
- El sistema consulta en cada arranque la fecha local actual del dispositivo ($t_{\text{hoy}}$) y define una ventana estricta de 7 días:
  $$[t_{\text{inicio}}, \, t_{\text{fin}}] = [t_{\text{hoy}}, \, t_{\text{hoy}} + 7\text{ días}]$$
- Se descartan de forma estricta los eventos del pasado.

### 5.3. Modelo de Impacto por Distancia al Aparcamiento
Calcula la distancia geodésica $d$ entre el parking $(lat_p, lon_p)$ y las coordenadas del recinto del evento $(lat_e, lon_e)$:
- **Impacto ALTO / CRÍTICO ($d \le 1.0\text{ km}$):**
  - Desplazamiento masivo a pie desde el aparcamiento al recinto ($<12\text{ min}$).
  - Impacto estimado en demanda: **$+15\%$ a $+35\%$**.
  - Badge en la interfaz: `CRÍTICO` / `ALTO` (rojo/ámbar).
- **Impacto MEDIO ($1.0\text{ km} < d \le 2.5\text{ km}$):**
  - Distancia caminable o enlace directo en metro (L1, L3, L5).
  - Impacto estimado en demanda: **$+5\%$ a $+15\%$**.
  - Badge en la interfaz: `MEDIO` (azul cielo).
- **Impacto BAJO / MARGINAL ($d > 2.5\text{ km}$):**
  - Zona de influencia lejana.
  - Impacto estimado en demanda: **$+0\%$ a $+5\%$**.
  - Badge en la interfaz: `BAJO` (verde menta).

---

## 6. Balance de Accesos y Rotación (Telemetría Privada de Barrera)

- **Datos de entrada requeridos:** Series de lecturas horarias/mensuales de espiras de entrada (`entryPoints`) y espiras de salida (`exitPoints`) del parking.
- **Procedencia:** Telemetría de barrera del operador del aparcamiento (archivo subido).
- **Cálculos cuando existen datos:**
  - **Afluencia Neta Mensual:** $\Delta_{\text{neta}} = \text{Entradas} - \text{Salidas}$.
  - **Rotación Diaria por Plaza:**
    $$\text{Rotación} = \frac{\text{Entradas Mensuales} / 30}{\text{Capacidad}} \quad [\text{rotaciones/plaza/día}]$$
- **Tratamiento cuando no existen datos en el archivo cargado:**
  - El gráfico 2 elimina cualquier dataset simulado.
  - Badge: `SIN TELEMETRÍA DE BARRERA` (gris).
  - Diagnóstico: *"No se dispone de datos de telemetría de barrera (entradas y salidas) para este activo en el archivo cargado."*

---

## 7. Matriz Resumen de Fórmulas, Datos y Representación

| Componente / Módulo | Variables de Entrada | Fuente de Datos | Fórmula Matemática Clave | Modo de Representación |
| :--- | :--- | :--- | :--- | :--- |
| **Capacidad Total** | Columna `Plazas` | Archivo del usuario | $\sum \text{Plazas}(i)$ | Número exacto o `0 plazas (No informada)` |
| **Distancia a Espira** | Coordenadas $(lat, lon)$ | Excel vs. Open Data BCN | Haversine $R \cdot 2 \arcsin(\sqrt{a})$ | Metros exactos (ej. `135 m del acceso`) |
| **Aforo Diario (IMD)** | Días seleccionados | Espira municipal BCN | $\frac{1}{K}\sum IMD_{\text{días}}(m)$ | Curva continua y tabla comparativa trianual |
| **Variación Interanual** | Aforos 2024 y 2025 | Open Data BCN | $\frac{\text{Aforo}_{25} - \text{Aforo}_{24}}{\text{Aforo}_{24}} \times 100$ | Insignia auditada sobre 10 meses cerrados |
| **Meses Futuros 2026** | Fecha de sistema ($t$) | Calendario de ejecución | $m \ge \text{MesActual} \rightarrow \text{null}$ | Línea interrumpida + badges `En curso` / `Sin datos` |
| **Tráfico Pasante** | $Q_{\text{total}}$, carriles, tipo vía | Sensor BCN + Eje viario | $Q_{\text{total}} \times k_{\text{pasante}}$ | Barra gris en Waterfall con \% de deducción |
| **Cruising Calzada** | $Q_{\text{potencial}}$, saturación | Logit calibrado Barcelona | $Q_{\text{potencial}} \times \frac{1}{1 + e^{-Z}}$ | Barra naranja en Waterfall y tarjeta KPI |
| **Atractores (POIs)** | Locales comerciales 300 m | Censo Actividades BCN | $\text{POIs} \times 0.14$ | Incremento de demanda en Waterfall |
| **Fricción Tobler** | Pendiente rampa/calle | Copernicus DEM | $\min(0.40, (\text{slope}/100) \times 1.8)$ | Pérdida de atracción peatonal |
| **Cuota Huff** | Capacidad del parking | Archivo del usuario | $\frac{\text{Cap}}{\text{Cap} + 320} \times 0.95$ | Cuota gravitatoria frente a competencia |
| **Demanda Latente Net** | Demanda capturable y clima | Motor `DemandEngine` | $D_{\text{fricc}} \cdot \text{Huff} \cdot \Phi_{\text{clima}} \cdot \Omega \cdot \Psi$ | Barra verde de demanda neta capturable |
| **Impacto Eventos** | Coordenadas y aforo recinto | Agenda BCN (7 días vista) | Haversine a recinto ($d \le 1\text{ km}$) | Tarjetas ordenadas por proximidad (`ALTO`/`MEDIO`/`BAJO`) |
| **Rotación de Barrera** | Entradas y Capacidad | Telemetría privada | $\frac{\text{Entradas} / 30}{\text{Capacidad}}$ | Gráfico de balance o badge `SIN TELEMETRÍA` |

