# Manual Técnico de Ingeniería de Movilidad: Cálculo de Demanda Latente, APIs, Parámetros y Proyecciones
## Sistema de Inteligencia Espaciotemporal de Aparcamientos en Barcelona

Este documento recoge la formulación matemática rigurosa, el catálogo de APIs y datos públicos, la calibración de parámetros numéricos, los horizontes temporales, la modelización de generadores singulares (hospitales, ocio nocturno, centros comerciales, colegios) y la metodología de proyección a 7 días ($t+1$ a $t+7$) para evaluar la demanda latente de aparcamiento en Barcelona.

---

## 1. Formulación Matemática Integral del Cálculo de Demanda Latente

La **demanda observada** en un aparcamiento corresponde únicamente a las transacciones registradas en su sistema de control de accesos (tiques de rotación validados). La **demanda latente** ($D_L$) mide la masa crítica de conductores que desean estacionar en la zona de influencia del activo pero no acceden de forma inmediata debido a congestión en calzada, falta de visibilidad del parking, fricción peatonal o saturación de plazas en superficie.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AFORO TOTAL EN CALLE                            │
│                        Q_total(tramo, t)                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  Resta: Tráfico Pasante Estructural
                  - [Q_total(tramo, t) * kappa_pasante(jerarquia, t)]
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 TRÁFICO CON DESTINO LOCAL POTENCIAL                    │
│                        Q_potencial(z, t)                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
[ COMPONENTE AGITACIÓN ]   [ COMPONENTE SUPERFICIE ]   [ COMPONENTE ATRACTORES ]
Tráfico en búsqueda        Déficit plazas reguladas    Generación local por POIs
Q_agitacion = Q_pot * gamma Delta_Deficit_sup           Q_atractores(hospital, ocio...)
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    │ Suma
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              DEMANDA BRUTA LOCAL EN BUSCA DE APARCAMIENTO              │
│       D_bruta = Q_agitacion + Delta_Deficit_sup + Q_atractores         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  Resta: Fricción Topográfica y Semafórica
                  - Perdida_Tobler_Semaforo(pendiente, cruces)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    CUOTA GRAVITATORIA DEL ACTIVO                       │
│                     x Probabilidad Huff: S_ih                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  Multiplicadores Exógenos y Elasticidad
                  x M_clima(lluvia) x M_evento(feria) x E_precio(tarifa)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 DEMANDA LATENTE NETA DEL PARKING                       │
│                           D_L(i, t)                                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Paso 1: Desacoplamiento del Tráfico Pasante

El aforo bruto registrado por el lazo de inducción o sensor municipal más próximo al aparcamiento se denota como $Q_{total}(t)$ en vehículos por hora ($\text{veh/h}$).

El tráfico potencial con fin de viaje en el entorno se obtiene deduciendo el flujo pasante:

$$
Q_{potencial}(i, t) = Q_{total}(tramo_i, t) \cdot \left[1 - \kappa_{pasante}(tramo_i, t)\right]
$$

El coeficiente de tráfico pasante $\kappa_{pasante}(tramo_i, t) \in [0.10, 0.95]$ se modula de acuerdo a la jerarquía de la Red Básica Estructurante Viaria (RBEV) de Barcelona y la hora del día $t \in [0, 23]$:

$$
\kappa_{pasante}(tramo_i, t) = \kappa_{base}(tramo_i) \cdot \omega_{horaria}(t)
$$

Donde:
* $\kappa_{base}$ depende de la tipología de vía:
  * **Arterial Pasante (Aragó, Gran Via, Diagonal, Rondas):** $\kappa_{base} \approx 0.70 - 0.85$.
  * **Distribuidora de Distrito (Balmes, Muntaner, Mallorca, Marina):** $\kappa_{base} \approx 0.45 - 0.65$.
  * **Malla Local y Pacificada (Gràcia, Sarrià, Superilles):** $\kappa_{base} \approx 0.15 - 0.25$.
* $\omega_{horaria}(t)$ aplica una sobreponderación matinal pendular:
  * De 07:30 a 09:30 h: $\omega_{horaria} = 1.15$ (máximo cruce metropolitano hacia el centro).
  * De 14:00 a 17:00 h: $\omega_{horaria} = 1.00$ (flujo comercial y de servicios).
  * De 21:00 a 06:00 h: $\omega_{horaria} = 0.65$ (el tráfico restante es eminentemente local/vecinal).

---

### Paso 2: Modelo Logit de Agitación Cinemática (*Cruising for Parking*)

No todos los vehículos con destino local buscan activamente aparcamiento en ese minuto exacto (algunos van a garajes privados o vados de residentes). La fracción $\gamma(t) \in [0, 1]$ que circula en agitación (*cruising*) se modela como una probabilidad logística dependiente del deterioro de la velocidad del tramo y la ocupación de la calle:

$$
\gamma(i, t) = \frac{1}{1 + \exp\left(-\left(\beta_0 + \beta_1 \cdot \Delta V(t) + \beta_2 \cdot \theta_{sup}(t) + \beta_3 \cdot \rho_{DUM}(t)\right)\right)}
$$

Donde las variables son:
* $\Delta V(t) = \max\left(0, \; 1 - \frac{V_{actual}(t)}{V_{libre}}\right)$: Ratio de degradación de velocidad del tramo respecto a su régimen de circulación fluida.
* $\theta_{sup}(t) \in [0, 1]$: Tasa de saturación del estacionamiento en calzada (Àrea Blava y Verda).
* $\rho_{DUM}(t) \in [0, 1]$: Nivel de ocupación de las zonas de carga y descarga de la plataforma SPRO.

El volumen neto de vehículos en agitación activa es:

$$
Q_{agitaci\acute{o}n}(i, t) = Q_{potencial}(i, t) \cdot \gamma(i, t)
$$

---

### Paso 3: Déficit Insatisfecho de Plazas en Superficie

En Barcelona, cuando la ocupación de Àrea Blava y Verda supera el umbral crítico del $85\%$, la búsqueda en superficie colapsa y genera un excedente de conductores expulsados hacia la oferta subterránea:

$$
\Delta D\acute{e}ficit_{sup}(i, t) = \max\left(0, \; \left(\theta_{sup}(i, t) - \theta_{umbral}\right) \cdot N_{plazas\_sup}(i) \cdot \mu_{rotaci\acute{o}n}(t)\right)
$$

Donde:
* $\theta_{umbral} = 0.85$ ($85\%$ de ocupación física).
* $N_{plazas\_sup}(i)$: Número total de plazas reguladas (blava + verda) censadas dentro de la isocrona de 5 minutos del aparcamiento.
* $\mu_{rotaci\acute{o}n}(t)$: Factor de rotación media horaria de la zona ($\approx 0.8\text{ a } 1.2\text{ renovaciones/hora}$).

---

### Paso 4: Componente de Atractores y Generadores Singulares de Demanda (POIs)

Los tipos de establecimientos presentes en la isocrona del parking inducen picos de demanda específicos con perfiles horarios radicalmente opuestos:
* **Un hospital** (ej. Hospital Clínic, Sant Pau, Sagrat Cor, Teknon) genera una demanda altamente inelástica, con picos de consultas externas y relevos de personal (07:30 a 14:30 h) y visitas vespertinas (16:30 a 19:30 h).
* **Una discoteca, club o sala de conciertos** (ej. Razzmatazz, Apolo, Opium, Bling Bling, Sutton) genera demanda en franja nocturna y de madrugada (23:00 a 06:00 h, concentrada de jueves a sábado), con saturación masiva de calzada y alta disposición a pagar por seguridad y cercanía.
* **Un centro educativo o colegio mayor** genera dobles picos intensos y breves ("kiss & ride") a las 08:30 y a las 16:30-17:30 h.
* **Un eje de restauración / gastronómico** (ej. Enric Granados, Passeig de Sant Joan, Born) concentra demanda de 13:30 a 16:00 h y de 20:30 a 23:30 h.

Para computar esta demanda inducida directa, se evalúa el inventario de equipamientos y locales comerciales dentro de la isocrona del activo:

$$
Q_{atractores}(i, t) = \sum_{j \in \mathcal{A}_i} \left[ \text{Dimensi\acute{o}n}_j \cdot \Upsilon_{cat}(j) \cdot \tau_{cat}(j, t) \cdot \exp\left(-\lambda \cdot t_{caminar}(i, j)\right) \right]
$$

Donde:
* $\mathcal{A}_i$: Conjunto de atractores censados dentro de la isocrona de captación del aparcamiento $i$.
* $\text{Dimensi\acute{o}n}_j$: Magnitud de la actividad (número de camas/quirófanos en hospitales, aforo autorizado en discotecas/teatros, superficie de venta en $\text{m}^2$ para comercios, número de plazas escolares).
* $\Upsilon_{cat}(j)$: Tasa media de generación de viajes en vehículo privado por unidad y día.
* $\tau_{cat}(j, t)$: Función de distribución horaria de la tipología ($\int_0^{24} \tau(t) dt = 1$).
* $\exp\left(-\lambda \cdot t_{caminar}(i, j)\right)$: Penalización espacial peatonal entre el establecimiento y la entrada del parking.

#### Matriz de Coeficientes de Generación por Tipología de Establecimiento:

| Categoría POI | Unidad de Dimensión | Tasa Generación ($\Upsilon_{cat}$) | Horario Pico Dominante | Sensibilidad al Parking Subterráneo |
| :--- | :---: | :---: | :---: | :---: |
| **Hospital / Complejo Sanitario** | Camas + Consultas | $1.85\text{ viajes/unidad/día}$ | $08:00 - 15:00\text{ h}$ (L-V) | **Extrema** (Inelástica, urgencia, nula tolerancia a caminar) |
| **Discoteca / Club Nocturno** | Aforo autorizado | $0.28\text{ viajes/plaza/noche}$ | $23:30 - 05:30\text{ h}$ (J-S) | **Muy Alta** (Evitar robos/alcoholímetro en calle, noche cerrada) |
| **Restauración / Terrazas** | Número de mesas | $0.90\text{ viajes/mesa/servicio}$ | $14:00 - 16:00\text{ h}$ y $21:00 - 23:30\text{ h}$ | **Alta** (Rotación de 1.5 a 2.5 horas) |
| **Comercio Prime / Moda** | $100\text{ m}^2$ superficie venta | $2.40\text{ viajes/100m}^2/\text{día}$ | $17:00 - 20:30\text{ h}$ (V-S) | **Media-Alta** (Vinculada a volumen de compras/paquetería) |
| **Colegio Privado / Concertado** | Plazas de alumnado | $0.35\text{ viajes/alumno/día}$ | $08:15 - 09:15\text{ h}$ y $16:30 - 17:30\text{ h}$ | **Media** (Paradas cortas en superficie, colapsa el entorno) |
| **Oficinas / Corporativo** | $100\text{ m}^2$ techo terciario | $1.20\text{ viajes/100m}^2/\text{día}$ | $08:30 - 18:30\text{ h}$ (L-V) | **Alta** (Demanda laboral continua, abonos diurnos) |

---

### Paso 5: Contracción Microtopográfica y Fricción Peatonal (Tobler + Cerdà)

La masa de demanda solo se materializa si el conductor percibe que la caminata desde el parking hasta su destino es viable. La velocidad de marcha humana $v$ se penaliza según la función exponencial de Tobler aplicada sobre la pendiente del terreno $s$:

$$
s = \frac{\Delta \text{Cota (m)}}{L\text{ (m)}} = \tan(\alpha)
$$

$$
v(s) = 6.0 \cdot \exp\left(-3.5 \cdot \left|s + 0.05\right|\right) \quad [\text{km/h}]
$$

A la pérdida física por pendiente se añade el retraso estocástico por cruce de chaflanes semaforizados del Eixample ($d_{semaf}$):

$$
t_{caminar}(origen, destino) = \sum_{e \in ruta} \frac{L_e}{v(s_e) / 3.6} + \sum_{k \in semaforos} d_{semaf}(k)
$$

Donde $d_{semaf}(k) \approx 22\text{ segundos}$ de espera media por semáforo de avenida principal. La penalización de captación peatonal por fricción morfológica se calcula como:

$$
\text{Factor\_P\acute{e}rdida}_{Tobler}(i) = \min\left(0.40, \; \frac{Pendiente\_Media_i(\%)}{100} \cdot 1.8 + \frac{N_{semaforos\_eje}}{10} \cdot 0.08\right)
$$

---

### Paso 6: Probabilidad de Elección del Parking (Modelo Gravitatorio Huff)

Si dentro de la isocrona peatonal existen otros aparcamientos competidores subterráneos (públicos de B:SM o privados de Saba/Interparking), la cuota de captura teórica $S_{ih}$ que atrae nuestro activo $i$ sobre la zona $h$ se formula según la interacción espacial de David Huff:

$$
S_{ih} = \frac{Capacidad_i \cdot \exp\left(-\lambda \cdot t_{caminar}(i, h)\right)}{\sum_{k \in \mathcal{K}_h} Capacidad_k \cdot \exp\left(-\lambda \cdot t_{caminar}(k, h)\right)}
$$

Donde:
* $Capacidad_i$: Número total de plazas de nuestro parking.
* $\mathcal{K}_h$: Conjunto de todos los aparcamientos subterráneos accesibles desde el centroide de la zona $h$.
* $\lambda$: Parámetro de sensibilidad a la distancia a pie ($\lambda \approx 0.28\text{ min}^{-1}$).

---

### Paso 7: Ecuación Unificada de Demanda Latente ($D_L$)

Integrando todos los componentes físicos, morfológicos, de atractores y de mercado, la demanda latente neta por hora se define como:

$$
D_L(i, t) = \left[ S_{ih} \cdot \left( Q_{agitaci\acute{o}n}(i, t) + \Delta D\acute{e}ficit_{sup}(i, t) + Q_{atractores}(i, t) \right) \cdot \left( 1 - \text{Factor\_P\acute{e}rdida}_{Tobler}(i) \right) \right] \cdot \Phi_{clima}(t) \cdot \Omega_{evento}(t) \cdot \Psi_{precio}(i)
$$

Donde los multiplicadores contextuales son:
1. **Multiplicador Meteorológico ($\Phi_{clima}$):**
   $$
   \Phi_{clima}(t) = 1.0 + \left( \min(Lluvia_{mm/h}(t), 15) \cdot 0.045 \right)
   $$
   *(Cada mm/h de precipitación incrementa la demanda de parking cubierto un $+4.5\%$, hasta saturarse en $+67.5\%$ con 15 mm/h).*

2. **Multiplicador de Eventos Singulares ($\Omega_{evento}$):**
   * $\Omega = 1.00$: Día estándar sin afección masiva.
   * $\Omega = 1.45$: Congreso Fira Gran Via / MWC / ISE (impacto terciario).
   * $\Omega = 1.60$: Partido de fútbol / Gran Concierto en Montjuïc (impacto radial).
   * $\Omega = 1.35$: Apertura comercial festiva autorizada en Eixample.
   * $\Omega = 1.50$: Jornada de huelga o alteración severa de Metro/Rodalies.

3. **Función de Elasticidad-Precio de la Tarifa de Rotación ($\Psi_{precio}$):**
   $$
   \Psi_{precio}(i) = \max\left(0.40, \; 1.0 - \left( \frac{Tarifa_i - Tarifa_{mercado}}{Tarifa_{mercado}} \right) \cdot \epsilon_p \right)
   $$
   *Con un coeficiente de elasticidad $\epsilon_p = 0.75$ y una tarifa de referencia de mercado en Barcelona de $Tarifa_{mercado} = 3.40\text{ \euro{}/h}$.*

---

## 2. Catálogo Oficial de APIs y Endpoints de Datos Abiertos (0 €)

Todas las fuentes requeridas para alimentar el modelo son de acceso público y gratuito bajo las directivas europeas de datos abiertos.

| # | Fuente / Organismo | Recurso / Dataset | Formato | Frecuencia de Ingesta | Endpoint / Identificador CKAN | Campos Clave Extraídos |
| :-: | :--- | :--- | :---: | :---: | :--- | :--- |
| **1** | **Open Data BCN** | Estado de los tramos en tiempo real | JSON | Cada 5 minutos | `dataset/transit-informacio-trams` | `idTram`, `data`, `estatActual` (0 a 5), `estatPrevist` |
| **2** | **Open Data BCN** | Relación de tramos y coordenadas | CSV | Trimestral (estático) | `dataset/transit-relacio-trams` | `idTram`, `descripcio`, `coordenades` (lat/lon tramo) |
| **3** | **Open Data BCN** | Aforamientos históricos sistemáticos | CSV | Mensual / Histórico | `dataset/transit-aforaments-intensitat` | `idTram`, `data_hora`, `intensitat_veh_h`, `ocupacio_pct` |
| **4** | **Open Data BCN** | Regulación en calzada (Blava/Verda) | GeoJSON | Semestral | `dataset/estacionament-regulat-en-calcada` | `id_tram`, `tipus_zona`, `num_places`, `tarifa_id` |
| **5** | **Open Data BCN** | Plazas DUM (Carga y Descarga) | GeoJSON | Semestral | `dataset/estacionament-places-dum` | `id_area`, `places`, `horari_inici`, `horari_fi` |
| **6** | **Open Data BCN** | Censo comercial y actividades PB | CSV | Anual | `dataset/cens-activitats-comercials` | `categoria_local`, `superficie_m2`, `utm_x`, `utm_y` |
| **7** | **Open Data BCN** | Censo de equipamientos y locales de ocio | JSON | Trimestral | `dataset/equipaments-ciutat-barcelona` | `tipus_equipament` (Sanitari, Oci nocturn, Docent), `capacitat` |
| **8** | **Open Data BCN** | Equipamientos de Parking (Competencia) | JSON | Semestral | `dataset/aparcaments-ciutat-barcelona` | `nom`, `adreca`, `lat`, `lon`, `capacitat_places`, `operador` |
| **9** | **Meteocat / XEMA** | Estaciones automáticas BCN | REST API | Cada 30 minutos | `api.meteo.cat/pronostics/v1/estacions` | `estacio_id` (`D5`, `Y7`, `WU`), `precipitacio_mm`, `temp` |
| **10** | **MITMA Big Data** | Matrices O/D telefonía móvil | Parquet | Mensual (AWS S3) | `s3://mitma-movilidad-bigdata/` | `origen_dist`, `destino_dist`, `hora`, `viajes_privados` |
| **11** | **ICGC Geoportal** | Modelo Digital de Elevaciones (2x2m) | GeoTIFF | Anual (WCS Service)| `geoserveis.icgc.cat/serveis/wcs` | Cota ortométrica en metros sobre el nivel del mar |

---

## 3. Matriz de Coeficientes y Valores Numéricos de Calibración

Los siguientes valores constituyen el núcleo de calibración paramétrica validado para la ciudad de Barcelona:

### Tabla de Calibración por Jerarquía Viaria y Morfología:

| Parámetro | Arterial Pasante (*Aragó, Gran Via*) | Distribuidora Central (*Balmes, Mallorca*) | Malla Pacífica / Superilla (*Poblenou, Gràcia*) | Malla Pendiente (*Sarrià, Putxet*) |
| :--- | :---: | :---: | :---: | :---: |
| **Coeficiente Pasante Base ($\kappa_{base}$)** | `0.76` | `0.58` | `0.20` | `0.22` |
| **Velocidad Flujo Libre ($V_{libre}$)** | $45\text{ km/h}$ | $30\text{ km/h}$ | $20\text{ km/h}$ | $25\text{ km/h}$ |
| **Constante Logit ($\beta_0$)** | `-2.50` | `-2.20` | `-1.80` | `-2.10` |
| **Peso Degradación Velocidad ($\beta_1$)** | `2.80` | `2.50` | `2.20` | `2.40` |
| **Peso Saturación Superficie ($\beta_2$)** | `3.20` | `3.00` | `3.50` | `2.90` |
| **Peso Saturación Carga/Descarga ($\beta_3$)** | `1.40` | `1.20` | `1.60` | `0.90` |
| **Sensibilidad Huff Distancia ($\lambda$)** | `0.24` | `0.28` | `0.32` | `0.38` |
| **Elasticidad Tarifa Propia ($\epsilon_p$)** | `0.65` | `0.75` | `0.85` | `0.70` |
| **Penalización Cruce Semafórico ($d_{semaf}$)** | $28\text{ s}$ | $22\text{ s}$ | $10\text{ s}$ | $12\text{ s}$ |
| **Pendiente Topográfica Media ($s$)** | $1.1\%$ | $2.0\%$ | $0.5\%$ | $8.4\%$ |

---

## 4. Arquitectura de Horizontes Temporales

El sistema procesa y proyecta los datos a lo largo de cuatro horizontes temporales interconectados:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. RETROSPECTIVO HISTÓRICO (Últimos 12 meses):                         │
│    Almacenado en DuckDB. Resolución de 1 hora. Calcula los patrones    │
│    base estacionales, percentiles P10, P50, P90 y curvas típicas.      │
├────────────────────────────────────────────────────────────────────────┤
│ 2. TIEMPO REAL OPERATIVO (Streaming en Vivo cada 5 minutos):           │
│    Conexión continua con el feed de tráfico municipal y Meteocat.      │
│    Detecta anomalías instantáneas respecto a la curva esperada.        │
├────────────────────────────────────────────────────────────────────────┤
│ 3. PERFIL SEMANAL RÍTMICO (168 Horas: Lunes a Domingo):                │
│    Descompone las tipologías dominantes de demanda por barrio:         │
│    - Eje Laboral / Terciario (Lunes a Viernes 08-19h)                  │
│    - Eje Sanitario (Lunes a Viernes picos 08h y 15h, continuo)         │
│    - Eje Nocturno / Discotecas (Jueves a Sábado 23-05h)                │
│    - Eje Comercial / Ocio Diurno (Viernes y Sábado 17-21h)             │
│    - Eje Turístico Continuo (Lunes a Domingo continuo)                 │
├────────────────────────────────────────────────────────────────────────┤
│ 4. PROYECCIÓN PREDICTIVA EXPLICABLE (Siguientes 7 Días: t+1 a t+7):    │
│    Genera la curva prevista para la próxima semana con bandas de       │
│    confianza e insignias causales explicativas para cada día.          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Metodología de Proyecciones a 7 Días ($t+1$ a $t+7$)

Para predecir la demanda latente horaria durante los próximos 7 días para cualquier activo del portafolio, el motor emplea un **modelo aditivo de series temporales con descomposición causal explicativa**:

$$
\widehat{D}_L(i, d, h) = \text{Base}_{168h}(i, d, h) + \Delta_{Clima}(d, h) + \Delta_{Eventos}(i, d, h) + \Delta_{Calendario}(d) + \Delta_{POIs}(i, d, h) + \Delta_{Precio}(i)
$$

Donde:
* $d \in [1, 7]$ representa el día futuro ($t+1$ a $t+7$).
* $h \in [0, 23]$ representa la hora proyectada del día.

### Componentes del Modelo Predictivo:

1. **Línea Base Histórica de 168 Horas ($\text{Base}_{168h}$):**
   * Es la mediana ponderada móvil ($P50$) de las últimas 8 semanas coincidentes para el mismo día de la semana y la misma hora, excluyendo días anómalos o festivos:
     $$
     \text{Base}_{168h}(i, d, h) = \text{Mediana}\left(D_L(i, d, h, w-1), \; \dots, \; D_L(i, d, h, w-8)\right)
     $$

2. **Ajuste Predictivo Meteorológico ($\Delta_{Clima}$):**
   * Consulta las APIs meteorológicas de previsión a 7 días (Meteocat / AEMET OpenData). Si se pronostica lluvia ($P_{lluvia} \ge 2\text{ mm/h}$):
     $$
     \Delta_{Clima}(d, h) = \text{Base}_{168h}(i, d, h) \cdot \left(\min\left(P_{lluvia}(d, h), 15\right) \cdot 0.045\right)
     $$

3. **Inyección Causal de Grandes Eventos y Actividad Nocturna ($\Delta_{Eventos}$):**
   * Si es víspera de festivo o fin de semana, los aparcamientos próximos a macrodiscotecas o salas de fiesta activan el multiplicador de ocio nocturno en la franja de 23:00 a 05:00 h.
   * Si hay ferias en Fira BCN Montjuïc / Gran Via o partidos en Montjuïc/Camp Nou dentro de un radio de $< 1.500\text{ m}$:
     $$
     \Delta_{Eventos}(i, d, h) = \text{Base}_{168h}(i, d, h) \cdot \left(\Omega_{evento} - 1.0\right) \cdot \Phi_{horaria\_evento}(h)
     $$

4. **Corrección de Calendario Laboral y Comercial ($\Delta_{Calendario}$):**
   * Si el día $d$ es festivo intersemanal, conmuta automáticamente al perfil de Domingo.
   * Si es sábado de apertura comercial autorizada, suma un $+30\%$ de 17:00 a 21:00 h en Eixample y Ciutat Vella.

---

## 6. Esquemas Técnicos de Tablas en DuckDB (*Data Contracts*)

A continuación se definen los esquemas SQL para estructurar la base de datos columnar local (`server/database.duckdb`):

```sql
-- 1. Dimensión del portafolio de aparcamientos
CREATE TABLE dim_parkings (
    parking_id VARCHAR PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    direccion VARCHAR NOT NULL,
    distrito VARCHAR NOT NULL,
    lat DOUBLE NOT NULL,
    lon DOUBLE NOT NULL,
    capacidad INTEGER NOT NULL,
    tarifa_rotacion_eur DOUBLE DEFAULT 3.40,
    cota_msnm DOUBLE,
    pendiente_max_pct DOUBLE,
    id_tram_sensor BIGINT,
    jerarquia_via VARCHAR,
    coef_pasante_base DOUBLE
);

-- 2. Dimensión de Atractores y Generadores Singulares (POIs)
CREATE TABLE dim_atractores_pois (
    poi_id VARCHAR PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    categoria VARCHAR NOT NULL, -- 'hospital', 'discoteca', 'colegio', 'teatro', 'cc'
    lat DOUBLE NOT NULL,
    lon DOUBLE NOT NULL,
    dimension_valor DOUBLE,      -- camas, aforo autorizado, m2
    tasa_generacion_dia DOUBLE,  -- viajes/unidad/dia
    horario_inicio INTEGER,      -- hora apertura (ej. 23)
    horario_fin INTEGER          -- hora cierre (ej. 6)
);

-- 3. Tabla de enlace espacial parking-atractor (Isocronas precalculadas)
CREATE TABLE rel_parking_atractores (
    parking_id VARCHAR,
    poi_id VARCHAR,
    distancia_metros DOUBLE,
    tiempo_caminar_min DOUBLE,
    factor_atrac_gravitatoria DOUBLE,
    PRIMARY KEY (parking_id, poi_id),
    FOREIGN KEY (parking_id) REFERENCES dim_parkings(parking_id),
    FOREIGN KEY (poi_id) REFERENCES dim_atractores_pois(poi_id)
);

-- 4. Lecturas consolidadas de tráfico y aforos horarios (Histórico)
CREATE TABLE fact_aforos_horarios (
    tram_id BIGINT,
    fecha_hora TIMESTAMP,
    dia_semana INTEGER, -- 1 = Lunes, 7 = Domingo
    hora INTEGER,       -- 0 a 23
    intensidad_bruta_veh_h INTEGER,
    estado_congestion INTEGER, -- 0 a 5
    velocidad_estimada_kmh DOUBLE,
    PRIMARY KEY (tram_id, fecha_hora)
);

-- 5. Tabla de demanda latente calculada y proyecciones a 7 días
CREATE TABLE fact_demanda_latente_series (
    parking_id VARCHAR,
    fecha_hora TIMESTAMP,
    es_proyeccion BOOLEAN DEFAULT FALSE,
    aforo_bruto INTEGER,
    trafico_pasante INTEGER,
    trafico_potencial INTEGER,
    vehiculos_agitacion INTEGER,
    deficit_superficie INTEGER,
    demanda_inducida_pois INTEGER, -- Volumen generado por hospitales, discotecas, etc.
    friccion_tobler_perdida INTEGER,
    demanda_latente_neta INTEGER,
    ingresos_no_captados_eur DOUBLE,
    insignia_explicativa VARCHAR, -- 'Pico Ocio Nocturno', 'Alta Presión Hospitalaria', 'Lluvia'
    PRIMARY KEY (parking_id, fecha_hora),
    FOREIGN KEY (parking_id) REFERENCES dim_parkings(parking_id)
);
```