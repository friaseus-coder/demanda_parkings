@echo off
chcp 65001 >nul
title NN Parkings · Sincronizador de Entorno USB Portable
cd /d "%~dp0"

echo ===============================================================================
echo     NN PARKINGS · SINCRONIZADOR AUTOMÁTICO DE ENTORNO PORTABLE (USB)
echo ===============================================================================
echo [i] Origen: Plataforma Web Master (web/)
echo [i] Destino: Kit Autónomo de Presentación (usb_portable/web/)
echo.

if not exist "%~dp0web" (
    echo [!] ERROR: No se encontró la carpeta 'web' de origen en %~dp0
    pause
    exit /b 1
)

echo [+] Sincronizando interfaz web, scripts JS, librerías y estilos...
xcopy "%~dp0web\*" "%~dp0usb_portable\web\" /E /Y /I /Q
if errorlevel 1 (
    echo [!] ERROR durante la copia de la carpeta web.
    pause
    exit /b 1
)

echo [+] Sincronizando ficheros de datos y coordenadas de cartera...
if exist "%~dp0coordenadas de los aparcamientos.csv" (
    copy /Y "%~dp0coordenadas de los aparcamientos.csv" "%~dp0usb_portable\" >nul
    echo     - coordenadas de los aparcamientos.csv [OK]
)
if exist "%~dp0coordenadas de los aparcamientos.xlsx" (
    copy /Y "%~dp0coordenadas de los aparcamientos.xlsx" "%~dp0usb_portable\" >nul
    echo     - coordenadas de los aparcamientos.xlsx [OK]
)
if exist "%~dp0core\portfolio_data.json" (
    if not exist "%~dp0usb_portable\core" mkdir "%~dp0usb_portable\core"
    copy /Y "%~dp0core\portfolio_data.json" "%~dp0usb_portable\core\" >nul
    echo     - core\portfolio_data.json [OK]
)

echo.
echo ===============================================================================
echo [OK] ¡SINCRONIZACIÓN COMPLETADA CON ÉXITO!
echo      El kit USB (usb_portable/) está 100% actualizado con la última versión
echo      de la plataforma Web y sus datos auditados.
echo ===============================================================================
echo.
pause
