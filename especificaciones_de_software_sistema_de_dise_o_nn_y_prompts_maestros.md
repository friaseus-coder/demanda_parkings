# Especificación Técnica y Prompts Maestros: Sistema de Demanda Latente
## Portafolio de Aparcamientos en Barcelona — Identidad NN Parkings (Grup Núñez i Navarro)

Este documento contiene la arquitectura de software, el sistema de diseño visual corporativo fiel a **NN Parkings** (`nnparkings.com` y `grupnn.com`), el flujo interactivo de *Drill-Down*, el motor de importación dinámica de parkings propios, la matriz de los 30 aparcamientos de Barcelona y los **prompts maestros ejecutables para Google Stitch y Google Antigravity**.

---

## 1. Sistema de Diseño Corporativo: Identidad NN Parkings (Grup Núñez i Navarro)

A partir de la identidad de **NN Parkings** (más de 150 puntos en Barcelona, 29-31 parkings de rotación en ejes neurálgicos como Urgell 230, Passeig de Gràcia o Rambla Catalunya), se establece un sistema visual de **alta sobriedad arquitectónica, legibilidad óptima, fondos limpios y el distintivo color Naranja NN histórico**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ SISTEMA DE DISEÑO NN PARKINGS: PRINCIPIOS DE IDENTIDAD                 │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Naranja Corporativo NN: El color histórico distintivo introducido   │
│    en los años 50 y vigente en la señalética de aparcamientos y web.   │
│ 2. Contraste y Pulcritud Arquitectónica: Fondo blanco/nieve impecable  │
│    con tarjetas en gris ceniza o antracita mate; sin estridencias.    │
│ 3. Tipografía Rotunda y Cifras Tabulares: Lectura ejecutiva inmediata │
│    de aforos, plazas e ingresos sin saltos tipográficos.              │
└────────────────────────────────────────────────────────────────────────┘
```

### Tokens Cromáticos Oficiales NN Parkings:

| Token | Hex | Nombre / Rol | Aplicación en la Interfaz |
| :--- | :---: | :--- | :--- |
| **NN Orange Principal** | `#E25A1E` / `#EA580C` | *Taronja Corporatiu NN* | Botones clave, insignias activas, acentos de marca y pines seleccionados |
| **NN Antracita Estructural** | `#1A1A1A` / `#111827` | *Negre Arquitectònic* | Textos de titulares, bordes fuertes, cabecera sobria y elementos base |
| **NN Blanco Nieve** | `#FFFFFF` / `#F9FAFB` | *Blanc Pur* | Fondo principal de la aplicación y tarjetas para lectura descansada |
| **NN Gris Superficie** | `#F3F4F6` / `#E5E7EB` | *Gris Senyalètica* | Fondos de tablas, divisores sutiles y tarjetas secundarias |
| **Verde Captación / Eco** | `#10B981` / `#059669` | *Verd Sostenibilitat* | Demanda latente neta ($D_L$), plazas libres y puntos de recarga eléctrica |
| **Ámbar Agitación** | `#F59E0B` / `#D97706` | *Àmbar Cruising* | Vehículos en búsqueda activa y velocidad viaria degradada |
| **Rojo Déficit Calzada** | `#EF4444` / `#DC2626` | *Vermell Saturació* | Saturación crítica del Àrea Blava y Verda municipal (> 85%) |

---

## 2. Flujo de Navegación Interactiva (*Drill-Down*)

La experiencia de usuario permite alternar fluidamente entre la visión macroscópica de toda la red de Barcelona y el detalle quirúrgico de cada aparcamiento:

```
┌────────────────────────────────────────────────────────────────────────┐
│ NIVEL 1: TORRE DE CONTROL DE CARTERA (VISIÓN GLOBAL BARCELONA)         │
│ ├─ Cabecera NN: Emblema circular dos 'N' + Botón "＋ Importar Parkings"│
│ ├─ 4 KPIs Ejecutivos de Red (Demanda Latente Total, Ingresos No Capt.) │
│ ├─ Mapa Integral Vectorial de Barcelona con pines de capacidad NN      │
│ └─ Tabla de Clasificación en Vivo (Ordenable por demanda insatisfecha) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    │ DISPARADORES DE ENTRADA AL DETALLE (DRILL-DOWN):              │
    │  1. Clic en cualquier chincheta del mapa                      │
    │  2. Clic en cualquier fila de la tabla de clasificación       │
    │  3. Selección en el selector desplegable de activos           │
    └───────────────────────────────┬───────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ NIVEL 2: FICHA TÉCNICA DEL ACTIVO (DIAGNÓSTICO ESPECÍFICO 7+7 DÍAS)    │
│ ├─ Botón superior claro: "← Volver al Listado General" (o tecla Esc)   │
│ ├─ Ficha del Activo: Dirección, capacidad, cota topográfica y tarifa   │
│ ├─ Mapa Microtopográfico con Isocronas Tobler (3, 5 y 8 min a pie)    │
│ ├─ Embudo Waterfall: Aforo Bruto ➔ Pasante ➔ Agitación ➔ Latente Neta  │
│ ├─ Ritmo Semanal 168h: Tarjetas Lunes a Domingo con curvas horarias   │
│ ├─ Proyección Explicativa a 7 Días Vista ($t+1$ a $t+7$)               │
│ └─ Panel de Decisión: Ajustes de Yield y política tarifaria sugerida  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Módulo de Carga Dinámica de Nuevos Aparcamientos

Permite que el director o su equipo auditen cualquier activo nuevo en Barcelona cargando un archivo CSV o introduciendo los datos en pantalla:

```
[ Usuario sube CSV o rellena formulario UI ]
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PIPELINE DE AUTO-ENRIQUECIMIENTO ESPACIAL EN BARCELONA (SEGUNDOS)      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Geocodificación Automática (OpenStreetMap / Carto BCN):             │
│    Convierte la dirección postal en coordenadas exactas [lat, lon].    │
│                                                                        │
│ 2. Extracción Topográfica (MDT ICGC 2x2m):                             │
│    Consulta la cota sobre el nivel del mar y la pendiente media.       │
│                                                                        │
│ 3. Asignación de Sensor Viario (Open Data BCN):                        │
│    Enlaza el lazo de tráfico más cercano para calcular el flujo base.  │
│                                                                        │
│ 4. Generación de Isocronas Tobler (3, 5 y 8 min):                     │
│    Dibuja los polígonos peatonales deformados por cuesta y semáforos.  │
└────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
[ Parking registrado en DuckDB / Estado reactivo listo para auditar ]
```

---

## 4. Prompt Maestro 1: Para Google Stitch (Diseño Identidad NN Parkings)

> **Instrucciones:** Copia y pega este bloque en **Google Stitch** (`stitch.withgoogle.com`, Modo Web, Gemini 3):

```text
Act as a Principal Design Systems Architect and Senior Product Designer. 
Your mission is to design a high-precision, executive transportation web application called "BCN Parking Latent Pulse", specifically tailored for the Director of "NN Parkings" (Grup Núñez i Navarro, Barcelona). The visual design must strictly reflect the genuine brand identity of NN Parkings: architectural sobriety, clean white/light slate surfaces, deep anthracite typography, and the iconic "Naranja NN" corporate orange (#E25A1E).

BRAND IDENTITY & DESIGN SYSTEM (NN PARKINGS):
- Color Palette:
  * Brand Primary Accent: Authentic "Naranja NN" (#E25A1E / #EA580C) used for primary action buttons, active tabs, selected states, and brand badges.
  * Structural Neutral: Deep Anthracite / Jet Black (#111827 / #1A1A1A) for solid headings, navigation bar accents, and high-contrast labels.
  * Canvas & Cards: Crisp Architectural White (#FFFFFF) and soft light slate (#F8FAFC / #F1F5F9) for optimal readability and eye comfort.
  * Functional Data Colors: Emerald Green (#10B981) for net latent demand; Rich Amber (#F59E0B) for cruising traffic; Deep Red (#EF4444) for surface deficit (>85% saturation).
- Layout Philosophy:
  * Clean, bright, well-organized executive dashboard inspired by the modern signage and lighting of NN car parks in Barcelona.
  * 1px crisp borders (border-slate-200), generous padding, zero messy neon glows or heavy dark gradients.
  * Numbers must use monospace/tabular figures (JetBrains Mono style) for instant comparison of vehicle counts and Euro figures.

TWO-TIER INTERACTIVE NAVIGATION WORKFLOW (DRILL-DOWN):
1. HEADER & GLOBAL ACTIONS:
   - Header with circular emblem featuring the distinctive 'NN' initials, title "NN Parkings · Latent Demand Pulse", status pill "SISTEMA VIVO · BARCELONA".
   - Prominent header button: "＋ Importar / Subir Parkings" in NN Orange (#E25A1E).
   - Modal overlay for uploading CSV/Excel parking lists or manually adding an asset with live ICGC elevation and traffic sensor linking.
2. DUAL SCREEN MODES:
   - State A: Global Portfolio View (displays all 30 parkings across Barcelona).
   - State B: Deep-Dive Audit View for a single selected parking.
   - Navigation:
     * Clicking any parking marker on the Barcelona map enters State B.
     * Clicking any row in the real-time ranking table enters State B.
     * In State B, a top button "← Volver al Listado General" (with Esc key shortcut) returns to State A, alongside a direct parking switcher dropdown.

DETAILED VIEW 1: GLOBAL PORTFOLIO DASHBOARD (NN CONTROL TOWER)
1. 4 High-Legibility KPI Cards:
   - Demanda Latente Total Portafolio (veh/h).
   - Vehículos en Agitación Activa (Cruising) en la red.
   - Ingresos No Captados Estimados (€/día).
   - Alertas de Saturación en Calzada (Zonas críticas > 85%).
2. Two-Column Workspace:
   - Left Column (7 cols): Full Barcelona clean vector map. Parkings rendered as crisp circular badges with NN branding and clear capacity numbers.
   - Right Column (5 cols): Real-time Ranking Table of all loaded parkings. Columns: Rank, Parking Name, District, Latent Demand (DL), Pass-through %, Surface Deficit %, and an "Auditar Activo →" button.

DETAILED VIEW 2: SPECIFIC PARKING AUDIT & 7+7 DAY PREDICTIVE MODULE
1. Asset Navigation Bar:
   - "← Volver al Listado General" button.
   - Direct parking switcher dropdown.
   - Hero Card: Name, Address, District, Capacity (plazas), Elevation (msnm), Slope (%).
2. Analytical Dashboard:
   - Left Panel (6 cols):
     * Microtopographic Map with polygon isochrones at 3 min (express), 5 min (retail/leisure), and 8 min (corporate/subscribers), deformed by Tobler slope and Eixample traffic light delays.
     * Decoupling Waterfall Funnel: Clean horizontal step-by-step bars showing Gross Flow -> Pass-through deducted -> Local destination flow -> Cruising added -> Surface deficit added -> Slope pedestrian penalty subtracted -> Final Net Latent Demand.
     * Factor Sandbox: Sliders for Rain (mm/h), On-street saturation (%), Event Selector, and Rotation Tariff (€/h).
   - Right Panel (6 cols):
     * 7-DAY WEEKLY PROFILE (MONDAY TO SUNDAY):
       - Horizontal row of 7 daily cards (Lunes a Domingo) with clean 24-hour intra-day curves.
       - Clicking any card expands the detailed hourly breakdown.
     * NEXT 7 DAYS PREDICTIVE FORECAST MODULE:
       - Multi-day projection line chart showing expected latent demand for t+1 to t+7.
       - Predictive Explainability Badges highlighting causal drivers (Rain, Fira BCN congresses, retail weekend).
     * Strategic Yield Management Advice Box (NN Executive Style).

Deliver clean, production-grade, highly responsive React and Tailwind CSS UI code with crisp typography, robust component hierarchy, and complete design fidelity to NN Parkings.
```

---

## 5. Prompt Maestro 2: Para Google Antigravity (Construcción Full-Stack con Tokens NN)

> **Instrucciones:** Abre el chat de **Mission Control / Agent Tab** en Antigravity e introduce el siguiente prompt:

```text
You are an autonomous Senior Full-Stack Transportation Software Engineer operating in Google Antigravity.

YOUR MISSION:
Build and run a complete, production-grade real-time web application called "BCN Parking Latent Pulse" styled with the corporate visual identity of "NN Parkings" (Grup Núñez i Navarro, Barcelona): clean architectural lines, signature NN Orange #E25A1E, deep anthracite #111827 headings, crisp white cards #FFFFFF, high contrast, and uncluttered executive readability.

KEY REQUIREMENTS:
1. Dynamic Asset Management: Users can upload their own parkings via CSV/Excel or add them manually through an intuitive UI modal, with automated spatial enrichment (elevation from ICGC DEM, slope, nearest Open Data BCN traffic sensor, and Tobler isochrones).
2. Drill-down UX: Clicking any parking on the global dashboard (via map pin or ranking table row) enters that parking's detailed 7+7 day diagnostic view, with a persistent "← Volver al Listado General" button to return to the portfolio overview.
3. Self-contained local execution: The application runs with 0 cloud cost using FastAPI, DuckDB, React 19, Tailwind CSS, Leaflet, and Chart.js.

STEP 1: DESIGN SYSTEM IMPLEMENTATION (NN PARKINGS TOKENS)
- Configure Tailwind tokens:
  * Brand Orange: #E25A1E (primary accent, buttons, badges)
  * Dark Anthracite: #111827 / #1A1A1A (headings, main text)
  * Pure Canvas: #FFFFFF / #F8FAFC (backgrounds, clean cards)
  * Soft Slate: #F1F5F9 (dividers, secondary badges)
  * Accent Emerald: #10B981 (net latent demand, EV chargers)
  * Warning Amber: #F59E0B (cruising search traffic)
  * Danger Rose: #EF4444 (surface on-street saturation)
- Setup client-side navigation and portfolio state using Zustand:
  * `currentView`: `'portfolio'` | `'detail'`
  * `selectedParkingId`: string | null
  * `parkings`: Parking[] (initially seeded with the 30 realistic Barcelona benchmark parkings, with full support to append or replace with user-uploaded parkings).
  * Handlers: `selectParking(id)`, `returnToPortfolio()`, `importParkings(fileData)`, `addParking(newParking)`.
- Ensure pressing 'Escape' or clicking the top-left breadcrumb button instantly returns to the portfolio view.

STEP 2: BACKEND & DYNAMIC ASSET ENRICHMENT PIPELINE (FastAPI + DuckDB)
In `server/main.py` and `server/enrichment.py`:
1. Storage: Use DuckDB (`server/database.duckdb`) to store parkings, POIs (hospitals, nightlife, commerce), hourly traffic series, and dynamic factors.
2. Endpoints:
   - `GET /api/parkings`: List all current parkings with real-time aggregate KPIs.
   - `GET /api/parkings/{id}`: Detailed telemetry, Tobler polygon vertices (3, 5, 8 min), and current 24h curve.
   - `GET /api/parkings/{id}/weekly`: 7-day profile (Monday to Sunday 24h series and daily averages).
   - `GET /api/parkings/{id}/forecast_7d`: 7-day predictive projection with causal explanations.
   - `POST /api/parkings/upload`: Accepts CSV or JSON multipart upload. Enriches each parking automatically:
     * Geocodes address if coordinates are missing (using Nominatim / Carto BCN).
     * Calculates elevation (msnm) and slope (%) based on Barcelona's coastal-to-Collserola gradient.
     * Binds the nearest Open Data BCN traffic sensor loop ID to simulate baseline flow.
     * Computes Tobler isochrone polygons.
     * Stores in DuckDB and returns the newly enriched parking list.
   - `POST /api/simulate`: Compute what-if impacts with user sliders.
   - `GET /api/template/csv`: Returns a downloadable CSV template with columns: `nombre,direccion,lat,lon,capacidad,tarifa_rotacion,distrito`.
3. WebSocket `/ws/live`: Broadcasts simulated time progression and city traffic fluctuations every 2 seconds.

STEP 3: MATHEMATICAL MODEL & 7+7 PREDICTIVE ENGINE
1. Analytical Decoupling Model:
   - Pass-through deduction: Q_potencial = Q_total * (1 - kappa_pasante(t, dia)).
   - Cruising traffic logit function: gamma(t) = 1 / (1 + exp(-(-2.2 + 2.5*DeltaV + 3.0*theta_sup + 0.08*Rain))).
   - Singular POI generation (hospitals, clubs, retail, schools).
   - Surface deficit from Area Blava/Verda saturation.
   - Tobler hiking slope penalty on pedestrian capture.
   - Net Latent Demand: D_L = [S_ih * (Cruising + Deficit_sup + POIs) * (1 - ToblerLoss)] * Multipliers.
2. Weekly Profile Engine (Monday to Sunday):
   - Computes daily 24h curves for each of the 7 days.
3. 7-Day Explainable Predictive Forecast Engine (t+1 to t+7):
   - Baseline_D_L(day_of_week, h) + Delta_Weather + Delta_Events + Delta_Calendar
   - Returns structured explanation payload for each forecasted day with causal badges.

STEP 4: FRONTEND IMPLEMENTATION (React 19 + Vite + Tailwind CSS)
1. Global Dashboard View:
   - NN Parkings styled Header with circular NN emblem and aggregate KPIs.
   - Prominent "＋ Importar Parkings" button triggering the modal.
   - Full Barcelona map rendering all markers with click listeners triggering `selectParking(p.id)`.
   - Ranking table with sorting and row click listeners triggering `selectParking(p.id)`.
2. Specific Parking Deep-Dive View:
   - Clean navigation bar with "← Volver al Listado General" button and parking switcher dropdown.
   - Deformed Tobler Isochrones (3, 5, 8 min).
   - Decoupling Waterfall Funnel visualization.
   - 7-Day Weekly Grid (Cards for Monday to Sunday with daily averages and 24h sparklines).
   - Next 7 Days Forecast Chart with causal explanation badges.
   - Factor Sensitivity Sliders (Rain, Saturation, Event, Price).

STEP 5: VERIFICATION AND EXECUTION
- Install all dependencies (`pnpm install` and Python `pip install -r requirements.txt`).
- Launch both servers (`uvicorn server.main:app --port 8000` and `pnpm dev --port 5173`).
- Open the Antigravity integrated browser.
- Perform visual vibe check: Verify the NN Parkings aesthetic (signature NN Orange, crisp card borders, elegant typography, high contrast, zero clutter).
```

---

## 6. Catálogo de Semilla: 30 Parkings Base de Barcelona

Esta tabla inicial permite que la aplicación arranque con datos de referencia en todos los distritos de Barcelona, a los que luego se suman los activos que el usuario importe:

| # | ID Activo | Distrito | Cota ($m$) | Pendiente | Jerarquía Viaria | Coef. Pasante ($\kappa$) | Plazas | Perfil Semanal Dominante |
| :-: | :--- | :--- | :-: | :-: | :--- | :-: | :-: | :--- |
| 1 | `nn_arago` | Eixample | 32 | 1.1% | Arterial primaria | 0.76 | 380 | Laboral + Ocio Comercial Sábado |
| 2 | `nn_sagrada_fam` | Eixample | 38 | 2.0% | Distribuidora | 0.58 | 240 | Turístico continuo (Lunes a Domingo) |
| 3 | `nn_granvia_urgell`| Eixample | 28 | 1.0% | Arterial primaria | 0.72 | 410 | Laboral intenso L-V + Comercio Sábado |
| 4 | `nn_pg_gracia` | Eixample | 45 | 1.8% | Arterial / Comercial | 0.65 | 520 | Prime Comercial (Pico extremo Viernes/Sábado) |
| 5 | `nn_francesc_macia`| Eixample / Les Corts| 55 | 2.2% | Distribuidora nodo | 0.70 | 310 | Terciario + Sanitario L-V |
| 6 | `nn_monumental` | Eixample | 22 | 0.8% | Distribuidora | 0.60 | 290 | Mixto residencial / cultural |
| 7 | `nn_laietana` | Ciutat Vella | 14 | 1.2% | Arterial pacificada | 0.62 | 280 | Comercial, institucional y turístico |
| 8 | `nn_ramblas` | Ciutat Vella | 8 | 0.6% | Red local / Peatonal | 0.20 | 190 | Ocio nocturno y turístico L-D |
| 9 | `nn_born` | Ciutat Vella | 6 | 0.4% | Red local pacificada | 0.18 | 210 | Restauración y comercio singular |
| 10 | `nn_raval` | Ciutat Vella | 11 | 0.5% | Red local | 0.15 | 160 | Cultural, universitario y vecinal |
| 11 | `nn_artos` | Sarrià-St Gervasi | 115 | 8.4% | Malla local residencial | 0.22 | 180 | Escolar y vecinal (picos 8h y 17h L-V) |
| 12 | `nn_mitre_balmes` | Sarrià-St Gervasi | 92 | 5.8% | Distribuidora radial | 0.64 | 330 | Clínicas privadas y laboral |
| 13 | `nn_bonanova` | Sarrià-St Gervasi | 128 | 7.9% | Malla local / Colegios | 0.25 | 220 | Escolar concentrado L-V |
| 14 | `nn_galvany` | Sarrià-St Gervasi | 74 | 4.6% | Distribuidora / Mercado| 0.38 | 250 | Mercado matinal + restauración tarde/noche |
| 15 | `nn_torrent_olla` | Gràcia | 64 | 4.8% | Malla local estrecha | 0.18 | 150 | Comercio proximidad y ocio J-S |
| 16 | `nn_travessera` | Gràcia | 58 | 3.2% | Distribuidora local | 0.42 | 210 | Rotación comercial de barrio |
| 17 | `nn_lesseps` | Gràcia | 82 | 6.1% | Distribuidora nodo | 0.66 | 270 | Nodo intermodal y residencial |
| 18 | `nn_numancia` | Les Corts | 46 | 1.9% | Distribuidora | 0.52 | 340 | Oficinas corporativas L-V |
| 19 | `nn_diagonal_illa` | Les Corts | 54 | 1.5% | Arterial comercial | 0.71 | 610 | Gran superficie (L'Illa) pico J-V-S |
| 20 | `nn_camp_nou` | Les Corts | 62 | 2.8% | Distribuidora eventos | 0.48 | 450 | Picos extremos por eventos y partidos |
| 21 | `nn_22a_llacuna` | Sant Martí | 12 | 0.6% | Distribuidora 22@ | 0.46 | 420 | Tecnológico estricto L-V (valle S-D) |
| 22 | `nn_glories` | Sant Martí | 16 | 0.7% | Gran distribuidora | 0.74 | 550 | Centro comercial + Oficinas |
| 23 | `nn_poblenou_ram` | Sant Martí | 8 | 0.4% | Malla local / Peatonal | 0.19 | 180 | Ocio litoral y gastronómico V-S-D |
| 24 | `nn_diagonal_mar` | Sant Martí | 5 | 0.3% | Arterial litoral | 0.68 | 490 | Comercial y congresos CCIB |
| 25 | `nn_estacio_sants` | Sants-Montjuïc | 34 | 1.1% | Nodo intermodal | 0.69 | 500 | Intermodal continuo (AVE / tren) L-D |
| 26 | `nn_pl_espanya` | Sants-Montjuïc | 28 | 1.3% | Arterial / Fira | 0.78 | 430 | Fira de Barcelona y eventos Montjuïc |
| 27 | `nn_parallel` | Sants-Montjuïc | 12 | 0.9% | Distribuidora ocio | 0.55 | 260 | Teatros y ocio nocturno M-D |
| 28 | `nn_sant_pau` | Horta-Guinardó | 78 | 5.2% | Sanitaria / Residencial | 0.35 | 320 | Hospitalario matinal L-V + Visitas |
| 29 | `nn_fabra_puig` | Sant Andreu | 40 | 1.4% | Distribuidora comercial | 0.50 | 280 | Comercial de eje urbano |
| 30 | `nn_virrei_amat` | Nou Barris | 62 | 3.8% | Malla local densa | 0.28 | 200 | Alta densidad residencial / abonos |