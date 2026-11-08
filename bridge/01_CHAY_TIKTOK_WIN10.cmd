@echo off
setlocal
title LOP HOC 12A - NHAN BINH LUAN VA QUA TIKTOK
cd /d "%~dp0"
echo.
echo =========================================
echo   LOP HOC 12A - KET NOI TIKTOK LIVE THAT
echo =========================================
echo.
where node >nul 2>nul
if errorlevel 1 (
 echo [LOI] Chua cai Node.js. Cai ban LTS tu https://nodejs.org
 pause
 exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
 echo [LOI] Khong thay npm. Hay cai lai Node.js LTS.
 pause
 exit /b 1
)
if not exist "node_modules\tiktok-live-connector" (
 echo Dang cai cac goi ket noi lan dau...
 call npm install --no-audit --no-fund
 if errorlevel 1 (
   echo [LOI] npm install that bai. Kiem tra internet va thu lai.
   pause
   exit /b 1
 )
)
echo.
echo Nhap ten TikTok UNIQUE ID cua CHINH BAN, KHONG nhap mat khau.
echo Vi du TikTok co link tiktok.com/@abc123 thi nhap abc123
set /p "TIKTOK_USERNAME=Ten TikTok: "
if not defined TIKTOK_USERNAME (
 echo [LOI] Chua nhap ten TikTok.
 pause
 exit /b 1
)
set "TIKTOK_USERNAME=%TIKTOK_USERNAME:@=%"
set "PORT=10000"
echo.
echo May chu dang khoi dong tren http://127.0.0.1:10000
echo Khi LIVE bat dau, se thu ket noi TikTok @%TIKTOK_USERNAME%.
echo De cua so nay MO TRONG SUOT BUOI LIVE.
echo Nen khoi dong TikTok LIVE truoc khi chay de tranh loi offline.
echo.
call npm start
echo.
echo May chu da dung. Nhan phim bat ky de dong cua so.
pause >nul
