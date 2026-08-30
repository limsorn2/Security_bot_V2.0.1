import React, { useState } from "react";
import { GroupConfig, ClientCRM } from "../types";
import {
  Shield,
  Plus,
  Crown,
  Calendar,
  AlertCircle,
  Trash2,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  XCircle,
  Search,
  UserCheck,
  Zap,
  Info,
  Hash,
  AlertTriangle,
  Sparkles,
  Layers,
  RefreshCw,
  DownloadCloud,
  FileText,
  Send,
  ExternalLink,
  Check
} from "lucide-react";

interface GroupManagerProps {
  groups: Record<string, GroupConfig>;
  clients: Record<string, ClientCRM>;
  onGroupAction: (groupId: string, action: string, payload?: any) => Promise<void>;
  isLoading: boolean;
}

export const GroupManager: React.FC<GroupManagerProps> = ({
  groups,
  clients,
  onGroupAction,
  isLoading
}) => {
  const groupKeys = Object.keys(groups);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    groupKeys[0] || null
  );
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{ id: string; title: string } | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // Sync / Import Modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncTab, setSyncTab] = useState<"auto" | "bulk">("auto");
  const [syncManualInput, setSyncManualInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    total_discovered?: number;
    newly_imported_count?: number;
    already_existing_count?: number;
    newly_imported?: any[];
    already_existing?: any[];
    message?: string;
  } | null>(null);

  // Direct Add Form State
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [newGroupId, setNewGroupId] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminId, setNewAdminId] = useState("");
  const [selectedPlanDays, setSelectedPlanDays] = useState<string>("30");
  const [isAutoActive, setIsAutoActive] = useState(true);

  const groupList = (Object.entries(groups) as [string, GroupConfig][]).filter(([id, g]) => {
    const q = searchTerm.toLowerCase();
    return (
      (g.title || "").toLowerCase().includes(q) ||
      id.includes(q) ||
      (g.added_by_name || "").toLowerCase().includes(q) ||
      (g.added_by_username || "").toLowerCase().includes(q)
    );
  });

  // Ensure selected group exists or fallback to first
  const activeGroupId = (selectedGroupId && groups[selectedGroupId])
    ? selectedGroupId
    : groupList[0]?.[0] || null;

  const selectedGroup = activeGroupId ? groups[activeGroupId] : null;
  const selectedClient = activeGroupId ? clients[activeGroupId] : null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupId.trim() || !newGroupTitle.trim()) return;

    let formattedChatId = newGroupId.trim();
    // Auto-prefix -100 if user types positive number or misses -100
    if (!formattedChatId.startsWith("-") && /^\d+$/.test(formattedChatId)) {
      formattedChatId = `-100${formattedChatId}`;
    }

    const isLifetime = selectedPlanDays === "lifetime";
    const days = isLifetime ? 0 : parseInt(selectedPlanDays, 10) || 30;

    await onGroupAction(formattedChatId, "direct_add", {
      title: newGroupTitle.trim(),
      days: days,
      isLifetime: isLifetime,
      planType: isLifetime ? "👑 Lifetime VIP" : `Plan ${days} Days`,
      isAuthorized: true,
      isEnabled: isAutoActive,
      addedByName: newAdminName.trim() || "Group Admin",
      addedByUsername: newAdminUsername.trim().startsWith("@") ? newAdminUsername.trim() : (newAdminUsername.trim() ? `@${newAdminUsername.trim()}` : "@admin"),
      addedById: newAdminId.trim() || "240224709"
    });

    setNewGroupTitle("");
    setNewGroupId("");
    setNewAdminName("");
    setNewAdminUsername("");
    setNewAdminId("");
    setSelectedPlanDays("30");
    setIsAutoActive(true);
    setShowAddModal(false);
    setSelectedGroupId(formattedChatId);
  };

  const handleTriggerSync = async (manualText?: string) => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      await onGroupAction("sync", "sync_from_telegram", {
        manualInput: manualText,
        onComplete: (data: any) => {
          setSyncResult(data);
          if (data?.newly_imported?.length > 0 && !selectedGroupId) {
            setSelectedGroupId(data.newly_imported[0].id);
          }
        }
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const confirmDeleteSingleGroup = async () => {
    if (!groupToDelete) return;
    const deletingId = groupToDelete.id;
    setGroupToDelete(null);
    if (selectedGroupId === deletingId) {
      setSelectedGroupId(null);
    }
    await onGroupAction(deletingId, "delete");
  };

  const confirmClearAll = async () => {
    setShowClearAllModal(false);
    setSelectedGroupId(null);
    await onGroupAction("all", "clear_all");
  };

  const getRemainingDays = (expStr: string, isLife: boolean) => {
    if (isLife || expStr === "Lifetime") return "👑 VIP ពេញមួយជីវិត";
    if (!expStr || expStr === "Not Yet Activated") return "🔴 មិនទាន់ទិញ";
    try {
      const exp = new Date(expStr);
      const now = new Date();
      const diffTime = exp.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return "🔴 ផុតកំណត់ហើយ";
      return `⏳ នៅសល់ ${diffDays} ថ្ងៃ`;
    } catch {
      return expStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="bg-white border border-[#e1e5eb] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#1c2733] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#2481cc]" />
            <span>ផ្ទាំងគ្រប់គ្រងក្រុម & អាជ្ញាប័ណ្ណ (Group License Config)</span>
          </h2>
          <p className="text-xs text-[#708499] mt-0.5">
            គ្រប់គ្រងក្រុម Telegram ផ្ទាល់ខ្លួន បន្ថែមក្រុមថ្មី កំណត់ថ្ងៃអាជ្ញាប័ណ្ណ ឬលុបក្រុមចេញពីប្រព័ន្ធ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-[#708499] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះ ឬ ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e1e5eb] text-xs text-[#1c2733] pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-[#2481cc]"
            />
          </div>

          {/* Sync / Fetch from Telegram Button */}
          <button
            type="button"
            onClick={() => {
              setShowSyncModal(true);
              setSyncResult(null);
            }}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer shadow-sm"
            title="ហៅក្រុមទាំងអស់ដែល Bot កំពុងស្ថិតនៅចូលក្នុងបញ្ជី"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>🔄 ហៅក្រុមពី Telegram</span>
          </button>

          {/* Clear All Groups Button (Visible if groups exist) */}
          {groupKeys.length > 0 && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors"
              title="លុបក្រុមទាំងអស់ចេញពីប្រព័ន្ធ"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">លុបទាំងអស់ ({groupKeys.length})</span>
              <span className="sm:hidden">លុបទាំងអស់</span>
            </button>
          )}

          {/* Add Group Direct Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#2481cc] hover:bg-[#1b64a0] text-white font-medium px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>បន្ថែម Group ដោយផ្ទាល់</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Group List + Submenu Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5/12): Group Selection List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#708499] uppercase tracking-wider px-1">
            <span>បញ្ជីក្រុម Telegram ({groupList.length})</span>
            {groupKeys.length > 0 && (
              <span className="text-[10px] text-[#2481cc] lowercase font-normal">
                ចុចរូប 🗑️ ដើម្បីលុបក្រុមនីមួយៗ
              </span>
            )}
          </div>

          <div className="space-y-2">
            {groupList.map(([id, g]) => {
              const isSelected = activeGroupId === id;
              const isActive = g.is_authorized && g.is_enabled;
              const isPaused = g.is_authorized && !g.is_enabled;

              return (
                <div
                  key={id}
                  onClick={() => setSelectedGroupId(id)}
                  className={`group relative p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#2481cc]/10 border-[#2481cc] shadow-sm ring-1 ring-[#2481cc]/20"
                      : "bg-white border-[#e1e5eb] hover:border-[#2481cc]/40 hover:bg-[#f8fafc]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isActive
                            ? "bg-emerald-500"
                            : isPaused
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      ></span>
                      <span className="font-bold text-[#1c2733] text-xs truncate max-w-[160px] sm:max-w-[200px]">
                        {g.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isPaused
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {isActive ? "🟢 ON" : isPaused ? "🟡 PAUSE" : "🔴 UNAUTH"}
                      </span>

                      {/* Quick Delete Trash Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGroupToDelete({ id, title: g.title });
                        }}
                        title={`លុប Group "${g.title}"`}
                        className="p-1 rounded-md text-[#708499] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#708499]">
                    <span className="font-mono text-[10px]">ID: {id}</span>
                    <span className="text-[#1c2733] font-medium">{getRemainingDays(g.expiry_date, g.is_lifetime)}</span>
                  </div>
                </div>
              );
            })}

            {/* Empty State when no groups match or list is completely empty */}
            {groupList.length === 0 && (
              <div className="bg-white border border-[#e1e5eb] rounded-xl p-6 sm:p-8 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2481cc] mx-auto flex items-center justify-center border border-blue-100">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1c2733] text-sm">
                    {searchTerm ? "មិនមាន Group ត្រូវតាមពាក្យស្វែងរកឡើយ" : "មិនទាន់មាន Group ក្នុងបញ្ជីគ្រប់គ្រងឡើយ"}
                  </h4>
                  <p className="text-xs text-[#708499] max-w-sm mx-auto mt-1 leading-relaxed">
                    {searchTerm
                      ? "សូមសាកល្បងស្វែងរកដោយប្រើពាក្យ ឬលេខ ID ផ្សេង"
                      : "ប្រសិនបើ Bot ធ្លាប់បានចូលក្នុងគ្រុប Telegram ពីមុនមក សូមចុចប៊ូតុងខាងក្រោមដើម្បីហៅ និងទាញយកក្រុមទាំងអស់ចូលក្នុងបញ្ជីដោយស្វ័យប្រវត្តិ។"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSyncModal(true);
                      setSyncResult(null);
                    }}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>🔄 ហៅក្រុមពី Telegram ស្វ័យប្រវត្តិ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="w-full sm:w-auto bg-[#2481cc] hover:bg-[#1b64a0] text-white font-medium px-4 py-2 rounded-lg text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>➕ បន្ថែម Group ដោយផ្ទាល់</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7/12): Detailed Group Submenu & Control Buttons */}
        <div className="lg:col-span-7">
          {selectedGroup && activeGroupId ? (
            <div className="bg-white border border-[#e1e5eb] rounded-xl p-5 shadow-sm space-y-5">
              {/* Group Title Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#e1e5eb]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#1c2733]">{selectedGroup.title}</h3>
                    {selectedGroup.is_lifetime && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-500" />
                        <span>VIP</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#708499] font-mono mt-0.5">
                    Group ID: <span className="text-[#2481cc] font-semibold">{activeGroupId}</span> | ចុះឈ្មោះ៖ {selectedGroup.added_at}
                  </p>
                </div>

                <div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${
                      selectedGroup.is_authorized && selectedGroup.is_enabled
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedGroup.is_authorized
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {selectedGroup.is_authorized && selectedGroup.is_enabled
                      ? "🟢 ACTIVE (កំពុងការពារ)"
                      : selectedGroup.is_authorized
                      ? "🟡 PAUSED (បានផ្អាក)"
                      : "🔴 UNAUTHORIZED (មិនទាន់ទិញ)"}
                  </span>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#f8fafc] border border-[#e1e5eb] p-3 rounded-lg space-y-1">
                  <span className="text-[#708499] uppercase font-bold text-[10px] tracking-wider">កញ្ចប់សេវាកម្ម</span>
                  <div className="font-bold text-[#1c2733] text-xs flex items-center gap-1.5">
                    <span>{selectedGroup.plan_type}</span>
                  </div>
                  <div className="text-[#708499] text-[11px]">
                    {getRemainingDays(selectedGroup.expiry_date, selectedGroup.is_lifetime)}
                  </div>
                </div>

                <div className="bg-[#f8fafc] border border-[#e1e5eb] p-3 rounded-lg space-y-1">
                  <span className="text-[#708499] uppercase font-bold text-[10px] tracking-wider">ព័ត៌មានអតិថិជន / Admin</span>
                  <div className="font-bold text-[#1c2733] text-xs flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#2481cc]" />
                    <span>{selectedGroup.added_by_name || "Group Admin"}</span>
                  </div>
                  <div className="text-[#708499] text-[11px] font-mono truncate">
                    {selectedGroup.added_by_username || "@admin"} (ID: {selectedGroup.added_by_id || "N/A"})
                  </div>
                </div>

                <div className="bg-[#f8fafc] border border-[#e1e5eb] p-3 rounded-lg space-y-1">
                  <span className="text-[#708499] uppercase font-bold text-[10px] tracking-wider">កាលបរិច្ឆេទសកម្ម</span>
                  <div className="text-[#1c2733] text-[11px]">ថ្ងៃចាប់ផ្ដើម៖ <span className="font-mono">{selectedGroup.activated_date}</span></div>
                  <div className="text-[#1c2733] text-[11px]">ថ្ងៃផុតកំណត់៖ <span className="font-mono text-amber-600 font-bold">{selectedGroup.expiry_date}</span></div>
                </div>

                <div className="bg-[#f8fafc] border border-[#e1e5eb] p-3 rounded-lg space-y-1">
                  <span className="text-[#708499] uppercase font-bold text-[10px] tracking-wider">ស្ថិតិការពារ (Threat Stats)</span>
                  <div className="text-[#1c2733] text-[11px]">☣️ មេរោគបានទប់ស្កាត់៖ <span className="font-bold text-rose-600 font-mono">{selectedGroup.threats_blocked_count || 0}</span></div>
                  <div className="text-[#1c2733] text-[11px]">🌊 Anti-Flood Spam៖ <span className="font-bold text-[#2481cc] font-mono">{selectedClient?.security_stats?.spams_blocked || 0}</span></div>
                </div>
              </div>

              {/* If group is pending approval or not yet authorized, show glowing Approve 7-Day Free Trial banner */}
              {(!selectedGroup.is_authorized || selectedGroup.expiry_date === "Not Yet Activated") && (
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                      🎁
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1c2733] text-xs sm:text-sm flex items-center gap-1.5">
                        <span>ក្រុមថ្មីទើបចុះឈ្មោះ - ផ្ដល់សិទ្ធិសាកល្បង ៧ ថ្ងៃ</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">7-Day Free Trial</span>
                      </h4>
                      <p className="text-[11px] text-[#708499] mt-0.5">
                        ចុចប៊ូតុងខាងស្ដាំដើម្បីអនុញ្ញាតឱ្យក្រុមនេះដំណើរការ Bot និងប្រើប្រាស់សាកល្បងបាន ៧ ថ្ងៃឥតគិតថ្លៃ
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={isLoading}
                    onClick={() => onGroupAction(activeGroupId, "approve_trial_7d")}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✅ អនុញ្ញាតសាកល្បង ៧ ថ្ងៃ</span>
                  </button>
                </div>
              )}

              {/* Action Buttons Section */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-[#1c2733] flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>ប៊ូតុងបញ្ជា & កំណត់សិទ្ធិ (Master Action Sub-menus)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-medium">
                  {/* 7-Day Trial */}
                  <button
                    disabled={isLoading}
                    onClick={() => onGroupAction(activeGroupId, "approve_trial_7d")}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>🎁 សាកល្បង 7 ថ្ងៃ</span>
                  </button>

                  {/* +30 Days */}
                  <button
                    disabled={isLoading}
                    onClick={() => onGroupAction(activeGroupId, "add_days", { days: 30 })}
                    className="bg-[#2481cc]/10 hover:bg-[#2481cc]/20 text-[#2481cc] border border-[#2481cc]/30 p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#2481cc]" />
                    <span>➕ បន្ថែម 30 ថ្ងៃ</span>
                  </button>

                  {/* +90 Days */}
                  <button
                    disabled={isLoading}
                    onClick={() => onGroupAction(activeGroupId, "add_days", { days: 90 })}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>➕ បន្ថែម 90 ថ្ងៃ</span>
                  </button>

                  {/* Lifetime VIP */}
                  <button
                    disabled={isLoading}
                    onClick={() => onGroupAction(activeGroupId, "set_lifetime")}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>👑 ពេញមួយជីវិត (VIP)</span>
                  </button>

                  {/* Toggle ON/PAUSE */}
                  <button
                    disabled={isLoading}
                    onClick={() => onGroupAction(activeGroupId, "toggle_enable")}
                    className={`p-2.5 rounded-lg border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      selectedGroup.is_enabled
                        ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {selectedGroup.is_enabled ? (
                      <>
                        <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>🟡 ផ្អាក (PAUSE)</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>🟢 បើកដំណើរការ (ON)</span>
                      </>
                    )}
                  </button>

                  {/* Revoke */}
                  <button
                    disabled={isLoading}
                    onClick={() => onGroupAction(activeGroupId, "revoke")}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>🔴 ដកសិទ្ធិ (Revoke)</span>
                  </button>

                  {/* Remind Admin to Promote */}
                  <button
                    disabled={isLoading}
                    onClick={() => onGroupAction(activeGroupId, "remind_promote")}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="ផ្ញើសារដាស់តឿនទៅ Group & Admin ឱ្យ Promote Bot ជា Admin"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>📢 រំលឹក Promote Admin</span>
                  </button>

                  {/* Leave Group */}
                  <button
                    disabled={isLoading}
                    onClick={() => {
                      if (window.confirm(`តើអ្នកពិតជាចង់បញ្ជាឱ្យ Bot ចាកចេញពីក្រុម "${selectedGroup.title}" មែនទេ?`)) {
                        onGroupAction(activeGroupId, "leave_group");
                      }
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="បញ្ជាឱ្យ Bot ចាកចេញពី Group នេះ"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                    <span>🚪 ចាកចេញពីក្រុម (Leave)</span>
                  </button>

                  {/* Delete Single Group */}
                  <button
                    disabled={isLoading}
                    type="button"
                    onClick={() => setGroupToDelete({ id: activeGroupId, title: selectedGroup.title })}
                    className="col-span-2 sm:col-span-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 p-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>🗑️ លុប Group នេះចេញពីប្រព័ន្ធ</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#e1e5eb] rounded-xl p-12 text-center text-[#708499] text-xs shadow-sm space-y-2">
              <Shield className="w-8 h-8 mx-auto text-[#708499]/50" />
              <p>សូមជ្រើសរើស Group ណាមួយនៅខាងឆ្វេង ឬចុច "បន្ថែម Group ដោយផ្ទាល់" ដើម្បីគ្រប់គ្រង</p>
            </div>
          )}
        </div>
      </div>

      {/* Direct Add Group Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#e1e5eb] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e5eb]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2481cc] flex items-center justify-center border border-blue-100">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1c2733] text-sm">➕ បន្ថែម Group Telegram ដោយផ្ទាល់</h3>
                  <p className="text-[11px] text-[#708499]">បញ្ចូល Group ID និងព័ត៌មានក្រុមដើម្បីបើកការការពារសន្តិសុខភ្លាមៗ</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#708499] hover:text-[#1c2733] p-1 rounded-lg hover:bg-[#f1f4f9]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#1c2733] font-bold mb-1">
                  ឈ្មោះ Group Telegram *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. ABA Trade Community ឬ VIP Crypto Group"
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#1c2733] font-bold">
                    លេខ Telegram Group ID (Chat ID) *
                  </label>
                  <span className="text-[10px] text-[#2481cc]">ត្រូវផ្តើមដោយលេខដក (ឧ. -100...)</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="ឧ. -1002458931204"
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-[#1c2733] font-mono focus:outline-none focus:border-[#2481cc]"
                />
                <p className="text-[10px] text-[#708499] mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 text-[#2481cc]" />
                  <span>វិធីរក ID៖ Add Bot ចូលក្នុងគ្រុប រួចវាយពាក្យ <code className="bg-gray-100 px-1 py-0.5 rounded text-rose-600 font-bold">/id</code> ក្នុងគ្រុប</span>
                </p>
              </div>

              {/* License Plan Picker */}
              <div>
                <label className="block text-[#1c2733] font-bold mb-1">
                  ជ្រើសរើសកញ្ចប់អាជ្ញាប័ណ្ណ (License Plan)
                </label>
                <select
                  value={selectedPlanDays}
                  onChange={(e) => setSelectedPlanDays(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-[#1c2733] font-medium focus:outline-none focus:border-[#2481cc]"
                >
                  <option value="7">🎁 ប្រើសាកល្បងឥតគិតថ្លៃ ៧ ថ្ងៃ (7-Day Free Trial)</option>
                  <option value="30">កញ្ចប់ ១ ខែ (+30 ថ្ងៃ)</option>
                  <option value="90">កញ្ចប់ ៣ ខែ (+90 ថ្ងៃ)</option>
                  <option value="180">កញ្ចប់ ៦ ខែ (+180 ថ្ងៃ)</option>
                  <option value="365">កញ្ចប់ ១ ឆ្នាំ (+365 ថ្ងៃ)</option>
                  <option value="lifetime">👑 អាជ្ញាប័ណ្ណ VIP ពេញមួយជីវិត (Lifetime VIP)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1c2733] font-medium mb-1">
                    ឈ្មោះ Admin / អ្នកទិញ
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. Sokha / Master"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
                  />
                </div>
                <div>
                  <label className="block text-[#1c2733] font-medium mb-1">
                    Username Telegram
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. @sokha_admin"
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
                  />
                </div>
              </div>

              {/* Auto Enable Protection Checkbox */}
              <div className="bg-[#f8fafc] border border-[#e1e5eb] p-3 rounded-lg flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#1c2733] block">បើកការការពារភ្លាមៗ (Active Protection)</span>
                  <span className="text-[11px] text-[#708499] block">ស្កេនមេរោគ និងលុបសារ Spam ដោយស្វ័យប្រវត្តិ</span>
                </div>
                <input
                  type="checkbox"
                  checked={isAutoActive}
                  onChange={(e) => setIsAutoActive(e.target.checked)}
                  className="w-4 h-4 accent-[#2481cc] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e5eb]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#708499] rounded-lg font-medium border border-[#e1e5eb] transition-colors"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2481cc] hover:bg-[#1b64a0] text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  យល់ព្រមបន្ថែម Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sync from Telegram Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#e1e5eb] rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#e1e5eb] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <RefreshCw className={`w-5 h-5 ${isSyncing ? "animate-spin" : ""}`} />
                </div>
                <div>
                  <h3 className="font-bold text-[#1c2733] text-sm sm:text-base">
                    ហៅក្រុមពី Telegram (Sync Existing Groups)
                  </h3>
                  <p className="text-xs text-[#708499]">
                    ទាញយកក្រុមដែល Bot កំពុងស្ថិតនៅ ឬធ្លាប់ចូល មកក្នុងបញ្ជី CRM
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="w-8 h-8 rounded-lg text-[#708499] hover:text-[#1c2733] hover:bg-[#e1e5eb] flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#e1e5eb] bg-[#f8fafc] px-5 pt-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSyncTab("auto")}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  syncTab === "auto"
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent text-[#708499] hover:text-[#1c2733]"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>🔍 ស្កេនស្វ័យប្រវត្តិ (Auto-Scan)</span>
              </button>
              <button
                type="button"
                onClick={() => setSyncTab("bulk")}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  syncTab === "bulk"
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent text-[#708499] hover:text-[#1c2733]"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📋 បញ្ចូល / Paste Group IDs ច្រើន</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {syncTab === "auto" && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-[#1c2733] space-y-2">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>ដំណើរការស្កេនស្វ័យប្រវត្តិពី Telegram Bot</span>
                    </div>
                    <ul className="text-xs text-[#4b5d6e] space-y-1.5 list-disc list-inside">
                      <li>ប្រព័ន្ធនឹងស្កេន Telegram Bot API Updates ដើម្បីស្វែងរកក្រុមថ្មីៗ និងចាស់ៗ</li>
                      <li>ពិនិត្យកំណត់ត្រា Security Logs ដើម្បីទាញ Chat IDs ដែល Bot ធ្លាប់ទទួលបាន</li>
                      <li>ក្រុមដែលរកឃើញនឹងត្រូវបញ្ចូលទៅក្នុងបញ្ជីជា <strong>"រង់ចាំការអនុញ្ញាត (Pending)"</strong> ឬអាចបើក <strong>សាកល្បង ៧ ថ្ងៃ</strong> ភ្លាមៗ</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      💡 <strong>គន្លឹះ៖</strong> អ្នកក៏អាចវាយពាក្យបញ្ជា <code className="bg-white px-1.5 py-0.5 rounded font-mono text-blue-700 font-bold">/synclist</code> ឬ <code className="bg-white px-1.5 py-0.5 rounded font-mono text-blue-700 font-bold">/sync</code> នៅក្នុងក្រុម Telegram ដោយផ្ទាល់ ដើម្បីបញ្ជូនព័ត៌មានក្រុមមកផ្ទាំង Dashboard នេះបានភ្លាមៗ!
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => handleTriggerSync()}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl shadow-sm text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "កំពុងស្កេន និងទាញយកទិន្នន័យពី Telegram..." : "🚀 ចាប់ផ្តើមស្កេន និង Sync ក្រុមឥឡូវនេះ"}</span>
                  </button>
                </div>
              )}

              {syncTab === "bulk" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1c2733] mb-1">
                      បញ្ចូល ឬ Paste Chat IDs, Usernames ឬ Links (មួយបន្ទាត់មួយ):
                    </label>
                    <textarea
                      rows={5}
                      value={syncManualInput}
                      onChange={(e) => setSyncManualInput(e.target.value)}
                      placeholder={`-1002458931204
-1001987654321
@telegram_community_kh
https://t.me/my_vip_group`}
                      className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-xl p-3 text-xs font-mono text-[#1c2733] focus:outline-none focus:border-emerald-600 focus:bg-white resize-none"
                    />
                    <p className="text-[11px] text-[#708499] mt-1">
                      អ្នកអាចបញ្ចូល Group ID (ឧ. -100xxxxxxxxxx), Usernames (@groupname) ឬ Telegram links។
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSyncing || !syncManualInput.trim()}
                    onClick={() => handleTriggerSync(syncManualInput)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <DownloadCloud className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "កំពុងទាញយកទិន្នន័យ..." : "📥 ហៅ និង Sync ក្រុមទាំងអស់ដែលបាន Paste"}</span>
                  </button>
                </div>
              )}

              {/* Live Sync Results */}
              {syncResult && (
                <div className="mt-4 pt-4 border-t border-[#e1e5eb] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#1c2733] text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>លទ្ធផលនៃការ Sync (Scan Results)</span>
                    </h4>
                    <span className="text-[11px] text-[#708499]">
                      រកឃើញសរុប៖ <strong>{syncResult.total_discovered || 0}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                      <span className="block text-lg font-bold text-emerald-700">
                        {syncResult.newly_imported_count || 0}
                      </span>
                      <span className="text-[10px] text-emerald-800 font-medium">ក្រុមថ្មីបានបញ្ចូល</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <span className="block text-lg font-bold text-blue-700">
                        {syncResult.already_existing_count || 0}
                      </span>
                      <span className="text-[10px] text-blue-800 font-medium">ក្រុមមានស្រាប់ក្នុងបញ្ជី</span>
                    </div>
                  </div>

                  {syncResult.newly_imported && syncResult.newly_imported.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-[#1c2733] block">
                        🎉 បញ្ជីក្រុមថ្មីដែលទើបតែបានហៅចូល ({syncResult.newly_imported.length})៖
                      </span>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {syncResult.newly_imported.map((item: any) => (
                          <div
                            key={item.id}
                            className="bg-[#f8fafc] border border-[#e1e5eb] rounded-lg p-2.5 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-[#1c2733] text-xs truncate">
                                {item.title || "Telegram Group"}
                              </p>
                              <p className="font-mono text-[10px] text-[#708499]">
                                ID: {item.id} • ប្រភព: {item.source}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                await onGroupAction(item.id, "approve_trial_7d");
                                setShowSyncModal(false);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-md text-[10px] flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>🎁 អនុញ្ញាត ៧ ថ្ងៃ</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#708499] text-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      {syncResult.message || "ក្រុមទាំងអស់ដែលបានរកឃើញមាននៅក្នុងបញ្ជី CRM រួចរាល់ហើយ។"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#e1e5eb] bg-[#f8fafc] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="px-5 py-2 bg-white hover:bg-gray-100 text-[#1c2733] font-semibold rounded-lg border border-[#e1e5eb] text-xs transition-colors shadow-xs cursor-pointer"
              >
                បិទផ្ទាំង (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Group Deletion Confirmation Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#e1e5eb] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-[#1c2733] text-base">
                តើអ្នកពិតជាចង់លុប Group នេះមែនទេ?
              </h3>
              <p className="text-xs text-[#708499]">
                Group: <strong className="text-[#1c2733]">{groupToDelete.title}</strong>
                <br />
                <span className="font-mono text-[11px]">ID: {groupToDelete.id}</span>
              </p>
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100 mt-2">
                ⚠️ បន្ទាប់ពីលុប ទិន្នន័យអាជ្ញាប័ណ្ណ និងកំណត់ត្រា CRM របស់ក្រុមនេះនឹងត្រូវលុបចេញពីប្រព័ន្ធ។
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
                className="flex-1 py-2 bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#708499] rounded-lg font-medium border border-[#e1e5eb] text-xs transition-colors"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={confirmDeleteSingleGroup}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm text-xs transition-colors cursor-pointer"
              >
                🗑️ បញ្ជាក់ការលុប
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Groups Confirmation Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#e1e5eb] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-[#1c2733] text-base">
                តើអ្នកពិតជាចង់លុប Group ទាំងអស់ចេញពីប្រព័ន្ធមែនទេ?
              </h3>
              <p className="text-xs text-[#708499]">
                ក្រុម Telegram ចំនួន <strong>{groupKeys.length}</strong> និងទិន្នន័យ CRM ទាំងអស់នឹងត្រូវសម្អាតចោល ដើម្បីឱ្យអ្នកអាចបន្ថែមក្រុមផ្ទាល់ខ្លួនបានស្រួល។
              </p>
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100 mt-2 font-medium">
                ⚠️ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ!
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="flex-1 py-2 bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#708499] rounded-lg font-medium border border-[#e1e5eb] text-xs transition-colors"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm text-xs transition-colors cursor-pointer"
              >
                🗑️ សម្អាត និងលុបទាំងអស់
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
