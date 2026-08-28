import React from "react";
import { AuditReport, PlatformAudienceDetail } from "../../types";
import { formatLakhs, formatPercentage } from "../../calculations";
import { Tooltip } from "../common/Tooltip";
import { Layers, Smartphone } from "lucide-react";
import { InsightCard } from "./InsightCards";

interface DigitalAudienceSectionProps {
  audit: AuditReport;
}

export const DigitalAudienceSection: React.FC<DigitalAudienceSectionProps> = ({ audit }) => {
  const { voterStats, digitalStats, platformBreakdown } = audit;

  return (
    <section id="section-digital-audience" className="py-10 border-b border-[#E7E5DB]">
      <div className="space-y-2 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7C808D]">
          Audience Universe
        </div>
        <h2 className="font-editorial text-3xl sm:text-4xl text-[#112233] font-normal">
          The digital constituency
        </h2>
        <p className="text-sm text-[#666A78]">
          How much of the constituency's available digital audience is currently captured by the client.
        </p>
      </div>

      {/* Layered Universe Breakdown */}
      <div className="bg-white border border-[#E0DED5] rounded-xl p-6 sm:p-8 shadow-xs space-y-8 mb-10">
        <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#112233]" />
            <h3 className="text-sm font-semibold text-[#112233]">
              Constituency Scale Hierarchy
            </h3>
          </div>
          <span className="text-xs text-[#7B7E8C]">Deduplicated Models</span>
        </div>

        {/* 3 Layered Visual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Layer 1 */}
          <div className="bg-[#FAF9F5] border border-[#E2E0D6] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B]">
                Total Registered Voters
              </span>
              <span className="text-xs font-mono-data text-[#888C98]">Base Electorate</span>
            </div>
            <div className="font-editorial text-3xl sm:text-4xl font-bold text-[#112233]">
              {formatLakhs(voterStats.totalVoters, true)}
            </div>
            <p className="text-xs text-[#636674] leading-relaxed">
              Official physical electorate size in {audit.assembly.name} AC (ECI roll).
            </p>
          </div>

          {/* Layer 2 */}
          <div className="bg-[#F6F7F9] border border-[#D9DEE7] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">
                Estimated Digital Audience
              </span>
              <Tooltip content="Estimated count of unique active internet and smartphone users within assembly boundary." />
            </div>
            <div className="font-editorial text-3xl sm:text-4xl font-bold text-[#1E293B]">
              {formatLakhs(digitalStats.totalDigitalAudience, true)}
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              ~73.7% digital connectivity rate among constituency residents.
            </p>
          </div>

          {/* Layer 3 */}
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#15803D]">
                Client Estimated Reach
              </span>
              <Tooltip content="Deduplicated client reach across all 4 verified social handles." />
            </div>
            <div className="font-editorial text-3xl sm:text-4xl font-bold text-[#0F766E]">
              {formatLakhs(voterStats.estimatedUniqueClientReach, true)}
            </div>
            <p className="text-xs text-[#166534] leading-relaxed">
              46.7% of available digital audience / 34.4% of total electorate.
            </p>
          </div>
        </div>
      </div>

      {/* Platform-by-Platform Comparison Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#112233]">
            Estimated Platform Audience Breakdown
          </h3>
          <span className="text-xs text-[#8A8E9B] italic">
            * Audiences not unique across channels
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {platformBreakdown.map((item) => (
            <div
              key={item.platform}
              className="bg-white border border-[#E0DED5] rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
                  <span className="font-semibold text-sm text-[#112233]">
                    {item.displayName}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-[#F2F1EA] text-[#555866] rounded">
                    {formatPercentage(item.coveragePercentage, 0)} Share
                  </span>
                </div>

                <div className="space-y-3 pt-3">
                  <div>
                    <span className="text-[10px] uppercase text-[#888C9A] font-bold block">
                      Estimated Audience
                    </span>
                    <span className="font-mono-data text-2xl font-bold text-[#112233]">
                      {formatLakhs(item.estimatedAudience, true)}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs pt-1 border-t border-[#F3F2EB]">
                    <span className="text-[#6D717E]">Client Reach:</span>
                    <span className="font-mono-data font-semibold text-[#0F766E]">
                      {formatLakhs(item.clientReach)}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-[#6D717E]">Addressable Gap:</span>
                    <span className="font-mono-data font-semibold text-[#B45309]">
                      {formatLakhs(item.reachGap)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="pt-2">
                <div className="w-full h-2 bg-[#F2F1EA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#112233] rounded-full"
                    style={{ width: `${item.coveragePercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#868A98] pt-1">
                  <span>Captured</span>
                  <span>{formatPercentage(item.coveragePercentage)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <InsightCard
        title="WHAT THIS MEANS"
        insight="Facebook provides the highest client market penetration (43.3% coverage, 52K reached), whereas YouTube presents the highest untapped volume (1.06L unreached audience despite 1.50L platform size in constituency)."
      />
    </section>
  );
};
