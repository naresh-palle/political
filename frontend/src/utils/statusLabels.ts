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
