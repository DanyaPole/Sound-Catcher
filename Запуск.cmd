@echo off
chcp 65001 >nul
title Звуколовка — запуск для теста
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Не найден Node.js. Установите его с https://nodejs.org и запустите этот файл снова.
  pause
  exit /b 1
)
node serve.js --open
echo.
pause
