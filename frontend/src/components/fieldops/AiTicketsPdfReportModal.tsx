import React, { useEffect } from "react";
import { 
  Printer, 
  Download, 
  X, 
  FileText
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
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      {/* Container */}
      <div
        className="relative bg-[#0B131E] border border-[#D4A24C]/40 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden text-[#F5EFE0] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-3.5 sm:p-4 bg-[#0E1724] border-b border-[#223348] flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D97724] to-[#C99738] text-[#0B131E] flex items-center justify-center shadow-md font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#F5EFE0] flex items-center gap-2">
                <span>Operations & Tickets Register</span>
                <span className="px-2 py-0.5 rounded-full bg-[#D4A24C]/20 border border-[#D4A24C]/40 text-[#D4A24C] text-[10px] uppercase font-mono tracking-wider font-semibold">
                  PDF Preview
                </span>
              </h3>
              <p className="text-xs text-[#8E9CAE]">
                {constituencyName} · Showing {issues.length} active records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-xl bg-[#131E2D] border border-[#223348] hover:border-[#D4A24C]/40 text-[#CBD5E1] hover:text-[#F5EFE0] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Export Table to CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#D4A24C]" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] hover:brightness-110 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-[#131E2D] hover:bg-rose-950/60 border border-[#223348] hover:border-rose-500/50 text-[#CBD5E1] hover:text-rose-300 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Close (Press Escape)"
            >
              <X className="w-4 h-4 text-rose-400" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Printable Table Section */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0B131E] text-[#F5EFE0] space-y-4 printable-report">
          
          {/* Header Strip for Print / PDF */}
          <div className="border-b border-[#223348] pb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#F5EFE0]">
                Leader's Lens — Operations & Tickets Register
              </h2>
              <div className="text-xs text-[#8E9CAE] mt-0.5">
                {constituencyName} · Authority: <strong className="text-[#CBD5E1]">{currentUser.name}</strong> · Date: <strong className="text-[#D4A24C]">{reportDate}</strong>
              </div>
            </div>
            <div className="text-right text-xs font-mono text-[#8E9CAE]">
              <div>Ref: <strong className="text-[#D4A24C]">{reportId}</strong></div>
              <div>Total Records: <strong className="text-[#F5EFE0]">{issues.length}</strong></div>
            </div>
          </div>

          {/* EXACT TABLE FROM DASHBOARD */}
          <div className="rounded-xl border border-[#223348] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#131E2D] border-b border-[#223348] text-[#D4A24C] uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-2.5 px-3 w-[12%]">ID & Type</th>
                  <th className="py-2.5 px-3 w-[30%]">Issue Title & Scope</th>
                  <th className="py-2.5 px-3 w-[16%]">Category / Dept</th>
                  <th className="py-2.5 px-3 w-[15%]">Mandal / Location</th>
                  <th className="py-2.5 px-3 w-[15%]">Reported By</th>
                  <th className="py-2.5 px-3 w-[12%]">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#223348]/60 bg-[#0B131E]">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-[#131E2D]/40 transition-colors">
                    {/* 1. ID & Type */}
                    <td className="py-2.5 px-3 align-top">
                      <div className="font-mono font-bold text-[#D4A24C] text-[11px]">
                        #{issue.id}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border inline-block ${
                            (issue as any).issueType === "GRIEVANCE"
                              ? "bg-amber-950/70 text-amber-300 border-amber-500/40"
                              : "bg-sky-950/70 text-sky-300 border-sky-500/40"
                          }`}
                        >
                          {(issue as any).issueType === "GRIEVANCE" ? "Grievance" : "Field Issue"}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span
                          className={`text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded border inline-block ${
                            issue.status === "COMPLETED" || issue.status === "RESOLVED"
                              ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                              : issue.status === "IN_PROGRESS"
                              ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                              : issue.status === "OVERDUE" || (issue as any).status === "Can't be done"
                              ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                              : "bg-blue-950/60 text-blue-300 border-blue-500/40"
                          }`}
                        >
                          {issue.status}
                        </span>
                      </div>
                    </td>

                    {/* 2. Title & Scope */}
                    <td className="py-2.5 px-3 align-top">
                      <div className="font-semibold text-[#F5EFE0] break-words leading-snug">
                        {issue.title}
                      </div>
                      <div className="text-[10.5px] text-[#8E9CAE] break-words mt-0.5 leading-relaxed">
                        {issue.description}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block ${
                            issue.priority === "URGENT"
                              ? "text-red-400 bg-red-950/60 border border-red-500/40"
                              : issue.priority === "HIGH"
                              ? "text-orange-400 bg-orange-950/60 border border-orange-500/40"
                              : "text-[#CBD5E1] bg-[#131E2D]"
                          }`}
                        >
                          Priority: {issue.priority}
                        </span>
                      </div>
                    </td>

                    {/* 3. Category & Department */}
                    <td className="py-2.5 px-3 align-top">
                      <div className="font-medium text-[#F5EFE0] break-words">{issue.category}</div>
                      {issue.department && (
                        <div className="text-[10px] text-[#D4A24C] break-words mt-0.5">
                          {issue.department}
                        </div>
                      )}
                    </td>

                    {/* 4. Mandal & Location */}
                    <td className="py-2.5 px-3 align-top">
                      <div className="font-medium text-[#F5EFE0] break-words">{issue.mandalName}</div>
                      <div className="text-[10px] text-[#8E9CAE] break-words mt-0.5">
                        📍 {issue.villageName || (issue as any).placeName || "Sector Ward"}
                      </div>
                    </td>

                    {/* 5. Reported By */}
                    <td className="py-2.5 px-3 align-top">
                      <div className="font-medium text-[#F5EFE0] break-words">{issue.reportedBy}</div>
                      <div className="text-[10px] text-[#D4A24C] break-words mt-0.5">
                        {(issue as any).reporterType === "LEADER" ? "Leader" : (issue as any).reporterType === "CADRE" ? "Cadre" : "Citizen"}
                        {issue.reporterPhone ? ` · ${issue.reporterPhone}` : ""}
                      </div>
                      <div className="text-[9.5px] text-[#8E9CAE] break-words mt-0.5">
                        Agent: <strong className="text-[#CBD5E1]">{issue.assignedVolunteerName || "Unassigned"}</strong>
                      </div>
                    </td>

                    {/* 6. Timeline */}
                    <td className="py-2.5 px-3 align-top font-mono text-[10px]">
                      <div className="text-[#CBD5E1]">
                        <span className="text-[#8E9CAE]">Rep: </span>
                        {issue.reportedDate}
                      </div>
                      <div className="mt-1">
                        {(issue as any).completedDate ? (
                          <span className="text-emerald-400 font-semibold">Done: {(issue as any).completedDate}</span>
                        ) : issue.status === "COMPLETED" || issue.status === "RESOLVED" ? (
                          <span className="text-emerald-400 font-semibold">Resolved</span>
                        ) : (
                          <span className="text-amber-400/90">Pending</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Action Footer (Hidden on Print) */}
          <div className="pt-3 border-t border-[#223348] flex items-center justify-between gap-3 print:hidden">
            <div className="text-xs text-[#8E9CAE]">
              Press <kbd className="px-1.5 py-0.5 rounded bg-[#131E2D] border border-[#223348] text-[#D4A24C] font-mono text-[10px]">Esc</kbd> anytime to close
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-[#131E2D] hover:bg-rose-950/60 border border-[#223348] hover:border-rose-500/50 text-[#CBD5E1] hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-rose-400" />
                <span>Close</span>
              </button>
              <button
                onClick={handlePrintPdf}
                className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] hover:brightness-110 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
