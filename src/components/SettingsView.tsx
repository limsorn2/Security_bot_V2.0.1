import React, { useState, useEffect, useRef } from "react";
import { BotSettings } from "../types";
import {
  Sliders,
  Shield,
  Save,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Bell,
  Trash2,
  Plus,
  Key,
  Crown,
  Radio,
  RotateCcw,
  Volume2,
  Database,
  Archive,
  RefreshCw,
  Moon,
  Sun,
  Download,
  Upload,
  FileJson,
  Check,
  Laptop
} from "lucide-react";

interface SettingsViewProps {
  settings: BotSettings;
  onSaveSettings: (newSettings: BotSettings) => Promise<boolean>;
  notificationPermission: NotificationPermission;
  onRequestNotificationPermission: () => Promise<void>;
  onTestNotification: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: (enable: boolean) => void;
  onRefreshAllData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  notificationPermission,
  onRequestNotificationPermission,
  onTestNotification,
  isDarkMode,
  onToggleDarkMode,
  onRefreshAllData
}) => {
  const [formData, setFormData] = useState<BotSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newExt, setNewExt] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null);

  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [backupStatusMessage, setBackupStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    const success = await onSaveSettings(formData);
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleAddExtension = () => {
    let clean = newExt.trim().toLowerCase();
    if (!clean) return;
    if (!clean.startsWith(".")) clean = "." + clean;
    if (!formData.custom_blocked_extensions.includes(clean)) {
      setFormData({
        ...formData,
        custom_blocked_extensions: [...formData.custom_blocked_extensions, clean]
      });
    }
    setNewExt("");
  };

  const handleRemoveExtension = (ext: string) => {
    setFormData({
      ...formData,
      custom_blocked_extensions: formData.custom_blocked_extensions.filter((e) => e !== ext)
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm("តើអ្នកពិតជាចង់កំណត់ការកំណត់ទាំងអស់ទៅលំនាំដើម (Default) វិញមែនទេ?")) {
      const defaultData: BotSettings = {
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
        cleanup_interval_days: 30,
        dark_mode: false
      };
      setFormData(defaultData);
    }
  };

  const handleDownloadBackup = async () => {
    setIsExportingBackup(true);
    setBackupStatusMessage(null);
    try {
      const res = await fetch("/api/backup/export");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `TeleGuard_Full_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatusMessage({
        type: "success",
        text: "បានទាញយកឯកសារ Backup ប្រព័ន្ធ (JSON Snapshot) ជោគជ័យ!"
      });
      setTimeout(() => setBackupStatusMessage(null), 4000);
    } catch {
      setBackupStatusMessage({
        type: "error",
        text: "បរាជ័យក្នុងការទាញយក Backup!"
      });
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleRestoreFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backupData = JSON.parse(text);
        if (!backupData || typeof backupData !== "object") {
          throw new Error("Invalid JSON format");
        }

        if (window.confirm("តើអ្នកពិតជាចង់ Restore ទិន្នន័យពីឯកសារ Backup នេះមែនទេ? (ទិន្នន័យបច្ចុប្បន្ននឹងត្រូវជំនួសដោយ Snapshot)")) {
          setIsRestoringBackup(true);
          const res = await fetch("/api/backup/restore", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(backupData)
          }).then((r) => r.json());

          if (res.success) {
            if (backupData.settings) {
              setFormData(backupData.settings);
            }
            if (onRefreshAllData) {
              onRefreshAllData();
            }
            setBackupStatusMessage({
              type: "success",
              text: "បាន Restore ទិន្នន័យទាំងអស់ឡើងវិញជោគជ័យ!"
            });
            setTimeout(() => setBackupStatusMessage(null), 5000);
          } else {
            setBackupStatusMessage({
              type: "error",
              text: res.error || "បរាជ័យក្នុងការ Restore ទិន្នន័យ!"
            });
          }
        }
      } catch {
        setBackupStatusMessage({
          type: "error",
          text: "ឯកសារ JSON មិនត្រឹមត្រូវតាមទម្រង់!"
        });
      } finally {
        setIsRestoringBackup(false);
        if (backupFileInputRef.current) {
          backupFileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#e1e5eb] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#1c2733] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#2481cc]" />
            <span>ផ្ទាំងកំណត់ការកំណត់ប្រព័ន្ធ (Bot System Configuration)</span>
          </h2>
          <p className="text-xs text-[#708499] mt-0.5">
            កែប្រែក្បួនច្បាប់ការពារ Mute Duration, Anti-Flood Threshold, Auto-Clean Timer និង API Keys ដោយផ្ទាល់ក្នុង Dashboard
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-[#708499] hover:text-[#1c2733] hover:bg-[#f1f4f9] border border-[#e1e5eb] flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>កំណត់ឡើងវិញ (Reset)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="flex-1 sm:flex-none bg-[#2481cc] hover:bg-[#1b64a0] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "កំពុងរក្សាទុក..." : "រក្សាទុកការកំណត់ (Save)"}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5 font-medium shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ! បតនឹងប្រើប្រាស់ក្បួនច្បាប់ថ្មីនេះភ្លាមៗ។</span>
        </div>
      )}

      {/* Settings Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Security & Punishment Rules (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Threat Punishment Configuration */}
          <div className="bg-white border border-[#e1e5eb] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#e1e5eb]">
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1c2733]">វិធានការពិន័យចំពោះមេរោគ (Malware Punishment Action)</h3>
                <p className="text-[11px] text-[#708499]">កំណត់ចំណាត់ការនៅពេលរកឃើញ Banking Trojan .apk ឬឯកសារគ្រោះថ្នាក់</p>
              </div>
            </div>

            {/* Punishment Mode Radios */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#1c2733]">ទម្រង់ពិន័យ (Punishment Mode)៖</label>
              <div className="grid grid-cols-3 gap-2">
                <label
                  className={`p-3 rounded-lg border cursor-pointer flex flex-col items-center text-center transition-all ${
                    formData.punishment_mode === "MUTE"
                      ? "bg-[#2481cc]/10 border-[#2481cc] text-[#1c2733] ring-1 ring-[#2481cc]"
                      : "bg-[#f8fafc] border-[#e1e5eb] text-[#708499] hover:border-[#2481cc]/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="punishment_mode"
                    value="MUTE"
                    checked={formData.punishment_mode === "MUTE"}
                    onChange={() => setFormData({ ...formData, punishment_mode: "MUTE" })}
                    className="sr-only"
                  />
                  <Volume2 className="w-4 h-4 text-[#2481cc] mb-1" />
                  <span className="text-xs font-bold">MUTE</span>
                  <span className="text-[10px] text-[#708499] mt-0.5">បិទសិទ្ធិផ្ញើសារ</span>
                </label>

                <label
                  className={`p-3 rounded-lg border cursor-pointer flex flex-col items-center text-center transition-all ${
                    formData.punishment_mode === "KICK"
                      ? "bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500"
                      : "bg-[#f8fafc] border-[#e1e5eb] text-[#708499] hover:border-amber-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="punishment_mode"
                    value="KICK"
                    checked={formData.punishment_mode === "KICK"}
                    onChange={() => setFormData({ ...formData, punishment_mode: "KICK" })}
                    className="sr-only"
                  />
                  <AlertTriangle className="w-4 h-4 text-amber-600 mb-1" />
                  <span className="text-xs font-bold">KICK</span>
                  <span className="text-[10px] text-[#708499] mt-0.5">បណ្ដេញចេញពី Group</span>
                </label>

                <label
                  className={`p-3 rounded-lg border cursor-pointer flex flex-col items-center text-center transition-all ${
                    formData.punishment_mode === "BAN"
                      ? "bg-rose-50 border-rose-500 text-rose-900 ring-1 ring-rose-500"
                      : "bg-[#f8fafc] border-[#e1e5eb] text-[#708499] hover:border-rose-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="punishment_mode"
                    value="BAN"
                    checked={formData.punishment_mode === "BAN"}
                    onChange={() => setFormData({ ...formData, punishment_mode: "BAN" })}
                    className="sr-only"
                  />
                  <Trash2 className="w-4 h-4 text-rose-600 mb-1" />
                  <span className="text-xs font-bold">BAN</span>
                  <span className="text-[10px] text-[#708499] mt-0.5">បិទគណនីរហូត</span>
                </label>
              </div>
            </div>

            {/* Mute Duration input */}
            {formData.punishment_mode === "MUTE" && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-[#1c2733] flex items-center justify-between">
                  <span>រយៈពេល Mute (ម៉ោង) ៖</span>
                  <span className="text-[#2481cc] font-mono font-bold">{formData.mute_duration_hours} ម៉ោង ({Math.round((formData.mute_duration_hours / 24) * 10) / 10} ថ្ងៃ)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={formData.mute_duration_hours}
                    onChange={(e) =>
                      setFormData({ ...formData, mute_duration_hours: Math.max(1, parseInt(e.target.value) || 24) })
                    }
                    className="w-28 bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-xs font-mono text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1, 12, 24, 48, 168].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setFormData({ ...formData, mute_duration_hours: h })}
                        className={`px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors ${
                          formData.mute_duration_hours === h
                            ? "bg-[#2481cc] text-white border-[#2481cc]"
                            : "bg-[#f8fafc] text-[#708499] border-[#e1e5eb] hover:text-[#1c2733]"
                        }`}
                      >
                        {h < 24 ? `${h}h` : `${h / 24}d`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Double Extension Toggle */}
            <div className="pt-3 border-t border-[#e1e5eb] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#1c2733] block">
                  ចាប់ហ្វាល់បន្លំកន្ទុយពីរ (Double Extension Detection)
                </span>
                <span className="text-[11px] text-[#708499]">
                  ស្កេនចាប់ហ្វាល់ដូចជា .pdf.apk, .jpg.apk, .png.exe ជាបន្ទាន់
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.detect_double_extension}
                  onChange={(e) => setFormData({ ...formData, detect_double_extension: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2481cc]"></div>
              </label>
            </div>
          </div>

          {/* Card 2: Anti-Flood & Spam Protection */}
          <div className="bg-white border border-[#e1e5eb] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e5eb]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-[#2481cc] rounded-lg">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1c2733]">ប្រព័ន្ធការពារ Anti-Flood Spam</h3>
                  <p className="text-[11px] text-[#708499]">កំណត់កម្រិតកំណត់ការបាញ់សារញាប់ៗក្នុង Group</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.anti_flood_enabled}
                  onChange={(e) => setFormData({ ...formData, anti_flood_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2481cc]"></div>
              </label>
            </div>

            {formData.anti_flood_enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#1c2733]">
                    កម្រិតកំណត់សារ (Max Msgs)៖
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={formData.flood_max_msgs}
                    onChange={(e) =>
                      setFormData({ ...formData, flood_max_msgs: Math.max(2, parseInt(e.target.value) || 5) })
                    }
                    className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-xs font-mono text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
                  />
                  <span className="text-[10px] text-[#708499]">សារអតិបរមា</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#1c2733]">
                    គម្លាតពេលវេលា (Time Window)៖
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.flood_window_seconds}
                    onChange={(e) =>
                      setFormData({ ...formData, flood_window_seconds: Math.max(1, parseInt(e.target.value) || 3) })
                    }
                    className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-xs font-mono text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
                  />
                  <span className="text-[10px] text-[#708499]">វិនាទី (Seconds)</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#1c2733]">
                    ពិន័យ Mute Spammer៖
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={formData.flood_mute_hours}
                    onChange={(e) =>
                      setFormData({ ...formData, flood_mute_hours: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-xs font-mono text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
                  />
                  <span className="text-[10px] text-[#708499]">ម៉ោង (Hours)</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Auto-Delete & Clean Room Timers */}
          <div className="bg-white border border-[#e1e5eb] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#e1e5eb]">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1c2733]">ប្រព័ន្ធលុបសារស្វ័យប្រវត្តិ (Clean Room Timers)</h3>
                <p className="text-[11px] text-[#708499]">កុំឱ្យសារប្រកាសអាសន្ន ឬសារ Service របស់ Telegram រំខានក្នុង Group</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1c2733] flex items-center justify-between">
                  <span>Auto-Delete Alerts Countdown៖</span>
                  <span className="text-[#2481cc] font-mono font-bold">{formData.bot_msg_delete_seconds} វិនាទី</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={formData.bot_msg_delete_seconds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bot_msg_delete_seconds: Math.max(5, parseInt(e.target.value) || 30)
                      })
                    }
                    className="w-24 bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-xs font-mono text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
                  />
                  <div className="flex items-center gap-1">
                    {[15, 30, 60].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setFormData({ ...formData, bot_msg_delete_seconds: sec })}
                        className={`px-2 py-1 rounded text-[11px] font-medium border ${
                          formData.bot_msg_delete_seconds === sec
                            ? "bg-[#2481cc] text-white border-[#2481cc]"
                            : "bg-[#f8fafc] text-[#708499] border-[#e1e5eb]"
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e1e5eb]">
                <div>
                  <span className="text-xs font-semibold text-[#1c2733] block">
                    លុប Service Messages
                  </span>
                  <span className="text-[10px] text-[#708499]">
                    លុបសារ &quot;User joined&quot; / &quot;User left&quot;
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_delete_service_msgs}
                    onChange={(e) => setFormData({ ...formData, auto_delete_service_msgs: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#2481cc]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Card 4: Audit Logs Cleanup Interval & Database Performance */}
          <div className="bg-white border border-[#e1e5eb] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e5eb]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1c2733]">ការសម្អាតកំណត់ត្រាស្វ័យប្រវត្តិ (Cleanup Interval)</h3>
                  <p className="text-[11px] text-[#708499]">កំណត់ឱ្យ Bot សម្អាត ឬលុប Log ចាស់ៗចោលស្វ័យប្រវត្តិដើម្បីរក្សាល្បឿន Database</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-semibold">
                Auto-Purge
              </span>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#1c2733]">
                រយៈពេលរក្សាទុកទិន្នន័យ (Audit Log Retention Period)៖
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { days: 30, label: "30 ថ្ងៃ", desc: "លុបកំណត់ត្រា > 30 ថ្ងៃ (ណែនាំ)" },
                  { days: 60, label: "60 ថ្ងៃ", desc: "លុបកំណត់ត្រា > 60 ថ្ងៃ" },
                  { days: 90, label: "90 ថ្ងៃ", desc: "លុបកំណត់ត្រា > 90 ថ្ងៃ" },
                  { days: 0, label: "រក្សាទុកទាំងអស់", desc: "មិនលុប Log ឡើយ (Never)" }
                ].map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setFormData({ ...formData, cleanup_interval_days: opt.days })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      (formData.cleanup_interval_days ?? 30) === opt.days
                        ? "border-[#2481cc] bg-[#2481cc]/5 shadow-xs"
                        : "border-[#e1e5eb] bg-[#f8fafc] hover:bg-white text-[#708499]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${
                        (formData.cleanup_interval_days ?? 30) === opt.days ? "text-[#2481cc]" : "text-[#1c2733]"
                      }`}>
                        {opt.label}
                      </span>
                      {(formData.cleanup_interval_days ?? 30) === opt.days && (
                        <CheckCircle className="w-3.5 h-3.5 text-[#2481cc]" />
                      )}
                    </div>
                    <p className="text-[10px] text-[#708499] mt-1 leading-snug">
                      {opt.desc}
                    </p>
                  </button>
                ))}
              </div>

              {/* Manual Purge Action */}
              <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e1e5eb] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mt-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#708499]" />
                  <span className="text-[11px] text-[#1c2733]">
                    ចង់សម្អាត Log ចាស់ៗលើសពី {formData.cleanup_interval_days || 30} ថ្ងៃភ្លាមៗឥឡូវនេះ?
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isPurging}
                  onClick={async () => {
                    const days = formData.cleanup_interval_days || 30;
                    if (window.confirm(`តើអ្នកពិតជាចង់សម្អាត Audit Log ដែលចាស់ជាង ${days} ថ្ងៃចោលឥឡូវនេះមែនទេ?`)) {
                      setIsPurging(true);
                      setPurgeMessage(null);
                      try {
                        const res = await fetch("/api/logs/purge", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ days })
                        }).then((r) => r.json());
                        if (res.success) {
                          setPurgeMessage(res.message);
                          setTimeout(() => setPurgeMessage(null), 4000);
                        }
                      } catch {
                        setPurgeMessage("បរាជ័យក្នុងការសម្អាត Log!");
                      } finally {
                        setIsPurging(false);
                      }
                    }
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isPurging ? "កំពុងសម្អាត..." : "សម្អាតភ្លាមៗ (Purge Now)"}</span>
                </button>
              </div>

              {purgeMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{purgeMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Extensions, Notifications, Credentials (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 4: Blocked Extensions Manager */}
          <div className="bg-white border border-[#e1e5eb] rounded-xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#e1e5eb]">
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1c2733]">បញ្ជីកន្ទុយហ្វាល់គ្រោះថ្នាក់ (Blocked Extensions)</h3>
                <p className="text-[11px] text-[#708499]">ហ្វាល់ណាមានកន្ទុយទាំងនេះ នឹងត្រូវលុបភ្លាម</p>
              </div>
            </div>

            {/* Add Extension Input */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="ឧ. .apk ឬ .scr"
                value={newExt}
                onChange={(e) => setNewExt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddExtension();
                  }
                }}
                className="flex-1 bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-1.5 text-xs font-mono text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
              />
              <button
                type="button"
                onClick={handleAddExtension}
                className="bg-[#2481cc] hover:bg-[#1b64a0] text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>បន្ថែម</span>
              </button>
            </div>

            {/* Badges List */}
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 bg-[#f8fafc] rounded-lg border border-[#e1e5eb]">
              {formData.custom_blocked_extensions.map((ext) => (
                <span
                  key={ext}
                  className="inline-flex items-center gap-1 bg-white border border-rose-200 text-rose-700 font-mono text-[11px] px-2 py-0.5 rounded-md shadow-2xs"
                >
                  <span>{ext}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExtension(ext)}
                    className="text-rose-400 hover:text-rose-700 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Card 5: Real-time Browser Notifications */}
          <div className="bg-white border border-[#e1e5eb] rounded-xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e5eb]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1c2733]">ការជូនដំណឹង Browser Notification</h3>
                  <p className="text-[11px] text-[#708499]">ជូនដំណឹងភ្លាមៗពេលមានការវាយប្រហារ Threat ថ្មី</p>
                </div>
              </div>

              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  notificationPermission === "granted"
                    ? "bg-emerald-100 text-emerald-700"
                    : notificationPermission === "denied"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {notificationPermission}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#708499]">ស្ថានភាព Notification លើ Browser៖</span>
                <span className="font-semibold text-[#1c2733]">
                  {notificationPermission === "granted"
                    ? "🟢 បានអនុញ្ញាត (Enabled)"
                    : notificationPermission === "denied"
                    ? "🔴 ត្រូវបានបិទ (Blocked)"
                    : "🟡 មិនទាន់សួរ (Default)"}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {notificationPermission !== "granted" ? (
                  <button
                    type="button"
                    onClick={onRequestNotificationPermission}
                    className="flex-1 bg-[#2481cc] hover:bg-[#1b64a0] text-white py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>បើកសិទ្ធិ Notification (Allow)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onTestNotification}
                    className="flex-1 bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#1c2733] border border-[#e1e5eb] py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5 text-[#2481cc]" />
                    <span>ធ្វើតេស្តសាកល្បង Notification</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 6: Super Admin & Channel Targets */}
          <div className="bg-white border border-[#e1e5eb] rounded-xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#e1e5eb]">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1c2733]">អត្តសញ្ញាណ Master & Channel</h3>
                <p className="text-[11px] text-[#708499]">កំណត់លេខសម្គាល់ម្ចាស់បត និង Channel ផ្សាយពាណិជ្ជកម្ម</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#1c2733]">
                  Super Admin ID (Sole Master Owner)៖
                </label>
                <input
                  type="text"
                  value={formData.super_admin_id}
                  onChange={(e) => setFormData({ ...formData, super_admin_id: e.target.value })}
                  className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-xs font-mono text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#1c2733]">
                  Target Marketing Channel៖
                </label>
                <input
                  type="text"
                  value={formData.channel_target}
                  onChange={(e) => setFormData({ ...formData, channel_target: e.target.value })}
                  className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-xs font-mono text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <div className="space-y-1 pt-1 border-t border-[#e1e5eb]">
                <label className="block text-xs font-semibold text-[#1c2733] flex items-center justify-between">
                  <span>VirusTotal API Key (ជាជម្រើស)៖</span>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[11px] text-[#2481cc] hover:underline"
                  >
                    {showApiKey ? "លាក់" : "បង្ហាញ"}
                  </button>
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Key className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#708499]" />
                    <input
                      type={showApiKey ? "text" : "password"}
                      placeholder="បញ្ចូល VirusTotal API key..."
                      value={formData.virustotal_api_key}
                      onChange={(e) => setFormData({ ...formData, virustotal_api_key: e.target.value })}
                      className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 7: Dark Mode / Night Monitoring Theme Toggle */}
          <div className="bg-white border border-[#e1e5eb] rounded-xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e5eb]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 text-slate-800 rounded-lg">
                  {isDarkMode || formData.dark_mode ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1c2733]">រូបរាងផ្ទាំងបញ្ជា (Theme & Night Mode)</h3>
                  <p className="text-[11px] text-[#708499]">ប្តូរទៅ Dark Mode ដើម្បីកាត់បន្ថយការចាំងភ្នែកពេលយប់</p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${isDarkMode || formData.dark_mode ? "bg-indigo-900/40 text-indigo-300 border border-indigo-700" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                {isDarkMode || formData.dark_mode ? "🌙 Dark Mode" : "☀️ Light Mode"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e1e5eb]">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[#1c2733]">របៀបសង្កេតពេលយប់ (Night Monitoring Dark Theme)</p>
                <p className="text-[11px] text-[#708499]">ប្រើផ្ទាំងពណ៌ងងឹត កាត់បន្ថយការហត់នឿយភ្នែក</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextState = !(isDarkMode || formData.dark_mode);
                  setFormData({ ...formData, dark_mode: nextState });
                  if (onToggleDarkMode) onToggleDarkMode(nextState);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isDarkMode || formData.dark_mode ? "bg-indigo-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isDarkMode || formData.dark_mode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Card 8: Full Data Backup & Restore */}
          <div className="bg-white border border-[#e1e5eb] rounded-xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e5eb]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <FileJson className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1c2733]">ការបម្រុងទុកទិន្នន័យ (Data Backup & Restore)</h3>
                  <p className="text-[11px] text-[#708499]">ទាញយក Snapshot ឬ Restore ទិន្នន័យប្រព័ន្ធទាំងមូល</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold">
                JSON Snapshot
              </span>
            </div>

            <p className="text-xs text-[#708499] leading-relaxed">
              ទាញយកទិន្នន័យកំណត់ទាំងអស់ (Settings, Groups, CRM Clients, Audit Logs) ទៅជាឯកសារ JSON តែមួយ សម្រាប់រក្សាទុកជាការការពារ។
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* Download Backup */}
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={isExportingBackup}
                className="w-full bg-[#2481cc] hover:bg-[#1b64a0] text-white py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingBackup ? "កំពុងបង្កើត Backup..." : "ទាញយក Backup (JSON)"}</span>
              </button>

              {/* Restore Backup */}
              <div>
                <input
                  type="file"
                  ref={backupFileInputRef}
                  accept=".json"
                  onChange={handleRestoreFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => backupFileInputRef.current?.click()}
                  disabled={isRestoringBackup}
                  className="w-full bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#1c2733] border border-[#e1e5eb] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
                >
                  <Upload className="w-3.5 h-3.5 text-[#2481cc]" />
                  <span>{isRestoringBackup ? "កំពុង Restore..." : "Restore ពី File JSON"}</span>
                </button>
              </div>
            </div>

            {/* Status Message */}
            {backupStatusMessage && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 font-medium ${
                  backupStatusMessage.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}
              >
                {backupStatusMessage.type === "success" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{backupStatusMessage.text}</span>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
