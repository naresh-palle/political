import React from "react";
import { ScorecardDimension } from "../../types";
import { Award, ShieldCheck, CheckCircle2 } from "lucide-react";

interface ScorecardSectionProps {
  scorecard: ScorecardDimension[];
  overallScore: number;
}

export const ScorecardSection: React.FC<ScorecardSectionProps> = ({
  scorecard,
  overallScore
}) => {
  // SVG Arc Calculation for elegant restrained gauge
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * (circumference * 0.75);

  return (
    <section id="section-scorecard" className="py-10 border-b border-[#E7E5DB]">
      <div className="space-y-2 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7C808D]">
          Composite Index
        </div>
        <h2 className="font-editorial text-3xl sm:text-4xl text-[#112233] font-normal">
          Strength Scorecard
        </h2>
        <p className="text-sm text-[#666A78]">
          Multi-dimensional index weighted across presence, engagement depth, verified footprint, and competitive dominance.
        </p>
      </div>

      <div className="bg-white border border-[#E0DED5] rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Restrained Arc / Radial Score Display */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#797D8A] mb-3">
              Overall Strength Rating
            </span>

            {/* Restrained Elegant Arc */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-135" viewBox="0 0 200 200">
                {/* Background Arc */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  stroke="#E2E0D5"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
                  strokeLinecap="round"
                />
                {/* Score Arc */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  stroke="#112233"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-editorial text-5xl font-bold text-[#112233]">
                  {overallScore}
                </span>
                <span className="text-xs font-mono-data text-[#787B88] mt-0.5">
                  out of 100
                </span>
              </div>
            </div>

            <div className="mt-4 inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-700" />
              Category Leader Profile
            </div>
          </div>

          {/* Right: 5 Dimensional Metric Rows */}
          <div className="lg:col-span-8 space-y-4">
            {scorecard.map((dim) => (
              <div key={dim.id} className="space-y-1.5 border-b border-[#F0EFEB] pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="font-semibold text-[#112233]">
                      {dim.name}
                    </span>
                    <span className="hidden sm:inline text-xs text-[#7A7E8C] ml-2">
                      — {dim.description}
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-[11px] text-[#868A98]">
                      Bench: {dim.benchmark}
                    </span>
                    <span className="font-mono-data font-bold text-base text-[#112233]">
                      {dim.score}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-[#F2F1EA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#112233] rounded-full transition-all duration-700"
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
