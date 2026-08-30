@echo off
chcp 65001 >nul
title 🛡️ Telegram Security Bot Runner - Cambodia

echo ========================================================
echo 🛡️ Telegram Security Bot Runner (Windows Edition)
echo ========================================================

:: Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ រកមិនឃើញ Python ក្នុងកុំព្យូទ័រទេ! 
    echo សូមដំឡើង Python ពី https://www.python.org រួចធីកលើ "Add Python to PATH"
    pause
    exit /b
)

:: Create Virtual Environment if not exists
if not exist "venv" (
    echo 📦 កំពុងបង្កើត Python Virtual Environment...
    python -m venv venv
)

:: Activate Virtual Environment
call venv\Scripts\activate.bat

:: Install Requirements
echo 📥 កំពុងដំឡើងកញ្ចប់បណ្ណាល័យ (pip install)...
pip install -r requirements.txt

:: Check .env
if not exist ".env" (
    echo ⚠️ មិនទាន់មាន .env file ទេ! កំពុង Copy ពី .env.example...
    copy .env.example .env
    echo 💡 សូមបើកកែប្រែ .env file រួចដាក់ TELEGRAM_BOT_TOKEN របស់អ្នក!
)

echo ========================================================
echo 🚀 កំពុងដំណើរការ Bot (bot.py)...
echo ចុច Ctrl + C ដើម្បីបិទ
echo ========================================================
python bot.py

pause
