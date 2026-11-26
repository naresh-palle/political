import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { partyApi, type CalendarItem, type MemberDetail, type PartyPlatform } from "../../services/partyApi";
import { usePartyRefresh, type PartyScreenProps } from "./PartyCommandCenter";
import { PendingRow } from "./PartyPending";
import {
  Avatar,
  Btn,
  Card,
  CompletenessBar,
  CompletenessRing,
  Empty,
  ErrorBanner,
  GAP_LABELS,
  Loading,
  Notice,
  PLATFORMS,
  PLATFORM_LABELS,
  Segmented,
  formatDate,
  formatNumber,
  fromLocalInput,
  inputCls,
  labelCls,
  platformStatusLabel,
  platformTone,
  timeAgo,
  toLocalInput,
  roleText
} from "./partyUi";

interface Props extends PartyScreenProps {
  personId: string;
  onBack: () => void;
}

type ProfileTab = "details" | "research" | "posts" | "pending" | "missing" | "history";

const ACTION_LABELS: Record<string, string> = {
  PARTY_CONTACT_VIEW: "Viewed contact details",
  PARTY_CONTACT_UPDATE: "Updated contact details",
  PARTY_RESEARCH_ADD: "Added research note",
  PARTY_RESEARCH_DELETE: "Deleted research note",
  PARTY_POST_ADD: "Logged a post",
  PARTY_POST_DELETE: "Deleted a post",
  PARTY_PENDING_UPDATE: "Updated pending item",
  PARTY_CALENDAR_ADD: "Created campaign item",
  PARTY_CALENDAR_UPDATE: "Updated campaign item",
  PARTY_GAP_RULES_UPDATE: "Changed gap rules",
  PARTY_MEMBERS_EXPORT: "Exported members",
  PARTY_GAPS_EXPORT: "Exported gaps report",
  PARTY_ADMIN_CREATE: "Created party account",
  PARTY_ADMIN_UPDATE: "Updated party account",
  PARTY_REMIND: "Sent a reminder",
  PARTY_POSTS_FETCH: "Fetched latest posts"
};

export const actionLabel = (action: string) => ACTION_LABELS[action] || action.replace(/_/g, " ").toLowerCase();

const splitList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean);

export const PartyMemberProfile: React.FC<Props> = ({ userId, partyId, meta, refreshTick, personId, onBack }) => {
  const caps = meta.capabilities;
  const refresh = usePartyRefresh();
  const [data, setData] = useState<MemberDetail | null>(null);
  const [calendar, setCalendar] = useState<CalendarItem[]>([]);
  const [tab, setTab] = useState<ProfileTab>("details");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const [contact, setContact] = useState({ email: "", phone: "", alternateContact: "", address: "", photoUrl: "", consent: false });
  const [note, setNote] = useState({ title: "", body: "", tags: "", sources: "", attachments: "" });
  const [postFilter, setPostFilter] = useState<string>("all");
  const [post, setPost] = useState({
    platform: "facebook" as PartyPlatform,
    url: "",
    thumbnailUrl: "",
    publishedAt: toLocalInput(),
    text: "",
    likes: "",
    comments: "",
    shares: "",
    views: "",
    calendarId: ""
  });

  const applyContact = (res: { details: { email?: string; phone?: string; alternateContact?: string; address?: string; photoUrl?: string; consent?: boolean } }) => {
    setContact({
      email: res.details.email || "",
      phone: res.details.phone || "",
      alternateContact: res.details.alternateContact || "",
      address: res.details.address || "",
      photoUrl: res.details.photoUrl || "",
      consent: !!res.details.consent
    });
  };

  const load = useCallback(async (syncForm: boolean) => {
    setError("");
    try {
      const res = await partyApi.member(userId, partyId, personId);
      setData(res);
      if (syncForm) applyContact(res);
    } catch (e: any) {
      setError(e?.message || "Could not load this member.");
    }
  }, [userId, partyId, personId]);

  useEffect(() => {
    load(true);
    partyApi
      .calendar(userId, partyId)
      .then((c) => setCalendar(c.items.filter((i) => i.status !== "CANCELLED")))
      .catch(() => setCalendar([]));
  }, [load, userId, partyId]);

  useEffect(() => {
    if (refreshTick) load(false);
  }, [refreshTick, load]);

  const run = async (key: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await fn();
      await load(true);
      setNotice(success);
      return true;
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      return false;
    } finally {
      setBusy("");
    }
  };

  if (!data) {
    return (
      <div>
        <Btn onClick={onBack} className="mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Btn>
        <ErrorBanner message={error} onRetry={() => load(true)} />
        {!error && <Loading label="Loading member…" />}
      </div>
    );
  }

  const m = data.member;
  const posts = data.posts.filter((p) => postFilter === "all" || p.platform === postFilter);
  const tabs = [
    { id: "details", label: "Details" },
    { id: "research", label: "Research", count: data.research.length },
    { id: "posts", label: "Posts", count: data.posts.length },
    { id: "pending", label: "Pending", count: data.pending.filter((p) => p.status !== "DONE").length },
    { id: "missing", label: "Missing", count: data.missing.length },
    { id: "history", label: "History" }
  ];

  return (
    <div data-testid="member-profile">
      <Btn onClick={onBack} className="mb-3" data-testid="member-back">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Btn>

      <Card className="mb-3">
        <div className="flex flex-wrap items-start gap-3">
          <Avatar name={m.name} url={m.photoUrl} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl text-[#F9E29C] break-words">{m.name}</h2>
              {m.roles[0] && (
                <span className="rounded-full border border-[#C99436]/50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F9E29C]">
                  {roleText([m.roles[0]])}
                </span>
              )}
            </div>
            <div className="text-xs text-[#D4A24C]">{roleText(m.roles) || "—"}</div>
            <div className="text-xs text-[#B9AF95]">
              {m.assemblyConstituencyName || "—"}
              {m.districtName ? ` · ${m.districtName}` : ""} · Record {m.verificationStatus.toLowerCase()}
            </div>
          </div>
          <CompletenessRing value={m.completeness} />
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PLATFORMS.map((p) => {
            const s = m.platforms[p] || { status: "MISSING", followers: null, profileUrl: null };
            return (
              <div key={p} className={`rounded-xl border px-2 py-2 ${platformTone(s.status)}`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold">{PLATFORM_LABELS[p]}</span>
                  {s.profileUrl && (
                    <a href={s.profileUrl} target="_blank" rel="noreferrer" aria-label={`Open ${PLATFORM_LABELS[p]} profile`}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="text-[11px]">{platformStatusLabel(s.status)}</div>
                <div className="text-[11px] text-[#F5EFE0]">{formatNumber(s.followers)} followers</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="rounded-lg bg-[#050B12] py-2">
            <div className="text-sm font-bold text-[#F9E29C]">{formatNumber(m.followersTotal)}</div>
            <div className="text-[9px] uppercase text-[#8A8E9B]">Followers</div>
          </div>
          <div className="rounded-lg bg-[#050B12] py-2">
            <div className="text-sm font-bold text-[#F9E29C]">
              {m.postsThisWeek}
              {m.postsEstimated ? "*" : ""}
            </div>
            <div className="text-[9px] uppercase text-[#8A8E9B]">Posts / week</div>
          </div>
          <div className="rounded-lg bg-[#050B12] py-2">
            <div className="text-sm font-bold text-[#F9E29C]">{m.engagementPercent === null ? "—" : `${m.engagementPercent}%`}</div>
            <div className="text-[9px] uppercase text-[#8A8E9B]">Engagement</div>
          </div>
          <div className="rounded-lg bg-[#050B12] py-2">
            <div className="text-sm font-bold text-[#F9E29C]">{timeAgo(m.lastPostAt)}</div>
            <div className="text-[9px] uppercase text-[#8A8E9B]">Last post</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-[9px] uppercase text-[#8A8E9B] mb-0.5">Profile completeness</div>
          <CompletenessBar value={m.completeness} />
        </div>
      </Card>

      <div className="mb-3">
        <Segmented testId="member-tabs" options={tabs} value={tab} onChange={(id) => setTab(id as ProfileTab)} />
      </div>
      <ErrorBanner message={error} />
      <Notice message={notice} />

      {tab === "details" && (
        <Card testId="member-details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                ["email", "Email", "email"],
                ["phone", "Phone", "tel"],
                ["alternateContact", "Alternate contact", "text"],
                ["photoUrl", "Photo link", "url"]
              ] as const
            ).map(([key, label, type]) => (
              <div key={key}>
                <label className={labelCls} htmlFor={`contact-${key}`}>{label}</label>
                <input
                  id={`contact-${key}`}
                  type={type}
                  className={inputCls}
                  value={contact[key]}
                  readOnly={!caps.edit}
                  onChange={(e) => setContact({ ...contact, [key]: e.target.value })}
                  placeholder={caps.edit ? label : "—"}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="contact-address">Address</label>
              <textarea
                id="contact-address"
                rows={2}
                className={inputCls}
                value={contact.address}
                readOnly={!caps.edit}
                onChange={(e) => setContact({ ...contact, address: e.target.value })}
              />
            </div>
          </div>
          <label className="mt-3 flex items-start gap-2 text-xs text-[#F5EFE0]">
            <input
              type="checkbox"
              checked={contact.consent}
              disabled={!caps.edit}
              onChange={(e) => setContact({ ...contact, consent: e.target.checked })}
              className="mt-0.5 accent-[#C99436]"
            />
            <span>
              Member agreed that the party can store and use these contact details
              {data.details.consentAt && <span className="text-[#B9AF95]"> · since {formatDate(data.details.consentAt)}</span>}
            </span>
          </label>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-[#8A8E9B]">
              {data.details.updatedAt ? `Last edited ${formatDate(data.details.updatedAt, true)} by ${data.details.updatedByName || "—"}` : "Not edited yet"}
            </span>
            {caps.edit && (
              <Btn
                variant="gold"
                busy={busy === "contact"}
                data-testid="contact-save"
                onClick={() => run("contact", () => partyApi.saveContact(userId, partyId, personId, contact), "Contact details saved.")}
              >
                <Save className="w-3.5 h-3.5" /> Save details
              </Btn>
            )}
          </div>
          {data.details.remarks && <p className="mt-3 text-xs text-[#B9AF95]">Remarks: {data.details.remarks}</p>}
        </Card>
      )}

      {tab === "research" && (
        <div className="space-y-3" data-testid="member-research">
          {caps.research && (
            <Card>
              <h3 className="text-sm font-bold text-[#F9E29C] mb-2">Add research note</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="note-title">Title</label>
                  <input id="note-title" className={inputCls} value={note.title} onChange={(e) => setNote({ ...note, title: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="note-body">Note</label>
                  <textarea id="note-body" rows={4} className={inputCls} value={note.body} onChange={(e) => setNote({ ...note, body: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="note-tags">Tags (comma separated)</label>
                  <input id="note-tags" className={inputCls} value={note.tags} onChange={(e) => setNote({ ...note, tags: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="note-sources">Source links (one per line)</label>
                  <textarea id="note-sources" rows={2} className={inputCls} value={note.sources} onChange={(e) => setNote({ ...note, sources: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="note-attachments">Attachment links (one per line)</label>
                  <textarea
                    id="note-attachments"
                    rows={2}
                    className={inputCls}
                    value={note.attachments}
                    onChange={(e) => setNote({ ...note, attachments: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Btn
                  variant="gold"
                  busy={busy === "note"}
                  data-testid="note-add"
                  onClick={async () => {
                    const ok = await run(
                      "note",
                      () =>
                        partyApi.addResearch(userId, partyId, personId, {
                          title: note.title,
                          body: note.body,
                          tags: splitList(note.tags),
                          sources: splitList(note.sources),
                          attachments: splitList(note.attachments).map((url) => ({ url }))
                        }),
                      "Research note added."
                    );
                    if (ok) setNote({ title: "", body: "", tags: "", sources: "", attachments: "" });
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add note
                </Btn>
              </div>
            </Card>
          )}
          {data.research.length === 0 ? (
            <Empty message="No research notes yet." />
          ) : (
            data.research.map((n) => (
              <Card key={n.id} testId="research-note">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#F5EFE0] break-words">{n.title}</h4>
                    <p className="text-[11px] text-[#8A8E9B]">
                      {n.authorName} · {formatDate(n.createdAt, true)}
                    </p>
                  </div>
                  {(caps.edit || n.authorId === userId) && (
                    <Btn
                      variant="danger"
                      busy={busy === `note:${n.id}`}
                      onClick={() => {
                        if (window.confirm("Delete this research note?")) {
                          run(`note:${n.id}`, () => partyApi.deleteResearch(userId, partyId, n.id), "Research note deleted.");
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Btn>
                  )}
                </div>
                <p className="mt-2 text-xs text-[#E6DCC4] whitespace-pre-wrap break-words">{n.body}</p>
                {n.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {n.tags.map((t) => (
                      <span key={t} className="rounded-full border border-[#C99436]/40 px-2 py-0.5 text-[10px] text-[#F9E29C]">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {[...n.sources.map((url) => ({ url, name: url })), ...n.attachments].length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {[...n.sources.map((url) => ({ url, name: url })), ...n.attachments].map((link, i) => (
                      <li key={`${link.url}-${i}`}>
                        <a href={link.url} target="_blank" rel="noreferrer" className="text-[11px] text-[#D4A24C] underline break-all">
                          {link.name || link.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "posts" && (
        <div className="space-y-3" data-testid="member-posts">
          {caps.edit && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[#B9AF95]">Latest posts are fetched from the accounts saved by SM A. YouTube works now. Instagram, X and Facebook start when a RapidAPI key is on the server.</p>
              <Btn variant="gold" data-testid="fetch-member-posts" onClick={() => refresh?.start({ personId, force: true })}>
                Fetch this member
              </Btn>
            </div>
          )}
          {caps.edit && (
            <Card>
              <h3 className="text-sm font-bold text-[#F9E29C] mb-2">Log a post</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls} htmlFor="post-platform">Platform</label>
                  <select
                    id="post-platform"
                    className={inputCls}
                    value={post.platform}
                    onChange={(e) => setPost({ ...post, platform: e.target.value as PartyPlatform })}
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1 lg:col-span-2">
                  <label className={labelCls} htmlFor="post-url">Post link</label>
                  <input id="post-url" className={inputCls} placeholder="https://" value={post.url} onChange={(e) => setPost({ ...post, url: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="post-date">Published</label>
                  <input
                    id="post-date"
                    type="datetime-local"
                    className={inputCls}
                    value={post.publishedAt}
                    onChange={(e) => setPost({ ...post, publishedAt: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className={labelCls} htmlFor="post-text">Caption / summary</label>
                  <input id="post-text" className={inputCls} value={post.text} onChange={(e) => setPost({ ...post, text: e.target.value })} />
                </div>
                {(["likes", "comments", "shares", "views"] as const).map((k) => (
                  <div key={k}>
                    <label className={labelCls} htmlFor={`post-${k}`}>{k[0].toUpperCase() + k.slice(1)}</label>
                    <input
                      id={`post-${k}`}
                      type="number"
                      min={0}
                      className={inputCls}
                      value={post[k]}
                      onChange={(e) => setPost({ ...post, [k]: e.target.value })}
                    />
                  </div>
                ))}
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className={labelCls} htmlFor="post-thumb">Poster / Media URL (optional)</label>
                  <input
                    id="post-thumb"
                    type="url"
                    className={inputCls}
                    placeholder="https://… (link to post poster, graphic, or photo)"
                    value={post.thumbnailUrl}
                    onChange={(e) => setPost({ ...post, thumbnailUrl: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className={labelCls} htmlFor="post-calendar">Campaign item (optional)</label>
                  <select id="post-calendar" className={inputCls} value={post.calendarId} onChange={(e) => setPost({ ...post, calendarId: e.target.value })}>
                    <option value="">Not part of a campaign</option>
                    {calendar.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} · due {formatDate(c.dueAt)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Btn
                  variant="gold"
                  busy={busy === "post"}
                  data-testid="post-add"
                  onClick={async () => {
                    const num = (v: string) => (v === "" ? null : Number(v));
                    const ok = await run(
                      "post",
                      () =>
                        partyApi.addPost(userId, partyId, personId, {
                          platform: post.platform,
                          url: post.url.trim(),
                          thumbnailUrl: post.thumbnailUrl.trim() || undefined,
                          publishedAt: fromLocalInput(post.publishedAt),
                          text: post.text,
                          likes: num(post.likes),
                          comments: num(post.comments),
                          shares: num(post.shares),
                          views: num(post.views),
                          calendarId: post.calendarId || null
                        }),
                      "Post logged."
                    );
                    if (ok) setPost({ ...post, url: "", thumbnailUrl: "", text: "", likes: "", comments: "", shares: "", views: "", calendarId: "", publishedAt: toLocalInput() });
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Log post
                </Btn>
              </div>
            </Card>
          )}
          <Segmented
            options={[{ id: "all", label: "All" }, ...PLATFORMS.map((p) => ({ id: p, label: PLATFORM_LABELS[p], count: data.posts.filter((x) => x.platform === p).length }))]}
            value={postFilter}
            onChange={setPostFilter}
          />
          {posts.length === 0 ? (
            <Empty message="No posts logged for this member yet." />
          ) : (
            posts.map((p) => {
              const fallbackPoster = (
                <div className="w-28 sm:w-36 h-20 sm:h-24 rounded-lg border border-[#C99436]/40 bg-gradient-to-br from-[#0C1524] via-[#050B12] to-[#080E18] flex flex-col items-center justify-center p-2 text-center shrink-0 shadow-sm">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#C99436] font-mono">Campaign Poster</span>
                  <span className="text-[10px] text-[#F5EFE0] font-bold line-clamp-2 mt-0.5">{p.text ? p.text.slice(0, 36) : PLATFORM_LABELS[p.platform]}</span>
                  <span className="text-[9px] text-[#A7A39A] mt-0.5">{formatDate(p.publishedAt)}</span>
                </div>
              );

              return (
                <Card key={p.id} testId="post-row">
                  <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-3.5">
                    <a href={p.url} target="_blank" rel="noreferrer" className="shrink-0 hover:opacity-90 transition-opacity">
                      {p.thumbnailUrl ? (
                        <img
                          src={p.thumbnailUrl}
                          alt="Social Media Poster"
                          className="w-28 sm:w-36 h-20 sm:h-24 rounded-lg object-cover border border-[#C99436]/40 bg-[#050B12] shadow-sm"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div style={{ display: p.thumbnailUrl ? "none" : "flex" }}>
                        {fallbackPoster}
                      </div>
                    </a>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#F9E29C] flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-[#C99436]/15 border border-[#C99436]/30 text-[10px]">
                          {PLATFORM_LABELS[p.platform]}
                        </span>
                        <span>·</span>
                        <span>{formatDate(p.publishedAt, true)}</span>
                      </div>
                      {p.text && <p className="mt-1.5 text-xs text-[#E6DCC4] break-words line-clamp-3 font-medium">{p.text}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F9E29C] hover:underline">
                          <ExternalLink className="w-3 h-3 shrink-0" /> Open post →
                        </a>
                      </div>
                    </div>
                    {caps.edit && (
                      <Btn
                        variant="danger"
                        busy={busy === `post:${p.id}`}
                        onClick={() => {
                          if (window.confirm("Delete this post record?")) {
                            run(`post:${p.id}`, () => partyApi.deletePost(userId, partyId, p.id), "Post deleted.");
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </Btn>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center pt-2 border-t border-[rgba(201,148,54,0.15)]">
                    {(["likes", "comments", "shares", "views"] as const).map((k) => (
                      <div key={k} className="rounded-lg bg-[#050B12] py-1 border border-[rgba(201,148,54,0.15)]">
                        <div className="text-xs font-bold text-[#F5EFE0] font-mono">{formatNumber(p[k] ?? null)}</div>
                        <div className="text-[9px] uppercase font-semibold text-[#8A8E9B]">{k}</div>
                      </div>
                    ))}
                  </div>
                  {p.calendarId && (
                    <p className="mt-2 text-[10px] text-[#B9AF95] font-medium">
                      Campaign: {calendar.find((c) => c.id === p.calendarId)?.title || p.calendarId}
                    </p>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {tab === "pending" && (
        <div className="space-y-2" data-testid="member-pending">
          {data.pending.length === 0 ? (
            <Empty message="Nothing pending for this member." />
          ) : (
            data.pending.map((item) => (
              <PendingRow key={item.id} item={item} userId={userId} partyId={partyId} canEdit={caps.edit} onChanged={() => load(true)} showMember={false} />
            ))
          )}
        </div>
      )}

      {tab === "missing" && (
        <div className="space-y-2" data-testid="member-missing">
          {data.missing.length === 0 ? (
            <Empty message="Nothing missing. This member meets every rule." />
          ) : (
            data.missing.map((g) => (
              <Card key={g.type}>
                <div className="text-xs font-bold text-rose-200">{GAP_LABELS[g.type] || g.type}</div>
                <div className="text-xs text-[#E6DCC4] mt-0.5">{g.detail}</div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "history" && (
        <Card testId="member-history">
          {data.history.length === 0 ? (
            <Empty message="No history yet." />
          ) : (
            <ul className="divide-y divide-[#C99436]/15">
              {data.history.map((h) => (
                <li key={h.id} className="py-2 flex flex-wrap justify-between gap-1 text-xs">
                  <span className="text-[#F5EFE0]">
                    {actionLabel(h.action)} <span className="text-[#B9AF95]">by {h.actorName}</span>
                  </span>
                  <span className="text-[#8A8E9B]">{formatDate(h.timestamp, true)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
};
