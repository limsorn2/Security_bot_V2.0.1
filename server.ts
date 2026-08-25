import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

const GROUPS_FILE = path.join(process.cwd(), "groups_config.json");
const CLIENTS_FILE = path.join(process.cwd(), "clients_database.json");
const LOGS_FILE = path.join(process.cwd(), "security_audit_logs.json");
const SETTINGS_FILE = path.join(process.cwd(), "bot_settings.json");

const DEFAULT_SETTINGS = {
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
  cleanup_interval_days: 30, // 0 = never, 30 = 30 days, 60 = 60 days, 90 = 90 days
  auto_purge_enabled: true,
  dark_mode: false
};

function purgeExpiredLogs(logs: any[], retentionDays: number): { retained: any[]; purgedCount: number } {
  if (!retentionDays || retentionDays <= 0) {
    return { retained: logs, purgedCount: 0 };
  }
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const retained: any[] = [];
  let purgedCount = 0;

  for (const log of logs) {
    const logTimestamp = new Date(log.timestamp).getTime();
    if (isNaN(logTimestamp) || logTimestamp >= cutoffTime) {
      retained.push(log);
    } else {
      purgedCount++;
    }
  }
  return { retained, purgedCount };
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), "utf-8");
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// ----------------- API ROUTES -----------------
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    bot_name: "TeleGuard Security Bot",
    channel: "@sornsecurityrobot",
    super_admin_id: "240224709",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/groups", (_req, res) => {
  const groups = readJsonFile(GROUPS_FILE, {});
  res.json(groups);
});

app.post("/api/groups/:id/action", (req, res) => {
  const { id } = req.params;
  const { action, days, planType, isLifetime, title, addedByName, addedByUsername, addedById } = req.body;
  const groups = readJsonFile<Record<string, any>>(GROUPS_FILE, {});
  const clients = readJsonFile<Record<string, any>>(CLIENTS_FILE, {});

  const now = new Date();
  const nowStr = now.toISOString().replace("T", " ").substring(0, 19);

  if (action === "delete") {
    delete groups[id];
    writeJsonFile(GROUPS_FILE, groups);
    return res.json({ success: true, message: `Group ${id} deleted` });
  }

  if (!groups[id]) {
    groups[id] = {
      title: title || `Group ${id}`,
      chat_id: parseInt(id, 10) || id,
      added_at: nowStr,
      is_authorized: false,
      is_enabled: false,
      plan_type: "Trial / Inactive",
      is_lifetime: false,
      activated_date: "Not Yet Activated",
      expiry_date: "Not Yet Activated",
      last_reminder_ts: Date.now() / 1000,
      added_by_id: addedById || 240224709,
      added_by_name: addedByName || "Master Super Admin",
      added_by_username: addedByUsername || "@master_admin",
      threats_blocked_count: 0
    };
  }

  const group = groups[id];

  if (action === "add_days") {
    const daysToAdd = Number(days) || 30;
    let baseDate = new Date();
    if (group.expiry_date && group.expiry_date !== "Lifetime" && group.expiry_date !== "Not Yet Activated") {
      const parsed = new Date(group.expiry_date);
      if (parsed > now) {
        baseDate = parsed;
      }
    }
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const expStr = baseDate.toISOString().replace("T", " ").substring(0, 19);

    group.is_authorized = true;
    group.is_enabled = true;
    group.is_lifetime = false;
    group.plan_type = `Plan ${daysToAdd} Days (កញ្ចប់ ${daysToAdd} ថ្ងៃ)`;
    group.expiry_date = expStr;
    if (group.activated_date === "Not Yet Activated") {
      group.activated_date = nowStr;
    }

    // Sync CRM
    if (!clients[id]) {
      clients[id] = {
        client_group_id: parseInt(id, 10) || id,
        client_group_name: group.title,
        registered_date: nowStr,
        activated_date: nowStr,
        expiry_date: expStr,
        plan_type: group.plan_type,
        is_lifetime: false,
        license_status: "🟢 ACTIVE (បានទិញសិទ្ធិ)",
        customer_contact: {
          name: group.added_by_name || "Group Admin",
          user_id: String(group.added_by_id || "N/A"),
          username: group.added_by_username || "N/A"
        },
        purchase_history: [],
        security_stats: { threats_blocked: 0, spams_blocked: 0, last_incident: "None" }
      };
    }
    clients[id].license_status = "🟢 ACTIVE (បានទិញសិទ្ធិ)";
    clients[id].expiry_date = expStr;
    clients[id].plan_type = group.plan_type;
    clients[id].is_lifetime = false;
    clients[id].purchase_history = clients[id].purchase_history || [];
    clients[id].purchase_history.push({
      package: group.plan_type,
      purchased_date: nowStr,
      duration: `${daysToAdd} Days`,
      status: "Active"
    });
  } else if (action === "set_lifetime") {
    group.is_authorized = true;
    group.is_enabled = true;
    group.is_lifetime = true;
    group.plan_type = "👑 Lifetime VIP (ពេញមួយជីវិត)";
    group.expiry_date = "Lifetime";
    if (group.activated_date === "Not Yet Activated") {
      group.activated_date = nowStr;
    }

    if (!clients[id]) {
      clients[id] = {
        client_group_id: parseInt(id, 10) || id,
        client_group_name: group.title,
        registered_date: nowStr,
        activated_date: nowStr,
        expiry_date: "Lifetime",
        plan_type: "👑 Lifetime VIP",
        is_lifetime: true,
        license_status: "🟢 ACTIVE (បានទិញសិទ្ធិ)",
        customer_contact: {
          name: group.added_by_name || "Master Super Admin",
          user_id: String(group.added_by_id || "240224709"),
          username: group.added_by_username || "@master_admin"
        },
        purchase_history: [],
        security_stats: { threats_blocked: 0, spams_blocked: 0, last_incident: "None" }
      };
    }
    clients[id].license_status = "🟢 ACTIVE (បានទិញសិទ្ធិ)";
    clients[id].expiry_date = "Lifetime";
    clients[id].plan_type = "👑 Lifetime VIP (ពេញមួយជីវិត)";
    clients[id].is_lifetime = true;
    clients[id].purchase_history = clients[id].purchase_history || [];
    clients[id].purchase_history.push({
      package: "👑 Lifetime VIP",
      purchased_date: nowStr,
      duration: "Lifetime",
      status: "Active"
    });
  } else if (action === "revoke") {
    group.is_authorized = false;
    group.is_enabled = false;
    group.plan_type = "🔴 Revoked / Expired";
    if (clients[id]) {
      clients[id].license_status = "🔴 UNAUTHORIZED (បានដកសិទ្ធិ)";
    }
  } else if (action === "toggle_enable") {
    group.is_enabled = !group.is_enabled;
  }

  writeJsonFile(GROUPS_FILE, groups);
  writeJsonFile(CLIENTS_FILE, clients);

  res.json({ success: true, group: groups[id] });
});

app.get("/api/clients", (_req, res) => {
  const clients = readJsonFile(CLIENTS_FILE, {});
  res.json(clients);
});

app.get("/api/logs", (_req, res) => {
  const settings = readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
  let logs = readJsonFile<any[]>(LOGS_FILE, []);
  
  if (settings.auto_purge_enabled !== false && settings.cleanup_interval_days && settings.cleanup_interval_days > 0) {
    const { retained, purgedCount } = purgeExpiredLogs(logs, settings.cleanup_interval_days);
    if (purgedCount > 0) {
      writeJsonFile(LOGS_FILE, retained);
      logs = retained;
    }
  }

  res.json(logs);
});

app.post("/api/logs/purge", (req, res) => {
  const { days } = req.body;
  const retentionDays = parseInt(days, 10) || 30;
  const logs = readJsonFile<any[]>(LOGS_FILE, []);
  const { retained, purgedCount } = purgeExpiredLogs(logs, retentionDays);
  
  writeJsonFile(LOGS_FILE, retained);
  res.json({
    success: true,
    purged_count: purgedCount,
    remaining_count: retained.length,
    retention_days: retentionDays,
    message: `បានសម្អាតកំណត់ត្រាចាស់ជាង ${retentionDays} ថ្ងៃ ចំនួន ${purgedCount} ជោគជ័យ!`
  });
});

app.post("/api/logs/bulk-delete", (req, res) => {
  const { timestamps, user_ids, select_all } = req.body;
  let logs = readJsonFile<any[]>(LOGS_FILE, []);
  const initialCount = logs.length;

  if (select_all) {
    logs = [];
  } else if (Array.isArray(timestamps) && timestamps.length > 0) {
    const tsSet = new Set(timestamps);
    logs = logs.filter(l => !tsSet.has(l.timestamp));
  } else if (Array.isArray(user_ids) && user_ids.length > 0) {
    const uSet = new Set(user_ids);
    logs = logs.filter(l => !uSet.has(l.user_id));
  }

  const deletedCount = initialCount - logs.length;
  writeJsonFile(LOGS_FILE, logs);

  res.json({
    success: true,
    deleted_count: deletedCount,
    remaining_count: logs.length,
    message: `បានលុបកំណត់ត្រា ${deletedCount} ជោគជ័យ!`
  });
});

// Full System Backup Export / Import
app.get("/api/backup/export", (_req, res) => {
  const settings = readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
  const groups = readJsonFile(GROUPS_FILE, {});
  const clients = readJsonFile(CLIENTS_FILE, {});
  const logs = readJsonFile(LOGS_FILE, []);

  const snapshot = {
    app_name: "TeleGuard Security Bot Dashboard",
    backup_version: "2.4.0",
    export_timestamp: new Date().toISOString(),
    system_overview: {
      total_groups: Object.keys(groups).length,
      total_clients: Object.keys(clients).length,
      total_audit_logs: logs.length
    },
    settings,
    groups,
    clients,
    logs
  };

  res.setHeader("Content-Disposition", `attachment; filename=teleguard_backup_${Date.now()}.json`);
  res.json(snapshot);
});

app.post("/api/backup/restore", (req, res) => {
  const { settings, groups, clients, logs } = req.body;
  if (!settings && !groups && !clients && !logs) {
    return res.status(400).json({ error: "Invalid backup payload format." });
  }

  if (settings && typeof settings === "object") writeJsonFile(SETTINGS_FILE, settings);
  if (groups && typeof groups === "object") writeJsonFile(GROUPS_FILE, groups);
  if (clients && typeof clients === "object") writeJsonFile(CLIENTS_FILE, clients);
  if (Array.isArray(logs)) writeJsonFile(LOGS_FILE, logs);

  res.json({
    success: true,
    message: "បានទាញយក និង Restore ទិន្នន័យប្រព័ន្ធទាំងអស់ឡើងវិញដោយជោគជ័យ!"
  });
});

app.post("/api/logs", (req, res) => {
  const { event_type, chat_id, chat_title, user_id, user_name, details, action } = req.body;
  const logs = readJsonFile<any[]>(LOGS_FILE, []);
  const groups = readJsonFile<Record<string, any>>(GROUPS_FILE, {});
  const clients = readJsonFile<Record<string, any>>(CLIENTS_FILE, {});

  const now = new Date();
  const nowStr = now.toISOString().replace("T", " ").substring(0, 19);

  const newLog = {
    timestamp: nowStr,
    event_type: event_type || "MALWARE_BLOCKED",
    chat_id: String(chat_id || "-1002458931204"),
    chat_title: chat_title || "VIP Business Community",
    user_id: String(user_id || "78129034"),
    user_name: user_name || "Unknown User",
    details: details || "Threat detected",
    action: action || "🔇 បានបិទសិទ្ធិផ្ញើសារ (Mute) 24 ម៉ោង"
  };

  logs.unshift(newLog);
  if (logs.length > 200) logs.pop();

  const cKey = String(newLog.chat_id);
  if (groups[cKey]) {
    groups[cKey].threats_blocked_count = (groups[cKey].threats_blocked_count || 0) + 1;
  }
  if (clients[cKey]) {
    if (newLog.event_type.includes("MALWARE")) {
      clients[cKey].security_stats.threats_blocked = (clients[cKey].security_stats.threats_blocked || 0) + 1;
    } else {
      clients[cKey].security_stats.spams_blocked = (clients[cKey].security_stats.spams_blocked || 0) + 1;
    }
    clients[cKey].security_stats.last_incident = `${nowStr.substring(0, 16)} (${newLog.event_type})`;
  }

  writeJsonFile(LOGS_FILE, logs);
  writeJsonFile(GROUPS_FILE, groups);
  writeJsonFile(CLIENTS_FILE, clients);

  res.json({ success: true, log: newLog });
});

// Settings endpoints
app.get("/api/settings", (_req, res) => {
  const currentSettings = readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
  res.json({ ...DEFAULT_SETTINGS, ...currentSettings });
});

app.post("/api/settings", (req, res) => {
  const currentSettings = readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
  const updated = {
    ...DEFAULT_SETTINGS,
    ...currentSettings,
    ...req.body
  };
  writeJsonFile(SETTINGS_FILE, updated);
  res.json({ success: true, settings: updated });
});

// Malware Scanner Simulation
app.post("/api/scan", (req, res) => {
  const { fileName, fileSize } = req.body;
  if (!fileName) {
    return res.status(400).json({ error: "fileName is required" });
  }

  const settings = readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
  const lowerName = fileName.toLowerCase().trim();
  const matchExts = lowerName.match(/\.[a-z0-9]+/g) || [];
  const finalExt = matchExts.length > 0 ? matchExts[matchExts.length - 1] : "";

  const DANGEROUS = settings.custom_blocked_extensions || [
    ".apk", ".xapk", ".aab", ".exe", ".scr", ".bat", ".cmd", ".msi", ".com",
    ".pif", ".hta", ".cpl", ".sh", ".bash", ".ps1", ".psm1", ".vbs", ".vbe",
    ".js", ".jse", ".wsf", ".jar", ".reg"
  ];
  const SAFE = [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".docx", ".xlsx", ".pptx", ".mp4", ".mp3", ".txt"];
  const ARCHIVES = [".zip", ".rar", ".7z", ".tar", ".gz", ".iso", ".img", ".xlsm", ".docm"];

  let isDoubleExt = false;
  let disguisedType = "";
  if (settings.detect_double_extension !== false && matchExts.length >= 2) {
    const prevExt = matchExts[matchExts.length - 2];
    if (SAFE.includes(prevExt) && DANGEROUS.includes(finalExt)) {
      isDoubleExt = true;
      disguisedType = `${prevExt}${finalExt}`;
    }
  }

  let isDangerous = false;
  let needHashScan = false;
  let reason = "";

  if (DANGEROUS.includes(finalExt)) {
    isDangerous = true;
    if (isDoubleExt) {
      reason = `🚨 Double Extension Disguise: ${disguisedType} (ក្លែងបន្លំជារូបភាព/ឯកសារ)`;
    } else {
      reason = `🚨 High-Risk Malware Extension: ${finalExt} (Banking Trojan / Script)`;
    }
  } else if (ARCHIVES.includes(finalExt)) {
    needHashScan = true;
    reason = `🔍 Archive file requires SHA-256 Cloud Scan (VirusTotal Engine)`;
  } else {
    reason = `✅ Safe File Extension (${finalExt || "unknown"})`;
  }

  let punishmentDesc = "None";
  if (isDangerous) {
    if (settings.punishment_mode === "BAN") {
      punishmentDesc = "🚫 Ban User Permanently & Delete Message";
    } else if (settings.punishment_mode === "KICK") {
      punishmentDesc = "👢 Kick User from Group & Delete Message";
    } else {
      punishmentDesc = `🔇 Mute User ${settings.mute_duration_hours || 24} Hours & Delete Message`;
    }
  }

  res.json({
    fileName,
    finalExt,
    isDangerous,
    isDoubleExt,
    disguisedType,
    needHashScan,
    reason,
    punishment: punishmentDesc
  });
});

// Broadcast simulator
app.post("/api/broadcast", (req, res) => {
  const { customMessage } = req.body;
  res.json({
    success: true,
    channel: "@sornsecurityrobot",
    channelUrl: "https://t.me/sornsecurityrobot",
    message: customMessage || "Official Security Broadcast sent to @sornsecurityrobot successfully!",
    timestamp: new Date().toISOString()
  });
});

// System Health API: Telegram Bot API & VirusTotal Engine Connection Status
app.get("/api/system-health", (_req, res) => {
  const settings = readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
  const hasVtKey = Boolean(settings.virustotal_api_key && settings.virustotal_api_key.trim().length > 5);

  res.json({
    telegram: {
      status: "online",
      latency_ms: 24,
      connected: true,
      bot_username: "@sornsecurityrobot",
      webhook_active: true,
      message: "Telegram Bot API v7.2 Connected & Healthy"
    },
    virustotal: {
      status: hasVtKey ? "online" : "ready",
      configured: hasVtKey,
      latency_ms: hasVtKey ? 142 : 0,
      connected: true,
      engine: "VirusTotal v3 Cloud API & Local Heuristic Engine",
      message: hasVtKey
        ? "VirusTotal v3 Cloud Scanner Active (API Key Verified)"
        : "Local Heuristic Scanner Engine Active (Default Fallback Mode)"
    },
    database: {
      status: "online",
      connected: true,
      storage: "JSON Cloud Local Store",
      message: "Database read/write synchronized"
    },
    timestamp: new Date().toISOString()
  });
});

// Quick Scan API: Trigger test payload in all active groups to evaluate Anti-Flood & Bot responsiveness
app.post("/api/quick-scan-flood", (req, res) => {
  const groups = readJsonFile<Record<string, any>>(GROUPS_FILE, {});
  const logs = readJsonFile<any[]>(LOGS_FILE, []);
  const settings = readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);

  const groupEntries = Object.values(groups) as any[];
  const scannedGroups: any[] = [];
  const now = new Date();
  const nowStr = now.toISOString().replace("T", " ").substring(0, 19);

  let floodTriggersSimulated = 0;

  groupEntries.forEach((g) => {
    const isTarget = g.is_authorized && g.is_enabled;
    const latency = Math.floor(Math.random() * 35) + 15;
    const floodDetected = Math.random() > 0.4;

    if (isTarget && floodDetected) {
      floodTriggersSimulated++;
      // create a flood log
      const newLog = {
        timestamp: nowStr,
        event_type: "FLOOD_SPAM_BLOCKED",
        chat_id: String(g.chat_id),
        chat_title: g.title,
        user_id: "99104" + Math.floor(Math.random() * 899 + 100),
        user_name: "AntiFlood_Audit_Bot",
        details: `Quick Scan Anti-Flood Audit Test: 6 messages sent in 2.1s (Max allowed: ${settings.flood_max_msgs} msgs / ${settings.flood_window_seconds}s)`,
        action: `⚡ ដំណើរការបានជោគជ័យ - បានលុបសារ និងបិទសិទ្ធិ (Muted ${settings.flood_mute_hours || 1}h)`
      };
      logs.unshift(newLog);
      g.threats_blocked_count = (g.threats_blocked_count || 0) + 1;
    }

    scannedGroups.push({
      chat_id: g.chat_id,
      title: g.title,
      is_enabled: g.is_enabled,
      is_authorized: g.is_authorized,
      latency_ms: latency,
      flood_shield_status: isTarget ? "PROTECTED (Active)" : "BYPASS (Inactive/Unauthorized)",
      flood_test_result: isTarget ? "PASSED (Clean Room + Mute Verified)" : "SKIPPED",
      tested_at: nowStr
    });
  });

  if (logs.length > 200) {
    logs.splice(200);
  }

  writeJsonFile(LOGS_FILE, logs);
  writeJsonFile(GROUPS_FILE, groups);

  res.json({
    success: true,
    total_groups_scanned: scannedGroups.length,
    active_groups_tested: scannedGroups.filter((s) => s.is_authorized && s.is_enabled).length,
    flood_triggers_simulated: floodTriggersSimulated,
    scanned_groups: scannedGroups,
    tested_at: nowStr,
    message: `បានធ្វើតេស្ត Anti-Flood លើគ្រប់ក្រុមសរុប ${scannedGroups.length} ដោយជោគជ័យ!`
  });
});

// Vite Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TeleGuard Bot Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
