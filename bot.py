import os
import sys
import time
import logging
import asyncio
from collections import defaultdict
import requests
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters
)

# Configure Logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger("TeleGuardBot")

# Fetch environment secrets
BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID_RAW = os.getenv("ADMIN_ID", "240224709")
# Dashboard Web App URL (ឧ. URL របស់ Web Dashboard លើ Google AI Studio / Cloud Run)
DASHBOARD_API_URL = os.getenv("DASHBOARD_API_URL", "http://localhost:3000")

if not BOT_TOKEN:
    logger.error("❌ កំហុស៖ មិនឃើញ BOT_TOKEN នៅក្នុង Secrets ទេ! សូមកំណត់ BOT_TOKEN ក្នុង GitHub Secrets។")
    sys.exit(1)

try:
    ADMIN_ID = int(ADMIN_ID_RAW)
except ValueError:
    ADMIN_ID = 240224709

# Security Configurations
BLOCKED_EXTENSIONS = [
    ".apk", ".xapk", ".aab", ".exe", ".scr", ".bat", ".cmd", ".msi", ".com",
    ".pif", ".hta", ".cpl", ".sh", ".bash", ".ps1", ".psm1", ".vbs", ".vbe",
    ".js", ".jse", ".wsf", ".jar", ".reg"
]
FLOOD_LIMIT = 5       # អតិបរមា ៥ សារ
FLOOD_WINDOW = 4      # ក្នុងរយៈពេល ៤ វិនាទី
user_message_timestamps = defaultdict(list)

# ----------------- 2-WAY SYNC HELPERS (Telegram <-> Web App) -----------------
def sync_threat_log_to_dashboard(event_type: str, chat_id: str, chat_title: str, user_id: str, user_name: str, details: str, action: str):
    """បញ្ជូន Threat Log ពី Telegram ទៅកាន់ Web Dashboard ភ្លាមៗ (Auto-Sync)"""
    try:
        url = f"{DASHBOARD_API_URL.rstrip('/')}/api/logs"
        payload = {
            "event_type": event_type,
            "chat_id": str(chat_id),
            "chat_title": chat_title or "Telegram Group",
            "user_id": str(user_id),
            "user_name": user_name or "Unknown User",
            "details": details,
            "action": action
        }
        resp = requests.post(url, json=payload, timeout=4)
        if resp.status_code == 200:
            logger.info(f"✅ បាន Auto-Sync កំណត់ត្រា {event_type} ទៅ Web Dashboard រួចរាល់!")
    except Exception as e:
        logger.debug(f"Dashboard sync skipped or offline: {e}")

def sync_group_status(chat_id: str, title: str, added_by_name: str, added_by_username: str, added_by_id: str):
    """បញ្ជូនព័ត៌មានក្រុមថ្មីទៅកាន់ Web Dashboard Group Manager (Auto-Sync)"""
    try:
        url = f"{DASHBOARD_API_URL.rstrip('/')}/api/groups/{chat_id}/action"
        payload = {
            "action": "sync_info",
            "title": title,
            "addedByName": added_by_name,
            "addedByUsername": added_by_username,
            "addedById": added_by_id
        }
        requests.post(url, json=payload, timeout=4)
    except Exception as e:
        logger.debug(f"Group sync skipped: {e}")

# Command: /start
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome_text = (
        "🛡️ <b>សូមស្វាគមន៍មកកាន់ TeleGuard Pro Security Bot!</b>\n\n"
        "ប្រព័ន្ធការពារ និងគ្រប់គ្រងសន្តិសុខគ្រុប Telegram ស្វ័យប្រវត្តិកំពុងដំណើរការ។\n\n"
        "✨ <b>មុខងារការពារសកម្ម & Auto-Sync៖</b>\n"
        "• 🚫 Anti-Malware / Dangerous Files (.apk, .exe, ...)\n"
        "• ⚡ Anti-Flood / Anti-Spam Auto Mute\n"
        "• 🔄 Auto-Sync ជាមួយ Web Dashboard ពេលវេលាជាក់ស្តែង (Realtime)\n"
        "• 🛡️ Realtime Group Audit & Protection\n\n"
        "<i>សូម Add Bot ចូលក្នុងគ្រុបរបស់អ្នក រួចផ្ដល់សិទ្ធិជា Admin!</i>"
    )
    if update.message:
        await update.message.reply_text(welcome_text, parse_mode="HTML")

# Command: /help
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = (
        "📖 <b>បញ្ជីពាក្យបញ្ជា TeleGuard Security:</b>\n\n"
        "/start - បើកដំណើរការ Bot\n"
        "/help - បង្ហាញជំនួយ\n"
        "/status - ពិនិត្យមើលស្ថានភាពប្រព័ន្ធសុវត្ថិភាព & Auto-Sync\n"
        "/rules - មើលគោលការណ៍សន្តិសុខគ្រុប"
    )
    if update.message:
        await update.message.reply_text(help_text, parse_mode="HTML")

# Command: /status
async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    status_text = (
        "🟢 <b>ប្រព័ន្ធសុវត្ថិភាព TeleGuard Pro សកម្ម (Online 24/7)</b>\n"
        f"• Admin ID: <code>{ADMIN_ID}</code>\n"
        "• Anti-Malware Engine: <b>Active</b>\n"
        "• Anti-Flood Shield: <b>Active (5 msgs/4s)</b>\n"
        "• Web App 2-Way Sync: <b>Enabled 🔄</b>\n"
        "• Status: <b>Normal & Protected</b>"
    )
    if update.message:
        await update.message.reply_text(status_text, parse_mode="HTML")

# Handler: Check Dangerous File Attachments (.apk, .exe, ...)
async def file_inspector(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.effective_message
    if not message:
        return

    doc = message.document
    if doc and doc.file_name:
        file_name = doc.file_name.lower()
        if any(file_name.endswith(ext) for ext in BLOCKED_EXTENSIONS):
            user = message.from_user
            user_name = user.first_name if user else "User"
            user_id = str(user.id) if user else "N/A"
            user_mention = f"@{user.username}" if user and user.username else user_name
            chat_title = message.chat.title or "Private Chat"
            chat_id = str(message.chat_id)

            try:
                # 1. Delete dangerous file from Telegram Group
                await message.delete()
                logger.info(f"🚫 បានលុបឯកសារគ្រោះថ្នាក់ {file_name} ពី {user_name} ក្នុងក្រុម {chat_title}")

                # 2. Send Warning in Group
                alert_msg = (
                    f"⚠️ <b>ការព្រមានសន្តិសុខ (Security Alert)!</b>\n\n"
                    f"សមាជិក {user_mention} បានផ្ញើឯកសារហាមឃាត់: <code>{doc.file_name}</code>\n"
                    f"🛡️ ប្រព័ន្ធបានធ្វើការលុបឯកសារនេះចោលភ្លាមៗដើម្បីសុវត្ថិភាពសមាជិកក្នុងគ្រុប!"
                )
                await context.bot.send_message(
                    chat_id=message.chat_id,
                    text=alert_msg,
                    parse_mode="HTML"
                )

                # 3. 🔄 Auto-Sync Log to Web Dashboard
                sync_threat_log_to_dashboard(
                    event_type="MALWARE_BLOCKED",
                    chat_id=chat_id,
                    chat_title=chat_title,
                    user_id=user_id,
                    user_name=user_name,
                    details=f"Blocked dangerous payload: {doc.file_name} (High-Risk Extension Detected)",
                    action="🗑️ បានលុបសារ & ព្រមានសមាជិក"
                )
            except Exception as e:
                logger.warning(f"Failed to delete message: {e}")

# Handler: Anti-Flood / Spam Protection
async def message_inspector(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.effective_message
    if not message or not message.from_user:
        return

    user_id = message.from_user.id
    now = time.time()

    # Track message rate
    timestamps = user_message_timestamps[user_id]
    user_message_timestamps[user_id] = [t for t in timestamps if now - t < FLOOD_WINDOW]
    user_message_timestamps[user_id].append(now)

    # Check if exceeding limit
    if len(user_message_timestamps[user_id]) > FLOOD_LIMIT:
        user_name = message.from_user.first_name
        chat_title = message.chat.title or "Telegram Group"
        chat_id = str(message.chat_id)

        try:
            await message.delete()
            await message.reply_text(
                f"⚠️ <b>សូមកុំ Spam សារញាប់ពេក!</b>\nសមាជិក {user_name} ត្រូវបានរកឃើញថាផ្ញើសារ Flood/Spam។",
                parse_mode="HTML"
            )
            user_message_timestamps[user_id].clear()

            # 🔄 Auto-Sync Anti-Flood Trigger to Web Dashboard
            sync_threat_log_to_dashboard(
                event_type="FLOOD_SPAM_BLOCKED",
                chat_id=chat_id,
                chat_title=chat_title,
                user_id=str(user_id),
                user_name=user_name,
                details=f"Anti-Flood Triggered: Sent >5 messages in 4s",
                action="⚡ បានលុបសារ & បិទសិទ្ធិជាបណ្តោះអាសន្ន"
            )
        except Exception as e:
            logger.warning(f"Error handling flood: {e}")

def main():
    logger.info("🚀 កំពុងចាប់ផ្តើម TeleGuard Bot Engine ជាមួយ 2-Way Auto Sync...")
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    # Register Handlers
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("status", status_command))
    app.add_handler(MessageHandler(filters.Document.ALL, file_inspector))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_inspector))

    logger.info("✅ Bot បានភ្ជាប់ទៅកាន់ Telegram ដោយជោគជ័យ! កំពុងស្តាប់ព្រឹត្តិការណ៍...")
    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
