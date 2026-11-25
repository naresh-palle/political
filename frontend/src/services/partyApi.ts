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
    districts: { id: string; name: string }[];
    assemblies: { id: string; name: string; districtId: string }[];
    roles: string[];
    platforms: PartyPlatform[];
  };
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
  title: string;
  brief: string;
  platforms: PartyPlatform[];
  hashtag: string | null;
  assignAll: boolean;
  dueAt: string;
  status: "PLANNED" | "PUBLISHED" | "MISSED" | "CANCELLED";
  assignedCount: number;
  publishedCount: number;
  assignees: { id: string; name: string; published: boolean }[];
  createdByName?: string;
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

export const partyApi = {
  meta(userId: string): Promise<PartyMeta> {
    return politicalApiService.piRequest("/party/meta", userId, {}, 20000);
  },
  overview(userId: string, partyId: string, filters: PartyFilters = {}, windowDays = 7): Promise<PartyOverview> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/overview${query(filters, { windowDays: String(windowDays) })}`, userId, {}, 30000);
  },
  members(userId: string, partyId: string, filters: PartyFilters = {}, windowDays = 7): Promise<{ total: number; windowDays?: number; items: PartyMember[] }> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/members${query(filters, { windowDays: String(windowDays) })}`, userId, {}, 30000);
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
  saveContact(userId: string, partyId: string, personId: string, payload: Record<string, unknown>) {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/members/${enc(personId)}/contact`, userId, send("PUT", payload), 20000);
  },
  addResearch(userId: string, partyId: string, personId: string, payload: Record<string, unknown>): Promise<ResearchNote> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/members/${enc(personId)}/research`, userId, send("POST", payload), 20000);
  },
  deleteResearch(userId: string, partyId: string, noteId: string) {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/research/${enc(noteId)}`, userId, send("DELETE"), 20000);
  },
  addPost(userId: string, partyId: string, personId: string, payload: Record<string, unknown>): Promise<SocialPost> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/members/${enc(personId)}/posts`, userId, send("POST", payload), 20000);
  },
  deletePost(userId: string, partyId: string, postId: string) {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/posts/${enc(postId)}`, userId, send("DELETE"), 20000);
  },
  pending(userId: string, partyId: string, kind?: string, includeDone = false): Promise<{ total: number; counts: Record<string, number>; items: PendingItem[] }> {
    return politicalApiService.piRequest(
      `/party/${enc(partyId)}/pending${query({}, { kind, includeDone: includeDone ? "true" : undefined })}`,
      userId,
      {},
      30000
    );
  },
  updatePending(userId: string, partyId: string, itemId: string, payload: { status?: string; assigneeName?: string }) {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/pending/${itemId.split("/").map(enc).join("/")}`, userId, send("PATCH", payload), 20000);
  },
  gaps(userId: string, partyId: string, filters: PartyFilters = {}): Promise<{ rules: GapRules; members: number; groups: GapGroup[] }> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/gaps${query(filters)}`, userId, {}, 30000);
  },
  exportGaps(userId: string, partyId: string, filters: PartyFilters = {}): Promise<void> {
    const stamp = new Date().toISOString().slice(0, 10);
    return politicalApiService.piDownload(
      `/party/${enc(partyId)}/gaps${query(filters, { format: "csv" })}`,
      userId,
      `LeadersLens_${partyId}_gaps_${stamp}.csv`
    );
  },
  calendar(userId: string, partyId: string): Promise<{ items: CalendarItem[] }> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/calendar`, userId, {}, 30000);
  },
  addCalendar(userId: string, partyId: string, payload: Record<string, unknown>): Promise<CalendarItem> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/calendar`, userId, send("POST", payload), 20000);
  },
  updateCalendar(userId: string, partyId: string, itemId: string, payload: Record<string, unknown>): Promise<CalendarItem> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/calendar/${enc(itemId)}`, userId, send("PATCH", payload), 20000);
  },
  rules(userId: string, partyId: string): Promise<{ rules: GapRules; defaults: GapRules; updatedAt?: string; updatedByName?: string }> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/gap-rules`, userId, {}, 20000);
  },
  saveRules(userId: string, partyId: string, rules: GapRules): Promise<{ rules: GapRules; updatedAt?: string; updatedByName?: string }> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/gap-rules`, userId, send("PUT", rules), 20000);
  },
  audit(userId: string, partyId: string): Promise<{ items: AuditRow[] }> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/audit`, userId, {}, 20000);
  },
  compare(userId: string): Promise<{ note: string; parties: ComparisonRow[] }> {
    return politicalApiService.piRequest("/party/compare", userId, {}, 30000);
  },
  admins(userId: string): Promise<{ items: PartyAdminRecord[] }> {
    return politicalApiService.piRequest("/party/admins", userId, {}, 20000);
  },
  createAdmin(userId: string, payload: Record<string, unknown>): Promise<PartyAdminRecord> {
    return politicalApiService.piRequest("/party/admins", userId, send("POST", payload), 20000);
  },
  updateAdmin(userId: string, adminId: string, payload: Record<string, unknown>): Promise<PartyAdminRecord> {
    return politicalApiService.piRequest(`/party/admins/${enc(adminId)}`, userId, send("PATCH", payload), 20000);
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
  refreshPosts(userId: string, partyId: string, payload: { personId?: string; force?: boolean; wait?: boolean } = {}): Promise<RefreshJob> {
    return politicalApiService.piRequest(`/party/${enc(partyId)}/posts/refresh`, userId, send("POST", payload), payload.wait ? 120000 : 20000);
  }
};
