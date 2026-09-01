import React, { useEffect } from "react";
import { 
  Printer, 
  Download, 
  X, 
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react";
import { FieldIssue, UserProfile } from "../../types";

interface AiTicketsPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  issues: FieldIssue[];
  currentUser: UserProfile;
  constituencyName?: string;
}

export const AiTicketsPdfReportModal: React.FC<AiTicketsPdfReportModalProps> = ({
  isOpen,
  onClose,
  issues,
  currentUser,
  constituencyName = "Banaganapalle AC (AC-140)"
}) => {
  // Lock body scroll and listen for Escape key when modal is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalCount = issues.length;
  const resolvedCount = issues.filter((i) => ["COMPLETED", "RESOLVED"].includes(i.status)).length;
  const pendingCount = issues.filter((i) => ["NEW", "ASSIGNED", "IN_PROGRESS"].includes(i.status)).length;
  const overdueCount = issues.filter((i) => i.status === "OVERDUE" || (i as any).status === "Can't be done").length;

  const reportDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const reportId = `LL-REG-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const headers = "ID,Type,Title,Description,Category,Department,Mandal,Village/Ward,Reported By,Phone,Priority,Status,Reported Date,Complete Date,Assigned Volunteer\n";
    const rows = issues
      .map((i) =>
        `"${i.id}","${(i as any).issueType || "FIELD_ISSUE"}","${(i.title || "").replace(/"/g, '""')}","${(i.description || "").replace(/"/g, '""')}","${i.category || ""}","${i.department || ""}","${i.mandalName || ""}","${i.villageName || ""}","${i.reportedBy || ""}","${i.reporterPhone || ""}","${i.priority}","${i.status}","${i.reportedDate || ""}","${(i as any).completedDate || ""}","${i.assignedVolunteerName || "Unassigned"}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Operations_Tickets_Register_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* 1. Modal UI (Centered Compact Export Dialog - Hidden on Print) */}
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-fadeIn print:hidden"
        onClick={onClose}
      >
        <div
          className="relative bg-[#0B131E] border border-[#D4A24C]/60 rounded-2xl w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden text-[#F5EFE0] my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 bg-[#0E1724] border-b border-[#223348] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D97724] to-[#C99738] text-[#0B131E] flex items-center justify-center shadow-md font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#F5EFE0]">
                  Export to PDF
                </h3>
                <p className="text-[11px] text-[#8E9CAE]">
                  Operations & Tickets Register
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-[#131E2D] hover:bg-rose-950/60 border border-[#223348] hover:border-rose-500/50 text-[#CBD5E1] hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer"
              title="Close (Press Escape)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body: Record Count & Summary Details */}
          <div className="p-5 space-y-4">
            
            {/* Prominent Record Count Box */}
            <div className="p-4 rounded-xl bg-[#131E2D]/90 border border-[#D4A24C]/40 text-center space-y-1">
              <span className="text-[10.5px] uppercase font-bold text-[#D4A24C] tracking-wider block">
                Total Records Ready for Export
              </span>
              <div className="font-display text-4xl font-bold text-[#F5EFE0]">
                {totalCount}
              </div>
              <span className="text-xs text-[#CBD5E1] block">
                Active operations & field tickets selected
              </span>
            </div>

            {/* Quick Metrics Chips */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-[#070D15] border border-[#223348]/70">
                <span className="text-[9.5px] text-emerald-400 font-semibold block flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Resolved
                </span>
                <strong className="text-xs text-[#F5EFE0] font-mono mt-0.5 block">{resolvedCount}</strong>
              </div>

              <div className="p-2 rounded-lg bg-[#070D15] border border-[#223348]/70">
                <span className="text-[9.5px] text-amber-300 font-semibold block flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" /> Pending
                </span>
                <strong className="text-xs text-amber-400 font-mono mt-0.5 block">{pendingCount}</strong>
              </div>

              <div className="p-2 rounded-lg bg-[#070D15] border border-[#223348]/70">
                <span className="text-[9.5px] text-rose-300 font-semibold block flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Overdue
                </span>
                <strong className="text-xs text-rose-400 font-mono mt-0.5 block">{overdueCount}</strong>
              </div>
            </div>

            {/* Meta details */}
            <div className="text-[11px] text-[#8E9CAE] space-y-1 bg-[#070D15] p-2.5 rounded-lg border border-[#223348]/60">
              <div className="flex items-center justify-between">
                <span>Constituency:</span>
                <strong className="text-[#CBD5E1]">{constituencyName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Exported By:</span>
                <strong className="text-[#CBD5E1]">{currentUser.name}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Date:</span>
                <strong className="text-[#D4A24C]">{reportDate}</strong>
              </div>
            </div>

            {/* Export Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handlePrintPdf}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] hover:brightness-110 text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Export / Print to PDF ({totalCount} Records)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadCsv}
                  className="py-2 rounded-xl bg-[#131E2D] hover:bg-[#1E3048] border border-[#223348] hover:border-[#D4A24C]/40 text-[#CBD5E1] hover:text-[#F5EFE0] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4A24C]" />
                  <span>Download CSV</span>
                </button>

                <button
                  onClick={onClose}
                  className="py-2 rounded-xl bg-[#131E2D] hover:bg-rose-950/60 border border-[#223348] hover:border-rose-500/50 text-[#CBD5E1] hover:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Cancel</span>
                </button>
              </div>
            </div>

            <div className="text-center text-[10px] text-[#8E9CAE]">
              Press <kbd className="px-1 py-0.5 rounded bg-[#131E2D] border border-[#223348] text-[#D4A24C] font-mono">Esc</kbd> to close
            </div>

          </div>
        </div>
      </div>

      {/* 2. Official Printable Table Document (Rendered only when window.print() is executed) */}
      <div className="hidden print:block print:w-full print:bg-white print:text-black p-6 space-y-4 printable-report">
        
        {/* Print Header */}
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Leader&apos;s Lens — Operations & Tickets Register
            </h1>
            <div className="text-xs text-slate-600 mt-1">
              Constituency: <strong>{constituencyName}</strong> · Authority: <strong>{currentUser.name}</strong> · Date: <strong>{reportDate}</strong>
            </div>
          </div>
          <div className="text-right text-xs font-mono text-slate-600">
            <div>Ref: <strong>{reportId}</strong></div>
            <div>Total Records: <strong>{issues.length}</strong></div>
          </div>
        </div>

        {/* Print Table */}
        <table className="w-full text-left text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 uppercase text-[9.5px] font-bold">
              <th className="py-2 px-2 border border-slate-300 w-[12%]">ID & Type</th>
              <th className="py-2 px-2 border border-slate-300 w-[30%]">Issue Title & Scope</th>
              <th className="py-2 px-2 border border-slate-300 w-[16%]">Category / Dept</th>
              <th className="py-2 px-2 border border-slate-300 w-[15%]">Mandal / Location</th>
              <th className="py-2 px-2 border border-slate-300 w-[15%]">Reported By</th>
              <th className="py-2 px-2 border border-slate-300 w-[12%]">Timeline / Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {issues.map((issue) => (
              <tr key={issue.id} className="text-slate-800">
                <td className="py-2 px-2 border border-slate-300 align-top font-mono text-[10px]">
                  <strong>#{issue.id}</strong>
                  <div className="text-[9px] uppercase mt-0.5 text-slate-600">
                    {(issue as any).issueType || "TICKET"}
                  </div>
                  <div className="text-[9px] font-bold mt-0.5">
                    {issue.status}
                  </div>
                </td>
                <td className="py-2 px-2 border border-slate-300 align-top">
                  <div className="font-bold text-slate-900 leading-snug">{issue.title}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{issue.description}</div>
                  <div className="text-[9px] font-bold text-slate-700 mt-1">Priority: {issue.priority}</div>
                </td>
                <td className="py-2 px-2 border border-slate-300 align-top text-[10.5px]">
                  <div className="font-semibold">{issue.category}</div>
                  {issue.department && <div className="text-[9.5px] text-slate-600 mt-0.5">{issue.department}</div>}
                </td>
                <td className="py-2 px-2 border border-slate-300 align-top text-[10.5px]">
                  <div className="font-semibold">{issue.mandalName}</div>
                  <div className="text-[9.5px] text-slate-600">{issue.villageName || (issue as any).placeName || "Town"}</div>
                </td>
                <td className="py-2 px-2 border border-slate-300 align-top text-[10.5px]">
                  <div className="font-semibold">{issue.reportedBy}</div>
                  <div className="text-[9.5px] text-slate-600">{(issue as any).reporterType || "Citizen"} {issue.reporterPhone ? `· ${issue.reporterPhone}` : ""}</div>
                </td>
                <td className="py-2 px-2 border border-slate-300 align-top font-mono text-[9.5px]">
                  <div>Rep: {issue.reportedDate}</div>
                  <div className="mt-0.5">
                    {(issue as any).completedDate ? `Done: ${(issue as any).completedDate}` : issue.status === "COMPLETED" || issue.status === "RESOLVED" ? "Resolved" : "Pending"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Print Footer */}
        <div className="pt-4 border-t border-slate-300 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Official Register Generated from Leader&apos;s Lens Command Platform</span>
          <span>Verified Document · Ref ID: {reportId}</span>
        </div>
      </div>
    </>
  );
};
