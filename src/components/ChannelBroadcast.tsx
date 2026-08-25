import React, { useState } from "react";
import { Send, CheckCircle, Radio, Sparkles, ExternalLink, ShieldCheck } from "lucide-react";

export const ChannelBroadcast: React.FC = () => {
  const [broadcastMessage, setBroadcastMessage] = useState(
    `🛡️ [ការប្រកាសសេវាកម្មសុវត្ថិភាព - TELEGUARD CYBERSECURITY] 🛡️
━━━━━━━━━━━━━━━━━━━━
🔥 ការពារក្រុម Telegram របស់អ្នកពីមេរោគ និងចោរលួចគណនីធនាគារ!

⚡ សមត្ថភាពការពារពិសេសរបស់ Bot៖
• 🛑 ស្កេន និងកម្ចាត់មេរោគ .apk (Banking Trojan លួចលុយធនាគារ)
• 🛑 ចាប់ហ្វាល់បន្លំកន្ទុយពីរ (.jpg.apk, .pdf.apk)
• 🛑 ទប់ស្កាត់មេរោគកុំព្យូទ័រ .exe, .scr, .bat
• 🌊 ប្រព័ន្ធ Anti-Flood Spam & Clean Service Join/Leave
• ⏱️ ប្រព័ន្ធ 30s Auto-Clean Message មិនរំខានការងារ
• 🗄️ ប្រព័ន្ធកត់ត្រាទិន្នន័យអតិថិជន និងរបាយការណ៍ Security Logs

👑 កញ្ចប់សេវាកម្មពេញនិយម៖
• 🥉 កញ្ចប់ប្រចាំខែ (30 ថ្ងៃ)
• 🥈 កញ្ចប់ ៣ ខែ (90 ថ្ងៃ)
• 🥇 កញ្ចប់ VIP ពេញមួយជីវិត (Lifetime VIP)

👉 ទាក់ទងទិញសិទ្ធិប្រើប្រាស់ភ្លាមៗ៖ @master_admin (ID: 240224709)
📢 ឆានែលផ្លូវការ៖ @sornsecurityrobot
━━━━━━━━━━━━━━━━━━━━`
  );
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  const handleSendBroadcast = async () => {
    setIsBroadcasting(true);
    setBroadcastStatus(null);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customMessage: broadcastMessage })
      });
      const data = await res.json();
      setBroadcastStatus("✅ បានផ្សាយពាណិជ្ជកម្មទៅកាន់ Channel @sornsecurityrobot ជោគជ័យ!");
    } catch (err) {
      setBroadcastStatus("⚠️ ផ្សាយបរាជ័យ សូមពិនិត្យមើលការតភ្ជាប់");
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#e1e5eb] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#1c2733] flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#2481cc]" />
            <span>ប្រព័ន្ធផ្សាយពាណិជ្ជកម្មទៅ Channel (Marketing Broadcaster)</span>
          </h2>
          <p className="text-xs text-[#708499] mt-0.5">
            ផ្សាយដំណឹង និងប្រកាសលក់កញ្ចប់សេវាកម្មសុវត្ថិភាពទៅកាន់ Channel ផ្លូវការ{" "}
            <span className="text-[#2481cc] font-mono">@sornsecurityrobot</span>
          </p>
        </div>

        <a
          href="https://t.me/sornsecurityrobot"
          target="_blank"
          rel="noreferrer"
          className="bg-[#2481cc]/10 hover:bg-[#2481cc]/20 text-[#2481cc] border border-[#2481cc]/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span>បើក Channel @sornsecurityrobot</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Broadcaster Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor (7/12) */}
        <div className="lg:col-span-7 bg-white border border-[#e1e5eb] rounded-xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1c2733]">
              សរសេរ ឬកែសម្រួលសារប្រកាស (Broadcast Message Editor)
            </span>
            <button
              onClick={() =>
                setBroadcastMessage(
                  `🛡️ [ប្រកាសពិសេស - TELEGUARD] 🛡️\n\n🔥 បើកទទួលសមាជិកថ្មីសម្រាប់កញ្ចប់ VIP ពេញមួយជីវិត (Lifetime VIP)!\n👉 ទាក់ទង Master Admin: @master_admin\n📢 Channel: @sornsecurityrobot`
                )
              }
              className="text-xs text-[#2481cc] hover:underline flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ទម្រង់ខ្លី (Quick Promo)</span>
            </button>
          </div>

          <textarea
            rows={14}
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg p-3.5 text-xs font-mono text-[#1c2733] focus:outline-none focus:border-[#2481cc] leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#708499]">
              គោលដៅ៖ <strong className="text-[#2481cc] font-mono">@sornsecurityrobot</strong>
            </span>

            <button
              onClick={handleSendBroadcast}
              disabled={isBroadcasting}
              className="bg-[#2481cc] hover:bg-[#1b64a0] text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isBroadcasting ? "កំពុងផ្សាយ..." : "ផ្សាយទៅ Channel ឥឡូវនេះ"}</span>
            </button>
          </div>

          {broadcastStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{broadcastStatus}</span>
            </div>
          )}
        </div>

        {/* Live Channel Post Preview (5/12) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-[11px] font-bold text-[#708499] uppercase tracking-wider px-1">
            ទម្រង់បង្ហាញក្នុង Channel (Telegram Post Preview)
          </div>

          <div className="bg-[#1c2733] border border-[#2d3b4a] rounded-xl p-4 shadow-md space-y-3 text-white">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#2d3b4a]">
              <div className="w-7 h-7 rounded-full bg-[#2481cc] flex items-center justify-center font-bold text-white text-xs">
                📢
              </div>
              <div>
                <div className="font-bold text-xs text-white">TeleGuard Official Broadcast</div>
                <div className="text-[10px] text-[#708499]">@sornsecurityrobot • Just now</div>
              </div>
            </div>

            <div className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed bg-[#242f3d] p-3.5 rounded-lg border border-[#2d3b4a]">
              {broadcastMessage}
            </div>

            <div className="pt-1 text-[10px] text-[#708499] flex items-center justify-between">
              <span>👁️ 1.2k views</span>
              <span>Telegram Channel Post</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
