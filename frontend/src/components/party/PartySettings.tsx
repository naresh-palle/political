import React, { useCallback, useEffect, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { partyApi, type AuditRow, type GapRules } from "../../services/partyApi";
import type { PartyScreenProps } from "./PartyCommandCenter";
import { actionLabel } from "./PartyMemberProfile";
import { Btn, Card, Empty, ErrorBanner, Loading, Notice, SectionTitle, formatDate, inputCls, labelCls } from "./partyUi";

const RULE_FIELDS: { key: keyof GapRules; label: string; help: string; min: number; max: number }[] = [
  { key: "inactiveDays", label: "Inactive after (days)", help: "No post for this many days marks a member inactive.", min: 1, max: 90 },
  { key: "weeklyPostTarget", label: "Weekly post target", help: "Fewer posts than this in 7 days is low posting.", min: 1, max: 100 },
  { key: "staleHours", label: "Data stale after (hours)", help: "Account numbers older than this are stale.", min: 1, max: 720 },
  { key: "researchDays", label: "Research older than (days)", help: "No research note in this window is flagged.", min: 1, max: 365 }
];

export const PartySettings: React.FC<PartyScreenProps> = ({ userId, partyId, meta }) => {
  const canEdit = meta.capabilities.edit;
  const [rules, setRules] = useState<GapRules | null>(null);
  const [defaults, setDefaults] = useState<GapRules>(meta.defaultGapRules);
  const [stamp, setStamp] = useState("");
  const [history, setHistory] = useState<AuditRow[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await partyApi.rules(userId, partyId);
      setRules(res.rules);
      setDefaults(res.defaults);
      setStamp(res.updatedAt ? `Last changed ${formatDate(res.updatedAt, true)} by ${res.updatedByName || "—"}` : "Using default rules");
      if (canEdit) {
        const audit = await partyApi.audit(userId, partyId);
        setHistory(audit.items);
      }
    } catch (e: any) {
      setError(e?.message || "Could not load the rules.");
    }
  }, [userId, partyId, canEdit]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (next: GapRules) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await partyApi.saveRules(userId, partyId, next);
      setRules(res.rules);
      setNotice("Rules saved. Gaps and the overview now use these values.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Could not save the rules.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="party-settings" className="space-y-3">
      <SectionTitle title="Gap rules" subtitle={stamp} />
      <ErrorBanner message={error} onRetry={load} />
      <Notice message={notice} />
      {!rules ? (
        <Loading />
      ) : (
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RULE_FIELDS.map((f) => (
              <div key={f.key}>
                <label className={labelCls} htmlFor={`rule-${f.key}`}>{f.label}</label>
                <input
                  id={`rule-${f.key}`}
                  type="number"
                  min={f.min}
                  max={f.max}
                  className={inputCls}
                  value={rules[f.key]}
                  readOnly={!canEdit}
                  onChange={(e) => setRules({ ...rules, [f.key]: Number(e.target.value) })}
                />
                <p className="mt-0.5 text-[10px] text-[#8A8E9B]">
                  {f.help} Default {defaults[f.key]}.
                </p>
              </div>
            ))}
          </div>
          {canEdit && (
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Btn onClick={() => save(defaults)} disabled={busy}>
                <RotateCcw className="w-3.5 h-3.5" /> Reset to defaults
              </Btn>
              <Btn variant="gold" busy={busy} onClick={() => save(rules)} data-testid="rules-save">
                <Save className="w-3.5 h-3.5" /> Save rules
              </Btn>
            </div>
          )}
        </Card>
      )}

      {canEdit && (
        <>
          <SectionTitle title="Party history" subtitle="Who viewed or changed party records. Newest first." />
          <Card testId="party-history">
            {history.length === 0 ? (
              <Empty message="No activity yet." />
            ) : (
              <ul className="divide-y divide-[#C99436]/15 max-h-[480px] overflow-y-auto">
                {history.map((h) => (
                  <li key={h.id} className="py-2 flex flex-wrap justify-between gap-1 text-xs">
                    <span className="min-w-0 text-[#F5EFE0] break-words">
                      {actionLabel(h.action)}
                      {h.targetName ? <span className="text-[#D4A24C]"> · {h.targetName}</span> : null}
                      <span className="text-[#B9AF95]"> by {h.actorName}</span>
                    </span>
                    <span className="text-[#8A8E9B]">{formatDate(h.timestamp, true)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
