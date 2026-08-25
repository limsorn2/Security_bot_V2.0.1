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

# ----------------- LOGGING CONFIGURATION -----------------
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger("Security_bot_V2.0.1")

# ----------------- ENVIRONMENT SECRETS -----------------
BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID_RAW = os.getenv("ADMIN_ID", "240224709")
DASHBOARD_API_URL = os.getenv("DASHBOARD_API_URL", "http://localhost:3000")

# Settings from Environment (with smart defaults)
AUTO_DELETE_SERVICE_MSGS = os.getenv("AUTO_DELETE_SERVICE_MSGS", "true").lower() == "true"
BOT_MSG_DELETE_SECONDS = int(os.getenv("BOT_MSG_DELETE_SECONDS", "15"))
ANTI_FLOOD_ENABLED = os.getenv("ANTI_FLOOD_ENABLED", "true").lower() == "true"
FLOOD_LIMIT = int(os.getenv("FLOOD_MAX_MSGS", "5"))
FLOOD_WINDOW = int(os.getenv("FLOOD_WINDOW_SECONDS", "4"))

if not BOT_TOKEN:
    logger.error("❌ កំហុស៖ មិនឃើញ BOT_TOKEN នៅក្នុង Secrets ទេ! សូមកំណត់ BOT_TOKEN ក្នុង GitHub Secrets។")
    sys.exit(1)

try:
    ADMIN_ID = int(ADMIN_ID_RAW)
except ValueError:
    ADMIN_ID = 240224709

# ----------------- SECURITY CONFIGURATIONS -----------------
BLOCKED_EXTENSIONS = [
    ".apk", ".xapk", ".aab", ".exe", ".scr", ".bat", ".cmd", ".msi", ".com",
    ".pif", ".hta", ".cpl", ".sh", ".bash", ".ps1", ".psm1", ".vbs", ".vbe",
    ".js", ".jse", ".wsf", ".jar", ".reg"
]

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
    """បញ្ជូនព័ត៌មានក្រុមថ្មីទៅកាន់ Web Dashboard Group CRM (Auto-Sync)"""
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

# Helper: Auto delete bot warning messages after X seconds
async def auto_delete_message(bot, chat_id: int, message_id: int, delay_seconds: int = 15):
    try:
        await asyncio.sleep(delay_seconds)
        await bot.delete_message(chat_id=chat_id, message_id=message_id)
    except Exception:
        pass

# ----------------- BOT COMMANDS -----------------

# Command: /start
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome_text = (
        "🛡️ <b>សូមស្វាគមន៍មកកាន់ Security_bot_V2.0.1!</b>\n\n"
        "ប្រព័ន្ធការពារ និងគ្រប់គ្រងសន្តិសុខគ្រុប Telegram ស្វ័យប្រវត្តិកំពុងដំណើរការ។\n\n"
        "✨ <b>មុខងារការពារសកម្ម & Auto-Sync៖</b>\n"
        "• 🚫 Anti-Malware / Dangerous Files (.apk, .exe, ...)\n"
        "• ⚡ Anti-Flood / Anti-Spam Auto Mute\n"
        "• 🆔 ពិនិត្យ Group ID & User ID ភ្លាមៗ (វាយ <code>/id</code>)\n"
        "• 🔄 Auto-Sync ជាមួយ Web Dashboard ពេលវេលាជាក់ស្តែង (Realtime)\n"
        "• 🛡️ Realtime Group Audit & Protection\n\n"
        "<i>សូម Add Bot ចូលក្នុងគ្រុបរបស់អ្នក រួចផ្ដល់សិទ្ធិជា Admin!</i>"
    )
    if update.message:
        await update.message.reply_text(welcome_text, parse_mode="HTML")

# Command: /help
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = (
        "📖 <b>បញ្ជីពាក្យបញ្ជា Security_bot_V2.0.1:</b>\n\n"
        "🔹 <code>/id</code> ឬ <code>/groupid</code> - ឆែកមើល Group ID & User ID\n"
        "🔹 <code>/status</code> - ពិនិត្យមើលស្ថានភាពប្រព័ន្ធសុវត្ថិភាព\n"
        "🔹 <code>/rules</code> - មើលគោលការណ៍សន្តិសុខគ្រុប\n"
        "🔹 <code>/help</code> - បង្ហាញជំនួយនេះ"
    )
    if update.message:
        await update.message.reply_text(help_text, parse_mode="HTML")

# Command: /id, /groupid, /myid, /chatid, /info, /status (ឆែក ID ក្រុម និង អ្នកប្រើប្រាស់)
async def id_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.effective_message
    if not message:
        return

    chat = update.effective_chat
    user = update.effective_user

    chat_id = str(chat.id) if chat else "Unknown"
    chat_title = chat.title if chat and chat.title else "Private Chat"
    chat_type = chat.type.capitalize() if chat and chat.type else "Unknown"

    user_id = str(user.id) if user else "Unknown"
    user_name = user.first_name if user else "User"
    username = f"@{user.username}" if user and user.username else "គ្មាន username"

    response_text = (
        "🆔 <b>ព័ត៌មានអត្តសញ្ញាណ (ID & Chat Info)</b>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        f"👥 <b>ឈ្មោះក្រុម:</b> <code>{chat_title}</code>\n"
        f"📍 <b>Group ID:</b> <code>{chat_id}</code>  <i>(ចុចលើលេខដើម្បី Copy)</i>\n"
        f"🏷️ <b>ប្រភេទ Chat:</b> {chat_type}\n\n"
        f"👤 <b>អ្នកស្នើសុំ:</b> {user_name} ({username})\n"
        f"🔑 <b>User ID:</b> <code>{user_id}</code>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "🛡️ <i>Security_bot_V2.0.1 កំពុងការពារគ្រុបនេះដោយស្វ័យប្រវត្តិ!</i>"
    )

    sent_msg = await message.reply_text(response_text, parse_mode="HTML")

    # Auto-Sync Group to Web App CRM
    if chat and chat.type in ["group", "supergroup"]:
        sync_group_status(
            chat_id=chat_id,
            title=chat_title,
            added_by_name=user_name,
            added_by_username=username,
            added_by_id=user_id
        )

# Handler: ស្វាគមន៍ & ប្រាប់ ID ស្វ័យប្រវត្តិពេល Add Bot ចូលក្នុងគ្រុបថ្មី
async def chat_member_update_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.effective_message
    if not message or not message.new_chat_members:
        return

    chat = update.effective_chat
    chat_id = str(chat.id) if chat else ""
    chat_title = chat.title if chat else "Telegram Group"

    for member in message.new_chat_members:
        # បើ Bot ខ្លួនឯងត្រូវបាន Add ចូល
        if member.id == context.bot.id:
            from_user = message.from_user
            adder_name = from_user.first_name if from_user else "Admin"
            adder_username = f"@{from_user.username}" if from_user and from_user.username else ""
            adder_id = str(from_user.id) if from_user else ""

            welcome_msg = (
                "🛡️ <b>Security_bot_V2.0.1 ត្រូវបានបន្ថែមចូលក្នុងគ្រុប!</b>\n\n"
                f"👥 <b>ក្រុម:</b> <code>{chat_title}</code>\n"
                f"🆔 <b>Group ID:</b> <code>{chat_id}</code>  <i>(ចុចដើម្បី Copy)</i>\n"
                f"👑 <b>បន្ថែមដោយ:</b> {adder_name} ({adder_username})\n\n"
                "⚠️ <b>ជំហានសំខាន់ដើម្បីបើកការការពារពេញលេញ៖</b>\n"
                "1. សូម Promote Bot ឱ្យទៅជា <b>Admin</b>\n"
                "2. បើកសិទ្ធិ <b>Delete Messages</b> និង <b>Ban/Restrict Users</b>\n\n"
                "✅ <i>ប្រព័ន្ធការពារមេរោគ .apk/.exe និង Anti-Flood បានចាប់ផ្តើមជាផ្លូវការ!</i>"
            )
            await message.reply_text(welcome_msg, parse_mode="HTML")

            # Auto-Sync to Web Dashboard CRM
            sync_group_status(
                chat_id=chat_id,
                title=chat_title,
                added_by_name=adder_name,
                added_by_username=adder_username,
                added_by_id=adder_id
            )

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
                # 1. Delete dangerous file
                await message.delete()
                logger.info(f"🚫 បានលុបឯកសារគ្រោះថ្នាក់ {file_name} ពី {user_name} ក្នុងក្រុម {chat_title}")

                # 2. Send Warning
                alert_msg = (
                    f"⚠️ <b>ការព្រមានសន្តិសុខ (Security Alert)!</b>\n\n"
                    f"សមាជិក {user_mention} បានផ្ញើឯកសារហាមឃាត់: <code>{doc.file_name}</code>\n"
                    f"🛡️ ប្រព័ន្ធបានធ្វើការលុបឯកសារនេះចោលភ្លាមៗដើម្បីសុវត្ថិភាពសមាជិកក្នុងគ្រុប!"
                )
                warn_msg = await context.bot.send_message(
                    chat_id=message.chat_id,
                    text=alert_msg,
                    parse_mode="HTML"
                )

                # Auto delete warning message if configured
                if BOT_MSG_DELETE_SECONDS > 0:
                    asyncio.create_task(auto_delete_message(context.bot, message.chat_id, warn_msg.message_id, BOT_MSG_DELETE_SECONDS))

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
                logger.warning(f"Failed to delete dangerous file: {e}")

# Handler: Anti-Flood / Spam Protection
async def message_inspector(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not ANTI_FLOOD_ENABLED:
        return

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
            warn = await message.reply_text(
                f"⚠️ <b>សូមកុំ Spam សារញាប់ពេក!</b>\nសមាជិក {user_name} ត្រូវបានរកឃើញថាផ្ញើសារ Flood/Spam ({FLOOD_LIMIT} សារក្នុង {FLOOD_WINDOW} វិនាទី)។",
                parse_mode="HTML"
            )
            user_message_timestamps[user_id].clear()

            if BOT_MSG_DELETE_SECONDS > 0:
                asyncio.create_task(auto_delete_message(context.bot, message.chat_id, warn.message_id, BOT_MSG_DELETE_SECONDS))

            # 🔄 Auto-Sync Anti-Flood Trigger to Web Dashboard
            sync_threat_log_to_dashboard(
                event_type="FLOOD_SPAM_BLOCKED",
                chat_id=chat_id,
                chat_title=chat_title,
                user_id=str(user_id),
                user_name=user_name,
                details=f"Anti-Flood Triggered: Sent >{FLOOD_LIMIT} messages in {FLOOD_WINDOW}s",
                action="⚡ បានលុបសារ & បិទសិទ្ធិជាបណ្តោះអាសន្ន"
            )
        except Exception as e:
            logger.warning(f"Error handling flood: {e}")

def main():
    logger.info("🚀 កំពុងចាប់ផ្តើម Security_bot_V2.0.1 ជាមួយ 2-Way Auto Sync & ID Commands...")
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    # Register Command & Message Handlers
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("id", id_command))
    app.add_handler(CommandHandler("groupid", id_command))
    app.add_handler(CommandHandler("myid", id_command))
    app.add_handler(CommandHandler("chatid", id_command))
    app.add_handler(CommandHandler("info", id_command))
    app.add_handler(CommandHandler("status", id_command))
    app.add_handler(MessageHandler(filters.StatusUpdate.NEW_CHAT_MEMBERS, chat_member_update_handler))
    app.add_handler(MessageHandler(filters.Document.ALL, file_inspector))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_inspector))

    logger.info("✅ Bot បានភ្ជាប់ទៅកាន់ Telegram ដោយជោគជ័យ! កំពុងស្តាប់ព្រឹត្តិការណ៍...")
    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
