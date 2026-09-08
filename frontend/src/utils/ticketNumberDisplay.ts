/** User-facing ticket number formatting. Stored ticketNumber/id stay unchanged. */

export type TicketLike = {
  id?: string;
  ticketNumber?: string;
  assemblyConstituencyId?: string;
  assemblyConstituencyName?: string;
  parliamentConstituencyId?: string;
  parliamentConstituencyName?: string;
  reportedDate?: string;
  createdAt?: string;
};

const PARENS_SUFFIX = /\s*\([^)]*\)\s*$/;

export function stripTicketNumberParens(value: string): string {
  return String(value || "").replace(PARENS_SUFFIX, "").trim();
}

export function constituencyShortName(issue: TicketLike | null | undefined): string {
  if (!issue) return "";
  const raw =
    String(issue.assemblyConstituencyName || issue.parliamentConstituencyName || "").trim();
  if (!raw) return "";
  let name = raw.replace(PARENS_SUFFIX, "").trim();
  name = name.replace(/\s+(Assembly|Constituency|AC|PC)\s*$/i, "").trim();
  return name;
}

export function geoCodeFromIssue(issue: TicketLike | null | undefined): string {
  if (!issue) return "";
  const acName = String(issue.assemblyConstituencyName || "");
  const acMatch = acName.match(/\(AC[-\s]?(\d+)\)/i);
  if (acMatch) return `AC${acMatch[1].padStart(3, "0")}`;
  const pcName = String(issue.parliamentConstituencyName || "");
  const pcMatch = pcName.match(/\(PC[-\s]?(\d+)\)/i);
  if (pcMatch) return `PC${pcMatch[1].padStart(2, "0")}`;
  return "";
}

export function officeCodeFromIssue(issue: TicketLike | null | undefined): string {
  if (!issue) return "MLA";
  if (issue.assemblyConstituencyId) return "MLA";
  if (issue.parliamentConstituencyId) return "MP";
  return "MLA";
}

/** Unique ticket identifier for search, APIs, and URLs. Never includes constituency parens. */
export function rawTicketNumber(issue: TicketLike | null | undefined): string {
  if (!issue) return "LL-TICKET";
  const stored = stripTicketNumberParens(String(issue.ticketNumber || ""));
  if (stored) return stored;
  const id = String(issue.id || "LL-TICKET");
  if (id.startsWith("LL-") || id.startsWith("#")) return id;
  if (id.startsWith("iss-")) return `LL-${id.replace(/^iss-/, "")}`;
  return `#${id}`;
}

/** Display only: LL-MLA-AC140-26-000123 (Banaganapalle). */
export function formatTicketDisplay(issue: TicketLike | null | undefined): string {
  const raw = rawTicketNumber(issue);
  const place = constituencyShortName(issue);
  return place ? `${raw} (${place})` : raw;
}

export function allocateTicketNumber(issue: TicketLike, sequence?: number): string {
  const existing = stripTicketNumberParens(String(issue.ticketNumber || ""));
  if (existing) return existing;
  const geo = geoCodeFromIssue(issue);
  if (!geo) return rawTicketNumber(issue);
  const yearSource = issue.reportedDate || issue.createdAt || new Date().toISOString();
  const year = String(new Date(yearSource).getFullYear() || 2026).slice(-2);
  const seq = String(sequence ?? Date.now() % 1_000_000).padStart(6, "0");
  return `LL-${officeCodeFromIssue(issue)}-${geo}-${year}-${seq}`;
}

export function ticketSearchHaystack(issue: TicketLike): string {
  return [
    issue.id,
    issue.ticketNumber,
    rawTicketNumber(issue),
    formatTicketDisplay(issue),
    constituencyShortName(issue),
    issue.assemblyConstituencyName,
    issue.parliamentConstituencyName
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
