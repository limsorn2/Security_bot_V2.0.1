#!/usr/bin/env bash

echo "========================================================"
echo "🛡️ Telegram Malware & Group Security Guard Bot Launcher"
echo "========================================================"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null
then
    echo "❌ រកមិនឃើញ Python3 ទេ! សូមដំឡើង Python 3 ជាមុនសិន។"
    exit 1
fi

# Check if virtualenv exists, if not create one
if [ ! -d "venv" ]; then
    echo "📦 កំពុងបង្កើត Python Virtual Environment (venv)..."
    python3 -m venv venv
fi

# Activate virtualenv
source venv/bin/activate

# Install dependencies
echo "📥 កំពុងដំឡើងកញ្ចប់បណ្ណាល័យ (pip install -r requirements.txt)..."
pip install --upgrade pip
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️ មិនទាន់មាន .env file ទេ! កំពុង Copy ពី .env.example..."
    cp .env.example .env
    echo "💡 សូមបើកកែប្រែ .env file រួចដាក់ TELEGRAM_BOT_TOKEN របស់អ្នក!"
fi

echo "========================================================"
echo "🚀 កំពុងចាប់ផ្តើមដំណើរការ Python Bot (bot.py)..."
echo "========================================================"
python3 bot.py
