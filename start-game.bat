@echo off
title Shadow Shuriken: Rooftop Shinobi
echo ======================================================
echo Launching Shadow Shuriken in your browser...
echo ======================================================

start "" "%~dp0index.html"

echo Server available if needed. Press Ctrl+C to close.
node "%~dp0server.js"
