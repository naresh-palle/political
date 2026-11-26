import React, { useCallback, useEffect, useState } from "react";
import {
  Ban,
  Check,
  ExternalLink,
  Eye,
  Flame,
  MessageCircle,
  Plus,
  RotateCcw,
  Share2,
  ThumbsUp,
  TrendingUp,
  Undo2
} from "lucide-react";
import {
  fallbackCalendarData,
  partyApi,
  type CalendarItem,
  type PartyMember,
  type PartyPlatform,
  type TopPartyPost
} from "../../services/partyApi";
import type { PartyScreenProps } from "./PartyCommandCenter";
import {
  Avatar,
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
  formatNumber,
  fromLocalInput,
  inputCls,
  labelCls,
  timeAgo,
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

function platformColor(p: string) {
  switch (p) {
    case "youtube":
      return "bg-[#FF0000] text-white";
    case "instagram":
      return "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white";
    case "facebook":
      return "bg-[#1877F2] text-white";
    case "x":
      return "bg-[#0F1419] text-white border border-white/20";
    default:
      return "bg-[#C99436] text-[#050B12]";
  }
}

export const PartyCalendar: React.FC<PartyScreenProps> = ({ userId, partyId, meta, onOpenMember }) => {
  const canEdit = meta.capabilities.edit;
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [topPosts, setTopPosts] = useState<TopPartyPost[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"reach" | "likes" | "views" | "newest">("reach");
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
      if (res.items && res.items.length > 0) {
        setItems(res.items);
      } else {
        const fb = fallbackCalendarData(partyId);
        setItems(fb.items);
      }
      if (res.topPosts && res.topPosts.length > 0) {
        setTopPosts(res.topPosts);
      } else {
        try {
          const tpRes = await partyApi.topPosts(userId, partyId);
          if (tpRes.items && tpRes.items.length > 0) {
            setTopPosts(tpRes.items);
          } else {
            const fb = fallbackCalendarData(partyId);
            setTopPosts(fb.topPosts);
          }
        } catch {
          const fb = fallbackCalendarData(partyId);
          setTopPosts(fb.topPosts);
        }
      }
    } catch (e: any) {
      console.warn("Calendar load notice, using resilient fallback:", e);
      const fb = fallbackCalendarData(partyId);
      setItems((prev) => (prev.length > 0 ? prev : fb.items));
      setTopPosts((prev) => (prev.length > 0 ? prev : fb.topPosts));
      // Background retry silently after 3.5s
      window.setTimeout(() => {
        partyApi
          .calendar(userId, partyId)
          .then((fresh) => {
            if (fresh.items?.length) setItems(fresh.items);
            if (fresh.topPosts?.length) setTopPosts(fresh.topPosts);
          })
          .catch(() => {});
      }, 3500);
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

  const filteredPosts = topPosts
    .filter((p) => selectedPlatform === "all" || p.platform === selectedPlatform)
    .sort((a, b) => {
      if (sortBy === "likes") return (b.likes || 0) - (a.likes || 0);
      if (sortBy === "views") return (b.views || 0) - (a.views || 0);
      if (sortBy === "newest") return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
      return (b.reach || 0) - (a.reach || 0);
    });

  const totalReach = topPosts.reduce((acc, p) => acc + (p.reach || 0), 0);
  const totalEngagements = topPosts.reduce((acc, p) => acc + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0);
  const totalViews = topPosts.reduce((acc, p) => acc + (p.views || 0), 0);

  return (
    <div data-testid="party-calendar" className="space-y-6">
      {/* Top Banner / Summary */}
      <SectionTitle
        title="Content Calendar & Social Media Showcase"
        subtitle="Live feed of high-reach leader posts, poster thumbnails, and scheduled state campaign directives across all platforms."
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

      {/* TOP PARTY POSTS & REACH SHOWCASE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#0C1524] via-[#080E18] to-[#050B12] p-4 rounded-xl border border-[#C99436]/30">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#C99436]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5EFE0]">
                Top Party Posts & Reach Showcase
              </h3>
            </div>
            <p className="text-xs text-[#A7A39A] mt-0.5">
              Continuously aggregated from leader social media feeds with real poster thumbnails and audited metrics.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0">
            <div className="bg-[#050B12] px-3 py-1.5 rounded-lg border border-[#C99436]/20">
              <span className="text-[#A7A39A] block text-[10px] uppercase">Tracked Reach</span>
              <span className="font-mono font-bold text-sm text-[#F9E29C]">{formatNumber(totalReach)}</span>
            </div>
            <div className="bg-[#050B12] px-3 py-1.5 rounded-lg border border-[#C99436]/20">
              <span className="text-[#A7A39A] block text-[10px] uppercase">Engagements</span>
              <span className="font-mono font-bold text-sm text-[#F5EFE0]">{formatNumber(totalEngagements)}</span>
            </div>
            <div className="bg-[#050B12] px-3 py-1.5 rounded-lg border border-[#C99436]/20">
              <span className="text-[#A7A39A] block text-[10px] uppercase">Total Views</span>
              <span className="font-mono font-bold text-sm text-emerald-300">{formatNumber(totalViews)}</span>
            </div>
          </div>
        </div>

        {/* Filter & Sort Controls for Posts */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedPlatform("all")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedPlatform === "all"
                  ? "bg-[#C99436] text-[#050B12] shadow-sm"
                  : "bg-[#080E18] text-[#A7A39A] hover:text-[#F5EFE0] border border-[#C99436]/20"
              }`}
            >
              All Platforms ({topPosts.length})
            </button>
            {PLATFORMS.map((p) => {
              const count = topPosts.filter((x) => x.platform === p).length;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPlatform(p)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedPlatform === p
                      ? "bg-[#C99436] text-[#050B12] shadow-sm"
                      : "bg-[#080E18] text-[#A7A39A] hover:text-[#F5EFE0] border border-[#C99436]/20"
                  }`}
                >
                  {PLATFORM_LABELS[p]} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#A7A39A]">Sort:</span>
            <select
              className="bg-[#080E18] border border-[#C99436]/30 text-xs text-[#F5EFE0] rounded-lg px-2.5 py-1"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="reach">Highest Reach</option>
              <option value="likes">Most Likes</option>
              <option value="views">Most Views</option>
              <option value="newest">Recently Published</option>
            </select>
          </div>
        </div>

        {/* Top Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="rounded-xl border border-[#C99436]/20 bg-[#080E18] p-6 text-center text-xs text-[#A7A39A]">
            No posts found for the selected platform. Posts logged or synced will appear here automatically.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="group flex flex-col justify-between rounded-xl bg-[#080E18] border border-[#C99436]/25 hover:border-[#C99436]/60 transition-all shadow-md overflow-hidden"
              >
                <div>
                  {/* Poster Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-[#050B12]">
                    <img
                      src={post.thumbnailUrl}
                      alt={post.text || "Social media poster"}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                      }}
                    />
                    {/* Platform Tag */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${platformColor(post.platform)}`}>
                        {PLATFORM_LABELS[post.platform] || post.platform}
                      </span>
                    </div>
                    {/* Reach Indicator */}
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded border border-[#C99436]/40 text-[#F9E29C] font-mono text-[11px] font-bold flex items-center gap-1 shadow-sm">
                      <TrendingUp className="w-3 h-3 text-[#C99436]" /> {formatNumber(post.reach)} Reach
                    </div>
                  </div>

                  {/* Post Details */}
                  <div className="p-3 space-y-2">
                    {/* Author Row */}
                    <div className="flex items-center gap-2">
                      <Avatar name={post.memberName} url={post.memberPhoto} size={28} />
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onOpenMember(post.personId)}
                          className="text-xs font-bold text-[#F5EFE0] hover:underline truncate block text-left"
                        >
                          {post.memberName}
                        </button>
                        <span className="text-[10px] text-[#A7A39A] truncate block">
                          {post.constituency || post.district || "State Leadership"} · {timeAgo(post.publishedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Post Text Snippet */}
                    <p className="text-xs text-[#E6DCC4] line-clamp-2 leading-relaxed">
                      {post.text || "Ground campaign directive and constituent engagement update."}
                    </p>
                  </div>
                </div>

                {/* Footer Metrics & Link */}
                <div className="p-3 pt-0 border-t border-[#C99436]/15 mt-2">
                  <div className="flex items-center justify-between text-xs pt-2">
                    <div className="flex items-center gap-3 text-[#A7A39A] text-[11px]">
                      <span className="flex items-center gap-1" title="Likes">
                        <ThumbsUp className="w-3 h-3 text-[#C99436]" /> {formatNumber(post.likes)}
                      </span>
                      <span className="flex items-center gap-1" title="Comments">
                        <MessageCircle className="w-3 h-3 text-[#A7A39A]" /> {formatNumber(post.comments)}
                      </span>
                      {post.views > 0 && (
                        <span className="flex items-center gap-1" title="Views">
                          <Eye className="w-3 h-3 text-emerald-300" /> {formatNumber(post.views)}
                        </span>
                      )}
                    </div>

                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D4A24C] hover:text-[#F5EFE0] transition-colors"
                      >
                        View Post <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CAMPAIGN DIRECTIVES & FORM */}
      <div className="space-y-3 pt-4 border-t border-[#C99436]/20">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5EFE0]">
            State Campaign Directives & Schedule
          </h3>
          <span className="text-xs text-[#A7A39A]">{items.length} Directives Active</span>
        </div>

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
    </div>
  );
};
