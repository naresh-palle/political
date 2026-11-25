import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RotateCcw, UserPlus } from "lucide-react";
import { partyApi, type PendingItem } from "../../services/partyApi";
import type { PartyScreenProps } from "./PartyCommandCenter";
import { Avatar, Btn, Card, Empty, ErrorBanner, Loading, PLATFORM_LABELS, SectionTitle, Segmented, formatDate, inputCls } from "./partyUi";

const KIND_LABELS: Record<string, string> = {
  ACCOUNT: "Account",
  REVIEW: "Review",
  CAMPAIGN: "Campaign"
};

export const PendingRow: React.FC<{
  item: PendingItem;
  userId: string;
  partyId: string;
  canEdit: boolean;
  onChanged: () => void;
  onOpenMember?: (id: string) => void;
  showMember?: boolean;
}> = ({ item, userId, partyId, canEdit, onChanged, onOpenMember, showMember = true }) => {
  const [assignee, setAssignee] = useState(item.assigneeName || "");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const done = item.status === "DONE";

  const update = async (key: string, payload: { status?: string; assigneeName?: string }) => {
    setBusy(key);
    setError("");
    try {
      await partyApi.updatePending(userId, partyId, item.id, payload);
      onChanged();
    } catch (e: any) {
      setError(e?.message || "Could not update this item.");
    } finally {
      setBusy("");
    }
  };

  return (
    <Card testId="pending-row" className={done ? "opacity-70" : ""}>
      <div className="flex flex-wrap items-start gap-3">
        {showMember && <Avatar name={item.memberName} url={item.photoUrl} size={36} />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-[#C99436]/40 px-2 py-0.5 text-[10px] font-bold text-[#F9E29C]">{KIND_LABELS[item.kind] || item.kind}</span>
            {done && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Done</span>}
            {item.ageDays !== null && <span className="text-[10px] text-[#B9AF95]">{item.ageDays} day{item.ageDays === 1 ? "" : "s"} old</span>}
          </div>
          <div className="mt-1 text-xs font-semibold text-[#F5EFE0] break-words">{item.label}</div>
          {showMember && (
            <button
              type="button"
              onClick={() => onOpenMember?.(item.personId)}
              className="text-[11px] text-[#D4A24C] hover:underline text-left break-words"
            >
              {item.memberName} · {item.assemblyConstituencyName || "—"}
            </button>
          )}
          <div className="text-[10px] text-[#8A8E9B]">
            {item.platform ? `${PLATFORM_LABELS[item.platform as keyof typeof PLATFORM_LABELS] || item.platform} · ` : ""}
            {item.dueAt ? `Due ${formatDate(item.dueAt)} · ` : ""}
            Since {formatDate(item.since)} · Assigned to {item.assigneeName || "nobody"}
          </div>
        </div>
      </div>
      {canEdit && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
          <input
            aria-label="Assign to"
            className={inputCls}
            placeholder="Assign to (name)"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
          <Btn busy={busy === "assign"} onClick={() => update("assign", { assigneeName: assignee })} data-testid="pending-assign">
            <UserPlus className="w-3.5 h-3.5" /> Assign
          </Btn>
          {done ? (
            <Btn busy={busy === "status"} onClick={() => update("status", { status: "OPEN" })}>
              <RotateCcw className="w-3.5 h-3.5" /> Reopen
            </Btn>
          ) : (
            <Btn variant="gold" busy={busy === "status"} onClick={() => update("status", { status: "DONE" })} data-testid="pending-done">
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark done
            </Btn>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-[11px] text-rose-300">{error}</p>}
    </Card>
  );
};

export const PartyPending: React.FC<PartyScreenProps> = ({ userId, partyId, meta, onOpenMember }) => {
  const [kind, setKind] = useState("ALL");
  const [includeDone, setIncludeDone] = useState(false);
  const [items, setItems] = useState<PendingItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await partyApi.pending(userId, partyId, undefined, includeDone);
      setItems(res.items);
      setCounts(res.counts);
    } catch (e: any) {
      setError(e?.message || "Could not load pending items.");
    } finally {
      setLoading(false);
    }
  }, [userId, partyId, includeDone]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = kind === "ALL" ? items : items.filter((i) => i.kind === kind);
  const total = (counts.ACCOUNT || 0) + (counts.REVIEW || 0) + (counts.CAMPAIGN || 0);

  return (
    <div data-testid="party-pending">
      <SectionTitle
        title="Pending"
        subtitle="Accounts waiting for verification, member records waiting for review, and campaign posts not yet published."
        right={
          <label className="flex items-center gap-2 text-xs text-[#F5EFE0]">
            <input type="checkbox" checked={includeDone} onChange={(e) => setIncludeDone(e.target.checked)} className="accent-[#C99436]" />
            Show done
          </label>
        }
      />
      <div className="mb-3">
        <Segmented
          testId="pending-kinds"
          value={kind}
          onChange={setKind}
          options={[
            { id: "ALL", label: "All", count: total },
            { id: "ACCOUNT", label: "Accounts", count: counts.ACCOUNT || 0 },
            { id: "REVIEW", label: "Reviews", count: counts.REVIEW || 0 },
            { id: "CAMPAIGN", label: "Campaign posts", count: counts.CAMPAIGN || 0 }
          ]}
        />
      </div>
      <ErrorBanner message={error} onRetry={load} />
      {loading && items.length === 0 ? (
        <Loading />
      ) : visible.length === 0 ? (
        <Empty message="Nothing pending here." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {visible.map((item) => (
            <PendingRow
              key={item.id}
              item={item}
              userId={userId}
              partyId={partyId}
              canEdit={meta.capabilities.edit}
              onChanged={load}
              onOpenMember={onOpenMember}
            />
          ))}
        </div>
      )}
    </div>
  );
};
