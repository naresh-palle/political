import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface AuditLoadingExperienceProps {
  assemblyName?: string;
  onComplete: () => void;
}

const STEPS = [
  { id: 1, label: "Loading constituency boundaries & electoral roll data" },
  { id: 2, label: "Identifying nominated candidates and filings" },
  { id: 3, label: "Loading verified social graph profiles (Meta, Google, X)" },
  { id: 4, label: "Calculating competitive social strength & engagement indices" },
  { id: 5, label: "Estimating geo-fenced digital audience universe" },
  { id: 6, label: "Calculating multi-channel reach gaps & electorate deficit" },
  { id: 7, label: "Synthesizing strategic recommendations & scorecard" }
];

export const AuditLoadingExperience: React.FC<AuditLoadingExperienceProps> = ({
  assemblyName = "Kadapa",
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 400);
          return prev;
        }
      });
    }, 380);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="max-w-2xl mx-auto py-20 px-4 sm:px-6">
      <div className="bg-white border border-[#E0DED5] rounded-xl shadow-sm p-8 sm:p-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#F4F3ED] border border-[#DDDCD3] rounded-full text-xs font-semibold uppercase tracking-widest text-[#5E626E]">
            <Sparkles className="w-3.5 h-3.5 text-[#112233]" />
            <span>Intelligence Pipeline</span>
          </div>

          <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-[#112233]">
            Building Constituency Audit
          </h2>

          <p className="text-sm text-[#747885]">
            Synthesizing multi-source intelligence for{" "}
            <span className="font-medium text-[#112233]">{assemblyName} Assembly Constituency</span>
          </p>
        </div>

        {/* Progressive Step List */}
        <div className="space-y-3 pt-4 border-t border-[#ECEAE2]">
          {STEPS.map((step, idx) => {
            const isFinished = currentStep > idx;
            const isCurrent = currentStep === idx;

            return (
              <div
                key={step.id}
                className={`flex items-center space-x-3 text-sm transition-all duration-300 py-1.5 px-3 rounded ${
                  isFinished
                    ? "text-[#1C2028] bg-[#F7FBF8]"
                    : isCurrent
                    ? "text-[#112233] font-medium bg-[#FAF9F5] scale-[1.01]"
                    : "text-[#9DA1AE] opacity-50"
                }`}
              >
                {isFinished ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-[#112233] animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#D5D4CB] flex-shrink-0" />
                )}

                <span className="text-xs sm:text-sm font-sans">{step.label}</span>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center text-xs text-[#8E929E] font-mono-data">
          {currentStep >= STEPS.length
            ? "✓ Intelligence compilation complete"
            : `Processing stage ${Math.min(currentStep + 1, STEPS.length)} of ${STEPS.length}...`}
        </div>
      </div>
    </div>
  );
};
