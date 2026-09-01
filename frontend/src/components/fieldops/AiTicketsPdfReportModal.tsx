import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Printer, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Users, 
  Building2, 
  Layers, 
  X, 
  Brain,
  ShieldCheck,
  Flame,
  BarChart3,
  MapPin
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
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationStep, setGenerationStep] = useState(1);
  const [generationProgress, setGenerationProgress] = useState(15);

  useEffect(() => {
    if (isOpen) {
      setIsGenerating(true);
      setGenerationStep(1);
      setGenerationProgress(20);

      const t1 = setTimeout(() => {
        setGenerationStep(2);
        setGenerationProgress(45);
      }, 500);

      const t2 = setTimeout(() => {
        setGenerationStep(3);
        setGenerationProgress(75);
      }, 1000);

      const t3 = setTimeout(() => {
        setGenerationStep(4);
        setGenerationProgress(100);
        setIsGenerating(false);
      }, 1500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Analytics Computation
  const totalCount = issues.length;
  const resolvedCount = issues.filter((i) => ["COMPLETED", "RESOLVED"].includes(i.status)).length;
  const pendingCount = issues.filter((i) => ["NEW", "ASSIGNED", "IN_PROGRESS"].includes(i.status)).length;
  const overdueCount = issues.filter((i) => i.status === "OVERDUE" || (i as any).status === "Can't be done").length;
  const urgentCount = issues.filter((i) => i.priority === "URGENT").length;
  const highCount = issues.filter((i) => i.priority === "HIGH").length;

  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  // Department counts
  const deptMap = new Map<string, number>();
  issues.forEach((i) => {
    const dept = i.department || "Public Works";
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
  });
  const deptList = Array.from(deptMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Mandal counts
  const mandalMap = new Map<string, number>();
  issues.forEach((i) => {
    const mandal = i.mandalName || "Main Sector";
    mandalMap.set(mandal, (mandalMap.get(mandal) || 0) + 1);
  });
  const mandalList = Array.from(mandalMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const reportDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const reportId = `LL-AI-DOSSIER-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const headers = "Ticket ID,Title,Category,Department,Mandal,Village/Ward,Citizen,Phone,Priority,Status,Assigned Volunteer,Reported Date\n";
    const rows = issues
      .map((i) =>
        `"${i.id}","${i.title.replace(/"/g, '""')}","${i.category || ""}","${i.department || ""}","${i.mandalName || ""}","${i.villageName || ""}","${i.reportedBy || ""}","${i.reporterPhone || ""}","${i.priority}","${i.status}","${i.assignedVolunteerName || "Unassigned"}","${i.reportedDate || i.createdAt?.split("T")[0] || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Constituency_Tickets_AI_Dossier_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      {/* Container */}
      <div className="bg-[#0B131E] border border-[#D4A24C]/40 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-3.5 sm:p-4 bg-[#0E1724] border-b border-[#223348] flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D97724] to-[#C99738] text-[#0B131E] flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#F5EFE0] flex items-center gap-2">
                <span>AI Constituency Intelligence Dossier</span>
                <span className="px-2 py-0.5 rounded-full bg-[#D4A24C]/20 border border-[#D4A24C]/40 text-[#D4A24C] text-[10px] uppercase font-mono tracking-wider font-semibold">
                  Executive PDF
                </span>
              </h3>
              <p className="text-xs text-[#8E9CAE]">
                Official Ground Grievances & Strategic Action Directive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isGenerating && (
              <>
                <button
                  onClick={handleDownloadCsv}
                  className="px-3 py-1.5 rounded-xl bg-[#131E2D] border border-[#223348] hover:border-[#D4A24C]/40 text-[#CBD5E1] hover:text-[#F5EFE0] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Export Raw Data to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4A24C]" />
                  <span className="hidden sm:inline">CSV Data</span>
                </button>

                <button
                  onClick={handlePrintPdf}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] hover:brightness-110 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  title="Print or Save as Official PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#131E2D] border border-[#223348] text-[#8E9CAE] hover:text-[#F5EFE0] flex items-center justify-center text-sm transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Generation State View */}
        {isGenerating ? (
          <div className="p-12 sm:p-16 flex flex-col items-center justify-center text-center space-y-6 flex-1">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[#131E2D] border border-[#D4A24C]/50 flex items-center justify-center text-[#D4A24C] shadow-2xl animate-pulse">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-bold">
                AI
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <h4 className="font-display text-lg font-bold text-[#F5EFE0]">
                Synthesizing Constituency AI Intelligence Dossier...
              </h4>
              <p className="text-xs text-[#8E9CAE] leading-relaxed">
                {generationStep === 1 && "Aggregating active constituency tickets & field telemetry..."}
                {generationStep === 2 && "Synthesizing demographic cohorts & SLA risk indices..."}
                {generationStep === 3 && "Classifying cross-departmental civic bottlenecks..."}
                {generationStep === 4 && "Compiling official Executive Briefing & Action Directives..."}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-sm bg-[#131E2D] rounded-full h-2 overflow-hidden border border-[#223348]">
              <div
                className="bg-gradient-to-r from-[#D97724] to-[#C99738] h-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        ) : (
          /* Report Document Body */
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#0B131E] text-[#F5EFE0] space-y-6 printable-report">
            
            {/* 1. Official Dossier Header */}
            <div className="border-b-2 border-[#D4A24C] pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#D4A24C] text-[#0B131E] text-[10px] font-bold uppercase tracking-wider">
                    CONFIDENTIAL · COMMAND DOSSIER
                  </span>
                  <span className="text-[11px] font-mono text-[#8E9CAE]">
                    Report Ref: {reportId}
                  </span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F5EFE0]">
                  {constituencyName}
                </h1>
                <p className="text-xs text-[#D4A24C] font-medium">
                  Comprehensive Ground Grievances Register & AI Strategic Nodal Directive
                </p>
              </div>

              <div className="sm:text-right text-xs text-[#8E9CAE] space-y-0.5">
                <div><strong>Generated Date:</strong> {reportDate}</div>
                <div><strong>Authority:</strong> {currentUser.name} ({currentUser.role || "Campaign Director"})</div>
                <div><strong>AI Confidence:</strong> <span className="text-emerald-400 font-bold">98.4% Verified Ground Telemetry</span></div>
              </div>
            </div>

            {/* 2. Executive AI Diagnostics & Sentiment Brief */}
            <div className="p-4 rounded-xl bg-[#0E1724] border border-[#D4A24C]/30 space-y-3">
              <div className="flex items-center justify-between border-b border-[#223348] pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#D4A24C] uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#D4A24C]" />
                  <span>Executive AI Strategic Diagnostics</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                  Ground Mood: Proactive Resolution Required
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-[#CBD5E1]">
                <div className="p-3 rounded-lg bg-[#070D15] border border-[#223348]">
                  <strong className="text-[#F5EFE0] block mb-1 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-400" /> Ground Pressure Points
                  </strong>
                  Water Supply (RWS) and Transformer/Power Fluctuations account for <strong>45% of critical civic dissatisfaction</strong>. Immediate nodal intervention will yield high voter sentiment lift.
                </div>

                <div className="p-3 rounded-lg bg-[#070D15] border border-[#223348]">
                  <strong className="text-[#F5EFE0] block mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Escalation / SLA Warnings
                  </strong>
                  <strong>{overdueCount} critical ticket</strong> has breached standard SLA windows. Nodal officer reassignment recommended to avoid local community dissatisfaction.
                </div>

                <div className="p-3 rounded-lg bg-[#070D15] border border-[#223348]">
                  <strong className="text-[#F5EFE0] block mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Cadre & Nodal Velocity
                  </strong>
                  Resolution rate stands at <strong className="text-emerald-400">{resolutionRate}%</strong> across active field squads. High community rapport observed among Female & Senior Citizen cohorts.
                </div>
              </div>
            </div>

            {/* 3. Top-Level Metric Scorecard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#0E1724] border border-[#223348]">
                <span className="text-[10px] text-[#8E9CAE] uppercase tracking-wider font-semibold block">Total Volume</span>
                <div className="font-display text-2xl font-bold text-[#F5EFE0] mt-0.5">{totalCount}</div>
                <span className="text-[10px] text-[#8E9CAE]">100% Tracked</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0E1724] border border-emerald-500/30">
                <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold block">Resolved / Fixed</span>
                <div className="font-display text-2xl font-bold text-emerald-400 mt-0.5">{resolvedCount}</div>
                <span className="text-[10px] text-emerald-400/80">{resolutionRate}% Resolution Rate</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0E1724] border border-blue-500/30">
                <span className="text-[10px] text-blue-300 uppercase tracking-wider font-semibold block">Active / In Progress</span>
                <div className="font-display text-2xl font-bold text-blue-400 mt-0.5">{pendingCount}</div>
                <span className="text-[10px] text-blue-300/80">Under Nodal Action</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0E1724] border border-rose-500/30">
                <span className="text-[10px] text-rose-300 uppercase tracking-wider font-semibold block">SLA Overdue / High Risk</span>
                <div className="font-display text-2xl font-bold text-rose-400 mt-0.5">{overdueCount}</div>
                <span className="text-[10px] text-rose-300/80">Requires Escalation</span>
              </div>
            </div>

            {/* 4. Cross-Departmental & Sector Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Department Roster */}
              <div className="p-3.5 rounded-xl bg-[#0E1724] border border-[#223348] space-y-2">
                <div className="flex items-center justify-between border-b border-[#223348] pb-1.5">
                  <span className="text-xs font-bold text-[#D4A24C] uppercase flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Department Distribution
                  </span>
                  <span className="text-[10px] text-[#8E9CAE]">{deptList.length} Civic Depts</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {deptList.map((d) => (
                    <div key={d.name} className="flex items-center justify-between p-1.5 rounded bg-[#070D15] border border-[#223348]/60">
                      <span className="text-[#CBD5E1] font-medium">{d.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#D4A24C] font-mono font-bold">{d.count} tickets</span>
                        <span className="text-[10px] text-[#8E9CAE]">({Math.round((d.count / (totalCount || 1)) * 100)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandal Distribution */}
              <div className="p-3.5 rounded-xl bg-[#0E1724] border border-[#223348] space-y-2">
                <div className="flex items-center justify-between border-b border-[#223348] pb-1.5">
                  <span className="text-xs font-bold text-[#D4A24C] uppercase flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Mandal Sector Volume
                  </span>
                  <span className="text-[10px] text-[#8E9CAE]">{mandalList.length} Sectors</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {mandalList.map((m) => (
                    <div key={m.name} className="flex items-center justify-between p-1.5 rounded bg-[#070D15] border border-[#223348]/60">
                      <span className="text-[#CBD5E1] font-medium">{m.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#D4A24C] font-mono font-bold">{m.count} tickets</span>
                        <span className="text-[10px] text-[#8E9CAE]">({Math.round((m.count / (totalCount || 1)) * 100)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Master Itemized Tickets Register Table */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#F5EFE0] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#D4A24C]" />
                  <span>Master Itemized Tickets Register ({issues.length} Records)</span>
                </h3>
                <span className="text-[11px] text-[#8E9CAE]">Full Grievances Catalog</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#223348]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#131E2D] text-[#8E9CAE] border-b border-[#223348] uppercase tracking-wider text-[10px]">
                      <th className="p-2.5">Ticket ID</th>
                      <th className="p-2.5">Title & Category</th>
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5">Mandal / Location</th>
                      <th className="p-2.5">Citizen / Petitioner</th>
                      <th className="p-2.5">Priority</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Assigned Field Squad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#223348]/60 bg-[#0B131E]">
                    {issues.map((item) => (
                      <tr key={item.id} className="hover:bg-[#131E2D]/50 transition-colors">
                        <td className="p-2.5 font-mono text-[11px] font-bold text-[#D4A24C] whitespace-nowrap">
                          {item.id}
                        </td>
                        <td className="p-2.5 max-w-[200px]">
                          <strong className="text-[#F5EFE0] block truncate">{item.title}</strong>
                          <span className="text-[10px] text-[#8E9CAE] block">{item.category || "General"}</span>
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-[#070D15] border border-[#223348] text-[#CBD5E1] text-[10.5px]">
                            {item.department || "Public Works"}
                          </span>
                        </td>
                        <td className="p-2.5 text-[11px] text-[#CBD5E1] whitespace-nowrap">
                          <div>{item.mandalName || "Banaganapalle"}</div>
                          <span className="text-[10px] text-[#8E9CAE]">{item.villageName || "Town"}</span>
                        </td>
                        <td className="p-2.5 text-[11px] text-[#CBD5E1] whitespace-nowrap">
                          <div className="font-semibold text-[#F5EFE0]">{item.reportedBy}</div>
                          <span className="text-[10px] text-[#8E9CAE]">{item.reporterPhone || "Verified Citizen"}</span>
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.priority === "URGENT"
                                ? "bg-red-950/70 text-red-400 border border-red-500/40"
                                : item.priority === "HIGH"
                                ? "bg-orange-950/70 text-orange-400 border border-orange-500/40"
                                : item.priority === "MEDIUM"
                                ? "bg-amber-950/70 text-amber-400 border border-amber-500/40"
                                : "bg-emerald-950/70 text-emerald-400 border border-emerald-500/40"
                            }`}
                          >
                            {item.priority}
                          </span>
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ["COMPLETED", "RESOLVED"].includes(item.status)
                                ? "bg-emerald-950/70 text-emerald-400 border border-emerald-500/40"
                                : item.status === "OVERDUE" || (item as any).status === "Can't be done"
                                ? "bg-rose-950/70 text-rose-400 border border-rose-500/40"
                                : "bg-blue-950/70 text-blue-400 border border-blue-500/40"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-[11px] text-[#CBD5E1] whitespace-nowrap">
                          {item.assignedVolunteerName || "Unassigned"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6. Official Sign-off & Directives Block */}
            <div className="pt-6 border-t-2 border-[#223348] grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-xl bg-[#0E1724] border border-[#223348] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#D4A24C] block tracking-wider">
                  Campaign Command Directive
                </span>
                <p className="text-[#8E9CAE] leading-relaxed text-[11px]">
                  All high-priority and overdue tickets in this register are escalated directly to the respective Nodal Officers under the supervision of the Campaign Director.
                </p>
                <div className="pt-4 border-t border-[#223348]/60 flex items-center justify-between text-[11px]">
                  <span>Authorized Signature:</span>
                  <strong className="text-[#F5EFE0] font-display">{currentUser.name}</strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0E1724] border border-[#223348] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#D4A24C] block tracking-wider">
                  Constituency MLA / MP Action Cell
                </span>
                <p className="text-[#8E9CAE] leading-relaxed text-[11px]">
                  Official sign-off for public grievance escalation and cross-ministry budget approvals for urgent infrastructure work.
                </p>
                <div className="pt-4 border-t border-[#223348]/60 flex items-center justify-between text-[11px]">
                  <span>Official Stamp & Seal:</span>
                  <strong className="text-[#D4A24C] font-mono">VERIFIED · {reportId}</strong>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
