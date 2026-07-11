@echo off
title Mematikan MooOS
color 0C

cd /d "%~dp0"

echo =======================================================
echo          MENGHENTIKAN SISTEM MooOS
echo =======================================================
echo.
echo Sedang mematikan server Backend dan Frontend...

:: Mematikan semua terminal yang judulnya mengandung MooOS_Backend atau MooOS_Frontend
taskkill /F /T /FI "WINDOWTITLE eq *MooOS_Backend*" >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq *MooOS_Frontend*" >nul 2>&1

echo.
echo MooOS berhasil dimatikan dengan aman!
echo Jendela ini akan tertutup otomatis...
timeout /t 3 >nul
exit
