@echo off
cd /d "%~dp0"
set DB_SERVER=localhost\SQLEXPRESS
set DB_NAME=GameCareDB
set DB_DRIVER=ODBC Driver 18 for SQL Server
python server.py
pause
