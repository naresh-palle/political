import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Database,
  Download,
  Loader2,
  MapPin,
  Trash2
} from "lucide-react";
import { UserProfile, PiDashboard, PiDistrictProgress, PiRecentCollection, StateInfo, PoliticalParty, ParliamentInfo } from "../../types";
import { politicalApiService } from "../../services/api";
import { UNIQUE_TICKET_SURFACE } from "../../utils/ticketKpi";
import { canManagePoliticalIntelligence, isSmAUser, isSmMUser } from "../../utils/piAccess";

type Tab = "dashboard" | "constituencies" | "verify" | "import" | "intelligence";
type EntryGroup = "constituency" | "leaders";
type SaveKind = "constituency" | "leader" | null;
type LeaderKind = "LEADER_1" | "LEADER_2" | "LEADER_3" | "LEADER_4";

const LEADER_SLOTS: { kind: LeaderKind; label: string; defaultRole: string; defaultParty: string }[] = [
  { kind: "LEADER_1", label: "Leader 1", defaultRole: "MLA", defaultParty: "TDP" },
  { kind: "LEADER_2", label: "Leader 2", defaultRole: "OTHER", defaultParty: "" },
  { kind: "LEADER_3", label: "Leader 3", defaultRole: "OTHER", defaultParty: "" },
  { kind: "LEADER_4", label: "Leader 4", defaultRole: "OTHER", defaultParty: "" }
];

function slotIndexForKind(kind?: string): number {
  if (kind === "LEADER_1" || kind === "SITTING_MLA") return 0;
  if (kind === "LEADER_2" || kind === "OPPOSITION") return 1;
  if (kind === "LEADER_3") return 2;
  if (kind === "LEADER_4") return 3;
  return -1;
}

function leaderKindLabel(kind?: string) {
  const index = slotIndexForKind(kind);
  return index >= 0 ? LEADER_SLOTS[index].label : "Leader";
}

function isSittingMlaKind(kind?: string) {
  return !kind || kind === "SITTING_MLA" || kind === "LEADER_1";
}

const SMA_TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Data Entry Dashboard" },
  { id: "constituencies", label: "Constituencies" }
];

const SMM_TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Data Entry Dashboard" },
  { id: "verify", label: "Verification Queue" },
  { id: "import", label: "Import / Export" },
  { id: "intelligence", label: "Intelligence" }
];

const ADMIN_TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Data Entry Dashboard" },
  { id: "constituencies", label: "Constituencies" },
  { id: "verify", label: "Verification Queue" },
  { id: "import", label: "Import / Export" },
  { id: "intelligence", label: "Intelligence" }
];

const ENTRY_GROUPS: { id: EntryGroup; label: string }[] = [
  { id: "constituency", label: "Constituency" },
  { id: "leaders", label: "Leaders" }
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
const PLATFORM_LABEL: Record<(typeof PLATFORMS)[number], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube"
};

type PlatformDraft = {
  hasAccount: "" | "yes" | "no";
  verified: "" | "yes" | "no";
  followers: string;
  profileUrl: string;
};

function emptyPlatformDrafts(): Record<(typeof PLATFORMS)[number], PlatformDraft> {
  return {
    facebook: { hasAccount: "", verified: "", followers: "", profileUrl: "" },
    instagram: { hasAccount: "", verified: "", followers: "", profileUrl: "" },
    x: { hasAccount: "", verified: "", followers: "", profileUrl: "" },
    youtube: { hasAccount: "", verified: "", followers: "", profileUrl: "" }
  };
}

type LeaderSlotState = {
  id?: string;
  name: string;
  partyId: string;
  politicalRole: string;
  leaderKind: LeaderKind;
  platformDrafts: Record<(typeof PLATFORMS)[number], PlatformDraft>;
  activePlatform: (typeof PLATFORMS)[number];
};

function emptyLeaderSlot(slot: (typeof LEADER_SLOTS)[number]): LeaderSlotState {
  return {
    name: "",
    partyId: slot.defaultParty,
    politicalRole: slot.defaultRole,
    leaderKind: slot.kind,
    platformDrafts: emptyPlatformDrafts(),
    activePlatform: "facebook"
  };
}

function draftsFromAccounts(personId: string, accountRows: any[]): Record<(typeof PLATFORMS)[number], PlatformDraft> {
  const next = emptyPlatformDrafts();
  accountRows.filter((row) => row.personId === personId).forEach((row) => {
    const platform = String(row.platform || "").toLowerCase() as (typeof PLATFORMS)[number];
    if (!PLATFORMS.includes(platform)) return;
    const noAccount = row.verificationStatus === "NO_ACCOUNT" || row.noAccount;
    next[platform] = {
      hasAccount: noAccount ? "no" : "yes",
      verified: row.verificationStatus === "VERIFIED" ? "yes" : "no",
      followers: row.followers != null ? String(row.followers) : "",
      profileUrl: noAccount ? "" : row.profileUrl || ""
    };
  });
  return next;
}

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatCompactCount(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  if (n >= 100000) {
    const lakh = n / 100000;
    return `${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)} L`;
  }
  if (n >= 1000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return String(Math.round(n));
}

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
  const isSmA = isSmAUser(currentUser);
  const isSmM = isSmMUser(currentUser);
  const isAdminEditor = canManagePoliticalIntelligence(currentUser);
  const canVerify = isSmM || isAdminEditor;
  const canEdit = isSmA || isAdminEditor;
  const canDelete = isAdminEditor;
  const visibleTabs = isAdminEditor ? ADMIN_TABS : isSmM ? SMM_TABS : SMA_TABS;

  const [tab, setTab] = useState<Tab>("dashboard");
  const [entryGroup, setEntryGroup] = useState<EntryGroup>("constituency");
  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState<SaveKind>(null);
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
  const [constForm, setConstForm] = useState<any>({
    enteredByName: currentUser.name || "",
    dataCollectionDate: todayIsoDate()
  });
  const [constRows, setConstRows] = useState<any[]>([]);
  const [leaderSlots, setLeaderSlots] = useState<LeaderSlotState[]>(() => LEADER_SLOTS.map(emptyLeaderSlot));
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [queueStatus, setQueueStatus] = useState("PENDING");
  const [intel, setIntel] = useState<any>(null);
  const [intelPlatform, setIntelPlatform] = useState("");
  const [intelParty, setIntelParty] = useState("");
  const [rankBy, setRankBy] = useState("followers");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<any>(null);

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
    setPageLoading(true);
    try {
      const data = await politicalApiService.getPiDashboard(userId, stateId, districtId || undefined);
      setDashboard(data);
    } catch (e: any) {
      flash(e.message || "Could not load dashboard", true);
    } finally {
      setPageLoading(false);
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

  const loadConstituencies = async () => {
    const data = await politicalApiService.getPiConstituencies(userId, { stateId, districtId, limit: 100 });
    setConstRows(data.items || []);
  };
  const loadLeaders = async () => {
    const data = await politicalApiService.getPiLeaders(userId, { assemblyConstituencyId: acId || undefined, districtId, limit: 100 });
    setLeaders(data.items || []);
    return data.items || [];
  };
  const loadAccounts = async () => {
    const data = await politicalApiService.getPiAccounts(userId, { assemblyConstituencyId: acId || undefined, limit: 100 });
    setAccounts(data.items || []);
    return data.items || [];
  };

  const hydrateLeaderSlots = (leaderRows: any[], accountRows: any[]) => {
    const next = LEADER_SLOTS.map(emptyLeaderSlot);
    const scoped = acId ? leaderRows.filter((row) => row.assemblyConstituencyId === acId) : [];
    for (const row of scoped) {
      const index = slotIndexForKind(row.leaderKind);
      if (index < 0 || next[index].id) continue;
      next[index] = {
        id: row.id,
        name: row.name || "",
        partyId: row.partyId || "",
        politicalRole: (row.roles || [])[0]?.politicalRole || next[index].politicalRole,
        leaderKind: LEADER_SLOTS[index].kind,
        platformDrafts: draftsFromAccounts(row.id, accountRows),
        activePlatform: "facebook"
      };
    }
    setLeaderSlots(next);
  };
  const loadQueue = async () => {
    setQueue(await politicalApiService.getPiQueue(userId, queueStatus));
  };
  const loadIntel = async () => {
    setIntel(
      await politicalApiService.getPiIntelligence(userId, {
        stateId,
        districtId: districtId || undefined,
        parliamentConstituencyId: acId ? pcId || undefined : undefined,
        assemblyConstituencyId: acId || undefined,
        platform: intelPlatform || undefined,
        partyId: intelParty || undefined,
        rankBy
      })
    );
  };

  useEffect(() => {
    if (!visibleTabs.some((item) => item.id === tab)) setTab("dashboard");
  }, [isSmM, isAdminEditor, tab]);

  useEffect(() => {
    if (tab === "constituencies") {
      loadConstituencies().catch((e) => flash(e.message, true));
      Promise.all([loadLeaders(), loadAccounts()])
        .then(([leaderRows, accountRows]) => hydrateLeaderSlots(leaderRows, accountRows))
        .catch((e) => flash(e.message, true));
      refreshDashboard().catch((e) => flash(e.message, true));
    }
    if (tab === "verify") loadQueue().catch((e) => flash(e.message, true));
    if (tab === "intelligence") loadIntel().catch((e) => flash(e.message, true));
    if (tab === "dashboard") refreshDashboard().catch((e) => flash(e.message, true));
  }, [tab, queueStatus, intelPlatform, intelParty, rankBy, stateId, districtId, pcId, acId]);

  const saveConstituency = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    if (!districtId || !acId) {
      flash("Select district and constituency.", true);
      return;
    }
    if (!String(constForm.enteredByName || "").trim()) {
      flash("Enter who collected this constituency.", true);
      return;
    }
    setSaving("constituency");
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
        estimatedYouTubeUsers: num(constForm.estimatedYouTubeUsers),
        enteredByName: String(constForm.enteredByName || "").trim(),
        dataCollectionDate: todayIsoDate()
      });
      flash("Saved ✓ Enter the next constituency.");
      await loadConstituencies();
      await refreshDashboard();
      setEntryGroup("constituency");
    } catch (err: any) {
      flash(err.message, true);
    } finally {
      setSaving(null);
    }
  };

  const saveLeader = async (e: React.FormEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    const slot = leaderSlots[index];
    if (!slot) return;
    if (!acId) {
      flash("Select an assembly constituency.", true);
      return;
    }
    if (!String(slot.name || "").trim() || !slot.partyId) {
      flash("Enter the leader name and party.", true);
      return;
    }
    for (const platform of PLATFORMS) {
      const draft = slot.platformDrafts[platform];
      if (draft.hasAccount === "yes" && !String(draft.profileUrl || "").trim()) {
        flash(`Add a profile link for ${PLATFORM_LABEL[platform]}.`, true);
        return;
      }
    }
    setSaving("leader");
    setSavingSlot(index);
    try {
      const saved = await politicalApiService.savePiLeader(userId, {
        id: slot.id,
        name: slot.name,
        partyId: slot.partyId,
        politicalRole: slot.politicalRole,
        leaderKind: slot.leaderKind,
        currentFormerStatus: "CURRENT",
        stateId,
        districtId,
        parliamentConstituencyId: pcId,
        assemblyConstituencyId: acId
      });
      const personId = saved?.id;
      if (personId) {
        const num = (v: any) => (v === "" || v == null ? undefined : Number(v));
        for (const platform of PLATFORMS) {
          const draft = slot.platformDrafts[platform];
          if (!draft.hasAccount) continue;
          const existing = accounts.find(
            (row) => row.personId === personId && String(row.platform || "").toLowerCase() === platform
          );
          await politicalApiService.savePiAccount(userId, {
            id: existing?.id,
            personId,
            platform,
            partyId: slot.partyId,
            profileUrl: draft.hasAccount === "yes" ? String(draft.profileUrl || "").trim() : "",
            followers: draft.hasAccount === "yes" ? num(draft.followers) : undefined,
            verificationStatus: draft.hasAccount === "no" ? "NO_ACCOUNT" : draft.verified === "yes" ? "VERIFIED" : "PENDING"
          });
        }
      }
      flash(`${LEADER_SLOTS[index].label} saved.`);
      const [leaderRows, accountRows] = await Promise.all([loadLeaders(), loadAccounts()]);
      hydrateLeaderSlots(leaderRows, accountRows);
      setEntryGroup("leaders");
    } catch (err: any) {
      flash(err.message, true);
    } finally {
      setSaving(null);
      setSavingSlot(null);
    }
  };

  const deleteConstituency = async (row: any) => {
    if (!canDelete || !row?.id) return;
    if (!window.confirm(`Delete constituency ${row.assemblyName || row.assemblyConstituencyId}?`)) return;
    try {
      await politicalApiService.deletePiConstituency(userId, row.id);
      flash("Constituency deleted.");
      await loadConstituencies();
      await refreshDashboard();
    } catch (err: any) {
      flash(err.message, true);
    }
  };

  const deleteLeaderRecord = async (row: any) => {
    if (!canDelete || !row?.id) return;
    if (!window.confirm(`Delete ${leaderKindLabel(row.leaderKind)} ${row.name || ""}?`)) return;
    try {
      await politicalApiService.deletePiLeader(userId, row.id);
      flash("Leader deleted.");
      const [leaderRows, accountRows] = await Promise.all([loadLeaders(), loadAccounts()]);
      hydrateLeaderSlots(leaderRows, accountRows);
      await refreshDashboard();
    } catch (err: any) {
      flash(err.message, true);
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

  const patchLeaderSlot = (index: number, patch: Partial<LeaderSlotState>) => {
    setLeaderSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  };

  const setSlotPlatformField = (index: number, platform: (typeof PLATFORMS)[number], field: keyof PlatformDraft, value: string) => {
    setLeaderSlots((prev) =>
      prev.map((slot, i) =>
        i === index
          ? { ...slot, platformDrafts: { ...slot.platformDrafts, [platform]: { ...slot.platformDrafts[platform], [field]: value } } }
          : slot
      )
    );
  };

  const downloadSavedExcel = () => {
    const header = ["Constituency", "District", "Voters", "Leaders", "Collected by", "Date", "Status"];
    const lines = [
      header.join(","),
      ...constRows.map((row) =>
        [
          row.assemblyName || row.assemblyConstituencyId || "",
          row.districtName || selectedDistrictName || "",
          row.totalVoters ?? "",
          row.leaderCount ?? leaders.filter((l) => l.assemblyConstituencyId === row.assemblyConstituencyId).length,
          row.enteredByName || "",
          (row.dataCollectionDate || "").slice(0, 10),
          row.verificationStatus || ""
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      )
    ];
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leaderlens-constituencies-${todayIsoDate()}.xls`;
    a.click();
    URL.revokeObjectURL(a.href);
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
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4A24C] font-bold">Political Intelligence</p>
          <h1 className="text-2xl font-display text-[#F5EFE0]">
            {tab === "constituencies" ? "Constituency Data Form" : tab === "intelligence" ? "Political Intelligence" : "Constituency data collection"}
          </h1>
          {tab === "constituencies" && (
            <p className="text-sm text-[#B9AF95] mt-1">Fill one constituency at a time. Takes about 10 minutes.</p>
          )}
        </div>
      </header>

      <div className={`grid gap-1.5 ${visibleTabs.length <= 2 ? "grid-cols-2" : visibleTabs.length === 4 ? "grid-cols-4" : "grid-cols-5"}`}>
        {visibleTabs.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`min-h-10 w-full px-1 py-1.5 rounded-lg text-[9px] sm:text-[11px] font-bold uppercase tracking-wider inline-flex items-center justify-center text-center leading-tight ${
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
          {pageLoading && !dashboard ? (
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
            <h2 className="text-sm font-bold text-[#F5EFE0]">1 · Constituency</h2>
            {selectedAssemblyName ? (
              <p className="text-[11px] text-[#B9AF95] mt-1">
                {selectedAssemblyName}{selectedDistrictName ? ` · ${selectedDistrictName}` : ""}
              </p>
            ) : null}
            <div className="mt-3 space-y-2">
              <GeoFilters
                stateId={stateId} setStateId={setStateId}
                districtId={districtId} setDistrictId={setDistrictId}
                pcId={pcId} setPcId={setPcId}
                acId={acId} setAcId={setAcId}
                states={states} districts={districts} pcs={filteredPcs} acs={filteredAcs}
                markRequired
                showParliament={false}
              />
              <Field label="Collected by *" value={constForm.enteredByName || ""} onChange={(v) => setConstForm({ ...constForm, enteredByName: v })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {ENTRY_GROUPS.map((group) => (
              <button
                type="button"
                key={group.id}
                onClick={() => setEntryGroup(group.id)}
                className={`h-10 w-full px-2 rounded-lg text-[11px] font-bold uppercase tracking-wider inline-flex items-center justify-center ${
                  entryGroup === group.id ? "bg-[#D4A24C] text-[#071322]" : "text-[#B9AF95] border border-[#22405E]"
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>

          {entryGroup === "constituency" && (
          <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <form noValidate onSubmit={saveConstituency} className={`${CARD} space-y-3`}>
              <h2 className="text-sm font-bold text-[#F5EFE0]">Constituency entry</h2>
              <Field label="Total voters" type="number" value={constForm.totalVoters || ""} onChange={(v) => setConstForm({ ...constForm, totalVoters: v })} />
              <p className="text-[11px] text-[#D4A24C]">Estimated social media users (not observed counts)</p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Est. Facebook users" type="number" value={constForm.estimatedFacebookUsers || ""} onChange={(v) => setConstForm({ ...constForm, estimatedFacebookUsers: v })} />
                <Field label="Est. Instagram users" type="number" value={constForm.estimatedInstagramUsers || ""} onChange={(v) => setConstForm({ ...constForm, estimatedInstagramUsers: v })} />
                <Field label="Est. X users" type="number" value={constForm.estimatedXUsers || ""} onChange={(v) => setConstForm({ ...constForm, estimatedXUsers: v })} />
                <Field label="Est. YouTube users" type="number" value={constForm.estimatedYouTubeUsers || ""} onChange={(v) => setConstForm({ ...constForm, estimatedYouTubeUsers: v })} />
              </div>
              <Field label="Remarks" value={constForm.remarks || ""} onChange={(v) => setConstForm({ ...constForm, remarks: v })} />
              <button type="submit" className={BTN} disabled={!!saving || !acId || !canEdit}>{saving === "constituency" ? "Saving…" : constForm.id ? "Save changes" : "Save constituency"}</button>
              {ok && !error && ok.startsWith("Saved") && (
                <p className="text-[11px] text-emerald-300">{ok}</p>
              )}
            </form>
            <div className={CARD}>
              <h2 className="text-sm font-bold text-[#F5EFE0] mb-2">Saved constituencies ({constRows.length})</h2>
              {constRows.length === 0 ? <EmptyState text="No constituency statistics for this filter." /> : (
                <div className="space-y-2">
                  {constRows.map((row) => {
                    const leaderCount = row.leaderCount ?? leaders.filter((l) => l.assemblyConstituencyId === row.assemblyConstituencyId).length;
                    return (
                      <div key={row.id} className="w-full text-left p-2.5 rounded-lg border border-[#22405E]">
                        <button
                          type="button"
                          className="w-full text-left hover:bg-[#131E2D] rounded-lg"
                          onClick={() => {
                            if (row.districtId) setDistrictId(row.districtId);
                            if (row.parliamentConstituencyId) setPcId(row.parliamentConstituencyId);
                            if (row.assemblyConstituencyId) setAcId(row.assemblyConstituencyId);
                            setConstForm({
                              ...row,
                              enteredByName: row.enteredByName || constForm.enteredByName,
                              dataCollectionDate: (row.dataCollectionDate || "").slice(0, 10)
                            });
                          }}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <span className="font-bold text-[#F5EFE0] break-words">{row.assemblyName || row.assemblyConstituencyId}{row.districtName ? ` · ${row.districtName}` : selectedDistrictName ? ` · ${selectedDistrictName}` : ""}</span>
                            <span className="text-[11px] text-[#B9AF95]">{leaderCount} leaders · {row.enteredByName || "—"}</span>
                          </div>
                          <p className="text-[11px] text-[#B9AF95] mt-1">Voters {row.totalVoters ?? "—"} · {(row.dataCollectionDate || "").slice(0, 10) || "—"} · {row.verificationStatus}</p>
                          {canEdit ? <p className="text-[11px] text-[#D4A24C] mt-1 font-semibold uppercase tracking-wider">Edit / modify</p> : null}
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-200 text-[11px] font-bold uppercase tracking-wider"
                            onClick={() => deleteConstituency(row)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <button type="button" className="px-4 py-2 rounded-xl border border-[#22405E] text-[#F5EFE0] text-xs font-bold uppercase tracking-wider" onClick={downloadSavedExcel}>
                    Download Excel
                  </button>
                </div>
              )}
            </div>
          </div>
          {selectedDistrictProgress && (
            <div className={CARD}>
              <h2 className="text-sm font-bold text-[#F5EFE0]">{selectedDistrictProgress.name}</h2>
              <p className="text-sm text-[#D4A24C] mt-1">{selectedDistrictProgress.constituenciesEntered}/{selectedDistrictProgress.totalConstituencies} entered · {selectedDistrictProgress.constituenciesPending} pending</p>
              <p className="text-[11px] text-[#B9AF95]">{selectedDistrictProgress.totalLeaders} leaders · {selectedDistrictProgress.totalAccounts} accounts · {selectedDistrictProgress.verifiedAccounts} verified</p>
            </div>
          )}
          </>
          )}

          {entryGroup === "leaders" && (
            <div className="space-y-4">
              {leaderSlots.map((slot, index) => {
                const activePlatform = slot.activePlatform;
                const drafts = slot.platformDrafts;
                return (
                  <form
                    noValidate
                    key={slot.leaderKind}
                    onSubmit={(e) => saveLeader(e, index)}
                    className={`${CARD} space-y-3 min-w-0`}
                  >
                    <h2 className="text-sm font-bold text-[#F5EFE0]">
                      {index + 2} · {LEADER_SLOTS[index].label}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Field label="Name *" value={slot.name || ""} placeholder="Full name" onChange={(v) => patchLeaderSlot(index, { name: v })} />
                      <div>
                        <label className={LABEL}>Party</label>
                        <select className={INPUT} value={slot.partyId || ""} onChange={(e) => patchLeaderSlot(index, { partyId: e.target.value })}>
                          <option value="">Select</option>
                          {parties.map((p) => <option key={p.id} value={p.id}>{p.shortName || p.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {PLATFORMS.map((platform) => {
                        const answered = drafts[platform].hasAccount === "yes" || drafts[platform].hasAccount === "no";
                        const active = activePlatform === platform;
                        return (
                          <button
                            type="button"
                            key={platform}
                            onClick={() => patchLeaderSlot(index, { activePlatform: platform })}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
                              active ? "bg-[#D4A24C] text-[#071322]" : "border border-[#22405E] text-[#F5EFE0]"
                            }`}
                          >
                            {PLATFORM_LABEL[platform]}
                            <span className={`w-1.5 h-1.5 rounded-full ${answered ? "bg-emerald-400" : "bg-[#6B7280]"}`} />
                          </button>
                        );
                      })}
                    </div>
                    <div className="p-2.5 rounded-lg border border-[#22405E] space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className={LABEL}>{PLATFORM_LABEL[activePlatform]}: has account?</label>
                          <select
                            className={INPUT}
                            value={drafts[activePlatform].hasAccount}
                            onChange={(e) => setSlotPlatformField(index, activePlatform, "hasAccount", e.target.value)}
                          >
                            <option value="">Select</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        {drafts[activePlatform].hasAccount === "yes" && (
                          <div>
                            <label className={LABEL}>Verified (blue tick)?</label>
                            <select
                              className={INPUT}
                              value={drafts[activePlatform].verified}
                              onChange={(e) => setSlotPlatformField(index, activePlatform, "verified", e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                        )}
                      </div>
                      {drafts[activePlatform].hasAccount === "yes" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Field label="Followers / subscribers" type="number" value={drafts[activePlatform].followers} onChange={(v) => setSlotPlatformField(index, activePlatform, "followers", v)} />
                          <Field label="Profile link" value={drafts[activePlatform].profileUrl} onChange={(v) => setSlotPlatformField(index, activePlatform, "profileUrl", v)} />
                        </div>
                      )}
                    </div>
                    <label className={LABEL}>Political role</label>
                    <select className={INPUT} value={slot.politicalRole} onChange={(e) => patchLeaderSlot(index, { politicalRole: e.target.value })}>
                      {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                    </select>
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" className={BTN} disabled={!!saving || !acId || !canEdit}>
                        {saving === "leader" && savingSlot === index ? "Saving…" : slot.id ? `Save changes · ${LEADER_SLOTS[index].label}` : `Save ${LEADER_SLOTS[index].label}`}
                      </button>
                      {canDelete && slot.id && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/40 text-rose-200 text-xs font-bold uppercase tracking-wider"
                          onClick={() => deleteLeaderRecord({ id: slot.id, name: slot.name, leaderKind: slot.leaderKind })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </form>
                );
              })}
              <div className={CARD}>
                <h2 className="text-sm font-bold text-[#F5EFE0] mb-2">Leaders in this constituency</h2>
                {leaders.length === 0 ? <EmptyState text="No leaders for this geography." /> : (
                  <div className="space-y-2">
                    {leaders.map((row) => {
                      const party = partyById[row.partyId];
                      return (
                        <div
                          key={row.id}
                          className="w-full text-left p-2.5 rounded-lg border border-[#22405E]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#F5EFE0]">{row.name}</span>
                            <span className="text-[10px] font-bold" style={{ color: party?.primaryColor || "#D4A24C" }}>{row.partyId}</span>
                          </div>
                          <p className="text-[11px] text-[#B9AF95]">{leaderKindLabel(row.leaderKind)}{(row.roles || []).length ? ` · ${(row.roles || []).map((r: any) => r.politicalRole).join(" · ")}` : ""}</p>
                          <p className="text-[11px] text-[#B9AF95]">Contact {row.contactId || "—"} · {row.verificationStatus}</p>
                          {canDelete && (
                            <button
                              type="button"
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-200 text-[11px] font-bold uppercase tracking-wider"
                              onClick={() => deleteLeaderRecord(row)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </section>
      )}

      {tab === "verify" && (
        <section className={CARD}>
          <div className="flex flex-wrap gap-2 mb-3">
            {["PENDING", "NEEDS_RECHECK", "VERIFIED", "REJECTED"].map((s) => (
              <button type="button" key={s} onClick={() => setQueueStatus(s)} className={`px-2 py-1 rounded text-[10px] font-bold border ${queueStatus === s ? "bg-[#D4A24C] text-[#071322]" : "border-[#22405E] text-[#B9AF95]"}`}>{s}</button>
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
        <section className="flex flex-col lg:flex-row gap-4 items-start">
          <aside className={`${CARD} w-full lg:w-64 shrink-0 space-y-3 min-w-0`}>
            <h2 className="text-sm font-bold text-[#F5EFE0]">Filters</h2>
            <div>
              <label className={LABEL}>State</label>
              <select className={INPUT} value={stateId} onChange={(e) => { setStateId(e.target.value); setDistrictId(""); setPcId(""); setAcId(""); }}>
                {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>District</label>
              <select className={INPUT} value={districtId} onChange={(e) => { setDistrictId(e.target.value); setPcId(""); setAcId(""); }}>
                <option value="">Select district</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Constituency</label>
              <select
                className={`${INPUT} disabled:opacity-60 disabled:cursor-not-allowed`}
                value={districtId ? acId : ""}
                disabled={!districtId}
                onChange={(e) => {
                  const id = e.target.value;
                  setAcId(id);
                  const ac = filteredAcs.find((a) => a.id === id);
                  const nextPc = ac?.parliamentConstituencyId || ac?.parliamentId || "";
                  if (nextPc) setPcId(nextPc);
                }}
              >
                <option value="">{districtId ? "All in district" : "Select district first"}</option>
                {districtId ? filteredAcs.map((a) => <option key={`${a.id}-${a.name}`} value={a.id}>{a.name}</option>) : null}
              </select>
            </div>
            <div>
              <label className={LABEL}>Platform</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setIntelPlatform("")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${!intelPlatform ? "bg-[#3B82F6] text-white" : "border border-[#22405E] text-[#F5EFE0]"}`}
                >
                  All
                </button>
                {PLATFORMS.map((platform) => (
                  <button
                    type="button"
                    key={platform}
                    onClick={() => setIntelPlatform(platform)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${intelPlatform === platform ? "bg-[#3B82F6] text-white" : "border border-[#22405E] text-[#F5EFE0]"}`}
                  >
                    {PLATFORM_LABEL[platform]}
                  </button>
                ))}
              </div>
            </div>
          </aside>
          <div className="flex-1 min-w-0 space-y-4">
            {!districtId ? (
              <EmptyState text="Select a district to see constituency reach." />
            ) : acId ? (
              <IntelligenceConstituency
                intel={intel || { constituencyCards: [], leaders: [], audienceEstimates: {} }}
                acId={acId}
                acName={selectedAssemblyName || filteredAcs.find((a) => a.id === acId)?.name || acId}
                districtName={selectedDistrictName}
                stateName={states.find((s) => s.id === stateId)?.name || stateId}
                platform={intelPlatform}
                partyById={partyById}
              />
            ) : (
              <IntelligenceDistrict
                intel={intel || { constituencyCards: [] }}
                districtName={selectedDistrictName || "District"}
                assemblies={filteredAcs}
                onOpen={(id) => {
                  setAcId(id);
                  const ac = filteredAcs.find((a) => a.id === id);
                  const nextPc = ac?.parliamentConstituencyId || ac?.parliamentId || "";
                  if (nextPc) setPcId(nextPc);
                }}
                partyById={partyById}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
};

function platformDetail(leader: any, platform: string) {
  const fromMap = leader?.platforms?.[platform];
  if (fromMap) return fromMap;
  const acc = (leader?.accounts || []).find((a: any) => String(a.platform || "").toLowerCase() === platform);
  if (!acc) return null;
  return {
    followers: acc.followers,
    noAccount: Boolean(acc.noAccount || acc.verificationStatus === "NO_ACCOUNT"),
    verified: acc.verificationStatus === "VERIFIED",
    profileUrl: acc.profileUrl
  };
}

function partyLabel(partyById: Record<string, PoliticalParty>, partyId?: string, fallback?: string) {
  const party = partyId ? partyById[partyId] : undefined;
  return party?.shortName || party?.name || fallback || partyId || "";
}

function IntelligenceDistrict({
  intel,
  districtName,
  assemblies,
  onOpen,
  partyById
}: {
  intel: any;
  districtName: string;
  assemblies: any[];
  onOpen: (id: string) => void;
  partyById: Record<string, PoliticalParty>;
}) {
  const byId: Record<string, any> = {};
  for (const card of intel.constituencyCards || []) {
    if (card?.assemblyConstituencyId) byId[card.assemblyConstituencyId] = card;
  }
  const rows = (assemblies.length ? assemblies : intel.constituencyCards || []).map((ac: any) => {
    const id = ac.id || ac.assemblyConstituencyId;
    const card = byId[id] || {};
    return {
      assemblyConstituencyId: id,
      assemblyName: ac.name || card.assemblyName || id,
      partyId: card.partyId,
      partyColor: card.partyColor,
      mlaName: card.mlaName,
      followers: card.followers,
      estimatedUsers: card.estimatedUsers,
      reachPercent: card.reachPercent
    };
  });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-display text-[#F5EFE0]">{districtName} District</h2>
        <p className="text-sm text-[#B9AF95] mt-1">{rows.length} {rows.length === 1 ? "constituency" : "constituencies"} · tap one to open</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {rows.map((row: any) => {
          const pct = row.reachPercent == null ? 0 : Number(row.reachPercent);
          return (
            <button
              type="button"
              key={row.assemblyConstituencyId}
              onClick={() => onOpen(row.assemblyConstituencyId)}
              className={`${CARD} text-left w-full min-w-0`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-[#F5EFE0] break-words">{row.assemblyName}</span>
                {row.partyId ? (
                  <span className="text-[10px] font-bold uppercase shrink-0" style={{ color: row.partyColor || "#D4A24C" }}>
                    {partyLabel(partyById, row.partyId)}
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-[#B9AF95] mt-1 break-words">MLA: {row.mlaName || "—"}</p>
              <p className="text-3xl font-display text-[#F5EFE0] mt-3">{row.reachPercent == null ? "—" : `${Math.round(pct)}%`}</p>
              <p className="text-[11px] text-[#B9AF95]">of all users reached</p>
              <div className="mt-2 h-1.5 rounded bg-[#142B45]">
                <div className="h-1.5 rounded bg-[#D4A24C]" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
              </div>
              <p className="text-[11px] text-[#B9AF95] mt-2">
                {formatCompactCount(row.followers)} followers · {formatCompactCount(row.estimatedUsers)} users
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function IntelligenceConstituency({
  intel,
  acId,
  acName,
  districtName,
  stateName,
  platform,
  partyById
}: {
  intel: any;
  acId: string;
  acName: string;
  districtName: string;
  stateName: string;
  platform: string;
  partyById: Record<string, PoliticalParty>;
}) {
  const card = (intel.constituencyCards || []).find((c: any) => c.assemblyConstituencyId === acId) || {};
  const estimates = card.platformEstimates || {
    facebook: intel.audienceEstimates?.facebook || 0,
    instagram: intel.audienceEstimates?.instagram || 0,
    x: intel.audienceEstimates?.x || 0,
    youtube: intel.audienceEstimates?.youtube || 0
  };
  const leaders = (intel.leaders || []).filter((l: any) => l.assemblyConstituencyId === acId);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-display text-[#F5EFE0]">{acName}</h2>
        <p className="text-sm text-[#B9AF95] mt-1">
          {[districtName, stateName].filter(Boolean).join(" · ")}
          {districtName || stateName ? " · " : ""}
          estimated platform users in this area
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PLATFORMS.map((plat) => (
          <div key={plat} className={`${CARD} text-center`}>
            <span className="text-[11px] text-[#B9AF95] block">{PLATFORM_LABEL[plat]}</span>
            <span className="text-2xl font-display font-bold text-[#F5EFE0] mt-1 block">{formatCompactCount(estimates[plat])}</span>
            <span className="text-[11px] text-[#B9AF95]">users</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {leaders.length ? leaders.map((leader: any) => {
          const sitting = isSittingMlaKind(leader.leaderKind);
          return (
            <div key={leader.id} className={`${CARD} min-w-0 space-y-3`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-[#F5EFE0] break-words">{leader.name}</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  {leader.partyId ? (
                    <span className="text-[10px] font-bold uppercase" style={{ color: leader.partyColor || "#D4A24C" }}>
                      {partyLabel(partyById, leader.partyId, leader.partyName)}
                    </span>
                  ) : null}
                  {sitting ? <span className="text-[10px] text-[#B9AF95]">Sitting MLA</span> : null}
                </div>
              </div>
              {PLATFORMS.map((plat) => {
                const detail = platformDetail(leader, plat);
                const estimate = Number(estimates[plat] || 0);
                const noAccount = Boolean(detail?.noAccount);
                const followers = noAccount ? null : detail?.followers;
                const pct = followers != null && estimate ? Math.round((Number(followers) / estimate) * 100) : 0;
                const hasAccount = !noAccount && (Boolean(detail?.verified) || followers != null);
                const emphasize = !platform || platform === plat;
                return (
                  <div key={plat} className={`min-w-0 ${emphasize ? "" : "opacity-70"}`}>
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-[#F5EFE0] inline-flex items-center gap-1 min-w-0">
                        {PLATFORM_LABEL[plat]}
                        {hasAccount ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : null}
                      </span>
                      {noAccount ? (
                        <span className="text-rose-400 font-bold shrink-0">No account</span>
                      ) : (
                        <span className="text-[#B9AF95] text-right">
                          {formatCompactCount(followers)} of {formatCompactCount(estimate)}
                          {followers != null && estimate ? <span className="text-[#F5EFE0] font-bold"> = {pct}%</span> : null}
                        </span>
                      )}
                    </div>
                    {!noAccount ? (
                      <div className="mt-1 h-1.5 rounded bg-[#142B45]">
                        <div className="h-1.5 rounded bg-[#D4A24C]" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        }) : <EmptyState text="No leaders entered for this constituency." />}
      </div>
    </div>
  );
}

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

function Field({ label, value, onChange, type = "text", required = false, placeholder }: { label: string; value: any; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div className="min-w-0">
      <label className={LABEL}>{label}{required ? " *" : ""}</label>
      <input className={INPUT} type={type} value={value} required={required} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
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
  markRequired?: boolean;
  showParliament?: boolean;
}) {
  const showParliament = props.showParliament !== false;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div className="min-w-0">
        <label className={LABEL}>State</label>
        <select className={INPUT} value={props.stateId} onChange={(e) => { props.setStateId(e.target.value); props.setDistrictId(""); props.setPcId(""); props.setAcId(""); }}>
          {props.states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="min-w-0">
        <label className={LABEL}>District{props.markRequired ? " *" : ""}</label>
        <select className={INPUT} value={props.districtId} onChange={(e) => { props.setDistrictId(e.target.value); props.setPcId(""); props.setAcId(""); }}>
          <option value="">Select district</option>
          {props.districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      {showParliament && (
      <div className="min-w-0">
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
      )}
      <div className="min-w-0">
        <label className={LABEL}>Constituency{props.markRequired ? " *" : ""}</label>
        <select
          className={`${INPUT} disabled:opacity-60 disabled:cursor-not-allowed`}
          value={props.districtId ? props.acId : ""}
          disabled={!props.districtId}
          onChange={(e) => {
            const id = e.target.value;
            props.setAcId(id);
            const ac = props.acs.find((a) => a.id === id);
            const nextPc = ac?.parliamentConstituencyId || ac?.parliamentId || "";
            if (nextPc) props.setPcId(nextPc);
          }}
        >
          <option value="">{props.districtId ? "Select AC" : "Select district first"}</option>
          {props.districtId ? props.acs.map((a) => <option key={`${a.id}-${a.name}`} value={a.id}>{a.name}</option>) : null}
        </select>
      </div>
    </div>
  );
}

export default PoliticalIntelligence;
