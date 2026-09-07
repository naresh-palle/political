/** Status buckets for field-ops KPI cards. Groups are mutually exclusive. */

export function normalizeIssueStatus(status?: string | null): string {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/['’]/g, "")
    .replace(/\s+/g, "_");
}

/** Waiting / assigned — not yet ground work, overdue, resolved, or rejected. */
export const PENDING_OPEN_STATUSES = [
  "NEW",
  "OPEN",
  "PENDING",
  "UNRESOLVED",
  "ASSIGNED",
  "ACKNOWLEDGED",
  "ASSIGNED_TO_DEPARTMENT",
  "ON_HOLD"
] as const;

export const IN_PROGRESS_STATUSES = ["IN_PROGRESS"] as const;
export const OVERDUE_STATUSES = ["OVERDUE"] as const;
export const RESOLVED_CLOSED_STATUSES = ["RESOLVED", "COMPLETED", "CLOSED"] as const;
export const REJECTED_STATUSES = ["REJECTED"] as const;

function inGroup(status: string | null | undefined, group: readonly string[]): boolean {
  return group.includes(normalizeIssueStatus(status));
}

export function isPendingOpenStatus(status?: string | null): boolean {
  return inGroup(status, PENDING_OPEN_STATUSES);
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

export function countByKpi<T extends { status?: string | null }>(issues: T[]) {
  return {
    total: issues.length,
    pendingOpen: issues.filter((i) => isPendingOpenStatus(i.status)).length,
    inProgress: issues.filter((i) => isInProgressStatus(i.status)).length,
    overdue: issues.filter((i) => isOverdueStatus(i.status)).length,
    resolvedClosed: issues.filter((i) => isResolvedClosedStatus(i.status)).length,
    rejected: issues.filter((i) => isRejectedStatus(i.status)).length
  };
}
