import React, { useCallback, useEffect, useState } from "react";
import { partyApi, type ComparisonRow } from "../../services/partyApi";
import type { PartyScreenProps } from "./PartyCommandCenter";
import { Card, Empty, ErrorBanner, Loading, SectionTitle, Segmented, formatNumber } from "./partyUi";

type Metric = "followers" | "postsPerWeek" | "avgEngagement" | "verifiedPercent" | "members";

const METRICS: { id: Metric; label: string; format: (v: number | null) => string }[] = [
  { id: "followers", label: "Followers", format: (v) => formatNumber(v) },
  { id: "postsPerWeek", label: "Posts / week", format: (v) => (v === null ? "—" : String(Math.round(v))) },
  { id: "avgEngagement", label: "Avg engagement", format: (v) => (v === null ? "—" : `${v}%`) },
  { id: "verifiedPercent", label: "Verified accounts", format: (v) => (v === null ? "—" : `${v}%`) },
  { id: "members", label: "Members", format: (v) => (v === null ? "—" : String(v)) }
];

export const PartyCompare: React.FC<PartyScreenProps> = ({ userId }) => {
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [note, setNote] = useState("");
  const [metric, setMetric] = useState<Metric>("followers");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await partyApi.compare(userId);
      setRows(res.parties);
      setNote(res.note);
    } catch (e: any) {
      setError(e?.message || "Could not load the comparison.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = [...rows].sort((a, b) => ((b[metric] as number) ?? -1) - ((a[metric] as number) ?? -1));
  const max = Math.max(1, ...sorted.map((r) => (r[metric] as number) || 0));
  const def = METRICS.find((m) => m.id === metric)!;

  return (
    <div data-testid="party-compare">
      <SectionTitle title="Compare parties" subtitle={note} />
      <div className="mb-3">
        <Segmented options={METRICS.map((m) => ({ id: m.id, label: m.label }))} value={metric} onChange={(id) => setMetric(id as Metric)} />
      </div>
      <ErrorBanner message={error} onRetry={load} />
      {loading && rows.length === 0 ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty message="No party has members yet." />
      ) : (
        <>
          <Card className="mb-3">
            <ul className="space-y-2">
              {sorted.map((r) => {
                const value = (r[metric] as number | null) ?? null;
                return (
                  <li key={r.partyId}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-[#F5EFE0] break-words">
                        {r.abbreviation} <span className="font-normal text-[#B9AF95]">· {r.name}</span>
                      </span>
                      <span className="font-bold text-[#F9E29C] shrink-0">{def.format(value)}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-[#0C1524] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${((value || 0) / max) * 100}%`, background: r.color || "#C99436" }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {sorted.map((r) => (
              <Card key={r.partyId} testId="compare-row">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: r.color || "#C99436" }} />
                  <span className="text-sm font-bold text-[#F5EFE0] break-words">
                    {r.abbreviation} · {r.name}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {METRICS.map((m) => (
                    <React.Fragment key={m.id}>
                      <dt className="text-[#8A8E9B]">{m.label}</dt>
                      <dd className="text-right font-bold text-[#F9E29C]">{m.format((r[m.id] as number | null) ?? null)}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
