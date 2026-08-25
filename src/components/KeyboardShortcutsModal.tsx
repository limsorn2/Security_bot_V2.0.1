import React from "react";
import {
  Keyboard,
  X,
  Command,
  Sliders,
  ShieldAlert,
  FileText,
  Terminal,
  Radio,
  Moon,
  Send,
  RefreshCw,
  Sparkles,
  Info
} from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  if (!isOpen) return null;

  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const modKey = isMac ? "⌘" : "Ctrl";

  const navigationShortcuts = [
    {
      keys: [modKey, "O"],
      title: "ផ្ទាំងទិដ្ឋភាពទូទៅ (Dashboard Overview)",
      description: "មើលស្ថិតិ KPI, Heatmap វាយប្រហារ និង AI Insights",
      tabId: "overview",
      icon: Radio
    },
    {
      keys: [modKey, "G"],
      title: "គ្រប់គ្រងក្រុម & អាជ្ញាប័ណ្ណ (Group Manager)",
      description: "គ្រប់គ្រងបញ្ជីក្រុម និង Anti-Flood / Anti-Malware Policy",
      tabId: "groups",
      icon: ShieldAlert
    },
    {
      keys: [modKey, "L"],
      title: "កំណត់ត្រាសន្តិសុខ (Security Audit Logs)",
      description: "ពិនិត្យមើល និងលុប/ទាញយកកំណត់ត្រាហេតុការណ៍",
      tabId: "logs",
      icon: FileText
    },
    {
      keys: [modKey, "S"],
      title: "កំណត់ការកំណត់ប្រព័ន្ធ (Bot Settings)",
      description: "កំណត់ Mute Duration, Blocked Extensions និង Backup",
      tabId: "settings",
      icon: Sliders
    },
    {
      keys: [modKey, "M"],
      title: "ឧបករណ៍តេស្តឆាតបត (Live Bot Simulator)",
      description: "សាកល្បងផ្ញើសារ Spam/Flood និង File .apk/.exe ក្លែងក្លាយ",
      tabId: "simulator",
      icon: Terminal
    },
    {
      keys: [modKey, "B"],
      title: "ផ្សាយពាណិជ្ជកម្ម (Channel Broadcast)",
      description: "ផ្ញើសារប្រកាសទៅកាន់ Channel ឬ Group Telegram",
      tabId: "broadcast",
      icon: Send
    }
  ];

  const systemShortcuts = [
    {
      keys: [modKey, "D"],
      title: "ប្តូរ Theme (Dark / Light Mode)",
      description: "បើក/បិទ Night Monitoring Theme ដើម្បីកាត់បន្ថយការចាំងភ្នែក",
      icon: Moon
    },
    {
      keys: [modKey, "K"],
      altKey: "?",
      title: "បើកផ្ទាំងជំនួយផ្លូវកាត់ក្តារចុច (Help Modal)",
      description: "បង្ហាញផ្ទាំងផ្លូវកាត់ក្តារចុចគ្រប់ពេលទាំងអស់",
      icon: Keyboard
    },
    {
      keys: ["Esc"],
      title: "បិទផ្ទាំង Modal (Close)",
      description: "បិទផ្ទាំងជំនួយ ឬផ្ទាំង Popup ណាមួយដែលកំពុងបើក",
      icon: X
    }
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1c2733] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#e1e5eb] dark:border-[#2d3b4a] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#e1e5eb] dark:border-[#2d3b4a] flex items-center justify-between bg-[#f8fafc] dark:bg-[#243343]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2481cc]/10 dark:bg-[#2481cc]/20 text-[#2481cc] dark:text-[#64b5f6] rounded-xl">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#1c2733] dark:text-white">
                  ផ្លូវកាត់ក្តារចុចប្រព័ន្ធ (Keyboard Shortcuts)
                </h3>
                <span className="text-[10px] font-mono bg-[#2481cc] text-white px-2 py-0.5 rounded font-bold">
                  TeleGuard Pro
                </span>
              </div>
              <p className="text-xs text-[#708499] dark:text-[#8a9fb5] mt-0.5">
                ប្រើបន្សំគ្រាប់ចុចនៅលើក្តារចុចដើម្បីបញ្ជា និងផ្លាស់ប្តូរផ្ទាំងបានរហ័ស
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#708499] hover:text-[#1c2733] dark:text-[#8a9fb5] dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            title="បិទផ្ទាំង (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Navigation */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#2481cc]" />
              <h4 className="text-xs font-bold text-[#1c2733] dark:text-white uppercase tracking-wider">
                ផ្លូវកាត់ប្តូរផ្ទាំងបញ្ជា (Quick Navigation)
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {navigationShortcuts.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (item.tabId) {
                        onNavigateTab(item.tabId);
                        onClose();
                      }
                    }}
                    className="p-3 rounded-xl border border-[#e1e5eb] dark:border-[#2d3b4a] bg-white dark:bg-[#243343] hover:border-[#2481cc] dark:hover:border-[#2481cc] hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#f1f4f9] dark:bg-[#1c2733] text-[#2481cc] dark:text-[#64b5f6] group-hover:scale-105 transition-transform shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1c2733] dark:text-white group-hover:text-[#2481cc] transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-[#708499] dark:text-[#8a9fb5]">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2.5 py-1 text-xs font-mono font-bold bg-[#f1f4f9] dark:bg-[#1c2733] text-[#1c2733] dark:text-white border border-[#d1d5db] dark:border-[#3b4b5c] rounded-md shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: System & Interface Controls */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold text-[#1c2733] dark:text-white uppercase tracking-wider">
                ផ្លូវកាត់បញ្ជាប្រព័ន្ធ (System Controls & Actions)
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {systemShortcuts.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-[#e1e5eb] dark:border-[#2d3b4a] bg-[#f8fafc] dark:bg-[#243343] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white dark:bg-[#1c2733] text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1c2733] dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-[#708499] dark:text-[#8a9fb5]">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-[#1c2733] text-[#1c2733] dark:text-white border border-[#d1d5db] dark:border-[#3b4b5c] rounded-md shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                      {item.altKey && (
                        <>
                          <span className="text-xs text-[#708499]">ឬ</span>
                          <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-[#1c2733] text-[#1c2733] dark:text-white border border-[#d1d5db] dark:border-[#3b4b5c] rounded-md shadow-2xs">
                            {item.altKey}
                          </kbd>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tip Box */}
          <div className="p-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs flex items-start gap-2.5 text-blue-900 dark:text-blue-200">
            <Info className="w-4 h-4 text-[#2481cc] shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px] leading-relaxed">
              <span className="font-bold">ព័ត៌មានបន្ថែម៖ </span>
              <span>
                ផ្លូវកាត់ក្តារចុចទាំងអស់នឹងមិនដំណើរការឡើយនៅពេលអ្នកកំពុងវាយអក្សរក្នុងប្រអប់បញ្ចូលទិន្នន័យ (Input Fields ឬ Textarea) ដើម្បីជៀសវាងការរំខានដល់ការងាររបស់អ្នក។
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e1e5eb] dark:border-[#2d3b4a] bg-[#f8fafc] dark:bg-[#1c2733] flex items-center justify-between text-xs">
          <span className="text-[#708499] dark:text-[#8a9fb5] text-[11px]">
            ចុច <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-[#2d3b4a] rounded font-mono text-[10px]">Esc</kbd> ដើម្បីចាកចេញ
          </span>

          <button
            onClick={onClose}
            className="bg-[#2481cc] hover:bg-[#1b64a0] text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            យល់ព្រម (Got it)
          </button>
        </div>
      </div>
    </div>
  );
};
