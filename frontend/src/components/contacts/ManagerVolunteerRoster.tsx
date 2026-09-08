import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Users
} from "lucide-react";
import { FieldIssue, UserProfile } from "../../types";
import { politicalApiService } from "../../services/api";
import { kpiBucket } from "../../utils/ticketKpi";

export type VolunteerIdentity = { name: string; phone: string };

function digits(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function volunteerPhone(v: UserProfile, fallback = "") {
  const raw = digits(v.phone || fallback);
  return raw.length >= 10 ? raw.slice(-10) : raw;
}

function waHref(phone: string, name: string) {
  const n = digits(phone);
  if (n.length < 10) return "";
  const text = encodeURIComponent(`Namaste ${name} garu, greetings from Leaders Lens Office.`);
  return `https://wa.me/${n}?text=${text}`;
}

function openAssignTickets(volunteerId: string) {
  const params = new URLSearchParams();
  params.set("status", "ALL");
  params.set("assigned", "1");
  params.set("volunteer", volunteerId);
  window.location.hash = `#/assign-tickets?${params.toString()}`;
}

interface ManagerVolunteerRosterProps {
  currentUser: UserProfile;
  onIdentities?: (identities: VolunteerIdentity[]) => void;
}

const ManagerVolunteerRoster: React.FC<ManagerVolunteerRosterProps> = ({
  currentUser,
  onIdentities
}) => {
  const [volunteers, setVolunteers] = useState<UserProfile[]>([]);
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [allUsers, issueList, dash] = await Promise.all([
          politicalApiService.getUsers(),
          politicalApiService.getFieldIssues({
            userId: currentUser.id,
            directorId: currentUser.id,
            userRole: "DIRECTOR"
          }),
          politicalApiService.getManagerDashboard(currentUser.id).catch(() => null)
        ]);
        if (cancelled) return;
        const vols = allUsers.filter(
          (u) =>
            (u.primaryRole === "VOLUNTEER" || u.roleId === "VOLUNTEER" || u.role === "volunteer") &&
            u.directorId === currentUser.id
        );
        setVolunteers(vols);
        setIssues(issueList as FieldIssue[]);
        setSummaries(dash?.volunteers || []);
      } catch {
        if (!cancelled) {
          setVolunteers([]);
          setIssues([]);
          setSummaries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser.id]);

  useEffect(() => {
    onIdentities?.(
      volunteers.map((v) => ({
        name: v.name,
        phone: volunteerPhone(v)
      }))
    );
  }, [volunteers, onIdentities]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = digits(query);
    return volunteers
      .map((vol) => {
        const summary = summaries.find((s: any) => s.id === vol.id);
        const volIssues = issues.filter((i) => i.assignedVolunteerId === vol.id);
        const assignedCount = summary?.assignedTickets ?? volIssues.length;
        const pendingCount =
          summary?.pendingTickets ??
          volIssues.filter((i) => kpiBucket(i) === "OPEN_UNASSIGNED" || kpiBucket(i) === "ASSIGNED").length;
        const overdueCount = summary?.overdueTickets ?? volIssues.filter((i) => i.status === "OVERDUE").length;
        const doneCount =
          summary?.completedTickets ??
          volIssues.filter((i) => ["COMPLETED", "RESOLVED"].includes(String(i.status))).length;
        const phone = volunteerPhone(vol, summary?.phone || "");
        const email = summary?.email || vol.email || "";
        const area = summary?.area || vol.assignedMandalName || vol.assignedConstituency || "";
        const villages = (summary?.villages || vol.assignedVillageNames || []).filter(Boolean) as string[];
        return {
          vol,
          assignedCount,
          pendingCount,
          overdueCount,
          doneCount,
          phone,
          email,
          area,
          villages
        };
      })
      .filter(({ vol, phone, email, area, villages }) => {
        if (!q && !qDigits) return true;
        const hay = [vol.name, email, area, ...villages, vol.designation, vol.roleTitle]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (q && hay.includes(q)) return true;
        if (qDigits && phone.includes(qDigits)) return true;
        return false;
      });
  }, [volunteers, issues, summaries, query]);

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-lg text-[#F5EFE0] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4A24C]" />
            My Volunteers
          </h2>
          <p className="text-xs text-[#CBD5E1] mt-0.5">
            {loading
              ? "Loading roster…"
              : `${rows.length} volunteer${rows.length === 1 ? "" : "s"} reporting to you`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9CAE]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search volunteers…"
              className="w-full bg-[#0B131E] border border-[#223348] focus:border-[#D4A24C] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#F5EFE0] placeholder-[#5F6875] outline-none"
            />
          </div>
          <div className="flex items-center p-1 rounded-xl bg-[#0B131E] border border-[#223348] text-xs self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "GRID" ? "bg-[#D4A24C] text-[#0B131E] font-bold shadow-sm" : "text-[#CBD5E1]"
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("TABLE")}
              className={`p-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "TABLE" ? "bg-[#D4A24C] text-[#0B131E] font-bold shadow-sm" : "text-[#CBD5E1]"
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-6 rounded-xl border border-[#223348] bg-[#0E1724] text-sm text-[#8E9CAE]">
          Loading volunteers…
        </div>
      ) : rows.length === 0 ? (
        <div className="p-6 rounded-xl border border-[#223348] bg-[#0E1724] text-sm text-[#8E9CAE]">
          {query.trim() ? "No volunteers match this search." : "No volunteers are assigned to this manager."}
        </div>
      ) : viewMode === "GRID" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 items-stretch">
          {rows.map(({ vol, assignedCount, pendingCount, overdueCount, doneCount, phone, email, area, villages }) => {
            const wa = waHref(phone, vol.name);
            const tel = phone ? `tel:+91${phone.slice(-10)}` : "";
            return (
              <article
                key={vol.id}
                role="button"
                tabIndex={0}
                onClick={() => openAssignTickets(vol.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openAssignTickets(vol.id);
                }}
                className="h-full p-3 rounded-xl bg-[#0E1724]/90 border border-[#223348] hover:border-[#D4A24C]/60 transition-all shadow-md backdrop-blur-xl flex flex-col justify-between space-y-2 cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold text-[#F5EFE0] whitespace-normal break-words">
                        {vol.name}
                      </h3>
                      <p className="text-xs text-[#CBD5E1] whitespace-normal break-words">
                        {vol.designation || vol.roleTitle || "Field Volunteer"}
                      </p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-bold uppercase">
                      {vol.status || "ACTIVE"}
                    </span>
                  </div>
                  <div className="pt-2 space-y-1 text-xs text-[#8E9CAE]">
                    <div className="flex items-start gap-1.5 text-[#CBD5E1]">
                      <Building2 className="w-3.5 h-3.5 text-[#D4A24C] shrink-0 mt-0.5" />
                      <span className="whitespace-normal break-words">{area || "—"}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[#CBD5E1]">
                      <MapPin className="w-3.5 h-3.5 text-[#D4A24C] shrink-0 mt-0.5" />
                      <span className="whitespace-normal break-words">{villages.length ? villages.join(", ") : "—"}</span>
                    </div>
                    <a
                      href={email ? `mailto:${email}` : undefined}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-start gap-1.5 text-[#CBD5E1] hover:text-[#D4A24C]"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#D4A24C] shrink-0 mt-0.5" />
                      <span className="whitespace-normal break-words">{email || "—"}</span>
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 pt-2 border-t border-[#223348]/60 text-center text-[10px]">
                  <div className="p-1 rounded bg-[#0B131E]/80">
                    <span className="text-[#8E9CAE] block font-semibold">Assigned</span>
                    <strong className="text-[#F5EFE0]">{assignedCount}</strong>
                  </div>
                  <div className="p-1 rounded bg-[#0B131E]/80">
                    <span className="text-amber-300 block font-semibold">Pending</span>
                    <strong className="text-amber-200">{pendingCount}</strong>
                  </div>
                  <div className="p-1 rounded bg-[#0B131E]/80">
                    <span className="text-rose-300 block font-semibold">Overdue</span>
                    <strong className={overdueCount > 0 ? "text-rose-400" : "text-[#8E9CAE]"}>{overdueCount}</strong>
                  </div>
                  <div className="p-1 rounded bg-[#0B131E]/80">
                    <span className="text-emerald-300 block font-semibold">Done</span>
                    <strong className="text-emerald-400">{doneCount}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#223348]/70 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {phone ? (
                    <>
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                          title="Send WhatsApp Message"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      ) : null}
                      <a
                        href={tel}
                        className="p-2 rounded-xl bg-[#131E2D] hover:bg-[#1E3048] border border-[#223348] text-[#D4A24C] text-xs font-semibold flex items-center gap-1.5 transition-all"
                        title="Direct Phone Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="font-mono">+91 {phone.slice(-10)}</span>
                      </a>
                    </>
                  ) : (
                    <span className="text-[11px] text-[#8E9CAE]">No phone on file</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-[#0E1724]/90 border border-[#223348] shadow-lg">
          <table className="min-w-[980px] w-full text-left text-xs text-[#CBD5E1]">
            <thead className="bg-[#0B131E] text-[#8E9CAE] uppercase font-semibold border-b border-[#223348] text-[10.5px]">
              <tr>
                <th className="p-3.5">Volunteer</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Area</th>
                <th className="p-3.5">Villages</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5 text-center">Assigned</th>
                <th className="p-3.5 text-center">Pending</th>
                <th className="p-3.5 text-center">Overdue</th>
                <th className="p-3.5 text-center">Done</th>
                <th className="p-3.5">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#223348]/60">
              {rows.map(({ vol, assignedCount, pendingCount, overdueCount, doneCount, phone, email, area, villages }) => {
                const wa = waHref(phone, vol.name);
                const tel = phone ? `tel:+91${phone.slice(-10)}` : "";
                return (
                  <tr
                    key={vol.id}
                    className="hover:bg-[#131E2D]/60 transition-colors cursor-pointer"
                    onClick={() => openAssignTickets(vol.id)}
                  >
                    <td className="p-3.5">
                      <strong className="text-[#F5EFE0] block font-semibold whitespace-normal break-words">{vol.name}</strong>
                      <span className="text-[11px] text-[#8E9CAE] block whitespace-normal break-words">
                        {vol.designation || vol.roleTitle || "Field Volunteer"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-bold uppercase">
                        {vol.status || "ACTIVE"}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-normal break-words text-[#F5EFE0]">{area || "—"}</td>
                    <td className="p-3.5 whitespace-normal break-words">{villages.length ? villages.join(", ") : "—"}</td>
                    <td className="p-3.5 whitespace-normal break-words">{email || "—"}</td>
                    <td className="p-3.5 font-mono whitespace-normal break-words">{phone ? `+91 ${phone.slice(-10)}` : "—"}</td>
                    <td className="p-3.5 text-center font-bold text-[#F5EFE0]">{assignedCount}</td>
                    <td className="p-3.5 text-center font-bold text-amber-200">{pendingCount}</td>
                    <td className="p-3.5 text-center font-bold text-rose-300">{overdueCount}</td>
                    <td className="p-3.5 text-center font-bold text-emerald-400">{doneCount}</td>
                    <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {wa ? (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        ) : null}
                        {tel ? (
                          <a
                            href={tel}
                            className="p-2 rounded-xl bg-[#131E2D] hover:bg-[#1E3048] border border-[#223348] text-[#D4A24C] text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Call
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ManagerVolunteerRoster;
