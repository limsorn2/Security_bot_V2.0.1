import React from "react";
import {
  Shield,
  ShieldAlert,
  Send,
  Radio,
  RefreshCw,
  Terminal,
  Users,
  FileText,
  Bug,
  Crown,
  ExternalLink,
  Sliders,
  Keyboard,
  HelpCircle
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  totalThreats: number;
  onOpenHelp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isLoading,
  totalThreats,
  onOpenHelp
}) => {
  const navItems = [
    { id: "overview", label: "ផ្ទាំងគ្រប់គ្រងទូទៅ (Dashboard)", icon: Radio },
    { id: "simulator", label: "ឧបករណ៍តេស្តឆាតបត (Simulator)", icon: Terminal },
    { id: "settings", label: "កំណត់ការកំណត់ប្រព័ន្ធ (Settings)", icon: Sliders },
    { id: "groups", label: "គ្រប់គ្រងក្រុម & អាជ្ញាប័ណ្ណ (Groups)", icon: ShieldAlert },
    { id: "clients", label: "បញ្ជីអតិថិជន & ប្រវត្តិទិញ (CRM)", icon: Users },
    { id: "logs", label: `កំណត់ត្រាសន្តិសុខ (${totalThreats})`, icon: FileText },
    { id: "scanner", label: "មន្ទីរពិសោធន៍ស្កេនមេរោគ (.apk)", icon: Bug },
    { id: "broadcast", label: "ផ្សាយពាណិជ្ជកម្មទៅ Channel", icon: Send },
    { id: "code", label: "កូដប្រភព Python & ការដំឡើង", icon: Terminal }
  ];

  return (
    <aside className="w-64 bg-[#1c2733] text-white flex flex-col border-r border-[#2d3b4a] shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#2d3b4a] flex items-center gap-3">
        <div className="w-10 h-10 bg-[#2481cc] rounded-full flex items-center justify-center text-xl font-bold text-white shadow-sm shrink-0">
          T
        </div>
        <div className="leading-tight min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-sm text-white truncate">TeleGuard Pro</h1>
            <span className="text-[9px] bg-[#2481cc]/25 text-[#64b5f6] border border-[#2481cc]/40 px-1.5 py-0.2 rounded font-mono">
              v2.5
            </span>
          </div>
          <p className="text-[10px] text-[#708499] truncate">ប្រព័ន្ធគ្រប់គ្រងសន្តិសុខ Telegram</p>
        </div>
      </div>

      {/* Master Owner Info Card */}
      <div className="px-4 pt-3 pb-1">
        <div className="bg-[#243343] border border-[#2d3b4a] rounded-lg p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="leading-tight">
              <p className="text-[9px] text-[#708499] uppercase font-bold tracking-wider">ម្ចាស់បតផ្ទាល់ (Master Owner)</p>
              <p className="text-[11px] font-mono font-bold text-amber-300">240224709</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold text-[#708499] px-2 py-1 tracking-wider">
          មឺនុយមេ (Main Menu)
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`p-2.5 rounded-lg text-xs flex items-center gap-3 text-left transition-all ${
                isActive
                  ? "bg-[#2481cc] text-white font-medium shadow-sm"
                  : "text-[#8a9fb5] hover:bg-[#2d3b4a] hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#708499]"}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        {/* Official Channel & Shortcuts Links */}
        <div className="mt-2 pt-2 border-t border-[#2d3b4a]/80 space-y-1">
          <a
            href="https://t.me/sornsecurityrobot"
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-lg text-xs flex items-center justify-between text-[#64b5f6] hover:bg-[#2d3b4a] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Send className="w-3.5 h-3.5 text-[#2481cc]" />
              <span className="font-mono text-[11px]">@sornsecurityrobot</span>
            </div>
            <ExternalLink className="w-3 h-3 text-[#708499] group-hover:text-white" />
          </a>

          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className="w-full p-2 rounded-lg text-xs flex items-center justify-between text-[#8a9fb5] hover:bg-[#2d3b4a] hover:text-white transition-all text-left"
              title="ផ្លូវកាត់ក្តារចុច (Ctrl+K)"
            >
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                <span>ផ្លូវកាត់ក្តារចុច</span>
              </div>
              <kbd className="text-[9px] font-mono bg-[#1c2733] text-[#8a9fb5] px-1.5 py-0.5 rounded border border-[#2d3b4a]">
                Ctrl+K
              </kbd>
            </button>
          )}
        </div>

        {/* API Status Box */}
        <div className="mt-auto p-2">
          <div className="bg-[#243343] p-3 rounded-lg border border-[#2d3b4a]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-[#708499] font-bold uppercase tracking-wider">ស្ថានភាពតភ្ជាប់ (Gateway)</p>
              <button
                onClick={onRefresh}
                disabled={isLoading}
                title="ទាញយកទិន្នន័យឡើងវិញ"
                className="text-[#708499] hover:text-white transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#64b5f6]" : ""}`} />
              </button>
            </div>
            <p className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>បានតភ្ជាប់៖ 21ms (សកម្ម)</span>
            </p>
          </div>
        </div>
      </nav>
    </aside>
  );
};
