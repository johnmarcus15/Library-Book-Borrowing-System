@echo off
title Easwari Library System - One-Click Launcher
echo ======================================================================
echo   Easwari Engineering College - Department of CSE
echo   Library Book Borrowing Management System
echo ======================================================================
echo.

cd /d "%~dp0"

echo [Step 1/3] Launching Local MongoDB Database (Port 27017)...
start "1. MongoDB Database [Keep Open]" cmd /k "cd server && npm run mongo"

echo Waiting for database to initialize...
timeout /t 4 /nobreak >nul

echo [Step 2/3] Seeding 22 Books, Admin Account and Starting Backend API (Port 5000)...
start "2. Backend API Server [Keep Open]" cmd /k "cd server && npm run seed && npm run admin:create && npm run dev"

echo Waiting for backend API to start...
timeout /t 4 /nobreak >nul

echo [Step 3/3] Launching Frontend Development Server (Port 5173)...
start "3. Frontend React Client [Keep Open]" cmd /k "cd client && npm run dev"

echo.
echo Opening browser to http://localhost:5173 ...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo ======================================================================
echo   SUCCESS! All 3 services are now running in separate windows.
echo   Keep those 3 windows open while using the application.
echo ======================================================================
echo.
pause
