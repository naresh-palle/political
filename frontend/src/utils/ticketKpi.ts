/** Status buckets for field-ops KPI cards. Groups are mutually exclusive. */

export function normalizeIssueStatus(status?: string | null): string {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/['’]/g, "")
    .replace(/\s+/g, "_");
}

export type KpiBucket =
  | "OPEN_UNASSIGNED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "OVERDUE"
  | "RESOLVED"
  | "REJECTED"
  | "OTHER";

const ASSIGNED_STATUSES = ["ASSIGNED", "ACKNOWLEDGED", "ASSIGNED_TO_DEPARTMENT"] as const;
const IN_PROGRESS_STATUSES = ["IN_PROGRESS"] as const;
const OVERDUE_STATUSES = ["OVERDUE"] as const;
const RESOLVED_CLOSED_STATUSES = ["RESOLVED", "COMPLETED", "CLOSED"] as const;
const REJECTED_STATUSES = ["REJECTED"] as const;

type AssigneeFields = {
  status?: string | null;
  assignedVolunteerId?: string | null;
  assignedVolunteerName?: string | null;
  assignedOfficialName?: string | null;
  assignedOfficialPhone?: string | null;
  assignedDepartment?: string | null;
  departmentContactId?: string | null;
};

function inGroup(status: string | null | undefined, group: readonly string[]): boolean {
  return group.includes(normalizeIssueStatus(status));
}

export function isInProgressStatus(status?: string | null): boolean {
  return inGroup(status, IN_PROGRESS_STATUSES);
}

export function isOverdueStatus(status?: string | null): boolean {
  return inGroup(status, OVERDUE_STATUSES);
}

export function isResolvedClosedStatus(status?: string | null): boolean {
  return inGroup(status, RESOLVED_CLOSED_STATUSES);
}

export function isRejectedStatus(status?: string | null): boolean {
  return inGroup(status, REJECTED_STATUSES);
}

export function hasAssignee(issue: AssigneeFields): boolean {
  const status = normalizeIssueStatus(issue.status);
  if ((ASSIGNED_STATUSES as readonly string[]).includes(status)) return true;
  const official = String(issue.assignedOfficialName || "").trim();
  if (official && official.toLowerCase() !== "unassigned") return true;
  return Boolean(
    issue.assignedOfficialPhone || issue.assignedDepartment || issue.departmentContactId
  );
}

/** One ticket belongs to exactly one KPI bucket. In progress is never open/pending. */
export function kpiBucket(issue: AssigneeFields): KpiBucket {
  const status = normalizeIssueStatus(issue.status);
  if (isRejectedStatus(status)) return "REJECTED";
  if (isResolvedClosedStatus(status)) return "RESOLVED";
  if (isOverdueStatus(status)) return "OVERDUE";
  if (isInProgressStatus(status)) return "IN_PROGRESS";
  if (hasAssignee(issue)) return "ASSIGNED";
  return "OPEN_UNASSIGNED";
}

export function isOpenUnassignedStatus(issue: AssigneeFields): boolean {
  return kpiBucket(issue) === "OPEN_UNASSIGNED";
}

export function isAssignedBucket(issue: AssigneeFields): boolean {
  return kpiBucket(issue) === "ASSIGNED";
}

export function countByKpi<T extends AssigneeFields>(issues: T[]) {
  const counts = {
    total: issues.length,
    openUnassigned: 0,
    assigned: 0,
    inProgress: 0,
    overdue: 0,
    resolvedClosed: 0,
    rejected: 0
  };
  for (const issue of issues) {
    const bucket = kpiBucket(issue);
    if (bucket === "OPEN_UNASSIGNED") counts.openUnassigned += 1;
    else if (bucket === "ASSIGNED") counts.assigned += 1;
    else if (bucket === "IN_PROGRESS") counts.inProgress += 1;
    else if (bucket === "OVERDUE") counts.overdue += 1;
    else if (bucket === "RESOLVED") counts.resolvedClosed += 1;
    else if (bucket === "REJECTED") counts.rejected += 1;
  }
  return counts;
}

/** Compact counts so KPI chips stay readable up through lakhs and crores. */
export function formatDashboardCount(value: number): string {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  const compact = (raw: number, suffix: string) => {
    const digits = raw >= 100 ? 0 : raw >= 10 ? 1 : 2;
    return `${raw.toFixed(digits).replace(/\.?0+$/, "")}${suffix}`;
  };
  if (n >= 10_000_000) return compact(n / 10_000_000, "Cr");
  if (n >= 100_000) return compact(n / 100_000, "L");
  if (n >= 10_000) return compact(n / 1_000, "k");
  return n.toLocaleString("en-IN");
}

export function assignmentSafeStatus(current?: string | null): string {
  const status = normalizeIssueStatus(current);
  if (["IN_PROGRESS", "OVERDUE", "RESOLVED", "COMPLETED", "REJECTED", "CLOSED"].includes(status)) {
    return status;
  }
  return "ASSIGNED";
}

/** Volunteer resend after officer rejection reopens the ticket for the department. */
export function volunteerAssignmentStatus(current?: string | null): string {
  if (normalizeIssueStatus(current) === "REJECTED") return "ASSIGNED";
  return assignmentSafeStatus(current);
}

/** One unique gold surface for every ticket status (Assign Tickets, all roles). */
export const UNIQUE_TICKET_SURFACE = {
  card: "bg-[#0E1724] border-[#D4A24C]/45 hover:border-[#D4A24C]/85 hover:bg-[#131E2D] shadow-[0_0_14px_rgba(212,162,76,0.16)]",
  row: "bg-[#0B131E]",
  kpi: "bg-[#071322]/55 text-[#D4A24C] border-[#D4A24C]/40 hover:border-[#D4A24C]/80",
  badge: "bg-[#071322] text-[#D4A24C] border border-[#D4A24C]/40"
} as const;

export const TICKET_TABLE_WRAP =
  "whitespace-normal break-words [overflow-wrap:anywhere] leading-snug";

export const TICKET_TABLE_CLASS =
  "w-full table-fixed text-left text-xs border-separate border-spacing-y-2.5 border-spacing-x-0";

export const TICKET_TABLE_HEAD_CELL = `py-2 px-2 ${TICKET_TABLE_WRAP}`;

export const TICKET_TABLE_ROW_CLASS =
  `${UNIQUE_TICKET_SURFACE.row} transition-shadow cursor-pointer group shadow-[0_0_16px_rgba(212,162,76,0.28)] hover:shadow-[0_0_24px_rgba(212,162,76,0.48)] hover:bg-[#131E2D] [&>td]:border-y [&>td]:border-[#D4A24C]/55 [&>td+td]:border-l [&>td:first-child]:border-l [&>td:last-child]:border-r [&>td:first-child]:rounded-l-lg [&>td:last-child]:rounded-r-lg`;

export const TICKET_TABLE_CELL = `py-1.5 px-2 align-top ${TICKET_TABLE_WRAP}`;

export function ticketStatusSurface(_issue?: AssigneeFields): {
  card: string;
  row: string;
  kpi: string;
  badge: string;
} {
  return UNIQUE_TICKET_SURFACE;
}
