@echo off
setlocal

set "target_date=02-01-2025"
set "target_time=00:00:00"

for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set "current_date=%%a-%%b-%%c"
for /f "tokens=1-4 delims=:. " %%a in ('time /t') do set "current_time=%%a:%%b:%%c"

echo.
echo WARNING: This script will temporarily change your system date!
echo          Run this script as ADMINISTRATOR.
echo.
pause

echo Disabling time synchronization...
net stop w32time >nul 2>&1
w32tm /unregister >nul 2>&1
sc config w32time start= disabled >nul 2>&1

echo Setting system date to %target_date%...
date %target_date%
time %target_time%
echo Current system date set to:
date /t
time /t
echo.

pushd "%~dp0"

echo Running DexProtector...
java -jar dexprotector.jar -configFile dexprotector.xml my_app.apk protected_my_app.apk
set "dexprotector_exit_code=%errorlevel%"

echo.
echo DexProtector finished with exit code: %dexprotector_exit_code%

timeout /t 5 /nobreak >nul

echo Re-enabling time synchronization and resetting date...
sc config w32time start= auto >nul 2>&1
w32tm /register >nul 2>&1
net start w32time >nul 2>&1
w32tm /resync /force >nul 2>&1

echo Date reset command issued. Your system should resynchronize shortly.
echo.
echo Script finished.
pause
endlocal