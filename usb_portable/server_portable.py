#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Servidor Local Portable - NN Parkings Barcelona
100% Autónomo, sin dependencias externas, no toca el registro de Windows.
Sirve la aplicación web y proporciona endpoints REST para el motor matemático.
"""

import sys
import os
import json
import webbrowser
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


class PortableAppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

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

        # Endpoint API: Procesar texto de parkings
        if path == "/api/process_txt":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length).decode("utf-8", errors="replace")

            try:
                # Puede ser JSON con { "text": "..." } o texto plano directo
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

        self.send_response(404)
        self.end_headers()


def run_server(port=8080):
    server_address = ("127.0.0.1", port)
    
    # Intentar puerto alternativo si 8080 está ocupado
    for p in range(port, port + 10):
        try:
            httpd = ThreadingHTTPServer(("127.0.0.1", p), PortableAppHandler)
            port = p
            break
        except OSError:
            continue

    url = f"http://localhost:{port}/index.html"
    print("\n" + "=" * 70)
    print("    NN PARKINGS · SERVIDOR PORTABLE USB (0 REGISTRO)")
    print("=" * 70)
    print(f"[OK] Servidor activo en: {url}")
    print("[OK] No se requiere conexión a internet para el motor matemático.")
    print("[OK] Presiona Ctrl+C en cualquier momento para detener el servidor.")
    print("=" * 70 + "\n")

    # Abrir navegador automáticamente
    try:
        webbrowser.open(url)
    except Exception:
        pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[i] Servidor detenido correctamente.")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
