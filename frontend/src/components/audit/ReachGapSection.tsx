import React from "react";
import { AuditReport } from "../../types";
import { formatLakhs, formatPercentage } from "../../calculations";
import { ArrowDown, Flame, Target } from "lucide-react";
import { InsightCard } from "./InsightCards";

interface ReachGapSectionProps {
  audit: AuditReport;
}

export const ReachGapSection: React.FC<ReachGapSectionProps> = ({ audit }) => {
  const { voterStats, digitalStats, platformBreakdown } = audit;
  const sortedGaps = [...platformBreakdown].sort((a, b) => b.reachGap - a.reachGap);
  const maxGap = sortedGaps[0]?.reachGap || 106000;

  return (
    <section id="section-reach-gap" className="py-10 border-b border-[#E7E5DB]">
      <div className="space-y-2 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#B45309] font-bold">
          Primary Opportunity Matrix
        </div>
        <h2 className="font-editorial text-3xl sm:text-4xl text-[#112233] font-normal">
          Where is the opportunity?
        </h2>
        <p className="text-sm text-[#666A78]">
          Funnel analysis isolating actionable electorate deficits across channels for targeted campaign allocation.
        </p>
      </div>

      {/* Hero Funnel Grid */}
      <div className="bg-white border border-[#E0DED5] rounded-xl p-6 sm:p-8 shadow-xs mb-10">
        <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-4 mb-8">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-[#112233]" />
            <h3 className="text-sm font-semibold text-[#112233]">
              Constituency Conversion Funnel
            </h3>
          </div>
          <span className="text-xs text-[#7B7E8C]">Macro Conversion Ratios</span>
        </div>

        {/* Funnel Stages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {/* Stage 1 */}
          <div className="bg-[#FAF9F5] border border-[#E2E0D6] rounded-lg p-4 text-center space-y-1 relative">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B]">
              Stage 1 · Total Voters
            </span>
            <div className="font-editorial text-3xl sm:text-4xl font-bold text-[#112233]">
              {formatLakhs(voterStats.totalVoters, true)}
            </div>
            <span className="text-[11px] text-[#787B88] block">Registered Electorate</span>
          </div>

          {/* Stage 2 */}
          <div className="bg-[#F5F6F8] border border-[#D8DCE5] rounded-lg p-4 text-center space-y-1 relative">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">
              Stage 2 · Digital Audience
            </span>
            <div className="font-editorial text-3xl sm:text-4xl font-bold text-[#1E293B]">
              {formatLakhs(digitalStats.totalDigitalAudience, true)}
            </div>
            <span className="text-[11px] text-[#64748B] block">
              73.7% Digital Universe
            </span>
          </div>

          {/* Stage 3 */}
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-4 text-center space-y-1 relative">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#15803D]">
              Stage 3 · Client Reach
            </span>
            <div className="font-editorial text-3xl sm:text-4xl font-bold text-[#0F766E]">
              {formatLakhs(voterStats.estimatedUniqueClientReach, true)}
            </div>
            <span className="text-[11px] text-[#166534] block">
              34.4% Voter Coverage
            </span>
          </div>

          {/* Stage 4: Hero Gap */}
          <div className="bg-[#FFFBEB] border-2 border-[#F59E0B] rounded-lg p-4 text-center space-y-1 relative shadow-xs">
            <div className="flex items-center justify-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-[#B45309]">
              <Flame className="w-3 h-3 text-amber-600" />
              <span>Stage 4 · Reach Gap</span>
            </div>
            <div className="font-editorial text-3xl sm:text-4xl font-bold text-[#B45309]">
              {formatLakhs(voterStats.voterReachGap, true)}
            </div>
            <span className="text-[11px] text-[#B45309] font-medium block">
              Direct Opportunity Deficit
            </span>
          </div>
        </div>
      </div>

      {/* Platform Reach Gap Bars */}
      <div className="bg-white border border-[#E0DED5] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-[#112233]">
              Addressable Gap by Platform
            </h3>
            <span className="text-xs text-[#7B7F8E]">
              Ranked by uncaptured constituent audience scale
            </span>
          </div>
          <span className="text-xs font-mono-data text-[#888C98]">Unreached Audience Count</span>
        </div>

        <div className="space-y-6">
          {sortedGaps.map((item, idx) => {
            const isHero = idx === 0;
            const barWidth = Math.round((item.reachGap / maxGap) * 100);

            return (
              <div key={item.platform} className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono-data text-xs font-bold px-1.5 py-0.5 bg-[#F2F1EA] text-[#112233] rounded">
                      0{idx + 1}
                    </span>
                    <span className={`font-semibold ${isHero ? "text-[#112233] text-base" : "text-[#3D404C]"}`}>
                      {item.displayName}
                    </span>
                    {isHero && (
                      <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] font-bold rounded-full uppercase flex items-center">
                        <Flame className="w-2.5 h-2.5 mr-1" />
                        Largest Gap
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline space-x-1.5 font-mono-data">
                    <span className={`font-bold ${isHero ? "text-lg text-[#B45309]" : "text-sm text-[#4E515E]"}`}>
                      {formatLakhs(item.reachGap, true)}
                    </span>
                    <span className="text-xs text-[#878B98]">gap</span>
                  </div>
                </div>

                {/* Horizontal Bar */}
                <div className="w-full h-5 bg-[#F4F3ED] rounded overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-xs transition-all duration-700 ${
                      isHero
                        ? "bg-gradient-to-r from-[#B45309] to-[#D97706] shadow-2xs"
                        : "bg-[#7A8090]"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-[#7A7E8C]">
                  <span>Audience {formatLakhs(item.estimatedAudience, true)} · Reached {formatLakhs(item.clientReach)}</span>
                  <span>{formatPercentage(item.coveragePercentage)} Captured</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <InsightCard
        title="WHAT THIS MEANS"
        insight="The single largest strategic opportunity resides on YouTube, where an estimated 1.06L constituency audience remains unreached by the client. Closing this gap represents a 2.4x expansion over current video subscriber reach."
        metricHighlight="1.06 Lakh potential voters accessible via YouTube hyper-local content"
      />
    </section>
  );
};
