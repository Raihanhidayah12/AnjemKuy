@echo off
REM ============================================================
REM Anjem Kuy - Quick Deploy Script (Windows)
REM ============================================================

echo.
echo ============================================
echo   Anjem Kuy - Deploy Script (Windows)
echo ============================================
echo.

REM Check if git is initialized
if not exist .git (
    echo [WARNING] Git not initialized. Initializing...
    git init
    echo [SUCCESS] Git initialized
    echo.
)

REM Check if remote exists
git remote | findstr /C:"origin" >nul
if errorlevel 1 (
    echo [ERROR] No git remote 'origin' found!
    echo Please add your repository:
    echo   git remote add origin https://github.com/username/anjemkuy.git
    pause
    exit /b 1
)

echo [INFO] Building project...
call npm run build

if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo [SUCCESS] Build successful
echo.

REM Git operations
echo [INFO] Preparing commit...
git add .

set /p commit_message="Enter commit message (or press Enter for default): "

if "%commit_message%"=="" (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a:%%b)
    set commit_message=Deploy: %mydate% %mytime%
)

git commit -m "%commit_message%"

echo [INFO] Pushing to repository...
git push origin main

if errorlevel 1 (
    echo [ERROR] Push failed!
    echo Try: git push -u origin main
    pause
    exit /b 1
)

echo [SUCCESS] Successfully pushed to GitHub
echo.
echo ============================================
echo   Deployment triggered!
echo ============================================
echo.
echo Next steps:
echo 1. Check Vercel dashboard for deployment status
echo 2. Visit your app at: https://anjemkuy.vercel.app
echo 3. Test booking flow end-to-end
echo.
echo Happy deploying!
echo.
pause
