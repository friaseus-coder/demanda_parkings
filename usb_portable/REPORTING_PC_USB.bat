@echo off
chcp 65001 >nul
title NN Parkings · Generador de Reportes USB
cd /d "%~dp0"

echo ===============================================================================
echo     NN PARKINGS · GENERADOR DE REPORTES DIRECTO DESDE USB
echo ===============================================================================
echo.

if "%~1"=="" (
    echo [i] Procesando archivo predeterminado: aparcamientos_a_analizar.txt
    python -c "import sys; from pathlib import Path; sys.path.insert(0, str(Path(r'%~dp0').parent)); from reporting_pc.generar_reporte import process_txt_file, generate_html_report, generate_text_report; import webbrowser; p = Path(r'%~dp0') / 'aparcamientos_a_analizar.txt'; r = process_txt_file(p); out_h = Path(r'%~dp0') / 'reportes' / 'reporte_usb.html'; out_h.write_text(generate_html_report(r, p.name), encoding='utf-8'); out_t = Path(r'%~dp0') / 'reportes' / 'reporte_usb.txt'; out_t.write_text(generate_text_report(r, p.name), encoding='utf-8'); print('[OK] Informe generado con ' + str(len(r)) + ' aparcamientos'); webbrowser.open(out_h.as_uri())"
) else (
    echo [i] Procesando archivo arrastrado: "%~1"
    python -c "import sys; from pathlib import Path; sys.path.insert(0, str(Path(r'%~dp0').parent)); from reporting_pc.generar_reporte import process_txt_file, generate_html_report, generate_text_report; import webbrowser; p = Path(r'%~1'); r = process_txt_file(p); out_h = Path(r'%~dp0') / 'reportes' / 'reporte_usb.html'; out_h.write_text(generate_html_report(r, p.name), encoding='utf-8'); out_t = Path(r'%~dp0') / 'reportes' / 'reporte_usb.txt'; out_t.write_text(generate_text_report(r, p.name), encoding='utf-8'); print('[OK] Informe generado con ' + str(len(r)) + ' aparcamientos'); webbrowser.open(out_h.as_uri())"
)

echo.
echo [OK] Informes guardados en la carpeta /reportes de esta unidad USB.
echo.
pause
