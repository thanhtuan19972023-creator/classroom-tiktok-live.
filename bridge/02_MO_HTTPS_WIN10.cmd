@echo off
setlocal
title LOP HOC 12A - CLOUDFLARE TUNNEL
echo.
echo =========================================
echo   TAO LINK HTTPS CHO GAME 12A TREN IPHONE
echo =========================================
echo.
where cloudflared >nul 2>nul
if errorlevel 1 (
 echo [LOI] Chua cai cloudflared.
 echo Neu co winget, mo CMD va chay:
 echo   winget install -e --id Cloudflare.cloudflared
 echo Hoac tai bo cai Windows tu https://developers.cloudflare.com/tunnel/downloads/
 echo Cai xong, DONG VA MO LAI cua so CMD.
 pause
 exit /b 1
)
echo.
echo [LUU Y] Hay bat 01_CHAY_TIKTOK_WIN10.cmd TRUOC.
echo.
echo Dang tao dia chi HTTPS tam thoi...
echo Khi hien duong dan https://xxxx.trycloudflare.com,
echo COPY dung link nay vao game 12A muc "Ket noi TikTok LIVE that".
echo Link SE DOI khi ban dong va chay lai cua so nay.
echo De cua so nay MO trong suot buoi LIVE.
echo.
cloudflared tunnel --url http://127.0.0.1:10000
echo.
echo Tunnel da dung. Nhan phim bat ky de dong cua so.
pause >nul
