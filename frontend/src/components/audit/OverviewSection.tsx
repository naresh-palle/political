import React from "react";
import { AuditReport } from "../../types";
import { formatLakhs, formatPercentage } from "../../calculations";
import { Tooltip } from "../common/Tooltip";
import { ArrowUpRight, TrendingUp, Trophy } from "lucide-react";

interface OverviewSectionProps {
  audit: AuditReport;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ audit }) => {
  const { client, candidates, voterStats, digitalStats, headline, keyObservations } = audit;

  return (
    <section id="section-overview" data-testid="section-overview" className="py-14 lg:py-16 border-b border-[#E7E5DB]">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-6 bg-[#B45309]" aria-hidden />
            <div className="eyebrow text-[#B45309]">Executive summary</div>
          </div>
          <h2 className="font-display text-[44px] sm:text-[54px] leading-[1.02] text-[#112233] tracking-[-0.02em]">
            Constituency at a glance
          </h2>
          <p className="text-sm text-[#5A5E6B] max-w-lg leading-relaxed">
            A high-level view of the client's competitive and digital position across {audit.assembly.name} AC.
          </p>
        </div>
        <div className="eyebrow text-[#8A8E9B] tabular">Updated {audit.generatedAt}</div>
      </div>

      {/* Editorial KPI strip — no floating cards, just vertical rules */}
      <div className="mb-14 border-y border-[#DDDBD1]">
        <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[#E5E3D8]">
          {/* KPI 1 */}
          <div className="px-2 sm:px-6 py-6">
            <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-[#797D8B] mb-1">
              <span>Client Social Strength</span>
              <Tooltip content="Composite social score out of 100 based on verified footprint, reach, and active engagement." />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-editorial text-3xl sm:text-4xl font-semibold text-[#112233]">
                {client.socialStrengthScore}
              </span>
              <span className="text-xs text-[#8A8E9B] font-mono-data">/ 100</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +11 pts vs 2nd
            </div>
          </div>

          {/* KPI 2 */}
          <div className="px-2 sm:px-6 py-6">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B] mb-1">
              Position
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-editorial text-3xl sm:text-4xl font-semibold text-[#112233]">
                1st
              </span>
              <span className="text-xs text-[#8A8E9B] font-mono-data">/ {candidates.length}</span>
            </div>
            <div className="text-[11px] text-[#555966] font-medium mt-1 flex items-center">
              <Trophy className="w-3 h-3 mr-1 text-amber-600" />
              Category Leader
            </div>
          </div>

          {/* KPI 3 */}
          <div className="px-2 sm:px-6 py-6">
            <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-[#797D8B] mb-1">
              <span>Est. Voter Coverage</span>
              <Tooltip content="Estimated unique client reach (98K) as a proportion of total registered voters (2.85L)." />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-editorial text-3xl sm:text-4xl font-semibold text-[#112233]">
                {formatPercentage(voterStats.voterCoveragePercentage)}
              </span>
            </div>
            <div className="text-[11px] text-[#696D7A] mt-1 font-mono-data">
              {formatLakhs(voterStats.estimatedUniqueClientReach)} of {formatLakhs(voterStats.totalVoters, true)} voters
            </div>
          </div>

          {/* KPI 4 */}
          <div className="px-2 sm:px-6 py-6">
            <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-[#797D8B] mb-1">
              <span>Est. Digital Coverage</span>
              <Tooltip content="Proportion of the constituency's estimated digital audience reached by client channels." />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-editorial text-3xl sm:text-4xl font-semibold text-[#112233]">
                {formatPercentage(digitalStats.clientDigitalCoveragePercentage)}
              </span>
            </div>
            <div className="text-[11px] text-[#696D7A] mt-1 font-mono-data">
              of {formatLakhs(digitalStats.totalDigitalAudience, true)} digital users
            </div>
          </div>

          {/* KPI 5 */}
          <div className="px-2 sm:px-6 py-6 col-span-2 md:col-span-1">
            <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-[#797D8B] mb-1">
              <span>Reach Gap</span>
              <Tooltip content="Number of registered constituency voters not currently reached by digital communication." />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-editorial text-3xl sm:text-4xl font-semibold text-[#B45309]">
                {formatLakhs(voterStats.voterReachGap, true)}
              </span>
            </div>
            <div className="text-[11px] text-[#B45309] font-medium mt-1">
              Untapped Electorate
            </div>
          </div>
        </div>
      </div>

      {/* Primary Intelligence Panel (2-Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Narrative Headline & Observations */}
        <div className="lg:col-span-7 space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#7C808D]">
            The Core Finding
          </div>
          <h3 className="font-editorial text-2xl sm:text-3xl text-[#112233] leading-snug font-normal">
            "{headline}"
          </h3>

          <div className="space-y-3 pt-2">
            {keyObservations.map((obs, idx) => (
              <div key={idx} className="flex items-start space-x-3 text-sm text-[#414552] leading-relaxed">
                <span className="font-mono-data text-xs font-bold text-[#112233] mt-0.5 px-1.5 py-0.5 bg-[#EFEFE8] rounded">
                  0{idx + 1}
                </span>
                <span>{obs}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Comparative Horizontal Social Strength Bars */}
        <div className="lg:col-span-5 bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B]">
                Competitive Score
              </span>
              <h4 className="text-sm font-semibold text-[#112233]">
                Client Social Strength
              </h4>
            </div>
            <span className="text-xs font-mono-data text-[#6A6E7B]">Index 0-100</span>
          </div>

          <div className="space-y-4">
            {candidates.map((cand) => {
              const isClient = cand.isClient;
              return (
                <div key={cand.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isClient ? "bg-[#0F766E]" : "bg-[#9498A3]"
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          isClient ? "text-[#112233] font-bold" : "text-[#555966]"
                        }`}
                      >
                        {cand.name}
                      </span>
                      <span className="text-[11px] text-[#868A96]">
                        ({cand.partyAbbr})
                      </span>
                      {isClient && (
                        <span className="px-1.5 py-0.2 bg-[#E0F2FE] text-[#0369A1] text-[9px] font-bold rounded uppercase">
                          Client
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-mono-data font-semibold ${
                        isClient ? "text-base text-[#112233]" : "text-sm text-[#6C707D]"
                      }`}
                    >
                      {cand.socialStrengthScore}
                    </span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-3.5 bg-[#F2F1EA] rounded-sm overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-xs transition-all duration-700 ${
                        isClient
                          ? "bg-[#112233] shadow-xs"
                          : "bg-[#B0B4C0]"
                      }`}
                      style={{ width: `${cand.socialStrengthScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-[#7A7E8C] pt-2 border-t border-[#ECEAE2] flex justify-between">
            <span>Score combines platform footprint, verified status, reach & engagement.</span>
          </div>
        </div>
      </div>
    </section>
  );
};
