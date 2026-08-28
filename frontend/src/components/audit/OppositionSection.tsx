import React, { useState } from "react";
import { Candidate } from "../../types";
import { formatLakhs, formatPercentage } from "../../calculations";
import { CheckCircle2, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { InsightCard } from "./InsightCards";

interface OppositionSectionProps {
  candidates: Candidate[];
}

export const OppositionSection: React.FC<OppositionSectionProps> = ({ candidates }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section id="section-opposition" className="py-10 border-b border-[#E7E5DB]">
      <div className="space-y-2 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7C808D]">
          Benchmarking
        </div>
        <h2 className="font-editorial text-3xl sm:text-4xl text-[#112233] font-normal">
          Competitive position
        </h2>
        <p className="text-sm text-[#666A78]">
          How the client compares with other candidates across verified reach, volume, and narrative resonance.
        </p>
      </div>

      {/* Primary Comparative Visual Card */}
      <div className="bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs mb-8">
        <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3 mb-6">
          <h3 className="text-sm font-semibold text-[#112233]">
            Social Strength Index Differential
          </h3>
          <span className="text-xs text-[#787B88] font-mono-data">Target Baseline: 100</span>
        </div>

        <div className="space-y-5">
          {candidates.map((cand) => {
            const isClient = cand.isClient;
            return (
              <div key={cand.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`font-semibold ${
                        isClient ? "text-[#112233] text-base" : "text-[#454854]"
                      }`}
                    >
                      {cand.name}
                    </span>
                    <span className="text-xs text-[#7B7E8C]">({cand.partyAbbr})</span>
                    {isClient && (
                      <span className="px-2 py-0.5 bg-[#112233] text-white text-[9px] font-bold rounded uppercase">
                        Client
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline space-x-1 font-mono-data font-bold">
                    <span className={isClient ? "text-lg text-[#112233]" : "text-sm text-[#626573]"}>
                      {cand.socialStrengthScore}
                    </span>
                    <span className="text-xs text-[#8F93A0]">/ 100</span>
                  </div>
                </div>

                <div className="w-full h-4 bg-[#F2F1EA] rounded overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-xs transition-all duration-700 ${
                      isClient ? "bg-[#112233]" : "bg-[#A7ABB8]"
                    }`}
                    style={{ width: `${cand.socialStrengthScore}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact / Expandable Comparison Matrix */}
      <div className="bg-white border border-[#E0DED5] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-[#FAF9F5] border-b border-[#ECEAE2] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#112233]">
              Competitive Matrix
            </h3>
            <span className="text-xs text-[#787C8A]">Side-by-side metric comparison</span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center text-xs font-semibold text-[#112233] hover:text-[#091522] py-1 px-3 bg-white border border-[#D5D3C8] rounded-md transition-colors cursor-pointer"
          >
            <span>{isExpanded ? "Collapse Matrix" : "View Detailed Comparison →"}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 ml-1" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#ECEAE2] text-[10px] font-bold uppercase tracking-wider text-[#707482]">
                <th className="py-3 px-4">Metric</th>
                {candidates.map((c) => (
                  <th
                    key={c.id}
                    className={`py-3 px-4 ${
                      c.isClient ? "bg-[#F5F4ED] text-[#112233] font-bold" : ""
                    }`}
                  >
                    {c.name} {c.isClient && "(Client)"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFE8]">
              <tr>
                <td className="py-3 px-4 font-medium text-[#505461]">Social Strength Score</td>
                {candidates.map((c) => (
                  <td
                    key={c.id}
                    className={`py-3 px-4 font-mono-data font-bold ${
                      c.isClient ? "bg-[#FAF9F4] text-base text-[#112233]" : "text-[#555866]"
                    }`}
                  >
                    {c.socialStrengthScore}/100
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-[#505461]">Combined Following</td>
                {candidates.map((c) => (
                  <td
                    key={c.id}
                    className={`py-3 px-4 font-mono-data font-semibold ${
                      c.isClient ? "bg-[#FAF9F4] text-[#112233]" : "text-[#555866]"
                    }`}
                  >
                    {formatLakhs(c.combinedFollowing)}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-[#505461]">Avg Engagement Rate</td>
                {candidates.map((c) => (
                  <td
                    key={c.id}
                    className={`py-3 px-4 font-mono-data ${
                      c.isClient ? "bg-[#FAF9F4] font-semibold text-[#0F766E]" : "text-[#555866]"
                    }`}
                  >
                    {formatPercentage(c.avgEngagementRate)}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-[#505461]">Estimated Voter Reach</td>
                {candidates.map((c) => (
                  <td
                    key={c.id}
                    className={`py-3 px-4 font-mono-data font-semibold ${
                      c.isClient ? "bg-[#FAF9F4] text-[#112233]" : "text-[#555866]"
                    }`}
                  >
                    {formatLakhs(c.estimatedReach)}
                  </td>
                ))}
              </tr>

              {isExpanded && (
                <>
                  <tr>
                    <td className="py-3 px-4 font-medium text-[#505461]">Platform Verification</td>
                    {candidates.map((c) => (
                      <td
                        key={c.id}
                        className={`py-3 px-4 ${c.isClient ? "bg-[#FAF9F4]" : ""}`}
                      >
                        {c.verifiedPlatformsCount} / {c.totalPlatformsCount} Channels
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-medium text-[#505461]">Posting Frequency</td>
                    {candidates.map((c) => (
                      <td
                        key={c.id}
                        className={`py-3 px-4 font-mono-data ${c.isClient ? "bg-[#FAF9F4]" : ""}`}
                      >
                        {c.postingFrequencyMonthly} posts/mo
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-medium text-[#505461]">Issue Coverage Score</td>
                    {candidates.map((c) => (
                      <td
                        key={c.id}
                        className={`py-3 px-4 font-mono-data ${c.isClient ? "bg-[#FAF9F4] font-bold" : ""}`}
                      >
                        {c.issueCoverageScore}%
                      </td>
                    ))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InsightCard
        title="WHAT THIS MEANS"
        insight="The client leads the nearest challenger (Candidate B) across all core metrics: +37K combined following, +0.9% engagement rate, and +34K higher estimated unique reach in the constituency."
      />
    </section>
  );
};
