@echo off
set url="http://localhost:8181"
start "C:\Program Files\Google\Chrome\Application\chrome.exe" "%url%
cd "D:\E DRIVE DATA\latest Barcode 20082021\tag-printing"
node index.js
