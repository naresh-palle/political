const PLATFORM_LABEL: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X / Twitter",
  youtube: "YouTube"
};

export function humanPiStatus(status?: string | null) {
  const key = String(status || "").toUpperCase();
  if (key === "VERIFIED") return "verified";
  if (key === "PENDING") return "pending review";
  if (key === "NEEDS_RECHECK") return "needs a recheck";
  if (key === "REJECTED") return "rejected";
  if (key === "NO_ACCOUNT") return "marked as no account";
  if (key === "INACTIVE") return "inactive";
  return "not yet reviewed";
}

export function humanCount(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "";
  const n = Number(value);
  return n.toLocaleString("en-IN");
}

function handleFromAccount(account: any) {
  const stored = String(account?.accountUsername || account?.accountIdentifier || "").trim().replace(/^@/, "");
  if (stored) return stored;
  const url = String(account?.profileUrl || "").trim();
  if (!url || url.includes("none.invalid")) return "";
  try {
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const parsed = new URL(href);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] || "").replace(/^@/, "");
  } catch {
    return "";
  }
}

export function accountBriefing(account: any, leaderName = "") {
  const platform = PLATFORM_LABEL[String(account?.platform || "").toLowerCase()] || "social";
  const name = leaderName || account?.leaderName || "This leader";
  if (account?.noAccount || String(account?.verificationStatus || "").toUpperCase() === "NO_ACCOUNT") {
    return `${name} has no ${platform} account on file.`;
  }
  const handle = handleFromAccount(account);
  const followers = humanCount(account?.followers);
  const status = humanPiStatus(account?.verificationStatus);
  const handleBit = handle ? ` (${handle})` : "";
  const followerBit = followers ? ` about ${followers} followers` : " no follower count yet";
  return `${name}'s ${platform}${handleBit} has${followerBit} and is ${status}.`;
}

export function leaderBriefing(leader: any, accounts: any[] = []) {
  const name = String(leader?.name || "Unnamed leader").trim();
  const party = String(leader?.partyId || "").trim();
  const role = String(leader?.politicalRole || "").replace(/_/g, " ").trim();
  const place = String(leader?.assemblyName || leader?.assemblyConstituencyId || "").trim();
  const who = [name, party && `(${party})`, role].filter(Boolean).join(" ");
  const where = place ? ` in ${place}` : "";
  const related = accounts.filter((row) => row?.personId === leader?.id);
  if (!related.length) {
    return `${who}${where}. No social accounts have been entered yet.`;
  }
  const parts = related.map((row) => accountBriefing(row, name));
  return `${who}${where}. ${parts.join(" ")}`;
}

export function overviewBriefing(input: {
  stateName?: string;
  districtName?: string;
  constituencyName?: string;
  totalConstituencies?: number;
  constituenciesEntered?: number;
  totalLeaders?: number;
  totalSocialAccounts?: number;
  verifiedAccounts?: number;
  pendingVerification?: number;
}) {
  const place = [input.constituencyName, input.districtName, input.stateName].filter(Boolean).join(", ") || "the selected area";
  const entered = input.constituenciesEntered ?? 0;
  const total = input.totalConstituencies ?? 0;
  const leaders = input.totalLeaders ?? 0;
  const accounts = input.totalSocialAccounts ?? 0;
  const verified = input.verifiedAccounts ?? 0;
  const pending = input.pendingVerification ?? 0;
  const coverage = total ? `${entered} of ${total} assembly constituencies have data.` : `${entered} constituencies have data.`;
  return [
    `Political intelligence briefing for ${place}.`,
    coverage,
    `${leaders} leaders and ${accounts} social accounts are on file.`,
    verified ? `${verified} accounts are verified.` : "No accounts are verified yet.",
    pending ? `${pending} accounts are still pending review.` : "There is no pending verification queue."
  ].join(" ");
}
