export const ISSUE_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  OPEN: "Open",
  ACKNOWLEDGED: "Acknowledged",
  ASSIGNED: "Assigned",
  ASSIGNED_TO_DEPARTMENT: "Assigned to Department",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  RESOLVED: "Resolved",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  OVERDUE: "Overdue",
  CLOSED: "Closed"
};

export function formatIssueStatus(status?: string | null): string {
  if (!status) return "Unknown";
  const key = String(status).trim().toUpperCase();
  if (ISSUE_STATUS_LABELS[key]) return ISSUE_STATUS_LABELS[key];
  return key
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export const OFFICER_ACTION_STATUSES = ["IN_PROGRESS", "RESOLVED", "REJECTED"] as const;

export type OfficerActionStatus = (typeof OFFICER_ACTION_STATUSES)[number];

export const OFFICER_STATUS_OPTION_LABELS: Record<OfficerActionStatus, string> = {
  IN_PROGRESS: "IN_PROGRESS — Field work / team dispatched",
  RESOLVED: "RESOLVED — Grievance completely fixed & closed",
  REJECTED: "REJECTED — Invalid / Duplicate / Outside Scope"
};

/** Remaining officer actions for the portal dropdown. Current status is never listed. */
export function nextOfficerActionStatuses(current?: string | null): OfficerActionStatus[] {
  const status = String(current || "").trim().toUpperCase();
  if (status === "IN_PROGRESS") return ["RESOLVED", "REJECTED"];
  if (status === "RESOLVED" || status === "REJECTED" || status === "CLOSED" || status === "COMPLETED") {
    return [];
  }
  return ["IN_PROGRESS", "RESOLVED", "REJECTED"];
}

export function defaultOfficerActionStatus(current?: string | null): OfficerActionStatus {
  return nextOfficerActionStatuses(current)[0] || "IN_PROGRESS";
}
