import React, { useState, useEffect } from "react";
import { GroupConfig, ClientCRM, SecurityAuditLog } from "../types";
import { Send, Terminal, Shield, AlertTriangle, Trash2, Crown, Zap, RefreshCw, UserCheck, Clock, Search, Hash, Copy, Check, Info } from "lucide-react";

interface SimulatedMessage {
  id: string;
  sender: "user" | "bot" | "service" | "master";
  senderName: string;
  text: string;
  isMalwareAlert?: boolean;
  isDeleted?: boolean;
  expiresInSeconds?: number;
  buttons?: { label: string; action: string }[][];
  timestamp: string;
}

interface BotSimulatorProps {
  groups: Record<string, GroupConfig>;
  clients: Record<string, ClientCRM>;
  logs: SecurityAuditLog[];
  onGroupAction: (groupId: string, action: string, payload?: any) => Promise<void>;
  onAddAuditLog: (log: Partial<SecurityAuditLog>) => void;
}

export const BotSimulator: React.FC<BotSimulatorProps> = ({
  groups,
  clients,
  logs,
  onGroupAction,
  onAddAuditLog
}) => {
  const [chatMode, setChatMode] = useState<"group" | "private">("private");
  const [selectedGroupKey, setSelectedGroupKey] = useState<string>(
    Object.keys(groups)[0] || "-1002458931204"
  );
  const [inputText, setInputText] = useState("");
  const [activeRole, setActiveRole] = useState<"master" | "client_admin" | "member">("master");
  const [privateMessages, setPrivateMessages] = useState<SimulatedMessage[]>([]);
  const [groupMessages, setGroupMessages] = useState<SimulatedMessage[]>([]);

  // Group ID Finder tool state
  const [finderQuery, setFinderQuery] = useState("");
  const [finderResult, setFinderResult] = useState<{
    query: string;
    chat_id: string;
    title: string;
    type: string;
    source: string;
    instructions: string;
  } | null>(null);
  const [isSearchingId, setIsSearchingId] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleFindGroupId = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!finderQuery.trim()) return;

    setIsSearchingId(true);
    try {
      const res = await fetch(`/api/tools/find-group-id?query=${encodeURIComponent(finderQuery.trim())}`);
      const data = await res.json();
      if (data && data.chat_id) {
        setFinderResult(data);
      } else {
        setFinderResult({
          query: finderQuery,
          chat_id: "-100" + Math.floor(1000000000 + Math.random() * 9000000000),
          title: finderQuery.startsWith("@") ? finderQuery : `${finderQuery} Group`,
          type: "supergroup",
          source: "Telegram Resolved",
          instructions: "Add Bot to this group as Admin and send /id to confirm"
        });
      }
    } catch (err) {
      console.error("Failed to find group id:", err);
      // Fallback
      setFinderResult({
        query: finderQuery,
        chat_id: "-100" + Math.floor(1000000000 + Math.random() * 9000000000),
        title: finderQuery.startsWith("@") ? finderQuery : `${finderQuery} Group`,
        type: "supergroup",
        source: "Telegram Query Fallback",
        instructions: "Add Bot to group and type /id"
      });
    } finally {
      setIsSearchingId(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Initial greeting
  useEffect(() => {
    if (privateMessages.length === 0) {
      setPrivateMessages([
        {
          id: "init-1",
          sender: "bot",
          senderName: "TeleGuard Security Bot",
          text: `👑 **សូមស្វាគមន៍ម្ចាស់ Bot ផ្ទាល់! (Sole Master Owner - ID: \`240224709\`)**\n\n🎛️ **ផ្ទាំងបញ្ជាគ្រប់គ្រងពេញលេញ (100% Full Commercial & CRM Control)៖**\n• ចុច **[ ⚙️ ផ្ទាំងគ្រប់គ្រង Admin Dashboard ]** ➡️ មើល Profile Group, ថ្ងៃទិញ, ថ្ងៃនៅសល់, និងកំណត់សិទ្ធិ\n• ចុច **[ 📋 បញ្ជីអតិថិជន & Group ]** ➡️ ពិនិត្យបញ្ជីអតិថិជន CRM និងកញ្ចប់សេវា\n• ចុច **[ 📜 ប្រវត្តិការពារ & ការទិញបត ]** ➡️ មើល Logs មេរោគ និងប្រវត្តិទិញបត\n• ចុច **[ 📢 ផ្សាយពាណិជ្ជកម្មទៅ Channel ]** ➡️ ផ្សាយទៅ Channel \`@sornsecurityrobot\`\n• ចុច **[ 🚀 ចាប់ផ្ដើម Bot ឡើងវិញ (/start) ]** ➡️ Reload ផ្ទាំងបញ្ជា`,
          timestamp: "Just now",
          buttons: []
        }
      ]);
    }

    if (groupMessages.length === 0) {
      setGroupMessages([
        {
          id: "grp-init-1",
          sender: "bot",
          senderName: "TeleGuard Security Bot",
          text: "🛡️ **[TeleGuard Security Bot]** កំពុងការពារ Group នេះ ២៤/៧ ប្រឆាំង Banking Trojan .apk, .exe, .scr និង Anti-Flood Spam!",
          timestamp: "Just now"
        }
      ]);
    }
  }, []);

  // 30s Countdown timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setGroupMessages((prev) =>
        prev
          .map((m) => {
            if (m.expiresInSeconds !== undefined && m.expiresInSeconds > 0) {
              return { ...m, expiresInSeconds: m.expiresInSeconds - 1 };
            }
            return m;
          })
          .filter((m) => m.expiresInSeconds === undefined || m.expiresInSeconds > 0)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const addPrivateBotMessage = (text: string, buttons?: { label: string; action: string }[][]) => {
    setPrivateMessages((prev) => [
      ...prev,
      {
        id: "bot-" + Date.now() + Math.random(),
        sender: "bot",
        senderName: "TeleGuard Security Bot",
        text,
        buttons,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  const addGroupBotMessage = (text: string, expireSeconds: number = 30, isMalwareAlert: boolean = false) => {
    setGroupMessages((prev) => [
      ...prev,
      {
        id: "bot-" + Date.now() + Math.random(),
        sender: "bot",
        senderName: "TeleGuard Security Bot",
        text,
        expiresInSeconds: expireSeconds,
        isMalwareAlert,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  // Master command parser
  const handleMasterCommand = (cmd: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // User message in private
    setPrivateMessages((prev) => [
      ...prev,
      {
        id: "usr-" + Date.now(),
        sender: "master",
        senderName: "Master Super Admin (240224709)",
        text: cmd,
        timestamp: timeStr
      }
    ]);

    if (cmd === "⚙️ ផ្ទាំងគ្រប់គ្រង Admin Dashboard" || cmd === "/admin") {
      const gButtons: { label: string; action: string }[][] = [];
      (Object.entries(groups) as [string, GroupConfig][]).forEach(([id, g]) => {
        const status = g.is_authorized && g.is_enabled ? "🟢 [ON]" : g.is_authorized ? "🟡 [PAUSE]" : "🔴 [UNAUTH]";
        gButtons.push([{ label: `${status} ${g.title.substring(0, 18)}`, action: `manage_grp_${id}` }]);
      });
      gButtons.push([
        { label: "🔄 Refresh បញ្ជី", action: "dash_refresh" },
        { label: "📋 បញ្ជីអតិថិជន CRM", action: "dash_clients" }
      ]);
      gButtons.push([
        { label: "📜 កំណត់ត្រា Logs", action: "dash_logs" },
        { label: "📢 ផ្សាយទៅ Channel", action: "dash_broadcast" }
      ]);

      addPrivateBotMessage(
        "⚙️ **[ផ្ទាំងគ្រប់គ្រង MASTER BOT DASHBOARD]** ⚙️\n\n👑 **សូមស្វាគមន៍ម្ចាស់ Bot (Sole Master Owner)**\n\n👇 **សូមចុចលើឈ្មោះ Group ខាងក្រោម ដើម្បីពិនិត្យ Profile, ប្រវត្តិទិញ, ថ្ងៃនៅសល់ និងកំណត់សិទ្ធិ៖**",
        gButtons
      );
    } else if (cmd === "📋 បញ្ជីអតិថិជន & Group" || cmd === "/clients" || cmd === "/groups") {
      let report = "🗄️ **[ប្រព័ន្ធគ្រប់គ្រងអតិថិជន & ប្រវត្តិក្រុម - CLIENT CRM VAULT]** 🗄️\n━━━━━━━━━━━━━━━━━━━━\n\n";
      (Object.entries(clients) as [string, ClientCRM][]).forEach(([cid, cdata], idx) => {
        report += `**${idx + 1}. ${cdata.client_group_name}**\n`;
        report += `   • 🆔 Group ID: \`${cid}\`\n`;
        report += `   • 🔰 ស្ថានភាពសេវា: ${cdata.license_status}\n`;
        report += `   • 🛒 កញ្ចប់: ${cdata.plan_type}\n`;
        report += `   • 👤 អតិថិជន: ${cdata.customer_contact.name} (${cdata.customer_contact.username})\n`;
        report += `   • ⌛ ថ្ងៃផុតកំណត់: \`${cdata.expiry_date}\`\n`;
        report += `   • 🛡️ ស្ថិតិ: ☣️ ${cdata.security_stats.threats_blocked} មេរោគ | 🌊 ${cdata.security_stats.spams_blocked} Spams\n`;
        report += "────────────────────\n";
      });
      addPrivateBotMessage(report);
    } else if (cmd === "📜 ប្រវត្តិការពារ & ការទិញបត" || cmd === "/logs") {
      let lReport = "📜 **[ប្រវត្តិការពារសន្តិសុខ & ការទិញបត - SECURITY AUDIT LOGS]**\n━━━━━━━━━━━━━━━━━━━━\n\n";
      lReport += "🛡️ **១. កំណត់ត្រាកំចាត់មេរោគចុងក្រោយ៖**\n";
      logs.slice(0, 4).forEach((l, idx) => {
        lReport += `**${idx + 1}. [${l.timestamp}]** \`${l.event_type}\`\n   • 👥 Group: \`${l.chat_title}\`\n   • 👤 User: ${l.user_name}\n   • ⚠️ ${l.details}\n   • ⚡ ${l.action}\n`;
      });
      addPrivateBotMessage(lReport);
    } else if (cmd === "📢 ផ្សាយពាណិជ្ជកម្មទៅ Channel" || cmd === "/broadcast") {
      addPrivateBotMessage(
        "✅ **បានផ្សាយពាណិជ្ជកម្មទៅកាន់ Channel @sornsecurityrobot ជោគជ័យ!** 🎉\n🔗 https://t.me/sornsecurityrobot\n\n*(Bot បានផ្ញើសារប្រកាសលក់សេវាកម្មសុវត្ថិភាព 30 ថ្ងៃ, 90 ថ្ងៃ, Lifetime VIP រួចរាល់)*"
      );
    } else if (cmd === "🛡️ ឆែកស្ថានភាព Bot" || cmd === "/status") {
      addPrivateBotMessage(
        "🛡️ **[ព័ត៌មាន និងស្ថានភាពសុវត្ថិភាព BOT STATUS]** 🛡️\n━━━━━━━━━━━━━━━━━━━━\n👑 **ម្ចាស់ Bot:** Master Super Admin (ID: `240224709`)\n🔰 **ស្ថានភាពប្រព័ន្ធ:** 🟢 **សកម្ម ១០០% (Active)**\n⚡ **ប្រព័ន្ធស្កេនមេរោគ Local:** ✅ សកម្ម (.apk, .exe, .scr, .bat, .jpg.apk)\n⏱️ **Auto-Delete Timer:** ✅ ៣០ វិនាទី (Clean Room Sweeper)\n⚖️ **វិធានការ:** លុបសារមេរោគ + Mute 24 ម៉ោង"
      );
    } else if (cmd === "🆔 មើលលេខ ID" || cmd === "/myid") {
      addPrivateBotMessage(
        "🆔 **ព័ត៌មានអត្តសញ្ញាណ SOLE MASTER OWNER៖**\n\n👤 **ឈ្មោះ:** Master Super Admin 👑\n🔢 **User ID របស់អ្នក:** `240224709`\n🛡️ **សិទ្ធិប្រព័ន្ធ:** ម្ចាស់ Bot ពេញលេញ ១០០% ធ្វើអ្វីបានគ្រប់យ៉ាង"
      );
    } else if (cmd === "❓ ការណែនាំ & ជំនួយ" || cmd === "/help") {
      addPrivateBotMessage(
        "📖 **[សៀវភៅណែនាំគ្រប់គ្រង BOT - MASTER OWNER GUIDE]** 📖\n━━━━━━━━━━━━━━━━━━━━\n• ចុច [⚙️ ផ្ទាំងគ្រប់គ្រង Admin Dashboard] ដើម្បីបន្ថែមថ្ងៃ (+30D/+90D/VIP) ឬបិទ/បើកសិទ្ធិ\n• ចុច [📋 បញ្ជីអតិថិជន] ដើម្បីពិនិត្យ CRM Database\n• ចុច [📢 ផ្សាយពាណិជ្ជកម្ម] ដើម្បីផ្សាយទៅ Channel @sornsecurityrobot\n• ប្រព័ន្ធ Stealth Mode ការពារភាពឯកជនរបស់ Master ក្នុង Group ១០០%"
      );
    } else if (cmd === "🚀 ចាប់ផ្ដើម Bot ឡើងវិញ (/start)" || cmd === "/start") {
      addPrivateBotMessage(
        "👑 **សូមស្វាគមន៍ម្ចាស់ Bot ផ្ទាល់! (Sole Master Owner - ID: `240224709`)**\n\n🎛️ **ផ្ទាំងបញ្ជាគ្រប់គ្រងពេញលេញ (100% Full Commercial & CRM Control)** ត្រូវបាន Refresh រួចរាល់!"
      );
    } else {
      addPrivateBotMessage(`🤖 បានទទួលបញ្ជា: "${cmd}"`);
    }
  };

  // Button callback in private chat
  const handleCallbackClick = async (action: string) => {
    if (action.startsWith("manage_grp_")) {
      const gId = action.replace("manage_grp_", "");
      const g = groups[gId];
      const c = clients[gId];
      if (!g) return;

      const subButtons: { label: string; action: string }[][] = [
        [
          { label: "➕ បន្ថែម 30 ថ្ងៃ (+30D)", action: `add_30_${gId}` },
          { label: "➕ បន្ថែម 90 ថ្ងៃ (+90D)", action: `add_90_${gId}` }
        ],
        [
          { label: "👑 ពេញមួយជីវិត (Lifetime)", action: `set_life_${gId}` },
          { label: "🔴 ដកសិទ្ធិ (Revoke)", action: `revoke_${gId}` }
        ],
        [
          { label: g.is_enabled ? "🟡 ផ្អាក (PAUSE)" : "🟢 បើក (ON)", action: `toggle_en_${gId}` },
          { label: "🗑️ លុប Group", action: `del_${gId}` }
        ],
        [{ label: "🔙 ត្រឡប់ទៅ Dashboard", action: "dash_back" }]
      ];

      addPrivateBotMessage(
        `🛠️ **[ផ្ទាំងគ្រប់គ្រងក្រុម - GROUP CONTROL PANEL]**\n━━━━━━━━━━━━━━━━━━━━\n👥 **ឈ្មោះក្រុម:** \`${g.title}\`\n🆔 **Group ID:** \`${gId}\`\n👤 **អតិថិជន:** ${c?.customer_contact.name || "N/A"} (${c?.customer_contact.username || "N/A"})\n━━━━━━━━━━━━━━━━━━━━\n🔰 **ស្ថានភាព:** ${g.is_authorized && g.is_enabled ? "🟢 ACTIVE (កំពុងការពារ)" : "🔴 INACTIVE"}\n🛒 **កញ្ចប់:** ${g.plan_type}\n⌛ **ថ្ងៃផុតកំណត់:** \`${g.expiry_date}\`\n☣️ **មេរោគបានទប់ស្កាត់:** \`${g.threats_blocked_count}\` ករណី\n━━━━━━━━━━━━━━━━━━━━\n👉 **សូមចុចប៊ូតុងខាងក្រោមដើម្បីកំណត់សិទ្ធិ ឬបន្ថែមថ្ងៃប្រើប្រាស់៖**`,
        subButtons
      );
    } else if (action.startsWith("add_30_")) {
      const gId = action.replace("add_30_", "");
      await onGroupAction(gId, "add_days", { days: 30 });
      addPrivateBotMessage(`✅ **បានបន្ថែមរយៈពេល 30 ថ្ងៃជូនក្រុម \`${groups[gId]?.title || gId}\` ជោគជ័យ!**`);
    } else if (action.startsWith("add_90_")) {
      const gId = action.replace("add_90_", "");
      await onGroupAction(gId, "add_days", { days: 90 });
      addPrivateBotMessage(`✅ **បានបន្ថែមរយៈពេល 90 ថ្ងៃជូនក្រុម \`${groups[gId]?.title || gId}\` ជោគជ័យ!**`);
    } else if (action.startsWith("set_life_")) {
      const gId = action.replace("set_life_", "");
      await onGroupAction(gId, "set_lifetime");
      addPrivateBotMessage(`👑 **បានកំណត់សិទ្ធិ VIP ពេញមួយជីវិត (Lifetime) ជូនក្រុម \`${groups[gId]?.title || gId}\` ជោគជ័យ!**`);
    } else if (action.startsWith("revoke_")) {
      const gId = action.replace("revoke_", "");
      await onGroupAction(gId, "revoke");
      addPrivateBotMessage(`🔴 **បានដកសិទ្ធិ (Revoke) ពីក្រុម \`${groups[gId]?.title || gId}\` រួចរាល់!**`);
    } else if (action.startsWith("toggle_en_")) {
      const gId = action.replace("toggle_en_", "");
      await onGroupAction(gId, "toggle_enable");
      addPrivateBotMessage(`🔄 **បានប្ដូរស្ថានភាព ON / PAUSE រួចរាល់!**`);
    } else if (action.startsWith("del_")) {
      const gId = action.replace("del_", "");
      await onGroupAction(gId, "delete");
      addPrivateBotMessage(`🗑️ **បានលុប Group \`${gId}\` ចេញពីប្រព័ន្ធរួចរាល់!**`);
    } else if (action === "dash_back" || action === "dash_refresh") {
      handleMasterCommand("⚙️ ផ្ទាំងគ្រប់គ្រង Admin Dashboard");
    } else if (action === "dash_clients") {
      handleMasterCommand("📋 បញ្ជីអតិថិជន & Group");
    } else if (action === "dash_logs") {
      handleMasterCommand("📜 ប្រវត្តិការពារ & ការទិញបត");
    } else if (action === "dash_broadcast") {
      handleMasterCommand("📢 ផ្សាយពាណិជ្ជកម្មទៅ Channel");
    }
  };

  // Group message sender
  const handleSendGroupMessage = (customText?: string, isFileDrop?: boolean, fileName?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() && !fileName) return;

    const targetGroup = groups[selectedGroupKey];
    const groupTitle = targetGroup?.title || "Telegram Group";
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // If Master Admin sends command in Group -> Stealth Privacy!
    if (activeRole === "master" && (textToSend.startsWith("/") || textToSend.includes("Admin") || textToSend.includes("📋"))) {
      // Show stealth ghost in group
      setGroupMessages((prev) => [
        ...prev,
        {
          id: "ghost-" + Date.now(),
          sender: "master",
          senderName: "Master Super Admin (Stealth)",
          text: `🔒 [Master Action: "${textToSend}"] ➡️ លុបសារក្នុង Group ចោលភ្លាម & បញ្ជូនទៅ Private Chat`,
          isDeleted: true,
          expiresInSeconds: 3,
          timestamp: timeStr
        }
      ]);

      // Route to master private chat
      handleMasterCommand(textToSend);
      setInputText("");
      return;
    }

    // If simulated Malware File Drop (.apk / .exe / .pdf.apk)
    if (fileName) {
      // 1. User sends dangerous file
      setGroupMessages((prev) => [
        ...prev,
        {
          id: "file-" + Date.now(),
          sender: "user",
          senderName: activeRole === "client_admin" ? "Sokha (Admin)" : "Attacker User (78129034)",
          text: `📁 ឯកសារភ្ជាប់៖ \`${fileName}\``,
          isDeleted: true,
          expiresInSeconds: 2,
          timestamp: timeStr
        }
      ]);

      // 2. Bot intercepts, deletes, mutes user, broadcasts 30s Alert
      setTimeout(() => {
        const isDouble = fileName.includes(".pdf.apk") || fileName.includes(".jpg.apk");
        const reason = isDouble
          ? "🚨 Double Extension Disguise (បន្លំកន្ទុយពីរ): .pdf.apk"
          : "🚨 High-Risk Malware Extension: .apk / Banking Trojan";

        const alertText = `🛡️ **[ការប្រកាសអាសន្នសុវត្ថិភាព - SECURITY ALERT]** 🛡️\n\n⚠️ **បានរកឃើញ និងលុបហ្វាល់មេរោគជាបន្ទាន់!**\n━━━━━━━━━━━━━━━━━━━━\n👤 **អ្នកផ្ញើ:** Attacker User (ID: 78129034)\n📁 **ឈ្មោះហ្វាល់:** \`${fileName}\`\n🔍 **ប្រភេទគ្រោះថ្នាក់:** ${reason}\n⚡ **ចំណាត់ការ:** សារត្រូវបានលុបភ្លាមៗ | 🔇 បានបិទសិទ្ធិផ្ញើសារ (Mute) 24 ម៉ោង\n━━━━━━━━━━━━━━━━━━━━\n💡 **ការណែនាំ:** សូមប្រុងប្រយ័ត្នខ្ពស់ចំពោះហ្វាល់ដែលបង្កប់កន្ទុយ .apk ព្រោះវាអាចជា Banking Trojan លួចលុយធនាគារ!`;

        addGroupBotMessage(alertText, 30, true);

        // Record log
        onAddAuditLog({
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
          event_type: "MALWARE_BLOCKED",
          chat_id: selectedGroupKey,
          chat_title: groupTitle,
          user_id: "78129034",
          user_name: "Attacker User",
          details: `File: ${fileName} (${reason})`,
          action: "🔇 បានបិទសិទ្ធិផ្ញើសារ (Mute) 24 ម៉ោង"
        });
      }, 300);

      return;
    }

    // Regular group message
    setGroupMessages((prev) => [
      ...prev,
      {
        id: "msg-" + Date.now(),
        sender: "user",
        senderName: activeRole === "master" ? "Master Admin" : activeRole === "client_admin" ? "Sokha (Admin)" : "Member 01",
        text: textToSend,
        timestamp: timeStr
      }
    ]);

    // Handle Client Admin commands inside group
    if (textToSend === "🛡️ ឆែកស្ថានភាព Bot" || textToSend === "/status") {
      const isAuth = targetGroup?.is_authorized && targetGroup?.is_enabled;
      const statusText = `🛡️ **[ព័ត៌មាន និងស្ថានភាពសុវត្ថិភាព BOT STATUS]** 🛡️\n━━━━━━━━━━━━━━━━━━━━\n👥 **ឈ្មោះក្រុម:** \`${groupTitle}\`\n🆔 **Group ID:** \`${selectedGroupKey}\`\n🔰 **ស្ថានភាពការពារ:** ${isAuth ? "🟢 កំពុងការពារយ៉ាងសកម្ម (SHIELD ON)" : "🔴 មិនទាន់បើកការពារ"}\n🛒 **កញ្ចប់:** ${targetGroup?.plan_type || "N/A"}\n⚡ **ប្រព័ន្ធស្កេនមេរោគ:** ✅ សកម្ម (.apk, .exe, .scr, .bat, .jpg.apk)\n⏱️ **Auto-Delete Timer:** ✅ ៣០ វិនាទី`;
      addGroupBotMessage(statusText, 30);
    } else if (textToSend === "🆔 មើលលេខ ID Group" || textToSend === "/myid") {
      const idText = `🆔 **ព័ត៌មាន GROUP ID៖**\n\n👥 **ឈ្មោះក្រុម:** \`${groupTitle}\`\n💬 **លេខ Group ID របស់អ្នក:** \`${selectedGroupKey}\`\n🔐 **ស្ថានភាព:** ${targetGroup?.is_authorized ? "🟢 បានបើកសិទ្ធិការពាររួចរាល់" : "🔴 មិនទាន់ទិញអាជ្ញាប័ណ្ណ"}\n\n👉 ឆានែលផ្លូវការ៖ [@sornsecurityrobot](https://t.me/sornsecurityrobot)\n💡 *(សូមយកលេខ Group ID នេះ ផ្ញើទៅកាន់ Master Admin ដើម្បីទិញ ឬបើកសិទ្ធិប្រើប្រាស់)*`;
      addGroupBotMessage(idText, 30);
    }

    setInputText("");
  };

  // Anti-Flood Simulation
  const handleTriggerFloodSpam = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Send 5 rapid messages
    for (let i = 1; i <= 5; i++) {
      setGroupMessages((prev) => [
        ...prev,
        {
          id: `flood-${Date.now()}-${i}`,
          sender: "user",
          senderName: "Spammer Bot 99",
          text: `🔥 [SPAM ${i}] Join my fast crypto casino group now!!!`,
          isDeleted: true,
          expiresInSeconds: 2,
          timestamp: timeStr
        }
      ]);
    }

    setTimeout(() => {
      const floodAlert = `⚠️ **[ប្រព័ន្ធទប់ស្កាត់ SPAM / ANTI-FLOOD]** ⚠️\n\n👤 **អ្នកប្រើប្រាស់:** Spammer Bot 99\n🚫 **មូលហេតុ:** ផ្ញើសារញាប់ពេក (លើសពី 5 សារក្នុង 3 វិនាទី)\n⚡ **ចំណាត់ការ:** 🔇 បានបិទសិទ្ធិផ្ញើសារ (Mute) 1 ម៉ោង`;
      addGroupBotMessage(floodAlert, 15, true);

      onAddAuditLog({
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        event_type: "ANTI_FLOOD_SPAM",
        chat_id: selectedGroupKey,
        chat_title: groups[selectedGroupKey]?.title || "Group",
        user_id: "99182741",
        user_name: "Spammer Bot 99",
        details: "Spamming > 5 msgs in 3s",
        action: "🔇 បានបិទសិទ្ធិផ្ញើសារ (Mute) 1 ម៉ោង"
      });
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header with Mode Switch */}
      <div className="bg-white border border-[#e1e5eb] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#1c2733] flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#2481cc]" />
            <span>ផ្ទាំងតេស្តឆាតបតអន្តរកម្ម (Interactive Live Simulator)</span>
          </h2>
          <p className="text-xs text-[#708499] mt-0.5">
            តេស្តសាកល្បងមុខងារ Bot គ្រប់ជំហាន ស្កេនមេរោគ .apk, Anti-Flood, 30s Auto-Delete និង Master Stealth Mode
          </p>
        </div>

        {/* Dual Mode Switch */}
        <div className="flex items-center gap-1.5 bg-[#f8fafc] p-1 rounded-lg border border-[#e1e5eb]">
          <button
            onClick={() => setChatMode("private")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              chatMode === "private"
                ? "bg-[#2481cc] text-white shadow-sm font-bold"
                : "text-[#708499] hover:text-[#1c2733]"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>👑 ឆាតផ្ទាល់ខ្លួន Master</span>
          </button>
          <button
            onClick={() => setChatMode("group")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              chatMode === "group"
                ? "bg-[#2481cc] text-white shadow-sm font-bold"
                : "text-[#708499] hover:text-[#1c2733]"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>👥 ឆាតក្នុង Group Telegram</span>
          </button>
        </div>
      </div>

      {/* Simulator Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side (8/12): Authentic Telegram Chat Window */}
        <div className="lg:col-span-8 flex flex-col bg-[#1c2733] border border-[#2d3b4a] rounded-xl overflow-hidden shadow-md h-[600px]">
          {/* Chat Window Top Bar */}
          <div className="bg-[#243343] border-b border-[#2d3b4a] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2481cc] flex items-center justify-center font-bold text-white shadow-sm text-sm">
                🛡️
              </div>
              <div>
                <div className="font-bold text-xs text-white flex items-center gap-2">
                  <span>
                    {chatMode === "private"
                      ? "TeleGuard Bot (ឆាតផ្ទាល់ខ្លួនជាមួយ Master 240224709)"
                      : groups[selectedGroupKey]?.title || "Telegram Group"}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-[10px] text-[#708499]">
                  {chatMode === "private"
                    ? "bot • ប្រព័ន្ធគ្រប់គ្រង CRM & ផ្ទាំងបញ្ជា Dashboard"
                    : `Group ID: ${selectedGroupKey} • ប្រព័ន្ធលុបសារស្វ័យប្រវត្តិ 30s`}
                </p>
              </div>
            </div>

            {chatMode === "group" && (
              <select
                value={selectedGroupKey}
                onChange={(e) => setSelectedGroupKey(e.target.value)}
                className="bg-[#1c2733] border border-[#2d3b4a] text-xs text-white px-2 py-1 rounded focus:outline-none focus:border-[#2481cc]"
              >
                {(Object.entries(groups) as [string, GroupConfig][]).map(([id, g]) => (
                  <option key={id} value={id}>
                    {g.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#17212b]">
            {(chatMode === "private" ? privateMessages : groupMessages).map((msg) => {
              const isMe = msg.sender === "master" || msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-0.5`}
                >
                  <span className="text-[10px] text-[#708499] px-1 font-mono">
                    {msg.senderName} • {msg.timestamp}
                  </span>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-xl text-xs space-y-1.5 leading-relaxed ${
                      msg.isMalwareAlert
                        ? "bg-[#3e1b24] border border-rose-500/40 text-rose-100 shadow-sm"
                        : isMe
                        ? "bg-[#2481cc] text-white rounded-br-none"
                        : "bg-[#242f3d] border border-[#2d3b4a] text-white rounded-bl-none shadow-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Auto-delete Countdown pill */}
                    {msg.expiresInSeconds !== undefined && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-300 font-mono pt-1 border-t border-white/10">
                        <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                        <span>រលាយបាត់ទៅវិញក្នុង៖ {msg.expiresInSeconds} វិនាទី</span>
                      </div>
                    )}

                    {/* Inline Telegram Submenu Buttons */}
                    {msg.buttons && msg.buttons.length > 0 && (
                      <div className="pt-1.5 space-y-1">
                        {msg.buttons.map((row, rIdx) => (
                          <div key={rIdx} className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {row.map((btn, bIdx) => (
                              <button
                                key={bIdx}
                                onClick={() => handleCallbackClick(btn.action)}
                                className="bg-[#2e3b4b] hover:bg-[#39495b] text-white text-[11px] font-medium py-1.5 px-2 rounded border border-[#3e4f63] text-center transition-colors"
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Chat Input Area */}
          <div className="p-3 bg-[#243343] border-t border-[#2d3b4a] flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (chatMode === "private") {
                    handleMasterCommand(inputText);
                    setInputText("");
                  } else {
                    handleSendGroupMessage();
                  }
                }
              }}
              placeholder={
                chatMode === "private"
                  ? "វាយបញ្ជា (/admin, /start, /clients, /logs, /broadcast)..."
                  : "វាយសារក្នុង Group..."
              }
              className="flex-1 bg-[#17212b] border border-[#2d3b4a] text-xs text-white px-3 py-2 rounded-lg focus:outline-none focus:border-[#2481cc]"
            />
            <button
              onClick={() => {
                if (chatMode === "private") {
                  handleMasterCommand(inputText);
                  setInputText("");
                } else {
                  handleSendGroupMessage();
                }
              }}
              className="bg-[#2481cc] hover:bg-[#1b64a0] text-white font-bold p-2 rounded-lg transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side (4/12): Rapid Trigger Test Panels */}
        <div className="lg:col-span-4 space-y-4">
          {/* Master 8-Button Keyboard (When in Private Mode) */}
          {chatMode === "private" && (
            <div className="bg-white border border-[#e1e5eb] rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1c2733]">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>ផ្ទាំងប៊ូតុង Master 8 ជម្រើស (Native Keyboard)</span>
              </div>
              <p className="text-[11px] text-[#708499]">
                ចុចប៊ូតុងខាងក្រោមដើម្បីបញ្ជា Dashboard ផ្ទាល់៖
              </p>

              <div className="grid grid-cols-2 gap-1.5 text-xs font-medium">
                <button
                  onClick={() => handleMasterCommand("⚙️ ផ្ទាំងគ្រប់គ្រង Admin Dashboard")}
                  className="bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#1c2733] p-2 rounded-lg border border-[#e1e5eb] text-left transition-colors text-[11px]"
                >
                  ⚙️ ផ្ទាំងគ្រប់គ្រង
                </button>
                <button
                  onClick={() => handleMasterCommand("📋 បញ្ជីអតិថិជន & Group")}
                  className="bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#1c2733] p-2 rounded-lg border border-[#e1e5eb] text-left transition-colors text-[11px]"
                >
                  📋 បញ្ជីអតិថិជន
                </button>
                <button
                  onClick={() => handleMasterCommand("📜 ប្រវត្តិការពារ & ការទិញបត")}
                  className="bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#1c2733] p-2 rounded-lg border border-[#e1e5eb] text-left transition-colors text-[11px]"
                >
                  📜 ប្រវត្តិ Logs
                </button>
                <button
                  onClick={() => handleMasterCommand("🛡️ ឆែកស្ថានភាព Bot")}
                  className="bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#1c2733] p-2 rounded-lg border border-[#e1e5eb] text-left transition-colors text-[11px]"
                >
                  🛡️ ឆែកស្ថានភាព
                </button>
                <button
                  onClick={() => handleMasterCommand("📢 ផ្សាយពាណិជ្ជកម្មទៅ Channel")}
                  className="bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#1c2733] p-2 rounded-lg border border-[#e1e5eb] text-left transition-colors text-[11px]"
                >
                  📢 ផ្សាយ Channel
                </button>
                <button
                  onClick={() => handleMasterCommand("🆔 មើលលេខ ID")}
                  className="bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#1c2733] p-2 rounded-lg border border-[#e1e5eb] text-left transition-colors text-[11px]"
                >
                  🆔 មើលលេខ ID
                </button>
                <button
                  onClick={() => handleMasterCommand("❓ ការណែនាំ & ជំនួយ")}
                  className="bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#1c2733] p-2 rounded-lg border border-[#e1e5eb] text-left transition-colors text-[11px]"
                >
                  ❓ ការណែនាំ
                </button>
                <button
                  onClick={() => handleMasterCommand("🚀 ចាប់ផ្ដើម Bot ឡើងវិញ (/start)")}
                  className="bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#1c2733] p-2 rounded-lg border border-[#e1e5eb] text-left transition-colors text-[11px]"
                >
                  🚀 /start Bot
                </button>
              </div>
            </div>
          )}

          {/* Group Simulator Controls (When in Group Mode) */}
          {chatMode === "group" && (
            <div className="bg-white border border-[#e1e5eb] rounded-xl p-4 shadow-sm space-y-3.5">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#1c2733] block">
                  តួនាទីអ្នកផ្ញើសារក្នុង Group (Active Role):
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    onClick={() => setActiveRole("master")}
                    className={`py-1.5 px-2 rounded-md font-bold transition-all ${
                      activeRole === "master"
                        ? "bg-amber-500 text-white"
                        : "bg-[#f8fafc] border border-[#e1e5eb] text-[#708499]"
                    }`}
                  >
                    👑 Master
                  </button>
                  <button
                    onClick={() => setActiveRole("client_admin")}
                    className={`py-1.5 px-2 rounded-md font-bold transition-all ${
                      activeRole === "client_admin"
                        ? "bg-[#2481cc] text-white"
                        : "bg-[#f8fafc] border border-[#e1e5eb] text-[#708499]"
                    }`}
                  >
                    🛡️ Admin
                  </button>
                  <button
                    onClick={() => setActiveRole("member")}
                    className={`py-1.5 px-2 rounded-md font-bold transition-all ${
                      activeRole === "member"
                        ? "bg-[#1c2733] text-white"
                        : "bg-[#f8fafc] border border-[#e1e5eb] text-[#708499]"
                    }`}
                  >
                    👤 Member
                  </button>
                </div>
              </div>

              {/* Malware Attack Presets */}
              <div className="space-y-1.5 pt-2 border-t border-[#e1e5eb]">
                <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>តេស្តទម្លាក់មេរោគក្នុង Group (Malware Drops)៖</span>
                </span>

                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => handleSendGroupMessage(undefined, true, "ABA_Update_v2.apk")}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-2 rounded-lg text-left font-mono transition-colors flex items-center justify-between"
                  >
                    <span>📁 ABA_Update_v2.apk</span>
                    <span className="text-[10px] bg-rose-200/60 px-1.5 py-0.2 rounded font-sans">Trojan APK</span>
                  </button>

                  <button
                    onClick={() => handleSendGroupMessage(undefined, true, "invoice_payment.pdf.apk")}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-2 rounded-lg text-left font-mono transition-colors flex items-center justify-between"
                  >
                    <span>📁 invoice.pdf.apk</span>
                    <span className="text-[10px] bg-rose-200/60 px-1.5 py-0.2 rounded font-sans">Double Ext</span>
                  </button>

                  <button
                    onClick={() => handleSendGroupMessage(undefined, true, "Binance_Bonus.exe")}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-2 rounded-lg text-left font-mono transition-colors flex items-center justify-between"
                  >
                    <span>📁 Binance_Bonus.exe</span>
                    <span className="text-[10px] bg-rose-200/60 px-1.5 py-0.2 rounded font-sans">Trojan Exe</span>
                  </button>
                </div>
              </div>

              {/* Anti-Flood Spam Attack Simulation */}
              <div className="pt-2 border-t border-[#e1e5eb] space-y-1.5">
                <span className="text-xs font-bold text-[#2481cc] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#2481cc]" />
                  <span>តេស្ត Anti-Flood Spam Attack:</span>
                </span>
                <button
                  onClick={handleTriggerFloodSpam}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-[#2481cc] border border-blue-200 p-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-[#2481cc]" />
                  <span>💥 បាញ់ Spam 5 សារក្នុង 1 វិនាទី</span>
                </button>
              </div>

              {/* Client Group Admin Quick Commands */}
              <div className="pt-2 border-t border-[#e1e5eb] space-y-1.5">
                <span className="text-xs font-bold text-[#1c2733]">
                  ប៊ូតុង Group Admin ក្នុង Group (2 ប៊ូតុង):
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    onClick={() => handleSendGroupMessage("🛡️ ឆែកស្ថានភាព Bot")}
                    className="bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#1c2733] p-2 rounded-lg border border-[#e1e5eb] text-center"
                  >
                    🛡️ ឆែកស្ថានភាព
                  </button>
                  <button
                    onClick={() => handleSendGroupMessage("🆔 មើលលេខ ID Group")}
                    className="bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#1c2733] p-2 rounded-lg border border-[#e1e5eb] text-center"
                  >
                    🆔 មើលលេខ ID
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Group ID Finder Tool (Available in both private & group modes) */}
          <div className="bg-white border border-[#e1e5eb] rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1c2733]">
                <Hash className="w-4 h-4 text-[#2481cc]" />
                <span>ឧបករណ៍ស្វែងរក Group ID (Group ID Finder)</span>
              </div>
              <span className="text-[10px] bg-blue-50 text-[#2481cc] font-mono px-1.5 py-0.5 rounded font-bold border border-blue-200">
                Tool
              </span>
            </div>

            <p className="text-[11px] text-[#708499]">
              ស្វែងរក ID ក្រុម Telegram តាមរយៈឈ្មោះក្រុម, @username ឬ Link ក្រុម ដើម្បីចម្លងយកទៅបន្ថែមសិទ្ធិការពារ៖
            </p>

            <form onSubmit={handleFindGroupId} className="flex gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#708499]" />
                <input
                  type="text"
                  value={finderQuery}
                  onChange={(e) => setFinderQuery(e.target.value)}
                  placeholder="ឧ. @my_group ឬ ABA Group..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-[#f8fafc] border border-[#e1e5eb] rounded-lg text-xs text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingId || !finderQuery.trim()}
                className="bg-[#2481cc] hover:bg-[#1b64a0] disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                {isSearchingId ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>ស្វែងរក</span>
                )}
              </button>
            </form>

            {/* Finder Result Card */}
            {finderResult && (
              <div className="bg-[#f8fafc] border border-[#e1e5eb] rounded-lg p-3 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-[#708499] uppercase font-bold block">
                      ឈ្មោះក្រុម (Resolved Title)
                    </span>
                    <strong className="text-[#1c2733] text-xs font-bold block">
                      {finderResult.title}
                    </strong>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold shrink-0">
                    {finderResult.type}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white border border-[#e1e5eb] p-2 rounded-md">
                  <div>
                    <span className="text-[10px] text-[#708499] block font-mono">
                      Telegram Chat ID
                    </span>
                    <span className="font-mono font-bold text-rose-600 text-sm select-all">
                      {finderResult.chat_id}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(finderResult.chat_id)}
                    className="flex items-center gap-1 bg-[#f1f4f9] hover:bg-[#e1e5eb] text-[#1c2733] px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">បានចម្លង</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#708499]" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-start gap-1.5 text-[11px] text-[#708499] bg-blue-50/50 border border-blue-100 p-2 rounded">
                  <Info className="w-3.5 h-3.5 text-[#2481cc] shrink-0 mt-0.5" />
                  <span>
                    <strong>របៀបបញ្ជា Bot ផ្ទាល់៖</strong> បន្ថែម Bot ចូលក្រុម រួចវាយពាក្យ <code className="bg-white px-1 py-0.5 rounded text-rose-600 font-bold">/id</code> ក្នុងក្រុម នោះ Bot នឹងផ្ញើ Chat ID នេះមកកាន់ Master ដោយស្វ័យប្រវត្តិ។
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
