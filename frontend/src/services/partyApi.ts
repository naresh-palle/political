import { politicalApiService } from "./api";

export type PartyPlatform = "facebook" | "instagram" | "x" | "youtube";

export interface PartyCapabilities {
  isSuper: boolean;
  isPresident: boolean;
  isAnalyst: boolean;
  partyId: string | null;
  view: boolean;
  edit: boolean;
  export: boolean;
  research: boolean;
  compare: boolean;
  manageAdmins: boolean;
}

export interface PartyRef {
  id: string;
  name: string;
  abbreviation: string;
  color?: string;
  logoUrl?: string;
  symbolEmoji?: string;
}

export interface GapRules {
  inactiveDays: number;
  weeklyPostTarget: number;
  staleHours: number;
  researchDays: number;
}

export interface PartyMeta {
  capabilities: PartyCapabilities;
  parties: PartyRef[];
  defaultPartyId: string | null;
  gapTypes: { type: string; label: string }[];
  defaultGapRules: GapRules;
  platforms: PartyPlatform[];
}

export interface PlatformState {
  status: string;
  accountId: string | null;
  profileUrl: string | null;
  followers: number | null;
  engagementPercent?: number | null;
}

export interface MemberGap {
  type: string;
  detail: string;
}

export interface PartyMember {
  id: string;
  name: string;
  roles: string[];
  districtId: string;
  districtName: string;
  assemblyConstituencyId: string;
  assemblyConstituencyName: string;
  verificationStatus: string;
  email: string;
  phone: string;
  photoUrl: string;
  platforms: Record<string, PlatformState>;
  followersTotal: number;
  engagementPercent: number | null;
  lastPostAt: string | null;
  postsThisWeek: number;
  postsInWindow?: number;
  postsEstimated: boolean;
  postsInWindowEstimated?: boolean;
  windowDays?: number;
  lastDataAt: string | null;
  lastResearchAt: string | null;
  completeness: number;
  missingFields: string[];
  pendingCampaign: { id: string; title: string; dueAt: string }[];
  missedCampaign: { id: string; title: string; dueAt: string }[];
  gaps: MemberGap[];
  gapTypes: string[];
}

export interface MemberBrief {
  id: string;
  name: string;
  roles: string[];
  assemblyConstituencyName: string;
  photoUrl: string;
  postsThisWeek: number;
  postsInWindow?: number;
  postsEstimated: boolean;
  windowDays?: number;
  engagementPercent: number | null;
}

export interface PartyFilters {
  stateId?: string;
  districtId?: string;
  assemblyConstituencyId?: string;
  role?: string;
  platform?: string;
  q?: string;
  gap?: string;
}

export interface PartyOverview {
  party: PartyRef & Record<string, any>;
  rules: GapRules;
  windowDays?: number;
  totals: {
    members: number;
    verifiedAccounts: number;
    pendingAccounts: number;
    inactive: number;
    incompleteProfiles: number;
  };
  mostActive: MemberBrief[];
  leastActive: MemberBrief[];
  filters: {
    states?: { id: string; name: string }[];
    districts: { id: string; name: string; stateId?: string }[];
    assemblies: { id: string; name: string; districtId: string; stateId?: string }[];
    roles: string[];
    platforms: PartyPlatform[];
    gapTypes?: { type: string; label: string }[];
  };
}

export interface TopPartyPost {
  id: string;
  personId: string;
  memberName: string;
  memberPhoto?: string;
  roles?: string[];
  constituency?: string;
  district?: string;
  platform: PartyPlatform;
  url?: string;
  text: string;
  thumbnailUrl: string;
  publishedAt: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  reach: number;
  calendarId?: string;
}

export interface ResearchNote {
  id: string;
  personId: string;
  title: string;
  body: string;
  tags: string[];
  sources: string[];
  attachments: { url: string; name: string }[];
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface SocialPost {
  id: string;
  personId: string;
  platform: PartyPlatform;
  url: string;
  text?: string;
  publishedAt: string;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  views?: number | null;
  thumbnailUrl?: string | null;
  calendarId?: string | null;
  createdByName?: string;
}

export interface RefreshJob {
  status: "RUNNING" | "DONE" | "SKIPPED" | "IDLE";
  total?: number;
  done?: number;
  saved?: number;
  updated?: number;
  failed?: number;
  notes?: string[];
  lastRunAt?: string | null;
  detail?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  roleTitle: string;
}

export interface PendingItem {
  id: string;
  kind: "ACCOUNT" | "REVIEW" | "CAMPAIGN";
  label: string;
  personId: string;
  memberName: string;
  assemblyConstituencyName: string;
  photoUrl: string;
  since: string | null;
  ageDays: number | null;
  assigneeName: string | null;
  status: "OPEN" | "DONE";
  platform?: string;
  calendarId?: string;
  title?: string;
  dueAt?: string;
}

export interface AuditRow {
  id: string;
  action: string;
  actorName: string;
  targetName?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface MemberDetail {
  member: PartyMember;
  details: {
    email: string;
    phone: string;
    alternateContact: string;
    address: string;
    photoUrl: string;
    consent: boolean;
    consentAt: string | null;
    updatedAt: string | null;
    updatedByName: string | null;
    roles: { name?: string; title?: string; roleType?: string }[] | any[];
    remarks?: string;
  };
  research: ResearchNote[];
  posts: SocialPost[];
  pending: PendingItem[];
  missing: MemberGap[];
  history: AuditRow[];
}

export interface GapGroup {
  type: string;
  label: string;
  count: number;
  members: {
    id: string;
    name: string;
    roles: string[];
    assemblyConstituencyName: string;
    districtName: string;
  photoUrl: string;
  detail: string;
  remindedAt?: string | null;
  remindedBy?: string | null;
}[];
}

export interface CalendarItem {
  id: string;
  partyId?: string;
  title: string;
  brief: string;
  platforms: PartyPlatform[];
  hashtag: string | null;
  assignAll: boolean;
  assignedPersonIds?: string[];
  dueAt: string;
  status: "PLANNED" | "PUBLISHED" | "MISSED" | "CANCELLED";
  assignedCount: number;
  publishedCount: number;
  assignees: { id: string; name: string; published: boolean }[];
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComparisonRow {
  partyId: string;
  name: string;
  abbreviation: string;
  color: string;
  members: number;
  followers: number;
  postsPerWeek: number;
  avgEngagement: number | null;
  verifiedPercent: number | null;
}

export interface PartyAdminRecord {
  id: string;
  partyId: string;
  role: "PARTY_PRESIDENT" | "PARTY_ANALYST";
  active: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string; phone?: string; commandPartyName?: string; status?: string };
}

const enc = encodeURIComponent;

function query(filters: PartyFilters = {}, extra: Record<string, string | undefined> = {}): string {
  const q = new URLSearchParams();
  Object.entries({ ...filters, ...extra }).forEach(([k, v]) => {
    if (v) q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

function send(method: string, body?: unknown): RequestInit {
  return { method, body: body === undefined ? undefined : JSON.stringify(body) };
}

const PARTY_CACHE: Record<string, { at: number; data: any }> = {};
const PARTY_CACHE_TTL = 45000; // 45-second cache for instant 0ms tab navigation

export function invalidatePartyCache(partyId?: string) {
  if (!partyId) {
    for (const k in PARTY_CACHE) delete PARTY_CACHE[k];
    return;
  }
  for (const k in PARTY_CACHE) {
    if (k.includes(partyId)) delete PARTY_CACHE[k];
  }
}

async function cachedFetch<T>(key: string, fetcher: () => Promise<T>, ttl = PARTY_CACHE_TTL): Promise<T> {
  const hit = PARTY_CACHE[key];
  const now = Date.now();
  if (hit && now - hit.at < ttl) {
    // Return immediately from memory (0ms) and revalidate in background
    fetcher()
      .then((fresh) => {
        PARTY_CACHE[key] = { at: Date.now(), data: fresh };
      })
      .catch(() => {});
    return hit.data as T;
  }
  const fresh = await fetcher();
  PARTY_CACHE[key] = { at: Date.now(), data: fresh };
  return fresh;
}

export const partyApi = {
  meta(userId: string): Promise<PartyMeta> {
    return cachedFetch(`party_meta_${userId}`, () => politicalApiService.piRequest("/party/meta", userId, {}, 20000));
  },
  overview(userId: string, partyId: string, filters: PartyFilters = {}, windowDays = 7): Promise<PartyOverview> {
    const key = `party_overview_${userId}_${partyId}_${windowDays}_${JSON.stringify(filters)}`;
    return cachedFetch(key, () =>
      politicalApiService.piRequest(`/party/${enc(partyId)}/overview${query(filters, { windowDays: String(windowDays) })}`, userId, {}, 30000)
    );
  },
  members(userId: string, partyId: string, filters: PartyFilters = {}, windowDays = 7): Promise<{ total: number; windowDays?: number; items: PartyMember[] }> {
    const key = `party_members_${userId}_${partyId}_${windowDays}_${JSON.stringify(filters)}`;
    return cachedFetch(key, () =>
      politicalApiService.piRequest(`/party/${enc(partyId)}/members${query(filters, { windowDays: String(windowDays) })}`, userId, {}, 30000)
    );
  },
  exportMembers(userId: string, partyId: string, filters: PartyFilters = {}): Promise<void> {
    const stamp = new Date().toISOString().slice(0, 10);
    return politicalApiService.piDownload(
      `/party/${enc(partyId)}/members${query(filters, { format: "csv" })}`,
      userId,
      `LeadersLens_${partyId}_members_${stamp}.csv`
    );
  },
  member(userId: string, partyId: string, personId: string): Promise<MemberDetail> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/members/${enc(personId)}`, userId, {}, 30000);
  },
  async saveContact(userId: string, partyId: string, personId: string, payload: Record<string, unknown>) {
    const res = await politicalApiService.piRequest(`/party/${enc(partyId)}/members/${enc(personId)}/contact`, userId, send("PUT", payload), 20000);
    invalidatePartyCache(partyId);
    return res;
  },
  async addResearch(userId: string, partyId: string, personId: string, payload: Record<string, unknown>): Promise<ResearchNote> {
    const res = await politicalApiService.piRequest(`/party/${enc(partyId)}/members/${enc(personId)}/research`, userId, send("POST", payload), 20000);
    invalidatePartyCache(partyId);
    return res;
  },
  async deleteResearch(userId: string, partyId: string, noteId: string) {
    const res = await politicalApiService.piRequest(`/party/${enc(partyId)}/research/${enc(noteId)}`, userId, send("DELETE"), 20000);
    invalidatePartyCache(partyId);
    return res;
  },
  async addPost(userId: string, partyId: string, personId: string, payload: Record<string, unknown>): Promise<SocialPost> {
    const res = await politicalApiService.piRequest(`/party/${enc(partyId)}/members/${enc(personId)}/posts`, userId, send("POST", payload), 20000);
    invalidatePartyCache(partyId);
    return res;
  },
  async deletePost(userId: string, partyId: string, postId: string) {
    const res = await politicalApiService.piRequest(`/party/${enc(partyId)}/posts/${enc(postId)}`, userId, send("DELETE"), 20000);
    invalidatePartyCache(partyId);
    return res;
  },
  pending(userId: string, partyId: string, kind?: string, includeDone = false): Promise<{ total: number; counts: Record<string, number>; items: PendingItem[] }> {
    const key = `party_pending_${userId}_${partyId}_${kind || ""}_${includeDone}`;
    return cachedFetch(key, () =>
      politicalApiService.piRequest(
        `/party/${enc(partyId)}/pending${query({}, { kind, includeDone: includeDone ? "true" : undefined })}`,
        userId,
        {},
        30000
      )
    );
  },
  async updatePending(userId: string, partyId: string, itemId: string, payload: { status?: string; assigneeName?: string }) {
    const res = await politicalApiService.piRequest(`/party/${enc(partyId)}/pending/${itemId.split("/").map(enc).join("/")}`, userId, send("PATCH", payload), 20000);
    invalidatePartyCache(partyId);
    return res;
  },
  gaps(userId: string, partyId: string, filters: PartyFilters = {}): Promise<{ rules: GapRules; members: number; groups: GapGroup[] }> {
    const key = `party_gaps_${userId}_${partyId}_${JSON.stringify(filters)}`;
    return cachedFetch(key, () => politicalApiService.piRequest(`/party/${enc(partyId)}/gaps${query(filters)}`, userId, {}, 30000));
  },
  exportGaps(userId: string, partyId: string, filters: PartyFilters = {}): Promise<void> {
    const stamp = new Date().toISOString().slice(0, 10);
    return politicalApiService.piDownload(
      `/party/${enc(partyId)}/gaps${query(filters, { format: "csv" })}`,
      userId,
      `LeadersLens_${partyId}_gaps_${stamp}.csv`
    );
  },
  calendar(userId: string, partyId: string): Promise<{ items: CalendarItem[]; topPosts?: TopPartyPost[] }> {
    const key = `party_calendar_${userId}_${partyId}`;
    return cachedFetch(key, () => politicalApiService.piRequest(`/party/${enc(partyId)}/calendar`, userId, {}, 30000));
  },
  topPosts(userId: string, partyId: string, platform?: string, limit = 50): Promise<{ items: TopPartyPost[] }> {
    const key = `party_top_posts_${userId}_${partyId}_${platform || "all"}_${limit}`;
    return cachedFetch(key, () =>
      politicalApiService.piRequest(`/party/${enc(partyId)}/top-posts${query({}, { platform, limit: String(limit) })}`, userId, {}, 30000)
    );
  },
  async addCalendar(userId: string, partyId: string, payload: Record<string, unknown>): Promise<CalendarItem> {
    const res = await politicalApiService.piRequest(`/party/${enc(partyId)}/calendar`, userId, send("POST", payload), 20000);
    invalidatePartyCache(partyId);
    return res;
  },
  async updateCalendar(userId: string, partyId: string, itemId: string, payload: Record<string, unknown>): Promise<CalendarItem> {
    const res = await politicalApiService.piRequest(`/party/${enc(partyId)}/calendar/${enc(itemId)}`, userId, send("PATCH", payload), 20000);
    invalidatePartyCache(partyId);
    return res;
  },
  rules(userId: string, partyId: string): Promise<{ rules: GapRules; defaults: GapRules; updatedAt?: string; updatedByName?: string }> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/gap-rules`, userId, {}, 20000);
  },
  async saveRules(userId: string, partyId: string, rules: GapRules): Promise<{ rules: GapRules; updatedAt?: string; updatedByName?: string }> {
    const res = await politicalApiService.piRequest(`/party/${enc(partyId)}/gap-rules`, userId, send("PUT", rules), 20000);
    invalidatePartyCache(partyId);
    return res;
  },
  audit(userId: string, partyId: string): Promise<{ items: AuditRow[] }> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/audit`, userId, {}, 20000);
  },
  compare(userId: string): Promise<{ note: string; parties: ComparisonRow[] }> {
    return cachedFetch(`party_compare_${userId}`, () => politicalApiService.piRequest("/party/compare", userId, {}, 30000));
  },
  admins(userId: string): Promise<{ items: PartyAdminRecord[] }> {
    return politicalApiService.piRequest("/party/admins", userId, {}, 20000);
  },
  async createAdmin(userId: string, payload: Record<string, unknown>): Promise<PartyAdminRecord> {
    const res = await politicalApiService.piRequest("/party/admins", userId, send("POST", payload), 20000);
    invalidatePartyCache();
    return res;
  },
  async updateAdmin(userId: string, adminId: string, payload: Record<string, unknown>): Promise<PartyAdminRecord> {
    const res = await politicalApiService.piRequest(`/party/admins/${enc(adminId)}`, userId, send("PATCH", payload), 20000);
    invalidatePartyCache();
    return res;
  },
  team(userId: string, partyId: string): Promise<{ items: TeamMember[] }> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/team`, userId, {}, 20000);
  },
  remind(userId: string, partyId: string, personId: string, gapType: string) {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/reminders`, userId, send("POST", { personId, gapType }), 20000);
  },
  refreshStatus(userId: string, partyId: string): Promise<RefreshJob> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/posts/refresh`, userId, {}, 20000);
  },
  async refreshPosts(userId: string, partyId: string, payload: { personId?: string; force?: boolean; wait?: boolean } = {}): Promise<RefreshJob> {
    const res = await politicalApiService.piRequest(`/party/${enc(partyId)}/posts/refresh`, userId, send("POST", payload), payload.wait ? 120000 : 20000);
    invalidatePartyCache(partyId);
    return res;
  }
};

export function fallbackPartyMeta(user?: any): PartyMeta {
  const role = String(user?.role || user?.primaryRole || user?.roleId || "").toUpperCase();
  const email = String(user?.email || "").toLowerCase();
  const isSuper = Boolean(user?.isPlatformAdmin) || role === "SUPER_ADMIN" || email === "admin" || email.startsWith("admin@");
  const isPresident = role === "PARTY_PRESIDENT";
  const isAnalyst = role === "PARTY_ANALYST";
  const partyId = user?.commandPartyId ? String(user.commandPartyId).toUpperCase() : "TDP";

  const defaultParties: PartyRef[] = [
    { id: "TDP", name: "Telugu Desam Party", abbreviation: "TDP", color: "#FFD200", symbolEmoji: "🚲" },
    { id: "YSRCP", name: "YSR Congress Party", abbreviation: "YSRCP", color: "#1565C0", symbolEmoji: "🪭" },
    { id: "JSP", name: "Jana Sena Party", abbreviation: "JSP", color: "#D32F2F", symbolEmoji: "🍵" },
    { id: "BJP", name: "Bharatiya Janata Party", abbreviation: "BJP", color: "#FF9933", symbolEmoji: "🪷" },
    { id: "INC", name: "Indian National Congress", abbreviation: "INC", color: "#198754", symbolEmoji: "✋" }
  ];

  const parties = isSuper ? defaultParties : defaultParties.filter((p) => p.id === partyId || p.abbreviation === partyId);
  if (parties.length === 0) {
    parties.push({ id: partyId, name: user?.commandPartyName || partyId, abbreviation: partyId, color: "#D4A24C" });
  }

  return {
    capabilities: {
      isSuper,
      isPresident,
      isAnalyst,
      partyId: isSuper ? null : partyId,
      view: true,
      edit: isSuper || isPresident,
      export: true,
      research: isSuper || isPresident || isAnalyst,
      compare: isSuper,
      manageAdmins: isSuper
    },
    parties,
    defaultPartyId: partyId,
    gapTypes: [
      { type: "MISSING_ACCOUNT", label: "Missing account" },
      { type: "UNVERIFIED_ACCOUNT", label: "Unverified account" },
      { type: "INACTIVE", label: "Inactive" },
      { type: "LOW_POSTING", label: "Low posting" },
      { type: "MISSED_CAMPAIGN_POST", label: "Missed campaign post" },
      { type: "INCOMPLETE_PROFILE", label: "Incomplete profile" },
      { type: "STALE_DATA", label: "Stale data" },
      { type: "NO_RESEARCH", label: "No research" }
    ],
    defaultGapRules: {
      inactiveDays: 7,
      weeklyPostTarget: 3,
      staleHours: 48,
      researchDays: 30
    },
    platforms: ["youtube", "instagram", "facebook", "x"]
  };
}

export function fallbackCalendarData(partyId: string): { items: CalendarItem[]; topPosts: TopPartyPost[] } {
  const pid = (partyId || "TDP").toUpperCase();
  const now = new Date();

  const items: CalendarItem[] = [
    {
      id: `cal_${pid}_0`,
      partyId: pid,
      title: "Swarna Andhra 2047: Vision & Infrastructure Campaign",
      brief: "Share ground updates on state infrastructure, highway connectivity, and water projects in your constituency. Highlight progress and citizen benefits. Use #SwarnaAndhra2047.",
      hashtag: "#SwarnaAndhra2047",
      dueAt: new Date(now.getTime() + 2 * 86400000).toISOString(),
      platforms: ["facebook", "instagram", "youtube", "x"],
      assignAll: true,
      assignedPersonIds: [],
      status: "PLANNED",
      createdByName: "State Campaign Committee",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      assignedCount: 150,
      publishedCount: 12,
      assignees: []
    },
    {
      id: `cal_${pid}_1`,
      partyId: pid,
      title: "Youth Outreach & Digital Skill Labs Launch",
      brief: "Post photos and reels interacting with student volunteers and inaugurating digital skill labs across junior colleges. Use #YouthEmpowerment.",
      hashtag: "#YouthEmpowerment",
      dueAt: new Date(now.getTime() + 5 * 86400000).toISOString(),
      platforms: ["instagram", "youtube", "x"],
      assignAll: true,
      assignedPersonIds: [],
      status: "PLANNED",
      createdByName: "State Campaign Committee",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      assignedCount: 150,
      publishedCount: 8,
      assignees: []
    },
    {
      id: `cal_${pid}_2`,
      partyId: pid,
      title: "Praja Galam: Weekly Public Grievance Redressal Camp",
      brief: "Broadcast live video or post summary from weekly grievance redressal camp at constituency office with petition counts and solutions. Use #PrajaGalam.",
      hashtag: "#PrajaGalam",
      dueAt: new Date(now.getTime() + 8 * 86400000).toISOString(),
      platforms: ["facebook", "youtube"],
      assignAll: true,
      assignedPersonIds: [],
      status: "PLANNED",
      createdByName: "State Campaign Committee",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      assignedCount: 150,
      publishedCount: 15,
      assignees: []
    }
  ];

  return { items, topPosts: [] };
}
