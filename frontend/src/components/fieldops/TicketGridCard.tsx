import React from "react";
import { MapPin, MessageCircle, Paperclip } from "lucide-react";
import { FieldIssue } from "../../types";
import { formatIssueStatus } from "../../utils/statusLabels";
import { ticketStatusSurface } from "../../utils/ticketKpi";

export type TicketTiming = {
  registeredTimeFormatted: string;
  closedTimeFormatted: string;
  isClosed: boolean;
  durationText: string;
};

export interface TicketGridCardProps {
  issue: FieldIssue;
  timing: TicketTiming;
  departments?: string[];
  resolveDeptValue?: (dept?: string) => string;
  showAssignControls: boolean;
  extraBadges?: React.ReactNode;
  showProofCount?: boolean;
  showAcCode?: boolean;
  volunteerName?: string;
  onOpen: () => void;
  onAssignDepartment?: (issueId: string, department: string) => void;
  onOpenWhatsAppAssign: () => void;
}

export const TicketGridCard: React.FC<TicketGridCardProps> = ({
  issue,
  timing,
  departments = [],
  resolveDeptValue,
  showAssignControls,
  extraBadges,
  showProofCount = false,
  showAcCode = false,
  volunteerName,
  onOpen,
  onAssignDepartment,
  onOpenWhatsAppAssign
}) => {
  const departmentLabel = issue.department?.split("(")[0]?.trim() || issue.category;
  const surface = ticketStatusSurface(issue);

  return (
    <article
      onClick={onOpen}
      className={`min-w-0 p-3.5 rounded-2xl border hover:bg-opacity-90 transition-all cursor-pointer flex flex-col gap-2 shadow-lg group ${surface.card}`}
    >
      <header className="flex items-start justify-between gap-2 min-w-0">
        <span className="min-w-0 truncate text-[11px] font-mono text-[#D4A24C] font-semibold" title={`#${issue.id}`}>
          #{issue.id}
        </span>
        <span
          className={`shrink-0 text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            issue.priority === "URGENT" || issue.priority === "HIGH"
              ? "bg-rose-950/80 text-rose-300 border border-rose-600/40"
              : "bg-[#0B131E] text-[#B9AF95] border border-[#223348]"
          }`}
        >
          {issue.priority}
        </span>
      </header>

      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
        {extraBadges}
        <span className="max-w-full truncate text-[10px] font-semibold px-2 py-0.5 rounded bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/25">
          {issue.category}
        </span>
        {issue.department && (
          <span
            className="max-w-[min(100%,14rem)] truncate text-[10px] font-semibold px-2 py-0.5 rounded bg-[#0B131E] text-[#8E9CAE] border border-[#223348]"
            title={departmentLabel}
          >
            {departmentLabel}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="font-display text-base font-semibold text-[#F5EFE0] line-clamp-2 group-hover:text-[#D4A24C] transition-colors">
          {issue.title}
        </h3>
        {issue.description ? (
          <p className="text-xs text-[#A69B80] line-clamp-2 mt-0.5 leading-snug">
            {issue.description}
          </p>
        ) : null}
        {issue.schemeSubDetail ? (
          <div className="mt-1 text-[11px] font-semibold text-[#D4A24C] bg-[#142B45]/80 border border-[#D4A24C]/30 px-2.5 py-0.5 rounded-md inline-block max-w-full truncate">
            Scheme Details: {issue.schemeSubDetail}
          </div>
        ) : null}
      </div>

      <div className="p-2 rounded bg-[#070D15] border border-[#223348] flex items-center justify-between gap-2 min-w-0 text-[10.5px] font-mono">
        <div className="min-w-0">
          <span className="text-[#8E9CAE] block text-[9.5px] truncate">Reg: {timing.registeredTimeFormatted}</span>
          {timing.isClosed ? (
            <span className="text-emerald-400 font-semibold block text-[9.5px] truncate">Done: {timing.closedTimeFormatted}</span>
          ) : (
            <span className="text-amber-400 block font-semibold text-[9.5px]">Status: {formatIssueStatus(issue.status) || "Open"}</span>
          )}
        </div>
        <div
          className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border whitespace-nowrap ${
            timing.isClosed
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
              : issue.status === "OVERDUE"
              ? "bg-rose-950/80 text-rose-300 border-rose-500/40 animate-pulse"
              : "bg-blue-950/80 text-blue-300 border-blue-500/40"
          }`}
        >
          {timing.isClosed ? `Closed in ${timing.durationText}` : `Open ${timing.durationText}`}
        </div>
      </div>

      <div className="space-y-1 text-xs min-w-0">
        <div className="flex items-center justify-between gap-2 text-[#8E9CAE] min-w-0">
          <span className="flex items-center gap-1.5 text-[#F5EFE0] min-w-0 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
            <span className="truncate">
              <strong>{issue.mandalName}</strong>
              {issue.villageName ? ` · ${issue.villageName}` : ""}
            </span>
          </span>
          {showAcCode && <span className="text-[#8E9CAE] font-mono text-[10px] shrink-0">AC-140</span>}
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] text-[#8E9CAE] min-w-0">
          <span className="min-w-0 truncate">
            Reported by: <strong className="text-[#D8CFB8]">{issue.reportedBy}</strong>
            {issue.reporterDesignation ? ` (${issue.reporterDesignation})` : ""}
          </span>
          {showProofCount && issue.attachments && issue.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[#D4A24C] font-mono shrink-0">
              <Paperclip className="w-3 h-3" />
              {issue.attachments.length} {issue.attachments.length === 1 ? "Proof" : "Proofs"}
            </span>
          )}
        </div>

        {volunteerName && (
          <div className="text-[11px] text-[#8E9CAE] truncate">
            Volunteer: <strong className="text-[#F5EFE0]">{volunteerName}</strong>
          </div>
        )}
      </div>

      {(issue.lastStatusRemarks?.trim() || (issue as any).rejectionReason || (issue as any).notes) && (
      <div className="p-2 rounded-xl bg-[#142B45]/80 border border-[#D4A24C]/35 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C]">
          Officer status comment · {formatIssueStatus(issue.status)}
        </div>
        <p className="mt-0.5 text-[12px] text-[#F5EFE0] leading-snug break-words line-clamp-3">
          {issue.lastStatusRemarks?.trim()
            || (issue as any).rejectionReason
            || (issue as any).notes}
        </p>
        {issue.lastStatusUpdateAt && (
          <div className="mt-0.5 text-[10px] font-mono text-[#8E9CAE]">
            Updated {issue.lastStatusUpdateAt.replace("T", " ").slice(0, 16)}
          </div>
        )}
      </div>
      )}

      <div className="pt-2 border-t border-[#223348]/60 space-y-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 text-[11px] min-w-0">
          <span className="min-w-0 truncate text-[#8E9CAE]">
            Category: <strong className="text-[#D4A24C] font-semibold">{issue.category}</strong>
          </span>
          <span
            className={`shrink-0 text-[10.5px] font-mono font-bold px-2 py-0.5 rounded ${
              timing.isClosed || issue.status === "COMPLETED" || issue.status === "RESOLVED"
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                : issue.status === "IN_PROGRESS"
                  ? "bg-sky-950/80 text-sky-300 border border-sky-500/40"
                  : issue.status === "ASSIGNED" || issue.status === "ACKNOWLEDGED"
                    ? "bg-violet-950/80 text-violet-200 border border-violet-500/40"
                    : "bg-amber-950/80 text-amber-300 border border-amber-500/40"
            }`}
          >
            {formatIssueStatus(issue.status)}
          </span>
        </div>

        {showAssignControls ? (
          <>
            <label className="block text-[10.5px] font-bold text-[#D4A24C]">Assign Complaint</label>
            <select
              value={resolveDeptValue ? resolveDeptValue(issue.department) : issue.department || ""}
              onChange={(e) => onAssignDepartment?.(issue.id, e.target.value)}
              className="w-full min-w-0 bg-[#070D15] text-[#F5EFE0] text-[11px] font-medium border border-[#223348] focus:border-[#D4A24C] rounded-lg px-2 py-1.5 outline-none cursor-pointer"
            >
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label className="block text-[10.5px] font-bold text-[#D4A24C]">Assigned Dept</label>
            <div
              className="w-full min-w-0 text-[11px] font-semibold text-[#F5EFE0] bg-[#070D15] border border-[#223348] rounded-lg px-2.5 py-1.5 truncate"
              title={issue.department || "General Administration"}
            >
              {issue.department || "General Administration"}
            </div>
          </>
        )}

        {showAssignControls ? (
          <button
            type="button"
            onClick={onOpenWhatsAppAssign}
            className="w-full py-2 px-3 rounded-xl bg-[#4A3D22] hover:bg-[#5E4D2B] text-[#F5EFE0] text-[11px] font-bold border border-[#D4A24C]/40 inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/20 shrink-0" />
            <span className="truncate">Assign & Notify on WhatsApp</span>
          </button>
        ) : null}
      </div>
    </article>
  );
};
