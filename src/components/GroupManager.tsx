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
  Info
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
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    Object.keys(groups)[0] || null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [newGroupId, setNewGroupId] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");

  const groupList = (Object.entries(groups) as [string, GroupConfig][]).filter(([id, g]) => {
    const q = searchTerm.toLowerCase();
    return g.title.toLowerCase().includes(q) || id.includes(q) || (g.added_by_name || "").toLowerCase().includes(q);
  });

  const selectedGroup = selectedGroupId ? groups[selectedGroupId] : null;
  const selectedClient = selectedGroupId ? clients[selectedGroupId] : null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupId || !newGroupTitle) return;
    await onGroupAction(newGroupId, "add_days", {
      title: newGroupTitle,
      days: 30,
      addedByName: newAdminName || "Group Admin",
      addedByUsername: newAdminUsername || "@admin"
    });
    setNewGroupTitle("");
    setNewGroupId("");
    setNewAdminName("");
    setNewAdminUsername("");
    setShowAddModal(false);
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
            <span>ផ្ទាំងគ្រប់គ្រងក្រុម & កំណត់អាជ្ញាប័ណ្ណ (Group License Config)</span>
          </h2>
          <p className="text-xs text-[#708499] mt-0.5">
            ចុចលើ Group ណាមួយដើម្បីពិនិត្យ Profile, បន្ថែមថ្ងៃប្រើប្រាស់ (+30D / +90D / VIP) ឬបិទ/បើកសិទ្ធិ
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#708499] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះ ឬ ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e1e5eb] text-xs text-[#1c2733] pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-[#2481cc]"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#2481cc] hover:bg-[#1b64a0] text-white font-medium px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>បន្ថែម Group</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Group List + Submenu Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5/12): Group Selection List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-[11px] font-bold text-[#708499] uppercase tracking-wider px-1">
            បញ្ជីក្រុម Telegram ({groupList.length})
          </div>

          <div className="space-y-2">
            {groupList.map(([id, g]) => {
              const isSelected = selectedGroupId === id;
              const isActive = g.is_authorized && g.is_enabled;
              const isPaused = g.is_authorized && !g.is_enabled;

              return (
                <div
                  key={id}
                  onClick={() => setSelectedGroupId(id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#2481cc]/10 border-[#2481cc] shadow-sm ring-1 ring-[#2481cc]/20"
                      : "bg-white border-[#e1e5eb] hover:border-[#2481cc]/40 hover:bg-[#f8fafc]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isActive
                            ? "bg-emerald-500"
                            : isPaused
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      ></span>
                      <span className="font-bold text-[#1c2733] text-xs truncate max-w-[180px]">
                        {g.title}
                      </span>
                    </div>

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
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#708499]">
                    <span className="font-mono text-[10px]">ID: {id}</span>
                    <span className="text-[#1c2733] font-medium">{getRemainingDays(g.expiry_date, g.is_lifetime)}</span>
                  </div>
                </div>
              );
            })}

            {groupList.length === 0 && (
              <div className="bg-white border border-[#e1e5eb] rounded-xl p-8 text-center text-[#708499] text-xs">
                មិនមាន Group ណាមួយត្រូវតាមពាក្យស្វែងរកឡើយ
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7/12): Detailed Group Submenu & Control Buttons */}
        <div className="lg:col-span-7">
          {selectedGroup && selectedGroupId ? (
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
                    Group ID: <span className="text-[#2481cc] font-semibold">{selectedGroupId}</span> | ចុះឈ្មោះ៖ {selectedGroup.added_at}
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
                  <span className="text-[#708499] uppercase font-bold text-[10px] tracking-wider">ព័ត៌មានអតិថិជន</span>
                  <div className="font-bold text-[#1c2733] text-xs flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#2481cc]" />
                    <span>{selectedGroup.added_by_name || "N/A"}</span>
                  </div>
                  <div className="text-[#708499] text-[11px] font-mono truncate">
                    {selectedGroup.added_by_username || "@unknown"} (ID: {selectedGroup.added_by_id || "N/A"})
                  </div>
                </div>

                <div className="bg-[#f8fafc] border border-[#e1e5eb] p-3 rounded-lg space-y-1">
                  <span className="text-[#708499] uppercase font-bold text-[10px] tracking-wider">កាលបរិច្ឆេទសកម្ម</span>
                  <div className="text-[#1c2733] text-[11px]">ថ្ងៃចាប់ផ្ដើម៖ <span className="font-mono">{selectedGroup.activated_date}</span></div>
                  <div className="text-[#1c2733] text-[11px]">ថ្ងៃផុតកំណត់៖ <span className="font-mono text-amber-600 font-bold">{selectedGroup.expiry_date}</span></div>
                </div>

                <div className="bg-[#f8fafc] border border-[#e1e5eb] p-3 rounded-lg space-y-1">
                  <span className="text-[#708499] uppercase font-bold text-[10px] tracking-wider">ស្ថិតិការពារ (Threat Stats)</span>
                  <div className="text-[#1c2733] text-[11px]">☣️ មេរោគបានទប់ស្កាត់៖ <span className="font-bold text-rose-600 font-mono">{selectedGroup.threats_blocked_count}</span></div>
                  <div className="text-[#1c2733] text-[11px]">🌊 Anti-Flood Spam៖ <span className="font-bold text-[#2481cc] font-mono">{selectedClient?.security_stats.spams_blocked || 0}</span></div>
                </div>
              </div>

              {/* Action Buttons Section */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-[#1c2733] flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>ប៊ូតុងបញ្ជា & កំណត់សិទ្ធិ (Master Action Sub-menus)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-medium">
                  {/* +30 Days */}
                  <button
                    disabled={isLoading}
                    onClick={() => onGroupAction(selectedGroupId, "add_days", { days: 30 })}
                    className="bg-[#2481cc]/10 hover:bg-[#2481cc]/20 text-[#2481cc] border border-[#2481cc]/30 p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#2481cc]" />
                    <span>➕ បន្ថែម 30 ថ្ងៃ</span>
                  </button>

                  {/* +90 Days */}
                  <button
                    disabled={isLoading}
                    onClick={() => onGroupAction(selectedGroupId, "add_days", { days: 90 })}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>➕ បន្ថែម 90 ថ្ងៃ</span>
                  </button>

                  {/* Lifetime VIP */}
                  <button
                    disabled={isLoading}
                    onClick={() => onGroupAction(selectedGroupId, "set_lifetime")}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>👑 ពេញមួយជីវិត (VIP)</span>
                  </button>

                  {/* Toggle ON/PAUSE */}
                  <button
                    disabled={isLoading}
                    onClick={() => onGroupAction(selectedGroupId, "toggle_enable")}
                    className={`p-2.5 rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
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
                    onClick={() => onGroupAction(selectedGroupId, "revoke")}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>🔴 ដកសិទ្ធិ (Revoke)</span>
                  </button>

                  {/* Delete Group */}
                  <button
                    disabled={isLoading}
                    onClick={() => {
                      if (confirm(`តើអ្នកពិតជាចង់លុប Group "${selectedGroup.title}" ចេញពីបញ្ជីគ្រប់គ្រងមែនទេ?`)) {
                        onGroupAction(selectedGroupId, "delete");
                        setSelectedGroupId(null);
                      }
                    }}
                    className="bg-[#f8fafc] hover:bg-rose-50 text-[#708499] hover:text-rose-700 border border-[#e1e5eb] hover:border-rose-200 p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>🗑️ លុប Group</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#e1e5eb] rounded-xl p-12 text-center text-[#708499] text-xs shadow-sm">
              សូមជ្រើសរើស Group ណាមួយនៅខាងឆ្វេងដើម្បីមើលព័ត៌មាន និងកំណត់សិទ្ធិ
            </div>
          )}
        </div>
      </div>

      {/* Add Group Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#e1e5eb] rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e5eb]">
              <h3 className="font-bold text-[#1c2733] text-sm">➕ បន្ថែម Group Telegram ថ្មី</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#708499] hover:text-[#1c2733]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#1c2733] font-medium mb-1">
                  ឈ្មោះ Group Telegram *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. VIP Business Group"
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <div>
                <label className="block text-[#1c2733] font-medium mb-1">
                  លេខ Group ID (Chat ID) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. -1002458931204"
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-[#1c2733] font-mono focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1c2733] font-medium mb-1">
                    ឈ្មោះ Admin / អតិថិជន
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. Sokha"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-[#e1e5eb] rounded-lg px-3 py-2 text-[#1c2733] focus:outline-none focus:border-[#2481cc]"
                  />
                </div>
                <div>
                  <label className="block text-[#1c2733] font-medium mb-1">
                    Username
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

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 bg-[#f8fafc] hover:bg-[#f1f4f9] text-[#708499] rounded-lg font-medium border border-[#e1e5eb]"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#2481cc] hover:bg-[#1b64a0] text-white font-medium rounded-lg shadow-sm"
                >
                  យល់ព្រមបន្ថែម
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
