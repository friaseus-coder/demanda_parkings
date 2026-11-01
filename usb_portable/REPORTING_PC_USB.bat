@echo off
chcp 65001 >nul
title NN Parkings · Generador de Reportes USB
cd /d "%~dp0"

echo ===============================================================================
echo     NN PARKINGS · GENERADOR DE REPORTES DIRECTO DESDE USB
echo ===============================================================================

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
echo.
if not "%~1"=="" goto RUN_WITH_ARG

echo [i] Procesando cartera predeterminada: aparcamientos_a_analizar.txt
%PYTHON_BIN% "%~dp0..\reporting_pc\generar_reporte.py" "%~dp0aparcamientos_a_analizar.txt"
goto REPORT_FINISHED

:RUN_WITH_ARG
echo [i] Procesando archivo arrastrado: "%~1"
%PYTHON_BIN% "%~dp0..\reporting_pc\generar_reporte.py" "%~1"

:REPORT_FINISHED
echo.
echo [OK] Informes guardados en la carpeta /reportes de esta unidad USB.
echo.
pause
