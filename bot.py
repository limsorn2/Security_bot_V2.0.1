import os
import sys
import time
import logging
import asyncio
from collections import defaultdict
import requests
from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    BotCommand,
    MenuButtonCommands
)
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
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
APP_URL = os.getenv("APP_URL") # ថែម Variable ថ្មីសម្រាប់ Webhook Link របស់ Render

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

# ----------------- INLINE KEYBOARD BUTTON BUILDERS -----------------
def get_main_menu_keyboard(bot_username: str = ""):
    """បង្កើតប៊ូតុងបញ្ជាអន្តរកម្ម (Interactive Buttons) ក្នុង Telegram Chat"""
    bot_link = f"https://t.me/{bot_username}?startgroup=true" if bot_username else "https://t.me/sornsecurityrobot"
    
    keyboard = [
        [
            InlineKeyboardButton("🆔 ឆែក ID ក្រុម & ខ្ញុំ", callback_data="btn_id"),
            InlineKeyboardButton("📊 ស្ថានភាពប្រព័ន្ធ", callback_data="btn_status"),
        ],
        [
            InlineKeyboardButton("🛡️ គោលការណ៍ការពារ", callback_data="btn_rules"),
            InlineKeyboardButton("📖 សៀវភៅជំនួយ", callback_data="btn_help"),
        ],
        [
            InlineKeyboardButton("➕ Add Bot ទៅកាន់ Group Telegram", url=bot_link),
        ],
        [
            InlineKeyboardButton("🔄 Refresh ព័ត៌មាន", callback_data="btn_refresh"),
            InlineKeyboardButton("👑 ទាក់ទង Admin", url="https://t.me/sornsecurityrobot"),
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

# ----------------- 2-WAY SYNC HELPERS (Telegram <-> Web App) -----------------
def sync_threat_log_to_dashboard(event_type: str, chat_id: str, chat_title: str, user_id: str, user_name: str, details: str, action: str):
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

async def auto_delete_message(bot, chat_id: int, message_id: int, delay_seconds: int = 15):
    try:
        await asyncio.sleep(delay_seconds)
        await bot.delete_message(chat_id=chat_id, message_id=message_id)
    except Exception:
        pass

# ----------------- BOT COMMANDS -----------------
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_info = await context.bot.get_me()
    bot_username = bot_info.username or ""

    welcome_text = (
        "🛡️ <b>សូមស្វាគមន៍មកកាន់ Security_bot_V2.0.1!</b>\n\n"
        "ប្រព័ន្ធការពារ និងគ្រប់គ្រងសន្តិសុខគ្រុប Telegram ស្វ័យប្រវត្តិកំពុងដំណើរការ 24/7។\n\n"
        "✨ <b>មុខងារការពារសកម្ម & Auto-Sync៖</b>\n"
        "• 🚫 Anti-Malware / Dangerous Files (.apk, .exe, .bat, ...)\n"
        "• ⚡ Anti-Flood / Anti-Spam Auto Warning\n"
        "• 🆔 ពិនិត្យ Group ID & User ID ភ្លាមៗ\n"
        "• 🔄 Auto-Sync ជាមួយ Web Dashboard Realtime\n\n"
        "👇 <b>សូមចុចប៊ូតុងបញ្ជាខាងក្រោម ដើម្បីប្រើប្រាស់មុខងារ៖</b>"
    )
    if update.message:
        await update.message.reply_text(
            welcome_text,
            parse_mode="HTML",
            reply_markup=get_main_menu_keyboard(bot_username)
        )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_info = await context.bot.get_me()
    bot_username = bot_info.username or ""

    help_text = (
        "📖 <b>បញ្ជីពាក្យបញ្ជា Security_bot_V2.0.1:</b>\n\n"
        "🔹 <code>/start</code> - បើកផ្ទាំងបញ្ជា & ប៊ូតុងចុចអន្តរកម្ម\n"
        "🔹 <code>/id</code> ឬ <code>/groupid</code> - ឆែកមើល Group ID & User ID\n"
        "🔹 <code>/status</code> - ពិនិត្យមើលស្ថានភាពប្រព័ន្ធសុវត្ថិភាព\n"
        "🔹 <code>/rules</code> - មើលគោលការណ៍សន្តិសុខគ្រុប\n"
        "🔹 <code>/help</code> - បង្ហាញជំនួយនេះ\n\n"
        "👇 <i>លោកអ្នកក៏អាចចុចលើប៊ូតុងរហ័សខាងក្រោមបានផងដែរ៖</i>"
    )
    if update.message:
        await update.message.reply_text(
            help_text,
            parse_mode="HTML",
            reply_markup=get_main_menu_keyboard(bot_username)
        )

async def rules_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_info = await context.bot.get_me()
    bot_username = bot_info.username or ""

    rules_text = (
        "🛡️ <b>គោលការណ៍សុវត្ថិភាពគ្រុប (Security Rules)</b>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "1. 🚫 <b>ហាមដាច់ខាត:</b> ផ្ញើ File មេរោគ (.apk, .exe, .cmd, .scr, .bat...)\n"
        "2. ⚡ <b>ហាម Spam:</b> ផ្ញើសារ Flood ញាប់លើសកំណត់ក្នុងគ្រុប\n"
        "3. 🔗 <b>ហាម Phishing:</b> ផ្ញើ Link បោកប្រាស់ ឬផ្សព្វផ្សាយខុសច្បាប់\n"
        "4. ⚖️ <b>វិធានការ:</b> ប្រព័ន្ធនឹងលុបសារ និងកំហិតសិទ្ធិដោយស្វ័យប្រវត្តិ!\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "✅ <i>Security_bot_V2.0.1 ការពារសុវត្ថិភាពសមាជិកគ្រប់ពេលវេលា!</i>"
    )
    if update.message:
        await update.message.reply_text(
            rules_text,
            parse_mode="HTML",
            reply_markup=get_main_menu_keyboard(bot_username)
        )

async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_info = await context.bot.get_me()
    bot_username = bot_info.username or ""

    status_text = (
        "📊 <b>ស្ថានភាពប្រព័ន្ធសន្តិសុខ (System Status)</b>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "🛡️ <b>Bot Engine:</b> Security_bot_V2.0.1 (Online ✅)\n"
        "🚫 <b>Anti-Malware:</b> Active (.apk, .exe, .bat, .js...)\n"
        "⚡ <b>Anti-Flood:</b> Active (Limit 5 msgs / 4s)\n"
        "🔄 <b>2-Way CRM Sync:</b> Online Realtime\n"
        f"👑 <b>Super Admin:</b> ID <code>{ADMIN_ID}</code>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "🟢 <i>ប្រព័ន្ធកំពុងដំណើរការការពារគ្រុប 24/7!</i>"
    )
    if update.message:
        await update.message.reply_text(
            status_text,
            parse_mode="HTML",
            reply_markup=get_main_menu_keyboard(bot_username)
        )

async def id_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.effective_message
    if not message:
        return

    chat = update.effective_chat
    user = update.effective_user
    bot_info = await context.bot.get_me()
    bot_username = bot_info.username or ""

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

    await message.reply_text(
        response_text,
        parse_mode="HTML",
        reply_markup=get_main_menu_keyboard(bot_username)
    )

    if chat and chat.type in ["group", "supergroup"]:
        sync_group_status(
            chat_id=chat_id,
            title=chat_title,
            added_by_name=user_name,
            added_by_username=username,
            added_by_id=user_id
        )

# ----------------- CALLBACK QUERY HANDLER (Button Clicks) -----------------
async def callback_query_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if not query:
        return

    data = query.data
    chat = update.effective_chat
    user = update.effective_user
    bot_info = await context.bot.get_me()
    bot_username = bot_info.username or ""

    if data == "btn_id":
        await query.answer("🆔 កំពុងទាញយកព័ត៌មាន ID...")
        chat_id = str(chat.id) if chat else "Unknown"
        chat_title = chat.title if chat and chat.title else "Private Chat"
        user_id = str(user.id) if user else "Unknown"
        user_name = user.first_name if user else "User"

        text = (
            "🆔 <b>ព័ត៌មានអត្តសញ្ញាណ (ID & Chat Info)</b>\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            f"👥 <b>ឈ្មោះក្រុម:</b> <code>{chat_title}</code>\n"
            f"📍 <b>Group ID:</b> <code>{chat_id}</code>  <i>(ចុចដើម្បី Copy)</i>\n\n"
            f"👤 <b>អ្នកស្នើសុំ:</b> {user_name}\n"
            f"🔑 <b>User ID:</b> <code>{user_id}</code>\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "🛡️ <i>ចុចប៊ូតុងខាងក្រោមដើម្បីជ្រើសរើសមុខងារផ្សេងទៀត៖</i>"
        )
        try:
            await query.edit_message_text(text, parse_mode="HTML", reply_markup=get_main_menu_keyboard(bot_username))
        except Exception:
            pass

    elif data == "btn_status":
        await query.answer("📊 ពិនិត្យស្ថានភាពប្រព័ន្ធ...")
        text = (
            "📊 <b>ស្ថានភាពប្រព័ន្ធសន្តិសុខ (System Status)</b>\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "🛡️ <b>Bot Engine:</b> Security_bot_V2.0.1 (Online ✅)\n"
            "🚫 <b>Anti-Malware:</b> Active (.apk, .exe, .bat, .js...)\n"
            "⚡ <b>Anti-Flood:</b> Active (Limit 5 msgs / 4s)\n"
            "🔄 <b>2-Way CRM Sync:</b> Online Realtime\n"
            f"👑 <b>Super Admin:</b> ID <code>{ADMIN_ID}</code>\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "🟢 <i>ប្រព័ន្ធកំពុងដំណើរការការពារគ្រុប 24/7!</i>"
        )
        try:
            await query.edit_message_text(text, parse_mode="HTML", reply_markup=get_main_menu_keyboard(bot_username))
        except Exception:
            pass

    elif data == "btn_rules":
        await query.answer("🛡️ គោលការណ៍សន្តិសុខ...")
        text = (
            "🛡️ <b>គោលការណ៍សុវត្ថិភាពគ្រុប (Security Rules)</b>\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "1. 🚫 <b>ហាមដាច់ខាត:</b> ផ្ញើ File មេរោគ (.apk, .exe, .cmd, .scr, .bat...)\n"
            "2. ⚡ <b>ហាម Spam:</b> ផ្ញើសារ Flood ញាប់លើសកំណត់ក្នុងគ្រុប\n"
            "3. 🔗 <b>ហាម Phishing:</b> ផ្ញើ Link បោកប្រាស់ ឬផ្សព្វផ្សាយខុសច្បាប់\n"
            "4. ⚖️ <b>វិធានការ:</b> ប្រព័ន្ធនឹងលុបសារ និងកំហិតសិទ្ធិដោយស្វ័យប្រវត្តិ!\n"
            "━━━━━━━━━━━━━━━━━━━━"
        )
        try:
            await query.edit_message_text(text, parse_mode="HTML", reply_markup=get_main_menu_keyboard(bot_username))
        except Exception:
            pass

    elif data == "btn_help":
        await query.answer("📖 សៀវភៅជំនួយ...")
        text = (
            "📖 <b>សៀវភៅជំនួយ & ពាក្យបញ្ជា (Bot Help)</b>\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "🔹 <code>/start</code> - បើកផ្ទាំងបញ្ជា & ប៊ូតុងចុចអន្តរកម្ម\n"
            "🔹 <code>/id</code> - ឆែក Group ID & User ID ភ្លាមៗ\n"
            "🔹 <code>/status</code> - ឆែកស្ថានភាពប្រព័ន្ធ & អាជ្ញាប័ណ្ណ\n"
            "🔹 <code>/rules</code> - មើលគោលការណ៍សន្តិសុខគ្រុប\n"
            "━━━━━━━━━━━━━━━━━━━━"
        )
        try:
            await query.edit_message_text(text, parse_mode="HTML", reply_markup=get_main_menu_keyboard(bot_username))
        except Exception:
            pass

    elif data == "btn_refresh":
        await query.answer("🔄 ធ្វើបច្ចុប្បន្នភាពទិន្នន័យរួចរាល់!", show_alert=True)

async def chat_member_update_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.effective_message
    if not message or not message.new_chat_members:
        return

    chat = update.effective_chat
    chat_id = str(chat.id) if chat else ""
    chat_title = chat.title if chat else "Telegram Group"

    for member in message.new_chat_members:
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

            sync_group_status(
                chat_id=chat_id,
                title=chat_title,
                added_by_name=adder_name,
                added_by_username=adder_username,
                added_by_id=adder_id
            )

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
                await message.delete()
                logger.info(f"🚫 បានលុបឯកសារគ្រោះថ្នាក់ {file_name} ពី {user_name} ក្នុងក្រុម {chat_title}")

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

                if BOT_MSG_DELETE_SECONDS > 0:
                    asyncio.create_task(auto_delete_message(context.bot, message.chat_id, warn_msg.message_id, BOT_MSG_DELETE_SECONDS))

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

async def message_inspector(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not ANTI_FLOOD_ENABLED:
        return

    message = update.effective_message
    if not message or not message.from_user:
        return

    user_id = message.from_user.id
    now = time.time()

    timestamps = user_message_timestamps[user_id]
    user_message_timestamps[user_id] = [t for t in timestamps if now - t < FLOOD_WINDOW]
    user_message_timestamps[user_id].append(now)

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

# ----------------- TELEGRAM BOT MENU SETUP (POST_INIT) -----------------
async def post_init_setup(application):
    """កំណត់ Bot Command Menu & Menu Button ក្នុង Telegram App ដោយស្វ័យប្រវត្តិ"""
    try:
        commands = [
            BotCommand("start", "🚀 ចាប់ផ្ដើម & បើកម៉ឺនុយមេ"),
            BotCommand("id", "🆔 ឆែក Group ID & User ID"),
            BotCommand("status", "📊 ពិនិត្យស្ថានភាពប្រព័ន្ធ & ការពារ"),
            BotCommand("rules", "🛡️ គោលការណ៍សន្តិសុខគ្រុប"),
            BotCommand("help", "📖 សៀវភៅជំនួយ & របៀបប្រើ"),
        ]
        await application.bot.set_my_commands(commands)
        logger.info("✅ បានដំឡើង Telegram Bot Commands Menu (Menu Button) ដោយជោគជ័យ!")
        try:
            await application.bot.set_chat_menu_button(menu_button=MenuButtonCommands())
        except Exception as err:
            logger.debug(f"MenuButtonCommands note: {err}")
    except Exception as e:
        logger.warning(f"Failed to auto-register bot commands menu: {e}")

def main():
    logger.info("🚀 កំពុងចាប់ផ្តើម Security_bot_V2.0.1 ជាមួយ Interactive Buttons & Webhook...")
    app = ApplicationBuilder().token(BOT_TOKEN).post_init(post_init_setup).build()

    # Commands
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("id", id_command))
    app.add_handler(CommandHandler("groupid", id_command))
    app.add_handler(CommandHandler("myid", id_command))
    app.add_handler(CommandHandler("chatid", id_command))
    app.add_handler(CommandHandler("info", id_command))
    app.add_handler(CommandHandler("status", status_command))
    app.add_handler(CommandHandler("rules", rules_command))
    
    # Callback Query (Buttons)
    app.add_handler(CallbackQueryHandler(callback_query_handler))

    # Message / Status Handlers
    app.add_handler(MessageHandler(filters.StatusUpdate.NEW_CHAT_MEMBERS, chat_member_update_handler))
    app.add_handler(MessageHandler(filters.Document.ALL, file_inspector))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_inspector))

    # ======= ផ្នែកដែលបានកែប្រែថ្មី (ប្តូរពី Polling ទៅ Webhook) =======
    PORT = int(os.environ.get('PORT', '10000')) # យក Port ពី Render ដោយស្វ័យប្រវត្តិ
    
    if APP_URL:
        logger.info(f"✅ កំពុងដំណើរការ Webhook លើ Port: {PORT} ជាមួយ Link: {APP_URL}")
        app.run_webhook(
            listen="0.0.0.0",
            port=PORT,
            webhook_url=APP_URL
        )
    else:
        logger.warning("⚠️ មិនឃើញមាន APP_URL ទេ! Bot នឹងដំណើរការជា Polling ធម្មតា (អាចមិនដើរលើ Render Web Service)...")
        app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
