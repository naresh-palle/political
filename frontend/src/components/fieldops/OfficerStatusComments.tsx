import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FieldIssue } from "../../types";
import { formatIssueStatus } from "../../utils/statusLabels";

const COMMENTED_STATUSES = ["IN_PROGRESS", "RESOLVED", "REJECTED", "COMPLETED"];
const PAGE_SIZE = 10;

interface OfficerStatusCommentsProps {
  issues: FieldIssue[];
  onOpen: (issue: FieldIssue) => void;
}

export const OfficerStatusComments: React.FC<OfficerStatusCommentsProps> = ({
  issues,
  onOpen
}) => {
  const [page, setPage] = useState(1);

  const items = useMemo(
    () =>
      issues
        .filter(
          (i) =>
            COMMENTED_STATUSES.includes(i.status) && (i.lastStatusRemarks || i.lastStatusUpdateAt)
        )
        .sort(
          (a, b) =>
            new Date(b.lastStatusUpdateAt || b.updatedAt).getTime() -
            new Date(a.lastStatusUpdateAt || a.updatedAt).getTime()
        ),
    [issues]
  );

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (items.length === 0) return null;

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, items.length);

  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-[#0E1724] border border-[#D4A24C]/40 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#D4A24C]">
          Officer status comments
        </h2>
        <span className="text-[10px] font-mono text-[#8E9CAE]">
          {PAGE_SIZE} / page
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#223348]">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-[#070D15] text-[10px] uppercase tracking-wider text-[#8E9CAE]">
            <tr>
              <th className="py-2 px-3 font-semibold w-[18%]">Ticket</th>
              <th className="py-2 px-3 font-semibold w-[14%]">Status</th>
              <th className="py-2 px-3 font-semibold">Officer comment</th>
              <th className="py-2 px-3 font-semibold w-[18%]">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#223348]/60">
            {pageItems.map((i) => (
              <tr
                key={`${i.id}-${i.status}-${i.lastStatusUpdateAt}`}
                onClick={() => onOpen(i)}
                className="bg-[#0B131E]/80 hover:bg-[#142B45] cursor-pointer transition-colors"
              >
                <td className="py-2 px-3 align-top font-mono font-semibold text-[#D4A24C] whitespace-nowrap">
                  #{i.id}
                </td>
                <td className="py-2 px-3 align-top">
                  <span className="text-[10px] font-bold uppercase text-amber-300">
                    {formatIssueStatus(i.status)}
                  </span>
                </td>
                <td className="py-2 px-3 align-top text-[#F5EFE0] leading-snug">
                  {i.lastStatusRemarks?.trim() || "Officer updated this ticket."}
                </td>
                <td className="py-2 px-3 align-top font-mono text-[10px] text-[#8E9CAE] whitespace-nowrap">
                  {i.lastStatusUpdateAt
                    ? i.lastStatusUpdateAt.replace("T", " ").slice(0, 16)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
        <div className="text-[#8E9CAE] font-mono">
          Showing <strong className="text-[#F5EFE0]">{start}</strong> to{" "}
          <strong className="text-[#F5EFE0]">{end}</strong> of{" "}
          <strong className="text-[#D4A24C]">{items.length}</strong> comments
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 px-2 rounded-lg bg-[#0B131E] border border-[#223348] text-[#CBD5E1] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="min-w-[4.5rem] text-center font-mono text-[#F5EFE0]">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 px-2 rounded-lg bg-[#0B131E] border border-[#223348] text-[#CBD5E1] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
