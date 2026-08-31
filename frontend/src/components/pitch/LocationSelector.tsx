import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Sparkles,
  Search,
  Database,
  Award,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  UserCheck,
  User,
  Flag
} from "lucide-react";
import { StateInfo, ParliamentInfo, AssemblyInfo, ElectedRepresentative, CandidateType } from "../../types";
import { politicalApiService } from "../../services/api";
import { formatLakhs } from "../../calculations";
import { usePartyTheme } from "../../context/PartyThemeContext";

interface LocationSelectorProps {
  onGenerateAudit: (
    stateId: string,
    parliamentId: string,
    assemblyId: string,
    stateObj?: StateInfo,
    parliamentObj?: ParliamentInfo,
    assemblyObj?: AssemblyInfo | null,
    representative?: ElectedRepresentative | null,
    clientType?: CandidateType
  ) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ onGenerateAudit }) => {
  const { currentParty, partyName, partyLogo, partySymbolEmoji, isPartyThemeActive } = usePartyTheme();
  const [logoErr, setLogoErr] = useState(false);

  const [states, setStates] = useState<StateInfo[]>([]);
  const [parliaments, setParliaments] = useState<ParliamentInfo[]>([]);
  const [assemblies, setAssemblies] = useState<AssemblyInfo[]>([]);

  const [selectedState, setSelectedState] = useState<string>("AP");
  const [selectedParliament, setSelectedParliament] = useState<string>("");
  const [selectedAssembly, setSelectedAssembly] = useState<string>("");
  const [currentAssemblyDetails, setCurrentAssemblyDetails] = useState<AssemblyInfo | null>(null);

  // Current Representative state
  const [currentRep, setCurrentRep] = useState<ElectedRepresentative | null>(null);
  const [repStatus, setRepStatus] = useState<"CURRENT" | "FORMER" | "VACANT" | "UNAVAILABLE" | "LOADING">("LOADING");
  const [clientType, setClientType] = useState<CandidateType>("CURRENT_MLA");

  const [searchFilter, setSearchFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial states list
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const stateList = await politicalApiService.getStates();
      if (!mounted) return;
      setStates(stateList);

      const defaultState = stateList.find((s) => s.id === "AP") ? "AP" : stateList[0]?.id || "AP";
      setSelectedState(defaultState);

      const parlList = await politicalApiService.getParliamentsByState(defaultState);
      if (!mounted) return;
      setParliaments(parlList);

      if (parlList.length > 0) {
        const defaultPc = parlList[0].id;
        setSelectedParliament(defaultPc);

        const assemList = await politicalApiService.getAssembliesByParliament(defaultPc);
        if (!mounted) return;
        setAssemblies(assemList);

        if (assemList.length > 0) {
          setSelectedAssembly(assemList[0].id);
          setCurrentAssemblyDetails(assemList[0]);
        }
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch verified representative whenever assembly changes
  useEffect(() => {
    if (!selectedAssembly) {
      setCurrentRep(null);
      setRepStatus("UNAVAILABLE");
      return;
    }
    let mounted = true;
    (async () => {
      setRepStatus("LOADING");
      const res = await politicalApiService.getCurrentRepresentative(selectedAssembly);
      if (!mounted) return;
      if (res.status === "CURRENT" && res.representative) {
        setCurrentRep(res.representative);
        setRepStatus("CURRENT");
      } else if (res.status === "VACANT") {
        setCurrentRep(null);
        setRepStatus("VACANT");
      } else {
        setCurrentRep(null);
        setRepStatus("UNAVAILABLE");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedAssembly]);

  const handleStateChange = async (stateId: string) => {
    setSelectedState(stateId);
    setSelectedParliament("");
    setSelectedAssembly("");
    setCurrentAssemblyDetails(null);
    setSearchFilter("");
    setParliaments([]);
    setAssemblies([]);

    const parlList = await politicalApiService.getParliamentsByState(stateId);
    setParliaments(parlList);

    if (parlList.length > 0) {
      const firstPc = parlList[0].id;
      setSelectedParliament(firstPc);
      const assemList = await politicalApiService.getAssembliesByParliament(firstPc);
      setAssemblies(assemList);
      if (assemList.length > 0) {
        setSelectedAssembly(assemList[0].id);
        setCurrentAssemblyDetails(assemList[0]);
      }
    }
  };

  const handleParliamentChange = async (parliamentId: string) => {
    setSelectedParliament(parliamentId);
    setSelectedAssembly("");
    setCurrentAssemblyDetails(null);
    setSearchFilter("");
    setAssemblies([]);

    const assemList = await politicalApiService.getAssembliesByParliament(parliamentId);
    setAssemblies(assemList);
    if (assemList.length > 0) {
      setSelectedAssembly(assemList[0].id);
      setCurrentAssemblyDetails(assemList[0]);
    }
  };

  const handleAssemblyChange = (assemblyId: string) => {
    setSelectedAssembly(assemblyId);
    const found = assemblies.find((a) => a.id === assemblyId) || null;
    setCurrentAssemblyDetails(found);
  };

  const filteredAssemblies = useMemo(() => {
    if (!searchFilter.trim()) return assemblies;
    const q = searchFilter.toLowerCase();
    return assemblies.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        String(a.number || "").includes(q)
    );
  }, [assemblies, searchFilter]);

  const currentStateObj = states.find((s) => s.id === selectedState);
  const currentParliamentObj = parliaments.find((p) => p.id === selectedParliament);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedState && selectedParliament && selectedAssembly) {
      const matchedAssembly = currentAssemblyDetails || assemblies.find((a) => a.id === selectedAssembly) || null;
      onGenerateAudit(
        selectedState,
        selectedParliament,
        selectedAssembly,
        currentStateObj,
        currentParliamentObj,
        matchedAssembly,
        currentRep,
        clientType
      );
    }
  };

  const fieldClass = isPartyThemeActive
    ? "w-full appearance-none bg-white border-2 border-slate-300 hover:border-black rounded-lg px-3.5 py-3 pr-9 text-[14px] font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors cursor-pointer shadow-sm"
    : "w-full appearance-none bg-[#0F2338] border border-[#22405E] hover:border-[#D4A24C] rounded-md px-3.5 py-3 pr-9 text-[13.5px] font-medium text-[#F5EFE0] focus:outline-none focus:ring-2 focus:ring-[#D4A24C] focus:border-transparent transition-colors cursor-pointer";

  return (
    <div
      className={isPartyThemeActive ? "transition-colors duration-300 relative" : "hero-dark"}
      style={
        isPartyThemeActive
          ? {
              background: "transparent",
              color: "#0F172A"
            }
          : undefined
      }
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-16 lg:pb-24">
        {/* Editorial masthead */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end mb-10 lg:mb-14 animate-rise">
          <div className="lg:col-span-8 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`h-px w-10 ${isPartyThemeActive ? "bg-black/30" : "gold-shimmer"}`} aria-hidden />
              {isPartyThemeActive && partyName ? (
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-black text-white rounded-full text-xs font-bold shadow-lg">
                  <span className="text-base leading-none">{partySymbolEmoji || "🏛️"}</span>
                  <span className="tracking-wide">{partyName} · Electoral Command Portal</span>
                </span>
              ) : (
                <span className="eyebrow gold-text">Vol. I · Strength Intelligence</span>
              )}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                isPartyThemeActive ? "bg-black/10 border border-black/20 text-black" : "border border-[#D4A24C]/40 text-[#E9C77A]"
              }`}>
                <Sparkles className="w-3 h-3" /> Executive Intelligence
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono-data ${
                isPartyThemeActive ? "bg-black/10 border border-black/20 text-black font-semibold" : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              }`}>
                <Database className="w-2.5 h-2.5" /> Verified ECI Records
              </span>
            </div>

            <h1 className={`font-display text-[56px] sm:text-[80px] lg:text-[98px] leading-[0.94] tracking-[-0.03em] ${
              isPartyThemeActive ? "text-black" : "cream-text"
            }`}>
              <span>Constituency</span><br />
              <span className={`italic ${isPartyThemeActive ? "text-[#92400E]" : "gold-text"}`}>intelligence,</span>
              <span> made legible.</span>
            </h1>

            <p className={`text-[15px] sm:text-base max-w-xl leading-relaxed ${
              isPartyThemeActive ? "text-black/85 font-medium" : "text-[#D8CFB8]"
            }`}>
              {isPartyThemeActive && partyName ? (
                <>
                  Executive-grade electoral intelligence, ground sentiment triage, and cadre mobilization workspace configured for{" "}
                  <strong className="text-black font-extrabold underline decoration-black/40 underline-offset-4">{partyName}</strong>.
                </>
              ) : (
                "A quiet, executive-grade view of candidate footprint, competitive position and digital reach — synthesised from verified electoral records, platform APIs and constituency-level social listening."
              )}
            </p>
          </div>

          <div className="lg:col-span-4 lg:pb-3">
            <dl className={`grid grid-cols-3 gap-x-4 gap-y-2 border-t pt-5 ${
              isPartyThemeActive ? "border-black/20 text-black" : "border-[#D4A24C]/30"
            }`}>
              <Stat label="States / UTs" value={String(states.length || 36)} isParty={isPartyThemeActive} />
              <Stat label="Signals" value="31,310" isParty={isPartyThemeActive} />
              <Stat label="Refresh" value="Live" pulse isParty={isPartyThemeActive} />
            </dl>
          </div>
        </div>

        {/* Cascading selection panel */}
        <div
          data-testid="location-selector-panel"
          className={`${
            isPartyThemeActive
              ? "bg-white/95 text-slate-900 border-2 border-black/15 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.35)]"
              : "bg-[#0E2137]/80 backdrop-blur border border-[#22405E] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)]"
          } rounded-2xl overflow-hidden animate-rise-slow`}
        >
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b ${
            isPartyThemeActive ? "border-gray-200" : "border-[#22405E]"
          }`}>
            <div>
              <span className={`eyebrow ${isPartyThemeActive ? "text-amber-700 font-bold" : "gold-text"}`}>
                01 — Select target geography
              </span>
              <h2 className={`font-editorial text-[22px] font-bold mt-1 ${
                isPartyThemeActive ? "text-slate-900" : "cream-text"
              }`}>
                Where should we look?
              </h2>
            </div>
            <div className={`flex items-center gap-3 text-[11px] font-semibold tracking-wide tabular ${
              isPartyThemeActive ? "text-slate-600" : "text-[#B9AF95]"
            }`}>
              <span>Verified ECI Delimitation & Voter Records</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 sm:px-8 pt-7 pb-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FieldGroup label="State / Union Territory" step="A">
                <SelectShell>
                  <select
                    data-testid="select-state"
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className={fieldClass}
                  >
                    {states.map((st) => (
                      <option key={st.id} value={st.id} className="bg-[#0B1A2C] text-[#F5EFE0]">
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </SelectShell>
              </FieldGroup>

              <FieldGroup label="Parliament · Lok Sabha" step="B">
                <SelectShell>
                  <select
                    data-testid="select-parliament"
                    value={selectedParliament}
                    disabled={!selectedState || parliaments.length === 0}
                    onChange={(e) => handleParliamentChange(e.target.value)}
                    className={`${fieldClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {parliaments.length === 0 ? (
                      <option value="" className="bg-[#0B1A2C] text-[#F5EFE0]">Loading Parliamentary Constituencies...</option>
                    ) : (
                      parliaments.map((pc) => (
                        <option key={pc.id} value={pc.id} className="bg-[#0B1A2C] text-[#F5EFE0]">
                          {pc.name} ({pc.code})
                        </option>
                      ))
                    )}
                  </select>
                </SelectShell>
              </FieldGroup>

              <FieldGroup label="Assembly · Vidhan Sabha" step="C">
                <SelectShell>
                  <select
                    data-testid="select-assembly"
                    value={selectedAssembly}
                    disabled={!selectedParliament || assemblies.length === 0}
                    onChange={(e) => handleAssemblyChange(e.target.value)}
                    className={`${fieldClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {assemblies.length === 0 ? (
                      <option value="" className="bg-[#0B1A2C] text-[#F5EFE0]">Loading Assembly Constituencies...</option>
                    ) : (
                      assemblies.map((ac) => (
                        <option key={ac.id} value={ac.id} className="bg-[#0B1A2C] text-[#F5EFE0]">
                          {ac.name} ({ac.code})
                        </option>
                      ))
                    )}
                  </select>
                </SelectShell>
              </FieldGroup>
            </div>

            {/* Quick search input */}
            {assemblies.length > 8 && (
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#D4A24C]" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={`Search ${assemblies.length} assembly segments...`}
                  className="w-full bg-[#0B1A2C] border border-[#22405E] rounded-md pl-9 pr-4 py-2 text-xs text-[#F5EFE0] placeholder-[#8A8E9B] focus:outline-none focus:ring-1 focus:ring-[#D4A24C]"
                />
              </div>
            )}

            {currentAssemblyDetails && (
              <div
                data-testid="constituency-preview"
                className="rounded-xl border border-[#D4A24C]/25 bg-gradient-to-br from-[#122A44] to-[#0F2338] px-5 py-5 sm:px-6 sm:py-6 animate-fadeIn"
              >
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle" />
                      <span className="eyebrow text-[#B9AF95]">Constituency Intelligence Profile</span>
                    </div>
                    <h3 className="font-display text-[34px] sm:text-[40px] leading-tight mt-1 cream-text">
                      {currentAssemblyDetails.name} <span className="italic gold-text">Assembly</span> Segment
                    </h3>
                    <p className="text-xs text-[#B9AF95] mt-1">
                      {currentAssemblyDetails.code} · {currentParliamentObj?.name || selectedParliament} Parliamentary Constituency · {currentStateObj?.name || selectedState}
                    </p>
                  </div>

                  <div className="flex items-stretch divide-x divide-[#D4A24C]/20">
                    <PreviewMetric label="Total voters" value={formatLakhs(currentAssemblyDetails.totalVoters, true)} tone="cream" />
                    <PreviewMetric label="Candidates" value={String(currentAssemblyDetails.candidateCount || 4)} tone="gold" />
                    <PreviewMetric label="Digital universe" value={formatLakhs(currentAssemblyDetails.estimatedDigitalAudience, true)} tone="cream" />
                  </div>
                </div>
              </div>
            )}

            {/* CURRENT ELECTED REPRESENTATIVE (MLA) PANEL */}
            {selectedAssembly && (
              <div className="rounded-xl border border-[#D4A24C]/30 bg-[#0A1A2B]/90 p-5 sm:p-6 space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#22405E] pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#D4A24C]" />
                    <span className="eyebrow gold-text">Current Elected Representative</span>
                  </div>
                  {currentRep && (
                    <div className="flex items-center gap-2 text-[10px] text-[#B9AF95]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Verified: {new Date(currentRep.verifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  )}
                </div>

                {repStatus === "LOADING" ? (
                  <div className="py-4 text-center text-xs text-[#B9AF95] animate-pulse">
                    Verifying official representative records from Election Commission of India...
                  </div>
                ) : repStatus === "CURRENT" && currentRep ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={currentRep.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
                          alt={currentRep.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-[#D4A24C]"
                        />
                        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-[#D4A24C] text-[#0B1A2C] text-[9px] font-bold rounded-full">
                          MLA
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold uppercase tracking-wider">
                            Current MLA
                          </span>
                          <span className="text-[11px] text-[#B9AF95]">
                            {currentRep.electionType || "General Election 2024"}
                          </span>
                        </div>

                        <h4 className="text-lg font-bold text-[#F5EFE0] leading-tight">
                          {currentRep.name}
                        </h4>

                        <div className="flex items-center gap-2 text-xs">
                          {currentRep.party && (
                            <span
                              className="px-2 py-0.5 rounded text-[11px] font-semibold text-white flex items-center gap-1 shadow-2xs"
                              style={{ backgroundColor: currentRep.party.primaryColor || "#B45309" }}
                            >
                              <span>{currentRep.party.symbolEmoji || "🏛️"}</span>
                              <span>{currentRep.party.abbreviation || currentRep.party.shortName}</span>
                              <span className="text-white/80 text-[10px]">· {currentRep.party.name}</span>
                            </span>
                          )}
                          <span className="text-[#8A8E9B] text-[11px]">({currentRep.designation})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end justify-center text-xs space-y-1 bg-[#0F2338] p-3 rounded-lg border border-[#22405E]">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8A8E9B]">
                        Authoritative Source
                      </span>
                      <div className="flex items-center gap-1.5 font-medium text-[#E2DCB8]">
                        <span>{currentRep.source}</span>
                        {currentRep.sourceUrl && (
                          <a
                            href={currentRep.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#D4A24C] hover:text-[#F5EFE0]"
                            title="Verify source"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono-data">
                        ✓ Verified & Immutable Record
                      </span>
                    </div>
                  </div>
                ) : repStatus === "VACANT" ? (
                  <div className="flex items-center gap-3 p-4 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-200 text-xs">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold">Seat Currently Vacant</div>
                      <div className="text-[11px] text-amber-300/80">
                        Official Election Commission notification pending or by-election scheduled.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-[#0F2338] border border-[#22405E] rounded-lg text-[#B9AF95] text-xs">
                    <AlertCircle className="w-5 h-5 text-[#8A8E9B] shrink-0" />
                    <div>
                      <div className="font-bold text-[#E2DCB8]">Current Representative Data Unavailable</div>
                      <div className="text-[11px] text-[#8A8E9B]">
                        No verified government gazette or ECI record found for this segment. Will sync on next automated election ledger refresh.
                      </div>
                    </div>
                  </div>
                )}

                {/* Client Designation Switch */}
                <div className="pt-3 border-t border-[#22405E] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#D4A24C] flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assign Strategic Client Role For Audit</span>
                    </label>
                    <span className="text-[10px] text-[#8A8E9B]">Drives competitive positioning in report</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {[
                      {
                        type: "CURRENT_MLA" as CandidateType,
                        label: "Current MLA",
                        desc: currentRep ? `Incumbent (${currentRep.name.split(" ")[0]})` : "Incumbent MLA",
                        disabled: !currentRep
                      },
                      {
                        type: "PROSPECTIVE_CANDIDATE" as CandidateType,
                        label: "Prospective Candidate",
                        desc: "New challenger / campaign",
                        disabled: false
                      },
                      {
                        type: "MLA_IN_CHARGE" as CandidateType,
                        label: "MLA-in-Charge",
                        desc: "Constituency coordinator",
                        disabled: false
                      },
                      {
                        type: "PRIMARY_OPPOSITION" as CandidateType,
                        label: "Opposition Contender",
                        desc: "Primary opposition nominee",
                        disabled: false
                      }
                    ].map((item) => {
                      const isSelected = clientType === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          disabled={item.disabled}
                          onClick={() => setClientType(item.type)}
                          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            isSelected
                              ? "bg-[#D4A24C] text-[#0B1A2C] border-[#D4A24C] font-bold shadow-sm"
                              : "bg-[#0F2338] text-[#D8CFB8] border-[#22405E] hover:border-[#D4A24C]/60"
                          }`}
                        >
                          <div className="text-xs font-bold leading-tight">{item.label}</div>
                          <div className={`text-[10px] mt-0.5 truncate ${isSelected ? "text-[#0B1A2C]/80" : "text-[#8A8E9B]"}`}>
                            {item.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              <div className="text-xs text-[#B9AF95] flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                Real-time multi-platform intelligence audit ready
              </div>

              <button
                type="submit"
                data-testid="generate-audit-btn"
                disabled={!selectedAssembly}
                className="group inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] hover:from-[#D26A0F] hover:to-[#C99640] text-[#0B1A2C] text-[13.5px] font-bold rounded-md transition-all disabled:opacity-40 cursor-pointer shadow-[0_8px_24px_-8px_rgba(224,122,31,0.55)]"
              >
                <span>Generate audit</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        </div>

        {/* Jump-to chips */}
        {assemblies.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-2">
            <span className="eyebrow text-[#B9AF95] mr-1">Quick segments ({assemblies.length})</span>
            {filteredAssemblies.slice(0, 10).map((ac) => {
              const active = selectedAssembly === ac.id;
              return (
                <button
                  key={ac.id}
                  onClick={() => handleAssemblyChange(ac.id)}
                  data-testid={`chip-${ac.id}`}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors tabular ${
                    active
                      ? "bg-[#D4A24C] text-[#0B1A2C] border-[#D4A24C] font-semibold"
                      : "bg-transparent text-[#D8CFB8] border-[#D4A24C]/30 hover:bg-[#D4A24C]/10 hover:border-[#D4A24C]/60"
                  }`}
                >
                  {ac.name} · {formatLakhs(ac.totalVoters, true)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; pulse?: boolean; isParty?: boolean }> = ({ label, value, pulse, isParty }) => (
  <div>
    <dt className={`eyebrow ${isParty ? "text-slate-800 font-bold" : "text-[#B9AF95]"}`}>{label}</dt>
    <dd className={`font-display text-3xl mt-1 flex items-center gap-2 ${isParty ? "text-slate-950 font-bold" : "gold-text"}`}>
      {value}
      {pulse && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-subtle" />}
    </dd>
  </div>
);

const FieldGroup: React.FC<{ label: string; step: string; children: React.ReactNode; isParty?: boolean }> = ({ label, step, children, isParty }) => (
  <div className="space-y-2">
    <label className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] ${isParty ? "text-slate-800" : "text-[#B9AF95]"}`}>
      <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full border text-[9px] font-bold ${
        isParty ? "border-black bg-black text-white" : "border-[#D4A24C]/50 text-[#D4A24C]"
      }`}>
        {step}
      </span>
      {label}
    </label>
    {children}
  </div>
);

const SelectShell: React.FC<{ children: React.ReactNode; isParty?: boolean }> = ({ children, isParty }) => (
  <div className="relative">
    {children}
    <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
      isParty ? "text-black" : "text-[#D4A24C]"
    }`} />
  </div>
);

const PreviewMetric: React.FC<{ label: string; value: string; tone?: "gold" | "cream"; isParty?: boolean }> = ({ label, value, tone = "cream", isParty }) => (
  <div className="px-4 first:pl-0 last:pr-0">
    <div className={`eyebrow ${isParty ? "text-slate-700 font-bold" : "text-[#B9AF95]"}`}>{label}</div>
    <div className={`font-mono-data text-lg font-bold mt-0.5 ${
      isParty ? "text-slate-900" : (tone === "gold" ? "gold-text" : "cream-text")
    }`}>{value}</div>
  </div>
);
