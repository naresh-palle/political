import React, { useState, useEffect, useMemo } from "react";
import { ArrowRight, Check, ChevronDown, Sparkles, Search, Database } from "lucide-react";
import { StateInfo, ParliamentInfo, AssemblyInfo } from "../../types";
import { politicalApiService } from "../../services/api";
import { formatLakhs } from "../../calculations";

interface LocationSelectorProps {
  onGenerateAudit: (
    stateId: string,
    parliamentId: string,
    assemblyId: string,
    stateObj?: StateInfo,
    parliamentObj?: ParliamentInfo,
    assemblyObj?: AssemblyInfo | null
  ) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ onGenerateAudit }) => {
  const [states, setStates] = useState<StateInfo[]>([]);
  const [parliaments, setParliaments] = useState<ParliamentInfo[]>([]);
  const [assemblies, setAssemblies] = useState<AssemblyInfo[]>([]);

  const [selectedState, setSelectedState] = useState<string>("AP");
  const [selectedParliament, setSelectedParliament] = useState<string>("");
  const [selectedAssembly, setSelectedAssembly] = useState<string>("");
  const [currentAssemblyDetails, setCurrentAssemblyDetails] = useState<AssemblyInfo | null>(null);

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
        matchedAssembly
      );
    }
  };

  const fieldClass =
    "w-full appearance-none bg-[#0F2338] border border-[#22405E] hover:border-[#D4A24C] rounded-md px-3.5 py-3 pr-9 text-[13.5px] font-medium text-[#F5EFE0] focus:outline-none focus:ring-2 focus:ring-[#D4A24C] focus:border-transparent transition-colors cursor-pointer";

  return (
    <div className="hero-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-28">
        {/* Editorial masthead */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end mb-14 lg:mb-20 animate-rise">
          <div className="lg:col-span-8 space-y-7">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 gold-shimmer" aria-hidden />
              <span className="eyebrow gold-text">Vol. I · Strength Intelligence</span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#D4A24C]/40 rounded-full text-[10px] font-semibold tracking-wider text-[#E9C77A]">
                <Sparkles className="w-3 h-3" /> Executive Edition
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] font-mono-data text-emerald-400">
                <Database className="w-2.5 h-2.5" /> MongoDB Integrated
              </span>
            </div>

            <h1 className="font-display text-[64px] sm:text-[92px] lg:text-[124px] leading-[0.92] tracking-[-0.025em]">
              <span className="cream-text">Constituency</span><br />
              <span className="italic gold-text">strength,</span>
              <span className="cream-text"> made legible.</span>
            </h1>

            <p className="text-[15px] sm:text-base text-[#D8CFB8] max-w-xl leading-relaxed">
              A quiet, executive-grade view of candidate footprint, competitive position and
              digital reach — synthesised from verified electoral records, platform APIs and
              constituency-level social listening.
            </p>
          </div>

          <div className="lg:col-span-4 lg:pb-3">
            <dl className="grid grid-cols-3 gap-x-4 gap-y-2 border-t border-[#D4A24C]/30 pt-6">
              <Stat label="States / UTs" value={String(states.length || 36)} />
              <Stat label="Signals" value="31,310" />
              <Stat label="Refresh" value="Live" pulse />
            </dl>
          </div>
        </div>

        {/* Cascading selection panel (dark card floating over hero) */}
        <div
          data-testid="location-selector-panel"
          className="bg-[#0E2137]/80 backdrop-blur border border-[#22405E] rounded-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)] overflow-hidden animate-rise-slow"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-[#22405E]">
            <div>
              <span className="eyebrow gold-text">01 — Select target geography</span>
              <h2 className="font-editorial text-[22px] font-medium cream-text mt-1">
                Where should we look?
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium tracking-wide text-[#B9AF95] tabular">
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

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              <div className="text-xs text-[#B9AF95] flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                Live MongoDB connection & real-time multi-platform audit ready
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

const Stat: React.FC<{ label: string; value: string; pulse?: boolean }> = ({ label, value, pulse }) => (
  <div>
    <dt className="eyebrow text-[#B9AF95]">{label}</dt>
    <dd className="font-display text-3xl gold-text mt-1 flex items-center gap-2">
      {value}
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle" />}
    </dd>
  </div>
);

const FieldGroup: React.FC<{ label: string; step: string; children: React.ReactNode }> = ({ label, step, children }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#B9AF95]">
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-[#D4A24C]/50 text-[9px] font-bold text-[#D4A24C]">
        {step}
      </span>
      {label}
    </label>
    {children}
  </div>
);

const SelectShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative">
    {children}
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A24C]" />
  </div>
);

const PreviewMetric: React.FC<{ label: string; value: string; tone?: "gold" | "cream" }> = ({ label, value, tone = "cream" }) => (
  <div className="px-4 first:pl-0 last:pr-0">
    <div className="eyebrow text-[#B9AF95]">{label}</div>
    <div className={`font-mono-data text-lg font-semibold mt-0.5 ${tone === "gold" ? "gold-text" : "cream-text"}`}>{value}</div>
  </div>
);
