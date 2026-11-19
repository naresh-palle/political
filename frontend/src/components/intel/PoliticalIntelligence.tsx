import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Download,
  Loader2,
  MapPin,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { UserProfile, PiDashboard, PiDistrictProgress, PiRecentCollection, StateInfo, PoliticalParty, ParliamentInfo } from "../../types";
import { politicalApiService } from "../../services/api";
import { UNIQUE_TICKET_SURFACE } from "../../utils/ticketKpi";
import { canManagePoliticalIntelligence, isSmAUser, isSmMUser } from "../../utils/piAccess";
import { cacheHasPiData, readPiOperatorCache, writePiOperatorCache } from "../../utils/piOperatorCache";
import { downloadPiCsvExport } from "../../utils/piExcelExport";

type Tab = "dashboard" | "constituencies" | "verify" | "import" | "intelligence";
type EntryGroup = "constituency" | "leaders";
type SaveKind = "constituency" | "leader" | null;
type LeaderKind = "LEADER_1" | "LEADER_2" | "LEADER_3" | "LEADER_4";

const LEADER_SLOTS: { kind: LeaderKind; label: string; defaultRole: string; defaultParty: string }[] = [
  { kind: "LEADER_1", label: "Leader 1", defaultRole: "MLA", defaultParty: "TDP" },
  { kind: "LEADER_2", label: "Leader 2", defaultRole: "OTHER", defaultParty: "" },
  { kind: "LEADER_3", label: "Leader 3", defaultRole: "OTHER", defaultParty: "" },
  { kind: "LEADER_4", label: "Leader 4", defaultRole: "OTHER", defaultParty: "" }
];

function slotIndexForKind(kind?: string): number {
  if (kind === "LEADER_1" || kind === "SITTING_MLA") return 0;
  if (kind === "LEADER_2" || kind === "OPPOSITION") return 1;
  if (kind === "LEADER_3") return 2;
  if (kind === "LEADER_4") return 3;
  return -1;
}

function leaderKindLabel(kind?: string) {
  const index = slotIndexForKind(kind);
  return index >= 0 ? LEADER_SLOTS[index].label : "Leader";
}

type LeaderFieldAlert = {
  index: number;
  field: string;
  leaderLabel: string;
  fieldLabel: string;
  message: string;
};

function leaderFieldDomId(index: number, field: string) {
  if (field === "ac") return "pi-geo-ac";
  return `pi-leader-${index}-${field}`;
}

function focusLeaderField(fieldId: string) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    if (typeof (el as HTMLElement).focus === "function") {
      (el as HTMLElement).focus({ preventScroll: true });
    }
  }, 280);
}

function inputClass(invalid?: boolean) {
  return `${INPUT}${invalid ? " border-rose-400 ring-2 ring-rose-400/80" : ""}`;
}

function isSittingMlaKind(kind?: string) {
  return !kind || kind === "SITTING_MLA" || kind === "LEADER_1";
}

const SMA_TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Data Entry Dashboard" },
  { id: "constituencies", label: "Constituencies" }
];

const SMM_TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Data Entry Dashboard" },
  { id: "verify", label: "Verification Queue" },
  { id: "import", label: "Import / Export" },
  { id: "intelligence", label: "Intelligence" }
];

const ADMIN_TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Data Entry Dashboard" },
  { id: "constituencies", label: "Constituencies" },
  { id: "verify", label: "Verification Queue" },
  { id: "import", label: "Import / Export" },
  { id: "intelligence", label: "Intelligence" }
];

const ENTRY_GROUPS: { id: EntryGroup; label: string }[] = [
  { id: "constituency", label: "Constituency" },
  { id: "leaders", label: "Leaders" }
];

const ROLES = [
  "MLA",
  "LOK_SABHA_MP",
  "RAJYA_SABHA_MP",
  "MLC",
  "MINISTER",
  "CHIEF_MINISTER",
  "DEPUTY_CHIEF_MINISTER",
  "CABINET_MINISTER",
  "MINISTER_OF_STATE",
  "FORMER_MLA",
  "FORMER_MP",
  "FORMER_MLC",
  "PROSPECTIVE_CANDIDATE",
  "CONTESTED_CANDIDATE",
  "PARTY_LEADER",
  "PARTY_PRESIDENT",
  "OTHER"
];

const PLATFORMS = ["facebook", "instagram", "x", "youtube"] as const;
const PLATFORM_LABEL: Record<(typeof PLATFORMS)[number], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube"
};
const RANK_BY_OPTIONS = [
  { id: "followers", label: "Followers" },
  { id: "engagement", label: "Engagement" },
  { id: "growth", label: "30-day growth" },
  { id: "socialScore", label: "Social score" }
] as const;
const COLLECTION_PAGE_SIZES = [10, 25, 50, 100] as const;
const RECORD_TYPE_LABEL: Record<string, string> = {
  constituency: "Constituency",
  leader: "Leader",
  social: "Social"
};

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  for (const raw of values) {
    const value = String(raw || "").trim();
    if (value) seen.add(value);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

type CollectionFilters = {
  type: string;
  assembly: string;
  enteredBy: string;
  status: string;
};

function collectionRowMatches(row: PiRecentCollection, filters: CollectionFilters, skip?: keyof CollectionFilters) {
  if (skip !== "type" && filters.type && String(row.recordType || "") !== filters.type) return false;
  if (skip !== "assembly" && filters.assembly && String(row.assemblyName || "") !== filters.assembly) return false;
  if (skip !== "enteredBy" && filters.enteredBy && String(row.enteredByName || "") !== filters.enteredBy) return false;
  if (skip !== "status" && filters.status && String(row.verificationStatus || "") !== filters.status) return false;
  return true;
}

function isTransientLoadError(err: any) {
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg === "load failed" ||
    msg.includes("could not load")
  );
}

type QueueFilters = {
  district: string;
  assembly: string;
  platform: string;
};

function queueRowMatches(row: any, filters: QueueFilters, skip?: keyof QueueFilters) {
  if (skip !== "district" && filters.district && String(row.districtName || "") !== filters.district) return false;
  if (skip !== "assembly" && filters.assembly && String(row.assemblyName || "") !== filters.assembly) return false;
  if (skip !== "platform" && filters.platform && String(row.platform || "").toLowerCase() !== filters.platform) return false;
  return true;
}

function rankMetricKey(rankBy: string) {
  if (rankBy === "engagement") return "engagementPercent";
  if (rankBy === "growth") return "growth30";
  if (rankBy === "socialScore") return "socialScore";
  return "followers";
}

function platformDetail(leader: any, platform: string) {
  const fromMap = leader?.platforms?.[platform];
  if (fromMap) return fromMap;
  const acc = (leader?.accounts || []).find((a: any) => String(a.platform || "").toLowerCase() === platform);
  if (!acc) return null;
  return {
    followers: acc.followers,
    noAccount: Boolean(acc.noAccount || acc.verificationStatus === "NO_ACCOUNT"),
    verified: acc.verificationStatus === "VERIFIED",
    profileUrl: acc.profileUrl,
    engagementPercent: acc.engagementPercent,
    growth30: acc.growth30,
    postsLast30Days: acc.postsLast30Days
  };
}

function rankMetricForLeader(leader: any, platform: string, rankBy: string): number | null {
  if (platform) {
    const detail = platformDetail(leader, platform);
    if (!detail || detail.noAccount) return null;
    if (rankBy === "engagement") return detail.engagementPercent == null ? null : Number(detail.engagementPercent);
    if (rankBy === "growth") return detail.growth30 == null ? null : Number(detail.growth30);
    if (rankBy === "socialScore") {
      if (leader.rankPlatform === platform && leader.socialScore != null) return Number(leader.socialScore);
      return detail.followers == null ? null : Number(detail.followers);
    }
    return detail.followers == null ? null : Number(detail.followers);
  }
  const key = rankMetricKey(rankBy);
  const value = leader?.[key];
  return value == null ? null : Number(value);
}

function rankInPool(
  leaders: any[],
  id: string | undefined,
  pred: (row: any) => boolean,
  metric: (row: any) => number | null
) {
  const pool = leaders.filter(pred);
  const sortable = pool
    .filter((row) => metric(row) != null)
    .sort((a, b) => Number(metric(b)) - Number(metric(a)));
  const idx = id ? sortable.findIndex((row) => row.id === id) : -1;
  return { value: idx >= 0 ? idx + 1 : null, of: sortable.length };
}

const SELECTED_PLATFORM_CARD = "ring-2 ring-inset ring-[#D4A24C] border-[#D4A24C] bg-[#D4A24C]/10";

type PlatformDraft = {
  hasAccount: "" | "yes" | "no";
  verified: "" | "yes" | "no";
  followers: string;
  profileUrl: string;
};

function emptyPlatformDrafts(): Record<(typeof PLATFORMS)[number], PlatformDraft> {
  return {
    facebook: { hasAccount: "", verified: "", followers: "", profileUrl: "" },
    instagram: { hasAccount: "", verified: "", followers: "", profileUrl: "" },
    x: { hasAccount: "", verified: "", followers: "", profileUrl: "" },
    youtube: { hasAccount: "", verified: "", followers: "", profileUrl: "" }
  };
}

type LeaderSlotState = {
  id?: string;
  name: string;
  partyId: string;
  politicalRole: string;
  politicalRoles: string[];
  leaderKind: LeaderKind;
  platformDrafts: Record<(typeof PLATFORMS)[number], PlatformDraft>;
  activePlatform: (typeof PLATFORMS)[number];
};

function emptyLeaderSlot(slot: (typeof LEADER_SLOTS)[number]): LeaderSlotState {
  return {
    name: "",
    partyId: slot.defaultParty,
    politicalRole: slot.defaultRole,
    politicalRoles: slot.defaultRole ? [slot.defaultRole] : [],
    leaderKind: slot.kind,
    platformDrafts: emptyPlatformDrafts(),
    activePlatform: "facebook"
  };
}

function mergeById(server: any[], local: any[]) {
  const byId = new Map<string, any>();
  for (const row of local || []) {
    if (row?.id) byId.set(row.id, row);
  }
  for (const row of server || []) {
    if (row?.id) byId.set(row.id, { ...(byId.get(row.id) || {}), ...row });
  }
  return Array.from(byId.values());
}

function roleListFromLeader(row: any, fallback: string[]) {
  const fromRoles = (row?.roles || []).map((item: any) => item?.politicalRole).filter(Boolean);
  if (fromRoles.length) return Array.from(new Set(fromRoles));
  if (row?.politicalRole) return [row.politicalRole];
  return fallback;
}

function draftsFromAccounts(personId: string, accountRows: any[]): Record<(typeof PLATFORMS)[number], PlatformDraft> {
  const next = emptyPlatformDrafts();
  accountRows.filter((row) => row.personId === personId).forEach((row) => {
    const platform = String(row.platform || "").toLowerCase() as (typeof PLATFORMS)[number];
    if (!PLATFORMS.includes(platform)) return;
    const noAccount = row.verificationStatus === "NO_ACCOUNT" || row.noAccount;
    next[platform] = {
      hasAccount: noAccount ? "no" : "yes",
      verified: row.verificationStatus === "VERIFIED" ? "yes" : "no",
      followers: row.followers != null ? String(row.followers) : "",
      profileUrl: noAccount ? "" : row.profileUrl || ""
    };
  });
  return next;
}

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function profileHref(url?: string) {
  const raw = String(url || "").trim();
  if (!raw || raw.includes("none.invalid")) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

const PLATFORM_HOSTS: Record<(typeof PLATFORMS)[number], string[]> = {
  facebook: ["facebook.com", "fb.com", "fb.me"],
  instagram: ["instagram.com", "instagr.am"],
  x: ["x.com", "twitter.com", "mobile.twitter.com", "t.co"],
  youtube: ["youtube.com", "youtu.be", "music.youtube.com"]
};

function profileHost(url?: string) {
  const href = profileHref(url);
  if (!href) return "";
  try {
    let host = new URL(href).hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);
    if (host === "mobile.twitter.com") host = "twitter.com";
    if (["m.facebook.com", "web.facebook.com"].includes(host)) host = "facebook.com";
    if (host === "m.youtube.com") host = "youtube.com";
    return host;
  } catch {
    return "";
  }
}

function detectedProfilePlatform(url?: string): (typeof PLATFORMS)[number] | "" {
  const host = profileHost(url);
  const match = (PLATFORMS as readonly string[]).find((platform) => PLATFORM_HOSTS[platform as (typeof PLATFORMS)[number]].includes(host));
  return (match as (typeof PLATFORMS)[number]) || "";
}

function profileUrlPlatformError(url: string, platform: (typeof PLATFORMS)[number]) {
  const raw = String(url || "").trim();
  if (!raw || raw.includes("none.invalid")) return "";
  const detected = detectedProfilePlatform(raw);
  if (detected && detected !== platform) {
    const otherLabel = detected === "x" ? "X / Twitter" : PLATFORM_LABEL[detected];
    const article = /^[aeioux]/i.test(otherLabel) ? "an" : "a";
    return `This is ${article} ${otherLabel} link. Enter a ${platform === "x" ? "X / Twitter" : PLATFORM_LABEL[platform]} profile link.`;
  }
  const host = profileHost(raw);
  if (host && host.includes(".") && !detected) {
    const example = platform === "x" ? "x.com or twitter.com" : PLATFORM_HOSTS[platform][0];
    const wanted = platform === "x" ? "X / Twitter" : PLATFORM_LABEL[platform];
    return `Enter a ${wanted} profile link (${example}).`;
  }
  return "";
}

function socialUsername(row: { accountUsername?: string; accountIdentifier?: string; profileUrl?: string; platform?: string }) {
  const stored = String(row.accountUsername || row.accountIdentifier || "").trim().replace(/^@/, "");
  if (stored) return stored;
  const href = profileHref(row.profileUrl);
  if (!href) return "";
  try {
    const parsed = new URL(href);
    const id = parsed.searchParams.get("id") || parsed.searchParams.get("v");
    if (id) return id;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (!parts.length) return "";
    if (["c", "channel", "user", "watch", "playlist"].includes(parts[0].toLowerCase()) && parts[1]) {
      return decodeURIComponent(parts[1]).replace(/^@/, "");
    }
    return decodeURIComponent(parts[0]).replace(/^@/, "");
  } catch {
    return "";
  }
}

function formatCompactCount(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  if (n >= 100000) {
    const lakh = n / 100000;
    return `${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)} L`;
  }
  if (n >= 1000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return String(Math.round(n));
}

const CARD = `rounded-xl p-3 border ${UNIQUE_TICKET_SURFACE.kpi}`;
const INPUT =
  "ll-dark-input w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] focus:bg-[#071322] rounded-xl px-3 py-2 text-sm text-[#F5EFE0] outline-none";
const LABEL = "block text-[10px] uppercase tracking-wider font-bold text-[#D4A24C] mb-1";
const BTN =
  "relative z-10 px-4 py-2 rounded-xl bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#071322] text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

function statusTone(status?: string) {
  if (status === "VERIFIED") return "text-emerald-300 border-emerald-500/40 bg-emerald-950/40";
  if (status === "NEEDS_RECHECK") return "text-amber-300 border-amber-500/40 bg-amber-950/40";
  if (status === "REJECTED") return "text-rose-300 border-rose-500/40 bg-rose-950/40";
  if (status === "NO_ACCOUNT" || status === "INACTIVE") return "text-[#B9AF95] border-[#22405E] bg-[#071322]";
  return "text-[#D4A24C] border-[#D4A24C]/40 bg-[#071322]";
}

function queueStatusOf(row: any) {
  return String(row?.verificationStatus || "").toUpperCase();
}

function queueCanAct(status?: string) {
  const current = String(status || "").toUpperCase();
  return current === "PENDING" || current === "NEEDS_RECHECK";
}

function collectedStatusKey(row?: { verificationStatus?: string; noAccount?: boolean } | string) {
  if (row && typeof row === "object") {
    if (row.noAccount) return "NO_ACCOUNT";
    const key = String(row.verificationStatus || "").toUpperCase().replace(/[\s-]+/g, "_");
    return !key || key === "—" ? "PENDING" : key;
  }
  const key = String(row || "").toUpperCase().replace(/[\s-]+/g, "_");
  return !key || key === "—" ? "PENDING" : key;
}

function canDeleteCollectedRow(row?: { recordType?: string; verificationStatus?: string; noAccount?: boolean }) {
  const status = collectedStatusKey(row);
  return status === "PENDING" || status === "NO_ACCOUNT";
}

const QUEUE_STATUS_TABS = [
  { id: "PENDING", label: "Pending" },
  { id: "NEEDS_RECHECK", label: "Recheck" },
  { id: "VERIFIED", label: "Verified" },
  { id: "REJECTED", label: "Rejected" }
] as const;

export const PoliticalIntelligence: React.FC<{ currentUser: UserProfile; openDataEntryTick?: number }> = ({ currentUser, openDataEntryTick = 0 }) => {
  const userId = currentUser.id;
  const isSmA = isSmAUser(currentUser);
  const isSmM = isSmMUser(currentUser);
  const isAdminEditor = canManagePoliticalIntelligence(currentUser);
  const canVerify = isSmM || isAdminEditor;
  const canEdit = isSmA || isAdminEditor;
  const canDelete = isSmM || isAdminEditor;
  const visibleTabs = isAdminEditor ? ADMIN_TABS : isSmM ? SMM_TABS : SMA_TABS;
  const initialCache = readPiOperatorCache(userId);
  const replayedRef = useRef(false);
  const dashReqRef = useRef(0);

  const [tab, setTab] = useState<Tab>("dashboard");
  const [entryGroup, setEntryGroup] = useState<EntryGroup>((initialCache?.entryGroup as EntryGroup) || "constituency");
  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState<SaveKind>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [dashboard, setDashboard] = useState<PiDashboard | null>(initialCache?.dashboard || null);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [parties, setParties] = useState<PoliticalParty[]>([]);
  const [parliaments, setParliaments] = useState<ParliamentInfo[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [stateId, setStateId] = useState(initialCache?.stateId || ((currentUser.stateId && currentUser.stateId.length <= 5) ? currentUser.stateId : "AP"));
  const [districtId, setDistrictId] = useState(initialCache?.districtId || "");
  const [pcId, setPcId] = useState(initialCache?.pcId || "");
  const [acId, setAcId] = useState(initialCache?.acId || "");
  const [constForm, setConstForm] = useState<any>({
    enteredByName: currentUser.name || "",
    dataCollectionDate: todayIsoDate()
  });
  const [constRows, setConstRows] = useState<any[]>(initialCache?.constRows || []);
  const [leaderSlots, setLeaderSlots] = useState<LeaderSlotState[]>(() => LEADER_SLOTS.map(emptyLeaderSlot));
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const [leaderAlert, setLeaderAlert] = useState<LeaderFieldAlert | null>(null);
  const [leaders, setLeaders] = useState<any[]>(initialCache?.leaders || []);
  const [accounts, setAccounts] = useState<any[]>(initialCache?.accounts || []);
  const [queue, setQueue] = useState<any[]>([]);
  const [queueStatus, setQueueStatus] = useState("PENDING");
  const [queueDistrict, setQueueDistrict] = useState("");
  const [queueAssembly, setQueueAssembly] = useState("");
  const [queuePlatform, setQueuePlatform] = useState("");
  const [queuePageSize, setQueuePageSize] = useState<(typeof COLLECTION_PAGE_SIZES)[number]>(10);
  const [queuePage, setQueuePage] = useState(1);
  const [actingId, setActingId] = useState("");
  const [collectionPageSize, setCollectionPageSize] = useState<(typeof COLLECTION_PAGE_SIZES)[number]>(10);
  const [collectionPage, setCollectionPage] = useState(1);
  const [collectionType, setCollectionType] = useState("");
  const [collectionAssembly, setCollectionAssembly] = useState("");
  const [collectionEnteredBy, setCollectionEnteredBy] = useState("");
  const [collectionStatus, setCollectionStatus] = useState("");
  const [intel, setIntel] = useState<any>(null);
  const [intelPlatform, setIntelPlatform] = useState("");
  const [intelParty, setIntelParty] = useState("");
  const [rankBy, setRankBy] = useState("followers");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [exportingAi, setExportingAi] = useState(false);
  const csvFileRef = useRef<HTMLInputElement>(null);

  const partyById = useMemo(() => Object.fromEntries(parties.map((p) => [p.id, p])), [parties]);
  const selectedDistrict = useMemo(
    () => districts.find((d) => d.id === districtId) || null,
    [districts, districtId]
  );
  const selectedDistrictProgress = useMemo(() => {
    if (!districtId) return null;
    const rows = dashboard?.districts || [];
    const hit = rows.find((d: PiDistrictProgress) => d.id === districtId);
    if (hit) return hit;
    if (!selectedDistrict) return null;
    const acCount = Array.isArray(selectedDistrict.assemblyConstituencyIds) ? selectedDistrict.assemblyConstituencyIds.length : 0;
    return {
      id: selectedDistrict.id,
      name: selectedDistrict.name,
      stateId: selectedDistrict.stateId || stateId,
      totalConstituencies: acCount,
      constituenciesEntered: 0,
      constituenciesPending: acCount,
      totalLeaders: 0,
      totalAccounts: 0,
      verifiedAccounts: 0,
      needsRecheck: 0,
      verificationPercent: null,
      lastUpdated: null
    } as PiDistrictProgress;
  }, [dashboard, districtId, selectedDistrict, stateId]);
  const dashboardRecent = useMemo(() => {
    const rows = dashboard?.recentCollections || [];
    if (!districtId) return rows;
    const acIds = new Set<string>(selectedDistrict?.assemblyConstituencyIds || []);
    return rows.filter((row: PiRecentCollection) => {
      if (row.districtId && row.districtId === districtId) return true;
      return Boolean(row.assemblyConstituencyId && acIds.has(row.assemblyConstituencyId));
    });
  }, [dashboard, districtId, selectedDistrict]);
  const collectionFilters = useMemo<CollectionFilters>(() => ({
    type: collectionType,
    assembly: collectionAssembly,
    enteredBy: collectionEnteredBy,
    status: collectionStatus
  }), [collectionType, collectionAssembly, collectionEnteredBy, collectionStatus]);
  const collectionFilterOptions = useMemo(() => {
    const facet = (skip: keyof CollectionFilters, pick: (row: PiRecentCollection) => string | null | undefined) =>
      uniqueSorted(dashboardRecent.filter((row) => collectionRowMatches(row, collectionFilters, skip)).map(pick));
    return {
      types: facet("type", (row) => row.recordType).map((value) => ({
        value,
        label: RECORD_TYPE_LABEL[value] || value
      })),
      assemblies: facet("assembly", (row) => row.assemblyName),
      enteredBy: facet("enteredBy", (row) => row.enteredByName),
      statuses: facet("status", (row) => row.verificationStatus)
    };
  }, [dashboardRecent, collectionFilters]);
  const filteredRecent = useMemo(
    () => dashboardRecent.filter((row) => collectionRowMatches(row, collectionFilters)),
    [dashboardRecent, collectionFilters]
  );
  const collectionFiltersActive = Boolean(
    collectionType || collectionAssembly || collectionEnteredBy || collectionStatus
  );
  const clearCollectionFilters = () => {
    setCollectionType("");
    setCollectionAssembly("");
    setCollectionEnteredBy("");
    setCollectionStatus("");
    setCollectionPage(1);
  };
  const collectionTotalPages = Math.max(1, Math.ceil(filteredRecent.length / collectionPageSize));
  const collectionPageSafe = Math.min(collectionPage, collectionTotalPages);
  const pagedRecent = filteredRecent.slice((collectionPageSafe - 1) * collectionPageSize, collectionPageSafe * collectionPageSize);

  const queueFilters = useMemo<QueueFilters>(() => ({
    district: queueDistrict,
    assembly: queueAssembly,
    platform: queuePlatform
  }), [queueDistrict, queueAssembly, queuePlatform]);
  const queueFilterOptions = useMemo(() => {
    const facet = (skip: keyof QueueFilters, pick: (row: any) => string | null | undefined) =>
      uniqueSorted(queue.filter((row) => queueRowMatches(row, queueFilters, skip)).map(pick));
    return {
      districts: facet("district", (row) => row.districtName),
      assemblies: facet("assembly", (row) => row.assemblyName),
      platforms: facet("platform", (row) => String(row.platform || "").toLowerCase()).map((value) => ({
        value,
        label: PLATFORM_LABEL[value as keyof typeof PLATFORM_LABEL] || value
      }))
    };
  }, [queue, queueFilters]);
  const filteredQueue = useMemo(
    () => queue.filter((row) => queueRowMatches(row, queueFilters)),
    [queue, queueFilters]
  );
  const queueFiltersActive = Boolean(queueDistrict || queueAssembly || queuePlatform);
  const clearQueueFilters = () => {
    setQueueDistrict("");
    setQueueAssembly("");
    setQueuePlatform("");
    setQueuePage(1);
  };
  const queueTotalPages = Math.max(1, Math.ceil(filteredQueue.length / queuePageSize));
  const queuePageSafe = Math.min(queuePage, queueTotalPages);
  const pagedQueue = filteredQueue.slice((queuePageSafe - 1) * queuePageSize, queuePageSafe * queuePageSize);

  const flash = (msg: string, isError = false) => {
    if (isError && isTransientLoadError({ message: msg })) {
      setError("");
      return;
    }
    setOk(isError ? "" : msg);
    setError(isError ? msg : "");
  };

  const emptyDashboard = (data: PiDashboard | null | undefined) =>
    !data || ((data.constituenciesEntered || 0) === 0 && (data.totalLeaders || 0) === 0 && (data.totalSocialAccounts || 0) === 0);

  const persistOperatorCache = (patch: Partial<{ dashboard: PiDashboard | null; constRows: any[]; leaders: any[]; accounts: any[]; queue: any[]; tab: Tab; entryGroup: EntryGroup }>) => {
    writePiOperatorCache(userId, {
      stateId,
      districtId,
      pcId,
      acId,
      tab,
      entryGroup,
      ...patch
    });
  };

  const replayCachedPi = async () => {
    if (!canEdit || replayedRef.current) return;
    const cache = readPiOperatorCache(userId);
    if (!cacheHasPiData(cache) || !cache) return;
    replayedRef.current = true;
    const idMap = new Map<string, string>();
    for (const row of cache.constRows || []) {
      try {
        await politicalApiService.savePiConstituency(userId, row);
      } catch {
        // Keep going so remaining cached rows still reach the server.
      }
    }
    for (const leader of cache.leaders || []) {
      try {
        const saved = await politicalApiService.savePiLeader(userId, leader);
        if (leader?.id && saved?.id) idMap.set(leader.id, saved.id);
      } catch (err: any) {
        const msg = String(err?.message || "");
        if (!msg.toLowerCase().includes("already saved") && !msg.toLowerCase().includes("duplicate")) {
          // Leader replay is best-effort; accounts still try the original personId.
        }
      }
    }
    for (const account of cache.accounts || []) {
      try {
        const personId = (account.personId && idMap.get(account.personId)) || account.personId;
        await politicalApiService.savePiAccount(userId, { ...account, personId });
      } catch {
        // Already saved or one platform failed — keep replaying the rest.
      }
    }
  };

  const loadMasters = async () => {
    const [st, pt] = await Promise.all([
      politicalApiService.getStates(),
      politicalApiService.getPoliticalParties()
    ]);
    setStates(st || []);
    setParties((pt as PoliticalParty[]) || []);
  };

  const refreshDashboard = async () => {
    const req = ++dashReqRef.current;
    const scopedDistrict = districtId || undefined;
    setPageLoading(true);
    try {
      const data = await politicalApiService.getPiDashboard(userId, stateId, scopedDistrict);
      if (req !== dashReqRef.current) return;
      const cache = readPiOperatorCache(userId);
      if (emptyDashboard(data) && !scopedDistrict) {
        if (canEdit && cacheHasPiData(cache)) {
          await replayCachedPi();
          if (req !== dashReqRef.current) return;
          const again = await politicalApiService.getPiDashboard(userId, stateId, scopedDistrict).catch(() => data);
          if (req !== dashReqRef.current) return;
          if (!emptyDashboard(again)) {
            setDashboard(again);
            persistOperatorCache({ dashboard: again });
            return;
          }
        }
        setDashboard((prev) => {
          if (!emptyDashboard(prev)) return prev;
          if (cache?.dashboard && !emptyDashboard(cache.dashboard)) return cache.dashboard;
          return data;
        });
        return;
      }
      setDashboard(data);
      persistOperatorCache({ dashboard: data });
    } catch (e: any) {
      if (req !== dashReqRef.current) return;
      const cache = readPiOperatorCache(userId);
      if (!scopedDistrict) {
        setDashboard((prev) => prev || cache?.dashboard || null);
      }
      if (!isTransientLoadError(e)) flash(e.message || "Could not load dashboard", true);
    } finally {
      if (req === dashReqRef.current) setPageLoading(false);
    }
  };

  useEffect(() => {
    loadMasters().catch(() => {});
    refreshDashboard().catch(() => {});
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [pcs, acs, dist] = await Promise.all([
        politicalApiService.getParliamentsByState(stateId).catch(() => []),
        politicalApiService.getAssemblies(stateId).catch(() => []),
        politicalApiService.getDistrictsByState(stateId, userId).catch(() => [])
      ]);
      if (cancelled) return;
      const parliamentRows = (pcs as ParliamentInfo[]) || [];
      const assemblyRows = Array.isArray(acs) ? acs : [];
      const districtRows = [...(Array.isArray(dist) ? dist : [])].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
      setParliaments(parliamentRows);
      setAssemblies(assemblyRows);
      setDistricts(districtRows);
    })().catch(() => {
      if (!cancelled) {
        setParliaments([]);
        setAssemblies([]);
        setDistricts([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [stateId, userId]);

  const filteredPcs = useMemo(() => {
    if (!districtId) return [];
    const inState = parliaments.filter((p) => !p.stateId || String(p.stateId).toUpperCase() === String(stateId).toUpperCase());
    const district = districts.find((d) => d.id === districtId);
    const pcIds = new Set<string>(district?.parliamentConstituencyIds || []);
    if (!pcIds.size) {
      const acIds = new Set(district?.assemblyConstituencyIds || []);
      assemblies.forEach((a) => {
        if (acIds.has(a.id) && (a.parliamentConstituencyId || a.parliamentId)) {
          pcIds.add(a.parliamentConstituencyId || a.parliamentId);
        }
      });
    }
    if (!pcIds.size) return [];
    return inState.filter((p) => pcIds.has(p.id));
  }, [assemblies, districts, districtId, parliaments, stateId]);

  const filteredAcs = useMemo(() => {
    if (!districtId) return [];
    const district = districts.find((d) => d.id === districtId);
    const acIds = new Set(district?.assemblyConstituencyIds || []);
    let rows = acIds.size ? assemblies.filter((a) => acIds.has(a.id)) : [];
    if (pcId) {
      rows = rows.filter((a) => (a.parliamentConstituencyId || a.parliamentId) === pcId);
    }
    return rows;
  }, [assemblies, districts, districtId, pcId]);

  const selectedAssemblyName = filteredAcs.find((a) => a.id === acId)?.name || "";
  const selectedDistrictName = districts.find((d) => d.id === districtId)?.name || "";

  const loadConstituencies = async () => {
    const data = await politicalApiService.getPiConstituencies(userId, { stateId, districtId, limit: 200 });
    const items = data.items || [];
    if (items.length) {
      setConstRows(items);
      persistOperatorCache({ constRows: items });
      return items;
    }
    const cache = readPiOperatorCache(userId);
    const cached = (cache?.constRows || []).filter((row) => !districtId || row.districtId === districtId || row.assemblyConstituencyId);
    if (cached.length) {
      setConstRows(cached);
      return cached;
    }
    setConstRows([]);
    return [];
  };
  const loadLeaders = async () => {
    const data = await politicalApiService.getPiLeaders(userId, { assemblyConstituencyId: acId || undefined, districtId, limit: 200 });
    const items = data.items || [];
    const cache = readPiOperatorCache(userId);
    const cached = (cache?.leaders || []).filter((row) => !acId || row.assemblyConstituencyId === acId);
    const merged = mergeById(items, cached);
    setLeaders(merged);
    if (merged.length) persistOperatorCache({ leaders: merged });
    return merged;
  };
  const loadAccounts = async () => {
    const data = await politicalApiService.getPiAccounts(userId, { assemblyConstituencyId: acId || undefined, limit: 200 });
    const items = data.items || [];
    const cache = readPiOperatorCache(userId);
    const merged = mergeById(items, cache?.accounts || []);
    setAccounts(merged);
    if (merged.length) persistOperatorCache({ accounts: merged });
    return merged;
  };

  const hydrateLeaderSlots = (leaderRows: any[], accountRows: any[]) => {
    const next = LEADER_SLOTS.map(emptyLeaderSlot);
    const scoped = acId ? leaderRows.filter((row) => row.assemblyConstituencyId === acId) : [];
    for (const row of scoped) {
      const index = slotIndexForKind(row.leaderKind);
      if (index < 0 || next[index].id) continue;
      next[index] = {
        id: row.id,
        name: row.name || "",
        partyId: row.partyId || "",
        politicalRole: (row.roles || [])[0]?.politicalRole || row.politicalRole || next[index].politicalRole,
        politicalRoles: roleListFromLeader(row, next[index].politicalRoles),
        leaderKind: LEADER_SLOTS[index].kind,
        platformDrafts: draftsFromAccounts(row.id, accountRows),
        activePlatform: "facebook"
      };
    }
    setLeaderSlots(next);
  };
  const loadQueue = async () => {
    const wanted = String(queueStatus || "PENDING").toUpperCase();
    const rows = await politicalApiService.getPiQueue(userId, wanted);
    const list = (Array.isArray(rows) ? rows : []).filter((row) => queueStatusOf(row) === wanted);
    setQueue(list);
    if (wanted === "PENDING") persistOperatorCache({ queue: list });
  };
  const loadIntel = async () => {
    setIntel(
      await politicalApiService.getPiIntelligence(userId, {
        stateId,
        platform: intelPlatform || undefined,
        rankBy
      })
    );
  };

  const goToDataEntry = (next?: { districtId?: string; acId?: string; pcId?: string }) => {
    if (next?.districtId) setDistrictId(next.districtId);
    if (next?.pcId) setPcId(next.pcId);
    if (next?.acId) setAcId(next.acId);
    setTab(visibleTabs.some((item) => item.id === "constituencies") ? "constituencies" : "dashboard");
  };

  useEffect(() => {
    setTab("dashboard");
  }, [openDataEntryTick]);

  useEffect(() => {
    if (!visibleTabs.some((item) => item.id === tab)) setTab("dashboard");
  }, [isSmM, isAdminEditor, tab]);

  useEffect(() => {
    writePiOperatorCache(userId, { stateId, districtId, pcId, acId, tab, entryGroup });
  }, [userId, stateId, districtId, pcId, acId, tab, entryGroup]);

  useEffect(() => {
    setError("");
    setOk("");
  }, [tab]);

  useEffect(() => {
    if (tab === "dashboard") refreshDashboard().catch(() => undefined);
  }, [tab, stateId, districtId, userId]);

  useEffect(() => {
    setCollectionType("");
    setCollectionAssembly("");
    setCollectionEnteredBy("");
    setCollectionStatus("");
    setCollectionPage(1);
  }, [districtId, stateId]);

  useEffect(() => {
    setCollectionPage(1);
  }, [collectionPageSize, filteredRecent.length, collectionType, collectionAssembly, collectionEnteredBy, collectionStatus]);

  useEffect(() => {
    setQueueDistrict("");
    setQueueAssembly("");
    setQueuePlatform("");
    setQueuePage(1);
  }, [queueStatus]);

  useEffect(() => {
    setQueuePage(1);
  }, [queuePageSize, filteredQueue.length, queueDistrict, queueAssembly, queuePlatform]);

  useEffect(() => {
    if (tab === "constituencies") {
      loadConstituencies().catch(() => undefined);
      Promise.all([loadLeaders(), loadAccounts()])
        .then(([leaderRows, accountRows]) => hydrateLeaderSlots(leaderRows, accountRows))
        .catch(() => undefined);
    }
  }, [tab, stateId, districtId, acId, userId]);

  useEffect(() => {
    if (tab === "verify") loadQueue().catch(() => undefined);
  }, [tab, queueStatus, userId]);

  useEffect(() => {
    if (tab === "intelligence") loadIntel().catch(() => undefined);
  }, [tab, intelPlatform, intelParty, rankBy, stateId, districtId, pcId, acId, userId]);

  const saveConstituency = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    if (!districtId || !acId) {
      flash("Select district and constituency.", true);
      return;
    }
    if (!String(constForm.enteredByName || "").trim()) {
      flash("Enter who collected this constituency.", true);
      return;
    }
    setSaving("constituency");
    try {
      const num = (v: any) => (v === "" || v == null ? undefined : Number(v));
      await politicalApiService.savePiConstituency(userId, {
        ...constForm,
        stateId,
        districtId,
        parliamentConstituencyId: pcId,
        assemblyConstituencyId: acId,
        assemblyName: filteredAcs.find((a) => a.id === acId)?.name,
        totalVoters: num(constForm.totalVoters),
        ruralPercent: num(constForm.ruralPercent),
        estimatedFacebookUsers: num(constForm.estimatedFacebookUsers),
        estimatedInstagramUsers: num(constForm.estimatedInstagramUsers),
        estimatedXUsers: num(constForm.estimatedXUsers),
        estimatedYouTubeUsers: num(constForm.estimatedYouTubeUsers),
        enteredByName: String(constForm.enteredByName || "").trim(),
        dataCollectionDate: todayIsoDate()
      });
      flash("Saved ✓ Enter the next constituency.");
      await loadConstituencies();
      await refreshDashboard();
      setEntryGroup("constituency");
    } catch (err: any) {
      flash(err.message, true);
    } finally {
      setSaving(null);
    }
  };

  const reportLeaderField = (index: number, field: string, fieldLabel: string, detail: string, kind: "missing" | "invalid" = "missing") => {
    const leaderLabel = LEADER_SLOTS[index]?.label || `Leader ${index + 1}`;
    const message = kind === "invalid" ? `${leaderLabel}: ${detail}` : `${leaderLabel}: ${fieldLabel} is missing. ${detail}`;
    const platform = field.startsWith("profileUrl-") ? field.slice("profileUrl-".length) : field.startsWith("hasAccount-") ? field.slice("hasAccount-".length) : "";
    if (platform && (PLATFORMS as readonly string[]).includes(platform)) {
      patchLeaderSlot(index, { activePlatform: platform as (typeof PLATFORMS)[number] });
    }
    flash(message, true);
    setLeaderAlert({ index, field, leaderLabel, fieldLabel, message });
    window.setTimeout(() => {
      document.getElementById(leaderFieldDomId(index, field))?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, platform ? 120 : 0);
  };

  const dismissLeaderAlert = () => {
    if (leaderAlert) {
      focusLeaderField(leaderFieldDomId(leaderAlert.index, leaderAlert.field));
    }
    setLeaderAlert(null);
  };

  const saveLeader = async (e: React.FormEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    const slot = leaderSlots[index];
    if (!slot) return;
    if (!acId) {
      reportLeaderField(index, "ac", "Constituency", "Select the assembly constituency at the top of this form, then save again.");
      return;
    }
    if (!String(slot.name || "").trim()) {
      reportLeaderField(index, "name", "Name", `Type the full name on ${LEADER_SLOTS[index].label}.`);
      return;
    }
    if (!slot.partyId) {
      reportLeaderField(index, "party", "Party", `Select a party on ${LEADER_SLOTS[index].label}.`);
      return;
    }
    const selectedRoles = (slot.politicalRoles || []).filter(Boolean);
    if (!selectedRoles.length) {
      reportLeaderField(index, "role", "Political role", `Select at least one profile role on ${LEADER_SLOTS[index].label}.`);
      return;
    }
    for (const platform of PLATFORMS) {
      const draft = slot.platformDrafts[platform];
      if (draft.hasAccount === "yes" && !String(draft.profileUrl || "").trim()) {
        reportLeaderField(
          index,
          `profileUrl-${platform}`,
          `${PLATFORM_LABEL[platform]} profile link`,
          `Open ${PLATFORM_LABEL[platform]} on ${LEADER_SLOTS[index].label} and enter the profile link.`
        );
        return;
      }
      if (draft.hasAccount === "yes") {
        const mismatch = profileUrlPlatformError(String(draft.profileUrl || "").trim(), platform);
        if (mismatch) {
          reportLeaderField(
            index,
            `profileUrl-${platform}`,
            `${PLATFORM_LABEL[platform]} profile link`,
            mismatch,
            "invalid"
          );
          return;
        }
      }
    }
    setSaving("leader");
    setSavingSlot(index);
    try {
      const num = (v: any) => (v === "" || v == null ? undefined : Number(v));
      const accountPayloads = PLATFORMS.flatMap((platform) => {
        const draft = slot.platformDrafts[platform];
        if (!draft.hasAccount) return [];
        const existing = accounts.find(
          (row) => (slot.id && row.personId === slot.id && String(row.platform || "").toLowerCase() === platform)
        );
        return [{
          id: existing?.id,
          platform,
          partyId: slot.partyId,
          profileUrl: draft.hasAccount === "yes" ? String(draft.profileUrl || "").trim() : "",
          accountIdentifier: draft.hasAccount === "yes"
            ? socialUsername({ profileUrl: String(draft.profileUrl || "").trim(), platform })
            : "",
          followers: draft.hasAccount === "yes" ? num(draft.followers) : undefined,
          verificationStatus: draft.hasAccount === "no" ? "NO_ACCOUNT" : draft.verified === "yes" ? "VERIFIED" : "PENDING"
        }];
      });
      const saved = await politicalApiService.savePiLeader(userId, {
        id: slot.id,
        name: slot.name,
        partyId: slot.partyId,
        politicalRole: selectedRoles[0],
        roles: selectedRoles.map((role) => ({ politicalRole: role, status: "CURRENT" })),
        leaderKind: slot.leaderKind,
        currentFormerStatus: "CURRENT",
        stateId,
        districtId,
        parliamentConstituencyId: pcId,
        assemblyConstituencyId: acId,
        accounts: accountPayloads
      });
      const personId = saved?.id;
      if (personId && !Array.isArray(saved?.accounts) && accountPayloads.length) {
        const extra = await Promise.allSettled(
          accountPayloads.map((payload) => politicalApiService.savePiAccount(userId, { ...payload, personId }))
        );
        saved.accountErrors = extra
          .map((result, i) => result.status === "rejected" ? { platform: accountPayloads[i].platform, detail: String((result.reason as any)?.message || "Could not save") } : null)
          .filter(Boolean);
      }
      const accountErrors = Array.isArray(saved?.accountErrors) ? saved.accountErrors.filter((row: any) => row?.detail) : [];
      setLeaderAlert(null);
      if (accountErrors.length) {
        flash(`${LEADER_SLOTS[index].label} saved. ${accountErrors.map((row: any) => row.detail).join(" ")}`, true);
      } else {
        flash(`${LEADER_SLOTS[index].label} saved.`);
      }
      setEntryGroup("leaders");
      const returnedAccounts = Array.isArray(saved?.accounts) ? saved.accounts : [];
      if (personId) {
        const mergedLeaders = [
          { ...saved, assemblyConstituencyId: saved.assemblyConstituencyId || acId, roles: saved.roles || selectedRoles.map((role) => ({ politicalRole: role })) },
          ...leaders.filter((row) => row.id !== personId)
        ];
        const mergedAccounts = returnedAccounts.length
          ? [...returnedAccounts, ...accounts.filter((row) => row.personId !== personId)]
          : accounts;
        setLeaders(mergedLeaders);
        setAccounts(mergedAccounts);
        persistOperatorCache({ leaders: mergedLeaders, accounts: mergedAccounts });
        hydrateLeaderSlots(mergedLeaders, mergedAccounts);
      }
      void Promise.all([loadLeaders(), loadAccounts(), refreshDashboard()]).then(([leaderRows, accountRows]) => {
        hydrateLeaderSlots(leaderRows, accountRows);
      }).catch(() => undefined);
    } catch (err: any) {
      const leaderLabel = LEADER_SLOTS[index].label;
      flash(`${leaderLabel}: ${err.message || "Could not save."}`, true);
      setLeaderAlert({
        index,
        field: "save",
        leaderLabel,
        fieldLabel: "Could not save",
        message: `${leaderLabel}: ${err.message || "Could not save this leader. Check the highlighted card and try again."}`
      });
    } finally {
      setSaving(null);
      setSavingSlot(null);
    }
  };

  const deleteConstituency = async (row: any) => {
    if (!canDelete || !row?.id) return;
    if (!window.confirm(`Delete constituency ${row.assemblyName || row.assemblyConstituencyId}?`)) return;
    try {
      await politicalApiService.deletePiConstituency(userId, row.id);
      flash("Constituency deleted.");
      await loadConstituencies();
      await refreshDashboard();
    } catch (err: any) {
      flash(err.message, true);
    }
  };

  const deleteLeaderRecord = async (row: any) => {
    if (!canDelete || !row?.id) return;
    if (!window.confirm(`Delete ${leaderKindLabel(row.leaderKind)} ${row.name || ""}?`)) return;
    try {
      await politicalApiService.deletePiLeader(userId, row.id);
      flash("Leader deleted.");
      const [leaderRows, accountRows] = await Promise.all([loadLeaders(), loadAccounts()]);
      hydrateLeaderSlots(leaderRows, accountRows);
      await refreshDashboard();
    } catch (err: any) {
      flash(err.message, true);
    }
  };

  const deleteSocialAccount = async (row: any) => {
    if (!canDelete || !row?.id || !canDeleteCollectedRow(row)) return;
    const label = row.leaderName || row.summary || row.profileUrl || row.platform || row.id;
    if (!window.confirm(`Delete this ${row.platform || "social"} account${label ? `: ${label}` : ""}?`)) return;
    try {
      await politicalApiService.deletePiAccount(userId, row.id);
      flash("Account deleted.");
      await Promise.all([loadAccounts(), refreshDashboard(), tab === "verify" ? loadQueue() : Promise.resolve()]);
    } catch (err: any) {
      flash(err.message, true);
    }
  };

  const deleteCollectedRow = async (row: PiRecentCollection) => {
    if (!canDelete || !row?.id || !canDeleteCollectedRow(row)) return;
    if (row.recordType === "leader") return deleteLeaderRecord({ ...row, name: row.summary || (row as any).name });
    if (row.recordType === "social") return deleteSocialAccount(row);
    return deleteConstituency(row);
  };

  const verify = async (recordType: string, id: string, status: string) => {
    if (actingId) return;
    const next = status.toUpperCase();
    let remarks = "";
    if (next === "VERIFIED") {
      if (!window.confirm("Verify this social account? It will move to Verified with no further actions.")) return;
    } else if (next === "NEEDS_RECHECK") {
      remarks = window.prompt("Why does this need a recheck?") || "";
      if (!remarks.trim()) return;
    } else if (next === "REJECTED") {
      remarks = window.prompt("Why are you rejecting this account?") || "";
      if (!remarks.trim()) return;
    }
    setActingId(id);
    try {
      await politicalApiService.verifyPiRecord(userId, recordType, id, { status: next, remarks });
      setQueue((prev) => {
        const remaining = prev.filter((row) => row.id !== id);
        if (queueStatus === "PENDING") persistOperatorCache({ queue: remaining });
        return remaining;
      });
      flash(next === "VERIFIED" ? "Verified. This account is closed for further action." : next === "REJECTED" ? "Rejected. This account is listed with no actions." : "Sent back for recheck.");
      await loadQueue();
      await refreshDashboard().catch(() => undefined);
    } catch (err: any) {
      flash(err.message, true);
      await loadQueue().catch(() => undefined);
    } finally {
      setActingId("");
    }
  };

  const patchLeaderSlot = (index: number, patch: Partial<LeaderSlotState>) => {
    setLeaderSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
    setLeaderAlert((prev) => {
      if (!prev || prev.index !== index) return prev;
      if (patch.name !== undefined && prev.field === "name") return null;
      if (patch.partyId !== undefined && prev.field === "party") return null;
      if (patch.politicalRoles !== undefined && prev.field === "role") return null;
      return prev;
    });
  };

  const setSlotPlatformField = (index: number, platform: (typeof PLATFORMS)[number], field: keyof PlatformDraft, value: string) => {
    setLeaderSlots((prev) =>
      prev.map((slot, i) =>
        i === index
          ? { ...slot, platformDrafts: { ...slot.platformDrafts, [platform]: { ...slot.platformDrafts[platform], [field]: value } } }
          : slot
      )
    );
    setLeaderAlert((prev) => {
      if (!prev || prev.index !== index) return prev;
      if (field === "profileUrl" && prev.field === `profileUrl-${platform}`) return null;
      if (field === "hasAccount" && prev.field === `hasAccount-${platform}`) return null;
      return prev;
    });
  };

  const downloadSavedExcel = () => {
    const header = ["Constituency", "District", "Voters", "Leaders", "Collected by", "Date", "Status"];
    const lines = [
      header.join(","),
      ...constRows.map((row) =>
        [
          row.assemblyName || row.assemblyConstituencyId || "",
          row.districtName || selectedDistrictName || "",
          row.totalVoters ?? "",
          row.leaderCount ?? leaders.filter((l) => l.assemblyConstituencyId === row.assemblyConstituencyId).length,
          row.enteredByName || "",
          (row.dataCollectionDate || "").slice(0, 10),
          row.verificationStatus || ""
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      )
    ];
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leaderlens-constituencies-${todayIsoDate()}.xls`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportCsv = async () => {
    if (exportingAi) return;
    setExportingAi(true);
    try {
      const [leaderData, accountData, constData] = await Promise.all([
        politicalApiService.getPiLeaders(userId, { districtId: districtId || undefined, limit: 1000 }),
        politicalApiService.getPiAccounts(userId, { assemblyConstituencyId: acId || undefined, limit: 1000 }),
        politicalApiService.getPiConstituencies(userId, { stateId, districtId, limit: 1000 })
      ]);
      const leaderRows = leaderData.items || leaders;
      const leaderIds = new Set(leaderRows.map((row: any) => row.id));
      const accountRows = (accountData.items || accounts).filter((row: any) => !leaderIds.size || leaderIds.has(row.personId));
      const constItems = constData.items || constRows;
      downloadPiCsvExport({
        stateName: states.find((s) => s.id === stateId)?.name || stateId,
        districtName: selectedDistrictName || undefined,
        constituencyName: selectedAssemblyName || undefined,
        dashboard: dashboard || undefined,
        leaders: leaderRows,
        accounts: accountRows,
        constituencies: constItems,
        partyName: (partyId) => (partyId && partyById[partyId]?.abbreviation) || partyId || "",
        assemblyName: (assemblyId) => assemblies.find((row) => row.id === assemblyId)?.name || assemblyId || ""
      });
      flash("CSV exported with every collected field. Use Import CSV to upload that same file — no template.");
    } catch (err: any) {
      flash(err.message || "Could not export.", true);
    } finally {
      setExportingAi(false);
    }
  };

  const onPickImportCsv = async (file?: File | null) => {
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
    setPreview(null);
    flash(`Loaded ${file.name} for Import CSV`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4A24C] font-bold">Political Intelligence</p>
          <h1 className="text-2xl font-display text-[#F5EFE0]">
            {tab === "constituencies"
              ? "Constituency Data Form"
              : tab === "intelligence"
                ? "Intelligence"
                : tab === "verify"
                  ? "Verification Queue"
                  : tab === "import"
                    ? "Import / Export"
                    : "Data Entry Dashboard"}
          </h1>
          {tab === "constituencies" && (
            <p className="text-sm text-[#B9AF95] mt-1">Fill one constituency at a time. Takes about 10 minutes.</p>
          )}
        </div>
      </header>

      <div className={`grid gap-1.5 ${
        visibleTabs.length <= 2 ? "grid-cols-2" : visibleTabs.length === 3 ? "grid-cols-3" : visibleTabs.length === 4 ? "grid-cols-4" : "grid-cols-5"
      }`}>
        {visibleTabs.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`min-h-10 w-full px-1 py-1.5 rounded-lg text-[9px] sm:text-[11px] font-bold uppercase tracking-wider inline-flex items-center justify-center text-center leading-tight ${
              tab === item.id ? "bg-[#D4A24C] text-[#071322]" : "text-[#B9AF95] border border-[#22405E]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {(error || ok) && !isTransientLoadError({ message: error }) && (
        <div className={`p-3 rounded-xl text-xs border ${error ? "border-rose-500/40 text-rose-200 bg-rose-950/40" : "border-emerald-500/40 text-emerald-200 bg-emerald-950/40"}`}>
          {error || ok}
        </div>
      )}

      {tab === "dashboard" && (
        <section className="space-y-4">
          <StateDistrictBar
            stateId={stateId}
            setStateId={setStateId}
            districtId={districtId}
            setDistrictId={setDistrictId}
            setPcId={setPcId}
            setAcId={setAcId}
            states={states}
            districts={districts}
          />
          {pageLoading && !dashboard ? (
            <div className="p-8 text-center text-[#D4A24C] text-xs"><Loader2 className="w-4 h-4 inline animate-spin" /> Loading live metrics…</div>
          ) : !dashboard ? (
            <EmptyState text="No constituency statistics yet. Enter a constituency or load SAMPLE data." />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
                <Kpi label="Total constituencies" value={dashboard.totalConstituencies} onClick={() => goToDataEntry()} />
                <Kpi label="Entered" value={dashboard.constituenciesEntered} onClick={() => goToDataEntry()} />
                <Kpi label="Leaders" value={dashboard.totalLeaders} onClick={() => goToDataEntry()} />
                <Kpi label="Social accounts" value={dashboard.totalSocialAccounts} onClick={() => goToDataEntry()} />
                <Kpi label="Verified" value={dashboard.verifiedAccounts} onClick={isSmM ? () => { setQueueStatus("VERIFIED"); setTab("verify"); } : undefined} />
                <Kpi label="Pending" value={dashboard.pendingVerification} onClick={isSmM ? () => { setQueueStatus("PENDING"); setTab("verify"); } : undefined} />
                <Kpi label="Recheck" value={dashboard.needsRecheck} onClick={isSmM ? () => { setQueueStatus("NEEDS_RECHECK"); setTab("verify"); } : undefined} />
                <Kpi label="Verified %" value={dashboard.verificationPercent == null ? "—" : `${dashboard.verificationPercent}%`} onClick={isSmM ? () => { setQueueStatus("VERIFIED"); setTab("verify"); } : undefined} />
              </div>
              {selectedDistrictProgress && (
                <button
                  onClick={() => {
                    goToDataEntry({ districtId: selectedDistrictProgress.id });
                  }}
                  className={`text-left ${CARD} w-full`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#F5EFE0]">{selectedDistrictProgress.name}</span>
                    <MapPin className="w-4 h-4 text-[#D4A24C]" />
                  </div>
                  <p className="text-sm text-[#D4A24C] mt-1">{selectedDistrictProgress.constituenciesEntered}/{selectedDistrictProgress.totalConstituencies} constituencies entered</p>
                  <p className="text-[11px] text-[#B9AF95]">{selectedDistrictProgress.verificationPercent == null ? "No accounts yet" : `${selectedDistrictProgress.verificationPercent}% verified`} · {selectedDistrictProgress.needsRecheck} recheck</p>
                  <div className="mt-2 h-1.5 rounded bg-[#142B45]">
                    <div className="h-1.5 rounded bg-[#D4A24C]" style={{ width: `${selectedDistrictProgress.totalConstituencies ? (selectedDistrictProgress.constituenciesEntered / selectedDistrictProgress.totalConstituencies) * 100 : 0}%` }} />
                  </div>
                </button>
              )}
              <div className={CARD}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <h2 className="text-sm font-bold text-[#F5EFE0]">Last collection</h2>
                  {dashboardRecent.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {collectionFiltersActive ? (
                        <button type="button" className="text-[11px] font-semibold text-[#D4A24C]" onClick={clearCollectionFilters}>
                          Clear filters
                        </button>
                      ) : null}
                      <label className="inline-flex flex-wrap items-center gap-1.5 text-[11px] text-[#B9AF95]">
                        Records per page
                        <select
                          className={`${INPUT} w-auto min-w-[7.5rem] py-1`}
                          value={collectionPageSize}
                          onChange={(e) => setCollectionPageSize(Number(e.target.value) as (typeof COLLECTION_PAGE_SIZES)[number])}
                        >
                          {COLLECTION_PAGE_SIZES.map((size) => (
                            <option key={size} value={size}>{size} / page</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : null}
                </div>
                {dashboardRecent.length > 0 ? (
                  <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      <CollectionFilterSelect
                        label="Type"
                        value={collectionType}
                        onChange={setCollectionType}
                        allLabel="All types"
                        options={collectionFilterOptions.types}
                      />
                      <CollectionFilterSelect
                        label="Assembly"
                        value={districtId ? collectionAssembly : ""}
                        onChange={setCollectionAssembly}
                        allLabel="All assemblies"
                        lockedLabel="Select district first"
                        disabled={!districtId}
                        options={collectionFilterOptions.assemblies.map((value) => ({ value, label: value }))}
                      />
                      <CollectionFilterSelect
                        label="Entered by"
                        value={collectionEnteredBy}
                        onChange={setCollectionEnteredBy}
                        allLabel="All entered by"
                        options={collectionFilterOptions.enteredBy.map((value) => ({ value, label: value }))}
                      />
                      <CollectionFilterSelect
                        label="Status"
                        value={collectionStatus}
                        onChange={setCollectionStatus}
                        allLabel="All statuses"
                        options={collectionFilterOptions.statuses.map((value) => ({ value, label: value }))}
                      />
                  </div>
                ) : null}
                {dashboardRecent.length === 0 ? (
                  <EmptyState text={districtId ? `No collections yet for ${selectedDistrictName || "this district"}.` : "No collections yet for this state and district."} />
                ) : filteredRecent.length === 0 ? (
                  <EmptyState text="No collections match these filters." />
                ) : (
                  <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[52rem] text-xs">
                      <thead>
                        <tr className="text-[#D4A24C] text-left">
                          <th className="py-1">Collected</th>
                          <th>Type</th>
                          <th>District</th>
                          <th>Assembly</th>
                          <th>Summary</th>
                          <th>Entered by</th>
                          <th>Status</th>
                          {canDelete ? <th className="whitespace-nowrap">Delete</th> : null}
                        </tr>
                      </thead>
                      <tbody>
                        {pagedRecent.map((row: PiRecentCollection) => (
                          <tr
                            key={`${row.recordType}-${row.id}`}
                            className="text-[#F5EFE0] border-t border-[#22405E] cursor-pointer hover:bg-[#131E2D]"
                            onClick={() => {
                              goToDataEntry({
                                districtId: row.districtId,
                                acId: row.assemblyConstituencyId
                              });
                            }}
                          >
                            <td className="py-1.5 break-words">{(row.collectedAt || "").slice(0, 10) || "—"}</td>
                            <td className="break-words capitalize">{row.recordType || "—"}</td>
                            <td className="break-words">{row.districtName || "—"}</td>
                            <td className="break-words">{row.assemblyName || "—"}</td>
                            <td className="break-words">{row.summary || "—"}</td>
                            <td className="break-words">{row.enteredByName || "—"}</td>
                            <td>
                              <span className={`px-1.5 py-0.5 rounded border ${statusTone(row.verificationStatus)}`}>{row.verificationStatus || "—"}</span>
                            </td>
                            {canDelete ? (
                              <td className="whitespace-nowrap">
                                {canDeleteCollectedRow(row) ? (
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-rose-500/40 text-rose-200 text-[10px] font-bold uppercase tracking-wider"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteCollectedRow(row);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                ) : null}
                              </td>
                            ) : null}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 text-[11px] text-[#B9AF95]">
                    <p>
                      Showing {(collectionPageSafe - 1) * collectionPageSize + 1}–{Math.min(collectionPageSafe * collectionPageSize, filteredRecent.length)} of {filteredRecent.length}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button type="button" className="px-2 py-1 rounded-lg border border-[#22405E] disabled:opacity-40" disabled={collectionPageSafe <= 1} onClick={() => setCollectionPage(1)} aria-label="First page">
                        <ChevronsLeft className="w-3.5 h-3.5 inline" /> First
                      </button>
                      <button type="button" className="px-2 py-1 rounded-lg border border-[#22405E] disabled:opacity-40" disabled={collectionPageSafe <= 1} onClick={() => setCollectionPage((p) => Math.max(1, p - 1))} aria-label="Previous page">
                        <ChevronLeft className="w-3.5 h-3.5 inline" /> Previous
                      </button>
                      <span className="px-2 text-[#F5EFE0] font-semibold">Page {collectionPageSafe} of {collectionTotalPages}</span>
                      <button type="button" className="px-2 py-1 rounded-lg border border-[#22405E] disabled:opacity-40" disabled={collectionPageSafe >= collectionTotalPages} onClick={() => setCollectionPage((p) => Math.min(collectionTotalPages, p + 1))} aria-label="Next page">
                        Next <ChevronRight className="w-3.5 h-3.5 inline" />
                      </button>
                      <button type="button" className="px-2 py-1 rounded-lg border border-[#22405E] disabled:opacity-40" disabled={collectionPageSafe >= collectionTotalPages} onClick={() => setCollectionPage(collectionTotalPages)} aria-label="Last page">
                        Last <ChevronsRight className="w-3.5 h-3.5 inline" />
                      </button>
                    </div>
                  </div>
                  </>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {tab === "constituencies" && (
        <section className="space-y-4">
          <div className={CARD}>
            <h2 className="text-sm font-bold text-[#F5EFE0]">Constituency</h2>
            {selectedAssemblyName ? (
              <p className="text-[11px] text-[#B9AF95] mt-1">
                {selectedAssemblyName}{selectedDistrictName ? ` · ${selectedDistrictName}` : ""}
              </p>
            ) : null}
            <div className="mt-3 space-y-2">
              <GeoFilters
                stateId={stateId} setStateId={setStateId}
                districtId={districtId} setDistrictId={setDistrictId}
                pcId={pcId} setPcId={setPcId}
                acId={acId}
                setAcId={(v) => {
                  if (leaderAlert?.field === "ac") setLeaderAlert(null);
                  setAcId(v);
                }}
                states={states} districts={districts} pcs={filteredPcs} acs={filteredAcs}
                markRequired
                showParliament={false}
                acSelectId="pi-geo-ac"
                acInvalid={leaderAlert?.field === "ac"}
                acHint={leaderAlert?.field === "ac" ? leaderAlert.message : undefined}
              />
              <Field label="Collected by *" value={constForm.enteredByName || ""} onChange={(v) => setConstForm({ ...constForm, enteredByName: v })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {ENTRY_GROUPS.map((group) => (
              <button
                type="button"
                key={group.id}
                onClick={() => setEntryGroup(group.id)}
                className={`h-10 w-full px-2 rounded-lg text-[11px] font-bold uppercase tracking-wider inline-flex items-center justify-center ${
                  entryGroup === group.id ? "bg-[#D4A24C] text-[#071322]" : "text-[#B9AF95] border border-[#22405E]"
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>

          {entryGroup === "constituency" && (
          <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <form noValidate onSubmit={saveConstituency} className={`${CARD} space-y-3`}>
              <h2 className="text-sm font-bold text-[#F5EFE0]">Constituency entry</h2>
              <Field label="Total voters" type="number" value={constForm.totalVoters || ""} onChange={(v) => setConstForm({ ...constForm, totalVoters: v })} />
              <p className="text-[11px] text-[#D4A24C]">Estimated social media users (not observed counts)</p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Est. Facebook users" type="number" value={constForm.estimatedFacebookUsers || ""} onChange={(v) => setConstForm({ ...constForm, estimatedFacebookUsers: v })} />
                <Field label="Est. Instagram users" type="number" value={constForm.estimatedInstagramUsers || ""} onChange={(v) => setConstForm({ ...constForm, estimatedInstagramUsers: v })} />
                <Field label="Est. X users" type="number" value={constForm.estimatedXUsers || ""} onChange={(v) => setConstForm({ ...constForm, estimatedXUsers: v })} />
                <Field label="Est. YouTube users" type="number" value={constForm.estimatedYouTubeUsers || ""} onChange={(v) => setConstForm({ ...constForm, estimatedYouTubeUsers: v })} />
              </div>
              <Field label="Remarks" value={constForm.remarks || ""} onChange={(v) => setConstForm({ ...constForm, remarks: v })} />
              <button type="submit" className={BTN} disabled={!!saving || !acId || !canEdit}>{saving === "constituency" ? "Saving…" : constForm.id ? "Save changes" : "Save constituency"}</button>
              {ok && !error && ok.startsWith("Saved") && (
                <p className="text-[11px] text-emerald-300">{ok}</p>
              )}
            </form>
            <div className={CARD}>
              <h2 className="text-sm font-bold text-[#F5EFE0] mb-2">Saved constituencies ({constRows.length})</h2>
              {constRows.length === 0 ? <EmptyState text="No constituency statistics for this filter." /> : (
                <div className="space-y-2">
                  {constRows.map((row) => {
                    const leaderCount = row.leaderCount ?? leaders.filter((l) => l.assemblyConstituencyId === row.assemblyConstituencyId).length;
                    return (
                      <div key={row.id} className="w-full text-left p-2.5 rounded-lg border border-[#22405E]">
                        <button
                          type="button"
                          className="w-full text-left hover:bg-[#131E2D] rounded-lg"
                          onClick={() => {
                            if (row.districtId) setDistrictId(row.districtId);
                            if (row.parliamentConstituencyId) setPcId(row.parliamentConstituencyId);
                            if (row.assemblyConstituencyId) setAcId(row.assemblyConstituencyId);
                            setConstForm({
                              ...row,
                              enteredByName: row.enteredByName || constForm.enteredByName,
                              dataCollectionDate: (row.dataCollectionDate || "").slice(0, 10)
                            });
                          }}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <span className="font-bold text-[#F5EFE0] break-words">{row.assemblyName || row.assemblyConstituencyId}{row.districtName ? ` · ${row.districtName}` : selectedDistrictName ? ` · ${selectedDistrictName}` : ""}</span>
                            <span className="text-[11px] text-[#B9AF95]">{leaderCount} leaders · {row.enteredByName || "—"}</span>
                          </div>
                          <p className="text-[11px] text-[#B9AF95] mt-1">Voters {row.totalVoters ?? "—"} · {(row.dataCollectionDate || "").slice(0, 10) || "—"} · {row.verificationStatus}</p>
                          {canEdit ? <p className="text-[11px] text-[#D4A24C] mt-1 font-semibold uppercase tracking-wider">Edit / modify</p> : null}
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-200 text-[11px] font-bold uppercase tracking-wider"
                            onClick={() => deleteConstituency(row)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <button type="button" className="px-4 py-2 rounded-xl border border-[#22405E] text-[#F5EFE0] text-xs font-bold uppercase tracking-wider" onClick={downloadSavedExcel}>
                    Download Excel
                  </button>
                </div>
              )}
            </div>
          </div>
          {selectedDistrictProgress && (
            <div className={CARD}>
              <h2 className="text-sm font-bold text-[#F5EFE0]">{selectedDistrictProgress.name}</h2>
              <p className="text-sm text-[#D4A24C] mt-1">{selectedDistrictProgress.constituenciesEntered}/{selectedDistrictProgress.totalConstituencies} entered · {selectedDistrictProgress.constituenciesPending} pending</p>
              <p className="text-[11px] text-[#B9AF95]">{selectedDistrictProgress.totalLeaders} leaders · {selectedDistrictProgress.totalAccounts} accounts · {selectedDistrictProgress.verifiedAccounts} verified</p>
            </div>
          )}
          </>
          )}

          {entryGroup === "leaders" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {leaderSlots.map((slot, index) => {
                const activePlatform = slot.activePlatform;
                const drafts = slot.platformDrafts;
                const slotBusy = saving === "leader" && savingSlot === index;
                const slotAlert = leaderAlert?.index === index ? leaderAlert : null;
                const nameInvalid = slotAlert?.field === "name";
                const partyInvalid = slotAlert?.field === "party";
                const hasAccountInvalid = slotAlert?.field === `hasAccount-${activePlatform}`;
                const profileInvalid = slotAlert?.field === `profileUrl-${activePlatform}`;
                return (
                  <form
                    noValidate
                    key={slot.leaderKind}
                    onSubmit={(e) => saveLeader(e, index)}
                    className={`${CARD} min-w-0 h-full flex flex-col gap-3 ${slotAlert ? "border-rose-400 ring-2 ring-rose-400/70" : ""}`}
                  >
                    <h2 className="text-sm font-bold text-[#F5EFE0]">
                      {LEADER_SLOTS[index].label}
                    </h2>
                    {slotAlert ? (
                      <p className="text-[11px] text-rose-300">{slotAlert.message}</p>
                    ) : null}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Field
                        id={leaderFieldDomId(index, "name")}
                        label="Name *"
                        value={slot.name || ""}
                        placeholder="Full name"
                        autoComplete="off"
                        invalid={nameInvalid}
                        hint={nameInvalid ? slotAlert?.message : undefined}
                        onChange={(v) => patchLeaderSlot(index, { name: v })}
                      />
                      <div>
                        <label className={LABEL} htmlFor={leaderFieldDomId(index, "party")}>Party</label>
                        <select
                          id={leaderFieldDomId(index, "party")}
                          className={inputClass(partyInvalid)}
                          aria-invalid={partyInvalid || undefined}
                          value={slot.partyId || ""}
                          onChange={(e) => patchLeaderSlot(index, { partyId: e.target.value })}
                        >
                          <option value="">Select</option>
                          {parties.map((p) => <option key={p.id} value={p.id}>{p.shortName || p.name}</option>)}
                        </select>
                        {partyInvalid ? <p className="mt-1 text-[11px] text-rose-300">{slotAlert?.message}</p> : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {PLATFORMS.map((platform) => {
                        const answered = drafts[platform].hasAccount === "yes" || drafts[platform].hasAccount === "no";
                        const active = activePlatform === platform;
                        const platformAlert = slotAlert?.field === `profileUrl-${platform}` || slotAlert?.field === `hasAccount-${platform}`;
                        return (
                          <button
                            type="button"
                            key={platform}
                            onClick={() => patchLeaderSlot(index, { activePlatform: platform })}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
                              platformAlert
                                ? "border border-rose-400 text-rose-200 ring-2 ring-rose-400/70"
                                : active
                                  ? "bg-[#D4A24C] text-[#071322]"
                                  : "border border-[#22405E] text-[#F5EFE0]"
                            }`}
                          >
                            {PLATFORM_LABEL[platform]}
                            <span className={`w-1.5 h-1.5 rounded-full ${answered ? "bg-emerald-400" : "bg-[#6B7280]"}`} />
                          </button>
                        );
                      })}
                    </div>
                    <div className={`p-2.5 rounded-lg border space-y-2 ${profileInvalid || hasAccountInvalid ? "border-rose-400" : "border-[#22405E]"}`}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className={LABEL} htmlFor={leaderFieldDomId(index, `hasAccount-${activePlatform}`)}>{PLATFORM_LABEL[activePlatform]}: has account?</label>
                          <select
                            id={leaderFieldDomId(index, `hasAccount-${activePlatform}`)}
                            className={inputClass(hasAccountInvalid)}
                            aria-invalid={hasAccountInvalid || undefined}
                            value={drafts[activePlatform].hasAccount}
                            onChange={(e) => setSlotPlatformField(index, activePlatform, "hasAccount", e.target.value)}
                          >
                            <option value="">Select</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                          {hasAccountInvalid ? <p className="mt-1 text-[11px] text-rose-300">{slotAlert?.message}</p> : null}
                        </div>
                        {drafts[activePlatform].hasAccount === "yes" && (
                          <div>
                            <label className={LABEL}>Verified (blue tick)?</label>
                            <select
                              className={INPUT}
                              value={drafts[activePlatform].verified}
                              onChange={(e) => setSlotPlatformField(index, activePlatform, "verified", e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                        )}
                      </div>
                      {drafts[activePlatform].hasAccount === "yes" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Field label="Followers / subscribers" type="number" value={drafts[activePlatform].followers} onChange={(v) => setSlotPlatformField(index, activePlatform, "followers", v)} />
                          <Field
                            id={leaderFieldDomId(index, `profileUrl-${activePlatform}`)}
                            label="Profile link"
                            value={drafts[activePlatform].profileUrl}
                            invalid={profileInvalid}
                            hint={profileInvalid ? slotAlert?.message : undefined}
                            onChange={(v) => setSlotPlatformField(index, activePlatform, "profileUrl", v)}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={LABEL} htmlFor={leaderFieldDomId(index, "role")}>Profile / political role</label>
                      <div id={leaderFieldDomId(index, "role")} className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {ROLES.map((role) => {
                          const checked = (slot.politicalRoles || []).includes(role);
                          return (
                            <label key={role} className="flex items-center gap-2 min-h-9 px-2 py-1.5 rounded-lg border border-[#22405E] text-[11px] text-[#F5EFE0]">
                              <input
                                type="checkbox"
                                className="accent-[#D4A24C] shrink-0"
                                checked={checked}
                                onChange={() => {
                                  const current = slot.politicalRoles || [];
                                  const next = checked ? current.filter((item) => item !== role) : [...current, role];
                                  patchLeaderSlot(index, { politicalRoles: next, politicalRole: next[0] || "" });
                                }}
                              />
                              <span>{role.replace(/_/g, " ")}</span>
                            </label>
                          );
                        })}
                      </div>
                      {slotAlert?.field === "role" ? <p className="mt-1 text-[11px] text-rose-300">{slotAlert.message}</p> : null}
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2 pt-1">
                      <button type="submit" id={leaderFieldDomId(index, "save")} className={BTN} disabled={!canEdit || slotBusy}>
                        {slotBusy ? "Saving…" : slot.id ? `Save changes · ${LEADER_SLOTS[index].label}` : `Save ${LEADER_SLOTS[index].label}`}
                      </button>
                      {canDelete && slot.id && canDeleteCollectedRow(leaders.find((row) => row.id === slot.id) || { verificationStatus: "PENDING" }) && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/40 text-rose-200 text-xs font-bold uppercase tracking-wider"
                          onClick={() => deleteLeaderRecord({ id: slot.id, name: slot.name, leaderKind: slot.leaderKind })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </form>
                );
              })}
              </div>
              <div className={CARD}>
                <h2 className="text-sm font-bold text-[#F5EFE0] mb-2">Leaders in this constituency</h2>
                {leaders.length === 0 ? <EmptyState text="No leaders for this geography." /> : (
                  <div className="space-y-2">
                    {leaders.map((row) => {
                      const party = partyById[row.partyId];
                      return (
                        <div
                          key={row.id}
                          className="w-full text-left p-2.5 rounded-lg border border-[#22405E]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#F5EFE0]">{row.name}</span>
                            <span className="text-[10px] font-bold" style={{ color: party?.primaryColor || "#D4A24C" }}>{row.partyId}</span>
                          </div>
                          <p className="text-[11px] text-[#B9AF95]">{leaderKindLabel(row.leaderKind)}{(row.roles || []).length ? ` · ${(row.roles || []).map((r: any) => r.politicalRole).join(" · ")}` : ""}</p>
                          <p className="text-[11px] text-[#B9AF95]">Contact {row.contactId || "—"} · {row.verificationStatus}</p>
                          {canDelete && canDeleteCollectedRow(row) && (
                            <button
                              type="button"
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-200 text-[11px] font-bold uppercase tracking-wider"
                              onClick={() => deleteLeaderRecord(row)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </section>
      )}

      {tab === "verify" && (
        <section className={`rounded-lg p-2 border ${UNIQUE_TICKET_SURFACE.kpi}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-2">
            <div className="flex flex-wrap gap-1">
              {QUEUE_STATUS_TABS.map((s) => (
                <button type="button" key={s.id} onClick={() => setQueueStatus(s.id)} className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${queueStatus === s.id ? "bg-[#D4A24C] text-[#071322]" : "border-[#22405E] text-[#B9AF95]"}`}>{s.label}</button>
              ))}
            </div>
            {queue.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {queueFiltersActive ? (
                  <button type="button" className="text-[10px] font-semibold text-[#D4A24C]" onClick={clearQueueFilters}>
                    Clear filters
                  </button>
                ) : null}
                <label className="inline-flex flex-wrap items-center gap-1 text-[10px] text-[#B9AF95]">
                  Records per page
                  <select
                    className={`${INPUT} w-auto min-w-[6.5rem] py-0.5 text-xs`}
                    value={queuePageSize}
                    onChange={(e) => setQueuePageSize(Number(e.target.value) as (typeof COLLECTION_PAGE_SIZES)[number])}
                  >
                    {COLLECTION_PAGE_SIZES.map((size) => (
                      <option key={size} value={size}>{size} / page</option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
          </div>
          {queue.length > 0 ? (
            <div className="mb-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                <CollectionFilterSelect
                  compact
                  label="District"
                  value={queueDistrict}
                  onChange={(value) => {
                    setQueueDistrict(value);
                    setQueueAssembly("");
                    setQueuePlatform("");
                  }}
                  allLabel="All districts"
                  options={queueFilterOptions.districts.map((value) => ({ value, label: value }))}
                />
                <CollectionFilterSelect
                  compact
                  label="Assembly"
                  value={queueDistrict ? queueAssembly : ""}
                  onChange={(value) => {
                    setQueueAssembly(value);
                    setQueuePlatform("");
                  }}
                  allLabel="All assemblies"
                  lockedLabel="Select district first"
                  disabled={!queueDistrict}
                  options={queueFilterOptions.assemblies.map((value) => ({ value, label: value }))}
                />
                <CollectionFilterSelect
                  compact
                  label="Platform"
                  value={queueDistrict && queueAssembly ? queuePlatform : ""}
                  onChange={setQueuePlatform}
                  allLabel="All platforms"
                  lockedLabel="Select assembly first"
                  disabled={!queueDistrict || !queueAssembly}
                  options={queueFilterOptions.platforms}
                />
            </div>
          ) : null}
          {queue.length === 0 ? (
            <EmptyState
              compact
              text={
                queueStatus === "PENDING"
                  ? "No pending accounts."
                  : queueStatus === "NEEDS_RECHECK"
                    ? "No recheck accounts."
                    : queueStatus === "VERIFIED"
                      ? "No verified accounts."
                      : "No rejected accounts."
              }
            />
          ) : filteredQueue.length === 0 ? (
            <EmptyState compact text="No accounts match these filters." />
          ) : (
            <>
            <div className="space-y-1">
              {pagedQueue.map((row) => {
                const handle = socialUsername(row);
                const href = profileHref(row.profileUrl);
                const showDelete = canDelete && canDeleteCollectedRow(row);
                const showActions = (canVerify && queueCanAct(row.verificationStatus)) || showDelete;
                return (
                <div key={row.id} className="px-2 py-1 rounded-md border border-[#22405E]">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-[#F5EFE0]">{row.leaderName} · {PLATFORM_LABEL[String(row.platform || "").toLowerCase() as keyof typeof PLATFORM_LABEL] || row.platform}</span>
                      <p className="text-[10px] text-[#B9AF95] leading-snug">
                        {row.districtName || "—"} · {row.assemblyName || "—"}
                        {handle && href ? (
                          <>
                            {" · "}
                            <a className="text-[#D4A24C] underline break-all" href={href} target="_blank" rel="noreferrer">{handle}</a>
                          </>
                        ) : null}
                        {" · "}Followers {row.followers ?? "—"} · Entered by {row.enteredByName || row.enteredBy}
                        {queueStatusOf(row) === "VERIFIED" ? ` · Verified${row.verifiedByName ? ` by ${row.verifiedByName}` : ""}${(row.verifiedAt || "").slice(0, 10) ? ` ${(row.verifiedAt || "").slice(0, 10)}` : ""}` : ""}
                        {queueStatusOf(row) === "REJECTED" ? ` · Rejected${row.verifiedByName ? ` by ${row.verifiedByName}` : ""}${row.reviewRemarks ? ` ${row.reviewRemarks}` : ""}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 shrink-0">
                      {showActions && canVerify && queueCanAct(row.verificationStatus) ? (
                        <>
                          <button className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#071322] text-[10px] font-bold uppercase tracking-wider" type="button" disabled={actingId === row.id} onClick={() => verify("social", row.id, "VERIFIED")}>{actingId === row.id ? "Saving…" : "Verify"}</button>
                          {queueStatusOf(row) === "PENDING" && (
                            <button className="px-2 py-0.5 rounded-md border border-amber-500/40 text-amber-200 text-[10px]" type="button" disabled={actingId === row.id} onClick={() => verify("social", row.id, "NEEDS_RECHECK")}>Recheck</button>
                          )}
                          <button className="px-2 py-0.5 rounded-md border border-rose-500/40 text-rose-200 text-[10px]" type="button" disabled={actingId === row.id} onClick={() => verify("social", row.id, "REJECTED")}>Reject</button>
                        </>
                      ) : null}
                      {showDelete ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-rose-500/40 text-rose-200 text-[10px] font-bold uppercase tracking-wider"
                          onClick={() => deleteSocialAccount(row)}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      ) : null}
                      <span className={`text-[9px] px-1 py-0 rounded border ${statusTone(row.verificationStatus)}`}>{row.verificationStatus}</span>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-2 text-[10px] text-[#B9AF95]">
              <p>
                Showing {(queuePageSafe - 1) * queuePageSize + 1}–{Math.min(queuePageSafe * queuePageSize, filteredQueue.length)} of {filteredQueue.length}
              </p>
              <div className="flex flex-wrap items-center gap-1">
                <button type="button" className="px-1.5 py-0.5 rounded-md border border-[#22405E] disabled:opacity-40" disabled={queuePageSafe <= 1} onClick={() => setQueuePage(1)} aria-label="First page">
                  <ChevronsLeft className="w-3 h-3 inline" /> First
                </button>
                <button type="button" className="px-1.5 py-0.5 rounded-md border border-[#22405E] disabled:opacity-40" disabled={queuePageSafe <= 1} onClick={() => setQueuePage((p) => Math.max(1, p - 1))} aria-label="Previous page">
                  <ChevronLeft className="w-3 h-3 inline" /> Previous
                </button>
                <span className="px-1.5 text-[#F5EFE0] font-semibold">Page {queuePageSafe} of {queueTotalPages}</span>
                <button type="button" className="px-1.5 py-0.5 rounded-md border border-[#22405E] disabled:opacity-40" disabled={queuePageSafe >= queueTotalPages} onClick={() => setQueuePage((p) => Math.min(queueTotalPages, p + 1))} aria-label="Next page">
                  Next <ChevronRight className="w-3 h-3 inline" />
                </button>
                <button type="button" className="px-1.5 py-0.5 rounded-md border border-[#22405E] disabled:opacity-40" disabled={queuePageSafe >= queueTotalPages} onClick={() => setQueuePage(queueTotalPages)} aria-label="Last page">
                  Last <ChevronsRight className="w-3 h-3 inline" />
                </button>
              </div>
            </div>
            </>
          )}
        </section>
      )}

      {tab === "import" && (
        <section className={`${CARD} space-y-3`}>
          <div className="flex flex-wrap gap-2">
            <button className={BTN} type="button" onClick={exportCsv} disabled={exportingAi}>
              <Download className="w-3.5 h-3.5 inline mr-1" />{exportingAi ? "Exporting…" : "Export CSV"}
            </button>
            <button
              className={BTN}
              type="button"
              onClick={() => csvFileRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5 inline mr-1" />Import CSV
            </button>
          </div>
          <p className="text-[11px] text-[#B9AF95] leading-relaxed">
            Export CSV downloads the live constituency, leader and social rows with every field, plus the wrapped briefing spreadsheet. Import CSV uploads that same file. There is no separate template.
          </p>
          <label className={LABEL}>Import CSV</label>
          <input
            ref={csvFileRef}
            type="file"
            accept=".csv,text/csv"
            className="block w-full text-xs text-[#B9AF95]"
            onChange={async (e) => {
              await onPickImportCsv(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <textarea className={`${INPUT} min-h-[160px] font-mono text-[11px]`} value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder="Paste CSV or use Import CSV" />
          <div className="flex flex-wrap gap-2">
            <button className={BTN} type="button" onClick={async () => {
              try { setPreview(await politicalApiService.previewPiImport(userId, csvText)); flash("Preview ready"); }
              catch (e: any) { flash(e.message, true); }
            }}>Preview</button>
            <button className={BTN} type="button" onClick={async () => {
              try { const batch = await politicalApiService.confirmPiImport(userId, csvText); flash(`Imported ${batch.importedRows}, rejected ${batch.rejectedRows}`); }
              catch (e: any) { flash(e.message, true); }
            }}>Confirm import</button>
          </div>
          {preview && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <Kpi label="Total" value={preview.totalRows} />
              <Kpi label="Valid" value={preview.validRows} />
              <Kpi label="Invalid" value={preview.invalidRows} />
              <Kpi label="Duplicates" value={preview.duplicateRows} />
              <Kpi label="Ready" value={(preview.valid || []).length} />
            </div>
          )}
        </section>
      )}

      {tab === "intelligence" && (
        <section className="flex flex-col lg:flex-row gap-4 items-start">
          <aside className={`${CARD} w-full lg:w-64 shrink-0 space-y-3 min-w-0`}>
            <h2 className="text-sm font-bold text-[#F5EFE0]">Filters</h2>
            <div>
              <label className={LABEL}>State</label>
              <select className={INPUT} value={stateId} onChange={(e) => { setStateId(e.target.value); setDistrictId(""); setPcId(""); setAcId(""); setIntelPlatform(""); }}>
                {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>District</label>
              <select className={INPUT} value={districtId} onChange={(e) => { setDistrictId(e.target.value); setPcId(""); setAcId(""); setIntelPlatform(""); }}>
                <option value="">Select district</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Constituency</label>
              <select
                className={`${INPUT} disabled:opacity-60 disabled:cursor-not-allowed`}
                value={districtId ? acId : ""}
                disabled={!districtId}
                onChange={(e) => {
                  const id = e.target.value;
                  setAcId(id);
                  setIntelPlatform("");
                  const ac = filteredAcs.find((a) => a.id === id);
                  const nextPc = ac?.parliamentConstituencyId || ac?.parliamentId || "";
                  if (nextPc) setPcId(nextPc);
                }}
              >
                <option value="">{districtId ? "Select constituency" : "Select district first"}</option>
                {districtId ? filteredAcs.map((a) => <option key={`${a.id}-${a.name}`} value={a.id}>{a.name}</option>) : null}
              </select>
            </div>
            <div>
              <label className={LABEL}>Platform</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={!acId}
                  onClick={() => setIntelPlatform("")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed ${!intelPlatform ? "bg-[#3B82F6] text-white border-2 border-[#D4A24C]" : "border border-[#22405E] text-[#F5EFE0]"}`}
                >
                  All
                </button>
                {PLATFORMS.map((platform) => (
                  <button
                    type="button"
                    key={platform}
                    disabled={!acId}
                    onClick={() => setIntelPlatform(platform)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed ${intelPlatform === platform ? "bg-[#3B82F6] text-white border-2 border-[#D4A24C]" : "border border-[#22405E] text-[#F5EFE0]"}`}
                  >
                    {PLATFORM_LABEL[platform]}
                  </button>
                ))}
              </div>
            </div>
            {acId ? (
              <>
                <div>
                  <label className={LABEL}>Rank by</label>
                  <select className={INPUT} value={rankBy} onChange={(e) => setRankBy(e.target.value)}>
                    {RANK_BY_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Party</label>
                  <select className={INPUT} value={intelParty} onChange={(e) => setIntelParty(e.target.value)}>
                    <option value="">All parties</option>
                    {parties.map((party) => (
                      <option key={party.id} value={party.id}>{party.shortName || party.name}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}
          </aside>
          <div className="flex-1 min-w-0 space-y-4">
            {!districtId ? (
              <EmptyState text="Select a district to see constituency reach." />
            ) : acId ? (
              <IntelligenceConstituency
                intel={intel || { constituencyCards: [], leaders: [], audienceEstimates: {} }}
                acId={acId}
                acName={selectedAssemblyName || filteredAcs.find((a) => a.id === acId)?.name || acId}
                districtName={selectedDistrictName}
                stateName={states.find((s) => s.id === stateId)?.name || stateId}
                platform={intelPlatform}
                partyId={intelParty}
                rankBy={rankBy}
                partyById={partyById}
                onSelectPlatform={setIntelPlatform}
              />
            ) : (
              <IntelligenceDistrict
                intel={intel || { constituencyCards: [] }}
                districtName={selectedDistrictName || "District"}
                assemblies={filteredAcs}
                onOpen={(id) => {
                  setAcId(id);
                  const ac = filteredAcs.find((a) => a.id === id);
                  const nextPc = ac?.parliamentConstituencyId || ac?.parliamentId || "";
                  if (nextPc) setPcId(nextPc);
                }}
                partyById={partyById}
              />
            )}
          </div>
        </section>
      )}

      {leaderAlert && (
        <LeaderFieldPopup alert={leaderAlert} onClose={dismissLeaderAlert} />
      )}
    </div>
  );
};

function partyLabel(partyById: Record<string, PoliticalParty>, partyId?: string, fallback?: string) {
  const party = partyId ? partyById[partyId] : undefined;
  return party?.shortName || party?.name || fallback || partyId || "";
}

function IntelligenceDistrict({
  intel,
  districtName,
  assemblies,
  onOpen,
  partyById
}: {
  intel: any;
  districtName: string;
  assemblies: any[];
  onOpen: (id: string) => void;
  partyById: Record<string, PoliticalParty>;
}) {
  const byId: Record<string, any> = {};
  for (const card of intel.constituencyCards || []) {
    if (card?.assemblyConstituencyId) byId[card.assemblyConstituencyId] = card;
  }
  const rows = (assemblies.length ? assemblies : intel.constituencyCards || []).map((ac: any) => {
    const id = ac.id || ac.assemblyConstituencyId;
    const card = byId[id] || {};
    return {
      assemblyConstituencyId: id,
      assemblyName: ac.name || card.assemblyName || id,
      partyId: card.partyId,
      partyColor: card.partyColor,
      mlaName: card.mlaName,
      followers: card.followers,
      estimatedUsers: card.estimatedUsers,
      reachPercent: card.reachPercent
    };
  });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-display text-[#F5EFE0]">{districtName} District</h2>
        <p className="text-sm text-[#B9AF95] mt-1">{rows.length} {rows.length === 1 ? "constituency" : "constituencies"} · tap one to open</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {rows.map((row: any) => {
          const pct = row.reachPercent == null ? 0 : Number(row.reachPercent);
          return (
            <button
              type="button"
              key={row.assemblyConstituencyId}
              onClick={() => onOpen(row.assemblyConstituencyId)}
              className={`${CARD} text-left w-full min-w-0`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-[#F5EFE0] break-words">{row.assemblyName}</span>
                {row.partyId ? (
                  <span className="text-[10px] font-bold uppercase shrink-0" style={{ color: row.partyColor || "#D4A24C" }}>
                    {partyLabel(partyById, row.partyId)}
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-[#B9AF95] mt-1 break-words">MLA: {row.mlaName || "—"}</p>
              <p className="text-3xl font-display text-[#F5EFE0] mt-3">{row.reachPercent == null ? "—" : `${Math.round(pct)}%`}</p>
              <p className="text-[11px] text-[#B9AF95]">of all users reached</p>
              <div className="mt-2 h-1.5 rounded bg-[#142B45]">
                <div className="h-1.5 rounded bg-[#D4A24C]" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
              </div>
              <p className="text-[11px] text-[#B9AF95] mt-2">
                {formatCompactCount(row.followers)} followers · {formatCompactCount(row.estimatedUsers)} users
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatSignedPercent(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  const abs = Math.abs(n);
  const body = abs >= 10 ? abs.toFixed(0) : abs.toFixed(1);
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${body}%`;
}

function IntelligenceConstituency({
  intel,
  acId,
  acName,
  districtName,
  stateName,
  platform,
  partyId,
  rankBy,
  partyById,
  onSelectPlatform
}: {
  intel: any;
  acId: string;
  acName: string;
  districtName: string;
  stateName: string;
  platform: string;
  partyId: string;
  rankBy: string;
  partyById: Record<string, PoliticalParty>;
  onSelectPlatform: (platform: string) => void;
}) {
  const card = (intel.constituencyCards || []).find((c: any) => c.assemblyConstituencyId === acId) || {};
  const estimates = card.platformEstimates || {
    facebook: intel.audienceEstimates?.facebook || 0,
    instagram: intel.audienceEstimates?.instagram || 0,
    x: intel.audienceEstimates?.x || 0,
    youtube: intel.audienceEstimates?.youtube || 0
  };
  const allLeaders = intel.leaders || [];
  const inConstituency = allLeaders.filter((l: any) => l.assemblyConstituencyId === acId);
  const leaders = partyId ? inConstituency.filter((l: any) => String(l.partyId || "").toUpperCase() === partyId.toUpperCase()) : inConstituency;
  const focus = inConstituency.find((l: any) => isSittingMlaKind(l.leaderKind)) || inConstituency[0] || null;
  const rankLabel = RANK_BY_OPTIONS.find((option) => option.id === rankBy)?.label || "Followers";
  const platformLabel = platform ? PLATFORM_LABEL[platform as (typeof PLATFORMS)[number]] || platform : "All";
  const metricOf = (row: any) => rankMetricForLeader(row, platform, rankBy);
  const rankedPool = [...allLeaders].filter((row: any) => metricOf(row) != null).sort((a: any, b: any) => Number(metricOf(b)) - Number(metricOf(a)));
  const focusRankIndex = focus ? rankedPool.findIndex((row: any) => row.id === focus.id) : -1;
  const above = focusRankIndex > 0 ? rankedPool[focusRankIndex - 1] : null;
  const focusMetric = focus ? metricOf(focus) : null;
  const aboveMetric = above ? metricOf(above) : null;
  const moveUp = aboveMetric != null && focusMetric != null ? Number(aboveMetric) - Number(focusMetric) : null;
  const focusGrowth = platform ? platformDetail(focus, platform)?.growth30 : focus?.growth30;
  let worstGap: { platform: string; pct: number } | null = null;
  if (focus) {
    const gapPlatforms = platform ? [platform as (typeof PLATFORMS)[number]] : [...PLATFORMS];
    for (const plat of gapPlatforms) {
      const detail = platformDetail(focus, plat);
      const estimate = Number(estimates[plat] || 0);
      const noAccount = Boolean(detail?.noAccount);
      const followers = noAccount ? 0 : Number(detail?.followers || 0);
      const pct = estimate ? Math.round((followers / estimate) * 100) : 0;
      if (!worstGap || pct < worstGap.pct) worstGap = { platform: PLATFORM_LABEL[plat], pct };
    }
  }
  const standings = focus ? [
    { ...rankInPool(allLeaders, focus.id, (row) => row.assemblyConstituencyId === acId, metricOf), caption: "Vs opponents here" },
    { ...rankInPool(allLeaders, focus.id, (row) => row.districtId && row.districtId === focus.districtId, metricOf), caption: "In district" },
    { ...rankInPool(allLeaders, focus.id, (row) => row.parliamentConstituencyId && row.parliamentConstituencyId === focus.parliamentConstituencyId, metricOf), caption: "In Parliament seat" },
    { ...rankInPool(allLeaders, focus.id, (row) => row.partyId && row.partyId === focus.partyId, metricOf), caption: `Among ${partyLabel(partyById, focus.partyId, focus.partyName) || "party"} MLAs` },
    { ...rankInPool(allLeaders, focus.id, (row) => row.stateId && row.stateId === focus.stateId, metricOf), caption: `All ${stateName || "state"} constituencies` }
  ] : [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-display text-[#F5EFE0]">{acName}</h2>
        <p className="text-sm text-[#B9AF95] mt-1">
          {[districtName, stateName].filter(Boolean).join(" · ")}
          {districtName || stateName ? " · " : ""}
          estimated platform users in this area
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PLATFORMS.map((plat) => {
          const selected = platform === plat;
          return (
            <button
              type="button"
              key={plat}
              onClick={() => onSelectPlatform(selected ? "" : plat)}
              className={`${CARD} text-center w-full min-w-0 ${selected ? SELECTED_PLATFORM_CARD : ""}`}
              aria-pressed={selected}
            >
              <span className="text-[11px] text-[#B9AF95] block">{PLATFORM_LABEL[plat]}</span>
              <span className="text-2xl font-display font-bold text-[#F5EFE0] mt-1 block">{formatCompactCount(estimates[plat])}</span>
              <span className="text-[11px] text-[#B9AF95]">users</span>
            </button>
          );
        })}
      </div>
      {focus ? (
        <>
          <div>
            <h3 className="text-base font-display text-[#F5EFE0]">
              Where he stands · {platformLabel} · by {rankLabel}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {standings.map((tile) => (
              <div key={tile.caption} className={`${CARD} text-center min-w-0`}>
                <p className="text-2xl font-display font-bold text-[#F5EFE0]">{tile.value != null ? `#${tile.value}` : "—"}</p>
                <p className="text-[11px] text-[#B9AF95] mt-1">of {tile.of || "—"}</p>
                <p className="text-[11px] text-[#B9AF95] mt-2 break-words">{tile.caption}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`${CARD} min-w-0`}>
              <p className="text-2xl font-display font-bold text-[#F5EFE0]">{focus.socialScore != null && (!platform || focus.rankPlatform === platform) ? `${Math.round(Number(focus.socialScore))}/100` : "—"}</p>
              <p className="text-[11px] text-[#B9AF95] mt-1">Social score</p>
              <p className="text-[11px] text-[#B9AF95]">{platform ? `percentile in state · ${platformLabel}` : "percentile in state"}</p>
            </div>
            <div className={`${CARD} min-w-0`}>
              <p className="text-2xl font-display font-bold text-[#F5EFE0]">
                {moveUp == null ? "—" : `${moveUp > 0 ? "+" : ""}${formatCompactCount(Math.abs(moveUp))}`}
              </p>
              <p className="text-[11px] text-[#B9AF95] mt-1">To move up one rank</p>
              <p className="text-[11px] text-[#B9AF95]">{rankLabel}{platform ? ` · ${platformLabel}` : ""}</p>
            </div>
            <div className={`${CARD} min-w-0`}>
              <p className={`text-2xl font-display font-bold ${Number(focusGrowth) > 0 ? "text-emerald-400" : "text-[#F5EFE0]"}`}>
                {formatSignedPercent(focusGrowth)}
              </p>
              <p className="text-[11px] text-[#B9AF95] mt-1">30-day growth</p>
              <p className="text-[11px] text-[#B9AF95]">{platform ? `followers, ${platformLabel}` : "followers, all platforms"}</p>
            </div>
            <div className={`${CARD} min-w-0`}>
              <p className="text-2xl font-display font-bold text-[#F5EFE0]">{worstGap?.platform || "—"}</p>
              <p className="text-[11px] text-[#B9AF95] mt-1">Biggest gap</p>
              <p className="text-[11px] text-[#B9AF95]">only {worstGap ? `${worstGap.pct}%` : "—"} of users reached</p>
            </div>
          </div>
        </>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {leaders.length ? leaders.map((leader: any) => {
          const sitting = isSittingMlaKind(leader.leaderKind);
          return (
            <div key={leader.id} className={`${CARD} min-w-0 space-y-3`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-[#F5EFE0] break-words">{leader.name}</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  {leader.partyId ? (
                    <span className="text-[10px] font-bold uppercase" style={{ color: leader.partyColor || "#D4A24C" }}>
                      {partyLabel(partyById, leader.partyId, leader.partyName)}
                    </span>
                  ) : null}
                  {sitting ? <span className="text-[10px] text-[#B9AF95]">Sitting MLA</span> : null}
                </div>
              </div>
              {PLATFORMS.map((plat) => {
                const detail = platformDetail(leader, plat);
                const estimate = Number(estimates[plat] || 0);
                const noAccount = Boolean(detail?.noAccount);
                const followers = noAccount ? null : detail?.followers;
                const pct = followers != null && estimate ? Math.round((Number(followers) / estimate) * 100) : 0;
                const hasAccount = !noAccount && (Boolean(detail?.verified) || followers != null);
                const selected = platform === plat;
                const emphasize = !platform || selected;
                return (
                  <div key={plat} className={`min-w-0 rounded-lg ${selected ? `p-1.5 ${SELECTED_PLATFORM_CARD}` : emphasize ? "" : "opacity-70"}`}>
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-[#F5EFE0] inline-flex items-center gap-1 min-w-0">
                        {PLATFORM_LABEL[plat]}
                        {hasAccount ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : null}
                      </span>
                      {noAccount ? (
                        <span className="text-rose-400 font-bold shrink-0">No account</span>
                      ) : (
                        <span className="text-[#B9AF95] text-right">
                          {formatCompactCount(followers)} of {formatCompactCount(estimate)}
                          {followers != null && estimate ? <span className="text-[#F5EFE0] font-bold"> = {pct}%</span> : null}
                        </span>
                      )}
                    </div>
                    {!noAccount ? (
                      <div className="mt-1 h-1.5 rounded bg-[#142B45]">
                        <div className="h-1.5 rounded bg-[#D4A24C]" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        }) : <EmptyState text="No leaders entered for this constituency." />}
      </div>
    </div>
  );
}

function CollectionFilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  compact,
  disabled,
  lockedLabel
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
  compact?: boolean;
  disabled?: boolean;
  lockedLabel?: string;
}) {
  const optionsWithValue = value && !options.some((opt) => opt.value === value)
    ? [{ value, label: RECORD_TYPE_LABEL[value] || value }, ...options]
    : options;
  return (
    <label className="min-w-0">
      <span className={compact ? "block text-[9px] uppercase tracking-wider font-bold text-[#D4A24C] mb-0.5" : LABEL}>{label}</span>
      <select
        className={`${INPUT} ${compact ? "py-1 text-xs rounded-lg" : "py-1.5"} disabled:opacity-60 disabled:cursor-not-allowed`}
        value={disabled ? "" : value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        <option value="">{disabled ? (lockedLabel || allLabel) : allLabel}</option>
        {disabled ? null : optionsWithValue.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

function Kpi({ label, value, hint, onClick }: { label: string; value: React.ReactNode; hint?: string; onClick?: () => void }) {
  const body = (
    <>
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C] block">{label}</span>
      <span className="text-2xl font-bold font-display text-[#D4A24C] mt-0.5 block">{value}</span>
      {hint && <span className="text-[10px] text-[#B9AF95]">{hint}</span>}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${CARD} text-left w-full cursor-pointer hover:border-[#D4A24C]/60`}>
        {body}
      </button>
    );
  }
  return <div className={CARD}>{body}</div>;
}

function EmptyState({ text, compact }: { text: string; compact?: boolean }) {
  return (
    <div className={`${compact ? "px-2 py-2" : "p-6"} text-center text-xs text-[#B9AF95] border border-dashed border-[#22405E] ${compact ? "rounded-md" : "rounded-xl"}`}>
      <Database className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} mx-auto mb-1 text-[#D4A24C]`} />
      {text}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  autoComplete,
  id,
  invalid,
  hint
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
  invalid?: boolean;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <label className={LABEL} htmlFor={id}>{label}{required ? " *" : ""}</label>
      <input
        id={id}
        className={inputClass(invalid)}
        aria-invalid={invalid || undefined}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete || "off"}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <p className="mt-1 text-[11px] text-rose-300">{hint}</p> : null}
    </div>
  );
}

function LeaderFieldPopup({ alert, onClose }: { alert: LeaderFieldAlert; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="pi-leader-error-title"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-2xl border border-rose-400/50 bg-[#071322] p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-rose-300">{alert.leaderLabel}</p>
              <h2 id="pi-leader-error-title" className="text-lg font-bold text-[#F5EFE0] mt-1">
                {alert.field === "save" ? alert.fieldLabel : `Missing: ${alert.fieldLabel}`}
              </h2>
            </div>
          </div>
          <button type="button" className="p-1 rounded-lg text-[#B9AF95] hover:text-[#F5EFE0]" onClick={onClose} aria-label="Close error">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-[#EADBBF] mt-3">{alert.message}</p>
        <button type="button" className={`${BTN} mt-4 w-full`} onClick={onClose}>
          Go to {alert.leaderLabel} · {alert.fieldLabel}
        </button>
      </div>
    </div>
  );
}

function StateDistrictBar(props: {
  stateId: string; setStateId: (v: string) => void;
  districtId: string; setDistrictId: (v: string) => void;
  setPcId: (v: string) => void;
  setAcId: (v: string) => void;
  states: StateInfo[]; districts: any[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div>
        <label className={LABEL}>State</label>
        <select
          className={INPUT}
          value={props.stateId}
          onChange={(e) => {
            props.setStateId(e.target.value);
            props.setDistrictId("");
            props.setPcId("");
            props.setAcId("");
          }}
        >
          {props.states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>District</label>
        <select
          className={INPUT}
          value={props.districtId}
          onChange={(e) => {
            props.setDistrictId(e.target.value);
            props.setPcId("");
            props.setAcId("");
          }}
        >
          <option value="">All districts in this state</option>
          {props.districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
    </div>
  );
}

function GeoFilters(props: {
  stateId: string; setStateId: (v: string) => void;
  districtId: string; setDistrictId: (v: string) => void;
  pcId: string; setPcId: (v: string) => void;
  acId: string; setAcId: (v: string) => void;
  states: StateInfo[]; districts: any[]; pcs: ParliamentInfo[]; acs: any[];
  markRequired?: boolean;
  showParliament?: boolean;
  acSelectId?: string;
  acInvalid?: boolean;
  acHint?: string;
}) {
  const showParliament = props.showParliament !== false;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div className="min-w-0">
        <label className={LABEL}>State</label>
        <select className={INPUT} value={props.stateId} onChange={(e) => { props.setStateId(e.target.value); props.setDistrictId(""); props.setPcId(""); props.setAcId(""); }}>
          {props.states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="min-w-0">
        <label className={LABEL}>District{props.markRequired ? " *" : ""}</label>
        <select className={INPUT} value={props.districtId} onChange={(e) => { props.setDistrictId(e.target.value); props.setPcId(""); props.setAcId(""); }}>
          <option value="">Select district</option>
          {props.districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      {showParliament && (
      <div className="min-w-0">
        <label className={LABEL}>Parliament constituency</label>
        <select
          className={`${INPUT} disabled:opacity-60 disabled:cursor-not-allowed`}
          value={props.districtId ? props.pcId : ""}
          disabled={!props.districtId}
          onChange={(e) => { props.setPcId(e.target.value); props.setAcId(""); }}
        >
          <option value="">{props.districtId ? "Select PC" : "Select district first"}</option>
          {props.districtId ? props.pcs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>) : null}
        </select>
      </div>
      )}
      <div className="min-w-0">
        <label className={LABEL} htmlFor={props.acSelectId}>Constituency{props.markRequired ? " *" : ""}</label>
        <select
          id={props.acSelectId}
          className={`${inputClass(props.acInvalid)} disabled:opacity-60 disabled:cursor-not-allowed`}
          aria-invalid={props.acInvalid || undefined}
          value={props.districtId ? props.acId : ""}
          disabled={!props.districtId}
          onChange={(e) => {
            const id = e.target.value;
            props.setAcId(id);
            const ac = props.acs.find((a) => a.id === id);
            const nextPc = ac?.parliamentConstituencyId || ac?.parliamentId || "";
            if (nextPc) props.setPcId(nextPc);
          }}
        >
          <option value="">{props.districtId ? "Select AC" : "Select district first"}</option>
          {props.districtId ? props.acs.map((a) => <option key={`${a.id}-${a.name}`} value={a.id}>{a.name}</option>) : null}
        </select>
        {props.acHint ? <p className="mt-1 text-[11px] text-rose-300">{props.acHint}</p> : null}
      </div>
    </div>
  );
}

export default PoliticalIntelligence;
