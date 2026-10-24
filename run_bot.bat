@echo off
setlocal
title BINANCE PATTERN SIGNAL BOT (HYBRID AI)
echo ======================================================================
echo    [BOT] KHOI CHAY BOT BAN TIN HIEU TELEGRAM (M5 XAUUSDT)
echo ======================================================================
cd /d "%~dp0Signal_Trade"
"%~dp0Signal_Trade\venv\Scripts\python.exe" main.py --mode signal
pause
