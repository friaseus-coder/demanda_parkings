#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Servidor Local Portable - NN Parkings Barcelona
100% Autónomo, sin dependencias externas, no toca el registro de Windows.
Sirve la aplicación web y proporciona endpoints REST para el motor matemático y guardado de reportes.
Blindado con búsqueda de puerto dinámico (8080-8095), no-cache y sanitización estricta.
"""

import sys
import os
import re
import json
import webbrowser
import unicodedata
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
WEB_DIR = CURRENT_DIR / "web"
REPORTS_DIR = CURRENT_DIR / "reportes"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Añadir el raíz para importar el motor matemático
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from core.demand_engine import (
    parse_parking_txt,
    calculate_latent_demand,
    BENCHMARK_PARKINGS
)


def sanitize_filename(filename: str, default_ext: str = ".html") -> str:
    """
    Sanitiza de forma rigurosa un nombre de archivo para evitar Path Traversal
    y errores con caracteres especiales o acentos en sistemas de archivos Windows/FAT32.
    """
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"reporte_nn_{timestamp}{default_ext}"

    # Quitar cualquier ruta (path traversal)
    base = Path(filename).name

    # Normalizar acentos a caracteres ASCII estándar
    nfkd = unicodedata.normalize("NFKD", base)
    ascii_clean = "".join([c for c in nfkd if not unicodedata.combining(c)])

    # Reemplazar espacios y caracteres no alfanuméricos seguros por guión bajo
    safe_name = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", ascii_clean)
    safe_name = re.sub(r"_+", "_", safe_name).strip("._")

    # Asegurar extensión válida
    if not any(safe_name.lower().endswith(ext) for ext in [".html", ".txt", ".json", ".csv", ".xlsx"]):
        safe_name = f"{safe_name}{default_ext}"

    return safe_name or f"reporte_nn_{default_ext}"


class PortableAppHandler(SimpleHTTPRequestHandler):
    """Manejador HTTP con soporte de APIs y prevención total de caché para PC de presentación."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def end_headers(self):
        """Inyecta cabeceras agresivas de no-caché para garantizar siempre la última versión de JS/CSS/HTML."""
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Endpoint API: Lista de parkings benchmark
        if path == "/api/parkings":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            results = [calculate_latent_demand(p) for p in BENCHMARK_PARKINGS]
            results.sort(key=lambda x: x["latent_demand_dl"], reverse=True)
            self.wfile.write(json.dumps(results, ensure_ascii=False).encode("utf-8"))
            return

        # Servir archivos estáticos de la carpeta web
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Endpoint API 1: Procesar texto de parkings
        if path == "/api/process_txt":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length).decode("utf-8", errors="replace")

            try:
                if post_data.strip().startswith("{"):
                    body = json.loads(post_data)
                    raw_text = body.get("text", "")
                else:
                    raw_text = post_data

                parkings_raw = parse_parking_txt(raw_text)
                results = [calculate_latent_demand(p) for p in parkings_raw]
                results.sort(key=lambda x: x["latent_demand_dl"], reverse=True)

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok", "count": len(results), "parkings": results}, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode("utf-8"))
            return

        # Endpoint API 2: Guardar reporte generado (HTML / TXT / JSON) con validación y sanitización
        if path in ("/guardar_reporte", "/api/guardar_reporte"):
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length).decode("utf-8", errors="replace")

            try:
                data = json.loads(post_data)
                raw_filename = data.get("filename", "reporte.html")
                content = data.get("content", "")
                
                safe_name = sanitize_filename(raw_filename)
                target_path = (REPORTS_DIR / safe_name).resolve()

                # Blindaje extra de contención de ruta (evita cualquier path traversal residual)
                if not str(target_path).startswith(str(REPORTS_DIR.resolve())):
                    raise PermissionError("Acceso de ruta no autorizado.")

                target_path.write_text(content, encoding="utf-8")

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "ok",
                    "filename": safe_name,
                    "bytes": len(content.encode("utf-8")),
                    "path": str(target_path)
                }, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()


def run_server(start_port=8080, max_port=8095):
    """
    Inicia el servidor probando dinámicamente puertos entre start_port y max_port (8080-8095).
    Si todos están ocupados, solicita un puerto efímero libre al sistema operativo.
    """
    httpd = None
    assigned_port = None

    # Escaneo dinámico de puertos libres de 8080 a 8095
    for p in range(start_port, max_port + 1):
        try:
            httpd = ThreadingHTTPServer(("127.0.0.1", p), PortableAppHandler)
            assigned_port = p
            break
        except OSError:
            continue

    # Fallback si todo el rango 8080-8095 está ocupado: asignar puerto efímero automático
    if httpd is None:
        try:
            httpd = ThreadingHTTPServer(("127.0.0.1", 0), PortableAppHandler)
            assigned_port = httpd.server_address[1]
        except Exception as e:
            print(f"[!] Error crítico: No se pudo enlazar ningún puerto de red: {e}")
            sys.exit(1)

    url = f"http://localhost:{assigned_port}/index.html"
    print("\n" + "=" * 76)
    print("    NN PARKINGS · SERVIDOR PORTABLE USB (0 REGISTRO · BLINDADO)")
    print("=" * 76)
    print(f"[OK] Servidor activo en puerto dinámico: {assigned_port}")
    print(f"[OK] URL de la aplicación: {url}")
    print("[OK] Cabeceras de caché: no-store / no-cache (siempre código actualizado)")
    print("[OK] Motor matemático 100% autónomo (sin dependencias ni conexión externa)")
    print("[OK] Presiona Ctrl+C en cualquier momento para detener el servidor.")
    print("=" * 76 + "\n")

    # Abrir navegador automáticamente en el puerto real asignado
    try:
        webbrowser.open(url)
    except Exception:
        pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[i] Servidor portable detenido correctamente.")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
