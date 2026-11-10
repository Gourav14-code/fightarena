@echo off
title Monster Knockout
echo ======================================================
echo Launching Monster Knockout in your browser...
echo ======================================================

start "" "%~dp0index.html"

echo Server available if needed. Press Ctrl+C to close.
node "%~dp0server.js"
