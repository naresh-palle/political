import React, { useState, useMemo, useEffect } from "react";
import { ArrowRight, ShieldCheck, MapPin, Radio, Users2, Globe2, Sparkles, GitCompare, ChevronDown } from "lucide-react";
import { LeadersLogo } from "../common/LeadersLogo";
import { VerifiedSeal, TrustBadge, TrustLevel } from "../common/TrustBadge";
import { VerifiedFeed } from "./VerifiedFeed";
import { CompareRadar } from "./CompareRadar";
import { StateInfo, AssemblyInfo } from "../../types";
import { politicalApiService } from "../../services/api";
import { MOCK_STATES, MOCK_ASSEMBLIES, MOCK_CANDIDATES } from "../../services/mockData";
import { formatLakhs } from "../../calculations";
import { Footer } from "../layout/Footer";

interface HomePageProps {
  onEnter: () => void;
}

const STATE_STATS: Record<string, { constituencies: number; signalsPerDay: number; verifiedProfiles: number; grievances: number; confidence: TrustLevel }> = {
  AP: { constituencies: 175, signalsPerDay: 31310, verifiedProfiles: 1024, grievances: 8942, confidence: "Verified" },
  TS: { constituencies: 119, signalsPerDay: 24870, verifiedProfiles: 812,  grievances: 6210, confidence: "Verified" },
  KA: { constituencies: 224, signalsPerDay: 42150, verifiedProfiles: 1348, grievances: 11020, confidence: "Verified" },
  TN: { constituencies: 234, signalsPerDay: 45680, verifiedProfiles: 1410, grievances: 12780, confidence: "Verified" },
  MH: { constituencies: 288, signalsPerDay: 51200, verifiedProfiles: 1650, grievances: 14200, confidence: "Verified" },
  UP: { constituencies: 403, signalsPerDay: 78500, verifiedProfiles: 2100, grievances: 19800, confidence: "Verified" },
  DL: { constituencies: 70,  signalsPerDay: 38400, verifiedProfiles: 890,  grievances: 7400,  confidence: "Verified" }
};

export const HomePage: React.FC<HomePageProps> = ({ onEnter }) => {
  const [states, setStates] = useState<StateInfo[]>(MOCK_STATES);
  const [stateId, setStateId] = useState<string>("AP");
  const [leftAcId, setLeftAcId] = useState<string>("KDP-AC");
  const [rightAcId, setRightAcId] = useState<string>("PRD-AC");

  useEffect(() => {
    (async () => {
      const list = await politicalApiService.getStates();
      if (list && list.length > 0) setStates(list);
    })();
  }, []);

  const stats = STATE_STATS[stateId] || {
    constituencies: states.find((s) => s.id === stateId)?.id ? 120 : 60,
    signalsPerDay: 28500,
    verifiedProfiles: 750,
    grievances: 5400,
    confidence: "Verified" as TrustLevel
  };

  const currentState = states.find((s) => s.id === stateId) || states[0] || MOCK_STATES[0];

  const eligibleAcs = useMemo(
    () => MOCK_ASSEMBLIES.filter((a) => a.stateId === stateId || stateId === "AP"),
    [stateId]
  );
  const leftAc = eligibleAcs.find((a) => a.id === leftAcId) || eligibleAcs[0] || MOCK_ASSEMBLIES[0];
  const rightAc = eligibleAcs.find((a) => a.id === rightAcId) || eligibleAcs[1] || MOCK_ASSEMBLIES[1];

  return (
    <div
      className="hero-dark min-h-screen flex flex-col relative"
      style={{
        backgroundImage: "url(./images/party-backgrounds/admin-bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#0B1A2C]/65 backdrop-blur-[0.5px]" aria-hidden="true" />
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Slim marketing header */}
        <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LeadersLogo size={36} />
            <div>
              <div className="font-display text-[20px] cream-text leading-none">
                Leader's <span className="italic gold-text">Lens</span>
              </div>
              <div className="eyebrow text-[#D4A24C] mt-1">Political Intelligence</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-[13px] text-[#D8CFB8]">
            <a href="#modules" className="hover:text-[#F5EFE0] transition-colors">Modules</a>
            <a href="#compare" className="hover:text-[#F5EFE0] transition-colors">Compare</a>
            <a href="#trust" className="hover:text-[#F5EFE0] transition-colors">Trust</a>
          </nav>

          <button
            data-testid="home-enter-btn"
            onClick={onEnter}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#0B1A2C] text-[13px] font-bold rounded-md hover:brightness-110 transition-all"
          >
            Sign in <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full animate-rise">
          <div className="lg:col-span-7 space-y-7">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="h-px w-10 gold-shimmer" aria-hidden />
              <span className="eyebrow gold-text">Volume I · Strength Intelligence</span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#D4A24C]/40 rounded-full text-[10px] font-semibold tracking-wider text-[#E9C77A]">
                <Sparkles className="w-3 h-3" /> Executive Edition
              </span>
            </div>

            <h1 className="font-display text-[52px] sm:text-[72px] lg:text-[88px] leading-[0.98] tracking-[-0.025em]">
              <span className="cream-text">The intelligence layer for</span>{" "}
              <span className="italic gold-text">political leadership.</span>
            </h1>

            <p className="text-[16px] text-[#D8CFB8] max-w-xl leading-relaxed">
              Constituency strength audits, citizen grievance operations and volunteer command
              — synthesised from verified electoral records, platform APIs and constituency-level
              social listening.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                data-testid="home-primary-cta"
                onClick={onEnter}
                className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#0B1A2C] text-[13.5px] font-bold rounded-md shadow-[0_10px_30px_-10px_rgba(224,122,31,0.6)] hover:brightness-110 transition-all"
              >
                Enter Leader's Lens
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#compare"
                data-testid="home-secondary-cta"
                className="inline-flex items-center gap-2 px-5 py-3 border border-[#D4A24C]/40 text-[#F5EFE0] text-[13px] font-medium rounded-md hover:bg-[#D4A24C]/10 transition-colors"
              >
                <GitCompare className="w-4 h-4" /> Compare constituencies
              </a>
            </div>
          </div>

          {/* Right stat block — Live State Filter */}
          <div className="lg:col-span-5 space-y-4">
            {/* State filter */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="eyebrow gold-text">Live regional pulse</div>
                <div className="font-display text-[22px] cream-text leading-tight mt-1">
                  {currentState.name}
                </div>
              </div>
              <div className="relative">
                <select
                  data-testid="home-state-select"
                  value={stateId}
                  onChange={(e) => setStateId(e.target.value)}
                  className="appearance-none bg-[#0F2338] border border-[#D4A24C]/30 hover:border-[#D4A24C]/70 rounded-md pl-3 pr-8 py-2 text-[13px] text-[#F5EFE0] font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4A24C]/40 transition-colors"
                >
                  {MOCK_STATES.map((st) => (
                    <option key={st.id} value={st.id} className="bg-[#0B1A2C] text-[#F5EFE0]">
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D4A24C]" />
              </div>
            </div>

            <div key={stateId} className="grid grid-cols-2 gap-4 animate-fadeIn">
              <HeroStat label="Constituencies" value={stats.constituencies.toLocaleString("en-IN")} note="AC coverage" confidence={stats.confidence} />
              <HeroStat label="Signals / day" value={stats.signalsPerDay.toLocaleString("en-IN")} note="Social + civic" gold confidence={stats.confidence} />
              <HeroStat label="Verified profiles" value={stats.verifiedProfiles.toLocaleString("en-IN")} note="Candidate handles" confidence="Verified" />
              <HeroStat label="Grievances" value={stats.grievances.toLocaleString("en-IN")} note="Resolved this month" gold confidence={stats.confidence} />
            </div>

            {/* Rolling verified feed */}
            <VerifiedFeed stateId={stateId} />

            <div className="rounded-xl border border-[#D4A24C]/25 bg-gradient-to-br from-[#122A44] to-[#0F2338] px-5 py-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div className="text-[12px] text-[#D8CFB8] leading-tight">
                Confidential client briefing environment.<br />
                <span className="text-[#B9AF95]">Role-based access · encrypted at rest</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compare Constituencies */}
      <section id="compare" className="relative z-10 bg-[#0E2137]/60 border-t border-[#22405E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="flex items-end justify-between gap-6 mb-8 flex-wrap">
            <div className="max-w-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-[#D4A24C]" aria-hidden />
                <span className="eyebrow gold-text">Compare · Side by side</span>
              </div>
              <h2 className="font-display text-[36px] sm:text-[48px] leading-[1.02] tracking-[-0.02em] cream-text">
                Two constituencies,{" "}
                <span className="italic gold-text">one</span> lens.
              </h2>
              <p className="text-sm text-[#B9AF95] leading-relaxed">
                Rapidly weigh strength, coverage and reach gap across any two assembly
                constituencies before diving into a full audit.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="compare-panel">
            <CompareCard
              side="A"
              acs={eligibleAcs}
              selectedId={leftAcId}
              onSelect={setLeftAcId}
              ac={leftAc}
              opposingScore={rightAc.totalVoters}
              tone="gold"
            />
            <CompareCard
              side="B"
              acs={eligibleAcs}
              selectedId={rightAcId}
              onSelect={setRightAcId}
              ac={rightAc}
              opposingScore={leftAc.totalVoters}
              tone="cream"
            />
          </div>

          {/* 5-axis radar overlay */}
          <div className="mt-6 rounded-2xl border border-[#D4A24C]/25 bg-[#0F2338]/60 p-6 grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-[#D4A24C]" aria-hidden />
                <span className="eyebrow gold-text">Strength shape · 5 axes</span>
              </div>
              <h3 className="font-display text-[28px] leading-tight tracking-[-0.01em] cream-text">
                Where each constituency <span className="italic gold-text">actually</span> wins.
              </h3>
              <p className="text-[13px] text-[#B9AF95] leading-relaxed">
                Overlay of five normalised dimensions — electorate size, digital audience,
                candidate field, digital-to-voter ratio and headroom. The bigger the shape,
                the broader the winnable ground.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#F5EFE0]">
                  <span className="w-2 h-2 rounded-sm bg-gradient-to-r from-[#E07A1F] to-[#D4A24C]" />
                  {leftAc.name}
                </span>
                <span className="text-[#5F6875] text-[11px]">vs</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#B9AF95]">
                  <span className="w-2 h-2 rounded-sm bg-[#8AA6C7]/70 border border-[#8AA6C7]" />
                  {rightAc.name}
                </span>
              </div>
            </div>
            <div className="lg:col-span-3 flex justify-center">
              <CompareRadar left={leftAc} right={rightAc} size={340} />
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-[11px] text-[#B9AF95] max-w-xl">
              Voter counts sourced from ECI electoral rolls · Digital universe estimated from
              Meta / Google audience models. Every metric carries a provenance seal.
            </p>
            <button
              onClick={onEnter}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#0B1A2C] text-[12.5px] font-bold rounded-md hover:brightness-110 transition-all"
            >
              Run full audit <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Modules section — ivory band */}
      <section id="modules" className="relative z-10 bg-[#FBFBF9] text-[#0B1A2C] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
            <div className="max-w-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-[#B45309]" aria-hidden />
                <span className="eyebrow" style={{ color: "#B45309" }}>Product · Modules</span>
              </div>
              <h2 className="font-display text-[40px] sm:text-[52px] leading-[1.02] tracking-[-0.02em] text-[#0B1A2C]">
                Five instruments,{" "}
                <span className="italic" style={{ color: "#B45309" }}>one</span> command room.
              </h2>
              <p className="text-sm text-[#5A5E6B] leading-relaxed">
                Each module is a discipline of political operations — connected, but designed
                to be used independently by directors, strategists, media analysts and field leads.
              </p>
            </div>
            <button
              onClick={onEnter}
              className="hidden md:inline-flex items-center gap-2 text-[13px] font-semibold text-[#0B1A2C] hover:text-[#B45309] transition-colors"
            >
              Sign in to access <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <ModuleCard num="01" icon={<MapPin className="w-5 h-5" />} title="Strength Audit" body={`Candidate footprint, competitive position and digital reach for any ${currentState.code} AC — synthesised in under a minute.`} accent="#B45309" />
            <ModuleCard num="02" icon={<Radio className="w-5 h-5" />} title="Grievance CRM" body="Citizen applications routed by ward, department and SLA — from WhatsApp intake to closure." accent="#0F766E" />
            <ModuleCard num="03" icon={<Users2 className="w-5 h-5" />} title="Volunteer Command" body="Squad-level operations, WhatsApp dispatch, canvassing and amplification efficiency." accent="#D4A24C" />
            <ModuleCard num="04" icon={<Globe2 className="w-5 h-5" />} title="Web Studio" body="Publish candidate landing pages with manifesto, events and grievance intake in minutes." accent="#0B1A2C" />
            <ModuleCard num="05" icon={<ShieldCheck className="w-5 h-5" />} title="Team & RBAC" body="Role-based access from Executive Briefing to Field Only — every metric respects clearance." accent="#B0203C" />
            <div className="rounded-xl border border-dashed border-[#D5D3C8] bg-[#F5F4EE] p-5 flex flex-col justify-between">
              <div>
                <div className="eyebrow text-[#8A8E9B]">Boardroom mode</div>
                <div className="font-display text-[24px] text-[#0B1A2C] mt-2 leading-tight">
                  Full-screen <span className="italic">presentation</span>
                </div>
                <p className="text-[13px] text-[#5A5E6B] mt-2 leading-relaxed">
                  Deep-navy stage with speaker-notes side panel a director can glance at during briefings.
                </p>
              </div>
              <button onClick={onEnter} className="mt-4 text-[12px] font-semibold text-[#0B1A2C] hover:text-[#B45309] inline-flex items-center gap-1">
                Preview inside <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust band */}
      <section id="trust" className="relative z-10 bg-[#F5F4EE] text-[#0B1A2C] py-14 border-t border-[#E5E3D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-px w-6 bg-[#0F766E]" aria-hidden />
              <span className="eyebrow" style={{ color: "#0F766E" }}>Methodology & trust</span>
            </div>
            <h3 className="font-display text-[30px] leading-tight tracking-[-0.01em] text-[#0B1A2C]">
              Every number carries a{" "}
              <span className="italic" style={{ color: "#0F766E" }}>provenance</span> seal.
            </h3>
            <p className="text-sm text-[#5A5E6B] max-w-md leading-relaxed">
              Metrics are tagged Verified, Estimated, Derived or Manual so estimated digital
              audiences are never confused with verified voter counts.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <TrustBadge level="Verified" />
              <TrustBadge level="Estimated" />
              <TrustBadge level="Derived" />
              <TrustBadge level="Manual" />
            </div>
          </div>
          <TrustPill label="Verified" desc="ECI rolls, official filings" tone="emerald" />
          <TrustPill label="Estimated" desc="Meta / Google audience models" tone="gold" />
        </div>
      </section>

      {/* Bottom CTA band */}
      <section className="relative z-10 hero-dark border-t border-[#22405E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="eyebrow gold-text">Ready when you are</div>
            <h4 className="font-display text-[36px] sm:text-[44px] cream-text mt-2 leading-[1.02]">
              Step into the <span className="italic gold-text">command room.</span>
            </h4>
          </div>
          <button
            onClick={onEnter}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#0B1A2C] text-[13.5px] font-bold rounded-md hover:brightness-110 transition-all"
          >
            Sign in <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Matching Platform Footer */}
      <Footer />
      </div>
    </div>
  );
};

/* ---------- Sub-components ---------- */

const HeroStat: React.FC<{ label: string; value: string; note?: string; gold?: boolean; confidence: TrustLevel }> = ({
  label, value, note, gold, confidence,
}) => (
  <div className="relative rounded-xl border border-[#D4A24C]/25 bg-[#0F2338]/70 px-5 py-4">
    <div className="flex items-start justify-between gap-2">
      <div className="eyebrow text-[#B9AF95]">{label}</div>
      <VerifiedSeal level={confidence} />
    </div>
    <div className={`font-display text-[36px] leading-none mt-2 ${gold ? "gold-text" : "cream-text"}`}>
      {value}
    </div>
    {note && <div className="text-[11px] text-[#8A8E9B] mt-2">{note}</div>}
  </div>
);

const CompareCard: React.FC<{
  side: "A" | "B";
  acs: typeof MOCK_ASSEMBLIES;
  selectedId: string;
  onSelect: (id: string) => void;
  ac: typeof MOCK_ASSEMBLIES[0];
  opposingScore: number;
  tone: "gold" | "cream";
}> = ({ side, acs, selectedId, onSelect, ac, opposingScore, tone }) => {
  const stronger = ac.totalVoters >= opposingScore;
  return (
    <div className={`rounded-2xl border ${tone === "gold" ? "border-[#D4A24C]/40 bg-gradient-to-br from-[#122A44] to-[#0F2338]" : "border-[#22405E] bg-[#0F2338]/70"} p-6 space-y-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-md ${tone === "gold" ? "bg-[#D4A24C] text-[#0B1A2C]" : "bg-[#22405E] cream-text"} inline-flex items-center justify-center text-[11px] font-bold`}>
            {side}
          </span>
          <span className="eyebrow text-[#B9AF95]">Constituency {side}</span>
        </div>
        <VerifiedSeal level="Verified" />
      </div>

      <div className="relative">
        <select
          data-testid={`compare-select-${side.toLowerCase()}`}
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full appearance-none bg-[#0B1A2C] border border-[#22405E] hover:border-[#D4A24C]/60 rounded-md pl-3 pr-9 py-2.5 text-[13.5px] text-[#F5EFE0] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4A24C]/40 transition-colors"
        >
          {acs.map((a) => (
            <option key={a.id} value={a.id} className="bg-[#0B1A2C] text-[#F5EFE0]">
              {a.name} ({a.code})
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A24C]" />
      </div>

      <h3 className={`font-display text-[34px] leading-tight tracking-[-0.01em] ${tone === "gold" ? "cream-text" : "cream-text"}`}>
        {ac.name} <span className="italic gold-text">AC</span>
      </h3>

      <div className="grid grid-cols-3 gap-3 pt-2">
        <MiniStat label="Voters" value={formatLakhs(ac.totalVoters, true)} highlight={stronger} />
        <MiniStat label="Candidates" value={String(ac.candidateCount)} />
        <MiniStat label="Digital" value={formatLakhs(ac.estimatedDigitalAudience, true)} confidence="Estimated" />
      </div>

      <div className="pt-3 border-t border-[#22405E]/60 flex items-center justify-between">
        <span className="text-[11px] text-[#B9AF95]">
          {stronger ? "Larger electorate" : "Smaller electorate"} · {ac.parliamentId.split("-")[0]} PC
        </span>
        <div className="w-24 h-1.5 bg-[#142B45] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${stronger ? "bg-gradient-to-r from-[#E07A1F] to-[#D4A24C]" : "bg-[#3A5170]"}`}
            style={{ width: `${Math.min(100, (ac.totalVoters / Math.max(ac.totalVoters, opposingScore)) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: string; highlight?: boolean; confidence?: TrustLevel }> = ({ label, value, highlight, confidence }) => (
  <div>
    <div className="eyebrow text-[#8A8E9B]">{label}</div>
    <div className={`font-mono-data text-lg font-semibold mt-1 ${highlight ? "gold-text" : "cream-text"}`}>
      {value}
    </div>
    {confidence && <VerifiedSeal level={confidence} className="mt-1" />}
  </div>
);

const ModuleCard: React.FC<{ num: string; icon: React.ReactNode; title: string; body: string; accent: string }> = ({
  num, icon, title, body, accent,
}) => (
  <div className="group rounded-xl border border-[#E5E3D8] bg-white p-5 hover:border-[#0B1A2C] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-30px_rgba(11,26,44,0.25)]">
    <div className="flex items-center justify-between">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
        {icon}
      </div>
      <span className="font-mono-data text-xs text-[#8A8E9B] tabular">{num}</span>
    </div>
    <h4 className="font-display text-[22px] text-[#0B1A2C] mt-4 leading-tight">{title}</h4>
    <p className="text-[13px] text-[#5A5E6B] mt-2 leading-relaxed">{body}</p>
  </div>
);

const TrustPill: React.FC<{ label: string; desc: string; tone: "emerald" | "gold" }> = ({ label, desc, tone }) => (
  <div className="rounded-xl border border-[#E5E3D8] bg-white p-4">
    <div className={`eyebrow ${tone === "emerald" ? "text-emerald-700" : "text-[#B45309]"}`}>{label}</div>
    <div className="text-[13px] text-[#0B1A2C] mt-1.5 font-medium">{desc}</div>
  </div>
);
