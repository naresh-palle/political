import React, { useCallback, useEffect, useState } from "react";
import { Crown, Lock } from "lucide-react";
import type { UserProfile } from "../../types";
import { partyApi, type PartyFilters, type PartyMeta } from "../../services/partyApi";
import { ErrorBanner, Loading, Segmented } from "./partyUi";
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
  onOpenMember: (personId: string) => void;
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

  const loadMeta = useCallback(async () => {
    setError("");
    try {
      const data = await partyApi.meta(userId);
      setMeta(data);
      setPartyId((prev) => prev || data.defaultPartyId || data.parties[0]?.id || "");
    } catch (e: any) {
      setError(e?.message || "Could not load Party Command.");
    }
  }, [userId]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  if (error && !meta) {
    return (
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-10">
        <div className="rounded-2xl border border-rose-400/40 bg-rose-950/30 p-5 text-center">
          <Lock className="w-6 h-6 mx-auto text-rose-300" />
          <h1 className="mt-2 font-display text-xl text-[#F9E29C]">Party Command unavailable</h1>
          <p className="mt-1 text-sm text-rose-100">{error}</p>
          <button
            type="button"
            onClick={loadMeta}
            className="mt-4 rounded-lg border border-[#C99436]/40 px-4 py-2 text-xs font-semibold text-[#F5EFE0] hover:bg-[#0C1524]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!meta) return <Loading label="Loading Party Command…" />;

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
  const screenProps: PartyScreenProps = { userId, partyId: party?.id || partyId, meta, onOpenMember: openMember };

  return (
    <div data-testid="party-command" className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
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

      <ErrorBanner message={error} onRetry={loadMeta} />

      {!memberId && (
        <div className="mb-4">
          <Segmented testId="party-tabs" options={tabs} value={tab} onChange={(id) => setTab(id as PartyTab)} />
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
  );
};
