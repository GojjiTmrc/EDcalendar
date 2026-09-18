@echo off
title EDcalendar - Teaching Schedule Web App
echo ========================================================
echo   กำลังเริ่มต้นระบบ EDcalendar สำหรับคุณครู...
echo   กรุณาอย่าเพิ่งปิดหน้าต่างนี้ขณะใช้งานเว็บไซต์
echo ========================================================
cd /d "%~dp0"
start http://localhost:5173/
npm.cmd run dev
pause
