import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Crown, Lock } from "lucide-react";
import type { UserProfile } from "../../types";
import { fallbackPartyMeta, partyApi, type PartyFilters, type PartyMeta, type RefreshJob } from "../../services/partyApi";
import { ErrorBanner, Loading } from "./partyUi";
import { PartyOverview } from "./PartyOverview";
import { PartyMembers } from "./PartyMembers";
import { PartyMemberProfile } from "./PartyMemberProfile";
import { PartyPending } from "./PartyPending";
import { PartyGaps } from "./PartyGaps";
import { PartyCalendar } from "./PartyCalendar";
import { PartySettings } from "./PartySettings";
import { PartyCompare } from "./PartyCompare";
import { PartyAccounts } from "./PartyAccounts";

export type PartyTab = "overview" | "members" | "pending" | "gaps" | "calendar" | "settings" | "compare" | "accounts";

export interface PartyScreenProps {
  userId: string;
  partyId: string;
  meta: PartyMeta;
  windowDays: number;
  onWindowDays: (days: number) => void;
  refreshTick: number;
  onOpenMember: (personId: string) => void;
}

interface RefreshApi {
  job: RefreshJob | null;
  start: (opts?: { personId?: string; force?: boolean }) => Promise<void>;
}

const RefreshContext = createContext<RefreshApi | null>(null);

export function usePartyRefresh(): RefreshApi | null {
  return useContext(RefreshContext);
}

interface Props {
  currentUser: UserProfile;
}

export const PartyCommandCenter: React.FC<Props> = ({ currentUser }) => {
  const userId = currentUser.id;
  const [meta, setMeta] = useState<PartyMeta | null>(null);
  const [error, setError] = useState("");
  const [partyId, setPartyId] = useState<string>("");
  const [tab, setTab] = useState<PartyTab>("overview");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberFilters, setMemberFilters] = useState<PartyFilters>({});
  const [windowDays, setWindowDays] = useState(7);
  const [refreshTick, setRefreshTick] = useState(0);
  const [job, setJob] = useState<RefreshJob | null>(null);
  const autoStarted = useRef("");

  const startRefresh = useCallback(async (opts?: { personId?: string; force?: boolean }) => {
    if (!partyId) return;
    const res = await partyApi.refreshPosts(userId, partyId, { personId: opts?.personId, force: opts?.force ?? true, wait: false });
    setJob(res);
    if (res.status === "DONE") setRefreshTick((n) => n + 1);
  }, [userId, partyId]);

  useEffect(() => {
    if (!job || job.status !== "RUNNING" || !partyId) return;
    const timer = window.setInterval(async () => {
      try {
        const next = await partyApi.refreshStatus(userId, partyId);
        setJob(next);
        if (next.status !== "RUNNING") setRefreshTick((n) => n + 1);
      } catch {
        /* keep the last status and try again */
      }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [job, partyId, userId]);

  useEffect(() => {
    if (!meta?.capabilities.edit || !partyId || autoStarted.current === partyId) return;
    autoStarted.current = partyId;
    partyApi.refreshStatus(userId, partyId).then((status) => {
      const last = status.lastRunAt ? Date.parse(status.lastRunAt) : 0;
      if (status.status === "RUNNING" || (last && Date.now() - last < 24 * 60 * 60 * 1000)) {
        setJob(status);
        return;
      }
      startRefresh({ force: false });
    }).catch(() => {});
  }, [meta, partyId, userId, startRefresh]);

  const loadMeta = useCallback(async () => {
    setError("");
    try {
      const data = await partyApi.meta(userId);
      setMeta(data);
      setPartyId((prev) => prev || data.defaultPartyId || data.parties[0]?.id || "");
    } catch (e: any) {
      console.warn("Party meta fetch notice, using resilient profile fallback:", e);
      const fallback = fallbackPartyMeta(currentUser);
      setMeta(fallback);
      setPartyId((prev) => prev || fallback.defaultPartyId || fallback.parties[0]?.id || "TDP");
      window.setTimeout(() => {
        partyApi
          .meta(userId)
          .then((fresh) => {
            setMeta(fresh);
            setPartyId((prev) => prev || fresh.defaultPartyId || fresh.parties[0]?.id || "TDP");
          })
          .catch(() => {});
      }, 3500);
    }
  }, [userId, currentUser]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  if (!meta) {
    const fallback = fallbackPartyMeta(currentUser);
    return <Loading label="Loading Party Command…" />;
  }

  const caps = meta.capabilities;
  const party = meta.parties.find((p) => p.id === partyId) || meta.parties[0];
  const roleLabel = caps.isSuper ? "Super Admin" : caps.isPresident ? "Party President" : "Party Analyst";

  const tabs: { id: PartyTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "members", label: "Members" },
    { id: "pending", label: "Pending" },
    { id: "gaps", label: "Gaps" },
    { id: "calendar", label: "Content Calendar" },
    { id: "settings", label: caps.edit ? "Rules & History" : "Rules" },
    ...(caps.compare ? [{ id: "compare" as PartyTab, label: "Compare Parties" }] : []),
    ...(caps.manageAdmins ? [{ id: "accounts" as PartyTab, label: "Party Accounts" }] : [])
  ];

  const openMember = (personId: string) => setMemberId(personId);
  const screenProps: PartyScreenProps = {
    userId,
    partyId: party?.id || partyId,
    meta,
    windowDays,
    onWindowDays: setWindowDays,
    refreshTick,
    onOpenMember: openMember
  };
  const chooseTab = (id: PartyTab) => {
    if (id === "members") setMemberFilters({});
    setMemberId(null);
    setTab(id);
  };

  return (
    <RefreshContext.Provider value={{ job, start: startRefresh }}>
    <div data-testid="party-command" className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl border border-[#C99436]/50 bg-[#050B12] flex items-center justify-center text-xl shrink-0">
            {party?.symbolEmoji || <Crown className="w-5 h-5 text-[#C99436]" />}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl text-[#F9E29C] leading-tight">Party Command Center</h1>
            <p className="text-xs text-[#B9AF95] truncate">
              {party ? `${party.name} (${party.abbreviation})` : "No party"} · {roleLabel}
              {!caps.edit && " · view only"}
            </p>
          </div>
        </div>
        {caps.isSuper ? (
          <label className="flex items-center gap-2 text-xs text-[#B9AF95]">
            <span className="font-semibold uppercase tracking-wide">Party</span>
            <select
              data-testid="party-select"
              value={party?.id || ""}
              onChange={(e) => {
                setPartyId(e.target.value);
                setMemberId(null);
                setMemberFilters({});
              }}
              className="rounded-lg bg-[#050B12] border border-[#C99436]/40 px-3 py-2 text-sm text-[#F5EFE0] max-w-[240px]"
            >
              {meta.parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.abbreviation} — {p.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C99436]/40 bg-[#050B12] px-3 py-1.5 text-[11px] font-semibold text-[#F9E29C]">
            <Lock className="w-3 h-3" /> {party?.abbreviation} only
          </span>
        )}
      </div>

      {/* Tab Navigation Header (Positioned at Top) */}
      <nav
        data-testid="party-tabs"
        className="mb-4 rounded-xl border border-[#C99436]/35 bg-[#050B12] p-1.5 shadow-md overflow-x-auto no-scrollbar"
      >
        <div className="flex flex-nowrap sm:flex-wrap items-center gap-1.5">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseTab(item.id)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                !memberId && tab === item.id
                  ? "bg-gradient-to-r from-[#C99436] to-[#E5B869] text-[#050B12] shadow font-black"
                  : "text-[#CBD5E1] hover:text-[#F5EFE0] hover:bg-[#0C1524] border border-transparent"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <ErrorBanner message={error} onRetry={loadMeta} />

      {job && (job.status === "RUNNING" || job.detail || (job.notes && job.notes.length > 0)) && (
        <div role="status" data-testid="post-refresh" className="mb-3 rounded-xl border border-[#C99436]/30 bg-[#080E18] px-3 py-2 text-xs text-[#E6DCC4]">
          {job.status === "RUNNING" && <span>Fetching latest posts{job.total ? ` (${job.done || 0} of ${job.total} accounts)` : "…"} </span>}
          {job.detail && <span>{job.detail} </span>}
          {(job.notes || []).join(" ")}
          {caps.edit && job.status !== "RUNNING" && (
            <button type="button" className="ml-2 font-bold text-[#F9E29C] underline" onClick={() => startRefresh({ force: true })}>
              Fetch again
            </button>
          )}
        </div>
      )}

      {memberId ? (
        <PartyMemberProfile key={`${screenProps.partyId}:${memberId}`} {...screenProps} personId={memberId} onBack={() => setMemberId(null)} />
      ) : (
        <React.Fragment key={screenProps.partyId}>
          {tab === "overview" && (
            <PartyOverview
              {...screenProps}
              onShowMembers={(filters) => {
                setMemberFilters(filters);
                setTab("members");
              }}
              onShowTab={(t) => setTab(t)}
            />
          )}
          {tab === "members" && <PartyMembers {...screenProps} initialFilters={memberFilters} />}
          {tab === "pending" && <PartyPending {...screenProps} />}
          {tab === "gaps" && <PartyGaps {...screenProps} />}
          {tab === "calendar" && <PartyCalendar {...screenProps} />}
          {tab === "settings" && <PartySettings {...screenProps} />}
          {tab === "compare" && caps.compare && <PartyCompare {...screenProps} />}
          {tab === "accounts" && caps.manageAdmins && <PartyAccounts {...screenProps} />}
        </React.Fragment>
      )}
    </div>
    </RefreshContext.Provider>
  );
};
