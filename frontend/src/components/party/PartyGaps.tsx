import React, { useCallback, useEffect, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { partyApi, type GapGroup, type GapRules, type PartyFilters, type PartyOverview } from "../../services/partyApi";
import type { PartyScreenProps } from "./PartyCommandCenter";
import { PartyFilterBar } from "./PartyFilterBar";
import { Avatar, Btn, Card, ErrorBanner, Loading, SectionTitle, formatDate, roleText } from "./partyUi";

export const PartyGaps: React.FC<PartyScreenProps> = ({ userId, partyId, meta, onOpenMember }) => {
  const [filters, setFilters] = useState<PartyFilters>({ stateId: "AP" });
  const [options, setOptions] = useState<PartyOverview["filters"] | null>(null);
  const [groups, setGroups] = useState<GapGroup[]>([]);
  const [rules, setRules] = useState<GapRules | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [activeGapType, setActiveGapType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [reminding, setReminding] = useState("");

  useEffect(() => {
    partyApi
      .overview(userId, partyId, { stateId: filters.stateId || "AP" })
      .then((o) => setOptions(o.filters))
      .catch(() => setOptions(null));
  }, [userId, partyId, filters.stateId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await partyApi.gaps(userId, partyId, filters);
      setGroups(res.groups);
      setRules(res.rules);
      setMemberCount(res.members);
      // Auto-open first group with gaps if none currently selected
      setActiveGapType((prev) => {
        if (prev) return prev;
        const firstWithGaps = res.groups.find((g) => g.count > 0);
        return firstWithGaps ? firstWithGaps.type : (res.groups[0]?.type || null);
      });
    } catch (e: any) {
      setError(e?.message || "Could not load the gaps report.");
    } finally {
      setLoading(false);
    }
  }, [userId, partyId, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    setError("");
    try {
      await partyApi.exportGaps(userId, partyId, filters);
    } catch (e: any) {
      setError(e?.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div data-testid="party-gaps" className="space-y-3">
      <SectionTitle
        title="Gaps"
        subtitle={rules ? `${memberCount} members checked · inactive after ${rules.inactiveDays} days · target ${rules.weeklyPostTarget} posts/week · data stale after ${rules.staleHours} h · research older than ${rules.researchDays} days` : undefined}
        right={
          meta.capabilities.export && (
            <Btn variant="gold" busy={exporting} onClick={exportCsv} data-testid="gaps-export">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Btn>
          )
        }
      />
      <PartyFilterBar filters={filters} options={options} gapTypes={meta.gapTypes} onChange={setFilters} showPlatform={false} />
      <ErrorBanner message={error} onRetry={load} />
      {loading && groups.length === 0 ? (
        <Loading />
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const isOpen = activeGapType === g.type;
            return (
              <Card key={g.type} testId="gap-group" className="p-0 sm:p-0 overflow-hidden border border-[#C99436]/25 hover:border-[#C99436]/50 transition-colors">
                <button
                  type="button"
                  onClick={() => setActiveGapType((cur) => (cur === g.type ? null : g.type))}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                    isOpen ? "bg-[#0C1524]/90" : "bg-[#080E18]/60 hover:bg-[#0C1524]/50"
                  }`}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-[#F5EFE0] truncate">{g.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        g.count ? "bg-rose-500/15 text-rose-200 border border-rose-400/40" : "bg-emerald-500/15 text-emerald-300 border border-emerald-400/40"
                      }`}
                    >
                      {g.count}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#C99436] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-[#C99436]/20 bg-[#050B12]/80 px-3 py-2.5">
                    {g.members.length === 0 ? (
                      <p className="text-xs text-emerald-300 py-1.5 font-medium">✓ No members currently have this gap.</p>
                    ) : (
                      <ul className="divide-y divide-[#C99436]/10">
                        {g.members.map((m) => (
                          <li key={m.id} className="py-1.5 first:pt-0 last:pb-0">
                            <div className="w-full flex items-center justify-between gap-2 rounded-lg bg-[#080E18]/60 hover:bg-[#0C1524]/80 p-2 transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <Avatar name={m.name} url={m.photoUrl} size={32} />
                                <button type="button" onClick={() => onOpenMember(m.id)} className="min-w-0 text-left hover:underline">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#F5EFE0] truncate">{m.name}</span>
                                    <span className="text-[10px] text-[#A7A39A] hidden sm:inline-block">
                                      {m.assemblyConstituencyName || m.districtName || "State"}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-rose-200/90 font-medium truncate">{m.detail}</div>
                                  {m.remindedAt && (
                                    <div className="text-[10px] text-[#D4A24C]">
                                      Reminded {formatDate(m.remindedAt)} by {m.remindedBy || "team"}
                                    </div>
                                  )}
                                </button>
                              </div>
                              {meta.capabilities.edit && (
                                <Btn
                                  className="shrink-0 text-xs px-2.5 py-1"
                                  busy={reminding === `${g.type}:${m.id}`}
                                  onClick={async (event) => {
                                    event.stopPropagation();
                                    setReminding(`${g.type}:${m.id}`);
                                    setError("");
                                    try {
                                      await partyApi.remind(userId, partyId, m.id, g.type);
                                      await load();
                                    } catch (e: any) {
                                      setError(e?.message || "Could not save the reminder.");
                                    } finally {
                                      setReminding("");
                                    }
                                  }}
                                >
                                  Remind
                                </Btn>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
