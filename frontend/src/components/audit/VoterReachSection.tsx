import React from "react";
import { AuditReport } from "../../types";
import { formatLakhs, formatPercentage } from "../../calculations";
import { Tooltip } from "../common/Tooltip";
import { Users, AlertTriangle } from "lucide-react";
import { InsightCard } from "./InsightCards";

interface VoterReachSectionProps {
  audit: AuditReport;
}

export const VoterReachSection: React.FC<VoterReachSectionProps> = ({ audit }) => {
  const { voterStats } = audit;
  const reachedPercent = voterStats.voterCoveragePercentage;
  const gapPercent = 100 - reachedPercent;

  return (
    <section id="section-voters" className="py-10 border-b border-[#E7E5DB]">
      <div className="space-y-2 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7C808D]">
          Electorate Penetration
        </div>
        <h2 className="font-editorial text-3xl sm:text-4xl text-[#112233] font-normal">
          How much of the electorate can we currently reach?
        </h2>
        <p className="text-sm text-[#666A78]">
          Relationship between the total registered assembly electorate and the client's estimated digital touchpoints.
        </p>
      </div>

      {/* Main Population Reach Story Card */}
      <div className="bg-white border border-[#E0DED5] rounded-xl p-6 sm:p-8 shadow-xs space-y-8">
        {/* Top Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-b border-[#ECEAE2] pb-6">
          <div>
            <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-[#7E8290] mb-1">
              <span>Total Registered Electorate</span>
              <Tooltip content="Official registered voter count from ECI final electoral rolls for Kadapa AC." />
            </div>
            <div className="font-editorial text-4xl sm:text-5xl font-bold text-[#112233]">
              {formatLakhs(voterStats.totalVoters, true)}
            </div>
            <div className="text-xs text-[#7B7F8D] mt-1">100% of voting base</div>
          </div>

          <div className="sm:border-l sm:border-[#ECEAE2] sm:pl-6">
            <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-[#7E8290] mb-1">
              <span>Estimated Client Reach</span>
              <Tooltip content="Digital reach is an estimated audience metric and should not be interpreted as identified or unique voters." />
            </div>
            <div className="font-editorial text-4xl sm:text-5xl font-bold text-[#0F766E]">
              {formatLakhs(voterStats.estimatedUniqueClientReach, true)}
            </div>
            <div className="text-xs text-[#0F766E] font-medium mt-1">
              {formatPercentage(voterStats.voterCoveragePercentage)} estimated voter coverage
            </div>
          </div>

          <div className="sm:border-l sm:border-[#ECEAE2] sm:pl-6">
            <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-[#7E8290] mb-1">
              <span>Estimated Reach Gap</span>
              <Tooltip content="Constituency voters not currently accessible through the candidate's existing digital distribution channels." />
            </div>
            <div className="font-editorial text-4xl sm:text-5xl font-bold text-[#B45309]">
              {formatLakhs(voterStats.voterReachGap, true)}
            </div>
            <div className="text-xs text-[#B45309] font-medium mt-1">
              {formatPercentage(gapPercent)} unreached electorate
            </div>
          </div>
        </div>

        {/* Segmented Horizontal Population Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-semibold text-[#484C59]">
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded bg-[#0F766E] mr-1.5" />
              Estimated Client Reach ({formatPercentage(reachedPercent)})
            </span>
            <span className="flex items-center text-[#B45309]">
              <span className="w-2.5 h-2.5 rounded bg-[#D97706] mr-1.5" />
              Remaining Gap ({formatPercentage(gapPercent)})
            </span>
          </div>

          {/* Segmented Bar Visual */}
          <div className="w-full h-8 bg-[#F3F2EB] rounded-lg overflow-hidden flex p-1 border border-[#DCDAD0]">
            <div
              className="h-full bg-[#0F766E] rounded-l flex items-center justify-center text-white text-[11px] font-bold font-mono-data transition-all duration-700"
              style={{ width: `${reachedPercent}%` }}
              title={`Client Reach: ${formatLakhs(voterStats.estimatedUniqueClientReach, true)}`}
            >
              {reachedPercent > 15 && `${formatLakhs(voterStats.estimatedUniqueClientReach, true)} (34.4%)`}
            </div>
            <div
              className="h-full bg-gradient-to-r from-[#D97706] to-[#F59E0B] rounded-r flex items-center justify-center text-white text-[11px] font-bold font-mono-data transition-all duration-700"
              style={{ width: `${gapPercent}%` }}
              title={`Remaining Gap: ${formatLakhs(voterStats.voterReachGap, true)}`}
            >
              {formatLakhs(voterStats.voterReachGap, true)} Gap (65.6%)
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-[#7A7E8C] font-mono-data pt-1">
            <span>0</span>
            <span>Total Electorate: {formatLakhs(voterStats.totalVoters, true)} Registered Voters</span>
          </div>
        </div>

        {/* Rigorous Precision Disclaimer Alert */}
        <div className="bg-[#FAF9F4] border border-[#E7E5DA] rounded-lg p-3.5 flex items-start space-x-3 text-xs text-[#525663]">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-[#112233]">Methodology Note: </span>
            Digital reach is an estimated audience model based on platform user signals and deduplicated follower clusters. It must not be interpreted as individually identified or registered physical voters.
          </div>
        </div>
      </div>

      <InsightCard
        title="WHAT THIS MEANS"
        insight="While the client leads all opponents in digital reach, 65.6% (1.87L voters) of the constituency electorate remains outside direct digital communication channels, necessitating offline-to-online WhatsApp volunteer relays."
        metricHighlight="1.87 Lakh voters require hybrid grassroots broadcast strategy"
      />
    </section>
  );
};
