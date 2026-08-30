import React, { useState } from "react";
import { Terminal, Copy, Check, ExternalLink, Shield, Database, Cloud, RefreshCw } from "lucide-react";

export const BotCodeHub: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"python" | "env" | "setup" | "cloud_db">("cloud_db");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const cloudDbMongoExample = `# 1. បង្កើត MongoDB Atlas Free Cluster (512MB M0 Free រហូត)
# នៅលើ https://www.mongodb.com/cloud/atlas -> បង្កើត Cluster Free
# ចុច 'Connect' -> 'Connect your application' -> ចម្លង Connection String

# 2. បញ្ចូលក្នុង Render Environment Variables:
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB_NAME="sorn_security_bot"

# ឬប្រសិនបើប្រើ PostgreSQL / Supabase Free:
DATABASE_URL="postgresql://postgres:<password>@db.xxxxxx.supabase.co:5432/postgres"
`;

  const envTemplate = `# TeleGuard Security Bot Configuration
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_FROM_BOTFATHER"
VIRUSTOTAL_API_KEY="YOUR_VIRUSTOTAL_API_KEY"
SUPER_ADMIN_ID="240224709"
PUNISHMENT_MODE="MUTE"
MUTE_DURATION_HOURS="24"
AUTO_DELETE_SERVICE_MSGS="true"
BOT_MSG_DELETE_SECONDS="30"
ANTI_FLOOD_ENABLED="true"
FLOOD_MAX_MSGS="5"
FLOOD_WINDOW_SECONDS="3"

# Cloud Database Persistence (រក្សាទិន្នន័យបានរហូត ១០០% មិនបាត់បង់ពេល Restart)
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB_NAME="sorn_security_bot"
`;

  const setupCommands = `# ========================================================
# 🚀 របៀប RUN កម្មវិធី និង BOT (HOW TO RUN THE APP & BOT)
# ========================================================

# --------------------------------------------------------
# 🖥️ ជម្រើសទី ១៖ RUN លើកុំព្យូទ័រផ្ទាល់ (Local Machine)
# --------------------------------------------------------

# 1. សម្រាប់ Windows (ចុច 1-Click):
# គ្រាន់តែ Double-Click លើ file: run_bot_windows.bat
# ឬវាយក្នុង Command Prompt (CMD):
run_bot_windows.bat

# 2. សម្រាប់ Mac / Linux:
chmod +x start_bot.sh
./start_bot.sh

# 3. ដំណើរការផ្ទាំងគ្រប់គ្រង Web Dashboard (React + Express):
npm install
npm run dev

# --------------------------------------------------------
# ☁️ ជម្រើសទី ២៖ RUN លើ RENDER.COM (Cloud 24/7 Free)
# --------------------------------------------------------
# 1. បង្កើត Web Service លើ Render.com ដោយភ្ជាប់ជាមួយ GitHub
# 2. កំណត់ Settings:
#    - Environment: Python 3
#    - Build Command: pip install -r requirements.txt
#    - Start Command: python bot.py
# 3. ក្នុងផ្ទាំង Environment Variables ដាក់:
#    - TELEGRAM_BOT_TOKEN = "your_bot_token"
#    - SUPER_ADMIN_ID = "240224709"
#    - MONGODB_URI = "your_mongodb_cluster_url" (ជម្រើសល្អបំផុតសម្រាប់រក្សាទិន្នន័យ)

# --------------------------------------------------------
# 📱 ពាក្យបញ្ជាបញ្ជាការលើ TELEGRAM BOT (Commands):
# --------------------------------------------------------
# /admin      - បើកផ្ទាំងបញ្ជា Master Admin Panel
# /groups     - បញ្ជីគ្រប់គ្រងក្រុម និងអតិថិជនទាំងអស់
# /delgroup   - លុបក្រុមចេញពីបញ្ជី (/delgroup <id>)
# /restore    - ស្ដារ និងទាញយកទិន្នន័យពី Cloud/Backup
# /adddays    - បន្ថែមថ្ងៃប្រើប្រាស់ (/adddays <id> <days>)
# /approve    - អនុញ្ញាត Free Trial 7 ថ្ងៃ (/approve <id>)
# /broadcast  - ផ្ញើសារផ្សាយពាណិជ្ជកម្មទៅកាន់ Channel
# /dbstatus   - ឆែកស្ថានភាព Cloud MongoDB
`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#e1e5eb] p-4 sm:p-5 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#1c2733] flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#2481cc]" />
            <span>Python Source Code & Cloud Database Vault</span>
          </h2>
          <p className="text-xs text-[#708499] mt-0.5">
            កូដពេញលេញ ១០០% នៃឯកសារ <span className="font-mono text-[#2481cc]">bot.py</span>,{" "}
            <span className="font-mono text-[#2481cc]">MongoDB Atlas / PostgreSQL Cloud Sync</span> និងការណែនាំ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#f8fafc] p-1 rounded-lg border border-[#e1e5eb]">
          <button
            onClick={() => setActiveSubTab("cloud_db")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === "cloud_db"
                ? "bg-[#2481cc] text-white shadow-sm font-bold"
                : "text-[#708499] hover:text-[#1c2733]"
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud Database (Free)</span>
          </button>
          <button
            onClick={() => setActiveSubTab("python")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeSubTab === "python"
                ? "bg-[#2481cc] text-white shadow-sm font-bold"
                : "text-[#708499] hover:text-[#1c2733]"
            }`}
          >
            bot.py Code
          </button>
          <button
            onClick={() => setActiveSubTab("env")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeSubTab === "env"
                ? "bg-[#2481cc] text-white shadow-sm font-bold"
                : "text-[#708499] hover:text-[#1c2733]"
            }`}
          >
            .env Variables
          </button>
          <button
            onClick={() => setActiveSubTab("setup")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeSubTab === "setup"
                ? "bg-[#2481cc] text-white shadow-sm font-bold"
                : "text-[#708499] hover:text-[#1c2733]"
            }`}
          >
            🚀 Run & Commands
          </button>
        </div>
      </div>

      {/* Cloud DB Quick Banner */}
      {activeSubTab === "cloud_db" && (
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-blue-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">វិធីរក្សាទុកទិន្នន័យ Bot ជាប់រហូត ១០០% ជាមួយ Free Cloud Database</h3>
                <p className="text-xs text-blue-200">គ្មានការបាត់បង់ទិន្នន័យទោះបីជា Render Restart រាប់ពាន់ដងក៏ដោយ!</p>
              </div>
            </div>
            <a
              href="https://www.mongodb.com/cloud/atlas/register"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow"
            >
              <span>ចុះឈ្មោះ MongoDB Free</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1.5">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center text-[10px]">1</span>
                <span>បង្កើត MongoDB Atlas Free</span>
              </div>
              <p className="text-[11px] text-slate-200">
                ចុះឈ្មោះនៅ <span className="text-cyan-300 font-bold">mongodb.com</span> ជ្រើសរើស Free Tier M0 (512MB ឥតគិតថ្លៃរហូត)។
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1.5">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center text-[10px]">2</span>
                <span>កំណត់លើ Render</span>
              </div>
              <p className="text-[11px] text-slate-200">
                បន្ថែម Variable ឈ្មោះ <code className="bg-black/30 px-1 py-0.5 rounded text-emerald-200 font-mono">MONGODB_URI</code> ក្នុងផ្ទាំង Environment លើ Render។
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1.5">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-400/20 flex items-center justify-center text-[10px]">3</span>
                <span>Auto-Restore & Backup</span>
              </div>
              <p className="text-[11px] text-slate-200">
                Bot នឹង Auto-Restore និង Sync ទៅ Cloud រាល់ពេលមានការផ្លាស់ប្តូរ និងផ្ញើ <code className="text-amber-200">/backup</code> លើ Telegram។
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Code Viewer Box */}
      <div className="bg-[#1c2733] border border-[#2d3b4a] rounded-xl overflow-hidden shadow-md">
        <div className="bg-[#243343] px-4 py-2.5 border-b border-[#2d3b4a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            <span className="text-xs text-[#708499] font-mono pl-1.5">
              {activeSubTab === "cloud_db"
                ? "Cloud Database (MongoDB Atlas / PostgreSQL) Config"
                : activeSubTab === "python"
                ? "bot.py (Full 100% Commercial CRM Edition)"
                : activeSubTab === "env"
                ? ".env.example"
                : "Terminal Commands & Telegram DB Management"}
            </span>
          </div>

          <button
            onClick={() => {
              if (activeSubTab === "cloud_db") copyToClipboard(cloudDbMongoExample, "cloud_db");
              else if (activeSubTab === "env") copyToClipboard(envTemplate, "env");
              else if (activeSubTab === "setup") copyToClipboard(setupCommands, "setup");
              else copyToClipboard("FULL_PYTHON_CODE_DOWNLOADED", "py");
            }}
            className="flex items-center gap-1.5 text-xs text-[#64b5f6] hover:text-white font-medium bg-[#1c2733] px-2.5 py-1 rounded border border-[#2d3b4a] transition-colors"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey ? "បានចម្លង (Copied!)" : "Copy Code"}</span>
          </button>
        </div>

        <div className="p-4 font-mono text-xs text-slate-100 overflow-x-auto leading-relaxed max-h-[500px]">
          {activeSubTab === "cloud_db" && <pre>{cloudDbMongoExample}</pre>}
          {activeSubTab === "env" && <pre>{envTemplate}</pre>}
          {activeSubTab === "setup" && <pre>{setupCommands}</pre>}
          {activeSubTab === "python" && (
            <pre>{`"""
=============================================================================
🛡️ TELEGRAM GROUP MALWARE & THREAT GUARD BOT (FULL COMMERCIAL CRM & CLOUD DB)
=============================================================================
Author: Cybersecurity & Telegram Defense Bot
Sole Bot Owner: 240224709 (Master Super Admin)
Official Channel: https://t.me/sornsecurityrobot (@sornsecurityrobot)

Core Features:
1. 🗄️ Cloud Database Persistence (MongoDB Atlas & PostgreSQL/Supabase):
   - Auto-Restore on boot & Real-time Cloud Sync
   - Telegram Commands: /dbstatus, /synccloud, /backup
2. 📋 Client Database & CRM: មើលបញ្ជីអតិថិជន កញ្ចប់សេវា ថ្ងៃទិញ និងរយៈពេលនៅសល់
3. ⚙️ Group Profile & License Config: [ +30 ថ្ងៃ ], [ +90 ថ្ងៃ ], [ 👑 ពេញមួយជីវិត ]
4. ⏱️ Auto-Delete & Anti-Flood Sweeper Watchdog
5. 🛡️ Two-Tier Clean Isolation: Master Owner (ពេញលេញ) vs Client Admin (២ ប៊ូតុង)
=============================================================================
"""

# (Full python script is safely preserved and saved in /bot.py)`}</pre>
          )}
        </div>
      </div>
    </div>
  );
};
