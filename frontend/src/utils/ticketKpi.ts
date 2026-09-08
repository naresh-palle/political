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

export function ticketStatusSurface(issue: AssigneeFields): {
  card: string;
  row: string;
  kpi: string;
} {
  const bucket = kpiBucket(issue);
  switch (bucket) {
    case "OPEN_UNASSIGNED":
      return {
        card: "bg-amber-950/35 border-amber-500/40 hover:border-amber-400/70 hover:bg-amber-950/50",
        row: "bg-amber-950/20 hover:bg-amber-950/35",
        kpi: "bg-amber-950/40 border-amber-500/40 hover:border-amber-400/70"
      };
    case "ASSIGNED":
      return {
        card: "bg-violet-950/35 border-violet-500/40 hover:border-violet-400/70 hover:bg-violet-950/50",
        row: "bg-violet-950/20 hover:bg-violet-950/35",
        kpi: "bg-violet-950/40 border-violet-500/40 hover:border-violet-400/70"
      };
    case "IN_PROGRESS":
      return {
        card: "bg-sky-950/40 border-sky-500/45 hover:border-sky-400/70 hover:bg-sky-950/55",
        row: "bg-sky-950/20 hover:bg-sky-950/35",
        kpi: "bg-sky-950/40 border-sky-500/40 hover:border-sky-400/70"
      };
    case "OVERDUE":
      return {
        card: "bg-rose-950/45 border-rose-500/50 hover:border-rose-400/80 hover:bg-rose-950/60",
        row: "bg-rose-950/25 hover:bg-rose-950/40",
        kpi: "bg-rose-950/45 border-rose-500/50 hover:border-rose-400/80"
      };
    case "RESOLVED":
      return {
        card: "bg-emerald-950/35 border-emerald-500/40 hover:border-emerald-400/70 hover:bg-emerald-950/50",
        row: "bg-emerald-950/20 hover:bg-emerald-950/35",
        kpi: "bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400/70"
      };
    case "REJECTED":
      return {
        card: "bg-slate-800/50 border-slate-500/40 hover:border-slate-400/70 hover:bg-slate-800/70",
        row: "bg-slate-800/30 hover:bg-slate-800/50",
        kpi: "bg-slate-800/50 border-slate-500/40 hover:border-slate-400/70"
      };
    default:
      return {
        card: "bg-[#0E1724] border-[#223348] hover:border-[#D4A24C]/60 hover:bg-[#131E2D]",
        row: "hover:bg-[#131E2D]/70",
        kpi: "bg-[#0F1E30] border-[#22354D] hover:border-[#D4A24C]/60"
      };
  }
}
