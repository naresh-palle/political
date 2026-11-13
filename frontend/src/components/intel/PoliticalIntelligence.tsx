import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Database,
  Download,
  Loader2,
  MapPin
} from "lucide-react";
import { UserProfile, PiDashboard, PiDistrictProgress, PiRecentCollection, StateInfo, PoliticalParty, ParliamentInfo } from "../../types";
import { politicalApiService } from "../../services/api";
import { UNIQUE_TICKET_SURFACE } from "../../utils/ticketKpi";

type Tab = "dashboard" | "constituencies" | "verify" | "import" | "intelligence";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Data Entry Dashboard" },
  { id: "constituencies", label: "Constituencies" },
  { id: "verify", label: "Verification Queue" },
  { id: "import", label: "Import / Export" },
  { id: "intelligence", label: "Intelligence" }
];

const ROLES = [
  "MLA",
  "LOK_SABHA_MP",
  "RAJYA_SABHA_MP",
  "MLC",
  "MINISTER",
  "CHIEF_MINISTER",
  "DEPUTY_CHIEF_MINISTER",
  "CABINET_MINISTER",
  "MINISTER_OF_STATE",
  "FORMER_MLA",
  "FORMER_MP",
  "FORMER_MLC",
  "PROSPECTIVE_CANDIDATE",
  "PARTY_LEADER",
  "PARTY_PRESIDENT",
  "OTHER"
];

const PLATFORMS = ["facebook", "instagram", "x", "youtube"] as const;
const STATUSES = ["PENDING", "VERIFIED", "NEEDS_RECHECK", "REJECTED", "NO_ACCOUNT", "INACTIVE"];

const CARD = `rounded-xl p-3 border ${UNIQUE_TICKET_SURFACE.kpi}`;
const INPUT =
  "w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] rounded-xl px-3 py-2 text-sm text-[#F5EFE0] outline-none";
const LABEL = "block text-[10px] uppercase tracking-wider font-bold text-[#D4A24C] mb-1";
const BTN =
  "px-4 py-2 rounded-xl bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#071322] text-xs font-bold uppercase tracking-wider disabled:opacity-50";

function statusTone(status?: string) {
  if (status === "VERIFIED") return "text-emerald-300 border-emerald-500/40 bg-emerald-950/40";
  if (status === "NEEDS_RECHECK") return "text-amber-300 border-amber-500/40 bg-amber-950/40";
  if (status === "REJECTED") return "text-rose-300 border-rose-500/40 bg-rose-950/40";
  if (status === "NO_ACCOUNT" || status === "INACTIVE") return "text-[#B9AF95] border-[#22405E] bg-[#071322]";
  return "text-[#D4A24C] border-[#D4A24C]/40 bg-[#071322]";
}

export const PoliticalIntelligence: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  const userId = currentUser.id;
  const isSuper =
    currentUser.email === "admin@leaderslens.ai" ||
    currentUser.primaryRole === "SUPER_ADMIN" ||
    !!currentUser.isPlatformAdmin;
  const canVerify =
    isSuper ||
    currentUser.primaryRole === "POLITICAL_ADMIN" ||
    currentUser.primaryRole === "DIRECTOR" ||
    currentUser.roleId === "CAMPAIGN_MANAGER";

  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [dashboard, setDashboard] = useState<PiDashboard | null>(null);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [parties, setParties] = useState<PoliticalParty[]>([]);
  const [parliaments, setParliaments] = useState<ParliamentInfo[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [stateId, setStateId] = useState((currentUser.stateId && currentUser.stateId.length <= 5) ? currentUser.stateId : "AP");
  const [districtId, setDistrictId] = useState("");
  const [pcId, setPcId] = useState("");
  const [acId, setAcId] = useState("");
  const [constForm, setConstForm] = useState<any>({});
  const [constRows, setConstRows] = useState<any[]>([]);
  const [leaderForm, setLeaderForm] = useState<any>({ politicalRole: "MLA", currentFormerStatus: "CURRENT", partyId: "TDP" });
  const [leaders, setLeaders] = useState<any[]>([]);
  const [socialForm, setSocialForm] = useState<any>({ platform: "facebook", verificationStatus: "PENDING" });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [queueStatus, setQueueStatus] = useState("PENDING");
  const [intel, setIntel] = useState<any>(null);
  const [intelPlatform, setIntelPlatform] = useState("");
  const [intelParty, setIntelParty] = useState("");
  const [rankBy, setRankBy] = useState("followers");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [districtDetail, setDistrictDetail] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [snapshotAccount, setSnapshotAccount] = useState("");
  const leadersSectionRef = useRef<HTMLDivElement>(null);
  const socialSectionRef = useRef<HTMLDivElement>(null);
  const districtsSectionRef = useRef<HTMLDivElement>(null);

  const partyById = useMemo(() => Object.fromEntries(parties.map((p) => [p.id, p])), [parties]);
  const selectedDistrictProgress = useMemo(() => {
    const rows = dashboard?.districts || [];
    if (!districtId) return null;
    return rows.find((d: PiDistrictProgress) => d.id === districtId) || null;
  }, [dashboard, districtId]);

  const flash = (msg: string, isError = false) => {
    setOk(isError ? "" : msg);
    setError(isError ? msg : "");
  };

  const loadMasters = async () => {
    const [st, pt] = await Promise.all([
      politicalApiService.getStates(),
      politicalApiService.getPoliticalParties()
    ]);
    setStates(st || []);
    setParties((pt as PoliticalParty[]) || []);
  };

  const refreshDashboard = async () => {
    setLoading(true);
    try {
      const data = await politicalApiService.getPiDashboard(userId, stateId, districtId || undefined);
      setDashboard(data);
    } catch (e: any) {
      flash(e.message || "Could not load dashboard", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasters().catch(() => {});
    refreshDashboard().catch(() => {});
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [pcs, acs, dist] = await Promise.all([
        politicalApiService.getParliamentsByState(stateId).catch(() => []),
        politicalApiService.getAssemblies(stateId).catch(() => []),
        politicalApiService.getDistrictsByState(stateId, userId).catch(() => [])
      ]);
      if (cancelled) return;
      const parliamentRows = (pcs as ParliamentInfo[]) || [];
      const assemblyRows = Array.isArray(acs) ? acs : [];
      const districtRows = [...(Array.isArray(dist) ? dist : [])].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
      setParliaments(parliamentRows);
      setAssemblies(assemblyRows);
      setDistricts(districtRows);
    })().catch(() => {
      if (!cancelled) {
        setParliaments([]);
        setAssemblies([]);
        setDistricts([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [stateId, userId]);

  const filteredPcs = useMemo(() => {
    if (!districtId) return [];
    const inState = parliaments.filter((p) => !p.stateId || String(p.stateId).toUpperCase() === String(stateId).toUpperCase());
    const district = districts.find((d) => d.id === districtId);
    const pcIds = new Set<string>(district?.parliamentConstituencyIds || []);
    if (!pcIds.size) {
      const acIds = new Set(district?.assemblyConstituencyIds || []);
      assemblies.forEach((a) => {
        if (acIds.has(a.id) && (a.parliamentConstituencyId || a.parliamentId)) {
          pcIds.add(a.parliamentConstituencyId || a.parliamentId);
        }
      });
    }
    if (!pcIds.size) return [];
    return inState.filter((p) => pcIds.has(p.id));
  }, [assemblies, districts, districtId, parliaments, stateId]);

  const filteredAcs = useMemo(() => {
    if (!districtId) return [];
    const district = districts.find((d) => d.id === districtId);
    const acIds = new Set(district?.assemblyConstituencyIds || []);
    let rows = acIds.size ? assemblies.filter((a) => acIds.has(a.id)) : [];
    if (pcId) {
      rows = rows.filter((a) => (a.parliamentConstituencyId || a.parliamentId) === pcId);
    }
    return rows;
  }, [assemblies, districts, districtId, pcId]);

  const selectedAssemblyName = filteredAcs.find((a) => a.id === acId)?.name || "";
  const selectedDistrictName = districts.find((d) => d.id === districtId)?.name || "";

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    window.setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const loadConstituencies = async () => {
    const data = await politicalApiService.getPiConstituencies(userId, { stateId, districtId, limit: 100 });
    setConstRows(data.items || []);
  };
  const loadLeaders = async () => {
    const data = await politicalApiService.getPiLeaders(userId, { assemblyConstituencyId: acId || undefined, districtId, limit: 100 });
    setLeaders(data.items || []);
  };
  const loadAccounts = async () => {
    const data = await politicalApiService.getPiAccounts(userId, { assemblyConstituencyId: acId || undefined, limit: 100 });
    setAccounts(data.items || []);
  };
  const loadQueue = async () => {
    setQueue(await politicalApiService.getPiQueue(userId, queueStatus));
  };
  const loadIntel = async () => {
    setIntel(
      await politicalApiService.getPiIntelligence(userId, {
        stateId,
        districtId: districtId || undefined,
        parliamentConstituencyId: pcId || undefined,
        assemblyConstituencyId: acId || undefined,
        platform: intelPlatform || undefined,
        partyId: intelParty || undefined,
        rankBy
      })
    );
  };

  useEffect(() => {
    if (tab === "constituencies") {
      loadConstituencies().catch((e) => flash(e.message, true));
      loadLeaders().catch((e) => flash(e.message, true));
      loadAccounts().catch((e) => flash(e.message, true));
      refreshDashboard().catch((e) => flash(e.message, true));
      if (districtId) {
        politicalApiService.getPiDistrictDetail(userId, districtId).then(setDistrictDetail).catch(() => setDistrictDetail(null));
      } else {
        setDistrictDetail(null);
      }
    }
    if (tab === "verify") loadQueue().catch((e) => flash(e.message, true));
    if (tab === "intelligence") loadIntel().catch((e) => flash(e.message, true));
    if (tab === "dashboard") refreshDashboard().catch((e) => flash(e.message, true));
  }, [tab, queueStatus, intelPlatform, intelParty, rankBy, stateId, districtId, pcId, acId]);

  const saveConstituency = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const num = (v: any) => (v === "" || v == null ? undefined : Number(v));
      await politicalApiService.savePiConstituency(userId, {
        ...constForm,
        stateId,
        districtId,
        parliamentConstituencyId: pcId,
        assemblyConstituencyId: acId,
        assemblyName: filteredAcs.find((a) => a.id === acId)?.name,
        totalVoters: num(constForm.totalVoters),
        ruralPercent: num(constForm.ruralPercent),
        estimatedFacebookUsers: num(constForm.estimatedFacebookUsers),
        estimatedInstagramUsers: num(constForm.estimatedInstagramUsers),
        estimatedXUsers: num(constForm.estimatedXUsers),
        estimatedYouTubeUsers: num(constForm.estimatedYouTubeUsers)
      });
      flash("Constituency record saved.");
      await loadConstituencies();
      await refreshDashboard();
      scrollToSection(leadersSectionRef);
    } catch (err: any) {
      flash(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const saveLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await politicalApiService.savePiLeader(userId, {
        ...leaderForm,
        stateId,
        districtId,
        parliamentConstituencyId: pcId,
        assemblyConstituencyId: acId
      });
      flash("Leader saved.");
      await loadLeaders();
      scrollToSection(socialSectionRef);
    } catch (err: any) {
      flash(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const num = (v: any) => (v === "" || v == null ? undefined : Number(v));
      await politicalApiService.savePiAccount(userId, {
        ...socialForm,
        followers: num(socialForm.followers),
        postsLast30Days: num(socialForm.postsLast30Days),
        avgLikesLast10: num(socialForm.avgLikesLast10),
        avgCommentsLast10: num(socialForm.avgCommentsLast10),
        avgViewsLast10: num(socialForm.avgViewsLast10)
      });
      flash("Social account saved.");
      await loadAccounts();
      scrollToSection(districtsSectionRef);
    } catch (err: any) {
      flash(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const verify = async (recordType: string, id: string, status: string) => {
    const remarks = window.prompt("Review remarks") || "";
    try {
      await politicalApiService.verifyPiRecord(userId, recordType, id, { status, remarks });
      flash(`Marked ${status}`);
      await loadQueue();
    } catch (err: any) {
      flash(err.message, true);
    }
  };

  const downloadTemplate = () => {
    const csv = `recordType,stateId,districtId,parliamentConstituencyId,assemblyConstituencyId,totalVoters,ruralPercent,estimatedFacebookUsers,estimatedInstagramUsers,estimatedXUsers,estimatedYouTubeUsers,dataCollectionDate,dataSource,remarks,leaderName,partyId,politicalRole,currentFormerStatus,platform,profileUrl,accountIdentifier,followers,postsLast30Days,avgLikesLast10,avgCommentsLast10,avgViewsLast10
constituency,AP,AP-DIST-NANDYAL,AP-PC-17,AP-AC-139,234100,62,48000,22000,9000,15000,2026-11-01,FIELD_SURVEY,Estimates only,,,,,,,,,,
social,AP,AP-DIST-NANDYAL,AP-PC-17,AP-AC-139,,,,,,,2026-11-01,MANUAL,Sample,A. Rao (Sample),TDP,MLA,CURRENT,facebook,https://facebook.com/sample.rao.bng,sample.rao.bng,12500,18,210,34,`;
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "leaderlens-pi-template.csv";
    a.click();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4A24C] font-bold">Political Intelligence</p>
          <h1 className="text-2xl font-display text-[#F5EFE0]">Constituency data collection</h1>
        </div>
        {isSuper && (
          <button
            className={BTN}
            onClick={async () => {
              try {
                await politicalApiService.seedPiSample(userId);
                flash("SAMPLE records loaded (fictional names only).");
                await refreshDashboard();
              } catch (e: any) {
                flash(e.message, true);
              }
            }}
          >
            Load SAMPLE data
          </button>
        )}
      </header>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
              tab === item.id ? "bg-[#D4A24C] text-[#071322]" : "text-[#B9AF95] border border-[#22405E]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {(error || ok) && (
        <div className={`p-3 rounded-xl text-xs border ${error ? "border-rose-500/40 text-rose-200 bg-rose-950/40" : "border-emerald-500/40 text-emerald-200 bg-emerald-950/40"}`}>
          {error || ok}
        </div>
      )}

      {tab === "dashboard" && (
        <section className="space-y-4">
          <StateDistrictBar
            stateId={stateId}
            setStateId={setStateId}
            districtId={districtId}
            setDistrictId={setDistrictId}
            setPcId={setPcId}
            setAcId={setAcId}
            states={states}
            districts={districts}
          />
          {loading && !dashboard ? (
            <div className="p-8 text-center text-[#D4A24C] text-xs"><Loader2 className="w-4 h-4 inline animate-spin" /> Loading live metrics…</div>
          ) : !dashboard ? (
            <EmptyState text="No constituency statistics yet. Enter a constituency or load SAMPLE data." />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
                <Kpi label="Total constituencies" value={dashboard.totalConstituencies} />
                <Kpi label="Entered" value={dashboard.constituenciesEntered} />
                <Kpi label="Leaders" value={dashboard.totalLeaders} />
                <Kpi label="Social accounts" value={dashboard.totalSocialAccounts} />
                <Kpi label="Verified" value={dashboard.verifiedAccounts} />
                <Kpi label="Pending" value={dashboard.pendingVerification} />
                <Kpi label="Recheck" value={dashboard.needsRecheck} />
                <Kpi label="Verified %" value={dashboard.verificationPercent == null ? "—" : `${dashboard.verificationPercent}%`} />
              </div>
              <div className={CARD}>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-2">
                  <h2 className="text-sm font-bold text-[#F5EFE0]">Last collection</h2>
                  <p className="text-[11px] text-[#B9AF95]">
                    Latest in this {districtId ? "district" : "state"}: {(dashboard.lastDataCollectionDate || "").slice(0, 10) || "—"}
                  </p>
                </div>
                {(dashboard.recentCollections || []).length === 0 ? (
                  <EmptyState text="No collections yet for this state and district. Save a constituency, leader, or social account to see it here." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs table-fixed">
                      <thead>
                        <tr className="text-[#D4A24C] text-left">
                          <th className="py-1">Collected</th>
                          <th>Type</th>
                          <th>District</th>
                          <th>Assembly</th>
                          <th>Summary</th>
                          <th>Entered by</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dashboard.recentCollections || []).map((row: PiRecentCollection) => (
                          <tr
                            key={`${row.recordType}-${row.id}`}
                            className="text-[#F5EFE0] border-t border-[#22405E] cursor-pointer hover:bg-[#131E2D]"
                            onClick={() => {
                              if (row.districtId) setDistrictId(row.districtId);
                              if (row.assemblyConstituencyId) setAcId(row.assemblyConstituencyId);
                              setTab("constituencies");
                            }}
                          >
                            <td className="py-1.5 break-words">{(row.collectedAt || "").slice(0, 10) || "—"}</td>
                            <td className="break-words capitalize">{row.recordType || "—"}</td>
                            <td className="break-words">{row.districtName || "—"}</td>
                            <td className="break-words">{row.assemblyName || "—"}</td>
                            <td className="break-words">{row.summary || "—"}</td>
                            <td className="break-words">{row.enteredByName || "—"}</td>
                            <td>
                              <span className={`px-1.5 py-0.5 rounded border ${statusTone(row.verificationStatus)}`}>{row.verificationStatus || "—"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {selectedDistrictProgress && (
                <button
                  onClick={() => { setDistrictId(selectedDistrictProgress.id); setTab("constituencies"); }}
                  className={`text-left ${CARD} w-full`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#F5EFE0]">{selectedDistrictProgress.name}</span>
                    <MapPin className="w-4 h-4 text-[#D4A24C]" />
                  </div>
                  <p className="text-sm text-[#D4A24C] mt-1">{selectedDistrictProgress.constituenciesEntered}/{selectedDistrictProgress.totalConstituencies} constituencies entered</p>
                  <p className="text-[11px] text-[#B9AF95]">{selectedDistrictProgress.verificationPercent == null ? "No accounts yet" : `${selectedDistrictProgress.verificationPercent}% verified`} · {selectedDistrictProgress.needsRecheck} recheck</p>
                  <div className="mt-2 h-1.5 rounded bg-[#142B45]">
                    <div className="h-1.5 rounded bg-[#D4A24C]" style={{ width: `${selectedDistrictProgress.totalConstituencies ? (selectedDistrictProgress.constituenciesEntered / selectedDistrictProgress.totalConstituencies) * 100 : 0}%` }} />
                  </div>
                </button>
              )}
            </>
          )}
        </section>
      )}

      {tab === "constituencies" && (
        <section className="space-y-4">
          <div className={CARD}>
            <h2 className="text-sm font-bold text-[#F5EFE0]">Constituency</h2>
            <p className="text-[11px] text-[#B9AF95] mt-1">
              {selectedAssemblyName
                ? `${selectedAssemblyName}${selectedDistrictName ? ` · ${selectedDistrictName}` : ""}`
                : "Select district, parliament, and assembly. Leaders, social accounts, and district progress stay on this constituency."}
            </p>
            <div className="mt-3">
              <GeoFilters
                stateId={stateId} setStateId={setStateId}
                districtId={districtId} setDistrictId={setDistrictId}
                pcId={pcId} setPcId={setPcId}
                acId={acId} setAcId={setAcId}
                states={states} districts={districts} pcs={filteredPcs} acs={filteredAcs}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <form onSubmit={saveConstituency} className={`${CARD} space-y-3`}>
              <h2 className="text-sm font-bold text-[#F5EFE0]">Constituency entry</h2>
              <Field label="Total voters" type="number" value={constForm.totalVoters || ""} onChange={(v) => setConstForm({ ...constForm, totalVoters: v })} />
              <Field label="Rural % " type="number" value={constForm.ruralPercent || ""} onChange={(v) => setConstForm({ ...constForm, ruralPercent: v })} />
              <p className="text-[11px] text-[#D4A24C]">Estimated social media users (not observed counts)</p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Est. Facebook users" type="number" value={constForm.estimatedFacebookUsers || ""} onChange={(v) => setConstForm({ ...constForm, estimatedFacebookUsers: v })} />
                <Field label="Est. Instagram users" type="number" value={constForm.estimatedInstagramUsers || ""} onChange={(v) => setConstForm({ ...constForm, estimatedInstagramUsers: v })} />
                <Field label="Est. X users" type="number" value={constForm.estimatedXUsers || ""} onChange={(v) => setConstForm({ ...constForm, estimatedXUsers: v })} />
                <Field label="Est. YouTube users" type="number" value={constForm.estimatedYouTubeUsers || ""} onChange={(v) => setConstForm({ ...constForm, estimatedYouTubeUsers: v })} />
              </div>
              <Field label="Data collection date" type="date" value={constForm.dataCollectionDate || ""} onChange={(v) => setConstForm({ ...constForm, dataCollectionDate: v })} />
              <Field label="Data source" value={constForm.dataSource || ""} onChange={(v) => setConstForm({ ...constForm, dataSource: v })} />
              <Field label="Remarks" value={constForm.remarks || ""} onChange={(v) => setConstForm({ ...constForm, remarks: v })} />
              <button className={BTN} disabled={loading || !acId}>{loading ? "Saving…" : "Save constituency"}</button>
            </form>
            <div className={CARD}>
              <h2 className="text-sm font-bold text-[#F5EFE0] mb-2">Entered constituencies</h2>
              {constRows.length === 0 ? <EmptyState text="No constituency statistics for this filter." /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs table-fixed">
                    <thead><tr className="text-[#D4A24C] text-left"><th className="py-1">Constituency</th><th>Voters</th><th>Status</th><th>Collected</th></tr></thead>
                    <tbody>
                      {constRows.map((row) => (
                        <tr
                          key={row.id}
                          className="text-[#F5EFE0] border-t border-[#22405E] cursor-pointer hover:bg-[#131E2D]"
                          onClick={() => {
                            if (row.districtId) setDistrictId(row.districtId);
                            if (row.parliamentConstituencyId) setPcId(row.parliamentConstituencyId);
                            if (row.assemblyConstituencyId) setAcId(row.assemblyConstituencyId);
                          }}
                        >
                          <td className="py-1.5 break-words">{row.assemblyName || row.assemblyConstituencyId}</td>
                          <td>{row.totalVoters ?? "—"}</td>
                          <td><span className={`px-1.5 py-0.5 rounded border ${statusTone(row.verificationStatus)}`}>{row.verificationStatus}</span></td>
                          <td className="break-words">{(row.dataCollectionDate || "").slice(0, 10) || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div ref={leadersSectionRef} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <form onSubmit={saveLeader} className={`${CARD} space-y-3`}>
              <h2 className="text-sm font-bold text-[#F5EFE0]">Leaders</h2>
              <p className="text-[11px] text-[#B9AF95]">{selectedAssemblyName || "Uses the assembly selected above."}</p>
              <Field label="Name" value={leaderForm.name || ""} onChange={(v) => setLeaderForm({ ...leaderForm, name: v })} required />
              <label className={LABEL}>Political party (master)</label>
              <select className={INPUT} value={leaderForm.partyId || ""} onChange={(e) => setLeaderForm({ ...leaderForm, partyId: e.target.value })} required>
                <option value="">Select party</option>
                {parties.map((p) => <option key={p.id} value={p.id}>{p.shortName || p.name}</option>)}
              </select>
              <label className={LABEL}>Political role</label>
              <select className={INPUT} value={leaderForm.politicalRole} onChange={(e) => setLeaderForm({ ...leaderForm, politicalRole: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
              </select>
              <label className={LABEL}>Current / former</label>
              <select className={INPUT} value={leaderForm.currentFormerStatus} onChange={(e) => setLeaderForm({ ...leaderForm, currentFormerStatus: e.target.value })}>
                <option value="CURRENT">CURRENT</option>
                <option value="FORMER">FORMER</option>
              </select>
              <Field label="Election year" type="number" value={leaderForm.electionYear || ""} onChange={(v) => setLeaderForm({ ...leaderForm, electionYear: v })} />
              <Field label="Data source" value={leaderForm.dataSource || ""} onChange={(v) => setLeaderForm({ ...leaderForm, dataSource: v })} />
              <Field label="Remarks" value={leaderForm.remarks || ""} onChange={(v) => setLeaderForm({ ...leaderForm, remarks: v })} />
              <button className={BTN} disabled={loading || !acId}>{loading ? "Saving…" : "Save leader"}</button>
            </form>
            <div className={CARD}>
              <h2 className="text-sm font-bold text-[#F5EFE0] mb-2">Leaders in this constituency</h2>
              {leaders.length === 0 ? <EmptyState text="No leaders for this geography." /> : (
                <div className="space-y-2">
                  {leaders.map((row) => {
                    const party = partyById[row.partyId];
                    return (
                      <div key={row.id} className="p-2.5 rounded-lg border border-[#22405E]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#F5EFE0]">{row.name}</span>
                          <span className="text-[10px] font-bold" style={{ color: party?.primaryColor || "#D4A24C" }}>{row.partyId}</span>
                        </div>
                        <p className="text-[11px] text-[#B9AF95]">{(row.roles || []).map((r: any) => r.politicalRole).join(" · ") || "—"} · {row.assemblyConstituencyId}</p>
                        <p className="text-[11px] text-[#B9AF95]">Contact {row.contactId || "—"} · {row.verificationStatus}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div ref={socialSectionRef} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <form onSubmit={saveAccount} className={`${CARD} space-y-3`}>
              <h2 className="text-sm font-bold text-[#F5EFE0]">Social media</h2>
              <p className="text-[11px] text-[#B9AF95]">Accounts belong to leaders in this constituency.</p>
              <label className={LABEL}>Leader</label>
              <select className={INPUT} value={socialForm.personId || ""} onChange={(e) => {
                const person = leaders.find((l) => l.id === e.target.value);
                setSocialForm({ ...socialForm, personId: e.target.value, partyId: person?.partyId });
              }} required>
                <option value="">Select leader</option>
                {leaders.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.partyId})</option>)}
              </select>
              <p className="text-[11px] text-[#B9AF95]">Party is taken from the leader record: {socialForm.partyId || "—"}</p>
              <label className={LABEL}>Platform</label>
              <select className={INPUT} value={socialForm.platform} onChange={(e) => setSocialForm({ ...socialForm, platform: e.target.value })}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <Field label="Profile URL" value={socialForm.profileUrl || ""} onChange={(v) => setSocialForm({ ...socialForm, profileUrl: v })} />
              <Field label="Account identifier" value={socialForm.accountIdentifier || ""} onChange={(v) => setSocialForm({ ...socialForm, accountIdentifier: v })} />
              <Field label="Followers / subscribers" type="number" value={socialForm.followers || ""} onChange={(v) => setSocialForm({ ...socialForm, followers: v })} />
              <Field label="Posts last 30 days" type="number" value={socialForm.postsLast30Days || ""} onChange={(v) => setSocialForm({ ...socialForm, postsLast30Days: v })} />
              <Field label="Avg likes (last 10)" type="number" value={socialForm.avgLikesLast10 || ""} onChange={(v) => setSocialForm({ ...socialForm, avgLikesLast10: v })} />
              <Field label="Avg comments (last 10)" type="number" value={socialForm.avgCommentsLast10 || ""} onChange={(v) => setSocialForm({ ...socialForm, avgCommentsLast10: v })} />
              <Field label="Avg views (YouTube)" type="number" value={socialForm.avgViewsLast10 || ""} onChange={(v) => setSocialForm({ ...socialForm, avgViewsLast10: v })} />
              <label className={LABEL}>Status</label>
              <select className={INPUT} value={socialForm.verificationStatus} onChange={(e) => setSocialForm({ ...socialForm, verificationStatus: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <Field label="Date collected" type="date" value={socialForm.dataCollectionDate || ""} onChange={(v) => setSocialForm({ ...socialForm, dataCollectionDate: v })} />
              <Field label="Data source" value={socialForm.dataSource || ""} onChange={(v) => setSocialForm({ ...socialForm, dataSource: v })} />
              <Field label="Remarks" value={socialForm.remarks || ""} onChange={(v) => setSocialForm({ ...socialForm, remarks: v })} />
              <button className={BTN} disabled={loading}>{loading ? "Saving…" : "Save account + snapshot"}</button>
            </form>
            <div className={CARD}>
              <h2 className="text-sm font-bold text-[#F5EFE0] mb-2">Accounts in this constituency</h2>
              {accounts.length === 0 ? <EmptyState text="No social accounts yet for this constituency." /> : (
                <div className="space-y-2">
                  {accounts.map((row) => (
                    <div key={row.id} className="p-2.5 rounded-lg border border-[#22405E]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#F5EFE0]">{row.leaderName} · {row.platform}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusTone(row.verificationStatus)}`}>{row.verificationStatus}</span>
                      </div>
                      <p className="text-[11px] text-[#B9AF95] break-all">{row.profileUrl}</p>
                      <p className="text-[11px] text-[#B9AF95]">
                        Followers {row.followers ?? "—"} · Engagement {row.engagementPercent == null ? "—" : `${row.engagementPercent}%`} ({row.engagementFormulaVersion})
                      </p>
                      <p className="text-[11px] text-[#B9AF95]">Growth 30d {row.growth30 == null ? "—" : `${row.growth30}%`} · 90d {row.growth90 == null ? "—" : `${row.growth90}%`}</p>
                      <button className="text-[11px] text-[#D4A24C] underline mt-1" onClick={async () => {
                        setSnapshotAccount(row.id);
                        setSnapshots(await politicalApiService.getPiSnapshots(userId, row.id));
                      }}>History</button>
                    </div>
                  ))}
                </div>
              )}
              {snapshotAccount && (
                <div className="mt-3 text-[11px] text-[#B9AF95]">
                  Snapshots for {snapshotAccount}: {snapshots.length === 0 ? "none" : snapshots.map((s) => `${(s.collectionDate || "").slice(0, 10)} → ${s.followers ?? "—"}`).join(" · ")}
                </div>
              )}
            </div>
          </div>

          <div ref={districtsSectionRef} className="space-y-3">
            <div className={CARD}>
              <h2 className="text-sm font-bold text-[#F5EFE0]">District progress</h2>
              <p className="text-[11px] text-[#B9AF95] mt-1">{selectedDistrictName || "Choose a district above to see coverage for this constituency’s district."}</p>
            </div>
            {!districtId ? (
              <EmptyState text="Choose a district with the geography filters above." />
            ) : selectedDistrictProgress ? (
              <div className={CARD}>
                <div className="font-bold text-[#F5EFE0]">{selectedDistrictProgress.name}</div>
                <p className="text-sm text-[#D4A24C]">{selectedDistrictProgress.constituenciesEntered}/{selectedDistrictProgress.totalConstituencies} entered · {selectedDistrictProgress.constituenciesPending} pending</p>
                <p className="text-[11px] text-[#B9AF95]">{selectedDistrictProgress.totalLeaders} leaders · {selectedDistrictProgress.totalAccounts} accounts · {selectedDistrictProgress.verifiedAccounts} verified · {selectedDistrictProgress.needsRecheck} recheck</p>
                <p className="text-[11px] text-[#B9AF95]">Updated {selectedDistrictProgress.lastUpdated ? String(selectedDistrictProgress.lastUpdated).slice(0, 10) : "—"}</p>
              </div>
            ) : (
              <EmptyState text="No progress yet for this district." />
            )}
            <button className={BTN} type="button" onClick={() => setTab("verify")}>Continue to verification</button>
            {districtDetail && (
              <div className={CARD}>
                <h3 className="font-bold text-[#F5EFE0] mb-2">{districtDetail.district?.name} constituencies</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs table-fixed">
                    <thead><tr className="text-[#D4A24C] text-left"><th className="py-1">Constituency</th><th>Entered</th><th>Leaders</th><th>Accounts</th><th>Last collection</th></tr></thead>
                    <tbody>
                      {(districtDetail.constituencies || []).map((c: any) => (
                        <tr
                          key={c.assemblyConstituencyId}
                          className="border-t border-[#22405E] text-[#F5EFE0] cursor-pointer hover:bg-[#131E2D]"
                          onClick={() => {
                            setDistrictId(districtDetail.district?.id || districtId);
                            setPcId(c.parliamentConstituencyId || "");
                            setAcId(c.assemblyConstituencyId);
                            scrollToSection(leadersSectionRef);
                          }}
                        >
                          <td className="py-1.5 break-words">{c.name}</td>
                          <td>{c.entered ? "Yes" : "No"}</td>
                          <td>{c.leaders}</td>
                          <td>{c.accounts}</td>
                          <td>{(c.lastCollectionDate || "").slice(0, 10) || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "verify" && (
        <section className={CARD}>
          <div className="flex flex-wrap gap-2 mb-3">
            {["PENDING", "NEEDS_RECHECK", "VERIFIED", "REJECTED"].map((s) => (
              <button key={s} onClick={() => setQueueStatus(s)} className={`px-2 py-1 rounded text-[10px] font-bold border ${queueStatus === s ? "bg-[#D4A24C] text-[#071322]" : "border-[#22405E] text-[#B9AF95]"}`}>{s}</button>
            ))}
          </div>
          {queue.length === 0 ? <EmptyState text="No records in this verification bucket." /> : (
            <div className="space-y-2">
              {queue.map((row) => (
                <div key={row.id} className="p-2.5 rounded-lg border border-[#22405E]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#F5EFE0]">{row.leaderName} · {row.platform}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusTone(row.verificationStatus)}`}>{row.verificationStatus}</span>
                  </div>
                  <a className="text-[11px] text-[#D4A24C] break-all underline" href={row.profileUrl} target="_blank" rel="noreferrer">{row.profileUrl}</a>
                  <p className="text-[11px] text-[#B9AF95]">Followers {row.followers ?? "—"} · Entered by {row.enteredByName || row.enteredBy}</p>
                  {canVerify && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button className={BTN} onClick={() => verify("social", row.id, "VERIFIED")}>Verify</button>
                      <button className="px-3 py-2 rounded-xl border border-amber-500/40 text-amber-200 text-xs" onClick={() => verify("social", row.id, "NEEDS_RECHECK")}>Recheck</button>
                      <button className="px-3 py-2 rounded-xl border border-rose-500/40 text-rose-200 text-xs" onClick={() => verify("social", row.id, "REJECTED")}>Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "import" && (
        <section className={`${CARD} space-y-3`}>
          <div className="flex flex-wrap gap-2">
            <button className={BTN} type="button" onClick={downloadTemplate}><Download className="w-3.5 h-3.5 inline mr-1" />CSV template</button>
          </div>
          <label className={LABEL}>Upload CSV</label>
          <input
            type="file"
            accept=".csv,text/csv"
            className="block w-full text-xs text-[#B9AF95]"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setCsvText(await file.text());
            }}
          />
          <textarea className={`${INPUT} min-h-[160px] font-mono text-[11px]`} value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder="Paste CSV here" />
          <div className="flex flex-wrap gap-2">
            <button className={BTN} type="button" onClick={async () => {
              try { setPreview(await politicalApiService.previewPiImport(userId, csvText)); flash("Preview ready"); }
              catch (e: any) { flash(e.message, true); }
            }}>Preview</button>
            <button className={BTN} type="button" onClick={async () => {
              try { const batch = await politicalApiService.confirmPiImport(userId, csvText); flash(`Imported ${batch.importedRows}, rejected ${batch.rejectedRows}`); }
              catch (e: any) { flash(e.message, true); }
            }}>Confirm import</button>
          </div>
          {preview && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <Kpi label="Total" value={preview.totalRows} />
              <Kpi label="Valid" value={preview.validRows} />
              <Kpi label="Invalid" value={preview.invalidRows} />
              <Kpi label="Duplicates" value={preview.duplicateRows} />
              <Kpi label="Ready" value={(preview.valid || []).length} />
            </div>
          )}
        </section>
      )}

      {tab === "intelligence" && (
        <section className="space-y-4">
          <GeoFilters stateId={stateId} setStateId={setStateId} districtId={districtId} setDistrictId={setDistrictId} pcId={pcId} setPcId={setPcId} acId={acId} setAcId={setAcId} states={states} districts={districts} pcs={filteredPcs} acs={filteredAcs} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select className={INPUT} value={intelPlatform} onChange={(e) => setIntelPlatform(e.target.value)}>
              <option value="">All platforms</option>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className={INPUT} value={intelParty} onChange={(e) => setIntelParty(e.target.value)}>
              <option value="">All parties</option>
              {parties.map((p) => <option key={p.id} value={p.id}>{p.shortName}</option>)}
            </select>
            <select className={INPUT} value={rankBy} onChange={(e) => setRankBy(e.target.value)}>
              <option value="followers">Rank by followers</option>
              <option value="engagement">Rank by engagement</option>
              <option value="growth">Rank by 30-day growth</option>
              <option value="socialScore">Rank by social score</option>
            </select>
          </div>
          {!intel ? <EmptyState text="No intelligence rows yet." /> : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Kpi label="Est. Facebook" value={intel.audienceEstimates?.facebook ?? "—"} hint="Estimated" />
                <Kpi label="Est. Instagram" value={intel.audienceEstimates?.instagram ?? "—"} hint="Estimated" />
                <Kpi label="Est. X" value={intel.audienceEstimates?.x ?? "—"} hint="Estimated" />
                <Kpi label="Est. YouTube" value={intel.audienceEstimates?.youtube ?? "—"} hint="Estimated" />
              </div>
              <p className="text-[11px] text-[#B9AF95]">{intel.socialScoreDisclaimer}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs table-fixed">
                  <thead>
                    <tr className="text-[#D4A24C] text-left">
                      <th className="py-1">Leader</th><th>Party</th><th>Followers</th><th>Engagement</th><th>30d</th><th>Score</th><th>AC rank</th><th>District</th><th>PC</th><th>Party rank</th><th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(intel.leaders || []).map((row: any) => (
                      <tr key={row.id} className="border-t border-[#22405E] text-[#F5EFE0]">
                        <td className="py-1.5 break-words">{row.name}</td>
                        <td style={{ color: row.partyColor }}>{row.partyId}</td>
                        <td>{row.followers ?? "—"}</td>
                        <td>{row.engagementPercent == null ? "—" : `${row.engagementPercent}%`}</td>
                        <td>{row.growth30 == null ? "—" : `${row.growth30}%`}</td>
                        <td>{row.socialScore ?? "—"}</td>
                        <td>{row.rankInConstituency ?? "—"}</td>
                        <td>{row.rankInDistrict ?? "—"}</td>
                        <td>{row.rankInParliament ?? "—"}</td>
                        <td>{row.rankInParty ?? "—"}</td>
                        <td>{row.rankInState ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={CARD}>
                  <h3 className="text-sm font-bold text-[#F5EFE0] mb-2">Party comparison</h3>
                  {(intel.partyCompare || []).map((p: any) => (
                    <div key={p.partyId} className="flex justify-between text-xs text-[#B9AF95] py-1">
                      <span style={{ color: p.partyColor }}>{p.partyName}</span>
                      <span>{p.leaders} leaders · {p.followers || "—"} followers</span>
                    </div>
                  ))}
                </div>
                <div className={CARD}>
                  <h3 className="text-sm font-bold text-[#F5EFE0] mb-2">Platform comparison</h3>
                  {(intel.platformCompare || []).map((p: any) => (
                    <div key={p.platform} className="flex justify-between text-xs text-[#B9AF95] py-1">
                      <span className="uppercase text-[#D4A24C]">{p.platform}</span>
                      <span>{p.accounts} accounts · {p.followers || "—"} followers</span>
                    </div>
                  ))}
                  {intel.biggestGap && (
                    <p className="text-[11px] text-[#D4A24C] mt-2">Largest follower gap: {intel.biggestGap.leader} vs {intel.biggestGap.opponent} ({intel.biggestGap.followersDelta})</p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
};

function Kpi({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className={CARD}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C] block">{label}</span>
      <span className="text-2xl font-bold font-display text-[#D4A24C] mt-0.5 block">{value}</span>
      {hint && <span className="text-[10px] text-[#B9AF95]">{hint}</span>}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="p-6 text-center text-xs text-[#B9AF95] border border-dashed border-[#22405E] rounded-xl">
      <Database className="w-4 h-4 mx-auto mb-1 text-[#D4A24C]" />
      {text}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: any; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className={LABEL}>{label}{required ? " *" : ""}</label>
      <input className={INPUT} type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function StateDistrictBar(props: {
  stateId: string; setStateId: (v: string) => void;
  districtId: string; setDistrictId: (v: string) => void;
  setPcId: (v: string) => void;
  setAcId: (v: string) => void;
  states: StateInfo[]; districts: any[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div>
        <label className={LABEL}>State</label>
        <select
          className={INPUT}
          value={props.stateId}
          onChange={(e) => {
            props.setStateId(e.target.value);
            props.setDistrictId("");
            props.setPcId("");
            props.setAcId("");
          }}
        >
          {props.states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>District</label>
        <select
          className={INPUT}
          value={props.districtId}
          onChange={(e) => {
            props.setDistrictId(e.target.value);
            props.setPcId("");
            props.setAcId("");
          }}
        >
          <option value="">All districts in this state</option>
          {props.districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
    </div>
  );
}

function GeoFilters(props: {
  stateId: string; setStateId: (v: string) => void;
  districtId: string; setDistrictId: (v: string) => void;
  pcId: string; setPcId: (v: string) => void;
  acId: string; setAcId: (v: string) => void;
  states: StateInfo[]; districts: any[]; pcs: ParliamentInfo[]; acs: any[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div>
        <label className={LABEL}>State</label>
        <select className={INPUT} value={props.stateId} onChange={(e) => { props.setStateId(e.target.value); props.setDistrictId(""); props.setPcId(""); props.setAcId(""); }}>
          {props.states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>District</label>
        <select className={INPUT} value={props.districtId} onChange={(e) => { props.setDistrictId(e.target.value); props.setPcId(""); props.setAcId(""); }}>
          <option value="">Select district</option>
          {props.districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Parliament constituency</label>
        <select
          className={`${INPUT} disabled:opacity-60 disabled:cursor-not-allowed`}
          value={props.districtId ? props.pcId : ""}
          disabled={!props.districtId}
          onChange={(e) => { props.setPcId(e.target.value); props.setAcId(""); }}
        >
          <option value="">{props.districtId ? "Select PC" : "Select district first"}</option>
          {props.districtId ? props.pcs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>) : null}
        </select>
      </div>
      <div>
        <label className={LABEL}>Assembly constituency</label>
        <select
          className={`${INPUT} disabled:opacity-60 disabled:cursor-not-allowed`}
          value={props.districtId ? props.acId : ""}
          disabled={!props.districtId}
          onChange={(e) => props.setAcId(e.target.value)}
        >
          <option value="">{props.districtId ? "Select AC" : "Select district first"}</option>
          {props.districtId ? props.acs.map((a) => <option key={`${a.id}-${a.name}`} value={a.id}>{a.name}</option>) : null}
        </select>
      </div>
    </div>
  );
}

export default PoliticalIntelligence;
