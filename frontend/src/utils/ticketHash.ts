export function getAssignTicketsParamsFromHash(): {
  status: string;
  assignedOnly: boolean;
  volunteerId: string;
} {
  const raw = window.location.hash || "";
  const query = raw.includes("?") ? raw.split("?")[1] : "";
  const params = new URLSearchParams(query);
  const status = (params.get("status") || "").toUpperCase();
  const assigned = (params.get("assigned") || "").toLowerCase();
  const volunteerId = (params.get("volunteer") || "").trim();
  return {
    status,
    assignedOnly: assigned === "1" || assigned === "true",
    volunteerId: volunteerId || "ALL"
  };
}

export function getTicketIdFromHash(): string {
  const match = (window.location.hash || "").match(/[?&]ticket=([^&]+)/i);
  if (!match?.[1]) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function setTicketIdInHash(issueId: string) {
  const raw = window.location.hash || "#/field-ops";
  const path = raw.split("?")[0] || "#/field-ops";
  const params = new URLSearchParams(raw.includes("?") ? raw.split("?")[1] : "");
  params.set("ticket", issueId);
  window.location.hash = `${path}?${params.toString()}`;
}

export function clearTicketIdFromHash() {
  const raw = window.location.hash || "";
  if (!/[?&]ticket=/i.test(raw)) return;
  const path = raw.split("?")[0];
  const params = new URLSearchParams(raw.includes("?") ? raw.split("?")[1] : "");
  params.delete("ticket");
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}${path}${query ? `?${query}` : ""}`
  );
}
