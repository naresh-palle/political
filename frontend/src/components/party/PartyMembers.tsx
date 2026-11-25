import React, { useCallback, useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { partyApi, type PartyFilters, type PartyMember, type PartyOverview } from "../../services/partyApi";
import type { PartyScreenProps } from "./PartyCommandCenter";
import { PartyFilterBar } from "./PartyFilterBar";
import {
  Avatar,
  Btn,
  CompletenessBar,
  Empty,
  ErrorBanner,
  GapChip,
  Loading,
  PlatformChips,
  SectionTitle,
  formatNumber,
  timeAgo,
  roleText
} from "./partyUi";

interface Props extends PartyScreenProps {
  initialFilters?: PartyFilters;
}

export const MemberCard: React.FC<{ member: PartyMember; onOpen: () => void }> = ({ member, onOpen }) => (
  <button
    type="button"
    data-testid="member-card"
    onClick={onOpen}
    className="w-full text-left rounded-2xl border border-[#C99436]/25 bg-[#080E18]/90 p-3 hover:border-[#C99436]/60 transition-colors"
  >
    <div className="flex items-start gap-3">
      <Avatar name={member.name} url={member.photoUrl} size={44} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-[#F5EFE0] break-words">{member.name}</div>
        <div className="text-[11px] text-[#D4A24C] break-words">{roleText(member.roles) || "—"}</div>
        <div className="text-[11px] text-[#B9AF95] break-words">
          {member.assemblyConstituencyName || "—"}
          {member.districtName ? ` · ${member.districtName}` : ""}
        </div>
      </div>
    </div>
    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
      <div className="min-w-0">
        <span className="text-[#8A8E9B]">Email </span>
        <span className="text-[#F5EFE0] break-all">{member.email || "—"}</span>
      </div>
      <div className="min-w-0">
        <span className="text-[#8A8E9B]">Phone </span>
        <span className="text-[#F5EFE0]">{member.phone || "—"}</span>
      </div>
    </div>
    <div className="mt-2">
      <PlatformChips platforms={member.platforms} />
    </div>
    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-lg bg-[#050B12] py-1.5">
        <div className="text-xs font-bold text-[#F9E29C]">{formatNumber(member.followersTotal)}</div>
        <div className="text-[9px] uppercase text-[#8A8E9B]">Followers</div>
      </div>
      <div className="rounded-lg bg-[#050B12] py-1.5">
        <div className="text-xs font-bold text-[#F9E29C]">
          {member.postsThisWeek}
          {member.postsEstimated ? "*" : ""}
        </div>
        <div className="text-[9px] uppercase text-[#8A8E9B]">Posts / week</div>
      </div>
      <div className="rounded-lg bg-[#050B12] py-1.5">
        <div className="text-xs font-bold text-[#F9E29C]">{timeAgo(member.lastPostAt)}</div>
        <div className="text-[9px] uppercase text-[#8A8E9B]">Last post</div>
      </div>
    </div>
    <div className="mt-2">
      <div className="text-[9px] uppercase text-[#8A8E9B] mb-0.5">Profile completeness</div>
      <CompletenessBar value={member.completeness} />
    </div>
    <div className="mt-2 flex flex-wrap gap-1">
      {member.gapTypes.length === 0 ? (
        <span className="text-[10px] font-semibold text-emerald-300">No gaps</span>
      ) : (
        member.gapTypes.map((g) => <GapChip key={g} type={g} />)
      )}
    </div>
  </button>
);

export const PartyMembers: React.FC<Props> = ({ userId, partyId, meta, onOpenMember, initialFilters }) => {
  const [filters, setFilters] = useState<PartyFilters>(initialFilters || {});
  const [options, setOptions] = useState<PartyOverview["filters"] | null>(null);
  const [rows, setRows] = useState<PartyMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const seq = useRef(0);

  useEffect(() => {
    partyApi
      .overview(userId, partyId)
      .then((o) => setOptions(o.filters))
      .catch(() => setOptions(null));
  }, [userId, partyId]);

  const load = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    setError("");
    try {
      const res = await partyApi.members(userId, partyId, filters);
      if (id !== seq.current) return;
      setRows(res.items);
      setTotal(res.total);
    } catch (e: any) {
      if (id === seq.current) setError(e?.message || "Could not load members.");
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [userId, partyId, filters]);

  useEffect(() => {
    const timer = setTimeout(load, filters.q ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, filters.q]);

  const exportCsv = async () => {
    setExporting(true);
    setError("");
    try {
      await partyApi.exportMembers(userId, partyId, filters);
    } catch (e: any) {
      setError(e?.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div data-testid="party-members">
      <SectionTitle
        title="Members"
        subtitle={loading ? "Loading…" : `${total} member${total === 1 ? "" : "s"}`}
        right={
          meta.capabilities.export && (
            <Btn variant="gold" busy={exporting} onClick={exportCsv} data-testid="members-export">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Btn>
          )
        }
      />
      <PartyFilterBar filters={filters} options={options} onChange={setFilters} showSearch showGap />
      <ErrorBanner message={error} onRetry={load} />
      {loading && rows.length === 0 ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty message="No members match these filters." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.map((m) => (
            <MemberCard key={m.id} member={m} onOpen={() => onOpenMember(m.id)} />
          ))}
        </div>
      )}
      {rows.length > 0 && <p className="mt-2 text-[10px] text-[#8A8E9B]">* Estimated from the last 30 days of collected data.</p>}
    </div>
  );
};
