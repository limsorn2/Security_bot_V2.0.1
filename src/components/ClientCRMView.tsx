import React, { useState } from "react";
import { ClientCRM } from "../types";
import { Users, Search, Crown, CheckCircle, ShieldAlert, History, Calendar, Phone, Hash } from "lucide-react";

interface ClientCRMViewProps {
  clients: Record<string, ClientCRM>;
}

export const ClientCRMView: React.FC<ClientCRMViewProps> = ({ clients }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const clientList = (Object.entries(clients) as [string, ClientCRM][]).filter(([id, c]) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      c.client_group_name.toLowerCase().includes(q) ||
      id.includes(q) ||
      c.customer_contact.name.toLowerCase().includes(q) ||
      c.customer_contact.username.toLowerCase().includes(q) ||
      c.customer_contact.user_id.includes(q);

    if (filterStatus === "active") {
      return matchSearch && c.license_status.includes("ACTIVE");
    }
    if (filterStatus === "lifetime") {
      return matchSearch && c.is_lifetime;
    }
    if (filterStatus === "unauth") {
      return matchSearch && !c.license_status.includes("ACTIVE");
    }
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-white border border-[#e1e5eb] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#1c2733] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2481cc]" />
            <span>ប្រព័ន្ធគ្រប់គ្រងអតិថិជន (Client CRM Vault)</span>
          </h2>
          <p className="text-xs text-[#708499] mt-0.5">
            ពិនិត្យមើលបញ្ជីអតិថិជន កញ្ចប់សេវា ថ្ងៃទិញ រយៈពេលនៅសល់ និងប្រវត្តិកំចាត់មេរោគលម្អិត
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#708499] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ស្វែងរកអតិថិជន..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e1e5eb] text-xs text-[#1c2733] pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-[#2481cc]"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#f8fafc] border border-[#e1e5eb] text-xs text-[#1c2733] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#2481cc]"
          >
            <option value="all">តម្រងទាំងអស់ ({Object.keys(clients).length})</option>
            <option value="active">🟢 Active អាជ្ញាប័ណ្ណ</option>
            <option value="lifetime">👑 Lifetime VIP</option>
            <option value="unauth">🔴 Expired / Unauth</option>
          </select>
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientList.map(([id, c]) => (
          <div
            key={id}
            className="bg-white border border-[#e1e5eb] hover:border-[#2481cc]/40 rounded-xl p-4 flex flex-col justify-between transition-all space-y-3 shadow-sm"
          >
            <div>
              {/* Group Name & Status Badge */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#e1e5eb]">
                <div>
                  <h3 className="font-bold text-[#1c2733] text-sm flex items-center gap-1.5">
                    <span className="truncate max-w-[180px]">{c.client_group_name}</span>
                    {c.is_lifetime && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  </h3>
                  <p className="text-[10px] text-[#708499] font-mono mt-0.5">
                    Group ID: <span className="text-[#2481cc]">{id}</span>
                  </p>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-medium border shrink-0 ${
                    c.license_status.includes("ACTIVE")
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {c.license_status}
                </span>
              </div>

              {/* Customer Contact Details */}
              <div className="mt-3 bg-[#f8fafc] border border-[#e1e5eb] rounded-lg p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#708499] text-[11px]">👤 អតិថិជន៖</span>
                  <span className="font-bold text-[#1c2733] text-[11px]">{c.customer_contact.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#708499] text-[11px]">💬 Telegram៖</span>
                  <span className="font-mono text-[#2481cc] font-medium text-[11px]">{c.customer_contact.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#708499] text-[11px]">🔢 User ID៖</span>
                  <span className="font-mono text-[#708499] text-[11px]">{c.customer_contact.user_id}</span>
                </div>
              </div>

              {/* Plan & Dates */}
              <div className="mt-2.5 text-[11px] space-y-1 text-[#1c2733]">
                <div className="flex items-center justify-between">
                  <span className="text-[#708499]">🛒 កញ្ចប់៖</span>
                  <span className="font-bold text-amber-600">{c.plan_type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#708499]">📅 ថ្ងៃទិញ៖</span>
                  <span className="font-mono text-[#708499]">{c.activated_date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#708499]">⌛ ផុតកំណត់៖</span>
                  <span className="font-mono text-rose-600 font-medium">{c.expiry_date}</span>
                </div>
              </div>

              {/* Security Shield Stats */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-rose-50 border border-rose-100 rounded-lg p-2">
                  <div className="text-rose-600 font-bold text-sm font-mono">
                    {c.security_stats.threats_blocked}
                  </div>
                  <div className="text-[10px] text-[#708499]">មេរោគកំចាត់</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                  <div className="text-[#2481cc] font-bold text-sm font-mono">
                    {c.security_stats.spams_blocked}
                  </div>
                  <div className="text-[10px] text-[#708499]">Flood Spams</div>
                </div>
              </div>

              {/* Purchase History */}
              {c.purchase_history && c.purchase_history.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#e1e5eb] text-[11px] text-[#708499]">
                  <div className="font-bold text-[#1c2733] flex items-center gap-1 mb-1 text-[11px]">
                    <History className="w-3 h-3 text-[#2481cc]" />
                    <span>ប្រវត្តិទិញបត ({c.purchase_history.length})</span>
                  </div>
                  <div className="space-y-1">
                    {c.purchase_history.slice(-2).map((p, idx) => (
                      <div key={idx} className="bg-[#f8fafc] px-2 py-1 rounded text-[#1c2733] font-mono text-[10px] flex justify-between border border-[#e1e5eb]">
                        <span>{p.package}</span>
                        <span className="text-[#708499]">{p.purchased_date.substring(0, 10)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 text-[10px] text-[#708499] text-right border-t border-[#e1e5eb]/60">
              ហេតុការណ៍ចុងក្រោយ៖ {c.security_stats.last_incident}
            </div>
          </div>
        ))}

        {clientList.length === 0 && (
          <div className="col-span-full bg-white border border-[#e1e5eb] rounded-xl p-12 text-center text-[#708499] text-xs shadow-sm">
            មិនមានទិន្នន័យអតិថិជនត្រូវតាមលក្ខខណ្ឌតម្រងឡើយ
          </div>
        )}
      </div>
    </div>
  );
};
