export interface GroupConfig {
  title: string;
  chat_id: number;
  added_at: string;
  is_authorized: boolean;
  is_enabled: boolean;
  plan_type: string;
  is_lifetime: boolean;
  activated_date: string;
  expiry_date: string;
  last_reminder_ts: number;
  added_by_id: number | null;
  added_by_name: string | null;
  added_by_username: string | null;
  threats_blocked_count: number;
}

export interface PurchaseHistoryItem {
  package: string;
  purchased_date: string;
  duration: string;
  status: string;
}

export interface SecurityStats {
  threats_blocked: number;
  spams_blocked: number;
  last_incident: string;
}

export interface CustomerContact {
  name: string;
  user_id: string;
  username: string;
}

export interface ClientCRM {
  client_group_id: number;
  client_group_name: string;
  registered_date: string;
  activated_date: string;
  expiry_date: string;
  plan_type: string;
  is_lifetime: boolean;
  license_status: string;
  customer_contact: CustomerContact;
  purchase_history: PurchaseHistoryItem[];
  security_stats: SecurityStats;
}

export interface SecurityAuditLog {
  timestamp: string;
  event_type: string;
  chat_id: string;
  chat_title: string;
  user_id: string;
  user_name: string;
  details: string;
  action: string;
}

export interface MalwareScanResult {
  fileName: string;
  finalExt: string;
  isDangerous: boolean;
  isDoubleExt: boolean;
  disguisedType?: string;
  needHashScan: boolean;
  reason: string;
  punishment: string;
}

export interface BotSettings {
  mute_duration_hours: number;
  punishment_mode: "MUTE" | "BAN" | "KICK";
  anti_flood_enabled: boolean;
  flood_max_msgs: number;
  flood_window_seconds: number;
  flood_mute_hours: number;
  bot_msg_delete_seconds: number;
  auto_delete_service_msgs: boolean;
  detect_double_extension: boolean;
  custom_blocked_extensions: string[];
  virustotal_api_key: string;
  super_admin_id: string;
  channel_target: string;
  notifications_enabled: boolean;
  cleanup_interval_days: number; // 0 for never, 30 for 30 days, 60 for 60 days, 90 for 90 days
  dark_mode?: boolean;
}

export interface ServiceHealthStatus {
  status: "online" | "offline" | "ready" | "warning";
  latency_ms: number;
  connected: boolean;
  message: string;
  bot_username?: string;
  configured?: boolean;
  engine?: string;
}

export interface SystemHealthInfo {
  telegram: ServiceHealthStatus;
  virustotal: ServiceHealthStatus;
  database: ServiceHealthStatus;
  timestamp: string;
}

export interface QuickScanGroupResult {
  chat_id: number;
  title: string;
  is_enabled: boolean;
  is_authorized: boolean;
  latency_ms: number;
  flood_shield_status: string;
  flood_test_result: string;
  tested_at: string;
}

export interface QuickScanResponse {
  success: boolean;
  total_groups_scanned: number;
  active_groups_tested: number;
  flood_triggers_simulated: number;
  scanned_groups: QuickScanGroupResult[];
  tested_at: string;
  message: string;
}
