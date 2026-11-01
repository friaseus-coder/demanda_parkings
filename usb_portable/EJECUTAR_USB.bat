@echo off
chcp 65001 >nul
title NN Parkings · Ejecutable Portable USB
cd /d "%~dp0"

echo ===============================================================================
echo     NN PARKINGS · SISTEMA DE DEMANDA LATENTE PORTABLE (USB)
echo ===============================================================================
echo [i] Iniciando entorno local portable sin tocar el registro de Windows...
echo [i] Directorio USB: %~dp0
echo.

python server_portable.py

echo.
pause
