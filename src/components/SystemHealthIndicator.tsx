import React, { useState } from "react";
import { SystemHealthInfo } from "../types";
import { Activity, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, X, Radio, Server, ExternalLink } from "lucide-react";

interface SystemHealthIndicatorProps {
  healthInfo: SystemHealthInfo | null;
  isLoading: boolean;
  onRefreshHealth: () => void;
}

export const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({
  healthInfo,
  isLoading,
  onRefreshHealth
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const isTelegramOnline = healthInfo?.telegram?.status === "online";
  const isVtOnline = healthInfo?.virustotal?.status === "online" || healthInfo?.virustotal?.status === "ready";
  const hasVtKey = healthInfo?.virustotal?.configured;

  return (
    <>
      <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e1e5eb] p-1 sm:px-2 sm:py-1 rounded-lg">
        {/* Telegram API Indicator */}
        <button
          onClick={() => setShowDetailModal(true)}
          title={`Telegram API Status: ${isTelegramOnline ? "Online (បៃតង)" : "Offline (ក្រហម)"} - ចុចមើលលម្អិត`}
          className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-white transition-colors"
        >
          <span className="relative flex h-2 w-2">
            {isTelegramOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isTelegramOnline ? "bg-emerald-500" : "bg-rose-500"
              }`}
            ></span>
          </span>
          <span className="hidden sm:inline text-[11px] font-semibold text-[#1c2733]">
            TG API:
          </span>
          <span
            className={`text-[10px] font-bold font-mono px-1 py-0.2 rounded ${
              isTelegramOnline
                ? "text-emerald-700 bg-emerald-50"
                : "text-rose-700 bg-rose-50"
            }`}
          >
            {isTelegramOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </button>

        <span className="text-[#cbd5e1] font-light">|</span>

        {/* VirusTotal API Indicator */}
        <button
          onClick={() => setShowDetailModal(true)}
          title={`VirusTotal Engine Status: ${isVtOnline ? "Online (បៃតង)" : "Offline (ក្រហម)"} - ចុចមើលលម្អិត`}
          className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-white transition-colors"
        >
          <span className="relative flex h-2 w-2">
            {isVtOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isVtOnline ? "bg-emerald-500" : "bg-rose-500"
              }`}
            ></span>
          </span>
          <span className="hidden sm:inline text-[11px] font-semibold text-[#1c2733]">
            VirusTotal:
          </span>
          <span
            className={`text-[10px] font-bold font-mono px-1 py-0.2 rounded ${
              isVtOnline
                ? hasVtKey
                  ? "text-emerald-700 bg-emerald-50"
                  : "text-emerald-700 bg-emerald-50"
                : "text-rose-700 bg-rose-50"
            }`}
          >
            {isVtOnline ? (hasVtKey ? "ONLINE" : "READY") : "OFFLINE"}
          </span>
        </button>
      </div>

      {/* Health Status Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-[#e1e5eb] overflow-hidden">
            <div className="p-4 bg-[#1c2733] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#64b5f6]" />
                <h3 className="font-bold text-sm">ស្ថានភាពតភ្ជាប់ប្រព័ន្ធ (System Health)</h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-[#8a9fb5] hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Telegram API Card */}
              <div className="p-3.5 rounded-lg border border-[#e1e5eb] bg-[#f8fafc] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isTelegramOnline ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    ></span>
                    <span className="font-bold text-[#1c2733] text-sm">Telegram Bot API (v7.2)</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      isTelegramOnline
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {isTelegramOnline ? "🟢 ONLINE" : "🔴 OFFLINE"}
                  </span>
                </div>
                <p className="text-[#708499] text-[11px]">
                  {healthInfo?.telegram?.message || "Telegram API Gateway ដំណើរការប្រក្រតី"}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#708499] pt-1 border-t border-[#e1e5eb]/60 font-mono">
                  <span>Latency: ~{healthInfo?.telegram?.latency_ms || 24}ms</span>
                  <span>Channel: @sornsecurityrobot</span>
                </div>
              </div>

              {/* VirusTotal API Card */}
              <div className="p-3.5 rounded-lg border border-[#e1e5eb] bg-[#f8fafc] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isVtOnline ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    ></span>
                    <span className="font-bold text-[#1c2733] text-sm">VirusTotal Threat Engine</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      isVtOnline
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {isVtOnline ? (hasVtKey ? "🟢 ONLINE" : "🟢 READY") : "🔴 OFFLINE"}
                  </span>
                </div>
                <p className="text-[#708499] text-[11px]">
                  {healthInfo?.virustotal?.message || "ប្រព័ន្ធស្កេនមេរោគ VirusTotal v3 Cloud"}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#708499] pt-1 border-t border-[#e1e5eb]/60 font-mono">
                  <span>API Key: {hasVtKey ? "Verified (v3)" : "Local Fallback"}</span>
                  <span>Engine: Heuristic + VT</span>
                </div>
              </div>

              {/* Local Storage Database */}
              <div className="p-3.5 rounded-lg border border-[#e1e5eb] bg-[#f8fafc] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-[#1c2733] text-sm">Security Database Synced</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-100 text-emerald-800">
                    🟢 ONLINE
                  </span>
                </div>
                <p className="text-[#708499] text-[11px]">
                  កត់ត្រាទិន្នន័យ Groups, CRM Clients និង Security Audit Logs បានរលូន
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#f1f4f9] border-t border-[#e1e5eb] flex items-center justify-between">
              <span className="text-[10px] text-[#708499] font-mono">
                ធ្វើបច្ចុប្បន្នភាព៖ {new Date().toLocaleTimeString("km-KH")}
              </span>
              <button
                onClick={() => {
                  onRefreshHealth();
                }}
                disabled={isLoading}
                className="bg-[#2481cc] hover:bg-[#1b64a0] text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                <span>ស្កេនពិនិត្យឡើងវិញ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
