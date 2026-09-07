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
