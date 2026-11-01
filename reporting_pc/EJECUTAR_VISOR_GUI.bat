@echo off
chcp 65001 >nul
title NN Parkings · Visor Interactivo de Reportes
cd /d "%~dp0"

echo [i] Iniciando Visor de Escritorio (Tkinter)...
start "" python visor_reportes_gui.py
