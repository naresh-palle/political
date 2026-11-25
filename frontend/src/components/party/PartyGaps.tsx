import React, { useCallback, useEffect, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { partyApi, type GapGroup, type GapRules, type PartyFilters, type PartyOverview } from "../../services/partyApi";
import type { PartyScreenProps } from "./PartyCommandCenter";
import { PartyFilterBar } from "./PartyFilterBar";
import { Avatar, Btn, Card, ErrorBanner, Loading, SectionTitle, roleText } from "./partyUi";

export const PartyGaps: React.FC<PartyScreenProps> = ({ userId, partyId, meta, onOpenMember }) => {
  const [filters, setFilters] = useState<PartyFilters>({});
  const [options, setOptions] = useState<PartyOverview["filters"] | null>(null);
  const [groups, setGroups] = useState<GapGroup[]>([]);
  const [rules, setRules] = useState<GapRules | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    partyApi
      .overview(userId, partyId)
      .then((o) => setOptions(o.filters))
      .catch(() => setOptions(null));
  }, [userId, partyId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await partyApi.gaps(userId, partyId, filters);
      setGroups(res.groups);
      setRules(res.rules);
      setMemberCount(res.members);
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
    <div data-testid="party-gaps">
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
      <PartyFilterBar filters={filters} options={options} onChange={setFilters} showPlatform={false} />
      <ErrorBanner message={error} onRetry={load} />
      {loading && groups.length === 0 ? (
        <Loading />
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const isOpen = !!open[g.type];
            return (
              <Card key={g.type} testId="gap-group" className="p-0 sm:p-0">
                <button
                  type="button"
                  onClick={() => setOpen({ ...open, [g.type]: !isOpen })}
                  className="w-full flex items-center justify-between gap-2 px-3 py-3 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-bold text-[#F5EFE0]">{g.label}</span>
                  <span className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        g.count ? "bg-rose-500/15 text-rose-200 border border-rose-400/40" : "bg-emerald-500/15 text-emerald-300 border border-emerald-400/40"
                      }`}
                    >
                      {g.count}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#C99436] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-[#C99436]/15 px-3 py-2">
                    {g.members.length === 0 ? (
                      <p className="text-xs text-emerald-300 py-2">No members have this gap.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {g.members.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => onOpenMember(m.id)}
                              className="w-full flex items-start gap-2 rounded-xl bg-[#050B12] px-2 py-2 text-left hover:bg-[#0C1524]"
                            >
                              <Avatar name={m.name} url={m.photoUrl} size={30} />
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-bold text-[#F5EFE0] break-words">{m.name}</span>
                                <span className="block text-[10px] text-[#B9AF95] break-words">
                                  {roleText(m.roles) || "—"} · {m.assemblyConstituencyName || "—"}
                                  {m.districtName ? ` · ${m.districtName}` : ""}
                                </span>
                                <span className="block text-[11px] text-rose-200 break-words">{m.detail}</span>
                              </span>
                            </button>
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
