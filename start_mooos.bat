@echo off
title MooOS Auto-Starter
color 0A

:: Pindah ke folder tempat file .bat ini berada
cd /d "%~dp0"

echo =======================================================
echo          SISTEM MANAJEMEN PETERNAKAN MooOS
echo =======================================================
echo.
echo Sedang menyiapkan aplikasi...
echo.
echo [PENTING] Jika ini pertama kali dijalankan dari hasil download ZIP,
echo proses instalasi dependencies (npm install & pip install) akan
echo berjalan dan mungkin memakan waktu 1-5 menit.
echo.

:: Menjalankan Backend
start "MooOS_Backend" cmd /k "color 0B && title MooOS_Backend && cd backend && echo Menginstall dependencies backend... && python -m pip install -r requirements.txt && echo Menyiapkan database (seeding)... && python -m app.seed && echo Menjalankan server backend... && python -m uvicorn app.main:app --reload --timeout-graceful-shutdown 2"

:: Menjalankan Frontend
start "MooOS_Frontend" cmd /k "color 0E && title MooOS_Frontend && cd frontend && echo Menginstall dependencies frontend... && npm install && echo Menjalankan server frontend... && npm run dev"

echo.
echo Tunggu 15 detik, Browser akan terbuka secara otomatis...
echo (Jika di browser muncul 'Refused to connect', berarti instalasi 
echo  di terminal Backend/Frontend belum selesai. Harap tunggu dan REFRESH.)
echo.
timeout /t 15 /nobreak > nul

:: Buka browser otomatis
start http://localhost:3000

:: Tutup terminal starter ini
exit
