import React from "react";
import { RecommendationItem } from "../../types";
import { Compass, CheckCircle, Target, Zap } from "lucide-react";

interface RecommendationsSectionProps {
  recommendations: RecommendationItem[];
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  recommendations
}) => {
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]";
      case "High":
        return "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]";
      default:
        return "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]";
    }
  };

  return (
    <section id="section-recommendations" className="py-10 border-b border-[#E7E5DB]">
      <div className="space-y-2 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7C808D]">
          Strategic Directives
        </div>
        <h2 className="font-editorial text-3xl sm:text-4xl text-[#112233] font-normal">
          Strategic recommendations
        </h2>
        <p className="text-sm text-[#666A78]">
          Actionable campaign maneuvers derived strictly from empirical constituency metrics and competitive deficits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-[#CDC9BC] transition-all"
          >
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono-data text-xs font-bold px-2 py-0.5 bg-[#112233] text-[#FBFBF9] rounded">
                  {rec.num}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityStyle(
                    rec.priority
                  )}`}
                >
                  {rec.priority} Priority
                </span>
              </div>

              <h3 className="font-editorial text-xl font-medium text-[#112233] leading-snug">
                {rec.title}
              </h3>
            </div>

            {/* Tripartite Breakdown: Observation -> Implication -> Opportunity */}
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B] block">
                  Observation
                </span>
                <p className="text-[#3B3E4B] leading-relaxed">
                  {rec.observation}
                </p>
              </div>

              <div className="space-y-1 border-t border-[#F2F1EA] pt-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B] block">
                  Implication
                </span>
                <p className="text-[#3B3E4B] leading-relaxed">
                  {rec.implication}
                </p>
              </div>

              <div className="bg-[#FAF9F4] border border-[#E6E4DA] rounded-lg p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] flex items-center">
                  <Target className="w-3 h-3 mr-1 text-[#0F766E]" />
                  Opportunity
                </span>
                <p className="text-[#1A1D24] font-medium leading-relaxed">
                  {rec.opportunity}
                </p>
              </div>
            </div>

            {/* Expected Impact Footer */}
            <div className="pt-3 border-t border-[#ECEAE2] flex items-center justify-between text-[11px] text-[#5A5E6B]">
              <span className="flex items-center text-[#0F766E] font-medium">
                <Zap className="w-3.5 h-3.5 mr-1" />
                {rec.expectedImpact}
              </span>
              <span className="text-[#888C98] uppercase text-[10px] font-semibold">
                {rec.category} Pillar
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
