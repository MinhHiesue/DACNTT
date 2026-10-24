@echo off
setlocal
title NORTHSTAR TRADING INTELLIGENCE - 1-CLICK LAUNCHER
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_all.ps1"
