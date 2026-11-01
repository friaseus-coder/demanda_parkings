@echo off
chcp 65001 >nul
title NN Parkings · Ejecutable Portable USB
cd /d "%~dp0"

echo ===============================================================================
echo     NN PARKINGS · SISTEMA DE DEMANDA LATENTE PORTABLE (USB)
echo ===============================================================================
echo [i] Comprobando entorno de ejecución Python...

set "PYTHON_BIN="
if exist "%~dp0python_embed\python.exe" (
    set "PYTHON_BIN=%~dp0python_embed\python.exe"
    echo [OK] Utilizando Python embebido local: python_embed\python.exe
    goto PYTHON_FOUND
)

python --version >nul 2>&1
if not errorlevel 1 (
    set "PYTHON_BIN=python"
    echo [OK] Utilizando Python del sistema operativo (PATH)
    goto PYTHON_FOUND
)

py -3 --version >nul 2>&1
if not errorlevel 1 (
    set "PYTHON_BIN=py -3"
    echo [OK] Utilizando Python Launcher del sistema (py -3)
    goto PYTHON_FOUND
)

echo.
echo ===============================================================================
echo [!] ERROR: No se ha detectado ningún intérprete de Python en este equipo.
echo.
echo Para ejecutar la suite portable en un PC que no tenga Python instalado:
echo   1. Descarga el paquete 'Windows embeddable package (64-bit)' desde python.org.
echo   2. Descomprime su contenido dentro de la carpeta:
echo      "%~dp0python_embed\"
echo.
echo O bien instala Python 3 (marcando 'Add python.exe to PATH' en el instalador).
echo ===============================================================================
echo.
pause
exit /b 1

:PYTHON_FOUND
echo [i] Iniciando servidor portable USB en puerto dinámico (8080-8095)...
echo.
%PYTHON_BIN% server_portable.py

echo.
pause
