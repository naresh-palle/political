import React from "react";
import { IssueItem } from "../../types";
import { ActivityBadge } from "../common/Badge";
import { InsightCard } from "./InsightCards";
import { Hash, Sparkles } from "lucide-react";

interface IssueIntelligenceSectionProps {
  issues: IssueItem[];
}

export const IssueIntelligenceSection: React.FC<IssueIntelligenceSectionProps> = ({ issues }) => {
  return (
    <section id="section-issues" className="py-10 border-b border-[#E7E5DB]">
      <div className="space-y-2 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7C808D]">
          Narrative Association
        </div>
        <h2 className="font-editorial text-3xl sm:text-4xl text-[#112233] font-normal">
          What is the candidate associated with?
        </h2>
        <p className="text-sm text-[#666A78]">
          Constituency agenda prioritization ranked by tracked mentions, constituent resonance, and candidate ownership.
        </p>
      </div>

      <div className="bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3 text-xs text-[#787C8A]">
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Ranked Issue Landscape
          </span>
          <span className="flex items-center text-[11px] font-medium text-[#112233]">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-[#0F766E]" />
            NLP Narrative Extraction
          </span>
        </div>

        <div className="space-y-5">
          {issues.map((issue) => (
            <div key={issue.id} className="space-y-2 border-b border-[#F4F3ED] pb-4 last:border-0 last:pb-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <span className="font-mono-data text-xs font-bold px-2 py-0.5 bg-[#F2F1EA] text-[#112233] rounded">
                    0{issue.rank}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#112233]">
                      {issue.name}
                    </h3>
                    <span className="text-[11px] text-[#7A7E8B]">
                      {issue.category} · {issue.mentionsCount.toLocaleString()} mentions
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs">
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-[#8E929E] block">Candidate Ownership</span>
                    <span className="font-mono-data font-semibold text-[#112233]">
                      {issue.relativeStrength}/100
                    </span>
                  </div>
                  <ActivityBadge level={issue.contentActivity} />
                </div>
              </div>

              {/* Horizontal Intensity Visualization */}
              <div className="w-full h-2.5 bg-[#F2F1EA] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#112233] to-[#0F766E] rounded-full transition-all duration-500"
                  style={{ width: `${issue.relativeStrength}%` }}
                />
              </div>

              {/* Hashtags & Sentiment */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {issue.topHashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-[10px] text-[#5C606E] bg-[#FAF9F5] px-2 py-0.5 rounded border border-[#E7E5DB]"
                  >
                    <Hash className="w-2.5 h-2.5 mr-0.5 text-[#9A9EA9]" />
                    {tag.replace("#", "")}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <InsightCard
        title="WHAT THIS MEANS"
        insight="'Water Supply & Irrigation' represents the client's highest narrative ownership (88/100). Conversely, 'Industrial Employment & SEZ' shows opposition encroachment, requiring targeted policy communication to neutralize challenger claims."
      />
    </section>
  );
};
