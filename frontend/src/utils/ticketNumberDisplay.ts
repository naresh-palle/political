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

export const INITIAL_TICKET_SEQUENCE = 1;

const SEQ_SUFFIX = /-(\d{6})$/;

export function ticketYearCode(issue: TicketLike | null | undefined): string {
  const yearSource = issue?.reportedDate || issue?.createdAt || new Date().toISOString();
  const year = new Date(yearSource).getFullYear();
  return String(Number.isFinite(year) ? year : 2026).slice(-2);
}

export function ticketNumberPrefix(issue: TicketLike | null | undefined): string {
  if (!issue) return "";
  const geo = geoCodeFromIssue(issue);
  if (!geo) return "";
  return `LL-${officeCodeFromIssue(issue)}-${geo}-${ticketYearCode(issue)}-`;
}

export function parseTicketSequence(ticketNumber?: string | null): number | null {
  const raw = stripTicketNumberParens(String(ticketNumber || ""));
  const match = raw.match(SEQ_SUFFIX);
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : null;
}

export function nextTicketSequence(existing: TicketLike[] | string[] | null | undefined, issue: TicketLike): number {
  const prefix = ticketNumberPrefix(issue);
  let max = INITIAL_TICKET_SEQUENCE - 1;
  for (const item of existing || []) {
    const raw = typeof item === "string" ? item : stripTicketNumberParens(String(item?.ticketNumber || ""));
    if (prefix && !raw.startsWith(prefix)) continue;
    const seq = parseTicketSequence(raw);
    if (seq != null && seq > max) max = seq;
  }
  return max + 1;
}

export function allocateTicketNumber(
  issue: TicketLike,
  sequence?: number,
  existing?: TicketLike[] | string[]
): string {
  const stored = stripTicketNumberParens(String(issue.ticketNumber || ""));
  if (stored && sequence == null && existing == null) return stored;
  const geo = geoCodeFromIssue(issue);
  if (!geo) return stored || rawTicketNumber({ ...issue, ticketNumber: "" });
  const seq = sequence ?? nextTicketSequence(existing, issue);
  return `LL-${officeCodeFromIssue(issue)}-${geo}-${ticketYearCode(issue)}-${String(seq).padStart(6, "0")}`;
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
