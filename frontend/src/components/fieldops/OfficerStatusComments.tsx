import React from "react";
import { FieldIssue } from "../../types";
import { formatIssueStatus } from "../../utils/statusLabels";

const COMMENTED_STATUSES = ["IN_PROGRESS", "RESOLVED", "REJECTED", "COMPLETED"];

interface OfficerStatusCommentsProps {
  issues: FieldIssue[];
  onOpen: (issue: FieldIssue) => void;
}

export const OfficerStatusComments: React.FC<OfficerStatusCommentsProps> = ({
  issues,
  onOpen
}) => {
  const items = issues
    .filter(
      (i) =>
        COMMENTED_STATUSES.includes(i.status) && (i.lastStatusRemarks || i.lastStatusUpdateAt)
    )
    .sort(
      (a, b) =>
        new Date(b.lastStatusUpdateAt || b.updatedAt).getTime() -
        new Date(a.lastStatusUpdateAt || a.updatedAt).getTime()
    )
    .slice(0, 8);

  if (items.length === 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-[#0E1724] border border-[#D4A24C]/40 space-y-2">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#D4A24C]">
        Officer status comments
      </h2>
      <div className="space-y-2 max-h-56 overflow-y-auto">
        {items.map((i) => (
          <button
            key={`${i.id}-${i.status}-${i.lastStatusUpdateAt}`}
            type="button"
            onClick={() => onOpen(i)}
            className="w-full text-left p-3 rounded-xl bg-[#070D15] border border-[#223348] hover:border-[#D4A24C]/50 cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-[#D4A24C] truncate">#{i.id}</span>
              <span className="text-[10px] font-bold uppercase text-amber-300 shrink-0">
                {formatIssueStatus(i.status)}
              </span>
            </div>
            <p className="text-[12px] text-[#F5EFE0] mt-1 line-clamp-2">
              {i.lastStatusRemarks?.trim() || "Officer updated this ticket."}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
