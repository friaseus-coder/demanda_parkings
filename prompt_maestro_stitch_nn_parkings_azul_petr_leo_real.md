# Prompt Maestro Oficial para Google Stitch (stitch.withgoogle.com)

## Sistema: NN Parkings · Latent Demand Pulse (Barcelona)
### Identidad Visual Real: Azul Petróleo Corporativo (`nnparkings.com` / Grup Núñez i Navarro)

> **Instrucciones para Google Stitch:**
> 1. Accede a **Google Stitch** (`https://stitch.withgoogle.com/`).
> 2. Selecciona **Web Application** y motor **Gemini 3**.
> 3. Copia y pega íntegramente el bloque de texto inferior en el panel de diseño.

---

### Bloque de Prompt para Copiar y Pegar en Stitch:

```text
Act as a Principal UI/UX Architect and Senior Design Systems Engineer.
Design a complete, high-precision, executive transportation web application called "NN Parkings · Latent Demand Pulse", created specifically for the Director of "NN Parkings" (Grup Núñez i Navarro, Barcelona - nnparkings.com).

The visual design must strictly mirror the genuine, official brand identity of NN Parkings as seen on their real digital platform (www.nnparkings.com): distinctive Deep Petrol Blue / Azul Petróleo, crisp architectural white canvas, soft ice-blue interaction pills, and high-legibility typography.

BRAND IDENTITY & DESIGN SYSTEM (GENUINE NN PARKINGS PALETTE):
- Brand Color Tokens:
  * Brand Primary Accent (Azul Petróleo NN): #164250 (Deep Petrol Teal) used for primary action buttons, headline accents, active filters, and circular brand emblems. Hover state: #0F323D.
  * Brand Deep Surface (Azul Petróleo Oscuro / Night Petrol): #0D2730 / #0A2129 used for dark top badges, search icons, and high-contrast numerical highlights.
  * Headline & Display Typography: #1A4B5B / #123742 (Intense Petrol Blue) for titles, section headers, and main metric cards.
  * Soft Secondary Accent (Pills & Tabs): Ice Petrol / Soft Glacial Blue (#E6EFF3 with border #C8DFE8, text #164250) directly inspired by the official "Abonos mensuales / Reservas" toggle on nnparkings.com.
  * Canvas & Backgrounds: Pure Architectural White (#FFFFFF) for main cards and workspace; Soft Off-White / Pale Ice (#F6F9FA / #F8FAFB) for the global canvas background.
  * Structural Borders: Subtle 1px crisp lines (#DFEAF0 / #E2E8F0).
  * Functional Transportation Data Tokens:
    - Forest Emerald (#10B981): Net Latent Demand (DL), EV charging spots, and captured revenue.
    - Cruising Amber (#D97706 / #F59E0B): Active street search traffic and speed degradation.
    - Surface Critical Red (#D83232 / #DC2626): Street saturation (>85% in Àrea Blava/Verda), inspired by physical parking booth signaling.
  * Strict Rule: Absolutely NO corporate orange, NO navy/purple indigo, and NO dark cyberpunk glows. The interface must be bright, airy, and grounded in the signature NN Petrol Blue.

- Typography & Layout Rules:
  * Headings & Body: Modern clean sans-serif ('Inter', sans-serif) with airy line height and crisp letter spacing.
  * Numbers & Metrics: Tabular monospace figures ('JetBrains Mono', monospace) for vehicle counts, capacities, percentages, and Euro figures to guarantee instant comparison without layout shifts.
  * Card Styling: Clean rounded-2xl corners, crisp 1px borders (border-[#DFEAF0]), minimal soft shadows, maximum whitespace.

TWO-TIER INTERACTIVE NAVIGATION ARCHITECTURE (PORTFOLIO TO DRILL-DOWN):
The interface operates in two interconnected states:
- STATE A: GLOBAL PORTFOLIO VIEW (NN Control Tower across Barcelona with 30 benchmark parking assets).
- STATE B: DEEP-DIVE ASSET AUDIT & 7+7 PREDICTIVE MODULE (Surgical audit of a single parking).
- Navigation Logic:
  * Clicking any parking pin on the macro map switches to State B.
  * Clicking any row in the live ranking table switches to State B.
  * In State B, a top prominent button "← Volver al Listado General" (with 'Esc' indicator) returns to State A. A direct dropdown selector allows jumping between any NN parking without leaving State B.

=============================================================================
SECTION 1: TOP COMMAND BAR & HEADER (VISIBLE IN BOTH STATES)
=============================================================================
- Authentic NN Parkings Header (as in nnparkings.com):
  * Left: Circular emblem in Deep Petrol (#0D2730) with crisp white bold letters "NN". Next to it, text logo: "Grup Núñez i Navarro _parkings".
  * Subtitle / Badge: "SISTEMA VIVO · BARCELONA" in soft ice-blue pill (#E6EFF3, text: #164250) with pulsating live dot.
  * Title: "NN Parkings · Latent Demand Pulse".
- Header Utilities:
  * Open Data BCN sync indicator ("5 min sync: OK").
  * Clock display ("Hora: 18:30").
  * "Animar Día" playback button in soft ice-blue styling with play icon to simulate 24-hour traffic waves.
  * Prominent Header Action Button in signature Azul Petróleo (#164250, hover: #0F323D, text: white): "＋ Importar / Subir Parkings" with upload icon.
- Dynamic Upload Modal (triggered by the button):
  * Minimalist drag-and-drop zone for CSV/Excel files (columns: nombre, direccion, lat, lon, capacidad, tarifa_rotacion, distrito).
  * "Descargar Plantilla CSV" text link.
  * Inline manual registration form (Name, District, Capacity, Price €/h, Elevation msnm).

=============================================================================
SECTION 2: STATE A — GLOBAL PORTFOLIO DASHBOARD (NN CONTROL TOWER)
=============================================================================
1. Four Top Executive KPI Cards:
   - Demanda Latente Total Portafolio: Large tabular number (e.g., "2.840 veh/h") in Petrol typography (#1A4B5B) with subtitle "Volumen insatisfecho en las 30 zonas de NN".
   - Agitación en Calzada (Cruising): Large number (e.g., "1.492 vehículos buscando") in amber, showing average speed degradation (-26%).
   - Ingresos No Captados Estimados: Monetary value (e.g., "21.840 €/día potencial") in emerald green, rotation multiplier 2.2h average stay.
   - Zonas de Calzada Crítica: Count (e.g., "22 de 30 en colapso") in critical red (#D83232), highlighting Area Blava/Verda occupancy > 85%.

2. District Quick-Filter Toolbar:
   - Filter pills styled with the nnparkings.com toggle aesthetic: Active pill in Azul Petróleo (#164250, text white), inactive pills in soft white/ice slate (#F0F5F8, text #164250).
   - Pills: "Todos (30)", "Eixample", "Ciutat Vella", "Sarrià-Sant Gervasi", "Gràcia", "Les Corts", "Sant Martí / 22@", "Sants-Montjuïc".
   - Search bar by parking name or street with round petrol search button.

3. Two-Column Analytical Workspace:
   - Left Column (7 cols): Full Barcelona Vector Map.
     * Clean architectural light tile basemap (Carto Positron / Voyager style).
     * Parkings rendered as crisp circular badges with NN Petrol Blue background (#164250), white "NN" mark, and net latent demand figures. Clicking any pin triggers drill-down to State B.
     * Floating corner legend: Activos NN Parkings, isocronas peatonales Tobler.
   - Right Column (5 cols): Live Ranking Table.
     * Scrollable list of all 30 parkings ordered descending by net latent demand.
     * Each row displays: Rank (#1, #2...), Parking Name (e.g., "NN Aragó / Rbla. Catalunya", "NN Gran Via / Urgell", "NN Pg. de Gràcia"), District, Capacity badge, Latent Demand (e.g., "118 veh/h" in emerald bold), Rotation tariff, and an "Auditar Activo →" button in Petrol Blue.

=============================================================================
SECTION 3: STATE B — SPECIFIC PARKING AUDIT & 7+7 DAY PREDICTIVE MODULE
=============================================================================
1. Asset Navigation & Hero Header:
   - Top breadcrumb bar with "← Volver al Listado General" button and a quick dropdown switcher to select any parking.
   - Selected Asset Hero Card:
     * Left: District badge (e.g., "EIXAMPLE" in #E6EFF3 pill), Coordinates (41.3897° N, 2.1610° E), Large Asset Title (e.g., "NN Aragó / Rambla Catalunya" in #1A4B5B), and arterial descriptive summary.
     * Right: 3 architectural metric boxes: Topographic Elevation (msnm from ICGC DEM), Slope (%), and Surrounding Retail POIs (count within 5 min).

2. Asset Specific Top KPIs (4 cards):
   - Demanda Latente Neta (DL): e.g., "118 veh/h" (+31% vs physical capacity).
   - Tráfico en Agitación (gamma): e.g., "86 coches buscando" (-24% cruising speed).
   - Saturación en Calzada: e.g., "92% ocupación" in red.
   - Potencial Captura Diurna: e.g., "934 €/día no captados" in emerald.

3. Two-Column Diagnostic Workspace:
   - Left Panel (6 cols):
     * Microtopographic Isochrone Map:
       - Leaflet container showing the parking centered at zoom 15.
       - Render deformed Tobler walking polygons: 3 min (express - emerald), 5 min (retail/leisure - soft petrol blue), and 8 min (corporate/subscribers - dark petrol), deformed by Collserola slope and Eixample traffic light wait times.
     * Decoupling Waterfall Funnel (Cascada de Tráfico):
       - Step 1: Aforo Bruto en Calle (Q_total) -> 100% baseline bar.
       - Step 2: Descarte Tráfico Pasante (kappa_pasante) -> Deducted flow in neutral slate (-74%).
       - Step 3: Tráfico Fin de Viaje (Q_potencial) -> Remaining local flow.
       - Sub-breakdown: Cruising search flow (+) + On-street deficit (+) - Tobler slope loss (-).
       - Step 4: Demanda Latente Neta (DL) -> Resulting emerald capture bar.
     * Dynamic Factor Sandbox (What-If Sliders):
       - Rain slider (0.0 to 20.0 mm/h) with real-time demand booster.
       - On-street saturation slider (50% to 100%).
       - Massive Event dropdown (None, Fira BCN/MWC, Concierto/Partido Montjuïc, Festivo Comercial Eixample, Huelga Transporte).
       - Asset Rotation Tariff slider (2.00 € to 5.50 €/h) with price elasticity feedback.

   - Right Panel (6 cols):
     * 7-DAY WEEKLY RHYTHM PROFILE (168 Hours: Lunes a Domingo):
       - Horizontal row of 7 daily cards (Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo).
       - Each card shows the day name, average hourly latent demand, and an interactive state in ice-petrol (#E6EFF3).
       - Clicking any card updates a 24-hour intra-day curve chart for that specific day, contrasting gross flow vs. net latent demand.
     * NEXT 7 DAYS PREDICTIVE FORECAST MODULE (t+1 to t+7):
       - Multi-day trend line chart showing expected hourly latent demand for the upcoming week with upper/lower confidence bounds.
       - Causal Explainability Badges below the chart (e.g., "🌧️ Previsión Lluvia +15%", "💼 Congreso MWC +45%", "🛍️ Sábado Comercial +35%").
     * Strategic Yield Advice Box (NN Executive Style):
       - Direct operational recommendations in Petrol frame for the Car Parks Director (e.g., "Elevar tarifa a 4.10 €/h durante pico de 18:00 a 20:30 h y restringir cupos a agregadores digitales con descuento").

DELIVERY FORMAT:
Provide clean, production-ready, highly responsive React and Tailwind CSS UI code in a single file or clean modular structure with crisp typography, robust state management, and strict adherence to the genuine Azul Petróleo (#164250) and white canvas identity of NN Parkings (nnparkings.com).
```