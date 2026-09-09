/** User-facing ticket number formatting. Stored ticketNumber/id stay unchanged. */

export type TicketLike = {
  id?: string;
  ticketNumber?: string;
  ticketLabel?: string;
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

export const CATALOG_OPEN_PREFIX = "iss-ll-sec-open-";
const CATALOG_OPEN_RE = /^iss-ll-sec-open-(\d+)$/i;
const CATALOG_ISSUE_RE = /^iss-ll-sec-[a-z]+-\d+$/i;
const GENERATED_HEX_ID_RE = /^iss-[0-9a-f]+$/i;

function itemIssueId(item: TicketLike | string | null | undefined): string {
  if (typeof item === "string") return item.trim();
  return String(item?.id || "").trim();
}

/** Timestamp/uuid hex ids like iss-1a0867aef1e. Empty counts as generated. */
export function isGeneratedHexIssueId(issueId?: string | null): boolean {
  const text = String(issueId || "").trim();
  if (!text) return true;
  return GENERATED_HEX_ID_RE.test(text);
}

export function isCatalogIssueId(issueId?: string | null): boolean {
  return CATALOG_ISSUE_RE.test(String(issueId || "").trim());
}

export function nextCatalogOpenSequence(existing: TicketLike[] | string[] | null | undefined): number {
  let max = 0;
  for (const item of existing || []) {
    const match = itemIssueId(item).match(CATALOG_OPEN_RE);
    if (!match) continue;
    const seq = Number.parseInt(match[1], 10);
    if (Number.isFinite(seq) && seq > max) max = seq;
  }
  return max + 1;
}

/** Next seed-style id: iss-ll-sec-open-03 after open-01/open-02. Drops hex timestamps. */
export function allocateCatalogIssueId(
  existing?: TicketLike[] | string[] | null,
  candidate?: string | null
): string {
  const existingIds = new Set<string>();
  for (const item of existing || []) {
    const raw = itemIssueId(item);
    if (raw) existingIds.add(raw);
  }
  const text = String(candidate || "").trim();
  if (text && !isGeneratedHexIssueId(text) && !existingIds.has(text)) {
    return text;
  }
  let seq = nextCatalogOpenSequence(existing);
  while (true) {
    const issueId = `${CATALOG_OPEN_PREFIX}${String(seq).padStart(2, "0")}`;
    if (!existingIds.has(issueId)) return issueId;
    seq += 1;
  }
}

/** Public ticket string for Meta templates. Catalog id, never a hex timestamp. */
export function whatsAppTicketRef(issue: TicketLike | null | undefined): string {
  if (!issue) return "ticket";
  const id = String(issue.id || "").trim();
  if (isCatalogIssueId(id)) return id;
  const label = stripTicketNumberParens(String(issue.ticketLabel || issue.ticketNumber || ""));
  if (isCatalogIssueId(label)) return label;
  if (label) return label;
  if (id && !isGeneratedHexIssueId(id)) return id;
  return id || "ticket";
}
