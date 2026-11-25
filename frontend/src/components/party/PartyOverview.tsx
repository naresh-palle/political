import React, { useCallback, useEffect, useState } from "react";
import { partyApi, type MemberBrief, type PartyFilters, type PartyOverview as Overview } from "../../services/partyApi";
import type { PartyScreenProps, PartyTab } from "./PartyCommandCenter";
import { PartyFilterBar } from "./PartyFilterBar";
import { Avatar, Card, ErrorBanner, Kpi, Loading, SectionTitle, WINDOW_OPTIONS, postsLabel, roleText } from "./partyUi";

interface Props extends PartyScreenProps {
  onShowMembers: (filters: PartyFilters) => void;
  onShowTab: (tab: PartyTab) => void;
}

const ActivityList: React.FC<{ title: string; rows: MemberBrief[]; onOpen: (id: string) => void; testId: string; windowDays: number }> = ({ title, rows, onOpen, testId, windowDays }) => (
  <Card testId={testId}>
    <h3 className="text-sm font-bold text-[#F9E29C] mb-2">{title}</h3>
    {rows.length === 0 ? (
      <p className="text-xs text-[#B9AF95]">No members match these filters.</p>
    ) : (
      <ol className="space-y-2">
        {rows.map((m, i) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onOpen(m.id)}
              className="w-full flex items-center gap-2 rounded-xl border border-[#C99436]/15 bg-[#050B12] px-2 py-2 text-left hover:border-[#C99436]/50"
            >
              <span className="w-5 text-center text-[11px] font-bold text-[#C99436]">{i + 1}</span>
              <Avatar name={m.name} url={m.photoUrl} size={32} />
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-bold text-[#F5EFE0] truncate">{m.name}</span>
                <span className="block text-[10px] text-[#B9AF95] truncate">
                  {roleText(m.roles) || "—"} · {m.assemblyConstituencyName || "—"}
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="block text-xs font-bold text-[#F9E29C]">
                  {m.postsInWindow ?? m.postsThisWeek}
                  {m.postsEstimated ? "*" : ""} {postsLabel(windowDays).toLowerCase()}
                </span>
                <span className="block text-[10px] text-[#B9AF95]">
                  {m.engagementPercent === null || m.engagementPercent === undefined ? "—" : `${m.engagementPercent}%`} engagement
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    )}
  </Card>
);

export const PartyOverview: React.FC<Props> = ({ userId, partyId, windowDays, onWindowDays, refreshTick, onOpenMember, onShowMembers, onShowTab }) => {
  const [filters, setFilters] = useState<PartyFilters>({});
  const [options, setOptions] = useState<Overview["filters"] | null>(null);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await partyApi.overview(userId, partyId, filters, windowDays);
      setData(res);
      setOptions((prev) => (Object.values(filters).some(Boolean) && prev ? prev : res.filters));
    } catch (e: any) {
      setError(e?.message || "Could not load the overview.");
    } finally {
      setLoading(false);
    }
  }, [userId, partyId, filters, windowDays, refreshTick]);

  useEffect(() => {
    load();
  }, [load]);

  const t = data?.totals;
  const scoped = (extra: PartyFilters) => onShowMembers({ ...filters, ...extra });

  return (
    <div data-testid="party-overview">
      <SectionTitle
        title="Overview"
        subtitle={data ? `${data.party?.name || partyId} · inactive after ${data.rules.inactiveDays} days · weekly target ${data.rules.weeklyPostTarget} posts` : undefined}
      />
      <div className="mb-3">
        <div data-testid="party-window" className="flex flex-wrap gap-1">
          {WINDOW_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onWindowDays(Number(option.id))}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold cursor-pointer ${
                String(windowDays) === option.id ? "border-[#C99436] bg-[#C99436] text-[#050B12]" : "border-[#C99436]/40 text-[#F5EFE0]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <PartyFilterBar filters={filters} options={options} onChange={setFilters} />
      <ErrorBanner message={error} onRetry={load} />
      {loading && !data ? (
        <Loading />
      ) : t ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
            <Kpi testId="kpi-members" label="Members" value={t.members} onClick={() => scoped({})} />
            <Kpi testId="kpi-verified" label="Verified accounts" value={t.verifiedAccounts} tone="green" onClick={() => scoped({})} />
            <Kpi testId="kpi-pending" label="Pending accounts" value={t.pendingAccounts} tone="amber" onClick={() => onShowTab("pending")} />
            <Kpi testId="kpi-inactive" label="Inactive members" value={t.inactive} tone="rose" onClick={() => scoped({ gap: "INACTIVE" })} />
            <Kpi
              testId="kpi-incomplete"
              label="Incomplete profiles"
              value={t.incompleteProfiles}
              tone="rose"
              onClick={() => scoped({ gap: "INCOMPLETE_PROFILE" })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ActivityList testId="most-active" title="Most active" rows={data!.mostActive} onOpen={onOpenMember} windowDays={windowDays} />
            <ActivityList testId="least-active" title="Least active" rows={data!.leastActive} onOpen={onOpenMember} windowDays={windowDays} />
          </div>
          <p className="mt-2 text-[10px] text-[#8A8E9B]">* Estimated from the last 30 days of collected data when no posts are logged this week.</p>
        </>
      ) : null}
    </div>
  );
};
