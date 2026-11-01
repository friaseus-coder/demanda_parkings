@echo off
chcp 65001 >nul
title NN Parkings · Visor Gráfico USB
cd /d "%~dp0"

echo [i] Iniciando Visor de Escritorio desde USB...
python -c "import sys; from pathlib import Path; root = Path(r'%~dp0').parent; sys.path.insert(0, str(root)); from reporting_pc.visor_reportes_gui import main; main()"
