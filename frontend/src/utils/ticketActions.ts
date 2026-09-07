/** Assign is only allowed while a ticket is still open / pending / new. */
export const ASSIGNABLE_TICKET_STATUSES = ["NEW", "OPEN", "PENDING", "UNRESOLVED"] as const;

export function isTicketOpenForAssign(status?: string | null): boolean {
  const key = String(status || "NEW").trim().toUpperCase().replace(/\s+/g, "_");
  return (ASSIGNABLE_TICKET_STATUSES as readonly string[]).includes(key);
}

const OFFICER_PROGRESS_STATUSES = ["IN_PROGRESS", "RESOLVED", "REJECTED", "COMPLETED", "CLOSED"] as const;

/** Keep officer In Progress / Resolved / Rejected when a volunteer re-assigns. */
export function statusAfterAssignment(current?: string | null): string {
  const key = String(current || "NEW").trim().toUpperCase().replace(/\s+/g, "_");
  if ((OFFICER_PROGRESS_STATUSES as readonly string[]).includes(key)) return key;
  return "ASSIGNED";
}
