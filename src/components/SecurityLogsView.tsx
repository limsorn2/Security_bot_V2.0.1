import React, { useState } from "react";
import { SecurityAuditLog } from "../types";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  Search,
  Zap,
  Bug,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  X,
  Shield,
  Crown,
  Trash2,
  CheckSquare,
  Square
} from "lucide-react";

interface SecurityLogsViewProps {
  logs: SecurityAuditLog[];
  onAddSimulatedLog: () => void;
  onRefreshLogs?: () => void;
}

export const SecurityLogsView: React.FC<SecurityLogsViewProps> = ({
  logs,
  onAddSimulatedLog,
  onRefreshLogs
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Bulk Selection States
  const [selectedTimestamps, setSelectedTimestamps] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.trim().toLowerCase();
    const matchSearch =
      !q ||
      log.user_name.toLowerCase().includes(q) ||
      log.user_id.toLowerCase().includes(q) ||
      log.chat_id.toLowerCase().includes(q) ||
      log.chat_title.toLowerCase().includes(q) ||
      log.event_type.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q);

    if (filterType === "malware") {
      return matchSearch && log.event_type.includes("MALWARE");
    }
    if (filterType === "flood") {
      return matchSearch && log.event_type.includes("FLOOD");
    }
    if (filterType === "archive") {
      return matchSearch && log.event_type.includes("ARCHIVE");
    }
    return matchSearch;
  });

  const isAllFilteredSelected =
    filteredLogs.length > 0 &&
    filteredLogs.every((l) => selectedTimestamps.includes(l.timestamp));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Deselect filtered
      const filteredSet = new Set(filteredLogs.map((l) => l.timestamp));
      setSelectedTimestamps(selectedTimestamps.filter((ts) => !filteredSet.has(ts)));
    } else {
      // Select all filtered
      const combined = Array.from(
        new Set([...selectedTimestamps, ...filteredLogs.map((l) => l.timestamp)])
      );
      setSelectedTimestamps(combined);
    }
  };

  const handleToggleSelectLog = (timestamp: string) => {
    if (selectedTimestamps.includes(timestamp)) {
      setSelectedTimestamps(selectedTimestamps.filter((ts) => ts !== timestamp));
    } else {
      setSelectedTimestamps([...selectedTimestamps, timestamp]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTimestamps.length === 0) return;
    if (
      !window.confirm(
        `តើអ្នកពិតជាចង់លុបកំណត់ត្រាចំនួន ${selectedTimestamps.length} នេះចេញពីប្រព័ន្ធមែនទេ?`
      )
    ) {
      return;
    }

    setIsDeletingBulk(true);
    try {
      const res = await fetch("/api/logs/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timestamps: selectedTimestamps })
      }).then((r) => r.json());

      if (res.success) {
        setDeleteMessage(`បានលុបកំណត់ត្រាសន្តិសុខ ${selectedTimestamps.length} ជោគជ័យ!`);
        setSelectedTimestamps([]);
        if (onRefreshLogs) onRefreshLogs();
        setTimeout(() => setDeleteMessage(null), 3500);
      }
    } catch {
      setDeleteMessage("បរាជ័យក្នុងការលុបកំណត់ត្រា!");
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // Professional Security Report CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    // Standard and comprehensive column headers
    const headers = [
      "Timestamp",
      "Chat Title",
      "User ID",
      "Blocked Content / Threat Type",
      "Chat ID",
      "Sender User Name",
      "Incident Details",
      "Mitigation Action",
      "Security Severity Level"
    ];

    const rows = filteredLogs.map((log) => {
      const isMalware = log.event_type.includes("MALWARE");
      const isFlood = log.event_type.includes("FLOOD");
      const severity = isMalware ? "CRITICAL (High Threat)" : isFlood ? "MEDIUM (Anti-Spam)" : "INFORMATIONAL";

      // Detect blocked content type explicitly
      let blockedContentType = log.event_type || "Threat Incident";
      const details = (log.details || "").toLowerCase();
      if (details.includes(".apk")) blockedContentType = "Android Malware (.apk)";
      else if (details.includes(".exe")) blockedContentType = "Windows Executable (.exe)";
      else if (details.includes(".scr")) blockedContentType = "Screensaver Payload (.scr)";
      else if (details.includes(".bat")) blockedContentType = "Batch Script (.bat)";
      else if (isFlood || details.includes("flood") || details.includes("spam")) blockedContentType = "Anti-Flood / Spam";
      else if (details.includes("virustotal")) blockedContentType = "VirusTotal Malicious Hash";

      return [
        `"${(log.timestamp || "").replace(/"/g, '""')}"`,
        `"${(log.chat_title || "").replace(/"/g, '""')}"`,
        `"${(log.user_id || "").replace(/"/g, '""')}"`,
        `"${blockedContentType.replace(/"/g, '""')}"`,
        `"${(log.chat_id || "").replace(/"/g, '""')}"`,
        `"${(log.user_name || "").replace(/"/g, '""')}"`,
        `"${(log.details || "").replace(/"/g, '""')}"`,
        `"${(log.action || "").replace(/"/g, '""')}"`,
        `"${severity}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `TeleGuard_Security_Incident_Report_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccess(`បានទាញយក CSV របាយការណ៍សន្តិសុខ (${filteredLogs.length} ហេតុការណ៍) ដោយជោគជ័យ!`);
    setTimeout(() => setExportSuccess(null), 3500);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const totalMalware = filteredLogs.filter((l) => l.event_type.includes("MALWARE")).length;
  const totalFlood = filteredLogs.filter((l) => l.event_type.includes("FLOOD")).length;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white border border-[#e1e5eb] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#1c2733] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>កំណត់ត្រាសន្តិសុខ & ការកម្ចាត់មេរោគ (Security Audit Logs)</span>
          </h2>
          <p className="text-xs text-[#708499] mt-0.5">
            កត់ត្រាទុកនូវរាល់ការទប់ស្កាត់ Banking Trojan .apk, .exe, Anti-Flood និងអាចនាំចេញជា CSV / PDF សម្រាប់របាយការណ៍
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Enhanced Search Input */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#708499] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះ User, Chat ID, Event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e1e5eb] text-xs text-[#1c2733] pl-8 pr-7 py-1.5 rounded-lg focus:outline-none focus:border-[#2481cc] placeholder:text-[#8a9fb5]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#708499] hover:text-[#1c2733] p-0.5 rounded"
                title="លុបការស្វែងរក (Clear search)"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#f8fafc] border border-[#e1e5eb] text-xs text-[#1c2733] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#2481cc]"
          >
            <option value="all">ហេតុការណ៍ទាំងអស់ ({logs.length})</option>
            <option value="malware">🚨 Malware Blocked (.apk / .exe)</option>
            <option value="flood">🌊 Anti-Flood Spam</option>
            <option value="archive">☣️ Archive VirusTotal</option>
          </select>

          {/* Export Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportCSV}
              title="ទាញយកឯកសារ CSV នៃកំណត់ត្រាសន្តិសុខទាំងអស់ (Download CSV)"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>ទាញយក CSV ({filteredLogs.length})</span>
            </button>

            <button
              onClick={() => setShowPdfModal(true)}
              title="បើកផ្ទាំងរបាយការណ៍ PDF & បោះពុម្ព"
              className="bg-[#2481cc] hover:bg-[#1b64a0] text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>របាយការណ៍ PDF</span>
            </button>

            <button
              onClick={onAddSimulatedLog}
              title="បន្ថែមទិន្នន័យ Threat តេស្ត"
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-rose-600" />
              <span>តេស្ត Threat</span>
            </button>
          </div>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {deleteMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{deleteMessage}</span>
        </div>
      )}

      {/* Bulk Selection Sticky/Floating Toolbar */}
      {selectedTimestamps.length > 0 && (
        <div className="p-3 bg-[#1c2733] border border-[#2d3b4a] text-white rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="bg-[#2481cc] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
              {selectedTimestamps.length} បានជ្រើសរើស
            </span>
            <span className="text-xs text-[#cfd8dc]">
              (ពីចំណោម {filteredLogs.length} ហេតុការណ៍ដែលបានចម្រាញ់)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-2.5 py-1 text-xs text-[#8a9fb5] hover:text-white hover:bg-[#2d3b4a] rounded-lg transition-colors"
            >
              {isAllFilteredSelected ? "ដោះការជ្រើសរើសទាំងអស់" : "ជ្រើសទាំងអស់ក្នុងទំព័រ"}
            </button>

            <button
              type="button"
              disabled={isDeletingBulk}
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeletingBulk ? "កំពុងលុប..." : `លុបចេញ (${selectedTimestamps.length})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Logs Table / Cards */}
      <div className="bg-white border border-[#e1e5eb] rounded-xl overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-[#e1e5eb] bg-[#f8fafc] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#708499]">
          <div className="flex items-center gap-3">
            {/* Select All Checkbox */}
            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#1c2733] select-none">
              <input
                type="checkbox"
                checked={isAllFilteredSelected}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded text-[#2481cc] focus:ring-0 cursor-pointer accent-[#2481cc]"
              />
              <span>ជ្រើសទាំងអស់</span>
            </label>

            <span className="text-[#e1e5eb]">|</span>

            <span className="font-bold text-[#1c2733]">
              បង្ហាញ {filteredLogs.length} ហេតុការណ៍
            </span>
            <span className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
              មេរោគ៖ {totalMalware}
            </span>
            <span className="text-[11px] bg-blue-50 text-[#2481cc] border border-blue-200 px-2 py-0.5 rounded">
              Spam៖ {totalFlood}
            </span>
          </div>

          <span className="font-mono text-[10px] text-[#708499]">
            Auto-synced from security_audit_logs.json
          </span>
        </div>

        <div className="divide-y divide-[#e1e5eb]">
          {filteredLogs.map((log, index) => {
            const isMalware = log.event_type.includes("MALWARE");
            const isFlood = log.event_type.includes("FLOOD");
            const isSelected = selectedTimestamps.includes(log.timestamp);

            return (
              <div
                key={index}
                className={`p-4 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isSelected ? "bg-blue-50/50 border-l-4 border-l-[#2481cc]" : "hover:bg-[#f8fafc]"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Row Checkbox */}
                  <div className="pt-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectLog(log.timestamp)}
                      className="w-4 h-4 rounded text-[#2481cc] focus:ring-0 cursor-pointer accent-[#2481cc]"
                    />
                  </div>

                  <div
                    className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                      isMalware
                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                        : isFlood
                        ? "bg-blue-50 text-[#2481cc] border border-blue-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}
                  >
                    {isMalware ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isFlood ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Bug className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          isMalware
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-blue-50 text-[#2481cc] border-blue-200"
                        }`}
                      >
                        {log.event_type}
                      </span>
                      <span className="text-[11px] text-[#708499] font-mono">
                        📅 {log.timestamp}
                      </span>
                      <span className="text-[10px] bg-[#f8fafc] border border-[#e1e5eb] text-[#1c2733] px-1.5 py-0.5 rounded">
                        👥 {log.chat_title}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#1c2733] mt-1">
                      {log.details}
                    </p>

                    <div className="text-[11px] text-[#708499] flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono">
                      <span>👤 អ្នកផ្ញើ៖ <strong className="text-[#1c2733] font-sans">{log.user_name}</strong></span>
                      <span>(ID: {log.user_id})</span>
                      <span>• Chat ID: {log.chat_id}</span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right shrink-0 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-block">
                    ⚡ {log.action}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-[#708499] text-xs">
              មិនមានកំណត់ត្រាសន្តិសុខត្រូវតាមការស្វែងរកឡើយ
            </div>
          )}
        </div>
      </div>

      {/* PDF Export & Print Report Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#e1e5eb]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#e1e5eb] flex items-center justify-between bg-[#1c2733] text-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#64b5f6]" />
                <div>
                  <h3 className="font-bold text-sm">របាយការណ៍សន្តិសុខប្រចាំថ្ងៃ (TeleGuard Security Report)</h3>
                  <p className="text-[11px] text-[#8a9fb5]">ឯកសារផ្លូវការសម្រាប់បោះពុម្ព ឬរក្សាទុកជា PDF</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPDF}
                  className="bg-[#2481cc] hover:bg-[#1b64a0] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>បោះពុម្ព / រក្សាទុកជា PDF</span>
                </button>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="p-1.5 text-[#8a9fb5] hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Report Preview Body */}
            <div id="printable-security-report" className="p-6 overflow-y-auto space-y-6 text-[#1c2733] text-xs">
              {/* Document Letterhead */}
              <div className="border-b-2 border-[#1c2733] pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-[#1c2733]">TELEGUARD SECURITY BOT</span>
                    <span className="bg-[#2481cc] text-white text-[10px] px-1.5 py-0.5 rounded font-bold">OFFICIAL</span>
                  </div>
                  <p className="text-[11px] text-[#708499] mt-0.5">Commercial Cybersecurity Incident & Audit Report</p>
                  <p className="text-[10px] text-[#708499]">Channel: @sornsecurityrobot • Super Admin ID: 240224709</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[#1c2733]">កាលបរិច្ឆេទចេញរបាយការណ៍៖</div>
                  <div className="font-mono text-xs text-[#2481cc]">{new Date().toLocaleString("km-KH")}</div>
                  <div className="text-[10px] text-[#708499]">ស្ថានភាពប្រព័ន្ធ៖ 🟢 ACTIVE (ការពារ ២៤/៧)</div>
                </div>
              </div>

              {/* Summary Stats Cards for the Report */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#f8fafc] border border-[#e1e5eb] rounded-lg">
                  <div className="text-[10px] text-[#708499] uppercase font-bold">ហេតុការណ៍សរុប</div>
                  <div className="text-xl font-bold text-[#1c2733] mt-1">{filteredLogs.length}</div>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="text-[10px] text-rose-700 uppercase font-bold">មេរោគបានទប់ស្កាត់</div>
                  <div className="text-xl font-bold text-rose-600 mt-1">{totalMalware}</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-[10px] text-[#2481cc] uppercase font-bold">Flood Spams ទប់ស្កាត់</div>
                  <div className="text-xl font-bold text-[#2481cc] mt-1">{totalFlood}</div>
                </div>
              </div>

              {/* Incidents Table */}
              <div>
                <h4 className="font-bold text-xs text-[#1c2733] mb-2 uppercase tracking-wide">
                  តារាងកំណត់ត្រាការទប់ស្កាត់ (Security Incidents Log)
                </h4>
                <div className="border border-[#e1e5eb] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#f1f4f9] border-b border-[#e1e5eb] text-[#708499] font-bold">
                      <tr>
                        <th className="p-2">កាលបរិច្ឆេទ</th>
                        <th className="p-2">ប្រភេទ</th>
                        <th className="p-2">Group Telegram</th>
                        <th className="p-2">ព័ត៌មានលម្អិតហ្វាល់ / សារ</th>
                        <th className="p-2">អ្នកផ្ញើ</th>
                        <th className="p-2">ចំណាត់ការ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e1e5eb]">
                      {filteredLogs.map((log, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}>
                          <td className="p-2 font-mono whitespace-nowrap">{log.timestamp}</td>
                          <td className="p-2 font-mono font-semibold">
                            <span
                              className={`px-1 py-0.5 rounded text-[9px] ${
                                log.event_type.includes("MALWARE")
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {log.event_type}
                            </span>
                          </td>
                          <td className="p-2 font-semibold">{log.chat_title}</td>
                          <td className="p-2 text-rose-700 font-mono">{log.details}</td>
                          <td className="p-2 font-mono">
                            {log.user_name} ({log.user_id})
                          </td>
                          <td className="p-2 font-medium text-amber-800">{log.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sign-off footer */}
              <div className="pt-4 border-t border-[#e1e5eb] flex items-center justify-between text-[10px] text-[#708499]">
                <div>
                  <p className="font-semibold text-[#1c2733]">ប្រព័ន្ធ TeleGuard Security Bot System</p>
                  <p>ការពារស្វ័យប្រវត្តិកម្រិត Real-time (Bank Grade Anti-Trojan)</p>
                </div>
                <div className="text-right">
                  <p className="font-mono">ហត្ថលេខា / Master Key Verification:</p>
                  <p className="font-mono text-[#2481cc] font-bold">240224709-TG-SEC-VERIFIED</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-[#e1e5eb] bg-[#f8fafc] rounded-b-2xl flex items-center justify-between">
              <span className="text-xs text-[#708499]">
                💡 ព័ត៌មានជំនួយ៖ នៅក្នុងផ្ទាំងបោះពុម្ព បងអាចជ្រើសរើស &quot;Save as PDF&quot; (រក្សាទុកជា PDF) ដើម្បីទាញយក។
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#e1e5eb] text-xs font-semibold text-[#708499] hover:bg-white transition-colors"
                >
                  បិទ
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="bg-[#2481cc] hover:bg-[#1b64a0] text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>បោះពុម្ព ឬទាញយក PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
