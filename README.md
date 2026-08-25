# 🛡️ Telegram Group Malware & Security Guard Bot (Admin Dashboard Edition)

Bot ការពារ Group Telegram ពីមេរោគ និង Trojan (Banking Trojan .apk, .jpg.apk, .exe, .scr, .bat, .sh) និងស្កេន VirusTotal SHA-256 ជាមួយប្រព័ន្ធគ្រប់គ្រងបិទ/បើកតាម Group ដោយមេ Admin!

---

## 👑 មុខងារគ្រប់គ្រងសម្រាប់ Master Super Admin (ID: 240224709)
- **`/admin`** : បើកផ្ទាំង Dashboard ចុចប៊ូតុង **🟢 [បើក-ON]** ឬ **🔴 [បិទ-OFF]** ប្រព័ន្ធការពារសម្រាប់ Group នីមួយៗបានយ៉ាងងាយស្រួល។
- **`/myid`** : បញ្ជាឆែកមើលលេខ **Telegram User ID** ផ្ទាល់ខ្លួន ដើម្បីយកទៅដាក់ក្នុង `.env`។
- **`/groups` / `/clients`** : បញ្ជីអតិថិជន និងព័ត៌មាន Group (CRM Database Vault)។
- **`/logs`** : កំណត់ត្រា Security Audit Logs និងប្រវត្តិកម្ចាត់មេរោគ។
- **`/broadcast`** : ផ្សាយពាណិជ្ជកម្មលក់សេវាកម្មទៅកាន់ Channel `@sornsecurityrobot`។
- **Sub-Menus កំណត់សិទ្ធិ** : `[ ➕ 30 ថ្ងៃ ]`, `[ ➕ 90 ថ្ងៃ ]`, `[ 👑 ពេញមួយជីវិត ]`, `[ 🔴 ដកសិទ្ធិ ]`, `[ 🟢 បើក ]`, `[ 🟡 ផ្អាក ]`, `[ 🗑️ លុប ]`។
- **រក្សាទុកទិន្នន័យ (Auto-Save)** : រាល់ Group និងស្ថានភាព ON/OFF ត្រូវបាន Save ទុកក្នុងឯកសារ `groups_config.json`, `clients_database.json`, `security_audit_logs.json` ដោយស្វ័យប្រវត្តិ។

---

## 🚀 របៀបតម្លើង និងដំណើរការ (Quick Setup)

### ១. ដំឡើង Python Dependencies
```bash
pip install -r requirements.txt
```

### ២. កំណត់ Configuration (`.env`)
បង្កើត File `.env` ដោយ Copy ចេញពី `.env.example`៖
```env
TELEGRAM_BOT_TOKEN=TOKEN_យកពី_BotFather
VIRUSTOTAL_API_KEY=API_KEY_យកពី_VirusTotal
SUPER_ADMIN_ID=240224709
PUNISHMENT_MODE=MUTE
MUTE_DURATION_HOURS=24
AUTO_DELETE_SERVICE_MSGS=true
BOT_MSG_DELETE_SECONDS=30
ANTI_FLOOD_ENABLED=true
FLOOD_MAX_MSGS=5
FLOOD_WINDOW_SECONDS=3
```

### ៣. ដំណើរការ Bot
- **Python:** `python telegram_security_bot.py`
- **Web Dashboard:** `npm run dev` (Runs on Port 3000)

### ៤. កំណត់សិទ្ធិក្នុង Telegram Group
- Add Bot ចូលទៅក្នុង Group
- Promote Bot ទៅជា **Admin** ដោយបើកសិទ្ធិ៖
  - ✅ **Delete Messages** (លុបសារ)
  - ✅ **Ban / Restrict Users** (បិទសិទ្ធិ ឬទាត់អ្នកផ្ញើមេរោគចេញ)
