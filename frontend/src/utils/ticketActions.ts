/** Assign is only allowed while a ticket is still open / pending / new. */
export const ASSIGNABLE_TICKET_STATUSES = ["NEW", "OPEN", "PENDING", "UNRESOLVED"] as const;

export function isTicketOpenForAssign(status?: string | null): boolean {
  const key = String(status || "NEW").trim().toUpperCase().replace(/\s+/g, "_");
  return (ASSIGNABLE_TICKET_STATUSES as readonly string[]).includes(key);
}

export function isRejectedTicket(status?: string | null): boolean {
  return String(status || "").trim().toUpperCase() === "REJECTED";
}

/** Volunteers can first-assign open tickets, or resend a rejected ticket to the officer. */
export function canVolunteerAssignOrResend(status?: string | null): boolean {
  return isTicketOpenForAssign(status) || isRejectedTicket(status);
}
