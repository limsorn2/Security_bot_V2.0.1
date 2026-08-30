import os
import sys
import time
import logging
import asyncio
import json
from datetime import datetime, timedelta
from collections import defaultdict
import requests
from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    BotCommand,
    BotCommandScopeDefault,
    BotCommandScopeAllPrivateChats,
    BotCommandScopeAllGroupChats,
    BotCommandScopeAllChatAdministrators,
    MenuButtonCommands,
    ChatMemberUpdated
)
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ChatMemberHandler,
    ContextTypes,
    filters
)

# ----------------- LOGGING CONFIGURATION -----------------
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger("Security_bot_V2.0.1")

# ----------------- ENVIRONMENT SECRETS & CONSTANTS -----------------
BOT_TOKEN = os.getenv("BOT_TOKEN") or os.getenv("TELEGRAM_BOT_TOKEN", "")
ADMIN_ID_RAW = os.getenv("ADMIN_ID", os.getenv("SUPER_ADMIN_ID", "240224709"))
DASHBOARD_API_URL = os.getenv("DASHBOARD_API_URL", "http://localhost:3000")
APP_URL = os.getenv("APP_URL") # Webhook link (Render / Cloud)

AUTO_DELETE_SERVICE_MSGS = os.getenv("AUTO_DELETE_SERVICE_MSGS", "true").lower() == "true"
BOT_MSG_DELETE_SECONDS = int(os.getenv("BOT_MSG_DELETE_SECONDS", "15"))
ANTI_FLOOD_ENABLED = os.getenv("ANTI_FLOOD_ENABLED", "true").lower() == "true"
FLOOD_LIMIT = int(os.getenv("FLOOD_MAX_MSGS", "5"))
FLOOD_WINDOW = int(os.getenv("FLOOD_WINDOW_SECONDS", "4"))

GROUPS_FILE = "groups_config.json"
CLIENTS_FILE = "clients_database.json"

try:
    ADMIN_ID = int(ADMIN_ID_RAW)
except ValueError:
    ADMIN_ID = 240224709

SUPER_ADMIN_IDS = {str(ADMIN_ID), "240224709"}

# ----------------- SECURITY CONFIGURATIONS -----------------
BLOCKED_EXTENSIONS = [
    ".apk", ".xapk", ".aab", ".exe", ".scr", ".bat", ".cmd", ".msi", ".com",
    ".pif", ".hta", ".cpl", ".sh", ".bash", ".ps1", ".psm1", ".vbs", ".vbe",
    ".js", ".jse", ".wsf", ".jar", ".reg"
]

user_message_timestamps = defaultdict(list)
last_bot_messages: dict = {}
last_expiry_alerts: dict = {}

# ----------------- LOCAL FILE DATABASE HELPERS -----------------
def read_json(file_path: str, default=None):
    if default is None:
        default = {}
    if not os.path.exists(file_path):
        return default
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Error reading {file_path}: {e}")
        return default

def write_json(file_path: str, data):
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.warning(f"Error writing {file_path}: {e}")

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
            InlineKeyboardButton("➕ Add Bot ទៅកាន់ Group ផ្សេងទៀត", url=bot_link),
        ],
        [
            InlineKeyboardButton("🔄 Refresh ព័ត៌មាន", callback_data="btn_refresh"),
            InlineKeyboardButton("❌ បិទសារ (Close)", callback_data="btn_close"),
        ],
        [
            InlineKeyboardButton("👑 ឆានែលផ្លូវការ @sornsecurityrobot", url="https://t.me/sornsecurityrobot"),
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

def get_back_keyboard(bot_username: str = ""):
    """ប៊ូតុងត្រឡប់ទៅកាន់ Menu មេ និងបិទសារ"""
    bot_link = f"https://t.me/{bot_username}?startgroup=true" if bot_username else "https://t.me/sornsecurityrobot"
    keyboard = [
        [
            InlineKeyboardButton("🔙 ត្រឡប់ទៅ Menu មេ", callback_data="btn_main_menu"),
            InlineKeyboardButton("🔄 Refresh", callback_data="btn_refresh"),
        ],
        [
            InlineKeyboardButton("➕ Add Bot ទៅ Group", url=bot_link),
            InlineKeyboardButton("❌ បិទសារ", callback_data="btn_close"),
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

def get_admin_action_keyboard(group_id: str):
    """ប៊ូតុង Quick Actions សម្រាប់ Master Super Admin ពេលមានក្រុមថ្មី"""
    keyboard = [
        [
            InlineKeyboardButton("🎁 អនុញ្ញាត Trial 7 ថ្ងៃ", callback_data=f"adm_trial_{group_id}"),
            InlineKeyboardButton("➕ ផ្ដល់ 30 ថ្ងៃ", callback_data=f"adm_add30_{group_id}"),
        ],
        [
            InlineKeyboardButton("➕ ផ្ដល់ 90 ថ្ងៃ", callback_data=f"adm_add90_{group_id}"),
            InlineKeyboardButton("👑 ផ្ដល់ Lifetime VIP", callback_data=f"adm_life_{group_id}"),
        ],
        [
            InlineKeyboardButton("📢 ក្រើនរំលឹក Promote Admin", callback_data=f"adm_remind_{group_id}"),
            InlineKeyboardButton("🚪 ចាកចេញពីក្រុម (Leave)", callback_data=f"adm_leave_{group_id}"),
        ],
        [
            InlineKeyboardButton("🔴 ដកសិទ្ធិ (Revoke)", callback_data=f"adm_revoke_{group_id}"),
            InlineKeyboardButton("🔍 ពិនិត្យ Profile & ប្រវត្តិ", callback_data=f"adm_check_{group_id}"),
        ],
        [
            InlineKeyboardButton("🔙 ត្រឡប់ទៅបញ្ជី", callback_data="adm_list_groups"),
            InlineKeyboardButton("❌ បិទសារ", callback_data="btn_close"),
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

def get_groups_interactive_keyboard():
    """បង្កើតប៊ូតុងបញ្ជីឈ្មោះក្រុម/អតិថិជនទាំងអស់ឱ្យ Master Admin អាចចុចលើឈ្មោះមួយៗបានភ្លាមៗ"""
    groups = read_json(GROUPS_FILE, {})
    keyboard = []
    if not groups:
        keyboard.append([InlineKeyboardButton("❌ មិនទាន់មានក្រុមក្នុងបញ្ជីនៅឡើយទេ", callback_data="none")])
    else:
        for cid, g in groups.items():
            title = g.get("title", f"Group {cid}")
            is_auth = g.get("is_authorized", False)
            is_en = g.get("is_enabled", False)
            is_life = g.get("is_lifetime", False)
            
            if is_life:
                status_icon = "👑 [VIP]"
            elif is_auth and is_en:
                status_icon = "🟢 [ON]"
            elif is_auth and not is_en:
                status_icon = "🟡 [PAUSE]"
            else:
                status_icon = "🔴 [OFF]"

            # ប៊ូតុងឈ្មោះក្រុម ដែលចុចទៅមើលប្រវត្តិ រយៈពេលប្រើ និងកំណត់សិទ្ធិ
            btn_text = f"{status_icon} {title[:20]}"
            keyboard.append([InlineKeyboardButton(btn_text, callback_data=f"adm_check_{cid}")])

    keyboard.append([
        InlineKeyboardButton("🔄 Refresh បញ្ជី", callback_data="adm_list_groups"),
        InlineKeyboardButton("💾 ទាញយក Backup", callback_data="adm_backup"),
    ])
    keyboard.append([
        InlineKeyboardButton("🔍 ស្កេនក្រុមផុតកំណត់", callback_data="adm_scan_expiry"),
        InlineKeyboardButton("❌ បិទផ្ទាំង", callback_data="btn_close"),
    ])
    return InlineKeyboardMarkup(keyboard)

# ----------------- 2-WAY SYNC & AUTO-REGISTRATION HELPERS -----------------
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

def auto_register_group(chat_id: str, title: str, added_by_name: str, added_by_username: str, added_by_id: str):
    """ចុះឈ្មោះ Group និង Client ចូលក្នុងបញ្ជីស្វ័យប្រវត្តិ ព្រមទាំងផ្ដល់ Free Trial 7 ថ្ងៃ (1 សប្ដាហ៍) អូតូភ្លាមៗ"""
    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    cid_str = str(chat_id)
    exp_7days = (now + timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")

    # 1. Update local files directly
    groups = read_json(GROUPS_FILE, {})
    clients = read_json(CLIENTS_FILE, {})

    is_new = cid_str not in groups

    if is_new:
        groups[cid_str] = {
            "title": title or f"Group {cid_str}",
            "chat_id": int(cid_str) if cid_str.lstrip("-").isdigit() else cid_str,
            "added_at": now_str,
            "is_authorized": True,
            "is_enabled": True,
            "plan_type": "🎁 Free Trial 7 Days (សាកល្បង ៧ ថ្ងៃ)",
            "is_lifetime": False,
            "activated_date": now_str,
            "expiry_date": exp_7days,
            "last_reminder_ts": time.time(),
            "added_by_id": added_by_id or "240224709",
            "added_by_name": added_by_name or "Group Admin",
            "added_by_username": added_by_username or "@admin",
            "threats_blocked_count": 0
        }

        clients[cid_str] = {
            "client_group_id": int(cid_str) if cid_str.lstrip("-").isdigit() else cid_str,
            "client_group_name": groups[cid_str]["title"],
            "registered_date": now_str,
            "activated_date": now_str,
            "expiry_date": exp_7days,
            "plan_type": "🎁 Free Trial 7 Days (សាកល្បង ៧ ថ្ងៃ)",
            "is_lifetime": False,
            "license_status": "🟢 ACTIVE TRIAL (សាកល្បង ៧ ថ្ងៃ)",
            "customer_contact": {
                "name": added_by_name or "Group Admin",
                "user_id": str(added_by_id or "N/A"),
                "username": added_by_username or "@admin"
            },
            "purchase_history": [
                {
                    "package": "Auto-Registered 7-Day Free Trial",
                    "purchased_date": now_str,
                    "duration": "7 Days",
                    "status": "Active"
                }
            ],
            "security_stats": {"threats_blocked": 0, "spams_blocked": 0, "last_incident": "Bot Added - Free Trial Activated"}
        }

        write_json(GROUPS_FILE, groups)
        write_json(CLIENTS_FILE, clients)
        logger.info(f"💾 បានកត់ត្រាក្រុមថ្មី {title} (ID: {cid_str}) និងបើក Free Trial 7 ថ្ងៃដោយស្វ័យប្រវត្តិ!")

    # 2. Sync to Web Dashboard REST API
    try:
        url = f"{DASHBOARD_API_URL.rstrip('/')}/api/groups/{cid_str}/action"
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

    return is_new

async def send_clean_bot_response(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    text: str,
    reply_markup: InlineKeyboardMarkup = None,
    delete_seconds: int = 15
):
    """
    1. លុបសារបញ្ជារបស់ User ភ្លាមៗ (Command Deletion)
    2. លុបសារចាស់របស់ Bot ពេលមាន Command ថ្មីមកដល់ (Previous Bot Msg Deletion)
    3. ផ្ញើសារ Bot ថ្មី
    4. បើគ្មាន Command ថ្មីមកទេ សារ Bot នឹងលុបដោយស្វ័យប្រវត្តិក្នងរយៈពេល ១៥ វិនាទី
    """
    chat = update.effective_chat
    if not chat:
        return None
    chat_id = chat.id

    # 1. លុបសារបញ្ជារបស់ User ភ្លាមៗ
    if update.effective_message:
        try:
            await update.effective_message.delete()
        except Exception:
            pass

    # 2. លុបសារ Bot ចាស់ក្នុង Chat នេះ (បើមាន)
    prev_msg_id = last_bot_messages.get(chat_id)
    if prev_msg_id:
        try:
            await context.bot.delete_message(chat_id=chat_id, message_id=prev_msg_id)
        except Exception:
            pass
        last_bot_messages.pop(chat_id, None)

    # 3. ផ្ញើសារ Bot ថ្មី
    try:
        sent_msg = await context.bot.send_message(
            chat_id=chat_id,
            text=text,
            parse_mode="HTML",
            reply_markup=reply_markup,
            disable_web_page_preview=True
        )
    except Exception as err:
        logger.warning(f"Failed to send bot response: {err}")
        return None

    last_bot_messages[chat_id] = sent_msg.message_id

    # 4. កំណត់ Timer លុបសារ Bot ក្នុងរយៈពេល delete_seconds
    if delete_seconds > 0:
        async def _scheduled_delete(cid: int, mid: int, delay: int):
            await asyncio.sleep(delay)
            try:
                await context.bot.delete_message(chat_id=cid, message_id=mid)
            except Exception:
                pass
            if last_bot_messages.get(cid) == mid:
                last_bot_messages.pop(cid, None)

        asyncio.create_task(_scheduled_delete(chat_id, sent_msg.message_id, delete_seconds))

    return sent_msg

# ----------------- BACKGROUND EXPIRY CHECKER & DIRECT ALERTS -----------------
async def check_and_notify_expired_groups(context: ContextTypes.DEFAULT_TYPE):
    """
    ស្កេនពិនិត្យរាល់ Group ដែលផុតកំណត់សុពលភាព
    រួចផ្ញើសារដំណឹងទៅកាន់ Group Admin ផ្ទាល់ក្នុង Private Chat និងក្នុង Group
    """
    logger.info("🔍 កំពុងស្កេនពិនិត្យសុពលភាពបតគ្រប់គ្រុប...")
    groups = read_json(GROUPS_FILE, {})
    now = datetime.now()

    for cid, g in list(groups.items()):
        is_auth = g.get("is_authorized", False)
        is_life = g.get("is_lifetime", False)
        exp_str = g.get("expiry_date", "")
        title = g.get("title", f"Group {cid}")
        admin_id = str(g.get("added_by_id", ""))
        admin_name = g.get("added_by_name", "Group Admin")
        admin_user = g.get("added_by_username", "@admin")

        if is_life or not exp_str or exp_str in ["Not Yet Activated", "Lifetime"]:
            continue

        try:
            exp_date = datetime.strptime(exp_str, "%Y-%m-%d %H:%M:%S")
        except Exception:
            continue

        # Check if expired
        if exp_date < now:
            last_alert = last_expiry_alerts.get(cid, 0)
            # Notify at most once every 24 hours
            if time.time() - last_alert > 86400:
                last_expiry_alerts[cid] = time.time()
                
                # Update group authorization status
                groups[cid]["is_authorized"] = False
                groups[cid]["is_enabled"] = False
                groups[cid]["plan_type"] = "🔴 Expired (ផុតកំណត់)"
                write_json(GROUPS_FILE, groups)

                # 1. Send direct private message to Group Admin
                if admin_id and admin_id.isdigit():
                    try:
                        dm_text = (
                            "⚠️ <b>[ការជូនដំណឹងពីសុពលភាពបត - BOT LICENSE EXPIRED]</b>\n"
                            "━━━━━━━━━━━━━━━━━━━━\n"
                            f"👥 <b>ក្រុម៖</b> <code>{title}</code>\n"
                            f"📍 <b>Group ID:</b> <code>{cid}</code>\n"
                            f"⏳ <b>កាលបរិច្ឆេទផុតកំណត់៖</b> <code>{exp_str}</code>\n\n"
                            "🛡️ <b>សុពលភាពបតរបស់អ្នកបានផុតកំណត់ហើយ!</b>\n"
                            "ប្រព័ន្ធការពារមេរោគ (.apk/.exe) និង Anti-Spam ត្រូវបានផ្អាកជាបណ្តោះអាសន្ន។\n\n"
                            "👉 <b>សូមទាក់ទង Master Admin ដើម្បីបន្តសុពលភាព ឬទិញកញ្ចប់បន្ថែម៖</b>\n"
                            f"👑 <b>Super Admin:</b> @sornsecurityrobot (ID: <code>{ADMIN_ID}</code>)\n"
                            "━━━━━━━━━━━━━━━━━━━━"
                        )
                        btn = InlineKeyboardMarkup([
                            [InlineKeyboardButton("👑 ទាក់ទង Master Admin", url="https://t.me/sornsecurityrobot")],
                            [InlineKeyboardButton("🔄 ពិនិត្យស្ថានភាពឡើងវិញ", callback_data="btn_status")]
                        ])
                        await context.bot.send_message(chat_id=int(admin_id), text=dm_text, parse_mode="HTML", reply_markup=btn)
                        logger.info(f"📩 បានផ្ញើសារដំណឹងផុតកំណត់ទៅ Admin {admin_name} ({admin_id}) រួចរាល់!")
                    except Exception as err:
                        logger.debug(f"Could not DM group admin {admin_id}: {err}")

                # 2. Send brief notification in Group
                try:
                    grp_text = (
                        "⚠️ <b>[ការជូនដំណឹងសុវត្ថិភាពគ្រុប]</b>\n"
                        f"សុពលភាពរបស់ Security Bot ក្នុងក្រុម <code>{title}</code> បានផុតកំណត់ហើយ!\n"
                        "សូម Admin ក្រុមទាក់ទង Master Admin @sornsecurityrobot ដើម្បីបន្តការការពារ។"
                    )
                    sent = await context.bot.send_message(chat_id=int(cid), text=grp_text, parse_mode="HTML")
                    if BOT_MSG_DELETE_SECONDS > 0:
                        asyncio.create_task(send_clean_bot_response(None, context, "", delete_seconds=0))
                except Exception as err:
                    logger.debug(f"Could not send group expiry notice to {cid}: {err}")

                # 3. Notify Master Super Admin
                try:
                    master_msg = (
                        "📢 <b>[ក្រុមផុតកំណត់ - EXPIRED GROUP ALERT]</b>\n"
                        "━━━━━━━━━━━━━━━━━━━━\n"
                        f"👥 <b>ក្រុម:</b> <code>{title}</code>\n"
                        f"📍 <b>Group ID:</b> <code>{cid}</code>\n"
                        f"👤 <b>Admin ក្រុម:</b> {admin_name} ({admin_user}) | ID: <code>{admin_id}</code>\n"
                        f"⏳ <b>កាលបរិច្ឆេទផុត:</b> <code>{exp_str}</code>\n"
                        "━━━━━━━━━━━━━━━━━━━━\n"
                        "💡 <i>បានផ្ញើសារដំណឹងទៅកាន់ Admin ក្រុមរួចរាល់។</i>"
                    )
                    await context.bot.send_message(chat_id=ADMIN_ID, text=master_msg, parse_mode="HTML", reply_markup=get_admin_action_keyboard(cid))
                except Exception as err:
                    logger.debug(f"Could not notify master admin: {err}")

async def expiry_checker_loop(application):
    """Background task running every hour to check group licenses"""
    await asyncio.sleep(10)
    while True:
        try:
            # Create a mock ContextTypes object for calling check_and_notify_expired_groups
            class SimpleContext:
                def __init__(self, bot):
                    self.bot = bot
            ctx = SimpleContext(application.bot)
            await check_and_notify_expired_groups(ctx)
        except Exception as e:
            logger.warning(f"Error in expiry checker loop: {e}")
        await asyncio.sleep(3600) # Check every 1 hour

# ----------------- BOT COMMANDS (ALL USERS & GROUP ADMINS) -----------------
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_info = await context.bot.get_me()
    bot_username = bot_info.username or ""
    chat = update.effective_chat
    user = update.effective_user

    # Auto-register group if run in a group
    if chat and chat.type in ["group", "supergroup"]:
        auto_register_group(
            chat_id=str(chat.id),
            title=chat.title or "Telegram Group",
            added_by_name=user.first_name if user else "Group Admin",
            added_by_username=f"@{user.username}" if user and user.username else "",
            added_by_id=str(user.id) if user else ""
        )

    welcome_text = (
        "🛡️ <b>សូមស្វាគមន៍មកកាន់ Security_bot_V2.0.1!</b>\n\n"
        "ប្រព័ន្ធការពារ និងគ្រប់គ្រងសន្តិសុខគ្រុប Telegram ស្វ័យប្រវត្តិកំពុងដំណើរការ 24/7។\n\n"
        "✨ <b>មុខងារការពារសកម្ម & Auto-Sync៖</b>\n"
        "• 🚫 Anti-Malware / Dangerous Files (.apk, .exe, .bat, ...)\n"
        "• ⚡ Anti-Flood / Anti-Spam Auto Warning\n"
        "• 🆔 ពិនិត្យ Group ID & User ID ភ្លាមៗ\n"
        "• 🔄 Auto-Sync ជាមួយ Web Dashboard Realtime\n"
        "• ➕ អាច Add Bot ទៅកាន់គ្រុបណាបានស្រេចចិត្ត!\n\n"
        "⏱️ <i>សារនេះនឹងរលាយបាត់ក្នុង ១៥ វិនាទី ឬនៅពេលមានពាក្យបញ្ជាថ្មី។</i>\n\n"
        "👇 <b>សូមចុចប៊ូតុងបញ្ជាខាងក្រោម ដើម្បីប្រើប្រាស់មុខងារ៖</b>"
    )
    await send_clean_bot_response(
        update=update,
        context=context,
        text=welcome_text,
        reply_markup=get_main_menu_keyboard(bot_username),
        delete_seconds=BOT_MSG_DELETE_SECONDS
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_info = await context.bot.get_me()
    bot_username = bot_info.username or ""

    help_text = (
        "📖 <b>សៀវភៅជំនួយ & ពាក្យបញ្ជា Security_bot_V2.0.1:</b>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "🔹 <code>/start</code> - បើកផ្ទាំងបញ្ជា & ប៊ូតុងចុចអន្តរកម្ម\n"
        "🔹 <code>/id</code> ឬ <code>/groupid</code> - ឆែក Group ID & User ID ភ្លាមៗ\n"
        "🔹 <code>/status</code> - ពិនិត្យមើលស្ថានភាពប្រព័ន្ធសុវត្ថិភាព\n"
        "🔹 <code>/license</code> - ពិនិត្យសុពលភាព & កាលបរិច្ឆេទផុតកំណត់\n"
        "🔹 <code>/rules</code> - មើលគោលការណ៍សន្តិសុខគ្រុប\n"
        "🔹 <code>/addgroup</code> - ទទួល Link បន្ថែម Bot ទៅកាន់ Group ផ្សេងទៀត\n"
        "🔹 <code>/mygroups</code> - មើលបញ្ជីក្រុមដែលបាន Add\n"
        "🔹 <code>/help</code> - បង្ហាញជំនួយនេះ\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "⏱️ <i>សារនេះនឹងរលាយបាត់ក្នុង ១៥ វិនាទី ឬនៅពេលមានពាក្យបញ្ជាថ្មី។</i>\n\n"
        "👇 <i>លោកអ្នកក៏អាចចុចលើប៊ូតុងរហ័សខាងក្រោមបានផងដែរ៖</i>"
    )
    await send_clean_bot_response(
        update=update,
        context=context,
        text=help_text,
        reply_markup=get_back_keyboard(bot_username),
        delete_seconds=BOT_MSG_DELETE_SECONDS
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
        "⏱️ <i>សារនេះនឹងរលាយបាត់ក្នុង ១៥ វិនាទី ឬនៅពេលមានពាក្យបញ្ជាថ្មី។</i>"
    )
    await send_clean_bot_response(
        update=update,
        context=context,
        text=rules_text,
        reply_markup=get_back_keyboard(bot_username),
        delete_seconds=BOT_MSG_DELETE_SECONDS
    )

async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_info = await context.bot.get_me()
    bot_username = bot_info.username or ""
    chat = update.effective_chat
    cid_str = str(chat.id) if chat else ""

    groups = read_json(GROUPS_FILE, {})
    g = groups.get(cid_str, {})
    is_auth = g.get("is_authorized", False) and g.get("is_enabled", False)
    plan_type = g.get("plan_type", "Pending Approval")
    exp_date = g.get("expiry_date", "Not Activated")

    status_text = (
        "📊 <b>ស្ថានភាពប្រព័ន្ធសន្តិសុខ (System Status)</b>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "🛡️ <b>Bot Engine:</b> Security_bot_V2.0.1 (Online ✅)\n"
        f"🔰 <b>ស្ថានភាពការពារ:</b> {'🟢 កំពុងការពារយ៉ាងសកម្ម (SHIELD ON)' if is_auth else '🟡 រង់ចាំបើកសិទ្ធិ (Pending)'}\n"
        f"🛒 <b>កញ្ចប់សេវា:</b> {plan_type}\n"
        f"⏳ <b>កាលបរិច្ឆេទផុត:</b> <code>{exp_date}</code>\n"
        "🚫 <b>Anti-Malware:</b> Active (.apk, .exe, .bat, .js...)\n"
        "⚡ <b>Anti-Flood:</b> Active (Limit 5 msgs / 4s)\n"
        "🔄 <b>2-Way CRM Sync:</b> Online Realtime\n"
        f"👑 <b>Super Admin:</b> ID <code>{ADMIN_ID}</code>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "⏱️ <i>សារនេះនឹងរលាយបាត់ក្នុង ១៥ វិនាទី ឬនៅពេលមានពាក្យបញ្ជាថ្មី។</i>"
    )
    await send_clean_bot_response(
        update=update,
        context=context,
        text=status_text,
        reply_markup=get_back_keyboard(bot_username),
        delete_seconds=BOT_MSG_DELETE_SECONDS
    )

async def license_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_info = await context.bot.get_me()
    bot_username = bot_info.username or ""
    chat = update.effective_chat
    cid_str = str(chat.id) if chat else ""

    groups = read_json(GROUPS_FILE, {})
    g = groups.get(cid_str, {})
    title = g.get("title", chat.title if chat else "Telegram Group")
    is_auth = g.get("is_authorized", False)
    is_life = g.get("is_lifetime", False)
    plan_type = g.get("plan_type", "🎁 មិនទាន់បើកសិទ្ធិ")
    exp_date = g.get("expiry_date", "Not Activated")
    act_date = g.get("activated_date", "Not Activated")

    days_left_str = "♾️ ពេញមួយជីវិត (Lifetime)" if is_life else "N/A"
    if not is_life and exp_date and exp_date != "Not Activated":
        try:
            exp_d = datetime.strptime(exp_date, "%Y-%m-%d %H:%M:%S")
            diff = (exp_d - datetime.now()).days
            days_left_str = f"{diff} ថ្ងៃទៀត" if diff >= 0 else "🔴 ផុតកំណត់ហើយ"
        except Exception:
            days_left_str = exp_date

    license_text = (
        "🔐 <b>ព័ត៌មានអាជ្ញាប័ណ្ណ & កញ្ចប់សេវា (License Info)</b>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        f"👥 <b>ក្រុម:</b> <code>{title}</code>\n"
        f"📍 <b>Group ID:</b> <code>{cid_str}</code>\n"
        f"🛒 <b>កញ្ចប់សេវា:</b> {plan_type}\n"
        f"📅 <b>ថ្ងៃចាប់ផ្តើម:</b> <code>{act_date}</code>\n"
        f"⏳ <b>ថ្ងៃផុតកំណត់:</b> <code>{exp_date}</code>\n"
        f"⌛ <b>រយៈពេលនៅសល់:</b> <b>{days_left_str}</b>\n"
        f"🛡️ <b>ស្ថានភាព:</b> {'🟢 ACTIVE (ការពារពេញលេញ)' if is_auth else '🟡 PENDING / EXPIRED'}\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        f"👉 <i>ដើម្បីទិញ ឬបន្តសុពលភាព សូមទាក់ទង Master Admin @sornsecurityrobot</i>\n\n"
        "⏱️ <i>សារនេះនឹងរលាយបាត់ក្នុង ១៥ វិនាទី ឬនៅពេលមានពាក្យបញ្ជាថ្មី។</i>"
    )
    await send_clean_bot_response(
        update=update,
        context=context,
        text=license_text,
        reply_markup=get_back_keyboard(bot_username),
        delete_seconds=BOT_MSG_DELETE_SECONDS
    )

async def addgroup_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_info = await context.bot.get_me()
    bot_username = bot_info.username or "sornsecurityrobot"
    bot_link = f"https://t.me/{bot_username}?startgroup=true"

    text = (
        "➕ <b>បន្ថែម Bot ទៅកាន់ Telegram Group បានស្រេចចិត្ត!</b>\n\n"
        "លោកអ្នកអាចបន្ថែមបតទៅកាន់គ្រុបណាផ្សេងទៀតបានដោយសេរី ៖\n"
        f"🔗 <b>Link បន្ថែមបត៖</b> {bot_link}\n\n"
        "💡 <b>ជំហានបន្ទាប់៖</b>\n"
        "1. ចុច Link ខាងលើ រួចជ្រើសរើស Group របស់អ្នក\n"
        "2. Promote Bot ជា <b>Admin</b> ក្នុងគ្រុបនោះ\n"
        "3. Bot នឹងចូលក្នុងបញ្ជីស្វ័យប្រវត្តិ និងជូនដំណឹងភ្លាមៗ!\n\n"
        "⏱️ <i>សារនេះនឹងរលាយបាត់ក្នុង ១៥ វិនាទី ឬនៅពេលមានពាក្យបញ្ជាថ្មី។</i>"
    )
    btn = InlineKeyboardMarkup([
        [InlineKeyboardButton("➕ Add Bot ទៅ Group ឥឡូវនេះ", url=bot_link)],
        [InlineKeyboardButton("❌ បិទសារ", callback_data="btn_close")]
    ])
    await send_clean_bot_response(update, context, text, reply_markup=btn, delete_seconds=BOT_MSG_DELETE_SECONDS)

async def id_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
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
        "⏱️ <i>សារនេះនឹងរលាយបាត់ក្នុង ១៥ វិនាទី ឬនៅពេលមានពាក្យបញ្ជាថ្មី។</i>"
    )

    await send_clean_bot_response(
        update=update,
        context=context,
        text=response_text,
        reply_markup=get_back_keyboard(bot_username),
        delete_seconds=BOT_MSG_DELETE_SECONDS
    )

    if chat and chat.type in ["group", "supergroup"]:
        auto_register_group(
            chat_id=chat_id,
            title=chat_title,
            added_by_name=user_name,
            added_by_username=username,
            added_by_id=user_id
        )

# ----------------- MASTER SUPER ADMIN COMMANDS (ID: 240224709) -----------------
def is_admin(user_id: int) -> bool:
    return str(user_id) in SUPER_ADMIN_IDS

async def admin_panel_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not user or not is_admin(user.id):
        return await send_clean_bot_response(update, context, "⛔ លោកអ្នកគ្មានសិទ្ធិប្រើ Command នេះឡើយ!", delete_seconds=10)

    groups = read_json(GROUPS_FILE, {})
    total_grps = len(groups)
    active_grps = sum(1 for g in groups.values() if g.get("is_authorized") and g.get("is_enabled"))

    text = (
        "👑 <b>ផ្ទាំងបញ្ជាគ្រប់គ្រង SOLE MASTER ADMIN PANEL</b>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        f"👥 <b>ក្រុមសរុបក្នុងប្រព័ន្ធ:</b> {total_grps} ក្រុម\n"
        f"🟢 <b>ក្រុមសកម្ម (Active):</b> {active_grps} ក្រុម\n"
        f"🟡 <b>ក្រុមរង់ចាំ/ផុតកំណត់:</b> {total_grps - active_grps} ក្រុម\n\n"
        "👇 <b>សូមចុចលើប៊ូតុងឈ្មោះក្រុមខាងក្រោម ដើម្បី៖</b>\n"
        "• 🔍 ពិនិត្យ Profile និងប្រវត្តិនៃការប្រើប្រាស់\n"
        "• ⏳ កំណត់រយៈពេល (Trial 7D, +30D, +90D, Lifetime)\n"
        "• 🛡️ កំណត់សិទ្ធិ (Active, Pause, Revoke)\n"
        "━━━━━━━━━━━━━━━━━━━━"
    )
    await send_clean_bot_response(update, context, text, reply_markup=get_groups_interactive_keyboard(), delete_seconds=120)

async def groups_list_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not user or not is_admin(user.id):
        return await send_clean_bot_response(update, context, "⛔ លោកអ្នកគ្មានសិទ្ធិ!", delete_seconds=10)

    groups = read_json(GROUPS_FILE, {})
    if not groups:
        return await send_clean_bot_response(update, context, "📋 មិនទាន់មានក្រុមណាមួយក្នុងបញ្ជីឡើយ!", delete_seconds=15)

    text = (
        f"📋 <b>បញ្ជីឈ្មោះអតិថិជន & ក្រុមទាំងអស់ ({len(groups)} ក្រុម):</b>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "👇 <i>សូមចុចលើប៊ូតុងឈ្មោះក្រុម ដើម្បីមើលប្រវត្តិ រយៈពេលប្រើ និងកំណត់សិទ្ធិ៖</i>"
    )
    await send_clean_bot_response(update, context, text, reply_markup=get_groups_interactive_keyboard(), delete_seconds=120)

async def adddays_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not user or not is_admin(user.id):
        return

    args = context.args
    if not args or len(args) < 2:
        return await send_clean_bot_response(update, context, "⚠️ <b>ទម្រង់ប្រើប្រាស់៖</b> <code>/adddays &lt;group_id&gt; &lt;days&gt;</code>\nឧទាហរណ៍៖ <code>/adddays -1002458931204 30</code>", delete_seconds=15)

    cid_str = args[0].strip()
    try:
        days = int(args[1].strip())
    except ValueError:
        return await send_clean_bot_response(update, context, "⚠️ ចំនួនថ្ងៃត្រូវតែជាលេខគត់!", delete_seconds=10)

    groups = read_json(GROUPS_FILE, {})
    clients = read_json(CLIENTS_FILE, {})

    if cid_str not in groups:
        return await send_clean_bot_response(update, context, f"❌ រកមិនឃើញក្រុម ID <code>{cid_str}</code> ក្នុង Database ទេ!", delete_seconds=15)

    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")

    # If already active, extend from existing expiry date
    cur_exp = groups[cid_str].get("expiry_date", "")
    start_base = now
    if cur_exp and cur_exp not in ["Not Yet Activated", "Lifetime"]:
        try:
            parsed = datetime.strptime(cur_exp, "%Y-%m-%d %H:%M:%S")
            if parsed > now:
                start_base = parsed
        except Exception:
            start_base = now

    new_exp = start_base + timedelta(days=days)
    new_exp_str = new_exp.strftime("%Y-%m-%d %H:%M:%S")

    plan_name = f"Plan {days} Days (កញ្ចប់ {days} ថ្ងៃ)"
    groups[cid_str]["is_authorized"] = True
    groups[cid_str]["is_enabled"] = True
    groups[cid_str]["plan_type"] = plan_name
    groups[cid_str]["activated_date"] = now_str
    groups[cid_str]["expiry_date"] = new_exp_str
    groups[cid_str]["last_reminder_ts"] = time.time()

    if cid_str in clients:
        clients[cid_str]["license_status"] = "🟢 ACTIVE (បានទិញសិទ្ធិ)"
        clients[cid_str]["activated_date"] = now_str
        clients[cid_str]["expiry_date"] = new_exp_str
        clients[cid_str]["plan_type"] = plan_name
        clients[cid_str]["purchase_history"].append({
            "package": plan_name,
            "purchased_date": now_str,
            "duration": f"{days} Days",
            "status": "Active"
        })

    write_json(GROUPS_FILE, groups)
    write_json(CLIENTS_FILE, clients)

    success_msg = (
        f"✅ <b>បានបន្ថែម {days} ថ្ងៃដោយជោគជ័យ!</b>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        f"👥 <b>ក្រុម:</b> <code>{groups[cid_str]['title']}</code>\n"
        f"📍 <b>Group ID:</b> <code>{cid_str}</code>\n"
        f"⏳ <b>កាលបរិច្ឆេទផុតកំណត់ថ្មី:</b> <code>{new_exp_str}</code>\n"
        f"🟢 <b>ស្ថានភាព:</b> Active (បើកការពាររួចរាល់)\n"
        "━━━━━━━━━━━━━━━━━━━━"
    )
    await send_clean_bot_response(update, context, success_msg, delete_seconds=30)

    # Also notify the group admin directly if available
    admin_id = groups[cid_str].get("added_by_id")
    if admin_id and str(admin_id).isdigit():
        try:
            await context.bot.send_message(
                chat_id=int(admin_id),
                text=f"🎉 <b>[ជោគជ័យ] ក្រុម {groups[cid_str]['title']} ត្រូវបានបន្ថែម {days} ថ្ងៃ!</b>\nកាលបរិច្ឆេទផុតកំណត់៖ <code>{new_exp_str}</code>",
                parse_mode="HTML"
            )
        except Exception:
            pass

async def approve_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not user or not is_admin(user.id):
        return

    args = context.args
    if not args:
        return await send_clean_bot_response(update, context, "⚠️ <b>ទម្រង់៖</b> <code>/approve &lt;group_id&gt;</code>", delete_seconds=10)

    cid_str = args[0].strip()
    groups = read_json(GROUPS_FILE, {})
    clients = read_json(CLIENTS_FILE, {})

    if cid_str not in groups:
        return await send_clean_bot_response(update, context, f"❌ រកមិនឃើញក្រុម <code>{cid_str}</code> ទេ!", delete_seconds=10)

    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    exp_str = (now + timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")

    groups[cid_str]["is_authorized"] = True
    groups[cid_str]["is_enabled"] = True
    groups[cid_str]["plan_type"] = "🎁 Free Trial 7 Days (សាកល្បង ៧ ថ្ងៃ)"
    groups[cid_str]["activated_date"] = now_str
    groups[cid_str]["expiry_date"] = exp_str

    if cid_str in clients:
        clients[cid_str]["license_status"] = "🟢 ACTIVE TRIAL (សាកល្បង ៧ ថ្ងៃ)"
        clients[cid_str]["activated_date"] = now_str
        clients[cid_str]["expiry_date"] = exp_str
        clients[cid_str]["plan_type"] = "🎁 Free Trial 7 Days (សាកល្បង ៧ ថ្ងៃ)"

    write_json(GROUPS_FILE, groups)
    write_json(CLIENTS_FILE, clients)

    await send_clean_bot_response(update, context, f"✅ <b>បានអនុញ្ញាត Free Trial 7 ថ្ងៃដល់ក្រុម {groups[cid_str]['title']}!</b>\nផុតកំណត់៖ <code>{exp_str}</code>", delete_seconds=20)

async def check_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not user or not is_admin(user.id):
        return

    args = context.args
    if not args:
        return await send_clean_bot_response(update, context, "⚠️ <b>ទម្រង់៖</b> <code>/check &lt;group_id&gt;</code>", delete_seconds=10)

    cid_str = args[0].strip()
    groups = read_json(GROUPS_FILE, {})
    if cid_str not in groups:
        return await send_clean_bot_response(update, context, f"❌ រកមិនឃើញក្រុម <code>{cid_str}</code> ទេ!", delete_seconds=10)

    g = groups[cid_str]
    info_text = (
        f"🔍 <b>ព័ត៌មានលម្អិតនៃក្រុម (Group Profile)</b>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        f"👥 <b>ឈ្មោះក្រុម:</b> <code>{g.get('title')}</code>\n"
        f"📍 <b>Group ID:</b> <code>{cid_str}</code>\n"
        f"👤 <b>Admin ក្រុម:</b> {g.get('added_by_name')} ({g.get('added_by_username')})\n"
        f"🔑 <b>Admin ID:</b> <code>{g.get('added_by_id')}</code>\n"
        f"📅 <b>ថ្ងៃចុះឈ្មោះ:</b> <code>{g.get('added_at')}</code>\n"
        f"📅 <b>ថ្ងៃបើកសិទ្ធិ:</b> <code>{g.get('activated_date')}</code>\n"
        f"⏳ <b>ថ្ងៃផុតកំណត់:</b> <code>{g.get('expiry_date')}</code>\n"
        f"🛒 <b>កញ្ចប់សេវា:</b> {g.get('plan_type')}\n"
        f"🛡️ <b>ស្ថានភាព:</b> {'🟢 Active' if g.get('is_authorized') else '🟡 Inactive/Pending'}\n"
        f"🚫 <b>ចំនួនមេរោគរារាំង:</b> {g.get('threats_blocked_count', 0)} ដង\n"
        "━━━━━━━━━━━━━━━━━━━━"
    )
    await send_clean_bot_response(update, context, info_text, reply_markup=get_admin_action_keyboard(cid_str), delete_seconds=60)

async def backup_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not user or not is_admin(user.id):
        return

    groups = read_json(GROUPS_FILE, {})
    clients = read_json(CLIENTS_FILE, {})

    backup_data = {
        "export_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_groups": len(groups),
        "groups": groups,
        "clients": clients
    }
    json_bytes = json.dumps(backup_data, ensure_ascii=False, indent=2).encode("utf-8")
    
    await context.bot.send_document(
        chat_id=user.id,
        document=json_bytes,
        filename=f"vault_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
        caption=f"💾 <b>ទិន្នន័យបម្រុងទុក (Cloud Backup)</b>\nសរុប {len(groups)} ក្រុម | {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        parse_mode="HTML"
    )

async def send_admin_promote_reminder(context: ContextTypes.DEFAULT_TYPE, chat_id: str, chat_title: str, admin_name: str = "", admin_username: str = "", admin_id: str = ""):
    """ផ្ញើសារដាស់តឿនជាបន្ទាន់ឱ្យ Promote Bot ទៅជា Admin ក្នុងគ្រុប និងផ្ញើទៅ Admin ផ្ទាល់"""
    tag_str = f"@{admin_username.lstrip('@')}" if admin_username else (admin_name or "អេដមីន")
    remind_text = (
        "⚠️ <b>[ការក្រើនរំលឹកជាបន្ទាន់ - PROMOTE BOT TO ADMIN]</b> ⚠️\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        f"👋 <b>សូមជម្រាបសួរ {tag_str}!</b>\n\n"
        f"🛡️ ដើម្បីឱ្យ Bot អាចការពារក្រុម <code>{chat_title}</code> បានពេញលេញ 100%៖\n"
        "• 🚫 <b>លុបមេរោគបោកប្រាស់</b> (<code>.apk, .exe, .bat</code>)\n"
        "• 🌊 <b>ទប់ស្កាត់សារ Flood / Spam & Phishing Link</b>\n\n"
        "👉 <b>សូមចូលទៅកាន់ Group Settings ➡️ Administrators ➡️ បន្ថែម Bot ជា Admin ដោយបើកសិទ្ធិ៖</b>\n"
        "✅ <b>1. Delete Messages (លុបសារមេរោគ)</b>\n"
        "✅ <b>2. Ban / Restrict Users (រារាំងគណនីបន្លំ)</b>\n\n"
        "💡 <i>ប្រសិនបើមិនទាន់ Promote ជា Admin ទេ Bot នឹងមិនមានសិទ្ធិលុបសារគ្រោះថ្នាក់បានឡើយ!</i>\n"
        "━━━━━━━━━━━━━━━━━━━━"
    )
    
    # 1. Send in group
    try:
        await context.bot.send_message(
            chat_id=int(chat_id) if str(chat_id).lstrip("-").isdigit() else chat_id,
            text=remind_text,
            parse_mode="HTML"
        )
    except Exception as e:
        logger.warning(f"Could not send promote reminder to group {chat_id}: {e}")

    # 2. Send to Admin's private DM if known
    if admin_id and str(admin_id).isdigit() and str(admin_id) != str(ADMIN_ID):
        try:
            await context.bot.send_message(
                chat_id=int(admin_id),
                text=remind_text,
                parse_mode="HTML"
            )
        except Exception:
            pass

async def remind_admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not user or not is_admin(user.id):
        return

    args = context.args
    chat = update.effective_chat
    target_cid = args[0].strip() if args else (str(chat.id) if chat and chat.type in ["group", "supergroup"] else None)

    if not target_cid:
        return await send_clean_bot_response(update, context, "⚠️ <b>ទម្រង់៖</b> <code>/remindadmin &lt;group_id&gt;</code>", delete_seconds=10)

    groups = read_json(GROUPS_FILE, {})
    g = groups.get(target_cid, {})
    g_title = g.get("title", f"Group {target_cid}")
    adder_name = g.get("added_by_name", "")
    adder_username = g.get("added_by_username", "")
    adder_id = g.get("added_by_id", "")

    await send_admin_promote_reminder(context, target_cid, g_title, adder_name, adder_username, adder_id)
    await send_clean_bot_response(update, context, f"📢 <b>បានផ្ញើសារដាស់តឿនឱ្យ Promote Bot ជា Admin ទៅកាន់ក្រុម <code>{g_title}</code> រួចរាល់!</b>", delete_seconds=15)

async def leave_group_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not user or not is_admin(user.id):
        return

    chat = update.effective_chat
    args = context.args
    target_cid = None
    if args:
        target_cid = args[0].strip()
    elif chat and chat.type in ["group", "supergroup"]:
        target_cid = str(chat.id)

    if not target_cid:
        return await send_clean_bot_response(update, context, "⚠️ <b>ទម្រង់បញ្ជា៖</b> <code>/leave &lt;group_id&gt;</code>", delete_seconds=10)

    groups = read_json(GROUPS_FILE, {})
    clients = read_json(CLIENTS_FILE, {})
    g_title = groups.get(target_cid, {}).get("title", f"Group {target_cid}")

    # 1. Send farewell message to group
    try:
        await context.bot.send_message(
            chat_id=int(target_cid) if target_cid.lstrip("-").isdigit() else target_cid,
            text="👋 <b>Bot បានចាកចេញពីក្រុមនេះតាមបញ្ជារបស់ Master Admin!</b>\n\n🛡️ ប្រព័ន្ធការពារសុវត្ថិភាពត្រូវបានបិទ។ សូមអរគុណសម្រាប់ការប្រើប្រាស់!",
            parse_mode="HTML"
        )
    except Exception as e:
        logger.debug(f"Could not send goodbye message to group {target_cid}: {e}")

    # 2. Leave the chat
    try:
        await context.bot.leave_chat(chat_id=int(target_cid) if target_cid.lstrip("-").isdigit() else target_cid)
    except Exception as err:
        logger.warning(f"Error leaving chat {target_cid}: {err}")

    # 3. Update status in database
    if target_cid in groups:
        groups[target_cid]["is_authorized"] = False
        groups[target_cid]["is_enabled"] = False
        groups[target_cid]["plan_type"] = "🔴 Left Group (Bot បានចាកចេញ)"
        write_json(GROUPS_FILE, groups)

    if target_cid in clients:
        clients[target_cid]["license_status"] = "🔴 BOT LEFT (ចាកចេញពីក្រុម)"
        clients[target_cid]["plan_type"] = "🔴 Left Group (Bot បានចាកចេញ)"
        write_json(CLIENTS_FILE, clients)

    await send_clean_bot_response(update, context, f"🚪 <b>បានបញ្ជាឱ្យ Bot ចាកចេញពីក្រុម <code>{g_title}</code> (ID: <code>{target_cid}</code>) ដោយជោគជ័យ!</b>", delete_seconds=20)

async def notify_expiry_manual_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not user or not is_admin(user.id):
        return
    await send_clean_bot_response(update, context, "⏳ កំពុងចាប់ផ្តើមស្កេន និងផ្ញើសារដំណឹងផុតកំណត់ទៅកាន់ Group Admin...", delete_seconds=10)
    await check_and_notify_expired_groups(context)
    await send_clean_bot_response(update, context, "✅ បានស្កេន និងផ្ញើសារដំណឹងរួចរាល់!", delete_seconds=15)

# ----------------- CALLBACK QUERY HANDLER (Button Clicks) -----------------
async def callback_query_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if not query:
        return

    data = query.data
    chat = update.effective_chat
    user = update.effective_user
    chat_id = chat.id if chat else 0
    bot_info = await context.bot.get_me()
    bot_username = bot_info.username or ""

    try:
        await query.answer()
    except Exception:
        pass

    if data == "btn_close":
        try:
            await query.message.delete()
        except Exception:
            pass
        if last_bot_messages.get(chat_id) == query.message.message_id:
            last_bot_messages.pop(chat_id, None)
        return

    if data == "btn_main_menu" or data == "btn_refresh":
        welcome_text = (
            "🛡️ <b>សូមស្វាគមន៍មកកាន់ Security_bot_V2.0.1!</b>\n\n"
            "ប្រព័ន្ធការពារ និងគ្រប់គ្រងសន្តិសុខគ្រុប Telegram ស្វ័យប្រវត្តិកំពុងដំណើរការ 24/7។\n\n"
            "✨ <b>មុខងារការពារសកម្ម & Auto-Sync៖</b>\n"
            "• 🚫 Anti-Malware / Dangerous Files (.apk, .exe, .bat, ...)\n"
            "• ⚡ Anti-Flood / Anti-Spam Auto Warning\n"
            "• 🆔 ពិនិត្យ Group ID & User ID ភ្លាមៗ\n"
            "• 🔄 Auto-Sync ជាមួយ Web Dashboard Realtime\n"
            "• ➕ អាច Add Bot ទៅកាន់គ្រុបណាបានស្រេចចិត្ត!\n\n"
            "⏱️ <i>សារនេះនឹងរលាយបាត់ក្នុង ១៥ វិនាទី ឬនៅពេលមានពាក្យបញ្ជាថ្មី។</i>\n\n"
            "👇 <b>សូមចុចប៊ូតុងបញ្ជាខាងក្រោម ដើម្បីប្រើប្រាស់មុខងារ៖</b>"
        )
        try:
            await query.edit_message_text(
                welcome_text,
                parse_mode="HTML",
                reply_markup=get_main_menu_keyboard(bot_username),
                disable_web_page_preview=True
            )
        except Exception:
            pass
        return

    if data == "btn_id":
        chat_id_str = str(chat.id) if chat else "Unknown"
        chat_title = chat.title if chat and chat.title else "Private Chat"
        user_id_str = str(user.id) if user else "Unknown"
        user_name = user.first_name if user else "User"

        text = (
            "🆔 <b>ព័ត៌មានអត្តសញ្ញាណ (ID & Chat Info)</b>\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            f"👥 <b>ឈ្មោះក្រុម:</b> <code>{chat_title}</code>\n"
            f"📍 <b>Group ID:</b> <code>{chat_id_str}</code>  <i>(ចុចដើម្បី Copy)</i>\n\n"
            f"👤 <b>អ្នកស្នើសុំ:</b> {user_name}\n"
            f"🔑 <b>User ID:</b> <code>{user_id_str}</code>\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "⏱️ <i>សារនេះនឹងរលាយបាត់ក្នុង ១៥ វិនាទី ឬនៅពេលមានពាក្យបញ្ជាថ្មី។</i>"
        )
        try:
            await query.edit_message_text(text, parse_mode="HTML", reply_markup=get_back_keyboard(bot_username), disable_web_page_preview=True)
        except Exception:
            pass

    elif data == "btn_status":
        text = (
            "📊 <b>ស្ថានភាពប្រព័ន្ធសន្តិសុខ (System Status)</b>\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "🛡️ <b>Bot Engine:</b> Security_bot_V2.0.1 (Online ✅)\n"
            "🚫 <b>Anti-Malware:</b> Active (.apk, .exe, .bat, .js...)\n"
            "⚡ <b>Anti-Flood:</b> Active (Limit 5 msgs / 4s)\n"
            "🔄 <b>2-Way CRM Sync:</b> Online Realtime\n"
            f"👑 <b>Super Admin:</b> ID <code>{ADMIN_ID}</code>\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "⏱️ <i>សារនេះនឹងរលាយបាត់ក្នុង ១៥ វិនាទី ឬនៅពេលមានពាក្យបញ្ជាថ្មី។</i>"
        )
        try:
            await query.edit_message_text(text, parse_mode="HTML", reply_markup=get_back_keyboard(bot_username), disable_web_page_preview=True)
        except Exception:
            pass

    elif data == "btn_rules":
        text = (
            "🛡️ <b>គោលការណ៍សុវត្ថិភាពគ្រុប (Security Rules)</b>\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "1. 🚫 <b>ហាមដាច់ខាត:</b> ផ្ញើ File មេរោគ (.apk, .exe, .cmd, .scr, .bat...)\n"
            "2. ⚡ <b>ហាម Spam:</b> ផ្ញើសារ Flood ញាប់លើសកំណត់ក្នុងគ្រុប\n"
            "3. 🔗 <b>ហាម Phishing:</b> ផ្ញើ Link បោកប្រាស់ ឬផ្សព្វផ្សាយខុសច្បាប់\n"
            "4. ⚖️ <b>វិធានការ:</b> ប្រព័ន្ធនឹងលុបសារ និងកំហិតសិទ្ធិដោយស្វ័យប្រវត្តិ!\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "⏱️ <i>សារនេះនឹងរលាយបាត់ក្នុង ១៥ វិនាទី ឬនៅពេលមានពាក្យបញ្ជាថ្មី។</i>"
        )
        try:
            await query.edit_message_text(text, parse_mode="HTML", reply_markup=get_back_keyboard(bot_username), disable_web_page_preview=True)
        except Exception:
            pass

    elif data == "btn_help":
        text = (
            "📖 <b>សៀវភៅជំនួយ & ពាក្យបញ្ជា (Bot Help)</b>\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "🔹 <code>/start</code> - បើកផ្ទាំងបញ្ជា & ប៊ូតុងចុចអន្តរកម្ម\n"
            "🔹 <code>/id</code> - ឆែក Group ID & User ID ភ្លាមៗ\n"
            "🔹 <code>/status</code> - ឆែកស្ថានភាពប្រព័ន្ធ & អាជ្ញាប័ណ្ណ\n"
            "🔹 <code>/license</code> - មើលកញ្ចប់សេវា និងថ្ងៃផុតកំណត់\n"
            "🔹 <code>/rules</code> - មើលគោលការណ៍សន្តិសុខគ្រុប\n"
            "🔹 <code>/addgroup</code> - ទទួល Link Add Bot ទៅ Group ផ្សេងទៀត\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "⏱️ <i>សារនេះនឹងរលាយបាត់ក្នុង ១៥ វិនាទី ឬនៅពេលមានពាក្យបញ្ជាថ្មី។</i>"
        )
        try:
            await query.edit_message_text(text, parse_mode="HTML", reply_markup=get_back_keyboard(bot_username), disable_web_page_preview=True)
        except Exception:
            pass

    # Admin actions via buttons
    elif data.startswith("adm_"):
        if not user or not is_admin(user.id):
            return

        parts = data.split("_", 2)
        action_type = parts[1]
        target_cid = parts[2] if len(parts) > 2 else ""

        groups = read_json(GROUPS_FILE, {})
        clients = read_json(CLIENTS_FILE, {})

        now = datetime.now()
        now_str = now.strftime("%Y-%m-%d %H:%M:%S")

        if action_type == "list" or action_type == "list_groups":
            text = (
                f"📋 <b>បញ្ជីឈ្មោះអតិថិជន & ក្រុមទាំងអស់ ({len(groups)} ក្រុម):</b>\n"
                "━━━━━━━━━━━━━━━━━━━━\n"
                "👇 <i>សូមចុចលើឈ្មោះក្រុម ដើម្បីមើល Profile, ប្រវត្តិ និងកំណត់សិទ្ធិ៖</i>"
            )
            try:
                await query.edit_message_text(text, parse_mode="HTML", reply_markup=get_groups_interactive_keyboard())
            except Exception:
                pass
            return

        elif action_type == "backup":
            backup_data = {
                "export_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "total_groups": len(groups),
                "groups": groups,
                "clients": clients
            }
            json_bytes = json.dumps(backup_data, ensure_ascii=False, indent=2).encode("utf-8")
            try:
                await context.bot.send_document(
                    chat_id=user.id,
                    document=json_bytes,
                    filename=f"vault_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                    caption=f"💾 <b>ទិន្នន័យបម្រុងទុក (Cloud Backup)</b>\nសរុប {len(groups)} ក្រុម",
                    parse_mode="HTML"
                )
            except Exception:
                pass
            return

        elif action_type == "scan_expiry":
            await check_and_notify_expired_groups(context)
            try:
                await query.edit_message_text("✅ <b>បានស្កេន និងផ្ញើសារដាស់តឿនផុតកំណត់ទៅកាន់ Group Admin ផ្ទាល់រួចរាល់!</b>", parse_mode="HTML", reply_markup=get_groups_interactive_keyboard())
            except Exception:
                pass
            return

        elif action_type == "check" and target_cid in groups:
            g = groups[target_cid]
            c = clients.get(target_cid, {})
            c_contact = c.get("customer_contact", {})
            history = c.get("purchase_history", [])
            history_str = ""
            for h in history[-3:]:
                history_str += f"\n   • {h.get('package')} ({h.get('purchased_date', '')})"
            if not history_str:
                history_str = "\n   • មិនទាន់មានប្រវត្តិទិញ"

            info_text = (
                f"🗂️ <b>[PROFILE អតិថិជន & កំណត់សិទ្ធិក្រុម]</b>\n"
                "━━━━━━━━━━━━━━━━━━━━\n"
                f"👥 <b>ឈ្មោះក្រុម:</b> <code>{g.get('title')}</code>\n"
                f"📍 <b>Group ID:</b> <code>{target_cid}</code>\n"
                f"👤 <b>អ្នកប្រើប្រាស់/Admin:</b> {c_contact.get('name', g.get('added_by_name'))} ({c_contact.get('username', g.get('added_by_username'))})\n"
                f"🔑 <b>User ID:</b> <code>{c_contact.get('user_id', g.get('added_by_id'))}</code>\n"
                "━━━━━━━━━━━━━━━━━━━━\n"
                f"🛒 <b>កញ្ចប់សេវាបច្ចុប្បន្ន:</b> {g.get('plan_type')}\n"
                f"📅 <b>ថ្ងៃចុះឈ្មោះ:</b> <code>{g.get('added_at', 'N/A')}</code>\n"
                f"📅 <b>ថ្ងៃបើកសិទ្ធិ:</b> <code>{g.get('activated_date', 'N/A')}</code>\n"
                f"⏳ <b>ថ្ងៃផុតកំណត់:</b> <code>{g.get('expiry_date', 'N/A')}</code>\n"
                f"🛡️ <b>ស្ថានភាព:</b> {'🟢 Active (កំពុងការពារ)' if g.get('is_authorized') and g.get('is_enabled') else '🔴 Inactive / Revoked'}\n"
                f"🚫 <b>មេរោគរារាំងបាន:</b> {g.get('threats_blocked_count', 0)} ករណី\n\n"
                f"📜 <b>ប្រវត្តិប្រើប្រាស់/ទិញកញ្ចប់:</b>{history_str}\n"
                "━━━━━━━━━━━━━━━━━━━━\n"
                "👇 <i>សូមជ្រើសរើសសកម្មភាព ឬកំណត់រយៈពេលប្រើប្រាស់ខាងក្រោម៖</i>"
            )
            try:
                await query.edit_message_text(info_text, parse_mode="HTML", reply_markup=get_admin_action_keyboard(target_cid))
            except Exception:
                pass
            return

        if action_type == "trial" and target_cid in groups:
            exp_str = (now + timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")
            groups[target_cid]["is_authorized"] = True
            groups[target_cid]["is_enabled"] = True
            groups[target_cid]["plan_type"] = "🎁 Free Trial 7 Days (សាកល្បង ៧ ថ្ងៃ)"
            groups[target_cid]["activated_date"] = now_str
            groups[target_cid]["expiry_date"] = exp_str
            write_json(GROUPS_FILE, groups)
            write_json(CLIENTS_FILE, clients)
            try:
                await query.edit_message_text(f"✅ <b>បានអនុញ្ញាត Free Trial 7 ថ្ងៃ ដល់ {groups[target_cid]['title']} រួចរាល់!</b>\nផុតកំណត់៖ <code>{exp_str}</code>", parse_mode="HTML", reply_markup=get_admin_action_keyboard(target_cid))
            except Exception:
                pass

        elif action_type == "add30" and target_cid in groups:
            exp_str = (now + timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S")
            groups[target_cid]["is_authorized"] = True
            groups[target_cid]["is_enabled"] = True
            groups[target_cid]["plan_type"] = "Plan 30 Days (កញ្ចប់ ៣០ ថ្ងៃ)"
            groups[target_cid]["activated_date"] = now_str
            groups[target_cid]["expiry_date"] = exp_str
            write_json(GROUPS_FILE, groups)
            write_json(CLIENTS_FILE, clients)
            try:
                await query.edit_message_text(f"✅ <b>បានបន្ថែម 30 ថ្ងៃដល់ {groups[target_cid]['title']} រួចរាល់!</b>\nផុតកំណត់៖ <code>{exp_str}</code>", parse_mode="HTML", reply_markup=get_admin_action_keyboard(target_cid))
            except Exception:
                pass

        elif action_type == "add90" and target_cid in groups:
            exp_str = (now + timedelta(days=90)).strftime("%Y-%m-%d %H:%M:%S")
            groups[target_cid]["is_authorized"] = True
            groups[target_cid]["is_enabled"] = True
            groups[target_cid]["plan_type"] = "Plan 90 Days (កញ្ចប់ ៩០ ថ្ងៃ)"
            groups[target_cid]["activated_date"] = now_str
            groups[target_cid]["expiry_date"] = exp_str
            write_json(GROUPS_FILE, groups)
            write_json(CLIENTS_FILE, clients)
            try:
                await query.edit_message_text(f"✅ <b>បានបន្ថែម 90 ថ្ងៃដល់ {groups[target_cid]['title']} រួចរាល់!</b>\nផុតកំណត់៖ <code>{exp_str}</code>", parse_mode="HTML", reply_markup=get_admin_action_keyboard(target_cid))
            except Exception:
                pass

        elif action_type == "life" and target_cid in groups:
            groups[target_cid]["is_authorized"] = True
            groups[target_cid]["is_enabled"] = True
            groups[target_cid]["is_lifetime"] = True
            groups[target_cid]["plan_type"] = "👑 Lifetime VIP (ពេញមួយជីវិត)"
            groups[target_cid]["activated_date"] = now_str
            groups[target_cid]["expiry_date"] = "Lifetime"
            write_json(GROUPS_FILE, groups)
            write_json(CLIENTS_FILE, clients)
            try:
                await query.edit_message_text(f"👑 <b>បានផ្ដល់ Lifetime VIP ដល់ {groups[target_cid]['title']} រួចរាល់!</b>", parse_mode="HTML", reply_markup=get_admin_action_keyboard(target_cid))
            except Exception:
                pass

        elif action_type == "revoke" and target_cid in groups:
            groups[target_cid]["is_authorized"] = False
            groups[target_cid]["is_enabled"] = False
            groups[target_cid]["plan_type"] = "🔴 Revoked (ដកសិទ្ធិ)"
            write_json(GROUPS_FILE, groups)
            write_json(CLIENTS_FILE, clients)
            try:
                await query.edit_message_text(f"🔴 <b>បានដកសិទ្ធិក្រុម {groups[target_cid]['title']} រួចរាល់!</b>", parse_mode="HTML", reply_markup=get_admin_action_keyboard(target_cid))
            except Exception:
                pass

        elif action_type == "remind" and target_cid in groups:
            g = groups[target_cid]
            g_title = g.get("title", f"Group {target_cid}")
            adder_name = g.get("added_by_name", "")
            adder_username = g.get("added_by_username", "")
            adder_id = g.get("added_by_id", "")
            await send_admin_promote_reminder(context, target_cid, g_title, adder_name, adder_username, adder_id)
            try:
                await query.edit_message_text(f"📢 <b>បានផ្ញើសារដាស់តឿនឱ្យ Promote Bot ទៅកាន់ក្រុម {g_title} រួចរាល់!</b>", parse_mode="HTML", reply_markup=get_admin_action_keyboard(target_cid))
            except Exception:
                pass

        elif action_type == "leave" and target_cid in groups:
            g = groups[target_cid]
            g_title = g.get("title", f"Group {target_cid}")
            # 1. Send farewell message
            try:
                await context.bot.send_message(
                    chat_id=int(target_cid) if target_cid.lstrip("-").isdigit() else target_cid,
                    text="👋 <b>Bot បានចាកចេញពីក្រុមនេះតាមបញ្ជារបស់ Master Admin!</b>\n\n🛡️ ប្រព័ន្ធការពារសុវត្ថិភាពត្រូវបានបិទ។ សូមអរគុណសម្រាប់ការប្រើប្រាស់!",
                    parse_mode="HTML"
                )
            except Exception:
                pass

            # 2. Leave group
            try:
                await context.bot.leave_chat(chat_id=int(target_cid) if target_cid.lstrip("-").isdigit() else target_cid)
            except Exception as e:
                logger.warning(f"Error in callback leave_chat: {e}")

            # 3. Update DB
            groups[target_cid]["is_authorized"] = False
            groups[target_cid]["is_enabled"] = False
            groups[target_cid]["plan_type"] = "🔴 Left Group (Bot បានចាកចេញ)"
            write_json(GROUPS_FILE, groups)

            if target_cid in clients:
                clients[target_cid]["license_status"] = "🔴 BOT LEFT (ចាកចេញពីក្រុម)"
                clients[target_cid]["plan_type"] = "🔴 Left Group (Bot បានចាកចេញ)"
                write_json(CLIENTS_FILE, clients)

            try:
                await query.edit_message_text(f"🚪 <b>Bot បានចាកចេញពីក្រុម <code>{g_title}</code> (ID: <code>{target_cid}</code>) ដោយជោគជ័យ!</b>", parse_mode="HTML", reply_markup=get_groups_interactive_keyboard())
            except Exception:
                pass

# ----------------- CHAT MEMBER & BOT JOIN HANDLERS -----------------
async def my_chat_member_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """ចាប់យកពេល Bot ត្រូវបាន Added ឬ Promoted ក្នុង Group Telegram"""
    chat_member: ChatMemberUpdated = update.my_chat_member
    if not chat_member:
        return

    chat = chat_member.chat
    new_status = chat_member.new_chat_member.status
    old_status = chat_member.old_chat_member.status

    if new_status in ["member", "administrator"] and old_status not in ["member", "administrator"]:
        from_user = chat_member.from_user
        adder_name = from_user.first_name if from_user else "Admin"
        adder_username = f"@{from_user.username}" if from_user and from_user.username else ""
        adder_id = str(from_user.id) if from_user else ""
        chat_id = str(chat.id)
        chat_title = chat.title or "Telegram Group"

        # Auto register into CRM database
        is_new = auto_register_group(
            chat_id=chat_id,
            title=chat_title,
            added_by_name=adder_name,
            added_by_username=adder_username,
            added_by_id=adder_id
        )

        # 1. Send welcome & setup instructions to the group with 1-Week Trial Announcement
        welcome_msg = (
            "🛡️ <b>Security_bot_V2.0.1 ត្រូវបានបន្ថែមចូលក្នុងគ្រុប!</b>\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            f"👥 <b>ក្រុម:</b> <code>{chat_title}</code>\n"
            f"📍 <b>Group ID:</b> <code>{chat_id}</code>  <i>(ចុចដើម្បី Copy)</i>\n"
            f"👑 <b>បន្ថែមដោយ:</b> {adder_name} ({adder_username})\n\n"
            "🎁 <b>ប្រព័ន្ធបានផ្ដល់សិទ្ធិសាកល្បង Free Trial ៧ ថ្ងៃ (១ សប្ដាហ៍) ដោយស្វ័យប្រវត្តិ!</b>\n"
            f"⏳ <b>សុពលភាពដល់ថ្ងៃ៖</b> <code>{(datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')}</code>\n\n"
            "⚠️ <b>ជំហានសំខាន់ដើម្បីបើកការការពារពេញលេញ៖</b>\n"
            "1. សូម Promote Bot ឱ្យទៅជា <b>Admin</b>\n"
            "2. បើកសិទ្ធិ <b>Delete Messages</b> និង <b>Ban/Restrict Users</b>\n\n"
            "📞 <b>សូមទាក់ទង Master Admin ដើម្បីពិគ្រោះ ឬជាវកញ្ចប់សេវា៖</b>\n"
            "👉 <b>Telegram:</b> @sornsecurityrobot (ID: <code>240224709</code>)\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "✅ <i>ប្រព័ន្ធការពារមេរោគ .apk/.exe និង Anti-Flood បានចាប់ផ្តើមការពារជាផ្លូវការ!</i>"
        )
        try:
            await context.bot.send_message(
                chat_id=chat.id,
                text=welcome_msg,
                parse_mode="HTML",
                reply_markup=get_main_menu_keyboard(context.bot.username or "")
            )
        except Exception as err:
            logger.warning(f"Failed to send welcome message in group: {err}")

        # 2. INSTANT ALERT to Master Super Admin (ID: 240224709)
        try:
            admin_alert = (
                "🎉 <b>[ក្រុមថ្មីបានបន្ថែម BOT - NEW GROUP REGISTERED]</b>\n"
                "━━━━━━━━━━━━━━━━━━━━\n"
                f"👥 <b>ឈ្មោះក្រុម:</b> <code>{chat_title}</code>\n"
                f"📍 <b>Group ID:</b> <code>{chat_id}</code>\n"
                f"👤 <b>បន្ថែមដោយ:</b> {adder_name} ({adder_username})\n"
                f"🔑 <b>User ID:</b> <code>{adder_id}</code>\n"
                f"📅 <b>កាលបរិច្ឆេទ:</b> <code>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</code>\n"
                "🎁 <b>ស្ថានភាព:</b> 🟢 <b>បានចុះបញ្ជី & បើកសិទ្ធិ Free Trial 7 ថ្ងៃ (1 សប្ដាហ៍) អូតូរួចរាល់!</b>\n"
                "━━━━━━━━━━━━━━━━━━━━\n"
                "👇 <i>ចុចប៊ូតុងខាងក្រោមដើម្បីគ្រប់គ្រង ឬកែប្រែរយៈពេលបន្ថែម៖</i>"
            )
            await context.bot.send_message(
                chat_id=ADMIN_ID,
                text=admin_alert,
                parse_mode="HTML",
                reply_markup=get_admin_action_keyboard(chat_id)
            )
            logger.info(f"📢 បានផ្ញើសារដំណឹងក្រុមថ្មី {chat_title} ទៅ Master Admin ID {ADMIN_ID} រួចរាល់!")
        except Exception as err:
            logger.warning(f"Failed to send new group alert to master admin: {err}")

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

            auto_register_group(
                chat_id=chat_id,
                title=chat_title,
                added_by_name=adder_name,
                added_by_username=adder_username,
                added_by_id=adder_id
            )

            welcome_msg = (
                "🛡️ <b>Security_bot_V2.0.1 ត្រូវបានបន្ថែមចូលក្នុងគ្រុប!</b>\n"
                "━━━━━━━━━━━━━━━━━━━━\n"
                f"👥 <b>ក្រុម:</b> <code>{chat_title}</code>\n"
                f"📍 <b>Group ID:</b> <code>{chat_id}</code>  <i>(ចុចដើម្បី Copy)</i>\n"
                f"👑 <b>បន្ថែមដោយ:</b> {adder_name} ({adder_username})\n\n"
                "🎁 <b>ប្រព័ន្ធបានផ្ដល់សិទ្ធិសាកល្បង Free Trial ៧ ថ្ងៃ (១ សប្ដាហ៍) ដោយស្វ័យប្រវត្តិ!</b>\n"
                f"⏳ <b>សុពលភាពដល់ថ្ងៃ៖</b> <code>{(datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')}</code>\n\n"
                "⚠️ <b>ជំហានសំខាន់ដើម្បីបើកការការពារពេញលេញ៖</b>\n"
                "1. សូម Promote Bot ឱ្យទៅជា <b>Admin</b>\n"
                "2. បើកសិទ្ធិ <b>Delete Messages</b> និង <b>Ban/Restrict Users</b>\n\n"
                "📞 <b>សូមទាក់ទង Master Admin ដើម្បីពិគ្រោះ ឬជាវកញ្ចប់សេវា៖</b>\n"
                "👉 <b>Telegram:</b> @sornsecurityrobot (ID: <code>240224709</code>)\n"
                "━━━━━━━━━━━━━━━━━━━━\n"
                "✅ <i>ប្រព័ន្ធការពារមេរោគ .apk/.exe និង Anti-Flood បានចាប់ផ្តើមការពារជាផ្លូវការ!</i>"
            )
            await message.reply_text(welcome_msg, parse_mode="HTML", reply_markup=get_main_menu_keyboard(context.bot.username or ""))

            # Alert Master Admin
            try:
                admin_alert = (
                    "🎉 <b>[ក្រុមថ្មីបានបន្ថែម BOT - NEW GROUP REGISTERED]</b>\n"
                    "━━━━━━━━━━━━━━━━━━━━\n"
                    f"👥 <b>ឈ្មោះក្រុម:</b> <code>{chat_title}</code>\n"
                    f"📍 <b>Group ID:</b> <code>{chat_id}</code>\n"
                    f"👤 <b>បន្ថែមដោយ:</b> {adder_name} ({adder_username})\n"
                    f"🔑 <b>User ID:</b> <code>{adder_id}</code>\n"
                    f"📅 <b>កាលបរិច្ឆេទ:</b> <code>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</code>\n"
                    "🎁 <b>ស្ថានភាព:</b> 🟢 <b>បានចុះបញ្ជី & បើកសិទ្ធិ Free Trial 7 ថ្ងៃ (1 សប្ដាហ៍) អូតូរួចរាល់!</b>\n"
                    "━━━━━━━━━━━━━━━━━━━━\n"
                    "👇 <i>ចុចប៊ូតុងខាងក្រោមដើម្បីគ្រប់គ្រង ឬកែប្រែរយៈពេលបន្ថែម៖</i>"
                )
                await context.bot.send_message(
                    chat_id=ADMIN_ID,
                    text=admin_alert,
                    parse_mode="HTML",
                    reply_markup=get_admin_action_keyboard(chat_id)
                )
            except Exception:
                pass

# ----------------- MALWARE & ANTI-FLOOD INSPECTORS -----------------
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
                    async def _auto_del():
                        await asyncio.sleep(BOT_MSG_DELETE_SECONDS)
                        try:
                            await context.bot.delete_message(chat_id=message.chat_id, message_id=warn_msg.message_id)
                        except Exception:
                            pass
                    asyncio.create_task(_auto_del())

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
                async def _auto_del():
                    await asyncio.sleep(BOT_MSG_DELETE_SECONDS)
                    try:
                        await context.bot.delete_message(chat_id=message.chat_id, message_id=warn.message_id)
                    except Exception:
                        pass
                asyncio.create_task(_auto_del())

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

# ----------------- TELEGRAM BOT COMMANDS REGISTRATION (POST_INIT) -----------------
async def post_init_setup(application):
    """កំណត់ Bot Command Menu & Menu Button ក្នុង Telegram App គ្រប់បែបយ៉ាង (Private & Groups)"""
    try:
        # User & Group Menu Commands
        public_commands = [
            BotCommand("start", "🚀 ចាប់ផ្ដើម & បើកម៉ឺនុយមេ"),
            BotCommand("status", "📊 ពិនិត្យស្ថានភាពប្រព័ន្ធ & ការពារ"),
            BotCommand("license", "🔐 ពិនិត្យកញ្ចប់សេវា & សុពលភាព"),
            BotCommand("id", "🆔 ឆែក Group ID & User ID"),
            BotCommand("rules", "🛡️ គោលការណ៍សន្តិសុខគ្រុប"),
            BotCommand("addgroup", "➕ Link Add Bot ទៅ Group ផ្សេងទៀត"),
            BotCommand("help", "📖 សៀវភៅជំនួយ & របៀបប្រើ"),
        ]

        # 1. Default scope (All chats)
        await application.bot.set_my_commands(public_commands, scope=BotCommandScopeDefault())
        
        # 2. Private Chats scope
        await application.bot.set_my_commands(public_commands, scope=BotCommandScopeAllPrivateChats())
        
        # 3. All Group Chats scope
        await application.bot.set_my_commands(public_commands, scope=BotCommandScopeAllGroupChats())
        
        # 4. Group Administrators scope
        admin_commands = public_commands + [
            BotCommand("admin", "👑 ផ្ទាំងបញ្ជា Master Admin Panel"),
            BotCommand("groups", "📋 បញ្ជីគ្រប់គ្រងក្រុម"),
            BotCommand("leave", "🚪 បញ្ជាឱ្យ Bot ចាកចេញពីក្រុម (/leave <id>)"),
            BotCommand("remindadmin", "📢 ផ្ញើសារដាស់តឿន Promote Bot ជា Admin"),
            BotCommand("backup", "💾 ទាញយក Backup (.json)"),
        ]
        await application.bot.set_my_commands(admin_commands, scope=BotCommandScopeAllChatAdministrators())

        logger.info("✅ បានដំឡើង Telegram Bot Commands Menu គ្រប់ Scopes ដោយជោគជ័យ!")
        try:
            await application.bot.set_chat_menu_button(menu_button=MenuButtonCommands())
        except Exception as err:
            logger.debug(f"MenuButtonCommands note: {err}")
    except Exception as e:
        logger.warning(f"Failed to auto-register bot commands menu: {e}")

    # Start background expiry checker
    asyncio.create_task(expiry_checker_loop(application))

def main():
    if not BOT_TOKEN:
        logger.error("❌ BOT_TOKEN is required in environment!")
        sys.exit(1)

    logger.info("🚀 កំពុងចាប់ផ្តើម Security_bot_V2.0.1 ជាមួយ Full Commands & Expiry Direct Alerts...")
    app = ApplicationBuilder().token(BOT_TOKEN).post_init(post_init_setup).build()

    # User & Group Commands
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("id", id_command))
    app.add_handler(CommandHandler("groupid", id_command))
    app.add_handler(CommandHandler("myid", id_command))
    app.add_handler(CommandHandler("chatid", id_command))
    app.add_handler(CommandHandler("status", status_command))
    app.add_handler(CommandHandler("license", license_command))
    app.add_handler(CommandHandler("plan", license_command))
    app.add_handler(CommandHandler("rules", rules_command))
    app.add_handler(CommandHandler("addgroup", addgroup_command))

    # Master Super Admin Commands
    app.add_handler(CommandHandler("admin", admin_panel_command))
    app.add_handler(CommandHandler("panel", admin_panel_command))
    app.add_handler(CommandHandler("groups", groups_list_command))
    app.add_handler(CommandHandler("list", groups_list_command))
    app.add_handler(CommandHandler("adddays", adddays_command))
    app.add_handler(CommandHandler("approve", approve_command))
    app.add_handler(CommandHandler("check", check_command))
    app.add_handler(CommandHandler("leave", leave_group_command))
    app.add_handler(CommandHandler("leavegroup", leave_group_command))
    app.add_handler(CommandHandler("remindadmin", remind_admin_command))
    app.add_handler(CommandHandler("backup", backup_command))
    app.add_handler(CommandHandler("notifyexpiry", notify_expiry_manual_command))

    # Callback Query (Buttons)
    app.add_handler(CallbackQueryHandler(callback_query_handler))

    # Message & Member Update Handlers
    app.add_handler(ChatMemberHandler(my_chat_member_handler, ChatMemberHandler.MY_CHAT_MEMBER))
    app.add_handler(MessageHandler(filters.StatusUpdate.NEW_CHAT_MEMBERS, chat_member_update_handler))
    app.add_handler(MessageHandler(filters.Document.ALL, file_inspector))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_inspector))

    PORT = int(os.environ.get("PORT", "10000"))
    if APP_URL:
        logger.info(f"✅ កំពុងដំណើរការ Webhook លើ Port: {PORT} ជាមួយ Link: {APP_URL}")
        app.run_webhook(
            listen="0.0.0.0",
            port=PORT,
            webhook_url=APP_URL
        )
    else:
        logger.info("🟢 កំពុងដំណើរការ Bot ជា Polling mode...")
        app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
