@echo off
set url="http://localhost:8181"
start "c:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "%url%
cd "C:/Users/MILANA/Desktop/Barcode-Printing-complete/Barcode-Printing-complete"
node index.js
