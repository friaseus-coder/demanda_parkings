#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Visor de Reportes en PC (GUI) - NN Parkings Barcelona
Aplicación de escritorio nativa (Tkinter) que NO requiere instalación ni toca el registro.
Permite cargar o editar un archivo .txt con parkings y calcular la demanda latente al instante.
"""

import sys
import os
import webbrowser
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from core.demand_engine import (
    parse_parking_txt,
    parse_parking_file,
    calculate_latent_demand
)
from reporting_pc.generar_reporte import (
    generate_html_report,
    generate_text_report
)


class LatentDemandReportingApp:
    def __init__(self, root):
        self.root = root
        self.root.title("NN Parkings · Sistema de Reporting de Demanda Latente (PC)")
        self.root.geometry("1100x720")
        self.root.minsize(900, 600)

        # Configurar colores corporativos NN Parkings
        self.COLOR_PETROL = "#164250"
        self.COLOR_PETROL_DARK = "#0D2730"
        self.COLOR_ICE_PILL = "#E6EFF3"
        self.COLOR_EMERALD = "#10B981"
        self.COLOR_AMBER = "#D97706"
        self.COLOR_CANVAS = "#F8FAFB"
        self.COLOR_CARD = "#FFFFFF"

        self.root.configure(bg=self.COLOR_CANVAS)
        self.current_results = []
        self.loaded_file_path = None

        self.setup_styles()
        self.build_ui()
        # Inicia vacío (sin aparcamientos precargados) hasta que el usuario cargue su Excel/CSV/TXT

    def setup_styles(self):
        style = ttk.Style()
        style.theme_use("clam")

        # Configuración de Treeview
        style.configure(
            "Treeview",
            background="#FFFFFF",
            foreground="#123742",
            rowheight=26,
            fieldbackground="#FFFFFF",
            font=("Inter", 9)
        )
        style.configure(
            "Treeview.Heading",
            background="#F0F5F8",
            foreground="#164250",
            font=("Inter", 9, "bold"),
            relief="flat"
        )
        style.map("Treeview", background=[("selected", "#E6EFF3")], foreground=[("selected", "#164250")])

    def build_ui(self):
        # 1. Cabecera Corporativa
        header_frame = tk.Frame(self.root, bg=self.COLOR_CARD, height=70, bd=1, relief="solid")
        header_frame.pack(fill="x", side="top")

        # Emblema circular NN
        emblem = tk.Label(
            header_frame,
            text="NN",
            font=("Inter", 13, "bold"),
            bg=self.COLOR_PETROL_DARK,
            fg="#FFFFFF",
            width=3,
            height=1,
            padx=4,
            pady=4
        )
        emblem.pack(side="left", padx=(16, 12), pady=12)

        title_frame = tk.Frame(header_frame, bg=self.COLOR_CARD)
        title_frame.pack(side="left", fill="y", pady=10)

        lbl_sub = tk.Label(
            title_frame,
            text="GRUP NÚÑEZ I NAVARRO · INTELIGENCIA DE MOVILIDAD BARCELONA",
            font=("Inter", 8, "bold"),
            fg="#85AEBE",
            bg=self.COLOR_CARD
        )
        lbl_sub.pack(anchor="w")

        lbl_title = tk.Label(
            title_frame,
            text="Auditoría de Demanda Latente de Aparcamientos",
            font=("Inter", 13, "bold"),
            fg=self.COLOR_PETROL,
            bg=self.COLOR_CARD
        )
        lbl_title.pack(anchor="w")

        # Acciones superiores
        btn_frame = tk.Frame(header_frame, bg=self.COLOR_CARD)
        btn_frame.pack(side="right", padx=16, pady=12)

        self.btn_load = tk.Button(
            btn_frame,
            text="📂 Cargar Excel / CSV / TXT",
            font=("Inter", 9, "bold"),
            bg=self.COLOR_ICE_PILL,
            fg=self.COLOR_PETROL,
            relief="flat",
            padx=12,
            pady=6,
            cursor="hand2",
            command=self.browse_txt_file
        )
        self.btn_load.pack(side="left", padx=4)

        self.btn_calc = tk.Button(
            btn_frame,
            text="⚡ Calcular Demanda",
            font=("Inter", 9, "bold"),
            bg=self.COLOR_PETROL,
            fg="#FFFFFF",
            relief="flat",
            padx=14,
            pady=6,
            cursor="hand2",
            command=self.run_calculation
        )
        self.btn_calc.pack(side="left", padx=4)

        self.btn_web = tk.Button(
            btn_frame,
            text="🌐 Ver Reporte Web",
            font=("Inter", 9, "bold"),
            bg="#FFFFFF",
            fg=self.COLOR_PETROL,
            bd=1,
            relief="solid",
            padx=12,
            pady=6,
            cursor="hand2",
            command=self.open_html_report
        )
        self.btn_web.pack(side="left", padx=4)

        # 2. Área Principal Dividida (Izquierda: Editor TXT | Derecha: Tabla y Desglose)
        main_paned = ttk.PanedWindow(self.root, orient="horizontal")
        main_paned.pack(fill="both", expand=True, padx=16, pady=12)

        # Panel Izquierdo: Editor TXT
        left_frame = tk.Frame(main_paned, bg=self.COLOR_CARD, bd=1, relief="solid")
        main_paned.add(left_frame, weight=1)

        left_lbl = tk.Label(
            left_frame,
            text="Lista de Aparcamientos a Analizar (.txt)",
            font=("Inter", 10, "bold"),
            fg=self.COLOR_PETROL,
            bg=self.COLOR_CARD
        )
        left_lbl.pack(anchor="w", padx=12, pady=(10, 4))

        left_hint = tk.Label(
            left_frame,
            text="Pega o edita los aparcamientos (un nombre o dirección por línea):",
            font=("Inter", 8),
            fg="#71787B",
            bg=self.COLOR_CARD
        )
        left_hint.pack(anchor="w", padx=12, pady=(0, 6))

        self.txt_editor = tk.Text(
            left_frame,
            font=("JetBrains Mono", 9),
            bg="#FDFEFE",
            fg="#1A1A1A",
            bd=1,
            relief="solid",
            padx=8,
            pady=8
        )
        self.txt_editor.pack(fill="both", expand=True, padx=12, pady=(0, 10))

        # Panel Derecho: Tabla y Waterfall
        right_frame = tk.Frame(main_paned, bg=self.COLOR_CARD, bd=1, relief="solid")
        main_paned.add(right_frame, weight=2)

        # KPI Summary Bar en la parte superior derecha
        self.kpi_frame = tk.Frame(right_frame, bg="#F0F5F8", height=45)
        self.kpi_frame.pack(fill="x", padx=10, pady=8)

        self.lbl_kpi_dl = tk.Label(self.kpi_frame, text="D. Latente: -", font=("Inter", 9, "bold"), fg=self.COLOR_EMERALD, bg="#F0F5F8")
        self.lbl_kpi_dl.pack(side="left", padx=12, pady=8)

        self.lbl_kpi_cruising = tk.Label(self.kpi_frame, text="Cruising: -", font=("Inter", 9, "bold"), fg=self.COLOR_AMBER, bg="#F0F5F8")
        self.lbl_kpi_cruising.pack(side="left", padx=12, pady=8)

        self.lbl_kpi_rev = tk.Label(self.kpi_frame, text="Ingr. No Captados: -", font=("Inter", 9, "bold"), fg=self.COLOR_PETROL, bg="#F0F5F8")
        self.lbl_kpi_rev.pack(side="left", padx=12, pady=8)

        # Tabla de Resultados
        table_frame = tk.Frame(right_frame, bg=self.COLOR_CARD)
        table_frame.pack(fill="both", expand=True, padx=10, pady=(0, 8))

        columns = ("rank", "name", "district", "cap", "dl", "cruising", "deficit", "rev", "prio")
        self.tree = ttk.Treeview(table_frame, columns=columns, show="headings", selectmode="browse")
        
        self.tree.heading("rank", text="#")
        self.tree.heading("name", text="Aparcamiento")
        self.tree.heading("district", text="Distrito")
        self.tree.heading("cap", text="Plazas")
        self.tree.heading("dl", text="D_L (veh/h)")
        self.tree.heading("cruising", text="Cruising")
        self.tree.heading("deficit", text="Déficit")
        self.tree.heading("rev", text="Ingr. Potencial")
        self.tree.heading("prio", text="Yield")

        self.tree.column("rank", width=35, anchor="center")
        self.tree.column("name", width=180, anchor="w")
        self.tree.column("district", width=110, anchor="w")
        self.tree.column("cap", width=60, anchor="e")
        self.tree.column("dl", width=80, anchor="e")
        self.tree.column("cruising", width=65, anchor="e")
        self.tree.column("deficit", width=60, anchor="e")
        self.tree.column("rev", width=95, anchor="e")
        self.tree.column("prio", width=70, anchor="center")

        tree_scroll = ttk.Scrollbar(table_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=tree_scroll.set)

        self.tree.pack(side="left", fill="both", expand=True)
        tree_scroll.pack(side="right", fill="y")

        self.tree.bind("<<TreeviewSelect>>", self.on_select_parking)

        # Panel Inferior de Detalle (Waterfall + Yield Advice)
        self.detail_frame = tk.Frame(right_frame, bg="#F8FAFB", bd=1, relief="solid")
        self.detail_frame.pack(fill="x", padx=10, pady=(0, 10))

        self.lbl_detail_title = tk.Label(
            self.detail_frame,
            text="Selecciona un aparcamiento para ver su cascada de demanda y recomendación de tarifas",
            font=("Inter", 9, "bold"),
            fg=self.COLOR_PETROL,
            bg="#F8FAFB"
        )
        self.lbl_detail_title.pack(anchor="w", padx=10, pady=(8, 4))

        self.lbl_detail_waterfall = tk.Label(
            self.detail_frame,
            text="",
            font=("JetBrains Mono", 8),
            fg="#41484B",
            bg="#F8FAFB",
            justify="left"
        )
        self.lbl_detail_waterfall.pack(anchor="w", padx=10, pady=(0, 4))

        self.lbl_detail_yield = tk.Label(
            self.detail_frame,
            text="",
            font=("Inter", 8, "italic"),
            fg="#123742",
            bg="#F8FAFB",
            wraplength=600,
            justify="left"
        )
        self.lbl_detail_yield.pack(anchor="w", padx=10, pady=(0, 8))

    def load_default_sample(self):
        """Carga un archivo de muestra por defecto."""
        sample_path = CURRENT_DIR / "aparcamientos_analizar.txt"
        if sample_path.exists():
            content = sample_path.read_text(encoding="utf-8")
            self.txt_editor.insert("1.0", content)
            self.loaded_file_path = sample_path
            self.run_calculation()

    def browse_txt_file(self):
        """Abre un diálogo para seleccionar cualquier archivo .xlsx, .xls, .csv o .txt."""
        filepath = filedialog.askopenfilename(
            title="Seleccionar archivo con aparcamientos (.xlsx, .csv, .txt)",
            filetypes=[
                ("Archivos soportados", "*.xlsx *.xls *.csv *.txt"),
                ("Archivos Excel", "*.xlsx *.xls"),
                ("Archivos CSV / Texto", "*.csv *.txt"),
                ("Todos los archivos", "*.*")
            ]
        )
        if filepath:
            try:
                p = Path(filepath)
                self.loaded_file_path = p
                raw_bytes = p.read_bytes()
                if raw_bytes[:4] == b"PK\x03\x04" or p.suffix.lower() in (".xlsx", ".xls"):
                    from core.demand_engine import extract_xlsx_rows
                    rows = extract_xlsx_rows(raw_bytes)
                    csv_preview = "\n".join(",".join(f'"{c}"' if "," in c else c for c in r) for r in rows)
                    self.txt_editor.delete("1.0", tk.END)
                    self.txt_editor.insert("1.0", csv_preview)
                else:
                    try:
                        content = raw_bytes.decode("utf-8-sig")
                    except UnicodeDecodeError:
                        content = raw_bytes.decode("cp1252", errors="replace")
                    self.txt_editor.delete("1.0", tk.END)
                    self.txt_editor.insert("1.0", content)
                self.run_calculation()
            except Exception as e:
                messagebox.showerror("Error al leer archivo", str(e))

    def run_calculation(self):
        """Parsea el contenido del editor y calcula la demanda latente."""
        content = self.txt_editor.get("1.0", tk.END).strip()
        if not content:
            messagebox.showwarning("Texto vacío", "Por favor introduce al menos un aparcamiento en el editor.")
            return

        try:
            parkings_raw = parse_parking_txt(content)
            if not parkings_raw:
                messagebox.showwarning("Sin aparcamientos", "No se reconocieron aparcamientos válidos en el texto.")
                return

            self.current_results = [calculate_latent_demand(p) for p in parkings_raw]
            self.current_results.sort(key=lambda x: x["latent_demand_dl"], reverse=True)

            self.render_tree()
            self.update_kpis()

            # Guardar automáticamente los reportes
            source_name = self.loaded_file_path.name if self.loaded_file_path else "lista_manual.txt"
            html_content = generate_html_report(self.current_results, source_name)
            (CURRENT_DIR / "reporte_demanda_latente.html").write_text(html_content, encoding="utf-8")

            txt_content = generate_text_report(self.current_results, source_name)
            (CURRENT_DIR / "reporte_demanda_latente.txt").write_text(txt_content, encoding="utf-8")

        except Exception as e:
            messagebox.showerror("Error en el cálculo", f"Error al procesar: {e}")

    def render_tree(self):
        """Rellena el treeview con los resultados calculados."""
        for item in self.tree.get_children():
            self.tree.delete(item)

        for idx, r in enumerate(self.current_results, start=1):
            rev_str = f"{r['uncaptured_daily_revenue_eur']:,} €/d".replace(",", ".")
            self.tree.insert(
                "",
                "end",
                iid=str(idx - 1),
                values=(
                    idx,
                    r["name"],
                    r["district"],
                    r["capacity"],
                    f"{r['latent_demand_dl']}",
                    r["cruising_vehicles"],
                    r["surface_deficit"],
                    rev_str,
                    r["yield_priority"]
                )
            )

        # Seleccionar el primer resultado por defecto
        if self.current_results:
            self.tree.selection_set("0")
            self.show_parking_detail(0)

    def update_kpis(self):
        """Actualiza la barra resumen de KPIs."""
        total_dl = sum(r["latent_demand_dl"] for r in self.current_results)
        total_cruising = sum(r["cruising_vehicles"] for r in self.current_results)
        total_rev = sum(r["uncaptured_daily_revenue_eur"] for r in self.current_results)

        self.lbl_kpi_dl.config(text=f"Demanda Latente Total: {total_dl:,} veh/h".replace(",", "."))
        self.lbl_kpi_cruising.config(text=f"Agitación (Cruising): {total_cruising:,} veh".replace(",", "."))
        self.lbl_kpi_rev.config(text=f"Ingresos No Captados: {total_rev:,} €/día".replace(",", "."))

    def on_select_parking(self, event):
        selected = self.tree.selection()
        if selected:
            idx = int(selected[0])
            self.show_parking_detail(idx)

    def show_parking_detail(self, idx: int):
        if idx < 0 or idx >= len(self.current_results):
            return
        r = self.current_results[idx]
        wf = r["waterfall"]

        self.lbl_detail_title.config(
            text=f"[{idx+1}] {r['name']} — {r['address']} ({r['district']}) | Tarifa: {r['tariff']:.2f} €/h | Cota: {r['elevation']}m"
        )
        wf_text = (
            f"Aforo Bruto: {wf['gross_flow']} veh/h  ➔  Pasante: {wf['pass_through_deducted']} v/h ({r['pass_through_pct']}%)  ➔  "
            f"Cruising: +{wf['cruising_added']} v/h  ➔  Déficit Calzada: +{wf['surface_deficit_added']} v/h  ➔  "
            f"Tobler Loss: {wf['tobler_penalty_deducted']} v/h  ➔  DL NETA: {r['latent_demand_dl']} veh/h"
        )
        self.lbl_detail_waterfall.config(text=wf_text)
        self.lbl_detail_yield.config(text=f"Estrategia Yield ({r['yield_priority']}): {r['yield_action']}")

    def open_html_report(self):
        """Abre el informe HTML completo en el navegador web."""
        html_file = CURRENT_DIR / "reporte_demanda_latente.html"
        if not html_file.exists():
            self.run_calculation()
        if html_file.exists():
            webbrowser.open(html_file.as_uri())


def main():
    root = tk.Tk()
    app = LatentDemandReportingApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
