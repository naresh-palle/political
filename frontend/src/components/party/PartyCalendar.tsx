import React, { useCallback, useEffect, useState } from "react";
import { Ban, Check, Plus, RotateCcw, Undo2 } from "lucide-react";
import { partyApi, type CalendarItem, type PartyMember, type PartyPlatform } from "../../services/partyApi";
import type { PartyScreenProps } from "./PartyCommandCenter";
import {
  Btn,
  Card,
  Empty,
  ErrorBanner,
  Loading,
  Notice,
  PLATFORMS,
  PLATFORM_LABELS,
  SectionTitle,
  formatDate,
  fromLocalInput,
  inputCls,
  labelCls,
  toLocalInput
} from "./partyUi";

const STATUS_TONE: Record<string, string> = {
  PLANNED: "bg-amber-500/15 text-amber-200 border-amber-400/40",
  PUBLISHED: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40",
  MISSED: "bg-rose-500/15 text-rose-200 border-rose-400/40",
  CANCELLED: "bg-slate-500/15 text-slate-300 border-slate-400/30"
};

const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planned",
  PUBLISHED: "Published",
  MISSED: "Missed",
  CANCELLED: "Cancelled"
};

const emptyForm = () => ({
  title: "",
  brief: "",
  hashtag: "",
  dueAt: toLocalInput(new Date(Date.now() + 2 * 86400000).toISOString()),
  platforms: [...PLATFORMS] as PartyPlatform[],
  assignAll: true,
  assignedPersonIds: [] as string[]
});

export const PartyCalendar: React.FC<PartyScreenProps> = ({ userId, partyId, meta, onOpenMember }) => {
  const canEdit = meta.capabilities.edit;
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await partyApi.calendar(userId, partyId);
      setItems(res.items);
    } catch (e: any) {
      setError(e?.message || "Could not load the content calendar.");
    } finally {
      setLoading(false);
    }
  }, [userId, partyId]);

  useEffect(() => {
    load();
    if (canEdit) {
      partyApi
        .members(userId, partyId)
        .then((r) => setMembers(r.items))
        .catch(() => setMembers([]));
    }
  }, [load, canEdit, userId, partyId]);

  const run = async (key: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await fn();
      await load();
      setNotice(success);
      return true;
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      return false;
    } finally {
      setBusy("");
    }
  };

  const togglePlatform = (p: PartyPlatform) =>
    setForm((f) => ({ ...f, platforms: f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p] }));

  const toggleMember = (id: string) =>
    setForm((f) => ({
      ...f,
      assignedPersonIds: f.assignedPersonIds.includes(id) ? f.assignedPersonIds.filter((x) => x !== id) : [...f.assignedPersonIds, id]
    }));

  return (
    <div data-testid="party-calendar">
      <SectionTitle
        title="Content Calendar"
        subtitle="Planned posts for members. A member counts as published when a logged post links to the item, uses its hashtag, or is marked published."
        right={
          canEdit && (
            <Btn variant="gold" onClick={() => setShowForm((v) => !v)} data-testid="calendar-new">
              <Plus className="w-3.5 h-3.5" /> {showForm ? "Close" : "New campaign post"}
            </Btn>
          )
        }
      />
      <ErrorBanner message={error} onRetry={load} />
      <Notice message={notice} />

      {canEdit && showForm && (
        <Card className="mb-3" testId="calendar-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="cal-title">Title</label>
              <input id="cal-title" className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="cal-brief">Brief for members</label>
              <textarea id="cal-brief" rows={3} className={inputCls} value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} />
            </div>
            <div>
              <label className={labelCls} htmlFor="cal-hashtag">Hashtag</label>
              <input id="cal-hashtag" className={inputCls} placeholder="#Campaign" value={form.hashtag} onChange={(e) => setForm({ ...form, hashtag: e.target.value })} />
            </div>
            <div>
              <label className={labelCls} htmlFor="cal-due">Due</label>
              <input id="cal-due" type="datetime-local" className={inputCls} value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <span className={labelCls}>Platforms</span>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <label key={p} className="flex items-center gap-1.5 rounded-lg border border-[#C99436]/30 px-2.5 py-1.5 text-xs text-[#F5EFE0]">
                    <input type="checkbox" checked={form.platforms.includes(p)} onChange={() => togglePlatform(p)} className="accent-[#C99436]" />
                    {PLATFORM_LABELS[p]}
                  </label>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <span className={labelCls}>Assign to</span>
              <div className="flex flex-wrap gap-2 mb-2">
                <label className="flex items-center gap-1.5 text-xs text-[#F5EFE0]">
                  <input type="radio" checked={form.assignAll} onChange={() => setForm({ ...form, assignAll: true })} className="accent-[#C99436]" />
                  All members
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#F5EFE0]">
                  <input type="radio" checked={!form.assignAll} onChange={() => setForm({ ...form, assignAll: false })} className="accent-[#C99436]" />
                  Selected members
                </label>
              </div>
              {!form.assignAll && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 max-h-56 overflow-y-auto rounded-lg border border-[#C99436]/20 p-2">
                  {members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-xs text-[#F5EFE0] py-0.5">
                      <input type="checkbox" checked={form.assignedPersonIds.includes(m.id)} onChange={() => toggleMember(m.id)} className="accent-[#C99436]" />
                      <span className="break-words">
                        {m.name} <span className="text-[#8A8E9B]">· {m.assemblyConstituencyName || "—"}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Btn
              variant="gold"
              busy={busy === "create"}
              data-testid="calendar-create"
              onClick={async () => {
                const ok = await run(
                  "create",
                  () =>
                    partyApi.addCalendar(userId, partyId, {
                      title: form.title,
                      brief: form.brief,
                      hashtag: form.hashtag,
                      dueAt: fromLocalInput(form.dueAt),
                      platforms: form.platforms,
                      assignAll: form.assignAll,
                      assignedPersonIds: form.assignAll ? [] : form.assignedPersonIds
                    }),
                  "Campaign post planned."
                );
                if (ok) {
                  setForm(emptyForm());
                  setShowForm(false);
                }
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Plan post
            </Btn>
          </div>
        </Card>
      )}

      {loading && items.length === 0 ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty message="No campaign posts planned yet." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {items.map((item) => (
            <Card key={item.id} testId="calendar-item">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE[item.status] || STATUS_TONE.PLANNED}`}>
                      {STATUS_LABEL[item.status] || item.status}
                    </span>
                    <span className="text-[11px] text-[#B9AF95]">Due {formatDate(item.dueAt, true)}</span>
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-[#F5EFE0] break-words">{item.title}</h3>
                  {item.brief && <p className="text-xs text-[#E6DCC4] break-words whitespace-pre-wrap">{item.brief}</p>}
                  <p className="mt-1 text-[11px] text-[#B9AF95]">
                    {item.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}
                    {item.hashtag ? ` · ${item.hashtag}` : ""} · {item.assignAll ? "All members" : `${item.assignedCount} selected`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-2xl text-[#F9E29C]">
                    {item.publishedCount}/{item.assignedCount}
                  </div>
                  <div className="text-[9px] uppercase text-[#8A8E9B]">Published</div>
                </div>
              </div>
              {item.assignees.length > 0 && (
                <ul className="mt-2 max-h-48 overflow-y-auto divide-y divide-[#C99436]/10 rounded-lg border border-[#C99436]/15">
                  {item.assignees.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 px-2 py-1.5">
                      <button type="button" onClick={() => onOpenMember(a.id)} className="min-w-0 text-left text-xs text-[#F5EFE0] hover:underline break-words">
                        {a.name || a.id}
                      </button>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-bold ${a.published ? "text-emerald-300" : "text-amber-200"}`}>{a.published ? "Published" : "Not yet"}</span>
                        {canEdit && item.status !== "CANCELLED" && (
                          <Btn
                            className="px-2 py-1"
                            busy={busy === `${item.id}:${a.id}`}
                            aria-label={a.published ? `Undo published for ${a.name}` : `Mark ${a.name} published`}
                            onClick={() =>
                              run(
                                `${item.id}:${a.id}`,
                                () => partyApi.updateCalendar(userId, partyId, item.id, a.published ? { unmarkPublished: [a.id] } : { markPublished: [a.id] }),
                                a.published ? "Published mark removed." : "Marked as published."
                              )
                            }
                          >
                            {a.published ? <Undo2 className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                          </Btn>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {canEdit && (
                <div className="mt-2 flex justify-end">
                  {item.status === "CANCELLED" ? (
                    <Btn
                      busy={busy === `status:${item.id}`}
                      onClick={() => run(`status:${item.id}`, () => partyApi.updateCalendar(userId, partyId, item.id, { status: "PLANNED" }), "Campaign post restored.")}
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </Btn>
                  ) : (
                    <Btn
                      variant="danger"
                      busy={busy === `status:${item.id}`}
                      onClick={() => {
                        if (window.confirm("Cancel this campaign post?")) {
                          run(`status:${item.id}`, () => partyApi.updateCalendar(userId, partyId, item.id, { status: "CANCELLED" }), "Campaign post cancelled.");
                        }
                      }}
                    >
                      <Ban className="w-3.5 h-3.5" /> Cancel
                    </Btn>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
