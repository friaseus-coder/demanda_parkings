@echo off
chcp 65001 >nul
title NN Parkings · Generador de Reportes de Demanda Latente
cd /d "%~dp0"

echo ===============================================================================
echo     NN PARKINGS · SISTEMA DE REPORTING DE DEMANDA LATENTE (BARCELONA)
echo ===============================================================================
echo.

if "%~1"=="" (
    echo [i] No se ha arrastrado ningún archivo específico.
    echo [i] Procesando archivo por defecto: aparcamientos_analizar.txt
    python generar_reporte.py aparcamientos_analizar.txt
) else (
    echo [i] Procesando archivo arrastrado: "%~1"
    python generar_reporte.py "%~1"
)

echo.
echo ===============================================================================
echo [OK] El informe ejecutivo se ha abierto en tu navegador web.
echo      También se ha guardado una copia en texto en reporte_demanda_latente.txt
echo ===============================================================================
pause
