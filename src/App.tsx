import React, { useState, useEffect, useRef } from "react";
import { GroupConfig, ClientCRM, SecurityAuditLog, BotSettings, SystemHealthInfo } from "./types";
import { Navbar } from "./components/Navbar";
import { DashboardOverview } from "./components/DashboardOverview";
import { GroupManager } from "./components/GroupManager";
import { ClientCRMView } from "./components/ClientCRMView";
import { SecurityLogsView } from "./components/SecurityLogsView";
import { MalwareScannerLab } from "./components/MalwareScannerLab";
import { BotSimulator } from "./components/BotSimulator";
import { ChannelBroadcast } from "./components/ChannelBroadcast";
import { BotCodeHub } from "./components/BotCodeHub";
import { SettingsView } from "./components/SettingsView";
import { SystemHealthIndicator } from "./components/SystemHealthIndicator";
import { SecurityScoreBadge } from "./components/SecurityScoreBadge";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import {
  Shield,
  Search,
  Bell,
  RefreshCw,
  Menu,
  X,
  Radio,
  Terminal,
  ShieldAlert,
  Users,
  FileText,
  Bug,
  Send,
  Sliders,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Keyboard
} from "lucide-react";

const DEFAULT_FALLBACK_SETTINGS: BotSettings = {
  mute_duration_hours: 24,
  punishment_mode: "MUTE",
  anti_flood_enabled: true,
  flood_max_msgs: 5,
  flood_window_seconds: 3,
  flood_mute_hours: 1,
  bot_msg_delete_seconds: 30,
  auto_delete_service_msgs: true,
  detect_double_extension: true,
  custom_blocked_extensions: [
    ".apk", ".xapk", ".aab", ".exe", ".scr", ".bat", ".cmd", ".msi", ".com",
    ".pif", ".hta", ".cpl", ".sh", ".bash", ".ps1", ".psm1", ".vbs", ".vbe",
    ".js", ".jse", ".wsf", ".jar", ".reg"
  ],
  virustotal_api_key: "",
  super_admin_id: "240224709",
  channel_target: "@sornsecurityrobot",
  notifications_enabled: true,
  cleanup_interval_days: 30
};

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [groups, setGroups] = useState<Record<string, GroupConfig>>({});
  const [clients, setClients] = useState<Record<string, ClientCRM>>({});
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [settings, setSettings] = useState<BotSettings>(DEFAULT_FALLBACK_SETTINGS);
  const [healthInfo, setHealthInfo] = useState<SystemHealthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [toastMessage, setToastMessage] = useState<{ title: string; body: string } | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Check initial notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Browser Notification Trigger Helper
  const triggerBrowserNotification = (title: string, body: string) => {
    // Show in-app toast banner as well
    setToastMessage({ title, body });
    setTimeout(() => setToastMessage(null), 5000);

    // If browser notifications supported and granted
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          const notif = new Notification(title, {
            body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: "teleguard-threat-alert"
          });
          notif.onclick = () => {
            window.focus();
            setActiveTab("logs");
          };
        } catch (e) {
          console.warn("Notification error:", e);
        }
      }
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === "granted") {
          triggerBrowserNotification(
            "🔔 ប្រព័ន្ធជូនដំណឹង TeleGuard បានបើក",
            "អ្នកនឹងទទួលបានសារប្រកាសអាសន្នភ្លាមៗនៅពេលរកឃើញមេរោគ ឬការវាយប្រហារថ្មី។"
          );
        }
      } catch (err) {
        console.error("Failed to request notification permission:", err);
      }
    }
  };

  const handleTestNotification = () => {
    triggerBrowserNotification(
      "🚨 ការពារបានជោគជ័យ៖ រកឃើញមេរោគ .apk!",
      "បានលុប Trojan: Telegram_ABA_Hack.apk និងបាន Mute គណនីល្មើស ២៤ ម៉ោង។"
    );
  };

  // Fetch all initial data + settings + health
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [groupsRes, clientsRes, logsRes, settingsRes, healthRes] = await Promise.all([
        fetch("/api/groups").then((r) => r.json()).catch(() => ({})),
        fetch("/api/clients").then((r) => r.json()).catch(() => ({})),
        fetch("/api/logs").then((r) => r.json()).catch(() => []),
        fetch("/api/settings").then((r) => r.json()).catch(() => DEFAULT_FALLBACK_SETTINGS),
        fetch("/api/system-health").then((r) => r.json()).catch(() => null)
      ]);
      setGroups(groupsRes || {});
      setClients(clientsRes || {});
      setLogs(logsRes || []);
      if (settingsRes && typeof settingsRes === "object") {
        setSettings(settingsRes);
      }
      if (healthRes && typeof healthRes === "object") {
        setHealthInfo(healthRes);
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync Dark Mode with Document Element
  useEffect(() => {
    if (settings.dark_mode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.dark_mode]);

  // Global Keyboard Shortcuts (Ctrl+G, Ctrl+L, Ctrl+O, Ctrl+S, Ctrl+M, Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && (e.key === "k" || e.key === "K") || e.key === "?" || e.key === "F1") {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === "Escape") {
        setShowShortcutsModal(false);
      } else if (isCtrlOrCmd && (e.key === "g" || e.key === "G")) {
        e.preventDefault();
        setActiveTab("groups");
        setToastMessage({
          title: "⌨️ Keyboard Shortcut (Ctrl+G)",
          body: "បានប្តូរទៅកាន់ផ្ទាំងគ្រប់គ្រងក្រុម (Group Manager)"
        });
      } else if (isCtrlOrCmd && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        setActiveTab("logs");
        setToastMessage({
          title: "⌨️ Keyboard Shortcut (Ctrl+L)",
          body: "បានប្តូរទៅកាន់ផ្ទាំងកំណត់ត្រាសន្តិសុខ (Security Audit Logs)"
        });
      } else if (isCtrlOrCmd && (e.key === "o" || e.key === "O")) {
        e.preventDefault();
        setActiveTab("overview");
        setToastMessage({
          title: "⌨️ Keyboard Shortcut (Ctrl+O)",
          body: "បានប្តូរទៅកាន់ផ្ទាំងទិដ្ឋភាពទូទៅ (Dashboard Overview)"
        });
      } else if (isCtrlOrCmd && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        setActiveTab("settings");
        setToastMessage({
          title: "⌨️ Keyboard Shortcut (Ctrl+S)",
          body: "បានប្តូរទៅកាន់ផ្ទាំងការកំណត់ប្រព័ន្ធ (Bot Settings)"
        });
      } else if (isCtrlOrCmd && (e.key === "m" || e.key === "M")) {
        e.preventDefault();
        setActiveTab("simulator");
        setToastMessage({
          title: "⌨️ Keyboard Shortcut (Ctrl+M)",
          body: "បានប្តូរទៅកាន់ផ្ទាំងតេស្តសាកល្បង (Live Bot Simulator)"
        });
      } else if (isCtrlOrCmd && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        setActiveTab("broadcast");
        setToastMessage({
          title: "⌨️ Keyboard Shortcut (Ctrl+B)",
          body: "បានប្តូរទៅកាន់ផ្ទាំងផ្សាយពាណិជ្ជកម្ម (Channel Broadcast)"
        });
      } else if (isCtrlOrCmd && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        const nextDarkMode = !settings.dark_mode;
        const updated = { ...settings, dark_mode: nextDarkMode };
        setSettings(updated);
        handleSaveSettings(updated);
        setToastMessage({
          title: `⌨️ Theme Toggle (Ctrl+D)`,
          body: `បានប្តូរទៅ ${nextDarkMode ? "Dark Mode (Night Monitoring)" : "Light Mode"}`
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settings]);

  // Save Settings to Backend API
  const handleSaveSettings = async (newSettings: BotSettings): Promise<boolean> => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to save settings:", err);
      return false;
    }
  };

  // Handle Group Action (add days, lifetime, revoke, toggle, delete, clear_all, direct_add)
  const handleGroupAction = async (groupId: string, action: string, payload?: any) => {
    setIsLoading(true);
    try {
      if (action === "clear_all") {
        const res = await fetch("/api/groups/clear-all", { method: "POST" });
        await res.json();
        setToastMessage({
          title: "🗑️ បានលុប Group ទាំងអស់",
          body: "ទិន្នន័យក្រុមចាស់ៗទាំងអស់ត្រូវបានសម្អាតចេញពីប្រព័ន្ធដោយជោគជ័យ។"
        });
      } else if (action === "sync_from_telegram") {
        const res = await fetch("/api/groups/sync-from-telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ manualInput: payload?.manualInput })
        });
        const syncData = await res.json();
        setToastMessage({
          title: syncData.newly_imported_count > 0 ? "🎉 បាន Sync ក្រុមដោយជោគជ័យ" : "✅ បាន Sync ពិនិត្យបញ្ជីក្រុមរួចរាល់",
          body: syncData.message || `បានរកឃើញ ${syncData.total_discovered || 0} ក្រុម។`
        });
        if (payload?.onComplete) {
          payload.onComplete(syncData);
        }
      } else {
        const res = await fetch(`/api/groups/${groupId}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...(payload || {}) })
        });
        await res.json();
        if (action === "delete") {
          setToastMessage({
            title: "🗑️ បានលុប Group",
            body: `Group ID ${groupId} ត្រូវបានលុបចេញពីប្រព័ន្ធដោយជោគជ័យ។`
          });
        } else if (action === "direct_add") {
          setToastMessage({
            title: "✅ បានបន្ថែម Group ថ្មី",
            body: `Group "${payload?.title || groupId}" ត្រូវបានបន្ថែម និងកំណត់អាជ្ញាប័ណ្ណជោគជ័យ។`
          });
        } else if (action === "approve_trial_7d" || action === "add_trial_7d") {
          setToastMessage({
            title: "🎁 បានអនុញ្ញាតប្រើសាកល្បង ៧ ថ្ងៃ",
            body: `Group ID ${groupId} ទទួលបានអាជ្ញាប័ណ្ណសាកល្បងឥតគិតថ្លៃរយៈពេល ៧ ថ្ងៃដោយជោគជ័យ!`
          });
        } else if (action === "set_lifetime") {
          setToastMessage({
            title: "👑 បានកំណត់ Lifetime VIP",
            body: `Group ID ${groupId} ត្រូវបានដំឡើងជា VIP ពេញមួយជីវិត!`
          });
        } else if (action === "add_days") {
          setToastMessage({
            title: `➕ បានបន្ថែម ${payload?.days || 30} ថ្ងៃ`,
            body: `បានពន្យារអាជ្ញាប័ណ្ណចំនួន ${payload?.days || 30} ថ្ងៃសម្រាប់ Group ID ${groupId}!`
          });
        } else if (action === "revoke") {
          setToastMessage({
            title: "🔴 បានដកសិទ្ធិ (Revoked)",
            body: `បានផ្អាកសិទ្ធិប្រើប្រាស់សម្រាប់ Group ID ${groupId}!`
          });
        }
      }
      await fetchData();
    } catch (err) {
      console.error("Group action failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add simulated audit event and notify user
  const handleAddSimulatedLog = async (logData?: Partial<SecurityAuditLog>) => {
    try {
      const payload = {
        event_type: logData?.event_type || "MALWARE_BLOCKED",
        chat_id: logData?.chat_id || "-1002458931204",
        chat_title: logData?.chat_title || "VIP Business Community",
        user_id: logData?.user_id || "78129034",
        user_name: logData?.user_name || "Spammer Bot 01",
        details: logData?.details || "File: ABA_Update_v2.apk (🚨 High-Risk Malware Extension: .apk)",
        action:
          logData?.action ||
          (settings.punishment_mode === "MUTE"
            ? `🔇 បានបិទសិទ្ធិផ្ញើសារ (Mute) ${settings.mute_duration_hours} ម៉ោង`
            : settings.punishment_mode === "KICK"
            ? "👢 បានបណ្ដេញចេញពីក្រុម (Kicked)"
            : "🛑 បានបិទគណនីរហូត (Banned)")
      };

      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // Trigger real-time browser notification
      triggerBrowserNotification(
        `🚨 ការគំរាមកំហែងថ្មីត្រូវបានរកឃើញ! (${payload.event_type})`,
        `ក្រុម៖ ${payload.chat_title} • ${payload.details} • ចំណាត់ការ៖ ${payload.action}`
      );

      await fetchData();
    } catch (err) {
      console.error("Failed to post audit log:", err);
    }
  };

  const activeGroupsCount = (Object.values(groups) as GroupConfig[]).filter(
    (g) => g.is_authorized && g.is_enabled
  ).length;

  return (
    <div className="flex h-screen w-full bg-[#f1f4f9] text-[#1c2733] font-sans overflow-hidden">
      {/* Real-time Threat Toast Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-[#1c2733] border border-rose-500/50 text-white p-4 rounded-xl shadow-2xl animate-bounce duration-300 flex items-start gap-3">
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-rose-300 truncate">{toastMessage.title}</h4>
              <button
                onClick={() => setToastMessage(null)}
                className="text-[#8a9fb5] hover:text-white text-xs ml-2"
              >
                ×
              </button>
            </div>
            <p className="text-[11px] text-[#cfd8dc] mt-1 leading-snug">{toastMessage.body}</p>
            <button
              onClick={() => {
                setActiveTab("logs");
                setToastMessage(null);
              }}
              className="mt-2 text-[10px] text-[#64b5f6] hover:underline font-semibold"
            >
              មើលកំណត់ត្រាសន្តិសុខ →
            </button>
          </div>
        </div>
      )}

      {/* Desktop Left Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onRefresh={fetchData}
          isLoading={isLoading}
          totalThreats={logs.length}
          onOpenHelp={() => setShowShortcutsModal(true)}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10">
            <Navbar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
              }}
              onRefresh={fetchData}
              isLoading={isLoading}
              totalThreats={logs.length}
              onOpenHelp={() => {
                setShowShortcutsModal(true);
                setMobileMenuOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-[#e1e5eb] px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-[#708499] hover:text-[#1c2733] hover:bg-[#f1f4f9] rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#1c2733]">
                ប្រព័ន្ធគ្រប់គ្រងសន្តិសុខ TeleGuard (Master Hub)
              </span>
              <span className="hidden sm:inline-block text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                🟢 {activeGroupsCount} ក្រុមសកម្ម
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Real-time Security Score Badge */}
            <SecurityScoreBadge logs={logs} groups={groups} />

            {/* System Health Indicator (Telegram API + VirusTotal) */}
            <SystemHealthIndicator
              healthInfo={healthInfo}
              isLoading={isLoading}
              onRefreshHealth={fetchData}
            />

            {/* Quick Notification Permission Bell */}
            <button
              onClick={
                notificationPermission === "granted"
                  ? handleTestNotification
                  : handleRequestNotificationPermission
              }
              title={
                notificationPermission === "granted"
                  ? "Notification បានបើក (ចុចដើម្បីតេស្ត)"
                  : "ចុចដើម្បីបើកសិទ្ធិ Browser Notification"
              }
              className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs ${
                notificationPermission === "granted"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-medium">
                {notificationPermission === "granted" ? "Notification សកម្ម" : "បើក Notification"}
              </span>
            </button>

            {/* Help & Keyboard Shortcuts Modal Trigger Button */}
            <button
              onClick={() => setShowShortcutsModal(true)}
              title="ជំនួយ & ផ្លូវកាត់ក្តារចុច (Ctrl+K / ?)"
              className="p-2 rounded-lg border border-[#e1e5eb] text-[#708499] hover:text-[#1c2733] hover:bg-[#f1f4f9] transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#2481cc]" />
              <span className="hidden sm:inline">Help</span>
              <kbd className="hidden lg:inline-block text-[10px] font-mono px-1 py-0.2 bg-gray-100 text-[#708499] border border-gray-200 rounded">
                Ctrl+K
              </kbd>
            </button>

            {/* Quick Settings Shortcut */}
            <button
              onClick={() => setActiveTab("settings")}
              title="កំណត់ការកំណត់ប្រព័ន្ធ"
              className={`p-2 rounded-lg border transition-colors flex items-center gap-1 text-xs ${
                activeTab === "settings"
                  ? "bg-[#2481cc] text-white border-[#2481cc]"
                  : "text-[#708499] hover:text-[#1c2733] hover:bg-[#f1f4f9] border-[#e1e5eb]"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Settings</span>
            </button>

            <div className="hidden md:flex items-center text-xs text-[#708499] bg-[#f1f4f9] px-2.5 py-1.5 rounded-lg border border-[#e1e5eb] font-mono">
              <span>Owner:</span>
              <span className="font-bold text-[#1c2733] ml-1">240224709</span>
            </div>

            <button
              onClick={fetchData}
              disabled={isLoading}
              title="ទាញយកទិន្នន័យឡើងវិញ"
              className="p-2 text-[#708499] hover:text-[#1c2733] hover:bg-[#f1f4f9] rounded-lg border border-[#e1e5eb] transition-colors flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#2481cc]" : ""}`} />
              <span className="hidden sm:inline">ផ្ទុកឡើងវិញ</span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === "overview" && (
            <DashboardOverview
              groups={groups}
              clients={clients}
              logs={logs}
              settings={settings}
              setActiveTab={setActiveTab}
              onSimulateQuickThreat={() => {
                handleAddSimulatedLog();
                setActiveTab("simulator");
              }}
              onRefreshData={fetchData}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              notificationPermission={notificationPermission}
              onRequestNotificationPermission={handleRequestNotificationPermission}
              onTestNotification={handleTestNotification}
              isDarkMode={settings.dark_mode}
              onToggleDarkMode={(val) => {
                const updated = { ...settings, dark_mode: val };
                setSettings(updated);
                handleSaveSettings(updated);
              }}
              onRefreshAllData={fetchData}
            />
          )}

          {activeTab === "simulator" && (
            <BotSimulator
              groups={groups}
              clients={clients}
              logs={logs}
              onGroupAction={handleGroupAction}
              onAddAuditLog={(log) => handleAddSimulatedLog(log)}
            />
          )}

          {activeTab === "groups" && (
            <GroupManager
              groups={groups}
              clients={clients}
              onGroupAction={handleGroupAction}
              isLoading={isLoading}
            />
          )}

          {activeTab === "clients" && (
            <ClientCRMView clients={clients} onGroupAction={handleGroupAction} />
          )}

          {activeTab === "logs" && (
            <SecurityLogsView
              logs={logs}
              onAddSimulatedLog={() => handleAddSimulatedLog()}
              onRefreshLogs={fetchData}
            />
          )}

          {activeTab === "scanner" && <MalwareScannerLab />}

          {activeTab === "broadcast" && <ChannelBroadcast />}

          {activeTab === "code" && <BotCodeHub />}
        </main>
      </div>

      {/* Global Help & Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setShowShortcutsModal(false);
        }}
      />
    </div>
  );
}
