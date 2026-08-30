import React, { useState, useEffect } from "react";
import { GroupConfig, ClientCRM, SecurityAuditLog, BotSettings, SystemHealthInfo } from "../types";
import {
  Heart,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Bot,
  Languages,
  QrCode,
  Grid,
  ChevronRight,
  Wifi,
  Battery,
  Layers,
  Wallet,
  User,
  Home,
  Crown,
  Search,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  FileCheck,
  Zap,
  Sliders,
  Send,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  X,
  Copy,
  Radio,
  Clock,
  Smartphone
} from "lucide-react";

interface MobileAppPortalProps {
  groups: Record<string, GroupConfig>;
  clients: Record<string, ClientCRM>;
  logs: SecurityAuditLog[];
  settings: BotSettings;
  healthInfo: SystemHealthInfo | null;
  isLoading: boolean;
  onRefresh: () => void;
  onNavigateToTab: (tab: string) => void;
  onGroupAction: (groupId: string, action: string, payload?: any) => Promise<void>;
  onToggleMobilePreview?: () => void;
}

export const MobileAppPortal: React.FC<MobileAppPortalProps> = ({
  groups,
  clients,
  logs,
  settings,
  healthInfo,
  isLoading,
  onRefresh,
  onNavigateToTab,
  onGroupAction,
  onToggleMobilePreview
}) => {
  const [activeBottomTab, setActiveBottomTab] = useState<"home" | "all_apps" | "wallet" | "account">("home");
  const [selectedAppModal, setSelectedAppModal] = useState<string | null>(null);
  const [bannerSlide, setBannerSlide] = useState(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [qrGroupUrl, setQrGroupUrl] = useState("https://t.me/sornsecurityrobot?startgroup=true");
  const [topUpSelectedGroup, setTopUpSelectedGroup] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeString, setTimeString] = useState("9:56");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroidInstallModal, setShowAndroidInstallModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Capture PWA install prompt on Android
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const triggerAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowAndroidInstallModal(true);
    }
  };

  // Update clock in status bar
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, "0");
      setTimeString(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto carousel rotation
  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setBannerSlide((prev) => (prev === 0 ? 1 : 0));
    }, 4500);
    return () => clearInterval(bannerTimer);
  }, []);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const groupList = Object.values(groups) as GroupConfig[];
  const activeGroups = groupList.filter((g) => g.is_authorized && g.is_enabled);

  // 8 Core Primary Apps matching our existing system features
  const primaryApps = [
    {
      id: "overview",
      title: "ផ្ទាំងគ្រប់គ្រង",
      enTitle: "Dashboard",
      iconType: "dashboard",
      targetTab: "overview",
      description: "ផ្ទាំងគ្រប់គ្រងទូទៅ ពិនិត្យ Uptime, RAM, និងស្ថិតិ Bot ផ្ទាល់"
    },
    {
      id: "groups",
      title: "គ្រប់គ្រងក្រុម",
      enTitle: "Groups & License",
      iconType: "groups",
      targetTab: "groups",
      description: "គ្រប់គ្រងបញ្ជីគ្រុប Telegram, បន្ថែមថ្ងៃ និង Free Trial ៧ ថ្ងៃ"
    },
    {
      id: "simulator",
      title: "តេស្តឆាតបត",
      enTitle: "Bot Simulator",
      iconType: "simulator",
      targetTab: "simulator",
      description: "ឧបករណ៍តេស្តពាក្យបញ្ជា Bot ផ្ទាល់ (/start, /status, /admin)"
    },
    {
      id: "scanner",
      title: "ស្កេនមេរោគ",
      enTitle: "Malware Lab",
      iconType: "scanner",
      targetTab: "scanner",
      description: "មន្ទីរពិសោធន៍ស្កេនមេរោគ .apk, .exe និង VirusTotal API"
    },
    {
      id: "logs",
      title: "កំណត់ត្រាសន្តិសុខ",
      enTitle: "Audit Logs",
      iconType: "logs",
      targetTab: "logs",
      description: "កំណត់ត្រាចាប់មេរោគ .apk និងប្រវត្តិ Mute គណនីល្មើស"
    },
    {
      id: "clients",
      title: "បញ្ជីអតិថិជន",
      enTitle: "Clients CRM",
      iconType: "clients",
      targetTab: "clients",
      description: "ទិន្នន័យទំនាក់ទំនងម្ចាស់គ្រុប និងប្រវត្តិទិញកញ្ចប់សេវា"
    },
    {
      id: "broadcast",
      title: "ផ្សាយ Channel",
      enTitle: "Broadcast",
      iconType: "broadcast",
      targetTab: "broadcast",
      description: "ផ្ញើសារប្រកាសដំណឹងទៅកាន់ Telegram Channel @sornsecurityrobot"
    },
    {
      id: "settings",
      title: "កំណត់ប្រព័ន្ធ",
      enTitle: "Bot Settings",
      iconType: "settings",
      targetTab: "settings",
      description: "កំណត់ក្បួន Anti-Flood, File Extensions និងពេល Mute"
    }
  ];

  // Extended Apps for "All Apps" Tab
  const allAppsList = [
    ...primaryApps,
    {
      id: "code",
      title: "កូដប្រភព Bot",
      enTitle: "Python Code Hub",
      iconType: "code",
      targetTab: "code",
      description: "ទាញយកកូដប្រភព bot.py, .env និងការដំឡើងលើ VPS/Cloud"
    },
    {
      id: "qr_connect",
      title: "កូដ QR Add Bot",
      enTitle: "QR Invite",
      iconType: "qr",
      targetTab: "qr_modal",
      description: "QR Code សម្រាប់ Invite Bot ចូលគ្រុប Telegram ភ្លាមៗ"
    }
  ];

  const handleAppClick = (appId: string, targetTab?: string) => {
    if (targetTab === "qr_modal") {
      setSelectedAppModal("dg_qr");
      return;
    }

    if (targetTab) {
      onNavigateToTab(targetTab);
      return;
    }

    if (appId === "more") {
      setActiveBottomTab("all_apps");
      return;
    }

    onNavigateToTab(appId);
  };

  // Render Custom Authentic App Icons matching the design archetype
  const renderAppIcon = (iconType: string) => {
    switch (iconType) {
      case "dashboard":
        return (
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#00d2ff] to-[#0072ff] p-0.5 shadow-md flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#00c6ff] to-[#0072ff] flex items-center justify-center relative shadow-inner">
              <Radio className="w-6 h-6 text-white" />
              <span className="w-2 h-2 rounded-full bg-emerald-300 absolute top-2 right-2 animate-ping"></span>
            </div>
          </div>
        );
      case "groups":
        return (
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#2575fc] to-[#6a11cb] p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#2b5876] to-[#4e4376] flex items-center justify-center relative shadow-inner">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
          </div>
        );
      case "simulator":
        return (
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0072ff] to-[#00c6ff] p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[14px] bg-[#0c82f2] flex items-center justify-center relative shadow-inner">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center relative">
                <Bot className="w-6 h-6 text-white" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1"></span>
              </div>
            </div>
          </div>
        );
      case "scanner":
        return (
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#8a2387] via-[#e94057] to-[#f27121] p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#654ea3] to-[#8a2387] flex items-center justify-center relative shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
          </div>
        );
      case "logs":
        return (
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#ff416c] to-[#ff4b2b] p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#d31027] to-[#ea384d] flex items-center justify-center relative shadow-inner">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        );
      case "clients":
        return (
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#11998e] to-[#38ef7d] p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#0ba360] to-[#3cba92] flex items-center justify-center relative shadow-inner">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        );
      case "broadcast":
        return (
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#00c6ff] to-[#0072ff] p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#0072ff] to-[#0052cc] flex items-center justify-center relative shadow-inner">
              <Send className="w-5 h-5 text-white transform -rotate-12 translate-x-0.5" />
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#4b6cb7] to-[#182848] p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#3a6073] to-[#16222f] flex items-center justify-center relative shadow-inner">
              <Sliders className="w-5 h-5 text-cyan-300" />
            </div>
          </div>
        );
      case "code":
        return (
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center relative shadow-inner">
              <Bot className="w-5 h-5 text-purple-300" />
            </div>
          </div>
        );
      case "qr":
        return (
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#00d2ff] to-[#3a7bd5] p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center p-1.5">
              <div className="grid grid-cols-2 gap-1 w-full h-full">
                <div className="bg-[#00c6ff] rounded-[3px]"></div>
                <div className="bg-[#0072ff] rounded-[3px]"></div>
                <div className="bg-[#0072ff] rounded-[3px]"></div>
                <div className="bg-[#00c6ff] rounded-[3px]"></div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-blue-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-full w-full bg-[#f4f7fc] flex justify-center py-0 sm:py-6 px-0 sm:px-4 select-none">
      {/* Mobile Device Frame Container */}
      <div className="w-full max-w-[430px] bg-[#f8fafc] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative border-0 sm:border-8 sm:border-slate-800 min-h-[850px] sm:h-[880px]">
        
        {/* ================= 1. TOP HEADER / STATUS BAR ================= */}
        <div className="bg-gradient-to-b from-[#1b63d9] via-[#2072ee] to-[#257dfe] text-white pt-3 pb-8 px-5 rounded-b-[32px] shadow-md relative shrink-0">
          {/* Status Bar */}
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-white/95 pb-3">
            <div className="flex items-center gap-1.5">
              <span className="font-bold">{timeString}</span>
              <div className="w-3.5 h-3.5 bg-emerald-400/80 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-mono">285 KB/s</span>
              <span className="text-[9px] font-mono">VoLTE</span>
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5">
                <Battery className="w-4 h-4 fill-white" />
                <span className="text-[10px] font-mono">100</span>
              </div>
            </div>
          </div>

          {/* Profile Header Bar matching screenshot */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
              {/* User Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-700 overflow-hidden shadow-md flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    alt="LIM SORN"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // fallback to initials
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <span className="font-bold text-white text-sm">LS</span>
                </div>
                <span className="w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full absolute bottom-0 right-0"></span>
              </div>

              {/* Name & Link */}
              <div>
                <h2 className="font-extrabold text-base tracking-wide text-white flex items-center gap-1.5">
                  LIM SORN
                  <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                </h2>
                <button
                  onClick={() => setActiveBottomTab("account")}
                  className="text-xs text-white/80 hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  <span>View Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Cambodia Flag / Language Badge */}
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-sm">
              <span className="text-base leading-none">🇰🇭</span>
              <span className="text-[11px] font-bold text-white">KH</span>
            </div>
          </div>
        </div>

        {/* ================= SCROLLABLE CONTENT BODY ================= */}
        <div className="flex-1 overflow-y-auto px-4 -mt-5 space-y-4 pb-20 z-10 scrollbar-none">
          
          {activeBottomTab === "home" && (
            <>
              {/* ================= 2. DISCOVER MINI-APPS BANNER CARD ================= */}
              <div className="relative bg-gradient-to-r from-[#1752be] via-[#1d65e5] to-[#2575fc] text-white p-4 rounded-2xl shadow-lg overflow-hidden border border-white/20">
                {/* Background decorative shine & mini icons */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-400/20 rounded-full blur-xl pointer-events-none"></div>

                <div className="relative z-10 flex items-center justify-between">
                  <div className="max-w-[62%]">
                    <h3 className="font-extrabold text-base sm:text-lg leading-tight drop-shadow-sm">
                      {bannerSlide === 0 ? "Discover Mini-Apps in One Place!" : "🛡️ Telegram Security Bot V2.0.1"}
                    </h3>
                    <p className="text-[11px] text-white/85 mt-1 leading-snug">
                      {bannerSlide === 0
                        ? "Explore, Use, and Enjoy – All in the App Center."
                        : "ការពារមេរោគ .apk, Anti-Spam & Auto Free Trial ៧ ថ្ងៃ"}
                    </p>
                  </div>

                  {/* Visual 3D floating icons representation */}
                  <div className="relative w-24 h-20 flex items-center justify-center">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 flex items-center justify-center shadow-lg absolute top-0 right-1 transform rotate-6 animate-pulse">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-8 h-8 bg-amber-400/80 rounded-lg flex items-center justify-center shadow-md absolute bottom-0 left-2 transform -rotate-12">
                      <ShieldCheck className="w-5 h-5 text-slate-900" />
                    </div>
                    <div className="w-7 h-7 bg-purple-500/80 rounded-lg flex items-center justify-center shadow-md absolute bottom-1 right-2 transform rotate-12">
                      <Sparkles className="w-4 h-4 text-amber-200" />
                    </div>
                  </div>
                </div>

                {/* Carousel Pagination Dots */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <button
                    onClick={() => setBannerSlide(0)}
                    className={`h-1.5 rounded-full transition-all ${bannerSlide === 0 ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
                  />
                  <button
                    onClick={() => setBannerSlide(1)}
                    className={`h-1.5 rounded-full transition-all ${bannerSlide === 1 ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
                  />
                </div>
              </div>

              {/* ================= 3. MAIN APP GRID CARD (4x2 EXACT MATCH) ================= */}
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
                <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                  {primaryApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handleAppClick(app.id)}
                      className="flex flex-col items-center text-center group cursor-pointer active:scale-95 transition-transform"
                    >
                      {renderAppIcon(app.iconType)}
                      <span className="text-[11px] font-semibold text-slate-800 mt-2 truncate w-full group-hover:text-blue-600 transition-colors">
                        {app.title}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Helper sub-text matching image */}
                <div className="text-center mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 font-medium">
                    Tap “More” or “Swipe up” to see all apps
                  </p>
                  <button
                    onClick={triggerAndroidInstall}
                    className="text-[10px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 transition-all active:scale-95"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>{isInstalled ? "✅ បានដំឡើង" : "📲 ដំឡើងលើ Android"}</span>
                  </button>
                </div>
              </div>

              {/* ================= ANDROID INSTALL PROMO CARD ================= */}
              {!isInstalled && (
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-3.5 rounded-2xl shadow-md border border-indigo-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-sm shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-white">ដំឡើង App លើអេក្រង់ Android</h4>
                      <p className="text-[10px] text-slate-300">ប្រើប្រាស់ពេញអេក្រង់ Full-Screen ដូច Native App</p>
                    </div>
                  </div>
                  <button
                    onClick={triggerAndroidInstall}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl shadow-md shrink-0 active:scale-95 transition-transform"
                  >
                    ដំឡើងភ្លាម
                  </button>
                </div>
              )}

              {/* ================= 4. QUICK SYSTEM METRICS & LIVE STATS ================= */}
              <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                    <h4 className="font-bold text-xs text-slate-800">ស្ថានភាពការពារសកម្ម (Live Guard)</h4>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    Online 24/7
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-500">ក្រុមសកម្ម</p>
                    <p className="text-sm font-extrabold text-blue-600">{activeGroups.length}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-500">មេរោគរារាំង</p>
                    <p className="text-sm font-extrabold text-rose-600">{logs.length}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-500">អតិថិជន CRM</p>
                    <p className="text-sm font-extrabold text-purple-600">{Object.keys(clients).length}</p>
                  </div>
                </div>
              </div>

              {/* ================= 5. RECENT SECURITY LOGS FEED ================= */}
              <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    កំណត់ត្រាសន្តិសុខថ្មីៗ
                  </h4>
                  <button
                    onClick={() => onNavigateToTab("logs")}
                    className="text-[11px] text-blue-600 font-semibold hover:underline"
                  >
                    មើលទាំងអស់ →
                  </button>
                </div>

                {logs.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-xs">
                    ពុំទាន់មានការគំរាមកំហែងនៅឡើយទេ (ប្រព័ន្ធមានសុវត្ថិភាព 100%)
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.slice(0, 3).map((log, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start justify-between text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate">{log.chat_title || "Group Chat"}</p>
                          <p className="text-[10px] text-slate-500 truncate">{log.details}</p>
                        </div>
                        <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold shrink-0 ml-2">
                          Blocked
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ================= TAB 2: ALL APPS ================= */}
          {activeBottomTab === "all_apps" && (
            <div className="space-y-4 pt-2">
              <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
                <h3 className="font-extrabold text-sm text-slate-800 mb-2">មជ្ឈមណ្ឌលកម្មវិធី (App Center)</h3>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ស្វែងរកកម្មវិធី ឬមុខងារ..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {allAppsList
                  .filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || (a.enTitle && a.enTitle.toLowerCase().includes(searchQuery.toLowerCase())) || a.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handleAppClick(app.id, (app as any).targetTab)}
                      className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start text-left group hover:border-blue-300 transition-all cursor-pointer active:scale-95"
                    >
                      <div className="mb-2.5">{renderAppIcon(app.iconType)}</div>
                      <h4 className="font-bold text-xs text-slate-800 group-hover:text-blue-600">{app.title}</h4>
                      <p className="text-[10px] text-blue-600 font-medium">{app.enTitle}</p>
                      <p className="text-[9px] text-slate-500 mt-1 line-clamp-2">{app.description}</p>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* ================= TAB 3: PERSONAL WALLET ================= */}
          {activeBottomTab === "wallet" && (
            <div className="space-y-4 pt-2">
              {/* Master Wallet Card */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold">Personal Wallet & License</span>
                  <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
                <div className="mt-4">
                  <p className="text-xs text-slate-400">គណនី Master Super Admin</p>
                  <h3 className="text-2xl font-black tracking-tight text-white mt-0.5">ID: 240224709</h3>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-[9px] text-slate-400">ក្រុមសរុប</p>
                    <p className="font-bold text-amber-300">{groupList.length} Groups</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400">សិទ្ធិ VIP</p>
                    <p className="font-bold text-emerald-400">Master Level</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400">ស្ថានភាព</p>
                    <p className="font-bold text-cyan-300">Lifetime</p>
                  </div>
                </div>
              </div>

              {/* Quick TopUp Options */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  បញ្ចូលថ្ងៃ & អនុញ្ញាតអាជ្ញាប័ណ្ណ (Quick Top-Up)
                </h4>

                <div className="space-y-2">
                  {groupList.slice(0, 4).map((g) => (
                    <div
                      key={g.chat_id}
                      className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-slate-800 truncate">{g.title}</p>
                        <p className="text-[10px] text-slate-500 font-mono">ID: {g.chat_id}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onGroupAction(String(g.chat_id), "add_trial_7d")}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded text-[10px] font-bold"
                        >
                          +7 ថ្ងៃ
                        </button>
                        <button
                          onClick={() => onGroupAction(String(g.chat_id), "add_days", { days: 30 })}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded text-[10px] font-bold"
                        >
                          +30 ថ្ងៃ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: ACCOUNT PROFILE ================= */}
          {activeBottomTab === "account" && (
            <div className="space-y-4 pt-2">
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 text-center space-y-3">
                <div className="w-20 h-20 rounded-full mx-auto border-4 border-blue-500 shadow-lg overflow-hidden bg-slate-800 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    alt="LIM SORN"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">LIM SORN</h3>
                  <p className="text-xs text-blue-600 font-bold mt-0.5">Master Super Admin</p>
                  <p className="text-[11px] text-slate-400 mt-1">limsorn2@gmail.com</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-center gap-2">
                  <button
                    onClick={() => handleCopy("240224709", "Admin ID")}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl font-mono flex items-center gap-1.5"
                  >
                    <Copy className="w-3 h-3" />
                    <span>ID: 240224709</span>
                  </button>
                  <a
                    href="https://t.me/sornsecurityrobot"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>Telegram</span>
                  </a>
                </div>
              </div>

              {/* Quick Settings list */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 divide-y divide-slate-100 text-xs">
                <button
                  onClick={() => onNavigateToTab("settings")}
                  className="w-full p-2.5 flex items-center justify-between text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>ការកំណត់ប្រព័ន្ធសុវត្ថិភាព (Settings)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => onNavigateToTab("groups")}
                  className="w-full p-2.5 flex items-center justify-between text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>គ្រប់គ្រងបញ្ជីក្រុម & អាជ្ញាប័ណ្ណ (Groups)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => onNavigateToTab("code")}
                  className="w-full p-2.5 flex items-center justify-between text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2.5">
                    <Bot className="w-4 h-4 text-purple-600" />
                    <span>កូដប្រភព Python Bot & ការដំឡើង (Code Hub)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ================= 6. BOTTOM NAVIGATION BAR MATCHING SCREENSHOT ================= */}
        <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around shrink-0 z-20 shadow-lg">
          {/* 1. Home Tab */}
          <button
            onClick={() => setActiveBottomTab("home")}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
              activeBottomTab === "home" ? "text-blue-600 font-bold" : "text-slate-500 font-medium"
            }`}
          >
            <div
              className={`p-1 rounded-full transition-all ${
                activeBottomTab === "home" ? "bg-blue-600 text-white shadow-sm px-3" : "text-slate-500"
              }`}
            >
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Home</span>
          </button>

          {/* 2. All Apps Tab */}
          <button
            onClick={() => setActiveBottomTab("all_apps")}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
              activeBottomTab === "all_apps" ? "text-blue-600 font-bold" : "text-slate-500 font-medium"
            }`}
          >
            <div
              className={`p-1 rounded-full transition-all ${
                activeBottomTab === "all_apps" ? "bg-blue-600 text-white shadow-sm px-3" : "text-slate-500"
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px]">All Apps</span>
          </button>

          {/* 3. Personal Wallet Tab */}
          <button
            onClick={() => setActiveBottomTab("wallet")}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
              activeBottomTab === "wallet" ? "text-blue-600 font-bold" : "text-slate-500 font-medium"
            }`}
          >
            <div
              className={`p-1 rounded-full transition-all ${
                activeBottomTab === "wallet" ? "bg-blue-600 text-white shadow-sm px-3" : "text-slate-500"
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Personal Wallet</span>
          </button>

          {/* 4. Account Tab */}
          <button
            onClick={() => setActiveBottomTab("account")}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
              activeBottomTab === "account" ? "text-blue-600 font-bold" : "text-slate-500 font-medium"
            }`}
          >
            <div
              className={`p-1 rounded-full transition-all ${
                activeBottomTab === "account" ? "bg-blue-600 text-white shadow-sm px-3" : "text-slate-500"
              }`}
            >
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Account</span>
          </button>
        </div>

        {/* Android Navigation Indicator Bar at Bottom */}
        <div className="bg-white py-1 flex items-center justify-around border-t border-slate-100 text-slate-400 text-xs shrink-0">
          <div className="w-4 h-3 flex flex-col justify-between items-center opacity-60">
            <div className="w-3 h-0.5 bg-slate-400"></div>
            <div className="w-3 h-0.5 bg-slate-400"></div>
            <div className="w-3 h-0.5 bg-slate-400"></div>
          </div>
          <div className="w-3 h-3 border-2 border-slate-400 rounded-sm opacity-60"></div>
          <div className="w-0 h-0 border-t-4 border-b-4 border-r-6 border-t-transparent border-b-transparent border-r-slate-400 opacity-60"></div>
        </div>

      </div>

      {/* ================= INTERACTIVE MODALS FOR 8 MINI APPS ================= */}
      {selectedAppModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                {renderAppIcon(selectedAppModal)}
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">
                    {allAppsList.find((a) => a.id === selectedAppModal)?.title || "មុខងារប្រព័ន្ធ"}
                  </h3>
                  <p className="text-[10px] text-blue-600 font-bold">
                    {allAppsList.find((a) => a.id === selectedAppModal)?.enTitle || "Security Bot"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Specific Content */}
            {selectedAppModal === "myhealth" && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  ពិនិត្យមើលស្ថានភាពប្រតិបត្តិការរបស់ Telegram Security Engine និងការតភ្ជាប់ API ផ្ទាល់៖
                </p>
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Telegram Bot API:</span>
                    <span className="font-bold text-emerald-600">🟢 Connected (Online)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">VirusTotal Threat DB:</span>
                    <span className="font-bold text-emerald-600">🟢 Active Engine</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Auto-Delete Malware:</span>
                    <span className="font-bold text-blue-600">✅ .apk, .exe (30s Mute)</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedAppModal(null);
                    onNavigateToTab("overview");
                  }}
                  className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700"
                >
                  មើល Full Dashboard Overview →
                </button>
              </div>
            )}

            {selectedAppModal === "sim_verifier" && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  ឧបករណ៍ផ្ទៀងផ្ទាត់ Chat ID, Telegram User ID និងការទប់ស្កាត់ Flood Attack៖
                </p>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Master Super Admin:</span>
                    <span className="font-bold text-blue-600">240224709</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Anti-Flood Window:</span>
                    <span className="font-bold text-amber-600">5 msgs / 3 secs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mute Punishment:</span>
                    <span className="font-bold text-purple-600">24 Hours Auto</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedAppModal(null);
                    onNavigateToTab("settings");
                  }}
                  className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700"
                >
                  កែប្រែការកំណត់ Anti-Spam →
                </button>
              </div>
            )}

            {selectedAppModal === "topup" && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  ជ្រើសរើសក្រុមដើម្បីបន្ថែមថ្ងៃប្រើប្រាស់ ឬបើកសិទ្ធិ Free Trial ៧ ថ្ងៃស្វ័យប្រវត្តិ៖
                </p>
                <select
                  value={topUpSelectedGroup}
                  onChange={(e) => setTopUpSelectedGroup(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                >
                  <option value="">-- សូមជ្រើសរើសក្រុម (Select Group) --</option>
                  {groupList.map((g) => (
                    <option key={g.chat_id} value={String(g.chat_id)}>
                      {g.title} ({g.chat_id})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={!topUpSelectedGroup}
                    onClick={() => {
                      onGroupAction(topUpSelectedGroup, "add_trial_7d");
                      setSelectedAppModal(null);
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 p-2.5 rounded-xl font-bold disabled:opacity-50"
                  >
                    🎁 Free Trial 7 ថ្ងៃ
                  </button>
                  <button
                    disabled={!topUpSelectedGroup}
                    onClick={() => {
                      onGroupAction(topUpSelectedGroup, "add_days", { days: 30 });
                      setSelectedAppModal(null);
                    }}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 p-2.5 rounded-xl font-bold disabled:opacity-50"
                  >
                    ➕ បន្ថែម 30 ថ្ងៃ
                  </button>
                </div>
              </div>
            )}

            {selectedAppModal === "dg_frame" && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  ប្រព័ន្ធការពារ និងស្កេនមេរោគកម្រិតខ្ពស់ (Malware Defense Framework)៖
                </p>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5">
                  <p className="font-bold text-slate-700">🚫 ប្រភេទឯកសារដែលត្រូវបិទភ្លាមៗ៖</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {[".apk", ".xapk", ".exe", ".bat", ".cmd", ".scr", ".vbs", ".ps1"].map((ext) => (
                      <span key={ext} className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold border border-rose-200">
                        {ext}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedAppModal(null);
                    onNavigateToTab("scanner");
                  }}
                  className="w-full bg-purple-600 text-white font-bold py-2.5 rounded-xl hover:bg-purple-700"
                >
                  ចូលទៅ Malware Scanner Lab →
                </button>
              </div>
            )}

            {selectedAppModal === "dg_chatgpt" && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  តេស្តសាកល្បងការឆ្លើយតបរបស់ Telegram Bot ក្នុង Live Simulator និង AI Security Assistant៖
                </p>
                <button
                  onClick={() => {
                    setSelectedAppModal(null);
                    onNavigateToTab("simulator");
                  }}
                  className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-1.5"
                >
                  <Bot className="w-4 h-4" />
                  <span>បើកផ្ទាំង Bot Simulator ផ្ទាល់ →</span>
                </button>
              </div>
            )}

            {selectedAppModal === "translate_kh" && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  គោលការណ៍សន្តិសុខ និងពាក្យបញ្ជាជាភាសាខ្មែរផ្លូវការ៖
                </p>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                  <div>
                    <p className="font-bold text-blue-600 font-mono">/status</p>
                    <p className="text-slate-500 text-[11px]">ពិនិត្យស្ថានភាពសុវត្ថិភាព (សមាជិកទូទៅប្រើបាន)</p>
                  </div>
                  <div>
                    <p className="font-bold text-indigo-600 font-mono">/admin & /groups</p>
                    <p className="text-slate-500 text-[11px]">ផ្ទាំងបញ្ជា Master Super Admin (ID 240224709)</p>
                  </div>
                </div>
              </div>
            )}

            {selectedAppModal === "dg_qr" && (
              <div className="space-y-3 text-xs text-center">
                <p className="text-slate-600">
                  ស្កេន QR Code ឬចុច Link ដើម្បី Add Bot ចូលក្នុងគ្រុប Telegram ភ្លាមៗ៖
                </p>
                <div className="w-40 h-40 mx-auto bg-white p-3 rounded-2xl border-2 border-blue-500 shadow-md flex items-center justify-center">
                  <QrCode className="w-full h-full text-slate-800" />
                </div>
                <button
                  onClick={() => handleCopy("https://t.me/sornsecurityrobot?startgroup=true", "Invite Link")}
                  className="w-full bg-blue-50 text-blue-700 border border-blue-200 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedText ? `✅ បាន Copy ${copiedText}` : "Copy Telegram Invite Link"}</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= ANDROID PWA INSTALLATION GUIDE MODAL ================= */}
      {showAndroidInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">របៀបដំឡើងលើ Android</h3>
                  <p className="text-[10px] text-emerald-600 font-bold">Install as Android App (PWA)</p>
                </div>
              </div>
              <button
                onClick={() => setShowAndroidInstallModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                លោកអ្នកអាចដំឡើង Web App នេះឱ្យចេញជា <strong>រូបតំណាង App (Icon)</strong> លើអេក្រង់ដើមទូរស័ព្ទ Android ដោយគ្រាន់តែធ្វើតាម ៣ ជំហានងាយៗខាងក្រោម៖
              </p>

              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-slate-700">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">បើកតំណភ្ជាប់ក្នុង Google Chrome</p>
                    <p className="text-[10px] text-slate-500">បើក Link វេបសាយនេះលើទូរស័ព្ទ Android របស់អ្នក។</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">ចុចសញ្ញាចុច ៣ (Menu ⋮) ខាងលើស្ដាំ</p>
                    <p className="text-[10px] text-slate-500">ចុចលើប៊ូតុង Options របស់កម្មវិធី Chrome។</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="font-bold text-emerald-700">ជ្រើសយក "Install app" ឬ "Add to Home screen"</p>
                    <p className="text-[10px] text-slate-500">ចុច "Install / បន្ថែមទៅអេក្រង់ដើម" ជាការស្រេច!</p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-emerald-800 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ពេលដំឡើងរួច វានឹងដំណើរការពេញអេក្រង់ (Full-Screen) ដូច App ពិតៗ 100%!</span>
              </div>

              <button
                onClick={() => setShowAndroidInstallModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-colors"
              >
                យល់ព្រម (រួចរាល់)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
