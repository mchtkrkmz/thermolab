@echo off
title ThermoLab WebXR Sunucusu
echo ======================================================
echo    ThermoLab WebXR Gelistirici Sunucusu Baslatiliyor
echo ======================================================
echo Proje Dizini: %~dp0
cd /d "%~dp0"

echo.
echo Bagimliliklar kontrol ediliyor...
if not exist "node_modules\" (
    echo node_modules bulunamadi, paketler yukleniyor...
    call npm install
)

echo.
echo Sunucu calistiriliyor (HTTPS ve Yerel Ag Destekli)...
echo Durdurmak icin bu pencereyi kapatabilir veya CTRL+C yapabilirsiniz.
echo.

call npm run dev

pause
