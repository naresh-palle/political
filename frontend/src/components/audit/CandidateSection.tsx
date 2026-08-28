import React from "react";
import { Candidate } from "../../types";
import { formatLakhs, formatPercentage } from "../../calculations";
import { CheckCircle2, ShieldCheck, Award } from "lucide-react";

interface CandidateSectionProps {
  candidates: Candidate[];
}

export const CandidateSection: React.FC<CandidateSectionProps> = ({ candidates }) => {
  return (
    <section id="section-candidates" className="py-10 border-b border-[#E7E5DB]">
      <div className="space-y-2 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7C808D]">
          Candidate Field Analysis
        </div>
        <h2 className="font-editorial text-3xl sm:text-4xl text-[#112233] font-normal">
          Who is in the race?
        </h2>
        <p className="text-sm text-[#666A78]">
          Comparative evaluation of nominated candidates across verified digital reach and campaign momentum.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {candidates.map((cand) => {
          const isClient = cand.isClient;

          return (
            <div
              key={cand.id}
              className={`rounded-xl transition-all relative flex flex-col justify-between ${
                isClient
                  ? "bg-white border-2 border-[#112233] shadow-md ring-1 ring-[#112233]/10"
                  : "bg-white/80 border border-[#E0DED5] shadow-2xs hover:border-[#CDCBC0]"
              }`}
            >
              {/* Header Badge */}
              {isClient && (
                <div className="bg-[#112233] text-[#FBFBF9] px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-t-lg flex items-center justify-between">
                  <span>Client Profile</span>
                  <span className="flex items-center">
                    <Award className="w-3 h-3 mr-1 text-amber-300" />
                    Rank #1
                  </span>
                </div>
              )}

              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                {/* Candidate Info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3.5">
                    <div className="relative">
                      <img
                        src={cand.avatarUrl}
                        alt={cand.name}
                        className={`w-13 h-13 rounded-full object-cover border-2 ${
                          isClient ? "border-[#112233]" : "border-[#D5D3C8]"
                        }`}
                      />
                      {cand.verifiedPlatformsCount > 0 && (
                        <div
                          className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5"
                          title="Verified Candidate Channel"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3
                        className={`font-editorial text-lg leading-tight ${
                          isClient ? "font-bold text-[#112233]" : "font-medium text-[#2E313B]"
                        }`}
                      >
                        {cand.name}
                      </h3>
                      <div className="text-xs text-[#5C606E] font-medium mt-0.5">
                        {cand.party}
                      </div>
                      <div className="text-[10px] text-[#868A98]">
                        {cand.role}
                      </div>
                    </div>
                  </div>

                  {/* Social Strength Highlight */}
                  <div
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      isClient ? "bg-[#F3F4EE] border border-[#E2E1D4]" : "bg-[#F9F8F4]"
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B]">
                        Social Strength
                      </span>
                      <div className="text-[11px] text-[#555866]">
                        {isClient ? "Leader" : `Rank #${cand.rank}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono-data text-2xl font-bold ${
                          isClient ? "text-[#112233]" : "text-[#555966]"
                        }`}
                      >
                        {cand.socialStrengthScore}
                      </span>
                      <span className="text-[10px] text-[#898D9A] ml-1">/100</span>
                    </div>
                  </div>
                </div>

                {/* Candidate Stats List */}
                <div className="space-y-2 pt-2 border-t border-[#ECEAE2] text-xs text-[#525663]">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#7A7E8C]">Combined Following:</span>
                    <span className="font-mono-data font-semibold text-[#112233]">
                      {formatLakhs(cand.combinedFollowing)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#7A7E8C]">Active Channels:</span>
                    <span className="font-mono-data font-medium text-[#2E313B]">
                      {cand.verifiedPlatformsCount}/{cand.totalPlatformsCount} Verified
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#7A7E8C]">Avg Engagement:</span>
                    <span className="font-mono-data font-medium text-[#2E313B]">
                      {formatPercentage(cand.avgEngagementRate)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#7A7E8C]">Est. Voter Reach:</span>
                    <span className="font-mono-data font-semibold text-[#112233]">
                      {formatLakhs(cand.estimatedReach)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer status */}
              <div
                className={`px-4 py-2 text-[10px] font-medium border-t flex items-center justify-between rounded-b-lg ${
                  isClient
                    ? "bg-[#FAF9F5] border-[#E8E6DC] text-[#0F766E]"
                    : "bg-[#FCFBF8] border-[#ECEAE2] text-[#848896]"
                }`}
              >
                <span>{isClient ? "Target Strategy Subject" : "Direct Competitor"}</span>
                <span>{cand.postingFrequencyMonthly} posts/mo</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
