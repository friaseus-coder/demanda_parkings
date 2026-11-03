# Plantilla de Datos de Cartera (*Data Contract*) y Ejemplo CSV
## Formato de Importación Dinámica para Aparcamientos en Barcelona

Este documento define la estructura técnica del archivo que el usuario puede rellenar o exportar desde sus hojas de cálculo para cargar su propia cartera de aparcamientos en el sistema.

---

## 1. Estructura de Campos del CSV / Excel

| Nombre Columna | Tipo | Obligatorio | Ejemplo | Descripción |
| :--- | :---: | :---: | :--- | :--- |
| `id` | Texto | Sí | `nn_urgell` | Identificador único alfanumérico (sin espacios ni acentos). |
| `nombre` | Texto | Sí | *NN Urgell 230* | Nombre comercial o descriptivo del aparcamiento. |
| `direccion` | Texto | Sí* | *Carrer del Comte d'Urgell, 230, Barcelona* | Dirección postal completa en Barcelona. |
| `lat` | Decimal | Opcional* | `41.39120` | Latitud GPS en grados decimales (WGS84). |
| `lon` | Decimal | Opcional* | `2.14850` | Longitud GPS en grados decimales (WGS84). |
| `capacidad` | Entero | Sí | `320` | Capacidad total física de plazas del activo. |
| `tarifa_rotacion` | Decimal | Opcional | `3.60` | Tarifa horaria en euros (€/h). Si se omite, se aplica `3.40`. |
| `distrito` | Texto | Opcional | *Eixample* | Distrito municipal de Barcelona (se auto-calcula si está vacío). |

*\*Nota: Debe indicarse obligatoriamente la `direccion` postal o bien las coordenadas `lat` / `lon`.*

---

## 2. Ejemplo Listo para Guardar: `plantilla_cartera_parkings.csv`

Puedes copiar y guardar el siguiente bloque directamente con el nombre `plantilla_cartera_parkings.csv`:

```csv
id,nombre,direccion,lat,lon,capacidad,tarifa_rotacion,distrito
nn_urgell_230,NN Urgell 230,Carrer del Comte d'Urgell 230,41.3912,2.1485,320,3.60,Eixample
nn_valencia_aribau,NN València Aribau,Carrer de València 210,41.3888,2.1580,240,3.50,Eixample
nn_rambla_cat_72,NN Rambla Catalunya 72,Rambla de Catalunya 72,41.3920,2.1612,280,3.80,Eixample
nn_sarria_major,NN Sarrià Major,Carrer Major de Sarrià 85,41.3980,2.1215,190,3.30,Sarrià-Sant Gervasi
nn_diagonal_muntaner,NN Diagonal Muntaner,Avinguda Diagonal 490,41.3955,2.1490,360,3.70,Eixample
nn_pallars_22a,NN 22@ Pallars,Carrer de Pallars 140,41.3985,2.1930,420,2.90,Sant Martí
nn_granvia_rocf,NN Gran Via Rocafort,Gran Via de les Corts Catalanes 450,41.3785,2.1530,290,3.40,Eixample
nn_hospital_clinic,NN Rosselló Clínic,Carrer de Rosselló 130,41.3875,2.1510,310,3.60,Eixample
nn_via_augusta,NN Via Augusta Ganduxer,Via Augusta 180,41.3995,2.1380,250,3.40,Sarrià-Sant Gervasi
nn_paral_lel,NN Paral·lel Nou,Avinguda del Paral·lel 110,41.3755,2.1680,210,3.20,Sants-Montjuïc
```

---

## 3. Comportamiento del Motor al Cargar el CSV

1. **Lectura en memoria:** Al arrastrar este archivo a la ventana de la aplicación o cargarlo en el servidor DuckDB, el sistema parsea las filas en menos de 100 milisegundos.
2. **Auto-completado de parámetros:**
   * Si las coordenadas no están presentes, consulta Nominatim / Carto BCN para obtener la latitud y longitud a partir de la dirección postal.
   * Con las coordenadas, consulta el Modelo Digital del Terreno del ICGC para obtener la cota ortométrica sobre el nivel del mar y computar la pendiente media de las calles adyacentes.
   * Busca en el censo municipal el sensor viario de lazo más cercano de Open Data BCN para enlazar la serie de aforo horario y clasificar la vía según la jerarquía de la red estructurante (arterial, distribuidora o malla local).
   * Genera las isocronas peatonales de 3, 5 y 8 minutos deformadas por la pendiente de Tobler y la espera semafórica en los chaflanes del Eixample.